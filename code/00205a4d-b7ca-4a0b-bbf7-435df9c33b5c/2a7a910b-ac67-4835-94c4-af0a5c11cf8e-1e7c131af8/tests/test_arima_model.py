import numpy as np
import pandas as pd

from src.arima_model import ARIMAForecaster


def test_arima_forecast_returns_requested_steps():
    series = pd.Series(np.linspace(10, 25, 30))
    model = ARIMAForecaster(order=(1, 1, 0)).fit(series)

    forecast = model.forecast(steps=4)

    assert len(forecast) == 4
    assert forecast.name == "forecast"
    assert np.isfinite(forecast.to_numpy()).all()


def test_fitted_values_match_training_length():
    series = pd.Series(np.arange(1, 25, dtype=float))
    model = ARIMAForecaster(order=(1, 1, 0)).fit(series)

    fitted = model.fitted_values()

    assert len(fitted) == len(series)
    assert np.isfinite(fitted.to_numpy()).all()
