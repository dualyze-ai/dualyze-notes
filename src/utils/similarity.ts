export function intersection<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(x => setB.has(x));
}

export function difference<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter(x => !setB.has(x));
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

export function overlapCoefficient(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter(x => setB.has(x)).length;
  const minSize = Math.min(setA.size, setB.size);
  return minSize === 0 ? 0 : inter / minSize;
}

export function contentSimilarity(a: string[], b: string[]): number {
  return jaccardSimilarity(a, b) * 0.70 + overlapCoefficient(a, b) * 0.30;
}
