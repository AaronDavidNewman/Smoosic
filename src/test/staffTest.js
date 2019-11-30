
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
            
			layout.render();
            return timeTest();
		}
        
        var test1 = () => {
            var sel = SmoSelection.noteSelection(score,0,0,0,0);
            SmoOperation.addGraceNote(sel,new SmoGraceNote({pitches:[{letter:'c',octave:5,accidental:'n'}],ticks:{numerator:1024,denominator:1,remainder:0}}))
            SmoOperation.addGraceNote(sel,new SmoGraceNote({pitches:[{letter:'d',octave:5,accidental:'n'}],ticks:{numerator:1024,denominator:1,remainder:0}}))
			layout.render();
            
            return timeTest();
        }
      
        return drawDefaults().then(test1).then(signalComplete);
    }
}
