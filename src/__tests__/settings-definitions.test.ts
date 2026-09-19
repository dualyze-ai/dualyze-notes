import type { SettingDefinitionItem } from 'obsidian';
import { DEFAULT_SETTINGS } from '../settings';
import type { DualyzeNotesSettings } from '../types';
import {
  buildSettingDefinitions,
  readSetting,
  weightsMessage,
  writeSetting,
} from '../ui/settings-definitions';

function freshSettings(): DualyzeNotesSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as DualyzeNotesSettings;
}

function collectControls(items: SettingDefinitionItem[]) {
  const controls: { key: string; type: string }[] = [];
  for (const item of items) {
    if ('items' in item && item.items) {
      controls.push(...collectControls(item.items as SettingDefinitionItem[]));
    } else if ('control' in item && item.control) {
      controls.push({ key: item.control.key, type: item.control.type });
    }
  }
  return controls;
}

const hooks = { render: () => undefined };

describe('buildSettingDefinitions', () => {
  const controls = collectControls(buildSettingDefinitions(hooks));

  it('covers every setting exposed in the settings tab', () => {
    expect(controls.map(c => c.key).sort()).toEqual([
      'archiveFolder',
      'comparisonReportFolder',
      'confirmBeforeMovingFiles',
      'enableArchiveAction',
      'excludeFilePatterns',
      'excludeFolders',
      'includeCodeBlocks',
      'includeFrontmatterInContent',
      'maxResults',
      'mergeDraftFolder',
      'ngramSize',
      'scanScope',
      'similarityThreshold',
      'weights.content',
      'weights.heading',
      'weights.links',
      'weights.tags',
      'weights.title',
    ]);
  });

  it('every control key resolves to a value in the default settings', () => {
    const settings = freshSettings();
    for (const { key } of controls) {
      expect(readSetting(settings, key)).not.toBeUndefined();
    }
  });
});

describe('readSetting / writeSetting', () => {
  it('reads and writes nested weights', () => {
    const s = freshSettings();
    expect(readSetting(s, 'weights.title')).toBe(0.3);
    expect(writeSetting(s, 'weights.title', 0.5)).toBe(true);
    expect(s.weights.title).toBe(0.5);
    expect(writeSetting(s, 'weights.title', 'x')).toBe(false);
    expect(s.weights.title).toBe(0.5);
  });

  it('converts exclude lists between arrays and one-per-line text', () => {
    const s = freshSettings();
    expect(readSetting(s, 'excludeFolders')).toBe('templates\n_archive\n.trash\nnode_modules\nattachments');
    expect(writeSetting(s, 'excludeFolders', ' a \n\n b\n')).toBe(true);
    expect(s.excludeFolders).toEqual(['a', 'b']);
  });

  it('accepts positive integers only for maxResults and ngramSize', () => {
    const s = freshSettings();
    expect(writeSetting(s, 'maxResults', 25)).toBe(true);
    expect(s.maxResults).toBe(25);
    expect(writeSetting(s, 'maxResults', 0)).toBe(false);
    expect(writeSetting(s, 'maxResults', NaN)).toBe(false);
    expect(writeSetting(s, 'maxResults', 2.5)).toBe(false);
    expect(s.maxResults).toBe(25);
    expect(writeSetting(s, 'ngramSize', 3)).toBe(true);
    expect(writeSetting(s, 'ngramSize', -1)).toBe(false);
    expect(s.ngramSize).toBe(3);
  });

  it('stores plain values as-is', () => {
    const s = freshSettings();
    expect(writeSetting(s, 'scanScope', 'entire-vault')).toBe(true);
    expect(writeSetting(s, 'enableArchiveAction', true)).toBe(true);
    expect(writeSetting(s, 'archiveFolder', 'Archive')).toBe(true);
    expect(s.scanScope).toBe('entire-vault');
    expect(s.enableArchiveAction).toBe(true);
    expect(s.archiveFolder).toBe('Archive');
  });
});

describe('weightsMessage', () => {
  it('is null when weights sum to 100%', () => {
    expect(weightsMessage(freshSettings())).toBeNull();
  });

  it('describes the total when weights do not sum to 100%', () => {
    const s = freshSettings();
    s.weights.title = 0.5;
    expect(weightsMessage(s)).toBe('⚠ Weights sum to 120% (should be 100%)');
  });
});
