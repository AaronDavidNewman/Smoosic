VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it usinbg VexFLow rendering engine
//
// ###  Options:
//  `{measure:measure}` - The SMO measure to render
// ### VxMeasure methods
// ---
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
	
	static get adjLeftPixels() {
		return 5;
	}
	
	static get adjRightPixels() {
		return 5;
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
		
	_createAccidentals(smoNote,vexNote,tickIndex) {
		// keep a map of accidentals already set
		var accidentals = tickIndex === 0 ? {}
           : this.tickmap.accidentalMap[tickIndex - 1];
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
            var accidental = pitch.accidental ? pitch.accidental : 'n';

            // was this accidental declared earlier in the measure?
            var declared = smoTickIterator.getActiveAccidental(pitch,tickIndex,this.tickmap.accidentalMap,this.smoMeasure.keySignature);

            if (accidental != declared || pitch.cautionary) {
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
	}

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex) {
		// If this is a tuplet, we only get the duration so the appropriate stem
		// can be rendered.  Vex calculates the actual ticks later when the tuplet is made
		var duration = 
		   smoNote.isTuplet ? 
		     smoMusic.closestVexDuration(smoNote.tickCount) : 
			 smoMusic.ticksToDuration[smoNote.tickCount];
			 
		// transpose for instrument-specific keys
		var keys=smoMusic.smoPitchesToVexKeys(smoNote.pitches,this.smoMeasure.transposeIndex);
        var noteParams = {
            clef: smoNote.clef,
            keys: keys,
            duration: duration + smoNote.noteType
        };
		
        this.applyStemDirection(noteParams);
        var vexNote = new VF.StaveNote(noteParams);
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?

		this._createAccidentals(smoNote,vexNote,tickIndex);
		
        return vexNote;
    }
	
	_renderArticulations(smoNote,articulation) {
		var i=0;
		this.smoMeasure.notes.forEach((smoNote) => {
			smoNote.articulations.forEach((art) => {
				var vx = this.noteToVexMap[smoNote.id];
				var position = SmoArticulation.positionToVex[art.position];
				var vexArt = SmoArticulation.articulationToVex[art.articulation];
				var vxArt=new VF.Articulation(vexArt).setPosition(position);
				vx.addArticulation(i,vxArt);
			});
		});		
	}
	
	_renderNoteGlyph(smoNote,textObj) {		
		var x = this.noteToVexMap[smoNote.id].getAbsoluteX();
		// the -3 is copied from vexflow textDynamics
		var y=this.stave.getYForLine(textObj.yOffsetLine-3) + textObj.yOffsetPixels; 
		var group = this.context.openGroup();
        group.classList.add(textObj.id+'-'+smoNote.id);
		group.classList.add(textObj.id);
		textObj.text.split('').forEach((ch)=> {
			const glyphCode = VF.TextDynamics.GLYPHS[ch];
			const glyph=new Vex.Flow.Glyph(glyphCode.code, textObj.fontSize);
			glyph.render(this.context, x, y);
			x += VF.TextDynamics.GLYPHS[ch].width;
		});
		textObj.renderedBox = group.getBoundingClientRect();
		this.context.closeGroup();
	}
	
	renderDynamics() {
		this.smoMeasure.notes.forEach((smoNote) => {
			smoNote.textModifiers.forEach((tm) => {
				this._renderNoteGlyph(smoNote,tm);
			});
		});
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
		this._renderArticulations();
    }

    // ### createVexBeamGroups
    // create the VX beam groups. VexFlow has auto-beaming logic, but we use 
	// our own because the user can specify stem directions, breaks etc.
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

    // ### createVexTuplets
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
	
	handleMeasureModifiers() {
		var sb = this.smoMeasure.getStartBarline();
		var eb = this.smoMeasure.getEndBarline();
		var sym = this.smoMeasure.getRepeatSymbol();

		if (this.smoMeasure.forceClef || sb.barline != SmoBarline.barlines.singleBar) {
		    this.stave.setBegBarType(sb.toVexBarline());
		}
		if (eb.barline != SmoBarline.barlines.singleBar) {
			this.stave.setEndBarType(eb.toVexBarline());
		}
		if (sym && sym.symbol != SmoRepeatSymbol.symbols.None) {
			var rep = new VF.Repetition(sym.toVexSymbol(),sym.xOffset+this.smoMeasure.staffX,sym.yOffset);
			this.stave.modifiers.push(rep);
		}
		
		
		this.smoMeasure.endData.forEach((mod) => {
			var vtype = mod.toVexVolta(this.smoMeasure.measureNumber.measureIndex);
			var vxVolta = new VF.Volta(vtype,mod.number,this.smoMeasure.staffX+mod.xOffsetStart,mod.yOffset);
			this.stave.modifiers.push(vxVolta);
			// this.stave.setVoltaType(vtype,''+mod.number,this.smoMeasure.staffX+mod.xOffsetStart,this.smoMeasure.yOffset);
		});
	}

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);
		
		var key = smoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature,this.smoMeasure.transposeIndex);
		var canceledKey = this.smoMeasure.canceledKeySignature ? smoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature,this.smoMeasure.transposeIndex)
		   : this.smoMeasure.canceledKeySignature;

        // offset for left-hand stuff
        var staffMargin = (this.smoMeasure.forceClef ? 40 : 0)
         + (this.smoMeasure.forceTimeSignature ? 16 : 0)
         + (this.smoMeasure.forceKeySignature ? smoMusic.keySignatureLength[key] * 8 : 0);

		if (this.smoMeasure.forceKeySignature && this.smoMeasure.canceledKeySignature) {
			staffMargin += smoMusic.keySignatureLength[canceledKey]*8;
		}
        var staffWidth = this.smoMeasure.staffWidth;
           + this.smoMeasure.adjX+this.smoMeasure.padRight;
		

        //console.log('measure '+JSON.stringify(this.smoMeasure.measureNumber,null,' ')+' x: ' + this.smoMeasure.staffX + ' y: '+this.smoMeasure.staffY
        // + 'width: '+staffWidth);
        this.stave = new VF.Stave(this.smoMeasure.staffX, this.smoMeasure.staffY, staffWidth);
		
		this.stave.options.space_above_staff_ln=0; // don't let vex place the staff, we want to.
        //console.log('adjX is '+this.smoMeasure.adjX);

        // Add a clef and time signature.
        if (this.smoMeasure.forceClef) {
            this.stave.addClef(this.smoMeasure.clef);
        }
        if (this.smoMeasure.forceKeySignature) {
			var sig = new VF.KeySignature(key);
			if (this.smoMeasure.canceledKeySignature) {
				sig.cancelKey(canceledKey);
			}
            sig.addToStave(this.stave);
        }
        if (this.smoMeasure.forceTimeSignature) {
            this.stave.addTimeSignature(this.smoMeasure.timeSignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context);
		
		this.handleMeasureModifiers();
		this.stave.draw();

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
		
		// Need to format for x position, then set y position before drawing dynamics.
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth-
		    (this.smoMeasure.adjX+this.smoMeasure.padRight));
		
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
		this.renderDynamics();
		this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

        this.context.closeGroup();
        var box = group.getBoundingClientRect();
		var lbox = svgHelpers.clientToLogical(this.context.svg,box);
        this.smoMeasure.renderedBox = {
            x: box.x,
            y: box.y,
            height: box.height,
            width: box.width
        };
		
		var endings = this.smoMeasure.getNthEndings();
		if (endings && endings.length) {
			// We don't know the exact y of nth ending.
			// TODO:  spacing.
			endings[0].renderedBox = {
				x:box.x,y:box.y,height:20,width:box.width
			};
		}
		this.smoMeasure.logicalBox = lbox;
        this.smoMeasure.changed = false;
		
    }
}
