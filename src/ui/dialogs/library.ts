// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { SmoLibrary } from '../fileio/library';
import { SuiDialogParams } from './dialog';
import { DialogDefinitionOption } from './components/baseComponent';
import { TreeComponentOption, SuiTreeComponent } from './components/tree';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoUiConfiguration } from '../configuration';

declare var $: any;

export interface LibraryDefinitionElement {
  smoName: string,
  control: string,
  root: string,
  label: string,
  options?: DialogDefinitionOption[]
}
export interface LibraryDefinition {
  label: string,
  elements: LibraryDefinitionElement[],
  staticText: Record<string, string>[]
}
export class SuiLibraryAdapter extends SuiComponentAdapter {
  topLib: SmoLibrary;
  elements: LibraryDefinition | null = null;
  selectedUrl: string = '';
  libHash: Record<string, SmoLibrary> = {};
  config: SmoUiConfiguration;
  selectedLib: SmoLibrary | null;
  tree: Record<string, SmoLibrary> = {};
  // If the selected lib is a leaf node (a score), this is the same as that
  selectedScore: SmoLibrary | null = null;
  constructor(view: SuiScoreViewOperations, config: SmoUiConfiguration) {
    super(view);
    this.config = config;
    this.topLib = new SmoLibrary({ url: this.config.libraryUrl });
    this.libHash = {};
    this.selectedLib = null;
  }
  loadPromise() {

  }
  initialize(): Promise<void> {
    const self = this;
    return new Promise<void>((resolve) => {
      self.topLib.load().then(() => {
        self.libHash[self.topLib.url!] = self.topLib;
        resolve();
      });
    });
  }
  static addChildRecurse(options: TreeComponentOption[], parent: SmoLibrary, child: SmoLibrary) {
    options.push({ label: child.metadata.name, value: child.url, parent: parent.url, format: child.format, expanded: false });
    child.children.forEach((gchild) => {
      SuiLibraryAdapter.addChildRecurse(options, child, gchild);
    });
  }
  static createOptions(topLib: SmoLibrary) {
    const options: TreeComponentOption[] = [];
    topLib.children.forEach((child) => {
      SuiLibraryAdapter.addChildRecurse(options, topLib, child);
    });
    return options;
  }
  buildTreeRecurse(children: SmoLibrary[]) {
    children.forEach((child) => {
      this.tree[child.url!] = child;
      this.buildTreeRecurse(child.children);
    });
  }
  buildTree() {
    this.tree = {};
    this.buildTreeRecurse(this.topLib.children);
  }
  async commit() {    
  }
  async cancel() {
  }
  async loadOptions(options: TreeComponentOption[]): Promise<void> {
    const self = this;
    return new Promise<void>((resolve) => {
      if (self.selectedLib!.format === 'library') {
        if (!self.selectedLib!.loaded) {
          self.selectedLib!.load().then(() => {
            const nops = SuiLibraryAdapter.createOptions(self.topLib);
            nops.forEach((option) => {
              options.push(option);
            });
            resolve();
          });
        } else {
          const nops = SuiLibraryAdapter.createOptions(self.topLib);
          nops.forEach((option) => {
            options.push(option);
          });
          resolve();
        }
      }
      else {
        self.selectedScore = this.selectedLib;
        resolve();
      }
    });
  }
  async _loadScore() {
    await this.view.loadRemoteScore(this.selectedScore!.url!);
  }
  get selectedLibrary(): SmoLibrary | null {
    return this.selectedLib;
  }
  get smoLibrary() {
    return this.selectedUrl;
  }
  set smoLibrary(value: string) {
    this.selectedUrl = value;
    this.buildTree();
    this.selectedLib = this.tree[this.selectedUrl];
    if (this.selectedLib.format !== 'library') {
      this.selectedScore = this.selectedLib;
    } else {
      this.selectedScore = null;
    }
  }
}
// ## SuiLibraryDialog
// Traverse the library nodes or load a score
export class SuiLibraryDialog extends SuiDialogAdapterBase<SuiLibraryAdapter> {
  static dialogElements: LibraryDefinition = {
    label: 'Music Library', elements: [{
      smoName: 'smoLibrary',
      control: 'SuiTreeComponent',
      root: '',
      label: 'Selection',
      options: []
    }],
    staticText: []
  };
  static _createElements(topLib: SmoLibrary) {
    const elements: LibraryDefinition = JSON.parse(JSON.stringify(SuiLibraryDialog.dialogElements));
    const tree = elements.elements[0];
    tree.root = topLib.url!;
    (tree.options as any) = SuiLibraryAdapter.createOptions(topLib);
    return elements;
  }
  static _createAndDisplay(parameters: SuiDialogParams, adapter: SuiLibraryAdapter) {
    const elements = SuiLibraryDialog._createElements(adapter.topLib);
    const dg = new SuiLibraryDialog(parameters, elements, adapter);
    dg.display();
  }
  /** Library requires a load first, so createAndDisplayDialog won't work on it */
  static async createAndDisplay(parameters: SuiDialogParams, config: SmoUiConfiguration) {
    const adapter = new SuiLibraryAdapter(parameters.view, config);
    await adapter.initialize();
    SuiLibraryDialog._createAndDisplay(parameters, adapter);
  }
  constructor(parameters: SuiDialogParams, dialogElements: LibraryDefinition, adapter: SuiLibraryAdapter) {
    super(dialogElements, { adapter, ...parameters });
  }
  async commit() {
    if (this.adapter.selectedScore !== null) {
      await this.adapter._loadScore();
    } else {
      this.complete();
    }
  }
  get smoLibraryCtrl() {
    return this.cmap.smoLibraryCtrl as SuiTreeComponent;
  }
  async changed() {
    const okButton = $(this.dgDom.element).find('.ok-button');
    super.changed();
    if (this.adapter.selectedLib!.format === 'library') {
      $(okButton).prop('disabled', true);
      const options: TreeComponentOption[] = [];
      await this.adapter.loadOptions(options);
      this.smoLibraryCtrl.updateOptions(options);
      $(this.smoLibraryCtrl._getInputElement()).find('li[data-value="'+this.smoLibraryCtrl.getValue()+'"] button.expander').click();
    } else {
      $(okButton).prop('disabled', false);
    }
  }
}
