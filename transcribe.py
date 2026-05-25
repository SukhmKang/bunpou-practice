import base64
import json
import os
from pathlib import Path
from typing import Optional

import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

PICTURES_DIR = Path("pictures")
OUTPUT_FILE = Path("transcribed.json")

PROMPT = """These are two pages from a Japanese grammar textbook.
Transcribe all grammar points found across both pages.
Copy all text verbatim exactly as it appears — no paraphrasing, summarising, or rewording of any kind.

Important: if a grammar point uses labels (A), (B), (C), etc., create a separate entry for each label. Each entry should carry the label in its grammar_pattern field (e.g. "～うちに（A）", "～うちに（B）")."""


class GrammarPoint(BaseModel):
    grammar_pattern: str
    meaning: str
    example_sentences: list[str]
    warning: Optional[str] = None


class GrammarPoints(BaseModel):
    points: list[GrammarPoint]


def encode_image(path: Path) -> str:
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("utf-8")


def transcribe_pair(client: anthropic.Anthropic, img1: Path, img2: Path) -> list[dict]:
    content = []
    for img in [img1, img2]:
        content.append({
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": encode_image(img),
            },
        })
    content.append({"type": "text", "text": PROMPT})

    response = client.messages.parse(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": content}],
        output_format=GrammarPoints,
    )

    return [p.model_dump(exclude_none=True) for p in response.parsed_output.points]


CHECKPOINT_FILE = Path("transcribed.checkpoint.json")


def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"done_pairs": [], "results": []}


def save_checkpoint(done_pairs: list[str], results: list[dict]) -> None:
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump({"done_pairs": done_pairs, "results": results}, f, ensure_ascii=False, indent=2)


def main():
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    images = sorted(PICTURES_DIR.glob("*.JPG")) + sorted(PICTURES_DIR.glob("*.jpg"))
    pairs = [(images[i], images[i + 1]) for i in range(0, len(images) - 1, 2)]

    checkpoint = load_checkpoint()
    done_pairs: list[str] = checkpoint["done_pairs"]
    results: list[dict] = checkpoint["results"]

    if done_pairs:
        print(f"Resuming from checkpoint — {len(done_pairs)}/{len(pairs)} pairs already done.")

    for i, (img1, img2) in enumerate(pairs):
        pair_key = f"{img1.name}+{img2.name}"
        if pair_key in done_pairs:
            continue

        lesson_number = i + 1
        print(f"Processing pair {lesson_number}/{len(pairs)}: {img1.name}, {img2.name}")
        try:
            grammar_points = transcribe_pair(client, img1, img2)
            results.append({"lesson": lesson_number, "grammar_points": grammar_points})
            done_pairs.append(pair_key)
            save_checkpoint(done_pairs, results)
        except Exception as e:
            print(f"  Error: {e}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    if len(done_pairs) == len(pairs):
        CHECKPOINT_FILE.unlink(missing_ok=True)

    total = sum(len(lesson["grammar_points"]) for lesson in results)
    print(f"\nDone. {len(results)} lessons, {total} grammar points written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
