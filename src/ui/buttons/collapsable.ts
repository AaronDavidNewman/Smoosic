import { ButtonDefinition, SuiButton, SuiButtonParams } from './button';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../../application/eventSource';
import { SuiMenuManager } from '../menus/manager';
import { CompleteNotifier } from '../../application/common';
import { smoSerialize } from '../../common/serializationHelpers';
import { SuiMenuParams } from '../menus/menu';
declare var $: any;


export interface SuiCollapsableButtonParams {
  buttonId: string,
  buttonElement: string,
  buttonData: ButtonDefinition,
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  menus: SuiMenuManager,
  completeNotifier: CompleteNotifier
  buttons: ButtonDefinition[]
}

export function buttonIsCollapsible(action: string): boolean {
  return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
}

export function buttonIsBindable(action: string): boolean {
  return ['collapseChildMenu', 'menu', 'modal'].indexOf(action) >= 0;
}
export class CollapseRibbonControl extends SuiButton {
  static get paramArray() {
    return ['ribbonButtons', 'keyCommands', 'controller', 'view', 'menus', 'buttonData', 'buttonElement',
      'eventSource'];
  }
  childButtons: ButtonDefinition[];
  constructor(parameters: SuiCollapsableButtonParams) {
    super(parameters);
    smoSerialize.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
    this.childButtons = parameters.buttons.filter((cb) =>
      cb.group === this.buttonData.group &&
      buttonIsCollapsible(cb.action)
    );
  }
  _toggleExpand() {
    this.childButtons.forEach((cb) => {
      const el = $('#' + cb.id);
      $(el).toggleClass('collapsed');
      $(el).toggleClass('expanded');
    });

    $(this.buttonElement).closest('div').toggleClass('expanded');
    $(this.buttonElement).toggleClass('expandedChildren');
    if ($(this.buttonElement).hasClass('expandedChildren')) {
      const leftSpan = $(this.buttonElement).find('.ribbon-button-text');
      $(leftSpan).text('');
      $(leftSpan).removeClass(this.buttonData.icon);
      $(this.buttonElement).addClass('icon icon-circle-left');
    } else {
      $(this.buttonElement).removeClass('icon-circle-left');
      const leftSpan = $(this.buttonElement).find('.ribbon-button-text');
      $(leftSpan).addClass(this.buttonData.icon);
      $(leftSpan).text(this.buttonData.leftText);
    }
    // Expand may change music dom, redraw
    $('body').trigger('forceScrollEvent');
  }
  bind() {
    $(this.buttonElement).closest('div').addClass('collapseContainer');
    this.eventSource.domClick(this.buttonElement, this, '_toggleExpand', null);
    this.childButtons.forEach((cb) => {
      const ctor = eval('globalThis.Smo.' + cb.ctor);
      if ((typeof (ctor) === 'function') && this.completeNotifier) {
        const el = $('#' + cb.id);
        const params: SuiButtonParams = {
          buttonId: cb.id,
          buttonData: cb,
          buttonElement: el,
          view: this.view,
          completeNotifier: this.completeNotifier,
          eventSource: this.eventSource,
          menus: this.menus
        }
        const btn = new ctor(params);
        if (typeof (btn.bind) === 'function') {
          btn.bind();
        }
      }
    });
  }
}

// ## ExtendedCollapseParent
// Muse-style '...' buttons for less-common operations
export class ExtendedCollapseParent extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      $(this.buttonElement).closest('.collapseContainer').toggleClass('expanded-more');
    });
  }
}