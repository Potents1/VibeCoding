import pytest

from calculator import Calculator, CalculatorError


@pytest.fixture
def calc() -> Calculator:
    return Calculator()


@pytest.mark.parametrize(
    ("expr", "expected"),
    [
        ("2 + 2", 4),
        ("5 - 8", -3),
        ("3 * 1.5", 4.5),
        ("9 / 3", 3),
    ],
)
def test_evaluate_operations(calc: Calculator, expr: str, expected: float) -> None:
    assert calc.evaluate(expr) == pytest.approx(expected)


def test_rejects_unknown_operator(calc: Calculator) -> None:
    with pytest.raises(CalculatorError):
        calc.evaluate("1 ^ 2")


def test_rejects_bad_operand(calc: Calculator) -> None:
    with pytest.raises(CalculatorError):
        calc.evaluate("one + 2")


def test_rejects_bad_shape(calc: Calculator) -> None:
    with pytest.raises(CalculatorError):
        calc.evaluate("2 + 2 + 2")


def test_rejects_empty_expression(calc: Calculator) -> None:
    with pytest.raises(CalculatorError):
        calc.evaluate("   ")


def test_division_by_zero(calc: Calculator) -> None:
    with pytest.raises(CalculatorError):
        calc.evaluate("1 / 0")
