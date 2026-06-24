"""Command-line entrypoint for ARIMA forecasting demos."""

from __future__ import annotations

import pandas as pd
import argparse
import json
from pathlib import Path


from src.arima_model import ARIMAForecaster, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error


def _load_series(path: str, column: str | None = None) -> pd.Series:
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"Input CSV not found: {csv_path}")

    data = pd.read_csv(csv_path)
    if data.empty:
        raise ValueError("Input CSV is empty")

    if column is None:
        numeric_columns = data.select_dtypes(include="number").columns.tolist()
        if not numeric_columns:
            raise ValueError("No numeric columns found; pass --column explicitly")
        column = numeric_columns[0]

    if column not in data.columns:
        raise ValueError(f"Column {column!r} not found in CSV")

    series = pd.to_numeric(data[column], errors="coerce").dropna()
    if len(series) < 3:
        raise ValueError("Series must contain at least 3 numeric values")
    return pd.Series(series.to_numpy(), name=column)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values.")
    parser.add_argument("csv", nargs="?", default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Numeric column to forecast; defaults to the first numeric column")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of periods to forecast")
    parser.add_argument("--test-size", type=int, default=0, help="Optional holdout size for metrics")
    return parser


def _parse_order(value: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part.strip()) for part in value.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Order must be comma-separated integers, e.g. 1,1,1") from exc
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise argparse.ArgumentTypeError("Order must contain exactly three non-negative integers")
    return parts  # type: ignore[return-value]


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    order = _parse_order(args.order)

    if args.csv is None:
        series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name='btc_close_price_usd')
    else:
        series = _load_series(args.csv, args.column)
    test_size = args.test_size
    if test_size < 0:
        raise ValueError("--test-size must be non-negative")
    if test_size >= len(series):
        raise ValueError("--test-size must be smaller than the series length")

    if test_size:
        train = series.iloc[:-test_size]
        test = series.iloc[-test_size:]
        forecaster = ARIMAForecaster(order=order).fit(train)
        predictions = forecaster.forecast(test_size)
        metrics = {
            "mae": mean_absolute_error(test, predictions),
            "mse": mean_squared_error(test, predictions),
            "rmse": root_mean_squared_error(test, predictions),
        }
        forecast = ARIMAForecaster(order=order).fit(series).forecast(args.steps)
    else:
        forecaster = ARIMAForecaster(order=order).fit(series)
        metrics = None
        forecast = forecaster.forecast(args.steps)

    output = {
        "column": series.name,
        "order": order,
        "steps": args.steps,
        "forecast": forecast.tolist(),
        "metrics": metrics,
    }
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
