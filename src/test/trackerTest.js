
class TrackerTest {

	static CommonTests() {

    var application = SuiApplication.createUtApplication({scoreLoadJson:'emptyScoreJson'});

		var keys = application.controller;
		var score = keys.view.renderer.score;
		var layout = keys.view.renderer;

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});
		var timeTest = () => {
    layout.forceRender();

		const promise = new Promise((resolve, reject) => {
 			setTimeout(() => {
 				resolve();
  			},200);
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
			keys.view.tracker.moveSelectionRight(null)
			return timeTest();
		}

		var selectionTest2 = () => {
			subTitle('move selection left');
			keys.view.tracker.moveSelectionLeft();
			return timeTest();
		}
		var selectionTest3 = () => {
			subTitle('move selection over 5');
			keys.view.tracker.moveSelectionOffset(5);
			return timeTest();
		}

		var selectDown = () => {
			subTitle('select staff below');
			keys.view.tracker.moveSelectionDown();
			return timeTest();
		}

		var selectIncreaseRight = () => {
			subTitle('grow selection right');
			keys.view.tracker.growSelectionRight();
			return timeTest();
		}

		var selectIncreaseLeft = () => {
			subTitle('grow selection left');
			keys.view.tracker.growSelectionLeft();
			return timeTest();
		}

		return drawDefaults().then(trackTest).then(addInstrument).then(selectionTest1)
		.then(selectionTest2).then(selectionTest3).then(selectDown)
		.then(selectIncreaseRight).then(selectIncreaseLeft).then(signalComplete);
	}
}
