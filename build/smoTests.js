
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
			return layout.render().then(timeTest);
		}
		
		var preBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.halveDuration(selection);
			return layout.render().then(timeTest);
		}
		
		var breakBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleBeamGroup(selection);
			return layout.render().then(timeTest);
		}
		
		var undoBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.doubleDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
		}

		var crescendoTest = () => {
			subTitle('crescendo test');
			var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
			var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
			SmoOperation.crescendo(ft, tt);
			return layout.render().then(timeTest);
		}

		var intervalTest = () => {
			subTitle('interval test');
			var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 2);
			if (selection) {
				SmoOperation.interval(selection, 4);
			}
			return layout.render().then(timeTest);
		}

		var durationTest = () => {
			subTitle('duration reduce test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.halveDuration(selection);
			return layout.render().then(timeTest);
		}

		var durationTest2 = () => {
			subTitle('duration increase test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			return layout.render().then(timeTest);
		}

		var rerenderTest = () => {
			return layout.render().then(timeTest);
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
						accidental: ''
					}
				]);
			return layout.render().then(timeTest);
		}

		var makeTupletTest = () => {
			subTitle('make tuplet test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.makeTuplet(selection, 3);
			/* var tickmap = measure.tickmap();
			var actor = new SmoMakeTupletActor({

			index: 1,
			totalTicks: 4096,
			numNotes: 3,
			measure: measure
			});
			SmoTickTransformer.applyTransform(measure, actor);   */
			console.log('tuplet serialize');
			console.log(JSON.stringify(measure, null, ' '));
			return layout.render().then(timeTest);
		}

		var unmakeTupletTest = () => {
			subTitle('unmake tuplet test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.unmakeTuplet(selection);
			/* var actor = new SmoUnmakeTupletActor({
			startIndex: 1,
			endIndex: 3,
			measure: measure
			});
			SmoTickTransformer.applyTransform(measure, actor);  */
			return layout.render().then(timeTest);
		}

		var courtesyTest = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.courtesyAccidental(target, true);
			// target.note.pitches[1].cautionary = true;
			return layout.render().then(timeTest);
		}
		
		var enharmonicTest1 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			return layout.render().then(timeTest);
		}
		var enharmonicTest2 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			return layout.render().then(timeTest);
		}

		var accentTest = () => {
			subTitle('accent  test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent,
					position: SmoArticulation.positions.above
				}));
			return layout.render().then(timeTest);
		}

		var accentTest2 = () => {
			subTitle('accent  test 2');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.tenuto,
					position: SmoArticulation.positions.above
				}));
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
			return layout.render().then(timeTest);
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
;
class UndoTest {

	static CommonTests() {
		var score = SmoScore.getEmptyScore();

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var keys = utController.createUi(score,'Undo Test');
		var undo = keys.undoBuffer;
		var score = keys.score;
		var layout = keys.layout;

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
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			return keys.render().then(timeTest);
		}

		var changePitch = () => {
			subTitle('changePitch');
			var target = SmoSelection.pitchSelection(layout.score, 0, 2, 0, 1, [0]);
			SmoUndoable.setPitch(target, {
				letter: 'e',
				octave: 4,
				accidental: 'b'
			}, undo);
			/* if (target) {
			target.note.pitches = [{
			letter: 'e',
			octave: 4,
			accidental: 'b'
			}
			];
			}   */
			return keys.render().then(timeTest);
		}
		var undoTest = () => {
			var buf = undo.peek();
			subTitle('undo ' + buf.title);
			layout.undo(undo);
			return timeTest();
		}
		var changePitch2 = () => {
			subTitle('change pitch to f#, rest');
			var target = SmoSelection.pitchSelection(score, 0, 1, 0, 1, [0]);
			SmoUndoable.setPitch(target, {
				letter: 'f',
				octave: 4,
				accidental: '#'
			}, undo);

			SmoUndoable.makeRest(SmoSelection.noteSelection(score, 0, 1, 0, 2), undo);
			return keys.render().then(timeTest);
		}
		var keySigTest = () => {
			subTitle('key sig to A');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.addKeySignature(score, selection, 'A', undo);
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoUndoable.makeNote(selection, undo);
			return keys.render().then(timeTest);
		}
		var crescendoTest = () => {
			var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
			var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
			SmoUndoable.crescendo(ft, tt, undo);
			return keys.render().then(timeTest);
		}
		var keySigTest2 = () => {
			subTitle('key sig to Bb');
			var selection = SmoSelection.measureSelection(score, 0, 2);
			SmoUndoable.addKeySignature(score, selection, 'Bb', undo);
			return keys.render().then(timeTest);
		}

		var addStaff = () => {
			subTitle('add instrument');
			SmoUndoable.addStaff(score, {
				instrumentInfo: {
					instrumentName: 'Treble Instrument',
					keyOffset: 0,
					clef: 'treble'
				}
			},
				undo);
			return keys.render().then(timeTest);
		}
		var keySigTest3 = () => {
			subTitle('key sig change to f#');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.addKeySignature(score, selection, 'C#', undo);
			selection = SmoSelection.measureSelection(score, 0, 2);
			SmoUndoable.addKeySignature(score, selection, 'Cb', undo);
			return keys.render().then(timeTest);
		}
		return drawDefaults().then(changePitch).then(crescendoTest).then(changePitch2)
		.then(keySigTest).then(keySigTest2).then(addStaff)
		.then(keySigTest3).then(undoTest).then(undoTest).then(undoTest).then(undoTest).then(undoTest).then(undoTest)
		.then(undoTest).then(undoTest).then(undoTest).then(undoTest)
		then(signalComplete);
	}
}
;
class TimeSignatureTest {

    static CommonTests() {

        var keys = utController.createUi(SmoScore.getDefaultScore({}, {
                    timeSignature: '6/8',
                    clef: 'treble'
                }));
        $('h1.testTitle').text('Time Signature Test');
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
            return layout.render().then(timeTest);
        }

        var stretchTest = () => {
            subTitle('stretch 6/8 test');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.doubleDuration(selection);
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.dotDuration(selection);
            /* var tickmap = measure.tickmap();
            var actor = new SmoStretchNoteActor({
            startIndex: 0,
            tickmap: tickmap,
            newTicks:6144
            });
            SmoTickTransformer.applyTransform(measure,actor);   */
            return layout.render().then(timeTest);
        }

        var breakBeamTest = () => {
            subTitle('break beam');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.toggleBeamGroup(selection);
            return layout.render().then(timeTest);
        }
		
        var breakBeamTest2 = () => {
            subTitle('break beam 2');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.toggleBeamGroup(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.toggleBeamGroup(selection);
            return layout.render().then(timeTest);
        }
		
		var unbreakBeamTest = () => {
            subTitle('unbreak beam');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
            SmoOperation.toggleBeamGroup(selection);
            return layout.render().then(timeTest);
        }

        var contractTest = () => {
            subTitle('contract 6/8 test');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.halveDuration(selection);
            /* var tickmap = measure.tickmap();
            var actor = new SmoContractNoteActor({
            startIndex: 0,
            tickmap: tickmap,
            newTicks:6144/3
            });
            SmoTickTransformer.applyTransform(measure,actor);  */
            return layout.render().then(timeTest);
        }

        var makeDupletTest = () => {
            subTitle('duplet 6/8 test');
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
            SmoOperation.dotDuration(selection);
            selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
            SmoOperation.doubleDuration(selection);
            selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
            SmoOperation.dotDuration(selection);

            /* var tickmap = measure.tickmap();
            var actor = new SmoMakeTupletActor({
            index: 0,
            totalTicks: 6144,
            numNotes: 2,
            measure: measure
            });
            SmoTickTransformer.applyTransform(measure,actor);  */
            return layout.render().then(timeTest);
        }

        return drawDefaults().then(breakBeamTest).then(breakBeamTest2).then(unbreakBeamTest)
		.then(stretchTest).then(contractTest).then(makeDupletTest).then(signalComplete);

    }
}
;
class KeySignatureTest {

	static CommonTests() {
		var score = SmoScore.getEmptyScore();

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var keys = utController.createUi(score,'Key Signature Test');
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
			keys = utController.createUi(score,'Key Signature Test');
			return keys.render().then(timeTest);
		}

		return drawDefaults().then(changePitch).then(changePitch2).then(undoTest)
		.then(undoTest).then(keySigTest).then(undoTest).then(keySigTest2).then(undoTest)
		.then(keySigTest3).then(serializeTest).then(keySigTest4).then(signalComplete);
	}
}
;

class TupletTest {

	static CommonTests() {
		$('h1.testTitle').text();
		var keys = utController.createUi( SmoScore.getDefaultScore(),'Tuplet Test');
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
			return layout.render().then(timeTest);
		}

		var makeTupletTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.makeTuplet(selection, 3);
     		var measureS = SmoSelection.measureSelection(score, 0, 0);
			console.log(JSON.stringify(score.serialize(), null, ' '));
			return layout.render().then(timeTest);
		}
		
		var breakTupletBarTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.toggleBeamGroup(selection);
			return layout.render().then(timeTest);
		}

		var unbreakTupletBarTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.toggleBeamGroup(selection);
			return layout.render().then(timeTest);
		}

		var stretchTupletTest = () => {
			subTitle('stretch tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.doubleDuration(selection);
			return layout.render().then(timeTest);
		}

		var contractTupletTest = () => {
			subTitle('contract tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			return layout.render().then(timeTest);
		}

		var stretchTupletTest2 = () => {
			subTitle('stretch tuplet 2');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.doubleDuration(selection);
			return layout.render().then(timeTest);
		}
		var contractTupletTest2 = () => {
			// maybe just need changeIndex?
			subTitle('contract tuplet 2');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.halveDuration(selection);
			return layout.render().then(timeTest);
		}
		var contractTupletTest3 = () => {
			return timeTest();
		}

		var unmakeTupletTest = () => {
			subTitle('unmake tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.unmakeTuplet(selection);
			return layout.render().then(timeTest);
		}

		var makeTupletTest2 = () => {
			subTitle('make tuplet 5-let');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.makeTuplet(selection, 5);
			return layout.render().then(timeTest);
		}

		return drawDefaults().then(makeTupletTest).then(breakTupletBarTest).then(unbreakTupletBarTest)
		.then(stretchTupletTest).then(contractTupletTest)
		.then(stretchTupletTest2).then(contractTupletTest2).then(contractTupletTest3)
		.then(unmakeTupletTest).then(makeTupletTest2).then(signalComplete);
	}
}
;
class serializeTestJson {
    static get tupletMeasure() {
        return {
            "score": {
                "staffX": 30,
                "staffY": 40,
                "staffWidth": 1600,
                "interGap": 30,
                "renumberingMap": {}
            },
            "staves": [{
                    "staffX": 10,
                    "staffY": 40,
                    "staffWidth": 200,
                    "staffHeight": 90,
                    "renumberingMap": {},
                    "keySignatureMap": {},
                    "instrumentInfo": {
                        "instrumentName": "Treble Instrument",
                        "keyOffset": "0",
                        "clef": "treble"
                    },
                    "modifiers": [],
                    "measures": [{
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 30.999984741210938,
                            "staffY": 40,
                            "customModifiers": [],
                            "measureNumber": {
                                "measureNumber": 0,
                                "measureIndex": 0,
                                "systemIndex": 0
                            },
                            "staffWidth": 200,
                            "modifierOptions": {},
                            "tuplets": [{
                                    "notes": [{
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1142"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1149"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1156"
                                        }
                                    ],
                                    "numNotes": 3,
                                    "totalTicks": 4096,
                                    "stemTicks": 2048,
                                    "location": 1,
                                    "durationMap": [
                                        1,
                                        1,
                                        1
                                    ],
                                    "bracketed": true,
                                    "ratioed": false,
                                    "startIndex": 1,
                                    "attrs": {
                                        "id": "auto1125",
                                        "type": "SmoTuplet"
                                    }
                                }
                            ],
                            "beamGroups": [{
                                    "notes": [{
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1142"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1149"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1156"
                                        }
                                    ],
                                    "attrs": {
                                        "id": "auto1126",
                                        "type": "SmoBeamGroup"
                                    }
                                }
                            ],
                            "voices": [{
                                    "notes": [{
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1003",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1005",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1006",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
    static get systemStaffJson() {
        return {
            "staffX": 10,
            "staffY": 40,
            "staffWidth": 1600,
            "interGap": 30,
            "startIndex": 0,
            "renumberingMap": {},
            "staves": [{
                    "measures": [{
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 10,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 0,
                                "measureIndex": 0,
                                "systemIndex": 0
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1004",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1005",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1006",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1007",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1012",
                                "type": "SmoMeasure"
                            }
                        }, {
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 410,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 1,
                                "measureIndex": 1,
                                "systemIndex": 1
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1017",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1018",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1019",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1020",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1025",
                                "type": "SmoMeasure"
                            }
                        }, {
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 810,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 2,
                                "measureIndex": 2,
                                "systemIndex": 2
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1030",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1031",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1032",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1033",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1038",
                                "type": "SmoMeasure"
                            }
                        }
                    ],
                    "staffX": 10,
                    "staffY": 40,
                    "staffWidth": 1600,
                    "startIndex": 0,
                    "renumberingMap": {},
                    "instrumentInfo": {
                        "instrumentName": "Treble Instrument",
                        "keyOffset": "0",
                        "clef": "treble"
                    },
                    "renumberIndex": 0
                }
            ],
            "activeStaff": 0
        };
    }
}
;
class PasteTest {

	static CommonTests() {
		var score = SmoScore.getEmptyScore();

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var keys = utController.createUi(score,'Paste Test');
		var undo = keys.undoBuffer;
		var score = keys.score;
		var layout = keys.layout;

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
			return keys.render().then(timeTest);
		}

		var copySetup = () => {
			subTitle('copy setup');
			SmoSelection.noteSelection(layout.score, 0, 2, 0, 1);
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 0, 0, 0), {
				letter: 'a',
				octave: 4,
				accidental: 'n'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 0, 0, 2), {
				letter: 'c',
				octave: 4,
				accidental: '#'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 0, 0, 3), {
				letter: 'd',
				octave: 4,
				accidental: 'n'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 0, 0, 0), {
				letter: 'e',
				octave: 4,
				accidental: 'n'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 1, 0, 1), {
				letter: 'f',
				octave: 4,
				accidental: 'n'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 1, 0, 2), {
				letter: 'g',
				octave: 4,
				accidental: 'n'
			});
			SmoOperation.setPitch(
				SmoSelection.noteSelection(layout.score, 0, 1, 0, 3), {
				letter: 'c',
				octave: 5,
				accidental: 'n'
			});
			return keys.render().then(timeTest);
		}
		var copyTest = () => {
			var selections = [];
			subTitle('copy single note mm 2 beat 1');
			selections.push(SmoSelection.noteSelection(layout.score, 0, 2, 0, 1));
			pasteBuffer.setSelections(keys.score, selections);
			keys.layout.unrenderAll();
			var pasteTarget = {
				staff: 0,
				measure: 1,
				voice: 0,
				tick: 2
			};
			pasteBuffer.pasteSelections(score, pasteTarget);
			return keys.render().then(timeTest);
		}

		var copyDurationSetup = () => {
			subTitle('copy notes with different durations setup');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.halveDuration(selection);
			return layout.render().then(timeTest);
		}

		var copyDurationChange = () => {
			subTitle('copy notes with different durations');
			var selections = [];
			selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 1));
			selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 2));
			selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 3));
			selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 4));
			pasteBuffer.setSelections(score, selections);
			keys.layout.unrenderAll();
			var pasteTarget = {
				staff: 0,
				measure: 2,
				voice: 0,
				tick: 0
			};
			pasteBuffer.pasteSelections(score, pasteTarget);
			return keys.render().then(timeTest);
		}

		var copyOverTupletSetup = () => {
			subTitle('copy notes containing tuplet setup');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.makeTuplet(selection, 3);
			return keys.render().then(timeTest);
		}
		var copyOverTupletTest = () => {
			subTitle('copy notes containing tuplet');
			var selections = [];
			selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 0));
			selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 1));
			selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 2));
			selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 3));

			pasteBuffer.setSelections(score, selections);
			keys.layout.unrenderAll();
			var pasteTarget = {
				staff: 0,
				measure: 2,
				voice: 0,
				tick: 0
			};
			pasteBuffer.pasteSelections(score, pasteTarget);
			return keys.render().then(timeTest);
		}
		return drawDefaults().then(copySetup).then(copyTest).then(copyDurationSetup).then(copyDurationChange).
		then(copyOverTupletSetup).then(copyOverTupletTest).then(signalComplete);
	}
}
;

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
			score = SmoScore.deserialize(JSON.stringify(score.serialize()));
			keys.detach();
			keys = utController.createUi(score,'Serializer Test');
			return keys.layout.render().then(timeTest);
		}

		return drawDefaults().then(accidentalTest).then(serializeTest).then(signalComplete);
	}
}
;
class TrackerTest {

	static CommonTests() {

		var score = SmoScore.getEmptyScore();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});
		var keys = suiController.createUi(score,'Tracker Test');
		var layout = keys.layout;
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
		
		var remap = function() {
				return keys.tracker.updateMap();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			
			return layout.render().then(remap).then(timeTest);
		}

		var trackTest = () => {
			subTitle('initialize tracker');
			return timeTest();
		}

		var addInstrument = () => {
			subTitle('track multiple staves');
			score.addStaff();
			return layout.render().then(remap).then(timeTest);
		}

		var selectionTest1 = () => {
			subTitle('move selection right');
			keys.tracker.moveSelectionRight()
			return timeTest();
		}

		var selectionTest2 = () => {
			subTitle('move selection left');
			keys.tracker.moveSelectionLeft();
			return timeTest();
		}
		var selectionTest3 = () => {
			subTitle('move selection over 5');
			keys.tracker.moveSelectionOffset(5);
			return timeTest();
		}

		var selectDown = () => {
			subTitle('select staff below');
			keys.tracker.moveSelectionDown();
			return timeTest();
		}

		var selectIncreaseRight = () => {
			subTitle('grow selection right');
			keys.tracker.growSelectionRight();
			return timeTest();
		}

		var selectIncreaseLeft = () => {
			subTitle('grow selection left');
			keys.tracker.growSelectionLeft();
			return timeTest();
		}

		return drawDefaults().then(trackTest).then(addInstrument).then(selectionTest1)
		.then(selectionTest2).then(selectionTest3).then(selectDown)
		.then(selectIncreaseRight).then(selectIncreaseLeft).then(signalComplete);
	}
}
;
class ClefTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Clef Test');
		var score=SmoScore.getEmptyScore();
		
		var pasteBuffer = new PasteBuffer();
		
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		
        var keys = utController.createUi(score,'Clef tests');
		var undo = keys.undoBuffer;
		var score = keys.score;
		var layout = keys.layout;		
		
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
                        200);
                });
            return promise;
        }

        var signalComplete = () => {
			detach();
			subTitle('All done!');
            return timeTest();
        }
		var subTitle = (txt) => {
			$('.subTitle').text(txt);
		}

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            return keys.render().then(timeTest);
        }
		
		
		var bassClefTest = () => {
			subTitle('bass clef test');
			SmoOperation.addStaff(score,{
				instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: 0,
                clef: 'bass'
            }});
            return keys.render().then(timeTest);
		}
		
		var clefChangeTest = () => {
			subTitle('change instrument mid-system');
			var instrument = {
				instrumentName:'Treble Instrument',
				keyOffset:0,
				clef:'treble'
			}
			var sel1 = SmoSelection.measureSelection(score,1,1);
			var sel2=SmoSelection.measureSelection(score,1,2);
			keys.layout.unrenderAll();
			SmoOperation.changeInstrument(score,instrument,[sel1,sel2]);
            return keys.render().then(timeTest);
		}
		var bassRenderTest = () => {
			subTitle('change pitch in bass clef');
			var note = SmoSelection.pitchSelection(score,1,0,0,2);
			SmoOperation.transpose(note,3);
            return keys.render().then(timeTest);
		}
		
		var bassDurationTest = () => {
			subTitle('change duration in bass clef');
			var note = SmoSelection.noteSelection(score,1,0,0,1);
			SmoOperation.makeTuplet(note,3);
            return keys.render().then(timeTest);
		}
		
		var tenorClefTest = () => {
			subTitle('add cello clef');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Cello',
                keyOffset: 0,
                clef: 'tenor'
			}});
            return keys.render().then(timeTest);
		}
		
		var altoClefTest = () => {
			subTitle('add viola clef');
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Viola',
                keyOffset: 0,
                clef: 'alto'
			}});
            return keys.render().then(timeTest);
		}
		
		var baritoneClefTest = () => {
			subTitle('remove and add clef');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-c'
			}});
            return keys.render().then(timeTest);
		}
		
		var baritoneClefTest2 = () => {
			subTitle('remove and add clef 2');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-f'
			}});
            return keys.render().then(timeTest);
		}
		
		var trumpetClefTest = () => {
			subTitle('clef with instrument in different key');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Trumpet',
                keyOffset: 2,
                clef: 'treble'
			}});
            return keys.render().then(timeTest);
		}
      
        return drawDefaults().then(bassClefTest).then(clefChangeTest).then(bassRenderTest).then(bassDurationTest).then(tenorClefTest)
		   .then(altoClefTest).then(baritoneClefTest).then(baritoneClefTest2).then(trumpetClefTest).then(signalComplete);
    }
}
;
class MeasureTest {
  static CommonTests() {
		var keys = utController.createUi(SmoScore.getDefaultScore(),'Measure Test');
		var score = keys.score;
		var layout = keys.layout;
		// suiSimpleLayout.debugLayout=true;
		var undoBuffer = keys.undoBuffer;
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		SmoOperation.addStaff(score,{
				instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: 0,
                clef: 'bass'
            }});
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
						500);
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
		
		var startRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			return layout.render().then(timeTest);
		}
		
		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
			return layout.render().then(timeTest);
		}	

		var endRepeatTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}),
			    undoBuffer,'set barline');
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}),
			    undoBuffer,'set barline');
			return layout.render().then(timeTest);
		}
		
		var doubleEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			return layout.render().then(timeTest);
		}	
		var endEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			return layout.render().then(timeTest);
		}	
		var noneEndTest = () => {
			var selection = SmoSelection.measureSelection(score, 0,1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			return layout.render().then(timeTest);
		}
		
		var symbolTest1 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest2 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest3 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Coda}));
			return layout.render().then(timeTest);
		}
		var symbolTest4 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlCoda}));
			return layout.render().then(timeTest);
		}
		var symbolTest5 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlFine}));
			return layout.render().then(timeTest);
		}
		var symbolTest6 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}
		
		var voltaTest1 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:1,endBar:3,number:1}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}
		
		var voltaTest2 = () => {
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:2,endBar:3,number:2}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			return layout.render().then(timeTest);
		}      	       
        
        return drawDefaults().then(startRepeatTest).then(endRepeatTest).then(voltaTest1).then(voltaTest2).then(doubleEndTest).then(endEndTest).then(noneEndTest)
		    .then(symbolTest1).then(symbolTest2).then(symbolTest3).then(symbolTest4).then(symbolTest5).then(symbolTest6)
			.then(signalComplete); 
    }
}
;

class TestAll {
	static Run = function() {
		  console.log("DOM fully loaded and parsed");
            TimeSignatureTest.CommonTests().then(
			ChordTest.CommonTests).then(VoiceTest.CommonTests).then(TupletTest.CommonTests)
			.then(KeySignatureTest.CommonTests).then(ClefTest.CommonTests)
			.then(PasteTest.CommonTests).then(UndoTest.CommonTests).then(TrackerTest.CommonTests);
	}
}