import { SimilarityWeights, NoteAnalysis, SimilarityResult, SimilarityLabel } from '../types';
import { jaccardSimilarity, contentSimilarity, intersection, difference } from '../utils/similarity';
import { normalizeTitle, tokenize } from '../utils/text';

export class SimilarityService {
  constructor(private weights: SimilarityWeights, private ngramSize: number) {}

  compare(a: NoteAnalysis, b: NoteAnalysis): SimilarityResult {
    const titleScore = jaccardSimilarity(
      tokenize(a.title, this.ngramSize),
      tokenize(b.title, this.ngramSize)
    );
    const headingScore = jaccardSimilarity(
      a.headings.map(h => normalizeTitle(h)),
      b.headings.map(h => normalizeTitle(h))
    );
    const tagScore = jaccardSimilarity(a.tags, b.tags);
    const linkScore = jaccardSimilarity(a.links, b.links);
    const cs = contentSimilarity(a.tokens, b.tokens);

    const w = this.weights;
    const overallScore =
      titleScore   * w.title   +
      headingScore * w.heading +
      tagScore     * w.tags    +
      linkScore    * w.links   +
      cs           * w.content;

    const commonHeadings = intersection(a.headings, b.headings);
    const commonTags = intersection(a.tags, b.tags);
    const commonLinks = intersection(a.links, b.links);

    const topTokensA = [...new Set(a.tokens)].slice(0, 50);
    const topTokensB = [...new Set(b.tokens)].slice(0, 50);
    const commonKeywords = intersection(topTokensA, topTokensB).slice(0, 20);

    return {
      sourcePath: a.path,
      targetPath: b.path,
      titleScore,
      headingScore,
      tagScore,
      linkScore,
      contentScore: cs,
      overallScore,
      label: this.classifyLabel(overallScore),
      commonHeadings,
      commonTags,
      commonLinks,
      commonKeywords,
      uniqueHeadingsA: difference(a.headings, b.headings),
      uniqueHeadingsB: difference(b.headings, a.headings),
      uniqueKeywordsA: difference(topTokensA, topTokensB).slice(0, 10),
      uniqueKeywordsB: difference(topTokensB, topTokensA).slice(0, 10),
    };
  }

  classifyLabel(overallScore: number): SimilarityLabel {
    if (overallScore >= 0.90) return 'very-likely-duplicate';
    if (overallScore >= 0.70) return 'merge-candidate';
    if (overallScore >= 0.50) return 'related-notes';
    if (overallScore >= 0.30) return 'weakly-related';
    return 'not-similar';
  }
}
