
class StaffTest {
  static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Staff Test');
		var score = keys.score;
		var layout = keys.layout;
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		var tt = new SmoScoreText({text:'Hello world',x:240,y:15});
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
		
		var scoreText1 = () => {
			
			score.addScoreText(tt);
			return layout.render().then(timeTest);
		}
		
		var scoreText2 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel='spacing';
			tt.width=100;
			return layout.render().then(timeTest);			
		}
		
		var scoreText3 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel='spacingAndGlyphs';
			tt.fontInfo.size=20;
			tt.width=100;
			return layout.render().then(timeTest);	
		}
		
		var scoreText4 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.transform='scale(1.5)';
			return layout.render().then(timeTest);	
		}
      
        return drawDefaults().then(scoreText1).then(scoreText2).then(scoreText3).then(scoreText3).then(scoreText4).then(signalComplete);
    }
}
