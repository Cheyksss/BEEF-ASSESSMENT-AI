"""
Integration and unit tests for SupabaseService (Task 9.2).
Validates token verification, image upload, and assessment storage with mock/live clients.
"""

import pytest
from unittest.mock import MagicMock
from app.services.supabase_service import SupabaseService


@pytest.mark.unit
@pytest.mark.api
class TestSupabaseService:
    """Test suite for SupabaseService."""

    @pytest.fixture
    def mock_supabase_client(self):
        client = MagicMock()
        # Mock auth
        mock_user = MagicMock()
        mock_user.id = "user-1234-uuid"
        auth_response = MagicMock()
        auth_response.user = mock_user
        client.auth.get_user.return_value = auth_response

        # Mock storage
        storage_bucket = MagicMock()
        storage_bucket.upload.return_value = {"Key": "beef-images/user-1234/test.jpg"}
        storage_bucket.create_signed_url.return_value = {"signedURL": "https://signed.url/test.jpg"}
        storage_bucket.get_public_url.return_value = "https://public.url/test.jpg"
        client.storage.from_.return_value = storage_bucket

        # Mock database
        table_mock = MagicMock()
        insert_mock = MagicMock()
        execute_mock = MagicMock()
        execute_mock.data = [{"id": "assessment-999-uuid"}]
        insert_mock.execute.return_value = execute_mock
        table_mock.insert.return_value = insert_mock
        client.table.return_value = table_mock

        return client

    @pytest.mark.asyncio
    async def test_verify_token_success(self, mock_supabase_client):
        """Test token verification returns user ID."""
        service = SupabaseService(client=mock_supabase_client)
        user_id = await service.verify_token("valid-jwt-token")
        assert user_id == "user-1234-uuid"
        mock_supabase_client.auth.get_user.assert_called_once_with("valid-jwt-token")

    @pytest.mark.asyncio
    async def test_verify_token_empty_raises_error(self):
        """Test empty token raises ValueError."""
        service = SupabaseService()
        with pytest.raises(ValueError, match="Token cannot be empty"):
            await service.verify_token("")

    @pytest.mark.asyncio
    async def test_upload_image_signed_url(self, mock_supabase_client):
        """Test image upload produces signed URL with user folder prefix."""
        service = SupabaseService(client=mock_supabase_client)
        url = await service.upload_image("user-1234", b"fake-jpeg-data")
        assert url == "https://signed.url/test.jpg"
        mock_supabase_client.storage.from_.assert_called_with("beef-images")

    @pytest.mark.asyncio
    async def test_store_assessment_success(self, mock_supabase_client):
        """Test storing assessment returns inserted assessment_id."""
        service = SupabaseService(client=mock_supabase_client)
        assessment_id = await service.store_assessment(
            user_id="user-1234",
            image_url="https://signed.url/test.jpg",
            freshness="Fresh",
            freshness_confidence=98.5,
            marbling="modest",
            marbling_confidence=85.2,
            fat_ratio=12.5,
            fat_category="Small",
            meat_quality_score=82.5,
        )
        assert assessment_id == "assessment-999-uuid"
        mock_supabase_client.table.assert_called_with("assessments")
