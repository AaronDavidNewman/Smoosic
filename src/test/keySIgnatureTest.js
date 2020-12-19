
class KeySignatureTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.view.renderer.score;

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var undo = keys.undoBuffer;
		var layout = keys.view.renderer;

		var detach = () => {
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
			subTitle('');
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			keys.render();
      return timeTest();
		}

		var changePitch = () => {
			subTitle('change pitch');
			var target = SmoSelection.pitchSelection(layout.score, 0, 2, 0, 1, [0]);
			undo.addBuffer('undo pitch change', UndoBuffer.bufferTypes.MEASURE, target.selector, target.measure);
			SmoOperation.setPitch(target, {
				letter: 'e',
				octave: 4,
				accidental: 'b'
			});
			keys.render()
            return timeTest();
		}
		var undoTest = () => {
			layout.undo(undo);
			return timeTest();
		}
		var changePitch2 = () => {
			subTitle('change pitch 2');
			var target = SmoSelection.pitchSelection(score, 0, 1, 0, 1, [0]);
			undo.addBuffer('undo pitch change', UndoBuffer.bufferTypes.MEASURE, target.selector, target.measure);
			SmoOperation.setPitch(target, {
				letter: 'f',
				octave: 4,
				accidental: '#'
			});

			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.makeRest(selection);
			keys.render()
            return timeTest();
		}
		var keySigTest = () => {
			subTitle('key sig to C to A');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			undo.addBuffer('undo key sig', UndoBuffer.bufferTypes.STAFF, selection.selector, selection.staff);
			SmoOperation.addKeySignature(score, selection, 'A');
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.makeNote(selection);
			keys.render()
      return timeTest();
		}
		var keySigTest2 = () => {
			subTitle('key sig to Bb');
			var selection = SmoSelection.measureSelection(score, 0, 2);
			undo.addBuffer('undo key sig', UndoBuffer.bufferTypes.SCORE, selection.selector, score);
			SmoOperation.addKeySignature(score, selection, 'Bb');
			keys.render()
            return timeTest();
		}
		var keySigTest3 = () => {
			subTitle('key sig to c# canceled to cb');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.addKeySignature(score, selection, 'C#');
			selection = SmoSelection.measureSelection(score, 0, 2);
			SmoOperation.addKeySignature(score, selection, 'Cb');
			keys.render()
            return timeTest();
		}
		var keySigTest4 = () => {
			subTitle('key sig to Bb 1st mesure');
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.addKeySignature(score, selection, 'Bb');
			keys.render()
            return timeTest();
		}
		return drawDefaults().then(changePitch).then(changePitch2).then(undoTest)
		.then(undoTest).then(keySigTest).then(undoTest).then(keySigTest2).then(undoTest)
		.then(keySigTest3).then(keySigTest4).then(signalComplete);
	}
}
