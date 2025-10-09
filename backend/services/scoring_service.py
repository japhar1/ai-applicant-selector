import re
from typing import List
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

EDUCATION_RANK = {"phd":5, "masters":4, "bachelor":3, "hnd":2, "diploma":1, "none":0}

def clean_text(t: str) -> str:
    return re.sub(r"[^a-zA-Z0-9\s]", " ", (t or "").lower())

def compute_tfidf_scores(resume_texts: List[str], job_description: str):
    docs = [job_description] + resume_texts
    vectorizer = TfidfVectorizer(stop_words="english").fit(docs)
    vecs = vectorizer.transform(docs)
    job_vec = vecs[0]
    resume_vecs = vecs[1:]
    sims = cosine_similarity(job_vec, resume_vecs).flatten()
    return sims

def score_applicants_from_texts(applicants: list, job_description: str):
    resume_texts = [clean_text(a.get("text","") + " " + " ".join(a.get("skills",[]))) for a in applicants]
    job_text = clean_text(job_description)
    sim_scores = compute_tfidf_scores(resume_texts, job_text)

    results = []
    for a, sim in zip(applicants, sim_scores):
        skill_match = sim * 100
        exp_score = min(a.get("experience_years", 0) / 10.0, 1.0) * 100
        edu_score = EDUCATION_RANK.get(a.get("education_level","none").lower(), 0) / 5.0 * 100
        final = (skill_match * 0.6) + (exp_score * 0.25) + (edu_score * 0.15)
        a_out = dict(a)
        a_out["score"] = round(final, 2)
        a_out["summary"] = f"Match {skill_match:.1f}%, Exp {exp_score:.1f}%, Edu {edu_score:.1f}%."
        results.append(a_out)

    results_sorted = sorted(results, key=lambda x: x["score"], reverse=True)
    return results_sorted
