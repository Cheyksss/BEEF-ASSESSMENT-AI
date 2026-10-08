"""
FastAPI main application for Beef Quality Assessment backend.
Configures lifespan events for ReXNet-150 model loading, CORS middleware, and API routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from config.settings import settings
from app.models.loader import model_manager
from app.routes.predict import router as predict_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for application startup and shutdown.
    Handles ReXNet-150 model initialization on startup.
    """
    logger.info("Starting Beef Quality Assessment API...")

    try:
        # Validate configuration
        settings.validate()
        logger.info("Configuration validated successfully")

        # Load ML models into memory
        logger.info("Initializing and loading ReXNet-150 models...")
        model_manager.load_models()
        logger.info("ReXNet-150 models loaded successfully on %s", model_manager.get_device())

        yield

    except Exception as e:
        logger.error(f"Startup failed: {str(e)}", exc_info=True)
        # Yield to allow graceful exit or test inspection if needed
        yield

    # Shutdown: Cleanup
    logger.info("Shutting down Beef Quality Assessment API...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Configure CORS middleware
allowed_origins = [
    "http://localhost:3000",
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in allowed_origins:
    allowed_origins.append(settings.FRONTEND_URL)

import os
from fastapi.staticfiles import StaticFiles

# Configure static uploads mounting
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
os.makedirs(os.path.join(static_dir, "uploads"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Register routers
app.include_router(predict_router)


@app.get("/")
async def root():
    """Root endpoint returning API service information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }
