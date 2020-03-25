
class ChordTest {

	static CommonTests() {
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Chord Test');
		var score = keys.score;
		var layout = keys.layout;
		var measure = SmoSelection.measureSelection(score, 0, 0).measure;

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
			layout.layout();
            return timeTest();
		}

		var preBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.halveDuration(selection);
			layout.layout();
            return timeTest();
		}

		var breakBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleBeamGroup(selection);
			layout.layout();
            return timeTest();
		}

		var undoBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.doubleDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			layout.layout();
            return timeTest();
		}

		var accidentalTest = () => {
			var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 1, [0]);
			subTitle('accidental test');
			SmoOperation.transpose(selection, -1);
			SmoOperation.addDynamic(selection, new SmoDynamicText({
					selection: selection.selector,
					text: SmoDynamicText.dynamics.SFZ,
					yOffsetLine: 11,
					fontSize: 38
				}));
			layout.layout();
            return timeTest();
		}

		var crescendoTest = () => {
			subTitle('crescendo test');
			var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
			var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
			SmoOperation.crescendo(ft, tt);
			layout.layout();
            return timeTest();
		}

		var intervalTest = () => {
			subTitle('interval test');
			var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 2);
			if (selection) {
				SmoOperation.interval(selection, 4);
			}
			layout.layout();
            return timeTest();
		}

		var durationTest = () => {
			subTitle('duration reduce test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.halveDuration(selection);
			layout.layout();
            return timeTest();
		}

		var durationTest2 = () => {
			subTitle('duration increase test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			layout.layout();
            return timeTest();
		}

		var rerenderTest = () => {
			layout.layout();
            return timeTest();
		}
		var setPitchTest = () => {
			subTitle('set pitch test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2, [0]);
			SmoOperation.setPitch(selection,
				[{
						letter: 'e',
						octave: 4,
						accidental: 'b'
					}, {
						letter: 'g',
						octave: 5,
						accidental: 'n'
					}
				]);
			layout.layout();
            return timeTest();
		}

		var makeTupletTest = () => {
			subTitle('make tuplet test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.makeTuplet(selection, 3);
			layout.layout();
            return timeTest();
		}

		var unmakeTupletTest = () => {
			subTitle('unmake tuplet test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.unmakeTuplet(selection);
			layout.layout();
            return timeTest();
		}

		var courtesyTest = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.courtesyAccidental(target, true);
			// target.note.pitches[1].cautionary = true;
			layout.layout();
            return timeTest();
		}

		var enharmonicTest1 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			layout.layout();
            return timeTest();
		}
		var enharmonicTest2 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			layout.layout();
            return timeTest();
		}

		var accentTest = () => {
			subTitle('accent  test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}

		var accentTest2 = () => {
			subTitle('accent  test 2');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.tenuto,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}
		var accentTestBelow = () => {
			subTitle('accent  test below');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.tenuto,
					position: SmoArticulation.positions.above
				}));
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent,
					position: SmoArticulation.positions.above
				}));
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent,
					position: SmoArticulation.positions.below
				}));
			layout.layout();
            return timeTest();
		}

		var staccatoTest = () => {
			subTitle('staccato test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent
				}));
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.staccato,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}

		var marcatoTest = () => {
			subTitle('marcato test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.staccato
				}));

			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.marcato,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}

		var upStrokeTest = () => {
			subTitle('up stroke test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.marcato
				}));

			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.upStroke,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}

		var downStrokeTest = () => {
			subTitle('down stroke test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.upStroke
				}));

			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.downStroke,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}
		var pizzicatoTest = () => {
			subTitle('pizzicato test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.downStroke
				}));

			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.pizzicato,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}
		var fermataTest = () => {
			subTitle('fermata test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.pizzicato
				}));

			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.fermata,
					position: SmoArticulation.positions.above
				}));
			layout.layout();
            return timeTest();
		}

		return drawDefaults().then(preBeamTest).then(breakBeamTest).then(undoBeamTest)
		.then(accidentalTest).then(crescendoTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest).then(enharmonicTest1).then(enharmonicTest2).then(accentTest)
		.then(accentTest2).then(accentTestBelow).then(staccatoTest).then(marcatoTest)
		.then(upStrokeTest).then(downStrokeTest).then(pizzicatoTest).
		then(fermataTest).then(signalComplete);
	}
}
