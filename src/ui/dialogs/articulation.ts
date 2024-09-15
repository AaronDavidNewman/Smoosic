// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { getButtonsFcn, SuiButtonArrayMSComponent, SuiButtonArrayParameters } from './components/buttonArray';
import { SuiDialogNotifier, SuiBaseComponentParams } from './components/baseComponent';
import { SmoArticulation, SmoOrnament } from '../../smo/data/noteModifiers';
import { reverseStaticMap } from '../../smo/data/common';

const articulationButtonFactory: getButtonsFcn = () => {
  const params: SuiButtonArrayParameters = {
    label: 'Articulations',
    rows: [{
      label: 'Articulations',
      classes: 'pad-span',
      buttons: [
        {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-fermataBelow',
          id: 'fermataBelowButton',
          label: 'Fermata',
          smoName: 'fermataButton'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-articAccentBelow',
          id: 'accentButton',
          label: 'Accent',
          smoName: 'accentButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-articTenutoBelow',
          id: 'tenutoButton',
          label: 'Tenuto',
          smoName: 'tenutoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-articStaccatoBelow',
          id: 'staccatoButton',
          label: 'Staccato',
          smoName: 'staccatoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-mid icon-articMarcatoBelow',
          id: 'marcatoButton',
          label: 'Marcato',
          smoName: 'marcatoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-top icon-pluckedSnapPizzicatoBelow',
          id: 'pizzicatoButton',
          label: 'Pizzicato',
          smoName: 'pizzicatoButton'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-top icon-stringsDownBow',
          id: 'downBowButton',
          label: 'Down Bow',
          smoName: 'downBowButton'
        },  {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-top icon-stringsUpBow',
          id: 'upBowButton',
          label: 'Up Bow',
          smoName: 'upBowButton'
        }
      ]
    }
    ]
  }
  return params;
}

export class SuiArticulationButtonComponent extends SuiButtonArrayMSComponent {
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter, articulationButtonFactory);
  }
}
export class SuiArticulationAdapter extends SuiComponentAdapter {
  static get articulationIdMap(): Record<string, string> {
    return {
      accentButton: SmoArticulation.articulations.accent,
      tenutoButton: SmoArticulation.articulations.tenuto,
      staccatoButton: SmoArticulation.articulations.staccato,
      marcatoButton: SmoArticulation.articulations.marcato,
      pizzicatoButton: SmoArticulation.articulations.pizzicato,
      fermataButton: SmoArticulation.articulations.fermata,
      downBowButton: SmoArticulation.articulations.downStroke,
      upBowButton: SmoArticulation.articulations.upStroke
    };
  }
  static get articulationIdMapRvs(): Record<string, string> {
    return reverseStaticMap('SuiArticulationAdapter.articulationIdMap', SuiArticulationAdapter.articulationIdMap);
  }
  codes: string[] = [];
  positionCode: string = 'auto';
  setValues: Record<string, boolean> = {};
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    this.view.groupUndo(true);
    const setForAll: Record<string, number> = {};
    const positionForAll: Record<string, number> = {};
    let notesCount = 0;
    selections.forEach((sel) => {
      const articulations = sel.note!.getArticulations();
      notesCount += 1;
      articulations.forEach((art) => {
        if (!setForAll[art.articulation]) {
          setForAll[art.articulation] = 0;
        }
        if (!positionForAll[art.position]) {
          positionForAll[art.position] = 0;
        }
        positionForAll[art.position] += 1;
        setForAll[art.articulation] = setForAll[art.articulation] + 1;
      });
    });
    const keys = Object.keys(setForAll);
    keys.forEach((key) => {
      if (setForAll[key] === notesCount) {
        const btnId = SuiArticulationAdapter.articulationIdMapRvs[key];
        if (btnId) {
          this.setValues[btnId] = true;
          this.codes.push(btnId);
        }
      }      
    });
    if (typeof(positionForAll['above']) === 'number') {
      this.position = 'above;'
    }
    if (typeof(positionForAll['below']) === 'number') {
      this.position = 'below;'
    }
  }
  get position() {
    return this.positionCode;
  }
  set position(value: string) {
    this.positionCode = value;
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    selections.forEach((selection) => {
      const articulations = selection.note!.getArticulations();
      articulations.forEach((art) => {
        this.view.modifySelectionNoWait('articulation pos', selection, (score, sel) => {
          const nart = new SmoArticulation({ articulation: art.articulation, position: this.positionCode});
          sel.note!.setArticulation(art, false);
          sel.note!.setArticulation(nart, true);
        });
      });
    });
  }
  get articulations() {
    return this.codes;
  }
  set articulations(value: string[]) {
    this.codes = value;
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    const oldCodes = Object.keys(this.setValues);
    // for each selection
    selections.forEach((selection) => {
      const note = selection.note;
      // make sure any existing codes are set
      this.codes.forEach((code) => {
        const smoCode = SuiArticulationAdapter.articulationIdMap[code];
        this.setValues[code] = true;
        this.view.modifySelectionNoWait('articulation dialog', selection, (score, sel) => {
          sel.note!.setArticulation(new SmoArticulation({ articulation: smoCode }), true);
        });
        // only turn off the code if this value was set initially for all selections
      });
      oldCodes.forEach((oldCode) => {
        if (this.setValues[oldCode] && this.codes.indexOf(oldCode) < 0) {
          const smoCode = SuiArticulationAdapter.articulationIdMap[oldCode];
          const articulation = note!.getArticulation(smoCode);
          if (articulation) {
            this.view.modifySelectionNoWait('articulation dialog', selection, (score, sel) => {
                sel.note!.setArticulation(articulation, false);
            });
            this.setValues[oldCode] = false;
          }
        }
      });
    });
  }
  get textMessage() {
    return '';
  }
  set textMessage(value: string) {
    // ignore
  }
  async commit() {    
  }
  async cancel() {
    await this.view.undo();
  }
  async remove() {
  }
}
export class SuiArticulationDialog extends SuiDialogAdapterBase<SuiArticulationAdapter> {
  static get applyTo() {
    return {
      score: 0, selected: 1, remaining: 3
    };
  }
  // export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
  //| 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
  static dialogElements: DialogDefinition =
    {
      label: 'Articulations',
      elements:
        [{
          smoName: 'articulations',
          control: 'SuiArticulationButtonComponent',
          label: 'Articulations'
        }, {
          smoName: 'position',
          control: 'SuiDropdownComponent',
          label: 'Position',
          options: [
            {
              value: SmoArticulation.positions.above,
              label: 'Above'
            },             {
              value: SmoArticulation.positions.below,
              label: 'Below'
            },             {
              value: SmoArticulation.positions.auto,
              label: 'Auto'
            } 
          ]
        }, {
          smoName: 'textMessage',
          control: 'SuiTextInputComponent',
          label: 'Use keys h,i,j,k,l to toggle common articulations.',
          classes: 'hide-input'
        }],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiArticulationAdapter(parameters.view);
    super(SuiArticulationDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
  async changed() {
    this.view.undoTrackerMeasureSelections('articulation dialog');
    await super.changed();
  }

}