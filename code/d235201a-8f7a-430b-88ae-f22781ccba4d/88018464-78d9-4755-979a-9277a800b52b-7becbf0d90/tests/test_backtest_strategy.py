from datetime import date
from pathlib import Path
import sys

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backtest_strategy import BacktestStrategy, run_from_csv
from bitcoin_price_context import (
    REQUIRED_END,
    REQUIRED_START,
    BitcoinPriceContext,
    generate_deterministic_bitcoin_fixture,
    write_price_csv,
)


def test_bitcoin_fixture_covers_last_five_completed_years():
    rows = generate_deterministic_bitcoin_fixture()

    assert rows[0].day == REQUIRED_START
    assert rows[-1].day == REQUIRED_END
    assert len(rows) == (REQUIRED_END - REQUIRED_START).days + 1
    assert all(row.close > 0 for row in rows)


def test_backtest_produces_metrics_and_verification_evidence():
    rows = generate_deterministic_bitcoin_fixture()

    report = BacktestStrategy(rows, lookback_days=30).run_backtest()

    assert report.symbol == "BTC-USD"
    assert report.metrics.observations == len(rows) - 31
    assert -1.0 < report.metrics.max_drawdown <= 0.0
    assert 0.0 <= report.metrics.win_rate <= 1.0
    assert 0.0 <= report.metrics.exposure <= 1.0
    assert report.verification["uses_bitcoin_price_context"] is True
    assert report.verification["no_lookahead_bias"] is True


def test_csv_loader_rejects_incomplete_goal_window(tmp_path):
    csv_path = write_price_csv(
        tmp_path / "partial_btc.csv",
        generate_deterministic_bitcoin_fixture(date(2025, 1, 1), date(2025, 1, 31)),
    )

    context = BitcoinPriceContext(csv_path)

    with pytest.raises(ValueError, match="last five completed years"):
        context.load_required_window(strict=True)


def test_run_from_csv_accepts_full_goal_window(tmp_path):
    csv_path = write_price_csv(tmp_path / "btc.csv", generate_deterministic_bitcoin_fixture())

    report = run_from_csv(csv_path)

    assert report.data_coverage["start"] == "2021-01-01"
    assert report.data_coverage["end"] == "2025-12-31"
    assert report.metrics.observations > 1700
