
class ChordTest {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(450, 200);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = ChordTest.createContext();
		var line1 = new VxSystemStaff(context);
		var measure = line1.smoMeasures.measures[0];

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
			return timeTest();
		}

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            line1.render();			
            return timeTest();
        }
        var accidentalTest = () => {
			var pitches=[0];
			var target = measure.getSelection(0,1,pitches);
            target.note.transpose(pitches,-1);
			smoModifierFactory.applyModifiers(measure);
            line1.render();
            return timeTest();
        }

        var intervalTest = () => {
			var target = measure.getSelection(0,2,[1]);
			if (target) {
				target.note.transpose([1],4);
			}
            line1.render();
            return timeTest();
        }
		
		var durationTest = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoContractNoteActor({
                startIndex: 2,
                tickmap: tickmap,
				newTicks:2048
            });
			SmoTickTransformer.applyTransform(measure,actor);
            line1.render();
            return timeTest();
        }
		
		var durationTest2 = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoStretchNoteActor({
				 startIndex: 2,
                tickmap: tickmap,
				newTicks:4096
			});
			SmoTickTransformer.applyTransform(measure,actor);
            line1.render();
            return timeTest();
        }
		
		var rerenderTest = () => {
			line1.render();
			return timeTest();
		}
		var setPitchTest = () => {
			var target = measure.getSelection(0,2,[0]);
			if (target) {
				target.note.keys=[{key:'e',octave:4,accidental:'b'},
				{key:'g',octave:5,accidental:''}];
			}
			smoModifierFactory.applyModifiers(measure);
            line1.render();
            return timeTest();
        }
		
		var makeTupletTest = () => {
			var tickmap = measure.tickmap();
			var actor = new SmoMakeTupletActor({
				index:1,
				totalTicks:4096,
				numNotes:3,
				measure:measure
			});
			SmoTickTransformer.applyTransform(measure,actor);
            line1.render();
			console.log('tuplet serialize');
			console.log(JSON.stringify(measure,null,' '));
            return timeTest();
		}
		
		var unmakeTupletTest = () => {
			var actor = new SmoUnmakeTupletActor({
				startIndex:1,
				endIndex:3,
				measure:measure
			});
			SmoTickTransformer.applyTransform(measure,actor);
            line1.render();
            return timeTest();
		}
		
		var courtesyTest = () => {
			var target = measure.getSelection(0,2,[1]);
			target.note.addAccidental({index:1,value:{symbol:'n',cautionary:true}});
			smoModifierFactory.applyModifiers(measure);			
			line1.render();
			return timeTest();
		}
		
        return drawDefaults().then(accidentalTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest).then(signalComplete);
    }
}
