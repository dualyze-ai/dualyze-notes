import { ItemView, Notice, TFile, WorkspaceLeaf } from 'obsidian';
import { NoteAnalysis, SimilarityResult } from '../types';
import { NoteAnalyzer } from '../services/note-analyzer';
import { SimilarityService } from '../services/similarity-service';
import { renderCards } from './similar-notes-renderer';
import type DualyzeNotesPlugin from '../main';

export const SIMILAR_NOTES_VIEW_TYPE = 'dualyze-similar-notes';

export class SimilarNotesView extends ItemView {
  private sourceFile: TFile | null = null;
  private sourceAnalysis: NoteAnalysis | null = null;
  private allResults: SimilarityResult[] = [];
  private threshold: number;

  private headerEl!: HTMLElement;
  private countEl!: HTMLElement;
  private resultsEl!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private plugin: DualyzeNotesPlugin) {
    super(leaf);
    this.threshold = plugin.settings.similarityThreshold;
  }

  getViewType():    string { return SIMILAR_NOTES_VIEW_TYPE; }
  getDisplayText(): string { return 'Similar notes'; }
  getIcon():        string { return 'search'; }

  async onOpen(): Promise<void> {
    const content = this.containerEl.children[1] as HTMLElement;
    content.empty();
    content.addClass('dualyze-view-content');

    this.headerEl  = content.createDiv({ cls: 'dualyze-view-header' });
    this.countEl   = content.createDiv({ cls: 'dualyze-count' });
    this.resultsEl = content.createDiv({ cls: 'dualyze-results' });

    this.headerEl.createEl('p', {
      text: 'Open a note and run "Find similar notes".',
      cls: 'dualyze-empty',
    });
  }

  async onClose(): Promise<void> {
    this.containerEl.empty();
  }

  async setSourceFile(file: TFile): Promise<void> {
    this.sourceFile = file;
    this.threshold  = this.plugin.settings.similarityThreshold;
    this.buildHeader();
    await this.scan();
  }

  private buildHeader(): void {
    if (!this.sourceFile) return;
    this.headerEl.empty();

    this.headerEl.createEl('div', {
      cls: 'dualyze-view-source',
      text: this.sourceFile.basename,
    });

    const controls = this.headerEl.createDiv({ cls: 'dualyze-controls' });

    const rescanBtn = controls.createEl('button', { text: 'Rescan' });
    rescanBtn.addEventListener('click', () => void this.scan());

    const thresholdWrap = controls.createDiv({ cls: 'dualyze-threshold-wrap' });
    thresholdWrap.createSpan({ text: 'Threshold: ' });
    const thresholdVal = thresholdWrap.createSpan({
      text: `${(this.threshold * 100).toFixed(0)}%`,
    });
    const slider = thresholdWrap.createEl('input');
    slider.type  = 'range';
    slider.min   = '0';
    slider.max   = '100';
    slider.value = String(Math.round(this.threshold * 100));
    slider.addEventListener('input', () => {
      this.threshold = Number(slider.value) / 100;
      thresholdVal.setText(`${slider.value}%`);
      this.applyFilter();
    });
  }

  private get analyzer(): NoteAnalyzer {
    return new NoteAnalyzer(this.app, this.plugin.settings);
  }

  private get similarityService(): SimilarityService {
    return new SimilarityService(
      this.plugin.settings.weights,
      this.plugin.settings.ngramSize
    );
  }

  private async scan(): Promise<void> {
    if (!this.sourceFile) return;

    this.countEl.setText('Scanning...');
    this.resultsEl.empty();

    try {
      const folder = this.sourceFile.parent?.path ?? '/';
      const files  = await this.analyzer.getFilesInFolder(folder);
      this.sourceAnalysis = await this.analyzer.analyze(this.sourceFile);

      const others   = files.filter(f => f.path !== this.sourceFile!.path);
      const analyses = await Promise.all(others.map(f => this.analyzer.analyze(f)));

      this.allResults = analyses
        .map(t => this.similarityService.compare(this.sourceAnalysis!, t))
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, this.plugin.settings.maxResults);

      this.applyFilter();
    } catch {
      this.countEl.setText('Error during scan.');
    }
  }

  private applyFilter(): void {
    const filtered = this.allResults.filter(r => r.overallScore >= this.threshold);
    this.countEl.setText(`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`);

    renderCards(this.resultsEl, filtered, {
      onCompare: (r) => this.handleCompare(r),
      onOpen:    (r) => this.handleOpen(r),
      onReport:  (r) => void this.handleReport(r),
      onDraft:   (r) => void this.handleDraft(r),
    });
  }

  private handleCompare(r: SimilarityResult): void {
    if (!this.sourceFile) return;
    const target = this.app.vault.getFileByPath(r.targetPath);
    if (!target) return;
    this.plugin.openCompareNotesModal(this.sourceFile, target);
  }

  private handleOpen(r: SimilarityResult): void {
    const target = this.app.vault.getFileByPath(r.targetPath);
    if (!target) return;
    void this.app.workspace.openLinkText(target.path, '', false);
  }

  private async handleReport(r: SimilarityResult): Promise<void> {
    if (!this.sourceAnalysis) return;
    try {
      const target = this.app.vault.getFileByPath(r.targetPath);
      if (!target) return;
      const targetAnalysis = await this.analyzer.analyze(target);
      const file = await this.plugin.reportGenerator.generate(
        this.sourceAnalysis, targetAnalysis, r
      );
      void this.app.workspace.openLinkText(file.path, '', false);
      new Notice('Report created.');
    } catch {
      new Notice('Failed to create report.');
    }
  }

  private async handleDraft(r: SimilarityResult): Promise<void> {
    if (!this.sourceAnalysis) return;
    try {
      const target = this.app.vault.getFileByPath(r.targetPath);
      if (!target) return;
      const targetAnalysis = await this.analyzer.analyze(target);
      const file = await this.plugin.draftGenerator.generate(
        [this.sourceAnalysis, targetAnalysis], r
      );
      void this.app.workspace.openLinkText(file.path, '', false);
      new Notice('Draft created. Original notes were not modified.');
    } catch {
      new Notice('Failed to create draft.');
    }
  }
}
