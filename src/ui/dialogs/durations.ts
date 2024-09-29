import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { buildDom } from '../../common/htmlHelpers';
import { SuiButtonComposite } from './components/button';
import { SuiComponentParent } from './components/baseComponent';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';

export class SuiDurationButtonComponent extends SuiComponentParent {
  growDurationComponent: SuiButtonComposite;
  lessDurationComponent: SuiButtonComposite;
  growDotComponent: SuiButtonComposite;
  lessDotComponent: SuiButtonComposite;
  constructor(dialog: SuiDialogNotifier, params: SuiBaseComponentParams) {
    super(dialog, params);
    this.growDurationComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'growDuration',
        smoName: 'growDuration',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-duration_grow',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Increase Duration',
        text: '.'
      });
    this.lessDurationComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'lessDuration',
        smoName: 'lessDuration',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-duration_less',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Decrease Duration',
        text: ','
      });
    this.growDotComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'growDot',
        smoName: 'growDot',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-duration_grow_dot',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Add Dot',
        text: '>'
      });
    this.lessDotComponent = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'lessDot',
        smoName: 'lessDot',
        parentControl: this,
        icon: 'icon-smo ribbon-button-text icon-duration_less_dot',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Remove Dot',
        text: '<'
      });
  }
  getValue(): string {
    if (this.growDurationComponent.changeFlag) {
      return this.growDurationComponent.smoName;
    }
    if (this.lessDurationComponent.changeFlag) {
      return this.lessDurationComponent.smoName;
    }
    if (this.growDotComponent.changeFlag) {
      return this.growDotComponent.smoName;
    }
    if (this.lessDotComponent.changeFlag) {
      return this.lessDotComponent.smoName;
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
    q.append(this.growDurationComponent.html);
    q.append(this.lessDurationComponent.html);
    q.append(this.growDotComponent.html);
    q.append(this.lessDotComponent.html);
    return q;
  }
  bind() {
    this.growDurationComponent.bind();
    this.lessDurationComponent.bind();
    this.lessDotComponent.bind();
    this.growDotComponent.bind();
  }
}

export class SuiDurationAdapter extends SuiComponentAdapter {
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view.groupUndo(true);
  }
  get durationButtons() {
    return '';
  }
  set durationButtons(value: string) {
    if (value === 'growDuration') {
      this.view.batchDurationOperation('doubleDuration');
    }
    if (value === 'lessDuration') {
      this.view.batchDurationOperation('halveDuration');
    }
    if (value === 'growDot') {
      this.view.batchDurationOperation('dotDuration');
    }
    if (value === 'lessDot') {
      this.view.batchDurationOperation('undotDuration');
    }
  }
  async cancel() {
    await this.view.undo();
  }
  async commit() {
  }
}
export class SuiDurationDialog extends SuiDialogAdapterBase<SuiDurationAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition = 
      {
        label: 'Duration',
        elements:
          [{
            smoName: 'durationButtons',
            control: 'SuiDurationButtonComponent',
            label: 'Note Duration'
          }, {
            smoName: 'textMessage4',
            control: 'SuiReadOnlyTextComponent',
            label: `Learn the keyboard shortcuts, they're much faster!`,
            classes: 'hide-input'
          }, {
            smoName: 'textMessage',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use , . to decrease/increase note length.',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage2',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use <> to add/remove dots.',
            classes: 'hide-input'
          }, {
            smoName: 'textMessage3',
            control: 'SuiReadOnlyTextComponent',
            label: 'Use shift+arrow navigation keys to select notes',
            classes: 'hide-input'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiDurationAdapter(parameters.view);
    super(SuiDurationDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
}