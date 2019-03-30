
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
		var serial = JSON.stringify(score,null,'');
		console.log(serial);
        var keys = suiKeys.createUi(document.getElementById("boo"),score);
		var score = keys.score;
		var layout = keys.layout;		

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
            layout.render();
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
            layout.render();
            return timeTest();
        }
        var serializeTest = () => {
            var score = SmoScore.deserialize(JSON.stringify(serializeTestJson.systemStaffJson));
            layout.unrender();			
            var keys = suiKeys.createUi(document.getElementById("boo"),SmoScore.getDefaultScore());			
            keys.layout.render();
        }
      
        return drawDefaults().then(changePitch).then(changePitch2).then(serializeTest).then(signalComplete);
    }
}
