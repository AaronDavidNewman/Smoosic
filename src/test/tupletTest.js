

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
