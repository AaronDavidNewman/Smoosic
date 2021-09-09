// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoMusic } from '../../common/musicHelpers';
import { SmoSelector } from '../xform/selections';
import { SmoAudioScore } from '../xform/audioTrack';
import { SmoScore } from '../data/score';
declare var MidiWriter: any;

export interface MidiTrackHash {
  track: any,
  lastMeasure: number
}

export class SmoToMidi {
  static convert(score: SmoScore) {
    const beatTime = 128;  // midi ticks per beat
    const converter = new SmoAudioScore(score, beatTime);
    const audioScore = converter.convert();
    const smoTracks = audioScore.tracks;
    const trackHash: Record<number | string, MidiTrackHash> = {};
    smoTracks.forEach((smoTrack, trackIx) => {
      let j = 0;
      if (typeof(trackHash[trackIx]) === 'undefined') {
        trackHash[trackIx] = {
          track: new MidiWriter.Track(),
          lastMeasure: 0
        };
      }
      const track = trackHash[trackIx].track;
      // eslint-disable-next-line
      audioScore.repeatMap.forEach((measureMap) => {
        for (j = measureMap.startMeasure; j <= measureMap.endMeasure; ++j) {
          // eslint-disable-next-line
          const notes = smoTrack.notes.filter((nn) => nn.selector.measure === j);
          notes.forEach((noteData) => {
            const selectorKey = SmoSelector.getMeasureKey(noteData.selector);
            if (smoTrack.tempoMap[selectorKey]) {
              track.setTempo(smoTrack.tempoMap[selectorKey]);
            }
            if (smoTrack.timeSignatureMap[selectorKey]) {
              const ts = smoTrack.timeSignatureMap[selectorKey];
              track.setTimeSignature(ts.numerator, ts.denominator);
            }
            if (noteData.noteType === 'r') {
              if (!noteData.padding) {
                const rest = new MidiWriter.NoteOffEvent({
                  channel: trackIx + 1,
                  pitch: 'C4',
                  duration: 't' + noteData.duration
                });
                track.addEvent(rest);
              }
            } else {
              const pitchArray = smoMusic.smoPitchesToMidiStrings(noteData.pitches);
              const velocity = Math.round(127 * noteData.volume);
              const midiNote = new MidiWriter.NoteEvent({
                channel: trackIx + 1,
                pitch: pitchArray,
                duration: 't' + noteData.duration,
                velocity
              });
              track.addEvent(midiNote);
            }
          });
        }
      });
    });
    const tracks = Object.keys(trackHash).map((key) => trackHash[key].track);
    const writer = new MidiWriter.Writer(tracks);
    return writer.buildFile();
  }
}
