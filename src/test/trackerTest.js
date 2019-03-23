
class TrackerTest {

    // Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(1600, 200);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

    static CommonTests() {
         var context = TrackerTest.createContext();
		var score=new SmoScore();
        score.addDefaultMeasure(0,{});
        score.addDefaultMeasure(1,{});
        score.addDefaultMeasure(2,{});
        var line1 = new VxSystemStaff(context, {
                smoMeasures: score
            });

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
            line1.render();
            return timeTest();
        }    

        var trackTest = () => {
            var tracker = new Tracker({
                    measureSource: line1.smoMeasures,
                    renderElement: '#boo svg',
                    context: line1.context
                });
			tracker.updateMap();
			tracker.bindEvents();
        }

        return drawDefaults().then(trackTest).then(signalComplete);
    }
}
