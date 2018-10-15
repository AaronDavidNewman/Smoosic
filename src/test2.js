

class Test2 {

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
        var context = Test2.createContext();
        var measure = new VxMeasure(context);

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        500);
                });
            return promise;
        }

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            measure.applyModifiers();
            measure.render();
            return timeTest();
        }
        
		
		var makeTupletTest = () => {
			var tickmap = measure.tickmap();
			var actor = new VxMakeTupletActor({
				index:1,
				baseTicks:4096,
				numNotes:3,
				measure:measure.noVexMeasure
			});
			  measure.applyTransform(actor);
            measure.render();
            return timeTest();
		}
		
		var stretchTupletTest = () => {
			var actor = new VxStretchTupletActor({
				changeIndex:1,
				startIndex:0,
				endIndex:1,
				measure:measure.noVexMeasure
			});
			measure.applyTransform(actor);
            measure.render();
            return timeTest();
		}
		
        drawDefaults().then(makeTupletTest).then(stretchTupletTest);
    }
}
