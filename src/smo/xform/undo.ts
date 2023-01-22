// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoStaffTextBracket, StaffModifierBase } from '../data/staffModifiers';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoMusic } from '../data/music';
import { SmoOperation } from './operations';
import { SmoScore } from '../data/score';
import { SmoMeasure } from '../data/measure';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoTextGroup } from '../data/scoreText';
import { SmoSelector } from './selections';

export interface UndoEntry {
  title: string,
  type: number,
  selector: SmoSelector,
  subtype: number,
  grouped: boolean,
  firstInGroup: boolean,
  json?: any
}
export function copyUndo(entry: UndoEntry): UndoEntry {
  const obj = { 
    title: entry.title,
    type: entry.type,
    selector: entry.selector,
    subtype: entry.subtype,
    grouped: entry.grouped,
    firstInGroup: entry.firstInGroup,
    json: undefined
  };
  if (entry.json) {
    obj.json = JSON.parse(JSON.stringify(entry.json));
  }
  return obj;
}
/**
 * manage a set of undo or redo operations on a score.  The objects passed into
 * undo must implement serialize()/deserialize()
 * 
 * ## Buffer format:
 * A buffer is one of 7 things:
 * * A single measure,
 * * A single staff
 *  * the whole score
 *  * a score modifier (text)
 *  * score attributes (layout, etc)
 *  * column - all the measures at one index
 *  * rectangle - a rectangle of measures
 * @category SmoTransform
 * */
export class UndoBuffer {
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
  static serializeMeasure(measure: SmoMeasure) {
    const json: any = measure.serialize();
    const columnMapped : any = measure.serializeColumnMapped();
    Object.keys(columnMapped).forEach((key) => {
      json[key] = columnMapped[key];
    });
    return json;
  }
  buffer: UndoEntry[] = [];
  reconcile: number = -1;
  opCount: number;
  _grouping: boolean;
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
  reset() {
    this.buffer = [];
  }
  // ### addBuffer
  // Description:
  // Add the current state of the score required to undo the next operation we
  // are about to perform.  For instance, if we are adding a crescendo, we back up the
  // staff the crescendo will go on.
  addBuffer(title: string, type: number, selector: SmoSelector, obj: any, subtype: number) {
    let i = 0;
    let j = 0;
    if (typeof(type) !== 'number' || type < UndoBuffer.bufferTypes.FIRST || type > UndoBuffer.bufferTypes.LAST) {
      throw 'Undo failure: illegal buffer type ' + type;
    }
    const undoObj: UndoEntry = {
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
      const measures: SmoMeasure[] = [];
      obj.score.staves.forEach((staff: SmoSystemStaff) => {
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
  _pop(): UndoEntry | null {
    if (this.buffer.length < 1) {
      return null;
    }
    const buf: UndoEntry = this.buffer.pop() as UndoEntry;
    return buf;
  }

  // ## Before undoing, peek at the top action in the q
  // so it can be re-rendered
  peek(): UndoEntry | null {
    if (this.buffer.length < 1) {
      return null;
    }
    return this.buffer[this.buffer.length - 1];
  }
  peekIndex(index: number) {
    if (this.buffer.length - index < 1) {
      return null;
    }
    return this.buffer[this.buffer.length - (1 + index)];
  }

  // ## undo
  // ## Description:
  // Undo the operation at the top of the undo stack.  This is done by replacing
  // the music as it existed before the change was made.
  undo(score: SmoScore, staffMap: Record<number, number>, pop: boolean): SmoScore {
    let i = 0;
    let j = 0;
    let mix = 0;
    let buf: UndoEntry | null = null;
    let peekIndex = 0;
    if (pop) {
      buf = this._pop();
    } else {
      buf = this.peekIndex(peekIndex);
      if (buf) {
        buf = copyUndo(buf);
      }
    }
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
            const selector = SmoSelector.default;
            if (typeof(staffMap[i]) === 'number') {
              selector.staff = staffMap[i];
              measure.measureNumber.staffId = staffMap[i];
              selector.measure = j;
              score.replaceMeasure(selector, measure);
            }
          }
        }
      } else if (buf.type === UndoBuffer.bufferTypes.STAFF_MODIFIER)  {
        const modifier: StaffModifierBase = StaffModifierBase.deserialize(buf.json);
        if (typeof(staffMap[modifier.startSelector.staff]) === 'number') {
          const staff: SmoSystemStaff = score.staves[staffMap[modifier.startSelector.staff]];
          const existing: StaffModifierBase | undefined = staff.getModifier(modifier);
          if (existing) {
            staff.removeStaffModifier(existing);
          }
          // If we undo an add, we just remove it.
          if (buf.subtype !== UndoBuffer.bufferSubtypes.ADD) {
            if (modifier.ctor === 'SmoStaffTextBracket') {
              staff.addTextBracket(modifier as SmoStaffTextBracket);
            } else {
              staff.addStaffModifier(modifier);
            }
          }
        }
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE_ATTRIBUTES) {
        smoSerialize.serializedMerge(SmoScore.preferences, buf.json, score);
      } else if (buf.type === UndoBuffer.bufferTypes.COLUMN) {
        for (i = 0; i < score.staves.length; ++i) {
          const measure = SmoMeasure.deserialize(buf.json.measures[i]);
          const selector = SmoSelector.default;
          if (typeof(staffMap[i]) === 'number') {
            selector.staff = staffMap[i];
            measure.measureNumber.staffId = staffMap[i];
            selector.measure = buf.json.measureIndex;
            score.replaceMeasure(selector, measure);
          }
        }
      } else if (buf.type === UndoBuffer.bufferTypes.MEASURE) {
        // measure expects key signature to be in concert key.
        if (typeof(staffMap[buf.selector.staff]) === 'number' ) {
          buf.selector.staff = staffMap[buf.selector.staff];
          const xpose = buf.json.transposeIndex ?? 0;
          const concertKey = SmoMusic.vexKeySigWithOffset(buf.json.keySignature, -1 * xpose);
          buf.json.keySignature = concertKey;
          const measure = SmoMeasure.deserialize(buf.json);
          measure.measureNumber.staffId = buf.selector.staff;
          score.replaceMeasure(buf.selector, measure);
        }
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE) {
        // Score expects string, as deserialized score is how saving is done.
        score = SmoScore.deserialize(JSON.stringify(buf.json));
      } else if (buf.type === UndoBuffer.bufferTypes.SCORE_MODIFIER) {
        // Currently only one type like this: SmoTextGroup
        if (buf.json && buf.json.ctor === 'SmoTextGroup') {
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
        if (typeof(staffMap[buf.selector.staff]) === 'number') {
          buf.selector.staff = staffMap[buf.selector.staff];
          const staff = SmoSystemStaff.deserialize(buf.json);
          score.replaceStaff(buf.selector.staff, staff);
        }
      }
      if (grouping && this.peek() && (this.peek() as UndoEntry).grouped) {
        if (pop) {
          buf = this._pop();
        } else {
          peekIndex += 1;
          buf = this.peekIndex(peekIndex);
          if (buf) {
            buf = copyUndo(buf);
          }
        }
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
export class SmoUndoable {
  // ### undoScoreObject
  // Called when a score object is being modified.  There is no need to update the score as it contains a
  // reference to the object
  static changeTextGroup(score: SmoScore, undoBuffer: UndoBuffer, object: any, subtype: number) {
    undoBuffer.addBuffer('modify text',
      UndoBuffer.bufferTypes.SCORE_MODIFIER, SmoSelector.default, object, subtype);
    if (subtype === UndoBuffer.bufferSubtypes.REMOVE) {
      SmoOperation.removeTextGroup(score, object);
    } else if (subtype === UndoBuffer.bufferSubtypes.ADD) {
      SmoOperation.addTextGroup(score, object);
    }
    // Update operation, there is nothing to do since the text is already
    // part of the score
  }
}
