
class Test1 {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = Test1.createContext();
        var measure = new VxMeasure(context);

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        100);
                });
            return promise;
        }

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            measure.render();
            return timeTest();
        }
        var accidentalTest = () => {
            var selection = new Selection([
			{tickIndex:1,pitches:[0]}
					]);
			var actor = new VxTransposePitchActor(
			{
                selections: selection,
                offset: -1
            });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }

        var intervalTest = () => {
            var selection = new Selection([{
			tickIndex:2,pitches:[1]}
                ]);
			var actor = new VxTransposePitchActor({
                selections: selection,
                offset: 4
			});
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var durationTest = () => {
			var tickmap = measure.tickmap();
			var actor = new VxContractActor({
                startIndex: 2,
                tickmap: tickmap,
				newTicks:2048
            });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var durationTest2 = () => {
			var tickmap = measure.tickmap();
			var actor = new VxStretchNoteActor({
				 startIndex: 2,
                tickmap: tickmap,
				newTicks:4096
			});
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var rerenderTest = () => {
			measure.render();
			return timeTest();
		}
		var setPitchTest = () => {
			var tickmap = measure.tickmap();
			var keys=[{
                    key: 'e',
                    octave: 4,
                    accidental: 'b'
                },{key:'g',octave:5,accidental:''}];
			var actor = new VxSetPitchActor({
				 selection: 2,
                tickmap: tickmap,
				keys:keys
			});
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var makeTupletTest = () => {
			var tickmap = measure.tickmap();
			var actor = new VxMakeTupletActor({
				index:1,
				totalTicks:4096,
				numNotes:3,
				measure:measure.smoMeasure
			});
			  measure.applyTransform(actor);
            measure.render();
            return timeTest();
		}
		
		var unmakeTupletTest = () => {
			var actor = new VxUnmakeTupletActor({
				startIndex:1,
				endIndex:3,
				measure:measure.smoMeasure
			});
			  measure.applyTransform(actor);
            measure.render();
            return timeTest();
		}
		
		var courtesyTest = () => {
			var courtesy= new Selection([{
			tickIndex:2,pitches:[1]}
            ]);
			measure.smoMeasure.modifierOptions={cautionary:courtesy};
			measure.applyModifiers();
			// measure.noVexMeasure.notes[1].accidentals[0].value.isCautionary = true;
			measure.render();
			return timeTest();
		}
		
        drawDefaults().then(accidentalTest).then(intervalTest).then(durationTest)
		.then(durationTest2).then(rerenderTest).then(setPitchTest).then(makeTupletTest)
		.then(unmakeTupletTest).then(courtesyTest);
    }
}
