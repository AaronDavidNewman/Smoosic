// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogBase } from '../dialog';
import { CheckboxDropdownComponent } from './staffComponents';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoMeasureText, SmoTempoText } from '../../smo/data/measureModifiers';
import { smoMusic } from '../../common/musicHelpers';
import { SmoSelection } from '../../smo/xform/selections';
import { svgHelpers } from '../../common/svgHelpers';

// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.
export class SuiMeasureDialog extends SuiDialogBase {
  static get attributes() {
    return ['pickupMeasure', 'makePickup', 'padLeft', 'padAllInSystem',
      'measureText', 'measureTextPosition'];
  }
  static get ctor() {
    return 'SuiMeasureDialog';
  }
  get ctor() {
    return SuiMeasureDialog.ctor;
  }
  static get dialogElements() {
    SuiMeasureDialog._dialogElements = typeof(SuiMeasureDialog._dialogElements) !== 'undefined' ? SuiMeasureDialog._dialogElements :
      [{
        staticText: [
          { label: 'Measure Properties' }]
      },
      {
        smoName: 'pickup',
        parameterName: 'pickup',
        defaultValue: '',
        control: CheckboxDropdownComponent,
        label: 'Pickup',
        toggleElement: {
          smoName: 'makePickup',
          parameterName: 'makePickup',
          defaultValue: false,
          control: 'SuiToggleComponent',
          label: 'Convert to Pickup Measure'
        },
        dropdownElement: {
          smoName: 'pickupMeasure',
          parameterName: 'pickupMeasure',
          defaultValue: 2048,
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
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Pad Left (px)'
      }, {
        parameterName: 'customStretch',
        smoName: 'customStretch',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Stretch Contents'
      }, {
        parameterName: 'customProportion',
        smoName: 'customProportion',
        defaultValue: SmoMeasure.defaults.customProportion,
        control: 'SuiRockerComponent',
        increment: 10,
        label: 'Proportionalality'
      }, {
        smoName: 'padAllInSystem',
        parameterName: 'padAllInSystem',
        defaultValue: false,
        control: 'SuiToggleComponent',
        label: 'Pad all measures in system'
      }, {
        smoName: 'autoJustify',
        parameterName: 'autoJustify',
        defaultValue: true,
        control: 'SuiToggleComponent',
        label: 'Justify Columns'
      }, {
        smoName: 'measureTextPosition',
        parameterName: 'measureTextPosition',
        defaultValue: SmoMeasureText.positions.above,
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
        defaultValue: false,
        control: 'SuiToggleComponent',
        label: 'System break before this measure'
      }];
    return SuiMeasureDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
    //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
    parameters.selection = parameters.view.tracker.selections[0];
    const dg = new SuiMeasureDialog(parameters);
    dg.display();
    return dg;
  }
  changed() {
    this.edited = true;
    let updateFormat = true;
    // TODO: move pickup out of this dialog
    if (this.pickupCtrl.changeFlag) {
      if (this.pickupCtrl.toggleCtrl.getValue() === false) {
        this.view.createPickup(smoMusic.timeSignatureToTicks(this.measure.timeSignature));
      } else {
        this.view.createPickup(this.pickupCtrl.dropdownCtrl.getValue());
      }
    }
    if (this.customStretchCtrl.changeFlag) {
      this.modifier.customStretch = this.customStretchCtrl.getValue();
      updateFormat = true;
    }
    if (this.customProportionCtrl.changeFlag) {
      this.modifier.customProportion = this.customProportionCtrl.getValue();
      updateFormat = true;
    }
    if (this.systemBreakCtrl.changeFlag) {
      updateFormat = true;
      this.modifier.systemBreak = this.systemBreakCtrl.getValue();
    }
    if (this.autoJustifyCtrl.changeFlag) {
      updateFormat = true;
      this.modifier.autoJustify = this.autoJustifyCtrl.getValue();
    }
    if (this.padLeftCtrl.changeFlag || this.padAllInSystemCtrl.changeFlag) {
      updateFormat = true;
      this.modifier.padLeft = this.padLeftCtrl.getValue();
      this.modifier.padAllInSystem = this.padAllInSystemCtrl.getValue();
    }
    if (updateFormat) {
      this.view.setMeasureFormat(this.modifier);
    }
    //
    this._updateConditionals();
  }
  constructor(parameters) {
    if (!parameters.selection) {
      throw new Error('measure dialogmust have measure and selection');
    }

    super(SuiMeasureDialog.dialogElements, {
      id: 'dialog-measure',
      label: 'Measure Properties',
      ...parameters
    });
    this.view.groupUndo(true);
    this.edited = false;
    this.refresh = false;
    Vex.Merge(this, parameters);

    // The 'modifier' that this dialog acts on is a measure.
    this.measure = this.selection.measure;
    this.modifier = this.measure.format;
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this.populateInitial();
    this._bindElements();
  }
  _updateConditionals() {
    if (this.padLeftCtrl.getValue() !== 0 || this.padLeftCtrl.changeFlag) {
      $('.attributeDialog .attributeModal').addClass('pad-left-select');
    } else {
      $('.attributeDialog .attributeModal').removeClass('pad-left-select');
    }
  }
  populateInitial() {
    this.padLeftCtrl.setValue(this.modifier.padLeft);
    this.autoJustifyCtrl.setValue(this.modifier.autoJustify);
    const isPickup = this.measure.isPickup();
    this.customStretchCtrl.setValue(this.modifier.customStretch);
    this.customProportionCtrl.setValue(this.modifier.customProportion);
    this.pickupCtrl.toggleCtrl.setValue(isPickup);
    if (isPickup) {
      this.pickupCtrl.dropdownCtrl.setValue(this.measure.getTicksFromVoice(0));
    }

    const isSystemBreak = this.modifier.systemBreak;
    this.systemBreakCtrl.setValue(isSystemBreak);
    this._updateConditionals();

    // TODO: handle multiples (above/below)
    this.measure.getMeasureText();
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
      this.groupUndo(false);
      this.complete();
    });
  }
}

export class SuiInstrumentDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiInstrumentDialog';
  }
  get ctor() {
    return SuiInstrumentDialog.ctor;
  }
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  static get dialogElements() {
    SuiInstrumentDialog._dialogElements = typeof(SuiInstrumentDialog._dialogElements) !== 'undefined' ?
      SuiInstrumentDialog._dialogElements :
      [{
        staticText: [
          { label: 'Instrument Properties' }
        ]
      },
      {
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
      }];
    return SuiInstrumentDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    var db = new SuiInstrumentDialog(parameters);
    db.display();
    return db;
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }

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
    let selections = [];
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
      {
        instrumentName: 'Treble Instrument',
        keyOffset: xpose,
        clef: this.measure.clef
      },
      selections
    );
  }

  constructor(parameters) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    parameters = { selection, measure, ...parameters };

    super(SuiInstrumentDialog.dialogElements, {
      id: 'instrument-measure',
      ...parameters
    });
    this.measure = measure;
    this.refresh = false;
    this.selection = parameters.selection;
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
  static get ctor() {
    return 'SuiInsertMeasures';
  }
  get ctor() {
    return SuiInsertMeasures.ctor;
  }

  static get dialogElements() {
    SuiInsertMeasures._dialogElements = typeof(SuiInsertMeasures._dialogElements) !== 'undefined' ?
      SuiInsertMeasures._dialogElements :
      [{
        staticText: [
          { label: 'Insert Measures' }
        ]
      }, {
        smoName: 'measureCount',
        parameterName: 'measureCount',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Measures to Insert',
      }, {
        smoName: 'append',
        parameterName: 'append',
        defaultValue: true,
        control: 'SuiToggleComponent',
        label: 'Append to Selection'
      }];
    return SuiInsertMeasures._dialogElements;
  }
  static createAndDisplay(parameters) {
    var db = new SuiInsertMeasures(parameters);
    db.display();
    return db;
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
  }
  populateInitial() {
    this.measureCountCtrl.setValue(1);
  }
  // noop
  changed() {
  }
  constructor(parameters) {
    const selection = parameters.view.tracker.selections[0];
    const measure = selection.measure;
    parameters = { selection, measure, ...parameters };
    super(SuiInsertMeasures.dialogElements, {
      id: 'time-signature-measure',
      ...parameters
    });
    this.measure = measure;
    Vex.Merge(this, parameters);
    if (!this.startPromise) {
      this.startPromise = new Promise((resolve) => {
        resolve();
      });
    }
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
  static get ctor() {
    return 'SuiTimeSignatureDialog';
  }
  get ctor() {
    return SuiTimeSignatureDialog.ctor;
  }
  static get dialogElements() {
    SuiTimeSignatureDialog._dialogElements = SuiTimeSignatureDialog._dialogElements ? SuiTimeSignatureDialog._dialogElements :
      [
        { staticText: [
          { label: 'Custom Time Signature' }
        ] },
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
        }];
    return SuiTimeSignatureDialog._dialogElements;
  }
  populateInitial() {
    const nd = this.measure.timeSignature.split('/');
    const num = parseInt(nd[0], 10);
    const den = parseInt(nd[1], 10);
    this.numeratorCtrl.setValue(num);
    this.denominatorCtrl.setValue(den);
  }

  changed() {
    // no dynamic change for time  signatures
  }
  static createAndDisplay(params) {
    var dg = new SuiTimeSignatureDialog(
      params
    );
    dg.display();
    return dg;
  }

  changeTimeSignature() {
    const ts = '' + this.numeratorCtrl.getValue() + '/' + this.denominatorCtrl.getValue();
    this.view.setTimeSignature(ts);
  }
  _bindElements() {
    const dgDom = this.dgDom;
    this.numeratorCtrl = this.components.find((comp) => comp.smoName === 'numerator');
    this.denominatorCtrl = this.components.find((comp) => comp.smoName === 'denominator');
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
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this.populateInitial();
    this._bindElements();
  }
  constructor(parameters) {
    const measure = parameters.view.tracker.selections[0].measure;

    super(SuiTimeSignatureDialog.dialogElements, {
      id: 'time-signature-measure',
      label: 'Custom Time Signature',
      ...parameters
    });
    this.measure = measure;
    this.refresh = false;
    this.startPromise = parameters.closeMenuPromise;
    Vex.Merge(this, parameters);
  }
}

// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
export class SuiTempoDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiTempoDialog';
  }
  get ctor() {
    return SuiTempoDialog.ctor;
  }
  static get attributes() {
    return ['tempoMode', 'bpm', 'beatDuration', 'tempoText', 'yOffset'];
  }
  static get dialogElements() {
    SuiTempoDialog._dialogElements = SuiTempoDialog._dialogElements ? SuiTempoDialog._dialogElements :
      [
        { staticText: [
          { label: 'Tempo Properties' }
        ]
        },
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
          defaultValue: false,
          control: 'SuiToggleComponent',
          label: 'Apply to all future measures?'
        }, {
          smoName: 'display',
          parameterName: 'display',
          defaultValue: true,
          control: 'SuiToggleComponent',
          label: 'Display Tempo'
        }, {
          smoName: 'yOffset',
          parameterName: 'yOffset',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Y Offset'
        }
      ];
    return SuiTempoDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiTempoDialog(parameters);
    dg.display();
    return dg;
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this.populateInitial();
    this._bindElements();
  }

  constructor(parameters) {
    parameters.measures = SmoSelection.getMeasureList(parameters.view.tracker.selections)
      .map((sel) => sel.measure);
    const measure = parameters.measures[0];

    // All measures have a default tempo, but it is not explicitly set unless it is
    // non-default
    parameters.modifier = measure.getTempo();
    if (!parameters.modifier) {
      parameters.modifier = new SmoTempoText();
    }
    if (!parameters.modifier.renderedBox) {
      parameters.modifier.renderedBox = svgHelpers.copyBox(measure.renderedBox);
    }
    if (!parameters.modifier || !parameters.measures) {
      throw new Error('modifier attribute dialog must have modifier and selection');
    }
    super(SuiTempoDialog.dialogElements, {
      id: 'dialog-tempo',
      top: parameters.modifier.renderedBox.y,
      left: parameters.modifier.renderedBox.x,
      ...parameters
    });
    this.refresh = false;
    Vex.Merge(this, parameters);
  }
  populateInitial() {
    SmoTempoText.attributes.forEach((attr) => {
      var comp = this.components.find((cc) => cc.smoName === attr);
      if (comp) {
        comp.setValue(this.modifier[attr]);
      }
    });
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
    this.components.forEach((component) => {
      if (SmoTempoText.attributes.indexOf(component.smoName) >= 0) {
        this.modifier[component.smoName] = component.getValue();
      }
    });
    if (this.modifier.tempoMode === SmoTempoText.tempoModes.textMode) {
      this.modifier.bpm = SmoTempoText.bpmFromText[this.modifier.tempoText];
    }
    if (this.customTextCtrl.changeFlag) {
      this.modifier.customText = this.customTextCtrl.getValue();
    }
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
