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

    // ## Description:
    // decide whether to force stem direction for multi-voice, or use the default.
    // ## TODO:
    // use x position of ticks in other voices, pitch of note, and consider
    // stem direction modifier.
    applyStemDirection(vxParams,voiceIx) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (voiceIx % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }

	_createAccidentals(smoNote,vexNote,tickIndex,voiceIx) {
        var tickmap = this.smoMeasure.tickmapForVoice(voiceIx);
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
            var accidental = pitch.accidental ? pitch.accidental : 'n';

            // was this accidental declared earlier in the measure?
            var declared = tickmap.getActiveAccidental(pitch,tickIndex,this.smoMeasure.keySignature);

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

    _createOrnaments(smoNote,vexNote) {
        var o  = smoNote.getOrnaments();
        var ix=0;
        o.forEach((ll) => {
            var mod = new VF.Ornament(ll.ornament);
            if (ll.offset === SmoOrnament.offsets.after) {
                mod.setDelayed(true);
            }
            vexNote.addModifier(ix, mod);
            ix += 1;
        });

    }

    _createLyric(smoNote,vexNote) {
        var lyrics = smoNote.getModifiers('SmoLyric');
        var ix = 0;
        lyrics.forEach((ll) => {
            var y = ll.verse*10;
            var vexL = new VF.Annotation(ll.text);
            vexL.setFont(ll.fontInfo.family, ll.fontInfo.size,ll.fontInfo.weight);
            vexL.setYShift(y); // need this?
			vexL.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
            vexNote.addAnnotation(0,vexL);
            const classString = 'lyric lyric-'+ll.verse;
            vexL.addClass(classString);
        });
    }

    _createGraceNotes(smoNote,vexNote) {
        var gar = smoNote.getGraceNotes();
        var toBeam = true;
        if (gar && gar.length) {
            var group = [];
            gar.forEach((g) => {
                var gr = new VF.GraceNote(g.toVexGraceNote());
                for (var i=0;i<g.pitches.length;++i) {
                    var pitch = g.pitches[i];
                    if (pitch.accidental != 'n' || pitch.cautionary)  {
                        var accidental = new VF.Accidental(pitch.accidental);
                        if (pitch.cautionary) {
                            accidental.setAsCautionary();
                        }
                        gr.addAccidental(i,accidental);
                    }
                }
                if (g.tickCount() > 4096) {
                    toBeam = false;
                }
                gr.addClass('grace-note'); // note: this doesn't work :(

                g.renderedId = gr.attrs.id;
                group.push(gr);
            });
            var grace = new VF.GraceNoteGroup(group);
            if (toBeam) {
                grace.beamNotes();
            }

            vexNote.addModifier(0,grace);
        }
    }

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex,voiceIx) {
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

        this.applyStemDirection(noteParams,voiceIx);
        var vexNote = new VF.StaveNote(noteParams);
        vexNote.attrs.classes = 'voice-'+voiceIx;
        if (smoNote.tickCount >= 4096) {
            var stemDirection = smoNote.flagState == SmoNote.flagStates.auto ?
                vexNote.getStemDirection() : smoNote.toVexStemDirection();
            vexNote.setStemDirection(stemDirection);

        }
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?

		this._createAccidentals(smoNote,vexNote,tickIndex,voiceIx);
        this._createLyric(smoNote,vexNote);
        this._createOrnaments(smoNote,vexNote);
        this._createGraceNotes(smoNote,vexNote);

        return vexNote;
    }

	_renderArticulations(vix) {
		var i=0;
		this.smoMeasure.voices[vix].notes.forEach((smoNote) => {
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
		textObj.renderedBox = svgHelpers.smoBox(group.getBoundingClientRect());
		this.context.closeGroup();
	}

	renderDynamics(vix) {
		this.smoMeasure.voices.forEach((voice) => {

            voice.notes.forEach((smoNote) => {
    			var mods = smoNote.textModifiers.filter((mod) => {
    				return mod.attrs.type === 'SmoDynamicText';
    			});
    			mods.forEach((tm) => {
    				this._renderNoteGlyph(smoNote,tm);
    			});
            });
		});
	}


    // ## Description:
    // create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes(voiceIx,active) {
        this.vexNotes = [];
        this.noteToVexMap = {};
        var styles = [{fillStyle:'grey',strokeStyle:'grey'},
         {fillStyle:'rgb(32,128,32)',strokeStyle:'rgb(32,32,32)'},
         {fillStyle:'#222',strokeStyle:'#222'},
         {fillStyle:'#333',strokeStyle:'#333'}];
        var voice =  this.smoMeasure.voices[voiceIx];
        for (var i = 0;
            i < voice.notes.length; ++i) {
            var smoNote = voice.notes[i];
            var vexNote = this._createVexNote(smoNote, i,voiceIx);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            if (active != voiceIx) {
                vexNote.setStyle(styles[voiceIx]);
            }
            this.vexNotes.push(vexNote);
        }
		this._renderArticulations(voiceIx);
    }

    // ### createVexBeamGroups
    // create the VX beam groups. VexFlow has auto-beaming logic, but we use
	// our own because the user can specify stem directions, breaks etc.
    createVexBeamGroups(vix) {
        this.vexBeamGroups = [];
        this.beamToVexMap = {};
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            if (bg.voice != vix) {
                continue;
            }
            var vexNotes = [];
            var stemDirection = VF.Stem.DOWN;
            for (var j = 0;j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                var vexNote = this.noteToVexMap[note.attrs.id]
                    if (j === 0) {
                        stemDirection = note.flagState == SmoNote.flagStates.auto ?
                            vexNote.getStemDirection() : note.toVexStemDirection();
                    }
                    vexNote.setStemDirection(stemDirection);

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
    createVexTuplets(vix) {
        this.vexTuplets = [];
        this.tupletToVexMap = {};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
            if (tp.voice != vix) {
                continue;
            }
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

        // don't create a begin bar for any but the 1st measure.
		if (this.smoMeasure.measureNumber.systemIndex != 0 && sb.barline === SmoBarline.barlines.singleBar
             && this.smoMeasure.padLeft === 0) {
		    this.stave.setBegBarType(VF.Barline.type.NONE);
		} else {
			this.stave.setBegBarType(sb.toVexBarline());
		}
		if (eb.barline != SmoBarline.barlines.singleBar) {
			this.stave.setEndBarType(eb.toVexBarline());
		}
		if (sym && sym.symbol != SmoRepeatSymbol.symbols.None) {
			var rep = new VF.Repetition(sym.toVexSymbol(),sym.xOffset+this.smoMeasure.staffX,sym.yOffset);
			this.stave.modifiers.push(rep);
		}
		var tms = this.smoMeasure.getMeasureText();
		// TODO: set font
		tms.forEach((tm) => {
			/* var vm = new VF.StaveText(tm.text,tm.toVexPosition(),{
				shift_x:tm.adjustX,shift_y:tm.adjustY,justification:tm.toVexJustification()
			});
			vm.setFont(tm.fontInfo);   */
			this.stave.setText(
			    tm.text,tm.toVexPosition(),{
				shift_x:tm.adjustX,shift_y:tm.adjustY,justification:tm.toVexJustification()
			});
			// hack - we can't create staveText directly so this is the only way I could set the font
			var ar = this.stave.getModifiers();
			var vm=ar[ar.length - 1];
			vm.setFont(tm.fontInfo);

		});

        var rm = this.smoMeasure.getRehearsalMark();
        if (rm) {
            this.stave.setSection(rm.symbol,0);
        }

        var tempo = this.smoMeasure.getTempo();
        if (tempo && this.smoMeasure.forceTempo) {
            this.stave.setTempo(tempo.toVexTempo(),tempo.yOffset);
        }

	}

    _setModifierBoxes() {
        this.smoMeasure.voices.forEach((voice) => {
			voice.notes.forEach((smoNote) =>  {
                var el = this.context.svg.getElementById(smoNote.renderId);
				svgHelpers.updateArtifactBox(this.context.svg,el,smoNote);

                // TODO: fix this, only works on the first line.
                smoNote.getModifiers('SmoLyric').forEach((lyric) => {
                    var ar = Array.from(el.getElementsByClassName('vf-lyric'));
                    ar.forEach((lbox) => {
                        svgHelpers.updateArtifactBox(this.context.svg,lbox,lyric);
                    });
                });
                smoNote.graceNotes.forEach((g) => {
                    var gel = this.context.svg.getElementById('vf-'+g.renderedId);
                    $(gel).addClass('grace-note');
                    svgHelpers.updateArtifactBox(this.context.svg,gel,g);
                });
            });
        });
    }

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);
		group.id=this.smoMeasure.attrs.id;

		var key = smoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature,this.smoMeasure.transposeIndex);
		var canceledKey = this.smoMeasure.canceledKeySignature ? smoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature,this.smoMeasure.transposeIndex)
		   : this.smoMeasure.canceledKeySignature;

        var staffX = this.smoMeasure.staffX + this.smoMeasure.padLeft;

        this.stave = new VF.Stave(staffX, this.smoMeasure.staffY + this.smoMeasure.adjY, this.smoMeasure.staffWidth - 1);
        if (this.smoMeasure.prevFrame < VxMeasure.fps) {
            this.smoMeasure.prevFrame += 1;
        }

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

            this.createVexNotes(j,this.smoMeasure.getActiveVoice());
            this.createVexTuplets(j);
            this.createVexBeamGroups(j);

            // Create a voice in 4/4 and add above notes
            var voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                }).setMode(Vex.Flow.Voice.Mode.SOFT);
            voice.addTickables(this.vexNotes);
            voiceAr.push(voice);
        }

		// Need to format for x position, then set y position before drawing dynamics.
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth-
		    (this.smoMeasure.adjX + this.smoMeasure.adjRight));

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
		// this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

        this.context.closeGroup();
        var box = svgHelpers.smoBox(group.getBoundingClientRect());
		var lbox = svgHelpers.smoBox(group.getBBox());
        this.smoMeasure.renderedBox = box;
		this.smoMeasure.logicalBox = lbox;
        this.smoMeasure.changed = false;
		this._setModifierBoxes();
    }
}
