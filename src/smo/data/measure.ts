// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Contains definition and supporting classes for {@link SmoMeasure}.
 * Most of the engraving is done at the measure level.  Measure contains multiple (at least 1)
 * voices, which in turn contain notes.  Each measure also contains formatting information.  This
 * is mostly serialized outside of measure (in score), since columns and often an entire region
 * share measure formatting.  Measures also contain modifiers like barlines.  Tuplets and beam groups
 * are contained at the measure level.
 * @module /smo/data/measure
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMusic } from './music';
import {
  SmoBarline, SmoMeasureModifierBase, SmoRepeatSymbol, SmoTempoText, SmoMeasureFormat,
  SmoVolta, SmoRehearsalMarkParams, SmoRehearsalMark, SmoTempoTextParams, TimeSignature,
  TimeSignatureParametersSer, SmoMeasureFormatParamsSer, SmoTempoTextParamsSer
} from './measureModifiers';
import { SmoNote, NoteType, SmoNoteParamsSer } from './note';
import { SmoTuplet, SmoTupletParamsSer, SmoTupletParams, SmoTupletTreeParamsSer, SmoTupletTree } from './tuplet';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { TickMap } from '../xform/tickMap';
import { MeasureNumber, SvgBox, SmoAttrs, Pitch, PitchLetter, Clef, 
  TickAccidental, AccidentalArray, getId } from './common';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';
/**
 * Voice is just a container for {@link SmoNote}
 */
export interface SmoVoice {
  notes: SmoNote[]
}

export interface SmoVoiceSer {
  notes: SmoNoteParamsSer[]
}
/**
 * TickMappable breaks up a circular dependency on modifiers
 * like @SmoDuration
 */
export interface TickMappable {
  voices: SmoVoice[],
  keySignature: string
}

export interface MeasureTick {
  voiceIndex: number,
  tickIndex: number
}

/**
 * Break up a circlar dependency with {@link SmoBeamGroup}
 */
export interface ISmoBeamGroup {
  notes: SmoNote[],
  voice: number,
  attrs: SmoAttrs
}
/**
 * geometry information about the current measure for rendering and
 * score layout.
 * @internal
 */
export interface MeasureSvg {
  staffWidth: number,
  unjustifiedWidth: number,
  adjX: number, // The start point of the music in the stave (after time sig, etc)
  maxColumnStartX: number,
  staffX: number, // The left-most x position of the staff
  staffY: number,
  logicalBox: SvgBox,
  yTop: number,
  adjRight: number,
  history: string[],
  lineIndex: number,
  pageIndex: number,
  rowInSystem: number,
  forceClef: boolean,
  forceKeySignature: boolean,
  forceTimeSignature: boolean,
  forceTempo: boolean,
  hideEmptyMeasure: boolean,
  hideMultimeasure: boolean,
  multimeasureLength: number,
  multimeasureEndBarline: number,
  element: SVGSVGElement | null
}

/**
 * Interface for a  {@link TickMap} for each voice
 * for formatting
 */
export interface MeasureTickmaps {
  tickmaps: TickMap[],
  accidentalMap: Record<string | number, Record<string, TickAccidental>>,
  accidentalArray: AccidentalArray[]
}
/**
 * Column-mapped modifiers, managed by the {@link SmoScore}
 */
export interface ColumnMappedParams {
  // ['timeSignature', 'keySignature', 'tempo']
  timeSignature: any,
  keySignature: string,
  tempo: any
}
// @internal
export type SmoMeasureNumberParam = 'transposeIndex' | 'activeVoice' | 'lines' | 'repeatCount';
// @internal
export const SmoMeasureNumberParams: SmoMeasureNumberParam[] = ['transposeIndex', 'activeVoice', 'lines', 'repeatCount'];
// @internal
export type SmoMeasureStringParam = 'keySignature';
// @internal
export const SmoMeasureStringParams: SmoMeasureStringParam[] = ['keySignature'];
/**
 * constructor parameters for a {@link SmoMeasure}.  Usually you will call
 * {@link SmoMeasure.defaults}, and modify the parameters you need to change.
 *
 * @param timeSignature
 * @param keySignature
 * @param tuplets
 * @param transposeIndex calculated from {@link SmoPartInfo} for non-concert-key instruments
 * @param lines number of lines in the stave
 * @param staffY Y coordinate (UL corner) of the measure stave
 * @param measureNumber combination configured/calculated measure number
 * @param clef
 * @param voices
 * @param activeVoice the active voice in the editor
 * @param tempo
 * @param format measure format, is managed by the score
 * @param modifiers All measure modifiers that5 aren't format, timeSignature or tempo
 * @category SmoParameters
 */
export interface SmoMeasureParams {
  timeSignature: TimeSignature,
  keySignature: string,
  tupletTrees: SmoTupletTree[],
  transposeIndex: number,
  lines: number,
  staffY: number,
  // bars: [1, 1], // follows enumeration in VF.Barline
  measureNumber: MeasureNumber,
  clef: Clef,
  voices: SmoVoice[],
  activeVoice: number,
  tempo: SmoTempoText,
  format: SmoMeasureFormat | null,
  modifiers: SmoMeasureModifierBase[],
  repeatSymbol: boolean,
  repeatCount: number
}

/**
 * The serializeable bits of SmoMeasure.  Some parameters are 
 * mapped by the stave if the don't change every measure, e.g.
 * time signature.
 * @category serialization
 */
export interface SmoMeasureParamsSer {
  /**
   * constructor
   */
  ctor: string,
  /**
   * id of the measure
   */
  attrs: SmoAttrs,
  /**
   * time signature serialization
   */
  timeSignature?: TimeSignatureParametersSer,
  /**
   * key signature
   */
  keySignature?: string,
  /**
   * a list of tuplets (serialized)
   */
  tupletTrees: SmoTupletTreeParamsSer[],
  /**
   * transpose the notes up/down.  TODO: this should not be serialized
   * as its part of the instrument parameters
   */
  transposeIndex: number,
  /**
   * lines in the staff (e.g. percussion)
   */
  lines: number,
  /**
   * y coordinate of stave. TODO:  this should not be serialized
   *  since it is calculated as part of layout
   */
  staffY: number,
  /**
   * measure number, absolute and relative/remapped
   */
  measureNumber: MeasureNumber,
  /**
   * start clef
   */
  clef: Clef,
  /**
   * voices contain notes
   */
  voices: SmoVoiceSer[],
  /**
   * tempo at this point
   */
  tempo: SmoTempoTextParamsSer,
  /**
   * format customizations
   */
  format: SmoMeasureFormatParamsSer | null,
  /**
   * all other modifiers (barlines, etc)
   */
  modifiers: SmoMeasureModifierBase[]
}

/**
 * Only arrays and measure numbers are serilialized with default values.
 * @param params - result of serialization
 * @returns 
 */
function isSmoMeasureParamsSer(params: Partial<SmoMeasureParamsSer>):params is SmoMeasureParamsSer {
  if (!Array.isArray(params.voices) || 
      !Array.isArray(params.tupletTrees) || !Array.isArray(params.modifiers) ||
      typeof(params?.measureNumber?.measureIndex) !== 'number') {
        return false;
  }
  return true;
}
/**
 * Data for a measure of music.  Many rules of musical engraving are
 * enforced at a measure level: the duration of notes, accidentals, etc.
 * 
 * Measures contain {@link SmoNote}, {@link SmoTuplet}, and {@link SmoBeamGroup}
 * Measures are contained in {@link SmoSystemStaff}
 * @category SmoObject
 */
export class SmoMeasure implements SmoMeasureParams, TickMappable {
  static get timeSignatureDefault(): TimeSignature {
    return new TimeSignature(TimeSignature.defaults);
  }
  static defaultDupleDuration: number = 4096;
  static defaultTripleDuration: number = 2048 * 3;
  // @internal
  static readonly _defaults: SmoMeasureParams = {
    timeSignature: SmoMeasure.timeSignatureDefault,
    keySignature: 'C',
    tupletTrees: [],
    transposeIndex: 0,
    modifiers: [],
    staffY: 40,
    // bars: [1, 1], // follows enumeration in VF.Barline
    measureNumber: {
      localIndex: 0,
      systemIndex: 0,
      measureIndex: 0,
      staffId: 0
    },
    clef: 'treble',
    lines: 5,
    voices: [],
    format: new SmoMeasureFormat(SmoMeasureFormat.defaults),
    activeVoice: 0,
    tempo: new SmoTempoText(SmoTempoText.defaults),
    repeatSymbol: false,
    repeatCount: 0  
  }

  /**
   * Default constructor parameters.  Defaults are always copied so the
   * caller can modify them to create a new measure.
   * @returns constructor params for a new measure
   */
  static get defaults(): SmoMeasureParams {
    const proto: any = JSON.parse(JSON.stringify(SmoMeasure._defaults));
    proto.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
    proto.tempo = new SmoTempoText(SmoTempoText.defaults);
    proto.modifiers.push(new SmoBarline({
      position: SmoBarline.positions.start,
      barline: SmoBarline.barlines.singleBar
    }));
    proto.modifiers.push(new SmoBarline({
      position: SmoBarline.positions.end,
      barline: SmoBarline.barlines.singleBar
    }));
    return proto;
  }
  // @ignore
  static convertLegacyTimeSignature(ts: string) {
    const rv = new TimeSignature(TimeSignature.defaults);
    rv.timeSignature = ts;
    return rv;
  }
  timeSignature: TimeSignature = SmoMeasure.timeSignatureDefault;
  /**
   * Overrides display of actual time signature, in the case of
   * pick-up notes where the actual and displayed durations are different
   */
  keySignature: string = '';
  canceledKeySignature: string = '';
  tupletTrees: SmoTupletTree[] = [];
  repeatSymbol: boolean = false;
  repeatCount: number = 0;
  /**
   * Adjust for non-concert pitch intstruments
   */
  transposeIndex: number = 0;
  modifiers: SmoMeasureModifierBase[] = [];
  /**
   * Row, column, and custom numbering information about this measure.
   */
  measureNumber: MeasureNumber = {
    localIndex: 0,
    systemIndex: 0,
    measureIndex: 0,
    staffId: 0
  };
  clef: Clef = 'treble';
  voices: SmoVoice[] = [];
  /**
   * the active voice in the editor, if there are multiple voices
   *  */
  activeVoice: number = 0;
  tempo: SmoTempoText;
  beamGroups: ISmoBeamGroup[] = [];
  lines: number = 5;
  /**
   * Runtime information about rendering
   */
  svg: MeasureSvg;
  /**
   * Measure-specific formatting parameters.
   */
  format: SmoMeasureFormat;
  /**
   * Information for identifying this object
   */
  attrs: SmoAttrs;

  /**
   * Fill in components.  We assume the modifiers are already constructed,
   * e.g. by deserialize or the calling function.
   * @param params
   */
  constructor(params: SmoMeasureParams) {
    this.tempo = new SmoTempoText(SmoTempoText.defaults);
    this.svg = {
      staffWidth: 0,
      unjustifiedWidth: 0,
      staffX: 0,
      staffY: 0,
      logicalBox: {
        x: 0, y: 0, width: 0, height: 0
      },
      yTop: 0,
      adjX: 0,
      maxColumnStartX: 0,
      adjRight: 0,
      history: [],
      lineIndex: 0,
      pageIndex: 0,
      rowInSystem: 0,
      forceClef: false,
      forceKeySignature: false,
      forceTimeSignature: false,
      forceTempo: false,
      hideEmptyMeasure: false,
      hideMultimeasure: false,
      multimeasureLength: 0,
      multimeasureEndBarline: SmoBarline.barlines['singleBar'],
      element: null
    };

    const defaults = SmoMeasure.defaults;
    SmoMeasureNumberParams.forEach((param) => {
      if (typeof (params[param]) !== 'undefined') {
        this[param] = params[param];
      }
    });
    SmoMeasureStringParams.forEach((param) => {
      this[param] = params[param] ? params[param] : defaults[param];
    });
    this.clef = params.clef;
    this.repeatSymbol = params.repeatSymbol;
    this.measureNumber = JSON.parse(JSON.stringify(params.measureNumber));
    if (params.tempo) {
      this.tempo = new SmoTempoText(params.tempo);
    }
    // Handle legacy time signature format
    if (params.timeSignature) {
      const tsAny = params.timeSignature as any;
      if (typeof (tsAny) === 'string') {
        this.timeSignature = SmoMeasure.convertLegacyTimeSignature(tsAny);
      } else {
        this.timeSignature = TimeSignature.createFromPartial(tsAny);
      }
    }
    this.voices = params.voices ? params.voices : [];
    this.tupletTrees = params.tupletTrees ? params.tupletTrees : [];
    this.modifiers = params.modifiers ? params.modifiers : defaults.modifiers;
    this.setDefaultBarlines();
    this.keySignature = SmoMusic.vexKeySigWithOffset(this.keySignature, this.transposeIndex);

    if (!(params.format)) {
      this.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
      this.format.measureIndex = this.measureNumber.measureIndex;
    } else {
      this.format = new SmoMeasureFormat(params.format);
    }
    this.attrs = {
      id: getId().toString(),
      type: 'SmoMeasure'
    };
    this.updateClefChangeNotes();
  }

  // @internal
  // used for serialization
  static get defaultAttributes() {
    return [
      'keySignature', 
      'measureNumber',
      'activeVoice', 'clef', 'transposeIndex',
      'format', 'rightMargin', 'lines', 'repeatSymbol', 'repeatCount'
    ];
  }

  // @internal
  // used for serialization
  static get formattingOptions() {
    return ['customStretch', 'customProportion', 'autoJustify', 'systemBreak',
      'pageBreak', 'padLeft'];
  }
  // @internal
  // used for serialization
  static get columnMappedAttributes() {
    return ['timeSignature', 'keySignature', 'tempo'];
  }
  static get serializableAttributes() {
    const rv: any = [];
    SmoMeasure.defaultAttributes.forEach((attr) => {
      if (SmoMeasure.columnMappedAttributes.indexOf(attr) < 0) {
        rv.push(attr);
      }
    });
    return rv;
  }
  /**
  // Return true if the time signatures are the same, for display purposes (e.g. if a time sig change
  // is required)
  */
  static timeSigEqual(o1: TimeSignature, o2: TimeSignature) {
    return o1.timeSignature === o2.timeSignature && o1.useSymbol === o2.useSymbol;
  }
  /**
   * If there is a clef change mid-measure, update the actual clefs of the notes
   * so they display correctly.
   */
  updateClefChangeNotes() {
    let changed = false;
    let curTick = 0;
    let clefChange = this.clef;
    for (var i = 0; i < this.voices.length; ++i) {
      const voice = this.voices[i];
      curTick  = 0;
      for (var j = 0; j < voice.notes.length; ++j) {
        const smoNote = voice.notes[j];
        smoNote.clef = this.clef;
        if (smoNote.clefNote && smoNote.clefNote.clef !== this.clef) {
          clefChange = smoNote.clefNote.clef;
          curTick += smoNote.tickCount;
          changed = true;
          break;
        }
        curTick  += smoNote.tickCount;
      }
      if (changed) {
        break;
      }
    }
    if (!changed) {
      return;
    }
    // clefChangeTick is where the change goes.  We only support
    // one per measure, others are ignored.
    const clefChangeTick = curTick;

    for (var i = 0; i < this.voices.length; ++i) {
      const voice = this.voices[i];
      curTick  = 0;
      for (var j = 0; j < voice.notes.length; ++j) {
        const smoNote = voice.notes[j];
        const noteTicks = smoNote.tickCount;
        if (curTick + noteTicks >= clefChangeTick) {
          smoNote.clef = clefChange;
        }
        // Remove any redundant clef changes later in the measure
        if (curTick + noteTicks > clefChangeTick) {
          if (smoNote.clefNote && smoNote.clefNote.clef === clefChange) {
            smoNote.clefNote = null;
          }
        }
        curTick += noteTicks;
      }
    }
  }
  /**
   * @internal
   * @returns column mapped parameters, serialized.  caller will
   * decide if the parameters need to be persisted
   */
  serializeColumnMapped(): ColumnMappedParams {
    //
    return {
      timeSignature: this.timeSignature.serialize(),
      keySignature: this.keySignature,
      tempo: this.tempo.serialize()
    };
  }

  /**
   * Convert this measure object to a JSON object, recursively serializing all the notes,
   * note modifiers, etc.
   */
  serialize(): SmoMeasureParamsSer {
    const params: Partial<SmoMeasureParamsSer> = {};
    let ser = true;
    smoSerialize.serializedMergeNonDefault(SmoMeasure.defaults, SmoMeasure.serializableAttributes, this, params);
    // measure number can't be defaulted b/c tempos etc. can map to default measure
    params.measureNumber = JSON.parse(JSON.stringify(this.measureNumber));
    params.tupletTrees = [];
    params.voices = [];
    params.modifiers = [];

    this.tupletTrees.forEach((tupletTree) => {
      params.tupletTrees!.push(tupletTree.serialize());
    });

    this.voices.forEach((voice) => {
      const obj: any = {

        notes: []
      };
      voice.notes.forEach((note) => {
        obj.notes.push(note.serialize());
      });
      params.voices!.push(obj);
    });

    this.modifiers.forEach((modifier) => {
      ser = true;
      /* don't serialize default modifiers */
      if (modifier.ctor === 'SmoBarline' && (modifier as SmoBarline).position === SmoBarline.positions.start &&
        (modifier as SmoBarline).barline === SmoBarline.barlines.singleBar) {
        ser = false;
      } else if (modifier.ctor === 'SmoBarline' && (modifier as SmoBarline).position === SmoBarline.positions.end
        && (modifier as SmoBarline).barline === SmoBarline.barlines.singleBar) {
        ser = false;
      } else if (modifier.ctor === 'SmoTempoText') {
        // we don't save tempo text as a modifier anymore
        ser = false;
      } else if ((modifier as SmoRepeatSymbol).ctor === 'SmoRepeatSymbol' && (modifier as SmoRepeatSymbol).position === SmoRepeatSymbol.positions.start
        && (modifier as SmoRepeatSymbol).symbol === SmoRepeatSymbol.symbols.None) {
        ser = false;
      }
      if (ser) {
        params.modifiers!.push(modifier.serialize());
      }
    });
    // ['timeSignature', 'keySignature', 'tempo']
    if (!isSmoMeasureParamsSer(params)) {
      throw 'invalid measure';
    }
    return params;
  }

  /**
   * restore a serialized measure object.  Usually called as part of deserializing a score,
   * but can also be used to restore a measure due to an undo operation.  Recursively
   * deserialize all the notes and modifiers to construct a new measure.
   * @param jsonObj the serialized SmoMeasure
   * @returns
   */
  static deserialize(jsonObj: SmoMeasureParamsSer): SmoMeasure {
    let j = 0;
    let i = 0;
    const voices: SmoVoice[] = [];
    for (j = 0; j < jsonObj.voices.length; ++j) {
      const voice = jsonObj.voices[j];
      const notes: SmoNote[] = [];
      voices.push({
        notes
      });
      for (i = 0; i < voice.notes.length; ++i) {
        const noteParams = voice.notes[i];
        const smoNote = SmoNote.deserialize(noteParams);
        notes.push(smoNote);
      }
    }

    const modifiers: SmoMeasureModifierBase[] = [];
    jsonObj.modifiers.forEach((modParams: any) => {
      const modifier: SmoMeasureModifierBase = SmoMeasureModifierBase.deserialize(modParams);
      modifiers.push(modifier);
    });
    const params: SmoMeasureParams = SmoMeasure.defaults;
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, jsonObj, params);

    // explode column-mapped
    if (jsonObj.tempo) {
      params.tempo = SmoTempoText.deserialize(jsonObj.tempo);
    } else {
      params.tempo = new SmoTempoText(SmoTempoText.defaults);
    }

    // timeSignatureString is now part of timeSignature.  upconvert old scores
    let timeSignatureString = '';
    const jsonLegacy = (jsonObj as any);
    if (typeof(jsonLegacy.timeSignatureString) === 'string' && jsonLegacy.timeSignatureString.length > 0) {
      timeSignatureString = jsonLegacy.timeSignatureString;
    }
    if (jsonObj.timeSignature) {
      if (timeSignatureString.length) {
        jsonObj.timeSignature.displayString = timeSignatureString;  
      }
      params.timeSignature = TimeSignature.deserialize(jsonObj.timeSignature);
    } else {
      const tparams = TimeSignature.defaults;
      if (timeSignatureString.length) {
        tparams.displayString = timeSignatureString;
      }
      params.timeSignature = new TimeSignature(tparams);
    }
    params.keySignature = jsonObj.keySignature ?? 'C';
    params.voices = voices;
    // params.tupletTrees = tuplets;
    params.modifiers = modifiers;
    const measure = new SmoMeasure(params);
    // Handle migration for measure-mapped parameters
    measure.modifiers.forEach((mod) => {
      if (mod.ctor === 'SmoTempoText') {
        measure.tempo = (mod as SmoTempoText);
      }
    });
    if (!measure.tempo) {
      measure.tempo = new SmoTempoText(SmoTempoText.defaults);
    }

    for (j = 0; j < jsonObj.tupletTrees.length; ++j) {
      const tupletTreeJson = jsonObj.tupletTrees[j];
      const tupletTree = SmoTupletTree.deserialize(tupletTreeJson);
      measure.tupletTrees.push(tupletTree);
    }

    //deserialization of a legacy tuplets
    //legacy schema had measure.tuplets, it is measure.tupletTrees now
    if ((jsonObj as any).tuplets !== undefined) {
      for (j = 0; j < (jsonObj as any).tuplets.length; ++j) {
        const tupJson = (jsonObj as any).tuplets[j];
        const tuplet: SmoTuplet = SmoTuplet.deserialize(tupJson);
        const tupletTree: SmoTupletTree = new SmoTupletTree({tuplet: tuplet});
        measure.tupletTrees.push(tupletTree);
      }
    }

    return measure;
  }

  static clone(measure: SmoMeasure): SmoMeasure {
    return SmoMeasure.deserialize(measure.serialize());
  }

  /**
   * When creating a new measure, the 'default' settings can vary depending on
   * what comes before/after the measure.  This determines the default pitch
   * for a clef (appears on 3rd line)
   */
  static get defaultPitchForClef(): Record<Clef, Pitch> {
    return {
      'treble': {
        letter: 'b',
        accidental: 'n',
        octave: 4
      },
      'bass': {
        letter: 'd',
        accidental: 'n',
        octave: 3
      },
      'tenor': {
        letter: 'a',
        accidental: 'n',
        octave: 3
      },
      'alto': {
        letter: 'c',
        accidental: 'n',
        octave: 4
      },
      'soprano': {
        letter: 'b',
        accidental: 'n',
        octave: 4
      },
      'percussion': {
        letter: 'b',
        accidental: 'n',
        octave: 4
      },
      'mezzo-soprano': {
        letter: 'b',
        accidental: 'n',
        octave: 4
      },
      'baritone-c': {
        letter: 'b',
        accidental: 'n',
        octave: 3
      },
      'baritone-f': {
        letter: 'e',
        accidental: 'n',
        octave: 3
      },
      'subbass': {
        letter: 'd',
        accidental: '',
        octave: 2
      },
      'french': {
        letter: 'b',
        accidental: '',
        octave: 4
      } // no idea
    };
  }
  static _emptyMeasureNoteType: NoteType = 'r';
  static set emptyMeasureNoteType(tt: NoteType) {
    SmoMeasure._emptyMeasureNoteType = tt;
  }
  static get emptyMeasureNoteType(): NoteType {
    return SmoMeasure._emptyMeasureNoteType;
  }
  static timeSignatureNotes(timeSignature: TimeSignature, clef: Clef) {
    const pitch = SmoMeasure.defaultPitchForClef[clef];
    const maxTicks = SmoMusic.timeSignatureToTicks(timeSignature.timeSignature);
    const noteTick = 8192 / (timeSignature.beatDuration / 2);
    let ticks = 0;
    const pnotes: SmoNote[] = [];
    while (ticks < maxTicks) {
      const nextNote = SmoNote.defaults;
      nextNote.pitches = [JSON.parse(JSON.stringify(pitch))];
      nextNote.noteType = 'r';
      nextNote.clef = clef;
      nextNote.ticks.numerator = noteTick;
      nextNote.stemTicks = noteTick;
      pnotes.push(new SmoNote(nextNote));
      ticks += noteTick;
    }
    if (timeSignature.beatDuration === 8 && (timeSignature.actualBeats % 3 === 0 || timeSignature.actualBeats % 2 !== 0)) {
      let ix = 0;
      pnotes.forEach((pnote) => {
        if ((ix + 1) % 3 === 0) {
          pnote.endBeam = true;
        }
        pnote.beamBeats = 2048 * 3;
        ix += 1;
      });
    }
    return pnotes;
  }
  /**
   * Get a measure full of default notes for a given timeSignature/clef.
   * returns 8th notes for triple-time meters, etc.
   * @param params 
   * @returns 
   */
  static getDefaultNotes(params: SmoMeasureParams): SmoNote[] {
    return SmoMeasure.timeSignatureNotes(new TimeSignature(params.timeSignature), params.clef);
  }

  /**
   * When creating a new measure, the 'default' settings can vary depending on
   * what comes before/after the measure.  This determines the defaults from the
   * parameters that are passed in, which could be another measure in the score.
   * This version returns params with no notes, for callers that want to use their own notes.
   * If you want the default notes, see {@link getDefaultMeasureWithNotes}
   * 
   * @param params
   * @returns 
   */
  static getDefaultMeasure(params: SmoMeasureParams): SmoMeasure {
    const obj: any = {};
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, SmoMeasure.defaults, obj);
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, params, obj);
    // Don't copy column-formatting options to new measure in new column
    smoSerialize.serializedMerge(SmoMeasure.formattingOptions, SmoMeasure.defaults, obj);
    obj.timeSignature = new TimeSignature(params.timeSignature);
    // The measure expects to get concert KS in constructor and adjust for instrument.  So do the
    // opposite.
    obj.keySignature = SmoMusic.vexKeySigWithOffset(obj.keySignature, -1 * obj.transposeIndex);
    // Don't redisplay tempo for a new measure
    const rv = new SmoMeasure(obj);
    if (rv.tempo && rv.tempo.display) {
      rv.tempo.display = false;
    }
    return rv;
  }

  /**
   * When creating a new measure, the 'default' settings can vary depending on
   * what comes before/after the measure.  This determines the defaults from the
   * parameters that are passed in, which could be another measure in the score.
   * 
   * @param params 
   * @returns 
   */
  static getDefaultMeasureWithNotes(params: SmoMeasureParams): SmoMeasure {
    var measure = SmoMeasure.getDefaultMeasure(params);
    measure.voices.push({
      notes: SmoMeasure.getDefaultNotes(params)
    });
    // fix a bug.
    // new measures only have 1 voice, make sure active voice is 0
    measure.activeVoice = 0;
    return measure;
  }
  /**
   * used by xml export 
   * @internal
   * @param val 
   */
  getForceSystemBreak() {
    return this.format.systemBreak;
  }
  // @internal
  setDefaultBarlines() {
    if (!this.getStartBarline()) {
      this.modifiers.push(new SmoBarline({
        position: SmoBarline.positions.start,
        barline: SmoBarline.barlines.singleBar
      }));
    }
    if (!this.getEndBarline()) {
      this.modifiers.push(new SmoBarline({
        position: SmoBarline.positions.end,
        barline: SmoBarline.barlines.singleBar
      }));
    }
  }

  get containsSound(): boolean {
    let i = 0;
    for (i = 0; i < this.voices.length; ++i) {
      let j = 0;
      const voice = this.voices[i];
      for (j = 0; j < this.voices.length; ++j) {
        if (voice.notes[j].noteType === 'n') {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * The rendered width of the measure, or estimate of same
   */
  get staffWidth() {
    return this.svg.staffWidth;
  }

  /**
   * set the rendered width of the measure, or estimate of same
   */
  setWidth(width: number, description: string) {
    if (layoutDebug.flagSet(layoutDebug.values.measureHistory)) {
      this.svg.history.push('setWidth ' + this.staffWidth + '=> ' + width + ' ' + description);
    }
    if (isNaN(width)) {
      throw ('NAN in setWidth');
    }
    this.svg.staffWidth = width;
  }

  /**
   * Get rendered or estimated start x
   */
  get staffX(): number {
    return this.svg.staffX;
  }

  /**
   * Set rendered or estimated start x
   */
  setX(x: number, description: string) {
    if (isNaN(x)) {
      throw ('NAN in setX');
    }
    layoutDebug.measureHistory(this, 'staffX', x, description);
    this.svg.staffX = Math.round(x);
  }
  /**
   * todo nenad: adjust implementation
   * A time signature has possibly changed.  add/remove notes to
   * match the new length
   */
  alignNotesWithTimeSignature() {
    // const tsTicks = SmoMusic.timeSignatureToTicks(this.timeSignature.timeSignature);
    // if (tsTicks === this.getMaxTicksVoice()) {
    //   return;
    // }
    // const replaceNoteWithDuration = (target: number, ar: SmoNote[], note: SmoNote) => {
    //   const fitNote = new SmoNote(SmoNote.defaults);
    //   const duration = SmoMusic.closestDurationTickLtEq(target);
    //   if (duration > 128) {
    //     fitNote.ticks = { numerator: duration, denominator: 1, remainder: 0 };
    //     fitNote.pitches = note.pitches;
    //     fitNote.noteType = note.noteType;
    //     fitNote.clef = note.clef;
    //     ar.push(fitNote);
    //   }
    // }
    // const voices: SmoVoice[] = [];
    // const tuplets: SmoTuplet[] = [];
    // for (var i = 0; i < this.voices.length; ++i) {
    //   const voice = this.voices[i];
    //   const newNotes: SmoNote[] = [];
    //   let voiceTicks = 0;
    //   for (var j = 0; j < voice.notes.length; ++j) {
    //     const note = voice.notes[j];
    //     // if a tuplet, make sure the whole tuplet fits.
    //     if (note.isTuplet) {
    //       const tuplet = this.getTupletForNote(note);
    //       if (tuplet) {
    //         // remaining notes of an approved tuplet, just add them
    //         if (tuplet.startIndex !== j) {
    //           newNotes.push(note);
    //           continue;
    //         }
    //         else if (tuplet.tickCount + voiceTicks <= tsTicks) {
    //           // first note of the tuplet, it fits, add it
    //           voiceTicks += tuplet.tickCount;
    //           newNotes.push(note);
    //           tuplets.push(tuplet);
    //         } else {
    //           // tuplet will not fit.  Make a note as close to remainder as possible and add it
    //           replaceNoteWithDuration(tsTicks - voiceTicks, newNotes, note);
    //           voiceTicks = tsTicks;
    //           break;
    //         }
    //       } else { // missing tuplet, now what?
    //         console.warn('missing tuplet info');
    //         replaceNoteWithDuration(tsTicks - voiceTicks, newNotes, note);
    //         voiceTicks = tsTicks;
    //       }
    //     } else {
    //       if (note.tickCount + voiceTicks <= tsTicks) {
    //         newNotes.push(note);
    //         voiceTicks += note.tickCount;
    //       } else {
    //         replaceNoteWithDuration(tsTicks - voiceTicks, newNotes, note);
    //         voiceTicks = tsTicks;
    //         break;
    //       }
    //     }
    //   }
    //   if (tsTicks - voiceTicks > 128) {
    //     const np = SmoNote.defaults;
    //     np.clef = this.clef;
    //     const nnote = new SmoNote(np);
    //     replaceNoteWithDuration(tsTicks - voiceTicks, newNotes, nnote);
    //   }
    //   voices.push({ notes: newNotes });
    // }
    // this.voices = voices;
    // this.tuplets = tuplets;
  }
  /**
   * Get rendered or estimated start y
   */
  get staffY(): number {
    return this.svg.staffY;
  }

  /**
   * Set rendered or estimated start y
   */
  setY(y: number, description: string) {
    if (isNaN(y)) {
      throw ('NAN in setY');
    }
    layoutDebug.measureHistory(this, 'staffY', y, description);
    this.svg.staffY = Math.round(y);
  }

  /**
   * Return actual or estimated highest point in score
   */
  get yTop(): number {
    return this.svg.yTop;
  }

  /**
   * WHen setting an instrument, offset the pitches to match the instrument key
   * @param offset 
   * @param newClef 
   */
  transposeToOffset(offset: number, targetKey: string, newClef?: Clef) {
    const diff = offset - this.transposeIndex;
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        const pitches: number[] = [...Array(note.pitches.length).keys()];
        // when the note is a rest, preserve the rest but match the new clef.
        if (newClef && note.noteType === 'r') {
          const defp = JSON.parse(JSON.stringify(SmoMeasure.defaultPitchForClef[newClef]));
          note.pitches = [defp];
        } else {
          note.transpose(pitches, diff, this.keySignature, targetKey);
          note.getGraceNotes().forEach((gn) => {
            const gpitch: number[] = [...Array(gn.pitches.length).keys()];
            const xpose = SmoNote.transpose(gn, gpitch, diff, this.keySignature, targetKey);
            gn.pitches = xpose.pitches;
          });
        }
      });
    });
  }
  /**
   * Return actual or estimated highest point in score
   */
  setYTop(y: number, description: string) {
    layoutDebug.measureHistory(this, 'yTop', y, description);
    this.svg.yTop = y;
  }

  /**
   * Return actual or estimated bounding box
   */
  setBox(box: SvgBox, description: string) {
    layoutDebug.measureHistory(this, 'logicalBox', box, description);
    this.svg.logicalBox = SvgHelpers.smoBox(box);
  }
  /**
   * @returns the DOM identifier for this measure when rendered
   */
  getClassId() {
    return 'mm-' + this.measureNumber.staffId + '-' + this.measureNumber.measureIndex;
  }
  /**
   * 
   * @param id 
   * @returns 
   */
  getRenderedNote(id: string) {
    let j = 0;
    let i = 0;
    for (j = 0; j < this.voices.length; ++j) {
      const voice = this.voices[j];
      for (i = 0; i < voice.notes.length; ++i) {
        const note = voice.notes[i];
        if (note.renderId === id) {
          return {
            smoNote: note,
            voice: j,
            tick: i
          };
        }
      }
    }
    return null;
  }

  getNotes() {
    return this.voices[this.activeVoice].notes;
  }

  getActiveVoice() {
    return this.activeVoice;
  }

  setActiveVoice(vix: number) {
    if (vix >= 0 && vix < this.voices.length) {
      this.activeVoice = vix;
    }
  }

  tickmapForVoice(voiceIx: number) {
    return new TickMap(this, voiceIx);
  }

  // ### createMeasureTickmaps
  // A tickmap is a map of notes to ticks for the measure.  It is speciifc per-voice
  // since each voice may have different numbers of ticks.  The accidental map is
  // overall since accidentals in one voice apply to accidentals in the other
  // voices.  So we return the tickmaps and the overall accidental map.
  createMeasureTickmaps(): MeasureTickmaps {
    let i = 0;
    const tickmapArray: TickMap[] = [];
    const accidentalMap: Record<string | number, Record<string, TickAccidental>> =
      {} as Record<string | number, Record<PitchLetter, TickAccidental>>;
    for (i = 0; i < this.voices.length; ++i) {
      tickmapArray.push(this.tickmapForVoice(i));
    }

    for (i = 0; i < this.voices.length; ++i) {
      const tickmap: TickMap = tickmapArray[i];
      const durationKeys: string[] = Object.keys((tickmap.durationAccidentalMap));

      durationKeys.forEach((durationKey: string) => {
        if (!accidentalMap[durationKey]) {
          accidentalMap[durationKey] = tickmap.durationAccidentalMap[durationKey];
        } else {
          const amap = accidentalMap[durationKey];
          const tickable: Record<PitchLetter, TickAccidental> = tickmap.durationAccidentalMap[durationKey];
          const letterKeys: PitchLetter[] = Object.keys(tickable) as Array<PitchLetter>;
          letterKeys.forEach((pitchKey) => {
            if (!amap[pitchKey]) {
              amap[pitchKey] = tickmap.durationAccidentalMap[durationKey][pitchKey];
            }
          });
        }
      });
    }
    // duration: duration, pitches: Record<PitchLetter,TickAccidental>
    const accidentalArray: AccidentalArray[] = [];
    Object.keys(accidentalMap).forEach((durationKey) => {
      accidentalArray.push({ duration: durationKey, pitches: accidentalMap[durationKey] });
    });
    return {
      tickmaps: tickmapArray,
      accidentalMap,
      accidentalArray
    };
  }
  // ### createRestNoteWithDuration
  // pad some duration of music with rests.
  static createRestNoteWithDuration(duration: number, clef: Clef): SmoNote {
    const pitch: Pitch = JSON.parse(JSON.stringify(
      SmoMeasure.defaultPitchForClef[clef]));
    const note = new SmoNote(SmoNote.defaults);
    note.pitches = [pitch];
    note.noteType = 'r';
    note.hidden = true;
    note.ticks = { numerator: duration, denominator: 1, remainder: 0 };
    return note;
  }

  /**
   * Count the number of ticks in each voice and return max
   * @returns 
   */
  getMaxTicksVoice() {
    let i = 0;
    let max = 0;
    for (i = 0; i < this.voices.length; ++i) {
      const voiceTicks = this.getTicksFromVoice(i);
      max = Math.max(voiceTicks, max);
    }
    return max;
  }

  /**
   * Count the number of ticks in a specific voice
   * @param voiceIndex 
   * @returns 
   */
  getTicksFromVoice(voiceIndex: number): number {
    let ticks = 0;
    this.voices[voiceIndex].notes.forEach((note) => {
      ticks += note.tickCount;
    });
    return ticks;
  }

  /**
   * Count all the ticks up to the provided tickIndex
   * @param voiceIndex 
   * @param tickIndex 
   */
  getNotePositionInTicks(voiceIndex: number, tickIndex: number): number {
    let rv = 0;
    for (let i = 0; i < tickIndex; i++) {
      const note = this.voices[voiceIndex].notes[i];
      rv += note.tickCount;
    }
    return rv;
  }

  /**
   * Count all the ticks up to the provided tickIndex
   * @param voiceIndex 
   * @param tickIndex 
   */
  getTickCountForNote(voiceIndex: number, note: SmoNote): number {
    let rv = 0;
    for (let i = 0; i < this.voices[voiceIndex].notes.length; i++) {
      const currentNote = this.voices[voiceIndex].notes[i];
      rv += note.tickCount;
    }
    return rv;
  }

  getClosestIndexFromTickCount(voiceIndex: number, tickCount: number): number {
    let i = 0;
    let rv = 0;
    for (i = 0; i < this.voices[voiceIndex].notes.length; ++i) {
      const note = this.voices[voiceIndex].notes[i];
      if (note.tickCount + rv >= tickCount) {
        return i;
      }
      rv += note.tickCount;
    }
    return i;
  }

  isPickup(): boolean {
    const ticks = this.getTicksFromVoice(0);
    const goal = SmoMusic.timeSignatureToTicks(this.timeSignature.timeSignature);
    return (ticks < goal);
  }

  clearBeamGroups() {
    this.beamGroups = [];
  }

  // ### updateLyricFont
  // Update the lyric font, which is the same for all lyrics.
  setLyricFont(fontInfo: FontInfo) {
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.setLyricFont(fontInfo);
      });
    });
  }
  setLyricAdjustWidth(adjustNoteWidth: boolean) {
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.setLyricAdjustWidth(adjustNoteWidth);
      });
    });
  }

  setChordAdjustWidth(adjustNoteWidth: boolean) {
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.setChordAdjustWidth(adjustNoteWidth);
      });
    });
  }

  // ### updateLyricFont
  // Update the lyric font, which is the same for all lyrics.
  setChordFont(fontInfo: FontInfo) {
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.setChordFont(fontInfo);
      });
    });
  }

  tupletNotes(smoTuplet: SmoTuplet): SmoNote[] {
    let tupletNotes: SmoNote[] = [];
    for (let i = smoTuplet.startIndex; i <= smoTuplet.endIndex; i++) {
      const note = this.voices[smoTuplet.voice].notes[i];
      tupletNotes.push(note);
    }
    return tupletNotes;
  }

  getStemDirectionForTuplet(smoTuplet: SmoTuplet) {
    let note: SmoNote | null = null;
    for (let currentNote of this.tupletNotes(smoTuplet)) {
      if (currentNote.noteType === 'n') {
        note = currentNote;
        break;
      }
    }
    
    if (!note) {
      return SmoNote.flagStates.down;
    }
    if (note.flagState !== SmoNote.flagStates.auto) {
      return note.flagState;
    }
    return SmoMusic.pitchToLedgerLine(this.clef, note.pitches[0])
      >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
  }


  

  

  setClef(clef: Clef) {
    const oldClef = this.clef;
    this.clef = clef;
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.clef = clef;
      });
    });
  }
  /**
   * Get the clef that this measure ends with.
   * @returns 
   */
  getLastClef() {
    for (var i = 0; i < this.voices.length; ++i) {
      const voice = this.voices[i];
      for (var j = 0; j < voice.notes.length; ++j) {
        const note = voice.notes[j];
        if (note.clefNote && note.clefNote.clef !== this.clef) {
          return note.clefNote.clef;
        }
      }
    }
    return this.clef;
  }
  isRest() {
    let i = 0;
    for (i = 0; i < this.voices.length; ++i) {
      const voice = this.voices[i];
      for (var j = 0; j < voice.notes.length; ++j) {
        if (!voice.notes[j].isRest()) {
          return false;
        }
      }
    }
    return true;
  }
  // ### populateVoice
  // Create a new voice in this measure, and populate it with the default note
  // for this measure/key/clef
  populateVoice(index: number) {
    if (index !== this.voices.length) {
      return;
    }
    this.voices.push({ notes: SmoMeasure.getDefaultNotes(this) });
    this.activeVoice = index;
  }
  private _removeSingletonModifier(name: string) {
    const ar = this.modifiers.filter(obj => obj.attrs.type !== name);
    this.modifiers = ar;
  }

  addRehearsalMark(parameters: SmoRehearsalMarkParams) {
    this._removeSingletonModifier('SmoRehearsalMark');
    this.modifiers.push(new SmoRehearsalMark(parameters));
  }
  removeRehearsalMark() {
    this._removeSingletonModifier('SmoRehearsalMark');
  }
  getRehearsalMark(): SmoMeasureModifierBase | undefined {
    return this.modifiers.find(obj => obj.attrs.type === 'SmoRehearsalMark');
  }
  getModifiersByType(type: string) {
    return this.modifiers.filter((mm) => type === mm.attrs.type);
  }

  setTempo(params: SmoTempoTextParams) {
    this.tempo = new SmoTempoText(params);
  }
  /**
   * Set measure tempo to the default {@link SmoTempoText}
   */
  resetTempo() {
    this.tempo = new SmoTempoText(SmoTempoText.defaults);
  }
  getTempo() {
    if (typeof (this.tempo) === 'undefined') {
      this.tempo = new SmoTempoText(SmoTempoText.defaults);
    }
    return this.tempo;
  }
  /**
   * Measure text is deprecated, and may not be supported in the future.
   * Better to use SmoTextGroup and attach to the measure.
   * @param mod 
   * @returns 
   */
  addMeasureText(mod: SmoMeasureModifierBase) {
    var exist = this.modifiers.filter((mm) =>
      mm.attrs.id === mod.attrs.id
    );
    if (exist.length) {
      return;
    }
    this.modifiers.push(mod);
  }

  getMeasureText() {
    return this.modifiers.filter(obj => obj.ctor === 'SmoMeasureText');
  }

  removeMeasureText(id: string) {
    var ar = this.modifiers.filter(obj => obj.attrs.id !== id);
    this.modifiers = ar;
  }

  setRepeatSymbol(rs: SmoRepeatSymbol) {
    const ar: SmoMeasureModifierBase[] = [];
    let toAdd = true;
    const exSymbol = this.getRepeatSymbol();
    if (exSymbol && exSymbol.symbol === rs.symbol) {
      toAdd = false;
    }
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor !== 'SmoRepeatSymbol') {
        ar.push(modifier);
      }
    });
    this.modifiers = ar;
    if (toAdd) {
      ar.push(rs);
    }
  }
  getRepeatSymbol(): SmoRepeatSymbol | null {
    const rv = this.modifiers.filter(obj => obj.ctor === 'SmoRepeatSymbol');
    if (rv.length > 0) {
      return rv[0] as SmoRepeatSymbol;
    }
    return null;
  }
  clearRepeatSymbols() {
    const ar: SmoMeasureModifierBase[] = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor !== 'SmoRepeatSymbol') {
        ar.push(modifier);
      }
    });
    this.modifiers = ar;
  }

  setBarline(barline: SmoBarline) {
    var ar: SmoMeasureModifierBase[] = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor === 'SmoBarline') {
        const o = modifier as SmoBarline;
        if (o.position !== barline.position) {
          ar.push(o);
        }
      } else {
        ar.push(modifier);
      }
    });
    this.modifiers = ar;
    ar.push(barline);
  }

  private _getBarline(pos: number): SmoBarline {
    let rv = null;
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor === 'SmoBarline' && (modifier as SmoBarline).position === pos) {
        rv = modifier;
      }
    });
    if (rv === null) {
      return new SmoBarline(SmoBarline.defaults);
    }
    return rv;
  }

  getEndBarline(): SmoBarline {    
    return this._getBarline(SmoBarline.positions.end);
  }
  getStartBarline(): SmoBarline {
    return this._getBarline(SmoBarline.positions.start);
  }

  addNthEnding(ending: SmoVolta) {
    const mods = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor !== 'SmoVolta' || (modifier as SmoVolta).startBar !== ending.startBar ||
        (modifier as SmoVolta).endBar !== ending.endBar) {
        mods.push(modifier);
      }
    });
    mods.push(ending);
    this.modifiers = mods;
  }

  removeNthEnding(ending: SmoVolta) {
    const mods: SmoMeasureModifierBase[] = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor === 'SmoVolta') {
        const volta = modifier as SmoVolta;
        if (ending.startSelector === null || ending.endSelector === null || volta.startSelector === null || volta.endSelector === null) {
          return;
        }
        if (!SmoSelector.sameMeasure(ending.startSelector, volta.startSelector) || !SmoSelector.sameMeasure(ending.endSelector, volta.endSelector)
        && ending.number !== volta.number) {
          mods.push(modifier);
        }
      } else {
        mods.push(modifier);
      }
    });
    this.modifiers = mods;
  }

  getNthEndings(): SmoVolta[] {
    const rv: SmoVolta[] = [];
    this.modifiers.forEach((modifier: SmoMeasureModifierBase) => {
      if (modifier.ctor === 'SmoVolta') {
        rv.push(modifier as SmoVolta);
      }
    });
    return rv;
  }
  getEndEndings(): SmoVolta[] {
    const rv: SmoVolta[] = [];
    this.modifiers.forEach((modifier: SmoMeasureModifierBase) => {
      if (modifier.ctor === 'SmoVolta' && (modifier as SmoVolta).endBar === this.measureNumber.systemIndex
        && (modifier as SmoVolta).startBar !== this.measureNumber.systemIndex) {
        rv.push(modifier as SmoVolta);
      }
    });
    return rv;
  }
  getMidEndings(): SmoVolta[] {
    const rv: SmoVolta[] = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor === 'SmoVolta' && (modifier as SmoVolta).endBar > this.measureNumber.systemIndex
        && (modifier as SmoVolta).startBar < this.measureNumber.systemIndex) {
        rv.push(modifier as SmoVolta);
      }
    });
    return rv;
  }
  setKeySignature(sig: string) {
    this.keySignature = sig;
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.keySignature = sig;
      });
    });
  }
  setMeasureNumber(num: MeasureNumber) {
    this.measureNumber = num;
  }
  getBeamGroupForNote(note: SmoNote) {
    let i = 0;
    let j = 0;
    for (i = 0; i < this.beamGroups.length; ++i) {
      const bg = this.beamGroups[i];
      for (j = 0; j < bg.notes.length; ++j) {
        if (bg.notes[j].attrs.id === note.attrs.id) {
          return bg;
        }
      }
    }
    return null;
  }
}
