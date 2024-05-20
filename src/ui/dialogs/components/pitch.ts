// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from '../components/baseComponent';
import { Pitch, PitchLetter } from '../../../smo/data/common';
import { SmoMusic } from '../../../smo/data/music';
import { DomBuilder, buildDom } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiDropdownComposite } from './dropdown';
import { SuiRockerComposite } from './rocker';
import { SuiButtonComposite } from './button';
import { SmoTabStave } from '../../../../typedoc';
declare var $: any;
export interface SuiPitchComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export class SuiPitchComponent extends SuiComponentBase {
  view: SuiScoreViewOperations;
  staticText: Record<string, string>;
  letterCtrl: SuiDropdownComposite;
  accidentalCtrl: SuiDropdownComposite;
  octaveCtrl: SuiRockerComposite;
  defaultValue: Pitch;

  constructor(dialog: SuiDialogNotifier, parameter: SuiPitchComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    this.view = this.dialog.getView();
    this.defaultValue = { letter: 'c', accidental: 'n', octave: 4 };
    const letterName = this.smoName + 'Letter';
    const accidentalName = this.smoName + 'Accidental';
    const octaveName = this.smoName + 'Octave';
    this.staticText = this.dialog.getStaticText();
    this.letterCtrl = new SuiDropdownComposite(this.dialog, {
      smoName: letterName,
      control: 'SuiDropdownComposite',
      label: ' ',
      parentControl: this,
      classes: '',
      id: letterName,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
        { value: 'd', label: 'D' },
        { value: 'e', label: 'E' },
        { value: 'f', label: 'F' },
        { value: 'g', label: 'G' }
      ]
    });

    this.accidentalCtrl = new SuiDropdownComposite(this.dialog, {
      smoName: accidentalName,
      control: 'SuiDropdownComposite',
      label: ' ',
      parentControl: this,
      classes: '',
      id: accidentalName,
      options: [
        { value: 'n', label: '' },
        { value: 'n', label: '#' },
        { value: 'n', label: 'b' },
      ]
    });
    this.octaveCtrl = new SuiRockerComposite(this.dialog, {
      id: octaveName,
      classes: '',
      dataType: 'int',
      increment: 1,
      defaultValue: 4,
      label: 'Octave',
      smoName: octaveName,
      control: 'SuiRockerComposite',
      parentControl: this
    });
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl pitchContainer'))
      .attr('id', this.parameterId);
    q.append(this.letterCtrl.html);
    q.append(this.accidentalCtrl.html);
    q.append(this.octaveCtrl.html);
    return q;
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  getValue(): Pitch {
    return {
      letter: this.letterCtrl.getValue() as PitchLetter,
      accidental: this.accidentalCtrl.getValue().toString(),
      octave: this.octaveCtrl.getValue()
    };
  }
  setValue(val: Pitch) {
    this.letterCtrl.setValue(val.letter);
    this.accidentalCtrl.setValue(val.accidental);
    this.octaveCtrl.setValue(val.octave);
  }
  changed() {
    this.handleChanged();
  }
  bind() {
    this.letterCtrl.bind();
    this.accidentalCtrl.bind();
    this.octaveCtrl.bind();
  }
}
export interface SuiPitchCompositeParams extends SuiPitchComponentParams {
  parentControl: SuiComponentParent
}
export class SuiPitchComposite extends SuiPitchComponent {
  parentControl: SuiComponentParent;
  constructor(dialog: SuiDialogNotifier, parameters: SuiPitchCompositeParams) {
    super(dialog, parameters);
    this.parentControl = parameters.parentControl;
  }
  handleChanged() {
    this.changeFlag = true;
    this.parentControl.changed();
    this.changeFlag = false;
  }
}
export interface SuiPitchArrayItem {
  buttonCtrl: SuiButtonComposite,
  pitchCtrl: SuiPitchComposite,
  pitch: Pitch
}
export interface SuiPitchArrayParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  pitches?: Pitch[]
}
export class SuiPitchArrayComponent extends SuiComponentParent {
  getButtonControlName(index: number) {
    return  `${this.id}-delButton-${index}`;
  }
  getPitchControlName(index: number) {
    return `${this.id}-pitchCtrl-${index}`;
  }
  pitchControls: SuiPitchArrayItem[] = [];
  createdShell: boolean = false;
  constructor(dialog: SuiDialogNotifier, parameters: SuiPitchArrayParams) {
    super(dialog, parameters);
    if (!parameters.pitches) {
      parameters.pitches = SmoTabStave.defaults.stringPitches;
    }
    if (!parameters.pitches) {
      throw 'no pitches somehow?';
    }
    this.setPitchControls(parameters.pitches);
  }
  setPitchControls(pitches: Pitch[]) {
    this.pitchControls = [];
    for (var i = 0; i < pitches.length; ++i) {
      const pitch = pitches[i];
      const buttonControlName = this.getButtonControlName(i);
      const pitchControlName = this.getPitchControlName(i);
      const buttonCtrl: SuiButtonComposite = new SuiButtonComposite(this.dialog,  {
        id: buttonControlName,
        classes: '',
        label: 'Delete',
        smoName: buttonControlName,
        control: 'SuiButtonComposite',
        icon: 'icon-cross',
        parentControl: this
      });
      const pitchCtrl: SuiPitchComposite = new SuiPitchComposite(this.dialog, {
        id: pitchControlName,
        classes: '',
        label: ' ',
        smoName: pitchControlName,
        control: 'SuiPitchComposite',
        parentControl: this
      });
      this.pitchControls.push({
        buttonCtrl, pitchCtrl, pitch
      });
    }
    this.pitchControls.sort((pa, pb) => SmoMusic.smoPitchToInt(pa.pitch) > SmoMusic.smoPitchToInt(pb.pitch) ? -1 : 1);
  }
  bind() {
    this.pitchControls.forEach((pc) => {
      pc.buttonCtrl.bind();
      pc.pitchCtrl.bind();
    });
  }
  get html() {
    const b = buildDom;
    if (!this.createdShell) {
      // First time, create shell for component.
      this.createdShell = true;    
      const q = b('div').classes(this.makeClasses('multiControl smoControl pitch-array-parent')).
        attr('id', this.parameterId);
      return q;
    } 
    const q = b('div').classes('pitch-array-container');
    this.pitchControls.forEach((row) => {
      q.append(b('div').classes('pitch-array-item').append(row.buttonCtrl.html).append(row.pitchCtrl.html));
    });
    return q;
  }
  getInputElement() {
    var pid = this.parameterId;
    return $('#' + pid);
  }
  setValue(pitches: Pitch[]) {
    this.updateControls();
    this.pitchControls.forEach((pc, i) => {
      pc.pitchCtrl.setValue(pitches[i]);
    });
  }
  getValue() {
    const rv: Pitch[] = [];
    this.pitchControls.forEach((pc) => {
      rv.push(pc.pitchCtrl.getValue());
    });
    return rv;
  }
  updateControls() {
    const updateEl = this.getInputElement();
    $(updateEl).html('');
    $(updateEl).append(this.html.dom());
    $(updateEl).find('input').prop('disabled', false);
    $(updateEl).find('.toggle-disabled input').prop('checked', true);
    $(updateEl).find('.toggle-remove-row input').prop('checked', true);
    $(updateEl).find('.toggle-add-row input').prop('checked', false);
    $(updateEl).find('.toggle-disabled input').prop('disabled', true);
    this.bind();
  }
  changed() {
    let removed = false;
    const pitches: Pitch[] = [];
    this.pitchControls.forEach((pc) => {
      if (pc.buttonCtrl.changeFlag) {
        removed = true;
      } else {
        pitches.push(pc.pitchCtrl.getValue());
      }
    });
    if (removed && this.pitchControls.length < 2) {
      return; // don't let user delete all the strings
    }
    this.setPitchControls(pitches);    
    this.handleChanged();
    this.setValue(pitches);
  }
}