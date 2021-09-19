import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../../application/eventSource';
import { SuiMenuManager } from '../menus';
import { CompleteNotifier } from '../../application/common';

/**
 * structure of a button object.
 * @param {string} leftText - can be used in place of an icon for display
 * @param {string} rightText - usually used to represent a keyboard shortcut
 * @param {string} classes - to control button display
 * @param {string} icon - icon for the button face
 * @param {string} action - indicates to the button the action to perform
 * @param {string} ctor - the constructor of the button object
 * @param {string} group - the logical group, used to group the ribbon buttons
 * @param {string} id - unique ID for DOM selector
 */
export interface ButtonDefinition {
    leftText: string,
    rightText: string,
    classes: string,
    icon: string,
    action: string,
    ctor: string,
    group: string,
    id: string
    dataElements?: {
      interval: string,
      direction: string
    }
  }
  
// Button labels are translatable  
export interface ButtonLabel {
    buttonId: string,
    buttonText: string
}

// Buttons perform any variety of functions, so they need access to all the rendering logic
// as well as all the event sources.
// Sometimes they invoke menus which invoke modals, etc.
export interface SuiButtonParams {
    buttonId: string,
    buttonElement: string,
    buttonData: ButtonDefinition,
    view: SuiScoreViewOperations,
    eventSource: BrowserEventSource,
    menus: SuiMenuManager,
    completeNotifier: CompleteNotifier
  }
  export abstract class SuiButton {
    buttonId: string;
    buttonElement: string;
    view: SuiScoreViewOperations;
    buttonData: ButtonDefinition;
    eventSource: BrowserEventSource;
    menus: SuiMenuManager;
    completeNotifier: CompleteNotifier | null;
    constructor(params: SuiButtonParams) {
      this.buttonId = params.buttonId;
      this.buttonElement = params.buttonElement;
      this.view = params.view;
      this.buttonData = params.buttonData;
      this.eventSource = params.eventSource;
      this.menus = params.menus;
      this.completeNotifier = params.completeNotifier;
    }
  }
