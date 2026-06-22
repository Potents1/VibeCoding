from __future__ import annotations

import numpy as np
import pytest

from src.arima_model import ARIMAModel


def test_arima_model_forecasts_requested_steps() -> None:
    series = np.arange(1, 25, dtype=float)

    model = ARIMAModel(order=(1, 1, 0)).fit(series)
    forecast = model.forecast(steps=4)

    assert forecast.shape == (4,)
    assert np.isfinite(forecast).all()


def test_arima_model_requires_fit_before_forecast() -> None:
    model = ARIMAModel(order=(1, 0, 0))

    with pytest.raises(RuntimeError, match="fit"):
        model.forecast(1)


def test_arima_model_validates_inputs() -> None:
    with pytest.raises(ValueError, match="order"):
        ARIMAModel(order=(1, -1, 0))

    with pytest.raises(ValueError, match="three observations"):
        ARIMAModel(order=(1, 0, 0)).fit([1.0, 2.0])

    model = ARIMAModel(order=(1, 0, 0)).fit([1, 2, 3, 4, 5])
    with pytest.raises(ValueError, match="positive integer"):
        model.forecast(0)
