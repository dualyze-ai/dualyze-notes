import { SimilarityResult } from '../types';

export interface CardCallbacks {
  onCompare: (r: SimilarityResult) => void;
  onOpen:    (r: SimilarityResult) => void;
  onReport:  (r: SimilarityResult) => void;
  onDraft:   (r: SimilarityResult) => void;
}

export function renderCards(
  container: HTMLElement,
  results: SimilarityResult[],
  callbacks: CardCallbacks
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

    header.createSpan({ cls: `dualyze-badge ${labelClass(r.label)}`, text: labelText(r.label) });

    card.createDiv({ cls: 'dualyze-card-name', text: r.targetPath });

    const bars = card.createDiv({ cls: 'dualyze-bars' });
    renderBar(bars, 'Title',    r.titleScore,   'var(--interactive-accent)');
    renderBar(bars, 'Headings', r.headingScore, 'var(--interactive-accent)');
    renderBar(bars, 'Content',  r.contentScore, 'var(--interactive-accent)');

    const accordion = card.createDiv({ cls: 'dualyze-accordion-body' });
    renderBar(accordion, 'Tags',  r.tagScore,  'var(--text-muted)');
    renderBar(accordion, 'Links', r.linkScore, 'var(--text-muted)');

    if (r.commonHeadings.length > 0) {
      const sec = accordion.createDiv();
      sec.createEl('small', { text: 'Common headings' });
      r.commonHeadings.forEach(h =>
        sec.createSpan({ cls: 'dualyze-chip dualyze-chip-common', text: h })
      );
    }
    if (r.commonKeywords.length > 0) {
      const sec = accordion.createDiv();
      sec.createEl('small', { text: 'Common keywords' });
      r.commonKeywords.forEach(kw =>
        sec.createSpan({ cls: 'dualyze-chip dualyze-chip-common', text: kw })
      );
    }

    const indicator = card.createDiv({ cls: 'dualyze-expand-indicator', text: '▼' });
    card.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.dualyze-actions')) return;
      accordion.classList.toggle('is-open');
      indicator.setText(accordion.classList.contains('is-open') ? '▲' : '▼');
    });

    const actions = card.createDiv({ cls: 'dualyze-actions' });

    const compareBtn = actions.createEl('button', { text: 'Compare' });
    compareBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onCompare(r); });

    const openBtn = actions.createEl('button', { text: 'Open' });
    openBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onOpen(r); });

    const reportBtn = actions.createEl('button', { text: 'Report' });
    reportBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onReport(r); });

    const draftBtn = actions.createEl('button', { text: 'Create merge draft' });
    draftBtn.setAttribute('title', 'Create a merge draft. Original notes will not be modified.');
    draftBtn.addEventListener('click', (e) => { e.stopPropagation(); callbacks.onDraft(r); });
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

function scoreColor(score: number): string {
  if (score >= 0.90) return 'var(--color-red)';
  if (score >= 0.70) return 'var(--color-orange)';
  if (score >= 0.50) return 'var(--color-blue)';
  return 'var(--text-muted)';
}

function labelText(label: SimilarityResult['label']): string {
  switch (label) {
    case 'very-likely-duplicate': return 'Duplicate';
    case 'merge-candidate':       return 'Merge candidate';
    case 'related-notes':         return 'Related';
    case 'weakly-related':        return 'Weakly related';
    default:                      return 'Not similar';
  }
}

function labelClass(label: SimilarityResult['label']): string {
  switch (label) {
    case 'very-likely-duplicate': return 'dualyze-badge-dup';
    case 'merge-candidate':       return 'dualyze-badge-merge';
    case 'related-notes':         return 'dualyze-badge-related';
    default:                      return 'dualyze-badge-weak';
  }
}
