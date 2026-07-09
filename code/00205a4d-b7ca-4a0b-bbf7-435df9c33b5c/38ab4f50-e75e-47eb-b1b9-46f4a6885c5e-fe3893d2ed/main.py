import pandas as pd
import argparse
import json
from pathlib import Path


from src.arima_model import ARIMAForecaster, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mean_absolute_error, mean_squared_error, root_mean_squared_error


def load_series(path: str, column: str | None = None) -> pd.Series:
    data_path = Path(path)
    if not data_path.exists():
        raise FileNotFoundError(f"Input file not found: {data_path}")

    if data_path.suffix.lower() == ".json":
        frame = pd.read_json(data_path)
    else:
        frame = pd.read_csv(data_path)

    if frame.empty:
        raise ValueError("Input data is empty")

    if column is None:
        numeric_columns = frame.select_dtypes(include="number").columns.tolist()
        if not numeric_columns:
            raise ValueError("No numeric column found. Pass --column explicitly.")
        column = numeric_columns[0]

    if column not in frame.columns:
        raise ValueError(f"Column '{column}' not found in input data")

    series = pd.to_numeric(frame[column], errors="coerce").dropna()
    if series.empty:
        raise ValueError(f"Column '{column}' does not contain numeric values")
    return series.reset_index(drop=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast future values.")
    parser.add_argument("input", nargs="?", default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Name of the numeric column to model")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of future points to forecast")
    parser.add_argument("--test-size", type=int, default=0, help="Optional holdout size for metrics")
    return parser


def parse_order(value: str) -> tuple[int, int, int]:
    parts = value.split(",")
    if len(parts) != 3:
        raise argparse.ArgumentTypeError("order must have exactly three comma-separated integers")
    try:
        order = tuple(int(part.strip()) for part in parts)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("order must contain integers") from exc
    if any(part < 0 for part in order):
        raise argparse.ArgumentTypeError("order values must be non-negative")
    return order  # type: ignore[return-value]


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    order = parse_order(args.order)
    if args.input is None:
        series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name='btc_close_price_usd')
    else:
        series = load_series(args.input, args.column)

    if args.test_size < 0:
        raise ValueError("--test-size must be non-negative")
    if args.test_size and args.test_size >= len(series):
        raise ValueError("--test-size must be smaller than the series length")

    if args.test_size:
        train = series.iloc[:-args.test_size]
        test = series.iloc[-args.test_size:]
        model = ARIMAForecaster(order=order).fit(train)
        predictions = model.forecast(args.test_size)
        metrics = {
            "mae": mean_absolute_error(test, predictions),
            "mse": mean_squared_error(test, predictions),
            "rmse": root_mean_squared_error(test, predictions),
        }
        final_model = ARIMAForecaster(order=order).fit(series)
    else:
        metrics = None
        final_model = ARIMAForecaster(order=order).fit(series)

    forecast = final_model.forecast(args.steps)
    result = {"forecast": forecast.tolist(), "order": list(order)}
    if metrics is not None:
        result["metrics"] = metrics
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
