"""
Supabase integration service (Task 9.1).
Handles JWT authentication token verification, image storage in user-scoped folders,
signed URL generation, and assessment record persistence in PostgreSQL.
"""

import os
import uuid
import logging
from typing import Optional, Dict, Any
from supabase import create_client, Client

from config.settings import settings
from app.services.local_db import local_db

logger = logging.getLogger(__name__)


class SupabaseService:
    """
    Service wrapper for Supabase authentication, database, and storage APIs.
    """

    def __init__(self, client: Optional[Client] = None):
        if client:
            self.client = client
        else:
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_SERVICE_KEY
            is_placeholder = not url or not key or any(
                p in url.lower() for p in ("placeholder", "mock", "example", "your-project", "xyzcompany")
            )
            if not is_placeholder:
                try:
                    self.client = create_client(url, key)
                except Exception as e:
                    self.client = None
                    logger.warning(f"Could not connect to Supabase: {e}. Operating in local offline mode.")
            else:
                self.client = None
                logger.info(
                    "Supabase credentials not set or using placeholder. SupabaseService initialized in local offline mode."
                )

    async def verify_token(self, token: str) -> str:
        """
        Verifies Supabase JWT access token using auth.get_user().

        Args:
            token: Supabase JWT string

        Returns:
            str: user_id UUID string

        Raises:
            ValueError: If token is invalid or verification fails
        """
        if not token:
            raise ValueError("Token cannot be empty")

        if self.client is None:
            # Fallback for development/testing when Supabase is unconfigured
            logger.warning("Using mock token verification (Supabase not configured)")
            return "mock-user-uuid"

        try:
            # auth.get_user(jwt)
            user_response = self.client.auth.get_user(token)
            if not user_response or not getattr(user_response, "user", None):
                raise ValueError("Invalid session or user not found")
            return user_response.user.id
        except Exception as e:
            logger.error(f"Supabase auth token verification error: {str(e)}")
            raise ValueError(f"Authentication failed: {str(e)}") from e

    async def upload_image(
        self,
        user_id: Optional[str],
        image_bytes: bytes,
        content_type: str = "image/jpeg",
        expires_in: int = 3600,
    ) -> str:
        """
        Uploads image to 'beef-images' bucket under user_id or guest folder.

        Returns:
            str: Signed URL (or public URL) to access the uploaded image
        """
        folder = user_id if user_id and user_id not in ("00000000-0000-0000-0000-000000000000", "anonymous") else "guest"
        file_id = str(uuid.uuid4())
        ext = "jpg" if "jpeg" in content_type or "jpg" in content_type else "png"
        path = f"{folder}/{file_id}.{ext}"

        if self.client is None:
            return local_db.save_image(image_bytes, content_type)

        try:
            # Upload to bucket
            self.client.storage.from_("beef-images").upload(
                path=path,
                file=image_bytes,
                file_options={"content-type": content_type},
            )

            # Generate signed URL for bucket access
            try:
                signed_res = self.client.storage.from_("beef-images").create_signed_url(
                    path=path,
                    expires_in=expires_in,
                )
                if isinstance(signed_res, dict) and "signedURL" in signed_res:
                    return signed_res["signedURL"]
                elif hasattr(signed_res, "signed_url"):
                    return signed_res.signed_url
            except Exception:
                pass

            # Fallback to public URL
            public_res = self.client.storage.from_("beef-images").get_public_url(path)
            return public_res
        except Exception as e:
            logger.warning(f"Supabase image upload failed ({str(e)}). Saving image locally.")
            return local_db.save_image(image_bytes, content_type)

    async def store_assessment(
        self,
        user_id: Optional[str],
        image_url: str,
        freshness: str,
        freshness_confidence: float,
        marbling: str,
        marbling_confidence: float,
        fat_ratio: float,
        fat_category: str,
        meat_quality_score: float,
    ) -> str:
        """
        Inserts quality assessment record into PostgreSQL assessments table and local SQLite.

        Returns:
            str: assessment_id UUID
        """
        valid_user_id = user_id if (user_id and user_id not in ("00000000-0000-0000-0000-000000000000", "anonymous", "guest")) else None
        record: Dict[str, Any] = {
            "id": str(uuid.uuid4()),
            "user_id": valid_user_id,
            "image_url": image_url,
            "freshness": freshness,
            "freshness_confidence": freshness_confidence,
            "marbling": marbling,
            "marbling_confidence": marbling_confidence,
            "fat_ratio": fat_ratio,
            "fat_category": fat_category,
            "meat_quality_score": meat_quality_score,
        }

        # Always persist to local SQLite
        local_db.save_assessment(record)

        if self.client is None:
            return record["id"]

        try:
            res = self.client.table("assessments").insert(record).execute()
            if res.data and len(res.data) > 0 and "id" in res.data[0]:
                return str(res.data[0]["id"])
            return record["id"]
        except Exception as e:
            logger.warning(f"Failed to persist assessment in Supabase ({str(e)}). Saved in local database.")
            return record["id"]


_supabase_service_instance: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    """Returns singleton SupabaseService instance."""
    global _supabase_service_instance
    if _supabase_service_instance is None:
        _supabase_service_instance = SupabaseService()
    return _supabase_service_instance
