// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoModifier } from '../../../smo/data/score';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { BrowserEventSource } from '../../eventSource';
/**
 * A component is a part of a dialog box that accepts some input.
 */
declare var $: any;
/**
 * Dialogs controls options, like dropdowns
 * @category SuiDialogParams
 */
export interface DialogDefinitionOption {
  css?: string,
  label: string,
  value: number | string
}
/**
 * DialogDefinition is a JSON-like structure that each dialog has
 * to define the components.  Specific components can define
 * additional params by extending this, these are the basics.
 * @param {smoName} - the name the dialog uses to reference it 
 * @param {control} - constructor of the control
 * @param {label} - label of the element, can be translated
 * @param {increment}  - used by components that have increment arrows
 * @param {defaultValue} - thinking of removing this
 * @param {dataType} - used to narrow the type by some components
 * @param {classes} - can be used in rendering
 * @category SuiDialogParams
 */
export interface DialogDefinitionElement {
  smoName: string,
  control: string,
  label: string,
  startRow?: boolean,
  options?: DialogDefinitionOption[]
  increment?: number,
  defaultValue?: number | string,
  dataType?: string,
  classes?: string,
}

/**
 * for base component constructors
 * @param {id} - unique ID for the control DOM
 * @param {classes} - additional classes for styling added to DOM
 * @param {label} - default label for the component
 * @param {smoName} - the variable in the dialog that the componenet maps to
 * @param {control} - the constructor of the UI control
 * @param {parentComponent} - for composite components, the top-level
 * @category SuiDialogParams
 */
export interface SuiBaseComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  parentComponent?: SuiComponentParent
}
/**
 * components know about their parent dialog via the 
 * DialogNotifier interface.  It allows a component to 
 * notify parent of changing contents.
 * @category SuiDialog
 */
export abstract class SuiDialogNotifier {
  /**
   * Called by the component when the state is changed.  Dialog
   * will then query the component (getValue()) and set the 
   * correct score value.
   */
  abstract changed(): void;
  /**
   * returns the DOM id of the dialog.
   */
  abstract getId(): string;
  /**
   * returns the top DOM node for the dialog
   */
  abstract get dgDom(): any;
  /**
   * gets the view from the parent
   */
  abstract getView(): SuiScoreViewOperations;
  /**
   * gets the 'modifier' from parent dialog, used by 
   * text editors.  Most components won't need this.
   */
  abstract getModifier(): SmoModifier | null;
  /**
   * Gets the static text <string, string> for the current language.
   * this is used by components that have different text labels for different states.
   */
  abstract getStaticText(): Record<string, string>;
  /**
   * Used by text editing components that are also event sinks
   */
  abstract getEventSource(): BrowserEventSource;
}
/**
 * base class for Dialog components.  Notifies parent 
 * dialog of state change via `change()`
 * @category SuiDialog
 */
export abstract class SuiComponentBase {
  changeFlag: boolean = false;
  css: string;
  dialog: SuiDialogNotifier;
  id: string;
  label: string;
  control: string;
  smoName: string;
  constructor(dialog: SuiDialogNotifier, parameters: SuiBaseComponentParams) {
    this.changeFlag = false;
    this.css = parameters.classes;
    this.dialog = dialog;
    this.id = parameters.id;
    this.label = parameters.label;
    this.control = parameters.control;
    this.smoName = parameters.smoName;
  }
  /**
   * Called by the dialog after rendering, so the derived class can 
   * bind the html controls
   */
  abstract bind(): void;
  /**
   * Return the html that lives in side the component DOM. Implemented by the
   * base class.
   */
  abstract get html(): any;

  /**
   * Called by the derived class when the value changes.  The change flag is set to true, so the dialog will 
   * know which component changed.
   */
  handleChanged() {
    this.changeFlag = true;
    this.dialog.changed();
    this.changeFlag = false;
  }
  /**
   * combine component classes with string, used for composites
   * @param classes string ot append
   * @returns combined strings
   */
  makeClasses(classes: string) {
    if (this.css) {
      return classes + ' ' + this.css;
    }
    return classes;
  }
  get parameterId() {
    return this.dialog.getId() + '-' + this.smoName;
  }
  show() {
    $('#' + this.parameterId).removeClass('hide');
  }
  hide() {
    $('#' + this.parameterId).addClass('hide');
  }
}

/**
 * Parent components are really containers for other components
 * For instance, FontComponent has size, family, weight, etc.
 * 
 * @category SuiDialog
 */
export abstract class SuiComponentParent extends SuiComponentBase {
  /**
   * For parent component, their changed method is called by child, and then the 
   * parent calls the dialog changed()
   */
  abstract changed(): void;
}


