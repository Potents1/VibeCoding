import json
import math

import pytest

from main import main
from src.performance_metrics import mean_absolute_error, mean_absolute_percentage_error, root_mean_squared_error


def test_regression_metrics_are_deterministic():
    actual = [10, 20, 30]
    predicted = [12, 18, 33]

    assert mean_absolute_error(actual, predicted) == pytest.approx(7 / 3)
    assert root_mean_squared_error(actual, predicted) == pytest.approx(math.sqrt(17 / 3))
    assert mean_absolute_percentage_error(actual, predicted) == pytest.approx(((0.2 + 0.1 + 0.1) / 3) * 100)


def test_metrics_validate_input_shapes():
    with pytest.raises(ValueError, match="same shape"):
        mean_absolute_error([1, 2], [1])


def test_mape_rejects_all_zero_actuals():
    with pytest.raises(ValueError, match="undefined"):
        mean_absolute_percentage_error([0, 0], [1, 2])


def test_cli_outputs_forecast_records(monkeypatch, capsys):
    monkeypatch.setattr("sys.argv", ["main.py", "--steps", "2"])

    main()

    payload = json.loads(capsys.readouterr().out)
    assert payload["model"]["order"] == [1, 1, 1]
    assert len(payload["forecast"]) == 2
    assert set(payload["forecast"][0]) == {"step", "forecast", "lower_ci", "upper_ci"}
