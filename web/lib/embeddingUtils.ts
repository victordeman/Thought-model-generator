export function embed(text: string, dim = 64): number[] {
  const strText = (text || '').toString().toLowerCase().trim();
  const words = strText.match(/\w+|[^\w\s]/g) || [];
  const vec = new Array(dim).fill(0);

  if (words.length === 0) return vec;

  const ngrams = [...words];
  for (let i = 0; i < words.length - 1; i++) {
    ngrams.push(`${words[i]}_${words[i + 1]}`);
  }

  for (const token of ngrams) {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    const sign = (hash & 1) === 0 ? 1.0 : -1.0;
    vec[idx] += sign;
  }

  const norm = Math.sqrt(vec.reduce((acc, val) => acc + val * val, 0));
  if (norm > 1e-9) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }

  return vec;
}

export function cosineSimilarity(v1: number[], v2: number[]): number {
  if (!v1.length || !v2.length) return 0;
  let dot = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let i = 0; i < v1.length; i++) {
    dot += v1[i] * v2[i];
    norm1 += v1[i] * v1[i];
    norm2 += v2[i] * v2[i];
  }
  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);
  if (norm1 < 1e-9 || norm2 < 1e-9) return 0;
  return Math.max(-1, Math.min(1, dot / (norm1 * norm2)));
}
