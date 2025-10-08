from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
from io import StringIO
from services.scoring_service import score_applicants

app = FastAPI(title="AI Applicant Selector API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI Applicant Selector API is running."}


# ---- AI SCORING ----
@app.post("/api/score")
async def upload_and_score(file: UploadFile = File(...), target_skills: str = Form(...)):
    """
    Upload a CSV file with applicant data and score them against target skills.
    """
    contents = await file.read()
    df = pd.read_csv(StringIO(contents.decode("utf-8")))

    # Expected columns: name,email,skills,experience_years,education_level
    applicants = []
    for i, row in df.iterrows():
        applicants.append({
            "id": i + 1,
            "name": row.get("name", ""),
            "email": row.get("email", ""),
            "skills": str(row.get("skills", "")).split(","),
            "experience_years": float(row.get("experience_years", 0)),
            "education_level": str(row.get("education_level", "none"))
        })

    target_skills_list = target_skills.split(",")
    ranked = score_applicants(applicants, target_skills_list)
    return {"ranked_applicants": ranked}


@app.get("/api/applicants")
def get_sample_applicants():
    """
    Returns a pre-ranked demo list for frontend visualization.
    """
    sample = [
        {"id": 1, "name": "Ada Obi", "skills": ["Python", "Data Analysis", "Excel"], "experience_years": 4, "education_level": "Bachelor"},
        {"id": 2, "name": "Tunde Bello", "skills": ["JavaScript", "React", "Node"], "experience_years": 3, "education_level": "HND"},
        {"id": 3, "name": "Ngozi Eze", "skills": ["Python", "Machine Learning", "TensorFlow"], "experience_years": 6, "education_level": "Masters"}
    ]
    target = ["Python", "Data Analysis", "Machine Learning"]
    return {"ranked_applicants": score_applicants(sample, target)}
