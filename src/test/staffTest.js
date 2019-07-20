
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
		
		var pasteBuffer = new PasteBuffer();
		
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		
		var serial = JSON.stringify(score.serialize(),null,'');
		console.log(serial);
        var keys = utController.createUi(document.getElementById("boo"),score);
		var undo = keys.undoBuffer;
		var score = keys.score;
		var layout = keys.layout;		
		
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
            // measure.applyModifiers();
            keys.render();
            return timeTest();
        }
		
		var bassClefTest = () => {
			SmoOperation.addInstrument(score,{
				instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: '0',
                clef: 'bass'
            }});
			keys.render();
		}

      
        return drawDefaults().then(bassClefTest).then(signalComplete);
    }
}
