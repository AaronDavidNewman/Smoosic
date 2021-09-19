// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoDynamicText, SmoMicrotone } from '../data/noteModifiers';
import { SmoSelector, SmoSelection } from './selections';
import { SmoStaffHairpin, StaffModifierBase } from '../data/staffModifiers';
import { SmoMusic } from '../data/music';
import { SmoTempoText, SmoBarline, SmoVolta } from '../data/measureModifiers';
import { SmoScore } from '../data/score';
import { SmoNote } from '../data/note';
import { Pitch } from '../data/common';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoAudioPitch } from '../data/music';

export interface SmoAudioRepeat {
  startRepeat: number,
  endRepeat?: number,
  voltas: SmoAudioVolta[]
}
export interface SmoAudioVolta {
  measureIndex: number,
  ending: number
}
export interface SmoAudioRepeatMap {
  startMeasure: number,
  endMeasure: number
}
export interface SmoAudioHairpin {
  hairpinType: number,
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  delta: number,
  ticks: number
}
export interface SmoAudioTie {
  startSelector: SmoSelector,
  endSelector: SmoSelector
}
export interface SmoAudioNote {
  pitches: Pitch[],
  frequencies: number[],
  noteType: string,
  duration: number,
  offset: number,
  selector: SmoSelector,
  volume: number,
  padding?: boolean
}
export interface SmoAudioTimeSignature {
  numerator: number,
  denominator: number
}
export interface SmoAudioTrack {
  lastMeasure: number,
  notes: SmoAudioNote[],
  tempoMap: Record<string, number>,
  measureNoteMap: Record<number, SmoAudioNote[]>,
  timeSignatureMap: Record<string, SmoAudioTimeSignature>,
  hairpins: SmoAudioHairpin[],
  volume: number,
  tiedNotes: SmoAudioTie[],
  repeats: []
}
export interface AudioTracks {
  tracks: SmoAudioTrack[],
  repeats: SmoAudioRepeat[],
  repeatMap: SmoAudioRepeatMap[],
  measureBeats: number[],
  tempoMap: number[]
}
/** SmoAudioScore
// Convert a score into a JSON structure that can be rendered to audio.
// the return value looks like this:
// `` { tracks, repeats, repeatMap} ``
// repeatMap is just an array of tuples with start/end measures.
//  each track contains:
// `` { lastMeasure, notes, tempoMap, timeSignatureMap, hairpins, volume, tiedNotes }
// where each note might contain:
//  ``{ pitches, noteType, duration, selector, volume }``
// Note:  pitches are smo pitches, durations are adjusted for beatTime
// (beatTime === 4096 uses Smo/Vex ticks, 128 is midi tick default)
// volume is normalized 0-1
 */
export class SmoAudioScore {
  // ### dynamicVolumeMap
  // normalized dynamic
  static get dynamicVolumeMap(): Record<string, number> {
    // matches SmoDynamicText.dynamics
    return {
      pp: 0.3,
      p: 0.4,
      mp: 0.5,
      mf: 0.6,
      f: 0.7,
      ff: 0.8
    };
  }
  static get emptyTrack(): SmoAudioTrack {
    return {
      lastMeasure: 0,
      notes: [],
      tempoMap: {},
      timeSignatureMap: {},
      hairpins: [],
      measureNoteMap: {},
      volume: 0,
      tiedNotes: [],
      repeats: []
    };
  }
  timeDiv: number;
  score: SmoScore;
  beatTime: number;
  volume: number = 0;
  constructor(score: SmoScore, beatTime: number) {
    this.timeDiv = 4096 / beatTime;
    this.score = score;
    this.beatTime = beatTime;
  }
  // ### volumeFromNote
  // Return a normalized volume from the dynamic setting of the note
  // or supplied default if none exists
  volumeFromNote(smoNote: SmoNote, def?: number): number {
    if (typeof (def) === 'undefined' || def === 0) {
      def = SmoAudioScore.dynamicVolumeMap[SmoDynamicText.dynamics.PP];
    }
    const dynamic: SmoDynamicText[] = smoNote.getModifiers('SmoDynamicText') as SmoDynamicText[];
    if (dynamic.length < 1) {
      return def;
    }
    if (dynamic[0].text === SmoDynamicText.dynamics.SFZ) {
      return SmoAudioScore.dynamicVolumeMap[SmoDynamicText.dynamics.F];
    }
    if (typeof (SmoAudioScore.dynamicVolumeMap[dynamic[0].text]) === 'undefined') {
      return def;
    }
    return SmoAudioScore.dynamicVolumeMap[dynamic[0].text];
  }
  getVoltas(repeat: SmoAudioRepeat, measureIndex: number): SmoAudioVolta[] {
    let v1 = measureIndex;
    let endings = null;
    let currentEnding = -1;
    const rv: SmoAudioVolta[] = [];
    const staff = this.score.staves[0];
    while (v1 > repeat.startRepeat) {
      endings = staff.measures[v1].getNthEndings();
      if (endings.length && endings[0].endSelector) {
        currentEnding = endings[0].number;
        rv.push({ measureIndex: v1, ending: currentEnding });
        v1 = endings[0].endSelector.measure + 1;
        break;
      }
      v1--;
    }
    if (currentEnding < 0 || !staff?.measures) {
      return rv;
    }
    while (endings?.length && v1 < staff.measures.length) {
      endings = staff.measures[v1].getNthEndings();
      if (!endings.length) {
        break;
      }
      currentEnding = endings[0].number;
      rv.push({ measureIndex: v1, ending: currentEnding });
      v1 = (endings[0].endSelector as SmoSelector).measure + 1;
    }
    rv.sort((a: SmoAudioVolta, b: SmoAudioVolta) => a.ending - b.ending);
    return rv;
  }
  // ### ticksFromSelection
  // return the count of ticks between the selectors, adjusted for
  // beatTime
  ticksFromSelection(startSelector: SmoSelector, endSelector: SmoSelector): number {
    const selection = SmoSelection.selectionFromSelector(this.score, startSelector);
    const note = selection?.note as SmoNote;
    let ticks: number = note.tickCount;
    let nextSelection: SmoSelection | null = SmoSelection.nextNoteSelectionFromSelector(this.score, startSelector);
    while (nextSelection && nextSelection.note && !SmoSelector.gt(nextSelection.selector, endSelector)) {
      ticks += nextSelection.note.tickCount;
      nextSelection = SmoSelection.nextNoteSelectionFromSelector(this.score, nextSelection.selector);
    }
    return ticks / this.timeDiv;
  }
  // ### getHairpinInfo
  // Get any hairpin starting at this selection, and calculate its
  // effect on the overall volume
  getHairpinInfo(track: SmoAudioTrack, selection: SmoSelection) {
    const staff: SmoSystemStaff = selection.staff;
    const selector: SmoSelector = selection.selector;
    const cp = (x: SmoSelector) => JSON.parse(JSON.stringify(x));
    const hps: StaffModifierBase[] = staff.getModifiersAt(selector)
      .filter((hairpin) => hairpin.ctor === 'SmoStaffHairpin' &&
        SmoSelector.eq(hairpin.startSelector, selector));
    const rv: SmoAudioHairpin[] = [];
    // clear out old hairpins.
    // usually there will only be a single hairpin per voice, except
    // in the case of overlapping.
    track.hairpins.forEach((hairpin: SmoAudioHairpin) => {
      if (SmoSelector.gteq(selection.selector, hairpin.startSelector) &&
        SmoSelector.lteq(selection.selector, hairpin.endSelector)) {
        rv.push(hairpin);
      }
    });
    track.hairpins = rv;

    hps.forEach((hairpin) => {
      const ch = hairpin as SmoStaffHairpin;
      let endDynamic = 0;
      const trackHairpin: SmoAudioHairpin = {
        hairpinType: ch.hairpinType,
        startSelector: cp(hairpin.startSelector),
        endSelector: cp(hairpin.endSelector),
        delta: 0,
        ticks: 0
      };
      // For a hairpin, try to calculate the volume difference from start to end,
      // as a function of ticks
      const endSelection: SmoSelection | null = SmoSelection.selectionFromSelector(this.score, hairpin.endSelector);
      if (endSelection !== null && typeof (endSelection.note) !== 'undefined') {
        const endNote = endSelection.note as SmoNote;
        const curNote = selection.note as SmoNote;
        endDynamic = this.volumeFromNote(endNote);
        const startDynamic = this.volumeFromNote(curNote, track.volume);
        if (startDynamic === endDynamic) {
          const nextSelection = SmoSelection.nextNoteSelectionFromSelector(this.score, hairpin.endSelector);
          if (nextSelection) {
            const nextNote = nextSelection.note as SmoNote;
            endDynamic = this.volumeFromNote(nextNote);
          }
        }
        if (startDynamic === endDynamic) {
          const offset = (hairpin as SmoStaffHairpin).hairpinType === SmoStaffHairpin.types.CRESCENDO ? 0.1 : -0.1;
          endDynamic = Math.max(endDynamic + offset, 0.1);
          endDynamic = Math.min(endDynamic, 1.0);
        }
        trackHairpin.delta = endDynamic - startDynamic;
        trackHairpin.ticks = this.ticksFromSelection(hairpin.startSelector, hairpin.endSelector);
        track.hairpins.push(trackHairpin);
      }
    });
  }
  // ### computeVolume
  // come up with a current normalized volume based on dynamics
  // that appear in the music
  computeVolume(track: SmoAudioTrack, selection: SmoSelection) {
    const note = selection.note as SmoNote;
    if (track.volume === 0) {
      track.volume = this.volumeFromNote(note,
        SmoAudioScore.dynamicVolumeMap.p);
      return;
    }
    if (track.hairpins.length) {
      const hp = track.hairpins[0];
      const coff = (note.tickCount / this.timeDiv) / hp.ticks;
      track.volume += hp.delta * coff;
    } else {
      track.volume = this.volumeFromNote(note, track.volume);
    }
  }
  getSlurInfo(track: SmoAudioTrack, selection: SmoSelection) {
    const tn: SmoAudioTie[] = [];
    const cp = (x: any) => JSON.parse(JSON.stringify(x));
    track.tiedNotes.forEach((tie) => {
      if (SmoSelector.gteq(selection.selector, tie.startSelector) && SmoSelector.lteq(selection.selector, tie.endSelector)) {
        tn.push(tie);
      }
    });
    track.tiedNotes = tn;
    const slurStart = selection.staff.getSlursStartingAt(selection.selector);
    slurStart.forEach((slur) => {
      tn.push({
        startSelector: cp(slur.startSelector),
        endSelector: cp(slur.endSelector)
      });
    });
    const tieStart = selection.staff.getTiesStartingAt(selection.selector);
    tieStart.forEach((tie) => {
      tn.push({
        startSelector: cp(tie.startSelector),
        endSelector: cp(tie.endSelector)
      });
    });
  }
  isTiedPitch(track: SmoAudioTrack, selection: SmoSelection, noteIx: number): boolean {
    if (noteIx < 1) {
      return false;
    }
    if (!track.tiedNotes.length) {
      return false;
    }
    if (track.notes[noteIx - 1].noteType !== 'n') {
      return false;
    }
    // Don't do this for first note of nth endings, because it will mess up
    // other endings.
    if (selection.selector.tick === 0) {
      const endings = selection.measure.getNthEndings();
      if (endings.length) {
        return false;
      }
    }
    return SmoMusic.pitchArraysMatch(track.notes[noteIx - 1].pitches, (selection.note as SmoNote).pitches);
  }
  static updateMeasureIndexMap(note: SmoAudioNote, measureIndexMap: Record<number, Record<number, SmoAudioNote[]>>) {
    if (note.noteType !== 'n') {
      return;
    }
    const selector = note.selector;
    if (typeof (measureIndexMap[selector.measure]) === 'undefined') {
      measureIndexMap[selector.measure] = {} as Record<number, SmoAudioNote[]>;
    }
    const measureIndex = measureIndexMap[selector.measure];
    if (typeof (measureIndex[selector.tick]) === 'undefined') {
      measureIndex[selector.tick] = [];
    }
    if (note.noteType === 'n') {
      measureIndex[selector.tick].push(note);
    }
  }
  updateMeasureNoteMap(track: SmoAudioTrack, measureIndex: number, note: SmoAudioNote) {
    if (!track.measureNoteMap[measureIndex]) {
      track.measureNoteMap[measureIndex] = [];
    }
    track.measureNoteMap[measureIndex].push(note)
  }
  createTrackNote(track: SmoAudioTrack, selection: SmoSelection, duration: number, runningDuration: number, measureIndexMap: Record<number, Record<number, SmoAudioNote[]>>) {
    const noteIx = track.notes.length;
    if (this.isTiedPitch(track, selection, noteIx)) {
      track.notes[noteIx - 1].duration += duration;
      const restPad = this.createTrackRest(track, duration, runningDuration, selection.selector, measureIndexMap);
      // Indicate this rest is just padding for a previous tied note.  Midi and audio render this
      // differently
      restPad.padding = true;
      track.notes.push(restPad);
      return;
    }
    const tpitches: Pitch[] = [];
    const frequencies: number[] = [];
    const xpose = selection.measure.transposeIndex;
    const smoNote = selection.note as SmoNote;
    smoNote.pitches.forEach((pitch, pitchIx) => {
      tpitches.push(SmoMusic.smoIntToPitch(
        SmoMusic.smoPitchToInt(pitch) - xpose));
        const mtone: SmoMicrotone | null = smoNote.getMicrotone(pitchIx) ?? null;
        frequencies.push(SmoAudioPitch.smoPitchToFrequency(pitch, -1 * xpose, mtone));
    });
    const pitchArray = JSON.parse(JSON.stringify(tpitches));
    const note: SmoAudioNote = {
      pitches: pitchArray,
      noteType: 'n',
      duration,
      offset: runningDuration,
      selector: selection.selector,
      volume: track.volume,
      frequencies
    };
    this.updateMeasureNoteMap(track, selection.selector.measure, note);
    track.notes.push(note);
    SmoAudioScore.updateMeasureIndexMap(note, measureIndexMap);
  }
  createTrackRest(track: SmoAudioTrack, duration: number, runningDuration: number, selector: SmoSelector, 
    measureIndexMap: Record<number, Record<number, SmoAudioNote[]>>): SmoAudioNote {
    const rest: SmoAudioNote = {
      duration,
      offset: runningDuration,
      noteType: 'r',
      selector,
      volume: 0,
      pitches: [],
      frequencies: []
    };
    SmoAudioScore.updateMeasureIndexMap(rest, measureIndexMap);
    this.updateMeasureNoteMap(track, selector.measure, rest);      
    return rest;
  }
  createRepeatMap(repeats: SmoAudioRepeat[]): SmoAudioRepeatMap[] {
    let startm = 0;
    let j = 0;
    const staff = this.score.staves[0];
    const repeatMap: SmoAudioRepeatMap[] = [];
    const endm = staff.measures.length - 1;
    repeats.forEach((repeat) => {
      // Include the current start to start of repeat, unless there is no start repeat
      if (repeat.startRepeat > 0) {
        repeatMap.push({ startMeasure: startm, endMeasure: repeat.startRepeat - 1 });
      }
      // Include first time through
      if (repeat.endRepeat) {
        repeatMap.push({ startMeasure: repeat.startRepeat, endMeasure: repeat.endRepeat });
      }
      startm = repeat.startRepeat;
      // nth time through, go to the start of volta 0, then to the start of volta n
      if (repeat.endRepeat && repeat.voltas.length < 1) {
        repeatMap.push({ startMeasure: repeat.startRepeat, endMeasure: repeat.endRepeat });
        startm = repeat.endRepeat + 1;
      }
      for (j = 1; j < repeat.voltas.length; ++j) {
        const volta = repeat.voltas[j];
        repeatMap.push({ startMeasure: repeat.startRepeat, endMeasure: repeat.voltas[0].measureIndex - 1 });
        // If there are more endings, repeat to first volta
        if (j + 1 < repeat.voltas.length) {
          repeatMap.push({ startMeasure: volta.measureIndex, endMeasure: repeat.voltas[j + 1].measureIndex - 1 });
        } else {
          startm = volta.measureIndex;
        }
      }
    });
    if (startm <= endm) {
      repeatMap.push({ startMeasure: startm, endMeasure: endm });
    }
    return repeatMap;
  }
  normalizeVolume(measureIndexMap: Record<number, Record<number, SmoAudioNote[]>>) {
    let i = 0;
    let j = 0;
    let runningSum = -1;
    const measureKeys = Object.keys(measureIndexMap);
    for (i = 0; i < measureKeys.length; ++i) {
      const measureNotes = measureIndexMap[i];
      if (typeof (measureNotes) === 'undefined') {
        continue;
      }
      const tickKeys = Object.keys(measureNotes);
      for (j = 0; j < tickKeys.length; ++j) {
        let volumeSum = 0;
        let normalize = 1.0;
        const tickNotes = measureNotes[parseInt(tickKeys[j], 10)];
        if (typeof (tickNotes) === 'undefined') {
          continue;
        }
        volumeSum = tickNotes.map((nn) => nn.volume).reduce((a, b) => a + b);
        if (volumeSum > 1.0) {
          normalize = 1.0 / volumeSum;
          volumeSum = 1.0;
        }
        if (runningSum < 0) {
          runningSum = volumeSum;
        }
        const diff = Math.abs(runningSum - volumeSum);
        if (diff > 0.6) {
          const avg = (volumeSum * 3 + runningSum) / 4;
          normalize = normalize * avg;
        }
        runningSum = volumeSum * normalize;
        tickNotes.forEach((nn) => {
          nn.volume *= normalize;
        });
        runningSum = volumeSum;
      }
    }
  }
  convert(): AudioTracks {
    const trackHash: Record<string, SmoAudioTrack> = {};
    const measureBeats: number[] = [];
    const measureIndexMap = {};
    const repeats: SmoAudioRepeat[] = [];
    let startRepeat = 0;
    const tempoMap: number[] = [];
    this.score.staves.forEach((staff, staffIx) => {
      this.volume = 0;
      staff.measures.forEach((measure, measureIx) => {
        measure.voices.forEach((voice, voiceIx) => {
          let duration = 0;
          const trackKey = (this.score.staves.length * voiceIx) + staffIx;
          if (typeof (trackHash[trackKey]) === 'undefined') {
            trackHash[trackKey] = SmoAudioScore.emptyTrack;
          }
          const measureSelector = SmoSelector.default;
          measureSelector.staff = staffIx;
          measureSelector.measure = measureIx;
          const track: SmoAudioTrack = trackHash[trackKey];
          if (!measure.tempo) {
            measure.tempo = new SmoTempoText(SmoTempoText.defaults);
          }
          const tempo = measure.tempo.bpm * (measure.tempo.beatDuration / 4096);
          // staff 0/voice 0, set track values for the measure
          if (voiceIx === 0) {
            if (staffIx === 0) {
              measureBeats.push(measure.getMaxTicksVoice() / this.timeDiv);
              const startBar = measure.getStartBarline();
              const endBar = measure.getEndBarline();
              if (startBar.barline === SmoBarline.barlines.startRepeat) {
                startRepeat = measureIx;
              }
              if (endBar.barline === SmoBarline.barlines.endRepeat) {
                const repeat: SmoAudioRepeat = { startRepeat, endRepeat: measureIx, voltas: [] };
                repeat.voltas = this.getVoltas(repeat, measureIx);
                repeats.push(repeat);
              }
              tempoMap.push(tempo);
            }

            const selectorKey = SmoSelector.getMeasureKey(measureSelector);
            track.tempoMap[selectorKey] = Math.round(tempo);
            track.timeSignatureMap[selectorKey] = {
              numerator: measure.numBeats,
              denominator: measure.beatValue
            };
          }
          // If this voice is not in every measure, fill in the space
          // in its own channel.
          while (track.lastMeasure < measureIx) {
            track.notes.push(this.createTrackRest(track, measureBeats[track.lastMeasure], 0,
              { staff: staffIx, measure: track.lastMeasure, voice: voiceIx, tick: 0, pitches: [] },
              measureIndexMap,
            ));
            track.lastMeasure += 1;
          }
          let tupletTicks = 0;
          let runningDuration = 0;
          voice.notes.forEach((note, noteIx) => {
            const selector = {
              staff: staffIx, measure: measureIx, voice: voiceIx, tick: noteIx, pitches: []
            };
            const selection = SmoSelection.selectionFromSelector(this.score, selector) as SmoSelection;
            // update staff features of slur/tie/cresc.
            this.getSlurInfo(track, selection);
            this.getHairpinInfo(track, selection);
            const tuplet = measure.getTupletForNote(note);
            if (tuplet && tuplet.getIndexOfNote(note) === 0) {
              tupletTicks = tuplet.tickCount / this.timeDiv;
            }
            if (tupletTicks) {
              // tuplet likely won't fit evenly in ticks, so
              // use remainder in last tuplet note.
              if (tuplet && tuplet.getIndexOfNote(note) === tuplet.notes.length - 1) {
                duration = tupletTicks;
                tupletTicks = 0;
              } else {
                duration = note.tickCount / this.timeDiv;
                tupletTicks -= duration;
              }
            } else {
              duration = note.tickCount / this.timeDiv;
            }
            if (note.isRest() || note.isSlash()) {
              track.notes.push(this.createTrackRest(track, duration, runningDuration, selector, measureIndexMap));
            } else {
              this.computeVolume(track, selection);
              this.createTrackNote(track, selection, duration, runningDuration, measureIndexMap);
            }
            runningDuration += duration;
          });
          track.lastMeasure += 1;
        });
      });
    });
    // For voices that don't fill out the full piece, fill them in with rests
    const tracks = Object.keys(trackHash).map((key) => trackHash[key]);
    const maxMeasure = tracks[0].lastMeasure;
    tracks.forEach((track) => {
      while (track.lastMeasure < maxMeasure) {
        const staff = track.notes[0].selector.staff;
        const voice = track.notes[0].selector.voice;
        const rest: SmoAudioNote = this.createTrackRest(track, measureBeats[track.lastMeasure], 0,
          { staff, measure: track.lastMeasure, voice, tick: 0, pitches: [] }, measureIndexMap
        );
        track.notes.push(rest);
        track.lastMeasure += 1;
      }
    });
    const repeatMap = this.createRepeatMap(repeats);
    this.normalizeVolume(measureIndexMap);
    return { tracks, repeats, repeatMap, measureBeats, tempoMap };
  }
}
