// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { ArticulationButtons } from '../buttons/articulation';
import { SuiButtonComponentParams } from './components/button';

const ornamentButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Ornaments and Articulations',
    rows: [{
      label: 'Articuations Above',
      classes: 'pad-span',
      buttons: [
        {classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-articAccentAbove',
          id: 'accentButton',
          label:'Accent',
          smoName: 'accentButton'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-articTenutoAbove',
          id: 'tenutoButton',
          label:'Tenuto',
          smoName: 'tenutoButton'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-articStaccatoAbove',
          id: 'staccatoButton',
          label:'Staccato',
          smoName: 'staccatoButton'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-articMarcatoAbove',
          id: 'marcatoButton',
          label:'Marcato',
          smoName: 'marcatoButton'
        }, { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-fermataAbove',
          id: 'fermataButton',
          label:'Fermata',
          smoName: 'fermataButton'
        }, { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-pluckedSnapPizzicatoAbove',
          id: 'pizzicatoButton',
          label:'Pizzicato',
          smoName: 'pizzicatoButton'
        },  { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-breathMarkComma',
          id: 'breathButton',
          label:'Breath Mark',
          smoName: 'breathButton'
        }, { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-caesura',
          id: 'caesuraButton',
          label:'Caesura',
          smoName: 'caesuraButton'
        }
      ]
      }, {
        label: 'Articuations Below',
        classes: 'pad-span',
        buttons: [{
        classes: 'icon collapseParent articulations-below button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text icon-articAccentBelow',
        id: 'accentButton',
        label:'Accent',
        smoName: 'accentButton'
      },  { classes: 'icon collapseParent button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text articulations-below icon-articTenutoBelow',
        id: 'tenutoButton',
        label:'Tenuto',
        smoName: 'tenutoButton'
      },  { classes: 'icon collapseParent button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text articulations-below icon-articStaccatoBelow',
        id: 'staccatoButton',
        label:'Staccato',
        smoName: 'staccatoButton'
      },  { classes: 'icon collapseParent button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text articulations-below icon-articMarcatoBelow',
        id: 'marcatoButton',
        label:'Marcato',
        smoName: 'marcatoButton'
      }, { classes: 'icon collapseParent button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text articulations-below icon-fermataBelow',
        id: 'fermataButton',
        label:'Fermata',
        smoName: 'fermataButton'
      }, { classes: 'icon collapseParent button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text articulations-below icon-pluckedSnapPizzicatoBelow',
        id: 'pizzicatoButton',
        label:'Pizzicato',
        smoName: 'pizzicatoButton'
      }
    ]
  },
     {
        label: 'Ornaments',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentTurnSlash',
            id: 'mordentInvertedButton',
            label:'Mordent Inverted',
            smoName: 'mordentInvertedButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentMordent',
            id: 'mordentButton',
            label:'Mordent',
            smoName: 'mordentButton'
          }, { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-ornamentTrill',
            id: 'trillButton',
            label:'Trill',
            smoName: 'trillButton'
          },  { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-ornamentTurn',
            id: 'turn',
            label:'Turn',
            smoName: 'turn'
          }, { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-ornamentTurnSlash',
            id: 'turnSlash',
            label:'Turn Slash',
            smoName: 'turnSlash'
          }
        ]
      },  {
        label: 'Jazz',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassScoop',
            id: 'scoopButton',
            label:'Mordent Inverted',
            smoName: 'scoopButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFallLipShort',
            id: 'dropButton',
            label:'Drop',
            smoName: 'dropButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFallRoughMedium',
            id: 'dropLongButton',
            label:'Long Drop',
            smoName: 'dropLongButton'
          },  { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassDoitMedium',
            id: 'doit',
            label:'Doit',
            smoName: 'doit'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassLiftMedium',
            id: 'doitLongButton',
            label:'Lift/Long Doit',
            smoName: 'doitLongButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFlip',
            id: 'flipButton',
            label:'Flip',
            smoName: 'flipButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassSmear',
            id: 'smearButton',
            label:'Smear',
            smoName: 'smearButton'
          }
        ]
      }
    ]
  }
  return params;
}
export class SuiOrnamentButtonComponent extends SuiButtonArrayComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter, ornamentButtonFactory);
  }
}
export class SuiOrnamentAdapter extends SuiComponentAdapter {
  selections: SmoSelection[];
  codes: string[] = [];
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.selections = SmoSelection.getMeasureList(this.view.tracker.selections);
  }
  get ornaments() {
    return this.codes;
  }
  set ornaments(value: string[]) {
    this.codes = value;
  }
  async commit() {
  }
  async cancel() {
  }
  async remove() { 
  }
}
export class SuiOrnamentDialog extends SuiDialogAdapterBase<SuiOrnamentAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition = 
      {
        label: 'Articulations and Ornaments',
        elements:
          [{
            smoName: 'ornaments',
            control: 'SuiOrnamentButtonComponent',
            label: 'Ornaments'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiOrnamentAdapter(parameters.view);
    super(SuiOrnamentDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
}