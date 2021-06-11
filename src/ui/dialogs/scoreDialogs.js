// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## SuiScoreViewDialog
// decide which rows of the score to look at
// eslint-disable-next-line no-unused-vars
class SuiScoreViewDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiScoreViewDialog';
  }
  get ctor() {
    return SuiScoreViewDialog.ctor;
  }
  static get dialogElements() {
    SuiScoreViewDialog._dialogElements = typeof(SuiScoreViewDialog._dialogElements) !== 'undefined' ? SuiScoreViewDialog._dialogElements :
      [{
        smoName: 'scoreView',
        parameterName: 'scoreView',
        defaultValue: [],
        control: 'StaffCheckComponent',
        label: 'Show staff',
      }, {
        staticText: [
          { label: 'Score View' }
        ]
      }];
    return SuiScoreViewDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiScoreViewDialog(parameters);
    dg.display();
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
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
  constructor(parameters) {
    var p = parameters;
    super(SuiScoreViewDialog.dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.viewChanged = false;
  }
}

// ## SuiScorePreferencesDialog
// change editor and formatting defaults for this score.
// eslint-disable-next-line no-unused-vars
class SuiScorePreferencesDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiScorePreferencesDialog';
  }
  get ctor() {
    return SuiScorePreferencesDialog.ctor;
  }
  static get dialogElements() {
    SuiScorePreferencesDialog._dialogElements = typeof(SuiScorePreferencesDialog._dialogElements)
      !== 'undefined' ? SuiScorePreferencesDialog._dialogElements :
      [{
        smoName: 'scoreName',
        parameterName: 'scoreName',
        defaultValue: [],
        control: 'SuiTextInputComponent',
        label: 'Score Name',
      }, {
        smoName: 'autoPlay',
        parameterName: 'autoPlay',
        defaultValue: [],
        control: 'SuiToggleComponent',
        label: 'Play Selections',
      }, {
        smoName: 'autoAdvance',
        parameterName: 'autoAdvance',
        defaultValue: [],
        control: 'SuiToggleComponent',
        label: 'Auto-Advance Cursor',
      }, {
        smoName: 'noteSpacing',
        parameterName: 'noteSpacing',
        defaultValue: SmoScore.defaults.layout.noteSpacing,
        control: 'SuiRockerComponent',
        type: 'percent',
        label: 'Note Spacing'
      }, {
        smoName: 'pageSize',
        parameterName: 'pageSize',
        defaultValue: SmoScore.pageSizes.letter,
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
        defaultValue: SmoScore.defaults.layout.pageWidth,
        control: 'SuiRockerComponent',
        label: 'Page Width (px)'
      }, {
        smoName: 'pageHeight',
        parameterName: 'pageHeight',
        defaultValue: SmoScore.defaults.layout.pageHeight,
        control: 'SuiRockerComponent',
        label: 'Page Height (px)'
      }, {
        smoName: 'zoomScale',
        parameterName: 'zoomScale',
        defaultValue: SmoScore.defaults.layout.zoomScale,
        control: 'SuiRockerComponent',
        label: '% Zoom',
        type: 'percent'
      }, {
        smoName: 'svgScale',
        parameterName: 'svgScale',
        defaultValue: SmoScore.defaults.layout.svgScale,
        control: 'SuiRockerComponent',
        label: '% Note size',
        type: 'percent'
      }, {
        staticText: [
          { label: 'Global Settings' }
        ]
      }];
    return SuiScorePreferencesDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiScorePreferencesDialog(parameters);
    dg.display();
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    this.scoreNameCtrl.setValue(this.view.score.scoreInfo.name);
    this.autoPlayCtrl.setValue(this.view.score.preferences.autoPlay);
    this.autoAdvanceCtrl.setValue(this.view.score.preferences.autoAdvance);
    this.noteSpacingCtrl.setValue(this.globalLayout.noteSpacing);
    this.zoomScaleCtrl.setValue(this.globalLayout.zoomScale);
    this.svgScaleCtrl.setValue(this.globalLayout.svgScale);
    this._setPageSizeDefault();
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
    const sel = this.pageSizeCtrl.getValue();
    if (sel === 'custom') {
      $('.attributeModal').addClass('customPage');
    } else {
      $('.attributeModal').removeClass('customPage');
      const dim = SmoScore.pageDimensions[sel];
      this.pageHeightCtrl.setValue(dim.height);
      this.pageWidthCtrl.setValue(dim.width);
    }
  }
  _setPageSizeDefault() {
    let value = 'custom';
    const scoreDims = this.globalLayout;
    SmoScore.pageSizes.forEach((sz) => {
      const dim = SmoScore.pageDimensions[sz];
      if (scoreDims.pageWidth === dim.width && scoreDims.pageHeight === dim.height) {
        value = sz;
      } else if (scoreDims.pageHeight === dim.width && scoreDims.pageWidth === dim.height) {
        value = sz;
      }
    });
    this.pageSizeCtrl.setValue(value);
    this._handlePageSizeChange();
  }

  changed() {
    if (this.scoreNameCtrl.changeFlag) {
      const newInfo = JSON.parse(JSON.stringify(this.view.score.scoreInfo));
      newInfo.name = this.scoreNameCtrl.getValue();
      this.view.updateScoreInfo(newInfo);
      return;
    }
    if (this.pageSizeCtrl.changeFlag) {
      this._handlePageSizeChange();
    }
    if (this.autoPlayCtrl.changeFlag) {
      this.view.score.preferences.autoPlay = this.autoPlayCtrl.getValue();
    }
    if (this.autoAdvanceCtrl.changeFlag) {
      this.view.score.preferences.autoAdvance = this.autoAdvanceCtrl.getValue();
    }
    if (this.noteSpacingCtrl.changeFlag) {
      this.layoutChanged = true;
      this.globalLayout.noteSpacing = this.noteSpacingCtrl.getValue();
    }
    if (this.zoomScaleCtrl.changeFlag) {
      this.layoutChanged = true;
      this.globalLayout.zoomMode = SmoScore.zoomModes.zoomScale;
      this.globalLayout.zoomScale = this.zoomScaleCtrl.getValue();
    }
    if (this.svgScaleCtrl.changeFlag) {
      this.layoutChanged = true;
      this.globalLayout.svgScale = this.svgScaleCtrl.getValue();
    }
    if (this.layoutChanged) {
      this.view.setGlobalLayout(this.globalLayout);
    }
    this.view.updateScorePreferences();
  }
  constructor(parameters) {
    var p = parameters;
    super(SuiScorePreferencesDialog.dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.layoutChanged = false;
    this.score = this.view.score;
    this.globalLayout = this.score.layoutManager.getGlobalLayout();
    this.layoutBackup = JSON.parse(JSON.stringify(this.globalLayout));
  }
}

// ## SuiScorePreferencesDialog
// change editor and formatting defaults for this score.
// eslint-disable-next-line no-unused-vars
class SuiScoreIdentificationDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiScoreIdentificationDialog';
  }
  get ctor() {
    return SuiScoreIdentificationDialog.ctor;
  }
  static get dialogElements() {
    SuiScoreIdentificationDialog._dialogElements = typeof(SuiScoreIdentificationDialog._dialogElements)
      !== 'undefined' ? SuiScoreIdentificationDialog._dialogElements :
      [{
        smoName: 'title',
        parameterName: 'title',
        defaultValue: '',
        control: 'TextCheckComponent',
        label: 'Title',
      }, {
        smoName: 'subTitle',
        parameterName: 'subTitle',
        defaultValue: [],
        control: 'TextCheckComponent',
        label: 'Sub Title',
      }, {
        smoName: 'composer',
        parameterName: 'composer',
        defaultValue: [],
        control: 'TextCheckComponent',
        label: 'Composer',
      }, {
        smoName: 'copyright',
        parameterName: 'copyright',
        defaultValue: SmoScore.defaults.preferences.customProportion,
        control: 'TextCheckComponent',
        label: 'Copyright'
      }, {
        staticText: [
          { label: 'Score Preferences' },
          { titleText: 'Title' },
          { subTitleText: 'Sub-title' },
          { copyrightText: 'Copyright' },
          { composerText: 'Composer' },
          { show: 'Show' }
        ]
      }];
    return SuiScoreIdentificationDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiScoreIdentificationDialog(parameters);
    dg.display();
  }
  _setInitialValues() {
    const titleText = this.score.getTextGroups().find((tg) => tg.purpose === SmoTextGroup.purposes.TITLE);
    const subText = this.score.getTextGroups().find((tg) => tg.purpose === SmoTextGroup.purposes.SUBTITLE);
    const composerText = this.score.getTextGroups().find((tg) => tg.purpose === SmoTextGroup.purposes.COMPOSER);
    const copyrightText = this.score.getTextGroups().find((tg) => tg.purpose === SmoTextGroup.purposes.COPYRIGHT);
    this.titleCtrl.setValue({ text: this.scoreInfo.title, checked: titleText !== null });
    this.subTitleCtrl.setValue({ text: this.scoreInfo.subTitle, checked: subText !== null });
    this.composerCtrl.setValue({ text: this.scoreInfo.composer, checked: composerText !== null });
    this.copyrightCtrl.setValue({ text: this.scoreInfo.copyright, checked: copyrightText !== null });
  }
  _createText(purpose, text) {
    const existing = this.score.getTextGroups().find((tg) => tg.purpose === purpose);
    if (existing) {
      const copy = SmoTextGroup.deserialize(existing.serialize());
      copy.attrs.id = existing.attrs.id;
      copy.firstBlock().text = text;
      this.view.updateTextGroup(existing, copy);
      return;
    }
    const tg = SmoTextGroup.createTextForLayout(purpose, text, this.score.layout);
    this.view.addTextGroup(tg);
  }
  _removeText(purpose) {
    const existing = this.score.getTextGroups().find((tg) => tg.purpose === purpose);
    if (existing) {
      this.view.removeTextGroup(existing);
    }
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    this._setInitialValues();
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
    const params = [
      { control: 'titleCtrl', purpose: SmoTextGroup.purposes.TITLE, scoreField: 'title' },
      { control: 'subTitleCtrl', purpose: SmoTextGroup.purposes.SUBTITLE, scoreField: 'subTitle' },
      { control: 'composerCtrl', purpose: SmoTextGroup.purposes.COMPOSER, scoreField: 'composer' },
      { control: 'copyrightCtrl', purpose: SmoTextGroup.purposes.COPYRIGHT, scoreField: 'copyright' },
    ];
    params.forEach((param) => {
      if (this[param.control].changeFlag) {
        const val = this[param.control].getValue();
        if (val.checked === true) {
          this._createText(param.purpose, val.text);
        } else {
          this._removeText(param.purpose, val.text);
        }
        const scoreInfo = JSON.parse(JSON.stringify(this.scoreInfo));
        scoreInfo.name = scoreInfo.title;
        scoreInfo[param.scoreField] = val.text;
        this.view.updateScoreInfo(scoreInfo);
        this.scoreInfo = this.score.scoreInfo;
      }
    });
  }
  constructor(parameters) {
    var p = parameters;
    super(SuiScoreIdentificationDialog.dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.startPromise = p.startPromise;
    this.scoreInfo = this.view.score.scoreInfo;
    this.score = this.view.score;
  }
}

// eslint-disable-next-line no-unused-vars
class SuiScoreFontDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiScoreFontDialog';
  }
  get ctor() {
    return SuiScoreFontDialog.ctor;
  }
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static get dialogElements() {
    SuiScoreFontDialog._dialogElements = typeof(SuiScoreFontDialog._dialogElements) !== 'undefined' ? SuiScoreFontDialog._dialogElements :
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
      }, {
        staticText: [
          { label: 'Score Fonts' }
        ]
      }];
    return SuiScoreFontDialog._dialogElements;
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    $('body').addClass('showAttributeDialog');
    this.applyDisplayOptions();
    this._bindElements();
    const engraving = this.fontBackup.find((ff) => ff.purpose === SmoScore.fontPurposes.ENGRAVING);
    const chords = this.fontBackup.find((ff) => ff.purpose === SmoScore.fontPurposes.CHORDS);
    const lyrics = this.fontBackup.find((ff) => ff.purpose === SmoScore.fontPurposes.LYRICS);
    this.engravingFontCtrl.setValue(engraving.family);
    this.chordFontCtrl.setValue(chords);
    this.lyricFontCtrl.setValue(lyrics);
  }
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._handleCancel();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  _handleCancel() {
    if (this.needRefresh) {
      const engrave = this.fontBackup.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
      const chords = this.fontBackup.find((ff) => ff.purpose === SmoScore.fontPurposes.CHORDS);
      const lyrics = this.fontBackup.find((ff) => ff.purpose === SmoScore.fontPurposes.LYRICS);
      this.view.setEngravingFontFamily(engrave.family);
      this.chordFontCtrl.setValue(chords);
      this.lyricFontCtrl.setValue(lyrics);
      this.view.renderer.rerenderAll();
    }
    this.complete();
  }
  changed() {
    if (this.engravingFontCtrl.changeFlag)  {
      this.needRefresh = true;
      this.view.setEngravingFontFamily(this.engravingFontCtrl.getValue());
      this.view.renderer.rerenderAll();
    }
    if (this.chordFontCtrl.changeFlag) {
      this.needRefresh = true;
      this.view.setChordFont(this.chordFontCtrl.getValue());
      this.view.renderer.rerenderAll();
    }
    if (this.lyricFontCtrl.changeFlag) {
      this.needRefresh = true;
      this.view.setLyricFont(this.lyricFontCtrl.getValue());
      this.view.renderer.rerenderAll();
    }
  }
  static createAndDisplay(parameters) {
    const dg = new SuiScoreFontDialog(parameters);
    dg.display();
  }

  constructor(parameters) {
    var p = parameters;
    super(SuiScoreFontDialog.dialogElements, {
      id: 'dialog-scorefont',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.score = p.view.score;
    this.fontBackup = JSON.parse(JSON.stringify(this.score.fonts));
    this.startPromise = p.startPromise;
    this.needRefresh = false;
  }
}
// ## SuiLayoutDialog
// The layout dialog has page-specific layout parameters
// eslint-disable-next-line no-unused-vars
class SuiLayoutDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLayoutDialog';
  }
  get ctor() {
    return SuiLayoutDialog.ctor;
  }
  static get layoutParams() {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static get dialogElements() {
    SuiLayoutDialog._dialogElements = typeof(SuiLayoutDialog._dialogElements) !== 'undefined' ? SuiLayoutDialog._dialogElements :
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
        defaultValue: SmoScore.defaults.layout.leftMargin,
        control: 'SuiRockerComponent',
        label: 'Left Margin (px)'
      }, {
        smoName: 'rightMargin',
        parameterName: 'rightMargin',
        defaultValue: SmoScore.defaults.layout.rightMargin,
        control: 'SuiRockerComponent',
        label: 'Right Margin (px)'
      }, {
        smoName: 'topMargin',
        parameterName: 'topMargin',
        defaultValue: SmoScore.defaults.layout.topMargin,
        control: 'SuiRockerComponent',
        label: 'Top Margin (px)'
      }, {
        smoName: 'bottomMargin',
        parameterName: 'bottomMargin',
        defaultValue: SmoScore.defaults.layout.topMargin,
        control: 'SuiRockerComponent',
        label: 'Bottom Margin (px)'
      }, {
        smoName: 'interGap',
        parameterName: 'interGap',
        defaultValue: SmoScore.defaults.layout.interGap,
        control: 'SuiRockerComponent',
        label: 'Inter-System Margin'
      }, {
        smoName: 'intraGap',
        parameterName: 'intraGap',
        defaultValue: SmoScore.defaults.layout.intraGap,
        control: 'SuiRockerComponent',
        label: 'Intra-System Margin'
      }, {
        staticText: [
          { label: 'Page Layouts' }
        ]
      }];
    return SuiLayoutDialog._dialogElements;
  }

  // ### backupOriginal
  // backup the original layout parameters for trial period
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }

  display() {
    this.applyDisplayOptions();
    this.focusedPage = this.view.getFocusedPage();
    // Set the control that says which pages this dialog will apply to
    if (this.layoutManager.pageLayouts.length === 1) {
      this.applyToPageCtrl.setValue(-1);  // 1 page, applies to all
      $(this.applyToPageCtrl._getInputElement()).prop('disabled', true);
    } else {
      if (this.focusedPage >= 1) {
        this.applyToPageCtrl.setValue(-2); // apply to subsequent
      } else {
        this.applyToPageCtrl.setValue(-1); // apply to all
      }
    }
    // Get the initial values from the currently focused page
    const pl = this.layoutManager.pageLayouts[this.focusedPage];
    SuiLayoutDialog.layoutParams.forEach((attr) => {
      const ctrlName = attr + 'Ctrl';
      this[ctrlName].setValue(pl[attr]);
    });
    this._bindElements();
  }
  _handleCancel() {
    this.backup.forEach((page, pageIx) => {
      this.view.setPageLayout(page, pageIx);
    });
    this.complete();
  }
  _bindElements() {
    const self = this;
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      // TODO:  allow user to select a zoom mode.
      self.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      self._handleCancel();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  _pagesFromCtrl() {
    const ap = this.applyToPageCtrl.getValue();
    const pages = this.layoutManager.pageLayouts.length;
    if (ap === -1) {
      return [...Array(pages)].map((v, i) => i);
    } else if (ap === -2) {
      return [...Array(pages - this.focusedPage)].map((v, i) => this.focusedPage + i);
    }
    return [ap - 1];
  }

  // ### changed
  // One of the components has had a changed value.
  changed() {
    const pages = this._pagesFromCtrl();
    pages.forEach((page) => {
      const pl = this.layoutManager.getPageLayout(page);
      SuiLayoutDialog.layoutParams.forEach((param) => {
        const ctrl = param + 'Ctrl';
        if (this.applyToPageCtrl.changeFlag) {
          this[ctrl].setValue(pl[param]);
        } else {
          if (this[ctrl].changeFlag) {
            pl[param] = this[ctrl].getValue();
          }
        }
      });
      this.view.setPageLayout(pl, page);
    });
  }

  // ### createAndDisplay
  // static method to create the object and then display it.
  static createAndDisplay(parameters) {
    const dg = new SuiLayoutDialog(parameters);
    dg.display();
  }
  constructor(parameters) {
    const p = parameters;
    const dialogElements = JSON.parse(JSON.stringify(SuiLayoutDialog.dialogElements));
    let i = 1;
    const score = p.view.score;
    const pageCtrl = dialogElements.find((pp) => pp.smoName === 'applyToPage');
    for (i = 1; i < score.layoutManager.pageLayouts.length; ++i) {
      pageCtrl.options.push({ value: i + 1, label: 'Page ' + (i + 1) });
    }
    super(dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.score = score;
    this.layoutManager = this.score.layoutManager;
    this.backup = this.layoutManager.getPageLayouts();
  }
}
