"""Command-line entrypoint for fitting and evaluating an ARIMA model."""

from __future__ import annotations

import pandas as pd
import argparse
from pathlib import Path
from typing import Sequence

import numpy as np

from src.arima_model import ARIMAModel, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mean_absolute_error, root_mean_squared_error


def _load_series(path: str, column: str | None = None) -> pd.Series:
    """Load a numeric time series from a CSV file."""
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    frame = pd.read_csv(csv_path)
    if frame.empty:
        raise ValueError("CSV file is empty")

    if column is None:
        numeric_columns = frame.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_columns:
            raise ValueError("CSV file does not contain a numeric column")
        column = numeric_columns[0]
    elif column not in frame.columns:
        raise ValueError(f"Column '{column}' not found in CSV")

    series = pd.to_numeric(frame[column], errors="coerce").dropna()
    if series.empty:
        raise ValueError(f"Column '{column}' does not contain numeric values")
    return series.reset_index(drop=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values.")
    parser.add_argument("csv", nargs="?", default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Column name to model. Defaults to the first numeric column.")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of future periods to forecast")
    parser.add_argument(
        "--test-size",
        type=int,
        default=0,
        help="Optional holdout size for MAE/RMSE evaluation before final forecasting",
    )
    return parser


def _parse_order(raw: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part.strip()) for part in raw.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("order must contain integers, for example 1,1,1") from exc
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise argparse.ArgumentTypeError("order must be three non-negative integers: p,d,q")
    return parts  # type: ignore[return-value]


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    order = _parse_order(args.order)

    if args.csv is None:
        series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name='btc_close_price_usd')
    else:
        series = _load_series(args.csv, args.column)
    if args.test_size < 0:
        parser.error("--test-size must be non-negative")
    if args.test_size and args.test_size >= len(series):
        parser.error("--test-size must be smaller than the number of observations")

    if args.test_size:
        train = series.iloc[:-args.test_size]
        test = series.iloc[-args.test_size:]
        evaluation_model = ARIMAModel(order=order).fit(train)
        predictions = evaluation_model.forecast(args.test_size)
        print(f"MAE: {mean_absolute_error(test, predictions):.6f}")
        print(f"RMSE: {root_mean_squared_error(test, predictions):.6f}")

    model = ARIMAModel(order=order).fit(series)
    forecast = model.forecast(args.steps)
    print("Forecast:")
    for index, value in enumerate(forecast, start=1):
        print(f"{index}: {value:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
