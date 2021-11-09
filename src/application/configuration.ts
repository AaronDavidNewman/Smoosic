import { SmoRenderConfiguration } from "../render/sui/configuration";
import { RibbonConfiguration } from "../ui/configuration";
import { defaultRibbonLayout } from "../ui/ribbonLayout/default/defaultRibbon";
import { KeyBindingConfiguration } from "../ui/configuration";
import { defaultEditorKeys } from "../ui/keyBindings/default/editorKeys";
import { defaultTrackerKeys } from "../ui/keyBindings/default/trackerKeys";
import { SmoUiConfiguration } from "../ui/configuration";

export type SmoMode = 'library' | 'application' | 'translate';
export type SmoLoadType = 'local' | 'remote' | 'query';
export var SmoLoadTypes: SmoLoadType[] = ['local', 'remote', 'query'];
export type ConfigurationStringOption = 'smoPath' | 'language' | 'scoreLoadJson' | 'smoDomContainer' |
  'vexDomContainer' | 'title' | 'libraryUrl' | 'languageDir';

export type ConfigurationNumberOption = 'demonPollTime' | 'idleRedrawTime';

export var ConfigurationStringOptions: ConfigurationStringOption[] = ['smoPath', 'language', 'scoreLoadJson', 'smoDomContainer',
  'vexDomContainer', 'title', 'libraryUrl', 
  'languageDir'];

export var ConfigurationNumberOptions: ConfigurationNumberOption[] = ['demonPollTime', 'idleRedrawTime'];

export interface SmoConfigurationParams {
  mode: SmoMode;
  smoPath?: string;
  language: string;
  scoreLoadOrder: string[];
  scoreLoadJson?: string;
  smoDomContainer?: string;
  vexDomContainer?: string;
  title?: string;
  libraryUrl?: string;
  languageDir: string;
  demonPollTime: number; // how often we poll the score to see if it changed
  idleRedrawTime: number;
  ribbon?: RibbonConfiguration,
  keys?: KeyBindingConfiguration
}

/**
 * Configures smoosic library or application
 * @param smoPath - path to smoosic.js from html
 * @param language - startup language
 * @param scoreLoadOrder - default is ['query', 'local', 'library'],
 * @param scoreLoadJson - the library score JSON
 * @param smoDomContainer - the id of the parent element of application UI
 * @param vexDomContainer - the svg container
 * @param ribbon - launch the UI ribbon
 * @param keyCommands - start the key commands UI
 * @param menus - create the menu manager
 * @param title - the browser title
 * @param libraryUrl - loader URL for Smo libraries
 * @param languageDir - ltr or rtl
 * @param demonPollTime - how often we poll the score to see if it's changed
 * @param idleRedrawTime - how often the entire score re-renders
 */
 export class SmoConfiguration implements SmoRenderConfiguration, SmoUiConfiguration {
  mode: SmoMode;
  smoPath?: string;
  language: string = '';
  scoreLoadOrder: string[];
  scoreLoadJson?: string;
  smoDomContainer?: string;
  vexDomContainer?: string;
  title?: string;
  libraryUrl?: string;
  languageDir: string = 'ltr';
  demonPollTime: number = 0; // how often we poll the score to see if it changed
  idleRedrawTime: number = 0;
  ribbon?: RibbonConfiguration;
  keys?: KeyBindingConfiguration

  static get defaultConfig(): SmoConfiguration {
    return {
      smoPath: '..',
      mode: 'application',
      language: 'en',
      scoreLoadOrder: ['query', 'local', 'library'],
      scoreLoadJson: 'Smo.basicJson',
      smoDomContainer: 'smoo',
      vexDomContainer: 'boo',
      title: 'Smoosic',
      libraryUrl: 'https://aarondavidnewman.github.io/Smoosic/release/library/links/smoLibrary.json',
      languageDir: 'ltr',
      demonPollTime: 50, // how often we poll the score to see if it changed
      idleRedrawTime: 1000, // maximum time between score modification and render
    };
  }
  static get keyBindingDefaults(): KeyBindingConfiguration {
    const editorKeys = defaultEditorKeys.keys;
    const trackerKeys = defaultTrackerKeys.keys;
    editorKeys.forEach((key) => {
      key.module = 'keyCommands'
    });
    trackerKeys.forEach((key) => {
      key.module = 'tracker'
    });
    return { editorKeys, trackerKeys };
  }
  constructor(params: Partial<SmoConfigurationParams>) {
    const defs = SmoConfiguration.defaultConfig;
    ConfigurationStringOptions.forEach((param) => {
      const sp: string | undefined = params[param] ?? defs[param];
      this[param] = sp ?? '';
    });
    ConfigurationNumberOptions.forEach((param) => {
      this[param] = params[param] ?? defs[param];
    });
    this.mode = params.mode ?? defs.mode;
    this.scoreLoadOrder = params.scoreLoadOrder ?? defs.scoreLoadOrder;
    if (this.mode === 'application') {
      const ribbon = params.ribbon ?? { layout: defaultRibbonLayout.ribbons, buttons: defaultRibbonLayout.ribbonButtons };
      const keys = params.keys ?? SmoConfiguration.keyBindingDefaults;
      this.ribbon = ribbon;
      this.keys = keys;
    }
  }
}