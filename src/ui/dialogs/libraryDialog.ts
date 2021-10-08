// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoLibrary } from '../fileio/library';
import { SuiXhrLoader } from '../fileio/xhrLoader';
import { mxmlScore } from '../../smo/mxml/xmlScore';
import { SmoScore } from '../../smo/data/score';
import { DialogDefinitionOption } from '../dialogComponents';
import { TreeComponentOption, SuiTreeComponent } from './treeComponent';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoConfiguration } from '../../smo/data/common';

declare var $: any;
declare var SmoConfig: SmoConfiguration;

export interface LibraryDefinitionElement {
  smoName: string,
  parameterName: string,
  dataType?: string
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
export class SuiLibraryAdapter {
  topLib: SmoLibrary;
  selectedUrl: string = '';
  libHash: Record<string, SmoLibrary>;
  selectedLib: SmoLibrary | null;
  tree: Record<string, SmoLibrary>;
  okButton: any;
  view: SuiScoreViewOperations;
  // If the selected lib is a leaf node (a score), this is the same as that
  selectedScore: SmoLibrary | null = null;
  constructor(view: SuiScoreViewOperations, topLib: SmoLibrary) {
    this.libHash = {};
    this.tree = {};
    this.view = view;
    this.libHash[topLib.url!] = topLib;
    this.topLib = topLib;
    this.selectedLib = null;
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
  createOptions(topLib: SmoLibrary) {
    const options: TreeComponentOption[] = [];
    topLib.children.forEach((child) => {
      SuiLibraryDialog.addChildRecurse(options, topLib, child);
    });
    return options;
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
export class SuiLibraryDialog extends SuiDialogBase {
  static dialogElements: LibraryDefinition = {
    label: 'Music Library', elements: [{
      smoName: 'smoLibrary',
      parameterName: 'smoLibrary',
      control: 'SuiTreeComponent',
      root: '',
      label: 'Selection',
      options: []
    }],
    staticText: []
  };
  static addChildRecurse(options: TreeComponentOption[], parent: SmoLibrary, child: SmoLibrary) {
    options.push({ label: child.metadata.name, value: child.url, parent: parent.url, format: child.format, expanded: false });
    child.children.forEach((gchild) => {
      SuiLibraryDialog.addChildRecurse(options, child, gchild);
    });
  }
  static _createOptions(topLib: SmoLibrary) {
    const options: TreeComponentOption[] = [];
    topLib.children.forEach((child) => {
      SuiLibraryDialog.addChildRecurse(options, topLib, child);
    });
    return options;
  }
  static _createElements(topLib: SmoLibrary) {
    const elements = JSON.parse(JSON.stringify(SuiLibraryDialog.dialogElements));
    const tree = elements.elements[0];
    tree.root = topLib.url;
    tree.options = SuiLibraryDialog._createOptions(topLib);
    return elements;
  }
  static _createAndDisplay(parameters: SuiDialogParams, topLib: SmoLibrary) {
    const elements = SuiLibraryDialog._createElements(topLib);
    const dg = new SuiLibraryDialog(parameters, elements, topLib);
    dg.display();
  }
  static createAndDisplay(parameters: SuiDialogParams) {
    const topLib = new SmoLibrary({ url: SmoConfig.libraryUrl });
    topLib.load().then(() => SuiLibraryDialog._createAndDisplay(parameters, topLib));
  }
  okButton: any;
  modifier: SuiLibraryAdapter;
  constructor(parameters: SuiDialogParams, dialogElements: LibraryDefinition, topLib: SmoLibrary) {
    parameters.modifier = new SuiLibraryAdapter(parameters.view, topLib);
    super(dialogElements, parameters);
    this.modifier = parameters.modifier;
  }
  commit() {
    if (this.modifier.selectedScore !== null) {
      if (this.modifier.selectedScore.format === 'mxml') {
        this.modifier._loadXmlAndComplete();
      } else {
        this.modifier._loadJsonAndComplete();
      }
    } else {
      this.complete();
    }
  }

  get smoLibraryCtrl() {
    return this.cmap.smoLibraryCtrl as SuiTreeComponent;
  }
  changed() {
    super.changed();
    if (this.modifier.selectedLib!.format === 'library') {
      $(this.okButton).prop('disabled', true);
      const options: TreeComponentOption[] = [];
      this.modifier.loadOptions(options).then(() => {
        this.smoLibraryCtrl.updateOptions(options);
      });
    } else {
      $(this.okButton).prop('disabled', false);
    }
  }
}
