"""Narrates a driver_eval result into a written incident report (Role B).
Takes the evaluation output + telemetry, asks the LLM (via function calling) to
write a summary + recommendations. Does NOT re-classify risk. No file I/O.
"""

from .analyze_text import AnalysisError
from .build_prompt import build_report_messages
from .ollama_client import OLLAMA_MODEL, chat_completion
from .tools import REPORT_TOOL


def _format_context(p: dict) -> str:
    """Render the evaluation + telemetry into a readable block for the model."""
    alerts = p.get("alerts") or []
    alerts_str = ", ".join(alerts) if alerts else "none"

    # Only include telemetry fields that were actually provided.
    telemetry_fields = [
        ("speed", "km/h"),
        ("route", ""),
        ("weather", ""),
        ("fuel", "%"),
        ("temperature", "°C"),
        ("fatigue", "/100"),
    ]
    telemetry = [
        f"{name}={p[name]}{unit}"
        for name, unit in telemetry_fields
        if p.get(name) is not None
    ]
    telemetry_str = "; ".join(telemetry) if telemetry else "not provided"

    return (
        f"Driver: {p.get('name')} ({p.get('location')})\n"
        f"Automated evaluation — status: {p.get('status')}, score: {p.get('score')}/100\n"
        f"Alerts raised: {alerts_str}\n"
        f"Trip telemetry: {telemetry_str}"
    )


def generate_report(payload: dict) -> dict:
    """Produce {summary, recommendations, model} from a driver_eval result.
    Raises AnalysisError if the model did not call the tool, and OllamaUnavailable
    (from the client) if the server is unreachable."""
    context = _format_context(payload)
    resp = chat_completion(build_report_messages(context), [REPORT_TOOL])

    message = resp.get("message") or {}
    tool_calls = message.get("tool_calls") or []

    if not tool_calls:
        # Function calling is less reliable on a generative task: for benign
        # drivers the model sometimes writes the report as plain text instead of
        # calling the tool. Degrade gracefully — use that text as the summary
        # rather than failing the request. Only error if there's nothing at all.
        content = (message.get("content") or "").strip()
        if content:
            return {"summary": content, "recommendations": [], "model": OLLAMA_MODEL}
        raise AnalysisError(
            "Model returned neither a tool call nor any text "
            f"(model: '{OLLAMA_MODEL}')."
        )

    args = tool_calls[0].get("function", {}).get("arguments", {})
    return {
        "summary": args.get("summary", ""),
        "recommendations": args.get("recommendations", []),
        "model": OLLAMA_MODEL,
    }
