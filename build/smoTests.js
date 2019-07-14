
class ChordTest {

    static CommonTests() {
        $('h1.testTitle').text('Chord Test');
        var keys = utController.createUi(document.getElementById("boo"), SmoScore.getDefaultScore());
        var score = keys.score;
        var layout = keys.layout;
        var measure = SmoSelection.measureSelection(score, 0, 0).measure;

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
            var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 1, [0]);
            SmoOperation.transpose(selection, -1);
            SmoOperation.addDynamic(selection,new SmoDynamicText({
                    selection: selection.selector,
                    text: SmoDynamicText.dynamics.SFZ,
                    yOffsetLine: 11,
                    fontSize: 38
                }));
            layout.render();
            return timeTest();
        }

        var crescendoTest = () => {
            var ft = SmoSelection.noteSelection(layout.score, 0, 0, 0, 0);
            var tt = SmoSelection.noteSelection(layout.score, 0, 0, 0, 3);
            SmoOperation.crescendo(ft, tt);
            layout.render();
            return timeTest();
        }

        var intervalTest = () => {
            var selection = SmoSelection.pitchSelection(score, 0, 0, 0, 2);
            if (selection) {
                SmoOperation.interval(selection, 4);
            }
            layout.render();
            return timeTest();
        }

        var durationTest = () => {
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
            SmoOperation.halveDuration(selection);
            layout.render();
            return timeTest();
        }

        var durationTest2 = () => {
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
            SmoOperation.doubleDuration(selection);
            layout.render();
            return timeTest();
        }

        var rerenderTest = () => {
            layout.render();
            return timeTest();
        }
        var setPitchTest = () => {
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2, [0]);
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
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.makeTuplet(selection,3);
            /* var tickmap = measure.tickmap();
            var actor = new SmoMakeTupletActor({
				
                    index: 1,
                    totalTicks: 4096,
                    numNotes: 3,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);   */
            layout.render();
            console.log('tuplet serialize');
            console.log(JSON.stringify(measure, null, ' '));
            return timeTest();
        }

        var unmakeTupletTest = () => {
			var selection = SmoSelection.noteSelection(score, 0, 0, 0, 2);
			SmoOperation.unmakeTuplet(selection);
            /* var actor = new SmoUnmakeTupletActor({
                    startIndex: 1,
                    endIndex: 3,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);  */
            layout.render();
            return timeTest();
        }

        var courtesyTest = () => {
            var target = SmoSelection.pitchSelection(score, 0, 0, 0, 2, [1]);
			SmoOperation.courtesyAccidental(target,true);
            // target.note.pitches[1].cautionary = true;
            layout.render();
            return timeTest();
        }

        return drawDefaults().then(accidentalTest).then(crescendoTest).then(intervalTest).then(durationTest)
        .then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
        .then(unmakeTupletTest).then(courtesyTest).then(signalComplete);
    }
}
;
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
            layout.render();
            return timeTest();
        }
		
		var stretchTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,0);
			SmoOperation.doubleDuration(selection);
			var selection = SmoSelection.noteSelection(score,0,0,0,0);
			SmoOperation.dotDuration(selection);
            /* var tickmap = measure.tickmap();
        var actor = new SmoStretchNoteActor({
				 startIndex: 0,
                tickmap: tickmap,
				newTicks:6144
			});
            SmoTickTransformer.applyTransform(measure,actor);   */
            layout.render();
            return timeTest();
		}
		
		var contractTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,0);
			SmoOperation.halveDuration(selection);
            /* var tickmap = measure.tickmap();
            var actor = new SmoContractNoteActor({
				 startIndex: 0,
                tickmap: tickmap,
				newTicks:6144/3
			});
            SmoTickTransformer.applyTransform(measure,actor);  */
            layout.render();
            return timeTest();
		}
		
        var makeDupletTest = () => {
			var selection = SmoSelection.noteSelection(score,0,0,0,0);
			SmoOperation.dotDuration(selection);
			selection = SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.doubleDuration(selection);
			selection = SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.dotDuration(selection);
			
            /* var tickmap = measure.tickmap();
            var actor = new SmoMakeTupletActor({
                    index: 0,
                    totalTicks: 6144,
                    numNotes: 2,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure,actor);  */
            layout.render();
            return timeTest();
        }
		
		
        return drawDefaults().then(stretchTest).then(contractTest).then(makeDupletTest).then(signalComplete);
		
    }
}
;
class KeySignatureTest {
   
    static CommonTests() {
		$('h1.testTitle').text('Key Signature Test');
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
		
        var changePitch = () => {
            var target = SmoSelection.pitchSelection(layout.score,0,2, 0, 1,[0]);
			undo.addBuffer('undo pitch change', 'measure', target.selector, target.measure);
			SmoOperation.setPitch(target,{
                        letter: 'e',
                        octave: 4,
                        accidental: 'b'
                    });					            
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
			undo.addBuffer('undo key sig','score',selection.selector,score);
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
		

      
        return drawDefaults().then(changePitch).then(changePitch2).then(undoTest)
		    .then(undoTest).then(keySigTest).then(undoTest).then(keySigTest2).then(undoTest)
		    .then(keySigTest3).then(serializeTest).then(signalComplete);
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
            layout.render();
            return timeTest();
        }

        var makeTupletTest = () => {
			var selection=SmoSelection.noteSelection(score,0,0,0,1);
			SmoOperation.makeTuplet(selection,3);
            layout.render();
			var measureS=SmoSelection.measureSelection(score,0,0);
			console.log(JSON.stringify(score.serialize(),null,' '));
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
class serializeTestJson {
    static get tupletMeasure() {
        return {
            "score": {
                "staffX": 30,
                "staffY": 40,
                "staffWidth": 1600,
                "interGap": 30,
                "renumberingMap": {}
            },
            "staves": [{
                    "staffX": 10,
                    "staffY": 40,
                    "staffWidth": 200,
                    "staffHeight": 90,
                    "renumberingMap": {},
                    "keySignatureMap": {},
                    "instrumentInfo": {
                        "instrumentName": "Treble Instrument",
                        "keyOffset": "0",
                        "clef": "treble"
                    },
                    "modifiers": [],
                    "measures": [{
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 30.999984741210938,
                            "staffY": 40,
                            "customModifiers": [],
                            "measureNumber": {
                                "measureNumber": 0,
                                "measureIndex": 0,
                                "systemIndex": 0
                            },
                            "staffWidth": 200,
                            "modifierOptions": {},
                            "tuplets": [{
                                    "notes": [{
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1142"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1149"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1156"
                                        }
                                    ],
                                    "numNotes": 3,
                                    "totalTicks": 4096,
                                    "stemTicks": 2048,
                                    "location": 1,
                                    "durationMap": [
                                        1,
                                        1,
                                        1
                                    ],
                                    "bracketed": true,
                                    "ratioed": false,
                                    "startIndex": 1,
                                    "attrs": {
                                        "id": "auto1125",
                                        "type": "SmoTuplet"
                                    }
                                }
                            ],
                            "beamGroups": [{
                                    "notes": [{
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1142"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1149"
                                        }, {
                                            "noteType": "n",
                                            "textModifiers": [],
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "beam_group": {
                                                "id": "auto1126",
                                                "type": "SmoBeamGroup"
                                            },
                                            "renderId": "vf-auto1156"
                                        }
                                    ],
                                    "attrs": {
                                        "id": "auto1126",
                                        "type": "SmoBeamGroup"
                                    }
                                }
                            ],
                            "voices": [{
                                    "notes": [{
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1003",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 1
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1122",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1123",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 1365,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "tuplet": {
                                                "id": "auto1125",
                                                "type": "SmoTuplet"
                                            },
                                            "attrs": {
                                                "id": "auto1124",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1005",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }, {
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "pitches": [{
                                                    "letter": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "noteType": "n",
                                            "attrs": {
                                                "id": "auto1006",
                                                "type": "SmoNote"
                                            },
                                            "noteModifiers": []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    }
    static get systemStaffJson() {
        return {
            "staffX": 10,
            "staffY": 40,
            "staffWidth": 1600,
            "interGap": 30,
            "startIndex": 0,
            "renumberingMap": {},
            "staves": [{
                    "measures": [{
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 10,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 0,
                                "measureIndex": 0,
                                "systemIndex": 0
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1004",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1005",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1006",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1007",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1012",
                                "type": "SmoMeasure"
                            }
                        }, {
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 410,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 1,
                                "measureIndex": 1,
                                "systemIndex": 1
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1017",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1018",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1019",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1020",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1025",
                                "type": "SmoMeasure"
                            }
                        }, {
                            "tuplets": [

                            ],
                            "beamGroups": [

                            ],
                            "timeSignature": "4/4",
                            "keySignature": "C",
                            "staffX": 810,
                            "customModifiers": [

                            ],
                            "staffY": 40,
                            "bars": [
                                1,
                                1
                            ],
                            "drawClef": true,
                            "measureNumber": {
                                "measureNumber": 2,
                                "measureIndex": 2,
                                "systemIndex": 2
                            },
                            "staffWidth": 400,
                            "noteWidth": 400,
                            "modifierOptions": {},
                            "clef": "treble",
                            "forceClef": false,
                            "voices": [{
                                    "notes": [{
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1030",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1031",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1032",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }, {
                                            "timeSignature": "4/4",
                                            "keySignature": "C",
                                            "clef": "treble",
                                            "noteType": "n",
                                            "numBeats": 4,
                                            "beatValue": 4,
                                            "voice": 0,
                                            "duration": "4",
                                            "keys": [{
                                                    "key": "b",
                                                    "accidental": "",
                                                    "octave": 4
                                                }
                                            ],
                                            "accidentals": [

                                            ],
                                            "ticks": {
                                                "numerator": 4096,
                                                "denominator": 1,
                                                "remainder": 0
                                            },
                                            "tupletInfo": {},
                                            "attrs": {
                                                "id": "auto1033",
                                                "type": "SmoNote"
                                            },
                                            "dots": 0
                                        }
                                    ]
                                }
                            ],
                            "activeVoice": 0,
                            "attrs": {
                                "id": "auto1038",
                                "type": "SmoMeasure"
                            }
                        }
                    ],
                    "staffX": 10,
                    "staffY": 40,
                    "staffWidth": 1600,
                    "startIndex": 0,
                    "renumberingMap": {},
                    "instrumentInfo": {
                        "instrumentName": "Treble Instrument",
                        "keyOffset": "0",
                        "clef": "treble"
                    },
                    "renumberIndex": 0
                }
            ],
            "activeStaff": 0
        };
    }
}
;
class PasteTest {

    static CommonTests() {
        $('h1.testTitle').text('Paste Test');
        var score = SmoScore.getEmptyScore();

        var pasteBuffer = new PasteBuffer();

        score.addDefaultMeasureWithNotes(0, {});
        score.addDefaultMeasureWithNotes(1, {});
        score.addDefaultMeasureWithNotes(2, {});

        var serial = JSON.stringify(score.serialize(), null, '');
        console.log(serial);
        var keys = utController.createUi(document.getElementById("boo"), score);
        var undo = keys.undoBuffer;
        var score = keys.score;
        var layout = keys.layout;

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

        var copySetup = () => {
            SmoSelection.noteSelection(layout.score, 0, 2, 0, 1);
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 0, 0, 0), {
                letter: 'a',
                octave: 4,
                accidental: 'n'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 0, 0, 2), {
                letter: 'c',
                octave: 4,
                accidental: '#'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 0, 0, 3), {
                letter: 'd',
                octave: 4,
                accidental: 'n'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 0, 0, 0), {
                letter: 'e',
                octave: 4,
                accidental: 'n'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 1, 0, 1), {
                letter: 'f',
                octave: 4,
                accidental: 'n'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 1, 0, 2), {
                letter: 'g',
                octave: 4,
                accidental: 'n'
            });
            SmoOperation.setPitch(
                SmoSelection.noteSelection(layout.score, 0, 1, 0, 3), {
                letter: 'c',
                octave: 5,
                accidental: 'n'
            });
            keys.render();
            return timeTest();
        }
        var copyTest = () => {
            var selections = [];
            selections.push(SmoSelection.noteSelection(layout.score, 0, 2, 0, 1));
            pasteBuffer.setSelections(keys.score, selections);
            keys.layout.unrenderAll();
            var pasteTarget = {
                staff: 0,
                measure: 1,
                voice: 0,
                tick: 2
            };
            pasteBuffer.pasteSelections(score, pasteTarget);
            keys.render();
            return timeTest();
        }

        var copyDurationSetup = () => {
            var selection = SmoSelection.noteSelection(score, 0, 1, 0, 2);
            SmoOperation.halveDuration(selection);
            layout.render();
            return timeTest();
        }

        var copyDurationChange = () => {
            var selections = [];
            selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 1));
            selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 2));
            selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 3));
            selections.push(SmoSelection.noteSelection(score, 0, 1, 0, 4));
            pasteBuffer.setSelections(score, selections);
            keys.layout.unrenderAll();
            var pasteTarget = {
                staff: 0,
                measure: 2,
                voice: 0,
                tick: 0
            };
            pasteBuffer.pasteSelections(score, pasteTarget);
            keys.render();
            return timeTest();
        }

        var copyOverTupletSetup = () => {
            var selection = SmoSelection.noteSelection(score, 0, 0, 0, 1);
            SmoOperation.makeTuplet(selection, 3);
            keys.render();
            return timeTest();
        }
        var copyOverTupletTest = () => {
            var selections = [];
            selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 0));
            selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 1));
            selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 2));
            selections.push(SmoSelection.noteSelection(score, 0, 0, 0, 3));

            pasteBuffer.setSelections(score, selections);
            keys.layout.unrenderAll();
            var pasteTarget = {
                staff: 0,
                measure: 2,
                voice: 0,
                tick: 0
            };
            pasteBuffer.pasteSelections(score, pasteTarget);
            keys.render();
            return timeTest();
        }
        return drawDefaults().then(copySetup).then(copyTest).then(copyDurationSetup).then(copyDurationChange).
        then(copyOverTupletSetup).then(copyOverTupletTest).then(signalComplete);
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
			SmoOperation.transpose(target,-1);
			/* if (target) {
				target.note.transpose([0],-1);
			}  */
            layout.render();
            return timeTest();
        }
		
		var serializeTest = () => {
			layout.unrenderAll();
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
class TrackerTest {

	static CommonTests() {
		$('h1.testTitle').text('Tracker Test');
		
		var score = SmoScore.getEmptyScore();

		score.addDefaultMeasureWithNotes(0, {});
		score.addDefaultMeasureWithNotes(1, {});
		score.addDefaultMeasureWithNotes(2, {});
		var keys = suiController.createUi(document.getElementById("boo"),score);
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
			keys.layout.render();
			return timeTest();
		}


		var trackTest = () => {
			keys.tracker.updateMap();			
			return timeTest();
		}

		var addInstrument = () => {
			score.addInstrument();
			keys.layout.render();
			keys.tracker.updateMap();
			return timeTest();
		}
		
		var selectionTest1 = () => {
			keys.tracker.moveSelectionRight();
			return timeTest();
		}

		var selectionTest2 = () => {
			keys.tracker.moveSelectionLeft();
			return timeTest();
		}
		var selectionTest3 = () => {
			keys.tracker.moveSelectionOffset(5);
			return timeTest();
		}
		
		var selectDown = () => {
			keys.tracker.moveSelectionDown();
			return timeTest();
		}
		
		var selectIncreaseRight = () => {
			keys.tracker.growSelectionRight();
			return timeTest();
		}
		
		var selectIncreaseLeft = () => {
			keys.tracker.growSelectionLeft();
			return timeTest();
		}

		return drawDefaults().then(trackTest).then(addInstrument).then(selectionTest1)
		.then(selectionTest2).then(selectionTest3).then(selectDown)
		.then(selectIncreaseRight).then(selectIncreaseLeft).then(signalComplete);
	}
}
;

class TestAll {
	static Run = function() {
		  console.log("DOM fully loaded and parsed");
            TimeSignatureTest.CommonTests().then(
			ChordTest.CommonTests).then(VoiceTest.CommonTests).then(TupletTest.CommonTests)
			.then(KeySignatureTest.CommonTests).then(TrackerTest.CommonTests).then(PasteTest.CommonTests).then(UndoTest.CommonTests);
	}
}