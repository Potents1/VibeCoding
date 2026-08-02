from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Iterable

import pandas as pd


REQUIRED_COLUMNS = ("date", "open", "high", "low", "close", "volume")
PRICE_COLUMNS = ("open", "high", "low", "close")


@dataclass(frozen=True)
class DateWindow:
    """Inclusive daily date range used for reproducible historical datasets."""

    start: date
    end: date

    @classmethod
    def last_completed_years(cls, as_of: date | None = None, years: int = 5) -> "DateWindow":
        if years <= 0:
            raise ValueError("years must be positive")
        anchor = as_of or datetime.now(timezone.utc).date()
        end_year = anchor.year - 1
        start_year = end_year - years + 1
        return cls(start=date(start_year, 1, 1), end=date(end_year, 12, 31))

    def expected_days(self) -> int:
        return int((self.end - self.start).days) + 1


@dataclass(frozen=True)
class PreparedDataset:
    frame: pd.DataFrame
    manifest: dict[str, object]


def read_ohlcv_csv(path: str | Path) -> pd.DataFrame:
    return pd.read_csv(path)


def prepare_daily_data(raw: pd.DataFrame, window: DateWindow) -> PreparedDataset:
    missing = [column for column in REQUIRED_COLUMNS if column not in raw.columns]
    if missing:
        raise ValueError(f"missing required columns: {', '.join(missing)}")

    frame = raw.loc[:, REQUIRED_COLUMNS].copy()
    frame.columns = list(REQUIRED_COLUMNS)
    frame["date"] = pd.to_datetime(frame["date"], utc=True, errors="coerce").dt.date
    frame = frame.dropna(subset=["date"])

    for column in (*PRICE_COLUMNS, "volume"):
        frame[column] = pd.to_numeric(frame[column], errors="coerce")

    frame = frame.dropna(subset=list(PRICE_COLUMNS))
    frame = frame[(frame["date"] >= window.start) & (frame["date"] <= window.end)]
    frame = frame.sort_values("date").drop_duplicates("date", keep="last")

    if frame.empty:
        raise ValueError(
            f"no rows remain after filtering to {window.start.isoformat()}..{window.end.isoformat()}"
        )

    frame = _reindex_daily(frame, window)
    _validate_prices(frame)

    frame["daily_return"] = frame["close"].pct_change().fillna(0.0)
    frame["log_return"] = _log_return(frame["close"])
    frame["source_gap"] = frame["source_gap"].astype(bool)
    frame["volume"] = frame["volume"].fillna(0.0)

    ordered_columns = [
        "date",
        "open",
        "high",
        "low",
        "close",
        "volume",
        "daily_return",
        "log_return",
        "source_gap",
    ]
    frame = frame.loc[:, ordered_columns].reset_index(drop=True)

    manifest = {
        "window_start": window.start.isoformat(),
        "window_end": window.end.isoformat(),
        "expected_days": window.expected_days(),
        "rows": int(len(frame)),
        "source_gap_days": int(frame["source_gap"].sum()),
        "first_date": frame["date"].iloc[0].isoformat(),
        "last_date": frame["date"].iloc[-1].isoformat(),
        "columns": ordered_columns,
    }
    return PreparedDataset(frame=frame, manifest=manifest)


def write_prepared_dataset(dataset: PreparedDataset, output_dir: str | Path) -> tuple[Path, Path]:
    import json

    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    csv_path = destination / "btc_daily_prepared.csv"
    manifest_path = destination / "data_manifest.json"

    dataset.frame.to_csv(csv_path, index=False)
    manifest_path.write_text(json.dumps(dataset.manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return csv_path, manifest_path


def _reindex_daily(frame: pd.DataFrame, window: DateWindow) -> pd.DataFrame:
    indexed = frame.set_index(pd.to_datetime(frame["date"]))
    full_index = pd.date_range(window.start, window.end, freq="D")
    reindexed = indexed.reindex(full_index)
    reindexed["source_gap"] = reindexed["date"].isna()
    reindexed["date"] = [value.date() for value in full_index]
    reindexed[list(PRICE_COLUMNS)] = reindexed[list(PRICE_COLUMNS)].ffill().bfill()
    reindexed["volume"] = reindexed["volume"].fillna(0.0)
    return reindexed.reset_index(drop=True)


def _validate_prices(frame: pd.DataFrame) -> None:
    non_positive = frame[list(PRICE_COLUMNS)].le(0).any(axis=1)
    if non_positive.any():
        bad_date = frame.loc[non_positive, "date"].iloc[0]
        raise ValueError(f"non-positive price found for {bad_date}")

    inconsistent = (frame["high"] < frame[["open", "close", "low"]].max(axis=1)) | (
        frame["low"] > frame[["open", "close", "high"]].min(axis=1)
    )
    if inconsistent.any():
        bad_date = frame.loc[inconsistent, "date"].iloc[0]
        raise ValueError(f"inconsistent OHLC range found for {bad_date}")


def _log_return(close: Iterable[float]) -> pd.Series:
    import numpy as np

    prices = pd.Series(close, dtype="float64")
    return np.log(prices / prices.shift(1)).fillna(0.0)
