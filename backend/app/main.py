from __future__ import annotations

import json
import os
from collections.abc import Iterator
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.evaluate import evaluate

app = FastAPI(title="Bunpou Practice API")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "https://bunpou-practice.vercel.app",
]


def get_cors_origins() -> list[str]:
    configured_origins = os.getenv("BACKEND_CORS_ORIGINS")
    if not configured_origins:
        return DEFAULT_CORS_ORIGINS

    return [
        origin.strip()
        for origin in configured_origins.split(",")
        if origin.strip()
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/grammar-points")
def grammar_points() -> list[dict[str, object]]:
    return []


class EvaluationStreamRequest(BaseModel):
    sentence: str = Field(min_length=1)
    grammar_point: dict[str, Any]


def _sse_event(event: str, data: object) -> str:
    payload = json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def _stream_evaluation_events(
    sentence: str, grammar_point: dict[str, Any]
) -> Iterator[str]:
    try:
        yield _sse_event("status", {"text": "Evaluating sentence..."})
        result = evaluate(sentence, grammar_point)
        yield _sse_event("result", result.model_dump(exclude_none=True))
        yield _sse_event("done", {})
    except Exception as exc:
        yield _sse_event("error", {"message": str(exc)})


@app.post("/api/evaluate/stream")
def evaluate_stream(request: EvaluationStreamRequest) -> StreamingResponse:
    if "ANTHROPIC_API_KEY" not in os.environ:
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured for the backend.",
        )

    if "pattern" not in request.grammar_point:
        raise HTTPException(
            status_code=422,
            detail="grammar_point must include at least a pattern field.",
        )

    return StreamingResponse(
        _stream_evaluation_events(request.sentence, request.grammar_point),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
