from fastapi import APIRouter, Depends, HTTPException
from app.models.thought_profile import ThoughtProfile
from app.models.mastery_loop import OOPMasteryLoop
from app.core.dependencies import api_key_auth
from pydantic import BaseModel

router = APIRouter(tags=["reflect"])

class ReflectRequest(BaseModel):
    previous_profile: ThoughtProfile
    reflection_notes: str

@router.post("/reflect", response_model=ThoughtProfile)
async def reflect_loop(
    request: ReflectRequest,
    _=Depends(api_key_auth)
):
    try:
        loop = OOPMasteryLoop()
        updated_profile = await loop.reflect(request.previous_profile, request.reflection_notes)
        return updated_profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reflection failed: {str(e)}")
