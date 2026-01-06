from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.schemas.profile_schema import ThoughtProfile
from app.models.mastery_loop import OOPMasteryLoop
from app.services.llm_service import get_llm_client
from app.core.dependencies import api_key_auth

router = APIRouter(tags=["generate"])

class GenerateRequest(BaseModel):
    code: str
    domain: str = "OOP"
    learner_id: str | None = None

@router.post("/generate", response_model=ThoughtProfile)
async def generate_model(
    request: GenerateRequest,
    llm=Depends(get_llm_client),
    _=Depends(api_key_auth)
):
    try:
        loop = OOPMasteryLoop(llm)
        profile = await loop.generate_profile(request.code, request.domain, request.learner_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
