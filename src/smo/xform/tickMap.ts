// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { TickMappable } from '../data/measure';
import { Pitch, IsPitchLetter, TickAccidental } from '../data/common';
import { SmoNote } from '../data/note';

/**
 * create a map note durations at each index into the voice, including the accidentals at each duration.
 * return format:
 * ```
   tickmap = {
          totalDuration: 16384,
          durationMap:[2048,4096,..],  // A running total per tick
            deltaMap:[2048,2048...], a map of deltas
 ```
 * @category SmoTransform
 */            
export class TickMap {
  keySignature: string;
  voice: number;
  notes: SmoNote[] = [];
  index: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;
  // duration is the accumulated duraition over all the notes
  totalDuration: number = 0;
  // delta is the tick contribution of this note
  delta: number = 0;
  // the absolute tick start location of notes[x]
  durationMap: number[] = [];
  // the relative duration if each tick slot
  deltaMap: number[] = [];
  // An array of active accidentals for each tick index
  accidentalMap: Record<string, TickAccidental>[] = [];
  // a map of active accidentals, indexed by duration index
  durationAccidentalMap: Record<string | number, Record<string, TickAccidental>> = {};
  constructor(measure: TickMappable, voiceIndex: number) {
    this.keySignature = measure.keySignature;
    this.voice = voiceIndex;
    if (measure.voices.length <= this.voice) {
      console.warn('tickmap for invalid voice');
      return;
    }
    this.notes = measure.voices[this.voice].notes;
    this.endIndex = this.notes.length;
    this.createMap();
  }
  // ### _getAccidentalsForKey
  // Update `map` with the correct accidental based on the key signature.
  _getAccidentalsForKey(map: Record<string, TickAccidental>) {
    const keys = SmoMusic.getScaleTonesForKey(this.keySignature);
    const keyKeys = Object.keys(keys);
    keyKeys.forEach((keyKey) => {
      const vexKey = keys[keyKey];
      if (vexKey.length > 1 && (vexKey[1] === 'b' || vexKey[1] === '#')) {
        if (IsPitchLetter(vexKey[0])) {
          const pitch = {
            letter: vexKey[0],
            accidental: vexKey[1],
            octave: 4
          };
          map[vexKey[0]] = {
            duration: 0,
            pitch
          };
        }
      }
    });
  }

  // ### updateAccidentalMap
  // Keep a running tally of the accidentals for this voice
  // based on the key and previous accidentals.
  updateAccidentalMap(note: SmoNote) {
    let i = 0;
    let sigObj: Record<string, TickAccidental> = {};
    const newObj: Record<string, TickAccidental> = {};
    if (this.index === 0) {
      this._getAccidentalsForKey(newObj);
      sigObj = newObj;
    } else {
      sigObj = this.accidentalMap[this.index - 1];
    }
    for (i = 0; i < note.pitches.length; ++i) {
      if (note.noteType !== 'n') {
        continue;
      }
      const pitch: Pitch = note.pitches[i];
      const pitchOctave = pitch.letter.toLowerCase() + '-' + pitch.octave;
      const sigLetter: string = pitchOctave + pitch.accidental;
      const sigKey = SmoMusic.getKeySignatureKey(pitch.letter, this.keySignature);
      if (sigObj && sigObj[pitchOctave]) {
        const curObj = sigObj[pitchOctave];
        const currentVal = curObj.pitch.letter.toLowerCase() + '-' + curObj.pitch.octave + curObj.pitch.accidental;
        if (sigLetter !== currentVal) {
          newObj[pitchOctave] = { pitch, duration: this.duration };
        }
      } else {
        if (sigLetter !== sigKey) {
          newObj[pitchOctave] = { pitch, duration: this.duration };
        }
      }
    }
    this.accidentalMap.push(newObj);
    // Mark the accidental with the start of this note.
    this.durationAccidentalMap[this.durationMap[this.index]] = newObj;
  }

  // ### getActiveAccidental
  // return the active accidental for the given note
  getActiveAccidental(pitch: Pitch, iteratorIndex: number, keySignature: string) {
    let defaultAccidental: string = SmoMusic.getKeySignatureKey(pitch.letter, keySignature);
    let i = 0;
    let j = 0;
    defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';
    if (iteratorIndex === 0) {
      return defaultAccidental;
    }
    // Back up the accidental map until we have a match, or until we run out
    for (i = iteratorIndex; i > 0; --i) {
      const map: Record<string, TickAccidental> = this.accidentalMap[i - 1];
      const mapKeys = Object.keys(map);
      for (j = 0; j < mapKeys.length; ++j) {
        const mapKey: string = mapKeys[j];
        // The letter name + accidental in the map
        const mapPitch: Pitch = map[mapKey].pitch;
        const mapAcc = mapPitch.accidental ? mapPitch.accidental : 'n';

        // if the letters match and the accidental...
        if (mapPitch.letter.toLowerCase() === pitch.letter) {
          return mapAcc;
        }
      }
    }
    return defaultAccidental;
  }
  get duration() {
    return this.totalDuration;
  }
  createMap() {
    for (this.index = this.startIndex; this.index < this.endIndex; ++this.index) {
      const note = this.notes[this.index];
      // save the starting point, tickwise
      this.durationMap.push(this.totalDuration);
      // the number of ticks for this note
      this.delta = (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
      this.deltaMap.push(this.delta);
      // update the tick count for the whole array/measure
      this.totalDuration += this.delta;
      this.updateAccidentalMap(note);
    }
  }
}
