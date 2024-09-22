// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoPedalMarking } from '../../smo/data/staffModifiers';
import { UndoBuffer } from '../../smo/xform/undo';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { addOrReplacePedalMarking } from '../menus/staffModifier';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { SmoSelection } from '../../smo/xform/selections';

declare var $: any;


export class SuiPedalMarkingAdapter extends SuiComponentAdapter {
  backup: SmoPedalMarking;
  pedalMarking: SmoPedalMarking;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations, bracket: SmoPedalMarking) {
    super(view);
    this.pedalMarking = bracket;
    this.view = view;
    this.backup = new SmoPedalMarking(this.pedalMarking.serialize());
    this.backup.attrs.id = bracket.attrs.id;
    this.backup.associatedStaff = bracket.associatedStaff;
    this.view.groupUndo(true);
  }
  async cancel() {
    await addOrReplacePedalMarking(this.view, this.backup);
  }
  async remove() {
    await this.view.removeStaffModifier(this.pedalMarking);
  }
  async commit() {
    return;
  }
  get depressText() {
    return this.pedalMarking.depressText;
  }
  set depressText(val: string) {
    this.pedalMarking.depressText = val.trim();
  }
  get releaseText() {
    return this.pedalMarking.releaseText;
  }
  set releaseText(val: string) {
    this.pedalMarking.releaseText = val.trim();
  }
  get bracket() {
    return this.pedalMarking.bracket;
  }
  set bracket(val: boolean) {
    this.pedalMarking.bracket = val;
  }
  get startMark() {
    return this.pedalMarking.startMark;
  }
  set startMark(val: boolean) {
    this.pedalMarking.startMark = val;
  }
  get releaseMark() {
    return this.pedalMarking.releaseMark;
  }
  set releaseMark(val: boolean) {
    this.pedalMarking.releaseMark = val;
  }
}
export class SuiPedalMarkingDialog extends SuiDialogAdapterBase<SuiPedalMarkingAdapter> {
  static dialogElements: DialogDefinition =
      {
        label: 'Pedal Marking Properties', elements:
          [{
            smoName: 'bracket',
            defaultValue: 1,
            control: 'SuiToggleComponent',
            label: 'Bracket'
          }, {
            smoName: 'startMark',
            defaultValue: 1,
            control: 'SuiToggleComponent',
            label: 'Start Mark'
          }, {
            smoName: 'releaseMark',
            defaultValue: 1,
            control: 'SuiToggleComponent',
            label: 'ReleaseMark'
          },  {
            smoName: 'depressText',
            control: 'SuiTextInputComponent',
            label: 'Depress Text'
          }, {
            smoName: 'releaseText',
            control: 'SuiTextInputComponent',
            label: 'Release Text'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiPedalMarkingAdapter(parameters.view, parameters.modifier);
    super(SuiPedalMarkingDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
  async changed() {
    await super.changed();
    const redraw = SmoSelection.getMeasuresBetween(this.view.score, this.adapter.pedalMarking.startSelector,
      this.adapter.pedalMarking.endSelector
    );
    this.view.undoStaffModifier('pedal marking', this.adapter.backup, UndoBuffer.bufferSubtypes.UPDATE);
    await addOrReplacePedalMarking(this.view, this.adapter.pedalMarking);
    this.view._renderChangedMeasures(redraw);
    await this.view.updatePromise();
  }
}