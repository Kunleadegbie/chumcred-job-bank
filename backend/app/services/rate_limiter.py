from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple


RATE_LIMITS = {
    "career_iq": (30, 3600),
    "cv_intelligence": (30, 3600),
    "interview_iq": (30, 3600),
    "employer_ai": (60, 3600),
    "institution_ai": (40, 3600),
    "admin_ai": (40, 3600),
    "copilot": (60, 3600),
    "default": (30, 3600),
}

_REQUEST_LOGS: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)


class RateLimitError(Exception):
    pass


def check_rate_limit(user_id: str, tool_name: str) -> dict:
    limit, window_seconds = RATE_LIMITS.get(tool_name, RATE_LIMITS["default"])
    key = (user_id, tool_name)
    now = time.time()
    logs = _REQUEST_LOGS[key]

    while logs and logs[0] <= now - window_seconds:
        logs.popleft()

    if len(logs) >= limit:
        retry_after = int(window_seconds - (now - logs[0]))
        raise RateLimitError(
            f"Rate limit exceeded for {tool_name}. Try again in {retry_after} seconds."
        )

    logs.append(now)

    return {
        "allowed": True,
        "limit": limit,
        "remaining": max(limit - len(logs), 0),
        "window_seconds": window_seconds,
    }