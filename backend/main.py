from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.resume_parser import extract_text_from_file_bytes
from services.scoring_service import score_applicants_from_texts
import logging

app = FastAPI()
logging.basicConfig(level=logging.INFO)

origins = [
    "https://ai-applicant-selector.vercel.app",  # frontend
    "http://localhost:5173",                     # local dev
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
async def score_resumes(files: list[UploadFile] = File(...), job_description: str = Form(...)):
    try:
        applicants = []
        for idx, f in enumerate(files):
            content = await f.read()
            text, ext = extract_text_from_file_bytes(f.filename, content)
            applicants.append({
                "id": idx + 1,
                "name": f.filename.rsplit(".", 1)[0],
                "skills": [],
                "experience_years": 0,
                "education_level": "none",
                "text": text
            })

        ranked = score_applicants_from_texts(applicants, job_description)
        return {"ranked_applicants": ranked}
    except Exception as e:
        logging.exception("Error scoring resumes")
        raise HTTPException(status_code=500, detail=str(e))
