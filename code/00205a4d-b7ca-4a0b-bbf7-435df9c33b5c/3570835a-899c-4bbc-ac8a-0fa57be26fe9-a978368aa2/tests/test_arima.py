import pytest

from src.performance_metrics import mae, mape, mse, rmse


def test_metrics_return_expected_values():
    actual = [2, 4, 6]
    predicted = [1, 5, 7]

    assert mse(actual, predicted) == pytest.approx(1.0)
    assert mae(actual, predicted) == pytest.approx(1.0)
    assert rmse(actual, predicted) == pytest.approx(1.0)
    assert mape(actual, predicted) == pytest.approx(((0.5 + 0.25 + 1 / 6) / 3) * 100)


def test_metric_inputs_are_validated():
    with pytest.raises(ValueError, match="same shape"):
        mse([1, 2], [1])

    with pytest.raises(ValueError, match="must not be empty"):
        mae([], [])

    with pytest.raises(ValueError, match="undefined"):
        mape([0, 1], [1, 1])
