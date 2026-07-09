"""Forecast evaluation metrics."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error


def _as_arrays(y_true, y_pred) -> tuple[np.ndarray, np.ndarray]:
    true = np.asarray(y_true, dtype=float)
    pred = np.asarray(y_pred, dtype=float)
    if true.shape != pred.shape:
        raise ValueError("y_true and y_pred must have the same shape")
    if true.size == 0:
        raise ValueError("metrics require at least one observation")
    if not np.isfinite(true).all() or not np.isfinite(pred).all():
        raise ValueError("metrics require finite values")
    return true, pred


def mean_absolute_percentage_error(y_true, y_pred) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    non_zero = np.abs(true) > np.finfo(float).eps
    if not non_zero.any():
        raise ValueError("MAPE is undefined when all y_true values are zero")
    return float(np.mean(np.abs((true[non_zero] - pred[non_zero]) / true[non_zero])) * 100.0)


def root_mean_squared_error(y_true, y_pred) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    return float(np.sqrt(mean_squared_error(true, pred)))


def evaluate_forecast(y_true, y_pred) -> dict[str, float]:
    true, pred = _as_arrays(y_true, y_pred)
    return {
        "mae": float(mean_absolute_error(true, pred)),
        "rmse": root_mean_squared_error(true, pred),
        "mape": mean_absolute_percentage_error(true, pred),
    }
