// eslint-disable-next-line no-unused-vars
class SmoToMidi {
  static convert(score) {
    const trackHash = {};
    const measureBeats = [];
    let measureIx = 0;
    const beatTime = 128;  // midi ticks per beat
    const timeDiv = 4096 / 128; // convert Smo ticks to midi
    score.staves.forEach((staff, staffIx) => {
      staff.measures.forEach((measure, measureIx) => {
        measure.voices.forEach((voice, voiceIx) => {
          let j = 0;
          let duration = 0;
          const trackKey = (score.staves.length * voiceIx) + staffIx;
          if (typeof(trackHash[trackKey]) === 'undefined') {
            trackHash[trackKey] = {
              track: new MidiWriter.Track(),
              lastMeasure: 0
            };
          }
          const trackObj = trackHash[trackKey];
          const track = trackObj.track;
          // staff 0/voice 0, set track values for the measure
          if (voiceIx === 0) {
            if (staffIx === 0) {
              measureBeats.push(measure.getMaxTicksVoice());
            }
            track.setTempo(measure.tempo.bpm);
            track.setTimeSignature(measure.numBeats, measure.beatValue);
          }
          // If this voice is not in every measure, fill in the space
          // in its own channel.
          while (trackObj.lastMeasure < measureIx) {
            duration += 128 * measureBeats[trackObj.lastMeasure];
            const rest = new MidiWriter.NoteOffEvent({
              channel: trackKey,
              pitch: 'C4',
              duration: 't' + duration
            });
            track.addEvent(rest);
            trackObj.lastMeasure += 1;
          }
          let tupletTicks = 0;
          voice.notes.forEach((note) => {
            const tuplet = measure.getTupletForNote(note);
            if (tuplet && tuplet.getIndexOfNote(note) === 0) {
              tupletTicks = tuplet.tupletTicks / timeDiv;
            }
            if (tupletTicks) {
              // tuplet likely won't fit evenly in ticks, so
              // use remainder in last tuplet note.
              if (tuplet.getIndexOfNote(note) === tuplet.notes.length - 1) {
                duration = tupletTicks;
                tupletTicks = 0;
              }
              else {
                duration = note.tickCount / timeDiv;
                tupletTicks -= duration;
              }
            } else {
              duration = note.tickCount / timeDiv;
            }
            if (note.isRest()) {
              const rest = new MidiWriter.NoteOffEvent({
                channel: trackKey + 1,
                pitch: 'C4',
                duration: 't' + duration
              });
              track.addEvent(rest);
            } else {
              const pitchArray = smoMusic.smoPitchesToMidiStrings(note.pitches);
              const midiNote = new MidiWriter.NoteEvent({
                channel: trackKey + 1,
                pitch: pitchArray,
                duration: 't' + duration
              });
              track.addEvent(midiNote);
            }
          });
          trackObj.lastMeasure += 1;
        });
      });
    });
    const tracks = Object.keys(trackHash).map((key) => trackHash[key].track);
    const writer = new MidiWriter.Writer(tracks);
    return writer.buildFile();
  }
}
