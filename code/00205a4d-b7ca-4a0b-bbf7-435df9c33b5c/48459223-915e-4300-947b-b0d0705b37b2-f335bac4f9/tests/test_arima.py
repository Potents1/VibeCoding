from __future__ import annotations

import numpy as np

from main import run


def test_cli_demo_pipeline_returns_metrics_and_forecast(capsys):
    result = run(["--steps", "3", "--test-size", "8", "--order", "1,1,1"])

    captured = capsys.readouterr()
    assert '"forecast"' in captured.out
    assert result["observations"] == 72
    assert len(result["forecast"]) == 3
    assert np.isfinite(result["forecast"]).all()
    assert set(result["holdout_metrics"]) == {"mae", "rmse", "mape"}
    assert all(value >= 0 for value in result["holdout_metrics"].values())
