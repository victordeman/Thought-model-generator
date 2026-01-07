from typing import Optional, Dict, Any
from app.chains.mastery_chain import MasteryLoopChain
from app.services.llm_service import get_llm
from langchain.memory import ConversationBufferMemory
from app.models.thought_profile import ThoughtProfile

class OOPMasteryLoop:
    def __init__(self, memory: Optional[ConversationBufferMemory] = None):
        llm = get_llm()
        self.chain = MasteryLoopChain(llm, memory)

    async def generate_profile(self, code: str, domain: str = "OOP", learner_id: Optional[str] = None) -> ThoughtProfile:
        raw_profile = await self.chain.run(code)
        profile = ThoughtProfile(
            learner_id=learner_id,
            domain=domain,
            **raw_profile
        )
        # In prod: save to DB here
        return profile

    async def reflect(self, previous_profile: ThoughtProfile, notes: str) -> ThoughtProfile:
        # Append reflection to memory
        self.chain.memory.save_context(
            {"input": f"Reflection notes: {notes}"},
            {"output": "Acknowledged – incorporating into next analysis."}
        )
        # Re-run on last code (in real app, store code history)
        new_raw = await self.chain.run(previous_profile.get("last_code", "class Placeholder: pass"))
        return ThoughtProfile(**previous_profile.dict(), **new_raw)
