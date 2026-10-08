"""
Core scoring and mapping functions for beef quality assessment:
- Freshness classification mapping
- Marbling classification mapping
- Confidence conversion
- Fat ratio calculation and categorization
- Meat Quality Score (MQS) calculation
"""

from typing import Dict, Any, Optional, Tuple


# Freshness mapping table
FRESHNESS_MAP: Dict[int, Tuple[str, int]] = {
    0: ("Fresh", 50),
    1: ("Spoiled", 0),
}

# Marbling mapping table
# 0 -> small (10), 1 -> modest (20), 2 -> moderate (25), 3 -> slight (15), 4 -> slightly_abundant (30)
MARBLING_MAP: Dict[int, Tuple[str, int]] = {
    0: ("small", 10),
    1: ("modest", 20),
    2: ("moderate", 25),
    3: ("slight", 15),
    4: ("slightly_abundant", 30),
}


def convert_confidence_to_percent(prob: float, decimals: int = 2) -> float:
    """
    Converts a probability in [0.0, 1.0] to a percentage [0.0, 100.0].

    Args:
        prob: Probability float in [0.0, 1.0]
        decimals: Decimal places to round to (default: 2)

    Returns:
        float: Percentage in [0.0, 100.0]
    """
    clamped = max(0.0, min(1.0, float(prob)))
    return round(clamped * 100.0, decimals)


def map_freshness_class(class_idx: int, confidence: Optional[float] = None) -> Dict[str, Any]:
    """
    Maps freshness class index (0 or 1) to label, score, and optional confidence.

    Args:
        class_idx: Predicted class index (0 for Fresh, 1 for Spoiled)
        confidence: Optional confidence percentage (0-100)

    Returns:
        Dict[str, Any]: {
            "label": str ("Fresh" | "Spoiled"),
            "score": int (50 | 0),
            "confidence": float (if provided)
        }

    Raises:
        ValueError: If class_idx is not 0 or 1
    """
    if class_idx not in FRESHNESS_MAP:
        raise ValueError(f"Invalid freshness class index: {class_idx}. Must be 0 or 1.")

    label, score = FRESHNESS_MAP[class_idx]
    result: Dict[str, Any] = {
        "label": label,
        "score": score,
    }
    if confidence is not None:
        result["confidence"] = round(float(confidence), 2)
    return result


def map_marbling_class(class_idx: int, confidence: Optional[float] = None) -> Dict[str, Any]:
    """
    Maps marbling class index (0 to 4) to label, score, and optional confidence.

    Args:
        class_idx: Predicted class index (0 to 4)
        confidence: Optional confidence percentage (0-100)

    Returns:
        Dict[str, Any]: {
            "label": str,
            "score": int,
            "confidence": float (if provided)
        }

    Raises:
        ValueError: If class_idx is not in 0..4
    """
    if class_idx not in MARBLING_MAP:
        raise ValueError(f"Invalid marbling class index: {class_idx}. Must be an integer between 0 and 4.")

    label, score = MARBLING_MAP[class_idx]
    result: Dict[str, Any] = {
        "label": label,
        "score": score,
    }
    if confidence is not None:
        result["confidence"] = round(float(confidence), 2)
    return result


def calculate_fat_ratio(fat_pixels: int, meat_pixels: int) -> float:
    """
    Calculates visible fat ratio percentage from pixel counts:
    ratio = (fat_pixels / meat_pixels) * 100

    Args:
        fat_pixels: Non-negative count of detected fat pixels
        meat_pixels: Non-negative count of total meat area pixels

    Returns:
        float: Percentage rounded to 2 decimal places, clamped to [0.0, 100.0].
               Returns 0.0 if meat_pixels <= 0.
    """
    if meat_pixels <= 0 or fat_pixels <= 0:
        return 0.0

    ratio = (float(fat_pixels) / float(meat_pixels)) * 100.0
    clamped = max(0.0, min(100.0, ratio))
    return round(clamped, 2)


def categorize_fat_ratio(ratio: float) -> str:
    """
    Categorizes fat ratio percentage into quality tiers:
    - < 1.0% -> "None"
    - 1.0% to < 15.0% -> "Small"
    - >= 15.0% -> "Large"

    Args:
        ratio: Fat ratio percentage in [0.0, 100.0]

    Returns:
        str: "None", "Small", or "Large"
    """
    r = float(ratio)
    if r < 1.0:
        return "None"
    elif r < 15.0:
        return "Small"
    else:
        return "Large"


def calculate_mqs(
    freshness_score: float,
    marbling_score: float,
    fat_ratio: float,
) -> float:
    """
    Calculates the Meat Quality Score (MQS) on a scale of [0.0, 100.0]:
    MQS = freshness_score + marbling_score + min(fat_ratio, 20.0)

    Spoiled Beef Constraint:
    If beef is spoiled (freshness_score == 0), MQS is strictly capped at 50.0.

    Args:
        freshness_score: Freshness score (50 for Fresh, 0 for Spoiled)
        marbling_score: Marbling score (10, 15, 20, 25, 30)
        fat_ratio: Fat ratio percentage [0.0, 100.0]

    Returns:
        float: MQS rounded to 1 decimal place in range [0.0, 100.0]
    """
    fat_contribution = min(max(0.0, float(fat_ratio)), 20.0)
    mqs = float(freshness_score) + float(marbling_score) + fat_contribution

    # Spoiled constraint: if freshness_score == 0, cap MQS at 50.0
    if freshness_score == 0 and mqs > 50.0:
        mqs = 50.0

    # Ensure valid range [0.0, 100.0]
    mqs = max(0.0, min(100.0, mqs))

    return round(mqs, 1)


class MQSCalculator:
    """Object-oriented wrapper for MQS calculation."""

    def calculate(
        self,
        freshness_score: float,
        marbling_score: float,
        fat_score: float,
    ) -> float:
        return calculate_mqs(freshness_score, marbling_score, fat_score)


mqs_calculator = MQSCalculator()
