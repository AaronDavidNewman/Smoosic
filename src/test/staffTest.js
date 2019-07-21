
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
		
		var pasteBuffer = new PasteBuffer();
		
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		
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
			return timeTest();
		}
		
		var bassRenderTest = () => {
			var note = SmoSelection.pitchSelection(score,1,0,0,2);
			SmoOperation.transpose(note,3);
			keys.render();
			return timeTest();
		}
		
		var bassDurationTest = () => {
			var note = SmoSelection.noteSelection(score,1,0,0,1);
			SmoOperation.makeTuplet(note,3);
			keys.render();
			return timeTest();
		}
		
		var tenorClefTest = () => {
			keys.layout.unrenderAll();
			SmoOperation.removeInstrument(score,1);
			SmoOperation.addInstrument(score, {
				instrumentInfo: {
                instrumentName: 'Cello',
                keyOffset: 0,
                clef: 'tenor'
			}});
			keys.render();
			return timeTest();
		}
		
		var altoClefTest = () => {
			SmoOperation.addInstrument(score, {
				instrumentInfo: {
                instrumentName: 'Viola',
                keyOffset: 0,
                clef: 'alto'
			}});
			keys.render();
			return timeTest();
		}
		
		var baritoneClefTest = () => {
			keys.layout.unrenderAll();
			SmoOperation.removeInstrument(score,1);
			SmoOperation.addInstrument(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-c'
			}});
			keys.render();
			return timeTest();
		}
		
		var baritoneClefTest2 = () => {
			keys.layout.unrenderAll();
			SmoOperation.removeInstrument(score,1);
			SmoOperation.addInstrument(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-f'
			}});
			keys.render();
			return timeTest();
		}
		
		var trumpetClefTest = () => {
			keys.layout.unrenderAll();
			SmoOperation.removeInstrument(score,1);
			SmoOperation.addInstrument(score, {
				instrumentInfo: {
                instrumentName: 'Trumpet',
                keyOffset: 2,
                clef: 'treble'
			}});
			keys.render();
			keys.layout.dumpGeometry();
			return timeTest();	
		}
      
        return drawDefaults().then(bassClefTest).then(bassRenderTest).then(bassDurationTest).then(tenorClefTest)
		   .then(altoClefTest).then(baritoneClefTest).then(baritoneClefTest2).then(trumpetClefTest).then(signalComplete);
    }
}
