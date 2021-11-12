import { SuiButton, SuiButtonParams } from './button';
import { SmoInstrument } from '../../smo/data/staffModifiers';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { Clef } from '../../smo/data/common';

declare var $: any;

export class StaveButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  addClef(clef: Clef, clefName: string) {
    var instrument: SmoInstrument = new SmoInstrument(SmoInstrument.defaults);
    instrument.instrumentName = clefName;
    instrument.keyOffset = 0;
    instrument.clef = clef;
    this.view.changeInstrument(instrument, this.view.tracker.selections);
  }
  clefTreble() {
    this.addClef('treble', 'Treble Instrument');
  }
  clefBass() {
    this.addClef('bass', 'Bass Instrument');
  }
  clefAlto() {
    this.addClef('alto', 'Alto Instrument');
  }
  clefTenor() {
    this.addClef('tenor', 'Tenor Instrument');
  }
  clefPercussion() {
    this.addClef('percussion', 'Tenor Instrument');
  }
  _clefMove(index: number) {
    this.view.moveStaffUpDown(index);
  }
  clefMoveUp() {
    this._clefMove(-1);
  }
  clefMoveDown() {
    this._clefMove(1);
  }
  bind() {
    const self = this;
    $(this.buttonElement).off('click').on('click', () => {
      const id = self.buttonData.id;
      if (typeof ((this as any)[id]) === 'function') {
        (this as any)[id]();
      }
    });
  }
}