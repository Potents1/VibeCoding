"""Deterministic regression metrics for forecast evaluation."""

from __future__ import annotations

from typing import Iterable

import numpy as np


def _as_arrays(y_true: Iterable[float], y_pred: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
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
    true, pred = _as_arrays(y_true, y_pred)
    return float(np.mean(np.abs(true - pred)))


def root_mean_squared_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    return float(np.sqrt(np.mean(np.square(true - pred))))


def mean_absolute_percentage_error(y_true: Iterable[float], y_pred: Iterable[float]) -> float:
    true, pred = _as_arrays(y_true, y_pred)
    non_zero = true != 0
    if not np.any(non_zero):
        raise ValueError("MAPE is undefined when all actual values are zero")
    return float(np.mean(np.abs((true[non_zero] - pred[non_zero]) / true[non_zero])) * 100.0)
