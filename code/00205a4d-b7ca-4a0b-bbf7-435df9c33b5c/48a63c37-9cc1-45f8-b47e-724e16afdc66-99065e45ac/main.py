import pandas as pd
import argparse
import sys
from pathlib import Path


from src.arima_model import ARIMAForecaster, BITCOIN_SAMPLE_CLOSE_PRICES_USD
from src.performance_metrics import mean_absolute_percentage_error, regression_metrics


def _load_series(csv_path: str, column: str | None = None) -> pd.Series:
    path = Path(csv_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    frame = pd.read_csv(path)
    if frame.empty:
        raise ValueError("CSV file is empty")

    if column is None:
        numeric_columns = frame.select_dtypes(include="number").columns.tolist()
        if not numeric_columns:
            raise ValueError("CSV must contain at least one numeric column, or pass --column")
        column = numeric_columns[0]

    if column not in frame.columns:
        raise ValueError(f"Column '{column}' not found in CSV")

    series = pd.to_numeric(frame[column], errors="coerce").dropna()
    if series.empty:
        raise ValueError(f"Column '{column}' has no numeric values")
    return series.reset_index(drop=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fit an ARIMA model and forecast a univariate time series.")
    parser.add_argument("csv", nargs="?", default=None, help="Optional CSV input data; omitted uses bundled Bitcoin close-price sample data.")
    parser.add_argument("--column", help="Name of the numeric column to model. Defaults to first numeric column.")
    parser.add_argument("--order", default="1,1,1", help="ARIMA order as p,d,q. Default: 1,1,1")
    parser.add_argument("--steps", type=int, default=5, help="Number of future periods to forecast. Default: 5")
    parser.add_argument("--test-size", type=int, default=0, help="Optional holdout size for metrics before final forecast.")
    return parser


def _parse_order(value: str) -> tuple[int, int, int]:
    try:
        parts = tuple(int(part.strip()) for part in value.split(","))
    except ValueError as exc:
        raise argparse.ArgumentTypeError("--order must be three integers like 1,1,1") from exc
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise argparse.ArgumentTypeError("--order must be three non-negative integers like 1,1,1")
    return parts  # type: ignore[return-value]


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        order = _parse_order(args.order)
        if args.csv is None:
            series = pd.Series(BITCOIN_SAMPLE_CLOSE_PRICES_USD, name='btc_close_price_usd')
        else:
            series = _load_series(args.csv, args.column)
        model = ARIMAForecaster(order=order)

        if args.test_size:
            if args.test_size >= len(series):
                raise ValueError("--test-size must be smaller than the number of observations")
            train = series.iloc[:-args.test_size]
            test = series.iloc[-args.test_size:]
            predictions = model.fit(train).forecast(args.test_size)
            metrics = regression_metrics(test, predictions)
            metrics["mape"] = mean_absolute_percentage_error(test, predictions)
            print("Holdout metrics:")
            for name, value in metrics.items():
                print(f"  {name}: {value:.6g}")

        forecast = ARIMAForecaster(order=order).fit(series).forecast(args.steps)
        print("Forecast:")
        for idx, value in enumerate(forecast, start=1):
            print(f"  t+{idx}: {value:.6g}")
        return 0
    except Exception as exc:  # pragma: no cover - exercised by CLI users
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
