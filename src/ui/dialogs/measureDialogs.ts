// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { CheckboxDropdownComponent } from './staffComponents';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoMeasureText, SmoTempoText } from '../../smo/data/measureModifiers';
import { SmoMusic } from '../../smo/data/music';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { DialogDefinitionOption, DialogDefinitionElement, SuiToggleComponent, SuiRockerComponent, SuiDropdownComponent, SuiTextInputComponent } from '../dialogComponents';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { SmoInstrument } from '../../smo/data/staffModifiers';

declare var $: any;

export interface PickupCompositeElement {
  smoName: string,
  parameterName: string,
  dataType?: string
  control: string,
  label: string,
  increment?: number,
  options?: DialogDefinitionOption[],
  toggleElement?: DialogDefinitionElement,
  dropdownElement?: DialogDefinitionElement
}
export interface MeasureDialogDefinition {
  label: string,
  elements: PickupCompositeElement[],
  staticText: Record<string, string>[]
}
// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.
export class SuiMeasureDialog extends SuiDialogBase {
  static get attributes() {
    return ['pickupMeasure', 'makePickup', 'padLeft', 'padAllInSystem',
      'measureText', 'measureTextPosition'];
  }
  static dialogElements: MeasureDialogDefinition = 
      {
        label: 'Measure Properties',
        elements:
          [{
            smoName: 'pickup',
            parameterName: 'pickup',
            control: 'CheckboxDropdownComponent',
            label: 'Pickup',
            toggleElement: {
              smoName: 'makePickup',
              parameterName: 'makePickup',
              control: 'SuiToggleComponent',
              label: 'Convert to Pickup Measure'
            },
            dropdownElement: {
              smoName: 'pickupMeasure',
              parameterName: 'pickupMeasure',
              control: 'SuiDropdownComponent',
              label: 'Pickup Measure',
              options: [{
                value: 2048,
                label: 'Eighth Note'
              }, {
                value: 4096,
                label: 'Quarter Note'
              }, {
                value: 6144,
                label: 'Dotted Quarter'
              }, {
                value: 8192,
                label: 'Half Note'
              }]
            }
          }, {
            parameterName: 'padLeft',
            smoName: 'padLeft',
            control: 'SuiRockerComponent',
            label: 'Pad Left (px)'
          }, {
            parameterName: 'customStretch',
            smoName: 'customStretch',
            control: 'SuiRockerComponent',
            label: 'Stretch Contents'
          }, {
            parameterName: 'customProportion',
            smoName: 'customProportion',
            control: 'SuiRockerComponent',
            increment: 10,
            label: 'Proportionalality'
          }, {
            smoName: 'padAllInSystem',
            parameterName: 'padAllInSystem',
            control: 'SuiToggleComponent',
            label: 'Pad all measures in system'
          }, {
            smoName: 'autoJustify',
            parameterName: 'autoJustify',
            control: 'SuiToggleComponent',
            label: 'Justify Columns'
          }, {
            smoName: 'measureTextPosition',
            parameterName: 'measureTextPosition',
            control: 'SuiDropdownComponent',
            label: 'Text Position',
            options: [{
              value: SmoMeasureText.positions.left,
              label: 'Left'
            }, {
              value: SmoMeasureText.positions.right,
              label: 'Right'
            }, {
              value: SmoMeasureText.positions.above,
              label: 'Above'
            }, {
              value: SmoMeasureText.positions.below,
              label: 'Below'
            }]
          }, {
            smoName: 'systemBreak',
            parameterName: 'systemBreak',
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
  selection: SmoSelection;
  edited: boolean;
  refresh: boolean;
  measure: SmoMeasure;
  modifier: SmoMeasureFormat
  constructor(parameters: SuiDialogParams) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    parameters.modifier = measure.format;
    super(SuiMeasureDialog.dialogElements, { autobind: true, ...parameters });
    this.selection = selection ;
    this.view.groupUndo(true);
    this.edited = false;
    this.refresh = false;

    // The 'modifier' that this dialog acts on is a measure.
    this.measure = this.selection.measure;
    this.modifier = this.measure.format;
    this.displayOptions = ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
  }
  get pickupCtrl() {
    return this.cmap.pickupCtrl as CheckboxDropdownComponent;
  }
  get padLeftCtrl() {
    return this.cmap.padLeftCtrl as SuiRockerComponent;
  }  
  get padAllInSystemCtrl() {
    return this.cmap.padAllInSystemCtrl as SuiToggleComponent;
  }
  changed() {
    this.edited = true;
    let updateFormat = true;
    super.changed();
    // TODO: move pickup out of this dialog
    if (this.pickupCtrl.changeFlag) {
      if (this.pickupCtrl.toggleCtrl.getValue() === false) {
        this.view.createPickup(SmoMusic.timeSignatureToTicks(this.measure.timeSignature.actualBeats.toString() + '/' + this.measure.timeSignature.beatDuration));
      } else {
        this.view.createPickup(parseInt(this.pickupCtrl.dropdownCtrl.getValue().toString(), 10));
      }
    }
    if (this.padLeftCtrl.changeFlag || this.padAllInSystemCtrl.changeFlag) {
      updateFormat = true;
      this.modifier.padLeft = this.padLeftCtrl.getValue();
      this.modifier.padAllInSystem = this.padAllInSystemCtrl.getValue();
    }
    this.view.setMeasureFormat(this.modifier);
    //
    this._updateConditionals();
  }
  display() {
    this.applyDisplayOptions();
    this.initialValue();
    this._bindElements();
  }
  _updateConditionals() {
    if (this.padLeftCtrl.getValue() !== 0 || this.padLeftCtrl.changeFlag) {
      $('.attributeDialog .attributeModal').addClass('pad-left-select');
    } else {
      $('.attributeDialog .attributeModal').removeClass('pad-left-select');
    }
  }
  initialValue() {
    super.initialValue();
    const isPickup = this.measure.isPickup();
    if (isPickup) {
      this.pickupCtrl.dropdownCtrl.setValue(this.measure.getTicksFromVoice(0));
    }
    this._updateConditionals();
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.edited) {
        this.view.undo();
      }
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
  static dialogElements = 
      {
        label: 'Instrument Properties',
        elements:
          [{
            smoName: 'transposeIndex',
            parameterName: 'transposeIndex',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Transpose Index (1/2 steps)',
          }, {
            smoName: 'applyTo',
            parameterName: 'applyTo',
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
    this.displayOptions = ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
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
/* export interface DialogDefinitionElement {
  smoName: string,
  parameterName: string,
  increment?: number,
  defaultValue?: number | string,
  dataType?: string
  control: string,
  label: string,
  options?: DialogDefinitionOption[]
}*/
export class SuiInsertMeasures extends SuiDialogBase {
  static dialogElements: DialogDefinition =
      {
        label: 'Insert Measures',
        elements:
          [{
            smoName: 'measureCount',
            parameterName: 'measureCount',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Measures to Insert'
          }, {
            smoName: 'append',
            parameterName: 'append',
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
    this.displayOptions = ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
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
              parameterName: 'numerator',
              defaultValue: 3,
              control: 'SuiRockerComponent',
              label: 'Beats/Measure',
            },
            {
              parameterName: 'denominator',
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
              parameterName: 'display',
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
    this.displayOptions =['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
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

// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
export class SuiTempoDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = 
      {
        label: 'Tempo Properties',
        elements: [
          {
            smoName: 'tempoMode',
            parameterName: 'tempoMode',
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
            parameterName: 'customText',
            defaultValue: '',
            control: 'SuiTextInputComponent',
            label: 'Custom Text',
            classes: 'hide-when-text-mode'
          },
          {
            parameterName: 'bpm',
            smoName: 'bpm',
            defaultValue: 120,
            control: 'SuiRockerComponent',
            label: 'Notes/Minute'
          },
          {
            parameterName: 'duration',
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
            parameterName: 'tempoText',
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
            parameterName: 'applyToAll',
            control: 'SuiToggleComponent',
            label: 'Apply to all future measures?'
          }, {
            smoName: 'display',
            parameterName: 'display',
            control: 'SuiToggleComponent',
            label: 'Display Tempo'
          }, {
            smoName: 'yOffset',
            parameterName: 'yOffset',
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
  get applyToAllCtrl(): SuiToggleComponent {
    return this.cmap.applyToAllCtrl as SuiToggleComponent;
  }
  modifier: SmoTempoText;
  refresh: boolean;
  constructor(parameters: SuiDialogParams) {
    const measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = measures[0];

    // All measures have a default tempo, but it is not explicitly set unless it is
    // non-default
    if (!parameters.modifier) {
      parameters.modifier = new SmoTempoText(SmoTempoText.defaults);
    }
    if (!parameters.modifier.renderedBox) {
      parameters.modifier.renderedBox = SvgHelpers.copyBox(measure.svg.renderedBox!);
    }
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier and selection');
    }
    super(SuiTempoDialog.dialogElements, { autobind: true, ...parameters });
    this.modifier = measure.getTempo();
    this.refresh = false;
    this.displayOptions = ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this.initialValue();
    this._bindElements();
  }
  initialValue() {
    super.initialValue();
    // ['tempoMode', 'bpm', 'display', 'beatDuration', 'tempoText', 'yOffset', 'customText']
    this._updateModeClass();
  }
  _updateModeClass() {
    if (this.modifier.tempoMode === SmoTempoText.tempoModes.textMode) {
      $('.attributeModal').addClass('tempoTextMode');
      $('.attributeModal').removeClass('tempoDurationMode');
    } else if (this.modifier.tempoMode === SmoTempoText.tempoModes.durationMode) {
      $('.attributeModal').addClass('tempoDurationMode');
      $('.attributeModal').removeClass('tempoTextMode');
    } else {
      $('.attributeModal').removeClass('tempoDurationMode');
      $('.attributeModal').removeClass('tempoTextMode');
    }
  }
  changed() {
    super.changed();
    // ['tempoMode', 'bpm', 'display', 'beatDuration', 'tempoText', 'yOffset', 'customText']
    this._updateModeClass();
    this.view.updateTempoScore(this.modifier, this.applyToAllCtrl.getValue());
  }
  // ### handleRemove
  // Removing a tempo change is like changing the measure to the previous measure's tempo.
  // If this is the first measure, use the default value.
  handleRemove() {
    this.view.removeTempo(this.applyToAllCtrl.getValue());
  }
  // ### Populate the initial values and bind to the buttons.
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.cancel-button').remove();
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.handleRemove();
      this.complete();
    });
  }
}
