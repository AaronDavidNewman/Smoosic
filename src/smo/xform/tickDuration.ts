// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoNote, TupletInfo } from '../data/note';
import { SmoTuplet } from '../data/tuplet';
import { SmoMusic } from '../data/music';
import { SmoSelector, SmoSelection } from './selections';
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

export class SmoMakeTupletActor {
  private note: SmoNote;
  private measure: SmoMeasure; 
  private selector: SmoSelector;
  private voices: SmoVoice[];
  private voice: SmoVoice;

  private totalTicks: number;
  private parentTuplet: SmoTuplet | null;
  private numNotes: number;
  private notesOccupied: number;
  private tupletNotes: SmoNote[] = [];
  private stemTicks: number;
  private tuplet: SmoTuplet;

  constructor(selection: SmoSelection, numNotes: number) {
    this.note = selection.note!;
    this.measure = selection.measure;
    
    this.selector = selection.selector;
    this.voices = this.measure.voices;
    this.voice = this.voices[this.selector.voice];
    this.numNotes = numNotes;  

    this.totalTicks = this.note.tickCount;
    this.parentTuplet = this.measure.getTupletForNoteIndex(this.selector.voice, this.selector.tick);

    this.stemTicks = SmoTuplet.calculateStemTicks(this.note.stemTicks, this.numNotes);
    this.notesOccupied = this.note.stemTicks / this.stemTicks;
    
    this.tuplet = new SmoTuplet({
      stemTicks: this.stemTicks,
      totalTicks: this.totalTicks,
      ratioed: false,
      bracketed: true, 
      voice: this.selector.voice,
      numNotes: this.numNotes,
      notesOccupied: this.notesOccupied,
      startIndex: this.selector.tick,
      endIndex: this.selector.tick
    });
    
  }

  static apply(selection: SmoSelection, numNotes: number) {
    if (!selection?.note) {
      return;
    }
    const actor = new SmoMakeTupletActor(selection, numNotes);
    actor.initialize();
  }

  public initialize() {
    this.measure.clearBeamGroups();
    this.tupletNotes = this._generateTupletNotes();
    this.tuplet.endIndex += this.tupletNotes.length - 1;
    this.measure.adjustTupletIndexes(this.selector.tick, this.tupletNotes.length - 1);

    if (this.parentTuplet !== null) {
      this.parentTuplet.childrenTuplets.push(this.tuplet);
      this.tuplet.parentTuplet = { id: this.parentTuplet.attrs.id };
      // const index = this.parentTuplet.getIndexOfNote(this.note);
      // this.parentTuplet.tickables.splice(index, 1, this.tuplet);
    } else {
      this.measure.tupletTrees.push(this.tuplet);
    }

    this.voice.notes.splice(this.selector.tick, 1, ...this.tupletNotes);
    console.log(this.voice);
  }

  private _generateTupletNotes(): SmoNote[] {
    const tupletNotes: SmoNote[] = [];
    for (let i = 0; i < this.numNotes; ++i) {
      const numerator = this.totalTicks / this.numNotes;
      const note: SmoNote = SmoNote.cloneWithDuration(this.note, { numerator: Math.floor(numerator), denominator: 1, remainder: numerator % 1 }, this.stemTicks);
      // Don't clone modifiers, except for first one.
      note.textModifiers = i === 0 ? note.textModifiers : [];
      note.tuplet = this.tuplet.attrs;
      tupletNotes.push(note);
    }

    return tupletNotes;
  }
}


export class SmoChangeDurationActor {
  private newStemTicks: number;
  private note: SmoNote;
  private measure: SmoMeasure; 
  private selector: SmoSelector;
  private voices: SmoVoice[];
  private voice: SmoVoice;
  private notes: SmoNote[];

  constructor(selection: SmoSelection, newStemTicks: number) {
    this.newStemTicks = newStemTicks;
    this.note = selection.note!;
    this.measure = selection.measure;
    this.selector = selection.selector;
    this.voices = this.measure.voices;
    this.voice = this.voices[this.selector.voice];
    this.notes = this.voice.notes;
  }

  static apply(selection: SmoSelection, newDuration: number) {
    if (!selection?.note) {
      return;
    }
    const actor = new SmoChangeDurationActor(selection, newDuration);
    actor.initialize();
  }

  public initialize() {
    this.measure.clearBeamGroups();
    if (this.newStemTicks > this.note.stemTicks) {
      //if new stemTicks is crossing tuplet boundary, 
      //clear tuplets that are in the way and only then proceed to actually stretch the note
      //todo: clearTuplets();
      this.stretchNote();
    } else if (this.newStemTicks < this.note.stemTicks) {
      this.contractNote();
    } else {
      return;
    }
  }

  /**
   * todo: handle ticks reminder
   * Expand the note and absorb all notes to the right that fall within the new duration. 
   * If the duration of the last note does not completely fit within the new duration, fill in the remainder with new notes.
   */
  private stretchNote() {
    let i = 0;

    let newTicks: Ticks = { numerator: this.newStemTicks, denominator: 1, remainder: 0 };

    const multiplier = this.note.tickCount / this.note.stemTicks;

    if (this.note.isTuplet) {
      const numerator = this.newStemTicks * multiplier;
      newTicks = { numerator: Math.floor(numerator), denominator: 1, remainder: numerator % 1 };
    } 

    const replacingNote = SmoNote.cloneWithDuration(this.note, newTicks, this.newStemTicks);

    let stemTicksUsed = this.note.stemTicks;
    const allNotes = [];
    // const newNotes = [];
    for (i = 0; i < this.selector.tick; ++i) {
      allNotes.push(this.notes[i]);
    }
    for (i = this.selector.tick + 1; i < this.notes.length; ++i) {
      const nnote = this.notes[i];
      //in case notes are part of the tuplet they need to belong to the same tuplet
      //this check is only temporarely here, it should never come to this
      if (nnote.isTuplet && !this.areNotesInSameTuplet(this.note, nnote)) {
        break;
      }
      stemTicksUsed += nnote.stemTicks;
      if (stemTicksUsed >= this.newStemTicks) {
        break;
      }
    }
    const remainder = stemTicksUsed - this.newStemTicks;
    if (remainder < 0) {
      return;
    }
    
    allNotes.push(replacingNote);
    // newNotes.push(replacingNote);

    if (remainder > 0) {
      const lmap = SmoMusic.gcdMap(remainder);
      lmap.forEach((stemTick) => {
        const nnote = SmoNote.cloneWithDuration(this.note, stemTick * multiplier, stemTick)
        allNotes.push(nnote);
        // newNotes.push(nnote);
      });
    }
    
    for (i = i + 1 ; i < this.notes.length; ++i) {
      allNotes.push(this.notes[i]);
    }

    const noteCountDiff = allNotes.length - this.voice.notes.length;
    this.measure.adjustTupletIndexes(this.selector.tick, noteCountDiff);
    this.voice.notes = allNotes;
    
  }

  /**
   * todo: handle ticks reminder
   * replace duration of current note and fill in the rest with new notes
   */
  private contractNote() {
    let i = 0;

    let newTicks: Ticks = { numerator: this.newStemTicks, denominator: 1, remainder: 0 };

    const multiplier = this.note.tickCount / this.note.stemTicks;

    if (this.note.isTuplet) {
      const numerator = this.newStemTicks * multiplier;
      newTicks = { numerator: Math.floor(numerator), denominator: 1, remainder: numerator % 1 };
    } 

    const replacingNote = SmoNote.cloneWithDuration(this.note, newTicks, this.newStemTicks);
    const stemTicksUsed = this.note.stemTicks;
    const allNotes = [];
    // const newNotes = [];
    for (i = 0; i < this.selector.tick; ++i) {
      allNotes.push(this.notes[i]);
    }
    const remainder = stemTicksUsed - this.newStemTicks;
    allNotes.push(replacingNote);
    // newNotes.push(replacingNote);

    if (remainder > 0) {
      const lmap = SmoMusic.gcdMap(remainder);
      lmap.forEach((stemTick) => {
        const nnote = SmoNote.cloneWithDuration(this.note, stemTick * multiplier, stemTick);
        allNotes.push(nnote);
        // newNotes.push(nnote);
      });
    }
    for (i = this.selector.tick + 1; i < this.notes.length; ++i) {
      allNotes.push(this.notes[i]);
    }

    const noteCountDiff = allNotes.length - this.voice.notes.length;
    this.measure.adjustTupletIndexes(this.selector.tick, noteCountDiff);
    this.voice.notes = allNotes;
  }

  private areNotesInSameTuplet(noteOne: SmoNote, noteTwo: SmoNote): boolean {
    if (noteOne.isTuplet && noteTwo.isTuplet && noteOne.tuplet!.id == noteTwo.tuplet!.id) {
      return true;
    }
    return false;
  }
}
