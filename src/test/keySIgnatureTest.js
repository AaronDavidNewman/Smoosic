
class KeySignatureTest {

	static CommonTests() {
		$('h1.testTitle').text('Key Signature Test');
		var score = SmoScore.getEmptyScore();

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var keys = utController.createUi(document.getElementById("boo"), score);
		var undo = keys.undoBuffer;
		var score = keys.score;
		var layout = keys.layout;

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
			return keys.render().then(timeTest);
		}

		var changePitch = () => {
			subTitle('change pitch');
			var target = SmoSelection.pitchSelection(layout.score, 0, 2, 0, 1, [0]);
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
			SmoOperation.setPitch(target, {
				letter: 'e',
				octave: 4,
				accidental: 'b'
			});
			return keys.render().then(timeTest);
		}
		var undoTest = () => {
			layout.undo(undo);
			return timeTest();
		}
		var changePitch2 = () => {
			subTitle('change pitch 2');
			var target = SmoSelection.pitchSelection(score, 0, 1, 0, 1, [0]);
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
			SmoOperation.setPitch(target, {
				letter: 'f',
				octave: 4,
				accidental: '#'
			});

			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.makeRest(selection);
			return keys.render().then(timeTest);
		}
		var keySigTest = () => {
			subTitle('key sig to C to A');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			undo.addBuffer('undo key sig', 'staff', selection.selector, selection.staff);
			SmoOperation.addKeySignature(score, selection, 'A');
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.makeNote(selection);
			return keys.render().then(timeTest);
		}
		var keySigTest2 = () => {
			subTitle('key sig to Bb');
			var selection = SmoSelection.measureSelection(score, 0, 2);
			undo.addBuffer('undo key sig', 'score', selection.selector, score);
			SmoOperation.addKeySignature(score, selection, 'Bb');
			return keys.render().then(timeTest);
		}
		var keySigTest3 = () => {
			subTitle('key sig to c# canceled to cb');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.addKeySignature(score, selection, 'C#');
			selection = SmoSelection.measureSelection(score, 0, 2);
			SmoOperation.addKeySignature(score, selection, 'Cb');
			return keys.render().then(timeTest);
		}
		var keySigTest4 = () => {
			subTitle('key sig to Bb 1st mesure');
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.addKeySignature(score, selection, 'Bb');
			return keys.render().then(timeTest);
		}
		var serializeTest = () => {
			subTitle('serialize');
			var scoreJson = JSON.stringify(score.serialize());
			// score = SmoScore.deserialize(JSON.stringify(serializeTestJson.systemStaffJson));
			score = SmoScore.deserialize(scoreJson);
			layout.unrenderAll();
			keys.detach();
			keys = utController.createUi(document.getElementById("boo"), score);
			return keys.render().then(timeTest);
		}

		return drawDefaults().then(changePitch).then(changePitch2).then(undoTest)
		.then(undoTest).then(keySigTest).then(undoTest).then(keySigTest2).then(undoTest)
		.then(keySigTest3).then(serializeTest).then(keySigTest4).then(signalComplete);
	}
}
