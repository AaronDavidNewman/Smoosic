/**
 * Convert midi to Smo object model.  Midi parsing code from:
 * (https://github.com/colxi/midi-parser-js)
 * @module /smo/midi/midiToSmo
 */
import { defaultEditorKeys } from "../../../release/smoosic";
import { Clef, Pitch } from "../data/common";
import { SmoMeasure } from "../data/measure";
import { SmoTempoText, TimeSignature } from "../data/measureModifiers";
import { SmoMusic } from "../data/music";
import { SmoNote } from "../data/note";
import { SmoScore } from "../data/score";
import { SmoLayoutManager } from "../data/scoreModifiers";
import { SmoSystemStaff } from "../data/systemStaff";
import { SmoSelector } from "../xform/selections";

export type MidiEventType =  'text' | 'copyrightNotice' | 'trackName' | 'instrumentName' | 'lyrics' | 'marker' |
  'cuePoint' | 'channelPrefix' | 'portPrefix' | 'endOfTrack' | 'setTempo' | 'smpteOffset' | 'timeSignature' | 'keySignature' |
  'sequencerSpecific' | 'unknownMeta' | 
  'noteOff' | 'noteOn' | 'noteAftertouch' | 'controller' | 'programChange' | 'channelAftertouch' |'pitchBend';

export interface MidiTrackEvent {
  deltaTime: number,
  meta?: boolean,
  numerator?: number,
  denominator?: number,
  microsecondsPerBeat?: number,
  scale?: number,
  metronome?: number,
  thirtyseconds?: number,
  type: MidiEventType,
  channel?: number,
  noteNumber?: number,
  velocity?: number
}
interface RunningMetadata {
  keySignature: string,
  timeSignature: TimeSignature,
  tempo: SmoTempoText
}
interface MidiNoteOn {
  channel: number,
  note: number,
  smoIndex: number
}
interface EventSmoData {
  pitches: Pitch[],
  durationTicks: number,
  isTuplet: boolean,
  isRest: boolean,
  timeSignature: TimeSignature,
  tempo: SmoTempoText,
  keySignature: string,
  measure: number,
  tick: number
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
function getValueForTick<T>(arg: Record<number, T>, tick: number) {
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
  trackNotes: SmoNote[] = [];
  trackMeasures: SmoMeasure[] = [];
  deltaTime: number = 0;
  ticksPerMeasure: number = 4096 * 4;
  timeDivision: number = 480;
  trackIndex: number = 0; // index into current track
  maxMeasure: number = 0;
  eot: boolean = false;
  midi: any; // MIDI JSON from MIDI parser

  /**
   * Since midi has very little metadata, we don't know the original clef.
   * so just use the one (treble or bass) that uses the fewest ledger lines
   * @param notes notes in measure
   * @returns 
   */
  static guessClefForNotes(measure: SmoMeasure): Clef {
    let trebleMax = 0;
    let bassMax = 0;
    measure.voices[0].notes.forEach((note) => {
      note.pitches.forEach((pitch) => {
        const tl = Math.abs(SmoMusic.pitchToLedgerLine('treble', pitch));
        const bl = Math.abs(SmoMusic.pitchToLedgerLine('bass', pitch));
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
  getTempo(ticks: number) {
    if (this.tempoMap[ticks]) {
      return this.tempoMap[ticks];
    }
    return getValueForTick(this.tempoMap, ticks);
  }
  getTimeSignature(ticks: number): TimeSignature {
    if (this.timeSignatureMap[ticks]) {
      return this.timeSignatureMap[ticks];
    }
    return getValueForTick(this.timeSignatureMap, ticks);
  }
  getKeySignature(ticks: number) {
    if (this.keySignatureMap[ticks]) {
      return this.keySignatureMap[ticks];
    }
    return getValueForTick(this.keySignatureMap, ticks);
  }
  getRunningStatus(ticks: number) {
    return { tempo: this.getTempo(ticks), timeSignature: this.getTimeSignature(ticks), keySignature: this.getKeySignature(ticks) };
  }
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
        const mdata = trackEvent.scale!;
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
  getSmoTicks(midiTicks: number) {
    return 4096 * midiTicks / this.timeDivision;
  }
  createNewEvent(metadata: RunningMetadata): EventSmoData {
    return {
      pitches: [], durationTicks: 0, isTuplet: false, isRest: false, timeSignature: new TimeSignature(metadata.timeSignature),
      tempo: new SmoTempoText(metadata.tempo), keySignature: metadata.keySignature, measure: 0, tick: 0
    };
  }
  static copyEvent(o: EventSmoData): EventSmoData {
    const pitches = JSON.parse(JSON.stringify(o.pitches));
    const timeSignature = new TimeSignature(o.timeSignature);
    const tempo = new SmoTempoText(o.tempo);
    return ({
      pitches, durationTicks: o.durationTicks, isTuplet: o.isTuplet, isRest: o.isRest, timeSignature, tempo, keySignature: o.keySignature,
        measure: o.measure, tick: o.tick
    });
  }
  createNotesFromEvents(events: EventSmoData[]): SmoMeasure[] {
    let measureIndex = 0;
    const measures: SmoMeasure[] = [];
    let measure: SmoMeasure | null = null;
    let deficit = 0;
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
      // If the midi event is smaller than the smallest note..
      if (Math.abs(ev.durationTicks - deficit) < 1024) {
        deficit = deficit - ev.durationTicks;
      } else {
        const best = SmoMusic.midiTickSearch(ev.durationTicks - deficit);
        deficit += best.result - ev.durationTicks;
        ev.durationTicks = best.result;
        const defs = SmoNote.defaults;
        defs.ticks.numerator = ev.durationTicks;
        defs.pitches = JSON.parse(JSON.stringify(ev.pitches));
        defs.noteType = ev.isRest ? 'r' : 'n';
        const note = new SmoNote(defs);
        SmoNote.sortPitches(note);
        measure.voices[0].notes.push(note);
      }
    });
    measures.forEach((measure) => {
      measure.clef = MidiToSmo.guessClefForNotes(measure);
    });
    return measures;
  }
  expandMidiEvents(events: EventSmoData[]): EventSmoData[] {
    const rv: EventSmoData[] = [];
    if (events.length === 0) {
      return rv;
    }
    let i = 0;
    let ticksSoFar = 0;
    let measure = 0;
    let tick = 0;
    for (i = 0; i < events.length; ++i) {
      const ev = events[i];
      // If it's too small, continue
      if (ev.durationTicks < 128) {
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
        measure += 1;
        ticksSoFar = 0;
        this.maxMeasure = Math.max(this.maxMeasure, measure);
        let overflow = ev.durationTicks - nevent.durationTicks;
        while (overflow > ticksPerMeasure) {
          const ovfEvent = MidiToSmo.copyEvent(nevent);
          ovfEvent.tick = tick;
          ovfEvent.measure  = measure;
          tick += 1;
          measure += 1;
          ovfEvent.durationTicks = ticksPerMeasure;
          rv.push(ovfEvent);
          overflow -= ticksPerMeasure;
        }
        if (overflow > 0) {
          const ovfEvent = MidiToSmo.copyEvent(nevent);
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
        rv.push(nevent);
      }
    }
    return rv;
  }
  collapseMidiEvents(trackEvents: MidiTrackEvent[]): EventSmoData[] {
    const isEot = (ev: MidiTrackEvent) => {
      if (typeof (ev.type) === 'undefined') {
        return true;
      }
      return ev.type === 'endOfTrack';
    }
    if (this.trackIndex >= trackEvents.length) {
      this.eot = true;
      return [];
    }
    const rv: EventSmoData[] = [];
    let cur = trackEvents[0];
    let metadata: RunningMetadata = this.getRunningStatus(0);
    const midiOnNotes: Record<number,MidiNoteOn> = {};
    let curSmo = this.createNewEvent(metadata);
    let ticks = 0;
    while (this.trackIndex < trackEvents.length && !(this.eot)) {
      if (isEot(cur)) {
        this.eot = true;
        break;
      }
      if (cur.deltaTime > 0) {
        curSmo.durationTicks = this.getSmoTicks(cur.deltaTime);
        ticks += cur.deltaTime;
        if (curSmo.pitches.length === 0) {
          curSmo.isRest = true;
        }
        rv.push(curSmo);
        curSmo = this.createNewEvent(metadata);
      }
      curSmo.timeSignature = metadata.timeSignature;
      curSmo.tempo = metadata.tempo;
      curSmo.keySignature = metadata.keySignature;
      const channel = cur.channel!;
      if (cur.type === 'noteOn' || cur.type === 'noteOff') {
        const note = cur.noteNumber!;
        const velocity = cur.velocity!;
        if (midiOnNotes[note]) {
          const mm = midiOnNotes[note];
          const npitch = SmoMusic.getEnharmonicInKey(SmoMusic.smoIntToPitch(mm.note - 12), metadata.keySignature);
          if (mm.smoIndex < rv.length) {
            rv[mm.smoIndex].pitches.push(npitch);
            rv[mm.smoIndex].isRest = false;
            delete midiOnNotes[note];
          } else {
            console.warn('bad index in event mm.smoIndex');
          }
        }
        if (cur.type === 'noteOn' && velocity > 0) {
          midiOnNotes[note] = { channel, note, smoIndex: rv.length };
        }
      } else if (cur.meta) {
        this.handleMetadata(cur, ticks);
      }
      metadata = this.getRunningStatus(ticks);
      this.trackIndex += 1;
      cur = trackEvents[this.trackIndex];
      if (isEot(cur)) {
        this.eot = true;
        break;
      }
    }
    return rv;
  }
  constructor(midi: any) {
    this.midi = midi;
    console.log(JSON.stringify(midi, null, ''));
    this.timeSignatureMap[0] = new TimeSignature(TimeSignature.defaults);
    this.tempoMap[0] = new SmoTempoText(SmoTempoText.defaults);
    this.keySignatureMap[0] = 'c';
    this.timeDivision = midi.header.ticksPerBeat;
  }
  resetForTrack() {
    this.trackNotes = [];
    this.trackMeasures = [];
    this.deltaTime = 0;
    this.trackIndex = 0; // index into current track
    this.eot = false;
  }

  getScore(): SmoScore {
    let staves: SmoSystemStaff[] = [];
    // go through the tracks
    this.midi.tracks.forEach((trackEvents: MidiTrackEvent[], trackIx: number) => {
      this.resetForTrack();
      const collapsed: EventSmoData[] = this.collapseMidiEvents(trackEvents);
      const expanded: EventSmoData[] = this.expandMidiEvents(collapsed);
      if (expanded.length > 0) {
        const staffDef = SmoSystemStaff.defaults;
        staffDef.measures = this.createNotesFromEvents(expanded);
        staves.push(new SmoSystemStaff(staffDef));
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