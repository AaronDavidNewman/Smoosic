// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../common/serializationHelpers';
import { _MidiWriter } from '../common/midiWriter';

import { SmoConfiguration, SmoConfigurationParams } from './configuration';
import { SmoScore } from '../smo/data/score';
import { UndoBuffer } from '../smo/xform/undo';
import { XmlToSmo } from '../smo/mxml/xmlToSmo';
import { SuiScoreRender } from '../render/sui/scoreRender';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SuiOscillator } from '../render/audio/oscillator';
import { SuiTracker } from '../render/sui/tracker';

import { ArialFont } from '../styles/font_metrics/arial_metrics';
import { TimesFont } from '../styles/font_metrics/times_metrics';
import { Commissioner_MediumFont } from '../styles/font_metrics/Commissioner-Medium-Metrics';
import { Concert_OneFont } from '../styles/font_metrics/ConcertOne-Regular';
import { MerriweatherFont } from '../styles/font_metrics/Merriweather-Regular';
import { SourceSansProFont } from '../styles/font_metrics/ssp-sans-metrics';
import { SourceSerifProFont } from '../styles/font_metrics/ssp-serif-metrics';

import { SuiXhrLoader } from '../ui/fileio/xhrLoader';
import { SuiMenuManager } from '../ui/menus/manager';
import { BrowserEventSource } from '../ui/eventSource';
import { librarySeed } from '../ui/fileio/library';
import { SmoTranslationEditor } from '../ui/i18n/translationEditor';
import { SmoTranslator } from '../ui/i18n/language';
import { RibbonButtons } from '../ui/buttons/ribbon';
import { defaultRibbonLayout } from '../ui/ribbonLayout/default/defaultRibbon';
import { PromiseHelpers } from '../common/promiseHelpers';
import { SuiDom } from './dom';
import { SuiKeyCommands } from './keyCommands';
import { SuiEventHandler } from './eventHandler';
import { KeyBinding, ModalEventHandlerProxy } from './common';
import { SmoMeasure } from '../../typedoc';
import { getDomContainer } from '../common/htmlHelpers';

declare var $: any;

interface pairType { [key: string]: string }

/**
 * Score renderer instance
 * @internal
 */
export interface SuiRendererInstance {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  undoBuffer: UndoBuffer;
  renderer: SuiScoreRender;
}
/**
 * Global instance for debugging
 */
export interface SuiInstance {
  view: SuiScoreViewOperations;
  eventSource: BrowserEventSource;
  undoBuffer: UndoBuffer;
  tracker: SuiTracker;
  keyCommands: SuiKeyCommands;
  menus: SuiMenuManager;
  eventHandler: SuiEventHandler;
  ribbon: RibbonButtons
}
const VF = eval('Vex.Flow');

/**
 * Parse query string for application
 * @category AppUtil
 */
export class QueryParser {
  pairs: pairType[] = [];
  queryPair(str: string): pairType {
    var i = 0;
    const ar = str.split('=');
    const rv: pairType = {};
    for (i = 0; i < ar.length - 1; i += 2) {
      const name = decodeURIComponent(ar[i]);
      rv[name] = decodeURIComponent(ar[i + 1]);
    }
    return rv;
  }
  constructor() {
    let i: number = 0;
    if (window.location.search) {
      const cmd = window.location.search.substring(1, window.location.search.length);
      const cmds = cmd.split('&');
      for (i = 0; i < cmds.length; ++i) {
        const cmd = cmds[i];
        this.pairs.push(this.queryPair(cmd));
      }
    }
  }
}

/** SuiApplication
 * main entry point of application.  Based on the configuration,
 * either start the default UI, or initialize library mode and
 * await further instructions.
 * @category SuiApplication
 */
export class SuiApplication {
  scoreLibrary: any;
  instance: SuiInstance | null = null;
  config: SmoConfiguration;
  score: SmoScore | null = null;
  view: SuiScoreViewOperations | null = null;
  domElement: HTMLElement;
  static configure(params: Partial<SmoConfigurationParams>): Promise<SuiApplication> {
    const config: SmoConfiguration = new SmoConfiguration(params);
    (window as any).SmoConfig = config;
    const application = new SuiApplication(config);
    SuiApplication.registerFonts();
    return application.initialize();
  }
  constructor(config: SmoConfiguration) {
    this.config = config;
    this.domElement = this._getDomContainer();
  }
  _getDomContainer(): HTMLElement {
    const el = getDomContainer(this.config.scoreDomContainer);
    if (typeof(el) === 'undefined') {
      throw 'scoreDomContainer is a required config parameter';
    }
    return el;
  }
  static instance: SuiInstance;
  /** 
  // Different applications can create their own key bindings, these are the defaults.
  // Many editor commands can be reached by a single keystroke.  For more advanced things there
  // are menus.
  */
  static get keyBindingDefaults(): KeyBinding[] {
    var editorKeys = SuiEventHandler.editorKeyBindingDefaults;
    editorKeys.forEach((key) => {
      key.module = 'keyCommands'
    });
    var trackerKeys = SuiEventHandler.trackerKeyBindingDefaults;
    trackerKeys.forEach((key) => {
      key.module = 'tracker'
    });
    return trackerKeys.concat(editorKeys);
  }
  /**
   * Initialize the library according to instruction in config object:
   * 1.  Try to load a new score
   * 2.  If in application mode, start the UI.  If in translation mode, start translation
   * @returns 
   */
  initialize(): Promise<SuiApplication> {
    const samplePromise: Promise<any> = SuiOscillator.sampleFiles.length > 0 ?
      SuiOscillator.samplePromise() : PromiseHelpers.emptyPromise();

    const self = this;
    const createScore = (): Promise<any> => {
      return self.createScore();
    }
    const startApplication = () => {
      if (self.config.mode === 'translate') {
        self._startApplication();
      }
      else if (self.config.mode === 'application') {
        self._startApplication();
      } else {  // library mode.
        self.createView(self.score!);
      }
    }
    const render = () => {
      return self.view?.renderer.renderPromise();
    }
    const rv = new Promise<SuiApplication>((resolve: any) => {
      samplePromise.then(createScore).then(startApplication).then(render)
        .then(
          () => {
            resolve(self);
          });
    });
    return rv;
  }
  /**
   * Create the initial score we use to populate the UI etc:
   * 0. if translation mode, return empty promise, it won't be used anyway
   * 1. if remoteScore is set in config, try to load from remote
   * 2. if initialScore is set, use that
   * 3. if a score is saved locally with quick save (browser local cache), use that
   * 4. if all else fails, return an 'empty' score.
   * @returns promise for a remote load.  If a local load, will resolve immediately
   */
  createScore(): Promise<any> {
    if (this.config.mode === 'translate') {
      return PromiseHelpers.emptyPromise();
    }
    if (this.config.remoteScore) {
      const loader = new SuiXhrLoader(this.config.remoteScore);
      const self = this;
      return new Promise((resolve: any) => {
        loader.loadAsync().then(() => {
          self.score = this._tryParse(loader.value);
          resolve(self);
        });
      });
    } else if (this.config.initialScore) {
      if (typeof(this.config.initialScore) === 'string') {
        this.score = this._tryParse(this.config.initialScore);
        return PromiseHelpers.emptyPromise();
      } else {
        this.score = this.config.initialScore;
        return PromiseHelpers.emptyPromise();
      }
    } else {
      const localScore = localStorage.getItem(smoSerialize.localScore);
      if (localScore) {
        this.score = this._tryParse(localScore);
      } else {
        this.score = SmoScore.getDefaultScore(SmoScore.defaults, null);
      }
    }
    return PromiseHelpers.emptyPromise();
  }
  _tryParse(scoreJson: string) {
    try {
      if (scoreJson[0] === '<') {
        const parser = new DOMParser();
        const xml = parser.parseFromString(scoreJson, 'text/xml');
        return XmlToSmo.convert(xml);
      }
      return SmoScore.deserialize(scoreJson);
    } catch (exp) {
      console.warn('could not parse score');
      return SmoScore.getDefaultScore(SmoScore.defaults, SmoMeasure.defaults);
    }
  }
  _startApplication() {
    // Initialize the midi writer library
    _MidiWriter();
    const queryString = new QueryParser();
    const languageSelect = queryString.pairs.find((x) => x['language']) ?? {'language': 'en'}
    if (this.config.mode === 'translate') {
      this._deferCreateTranslator();
      return;
    }
    if (languageSelect) {
      SuiApplication._deferLanguageSelection(languageSelect.language);
    }
    this.createUi();
  }
  createView(score: SmoScore): SuiRendererInstance | null {
    let sdc: HTMLElement = this.domElement;
    const svgContainer = document.createElement('div');
    $(svgContainer).attr('id', 'boo').addClass('musicContainer');
    $(sdc).append(svgContainer);
    const renderer = SuiScoreRender.createScoreRenderer(this.config, svgContainer, score);
    const eventSource = new BrowserEventSource();
    const undoBuffer = new UndoBuffer();
    eventSource.setRenderElement(renderer.renderElement);
    const view = new SuiScoreViewOperations(this.config, renderer, score, sdc as HTMLElement, undoBuffer);
    this.view = view;
    view.startRenderingEngine();
    return {
      view, eventSource, undoBuffer, renderer
    };
  }
  /**
   * Convenience constructor, take the score and render it in the
   * configured rendering space.
   */
  createUi() {
    const viewObj: SuiRendererInstance | null = this.createView(this.score!);
    if (!viewObj) {
      return;
    }
    const view = this.view!;
    const tracker = view.tracker;
    const eventSource = new BrowserEventSource(); // events come from the browser UI.
    const undoBuffer = viewObj.undoBuffer;
    const completeNotifier = new ModalEventHandlerProxy(eventSource);
    // hack...this is set up in UiDom.  Should menu manager just make it?
    // const menuContainer = $('.menuContainer')[0] as HTMLElement;
    const menus = new SuiMenuManager({
      view, eventSource, completeNotifier, undoBuffer
    });
    const ribbon = new RibbonButtons({
      config: this.config,
      ribbons: defaultRibbonLayout.ribbons,
      ribbonButtons: defaultRibbonLayout.ribbonButtons,
      menus: menus,
      completeNotifier,
      view: view,
      eventSource: eventSource,
      tracker: view.tracker
    });
    const keyCommands = new SuiKeyCommands ({
      view, slashMode: true, completeNotifier, tracker, eventSource
    });
    const eventHandler = new SuiEventHandler({
      view, eventSource, tracker, keyCommands, menus, completeNotifier,
      keyBindings: SuiApplication.keyBindingDefaults, config: this.config
    });
    this.instance = {
      view, eventSource, eventHandler, undoBuffer,
      tracker, ribbon, keyCommands, menus
    }
    SuiApplication.instance = this.instance;
    completeNotifier.handler = eventHandler;
    eventSource.setRenderElement(view.renderer.renderElement);
    // eslint-disable-next-line
    SuiApplication.instance = this.instance;
    ribbon.display();
    SuiDom.splash(this.config);
  }
  static registerFonts() {
    VF.TextFont.registerFont({
      name: ArialFont.name,
      resolution: ArialFont.resolution,
      glyphs: ArialFont.glyphs,
      family: ArialFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: true,
      bold: true,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Built-in sans font',
    });
    VF.TextFont.registerFont({
      name: TimesFont.name,
      resolution: TimesFont.resolution,
      glyphs: TimesFont.glyphs,
      family: TimesFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: true,
      bold: true,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Built-in serif font',
    });
    VF.TextFont.registerFont({
      name: Commissioner_MediumFont.name,
      resolution: Commissioner_MediumFont.resolution,
      glyphs: Commissioner_MediumFont.glyphs,
      family: Commissioner_MediumFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: false,
      bold: false,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Low-contrast sans-serif text font',
    });
    VF.TextFont.registerFont({
      name: Concert_OneFont.name,
      resolution: Concert_OneFont.resolution,
      glyphs: Concert_OneFont.glyphs,
      family: Concert_OneFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: false,
      bold: false,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Rounded grotesque typeface inspired by 19th century 3D l',
    });
    VF.TextFont.registerFont({
      name: MerriweatherFont.name,
      resolution: MerriweatherFont.resolution,
      glyphs: MerriweatherFont.glyphs,
      family: MerriweatherFont.fontFamily,
      serifs: true,
      monospaced: false,
      italic: false,
      bold: false,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Serif screen font from Sorkin Type',
    });
    VF.TextFont.registerFont({
      name: SourceSansProFont.name,
      resolution: SourceSansProFont.resolution,
      glyphs: SourceSansProFont.glyphs,
      family: SourceSansProFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: false,
      bold: false,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Open source Sans screen font from Adobe',
    });
    VF.TextFont.registerFont({
      name: SourceSerifProFont.name,
      resolution: SourceSerifProFont.resolution,
      glyphs: SourceSerifProFont.glyphs,
      family: SourceSerifProFont.fontFamily,
      serifs: false,
      monospaced: false,
      italic: false,
      bold: false,
      maxSizeGlyph: 'H',
      superscriptOffset: 0.66,
      subscriptOffset: 0.66,
      description: 'Open source Serif screen font from Adobe',
    });
  }

  static get scoreLibrary(): librarySeed[] {
    return [
      { alias: 'bach', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/BachInvention.json' },
      { alias: 'yama', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Yama2.json' },
      { alias: 'bachcantata', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/BachCantataBMV68.json'},
      { alias: 'handel', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Messiah Pt 1-1.json' },
      { alias: 'bambino', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Gesu Bambino.json' },
      { alias: 'shade', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Shade.json' },
      { alias: 'postillion', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Postillionlied.json' },
      { alias: 'preciousLord', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Precious Lord.json' },
      { alias: 'dichterliebe', format: 'xml', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Dichterliebe01.xml' },
      { alias: 'beethoven', format: 'xml', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Beethoven_AnDieFerneGeliebte.xml' },
      { alias: 'mozart', format: 'xml', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Mozart_AnChloe.xml' },
      { alias: 'joplin', format: 'xml', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/ScottJoplin_The_Entertainer.xml' }
    ];
  }
  _deferCreateTranslator() {
    SuiDom.createUiDom(this.config.scoreDomContainer);
    setTimeout(() => {
      SmoTranslationEditor.startEditor(this.config.language);
    }, 1);
  }

  static _deferLanguageSelection(lang: string) {
    setTimeout(() => {
      SmoTranslator.setLanguage(lang);
    }, 1);
  }
}
