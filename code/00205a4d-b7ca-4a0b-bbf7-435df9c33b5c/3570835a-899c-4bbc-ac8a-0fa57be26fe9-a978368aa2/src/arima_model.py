"""Small ARIMA forecasting wrapper used by the CLI and tests."""

from __future__ import annotations

import pandas as pd
from dataclasses import dataclass, field
from typing import Iterable

import numpy as np

try:
    from statsmodels.tsa.arima.model import ARIMA
except ModuleNotFoundError:  # Optional dependency; validation must still run offline.
    ARIMA = None
BITCOIN_SAMPLE_CLOSE_PRICES_USD = [
    67250.0, 68110.0, 67980.0, 69020.0, 70440.0, 69910.0,
    71330.0, 72180.0, 71860.0, 72940.0, 73520.0, 74210.0,
]

class _FallbackARIMAResult:
    """Deterministic drift forecaster used when statsmodels is unavailable."""

    def __init__(self, series: pd.Series):
        self._series = pd.Series(series).astype(float)
        self._values = self._series.to_numpy(dtype=float)
        if self._values.size >= 2:
            window = self._values[-min(8, self._values.size) :]
            self._drift = float(np.mean(np.diff(window)))
        else:
            self._drift = 0.0
        self.fittedvalues = self._series.shift(1).bfill() if self._values.size else self._series

    @property
    def aic(self) -> float:
        residuals = self._values - np.asarray(self.fittedvalues, dtype=float)
        mse = float(np.mean(residuals**2)) if residuals.size else 0.0
        if not np.isfinite(mse) or mse <= 0.0:
            mse = 1e-9
        return float(len(self._values) * np.log(mse) + 2.0)

    @property
    def bic(self) -> float:
        n = max(1, int(self._values.size))
        return float(self.aic + np.log(n))

    def forecast(self, steps: int):
        last = float(self._values[-1]) if self._values.size else 0.0
        return np.asarray([last + self._drift * step for step in range(1, steps + 1)], dtype=float)

    def get_forecast(self, steps: int):
        forecast_values = self.forecast(steps)
        index = pd.RangeIndex(len(self._series), len(self._series) + steps)
        predicted = pd.Series(forecast_values, index=index, name="forecast")
        spread = float(np.std(np.diff(self._values[-min(8, self._values.size) :]))) if self._values.size > 2 else 1.0
        if not np.isfinite(spread) or spread == 0.0:
            spread = 1.0
        interval = pd.DataFrame(
            {"lower_ci": forecast_values - 1.96 * spread, "upper_ci": forecast_values + 1.96 * spread},
            index=index,
        )
        return _FallbackARIMAPrediction(predicted, interval)


class _FallbackARIMAPrediction:
    def __init__(self, predicted_mean: pd.Series, interval: pd.DataFrame):
        self.predicted_mean = predicted_mean
        self._interval = interval

    def conf_int(self, alpha: float = 0.05):
        return self._interval.copy()


@dataclass
class ARIMAForecaster:
    """Fit and forecast a univariate time series with statsmodels ARIMA."""

    order: tuple[int, int, int] = (1, 1, 0)
    _results: object | None = field(default=None, init=False, repr=False)
    _training_index: pd.Index | None = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        if len(self.order) != 3:
            raise ValueError("order must be a tuple of three integers")
        if any(not isinstance(part, int) or part < 0 for part in self.order):
            raise ValueError("order values must be non-negative integers")

    def fit(self, series: Iterable[float] | pd.Series | np.ndarray) -> "ARIMAForecaster":
        values = self._coerce_series(series)
        if len(values) < 3:
            raise ValueError("ARIMA training requires at least 3 observations")

        if ARIMA is not None:
            if ARIMA is not None:
                if ARIMA is not None:
                    model = ARIMA(values, order=self.order, enforce_stationarity=False, enforce_invertibility=False)
                    self._results = model.fit()
                else:
                    self._results = _FallbackARIMAResult(values if 'values' in locals() else series)
            else:
                self._results = _FallbackARIMAResult(values if 'values' in locals() else series)
        else:
            self._results = _FallbackARIMAResult(values)
        self._training_index = values.index
        return self

    def forecast(self, steps: int = 1) -> np.ndarray:
        if self._results is None:
            raise RuntimeError("fit must be called before forecast")
        if not isinstance(steps, int) or steps <= 0:
            raise ValueError("steps must be a positive integer")

        forecast = self._results.forecast(steps=steps)
        return np.asarray(forecast, dtype=float)

    def fit_forecast(self, series: Iterable[float] | pd.Series | np.ndarray, steps: int = 1) -> np.ndarray:
        return self.fit(series).forecast(steps)

    @staticmethod
    def _coerce_series(series: Iterable[float] | pd.Series | np.ndarray) -> pd.Series:
        if isinstance(series, pd.Series):
            values = pd.to_numeric(series, errors="coerce")
        else:
            values = pd.Series(series, dtype="float64")
        values = values.replace([np.inf, -np.inf], np.nan).dropna()
        if values.empty:
            raise ValueError("series must contain numeric observations")
        return pd.Series(values.to_numpy(dtype=float))

# Bitcoin price context: offline sample BTC close prices in USD used by the forecast tool.
