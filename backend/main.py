from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.resume_parser import extract_text_from_file_bytes
from services.scoring_service import score_applicants_from_texts
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)

origins = [
    "https://ai-applicant-selector.vercel.app",  # frontend on Vercel
    "http://localhost:5173",                     # local dev
    "*"                                           # (optional: allow all for testing)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "AI Applicant Selector API active."}

@app.post("/api/score-resumes")
async def score_resumes(
    file: UploadFile = File(...),
    target_skills: str = Form(...)
):
    try:
        # Extract text from resume file
        resume_text = await extract_text_from_file_bytes(await file.read(), file.filename)

        # Score applicant
        scored = score_applicants_from_texts([{"name": file.filename, "text": resume_text}], target_skills)
        return {"ranked_applicants": scored}

    except Exception as e:
        logging.exception("Error scoring resumes")
        raise HTTPException(status_code=500, detail=str(e))
