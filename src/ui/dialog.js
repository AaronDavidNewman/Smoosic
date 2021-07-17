// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { svgHelpers } from '../common/svgHelpers';
import { htmlHelpers } from '../common/htmlHelpers';
import { SmoTranslator } from './i18n/language';
import { SmoLyric } from '../smo/data/noteModifiers';

// # Dialog base classes

// ## SuiModifierDialogFactory
// Automatic dialog constructors for dialogs without too many parameters
// that operated on a selection.
export class SuiModifierDialogFactory {
  static createDialog(modifier, parameters) {
    let dbType = SuiModifierDialogFactory.modifierDialogMap[modifier.attrs.type];
    if (dbType === 'SuiLyricDialog' && modifier.parser === SmoLyric.parsers.chord) {
      dbType = 'SuiChordChangeDialog';
    }
    if (typeof(dbType) === 'undefined') {
      return null;
    }
    const ctor = Smo.getClass(dbType);
    return ctor.createAndDisplay({
      modifier,
      ...parameters
    });
  }
  static get modifierDialogMap() {
    return {
      SmoStaffHairpin: 'SuiHairpinAttributesDialog',
      SmoTie: 'SuiTieAttributesDialog',
      SmoSlur: 'SuiSlurAttributesDialog',
      SmoDynamicText: 'SuiDynamicModifierDialog',
      SmoVolta: 'SuiVoltaAttributeDialog',
      SmoScoreText: 'SuiTextTransformDialog',
      SmoTextGroup: 'SuiTextTransformDialog',
      SmoLoadScore: 'SuiLoadFileDialog',
      SmoLyric: 'SuiLyricDialog'
    };
  }
}

// ## SuiDialogBase
// Base class for dialogs.
export class SuiDialogBase {
  static get parameters() {
    return ['eventSource', 'view',
      'completeNotifier', 'keyCommands', 'modifier'];
  }
  static get displayOptions() {
    return { BINDCOMPONENTS: 'bindComponents', BINDNAMES: '_bindComponentNames', DRAGGABLE: 'makeDraggable',
      KEYBOARD_CAPTURE: 'captureKeyboardPromise', GLOBALPOS: 'positionGlobally',
      SELECTIONPOS: 'positionFromSelection', MODIFIERPOS: 'positionFromModifier' };
  }
  static getStaticText(dialogElements, label) {
    const rv = dialogElements.find((x) => x.staticText).staticText.find((x) => x[label]);
    if (rv !== null && rv[label]) {
      return rv[label];
    }
    return 'text not found';
  }
  // ### SuiDialogBase ctor
  // Creates the DOM element for the dialog and gets some initial elements
  constructor(dialogElements, parameters) {
    this.id = parameters.id;
    this.boundKeyboard = false;
    this.components = [];
    this.scroller = parameters.view.tracker.scroller;

    this.closeDialogPromise = new Promise((resolve) => {
      $('body').off('dialogDismiss').on('dialogDismiss', () => {
        resolve();
      });
    });

    const staticText = dialogElements.find((xx) => xx.staticText);
    if (!staticText) {
      throw 'dialog ' + this.ctor + ' needs a static text section';
    }
    this.staticText = {};
    staticText.staticText.forEach((st) => {
      const key = Object.keys(st)[0];
      this.staticText[key] = st[key];
    });

    this.initialLeft = parameters.left;
    this.initialTop = parameters.top;

    // If this dialog was spawned by a menu, wait for the menu to dismiss
    // before continuing.
    // this.startPromise = parameters.closeMenuPromise;
    this.startPromise = parameters.startPromise;

    this.dialogElements = dialogElements;
    SuiDialogBase.parameters.forEach((param) => {
      this[param] = parameters[param];
    });

    const top = parameters.top - this.view.tracker.scroller.netScroll.y;
    const left = parameters.left - this.view.tracker.scroller.netScroll.x;

    this.dgDom = this._constructDialog(dialogElements, {
      id: 'dialog-' + this.id,
      top,
      left,
      label: this.label
    });

    SmoTranslator.registerDialog(this.ctor);
  }

  // ### printXlate
  // print json with string labels to use as a translation file seed.
  static printTranslate(_class) {
    const output = [];
    const xx = Smo.getClass(_class);
    xx.dialogElements.forEach((element) => {
      const component = {};
      if (element.label) {
        component.label = element.label;
        component.id = element.smoName;
        if (element.options) {
          component.options = [];

          element.options.forEach((option) => {
            component.options.push({ value: option.value, label: option.label });
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
    return { ctor: xx.ctor, dialogElements: output };
  }
  get closeModalPromise() {
    return this.closeDialogPromise;
  }
  // ### position
  // For dialogs based on selections, tries to place the dialog near the selection and also
  // to scroll so the dialog is in view
  static position(box, dgDom, scroller) {
    let y = (box.y + box.height) - scroller.netScroll.y;
    let x = 0;

    // TODO: adjust if db is clipped by the browser.
    const dge = $(dgDom.element).find('.attributeModal');
    const dgeHeight = $(dge).height();
    const maxY =  $('.musicRelief').height();
    const maxX = $('.musicRelief').width();
    const offset = $('.dom-container').offset();
    y = y - offset.top;

    const offsetY = dgeHeight + y > window.innerHeight ? (dgeHeight + y) -  window.innerHeight : 0;
    y = (y < 0) ? -y : y - offsetY;

    y = (y > maxY || y < 0) ? maxY / 2 : y;

    $(dge).css('top', '' + y + 'px');

    x = box.x - scroller.netScroll.x;
    x = x - offset.left;
    const w = $(dge).width();
    x = (x > window.innerWidth / 2)  ? x - (w + 25) : x + (w + 25);

    x = (x < 0 || x > maxX) ? maxX / 2 : x;
    $(dge).css('left', '' + x + 'px');

    // Make sure the dialog is visible if the selection is not
    setTimeout(() => {
      scroller.scrollVisibleBox(
        svgHelpers.smoBox(box)
      );
    }, 1);
  }

  applyDisplayOptions() {
    $('body').addClass('showAttributeDialog');
    this.displayOptions.forEach((option) => {
      this[SuiDialogBase.displayOptions[option]]();
    });
  }
  bindComponents() {
    this.components.forEach((component) => {
      component.bind();
    });
  }
  // ### position
  // Position the dialog near a selection.  If the dialog is not visible due
  // to scrolling, make sure it is visible.
  position(box) {
    SuiDialogBase.position(box, this.dgDom, this.view.tracker.scroller);
  }
  // ### positionModifier()
  positionFromModifier() {
    if (typeof(this.modifier.renderedBox) === 'undefined') {
      this.positionGlobally();
      return;
    }
    this.position(this.modifier.renderedBox);
  }
  // ### positionGlobally
  // position the dialog box in the center of the current scroll region
  positionGlobally() {
    const box = svgHelpers.boxPoints(250, 250, 1, 1);
    SuiDialogBase.position(box, this.dgDom, this.view.tracker.scroller);
  }
  // ### postionFromSelection
  // set initial position of dialog based on first selection
  positionFromSelection() {
    this.position(this.view.tracker.selections[0].note.renderedBox);
  }
  // ### build the html for the dialog, based on the instance-specific components.
  _constructDialog(dialogElements, parameters) {
    const id = parameters.id;
    const b = htmlHelpers.buildDom;
    const r = b('div').classes('attributeModal').attr('id', 'attr-modal-' + id)
      .css('top', parameters.top + 'px').css('left', parameters.left + 'px')
      .append(b('spanb').classes('draggable button').append(b('span').classes('icon icon-move jsDbMove')))
      .append(b('h2').classes('dialog-label').text(this.staticText.label));

    var ctrl = b('div').classes('smoControlContainer');
    dialogElements.filter((de) => de.control).forEach((de) => {
      let ctor = null;
      if (typeof(de.control) === 'function') {
        ctor = de.control;
      } else {
        ctor = Smo.getClass(de.control);
      }
      const control = new ctor(this, de);
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

    const trapper = htmlHelpers.inputTrapper('.attributeDialog');
    $('.attributeDialog').find('.cancel-button').focus();
    return {
      element: $('.attributeDialog'),
      trapper
    };
  }
  // ### Complete
  // Dialogs take over the keyboard, so release that and trigger an event
  // that the dialog is closing that can resolve any outstanding promises.
  complete() {
    if (this.boundKeyboard) {
      this.eventSource.unbindKeydownHandler(this.keydownHandler);
    }
    $('body').removeClass('showAttributeDialog');
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
    this.view.tracker.scroller.scrollVisibleBox(
      svgHelpers.smoBox($(this.dgDom.element)[0].getBoundingClientRect())
    );
    this.makeDraggable();
  }
  // ### makeDraggable
  // generic code to make the dialog box draggable so it doesn't
  // get in front of stuff.
  makeDraggable() {
    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.jsDbMove'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
  }
  // ### captureKeyboardPromise
  // capture keyboard events until the dialog closes,
  // then give control back to the current keyboard
  captureKeyboardPromise() {
    if (typeof(this.startPromise) === 'undefined') {
      this.completeNotifier.unbindKeyboardForModal(this);
      this.bindKeyboard();
      return;
    }
    const getKeys = () => {
      this.completeNotifier.unbindKeyboardForModal(this);
      this.bindKeyboard();
    };
    this.startPromise.then(getKeys);
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    }
  }

  // ### bindKeyboard
  // generic logic to grab keyboard elements for modal
  bindKeyboard() {
    this.boundKeyboard = true;
    this.keydownHandler = this.eventSource.bindKeydownHandler(this, 'evKey');
  }
}
