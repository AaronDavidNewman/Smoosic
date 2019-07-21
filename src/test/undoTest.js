
class UndoTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Undo Test');
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
		var subTitle = (txt) => {
			$('.subTitle').text(txt);
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
			subTitle('changePitch');
            var target = SmoSelection.pitchSelection(layout.score,0,2, 0, 1,[0]);
			SmoUndoable.setPitch(target,{
                        letter: 'e',
                        octave: 4,
                        accidental: 'b'
                    },undo);
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
			var buf = undo.peek();
			subTitle('undo '+buf.title);
			layout.undo(undo);
            return timeTest();
		}
        var changePitch2 = () => {
			subTitle('change pitch to f#, rest');
            var target = SmoSelection.pitchSelection(score,0,1, 0, 1, [0]);
			SmoUndoable.setPitch(target,{
					letter: 'f',
					octave: 4,
					accidental: '#'
				},undo);
			            
			SmoUndoable.makeRest(SmoSelection.noteSelection(score,0,1,0,2),undo);
            keys.render();
            return timeTest();
        }
		var keySigTest= () => {
			subTitle('key sig to A');
			var selection = SmoSelection.measureSelection(score,0,1);
			SmoUndoable.addKeySignature(score,selection,'A',undo);
			// score.addKeySignature(1,'A');
			var selection = SmoSelection.noteSelection(score,0,1,0,2);
			SmoUndoable.makeNote(selection,undo);
			keys.render();
			return timeTest();
		}
		var crescendoTest = () => {
            var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
            var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
            SmoUndoable.crescendo(ft, tt,undo);
            layout.render();
            return timeTest();
        }
		var keySigTest2= () => {
			subTitle('key sig to Bb');
			var selection = SmoSelection.measureSelection(score,0,2);
			SmoUndoable.addKeySignature(score,selection,'Bb',undo);
			keys.render();
			return timeTest();
		}
		
		var addInstrument = () => {
			subTitle('add instrument');
			SmoUndoable.addInstrument(score,undo);
			keys.layout.render();
			keys.tracker.updateMap();
			return timeTest();
		}
		var keySigTest3= () => {
			subTitle('key sig change to f#');
			var selection = SmoSelection.measureSelection(score,0,1);
			SmoUndoable.addKeySignature(score,selection,'C#',undo);
			selection = SmoSelection.measureSelection(score,0,2);
			SmoUndoable.addKeySignature(score,selection,'Cb',undo);
			keys.render();			
			return timeTest();
		}             
        return drawDefaults().then(changePitch).then(crescendoTest).then(changePitch2)
		    .then(keySigTest).then(keySigTest2).then(addInstrument)
		    .then(keySigTest3).then(undoTest).then(undoTest).then(undoTest).then(undoTest).then(undoTest).then(undoTest)
			.then(undoTest).then(undoTest).then(undoTest).then(undoTest)
			then(signalComplete);
    }
}
