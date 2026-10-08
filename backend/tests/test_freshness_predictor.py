"""
Unit tests for FreshnessPredictor (Task 5.2).
Validates inference, softmax probability computation, confidence extraction, and label mapping.
"""

import pytest
import torch
import torch.nn as nn

from app.inference.predictor import FreshnessPredictor


class DummyClassifier(nn.Module):
    """Mock model that returns fixed logits for testing."""
    def __init__(self, logits: torch.Tensor):
        super().__init__()
        self.logits = logits

    def forward(self, x):
        return self.logits


@pytest.mark.unit
@pytest.mark.model
class TestFreshnessPredictor:
    """Test suite for freshness prediction logic."""

    @pytest.fixture
    def predictor(self):
        return FreshnessPredictor()

    @pytest.fixture
    def sample_tensor(self):
        return torch.zeros((1, 3, 224, 224))

    def test_predict_fresh_class(self, predictor, sample_tensor):
        """Test prediction when class 0 (Fresh) has highest logit."""
        mock_model = DummyClassifier(torch.tensor([[5.0, 1.0]]))
        result = predictor.predict(mock_model, sample_tensor)

        assert result["label"] == "Fresh"
        assert result["score"] == 50
        assert result["confidence"] > 95.0

    def test_predict_spoiled_class(self, predictor, sample_tensor):
        """Test prediction when class 1 (Spoiled) has highest logit."""
        mock_model = DummyClassifier(torch.tensor([[1.0, 5.0]]))
        result = predictor.predict(mock_model, sample_tensor)

        assert result["label"] == "Spoiled"
        assert result["score"] == 0
        assert result["confidence"] > 95.0

    def test_confidence_is_percentage(self, predictor, sample_tensor):
        """Test confidence output is in 0..100 range."""
        mock_model = DummyClassifier(torch.tensor([[2.0, 2.0]]))
        result = predictor.predict(mock_model, sample_tensor)

        assert pytest.approx(result["confidence"], abs=0.5) == 50.0
