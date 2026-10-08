"""
FastAPI endpoints for prediction pipeline and health check (Task 10.1, 10.2).
Handles image uploads, authentication verification, ML inference, and result storage.
"""

import io
import logging
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Header, HTTPException, status
from pydantic import BaseModel, Field
from PIL import Image

from app.models.loader import model_manager
from app.preprocessing.image_processor import preprocessor
from app.inference.predictor import freshness_predictor, marbling_predictor
from app.cv.fat_estimator import fat_estimator
from app.scoring.mappers import calculate_mqs
from app.services.supabase_service import get_supabase_service
from app.services.local_db import local_db

logger = logging.getLogger(__name__)

router = APIRouter()

# Maximum allowed upload size: 10 MB (10 * 1024 * 1024 bytes)
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/jpg"}


class PredictionResponseSchema(BaseModel):
    freshness: str
    freshness_confidence: float = Field(..., ge=0.0, le=100.0)
    marbling: str
    marbling_confidence: float = Field(..., ge=0.0, le=100.0)
    fat_ratio_percent: float = Field(..., ge=0.0, le=100.0)
    fat_ratio_category: str
    meat_quality_score: float = Field(..., ge=0.0, le=100.0)
    assessment_id: str
    image_url: str


class HealthResponseSchema(BaseModel):
    status: str
    models_loaded: bool


@router.post(
    "/predict",
    response_model=PredictionResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Assess beef quality from uploaded image",
)
async def predict_beef_quality(
    file: UploadFile = File(..., description="JPEG or PNG image file of beef cut"),
    authorization: Optional[str] = Header(None, description="Bearer <supabase_access_token>"),
):
    """
    Main prediction pipeline endpoint:
    1. Validates Authorization header with Bearer token
    2. Verifies user authentication with Supabase
    3. Validates file format (JPEG, PNG) and file size (<= 10MB)
    4. Preprocesses image to 224x224 and reuses tensor for Freshness and Marbling CNN inference
    5. Resizes to 800x800 and runs HSV-based fat ratio estimation
    6. Calculates MQS with spoiled constraint
    7. Persists image to Supabase Storage and assessment record in PostgreSQL
    8. Returns complete assessment metrics JSON
    """
    # 1. Check authorization (optional for guest usage)
    user_id = None
    if authorization:
        if not authorization.startswith("Bearer "):
            logger.warning("Malformed authorization header provided")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid Authorization Bearer token",
            )
        token = authorization.split("Bearer ", 1)[1].strip()
        if token:
            supabase_service = get_supabase_service()
            try:
                user_id = await supabase_service.verify_token(token)
            except Exception as e:
                logger.warning(f"Token verification failed, continuing as guest: {str(e)}")
    else:
        supabase_service = get_supabase_service()

    # 3. Read image bytes and validate size
    try:
        image_bytes = await file.read()
    except Exception as e:
        logger.error(f"Failed to read uploaded file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to read uploaded file data",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of 10MB (got {len(image_bytes)} bytes)",
        )

    # 4. Validate image format & open PIL
    try:
        img_buffer = io.BytesIO(image_bytes)
        pil_image = Image.open(img_buffer)
        pil_image.verify()  # verify integrity
        # Re-open after verify() since verify() alters the stream position
        img_buffer.seek(0)
        pil_image = Image.open(img_buffer).convert("RGB")
    except Exception as e:
        logger.warning(f"Invalid image content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid JPEG or PNG image",
        )

    # Ensure models are loaded
    if not model_manager.is_loaded():
        logger.warning("Models not pre-loaded. Attempting loading...")
        try:
            model_manager.load_models()
        except Exception as e:
            logger.error(f"Failed to load ML models on demand: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="ML models not ready for inference",
            )

    try:
        device = model_manager.get_device()

        # 5. Preprocess for classifiers (224x224 tensor) and reuse for both
        tensor_224 = preprocessor.preprocess_for_classifier(pil_image, device=device)

        freshness_res = freshness_predictor.predict(
            model=model_manager.get_freshness_model(),
            tensor=tensor_224,
            device=device,
        )

        marbling_res = marbling_predictor.predict(
            model=model_manager.get_marbling_model(),
            tensor=tensor_224,
            device=device,
        )

        # 6. Fat ratio estimation (800x800)
        fat_res = fat_estimator.estimate(pil_image)

        # 7. Compute MQS
        mqs = calculate_mqs(
            freshness_score=freshness_res["score"],
            marbling_score=marbling_res["score"],
            fat_ratio=fat_res["percent"],
        )

        # 8. Storage & Database persistence
        image_url = await supabase_service.upload_image(
            user_id=user_id,
            image_bytes=image_bytes,
            content_type=file.content_type or "image/jpeg",
        )

        assessment_id = await supabase_service.store_assessment(
            user_id=user_id,
            image_url=image_url,
            freshness=freshness_res["label"],
            freshness_confidence=freshness_res["confidence"],
            marbling=marbling_res["label"],
            marbling_confidence=marbling_res["confidence"],
            fat_ratio=fat_res["percent"],
            fat_category=fat_res["category"],
            meat_quality_score=mqs,
        )

        # 9. Return structured response
        return PredictionResponseSchema(
            freshness=freshness_res["label"],
            freshness_confidence=freshness_res["confidence"],
            marbling=marbling_res["label"],
            marbling_confidence=marbling_res["confidence"],
            fat_ratio_percent=fat_res["percent"],
            fat_ratio_category=fat_res["category"],
            meat_quality_score=mqs,
            assessment_id=assessment_id,
            image_url=image_url,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference pipeline execution error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction pipeline failed: {str(e)}",
        )


@router.get(
    "/health",
    response_model=HealthResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
)
async def health_check():
    """
    Returns health status and whether ML models are loaded in memory.
    """
    return HealthResponseSchema(
        status="healthy",
        models_loaded=model_manager.is_loaded(),
    )


@router.get(
    "/assessments",
    status_code=status.HTTP_200_OK,
    summary="List all recorded beef quality assessments",
)
async def list_assessments():
    """Returns all past beef quality assessment records ordered by creation date."""
    return local_db.get_assessments()


@router.get(
    "/assessments/{assessment_id}",
    status_code=status.HTTP_200_OK,
    summary="Get single beef quality assessment by ID",
)
async def get_assessment(assessment_id: str):
    """Retrieves single assessment by ID."""
    record = local_db.get_assessment_by_id(assessment_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return record


@router.delete(
    "/assessments/{assessment_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete beef quality assessment by ID",
)
async def delete_assessment(assessment_id: str):
    """Deletes an assessment record by ID."""
    success = local_db.delete_assessment(assessment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    return {"status": "deleted", "id": assessment_id}
