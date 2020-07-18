// # Dialog base classes

// ## SuiModifierDialogFactory
// Automatic dialog constructors for dialogs without too many parameters
// that operated on a selection.
class SuiModifierDialogFactory {

  static createDialog(modifier, parameters) {
    var dbType = SuiModifierDialogFactory.modifierDialogMap[modifier.attrs.type];
      if (dbType === 'SuiLyricDialog' && modifier.parser === SmoLyric.parsers.chord) {
        dbType = 'SuiChordChangeDialog';
      }
      var ctor = eval(dbType);
      if (!ctor) {
      console.warn('no dialog for modifier ' + modifier.type);
      return;
    }
    return ctor.createAndDisplay({
    modifier: modifier,
        ...parameters
    });
  }
  static get modifierDialogMap() {
    return {
      SmoStaffHairpin: 'SuiHairpinAttributesDialog',
      SmoSlur: 'SuiSlurAttributesDialog',
      SmoDynamicText: 'SuiDynamicModifierDialog',
      SmoVolta: 'SuiVoltaAttributeDialog',
      SmoScoreText: 'SuiTextTransformDialog',
      SmoLoadScore:  'SuiLoadFileDialog',
      SmoLyric:'SuiLyricDialog'
    };
  }
}

// ## SuiDialogBase
// Base class for dialogs.
class SuiDialogBase {
    // ### SuiDialogBase ctor
    // Creates the DOM element for the dialog and gets some initial elements
  constructor(dialogElements, parameters) {
    this.id = parameters.id;
    this.boundKeyboard = false;
    this.components = [];

    console.log('creating close dialog promise in SuiDialogBase');
    this.closeDialogPromise = new Promise((resolve, reject) => {
      $('body').off('dialogDismiss').on('dialogDismiss', function () {
          console.log('dialog dismiss DOM event received, resolve closeDialogPromise');
          resolve();
      });
    });

    this.label = eval(this.ctor)['label'];
    if (!this.label) {
      throw('dialog ' + this.ctor+ ' needs a label');
    }

    this.initialLeft = parameters.left
    this.initialTop = parameters.top;

    // If this dialog was spawned by a menu, wait for the menu to dismiss
    // before continuing.
    this.startPromise = parameters.closeMenuPromise;
    this.eventSource = parameters.eventSource;
    this.layout = parameters.layout;
    this.context = this.layout.context;
    this.dialogElements = dialogElements;
    this.tracker = parameters.tracker;
    this.completeNotifier = parameters.completeNotifier;
    this.undoBuffer = parameters.undoBuffer;
    this.editor = parameters.editor;

    var top = parameters.top - this.tracker.scroller.netScroll.y;
    var left = parameters.left - this.tracker.scroller.netScroll.x;

    this.dgDom = this._constructDialog(dialogElements, {
      id: 'dialog-' + this.id,
      top: top,
      left: left,
      label: this.label
    });

    SmoTranslator.registerDialog(this.ctor);
  }

  // ### printXlate
  // print json with string labels to use as a translation file seed.
  static printTranslate(_class) {
    var output = [];
    var xx = eval(_class);
    xx['dialogElements'].forEach((element) => {
      var component = {};
      if (element.label) {
        component.label = element.label;
        component.id = element.smoName;
        if (element.options) {
          component.options = [];

          element.options.forEach((option) => {
            component.options.push({value:option.value,label:option.label})
          });
        }
      }
      output.push(component);
    });
    return {ctor:xx['ctor'],label:xx['label'],dialogElements:output};
  }

  get closeModalPromise() {
    return this.closeDialogPromise;
  }

  // ### position
  // For dialogs based on selections, tries to place the dialog near the selection and also
  // to scroll so the dialog is in view
  static position(box,dgDom,scroller) {
    var y = (box.y + box.height) - scroller.netScroll.y;

  	// TODO: adjust if db is clipped by the browser.
    var dge = $(dgDom.element).find('.attributeModal');
    var dgeHeight = $(dge).height();
    var maxY =  $('.musicRelief').height();
    var maxX = $('.musicRelief').width();

    var offset = dgeHeight + y > window.innerHeight ? (dgeHeight + y) -  window.innerHeight : 0;
    y = (y < 0) ? -y : y - offset;

    y = (y > maxY || y < 0) ? maxY / 2 : y;

  	$(dge).css('top', '' + y + 'px');

    var x = box.x - scroller.netScroll.x;
    var w = $(dge).width();
    x = (x > window.innerWidth /2)  ? x - (w+25) : x + (w+25);

    x = (x < 0 || x > maxX) ? maxX/2 : x;
    $(dge).css('left', '' + x + 'px');
  }

    // ### position
    // Position the dialog near a selection.  If the dialog is not visible due
    // to scrolling, make sure it is visible.
  position(box) {
    SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);
  }
    // ### build the html for the dialog, based on the instance-specific components.
  _constructDialog(dialogElements, parameters) {
  var id = parameters.id;
  var b = htmlHelpers.buildDom;
  var r = b('div').classes('attributeModal').attr('id','attr-modal-'+id)
      .css('top', parameters.top + 'px').css('left', parameters.left + 'px')
  .append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move jsDbMove')))
  .append(b('h2').text(parameters.label));

    var ctrl = b('div').classes('smoControlContainer');
  dialogElements.forEach((de) => {
  var ctor = eval(de.control);
  var control = new ctor(this, de);
  this.components.push(control);
  ctrl.append(control.html);
  });
    r.append(ctrl);
  r.append(
  b('div').classes('buttonContainer').append(
  b('button').classes('ok-button button-left').text('OK')).append(
  b('button').classes('cancel-button button-center').text('Cancel')).append(
  b('button').classes('remove-button button-right').text('Remove').append(
  b('span').classes('icon icon-cancel-circle'))));
  $('.attributeDialog').html('');

  $('.attributeDialog').append(r.dom());

  var trapper = htmlHelpers.inputTrapper('.attributeDialog');
  $('.attributeDialog').find('.cancel-button').focus();
  return {
  element: $('.attributeDialog'),
  trapper: trapper
  };
  }

  // ### _commit
  // generic logic to commit changes to a momdifier.
  _commit() {
    this.modifier.restoreOriginal();
    this.components.forEach((component) => {
      this.modifier[component.smoName] = component.getValue();
    });
  }

     // ### Complete
     // Dialogs take over the keyboard, so release that and trigger an event
     // that the dialog is closing that can resolve any outstanding promises.
  complete() {
    if (this.boundKeyboard) {
      this.eventSource.unbindKeydownHandler(this.keydownHandler);
    }
  $('body').removeClass('showAttributeDialog');
    console.log('dialog complete method called, triggering dialog close');
  $('body').trigger('dialogDismiss');
  this.dgDom.trapper.close();
  }

    // ### _bindComponentNames
    // helper method to give components class names based on their static configuration
  _bindComponentNames() {
    this.components.forEach((component) => {
  var nm = component.smoName + 'Ctrl';
      this[nm] = component;
  });
  }

   // ### display
   // make3 the modal visible.  bind events and elements.
  display() {
  $('body').addClass('showAttributeDialog');
  this.components.forEach((component) => {
  component.bind();
  });
  this._bindElements();
    if (this.modifier && this.modifier.renderedBox) {
      this.position(this.modifier.renderedBox);
    }
    this.tracker.scroller.scrollVisibleBox(
        svgHelpers.smoBox($(this.dgDom.element)[0].getBoundingClientRect())
    );

  var cb = function (x, y) {}
  htmlHelpers.draggable({
  parent: $(this.dgDom.element).find('.attributeModal'),
  handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
  cb: cb,
  moveParent: true
  });
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
    if (evdata.key == 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
      return;
    }
    return;
  }

  // ### bindKeyboard
  // generic logic to grab keyboard elements for modal
  bindKeyboard() {
      this.boundKeyboard = true;
      this.keydownHandler = this.eventSource.bindKeydownHandler(this,'evKey');
  }

   // ### _bindElements
   // bing the generic controls in most dialogs.
  _bindElements() {
  var self = this;
  var dgDom = this.dgDom;
        this.bindKeyboard();

  $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
  self._commit();
  self.complete();
  });

  $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
  self.modifier.restoreOriginal();
  self.complete();
  });
  $(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
  self.handleRemove();
  self.complete();
  });
  }
}


// ## SuiLayoutDialog
// The layout dialog has page layout and zoom logic.  It is not based on a selection but score-wide
class SuiLayoutDialog extends SuiDialogBase {

  static get ctor() {
    return 'SuiLayoutDialog';
  }
  get ctor() {
    return SuiLayoutDialog.ctor;
  }
  static get label() {
    SuiLayoutDialog._label = SuiLayoutDialog._label ? SuiLayoutDialog._label :
       'Score Layout';
    return SuiLayoutDialog._label;
  }
  static set label(value) {
    SuiLayoutDialog._label = value;
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
        label:'Page Size',
        options: [{
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
            }
          ]
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
          dataType:'int',
          options:[{
              value:SmoScore.orientations.portrait,
              label:'Portrait'
            }, {
              value:SmoScore.orientations.landscape,
              label:'Landscape'
          }]
        }, {
          smoName: 'engravingFont',
          parameterName: 'engravingFont',
          defaultValue: SmoScore.engravingFonts.Bravura,
          control: 'SuiDropdownComponent',
          label:'Engraving Font',
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
        },{
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
        }
      ];

    return SuiLayoutDialog._dialogElements;
  }
    // ### backupOriginal
    // backup the original layout parameters for trial period
  backupOriginal() {
  this.backup = JSON.parse(JSON.stringify(this.modifier));;
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

  var cb = function (x, y) {}
  htmlHelpers.draggable({
  parent: $(this.dgDom.element).find('.attributeModal'),
  handle: $(this.dgDom.element).find('.icon-move'),
            animateDiv:'.draganime',
  cb: cb,
  moveParent: true
  });
  this.completeNotifier.unbindKeyboardForModal(this);

    var box = svgHelpers.boxPoints(250,250,1,1);
    SuiDialogBase.position(box,this.dgDom,this.tracker.scroller);
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
  var self = this;
  var dgDom = this.dgDom;
        this.bindKeyboard();
        this._bindComponentNames();

  $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {

  // TODO:  allow user to select a zoom mode.
  self.layout.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
  self._updateLayout();
  self.complete();
  });

  $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
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
  this.components.find((x)=>{return x.parameterName==='pageSize'}).setValue(value);
  }
    // ### _handlePageSizeChange
    // see if the dimensions have changed.
  _handlePageSizeChange() {
  var pageSizeComp = this.components.find((x)=>{return x.parameterName==='pageSize'});
  var sel = pageSizeComp.getValue();
  if (sel === 'custom') {
  $('.attributeModal').addClass('customPage');
  } else {
  $('.attributeModal').removeClass('customPage');
  var dim = SmoScore.pageDimensions[sel];
  var hComp = this.components.find((x)=>{return x.parameterName==='pageHeight'});
  var wComp = this.components.find((x)=>{return x.parameterName==='pageWidth'});
  hComp.setValue(dim.height);
  wComp.setValue(dim.width);
  }
  }
    // ### changed
    // One of the components has had a changed value.
  changed() {
  // this.modifier.backupOriginal();
  this._handlePageSizeChange();
  this.components.forEach((component) => {
      if (typeof(this.layout.score.layout[component.smoName]) != 'undefined') {
      this.layout.score.layout[component.smoName] = component.getValue();
      }
  });
    if (this.engravingFontCtrl.changeFlag)  {
      this.layout.score.engravingFont = this.engravingFontCtrl.getValue();
      suiLayoutBase.setFont(this.layout.score.engravingFont);
    }
  this.layout.setViewport();
  }

  // ### createAndDisplay
  // static method to create the object and then display it.
  static createAndDisplay(parameters) {
  var dg = new SuiLayoutDialog(parameters);
  dg.display();
  }
  constructor(parameters) {
  var p = parameters;

  super(SuiLayoutDialog.dialogElements, {
  id: 'dialog-layout',
  top: (p.layout.score.layout.pageWidth / 2) - 200,
  left: (p.layout.score.layout.pageHeight / 2) - 200,
  label: 'Score Layout',
      ...parameters
  });
  this.layout = p.layout;
  this.modifier = this.layout.score.layout;
  this.backupOriginal();
  }
}
