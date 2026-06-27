import os
import json
import time
from typing import Any

from openai import OpenAI


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

DEFAULT_MODEL = os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4.1-mini")


def clean_json_response(content: str) -> str:
    content = (content or "").strip()

    if content.startswith("```json"):
        content = content.replace("```json", "", 1).strip()

    if content.startswith("```"):
        content = content.replace("```", "", 1).strip()

    if content.endswith("```"):
        content = content[:-3].strip()

    return content


def generate_text(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.4,
    max_tokens: int = 900,
    retries: int = 2,
) -> str:
    selected_model = model or DEFAULT_MODEL
    last_error = None

    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=selected_model,
                temperature=temperature,
                max_tokens=max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            return (response.choices[0].message.content or "").strip()

        except Exception as error:
            last_error = error
            if attempt < retries:
                time.sleep(1)

    raise RuntimeError(f"AI text generation failed: {str(last_error)}")


def generate_json(
    prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    max_tokens: int = 1200,
    retries: int = 2,
    fallback: dict | None = None,
) -> dict[str, Any]:
    fallback = fallback or {}
    selected_model = model or DEFAULT_MODEL
    last_error = None

    for attempt in range(retries + 1):
        try:
            response = client.chat.completions.create(
                model=selected_model,
                temperature=temperature,
                max_tokens=max_tokens,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
            )

            content = response.choices[0].message.content or ""
            cleaned = clean_json_response(content)

            return json.loads(cleaned)

        except Exception as error:
            last_error = error
            if attempt < retries:
                time.sleep(1)

    return {
        **fallback,
        "ai_error": str(last_error),
    }


def compact_text(value: Any, limit: int = 4000) -> str:
    text = str(value or "").strip()

    if len(text) <= limit:
        return text

    return text[:limit] + "\n\n[Truncated for processing]"