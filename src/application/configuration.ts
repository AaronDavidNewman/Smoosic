// application/configuration.ts
/**
 * Superset of configuration required to initialize Smoosic, either the appliation or library.
 * @module configuration
 */
import { SmoRenderConfiguration } from "../render/sui/configuration";
import { SmoScore } from "../smo/data/score";
import { RibbonConfiguration } from "../ui/configuration";
import { ModalEventHandler } from "./common";
import { defaultRibbonLayout } from "../ui/ribbonLayout/default/defaultRibbon";
import { KeyBindingConfiguration } from "../ui/configuration";
import { defaultEditorKeys } from "../ui/keyBindings/default/editorKeys";
import { defaultTrackerKeys } from "../ui/keyBindings/default/trackerKeys";
import { SmoUiConfiguration } from "../ui/configuration";

export type SmoMode = 'library' | 'application' | 'translate';
export type SmoLoadType = 'local' | 'remote' | 'query';
export var SmoLoadTypes: SmoLoadType[] = ['local', 'remote', 'query'];
export type ConfigurationStringOption = 'smoPath' | 'language' | 'title' | 'libraryUrl' | 'languageDir';

export type ConfigurationNumberOption = 'demonPollTime' | 'idleRedrawTime';

export var ConfigurationStringOptions: ConfigurationStringOption[] = ['smoPath', 'language', 'title', 'libraryUrl', 
  'languageDir'];

export var ConfigurationNumberOptions: ConfigurationNumberOption[] = ['demonPollTime', 'idleRedrawTime'];

export interface SmoConfigurationParams {
  mode: SmoMode;
  smoPath?: string;
  language: string;
  scoreLoadOrder: string[];
  initialScore?: string | SmoScore;
  uiDomContainer?: string | HTMLElement;
  scoreDomContainer: string | HTMLElement;
  title?: string;
  libraryUrl?: string;
  languageDir: string;
  demonPollTime: number; // how often we poll the score to see if it changed
  idleRedrawTime: number;
  ribbon?: RibbonConfiguration,
  keys?: KeyBindingConfiguration,
  eventHandler?: ModalEventHandler
}

/**
 * Configures smoosic library or application
 * @param mode - score mode
 * @param smoPath - path to smoosic.js from html
 * @param scoreUrl - path (URL) to remote score
 * @param language - startup language
 * @param scoreLoadOrder - default is ['query', 'local', 'library']
 *   if you're going to load your own score, you can just leave the default.
 * @param scoreLoadJson - the library score JSON, if you are loading from a JSON string
 * @param uiDomContainer - the id of the parent element of application UI
 * @param scoreDomContainer - the svg container
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
  initialScore?: string | SmoScore;
  uiDomContainer?: string | HTMLElement;
  scoreDomContainer: string | HTMLElement = 'smoo';
  title?: string;
  libraryUrl?: string;
  languageDir: string = 'ltr';
  demonPollTime: number = 0; // how often we poll the score to see if it changed
  idleRedrawTime: number = 0;
  ribbon?: RibbonConfiguration;
  keys?: KeyBindingConfiguration
  eventHandler?: ModalEventHandler

  static get defaults(): SmoConfiguration {
    return {
      smoPath: '..',
      mode: 'application',
      language: 'en',
      scoreLoadOrder: ['query', 'local', 'library'],
      initialScore: 'Smo.basicJson',
      uiDomContainer: 'smoo',
      scoreDomContainer: 'boo',
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
    const defs = SmoConfiguration.defaults;
    ConfigurationStringOptions.forEach((param) => {
      const sp: string | undefined = params[param] ?? defs[param];
      this[param] = sp ?? '';
    });
    if (params.eventHandler) {
      this.eventHandler = params.eventHandler;
    }
    this.scoreDomContainer = params.scoreDomContainer ?? defs.scoreDomContainer;
    this.uiDomContainer = params.uiDomContainer ?? defs.uiDomContainer; 
    if (params.initialScore) {
      if (typeof(params.initialScore) === 'string') {
        this.initialScore = SmoScore.deserialize(params.initialScore);
      } else {
        this.initialScore = params.initialScore;
      }
    }
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