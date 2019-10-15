
class StaffTest {
  static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Staff Test');
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
		
		var scoreText = () => {
			var tt = new SmoScoreText({text:'Hello world',x:240,y:15});
			score.addScoreText(tt);
			return layout.render().then(timeTest);
		}
      
        return drawDefaults().then(scoreText).then(signalComplete);
    }
}
