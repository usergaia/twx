import io
import os
import sys
from pathlib import Path
from typing import List, Literal

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from driver_decision_system import (
    DRIVERS_PATH,
    RESULTS_PATH,
    append_to_json,
    evaluate_driver,
)

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "drivers.csv"
REQUIRED_CSV_COLUMNS = {"name", "location", "speed"}


class DriverInput(BaseModel):
    name: str
    location: str
    speed: float
    route: str = ""
    weather: Literal["clear", "rain", "fog"] = "clear"
    fuel: float = 100
    temperature: float = 0
    fatigue: float = 0


class EvaluationResult(BaseModel):
    name: str
    location: str
    alerts: List[str]
    score: int
    status: Literal["safe", "caution", "danger"]
    timestamp: str


class UploadResponse(BaseModel):
    filename: str
    row_count: int


def _df_to_drivers(df: pd.DataFrame) -> List[DriverInput]:
    drivers: List[DriverInput] = []
    for i, row in df.iterrows():
        row_dict = {k: v for k, v in row.items() if pd.notna(v)}
        try:
            drivers.append(DriverInput(**row_dict))
        except ValidationError as e:
            raise HTTPException(
                status_code=400,
                detail={"row": int(i), "errors": e.errors()},
            )
    return drivers


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Smart Logistics AI API"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/evaluate", response_model=EvaluationResult)
def evaluate(driver: DriverInput):
    payload = driver.model_dump()
    result = evaluate_driver(payload)
    append_to_json(RESULTS_PATH, result)
    append_to_json(DRIVERS_PATH, {**payload, "timestamp": result["timestamp"]})
    return result

@app.post("/drivers/batch", response_model=UploadResponse)
async def upload_drivers_batch(file: UploadFile = File(...)):
    content = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"could not parse CSV: {e}")

    missing = REQUIRED_CSV_COLUMNS - set(df.columns)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"missing required column(s): {', '.join(sorted(missing))}",
        )

    drivers = _df_to_drivers(df)

    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    DATA_PATH.write_bytes(content)

    return UploadResponse(filename=file.filename or "drivers.csv", row_count=len(drivers))


@app.get("/drivers/batch", response_model=List[DriverInput])
def read_drivers_batch():
    if not DATA_PATH.exists():
        return []
    try:
        df = pd.read_csv(DATA_PATH)
    except Exception:
        return []
    try:
        return _df_to_drivers(df)
    except HTTPException as e:
        raise HTTPException(
            status_code=500,
            detail=f"stored CSV is corrupt: {e.detail}",
        )


@app.post("/drivers/batch/evaluate", response_model=List[EvaluationResult])
def evaluate_drivers_batch():
    if not DATA_PATH.exists():
        raise HTTPException(status_code=404, detail="no drivers CSV uploaded yet")
    try:
        df = pd.read_csv(DATA_PATH)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"could not read stored CSV: {e}")

    try:
        drivers = _df_to_drivers(df)
    except HTTPException as e:
        raise HTTPException(
            status_code=500,
            detail=f"stored CSV is corrupt: {e.detail}",
        )

    results: List[dict] = []
    for driver in drivers:
        payload = driver.model_dump()
        result = evaluate_driver(payload)
        append_to_json(RESULTS_PATH, result)
        append_to_json(DRIVERS_PATH, {**payload, "timestamp": result["timestamp"]})
        results.append(result)

    return results
