"""Forecast performance metrics."""

from __future__ import annotations

from collections.abc import Iterable

import numpy as np


def _paired_arrays(actual: Iterable[float], predicted: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    actual_arr = np.asarray(list(actual), dtype=float)
    predicted_arr = np.asarray(list(predicted), dtype=float)
    if actual_arr.shape != predicted_arr.shape:
        raise ValueError("actual and predicted must have the same shape")
    if actual_arr.size == 0:
        raise ValueError("metric inputs must not be empty")
    if not np.all(np.isfinite(actual_arr)) or not np.all(np.isfinite(predicted_arr)):
        raise ValueError("metric inputs must contain only finite numeric values")
    return actual_arr, predicted_arr


def mse(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_arr, predicted_arr = _paired_arrays(actual, predicted)
    return float(np.mean((actual_arr - predicted_arr) ** 2))


def mae(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_arr, predicted_arr = _paired_arrays(actual, predicted)
    return float(np.mean(np.abs(actual_arr - predicted_arr)))


def rmse(actual: Iterable[float], predicted: Iterable[float]) -> float:
    return float(np.sqrt(mse(actual, predicted)))


def mape(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_arr, predicted_arr = _paired_arrays(actual, predicted)
    if np.any(actual_arr == 0):
        raise ValueError("MAPE is undefined when actual values contain zero")
    return float(np.mean(np.abs((actual_arr - predicted_arr) / actual_arr)) * 100.0)
