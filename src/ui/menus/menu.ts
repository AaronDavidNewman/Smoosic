import { SvgBox } from '../../smo/data/common';
import { SuiTracker } from '../../render/sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { CompleteNotifier } from '../common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoTranslator } from '../i18n/language';
declare var $: any;
/**
 * Data for a menu choice.  'value' indicates which options selected
 * @param icon - .icon class will be added to the choice
 * @param text - text to describe the choice
 * @param value - the value received by the menu loop
 * @param hotkey - optional key binding, if not supplied one is selected
 */
export interface MenuChoiceDefinition {
    icon: string,
    text: string,
    value: string,
    hotkey?: string
}
/**
 * Menu just array of choices
 * @param label - Not currently displayed
 * @param menuItems - list of choices
 */
export interface MenuDefinition {
  label: string,
  menuItems: MenuChoiceDefinition[]
}
export interface MenuTranslation {
  ctor: string,
  label: string,
  menuItems: MenuChoiceDefinition[]
}
/**
 * All menus take the same options.  Menu choices can alter the score
 * directly, or call dialogs or even other menus
 * @param ctor dialog constructor
 * @param position - menu position
 * @param view the MVVM object to change the score
 * @param score SmoScore, could also be read from the view
 * @param completeNotifier used to take over key/mouse control
 * @param closePromise resolved when the menu closes, used to syncronize with other modals
 * @param eventSource event source to register for additional events like mouseup
 * @param undoBuffer used to create undo
*/
export interface SuiMenuParams {
  ctor: string,
  tracker: SuiTracker,  
  score: SmoScore,
  completeNotifier: CompleteNotifier,
  closePromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer: UndoBuffer,
  items?: MenuDefinition
}
export abstract class SuiMenuBase {
  label: string;
  menuItems: MenuChoiceDefinition[];
  ctor: string;
  completeNotifier: CompleteNotifier;
  score: SmoScore;
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  undoBuffer: UndoBuffer;
  focusIndex: number = -1;
  closePromise: Promise<void> | null;
  tracker: SuiTracker;
  constructor(params: SuiMenuParams) {
    this.ctor = params.ctor;
    const definition: MenuDefinition = 
       params.items ?? this.getDefinition();
    this.label = definition.label;
    this.menuItems = definition.menuItems;
    this.completeNotifier = params.completeNotifier;
    this.score = params.score;
    this.view = params.view;
    this.undoBuffer = params.undoBuffer;
    this.eventSource = params.eventSource;
    this.closePromise = params.closePromise;
    this.tracker = params.tracker;
    SmoTranslator.registerMenu(this.ctor);
  }
  abstract selection(ev: any): Promise<void>;
  abstract getDefinition(): MenuDefinition;
  /**
   * Base class can override this, called before display and event binding to 
   * add or remove options from the static list
   */
  preAttach() { }
  static printTranslate(_class: string): MenuTranslation {
    const xx: any = eval('Smo.' + _class);
    const items: MenuChoiceDefinition[] = xx.defaults.menuItems as MenuChoiceDefinition[];
    const rvItems: MenuChoiceDefinition[] = [];
    items.forEach((item) => {
      rvItems.push({ value: item.value, text: item.text, icon: '' });
    });
    return { ctor: _class, label: xx.defaults.label, menuItems: items };
  }

  complete() {
    $('body').trigger('menuDismiss');
  }
  // Most menus don't process their own events
  keydown() {}
}

export type SuiMenuHandler = (menu: SuiMenuBase) => Promise<void>;
export type SuiMenuShowOption = (menu: SuiMenuBase) => boolean;
export interface SuiConfiguredMenuOption {
  menuChoice: MenuChoiceDefinition,
  handler: SuiMenuHandler,
  display: SuiMenuShowOption
}

const cancelOption: SuiConfiguredMenuOption = {
  handler: async (menu: SuiMenuBase) => {
    menu.complete();
  }, display: (menu: SuiMenuBase) => true,
  menuChoice: {
    icon: '',
    text: 'Cancel',
    value: 'cancel'
  }
}
export class SuiConfiguredMenu extends SuiMenuBase {
  menuOptions: SuiConfiguredMenuOption[] = [];
  label: string = '';
  constructor(params: SuiMenuParams, label: string, options: SuiConfiguredMenuOption[]) {
    const cancel = options.find((op) => op.menuChoice.value === 'cancel');
    if (!cancel) {
      options.push(cancelOption);
    }
    super({ items: SuiConfiguredMenu.definitionFromOptions(label, options), ...params });
    this.menuOptions = options;
  }
  async selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    for (let i = 0; i < this.menuOptions.length; ++ i) {
      const option: SuiConfiguredMenuOption = this.menuOptions[i];
      if (option.menuChoice.value === text) {
        await option.handler(this);
        break;
      }
    }
    this.complete();
  }
  static definitionFromOptions(label: string, options: SuiConfiguredMenuOption[]) {
    const menuItems = options.map(oo => oo.menuChoice);
    return { label, menuItems };
  }
  getDefinition(): MenuDefinition {
    const choices: MenuChoiceDefinition[] = [];
    for (let i = 0; i < this.menuOptions.length; ++ i) {
      const option: SuiConfiguredMenuOption = this.menuOptions[i];
      choices.push(option.menuChoice);
    }
    return {
      label: this.label,
      menuItems: choices
    };
  }
  preAttach(): void {
    this.menuItems = [];
    this.menuOptions.forEach((option) => {
      if (option.display(this)) {
        this.menuItems.push(option.menuChoice);
      }
   });
  }
}