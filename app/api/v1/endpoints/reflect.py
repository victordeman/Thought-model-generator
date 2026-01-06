from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.schemas.profile_schema import ThoughtProfile
from app.models.mastery_loop import OOPMasteryLoop
from app.services.llm_service import get_llm_client
from app.core.dependencies import api_key_auth

router = APIRouter(tags=["reflect"])

class ReflectRequest(BaseModel):
    profile: ThoughtProfile
    reflection_notes: str

@router.post("/reflect", response_model=ThoughtProfile)
async def reflect_loop(
    request: ReflectRequest,
    llm=Depends(get_llm_client),
    _=Depends(api_key_auth)
):
    try:
        loop = OOPMasteryLoop(llm)
        updated_profile = await loop.reflect(request.profile, request.reflection_notes)
        return updated_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
