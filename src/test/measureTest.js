
class MeasureTest {
  static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;

		var layout = keys.layout;

		// suiSimpleLayout.debugLayout=true;
		var undoBuffer = keys.undoBuffer;
    score.addDefaultMeasureWithNotes(0,{});
    score.addDefaultMeasureWithNotes(1,{});
    score.addDefaultMeasureWithNotes(2,{});
		SmoOperation.addStaff(score,{
				instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: 0,
                clef: 'bass'
            }});
		// var measure = SmoSelection.measureSelection(score, 0, 0).measure;

		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						200);
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
			keys.render()
      return timeTest();
		}

		var startRepeatTest = () => {
			subTitle('startRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			keys.render()
      return timeTest();
		}

    var pickupTest = () => {
        score.addPickupMeasure(0,4096+2048);
        SmoUndoable.padMeasuresLeft(SmoSelection.measureSelection(score,0,2),8,undoBuffer);
        score.staves[0].measures[2].setBarline(new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
        keys.render();
        return timeTest();
    }

		var endRepeatTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}),
			    undoBuffer,'set barline');
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}),
			    undoBuffer,'set barline');
			keys.render()
      return timeTest();
		}

		var doubleEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			keys.render()
      return timeTest();
		}
		var endEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			keys.render()
      return timeTest();
		}
		var noneEndTest = () => {
			subTitle('noneEndTest');
			var selection = SmoSelection.measureSelection(score, 0,1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			keys.render()
      return timeTest();
		}

		var symbolTest1 = () => {
			subTitle('symbolTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlCoda}));
			keys.render()
      return timeTest();
		}
		var symbolTest2 = () => {
			subTitle('symbolTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlFine}));
			keys.render()
      return timeTest();
		}
		var symbolTest3 = () => {
			subTitle('symbolTest3');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Coda}));
			keys.render()
      return timeTest();
		}
		var symbolTest4 = () => {
			subTitle('symbolTest4');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlCoda}));
			keys.render()
      return timeTest();
		}
		var symbolTest5 = () => {
			subTitle('symbolTest5');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlFine}));
			keys.render()
      return timeTest();
		}
		var symbolTest6 = () => {
			subTitle('symbolTest6');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

		var voltaTest1 = () => {
			subTitle('voltaTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:1,endBar:3,number:1}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

		var voltaTest2 = () => {
			subTitle('voltaTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:2,endBar:3,number:2}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

        return drawDefaults().then(startRepeatTest).then(pickupTest).then(endRepeatTest).then(voltaTest1).then(voltaTest2)
		    .then(doubleEndTest).then(endEndTest).then(noneEndTest)
		    .then(symbolTest1).then(symbolTest2).then(symbolTest3).then(symbolTest4).then(symbolTest5).then(symbolTest6)
			.then(signalComplete);
    }
}
