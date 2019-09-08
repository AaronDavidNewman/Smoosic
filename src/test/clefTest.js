
class ClefTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Clef Test');
		var score=SmoScore.getEmptyScore();
		
		var pasteBuffer = new PasteBuffer();
		
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
		
        var keys = utController.createUi(score,'Clef tests');
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
                        200);
                });
            return promise;
        }

        var signalComplete = () => {
			detach();
			subTitle('All done!');
            return timeTest();
        }
		var subTitle = (txt) => {
			$('.subTitle').text(txt);
		}

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            return keys.render().then(timeTest);
        }
		
		
		var bassClefTest = () => {
			subTitle('bass clef test');
			SmoOperation.addStaff(score,{
				instrumentInfo: {
                instrumentName: 'Bass Instrument',
                keyOffset: 0,
                clef: 'bass'
            }});
            return keys.render().then(timeTest);
		}
		
		var clefChangeTest = () => {
			subTitle('change instrument mid-system');
			var instrument = {
				instrumentName:'Treble Instrument',
				keyOffset:0,
				clef:'treble'
			}
			var sel1 = SmoSelection.measureSelection(score,1,1);
			var sel2=SmoSelection.measureSelection(score,1,2);
			keys.layout.unrenderAll();
			SmoOperation.changeInstrument(score,instrument,[sel1,sel2]);
            return keys.render().then(timeTest);
		}
		var bassRenderTest = () => {
			subTitle('change pitch in bass clef');
			var note = SmoSelection.pitchSelection(score,1,0,0,2);
			SmoOperation.transpose(note,3);
            return keys.render().then(timeTest);
		}
		
		var bassDurationTest = () => {
			subTitle('change duration in bass clef');
			var note = SmoSelection.noteSelection(score,1,0,0,1);
			SmoOperation.makeTuplet(note,3);
            return keys.render().then(timeTest);
		}
		
		var tenorClefTest = () => {
			subTitle('add cello clef');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Cello',
                keyOffset: 0,
                clef: 'tenor'
			}});
            return keys.render().then(timeTest);
		}
		
		var altoClefTest = () => {
			subTitle('add viola clef');
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Viola',
                keyOffset: 0,
                clef: 'alto'
			}});
            return keys.render().then(timeTest);
		}
		
		var baritoneClefTest = () => {
			subTitle('remove and add clef');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-c'
			}});
            return keys.render().then(timeTest);
		}
		
		var baritoneClefTest2 = () => {
			subTitle('remove and add clef 2');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Baritone',
                keyOffset: 0,
                clef: 'baritone-f'
			}});
            return keys.render().then(timeTest);
		}
		
		var trumpetClefTest = () => {
			subTitle('clef with instrument in different key');
			keys.layout.unrenderAll();
			SmoOperation.removeStaff(score,1);
			SmoOperation.addStaff(score, {
				instrumentInfo: {
                instrumentName: 'Trumpet',
                keyOffset: 2,
                clef: 'treble'
			}});
            return keys.render().then(timeTest);
		}
      
        return drawDefaults().then(bassClefTest).then(clefChangeTest).then(bassRenderTest).then(bassDurationTest).then(tenorClefTest)
		   .then(altoClefTest).then(baritoneClefTest).then(baritoneClefTest2).then(trumpetClefTest).then(signalComplete);
    }
}
