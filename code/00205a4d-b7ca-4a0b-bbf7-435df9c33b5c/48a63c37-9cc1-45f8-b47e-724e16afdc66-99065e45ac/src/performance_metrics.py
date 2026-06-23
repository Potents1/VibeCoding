from __future__ import annotations

from typing import Iterable

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def _as_arrays(y_true: Iterable[float], y_pred: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    true = np.asarray(list(y_true), dtype=float)
    pred = np.asarray(list(y_pred), dtype=float)
    if true.shape != pred.shape:
        raise ValueError("y_true and y_pred must have the same shape")
    if true.size == 0:
        raise ValueError("metrics require at least one value")
    if not np.isfinite(true).all() or not np.isfinite(pred).all():
        raise ValueError("metrics require finite numeric values")
    return true, pred


def mean_absolute_percentage_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    non_zero = true != 0
    if not non_zero.any():
        raise ValueError("MAPE is undefined when all true values are zero")
    return float(np.mean(np.abs((true[non_zero] - pred[non_zero]) / true[non_zero])) * 100)


def root_mean_squared_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    return float(np.sqrt(mean_squared_error(true, pred)))


def regression_metrics(y_true: Iterable[float], y_pred: Iterable[float]) -> dict[str, float]:
    true, pred = _as_arrays(y_true, y_pred)
    return {
        "mae": float(mean_absolute_error(true, pred)),
        "mse": float(mean_squared_error(true, pred)),
        "rmse": float(np.sqrt(mean_squared_error(true, pred))),
        "r2": float(r2_score(true, pred)) if true.size > 1 else float("nan"),
    }
