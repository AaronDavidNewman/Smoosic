class Test2 {

// Create an SVG renderer and attach it to the DIV element named "boo".
    static createContext() {
        var div = document.getElementById("boo");
        var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

        // Configure the rendering context.
        renderer.resize(500, 500);
        var context = renderer.getContext();
        context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
        return context;
    }

// Create the notes
    static getNotes() {
        return [
            new VF.StaveNote({
                clef: "treble",
                keys: ["c/4"],
                duration: "4d"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["d/4"],
                duration: "4d"
            })
        ];
    }

    static CommonTests () {
        window.music = {};
        window.music.notes = Test2.getNotes();
        var context = Test2.createContext();

        var timeTest = () => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                        resolve();
                    },
                    500);
            });
            return promise;
        }

        var staffMeasure = new StaffMeasure(context, {
            clef:'treble',
            timeSignature:'6/8',
            num_beats:3,
        });

        var drawInital = () => {
            window.music = staffMeasure.drawNotes(music.notes);
            return timeTest();
        }
        var contractTest = () => {
            window.music.notes = VX.DURATION(music.notes, 1, '8')
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }
        var endTests = () => {
            return timeTest();
        }
        var promise = drawInital().then(contractTest).then(endTests);
        return promise;
    }
}

