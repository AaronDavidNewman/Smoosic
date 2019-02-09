
class SystemTest {

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
        var context = SystemTest.createContext();
		var m1 = new SmoMeasure();
		var m2 = new SmoMeasure();
		var m3 = new SmoMeasure();
		var sys = new SmoSystemStaff({measures:[m1,m2,m3]});
		var line1 = new VxSystemStaff(context,{smoMeasures:sys});
		
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
            line1.render();
            return timeTest();
        }
		
		drawDefaults();
	}
}