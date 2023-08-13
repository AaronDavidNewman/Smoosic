// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { FontInfo } from '../../smo/data/common';
import { SmoScore, FontPurpose, isEngravingFont } from '../../smo/data/score';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';

declare var $: any;
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
  async cancel() {
    if (this.changed) {
      this.fonts = this.backups;
      // This takes advantage of setter/getter side-effect
      this.engravingFont = this.engravingFont;
      this.lyricFont = this.lyricFont;
      this.chordFont = this.chordFont;
    }
    return PromiseHelpers.emptyPromise()
  }
  async commit() {
    return PromiseHelpers.emptyPromise();
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
    if (isEngravingFont(fp.family)) {
      this.view.setEngravingFontFamily(fp.family);
    }
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
