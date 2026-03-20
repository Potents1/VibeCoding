import pytest

from textstats.analyzer import analyze_text


def test_analyze_text_counts_and_top_words():
    text = "Hello world! This is a test. Hello again?"
    stats = analyze_text(text, top_n=2)

    assert stats.lines == 1
    assert stats.words == 8
    assert stats.sentences == 3
    assert stats.top_words[0] == ("hello", 2)
    assert stats.avg_word_length == pytest.approx(3.875, rel=1e-3)


def test_analyze_text_handles_empty_input():
    stats = analyze_text("")

    assert stats.lines == 0
    assert stats.words == 0
    assert stats.characters == 0
    assert stats.sentences == 0
    assert stats.avg_word_length == 0.0
    assert stats.top_words == []


def test_analyze_text_respects_top_n_and_ordering():
    stats = analyze_text("a a b c c c", top_n=2)

    assert stats.top_words == [("c", 3), ("a", 2)]


def test_analyze_text_rejects_non_positive_top_n():
    with pytest.raises(ValueError):
        analyze_text("text", top_n=0)
