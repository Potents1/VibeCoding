import pytest

from src.arima_model import ARIMAForecaster
from src.performance_metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    root_mean_squared_error,
)


def test_forecast_requires_fit_first():
    model = ARIMAForecaster(order=(1, 1, 0))

    with pytest.raises(RuntimeError, match="fit must be called"):
        model.forecast(1)


def test_rejects_invalid_order():
    with pytest.raises(ValueError, match="non-negative integers"):
        ARIMAForecaster(order=(1, -1, 0))


def test_rejects_too_few_observations():
    model = ARIMAForecaster(order=(2, 1, 1))

    with pytest.raises(ValueError, match="observations"):
        model.fit([1, 2, 3])


def test_performance_metrics():
    actual = [2, 4, 6]
    predicted = [1, 5, 7]

    assert mean_absolute_error(actual, predicted) == pytest.approx(1.0)
    assert mean_squared_error(actual, predicted) == pytest.approx(1.0)
    assert root_mean_squared_error(actual, predicted) == pytest.approx(1.0)
    assert mean_absolute_percentage_error(actual, predicted) == pytest.approx((0.5 + 0.25 + 1 / 6) / 3 * 100)


def test_metric_shape_validation():
    with pytest.raises(ValueError, match="same shape"):
        mean_absolute_error([1, 2], [1])


def test_mape_rejects_zero_actual():
    with pytest.raises(ValueError, match="undefined"):
        mean_absolute_percentage_error([0, 2], [1, 2])
