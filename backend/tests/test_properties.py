"""
Property-based tests for core scoring, mappings, and MQS calculation (Tasks 4.5 - 4.11).
Uses Hypothesis to test 100+ random examples per property.
"""

import pytest
from hypothesis import given, settings, strategies as st

from app.scoring.mappers import (
    map_freshness_class,
    map_marbling_class,
    convert_confidence_to_percent,
    calculate_fat_ratio,
    categorize_fat_ratio,
    calculate_mqs,
)


@pytest.mark.property
class TestScoringProperties:
    """Property tests for Beef Quality scoring functions."""

    # Task 4.5: Property 1: Freshness Classification Mapping
    # Validates: Requirements 5.4, 5.5, 5.6
    @settings(max_examples=100)
    @given(class_idx=st.sampled_from([0, 1]))
    def test_property_1_freshness_mapping(self, class_idx: int):
        """Property 1: Freshness mapping accurately maps 0 -> Fresh (50), 1 -> Spoiled (0)."""
        res = map_freshness_class(class_idx)
        if class_idx == 0:
            assert res["label"] == "Fresh"
            assert res["score"] == 50
        else:
            assert res["label"] == "Spoiled"
            assert res["score"] == 0

    # Task 4.6: Property 2: Marbling Classification Mapping
    # Validates: Requirements 6.4, 6.5
    @settings(max_examples=100)
    @given(class_idx=st.sampled_from([0, 1, 2, 3, 4]))
    def test_property_2_marbling_mapping(self, class_idx: int):
        """Property 2: Marbling mapping accurately maps 0..4 classes to labels and scores."""
        expected_map = {
            0: ("small", 10),
            1: ("modest", 20),
            2: ("moderate", 25),
            3: ("slight", 15),
            4: ("slightly_abundant", 30),
        }
        res = map_marbling_class(class_idx)
        expected_label, expected_score = expected_map[class_idx]
        assert res["label"] == expected_label
        assert res["score"] == expected_score

    # Task 4.7: Property 3: Confidence Percentage Conversion
    # Validates: Requirements 5.7, 6.6
    @settings(max_examples=150)
    @given(prob=st.floats(min_value=0.0, max_value=1.0, allow_nan=False, allow_infinity=False))
    def test_property_3_confidence_conversion(self, prob: float):
        """Property 3: Confidence float in [0.0, 1.0] maps to percentage in [0.0, 100.0]."""
        pct = convert_confidence_to_percent(prob)
        assert 0.0 <= pct <= 100.0
        assert pytest.approx(pct, abs=0.02) == prob * 100.0

    # Task 4.8: Property 4: Fat Ratio Calculation
    # Validates: Requirements 7.9, 7.13
    @settings(max_examples=150)
    @given(
        meat_pixels=st.integers(min_value=1, max_value=640000),
        fat_pixels=st.integers(min_value=0, max_value=640000),
    )
    def test_property_4_fat_ratio_calculation(self, meat_pixels: int, fat_pixels: int):
        """Property 4: Fat ratio calculation equals (fat/meat)*100, clamped to [0.0, 100.0]."""
        ratio = calculate_fat_ratio(fat_pixels, meat_pixels)
        expected = min(100.0, round((fat_pixels / meat_pixels) * 100.0, 2))
        assert 0.0 <= ratio <= 100.0
        assert ratio == expected

    # Task 4.9: Property 5: Fat Ratio Categorization
    # Validates: Requirements 7.10, 7.11, 7.12
    @settings(max_examples=150)
    @given(ratio=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False))
    def test_property_5_fat_ratio_categorization(self, ratio: float):
        """Property 5: Fat ratio categorization boundaries are consistent and non-overlapping."""
        cat = categorize_fat_ratio(ratio)
        if ratio < 1.0:
            assert cat == "None"
        elif 1.0 <= ratio < 15.0:
            assert cat == "Small"
        else:
            assert cat == "Large"

    # Task 4.10: Property 6: MQS Calculation and Range Validation
    # Validates: Requirements 8.1, 8.2, 8.4, 8.6, 17.7
    @settings(max_examples=200)
    @given(
        freshness_score=st.sampled_from([50, 0]),
        marbling_score=st.sampled_from([10, 15, 20, 25, 30]),
        fat_ratio=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
    )
    def test_property_6_mqs_calculation(
        self, freshness_score: int, marbling_score: int, fat_ratio: float
    ):
        """Property 6: MQS calculation formula with fat capped at 20 is always in range [0.0, 100.0]."""
        mqs = calculate_mqs(freshness_score, marbling_score, fat_ratio)
        assert 0.0 <= mqs <= 100.0

        fat_contrib = min(fat_ratio, 20.0)
        expected_raw = freshness_score + marbling_score + fat_contrib
        if freshness_score == 0:
            expected_raw = min(expected_raw, 50.0)
        expected = round(expected_raw, 1)

        assert mqs == expected

    # Task 4.11: Property 7: MQS Spoiled Beef Constraint
    # Validates: Requirements 8.3
    @settings(max_examples=200)
    @given(
        marbling_score=st.sampled_from([10, 15, 20, 25, 30]),
        fat_ratio=st.floats(min_value=0.0, max_value=100.0, allow_nan=False, allow_infinity=False),
    )
    def test_property_7_spoiled_beef_mqs_cap(self, marbling_score: int, fat_ratio: float):
        """Property 7: When freshness is spoiled (freshness_score=0), MQS never exceeds 50.0."""
        mqs = calculate_mqs(freshness_score=0, marbling_score=marbling_score, fat_ratio=fat_ratio)
        assert mqs <= 50.0
