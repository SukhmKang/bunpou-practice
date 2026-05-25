from __future__ import annotations

import json
import os
from collections.abc import Iterator
from pathlib import Path
from typing import Optional

import anthropic
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

DEFAULT_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")


class Evaluation(BaseModel):
    category: str  # 自然 / 不自然だが文法は正しい / 文法ミス / 文法点を使ってない
    reasoning: str
    corrected: Optional[str] = None
    why_better: Optional[str] = None
    native_examples: list[str]
    nuance_note: Optional[str] = None


SYSTEM_PROMPT = "You are a Japanese teacher evaluating a JLPT N2 student's practice sentence."


def build_prompt(sentence: str, gp: dict) -> str:
    examples = gp.get("example_sentences", [])
    numbered = "\n".join(f"{i + 1}. {s}" for i, s in enumerate(examples))
    warning_line = f"WARNING: {gp['warning']}\n" if "warning" in gp else ""
    meaning = gp.get("jp_meaning", gp.get("eng_meaning", ""))

    return f"""\
GRAMMAR POINT: {gp['pattern']}
MEANING: {meaning}
{warning_line}EXAMPLE SENTENCES FROM TEXTBOOK:
{numbered}

STUDENT'S SENTENCE:
{sentence}

Evaluate the sentence. Fields:
- category: one of [自然, 不自然だが文法は正しい, 文法ミス, 文法点を使ってない]
- reasoning: 1-2 sentences in Japanese. Be specific about what makes it natural or unnatural. If unnatural, identify whether it's word choice, particle usage, register/formality mismatch, semantic mismatch with the grammar point's nuance, or violation of the WARNING constraint.
- corrected: if category is anything other than 自然, a corrected version. If 自然 but could be smoother, a "more native" version. Omit if perfect.
- why_better: only if corrected is provided — 1 sentence in Japanese explaining the change.
- native_examples: exactly 2 examples using this grammar in different contexts than the student's sentence.
- nuance_note: only if there's a non-obvious nuance the student should know. Omit otherwise.

Rules:
- Be direct and honest. Don't soften genuine criticism, but also don't invent or inflate problems when the sentence is genuinely good. If the sentence is natural, say so plainly — don't search for minor stylistic preferences to flag just to seem rigorous.
- If the WARNING rule is violated, explicitly call it out in reasoning.
- Don't compliment the student's sentence in reasoning.
- If you're uncertain whether something is unnatural vs. just regional/stylistic, say so.
- Avoid both sycophancy ("great sentence! one tiny thing...") and performative strictness ("technically you could also say...")."""


def build_stream_prompt(sentence: str, gp: dict) -> str:
    examples = gp.get("example_sentences", [])
    numbered = "\n".join(f"{i + 1}. {s}" for i, s in enumerate(examples))
    warning_line = f"WARNING: {gp['warning']}\n" if "warning" in gp else ""
    meaning = gp.get("jp_meaning", gp.get("eng_meaning", ""))

    return f"""\
GRAMMAR POINT: {gp['pattern']}
MEANING: {meaning}
{warning_line}EXAMPLE SENTENCES FROM TEXTBOOK:
{numbered}

STUDENT'S SENTENCE:
{sentence}

Give the student a concise evaluation in Japanese. Do not output JSON.
Include:
- whether the sentence is natural, unnatural but grammatically correct, grammatically wrong, or not using the grammar point
- the main reason
- a corrected or more native version if useful
- one short note about nuance if useful

Rules:
- Be direct and honest.
- If the WARNING rule is violated, explicitly call it out.
- Don't compliment the student's sentence.
- Avoid nitpicking when the sentence is already natural."""


def evaluate(sentence: str, grammar_point: dict) -> Evaluation:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.parse(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_prompt(sentence, grammar_point)}],
        output_format=Evaluation,
        temperature=0.2,
    )
    return response.parsed_output


def stream_evaluation_text(sentence: str, grammar_point: dict) -> Iterator[str]:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    with client.messages.stream(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": build_stream_prompt(sentence, grammar_point)}
        ],
        temperature=0.2,
    ) as stream:
        yield from stream.text_stream


if __name__ == "__main__":
    merged_path = Path("../grammar_points_merged.json")
    if not merged_path.exists():
        print("Run merge.py first to generate grammar_points_merged.json")
        raise SystemExit(1)

    with open(merged_path, encoding="utf-8") as f:
        lessons = json.load(f)

    demo_point = lessons[0]["grammar_points"][0]
    demo_sentence = "この整理券は、商品受け取りの際、必要です。"

    print(f"Grammar point: {demo_point['pattern']}")
    print(f"Sentence: {demo_sentence}\n")

    result = evaluate(demo_sentence, demo_point)
    print(json.dumps(result.model_dump(exclude_none=True), ensure_ascii=False, indent=2))
