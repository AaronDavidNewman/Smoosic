// ## SuiLayoutDialog
// The layout dialog has page layout and zoom logic.  It is not based on a selection but score-wide
// eslint-disable-next-line no-unused-vars
class SuiLayoutDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLayoutDialog';
  }
  get ctor() {
    return SuiLayoutDialog.ctor;
  }

  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static get dialogElements() {
    SuiLayoutDialog._dialogElements = SuiLayoutDialog._dialogElements ? SuiLayoutDialog._dialogElements :
      [
        {
          smoName: 'pageSize',
          parameterName: 'pageSize',
          defaultValue: SmoScore.pageSizes.letter,
          control: 'SuiDropdownComponent',
          label: 'Page Size',
          options: [
            {
              value: 'letter',
              label: 'Letter'
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
          smoName: 'orientation',
          parameterName: 'orientation',
          defaultValue: SmoScore.orientations.portrait,
          control: 'SuiDropdownComponent',
          label: 'Orientation',
          dataType: 'int',
          options: [{
            value: SmoScore.orientations.portrait,
            label: 'Portrait'
          }, {
            value: SmoScore.orientations.landscape,
            label: 'Landscape'
          }]
        }, {
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
          }
          ]
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
        },
        { staticText: [
          { label: 'Score Layout' }
        ] }
      ];

    return SuiLayoutDialog._dialogElements;
  }

  // ### backupOriginal
  // backup the original layout parameters for trial period
  backupOriginal() {
    this.backup = JSON.parse(JSON.stringify(this.modifier));
  }
  display() {
    $('body').addClass('showAttributeDialog');
    this.components.forEach((component) => {
      component.bind();
    });
    this.components.forEach((component) => {
      var val = this.modifier[component.parameterName];
      component.setValue(val);
    });
    this._setPageSizeDefault();
    this._bindElements();

    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.icon-move'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
    this.completeNotifier.unbindKeyboardForModal(this);

    const box = svgHelpers.boxPoints(250, 250, 1, 1);
    SuiDialogBase.position(box, this.dgDom, this.tracker.scroller);
  }
  // ### _updateLayout
  // even if the layout is not changed, we re-render the entire score by resetting
  // the svg context.
  _updateLayout() {
    this.layout.rerenderAll();
  }
  _handleCancel() {
    this.layout.score.layout = this.backup;
    this._updateLayout();
    this.complete();
  }
  _bindElements() {
    const self = this;
    const dgDom = this.dgDom;
    this.bindKeyboard();
    this._bindComponentNames();
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      // TODO:  allow user to select a zoom mode.
      self.layout.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
      self._updateLayout();
      self.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      self._handleCancel();
    });

    $(dgDom.element).find('.remove-button').remove();
  }
  _setPageSizeDefault() {
    var value = 'custom';
    var scoreDims = this.layout.score.layout;
    SmoScore.pageSizes.forEach((sz) => {
      var dim = SmoScore.pageDimensions[sz];
      if (scoreDims.pageWidth === dim.width && scoreDims.pageHeight === dim.height) {
        value = sz;
      } else if (scoreDims.pageHeight === dim.width && scoreDims.pageWidth === dim.height) {
        value = sz;
      }
    });
    this.components.find((x) => x.parameterName === 'pageSize').setValue(value);
  }
  // ### _handlePageSizeChange
  // see if the dimensions have changed.
  _handlePageSizeChange() {
    const pageSizeComp = this.components.find((x) => x.parameterName === 'pageSize');
    const sel = pageSizeComp.getValue();
    if (sel === 'custom') {
      $('.attributeModal').addClass('customPage');
    } else {
      $('.attributeModal').removeClass('customPage');
      const dim = SmoScore.pageDimensions[sel];
      const hComp = this.components.find((x) =>  x.parameterName === 'pageHeight');
      const wComp = this.components.find((x) => x.parameterName === 'pageWidth');
      hComp.setValue(dim.height);
      wComp.setValue(dim.width);
    }
  }

  // ### changed
  // One of the components has had a changed value.
  changed() {
    this._handlePageSizeChange();
    this.components.forEach((component) => {
      if (typeof(this.layout.score.layout[component.smoName]) !== 'undefined') {
        this.layout.score.layout[component.smoName] = component.getValue();
      }
    });
    if (this.engravingFontCtrl.changeFlag)  {
      const engrave = this.score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
      engrave.family = this.engravingFontCtrl.getValue();
      SuiRenderState.setFont(engrave.family);
    }
    this.layout.setViewport();
  }

  // ### createAndDisplay
  // static method to create the object and then display it.
  static createAndDisplay(parameters) {
    const dg = new SuiLayoutDialog(parameters);
    dg.display();
  }
  constructor(parameters) {
    var p = parameters;
    super(SuiLayoutDialog.dialogElements, {
      id: 'dialog-layout',
      top: (p.layout.score.layout.pageWidth / 2) - 200,
      left: (p.layout.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.layout = p.layout;
    this.score = p.layout.score;
    this.modifier = this.layout.score.layout;
    this.backupOriginal();
  }
}
