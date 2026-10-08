"""
Unit tests for FatRatioEstimator (Task 7.2).
Validates HSV fat detection, synthetic image handling, zero meat pixels edge case, and score capping.
"""

import pytest
import numpy as np
from PIL import Image
import cv2
from unittest.mock import patch

from app.cv.fat_estimator import FatRatioEstimator


@pytest.mark.unit
@pytest.mark.cv
class TestFatRatioEstimator:
    """Test suite for HSV fat ratio estimation."""

    @pytest.fixture
    def estimator(self):
        return FatRatioEstimator()

    def test_zero_meat_pixels_returns_zeros(self, estimator):
        """Test completely transparent or empty image returns 0.0 percent and None category."""
        # Empty RGBA image
        empty_rgba = Image.new("RGBA", (800, 800), (0, 0, 0, 0))

        with patch("app.cv.fat_estimator.remove", return_value=empty_rgba):
            res = estimator.estimate(Image.new("RGB", (100, 100), (0, 0, 0)))

        assert res["percent"] == 0.0
        assert res["category"] == "None"
        assert res["score"] == 0.0
        assert res["meat_pixels"] == 0

    def test_fat_score_capped_at_20(self, estimator):
        """Test fat score contribution to MQS never exceeds 20.0 points."""
        # Create an RGBA image where meat is white (which falls into HSV fat threshold)
        # In HSV, white (255,255,255 RGB) has V=255, S=0, which falls into [0,0,120] - [180,120,255]
        fat_rgba = Image.new("RGBA", (800, 800), (255, 255, 255, 255))

        with patch("app.cv.fat_estimator.remove", return_value=fat_rgba):
            res = estimator.estimate(Image.new("RGB", (100, 100), (255, 255, 255)))

        assert res["percent"] > 50.0
        assert res["score"] == 20.0
        assert res["category"] == "Large"

    def test_pure_lean_meat_returns_none_category(self, estimator):
        """Test pure lean red meat (no fat) yields ratio < 1.0 and None category."""
        # Pure red meat: RGB(150, 20, 20) -> HSV: H~0, S~220 (high saturation), V~150
        # Lower fat is [0, 0, 120] and upper is [180, 120, 255] (S <= 120)
        # High saturation lean meat (S > 120) will NOT be detected as fat
        lean_rgba = Image.new("RGBA", (800, 800), (160, 20, 20, 255))

        with patch("app.cv.fat_estimator.remove", return_value=lean_rgba):
            res = estimator.estimate(Image.new("RGB", (100, 100), (160, 20, 20)))

        assert res["percent"] < 1.0
        assert res["category"] == "None"
        assert res["score"] < 1.0
