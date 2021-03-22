// ## XmlState
// Keep state of musical objects while parsing music xml
// eslint-disable-next-line no-unused-vars
class XmlState {
  static get defaults() {
    return {
      divisions: 1, tempo: new SmoTempoText(), timeSignature: '4/4', keySignature: 'C',
      clefInfo: [], staffGroups: [], smoStaves: []
    };
  }
  constructor() {
    Vex.Merge(this, XmlState.defaults);
  }

  // Initialize things that persist throughout a staff
  // likc hairpins and slurs
  initializeForPart() {
    this.slurs = {};
    this.ties = {};
    this.wedges = {};
    this.hairpins = [];
    this.globalCursor = 0;
    this.staffVoiceHash = {};
    this.measureIndex = -1;
    this.completedSlurs = [];
    this.completedTies = [];
    this.verseMap = {};
  }
  // ### initializeForMeasure
  // reset state for a new measure:  beam groups, tuplets
  // etc. that don't cross measure boundaries
  initializeForMeasure(measureElement) {
    const oldMeasure = this.measureNumber;
    this.measureNumber =
      parseInt(measureElement.getAttribute('number'), 10) - 1;
    if (isNaN(this.measureNumber)) {
      this.measureNumber = oldMeasure + 1;
    }
    this.tuplets = {};
    this.tickCursor = 0;
    this.tempo = SmoMeasureModifierBase.deserialize(this.tempo.serialize());
    this.tempo.display = false;
    this.staffArray = [];
    this.graceNotes = [];
    this.currentDuration = 0;
    this.beamGroups = {};
    this.completedTuplets = [];
    this.dynamics = [];
    this.previousNote = {};
    this.measureIndex += 1;
  }
  // ### initializeStaff
  // voices are not sequential, seem to have artitrary numbers and
  // persist per part, so we treat them as a hash.
  // staff IDs persist per part but are sequential.
  initializeStaff(staffIndex, voiceIndex) {
    if (typeof(this.staffArray[staffIndex].voices[voiceIndex]) === 'undefined') {
      this.staffArray[staffIndex].voices[voiceIndex] = { notes: [] };
      this.staffArray[staffIndex].voices[voiceIndex].ticksUsed = 0;
      // keep track of 0-indexed voice for slurs and other modifiers
      if (!this.staffVoiceHash[staffIndex]) {
        this.staffVoiceHash[staffIndex] = [];
      }
      if (this.staffVoiceHash[staffIndex].indexOf(voiceIndex) < 0) {
        this.staffVoiceHash[staffIndex].push(voiceIndex);
      }
      // The smo 0-indexed voice index, used in selectors
      this.beamGroups[voiceIndex] = null;
    }
  }
  // ### updateStaffGroups
  // once everything is parsed, figure out how to group the staves
  updateStaffGroups() {
    this.systems = [];
    this.staffGroups.forEach((staffGroup) => {
      const len = this.smoStaves[staffGroup.start].measures.length;
      const startSelector = { staff: staffGroup.start, measure: 0 };
      const endSelector = { staff: staffGroup.start + (staffGroup.length - 1),
        measure: len };
      this.systems.push(
        new SmoSystemGroup({
          startSelector, endSelector, leftConnector: SmoSystemGroup.connectorTypes.brace
        })
      );
    });
  }
  addLyric(note, lyricData) {
    if (!this.verseMap[lyricData.verse]) {
      const keys = Object.keys(this.verseMap);
      this.verseMap[lyricData.verse] = keys.length;
    }
    lyricData.verse = this.verseMap[lyricData.verse];
    const lyric = new SmoLyric(lyricData);
    note.addLyric(lyric);
  }
  // ### processWedge (hairpin)
  processWedge(wedgeInfo) {
    if (wedgeInfo.type) {
      // If we already know about this wedge, it must have been
      // started, so complete it
      if (this.wedges.type) {
        this.hairpins.push({ type: this.wedges.type,
          start: this.wedges.start,
          end: this.tickCursor + this.globalCursor });
        this.wedges = {};
      } else {
        this.wedges.type = wedgeInfo.type;
        this.wedges.start = this.tickCursor + this.globalCursor;
      }
    }
  }
  // ### backtrackHairpins
  // For the measure just parsed, find the correct tick for the
  // beginning and end of hairpins, if a hairpin stop directive
  // was received.  These are not associated with a staff or voice, so
  // we use the first one in the measure element for both
  backtrackHairpins(smoStaff, staffId) {
    this.hairpins.forEach((hairpin) => {
      let hpMeasureIndex = this.measureIndex;
      let hpMeasure = smoStaff.measures[hpMeasureIndex];
      let startTick = hpMeasure.voices[0].notes.length - 1;
      let hpTickCount = this.globalCursor; // All ticks read so far
      const endSelector = {
        staff: staffId - 1, measure: hpMeasureIndex, voice: 0,
        tick: -1
      };
      while (hpMeasureIndex >= 0 && hpTickCount > hairpin.start) {
        if (endSelector.tick < 0 && hpTickCount <= hairpin.end) {
          endSelector.tick = startTick;
        }
        hpTickCount -= hpMeasure.voices[0].notes[startTick].ticks.numerator;
        if (hpTickCount > hairpin.start) {
          startTick -= 1;
          if (startTick < 0) {
            hpMeasureIndex -= 1;
            hpMeasure = smoStaff.measures[hpMeasureIndex];
            startTick = hpMeasure.voices[0].notes.length - 1;
          }
        }
      }
      const startSelector = {
        staff: staffId - 1, measure: hpMeasureIndex, voice: 0, tick: startTick
      };
      const smoHp = new SmoStaffHairpin({
        startSelector, endSelector, hairpinType: hairpin.type === 'crescendo' ?
          SmoStaffHairpin.types.CRESCENDO :
          SmoStaffHairpin.types.DECRESCENDO
      });
      smoStaff.modifiers.push(smoHp);
    });
    this.hairpins = [];
  }

  // ### updateDynamics
  // Based on note just parsed, put the dynamics on the closest
  // note, based on the offset of dynamic
  updateDynamics() {
    const smoNote = this.previousNote;
    const tickCursor = this.tickCursor;
    const newArray = [];
    this.dynamics.forEach((dynamic) => {
      if (tickCursor >= dynamic.offset) {
        // TODO: change the smonote name of this interface
        smoNote.addModifier(new SmoDynamicText({ text: dynamic.dynamic }));
      } else {
        newArray.push(dynamic);
      }
    });
    this.dynamics = newArray;
  }
  // For the given voice, beam the notes according to the
  // note beam length
  backtrackBeamGroup(voice, beamGroup) {
    let i = 0;
    for (i = 0; i < beamGroup.notes; ++i) {
      const note = voice.notes[voice.notes.length - (i + 1)];
      if (!note) {
        console.warn('no note for beam group');
        return;
      }
      note.endBeam = i === 0;
      note.beamBeats = beamGroup.ticks;
    }
  }
  // ### updateBeamState
  // Keep track of beam instructions found while parsing note element
  // includes time alteration from tuplets
  updateBeamState(beamState, alteration, voice, voiceIndex) {
    const note = voice.notes[voice.notes.length - 1];
    if (beamState === mxmlHelpers.beamStates.BEGIN) {
      this.beamGroups[voiceIndex] = { ticks: (note.tickCount * alteration.noteCount) / alteration.noteDuration,
        notes: 1 };
    } else if (this.beamGroups[voiceIndex]) {
      this.beamGroups[voiceIndex].ticks += note.tickCount;
      this.beamGroups[voiceIndex].notes += 1;
      if (beamState === mxmlHelpers.beamStates.END) {
        this.backtrackBeamGroup(voice, this.beamGroups[voiceIndex]);
        this.beamGroups[voiceIndex] = null;
      }
    }
  }
  updateTieStates(tieInfos) {
    tieInfos.forEach((tieInfo) => {
      // tieInfo = { number, type, orientation, selector, pitchIndex }
      if (tieInfo.type === 'start') {
        this.ties[tieInfo.number] = JSON.parse(JSON.stringify(tieInfo));
      } else if (tieInfo.type === 'stop') {
        if (this.ties[tieInfo.number]) {
          this.completedTies.push({
            startSelector: JSON.parse(JSON.stringify(this.ties[tieInfo.number].selector)),
            endSelector: JSON.parse(JSON.stringify(tieInfo.selector)),
            fromPitch: this.ties[tieInfo.number].pitchIndex,
            toPitch: tieInfo.pitchIndex
          });
        }
      }
    });
  }
  static slurDirectionFromNote(clef, note, orientation) {
    const rv = { invert: false, yOffset: SmoSlur.defaults.yOffset };
    const flagState = smoMusic.flagStateFromNote(clef, note);
    if (flagState === SmoNote.flagStates.up && orientation === 'over') {
      rv.invert = true;
      rv.yOffset += 50;
    }
    if (flagState === SmoNote.flagStates.down && orientation === 'under') {
      rv.invert = true;
      rv.yOffset -= 50;
    }
    return rv;
  }
  // ### updateSlurStates
  // While parsing a measure,
  // on a slur element, either complete a started
  // slur or start a new one.
  updateSlurStates(slurInfos) {
    const clef = this.staffArray[this.staffIndex].clefInfo.clef;
    const note = this.previousNote;
    slurInfos.forEach((slurInfo) =>  {
      // slurInfo = { number, type, selector }
      if (slurInfo.type === 'start') {
        if (this.slurs[slurInfo.number] && this.slurs[slurInfo.number].type === 'stop') {
          // if start and stop come out of order
          const slurParams = {
            endSelector: JSON.parse(JSON.stringify(this.slurs[slurInfo.number].selector)),
            startSelector: slurInfo.selector
          };
          const alter = XmlState.slurDirectionFromNote(clef, note, slurInfo.orientation);
          slurParams.yOffset = alter.yOffset;
          slurParams.invert = alter.invert;
          console.log('complete slur stop first ' + slurInfo.number + JSON.stringify(slurParams, null, ' '));
          this.completedSlurs.push(slurParams);
          this.slurs[slurInfo.number] = null;
        } else {
          const alter = XmlState.slurDirectionFromNote(clef, note, slurInfo.orientation);
          this.slurs[slurInfo.number] = JSON.parse(JSON.stringify(slurInfo));
          this.slurs[slurInfo.number].yOffset = alter.yOffset;
          this.slurs[slurInfo.number].invert = alter.invert;
        }
      } else if (slurInfo.type === 'stop') {
        if (this.slurs[slurInfo.number] && this.slurs[slurInfo.number].type === 'start') {
          const slurParams = {
            startSelector: JSON.parse(JSON.stringify(this.slurs[slurInfo.number].selector)),
            endSelector: slurInfo.selector,
            yOffset: this.slurs[slurInfo.number].yOffset,
            invert: this.slurs[slurInfo.number].invert
          };
          console.log('complete slur ' + slurInfo.number + JSON.stringify(slurParams, null, ' '));
          this.completedSlurs.push(slurParams);
          this.slurs[slurInfo.number] = null;
        } else {
          this.slurs[slurInfo.number] = JSON.parse(JSON.stringify(slurInfo));
        }
      }
    });
  }
  // ### completeTies
  completeTies() {
    this.completedTies.forEach((tie) => {
      const smoTie = new SmoTie({
        startSelector: tie.startSelector,
        endSelector: tie.endSelector
      });
      smoTie.lines = [{
        from: tie.fromPitch, to: tie.toPitch
      }];
      this.smoStaves[tie.startSelector.staff].addStaffModifier(smoTie);
    });
  }
  // ### completeSlurs
  // After reading in a measure, update any completed slurs and make them
  // into SmoSlur and add them to the SmoSystemGroup objects.
  // staffIndexOffset is the offset from the xml staffId and the score staff Id
  // (i.e. the staves that have already been parsed in other parts)
  completeSlurs() {
    this.completedSlurs.forEach((slur) => {
      const smoSlur = new SmoSlur({
        startSelector: slur.startSelector,
        endSelector: slur.endSelector,
        yOffset: slur.yOffset,
        invert: slur.invert
      });
      this.smoStaves[slur.startSelector.staff].addStaffModifier(smoSlur);
    });
  }
  // ### backtrackTuplets
  // If we received a tuplet end, go back through the voice
  // and construct the SmoTuplet.
  backtrackTuplets(voice, tupletNumber, staffId, voiceId) {
    const tupletState = this.tuplets[tupletNumber];
    let i = tupletState.start.tick;
    const notes = [];
    const durationMap = [];
    while (i < voice.notes.length) {
      const note = voice.notes[i];
      notes.push(note);
      if (i === tupletState.start.tick) {
        durationMap.push(1.0);
      } else {
        const prev = voice.notes[i - 1];
        durationMap.push(note.ticks.numerator / prev.ticks.numerator);
      }
      i += 1;
    }
    const tuplet = new SmoTuplet({
      notes,
      durationMap,
      voice: voiceId
    });
    // Store the tuplet with the staff ID and voice so we
    // can add it to the right measure when it's created.
    this.completedTuplets.push({ tuplet, staffId, voiceId });
  }
  // ### updateTupletStates
  // react to a tuplet start or stop directive
  updateTupletStates(tupletInfos, voice, staffIndex, voiceIndex) {
    const tick = voice.notes.length - 1;
    tupletInfos.forEach((tupletInfo) =>  {
      if (tupletInfo.type === 'start') {
        this.tuplets[tupletInfo.number] = {
          start: { staff: staffIndex, voice: voiceIndex, tick }
        };
      } else if (tupletInfo.type === 'stop') {
        this.tuplets[tupletInfo.number].end = {
          staff: staffIndex, voice: voiceIndex, tick
        };
        this.backtrackTuplets(voice, tupletInfo.number, staffIndex, voiceIndex);
      }
    });
  }
  addTupletsToMeasure(smoMeasure, staffId, voiceId) {
    const completed = [];
    this.completedTuplets.forEach((tuplet) => {
      if (tuplet.voiceId === voiceId && tuplet.staffId === staffId) {
        smoMeasure.tuplets.push(tuplet.tuplet);
      } else {
        completed.push(tuplet);
      }
    });
    this.completedTuplets = completed;
  }
}
