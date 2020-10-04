

class TextEditTest {

	static async CommonTests() {

    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
		var score = keys.layout.score;
		var layout = keys.layout;
    var testTime = 200;
    var eventSource = new browserEventSource();

		// score.addDefaultMeasureWithNotes(0, {});

    var lyric =  new SmoLyric({_text:'' });
    var editor = new SuiLyricEditor(
      {context : keys.layout.context,
      lyric:lyric,
      x: 100,
      y:40,
      scroller:
      keys.scroller});
    var cursorPromise = editor.startCursorPromise();
    var lyricSession = null;

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
      subTitle('key: a');
      editor.evKey(makekey({'key':'a'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('key: c');
      editor.evKey(makekey({'key':'c'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('left arrow');
      editor.evKey(makekey({'code':'ArrowLeft'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('keys: bb');
      editor.evKey(makekey({'key':'b'}));
      editor.evKey(makekey({'key':'b'}));
      return timeTest();
    });

    tests.push( async () => {
      subTitle('shift-left sel. 2nd b');
      editor.evKey(makekey({'code':'ArrowLeft',shiftKey: true}));
      return timeTest();
    });

    tests.push( async () => {
      editor.evKey(makekey({'code':'ArrowLeft',shiftKey: true}));
      subTitle('shift left sel other b');
      return timeTest();
    });

    tests.push( async () => {
      editor.evKey(makekey({'key':'X',shiftKey: true}));
      subTitle('key: X ends up with aXc');
      return timeTest();
    });

    tests.push( async () => {
      editor.evKey(makekey({'code':'ArrowLeft'}));
      editor.evKey(makekey({'code':'ArrowLeft'}));
      editor.evKey(makekey({'key':'1'}));
      subTitle('arrow left, insert 1 before start');
      return timeTest();
    });

    tests.push( async () => {
      editor.evKey(makekey({'code':'ArrowRight', shiftKey: true }));
      subTitle('select and replace a with A, right select');
      return timeTest();
    });

    tests.push( async () => {
      editor.evKey(makekey({'key':'A'}));
      subTitle('select and replace a with A, right select');
      return timeTest();
    });

    tests.push( async () => {
      subTitle('simulate mouse hover');
      var pt = {
        clientX: editor.svgText.artifacts[1].box.x + 5,
        clientY: editor.svgText.artifacts[1].box.y + 5,
        shiftKey: false,
        type: 'mouseover'
      };
      editor.handleMouseEvent(pt);
      return timeTest();
    });

    tests.push( async () => {
      subTitle('simulate mouse click');
      var pt = {
        clientX: editor.svgText.artifacts[1].box.x + 5,
        clientY: editor.svgText.artifacts[1].box.y + 5,
        shiftKey: false,
        type: 'click'
      };
      editor.handleMouseEvent(pt);
      return timeTest();
    });

    tests.push( async () =>  {
      editor.stopCursor();
      return cursorPromise;
    });

    tests.push( async () => {
      testTime = 500;
      subTitle('drag start test');
      lyricSession = new SuiDragSession({
        textGroup: startGroup,
        context: keys.layout.context,
        scroller: keys.scroller
        }
      );
      lyricSession.startDrag({clientX: lyricSession.currentClientBox.x + 5, clientY: lyricSession.currentClientBox.y + 5});
      return timeTest();
    });

    tests.push( async () => {
      subTitle('drag text');
      lyricSession.mouseMove({clientX: lyricSession.currentClientBox.x + 20, clientY: lyricSession.currentClientBox.y + 10});
      return timeTest();
    });

    tests.push( async () => {
      subTitle('drag text 2');
      lyricSession.mouseMove({clientX: lyricSession.currentClientBox.x + 20, clientY: lyricSession.currentClientBox.y + 10});
      return timeTest();
    });

    tests.push( async () => {
      subTitle('end drag');
      lyricSession.endDrag();
      return timeTest();
    });

    tests.push( async () =>  {
      subTitle('create lyric session');
      testTime = 100;
      var selector = {staff: 0, measure: 0, voice: 0, tick: 1};
      lyricSession = new SuiLyricSession({
        context : keys.layout.context,
        selector: selector,
        scroller: keys.scroller,
        layout: keys.layout,
        verse: 0,
        score: score
        }
      );
      lyricSession.startSession();
      return timeTest();
    });

    tests.push( async () => {
      subTitle('add lyric');
      console.log('add lyric test');
      testTime = 100;
      lyricSession.evKey(makekey({'key':'d'}));
      lyricSession.evKey(makekey({'key':'o'}));
      return PromiseHelpers.makePromise(lyricSession,'_pendingEditor',null,null,100);
    });

    tests.push( async () => {
      subTitle('advance lyric');
      console.log('advance lyric test');
      lyricSession.evKey(makekey({'key':'-'}));
      return PromiseHelpers.makePromise(lyricSession,'_pendingEditor',null,null,100);
    });

    tests.push( async () => {
      subTitle('advance lyric');
      console.log('advance lyric test 2');
      lyricSession.evKey(makekey({'key':'i'}));
      lyricSession.evKey(makekey({'key':'t'}));
      return PromiseHelpers.makePromise(lyricSession,'_pendingEditor',null,null,100);
    });

    tests.push( async () => {
      subTitle('add lyric and stop session');
      lyricSession.stopSession();
      return PromiseHelpers.makePromise(lyricSession,'isStopped',null,null,100);
    });

    var makeKeyTest = (key,i) => {
      tests.push( async () => {
        subTitle("edit key "+i);
        testTime = 100;
        lyricSession.evKey(makekey({'key':key}));
        return timeTest();
      });
    }

    var startString = new SmoScoreText({text : "ab",        x: 50,
            y: 120,
    });
    var startGroup = new SmoTextGroup({blocks:[startString]});
    score.addTextGroup(startGroup);

    tests.push( async () => {
      subTitle('render initial text');
      keys.layout.setRefresh();
      return timeTest();
    });

    tests.push( async () => {
      subTitle('start text session');
      lyricSession = new SuiTextSession({
        context : keys.layout.context,
        scroller: keys.scroller,
        layout: keys.layout,
        score: score,
        x:50, y:120,
        textGroup:startGroup
        }
      );
      lyricSession.startSession();
      // eventSource.bindKeydownHandler(lyricSession,'evKey');

      return timeTest();
    });

    const testStr = 'Score Text Editor';

    for (var i = 0;i < testStr.length; ++i) {
      makeKeyTest(testStr[i],i);
    }

    tests.push( async () => {
      subTitle('stop text edit session');
      lyricSession.stopSession();
      return PromiseHelpers.makePromise(lyricSession,'isStopped',null,null,100);
    });

    tests.push( async () => {
      subTitle('update score from text session');
      score.addTextGroup(lyricSession.textGroup);
      keys.layout.setRefresh();
      return PromiseHelpers.makePromise(lyricSession,'_isRendered',null,null,100);
    });

    tests.push( async () => {
      subTitle('start chord session');
      console.log('start chord session');
      var selector = {staff: 0, measure: 0, voice: 0, tick: 1};
      lyricSession = new SuiChordSession({
        context : keys.layout.context,
        selector: selector,
        scroller: keys.scroller,
        layout: keys.layout,
        verse: 0,
        score: score
        }
      );
      lyricSession.startSession();
      // eventSource.bindKeydownHandler(lyricSession,'evKey');
      return timeTest();
    });

    const chordStr = 'Ab7(^#11%b9%)';

    for (var i =0;i < chordStr.length; ++i) {
      makeKeyTest(chordStr[i],i);
    }

    tests.push( async () => {
      subTitle('chord change submit');
      lyricSession.evKey(makekey({'key':'Enter', 'code': 'Enter'}));
      return PromiseHelpers.makePromise(lyricSession,'_pendingEditor',null,null,100);
    });

    tests.push( async () => {
      subTitle('stop session');
      lyricSession.stopSession();
      return PromiseHelpers.makePromise(lyricSession,'isStopped',null,null,100);
    });


    let result;
    for (const f of tests) {
      result = await f(result);
    }

		return result;
	}
}
