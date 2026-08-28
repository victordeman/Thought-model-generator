from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import ChatHuggingFace
from langsmith.wrappers import wrap_openai
from openai import OpenAI, AsyncOpenAI
from app.core.config import settings

openai_key = settings.openai_api_key or "mock_key"
wrapped_client = wrap_openai(OpenAI(api_key=openai_key))

class AsyncOpenAIClient:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key or "mock_key")

def get_llm(provider: str = "openai"):
    if provider == "openai":
        return ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.2,
            api_key=openai_key,
            max_tokens=1500
        )
    elif provider == "xai":
        return ChatOpenAI(
            model="grok-4-1-fast-reasoning",
            temperature=0.2,
            api_key=settings.xai_api_key or "mock_key",
            base_url="https://api.x.ai/v1",
            max_tokens=1500
        )
    elif provider == "gemini":
        return ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            temperature=0.2,
            google_api_key=settings.google_api_key or "mock_key",
            max_output_tokens=1500
        )
    elif provider == "huggingface":
        return ChatHuggingFace(
            model="meta-llama/Meta-Llama-3-8B-Instruct",
            temperature=0.2,
            huggingfacehub_api_token=settings.hf_api_key or "mock_key",
            max_new_tokens=1500
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")
