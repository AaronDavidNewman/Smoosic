// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SmoScore, SmoScoreInfo } from '../../smo/data/score';
import { SmoPageLayout, SmoLayoutManager, SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { FontPurpose } from '../../smo/data/score';
import { ViewMapEntry } from '../../render/sui/scoreView';
import { StaffCheckComponent } from './staffComponents';
import { FontInfo } from '../../smo/data/common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { DialogDefinitionOption, SuiDropdownComponent } from '../dialogComponents';

declare var $: any;

const deepCopy = (x: any) => JSON.parse(JSON.stringify(x));

// ## SuiScoreViewDialog
// decide which rows of the score to look at
export class SuiScoreViewDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Score View', elements:
        [{
          smoName: 'scoreView',
          parameterName: 'scoreView',
          control: 'StaffCheckComponent',
          label: 'Show staff',
        }],
      staticText: []
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiScoreViewDialog(parameters);
    dg.display();
  }
  viewChanged: boolean;
  originalValue: ViewMapEntry[];
  constructor(parameters: SuiDialogParams) {
    super(SuiScoreViewDialog.dialogElements, parameters);
    this.originalValue = JSON.parse(JSON.stringify(this.view.getView()));
    this.viewChanged = false;
  }
  get scoreViewCtrl() {
    return this.cmap.scoreViewCtrl as StaffCheckComponent;
  }
  display() {
    $('body').addClass('showAttributeDialog');
    this.applyDisplayOptions();
    this._bindElements();
    const currentView = this.view.getView();
    this.originalValue = JSON.parse(JSON.stringify(currentView));
    this.scoreViewCtrl.setValue(currentView);
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      if (this.viewChanged) {
        this.view.setView(this.scoreViewCtrl.getValue());
      }
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      if (this.viewChanged) {
        this.view.setView(this.originalValue);
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  changed() {
    this.viewChanged = true;
  }
}

// ## SuiGlobalLayoutDialog
// change editor and formatting defaults for this score.
export class SuiGlobalLayoutDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Global Settings', elements:
        [{
          smoName: 'noteSpacing',
          parameterName: 'noteSpacing',
          defaultValue: SmoLayoutManager.defaults.globalLayout.noteSpacing,
          control: 'SuiRockerComponent',
          dataType: 'percent',
          label: 'Note Spacing'
        }, {
          smoName: 'pageSize',
          parameterName: 'pageSize',
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
          parameterName: 'pageWidth',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageWidth,
          control: 'SuiRockerComponent',
          label: 'Page Width (px)'
        }, {
          smoName: 'pageHeight',
          parameterName: 'pageHeight',
          defaultValue: SmoLayoutManager.defaults.globalLayout.pageHeight,
          control: 'SuiRockerComponent',
          label: 'Page Height (px)'
        }, {
          smoName: 'zoomScale',
          parameterName: 'zoomScale',
          defaultValue: SmoLayoutManager.defaults.globalLayout.zoomScale,
          control: 'SuiRockerComponent',
          label: '% Zoom',
          dataType: 'percent'
        }, {
          smoName: 'svgScale',
          parameterName: 'svgScale',
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
  layoutChanged: boolean;
  score: SmoScore;
  modifier: SmoGlobalLayout;
  layoutBackup: SmoGlobalLayout;

  constructor(params: SuiDialogParams) {
    params.modifier = params.view.score.layoutManager!.getGlobalLayout();
    super(SuiGlobalLayoutDialog.dialogElements, { autobind: true, ...params });
    this.layoutChanged = false;
    this.score = this.view.score;
    this.modifier = this.score.layoutManager!.getGlobalLayout();
    this.layoutBackup = deepCopy(this.modifier);
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    this.initialValue();
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      if (this.layoutChanged) {
        this.view.renderer.rerenderAll();
      }
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      if (this.layoutChanged) {
        this.view.setGlobalLayout(this.layoutBackup);
        this.view.renderer.rerenderAll();
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  // ### _handlePageSizeChange
  // see if the dimensions have changed.
  _handlePageSizeChange() {
    const customSize = SmoScore.pageSizeFromDimensions(this.modifier.pageWidth, this.modifier.pageHeight) !== null;
    if (customSize) {
      $('.attributeModal').addClass('customPage');
    } else {
      $('.attributeModal').removeClass('customPage');
      if (this.cmap.pageWidthCtrl.changeFlag || this.cmap.pageWidthCtrl.changeFlag) {
        this.view.setGlobalLayout(this.modifier);
      }
    }
  }
  changed() {
    super.changed();
    if (this.cmap.pageSizeCtrl.changeFlag) {
      this._handlePageSizeChange();
    }
    this.view.setGlobalLayout(this.modifier);
  }
}

// ## SuiScoreIdentificationDialog
// change editor and formatting defaults for this score.
export class SuiScoreIdentificationDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
    {
      label: 'Score Preferences', elements:
        [{
          smoName: 'name',
          parameterName: 'name',
          defaultValue: '',
          control: 'TextCheckComponent',
          label: 'Score Name',
        }, {
          smoName: 'title',
          parameterName: 'title',
          defaultValue: '',
          control: 'TextCheckComponent',
          label: 'Title',
        }, {
          smoName: 'subTitle',
          parameterName: 'subTitle',
          control: 'TextCheckComponent',
          label: 'Sub Title',
        }, {
          smoName: 'composer',
          parameterName: 'composer',
          control: 'TextCheckComponent',
          label: 'Composer',
        }, {
          smoName: 'copyright',
          parameterName: 'copyright',
          defaultValue: SmoMeasureFormat.defaults.customProportion!,
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
  modifier: SmoScoreInfo;
  constructor(params: SuiDialogParams) {
    params.modifier = params.view.score.scoreInfo;
    super(SuiScoreIdentificationDialog.dialogElements, {
      autobind: true,
      ...params
    });
    this.modifier = params.modifier;
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    super.initialValue();
    this.applyDisplayOptions();
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.remove-button').remove();
  }
  changed() {
    super.changed();
  }
}
export class SuiScoreFontAdapter {
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
  view: SuiScoreViewOperations;
  constructor(view: SuiScoreViewOperations, fonts: FontPurpose[]) {
    this.fonts = fonts;
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
  set engravingFont(fontInfo: FontInfo) {
    this.changed = true;
    const fp = this.changeFont(SmoScore.fontPurposes.ENGRAVING, 'engraving', fontInfo);
    this.view.setEngravingFontFamily(fp.family);
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
  get engravingFont(): FontInfo {
    const font = this.fonts.find((ff) => ff.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (font) {
      return this.toInfo(font);
    }
    const ff = SuiScoreFontAdapter.defaultFont;
    ff.family = 'Bravura';
    ff.size = 38;
    return ff;
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
export class SuiScoreFontDialog extends SuiDialogBase {
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static dialogElements: DialogDefinition =
    {
      label: 'Score Fonts', elements:
        [{
          smoName: 'engravingFont',
          parameterName: 'engravingFont',
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
          parameterName: 'chordFont',
          classes: 'chord-font-component',
          defaultValue: 0,
          control: 'SuiFontComponent',
          label: 'Chord Font'
        }, {
          smoName: 'lyricFont',
          parameterName: 'lyricFont',
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
  fontBackup: FontPurpose[];
  modifier: SuiScoreFontAdapter;
  needRefresh: boolean;
  constructor(params: SuiDialogParams) {
    params.modifier = new SuiScoreFontAdapter(params.view, params.view.score.fonts);
    super(SuiScoreFontDialog.dialogElements, { autobind: true, ...params });
    this.modifier = params.modifier;
    this.fontBackup = JSON.parse(JSON.stringify(this.view.score.fonts));
    this.needRefresh = false;
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.modifier.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
}


export class SuiPageLayoutAdapter {
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
  changed : boolean = false;
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
    for (i = 0;i < this.backup.length; ++i) {
      this.view.setPageLayout(this.backup[i], i);
    }
  }

  constructor(view: SuiScoreViewOperations) {
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
export class SuiLayoutDialog extends SuiDialogBase {
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
          parameterName: 'applyToPage',
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
          parameterName: 'leftMargin',
          defaultValue: SmoPageLayout.defaults.leftMargin,
          control: 'SuiRockerComponent',
          label: 'Left Margin (px)'
        }, {
          smoName: 'rightMargin',
          parameterName: 'rightMargin',
          defaultValue: SmoPageLayout.defaults.rightMargin,
          control: 'SuiRockerComponent',
          label: 'Right Margin (px)'
        }, {
          smoName: 'topMargin',
          parameterName: 'topMargin',
          defaultValue: SmoPageLayout.defaults.topMargin,
          control: 'SuiRockerComponent',
          label: 'Top Margin (px)'
        }, {
          smoName: 'bottomMargin',
          parameterName: 'bottomMargin',
          defaultValue: SmoPageLayout.defaults.bottomMargin,
          control: 'SuiRockerComponent',
          label: 'Bottom Margin (px)'
        }, {
          smoName: 'interGap',
          parameterName: 'interGap',
          defaultValue: SmoPageLayout.defaults.interGap,
          control: 'SuiRockerComponent',
          label: 'Inter-System Margin'
        }, {
          smoName: 'intraGap',
          parameterName: 'intraGap',
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
  modifier: SuiPageLayoutAdapter;
  constructor(params: SuiDialogParams) {
    const modifier = new SuiPageLayoutAdapter(params.view);
    super(SuiLayoutDialog.dialogElements, params);
    this.modifier = modifier;
  }
  display() {
    this.applyDisplayOptions();
    if (this.modifier.enablePages === false) {
      $((this.cmap.applyToPageCtrl as SuiDropdownComponent)._getInputElement()).prop('disabled', true);
    }
    this._bindElements();
    this.initialValue();
  }
  _handleCancel() {
    this.modifier.cancel();
    this.complete();
  }
  _bindElements() {
    const self = this;
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      self.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      self._handleCancel();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  // ### changed
  // One of the components has had a changed value.
  changed() {
    super.changed();
  }
}
