"""Forecast evaluation metrics."""

from __future__ import annotations

from typing import Iterable

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error


def _aligned_arrays(actual: Iterable[float], predicted: Iterable[float]) -> tuple[np.ndarray, np.ndarray]:
    actual_array = np.asarray(list(actual), dtype=float)
    predicted_array = np.asarray(list(predicted), dtype=float)
    if actual_array.shape != predicted_array.shape:
        raise ValueError("actual and predicted must have the same shape")
    if actual_array.size == 0:
        raise ValueError("actual and predicted must not be empty")
    if not np.isfinite(actual_array).all() or not np.isfinite(predicted_array).all():
        raise ValueError("actual and predicted must contain only finite values")
    return actual_array, predicted_array


def mean_absolute_percentage_error(actual: Iterable[float], predicted: Iterable[float]) -> float:
    actual_array, predicted_array = _aligned_arrays(actual, predicted)
    non_zero_mask = actual_array != 0
    if not non_zero_mask.any():
        raise ValueError("MAPE is undefined when all actual values are zero")
    percentage_errors = np.abs((actual_array[non_zero_mask] - predicted_array[non_zero_mask]) / actual_array[non_zero_mask])
    return float(np.mean(percentage_errors) * 100)


def evaluate_forecast(actual: Iterable[float], predicted: Iterable[float]) -> dict[str, float]:
    actual_array, predicted_array = _aligned_arrays(actual, predicted)
    return {
        "mae": float(mean_absolute_error(actual_array, predicted_array)),
        "mse": float(mean_squared_error(actual_array, predicted_array)),
        "rmse": float(np.sqrt(mean_squared_error(actual_array, predicted_array))),
        "mape": mean_absolute_percentage_error(actual_array, predicted_array),
    }
