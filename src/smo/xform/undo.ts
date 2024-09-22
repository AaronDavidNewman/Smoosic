// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoStaffTextBracket, StaffModifierBase } from '../data/staffModifiers';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoMusic } from '../data/music';
import { SmoOperation } from './operations';
import { SmoScore } from '../data/score';
import { SmoMeasure, SmoMeasureParamsSer } from '../data/measure';
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoTextGroup, SmoTextGroupContainer } from '../data/scoreText';
import { SmoSelector } from './selections';

export interface UndoEntry {
  title: string,
  type: number,
  selector: SmoSelector,
  subtype: number,
  grouped: boolean,
  json?: any
}
export function copyUndo(entry: UndoEntry): UndoEntry {
  const obj = { 
    title: entry.title,
    type: entry.type,
    selector: entry.selector,
    subtype: entry.subtype,
    grouped: entry.grouped,
    json: undefined
  };
  if (entry.json) {
    obj.json = JSON.parse(JSON.stringify(entry.json));
  }
  return obj;
}
export class UndoSet {
  buffers: UndoEntry[];
  constructor() {
    this.buffers = [];
  }
  get isEmpty() { 
    return this.buffers.length === 0;
  }
  push(entry: UndoEntry) {
    this.buffers.push(entry);
  }
  pop(): UndoEntry | undefined {
    return this.buffers.pop();
  }
  get length(): number {
    return this.buffers.length;
  }
};
/**
 * manage a set of undo or redo operations on a score.  The objects passed into
 * undo must implement serialize()/deserialize().
 * Only one undo buffer is kept for the score.  Undo is always done on the stored
 * score and translated to the display score.
 * UndoBuffer contains an undoEntry array.  An undoEntry might contain several
 * undo operations, if the were done together as a block.  This happens often when 
 * several changes are made while a dialog box is open.
 * an undoEntry is one of 7 things:
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
  static groupCount = 0;
  static get bufferMax() {
    return 100;
  }

  static get bufferTypes() {
    return {
      FIRST: 1,
      MEASURE: 1, STAFF: 2, SCORE: 3, SCORE_MODIFIER: 4, COLUMN: 5, RECTANGLE: 6,
      SCORE_ATTRIBUTES: 7, STAFF_MODIFIER: 8, PART_MODIFIER: 9, LAST: 9
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
    const json: SmoMeasureParamsSer = measure.serialize();
    const columnMapped : any = measure.serializeColumnMapped();
    Object.keys(columnMapped).forEach((key) => {
      (json as any)[key] = columnMapped[key];
    });
    return json;
  }
  buffer: UndoSet[] = [];
  reconcile: number = -1;
  opCount: number;
  _grouping: boolean;
  constructor() {
    this.buffer.push(new UndoSet());
    this.opCount = 0;
    this._grouping = false;
  }
  get grouping() {
    return this._grouping;
  }
  // Allows a set of operations to be bunched into a single group
  set grouping(val) {
    if (this._grouping === true && val === false) {
      const nbuf = new UndoSet();
      this.buffer.push(nbuf);
    }
    this._grouping = val;
  }
  reset() {
    this.buffer = [];
  }
  /**
   * return true if any of the last 2 buffers have undo operations.
   * @returns 
   */
  buffersAvailable() {
    if (this.buffer.length < 1) {
      return false;
    }
    const lastIx = this.buffer.length - 1;
    const penIx = this.buffer.length - 2;
    if (lastIx >= 0 && this.buffer[lastIx].length > 0) {
      return true;
    }
    if (penIx >= 0 && this.buffer[penIx].length > 0) {
      return true;
    }
    return false;
  }
  /**
   * Add the current state of the score required to undo the next operation we
   * are about to perform.  For instance, if we are adding a crescendo, we back up the
   * staff the crescendo will go on.
   * @param title 
   * @param type 
   * @param selector 
   * @param obj 
   * @param subtype 
   */
  addBuffer(title: string, type: number, selector: SmoSelector, obj: any, subtype: number) {
    this.checkNull();
    if (typeof(type) !== 'number' || type < UndoBuffer.bufferTypes.FIRST || type > UndoBuffer.bufferTypes.LAST) {
      throw 'Undo failure: illegal buffer type ' + type;
    }
    const undoObj: UndoEntry = {
      title,
      type,
      selector,
      subtype,
      grouped: this._grouping
    };
    if (type === UndoBuffer.bufferTypes.RECTANGLE) {
      // RECTANGLE obj is {score, topLeft, bottomRight}
      // where the last 2 are selectors
      const measures = [];
      for (let i = obj.topLeft.staff; i <= obj.bottomRight.staff; ++i) {
        for (let j = obj.topLeft.measure; j <= obj.bottomRight.measure; ++j) {
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
      const measures: SmoMeasureParamsSer[] = [];
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
    const buff = this.buffer[this.buffer.length - 1];
    buff.push(undoObj);
    if (!this._grouping) {
      this.buffer.push(new UndoSet());
    }
  }

  /**
   * Make sure we always have a buffer to record undoable operations
   */
  checkNull() {
    if (this.buffer.length === 0) {
      this.buffer.push(new UndoSet());
    }
  }
  /**
   * Internal method to pop the top buffer off the stack.
   * @returns 
   */
  popUndoSet(): UndoSet | null {
    this.checkNull();
    const lastBufIx = this.buffer.length - 1;
    if (!this.buffer[lastBufIx].isEmpty) {
      return  this.buffer.pop() ?? null;
    } else if (lastBufIx >= 1) {
      const buf = this.buffer.splice(lastBufIx - 1, 1);
      return buf[0] ?? null;
    }
    return null;
  }
  /**
   * non-destructively get the top undo buffer.
   * @returns 
   */
  peekUndoSet(): UndoSet | null {
    this.checkNull();
    const lastBufIx = this.buffer.length - 1;
    if (!this.buffer[lastBufIx].isEmpty) {
      return this.buffer[lastBufIx];
    }
    if (lastBufIx >= 1) {
      return this.buffer[lastBufIx - 1];
    }
    return null;
  }
  /**
   * return the type of the undo operation, so the view can know which
   * parts of the score are affected.
   * @param func 
   * @returns 
   */
  undoTypePeek(func: (buf: UndoEntry) => boolean) {
    const undoSet = this.peekUndoSet();
    if (!undoSet || undoSet.length === 0) {
      return false;
    }
    for (let i = 0; i < undoSet.buffers.length; ++i) {
      const buf = undoSet.buffers[i];
      if (func(buf)) {
        return true;
      }
    }
    return false;
  }
  undoScorePeek(): boolean {
    return this.undoTypePeek((buf) => buf.type === UndoBuffer.bufferTypes.SCORE);
  }
  undoScoreTextGroupPeek(): boolean {
    return this.undoTypePeek((buf) => buf.type === UndoBuffer.bufferTypes.SCORE_MODIFIER &&
       buf.json && buf.json.ctor === 'SmoTextGroup');
  }
  undoPartTextGroupPeek(): boolean {
    return this.undoTypePeek((buf) => buf.type === UndoBuffer.bufferTypes.PART_MODIFIER &&
       buf.json && buf.json.ctor === 'SmoTextGroup');
  }

  /**
   * Get the range of measures affected by the next undo operation.  Only
   * makes sense to call this if the undo type is MEASURE or COLUMN
   * @returns 
   */
  getMeasureRange(): number[] {
    let min = -1;
    let max = 0;
    const undoSet = this.peekUndoSet();
    if (undoSet) {
      for (let i = 0; i < undoSet.buffers.length; ++i) {
        const buf = undoSet.buffers[i];
        if (buf.type === UndoBuffer.bufferTypes.STAFF_MODIFIER) {
          return [buf.json.startSelector.measure, buf.json.endSelector.measure];
        }
        if (buf.type === UndoBuffer.bufferTypes.COLUMN) {
          if (min < 0) {
            min = buf.json.measureIndex;
          } else {
            min = Math.min(min, buf.json.measureIndex);
          }          
          buf.json.measures.forEach((mmjson: SmoMeasureParamsSer) => {
            max = Math.max(max, mmjson.measureNumber.measureIndex);
          });
        } else {
          if (min < 0) {
            min = buf.selector.measure;
          }
          max = Math.max(max, buf.selector.measure);
          min = Math.min(min, buf.selector.measure);
        }
      }
    }
    return [Math.max(0, min), max];
  }
  /**
   * Undo for text is different since text is not associated with a specific part of the
   * score (usually)
   * @param score 
   * @param staffMap 
   * @param buf 
   */
  undoTextGroup(score: SmoTextGroupContainer, staffMap: Record<number, number>, buf: UndoEntry) {
    const obj = SmoTextGroup.deserializePreserveId(buf.json);
    obj.attrs.id = buf.json.attrs.id;
    // undo of add is remove, undo of remove is add.  Undo of update is remove and add older version
    if (buf.subtype === UndoBuffer.bufferSubtypes.ADD) {
      score.removeTextGroup(obj);
    } if (buf.subtype === UndoBuffer.bufferSubtypes.UPDATE || buf.subtype === UndoBuffer.bufferSubtypes.REMOVE) {
      score.addTextGroup(obj);
    }
  }
  /**
   * Undo the operation at the top of the undo stack.  This is done by replacing
   * the music as it existed before the change was made.
   * @param score 
   * @param staffMap 
   * @param pop 
   * @returns 
   */
  undo(score: SmoScore, staffMap: Record<number, number>, pop: boolean): SmoScore {
    let mix = 0;
    let bufset: UndoSet | null = this.popUndoSet();
    if (!bufset) {
      return score;
    }
    for (let i = 0; i < bufset.buffers.length; ++i) {
      const buf = bufset.buffers[bufset.buffers.length - (i + 1)];
      if (buf.type === UndoBuffer.bufferTypes.RECTANGLE) {
        for (let j = buf.json.topLeft.staff; j <= buf.json.bottomRight.staff; ++j) {
          for (let k = buf.json.topLeft.measure; k <= buf.json.bottomRight.measure; ++k) {
            const measure = SmoMeasure.deserialize(buf.json.measures[mix]);
            mix += 1;
            const selector = SmoSelector.default;
            if (typeof(staffMap[j]) === 'number') {
              selector.staff = staffMap[j];
              measure.measureNumber.staffId = staffMap[j];
              selector.measure = k;
              score.replaceMeasure(selector, measure);
            }
          }
        }
      } else if (buf.type === UndoBuffer.bufferTypes.STAFF_MODIFIER)  {
        const modifier: StaffModifierBase = StaffModifierBase.deserialize(buf.json);
        modifier.attrs.id = buf.json.attrs.id;
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
        for (let j = 0; j < score.staves.length; ++j) {
          const measure = SmoMeasure.deserialize(buf.json.measures[j]);
          const selector = SmoSelector.default;
          if (typeof(staffMap[j]) === 'number') {
            selector.staff = staffMap[j];
            measure.measureNumber.staffId = staffMap[j];
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
          this.undoTextGroup(score, staffMap, buf);
        }
      } else if (buf.type === UndoBuffer.bufferTypes.PART_MODIFIER) {
        if (buf.json && buf.json.ctor === 'SmoTextGroup') {
          const part = score.staves[buf.selector.staff].partInfo;
          this.undoTextGroup(part, staffMap, buf);
        }
      } else {
        if (typeof(staffMap[buf.selector.staff]) === 'number') {
          buf.selector.staff = staffMap[buf.selector.staff];
          const staff = SmoSystemStaff.deserialize(buf.json);
          score.replaceStaff(buf.selector.staff, staff);
        }
      }      
    }
    return score;
  }
}

