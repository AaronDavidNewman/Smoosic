
class StaffTest {
  static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(document.getElementById("boo"), SmoScore.getDefaultScore());
		var score = keys.score;
		var layout = keys.layout;
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
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
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			return layout.render().then(timeTest);
		}
		
		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
			return layout.render().then(timeTest);
		}	

		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 3);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
			return layout.render().then(timeTest);
		}
		
		var doubleEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 3);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			return layout.render().then(timeTest);
		}	
		var endEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 3);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			return layout.render().then(timeTest);
		}	
		var noneEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 3);
			SmoOperation.setMeasureBarline(selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			return layout.render().then(timeTest);
		}	
      
        return drawDefaults().then(startRepeatTest).then(endRepeatTest).then(doubleEndTest).then(endEndTest).then(noneEndTest).then(signalComplete);
    }
}
