import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier } from '../../application/common';
import { BrowserEventSource } from '../../application/eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
declare var $: any;

/**
 * An adapter is the glue logic between UI components and the score view
 * An adapter consists mostly of accessors (get/set) for the component data.  The 
 * components have their initial values set from the adapter get, and changes to components
 * result in sets to the adapter.  The adapter can then update the score.
 * For dialogs that use this pattern,
 * the dialog automatically creates the components and binds their values with the 
 * adapter.   
 * @method commit - called when OK button of dialog is clicked
 * @method cancel - called when cancel button of dialog is clicked
 * @method remove - optional.  Called when 'remove' button is clicked, for artifacts like dynamics that can be removed.
 */
export abstract class SuiComponentAdapter {
  view: SuiScoreViewOperations;
  constructor(view: SuiScoreViewOperations) {
    this.view = view;
  }
  abstract commit(): void;
  abstract cancel(): void;
  remove(): void { };
}

/** 
 * A dialog that uses the adapter pattern takes the adapter as argument.
 * Other than that it's the same as normal dialog parameters
 * The adapter type is a generic, so that the specific dialog can reference the 
 * specific adapter class
 */
export interface SuiDialogAdapterParams<T extends SuiComponentAdapter> {
  ctor: string,
  id: string,
  tracker: SuiTracker,
  completeNotifier: CompleteNotifier,
  startPromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer: UndoBuffer,
  // definition: DialogDefinition,
  adapter: T,
  autobind?: boolean
}

/**
 * SuiDialogAdapterBase is the base class for dialogs that use the adapter pattern
 * (almost all of them).  
 */
export class SuiDialogAdapterBase<T extends SuiComponentAdapter> extends SuiDialogBase {
  adapter: T;
  constructor(def: DialogDefinition, params: SuiDialogAdapterParams<T>) {
    super(def, params);
    this.adapter = params.adapter;
  }
  /**
   * Called before dialog is displayed.
   * components that interface (bind) with the adapter are called 'bound' components.
   * On initialize, update the component with the score value, as told by the adapter.
   */
  initialValue() {
    if (this.modifier === null || this.autobind === false) {
      return;
    }
    this.boundComponents.forEach((comp) => {
      (comp as any).setValue((this.modifier as any)[comp.smoName]);
    });
  }
  /**
   * When a component changes, it notifies the parent dialog.  Usually, we just
   * proxy the call to the adapter.  The specific dialog can override this method if 
   * something in the UI needs to change as a result of the component state (e.g. 
   * show or hide another component)
   */
  changed() {
    if (this.modifier === null || this.autobind === false) {
      return;
    }
    this.boundComponents.forEach((comp) => {
      if (comp.changeFlag) {
        (this.modifier as any)[comp.smoName] = (comp as any).getValue();
      }
    });
  }
  /**
   * If there is any 'saving' to be done when the dialog clicks OK, 
   * that is handled by the adapter.  Else it can be a noop.
   */
  commit() {
    this.adapter.commit();
  }
  /**
   * If there is any undo or restore to be done when the dialog clicks OK, 
   * that is handled by the adapter.  Else it can be a noop.
   */
   cancel() {
    this.adapter.cancel();
  }
  /**
   * For score artifacts that can be removed, 
   */
  remove() {
    this.adapter.remove();
  }
  /**
   * Binds the main dialog buttons.  For OK/Cancel/remove, the logic calls the appropriate 
   * derived function, which calls the appropriate adapter method, then calls complete()
   * to restore the event handling loop to the application
   */
  bindElements() {
    var dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.commit();
      this.complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.cancel();
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.remove();
      this.complete();
    });
  }
}