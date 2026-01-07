from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.models.thought_profile import ThoughtProfile
from app.models.mastery_loop import OOPMasteryLoop
from app.core.dependencies import api_key_auth

router = APIRouter(tags=["generate"])

class GenerateRequest(BaseModel):
    code: str
    domain: str = "OOP"
    learner_id: str | None = None

@router.post("/generate", response_model=ThoughtProfile)
async def generate_model(
    request: GenerateRequest,
    _=Depends(api_key_auth)
):
    try:
        loop = OOPMasteryLoop()
        profile = await loop.generate_profile(request.code, request.domain, request.learner_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
