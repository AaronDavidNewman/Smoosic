// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoSelection, SmoSelector } from './selections';
import { SmoNote, TupletInfo } from '../data/note';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { StaffModifierBase } from '../data/staffModifiers';
import { SmoTuplet } from '../data/tuplet';
import { SmoMusic } from '../data/music';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { SmoScore } from '../data/score';
import { TickMap } from './tickMap';
import { SmoSystemStaff } from '../data/systemStaff';
const VF = eval('Vex.Flow');

interface PasteNote {
  note: SmoNote,
  selector: SmoSelector
}
// ## PasteBuffer
// ### Description:
// Hold some music that can be pasted back to the score
export class PasteBuffer {
  notes: PasteNote[];
  noteIndex: number;
  measures: SmoMeasure[];
  measureIndex: number;
  remainder: number;
  replacementMeasures: SmoSelection[];
  score: SmoScore | null = null;
  tupletNoteMap: Record<string, SmoTuplet> = { };
  modifiers: StaffModifierBase[] = [];
  destination: SmoSelector = SmoSelector.default;
  staffSelectors: SmoSelector[] = [];
  constructor() {
    this.notes = [];
    this.noteIndex = 0;
    this.measures = [];
    this.measureIndex = -1;
    this.remainder = 0;
    this.replacementMeasures = [];
  }

  setSelections(score: SmoScore, selections: SmoSelection[]) {
    this.notes = [];
    this.noteIndex = 0;
    this.score = score;
    if (selections.length < 1) {
      return;
    }
    this.tupletNoteMap = {};
    const first = selections[0];
    const last = selections[selections.length - 1];
    if (!first.note || !last.note) {
      return;
    }

    const startTuplet: SmoTuplet | null = first.measure.getTupletForNote(first.note);
    if (startTuplet) {
      if (startTuplet.getIndexOfNote(first.note) !== 0) {
        return; // can't paste from the middle of a tuplet
      }
    }
    const endTuplet: SmoTuplet | null = last.measure.getTupletForNote(last.note);
    if (endTuplet) {
      if (endTuplet.getIndexOfNote(last.note) !== endTuplet.notes.length - 1) {
        return; // can't paste part of a tuplet.
      }
    }
    this._populateSelectArray(selections);
  }
  // ### _populateSelectArray
  // copy the selected notes into the paste buffer with their original locations.
  _populateSelectArray(selections: SmoSelection[]) {
    let selector: SmoSelector = SmoSelector.default;
    this.modifiers = [];
    selections.forEach((selection) => {
      selector = JSON.parse(JSON.stringify(selection.selector));
      const mod: StaffModifierBase[] = selection.staff.getModifiersAt(selector);
      if (mod.length) {
        mod.forEach((modifier: StaffModifierBase) => {
          const cp: StaffModifierBase = StaffModifierBase.deserialize(modifier.serialize());
          cp.attrs.id = VF.Element.newID();
          this.modifiers.push(cp);
        });
      }
      const isTuplet: boolean = selection?.note?.isTuplet ?? false;
      if (isTuplet) {
        const tuplet = (selection.measure.getTupletForNote(selection.note) as SmoTuplet);
        const index = tuplet.getIndexOfNote(selection.note);
        if (index === 0) {
          const ntuplet = SmoTuplet.cloneTuplet(tuplet);
          this.tupletNoteMap[ntuplet.attrs.id] = ntuplet;
          ntuplet.notes.forEach((nnote) => {
            this.notes.push({ selector, note: nnote });
            selector = JSON.parse(JSON.stringify(selector));
            selector.tick += 1;
          });
        }
      } else if (selection.note) {
        const note = SmoNote.clone(selection.note);
        this.notes.push({ selector, note });
      }
    });
    this.notes.sort((a, b) =>
      SmoSelector.gt(a.selector, b.selector) ? 1 : -1
    );
  }

  clearSelections() {
    this.notes = [];
  }

  _findModifier(selector: SmoSelector) {
    const rv = this.modifiers.filter((mod) => SmoSelector.eq(selector, mod.startSelector));
    return (rv && rv.length) ? rv[0] : null;
  }
  _findPlacedModifier(selector: SmoSelector) {
    const rv = this.modifiers.filter((mod) => SmoSelector.eq(selector, mod.endSelector));
    return (typeof(rv) !== 'undefined' && rv.length) ? rv[0] : null;
  }

  // ### _populateMeasureArray
  // Before pasting, populate an array of existing measures from the paste destination
  // so we know how to place the notes.
  _populateMeasureArray() {
    if (!this.score || !this.destination) {
      return;
    }
    let measureSelection = SmoSelection.measureSelection(this.score, this.destination.staff, this.destination.measure);
    if (!measureSelection) {
      return;
    }
    const measure = measureSelection.measure;
    const tickmap = measure.tickmapForVoice(this.destination.voice);
    let currentDuration = tickmap.durationMap[this.destination.tick];
    this.measures = [];
    this.staffSelectors = [];
    this.measures.push(measure);
    this.notes.forEach((selection: PasteNote) => {
      if (currentDuration + selection.note.tickCount > tickmap.totalDuration && measureSelection !== null) {
        // If this note will overlap the measure boundary, the note will be split in 2 with the
        // remainder going to the next measure.  If they line up exactly, the remainder is 0.
        const remainder = (currentDuration + selection.note.tickCount) - tickmap.totalDuration;
        currentDuration = remainder;

        measureSelection = SmoSelection.measureSelection(this.score as SmoScore,
          measureSelection.selector.staff,
          measureSelection.selector.measure + 1);

        // If the paste buffer overlaps the end of the score, we can't paste (TODO:  add a measure in this case)
        if (measureSelection != null) {
          this.measures.push(measureSelection.measure);
        }
      } else if (measureSelection != null) {
        currentDuration += selection.note.tickCount;
      }
    });
  }

  // ### _populatePre
  // When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.
  _populatePre(voiceIndex: number, measure: SmoMeasure, startTick: number, tickmap: TickMap) {
    const voice: SmoVoice = {
      notes: []
    };
    let i = 0;
    let j = 0;
    let ticksToFill = tickmap.durationMap[startTick];
    // TODO: bug here, need to handle tuplets in pre-part, create new tuplet
    for (i = 0; i < measure.voices[voiceIndex].notes.length; ++i) {
      const note = measure.voices[voiceIndex].notes[i];
      // If this is a tuplet, clone all the notes at once.
      if (note.isTuplet) {
        const tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
          continue;  // we remove the tuplet after first iteration
        }
        const ntuplet: SmoTuplet = SmoTuplet.cloneTuplet(tuplet);
        voice.notes = voice.notes.concat(ntuplet.notes as SmoNote[]);
        measure.removeTupletForNote(note);
        measure.tuplets.push(ntuplet);
        ticksToFill -= tuplet.tickCount;
      } else if (ticksToFill >= note.tickCount) {
        ticksToFill -= note.tickCount;
        voice.notes.push(SmoNote.clone(note));
      } else {
        const duration = note.tickCount - ticksToFill;
        const durMap = SmoMusic.gcdMap(duration);
        for (j = 0; j < durMap.length; ++j) {
          const dd = durMap[j];
          SmoNote.cloneWithDuration(note, {
            numerator: dd,
            denominator: 1,
            remainder: 0
          });
        }
        ticksToFill = 0;
      }
      if (ticksToFill < 1) {
        break;
      }
    }
    return voice;
  }

  // ### _populateVoice
  // ### Description:
  // Create a new voice for a new measure in the paste destination
  _populateVoice(voiceIndex: number): SmoVoice[] {
    this._populateMeasureArray();
    const measures = this.measures;
    let measure = measures[0];
    let tickmap = measure.tickmapForVoice(this.destination.voice);
    let voice = this._populatePre(voiceIndex, measure, this.destination.tick, tickmap);
    let startSelector = JSON.parse(JSON.stringify(this.destination));
    this.measureIndex = 0;
    const measureVoices = [];
    measureVoices.push(voice);
    while (this.measureIndex < measures.length) {
      measure = measures[this.measureIndex];
      tickmap = measure.tickmapForVoice(this.destination.voice);
      this._populateNew(voice, voiceIndex, measure, tickmap, startSelector);
      if (this.noteIndex < this.notes.length && this.measureIndex < measures.length) {
        voice = {
          notes: []
        };
        measureVoices.push(voice);
        startSelector = {
          staff: startSelector.staff,
          measure: startSelector.measure,
          voice: voiceIndex,
          tick: 0
        };
        this.measureIndex += 1;
        startSelector.measure += 1;
      } else {
        break;
      }
    }
    this._populatePost(voice, voiceIndex, measure, tickmap);
    return measureVoices;
  }

  static _countTicks(voice: SmoVoice): number {
    let voiceTicks = 0;
    voice.notes.forEach((note) => {
      voiceTicks += note.tickCount;
    });
    return voiceTicks;
  }

  // ### _populateModifier
  // If the destination contains a modifier start and end, copy and paste it.
  _populateModifier(srcSelector: SmoSelector, destSelector: SmoSelector, staff: SmoSystemStaff) {
    // If this is the ending point of a staff modifier, paste the modifier
    const mod = this._findPlacedModifier(srcSelector);
    if (mod) {
      mod.endSelector = JSON.parse(JSON.stringify(destSelector));
      mod.attrs.id = VF.Element.newID();
      staff.addStaffModifier(mod);
    }
  }

  // ### _populateNew
  // Start copying the paste buffer into the destination by copying the notes and working out
  // the measure overlap
  _populateNew(voice: SmoVoice, voiceIndex: number, measure: SmoMeasure, tickmap: TickMap, startSelector: SmoSelector) {
    let currentDuration = tickmap.durationMap[startSelector.tick];
    let i = 0;
    let j = 0;
    const totalDuration = tickmap.totalDuration;
    while (currentDuration < totalDuration && this.noteIndex < this.notes.length) {
      if (!this.score) {
        return;
      }
      const selection = this.notes[this.noteIndex];
      const note = selection.note;
      this._populateModifier(selection.selector, startSelector, this.score.staves[selection.selector.staff]);
      if (note.isTuplet) {
        const tuplet = this.tupletNoteMap[(note.tuplet as TupletInfo).id];
        const ntuplet = SmoTuplet.cloneTuplet(tuplet);
        this.noteIndex += ntuplet.notes.length;
        startSelector.tick += ntuplet.notes.length;
        currentDuration += tuplet.tickCount;
        for (i = 0; i < ntuplet.notes.length; ++i) {
          const tn = ntuplet.notes[i];
          tn.clef = measure.clef;
          voice.notes.push(tn);
        }
        measure.tuplets.push(ntuplet);
      } else if (currentDuration + note.tickCount <= totalDuration && this.remainder === 0) {
        // The whole note fits in the measure, paste it.
        const nnote = SmoNote.clone(note);
        nnote.clef = measure.clef;
        voice.notes.push(nnote);
        currentDuration += note.tickCount;
        this.noteIndex += 1;
        startSelector.tick += 1;
      } else if (this.remainder > 0) {
        // This is a note that spilled over the last measure
        const nnote = SmoNote.cloneWithDuration(note, {
          numerator: this.remainder,
          denominator: 1,
          remainder: 0
        });
        nnote.clef = measure.clef;
        voice.notes.push(nnote);
        currentDuration += this.remainder;
        this.remainder = 0;
      } else {
        // The note won't fit, so we split it in 2 and paste the remainder in the next measure.
        // TODO:  tie the last note to this one.
        const partial = totalDuration - currentDuration;
        const dar = SmoMusic.gcdMap(partial);
        for (j = 0; j < dar.length; ++j) {
          const ddd = dar[j];
          const vnote = SmoNote.cloneWithDuration(note, {
            numerator: ddd,
            denominator: 1,
            remainder: 0
          });
          voice.notes.push(vnote);
        }
        currentDuration += partial;

        // Set the remaining length of the current note, this will be added to the
        // next measure with the previous note's pitches
        this.remainder = note.tickCount - partial;
      }
    }
  }

  // ### _populatePost
  // When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
  // end of the measure with notes in the existing measure.
  _populatePost(voice: SmoVoice, voiceIndex: number, measure: SmoMeasure, tickmap: TickMap) {
    let startTicks = PasteBuffer._countTicks(voice);
    let existingIndex = 0;
    const totalDuration = tickmap.totalDuration;
    while (startTicks < totalDuration) {
      // Find the point in the music where the paste area runs out, or as close as we can get.
      existingIndex = tickmap.durationMap.indexOf(startTicks);
      existingIndex = (existingIndex < 0) ? measure.voices[voiceIndex].notes.length - 1 : existingIndex;
      const note = measure.voices[voiceIndex].notes[existingIndex];
      if (note.isTuplet) {
        const tuplet = measure.getTupletForNote(note) as SmoTuplet;
        const ntuplet = SmoTuplet.cloneTuplet(tuplet);
        startTicks += tuplet.tickCount;
        voice.notes = voice.notes.concat(ntuplet.notes);
        measure.tuplets.push(ntuplet);
        measure.removeTupletForNote(note);
      } else {
        const ticksLeft = totalDuration - startTicks;
        if (ticksLeft >= note.tickCount) {
          startTicks += note.tickCount;
          voice.notes.push(SmoNote.clone(note));
        } else {
          const remainder = totalDuration - startTicks;
          voice.notes.push(SmoNote.cloneWithDuration(note, {
            numerator: remainder,
            denominator: 1,
            remainder: 0
          }));
          startTicks = totalDuration;
        }
      }
    }
  }

  _pasteVoiceSer(ser: any, vobj: any, voiceIx: number) {
    const voices: any[] = [];
    let ix = 0;
    ser.voices.forEach((vc: any) => {
      if (ix !== voiceIx) {
        voices.push(vc);
      } else {
        voices.push(vobj);
      }
      ix += 1;
    });
    ser.voices = voices;
  }

  pasteSelections(score: SmoScore, selector: SmoSelector) {
    let i = 0;
    this.destination = selector;
    if (this.notes.length < 1) {
      return;
    }
    if (!this.score) {
      return;
    }
    this.noteIndex = 0;
    this.measureIndex = -1;
    this.remainder = 0;
    const voices = this._populateVoice(this.destination.voice);
    const measureSel = JSON.parse(JSON.stringify(this.destination));
    const selectors: SmoSelector[] = [];
    for (i = 0; i < this.measures.length && i < voices.length; ++i) {
      const measure: SmoMeasure = this.measures[i];
      const nvoice: SmoVoice = voices[i];
      const ser: any = measure.serialize();
      // deserialize column-mapped attributes, these are not normally serialized
      // since they are mapped to measures on a delta basis.
      SmoMeasure.columnMappedAttributes.forEach((attr: string | number) => {
        const obj: any = (measure as any)[attr];
        if (typeof(obj) === 'string') {
          ser[attr] = obj;
        } else if (typeof(obj) === 'object') {
          if (obj.ctor) {
            ser[attr] = obj.serialize();
          }
        }
      });
      const vobj: any = {
        notes: []
      };
      nvoice.notes.forEach((note: SmoNote) => {
        vobj.notes.push(note.serialize());
      });

      // TODO: figure out how to do this with multiple voices
      this._pasteVoiceSer(ser, vobj, this.destination.voice);
      const nmeasure = SmoMeasure.deserialize(ser);
      // If this is the non-display buffer, don't try to reset the display rectangles.
      // Q: Is this even required since we are going to re-render?
      // A: yes, because until we do, the replaced measure needs the formatting info
      if (measure.svg.renderedBox && measure.svg.logicalBox.width > 0) {
        nmeasure.svg.renderedBox = SvgHelpers.smoBox(measure.svg.renderedBox);
        nmeasure.setBox(SvgHelpers.smoBox(measure.svg.logicalBox), 'copypaste');
        nmeasure.setX(measure.svg.logicalBox.x, 'copyPaste');
        nmeasure.setWidth(measure.svg.logicalBox.width, 'copypaste');
        nmeasure.setY(measure.svg.logicalBox.y, 'copypaste');
      }
      ['forceClef', 'forceKeySignature', 'forceTimeSignature', 'forceTempo'].forEach((flag) => {
        (nmeasure as any)[flag] = (measure.svg as any)[flag];
      });
      this.score.replaceMeasure(measureSel, nmeasure);
      measureSel.measure += 1;
      selectors.push(
        { staff: selector.staff, measure: nmeasure.measureNumber.measureIndex, voice: 0, tick: 0, pitches: [] }
      );
    }
    this.replacementMeasures = [];
    selectors.forEach((selector: SmoSelector) => {
      const nsel: SmoSelection | null = SmoSelection.measureSelection(this.score as SmoScore, selector.staff, selector.measure);
      if (nsel) {
        this.replacementMeasures.push(nsel);
      }
    });
  }
}