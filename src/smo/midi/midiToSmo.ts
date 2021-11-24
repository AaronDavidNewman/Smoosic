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
import { SmoLayoutManager } from "../data/scoreModifiers";
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
  note: number,
  selector: SmoSelector,
  trackTicks: number
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
 * @param lastNoteOnTick the last tick that had a note, used to create rests
 * @param trackTicks ticks so far in track, used to calculate duration for notes
 * @param measureTicks ticks in the measure used so far
 * @param deltaTime the last recieved non-0 delta time in an event
 * @param ticksInMeasure the total ticks, so we know when to stop the measure
 * @param timeDivision time division data from midi header
 */
interface MidiState {
  timeSignature: TimeSignature,
  tempo: SmoTempoText,
  keySignature: string,
  midiOnNotes: MidiNoteOn[],
  trackNotes: SmoNote[],
  trackMeasures: SmoMeasure[],
  selector: SmoSelector,
  trackTicks: number,
  measureTicks: number,
  deltaTime: number,
  ticksInMeasure: number,
  timeDivision: number
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
        if (mdata === 0) {
          state.keySignature = 'C';
        } else {
        // there seem to be different ways to encode this...
          let signed = mdata / 256;
          if (signed > 7) {
            signed = -1 * (256 - signed);
          }
          if (Math.abs(mdata) < 256) {
            signed = mdata;
          }
          state.keySignature = SmoMusic.midiKeyToVexKey(signed);
        }
      }
    }
  }
  static midiNoteKey(channel: number, note: number): string {
    return channel.toString() + '-' + note.toString();
  }

  static getSmoTicks(midiState: MidiState, midiTicks: number) {
    return 4096 * midiTicks / midiState.timeDivision;
  }
  static getScore(midi: any): SmoScore {
    const midiState: MidiState = {
      keySignature: 'C', tempo: new SmoTempoText(SmoTempoText.defaults), timeSignature: new TimeSignature(TimeSignature.defaults),
      midiOnNotes: [], trackNotes: [], trackMeasures: [], selector: SmoSelector.default,
      trackTicks: 0,
      measureTicks: 0, deltaTime: 0, ticksInMeasure: 0, timeDivision: midi.timeDivision
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
      midiState.trackMeasures = [];
      midiState.measureTicks = 0;
      midiState.trackTicks = 0;
      // go through each track event.
      trackEvents.forEach((trackEvent) => {
        const eot = trackEvent.type === MidiEvent.meta && trackEvent.metaType! === MidiMetaEvent.eot;
        // The delta is the time of this event from the previous one.  If there was measure overflow
        // from the last measure, account for that.
        if (trackEvent.deltaTime > 0) {
          const smoTicks = SmoMusic.closestDurationTickLtEq(MidiToSmo.getSmoTicks(midiState, trackEvent.deltaTime));
          if (smoTicks) {

            // Next note, advance the midi cursor and add the notes we've collected to a new measure
            const smoNote = new SmoNote(SmoNote.defaults);
            smoNote.ticks.numerator = smoTicks;
            if (midiState.midiOnNotes.length) {
              smoNote.pitches = [];
              midiState.midiOnNotes.forEach((mm: MidiNoteOn) => {
                const npitch = SmoMusic.getEnharmonicInKey(SmoMusic.smoIntToPitch(mm.note - 12), midiState.keySignature);
                smoNote.pitches.push(npitch);
              });
              SmoNote.sortPitches(smoNote);
            } else {
              smoNote.noteType = 'r';
            }
            midiState.trackNotes.push(smoNote);
            midiState.midiOnNotes = [];
            midiState.deltaTime = MidiToSmo.getSmoTicks(midiState, trackEvent.deltaTime);
            midiState.trackTicks += midiState.deltaTime;
            midiState.measureTicks += midiState.deltaTime;
            midiState.selector.tick += 1;
          }
        }
        // update changes to tempo, etc.
        MidiToSmo.handleMetadata(trackEvent, midiState);
        if (trackEvent.type === MidiEvent.noteOn) {
          const channel = trackEvent.channel!;
          const mnote = trackEvent.data as number[];
          const note = mnote[0];
          midiState.midiOnNotes.push({
            channel, note, selector: JSON.parse(JSON.stringify(midiState.selector)), trackTicks: midiState.trackTicks
          });
        }
        // Is this the end of a measure?
        if (midiState.trackNotes.length > 0 &&
          (midiState.measureTicks >= midiState.ticksInMeasure || eot)) {
          const defs = SmoMeasure.defaults;
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
        }
      });
      if (midiState.trackMeasures.length > 0) {
        const staffDef = SmoSystemStaff.defaults;
        staffDef.measures = midiState.trackMeasures;
        staves.push(new SmoSystemStaff(staffDef));
      }
    });
    if (staves.length === 0) {
      return SmoScore.getEmptyScore(SmoScore.defaults);
    }
    const scoreDefs = SmoScore.defaults;
    scoreDefs.staves = staves;

    const rv = new SmoScore(scoreDefs);
    const layoutDefaults = rv.layoutManager as SmoLayoutManager;
    // if no scale given in score, default to something small.
    layoutDefaults.globalLayout.svgScale = 0.65;
    layoutDefaults.globalLayout.zoomScale = 1.5;
    return rv;
  }
}