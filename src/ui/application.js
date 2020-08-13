class SuiApplication {

  static createUtApplication(config) {
    if (!config) {
      config = {};
    }
    var _config = {
      scoreLoadOrder:['library'],
      scoreLoadJson:'emptyScoreJson',
      ribon:false,
      editor:false,
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
      editor:true,
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
    this.start();
  }
  // ## createUi
  // ### Description:
  // Convenience constructor, taking a renderElement and a score.
  createUi(score) {
    eval(SmoConfig.domSource).createDom();
    var params = suiController.keyBindingDefaults;
    params.eventSource = new browserEventSource(); // events come from the browser UI.

    params.layout = suiScoreLayout.createScoreLayout(document.getElementById(SmoConfig.vexDomContainer),score);
    params.scroller = new suiScroller();
    params.tracker = new suiTracker(params.layout,params.scroller);
    params.layout.setMeasureMapper(params.tracker);
    if (SmoConfig.editor) {
      params.editor = new suiEditor(params);
    }
    if (SmoConfig.menus) {
      params.menus = new suiMenuManager(params);
    }
    params.layoutDemon = new SuiLayoutDemon(params);
    var ctor = eval(SmoConfig.controller);
    var controller = new ctor(params);
    if (SmoConfig.menus) {
      params.menus.undoBuffer = controller.undoBuffer;
    }
    params.layout.score = score;
    eval(SmoConfig.domSource).splash();
    this.controller = controller;
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
