

class VoiceTest {

    static CommonTests() {
		var keys = utController.createUi(document.getElementById("boo"),SmoScore.getDefaultScore());
		$('h1.testTitle').text('Voice Test');

		var score = keys.score;
		var layout = keys.layout;

		var measure = SmoSelection.measureSelection(score,0,0).measure;
		var voice2=SmoMeasure.defaultVoice44;
		measure.voices.push({notes:voice2});
		
		var detach = () => {
			keys.detach();
			keys=null;
			score=null;
			layout=null;
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
		
		var signalComplete = () => {
			detach();
			return timeTest();
		}

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            layout.render();
			console.log(JSON.stringify(score,null,' '));
            return timeTest();
        }
		var accidentalTest = () => {
			var target = SmoSelection.pitchSelection(score,0,0,0,1,[0]);
			if (target) {
				target.note.transpose([0],-1);
			}
            layout.render();
            return timeTest();
        }
		
		var serializeTest = () => {
			layout.unrender();
			$('#boo').html('');
			score = SmoScore.deserialize(JSON.stringify(serializeTestJson.tupletMeasure));
			keys.detach();
			keys=utController.createUi(document.getElementById("boo"),score);			
			keys.layout.render();
		}
		var serialize = () => {
			console.log(JSON.stringify(score,null,' '));
			return timeTest();
		}
		
        return drawDefaults().then(accidentalTest).then(serializeTest).then(signalComplete);
    }
}
