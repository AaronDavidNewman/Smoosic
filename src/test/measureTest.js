
class MeasureTest {
  static CommonTests() {
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Measure Test');
		var score = keys.score;
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
		
		var detach = () => {
			keys.detach();
			keys = null;
			score = null;
			layout = null;
		}
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
			detach();
			subTitle('');

			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			return layout.render().then(timeTest);
		}
		
		var startRepeatTest = () => {
			subTitle('startRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			return layout.render().then(timeTest);
		}

		var endRepeatTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}),
			    undoBuffer,'set barline');
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}),
			    undoBuffer,'set barline');
			return layout.render().then(timeTest);
		}
		
		var serialize1 = () => {
			score = SmoScore.deserialize(JSON.stringify(score.serialize()));
			keys = utController.createUi(score,'Measure Test');
		    layout = keys.layout;
			return layout.render().then(timeTest);
		}
		
		var doubleEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			return layout.render().then(timeTest);
		}	
		var endEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			return layout.render().then(timeTest);
		}	
		var noneEndTest = () => {
			subTitle('noneEndTest');
			var selection = SmoSelection.measureSelection(score, 0,1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			return layout.render().then(timeTest);
		}
		
		var symbolTest1 = () => {
			subTitle('symbolTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest2 = () => {
			subTitle('symbolTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest3 = () => {
			subTitle('symbolTest3');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Coda}));
			return layout.render().then(timeTest);
		}
		var symbolTest4 = () => {
			subTitle('symbolTest4');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest5 = () => {
			subTitle('symbolTest5');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest6 = () => {
			subTitle('symbolTest6');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}
		
		var voltaTest1 = () => {
			subTitle('voltaTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:1,endBar:3,number:1}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}
		
		var voltaTest2 = () => {
			subTitle('voltaTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:2,endBar:3,number:2}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}      	       
        
        return drawDefaults().then(startRepeatTest).then(endRepeatTest).then(voltaTest1).then(serialize1).then(voltaTest2)
		    .then(doubleEndTest).then(endEndTest).then(noneEndTest)
		    .then(symbolTest1).then(symbolTest2).then(symbolTest3).then(symbolTest4).then(symbolTest5).then(symbolTest6)
			.then(signalComplete); 
    }
}
