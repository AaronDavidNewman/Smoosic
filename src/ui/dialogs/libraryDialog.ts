// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoLibrary } from '../fileio/library';
import { SuiXhrLoader } from '../fileio/xhrLoader';
import { mxmlScore } from '../../smo/mxml/xmlScore';
import { SmoScore } from '../../smo/data/score';
import { DialogDefinitionOption } from '../dialogComponents';
import { TreeComponentOption, SuiTreeComponent } from './treeComponent';
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
  topLib: SmoLibrary;
  libHash: Record<string, SmoLibrary>;
  selectedLib: SmoLibrary | null;
  tree: Record<string, SmoLibrary>;
  okButton: any;
  selectedScore: SmoLibrary | null = null;
  constructor(parameters: SuiDialogParams, dialogElements: LibraryDefinition, topLib: SmoLibrary) {
    super(dialogElements, parameters);
    this.libHash = {};
    this.tree = {};
    this.libHash[topLib.url!] = topLib;
    this.topLib = topLib;
    this.selectedLib = null;
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
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    $(this.dgDom.element).find('.smoControlContainer').addClass('center-flex');
  }
  commit() {
  }
  _bindElements() {
    const dgDom = this.dgDom;
    this.okButton = $(dgDom.element).find('.ok-button');
    $(this.okButton).prop('disabled', true);
    const cancelButton = $(dgDom.element).find('.cancel-button');
    $(this.okButton).off('click').on('click', () => {
      if (this.selectedScore !== null) {
        if (this.selectedScore.format === 'mxml') {
          this._loadXmlAndComplete();
        } else {
          this._loadJsonAndComplete();
        }
      } else {
        this.complete();
      }
    });
    $(cancelButton).off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  _loadJsonAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore!.url);
    req.loadAsync().then(() => {
      const score = SmoScore.deserialize(req.value);
      this.view.changeScore(score);
      this.complete();
    });
  }
  _loadXmlAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore!.url);
    req.loadAsync().then(() => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.value, 'text/xml');
      const score = mxmlScore.smoScoreFromXml(xml);
      this.view.changeScore(score);
      this.complete();
    });
  }
  get smoLibraryCtrl() {
    return this.cmap['smoLibraryControl'] as SuiTreeComponent;
  }
  changed() {
    if (this.cmap['smoLibraryCtrl'].changeFlag) {
      const url = this.smoLibraryCtrl.getValue();
      this.buildTree();
      this.selectedLib = this.tree[url];
      this.smoLibraryCtrl.setValue(this.selectedLib!.url!);
      // User navigates to parent library
      if (this.selectedLib.format === 'library') {
        $(this.okButton).prop('disabled', true);
        this.selectedScore = null;
        if (!this.selectedLib.loaded) {
          this.selectedLib.load().then(() => {
            const options = SuiLibraryDialog._createOptions(this.topLib);
            this.smoLibraryCtrl.updateOptions(options);
            this.smoLibraryCtrl.setValue(this.selectedLib!.url!);
          });
        }
      } else {
        this.selectedScore = this.selectedLib;
        this.smoLibraryCtrl.setValue(this.selectedLib!.url!);
        $(this.okButton).prop('disabled', false);
      }
    }
  }
}
