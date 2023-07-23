// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { SmoScore } from '../data/score';

export class SmoToVexNote {
  ctor: string;
  constructor(init: string) {
    this.ctor = init;
  }
}
// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
export class SmoToVex {
  static convert(smoScore: SmoScore, options: any) {
    let useId = false;
    let page = 0;
    options = options ?? {};
    if (typeof(options['id']) === 'boolean') {
      useId = options.id
    }
    if (typeof(options['page'] === 'number')) {
      page = options.page;
    }
    smoScore.staves.forEach((smoStaff, staffIx) => {
      for (var i = 0; i < smoStaff.measures.length; ++i) {
        let beamGroup = [];
        
        let beaming = false;
        const smoMeasure = smoStaff.measures[i];
        const measureIx = i;
        if (smoMeasure.svg.pageIndex !== page) {
          continue;
        }
        const voiceStrings: any[] = [];
        const lyricsHash: any = {};
        smoMeasure.voices.forEach((smoVoice, vix) => {
          let keyString = '';
          voiceStrings.push([]);
          smoVoice.notes.forEach((smoNote, nix) => {
            const noteId = 'v' + vix + 'n' + nix;
            let duration = SmoMusic.ticksToDuration[SmoMusic.closestDurationTickLtEq(smoNote.tickCount)];
            if (beaming === true && smoNote.tickCount >= 4096) {
              beaming = false;
              keyString = keyString + ",{ stem: 'up' })";
            }
            if (beaming === false && smoNote.tickCount < 4096 && smoNote.endBeam === false) {
              beaming = true;
              keyString = keyString + 'beam(notes(';
            }
            duration = duration.replaceAll('d', '.');
            if (smoNote.pitches.length > 1) {
              keyString += '(';
            }
            smoNote.pitches.forEach((smoPitch, pitchIx) => {
              // Create a copy of the pitch.  If the accidental is not displayed, ignore it
              const pitch = { letter: smoPitch.letter, accidental: '', octave: smoPitch.octave };
              if (smoNote.accidentalsRendered && smoNote.accidentalsRendered.length && smoNote.accidentalsRendered[pitchIx].length) {
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
            keyString += '/' + duration;
            if (useId) {
              keyString += "[id='" + noteId + "'],";
            }
            if (beaming && smoNote.endBeam)  {
              keyString = keyString + ')';
              beaming = false;
            }

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
      };
    });
  }
}
