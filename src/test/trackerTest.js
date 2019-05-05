
class TrackerTest {

	static CommonTests() {
		$('h1.testTitle').text('Tracker Test');
		
		var score = SmoScore.getEmptyScore();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});
		var keys = suiController.createUi(document.getElementById("boo"),score);
		var timeTest = () => {
			const promise = new Promise((resolve, reject) => {
					setTimeout(() => {
						resolve();
					},
						500);
				});
			return promise;
		}

		var signalComplete = () => {
			return timeTest();
		}

		var drawDefaults = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			// measure.applyModifiers();
			keys.layout.render();
			return timeTest();
		}


		var trackTest = () => {
			keys.tracker.updateMap();			
			return timeTest();
		}

		var addInstrument = () => {
			score.addInstrument();
			keys.layout.render();
			keys.tracker.updateMap();
			return timeTest();
		}
		
		var selectionTest1 = () => {
			keys.tracker.moveSelectionRight();
			return timeTest();
		}

		var selectionTest2 = () => {
			keys.tracker.moveSelectionLeft();
			return timeTest();
		}
		var selectionTest3 = () => {
			keys.tracker.moveSelectionOffset(5);
			return timeTest();
		}
		
		var selectDown = () => {
			keys.tracker.moveSelectionDown();
			return timeTest();
		}
		
		var selectIncreaseRight = () => {
			keys.tracker.growSelectionRight();
			return timeTest();
		}
		
		var selectIncreaseLeft = () => {
			keys.tracker.growSelectionLeft();
			return timeTest();
		}

		return drawDefaults().then(trackTest).then(addInstrument).then(selectionTest1)
		.then(selectionTest2).then(selectionTest3).then(selectDown)
		.then(selectIncreaseRight).then(selectIncreaseLeft).then(signalComplete);
	}
}
