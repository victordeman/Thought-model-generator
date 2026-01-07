from langchain_openai import ChatOpenAI
from app.config import settings

def get_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",  # Efficient & smart in 2026
        temperature=0.2,      # Low for consistent reasoning
        api_key=settings.openai_api_key,
        max_tokens=1500
    )
