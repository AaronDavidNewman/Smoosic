// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoMusic } from '../../common/musicHelpers';
import { SmoNote } from '../data/note';
import { SmoAttrs, SmoVoice } from '../data/common';
import { SmoMeasure, ISmoBeamGroup } from '../data/measure';
import { TickMap } from './tickMap';
const VF = eval('Vex.Flow');

export interface SmoBeamGroupParams {
  notes: SmoNote[]
}

export class SmoBeamGroup implements ISmoBeamGroup {
  notes: SmoNote[];
  attrs: SmoAttrs;
  voice: number = 0;
  constructor(params: SmoBeamGroupParams) {
    let i = 0;
    this.notes = params.notes;
    Vex.Merge(this, params);

    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoBeamGroup'
    };
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      if (note.tickCount < 4096) {
        note.beam_group = this.attrs;
      }
    }
  }
}

export class smoBeamerFactory {
  static applyBeams(measure: SmoMeasure) {
    let i = 0;
    let j = 0;
    for (i = 0; i < measure.voices.length; ++i) {
      const beamer = new smoBeamModifier(measure, i);
      const tickmap = measure.tickmapForVoice(i);
      for (j = 0; j < tickmap.durationMap.length; ++j) {
        beamer.beamNote(tickmap, j, measure.voices[i].notes[j]);
      }
    }
  }
}

export class smoBeamModifier {
  measure: SmoMeasure;
  duration: number;
  timeSignature: string;
  meterNumbers: number[];
  beamBeats: number;
  skipNext: number;
  currentGroup: SmoNote[];
  constructor(measure: SmoMeasure, voice: number) {
    this.measure = measure;
    this._removeVoiceBeam(measure, voice);
    this.duration = 0;
    this.timeSignature = measure.timeSignature;
    this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));
    // beam on 1/4 notes in most meter, triple time dotted quarter
    this.beamBeats = 2 * 2048;
    if (this.meterNumbers[0] % 3 === 0) {
      this.beamBeats = 3 * 2048;
    }
    this.skipNext = 0;
    this.currentGroup = [];
  }

  get beamGroups() {
    return this.measure.beamGroups;
  }
  _removeVoiceBeam(measure: SmoMeasure, voice: number) {
    const beamGroups: ISmoBeamGroup[] = [];
    measure.beamGroups.forEach((gr: ISmoBeamGroup) => {
      if (gr.voice !== voice) {
        beamGroups.push(gr);
      }
    });
    measure.beamGroups = beamGroups;
  }

  _completeGroup(voice: number) {
    const nrCount: SmoNote[] = this.currentGroup.filter((nn: SmoNote) =>
      nn.isRest() === false
    );
    // don't beam groups of 1
    if (nrCount.length > 1) {
      this.measure.beamGroups.push(new SmoBeamGroup({
        notes: this.currentGroup
      }));
    }
  }

  _advanceGroup() {
    this.currentGroup = [];
    this.duration = 0;
  }

  // ### _isRemainingTicksBeamable
  // look ahead, and see if we need to beam the tuplet now or if we
  // can combine current beam with future notes.
  _isRemainingTicksBeamable(tickmap: TickMap, index: number) {
    let acc = 0;
    let i = 0;
    if (this.duration >= this.beamBeats) {
      return false;
    }
    acc = this.duration;
    for (i = index + 1; i < tickmap.deltaMap.length; ++i) {
      acc += tickmap.deltaMap[i];
      if (acc === this.beamBeats) {
        return true;
      }
      if (acc > this.beamBeats) {
        return false;
      }
    }
    return false;
  }
  beamNote(tickmap: TickMap, index: number, note: SmoNote) {
    this.beamBeats = note.beamBeats;
    this.duration += tickmap.deltaMap[index];
    if (note.noteType === '/') {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    // beam tuplets
    if (note.isTuplet) {
      const tuplet = this.measure.getTupletForNote(note);
      // The underlying notes must have been deleted.
      if (!tuplet) {
        return;
      }
      const ult = tuplet.notes[tuplet.notes.length - 1];
      const first = tuplet.notes[0];

      if (first.endBeam) {
        this._advanceGroup();
        return;
      }

      // is this beamable length-wise
      const vexDuration = smoMusic.closestVexDuration(note.tickCount);
      const stemTicks = VF.durationToTicks(vexDuration);
      if (note.noteType === 'n' && stemTicks < 4096) {
        this.currentGroup.push(note);
      }
      // Ultimate note in tuplet
      if (ult.attrs.id === note.attrs.id && !this._isRemainingTicksBeamable(tickmap, index)) {
        this._completeGroup(tickmap.voice);
        this._advanceGroup();
      }
      return;
    }

    // don't beam > 1/4 note in 4/4 time.  Don't beam rests.
    if (tickmap.deltaMap[index] >= 4096 || (note.isRest() && this.currentGroup.length === 0)) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    this.currentGroup.push(note);
    if (note.endBeam) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
    }

    if (this.duration === this.beamBeats) {
      this._completeGroup(tickmap.voice);
      this._advanceGroup();
      return;
    }

    // If this does not align on a beat, don't beam it
    if (this.duration > this.beamBeats) {
      this._advanceGroup();
    }
  }
}
