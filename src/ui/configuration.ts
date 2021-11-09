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
export interface SmoUiConfiguration {
  ribbon?: RibbonConfiguration,
  keys?: KeyBindingConfiguration,
  libraryUrl?: string,
  language: string,
  demonPollTime: number,
  idleRedrawTime: number
}