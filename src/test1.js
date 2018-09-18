
var timeTest = () => {
    const promise = new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            },
                500);
        });
    return promise;
};

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
        var accidentalTest = () => {
            var selection = new Selection([
			{tickIndex:1,pitches:[0]}
					]);
            measure.applyTransform('vxTransposePitchActor', {
                selections: selection,
                offset: -1
            });
            measure.render();
            return timeTest();
        }

        var intervalTest = () => {
            var selection = new Selection([{
			tickIndex:2,pitches:[1]}
                ]);
            measure.applyTransform('vxTransposePitchActor', {
                selections: selection,
                offset: 4
            });
            measure.render();
            return timeTest();
        }
		
		var durationTest = () => {
			var tickmap = measure.tickmap();
            measure.applyTransform('VxContractActor', {
                startIndex: 1,
                tickmap: tickmap,
				newTicks:2048
            });
            measure.render();
            return timeTest();
        }
        drawDefaults().then(accidentalTest).then(intervalTest).then(durationTest);
    }
}
