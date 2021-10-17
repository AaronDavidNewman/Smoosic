// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { FontInfo } from '../../smo/data/common';
import { SmoScore, SmoScoreInfo, FontPurpose, SmoScoreInfoKeys, SmoScorePreferences } from '../../smo/data/score';
import { SmoTextGroup, SmoPageLayout, SmoLayoutManager, SmoTextGroupPurpose } from '../../smo/data/scoreModifiers';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { DialogDefinitionOption } from './components/baseComponent';
import { TextCheckPair } from './components/textCheck';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

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
export class SuiScoreFontAdapter extends SuiComponentAdapter {
  fonts: FontPurpose[];
  backups: FontPurpose[];
  changed: boolean = false;
  static get defaultFont(): FontInfo {
    return {
      family: 'Merriweather',
      size: 14,
      weight: 'normal',
      style: 'normal'
    };
  }
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.fonts = this.view.score.fonts;
    this.backups = JSON.parse(JSON.stringify(this.fonts));
    this.view = view;
  }
  cancel() {
    if (this.changed) {
      this.fonts = this.backups;
      // This takes advantage of setter/getter side-effect
      this.engravingFont = this.engravingFont;
      this.lyricFont = this.lyricFont;
      this.chordFont = this.chordFont;
    }
  }
  commit() {
  }
  changeFont(purpose: number, name: string, fontInfo: FontInfo): FontPurpose {
    const fp: FontPurpose = {
      name,
      purpose,
      family: fontInfo.family,
      size: fontInfo.size,
      custom: false
    };
    const fonts: FontPurpose[] = this.fonts.filter((ff) => ff.purpose !== purpose);
    fonts.push(fp);
    this.fonts = fonts;
    this.changed = true;
    return fp;
  }

  toInfo(fontPurpose: FontPurpose): FontInfo {
    return {
      weight: 'normal',
      style: 'normal',
      ...fontPurpose
    };
  }
  getInfo(purpose: number): FontInfo {
    const font = this.fonts.find((ff) => ff.purpose === purpose);
    if (font) {
      return this.toInfo(font);
    }
    return SuiScoreFontAdapter.defaultFont;
  }
  // Only family can be editor for engraving font, so parameter is just a string
  get engravingFont(): string {
    const font = this.fonts.find((ff) => ff.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (font) {
      return this.toInfo(font).family;
    }
    return 'Bravura';
  }
  set engravingFont(value: string) {
    this.changed = true;
    const current = this.getInfo(SmoScore.fontPurposes.ENGRAVING);
    current.family = value;
    const fp = this.changeFont(SmoScore.fontPurposes.ENGRAVING, 'engraving', current);
    this.view.setEngravingFontFamily(fp.family);
  }
  set chordFont(fontInfo: FontInfo) {
    const fp = this.changeFont(SmoScore.fontPurposes.CHORDS, 'chords', fontInfo);
    this.view.setChordFont(this.toInfo(fp));

    this.changed = true;
  }
  get chordFont(): FontInfo {
    return this.getInfo(SmoScore.fontPurposes.CHORDS);
  }
  set lyricFont(fontInfo: FontInfo) {
    this.changed = true;
    const fp = this.changeFont(SmoScore.fontPurposes.LYRICS, 'lyrics', fontInfo);
    this.view.setLyricFont(this.toInfo(fp));
  }
  get lyricFont(): FontInfo {
    return this.getInfo(SmoScore.fontPurposes.LYRICS);
  }
}
export class SuiScoreFontDialog extends SuiDialogAdapterBase<SuiScoreFontAdapter> {
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static dialogElements: DialogDefinition =
    {
      label: 'Score Fonts', elements:
        [{
          smoName: 'engravingFont',
          defaultValue: SmoScore.engravingFonts.Bravura,
          control: 'SuiDropdownComponent',
          label: 'Engraving Font',
          options: [{
            value: 'Bravura',
            label: 'Bravura'
          }, {
            value: 'Gonville',
            label: 'Gonville'
          }, {
            value: 'Petaluma',
            label: 'Petaluma'
          }, {
            value: 'Leland',
            label: 'Leland'
          }]
        }, {
          smoName: 'chordFont',
          classes: 'chord-font-component',
          defaultValue: 0,
          control: 'SuiFontComponent',
          label: 'Chord Font'
        }, {
          smoName: 'lyricFont',
          classes: 'lyric-font-component',
          defaultValue: 0,
          control: 'SuiFontComponent',
          label: 'Lyric Font'
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiScoreFontDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiScoreFontAdapter(params.view);
    super(SuiScoreFontDialog.dialogElements, { adapter, ...params });
    this.modifier = params.modifier;
  }
}
