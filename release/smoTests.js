
class ChordTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
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
			layout.forceRender();
      return timeTest();
		}

		var preBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.halveDuration(selection);
			layout.forceRender();
            return timeTest();
		}

		var breakBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleBeamGroup(selection);
			layout.forceRender();
      return timeTest();
		}

		var undoBeamTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.doubleDuration(selection);
			selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			layout.forceRender();
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
			layout.forceRender();
            return timeTest();
		}

		var crescendoTest = () => {
			subTitle('crescendo test');
			var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
			var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
			SmoOperation.crescendo(ft, tt);
			layout.forceRender();
            return timeTest();
		}

		var intervalTest = () => {
			subTitle('interval test');
			var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 2);
			if (selection) {
				SmoOperation.interval(selection, 4);
			}
			layout.forceRender();
            return timeTest();
		}

		var durationTest = () => {
			subTitle('duration reduce test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.halveDuration(selection);
			layout.forceRender();
            return timeTest();
		}

		var durationTest2 = () => {
			subTitle('duration increase test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.doubleDuration(selection);
			layout.forceRender();
            return timeTest();
		}

		var rerenderTest = () => {
			layout.forceRender();
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
			layout.forceRender();
            return timeTest();
		}

		var unmakeTupletTest = () => {
			subTitle('unmake tuplet test');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.unmakeTuplet(selection);
			layout.forceRender();
            return timeTest();
		}

		var courtesyTest = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.courtesyAccidental(target, true);
			// target.note.pitches[1].cautionary = true;
			layout.forceRender();
            return timeTest();
		}

		var enharmonicTest1 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			layout.forceRender();
            return timeTest();
		}
		var enharmonicTest2 = () => {
			subTitle('courtesy accidental test');
			var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.toggleEnharmonic(target);
			// target.note.pitches[1].cautionary = true;
			layout.forceRender();
            return timeTest();
		}

		var accentTest = () => {
			subTitle('accent  test');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.accent,
					position: SmoArticulation.positions.above
				}));
			layout.forceRender();
            return timeTest();
		}

		var accentTest2 = () => {
			subTitle('accent  test 2');
			var target = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.toggleArticulation(target, new SmoArticulation({
					articulation: SmoArticulation.articulations.tenuto,
					position: SmoArticulation.positions.above
				}));
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
			layout.forceRender();
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
;
class UndoTest {

	static CommonTests() {

    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
		var score = keys.layout.score;
		var layout = keys.layout;
		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var undo = keys.undoBuffer;

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
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			keys.render()
            return timeTest();
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
			keys.render()
            return timeTest();
		}
		var undoTest = () => {
			var buf = undo.peek();
			subTitle('undo ' + buf.title);
			layout.undo(undo);
			keys.render()
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
			keys.render()
            return timeTest();
		}
		var keySigTest = () => {
			subTitle('key sig to A');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.addKeySignature(score, selection, 'A', undo);
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoUndoable.makeNote(selection, undo);
			keys.render()
            return timeTest();
		}
		var crescendoTest = () => {
			var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
			var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
			SmoUndoable.crescendo(ft, tt, undo);
			keys.render()
            return timeTest();
		}
		var keySigTest2 = () => {
			subTitle('key sig to Bb');
			var selection = SmoSelection.measureSelection(score, 0, 2);
			SmoUndoable.addKeySignature(score, selection, 'Bb', undo);
			keys.render()
            return timeTest();
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
			keys.render()
            return timeTest();
		}
		var keySigTest3 = () => {
			subTitle('key sig change to f#');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.addKeySignature(score, selection, 'C#', undo);
			selection = SmoSelection.measureSelection(score, 0, 2);
			SmoUndoable.addKeySignature(score, selection, 'Cb', undo);
			keys.render()
            return timeTest();
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
    var application = SuiApplication.createUtApplication({scoreLoadJson:'sixTestJson'});
    var keys = application.controller;
    var score = keys.layout.score;
    $('h1.testTitle').text('Time Signature Test');
    var layout = keys.layout;
    var measure = SmoSelection.measureSelection(score, 0, 0).measure;

    var timeTest = () => {
      const promise = new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve();
            }, 200);
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
		  layout.forceRender();
      return timeTest();
    }

  var stretchTest = () => {
    subTitle('stretch 6/8 test');
    var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
    SmoOperation.doubleDuration(selection);
    var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
    SmoOperation.dotDuration(selection);
    layout.forceRender();
    return timeTest();
  }

    var breakBeamTest = () => {
      subTitle('break beam');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.toggleBeamGroup(selection);
		  layout.forceRender();
      return timeTest();
    }

    var breakBeamTest2 = () => {
      subTitle('break beam 2');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.toggleBeamGroup(selection);
    	selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
    	SmoOperation.toggleBeamGroup(selection);
    	layout.forceRender();
      return timeTest();
    }

  	var unbreakBeamTest = () => {
      subTitle('unbreak beam');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.toggleBeamGroup(selection);
  		layout.forceRender();
      return timeTest();
    }

    var contractTest = () => {
      subTitle('contract 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.halveDuration(selection);
	    layout.forceRender();
      return timeTest();
    }

    var makeDupletTest = () => {
      subTitle('duplet 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.dotDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.doubleDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.dotDuration(selection);
	    layout.forceRender();
      return timeTest();
    }

    var unmakeDupletTest = () => {
      subTitle('duplet 6/8 test');
      var selection = SmoSelection.noteSelection(score, 0, 0, 0, 0);
      SmoOperation.undotDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
      SmoOperation.undotDuration(selection);

      selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
      SmoOperation.doubleDuration(selection);
      selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
      SmoOperation.doubleDuration(selection);
	    layout.forceRender();
      return timeTest();
    }
    var changeBeamGroup = () => {
      subTitle('duplet 6/8 test');
      var group1=[];
      var group2=[];
      for (var i=0;i<4;++i) {
          group1.push(SmoSelection.noteSelection(score, 0, 0, 0, i));
      }
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 4));
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 5));
      SmoOperation.beamSelections(group1);
      SmoOperation.beamSelections(group2);
	    layout.forceRender();
      return timeTest();
    }
    var flipBeams1 = () => {
      subTitle('flip beams 1');
      var group2=[];
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 4));
      group2.push(SmoSelection.noteSelection(score, 0, 0, 0, 5));
      SmoOperation.toggleBeamDirection(group2);
  		layout.forceRender();
      return timeTest();
    }

      return drawDefaults().then(breakBeamTest).then(breakBeamTest2).then(unbreakBeamTest)
	.then(stretchTest).then(contractTest).then(makeDupletTest).then(unmakeDupletTest)
      .then(changeBeamGroup).then(flipBeams1).then(signalComplete);

  }
}
;
class KeySignatureTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var serial = JSON.stringify(score.serialize(), null, '');
		console.log(serial);
		var undo = keys.undoBuffer;
		var layout = keys.layout;

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
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
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
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
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
			undo.addBuffer('undo key sig', 'staff', selection.selector, selection.staff);
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
			undo.addBuffer('undo key sig', 'score', selection.selector, score);
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
;

class TupletTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;
    var layout = keys.layout;
    $('h1.testTitle').text('Tuplet Test');

		var measure = SmoSelection.measureSelection(score, 0, 0).measure;

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
			layout.forceRender();
            return timeTest();
		}

		var makeTupletTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.makeTuplet(selection, 3);
     		var measureS = SmoSelection.measureSelection(score, 0, 0);
			console.log(JSON.stringify(score.serialize(), null, ' '));
			layout.forceRender();
            return timeTest();
		}

		var breakTupletBarTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.toggleBeamGroup(selection);
			layout.forceRender();
            return timeTest();
		}

		var unbreakTupletBarTest = () => {
			subTitle('make tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.toggleBeamGroup(selection);
			layout.forceRender();
            return timeTest();
		}

		var stretchTupletTest = () => {
			subTitle('stretch tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.doubleDuration(selection);
			layout.forceRender();
            return timeTest();
		}

		var contractTupletTest = () => {
			subTitle('contract tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.halveDuration(selection);
			layout.forceRender();
            return timeTest();
		}

		var stretchTupletTest2 = () => {
			subTitle('stretch tuplet 2');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.doubleDuration(selection);
			layout.forceRender();
            return timeTest();
		}
		var contractTupletTest2 = () => {
			// maybe just need changeIndex?
			subTitle('contract tuplet 2');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.halveDuration(selection);
			layout.forceRender();
            return timeTest();
		}
		var contractTupletTest3 = () => {
			layout.forceRender();
            return timeTest();
		}

		var unmakeTupletTest = () => {
			subTitle('unmake tuplet');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.unmakeTuplet(selection);
			layout.forceRender();
            return timeTest();
		}

		var makeTupletTest2 = () => {
			subTitle('make tuplet 5-let');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 3);
			SmoOperation.makeTuplet(selection, 5);
			layout.forceRender();
            return timeTest();
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
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;

		var pasteBuffer = new PasteBuffer();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});

		var undo = keys.undoBuffer;
		var layout = keys.layout;

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
			subTitle('');
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			keys.render();
            return timeTest();
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
			keys.render();
            return timeTest();
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
			keys.render();
            return timeTest();
		}

		var copyDurationSetup = () => {
			subTitle('copy notes with different durations setup');
			var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
			SmoOperation.halveDuration(selection);
			keys.render();
            return timeTest();
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
			keys.render();
            return timeTest();
		}

		var copyOverTupletSetup = () => {
			subTitle('copy notes containing tuplet setup');
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
			SmoOperation.makeTuplet(selection, 3);
			keys.render();
            return timeTest();
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
			keys.render();
            return timeTest();
		}
		return drawDefaults().then(copySetup).then(copyTest).then(copyDurationSetup).then(copyDurationChange).
		then(copyOverTupletSetup).then(copyOverTupletTest).then(signalComplete);
	}
}
;

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
;
class TrackerTest {

	static CommonTests() {

    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
		var score = keys.layout.score;
		var layout = keys.layout;

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});
		var timeTest = () => {
      layout.forceRender();

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

      return timeTest();
		}

		var trackTest = () => {
			subTitle('initialize tracker');
			return timeTest();
		}

		var addInstrument = () => {
			subTitle('track multiple staves');
			score.addStaff();
      return timeTest();
		}

		var selectionTest1 = () => {
			subTitle('move selection right');
			keys.tracker.moveSelectionRight(null)
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
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;

    var pasteBuffer = new PasteBuffer();

  	var undo = keys.undoBuffer;

    score.addDefaultMeasureWithNotes(0,{});
    score.addDefaultMeasureWithNotes(1,{});
    score.addDefaultMeasureWithNotes(2,{});

  	var detach = () => {
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
      subTitle('All done!');
      return timeTest();
    }
  	var subTitle = (txt) => {
  		$('.subTitle').text(txt);
  	}

    var drawDefaults = () => {
      // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
      // measure.applyModifiers();
    	keys.render()
      return timeTest();
    }


  	var bassClefTest = () => {
  		subTitle('bass clef test');
  		SmoOperation.addStaff(score,{
  			instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: 0,
                clef: 'bass'
            }});
  		keys.render()
            return timeTest();
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
  		keys.render()
      return timeTest();
  	}
  	var bassRenderTest = () => {
  		subTitle('change pitch in bass clef');
  		var note = SmoSelection.pitchSelection(score,1,0,0,2);
  		SmoOperation.transpose(note,3);
  		keys.render()
      return timeTest();
  	}

  	var bassDurationTest = () => {
  		subTitle('change duration in bass clef');
  		var note = SmoSelection.noteSelection(score,1,0,0,1);
  		SmoOperation.makeTuplet(note,3);
  		keys.render()
      return timeTest();
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
  		keys.render()
      return timeTest();
  	}

  	var altoClefTest = () => {
  		subTitle('add viola clef');
  		SmoOperation.addStaff(score, {
  			instrumentInfo: {
          instrumentName: 'Viola',
          keyOffset: 0,
          clef: 'alto'
  		}});
  		keys.render()
      return timeTest();
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
  		keys.render()
      return timeTest();
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
  		keys.render()
      return timeTest();
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
  		keys.render()
      return timeTest();
  	}

      return drawDefaults().then(bassClefTest).then(clefChangeTest).then(bassRenderTest).then(bassDurationTest).then(tenorClefTest)
	   .then(altoClefTest).then(baritoneClefTest).then(baritoneClefTest2).then(trumpetClefTest).then(signalComplete);
  }
}
;
class MeasureTest {
  static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;

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
			keys.render()
      return timeTest();
		}

		var startRepeatTest = () => {
			subTitle('startRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.startRepeat}));
			keys.render()
      return timeTest();
		}

    var pickupTest = () => {
        score.addPickupMeasure(0,4096+2048);
        SmoUndoable.padMeasuresLeft(SmoSelection.measureSelection(score,0,2),8,undoBuffer);
        score.staves[0].measures[2].setBarline(new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}));
        keys.render();
        return timeTest();
    }

		var endRepeatTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}),
			    undoBuffer,'set barline');
			selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'setMeasureBarline',new SmoBarline({position:SmoBarline.positions.start,barline:SmoBarline.barlines.singleBar}),
			    undoBuffer,'set barline');
			keys.render()
      return timeTest();
		}

		var doubleEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.doubleBar}));
			keys.render()
      return timeTest();
		}
		var endEndTest = () => {
			subTitle('endRepeatTest');
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			keys.render()
      return timeTest();
		}
		var noneEndTest = () => {
			subTitle('noneEndTest');
			var selection = SmoSelection.measureSelection(score, 0,1);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.none}));
			keys.render()
      return timeTest();
		}

		var symbolTest1 = () => {
			subTitle('symbolTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlCoda}));
			keys.render()
      return timeTest();
		}
		var symbolTest2 = () => {
			subTitle('symbolTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DcAlFine}));
			keys.render()
      return timeTest();
		}
		var symbolTest3 = () => {
			subTitle('symbolTest3');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Coda}));
			keys.render()
      return timeTest();
		}
		var symbolTest4 = () => {
			subTitle('symbolTest4');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlCoda}));
			keys.render()
      return timeTest();
		}
		var symbolTest5 = () => {
			subTitle('symbolTest5');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endRepeat}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.DsAlFine}));
			keys.render()
      return timeTest();
		}
		var symbolTest6 = () => {
			subTitle('symbolTest6');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.setMeasureBarline(score,selection,new SmoBarline({position:SmoBarline.positions.end,barline:SmoBarline.barlines.endBar}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

		var voltaTest1 = () => {
			subTitle('voltaTest1');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:1,endBar:3,number:1}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

		var voltaTest2 = () => {
			subTitle('voltaTest2');
			var selection = SmoSelection.measureSelection(score, 0,3);
			SmoOperation.addEnding(score,new SmoVolta({startBar:2,endBar:3,number:2}));
			SmoOperation.setRepeatSymbol(score,selection,new SmoRepeatSymbol({position:SmoRepeatSymbol.positions.end,symbol:SmoRepeatSymbol.symbols.Fine}));
			keys.render()
      return timeTest();
		}

        return drawDefaults().then(startRepeatTest).then(pickupTest).then(endRepeatTest).then(voltaTest1).then(voltaTest2)
		    .then(doubleEndTest).then(endEndTest).then(noneEndTest)
		    .then(symbolTest1).then(symbolTest2).then(symbolTest3).then(symbolTest4).then(symbolTest5).then(symbolTest6)
			.then(signalComplete);
    }
}
;

class TestAll {
	static Run() {
		  console.log("DOM fully loaded and parsed");
            TimeSignatureTest.CommonTests().then(
			ChordTest.CommonTests).then(VoiceTest.CommonTests).then(TupletTest.CommonTests)
			.then(KeySignatureTest.CommonTests).then(ClefTest.CommonTests)
			.then(PasteTest.CommonTests).then(UndoTest.CommonTests).then(MeasureTest.CommonTests)
			.then(TextTest.CommonTests).then(TrackerTest.CommonTests);
	}
};
class TextTest {
  static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.layout.score;
    score.addDefaultMeasureWithNotes(0,{});
    score.addDefaultMeasureWithNotes(1,{});
    score.addDefaultMeasureWithNotes(2,{});
		var undo = keys.undoBuffer;
		var tt = new SmoScoreText({text:'Hello world',x:240,y:30});
		var mt=new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
		var delay=250;
		// var measure = SmoSelection.measureSelection(score, 0, 0).measure;

		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						delay);
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

		var scoreText1 = () => {
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Text Test 1');
			score.addScoreText(tt);
			keys.render();
            return timeTest();
		}

		var scoreText2 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel=SmoScoreText.boxModels.spacing;
			tt.width=100;
			keys.render();
            return timeTest();
		}

		var scoreText3 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.boxModel=SmoScoreText.boxModels.spacingAndGlyphs;
			tt.fontInfo.size=20;
			tt.width=100;
			keys.render();
            return timeTest();
		}

		var scoreText4 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.fontInfo.family='Arial';
			tt.scaleInPlace(1.5);
			keys.render();
            return timeTest();
		}

		var _scaleUp = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(1.2);
			keys.render();
            return timeTest();
		}

		var scaleUp = () => {
			var p = _scaleUp();
			return p.then(_scaleUp).then(timeTest); // .then(_scaleUp);
		}

		var _scaleDown = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.scaleInPlace(0.8);
			keys.render();
            return timeTest();
		}
		var scaleDown = () => {
			var p = _scaleDown();
			return p.then(_scaleDown).then(timeTest); // .then(_scaleUp);
		}

		var _moveText = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.x = tt.x + 30;
			tt.y = tt.y + 10;
			keys.render();
            return timeTest();
		}

		var moveText  = () => {
			var p = _moveText();
			return p.then(_moveText).then(timeTest); // .then(_scaleUp);
		}


        var rehearsalMarkTest= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark');
			keys.render();
            return timeTest();
        }

         var rehearsalMarkTest2= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2.1');
            selection = SmoSelection.measureSelection(score, 0, 2);
            rh=new SmoRehearsalMark();
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2.2');
			keys.render();
            return timeTest();
        }

         var rehearsalMarkTest3= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'test rehearsal mark2');
			keys.render();
            return timeTest();
        }

        var tempoTest = () => {
            var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.1');
            selection = SmoSelection.measureSelection(score, 0, 2);
            SmoUndoable.scoreSelectionOp(score,selection,'removeRehearsalMark',null,undo,'tempo test 1.2');

            selection = SmoSelection.measureSelection(score, 0, 0);
            SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
              new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
            selection = SmoSelection.measureSelection(score, 0, 1);
            SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
              new SmoTempoText({tempoMode: SmoTempoText.tempoModes.textMode,
                  tempoText:SmoTempoText.tempoTexts.adagio,bpm:120}),undo,'tempo test 1.3');
			keys.render();
            return timeTest();

        }

		var lyricTest = () => {
			var s1 = SmoSelection.noteSelection(score,0,0,0,1);
			var s2 = SmoSelection.noteSelection(score,0,0,0,2);
			var s3 = SmoSelection.noteSelection(score,0,0,0,3);
			var s4 = SmoSelection.noteSelection(score,0,1,0,0);
			var lyric = new SmoLyric({text:'All'});
			SmoUndoable.measureSelectionOp(score,s1,'addLyric',new SmoLyric({text:'All'}),undo,'lyric test 1');
			SmoUndoable.measureSelectionOp(score,s2,'addLyric',new SmoLyric({text:'Boys'}),undo,'lyric test 2');
			SmoUndoable.measureSelectionOp(score,s3,'addLyric',new SmoLyric({text:'Eat'}),undo,'lyric test 3');
			SmoUndoable.measureSelectionOp(score,s4,'addLyric',new SmoLyric({text:'Grass'}),undo,'lyric test 4');
			SmoUndoable.measureSelectionOp(score,s1,'addLyric',new SmoLyric({verse:1,text:'Cows'}),undo,'lyric test 1');
			SmoUndoable.measureSelectionOp(score,s2,'addLyric',new SmoLyric({verse:1,text:'Do'}),undo,'lyric test 2');
			SmoUndoable.measureSelectionOp(score,s3,'addLyric',new SmoLyric({verse:1,text:'Fine'}),undo,'lyric test 3');
			SmoUndoable.measureSelectionOp(score,s4,'addLyric',new SmoLyric({verse:1,text:'Always'}),undo,'lyric test 4');
			keys.render()
            return timeTest();
		}

         /* var rehearsalMarkTest4= () => {
            var rh=new SmoRehearsalMark();
			var selection = SmoSelection.measureSelection(score, 0, 1);
			SmoUndoable.scoreSelectionOp(score,selection,'addRehearsalMark',rh,undo,'test rehearsal mark2');
			return layout.render().then(timeTest);
        }    */

		var measureText1 = () => {
			tt = score.getScoreText(tt.attrs.id);
			tt.x = 240;
			tt.y = 30;
			tt.scaleX=1.0;
			tt.scaleY=1.0;
			tt.translateX=0;
			tt.translateY=0;
            delay = 500;

			mt = new SmoMeasureText({position:SmoMeasureText.positions.left,text:'Measure Text'});
			var selection = SmoSelection.measureSelection(score, 0, 0);
            selection.measure.padLeft = 12;
			SmoUndoable.measureSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText1');

			keys.render()
            return timeTest();
		}

		var measureText2 = () => {

			mt.position = SmoMeasureText.positions.above;
			mt.fontInfo.size='7';
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText2');

			keys.render();
            return timeTest();
		}


		var measureText3 = () => {

			mt.position = SmoMeasureText.positions.below;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText3');

			keys.render();
            return timeTest();
		}

		var measureText4 = () => {

			mt.position = SmoMeasureText.positions.right;
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'addMeasureText',mt,undo,'test measureText4');

			keys.render();
            return timeTest();
		}

		var titleText1 = () => {
            delay = 250;
			SmoUndoable.scoreOp(score,'removeScoreText',tt,undo,'remove text titelText1');
			tt = new SmoScoreText({text:'My Song',position:'title'});
			var selection = SmoSelection.measureSelection(score, 0, 0);
			SmoUndoable.scoreSelectionOp(score,selection,'removeMeasureText',mt,undo,'test measureText3');
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 1');
			keys.render();
            return timeTest();
		}

		var titleText2 = () => {
			delay=500;
			tt = new SmoScoreText({text:'My Foot',position:'footer'});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 2');
			keys.render();
            return timeTest();
		}

		var titleText3 = () => {
			// score.removeScoreText(tt);
			tt = new SmoScoreText({text:'My Head',position:'header'});
			// var selection = SmoSelection.measureSelection(score, 0, 0);
			// selection.measure.removeMeasureText(mt.attrs.id);
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Score Title Test 3');
			keys.render();
            return timeTest();
		}

		var copyText1 = () => {
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Right Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			keys.render();
            return timeTest();
		}

		var copyText2 = () => {
			SmoUndoable.scoreOp(score,'removeScoreText',tt,undo,'Copy Text Test 1');
			tt = new SmoScoreText({text:'Copyright By Me A Long Line Center Justified',position:SmoScoreText.positions.copyright,
			    boxModel: SmoScoreText.boxModels.wrap,width:100,height:100,justification:'center'});
			SmoUndoable.scoreOp(score,'addScoreText',tt,undo,'Copy Text Test 1');
			keys.render();
            return timeTest();
		}

        return drawDefaults().then(scoreText1).then(scoreText2).then(scoreText3).then(scoreText3).then(scoreText4).
		   then(scaleUp).then(scaleDown).then(moveText).then(lyricTest).then(rehearsalMarkTest).then(rehearsalMarkTest2)
           .then(rehearsalMarkTest3).then(tempoTest).then(measureText1).
		   then(measureText2).then(measureText3).then(measureText4)
		   .then(titleText1).then(titleText2).then(titleText3).then(copyText1).then(copyText2).then(signalComplete);
    }
}

//# sourceMappingURL=smoTests.js.map