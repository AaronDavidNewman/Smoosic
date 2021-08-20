// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { smoMusic } from '../../common/musicHelpers';
import {
  SmoBarline, SmoMeasureModifierBase, SmoRepeatSymbol, SmoTempoText, SmoMeasureFormat,
  SmoVolta, SmoRehearsalMarkParams, SmoRehearsalMark, SmoTempoTextParams
} from './measureModifiers';
import { SmoNote } from './note';
import { SmoTuplet } from './tuplet';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { svgHelpers } from '../../common/svgHelpers';
import { TickMap, TickAccidental } from '../xform/tickMap';
import { MeasureNumber, SvgBox, SmoAttrs, Pitch, PitchLetter, Clef, FontInfo } from './common';

export interface SmoVoice {
  notes: SmoNote[]
}

export interface TickMappable {
  voices: SmoVoice[],
  keySignature: string
}

const VF = eval('Vex.Flow');

export interface ISmoBeamGroup {
  notes: SmoNote[],
  voice: number
}
export interface MeasureSvg {
  staffWidth: number,
  unjustifiedWidth: number,
  staffX: number,
  staffY: number,
  logicalBox: SvgBox,
  renderedBox: SvgBox | null,
  yTop: number,
  adjX: number
  history: string[],
  lineIndex: number
}

export interface SmoMeasureParams {
  timeSignature: string,
  keySignature: string,
  canceledKeySignature: string | null,
  padRight: number,
  tuplets: SmoTuplet[],
  transposeIndex: number,
  rightMargin: number,
  staffY: number,
  // bars: [1, 1], // follows enumeration in VF.Barline
  measureNumber: MeasureNumber,
  clef: Clef,
  forceClef: boolean,
  forceKeySignature: boolean,
  forceTimeSignature: boolean,
  voices: SmoVoice[],
  activeVoice: number,
  tempo: SmoTempoText,
  format: SmoMeasureFormat | null,
  modifiers: SmoMeasureModifierBase[]
}

export interface AccidentalArray {
  duration: string | number,
  pitches: Record<PitchLetter, TickAccidental>
}

// ## SmoMeasure - data for a measure of music
// Many rules of musical engraving are enforced at a measure level, e.g. the duration of
// notes, accidentals, etc.
// ### See Also:
// Measures contain *notes*, *tuplets*, and *beam groups*.  So see `SmoNote`, etc.
// Measures are contained in staves, see also `SystemStaff.js`
// ## SmoMeasure Methods:
export class SmoMeasure implements SmoMeasureParams, TickMappable {
  static readonly _defaults: SmoMeasureParams = {
    timeSignature: '4/4',
    keySignature: 'C',
    canceledKeySignature: null,
    padRight: 10,
    tuplets: [],
    transposeIndex: 0,
    modifiers: [],
    rightMargin: 2,
    staffY: 40,
    // bars: [1, 1], // follows enumeration in VF.Barline
    measureNumber: {
      localIndex: 0,
      systemIndex: 0,
      measureIndex: 0,
      staffId: 0
    },
    clef: 'treble',
    forceClef: false,
    forceKeySignature: false,
    forceTimeSignature: false,
    voices: [],
    format: new SmoMeasureFormat(SmoMeasureFormat.defaults),
    activeVoice: 0,
    tempo: new SmoTempoText(SmoTempoText.defaults)
  }

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
  timeSignature: string = '';
  keySignature: string = '';
  canceledKeySignature: string = '';
  padRight: number = 10;
  tuplets: SmoTuplet[] = [];
  transposeIndex: number = 0;
  modifiers: SmoMeasureModifierBase[] = [];
  rightMargin: number = 2;
  // bars: [1, 1], // follows enumeration in VF.Barline
  measureNumber: MeasureNumber = {
    localIndex: 0,
    systemIndex: 0,
    measureIndex: 0,
    staffId: 0
  };
  clef: Clef = 'treble';
  forceClef: boolean = false;
  forceKeySignature: boolean = false;
  forceTimeSignature: boolean = false;
  voices: SmoVoice[] = [];
  activeVoice: number = 0;
  tempo: SmoTempoText;
  beamGroups: ISmoBeamGroup[] = [];
  svg: MeasureSvg;
  format: SmoMeasureFormat;
  attrs: SmoAttrs;

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
      renderedBox: null,
      yTop: 0,
      adjX: 0,
      history: [],
      lineIndex: 0
    };

    const defaults = SmoMeasure.defaults;
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, defaults, this);
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, params, this);
    this.voices = params.voices ? params.voices : [];
    this.tuplets = params.tuplets ? params.tuplets : [];
    this.modifiers = params.modifiers ? params.modifiers : defaults.modifiers;

    this.setDefaultBarlines();

    this.keySignature = smoMusic.vexKeySigWithOffset(this.keySignature, this.transposeIndex);

    if (typeof (params.format) === 'undefined') {
      this.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
      this.format.measureIndex = this.measureNumber.measureIndex;
    } else {
      this.format = new SmoMeasureFormat(params.format);
    }
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SmoMeasure'
    };
  }

  // ### defaultAttributes
  // attributes that are to be serialized for a measure.
  static get defaultAttributes() {
    return [
      'timeSignature', 'keySignature',
      'measureNumber',
      'activeVoice', 'clef', 'transposeIndex',
      'adjX', 'format', 'rightMargin'
    ];
  }

  static get formattingOptions() {
    return ['customStretch', 'customProportion', 'autoJustify', 'systemBreak',
      'pageBreak', 'padLeft'];
  }
  static get systemOptions() {
    return ['systemBreak', 'pageBreak'];
  }
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

  // ### serializeColumnMapped
  // Some measure attributes that apply to the entire column are serialized
  // separately.  Serialize those attributes, but only add them to the
  // hash if they already exist for an earlier measure
  serializeColumnMapped(attrColumnHash: any, attrCurrentValue: any) {
    let curValue = '';
    SmoMeasure.columnMappedAttributes.forEach((attr) => {
      const field: any = (this as any)[attr];
      if (field) {
        curValue = field;
        if (!attrColumnHash[attr]) {
          attrColumnHash[attr] = {};
          attrCurrentValue[attr] = {};
        }
        const curAttrHash = attrColumnHash[attr];
        // If this is key signature, make sure we normalize to concert pitch
        // from instrument pitch
        if (attr === 'keySignature') {
          curValue = smoMusic.vexKeySigWithOffset(curValue, -1 * this.transposeIndex);
        }
        if (field.ctor && field.ctor === 'SmoTempoText') {
          if (field.compare(attrCurrentValue[attr]) === false) {
            curAttrHash[this.measureNumber.measureIndex] = curValue;
            attrCurrentValue[attr] = curValue;
          }
        } else if (attrCurrentValue[attr] !== curValue) {
          curAttrHash[this.measureNumber.measureIndex] = curValue;
          attrCurrentValue[attr] = curValue;
        }
      } // else attr doesn't exist in this measure
    });
  }

  // ### serialize
  // Convert this measure object to a JSON object, recursively serializing all the notes,
  // note modifiers, etc.
  serialize() {
    const params: any = {};
    let ser = true;
    smoSerialize.serializedMergeNonDefault(SmoMeasure.defaults, SmoMeasure.serializableAttributes, this, params);
    // measure number can't be defaulted b/c tempos etc. can map to default measure
    params.measureNumber = JSON.parse(JSON.stringify(this.measureNumber));
    params.tuplets = [];
    params.voices = [];
    params.modifiers = [];

    this.tuplets.forEach((tuplet) => {
      params.tuplets.push(tuplet.serialize());
    });

    this.voices.forEach((voice) => {
      const obj: any = {
        notes: []
      };
      voice.notes.forEach((note) => {
        obj.notes.push(note.serialize());
      });
      params.voices.push(obj);
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
        params.modifiers.push(modifier.serialize());
      }
    });
    return params;
  }

  // ### deserialize
  // restore a serialized measure object.  Usually called as part of deserializing a score,
  // but can also be used to restore a measure due to an undo operation.
  static deserialize(jsonObj: any) {
    let j = 0;
    let i = 0;
    const voices = [];
    const noteSum = [];
    for (j = 0; j < jsonObj.voices.length; ++j) {
      const voice = jsonObj.voices[j];
      const notes: any = [];
      voices.push({
        notes
      });
      for (i = 0; i < voice.notes.length; ++i) {
        const noteParams = voice.notes[i];
        const smoNote = SmoNote.deserialize(noteParams);
        notes.push(smoNote);
        noteSum.push(smoNote);
      }
    }

    const tuplets = [];
    for (j = 0; j < jsonObj.tuplets.length; ++j) {
      const tupJson = jsonObj.tuplets[j];
      const noteAr = noteSum.filter((nn: any) =>
        nn.isTuplet && nn.tuplet.id === tupJson.attrs.id);

      // Bug fix:  A tuplet with no notes may be been overwritten
      // in a copy/paste operation
      if (noteAr.length > 0) {
        tupJson.notes = noteAr;
        const tuplet = new SmoTuplet(tupJson);
        tuplets.push(tuplet);
      }
    }

    const modifiers: SmoMeasureModifierBase[] = [];
    jsonObj.modifiers.forEach((modParams: any) => {
      const modifier: SmoMeasureModifierBase = SmoMeasureModifierBase.deserialize(modParams);
      modifiers.push(modifier);
    });
    const params: SmoMeasureParams = SmoMeasure.defaults;
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, jsonObj, params);
    params.voices = voices;
    params.tuplets = tuplets;
    params.modifiers = modifiers;
    const rv = new SmoMeasure(params);
    if (jsonObj.tempo) {
      rv.tempo = new SmoTempoText(jsonObj.tempo);
    }

    // Handle migration for measure-mapped parameters
    rv.modifiers.forEach((mod) => {
      if (mod.ctor === 'SmoTempoText') {
        rv.tempo = (mod as SmoTempoText);
      }
    });
    if (!rv.tempo) {
      rv.tempo = new SmoTempoText(SmoTempoText.defaults);
    }
    return rv;
  }

  // ### defaultPitchForClef
  // Accessor for clef objects, which are set at a measure level.
  // #### TODO: learn what all these clefs are
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
  static _emptyMeasureNoteType: string = 'r';
  static set emptyMeasureNoteType(tt) {
    SmoMeasure._emptyMeasureNoteType = tt;
  }
  static get emptyMeasureNoteType() {
    return SmoMeasure._emptyMeasureNoteType;
  }
  // ### getDefaultNotes
  // Get a measure full of default notes for a given timeSignature/clef.
  // returns 8th notes for triple-time meters, etc.
  static getDefaultNotes(params: SmoMeasureParams) {
    let beamBeats = 0;
    let beats = 0;
    let i = 0;
    let ticks = {
      numerator: 4096,
      denominator: 1,
      remainder: 0
    };
    if (params === null) {
      params = SmoMeasure.defaults;
    }
    params.timeSignature = params.timeSignature ? params.timeSignature : '4/4';
    params.clef = params.clef ? params.clef : 'treble';
    const meterNumbers = params.timeSignature.split('/').map(number => parseInt(number, 10));
    beamBeats = ticks.numerator;
    beats = meterNumbers[0];
    if (meterNumbers[1] === 8) {
      ticks = {
        numerator: 2048,
        denominator: 1,
        remainder: 0
      };
      if (meterNumbers[0] % 3 === 0) {
        ticks.numerator = 2048 * 3;
        beats = meterNumbers[0] / 3;
      }
      beamBeats = 2048 * 3;
    }
    const pitches: Pitch =
      JSON.parse(JSON.stringify(SmoMeasure.defaultPitchForClef[params.clef]));
    const rv = [];

    // Treat 2/2 like 4/4 time.
    if (meterNumbers[1] === 2) {
      beats = beats * 2;
    }

    for (i = 0; i < beats; ++i) {
      const note = new SmoNote({
        noteHead: 'n',
        clef: params.clef,
        pitches: [pitches],
        ticks,
        beamBeats,
        noteType: SmoMeasure.emptyMeasureNoteType,
        textModifiers: [],
        articulations: [],
        graceNotes: [],
        ornaments: [],
        tones: [],
        endBeam: false,
        fillStyle: '',
        flagState: SmoNote.flagStates.auto,
        hidden: false
      });
      rv.push(note);
    }
    return rv;
  }

  // ### getDefaultMeasure
  // For create the initial or new measure, get a measure with notes.
  static getDefaultMeasure(params: SmoMeasureParams): SmoMeasure {
    const obj: any = {};
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, SmoMeasure.defaults, obj);
    smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, params, obj);
    // Don't copy column-formatting options to new measure in new column
    smoSerialize.serializedMerge(SmoMeasure.formattingOptions, SmoMeasure.defaults, obj);
    // Don't redisplay tempo for a new measure
    const rv = new SmoMeasure(obj);
    if (rv.tempo && rv.tempo.display) {
      rv.tempo.display = false;
    }
    return rv;
  }

  // ### SmoMeasure.getDefaultMeasureWithNotes
  // Get a new measure with the appropriate notes for the supplied clef, instrument
  static getDefaultMeasureWithNotes(params: SmoMeasureParams) {
    var measure = SmoMeasure.getDefaultMeasure(params);
    measure.voices.push({
      notes: SmoMeasure.getDefaultNotes(params)
    });
    // fix a bug.
    // new measures only have 1 voice, make sure active voice is 0
    measure.activeVoice = 0;
    return measure;
  }

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

  setForcePageBreak(val: boolean) {
    this.format.pageBreak = val;
  }

  setForceSystemBreak(val: boolean) {
    this.format.systemBreak = val;
  }

  setAutoJustify(val: boolean) {
    this.format.autoJustify = val;
  }
  getAutoJustify() {
    return this.format.autoJustify;
  }
  getForceSystemBreak() {
    return this.format.systemBreak;
  }

  getForcePageBreak() {
    return this.format.pageBreak;
  }

  // ###   SVG mixins
  // We store some rendering data in the instance for UI mapping.
  get staffWidth() {
    return this.svg.staffWidth;
  }

  setWidth(width: number, description: string) {
    if (layoutDebug.flagSet('measureHistory')) {
      this.svg.history.push('setWidth ' + this.staffWidth + '=> ' + width + ' ' + description);
    }
    if (isNaN(width)) {
      throw ('NAN in setWidth');
    }
    this.svg.staffWidth = width;
  }

  get staffX(): number {
    return this.svg.staffX;
  }

  setX(x: number, description: string) {
    if (isNaN(x)) {
      throw ('NAN in setX');
    }
    layoutDebug.measureHistory(this, 'staffX', x, description);
    this.svg.staffX = Math.round(x);
  }

  get staffY(): number {
    return this.svg.staffY;
  }

  setY(y: number, description: string) {
    if (isNaN(y)) {
      throw ('NAN in setY');
    }
    layoutDebug.measureHistory(this, 'staffY', y, description);
    this.svg.staffY = Math.round(y);
  }

  get logicalBox(): SvgBox | null {
    return typeof (this.svg.logicalBox.x) === 'number' ? this.svg.logicalBox : null;
  }

  get yTop(): number {
    return this.svg.yTop;
  }

  setYTop(y: number, description: string) {
    layoutDebug.measureHistory(this, 'yTop', y, description);
    this.svg.yTop = y;
  }

  setBox(box: SvgBox, description: string) {
    layoutDebug.measureHistory(this, 'logicalBox', box, description);
    this.svg.logicalBox = svgHelpers.smoBox(box);
  }

  saveUnjustifiedWidth() {
    this.svg.unjustifiedWidth = this.svg.staffWidth;
  }

  // ### getClassId
  // create a identifier unique to this measure index so it can be easily removed.
  getClassId() {
    return 'mm-' + this.measureNumber.staffId + '-' + this.measureNumber.measureIndex;
  }

  pickupMeasure(duration: number) {
    const timeSig = this.timeSignature;
    const proto = SmoMeasure.deserialize(this.serialize());
    proto.attrs.id = VF.Element.newID();
    const note = proto.voices[0].notes[0];
    proto.voices = [];
    note.pitches = [note.pitches[0]];
    note.ticks.numerator = duration;
    note.makeRest();
    proto.voices.push({ notes: [note] });
    proto.timeSignature = timeSig;
    return proto;
  }

  // ### getRenderedNote
  // The renderer puts a mapping between rendered svg groups and
  // the logical notes in SMO.  The UI needs this mapping to be interactive,
  // figure out where a note is rendered, what its bounding box is, etc.
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
  createMeasureTickmaps() {
    let i = 0;
    const tickmapArray: TickMap[] = [];
    const accidentalMap: Record<string | number, Record<PitchLetter, TickAccidental>> =
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

  getMaxTicksVoice() {
    let i = 0;
    let max = 0;
    for (i = 0; i < this.voices.length; ++i) {
      const voiceTicks = this.getTicksFromVoice(i);
      max = Math.max(voiceTicks, max);
    }
    return max;
  }

  getTicksFromVoice(voiceIndex: number): number {
    let ticks = 0;
    this.voices[voiceIndex].notes.forEach((note) => {
      ticks += note.tickCount;
    });
    return ticks;
  }

  isPickup(): boolean {
    const ticks = this.getTicksFromVoice(0);
    const goal = smoMusic.timeSignatureToTicks(this.timeSignature);
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

  // ### tuplet methods.
  //
  // #### tupletNotes
  tupletNotes(tuplet: SmoTuplet) {
    let j = 0;
    let i = 0;
    const tnotes = [];
    for (j = 0; j < this.voices.length; ++j) {
      const vnotes = this.voices[j].notes;
      for (i = 0; i < vnotes.length; ++i) {
        const note = vnotes[i] as SmoNote;
        if (note.tuplet && note.tuplet.id === tuplet.attrs.id) {
          tnotes.push(vnotes[i]);
        }
      }
    }
    return tnotes;
  }

  // #### tupletIndex
  // return the index of the given tuplet
  tupletIndex(tuplet: SmoTuplet) {
    let j = 0;
    let i = 0;
    for (j = 0; j < this.voices.length; ++j) {
      const notes = this.voices[j].notes;
      for (i = 0; i < notes.length; ++i) {
        const note = notes[i] as SmoNote;
        if (note.tuplet && note.tuplet.id === tuplet.attrs.id) {
          return i;
        }
      }
    }
    return -1;
  }

  // #### getTupletForNote
  // Finds the tuplet for a given note, or null if there isn't one.
  getTupletForNote(note: SmoNote | null): SmoTuplet | null {
    let i = 0;
    if (!note) {
      return null;
    }
    if (!note.isTuplet) {
      return null;
    }
    for (i = 0; i < this.tuplets.length; ++i) {
      const tuplet = this.tuplets[i];
      if (note.tuplet !== null && tuplet.attrs.id === note.tuplet.id) {
        return tuplet;
      }
    }
    return null;
  }

  removeTupletForNote(note: SmoNote) {
    let i = 0;
    const tuplets = [];
    for (i = 0; i < this.tuplets.length; ++i) {
      const tuplet = this.tuplets[i];
      if (note.tuplet !== null && note.tuplet.id !== tuplet.attrs.id) {
        tuplets.push(tuplet);
      }
    }
    this.tuplets = tuplets;
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
  _removeSingletonModifier(name: string) {
    const ar = this.modifiers.filter(obj => obj.attrs.type !== name);
    this.modifiers = ar;
  }

  _getSingletonModifier(name: string): SmoMeasureModifierBase | undefined {
    return this.modifiers.find(obj => obj.attrs.type === name);
  }

  addRehearsalMark(parameters: SmoRehearsalMarkParams) {
    this._removeSingletonModifier('SmoRehearsalMark');
    this.modifiers.push(new SmoRehearsalMark(parameters));
  }
  removeRehearsalMark() {
    this._removeSingletonModifier('SmoRehearsalMark');
  }
  getRehearsalMark(): SmoMeasureModifierBase | undefined {
    return this._getSingletonModifier('SmoRehearsalMark');
  }
  getModifiersByType(type: string) {
    return this.modifiers.filter((mm) => type === mm.attrs.type);
  }

  addTempo(params: SmoTempoTextParams) {
    this.tempo = new SmoTempoText(params);
  }
  removeTempo() {
    this.tempo = new SmoTempoText(SmoTempoText.defaults);
  }
  getTempo() {
    if (typeof (this.tempo) === 'undefined') {
      this.tempo = new SmoTempoText(SmoTempoText.defaults);
    }
    return this.tempo;
  }
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
      if (modifier.ctor !== 'SmoBarline') {
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

  _getBarline(pos: number): SmoBarline {
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

  removeNthEnding(number: number) {
    const mods: SmoMeasureModifierBase[] = [];
    this.modifiers.forEach((modifier) => {
      if (modifier.ctor !== 'SmoVolta' || (modifier as SmoVolta).number !== number) {
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

  get numBeats() {
    return this.timeSignature.split('/').map(number => parseInt(number, 10))[0];
  }
  setKeySignature(sig: string) {
    this.keySignature = sig;
    this.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        note.keySignature = sig;
      });
    });
  }
  get beatValue(): number {
    return this.timeSignature.split('/').map(number => parseInt(number, 10))[1];
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
