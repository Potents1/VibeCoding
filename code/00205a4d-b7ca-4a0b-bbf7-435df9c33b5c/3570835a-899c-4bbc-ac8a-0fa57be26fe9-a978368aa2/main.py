"""Command-line entrypoint for a small ARIMA-style forecasting pipeline."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

from src.arima_model import ARIMAModel, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mae, mse, rmse


def read_series(path: Path, column: str | None = None) -> list[float]:
    with path.open("r", newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("CSV file must include a header row")

        selected = column or reader.fieldnames[-1]
        if selected not in reader.fieldnames:
            raise ValueError(f"Column {selected!r} not found in CSV header")

        values: list[float] = []
        for row_number, row in enumerate(reader, start=2):
            raw = row.get(selected, "")
            if raw is None or raw.strip() == "":
                continue
            try:
                values.append(float(raw))
            except ValueError as exc:
                raise ValueError(f"Non-numeric value in row {row_number}: {raw!r}") from exc

    if not values:
        raise ValueError("No numeric values found")
    return values


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA-style model and forecast future values.")
    parser.add_argument("csv", nargs="?", type=Path, default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Column to forecast. Defaults to the last CSV column.")
    parser.add_argument("--order", default="1,1,0", help="ARIMA order as p,d,q. q is accepted for API compatibility.")
    parser.add_argument("--steps", type=int, default=5, help="Number of future values to forecast")
    parser.add_argument("--test-size", type=int, default=0, help="Hold out the last N observations for metrics")
    return parser


def parse_order(value: str) -> tuple[int, int, int]:
    parts = value.split(",")
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("order must have the form p,d,q")
    try:
        p, d, q = (int(part.strip()) for part in parts)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("order values must be integers") from exc
    return p, d, q


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    order = parse_order(args.order)
    if args.csv is None:
        series = list(BITCOIN_SAMPLE_CLOSE_PRICES_USD)
    else:
        series = read_series(args.csv, args.column)

    if args.test_size < 0:
        parser.error("--test-size must be non-negative")
    if args.test_size >= len(series):
        parser.error("--test-size must be smaller than the series length")

    train = series[:-args.test_size] if args.test_size else series
    actual = series[-args.test_size:] if args.test_size else []

    model = ARIMAModel(order=order).fit(train)

    if actual:
        predictions = model.forecast(len(actual))
        print(f"MAE: {mae(actual, predictions):.6f}")
        print(f"MSE: {mse(actual, predictions):.6f}")
        print(f"RMSE: {rmse(actual, predictions):.6f}")
        model.fit(series)

    forecast = model.forecast(args.steps)
    print("Forecast:")
    for index, value in enumerate(forecast, start=1):
        print(f"{index}: {value:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
import pandas as pd
