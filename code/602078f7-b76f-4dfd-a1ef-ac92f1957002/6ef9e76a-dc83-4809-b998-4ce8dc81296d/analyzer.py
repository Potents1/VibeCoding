from __future__ import annotations

from collections import Counter
from dataclasses import asdict, dataclass
import re
from typing import List, Tuple

_WORD_RE = re.compile(r"[A-Za-z0-9']+")


@dataclass(frozen=True)
class TextStats:
    """Container for the derived text statistics."""

    lines: int
    words: int
    characters: int
    sentences: int
    avg_word_length: float
    top_words: List[Tuple[str, int]]

    def as_dict(self) -> dict:
        """Return a JSON-serialisable representation with rounded metrics."""
        payload = asdict(self)
        payload["top_words"] = list(self.top_words)
        payload["avg_word_length"] = round(self.avg_word_length, 3)
        return payload


def _count_lines(text: str) -> int:
    if not text:
        return 0
    return len(text.splitlines())


def analyze_text(text: str, top_n: int = 5) -> TextStats:
    """Compute aggregate statistics for the supplied text block."""
    if top_n <= 0:
        raise ValueError("top_n must be a positive integer.")

    words = _WORD_RE.findall(text.lower())
    word_count = len(words)
    character_count = len(text)
    line_count = _count_lines(text)
    sentence_fragments = [
        fragment.strip() for fragment in re.split(r"[.!?]+", text) if fragment.strip()
    ]
    sentence_count = len(sentence_fragments)

    avg_word_length = (
        sum(len(word) for word in words) / word_count if word_count else 0.0
    )

    top_words = Counter(words).most_common(top_n)

    return TextStats(
        lines=line_count,
        words=word_count,
        characters=character_count,
        sentences=sentence_count,
        avg_word_length=avg_word_length,
        top_words=top_words,
    )
