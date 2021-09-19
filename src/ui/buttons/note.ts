import { SuiButton, SuiButtonParams } from './button';
import { IsPitchLetter } from '../../smo/data/common';
declare var $: any;

export class NoteButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  setPitch() {
    if (this.buttonData.id === 'UpNoteButton') {
      this.view.transposeSelections(1);
    } else if (this.buttonData.id === 'DownNoteButton') {
      this.view.transposeSelections(-1);
    } else if (this.buttonData.id === 'UpOctaveButton') {
      this.view.transposeSelections(12);
    } else if (this.buttonData.id === 'DownOctaveButton') {
      this.view.transposeSelections(-12);
    } else if (this.buttonData.id === 'ToggleAccidental') {
      this.view.toggleEnharmonic();
    } else if (this.buttonData.id === 'ToggleCourtesy') {
      this.view.toggleCourtesyAccidentals();
    } else if (this.buttonData.id === 'ToggleRestButton') {
      this.view.makeRest();
    } else if (this.buttonData.id === 'ToggleSlashButton') {
      this.view.toggleSlash();
    } else if (this.buttonData.id === 'AddGraceNote') {
      this.view.addGraceNote();
    } else if (this.buttonData.id === 'SlashGraceNote') {
      this.view.slashGraceNotes();
    } else if (this.buttonData.id === 'RemoveGraceNote') {
      this.view.removeGraceNote();
    } else if (this.buttonData.id === 'XNoteHead') {
      this.view.setNoteHead('x2');
    } else if (this.buttonData.id === 'TriUpNoteHead') {
      this.view.setNoteHead('T2');
    } else if (this.buttonData.id === 'CircleXNoteHead') {
      this.view.setNoteHead('X3');
    } else if (this.buttonData.id === 'DiamondNoteHead') {
      this.view.setNoteHead('D2');
    } else {
      if (IsPitchLetter(this.buttonData.rightText)) {
        this.view.setPitch(this.buttonData.rightText);
      }
    }
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.setPitch();
    });
  }
}