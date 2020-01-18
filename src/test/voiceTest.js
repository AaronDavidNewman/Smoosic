

class VoiceTest {

	static CommonTests() {
		var keys = utController.createUi( SmoScore.getDefaultScore());
		$('h1.testTitle').text('Voice Test');

		var score = keys.score;
		var layout = keys.layout;

		var measure = SmoSelection.measureSelection(score, 0, 0);

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

			keys.layout.render();
            return timeTest();
		}
        var _transposeVoice = (vix,pitches) => {
            var org = measure.measure.getActiveVoice();
            measure.measure.setActiveVoice(vix);
            var nix = 0;
            measure.measure.getNotes().forEach((note) => {
                var sel = SmoSelection.noteSelection(score,0,0,vix,nix);
                SmoOperation.setPitch(sel,pitches);
                nix += 1;
            });

            measure.measure.setActiveVoice(org);
        }
		var populateTest = () => {

			subTitle('create voice test');
            _transposeVoice(0,[{letter:'b',accidental:'b',octave:4}]);
			measure.measure.populateVoice(1);
            _transposeVoice(1,[{letter:'a',accidental:'n',octave:4}]);
			keys.layout.render();
            return timeTest();
		}

		return drawDefaults().then(populateTest).then(signalComplete);
	}
}
