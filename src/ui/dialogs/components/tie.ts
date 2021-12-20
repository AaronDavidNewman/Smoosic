// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiDialogNotifier, DialogDefinitionElement, SuiComponentParent } from '../components/baseComponent';
import { SuiDropdownCompositeParams, SuiDropdownComposite } from '../components/dropdown';

import { buildDom } from '../../../common/htmlHelpers';
import { SmoSelection } from '../../../smo/xform/selections';
import { SmoTie, TieLine } from '../../../smo/data/staffModifiers';
import { SmoNote } from '../../../smo/data/note';
declare var $: any;

export interface PitchTieControlRow {
  leftControl: SuiDropdownComposite,
  rightControl: SuiDropdownComposite
}
export interface TieMappingComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  toggleElement: DialogDefinitionElement,
  dropdownElement: DialogDefinitionElement
}
// ## TieMappingComponent
// Represent the pitches in 2 notes that can be individually tied together
export class TieMappingComponent extends SuiComponentParent {
  // { dropdownElement: {...}, toggleElement: }
  startSelection: SmoSelection | null;
  endSelection: SmoSelection | null;
  modifier: SmoTie;
  controlRows: PitchTieControlRow[] = [];
  constructor(dialog: SuiDialogNotifier, parameter: TieMappingComponentParams) {
    super(dialog, parameter);
    let i = 0;
    const modifier = this.dialog.getModifier();
    if (modifier && SmoTie.isTie(modifier)) {
      this.modifier = modifier;
    } else { // should not happen
      this.modifier = new SmoTie(SmoTie.defaults);
    }
    this.startSelection = SmoSelection.noteFromSelector(
      this.dialog.getView().score, this.modifier.startSelector);
    this.endSelection = SmoSelection.noteFromSelector(
      this.dialog.getView().score, this.modifier.endSelector);
    if (this.startSelection === null || this.startSelection.note === null ||
      this.endSelection === null || this.endSelection.note === null) {
      return;
    }
    const pitchCount = Math.max(this.startSelection.note.pitches.length, this.endSelection.note.pitches.length);

    this.controlRows = [];
    for (i = 0; i < pitchCount; ++i) {
      const smoName = 'Line-' + (i + 1);
      const defaultValue = -1;
      const leftParams: SuiDropdownCompositeParams = {
        id: this.id + smoName + '-left',
        smoName: smoName + '-left',
        classes: 'leftControl',
        control: 'SuiDropdownComposite',
        label: dialog.getStaticText()['fromNote'],
        options: this._generateOptions(this.startSelection.note),
        parentControl: this
      }
      const leftControl = new SuiDropdownComposite(this.dialog, leftParams);
      const rightParams: SuiDropdownCompositeParams = {
        id: this.id + smoName + '-right',
        smoName: smoName + '-right',
        classes: 'rightControl',
        control: 'SuiDropdownComposite',
        label: dialog.getStaticText()['toNote'],
        options: this._generateOptions(this.endSelection.note),
        parentControl: this

      }
      const rightControl = new SuiDropdownComposite(this.dialog, rightParams);
      this.controlRows.push({ leftControl, rightControl });
    }
  }
  bind() {
    this.controlRows.forEach((row) => {
      row.rightControl.bind();
      row.leftControl.bind();
    });
  }

  _generateOptions(note: SmoNote) {
    const options = [];
    let index = 0;
    let label = '';
    options.push({ value: -1, label: 'No Line' });
    note.pitches.forEach((pitch) => {
      const value = index;
      label = pitch.letter.toUpperCase();
      if (pitch.accidental !== 'n') {
        label += pitch.accidental;
      }
      label += pitch.octave;
      options.push({ value, label });
      index += 1;
    });
    return options;
  }
  getValue() {
    const lines: TieLine[] = [];
    this.controlRows.forEach((row) => {
      const left: number = parseInt(row.leftControl.getValue().toString(), 10);
      const right: number = parseInt(row.rightControl.getValue().toString(), 10);
      if (left >= 0 && right >= 0) {
        lines.push({ from: left, to: right });
      }
    });
    return lines;
  }
  setValue(modifier: TieLine[]) {
    let i = 0;
    for (i = 0; i < this.controlRows.length; ++i) {
      const row = this.controlRows[i];
      if (modifier.length > i) {
        row.leftControl.setValue(modifier[i].from);
        row.rightControl.setValue(modifier[i].to);
      }
    }
  }
  changed() {
    this.handleChanged();
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl dropdownPair'))
      .attr('id', this.parameterId);
    this.controlRows.forEach((row) => {
      q.append(row.leftControl.html).append(row.rightControl.html);
    });
    return q;
  }
}