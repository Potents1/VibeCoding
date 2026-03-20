from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Callable, Dict, Mapping


class CalculatorError(ValueError):
    """Raised when an expression cannot be evaluated."""


@dataclass(frozen=True)
class Operation:
    symbol: str
    func: Callable[[float, float], float]
    description: str


def _safe_divide(left: float, right: float) -> float:
    if right == 0:
        raise CalculatorError("Division by zero is not allowed.")
    return left / right


def _default_operations() -> Dict[str, Operation]:
    return {
        "+": Operation("+", lambda a, b: a + b, "Addition"),
        "-": Operation("-", lambda a, b: a - b, "Subtraction"),
        "*": Operation("*", lambda a, b: a * b, "Multiplication"),
        "/": Operation("/", _safe_divide, "Division"),
    }


def _parse_expression(expr: str) -> tuple[float, str, float]:
    parts = expr.split()
    if len(parts) != 3:
        raise CalculatorError("Expressions must look like '2 + 2'.")
    left_raw, op_symbol, right_raw = parts
    try:
        left = float(left_raw)
        right = float(right_raw)
    except ValueError as exc:
        raise CalculatorError("Operands must be numbers.") from exc
    return left, op_symbol, right


class Calculator:
    """Evaluates binary arithmetic expressions with a fixed operator set."""

    def __init__(self, operations: Mapping[str, Operation] | None = None):
        self._operations = dict(operations) if operations else _default_operations()

    def evaluate(self, expr: str) -> float:
        expr = expr.strip()
        if not expr:
            raise CalculatorError("Expression cannot be empty.")
        left, op_symbol, right = _parse_expression(expr)
        try:
            operation = self._operations[op_symbol]
        except KeyError as exc:
            raise CalculatorError(f"Unsupported operator '{op_symbol}'.") from exc
        return operation.func(left, right)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate a binary arithmetic expression such as '2 + 2'."
    )
    parser.add_argument(
        "expression",
        nargs="?",
        help="The expression to evaluate; wrap it in quotes, e.g. \"2 + 2\".",
    )
    parser.add_argument(
        "--precision",
        type=int,
        default=3,
        help="Number of decimal places to display (default: 3).",
    )
    return parser


def main(argv: list[str] | None = None) -> None:
    parser = _build_parser()
    args = parser.parse_args(argv)
    expression = args.expression or input("Expression (e.g. '2 + 2'): ").strip()
    calculator = Calculator()
    try:
        result = calculator.evaluate(expression)
    except CalculatorError as error:
        parser.error(str(error))
        return
    formatter = f"{{:.{max(args.precision, 0)}f}}"
    print(formatter.format(result))


if __name__ == "__main__":
    main()
