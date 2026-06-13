import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from driver_eval.api import router as driver_eval_router
from text_analyzer.api import router as text_analyzer_router

# Browser origins allowed by CORS. Defaults to the local FE; override in prod
# via the CORS_ORIGINS env var (comma-separated, e.g. "https://app.example.com").
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Smart Logistics AI API"}


@app.get("/health")
def health():
    return {"status": "ok"}


# Each AI system mounts its own router here. Add a new system = a sibling
# ai/<system>/ folder of the same shape + one include_router line below.
app.include_router(driver_eval_router)
app.include_router(text_analyzer_router)
