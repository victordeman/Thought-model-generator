from openai import AsyncOpenAI

class AsyncOpenAIClient:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def complete(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        return response.choices[0].message.content

def get_llm_client():
    from app.config import settings
    return AsyncOpenAIClient(settings.openai_api_key)
