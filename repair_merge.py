"""
Repairs grammar_points_merged.json by restoring leading digits that were
incorrectly stripped during merging. The bug: the original regex used
`[①-⑳\d]+` which also consumed digits at the start of sentence content
(e.g. "④3年前に..." became "年前に..." instead of "3年前に...").

Strategy: for each example sentence in the merged file, look for a source
sentence (from the transcribed checkpoint) whose correctly-stripped form
has the merged sentence as a suffix. If found, replace with the correct version.
"""

import json
import re
from pathlib import Path

MERGED_FILE = Path("grammar_points_merged.json")
CHECKPOINT_FILE = Path("transcribed.json")
OUTPUT_FILE = Path("grammar_points_merged.json")


def correct_strip(s: str) -> str:
    return re.sub(r"^[①-⑳]+[.．、\s]*", "", s)


def build_source_index(checkpoint: dict) -> dict[str, str]:
    """Maps correctly-stripped sentence → original correctly-stripped sentence.
    Keyed by the stripped form so we can look up by suffix match."""
    index: dict[str, str] = {}
    for lesson in checkpoint["results"]:
        for point in lesson["grammar_points"]:
            for s in point.get("example_sentences", []):
                stripped = correct_strip(s)
                index[stripped] = stripped
    return index


def repair(merged: list, source_index: dict[str, str]) -> tuple[list, int]:
    fixes = 0
    for lesson in merged:
        for point in lesson["grammar_points"]:
            if "example_sentences" not in point:
                continue
            repaired = []
            for sentence in point["example_sentences"]:
                # Check if any source sentence's correct form has this as a suffix
                # (meaning our version is missing a leading digit)
                match = next(
                    (src for src in source_index if src.endswith(sentence) and src != sentence),
                    None,
                )
                if match:
                    print(f"  Fix: '{sentence}' → '{match}'")
                    repaired.append(match)
                    fixes += 1
                else:
                    repaired.append(sentence)
            point["example_sentences"] = repaired
    return merged, fixes


def main():
    with open(MERGED_FILE, encoding="utf-8") as f:
        merged = json.load(f)

    with open(CHECKPOINT_FILE, encoding="utf-8") as f:
        transcribed = json.load(f)

    source_index = build_source_index({"results": transcribed})

    print("Scanning for truncated leading digits...\n")
    merged, fixes = repair(merged, source_index)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    print(f"\n{fixes} sentence(s) repaired → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
