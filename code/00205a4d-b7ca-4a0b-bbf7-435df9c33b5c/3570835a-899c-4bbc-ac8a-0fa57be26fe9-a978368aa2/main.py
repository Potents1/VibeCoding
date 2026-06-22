"""Command-line entry point for ARIMA forecasting experiments."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable

import numpy as np
import pandas as pd

from src.arima_model import ARIMAForecaster
from src.performance_metrics import evaluate_forecast


def _parse_order(value: str) -> tuple[int, int, int]:
    parts = value.split(",")
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("order must have the form p,d,q")
    try:
        order = tuple(int(part.strip()) for part in parts)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("order values must be integers") from exc
    if any(part < 0 for part in order):
        raise argparse.ArgumentTypeError("order values must be non-negative")
    return order  # type: ignore[return-value]


def _load_series(path: Path, column: str | None = None) -> pd.Series:
    if not path.exists():
        raise FileNotFoundError(f"Input file not found: {path}")

    frame = pd.read_csv(path)
    if frame.empty:
        raise ValueError("Input CSV is empty")

    selected_column = column
    if selected_column is None:
        numeric_columns = list(frame.select_dtypes(include=[np.number]).columns)
        if not numeric_columns:
            raise ValueError("Input CSV must contain at least one numeric column")
        selected_column = numeric_columns[0]

    if selected_column not in frame.columns:
        raise ValueError(f"Column not found in CSV: {selected_column}")

    series = pd.to_numeric(frame[selected_column], errors="coerce").dropna()
    if len(series) < 3:
        raise ValueError("Selected series must contain at least 3 numeric observations")
    return pd.Series(series.to_numpy(dtype=float), name=selected_column)


def _series_from_values(values: Iterable[float]) -> pd.Series:
    series = pd.Series([float(value) for value in values], name="value")
    if len(series) < 3:
        raise ValueError("At least 3 observations are required")
    return series


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values.")
    source = parser.add_mutually_exclusive_group(required=False)
    source.add_argument("--csv", type=Path, help="CSV file containing the time series")
    source.add_argument(
        "--values",
        nargs="+",
        type=float,
        help="Inline numeric series, for example: --values 1 2 3 4 5",
    )
    parser.add_argument("--column", help="CSV column to use; defaults to the first numeric column")
    parser.add_argument("--order", type=_parse_order, default=(1, 1, 0), help="ARIMA order as p,d,q")
    parser.add_argument("--steps", type=int, default=3, help="Number of periods to forecast")
    parser.add_argument(
        "--test-size",
        type=int,
        default=0,
        help="Optional holdout size for forecast metrics",
    )
    return parser


def run(args: argparse.Namespace) -> dict[str, object]:
    if args.steps <= 0:
        raise ValueError("steps must be positive")
    if args.test_size < 0:
        raise ValueError("test-size must be non-negative")

    if args.csv is not None:
        series = _load_series(args.csv, args.column)
    elif args.values is not None:
        series = _series_from_values(args.values)
    else:
        series = _series_from_values([112, 118, 132, 129, 121, 135, 148, 148, 136, 119, 104, 118])

    metrics = None
    train_series = series
    if args.test_size:
        if args.test_size >= len(series):
            raise ValueError("test-size must be smaller than the series length")
        train_series = series.iloc[:-args.test_size]
        test_series = series.iloc[-args.test_size:]
        holdout_model = ARIMAForecaster(order=args.order).fit(train_series)
        holdout_forecast = holdout_model.forecast(args.test_size)
        metrics = evaluate_forecast(test_series, holdout_forecast)

    forecaster = ARIMAForecaster(order=args.order).fit(train_series)
    forecast = forecaster.forecast(args.steps)
    return {
        "order": list(args.order),
        "observations": int(len(series)),
        "forecast": [float(value) for value in forecast],
        "metrics": metrics,
    }


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    result = run(args)
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
