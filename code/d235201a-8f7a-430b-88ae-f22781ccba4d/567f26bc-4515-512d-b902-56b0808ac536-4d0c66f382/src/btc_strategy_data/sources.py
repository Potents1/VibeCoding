from __future__ import annotations

from datetime import timedelta

import pandas as pd

from .preparation import DateWindow


def download_yfinance_btc(window: DateWindow) -> pd.DataFrame:
    """Download BTC-USD daily OHLCV rows with yfinance.

    The function imports yfinance lazily so the core preparation and tests stay
    deterministic without network access.
    """

    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("install the 'download' extra to use --source yfinance") from exc

    end_exclusive = window.end + timedelta(days=1)
    downloaded = yf.download(
        "BTC-USD",
        start=window.start.isoformat(),
        end=end_exclusive.isoformat(),
        interval="1d",
        auto_adjust=False,
        progress=False,
    )
    if downloaded.empty:
        raise RuntimeError("yfinance returned no BTC-USD rows")

    downloaded = downloaded.reset_index()
    return pd.DataFrame(
        {
            "date": downloaded["Date"],
            "open": downloaded["Open"],
            "high": downloaded["High"],
            "low": downloaded["Low"],
            "close": downloaded["Close"],
            "volume": downloaded["Volume"],
        }
    )
