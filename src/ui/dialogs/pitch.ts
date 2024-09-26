import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { buildDom } from '../../common/htmlHelpers';
import { SuiButtonComposite } from './components/button';
import { SuiComponentParent } from './components/baseComponent';
import { IsPitchLetter } from '../../smo/data/common';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';

export class SuiTransposeButtonComponent extends SuiComponentParent {
  upOctaveComponent: SuiButtonComposite;
  downOctaveComponent: SuiButtonComposite;
  upStepComponent: SuiButtonComposite;
  downStepComponent: SuiButtonComposite;
  toggleEnharmonicComponent: SuiButtonComposite;
  toggleCourtesyComponent: SuiButtonComposite;
  constructor(dialog: SuiDialogNotifier, params: SuiBaseComponentParams) {
    super(dialog, params);
    this.upOctaveComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'upOctave',
        smoName: 'upOctave',
        parentControl: this,
        icon: 'ribbon-button-text icon-bravura icon-ottavaAlta',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Up Octave',
        text: '+'
      });
    this.downOctaveComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'downOctave',
        smoName: 'downOctave',
        parentControl: this,
        icon: 'ribbon-button-text icon-bravura icon-ottavaBassa',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Down Octave',
        text: '_'
      });
    this.upStepComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'upStep',
        smoName: 'upStep',
        parentControl: this,
        icon: 'ribbon-button-text icon-bravura icon-accidentalSharp',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Add Dot',
        text: '='
      });
    this.downStepComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'downStep',
        smoName: 'downStep',
        parentControl: this,
        icon: 'ribbon-button-text icon-bravura icon-accidentalFlat',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Remove Dot',
        text: '-'
      });
    this.toggleEnharmonicComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'toggleEnharmonic',
        smoName: 'toggleEnharmonic',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-accident',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Remove Dot',
        text: 'Shift-E'
      });
    this.toggleCourtesyComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'toggleCourtesy',
        smoName: 'toggleCourtesy',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-courtesy',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Toggle Courtesy Accidental',
        text: 'Shift-F'
      });        
  }
  getValue(): string {
    if (this.upOctaveComponent.changeFlag) {
      return this.upOctaveComponent.smoName;
    }
    if (this.downOctaveComponent.changeFlag) {
      return this.downOctaveComponent.smoName;
    }
    if (this.upStepComponent.changeFlag) {
      return this.upStepComponent.smoName;
    }
    if (this.downStepComponent.changeFlag) {
      return this.downStepComponent.smoName;
    }
    if (this.toggleEnharmonicComponent.changeFlag) {
      return this.toggleEnharmonicComponent.smoName;
    }
    if (this.toggleCourtesyComponent.changeFlag) {
      return this.toggleCourtesyComponent.smoName;
    }
    return '';
  }  
  setValue(value: string) {
    // ignore
  }
  async changed() {
    this.handleChanged();
  }
  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl buttonArray'))
      .attr('id', this.parameterId);
    q.append(this.upOctaveComponent.html);
    q.append(this.downOctaveComponent.html);
    q.append(this.upStepComponent.html);
    q.append(this.downStepComponent.html);
    q.append(this.toggleEnharmonicComponent.html);
    q.append(this.toggleCourtesyComponent.html);
    return q;
  }
  bind() {
    this.upOctaveComponent.bind();
    this.downOctaveComponent.bind();
    this.upStepComponent.bind();
    this.downStepComponent.bind();
    this.toggleEnharmonicComponent.bind();
    this.toggleCourtesyComponent.bind();
  }
}

const intervalButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Intervals',
    rows: [{
      label: 'Intervals Up',
      classes: 'pad-span',
      buttons: [
        { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordsecond',
          text: '2nd',
          label:'2nd',
          smoName: 'chordsecond'
        },
        { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordthird',
          text: '3rd',
          label:'3rd',
          smoName: 'chordthird'
        }, { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordfourth',
          text: '4th',
          label:'4th',
          smoName: 'chordfourth'
        }, { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordfifth',
          text: '5th',
          label:'5th',
          smoName: 'chordfifth'
        }, { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordsixth',
          text: '6th',
          label:'6th',
          smoName: 'chordsixth'
        }, { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordseventh',
          text: '7th',
          label:'7th',
          smoName: 'chordseventh'
        }, { classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'chordoctave',
          text: '8va',
          label:'8va',
          smoName: 'chordoctave'
        }
      ]}, 
      {
        label: 'Intervals Down',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordsecond',
            text: '2nd',
            label:'2nd',
            smoName: 'downchordsecond'
          },
          { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordthird',
            text: '3rd',
            label:'3rd',
            smoName: 'downchordthird'
          }, { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordfourth',
            text: '4th',
            label:'4th',
            smoName: 'downchordfourth'
          }, { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordfifth',
            text: '5th',
            label:'5th',
            smoName: 'downchordfifth'
          }, { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordsixth',
            text: '6th',
            label:'6th',
            smoName: 'downchordsixth'
          }, { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordseventh',
            text: '7th',
            label:'7th',
            smoName: 'downchordseventh'
          }, { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'downchordoctave',
            text: '8va',
            label:'8va',
            smoName: 'downchordoctave'
          }
        ]}]
    };
    return params;
  }
  const letterButtonFactory: getButtonsFcn = () => {
    const params: SuiButtonArrayParameters = {
      label: 'Pitches',
      rows: [{
        label: 'Pitches',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchA',
            text: 'A',
            label:'A',
            smoName: 'a'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchB',
            text: 'B',
            label:'B',
            smoName: 'b'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchC',
            text: 'C',
            label:'C',
            smoName: 'c'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchD',
            text: 'D',
            label:'D',
            smoName: 'd'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchE',
            text: 'E',
            label:'E',
            smoName: 'e'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchF',
            text: 'F',
            label:'F',
            smoName: 'f'
          },{ classes: 'icon collapseParent button-array repetext',
            control: 'SuiButtonArrayButton',
            icon: '',
            id: 'pitchG',
            text: 'G',
            label:'G',
            smoName: 'g'
          },
        ]
      }]
    };
    return params;
  }
  export class SuiIntervalButtonComponent extends SuiButtonArrayComponent {
    constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
      super(dialog, parameter, intervalButtonFactory);
    }
  }  
  export class SuiLetterButtonComponent extends SuiButtonArrayComponent {
    constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams, buttonFactory: getButtonsFcn) {
      super(dialog, parameter, letterButtonFactory);
    }
  }  
export class SuiPitchAdapter extends SuiComponentAdapter {
  static intervalUp = ['chordsecond', 'chordthird', 'chordfourth', 'chordfifth', 'chordsixth', 'chordseventh', 'chordoctave'];
  static intervalDown = ['downchordsecond', 'downchordthird', 'downchordfourth', 'downchordfifth', 'downchordsixth',
     'downchordseventh', 'downchordoctave'];
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view.groupUndo(true);
  }
  get transposeButtons() {
    return '';
  }
  set transposeButtons(value: string) {
    if (value === 'upOctave') {
      this.view.transposeScore(12);
    }
    if (value === 'downOctave') {
      this.view.transposeScore(-12);
    }
    if (value === 'upStep') {
      this.view.transposeScore(1);
    }
    if (value === 'downStep') {
      this.view.transposeScore(-1);
    }
    if (value === 'toggleEnharmonic') {
      this.view.toggleEnharmonic();  
    }
    if (value === 'toggleCourtesy') {
      this.view.toggleCourtesyAccidentals();
    }
  }
  get intervalButtons() {
    return '';
  }
  set intervalButtons(value: string) {
    const intervalUp = SuiPitchAdapter.intervalUp.indexOf(value);
    const intervalDown = SuiPitchAdapter.intervalDown.indexOf(value);
    if (intervalUp >= 0) {
      this.view.setInterval(intervalUp + 1);
    }
    if (intervalDown >= 0) {
      this.view.setInterval((intervalDown + 1) * -1);
    }
  }
  get pitchButtons() {
    return '';
  }
  set pitchButtons(value: string) {
    if (IsPitchLetter(value)) {
      this.view.setPitch(value);
    }
  }
  async cancel() {
    await this.view.undo();
  }
  async commit() {
  }
}
export class SuiPitchDialog extends SuiDialogAdapterBase<SuiPitchAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition = 
      {
        label: 'Pitch',
        elements:
          [{
            smoName: 'transposeButtons',
            control: 'SuiTransposeButtonComponent',
            label: 'Pitch and Transposition'
          }, {
            smoName: 'intervalButtons',
            control: 'SuiIntervalButtonComponent',
            label: 'Intervals'
          }, {
            smoName: 'pitchButtons',
            control: 'SuiLetterButtonComponent',
            label: 'Letter Names'
          }, {
            smoName: 'textMessage1',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use - = keys to move pitch up/down 1/2 step',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage2',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use _ (shift minus) + (shift = ) keys to move pitch up/down octaves',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage3',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use 2-8 on the keyboard for intervals (Shift for interval below)',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage4',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use a-g on the keyboard for notes with those letter names',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage5',
            control: 'SuiReadOnlyTextComponent',
            label: `Learn the keyboard shortcuts, they're much faster!`,
            classes: 'hide-input'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiPitchAdapter(parameters.view);
    super(SuiPitchDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
}