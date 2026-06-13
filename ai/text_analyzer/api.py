from datetime import datetime
from typing import List, Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from .modules.analyze_text import AnalysisError, analyze_text
from .modules.generate_report import generate_report
from .modules.ollama_client import OllamaUnavailable
from .modules.storage import ANALYSES_PATH, REPORTS_PATH, append_to_json


class AnalyzeRequest(BaseModel):
    # Validate input before sending it to the model (length cap = cheap abuse guard).
    text: str = Field(min_length=1, max_length=5000)


class RiskAssessment(BaseModel):
    # Must stay in sync with TextAnalysis in fe/src/types/analysis.ts.
    risk_level: Literal["safe", "moderate_risk", "high_risk"]
    explanation: str
    risk_factors: List[str]
    model: str
    timestamp: str


class ReportRequest(BaseModel):
    # A driver_eval result + the telemetry that produced it. The optional
    # telemetry gives the LLM concrete numbers for a richer narrative.
    name: str
    location: str
    speed: Optional[float] = None
    route: Optional[str] = None
    weather: Optional[str] = None
    fuel: Optional[float] = None
    temperature: Optional[float] = None
    fatigue: Optional[float] = None
    alerts: List[str]
    score: int
    status: Literal["safe", "caution", "danger"]


class IncidentReport(BaseModel):
    # Must stay in sync with IncidentReport in fe/src/types/analysis.ts.
    summary: str
    recommendations: List[str]
    model: str
    timestamp: str


router = APIRouter()


@router.post("/analyze", response_model=RiskAssessment)
def analyze(req: AnalyzeRequest):
    try:
        result = analyze_text(req.text)
    except OllamaUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AnalysisError as e:
        raise HTTPException(status_code=502, detail=str(e))

    result["timestamp"] = datetime.now().isoformat(timespec="seconds")
    append_to_json(ANALYSES_PATH, {**result, "text": req.text})
    return result


@router.post("/report", response_model=IncidentReport)
def report(req: ReportRequest):
    try:
        result = generate_report(req.model_dump())
    except OllamaUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    except AnalysisError as e:
        raise HTTPException(status_code=502, detail=str(e))

    result["timestamp"] = datetime.now().isoformat(timespec="seconds")
    append_to_json(
        REPORTS_PATH,
        {**result, "driver": req.name, "status": req.status, "score": req.score},
    )
    return result
