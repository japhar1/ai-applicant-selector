from pydantic import BaseModel
from typing import List, Optional

class Applicant(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    skills: List[str]
    experience_years: float
    education_level: str
    role: Optional[str] = None
    score: Optional[float] = None
    summary: Optional[str] = None
