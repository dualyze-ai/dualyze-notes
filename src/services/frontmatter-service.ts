import { App, TFile } from 'obsidian';

export class FrontmatterService {
  constructor(private app: App) {}

  async markAsMergeCandidate(
    file: TFile,
    comparedWith: string,
    similarity: number
  ): Promise<void> {
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm['dualyze'] = {
        status: 'merge-candidate',
        reviewed: false,
        compared_with: comparedWith,
        similarity: Math.round(similarity * 1000) / 1000,
        updated: new Date().toISOString().slice(0, 10),
      };
    });
  }
}
