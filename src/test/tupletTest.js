

class TupletTest {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(1280, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
        var context = TupletTest.createContext();
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
            var actor = new SmoMakeTupletActor({
                    index: 1,
                    totalTicks: 4096,
                    numNotes: 3,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }

        var stretchTupletTest = () => {
            var actor = new SmoStretchTupletActor({
                    changeIndex: 1,
                    startIndex: 0,
                    endIndex: 1,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }

        var contractTupletTest = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 1,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }

        var stretchTupletTest2 = () => {
            var actor = new SmoStretchTupletActor({
                    changeIndex: 2,
                    startIndex: 1,
                    endIndex: 2,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
        var contractTupletTest2 = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 2,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		var contractTupletTest3 = () => {
            // maybe just need changeIndex?
            var actor = new SmoContractTupletActor({
                    changeIndex: 1,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }

		var unmakeTupletTest = () => {
            // maybe just need changeIndex?
            var actor = new SmoUnmakeTupletActor({
                    startIndex:1,
				    endIndex:4,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
		
		var makeTupletTest2 = () => {
            // maybe just need changeIndex?
            var actor = new SmoMakeTupletActor({
                    index:3,
					totalTicks:4096,
				    numNotes:5,
                    measure: measure.smoMeasure
                });
            measure.applyTransform(actor);
            measure.render();
            return timeTest();
        }
				
        drawDefaults().then(makeTupletTest).then(stretchTupletTest).then(contractTupletTest)
		.then(stretchTupletTest2).then(contractTupletTest2).then(contractTupletTest3)
		.then(unmakeTupletTest).then(makeTupletTest2);
    }
}
