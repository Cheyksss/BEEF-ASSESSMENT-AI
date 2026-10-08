"""
Basic setup tests to verify the backend environment is configured correctly.
Tests imports, dependencies, and basic configuration.
"""

import pytest
import sys
from pathlib import Path


class TestSetup:
    """Test suite for verifying backend setup and dependencies."""
    
    def test_python_version(self):
        """Verify Python version is 3.9 or higher."""
        assert sys.version_info >= (3, 9), "Python 3.9+ required"
    
    def test_fastapi_import(self):
        """Verify FastAPI can be imported."""
        import fastapi
        assert fastapi is not None
    
    def test_torch_import(self):
        """Verify PyTorch can be imported."""
        import torch
        assert torch is not None
    
    def test_timm_import(self):
        """Verify timm can be imported."""
        import timm
        assert timm is not None
    
    def test_opencv_import(self):
        """Verify OpenCV can be imported."""
        import cv2
        assert cv2 is not None
    
    def test_rembg_import(self):
        """Verify rembg can be imported."""
        import rembg
        assert rembg is not None
    
    def test_supabase_import(self):
        """Verify Supabase client can be imported."""
        from supabase import create_client
        assert create_client is not None
    
    def test_hypothesis_import(self):
        """Verify Hypothesis can be imported for property-based testing."""
        from hypothesis import given
        from hypothesis import strategies as st
        assert given is not None
        assert st is not None
    
    def test_project_structure(self):
        """Verify project directory structure exists."""
        backend_dir = Path(__file__).parent.parent
        
        assert (backend_dir / "app").exists(), "app/ directory missing"
        assert (backend_dir / "tests").exists(), "tests/ directory missing"
        assert (backend_dir / "config").exists(), "config/ directory missing"
        assert (backend_dir / "requirements.txt").exists(), "requirements.txt missing"
        assert (backend_dir / "pytest.ini").exists(), "pytest.ini missing"
    
    def test_config_module(self):
        """Verify configuration module can be imported."""
        from config.settings import settings, Settings
        assert settings is not None
        assert Settings is not None
    
    def test_main_app(self):
        """Verify main FastAPI app can be imported."""
        from app.main import app
        assert app is not None
        assert app.title == "Beef Quality Assessment API"


@pytest.mark.property
class TestSetupProperties:
    """Property-based tests for setup verification."""
    
    def test_torch_cuda_availability(self):
        """Check if CUDA is available (informational test)."""
        import torch
        
        # This is informational - CUDA not required but beneficial
        cuda_available = torch.cuda.is_available()
        device = "cuda" if cuda_available else "cpu"
        
        print(f"\nPyTorch device: {device}")
        if cuda_available:
            print(f"CUDA version: {torch.version.cuda}")
            print(f"GPU count: {torch.cuda.device_count()}")
        
        # Test always passes - just informational
        assert True
