from __future__ import annotations

import argparse
from datetime import date
from pathlib import Path

from .preparation import DateWindow, prepare_daily_data, read_ohlcv_csv, write_prepared_dataset
from .sources import download_yfinance_btc


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="btc-data")
    subparsers = parser.add_subparsers(dest="command", required=True)

    prepare = subparsers.add_parser("prepare", help="prepare daily Bitcoin OHLCV data")
    prepare.add_argument("--input", type=Path, help="CSV with date,open,high,low,close,volume columns")
    prepare.add_argument("--source", choices=["csv", "yfinance"], default="csv")
    prepare.add_argument("--output-dir", type=Path, default=Path("artifacts/data"))
    prepare.add_argument("--as-of", type=_parse_date, help="anchor date for last completed years")
    prepare.add_argument("--years", type=int, default=5)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "prepare":
        return _prepare(args)
    raise AssertionError(f"unhandled command: {args.command}")


def _prepare(args: argparse.Namespace) -> int:
    window = DateWindow.last_completed_years(as_of=args.as_of, years=args.years)
    if args.source == "yfinance":
        raw = download_yfinance_btc(window)
    else:
        if args.input is None:
            raise SystemExit("--input is required when --source csv")
        raw = read_ohlcv_csv(args.input)

    dataset = prepare_daily_data(raw, window)
    csv_path, manifest_path = write_prepared_dataset(dataset, args.output_dir)
    print(f"prepared_csv={csv_path}")
    print(f"manifest={manifest_path}")
    print(f"rows={dataset.manifest['rows']}")
    print(f"source_gap_days={dataset.manifest['source_gap_days']}")
    return 0


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


if __name__ == "__main__":
    raise SystemExit(main())
