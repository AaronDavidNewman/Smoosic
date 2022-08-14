// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreInfo, SmoScoreInfoKeys } from '../../smo/data/score';
import { SmoTextGroup, SmoTextGroupPurpose } from '../../smo/data/scoreText';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { TextCheckPair } from './components/textCheck';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiScoreIdentificationAdapter extends SuiComponentAdapter {
  scoreInfo: SmoScoreInfo;
  backup: SmoScoreInfo;
  current: Partial<Record<SmoTextGroupPurpose, TextCheckPair>> = {};
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.scoreInfo = this.view.score.scoreInfo;
    this.backup = JSON.parse(JSON.stringify(this.scoreInfo));
    (Object.keys(SmoTextGroup.purposes) as SmoTextGroupPurpose[]).forEach((purpose) => {
      const grp = this.view.score.textGroups.find((tg) => tg.purpose === SmoTextGroup.purposes[purpose]);
      if (grp) {
        this.current[purpose] = { checked: true, text: grp.textBlocks[0].text.text }
      } else {
        this.current[purpose] = { checked: false, text: '' }
      }
    });
  }
  updateValues(purpose: SmoTextGroupPurpose, infoKey: SmoScoreInfoKeys, value: TextCheckPair) {
    const grp = this.view.score.textGroups.find((tg) => tg.purpose === SmoTextGroup.purposes[purpose]);
    if (grp) {
      if (value.checked) {
        grp.textBlocks[0].text.text = value.text;
        this.view.updateTextGroup(grp, grp);
      } else {
        this.view.removeTextGroup(grp);
      }
    } else {
      if (value.checked) {
        const tg = SmoTextGroup.createTextForLayout(SmoTextGroup.purposes[purpose], value.text, this.view.score.layoutManager!.getScaledPageLayout(0));
        this.view.addTextGroup(tg);
      }
    }
    this.current[purpose] = value;
    this.scoreInfo[infoKey] = value.text;
  }
  get title(): TextCheckPair {
    return this.current.TITLE!;
  }
  set title(value: TextCheckPair) {
    this.updateValues('TITLE', 'title', value);
  }
  get subTitle(): TextCheckPair {
    return this.current.SUBTITLE!;
  }
  set subTitle(value: TextCheckPair) {
    this.updateValues('SUBTITLE', 'subTitle', value);
  }
  get composer(): TextCheckPair {
    return this.current.COMPOSER!;
  }
  set composer(value: TextCheckPair) {
    this.updateValues('COMPOSER', 'composer', value);
  }
  get copyright(): TextCheckPair {
    return this.current.COPYRIGHT!;
  }
  set copyright(value: TextCheckPair) {
    this.updateValues('COPYRIGHT', 'copyright', value);
  }
  get name() {
    return this.scoreInfo.name;
  }
  set name(value: string) {
    this.scoreInfo.name = value;
  }
  commit() {
    this.view.updateScoreInfo(this.scoreInfo);
  }
  cancel() {

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
          control: 'TextCheckComponent',
          label: 'Title',
        }, {
          smoName: 'subTitle',
          control: 'TextCheckComponent',
          label: 'Sub Title',
        }, {
          smoName: 'composer',
          control: 'TextCheckComponent',
          label: 'Composer',
        }, {
          smoName: 'copyright',
          control: 'TextCheckComponent',
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
