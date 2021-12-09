/**
 * shared music theory and audio frequency routines, helper functions etc.
 * @module /smo/data/music
 */

// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoNote } from './note';
import { Pitch, PitchKey, Clef, PitchLetter } from './common';
import { SmoMicrotone } from './noteModifiers';

/**
 * Used for xml clef conversion
 */
export interface ClefSign {
  sign: string,
  line?: number,
  octave?: number
}
/**
 * calculate the pitch frequency, just temperment a=440, etc.
 * @category SmoUtilities
 */
export class SmoAudioPitch {
  // ### _frequencies
  // Compute the equal-temperment frequencies of the notes.
  static _computeFrequencies() {
    const map: Record<string, number> = {};
    let lix = 0;
    const octaves = [1, 2, 3, 4, 5, 6, 7];
    const letters = ['cn', 'c#', 'dn', 'd#', 'en', 'fn', 'f#', 'gn', 'g#', 'an', 'a#', 'bn'];

    const just = Math.pow(2, (1.0 / 12));
    const baseFrequency = (440 / 16) * Math.pow(just, 3);

    octaves.forEach((octave) => {
      const base = baseFrequency * Math.pow(2, octave - 1);
      lix = 0;
      letters.forEach((letter) => {
        const freq = base * Math.pow(just, lix);
        var enharmonics = SmoMusic.getEnharmonics(letter);
        enharmonics.forEach((en) => {
          // Adjust for B4 higher than C4
          const adjOctave = (letter[0] === 'b' && en[0] === 'c') ?
            octave + 1 : octave;
          map[en + adjOctave.toString()] = freq;
        });
        lix += 1;
      });
    });

    return map;
  }
  static frequencies: Record<string, number> | null = null;

  static get pitchFrequencyMap() {
    if (!SmoAudioPitch.frequencies) {
      SmoAudioPitch.frequencies = SmoAudioPitch._computeFrequencies();
    }

    return SmoAudioPitch.frequencies;
  }

  static _rawPitchToFrequency(smoPitch: Pitch, offset: number): number {
    const npitch = SmoMusic.smoIntToPitch(SmoMusic.smoPitchToInt(smoPitch) + offset);
    const vx = npitch.letter.toLowerCase() + npitch.accidental + npitch.octave.toString();
    return SmoAudioPitch.pitchFrequencyMap[vx];
  }
  /**
   * 
   * @param smoPitch - pitch from the SMO object
   * @param offset - transpose 1/2 steps, 0 means no transpose
   * @param tone - optional transpose microtone
   * @returns 
   */
  static smoPitchToFrequency(smoPitch: Pitch, offset: number, tone: SmoMicrotone | null) {
    let pitchInt = 0;
    let rv = SmoAudioPitch._rawPitchToFrequency(smoPitch, offset);
    if (tone) {
      const coeff = tone.toPitchCoeff;
      pitchInt = SmoMusic.smoPitchToInt(smoPitch);
      pitchInt += (coeff > 0) ? 1 : -1;
      const otherSmo = SmoMusic.smoIntToPitch(pitchInt);
      const otherPitch = SmoAudioPitch._rawPitchToFrequency(otherSmo, offset);
      rv += Math.abs(rv - otherPitch) * coeff;
    }
    return rv;
  }
}

const VF = eval('Vex.Flow');
export interface VexNoteValue {
  root_index: number,
  int_val: number
}
/**
 * Helper functions that build on the VX music theory routines, and other
 * utilities I wish were in VF.Music but aren't
 * ## Note on pitch and duration format
 * We use some VEX music theory routines and frequently need to convert
 * formats from SMO format.  We also use the same 'ticks' abstraction for
 * durations.
 * 
 * `Smo` uses pitch JSON:
 * ```javascript
 *     {note:'c',accidental:'#',octave:4}
 * ```
 * 
 * `Vex` usually uses a canonical string:
 * 
 *     `'c#/4'`
 * 
 * Depending on the operation, the octave might be omitted
 * 
 * `Smo` uses a JSON for duration always:
 * ```javascript
 *     {numerator:4096,denominator:1,remainder:0}
 * ```
 * `Vex` uses a letter duration (`'4'` or `'q'`for 1/4 note) and `'d'` for dot.
 * 
 * I try to indicate whether I am using vex or smo notation in the function name.
 * Duration methods start around line 1100
 * @category SmoUtilities
 */
export class SmoMusic {
  /**
   * Ported from vex, used to convert pitches to numerical values
   * */
  static get noteValues(): Record<string, VexNoteValue> {
    return {
      c: { root_index: 0, int_val: 0 },
      cn: { root_index: 0, int_val: 0 },
      'c#': { root_index: 0, int_val: 1 },
      'c##': { root_index: 0, int_val: 2 },
      cb: { root_index: 0, int_val: 11 },
      cbb: { root_index: 0, int_val: 10 },
      d: { root_index: 1, int_val: 2 },
      dn: { root_index: 1, int_val: 2 },
      'd#': { root_index: 1, int_val: 3 },
      'd##': { root_index: 1, int_val: 4 },
      db: { root_index: 1, int_val: 1 },
      dbb: { root_index: 1, int_val: 0 },
      e: { root_index: 2, int_val: 4 },
      en: { root_index: 2, int_val: 4 },
      'e#': { root_index: 2, int_val: 5 },
      'e##': { root_index: 2, int_val: 6 },
      eb: { root_index: 2, int_val: 3 },
      ebb: { root_index: 2, int_val: 2 },
      f: { root_index: 3, int_val: 5 },
      fn: { root_index: 3, int_val: 5 },
      'f#': { root_index: 3, int_val: 6 },
      'f##': { root_index: 3, int_val: 7 },
      fb: { root_index: 3, int_val: 4 },
      fbb: { root_index: 3, int_val: 3 },
      g: { root_index: 4, int_val: 7 },
      gn: { root_index: 4, int_val: 7 },
      'g#': { root_index: 4, int_val: 8 },
      'g##': { root_index: 4, int_val: 9 },
      gb: { root_index: 4, int_val: 6 },
      gbb: { root_index: 4, int_val: 5 },
      a: { root_index: 5, int_val: 9 },
      an: { root_index: 5, int_val: 9 },
      'a#': { root_index: 5, int_val: 10 },
      'a##': { root_index: 5, int_val: 11 },
      ab: { root_index: 5, int_val: 8 },
      abb: { root_index: 5, int_val: 7 },
      b: { root_index: 6, int_val: 11 },
      bn: { root_index: 6, int_val: 11 },
      'b#': { root_index: 6, int_val: 0 },
      'b##': { root_index: 6, int_val: 1 },
      bb: { root_index: 6, int_val: 10 },
      bbb: { root_index: 6, int_val: 9 },
    };
  }
  /**
   * return Vex canonical note enharmonic - e.g. Bb to A#
   * */
  static vexToCannonical(vexKey: string): string {
    vexKey = SmoMusic.stripVexOctave(vexKey);
    return VF.Music.canonical_notes[SmoMusic.noteValues[vexKey].int_val];
  }

  /**
  * A note array (sans octave) in key-signature order
  */
  static get circleOfFifths(): PitchKey[] {
    return [{
      letter: 'c',
      accidental: 'n'
    }, {
      letter: 'g',
      accidental: 'n'
    }, {
      letter: 'd',
      accidental: 'n'
    }, {
      letter: 'a',
      accidental: 'n'
    }, {
      letter: 'e',
      accidental: 'n'
    }, {
      letter: 'b',
      accidental: 'n'
    }, {
      letter: 'f',
      accidental: '#'
    }, {
      letter: 'c',
      accidental: '#'
    }, {
      letter: 'a',
      accidental: 'b'
    }, {
      letter: 'e',
      accidental: 'b'
    }, {
      letter: 'b',
      accidental: 'b'
    }, {
      letter: 'f',
      accidental: 'n'
    }
    ];
  }

  /**
   * gives the index into circle-of-fifths array for a pitch, considering enharmonics.
   * */
  static circleOfFifthsIndex(smoPitch: Pitch) {
    const en1 = SmoMusic.vexToSmoKey(SmoMusic.getEnharmonic(SmoMusic.pitchToVexKey(smoPitch)));
    const en2 = SmoMusic.vexToSmoKey(SmoMusic.getEnharmonic(SmoMusic.getEnharmonic(SmoMusic.pitchToVexKey(smoPitch))));
    const ix = SmoMusic.circleOfFifths.findIndex((el) =>
      (el.letter === smoPitch.letter && el.accidental === smoPitch.accidental) ||
      (el.letter === en1.letter && el.accidental === en1.accidental) ||
      (el.letter === en2.letter && el.accidental === en2.accidental)
    );
    return ix;
  }

  /**
   * Get pitch to the right in circle of fifths
   * */
  static addSharp(smoPitch: Pitch): Pitch {
    const rv: PitchKey = SmoMusic.circleOfFifths[
      (SmoMusic.circleOfFifthsIndex(smoPitch) + 1) % SmoMusic.circleOfFifths.length];
    return { letter: rv.letter, accidental: rv.accidental, octave: smoPitch.octave };
  }

  /**
   * Get pitch to the left in circle of fifths
   */
  static addFlat(smoPitch: Pitch): Pitch {
    const rv: PitchKey = SmoMusic.circleOfFifths[
      ((SmoMusic.circleOfFifths.length - 1) + SmoMusic.circleOfFifthsIndex(smoPitch)) % SmoMusic.circleOfFifths.length];
    return { letter: rv.letter, accidental: rv.accidental, octave: smoPitch.octave };
  }

  /**
   * Add @param {number} - sharps
   */
  static addSharps(smoPitch: Pitch, distance: number): Pitch {
    let i = 0;
    let rv: Pitch = {} as Pitch;
    if (distance === 0) {
      return JSON.parse(JSON.stringify(smoPitch));
    }
    rv = SmoMusic.addSharp(smoPitch);
    for (i = 1; i < distance; ++i) {
      rv = SmoMusic.addSharp(rv);
    }
    const octaveAdj = SmoMusic.letterPitchIndex[smoPitch.letter] > SmoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
    rv.octave += octaveAdj;
    return rv;
  }

  /**
   * Add *distance* sharps/flats to given key
   */
  static addFlats(smoPitch: Pitch, distance: number): Pitch {
    let i = 0;
    let rv: Pitch = {} as Pitch;
    if (distance === 0) {
      return JSON.parse(JSON.stringify(smoPitch));
    }
    rv = SmoMusic.addFlat(smoPitch);
    for (i = 1; i < distance; ++i) {
      rv = SmoMusic.addFlat(rv);
    }
    const octaveAdj = SmoMusic.letterPitchIndex[smoPitch.letter] > SmoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
    rv.octave += octaveAdj;
    return rv;
  }

  /**
   * Convert array of smo pitches to vex keys, with adjustment for transpose and notehead
   * @param pitchAr
   * @param keyOffset
   * @param noteHead
   * @returns {string[]} - array of vex keyx
   */
  static smoPitchesToVexKeys(pitchAr: Pitch[], keyOffset: number, noteHead: string | null): string[] {
    const noopFunc = keyOffset > 0 ? 'addSharps' : 'addFlats';

    const rv: string[] = [];
    pitchAr.forEach((pitch) => {
      rv.push(SmoMusic.pitchToVexKey(SmoMusic[noopFunc](pitch, keyOffset), noteHead));
    });
    return rv;
  }

  static get scaleIntervals(): Record<string, number[]> {
    return {
      up: [2, 2, 1, 2, 2, 2, 1],
      down: [1, 2, 2, 2, 1, 2, 2]
    };
  }

  /**
   * return true if the pitches match, except for octave.
   * `{ letter: 'a', accidental: '#'}, { letter: 'a', accidental: '#'}` returns true
   * `{ letter: 'a', accidental: '#'}, { letter: 'b', accidental: 'b'}` returns false
   * */
  static smoScalePitchMatch(p1: Pitch, p2: Pitch): boolean {
    const pp1 = JSON.parse(JSON.stringify(p1));
    const pp2 = JSON.parse(JSON.stringify(p2));
    pp1.octave = 0;
    pp2.octave = 0;

    return SmoMusic.smoPitchToInt(pp1) === SmoMusic.smoPitchToInt(pp2);
  }

  /**
   * Return the number of ledger lines based on the pitch and clef
   * @param clef
   * @param pitch
   * @returns number where 0 is the top staff line
   */
  static pitchToLedgerLine(clef: Clef, pitch: Pitch): number {
    // return the distance from the top ledger line, as 0.5 per line/space
    return -1.0 * (VF.keyProperties(SmoMusic.pitchToVexKey(pitch, clef)).line - 4.5)
      - VF.clefProperties(clef).line_shift;
  }
  /**
   * return flag state (up or down) based on pitch and clef if auto
   * */
  static flagStateFromNote(clef: Clef, note: SmoNote) {
    let fs = note.flagState;
    if (fs === SmoNote.flagStates.auto) {
      fs = SmoMusic.pitchToLedgerLine(clef, note.pitches[0])
        >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
    }
    return fs;
  }

  /**
   * an array of clefs and the xml information they map to
   */
  static clefSigns: Record<string, ClefSign> = {
    'treble': { sign: 'G', line: 2 },
    'bass': { sign: 'F', line: 4 },
    'tenor': { sign: 'C', line: 4 },
    'alto':  { sign: 'C', line: 3 },
    'soprano':  { sign: 'C', line: 1 },
    'percussion':  { sign: 'percussion' },
    'mezzo-soprano':  { sign: 'C', line: 2 },
    'baritone-c':  { sign: 'C', line: 5 },
    'baritone-f':  { sign: 'F', line: 3 },
    'subbass':  { sign: 'F', line: 3, octave: -1 },
    'french': { sign: 'G', line: 1 },
    'vocal-tenor': { sign: 'G', line: 2, octave: -1 }
  }
  
  /**
   * convert from SMO to VEX format so we can use the VexFlow tables and methods
   * example:
   *   `{letter,octave,accidental}` object to vexKey string `'f#'`
   * */
  static _pitchToVexKey(smoPitch: Pitch): string {
    // Convert to vex keys, where f# is a string like 'f#'.
    let vexKey = smoPitch.letter.toLowerCase();
    if (smoPitch.accidental.length === 0) {
      vexKey = vexKey + 'n';
    } else {
      vexKey = vexKey + smoPitch.accidental;
    }
    if (smoPitch.octave) {
      vexKey = vexKey + '/' + smoPitch.octave;
    }
    return vexKey;
  }

  /**
   * convert smo pitch to easy score (vex) format.  Mostly used
   * for debugging and generating Vex test cases
   * @param smoPitch
   * @returns - a string that can be converted to a VEX routine, with some difficulty
   */
  static pitchToEasyScore(smoPitch: Pitch): string {
    let vexKey = smoPitch.letter.toLowerCase();
    vexKey = vexKey + smoPitch.accidental;
    return vexKey + smoPitch.octave;
  }
  /**
   * convert a pitch to a format expected by the MIDI writer
   * @param smoPitch pitch to convert
   * @returns pitch in MIDI string format.
   */
  static smoPitchToMidiString(smoPitch: Pitch): string {
    const midiPitch = SmoMusic.smoIntToPitch(SmoMusic.smoPitchToInt(smoPitch));
    let rv = midiPitch.letter.toUpperCase();
    if (midiPitch.accidental !== 'n') {
      rv += midiPitch.accidental;
    }
    rv += midiPitch.octave;
    return rv;
  }
  static smoPitchesToMidiStrings(smoPitches: Pitch[]): string[] {
    const rv: string[] = [];
    smoPitches.forEach((pitch) => {
      rv.push(SmoMusic.smoPitchToMidiString(pitch));
    });
    return rv;
  }

  /**
   * filled in from the midi routines borrowed from 
   * // https://github.com/grimmdude/MidiWriterJS
   * @param midiPitch pitch from MIDIwrite
   * @returns SMO pitch
   */
  static midiPitchToSmoPitch(midiPitch: string): Pitch {
    const smoPitch: Pitch = {} as Pitch;
    smoPitch.letter = midiPitch[0].toLowerCase() as PitchLetter;
    if (isNaN(parseInt(midiPitch[1], 10))) {
      smoPitch.accidental = midiPitch[1];
      smoPitch.octave = parseInt(midiPitch[2], 10);
    } else {
      smoPitch.accidental = 'n';
      smoPitch.octave = parseInt(midiPitch[1], 10);
    }
    return smoPitch;
  }
  static midiPitchToMidiNumber(midiPitch: string): number {
    return SmoMusic.smoPitchToInt(SmoMusic.midiPitchToSmoPitch(midiPitch)) + 12;
  }

  static pitchToVexKey(smoPitch: Pitch, head: string | null = null): string {
    if (!head) {
      return SmoMusic._pitchToVexKey(smoPitch);
    }
    return SmoMusic._pitchToVexKey(smoPitch) + '/' + head;
  }

  /**
   *  Turns vex pitch string into smo pitch, e.g.
   * `cn/4 => {'c','n',4}`
   * @param vexPitch
   * @returns SmoPitch
   * */
  static vexToSmoPitch(vexPitch: string): Pitch {
    let octave = 0;
    const po = vexPitch.split('/');
    const rv = SmoMusic.vexToSmoKey(po[0]);
    if (po.length > 1) {
      octave = parseInt(po[1], 10);
      octave = isNaN(octave) ? 4 : octave;
    } else {
      octave = 4;
    }
    (rv as Pitch).octave = octave;
    return rv as Pitch;
  }

  /**
   * Convert to smo pitch, without octave
   * ``['f#'] => [{letter:'f',accidental:'#'}]``
   * */
  static vexToSmoKey(vexPitch: string): PitchKey {
    const accidental = vexPitch.length < 2 ? 'n' : vexPitch.substring(1, vexPitch.length);
    const pp = vexPitch.split('/')[0];
    return {
      letter: pp[0].toLowerCase() as PitchLetter,
      accidental
    };
  }

  // {letter:'f',accidental:'#'} => [f#/
  static smoPitchesToVex(pitchAr: Pitch[]): string[] {
    var rv: string[] = [];
    pitchAr.forEach((p) => {
      rv.push(SmoMusic.pitchToVexKey(p));
    });
    return rv;
  }

  /**
   * @param vexKey - pitch in vex format
   * @returns pitch in vex format, sans octave
   */
  static stripVexOctave(vexKey: string): string {
    if (vexKey.indexOf('/') > 0) {
      vexKey = vexKey.substring(0, vexKey.indexOf('/'));
    }
    return vexKey;
  }
  /**
   * compare pitches for frequency match
   */
  static pitchArraysMatch(ar1: Pitch[], ar2: Pitch[]): boolean {
    let matches = 0;
    const ir1 = SmoMusic.smoPitchesToIntArray(ar1);
    const ir2 = SmoMusic.smoPitchesToIntArray(ar2);
    if (ir1.length !== ir2.length) {
      return false;
    }
    ir1.forEach((num) => {
      if (ir2.indexOf(num) >= 0) {
        matches += 1;
      }
    });
    return matches === ir1.length;
  }
  /**
   * convert pitches to integer pitch representations
   * by calling smoPitchToInt
   * @param pitches Smo pitches
   * @returns 
   */
  static smoPitchesToIntArray(pitches: Pitch[]): number[] {
    const rv: number[] = [];
    pitches.forEach((pitch) => {
      rv.push(SmoMusic.smoPitchToInt(pitch));
    });
    return rv.sort();
  }

  /**
   * convert a pitch to an integer value, used for transpositions, intervals, etc.
   * @param pitch 
   * @returns 
   */
  static smoPitchToInt(pitch: Pitch): number {
    if (typeof (pitch.octave) === 'undefined') {
      pitch.octave = 0;
    }
    const intVal = SmoMusic.noteValues[
      SmoMusic.stripVexOctave(SmoMusic.pitchToVexKey(pitch))].int_val;
    const octave = (pitch.letter === 'c' && pitch.accidental === 'b' && pitch.octave > 0) ?
      pitch.octave - 1 : pitch.octave;
    return octave * 12 + intVal;
  }

  /**
   * Convert a number to a SMO pitch
   * @param intValue - number of 1/2 steps from `c0`
   * @returns 
   */
  static smoIntToPitch(intValue: number): Pitch {
    let octave = 0;
    let accidental = '';
    let noteKey: PitchLetter | null = null;
    const letterInt = intValue >= 0 ? intValue % 12 :
      12 - (Math.abs(intValue) % 12);
    noteKey = (Object.keys(SmoMusic.noteValues).find((key) =>
      SmoMusic.noteValues[key].int_val === letterInt && key.length === 1
    )) as PitchLetter | null;
    if (!noteKey) {
      noteKey = (Object.keys(SmoMusic.noteValues).find((key) =>
        SmoMusic.noteValues[key].int_val === letterInt && key.length === 2
      )) as PitchLetter;
    }
    octave = Math.floor(intValue / 12);
    octave = octave >= 0 ? octave : 0;
    accidental = noteKey.substring(1, noteKey.length);
    // eslint-disable-next-line
    accidental = accidental ? accidental : 'n';
    return {
      letter: noteKey[0] as PitchLetter,
      accidental,
      octave
    };
  }
  static pitchKeyToPitch(pk: PitchKey): Pitch {
    return { letter: pk.letter, accidental: pk.accidental, octave: 1 };
  }

  /**
   * Consider instrument transpose when setting key -
   * e.g. Eb for Bb instruments is F.
   */
  static vexKeySigWithOffset(vexKey: string, offset: number): string {
    const pk: PitchKey = SmoMusic.vexToSmoKey(vexKey);
    const pi: number = SmoMusic.smoPitchToInt(SmoMusic.pitchKeyToPitch(pk)) + offset;
    let newKey: string = SmoMusic.toValidKeySignature(SmoMusic.pitchToVexKey(SmoMusic.smoIntToPitch(pi)));
    // handle equivalent ks
    if (newKey === 'c#' && vexKey.indexOf('b') >= 0) {
      newKey = 'db';
    }
    return newKey;
  }

  /**
   * return a map of enharmonics for choosing or cycling.  notes are in vexKey form.
   */
  static get enharmonics(): Record<string, string[]> {
    let i = 0;
    const rv: Record<string, string[]> = {};
    const keys = Object.keys(SmoMusic.noteValues);
    for (i = 0; i < keys.length; ++i) {
      const key = keys[i];
      const int_val: number = SmoMusic.noteValues[key].int_val;
      if (typeof (rv[int_val.toString()]) === 'undefined') {
        rv[int_val.toString()] = [];
      }
      // only consider natural note 1 time.  It is in the list twice for some reason.
      if (key.indexOf('n') === -1) {
        rv[int_val.toString()].push(key);
      }
    }
    return rv;
  }
  /**
   * Get enharmonic equivalent of given notes for cycle/choose
   * @param vexKey
   * @returns
   */
  static getEnharmonics(vexKey: string): string[] {
    const proto = SmoMusic.stripVexOctave(vexKey);
    const rv: string[] = [];
    let ne = SmoMusic.getEnharmonic(vexKey);
    rv.push(proto);
    while (ne[0] !== proto[0]) {
      rv.push(ne);
      ne = SmoMusic.getEnharmonic(ne);
    }
    return rv;
  }

  /**
   * return the next note from the cycle in `getEnharmonics`
   */
  static getEnharmonic(vexKey: string): string {
    vexKey = SmoMusic.stripVexOctave(vexKey);
    const intVal = SmoMusic.noteValues[vexKey.toLowerCase()].int_val;
    const ar = SmoMusic.enharmonics[intVal.toString()];
    const len = ar.length;
    // 'n' for natural in key but not in value
    vexKey = vexKey.length > 1 && vexKey[1] === 'n' ? vexKey[0] : vexKey;
    const ix = ar.indexOf(vexKey);
    vexKey = ar[(ix + 1) % len];
    return vexKey;
  }

  /**
   * Return a pitch a diatonic step away from SmoPitch in vexKey
   * @param smoPitch
   * @param vexKey
   * @param direction
   * @returns
   */
  static closestTonic(smoPitch: Pitch, vexKey: string, direction: number): Pitch {
    direction = Math.sign(direction) < 0 ? -1 : 1;
    const tonic = SmoMusic.vexToSmoKey(vexKey);
    const rv = SmoMusic.pitchKeyToPitch(tonic);
    rv.octave = smoPitch.octave;
    const iix = SmoMusic.smoPitchToInt(smoPitch);
    const smint = SmoMusic.smoPitchToInt(rv);
    if (Math.sign(smint - iix) !== direction) {
      rv.octave += direction;
    }
    return rv;
  }

  // ### toValidKeySignature
  // When transposing, make sure key signature is valid, e.g. g# should be
  // Ab
  static toValidKeySignature(vexKey: string): string {
    let strlen = 0;
    const map: Record<string, string> = { 'a#': 'bb', 'g#': 'ab', 'cb': 'b', 'd#': 'eb' };
    strlen = (vexKey.length > 2 ? 2 : vexKey.length);
    // Vex doesn't like 'n' in key signatures.
    if (strlen === 2 && vexKey[1].toLowerCase() === 'n') {
      strlen = 1;
    }
    const rv = vexKey.substr(0, strlen);
    if (map[rv.toLowerCase()]) {
      return map[rv.toLowerCase()];
    }
    return rv;
  }

  /**
   * When transposing, get the enharmonic that most closely fits the key
   * `getEnharmonicInKey` returns an alternate to the given pitch, or the same pitch.
   * `getKeyFriendlyEnharmonic` return a pitch for a given key, given the letter name only
   * @param smoPitch
   * @param keySignature
   * @returns
   */
  static getEnharmonicInKey(smoPitch: Pitch, keySignature: string): Pitch {
    let match = false;
    let rv = '';
    if (typeof (smoPitch.octave) === 'undefined') {
      smoPitch.octave = 1;
    }
    const sharpKey = keySignature.indexOf('#') >= 0;
    const flatKey = keySignature.indexOf('b') >= 0;
    const ar = SmoMusic.getEnharmonics(SmoMusic.pitchToVexKey(smoPitch));
    rv = SmoMusic.stripVexOctave(SmoMusic.pitchToVexKey(smoPitch));
    const scaleMap: Record<string, string> = new VF.Music().createScaleMap(keySignature);
    ar.forEach((vexKey) => {
      if (vexKey.length === 1) {
        vexKey += 'n';
      }
      if (vexKey === scaleMap[vexKey[0]]) {
        rv = vexKey;
        match = true;
      } else if (!match) {
        // In the absence of a match of a key tone, we bias towards more
        // 'common', like Bb is more common than A#, esp. as a chord.  This maybe
        // just be my horn player bias towards flat keys
        if (vexKey === 'a#' && !sharpKey) {
          rv = 'bb';
        } else if (vexKey === 'g#' && !sharpKey) {
          rv = 'ab';
        } else if (vexKey === 'c#' && !sharpKey) {
          rv = 'db';
        } else if (vexKey === 'd#' && !sharpKey) {
          rv = 'eb';
        } else if (vexKey === 'f#' && flatKey) {
          rv = 'gb';
        }
      }
    });
    const smoRv: Pitch = SmoMusic.pitchKeyToPitch(SmoMusic.vexToSmoKey(rv));
    smoRv.octave = smoPitch.octave;
    const rvi = SmoMusic.smoPitchToInt(smoRv);
    const ori = SmoMusic.smoPitchToInt(smoPitch);
    // handle the case of c0 < b0, pitch-wise
    smoRv.octave += Math.sign(ori - rvi);
    return smoRv;
  }
  /**
   * fix the enharmonic to match the key, if possible
   * @example
   * `getKeyFriendlyEnharmonic('b','eb');  => returns 'bb'
   * return vex string
   * `getEnharmonicInKey` returns an alternate to the given pitch, or the same pitch.
   * `getKeyFriendlyEnharmonic` return a pitch for a given key, given the letter name only
   */
  static getKeyFriendlyEnharmonic(letter: string, keySignature: string): string {
    let rv: string = letter;
    let i = 0;
    const muse = new VF.Music();
    const scale: string[] = Object.values(muse.createScaleMap(keySignature));
    let prop: string = SmoMusic.getEnharmonic(letter.toLowerCase());
    while (prop.toLowerCase() !== letter.toLowerCase()) {
      for (i = 0; i < scale.length; ++i) {
        const skey: string = scale[i];
        if ((skey[0] === prop && skey[1] === 'n') ||
          (skey.toLowerCase() === prop.toLowerCase())) {
          rv = skey;
          break;
        }
      }
      prop = (prop[1] === 'n' ? prop[0] : prop);
      prop = SmoMusic.getEnharmonic(prop);
    }
    return rv;
  }
  /**
  // given a letter pitch (a,b,c etc.), and a key signature, return the actual note
  // that you get without accidentals
  //   `SmoMusic.getKeySignatureKey('F','G'); // returns f#`
   * @param letter
   * @param keySignature
   * @returns
   */
  static getKeySignatureKey(letter: PitchLetter, keySignature: string): string {
    const km = new VF.KeyManager(keySignature);
    return km.scaleMap[letter];
  }

  static getAccidentalForKeySignature(smoPitch: Pitch, keySignature: string): string {
    const vexKey = SmoMusic.getKeySignatureKey(smoPitch.letter, keySignature);
    return vexKey.length === 1 ? 'n' : vexKey.substr(1, vexKey.length - 1);
  }

  // ### isPitchInKeySignature
  // Return true if the pitch is not an accidental in the give key, e.g.
  // f# in 'g' or c in 'Bb'
  static isPitchInKeySignature(smoPitch: Pitch, keySignature: string): boolean {
    const vexKey = SmoMusic.getKeySignatureKey(smoPitch.letter, keySignature);
    return (vexKey.length === 1 && smoPitch.accidental === 'n' ||
      (vexKey[1] === smoPitch.accidental));
  }

  // ### getIntervalInKey
  // give a pitch and a key signature, return another pitch at the given
  // diatonic interval.  Similar to getKeyOffset but diatonic.
  static getIntervalInKey(pitch: Pitch, keySignature: string, interval: number): Pitch {
    let scaleIx = 0;
    let diatonicIx = 0;
    if (interval === 0) {
      return JSON.parse(JSON.stringify(pitch));
    }

    const delta = interval > 0 ? 1 : -1;
    const inv = -1 * delta;
    const tonic = SmoMusic.closestTonic(pitch, keySignature, inv);
    const intervals = delta > 0 ? SmoMusic.scaleIntervals.up : SmoMusic.scaleIntervals.down;
    const pitchInt = SmoMusic.smoPitchToInt(pitch);
    let nkey = tonic;
    let nkeyInt = SmoMusic.smoPitchToInt(nkey);
    while (Math.sign(nkeyInt - pitchInt) !== delta && Math.sign(nkeyInt - pitchInt) !== 0) {
      nkey = SmoMusic.smoIntToPitch(SmoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
      scaleIx = (scaleIx + 1) % 7;
      nkeyInt = SmoMusic.smoPitchToInt(nkey);
    }
    while (diatonicIx !== interval) {
      nkey = SmoMusic.smoIntToPitch(SmoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
      scaleIx = (scaleIx + 1) % 7;
      diatonicIx += delta;
    }
    return SmoMusic.getEnharmonicInKey(nkey, keySignature);
  }

  static getLetterNotePitch(prevPitch: Pitch, letter: PitchLetter, key: string): Pitch {
    const pitch: Pitch = JSON.parse(JSON.stringify(prevPitch));
    pitch.letter = letter;

    // Make the key 'a' make 'Ab' in the key of Eb, for instance
    const vexKsKey = SmoMusic.getKeySignatureKey(letter, key);
    if (vexKsKey.length > 1) {
      pitch.accidental = vexKsKey[1];
    } else {
      pitch.accidental = 'n';
    }

    // make the octave of the new note as close to previous (or next) note as possible.
    const upv = ['bc', 'ac', 'bd', 'da', 'be', 'gc'];
    const downv = ['cb', 'ca', 'db', 'da', 'eb', 'cg'];
    const delta = prevPitch.letter + pitch.letter;
    if (upv.indexOf(delta) >= 0) {
      pitch.octave += 1;
    }
    if (downv.indexOf(delta) >= 0) {
      pitch.octave -= 1;
    }
    return pitch;
  }
  /**
 * Convenience function to create SmoNote[] from letters, with the correct accidental
 * for the key signature, given duration, etc
 * @param startPitch - the pitch used to calculate the octave of the new note
 * @param clef
 * @param keySignature
 * @param duration - vex duration
 * @param letters - string of PitchLetter
 * @returns
 */
  static notesFromLetters(startPitch: Pitch, clef: Clef, keySignature: string, duration: string, letters: string): SmoNote[] {
    const rv: SmoNote[] = [];
    let curPitch = startPitch;
    const ticks = SmoMusic.durationToTicks(duration);
    letters.split('').forEach((letter) => {
      curPitch = SmoMusic.getLetterNotePitch(curPitch, letter as PitchLetter, keySignature);
      const defs = SmoNote.defaults;
      defs.ticks = { numerator: ticks, denominator: 1, remainder: 0 };
      defs.pitches = [curPitch];
      defs.clef = clef;
      rv.push(new SmoNote(defs));
    });
    return rv;
  }
  /**
   *
   * @param key start key
   * @param transposeIndex number of 1/2 steps
   * @returns {string} - vex key
   */
  static vexKeySignatureTranspose(key: string, transposeIndex: number): string {
    const pitch: Pitch = SmoMusic.pitchKeyToPitch(SmoMusic.vexToSmoKey(key));
    key = SmoMusic.smoPitchesToVexKeys([pitch], transposeIndex, null)[0];
    key = SmoMusic.stripVexOctave(key);
    key = key[0].toUpperCase() + key.substring(1, key.length);
    if (key.length > 1 && key[1] === 'n') {
      key = key[0];
    }
    return key;
  }
  static get frequencyMap() {
    return SmoAudioPitch.pitchFrequencyMap;
  }

  // ### get letterPitchIndex
  // Used to adjust octave when transposing.
  // Pitches are measured from c, so that b0 is higher than c0, c1 is 1 note higher etc.
  static get letterPitchIndex(): Record<PitchLetter, number> {
    return {
      'c': 0,
      'd': 1,
      'e': 2,
      'f': 3,
      'g': 4,
      'a': 5,
      'b': 6
    };
  }

  /**
   * Indicate if a change from letter note 'one' to 'two' needs us to adjust the
   * octave due to the `SmoMusic.letterPitchIndex` (b0 is higher than c0)
   * */
  static letterChangedOctave(one: PitchLetter, two: PitchLetter): number {
    const p1 = SmoMusic.letterPitchIndex[one];
    const p2 = SmoMusic.letterPitchIndex[two];
    if (p1 < p2 && p2 - p1 > 2) {
      return -1;
    }
    if (p1 > p2 && p1 - p2 > 2) {
      return 1;
    }
    return 0;
  }

  /**
  // Given a vex noteProp and an offset, offset that number
  // of 1/2 steps.
   * @param pitch
   * @param offset
   * @returns
   */
  static getKeyOffset(pitch: Pitch, offset: number): Pitch {
    const canon = VF.Music.canonical_notes;
    // Convert to vex keys, where f# is a string like 'f#'.
    let vexKey = SmoMusic.pitchToVexKey(pitch);
    vexKey = SmoMusic.vexToCannonical(vexKey);
    const rootIndex = canon.indexOf(vexKey);
    const index = (rootIndex + canon.length + offset) % canon.length;
    let octave = pitch.octave;
    if (Math.abs(offset) >= 12) {
      const octaveOffset = Math.sign(offset) * Math.floor(Math.abs(offset) / 12);
      octave += octaveOffset;
      offset = offset % 12;
    }
    if (rootIndex + offset >= canon.length) {
      octave += 1;
    }
    if (rootIndex + offset < 0) {
      octave -= 1;
    }
    const rv = JSON.parse(JSON.stringify(pitch));
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

  // ### keySignatureLength
  // return the number of sharp/flat in a key signature for sizing guess.
  static get keySignatureLength(): Record<string, number> {
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
      'E': 4,
      'D': 2
    };
  }

  static getSharpsInKeySignature(key: string): number {
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    if (sharpKeys.indexOf(key.toUpperCase()) < 0) {
      return 0;
    }
    return SmoMusic.keySignatureLength[key.toUpperCase()];
  }

  static getFlatsInKeySignature(key: string): number {
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    let caseKey = key[0].toUpperCase();
    if (key.length > 0) {
      caseKey += key.substr(1, key.length);
    }
    if (flatKeys.indexOf(caseKey) < 0) {
      return 0;
    }
    return SmoMusic.keySignatureLength[caseKey];
  }
  static midiKeyToVexKey(midiKey: number): string {
    const sharpKeys = ['G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    if (midiKey === 0) {
      return 'C';
    }
    const flat = midiKey < 0;
    let ix = Math.abs(midiKey) - 1;
    if (ix > 6) {
      return 'C';
    }
    if (flat) {
      return flatKeys[ix];
    } else {
      return sharpKeys[ix];
    }
  }

  static timeSignatureToTicks(timeSignature: string): number {
    const nd = timeSignature.split('/');
    const num = parseInt(nd[0], 10);
    const den = parseInt(nd[1], 10);
    const base = 2048 * (8 / den);
    return base * num;
  }
  static smoTicksToVexDots(ticks: number) {
    const vd = SmoMusic.ticksToDuration[ticks];
    const dots = (vd.match(/d/g) || []).length;
    return dots;
  }
  static midiTicksForQuantizeTo(ticks: number) {
    const oneDot = ticks * 2;
    const twoDots = ticks * 4;
    const threeDots = ticks * 8;
    const dCount = (str: string) => {
      const re = /d/g
      return ((str || '').match(re) || []).length
    }
    return Object.keys(SmoMusic.ticksToDuration).filter((key) => {
      const keyInt = parseInt(key, 10);
      if (keyInt < ticks) {
        return false;
      }
      const dots = dCount(SmoMusic.ticksToDuration[key]);
      if (dots > 0 && keyInt < oneDot) {
        return false;
      }
      if (dots > 1 && keyInt < twoDots) {
        return false;
      }
      if (dots > 2 && keyInt < threeDots) {
        return false;
      }
      if (dots > 3) {
        return false;
      }
      return true;
    })
      .map((key) => parseInt(key, 10));
    // return Object.keys(SmoMusic.ticksToDuration).map((key) => parseInt(key, 10));    
  }
  static get midiTicksForQuantizeMap(): Record<number, number[]> {
    return {
      512:  SmoMusic.midiTicksForQuantizeTo(1024),
      1024: SmoMusic.midiTicksForQuantizeTo(1024),
      2048: SmoMusic.midiTicksForQuantizeTo(2048)
    };
  }
  static midiTicksForQuantize(ticks: number) {
    return SmoMusic.midiTicksForQuantizeMap[ticks];
  }
  static binarySearch(target: number, ix: number, partition: number, input: number[]) {
    const test = input[ix];
    const cost = Math.abs(target - test);
    if (cost < 1) {
      return ({ cost, result: test, newIx: ix, oldIx: ix, partition: 0, input })
    }
    partition = Math.round(partition / 2) + 1;
    const step = Math.round(partition / 2);
    if (input[ix] > target) {
      return ({ cost, result: input[ix], newIx: ix - step, partition, input });
    } else {
      return ({ cost, result: input[ix], newIx: ix + step, partition, input });
    }
  }
  static midiTickSearch(target: number, quantize: number) {
    const tickSet = SmoMusic.midiTicksForQuantize(quantize);
    let partition = Math.round(tickSet.length / 2);
    let ix = partition;
    let best = { cost: Math.abs(tickSet[ix] - target), result: tickSet[ix], ix };
    let result = SmoMusic.binarySearch(target, ix, partition, tickSet);
    while (best.cost > 1) {
      if (best.cost > result.cost) {
        best.cost = result.cost;
        best.result = result.result;
        best.ix = ix;
      }
      ix = result.newIx;
      if (result.partition <= 3) {
        break;
      }
      result = SmoMusic.binarySearch(target, result.newIx, result.partition, tickSet);
    }
    if (result.cost > 1 && result.partition > 0) {
      let i = 0;
      const ix = best.ix;
      const step = best.result > target ? -1 : 1;
      for (i = 0; i < (result.partition + 2) && (i * step) + ix < tickSet.length && (i * step) + ix >= 0; ++i) {
        const newIx = (i * step) + ix;
        const cost = Math.abs(target - tickSet[newIx]);
        if (best.cost > cost) {
          best.cost = cost;
          best.ix = (i * step) + ix;
          best.result = tickSet[(i * step) + ix];
        }
      }
    }
    return { cost: best.cost, result: best.result };
  }
  // ## closestVexDuration
  // ## Description:
  // return the closest vex duration >= to the actual number of ticks. Used in beaming
  // triplets which have fewer ticks then their stem would normally indicate.
  static closestVexDuration(ticks: number): string {
    let stemTicks = VF.RESOLUTION;

    // The stem value is the type on the non-tuplet note, e.g. 1/8 note
    // for a triplet.
    while (ticks <= stemTicks) {
      stemTicks = stemTicks / 2;
    }
    stemTicks = stemTicks * 2;
    return SmoMusic.ticksToDuration[stemTicks];
  }

  // ### closestDurationTickLtEq
  // Price is right style, closest tick value without going over.  Used to pad
  // rests when reading musicXML.
  static closestDurationTickLtEq(ticks: number): number {
    const sorted = Object.keys(SmoMusic.ticksToDuration)
      .map((key) => parseInt(key, 10))
      .filter((key) => key <= ticks);
    return sorted[sorted.length - 1];
  }
  /**
   * Return array of valid note-lengths from an odd number of ticks,
   * so we can come as close as possible to representing the ticks with notes
   * @param ticks
   * @returns
   */
  static splitIntoValidDurations(ticks: number): number[] {
    const rv = [];
    let closest = 0;
    while (ticks > 128) {
      closest = SmoMusic.closestDurationTickLtEq(ticks);
      ticks -= closest;
      rv.push(closest);
    }
    return rv;
  }
  // ### vexStemType
  // return the vex stem type (no dots)
  static vexStemType(ticks: number): string {
    const str = SmoMusic.ticksToDuration[SmoMusic.splitIntoValidDurations(ticks)[0]];
    if (str.indexOf('d') >= 0) {
      return str.substr(0, str.indexOf('d'));
    }
    return str;
  }

  // ### Description:
  // Get ticks for this note with an added dot.  Return
  // identity if that is not a supported value.
  static getNextDottedLevel(ticks: number): number {
    const ttd = SmoMusic.ticksToDuration;
    const vals = Object.values(ttd);
    const ix = vals.indexOf(ttd[ticks]);
    if (ix >= 0 && ix < vals.length && vals[ix][0] === vals[ix + 1][0]) {
      return SmoMusic.durationToTicks(vals[ix + 1]);
    }
    return ticks;
  }

  // ### Description:
  // Get ticks for this note with one fewer dot.  Return
  // identity if that is not a supported value.
  static getPreviousDottedLevel(ticks: number): number {
    const ttd = SmoMusic.ticksToDuration;
    const vals = Object.values(ttd);
    const ix = vals.indexOf(ttd[ticks]);
    if (ix > 0 && vals[ix][0] === vals[ix - 1][0]) {
      return SmoMusic.durationToTicks(vals[ix - 1]);
    }
    return ticks;
  }
  static _ticksToDuration: Record<string, string> = {};

  // ### ticksToDuration
  // Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
  static get ticksToDuration(): Record<string, string> {
    let i = 0;
    const durations = ['1/2', '1', '2', '4', '8', '16', '32', '64', '128', '256'];

    const _ticksToDurationsF = () => {
      for (i = 0; i < durations.length - 1; ++i) {
        let j = 0;
        let dots = '';
        let ticks = 0;

        // We support up to 4 'dots'
        for (j = 0; j <= 4 && j + i < durations.length; ++j) {
          ticks += (VF.durationToTicks(durations[i + j]) as number);
          SmoMusic._ticksToDuration[ticks.toString()] = durations[i] + dots;
          dots += 'd';
        }
      }
    };
    if (Object.keys(SmoMusic._ticksToDuration).length < 1) {
      _ticksToDurationsF();
    }
    return SmoMusic._ticksToDuration;
  }

  // ### durationToTicks
  // Uses VF.durationToTicks, but handles dots.
  static durationToTicks(duration: string): number {
    let split = 0;
    let i = 0;
    let vfDuration = 0;
    let dots = duration.indexOf('d');
    if (dots < 0) {
      return VF.durationToTicks(duration) as number;
    } else {
      vfDuration = VF.durationToTicks(duration.substring(0, dots)) as number;
      dots = duration.length - dots; // number of dots
      split = vfDuration / 2;
      for (i = 0; i < dots; ++i) {
        vfDuration += split;
        split = split / 2;
      }
      return vfDuration;
    }
  }

  /**
   * break the duration up into an array of durations, to split a long
   * note up between bars when pasting.
   * @param duration
   * @returns
   */
  static gcdMap(duration: number): number[] {
    let k = 0;
    const keys = Object.keys(SmoMusic.ticksToDuration).map((x) => parseInt(x, 10));
    const dar = [];
    const gcd = (td: number) => {
      let rv = keys[0];
      for (k = 1; k < keys.length; ++k) {
        if (td % keys[k] === 0) {
          rv = keys[k];
        }
      }
      return rv;
    };
    while (duration > 0 && !SmoMusic.ticksToDuration[duration]) {
      const div = gcd(duration);
      duration = duration - div;
      dar.push(div);
    }
    if (duration > 0) {
      dar.push(duration);
    }
    return dar.sort((a, b) => a > b ? -1 : 1);
  }
}
