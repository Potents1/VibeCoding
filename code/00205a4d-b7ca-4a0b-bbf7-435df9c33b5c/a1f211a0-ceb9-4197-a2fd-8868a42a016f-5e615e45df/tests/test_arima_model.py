import numpy as np
import pytest

from src.arima_model import ARIMAForecaster


def test_forecaster_requires_fit_before_forecast():
    forecaster = ARIMAForecaster(order=(1, 0, 0))

    with pytest.raises(RuntimeError, match="fit"):
        forecaster.forecast(1)


def test_forecaster_fits_and_forecasts_requested_steps():
    values = np.array([10, 12, 13, 15, 18, 21, 22, 25, 27, 30], dtype=float)
    forecaster = ARIMAForecaster(order=(1, 1, 0)).fit(values)

    forecast = forecaster.forecast(3)

    assert forecast.shape == (3,)
    assert np.isfinite(forecast).all()


def test_forecaster_rejects_short_series():
    with pytest.raises(ValueError, match="at least three"):
        ARIMAForecaster().fit([1, 2])


def test_forecaster_rejects_invalid_steps():
    forecaster = ARIMAForecaster(order=(1, 0, 0)).fit([1, 2, 3, 4])

    with pytest.raises(ValueError, match="positive"):
        forecaster.forecast(0)
