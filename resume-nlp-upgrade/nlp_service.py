from fastapi import FastAPI, Request
from pydantic import BaseModel
import spacy
from sentence_transformers import SentenceTransformer, util
import torch

app = FastAPI()
nlp = spacy.load('en_core_web_sm')
embedder = SentenceTransformer('all-MiniLM-L6-v2')

class ResumeRequest(BaseModel):
    text: str
    skills: list

@app.post("/parse_resume/")
async def parse_resume(request: ResumeRequest):
    text = request.text
    target_skills = request.skills
    
    # Skill matching
    sentences = [s.strip() for s in text.split('\n') if s.strip()]
    resume_embs = embedder.encode(sentences, convert_to_tensor=True)
    skill_embs = embedder.encode(target_skills, convert_to_tensor=True)
    matched_skills = []
    for i, skill_emb in enumerate(skill_embs):
        cos_scores = util.pytorch_cos_sim(resume_embs, skill_emb)
        if torch.max(cos_scores).item() > 0.35:
            matched_skills.append(target_skills[i])

    # Basic NER extraction
    doc = nlp(text)
    names = [ent.text for ent in doc.ents if ent.label_ == 'PERSON']

    # Return skills and names (add as needed)
    return {
        "skills": matched_skills,
        "names": names
    }
