import { Notice, Plugin, TFile } from 'obsidian';
import { DualyzeNotesSettings } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { NoteAnalyzer } from './services/note-analyzer';
import { SimilarityService } from './services/similarity-service';
import { ReportGenerator } from './services/report-generator';
import { MergeDraftGenerator } from './services/merge-draft-generator';
import { FrontmatterService } from './services/frontmatter-service';
import { SimilarNotesModal } from './ui/similar-notes-modal';
import { CompareNotesModal } from './ui/compare-notes-modal';
import { NoteSuggestModal } from './ui/note-suggest-modal';
import { DualyzeSettingsTab } from './ui/settings-tab';

export default class DualyzeNotesPlugin extends Plugin {
  settings!: DualyzeNotesSettings;

  private get analyzer(): NoteAnalyzer {
    return new NoteAnalyzer(this.app, this.settings);
  }

  private get similarityService(): SimilarityService {
    return new SimilarityService(this.settings.weights, this.settings.ngramSize);
  }

  private get reportGenerator(): ReportGenerator {
    return new ReportGenerator(this.app, this.settings.comparisonReportFolder);
  }

  private get draftGenerator(): MergeDraftGenerator {
    return new MergeDraftGenerator(this.app, this.settings.mergeDraftFolder);
  }

  private get frontmatterService(): FrontmatterService {
    return new FrontmatterService(this.app);
  }

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new DualyzeSettingsTab(this.app, this));

    this.addCommand({
      id: 'find-similar-notes',
      name: 'Find similar notes',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md') return false;
        if (!checking) this.openSimilarNotesModal(file);
        return true;
      },
    });

    this.addCommand({
      id: 'compare-with-another',
      name: 'Compare current note with another note',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md') return false;
        if (!checking) this.openCompareModal(file);
        return true;
      },
    });

    this.addCommand({
      id: 'mark-as-merge-candidate',
      name: 'Mark as merge candidate',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md') return false;
        if (!checking) void this.markAsMergeCandidate(file);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        menu.addItem(item =>
          item.setTitle('Find similar notes')
              .setIcon('search')
              .onClick(() => this.openSimilarNotesModal(file))
        );
        menu.addItem(item =>
          item.setTitle('Compare with...')
              .setIcon('layout-columns')
              .onClick(() => this.openCompareModal(file))
        );
      })
    );
  }

  openSimilarNotesModal(file: TFile): void {
    new SimilarNotesModal(
      this.app, file, this.settings,
      this.analyzer, this.similarityService,
      this.reportGenerator, this.draftGenerator, this.frontmatterService,
      (sourceFile, targetFile) => this.openCompareNotesModal(sourceFile, targetFile)
    ).open();
  }

  openCompareModal(fileA: TFile): void {
    const allFiles = this.app.vault.getMarkdownFiles().filter(f => f.path !== fileA.path);
    new NoteSuggestModal(this.app, allFiles, (fileB) => {
      this.openCompareNotesModal(fileA, fileB);
    }).open();
  }

  openCompareNotesModal(fileA: TFile, fileB: TFile): void {
    new CompareNotesModal(
      this.app, fileA, fileB, this.settings,
      this.analyzer, this.similarityService,
      this.reportGenerator, this.draftGenerator, this.frontmatterService
    ).open();
  }

  private async markAsMergeCandidate(file: TFile): Promise<void> {
    const allFiles = this.app.vault.getMarkdownFiles().filter(f => f.path !== file.path);
    new NoteSuggestModal(this.app, allFiles, async (other) => {
      try {
        const [a, b] = await Promise.all([
          this.analyzer.analyze(file),
          this.analyzer.analyze(other),
        ]);
        const result = this.similarityService.compare(a, b);
        await this.frontmatterService.markAsMergeCandidate(file, other.basename, result.overallScore);
        await this.frontmatterService.markAsMergeCandidate(other, file.basename, result.overallScore);
        new Notice('Both notes marked as merge candidates.');
      } catch {
        new Notice('Failed to mark notes.');
      }
    }).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
