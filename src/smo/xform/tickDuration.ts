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
/**
 * SmoDuration: change the duration of a note, maybe at the expense of some
 * other note.
 * @category SmoTransform
 */
export class SmoDuration {
  /**
   * doubleDurationNonTuplet
   * double the duration of the selection, consuming the next note or
   * possibly split it in half and consume that.  Simple operation so
   * do it inline
   * @param selection
   * @returns
   */
  static doubleDurationNonTuplet(selection: SmoSelection) {
    const note: SmoNote | null = selection?.note;
    const measure: SmoMeasure = selection.measure;
    if (note === null) {
      return;
    }
    const selector: SmoSelector = selection.selector;
    const voices: SmoVoice[] | undefined = measure?.voices;
    const voice: SmoVoice = voices[selector.voice];
    const notes: SmoNote[] = voice?.notes;
    let i = 0;
    const nticks: Ticks = { numerator: note.tickCount * 2, denominator: 1, remainder: 0 };
    const replNote = SmoNote.cloneWithDuration(note, nticks);
    let ticksUsed = note.tickCount;
    const newNotes = [];
    for (i = 0; i < selector.tick; ++i) {
      newNotes.push(notes[i]);
    }
    for (i = selector.tick + 1; i < notes.length; ++i) {
      const nnote = notes[i];
      ticksUsed += nnote.tickCount;
      if (ticksUsed >= nticks.numerator) {
        break;
      }
    }
    const remainder = ticksUsed - nticks.numerator;
    if (remainder < 0) {
      return;
    }
    newNotes.push(replNote);
    if (remainder > 0) {
      const lmap = SmoMusic.gcdMap(remainder);
      lmap.forEach((duration) => {
        newNotes.push(SmoNote.cloneWithDuration(note, duration));
      });
    }

    for (i = i + 1; i < notes.length; ++i) {
      newNotes.push(notes[i]);
    }
    // If any tuplets got removed while extending the notes,
    voice.notes = newNotes;
    const measureTuplets: SmoTuplet[] = [];
    const allTuplets: SmoTuplet[] | undefined = measure?.tuplets;
    allTuplets?.forEach((tuplet: SmoTuplet) => {
      const testNotes = measure?.tupletNotes(tuplet);
      if (testNotes?.length === tuplet.notes.length) {
        measureTuplets.push(tuplet);
      }
    });
    measure.tuplets = measureTuplets;
  }

  /**
   * double duration, tuplet form.  Increase the first selection and consume the
   * following note.  Also a simple operation
   * @param selection
   * @returns
   */
  static doubleDurationTuplet(selection: SmoSelection) {
    let i: number = 0;
    const measure: SmoMeasure = selection.measure;
    const note: SmoNote | null = selection?.note;
    if (note === null) {
      return;
    }
    const notes = measure.voices[selection.selector.voice].notes;
    const tuplet: SmoTuplet | null = measure.getTupletForNote(note);
    if (tuplet === null) {
      return;
    }
    const startIndex = selection.selector.tick - tuplet.startIndex;

    const startLength: number = tuplet.notes.length;
    tuplet.combine(startIndex, startIndex + 1);
    if (tuplet.notes.length >= startLength) {
      return;
    }
    const newNotes = [];

    for (i = 0; i < tuplet.startIndex; ++i) {
      newNotes.push(notes[i]);
    }
    tuplet.notes.forEach((note) => {
      newNotes.push(note);
    });
    for (i = i + tuplet.notes.length + 1; i < notes.length; ++i) {
      newNotes.push(notes[i]);
    }
    measure.voices[selection.selector.voice].notes = newNotes;
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
export interface SmoContractNoteParams {
  startIndex: number,
  measure: SmoMeasure,
  voice: number,
  newTicks: number
}
/**
 * Contract the duration of a note, filling in the space with another note
 * or rest.
 * @category SmoTransform
 * */
export class SmoContractNoteActor extends TickIteratorBase {
  startIndex: number;
  tickmap: TickMap;
  newTicks: number;
  measure: SmoMeasure;
  voice: number;
  constructor(params: SmoContractNoteParams) {
    super();
    this.startIndex = params.startIndex;
    this.measure = params.measure;
    this.voice = params.voice;
    this.tickmap = this.measure.tickmapForVoice(this.voice);
    this.newTicks = params.newTicks;
  }
  static apply(params: SmoContractNoteParams) {
    const actor = new SmoContractNoteActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure,
      actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number): SmoNote | SmoNote[] | null {
    let i = 0;
    if (index === this.startIndex) {
      const notes: SmoNote[] = [];
      const noteCount = Math.floor(note.ticks.numerator / this.newTicks);
      let remainder = note.ticks.numerator;
      /**
       *  Replace 1 note with noteCOunt notes of newTIcks duration
       *      old map:
       *     d  .  d  .  .
       *     new map:
       *     d  d  d  .  .
       */
      for (i = 0; i < noteCount; ++i) {
        // first note, retain modifiers so clone.  Otherwise just
        // retain pitches
        if (i === 0) {
          const nn = SmoNote.clone(note);
          nn.ticks = { numerator: this.newTicks, denominator: 1, remainder: 0 };
          notes.push(nn);
        } else {
          const nnote = new SmoNote(SmoNote.defaults);
          nnote.clef = note.clef;
          nnote.pitches = JSON.parse(JSON.stringify(note.pitches));
          nnote.ticks = { numerator: this.newTicks, denominator: 1, remainder: 0 };
          nnote.beamBeats = note.beamBeats;
          notes.push(nnote);
        }
        remainder = remainder - this.newTicks;
      }

      // make sure remnainder is not too short
      if (remainder > 0) {
        if (remainder < 128) {
          return null;
        }
        const nnote = new SmoNote(SmoNote.defaults);
        nnote.clef = note.clef;
        nnote.pitches = JSON.parse(JSON.stringify(note.pitches));
        nnote.ticks = { numerator: remainder, denominator: 1, remainder: 0 };
        nnote.beamBeats = note.beamBeats;
        notes.push(nnote);
      }
      return notes;
    }
    return null;
  }
}

export interface SmoContractTupletParams {
  changeIndex: number,
  measure: SmoMeasure,
  voice: number
}
/**
 * Shrink the duration of a note in a tuplet by creating additional notes
 * @category SmoTransform
 */
export class SmoContractTupletActor extends TickIteratorBase {
  changeIndex: number;
  measure: SmoMeasure;
  voice: number;
  tuplet: SmoTuplet | null;
  oldLength: number = 0;
  tupletIndex: number = 0;
  splitIndex: number = 0;
  constructor(params: SmoContractTupletParams) {
    super();
    this.changeIndex = params.changeIndex;
    this.measure = params.measure;
    this.voice = params.voice;
    this.tuplet = this.measure.getTupletForNote(this.measure.voices[this.voice].notes[this.changeIndex]);
    if (this.tuplet === null) {
      return;
    }
    this.oldLength = this.tuplet.notes.length;
    this.tupletIndex = this.measure.tupletIndex(this.tuplet);
    this.splitIndex = this.changeIndex - this.tupletIndex;
    this.tuplet.split(this.splitIndex);
  }
  static apply(params: SmoContractTupletParams) {
    const actor = new SmoContractTupletActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    if (this.tuplet === null) {
      return null;
    }
    if (index < this.tupletIndex) {
      return note;
    }
    if (index >= this.tupletIndex + this.oldLength) {
      return note;
    }
    if (index === this.changeIndex) {
      return this.tuplet.notes;
    }
    return [];
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
      const tuplet = this.measure.getTupletForNote(note);
      if (tuplet === null) {
        return [];
      }
      const ticks = tuplet.totalTicks;
      const nn: SmoNote = SmoNote.cloneWithDuration(note, { numerator: ticks, denominator: 1, remainder: 0 });
      nn.tuplet = {} as TupletInfo;
      this.measure.removeTupletForNote(note);
      return [nn];
    }
    return [];
  }
}

/**
 * constructor parameters for {@link SmoMakeTupletActor}
 * @category SmoTransform
 */
export interface SmoMakeTupletParams {
  index: number,
  totalTicks: number,
  numNotes: number,
  measure: SmoMeasure,
  voice: number
}
/**
 * Turn a tuplet into a non-tuplet of the same length
 * @category SmoTransform
 * 
 * */
export class SmoMakeTupletActor extends TickIteratorBase {
  measure: SmoMeasure;
  durationMap: number[];
  numNotes: number;
  stemTicks: number;
  totalTicks: number;
  rangeToSkip: number[];
  tuplet: SmoNote[];
  voice: number;
  index: number;
  constructor(params: SmoMakeTupletParams) {
    let i = 0;
    super();
    this.measure = params.measure;
    this.numNotes = params.numNotes;
    this.durationMap = [];
    this.totalTicks = params.totalTicks;
    this.voice = params.voice;
    this.index = params.index;
    for (i = 0; i < this.numNotes; ++i) {
      this.durationMap.push(1.0);
    }
    this.stemTicks = SmoTuplet.calculateStemTicks(this.totalTicks, this.numNotes);
    this.rangeToSkip = this._rangeToSkip();
    this.tuplet = [];
  }
  static apply(params: SmoMakeTupletParams) {
    const actor = new SmoMakeTupletActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  _rangeToSkip(): number[] {
    let i = 0;
    if (this.measure === null) {
      return [];
    }
    const ticks = this.measure.tickmapForVoice(this.voice);
    let accum = 0;
    const rv = [];
    rv.push(this.index);
    for (i = 0; i < ticks.deltaMap.length; ++i) {
      if (i >= this.index) {
        accum += ticks.deltaMap[i];
      }
      if (accum >= this.totalTicks) {
        rv.push(i);
        break;
      }
    }
    return rv;
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    let i = 0;
    // if our tuplet replaces this note, make sure we make it go away.
    if (index > this.index && index <= this.rangeToSkip[1]) {
      return [];
    }
    if (this.measure === null) {
      return [];
    }
    if (index !== this.index) {
      return null;
    }
    for (i = 0; i < this.numNotes; ++i) {
      note = SmoNote.cloneWithDuration(note, { numerator: this.stemTicks, denominator: 1, remainder: 0 });
      // Don't clone modifiers, except for first one.
      note.textModifiers = i === 0 ? note.textModifiers : [];
      this.tuplet.push(note);
    }
    const tuplet = new SmoTuplet({
      notes: this.tuplet,
      stemTicks: this.stemTicks,
      totalTicks: this.totalTicks,
      ratioed: false,
      bracketed: true,
      startIndex: index,
      durationMap: this.durationMap,
      voice: tickmap.voice,
      numNotes: this.numNotes
    });
    this.measure.tuplets.push(tuplet);
    return this.tuplet;
  }
}

export interface SmoStretchNoteParams {
  startIndex: number,
  measure: SmoMeasure,
  voice: number,
  newTicks: number
}
/**
 * increase the length of a note, removing future notes in the measure as required
 * @category SmoTransform
 */
export class SmoStretchNoteActor extends TickIteratorBase {
  startIndex: number;
  tickmap: TickMap;
  newTicks: number;
  startTick: number;
  divisor: number;
  durationMap: number[];
  skipFromStart: number;
  skipFromEnd: number;
  measure: SmoMeasure;
  voice: number;
  constructor(params: SmoStretchNoteParams) {
    let mapIx = 0;
    let i = 0;
    super();
    this.startIndex = params.startIndex;
    this.measure = params.measure;
    this.voice = params.voice;
    this.tickmap = this.measure.tickmapForVoice(this.voice);
    this.newTicks = params.newTicks;
    this.startTick = this.tickmap.durationMap[this.startIndex];
    const currentTicks = this.tickmap.deltaMap[this.startIndex];
    const endTick = this.tickmap.durationMap[this.startIndex] + this.newTicks;
    this.divisor = -1;
    this.durationMap = [];
    this.skipFromStart = this.startIndex + 1;
    this.skipFromEnd = this.startIndex + 1;
    this.durationMap.push(this.newTicks);

    mapIx = this.tickmap.durationMap.indexOf(endTick);

    const remaining = this.tickmap.deltaMap.slice(this.startIndex, this.tickmap.durationMap.length).reduce((accum, x) => x + accum);
    if (remaining === this.newTicks) {
      mapIx = this.tickmap.deltaMap.length;
    }

    // If there is no tickable at the end point, try to split the next note
    /**
     *      old map:
     *     d  . d  .
     *     split map:
     *     d  .  d  d
     *     new map:
     *     d .   .  d
     */
    if (mapIx < 0) {
      const ndelta = this.tickmap.deltaMap[this.startIndex + 1];
      const needed = this.newTicks - currentTicks;
      const exp = ndelta / needed;
      // Next tick does not divide evenly into this, or next tick is shorter than this
      if (Math.round(ndelta / exp) - ndelta / exp !== 0 || ndelta < 256) {
        this.durationMap = [];
      } else if (ndelta / exp + this.startTick + this.newTicks <= this.tickmap.totalDuration) {
        this.durationMap.push(ndelta - (ndelta / exp));
      } else {
        // there is no way to do this...
        this.durationMap = [];
      }
    } else {
      // If this note now takes up the space of other notes, remove those notes
      for (i = this.startIndex + 1; i < mapIx; ++i) {
        this.durationMap.push(0);
      }
    }
  }
  static apply(params: SmoStretchNoteParams) {
    const actor = new SmoStretchNoteActor(params);
    SmoTickIterator.iterateOverTicks(actor.measure, actor, actor.voice);
  }
  iterateOverTick(note: SmoNote, tickmap: TickMap, index: number) {
    if (this.durationMap.length === 0) {
      return null;
    }
    if (index >= this.startIndex && index < this.startIndex + this.durationMap.length) {
      const mapIndex = index - this.startIndex;
      const ticks = this.durationMap[mapIndex];
      if (ticks === 0) {
        return [];
      }
      note = SmoNote.cloneWithDuration(note, { numerator: ticks, denominator: 1, remainder: 0 });
      return [note];
    }
    return null;
  }
}
