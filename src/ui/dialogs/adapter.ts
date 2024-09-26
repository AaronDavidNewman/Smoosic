// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Support for converting Smo object model to MIDI
 * @module /ui/dialog/adapter
 */
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiTracker } from '../../render/sui/tracker';
import { CompleteNotifier } from '../common';
import { BrowserEventSource } from '../eventSource';
import { UndoBuffer } from '../../smo/xform/undo';
import { DialogDefinition, SuiDialogBase } from './dialog';
import { PromiseHelpers } from '../../common/promiseHelpers';
declare var $: any;

/**
 * An adapter is the glue logic between UI components and the score view.
 * An adapter consists mostly of accessors (get/set) for the component data.  The 
 * components have their initial values set from the adapter get, and changes to components
 * result in sets to the adapter.  The adapter can then update the score.
 * For dialogs that use this pattern,
 * the dialog automatically creates the components and binds their values with the 
 * adapter.   
 * @method commit - called when OK button of dialog is clicked
 * @method cancel - called when cancel button of dialog is clicked
 * @method remove - optional.  Called when 'remove' button is clicked, for artifacts like dynamics that can be removed.
 * @category SuiDialog
 */
export abstract class SuiComponentAdapter {
  view: SuiScoreViewOperations;
  constructor(view: SuiScoreViewOperations) {
    this.view = view;
  }
  abstract commit(): Promise<any>;
  abstract cancel(): Promise<any>;
  remove(): Promise<any> {
    return PromiseHelpers.emptyPromise();
   };
}

/** 
 * A dialog that uses the adapter pattern takes the adapter as argument.
 * Other than that it's the same as normal dialog parameters
 * The adapter type is a generic, so that the specific dialog can reference the 
 * specific adapter class
 * @param ctor constructor for reflection
 * @param id ID for dom placement
 * @param tracker
 * @param completeNotifier UI component to notify when dialog is complete
 * @param startProise UI component that notifies us when to display
 * @param view
 * @param eventSource where to register for KB and mouse events
 * @param undoBuffer where to undo things we change
 * @param adapter an adapter which has getters and setters for all of the dialog components.  The adapter should
 *   read the values from the actual score, and update the score with the component values.
 * @category SuiDialogParams
 */
export interface SuiDialogAdapterParams<T extends SuiComponentAdapter> {
  ctor: string,
  id: string,
  tracker: SuiTracker,
  completeNotifier: CompleteNotifier,
  startPromise: Promise<void> | null
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  undoBuffer?: UndoBuffer,
  // definition: DialogDefinition,
  adapter: T
}

/**
 * SuiDialogAdapterBase is the base class for dialogs that use the adapter pattern
 * (almost all of them).  
 * @typeParam T a class that implements the Adapter interface and fulfills the 
 *  adapter data contract, with getters and setters from the components
 * @category SuiDialog
 */
export class SuiDialogAdapterBase<T extends SuiComponentAdapter> extends SuiDialogBase {
  adapter: T;
  constructor(def: DialogDefinition, params: SuiDialogAdapterParams<T>) {
    super(def, params);
    this.adapter = params.adapter;
  }
  /**
   * Call the components bind() methods to activate them.  Also, verify that each 
   * adapter meets the contract with the components
   */
    bindComponents() {
      this.components.forEach((component) => {
        // do some runtime validation of the adapter
        if (!component.noProperty) {
          if (typeof((this.adapter as any)[component.smoName]) === 'undefined') {
            throw ('Dialog ' + this.label + ' has component ' + component.smoName + ' but no setter in the adapter ');
          }
        }
        component.bind();
      });
    }
  /**
   * Called before dialog is displayed.
   * components that interface (bind) with the adapter are called 'bound' components.
   * On initialize, update the component with the score value, as told by the adapter.
   */
  initialValue() {
    this.components.forEach((comp) => {
      (comp as any).setValue((this.adapter as any)[comp.smoName]);
    });
  }
  /**
   * When a component changes, it notifies the parent dialog.  Usually, we just
   * proxy the call to the adapter.  The specific dialog can override this method if 
   * something in the UI needs to change as a result of the component state (e.g. 
   * show or hide another component)
   */
  async changed() {
    this.components.forEach((comp) => {
      if (comp.changeFlag) {
        (this.adapter as any)[comp.smoName] = (comp as any).getValue();
      }
    });
    await this.view.updatePromise();
  }
  /**
   * If there is any 'saving' to be done when the dialog clicks OK, 
   * that is handled by the adapter.  Else it can be a noop.
   */
  async commit(): Promise<any> {
    await this.adapter.commit();
  }
  /**
   * If there is any undo or restore to be done when the dialog clicks OK, 
   * that is handled by the adapter.  Else it can be a noop.
   */
  async cancel(): Promise<any> {
    await this.adapter.cancel();
  }
  /**
   * For score artifacts that can be removed, 
   */
  async remove() {
    await this.adapter.remove();
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