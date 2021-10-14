import { SvgBox } from '../../smo/data/common';
import { SuiTracker } from '../../render/sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { CompleteNotifier } from '../../application/common';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../../application/eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoTranslator } from '../i18n/language';
declare var $: any;
export interface MenuChoiceDefinition {
    icon: string,
    text: string,
    value: string,
    hotkey?: string
}
export interface MenuDefinition {
  label: string,
  menuItems: MenuChoiceDefinition[]
}
export interface MenuChoiceTranslation {
  label: string,
  menuItems: MenuChoiceDefinition[],
  ctor: string
}
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
  static printTranslate(_class: string): MenuChoiceTranslation {
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