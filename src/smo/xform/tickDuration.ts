// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoNote, TupletInfo } from '../data/note';
import { SmoTuplet, SmoTupletTree } from '../data/tuplet';
import { SmoMusic } from '../data/music';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { Ticks } from '../data/common';
import { TickMap } from './tickMap';

/**
 * Abstract class for classes that modifiy duration.
 * @param note the note we're iterating over
 * @param tickmap the tickmap for the measure
 * @param index the index into the tickmap
 * @returns the note or notes that replace this one.  Null if this note is no longer in the measure
 */
export abstract class TickIteratorBase {
  // es
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number): SmoNote | SmoNote[] | null {
    return null;
  }
}

/**
 * SmoTickIterator
 * this is a local helper class that follows a pattern of iterating of the notes.  Most of the
 * duration changers iterate over a selection, and return:
 * - A note, if the duration changes
 * - An array of notes, if the notes split
 * - null if the note stays the same
 * - empty array, remove the note from the group
 * @category SmoTransform
 */
export class SmoTickIterator {
  notes: SmoNote[] = [];
  newNotes: SmoNote[] = [];
  actor: TickIteratorBase;
  measure: SmoMeasure;
  voice: number = 0;
  keySignature: string;
  constructor(measure: SmoMeasure, actor: TickIteratorBase, voiceIndex: number) {
    this.notes = measure.voices[voiceIndex].notes;
    this.measure = measure;
    this.voice = typeof (voiceIndex) === 'number' ? voiceIndex : 0;
    this.newNotes = [];
    // eslint-disable-next-line
    this.actor = actor;
    this.keySignature = 'C';
  }
  static nullActor(note: SmoNote) {
    return note;
  }
  /**
   *
   * @param measure {SmoMeasure}
   * @param actor {}
   * @param voiceIndex
   */
  static iterateOverTicks(measure: SmoMeasure, actor: TickIteratorBase, voiceIndex: number) {
    measure.clearBeamGroups();
    const transformer = new SmoTickIterator(measure, actor, voiceIndex);
    transformer.run();
    measure.voices[voiceIndex].notes = transformer.notes;
  }
  // ### transformNote
  // call the actors for each note, and put the result in the note array.
  // The note from the original array is copied and sent to each actor.
  //
  // Because the resulting array can have a different number of notes than the existing
  // array, the actors communicate with the transformer in the following, jquery-ish
  // but somewhat unintuitive way:
  //
  // 1. if the actor returns null, the next actor is called and the results of that actor are used
  // 2. if all the actors return null, the copy is used.
  // 3. if a note object is returned, that is used for the current tick and no more actors are called.
  // 4. if an array of notes is returned, it is concatenated to the existing note array and no more actors are called.
  //     Note that *return note;* and *return [note];* produce the same result.
  // 5. if an empty array [] is returned, that copy is not added to the result.  The note is effectively deleted.
  iterateOverTick(tickmap: TickMap, index: number, note: SmoNote) {
    const actor: TickIteratorBase = this.actor;
    const newNote: SmoNote[] | SmoNote | null = actor.iterateOverTick(note, tickmap, index);
    if (newNote === null) {
      this.newNotes.push(note); // no change
      return note;
    }
    if (Array.isArray(newNote)) {
      if (newNote.length === 0) {
        return null;
      }
      this.newNotes = this.newNotes.concat(newNote);
      return null;
    }
    this.newNotes.push(newNote as SmoNote);
    return null;
  }

  run() {
    let i = 0;
    const tickmap = this.measure.tickmapForVoice(this.voice);
    for (i = 0; i < tickmap.durationMap.length; ++i) {
      this.iterateOverTick(tickmap, i, this.measure.voices[this.voice].notes[i]);
    }
    this.notes = this.newNotes;
    return this.newNotes;
  }
}

/**
 * used to create a contract/dilate operation on a note via {@link SmoContractNoteActor}
 * @category SmoTransform
 */
export interface SmoContractNoteParams {
  startIndex: number,
  measure: SmoMeasure,
  voice: number,
  newStemTicks: number
}
/**
 * Contract the duration of a note, filling in the space with another note
 * or rest.
 * @category SmoTransform
 * */
export class SmoContractNoteActor extends TickIteratorBase {
  startIndex: number;
  newStemTicks: number;
  measure: SmoMeasure;
  voice: number;
  constructor(params: SmoContractNoteParams) {
    super();
    this.startIndex = params.startIndex;
    this.measure = params.measure;
    this.voice = params.voice;
    this.newStemTicks = params.newStemTicks;
  }
  static apply(params: SmoContractNoteParams) {
    const actor = new SmoContractNoteActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure,
      actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number): SmoNote | SmoNote[] | null {
    if (index === this.startIndex) {
      let newTicks: Ticks = { numerator: this.newStemTicks, denominator: 1, remainder: 0 };
      const multiplier = note.tickCount / note.stemTicks;

      if (note.isTuplet) {
        const numerator = this.newStemTicks * multiplier;
        newTicks = { numerator: Math.floor(numerator), denominator: 1, remainder: numerator % 1 };
      } 

      const replacingNote = SmoNote.cloneWithDuration(note, newTicks, this.newStemTicks);
      const oldStemTicks = note.stemTicks;
      const notes = [];
      const remainderStemTicks = oldStemTicks - this.newStemTicks;

      notes.push(replacingNote);
  
      if (remainderStemTicks > 0) {
        if (remainderStemTicks < 128) {
          return null;
        }
        const lmap = SmoMusic.gcdMap(remainderStemTicks);
        lmap.forEach((stemTick) => {
          const nnote = SmoNote.cloneWithDuration(note, stemTick * multiplier, stemTick);
          notes.push(nnote);
        });
      }

      SmoTupletTree.adjustTupletIndexes(this.measure.tupletTrees, this.voice, index, notes.length - 1);
      return notes;
    }
    return null;
  }
}

/**
 * Constructor when we want to double or dot the duration of a note (stretch)
 * for {@link SmoStretchNoteActor}
 * @param startIndex tick index into the measure
 * @param measure the container measure
 * @param voice the voice index
 * @param newTicks the ticks the new note will take up
 * @category SmoTransform
 */
export interface SmoStretchNoteParams {
  startIndex: number,
  measure: SmoMeasure,
  voice: number,
  newStemTicks: number
}
/**
 * increase the length of a note, removing future notes in the measure as required
 * @category SmoTransform
 */
export class SmoStretchNoteActor extends TickIteratorBase {
  startIndex: number;
  newStemTicks: number;
  measure: SmoMeasure;
  voice: number;
  notes: SmoNote[];
  notesToInsert: SmoNote[] = [];
  numberOfNotesToDelete: number = 0;
  constructor(params: SmoStretchNoteParams) {
    super();
    this.startIndex = params.startIndex;
    this.measure = params.measure;
    this.voice = params.voice;
    this.newStemTicks = params.newStemTicks;
    this.notes = this.measure.voices[this.voice].notes;

    const originalNote: SmoNote = this.notes[this.startIndex];
    let newTicks: Ticks = { numerator: this.newStemTicks, denominator: 1, remainder: 0 };
    const multiplier = originalNote.tickCount / originalNote.stemTicks;
    if (originalNote.isTuplet) {
      const numerator = this.newStemTicks * multiplier;
      newTicks = { numerator: Math.floor(numerator), denominator: 1, remainder: numerator % 1 };
    } 

    const replacingNote = SmoNote.cloneWithDuration(originalNote, newTicks, this.newStemTicks);

    let stemTicksUsed = originalNote.stemTicks;
    for (let i = this.startIndex + 1; i < this.notes.length; ++i) {
      const nnote = this.notes[i];
      //in case notes are part of the tuplet they need to belong to the same tuplet
      //this check is only temporarely here, it should never come to this
      if (nnote.isTuplet && !this.areNotesInSameTuplet(originalNote, nnote)) {
        break;
      }
      stemTicksUsed += nnote.stemTicks;
      ++this.numberOfNotesToDelete;
      if (stemTicksUsed >= this.newStemTicks) {
        break;
      }
    }
    const remainder = stemTicksUsed - this.newStemTicks;
    if (remainder >= 0) {
      this.notesToInsert.push(replacingNote);
      const lmap = SmoMusic.gcdMap(remainder);
      lmap.forEach((stemTick) => {
        const nnote = SmoNote.cloneWithDuration(originalNote, stemTick * multiplier, stemTick)
        this.notesToInsert.push(nnote);
      });
      const noteCountDiff = (this.notesToInsert.length - this.numberOfNotesToDelete) - 1;
      SmoTupletTree.adjustTupletIndexes(this.measure.tupletTrees, this.voice, this.startIndex, noteCountDiff);
    }
  }
  static apply(params: SmoStretchNoteParams) {
    const actor = new SmoStretchNoteActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    if (this.startIndex === index && this.notesToInsert.length) {
      return this.notesToInsert;
    } else if (index > this.startIndex && this.numberOfNotesToDelete > 0) {
      --this.numberOfNotesToDelete;
      return [];
    } 
    return null;
  }

  private areNotesInSameTuplet(noteOne: SmoNote, noteTwo: SmoNote): boolean {
    if (noteOne.isTuplet && noteTwo.isTuplet && noteOne.tuplet!.id == noteTwo.tuplet!.id) {
      return true;
    }
    return false;
  }
}


/**
 * constructor parameters for {@link SmoMakeTupletActor}
 * @category SmoTransform
 */
export interface SmoMakeTupletParams {
  measure: SmoMeasure,
  numNotes: number,
  voice: number,
  index: number
}
/**
 * Turn a tuplet into a non-tuplet of the same length
 * @category SmoTransform
 * 
 * */
export class SmoMakeTupletActor extends TickIteratorBase {
  measure: SmoMeasure;
  numNotes: number;
  voice: number;
  index: number;
  
  constructor(params: SmoMakeTupletParams) {
    super();
    this.measure = params.measure;
    this.index = params.index;
    this.voice = params.voice;
    this.numNotes = params.numNotes;
  }
  static apply(params: SmoMakeTupletParams) {
    const actor = new SmoMakeTupletActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    if (this.measure === null) {
      return [];
    }
    if (index !== this.index) {
      return null;
    }

    this.measure.clearBeamGroups();
    const stemTicks = SmoTuplet.calculateStemTicks(note.stemTicks, this.numNotes);
    const notesOccupied = note.stemTicks / stemTicks;

    const tuplet = new SmoTuplet({
      numNotes: this.numNotes,
      notesOccupied: notesOccupied,
      stemTicks: stemTicks,
      totalTicks: note.tickCount,
      ratioed: false,
      bracketed: true,
      voice: this.voice,
      startIndex: this.index,
      endIndex: this.index,
    });

    const tupletNotes = this._generateNotesForTuplet(tuplet, note, stemTicks);
    tuplet.endIndex += tupletNotes.length - 1;

    SmoTupletTree.adjustTupletIndexes(this.measure.tupletTrees, this.voice, index, tupletNotes.length - 1);
    const parentTuplet: SmoTuplet | null = SmoTupletTree.getTupletForNoteIndex(this.measure.tupletTrees, this.voice, this.index);
    if (parentTuplet === null) {
      const tupletTree = new SmoTupletTree({tuplet: tuplet});
      this.measure.tupletTrees.push(tupletTree);
    } else {
      parentTuplet.childrenTuplets.push(tuplet);
    }

    return tupletNotes;
  }

  private _generateNotesForTuplet(tuplet: SmoTuplet, originalNote: SmoNote, stemTicks: number): SmoNote[] {
    const totalTicks = originalNote.tickCount;
    const tupletNotes: SmoNote[] = [];
    const numerator = totalTicks / this.numNotes;
    for (let i = 0; i < this.numNotes; ++i) {
      const note: SmoNote = SmoNote.cloneWithDuration(originalNote, { numerator: Math.floor(numerator), denominator: 1, remainder: 0 }, stemTicks);
      // Don't clone modifiers, except for first one.
      note.textModifiers = i === 0 ? note.textModifiers : [];
      note.tuplet = tuplet.attrs;
      tupletNotes.push(note);
    }
    if (numerator % 1) {
      tupletNotes[0].ticks.numerator += 1;
    }
    return tupletNotes;
  }
}


/**
 * Constructor params for {@link SmoUnmakeTupletActor}
 * @category SmoTransform
 */
export interface SmoUnmakeTupletParams {
  startIndex: number,
  endIndex: number,
  measure: SmoMeasure,
  voice: number
}
/**
 * Convert a tuplet into a single note that takes up the whole duration
 * @category SmoTransform
 */
export class SmoUnmakeTupletActor extends TickIteratorBase {
  startIndex: number = 0;
  endIndex: number = 0;
  measure: SmoMeasure;
  voice: number;
  constructor(parameters: SmoUnmakeTupletParams) {
    super();
    this.startIndex = parameters.startIndex;
    this.endIndex = parameters.endIndex;
    this.measure = parameters.measure;
    this.voice = parameters.voice;
  }
  static apply(params: SmoUnmakeTupletParams) {
    const actor = new SmoUnmakeTupletActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    if (index < this.startIndex || index > this.endIndex) {
      return null;
    }
    if (index === this.startIndex) {
      const tuplet = SmoTupletTree.getTupletForNoteIndex(this.measure.tupletTrees, this.voice, index);
      if (tuplet === null) {
        return [];
      }

      const ticks = tuplet.totalTicks;
      const nn: SmoNote = SmoNote.cloneWithDuration(note, { numerator: ticks, denominator: 1, remainder: 0 });
      nn.tuplet = null;
      SmoTupletTree.removeTupletForNoteIndex(this.measure, this.voice, index);
      SmoTupletTree.adjustTupletIndexes(this.measure.tupletTrees, this.voice, this.startIndex, this.startIndex - this.endIndex);
      
      return [nn];
    }
    return [];
  }
}

