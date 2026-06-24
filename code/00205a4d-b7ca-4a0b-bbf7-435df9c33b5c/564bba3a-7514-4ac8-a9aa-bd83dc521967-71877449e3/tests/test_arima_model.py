import numpy as np
import pytest

from src.arima_model import ARIMAForecaster


def test_arima_forecaster_fits_and_forecasts_expected_shape():
    values = np.array([10, 12, 13, 15, 18, 21, 22, 24, 27, 30], dtype=float)

    model = ARIMAForecaster(order=(1, 1, 0)).fit(values)
    forecast = model.forecast(steps=3)

    assert forecast.shape == (3,)
    assert np.isfinite(forecast).all()


def test_forecast_requires_fit_first():
    with pytest.raises(RuntimeError, match="fit before forecasting"):
        ARIMAForecaster(order=(1, 1, 0)).forecast()


def test_invalid_order_is_rejected():
    with pytest.raises(ValueError, match="non-negative"):
        ARIMAForecaster(order=(-1, 1, 0)).fit([1, 2, 3, 4])


def test_forecast_steps_must_be_positive():
    model = ARIMAForecaster(order=(1, 0, 0)).fit([1, 2, 3, 4, 5])
    with pytest.raises(ValueError, match="at least 1"):
        model.forecast(0)
