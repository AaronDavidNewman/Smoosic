// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams, DialogDefinition } from './dialog';
import { SmoScore } from '../../smo/data/score';
import { mxmlScore } from '../../smo/mxml/xmlScore';
import { SuiFileDownloadComponent, SuiTextInputComponent } from '../dialogComponents';
import { SuiScoreViewOperations } from '../../../release/smoosic';
declare var $: any;

export class FileLoadDialogAdapter {
  jsonFile: string = '';
  view: SuiScoreViewOperations;
  constructor(view: SuiScoreViewOperations) {
    this.view = view;
  }
  get loadFile() {
    return this.jsonFile;
  }
  set loadFile(value: string) {
    this.jsonFile = value;
  }
  commit() {
    let scoreWorks = false;
    if (this.jsonFile.length > 0) {
      try {
        const score = SmoScore.deserialize(this.jsonFile);
        scoreWorks = true;
        this.view.changeScore(score);
      } catch (e) {
        console.warn('unable to score ' + e);
      }
    }
  }
}

export class SuiLoadFileDialog extends SuiDialogBase {

  static dialogElements: DialogDefinition =
    {
      label: 'Load File',
      elements: [{
        smoName: 'loadFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      }
      ],
      staticText: []
    };
  static createAndDisplay(params: SuiDialogParams) {
    const dg = new SuiLoadFileDialog(params);
    dg.display();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }

  get loadFileCtrl() {
    return this.cmap['loadFileCtrl'] as SuiFileDownloadComponent;
  }
  value: string;
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiLoadFileDialog';
    super(SuiLoadFileDialog.dialogElements, parameters );
    this.value = '';
  }
  changed() {
    this.value = this.loadFileCtrl.getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const score = SmoScore.deserialize(this.value);
        scoreWorks = true;
        this.view.changeScore(score);
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
}

export class SuiLoadMxmlDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Load File',
      elements: [{
        smoName: 'loadFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      },
      ],
      staticText: []
    };
  get loadFileCtrl() {
    return this.cmap['loadFileCtrl'] as SuiFileDownloadComponent;
  }
  value: string;
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiLoadMxmlDialog';
    super(SuiLoadMxmlDialog.dialogElements, parameters);
    this.value = '';
  }
  changed() {
    this.value = this.loadFileCtrl.getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(this.value, 'text/xml');
        const score = mxmlScore.smoScoreFromXml(xml);
        scoreWorks = true;
        this.view.changeScore(score);
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
  static createAndDisplay(params: SuiDialogParams) {
    const dg = new SuiLoadMxmlDialog(params);
    dg.display();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }
}

export class SuiLoadActionsDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = {
    label: 'Load Action File',
    elements: [{
      smoName: 'loadFile',
      defaultValue: '',
      control: 'SuiFileDownloadComponent',
      label: ''
    }
    ],
    staticText: []
  };
  value: string;
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiLoadActionsDialog';
    super(SuiLoadActionsDialog.dialogElements, parameters);
    this.value = '';
  }
  get loadFileCtrl() {
    return this.cmap['loadFileCtrl'] as SuiFileDownloadComponent;
  }
  changed() {
    this.value = this.loadFileCtrl.getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const json = JSON.parse(this.value);
        this.view.playActions(json);
        scoreWorks = true;
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
  static createAndDisplay(params: SuiDialogParams) {
    const dg = new SuiLoadActionsDialog(params);
    dg.display();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }
}

export class SuiPrintFileDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = {
    label: 'Print Complete',
    elements: [],
    staticText: []
  };

  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiPrintFileDialog(params);
    dg.display();
  }

  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiPrintFileDialog';
    super(SuiPrintFileDialog.dialogElements, parameters);
  }

  changed() { }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      $('body').removeClass('printing');
      this.view.renderer.restoreLayoutAfterPrint();
      window.dispatchEvent(new Event('resize'));
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').remove();
    $(dgDom.element).find('.remove-button').remove();
  }
  commit() { }
}
export class SuiSaveFileDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Save Score',
      elements: [{
        smoName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      }],
      staticText: []
    };
  value: string;
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiSaveFileDialog';
    super(SuiSaveFileDialog.dialogElements, parameters);
    this.value = SuiSaveFileDialog.createName(this.view.score);
  }
  get saveFileNameCtrl() {
    return this.cmap['saveFileNameCtrl'] as SuiTextInputComponent;
  }
  changed() {
    this.value = this.saveFileNameCtrl.getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
      filename = filename + '.json';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveScore(filename);
    this.complete();
  }

  display() {
    this.applyDisplayOptions();
    this.saveFileNameCtrl.setValue(this.value);
    this._bindElements();
  }
  static createName(score: SmoScore) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '.json';
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiSaveFileDialog(params);
    dg.display();
  }
}

export class SuiSaveXmlDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Save Score',
      elements: [{
        smoName: 'saveFileName',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      }],
      staticText: []
    };
  value: string;
  constructor(parameters: SuiDialogParams) {
    super(SuiSaveXmlDialog.dialogElements, parameters);
    this.value = SuiSaveXmlDialog.createName(this.view.score);
  }
  get saveFileNameCtrl() {
    return this.cmap['saveFileNameCtrl'] as SuiTextInputComponent;
  }
  changed() {
    this.value = this.saveFileNameCtrl.getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.xml';
    }
    if (filename.indexOf('.xml') < 0) {
      filename = filename + '.xml';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveXml(filename);
    this.complete();
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    this.saveFileNameCtrl.setValue(this.value);
  }
  static createName(score: SmoScore) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '.xml';
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiSaveXmlDialog(params);
    dg.display();
  }
}

export class SuiSaveMidiDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Save Score as Midi',
      elements:
        [{
          smoName: 'saveFileName',
          control: 'SuiTextInputComponent',
          label: 'File Name'
        }],
      staticText: []
    }
    value: string;
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiSaveMidiDialog';
    super(SuiSaveMidiDialog.dialogElements, parameters);
    this.value = SuiSaveMidiDialog.createName(this.view.score);
  }
  get saveFileNameCtrl() {
    return this.cmap['saveFileNameCtrl'] as SuiTextInputComponent;
  }
  changed() {
    this.value = this.saveFileNameCtrl.getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.mid';
    }
    if (filename.indexOf('.mid') < 0) {
      filename = filename + '.mid';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveMidi(filename);
    this.complete();
  }
  display() {
    this.applyDisplayOptions();
    this.saveFileNameCtrl.setValue(this.value);
    this._bindElements();
  }
  static createName(score: SmoScore) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '.mid';
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiSaveMidiDialog(params);
    dg.display();
  }
}

export class SuiSaveActionsDialog extends SuiDialogBase {
  static dialogElements = 
      {
        label: 'Save Score', elements:
          [{
            smoName: 'saveFileName',
            defaultValue: '',
            control: 'SuiTextInputComponent',
            label: 'File Name'
          }],
          staticText: []
      };
      value: string;
  constructor(parameters: SuiDialogParams) {
    super(SuiSaveActionsDialog.dialogElements, parameters);
    this.value = SuiSaveActionsDialog.createName(this.view.score);
  }
  changed() {
    this.value = this.saveFileNameCtrl.getValue();
  }
  get saveFileNameCtrl() {
    return this.cmap['saveFileNameCtrl'] as SuiTextInputComponent;
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
      filename = filename + '.json';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveActions(filename);
    this.complete();
  }
  display() {
    this.applyDisplayOptions();
    this.saveFileNameCtrl.setValue(this.value);
    this._bindElements();
  }
  static createName(score: SmoScore) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '-actions.json';
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiSaveActionsDialog(params);
    dg.display();
  }
}
