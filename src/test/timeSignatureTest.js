
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
