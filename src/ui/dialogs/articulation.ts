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
          icon: 'icon-bravura ribbon-button-text articulations-below icon-fermataBelow',
          id: 'fermataBelowButton',
          label: 'Fermata',
          smoName: 'fermataButton'
        },  {
          classes: 'icon collapseParent articulations-below button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text icon-articAccentBelow',
          id: 'accentButton',
          label: 'Accent',
          smoName: 'accentButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text articulations-below icon-articTenutoBelow',
          id: 'tenutoButton',
          label: 'Tenuto',
          smoName: 'tenutoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text articulations-below icon-articStaccatoBelow',
          id: 'staccatoButton',
          label: 'Staccato',
          smoName: 'staccatoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text articulations-below icon-articMarcatoBelow',
          id: 'marcatoButton',
          label: 'Marcato',
          smoName: 'marcatoButton'
        }, {
          classes: 'icon collapseParent button-array',
          control: 'SuiButtonArrayButton',
          icon: 'icon-bravura ribbon-button-text articulations-below icon-pluckedSnapPizzicatoBelow',
          id: 'pizzicatoButton',
          label: 'Pizzicato',
          smoName: 'pizzicatoButton'
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
      mordentButton: SmoOrnament.ornaments.mordent,
      mordentInvertedButton: SmoOrnament.ornaments.mordentInverted,
      trillButton: SmoOrnament.ornaments.trill,
      turnButton: SmoOrnament.ornaments.turn,
      turnInvertedButton: SmoOrnament.ornaments.turnInverted,
      breathButton: 'breath',
      caesuraButton: 'caesura',
      pedalOpenButton: 'pedalOpen',
      pedalClosedButton: 'pedalClosed'
    };
  }
  static get articulationIdMapRvs(): Record<string, string> {
    return reverseStaticMap('SuiArticulationAdapter.articulationIdMap', SuiArticulationAdapter.articulationIdMap);
  }
  codes: string[] = [];
  setValues: Record<string, boolean> = {};
  constructor(view: SuiScoreViewOperations) {
    super(view);
    const selections = this.view.tracker.selections.filter((ss) => ss.note);
    this.view.groupUndo(true);
    const setForAll: Record<string, number> = {};
    let notesCount = 0;
    selections.forEach((sel) => {
      const articulations = sel.note!.getArticulations();
      notesCount += 1;
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
        const btnId = SuiArticulationAdapter.articulationIdMapRvs[key];
        if (btnId) {
          this.setValues[btnId] = true;
          this.codes.push(btnId);
        }
      }
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
        // only turn off the code if this value was set initially for all selections
        note!.setArticulation(new SmoArticulation({ articulation: smoCode }), true);
      });
      oldCodes.forEach((oldCode) => {
        if (this.setValues[oldCode] && this.codes.indexOf(oldCode) < 0) {
          const smoCode = SuiArticulationAdapter.articulationIdMap[oldCode];
          const articulation = note!.getArticulation(smoCode);
          if (articulation) {
            note!.setArticulation(articulation, false);
            this.setValues[oldCode] = false;
          }
        }
      });
    });
    this.view.syncDialogSelections('articulation dialog');
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
        }],
      staticText: []
    };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiArticulationAdapter(parameters.view);
    super(SuiArticulationDialog.dialogElements, { adapter, ...parameters });
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS', 'HIDEREMOVE'];
  }
}