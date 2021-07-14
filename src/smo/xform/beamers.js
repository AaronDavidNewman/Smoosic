// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoMusic } from '../../common/musicHelpers';

export class smoBeamerFactory {
  static applyBeams(measure) {
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
  constructor(measure, voice) {
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
  _removeVoiceBeam(measure, voice) {
    const beamGroups = [];
    measure.beamGroups.forEach((gr) => {
      if (gr.voice !== voice) {
        beamGroups.push(gr);
      }
    });
    measure.beamGroups = beamGroups;
  }

  _completeGroup(voice) {
    const nrCount = this.currentGroup.filter((nn) =>
      nn.isRest() === false
    );
    // don't beam groups of 1
    if (nrCount.length > 1) {
      this.measure.beamGroups.push(new SmoBeamGroup({
        notes: this.currentGroup,
        voice
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
  _isRemainingTicksBeamable(tickmap, index) {
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
  beamNote(tickmap, index, note) {
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
      if (stemTicks < 4096) {
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
