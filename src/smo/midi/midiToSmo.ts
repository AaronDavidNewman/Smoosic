/**
 * Convert midi to Smo object model.  Midi parsing code from:
 * (https://github.com/colxi/midi-parser-js)
 * @module /smo/midi/midiToSmo
 */
import { Clef, Pitch } from "../data/common";
import { SmoMeasure } from "../data/measure";
import { SmoTempoText, TimeSignature } from "../data/measureModifiers";
import { SmoMusic } from "../data/music";
import { SmoNote } from "../data/note";
import { SmoScore } from "../data/score";
import { SmoSystemStaff } from "../data/systemStaff";
import { SmoSelector } from "../xform/selections";

export interface MidiTrackEvent {
  deltaTime: number,
  type: number,
  metaType?: number,
  channel?: number,
  data: number | number[]
}
interface MidiNoteOn {
  channel: number,
  note: number
}
/**
 * MIDI is event driven.  We keep information about the events when
 * creating the Smo object model
 * @param timeSignature created from time signature event
 * @param tempo created from tempo event
 * @param keySignature created from key signature event
 * @param startedNotes notes we've already created, because chords are created from multiple MIDI events
 * @param midiOnNotes received ON events, until we match them with their OFF
 * @param trackNotes notes to be added to the current track
 * @param overflowNotes notes that extend beyond the current measure
 * @param trackMeasures completed measures
 * @param selector current selector in the score
 * @param measureTicks ticks in the measure used so far
 * @param deltaTime the last recieved non-0 delta time in an event
 * @param ticksInMeasure the total ticks, so we know when to stop the measure
 */
interface MidiState {
  timeSignature: TimeSignature,
  tempo: SmoTempoText,
  keySignature: string,
  startedNotes: Record<string, SmoNote>,
  midiOnNotes: Record<string, MidiNoteOn>,
  trackNotes: SmoNote[],
  overflowNotes: SmoNote[],
  trackMeasures: SmoMeasure[],
  selector: SmoSelector,
  measureTicks: number,
  deltaTime: number,
  ticksInMeasure: number
}
export var MidiEvent: Record<string, number> = {
  noteOff: 8,
  noteOn: 9,
  aftertouch: 10,
  controller: 11,
  programChange: 12,
  channelAftertouch: 13,
  pitchBend: 14,
  meta: 255
}
export var MidiMetaEvent: Record<string, number> = {
  trackName: 3,
  lyrics: 5,
  channelPrefix: 32,
  eot: 47,
  tempo: 81,
  timeSignature: 88,
  keySignature: 89
}
/**
 * Converts a JSON midi file to a {@link SmoScore}
 * @category SmoToMidi
 */
export class MidiToSmo {
  /**
   * Since midi has very little metadata, we don't know the original clef.
   * so just use the one (treble or bass) that uses the fewest ledger lines
   * @param notes notes in measure
   * @returns 
   */
  static guessClefForNotes(notes: SmoNote[]): Clef {
    let trebleMax = 0;
    let bassMax = 0;
    notes.forEach((note) => {
      note.pitches.forEach((pitch) => {
        const tl = Math.abs(SmoMusic.pitchToLedgerLine('treble', pitch));
        const bl = Math.abs(SmoMusic.pitchToLedgerLine('bass', pitch));
        trebleMax = Math.max(trebleMax, tl);
        bassMax = Math.max(bassMax, bl);
      })
    });
    const clef: Clef = trebleMax <= bassMax ? 'treble' : 'bass';
    // For rests, make sure the rest is centered in the clef
    notes.forEach((note) => {
      if (note.noteType === 'r') {
        note.pitches = [SmoMeasure.defaultPitchForClef[clef]];
      }
    });
    return clef;
  }
  static handleMetadata(trackEvent: MidiTrackEvent, state: MidiState) {
    if (trackEvent.type === MidiEvent.meta) {
      const mtype = trackEvent.metaType!;
      if (mtype === MidiMetaEvent.timeSignature) {
        /**
         * whenever we get a time signature event, recompute ticks per measure
         */
        const mdata = trackEvent.data as number[];
        const numerator = mdata[0];
        const denominator = Math.pow(2, mdata[1]);
        const tsDef = TimeSignature.defaults;
        tsDef.actualBeats = numerator;
        tsDef.beatDuration = denominator;
        state.timeSignature = new TimeSignature(tsDef);
        state.ticksInMeasure = SmoMusic.timeSignatureToTicks(state.timeSignature.timeSignature);
      } else if (mtype === MidiMetaEvent.tempo) {
        const mpq = trackEvent.data as number;
        const bpm = (1000000 * 60) / mpq;
        const tempoDef = SmoTempoText.defaults;
        tempoDef.bpm = bpm;
        state.tempo = new SmoTempoText(tempoDef);
      } else if (mtype === MidiMetaEvent.keySignature) {
        const mdata = trackEvent.data as number;
        let signed = mdata / 256;
        if (signed > 7) {
          signed = -1 * (256 - signed);
        }
        state.keySignature = SmoMusic.midiKeyToVexKey(signed);
      }
    }
  }
  static midiNoteKey(channel: number, note: number): string {
    return channel.toString() + '-' + note.toString();
  }
  /**
   * Midi is event based, so we create the note when we get note off event.  If there is
   * a saved note on event, we base the note from that.  A note off with no note on means a rest.
   * @param midiState
   * @param curTicks the ticks to take up for this note
   * @param channel midi channel
   * @param midiNote midi note number
   */
  static handleNoteOff(midiState: MidiState, curTicks: number, channel: number, midiNote: number) {
    // Create a key to lookup the start of the note
    const noteKey = MidiToSmo.midiNoteKey(channel, midiNote);
    const selectorKey = SmoSelector.getNoteKey(midiState.selector);
    const noteDefaults = SmoNote.defaults;
    noteDefaults.ticks.numerator = curTicks;
    const sn = new SmoNote(SmoNote.defaults);
    if (midiState.midiOnNotes[noteKey]) {
      const noteInfo = midiState.midiOnNotes[noteKey];
      const pitchAr: Pitch[] = [];
        // If there is already a note at this location, just add this pitch to the chord.  Otherwise make a new note
        const npitch = SmoMusic.getEnharmonicInKey(SmoMusic.smoIntToPitch(noteInfo.note - 12), midiState.keySignature);
        if (midiState.startedNotes[selectorKey]) {
          midiState.startedNotes[selectorKey].pitches.push(npitch);
        } else {
          pitchAr.push(npitch);
        }
      if (pitchAr.length) {
        midiState.startedNotes[selectorKey] = sn;
        sn.pitches = pitchAr;
        sn.keySignature = midiState.keySignature;
      }
    } else {      
      sn.noteType = 'r';
    }
    // If this note doesn't fit in the current measure, store it for later
    if (midiState.measureTicks > midiState.ticksInMeasure) {
      midiState.overflowNotes.push(sn);
    } else {
      midiState.trackNotes.push(sn);
    }
  }
  static getScore(midi: any): SmoScore {
    // the ratio of SMO ticks to MIDI ticks
    let tickMultiplier: number = 4096 / midi.timeDivision;

    const midiState: MidiState = {
      keySignature: 'C', tempo: new SmoTempoText(SmoTempoText.defaults), timeSignature: new TimeSignature(TimeSignature.defaults),
      startedNotes: {}, midiOnNotes: {}, trackNotes: [], overflowNotes: [], trackMeasures: [], selector: SmoSelector.default,
      measureTicks: 0, deltaTime: 0, ticksInMeasure: 0
    };
    midiState.ticksInMeasure = SmoMusic.timeSignatureToTicks(midiState.timeSignature.timeSignature);
    let staves: SmoSystemStaff[] = [];
    // go through the tracks
    midi.track.forEach((track: any, trackIx: number) => {
      const trackEvents = track.event as MidiTrackEvent[];
      // The number of ticks in the measure so far, including current event
      midiState.selector.staff = trackIx;
      midiState.selector.measure = 0;
      midiState.selector.tick = 0;
      // go through each track event.
      trackEvents.forEach((trackEvent) => {
        const eot = trackEvent.type === MidiEvent.meta && trackEvent.metaType! === MidiMetaEvent.eot;
        // The delta is the time of this event from the previous one.  If there was measure overflow
        // from the last measure, account for that.
        if (trackEvent.deltaTime > 0) {
          // Next note, advance the midi cursor and add the notes we've collected to a new measure
          midiState.deltaTime = trackEvent.deltaTime * tickMultiplier;
          midiState.measureTicks += trackEvent.deltaTime * tickMultiplier;
          midiState.selector.tick += 1;
        }
        // update changes to tempo, etc.
        MidiToSmo.handleMetadata(trackEvent, midiState);
        if (trackEvent.type === MidiEvent.noteOff) {
          const channel = trackEvent.channel!;
          const mnote = trackEvent.data as number[];
          const midiNote = mnote[0];
          const noteKey = MidiToSmo.midiNoteKey(channel, midiNote);
          let duration = midiState.deltaTime;
          let ovf = 0;
          if (midiState.measureTicks > midiState.ticksInMeasure) {
            ovf = midiState.measureTicks - midiState.ticksInMeasure;
            midiState.measureTicks -= ovf; // make the measure come out in the right place
            duration = duration - ovf;
            midiState.deltaTime = duration;
          }
          const currentDurations = SmoMusic.splitIntoValidDurations(duration);
          // If the duration overflows the measure, put the overflow part in the next measure
          currentDurations.forEach((curTicks: number) => {
            MidiToSmo.handleNoteOff(midiState, curTicks, channel, midiNote);
          });
          if (ovf > 0) {
            midiState.measureTicks += ovf; // make the measure come out in the right place
            midiState.deltaTime = ovf;
            // Pre-increment the selector, since this note will go in the next measure
            midiState.selector.measure += 1;
            midiState.selector.tick = 0;
            const ovfDurations = SmoMusic.splitIntoValidDurations(ovf);
            ovfDurations.forEach((curTicks: number) => {
              MidiToSmo.handleNoteOff(midiState, curTicks, channel, midiNote);
            });            
          }
          delete midiState.midiOnNotes[noteKey];
        } else if (trackEvent.type === MidiEvent.noteOn) {
          const channel = trackEvent.channel!;
          const mnote = trackEvent.data as number[];
          const note = mnote[0];
          const noteKey = MidiToSmo.midiNoteKey(channel, note);
          midiState.midiOnNotes[noteKey] = {
            channel, note
          };
        }
        // Is this the end of a measure?
        if (midiState.trackNotes.length > 0 && 
          (midiState.measureTicks >= midiState.ticksInMeasure || eot)) {
          const defs = SmoMeasure.defaults;
          const overflow = midiState.overflowNotes.length > 0;
          defs.clef = MidiToSmo.guessClefForNotes(midiState.trackNotes);
          midiState.trackNotes.forEach((snote) => {
            snote.clef = defs.clef;
          });
          defs.voices[0] = { notes: midiState.trackNotes };
          defs.timeSignature = midiState.timeSignature;
          defs.tempo = midiState.tempo;
          defs.keySignature = midiState.keySignature;
          midiState.trackMeasures.push(new SmoMeasure(defs));
          midiState.trackNotes = [];
          midiState.measureTicks = 0;
          midiState.selector.tick = 0;
          midiState.deltaTime = 0;
          // If there was overflow, we already did this.
          if (!overflow) {
            midiState.selector.measure += 1;
          }
          // If a note in the last measure was tied, update the
          // ticks and selection count.
          midiState.overflowNotes.forEach((sn: SmoNote) => {
            midiState.measureTicks += sn.tickCount;
            midiState.selector.tick += 1;
            midiState.trackNotes.push(sn);
          });
          midiState.overflowNotes = [];
        }
      });
      const staffDef = SmoSystemStaff.defaults;
      staffDef.measures = midiState.trackMeasures;
      staves.push(new SmoSystemStaff(staffDef));
    });
    if (staves.length === 0) {
      return SmoScore.getEmptyScore(SmoScore.defaults);
    }
    const scoreDefs = SmoScore.defaults;
    scoreDefs.staves = staves;
    return new SmoScore(scoreDefs);
  }
}