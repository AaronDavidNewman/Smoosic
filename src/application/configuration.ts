// application/configuration.ts
/**
 * Superset of configuration required to initialize Smoosic, either the appliation or library.
 * @module configuration
 */
import { SmoRenderConfiguration } from "../render/sui/configuration";
import { SmoScore } from "../smo/data/score";
import { ModalEventHandler } from "./common";
import { KeyBindingConfiguration, SmoUiConfiguration } from "../ui/configuration";
import { defaultEditorKeys } from "../ui/keyBindings/default/editorKeys";
import { defaultTrackerKeys } from "../ui/keyBindings/default/trackerKeys";
import { RibbonLayout } from "../ui/common";
import { ButtonDefinition } from "../ui/buttons/button";
import { defaultRibbonLayout } from '../ui/ribbonLayout/default/defaultRibbon';
import { SuiAudioAnimationParams, defaultAudioAnimationHandler, defaultClearAudioAnimationHandler, AudioAnimationHandler, ClearAudioAnimationHandler } 
  from "../render/audio/musicCursor";

export type SmoMode = 'library' | 'application' | 'translate';
export type ConfigurationStringOption = 'language' | 'libraryUrl' | 'remoteScore';

export type ConfigurationNumberOption = 'demonPollTime' | 'idleRedrawTime';

export var ConfigurationStringOptions: ConfigurationStringOption[] = ['language', 'libraryUrl', 'remoteScore'];

export var ConfigurationNumberOptions: ConfigurationNumberOption[] = ['demonPollTime', 'idleRedrawTime'];

/**
 * Application configuration parameters, can be referenced by the running application or changed
 * @category SuiApplication
 */
export interface SmoConfigurationParams {
  mode: SmoMode;
  smoPath?: string;
  language: string;
  initialScore?: string | SmoScore;
  remoteScore?: string;
  scoreDomContainer: string | HTMLElement;
  leftControls?: string | HTMLElement;
  topControls?: string | HTMLElement;
  libraryUrl?: string;
  demonPollTime: number; // how often we poll the score to see if it changed
  idleRedrawTime: number;
  ribbonLayout?: RibbonLayout;
  buttonDefinition?: ButtonDefinition[];
  audioAnimation: SuiAudioAnimationParams;
}

/**
 * Configures smoosic library or application. It is a union of UI, rendering and application configuration parameters
 * @param mode - score mode `'library' | 'application' | 'translate'`
 *   Library mode starts the view but not the UI.  application mode starts the UI and expects UI parameters.
 *   translation mode is the translation editor, for creating translations for dialog/menu components
 * @param language - startup language
 * @param initialScore? - the library score JSON, if you are loading from a JSON string, or a SmoScore object
 * @param remoteScore? - path to a remote score, if loading from an URL
 * @param scoreDomContainer - the parent of the svg container (required)
 * @param leftControls - the location of the vertical button control, applies if mode is 'application'
 * @param topControls - the location of the horizontal button control, applies if mode is 'application'
 * @param libraryUrl - loader URL for Smo libraries, applies if application mode
 * @param demonPollTime - how often we poll the score to see if it's changed
 * @param idleRedrawTime - how often the entire score re-renders
 * @category SuiApplication
 */
 export class SmoConfiguration implements SmoRenderConfiguration, SmoUiConfiguration {
  mode: SmoMode;
  language: string = '';
  initialScore?: string | SmoScore;
  remoteScore?: string;
  leftControls?: string | HTMLElement;
  topControls?: string | HTMLElement;
  scoreDomContainer: string | HTMLElement;
  libraryUrl?: string;
  demonPollTime: number = 0; // how often we poll the score to see if it changed
  idleRedrawTime: number = 0;
  keys?: KeyBindingConfiguration;
  eventHandler?: ModalEventHandler;
  ribbonLayout: RibbonLayout;
  audioAnimation: SuiAudioAnimationParams;
  buttonDefinition: ButtonDefinition[];

  static get defaults(): SmoConfiguration {
    return {
      mode: 'application',
      language: 'en',
      scoreDomContainer: 'boo',
      libraryUrl: 'https://aarondavidnewman.github.io/Smoosic/release/library/links/smoLibrary.json',
      demonPollTime: 50, // how often we poll the score to see if it changed
      idleRedrawTime: 1000, // maximum time between score modification and render
      ribbonLayout: defaultRibbonLayout.ribbons,
      buttonDefinition: defaultRibbonLayout.ribbonButtons,
      audioAnimation: {
        audioAnimationHandler: defaultAudioAnimationHandler,
        clearAudioAnimationHandler: defaultClearAudioAnimationHandler
      }
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
    this.scoreDomContainer = params.scoreDomContainer ?? defs.scoreDomContainer;
    this.initialScore = params.initialScore ?? undefined;
    ConfigurationNumberOptions.forEach((param) => {
      this[param] = params[param] ?? defs[param];
    });
    this.mode = params.mode ?? defs.mode;
    if (this.mode === 'application') {
      this.leftControls = params.leftControls;
      this.topControls = params.topControls;
    }
    this.ribbonLayout = params.ribbonLayout ? params.ribbonLayout: defaultRibbonLayout.ribbons;
    this.buttonDefinition = params.buttonDefinition ? params.buttonDefinition : defaultRibbonLayout.ribbonButtons;
    if (!params.ribbonLayout) {
      this.ribbonLayout = defaultRibbonLayout.ribbons;
    }
    if (!params.buttonDefinition) {
      this.buttonDefinition = defaultRibbonLayout.ribbonButtons;
    }
    if (!params.audioAnimation) {
      this.audioAnimation = SmoConfiguration.defaults.audioAnimation;
    } else {
      this.audioAnimation = params.audioAnimation;
    }
  }
}