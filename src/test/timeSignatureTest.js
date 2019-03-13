
class TimeSignatureTest {

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
        var context = TimeSignatureTest.createContext();
		var notes = SmoMeasure.getDefaultNotes('treble','6/8');
		var smo = new SmoMeasure({voices:[{notes:notes}],timeSignature:'6/8',clef:'treble'});
		var system = new SmoSystemStaff({measures:[smo]});
		var line = new VxSystemStaff(context,{smoMeasures:system});
		var measure = line.smoMeasures.measures[0];
		
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
			smoModifierFactory.applyModifiers(measure);
            line.render();
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
            line.render();
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
            line.render();
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
            line.render();
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
            line.render();
            return timeTest();
        }

		
        return drawDefaults().then(stretchTest).then(contractTest).then(makeDupletTest).then(unmakeTupletTest).then(signalComplete);
		
    }
}
