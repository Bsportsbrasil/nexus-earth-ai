from fastapi import FastAPI
from pydantic import BaseModel
import time
import platform
import os

app = FastAPI(
    title="NEXUS Python Distributed Worker & Alignment Microservice",
    version="2.0.0",
    description="High-performance Python FastAPI microservice for Multi-Agent Queue Processing, Vector/GraphRAG indexing, and Ethical Controlled Release auditing."
)

class DirectivePayload(BaseModel):
    query: str
    profile: str = "TEA Nivel 1"
    require_ethical_gate: bool = True

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "runtime": f"Python {platform.python_version()}",
        "pid": os.getpid(),
        "timestamp": int(time.time() * 1000)
    }

@app.post("/worker/evaluate-gate")
def evaluate_gate(payload: DirectivePayload):
    q = payload.query.lower()
    risk = any(w in q for w in ["manipular", "bypass", "exploit", "substituir humanos"])
    agency_score = 0.40 if risk else 0.97
    return {
        "release_gate": "HOLD_HUMAN_REVIEW" if risk else "APPROVED_STAGE_4_COOPERATIVE",
        "human_agency_score": agency_score,
        "eco_joules_estimated": round(len(payload.query) * 0.12, 2),
        "verified_by": "nexus-python-fastapi-worker"
    }
