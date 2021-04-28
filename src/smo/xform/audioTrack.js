// ## SmoAudioTrack
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
// eslint-disable-next-line no-unused-vars
class SmoAudioTrack {
  // ### dynamicVolumeMap
  // normalized dynamic
  static get dynamicVolumeMap() {
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
  static get emptyTrack() {
    return {
      lastMeasure: 0,
      notes: [],
      tempoMap: {},
      timeSignatureMap: {},
      hairpins: [],
      volume: 0,
      tiedNotes: [],
      repeats: []
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
  getVoltas(repeat, measureIndex) {
    let v1 = measureIndex;
    let endings = null;
    let currentEnding = -1;
    const rv = [];
    const staff = this.score.staves[0];
    while (v1 > repeat.startRepeat) {
      endings = staff.measures[v1].getNthEndings();
      if (endings.length) {
        currentEnding = endings[0].number;
        rv.push({ measureIndex: v1,  ending: currentEnding });
        v1 = endings[0].endSelector.measure + 1;
        break;
      }
      v1--;
    }
    if (currentEnding < 0) {
      return rv;
    }
    while (endings.length && v1 < staff.measures.length) {
      endings = staff.measures[v1].getNthEndings();
      if (!endings.length) {
        break;
      }
      currentEnding = endings[0].number;
      rv.push({ measureIndex: v1, ending: currentEnding });
      v1 = endings[0].endSelector.measure + 1;
    }
    rv.sort((a, b) => a - b);
    return rv;
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
    if (track.notes[noteIx - 1].noteType !== 'n') {
      return false;
    }
    return smoMusic.pitchArraysMatch(track.notes[noteIx - 1].pitches, selection.note.pitches);
  }
  createTrackNote(track, selection, duration, runningDuration) {
    const noteIx = track.notes.length;
    if (this.isTiedPitch(track, selection, noteIx)) {
      track.notes[noteIx - 1].duration += duration;
      return;
    }
    const pitchArray = JSON.parse(JSON.stringify(selection.note.pitches));
    track.notes.push({
      pitches: pitchArray,
      noteType: 'n',
      duration,
      offset: runningDuration,
      selector: selection.selector,
      volume: track.volume
    });
  }
  createTrackRest(duration, runningDuration, selector) {
    return {
      duration,
      offset: runningDuration,
      noteType: 'r',
      selector
    };
  }
  createRepeatMap(repeats) {
    let startm = 0;
    let j = 0;
    const staff = this.score.staves[0];
    const repeatMap = [];
    const endm = staff.measures.length - 1;
    repeats.forEach((repeat) => {
      // Include the current start to start of repeat, unless there is no start repeat
      if (repeat.startRepeat > 0) {
        repeatMap.push({ startMeasure: startm, endMeasure: repeat.startRepeat - 1 });
      }
      // Include first time through
      repeatMap.push({ startMeasure: repeat.startRepeat, endMeasure: repeat.endRepeat });
      startm = repeat.startRepeat;
      // nth time through, go to the start of volta 0, then to the start of volta n
      if (repeat.voltas.length < 1) {
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
  convert() {
    const trackHash = { };
    const measureBeats = [];
    const repeats = [];
    let startRepeat = 0;
    const tempoMap = [];
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
          const tempo = measure.tempo.bpm * (measure.tempo.beatDuration / 4096);
          // staff 0/voice 0, set track values for the measure
          if (voiceIx === 0) {
            if (staffIx === 0) {
              measureBeats.push(measure.getMaxTicksVoice() / this.timeDiv);
              const startBar = measure.getStartBarline();
              const endBar =  measure.getEndBarline();
              if (startBar.barline === SmoBarline.barlines.startRepeat) {
                startRepeat = measureIx;
              }
              if (endBar.barline === SmoBarline.barlines.endRepeat) {
                const repeat = { startRepeat, endRepeat: measureIx };
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
            track.notes.push(this.createTrackRest(measureBeats[track.lastMeasure], 0,
              { staff: staffIx, measure: track.lastMeasure, voice: voiceIx, note: 0 },
            ));
            track.lastMeasure += 1;
          }
          let tupletTicks = 0;
          let runningDuration = 0;
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
              track.notes.push(this.createTrackRest(duration, runningDuration, selector));
            } else {
              this.computeVolume(track, selection);
              this.createTrackNote(track, selection, duration, runningDuration);
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
        track.notes.push(this.createTrackRest(measureBeats[track.lastMeasure], 0,
          { staff,  measure: track.lastMeasure, voice, note: 0 }
        ));
        track.lastMeasure += 1;
      }
    });
    const repeatMap = this.createRepeatMap(repeats);
    return { tracks, repeats, repeatMap, measureBeats, tempoMap };
  }
}
