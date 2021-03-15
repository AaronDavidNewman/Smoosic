// ## smoMusic
// Helper functions that build on the VX music theory routines, and other
// utilities I wish were in VF.Music but aren't
// ### Note on pitch and duration format
// We use some VEX music theory routines and frequently need to convert
// formats from SMO format.
//
// `Smo` uses pitch JSON:
// ``javascript``
//  {note:'c',accidental:'#',octave:4}
// `Vex` usually uses a canonical string:
//  'c#/4'
//  Depending on the operation, the octave might be omitted
//
// `Smo` uses a JSON for duration always:
// ``javascript``
// {numerator:4096,denominator:1,remainder:0}
//
// `VexFlow` uses a letter duration ('4' for 1/4 note) and 'd' for dot.
// I try to indicate whether I am using vex or smo notation
// Duration methods start around line 600
// ---
class smoMusic {
  // ### vexToCannonical
  // return Vex canonical note enharmonic - e.g. Bb to A#
  // Get the canonical form
  static vexToCannonical(vexKey) {
    vexKey = smoMusic.stripVexOctave(vexKey);
    return VF.Music.canonical_notes[VF.Music.noteValues[vexKey].int_val];
  }

  // ### circleOfFifths
  // A note array in key-signature order
  static get circleOfFifths() {
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

  // ### circleOfFifthsIndex
  // gives the index into circle-of-fifths array for a pitch, considering enharmonics.
  static circleOfFifthsIndex(smoPitch) {
    const en1 = smoMusic.vexToSmoKey(smoMusic.getEnharmonic(smoMusic.pitchToVexKey(smoPitch)));
    const en2 = smoMusic.vexToSmoKey(smoMusic.getEnharmonic(smoMusic.getEnharmonic(smoMusic.pitchToVexKey(smoPitch))));
    const ix = smoMusic.circleOfFifths.findIndex((el) =>
        (el.letter === smoPitch.letter && el.accidental === smoPitch.accidental) ||
        (el.letter === en1.letter && el.accidental === en1.accidental) ||
        (el.letter === en2.letter && el.accidental === en2.accidental)
      );
    return ix;
  }

  // ### addSharp
  // Get pitch to the right in circle of fifths
  static addSharp(smoPitch) {
    let rv = smoMusic.circleOfFifths[
      (smoMusic.circleOfFifthsIndex(smoPitch) + 1) % smoMusic.circleOfFifths.length];
    rv = JSON.parse(JSON.stringify(rv));
    rv.octave = smoPitch.octave;
    return rv;
  }

  // ### addFlat
  // Get pitch to the left in circle of fifths
  static addFlat(smoPitch) {
    let rv = smoMusic.circleOfFifths[
        ((smoMusic.circleOfFifths.length - 1) + smoMusic.circleOfFifthsIndex(smoPitch)) % smoMusic.circleOfFifths.length];
    rv = JSON.parse(JSON.stringify(rv));
    rv.octave = smoPitch.octave;
    return rv;
  }

  // ### addSharps
  // Add *distance* sharps/flats to given key
  static addSharps(smoPitch, distance) {
    let i = 0;
    let rv = {};
    if (distance === 0) {
      return JSON.parse(JSON.stringify(smoPitch));
    }
    rv = smoMusic.addSharp(smoPitch);
    for (i = 1; i < distance; ++i) {
      rv = smoMusic.addSharp(rv);
    }
    const octaveAdj = smoMusic.letterPitchIndex[smoPitch.letter] > smoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
    rv.octave += octaveAdj;
    return rv;
  }

  // ### addFlats
  // Add *distance* sharps/flats to given key
  static addFlats(smoPitch, distance) {
    let i = 0;
    let rv = {};
    if (distance === 0) {
      return JSON.parse(JSON.stringify(smoPitch));
    }
    rv = smoMusic.addFlat(smoPitch);
    for (i = 1; i < distance; ++i) {
      rv = smoMusic.addFlat(rv);
    }
    const octaveAdj = smoMusic.letterPitchIndex[smoPitch.letter] > smoMusic.letterPitchIndex[rv.letter] ? 1 : 0;
    rv.octave += octaveAdj;
    return rv;
  }

  // ### smoPitchesToVexKeys
  // Transpose and convert from SMO to VEX format so we can use the VexFlow tables and methods
  static smoPitchesToVexKeys(pitchAr, keyOffset, noteHead) {
    const noopFunc = keyOffset > 0 ? 'addSharps' : 'addFlats';

    const rv = [];
    pitchAr.forEach((pitch) => {
      rv.push(smoMusic.pitchToVexKey(smoMusic[noopFunc](pitch, keyOffset), noteHead));
    });
    return rv;
  }

  static get scaleIntervals() {
    return {
      up: [2, 2, 1, 2, 2, 2, 1],
      down: [1, 2, 2, 2, 1, 2, 2]
    };
  }

  // ### smoScalePitchMatch
  // return true if the pitches match, but maybe not in same octave
  static smoScalePitchMatch(p1, p2) {
    const pp1 = JSON.parse(JSON.stringify(p1));
    const pp2 = JSON.parse(JSON.stringify(p2));
    pp1.octave = 0;
    pp2.octave = 0;

    return smoMusic.smoPitchToInt(pp1) === smoMusic.smoPitchToInt(pp2);
  }

  // ### pitchToLedgerLineInt
  static pitchToLedgerLine(clef, pitch) {
    // return the distance from the top ledger line, as 0.5 per line/space
    return -1.0 * (VF.keyProperties(smoMusic.pitchToVexKey(pitch, clef)).line - 4.5)
     - VF.clefProperties.values[clef].line_shift;
  }
  // ### flagStateFromNote
  // return hard-coded flag state, or flag state as based on pitch and clef
  static flagStateFromNote(clef, note) {
    let fs = note.flagState;
    if (fs ===  SmoNote.flagStates.auto) {
      fs = smoMusic.pitchToLedgerLine(clef, note.pitches[0])
        >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
    }
    return fs;
  }

  // ### pitchToVexKey
  // convert from SMO to VEX format so we can use the VexFlow tables and methods
  // example:
  //   `{letter,octave,accidental}` object to vexKey string `'f#'`
  static _pitchToVexKey(smoPitch) {
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

  static pitchToEasyScore(smoPitch) {
    let vexKey = smoPitch.letter.toLowerCase();
    if (smoPitch.accidental.length === 0) {
      vexKey = vexKey + 'n';
    } else {
      vexKey = vexKey + smoPitch.accidental;
    }
    return vexKey + smoPitch.octave;
  }

  static pitchToVexKey(smoPitch, head) {
    if (!head) {
      return smoMusic._pitchToVexKey(smoPitch);
    }
    return smoMusic._pitchToVexKey(smoPitch) + '/' + head;
  }

  static smoPitchToInt(pitch) {
    if (typeof(pitch.octave) === 'undefined') {
      pitch.octave = 0;
    }
    var intVal = VF.Music.noteValues[
        smoMusic.stripVexOctave(smoMusic.pitchToVexKey(pitch))].int_val;
    var octave =  (pitch.letter === 'c' && pitch.accidental === 'b' && pitch.octave > 0) ?
       pitch.octave - 1 : pitch.octave;
    return octave * 12 + intVal;
  }

  static smoIntToPitch(intValue) {
    let octave = 0;
    let accidental = '';
    let noteKey = '';
    const letterInt = intValue >= 0 ? intValue % 12 :
       12 - (Math.abs(intValue) % 12);
    noteKey = Object.keys(VF.Music.noteValues).find((key) =>
        VF.Music.noteValues[key].int_val === letterInt && key.length === 1
      );
    if (!noteKey) {
      noteKey = Object.keys(VF.Music.noteValues).find((key) =>
          VF.Music.noteValues[key].int_val === letterInt && key.length === 2
        );
    }
    octave = Math.floor(intValue / 12);
    octave = octave >= 0 ? octave : 0;
    accidental = noteKey.substring(1, noteKey.length);
    accidental = accidental ? accidental : 'n';
    return {
      letter: noteKey[0],
      accidental: accidental,
      octave: octave
    };
  }

  // ### vexKeySigWithOffset
  // Consider instrument transpose when setting key -
  // e.g. Eb for Bb instruments is F.
  static vexKeySigWithOffset(vexKey, offset) {
    let newKey = smoMusic.pitchToVexKey(smoMusic.smoIntToPitch(
      smoMusic.smoPitchToInt(
        smoMusic.vexToSmoKey(vexKey)) + offset));
    newKey = smoMusic.toValidKeySignature(newKey);
    return newKey;
  }

  // ### get enharmonics
  // return a map of enharmonics for choosing or cycling.  notes are in vexKey form.
  static get enharmonics() {
    let i = 0;
    const rv = {};
    const keys = Object.keys(VF.Music.noteValues);
    for (i = 0; i < keys.length; ++i) {
      const key = keys[i];
      const int_val = VF.Music.noteValues[key].int_val;
      if (typeof(rv[int_val.toString()]) == 'undefined') {
        rv[int_val.toString()] = [];
      }
      // only consider natural note 1 time.  It is in the list twice for some reason.
      if (key.indexOf('n') === -1) {
        rv[int_val.toString()].push(key);
      }
    }
    return rv;
  }

  static getEnharmonics(vexKey) {
    const proto = smoMusic.stripVexOctave(vexKey);
    const rv = [];
    let ne = smoMusic.getEnharmonic(vexKey);
    rv.push(proto);
    while (ne[0] !== proto[0]) {
      rv.push(ne);
      ne = smoMusic.getEnharmonic(ne);
    }
    return rv;
  }

  // ### getEnharmonic(noteProp)
  // cycle through the enharmonics for a note.
  static getEnharmonic(vexKey) {
    vexKey = smoMusic.stripVexOctave(vexKey);
    const intVal = VF.Music.noteValues[vexKey.toLowerCase()].int_val;
    const ar = smoMusic.enharmonics[intVal.toString()];
    const len = ar.length;
    // 'n' for natural in key but not in value
    vexKey = vexKey.length > 1 && vexKey[1] === 'n' ? vexKey[0] : vexKey;
    const ix = ar.indexOf(vexKey);
    vexKey = ar[(ix + 1) % len];
    return vexKey;
  }

  // ### getKeyFriendlyEnharmonic
  // fix the enharmonic to match the key, if possible
  // `getKeyFriendlyEnharmonic('b','eb');  => returns 'bb'
  static getKeyFriendlyEnharmonic(letter, keySignature) {
    var rv = letter;
    var muse = new VF.Music();
    var scale = Object.values(muse.createScaleMap(keySignature));
    var prop = smoMusic.getEnharmonic(letter.toLowerCase());
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
      prop = smoMusic.getEnharmonic(prop);
    }
    return rv;
  }
  static closestTonic(smoPitch, vexKey, direction) {
    direction = Math.sign(direction) < 0 ? -1 : 1;
    var tonic = smoMusic.vexToSmoKey(vexKey);
    tonic.octave=smoPitch.octave;
    var iix = smoMusic.smoPitchToInt(smoPitch);
    var smint=smoMusic.smoPitchToInt(tonic);
    if (Math.sign(smint - iix) != direction) {
      tonic.octave += direction
    }
    return tonic;
  }

  // ### toValidKeySignature
  // When transposing, make sure key signature is valid, e.g. g# should be
  // Ab
  static toValidKeySignature(vexKey) {
    let strlen = 0;
    var map = {'a#':'bb','g#':'ab','cb':'b','d#':'eb'}
    if (map[vexKey.toLowerCase()]) {
      return map[vexKey.toLowerCase()];
    }
    strlen = (vexKey.length > 2 ? 2 : vexKey.length);
    // Vex doesn't like 'n' in key signatures.
    if (strlen === 2 && vexKey[1].toLowerCase() === 'n') {
      strlen = 1;
    }
    return vexKey.substr(0, strlen);
  }

// ### getEnharmonicInKey
// Get the enharmonic equivalent that most closely matches
// a given key
  static getEnharmonicInKey(smoPitch, keySignature) {
    if (typeof(smoPitch.octave) === 'undefined') {
      smoPitch.octave = 1;
    }
    var sharpKey = keySignature.indexOf('#') >= 0 ? true : false;
    var flatKey = keySignature.indexOf('b') >= 0 ? true : false;
    var ar = smoMusic.getEnharmonics(smoMusic.pitchToVexKey(smoPitch));
    var rv = smoMusic.stripVexOctave(smoMusic.pitchToVexKey(smoPitch));
    var scaleMap = new VF.Music().createScaleMap(keySignature);
    var match = false;
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
    var smoRv = smoMusic.vexToSmoKey(rv);
    smoRv.octave = smoPitch.octave;
    var rvi = smoMusic.smoPitchToInt(smoRv);
    var ori = smoMusic.smoPitchToInt(smoPitch);
    // handle the case of c0 < b0, pitch-wise
    smoRv.octave += Math.sign(ori - rvi);
    return smoRv;
  }

  // ### getIntervalInKey
  // give a pitch and a key signature, return another pitch at the given
  // diatonic interval.  Similar to getKeyOffset but diatonic.
  static getIntervalInKey(pitch, keySignature, interval) {
    if (interval === 0)
      return JSON.parse(JSON.stringify(pitch));

    var delta = interval > 0 ? 1 : -1;
    var inv = -1 * delta;
    var tonic = smoMusic.closestTonic(pitch, keySignature, inv);
    var intervals = delta > 0 ? smoMusic.scaleIntervals.up : smoMusic.scaleIntervals.down;
    var pitchInt = smoMusic.smoPitchToInt(pitch);
    var scaleIx = 0;
    var diatonicIx=0;

    var nkey = tonic;
    var nkeyInt = smoMusic.smoPitchToInt(nkey);
    while (Math.sign(nkeyInt - pitchInt) != delta && Math.sign(nkeyInt - pitchInt) != 0) {
      nkey = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
      scaleIx = (scaleIx + 1) % 7;
      nkeyInt = smoMusic.smoPitchToInt(nkey);
    }
    while (diatonicIx != interval) {
      nkey = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(nkey) + delta * intervals[scaleIx]);
      scaleIx = (scaleIx + 1) % 7;
      diatonicIx += delta;
    }
    return smoMusic.getEnharmonicInKey(nkey,keySignature);
  }

  static getLetterNotePitch(prevPitch, letter, key) {
    const pitch = JSON.parse(JSON.stringify(prevPitch));
    pitch.letter = letter;

    // Make the key 'a' make 'Ab' in the key of Eb, for instance
    const vexKsKey = smoMusic.getKeySignatureKey(letter, key);
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
  static vexKeySignatureTranspose(key, transposeIndex) {
    var key = smoMusic.vexToSmoKey(key);
    key = smoMusic.smoPitchesToVexKeys([key], transposeIndex)[0];
    key = smoMusic.stripVexOctave(key);
    key = key[0].toUpperCase() + key.substring(1, key.length);
    if (key.length > 1 && key[1] === 'n') {
      key = key[0];
    }
    return key;
  }
    static get frequencyMap() {
        return suiAudioPitch.pitchFrequencyMap;
    }

  // ### get letterPitchIndex
  // Used to adjust octave when transposing.
  // Pitches are measured from c, so that b0 is higher than c0, c1 is 1 note higher etc.
  static get letterPitchIndex() {
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

  // ### letterChangedOctave
  // Indicate if a change from letter note 'one' to 'two' needs us to adjust the
  // octave due to the `smoMusic.letterPitchIndex` (b0 is higher than c0)
  static letterChangedOctave(one, two) {
    var p1 = smoMusic.letterPitchIndex[one];
    var p2 = smoMusic.letterPitchIndex[two];
    if (p1 < p2 && p2 - p1 > 2)
      return -1;
    if (p1 > p2 && p1 - p2 > 2)
      return 1;
    return 0;

  }

  static vexToSmoPitch(vexPitch) {
    let octave = 0;
    const po = vexPitch.split('/');
    const rv = smoMusic.vexToSmoKey(po[0]);
    if (po.length > 1) {
      octave = parseInt(po[1], 10);
      octave = isNaN(octave) ? 4 : octave;
    } else {
      octave = 4;
    }
    rv.octave = octave;
    return rv;
  }

  // ### vexToSmoKey
  // Convert to smo pitch, without octave
  // ``['f#'] => [{letter:'f',accidental:'#'}]``
  static vexToSmoKey(vexPitch) {
    var accidental = vexPitch.length < 2 ? 'n' : vexPitch.substring(1, vexPitch.length);
    var pp = vexPitch.split('/')[0];
    return {
      letter: pp[0].toLowerCase(),
      accidental: accidental
    };
  }

  // ### smoPitchToVes
  // {letter:'f',accidental:'#'} => [f#/
  static smoPitchesToVex(pitchAr) {
    var rv = [];
    pitchAr.forEach((p) => {
      rv.push(smoMusic.pitchToVexKey(p));
    });
    return rv;
  }

  static stripVexOctave(vexKey) {
    if (vexKey.indexOf('/') > 0) {
      vexKey = vexKey.substring(0, vexKey.indexOf('/'))
    }
    return vexKey;
  }


  // ### getKeyOffset
  // Given a vex noteProp and an offset, offset that number
  // of 1/2 steps.
  // #### Input:  smoPitch
  // #### Output:  smoPitch offset, not key-adjusted.
  static getKeyOffset(pitch, offset) {
    var canon = VF.Music.canonical_notes;

    // Convert to vex keys, where f# is a string like 'f#'.
    var vexKey = smoMusic.pitchToVexKey(pitch);
    vexKey = smoMusic.vexToCannonical(vexKey);
    var rootIndex = canon.indexOf(vexKey);
    var index = (rootIndex + canon.length + offset) % canon.length;
    var octave = pitch.octave;
    if (Math.abs(offset) >= 12) {
      var octaveOffset = Math.sign(offset) * Math.floor(Math.abs(offset) / 12);
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

  // ### keySignatureLength
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

  static getSharpsInKeySignature(key) {
    var sharpKeys = ['B','G','D','A','E','B','F#','C#'];
    if (sharpKeys.indexOf(key) < 0) {
      return 0;
    }
    return smoMusic.keySignatureLength[key];
  }

  static getFlatsInKeySignature(key) {
    var flatKeys = ['F','Bb','Eb','Ab','Db','Gb','Cb'];
    if (flatKeys.indexOf(key) < 0) {
      return 0;
    }
    return smoMusic.keySignatureLength[key];
  }

  static timeSignatureToTicks(timeSignature) {
    var nd = timeSignature.split('/');
    var num = parseInt(nd[0]);
    var den = parseInt(nd[1]);
    var base = 2048 * (8 / den);
    return base*num;
  }
  static smoTicksToVexDots(ticks) {
    var vd = smoMusic.ticksToDuration[ticks];
    var dots = (vd.match(/d/g) || []).length;
    return dots;
  }
  // ## closestVexDuration
  // ## Description:
  // return the closest vex duration >= to the actual number of ticks. Used in beaming
  // triplets which have fewer ticks then their stem would normally indicate.
  static closestVexDuration(ticks) {
    var stemTicks = VF.RESOLUTION;

    // The stem value is the type on the non-tuplet note, e.g. 1/8 note
    // for a triplet.
    while (ticks <= stemTicks) {
      stemTicks = stemTicks / 2;
    }

    stemTicks = stemTicks * 2;
    return smoMusic.ticksToDuration[stemTicks];
    var ix = Object.keys(smoMusic.ticksToDuration).findIndex((x) => {
        return x >= ticks
      });
    return smoMusic.ticksToDuration[durations[ix]];
  }

  // ### closestDurationTickLtEq
  // Price is right style, closest tick value without going over.  Used to pad
  // rests when reading musicXML.
  static closestDurationTickLtEq(ticks) {
    const sorted = Object.keys(smoMusic.ticksToDuration)
      .map((key) => parseInt(key, 10))
        .filter((key) => key <= ticks);
    return sorted[sorted.length - 1];
  }

  static splitIntoValidDurations(ticks) {
    const rv = [];
    let closest = 0;
    while (ticks > 128) {
      closest = smoMusic.closestDurationTickLtEq(ticks);
      ticks -= closest;
      rv.push(closest);
    }
    return rv;
  }
  // ### vexStemType
  // return the vex stem type (no dots)
  static vexStemType(ticks) {
    const str = smoMusic.ticksToDuration[smoMusic.splitIntoValidDurations(ticks)[0]];
    if (str.indexOf('d') >= 0) {
      return str.substr(0,str.indexOf('d'));
    }
    return str;
  }

  // ### getKeySignatureKey
  // given a letter pitch (a,b,c etc.), and a key signature, return the actual note
  // that you get without accidentals
  // ### Usage:
  //   smoMusic.getKeySignatureKey('F','G'); // returns f#
  static getKeySignatureKey(letter, keySignature) {
    var km = new VF.KeyManager(keySignature);
    return km.scaleMap[letter];
  }

  static getAccidentalForKeySignature(smoPitch, keySignature) {
      var vexKey = smoMusic.getKeySignatureKey(smoPitch.letter,keySignature);
      return vexKey.length == 1 ? 'n' : vexKey.substr(1,vexKey.length - 1);
  }

    // ### isPitchInKeySignature
    // Return true if the pitch is not an accidental in the give key, e.g.
    // f# in 'g' or c in 'Bb'
    static isPitchInKeySignature(smoPitch,keySignature) {
        var vexKey = smoMusic.getKeySignatureKey(smoPitch.letter,keySignature);
        return (vexKey.length == 1 && smoPitch.accidental == 'n' ||
            (vexKey[1]==smoPitch.accidental));
    }

  // ### Description:
  // Get ticks for this note with an added dot.  Return
  // identity if that is not a supported value.
  static getNextDottedLevel(ticks) {
    var ttd = smoMusic.ticksToDuration;
    var vals = Object.values(ttd);

    var ix = vals.indexOf(ttd[ticks]);
    if (ix >= 0 && ix < vals.length && vals[ix][0] == vals[ix + 1][0]) {
      return smoMusic.durationToTicks(vals[ix + 1]);
    }
    return ticks;
  }

  // ### Description:
  // Get ticks for this note with one fewer dot.  Return
  // identity if that is not a supported value.
  static getPreviousDottedLevel(ticks) {
    var ttd = smoMusic.ticksToDuration;
    var vals = Object.values(ttd);
    var ix = vals.indexOf(ttd[ticks]);
    if (ix > 0 && vals[ix][0] == vals[ix - 1][0]) {
      return smoMusic.durationToTicks(vals[ix - 1]);
    }
    return ticks;
  }


  // ### ticksToDuration
  // Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
  static get ticksToDuration() {
    var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
    smoMusic._ticksToDuration = smoMusic['_ticksToDuration'] ? smoMusic._ticksToDuration : null;
    var _ticksToDurationsF = function () {
            var ticksToDuration = smoMusic._ticksToDuration = {};
      for (var i = 0; i < durations.length - 1; ++i) {
        var dots = '';
        var ticks = 0;

        // We support up to 4 'dots'
        for (var j = 0; j <= 4 && j + i < durations.length; ++j) {
          ticks += VF.durationToTicks.durations[durations[i + j]];
          ticksToDuration[ticks.toString()] = durations[i] + dots;
          dots += 'd'
        }
      }
      return ticksToDuration;
    }
        if (!smoMusic._ticksToDuration) {
       _ticksToDurationsF();
        }
    return smoMusic._ticksToDuration;
  };

  // ### durationToTicks
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


  static gcdMap(duration) {
    var keys = Object.keys(smoMusic.ticksToDuration).map((x) => parseInt(x));
    var dar = [];
    var gcd = function(td) {
        var rv = keys[0];
        for (var k = 1 ;k < keys.length; ++k) {
            if (td % keys[k] === 0) {
                rv = keys[k];
            }
        }
        return rv;
    }
    while (duration > 0 && !smoMusic.ticksToDuration[duration]) {
        var div = gcd(duration);
        duration = duration - div;
        dar.push(div);
    }
    if (duration > 0) {
        dar.push(duration);
    }
    return dar.sort((a,b) => a > b ? -1 : 1);
  }
}
