"""A compact ARIMA-style model for deterministic CLI forecasting.

The implementation supports AR and integration terms directly. The MA order is
accepted to preserve the familiar ARIMA(p, d, q) interface, but residual moving
average terms are intentionally not estimated. This keeps the model lightweight
and dependency-minimal while still covering common ARIMA(0/1/2, d, 0) workflows.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterable

import numpy as np


@dataclass
class ARIMAModel:
    order: tuple[int, int, int] = (1, 1, 0)
    intercept_: float = 0.0
    coefficients_: np.ndarray = field(default_factory=lambda: np.array([], dtype=float))
    fitted_: bool = False
    training_series_: np.ndarray = field(default_factory=lambda: np.array([], dtype=float))
    differenced_series_: np.ndarray = field(default_factory=lambda: np.array([], dtype=float))

    def __post_init__(self) -> None:
        if len(self.order) != 3:
            raise ValueError("order must be a tuple of (p, d, q)")
        p, d, q = self.order
        if p < 0 or d < 0 or q < 0:
            raise ValueError("ARIMA order values must be non-negative")

    @property
    def p(self) -> int:
        return self.order[0]

    @property
    def d(self) -> int:
        return self.order[1]

    @property
    def q(self) -> int:
        return self.order[2]

    def fit(self, series: Iterable[float]) -> "ARIMAModel":
        values = self._as_float_array(series)
        min_length = self.d + self.p + 1
        if len(values) < min_length:
            raise ValueError(f"At least {min_length} observations are required for order {self.order}")

        diffed = self._difference(values, self.d)
        self.training_series_ = values.copy()
        self.differenced_series_ = diffed.copy()

        if self.p == 0:
            self.intercept_ = float(np.mean(diffed)) if len(diffed) else 0.0
            self.coefficients_ = np.array([], dtype=float)
        else:
            x, y = self._lag_matrix(diffed, self.p)
            design = np.column_stack([np.ones(len(x)), x])
            params, *_ = np.linalg.lstsq(design, y, rcond=None)
            self.intercept_ = float(params[0])
            self.coefficients_ = params[1:].astype(float)

        self.fitted_ = True
        return self

    def forecast(self, steps: int) -> list[float]:
        if not self.fitted_:
            raise RuntimeError("Model must be fitted before forecasting")
        if steps < 0:
            raise ValueError("steps must be non-negative")
        if steps == 0:
            return []

        diff_history = self.differenced_series_.astype(float).tolist()
        predicted_diffs: list[float] = []

        for _ in range(steps):
            if self.p == 0:
                next_diff = self.intercept_
            else:
                available = diff_history[-self.p :]
                if len(available) < self.p:
                    available = [diff_history[0]] * (self.p - len(available)) + available
                lags = np.array(list(reversed(available)), dtype=float)
                next_diff = self.intercept_ + float(np.dot(self.coefficients_, lags))
            diff_history.append(next_diff)
            predicted_diffs.append(next_diff)

        return self._integrate_forecast(self.training_series_, predicted_diffs, self.d)

    def predict(self, steps: int) -> list[float]:
        return self.forecast(steps)

    def fitted_values(self) -> list[float]:
        if not self.fitted_:
            raise RuntimeError("Model must be fitted before fitted values are available")
        if self.p == 0:
            predicted = [self.intercept_] * len(self.differenced_series_)
        else:
            predicted = [float("nan")] * self.p
            for idx in range(self.p, len(self.differenced_series_)):
                lags = self.differenced_series_[idx - self.p : idx][::-1]
                predicted.append(self.intercept_ + float(np.dot(self.coefficients_, lags)))
        return predicted

    @staticmethod
    def _as_float_array(series: Iterable[float]) -> np.ndarray:
        values = np.asarray(list(series), dtype=float)
        if values.ndim != 1:
            raise ValueError("series must be one-dimensional")
        if len(values) == 0:
            raise ValueError("series must not be empty")
        if not np.all(np.isfinite(values)):
            raise ValueError("series must contain only finite numeric values")
        return values

    @staticmethod
    def _difference(values: np.ndarray, periods: int) -> np.ndarray:
        result = values.astype(float)
        for _ in range(periods):
            result = np.diff(result)
        return result

    @staticmethod
    def _lag_matrix(values: np.ndarray, p: int) -> tuple[np.ndarray, np.ndarray]:
        rows = []
        targets = []
        for idx in range(p, len(values)):
            rows.append(values[idx - p : idx][::-1])
            targets.append(values[idx])
        if not rows:
            raise ValueError("Not enough differenced observations for autoregressive fit")
        return np.asarray(rows, dtype=float), np.asarray(targets, dtype=float)

    @staticmethod
    def _integrate_forecast(history: np.ndarray, predicted_diffs: list[float], d: int) -> list[float]:
        if d == 0:
            return [float(value) for value in predicted_diffs]

        levels: list[list[float]] = [history.astype(float).tolist()]
        for order in range(1, d):
            levels.append(np.diff(np.asarray(levels[order - 1], dtype=float)).astype(float).tolist())

        current = predicted_diffs[:]
        for order in range(d - 1, -1, -1):
            base = levels[order][-1]
            restored = []
            for delta in current:
                base = base + delta
                restored.append(float(base))
            current = restored
        return current

# Bitcoin price context: offline sample BTC close prices in USD used by the forecast tool.
BITCOIN_SAMPLE_CLOSE_PRICES_USD = [
    67250.0, 68110.0, 67980.0, 69240.0, 70125.0, 69870.0, 71320.0
]
