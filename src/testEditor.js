class TestEditor {

// Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext () {
        var div = document.getElementById("boo");
        $(div).html('');

        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

// Create the notes
    static get Notes() {
        return [
            new VF.StaveNote({
                clef: "treble",
                keys: ["c/4"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["d/4"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["c/5"],
                duration: "4"
            })
        ];
    }
    

    static CommonTests () {
        window.music = {};
        window.music.notes = TestEditor.Notes;
        var context = TestEditor.createContext();

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                        resolve();
                    },
                    500);
            });
            return promise;
        }

        var staffMeasure = new StaffMeasure(context,
            {
                clef:'treble',
                timeSignature:'4/4',
                num_beats:4,

            });

        var drawInital = () => {
            window.music = staffMeasure.drawNotes(music.notes);
            return timeTest();
        }
        var startEditor = () => {
            window['tracker']=new Tracker(window.music, context,staffMeasure);
            
            return timeTest();

        }
    var promise = drawInital().then(startEditor);
        return promise;

    }
}

