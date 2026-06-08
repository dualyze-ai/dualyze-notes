import {
  jaccardSimilarity,
  overlapCoefficient,
  contentSimilarity,
} from '../utils/similarity';

describe('jaccardSimilarity', () => {
  it('returns 1 for identical sets', () => {
    expect(jaccardSimilarity(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1);
  });

  it('returns 0 for completely different sets', () => {
    expect(jaccardSimilarity(['a', 'b'], ['c', 'd'])).toBe(0);
  });

  it('returns correct value for partial overlap', () => {
    const result = jaccardSimilarity(['a', 'b', 'c'], ['b', 'c', 'd']);
    expect(result).toBeCloseTo(0.5, 5);
  });

  it('returns 1 for two empty arrays', () => {
    expect(jaccardSimilarity([], [])).toBe(1);
  });
});

describe('overlapCoefficient', () => {
  it('returns 1 when one set is a subset of the other', () => {
    expect(overlapCoefficient(['a', 'b'], ['a', 'b', 'c', 'd'])).toBe(1);
  });

  it('returns 0 when either set is empty', () => {
    expect(overlapCoefficient([], ['a', 'b'])).toBe(0);
    expect(overlapCoefficient(['a', 'b'], [])).toBe(0);
  });
});

describe('contentSimilarity', () => {
  it('applies 0.7/0.3 weights', () => {
    const a = ['a', 'b'];
    const b = ['a', 'b', 'c', 'd'];
    const expected = jaccardSimilarity(a, b) * 0.70 + overlapCoefficient(a, b) * 0.30;
    expect(contentSimilarity(a, b)).toBeCloseTo(expected, 10);
  });
});
