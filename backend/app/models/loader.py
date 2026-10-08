"""
Model loader and manager module for ReXNet-150 quality assessment models.
Provides singleton model management with device selection and error handling.
"""

import os
import sys
import logging
from pathlib import Path
from typing import Optional
import torch
import timm

from config.settings import settings

logger = logging.getLogger(__name__)


def resolve_model_path(path_str: str) -> Path:
    """
    Resolve model path across relative/absolute directories.
    Handles running from backend root or workspace root.
    """
    p = Path(path_str)
    if p.is_file():
        return p.resolve()
    
    # Try relative to current working dir
    cwd_candidate = Path.cwd() / p
    if cwd_candidate.is_file():
        return cwd_candidate.resolve()
        
    # Try relative to backend dir
    backend_dir = Path(__file__).resolve().parent.parent.parent
    b_candidate = backend_dir / p
    if b_candidate.is_file():
        return b_candidate.resolve()
        
    # Try in workspace root (parent of backend)
    ws_candidate = backend_dir.parent / p.name
    if ws_candidate.is_file():
        return ws_candidate.resolve()

    return p.resolve()


class ModelManager:
    """
    Singleton manager for loading, serving, and accessing ReXNet-150 models.
    """
    _instance: Optional["ModelManager"] = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, force_cpu: bool = False):
        if getattr(self, "_initialized", False):
            return

        self.device = torch.device("cpu") if force_cpu else torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.freshness_model: Optional[torch.nn.Module] = None
        self.marbling_model: Optional[torch.nn.Module] = None
        self.models_loaded: bool = False
        self._initialized = True

    def load_models(
        self,
        freshness_path: Optional[str] = None,
        marbling_path: Optional[str] = None,
    ) -> None:
        """
        Initializes and loads ReXNet-150 models into memory.

        Args:
            freshness_path: Path to freshness model checkpoint (.pth)
            marbling_path: Path to marbling model checkpoint (.pth)
            
        Raises:
            FileNotFoundError: If model files are not found
            RuntimeError: If model architecture initialization or weight loading fails
        """
        f_path_str = freshness_path or settings.FRESHNESS_MODEL_PATH
        m_path_str = marbling_path or settings.MARBLING_MODEL_PATH

        f_resolved = resolve_model_path(f_path_str)
        m_resolved = resolve_model_path(m_path_str)

        if not f_resolved.is_file():
            err_msg = f"Freshness model file not found: {f_resolved}"
            logger.error(err_msg)
            raise FileNotFoundError(err_msg)

        if not m_resolved.is_file():
            err_msg = f"Marbling model file not found: {m_resolved}"
            logger.error(err_msg)
            raise FileNotFoundError(err_msg)

        try:
            logger.info(f"Loading freshness model on {self.device} from {f_resolved}")
            # Initialize ReXNet-150 for 2 classes (Fresh, Spoiled)
            self.freshness_model = timm.create_model(
                "rexnet_150",
                pretrained=False,
                num_classes=2
            )
            state_dict_f = torch.load(f_resolved, map_location=self.device)
            self.freshness_model.load_state_dict(state_dict_f)
            self.freshness_model.eval()
            self.freshness_model.to(self.device)

            logger.info(f"Loading marbling model on {self.device} from {m_resolved}")
            # Initialize ReXNet-150 for 5 classes
            self.marbling_model = timm.create_model(
                "rexnet_150",
                pretrained=False,
                num_classes=5
            )
            state_dict_m = torch.load(m_resolved, map_location=self.device)
            self.marbling_model.load_state_dict(state_dict_m)
            self.marbling_model.eval()
            self.marbling_model.to(self.device)

            self.models_loaded = True
            logger.info("Successfully loaded and initialized both ReXNet-150 models.")

        except Exception as e:
            self.models_loaded = False
            logger.error(f"Failed to load models: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to load ML models: {str(e)}") from e

    def get_freshness_model(self) -> torch.nn.Module:
        """Returns loaded freshness model or raises if not loaded."""
        if self.freshness_model is None:
            raise RuntimeError("Freshness model has not been loaded. Call load_models() first.")
        return self.freshness_model

    def get_marbling_model(self) -> torch.nn.Module:
        """Returns loaded marbling model or raises if not loaded."""
        if self.marbling_model is None:
            raise RuntimeError("Marbling model has not been loaded. Call load_models() first.")
        return self.marbling_model

    def get_device(self) -> torch.device:
        """Returns active PyTorch device (CUDA or CPU)."""
        return self.device

    def is_loaded(self) -> bool:
        """Returns True if models are loaded and ready for inference."""
        return self.models_loaded


# Global singleton instance
model_manager = ModelManager()
