"""Bitcoin daily price loading and validation utilities.

The current goal requires historical daily Bitcoin data from the last five
completed calendar years. For this run date that means 2021-01-01 through
2025-12-31 inclusive. This module validates that contract instead of silently
backtesting on an unrelated partial sample.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Iterable, List, Sequence


REQUIRED_START = date(2021, 1, 1)
REQUIRED_END = date(2025, 12, 31)


@dataclass(frozen=True)
class DailyBitcoinPrice:
    """One normalized BTC-USD daily close observation."""

    day: date
    close: float


@dataclass(frozen=True)
class DataCoverageReport:
    """Coverage evidence for the Bitcoin price input used by the backtest."""

    start: date | None
    end: date | None
    row_count: int
    required_start: date = REQUIRED_START
    required_end: date = REQUIRED_END

    @property
    def required_days(self) -> int:
        return (self.required_end - self.required_start).days + 1

    @property
    def covers_required_window(self) -> bool:
        return (
            self.start is not None
            and self.end is not None
            and self.start <= self.required_start
            and self.end >= self.required_end
            and self.row_count >= self.required_days
        )

    def as_dict(self) -> dict[str, object]:
        return {
            "start": self.start.isoformat() if self.start else None,
            "end": self.end.isoformat() if self.end else None,
            "row_count": self.row_count,
            "required_start": self.required_start.isoformat(),
            "required_end": self.required_end.isoformat(),
            "required_days": self.required_days,
            "covers_required_window": self.covers_required_window,
        }


class BitcoinPriceContext:
    """Loads normalized historical Bitcoin/BTC daily close prices from CSV."""

    def __init__(self, csv_file: str | Path):
        self.csv_file = Path(csv_file)

    def load_data(self) -> list[DailyBitcoinPrice]:
        if not self.csv_file.exists():
            raise FileNotFoundError(f"Bitcoin price CSV not found: {self.csv_file}")
        with self.csv_file.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            rows = [self._parse_row(row) for row in reader]
        rows.sort(key=lambda row: row.day)
        return rows

    def coverage_report(self) -> DataCoverageReport:
        rows = self.load_data()
        if not rows:
            return DataCoverageReport(start=None, end=None, row_count=0)
        return DataCoverageReport(start=rows[0].day, end=rows[-1].day, row_count=len(rows))

    def load_required_window(self, *, strict: bool = True) -> list[DailyBitcoinPrice]:
        rows = [row for row in self.load_data() if REQUIRED_START <= row.day <= REQUIRED_END]
        report = DataCoverageReport(
            start=rows[0].day if rows else None,
            end=rows[-1].day if rows else None,
            row_count=len(rows),
        )
        if strict and not report.covers_required_window:
            raise ValueError(
                "Bitcoin price data does not cover the required last five completed years "
                f"({REQUIRED_START.isoformat()} through {REQUIRED_END.isoformat()}); "
                f"coverage={report.as_dict()}"
            )
        return rows

    @staticmethod
    def _parse_row(row: dict[str, str]) -> DailyBitcoinPrice:
        day_raw = row.get("Date") or row.get("date")
        close_raw = row.get("Close") or row.get("close")
        if not day_raw or not close_raw:
            raise ValueError("Bitcoin CSV rows must include Date and Close columns")
        return DailyBitcoinPrice(
            day=datetime.strptime(day_raw[:10], "%Y-%m-%d").date(),
            close=float(close_raw),
        )


def generate_deterministic_bitcoin_fixture(
    start: date = REQUIRED_START,
    end: date = REQUIRED_END,
    *,
    initial_close: float = 29374.15,
) -> list[DailyBitcoinPrice]:
    """Create deterministic BTC-like daily close prices for regression tests.

    This is not market data. It is only a fixture that lets tests exercise the
    strategy/backtest mechanics reproducibly without provider access.
    """

    rows: list[DailyBitcoinPrice] = []
    current = start
    close = float(initial_close)
    index = 0
    while current <= end:
        cyclical = ((index % 31) - 15) * 0.0014
        trend = 0.00033
        shock = -0.025 if index % 173 == 0 and index else 0.0
        close = max(1000.0, close * (1.0 + trend + cyclical + shock))
        rows.append(DailyBitcoinPrice(current, round(close, 2)))
        current += timedelta(days=1)
        index += 1
    return rows


def write_price_csv(path: str | Path, rows: Sequence[DailyBitcoinPrice]) -> Path:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Date", "Close"])
        writer.writeheader()
        for row in rows:
            writer.writerow({"Date": row.day.isoformat(), "Close": f"{row.close:.2f}"})
    return target
