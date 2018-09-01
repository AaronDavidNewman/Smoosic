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

// Create the notes
    static get notes() {
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
        window.music.notes = Test2.notes;
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
            keySignature:'Bb',
            num_beats:3,
			notes:music.notes
        });

        var drawInital = () => {
			// music.notes = VX.APPLY_MODIFIERS (music.notes,staffMeasure.keySignature);
            window.music = staffMeasure.drawNotes(music.notes);
            return timeTest();
        }
        var contractTest = () => {
            window.music.notes = VX.DURATION(music.notes, 1, '8')
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var stretchTest = () => {
            window.music.notes = VX.DURATION(music.notes, 1, '4d')
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }
        var makeTupletTest = () => {
            window.music.notes = VX.TUPLET(music.notes, 1, '8', 2 , 3);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }
        var endTests = () => {
            return timeTest();
        }
        var promise = drawInital().then(contractTest).then(stretchTest).then(makeTupletTest).then(endTests);
        return promise;
    }
}

