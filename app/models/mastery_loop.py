from typing import Optional
from langsmith import traceable
from app.graphs.mastery_graph import mastery_graph
from app.models.thought_profile import ThoughtProfile

class OOPMasteryLoop:
    def __init__(self):
        self.graph = mastery_graph

    @traceable(metadata={"app": "thought-model-generator", "operation": "generate_profile"})
    async def generate_profile(self, code: str, domain: str = "OOP", learner_id: Optional[str] = None) -> ThoughtProfile:
        initial_state = {
            "code": code,
            "inversion_risks": [],
            "principles_mastery": {},
            "recommendations": [],
            "confidence_score": 0.0,
            "chat_history": [],
            "loop_count": 0
        }
        final_state = await self.graph.ainvoke(initial_state)
        profile = ThoughtProfile(
            learner_id=learner_id,
            domain=domain,
            principles_mastery=final_state["principles_mastery"],
            inversion_risks=final_state["inversion_risks"],
            recommendations=final_state["recommendations"],
            confidence_score=final_state["confidence_score"]
        )
        return profile

    @traceable(metadata={"app": "thought-model-generator", "operation": "reflect"})
    async def reflect(self, previous_profile: ThoughtProfile, notes: str) -> ThoughtProfile:
        # Inject notes into history and re-invoke
        state_with_notes = previous_profile.dict()
        state_with_notes["chat_history"] = state_with_notes.get("chat_history", []) + [notes]
        state_with_notes["loop_count"] = 0
        final_state = await self.graph.ainvoke(state_with_notes)
        return ThoughtProfile(**final_state)
