"""Forecast performance metrics with input validation."""

from __future__ import annotations

from typing import Iterable

import numpy as np


def _aligned_arrays(actual: Iterable[float], predicted: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    actual_array = np.asarray(list(actual), dtype=float)
    predicted_array = np.asarray(list(predicted), dtype=float)

    if actual_array.ndim != 1 or predicted_array.ndim != 1:
        raise ValueError("actual and predicted values must be one-dimensional")
    if len(actual_array) == 0:
        raise ValueError("actual and predicted values cannot be empty")
    if len(actual_array) != len(predicted_array):
        raise ValueError("actual and predicted values must have the same length")
    if not np.isfinite(actual_array).all() or not np.isfinite(predicted_array).all():
        raise ValueError("actual and predicted values must be finite")

    return actual_array, predicted_array


def mean_absolute_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _aligned_arrays(actual, predicted)
    return float(np.mean(np.abs(actual_array - predicted_array)))


def mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _aligned_arrays(actual, predicted)
    return float(np.mean((actual_array - predicted_array) ** 2))


def root_mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    return float(np.sqrt(mean_squared_error(actual, predicted)))
