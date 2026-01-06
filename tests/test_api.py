import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_generate():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/v1/generate", json={"code": "class Test: pass", "domain": "OOP"})
        assert response.status_code == 200
        assert "principles_mastery" in response.json()
