from langchain_openai import ChatOpenAI
from langsmith.wrappers import wrap_openai
from openai import OpenAI
from app.config import settings

# Explicit wrap for raw OpenAI if used; ChatOpenAI auto-traces with env vars
wrapped_client = wrap_openai(OpenAI(api_key=settings.openai_api_key))

def get_llm():
    return ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.2,
        api_key=settings.openai_api_key,
        max_tokens=1500
    )
