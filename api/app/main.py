from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Outreach AI API", version="0.1.0")

# Phase 1: permissive local dev CORS so the Next.js app can call the API.
# In production, tighten origins to the deployed web hostname.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/leads/validate")
def validate_leads() -> dict[str, str]:
    # Placeholder endpoint: Phase 1 keeps validation in the frontend.
    return {"status": "not_implemented"}

