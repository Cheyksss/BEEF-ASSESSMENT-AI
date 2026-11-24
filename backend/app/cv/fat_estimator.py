"""
Computer vision module for HSV-based fat ratio estimation.
Uses rembg for background removal, morphological cleaning, and HSV color thresholding.
"""

import logging
from dataclasses import dataclass
from time import perf_counter
from typing import Dict, Any
import numpy as np
import cv2
from PIL import Image
from rembg import remove

from app.scoring.mappers import calculate_fat_ratio, categorize_fat_ratio

logger = logging.getLogger(__name__)


@dataclass
class SegmentedForeground:
    """A resized input and its foreground mask, computed once per assessment."""

    rgb: np.ndarray
    mask: np.ndarray
    crop: Image.Image
    background_removal_ms: float


class FatRatioEstimator:
    """
    Estimates visible intramuscular and subcutaneous fat ratio from beef images
    using rembg segmentation and HSV thresholding.
    """

    def __init__(self):
        # HSV bounds for fat detection: brightness >= 120, low-to-medium saturation
        self.lower_fat = np.array([0, 0, 120], dtype=np.uint8)
        self.upper_fat = np.array([180, 120, 255], dtype=np.uint8)
        self.kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))

    def segment(self, image: Image.Image) -> SegmentedForeground:
        """Extract the prominent foreground and reject images with no usable object."""
        resized = image.convert("RGB").resize((800, 800), Image.Resampling.BILINEAR)
        try:
            background_removal_started = perf_counter()
            removed = remove(resized)
            background_removal_ms = (perf_counter() - background_removal_started) * 1000
            rgba = np.asarray(removed)
        except Exception as e:
            logger.error("Foreground segmentation failed: %s", e, exc_info=True)
            raise RuntimeError(f"Foreground segmentation failed: {e}") from e

        if rgba.ndim != 3 or rgba.shape[2] != 4:
            raise ValueError("No foreground object was detected in the image")

        rgb = rgba[:, :, :3]
        mask = np.where(rgba[:, :, 3] > 127, 255, 0).astype(np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, self.kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, self.kernel)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            raise ValueError("No foreground object was detected in the image")
        largest = max(contours, key=cv2.contourArea)
        x, y, width, height = cv2.boundingRect(largest)
        area_ratio = cv2.contourArea(largest) / float(mask.shape[0] * mask.shape[1])
        if area_ratio < 0.01 or width < 32 or height < 32:
            raise ValueError("No sufficiently large foreground object was detected")

        # A small margin preserves the cut boundary while excluding most background.
        pad_x, pad_y = max(8, int(width * 0.03)), max(8, int(height * 0.03))
        left, top = max(0, x - pad_x), max(0, y - pad_y)
        right, bottom = min(800, x + width + pad_x), min(800, y + height + pad_y)
        crop_rgb = rgb[top:bottom, left:right].copy()
        crop_mask = mask[top:bottom, left:right] > 0
        crop_rgb[~crop_mask] = (127, 127, 127)
        crop = Image.fromarray(crop_rgb)
        return SegmentedForeground(
            rgb=rgb,
            mask=mask,
            crop=crop,
            background_removal_ms=background_removal_ms,
        )

    def estimate(
        self,
        image: Image.Image,
        segmented: SegmentedForeground | None = None,
    ) -> Dict[str, Any]:
        """
        Estimates the fat ratio percentage and category for a given beef image.

        Pipeline:
        1. Resize PIL image to 800x800
        2. Remove background using rembg (producing RGBA output)
        3. Threshold alpha channel at 127 to create binary meat mask
        4. Apply morphological closing then opening with a 7x7 ellipse kernel
        5. Convert masked meat region to HSV color space
        6. Threshold fat pixels with [0,0,120] to [180,120,255]
        7. Compute fat ratio = (fat_pixels / meat_pixels) * 100
        8. Categorize ratio (<1.0%: None, 1.0-15.0%: Small, >=15.0%: Large)

        Args:
            image: Input PIL Image

        Returns:
            Dict[str, Any]: {
                "percent": float,
                "category": str ("None" | "Small" | "Large"),
                "score": float (fat score capped at 20.0 for MQS),
                "fat_pixels": int,
                "meat_pixels": int
            }
        """
        # Reuse the segmentation performed before classification in the API route.
        segmented = segmented or self.segment(image)
        meat_mask = segmented.mask
        rgb_np = segmented.rgb

        meat_pixels = int(cv2.countNonZero(meat_mask))
        if meat_pixels == 0:
            return {
                "percent": 0.0,
                "category": "None",
                "score": 0.0,
                "fat_pixels": 0,
                "meat_pixels": 0,
            }

        # Step 5: Isolate meat region and convert to HSV
        meat_rgb = cv2.bitwise_and(rgb_np, rgb_np, mask=meat_mask)
        meat_hsv = cv2.cvtColor(meat_rgb, cv2.COLOR_RGB2HSV)

        # Step 6: Detect fat pixels in HSV
        fat_mask = cv2.inRange(meat_hsv, self.lower_fat, self.upper_fat)
        # Exclude background pixels explicitly
        fat_mask = cv2.bitwise_and(fat_mask, meat_mask)
        fat_pixels = int(cv2.countNonZero(fat_mask))

        # Step 7: Calculate ratio & category
        fat_ratio = calculate_fat_ratio(fat_pixels, meat_pixels)
        category = categorize_fat_ratio(fat_ratio)
        fat_score = round(min(fat_ratio, 20.0), 2)

        return {
            "percent": fat_ratio,
            "category": category,
            "score": fat_score,
            "fat_pixels": fat_pixels,
            "meat_pixels": meat_pixels,
        }


# Global singleton instance
fat_estimator = FatRatioEstimator()
