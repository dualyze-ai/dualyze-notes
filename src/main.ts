import { Notice, Plugin, TFile } from 'obsidian';
import { DualyzeNotesSettings } from './types';
import { DEFAULT_SETTINGS } from './settings';
import { NoteAnalyzer } from './services/note-analyzer';
import { SimilarityService } from './services/similarity-service';
import { ReportGenerator } from './services/report-generator';
import { MergeDraftGenerator } from './services/merge-draft-generator';
import { SIMILAR_NOTES_VIEW_TYPE, SimilarNotesView } from './ui/similar-notes-view';
import { CompareNotesModal } from './ui/compare-notes-modal';
import { NoteSuggestModal } from './ui/note-suggest-modal';
import { DualyzeSettingsTab } from './ui/settings-tab';

export default class DualyzeNotesPlugin extends Plugin {
  settings!: DualyzeNotesSettings;

  get reportGenerator(): ReportGenerator {
    return new ReportGenerator(this.app, this.settings.comparisonReportFolder);
  }

  get draftGenerator(): MergeDraftGenerator {
    return new MergeDraftGenerator(this.app, this.settings.mergeDraftFolder);
  }

  private get analyzer(): NoteAnalyzer {
    return new NoteAnalyzer(this.app, this.settings);
  }

  private get similarityService(): SimilarityService {
    return new SimilarityService(this.settings.weights, this.settings.ngramSize);
  }

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new DualyzeSettingsTab(this.app, this));

    this.registerView(
      SIMILAR_NOTES_VIEW_TYPE,
      (leaf) => new SimilarNotesView(leaf, this)
    );

    this.addCommand({
      id: 'find-similar-notes',
      name: 'Find similar notes',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== 'md') return false;
        if (!checking) void this.openSimilarNotesView(file);
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

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (!(file instanceof TFile) || file.extension !== 'md') return;
        menu.addItem(item =>
          item.setTitle('Find similar notes')
              .setIcon('search')
              .onClick(() => void this.openSimilarNotesView(file))
        );
        menu.addItem(item =>
          item.setTitle('Compare with...')
              .setIcon('layout-columns')
              .onClick(() => this.openCompareModal(file))
        );
      })
    );
  }

  onunload(): void {
    this.app.workspace.detachLeavesOfType(SIMILAR_NOTES_VIEW_TYPE);
  }

  async openSimilarNotesView(file: TFile): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(SIMILAR_NOTES_VIEW_TYPE);
    let leaf = existing[0];

    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false) ?? this.app.workspace.getLeaf(true);
      await leaf.setViewState({ type: SIMILAR_NOTES_VIEW_TYPE, active: true });
    }

    this.app.workspace.revealLeaf(leaf);

    const view = leaf.view;
    if (view instanceof SimilarNotesView) {
      await view.setSourceFile(file);
    }
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
      this.reportGenerator, this.draftGenerator,
    ).open();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
