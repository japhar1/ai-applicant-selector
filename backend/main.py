from fastapi import FastAPI, UploadFile, File
from models.applicant_model import Applicant, RankedApplicant
from services.scoring_service import calculate_applicant_score
from typing import List
import csv
import io

app = FastAPI(
    title="AI Applicant Selector API",
    description="Backend for AI-powered applicant screening and ranking (PLP Hackathon)",
    version="1.0.0"
)

# Temporary in-memory storage
applicants_db: List[RankedApplicant] = []


@app.post("/api/upload")
async def upload_applicant_file(file: UploadFile = File(...)):
    """
    Accepts a CSV file of applicants with columns:
    name,email,role,skills,experience_years,education_level,assessment_score
    """
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))

    global applicants_db
    applicants_db.clear()

    for i, row in enumerate(reader, start=1):
        skills = [s.strip() for s in row.get("skills", "").split(",") if s.strip()]
        applicant = Applicant(
            id=i,
            name=row.get("name", f"Applicant {i}"),
            email=row.get("email", ""),
            role=row.get("role", ""),
            skills=skills,
            experience_years=float(row.get("experience_years", 0)),
            education_level=row.get("education_level", "none"),
            assessment_score=float(row.get("assessment_score", 0))
        )
        score = calculate_applicant_score(applicant)
        applicants_db.append(RankedApplicant(**applicant.dict(), score=score))

    return {"message": f"Processed {len(applicants_db)} applicants successfully."}


@app.get("/api/applicants", response_model=List[RankedApplicant])
async def get_ranked_applicants():
    """
    Returns ranked applicants sorted by AI score (descending).
    """
    ranked = sorted(applicants_db, key=lambda x: x.score, reverse=True)
    return ranked


@app.get("/api/lsetf-export")
async def export_for_lsetf():
    """
    Returns LMS-ready JSON (id, name, email, score only).
    """
    return [
        {"id": a.id, "name": a.name, "email": a.email, "score": a.score}
        for a in sorted(applicants_db, key=lambda x: x.score, reverse=True)
    ]


@app.get("/")
async def root():
    return {"message": "AI Applicant Selector API running"}
