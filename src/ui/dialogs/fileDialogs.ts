// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase, SuiDialogParams, DialogDefinition } from './dialog';
import { SmoScore } from '../../smo/data/score';
import { XmlToSmo } from '../../smo/mxml/xmlToSmo';
import { SmoToXml } from '../../smo/mxml/smoToXml';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiFileDownloadComponent } from './components/fileDownload';
import { SuiDialogAdapterBase, SuiComponentAdapter } from './adapter';
import { addFileLink } from '../../common/htmlHelpers';
import { SmoToMidi } from '../../smo/midi/smoToMidi';
import { MidiToSmo } from '../../smo/midi/midiToSmo';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoToVex } from '../../render/vex/toVex';
declare var $: any;
// declare var MidiParser: any;
declare var parseMidi: any;
declare var JSZip: any;

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
  async commit() {
    let scoreWorks = false;
    if (this.jsonFile.length > 0) {
      try {
        const score = SmoScore.deserialize(this.jsonFile);
        scoreWorks = true;
        await this.view.changeScore(score);
      } catch (e) {
        console.warn('unable to score ' + e);
      }
    }
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() {
    await this.modifier.commit();
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
  async commit() {
    try {
      const self = this;
      const parser = new DOMParser();
      const xml = parser.parseFromString(this.xmlFile, 'text/xml');
      const score = XmlToSmo.convert(xml);
      score.layoutManager!.zoomToWidth($('body').width());
      this.changeScore = true;
      await this.view.changeScore(score);
    } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() {
    try {
        // midi parser expects data in UintArray form
        const ar = new Uint8Array(this.midiFile);
        const midi: any = parseMidi(ar);
        const midiParser = new MidiToSmo(midi, this.quantize);
        await this.view.changeScore(midiParser.convert());
      } catch (e) {
      console.warn('unable to score ' + e);
    }
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() { 
    return PromiseHelpers.emptyPromise();
  }
}
export class SuiVexSaveAdapter extends SuiComponentAdapter {
  fileName: string = '';
  page: number = 0;
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

  get pageToRender() {
    return this.page;
  }
  set pageToRender(val: number) {
    this.page = val;
  }

  async _saveScore() {
    const vexText = SmoToVex.convert(this.view.score, { div: 'smoo', page: this.page });
    if (!this.fileName.endsWith('.js')) {
      this.fileName = this.fileName + '.js';
    }
    /* TODO: zip multiple render files
    const zipname = this.fileName.replace('.js', 'zip');
    const zipFile = new JSZip();
    zipFile.file(this.fileName, vexText);
    const content = await zipFile.generateAsync({ type: 'blob' });
    addFileLink(zipname, content, $('.saveLink'));  */
    addFileLink(this.fileName, vexText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  async commit() {
    let filename = this.fileName;
    const rawFile = filename.split('.')[0];
    if (!filename) {
      filename = 'vexRender.js';
    }
    if (filename.indexOf('.js') < 0) {
      filename = filename + '.js';
    }
    await this._saveScore();
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
}
export class SuiSaveVexDialog extends SuiDialogAdapterBase<SuiVexSaveAdapter>{
  static dialogElements: DialogDefinition =
    {
      label: 'Save as Vex Code',
      elements: [{
        smoName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      }, {
        smoName: 'pageToRender',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Page',
        dataType: 'int',
      }],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {    
    parameters.ctor = 'SuiVexSaveDialog';
    const adapter = new SuiVexSaveAdapter(parameters.view);
    super(SuiSaveVexDialog.dialogElements, { adapter, ...parameters });
  }
  async commit() {
    await this.adapter.commit();
  }
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
  _saveScore() {
    const json = this.view.storeScore.serialize();
    const jsonText = JSON.stringify(json);
    if (!this.fileName.endsWith('.json')) {
      this.fileName = this.fileName + '.json';
    }
    addFileLink(this.fileName, jsonText, $('.saveLink'));
    $('.saveLink a')[0].click();    
  }
  async commit() {
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
    await this.view.updateScoreInfo(scoreInfo);
    this._saveScore();
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() {
    await this.adapter.commit();
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
  _saveXml() {
    const dom = SmoToXml.convert(this.view.storeScore);
    const ser = new XMLSerializer();
    const xmlText = ser.serializeToString(dom);
    if (!this.fileName.endsWith('.xml') && !this.fileName.endsWith('.mxml')) {
      this.fileName = this.fileName + '.xml';
    }
    addFileLink(this.fileName, xmlText, $('.saveLink'));
    $('.saveLink a')[0].click();
  }
  async commit() {
    let filename = this.fileName;
    if (!filename) {
      filename = 'myScore.xml';
    }
    if (filename.indexOf('.xml') < 0) {
      filename = filename + '.xml';
    }
    this.view.score.scoreInfo.version += 1;
    this._saveXml();
    return PromiseHelpers.emptyPromise();
  }
  // noop
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() {
    await this.adapter.commit();
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
  _saveScore() {
    const bytes = SmoToMidi.convert(this.view.storeScore);
    if (!this.fileName.endsWith('.mid')) {
      this.fileName = this.fileName + '.mid';
    }
    addFileLink(this.fileName, bytes, $('.saveLink'), 'audio/midi');
    $('.saveLink a')[0].click();
  }

  async commit() {
    let filename = this.fileName;
    if (!filename) {
      filename = 'myScore.mid';
    }
    if (filename.indexOf('.mid') < 0) {
      filename = filename + '.mid';
    }
    this.view.score.scoreInfo.version += 1;
    this._saveScore();
    return PromiseHelpers.emptyPromise();
  }
  async cancel() {
    return PromiseHelpers.emptyPromise();
  }
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
  async commit() {
    await this.adapter.commit();
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
