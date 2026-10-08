"""
Inference module for Freshness and Marbling classifiers.
Uses torch.inference_mode() and computes softmax probabilities and confidence scores.
"""

from typing import Dict, Any, Optional
import torch
import torch.nn.functional as F

from app.scoring.mappers import (
    map_freshness_class,
    map_marbling_class,
    convert_confidence_to_percent,
)


class FreshnessPredictor:
    """
    Performs inference using ReXNet-150 binary freshness classifier (Fresh vs Spoiled).
    """

    def predict(
        self,
        model: torch.nn.Module,
        tensor: torch.Tensor,
        device: Optional[torch.device] = None,
    ) -> Dict[str, Any]:
        """
        Runs inference on preprocessed tensor.

        Args:
            model: ReXNet-150 freshness model in eval mode
            tensor: Image batch tensor of shape (1, 3, 224, 224)
            device: Optional torch.device

        Returns:
            Dict[str, Any]: {
                "label": "Fresh" | "Spoiled",
                "confidence": float (percentage, e.g. 96.5),
                "score": int (50 | 0)
            }
        """
        if device is not None and tensor.device != device:
            tensor = tensor.to(device)

        with torch.inference_mode():
            logits = model(tensor)
            probs = F.softmax(logits, dim=1)
            confidence, pred_class = torch.max(probs, dim=1)

            class_idx = pred_class.item()
            conf_percent = convert_confidence_to_percent(confidence.item(), decimals=2)

            mapped = map_freshness_class(class_idx, confidence=conf_percent)
            return {
                "label": mapped["label"],
                "confidence": conf_percent,
                "score": mapped["score"],
            }


class MarblingPredictor:
    """
    Performs inference using ReXNet-150 5-class marbling classifier.
    """

    def predict(
        self,
        model: torch.nn.Module,
        tensor: torch.Tensor,
        device: Optional[torch.device] = None,
    ) -> Dict[str, Any]:
        """
        Runs inference on preprocessed tensor.

        Args:
            model: ReXNet-150 marbling model in eval mode
            tensor: Image batch tensor of shape (1, 3, 224, 224)
            device: Optional torch.device

        Returns:
            Dict[str, Any]: {
                "label": "small" | "slight" | "modest" | "moderate" | "slightly_abundant",
                "confidence": float (percentage),
                "score": int (10, 15, 20, 25, 30)
            }
        """
        if device is not None and tensor.device != device:
            tensor = tensor.to(device)

        with torch.inference_mode():
            logits = model(tensor)
            probs = F.softmax(logits, dim=1)
            confidence, pred_class = torch.max(probs, dim=1)

            class_idx = pred_class.item()
            conf_percent = convert_confidence_to_percent(confidence.item(), decimals=2)

            mapped = map_marbling_class(class_idx, confidence=conf_percent)
            return {
                "label": mapped["label"],
                "confidence": conf_percent,
                "score": mapped["score"],
            }


# Global singleton instances
freshness_predictor = FreshnessPredictor()
marbling_predictor = MarblingPredictor()
