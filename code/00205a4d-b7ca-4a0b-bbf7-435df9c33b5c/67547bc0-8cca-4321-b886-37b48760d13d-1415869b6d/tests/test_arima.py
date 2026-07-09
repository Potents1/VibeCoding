import numpy as np
import pandas as pd
import pytest

from main import load_series, parse_order
from src.performance_metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error


def test_parse_order_accepts_three_non_negative_ints():
    assert parse_order("2,1,0") == (2, 1, 0)


def test_parse_order_rejects_invalid_values():
    with pytest.raises(Exception):
        parse_order("1,-1,0")


def test_load_series_uses_first_numeric_column(tmp_path):
    csv = tmp_path / "data.csv"
    pd.DataFrame({"name": ["a", "b", "c"], "value": [1, 2, 3]}).to_csv(csv, index=False)

    series = load_series(str(csv))

    assert series.tolist() == [1, 2, 3]


def test_metrics_calculate_expected_values():
    actual = [3, -0.5, 2, 7]
    predicted = [2.5, 0, 2, 8]

    assert mean_absolute_error(actual, predicted) == pytest.approx(0.5)
    assert mean_squared_error(actual, predicted) == pytest.approx(0.375)
    assert root_mean_squared_error(actual, predicted) == pytest.approx(np.sqrt(0.375))


def test_metrics_reject_mismatched_lengths():
    with pytest.raises(ValueError, match="same shape"):
        mean_absolute_error([1, 2], [1])
