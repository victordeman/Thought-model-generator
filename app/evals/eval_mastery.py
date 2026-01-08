from langsmith import Client
from openevals.llm import create_llm_as_judge
from openevals.prompts import CORRECTNESS_PROMPT
from app.models.mastery_loop import OOPMasteryLoop
from typing import Dict

client = Client()

# Step 1: Create or load dataset
def create_dataset():
    dataset_name = "oop-mastery-eval"
    try:
        dataset = client.get_dataset(dataset_name)
    except:
        dataset = client.create_dataset(
            dataset_name=dataset_name,
            description="Eval dataset for OOP Mastery Loop."
        )
    
    # Sample examples: inputs (code), reference outputs (expected profile snippets)
    examples = [
        {
            "inputs": {"code": "class BadClass: def __init__(self): self.data = 1"},
            "outputs": {
                "principles_mastery": {"encapsulation": 0.3},
                "inversion_risks": ["No private attributes"],
                "recommendations": ["Use _data for encapsulation"],
                "confidence_score": 0.5
            },
        },
        {
            "inputs": {"code": "class GoodClass: def __init__(self): self._data = 1"},
            "outputs": {
                "principles_mastery": {"encapsulation": 0.9},
                "inversion_risks": [],
                "recommendations": ["Excellent - maintain"],
                "confidence_score": 0.95
            },
        },
        # Add 3 more for coverage (edge cases, inheritance fails, etc.)
        {
            "inputs": {"code": "class Base: pass\nclass Child(Base): pass"},
            "outputs": {
                "principles_mastery": {"inheritance": 0.8},
                "inversion_risks": ["Shallow hierarchy"],
                "recommendations": ["Prefer composition if possible"],
                "confidence_score": 0.85
            },
        },
        {
            "inputs": {"code": "def func(): return 1"},  # Non-OOP
            "outputs": {
                "principles_mastery": {"encapsulation": 0.0},
                "inversion_risks": ["Not OOP code"],
                "recommendations": ["Convert to class"],
                "confidence_score": 0.2
            },
        },
        {
            "inputs": {"code": ""},  # Empty code edge case
            "outputs": {
                "principles_mastery": {},
                "inversion_risks": ["No code provided"],
                "recommendations": ["Provide valid OOP code"],
                "confidence_score": 0.0
            },
        },
    ]
    
    client.create_examples(
        dataset_id=dataset.id,
        examples=examples
    )
    return dataset_name

# Step 2: Target function (wrap graph)
def target(inputs: Dict) -> Dict:
    loop = OOPMasteryLoop()
    profile = loop.generate_profile(inputs["code"])  # Sync for eval; async in API
    return {"profile": profile.dict()}

# Step 3: Custom evaluator (LLM-as-judge for profile correctness)
def profile_correctness_evaluator(inputs: Dict, outputs: Dict, reference_outputs: Dict):
    evaluator = create_llm_as_judge(
        prompt=CORRECTNESS_PROMPT,  # Adapt for profile: "Is this profile correct vs reference?"
        model="openai:gpt-4o-mini",
        feedback_key="profile_correctness",
    )
    return evaluator(
        inputs=inputs,
        outputs=outputs,
        reference_outputs=reference_outputs
    )

# Run eval
if __name__ == "__main__":
    dataset_name = create_dataset()
    experiment_results = client.evaluate(
        target,
        data=dataset_name,
        evaluators=[profile_correctness_evaluator],
        experiment_prefix="mastery-loop-eval-2026",
        max_concurrency=2,
        metadata={"version": "1.0", "domain": "OOP"}
    )
    print(experiment_results)
