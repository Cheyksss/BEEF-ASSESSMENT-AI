"""
Unit tests for ModelManager (Task 2.2).
Validates model loading, device selection, evaluation mode, and missing file error handling.
"""

import pytest
import torch
from pathlib import Path

from app.models.loader import ModelManager, resolve_model_path


@pytest.mark.unit
@pytest.mark.model
class TestModelManager:
    """Test suite for ReXNet-150 ModelManager."""

    def test_device_selection_cpu(self):
        """Test device selection can be forced to CPU."""
        manager = ModelManager(force_cpu=True)
        assert manager.get_device() == torch.device("cpu")

    def test_device_selection_default(self):
        """Test default device selection matches cuda availability."""
        manager = ModelManager()
        expected = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        assert manager.get_device() == expected

    def test_missing_freshness_file_raises_error(self, tmp_path):
        """Test FileNotFoundError is raised when freshness model file does not exist."""
        manager = ModelManager(force_cpu=True)
        fake_f = str(tmp_path / "nonexistent_freshness.pth")
        fake_m = str(tmp_path / "nonexistent_marbling.pth")

        with pytest.raises(FileNotFoundError, match="Freshness model file not found"):
            manager.load_models(freshness_path=fake_f, marbling_path=fake_m)

    def test_missing_marbling_file_raises_error(self, tmp_path):
        """Test FileNotFoundError is raised when marbling model file is missing."""
        manager = ModelManager(force_cpu=True)
        # Create a dummy freshness file
        dummy_f = tmp_path / "dummy_freshness.pth"
        dummy_f.touch()
        fake_m = str(tmp_path / "nonexistent_marbling.pth")

        with pytest.raises(FileNotFoundError, match="Marbling model file not found"):
            manager.load_models(freshness_path=str(dummy_f), marbling_path=fake_m)

    def test_successful_model_loading_and_eval_mode(self):
        """Test loading real ReXNet-150 models and checking eval mode."""
        manager = ModelManager(force_cpu=True)
        # Try loading default models configured in settings
        manager.load_models()

        assert manager.is_loaded() is True
        freshness_model = manager.get_freshness_model()
        marbling_model = manager.get_marbling_model()

        assert freshness_model is not None
        assert marbling_model is not None
        assert not freshness_model.training, "Freshness model must be in eval mode"
        assert not marbling_model.training, "Marbling model must be in eval mode"

    def test_resolve_model_path_finds_files(self):
        """Test path resolver finds files in workspace root or backend."""
        p_fresh = resolve_model_path("rexnet150_freshness_best.pth")
        assert p_fresh.is_file(), f"Path resolver could not locate {p_fresh}"
