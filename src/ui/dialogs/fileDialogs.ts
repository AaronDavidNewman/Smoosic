// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams, DialogDefinition } from './dialog';
import { SmoScore } from '../../smo/data/score';
import { XmlToSmo } from '../../smo/mxml/xmlToSmo';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiFileDownloadComponent } from './components/fileDownload';
import { SuiDialogAdapterBase, SuiComponentAdapter } from './adapter';
import { MidiToSmo } from '../../smo/midi/midiToSmo';
declare var $: any;
// declare var MidiParser: any;
declare var parseMidi: any;

/**
 * internal state of FileLoadDialog is just the string for the filename.
 * @category SuiDialog
 */
export class SuiSmoLoadAdapter extends SuiComponentAdapter {
  jsonFile: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
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
  cancel() {}
}
/**
 * Load a SMO JSON file
 * @category SuiDialog
 */
export class SuiLoadFileDialog extends SuiDialogAdapterBase<SuiSmoLoadAdapter> {
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
  get loadFileCtrl() {
    return this.cmap['loadFileCtrl'] as SuiFileDownloadComponent;
  }
  modifier: SuiSmoLoadAdapter;
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiSmoLoadAdapter(parameters.view);
    parameters.ctor = 'SuiLoadFileDialog';
    super(SuiLoadFileDialog.dialogElements, { adapter, ...parameters });
    this.modifier = adapter;
  }
  changed() {
    super.changed();
    const enable = this.modifier.loadFile.length < 1;
    $(this.dgDom.element).find('.ok-button').prop('disabled', enable);
  }
  commit() {
    this.modifier.commit();
  }
}
/**
 * internal state of FileLoadDialog is just the string for the filename.
 * @category SuiDialog
 */
 export class SuiXmlLoadAdapter extends SuiComponentAdapter {
  xmlFile: string = '';
  changeScore: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
  }
  get loadFile() {
    return this.xmlFile;
  }
  set loadFile(value: string) {
    this.xmlFile = value;
  }
  commit() {
    try {
      const self = this;
      const parser = new DOMParser();
      const xml = parser.parseFromString(this.xmlFile, 'text/xml');
      const score = XmlToSmo.convert(xml);
      score.layoutManager!.zoomToWidth($('body').width());
      this.changeScore = true;
      this.view.changeScore(score);
    } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  cancel() {}
}

/**
 * Load a music XML file
 * @category SuiDialog
 */
export class SuiLoadMxmlDialog extends SuiDialogAdapterBase<SuiXmlLoadAdapter> {
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
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiLoadMxmlDialog';
    const adapter = new SuiXmlLoadAdapter(parameters.view);
    super(SuiLoadMxmlDialog.dialogElements, { adapter, ...parameters });
  }
  changed() {
    super.changed();
    const enable = this.adapter.loadFile.length < 1;
    $(this.dgDom.element).find('.ok-button').prop('disabled', enable);
  }
}
/**
 * internal state of FileLoadDialog is just the string for the filename.
 * @category SuiDialog
 */
 export class SuiMidiLoadAdapter extends SuiComponentAdapter {
  midiFile: any = null;
  changeScore: boolean = false;
  quantize: number = MidiToSmo.quantizeTicksDefault;
  constructor(view: SuiScoreViewOperations) {
    super(view);
  }
  get loadFile() {
    return this.midiFile;
  }
  set loadFile(value: any) {
    this.midiFile = value;
  }
  get quantizeDuration() {
    return this.quantize;
  }
  set quantizeDuration(value: number) {
    this.quantize = value;
  }
  commit() {
    try {
        // midi parser expects data in UintArray form
        const ar = new Uint8Array(this.midiFile);
        const midi: any = parseMidi(ar);
        const midiParser = new MidiToSmo(midi, this.quantize);
        this.view.changeScore(midiParser.convert());
      } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  cancel() {}
}
export class SuiLoadMidiDialog extends SuiDialogAdapterBase<SuiMidiLoadAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Load File',
      elements: [{
        smoName: 'loadFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      }, {
        smoName: 'quantizeDuration',
        defaultValue: SmoScore.engravingFonts.Bravura,
        control: 'SuiDropdownComponent',
        dataType: 'int',
        label: 'Quantize to:',
        options: [{
          value: 1024,
          label: '1/16th note'
        }, {
          value: 512,
          label: '1/32nd note'
        }, {
          value: 2048,
          label: '1/8th note'
        }]
      }, 
      ],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiLoadMidiDialog';
    const adapter = new SuiMidiLoadAdapter(parameters.view);
    super(SuiLoadMidiDialog.dialogElements, { adapter, ...parameters });
  }
  changed() {
    super.changed();
    const enable = this.adapter?.loadFile?.length < 1;
    $(this.dgDom.element).find('.ok-button').prop('disabled', enable);
  }
}

/*
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
*/
export class SuiPrintFileDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = {
    label: 'Print Complete',
    elements: [],
    staticText: []
  };
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiPrintFileDialog';
    super(SuiPrintFileDialog.dialogElements, parameters);
  }

  changed() { }
  bindElements() {
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
export class SuiSmoSaveAdapter extends SuiComponentAdapter {
  fileName: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.fileName = this.view.score.scoreInfo.name;
  }
  get saveFileName() {
    return this.fileName;
  }
  set saveFileName(value: string) {
    this.fileName = value;
  }
  commit() {
    let filename = this.fileName;
    const rawFile = filename.split('.')[0];
    if (!filename) {
      filename = 'myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
      filename = filename + '.json';
    }
    const scoreInfo = this.view.score.scoreInfo;
    scoreInfo.name = rawFile;
    scoreInfo.version = scoreInfo.version + 1;
    this.view.updateScoreInfo(scoreInfo);
    this.view.saveScore(filename);
  }
  cancel() {}
}
export class SuiSaveFileDialog extends SuiDialogAdapterBase<SuiSmoSaveAdapter>{
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
  constructor(parameters: SuiDialogParams) {    
    parameters.ctor = 'SuiSaveFileDialog';
    const adapter = new SuiSmoSaveAdapter(parameters.view);
    super(SuiSaveFileDialog.dialogElements, { adapter, ...parameters });
  }
  commit() {
    this.adapter.commit();
  }
}

export class SuiXmlSaveAdapter extends SuiComponentAdapter {
  fileName: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
  }
  get saveFileName() {
    return this.fileName;
  }
  set saveFileName(value: string) {
    this.fileName = value;
  }
  commit() {
    let filename = this.fileName;
    if (!filename) {
      filename = 'myScore.xml';
    }
    if (filename.indexOf('.xml') < 0) {
      filename = filename + '.xml';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveXml(filename);
  }
  // noop
  cancel() {}
}
export class SuiSaveXmlDialog extends SuiDialogAdapterBase<SuiXmlSaveAdapter> {
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
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiSaveXmlDialog';
    const adapter = new SuiXmlSaveAdapter(parameters.view);
    super(SuiSaveXmlDialog.dialogElements, { adapter, ...parameters });
  }
  commit() {
    this.adapter.commit();
  }
}

export class SuiMidiSaveAdapter extends SuiComponentAdapter {
  fileName: string = '';
  constructor(view: SuiScoreViewOperations) {
    super(view);
  }
  get saveFileName() {
    return this.fileName;
  }
  set saveFileName(value: string) {
    this.fileName = value;
  }
  commit() {
    let filename = this.fileName;
    if (!filename) {
      filename = 'myScore.mid';
    }
    if (filename.indexOf('.mid') < 0) {
      filename = filename + '.mid';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveMidi(filename);
  }
  cancel() {}
}
export class SuiSaveMidiDialog extends SuiDialogAdapterBase<SuiMidiSaveAdapter> {
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
  constructor(parameters: SuiDialogParams) {
    parameters.ctor = 'SuiSaveMidiDialog';
    const adapter = new SuiMidiSaveAdapter(parameters.view);
    super(SuiSaveMidiDialog.dialogElements, { adapter, ...parameters });
  }
  commit() {
    this.adapter.commit();
  }
}
/* 
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
    this.bindElements();
  }
  static createName(score: SmoScore) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '-actions.json';
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiSaveActionsDialog(params);
    dg.display();
  }
}  */
