// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoTuplet}
 * @module /smo/data/tuplet
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoNote, SmoNoteParamsSer, TupletInfo } from './note';
import { SmoMusic } from './music';
import { SmoNoteModifierBase } from './noteModifiers';
import { getId, SmoAttrs, Clef } from './common';
import {SmoMeasure, SmoVoice} from './measure';
import {tuplets} from "vexflow_smoosic/build/esm/types/tests/formatter/tests";


export interface SmoTupletTreeParams {
  tuplet: SmoTuplet
}

export interface SmoTupletTreeParamsSer {
  /**
   * constructor
   */
  ctor: string,
  /**
   * root tuplet
   */
  tuplet: SmoTupletParamsSer
}

export class SmoTupletTree {

  /**
   * root tuplet
   */
  tuplet: SmoTuplet;

  constructor(params: SmoTupletTreeParams) {
    this.tuplet = params.tuplet;
  }

  static syncTupletIds(tupletTrees: SmoTupletTree[], voices: SmoVoice[]) {
    const traverseTupletTree = (parentTuplet: SmoTuplet): void => {
      const notes: SmoNote[] = voices[parentTuplet.voice].notes;
      for (let i = parentTuplet.startIndex; i <= parentTuplet.endIndex; i++) {
        const note: SmoNote = notes[i];
        note.tupletId = parentTuplet.attrs.id;
      }
      for (let i = 0; i < parentTuplet.childrenTuplets.length; i++) {
        const tuplet = parentTuplet.childrenTuplets[i];
        traverseTupletTree(tuplet);
      }
    };

    //traverse tuplet tree
    for (let i = 0; i < tupletTrees.length; i++) {
      const tupletTree: SmoTupletTree = tupletTrees[i];
      traverseTupletTree(tupletTree.tuplet);
    }
  }

  static adjustTupletIndexes(tupletTrees: SmoTupletTree[], voice: number, startTick: number, diff: number) {
    const traverseTupletTree = (parentTuplet: SmoTuplet): void => {
      if (parentTuplet.endIndex >= startTick) {
        parentTuplet.endIndex += diff;
        if(parentTuplet.startIndex > startTick) {
          parentTuplet.startIndex += diff;
        }
      }
      for (let i = 0; i < parentTuplet.childrenTuplets.length; i++) {
        const tuplet = parentTuplet.childrenTuplets[i];
        traverseTupletTree(tuplet);
      } 
    }

    //traverse tuplet tree
    for (let i = 0; i < tupletTrees.length; i++) {
      const tupletTree: SmoTupletTree = tupletTrees[i];
      if (tupletTree.endIndex >= startTick && tupletTree.voice == voice) {
        traverseTupletTree(tupletTree.tuplet);
      }
    }
  }

  static getTupletForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTuplet | null {
    const tuplets = SmoTupletTree.getTupletHierarchyForNoteIndex(tupletTrees, voiceIx, noteIx);
    if(tuplets.length) {
      return tuplets[tuplets.length - 1];
    }
    return null;
  }

  static getTupletTreeForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTupletTree | null {
    for (let i = 0; i < tupletTrees.length; i++) {
      const tupletTree: SmoTupletTree = tupletTrees[i];
      if (tupletTree.startIndex <= noteIx && tupletTree.endIndex >= noteIx && tupletTree.voice == voiceIx) {
        return tupletTree;
      }
    }
    return null;
  }

  // Finds the tuplet hierarchy for a given note index.
  static getTupletHierarchyForNoteIndex(tupletTrees: SmoTupletTree[], voiceIx: number, noteIx: number): SmoTuplet[] {
    let tupletHierarchy: SmoTuplet[] = [];
    const traverseTupletTree = ( parentTuplet: SmoTuplet): void => {      
      tupletHierarchy.push(parentTuplet);
      for (let i = 0; i < parentTuplet.childrenTuplets.length; i++) {
        const tuplet = parentTuplet.childrenTuplets[i];
        if (tuplet.startIndex <= noteIx && tuplet.endIndex >= noteIx) {
          traverseTupletTree(tuplet);
          break;
        }
      } 
    }

    //find tuplet tree
    for (let i = 0; i < tupletTrees.length; i++) {
      const tupletTree: SmoTupletTree = tupletTrees[i];
      if (tupletTree.startIndex <= noteIx && tupletTree.endIndex >= noteIx && tupletTree.voice == voiceIx) {
        traverseTupletTree(tupletTree.tuplet);
        break;
      }
    }

    return tupletHierarchy;
  }

  static removeTupletForNoteIndex(measure: SmoMeasure, voiceIx: number, noteIx: number) {
    for (let i = 0; i < measure.tupletTrees.length; i++) {
      const tupletTree: SmoTupletTree = measure.tupletTrees[i];
      if (tupletTree.startIndex <= noteIx && tupletTree.endIndex >= noteIx && tupletTree.voice == voiceIx) {
        measure.tupletTrees.splice(i, 1);
        break;
      }
    }
  }

  serialize(): SmoTupletTreeParamsSer {
    const params = {
      ctor: 'SmoTupletTree',
      tuplet: this.tuplet.serialize()
    };
    return params;
  }

  static deserialize(jsonObj: SmoTupletTreeParamsSer): SmoTupletTree {
    const tuplet = SmoTuplet.deserialize(jsonObj.tuplet);
    
    return new SmoTupletTree({tuplet: tuplet});
  }

  static clone(tupletTree: SmoTupletTree): SmoTupletTree {
    return SmoTupletTree.deserialize(tupletTree.serialize());
  }

  get startIndex() {
    return this.tuplet.startIndex;
  }

  get endIndex() {
    return this.tuplet.endIndex;
  }

  get voice() {
    return this.tuplet.voice;
  }

  get totalTicks() {
    return this.tuplet.totalTicks;
  }


}

/**
 * Parameters for tuplet construction
 * @param notes - runtime instance of tuplet has an actual instance of 
 * notes.  The note instances are created by the deserilization of the 
 * measure.  We serialize the note parameters so we can identify the correct notes
 * when deserializing.
 * @category SmoParameters
 */
export interface SmoTupletParams {
  numNotes: number,
  notesOccupied: number,
  stemTicks: number,
  totalTicks: number,
  ratioed: boolean,
  bracketed: boolean,
  voice: number,
  startIndex: number,
  endIndex: number,
}
/**
 * serializabl bits of SmoTuplet
 * @category serialization
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
   * numNotes in the tuplet (not necessarily same as notes array size)
   */
  numNotes: number,
  /**
   * 
   */
  notesOccupied: number,
  /**
   * used to decide how to beam, 2048 for 1/4 triplet for instance
   */
  stemTicks: number,
  
  /**
   * total ticks to squeeze numNotes
   */
  totalTicks: number,
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

  startIndex: number,

  endIndex: number,

  parentTuplet: TupletInfo | null,

  childrenTuplets: SmoTupletParamsSer[]
  
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
      numNotes: 3,
      notesOccupied: 2,
      stemTicks: 2048,
      startIndex: 0,
      endIndex: 0,
      totalTicks: 4096, // how many ticks this tuple takes up
      bracketed: true,
      voice: 0,
      ratioed: false
    }));
  }
  attrs: SmoAttrs;
  numNotes: number = 3;
  notesOccupied: number = 2;
  stemTicks: number = 2048;
  totalTicks: number = 4096;
  bracketed: boolean = true;
  voice: number = 0;
  ratioed: boolean = false;
  parentTuplet: TupletInfo | null = null;
  childrenTuplets: SmoTuplet[] = [];
  startIndex: number = 0;
  endIndex: number = 0;

  get clonedParams() {
    const paramAr = ['stemTicks', 'ticks', 'totalTicks',  'numNotes'];
    const rv = {};
    smoSerialize.serializedMerge(paramAr, this, rv);
    return rv;
  }

  static get parameterArray() {
    return ['stemTicks', 'totalTicks', 'startIndex', 'endIndex',
      'attrs', 'ratioed', 'bracketed', 'voice', 'numNotes'];
  }

  serialize(): SmoTupletParamsSer {
    const params: Partial<SmoTupletParamsSer> = {};
    params.ctor = 'SmoTuplet';
    params.childrenTuplets = [];

    smoSerialize.serializedMergeNonDefault(SmoTuplet.defaults, SmoTuplet.parameterArray, this, params);

    this.childrenTuplets.forEach((tuplet) => {
      params.childrenTuplets!.push(tuplet.serialize());
    });
    
    if (!isSmoTupletParamsSer(params)) {
      throw 'bad tuplet ' + JSON.stringify(params);
    }
    return params;
  }

  static deserialize(jsonObj: SmoTupletParamsSer): SmoTuplet {
    const tupJson = SmoTuplet.defaults;
    smoSerialize.serializedMerge(SmoTuplet.parameterArray, jsonObj, tupJson);
    // Legacy schema did not have notesOccupied, we need to calculate it.
    if ((jsonObj as any).notes !== undefined) {
      //todo: notesOccupied can probably be removed
      tupJson.notesOccupied = tupJson.totalTicks / tupJson.stemTicks;
    }

    const tuplet = new SmoTuplet(tupJson);
    tuplet.parentTuplet = jsonObj.parentTuplet ? jsonObj.parentTuplet : null;
    if (jsonObj.childrenTuplets !== undefined) {
      for (let i = 0; i < jsonObj.childrenTuplets.length; i++) {
        const childTuplet = SmoTuplet.deserialize(jsonObj.childrenTuplets[i]);
        tuplet.childrenTuplets.push(childTuplet);
      }
    }
    return tuplet;
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
    const defs = SmoTuplet.defaults;
    this.numNotes = params.numNotes ? params.numNotes : defs.numNotes;
    this.notesOccupied = params.notesOccupied ? params.notesOccupied : defs.notesOccupied;
    this.stemTicks = params.stemTicks ? params.stemTicks : defs.stemTicks;
    this.totalTicks = params.totalTicks ? params.totalTicks : defs.totalTicks;
    this.bracketed = params.bracketed ? params.bracketed : defs.bracketed;
    this.voice = params.voice ? params.voice : defs.voice;
    this.ratioed = params.ratioed ? params.ratioed : defs.ratioed;
    this.startIndex = params.startIndex ? params.startIndex : defs.startIndex;
    this.endIndex = params.endIndex ? params.endIndex : defs.endIndex;
    this.attrs = {
      id: getId().toString(),
      type: 'SmoTuplet'
    };
  }

  static get longestTuplet() {
    return 8192;
  }

  //todo: adjust naming
  get num_notes() {
    return this.numNotes;
  }
  get notes_occupied() {
    return Math.floor(this.totalTicks / this.stemTicks);
  }

  get tickCount() {
    return this.totalTicks;
  }
}
