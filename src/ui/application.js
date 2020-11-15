class SuiApplication {

  static createUtApplication(config) {
    if (!config) {
      config = {};
    }
    var _config = {
      scoreLoadOrder:['library'],
      scoreLoadJson:'emptyScoreJson',
      ribbon:false,
      keyCommands:false,
      menus:false,
      controller:'utController',
      domSource:'UtDom',
      languageDir:'ltr'
    };
    Vex.Merge(_config,config);
    return new SuiApplication(_config);
  }
  static get defaultConfig() {
    return {
      smoPath:'..',
      language:'en',
      scoreLoadOrder:['query','local','library'],
      scoreLoadJson:'basicJson',
      eventsSource:'browserEventSource',
      controller:'suiController',
      smoDomContainer:'smoo',
      vexDomContainer:'boo',
      domSource:'SuiDom',
      ribbon:true,
      keyCommands:true,
      menus:true,
      title:'Smoosic',
      languageDir:'ltr'
    }
  }

  constructor(params) {
    var config = {};
    Vex.Merge(config,SuiApplication.defaultConfig);
    Vex.Merge(config,params);
    window.SmoConfig = config;
    this.registerFonts();
    this.start();
    // const self = this;
    // Sample-based playback, experimental
    // suiOscillator.samplePromise().then(() => {
    //   self.start();
    // });
  }

  // ## createUi
  // ### Description:
  // Convenience constructor, taking a renderElement and a score.
  createUi(score) {
    eval(SmoConfig.domSource).createDom();
    var params = suiController.keyBindingDefaults;
    params.eventSource = new browserEventSource(); // events come from the browser UI.

    params.layout = SuiRenderScore.createScoreRenderer(document.getElementById(SmoConfig.vexDomContainer),score);
    params.eventSource.setRenderElement(params.layout.renderElement);
    params.scroller = new suiScroller();
    params.tracker = new suiTracker(params.layout,params.scroller);
    params.layout.setMeasureMapper(params.tracker);
    if (SmoConfig.keyCommands) {
      params.keyCommands = new SuiKeyCommands(params);
    }
    if (SmoConfig.menus) {
      params.menus = new suiMenuManager(params);
    }
    params.layoutDemon = new SuiRenderDemon(params);
    var ctor = eval(SmoConfig.controller);
    var controller = new ctor(params);
    if (SmoConfig.menus) {
      params.menus.undoBuffer = controller.undoBuffer;
    }
    params.layout.score = score;
    eval(SmoConfig.domSource).splash();
    this.controller = controller;
  }
  registerFonts() {
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
      description: 'Built-in sans font',
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
    var ar = str.split('=');
    var rv = {};
    for (var i =  0;i < ar.length - 1;i += 2) {
      var name = decodeURIComponent(ar[i]);
      rv[name] = decodeURIComponent(ar[i+1]);
    }
    return rv;
  }
  start() {
    var score = null;
    for (var i = 0;i < SmoConfig.scoreLoadOrder.length; ++i) {
      var loader = SmoConfig.scoreLoadOrder[i];
      var method = loader+'ScoreLoad';
      var ss = this[method]();
      if (ss) {
        score = ss;
        break;
      }
    }
    var controller =this.createUi(score);
  }

  localScoreLoad() {
    var score = null;
    var scoreStr = localStorage.getItem(smoSerialize.localScore);
    if (scoreStr && scoreStr.length) {
      try {
        score = SmoScore.deserialize(scoreStr);
      } catch (exp) {
        console.log('could not parse '+scoreStr);
      }
    }
    return score;
  }

  queryScoreLoad() {
    var score = null;
    if (window.location.search) {
      var cmd = window.location.search.substring(1,window.location.search.length);
      var cmds = cmd.split('&');
      cmds.forEach((cmd) => {
        var pairs = SuiApplication._nvQueryPair(cmd);
        if (pairs['score']) {
          try {
            score = SmoScore.deserialize(eval(pairs['score']));
          } catch (exp) {
            console.log('could not parse '+exp);
          }
        } else if (pairs['lang']) {
          SuiApplication._deferLanguageSelection(pairs['lang']);
        } else if (pairs['translate']) {
          SuiApplication._deferCreateTranslator(pairs['translate']);
        }
      });
    }
    return score;
  }

  static _deferCreateTranslator(lang) {
    setTimeout(() => {
      var transDom =  SmoTranslationEditor.startEditor(lang);
    },1);
  }

  static _deferLanguageSelection(lang) {
    setTimeout(function() {
      SmoTranslator.setLanguage(lang);
    },1);
  }

  libraryScoreLoad() {
    if (typeof(SmoConfig.scoreLoadJson) != 'undefined') {
      return SmoScore.deserialize(eval(SmoConfig.scoreLoadJson));
    }
  }

}
