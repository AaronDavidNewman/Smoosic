// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoNoteModifierBase, SmoArticulation, SmoLyric, SmoGraceNote, SmoMicrotone, SmoOrnament } from './noteModifiers';
import { smoMusic } from '../../common/musicHelpers';
import { Ticks, Pitch, SmoAttrs, FontInfo, Transposable, PitchLetter, SvgBox } from './common';
const VF = eval('Vex.Flow');

export interface TupletInfo {
  id: string;
}
export interface SmoNoteParams {
  noteType: string,
  noteHead: string,
  clef: string,
  textModifiers: SmoNoteModifierBase[],
  articulations: SmoArticulation[],
  graceNotes: SmoGraceNote[],
  ornaments: SmoGraceNote[],
  tones: SmoMicrotone[],
  endBeam: boolean,
  fillStyle: string | null,
  hidden: boolean,
  beamBeats: number,
  flagState: number,
  ticks: Ticks,
  pitches: Pitch[],
}

// ## SmoNote
// ## Description:
// Data for a musical note.  THe most-contained-thing, except there can be note modifiers
// Basic note information.  Leaf node of the SMO dependency tree (so far)
// ## SmoNote Methods
// ---
export class SmoNote implements Transposable {
  // ### Description:
  // see defaults for params format.
  constructor(params: SmoNoteParams) {
    smoSerialize.serializedMerge(SmoNote.parameterArray, params, this);
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoNote'
    }; // else inherit
  }
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  attrs: SmoAttrs;
  flagState: number = SmoNote.flagStates.auto;
  textModifiers: SmoNoteModifierBase[] = [];
  articulations: SmoArticulation[] = [];
  ornaments: SmoOrnament[] = [];
  pitches: Pitch[] = [];
  noteHead: string = '';
  clef: string = 'treble';
  graceNotes: SmoGraceNote[] = [];
  noteType: string = 'n';
  fillStyle: string = '';
  hidden: boolean = false;
  tuplet: TupletInfo | null = null;
  tones: SmoMicrotone[] = [];
  endBeam: boolean = false;
  ticks: Ticks = { numerator: 4096, denominator: 1, remainder: 0 };
  beamBeats: number = 4096;
  beam_group: SmoAttrs | null = null;
  renderId: string | null = null;
  keySignature: string = 'c';
  logicalBox: SvgBox | null = null;
  renderedBox: SvgBox | null = null;
  accidentalsRendered: string[] = [];// set by renderer if accidental is to display

  static get parameterArray() {
    return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef',
      'endBeam', 'beamBeats', 'flagState', 'noteHead', 'fillStyle', 'hidden'];
  }
  static get defaults(): SmoNoteParams {
    return JSON.parse(JSON.stringify({
      noteType: 'n',
      noteHead: 'n',
      clef: 'treble',
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
    }));
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
  _addModifier(dynamic: SmoNoteModifierBase, toAdd: boolean) {
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

  _addArticulation(articulation: SmoArticulation, toAdd: boolean) {
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

  addModifier(dynamic: SmoNoteModifierBase) {
    this._addModifier(dynamic, true);
  }
  removeModifier(dynamic: SmoNoteModifierBase) {
    this._addModifier(dynamic, false);
  }
  getModifiers(type: string) {
    var ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === type
    );
    return ms;
  }

  longestLyric() {
    const tms: SmoNoteModifierBase[] = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric
    );
    if (!tms.length) {
      return null;
    }
    return tms.reduce((m1, m2) =>
      (m1 as SmoLyric).getText().length > (m2 as SmoLyric).getText().length ? m1 : m2
    );
  }

  addLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).parser !== lyric.parser ||
        (mod as SmoLyric).verse !== lyric.verse
    );
    tms.push(lyric);
    this.textModifiers = tms;
  }

  getTrueLyrics(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric);
    ms.sort((a, b) => (a as SmoLyric).verse - (b as SmoLyric).verse);
    return (ms as SmoLyric[]);
  }

  getChords(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.chord
    );
    return ms as SmoLyric[];
  }

  removeLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).verse !== lyric.verse || (mod as SmoLyric).parser !== lyric.parser
    );
    this.textModifiers = tms;
  }

  getLyricForVerse(verse: number, parser: number) {
    return this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === parser && (mod as SmoLyric).verse === verse
    );
  }

  // ### setLyricFont
  // Lyric font is score-wide, so we set all lyrics to the same thing.
  setLyricFont(fontInfo: FontInfo) {
    const lyrics = this.getTrueLyrics();

    lyrics.forEach((lyric) => {
      lyric.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  // ### setLyricFont
  // Set whether we ajust note width for lyrics, a scope-wide setting.
  setLyricAdjustWidth(adjustNoteWidth: boolean) {
    const lyrics = this.getTrueLyrics();
    lyrics.forEach((lyric) => {
      lyric.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordAdjustWidth(adjustNoteWidth: boolean) {
    const chords = this.getChords();
    chords.forEach((chord) => {
      chord.adjustNoteWidth = adjustNoteWidth;
    });
  }

  setChordFont(fontInfo: FontInfo) {
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

  toggleOrnament(ornament: SmoOrnament) {
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
  toggleArticulation(articulation: SmoArticulation) {
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

  static _sortPitches(note: Transposable) {
    const canon = VF.Music.canonical_notes;
    const keyIndex = ((pitch: Pitch) =>
      canon.indexOf(pitch.letter) + pitch.octave * 12
    );
    note.pitches.sort((a, b) => keyIndex(a) - keyIndex(b));
  }
  setNoteHead(noteHead: string) {
    if (this.noteHead === noteHead) {
      this.noteHead = '';
    } else {
      this.noteHead = noteHead;
    }
  }
  addGraceNote(graceNote: SmoGraceNote, offset: number) {
    if (typeof(offset) === 'undefined') {
      offset = 0;
    }
    graceNote.clef = this.clef;
    this.graceNotes.push(graceNote);
  }
  removeGraceNote(offset: number) {
    if (offset >= this.graceNotes.length) {
      return;
    }
    this.graceNotes.splice(offset, 1);
  }
  getGraceNotes() {
    return this.graceNotes;
  }
  static addPitchOffset(note: Transposable, offset: number) {
    if (note.pitches.length === 0) {
      return;
    }
    note.noteType = 'n';
    const pitch = note.pitches[0];
    note.pitches.push(smoMusic.getKeyOffset(pitch, offset));
    SmoNote._sortPitches(note);
  }
  addPitchOffset(offset: number) {
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
  toggleSlash() {
    this.noteType = (this.noteType === '/' ? 'n' : '/');
  }
  makeSlash() {
    this.noteType = '/';
  }
  makeRest() {
    this.noteType = 'r';
  }
  isRest() {
    return this.noteType === 'r';
  }
  isSlash() {
    return this.noteType === '/';
  }

  makeNote() {
    this.noteType = 'n';
    // clear fill style if we were hiding rests
    this.fillStyle = '';
    this.hidden = false;
  }
  makeHidden(val: boolean) {
    this.hidden = val;
    this.fillStyle = val ? '#aaaaaa7f' : '';
  }

  get isTuplet(): boolean {
    return this.tuplet !== null && this.tuplet.id !== null;
  }

  addMicrotone(tone: SmoMicrotone) {
    const ar = this.tones.filter((tn: SmoMicrotone) => tn.pitch !== tone.pitch);
    ar.push(tone);
    this.tones = ar;
  }
  removeMicrotone(tone: SmoMicrotone) {
    const ar = this.tones.filter((tn) => tn.pitch !== tone.pitch
      && tone.tone !== tn.tone);
    this.tones = ar;
  }

  getMicrotones() {
    return this.tones;
  }
  static toggleEnharmonic(pitch: Pitch) {
    const lastLetter = pitch.letter;
    let vexPitch = smoMusic.stripVexOctave(smoMusic.pitchToVexKey(pitch));
    vexPitch = smoMusic.getEnharmonic(vexPitch);

    pitch.letter = vexPitch[0] as PitchLetter;
    pitch.accidental = vexPitch.length > 1 ?
      vexPitch.substring(1, vexPitch.length) : 'n';
    pitch.octave += smoMusic.letterChangedOctave(lastLetter, pitch.letter);
    return pitch;
  }

  transpose(pitchArray: number[], offset: number, keySignature: string) {
    return SmoNote._transpose(this, pitchArray, offset, keySignature);
  }
  // ### addPitch
  // used to add chord and pitch by piano widget
  toggleAddPitch(pitch: Pitch) {
    const pitches: Pitch[] = [];
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
  static _transpose(note: Transposable, pitchArray:number[], offset: number, keySignature: string) {
    let index: number = 0;
    let j: number = 0;
    let letterKey: string = 'a';
    note.noteType = 'n';
    if (pitchArray.length === 0) {
      note.pitches.forEach((m) => {
        pitchArray.push(note.pitches.indexOf(m));
      });
    }
    for (j = 0; j < pitchArray.length; ++j) {
      index = pitchArray[j];
      if (index + 1 > note.pitches.length) {
        SmoNote.addPitchOffset(note, offset);
      } else {
        const pitch = smoMusic.getKeyOffset(note.pitches[index], offset);
        if (keySignature) {
          letterKey = pitch.letter + pitch.accidental;
          letterKey = smoMusic.getKeyFriendlyEnharmonic(letterKey, keySignature);
          pitch.letter = letterKey[0] as PitchLetter;
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

  static clone(note: SmoNote) {
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
  static cloneWithDuration(note: SmoNote, ticks: Ticks | number) {
    if (typeof(ticks) === 'number') {
      ticks = { numerator: ticks, denominator: 1, remainder: 0 };
    }
    const rv = SmoNote.clone(note);
    rv.ticks = ticks;
    return rv;
  }
  static serializeModifier(modifiers: SmoNoteModifierBase[]) : object[] {
    const rv: object[] = [];
    modifiers.forEach((modifier: SmoNoteModifierBase) => {
      rv.push(modifier.serialize());
    });
    return rv;
  }

  _serializeModifiers(params: any) {
    params.textModifiers = SmoNote.serializeModifier(this.textModifiers);
    params.graceNotes = SmoNote.serializeModifier(this.graceNotes);
    params.articulations = SmoNote.serializeModifier(this.articulations);
    params.ornaments = SmoNote.serializeModifier(this.ornaments);
    params.tones = SmoNote.serializeModifier(this.tones);
  }
  serialize() {
    var params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoNote.defaults, SmoNote.parameterArray, this, params);
    if (params.ticks) {
      params.ticks = JSON.parse(JSON.stringify(params.ticks));
    }
    this._serializeModifiers(params);
    return params;
  }

  static deserialize(jsonObj: any) {
    var note = new SmoNote(jsonObj);
    if (jsonObj.textModifiers) {
      jsonObj.textModifiers.forEach((mod: any) => {
        note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.graceNotes) {
      jsonObj.graceNotes.forEach((mod: any) => {
        note.graceNotes.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.ornaments) {
      jsonObj.ornaments.forEach((mod: any) => {
        note.ornaments.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.articulations) {
      jsonObj.articulations.forEach((mod: any) => {
        note.articulations.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    if (jsonObj.tones) {
      jsonObj.tones.forEach((mod: any) => {
        note.tones.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    // Due to a bug, text modifiers were serialized into noteModifiers array
    if (jsonObj.noteModifiers) {
      jsonObj.noteModifiers.forEach((mod: any) => {
        note.textModifiers.push(SmoNoteModifierBase.deserialize(mod));
      });
    }
    return note;
  }
}
