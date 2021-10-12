// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoConfiguration } from '../../smo/data/common';
import { SmoScore } from '../../smo/data/score';
import { mxmlScore } from '../../smo/mxml/xmlScore';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { SmoLibrary } from '../fileio/library';
import { SuiXhrLoader } from '../fileio/xhrLoader';

import { SuiDialogBase, SuiDialogParams } from './dialog';
import { DialogDefinitionOption } from '../dialogComponents';
import { TreeComponentOption, SuiTreeComponent } from './treeComponent';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;
declare var SmoConfig: SmoConfiguration;

export interface LibraryDefinitionElement {
  smoName: string,
  control: string,
  root: string,
  label: string,
  options?: DialogDefinitionOption[]
}
/* export interface DialogDefinitionElement {
  smoName: string,
  control: string,
  label: string,
  startRow?: boolean,
  options?: DialogDefinitionOption[]
  increment?: number,
  defaultValue?: number | string,
  dataType?: string,
  classes?: string,
} */

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
  selectedLib: SmoLibrary | null;
  tree: Record<string, SmoLibrary> = {};
  // If the selected lib is a leaf node (a score), this is the same as that
  selectedScore: SmoLibrary | null = null;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.topLib = new SmoLibrary({ url: SmoConfig.libraryUrl });
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
  commit() {

  }
  cancel() {

  }
  loadOptions(options: TreeComponentOption[]): Promise<void> {
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
  _loadJsonAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore!.url);
    req.loadAsync().then(() => {
      const score = SmoScore.deserialize(req.value);
      this.view.changeScore(score);
    });
  }
  _loadXmlAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore!.url);
    req.loadAsync().then(() => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.value, 'text/xml');
      const score = mxmlScore.smoScoreFromXml(xml);
      this.view.changeScore(score);
    });
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
  static createAndDisplay(parameters: SuiDialogParams) {
    const adapter = new SuiLibraryAdapter(parameters.view);
    adapter.initialize().then(() => SuiLibraryDialog._createAndDisplay(parameters, adapter));
  }
  constructor(parameters: SuiDialogParams, dialogElements: LibraryDefinition, adapter: SuiLibraryAdapter) {
    super(dialogElements, { adapter, ...parameters });
  }
  commit() {
    if (this.adapter.selectedScore !== null) {
      if (this.adapter.selectedScore.format === 'mxml') {
        this.adapter._loadXmlAndComplete();
      } else {
        this.adapter._loadJsonAndComplete();
      }
    } else {
      this.complete();
    }
  }
  get smoLibraryCtrl() {
    return this.cmap.smoLibraryCtrl as SuiTreeComponent;
  }
  changed() {
    const okButton = $(this.dgDom.element).find('.ok-button');
    super.changed();
    if (this.adapter.selectedLib!.format === 'library') {
      $(okButton).prop('disabled', true);
      const options: TreeComponentOption[] = [];
      this.adapter.loadOptions(options).then(() => {
        this.smoLibraryCtrl.updateOptions(options);
        $(this.smoLibraryCtrl._getInputElement()).find('li[data-value="'+this.smoLibraryCtrl.getValue()+'"] button.expander').click();
      });
    } else {
      $(okButton).prop('disabled', false);
    }
  }
}
