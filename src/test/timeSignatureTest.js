
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
        var measure = new VxMeasure(context,{smoMeasure:smo});

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
            measure.applyModifiers();
            measure.render();
            return timeTest();
        }
        
		
        drawDefaults();
    }
}
