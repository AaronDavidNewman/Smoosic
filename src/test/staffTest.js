
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
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
		
        var changePitch = () => {
            var target = SmoSelection.pitchSelection(layout.score,0,2, 0, 1,[0]);
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
			SmoOperation.setPitch(target,{
                        letter: 'e',
                        octave: 4,
                        accidental: 'b'
                    });
            /* if (target) {
                target.note.pitches = [{
                        letter: 'e',
                        octave: 4,
                        accidental: 'b'
                    }
                ];
            }   */
            keys.render();
            return timeTest();
        }
		var undoTest = () => {
			layout.undo(undo);
            return timeTest();
		}
        var changePitch2 = () => {
            var target = SmoSelection.pitchSelection(score,0,1, 0, 1, [0]);
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
			SmoOperation.setPitch(target,{
					letter: 'f',
					octave: 4,
					accidental: '#'
				}
			);
            
			var selection = SmoSelection.noteSelection(score,0,1,0,2);
			SmoOperation.makeRest(selection);
            keys.render();
            return timeTest();
        }
		var keySigTest= () => {
			var selection = SmoSelection.measureSelection(score,0,1);
			undo.addBuffer('undo key sig','staff',selection.selector,selection.staff);
			SmoOperation.addKeySignature(score,selection,'A');
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score,0,1,0,2);
			SmoOperation.makeNote(selection);
			keys.render();
			return timeTest();
		}
		var keySigTest2= () => {
			var selection = SmoSelection.measureSelection(score,0,2);
			SmoOperation.addKeySignature(score,selection,'Bb');
			keys.render();
			return timeTest();
		}
		var keySigTest3= () => {
			var selection = SmoSelection.measureSelection(score,0,1);
			SmoOperation.addKeySignature(score,selection,'C#');
			selection = SmoSelection.measureSelection(score,0,2);
			SmoOperation.addKeySignature(score,selection,'Cb');
			keys.render();			
			return timeTest();
		}
        var serializeTest = () => {
			var scoreJson=JSON.stringify(score.serialize());
            // score = SmoScore.deserialize(JSON.stringify(serializeTestJson.systemStaffJson));
			score = SmoScore.deserialize(scoreJson);
            layout.unrenderAll();
			keys.detach();
            keys = utController.createUi(document.getElementById("boo"),score);			
            keys.render();
        }
      
        return drawDefaults().then(changePitch).then(changePitch2).then(undoTest).then(undoTest).then(keySigTest).then(undoTest).then(keySigTest2)
		    .then(keySigTest3).then(serializeTest).then(signalComplete);
    }
}
