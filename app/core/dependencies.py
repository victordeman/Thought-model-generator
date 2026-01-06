from fastapi import Header, HTTPException
from app.services.llm_service import AsyncOpenAIClient
from app.config import settings

async def get_llm_client():
    return AsyncOpenAIClient(settings.openai_api_key)

def api_key_auth(x_api_key: str = Header(None)):
    if x_api_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return x_api_key
