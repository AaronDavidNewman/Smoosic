
class MeasureTest {
  static CommonTests() {
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Measure Test');
		var score = keys.score;
		var layout = keys.layout;
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
						500);
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
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			return layout.render().then(timeTest);
		}
		
		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
			return layout.render().then(timeTest);
		}	

		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
			return layout.render().then(timeTest);
		}
		
		var doubleEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			return layout.render().then(timeTest);
		}	
		var endEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			return layout.render().then(timeTest);
		}	
		var noneEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0,1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			return layout.render().then(timeTest);
		}
		
		var symbolTest1 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest2 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest3 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Coda}));
			return layout.render().then(timeTest);
		}
		var symbolTest4 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest5 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest6 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}
		
		var voltaTest1 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}

      
        return drawDefaults().then(startRepeatTest).then(endRepeatTest).then(doubleEndTest).then(endEndTest).then(noneEndTest)
		    .then(symbolTest1).then(symbolTest2).then(symbolTest3).then(symbolTest4).then(symbolTest5).then(symbolTest6)
			.then(signalComplete);
    }
}
