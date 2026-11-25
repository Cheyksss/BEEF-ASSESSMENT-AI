"""
FastAPI endpoints for prediction pipeline and health check (Task 10.1, 10.2).
Handles image uploads, authentication verification, ML inference, and result storage.
"""

import io
import json
import logging
from time import perf_counter
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Header, HTTPException, status
from pydantic import BaseModel, Field
from PIL import Image
from starlette.responses import StreamingResponse

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
    freshness_inference_ms: Optional[float] = None
    marbling_inference_ms: Optional[float] = None
    fat_estimation_ms: Optional[float] = None
    background_removal_ms: Optional[float] = None


class HealthResponseSchema(BaseModel):
    status: str
    models_loaded: bool


async def _predict_beef_quality_events(
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
    yield {"type": "progress", "completed_stages": 0, "total_stages": 7, "stage": "Receiving image"}

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

    yield {"type": "progress", "completed_stages": 1, "total_stages": 7, "stage": "Image validated"}

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
        # Segment once before classification to validate foreground presence and reuse
        # the isolated meat mask for HSV visible-fat measurement.
        yield {"type": "progress", "completed_stages": 1, "total_stages": 7, "stage": "Removing background"}
        fat_segmentation_started = perf_counter()
        try:
            segmented = fat_estimator.segment(pil_image)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
        fat_segmentation_ms = (perf_counter() - fat_segmentation_started) * 1000
        yield {"type": "progress", "completed_stages": 2, "total_stages": 7, "stage": "Foreground ready"}

        device = model_manager.get_device()

        # 5. Classify the full photograph to match how both ReXNet-150 models were trained.
        tensor_224 = preprocessor.preprocess_for_classifier(pil_image, device=device)
        yield {"type": "progress", "completed_stages": 3, "total_stages": 7, "stage": "Image prepared for classifiers"}

        yield {"type": "progress", "completed_stages": 3, "total_stages": 7, "stage": "Running freshness classifier"}
        freshness_started = perf_counter()
        freshness_res = freshness_predictor.predict(
            model=model_manager.get_freshness_model(),
            tensor=tensor_224,
            device=device,
        )
        freshness_inference_ms = round((perf_counter() - freshness_started) * 1000, 2)
        yield {"type": "progress", "completed_stages": 4, "total_stages": 7, "stage": "Freshness classification complete"}

        yield {"type": "progress", "completed_stages": 4, "total_stages": 7, "stage": "Running marbling classifier"}
        marbling_started = perf_counter()
        marbling_res = marbling_predictor.predict(
            model=model_manager.get_marbling_model(),
            tensor=tensor_224,
            device=device,
        )
        marbling_inference_ms = round((perf_counter() - marbling_started) * 1000, 2)
        yield {"type": "progress", "completed_stages": 5, "total_stages": 7, "stage": "Marbling classification complete"}

        # 6. Estimate visible fat only inside the shared foreground mask.
        yield {"type": "progress", "completed_stages": 5, "total_stages": 7, "stage": "Calculating HSV fat ratio"}
        fat_started = perf_counter()
        fat_res = fat_estimator.estimate(pil_image, segmented=segmented)
        fat_estimation_ms = round(
            fat_segmentation_ms
            - segmented.background_removal_ms
            + (perf_counter() - fat_started) * 1000,
            2,
        )
        yield {"type": "progress", "completed_stages": 6, "total_stages": 7, "stage": "Fat ratio calculation complete"}

        # 7. Compute MQS
        mqs = calculate_mqs(
            freshness_score=freshness_res["score"],
            marbling_score=marbling_res["score"],
            fat_ratio=fat_res["percent"],
        )

        # 8. Storage & Database persistence
        yield {"type": "progress", "completed_stages": 6, "total_stages": 7, "stage": "Saving assessment"}
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
        yield {"type": "progress", "completed_stages": 7, "total_stages": 7, "stage": "Assessment complete"}

        # 9. Return structured response
        result = PredictionResponseSchema(
            freshness=freshness_res["label"],
            freshness_confidence=freshness_res["confidence"],
            marbling=marbling_res["label"],
            marbling_confidence=marbling_res["confidence"],
            fat_ratio_percent=fat_res["percent"],
            fat_ratio_category=fat_res["category"],
            meat_quality_score=mqs,
            assessment_id=assessment_id,
            image_url=image_url,
            freshness_inference_ms=freshness_inference_ms,
            marbling_inference_ms=marbling_inference_ms,
            fat_estimation_ms=fat_estimation_ms,
            background_removal_ms=segmented.background_removal_ms,
        )
        yield {"type": "result", "data": result.model_dump()}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference pipeline execution error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction pipeline failed: {str(e)}",
        )


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
    async for event in _predict_beef_quality_events(file, authorization):
        if event["type"] == "result":
            return PredictionResponseSchema(**event["data"])
    raise HTTPException(status_code=500, detail="Prediction pipeline ended without a result")


@router.post(
    "/predict/stream",
    status_code=status.HTTP_200_OK,
    summary="Assess beef quality and stream processing progress",
)
async def predict_beef_quality_stream(
    file: UploadFile = File(..., description="JPEG or PNG image file of beef cut"),
    authorization: Optional[str] = Header(None, description="Bearer <supabase_access_token>"),
):
    async def stream_events():
        try:
            async for event in _predict_beef_quality_events(file, authorization):
                if event["type"] == "result":
                    yield f"event: result\ndata: {json.dumps(event['data'])}\n\n"
                else:
                    yield f"event: progress\ndata: {json.dumps(event)}\n\n"
            yield "event: complete\ndata: {}\n\n"
        except HTTPException as e:
            yield (
                "event: error\ndata: "
                f"{json.dumps({'status': e.status_code, 'message': e.detail})}\n\n"
            )

    return StreamingResponse(
        stream_events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
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
