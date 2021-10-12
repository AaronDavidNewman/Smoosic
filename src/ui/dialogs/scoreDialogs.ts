// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { FontInfo } from '../../smo/data/common';
import { SmoScore, SmoScoreInfo, FontPurpose, SmoScoreInfoKeys } from '../../smo/data/score';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { GlobalLayoutAttributes, SmoTextGroup, SmoPageLayout, SmoLayoutManager, SmoGlobalLayout, SmoTextGroupPurpose } from '../../smo/data/scoreModifiers';

import { ViewMapEntry } from '../../render/sui/scoreView';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { DialogDefinitionOption } from '../dialogComponents';
import { StaffCheckComponent, TextCheckPair } from './staffComponents';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

declare var $: any;

const deepCopy = (x: any) => JSON.parse(JSON.stringify(x));

export class SuiScoreViewAdapter extends SuiComponentAdapter {
  originalView: ViewMapEntry[];
  currentView: ViewMapEntry[];
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.currentView = this.view.getView();
    this.originalView = JSON.parse(JSON.stringify(this.currentView));
  }
  cancel() {
    const s1 = JSON.stringify(this.originalView);
    const s2 = JSON.stringify(this.currentView);
    if (s1 !== s2) {
      this.view.setView(this.originalView);
    }
  }
  commit() {
    const s1 = JSON.stringify(this.originalView);
    const s2 = JSON.stringify(this.currentView);
    if (s1 !== s2) {
      this.view.setView(this.currentView);
    }
  }
  get scoreView(): ViewMapEntry[] {
    return this.currentView;
  }
  set scoreView(value: ViewMapEntry[]) {
    this.currentView = value;
  }
}
// ## SuiScoreViewDialog
// decide which rows of the score to look at
export class SuiScoreViewDialog extends SuiDialogAdapterBase<SuiScoreViewAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Score View', elements:
        [{
          smoName: 'scoreView',
          control: 'StaffCheckComponent',
          label: 'Show staff',
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiScoreViewDialog(parameters);
    dg.display();
  }
  originalValue: number[];
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiScoreViewAdapter(parameters.view);
    super(SuiScoreViewDialog.dialogElements, { adapter, ...parameters });
    this.originalValue = JSON.parse(JSON.stringify(this.view.getView()));
  }
  get scoreViewCtrl() {
    return this.cmap.scoreViewCtrl as StaffCheckComponent;
  }
}

export class SuiGlobalLayoutAdapter extends SuiComponentAdapter {
  scoreLayout: SmoGlobalLayout;
  backup: SmoGlobalLayout;
  changed: boolean = false;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.scoreLayout = this.view.score.layoutManager!.globalLayout;
    this.backup = this.view.score.layoutManager!.getGlobalLayout();
    this.view = view;
  }
  writeValue(attr: GlobalLayoutAttributes, value: number) {
    this.scoreLayout[attr] = value;
    this.view.setGlobalLayout(this.scoreLayout)
    this.changed = true;
  }
  get noteSpacing() {
    return this.scoreLayout.noteSpacing;
  }
  set noteSpacing(value: number) {
    this.writeValue('noteSpacing', value);
  }
  get pageWidth() {
    return this.scoreLayout.pageWidth;
  }
  set pageWidth(value: number) {
    this.writeValue('pageWidth', value);
  }
  get pageHeight() {
    return this.scoreLayout.pageHeight;
  }
  set pageHeight(value: number) {
    this.writeValue('pageHeight', value);
  }
  get svgScale() {
    return this.scoreLayout.svgScale;
  }
  set svgScale(value: number) {
    this.writeValue('svgScale', value);
  }
  get zoomScale() {
    return this.scoreLayout.zoomScale;
  }
  set zoomScale(value: number) {
    this.writeValue('zoomScale', value);
  }
  get pageSize() {
    const sz = SmoScore.pageSizeFromDimensions(this.scoreLayout.pageWidth, this.scoreLayout.pageHeight);
    if (sz === null) {
      return 'custom';
    }
    return sz;
  }
  set pageSize(value: string) {
    if (value === 'custom') {
      return;
    }
    if (SmoScore.pageDimensions[value]) {
      const dims = SmoScore.pageDimensions[value];
      this.scoreLayout.pageWidth = dims.width;
      this.scoreLayout.pageHeight = dims.height;
    }
    this.view.setGlobalLayout(this.scoreLayout)
  }
  commit() { }
  cancel() {
    if (this.changed) {
      this.view.setGlobalLayout(this.backup);
    }
  }
}
// ## SuiGlobalLayoutDialog
// change editor and formatting defaults for this score.
export class SuiGlobalLayoutDialog extends SuiDialogAdapterBase<SuiGlobalLayoutAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Global Settings', elements:
        [{
          smoName: 'noteSpacing',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiRockerComponent',
          dataType: 'percent',
          label: 'Note Spacing'
        }, {
          smoName: 'pageSize',
          defaultValue: SmoScore.pageSizes[0],
          control: 'SuiDropdownComponent',
          label: 'Page Size',
          options: [
            {
              value: 'letter',
              label: 'Letter (Portrait)'
            }, {
              value: 'letterLandscape',
              label: 'Letter (Landscape)'
            }, {
              value: 'tabloid',
              label: 'Tabloid (11x17)'
            }, {
              value: 'A4',
              label: 'A4'
            }, {
              value: 'custom',
              label: 'Custom'
            }]
        }, {
          smoName: 'pageWidth',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageWidth,
          control: 'SuiRockerComponent',
          label: 'Page Width (px)'
        }, {
          smoName: 'pageHeight',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageHeight,
          control: 'SuiRockerComponent',
          label: 'Page Height (px)'
        }, {
          smoName: 'zoomScale',
          defaultValue: SmoLayoutManager.defaults.globalLayout.zoomScale,
          control: 'SuiRockerComponent',
          label: '% Zoom',
          dataType: 'percent'
        }, {
          smoName: 'svgScale',
          defaultValue: SmoLayoutManager.defaults.globalLayout.svgScale,
          control: 'SuiRockerComponent',
          label: '% Note size',
          dataType: 'percent'
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiGlobalLayoutDialog(parameters);
    dg.display();
  }
  get dimensionControls() {
    return [this.cmap.pageSizeCtrl, this.cmap.pageWidthCtrl, this.cmap.pageHeightCtrl];
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiGlobalLayoutAdapter(params.view);
    super(SuiGlobalLayoutDialog.dialogElements, { adapter, ...params });
  }
  changed() {
    super.changed();
    if (this.dimensionControls.find((x) => x.changeFlag)) {
      this.initialValue();
    }
  }
}

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


export class SuiPageLayoutAdapter extends SuiComponentAdapter {
  static get layoutTypes(): Record<string, number> {
    return {
      'all': -1,
      'remaining': -2,
      'page': -3
    }
  }
  layouts: SmoPageLayout[];
  backup: SmoPageLayout[] = [];
  currentPage: number;
  changed: boolean = false;
  currentLayout: SmoPageLayout;
  layoutManager: SmoLayoutManager;
  view: SuiScoreViewOperations
  applyTo: number = SuiPageLayoutAdapter.layoutTypes.all;
  options: DialogDefinitionOption[] = [];
  updateLayouts() {
    let i = 0;
    let startPage = this.currentPage;
    let endPage = this.layouts.length;
    if (this.applyTo === SuiPageLayoutAdapter.layoutTypes.page) {
      endPage = startPage;
    } else if (this.applyTo === SuiPageLayoutAdapter.layoutTypes.all) {
      startPage = 0;
    }
    for (i = startPage; i < endPage; ++i) {
      this.view.setPageLayout(this.currentLayout, i);
    }
    this.changed = true;
  }
  get enablePages() {
    return this.layouts.length > 1;
  }
  get applyToPage() {
    return this.applyTo;
  }
  set applyToPage(value: number) {
    this.applyTo = value;
    this.updateLayouts();
  }
  set leftMargin(value: number) {
    this.currentLayout.leftMargin = value;
    this.updateLayouts();
  }
  get leftMargin() {
    return this.currentLayout.leftMargin;
  }
  get rightMargin() {
    return this.currentLayout.rightMargin;
  }
  set rightMargin(value: number) {
    this.currentLayout.rightMargin = value;
    this.updateLayouts();
  }
  get topMargin() {
    return this.currentLayout.topMargin;
  }
  set topMargin(value) {
    this.currentLayout.topMargin = value;
    this.updateLayouts();
  }
  get bottomMargin() {
    return this.currentLayout.bottomMargin;
  }
  set bottomMargin(value) {
    this.currentLayout.bottomMargin = value;
    this.updateLayouts();
  }
  get interGap() {
    return this.currentLayout.interGap;
  }
  set interGap(value) {
    this.currentLayout.interGap = value;
    this.updateLayouts();
  }
  get intraGap() {
    return this.currentLayout.intraGap;
  }
  set intraGap(value) {
    this.currentLayout.intraGap = value;
    this.updateLayouts();
  }
  cancel() {
    let i = 0;
    if (!this.changed) {
      return;
    }
    for (i = 0; i < this.backup.length; ++i) {
      this.view.setPageLayout(this.backup[i], i);
    }
  }
  commit(){}

  constructor(view: SuiScoreViewOperations) {
    super(view);
    let i = 0;
    this.view = view;
    this.layoutManager = this.view.score.layoutManager!;
    this.currentPage = this.view.getFocusedPage();
    for (i = 0; i < this.layoutManager.pageLayouts.length; ++i) {
      this.backup.push(new SmoPageLayout(this.layoutManager.pageLayouts[i]));
    }
    for (i = 1; i < this.layoutManager.pageLayouts.length; ++i) {
      this.options.push({ value: i + 1, label: 'Page ' + (i + 1) });
    }
    this.layouts = this.layoutManager.getPageLayouts();
    this.currentLayout = this.layoutManager.pageLayouts[this.currentPage];
    if (this.layoutManager.pageLayouts.length === 1) {
      this.applyTo = SuiPageLayoutAdapter.layoutTypes.all;
    } else {
      if (this.currentPage >= 1) {
        this.applyTo = SuiPageLayoutAdapter.layoutTypes.remaining;
      } else {
        this.applyTo = SuiPageLayoutAdapter.layoutTypes.all;
      }
    }
  }
}
// ## SuiLayoutDialog
// The layout dialog has page-specific layout parameters
export class SuiLayoutDialog extends SuiDialogAdapterBase<SuiPageLayoutAdapter> {
  static get layoutParams() {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static dialogElements: DialogDefinition =
    {
      label: 'Page Layouts', elements:
        [{
          smoName: 'applyToPage',
          defaultValue: -1,
          control: 'SuiDropdownComponent',
          label: 'Apply to Page',
          dataType: 'int',
          options: [{
            value: -1,
            label: 'All'
          }, {
            value: -2,
            label: 'All Remaining'
          }, {
            value: 1,
            label: 'Page 1'
          }]
        }, {
          smoName: 'leftMargin',
          defaultValue: SmoPageLayout.defaults.leftMargin,
          control: 'SuiRockerComponent',
          label: 'Left Margin (px)'
        }, {
          smoName: 'rightMargin',
          defaultValue: SmoPageLayout.defaults.rightMargin,
          control: 'SuiRockerComponent',
          label: 'Right Margin (px)'
        }, {
          smoName: 'topMargin',
          defaultValue: SmoPageLayout.defaults.topMargin,
          control: 'SuiRockerComponent',
          label: 'Top Margin (px)'
        }, {
          smoName: 'bottomMargin',
          defaultValue: SmoPageLayout.defaults.bottomMargin,
          control: 'SuiRockerComponent',
          label: 'Bottom Margin (px)'
        }, {
          smoName: 'interGap',
          defaultValue: SmoPageLayout.defaults.interGap,
          control: 'SuiRockerComponent',
          label: 'Inter-System Margin'
        }, {
          smoName: 'intraGap',
          defaultValue: SmoPageLayout.defaults.intraGap,
          control: 'SuiRockerComponent',
          label: 'Intra-System Margin'
        }],
      staticText: [
        { all: 'Entire Score' },
        { remaining: 'Remaining Pages' },
        { current: 'Current Page' }
      ]
    };
  // ### createAndDisplay
  // static method to create the object and then display it.
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiLayoutDialog(parameters);
    dg.display();
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiPageLayoutAdapter(params.view);
    super(SuiLayoutDialog.dialogElements, { adapter, ...params });
  }

}
