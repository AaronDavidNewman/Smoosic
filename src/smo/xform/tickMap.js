// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## TickMap
// create a map note durations at each index into the voice, including the accidentals at each duration.
// return format:
//     tickmap = {
//        totalDuration: 16384,
//        durationMap:[2048,4096,..],  // A running total per tick
//        deltaMap:[2048,2048...], a map of deltas
// eslint-disable-next-line no-unused-vars
class TickMap {
  constructor(measure, voiceIndex) {
    this.keySignature = measure.keySignature;
    this.voice = voiceIndex;
    if (measure.voices.length <= this.voice) {
      console.warn('tickmap for invalid voice');
      return;
    }
    this.notes = measure.voices[this.voice].notes;
    this.index = 0;
    this.startIndex = 0;
    this.endIndex = this.notes.length;

    // so a client can tell if the iterator's been run or not
    // ticks as we iterate.
    // duration is the accumulated duraition over all the notes
    this.totalDuration = 0;
    // delta is the tick contribution of this note
    this.delta = 0;
    // the tick start location of notes[x]
    this.durationMap = [];
    this.deltaMap = [];
    this.accidentalMap = [];
    this.durationAccidentalMap = {};
    this.hasRun = false;
    this.beattime = 4096;
    this.createMap();
  }
  // ### _getAccidentalsForKey
  // Update `map` with the correct accidental based on the key signature.
  _getAccidentalsForKey(map) {
    const music = new VF.Music();
    const keys = music.createScaleMap(this.keySignature);
    const keyKeys = Object.keys(keys);
    keyKeys.forEach((keyKey) => {
      const vexKey = keys[keyKey];
      if (vexKey.length > 1 && (vexKey[1] === 'b' || vexKey[1] === '#')) {
        const pitch = {
          letter: vexKey[0],
          accidental: vexKey[1]
        };
        map[vexKey[0]] = {
          duration: 0,
          pitch
        };
      }
    });
  }

  // ### updateAccidentalMap
  // Keep a running tally of the accidentals for this voice
  // based on the key and previous accidentals.
  updateAccidentalMap(note) {
    let sigObj = {};
    let i = 0;
    const newObj = {};
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
      const pitch = note.pitches[i];
      const letter = pitch.letter.toLowerCase();
      const sigLetter = letter + pitch.accidental;
      const sigKey = smoMusic.getKeySignatureKey(letter, this.keySignature);
      if (sigObj && sigObj[letter]) {
        const currentVal = sigObj[letter].key + sigObj[letter].accidental;
        if (sigLetter !== currentVal) {
          newObj[letter] = { pitch, duration: this.duration };
        }
      } else {
        if (sigLetter !== sigKey) {
          newObj[letter] = { pitch, duration: this.duration };
        }
      }
    }
    this.accidentalMap.push(newObj);
    // Mark the accidental with the start of this note.
    this.durationAccidentalMap[this.durationMap[this.index]] = newObj;
  }

  // ### getActiveAccidental
  // return the active accidental for the given note
  getActiveAccidental(pitch, iteratorIndex, keySignature) {
    let defaultAccidental = smoMusic.getKeySignatureKey(pitch.letter, keySignature);
    let i = 0;
    let j = 0;
    defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';
    if (iteratorIndex === 0) {
      return defaultAccidental;
    }
    // Back up the accidental map until we have a match, or until we run out
    for (i = iteratorIndex; i > 0; --i) {
      const map = this.accidentalMap[i - 1];
      const mapKeys = Object.keys(map);
      for (j = 0; j < mapKeys.length; ++j) {
        const mapKey = mapKeys[j];
        // The letter name + accidental in the map
        const mapLetter = map[mapKey];
        const mapAcc = mapLetter.accidental ? mapLetter.accidental : 'n';

        // if the letters match and the accidental...
        if (mapLetter.pitch.letter.toLowerCase() === letter) {
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
