// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayMSComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { SmoOrnament } from '../../smo/data/noteModifiers';
import { reverseStaticMap } from '../../smo/data/common';

const ornamentButtonFactory: getButtonsFcn = () => {  
  const params: SuiButtonArrayParameters = {
    label: 'Ornaments',
    rows: [
     {
        label: 'Ornaments',
        classes: 'pad-span',
        buttons: [
          { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentShortTrill',
            id: 'mordentButton',
            label:'Mordent Inverted',
            smoName: 'mordentButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentMordent',
            id: 'mordentInvertedButton',
            label:'Mordent',
            smoName: 'mordentInvertedButton'
          }, { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentPrecompTrillSuffixDandrieu',
            id: 'prallUpButton',
            label:'Prall Up Trill',
            smoName: 'prallUpButton'
          },{ classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text articulations-above icon-ornamentPrecompTrillLowerSuffix',
            id: 'prallDownButton',
            label:'Prall Down Trill',
            smoName: 'prallDownButton'
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
            smoName: 'turnButton'
          }, { classes: 'icon collapseParent articulations-above button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-ornamentTurnSlash',
            id: 'turnSlash',
            label:'Turn Inverted',
            smoName: 'turnInvertedButton'
          },{
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-breathMarkComma',
            id: 'breathButton',
            label: 'Breath Mark',
            smoName: 'breathButton'
          }, {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-caesura',
            id: 'caesuraButton',
            label: 'Caesura',
            smoName: 'caesuraButton'
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
            id: 'dropLongButton',
            label:'Long Drop',
            smoName: 'dropLongButton'
          },  { classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassDoitMedium',
            id: 'doitArrayButton',
            label:'Doit',
            smoName: 'doitButton'
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
            smoName: 'muteClosed'
          },  {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassMuteOpen',
            id: 'muteOpen',
            label: 'Brass Mute Open',
            smoName: 'muteOpen'
          },  {
            classes: 'icon collapseParent button-array',
            control: 'SuiButtonArrayButton',
            icon: 'icon-bravura ribbon-button-text icon-brassBend',
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
      mordentButton: SmoOrnament.ornaments.mordent,
      mordentInvertedButton: SmoOrnament.ornaments.mordent_inverted,
      prallUpButton: SmoOrnament.ornaments.prallup,
      prallDownButton: SmoOrnament.ornaments.pralldown,
      trillButton: SmoOrnament.ornaments.trill,
      turnButton: SmoOrnament.ornaments.turn,
      turnInvertedButton: SmoOrnament.ornaments.turn_inverted,
      pedalOpenButton: SmoOrnament.ornaments.pedalOpen,
      pedalClosedButton: SmoOrnament.ornaments.pedalClosed,
      caesuraButton: SmoOrnament.ornaments.caesura,
      breathButton: SmoOrnament.ornaments.breath,
      scoopButton: SmoOrnament.ornaments.scoop,
      dropButton: SmoOrnament.ornaments.fall,
      dropLongButton: SmoOrnament.ornaments.fallLong,
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
  static get ornamentIdMapRvs(): Record<string, string> {
    return reverseStaticMap('SuiOrnamentAdapter.ornamentIdMap', SuiOrnamentAdapter.ornamentIdMap);
  }  
  codes: string[] = [];
  setValues: Record<string, boolean> = {};
  positionCode: string = 'auto';
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    this.view.groupUndo(true);
    const setForAll: Record<string, number> = {};
    let notesCount = 0;
    selections.forEach((sel) => {
      const ornaments = sel.note!.getOrnaments();
      notesCount += 1;
      ornaments.forEach((ornament) => {
        if (!setForAll[ornament.ornament]) {
          setForAll[ornament.ornament] = 0;
        }
        setForAll[ornament.ornament] = setForAll[ornament.ornament] + 1;
      });
    });
    const keys = Object.keys(setForAll);
    keys.forEach((key) => {
      if (setForAll[key] === notesCount) {
        const btnId = SuiOrnamentAdapter.ornamentIdMapRvs[key];
        if (btnId) {
          this.setValues[btnId] = true;
          this.codes.push(btnId);
        }
      }
    });
  }
  get ornaments() {
    return this.codes;
  }
  set ornaments(value: string[]) {
    this.codes = value;
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    const oldCodes = Object.keys(this.setValues);
    // for each selection
    selections.forEach((selection) => {
      const note = selection.note;
      // make sure any existing codes are set
      this.codes.forEach((code) => {
        const smoCode = SuiOrnamentAdapter.ornamentIdMap[code];
        this.setValues[code] = true;
        // only turn off the code if this value was set initially for all selections
        this.view.modifySelectionNoWait('ornament dialog', selection, (score, selection) => {
          selection.note!.setOrnament(new SmoOrnament({ ornament: smoCode }), true);
        });        
      });
      oldCodes.forEach((oldCode) => {
        if (this.setValues[oldCode] && this.codes.indexOf(oldCode) < 0) {
          const smoCode = SuiOrnamentAdapter.ornamentIdMap[oldCode];
          const ornament = note!.getOrnament(smoCode);
          if (ornament) {
            this.view.modifySelectionNoWait('ornament dialog', selection, (score, selection) => {
              selection.note!.setOrnament(ornament, false);
            });
            this.setValues[oldCode] = false;
          }
        }
      });
    });
  }
  async commit() {
  }
  async cancel() {
    this.view.undo();
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
        label: 'Ornaments',
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
  async changed() {
    this.view.undoTrackerMeasureSelections('ornament dialog');
    await super.changed();
  }
}