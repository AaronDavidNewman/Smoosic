

class TupletTest {

	static CommonTests() {
    var application = SuiApplication.createUtApplication();
    var keys = application.controller;
    var score = keys.view.renderer.score;
    var layout = keys.view.renderer;
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
