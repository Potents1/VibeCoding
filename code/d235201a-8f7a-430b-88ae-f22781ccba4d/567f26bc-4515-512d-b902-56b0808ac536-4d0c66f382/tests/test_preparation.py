from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import pandas as pd
import pytest

from btc_strategy_data.cli import main
from btc_strategy_data.preparation import DateWindow, prepare_daily_data, read_ohlcv_csv


def test_last_completed_years_uses_full_calendar_years() -> None:
    window = DateWindow.last_completed_years(as_of=date(2026, 8, 2), years=5)

    assert window.start == date(2021, 1, 1)
    assert window.end == date(2025, 12, 31)
    assert window.expected_days() == 1826


def test_prepare_daily_data_deduplicates_fills_gaps_and_computes_returns() -> None:
    raw = read_ohlcv_csv("tests/fixtures/btc_sample.csv")
    window = DateWindow(start=date(2021, 1, 1), end=date(2021, 1, 10))

    prepared = prepare_daily_data(raw, window)
    frame = prepared.frame

    assert len(frame) == 10
    assert frame.loc[1, "close"] == 32200
    assert frame.loc[2, "date"] == date(2021, 1, 3)
    assert bool(frame.loc[2, "source_gap"]) is True
    assert frame.loc[2, "volume"] == 0
    assert frame.loc[2, "close"] == 32200
    assert frame.loc[0, "daily_return"] == 0
    assert frame.loc[3, "daily_return"] == pytest.approx((31000 / 32200) - 1)
    assert prepared.manifest["source_gap_days"] == 1


def test_prepare_daily_data_rejects_bad_ohlc_ranges() -> None:
    raw = pd.DataFrame(
        [
            {
                "date": "2021-01-01",
                "open": 100,
                "high": 99,
                "low": 90,
                "close": 95,
                "volume": 1,
            }
        ]
    )

    with pytest.raises(ValueError, match="inconsistent OHLC"):
        prepare_daily_data(raw, DateWindow(date(2021, 1, 1), date(2021, 1, 1)))


def test_cli_writes_prepared_csv_and_manifest() -> None:
    output_dir = Path("tests/.tmp_cli_output")

    exit_code = main(
        [
            "prepare",
            "--input",
            "tests/fixtures/btc_sample.csv",
            "--output-dir",
            str(output_dir),
            "--as-of",
            "2022-01-01",
            "--years",
            "1",
        ]
    )

    assert exit_code == 0
    csv_path = output_dir / "btc_daily_prepared.csv"
    manifest_path = output_dir / "data_manifest.json"
    assert csv_path.exists()
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["window_start"] == "2021-01-01"
    assert manifest["window_end"] == "2021-12-31"
    assert manifest["rows"] == 365
