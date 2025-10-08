import math

# Define education weightings for scoring
education_weights = {
    "phd": 100,
    "masters": 90,
    "bachelor": 80,
    "diploma": 70,
    "highschool": 60,
    "none": 50
}

def normalize(value, min_val, max_val):
    """Normalize a numeric value between 0–100."""
    if max_val == min_val:
        return 0
    return ((value - min_val) / (max_val - min_val)) * 100

def calculate_applicant_score(applicant, job_skills=None):
    """Compute composite AI-like score for a candidate."""
    job_skills = job_skills or ["python", "excel", "data analysis", "communication"]

    # Skill match % (intersection)
    skills = [s.lower() for s in applicant.skills]
    matches = len(set(skills) & set(job_skills))
    skills_match = (matches / len(job_skills)) * 100

    # Experience scoring (cap at 10 years)
    exp_score = normalize(min(applicant.experience_years, 10), 0, 10)

    # Education score
    edu = applicant.education_level.lower() if applicant.education_level else "none"
    edu_score = education_weights.get(edu, 50)

    # Assessment score (already 0–100)
    assess_score = applicant.assessment_score

    # Weighted total
    final_score = (
        (skills_match * 0.4)
        + (exp_score * 0.3)
        + (edu_score * 0.2)
        + (assess_score * 0.1)
    )

    return round(final_score, 2)
