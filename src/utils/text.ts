export function normalizeTitle(fileName: string): string {
  return fileName.replace(/\.md$/i, '').toLowerCase();
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createNgrams(text: string, n: number): string[] {
  const ngrams: string[] = [];
  const chars = [...text.replace(/\s/g, '')];
  for (let i = 0; i <= chars.length - n; i++) {
    ngrams.push(chars.slice(i, i + n).join(''));
  }
  return ngrams;
}

export function tokenize(text: string, ngramSize: number): string[] {
  const normalized = normalizeText(text);
  const tokens = normalized.split(/[\s\p{P}\p{S}]+/u).filter(t => t.length > 1);
  const hasEnoughTokens = tokens.length >= 3;
  const hasNonLatin = /[^\p{Script=Latin}\p{Number}\s\p{P}\p{S}]/u.test(normalized);

  if (hasEnoughTokens && !hasNonLatin) return tokens;
  return createNgrams(normalized, ngramSize);
}
