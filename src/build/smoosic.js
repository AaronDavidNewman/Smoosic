
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

/**
 * Utilities I wish were in VF.Music but aren't
 **/
class vexMusic {

    // ## getKeyOffset
    // ## Description:  given a vex noteProp and an offset, offset that number
    // of 1/2 steps.
    // ### Input:  smoPitch
    // ### Output:  smoPitch offset, not key-adjusted.
    static getKeyOffset(pitch, offset) {
        var canon = VF.Music.canonical_notes;

        // Convert to vex keys, where f# is a string like 'f#'.
        var vexKey = pitch.letter.toLowerCase();
        if (pitch.accidental.length === 0) {
            vexKey = vexKey + 'n';
        } else {
            vexKey = vexKey + pitch.accidental;
        }
        vexKey = canon[VF.Music.noteValues[vexKey].int_val];
        var rootIndex = canon.indexOf(vexKey);
        var index = (rootIndex + canon.length + offset) % canon.length;
        var octave = pitch.octave;
        if (Math.abs(offset) >= 12) {
            var octaveOffset = Math.sign(offset) * Math.round(Math.abs(offset) / 12);
            octave += octaveOffset;
            offset = offset % 12;
        }
        if (rootIndex + offset >= canon.length) {
            octave += 1;
        }
        if (rootIndex + offset < 0) {
            octave -= 1;
        }
        var rv = JSON.parse(JSON.stringify(pitch));
        vexKey = canon[index];
        if (vexKey.length > 1) {
            rv.accidental = vexKey.substring(1);
            vexKey = vexKey[0];
        } else {
            rv.accidental = '';
        }
        rv.letter = vexKey;
        rv.octave = octave;
        return rv;
    }

    // ## keySignatureLength
    // ## Description:
    // return the number of sharp/flat in a key signature for sizing guess.
    static get keySignatureLength() {
        return {
            'C': 0,
            'B': 5,
            'A': 3,
            'F#': 6,
            'Bb': 2,
            'Ab': 4,
            'Gg': 6,
            'G': 1,
            'F': 1,
            'Eb': 3,
            'Db': 5,
            'Cb': 7,
            'C#': 7,
            'F#': 6,
            'E': 4,
            'D': 2
        };
    }

    // ### getKeySignatureKey
    // ### Description:
    // given a letter pitch (a,b,c etc.), and a key signature, return the actual note
    // that you get without accidentals
    // ### Usage:
    //   vexMusic.getKeySignatureKey('F','G'); // returns f#
    // TODO: move to smoPitch
    static getKeySignatureKey(letter, keySignature) {
        var km = new VF.KeyManager(keySignature);
        return km.scaleMap[letter];
    }

    // ### Description:
    // Get ticks for this note with an added dot.  Return
    // identity if that is not a supported value.
    static getNextDottedLevel(ticks) {
        var ttd = vexMusic.ticksToDuration;
        var vals = Object.values(ttd);

        var ix = vals.indexOf(ttd[ticks]);
        if (ix >= 0 && ix < vals.length && vals[ix][0] == vals[ix + 1][0]) {
            return vexMusic.durationToTicks(vals[ix + 1]);
        }
        return ticks;
    }

    // ### Description:
    // Get ticks for this note with one fewer dot.  Return
    // identity if that is not a supported value.
    static getPreviousDottedLevel(ticks) {
        var ttd = vexMusic.ticksToDuration;
        var vals = Object.values(ttd);
        var ix = vals.indexOf(ttd[ticks]);
        if (ix > 0 && vals[ix][0] == vals[ix - 1][0]) {
            return vexMusic.durationToTicks(vals[ix - 1]);
        }
        return ticks;
    }

    // ### ticksToDuration
    // ### Description:
    // Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
    static get ticksToDuration() {
        var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
        var ticksToDuration = {};
        var _ticksToDurations = function () {
            for (var i = 0; i < durations.length - 1; ++i) {
                var dots = '';
                var ticks = 0;

                // We support up to 4 'dots'
                for (var j = 0; j < 4 && j + i < durations.length; ++j) {
                    ticks += VF.durationToTicks.durations[durations[i + j]];
                    ticksToDuration[ticks.toString()] = durations[i] + dots;
                    dots += 'd'
                }
            }
            return ticksToDuration;
        }
        _ticksToDurations();
        return ticksToDuration;
    };

    // ## durationToTicks
    // Uses VF.durationToTicks, but handles dots.
    static durationToTicks(duration) {
        var dots = duration.indexOf('d');
        if (dots < 0) {
            return VF.durationToTicks(duration);
        } else {
            var vfDuration = VF.durationToTicks(duration.substring(0, dots));
            dots = duration.length - dots; // number of dots
            var split = vfDuration / 2;
            for (var i = 0; i < dots; ++i) {
                vfDuration += split;
                split = split / 2;
            }

            return vfDuration;
        }
    }

    // ## enharmonics
    // ## Description:
    // return a map of enharmonics for choosing.  notes are in vexKey form.
    static get enharmonics() {
        var rv = {};
        var keys = Object.keys(VF.Music.noteValues);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var int_val = VF.Music.noteValues[key].int_val;
            if (typeof(rv[int_val.toString()]) == 'undefined') {
                rv[int_val.toString()] = [];
            }
            // only consider natural note 1 time.  It is in the list twice for some reason.
            if (key.indexOf('n') == -1) {
                rv[int_val.toString()].push(key);
            }
        }
        return rv;
    }

   
    // ### getEnharmonic(noteProp)
    // ###   cycle through the enharmonics for a note.
    static getEnharmonic(key) {
        var intVal = VF.Music.noteValues[key.toLowerCase()].int_val;
        var ar = vexMusic.enharmonics[intVal.toString()];
        var len = ar.length;
        var ix = ar.indexOf(key);
        key = ar[(ix + 1) % len];
        return key;
    }
    // ## getKeyFriendlyEnharmonic
    // ### Description:
    // fix the enharmonic to match the key, if possible
	// ## Usage: 
	// getKeyFriendlyEnharmonic('b','eb');  // returns 'bb'
    static getKeyFriendlyEnharmonic(letter, keySignature) {
        var rv = letter;
        var muse = new VF.Music();
        var scale = Object.values(muse.createScaleMap(keySignature));
        var prop = vexMusic.getEnharmonic(letter.toLowerCase());
        while (prop.toLowerCase() != letter.toLowerCase()) {
            for (var i = 0; i < scale.length; ++i) {
                var skey = scale[i];
                if ((skey[0] == prop && skey[1] == 'n') ||
                    (skey.toLowerCase() == prop.toLowerCase())) {
                    rv = skey;
                    break;
                }
            }
            prop = (prop[1] == 'n' ? prop[0] : prop);
            prop = vexMusic.getEnharmonic(prop);
        }
        return rv;
    }

    // ## getIntervalInKey
	// ## Description:
	// give a pitch and a key signature, return another pitch at the given 
	// diatonic interval.  Similar to getKeyOffset but diatonic.
    static getIntervalInKey(pitch, keySignature, interval) {
        var muse = new VF.Music();
        var letter = pitch.letter;
        var scale = Object.values(muse.createScaleMap(keySignature));

        var up = interval > 0 ? true : false;
        var interval = interval < 0 ? scale.length - (interval * -1) : interval;

        var ix = scale.findIndex((x) => {
                return x[0] == letter[0];
            });
        if (ix >= 0) {
            var nletter = scale[(ix + interval) % scale.length];
            var nkey = {
                letter: nletter[0],
                accidental: nletter[1],
                octave: pitch.octave
            };
            if (up) {
                nkey.octave += 1;
            }
            return nkey;
        }
        return letter;
    }

    static filteredMerge(attrs, src, dest) {
        attrs.forEach(function (attr) {
            if (src[attr]) {
                dest[attr] = src[attr];
            }
        });
    }
}
;

class svgHelpers {
    static unionRect(b1, b2) {
        var x = Math.min(b1.x, b2.x);
        var y = Math.min(b1.y, b2.y);
        var width = Math.max(b1.x + b1.width, b2.x + b2.width) - x;
        var height = Math.max(b1.y + b1.height, b2.y + b2.height) - y;
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    // ## Description:
    // return a simple box object that can be serialized, copied.
    static smoBox(box) {
        return ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
        });
    }

    static measureBBox(b1, measure, staff) {
        if (measure.renderedBox) {
            if (b1['width']) {
                return svgHelpers.unionRect(b1, measure.renderedBox);
            } else {
                return measure.renderedBox;
            }
        } else {
            var mbox = {
                x: measure.staffX,
                y: staff.staffY,
                width: measure.staffWidth,
                height: staff.staffHeight
            };
            if (b1['width']) {
                return mbox;
            }
            return svgHelpers.unionRect(b1, mbox);
        }
    }

    static stringify(box) {
        if (box['width']) {
			
            return JSON.stringify({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
            }, null, ' ');
        } else {
            return JSON.stringify({
                x: box.x,
			y: box.y},null,' ');
		}
    }

    static log(box) {
        if (box['width']) {
            console.log(JSON.stringify({
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height
                }, null, ' '));
        }
        console.log('{}');
    }
    static pointBox(x, y) {
        return {
            x: x,
            y: y,
            width: 1,
            height: 1
        };
    }
	
	static copyBox(box) {
		return {x:box.x,y:box.y,width:box.width,height:box.height};
	}
	
	
	static logicalToClient(svg,logicalPoint) {
		var rect = svg.getBoundingClientRect();
		var rv = svgHelpers.copyBox(logicalPoint);
		rv.x+=rect.x;
		rv.y+=rect.y;		
		return rv;
	}
	
	
	static clientToLogical(svg,clientPoint) {
		if (clientPoint['width']) {
			return untransformSvgBox(svg,clientPoint);
		}
		return untransformSvgPoint(svg,clientPoint);
		return rv;
	}
    
	// ## clientToLogical
	// ## Description:
	// return a box or point in svg coordintes from screen coordinates
    static clientToLogical(svg, point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        
		var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM().inverse());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
    }
	
	// ## logicalToClient
	// ## Description:
	// return a box or point in screen coordinates from svg coordinates
	static logicalToClient(svg,point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
	}
}
;
var smoDomBuilder = function (el) {}

class htmlHelpers {
    /**
     *  Helper functions for buildling DOM trees in javascript.
     * @param {} el
     * @returns {}
     */

    /**
     *DOM builder for javascript.  Syntactic sugar around jquery builder.
     * Usage:
     * var b = htmlHelpers.buildDom();

     *  var r =
    b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
    b('td').classes('noSideBorderRight').append(
    ...
    $(parent).append(r.dom());

    Don't forget the '.dom()' !  That is the actual jquery element objet
     * @param {} el
     * @returns {}
     */
    static buildDom = function (el) {
        var smoDomBuilder = function (el) {
            this.e = $('<' + el + '/>');
            var self = this;
            this.classes = function (cl) {
                $(self.e).addClass(cl);
                return self;
            }
            this.data = function (name, value) {
                $(self.e).attr('data-' + name, value);
                return self;
            }
            this.attr = function (name, value) {
                $(self.e).attr(name, value);
                return self;
            }
            this.css = function (name, value) {
                $(self.e).css(name, value);
                return self;
            }
            this.append = function (el) {
                $(self.e).append(el.e);
                return self;
            }
            this.text = function (tx) {
                $(self.e).append(document.createTextNode(tx));
                return self;
            }
            this.dom = function () {
                return self.e;
            }
            return this;
        }
        return new smoDomBuilder(el);
    }
	
	
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4'
class VxMeasure {
    constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxMeasure.defaults);
        Vex.Merge(this, options);
        this.smoMeasure = this.smoMeasure ? this.smoMeasure : new SmoMeasure(options);
        this.noteToVexMap = {};
        this.beamToVexMap = {};
        this.tupletToVexMap = {};
        this.modifierOptions = {};
        this.tickmap = this.smoMeasure.tickmap();

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
    }

    static get defaults() {
        // var defaultLayout = new smrfSimpleLayout();

        return {
            smoMeasure: null
        };
    }
    addCustomModifier(ctor, parameters) {
        this.smoMeasure.addCustomModifier(ctor, parameters);
    }

    applyTransform(actor) {
        SmoTickTransformer.applyTransform(this.smoMeasure, [actor]);
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    applyModifiers() {
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    tickmap() {
        return VX.TICKMAP(this.smoMeasure);
    }

    // ## Description:
    // decide whether to force stem direction for multi-voice, or use the default.
    // ## TODO:
    // use x position of ticks in other voices, pitch of note, and consider
    // stem direction modifier.
    applyStemDirection(vxParams) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (this.smoMeasure.activeVoice % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex) {
        var noteParams = {
            clef: smoNote.clef,
            keys: smoNote.toVexKeys(),
            duration: smoNote.duration + smoNote.noteType
        };
        this.applyStemDirection(noteParams);
        var vexNote = new VF.StaveNote(noteParams);
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?
        
		// consider accidentals in measure in earlier notes.
        var accidentals = tickIndex === 0 ? {} : this.tickmap.accidentalMap[tickIndex-1];
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
			var accidental = pitch.accidental ?  pitch.accidental : 'n';
            var defaultAccidental = vexMusic.getKeySignatureKey(pitch.letter, this.smoMeasure.keySignature);
            defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';

            // was this accidental declared earlier in the measure?
            var declared = accidentals[pitch.letter] && accidentals[pitch.letter].accidental === pitch.accidental;

            if ((accidental != defaultAccidental && !declared) || pitch.cautionary) {
                var acc = new VF.Accidental(accidental);

                if (pitch.cautionary) {
                    acc.setAsCautionary();
                }
                vexNote.addAccidental(i, acc);
            }
        }
        for (var i = 0; i < smoNote.dots; ++i) {
            vexNote.addDotToAll();
        }

        return vexNote;
    }
	
    // ## Description:
    // create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes() {
        this.vexNotes = [];
        this.noteToVexMap = {};

        for (var i = 0; i < this.smoMeasure.notes.length; ++i) {
            var smoNote = this.smoMeasure.notes[i];
            var vexNote = this._createVexNote(smoNote, i);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
    }

    // ## Description:
    // create the VX beam groups, honoring the Smo custom modifiers
    // ## TODO:
    // make the Smo custom modifiers
    createVexBeamGroups() {
        this.vexBeamGroups = [];
        this.beamToVexMap = {};
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            var vexNotes = [];
            var stemDirection = -1;
            for (var j = 0; j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                var vexNote = this.noteToVexMap[note.attrs.id]
                    if (j === 0) {
                        stemDirection = vexNote.getStemDirection();
                    } else {
                        vexNote.setStemDirection(stemDirection);
                    }
                    vexNotes.push(this.noteToVexMap[note.attrs.id]);
            }
            var vexBeam = new VF.Beam(vexNotes);
            this.beamToVexMap[bg.attrs.id] = vexBeam;
            this.vexBeamGroups.push(vexBeam);
        }
    }

    // ## Description:
    // Create the VF tuplet objects based on the smo tuplet objects
    // that have been defined.
    createVexTuplets() {
        this.vexTuplets = [];
        this.tupletToVexMap = {};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
            var vexNotes = [];
            for (var j = 0; j < tp.notes.length; ++j) {
                var smoNote = tp.notes[j];
                vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
            }
            var vexTuplet = new VF.Tuplet(vexNotes, {
                    num_notes: tp.num_notes,
                    notes_occupied: tp.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
            this.tupletToVexMap[tp.attrs.id] = vexTuplet;
            this.vexTuplets.push(vexTuplet);
        }
    }
    unrender() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();
    }
    get renderedSize() {
        if (this.smoMeasure.renderedSize) {
            return this.smoMeasure.renderedSize;
        }
        return null;
    }

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);

        // offset for left-hand stuff
        var staffMargin = (this.smoMeasure.forceClef ? 40 : 0)
         + (this.smoMeasure.forceTimeSignature ? 16 : 0)
         + (this.smoMeasure.forceKeySignature ? vexMusic.keySignatureLength[this.smoMeasure.keySignature] * 8 : 0);
        var staffWidth = this.smoMeasure.staffWidth
             + staffMargin;

        //console.log('measure '+JSON.stringify(this.smoMeasure.measureNumber,null,' ')+' x: ' + this.smoMeasure.staffX + ' y: '+this.smoMeasure.staffY
        // + 'width: '+staffWidth);
        this.stave = new VF.Stave(this.smoMeasure.staffX, this.smoMeasure.staffY, staffWidth);
        //console.log('adjX is '+this.smoMeasure.adjX);

        // Add a clef and time signature.
        if (this.smoMeasure.forceClef) {
            this.stave.addClef(this.smoMeasure.clef);
        }
        if (this.smoMeasure.forceKeySignature) {
            this.stave.addKeySignature(this.smoMeasure.keySignature);
        }
        if (this.smoMeasure.forceTimeSignature) {
            this.stave.addTimeSignature(this.smoMeasure.timeSignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        var voiceAr = [];

        // If there are multiple voices, add them all to the formatter at the same time so they don't collide
        for (var j = 0; j < this.smoMeasure.voices.length; ++j) {

            this.smoMeasure.activeVoice = j;
            this.createVexNotes();
            this.createVexTuplets();
            this.createVexBeamGroups();

            // Create a voice in 4/4 and add above notes
            var voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                });
            voice.addTickables(this.vexNotes);
            voiceAr.push(voice);
        }
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth - this.smoMeasure.adjX);
        for (var j = 0; j < voiceAr.length; ++j) {
            voiceAr[j].draw(this.context, this.stave);
        }

        var self = this;
        this.vexBeamGroups.forEach(function (b) {
            b.setContext(self.context).draw();
        });

        this.vexTuplets.forEach(function (tuplet) {
            tuplet.setContext(self.context).draw();
        });
        var box = group.getBoundingClientRect();
        this.smoMeasure.renderedBox = {
            x: box.x,
            y: box.y,
            height: box.height,
            width: box.width
        };
        this.smoMeasure.changed = false;

        // Calculate how far off our estimated width we are
        var svgBox =
            svgHelpers.clientToLogical(this.context.svg, box);
        this.smoMeasure.adjX = svgBox.width - this.stave.getWidth() + this.smoMeasure.rightMargin;
		console.log('adjx is '+this.smoMeasure.adjX);
        // console.log(JSON.stringify(this.smoMeasure.renderedBox,null,' '));
        this.context.closeGroup();
    }

}
;// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
    constructor(context, topY, lineIndex) {
        this.context = context;
        this.leftConnector = [null, null];
        this.lineIndex = lineIndex;
        this.maxStaffIndex = -1;
        this.maxSystemIndex = -1;
        this.width = -1;
        this.endcaps = [];
        this.box = {
            x: -1,
            y: -1,
            width: 0,
            height: 0
        };
        this.currentY = 0;
        this.topY = topY;
        this.clefWidth = 70;
        this.ys = [];
        this.measures = [];
        this.modifiers = [];
    }

    getVxNote(smoNote) {
        var note;
		if (!smoNote) {
			return null;
		}
        for (var i = 0; i < this.measures.length; ++i) {
            var mm = this.measures[i];
            if (mm.noteToVexMap[smoNote.id]) {
                return mm.noteToVexMap[smoNote.id];
            }
        }
        return null;
    }

    renderModifier(modifier, vxStart, vxEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for 
		// both if it is removed.
		var artifactId=modifier.attrs.id+'-'+this.lineIndex;
        $(this.context.svg).find('g.' + artifactId).remove();
		var group = this.context.openGroup();
		group.classList.add(modifier.id);
		group.classList.add(artifactId);
        if ((modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
            (modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
            var hairpin = new VF.StaveHairpin({
                    first_note: vxStart,
                    last_note: vxEnd
                }, modifier.hairpinType);
			hairpin.setRenderOptions({
				height:modifier.height,
				y_shift:modifier.yOffset,
				left_shift_px:modifier.xOffsetLeft,
				right_shift_px:modifier.xOffsetRight
			});
            hairpin.setContext(this.context).setPosition(modifier.position).draw();
        }

        this.context.closeGroup();
		return group.getBoundingClientRect();
    }

    // ## renderMeasure
    // ## Description:
    // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
    // groups
    renderMeasure(staffIndex, smoMeasure) {
        var systemIndex = smoMeasure.measureNumber.systemIndex;

        var vxMeasure = new VxMeasure(this.context, {
                smoMeasure: smoMeasure
            });

        vxMeasure.render();

        // Keep track of the y coordinate for the nth staff


        // keep track of left-hand side for system connectors
        if (systemIndex === 0) {
            if (staffIndex === 0) {
                this.leftConnector[0] = vxMeasure.stave;
            } else if (staffIndex > this.maxStaffIndex) {
                this.maxStaffIndex = staffIndex;
                this.leftConnector[1] = vxMeasure.stave;
            }
        } else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
            this.endcaps = [];
            this.endcaps.push(vxMeasure.stave);
            this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
        } else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
            this.endcaps.push(vxMeasure.stave);
        }
        this.measures.push(vxMeasure);
        // this._adjustBox(vxMeasure.renderedSize);
    }

    // ## cap
    // ## Description:
    // draw the system brackets.  I don't know why I call them a cap.
    cap() {
        $(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
        var group = this.context.openGroup();
        group.classList.add('lineBracket-' + this.lineIndex);
        if (this.leftConnector[0] && this.leftConnector[1]) {
            var c1 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.BRACKET);
            var c2 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.SINGLE);
            c1.setContext(this.context).draw();
            c2.setContext(this.context).draw();
        }
        this.context.closeGroup();
    }
}
;

// ## suiController
// ### Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
class suiController {

    constructor(params) {

        Vex.Merge(this, suiController.defaults);
        Vex.Merge(this, params);
        this.bindEvents();
    }

    // ## createUi
    // ### Description:
    // Convenience constructor, taking a renderElement and a score.
    static createUi(renderElement, score) {
        var params = suiController.keyBindingDefaults;
        params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
        params.tracker = new suiTracker(params.layout);
        params.score = score;
        params.editor = new suiEditor(params);
        params.menus = new suiMenuManager(params);
        var controller = new suiController(params);
        return controller;
    }

    // ### renderElement
    // return render element that is the DOM parent of the svg
    get renderElement() {
        return this.layout.renderElement;
    }

    // ## keyBindingDefaults
    // ### Description:
    // Different applications can create their own key bindings, these are the defaults.
    // Many editor commands can be reached by a single keystroke.  For more advanced things there
    // are menus.
    static get keyBindingDefaults() {
        var editorKeys = suiController.editorKeyBindingDefaults;
        editorKeys.forEach((key) => {
            key.module = 'editor'
        });
        var trackerKeys = suiController.trackerKeyBindingDefaults;
        trackerKeys.forEach((key) => {
            key.module = 'tracker'
        });
        return trackerKeys.concat(editorKeys);
    }

    // ## editorKeyBindingDefaults
    // ## Description:
    // execute a simple command on the editor, based on a keystroke.
    static get editorKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "=",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeUp"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeDown"
            }, {
                event: "keydown",
                key: "=",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "upOctave"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "downOctave"
            }, {
                event: "keydown",
                key: ".",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "doubleDuration"
            }, {
                event: "keydown",
                key: ",",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "halveDuration"
            }, {
                event: "keydown",
                key: ">",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "dotDuration"
            }, {
                event: "keydown",
                key: "m",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "showModifierDialog"
            }, {
                event: "keydown",
                key: "<",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "undotDuration"
            }, {
                event: "keydown",
                key: "a",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "b",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "c",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "d",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "f",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "g",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "makeTuplet"
            },
            // interval commands
            {
                event: "keydown",
                key: "2",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "4",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "5",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "6",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "7",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "@",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "#",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "%",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "^",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "&",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "*",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "0",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "unmakeTuplet"
            }, {
                event: "keydown",
                key: "i",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "addMeasure"
            }
        ];
    }

    // ## trackerKeyBindingDefaults
    // ### Description:
    // Key bindings for the tracker.  The tracker is the 'cursor' in the music
    // that lets you select and edit notes.
    static get trackerKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: true,
                shiftKey: false,
                action: "advanceModifierSelection"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowUp",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionUp"
            }, {
                event: "keydown",
                key: "ArrowDown",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionDown"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRightMeasure"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeftMeasure"
            }

        ]
    }

    static get defaults() {
        return {
            keyBind: suiController.keyBindingDefaults
        };
    }

    handleKeydown(evdata) {
        console.log("KeyboardEvent: key='" + event.key + "' | code='" +
            event.code + "'"
             + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        event.preventDefault();

        if (evdata.key == '/') {
            window.removeEventListener("keydown", this.keydownHandler, true);
            var self = this;
            var rebind = function () {
                self.render();
                self.bindEvents();
            }
            this.menuPromise = this.menus.slashMenuMode().then(rebind);
        }
        var binding = this.keyBind.find((ev) =>
                ev.event === 'keydown' && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
                ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

        if (binding) {
            this[binding.module][binding.action](evdata);
        }
    }

    detach() {
        window.removeEventListener("keydown", this.keydownHandler, true);
        this.layout = null;
        this.tracker = null;
        this.editor = null;
    }

    render() {
        this.layout.render();
        this.tracker.updateMap();
    }

    bindEvents() {
        var self = this;
        var tracker = this.tracker;
        $(this.renderElement).off('mousemove').on('mousemove', function (ev) {
            tracker.intersectingArtifact({
                x: ev.clientX,
                y: ev.clientY
            });
        });

        $(this.renderElement).off('click').on('click', function (ev) {
            tracker.selectSuggestion();
        });

        this.keydownHandler = this.handleKeydown.bind(this);

        window.addEventListener("keydown", this.keydownHandler, true);
    }

}
