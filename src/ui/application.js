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
import { mxmlScore } from '../smo/mxml/xmlScore';

// eslint-disable-next-line
import { basicJson } from '../music/basic';
import { SuiDom } from './dom';

const VF = Vex.Flow;

// eslint-disable-next-line no-unused-vars
export class SuiApplication {
  static get defaultConfig() {
    return {
      smoPath: '..',
      language: 'en',
      scoreLoadOrder: ['query', 'local', 'library'],
      scoreLoadJson: 'Smo.basicJson',
      eventsSource: 'browserEventSource',
      controller: 'suiController',
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
  static configure(params) {
    const config = {};
    Vex.Merge(config, SuiApplication.defaultConfig);
    Vex.Merge(config, params);
    window.SmoConfig = config;
    SuiApplication.registerFonts();
  }

  constructor(params) {
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
    // Initialize the midi writer library
    _MidiWriter();
    for (i = 0; i < SmoConfig.scoreLoadOrder.length; ++i) {
      const loader = SmoConfig.scoreLoadOrder[i];
      const method = loader + 'ScoreLoad';
      const ss = this[method]();
      const des = SmoScore.deserialize;
      const xparse = mxmlScore.smoScoreFromXml;
      if (ss && ss.score) {
        if (ss.mode === 'local') {
          this.createUi(ss.score);
        } else {
          const localScore = this.libraryScoreLoad();
          this.createUi(localScore.score);
          smoSerialize.loadRemoteFile(ss.score.path, (scoreText) => {
            if (ss.score.format === 'json') {
              const remoteScore = des(scoreText);
              this.view.changeScore(remoteScore);
            } else {
              const parser = new DOMParser();
              const xml = parser.parseFromString(scoreText, 'text/xml');
              const remoteScore = xparse(xml);
              this.view.changeScore(remoteScore);
            }
          });
        }
        break;
      }
    }
  }

  // ## createUi
  // ### Description:
  // Convenience constructor, taking a renderElement and a score.
  createUi(score) {
    eval('Smo.' + SmoConfig.domSource).createDom();
    const params = suiController.keyBindingDefaults;
    params.eventSource = new browserEventSource(); // events come from the browser UI.

    const scoreRenderer = SuiScoreRender.createScoreRenderer(document.getElementById(SmoConfig.vexDomContainer), score);
    params.eventSource.setRenderElement(scoreRenderer.renderElement);
    params.view = new SuiScoreViewOperations(scoreRenderer, score, '.musicRelief');
    this.view = params.view;
    if (SmoConfig.keyCommands) {
      params.keyCommands = new SuiKeyCommands(params);
    }
    if (SmoConfig.menus) {
      params.menus = new suiMenuManager(params);
    }
    params.layoutDemon = new SuiRenderDemon(params);
    const controller = new suiController(params);
    SuiDom.splash();
    this.controller = controller;
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

  static _nvQueryPair(str) {
    var i = 0;
    const ar = str.split('=');
    const rv = {};
    for (i =  0; i < ar.length - 1; i += 2) {
      const name = decodeURIComponent(ar[i]);
      rv[name] = decodeURIComponent(ar[i + 1]);
    }
    return rv;
  }

  static get scoreLibrary() {
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

  localScoreLoad() {
    var score = null;
    var scoreStr = localStorage.getItem(smoSerialize.localScore);
    if (scoreStr && scoreStr.length) {
      try {
        score = SmoScore.deserialize(scoreStr);
      } catch (exp) {
        console.log('could not parse ' + scoreStr);
      }
    }
    return { score, mode: 'local' };
  }

  queryScoreLoad() {
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
              return { score: path, mode: 'remote' };
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

  static _deferCreateTranslator(lang) {
    setTimeout(() => {
      SmoTranslationEditor.startEditor(lang);
    }, 1);
  }

  static _deferLanguageSelection(lang) {
    setTimeout(() => {
      SmoTranslator.setLanguage(lang);
    }, 1);
  }

  libraryScoreLoad() {
    const score = SmoScore.deserialize(eval(SmoConfig.scoreLoadJson));
    return { score, mode: 'local' };
  }
}
