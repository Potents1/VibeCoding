import pytest

from src.arima_model import ARIMAModel


def test_arima_random_walk_with_drift_forecasts_linear_growth():
    series = [10, 12, 14, 16, 18, 20]
    model = ARIMAModel(order=(0, 1, 0)).fit(series)

    assert model.forecast(3) == pytest.approx([22, 24, 26])
    assert model.predict(2) == pytest.approx([22, 24])


def test_autoregressive_model_learns_simple_ar_one_pattern():
    series = [1, 2, 4, 8, 16, 32]
    model = ARIMAModel(order=(1, 0, 0)).fit(series)

    forecast = model.forecast(2)

    assert len(forecast) == 2
    assert forecast[0] > series[-1]
    assert forecast[1] > forecast[0]


def test_model_validates_order_and_data():
    with pytest.raises(ValueError, match="non-negative"):
        ARIMAModel(order=(-1, 0, 0))

    with pytest.raises(ValueError, match="observations"):
        ARIMAModel(order=(2, 1, 0)).fit([1, 2, 3])

    model = ARIMAModel(order=(1, 0, 0))
    with pytest.raises(RuntimeError, match="fitted"):
        model.forecast(1)

    with pytest.raises(ValueError, match="finite"):
        model.fit([1, float("nan"), 3])
