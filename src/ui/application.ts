// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../common/serializationHelpers';
import { suiController } from './controller';
import { SuiScoreRender } from '../render/sui/scoreRender';
import { suiMenuManager } from './menus';
import { SuiRenderDemon } from '../render/sui/layoutDemon';
import { SuiKeyCommands } from './keyCommands';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SmoScore } from '../smo/data/score';
import { SmoTranslationEditor } from './i18n/translationEditor';
import { SmoTranslator } from './i18n/language';
import { browserEventSource } from './eventSource';
import { suiOscillator } from '../render/audio/oscillator';
import { ArialFont } from '../styles/font_metrics/arial_metrics';
import { TimesFont } from '../styles/font_metrics/times_metrics';
import { Commissioner_MediumFont } from '../styles/font_metrics/Commissioner-Medium-Metrics';
import { Concert_OneFont } from '../styles/font_metrics/ConcertOne-Regular';
import { MerriweatherFont } from '../styles/font_metrics/Merriweather-Regular';
import { SourceSansProFont } from '../styles/font_metrics/ssp-sans-metrics';
import { SourceSerifProFont } from '../styles/font_metrics/ssp-serif-metrics';
import { _MidiWriter } from '../common/midiWriter';
import { SuiDom } from './dom';
import { librarySeed } from './fileio/library';

declare var SmoConfig : SmoConfiguration;

interface pairType { [key: string]: string }
export interface SmoConfiguration {
  smoPath?: string,
  language: string,
  scoreLoadOrder? : string[],
  scoreLoadJson?: string,
  smoDomContainer?: 'smoo',
  vexDomContainer?: 'boo',
  domSource?: ' SuiDom',
  ribbon?: true,
  keyCommands?: true,
  menus?: true,
  title?: 'Smoosic',
  libraryUrl?: 'https://aarondavidnewman.github.io/Smoosic/release/library/links/smoLibrary.json',
  languageDir: string,
  demonPollTime: number, // how often we poll the score to see if it changed
  idleRedrawTime: number
}

interface loadedScore {
  scorePath: string | null,
  score: SmoScore | null,
  mode: string
}
export interface controllerKeyBinding {
  event: string,
  key: string,
  ctrlKey: boolean,
  altKey: boolean,
  shiftKey: boolean,
  action: string
}
export interface controllerParams {
  keyBindingDefaults: controllerKeyBinding[],
  eventSource: browserEventSource
  view: SuiScoreViewOperations,
  keyCommands: SuiKeyCommands,
  layoutDemon: SuiRenderDemon,
  menus: suiMenuManager
}
const VF = eval('Vex.Flow');
const Smo = eval('globalThis.Smo');

/**
 * SuiScoreBuilder
 * create the initial score based on the query string/history
 */
export class SuiScoreBuilder {
  localScoreLoad(): loadedScore {
    var score = null;
    var scoreStr = localStorage.getItem(smoSerialize.localScore);
    if (scoreStr && scoreStr.length) {
      try {
        score = SmoScore.deserialize(scoreStr);
      } catch (exp) {
        console.log('could not parse ' + scoreStr);
      }
    }
    return { score, scorePath: null, mode: 'local' };
  }

  queryScoreLoad(): loadedScore | null {
    var i;
    if (window.location.search) {
      const cmd = window.location.search.substring(1, window.location.search.length);
      const cmds = cmd.split('&');
      for (i = 0; i < cmds.length; ++i) {
        const cmd = cmds[i];
        const pairs = SuiApplication._nvQueryPair(cmd);
        if (pairs.score) {
          try {
            const path = SuiApplication.scoreLibrary.find((pp) => pp.alias === pairs.score);
            if (!path) {
              return null;
            } else {
              return { scorePath: path.path, score: null, mode: 'remote' };
            }
          } catch (exp) {
            console.log('could not parse ' + exp);
          }
        } else if (pairs.lang) {
          SuiApplication._deferLanguageSelection(pairs.lang);
          return null;
        } else if (pairs.translate) {
          SuiApplication._deferCreateTranslator(pairs.translate);
          return null;
        }
        return null;
      }
    }
    return null;
  }
  libraryScoreLoad(): loadedScore {
    const score = SmoScore.deserialize(Smo.getClass(SmoConfig.scoreLoadJson));
    return { score, scorePath: null, mode: 'local' };
  }
}
/** SuiApplication
 * main entry point of application.  Based on the configuration,
 * either start the default UI, or initialize library mode and
 * await further instructions.
 */
export class SuiApplication {
  scoreLibrary: any;
  static get defaultConfig():SmoConfiguration {
    return {
      smoPath: '..',
      language: 'en',
      scoreLoadOrder: ['query', 'local', 'library'],
      scoreLoadJson: 'Smo.basicJson',
      smoDomContainer: 'smoo',
      vexDomContainer: 'boo',
      domSource: ' SuiDom',
      ribbon: true,
      keyCommands: true,
      menus: true,
      title: 'Smoosic',
      libraryUrl: 'https://aarondavidnewman.github.io/Smoosic/release/library/links/smoLibrary.json',
      languageDir: 'ltr',
      demonPollTime: 50, // how often we poll the score to see if it changed
      idleRedrawTime: 1000, // maximum time between score modification and render
    };
  }
  static configure(params: Partial<SmoConfiguration>) {
    const config: SmoConfiguration = SuiApplication.defaultConfig;
    Vex.Merge(config, params);
    (window as any).SmoConfig = config;
    SuiApplication.registerFonts();
  }

  constructor(params: any) {
    SuiApplication.configure(params);
    this.startApplication();
  }
  startApplication() {
    suiOscillator.samplePromise().then(() => {
      this._startApplication();
    });
  }
  _startApplication() {
    let i = 0;
    let loaded = false;
    // Initialize the midi writer library
    _MidiWriter();
    const config = (window as any).SmoConfig;
    for (i = 0; i < config.scoreLoadOrder.length; ++i) {
      const loader: string = config.scoreLoadOrder[i];
      let method = 'localScoreLoad' as keyof SuiScoreBuilder;
      if (loader === 'query') {
        method = 'queryScoreLoad' as keyof SuiScoreBuilder;
      } else if (loader === 'libraryScoreLoad') {
        method = 'libraryScoreLoad' as keyof SuiScoreBuilder;
      }
      const ssb = new SuiScoreBuilder();
      const ss: loadedScore | null = ssb[method]();
      if (ss && ss.score) {
        if (ss.mode === 'local') {
          loaded = true;
          this.createUi(ss.score);
        } else if (ss.score !== null) {
          const localScore = ssb.libraryScoreLoad();
          if (localScore.score === null) {
            return;
          }
          loaded = true;
          this.createUi(localScore.score);
          smoSerialize.loadRemoteFile(ss.scorePath);
        }
        break;
      }
    }
    if (loaded === false) {
      const scoreString = eval('globalThis.Smo.basicJson');
      const score = SmoScore.deserialize(scoreString);
      this.createUi(score);
    }
  }

  /**
   * Convenience constructor, take the score and render it in the
   * configured rendering space.
   * @param score(SmoScore) - the score
   */
  createUi(score: SmoScore) {
    SuiDom.createDom();
    const params: Partial<controllerParams> = {};
    params.keyBindingDefaults = suiController.keyBindingDefaults;
    params.eventSource = new browserEventSource(); // events come from the browser UI.
    const selector = typeof(SmoConfig.vexDomContainer) === 'undefined' ? '' : SmoConfig.vexDomContainer;

    const scoreRenderer = SuiScoreRender.createScoreRenderer(document.getElementById(
      selector), score);
    params.eventSource.setRenderElement(scoreRenderer.renderElement);
    params.view = new SuiScoreViewOperations(scoreRenderer, score, '.musicRelief');
    if (SmoConfig.keyCommands) {
      params.keyCommands = new SuiKeyCommands(params);
    }
    if (SmoConfig.menus) {
      params.menus = new suiMenuManager(params);
    }
    params.layoutDemon = new SuiRenderDemon(params);
    // Start the application event processing and render the initial score
    // eslint-disable-next-line
    new suiController(params);
    SuiDom.splash();
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

  static _nvQueryPair(str: string): pairType {
    var i = 0;
    const ar = str.split('=');
    const rv: pairType = {};
    for (i = 0; i < ar.length - 1; i += 2) {
      const name = decodeURIComponent(ar[i]);
      rv[name] = decodeURIComponent(ar[i + 1]);
    }
    return rv;
  }

  static get scoreLibrary(): librarySeed[] {
    return [
      { alias: 'bach', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/BachInvention.json' },
      { alias: 'yama', format: 'json', path: 'https://aarondavidnewman.github.io/Smoosic/release/library/Yama2.json' },
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
  static _deferCreateTranslator(lang: string) {
    setTimeout(() => {
      SmoTranslationEditor.startEditor(lang);
    }, 1);
  }

  static _deferLanguageSelection(lang: string) {
    setTimeout(() => {
      SmoTranslator.setLanguage(lang);
    }, 1);
  }
}