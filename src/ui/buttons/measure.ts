import { SuiButton, SuiButtonParams } from './button';
import { SmoBarline, SmoRepeatSymbol } from '../../smo/data/measureModifiers';
declare var $: any;


export class MeasureButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  endRepeat() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endRepeat);
  }
  startRepeat() {
    this.view.setBarline(SmoBarline.positions.start, SmoBarline.barlines.startRepeat);
  }
  singleBarStart() {
    this.view.setBarline(SmoBarline.positions.start, SmoBarline.barlines.singleBar);
  }
  singleBarEnd() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.singleBar);
  }
  doubleBar() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.doubleBar);
  }
  endBar() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endBar);
  }
  coda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Coda);
  }
  toCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.ToCoda);
  }
  segno() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Segno);
  }
  dsAlCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlCoda);
  }
  dcAlCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlCoda);
  }
  dsAlFine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlFine);
  }
  dcAlFine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlFine);
  }
  fine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Fine);
  }
  nthEnding() {
    this.view.addEnding();
  }
  handleEvent(event: any, method: string) {
    (this as any)[method]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, 'handleEvent', this.buttonData.id);
  }
}