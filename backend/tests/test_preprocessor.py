"""
Unit tests for ImagePreprocessor (Task 3.2).
Validates 224x224 classifier preprocessing, tensor shapes, normalization, and 800x800 resizing.
"""

import pytest
import torch
import numpy as np
from PIL import Image

from app.preprocessing.image_processor import ImagePreprocessor


@pytest.mark.unit
class TestImagePreprocessor:
    """Test suite for image preprocessing."""

    @pytest.fixture
    def preprocessor(self):
        return ImagePreprocessor()

    @pytest.fixture
    def sample_image(self):
        # 400x300 RGB image
        arr = np.random.randint(0, 256, (300, 400, 3), dtype=np.uint8)
        return Image.fromarray(arr)

    def test_classifier_tensor_shape(self, preprocessor, sample_image):
        """Test output tensor has shape [1, 3, 224, 224]."""
        tensor = preprocessor.preprocess_for_classifier(sample_image)
        assert isinstance(tensor, torch.Tensor)
        assert tensor.shape == (1, 3, 224, 224)

    def test_classifier_device_transfer(self, preprocessor, sample_image):
        """Test output tensor is transferred to requested device."""
        cpu_device = torch.device("cpu")
        tensor = preprocessor.preprocess_for_classifier(sample_image, device=cpu_device)
        assert tensor.device == cpu_device

    def test_rgba_to_rgb_conversion(self, preprocessor):
        """Test preprocessing RGBA image converts correctly to 3-channel tensor."""
        rgba_arr = np.random.randint(0, 256, (200, 200, 4), dtype=np.uint8)
        rgba_img = Image.fromarray(rgba_arr, mode="RGBA")

        tensor = preprocessor.preprocess_for_classifier(rgba_img)
        assert tensor.shape == (1, 3, 224, 224)

    def test_normalization_values(self, preprocessor):
        """Test normalization produces expected standardized values for uniform image."""
        # Create solid black image (pixels = 0)
        black_img = Image.new("RGB", (100, 100), (0, 0, 0))
        tensor = preprocessor.preprocess_for_classifier(black_img)

        # Expected normalized value for 0 with ImageNet stats: (0 - mean) / std
        # mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
        expected_r = (0.0 - 0.485) / 0.229
        expected_g = (0.0 - 0.456) / 0.224
        expected_b = (0.0 - 0.406) / 0.225

        assert pytest.approx(tensor[0, 0, 0, 0].item(), abs=1e-2) == expected_r
        assert pytest.approx(tensor[0, 1, 0, 0].item(), abs=1e-2) == expected_g
        assert pytest.approx(tensor[0, 2, 0, 0].item(), abs=1e-2) == expected_b

    def test_resize_for_fat_estimation(self, preprocessor, sample_image):
        """Test 800x800 resize for fat estimation."""
        resized = preprocessor.resize_for_fat_estimation(sample_image)
        assert isinstance(resized, Image.Image)
        assert resized.size == (800, 800)
        assert resized.mode == "RGB"
