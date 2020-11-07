
class TextTest {
  static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;
    var context = keys.layout.context;
    var editText = new SuiInlineText({context:context,startY:200});

    score.addDefaultMeasureWithNotes(0,{});
    score.addDefaultMeasureWithNotes(1,{});
    score.addDefaultMeasureWithNotes(2,{});
		var undo = keys.undoBuffer;
		var tt = new SmoScoreText({text:'Hello world',x:240,y:30});
    var tg1 = new SmoScoreText({text:'My Song',x:500,y:30});
    var tg2 = new SmoScoreText({text:'Below My Song',x:240,y:30});
    var tg = new SmoTextGroup({blocks: [
      {text: tg1,position: SmoTextGroup.relativePositions.LEFT},
      {text: tg2,position: SmoTextGroup.relativePositions.BELOW}
    ], justification: SmoTextGroup.justifications.LEFT } );
		var mt=new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
		var delay=250;
		// var measure = SmoSelection.measureSelection(score, 0, 0).measure;

		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						delay);
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

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			keys.render();
            return timeTest();
		}

		var scoreText1 = () => {
      subTitle('scoreText1');
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Text Test 1');
			score.addScoreText(tt);
			keys.render();
      return timeTest();
		}

    var inlineText = () => {
      subTitle('inlineText');
      editText.addTextBlockAt(0,{text:'A'});
      editText.addTextBlockAt(1,{text:'l'});
      editText.addTextBlockAt(1,{text:'l'});
      editText.addTextBlockAt(3,{text:'O',textType:SuiInlineText.textTypes.superScript});
      editText.addGlyphBlockAt(4,{glyphCode: 'csymMajorSeventh',textType:SuiInlineText.textTypes.superScript});
      editText.render();
      editText.renderCursorAt(2);
      editText.renderCursorAt(-1);
      return timeTest();
    }

    var cursor2 = () => {
      editText.renderCursorAt(2);
      return timeTest();
    }

    var removeCursor = () => {
      editText.removeCursor();
      return timeTest();
    }

    var inlineText2 = () => {
      subTitle('inlineText2');
      var textBlock =  new SuiInlineText({context:context,startX:400,startY: 50});
      textBlock.addTextBlockAt(0,{text:'Hello Inline World'} );
      textBlock.render();
      return timeTest();
    }

		var scoreText2 = () => {
      subTitle('scoreText2');

			score.removeScoreText(tt);
      score.addTextGroup(tg);
			keys.render();
      return timeTest();
		}

		var scoreText3 = () => {
      subTitle('scoreText3');
      tg.justification = SmoTextGroup.justifications.RIGHT;
			keys.render();
      return timeTest();
		}

		var scoreText4 = () => {
      subTitle('scoreText4');
      tg.justification = SmoTextGroup.justifications.CENTER;
			keys.render();
      return timeTest();
		}

		var _scaleUp = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(1.2);
			keys.render();
            return timeTest();
		}

		var scaleUp = () => {
      subTitle('scaleUp');
			var p = _scaleUp();
			return p.then(_scaleUp).then(timeTest); // .then(_scaleUp);
		}

		var _scaleDown = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(0.8);
			keys.render();
      return timeTest();
		}
		var scaleDown = () => {
      subTitle('scaleDown');
			var p = _scaleDown();
			return p.then(_scaleDown).then(timeTest); // .then(_scaleUp);
		}

		var _moveText = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.x = tt.x + 30;
			tt.y = tt.y + 10;
			keys.render();
      return timeTest();
		}

		var moveText  = () => {
      subTitle('moveText');
			var p = _moveText();
			return p.then(_moveText).then(timeTest); // .then(_scaleUp);
		}


    var tempoTest = () => {
      var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.1');
      selection = SmoSelection.measureSelection(score, 0, 2);
      SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.2');

      selection = SmoSelection.measureSelection(score, 0, 0);
      SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
      selection = SmoSelection.measureSelection(score, 0, 1);
      SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        new SmoTempoText({tempoMode: SmoTempoText.tempoModes.textMode,
        tempoText:SmoTempoText.tempoTexts.adagio,bpm:120}),undo,'tempo test 1.3');
			keys.render();
      return timeTest();

    }

		var lyricTest = () => {
      subTitle('lyricTest');

			var s1 = SmoSelection.noteSelection(score,0,0,0,1);
			var s2 = SmoSelection.noteSelection(score,0,0,0,2);
			var s3 = SmoSelection.noteSelection(score,0,0,0,3);
			var s4 = SmoSelection.noteSelection(score,0,1,0,0);
			var lyric = new SmoLyric({text:'All'});
			SmoUndoable.measureSelectionOp(score,s1,'addLyric',new SmoLyric({text:'All'}),undo,'lyric test 1');
			SmoUndoable.measureSelectionOp(score,s2,'addLyric',new SmoLyric({text:'Boys'}),undo,'lyric test 2');
			SmoUndoable.measureSelectionOp(score,s3,'addLyric',new SmoLyric({text:'Eat'}),undo,'lyric test 3');
			SmoUndoable.measureSelectionOp(score,s4,'addLyric',new SmoLyric({text:'Grass'}),undo,'lyric test 4');
			SmoUndoable.measureSelectionOp(score,s1,'addLyric',new SmoLyric({verse:1,text:'Cows'}),undo,'lyric test 1');
			SmoUndoable.measureSelectionOp(score,s2,'addLyric',new SmoLyric({verse:1,text:'Do'}),undo,'lyric test 2');
			SmoUndoable.measureSelectionOp(score,s3,'addLyric',new SmoLyric({verse:1,text:'Fine'}),undo,'lyric test 3');
			SmoUndoable.measureSelectionOp(score,s4,'addLyric',new SmoLyric({verse:1,text:'Always'}),undo,'lyric test 4');
			keys.render()
      return timeTest();
		}

		var copyText1 = () => {
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Right Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			keys.render();
            return timeTest();
		}

		var copyText2 = () => {
			SmoUndoable.scoreOp(score,'removeScoreText',tt,undo,'Copy Text Test 1');
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Center Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100,justification:'center'});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			keys.render();
      return timeTest();
		}

        return drawDefaults().then(scoreText1)
          .then(scaleUp).then(scaleDown).then(moveText)
          .then(scoreText2).then(scoreText3).then(scoreText4).then(lyricTest).then(tempoTest)
          .then(inlineText).then(removeCursor).then(cursor2).then(removeCursor)
          /* .then(scoreText2).then(scoreText3).then(scoreText4)  */
          .then(signalComplete);
        /* then(scoreText2).then(scoreText3).then(scoreText3).then(scoreText4).
		   then(scaleUp).then(scaleDown).then(moveText).then(lyricTest).then(rehearsalMarkTest).then(rehearsalMarkTest2)
           .then(rehearsalMarkTest3).then(tempoTest).then(measureText1).
		   then(measureText2).then(measureText3).then(measureText4)
		   .then(titleText1).then(titleText2).then(titleText3).then(copyText1).then(copyText2).then(signalComplete);  */
    }
}
