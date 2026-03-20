from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from typing import Optional, Sequence

from .analyzer import analyze_text


def _load_text(path: Optional[str]) -> str:
    if path:
        return Path(path).read_text(encoding="utf-8")
    data = sys.stdin.read()
    if not data:
        raise RuntimeError(
            "No input provided. Supply a file path or pipe text through stdin."
        )
    return data


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Report statistics for a text file or stdin stream."
    )
    parser.add_argument(
        "path",
        nargs="?",
        help="optional path to a UTF-8 text file; reads stdin when omitted.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=5,
        help="number of most common words to include (default: 5).",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="pretty-print JSON output for readability.",
    )
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        text = _load_text(args.path)
        stats = analyze_text(text, args.top)
    except (OSError, ValueError, RuntimeError) as exc:
        parser.exit(status=2, message=f"Error: {exc}\n")

    payload = stats.as_dict()
    json_kwargs = {"indent": 2} if args.pretty else {}
    print(json.dumps(payload, **json_kwargs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
