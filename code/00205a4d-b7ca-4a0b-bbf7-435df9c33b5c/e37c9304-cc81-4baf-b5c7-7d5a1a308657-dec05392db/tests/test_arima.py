from __future__ import annotations

import pytest

from main import _parse_order
from src.performance_metrics import mean_absolute_error, root_mean_squared_error


def test_metrics_compute_expected_values() -> None:
    actual = [3.0, 5.0, 7.0]
    predicted = [2.0, 5.0, 10.0]

    assert mean_absolute_error(actual, predicted) == pytest.approx(4.0 / 3.0)
    assert root_mean_squared_error(actual, predicted) == pytest.approx((10.0 / 3.0) ** 0.5)


def test_metrics_reject_bad_inputs() -> None:
    with pytest.raises(ValueError, match="same shape"):
        mean_absolute_error([1, 2], [1])
    with pytest.raises(ValueError, match="must not be empty"):
        root_mean_squared_error([], [])
    with pytest.raises(ValueError, match="finite"):
        mean_absolute_error([1, float("nan")], [1, 2])


def test_parse_order() -> None:
    assert _parse_order("2,1,0") == (2, 1, 0)
    with pytest.raises(Exception, match="three non-negative"):
        _parse_order("1,-1,0")
