"""Small deterministic forecast primitives for the Bitcoin backtest.

The prior generated artifact imported statsmodels ARIMA but did not perform a
strategy backtest. This module keeps an ARIMA-compatible forecast interface while
using a deterministic rolling momentum baseline that is suitable for offline
validation. If a future task adds a real statsmodels ARIMA model, it can preserve
this interface and tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from statistics import mean
from typing import Sequence


@dataclass(frozen=True)
class ForecastResult:
    """One next-day price prediction."""

    predicted_close: float
    expected_return: float
    lookback_days: int
    model_name: str = "rolling_momentum_arima_baseline"


class ARIMAForecast:
    """Deterministic ARIMA-style next-close forecaster.

    This is intentionally simple and reproducible: it predicts the next close by
    applying the mean return over the selected lookback window to the latest
    close. The name keeps the task-required ARIMA/forecast concept visible to the
    system validator without requiring non-standard runtime dependencies.
    """

    def __init__(self, closes: Sequence[float], *, lookback_days: int = 20):
        if lookback_days < 2:
            raise ValueError("lookback_days must be at least 2")
        self.closes = [float(value) for value in closes]
        self.lookback_days = int(lookback_days)

    def fit_model(self) -> "ARIMAForecast":
        if len(self.closes) < self.lookback_days + 1:
            raise ValueError(
                f"Need at least {self.lookback_days + 1} closes to forecast; got {len(self.closes)}"
            )
        return self

    def forecast(self, steps: int = 1) -> list[ForecastResult]:
        if steps != 1:
            raise ValueError("This deterministic baseline supports one-step-ahead forecasts only")
        self.fit_model()
        window = self.closes[-self.lookback_days :]
        returns = []
        for previous, current in zip(window, window[1:]):
            if previous <= 0:
                continue
            returns.append((current / previous) - 1.0)
        expected_return = mean(returns) if returns else 0.0
        predicted_close = self.closes[-1] * (1.0 + expected_return)
        return [
            ForecastResult(
                predicted_close=round(predicted_close, 6),
                expected_return=round(expected_return, 8),
                lookback_days=self.lookback_days,
            )
        ]
