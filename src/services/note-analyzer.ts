import { App, TFile } from 'obsidian';
import { DualyzeNotesSettings, NoteAnalysis } from '../types';
import {
  removeFrontmatter,
  extractFrontmatterTags,
  extractInlineTags,
  extractHeadings,
  extractWikilinks,
  removeCodeBlocks,
} from '../utils/markdown';
import { normalizeTitle, normalizeText, tokenize } from '../utils/text';

function isExcluded(file: TFile, settings: DualyzeNotesSettings): boolean {
  const inExcludedFolder = settings.excludeFolders
    .some(folder => file.path.startsWith(folder + '/'));
  const matchesPattern = settings.excludeFilePatterns
    .some(pattern => {
      const suffix = pattern.replace('*', '');
      return file.path.endsWith(suffix);
    });
  return inExcludedFolder || matchesPattern;
}

export class NoteAnalyzer {
  constructor(private app: App, private settings: DualyzeNotesSettings) {}

  async analyze(file: TFile): Promise<NoteAnalysis> {
    const rawContent = await this.app.vault.read(file);

    const body = removeFrontmatter(rawContent);
    const bodyForContent = this.settings.includeCodeBlocks
      ? body
      : removeCodeBlocks(body);
    const contentSource = this.settings.includeFrontmatterInContent
      ? rawContent
      : bodyForContent;

    const normalizedContent = normalizeText(contentSource);
    const tokens = tokenize(normalizedContent, this.settings.ngramSize);

    const fmTags = extractFrontmatterTags(rawContent);
    const inlineTags = extractInlineTags(body);
    const allTags = [...new Set([...fmTags, ...inlineTags])];

    return {
      path: file.path,
      basename: file.basename,
      title: normalizeTitle(file.basename),
      rawContent,
      normalizedContent,
      headings: extractHeadings(body),
      tags: allTags,
      links: extractWikilinks(body),
      tokens,
      createdTime: file.stat.ctime,
      modifiedTime: file.stat.mtime,
    };
  }

  async getFilesInFolder(folderPath: string): Promise<TFile[]> {
    const allFiles = this.app.vault.getMarkdownFiles();
    return allFiles.filter(file => {
      const inFolder = folderPath === '/'
        ? true
        : file.path.startsWith(folderPath + '/') || file.path.startsWith(folderPath === '' ? '' : folderPath + '/');
      return inFolder && !isExcluded(file, this.settings);
    });
  }
}
