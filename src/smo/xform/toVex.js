// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoMusic } from '../../common/musicHelpers';

// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
// eslint-disable-next-line no-unused-vars
export class SmoToVex {
  static convert(smoScore) {
    smoScore.staves.forEach((smoStaff) => {
      smoStaff.measures.forEach((smoMeasure) => {
        const voiceStrings = [];
        const lyricsHash = {};
        smoMeasure.voices.forEach((smoVoice, vix) => {
          let keyString = '';
          voiceStrings.push([]);
          smoVoice.notes.forEach((smoNote, nix) => {
            const noteId = 'v' + vix + 'n' + nix;
            let duration = smoMusic.ticksToDuration[smoMusic.closestDurationTickLtEq(smoNote.tickCount)];
            duration = duration.replaceAll('d', '.');
            if (smoNote.pitches.length > 1) {
              keyString += '(';
            }
            smoNote.pitches.forEach((smoPitch, pitchIx) => {
              // Create a copy of the pitch.  If the accidental is not displayed, ignore it
              const pitch = { letter: smoPitch.letter, accidental: '', octave: smoPitch.octave };
              if (smoNote.accidentalsRendered && smoNote.accidentalsRendered[pitchIx].length) {
                pitch.accidental = smoPitch.accidental;
              }
              keyString += smoMusic.pitchToEasyScore(pitch);
              if (pitchIx + 1 < smoNote.pitches.length) {
                keyString += ' ';
              }
            });
            if (smoNote.pitches.length > 1) {
              keyString += ')';
            }
            keyString +=  '/' + duration + "[id='" + noteId + "'],";
            smoNote.getTrueLyrics().forEach((lyric) => {
              if (typeof lyricsHash[noteId] === 'undefined') {
                lyricsHash[noteId] = [];
              }
              lyricsHash[noteId].push(lyric.getText());
            });
          });
          voiceStrings.push(keyString);
        });
        console.log(JSON.stringify(voiceStrings, null, ''));
        console.log(JSON.stringify(lyricsHash), null, '');
      });
    });
  }
}
