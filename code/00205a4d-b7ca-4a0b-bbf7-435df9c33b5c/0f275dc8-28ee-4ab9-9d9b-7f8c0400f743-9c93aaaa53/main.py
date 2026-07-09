"""Command-line ARIMA forecasting pipeline.

This module provides a small runnable example around the reusable ARIMA
implementation in ``src.arima_model``. It can load a CSV with a numeric time
series or fall back to a deterministic synthetic series for smoke testing.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

import numpy as np
import pandas as pd

from src.arima_model import ARIMAForecaster
from src.performance_metrics import evaluate_forecast


def _build_demo_series(length: int = 72) -> pd.Series:
    """Create a deterministic non-trivial time series for demos and tests."""
    rng = np.random.default_rng(42)
    trend = np.linspace(10.0, 16.0, length)
    seasonal = 1.5 * np.sin(np.arange(length) * 2 * np.pi / 12)
    noise = rng.normal(0.0, 0.25, length)
    index = pd.date_range("2020-01-01", periods=length, freq="MS")
    return pd.Series(trend + seasonal + noise, index=index, name="value")


def _load_series(csv_path: str | None, column: str | None) -> pd.Series:
    if csv_path is None:
        return _build_demo_series()

    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    frame = pd.read_csv(path)
    if frame.empty:
        raise ValueError("CSV file is empty")

    numeric_columns = frame.select_dtypes(include=["number"]).columns
    if column is None and len(numeric_columns) == 0:
        raise ValueError("CSV file must contain at least one numeric column")

    value_column = column or numeric_columns[0]
    if value_column not in frame.columns:
        raise ValueError(f"Column '{value_column}' was not found in {path}")

    series = pd.to_numeric(frame[value_column], errors="coerce").dropna()
    if len(series) < 8:
        raise ValueError("ARIMA forecasting requires at least 8 numeric observations")
    series.name = value_column
    return series.reset_index(drop=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values.")
    parser.add_argument("--csv", help="Optional CSV file containing a numeric time series.")
    parser.add_argument("--column", help="Numeric column to forecast. Defaults to the first numeric column.")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=6, help="Number of future periods to forecast.")
    parser.add_argument("--test-size", type=int, default=12, help="Holdout size used for evaluation.")
    return parser


def _parse_order(raw: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part.strip()) for part in raw.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("--order must contain integers, e.g. 1,1,1") from exc
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise argparse.ArgumentTypeError("--order must be three non-negative integers, e.g. 1,1,1")
    return parts


def run(argv: Sequence[str] | None = None) -> dict[str, object]:
    args = build_parser().parse_args(argv)
    order = _parse_order(args.order)
    if args.steps <= 0:
        raise ValueError("--steps must be positive")
    if args.test_size <= 0:
        raise ValueError("--test-size must be positive")

    series = _load_series(args.csv, args.column)
    if args.test_size >= len(series):
        raise ValueError("--test-size must be smaller than the number of observations")

    train = series.iloc[:-args.test_size]
    test = series.iloc[-args.test_size:]

    forecaster = ARIMAForecaster(order=order)
    forecaster.fit(train)
    holdout_forecast = forecaster.forecast(len(test))
    metrics = evaluate_forecast(test, holdout_forecast)

    forecaster.fit(series)
    future_forecast = forecaster.forecast(args.steps)

    result = {
        "order": order,
        "observations": int(len(series)),
        "holdout_metrics": metrics,
        "forecast": [float(value) for value in future_forecast],
    }
    print(json.dumps(result, indent=2))
    return result


if __name__ == "__main__":
    run()
