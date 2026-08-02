# Bitcoin Strategy Data Preparation

This repository provides a runnable Python CLI for the data collection and
preparation milestone of a reproducible Bitcoin market-strategy workflow.

The command prepares daily BTC OHLCV data for the last five completed calendar
years by default, validates required columns, removes duplicate dates, fills
missing daily rows with explicit forward-filled market prices, computes returns,
and writes a JSON evidence manifest.

## Usage

Prepare an existing CSV:

```powershell
python -m btc_strategy_data.cli prepare --input path\to\btc.csv --output-dir artifacts\data
```

Download with `yfinance` when the optional dependency and network are available:

```powershell
python -m btc_strategy_data.cli prepare --source yfinance --output-dir artifacts\data
```

Run tests:

```powershell
python -m pytest
```
