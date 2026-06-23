import numpy as np

from src.performance_metrics import mean_absolute_percentage_error, regression_metrics, root_mean_squared_error


def test_regression_metrics_are_computed():
    metrics = regression_metrics([1, 2, 3], [1, 2, 4])

    assert metrics["mae"] == 1 / 3
    assert metrics["mse"] == 1 / 3
    assert np.isclose(metrics["rmse"], np.sqrt(1 / 3))
    assert np.isclose(metrics["r2"], 0.5)


def test_mape_ignores_zero_actuals():
    assert mean_absolute_percentage_error([0, 100, 200], [50, 110, 180]) == 10.0


def test_root_mean_squared_error():
    assert root_mean_squared_error([2, 4], [2, 6]) == np.sqrt(2)
