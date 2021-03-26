
// An operation works on a selection or set of selections to edit the music
class SmoOperation {

  static setForcePageBreak(score, selection, value) {
    score.staves.forEach((staff) => {
      staff.measures[selection.selector.measure].setForcePageBreak(value);
    });
  }
  static setForceSystemBreak(score, selection, value) {
    score.staves.forEach((staff) => {
      staff.measures[selection.selector.measure].setForceSystemBreak(value);
    });
  }
  static setMeasureStretch(score, selection, value) {
    score.staves.forEach((staff) => {
      const measure = staff.measures[selection.selector.measure];
      const delta = measure.customStretch;
      measure.customStretch = value;
      const nwidth = measure.staffWidth - (delta - measure.customStretch);
      measure.setWidth(nwidth);
    });
  }

  static setAutoJustify(score, selection, value) {
    score.staves.forEach((staff) => {
      staff.measures[selection.selector.measure].setAutoJustify(value);
    });
  }

  static updateProportionDefault(score, oldValue, newValue) {
    score.preferences.customProportion = newValue;
    SmoMeasure.defaults.customProportion = newValue;
    // since we are setting a default that has already been written locally, update the
    // measures.
    score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (measure.customProportion === oldValue) {
          measure.customProportion = newValue;
        }
      });
    });
  }

  static setFormattingIterations(score, selection, value) {
    score.staves.forEach((staff) => {
      staff.measures[selection.selector.measure].setFormattingIterations(value);
    });
  }

  static addKeySignature(score, selection, keySignature) {
    score.addKeySignature(selection.selector.measure, keySignature);
  }

  static deleteMeasure(score, selection) {
  var measureIndex = selection.selector.measure;

  score.deleteMeasure(measureIndex);
  }

  static addPickupMeasure(score, duration) {
    score.addPickupMeasure(0, duration);
  }

  static addConnectorDown(score,selections,parameters) {
    var msel = SmoSelection.getMeasureList(selections);
    var len = msel.length - 1;
    if (score.staves.length <= msel[len].selector.staff) {
      return;
    }
    var existing = score.getSystemGroupForStaff(msel[0]);
    if (existing && existing.endSelector.staff < selections[len].selector.staff) {
      existing.endSelector.staff = msel[len].selector.staff+1;
    } else {
      parameters.startSelector = {staff:msel[0].selector.staff,measure:msel[0].selector.measure};
      parameters.endSelector = {staff:msel[len].selector.staff + 1,measure:msel[len].selector.measure};
      score.addOrReplaceSystemGroup(new SmoSystemGroup(parameters));
    }
  }

  static convertToPickupMeasure(score, duration) {
    score.convertToPickupMeasure(0,duration);
  }
  static toggleBeamGroup(noteSelection) {
    noteSelection.note.endBeam = !(noteSelection.note.endBeam);
  }

  static padMeasureLeft(selection, padding) {
    selection.measure.padLeft = padding;
  }

  static setActiveVoice(score, voiceIx) {
    score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        measure.setActiveVoice(voiceIx);
      });
    });
  }

  static addRemoveMicrotone(ignore, selections, tone) {
    selections.forEach((sel) => {
      if (sel.note.tones.findIndex((tt) => tt.tone === tone.tone
        && tt.pitch === tone.pitch) >= 0) {
          sel.note.removeMicrotone(tone);
        } else {
          sel.note.addMicrotone(tone);
        }
    });
  }

  static moveStaffUpDown(score,selection,index) {
    const index1 = selection.selector.staff;
    const index2 = selection.selector.staff + index;
    if (index2 < score.staves.length && index2 >= 0) {
      score.swapStaves(index1,index2);
    }
  }

  static depopulateVoice(selection,voiceIx) {
    var ix = 0;
    var voices = [];
    var measure = selection.measure;
    measure.voices.forEach((voice) => {
      if (measure.voices.length <2 || ix != voiceIx)  {
        voices.push(voice);
      }
      ix += 1;
    });
    measure.voices = voices;

    if (measure.getActiveVoice() >= measure.voices.length) {
      measure.setActiveVoice(0);
    }
  }

  static populateVoice(selection, voiceIx) {
    selection.measure.populateVoice(voiceIx);
  }
  // ### setMeasureProportion
  // Change the softmax factor.
  static setMeasureProportion(score, selection, proportion) {
    score.staves.forEach((staff) => {
      staff.measures[selection.selector.measure].customProportion = proportion;
    });
  }
  static setTimeSignature(score, selections, timeSignature) {
    const selectors = [];
    let nm = {};
    let i = 0;
    let ticks = 0;
    selections.forEach((selection) => {
      for (i = 0; i < score.staves.length; ++i) {
        var measureSel = {
          staff: i,
          measure: selection.selector.measure
        };
        selectors.push(measureSel);
      }
    });
    const tsTicks = smoMusic.timeSignatureToTicks(timeSignature);

    selectors.forEach((selector) => {
      const params = {};
      const voices = [];
      const rowSelection = SmoSelection.measureSelection(score, selector.staff, selector.measure);
      let nm = {};
      const attrs = SmoMeasure.defaultAttributes.filter((aa) => aa !== 'timeSignature');
      const psel =  SmoSelection.measureSelection(score,selector.staff, selector.measure);
      if (!psel['measure']) {
        console.log('Error: score has changed in time signature change');
      } else {
        const proto = SmoSelection.measureSelection(score, selector.staff,selector.measure).measure;
        smoSerialize.serializedMerge(attrs, proto, params);
        params.timeSignature = timeSignature;
        nm = SmoMeasure.getDefaultMeasure(params);
        const spareNotes = SmoMeasure.getDefaultNotes(params);
        nm.setX(rowSelection.measure.staffX);
        nm.setY(rowSelection.measure.staffY);
        nm.setWidth(rowSelection.measure.staffWidth);
        ['forceKeySignature', 'forceTimeSignature', 'forceTempo', 'forceClef'].forEach((attr) => {
          nm[attr] = rowSelection.measure[attr];
        });
        ticks = 0;
        proto.voices.forEach((voice) => {
          const nvoice=[];
          for (i = 0; i < voice.notes.length; ++i) {
            const pnote = voice.notes[i];
            const nnote = SmoNote.deserialize(pnote.serialize());
            if (ticks + pnote.tickCount <= tsTicks) {
              nnote.ticks = JSON.parse(JSON.stringify(pnote.ticks))
              nvoice.push(nnote);
              ticks += nnote.tickCount;
            } else {
              const remain = (ticks + pnote.tickCount)-tsTicks;
              nnote.ticks = { numerator: remain, denominator: 1, remainder: 0};
              nvoice.push(nnote);
              ticks += nnote.tickCount;
            }
            if (ticks >= tsTicks) {
              break;
            }
          }
          if (ticks < tsTicks) {
            const adjNote = SmoNote.cloneWithDuration(nvoice[nvoice.length - 1], { numerator: tsTicks - ticks, denominator: 1, remainder: 0 });
            nvoice.push(adjNote);
          }
          voices.push({ notes: nvoice });
        });
      }
      nm.voices = voices;
      score.replaceMeasure(selector, nm);
    });
  }

  static batchSelectionOperation(score, selections, operation) {
    var measureTicks = [];
    selections.forEach((selection) => {
    var measureSel = {
      staff: selection.selector.staff,
      measure: selection.selector.measure,
      voice: selection.selector.voice
    };
    if (!measureTicks[measureSel]) {
      var tm = selection.measure.tickmapForVoice(selection.selector.voice);
      var tickOffset = tm.durationMap[selection.selector.tick];
      var selector = JSON.parse(JSON.stringify(selection.selector));
      measureTicks.push({
        selector: selector,
        tickOffset: tickOffset
      });
    }
    });
    measureTicks.forEach((measureTick) => {
      var selection = SmoSelection.measureSelection(score, measureTick.selector.staff, measureTick.selector.measure);
      var tickmap = selection.measure.tickmapForVoice(measureTick.selector.voice);
      var ix = tickmap.durationMap.indexOf(measureTick.tickOffset);
      if (ix >= 0) {
        var nsel = SmoSelection.noteSelection(score, measureTick.selector.staff, measureTick.selector.measure,
        measureTick.selector.voice, ix);
        SmoOperation[operation](nsel);
      }
    });
  }
  // ## doubleDuration
  // ## Description
  // double the duration of a note in a measure, at the expense of the following
  // note, if possible.  Works on tuplets also.
  static doubleDuration(selection) {
    var note = selection.note;
    var measure = selection.measure;
    var selector = selection.selector;
    var notes = measure.voices[selector.voice].notes;
    var tuplet = measure.getTupletForNote(note);
    if (!tuplet) {
      SmoDuration.doubleDurationNonTuplet(selection);
    } else {
      SmoDuration.doubleDurationTuplet(selection);
    }
    return true;
  }

  // ## halveDuration
  // ## Description
  // Replace the note with 2 notes of 1/2 duration, if possible
  // Works on tuplets also.
  static halveDuration(selection) {
    const note = selection.note;
    let divisor = 2;
    const measure = selection.measure;
    const tuplet = measure.getTupletForNote(note);
    if (measure.numBeats % 3 === 0 && selection.note.tickCount === 6144) {
      // special behavior, if this is dotted 1/4 in 6/8, split to 3
      divisor = 3;
    }
    if (!tuplet) {
      const nticks = note.tickCount / divisor;
      if (!smoMusic.ticksToDuration[nticks]) {
        return;
      }
      var actor = new SmoContractNoteActor({
        startIndex: selection.selector.tick,
        tickmap: measure.tickmapForVoice(selection.selector.voice),
        newTicks: nticks
      });
      SmoTickTransformer.applyTransform(measure, actor, selection.selector.voice);
      smoBeamerFactory.applyBeams(measure);
    } else {
      const startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
      const actor = new SmoContractTupletActor({
        changeIndex: startIndex,
        measure,
        voice: selection.selector.voice
      });
      SmoTickTransformer.applyTransform(measure, actor, selection.selector.voice);
    }
  }

  // ## makeTuplet
  // ## Description
  // Makes a non-tuplet into a tuplet of equal value.
  static makeTuplet(selection, numNotes) {
    const note = selection.note;
    const measure = selection.measure;

    if (measure.getTupletForNote(note)) {
      return;
    }
    const nticks = note.tickCount;

    var actor = new SmoMakeTupletActor({
      index: selection.selector.tick,
      totalTicks: nticks,
      numNotes: numNotes,
      selection: selection
    });
    SmoTickTransformer.applyTransform(measure, actor,selection.selector.voice);

    return true;
  }

  static removeStaffModifier(selection, modifier) {
    selection.staff.removeStaffModifier(modifier);
  }
  static addStaffModifier(selection, modifier) {
    selection.staff.addStaffModifier(modifier);
  }
  static toggleRest(selection) {
    selection.note.toggleRest();
  }

  static makeRest(selection) {
    selection.note.makeRest();
  }
  static makeNote(selection) {
    selection.note.makeNote();
  }
  static setNoteHead(selections,noteHead) {
    selections.forEach((selection) => {
      selection.note.setNoteHead(noteHead);
    });
  }

  static addGraceNote(selection, g, offset) {
    selection.note.addGraceNote(g, offset);
  }


  static removeGraceNote(selection, offset) {
    selection.note.removeGraceNote(offset);
    selection.measure.changed= true;
  }

  static doubleGraceNoteDuration(selection,modifiers) {
    if (!Array.isArray(modifiers)) {
      modifiers=[modifiers];
    }
    modifiers.forEach((mm) => {
      mm.ticks.numerator = mm.ticks.numerator * 2;
    });
    selection.measure.changed = true;
  }
  static halveGraceNoteDuration(selection,modifiers) {
    if (!Array.isArray(modifiers)) {
        modifiers=[modifiers];
    }
    modifiers.forEach((mm) => {
        mm.ticks.numerator = mm.ticks.numerator / 2;
    });
    selection.measure.changed = true;
  }

  static toggleGraceNoteCourtesy(selection,modifiers) {
    if (!Array.isArray(modifiers)) {
      modifiers=[modifiers];
    }
    modifiers.forEach((mm) => {
      mm.modifiers.pitches.forEach((pitch)=> {
        pitch.cautionary = pitch.cautionary ? false : true;
      });
    });
  }
  static toggleGraceNoteEnharmonic(selection, modifiers, offset) {
    if (!Array.isArray(modifiers)) {
      modifiers=[modifiers];
    }
    modifiers.forEach((mm) => {
      var par = [];
      mm.pitches.forEach((pitch)=> {
        SmoNote.toggleEnharmonic(pitch);
      });
    });
  }

  static transposeGraceNotes(selection, modifiers, offset) {
    if (!Array.isArray(modifiers)) {
      modifiers=[modifiers];
    }
    modifiers.forEach((mm) => {
      var par = [];
      if (!mm) {
        console.warn('bad modifier grace note');
        return;
      }
      mm.pitches.forEach((pitch)=> {
          par.push(par.length);
      });
      SmoNote._transpose(mm, par, offset, selection.measure.keySignature);
    });
  }

  static slashGraceNotes(selections) {
    if (!Array.isArray(selections)) {
      selections=[selections];
    }
    selections.forEach((mm) => {
      if (mm.modifier && mm.modifier.ctor === 'SmoGraceNote') {
        mm.modifier.slash = !mm.modifier.slash;
      }
    });
  }


  // ## unmakeTuplet
  // ## Description
  // Makes a tuplet into a single with the duration of the whole tuplet
  static unmakeTuplet(selection) {
    var note = selection.note;
    var measure = selection.measure;
    if (!measure.getTupletForNote(note)) {
      return;
    }
    var tuplet = measure.getTupletForNote(note);
    if (tuplet === null) {
      return;
    }
    var startIndex = measure.tupletIndex(tuplet);
    var endIndex = tuplet.notes.length + startIndex - 1;

    var actor = new SmoUnmakeTupletActor({
      startIndex: startIndex,
      endIndex: endIndex,
      measure: measure
    });
    SmoTickTransformer.applyTransform(measure, actor, selection.selector.voice);
    return true;
  }

  // ## dotDuration
  // ## Description
  // Add a dot to a note, if possible, and make the note ahead of it shorter
  // to compensate.
  static dotDuration(selection) {
    var note = selection.note;
    var measure = selection.measure;
    var nticks = smoMusic.getNextDottedLevel(note.tickCount);
    if (nticks == note.tickCount) {
      return;
    }
    // Don't dot if the thing on the right of the . is too small
    var dotCount = smoMusic.smoTicksToVexDots(nticks);
    var multiplier = Math.pow(2, dotCount);
    var baseDot = VF.durationToTicks(smoMusic.closestVexDuration(nticks)) / (multiplier * 2);
    if (baseDot <= 128) {
      return;
    }
    // If this is the ultimate note in the measure, we can't increase the length
    if (selection.selector.tick + 1 === selection.measure.voices[selection.selector.voice].notes.length) {
      return;
    }
    if (selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount > selection.note.tickCount) {
      console.log('too long');
      return;
    }
    // is dot too short?
    if (!smoMusic.ticksToDuration[selection.measure.voices[selection.selector.voice].notes[selection.selector.tick + 1].tickCount / 2]) {
      return;
    }
    var actor = new SmoStretchNoteActor({
      startIndex: selection.selector.tick,
      tickmap: measure.tickmapForVoice(selection.selector.voice),
      newTicks: nticks
    });
    SmoTickTransformer.applyTransform(measure, actor, selection.selector.voice);
    return true;
  }

  // ## undotDuration
  // ## Description
  // Add the value of the last dot to the note, increasing length and
  // reducing the number of dots.
  static undotDuration(selection) {
    const note = selection.note;
    const measure = selection.measure;
    const nticks = smoMusic.getPreviousDottedLevel(note.tickCount);
    if (nticks == note.tickCount) {
      return;
    }
    const actor = new SmoContractNoteActor({
      startIndex: selection.selector.tick,
      tickmap: measure.tickmapForVoice(selection.selector.voice),
      newTicks: nticks
    });
    SmoTickTransformer.applyTransform(measure, actor, selection.selector.voice);
    return true;
  }

  // ## transpose
  // ## Description
  // Transpose the selected note, trying to find a key-signature friendly value
  static transpose(selection, offset) {
    let pitchIx = 0;
    let voiceIx = 0;
    let trans = false;
    let transInt = 0;
    let i = 0;
    if (typeof(selection.selector.pitches) === 'undefined') {
      selection.selector.pitches = [];
    }
    const measure = selection.measure;
    const note = selection.note;
    if (measure && note) {
      const pitchar = [];
      pitchIx = 0;
      voiceIx = 0;
      const accidentalMap = {};
      const activeTm = measure.tickmapForVoice(measure.getActiveVoice());
      const targetDuration = activeTm.durationMap[selection.selector.tick];

      note.pitches.forEach((opitch) => {
        // Only translate selected pitches
        const shouldXpose = selection.selector.pitches.length === 0 ||
          selection.selector.pitches.indexOf(pitchIx) >= 0;

        // Translate the pitch, ignoring enharmonic
        trans =  shouldXpose ? smoMusic.getKeyOffset(opitch, offset)
          : JSON.parse(JSON.stringify(opitch));
        trans = smoMusic.getEnharmonicInKey(trans, measure.keySignature);
        if (!trans.accidental) {
          trans.accidental = 'n';
        }
        transInt = smoMusic.smoPitchToInt(trans);

        // Look through the earlier notes in the measure and try
        // to find an equivalent note, and convert it if it exists.
        measure.voices.forEach((voice) => {
          for (i = 0; i < selection.selector.tick
            && i < voice.notes.length; ++i)  {
            const prevNote = voice.notes[i];
            prevNote.pitches.forEach((prevPitch) => {
                const prevInt = smoMusic.smoPitchToInt(prevPitch);
                if (prevInt === transInt) {
                  trans = JSON.parse(JSON.stringify(prevPitch));
                }
             });
           }
          });
          pitchar.push(trans);
          pitchIx += 1;
      });
      note.pitches = pitchar;
      return true;
    }
    return false;
  }

  // ## setPitch
  // ## Description:
  // pitches can be either an array, a single pitch, or a letter.  In the latter case,
  // the letter value appropriate for the key signature is used, e.g. c in A major becomes
  // c#
  static setPitch(selection, pitches) {
    let i = 0;
    var measure = selection.measure;
    var note = selection.note;
    if (typeof(note) === 'undefined') {
      console.warn('set Pitch on invalid note');
      return;
    }
    selection.note.makeNote();
    // TODO allow hint for octave
    var octave = note.pitches[0].octave;
    note.pitches = [];
    if (!Array.isArray(pitches)) {
      pitches = [pitches];
    }
    var earlierAccidental = (pitch) => {
      selection.measure.voices.forEach((voice) => {
        for (i = 0; i < selection.selector.tick
          && i < voice.notes.length; ++i) {
          var prevNote = voice.notes[i];
          if (prevNote === null || prevNote.pitches === null) {
            console.log('this will die null');
          }
          prevNote.pitches.forEach((prevPitch) => {
            if (prevNote.noteType === 'n' && prevPitch.letter === pitch.letter) {
              pitch.accidental = prevPitch.accidental;
            }
          });
        }
      });
    }
    pitches.forEach((pitch) => {
      var letter = pitch;
      if (typeof(pitch) === 'string') {
        var letter = smoMusic.getKeySignatureKey(pitch[0], measure.keySignature);
        pitch = {
          letter: letter[0],
          accidental: letter.length > 1 ? letter.substring(1) : '',
          octave: octave
        };
      }
      earlierAccidental(pitch);
      note.pitches.push(pitch);
    });
    return true;
  }

  // ## addPitch
  // add a pitch to a note chord, avoiding duplicates.
  static addPitch(selection, pitches) {
    var toAdd = [];
    selection.note.makeNote();
    pitches.forEach((pitch) => {
      var found = false;
      toAdd.forEach((np) => {
        if (np.accidental === pitch.accidental && np.letter === pitch.letter && np.octave === pitch.octave) {
          found = true;
        }
      });
      if (!found) {
        toAdd.push(pitch);
      }
    });
    toAdd.sort(function (a, b) {
      return smoMusic.smoPitchToInt(a) - smoMusic.smoPitchToInt(b);
    });
    selection.note.pitches = JSON.parse(JSON.stringify(toAdd));
  }

  static toggleCourtesyAccidental(selection) {
    var toBe = false;
    var i = 0;
    if (!selection.selector['pitches'] || selection.selector.pitches.length === 0) {
      var ps = [];
      selection.note.pitches.forEach((pitch) => {
        var p = JSON.parse(JSON.stringify(pitch));
        ps.push(p);
        p.cautionary = !(pitch.cautionary);
      });
      selection.note.pitches = ps;
    } else {
      toBe = !(selection.note.pitches[selection.selector.pitches[0]].cautionary);
    }
    SmoOperation.courtesyAccidental(selection, toBe);
  }

  static courtesyAccidental(pitchSelection, toBe) {
    pitchSelection.selector.pitches.forEach((pitchIx) => {
      pitchSelection.note.pitches[pitchIx].cautionary = toBe;
    });
  }

  static toggleEnharmonic(pitchSelection) {
    if (pitchSelection.selector.pitches.length === 0) {
      pitchSelection.selector.pitches.push(0);
    }
    const pitch = pitchSelection.note.pitches[pitchSelection.selector.pitches[0]];
    SmoNote.toggleEnharmonic(pitch);
  }

  static addDynamic(selection, dynamic) {
    selection.note.addModifier(dynamic);
  }

  static removeDynamic(selection, dynamic) {
    selection.note.removeModifier(dynamic);
  }

  static beamSelections(score, selections) {
    var start = selections[0].selector;
    var cur = selections[0].selector;
    var beamGroup = [];
    var ticks = 0;
    selections.forEach((selection) => {
      if (SmoSelector.sameNote(start, selection.selector) ||
        (SmoSelector.sameMeasure(selection.selector, cur) &&
         cur.tick === selection.selector.tick - 1)) {
        ticks += selection.note.tickCount;
        cur = selection.selector;
        beamGroup.push(selection.note);
      }
    });
    if (beamGroup.length) {
      beamGroup.forEach((note) => {
        note.beamBeats = ticks;
        note.endBeam = false;
      });
      beamGroup[beamGroup.length - 1].endBeam=true;
      // Make sure the last note of the previous beam is the end of this beam group.
      if (selections[0].selector.tick > 0) {
        const ps = JSON.parse(JSON.stringify(selections[0].selector));
        ps.tick -= 1;
        const previous = SmoSelection.noteFromSelector(score, ps);
        if (previous.note.tickCount < 4096) {
          previous.note.endBeam = true;
        }
      }
    }
  }

  static toggleBeamDirection(selections) {
    selections[0].note.toggleFlagState();
    selections.forEach((selection) => {
      selection.note.flagState = selections[0].note.flagState;
    });
  }

  static toggleOrnament(selection, ornament) {
    selection.note.toggleOrnament(ornament);
  }

  static toggleArticulation(selection, articulation) {
    selection.note.toggleArticulation(articulation);
  }

  static addEnding(score, parameters) {
    let m = 0;
    let s = 0;
    var startMeasure = parameters.startBar;
    var endMeasure = parameters.endBar;

    // Ending ID ties all the instances of an ending across staves
    parameters.endingId = VF.Element.newID();
    score.staves.forEach((staff) => {
      m = 0;
      staff.measures.forEach((measure) => {
        if (m === startMeasure) {
          const pp = JSON.parse(JSON.stringify(parameters));
          pp.startSelector = {
            staff: s,
            measure: startMeasure
          };
          pp.endSelector = {
            staff: s,
            measure: endMeasure
          };
          const ending = new SmoVolta(pp);
          measure.addNthEnding(ending);
        }
        m += 1;
      });
      s += 1;
    });
  }

  static removeEnding(score, ending) {
    let i = 0;
    score.staves.forEach((staff) => {
      for (i = ending.startSelector.measure; i <= ending.endSelector.measure; ++i) {
        staff.measures[i].removeNthEnding(ending.number);
      }
    });
  }

  static addScoreText(score,scoreText) {
    score.addScoreText(scoreText);
  }
  static removeScoreText(score,scoreText) {
    score.removeScoreText(scoreText);
  }

  static addTextGroup(score,textGroup) {
    score.addTextGroup(textGroup);
  }

  static removeTextGroup(score,textGroup) {
    score.removeTextGroup(textGroup);
  }

  static addMeasureText(score, selection, measureText) {
    const current = selection.measure.getMeasureText();
    // TODO: should we allow multiples per position
    current.forEach((mod) => {
        selection.measure.removeMeasureText(mod.attrs.id);
    });
    selection.measure.addMeasureText(measureText);
  }

  static removeMeasureText(score, selection, mt) {
    selection.measure.removeMeasureText(mt.attrs.id);
  }

  static addSystemText(score, selection, measureText) {
    const mm = selection.selector.measure;
    score.staves.forEach((staff) => {
      const mt = new SmoMeasureText(measureText.serialize());
      staff.measures[mm].addMeasureText(mt);
    });
  }

  static removeRehearsalMark(score, selection, rehearsalMark) {
    score.staves.forEach((staff) => {
      staff.removeRehearsalMark(selection.selector.measure);
    });
  }

  static addRehearsalMark(score, selection, rehearsalMark) {
    const mm = selection.selector.measure;
    score.staves.forEach((staff) => {
      const mt = new SmoRehearsalMark(rehearsalMark.serialize());
      staff.addRehearsalMark(selection.selector.measure, mt);
    });
  }

  static addLyric(score, selection, lyric) {
    selection.note.addLyric(lyric);
  }

  static removeLyric(score, selection, lyric) {
    selection.note.removeLyric(lyric);
  }

  static addTempo(score, selection, tempo) {
    score.staves.forEach((staff) => {
      staff.addTempo(tempo,selection.selector.measure);
    });
  }

  static removeTempo(score, selection) {
    score.staves.forEach((staff) => {
      staff.removeTempo();
    });
  }

  static setMeasureBarline(score, selection, barline) {
    var mm = selection.selector.measure;
    var ix = 0;
    score.staves.forEach((staff) => {
    var s2 = SmoSelection.measureSelection(score, ix, mm);
    s2.measure.setBarline(barline);
    ix += 1;
    });
  }

  static setRepeatSymbol(score, selection, sym) {
    var mm = selection.selector.measure;
    var ix = 0;
    score.staves.forEach((staff) => {
    var s2 = SmoSelection.measureSelection(score, ix, mm);
    s2.measure.setRepeatSymbol(sym);
    ix += 1;
    });
  }

  // ## interval
  // Add a pitch at the specified interval to the chord in the selection.
  static interval(selection, interval) {
    const measure = selection.measure;
    const note = selection.note;
    let pitch = {};

    // TODO: figure out which pitch is selected
    pitch = note.pitches[0];
    if (interval > 0) {
      pitch = note.pitches[note.pitches.length - 1];
    }
    pitch = smoMusic.getIntervalInKey(pitch, measure.keySignature, interval);
    if (pitch) {
      note.pitches.push(pitch);
      note.pitches.sort((x, y) =>
        smoMusic.smoPitchToInt(x) - smoMusic.smoPitchToInt(y)
      );
      return true;
    }
    return false;
  }

  static crescendo(fromSelection, toSelection) {
    const fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
    const toSelector = JSON.parse(JSON.stringify(toSelection.selector));
    const modifier = new SmoStaffHairpin({
      startSelector: fromSelector,
      endSelector: toSelector,
      hairpinType: SmoStaffHairpin.types.CRESCENDO,
      position: SmoStaffHairpin.positions.BELOW
    });
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }

  static decrescendo(fromSelection, toSelection) {
    const fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
    const toSelector = JSON.parse(JSON.stringify(toSelection.selector));
    const modifier = new SmoStaffHairpin({
      startSelector: fromSelector,
      endSelector: toSelector,
      hairpinType: SmoStaffHairpin.types.DECRESCENDO,
      position: SmoStaffHairpin.positions.BELOW
    });
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }
  static tie(fromSelection, toSelection) {
    // By default, just tie all the pitches to all the other pitches in order
    const lines = SmoTie.createLines(fromSelection.note, toSelection.note);
    const modifier = new SmoTie({
      startSelector: fromSelection.selector,
      endSelector: toSelection.selector,
      lines
    });
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }
  static slur(fromSelection, toSelection) {
    var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
    var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
    var modifier = new SmoSlur({
      startSelector: fromSelector,
      endSelector: toSelector,
      position: SmoStaffHairpin.positions.BELOW
    });
    fromSelection.staff.addStaffModifier(modifier);
    return modifier;
  }

  static addStaff(score, parameters) {
    score.addStaff(parameters);
  }
  static removeStaff(score, index) {
    score.removeStaff(index);
  }

  static transposeChords(smoNote,offset,key) {
    var chords = smoNote.getModifiers('SmoLyric');
    chords.forEach((ll) => {
      if (ll.parser === SmoLyric.parsers.chord) {
        var tx = ll.getText();
        // Look for something that looks like a key name
        if (tx.length >= 1 && (tx[0].toUpperCase() >= 'A'
          && tx[0].toUpperCase() <= 'G')) {
          // toffset is 2 if the key has b or # in it
          var toffset = 1;
          var newText = tx[0];
          if (tx.length > 0 && tx[1] === 'b' || tx[1] === '#') {
            newText += tx[1];
            toffset = 2;
          }
          // Transpose the key, as if it were a key signature (octave has no meaning)
          var nkey = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(
            smoMusic.vexToSmoKey(newText)) + offset);
          nkey = JSON.parse(JSON.stringify(smoMusic.getEnharmonicInKey(nkey,key)));
          newText = nkey.letter.toUpperCase();

          // new key may have different length, e.g. Bb to B natural
          if (nkey.accidental !== 'n') {
            newText += nkey.accidental;
          };
          newText += tx.substr(toffset,tx.length - toffset);
          ll.setText(newText);
        }
      }
    });
  }
  static changeInstrument(instrument, selections) {
    const measureHash = {};
    let newKey = '';
    selections.forEach((selection) => {
      if (!measureHash[selection.selector.measure]) {
        measureHash[selection.selector.measure] = 1;
        const netOffset = instrument.keyOffset - selection.measure.transposeIndex;
        newKey = smoMusic.pitchToVexKey(smoMusic.smoIntToPitch(
          smoMusic.smoPitchToInt(
            smoMusic.vexToSmoKey(selection.measure.keySignature)) + netOffset));
        newKey = smoMusic.toValidKeySignature(newKey);
        if (newKey.length > 1 && newKey[1] === 'n') {
          newKey = newKey[0];
        }
        newKey = newKey[0].toUpperCase() + newKey.substr(1, newKey.length)
        selection.measure.keySignature = newKey;
        selection.measure.clef = instrument.clef;
        selection.measure.transposeIndex = instrument.keyOffset;
        selection.measure.voices.forEach((voice) => {
          voice.notes.forEach((note) => {
            if (note.noteType === 'n') {
              const pitches = [];
              note.pitches.forEach((pitch) => {
                const pint = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(pitch) + netOffset);
                pitches.push(JSON.parse(JSON.stringify(smoMusic.getEnharmonicInKey(pint, newKey))));
              });
              note.pitches = pitches;
              SmoOperation.transposeChords(note, netOffset, newKey);
            }
            note.clef = instrument.clef;
          });
        });
      }
    });
  }

  static addMeasure(score, systemIndex, nmeasure) {
    score.addMeasure(systemIndex, nmeasure);
  }
}
