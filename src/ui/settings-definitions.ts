import type { Setting, SettingDefinition, SettingDefinitionItem } from 'obsidian';
import type { DualyzeNotesSettings } from '../types';

type WeightKey = keyof DualyzeNotesSettings['weights'];

const WEIGHT_PREFIX = 'weights.';
const LINE_LIST_KEYS = ['excludeFolders', 'excludeFilePatterns'] as const;
const POSITIVE_INTEGER_KEYS = ['maxResults', 'ngramSize'] as const;

type LineListKey = (typeof LINE_LIST_KEYS)[number];
type PositiveIntegerKey = (typeof POSITIVE_INTEGER_KEYS)[number];

function isWeightKey(key: string): boolean {
  return key.startsWith(WEIGHT_PREFIX);
}

function isLineListKey(key: string): key is LineListKey {
  return (LINE_LIST_KEYS as readonly string[]).includes(key);
}

function isPositiveIntegerKey(key: string): key is PositiveIntegerKey {
  return (POSITIVE_INTEGER_KEYS as readonly string[]).includes(key);
}

export function weightsMessage(settings: DualyzeNotesSettings): string | null {
  const w = settings.weights;
  const total = w.title + w.heading + w.tags + w.links + w.content;
  if (Math.abs(total - 1.0) <= 0.001) return null;
  return `⚠ Weights sum to ${(total * 100).toFixed(0)}% (should be 100%)`;
}

export function readSetting(settings: DualyzeNotesSettings, key: string): unknown {
  if (isWeightKey(key)) return settings.weights[key.slice(WEIGHT_PREFIX.length) as WeightKey];
  if (isLineListKey(key)) return settings[key].join('\n');
  return (settings as unknown as Record<string, unknown>)[key];
}

/** Applies a changed value to the settings. Returns false when the value is rejected. */
export function writeSetting(settings: DualyzeNotesSettings, key: string, value: unknown): boolean {
  if (isWeightKey(key)) {
    if (typeof value !== 'number') return false;
    settings.weights[key.slice(WEIGHT_PREFIX.length) as WeightKey] = value;
    return true;
  }
  if (isLineListKey(key)) {
    settings[key] = String(value).split('\n').map(s => s.trim()).filter(Boolean);
    return true;
  }
  if (isPositiveIntegerKey(key)) {
    const n = typeof value === 'number' ? value : parseInt(String(value), 10);
    if (!Number.isInteger(n) || n < 1) return false;
    settings[key] = n;
    return true;
  }
  (settings as unknown as Record<string, unknown>)[key] = value;
  return true;
}

export interface WeightsWarningHooks {
  render: (setting: Setting) => void | (() => void);
}

const POSITIVE_INTEGER_ERROR = 'Enter a whole number of 1 or more.';

function validatePositiveInteger(value: number): string | void {
  if (!Number.isInteger(value) || value < 1) return POSITIVE_INTEGER_ERROR;
}

function weightSlider(name: string, key: WeightKey): SettingDefinition {
  return {
    name,
    control: { type: 'slider', key: `${WEIGHT_PREFIX}${key}`, min: 0, max: 1, step: 0.05 },
  };
}

export function buildSettingDefinitions(hooks: WeightsWarningHooks): SettingDefinitionItem[] {
  return [
    {
      type: 'group',
      heading: 'Basic',
      items: [
        {
          name: 'Similarity threshold',
          desc: 'Minimum score (0–1) to show a note as similar.',
          control: { type: 'slider', key: 'similarityThreshold', min: 0, max: 1, step: 0.05 },
        },
        {
          name: 'Max results',
          desc: 'Maximum number of similar notes to show.',
          control: { type: 'number', key: 'maxResults', min: 1, step: 1, validate: validatePositiveInteger },
        },
        {
          name: 'Scan scope',
          desc: 'Which notes to scan when finding similar notes.',
          control: {
            type: 'dropdown',
            key: 'scanScope',
            options: { 'current-folder': 'Current folder', 'entire-vault': 'Entire vault' },
          },
        },
      ],
    },
    {
      type: 'group',
      heading: 'Output folders',
      items: [
        { name: 'Comparison report folder', control: { type: 'text', key: 'comparisonReportFolder' } },
        { name: 'Merge draft folder', control: { type: 'text', key: 'mergeDraftFolder' } },
        { name: 'Archive folder', control: { type: 'text', key: 'archiveFolder' } },
      ],
    },
    {
      type: 'group',
      heading: 'Exclude',
      items: [
        {
          name: 'Exclude folders',
          desc: 'One folder name per line.',
          control: { type: 'textarea', key: 'excludeFolders' },
        },
        {
          name: 'Exclude file patterns',
          desc: 'One pattern per line, e.g. *.canvas',
          control: { type: 'textarea', key: 'excludeFilePatterns' },
        },
      ],
    },
    {
      type: 'group',
      heading: 'Similarity weights',
      items: [
        { name: 'Weights total', searchable: false, render: hooks.render },
        weightSlider('Title weight', 'title'),
        weightSlider('Heading weight', 'heading'),
        weightSlider('Tags weight', 'tags'),
        weightSlider('Links weight', 'links'),
        weightSlider('Content weight', 'content'),
      ],
    },
    {
      type: 'group',
      heading: 'Markdown parsing',
      items: [
        {
          name: 'Include code blocks',
          desc: 'Include code block content in similarity analysis.',
          control: { type: 'toggle', key: 'includeCodeBlocks' },
        },
        {
          name: 'Include frontmatter in content',
          control: { type: 'toggle', key: 'includeFrontmatterInContent' },
        },
        {
          name: 'N-gram size',
          desc: 'Character n-gram size for CJK text (default: 2).',
          control: { type: 'number', key: 'ngramSize', min: 1, step: 1, validate: validatePositiveInteger },
        },
      ],
    },
    {
      type: 'group',
      heading: 'Safety',
      items: [
        {
          name: 'Enable archive action',
          desc: 'Show archive option in actions (moves notes to archive folder).',
          control: { type: 'toggle', key: 'enableArchiveAction' },
        },
        {
          name: 'Confirm before moving files',
          desc: 'Show a confirmation dialog before any file move operation.',
          control: { type: 'toggle', key: 'confirmBeforeMovingFiles' },
        },
      ],
    },
  ];
}
