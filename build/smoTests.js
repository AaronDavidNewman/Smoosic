
class ChordTest {

	static CommonTests() {
		$('h1.testTitle').text('Chord Test');
		var keys = utController.createUi(document.getElementById("boo"), SmoScore.getDefaultScore());
		var score = keys.score;
		var layout = keys.layout;
		var measure = SmoSelection.measureSelection(score,0,0).measure;

		var detach = () => {
			keys.detach();
			keys = null;
			score = null;
			layout = null;
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
			layout.render();
			return timeTest();
		}
		var accidentalTest = () => {
			var selection = SmoSelection.pitchSelection(score,0,0,0,1,[0]);
			SmoOperation.transpose(selection,-1);
			layout.render();
			return timeTest();
		}
		
		
		var crescendoTest = () => {
			var ft = SmoSelection.noteSelection(layout.score,0,0,0,0);
			var tt = SmoSelection.noteSelection(layout.score,0,0,0,3);
			SmoOperation.crescendo(ft,tt);
			layout.render();
			return timeTest();
		}


		var intervalTest = () => {
			var selection = SmoSelection.pitchSelection(score,0,0,0,2);
			if (selection) {
				SmoOperation.interval(selection,4);
			}
			layout.render();
			return timeTest();
		}

		var durationTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2);
			SmoOperation.halveDuration(selection);
			layout.render();
			return timeTest();
		}

		var durationTest2 = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2);
			SmoOperation.doubleDuration(selection);
			layout.render();
			return timeTest();
		}

		var rerenderTest = () => {
			layout.render();
			return timeTest();
		}
		var setPitchTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,2,[0]);
			SmoOperation.setPitch(selection,
			[{
						letter: 'e',
						octave: 4,
						accidental: 'b'
					}, {
						letter: 'g',
						octave: 5,
						accidental: ''
					}
				]);
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
			SmoTickTransformer.applyTransform(measure, actor);
			layout.render();
			console.log('tuplet serialize');
			console.log(JSON.stringify(measure, null, ' '));
			return timeTest();
		}

		var unmakeTupletTest = () => {
			var actor = new SmoUnmakeTupletActor({
					startIndex: 1,
					endIndex: 3,
					measure: measure
				});
			SmoTickTransformer.applyTransform(measure, actor);
			layout.render();
			return timeTest();
		}

		var courtesyTest = () => {
			var target = SmoSelection.pitchSelection(score,0,0,0,2,[1]);
			target.note.pitches[1].cautionary=true;
			smoModifierFactory.applyModifiers(measure);
			layout.render();
			return timeTest();
		}

		return drawDefaults().then(accidentalTest).then(crescendoTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest).then(signalComplete);
	}
}
;
class StaffTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Staff Test');
		var score=SmoScore.getEmptyScore();
        score.addDefaultMeasureWithNotes(0,{});
        score.addDefaultMeasureWithNotes(1,{});
        score.addDefaultMeasureWithNotes(2,{});
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
            var target = SmoSelection.pitchSelection(layout.score,0,2, 0, 1,[0]);
            if (target) {
                target.note.pitches = [{
                        letter: 'e',
                        octave: 4,
                        accidental: 'b'
                    }
                ];
            }
            keys.render();
            return timeTest();
        }
        var changePitch2 = () => {
            var target = SmoSelection.pitchSelection(score,0,1, 0, 1, [0]);
            if (target) {
                target.note.pitches = [{
                        letter: 'f',
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
;
class TimeSignatureTest {
    
    static CommonTests() {
		$('h1.testTitle').text('Time Signature Test');
		
		var keys = utController.createUi(document.getElementById("boo"),
		  SmoScore.getDefaultScore({},{timeSignature:'6/8',clef:'treble'}));
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
			score.applyModifiers();
            layout.render();
            return timeTest();
        }
		
		var stretchTest = () => {
            var tickmap = measure.tickmap();
        var actor = new SmoStretchNoteActor({
				 startIndex: 0,
                tickmap: tickmap,
				newTicks:6144
			});
            SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
		}
		
		var contractTest = () => {
            var tickmap = measure.tickmap();
            var actor = new SmoContractNoteActor({
				 startIndex: 0,
                tickmap: tickmap,
				newTicks:6144/3
			});
            SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
		}
		
        var makeDupletTest = () => {
            var tickmap = measure.tickmap();
            var actor = new SmoMakeTupletActor({
                    index: 0,
                    totalTicks: 6144,
                    numNotes: 2,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }
		
		var unmakeTupletTest = () => {
            // maybe just need changeIndex?
            var actor = new SmoUnmakeTupletActor({
                    startIndex:0,
				    endIndex:1,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure,actor);
            layout.render();
            return timeTest();
        }

		
        return drawDefaults().then(stretchTest).then(contractTest).then(makeDupletTest).then(unmakeTupletTest).then(signalComplete);
		
    }
}
;

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
			smoModifierFactory.applyModifiers(measure);
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
;

class VoiceTest {

    static CommonTests() {
		var keys = utController.createUi(document.getElementById("boo"),SmoScore.getDefaultScore());
		$('h1.testTitle').text('Voice Test');

		var score = keys.score;
		var layout = keys.layout;

		var measure = SmoSelection.measureSelection(score,0,0).measure;
		var voice2=SmoMeasure.defaultVoice44;
		measure.voices.push({notes:voice2});
		
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
            layout.render();
			console.log(JSON.stringify(score,null,' '));
            return timeTest();
        }
		var accidentalTest = () => {
			var target = SmoSelection.pitchSelection(score,0,0,0,1,[0]);
			if (target) {
				target.note.transpose([0],-1);
			}
			smoModifierFactory.applyModifiers(measure);
            layout.render();
            return timeTest();
        }
		
		var serializeTest = () => {
			layout.unrender();
			$('#boo').html('');
			score = SmoScore.deserialize(JSON.stringify(serializeTestJson.tupletMeasure));
			keys.detach();
			keys=utController.createUi(document.getElementById("boo"),score);			
			keys.layout.render();
		}
		var serialize = () => {
			console.log(JSON.stringify(score,null,' '));
			return timeTest();
		}
		
        return drawDefaults().then(accidentalTest).then(serializeTest).then(signalComplete);
    }
}
;

class TestAll {
	static Run = function() {
		  console.log("DOM fully loaded and parsed");
            TimeSignatureTest.CommonTests().then(
			ChordTest.CommonTests).then(VoiceTest.CommonTests).then(TupletTest.CommonTests)
			.then(StaffTest.CommonTests).then(TrackerTest.CommonTests);
	}
}