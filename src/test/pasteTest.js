
class PasteTest {

    static CommonTests() {
        $('h1.testTitle').text('Paste Test');
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
            layout.render();
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
