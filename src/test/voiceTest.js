

class VoiceTest {

	static CommonTests() {
		var keys = utController.createUi( SmoScore.getDefaultScore());
		$('h1.testTitle').text('Voice Test');

		var score = keys.score;
		var layout = keys.layout;

		var measure = SmoSelection.measureSelection(score, 0, 0).measure;
		var voice2 = SmoMeasure.defaultVoice44;
		measure.voices.push({
			notes: voice2
		});

		var detach = () => {
			keys.detach();
			keys = null;
			score = null;
			layout = null;
		}
		var subTitle = (txt) => {
			$('.subTitle').text(txt);
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

		var signalComplete = () => {
			detach();
			subTitle('');
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			subTitle('notes in 2 voices');

			return layout.render().then(timeTest);
		}
		var accidentalTest = () => {
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 1, [0]);
			subTitle('accidental test');
			SmoOperation.transpose(target, -1);
			/* if (target) {
			target.note.transpose([0],-1);
			}  */
			return layout.render().then(timeTest);
		}

		var serializeTest = () => {
			subTitle('serialize test');
			layout.unrenderAll();
			$('#boo').html('');
			var ser = score.serialize();
			var string = JSON.stringify(ser);
			score = SmoScore.deserialize(string);
			keys.detach();
			keys = utController.createUi(score,'Serializer Test');
			return keys.layout.render().then(timeTest);
		}

		return drawDefaults().then(accidentalTest).then(serializeTest).then(signalComplete);
	}
}
