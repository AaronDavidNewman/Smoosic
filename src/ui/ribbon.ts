// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { ButtonDefinition } from './buttons/button';
import { BrowserEventSource } from '../application/eventSource';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { CompleteNotifier } from '../application/common';
import { SuiTracker } from '../render/sui/tracker';
import { suiMenuManager } from './menus';
import { ButtonLabel } from './buttons/button';
import { CollapseRibbonControl } from './buttons/collapsable';

declare var $: any;

export interface RibbonLayout {
  left: string[],
  top: string[]
}
export interface SuiRibbonParams {
  eventSource: BrowserEventSource,
  view: SuiScoreViewOperations,
  completeNotifier: CompleteNotifier,
  tracker: SuiTracker,
  menus: suiMenuManager,
  ribbonButtons: ButtonDefinition[],
  ribbons: RibbonLayout
}
// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ### RibbonButton methods
// ---
export class RibbonButtons {
  static get paramArray() {
    return ['ribbonButtons', 'ribbons', 'keyCommands', 'controller', 'menus', 'eventSource', 'view'];
  }
  static _buttonHtml(containerClass: string, buttonId: string, buttonClass: string, buttonText: string, buttonIcon: string, buttonKey: string) {
    const b = htmlHelpers.buildDom;
    const r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText)).append(
          b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
            b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }

  static translateButtons: ButtonLabel[] = [];
  controller: CompleteNotifier;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  menus: suiMenuManager;
  ribbons: RibbonLayout;
  ribbonButtons: ButtonDefinition[];
  collapsables: CollapseRibbonControl[] = [];
  collapseChildren: any[] = [];

  constructor(params: SuiRibbonParams) {
    this.controller = params.completeNotifier;
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.menus = params.menus;
    this.ribbonButtons = params.ribbonButtons;
    this.ribbons = params.ribbons;
    this.collapsables = [];
    this.collapseChildren = [];
  }
  _executeButtonModal(buttonElement: string, buttonData: ButtonDefinition) {
    const ctor = eval('globalThis.Smo.' + buttonData.ctor);
    ctor.createAndDisplay(
      {
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        completeNotifier: this.controller,
        view: this.view
      }
    );
  }
  _executeButtonMenu(buttonElement: string, buttonData: ButtonDefinition) {
    this.menus.slashMenuMode(this.controller);
    this.menus.createMenu(buttonData.ctor);
  }

  _executeButton(buttonElement: string, buttonData: ButtonDefinition) {
    if (buttonData.action === 'modal') {
      this._executeButtonModal(buttonElement, buttonData);
      return;
    }
    if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
      this._executeButtonMenu(buttonElement, buttonData);
    }
  }

  _bindButton(buttonElement: string, buttonData: ButtonDefinition) {
    this.eventSource.domClick(buttonElement, this, '_executeButton', buttonData);
  }
  _createCollapsibleButtonGroups(selector: string) {
    let containerClass: string = '';
    // Now all the button elements have been bound.  Join child and parent buttons
    // For all the children of a button group, add it to the parent group
    this.collapseChildren.forEach((b) => {
      containerClass = 'ribbonButtonContainer';
      if (b.action === 'collapseGrandchild') {
        containerClass = 'ribbonButtonContainerMore';
      }
      const buttonHtml = RibbonButtons._buttonHtml(
        containerClass, b.id, b.classes, b.leftText, b.icon, b.rightText);
      if (b.dataElements) {
        const bkeys = Object.keys(b.dataElements);
        bkeys.forEach((bkey) => {
          var de = b.dataElements[bkey];
          $(buttonHtml).find('button').attr('data-' + bkey, de);
        });
      }
      // Bind the child button actions
      const parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
      $(parent).append(buttonHtml);
      const el = $(selector).find('#' + b.id);
      this._bindButton(el, b);
    });

    this.collapsables.forEach((cb) => {
      // Bind the events of the parent button
      cb.bind();
    });
  }

  static isCollapsible(action: string) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  _createRibbonHtml(buttonAr: string[], selector: string) {
    let buttonClass = '';
    buttonAr.forEach((buttonId) => {
      const buttonData = this.ribbonButtons.find((e) =>
        e.id === buttonId
      );
      if (buttonData) {
        if (buttonData.leftText) {
          RibbonButtons.translateButtons.push({ buttonId: buttonData.id, buttonText: buttonData.leftText });
        }
        // collapse child is hidden until the parent button is selected, exposing the button group
        if (RibbonButtons.isCollapsible(buttonData.action)) {
          this.collapseChildren.push(buttonData);
        }
        if (buttonData.action !== 'collapseChild') {
          // else the button has a specific action, such as a menu or dialog, or a parent button
          // for translation, add the menu name to the button class
          buttonClass = buttonData.classes;
          if (buttonData.action === 'menu' || buttonData.action === 'modal') {
            buttonClass += ' ' + buttonData.ctor;
          }
          const buttonHtml = RibbonButtons._buttonHtml('ribbonButtonContainer',
            buttonData.id, buttonClass, buttonData.leftText, buttonData.icon, buttonData.rightText);
          $(buttonHtml).attr('data-group', buttonData.group);
          $(selector).append(buttonHtml);
          const buttonElement = $('#' + buttonData.id);
          // If this is a collabsable button, create it, otherwise bind its execute function.
          if (buttonData.action === 'collapseParent') {
            $(buttonHtml).addClass('collapseContainer');
            // collapseParent
            this.collapsables.push(new CollapseRibbonControl({
              buttons: this.ribbonButtons,
              view: this.view,
              menus: this.menus,
              eventSource: this.eventSource,
              completeNotifier: this.controller,
              buttonId: buttonData.id,
              buttonElement,
              buttonData
            }));
          } else {
            this.eventSource.domClick(buttonElement, this, '_executeButton', buttonData);
          }
        }
      }
    });
  }

  createRibbon(buttonDataArray: string[], parentElement: string) {
    this._createRibbonHtml(buttonDataArray, parentElement);
    this._createCollapsibleButtonGroups(parentElement);
  }

  display() {
    $('body .controls-left').html('');
    $('body .controls-top').html('');

    const lbuttons = this.ribbons.left;
    this.createRibbon(lbuttons, 'body .controls-left');

    const tbuttons = this.ribbons.top;
    this.createRibbon(tbuttons, 'body .controls-top');
  }
}


