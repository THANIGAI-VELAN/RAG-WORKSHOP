"""FastAPI service for the Asterion Works document-grounded assistant."""

from __future__ import annotations

import logging
import os
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from rag import MissingApiKeyError, answer_question, index_is_initialized

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Asterion Works RAG API", version="1.0.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        question = value.strip()
        if not question:
            raise ValueError("Question must not be blank.")
        return question


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "service": "Asterion Works RAG API"}


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "index_initialized": index_is_initialized(),
    }


@app.post("/api/chat")
async def chat(request: ChatRequest) -> dict[str, Any]:
    try:
        return await run_in_threadpool(answer_question, request.question)
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except MissingApiKeyError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        logger.exception("Chat request failed")
        raise HTTPException(
            status_code=502,
            detail=(
                "The assistant could not complete the request. Check the Gemini "
                "model/API key and backend logs, then try again."
            ),
        ) from error


if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.getenv("BACKEND_HOST", "127.0.0.1"),
        port=int(os.getenv("BACKEND_PORT", "8000")),
    )
