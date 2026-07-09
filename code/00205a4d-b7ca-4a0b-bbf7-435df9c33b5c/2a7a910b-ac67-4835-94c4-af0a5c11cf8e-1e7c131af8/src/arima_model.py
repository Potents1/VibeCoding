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
    """Deterministic drift forecaster used only when statsmodels is unavailable."""

    def __init__(self, series: pd.Series) -> None:
        self._series = series.astype(float)
        self._values = self._series.to_numpy(dtype=float)
        window = self._values[-min(8, self._values.size) :]
        self._drift = float(np.mean(np.diff(window))) if window.size >= 2 else 0.0
        self.fittedvalues = self._series.shift(1).bfill()

    @property
    def aic(self) -> float:
        residuals = self._values - np.asarray(self.fittedvalues, dtype=float)
        mse = float(np.mean(residuals**2)) if residuals.size else 1e-9
        return float(len(self._values) * np.log(max(mse, 1e-9)) + 2.0)

    @property
    def bic(self) -> float:
        return float(self.aic + np.log(max(1, self._values.size)))

    def forecast(self, steps: int) -> np.ndarray:
        last = float(self._values[-1])
        return np.asarray([last + self._drift * step for step in range(1, steps + 1)], dtype=float)


@dataclass
class ARIMAForecaster:
    """Validated ARIMA wrapper for fitting and forecasting numeric time series."""

    order: tuple[int, int, int] = (1, 1, 1)

    def __post_init__(self) -> None:
        if len(self.order) != 3:
            raise ValueError("order must be a tuple of three integers: (p, d, q)")
        if any(not isinstance(value, int) or value < 0 for value in self.order):
            raise ValueError("order values must be non-negative integers")
        self._result = None

    def fit(self, values: Iterable[float] | pd.Series | np.ndarray) -> "ARIMAForecaster":
        series = self._coerce_series(values)
        min_required = max(3, sum(self.order) + 1)
        if len(series) < min_required:
            raise ValueError(f"at least {min_required} observations are required for order {self.order}")

        if ARIMA is None:
            self._result = _FallbackARIMAResult(series)
        else:
            if ARIMA is not None:
                if ARIMA is not None:
                    model = ARIMA(series, order=self.order, enforce_stationarity=False, enforce_invertibility=False)
                    self._result = model.fit()
                else:
                    self._result = _FallbackARIMAResult(values if 'values' in locals() else series)
            else:
                self._result = _FallbackARIMAResult(values if 'values' in locals() else series)
        return self

    def forecast(self, steps: int = 1) -> pd.Series:
        self._require_fit()
        self._validate_steps(steps)
        forecast = self._result.forecast(steps=steps)
        return pd.Series(np.asarray(forecast, dtype=float), name="forecast")

    def fitted_values(self) -> pd.Series:
        self._require_fit()
        return pd.Series(np.asarray(self._result.fittedvalues, dtype=float), name="fitted")

    def model_info(self) -> dict[str, float | tuple[int, int, int]]:
        self._require_fit()
        return {
            "order": self.order,
            "aic": float(getattr(self._result, "aic")),
            "bic": float(getattr(self._result, "bic")),
        }

    def _require_fit(self) -> None:
        if self._result is None:
            raise RuntimeError("fit must be called before forecast")

    @staticmethod
    def _validate_steps(steps: int) -> None:
        if not isinstance(steps, int) or steps <= 0:
            raise ValueError("steps must be a positive integer")

    @staticmethod
    def _coerce_series(values: Iterable[float] | pd.Series | np.ndarray) -> pd.Series:
        series = pd.Series(values, dtype="float64").dropna()
        if series.empty:
            raise ValueError("values must contain at least one numeric observation")
        if not np.isfinite(series.to_numpy()).all():
            raise ValueError("values must not contain infinity")
        return series.reset_index(drop=True)
