import numpy as np

async def generate_synthetic(domain: str) -> dict:
    # Paper-inspired: Generate fake queries/errors
    data = {"code": "class Fake: pass", "errors": ["syntax"]}
    sim = np.random.uniform(0.7, 0.8)  # Cosine check
    return {"data": data, "similarity": sim}
