import { normalizeTitle, createNgrams, tokenize } from '../utils/text';

describe('normalizeTitle', () => {
  it('removes .md extension and lowercases', () => {
    expect(normalizeTitle('MCPとは.md')).toBe('mcpとは');
  });

  it('lowercases without extension', () => {
    expect(normalizeTitle('MyNote')).toBe('mynote');
  });
});

describe('createNgrams', () => {
  it('generates correct 2-grams for CJK text', () => {
    expect(createNgrams('日本語', 2)).toEqual(['日本', '本語']);
  });

  it('generates correct 3-grams', () => {
    expect(createNgrams('abcd', 3)).toEqual(['abc', 'bcd']);
  });

  it('returns empty array when text too short', () => {
    expect(createNgrams('a', 2)).toEqual([]);
  });
});

describe('tokenize', () => {
  it('splits Latin text into tokens', () => {
    const result = tokenize('machine learning is fun today', 2);
    expect(result).toContain('machine');
    expect(result).toContain('learning');
  });

  it('falls back to n-grams for Japanese text', () => {
    const result = tokenize('機械学習の基礎', 2);
    expect(result.every(t => t.length === 2)).toBe(true);
  });
});
