// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoNote}.  Notes have pitches and a duration, and other
 * modifiers that can affect display or playback.
 * @module /smo/data/note
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoNoteModifierBase, SmoArticulation, SmoLyric, SmoGraceNote, SmoMicrotone, SmoOrnament, SmoDynamicText } from './noteModifiers';
import { SmoMusic } from './music';
import { Ticks, Pitch, SmoAttrs, FontInfo, Transposable, PitchLetter, SvgBox } from './common';
const VF = eval('Vex.Flow');

export interface TupletInfo {
  id: string;
}
// @internal
export type NoteType = 'n' | 'r' | '/';
// @internal
export type NoteStringParam = 'noteHead' | 'clef';
// @internal
export const NoteStringParams: NoteStringParam[] = ['noteHead', 'clef'];
// @internal
export type NoteNumberParam = 'beamBeats' | 'flagState';
// @internal
export const NoteNumberParams: NoteNumberParam[] = ['beamBeats', 'flagState'];
// @internal
export type NoteBooleanParam = 'hidden' | 'endBeam' | 'isCue';
// @internal
export const NoteBooleanParams: NoteBooleanParam[] = ['hidden', 'endBeam', 'isCue'];
/**
 * Constructor parameters for a note.  Usually you will call
 * {@link SmoNote.defaults}, and modify the parameters you need to change.
 * @param noteType
 * @param noteHead is non-empty, a Vex notehead code TODO make a record<>
 * @param clef determines how the pitch is placed on the staff
 * @param textModifiers are lyrics, chords, dynamics
 * @param articulations
 * @param graceNotes
 * @param ornaments
 * @param tones
 * @param tuplet tuplet info, if the note is part of a tuplet
 * @param endBeam true if this is the last note in a beam
 * @param fillStyle for special effects, for instance to highlight active voice
 * @param hidden indicates the note (usually a rest) is invisible (transparent)
 * @param beamBeats how many ticks to use before beaming a group
 * @param flagState up down auto
 * @param ticks duration
 * @param pitches SmoPitch array
 * @param isCue tiny notes
 * @category SmoParameters
 */
export interface SmoNoteParams {
  noteType: NoteType,
  noteHead: string,
  clef: string,
  textModifiers: SmoNoteModifierBase[],
  articulations: SmoArticulation[],
  graceNotes: SmoGraceNote[],
  ornaments: SmoOrnament[],
  tones: SmoMicrotone[],
  tuplet: TupletInfo | undefined,
  endBeam: boolean,
  fillStyle: string | null,
  hidden: boolean,
  beamBeats: number,
  flagState: number,
  ticks: Ticks,
  pitches: Pitch[],
  isCue: boolean
}

/**
 * SmoNote contains the pitch and duration of a note or chord.
 * It can also contain arrays of modifiers like lyrics, articulations etc.
 * Also information about the beaming, flag etc.
 * @category SmoObject
 * */
export class SmoNote implements Transposable {
  constructor(params: SmoNoteParams) {
    const defs = SmoNote.defaults;
    NoteStringParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    this.noteType = params.noteType ? params.noteType : defs.noteType;
    NoteNumberParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    NoteBooleanParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defs[param];
    });
    const ticks = params.ticks ? params.ticks : defs.ticks;
    const pitches = params.pitches ? params.pitches : defs.pitches;
    this.ticks = JSON.parse(JSON.stringify(ticks));
    this.pitches = JSON.parse(JSON.stringify(pitches));
    this.clef = params.clef ? params.clef : defs.clef;
    this.fillStyle = params.fillStyle ? params.fillStyle : '';
    if (params.tuplet) {
      this.tuplet = params.tuplet;
    }
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoNote'
    }; // else inherit
  }
  static get flagStates() {
    return { auto: 0, up: 1, down: 2 };
  }
  // Note type and ID
  attrs: SmoAttrs;
  flagState: number = SmoNote.flagStates.auto;
  textModifiers: SmoNoteModifierBase[] = [];
  articulations: SmoArticulation[] = [];
  ornaments: SmoOrnament[] = [];
  pitches: Pitch[] = [];
  noteHead: string = '';
  clef: string = 'treble';
  graceNotes: SmoGraceNote[] = [];
  noteType: NoteType = 'n';
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
  isCue: boolean = false;
  accidentalsRendered: string[] = [];// set by renderer if accidental is to display
  /**
   * used in serialization
   * @internal
   */
  static get parameterArray() {
    return ['ticks', 'pitches', 'noteType', 'tuplet', 'clef',
      'endBeam', 'beamBeats', 'flagState', 'noteHead', 'fillStyle', 'hidden'];
  }
  /**
   * Default constructor parameters.  We always return a copy so the caller can modify it
   */
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
      isCue: false,
      flagState: SmoNote.flagStates.auto,
      ticks: {
        numerator: 4096,
        denominator: 1,
        remainder: 0
      },
      pitches: [{
        letter: 'b',
        octave: 4,
        accidental: 'n'
      }],
    }));
  }
  /**
   * Up, down auto (tri-state)
   */
  toggleFlagState() {
    this.flagState = (this.flagState + 1) % 3;
  }

  // @internal
  toVexStemDirection() {
    return (this.flagState === SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);
  }

  get dots() {
    if (this.isTuplet) {
      return 0;
    }
    const vexDuration = SmoMusic.ticksToDuration[this.tickCount];
    if (!vexDuration) {
      return 0;
    }
    return vexDuration.split('d').length - 1;
  }

  private _addModifier(dynamic: SmoDynamicText, toAdd: boolean) {
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

  private _addArticulation(articulation: SmoArticulation, toAdd: boolean) {
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

  /**
   * Add a new dynamic to thisnote
   * @param dynamic
   */
  addDynamic(dynamic: SmoDynamicText) {
    this._addModifier(dynamic, true);
  }
  /**
   * Remove the dynamic from this note.
   * @param dynamic 
   */
  removeDynamic(dynamic: SmoDynamicText) {
    this._addModifier(dynamic, false);
  }
  /**
   * Get all note modifiers of a type, either a lyric or a dynamic
   * @param type ctor
   * @returns 
   */
  getModifiers(type: string) {
    var ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === type
    );
    return ms;
  }

  /**
   * 
   * @returns the longest lyric, used for formatting
   */
  longestLyric(): SmoLyric | null {
    const tms: SmoNoteModifierBase[] = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric
    );
    if (!tms.length) {
      return null;
    }
    return tms.reduce((m1, m2) =>
      (m1 as SmoLyric).getText().length > (m2 as SmoLyric).getText().length ? m1 : m2
    ) as SmoLyric;
  }
  /** Add a lyric to this note, replacing another in the same verse */
  addLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).parser !== lyric.parser ||
        (mod as SmoLyric).verse !== lyric.verse
    );
    tms.push(lyric);
    this.textModifiers = tms;
  }

  /**
   * @returns array of lyrics that are lyrics
   */
  getTrueLyrics(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.lyric);
    ms.sort((a, b) => (a as SmoLyric).verse - (b as SmoLyric).verse);
    return (ms as SmoLyric[]);
  }
  /**
   * 
   * @returns array of SmoLyric whose parsers are chord
   */
  getChords(): SmoLyric[] {
    const ms = this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === SmoLyric.parsers.chord
    );
    return ms as SmoLyric[];
  }
  /**
   * 
   * @param lyric lyric to remove, find the best match if there are multiples
   */
  removeLyric(lyric: SmoLyric) {
    const tms = this.textModifiers.filter((mod: SmoNoteModifierBase) =>
      mod.attrs.type !== 'SmoLyric' || (mod as SmoLyric).verse !== lyric.verse || (mod as SmoLyric).parser !== lyric.parser
    );
    this.textModifiers = tms;
  }
  /**
   * 
   * @param verse 
   * @param parser 
   * @returns 
   */
  getLyricForVerse(verse: number, parser: number) {
    return this.textModifiers.filter((mod) =>
      mod.attrs.type === 'SmoLyric' && (mod as SmoLyric).parser === parser && (mod as SmoLyric).verse === verse
    );
  }

  /**
   * 
   * @param fontInfo
   */
  setLyricFont(fontInfo: FontInfo) {
    const lyrics = this.getTrueLyrics();

    lyrics.forEach((lyric) => {
      lyric.fontInfo = JSON.parse(JSON.stringify(fontInfo));
    });
  }

  /**
   * @param adjustNoteWidth if true, vex will consider the lyric width when formatting the measure
   */
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

  /**
   * Toggle the ornament up/down/off
   * @param ornament
   */
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

  /**
   * Toggle the ornament up/down/off
   * @param articulation
   */
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

  /**
   * Sort pitches in pitch order, Vex likes to receive pitches in order
   * @param note 
   */
  static sortPitches(note: Transposable) {
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
  /**
   * 
   * @param graceNote
   * @param offset the index from the first grace note
   */
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
  /**
   * Add another pitch to this note at `offset` 1/2 steps
   * @param note
   * @param offset
   */
  static addPitchOffset(note: Transposable, offset: number): void {
    if (note.pitches.length === 0) {
      return;
    }
    note.noteType = 'n';
    const pitch = note.pitches[0];
    note.pitches.push(SmoMusic.getKeyOffset(pitch, offset));
    SmoNote.sortPitches(note);
  }
  /**
   * Add another pitch to this note at `offset` 1/2 steps
   * @param offset
   * @returns 
   */
  addPitchOffset(offset: number) {
    if (this.pitches.length === 0) {
      return;
    }
    this.noteType = 'n';
    const pitch = this.pitches[0];
    this.pitches.push(SmoMusic.getKeyOffset(pitch, offset));
    SmoNote.sortPitches(this);
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
  /**
   * set note opacity on/off
   * @param val
   */
  makeHidden(val: boolean) {
    this.hidden = val;
    this.fillStyle = val ? '#aaaaaa7f' : '';
  }

  /**
   * Return true if this note is part of a tuplet
   */
  get isTuplet(): boolean {
    return this.tuplet !== null && typeof(this.tuplet.id) !== 'undefined';
  }

  addMicrotone(tone: SmoMicrotone) {
    const ar = this.tones.filter((tn: SmoMicrotone) => tn.pitchIndex !== tone.pitchIndex);
    ar.push(tone);
    this.tones = ar;
  }
  removeMicrotone(tone: SmoMicrotone) {
    const ar = this.tones.filter((tn) => tn.pitchIndex !== tone.pitchIndex
      && tn.pitchIndex <= this.pitches.length // also remove tones for removed pitches
      && tone.tone !== tn.tone);
    this.tones = ar;
  }
  getMicrotone(toneIndex: number) {
    return this.tones.find((tn) => tn.pitchIndex === toneIndex);
  }

  getMicrotones() {
    return this.tones;
  }
  /**
   * cycle through the list of enharmonics for this note.
   * @param pitch
   * @returns 
   */
  static toggleEnharmonic(pitch: Pitch) {
    const lastLetter = pitch.letter;
    let vexPitch = SmoMusic.stripVexOctave(SmoMusic.pitchToVexKey(pitch));
    vexPitch = SmoMusic.getEnharmonic(vexPitch);

    pitch.letter = vexPitch[0] as PitchLetter;
    pitch.accidental = vexPitch.length > 1 ?
      vexPitch.substring(1, vexPitch.length) : 'n';
    pitch.octave += SmoMusic.letterChangedOctave(lastLetter, pitch.letter);
    return pitch;
  }
  /**
   * transpose a note or grace note to a key-friendly enharmonic
   * @param pitchArray
   * @param offset
   * @param originalKey - keySignature from original note
   * @param destinationKey - keySignature we are transposing into
   * @returns 
   */
  transpose(pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable {
    return SmoNote.transpose(this, pitchArray, offset, originalKey, destinationKey);
  }
  /**
   * used to add chord and pitch by piano widget
   * @param pitch
   */
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
    SmoNote.sortPitches(this);
  }
  /**
   * @param note note to transpose
   * @param pitchArray an array of indices (not pitches) that indicate which pitches get altered if a chord
   * @param offset in 1/2 step
   * @param originalKey original key for enharmonic-friendly key
   * @param destinationKey destination key signature
   * @returns 
   */
  static transpose(note: Transposable, pitchArray: number[], offset: number, originalKey: string, destinationKey: string): Transposable {
    let index: number = 0;
    let j: number = 0;
    if (offset === 0 && originalKey === destinationKey) {
      return note;
    }
    // If no specific pitch, use all the pitches
    if (pitchArray.length === 0) {
      pitchArray = Array.from(note.pitches.keys());
    }
    for (j = 0; j < pitchArray.length; ++j) {
      index = pitchArray[j];
      if (index + 1 > note.pitches.length) {
        SmoNote.addPitchOffset(note, offset);
      } else {
        const original = JSON.parse(JSON.stringify(note.pitches[index]));
        const pitch = SmoMusic.transposePitchForKey(original, originalKey, destinationKey, offset);
        note.pitches[index] = pitch;
      }
    }
    SmoNote.sortPitches(note);
    return note;
  }
  get tickCount() {
    return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
  }

  /**
   * Copy the note, give it unique id
   * @param note
   * @returns 
   */
  static clone(note: SmoNote) {
    var rv = SmoNote.deserialize(note.serialize());

    // make sure id is unique
    rv.attrs = {
      id: VF.Element.newID(),
      type: 'SmoNote'
    };
    return rv;
  }

  /**
   * @param note
   * @param ticks
   * @returns A note identical to `note` but with different duration
   */
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

  private _serializeModifiers(params: any) {
    params.textModifiers = SmoNote.serializeModifier(this.textModifiers);
    params.graceNotes = SmoNote.serializeModifier(this.graceNotes);
    params.articulations = SmoNote.serializeModifier(this.articulations);
    params.ornaments = SmoNote.serializeModifier(this.ornaments);
    params.tones = SmoNote.serializeModifier(this.tones);
  }
  /**
   * @returns a JSON object that can be used to create this note
   */
  serialize() {
    var params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoNote.defaults, SmoNote.parameterArray, this, params);
    if (params.ticks) {
      params.ticks = JSON.parse(JSON.stringify(params.ticks));
    }
    this._serializeModifiers(params);
    return params;
  }
  /**
   * restore note modifiers and create a SmoNote object
   * @param jsonObj
   * @returns 
   */
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
