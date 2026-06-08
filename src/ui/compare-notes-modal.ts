import { App, Modal, Notice, TFile } from 'obsidian';
import { DualyzeNotesSettings, NoteAnalysis, SimilarityResult } from '../types';
import { NoteAnalyzer } from '../services/note-analyzer';
import { SimilarityService } from '../services/similarity-service';
import { ReportGenerator } from '../services/report-generator';
import { MergeDraftGenerator } from '../services/merge-draft-generator';

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

function renderBar(container: HTMLElement, label: string, score: number, color: string): void {
  const row = container.createDiv({ cls: 'dualyze-bar-row' });
  row.createSpan({ cls: 'dualyze-bar-label', text: label });
  const track = row.createDiv({ cls: 'dualyze-score-bar-track' });
  const fill = track.createDiv({ cls: 'dualyze-score-bar-fill' });
  fill.style.width = `${(score * 100).toFixed(1)}%`;
  fill.style.background = color;
  row.createSpan({ cls: 'dualyze-bar-pct', text: `${(score * 100).toFixed(0)}%` });
}

function renderChips(container: HTMLElement, items: string[], cls = 'dualyze-chip'): void {
  items.forEach(item => container.createSpan({ cls, text: item }));
}

export class CompareNotesModal extends Modal {
  private fileA: TFile;
  private fileB: TFile;
  private settings: DualyzeNotesSettings;
  private analyzer: NoteAnalyzer;
  private similarityService: SimilarityService;
  private reportGenerator: ReportGenerator;
  private draftGenerator: MergeDraftGenerator;

  constructor(
    app: App,
    fileA: TFile,
    fileB: TFile,
    settings: DualyzeNotesSettings,
    analyzer: NoteAnalyzer,
    similarityService: SimilarityService,
    reportGenerator: ReportGenerator,
    draftGenerator: MergeDraftGenerator,
  ) {
    super(app);
    this.fileA = fileA;
    this.fileB = fileB;
    this.settings = settings;
    this.analyzer = analyzer;
    this.similarityService = similarityService;
    this.reportGenerator = reportGenerator;
    this.draftGenerator = draftGenerator;
  }

  onOpen(): void {
    this.setTitle('Compare notes');
    const { contentEl } = this;
    contentEl.addClass('dualyze-modal-content');
    contentEl.createEl('p', { text: 'Analyzing...', cls: 'dualyze-loading' });
    void this.analyze();
  }

  private async analyze(): Promise<void> {
    try {
      const [a, b] = await Promise.all([
        this.analyzer.analyze(this.fileA),
        this.analyzer.analyze(this.fileB),
      ]);
      const result = this.similarityService.compare(a, b);
      this.render(a, b, result);
    } catch {
      const { contentEl } = this;
      contentEl.empty();
      contentEl.createEl('p', { text: 'Failed to analyze notes.' });
    }
  }

  private render(a: NoteAnalysis, b: NoteAnalysis, r: SimilarityResult): void {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createDiv({ cls: 'dualyze-compare-header' });
    const notesRow = header.createDiv({ cls: 'dualyze-compare-names' });
    notesRow.createSpan({ text: a.basename, cls: 'dualyze-note-name' });
    notesRow.createSpan({ text: ' vs ', cls: 'dualyze-vs' });
    notesRow.createSpan({ text: b.basename, cls: 'dualyze-note-name' });

    const scoreRow = header.createDiv({ cls: 'dualyze-overall-row' });
    const scoreEl = scoreRow.createSpan({ cls: 'dualyze-score-big' });
    scoreEl.setText(`${(r.overallScore * 100).toFixed(0)}%`);
    scoreEl.style.color = scoreColor(r.overallScore);
    const badge = scoreRow.createSpan({ cls: `dualyze-badge ${labelClass(r.label)}` });
    badge.setText(labelText(r.label));

    const barsSection = contentEl.createDiv({ cls: 'dualyze-bars' });
    renderBar(barsSection, 'Title', r.titleScore, 'var(--interactive-accent)');
    renderBar(barsSection, 'Headings', r.headingScore, 'var(--interactive-accent)');
    renderBar(barsSection, 'Content', r.contentScore, 'var(--interactive-accent)');
    renderBar(barsSection, 'Tags', r.tagScore, 'var(--text-muted)');
    renderBar(barsSection, 'Links', r.linkScore, 'var(--text-muted)');

    const commonSection = contentEl.createDiv({ cls: 'dualyze-section' });
    commonSection.createEl('h4', { text: 'Common' });
    this.renderChipSection(commonSection, 'Headings', r.commonHeadings, 'dualyze-chip dualyze-chip-common');
    this.renderChipSection(commonSection, 'Tags', r.commonTags, 'dualyze-chip dualyze-chip-common');
    this.renderChipSection(commonSection, 'Links', r.commonLinks, 'dualyze-chip dualyze-chip-common');
    this.renderChipSection(commonSection, 'Keywords', r.commonKeywords, 'dualyze-chip dualyze-chip-common');

    const uniqueSection = contentEl.createDiv({ cls: 'dualyze-section' });
    uniqueSection.createEl('h4', { text: 'Unique' });
    const uniqueGrid = uniqueSection.createDiv({ cls: 'dualyze-unique-grid' });
    const colA = uniqueGrid.createDiv({ cls: 'dualyze-unique-col' });
    colA.createEl('strong', { text: a.basename });
    this.renderChipSection(colA, 'Headings', r.uniqueHeadingsA);
    this.renderChipSection(colA, 'Keywords', r.uniqueKeywordsA);
    const colB = uniqueGrid.createDiv({ cls: 'dualyze-unique-col' });
    colB.createEl('strong', { text: b.basename });
    this.renderChipSection(colB, 'Headings', r.uniqueHeadingsB);
    this.renderChipSection(colB, 'Keywords', r.uniqueKeywordsB);

    const draftNotice = contentEl.createDiv({ cls: 'dualyze-draft-notice' });
    draftNotice.setText('Original notes will not be modified by any action below.');

    const actions = contentEl.createDiv({ cls: 'dualyze-actions' });

    const reportBtn = actions.createEl('button', { text: 'Create report' });
    reportBtn.addEventListener('click', () => void this.handleReport(a, b, r));

    const draftBtn = actions.createEl('button', { text: 'Create draft' });
    draftBtn.setAttribute('title', 'Create a new draft note. Original notes will not be modified.');
    draftBtn.addEventListener('click', () => void this.handleDraft(a, b, r));

  }

  private renderChipSection(container: HTMLElement, label: string, items: string[], cls = 'dualyze-chip'): void {
    if (items.length === 0) return;
    const wrap = container.createDiv({ cls: 'dualyze-chip-section' });
    wrap.createEl('small', { text: `${label}: ` });
    renderChips(wrap, items, cls);
  }

  private async handleReport(a: NoteAnalysis, b: NoteAnalysis, r: SimilarityResult): Promise<void> {
    try {
      const file = await this.reportGenerator.generate(a, b, r);
      void this.app.workspace.openLinkText(file.path, '', false);
      new Notice('Report created.');
    } catch {
      new Notice('Failed to create report.');
    }
  }

  private async handleDraft(a: NoteAnalysis, b: NoteAnalysis, r: SimilarityResult): Promise<void> {
    try {
      const file = await this.draftGenerator.generate([a, b], r);
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
