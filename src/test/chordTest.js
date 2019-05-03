
class ChordTest {

	static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(document.getElementById("boo"), SmoScore.getDefaultScore());
		var score = keys.score;
		var layout = keys.layout;
		var measure = SmoSelection.measureSelection(score,0,0).measure;

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

		var signalComplete = () => {
			detach();
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			layout.render();
			return timeTest();
		}
		var accidentalTest = () => {
			var selection = SmoSelection.pitchSelection(score,0,0,0,1,[0]);
			SmoOperation.transpose(selection,-1);
			layout.render();
			return timeTest();
		}
		
		
		var crescendoTest = () => {
			var ft = SmoSelection.noteSelection(layout.score,0,0,0,0);
			var tt = SmoSelection.noteSelection(layout.score,0,0,0,3);
			SmoOperation.crescendo(ft,tt);
			layout.render();
			return timeTest();
		}


		var intervalTest = () => {
			var selection = SmoSelection.pitchSelection(score,0,0,0,2);
			if (selection) {
				SmoOperation.interval(selection,4);
			}
			layout.render();
			return timeTest();
		}

		var durationTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2);
			SmoOperation.halveDuration(selection);
			layout.render();
			return timeTest();
		}

		var durationTest2 = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2);
			SmoOperation.doubleDuration(selection);
			layout.render();
			return timeTest();
		}

		var rerenderTest = () => {
			layout.render();
			return timeTest();
		}
		var setPitchTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2,[0]);
			SmoOperation.setPitch(selection,
			[{
						key: 'e',
						octave: 4,
						accidental: 'b'
					}, {
						key: 'g',
						octave: 5,
						accidental: ''
					}
				]);
			layout.render();
			return timeTest();
		}

		var makeTupletTest = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoMakeTupletActor({
					index: 1,
					totalTicks: 4096,
					numNotes: 3,
					measure: measure
				});
			SmoTickTransformer.applyTransform(measure, actor);
			layout.render();
			console.log('tuplet serialize');
			console.log(JSON.stringify(measure, null, ' '));
			return timeTest();
		}

		var unmakeTupletTest = () => {
			var actor = new SmoUnmakeTupletActor({
					startIndex: 1,
					endIndex: 3,
					measure: measure
				});
			SmoTickTransformer.applyTransform(measure, actor);
			layout.render();
			return timeTest();
		}

		var courtesyTest = () => {
			var target = SmoSelection.pitchSelection(score,0,0,0,2,[1]);
			target.note.addAccidental({
				index: 1,
				value: {
					symbol: 'n',
					cautionary: true
				}
			});
			smoModifierFactory.applyModifiers(measure);
			layout.render();
			return timeTest();
		}

		return drawDefaults().then(accidentalTest).then(crescendoTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest).then(signalComplete);
	}
}
