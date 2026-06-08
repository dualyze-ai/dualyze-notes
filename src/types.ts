export interface SimilarityWeights {
  title: number;
  heading: number;
  tags: number;
  links: number;
  content: number;
}

export interface DualyzeNotesSettings {
  similarityThreshold: number;
  maxResults: number;
  scanScope: 'current-folder' | 'selected-folder' | 'entire-vault';

  comparisonReportFolder: string;
  mergeDraftFolder: string;
  archiveFolder: string;

  excludeFolders: string[];
  excludeFilePatterns: string[];

  weights: SimilarityWeights;

  includeCodeBlocks: boolean;
  includeFrontmatterInContent: boolean;
  ngramSize: number;

  enableArchiveAction: boolean;
  confirmBeforeMovingFiles: boolean;
}

export interface NoteAnalysis {
  path: string;
  basename: string;
  title: string;

  rawContent: string;
  normalizedContent: string;

  headings: string[];
  tags: string[];
  links: string[];
  tokens: string[];

  createdTime: number;
  modifiedTime: number;
}

export type SimilarityLabel =
  | 'very-likely-duplicate'
  | 'merge-candidate'
  | 'related-notes'
  | 'weakly-related'
  | 'not-similar';

export interface SimilarityResult {
  sourcePath: string;
  targetPath: string;

  titleScore: number;
  headingScore: number;
  tagScore: number;
  linkScore: number;
  contentScore: number;
  overallScore: number;

  label: SimilarityLabel;

  commonHeadings: string[];
  commonTags: string[];
  commonLinks: string[];
  commonKeywords: string[];

  uniqueHeadingsA: string[];
  uniqueHeadingsB: string[];
  uniqueKeywordsA: string[];
  uniqueKeywordsB: string[];
}
