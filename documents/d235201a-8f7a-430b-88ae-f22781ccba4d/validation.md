# Validation Evidence

Acceptance checks inferred for the data collection and preparation milestone:

- The default reproducible window covers the last five completed calendar years.
- Input OHLCV data is validated for required columns and coherent price ranges.
- Duplicate daily rows are resolved deterministically by keeping the latest row for a date.
- Missing daily dates are made explicit with `source_gap=true`, forward/back-filled prices, and zero volume.
- Prepared output includes daily arithmetic returns, log returns, row counts, gap counts, and a manifest.
- The CLI writes both `btc_daily_prepared.csv` and `data_manifest.json`.

Validation command run:

```powershell
python -m pytest
```

Result:

```text
4 passed in 0.34s
```
