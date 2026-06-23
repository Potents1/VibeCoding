import numpy as np
import pytest

from src.arima_model import ARIMAForecaster
from main import _parse_order


def test_arima_forecaster_fits_and_forecasts():
    series = np.arange(1, 30, dtype=float)
    forecaster = ARIMAForecaster(order=(1, 1, 0)).fit(series)

    forecast = forecaster.forecast(steps=3)

    assert forecast.shape == (3,)
    assert np.isfinite(forecast).all()


def test_forecast_requires_fit():
    with pytest.raises(RuntimeError, match="fit must be called"):
        ARIMAForecaster().forecast()


def test_invalid_order_rejected():
    with pytest.raises(ValueError):
        ARIMAForecaster(order=(1, -1, 0))


def test_parse_order():
    assert _parse_order("2,1,0") == (2, 1, 0)
