import {SuiButtonComposite } from './components/button';
import {  buildDom } from '../../common/htmlHelpers';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import {  SuiDialogNotifier, 
  SuiComponentParent, SuiBaseComponentParams } from './components/baseComponent';
export class SuiGraceNoteButtonsComponent extends SuiComponentParent {
  addGraceNoteBtn: SuiButtonComposite;
  removeGraceNoteBtn: SuiButtonComposite;
  slashGraceNoteBtn: SuiButtonComposite;

  constructor(dialog: SuiDialogNotifier, params: SuiBaseComponentParams) {
    super(dialog, params);
    this.addGraceNoteBtn = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'addGraceNote',
        smoName: 'addGraceNote',
        parentControl: this,
        icon: 'ribbon-button-text icon icon-smo icon-grace_note',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Add Grace Note',
        text: 'G'
      });
    this.removeGraceNoteBtn = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'removeGraceNote',
        smoName: 'removeGraceNote',
        parentControl: this,
        icon: 'ribbon-button-text icon icon-smo icon-grace_remove',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Remove Grace Note',
        text: 'alt-g'
      });
    this.slashGraceNoteBtn = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'slashGraceNote',
        smoName: 'slashGraceNote',
        parentControl: this,
        icon: 'ribbon-button-text icon icon-smo icon-grace_slash',
        classes: 'icon collapseParent button-hotkey',
        control: 'SuiButtonComponent',
        label: 'Slash Grace Note'
      });
  }
  getValue(): string {
    if (this.addGraceNoteBtn.changeFlag) {
      return this.addGraceNoteBtn.smoName;
    }
    if (this.removeGraceNoteBtn.changeFlag) {
      return this.removeGraceNoteBtn.smoName;
    }
    if (this.slashGraceNoteBtn.changeFlag) {
      return this.slashGraceNoteBtn.smoName;
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
    q.append(this.addGraceNoteBtn.html);
    q.append(this.removeGraceNoteBtn.html);
    q.append(this.slashGraceNoteBtn.html);
    return q;
  }
  bind() {
    this.addGraceNoteBtn.bind();
    this.removeGraceNoteBtn.bind();
    this.slashGraceNoteBtn.bind();
  }
}

export class SuiGraceNoteAdapter extends SuiComponentAdapter {
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view.groupUndo(true);
  }
  get modifyGraceNotes() {
    return '';
  }
  set modifyGraceNotes(value: string) {
    if (value === 'addGraceNote') {
      this.view.addGraceNote();
    }
    if (value === 'removeGraceNote') {
      this.view.removeGraceNote();
    }
    if (value === 'slashGraceNote') {
      this.view.slashGraceNotes();
    }
  }
  async commit() {
    await this.view.renderPromise();
  }
  async cancel() {
    await this.view.undo();
  }
}
export class SuiGraceNoteDialog extends SuiDialogAdapterBase<SuiGraceNoteAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Grace Notes',
      elements:
        [{
          smoName: 'modifyGraceNotes',
          control: 'SuiGraceNoteButtonsComponent',
          label: 'Add/Remove Grace notes'
        }, {
          smoName: 'textLabel',
          control: 'SuiReadOnlyTextComponent',
          label: 'Use hot keys shift-G to add grace notes, alt-g to remove.',
          classes: 'hide-input'
        }, {
          smoName: 'textLabelSelect',
          control: 'SuiReadOnlyTextComponent',
          label: 'Use hot key alt-l to select grace notes for pitches, durations',
          classes: 'hide-input'
        }],
      staticText: []
    };
    constructor(parameters: SuiDialogParams) {
      const adapter = new SuiGraceNoteAdapter(parameters.view);
      super(SuiGraceNoteDialog.dialogElements, { adapter, ...parameters });
      this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
    }
}


