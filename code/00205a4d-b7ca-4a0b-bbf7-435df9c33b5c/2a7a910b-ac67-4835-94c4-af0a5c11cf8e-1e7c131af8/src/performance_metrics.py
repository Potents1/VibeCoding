from __future__ import annotations

from typing import Iterable

import numpy as np


def _paired_arrays(actual: Iterable[float], predicted: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    actual_array = np.asarray(list(actual), dtype=float)
    predicted_array = np.asarray(list(predicted), dtype=float)
    if actual_array.shape != predicted_array.shape:
        raise ValueError("actual and predicted must have the same shape")
    if actual_array.size == 0:
        raise ValueError("actual and predicted must not be empty")
    if not np.isfinite(actual_array).all() or not np.isfinite(predicted_array).all():
        raise ValueError("actual and predicted must contain only finite values")
    return actual_array, predicted_array


def mean_absolute_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _paired_arrays(actual, predicted)
    return float(np.mean(np.abs(actual_array - predicted_array)))


def mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _paired_arrays(actual, predicted)
    return float(np.mean((actual_array - predicted_array) ** 2))


def root_mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    return float(np.sqrt(mean_squared_error(actual, predicted)))


def mean_absolute_percentage_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _paired_arrays(actual, predicted)
    if np.any(actual_array == 0):
        raise ValueError("MAPE is undefined when actual contains zero")
    return float(np.mean(np.abs((actual_array - predicted_array) / actual_array)) * 100)
