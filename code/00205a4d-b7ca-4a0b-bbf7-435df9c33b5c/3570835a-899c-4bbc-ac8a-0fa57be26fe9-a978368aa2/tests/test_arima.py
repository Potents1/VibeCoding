import argparse
import json

import pytest

from main import _parse_order, run


def test_parse_order_accepts_three_non_negative_integers():
    assert _parse_order("2,1,3") == (2, 1, 3)


@pytest.mark.parametrize("raw", ["1,2", "1,x,2", "1,-1,0"])
def test_parse_order_rejects_invalid_values(raw):
    with pytest.raises(argparse.ArgumentTypeError):
        _parse_order(raw)


def test_cli_run_returns_forecast_with_default_series():
    args = argparse.Namespace(csv=None, values=None, column=None, order=(1, 1, 0), steps=2, test_size=0)
    result = run(args)

    assert result["order"] == [1, 1, 0]
    assert result["observations"] == 12
    assert len(result["forecast"]) == 2
    assert result["metrics"] is None
    json.dumps(result)


def test_cli_run_can_evaluate_holdout():
    args = argparse.Namespace(csv=None, values=[1, 2, 3, 4, 5, 6, 7, 8], column=None, order=(1, 1, 0), steps=2, test_size=2)
    result = run(args)

    assert len(result["forecast"]) == 2
    assert set(result["metrics"]) == {"mae", "mse", "rmse", "mape"}
