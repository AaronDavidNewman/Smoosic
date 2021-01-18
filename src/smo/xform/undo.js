// ## UndoBuffer
// manage a set of undo or redo operations on a score.  The objects passed into
// undo must implement serialize()/deserialize()
// ### Buffer format:
// A buffer is one of 7 things:
// * A single measure,
// * A single staff
// * the whole score
// * a score modifier (text)
// * score attributes (layout, etc)
// * column - all the measures at one index
// * rectangle - a rectangle of measures
class UndoBuffer {
  static get bufferMax() {
    return 100;
  }

  static get bufferTypes() {
    return {
      FIRST: 1,
      MEASURE: 1, STAFF: 2, SCORE: 3, SCORE_MODIFIER: 4, COLUMN: 5, RECTANGLE: 6,
      SCORE_ATTRIBUTES: 7, STAFF_MODIFIER: 8, LAST: 8
    };
  }
  static get bufferSubtypes() {
    return {
      NONE: 0, ADD: 1, REMOVE: 2, UPDATE: 3
    };
  }
  static get bufferTypeLabel() {
    return ['INVALID', 'MEASURE', 'STAFF', 'SCORE', 'SCORE_MODIFIER', 'COLUMN', 'RECTANGLE',
      'SCORE_ATTRIBUTES', 'STAFF_MODIFIER'];
  }
  // ### serializeMeasure
  // serialize a measure, preserving the column-mapped bits which aren't serialized on a full score save.
  static serializeMeasure(measure) {
    const attrColumnHash = {};
    const attrCurrentValue  = {};
    const json = measure.serialize();
    measure.serializeColumnMapped(attrColumnHash, attrCurrentValue);
    Object.keys(attrCurrentValue).forEach((key) => {
      json[key] = attrCurrentValue[key];
    });
    return json;
  }
  constructor() {
    this.buffer = [];
    this.opCount = 0;
    this._grouping = false;
  }
  get grouping() {
    return this._grouping;
  }
  // Allows a set of operations to be bunched into a single group
  set grouping(val) {
    if (this._grouping === true && val === false) {
      const buf = this.peek();
      // If we have been grouping, indicate that the last buffer is the
      // fist part of a group
      if (buf) {
        buf.firstInGroup = true;
      }
    }
    this._grouping = val;
  }
  // ### addBuffer
  // Description:
  // Add the current state of the score required to undo the next operation we
  // are about to perform.  For instance, if we are adding a crescendo, we back up the
  // staff the crescendo will go on.
  addBuffer(title, type, selector, obj, subtype) {
    let i = 0;
    let j = 0;
    if (typeof(type) !== 'number' || type < UndoBuffer.bufferTypes.FIRST || type > UndoBuffer.bufferTypes.LAST) {
      throw 'Undo failure: illegal buffer type ' + type;
    }
    const undoObj = {
      title,
      type,
      selector,
      subtype,
      grouped: this._grouping,
      firstInGroup: false
    };
    if (type === UndoBuffer.bufferTypes.RECTANGLE) {
      // RECTANGLE obj is {score, topLeft, bottomRight}
      // where the last 2 are selectors
      const measures = [];
      for (i = obj.topLeft.staff; i <= obj.bottomRight.staff; ++i) {
        for (j = obj.topLeft.measure; j <= obj.bottomRight.measure; ++j) {
          measures.push(UndoBuffer.serializeMeasure(obj.score.staves[i].measures[j]));
        }
      }
      undoObj.json = { topLeft: JSON.parse(JSON.stringify(obj.topLeft)),
        bottomRight: JSON.parse(JSON.stringify(obj.bottomRight)),
        measures };
    } else if (type === UndoBuffer.bufferTypes.SCORE_ATTRIBUTES) {
      undoObj.json = {};
      smoSerialize.serializedMerge(SmoScore.preferences, obj, undoObj.json);
    } else if (type === UndoBuffer.bufferTypes.COLUMN) {
      // COLUMN obj is { score, measureIndex }
      const ix = obj.measureIndex;
      const measures = [];
      obj.score.staves.forEach((staff) => {
        measures.push(UndoBuffer.serializeMeasure(staff.measures[ix]));
      });
      undoObj.json = { measureIndex: ix, measures };
    } else if (type === UndoBuffer.bufferTypes.MEASURE) {
      // If this is a measure, preserve the column-mapped attributes
      undoObj.json = UndoBuffer.serializeMeasure(obj);
    } else if (type === UndoBuffer.bufferTypes.SCORE_MODIFIER ||
      type === UndoBuffer.bufferTypes.STAFF_MODIFIER) {
      // score modifier, already serialized
      undoObj.json = obj;
    } else {
      // staff or score or staffModifier
      undoObj.json = obj.serialize();
    }
    if (this.buffer.length >= UndoBuffer.bufferMax) {
      this.buffer.splice(0, 1);
    }
    this.opCount += 1;
    this.buffer.push(undoObj);
  }

  // ### _pop
  // ### Description:
  // Internal method to pop the top buffer off the stack.
  _pop() {
    if (this.buffer.length < 1) {
      return null;
    }
    const buf = this.buffer.pop();
    return buf;
  }

  // ## Before undoing, peek at the top action in the q
  // so it can be re-rendered
  peek() {
    if (this.buffer.length < 1) {
      return null;
    }
    return this.buffer[this.buffer.length - 1];
  }

  // ## undo
  // ## Description:
  // Undo the operation at the top of the undo stack.  This is done by replacing
  // the music as it existed before the change was made.
  undo(score) {
    let i = 0;
    let j = 0;
    let mix = 0;
    let buf = this._pop();
    if (!buf) {
      return score;
    }
    const grouping = buf.firstInGroup;
    while (buf) {
      if (buf.type === UndoBuffer.bufferTypes.RECTANGLE) {
        for (i = buf.json.topLeft.staff; i <= buf.json.bottomRight.staff; ++i) {
          for (j = buf.json.topLeft.measure; j <= buf.json.bottomRight.measure; ++j) {
            const measure = SmoMeasure.deserialize(buf.json.measures[mix]);
            mix += 1;
            score.replaceMeasure({ staff: i, measure: j }, measure);
          }
        }
      } else if (buf.type === UndoBuffer.bufferTypes.STAFF_MODIFIER)  {
        const modifier = StaffModifierBase.deserialize(buf.json);
        const staff = score.staves[modifier.startSelector.staff];
        const existing = staff.getModifier(modifier);
        if (existing) {
          staff.removeStaffModifier(existing);
        }
        // If we undo an add, we just remove it.
        if (buf.subtype !== UndoBuffer.bufferSubtypes.ADD) {
          staff.addStaffModifier(modifier);
        }
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE_ATTRIBUTES) {
        smoSerialize.serializedMerge(SmoScore.preferences, buf.json, score);
      } else if (buf.type === UndoBuffer.bufferTypes.COLUMN) {
        for (i = 0; i < score.staves.length; ++i) {
          const measure = SmoMeasure.deserialize(buf.json.measures[i]);
          score.replaceMeasure({ staff: i, measure: buf.json.measureIndex }, measure);
        }
      } else if (buf.type === UndoBuffer.bufferTypes.MEASURE) {
        const measure = SmoMeasure.deserialize(buf.json);
        score.replaceMeasure(buf.selector, measure);
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE) {
        // Score expects string, as deserialized score is how saving is done.
        score = SmoScore.deserialize(JSON.stringify(buf.json));
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE_MODIFIER) {
        // Currently only one type like this: SmoTextGroup
        if (buf.json.ctor === 'SmoTextGroup') {
          const obj = SmoTextGroup.deserialize(buf.json);
          obj.attrs.id = buf.json.attrs.id;
          // undo of add is remove, undo of remove is add
          if (buf.subtype === UndoBuffer.bufferSubtypes.UPDATE || buf.subtype === UndoBuffer.bufferSubtypes.ADD) {
            score.removeTextGroup(obj);
          } if (buf.subtype === UndoBuffer.bufferSubtypes.UPDATE || buf.subtype === UndoBuffer.bufferSubtypes.REMOVE) {
            score.addTextGroup(obj);
          }
        }
      } else {
        const staff = SmoSystemStaff.deserialize(buf.json);
        score.replaceStaff(buf.selector.staff, staff);
      }
      if (grouping && this.peek() && this.peek().grouped) {
        buf = this._pop();
      } else {
        buf = null;
      }
    }
    return score;
  }
}

// ## SmoUndoable
// Convenience functions to save the score state before operations so we can undo the operation.
// Each undo-able knows which set of parameters the undo operation requires (measure, staff, score).
// eslint-disable-next-line no-unused-vars
class SmoUndoable {
  // ### undoScoreObject
  // Called when a score object is being modified.  There is no need to update the score as it contains a
  // reference to the object
  static changeTextGroup(score, undoBuffer, object, subtype) {
    undoBuffer.addBuffer('modify text',
      UndoBuffer.bufferTypes.SCORE_MODIFIER, null, object, subtype);
    if (subtype === UndoBuffer.bufferSubtypes.REMOVE) {
      SmoOperation.removeTextGroup(score, object);
    } else if (subtype === UndoBuffer.bufferSubtypes.ADD) {
      SmoOperation.addTextGroup(score, object);
    }
    // Update operation, there is nothing to do since the text is already
    // part of the score
  }
  // ### undoForSelections
  // We want to undo a bunch of selections.
  static undoForSelections(score, selections, undoBuffer, operation) {
    let staffUndo = false;
    let scoreUndo = false;
    let i = 0;
    if (!selections.length) {
      return;
    }
    const measure = selections[0].selector.measure;
    const staff = selections[0].selector.staff;
    for (i = 0; i < selections.length; ++i) {
      const sel = selections[i];
      if (sel.selector.measure !== measure) {
        staffUndo = true;
      } else if (sel.selector.staff !== staff) {
        scoreUndo = true;
        break;
      }
    }
    if (scoreUndo) {
      undoBuffer.addBuffer('score backup for ' + operation, UndoBuffer.bufferTypes.SCORE, null, score);
    } else if (staffUndo) {
      undoBuffer.addBuffer('staff backup for ' + operation, UndoBuffer.bufferTypes.STAFF, selections[0].selector, score);
    } else {
      undoBuffer.addBuffer('measure backup for ' + operation, UndoBuffer.bufferTypes.MEASURE, selections[0].selector, selections[0].measure);
    }
  }
  // Add the measure/staff/score that will cover this list of selections
  static batchDurationOperation(score, selections, operation, undoBuffer) {
    SmoUndoable.undoForSelections(score, selections, undoBuffer, operation);
    SmoOperation.batchSelectionOperation(score, selections, operation);
  }
  static multiSelectionOperation(score, selections, operation, parameter, undoBuffer) {
    SmoUndoable.undoForSelections(score, selections, undoBuffer, operation);
    SmoOperation[operation](score, selections, parameter);
  }
  static addConnectorDown(score, selections, parameters, undoBuffer) {
    SmoUndoable.undoForSelections(score, selections, undoBuffer, 'Add Connector Below');
    SmoOperation.addConnectorDown(score, selections, parameters);
  }
  static addGraceNote(selection, undoBuffer) {
    undoBuffer.addBuffer('grace note ' + JSON.stringify(selection.note.pitches, null, ' '),
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    const pitches = JSON.parse(JSON.stringify(selection.note.pitches));
    SmoOperation.addGraceNote(selection, new SmoGraceNote({ pitches, ticks:
      { numerator: 2048, denominator: 1, remainder: 0 } }));
  }
  static removeGraceNote(selection, params, undoBuffer) {
    undoBuffer.addBuffer('remove grace note',
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.removeGraceNote(selection, params.index);
  }

  static slashGraceNotes(selections, undoBuffer) {
    undoBuffer.addBuffer('transpose grace note',
      UndoBuffer.bufferTypes.MEASURE, selections[0].selection.selector, selections[0].selection.measure);
    SmoOperation.slashGraceNotes(selections);
  }

  static transposeGraceNotes(selection, params, undoBuffer) {
    undoBuffer.addBuffer('transpose grace note',
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.transposeGraceNotes(selection, params.modifiers, params.offset);
  }
  static setNoteHead(score, selections, noteHead, undoBuffer) {
    SmoUndoable.undoForSelections(score, selections, undoBuffer, 'note head');
    SmoOperation.setNoteHead(selections, noteHead);
  }

  static padMeasuresLeft(selections, padding, undoBuffer) {
    if (!Array.isArray(selections)) {
      selections = [selections];
    }
    selections.forEach((selection) => {
      undoBuffer.addBuffer('pad measure', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
      SmoOperation.padMeasureLeft(selection, padding);
    });
  }
  static doubleGraceNoteDuration(selection, modifier, undoBuffer) {
    undoBuffer.addBuffer('double grace note duration',
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.doubleGraceNoteDuration(selection, modifier);
  }

  static halveGraceNoteDuration(selection, modifier, undoBuffer) {
    undoBuffer.addBuffer('halve grace note duration',
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.halveGraceNoteDuration(selection, modifier);
  }
  static setPitch(selection, pitches, undoBuffer)  {
    undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.setPitch(selection, pitches);
  }
  static addPitch(selection, pitches, undoBuffer)  {
    undoBuffer.addBuffer('pitch change ' + JSON.stringify(pitches, null, ' '),
      UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.addPitch(selection, pitches);
  }
  static doubleDuration(selection, undoBuffer) {
    undoBuffer.addBuffer('double duration', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.doubleDuration(selection);
  }
  static halveDuration(selection, undoBuffer) {
    undoBuffer.addBuffer('halve note duration', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.halveDuration(selection);
  }
  static makeTuplet(selection, numNotes, undoBuffer) {
    undoBuffer.addBuffer(numNotes + '-let', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.makeTuplet(selection, numNotes);
  }
  static makeRest(selection, undoBuffer) {
    undoBuffer.addBuffer('make rest', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.makeRest(selection);
  }
  static makeNote(selection, undoBuffer) {
    undoBuffer.addBuffer('make note', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.makeNote(selection);
  }
  static unmakeTuplet(selection, undoBuffer) {
    undoBuffer.addBuffer('unmake tuplet', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.unmakeTuplet(selection);
  }
  static dotDuration(selection, undoBuffer) {
    undoBuffer.addBuffer('dot duration', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.dotDuration(selection);
  }
  static populateVoice(selections, voiceIx, undoBuffer) {
    const measures = SmoSelection.getMeasureList(selections);
    measures.forEach((selection) => {
      undoBuffer.addBuffer('populate voice', UndoBuffer.bufferTypes.MEASURE,
        selection.selector, selection.measure);
      SmoOperation.populateVoice(selection, voiceIx);
    });
  }

  static depopulateVoice(selections, voiceIx, undoBuffer) {
    var measures = SmoSelection.getMeasureList(selections);
    measures.forEach((selection) => {
      undoBuffer.addBuffer('populate voice', UndoBuffer.bufferTypes.MEASURE,
        selection.selector, selection.measure);
      SmoOperation.depopulateVoice(selection, voiceIx);
    });
  }
  static toggleBeamGroups(selections, undoBuffer) {
    var measureUndoHash = {};
    selections.forEach((selection) => {
      if (!measureUndoHash[selection.selector.measure]) {
        measureUndoHash[selection.selector.measure] = true;
        undoBuffer.addBuffer('toggleBeamGroups', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
      }
      SmoOperation.toggleBeamGroup(selection);
    });
  }
  static toggleBeamDirection(selections, undoBuffer) {
    undoBuffer.addBuffer('beam notes', UndoBuffer.bufferTypes.MEASURE, selections[0].selector, selections[0].measure);
    SmoOperation.toggleBeamDirection(selections);
  }
  static beamSelections(selections, undoBuffer) {
    undoBuffer.addBuffer('beam notes', UndoBuffer.bufferTypes.MEASURE, selections[0].selector, selections[0].measure);
    SmoOperation.beamSelections(selections);
  }
  static undotDuration(selection, undoBuffer) {
    undoBuffer.addBuffer('undot duration', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.undotDuration(selection);
  }
  static transpose(selection, offset, undoBuffer) {
    undoBuffer.addBuffer('transpose pitches ' + offset, UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.transpose(selection, offset);
  }
  static courtesyAccidental(pitchSelection, toBe, undoBuffer) {
    undoBuffer.addBuffer('courtesy accidental ', UndoBuffer.bufferTypes.MEASURE, pitchSelection.selector, pitchSelection.measure);
    SmoOperation.courtesyAccidental(pitchSelection, toBe);
  }
  static addDynamic(selection, dynamic, undoBuffer) {
    undoBuffer.addBuffer('add dynamic', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.addDynamic(selection, dynamic);
  }
  static toggleEnharmonic(pitchSelection, undoBuffer) {
    undoBuffer.addBuffer('toggle enharmonic', UndoBuffer.bufferTypes.MEASURE, pitchSelection.selector, pitchSelection.measure);
    SmoOperation.toggleEnharmonic(pitchSelection);
  }
  static interval(selection, interval, undoBuffer) {
    undoBuffer.addBuffer('add interval ' + interval, UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.interval(selection, interval);
  }
  static crescendo(fromSelection, toSelection, undoBuffer) {
    undoBuffer.addBuffer('crescendo', UndoBuffer.bufferTypes.STAFF, fromSelection.selector, fromSelection.staff);
    SmoOperation.crescendo(fromSelection, toSelection);
  }
  static decrescendo(fromSelection, toSelection, undoBuffer) {
    undoBuffer.addBuffer('decrescendo', UndoBuffer.bufferTypes.STAFF, fromSelection.selector, fromSelection.staff);
    SmoOperation.decrescendo(fromSelection, toSelection);
  }
  static slur(fromSelection, toSelection, undoBuffer) {
    undoBuffer.addBuffer('slur', UndoBuffer.bufferTypes.STAFF, fromSelection.selector, fromSelection.staff);
    SmoOperation.slur(fromSelection, toSelection);
  }
  // easy way to back up the score for a score-wide operation
  static noop(score, undoBuffer, label) {
    label = typeof(label) !== 'undefined' ? label : 'Backup';
    undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE, null, score);
  }

  static measureSelectionOp(score, selection, op, params, undoBuffer, description) {
    undoBuffer.addBuffer(description, UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation[op](score, selection, params);
  }

  static staffSelectionOp(score, selection, op, params, undoBuffer, description) {
    undoBuffer.addBuffer(description, UndoBuffer.bufferTypes.STAFF, selection.selector, selection.staff);
    SmoOperation[op](selection, params);
  }

  static scoreSelectionOp(score, selection, op, params, undoBuffer, description) {
    undoBuffer.addBuffer(description, UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation[op](score, selection, params);
  }
  static scoreOp(score, op, params, undoBuffer, description) {
    undoBuffer.addBuffer(description, UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation[op](score, params);
  }

  static addKeySignature(score, selection, keySignature, undoBuffer) {
    undoBuffer.addBuffer('addKeySignature ' + keySignature, UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation.addKeySignature(score, selection, keySignature);
  }
  static addMeasure(score, systemIndex, nmeasure, undoBuffer) {
    undoBuffer.addBuffer('add measure', UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation.addMeasure(score, systemIndex, nmeasure);
  }
  static deleteMeasure(score, selection, undoBuffer) {
    undoBuffer.addBuffer('delete measure', UndoBuffer.bufferTypes.SCORE, null, score);
    const measureIndex = selection.selector.measure;
    score.deleteMeasure(measureIndex);
  }
  static addStaff(score, parameters, undoBuffer) {
    undoBuffer.addBuffer('add instrument', UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation.addStaff(score, parameters);
  }
  static toggleGraceNoteCourtesyAccidental(selection, modifier, undoBuffer) {
    undoBuffer.addBuffer('toggle grace courtesy ', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.toggleGraceNoteCourtesy(selection, modifier);
  }
  static toggleCourtesyAccidental(selection, undoBuffer) {
    undoBuffer.addBuffer('toggle courtesy ', UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure);
    SmoOperation.toggleCourtesyAccidental(selection);
  }
  static removeStaff(score, index, undoBuffer) {
    undoBuffer.addBuffer('remove instrument', UndoBuffer.bufferTypes.SCORE, null, score);
    SmoOperation.removeStaff(score, index);
  }
  static changeInstrument(instrument, selections, undoBuffer) {
    undoBuffer.addBuffer('changeInstrument', UndoBuffer.bufferTypes.STAFF, selections[0].selector, selections[0].staff);
    SmoOperation.changeInstrument(instrument, selections);
  }
  static pasteBuffer(score, pasteBuffer, selections, undoBuffer, operation) {
    SmoUndoable.undoForSelections(score, selections, undoBuffer, operation);
    const pasteTarget = selections[0].selector;
    pasteBuffer.pasteSelections(this.score, pasteTarget);
  }
}
