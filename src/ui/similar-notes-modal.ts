import { App, Modal, Notice, TFile } from 'obsidian';
import { DualyzeNotesSettings, NoteAnalysis, SimilarityResult } from '../types';
import { NoteAnalyzer } from '../services/note-analyzer';
import { SimilarityService } from '../services/similarity-service';
import { ReportGenerator } from '../services/report-generator';
import { MergeDraftGenerator } from '../services/merge-draft-generator';
import { FrontmatterService } from '../services/frontmatter-service';

function scoreColor(score: number): string {
  if (score >= 0.90) return 'var(--color-red)';
  if (score >= 0.70) return 'var(--color-orange)';
  if (score >= 0.50) return 'var(--color-blue)';
  return 'var(--background-modifier-border)';
}

function labelText(label: SimilarityResult['label']): string {
  switch (label) {
    case 'very-likely-duplicate': return 'Duplicate';
    case 'merge-candidate': return 'Merge candidate';
    case 'related-notes': return 'Related';
    case 'weakly-related': return 'Weakly related';
    default: return 'Not similar';
  }
}

function labelClass(label: SimilarityResult['label']): string {
  switch (label) {
    case 'very-likely-duplicate': return 'dualyze-badge-dup';
    case 'merge-candidate': return 'dualyze-badge-merge';
    case 'related-notes': return 'dualyze-badge-related';
    default: return 'dualyze-badge-weak';
  }
}

export function renderResults(
  container: HTMLElement,
  results: SimilarityResult[],
  onCompare: (r: SimilarityResult) => void,
  onOpen: (r: SimilarityResult) => void,
  onReport: (r: SimilarityResult) => void,
  onDraft: (r: SimilarityResult) => void
): void {
  container.empty();

  if (results.length === 0) {
    container.createEl('p', { text: 'No similar notes found.', cls: 'dualyze-empty' });
    return;
  }

  for (const r of results) {
    const card = container.createDiv({ cls: 'dualyze-card' });

    const header = card.createDiv({ cls: 'dualyze-card-header' });
    const scoreEl = header.createSpan({ cls: 'dualyze-score-big' });
    scoreEl.setText(`${(r.overallScore * 100).toFixed(0)}%`);
    scoreEl.style.color = scoreColor(r.overallScore);

    const badge = header.createSpan({ cls: `dualyze-badge ${labelClass(r.label)}` });
    badge.setText(labelText(r.label));

    const nameEl = card.createDiv({ cls: 'dualyze-card-name' });
    nameEl.setText(r.targetPath);

    const bars = card.createDiv({ cls: 'dualyze-bars' });
    renderBar(bars, 'Title', r.titleScore, 'var(--interactive-accent)');
    renderBar(bars, 'Headings', r.headingScore, 'var(--interactive-accent)');
    renderBar(bars, 'Content', r.contentScore, 'var(--interactive-accent)');

    const accordion = card.createDiv({ cls: 'dualyze-accordion-body' });
    renderBar(accordion, 'Tags', r.tagScore, 'var(--text-muted)');
    renderBar(accordion, 'Links', r.linkScore, 'var(--text-muted)');

    if (r.commonKeywords.length > 0) {
      const kwSection = accordion.createDiv();
      kwSection.createEl('small', { text: 'Common keywords' });
      const chips = kwSection.createDiv();
      r.commonKeywords.forEach(kw => chips.createSpan({ cls: 'dualyze-chip dualyze-chip-common', text: kw }));
    }
    if (r.commonHeadings.length > 0) {
      const hSection = accordion.createDiv();
      hSection.createEl('small', { text: 'Common headings' });
      const chips = hSection.createDiv();
      r.commonHeadings.forEach(h => chips.createSpan({ cls: 'dualyze-chip dualyze-chip-common', text: h }));
    }

    const indicator = card.createDiv({ cls: 'dualyze-expand-indicator', text: '▼' });
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.dualyze-actions')) return;
      accordion.classList.toggle('is-open');
      indicator.setText(accordion.classList.contains('is-open') ? '▲' : '▼');
    });

    const actions = card.createDiv({ cls: 'dualyze-actions' });
    const compareBtn = actions.createEl('button', { text: 'Compare' });
    compareBtn.addEventListener('click', (e) => { e.stopPropagation(); onCompare(r); });

    const openBtn = actions.createEl('button', { text: 'Open' });
    openBtn.addEventListener('click', (e) => { e.stopPropagation(); onOpen(r); });

    const reportBtn = actions.createEl('button', { text: 'Report' });
    reportBtn.addEventListener('click', (e) => { e.stopPropagation(); onReport(r); });

    const draftBtn = actions.createEl('button', { text: 'Create draft' });
    draftBtn.setAttribute('title', 'Create a new draft note. Original notes will not be modified.');
    draftBtn.addEventListener('click', (e) => { e.stopPropagation(); onDraft(r); });
  }
}

function renderBar(container: HTMLElement, label: string, score: number, color: string): void {
  const row = container.createDiv({ cls: 'dualyze-bar-row' });
  row.createSpan({ cls: 'dualyze-bar-label', text: label });
  const track = row.createDiv({ cls: 'dualyze-score-bar-track' });
  const fill = track.createDiv({ cls: 'dualyze-score-bar-fill' });
  fill.style.width = `${(score * 100).toFixed(1)}%`;
  fill.style.background = color;
  row.createSpan({ cls: 'dualyze-bar-pct', text: `${(score * 100).toFixed(0)}%` });
}

export class SimilarNotesModal extends Modal {
  private sourceFile: TFile;
  private settings: DualyzeNotesSettings;
  private analyzer: NoteAnalyzer;
  private similarityService: SimilarityService;
  private reportGenerator: ReportGenerator;
  private draftGenerator: MergeDraftGenerator;
  private frontmatterService: FrontmatterService;
  private onOpenCompare: (sourceFile: TFile, targetFile: TFile) => void;
  private allResults: SimilarityResult[] = [];
  private sourceAnalysis: NoteAnalysis | null = null;
  private threshold: number;
  private resultsContainer!: HTMLElement;
  private countEl!: HTMLElement;

  constructor(
    app: App,
    sourceFile: TFile,
    settings: DualyzeNotesSettings,
    analyzer: NoteAnalyzer,
    similarityService: SimilarityService,
    reportGenerator: ReportGenerator,
    draftGenerator: MergeDraftGenerator,
    frontmatterService: FrontmatterService,
    onOpenCompare: (sourceFile: TFile, targetFile: TFile) => void
  ) {
    super(app);
    this.sourceFile = sourceFile;
    this.settings = settings;
    this.analyzer = analyzer;
    this.similarityService = similarityService;
    this.reportGenerator = reportGenerator;
    this.draftGenerator = draftGenerator;
    this.frontmatterService = frontmatterService;
    this.onOpenCompare = onOpenCompare;
    this.threshold = settings.similarityThreshold;
  }

  onOpen(): void {
    this.setTitle(`Similar notes — ${this.sourceFile.basename}`);
    const { contentEl } = this;
    contentEl.addClass('dualyze-modal-content');

    const controls = contentEl.createDiv({ cls: 'dualyze-controls' });

    const rescanBtn = controls.createEl('button', { text: 'Rescan' });
    rescanBtn.addEventListener('click', () => void this.scan());

    const thresholdWrap = controls.createDiv({ cls: 'dualyze-threshold-wrap' });
    thresholdWrap.createSpan({ text: 'Threshold: ' });
    const thresholdVal = thresholdWrap.createSpan({ text: `${(this.threshold * 100).toFixed(0)}%` });
    const slider = thresholdWrap.createEl('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(this.threshold * 100);
    slider.addEventListener('input', () => {
      this.threshold = Number(slider.value) / 100;
      thresholdVal.setText(`${slider.value}%`);
      this.applyFilter();
    });

    this.countEl = contentEl.createDiv({ cls: 'dualyze-count', text: 'Scanning...' });
    this.resultsContainer = contentEl.createDiv({ cls: 'dualyze-results' });

    void this.scan();
  }

  private async scan(): Promise<void> {
    this.countEl.setText('Scanning...');
    this.resultsContainer.empty();

    try {
      const folder = this.sourceFile.parent?.path ?? '/';
      const files = await this.analyzer.getFilesInFolder(folder);
      this.sourceAnalysis = await this.analyzer.analyze(this.sourceFile);

      const others = files.filter(f => f.path !== this.sourceFile.path);
      const analyses = await Promise.all(others.map(f => this.analyzer.analyze(f)));

      this.allResults = analyses
        .map(target => this.similarityService.compare(this.sourceAnalysis!, target))
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, this.settings.maxResults);

      this.applyFilter();
    } catch (e) {
      this.countEl.setText('Error during scan.');
    }
  }

  private applyFilter(): void {
    const filtered = this.allResults.filter(r => r.overallScore >= this.threshold);
    this.countEl.setText(`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`);

    renderResults(
      this.resultsContainer,
      filtered,
      (r) => this.handleCompare(r),
      (r) => this.handleOpen(r),
      (r) => void this.handleReport(r),
      (r) => void this.handleDraft(r)
    );
  }

  private handleCompare(r: SimilarityResult): void {
    const target = this.app.vault.getFileByPath(r.targetPath);
    if (!target) return;
    this.close();
    this.onOpenCompare(this.sourceFile, target);
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
      const file = await this.reportGenerator.generate(this.sourceAnalysis, targetAnalysis, r);
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
      const file = await this.draftGenerator.generate([this.sourceAnalysis, targetAnalysis], r);
      void this.app.workspace.openLinkText(file.path, '', false);
      new Notice('Draft created. Original notes were not modified.');
    } catch {
      new Notice('Failed to create draft.');
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
