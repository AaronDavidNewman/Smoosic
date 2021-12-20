import { ButtonDefinition } from './buttons/button';
import { RibbonLayout } from './buttons/ribbon';
import { KeyBinding } from '../application/common';

export interface KeyBindingConfiguration {
  editorKeys: KeyBinding[],
  trackerKeys: KeyBinding[]
}
export interface RibbonConfiguration {
  layout: RibbonLayout,
  buttons: ButtonDefinition[]
}
/**
 * Configurable elements for the UI
 * @category SuiUiBase
 */
export interface SmoUiConfiguration {
  keys?: KeyBindingConfiguration,
  libraryUrl?: string,
  language: string,
  demonPollTime: number,
  idleRedrawTime: number,
  leftControls?: HTMLElement | string;
  topControls?: HTMLElement | string;
  scoreDomContainer: string | HTMLElement;
}