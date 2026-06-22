"""Performance metrics for time-series forecasts."""

from __future__ import annotations

from typing import Iterable

import numpy as np


def _paired_arrays(y_true: Iterable[float], y_pred: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    true = np.asarray(list(y_true), dtype=float)
    pred = np.asarray(list(y_pred), dtype=float)
    if true.shape != pred.shape:
        raise ValueError("y_true and y_pred must have the same shape")
    if true.size == 0:
        raise ValueError("metric inputs must not be empty")
    if not np.isfinite(true).all() or not np.isfinite(pred).all():
        raise ValueError("metric inputs must contain only finite values")
    return true, pred


def mean_absolute_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    """Return the mean absolute error between actual and predicted values."""
    true, pred = _paired_arrays(y_true, y_pred)
    return float(np.mean(np.abs(true - pred)))


def root_mean_squared_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    """Return the root mean squared error between actual and predicted values."""
    true, pred = _paired_arrays(y_true, y_pred)
    return float(np.sqrt(np.mean((true - pred) ** 2)))
