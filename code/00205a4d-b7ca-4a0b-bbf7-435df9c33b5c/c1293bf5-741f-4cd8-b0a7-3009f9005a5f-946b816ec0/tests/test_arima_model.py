import math

import pytest

from src.arima_model import ARIMAForecaster
from src.performance_metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error


def test_arima_forecaster_fit_forecast_returns_requested_steps():
    series = [3, 5, 8, 13, 21, 34, 55, 89]
    forecaster = ARIMAForecaster(order=(1, 1, 0)).fit(series)

    forecast = forecaster.forecast(steps=4)

    assert len(forecast) == 4
    assert forecast.name == "forecast"
    assert forecast.map(math.isfinite).all()


def test_arima_forecaster_validates_usage():
    with pytest.raises(ValueError, match="order"):
        ARIMAForecaster(order=(1, -1, 0))

    forecaster = ARIMAForecaster(order=(1, 1, 0))
    with pytest.raises(RuntimeError, match="fit"):
        forecaster.forecast()
    with pytest.raises(ValueError, match="at least 3"):
        forecaster.fit([1, 2])


def test_performance_metrics_are_correct():
    actual = [3, 5, 7]
    predicted = [2, 5, 10]

    assert mean_absolute_error(actual, predicted) == pytest.approx(4 / 3)
    assert mean_squared_error(actual, predicted) == pytest.approx(10 / 3)
    assert root_mean_squared_error(actual, predicted) == pytest.approx(math.sqrt(10 / 3))


def test_performance_metrics_validate_inputs():
    with pytest.raises(ValueError, match="same length"):
        mean_absolute_error([1, 2], [1])
    with pytest.raises(ValueError, match="cannot be empty"):
        mean_squared_error([], [])
