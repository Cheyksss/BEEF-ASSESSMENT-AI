"""
Local SQLite database and image storage service.
Ensures assessments and uploaded images persist locally even when Supabase is offline or unconfigured.
"""

import os
import sqlite3
import uuid
from datetime import datetime, timezone
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

# Base directories
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads")
DB_PATH = os.path.join(DATA_DIR, "assessments.db")

# Ensure required directories exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)


class LocalDatabaseService:
    """
    SQLite service providing local persistence for beef quality assessment records and images.
    """

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Initializes SQLite schema if not exists."""
        try:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    CREATE TABLE IF NOT EXISTS assessments (
                        id TEXT PRIMARY KEY,
                        user_id TEXT,
                        image_url TEXT NOT NULL,
                        freshness TEXT NOT NULL,
                        freshness_confidence REAL NOT NULL,
                        marbling TEXT NOT NULL,
                        marbling_confidence REAL NOT NULL,
                        fat_ratio REAL NOT NULL,
                        fat_category TEXT NOT NULL,
                        meat_quality_score REAL NOT NULL,
                        created_at TEXT NOT NULL
                    )
                    """
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to initialize local SQLite database: {e}")

    def save_image(self, image_bytes: bytes, content_type: str = "image/jpeg") -> str:
        """
        Saves image bytes locally to static/uploads/{file_id}.ext.

        Returns:
            str: Relative URL path /static/uploads/{file_id}.ext
        """
        file_id = str(uuid.uuid4())
        ext = "png" if "png" in content_type.lower() else "jpg"
        filename = f"{file_id}.{ext}"
        filepath = os.path.join(UPLOADS_DIR, filename)

        try:
            with open(filepath, "wb") as f:
                f.write(image_bytes)
            # Return relative static URL accessible via FastAPI mount
            return f"http://localhost:8000/static/uploads/{filename}"
        except Exception as e:
            logger.error(f"Failed to save local image file: {e}")
            return f"https://mock-storage.supabase.co/beef-images/local/{filename}"

    def save_assessment(self, record: Dict[str, Any]) -> str:
        """
        Inserts assessment record into local SQLite database.

        Returns:
            str: assessment_id
        """
        record_id = record.get("id") or str(uuid.uuid4())
        created_at = record.get("created_at") or datetime.now(timezone.utc).isoformat()

        try:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO assessments (
                        id, user_id, image_url, freshness, freshness_confidence,
                        marbling, marbling_confidence, fat_ratio, fat_category,
                        meat_quality_score, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        record_id,
                        record.get("user_id"),
                        record.get("image_url", ""),
                        record.get("freshness", "Fresh"),
                        float(record.get("freshness_confidence", 0.0)),
                        record.get("marbling", "modest"),
                        float(record.get("marbling_confidence", 0.0)),
                        float(record.get("fat_ratio", 0.0)),
                        record.get("fat_category", "None"),
                        float(record.get("meat_quality_score", 0.0)),
                        created_at,
                    ),
                )
                conn.commit()
            logger.info(f"Saved assessment {record_id} to local SQLite database.")
            return record_id
        except Exception as e:
            logger.error(f"Failed to save assessment to SQLite: {e}")
            return record_id

    def get_assessments(self, limit: int = 200) -> List[Dict[str, Any]]:
        """
        Retrieves recent assessments sorted by created_at descending.
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT * FROM assessments ORDER BY datetime(created_at) DESC LIMIT ?",
                    (limit,),
                )
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to query SQLite assessments: {e}")
            return []

    def get_assessment_by_id(self, assessment_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a single assessment by ID.
        """
        try:
            with self._get_connection() as conn:
                cursor = conn.execute(
                    "SELECT * FROM assessments WHERE id = ?",
                    (assessment_id,),
                )
                row = cursor.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Failed to query SQLite assessment {assessment_id}: {e}")
            return None

    def delete_assessment(self, assessment_id: str) -> bool:
        """
        Deletes assessment by ID from SQLite database.
        """
        try:
            with self._get_connection() as conn:
                conn.execute(
                    "DELETE FROM assessments WHERE id = ?",
                    (assessment_id,),
                )
                conn.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to delete assessment {assessment_id}: {e}")
            return False


# Singleton instance
local_db = LocalDatabaseService()
