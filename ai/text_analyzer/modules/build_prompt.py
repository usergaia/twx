"""Prompt construction for the text analyzer. Pure, no I/O."""

SYSTEM_PROMPT = (
    "You are an AI traffic-safety analyst for a logistics fleet. "
    "You read a free-text driver behavior log, incident report, or note and "
    "classify its overall risk as one of: safe, moderate_risk, high_risk.\n\n"
    "Always respond by calling the `record_risk_assessment` tool — never reply "
    "in plain text. Base the classification only on what the log actually "
    "describes. Keep the explanation to one short paragraph and list the "
    "concrete behaviors that drove the risk in risk_factors."
)


def build_messages(text: str) -> list[dict]:
    """Build the chat-message list sent to the model for a single log."""
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": text},
    ]


REPORT_SYSTEM_PROMPT = (
    "You are a fleet safety officer writing up the result of an automated "
    "driver evaluation. You are given the evaluation's risk status, score, and "
    "the specific alerts it raised, along with the trip telemetry that produced "
    "them. Write a concise incident report that explains, in plain English, what "
    "happened and why it was flagged, then give actionable recommendations for "
    "dispatch.\n\n"
    "Do NOT invent a new risk rating or contradict the evaluation — refer to the "
    "provided status and score as authoritative. Write a report for EVERY driver, "
    "including safe ones (a brief 'no issues observed' report is fine). Always "
    "respond by calling the `write_incident_report` tool, never plain text."
)


def build_report_messages(context: str) -> list[dict]:
    """Build the chat-message list for narrating a driver_eval result. `context`
    is a human-readable summary of the evaluation + telemetry."""
    return [
        {"role": "system", "content": REPORT_SYSTEM_PROMPT},
        {"role": "user", "content": context},
    ]
