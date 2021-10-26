import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../../application/eventSource';
import { SuiMenuManager } from '../menus/manager';
import { CompleteNotifier } from '../../application/common';

/**
 * Button actions are one of the following.  
 * - collapse... buttons are used to expand/collapse button groups in a ribbon.
 *   all buttons with these classes have 'ctor' constructor, and perform actions based on 
 *   their bind method
 * - menu brings up a modal menu with class 'ctor'
 * - modal brings up a modal dialog with class 'ctor'
 * - collapseChildMenu brings up a modal menu, and is also collapsable.
 */
export type ButtonAction = 'menu' | 'modal' | 'collapseChild' | 'collapseChildMenu' | 'collapseParent' | 'collapseGrandchild' | 'collapseMore';
/**
 * structure of a button object.
 * @param leftText - can be used in place of an icon for display
 * @param rightText - usually used to represent a keyboard shortcut
 * @param classes - to control button display
 * @param icon - icon for the button face
 * @param action - indicates to the button the action to perform
 * @param ctor - the constructor of the button object
 * @param group - the logical group, used to group the ribbon buttons
 * @param id - unique ID for DOM selector
 * @param dataElements - can be used to give  buttons in a group basic parameters
 */
export interface ButtonDefinition {
    leftText: string,
    rightText: string,
    classes: string,
    icon: string,
    action: ButtonAction,
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
    abstract bind(): void;
  }
