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
  position: SvgBox,
  tracker: SuiTracker,
  score: SmoScore,
  completeNotifier: CompleteNotifier,
  closePromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer: UndoBuffer
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
    const definition: MenuDefinition = this.getDefinition();
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
  abstract selection(ev: any): void;
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