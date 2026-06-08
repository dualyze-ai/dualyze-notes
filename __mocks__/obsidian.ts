export class App {}

export class TAbstractFile {
  path = '';
  name = '';
}

export class TFile extends TAbstractFile {
  basename = '';
  extension = 'md';
  stat = { mtime: 0, ctime: 0, size: 0 };
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
  isRoot() { return false; }
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  titleEl: HTMLElement;
  modalEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
    this.titleEl = document.createElement('div');
    this.modalEl = document.createElement('div');
  }

  open() { this.onOpen(); }
  close() { this.onClose(); }
  onOpen() {}
  onClose() {}
  setTitle(title: string) { this.titleEl.textContent = title; return this; }
}

export class Notice {
  constructor(public message: string, public duration?: number) {}
  hide() {}
  setMessage(message: string) { this.message = message; }
}

export class SuggestModal<T> {
  app: App;
  inputEl: HTMLInputElement;
  resultContainerEl: HTMLElement;

  constructor(app: App) {
    this.app = app;
    this.inputEl = document.createElement('input');
    this.resultContainerEl = document.createElement('div');
  }

  open() {}
  close() {}
  getSuggestions(_query: string): T[] { return []; }
  renderSuggestion(_item: T, _el: HTMLElement) {}
  onChooseSuggestion(_item: T, _evt: MouseEvent | KeyboardEvent) {}
  setPlaceholder(_placeholder: string) { return this; }
}

export class FuzzySuggestModal<T> extends SuggestModal<T> {
  getItems(): T[] { return []; }
  getItemText(_item: T): string { return ''; }
  onChooseItem(_item: T, _evt: MouseEvent | KeyboardEvent) {}
}

export class Plugin {
  app: App = new App();
  manifest = {};
  addCommand(_cmd: unknown) {}
  addRibbonIcon(_icon: string, _title: string, _cb: unknown) {}
  addSettingTab(_tab: unknown) {}
  registerEvent(_evt: unknown) {}
  async loadData() { return {}; }
  async saveData(_data: unknown) {}
}

export class PluginSettingTab {
  app: App;
  containerEl: HTMLElement;

  constructor(app: App, _plugin: unknown) {
    this.app = app;
    this.containerEl = document.createElement('div');
  }

  display() {}
}

export class Setting {
  nameEl: HTMLElement;
  descEl: HTMLElement;
  settingEl: HTMLElement;

  constructor(_containerEl: HTMLElement) {
    this.nameEl = document.createElement('div');
    this.descEl = document.createElement('div');
    this.settingEl = document.createElement('div');
  }

  setName(name: string) { this.nameEl.textContent = name; return this; }
  setDesc(desc: string) { this.descEl.textContent = desc; return this; }
  setHeading() { return this; }
  setDisabled(_disabled: boolean) { return this; }
  addText(_cb: (text: { setValue: (v: string) => typeof text; setPlaceholder: (v: string) => typeof text; onChange: (cb: (v: string) => void) => typeof text }) => void) { return this; }
  addTextArea(_cb: (text: { setValue: (v: string) => typeof text; setPlaceholder: (v: string) => typeof text; onChange: (cb: (v: string) => void) => typeof text }) => void) { return this; }
  addToggle(_cb: unknown) { return this; }
  addButton(_cb: unknown) { return this; }
  addDropdown(_cb: unknown) { return this; }
  addSlider(_cb: unknown) { return this; }
}

export class Menu {
  addItem(_cb: (item: { setTitle: (t: string) => typeof item; setIcon: (i: string) => typeof item; onClick: (cb: () => void) => typeof item }) => void) { return this; }
  addSeparator() { return this; }
  showAtMouseEvent(_evt: MouseEvent) {}
}

export const normalizePath = (p: string) => p;

export class WorkspaceLeaf {
  view: unknown = null;
  setViewState(_state: unknown): Promise<void> { return Promise.resolve(); }
}

export class ItemView {
  app: App;
  containerEl: HTMLElement;
  leaf: WorkspaceLeaf;

  constructor(leaf: WorkspaceLeaf) {
    this.app = new App();
    this.leaf = leaf;
    this.containerEl = document.createElement('div');
    this.containerEl.appendChild(document.createElement('div')); // nav
    this.containerEl.appendChild(document.createElement('div')); // content
  }

  getViewType():    string { return ''; }
  getDisplayText(): string { return ''; }
  getIcon():        string { return ''; }
  async onOpen():  Promise<void> {}
  async onClose(): Promise<void> {}
}
