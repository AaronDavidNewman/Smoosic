// eslint-disable-next-line no-unused-vars
class SmoToMidi {
  static convert(score) {
    const beatTime = 128;  // midi ticks per beat
    const converter = new SmoAudioTrack(score, beatTime);
    const smoTracks = converter.convert();
    const trackHash = {};
    const measureBeats = [];
    const trackKeys = Object.keys(smoTracks);
    trackKeys.forEach((trackKey) => {
      const smoTrack = smoTracks[trackKey];
      let tempo = 0;
      let beatsNum = 0;
      let beatsDen = 0;
      if (typeof(trackHash[trackKey]) === 'undefined') {
        trackHash[trackKey] = {
          track: new MidiWriter.Track(),
          lastMeasure: 0
        };
      }
      const track = trackHash[trackKey].track;
      smoTrack.notes.forEach((noteData) => {
        const selectorKey = SmoSelector.getMeasureKey(noteData.selector);
        if (smoTrack.tempoMap[selectorKey]) {
          track.setTempo(smoTrack.tempoMap[selectorKey]);
        }
        if (smoTrack.timeSignatureMap[selectorKey]) {
          const ts = smoTrack.timeSignatureMap[selectorKey];
          track.setTimeSignature(ts.numerator, ts.denominator);
        }
        if (noteData.noteType === 'r') {
          const rest = new MidiWriter.NoteOffEvent({
            channel: parseInt(trackKey, 10) + 1,
            pitch: 'C4',
            duration: 't' + noteData.duration
          });
          track.addEvent(rest);
        } else {
          const pitchArray = smoMusic.smoPitchesToMidiStrings(noteData.pitches);
          const velocity = Math.round(127 * noteData.volume);
          const midiNote = new MidiWriter.NoteEvent({
            channel: parseInt(trackKey, 10) + 1,
            pitch: pitchArray,
            duration: 't' + noteData.duration,
            velocity
          });
          track.addEvent(midiNote);
        }
      });
    });
    const tracks = Object.keys(trackHash).map((key) => trackHash[key].track);
    const writer = new MidiWriter.Writer(tracks);
    return writer.buildFile();
  }
}
