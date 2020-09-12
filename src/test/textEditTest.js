
class SuiTextEditor {
  static get attributes() {
    return ['svgText','context','x','y','text','textPos','selectionStart','selectionLength','empty'];
  }
  static get defaults() {
    return {
      svgText: null,
      context: null,
      x: 0,
      y: 0,
      text: '',
      textPos: 0,
      selectionStart: -1,
      selectionLength: 0,
      empty: true
    }
  }
  constructor(params) {
    Vex.Merge(this,SuiTextEditor.defaults);
    Vex.Merge(this,params);
    this.context = params.context;
  }
  _serviceCursor() {
    if (this.cursorState) {
      this.svgText.renderCursorAt(this.textPos);
    } else {
      this.svgText.removeCursor();
    }
    this.cursorState = !this.cursorState;
  }
  startCursorPromise() {
    var self = this;
    this.cursorRunning = true;
    this.cursorState = true;
    self.svgText.renderCursorAt(this.textPos);
    return new Promise((resolve) => {
      var checkit = () => {
        setTimeout(() => {
          if (self.cursorRunning === false) {
            self.svgText.removeCursor();
            resolve();
          }
          else {
            self._serviceCursor();
            checkit();
          }
        },333);
      }
      checkit();
    });
  }
  stopCursor() {
    this.cursorRunning = false;
  }
  moveCursorRight() {
    if (this.textPos < this.svgText.blocks.length) {
      this.textPos += 1;
    }
  }
  moveCursorLeft() {
    if (this.textPos > 0) {
      this.textPos -= 1;
    }
  }
  _updateSelections() {
    let i = 0;
    this.svgText.blocks.forEach((block) => {
      const end = this.selectionStart + this.selectionLength;
      const start =  this.selectionStart;
      const val = start >= 0 && i >= start && i < end;
      this.svgText.setHighlight(block,val);
      ++i;
    });
  }
  growSelectionRight() {
    if (this.selectionStart === -1 && this.textPos > 0) {
      this.selectionStart = this.textPos;
      this.textPos -= 1;
      this.selectionLength = 1;
    } else if (this.selectionStart > this.textPos) {
      this.selectionLength -= 1;
      if (this.selectionLength < 1) {
        this.selectionStart = -1;
      } else {
        this.textPos = this.selectionStart;
      }
    } else {
      if (this.selectionStart + this.selectionLength < this.svgText.blocks.length) {
        this.selectionLength += 1;
        this.textPos = this.selectionStart;
      }
    }
    this._updateSelections();
  }

  growSelectionLeft() {
    if (this.selectionStart === -1 && this.textPos > 0) {
      this.selectionStart = this.textPos - 1;
      this.selectionLength = 1;
    } else if (this.selectionStart + this.selectionLength < this.textPos) {
      this.selectionLength -= 1;
      if (this.selectionLength < 1) {
        this.selectionStart = -1;
      }
    } else {
      if (this.selectionStart > 0) {
        this.selectionLength += 1;
        this.selectionStart -= 1;
      }
    }
    this._updateSelections();
  }

  clearSelections() {
    this.selectionStart = -1;
    this.selectionLength = 0;
  }

  deleteSelections() {
    const blockPos = this.selectionStart;
    for (var i = 0;blockPos >= 0 && i < this.selectionStart; ++i) {
      this.svgText.removeBlockAt(blockPos); // delete shifts blocks so keep index the same.
    }
    this.textPos = blockPos;
  }

  parseBlocks() {
    this.svgText = new SuiInlineText({ context: this.context });
    for (var i =0;i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i,this.text[i]);
    }
    this.textPos = this.text.length - 1;
  }
}

class SuiLyricEditor extends SuiTextEditor {
  parseBlocks() {
    this.svgText = new SuiInlineText({ context: this.context,startX: this.x, startY: this.y });
    for (var i =0;i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i,{text:this.text[i]});
      this.empty = false;
    }
    this.textPos = this.text.length - 1;
  }

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params) {
    super(params);
    this.text = params.lyric._text;
    this.sessionNotifier = params.sessionNotifier;
    this.parseBlocks();
  }

  evKey(evdata) {
    if (evdata.code === 'ArrowRight') {
      if (evdata.shiftKey) {
        this.growSelectionRight();
      } else {
        this.moveCursorRight();
      }
      this.svgText.render();
      return;
    }
    if (evdata.code === 'ArrowLeft') {
      if (evdata.shiftKey) {
        this.growSelectionLeft();
      } else {
        this.moveCursorLeft();
      }
      this.svgText.render();
      return;
    }
    var str = evdata.key;
    if (evdata.key === '-' || evdata.key === ' ') {
      // skip
    }
    else if (evdata.key.charCodeAt(0) >= 33 && evdata.key.charCodeAt(0) <= 126 ) {
      if (this.empty) {
        this.svgText.removeBlockAt(0);
        this.empty = false;
        this.svgText.addTextBlockAt(0,{text: evdata.key});
        this.textPos = 0;
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelected();
        }
        this.textPos += 1;
        this.svgText.addTextBlockAt(this.textPos,{ text: evdata.key});
      }
      this.svgText.render();
    }
  }
}

class TextEditTest {

	static async CommonTests() {

    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
		var score = keys.layout.score;
		var layout = keys.layout;
    var testTime = 500;

		// score.addDefaultMeasureWithNotes(0, {});

    var keydownHandler = application.controller.eventSource.bindKeydownHandler(this,'evKey');
    var lyric =  new SmoLyric({_text:'' });
    var editor = new SuiLyricEditor({context : keys.layout.context,
      lyric:lyric,x: 100,y:40});
    var cursorPromise = editor.startCursorPromise();

		var timeTest = () => {
      // layout.forceRender();

  		const promise = new Promise((resolve, reject) => {
   			setTimeout(() => {
   				resolve();
        }, testTime);
    		});
    		return promise;
	  }

		var subTitle = (txt) => {
			$('.subTitle').text(txt);
		}

		var signalComplete = () => {
			subTitle('');
			return timeTest();
		}
    var makekey = (data) => {
      var rv = {
        shift:false,
        ctrl: false,
        alt:false,
        key:'',
        code:''
      };

      Vex.Merge(rv,data);
      return rv;
    }

    var tests = [];

    tests.push( async () => {
      subTitle('lyricEditTest1');
      editor.evKey(makekey({'key':'a'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('lyricEditTest1');
      editor.evKey(makekey({'key':'c'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('lyricEditTest1');
      editor.evKey(makekey({'code':'ArrowLeft'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('lyricEditTest1');
      editor.evKey(makekey({'key':'b'}));
      editor.evKey(makekey({'key':'b'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('lyricEditTest1');
      editor.evKey(makekey({'code':'ArrowRight',shiftKey: true}));
      return timeTest();
    });

    tests.push( async () =>  {
      editor.stopCursor();
      return cursorPromise;
    });

    let result;
    for (const f of tests) {
      result = await f(result);
    }

		return result;
	}
}
