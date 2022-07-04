// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoTempoText, SmoTempoNumberAttribute, SmoTempoStringAttribute, SmoTempoBooleanAttribute } from '../../smo/data/measureModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;



export class SuiTempoAdapter extends SuiComponentAdapter {
  smoTempoText: SmoTempoText;
  backup: SmoTempoText;
  applyToAllVal: boolean = false;
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
    (this.smoTempoText as any)[param] = value;
    this.view.updateTempoScore(this.smoTempoText, this.applyToAll);
    this.edited = true;
  }
  remove() {
    this.view.removeTempo(this.applyToAll);
  }
  cancel() {
    this.view.updateTempoScore(this.backup, false);
  }
  get applyToAll() {
    return this.applyToAllVal;
  }
  set applyToAll(val: boolean) {
    this.applyToAllVal = val;
    this.view.updateTempoScore(this.smoTempoText, this.applyToAll);
    this.edited = true;
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
  showHideCustom(): void {
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
