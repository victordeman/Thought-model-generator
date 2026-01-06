from sqlalchemy import Column, String, Float, JSON, Integer
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class LearnerProfile(Base):
    __tablename__ = "learner_profiles"
    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(String, unique=True, index=True)
    domain = Column(String)
    principles_mastery = Column(JSON)
    inversion_risks = Column(JSON)
    recommendations = Column(JSON)
    confidence_score = Column(Float)
