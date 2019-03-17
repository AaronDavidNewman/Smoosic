
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

        var changePitch = () => {
            var target = line1.smoMeasures.getSelection(2, 0, 1, [0]);
            if (target) {
                target.note.keys = [{
                        key: 'e',
                        octave: 4,
                        accidental: 'b'
                    }
                ];
            }
            line1.render();
            return timeTest();
        }
        var changePitch2 = () => {
            var target = line1.smoMeasures.getSelection(1, 0, 1, [0]);
            if (target) {
                target.note.keys = [{
                        key: 'f',
                        octave: 4,
                        accidental: '#'
                    }
                ]
            }
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

        var trackTest = () => {
            var tracker = new Tracker({
                    measureSource: line1.smoMeasures,
                    renderElement: '#boo svg',
                    context: line1.context
                });
			tracker.updateMap();
			tracker.bindEvents();
        }

        return drawDefaults().then(changePitch).then(changePitch2).then(serializeTest).then(trackTest).then(signalComplete);
    }
}
