// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, getDomContainer } from '../../common/htmlHelpers';
import { ButtonDefinition, ButtonAction } from './button';
import { BrowserEventSource } from '../eventSource';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { CompleteNotifier, RibbonLayout } from '../common';
export { RibbonLayout } from '../common';
import { SuiTracker } from '../../render/sui/tracker';
import { SuiMenuManager } from '../menus/manager';
import { SuiLibraryDialog } from '../dialogs/library';
import { SuiTempoDialog } from '../dialogs/tempo';
import { ButtonLabel } from './button';
import { CollapseRibbonControl } from './collapsable';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiHelp } from '../help';
import { SmoUiConfiguration } from '../configuration';

declare var $: any;

export type SuiModalButtonTypes = 'SuiLibraryDialog' | 'SuiTempoDialog';
export var SuiModalButtonStrings = ['SuiLibraryDialog', 'SuiTempoDialog'];
export function isModalButtonType(but: string | SuiModalButtonTypes): but is SuiModalButtonTypes {
  return SuiModalButtonStrings.indexOf(but) >= 0;
}

/**
 * Parameters for creating the global button ribbon object.  The button ribbon supports a 
 * button panel in 'top' and 'left' areas, with support for R-to-L languages.  Button groups 
 * are collapsible.  The content of ribbonButtons determines which buttons show up.  
 * ribbon layout determines which show up top vs. left
 * @param {BrowserEventSource} eventSource - buttons will use this to bind click events
 * @param {CompleteNotifier} completeNotifier - buttons that bring up menus and dialogs will pass this to the dialogs
 * @param {SuiTracker} tracker - some buttons act on the current selection
 * @param {SuiMenuManager} menus - some buttons invoke a menu
 * @param {ButtonDefinition[]} - the buttons
 * @param {RibbonLayout} ribbons - where the buttons appear
 * @see {ButtonDefinition} for how to create/modify buttons
 * @see {defaultRibbonLayout} for buttons supported from the demo application
 */
export interface SuiRibbonParams {
  config: SmoUiConfiguration
  eventSource: BrowserEventSource,
  view: SuiScoreViewOperations,
  completeNotifier: CompleteNotifier,
  tracker: SuiTracker,
  menus: SuiMenuManager,
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
    const b = buildDom;
    const r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText)).append(
        b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
          b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }
  static _buttonSidebarHtml(buttonId: string, buttonClass: string, buttonText: string, buttonIcon: string, buttonKey: string) {
    const b = buildDom;
    const r = b('li').classes('nav-item').append(b('button').attr('id', buttonId).classes('nav-link').append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText))).append(
      b('span').classes('ribbon-button-text icon ' + buttonIcon)).append(
        b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }
  static translateButtons: ButtonLabel[] = [];
  controller: CompleteNotifier;
  config: SmoUiConfiguration;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  menus: SuiMenuManager;
  ribbons: RibbonLayout;
  ribbonButtons: ButtonDefinition[];
  collapsables: CollapseRibbonControl[] = [];
  collapseChildren: any[] = [];

  constructor(params: SuiRibbonParams) {
    this.controller = params.completeNotifier;
    this.config = params.config;
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.menus = params.menus;
    this.ribbonButtons = params.ribbonButtons;
    this.ribbons = params.ribbons;
    this.collapsables = [];
    this.collapseChildren = [];
  }
  async _executeButtonModal(buttonElement: string, buttonData: ButtonDefinition) {
   if (isModalButtonType(buttonData.ctor)) {
      const params = {
        eventSource: this.eventSource,
        completeNotifier: this.controller,
        view: this.view,
        ctor: buttonData.ctor,
        id: buttonData.id,
        startPromise: null,
        tracker: this.view.tracker
      };
      if (buttonData.ctor === 'SuiLibraryDialog') {
        await SuiLibraryDialog.createAndDisplay(params, this.config);
      } else {
        createAndDisplayDialog(SuiTempoDialog, params);
      }
    } else if (buttonData.ctor === 'helpModal') {
      SuiHelp.displayHelp();
    }
  }
  _executeButtonMenu(buttonElement: string, buttonData: ButtonDefinition) {
    this.menus.slashMenuMode(this.controller);
    this.menus.createMenu(buttonData.ctor);
  }

  async _executeButton(buttonElement: string, buttonData: ButtonDefinition) {
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
  _createCollapsibleButtonGroups(selector: string | HTMLElement) {
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
  _createSidebarButtonGroups(selector: string | HTMLElement) {
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
  static isCollapsible(action: ButtonAction) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  _createRibbonHtml(buttonAr: string[], selector: string | HTMLElement) {
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
              ctor: buttonData.ctor,
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
  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  _createSidebarHtml(buttonAr: string[], selector: string | HTMLElement) {
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
          const buttonHtml = RibbonButtons._buttonSidebarHtml(
            buttonData.id, buttonClass, buttonData.leftText, buttonData.icon, buttonData.rightText);
          $(buttonHtml).attr('data-group', buttonData.group);
          $(selector).append(buttonHtml);
          const buttonElement = $('#' + buttonData.id);
          // If this is a collabsable button, create it, otherwise bind its execute function.
          if (buttonData.action === 'collapseParent') {
            $(buttonHtml).addClass('collapseContainer');
            // collapseParent
            this.collapsables.push(new CollapseRibbonControl({
              ctor: buttonData.ctor,
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
  createRibbon(buttonDataArray: string[], parentElement: string | HTMLElement) {
    this._createRibbonHtml(buttonDataArray, parentElement);
    this._createCollapsibleButtonGroups(parentElement);
  }
  createSidebarRibbon(buttonDataArray: string[], parentElement: string | HTMLElement, containerClasses: string) {
    this._createSidebarHtml(buttonDataArray, parentElement);
    this._createCollapsibleButtonGroups(parentElement);
  }
  display() {
    if (this.config.leftControls) {
      const leftControl = getDomContainer(this.config.leftControls);
      if (leftControl) {
        $(leftControl).html('');
        const lbuttons = this.ribbons.left;
        this.createSidebarRibbon(lbuttons, leftControl, 'nav-item');
      }
    }
    if (this.config.topControls) {
      const topControl = getDomContainer(this.config.topControls);
      if (topControl) {
        const tbuttons = this.ribbons.top;
        this.createRibbon(tbuttons, topControl);    
      }
    }
  }
}


