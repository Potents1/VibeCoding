import pandas as pd
import argparse
import sys
from pathlib import Path


from src.arima_model import ARIMAForecaster, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error


def load_series(path: str, column: str | None = None) -> pd.Series:
    """Load a numeric time series from a CSV file."""
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    frame = pd.read_csv(csv_path)
    if frame.empty:
        raise ValueError("CSV file is empty")

    if column is None:
        numeric_columns = frame.select_dtypes(include="number").columns.tolist()
        if not numeric_columns:
            raise ValueError("CSV must contain at least one numeric column")
        column = numeric_columns[0]

    if column not in frame.columns:
        raise ValueError(f"Column '{column}' was not found in CSV")

    series = pd.to_numeric(frame[column], errors="coerce").dropna()
    if series.empty:
        raise ValueError(f"Column '{column}' does not contain numeric values")
    return series.reset_index(drop=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast a univariate time series.")
    parser.add_argument("csv", nargs="?", default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Numeric column to model. Defaults to first numeric column.")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of forecast steps. Default: 5")
    parser.add_argument("--test-size", type=int, default=0, help="Holdout observations for metric reporting")
    return parser


def parse_order(value: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part.strip()) for part in value.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Order must contain integers, e.g. 1,1,1") from exc
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise argparse.ArgumentTypeError("Order must be three non-negative integers, e.g. 1,1,1")
    return parts


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        order = parse_order(args.order)
        if args.csv is None:
            series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name='btc_close_price_usd')
        else:
            series = load_series(args.csv, args.column)
        if args.steps <= 0:
            raise ValueError("--steps must be positive")
        if args.test_size < 0:
            raise ValueError("--test-size cannot be negative")
        if args.test_size >= len(series):
            raise ValueError("--test-size must be smaller than the series length")

        forecaster = ARIMAForecaster(order=order)
        if args.test_size:
            train = series.iloc[:-args.test_size]
            test = series.iloc[-args.test_size:]
            forecaster.fit(train)
            predictions = forecaster.forecast(args.test_size)
            print(f"MAE: {mean_absolute_error(test, predictions):.6f}")
            print(f"MSE: {mean_squared_error(test, predictions):.6f}")
            print(f"RMSE: {root_mean_squared_error(test, predictions):.6f}")
            forecaster.fit(series)
        else:
            forecaster.fit(series)

        forecast = forecaster.forecast(args.steps)
        print("Forecast:")
        for index, value in enumerate(forecast, start=1):
            print(f"{index}: {value:.6f}")
        return 0
    except Exception as exc:  # pragma: no cover - CLI boundary
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
