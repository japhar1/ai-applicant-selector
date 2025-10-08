from pydantic import BaseModel
from typing import List, Optional

class Applicant(BaseModel):
    id: int
    name: str
    email: str
    role: Optional[str] = None
    skills: List[str] = []
    experience_years: float = 0
    education_level: Optional[str] = None
    assessment_score: float = 0

class RankedApplicant(Applicant):
    score: float
