import json
import subprocess
import sys
from pathlib import Path

import pandas as pd


def test_cli_outputs_forecast_and_metrics(tmp_path: Path):
    csv_path = tmp_path / "series.csv"
    pd.DataFrame({"value": [10, 12, 13, 15, 18, 21, 23, 24, 26, 29]}).to_csv(csv_path, index=False)

    result = subprocess.run(
        [sys.executable, "main.py", str(csv_path), "--column", "value", "--order", "1,1,0", "--steps", "3", "--test-size", "2"],
        check=True,
        capture_output=True,
        text=True,
    )

    payload = json.loads(result.stdout)
    assert payload["column"] == "value"
    assert payload["order"] == [1, 1, 0]
    assert len(payload["forecast"]) == 3
    assert set(payload["metrics"]) == {"mae", "mse", "rmse"}
    assert all(value >= 0 for value in payload["metrics"].values())
