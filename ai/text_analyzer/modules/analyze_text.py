"""Orchestrates a single text analysis: prompt -> Ollama (function calling) ->
structured result. No file I/O; persistence and timestamping happen in api.py.
"""

from .build_prompt import build_messages
from .ollama_client import OLLAMA_MODEL, chat_completion
from .tools import RISK_TOOL


class AnalysisError(RuntimeError):
    """Raised when the model response can't be turned into a risk assessment
    (e.g. it answered in prose instead of calling the tool)."""


def analyze_text(text: str) -> dict:
    """Classify a driver-behavior log. Returns
    {risk_level, explanation, risk_factors, model}. Raises AnalysisError if the
    model did not emit a tool call, and OllamaUnavailable (from the client) if
    the server is unreachable."""
    resp = chat_completion(build_messages(text), [RISK_TOOL])

    tool_calls = (resp.get("message") or {}).get("tool_calls") or []
    if not tool_calls:
        # The model replied in plain text instead of calling the tool.
        raise AnalysisError(
            "Model did not return a tool call. Use a tool-capable model "
            f"(current: '{OLLAMA_MODEL}'). Plain-text reply was: "
            f"{(resp.get('message') or {}).get('content', '')!r}"
        )

    # Ollama returns tool-call arguments as an already-parsed dict.
    args = tool_calls[0].get("function", {}).get("arguments", {})

    return {
        "risk_level": args.get("risk_level"),
        "explanation": args.get("explanation", ""),
        "risk_factors": args.get("risk_factors", []),
        "model": OLLAMA_MODEL,
    }
