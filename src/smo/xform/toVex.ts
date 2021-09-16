// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { SmoScore } from '../data/score';

// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
export class SmoToVex {
  static convert(smoScore: SmoScore) {
    smoScore.staves.forEach((smoStaff, staffIx) => {
      smoStaff.measures.forEach((smoMeasure, measureIx) => {
        const voiceStrings: any[] = [];
        const lyricsHash: any = {};
        smoMeasure.voices.forEach((smoVoice, vix) => {
          let keyString = '';
          voiceStrings.push([]);
          smoVoice.notes.forEach((smoNote, nix) => {
            const noteId = 'v' + vix + 'n' + nix;
            let duration = SmoMusic.ticksToDuration[SmoMusic.closestDurationTickLtEq(smoNote.tickCount)];
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
              keyString += SmoMusic.pitchToEasyScore(pitch);
              if (pitchIx + 1 < smoNote.pitches.length) {
                keyString += ' ';
              }
            });
            if (smoNote.pitches.length > 1) {
              keyString += ')';
            }
            keyString += '/' + duration + "[id='" + noteId + "'],";
            smoNote.getTrueLyrics().forEach((lyric) => {
              if (typeof lyricsHash[noteId] === 'undefined') {
                lyricsHash[noteId] = [];
              }
              lyricsHash[noteId].push(lyric.getText());
            });
          });
          voiceStrings.push(keyString);
        });
        console.log('// notes', staffIx, measureIx, '=', JSON.stringify(voiceStrings, null, ''));
        console.log('// lyrics', staffIx, measureIx, '=', JSON.stringify(lyricsHash), null, '');
      });
    });
  }
}
