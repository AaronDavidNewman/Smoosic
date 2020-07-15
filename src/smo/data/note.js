// ## SmoNote
// ## Description:
// Data for a musical note.  THe most-contained-thing, except there can be note modifiers
// Basic note information.  Leaf node of the SMO dependency tree (so far)
// ## SmoNote Methods
// ---
class SmoNote {
    // ### Description:
    // see defaults for params format.
    constructor(params) {
        Vex.Merge(this, SmoNote.defaults);
        smoSerialize.serializedMerge(SmoNote.parameterArray, params, this);

        // this.keys=JSON.parse(JSON.stringify(this.keys));

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoNote'
            };
        } else {
            // inherit attrs id for deserialized
        }
    }
    static get flagStates() {
        return {auto:0,up:1,down:2};
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef', 'endBeam','beamBeats','flagState','noteHead'];
    }

    toggleFlagState() {
        this.flagState = (this.flagState + 1) % 3;
    }

    toVexStemDirection() {
        return (this.flagState == SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);

    }
    get id() {
        return this.attrs.id;
    }

    get dots() {
        if (this.isTuplet) {
            return 0;
        }
        var vexDuration = smoMusic.ticksToDuration[this.tickCount];
        if (!vexDuration) {
            return 0;
        }
        return vexDuration.split('d').length - 1;
    }

    set dots(value) {
        // ignore - dots are a function of duration only.
    }

    // ### _addModifier
    // ### Description
    // add or remove sFz, mp, etc.
    _addModifier(dynamic, toAdd) {
        var tms = [];
        this.textModifiers.forEach((tm) => {
            if (tm.attrs.type != dynamic.attrs.type) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(dynamic);
        }
        this.textModifiers = tms;
    }

    _addArticulation(articulation, toAdd) {
        var tms = [];
        this.articulations.forEach((tm) => {
            if (tm.articulation != articulation.articulation) {
                tms.push(tm);
            }
        });
        if (toAdd) {
            tms.push(articulation);
        }
        this.articulations = tms;
    }

    addModifier(dynamic) {
        this._addModifier(dynamic, true);
    }
    removeModifier(dynamic) {
        this._addModifier(dynamic, false);
    }
    getModifiers(type) {
        var ms = this.textModifiers.filter((mod)=> {
            return mod.attrs.type === type;
        });
        return ms;
    }

    longestLyric() {
      var tms = this.textModifiers.filter((mod) => {
        return mod.attrs.type == 'SmoLyric' && mod.parser === SmoLyric.parsers.lyric;
      });
      if (!tms.length) {
        return null;
      }
      return tms.reduce((m1,m2) => {
        return m1.text.length > m2.text.length;
      });
    }

  addLyric(lyric) {
    var tms = this.textModifiers.filter((mod) => {
      return mod.attrs.type != 'SmoLyric' || mod.parser !==lyric.parser ||
        mod.verse != lyric.verse;
    });
    tms.push(lyric);
    this.textModifiers = tms;
  }

  getTrueLyrics() {
    var ms = this.textModifiers.filter((mod)=> {
      return mod.attrs.type === 'SmoLyric' && mod.parser === SmoLyric.parsers.lyric;
    });
    return ms;
  }


  removeLyric(lyric) {
    var tms = this.textModifiers.filter((mod) => {
      return mod.attrs.type != 'SmoLyric' || mod.verse != lyric.verse || mod.parser != lyric.parser;
    });
    this.textModifiers = tms;
  }

  getLyricForVerse(verse,parser) {
      return this.textModifiers.filter((mod) => {
        return mod.attrs.type == 'SmoLyric' && mod.parser === parser && mod.verse === verse;
      });
  }

  getOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz() === false);
  }

  getJazzOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz());
  }

  toggleOrnament(ornament) {
    var aix = this.ornaments.filter((a) => {
      return a.attrs.type === 'SmoOrnament' && a.ornament === ornament.ornament;
    });
    if (!aix.length) {
      this.ornaments.push(ornament);
    } else {
      this.ornaments=[];
    }
  }

    // Toggle between articulation above, below, or remove
    toggleArticulation(articulation) {
        var aix = this.articulations.findIndex((a) => {
                return a.articulation === articulation.articulation;
            });
        if (aix >= 0) {
            var cur = this.articulations[aix];
            if (cur.position == SmoArticulation.positions.above) {
                cur.position = SmoArticulation.positions.below;
                return;
            }
            else {
                this._addArticulation(articulation,false);
                return;
            }
        }
        this._addArticulation(articulation, true);
    }

    static _sortPitches(note) {
        var canon = VF.Music.canonical_notes;
        var keyIndex = ((pitch) => {
            return canon.indexOf(pitch.letter) + pitch.octave * 12;
        });
        note.pitches.sort((a, b) => {
            return keyIndex(a) - keyIndex(b);
        });
    }
    setNoteHead(noteHead) {
      if (this.noteHead === noteHead) {
        this.noteHead = '';
      } else {
        this.noteHead = noteHead;
      }
    }
    addGraceNote(params,offset) {
        params.clef = this.clef;
        if (this.graceNotes.length > offset) {
            this.graceNotes[offset]= new SmoGraceNote(params);
        } else {
            this.graceNotes.push(new SmoGraceNote(params));
        }
    }
    removeGraceNote(offset) {
        if (offset >= this.graceNotes.length) {
            return;
        }
        this.graceNotes.splice(offset,1);
    }
    getGraceNotes() {
        return this.graceNotes;
    }
    addPitchOffset(offset) {
      if (this.pitches.length == 0) {
          return this;
      }
      this.noteType = 'n';
      var pitch = this.pitches[0];
      this.pitches.push(smoMusic.getKeyOffset(pitch, offset));

      SmoNote._sortPitches(this);
    }

    makeRest() {
        this.noteType = (this.noteType == 'r' ? 'n' : 'r');
    }

    makeNote() {
        this.noteType = 'n';
    }

    get isTuplet() {
        return this['tuplet'] && this.tuplet['id'];
    }

    addMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch);
        ar.push(tone);
        this.tones = ar;
    }
    removeMicrotone(tone) {
        var ar = this.tones.filter((tn) => tn.pitch != tone.pitch
            && tone.tone != tn.tone);
        this.tones = ar;
    }

    getMicrotones() {
        return this.tones;
    }

    transpose(pitchArray, offset, keySignature) {
        return SmoNote._transpose(this,pitchArray,offset,keySignature);
    }
    static _transpose(note,pitchArray, offset, keySignature) {
        var pitches = [];
        note.noteType = 'n';
        if (pitchArray.length == 0) {
            note.pitches.forEach((m) => {
                pitchArray.push(note.pitches.indexOf(m));
            });
        }
        for (var j = 0; j < pitchArray.length; ++j) {
            var index = pitchArray[j];
            if (index + 1 > note.pitches.length) {
                note.addPitchOffset(offset);
            } else {
                var pitch = smoMusic.getKeyOffset(note.pitches[index], offset);
                if (keySignature) {
                    var letterKey = pitch.letter + pitch.accidental;
                    letterKey = smoMusic.getKeyFriendlyEnharmonic(letterKey, keySignature);
                    pitch.letter = letterKey[0];
                    if (letterKey.length < 2) {
                        pitch.accidental = 'n';
                    } else {
                        pitch.accidental = letterKey.substring(1);
                    }
                }
                note.pitches[index] = pitch;
            }
        }
        SmoNote._sortPitches(note);
        return note;
    }
    get tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    describe() {
        return this.attrs.id + ' ' + this.tickCount;
    }

    static clone(note) {
        var rv = SmoNote.deserialize(note.serialize());

        // make sure id is unique
        rv.attrs = {
            id: VF.Element.newID(),
            type: 'SmoNote'
        };
        return rv;
    }

    // ## Description:
    // Clone the note, but use the different duration.  Changes the length
    // of the note but nothing else.
    static cloneWithDuration(note, ticks) {
        if (typeof(ticks) === 'number') {
            ticks = {numerator:ticks,denominator:1,remainder:0};
        }
        var rv = SmoNote.clone(note);

        rv.ticks = ticks;

        return rv;
    }

    _serializeModifiers(params) {
        ['textModifiers','graceNotes','articulations','ornaments','tones'].forEach((attr) => {
            if (this[attr] && this[attr].length) {
                params[attr] = [];
                this[attr].forEach((mod) => {
                    params[attr].push(mod.serialize());
                });
            }
        });
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoNote.defaults,SmoNote.parameterArray, this, params);
        if (params.ticks) {
            params.ticks = JSON.parse(JSON.stringify(params.ticks));
        }
        this._serializeModifiers(params);
        return params;
    }

    static get defaults() {
        return {
            noteType: 'n',
            noteHead: 'n',
            textModifiers: [],
            articulations: [],
            graceNotes:[],
            ornaments:[],
            tones:[],
            endBeam: false,
            beamBeats:4096,
            flagState:SmoNote.flagStates.auto,
            ticks: {
                numerator: 4096,
                denominator: 1,
                remainder: 0
            },
            pitches: [{
                    letter: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
        }
    }
    static deserialize(jsonObj) {
        var note = new SmoNote(jsonObj);
        ['textModifiers','graceNotes','ornaments','articulations','tones'].forEach((attr) =>
        {
            if (!jsonObj[attr]) {
                note[attr] = [];
            } else {
                jsonObj[attr].forEach((mod) => {
                    note[attr].push(SmoNoteModifierBase.deserialize(mod));
                });
            }
        });
        // Due to a bug, text modifiers were serialized into noteModifiers array
        if (jsonObj.noteModifiers) {
            jsonObj.noteModifiers.forEach((mod) => {
                note.textModifiers.push(mod);
            });
        }

        return note;
    }
}

class SmoBeamGroup {
    constructor(params) {
        this.notes = params.notes;
        Vex.Merge(this, params);

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoBeamGroup'
            };
        } else {
        }
        for (var i = 0; i < this.notes.length; ++i) {
            var note = this.notes[i];
            if (note.tickCount < 4096)
                note.beam_group = this.attrs;
        }
    }
}
