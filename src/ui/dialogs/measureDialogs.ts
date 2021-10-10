// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoTempoText, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute,
  TimeSignature, SmoMeasureFormat, SmoMeasureFormatNumberAttributes, SmoMeasueFormatBooleanAttributes } from '../../smo/data/measureModifiers';
import { SmoInstrument, SmoInstrumentParams } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiToggleComponent, SuiRockerComponent, SuiDropdownComponent } from '../dialogComponents';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;

export class SuiMeasureFormatAdapter extends SuiComponentAdapter {
  format: SmoMeasureFormat;
  backup: SmoMeasureFormat;
  edited: boolean = false;
  constructor(view: SuiScoreViewOperations, measure: SmoMeasure) {
    super(view);
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
  commit(){}
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
export class SuiMeasureDialog extends SuiDialogAdapterBase<SuiMeasureFormatAdapter> {
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
  constructor(parameters: SuiDialogParams) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    const adapter = new SuiMeasureFormatAdapter(parameters.view, measure);
    super(SuiMeasureDialog.dialogElements, { adapter, ...parameters });
  }
}

export class SuiInstrumentAdapter extends SuiComponentAdapter {
  instrument: SmoInstrument;
  backup: SmoInstrument;
  selections: SmoSelection[];
  selector: SmoSelector;
  applies: number = SuiInstrumentDialog.applyTo.selected;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selection = this.view.tracker.selections[0];
    this.instrument = selection.staff.instrumentInfo;
    this.selections = this.view.tracker.selections;
    this.selector = JSON.parse(JSON.stringify(this.selections[0].selector));
    this.backup = new SmoInstrument(this.instrument);
  }
  get transposeIndex() {
    return this.instrument.keyOffset;
  }
  set transposeIndex(value: number) {
    this.instrument.keyOffset = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get instrumentName() {
    return this.instrument.instrumentName;
  }
  set instrumentName(value: string) {
    this.instrument.instrumentName = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get clef(): Clef {
    return this.instrument.clef;
  }
  set clef(value: Clef)  {
    this.instrument.clef = value;
    this.view.changeInstrument(this.instrument, [this.selections[0]]);
  }
  get applyTo() {
    return this.applies;
  }
  set applyTo(value: number) {
    this.applies = value;
    if (value === SuiInstrumentDialog.applyTo.score) {
      this.selections = SmoSelection.measuresInColumn(this.view.score, this.selector.staff);
    } else if (this.applyTo === SuiInstrumentDialog.applyTo.remaining) {
      this.selections = SmoSelection.selectionsToEnd(this.view.score, this.selector.staff, this.selector.measure);
    } else {
      this.selections = this.view.tracker.selections;
    }
  }
  commit() {
    this.view.changeInstrument(this.instrument, this.selections);
  }
  cancel() {
    this.view.changeInstrument(this.backup, [this.selections[0]]);
  }
  remove() {
    this.view.changeInstrument(new SmoInstrument(SmoInstrument.defaults), this.selections);
  }
}
export class SuiInstrumentDialog extends SuiDialogAdapterBase<SuiInstrumentAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
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
            smoName: 'instrumentName',
            control: 'SuiTextInputComponent',
            label: 'Name'
          }, {
            smoName: 'clef',
            control: 'SuiDropdownComponent',
            label: 'Clef',
            options: [{
              value: 'treble',
              label:'Treble'
            }, {
              value: 'bass',
              label: 'Bass'
            }, {
              value: 'tenor',
              label: 'Tenor'
            }, {
              value: 'alto',
              label: 'Alto'
            }]
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
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiInstrumentAdapter(parameters.view);
    super(SuiInstrumentDialog.dialogElements, { adapter, ...parameters });
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
  }
  commit() { 
    this.view.addMeasures(this.appendCtrl.getValue(), this.measureCountCtrl.getValue());
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
}

export class SuiTimeSignatureAdapter extends SuiComponentAdapter {
  measure: SmoMeasure;
  backup: TimeSignature;
  backupString: string;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.measure = this.view.tracker.selections[0].measure;
    this.backup = new TimeSignature(this.measure.timeSignature);
    this.backupString = this.measure.timeSignatureString;
  }
  get numerator() {
    return this.measure.timeSignature.actualBeats;
  }
  set numerator(value: number) {
    this.measure.timeSignature.actualBeats = value;
  }
  get denominator() {
    return this.measure.timeSignature.beatDuration;
  }
  set denominator(value: number) {
    this.measure.timeSignature.beatDuration = value;
  }
  get display() {
    return this.measure.timeSignature.display;
  }
  set display(value: boolean) {
    this.measure.timeSignature.display = value;
  }
  get useSymbol() {
    return this.measure.timeSignature.useSymbol;
  }
  set useSymbol(value: boolean) {
    this.measure.timeSignature.useSymbol = value;
  }
  get customString() {
    return this.measure.timeSignatureString;
  }
  set customString(value: string) {
    const tr = value.trim();
    if (!(tr.indexOf('/') >= 0)) {
      this.measure.timeSignatureString = '';  
    }
    this.measure.timeSignatureString = value;
  }
  commit() {
    this.view.setTimeSignature(this.measure.timeSignature, this.measure.timeSignatureString);
  }
  cancel() {
    this.measure.timeSignature = this.backup;
  }
}
export class SuiTimeSignatureDialog extends SuiDialogAdapterBase<SuiTimeSignatureAdapter> {
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
            }, {
              smoName: 'useSymbol',
              control: 'SuiToggleComponent',
              label: 'Common/Cut',
            }, {
              smoName: 'customString',
              control: 'SuiTextInputComponent',
              label: 'Custom',
            }
          ],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiTimeSignatureAdapter(parameters.view);
    super(SuiTimeSignatureDialog.dialogElements, { adapter, ...parameters });
  }
  static createAndDisplay(params: SuiDialogParams) {
    var dg = new SuiTimeSignatureDialog(
      params
    );
    dg.display();
    return dg;
  }
}

export class SuiTempoAdapter extends SuiComponentAdapter {
  smoTempoText: SmoTempoText;
  backup: SmoTempoText;
  applyToAll: boolean = false;
  edited: boolean = false;
  constructor(view: SuiScoreViewOperations, tempoText: SmoTempoText) {
    super(view);
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
  commit(){}
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
export class SuiTempoDialog extends SuiDialogAdapterBase<SuiTempoAdapter> {
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
  showHideCustom() {
    if (this.adapter.tempoMode === 'custom') {
      this.cmap.customTextCtrl.show();
    } else {
      this.cmap.customTextCtrl.hide();
    }
  }
  changed() {
    super.changed();
    this.showHideCustom();
  }
  initialValue() {
    super.initialValue();
    this.showHideCustom();
  }

  constructor(parameters: SuiDialogParams) {
    const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = measures[0];
    const adapter = new SuiTempoAdapter(parameters.view, measure.tempo);
    super(SuiTempoDialog.dialogElements, { adapter, ...parameters });
  }
}
