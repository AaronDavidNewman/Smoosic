// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoTuplet}
 * @module /smo/data/tuplet
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoNote, SmoNoteParamsSer } from './note';
import { SmoMusic } from './music';
import { SmoNoteModifierBase } from './noteModifiers';
import { getId, SmoAttrs, Clef } from './common';

/**
 * Parameters for tuplet construction
 * @param notes - runtime instance of tuplet has an actual instance of 
 * notes.  The note instances are created by the deserilization of the 
 * measure.  We serialize the note parameters so we can identify the correct notes
 * when deserializing.
 * @category SmoParameters
 */
export interface SmoTupletParams {
  notes: SmoNote[],
  attrs?: SmoAttrs,
  numNotes: number,
  stemTicks: number,
  totalTicks: number,
  durationMap: number[],
  ratioed: boolean,
  bracketed: boolean,
  voice: number,
  startIndex: number
}
/**
 * serializabl bits of SmoTuplet
 */
export interface SmoTupletParamsSer {
  /**
   * constructor
   */
  ctor: string,
  /**
   * attributes for ID
   */
  attrs: SmoAttrs,
  /**
   * info about the serialized notes
   */
  notes: SmoNoteParamsSer[],
  /**
   * numNotes in the duplet (not necessarily same as notes array size)
   */
  numNotes: number,
  /**
   * used to decide how to beam, 2048 for 1/4 triplet for instance
   */
  stemTicks: number,
  /**
   * total ticks to squeeze numNotes
   */
  totalTicks: number,
  /**
   * map of notes to ticks
   */
  durationMap: number[],
  /**
   * whether to use the :
   */
  ratioed: boolean,
  /**
   * whether to show the brackets
   */
  bracketed: boolean,
  /**
   * which voice the tuplet applies to
   */
  voice: number,
  /**
   * the start tick index of the measure
   */
  startIndex: number
}

/**
 * tuplets must be serialized with their id attribute, enforce this
 * @param params a possible-valid SmoTupletParamsSer
 * @returns 
 */
function isSmoTupletParamsSer(params: Partial<SmoTupletParamsSer>): params is SmoTupletParamsSer {
  if (!params.ctor || !(params.ctor === 'SmoTuplet')) {
    return false;
  }
  if (!params.attrs || !(typeof(params.attrs.id) === 'string')) {
    return false;
  }
  return true;
}
/**
 * A tuplet is a container for notes within a measure
 * @category SmoObject
 */
export class SmoTuplet {
  static get defaults(): SmoTupletParams {
    return JSON.parse(JSON.stringify({
      notes: [],
      numNotes: 3,
      stemTicks: 2048,
      totalTicks: 4096, // how many ticks this tuple takes up
      durationMap: [1.0, 1.0, 1.0],
      bracketed: true,
      voice: 0,
      ratioed: false,
      startIndex: 0
    }));
  }
  attrs: SmoAttrs;
  notes: SmoNote[];
  numNotes: number = 3;
  stemTicks: number = 2048;
  totalTicks: number = 4096;
  durationMap: number[] = [1.0, 1.0, 1.0];
  bracketed: boolean = true;
  voice: number = 0;
  ratioed: boolean = false;
  startIndex: number = 0;

  get clonedParams() {
    const paramAr = ['stemTicks', 'ticks', 'totalTicks', 'durationMap', 'numNotes'];
    const rv = {};
    smoSerialize.serializedMerge(paramAr, this, rv);
    return rv;
  }

  static get parameterArray() {
    return ['stemTicks', 'ticks', 'totalTicks',
      'durationMap', 'attrs', 'ratioed', 'bracketed', 'voice', 'startIndex', 'numNotes'];
  }

  serialize(): SmoTupletParamsSer {
    const params:Partial<SmoTupletParamsSer> = {
      notes: []
    };
    this.notes.forEach((nn) => {
      params.notes!.push(nn.serialize());
    });
    params.ctor = 'SmoTuplet';
    smoSerialize.serializedMergeNonDefault(SmoTuplet.defaults,
      SmoTuplet.parameterArray, this, params);
    if (!isSmoTupletParamsSer(params)) {
      throw 'bad tuplet ' + JSON.stringify(params);
    }
    return params;
  }

  static calculateStemTicks(totalTicks: number, numNotes: number) {
    const stemValue = totalTicks / numNotes;
    let stemTicks = SmoTuplet.longestTuplet;

    // The stem value is the type on the non-tuplet note, e.g. 1/8 note
    // for a triplet.
    while (stemValue < stemTicks) {
      stemTicks = stemTicks / 2;
    }
    return stemTicks * 2;
  }
  constructor(params: SmoTupletParams) {
    smoSerialize.vexMerge(this, SmoTuplet.defaults);
    smoSerialize.serializedMerge(SmoTuplet.parameterArray, params, this);
    this.notes = params.notes;
    this.attrs = {
      id: getId().toString(),
      type: 'SmoTuplet'
    };
    this._adjustTicks();
  }
  static get longestTuplet() {
    return 8192;
  }
  static cloneTuplet(tuplet: SmoTuplet): SmoTuplet {
    let i = 0;
    const noteAr = tuplet.notes;
    const durationMap = JSON.parse(JSON.stringify(tuplet.durationMap)); // deep copy array

    // Add any remainders for oddlets
    const totalTicks = noteAr.map((nn) => nn.ticks.numerator + nn.ticks.remainder)
      .reduce((acc, nn) => acc + nn);

    const numNotes: number = tuplet.numNotes;
    const stemTicks = SmoTuplet.calculateStemTicks(totalTicks, numNotes);

    const tupletNotes: SmoNote[] = [];

    noteAr.forEach((note) => {
      const textModifiers = note.textModifiers;
      // Note preserver remainder
      note = SmoNote.cloneWithDuration(note, {
        numerator: stemTicks * tuplet.durationMap[i],
        denominator: 1,
        remainder: note.ticks.remainder
      });

      // Don't clone modifiers, except for first one.
      if (i === 0) {
        const ntmAr: any = [];
        textModifiers.forEach((tm) => {
          const ntm = SmoNoteModifierBase.deserialize(tm);
          ntmAr.push(ntm);
        });
        note.textModifiers = ntmAr;
      }
      i += 1;
      tupletNotes.push(note);
    });
    const rv = new SmoTuplet({
      numNotes: tuplet.numNotes,
      voice: tuplet.voice,
      notes: tupletNotes,
      stemTicks,
      totalTicks,
      ratioed: false,
      bracketed: true,
      startIndex: tuplet.startIndex,
      durationMap
    });
    return rv;
  }

  _adjustTicks() {
    let i = 0;
    const sum = this.durationSum;
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      // TODO:  notes_occupied needs to consider vex duration
      note.ticks.denominator = 1;
      note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);
      note.tuplet = this.attrs;
    }

    // put all the remainder in the first note of the tuplet
    const noteTicks = this.notes.map((nn) => nn.tickCount)
      .reduce((acc, dd) => acc + dd);
    // bug fix:  if this is a clones tuplet, remainder is already set
    this.notes[0].ticks.remainder =
      this.notes[0].ticks.remainder + this.totalTicks - noteTicks;
  }
  getIndexOfNote(note: SmoNote | null): number {
    let rv = -1;
    let i = 0;
    if (!note) {
      return -1;
    }
    for (i = 0; i < this.notes.length; ++i) {
      const tn = this.notes[i];
      if (note.attrs.id === tn.attrs.id) {
        rv = i;
      }
    }
    return rv;
  }

  split(combineIndex: number) {
    let i = 0;
    const multiplier = 0.5;
    const nnotes: SmoNote[] = [];
    const nmap: number[] = [];
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      if (i === combineIndex) {
        nmap.push(this.durationMap[i] * multiplier);
        nmap.push(this.durationMap[i] * multiplier);
        note.ticks.numerator *= multiplier;

        const onote = SmoNote.clone(note);
        // remainder is for the whole tuplet, so don't duplicate that.
        onote.ticks.remainder = 0;
        nnotes.push(note);
        nnotes.push(onote);
      } else {
        nmap.push(this.durationMap[i]);
        nnotes.push(note);
      }
    }
    this.notes = nnotes;
    this.durationMap = nmap;
  }
  combine(startIndex: number, endIndex: number) {
    let i = 0;
    let base = 0.0;
    let acc = 0.0;
    // can't combine in this way, too many notes
    if (this.notes.length <= endIndex || startIndex >= endIndex) {
      return this;
    }
    for (i = startIndex; i <= endIndex; ++i) {
      acc += this.durationMap[i];
      if (i === startIndex) {
        base = this.durationMap[i];
      } else if (this.durationMap[i] !== base) {
        // Can't combine non-equal tuplet notes
        return this;
      }
    }
    // how much each combined value will be multiplied by
    const multiplier = acc / base;

    const nmap = [];
    const nnotes = [];
    // adjust the duration map
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      // notes that don't change are unchanged
      if (i < startIndex || i > endIndex) {
        nmap.push(this.durationMap[i]);
        nnotes.push(note);
      }
      // changed note with combined duration
      if (i === startIndex) {
        note.ticks.numerator = note.ticks.numerator * multiplier;
        nmap.push(acc);
        nnotes.push(note);
      }
      // other notes after startIndex are removed from the map.
    }
    this.notes = nnotes;
    this.durationMap = nmap;
    return this;
  }

  // ### getStemDirection
  // Return the stem direction, so we can bracket the correct place
  getStemDirection(clef: Clef) {
    const note = this.notes.find((nn) => nn.noteType === 'n');
    if (!note) {
      return SmoNote.flagStates.down;
    }
    if (note.flagState !== SmoNote.flagStates.auto) {
      return note.flagState;
    }
    return SmoMusic.pitchToLedgerLine(clef, note.pitches[0])
      >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
  }
  get durationSum() {
    let acc = 0;
    let i = 0;
    for (i = 0; i < this.durationMap.length; ++i) {
      acc += this.durationMap[i];
    }
    return Math.round(acc);
  }
  get num_notes() {
    return this.durationSum;
  }
  get notes_occupied() {
    return Math.floor(this.totalTicks / this.stemTicks);
  }
  get note_ticks_occupied() {
    return this.totalTicks / this.stemTicks;
  }
  get tickCount() {
    let rv = 0;
    let i = 0;
    for (i = 0; i < this.notes.length; ++i) {
      const note = this.notes[i];
      rv += (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
    }
    return rv;
  }
}
