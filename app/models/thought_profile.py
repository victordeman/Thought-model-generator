from pydantic import BaseModel
from typing import Dict, List, Optional

class ThoughtProfile(BaseModel):
    learner_id: Optional[str]
    domain: str
    principles_mastery: Dict[str, float]
    inversion_risks: List[str]
    recommendations: List[str]
    confidence_score: float = 0.0
