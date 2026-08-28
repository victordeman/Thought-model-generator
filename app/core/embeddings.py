import math
import hashlib
import re

def embed(text: str, dim: int = 64) -> list[float]:
    """
    Deterministic hashed n-gram embedding phi: Step -> R^dim.
    Normalized to unit length.
    """
    text = text.lower().strip()
    words = re.findall(r'\w+|[^\w\s]', text)
    vec = [0.0] * dim

    if not words:
        return vec

    ngrams = words[:]
    for i in range(len(words) - 1):
        ngrams.append(words[i] + "_" + words[i+1])

    for token in ngrams:
        h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
        vec[idx] += sign

    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 1e-9:
        vec = [x / norm for x in vec]
    return vec

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    if not v1 or not v2:
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 < 1e-9 or norm2 < 1e-9:
        return 0.0
    return max(-1.0, min(1.0, dot / (norm1 * norm2)))

def step_distance(s1: str | list[float], s2: str | list[float]) -> float:
    v1 = embed(s1) if isinstance(s1, str) else s1
    v2 = embed(s2) if isinstance(s2, str) else s2
    return 1.0 - cosine_similarity(v1, v2)
