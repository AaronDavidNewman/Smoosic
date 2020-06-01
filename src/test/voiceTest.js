

class VoiceTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

    var keys = application.controller;
    var score = keys.score;
    var layout = keys.layout;
		$('h1.testTitle').text('Voice Test');

    var undoBuffer = keys.undoBuffer;

		var measure = SmoSelection.measureSelection(score, 0, 0);

		var subTitle = (txt) => {
			$('.subTitle').text(txt);
		}
		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						750);
				});
			return promise;
		}

		var signalComplete = () => {
			subTitle('');
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			subTitle('notes in 2 voices');

			keys.render();
      return timeTest();
		}
    var _transposeVoice = (vix,pitches) => {
        var org = measure.measure.getActiveVoice();
        SmoOperation.setActiveVoice(score,vix);
        var nix = 0;
        measure.measure.getNotes().forEach((note) => {
            var sel = SmoSelection.noteSelection(score,0,0,vix,nix);
            SmoOperation.setPitch(sel,pitches);
            nix += 1;
        });

        SmoOperation.setActiveVoice(score,org);
    }
		var populateTest = () => {
			subTitle('create voice test');
            _transposeVoice(0,[{letter:'a',accidental:'n',octave:4}]);
            SmoUndoable.populateVoice([measure],1,undoBuffer);
            _transposeVoice(1,[{letter:'f',accidental:'n',octave:4}]);
			keys.render();
            return timeTest();
		}

        var durationChange = () => {
            subTitle('duration change');
            SmoOperation.setActiveVoice(score,0);
            var sel = SmoSelection.noteSelection(score,0,0,1,2);
            SmoOperation.dotDuration(sel);
            keys.render();
            return timeTest();
        }

        var durationChange2 = () => {
            subTitle('duration change 2');
            SmoOperation.setActiveVoice(score,1);
            var sel = SmoSelection.noteSelection(score,0,0,0,1);
            SmoOperation.doubleDuration(sel);
            keys.render();
            return timeTest();
        }

        var populateVoice2 = () => {
            subTitle('populate voice 2');
            SmoUndoable.populateVoice([measure],2,undoBuffer);
            _transposeVoice(2,[{letter:'d',accidental:'n',octave:5}]);
            SmoUndoable.populateVoice([measure],3,undoBuffer);
            _transposeVoice(3,[{letter:'c',accidental:'n',octave:5}]);
            SmoOperation.setActiveVoice(score,0);
            keys.render();
            return timeTest();
        }

        var depopulateVoice = () => {
            subTitle('depopulate voice');
            SmoUndoable.depopulateVoice([measure],0,undoBuffer);
            keys.render();
            return timeTest();
        }

		return drawDefaults().then(populateTest).
           then(durationChange).then(durationChange2).then(populateVoice2)
           .then(depopulateVoice).then(signalComplete);
	}
}
