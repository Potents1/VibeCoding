from __future__ import annotations

import pandas as pd
from dataclasses import dataclass
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
    def __init__(self, series):
        self._series = pd.Series(series).astype(float)
        self._values = self._series.to_numpy(dtype=float)
        if self._values.size >= 2:
            window = self._values[-min(8, self._values.size):]
            self._drift = float(np.mean(np.diff(window)))
        else:
            self._drift = 0.0
        self.fittedvalues = self._series.shift(1).bfill() if self._values.size else self._series

    @property
    def aic(self) -> float:
        residuals = self._values - np.asarray(self.fittedvalues, dtype=float)
        mse = float(np.mean(residuals ** 2)) if residuals.size else 0.0
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
        index = self._forecast_index(steps)
        predicted = pd.Series(forecast_values, index=index, name='forecast')
        spread = float(np.std(np.diff(self._values[-min(8, self._values.size):]))) if self._values.size > 2 else 1.0
        if not np.isfinite(spread) or spread == 0.0:
            spread = 1.0
        interval = pd.DataFrame(
            {'lower_ci': forecast_values - 1.96 * spread, 'upper_ci': forecast_values + 1.96 * spread},
            index=index,
        )
        return _FallbackARIMAPrediction(predicted, interval)

    def _forecast_index(self, steps: int):
        index = self._series.index
        if isinstance(index, pd.DatetimeIndex) and len(index):
            freq = index.freq or pd.infer_freq(index) or 'D'
            return pd.date_range(index[-1] + pd.tseries.frequencies.to_offset(freq), periods=steps, freq=freq)
        return pd.RangeIndex(len(index), len(index) + steps)


class _FallbackARIMAPrediction:
    def __init__(self, predicted_mean, interval):
        self.predicted_mean = predicted_mean
        self._interval = interval

    def conf_int(self, alpha: float = 0.05):
        return self._interval.copy()


@dataclass
class ARIMAForecaster:
    """Small ARIMA wrapper with input validation and deterministic forecast output."""

    order: tuple[int, int, int] = (1, 1, 1)

    def __post_init__(self) -> None:
        if len(self.order) != 3:
            raise ValueError("order must be a tuple of three integers: (p, d, q)")
        if any(not isinstance(value, int) or value < 0 for value in self.order):
            raise ValueError("order values must be non-negative integers")
        self._result = None
        self._training_index = None

    def fit(self, values: Iterable[float] | pd.Series | np.ndarray) -> "ARIMAForecaster":
        series = self._coerce_series(values)
        min_required = max(3, self.order[0] + self.order[1] + self.order[2] + 1)
        if len(series) < min_required:
            raise ValueError(f"at least {min_required} observations are required for order {self.order}")

        if ARIMA is not None:
            if ARIMA is not None:
                model = ARIMA(series, order=self.order, enforce_stationarity=False, enforce_invertibility=False)
                self._result = model.fit()
            else:
                self._result = _FallbackARIMAResult(values if 'values' in locals() else series)
        else:
            self._result = _FallbackARIMAResult(values if 'values' in locals() else series)
        self._training_index = series.index
        return self

    def forecast(self, steps: int = 1) -> pd.Series:
        if self._result is None:
            raise RuntimeError("fit must be called before forecast")
        if not isinstance(steps, int) or steps <= 0:
            raise ValueError("steps must be a positive integer")
        forecast = self._result.forecast(steps=steps)
        return pd.Series(np.asarray(forecast, dtype=float), name="forecast")

    def fitted_values(self) -> pd.Series:
        if self._result is None:
            raise RuntimeError("fit must be called before fitted_values")
        return pd.Series(np.asarray(self._result.fittedvalues, dtype=float), name="fitted")

    @staticmethod
    def _coerce_series(values: Iterable[float] | pd.Series | np.ndarray) -> pd.Series:
        series = pd.Series(values, dtype="float64").dropna()
        if series.empty:
            raise ValueError("values must contain at least one numeric observation")
        if not np.isfinite(series.to_numpy()).all():
            raise ValueError("values must not contain infinity")
        return series.reset_index(drop=True)

# Bitcoin price context: offline sample BTC close prices in USD used by the forecast tool.
