// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
// eslint-disable-next-line no-unused-vars
class SmoToVex {
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
            const duration = smoMusic.ticksToDuration[smoMusic.closestDurationTickLtEq(smoNote.tickCount)];
            if (smoNote.pitches.length > 1) {
              keyString += '(';
            }
            smoNote.pitches.forEach((smoPitch) => {
              const pitch = { key: smoMusic.pitchToVexKey(smoPitch) };
              if (!smoMusic.isPitchInKeySignature(smoPitch, smoMeasure.keySignature)) {
                pitch.accidental = smoPitch.accidental;
              }
              keyString += smoMusic.pitchToEasyScore(smoPitch) + ' ';
              if (pitch.accidental) {
                keyString += pitch.accidental;
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
