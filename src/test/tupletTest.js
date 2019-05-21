

class TupletTest {

   
    static CommonTests() {
		$('h1.testTitle').text('Tuplet Test');		
		var keys = utController.createUi(document.getElementById("boo"),SmoScore.getDefaultScore());
		var score = keys.score;
		var layout = keys.layout;
		var measure = SmoSelection.measureSelection(score,0,0).measure;
		
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
            layout.render();
            return timeTest();
        }

        var makeTupletTest = () => {
			var selection=SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.makeTuplet(selection,3);
            layout.render();
            return timeTest();
        }

        var stretchTupletTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.doubleDuration(selection);
            layout.render();
            return timeTest();
        }

        var contractTupletTest = () => {
            var selection = SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.halveDuration(selection);
            layout.render();
            return timeTest();
        }

        var stretchTupletTest2 = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,3);
			SmoOperation.doubleDuration(selection);
            layout.render();
            return timeTest();
        }
        var contractTupletTest2 = () => {
            // maybe just need changeIndex?
			var selection = SmoSelection.noteSelection(score,0,0,0,2);
			SmoOperation.halveDuration(selection);
            layout.render();
            return timeTest();
        }
		var contractTupletTest3 = () => {
            return timeTest();
        }

		var unmakeTupletTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.unmakeTuplet(selection);
            layout.render();
            return timeTest();
        }
		
		var makeTupletTest2 = () => {
			var selection=SmoSelection.noteSelection(score,0,0,0,3);
			SmoOperation.makeTuplet(selection,5);
            layout.render();
            return timeTest();
        }
				
        return drawDefaults().then(makeTupletTest).then(stretchTupletTest).then(contractTupletTest)
		.then(stretchTupletTest2).then(contractTupletTest2).then(contractTupletTest3)
		.then(unmakeTupletTest).then(makeTupletTest2).then(signalComplete);
    }
}
