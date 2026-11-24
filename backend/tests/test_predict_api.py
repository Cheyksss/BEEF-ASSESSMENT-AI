"""
API and Integration tests for /predict and /health endpoints (Tasks 10.3, 10.4, 11.2).
Validates schema completeness, authentication guards, input validation, and full pipeline execution.
"""

import io
import json
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from hypothesis import given, settings, strategies as st
from unittest.mock import patch, AsyncMock

from app.main import app
from app.routes.predict import PredictionResponseSchema
from app.models.loader import model_manager
from app.cv.fat_estimator import SegmentedForeground


@pytest.fixture(scope="module")
def client():
    """Test client for FastAPI app."""
    if not model_manager.is_loaded():
        model_manager.load_models()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_image_bytes():
    """Generates valid sample JPEG bytes."""
    img = Image.new("RGB", (300, 300), color=(180, 40, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.api
class TestHealthEndpoint:
    """Test suite for GET /health (Task 10.2)."""

    def test_health_check_returns_healthy(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "models_loaded" in data


@pytest.mark.api
class TestPredictEndpointValidation:
    """Validation and authentication tests for POST /predict (Task 10.1)."""

    def test_missing_auth_header_allows_guest_prediction(self, client, sample_image_bytes):
        with patch("app.cv.fat_estimator.remove") as mock_remove:
            mock_remove.return_value = Image.new("RGBA", (100, 100), (150, 50, 50, 255))
            response = client.post(
                "/predict",
                files={"file": ("beef.jpg", sample_image_bytes, "image/jpeg")},
            )
            assert response.status_code == 200
            data = response.json()
            assert "freshness" in data
            assert "meat_quality_score" in data

    def test_invalid_bearer_format_returns_401(self, client, sample_image_bytes):
        response = client.post(
            "/predict",
            headers={"Authorization": "Basic 12345"},
            files={"file": ("beef.jpg", sample_image_bytes, "image/jpeg")},
        )
        assert response.status_code == 401

    def test_invalid_image_file_returns_400(self, client):
        with patch("app.services.supabase_service.SupabaseService.verify_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = "test-user-id"
            response = client.post(
                "/predict",
                headers={"Authorization": "Bearer mock-token-123"},
                files={"file": ("test.txt", b"not an image", "text/plain")},
            )
            assert response.status_code == 400
            assert "not a valid JPEG or PNG" in response.json()["detail"]

    def test_file_size_exceeding_10mb_returns_400(self, client):
        with patch("app.services.supabase_service.SupabaseService.verify_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = "test-user-id"
            huge_bytes = b"0" * (11 * 1024 * 1024)
            response = client.post(
                "/predict",
                headers={"Authorization": "Bearer mock-token-123"},
                files={"file": ("huge.jpg", huge_bytes, "image/jpeg")},
            )
            assert response.status_code == 400
            assert "exceeds maximum allowed size" in response.json()["detail"]


@pytest.mark.api
class TestPredictEndpointPipeline:
    """End-to-end integration tests for POST /predict (Task 10.4)."""

    def test_successful_prediction_flow(self, client, sample_image_bytes):
        """Test complete prediction flow with real model inference."""
        dummy_rgba = Image.new("RGBA", (800, 800), (160, 30, 30, 255))
        with patch("app.cv.fat_estimator.remove", return_value=dummy_rgba), \
             patch("app.services.supabase_service.SupabaseService.verify_token", new_callable=AsyncMock) as mock_verify, \
             patch("app.services.supabase_service.SupabaseService.upload_image", new_callable=AsyncMock) as mock_upload, \
             patch("app.services.supabase_service.SupabaseService.store_assessment", new_callable=AsyncMock) as mock_store:

            mock_verify.return_value = "test-user-uuid"
            mock_upload.return_value = "https://mock.storage/test-user-uuid/beef.jpg"
            mock_store.return_value = "assessment-123-uuid"

            response = client.post(
                "/predict",
                headers={"Authorization": "Bearer test-jwt-token"},
                files={"file": ("beef.jpg", sample_image_bytes, "image/jpeg")},
            )

            assert response.status_code == 200
            data = response.json()

            # Verify response schema
            assert data["freshness"] in ["Fresh", "Spoiled"]
            assert 0.0 <= data["freshness_confidence"] <= 100.0
            assert data["marbling"] in ["small", "slight", "modest", "moderate", "slightly_abundant"]
            assert 0.0 <= data["marbling_confidence"] <= 100.0
            assert 0.0 <= data["fat_ratio_percent"] <= 100.0
            assert data["fat_ratio_category"] in ["None", "Small", "Large"]
            assert 0.0 <= data["meat_quality_score"] <= 100.0
            assert data["assessment_id"] == "assessment-123-uuid"
            assert data["image_url"] == "https://mock.storage/test-user-uuid/beef.jpg"
            for timing_field in (
                "freshness_inference_ms",
                "marbling_inference_ms",
                "fat_estimation_ms",
                "background_removal_ms",
            ):
                assert isinstance(data[timing_field], (int, float))
                assert data[timing_field] >= 0

    def test_streaming_prediction_reports_completed_stages(self, client, sample_image_bytes):
        segmented = SegmentedForeground(
            rgb=None,
            mask=None,
            crop=Image.new("RGB", (224, 224)),
            background_removal_ms=12.5,
        )
        service = type("MockStorageService", (), {
            "upload_image": AsyncMock(return_value="https://mock.storage/beef.jpg"),
            "store_assessment": AsyncMock(return_value="assessment-stream-123"),
        })()
        with patch("app.routes.predict.fat_estimator.segment", return_value=segmented), \
             patch("app.routes.predict.fat_estimator.estimate", return_value={
                 "percent": 5.0, "category": "Small", "score": 5.0,
             }), \
             patch("app.routes.predict.perf_counter", side_effect=[
                 1.0, 1.1, 2.0, 2.02, 3.0, 3.03, 4.0, 4.08,
             ]), \
             patch("app.routes.predict.preprocessor.preprocess_for_classifier", return_value=object()), \
             patch("app.routes.predict.freshness_predictor.predict", return_value={
                 "label": "Fresh", "confidence": 99.0, "score": 50,
             }), \
             patch("app.routes.predict.marbling_predictor.predict", return_value={
                 "label": "modest", "confidence": 90.0, "score": 20,
             }), \
             patch("app.routes.predict.get_supabase_service", return_value=service):
            response = client.post(
                "/predict/stream",
                files={"file": ("beef.jpg", sample_image_bytes, "image/jpeg")},
            )

        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        events = [
            line.removeprefix("data: ").strip()
            for line in response.text.splitlines()
            if line.startswith("data: ")
        ]
        progress_events = [json.loads(event) for event in events[:-2]]
        assert progress_events[0]["completed_stages"] == 0
        assert progress_events[-1]["completed_stages"] == 7
        assert all(event["total_stages"] == 7 for event in progress_events)
        assert "event: result" in response.text
        assert '"background_removal_ms": 12.5' in response.text
        result = json.loads(events[-2])
        assert result["fat_estimation_ms"] == 167.5


@pytest.mark.property
class TestResponseSchemaProperty:
    """Property test for prediction response schema completeness (Task 10.3 - Property 8)."""

    @settings(max_examples=100)
    @given(
        freshness=st.sampled_from(["Fresh", "Spoiled"]),
        freshness_conf=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        marbling=st.sampled_from(["small", "slight", "modest", "moderate", "slightly_abundant"]),
        marbling_conf=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        fat_ratio=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        fat_cat=st.sampled_from(["None", "Small", "Large"]),
        mqs=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
        assessment_id=st.uuids().map(str),
        image_url=st.text(min_size=10, max_size=50).map(lambda s: f"https://storage/{s}.jpg"),
    )
    def test_property_8_response_schema_completeness(
        self,
        freshness,
        freshness_conf,
        marbling,
        marbling_conf,
        fat_ratio,
        fat_cat,
        mqs,
        assessment_id,
        image_url,
    ):
        """Property 8: Any valid combination validates cleanly against PredictionResponseSchema."""
        schema_obj = PredictionResponseSchema(
            freshness=freshness,
            freshness_confidence=freshness_conf,
            marbling=marbling,
            marbling_confidence=marbling_conf,
            fat_ratio_percent=fat_ratio,
            fat_ratio_category=fat_cat,
            meat_quality_score=mqs,
            assessment_id=assessment_id,
            image_url=image_url,
        )

        serialized = schema_obj.model_dump()
        required_fields = [
            "freshness",
            "freshness_confidence",
            "marbling",
            "marbling_confidence",
            "fat_ratio_percent",
            "fat_ratio_category",
            "meat_quality_score",
            "assessment_id",
            "image_url",
        ]
        for field in required_fields:
            assert field in serialized
