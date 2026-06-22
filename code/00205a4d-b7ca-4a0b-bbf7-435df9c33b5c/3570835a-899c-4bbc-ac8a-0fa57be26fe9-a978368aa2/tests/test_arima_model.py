import numpy as np
import pytest

from src.arima_model import ARIMAForecaster
from src.performance_metrics import evaluate_forecast, mean_absolute_percentage_error


def test_arima_forecaster_fit_forecast_returns_requested_steps():
    series = np.array([10, 12, 13, 15, 18, 21, 23, 25], dtype=float)
    forecast = ARIMAForecaster(order=(1, 1, 0)).fit_forecast(series, steps=3)

    assert forecast.shape == (3,)
    assert np.isfinite(forecast).all()


def test_arima_forecaster_requires_fit_before_forecast():
    with pytest.raises(RuntimeError, match="fit must be called"):
        ARIMAForecaster().forecast(1)


def test_arima_forecaster_validates_inputs():
    with pytest.raises(ValueError, match="at least 3"):
        ARIMAForecaster().fit([1, 2])
    with pytest.raises(ValueError, match="positive integer"):
        ARIMAForecaster().fit([1, 2, 3, 4]).forecast(0)
    with pytest.raises(ValueError, match="non-negative"):
        ARIMAForecaster(order=(1, -1, 0))


def test_evaluate_forecast_metrics_are_correct():
    metrics = evaluate_forecast([100, 200, 300], [110, 190, 330])

    assert metrics["mae"] == pytest.approx(50 / 3)
    assert metrics["mse"] == pytest.approx((100 + 100 + 900) / 3)
    assert metrics["rmse"] == pytest.approx(np.sqrt((100 + 100 + 900) / 3))
    assert metrics["mape"] == pytest.approx(((0.10 + 0.05 + 0.10) / 3) * 100)


def test_mape_ignores_zero_actuals_and_rejects_all_zero_actuals():
    assert mean_absolute_percentage_error([0, 10], [5, 12]) == pytest.approx(20.0)
    with pytest.raises(ValueError, match="undefined"):
        mean_absolute_percentage_error([0, 0], [1, 2])
