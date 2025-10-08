import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Weighted scoring configuration
WEIGHTS = {
    "skills": 0.5,
    "experience": 0.3,
    "education": 0.2
}

# Basic education ranking
EDUCATION_RANK = {
    "phd": 5,
    "masters": 4,
    "bachelor": 3,
    "hnd": 2,
    "diploma": 1,
    "none": 0
}

def clean_text(text):
    return re.sub(r"[^a-zA-Z\s]", "", text.lower())

def score_applicants(applicants: list, target_skills: list):
    """Return ranked applicants with composite AI score."""
    if not applicants:
        return []

    target = clean_text(" ".join(target_skills))
    vectorizer = TfidfVectorizer().fit([target] + [clean_text(" ".join(a["skills"])) for a in applicants])
    target_vec = vectorizer.transform([target])
    
    for a in applicants:
        applicant_vec = vectorizer.transform([clean_text(" ".join(a["skills"]))])
        skill_score = cosine_similarity(target_vec, applicant_vec)[0][0] * 100

        experience_score = min(a["experience_years"] / 10, 1) * 100  # cap at 10 years = 100%
        edu_score = EDUCATION_RANK.get(a["education_level"].lower(), 0) / 5 * 100

        total = (skill_score * WEIGHTS["skills"]) + (experience_score * WEIGHTS["experience"]) + (edu_score * WEIGHTS["education"])

        a["score"] = round(total, 2)
        a["summary"] = f"Skill match {skill_score:.1f}%, experience {experience_score:.1f}%, education {edu_score:.1f}%."

    # Sort high to low
    ranked = sorted(applicants, key=lambda x: x["score"], reverse=True)
    return ranked
