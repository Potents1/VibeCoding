from __future__ import annotations

from typing import Iterable

import numpy as np


def _paired_arrays(actual: Iterable[float], predicted: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    actual_array = np.asarray(list(actual), dtype="float64")
    predicted_array = np.asarray(list(predicted), dtype="float64")
    if actual_array.shape != predicted_array.shape:
        raise ValueError("actual and predicted values must have the same shape")
    if actual_array.size == 0:
        raise ValueError("metric inputs cannot be empty")
    mask = ~(np.isnan(actual_array) | np.isnan(predicted_array))
    if not mask.any():
        raise ValueError("metric inputs contain no comparable numeric values")
    return actual_array[mask], predicted_array[mask]


def mean_absolute_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _paired_arrays(actual, predicted)
    return float(np.mean(np.abs(actual_array - predicted_array)))


def mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _paired_arrays(actual, predicted)
    return float(np.mean((actual_array - predicted_array) ** 2))


def root_mean_squared_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    return float(np.sqrt(mean_squared_error(actual, predicted)))
