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

    // Create the notes
    static notesSet() {
        return [
            new VF.StaveNote({
                clef: "treble",
                keys: ["c/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["d/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["e/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["f/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["g/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["a/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["d/4"],
                duration: "8"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["c/5"],
                duration: "8"
            })
        ];
    }

    static get Notes() {
        var notes = Test1.notesSet();
        var tuplet = new Vex.Flow.Tuplet(notes.slice(6, 9), {
                num_notes: 3,
                notes_occupied: 2,
                ratioed: false,
                bracketed: true,
                location: 1
            });
        return notes;
    }

    static CommonTests() {
        window.music = {};
        window.music.notes = Test1.Notes;
        var context = Test1.createContext();

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
                clef: 'treble',
                timeSignature: '4/4',
                num_beats: 4,
				notes:music.notes
            });

        var drawInital = () => {
            VX.APPLY_MODIFIERS(music.notes, 'G');
            window.music = staffMeasure.drawNotes(music.notes);
            return timeTest();
        }
        var contractTest = () => {
            window.music.notes = VX.DURATION(music.notes, 1, '8')
                VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var stretchTest = () => {
            window.music.notes = VX.DURATION(music.notes, 1, '4d');
            VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var pitchTest = () => {
            window.music.notes = VX.SETPITCH(music.notes, Selection.selectChords(music.notes, 1), ['d/5']);
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var tupletPitchTest = () => {
            window.music.notes = VX.SETPITCH(music.notes, Selection.selectChords(music.notes, 7), ['a/4']);
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var tupletStretchTest = () => {
            window.music.notes = VX.DURATION(music.notes, 7, '4');
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }
        var tupletContractTest = () => {
            window.music.notes = VX.DURATION(music.notes, 7, '8');
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var unmakeTupletTest = () => {
            window.music.notes = VX.UNTUPLET(music.notes, 6, '4');
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var makeTupletTest = () => {
            window.music.notes = VX.TUPLET(music.notes, 6, '8', 3, 2);
            window.music.notes = VX.APPLY_MODIFIERS(music.notes, music.keySignature);
            window.music = staffMeasure.drawNotes(window.music.notes);
            return timeTest();
        }

        var endTests = () => {
            new Tracker(window.music, context, staffMeasure);
            return timeTest();

        }
        var promise = drawInital().then(stretchTest).then(contractTest).then(pitchTest);
        promise = promise.then(tupletPitchTest).then(tupletStretchTest).then(tupletContractTest);
        promise = promise.then(unmakeTupletTest).then(makeTupletTest).then(endTests);
        return promise;

    }

    
    /**
    before render:{
    "attrs": {
    "id": "auto1028",
    "type": "StaveNote",
    "classes": {}
    },
    "ticks": {
    "numerator": 8192,
    "denominator": 1
    },
    "intrinsicTicks": 8192,
    "tickMultiplier": {
    "numerator": 1,
    "denominator": 1
    },
    "modifiers": [{
    "attrs": {
    "id": "auto1038",
    "type": "Dot",
    "classes": "..."
    },
    "width": 5,
    "note": {
    "attrs": "...",
    "ticks": "...",
    "intrinsicTicks": 8192,
    "tickMultiplier": "...",
    "modifiers": [
    "..."
    ],
    "tupletStack": [],
    "formatterMetrics": "...",
    "duration": "h",
    "dots": 1,
    "noteType": "n",
    "glyph": "...",
    "ys": [],
    "render_options": "...",
    "stem": "...",
    "keys": [
    "...",
    "..."
    ],
    "keyProps": [
    "...",
    "..."
    ],
    "use_default_head_x": true,
    "note_heads": [
    "...",
    "..."
    ],
    "stem_direction": 1
    },
    "position": 2,
    "radius": 2
    }
    ],
    "tupletStack": [],
    "formatterMetrics": {
    "freedom": {},
    "space": {}
    },
    "duration": "h",
    "dots": 1,
    "noteType": "n",
    "glyph": {
    "stem": true,
    "gracenote_stem_up_extension": -14,
    "gracenote_stem_down_extension": -14,
    "code_head": "v81"
    },
    "ys": [],
    "render_options": {
    "annotation_spacing": 5,
    "stave_padding": 12,
    "glyph_font_scale": 39,
    "stroke_px": 3
    },
    "stem": {
    "attrs": {
    "id": "auto1029",
    "type": "Stem",
    "classes": "..."
    },
    "stem_direction": 1
    },
    "keys": [{
    "0": "d",
    "1": "/",
    "2": "5"
    },{
    "0": "e",
    "1": "b",
    "2": "/",
    "3": "4"
    }
    ],
    "keyProps": [{
    "key": "EB",
    "octave": 4,
    "line": 1,
    "int_value": 51,
    "accidental": "b"
    },{
    "key": "D",
    "octave": 5,
    "line": 4,
    "int_value": 62
    }
    ],
    "use_default_head_x": true,
    "note_heads": [{
    "attrs": {
    "id": "auto1034",
    "type": "NoteHead",
    "classes": "..."
    },
    "ticks": {
    "numerator": 8192,
    "denominator": 1
    },
    "intrinsicTicks": 8192,
    "tickMultiplier": {
    "numerator": 1,
    "denominator": 1
    },
    "width": 12.01824,
    "modifiers": [],
    "tupletStack": [],
    "formatterMetrics": {
    "freedom": "...",
    "space": "..."
    },
    "duration": "h",
    "noteType": "n",
    "glyph": {
    "stem": true,
    "gracenote_stem_up_extension": -14,
    "gracenote_stem_down_extension": -14,
    "code_head": "v81"
    },
    "ys": [],
    "render_options": {
    "annotation_spacing": 5,
    "stave_padding": 12,
    "glyph_font_scale": 39,
    "stroke_px": 3
    },
    "note_type": "n",
    "stem_direction": 1,
    "line": 1,
    "glyph_code": "v81"
    },{
    "attrs": {
    "id": "auto1036",
    "type": "NoteHead",
    "classes": "..."
    },
    "ticks": {
    "numerator": 8192,
    "denominator": 1
    },
    "intrinsicTicks": 8192,
    "tickMultiplier": {
    "numerator": 1,
    "denominator": 1
    },
    "width": 12.01824,
    "modifiers": [],
    "tupletStack": [],
    "formatterMetrics": {
    "freedom": "...",
    "space": "..."
    },
    "duration": "h",
    "noteType": "n",
    "glyph": {
    "stem": true,
    "gracenote_stem_up_extension": -14,
    "gracenote_stem_down_extension": -14,
    "code_head": "v81"
    },
    "ys": [],
    "render_options": {
    "annotation_spacing": 5,
    "stave_padding": 12,
    "glyph_font_scale": 39,
    "stroke_px": 3
    },
    "note_type": "n",
    "stem_direction": 1,
    "line": 4,
    "glyph_code": "v81"
    }
    ],
    "stem_direction": 1
    }

    after render:{
    "attrs": {
    "id": "auto1019",
    "el": {},
    "type": "StaveNote",
    "classes": {}
    },
    "context": {
    "element": {},
    "svgNS": "http://www.w3.org/2000/svg",
    "svg": {},
    "groups": {},
    "parent": {},
    "path": "M364.69312 75 A2 2 0 0 0 360.69312 75M0 0M360.69312 75 A2 2 0 0 0 364.69312 75M0 0",
    "pen": {},
    "lineWidth": 1.5,
    "state": {
    "font-family": "Arial",
    "font-size": "10pt",
    "font-weight": "normal",
    "font-style": "normal"
    },
    "attributes": {
    "stroke-width": 0.3,
    "fill": "black",
    "stroke": "black",
    "stroke-dasharray": "none",
    "font-family": "Arial",
    "font-size": "10pt",
    "font-weight": "normal",
    "font-style": "normal",
    "x": 410,
    "y": 79.5,
    "width": 1,
    "height": 41
    },
    "background_attributes": {
    "fill": "#eed",
    "stroke": "#eed",
    "stroke-dasharray": "none",
    "font-family": "Arial",
    "font-size": "10pt",
    "font-weight": "normal",
    "font-style": "normal"
    },
    "shadow_attributes": {
    "color": "black"
    },
    "state_stack": {},
    "width": 500,
    "height": 500,
    "fontSize": 10
    },
    "rendered": true,
    "ticks": {
    "numerator": 1024,
    "denominator": 1
    },
    "intrinsicTicks": 1024,
    "tickMultiplier": {
    "numerator": 1,
    "denominator": 1
    },
    "width": 24.03648,
    "voice": {
    "attrs": {
    "id": "auto1060",
    "type": "Voice"
    },
    "boundingBox": {
    "x": 79.90079999999998,
    "y": 40,
    "w": 283.79232,
    "h": 85
    },
    "rendered": true,
    "time": {
    "num_beats": 4,
    "beat_value": 4,
    "resolution": 16384
    },
    "totalTicks": {
    "numerator": 16384,
    "denominator": 1
    },
    "resolutionMultiplier": 1,
    "tickables": {},
    "ticksUsed": {
    "numerator": 16384,
    "denominator": 1
    },
    "smallestTickCount": {
    "numerator": 1024,
    "denominator": 1
    },
    "stave": {
    "rendered": true,
    "x": 10,
    "y": 40,
    "width": 400,
    "formatted": true,
    "start_x": 67.90079999999999,
    "end_x": 410,
    "clef": "treble",
    "height": 90
    },
    "mode": 2,
    "preFormatted": true
    },
    "tickContext": {
    "attrs": {
    "id": "auto1062",
    "type": "TickContext"
    },
    "context": {
    "svgNS": "http://www.w3.org/2000/svg",
    "path": "M364.69312 75 A2 2 0 0 0 360.69312 75M0 0M360.69312 75 A2 2 0 0 0 364.69312 75M0 0",
    "lineWidth": 1.5,
    "width": 500,
    "height": 500,
    "fontSize": 10
    },
    "ticks": {
    "denominator": 1
    },
    "tickMultiplier": {
    "numerator": 1,
    "denominator": 1
    },
    "width": 35.4784,
    "modifiers": {},
    "postFormatted": true,
    "tupletStack": {},
    "formatterMetrics": {},
    "currentTick": {
    "denominator": 1
    },
    "maxTicks": {
    "numerator": 1024,
    "denominator": 1
    },
    "minTicks": {
    "numerator": 1024,
    "denominator": 1
    },
    "padding": 3,
    "x": 93.24968,
    "xBase": 93.24968,
    "tickables": {},
    "notePx": 24.03648,
    "extraLeftPx": 11.44192,
    "tContexts": {}
    },
    "modifierContext": {
    "modifiers": {},
    "preFormatted": true,
    "width": 11.44192,
    "state": {
    "left_shift": 11.44192
    },
    "PREFORMAT": {},
    "POSTFORMAT": {}
    },
    "modifiers": {
    "0": {
    "rendered": true,
    "position": 1,
    "x_shift": -1,
    "type": "b"
    }
    },
    "preFormatted": true,
    "postFormatted": true,
    "tupletStack": {},
    "formatterMetrics": {
    "freedom": {
    "left": 37.73016,
    "right": 16.576719999999995
    },
    "duration": "1024/1",
    "iterations": 1,
    "space": {
    "used": 40.61319999999999,
    "mean": 40.61319999999999
    }
    },
    "duration": "16",
    "noteType": "n",
    "glyph": {
    "beam_count": 2,
    "stem": true,
    "flag": true,
    "code_flag_upstem": "v3f",
    "code_flag_downstem": "v8f",
    "gracenote_stem_up_extension": -14,
    "gracenote_stem_down_extension": -14,
    "code_head": "vb"
    },
    "left_modPx": 11.44192,
    "ys": {
    "0": 85
    },
    "stave": {
    "attrs": {
    "id": "auto1000",
    "type": "Stave"
    },
    "context": {
    "svgNS": "http://www.w3.org/2000/svg",
    "path": "M364.69312 75 A2 2 0 0 0 360.69312 75M0 0M360.69312 75 A2 2 0 0 0 364.69312 75M0 0",
    "lineWidth": 1.5,
    "width": 500,
    "height": 500,
    "fontSize": 10
    },
    "rendered": true,
    "x": 10,
    "y": 40,
    "width": 400,
    "formatted": true,
    "start_x": 67.90079999999999,
    "end_x": 410,
    "modifiers": {},
    "clef": "treble",
    "font": {
    "family": "sans-serif",
    "size": 8
    },
    "options": {
    "vertical_bar_width": 10,
    "glyph_spacing_px": 10,
    "num_lines": 5,
    "fill_style": "#999999",
    "left_bar": true,
    "right_bar": true,
    "spacing_between_lines_px": 10,
    "space_above_staff_ln": 4,
    "space_below_staff_ln": 4,
    "top_text_position": 1,
    "bottom_text_position": 5
    },
    "bounds": {
    "x": 10,
    "y": 40,
    "w": 400
    },
    "height": 90
    },
    "render_options": {
    "annotation_spacing": 5,
    "stave_padding": 12,
    "glyph_font_scale": 39,
    "stroke_px": 3
    },
    "stem": {
    "attrs": {
    "id": "auto1020",
    "type": "Stem"
    },
    "context": {
    "svgNS": "http://www.w3.org/2000/svg",
    "path": "M364.69312 75 A2 2 0 0 0 360.69312 75M0 0M360.69312 75 A2 2 0 0 0 364.69312 75M0 0",
    "lineWidth": 1.5,
    "width": 500,
    "height": 500,
    "fontSize": 10
    },
    "rendered": true,
    "x_begin": 184.41871999999998,
    "x_end": 184.41871999999998,
    "y_top": 85,
    "y_bottom": 85,
    "stem_direction": 1
    },
    "keys": {
    "0": "eb/5"
    },
    "keyProps": {
    "0": {
    "key": "EB",
    "octave": 5,
    "line": 4.5,
    "int_value": 63,
    "accidental": "b"
    }
    },
    "note_heads": {
    "0": {
    "rendered": true,
    "intrinsicTicks": 1024,
    "width": 12.01824,
    "duration": "16",
    "noteType": "n",
    "x": 173.15048,
    "y": 85,
    "note_type": "n",
    "stem_direction": 1,
    "line": 4.5,
    "glyph_code": "vb"
    }
    },
    "stem_direction": 1,
    "flag": {
    "attrs": {
    "id": "auto1025",
    "type": "Glyph"
    },
    "rendered": true,
    "code": "v3f",
    "point": 39,
    "options": {
    "cache": true
    },
    "metrics": {
    "x_min": -24.5,
    "x_max": 317.140625,
    "ha": 324
    },
    "originShift": {},
    "scale": 0.02808,
    "bbox": {
    "x": -0.6739200000000001,
    "y": 0.1404,
    "w": 9.575280000000001,
    "h": 32.90976
    }
    }
    }

     */

}
