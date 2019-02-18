
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
        var sys = new SmoSystemStaff({
                measures: [m1, m2, m3]
            });
        var line1 = new VxSystemStaff(context, {
                smoMeasures: sys
            });

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve();
                    },
                        1000);
                });
            return promise;
        }

        var drawDefaults = () => {
            // music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            // measure.applyModifiers();
            line1.render();
            return timeTest();
        }

        var changePitch = () => {
            var pc = new SmoTransposeMeasurePitchActor({
                    selections: [{
                            selection: {
                                measure: 2,
                                voice: 0,
                                tick: 1
                            },
                            keys: [{
                                    key: 'e',
                                    octave: 4,
                                    accidental: 'b'
                                }
                            ]
                        }
                    ]
                });
            line1.applyTransform(pc);
            line1.render();
            return timeTest();
        }
	    var changePitch2 = () => {
            var pc = new SmoTransposeMeasurePitchActor({
                    selections: [{
                            selection: {
                                measure: 1,
                                voice: 0,
                                tick: 1
                            },
                            keys: [{
                                    key: 'f',
                                    octave: 4,
                                    accidental: '#'
                                }
                            ]
                        }
                    ]
                });
            line1.applyTransform(pc);
            line1.render();
            return timeTest();
        }
        var serializeTest = () => {
			var measures = SmoSystemStaff.deserialize(JSON.stringify(serializeTestJson.systemStaffJson));
			line1.unrender();
			line1 = new VxSystemStaff(context, {
                smoMeasures: measures
            });
			line1.render();
		}
        drawDefaults().then(changePitch).then(changePitch2).then(serializeTest);
    }
}
