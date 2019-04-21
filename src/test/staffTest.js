
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
		var serial = JSON.stringify(score,null,'');
		console.log(serial);
        var keys = utController.createUi(document.getElementById("boo"),score);
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
            var target = layout.score.getSelection(2, 0, 1, [0]);
            if (target) {
                target.note.keys = [{
                        key: 'e',
                        octave: 4,
                        accidental: 'b'
                    }
                ];
            }
            keys.render();
            return timeTest();
        }
        var changePitch2 = () => {
            var target = layout.score.getSelection(1, 0, 1, [0]);
            if (target) {
                target.note.keys = [{
                        key: 'f',
                        octave: 4,
                        accidental: '#'
                    }
                ]
            }
            keys.render();
            return timeTest();
        }
		var keySigTest= () => {
			score.addKeySignature(1,'A');
			keys.render();
			return timeTest();
		}
		var keySigTest2= () => {
			score.addKeySignature(2,'Bb');
			keys.render();
			return timeTest();
		}
		var keySigTest3= () => {
			score.addKeySignature(1,'C#');
			score.addKeySignature(2,'Cb');
			keys.render();			
			return timeTest();
		}
        var serializeTest = () => {
			var scoreJson=JSON.stringify(score);
            // score = SmoScore.deserialize(JSON.stringify(serializeTestJson.systemStaffJson));
			score = SmoScore.deserialize(scoreJson);
            layout.unrender();
			keys.detach();
            keys = utController.createUi(document.getElementById("boo"),score);			
            keys.render();
        }
      
        return drawDefaults().then(changePitch).then(changePitch2).then(keySigTest).then(keySigTest2)
		    .then(keySigTest3).then(serializeTest).then(signalComplete);
    }
}
