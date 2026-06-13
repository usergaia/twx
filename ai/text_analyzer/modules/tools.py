"""Function-calling tool schema for the text analyzer.

The model is given exactly one tool and instructed (see build_prompt) to always
call it. Its arguments ARE the structured result — this is how we get
schema-shaped output instead of parsing free-form prose. Pure data, no I/O.
"""

# Risk labels the model may assign. Keep in sync with RiskAssessment.risk_level
# in api.py and the RiskLevel type in fe/src/types/analysis.ts.
RISK_LEVELS = ["safe", "moderate_risk", "high_risk"]

RISK_TOOL = {
    "type": "function",
    "function": {
        "name": "record_risk_assessment",
        "description": "Record the risk classification of a driver behavior log.",
        "parameters": {
            "type": "object",
            "properties": {
                "risk_level": {
                    "type": "string",
                    "enum": RISK_LEVELS,
                    "description": "Overall risk of the described driving behavior.",
                },
                "explanation": {
                    "type": "string",
                    "description": "One short paragraph justifying the classification.",
                },
                "risk_factors": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Specific behaviors driving the risk (e.g. 'hard braking', 'speeding').",
                },
            },
            "required": ["risk_level", "explanation", "risk_factors"],
        },
    },
}

# Used by /report: narrates an existing driver_eval result into a written
# incident report. Deliberately has NO risk_level field — the rules engine
# already assigned the risk; this tool only explains and recommends, so the
# two systems never produce competing verdicts.
REPORT_TOOL = {
    "type": "function",
    "function": {
        "name": "write_incident_report",
        "description": "Write a concise incident report and recommendations for a driver, based on an automated evaluation.",
        "parameters": {
            "type": "object",
            "properties": {
                "summary": {
                    "type": "string",
                    "description": "A short plain-English narrative of the driver's behavior and the issues the evaluation flagged.",
                },
                "recommendations": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Actionable next steps for dispatch / fleet ops (e.g. 'Schedule a rest break').",
                },
            },
            "required": ["summary", "recommendations"],
        },
    },
}
