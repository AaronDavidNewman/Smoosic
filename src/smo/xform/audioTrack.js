// ## SmoAudioTrack
// Convert a score into a JSON structure that can be rendered to audio.  For
// each staff/voice, return a track that consists of:
// array of pitches, duration, selector, normalized volume, tempo and time changes
// Note:  pitches are smo pitches, durations are adjusted for beatTime
// (beatTime === 4096 uses Smo/Vex ticks, 128 is midi tick default)
// eslint-disable-next-line no-unused-vars
class SmoAudioTrack {
  // ### dynamicVolumeMap
  // normalized dynamic
  static get dynamicVolumeMap() {
    // matches SmoDynamicText.dynamics
    return {
      pp: 0.15,
      p: 0.2,
      mp: 0.3,
      mf: 0.5,
      f: 0.6,
      ff: 0.65
    };
  }
  static get emptyTrack() {
    return {
      lastMeasure: 0,
      notes: [],
      tempoMap: {},
      timeSignatureMap: {},
      hairpins: [],
      volume: 0,
      tiedNotes: []
    };
  }
  constructor(score, beatTime) {
    this.timeDiv = 4096 / beatTime;
    this.score = score;
    this.beatTime = beatTime;
  }
  // ### volumeFromNote
  // Return a normalized volume from the dynamic setting of the note
  // or supplied default if none exists
  volumeFromNote(smoNote, def) {
    if (typeof(def) === 'undefined') {
      def = 0;
    }
    const dynamic = smoNote.getModifiers('SmoDynamicText');
    if (dynamic.length < 1) {
      return def;
    }
    if (dynamic[0].text === SmoDynamicText.dynamics.SFZ) {
      return SmoAudioTrack.dynamicVolumeMap[SmoDynamicText.F];
    }
    return SmoAudioTrack.dynamicVolumeMap[dynamic[0].text];
  }
  // ### ticksFromSelection
  // return the count of ticks between the selectors, adjusted for
  // beatTime
  ticksFromSelection(startSelector, endSelector) {
    const selection = SmoSelection.selectionFromSelector(this.score, startSelector);
    let ticks = selection.note.tickCount;
    let nextSelection = SmoSelection.nextNoteSelectionFromSelector(this.score, startSelector);
    while (nextSelection && !SmoSelector.gt(nextSelection.selector, endSelector)) {
      ticks += nextSelection.note.tickCount;
      nextSelection = SmoSelection.nextNoteSelectionFromSelector(this.score, nextSelection.selector);
    }
    return ticks / this.timeDiv;
  }
  // ### getHairpinInfo
  // Get any hairpin starting at this selection, and calculate its
  // effect on the overall volume
  getHairpinInfo(track, selection) {
    const staff = selection.staff;
    const selector = selection.selector;
    const cp = (x) => JSON.parse(JSON.stringify(x));
    const hps = staff.getModifiersAt(selector)
      .filter((hairpin) => hairpin.ctor === 'SmoStaffHairpin' &&
        SmoSelector.eq(hairpin.startSelector, selector));
    const rv = [];
    // clear out old hairpins.
    // usually there will only be a single hairpin per voice, except
    // in the case of overlapping.
    track.hairpins.forEach((hairpin) => {
      if (SmoSelector.gteq(selection.selector, hairpin.startSelector) &&
        SmoSelector.lteq(selection.selector, hairpin.endSelector)) {
        rv.push(hairpin);
      }
    });
    track.hairpins = rv;

    hps.forEach((hairpin) => {
      let endDynamic = 0;
      const trackHairpin = {
        hairpinType: hairpin.hairpinType,
        startSelector: cp(hairpin.startSelector),
        endSelector: cp(hairpin.endSelector)
      };
      // For a hairpin, try to calculate the volume difference from start to end,
      // as a function of ticks
      const endSelection = SmoSelection.selectionFromSelector(this.score, hairpin.endSelector);
      endDynamic = this.volumeFromNote(endSelection.note);
      const startDynamic = this.volumeFromNote(selection.note);
      if (startDynamic === endDynamic) {
        const nextSelection = SmoSelection.nextNoteSelectionFromSelector(this.score, hairpin.endSelector);
        if (nextSelection) {
          endDynamic = this.volumeFromNote(nextSelection.note);
        }
      }
      if (startDynamic === endDynamic) {
        const offset = hairpin.hairpingType === SmoStaffHairpin.CRESCENDO ? 0.1 : -0.1;
        endDynamic = Math.max(endDynamic + offset, 0.1);
        endDynamic = Math.min(endDynamic, 1.0);
      }
      trackHairpin.delta = startDynamic - endDynamic;
      trackHairpin.ticks = this.ticksFromSelection(hairpin.startSelector, hairpin.endSelector);
      track.hairpins.push(trackHairpin);
    });
  }
  // ### computeVolume
  // come up with a current normalized volume based on dynamics
  // that appear in the music
  computeVolume(track, selection) {
    if (track.volume === 0) {
      track.volume = this.volumeFromNote(selection.note,
        SmoAudioTrack.dynamicVolumeMap.mf);
      return;
    }
    if (track.hairpins.length) {
      const hp = track.hairpins[0];
      const coff = (selection.note.tickCount / this.timeDiv) / hp.ticks;
      track.volume += hp.delta * coff;
    } else {
      track.volume = this.volumeFromNote(selection.note, track.volume);
    }
  }
  getSlurInfo(track, selection) {
    const tn = [];
    const cp = (x) => JSON.parse(JSON.stringify(x));
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
  }
  isTiedPitch(track, selection, noteIx) {
    if (noteIx < 1) {
      return false;
    }
    if (!track.tiedNotes.length) {
      return false;
    }
    return smoMusic.pitchArraysMatch(track.notes[noteIx - 1].pitch, selection.note.pitches);
  }
  createTrackNote(track, selection, duration, noteIx) {
    if (this.isTiedPitch(track, selection, noteIx)) {
      track.notes[noteIx - 1].duration += duration;
      return;
    }
    const pitchArray = JSON.parse(JSON.stringify(selection.note.pitches));
    track.notes.push({
      pitch: pitchArray,
      noteType: 'n',
      duration,
      selector: selection.selector,
      volume: track.volume
    });
  }
  createTrackRest(duration, selector) {
    return {
      duration,
      noteType: 'r',
      selector
    };
  }
  convert() {
    const trackHash = { };
    const measureBeats = [];
    this.score.staves.forEach((staff, staffIx) => {
      this.volume = 0;
      staff.measures.forEach((measure, measureIx) => {
        measure.voices.forEach((voice, voiceIx) => {
          let duration = 0;
          const trackKey = (this.score.staves.length * voiceIx) + staffIx;
          if (typeof(trackHash[trackKey]) === 'undefined') {
            trackHash[trackKey] = SmoAudioTrack.emptyTrack;
          }
          const measureSelector = {
            staff: staffIx, measure: measureIx
          };
          const track = trackHash[trackKey];
          // staff 0/voice 0, set track values for the measure
          if (voiceIx === 0) {
            if (staffIx === 0) {
              measureBeats.push(measure.getMaxTicksVoice() / this.timeDiv);
            }
            const selectorKey = SmoSelector.getMeasureKey(measureSelector);
            track.tempoMap[selectorKey] = measure.tempo.bpm;
            track.timeSignatureMap[selectorKey] = {
              numerator: measure.numBeats,
              denominator: measure.beatValue
            };
          }
          // If this voice is not in every measure, fill in the space
          // in its own channel.
          while (track.lastMeasure < measureIx) {
            duration += measureBeats[trackObj.lastMeasure];
            track.notes.push(this.createTrackRest(duration,
              { staff: staffIx, measure: measureIx, voice: voiceIx, note: 0 }
            ));
            track.lastMeasure += 1;
          }
          let tupletTicks = 0;
          voice.notes.forEach((note, noteIx) => {
            const selector = {
              staff: staffIx, measure: measureIx, voice: voiceIx, tick: noteIx
            };
            const selection = SmoSelection.selectionFromSelector(this.score, selector);
            // update staff features of slur/tie/cresc.
            this.getSlurInfo(track, selection);
            this.getHairpinInfo(track, selection);
            const tuplet = measure.getTupletForNote(note);
            if (tuplet && tuplet.getIndexOfNote(note) === 0) {
              tupletTicks = tuplet.tupletTicks / this.timeDiv;
            }
            if (tupletTicks) {
              // tuplet likely won't fit evenly in ticks, so
              // use remainder in last tuplet note.
              if (tuplet.getIndexOfNote(note) === tuplet.notes.length - 1) {
                duration = tupletTicks;
                tupletTicks = 0;
              } else {
                duration = note.tickCount / this.timeDiv;
                tupletTicks -= duration;
              }
            } else {
              duration = note.tickCount / this.timeDiv;
            }
            if (note.isRest()) {
              track.notes.push(this.createTrackRest(duration, selector));
            } else {
              this.computeVolume(track, selection);
              this.createTrackNote(track, selection, duration, noteIx);
            }
          });
          track.lastMeasure += 1;
        });
      });
    });
    return trackHash;
  }
}
