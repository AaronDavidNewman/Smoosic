// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScorePreferences } from '../../smo/data/score';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';

declare var $: any;

const deepCopy = (x: any) => JSON.parse(JSON.stringify(x));

export class SuiScorePreferencesAdapter extends SuiComponentAdapter {
  preferences: SmoScorePreferences;
  backup: SmoScorePreferences;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.preferences = view.score.preferences;
    this.backup = JSON.parse(JSON.stringify(this.preferences));
  }
  get autoAdvance(): boolean {
    return this.preferences.autoAdvance;
  }
  set autoAdvance(value: boolean) {
    this.preferences.autoAdvance = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get autoPlay(): boolean {
    return this.preferences.autoPlay;
  }
  set autoPlay(value: boolean) {
    this.preferences.autoPlay = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get showPiano(): boolean {
    return this.preferences.showPiano;
  }
  set showPiano(value: boolean) {
    this.preferences.showPiano = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get defaultDupleDuration() {
    return this.preferences.defaultDupleDuration;
  }
  set defaultDupleDuration(value: number) {
    this.preferences.defaultDupleDuration = value;
    this.view.updateScorePreferences(this.preferences);
  }
  get defaultTripleDuration() {
    return this.preferences.defaultTripleDuration;
  }
  set defaultTripleDuration(value: number) {
    this.preferences.defaultTripleDuration = value;
    this.view.updateScorePreferences(this.preferences);
  }
  cancel() {
    const p1 = JSON.stringify(this.preferences);
    const p2 = JSON.stringify(this.backup);
    if (p1 !== p2) {
      this.view.updateScorePreferences(this.backup);
    }
  }
  commit() {
  }
}
export class SuiScorePreferencesDialog extends SuiDialogAdapterBase<SuiScorePreferencesAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Score Preferences',
      elements: [{
        smoName: 'autoAdvance',
        control: 'SuiToggleComponent',
        label: 'Auto-advance after pitch'
      }, {
        smoName: 'autoPlay',
        control: 'SuiToggleComponent',
        label: 'Auto-advance after pitch'
      }, {
        smoName: 'showPiano',
        control: 'SuiToggleComponent',
        label: 'Show Piano widget'
      }, {
        smoName: 'defaultDupleDuration',
        control: 'SuiDropdownComponent',
        label: 'Default Duration (even meter)',
        dataType: 'int',
        options: [{
          value: 4096,
          label: '1/4'
        }, {
          value: 2048,
          label: '1/8'
        }]
      }, {
        smoName: 'defaultTripleDuration',
        control: 'SuiDropdownComponent',
        label: 'Default Duration (triple meter)',
        dataType: 'int',
        options: [{
          value: 6188,
          label: 'dotted 1/4'
        }, {
          value: 2048,
          label: '1/8'
        }]
      }],
      staticText: []
    }
  // ### createAndDisplay
  // static method to create the object and then display it.
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiScorePreferencesDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiScorePreferencesAdapter(params.view);
    super(SuiScorePreferencesDialog.dialogElements, { adapter, ...params });
  }
}
