"""
Computer vision module for HSV-based fat ratio estimation.
Uses rembg for background removal, morphological cleaning, and HSV color thresholding.
"""

import logging
from typing import Dict, Any
import numpy as np
import cv2
from PIL import Image
from rembg import remove

from app.scoring.mappers import calculate_fat_ratio, categorize_fat_ratio

logger = logging.getLogger(__name__)


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

    def estimate(self, image: Image.Image) -> Dict[str, Any]:
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
        # Step 1: Resize to 800x800
        if image.mode != "RGB":
            image = image.convert("RGB")
        resized_img = image.resize((800, 800), Image.Resampling.BILINEAR)

        # Step 2: Remove background
        try:
            rgba_result = remove(resized_img)
            rgba_np = np.array(rgba_result)
        except Exception as e:
            logger.error(f"rembg background removal failed: {str(e)}", exc_info=True)
            raise RuntimeError(f"Background removal failed: {str(e)}") from e

        # Step 3: Meat mask from alpha channel
        if rgba_np.ndim == 3 and rgba_np.shape[2] == 4:
            alpha = rgba_np[:, :, 3]
            meat_mask = np.where(alpha > 127, 255, 0).astype(np.uint8)
            rgb_np = rgba_np[:, :, :3]
        else:
            meat_mask = np.ones((800, 800), dtype=np.uint8) * 255
            rgb_np = np.array(resized_img)

        # Step 4: Morphological ops (close then open)
        meat_mask = cv2.morphologyEx(meat_mask, cv2.MORPH_CLOSE, self.kernel)
        meat_mask = cv2.morphologyEx(meat_mask, cv2.MORPH_OPEN, self.kernel)

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
