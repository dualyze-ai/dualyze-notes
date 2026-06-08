import { App, FuzzySuggestModal, TFile } from 'obsidian';

export class NoteSuggestModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private files: TFile[],
    private onChoose: (file: TFile) => void
  ) {
    super(app);
    this.setPlaceholder('Select a note...');
  }

  getItems(): TFile[] { return this.files; }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.onChoose(file); }
}
