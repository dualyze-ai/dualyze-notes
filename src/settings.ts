import { DualyzeNotesSettings } from './types';

export const DEFAULT_SETTINGS: DualyzeNotesSettings = {
  similarityThreshold: 0.70,
  maxResults: 10,
  scanScope: 'current-folder',

  comparisonReportFolder: 'Dualyze Reports',
  mergeDraftFolder: 'Dualyze Merge Drafts',
  archiveFolder: '_archive/dualyze-notes',

  excludeFolders: ['templates', '_archive', '.trash', 'node_modules', 'attachments'],
  excludeFilePatterns: ['*.canvas', '*.excalidraw.md'],

  weights: {
    title: 0.30,
    heading: 0.25,
    tags: 0.15,
    links: 0.15,
    content: 0.15,
  },

  includeCodeBlocks: false,
  includeFrontmatterInContent: false,
  ngramSize: 2,

  enableArchiveAction: false,
  confirmBeforeMovingFiles: true,
};
