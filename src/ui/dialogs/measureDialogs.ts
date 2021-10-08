// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoTempoText, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute } from '../../smo/data/measureModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiToggleComponent, SuiRockerComponent, SuiDropdownComponent } from '../dialogComponents';
import { SmoMeasureFormat, SmoMeasureFormatNumberAttributes, SmoMeasueFormatBooleanAttributes } from '../../smo/data/measureModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoInstrument } from '../../smo/data/staffModifiers';

declare var $: any;

export class SuiMeasureFormatAdapter {
  format: SmoMeasureFormat;
  backup: SmoMeasureFormat;
  view: SuiScoreViewOperations;
  edited: boolean = false;
  constructor(view: SuiScoreViewOperations, measure: SmoMeasure) {
    this.view = view;
    this.format = measure.format;
    this.backup = new SmoMeasureFormat(this.format);
  }
  writeNumber(param: SmoMeasureFormatNumberAttributes, value: number) {
    this.format[param] = value;
    this.view.setMeasureFormat(this.format);
    this.edited = true;
  }
  writeBoolean(param: SmoMeasueFormatBooleanAttributes, value: boolean) {
    this.format[param] = value;
    this.view.setMeasureFormat(this.format);
    this.edited = true;
  }
  cancel() {
    if (this.edited) {
      this.view.setMeasureFormat(this.backup);
    }      
  }
  get padLeft() {
    return this.format.padLeft;
  }
  set padLeft(value: number) {
    if (value >  0) {
      $('.attributeDialog .attributeModal').addClass('pad-left-select');
    } else {
      $('.attributeDialog .attributeModal').removeClass('pad-left-select');
    }
    this.writeNumber('padLeft', value);
  }
  get customStretch() {
    return this.format.customStretch;
  }
  set customStretch(value: number) {
    this.writeNumber('customStretch', value);
  }
  get customProportion() {
    return this.format.customProportion;
  }
  set customProportion(value: number) {
    this.writeNumber('customProportion', value);
  }
  get autoJustify() {
    return this.format.autoJustify;
  }
  set autoJustify(value: boolean) {
    this.writeBoolean('autoJustify', value);
  }
  get padAllInSystem() {
    return this.format.padAllInSystem;
  }
  set padAllInSystem(value: boolean) {
    this.writeBoolean('padAllInSystem', value);
  }
  get systemBreak() {
    return this.format.systemBreak;
  }
  set systemBreak(value: boolean) {
    this.writeBoolean('systemBreak', value);
  }
}
// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.
export class SuiMeasureDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = 
      {
        label: 'Measure Properties',
        elements:
          [{
            smoName: 'padLeft',
            control: 'SuiRockerComponent',
            label: 'Pad Left (px)'
          }, {
            smoName: 'customStretch',
            control: 'SuiRockerComponent',
            label: 'Stretch Contents'
          }, {
            smoName: 'customProportion',
            control: 'SuiRockerComponent',
            increment: 10,
            label: 'Proportionalality'
          }, {
            smoName: 'padAllInSystem',
            control: 'SuiToggleComponent',
            label: 'Pad all measures in system'
          }, {
            smoName: 'autoJustify',
            control: 'SuiToggleComponent',
            label: 'Justify Columns'
          }, {
            smoName: 'systemBreak',
            control: 'SuiToggleComponent',
            label: 'System break before this measure'
          }],
          staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
    //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
    const dg = new SuiMeasureDialog(parameters);
    dg.display();
    return dg;
  }
  modifier: SuiMeasureFormatAdapter;
  constructor(parameters: SuiDialogParams) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    parameters.modifier = measure.format;
    super(SuiMeasureDialog.dialogElements, { autobind: true, ...parameters });
    this.modifier = new SuiMeasureFormatAdapter(this.view, measure);
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
  }
  commit() { }
}

export class SuiInstrumentDialog extends SuiDialogBase {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  static dialogElements: DialogDefinition = 
      {
        label: 'Instrument Properties',
        elements:
          [{
            smoName: 'transposeIndex',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Transpose Index (1/2 steps)',
          }, {
            smoName: 'applyTo',
            defaultValue: SuiInstrumentDialog.applyTo.score,
            dataType: 'int',
            control: 'SuiDropdownComponent',
            label: 'Apply To',
            options: [{
              value: SuiInstrumentDialog.applyTo.score,
              label: 'Score'
            }, {
              value: SuiInstrumentDialog.applyTo.selected,
              label: 'Selected Measures'
            }, {
              value: SuiInstrumentDialog.applyTo.remaining,
              label: 'Remaining Measures'
            }]
          }
          ],
          staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    var db = new SuiInstrumentDialog(parameters);
    db.display();
    return db;
  }
  measure: SmoMeasure;
  refresh: boolean;
  selection: SmoSelection;
  constructor(parameters: SuiDialogParams) {
    super(SuiInstrumentDialog.dialogElements,parameters);
    this.selection = this.view.tracker.selections[0];
    this.measure = this.selection.measure;
    this.refresh = false;
  }
  get transposeIndexCtrl() {
    return this.cmap.transposeIndexCtrl as SuiRockerComponent;
  }
  get applyToCtrl() {
    return this.cmap.applyToCtrl as SuiDropdownComponent;
  }
  commit() { }
  display() {
    this.applyDisplayOptions();
    this.populateInitial();
    this._bindElements();
  }
  populateInitial() {
    const ix = this.measure.transposeIndex;
    this.transposeIndexCtrl.setValue(ix);
  }

  changed() {
    let selections: SmoSelection[] | null = [];
    if (!this.transposeIndexCtrl.changeFlag) {
      return;
    }
    const xpose = this.transposeIndexCtrl.getValue();
    if (this.applyToCtrl.getValue() === SuiInstrumentDialog.applyTo.score) {
      selections = SmoSelection.selectionsToEnd(this.view.score, this.selection.selector.staff, 0);
    } else if (this.applyToCtrl.getValue() === SuiInstrumentDialog.applyTo.remaining) {
      selections = SmoSelection.selectionsToEnd(this.view.score, this.selection.selector.staff, this.selection.selector.measure);
    } else {
      selections.push(this.selection);
    }
    this.view.changeInstrument(
      new SmoInstrument({
        instrument: 'Treble Instrument',
        keyOffset: xpose,
        clef: this.measure.clef
      }),
      selections
    );
  }

  _bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.complete();
    });
  }
}

export class SuiInsertMeasures extends SuiDialogBase {
  static dialogElements: DialogDefinition =
      {
        label: 'Insert Measures',
        elements:
          [{
            smoName: 'measureCount',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Measures to Insert'
          }, {
            smoName: 'append',
            control: 'SuiToggleComponent',
            label: 'Append to Selection'
          }],
          staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    var db = new SuiInsertMeasures(parameters);
    db.display();
    return db;
  }
  measure: SmoMeasure;
  selection: SmoSelection;
  constructor(parameters: SuiDialogParams) {
    super(SuiInsertMeasures.dialogElements,
      parameters);
    this.selection = this.view.tracker.selections[0];
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    this.measure = measure;
    if (!this.startPromise) {
      this.startPromise = new Promise((resolve) => {
        resolve();
      });
    }
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  commit() { }

  display() {
    this.applyDisplayOptions();
    this._bindElements();
  }
  get measureCountCtrl(): SuiRockerComponent {
    return this.cmap.measureCountCtrl as SuiRockerComponent;
  }
  get appendCtrl(): SuiToggleComponent {
    return this.cmap.appendCtrl as SuiToggleComponent;
  }
  populateInitial() {
    this.measureCountCtrl.setValue(1);
  }
  // noop
  changed() {
  }
  _bindElements() {
    var dgDom = this.dgDom;
    this.populateInitial();
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.addMeasures(this.appendCtrl.getValue(), this.measureCountCtrl.getValue());
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
}

export class SuiTimeSignatureDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
        label: 'Custom Time Signature',
        elements:
          [
            {
              smoName: 'numerator',
              defaultValue: 3,
              control: 'SuiRockerComponent',
              label: 'Beats/Measure',
            },
            {
              smoName: 'denominator',
              defaultValue: 8,
              dataType: 'int',
              control: 'SuiDropdownComponent',
              label: 'Beat Value',
              options: [{
                value: 8,
                label: '8',
              }, {
                value: 4,
                label: '4'
              }, {
                value: 2,
                label: '2'
              }]
            }, {
              smoName: 'display',
              control: 'SuiToggleComponent',
              label: 'Display',
            },
          ],
          staticText: []
      };
    measure: SmoMeasure;
    refresh: boolean;
  constructor(parameters: SuiDialogParams) {
    super(SuiTimeSignatureDialog.dialogElements, parameters);
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    this.measure = measure;
    this.refresh = false;
  }
  get numeratorCtrl(): SuiRockerComponent {
    return this.cmap.numeratorCtrl as SuiRockerComponent;
  }
  get denominatorCtrl(): SuiDropdownComponent {
    return this.cmap.denominatorCtrl as SuiDropdownComponent;
  }
  get displayCtrl(): SuiToggleComponent {
    return this.cmap.displayCtrl as SuiToggleComponent;
  }
  commit() {

  }
  populateInitial() {
    const num = this.measure.timeSignature.actualBeats;
    const den = this.measure.timeSignature.beatDuration;
    this.numeratorCtrl.setValue(num);
    this.denominatorCtrl.setValue(den);
    this.displayCtrl.setValue(this.measure.timeSignature.display);
  }

  changed() {
    // no dynamic change for time  signatures
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiTimeSignatureDialog(
      params
    );
    dg.display();
    return dg;
  }

  changeTimeSignature() {
    const ts = SmoMeasure.convertLegacyTimeSignature('' + this.numeratorCtrl.getValue() + '/' + this.denominatorCtrl.getValue());
    ts.display = this.displayCtrl.getValue();
    this.view.setTimeSignature(ts);
  }
  _bindElements() {
    const dgDom = this.dgDom;
    this.populateInitial();
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.changeTimeSignature();
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.complete();
    });
  }
  display() {
    this.applyDisplayOptions();
    this.populateInitial();
    this._bindElements();
  }
}
/*   tempoMode: string,
  bpm: number,
  beatDuration: number,
  tempoText: string,
  yOffset: number,
  display: boolean,
  customText: string */
export class SuiTempoAdapter {
  smoTempoText: SmoTempoText;
  backup: SmoTempoText;
  view: SuiScoreViewOperations;
  applyToAll: boolean = false;
  edited: boolean = false;
  constructor(view: SuiScoreViewOperations, tempoText: SmoTempoText) {
    this.view = view;
    this.smoTempoText = tempoText;
    this.backup = new SmoTempoText(this.smoTempoText);
  }
  writeNumber(param: SmoTempoNumberAttribute, value: number) {
    this.smoTempoText[param] = value;
    this.view.updateTempoScore(this.smoTempoText, this.applyToAll);
    this.edited = true;
  }
  writeBoolean(param: SmoTempoBooleanAttribute, value: boolean) {
    this.smoTempoText[param] = value;
    this.view.updateTempoScore(this.smoTempoText, this.applyToAll);
    this.edited = true;
  }
  writeString(param: SmoTempoStringAttribute, value: string) {
    this.smoTempoText[param] = value;
    this.view.updateTempoScore(this.smoTempoText, this.applyToAll);
    this.edited = true;
  }
  remove() {
    this.view.removeTempo(this.applyToAll);
  }
  cancel() {
    this.view.updateTempoScore(this.backup, false);
  }
  get tempoText() {
    return this.smoTempoText.tempoText;
  }
  set tempoText(value: string) {
    this.writeString('tempoText', value);
  }
  get tempoMode() {
    return this.smoTempoText.tempoMode;
  }
  set tempoMode(value: string) {
    this.writeString('tempoMode', value);
  }
  get customText() {
    return this.smoTempoText.customText;
  }
  set customText(value: string) {
    this.writeString('customText', value);
  }
  get bpm() {
    return this.smoTempoText.bpm;
  }
  set bpm(value: number) {
    this.writeNumber('bpm', value);
  }
  get display() {
    return this.smoTempoText.display;
  }
  set display(value: boolean) {
    this.writeBoolean('display', value);
  }
  get beatDuration() {
    return this.smoTempoText.beatDuration;
  }
  set beatDuration(value: number) {
    this.writeNumber('beatDuration', value);
  }
  get yOffset() {
    return this.smoTempoText.yOffset;
  }
  set yOffset(value: number) {
    this.writeNumber('yOffset', value);
  }
}
// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
export class SuiTempoDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = 
      {
        label: 'Tempo Properties',
        elements: [
          {
            smoName: 'tempoMode',
            defaultValue: SmoTempoText.tempoModes.durationMode,
            control: 'SuiDropdownComponent',
            label: 'Tempo Mode',
            options: [{
              value: 'duration',
              label: 'Duration (Beats/Minute)'
            }, {
              value: 'text',
              label: 'Tempo Text'
            }, {
              value: 'custom',
              label: 'Specify text and duration'
            }
            ]
          },
          {
            smoName: 'customText',
            defaultValue: '',
            control: 'SuiTextInputComponent',
            label: 'Custom Text',
            classes: 'hide-when-text-mode'
          },
          {
            smoName: 'bpm',
            defaultValue: 120,
            control: 'SuiRockerComponent',
            label: 'Notes/Minute'
          },
          {
            smoName: 'beatDuration',
            defaultValue: 4096,
            dataType: 'int',
            control: 'SuiDropdownComponent',
            label: 'Unit for Beat',
            options: [{
              value: 4096,
              label: 'Quarter Note',
            }, {
              value: 2048,
              label: '1/8 note'
            }, {
              value: 6144,
              label: 'Dotted 1/4 note'
            }, {
              value: 8192,
              label: '1/2 note'
            }
            ]
          },
          {
            smoName: 'tempoText',
            defaultValue: SmoTempoText.tempoTexts.allegro,
            control: 'SuiDropdownComponent',
            label: 'Tempo Text',
            classes: 'hide-when-not-text-mode',
            options: [{
              value: SmoTempoText.tempoTexts.larghissimo,
              label: 'Larghissimo'
            }, {
              value: SmoTempoText.tempoTexts.grave,
              label: 'Grave'
            }, {
              value: SmoTempoText.tempoTexts.lento,
              label: 'Lento'
            }, {
              value: SmoTempoText.tempoTexts.largo,
              label: 'Largo'
            }, {
              value: SmoTempoText.tempoTexts.larghetto,
              label: 'Larghetto'
            }, {
              value: SmoTempoText.tempoTexts.adagio,
              label: 'Adagio'
            }, {
              value: SmoTempoText.tempoTexts.adagietto,
              label: 'Adagietto'
            }, {
              value: SmoTempoText.tempoTexts.andante_moderato,
              label: 'Andante moderato'
            }, {
              value: SmoTempoText.tempoTexts.andante,
              label: 'Andante'
            }, {
              value: SmoTempoText.tempoTexts.andantino,
              label: 'Andantino'
            }, {
              value: SmoTempoText.tempoTexts.moderator,
              label: 'Moderato'
            }, {
              value: SmoTempoText.tempoTexts.allegretto,
              label: 'Allegretto',
            }, {
              value: SmoTempoText.tempoTexts.allegro,
              label: 'Allegro'
            }, {
              value: SmoTempoText.tempoTexts.vivace,
              label: 'Vivace'
            }, {
              value: SmoTempoText.tempoTexts.presto,
              label: 'Presto'
            }, {
              value: SmoTempoText.tempoTexts.prestissimo,
              label: 'Prestissimo'
            }
            ]
          }, {
            smoName: 'applyToAll',
            control: 'SuiToggleComponent',
            label: 'Apply to all future measures?'
          }, {
            smoName: 'display',
            control: 'SuiToggleComponent',
            label: 'Display Tempo'
          }, {
            smoName: 'yOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset'
          }
        ],
        staticText: []
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiTempoDialog(parameters);
    dg.display();
    return dg;
  }
  display() {
    super.display();
    if (this.modifier.smoTempoText.tempoMode === 'custom') {
      this.cmap.customTextCtrl.show();
    } else {
      this.cmap.customTextCtrl.hide();
    }
  }
  changed() {
    super.changed();
    if (this.modifier.tempoMode === 'custom') {
      this.cmap.customTextCtrl.show();
    } else {
      this.cmap.customTextCtrl.hide();
    }
  }

  modifier: SuiTempoAdapter;
  constructor(parameters: SuiDialogParams) {
    const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = measures[0];
    super(SuiTempoDialog.dialogElements, { autobind: true, ...parameters });
    this.modifier = new SuiTempoAdapter(parameters.view, measure.tempo);
  }
  // ### Populate the initial values and bind to the buttons.
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.modifier.remove();
      this.complete();
    });
  }
}
