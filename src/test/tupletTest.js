

class TupletTest {

   
    static CommonTests() {
		$('h1.testTitle').text('Tuplet Test');		
		var keys = suiKeys.createUi(document.getElementById("boo"),SmoScore.getDefaultScore());
		var score = keys.score;
		var layout = keys.layout;
		var measure = score.getMeasureAtSelection({measureIndex:0});
		
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
                        500);
                });
            return promise;
        }

		var signalComplete = () => {
			detach();
			return timeTest();
		}
		
        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
			smoModifierFactory.applyModifiers(measure);
            layout.render();
            return timeTest();
        }

        var makeTupletTest = () => {
            var tickmap = measure.tickmap();
            var actor = new SmoMakeTupletActor({
                    index: 1,
                    totalTicks: 4096,
                    numNotes: 3,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }

        var stretchTupletTest = () => {
            var actor = new SmoStretchTupletActor({
                    changeIndex: 1,
                    startIndex: 0,
                    endIndex: 1,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }

        var contractTupletTest = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 1,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }

        var stretchTupletTest2 = () => {
            var actor = new SmoStretchTupletActor({
                    changeIndex: 2,
                    startIndex: 1,
                    endIndex: 2,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }
        var contractTupletTest2 = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 2,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }
		var contractTupletTest3 = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 1,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }

		var unmakeTupletTest = () => {
            // maybe just need changeIndex?
            var actor = new SmoUnmakeTupletActor({
                    startIndex:1,
				    endIndex:4,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }
		
		var makeTupletTest2 = () => {
            // maybe just need changeIndex?
            var actor = new SmoMakeTupletActor({
                    index:3,
					totalTicks:4096,
				    numNotes:5,
                    measure: measure
                });
			SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }
				
        return drawDefaults().then(makeTupletTest).then(stretchTupletTest).then(contractTupletTest)
		.then(stretchTupletTest2).then(contractTupletTest2).then(contractTupletTest3)
		.then(unmakeTupletTest).then(makeTupletTest2).then(signalComplete);
    }
}
