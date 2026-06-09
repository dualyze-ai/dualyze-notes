import { App, PluginSettingTab, Setting } from 'obsidian';
import { DualyzeNotesSettings } from '../types';
import DualyzeNotesPlugin from '../main';

export class DualyzeSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: DualyzeNotesPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('Basic').setHeading();

    new Setting(containerEl)
      .setName('Similarity threshold')
      .setDesc('Minimum score (0–1) to show a note as similar.')
      .addSlider(slider => slider
        .setLimits(0, 1, 0.05)
        .setValue(this.plugin.settings.similarityThreshold)
        .setDynamicTooltip()
        .onChange(async v => {
          this.plugin.settings.similarityThreshold = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Max results')
      .setDesc('Maximum number of similar notes to show.')
      .addText(text => text
        .setValue(String(this.plugin.settings.maxResults))
        .onChange(async v => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n > 0) {
            this.plugin.settings.maxResults = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl)
      .setName('Scan scope')
      .setDesc('Which notes to scan when finding similar notes.')
      .addDropdown(drop => drop
        .addOption('current-folder', 'Current folder')
        .addOption('entire-vault', 'Entire vault')
        .setValue(this.plugin.settings.scanScope)
        .onChange(async v => {
          this.plugin.settings.scanScope = v as DualyzeNotesSettings['scanScope'];
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName('Output folders').setHeading();

    new Setting(containerEl)
      .setName('Comparison report folder')
      .addText(text => text
        .setValue(this.plugin.settings.comparisonReportFolder)
        .onChange(async v => {
          this.plugin.settings.comparisonReportFolder = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Merge draft folder')
      .addText(text => text
        .setValue(this.plugin.settings.mergeDraftFolder)
        .onChange(async v => {
          this.plugin.settings.mergeDraftFolder = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Archive folder')
      .addText(text => text
        .setValue(this.plugin.settings.archiveFolder)
        .onChange(async v => {
          this.plugin.settings.archiveFolder = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName('Exclude').setHeading();

    new Setting(containerEl)
      .setName('Exclude folders')
      .setDesc('One folder name per line.')
      .addTextArea(text => text
        .setValue(this.plugin.settings.excludeFolders.join('\n'))
        .onChange(async v => {
          this.plugin.settings.excludeFolders = v.split('\n').map(s => s.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Exclude file patterns')
      .setDesc('One pattern per line, e.g. *.canvas')
      .addTextArea(text => text
        .setValue(this.plugin.settings.excludeFilePatterns.join('\n'))
        .onChange(async v => {
          this.plugin.settings.excludeFilePatterns = v.split('\n').map(s => s.trim()).filter(Boolean);
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl).setName('Similarity weights').setHeading();

    const warningEl = containerEl.createDiv({ cls: 'dualyze-weights-warning dualyze-hidden' });

    const checkWeights = () => {
      const w = this.plugin.settings.weights;
      const total = w.title + w.heading + w.tags + w.links + w.content;
      if (Math.abs(total - 1.0) > 0.001) {
        warningEl.setText(`⚠ Weights sum to ${(total * 100).toFixed(0)}% (should be 100%)`);
        warningEl.removeClass('dualyze-hidden');
      } else {
        warningEl.addClass('dualyze-hidden');
      }
    };

    const addWeightSlider = (label: string, key: keyof DualyzeNotesSettings['weights']) => {
      new Setting(containerEl)
        .setName(label)
        .addSlider(slider => slider
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.weights[key])
          .setDynamicTooltip()
          .onChange(async v => {
            this.plugin.settings.weights[key] = v;
            await this.plugin.saveSettings();
            checkWeights();
          })
        );
    };

    addWeightSlider('Title weight', 'title');
    addWeightSlider('Heading weight', 'heading');
    addWeightSlider('Tags weight', 'tags');
    addWeightSlider('Links weight', 'links');
    addWeightSlider('Content weight', 'content');
    checkWeights();

    new Setting(containerEl).setName('Markdown parsing').setHeading();

    new Setting(containerEl)
      .setName('Include code blocks')
      .setDesc('Include code block content in similarity analysis.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeCodeBlocks)
        .onChange(async v => {
          this.plugin.settings.includeCodeBlocks = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Include frontmatter in content')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.includeFrontmatterInContent)
        .onChange(async v => {
          this.plugin.settings.includeFrontmatterInContent = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('N-gram size')
      .setDesc('Character n-gram size for CJK text (default: 2).')
      .addText(text => text
        .setValue(String(this.plugin.settings.ngramSize))
        .onChange(async v => {
          const n = parseInt(v, 10);
          if (!isNaN(n) && n >= 1) {
            this.plugin.settings.ngramSize = n;
            await this.plugin.saveSettings();
          }
        })
      );

    new Setting(containerEl).setName('Safety').setHeading();

    new Setting(containerEl)
      .setName('Enable archive action')
      .setDesc('Show archive option in actions (moves notes to archive folder).')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableArchiveAction)
        .onChange(async v => {
          this.plugin.settings.enableArchiveAction = v;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Confirm before moving files')
      .setDesc('Show a confirmation dialog before any file move operation.')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.confirmBeforeMovingFiles)
        .onChange(async v => {
          this.plugin.settings.confirmBeforeMovingFiles = v;
          await this.plugin.saveSettings();
        })
      );
  }
}
