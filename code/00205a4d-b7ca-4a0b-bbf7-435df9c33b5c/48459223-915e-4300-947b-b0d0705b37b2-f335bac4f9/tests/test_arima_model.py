from __future__ import annotations

import numpy as np
import pytest

from src.arima_model import ARIMAForecaster
from src.performance_metrics import evaluate_forecast, mean_absolute_percentage_error


def test_arima_forecaster_fits_and_forecasts_expected_shape():
    series = np.linspace(1.0, 12.0, 36) + np.sin(np.arange(36) / 2.0)

    model = ARIMAForecaster(order=(1, 1, 1)).fit(series)
    forecast = model.forecast(5)

    assert forecast.shape == (5,)
    assert np.isfinite(forecast).all()


def test_forecast_requires_fit_first():
    model = ARIMAForecaster(order=(1, 0, 0))

    with pytest.raises(RuntimeError, match="fit must be called"):
        model.forecast(2)


def test_invalid_order_rejected():
    with pytest.raises(ValueError, match="order"):
        ARIMAForecaster(order=(1, -1, 1))


def test_evaluate_forecast_metrics_are_deterministic():
    metrics = evaluate_forecast([10, 20, 30], [12, 18, 33])

    assert metrics["mae"] == pytest.approx(7 / 3)
    assert metrics["rmse"] == pytest.approx(np.sqrt(17 / 3))
    assert metrics["mape"] == pytest.approx(((2 / 10) + (2 / 20) + (3 / 30)) / 3 * 100)


def test_mape_ignores_zero_actuals_when_possible():
    assert mean_absolute_percentage_error([0, 10], [5, 12]) == pytest.approx(20.0)
