// ## SmoAudioTrack
// Convert a score into a JSON structure that can be rendered to audio.  For
// each staff/voice, return a track that consists of:
// array of pitches, duration, normalized volumn, tempo changes.
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
  constructor(score, beatTime) {
    this.timeDiv = 4096 / beatTime;
    this.score = score;
    this.beatTime = beatTime;
  }
  // ### volumeFromNote
  // Return a normalized volumn from the dynamic setting of the note
  // or 0 if none is specified
  volumeFromNote(smoNote) {
    const dynamic = smoNote.getModifiers('SmoDynamicText');
    if (dynamic.length < 1) {
      return 0;
    }
    if (dynamic[0].text === SmoDynamicText.dynamics.SFZ) {
      return SmoAudioTrack.dynamicVolumeMap[SmoDynamicText.F];
    }
    return SmoAudioTrack.dynamicVolumeMap[dynamic[0].text];
  }
  // ### ticksFromSelection
  // return the count of ticks between the selectors, adjusted for
  // beatTime
  ticksFromSelection(score, startSelector, endSelector) {
    const selection = SmoSelection.selectionFromSelector(startSelector);
    let ticks = selection.note.tickCount;
    let nextSelection = SmoSelection.nextNoteSelectionFromSelector(score, startSelector);
    while (nextSelection && !SmoSelector.gt(nextSelection.selector, endSelector)) {
      ticks += note.tickCount;
      nextSelection = SmoSelection.nextNoteSelectionFromSelector(score, startSelector);
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
    const hps = staff.getModifier(selector, 'SmoStaffHairpin')
      .filter((hairpin) => SmoSelector.eq(hairpin.startSelector, selector));
    rv = [];
    // clear out old hairpins.
    // usually there will only be a single hairpin per voice, except
    // in the case of overlapping.
    track.hairpins.forEach((hairpin) => {
      if (SmoSelector.gteq(hairpin.startSelector, selection.selector) &&
        SmoSelector.lteq(hairpin.startSelector, selection.selector)) {
        rv.push(hairpin);
      }
    });
    track.hairpins = rv;

    hps.forEach((hairpin) => {
      let endDynamic = 0;
      trackHairpin = {
        hairpinType: hairpin.hairpinType,
        startSelector: cp(hairpin.startSelector),
        endSelector: cp(hairpin.endSelector),
        ticksUsed: 0
      };
      // For a hairpin, try to calculate the volume difference from start to end,
      // as a function of ticks
      const endSelection = SmoSelection.selectionFromSelector(hairpin.endSelector);
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
      trackHairpin.ticks = ticksFromSelection(hairpin.startSelector, hairpin.endSelector);
      track.hairpins.push(trackHairpin);
    });
  }
  /* getVolume(selection) {

  }  */
  getSlurInfo(staff, selector) {
    const slurStart = staff.getSlursStartingAt(selector).length > 0;
    const tieStart = staff.getTiesStartingAt(selector).length > 0;
    const tieEnd = staff.getTiesEndingAt(selector).length > 0;
    const slurEnd = staff.getSlursEndingAt(selector).length > 0;
    return { slurStart: slurStart || tieStart, slurEnd: slurEnd || tieEnd };
  }
  createTrackNote(note, duration, selector, slurInfo) {
    const pitchArray = JSON.parse(JSON.stringify(note.pitches));
    return {
      pitch: pitchArray,
      noteType: 'n',
      duration,
      selector,
      slurInfo
    };
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
            trackHash[trackKey] = {
              lastMeasure: 0,
              notes: [],
              tempoMap: {},
              timeSignatureMap: {},
              hairpins: [],
              volume: 0
            };
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
            track.tempoMap[measureSelector] = measure.tempo.bpm;
            track.timeSignatureMap[measureSelector] = measure.beatValue;
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
              staff: staffIx, measure: measureIx, voice: voiceIx, note: noteIx
            };
            const selection = SmoSelection.selectionFromSelector(this.score, selector);
            const slurInfo = this.getSlurInfo(staff, selector);
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
              track.notes.push(this.createTrackNote(note, duration, selector, slurInfo));
            }
          });
          track.lastMeasure += 1;
        });
      });
    });
    return trackHash;
  }
}
