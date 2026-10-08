"""
Unit tests for MarblingPredictor (Task 6.2).
Validates inference, softmax probability computation, confidence extraction, and 5-grade label mapping.
"""

import pytest
import torch
import torch.nn as nn

from app.inference.predictor import MarblingPredictor


class DummyMarblingModel(nn.Module):
    """Mock model that returns fixed logits for 5 classes."""
    def __init__(self, logits: torch.Tensor):
        super().__init__()
        self.logits = logits

    def forward(self, x):
        return self.logits


@pytest.mark.unit
@pytest.mark.model
class TestMarblingPredictor:
    """Test suite for marbling prediction logic."""

    @pytest.fixture
    def predictor(self):
        return MarblingPredictor()

    @pytest.fixture
    def sample_tensor(self):
        return torch.zeros((1, 3, 224, 224))

    @pytest.mark.parametrize(
        "target_class,expected_label,expected_score",
        [
            (0, "small", 10),
            (1, "modest", 20),
            (2, "moderate", 25),
            (3, "slight", 15),
            (4, "slightly_abundant", 30),
        ],
    )
    def test_predict_all_marbling_classes(
        self, predictor, sample_tensor, target_class, expected_label, expected_score
    ):
        """Test prediction for each of the 5 marbling classes."""
        logits = torch.zeros((1, 5))
        logits[0, target_class] = 10.0  # high confidence for target class

        mock_model = DummyMarblingModel(logits)
        result = predictor.predict(mock_model, sample_tensor)

        assert result["label"] == expected_label
        assert result["score"] == expected_score
        assert result["confidence"] > 95.0

    def test_marbling_confidence_percentage(self, predictor, sample_tensor):
        """Test equal logits return 20% confidence."""
        mock_model = DummyMarblingModel(torch.zeros((1, 5)))
        result = predictor.predict(mock_model, sample_tensor)

        assert pytest.approx(result["confidence"], abs=0.5) == 20.0
