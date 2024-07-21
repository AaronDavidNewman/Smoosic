// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayMSComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { ArticulationButtons } from '../buttons/articulation';
import { SuiButtonComponentParams } from './components/button';
import { SmoArticulation, SmoOrnament } from '../../smo/data/noteModifiers';

const ornamentButtonFactory: getButtonsFcn = () => {  
  const params: SuiButtonArrayParameters = {
    label: 'Ornaments and Articulations',
    rows: [{
      label: 'Articulations',
      classes: 'pad-span',
      buttons: [
        { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-fermataAbove',
          id: 'fermataAboveButton',
          label:'Fermata',
          smoName: 'fermataAboveButton'
        }, { classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text articulations-below icon-fermataBelow',
          id: 'fermataBelowButton',
          label:'Fermata',
          smoName: 'fermataButton'
        } , { classes: 'icon collapseParent button-array',
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
        }, {
        classes: 'icon collapseParent articulations-below button-array',
        control: 'SuiButtonArrayButton',
        icon: 'icon-bravura ribbon-button-text icon-articAccentBelow',
        id: 'accentButton',
        label:'Accent',
        smoName: 'accentBelowButton'
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
            id: 'turnButton',
            label:'Turn',
            smoName: 'turn'
          }, { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-ornamentTurnSlash',
            id: 'turnSlash',
            label:'Turn Inverted',
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
            id: 'scoopArrayButton',
            label:'Mordent Inverted',
            smoName: 'scoopButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFallLipShort',
            id: 'dropArrayButton',
            label:'Drop',
            smoName: 'dropButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFallRoughMedium',
            id: 'dropLongArrayButton',
            label:'Long Drop',
            smoName: 'dropLongButton'
          },  { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassDoitMedium',
            id: 'doitArrayButton',
            label:'Doit',
            smoName: 'doit'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassLiftMedium',
            id: 'doitLongArrayButton',
            label:'Lift/Long Doit',
            smoName: 'doitLongButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassFlip',
            id: 'flipArrayButton',
            label:'Flip',
            smoName: 'flipButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassSmear',
            id: 'smearArrayButton',
            label:'Smear',
            smoName: 'smearButton'
          }, {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassMuteClosed',
            id: 'muteClosed',
            label: 'Brass Mute Closed',
            smoName: 'plungerClosed'
          },  {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassMuteClosed',
            id: 'muteOpen',
            label: 'Brass Mute Open',
            smoName: 'plungerOpen'
          },  {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassMuteClosed',
            id: 'brassBend',
            label: 'Brass Bend',
            smoName: 'bend'
          }
        ]
      }
    ]
  }
  return params;
}

export class SuiOrnamentButtonComponent extends SuiButtonArrayMSComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter, ornamentButtonFactory);
  }
}
export class SuiOrnamentAdapter extends SuiComponentAdapter {
  static get ornamentIdMap(): Record<string, string> {
    return {
      accentButton: SmoArticulation.articulations.accent,
      tenutoButton: SmoArticulation.articulations.tenuto,
      staccatoButton: SmoArticulation.articulations.staccato,
      marcatoButton: SmoArticulation.articulations.marcato,
      pizzicatoButton: SmoArticulation.articulations.pizzicato,
      fermataButton: SmoArticulation.articulations.fermata,
      mordentButton: SmoOrnament.ornaments.mordent,
      mordentInvertedButton: SmoOrnament.ornaments.mordentInverted,
      trillButton: SmoOrnament.ornaments.trill,
      turnButton: SmoOrnament.ornaments.turn,
      turnInvertedButton: SmoOrnament.ornaments.turnInverted,
      breathButton: 'breath',
      caesuraButton: 'caesura',
      pedalOpenButton: 'pedalOpen',
      pedalClosedButton: 'pedalClosed',
      scoopButton: SmoOrnament.ornaments.scoop,
      dropButton: SmoOrnament.ornaments.fall_short,
      dropLongButton: SmoOrnament.ornaments.dropLong,
      doitButton: SmoOrnament.ornaments.doit,
      doitLongButton: SmoOrnament.ornaments.doitLong,
      flipButton: SmoOrnament.ornaments.flip,
      smearButton: SmoOrnament.ornaments.smear,
      muteOpen: SmoOrnament.ornaments.plungerOpen,
      muteClosed: SmoOrnament.ornaments.plungerClosed,
      bend: SmoOrnament.ornaments.bend
    };
  }
  static ornamentTypeToId(ot: string): string | null {
    const keys = Object.keys(SuiOrnamentAdapter.ornamentIdMap);
    for (let i = 0; i < keys.length; ++i) {
      const key = keys[i];
      if (ot === SuiOrnamentAdapter.ornamentIdMap[key]) {
        return key;
      }
    }
    return null;
  }
  static get constructors(): Record<string, string> {
    return {
      accentButton: 'SmoArticulation',
      tenutoButton: 'SmoArticulation',
      staccatoButton: 'SmoArticulation',
      marcatoButton: 'SmoArticulation',
      pizzicatoButton: 'SmoArticulation',
      fermataButton: 'SmoArticulation',
      mordentButton: 'SmoOrnament',
      mordentInvertedButton: 'SmoOrnament',
      trillButton: 'SmoOrnament',
      breathButton: 'SmoOrnament',
      pedalOpenButton: 'SmoOrnament',
      pedalClosedButton: 'SmoOrnament',
      caesuraButton: 'SmoOrnament',
      scoopButton: 'SmoOrnament',
      dropButton: 'SmoOrnament',
      dropLongButton: 'SmoOrnament',
      doitButton: 'SmoOrnament',
      doitLongButton: 'SmoOrnament',
      flipButton: 'SmoOrnament',
      smearButton: 'SmoOrnament',
      muteOpen: 'SmoOrnament',
      muteClosed: 'SmoOrnament',
      bend: 'SmoOrnament'
    };
  }  
  codes: string[] = [];
  setValues: Record<string, boolean> = {};
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    this.view.groupUndo(true);
    const ornamentConfig = ornamentButtonFactory();
    const setForAll: Record<string, number> = {};
    let notesCount = 0;
    selections.forEach((sel) => {
      const ornaments = sel.note!.getOrnaments();
      const articulations = sel.note!.getArticulations();
      notesCount += 1;
      ornaments.forEach((orn) => {
        if (!setForAll[orn.ornament]) {
          setForAll[orn.ornament] = 0;
        }
        setForAll[orn.ornament] = setForAll[orn.ornament] + 1;
      });
      articulations.forEach((art) => {
        if (!setForAll[art.articulation]) {
          setForAll[art.articulation] = 0;
        }
        setForAll[art.articulation] = setForAll[art.articulation] + 1;
      });
    });
    const keys = Object.keys(setForAll);
    keys.forEach((key) => {
      if (setForAll[key] === notesCount) {
        for (let i = 0; i < ornamentConfig.rows.length; ++i) {
          const btnId = SuiOrnamentAdapter.ornamentTypeToId(key);
          if (btnId) {
            this.setValues[btnId] = true;
            this.codes.push(btnId);
            break;
          }
        }
      }
    })
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