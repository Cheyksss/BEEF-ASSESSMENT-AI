"""
Configuration settings for Beef Quality Assessment backend.
Loads environment variables and provides centralized configuration.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def _check_file_exists(path_str: str) -> bool:
    """Check if file exists at path_str or relative to backend directory or workspace root."""
    p = Path(path_str)
    if p.is_file():
        return True
    backend_dir = Path(__file__).resolve().parent.parent
    if (backend_dir / p).is_file():
        return True
    if (backend_dir.parent / p.name).is_file():
        return True
    return False


class Settings:
    """Application configuration settings loaded from environment variables."""

    # Model paths
    FRESHNESS_MODEL_PATH: str = os.getenv(
        "FRESHNESS_MODEL_PATH",
        "../rexnet150_freshness_best.pth",
    )
    MARBLING_MODEL_PATH: str = os.getenv(
        "MARBLING_MODEL_PATH",
        "../rexnet150_marbling_best.pth",
    )

    # Supabase configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

    # Frontend URL for CORS
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Application settings
    APP_NAME: str = "Beef Quality Assessment API"
    APP_VERSION: str = "1.0.0"

    @classmethod
    def validate(cls) -> bool:
        """
        Validate that all required configuration is present.

        Returns:
            bool: True if configuration is valid

        Raises:
            ValueError: If required environment variables are missing
        """
        required_vars = {
            "FRESHNESS_MODEL_PATH": cls.FRESHNESS_MODEL_PATH,
            "MARBLING_MODEL_PATH": cls.MARBLING_MODEL_PATH,
        }

        missing_vars = [
            var_name for var_name, var_value in required_vars.items()
            if not var_value
        ]

        if missing_vars:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing_vars)}"
            )

        # Validate model paths exist
        if not _check_file_exists(cls.FRESHNESS_MODEL_PATH):
            raise ValueError(f"Freshness model not found at: {cls.FRESHNESS_MODEL_PATH}")

        if not _check_file_exists(cls.MARBLING_MODEL_PATH):
            raise ValueError(f"Marbling model not found at: {cls.MARBLING_MODEL_PATH}")

        return True


# Global settings instance
settings = Settings()
