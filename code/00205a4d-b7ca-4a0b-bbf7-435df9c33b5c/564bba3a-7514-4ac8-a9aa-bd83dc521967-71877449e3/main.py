"""Command-line entrypoint for ARIMA forecasting."""

from __future__ import annotations

import pandas as pd
import argparse
import json
from pathlib import Path


from src.arima_model import ARIMAForecaster, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import (
    mean_absolute_error,
    mean_absolute_percentage_error,
    root_mean_squared_error,
)


def _load_series(path: Path, column: str | None) -> pd.Series:
    data = pd.read_csv(path)
    if column is None:
        numeric_columns = data.select_dtypes(include="number").columns.tolist()
        if not numeric_columns:
            raise ValueError("CSV must contain at least one numeric column, or pass --column")
        column = numeric_columns[0]
    if column not in data.columns:
        raise ValueError(f"Column '{column}' not found in {path}")
    return pd.Series(data[column].dropna().astype(float).to_numpy(), name=column)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values from a CSV time series.")
    parser.add_argument("csv", nargs="?", type=Path, default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Numeric column to model. Defaults to the first numeric column.")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of periods to forecast")
    parser.add_argument("--test-size", type=int, default=0, help="Optional trailing observations to reserve for metrics")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    order = tuple(int(part.strip()) for part in args.order.split(","))
    if len(order) != 3:
        raise ValueError("--order must contain exactly three comma-separated integers")

    if args.csv is None:
        series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name="btc_close_price_usd")
    else:
        series = _load_series(args.csv, args.column)

    if args.test_size:
        if args.test_size >= len(series):
            raise ValueError("--test-size must be smaller than the series length")
        train = series.iloc[:-args.test_size]
        test = series.iloc[-args.test_size:]
    else:
        train = series
        test = None

    model = ARIMAForecaster(order=order)
    model.fit(train)
    forecast = model.forecast(args.steps)

    result: dict[str, object] = {"forecast": [float(value) for value in forecast]}
    if test is not None:
        predictions = model.forecast(len(test))
        result["metrics"] = {
            "mae": mean_absolute_error(test, predictions),
            "rmse": root_mean_squared_error(test, predictions),
            "mape": mean_absolute_percentage_error(test, predictions),
        }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
