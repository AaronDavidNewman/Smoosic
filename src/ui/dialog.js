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

    const staticText = dialogElements.find((xx) => xx.staticText);
    if (!staticText) {
      throw('dialog ' + this.ctor+ ' needs a static text section');
    }
    this.staticText = {};
    staticText.staticText.forEach((st) => {
      const key = Object.keys(st)[0];
      this.staticText[key] = st[key];

    });

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
    this.label = this.staticText.label;

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
      if (element.staticText) {
        component.staticText = {};
        element.staticText.forEach((st) => {
          var key = Object.keys(st)[0];
          component.staticText[key] = st[key];
        });
      }
      output.push(component);
    });
    return {ctor:xx['ctor'],dialogElements:output};
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
    var offset = $('.dom-container').offset();
    y = y - offset.top;

    var offsetY = dgeHeight + y > window.innerHeight ? (dgeHeight + y) -  window.innerHeight : 0;
    y = (y < 0) ? -y : y - offsetY;

    y = (y > maxY || y < 0) ? maxY / 2 : y;

  	$(dge).css('top', '' + y + 'px');

    var x = box.x - scroller.netScroll.x;
    x = x - offset.left;
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
    .append(b('h2').classes('dialog-label').text(this.staticText.label));

    var ctrl = b('div').classes('smoControlContainer');
    dialogElements.filter((de) => de.control).forEach((de) => {
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
