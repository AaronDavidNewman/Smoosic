
class TrackerTest {


    static CommonTests() {
		var score=SmoScore.getEmptyScore();
        
		score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
		var layout = smrfSimpleLayout.createScoreLayout(document.getElementById("boo"),score);

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
            layout.render();
            return timeTest();
        }    

        var trackTest = () => {
            var tracker = new Tracker(layout);
			tracker.updateMap();
			tracker.bindEvents();
        }

        return drawDefaults().then(trackTest).then(signalComplete);
    }
}
