// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoBarline, SmoRepeatSymbol } from '../../smo/data/measureModifiers';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayMSComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';

const endingsButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Measure Endings',
    rows: [{
      label: 'Bar Lines',
      classes: 'pad-span',
      buttons: [
        {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text icon-end_rpt',
          id: 'endRepeat',
          label: 'end repeat',
          smoName: 'endRepeat'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text icon-start_rpt',
          id: 'startRepeat',
          label: 'start repeat',
          smoName: 'startRepeat'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text icon-end_bar',
          id: 'endBar',
          label: 'end barline',
          smoName: 'endBar'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text icon-end_bar',
          id: 'doubleBar',
          label: 'double barline',
          smoName: 'doubleBar'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text',
          id: 'noBar',
          label: 'no barline',
          smoName: 'noBar'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-smo ribbon-button-text icon-single_bar',
          id: 'singleBar',
          label: 'single bar',
          smoName: 'singleBar'
        }
      ]
    },
    { label: 'Repeat',
      classes: 'text-span',
          buttons: [
        {
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'DcAlCoda',
          label: 'DC Al Coda',
          smoName: 'DcAlCoda'
        }, {
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'DsAlCoda',
          label: 'DS Al Coda',
          smoName: 'DsAlCoda'
        }, {
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'ToCoda',
          label: 'to Coda',
          smoName: 'ToCoda'
        }]},  {      
          label: 'Text',
          classes: 'pad-span',
          buttons: [{
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'DcAlFine',
          label: 'DC Al Fine',
          smoName: 'DcAlFine'
        }, {
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'DsAlFine',
          label: 'DS Al Fine',
          smoName: 'DsAlFine'
        },{
          classes: 'icon collapseParent button-array repetext',
          control: 'SuiButtonArrayButton',
          icon: '',
          id: 'Fine',
          label: 'Fine',
          smoName: 'Fine'
        }]},  {      
          label: 'Repeat Symbols',
          classes: 'pad-span',
          buttons: [{ 
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-segno',
          id: 'Segno',
          label:'Segno',
          smoName: 'Segno'
        }, 
        {
          icon: 'icon-bravura icon-coda',
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          smoName: 'Coda',
          label: 'Coda',
          id: 'Coda'
        }
      ]
    }
    ]
  }
  return params;
}

export class SuiEndingsButtonComponent extends SuiButtonArrayMSComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter, endingsButtonFactory);
  }
}
export class SuiEndingsAdapter extends SuiComponentAdapter {
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view.groupUndo(true);
  }
  get ending() {
    return '';
  }
  set ending(value: string) {
    if (SmoBarline.barlines[value] === SmoBarline.barlines.endRepeat) {
      this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endRepeat);
    }
    if (SmoBarline.barlines[value] === SmoBarline.barlines.startRepeat) {
      this.view.setBarline(SmoBarline.positions.start, SmoBarline.barlines.startRepeat);
    }
    if (SmoBarline.barlines[value] === SmoBarline.barlines.singleBar) {
      this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.singleBar);
    }
    if (SmoBarline.barlines[value] === SmoBarline.barlines.doubleBar) {
      this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.doubleBar);
    }
    if (SmoBarline.barlines[value] === SmoBarline.barlines.endBar) {
      this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endBar);
    }
    if (SmoBarline.barlines[value] === SmoBarline.barlines.noBar) {
      this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.noBar);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.Coda) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Coda);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.ToCoda) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.ToCoda);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.Segno) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Segno);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.DsAlCoda) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlCoda);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.DcAlCoda) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlCoda);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.DsAlFine) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlFine);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.DcAlFine) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlFine);
    }
    if (SmoRepeatSymbol.symbols[value] === SmoRepeatSymbol.symbols.Fine) {
      this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Fine);
    }    
  }
  async commit() {    
  }
  async cancel() {
    await this.view.undo();
  }
  async remove() {
  }
}
export class SuiEndingsDialog extends SuiDialogAdapterBase<SuiEndingsAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
  //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition =
    {
      label: 'Measure Endings',
      elements:
        [{
          smoName: 'ending',
          control: 'SuiEndingsButtonComponent',
          label: 'Measure Endings'
        }],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiEndingsAdapter(parameters.view);
    super(SuiEndingsDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
  async changed() {
    this.view.undoTrackerMeasureSelections('endings dialog');
    await super.changed();
  }
}