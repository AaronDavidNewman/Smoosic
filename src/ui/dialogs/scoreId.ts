// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreInfo, SmoScoreInfoKeys } from '../../smo/data/score';
import { SmoTextGroup, SmoTextGroupPurpose } from '../../smo/data/scoreText';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { TextCheckPair } from './components/textCheck';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;

export class SuiScoreIdentificationAdapter extends SuiComponentAdapter {
  scoreInfo: SmoScoreInfo;
  backup: SmoScoreInfo;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.scoreInfo = this.view.score.scoreInfo;
    this.backup = JSON.parse(JSON.stringify(this.scoreInfo));
  }
  get title(): string {
    return this.scoreInfo.title;
  }
  set title(value: string) {
    this.scoreInfo.title = value;
  }
  get subTitle(): string {
    return this.scoreInfo.subTitle;
  }
  set subTitle(value: string) {
    this.scoreInfo.subTitle = value;
  }
  get composer(): string {
    return this.scoreInfo.composer;
  }
  set composer(value: string) {
    this.scoreInfo.composer = value;
  }
  get copyright(): string {
    return this.scoreInfo.copyright;
  }
  set copyright(value: string) {
    this.scoreInfo.copyright = value;
  }
  get name() {
    return this.scoreInfo.name;
  }
  set name(value: string) {
    this.scoreInfo.name = value;
  }
  async commit() {
    await this.view.updateScoreInfo(this.scoreInfo);
  }
  cancel() {
    return PromiseHelpers.emptyPromise();
  }
}
// ## SuiScoreIdentificationDialog
// change editor and formatting defaults for this score.
export class SuiScoreIdentificationDialog extends SuiDialogAdapterBase<SuiScoreIdentificationAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Score Preferences', elements:
        [{
          smoName: 'name',
          defaultValue: '',
          control: 'SuiTextInputComponent',
          label: 'Score Name',
        }, {
          smoName: 'title',
          defaultValue: '',
          control: 'SuiTextInputComponent',
          label: 'Title',
        }, {
          smoName: 'subTitle',
          control: 'SuiTextInputComponent',
          label: 'Sub Title',
        }, {
          smoName: 'composer',
          control: 'SuiTextInputComponent',
          label: 'Composer',
        }, {
          smoName: 'copyright',
          control: 'SuiTextInputComponent',
          label: 'Copyright'
        }],
      staticText: [
        { titleText: 'Title' },
        { subTitleText: 'Sub-title' },
        { copyrightText: 'Copyright' },
        { composerText: 'Composer' },
        { show: 'Show' }
      ]
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiScoreIdentificationDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiScoreIdentificationAdapter(params.view);
    super(SuiScoreIdentificationDialog.dialogElements, { adapter, ...params });
  }
}
