import { Liquor, FlavorProfile } from '../data';

export function getFlavorVector(profile: FlavorProfile): number[] {
  return [
    profile.sweetness, profile.spice, profile.oak, profile.caramel,
    profile.vanilla, profile.fruit, profile.nutty, profile.floral,
    profile.smoky, profile.leather, profile.heat, profile.complexity
  ];
}

export function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getSimilarLiquors(target: Liquor, all: Liquor[], limit = 3): Liquor[] {
  const targetVec = getFlavorVector(target.flavorProfile);
  const scored = all
    .filter(b => b.id !== target.id)
    .map(b => ({
      liquor: b,
      score: cosineSimilarity(targetVec, getFlavorVector(b.flavorProfile))
    }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.liquor);
}
