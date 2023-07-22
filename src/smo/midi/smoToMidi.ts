// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Support for converting Smo object model to MIDI
 * @module /smo/midi/smoToMidi
 */
import { SmoMusic } from '../data/music';
import { SmoSelector } from '../xform/selections';
import { SmoAudioScore } from '../xform/audioTrack';
import { SmoScore } from '../data/score';
declare var MidiWriter: any;
/*  options: [{

              value: 1,
              label: 'Piano (bowed)'
            }, {
              value: 34,
              label: 'Bass (plucked)'
            }, {
              value: 27,
              label: 'Electric Guitar'
            }, {
              value: 'cello',
              label: 'Cello'
            }, {
              value: 'violin',
              label: 'Violin'
            }, {
              value: 'trumpet',
              label: 'Bb Trumpet'
            }, {
              value: 'horn',
              label: 'F Horn'
            }, {
              value: 'trombone',
              label: 'Trombone'
            }, {
              value: 'tuba',
              label: 'Tuba'
            }, {
              value: 'clarinet',
              label: 'Bb Clarinet'
            },  {
              value: 'altoSax',
              label: 'Eb Alto Sax'
            },  {
              value: 'tenorSax',
              label: 'Bb Tenor Sax'
            },  {
              value: 'bariSax',
              label: 'Eb Bari Sax'
            },  {
              value: 'pad',
              label: 'Synth Pad'
            }, {
              value: 'percussion',
              label: 'Percussion'
            }, {
              value: 'none',
              label: 'None'
            }]*/

export interface MidiTrackHash {
  track: any,
  lastMeasure: number
}

/**
 * Convert a {@link SmoScore} object to MIDI
 * @category SmoToMidi
 */
export class SmoToMidi {
  /**
   * @param score 
   * @returns Midi byte array that can be sent to a file upload widget
   */
  static convert(score: SmoScore) {
    const beatTime = 128;  // midi ticks per beat
    const converter = new SmoAudioScore(score, beatTime);
    const audioScore = converter.convert();
    const smoTracks = audioScore.tracks;
    let currentKey: string = 'C';
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
            if (smoTrack.keyMap[j]) {
              const ksString = smoTrack.keyMap[j];
              const ks = -1 * SmoMusic.getFlatsInKeySignature(ksString) + SmoMusic.getSharpsInKeySignature(ksString);
              track.setKeySignature(ks, 0);
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
              const pitchArray = SmoMusic.smoPitchesToMidiStrings(noteData.pitches);
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
