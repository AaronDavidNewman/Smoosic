// ## SmoNote
// ## Description:
// Data for a musical note.  THe most-contained-thing, except there can be note modifiers
// Basic note information.  Leaf node of the SMO dependency tree (so far)
// ## SmoNote Methods
// ---
// eslint-disable-next-line no-unused-vars
class SmoNote {
  // ### Description:
  // see defaults for params format.
  constructor(params) {
    Vex.Merge(this, SmoNote.defaults);
    smoSerialize.serializedMerge(SmoNote.parameterArray, params, this);
    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoNote'
      };
    } // else inherit
  }
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  static get parameterArray() {
    return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef',
      'endBeam', 'beamBeats', 'flagState', 'noteHead', 'fillStyle', 'hidden'];
  }

  toggleFlagState() {
    this.flagState = (this.flagState + 1) % 3;
  }

  toVexStemDirection() {
    return (this.flagState === SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);
  }
  get id() {
    return this.attrs.id;
  }

  get dots() {
    if (this.isTuplet) {
      return 0;
    }
    const vexDuration = smoMusic.ticksToDuration[this.tickCount];
    if (!vexDuration) {
      return 0;
    }
    return vexDuration.split('d').length - 1;
  }

  // ### _addModifier
  // ### Description
  // add or remove sFz, mp, etc.
  _addModifier(dynamic, toAdd) {
    var tms = [];
    this.textModifiers.forEach((tm) => {
      if (tm.attrs.type !== dynamic.attrs.type) {
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
      if (tm.articulation !== articulation.articulation) {
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
    var ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === type
    );
    return ms;
  }

  longestLyric() {
    const tms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && mod.parser === SmoLyric.parsers.lyric
    );
    if (!tms.length) {
      return null;
    }
    return tms.reduce((m1, m2) =>
      m1.getText().length > m2.getText().length ? m1 : m2
    );
  }

  addLyric(lyric) {
    const tms = this.textModifiers.filter((mod) =>
      mod.attrs.type !== 'SmoLyric' || mod.parser !== lyric.parser ||
        mod.verse !== lyric.verse
    );
    tms.push(lyric);
    this.textModifiers = tms;
  }

  getTrueLyrics() {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && mod.parser === SmoLyric.parsers.lyric);
    ms.sort((a, b) => a.verse - b.verse);
    return ms;
  }

  getChords() {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && mod.parser === SmoLyric.parsers.chord
    );
    return ms;
  }

  removeLyric(lyric) {
    const tms = this.textModifiers.filter((mod) =>
      mod.attrs.type !== 'SmoLyric' || mod.verse !== lyric.verse || mod.parser !== lyric.parser
    );
    this.textModifiers = tms;
  }

  getLyricForVerse(verse, parser) {
    return this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && mod.parser === parser && mod.verse === verse
    );
  }

  // ### setLyricFont
  // Lyric font is score-wide, so we set all lyrics to the same thing.
  setLyricFont(fontInfo) {
    const lyrics = this.getTrueLyrics();

    lyrics.forEach((lyric) => {
      lyric.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  // ### setLyricFont
  // Set whether we ajust note width for lyrics, a scope-wide setting.
  setLyricAdjustWidth(adjustNoteWidth) {
    const lyrics = this.getTrueLyrics();
    lyrics.forEach((lyric) => {
      lyric.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordAdjustWidth(adjustNoteWidth) {
    const chords = this.getChords();
    chords.forEach((chord) => {
      chord.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordFont(fontInfo) {
    const chords = this.getChords();
    chords.forEach((chord) => {
      chord.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  getOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz() === false);
  }

  getJazzOrnaments() {
    return this.ornaments.filter((oo) => oo.isJazz());
  }

  toggleOrnament(ornament) {
    const aix = this.ornaments.filter((a) =>
      a.attrs.type === 'SmoOrnament' && a.ornament === ornament.ornament
    );
    if (!aix.length) {
      this.ornaments.push(ornament);
    } else {
      this.ornaments = [];
    }
  }

  // Toggle between articulation above, below, or remove
  toggleArticulation(articulation) {
    var aix = this.articulations.findIndex((a) =>
      a.articulation === articulation.articulation
    );
    if (aix >= 0) {
      const cur = this.articulations[aix];
      if (cur.position === SmoArticulation.positions.above) {
        cur.position = SmoArticulation.positions.below;
        return;
      } else {
        this._addArticulation(articulation, false);
        return;
      }
    }
    this._addArticulation(articulation, true);
  }

  static _sortPitches(note) {
    const canon = VF.Music.canonical_notes;
    const keyIndex = ((pitch) =>
      canon.indexOf(pitch.letter) + pitch.octave * 12
    );
    note.pitches.sort((a, b) => keyIndex(a) - keyIndex(b));
  }
  setNoteHead(noteHead) {
    if (this.noteHead === noteHead) {
      this.noteHead = '';
    } else {
      this.noteHead = noteHead;
    }
  }
  addGraceNote(graceNote, offset) {
    if (typeof(offset) === 'undefined') {
      offset = 0;
    }
    graceNote.clef = this.clef;
    this.graceNotes.push(graceNote);
  }
  removeGraceNote(offset) {
    if (offset >= this.graceNotes.length) {
      return;
    }
    this.graceNotes.splice(offset, 1);
  }
  getGraceNotes() {
    return this.graceNotes;
  }
  addPitchOffset(offset) {
    if (this.pitches.length === 0) {
      return;
    }
    this.noteType = 'n';
    const pitch = this.pitches[0];
    this.pitches.push(smoMusic.getKeyOffset(pitch, offset));
    SmoNote._sortPitches(this);
  }
  toggleRest() {
    this.noteType = (this.noteType === 'r' ? 'n' : 'r');
  }

  makeRest() {
    this.noteType = 'r';
  }
  isRest() {
    return this.noteType === 'r';
  }

  makeNote() {
    this.noteType = 'n';
    // clear fill style if we were hiding rests
    this.fillStyle = '';
    this.hidden = false;
  }
  makeHidden(val) {
    this.hidden = val;
    this.fillStyle = val ? '#aaaaaa7f' : '';
  }

  get isTuplet() {
    return this.tuplet && this.tuplet.id;
  }

  addMicrotone(tone) {
    const ar = this.tones.filter((tn) => tn.pitch !== tone.pitch);
    ar.push(tone);
    this.tones = ar;
  }
  removeMicrotone(tone) {
    const ar = this.tones.filter((tn) => tn.pitch !== tone.pitch
      && tone.tone !== tn.tone);
    this.tones = ar;
  }

  getMicrotones() {
    return this.tones;
  }
  static toggleEnharmonic(pitch) {
    const lastLetter = pitch.letter;
    let vexPitch = smoMusic.stripVexOctave(smoMusic.pitchToVexKey(pitch));
    vexPitch = smoMusic.getEnharmonic(vexPitch);

    pitch.letter = vexPitch[0];
    pitch.accidental = vexPitch.length > 1 ?
      vexPitch.substring(1, vexPitch.length) : 'n';
    pitch.octave += smoMusic.letterChangedOctave(lastLetter, pitch.letter);
    return pitch;
  }

  transpose(pitchArray, offset, keySignature) {
    return SmoNote._transpose(this, pitchArray, offset, keySignature);
  }
  // ### addPitch
  // used to add chord and pitch by piano widget
  toggleAddPitch(pitch) {
    const pitches = [];
    let exists = false;
    this.pitches.forEach((o) => {
      if (o.letter !== pitch.letter ||
        o.octave !== pitch.octave ||
        o.accidental !== pitch.accidental) {
        pitches.push(o);
      } else {
        exists = true;
      }
    });
    this.pitches = pitches;
    if (!exists) {
      this.pitches.push(JSON.parse(JSON.stringify(pitch)));
      this.noteType = 'n';
    }
    SmoNote._sortPitches(this);
  }
  static _transpose(note, pitchArray, offset, keySignature) {
    let index = 0;
    let j = 0;
    let letterKey = 'a';
    note.noteType = 'n';
    if (pitchArray.length === 0) {
      note.pitches.forEach((m) => {
        pitchArray.push(note.pitches.indexOf(m));
      });
    }
    for (j = 0; j < pitchArray.length; ++j) {
      index = pitchArray[j];
      if (index + 1 > note.pitches.length) {
        note.addPitchOffset(offset);
      } else {
        const pitch = smoMusic.getKeyOffset(note.pitches[index], offset);
        if (keySignature) {
          letterKey = pitch.letter + pitch.accidental;
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
      ticks = { numerator: ticks, denominator: 1, remainder: 0 };
    }
    const rv = SmoNote.clone(note);
    rv.ticks = ticks;
    return rv;
  }

  _serializeModifiers(params) {
    ['textModifiers', 'graceNotes', 'articulations', 'ornaments', 'tones'].forEach((attr) => {
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
    smoSerialize.serializedMergeNonDefault(SmoNote.defaults, SmoNote.parameterArray, this, params);
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
      graceNotes: [],
      ornaments: [],
      tones: [],
      endBeam: false,
      fillStyle: '',
      hidden: false,
      beamBeats: 4096,
      flagState: SmoNote.flagStates.auto,
      ticks: {
        numerator: 4096,
        denominator: 1,
        remainder: 0
      },
      pitches: [{
        letter: 'b',
        octave: 4,
        accidental: ''
      }],
    };
  }
  static deserialize(jsonObj) {
    var note = new SmoNote(jsonObj);
    ['textModifiers', 'graceNotes', 'ornaments', 'articulations', 'tones'].forEach((attr) => {
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

// eslint-disable-next-line no-unused-vars
class SmoBeamGroup {
  constructor(params) {
    let i = 0;
    this.notes = params.notes;
    Vex.Merge(this, params);

    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoBeamGroup'
      };
    }
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      if (note.tickCount < 4096) {
        note.beam_group = this.attrs;
      }
    }
  }
}
