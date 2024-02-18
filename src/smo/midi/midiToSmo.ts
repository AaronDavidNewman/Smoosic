// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Convert midi to Smo object model.  Midi parsing code from:
 * @module /smo/midi/midiToSmo
 */
import { SmoToMidi } from "./smoToMidi";
import { Clef, Pitch } from "../data/common";
import { SmoMeasure } from "../data/measure";
import { SmoTempoText, TimeSignature } from "../data/measureModifiers";
import { SmoMusic } from "../data/music";
import { SmoNote } from "../data/note";
import { SmoScore } from "../data/score";
import { SmoLayoutManager } from "../data/scoreModifiers";
import { SmoTie } from "../data/staffModifiers";
import { SmoSystemStaff } from "../data/systemStaff";
import { SmoTuplet } from "../data/tuplet";

export type MidiEventType = 'text' | 'copyrightNotice' | 'trackName' | 'instrumentName' | 'lyrics' | 'marker' |
  'cuePoint' | 'channelPrefix' | 'portPrefix' | 'endOfTrack' | 'setTempo' | 'smpteOffset' | 'timeSignature' | 'keySignature' |
  'sequencerSpecific' | 'unknownMeta' |
  'noteOff' | 'noteOn' | 'noteAftertouch' | 'controller' | 'programChange' | 'channelAftertouch' | 'pitchBend';

/**
 * These are the midi events as defined by the parser.
 */
export interface MidiTrackEvent {
  deltaTime: number,
  meta?: boolean,
  numerator?: number,
  denominator?: number,
  microsecondsPerBeat?: number,
  scale?: number,
  key?: number,
  metronome?: number,
  thirtyseconds?: number,
  type: MidiEventType,
  channel?: number,
  noteNumber?: number,
  velocity?: number
}
export interface RunningMetadata {
  keySignature: string,
  timeSignature: TimeSignature,
  tempo: SmoTempoText
}
export interface MidiNoteOn {
  channel: number,
  note: number,
  smoIndex: number
}
export interface MidiTupletInfo {
  numNotes: number,
  stemTicks: number,
  totalTicks: number,
  isLast: boolean
}
export interface EventSmoData {
  pitches: Pitch[],
  durationTicks: number,
  tupletInfo: MidiTupletInfo | null,
  isRest: boolean,
  isTied: boolean,
  timeSignature: TimeSignature,
  tempo: SmoTempoText,
  keySignature: string,
  measure: number,
  tick: number
}

export function getValueForTick<T>(arg: Record<number, T>, tick: number) {
  const keys = Object.keys(arg);
  let maxKey = 0;
  let rv = arg[0];
  keys.forEach((key) => {
    const keyInt = parseInt(key, 10);
    if (keyInt <= tick && keyInt > maxKey && arg[keyInt]) {
      rv = arg[maxKey];
      maxKey = keyInt;
    }
  });
  return rv;
}
/**
 * Converts a JSON midi file to a {@link SmoScore}
 * @category SmoToMidi
 */
export class MidiToSmo {
  timeSignatureMap: Record<number, TimeSignature> = {};
  tempoMap: Record<number, SmoTempoText> = {};
  keySignatureMap: Record<number, string> = {};
  tieMap: Record<number, number[]> = {};
  timeDivision: number = 480;
  trackIndex: number = 0;
  eventIndex: number = 0; // index into current track
  maxMeasure: number = 0;
  quantizeTicks: number = MidiToSmo.quantizeTicksDefault;
  eot: boolean = false;
  midiOnNotes: Record<number, MidiNoteOn[]> = {};

  midi: any; // MIDI JSON from MIDI parser
  static get quantizeTicksDefault() {
    return 1024;
  }
  /**
   * Since midi has very little metadata, we don't know the original clef.
   * so just use the one (treble or bass) that uses the fewest ledger lines
   * @internal
   * @param notes notes in measure
   * @returns 
   */
  static guessClefForNotes(measure: SmoMeasure): Clef {
    let trebleMax = 0;
    let bassMax = 0;
    measure.voices[0].notes.forEach((note) => {
      note.pitches.forEach((pitch) => {
        const tl = Math.abs(SmoMusic.pitchToStaffLine('treble', pitch));
        const bl = Math.abs(SmoMusic.pitchToStaffLine('bass', pitch));
        trebleMax = Math.max(trebleMax, tl);
        bassMax = Math.max(bassMax, bl);
      })
    });
    const clef: Clef = trebleMax <= bassMax ? 'treble' : 'bass';
    measure.clef = clef;
    // For rests, make sure the rest is centered in the clef
    measure.voices[0].notes.forEach((note) => {
      if (note.noteType === 'r') {
        note.pitches = [SmoMeasure.defaultPitchForClef[clef]];
      }
      note.clef = clef;
    });
    return clef;
  }
  /**
   * Create an object to convert MIDI to a {@link SmoScore}
   * @param midi the output of midi parser
   * @param quantizeDuration ticks to quantize (1024 == 16th note)
   */
  constructor(midi: any, quantizeDuration: number) {
    this.midi = midi;
    // console.log(JSON.stringify(midi, null, ''));
    this.timeSignatureMap[0] = new TimeSignature(TimeSignature.defaults);
    this.tempoMap[0] = new SmoTempoText(SmoTempoText.defaults);
    this.keySignatureMap[0] = 'c';
    this.timeDivision = midi.header.ticksPerBeat;
    this.quantizeTicks = quantizeDuration;
  }
  /**
   * @internal
   * @param ticks 
   * @returns 
   */
  getTempo(ticks: number) {
    if (this.tempoMap[ticks]) {
      return this.tempoMap[ticks];
    }
    return getValueForTick(this.tempoMap, ticks);
  }
  /**
   * @internal
   * @param ticks 
   * @returns 
   */
  getTimeSignature(ticks: number): TimeSignature {
    if (this.timeSignatureMap[ticks]) {
      return this.timeSignatureMap[ticks];
    }
    return getValueForTick(this.timeSignatureMap, ticks);
  }
  /**
   * @internal
   * @param ticks 
   * @returns 
   */
  getKeySignature(ticks: number) {
    if (this.keySignatureMap[ticks]) {
      return this.keySignatureMap[ticks];
    }
    return getValueForTick(this.keySignatureMap, ticks);
  }
  /**
   * Get metadata from the map for this point in the score
   * @param ticks current point in track
   * @returns 
   */
  getMetadata(ticks: number) {
    return { tempo: this.getTempo(ticks), timeSignature: this.getTimeSignature(ticks), keySignature: this.getKeySignature(ticks) };
  }
  /**
   * We process 3 types of metadata at present:  time signature, tempo and keysignature.
   * @param trackEvent 
   * @param ticks 
   */
  handleMetadata(trackEvent: MidiTrackEvent, ticks: number) {
    if (trackEvent.meta) {
      const mtype = trackEvent.type;
      if (mtype === 'timeSignature') {
        /**
         * whenever we get a time signature event, recompute ticks per measure
         */
        const numerator = trackEvent.numerator!;
        const denominator = trackEvent.denominator!;
        const tsDef = TimeSignature.defaults;
        tsDef.actualBeats = numerator;
        tsDef.beatDuration = denominator;
        const ts = new TimeSignature(tsDef);
        this.timeSignatureMap[ticks] = ts;
      } else if (mtype === 'setTempo') {
        const bpm = 60 / (trackEvent.microsecondsPerBeat! / 1000000);
        const tempoDef = SmoTempoText.defaults;
        tempoDef.bpm = bpm;
        this.tempoMap[ticks] = new SmoTempoText(tempoDef);
      } else if (mtype === 'keySignature') {
        const mdata = trackEvent.key!;
        if (mdata === 0) {
          this.keySignatureMap[ticks] = 'C';
        } else {
          // there seem to be different ways to encode this...
          let signed = mdata / 256;
          if (signed > 7) {
            signed = -1 * (256 - signed);
          }
          if (Math.abs(mdata) < 256) {
            signed = mdata;
          }
          this.keySignatureMap[ticks] = SmoMusic.midiKeyToVexKey(signed);
        }
      }
    }
  }
  /**
   * Convert from Midi PPQ to Smoosic (and vex) ticks
   * @internal
   */
  getSmoTicks(midiTicks: number) {
    return 4096 * midiTicks / this.timeDivision;
  }
  /**
   * @internal
   */
  createNewEvent(metadata: RunningMetadata): EventSmoData {
    return {
      pitches: [], durationTicks: 0, tupletInfo: null, isRest: false, timeSignature: new TimeSignature(metadata.timeSignature),
      tempo: new SmoTempoText(metadata.tempo), keySignature: metadata.keySignature, measure: 0, tick: 0, isTied: false
    };
  }
  /**
   * @internal
   */
  static copyEvent(o: EventSmoData): EventSmoData {
    const pitches = JSON.parse(JSON.stringify(o.pitches));
    const timeSignature = new TimeSignature(o.timeSignature);
    const tempo = new SmoTempoText(o.tempo);
    return ({
      pitches, durationTicks: o.durationTicks, tupletInfo: o.tupletInfo, isRest: o.isRest, timeSignature, tempo, keySignature: o.keySignature,
      measure: o.measure, tick: o.tick, isTied: o.isTied
    });
  }
  /**
   * @internal
   */
  addToTieMap(measureIndex: number) {
    const staffIx = this.trackIndex;
    if (typeof (this.tieMap[staffIx]) === 'undefined') {
      this.tieMap[staffIx] = [];
    }
    this.tieMap[staffIx].push(measureIndex);
  }
  /**
   * Step 3 in the 3-step process.  Quantize the note durations and convert the midi
   * event into SmoNotes.
   * @param events 
   * @returns 
   */
  createNotesFromEvents(events: EventSmoData[]): SmoMeasure[] {
    let measureIndex = 0;
    const measures: SmoMeasure[] = [];
    let measure: SmoMeasure | null = null;
    let deficit = 0;
    // If the midi event is smaller than the smallest note..
    const smallest = 1 * (this.quantizeTicks / 4);
    events.forEach((ev) => {
      if (measure === null || ev.measure > measureIndex) {
        const measureDefs = SmoMeasure.defaults;
        measureDefs.keySignature = ev.keySignature;
        measureDefs.timeSignature = new TimeSignature(ev.timeSignature);
        measureDefs.tempo = new SmoTempoText(ev.tempo);
        measure = new SmoMeasure(measureDefs);
        measure.voices.push({ notes: [] });
        measureIndex = ev.measure;
        measures.push(measure);
      }
      if (Math.abs(ev.durationTicks - deficit) < smallest && !(ev.tupletInfo !== null)) {
        deficit = deficit - ev.durationTicks;
      } else {
        const best = SmoMusic.midiTickSearch(ev.durationTicks - deficit, this.quantizeTicks);
        deficit += best.result - ev.durationTicks;
        ev.durationTicks = best.result;
        const defs = SmoNote.defaults;
        defs.ticks.numerator = ev.durationTicks;
        defs.pitches = JSON.parse(JSON.stringify(ev.pitches));
        defs.noteType = ev.isRest ? 'r' : 'n';
        const note = new SmoNote(defs);
        SmoNote.sortPitches(note);
        measure.voices[0].notes.push(note);
        if (ev.tupletInfo !== null && ev.tupletInfo.isLast === true) {
          const voiceLen = measure.voices[0].notes.length;
          const tupletNotes = [note, measure.voices[0].notes[voiceLen - 2], measure.voices[0].notes[voiceLen - 3]];
          const defs = SmoTuplet.defaults;
          defs.notes = tupletNotes;
          defs.stemTicks = ev.tupletInfo.stemTicks;
          defs.numNotes = ev.tupletInfo.numNotes;
          defs.totalTicks = ev.tupletInfo.totalTicks;
          defs.startIndex = voiceLen - 3;
          measure.tuplets.push(new SmoTuplet(defs));
        }
        if (ev.isTied) {
          this.addToTieMap(measureIndex);
        }
      }
    });
    measures.forEach((measure) => {
      measure.clef = MidiToSmo.guessClefForNotes(measure);
    });
    return measures;
  }
  /**
   * @param ticks 
   * @returns the length in ticks of a triplet, if this looks like a triplet.  Otherwise 0
   */
  tripletType(ticks: number): number {
    const tripletBeat = Math.round(4096 / 3);
    const tripletHalf = Math.round((4096 * 2) / 3);
    const tripletEighth = Math.round((4096 / 2) / 3);
    const beatTrip = tripletBeat / ticks;
    const eigthTrip = tripletEighth / ticks;
    const halfTrip = tripletHalf / ticks;
    if (Math.abs(1 - beatTrip) < 0.05) {
      return 4096;
    }
    if (Math.abs(1 - eigthTrip) < 0.05) {
      return 2048;
    }
    if (Math.abs(1 - halfTrip) < 0.05) {
      return 4096 * 2;
    }
    return 0;
  }
  /**
   * step 2 in the 3 step process.  Divide the music up into measures based on
   * tick duration.  If there are events overlapping measures, create extra events in the
   * new measure (hence the expand) and shorten the original event
   * @param events
   * @returns 
   */
  expandMidiEvents(events: EventSmoData[]): EventSmoData[] {
    const rv: EventSmoData[] = [];
    if (events.length === 0) {
      return rv;
    }
    let i = 0;
    let ticksSoFar = 0;
    let measure = 0;
    let tick = 0;
    let tripletCount = 0;
    let tripletValue = 0;
    for (i = 0; i < events.length; ++i) {
      const ev = events[i];
      // If it's too small, continue.  Don't record the event but do count the ticks
      if (ev.durationTicks < 128) {
        ticksSoFar += ev.durationTicks;
        continue;
      }
      const ticksPerMeasure = SmoMusic.timeSignatureToTicks(ev.timeSignature.timeSignature);
      const nevent = MidiToSmo.copyEvent(ev);
      if (ticksSoFar + ev.durationTicks > ticksPerMeasure) {
        nevent.durationTicks = ticksPerMeasure - ticksSoFar;
        if (nevent.durationTicks > 0) {
          rv.push(nevent);
          nevent.tick = tick;
        }
        tick = 0;
        tripletCount = 0;
        tripletValue = 0;
        measure += 1;
        ticksSoFar = 0;
        this.maxMeasure = Math.max(this.maxMeasure, measure);
        let overflow = ev.durationTicks - nevent.durationTicks;
        while (overflow > ticksPerMeasure) {
          const ovfEvent = MidiToSmo.copyEvent(nevent);
          ovfEvent.tick = tick;
          ovfEvent.measure = measure;
          tick += 1;
          measure += 1;
          ovfEvent.durationTicks = ticksPerMeasure;
          rv.push(ovfEvent);
          overflow -= ticksPerMeasure;
        }
        if (overflow > 0) {
          const ovfEvent = MidiToSmo.copyEvent(nevent);
          ovfEvent.isTied = true;
          ovfEvent.durationTicks = overflow;
          ovfEvent.measure = measure;
          ovfEvent.tick = tick;
          ticksSoFar += ovfEvent.durationTicks;
          tick += 1;
          rv.push(ovfEvent);
          overflow = 0;
        }
      } else {
        ticksSoFar += ev.durationTicks;
        // Try to infer the presence of triplets.  If it looks like a triplet, mark it and we will
        // create the tuplet when we create the measure.
        const possibleTriplet = this.tripletType(nevent.durationTicks);
        if (possibleTriplet > 0 && (tripletValue === 0 || possibleTriplet === tripletValue)) {
          tripletCount += 1;
          tripletValue = possibleTriplet;
          if (tripletCount === 3) {
            nevent.tupletInfo = {
              numNotes: 3,
              stemTicks: possibleTriplet / 2,
              totalTicks: possibleTriplet,
              isLast: true
            };
            rv[rv.length - 1].tupletInfo = {
              numNotes: 3,
              stemTicks: possibleTriplet / 2,
              totalTicks: possibleTriplet,
              isLast: false
            };
            rv[rv.length - 2].tupletInfo = {
              numNotes: 3,
              stemTicks: possibleTriplet / 2,
              totalTicks: possibleTriplet,
              isLast: false
            };
            tripletCount = 0;
            tripletValue = 0;
          }
        } else {
          tripletCount = 0;
          tripletValue = 0;
        }
        rv.push(nevent);
      }
    }
    return rv;
  }
  /**
   * Store midi on events.  If the midi on or off matches an existing
   * stored event based on channel and note, return it so it can be processed
   * @param ev raw event
   * @param evIndex index of processed events
   * @returns 
   */
  pushPopMidiEvent(ev: MidiTrackEvent, evIndex: number): MidiNoteOn | null {
    let rv: MidiNoteOn | null = null;
    if (!ev.noteNumber || typeof (ev.channel) === 'undefined') {
      return null;
    }
    if (this.midiOnNotes[ev.noteNumber]) {
      const ix = this.midiOnNotes[ev.noteNumber].findIndex((x) => x.channel === ev.channel);
      if (ix >= 0) {
        rv = JSON.parse(JSON.stringify(this.midiOnNotes[ev.noteNumber][ix]));
        this.midiOnNotes[ev.noteNumber].splice(ix);
      }
    }
    if (!this.midiOnNotes[ev.noteNumber]) {
      this.midiOnNotes[ev.noteNumber] = [];
    }
    if (ev.type === 'noteOn' && ev.velocity && ev.velocity > 0) {
      this.midiOnNotes[ev.noteNumber].push({
        note: ev.noteNumber,
        channel: ev.channel,
        smoIndex: evIndex
      });
    }
    return rv;
  }
  /**
   * Step 1 in the 3-step process.  Collapse midi events into 
   * a single EventSmoData for each distinct tick that contains
   * the metadata state, a duration, and note information.
   * @param trackEvents 
   * @returns 
   */
  collapseMidiEvents(trackEvents: MidiTrackEvent[]): EventSmoData[] {
    const isEot = (ev: MidiTrackEvent) => {
      if (!ev) {
        return true;
      }
      if (typeof (ev.type) === 'undefined') {
        return true;
      }
      return ev.type === 'endOfTrack';
    }
    if (this.eventIndex >= trackEvents.length) {
      this.eot = true;
      return [];
    }
    const rv: EventSmoData[] = [];
    let cur = trackEvents[0];
    let metadata: RunningMetadata = this.getMetadata(0);
    let curSmo = this.createNewEvent(metadata);
    let untrackedTicks = 0;
    let ticks = 0;
    while (this.eventIndex < trackEvents.length && !(this.eot)) {
      if (isEot(cur)) {
        this.eot = true;
        break;
      }
      if (cur.deltaTime > 0) {
        curSmo.durationTicks = this.getSmoTicks(cur.deltaTime);
        ticks += curSmo.durationTicks;
        // We only need to track note on/off events.  Other events update the global
        // map, we need to keep track of the duration changes though.
        if (cur.type === 'noteOn' || cur.type === 'noteOff') {
          if (curSmo.pitches.length === 0) {
            curSmo.isRest = true;
          }
          curSmo.durationTicks += untrackedTicks;
          untrackedTicks = 0;
          rv.push(curSmo);
        } else {
          untrackedTicks += curSmo.durationTicks
        }
        curSmo = this.createNewEvent(metadata);
      }
      curSmo.timeSignature = metadata.timeSignature;
      curSmo.tempo = metadata.tempo;
      curSmo.keySignature = metadata.keySignature;

      if (cur.type === 'noteOn' || cur.type === 'noteOff') {
        const mm = this.pushPopMidiEvent(cur, rv.length);
        if (mm) {
          const npitch = SmoMusic.getEnharmonicInKey(SmoMusic.smoIntToPitch(mm.note - 12), metadata.keySignature);
          if (mm.smoIndex < rv.length) {
            rv[mm.smoIndex].pitches.push(npitch);
            rv[mm.smoIndex].isRest = false;
          } else {
            console.warn('bad index in event mm.smoIndex');
          }
        }
      } else if (cur.meta) {
        this.handleMetadata(cur, ticks);
      }
      metadata = this.getMetadata(ticks);
      this.eventIndex += 1;
      cur = trackEvents[this.eventIndex];
      if (isEot(cur)) {
        this.eot = true;
        break;
      }
    }
    return rv;
  }
  getTrackData(midi: any) {
    if (midi.header.format !== 0) {
      return midi.tracks;
    }
    const trackData: any[] = [];
    const trackHash: Record<number | string, MidiTrackEvent[]> = {};
    const trackEvents: MidiTrackEvent[] = midi.tracks[0];
    trackEvents.forEach((ev) => {
      const channel = ev.channel ?? 0;
      if (!trackHash[channel]) {
        trackHash[channel] = [];
      }
      trackHash[channel].push(ev);
    });
    const trackKeys = Object.keys(trackHash);
    trackKeys.forEach((trackKey) => {
      trackData.push(trackHash[trackKey]);
    });
    return trackData;
  }

  /**
   * Convert the midi to a score as best we can.  The conversion is made via a 3-step
   * process.  
   * 1. consolidate all the MIDI events into individual note on/off events with a duration
   * 2. adjust the durations so the fit in with Smoosic measure lengths.
   * 3. Create the {@link SmoNote} objects from the events.
   * @returns 
   */
  convert(): SmoScore {
    let staves: SmoSystemStaff[] = [];
    // go through the tracks.  If this is midi format 1, split tracks into their own channels
    const tracks = this.getTrackData(this.midi);
    tracks.forEach((trackEvents: MidiTrackEvent[], trackIx: number) => {
      this.eventIndex = 0; // index into current track
      this.trackIndex = trackIx;
      this.eot = false;
      this.tieMap[trackIx] = [];
      const collapsed: EventSmoData[] = this.collapseMidiEvents(trackEvents);
      const expanded: EventSmoData[] = this.expandMidiEvents(collapsed);
      if (expanded.length > 0) {
        const staffDef = SmoSystemStaff.defaults;
        staffDef.staffId = trackIx;
        staffDef.measures = this.createNotesFromEvents(expanded);

        const staff = new SmoSystemStaff(staffDef);
        // For notes that are tied across measures, add the tie
        this.tieMap[trackIx].forEach((mm) => {
          const startMeasure = staffDef.measures[mm - 1];
          const endMeasure = staffDef.measures[mm];
          const endIx = startMeasure.voices[0].notes.length - 1;
          const startNote = startMeasure.voices[0].notes[endIx];
          const endNote = endMeasure.voices[0].notes[0];
          if (startNote.noteType === 'n' &&
            endNote.noteType === 'n' && SmoMusic.pitchArraysMatch(startNote.pitches, endNote.pitches)) {
            const tieDefs = SmoTie.defaults;
            tieDefs.startSelector = {
              staff: trackIx, measure: mm - 1, voice: 0, tick: endIx,
              pitches: []
            }
            tieDefs.endSelector = {
              staff: trackIx, measure: mm, voice: 0, tick: 0,
              pitches: []
            }
            tieDefs.lines.push({ from: 0, to: 0 });
            const tie = new SmoTie(tieDefs);
            staff.modifiers.push(tie);
          }
        });
        staves.push(staff);
      }
    });
    if (staves.length === 0) {
      return SmoScore.getEmptyScore(SmoScore.defaults);
    }
    let longestStave = staves[0];
    staves.forEach((staff) => {
      if (staff.measures.length > longestStave.measures.length) {
        longestStave = staff;
      }
    });
    staves.forEach((staff) => {
      let i = 0;
      for (i = staff.measures.length; i < longestStave.measures.length; ++i) {
        const measure = SmoMeasure.getDefaultMeasure(longestStave.measures[i]);
        measure.voices.push({ notes: SmoMeasure.getDefaultNotes(longestStave.measures[i]) });
        staff.measures.push(measure);
      }
    });
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