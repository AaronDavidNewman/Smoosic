// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { smoMusic } from '../../common/musicHelpers';
import { SmoObjectParams } from './noteModifiers';
import { SmoAttrs, MeasureNumber, FontInfo } from './common';

const VF = eval('Vex.Flow');
// ## Measure modifiers are elements that are attached to the bar itself, like barlines or measure-specific text,
// repeats - lots of stuff
export abstract class SmoMeasureModifierBase {
  attrs: SmoAttrs;
  ctor: string;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
  }
  static deserialize(jsonObj: SmoObjectParams) {
    const ctor = eval('globalThis.Smo.' + jsonObj.ctor);
    const rv = new ctor(jsonObj);
    return rv;
  }
  abstract serialize(): object;
}

export interface SmoMeasureFormatParams {
  customStretch: number | null,
  customProportion: number | null,
  autoJustify: boolean | null,
  systemBreak: boolean | null,
  pageBreak: boolean | null,
  padLeft: number | null,
  padAllInSystem: boolean | null,
  measureIndex: number | null
}
export interface ISmoMeasureFormatMgr {
  format: SmoMeasureFormatParams,
  measureNumber: MeasureNumber
}
export class SmoMeasureFormat extends SmoMeasureModifierBase implements SmoMeasureFormatParams {
  static get attributes() {
    return ['customStretch', 'customProportion', 'autoJustify', 'systemBreak', 'pageBreak', 'padLeft', 'measureIndex'];
  }
  static get formatAttributes() {
    return ['customStretch', 'customProportion', 'autoJustify', 'systemBreak', 'pageBreak', 'padLeft'];
  }
  static fromLegacyMeasure(measure: any) {
    const o: any = {};
    SmoMeasureFormat.formatAttributes.forEach((attr: string | number) => {
      if (typeof (measure[attr]) !== 'undefined') {
        o[attr] = measure[attr];
      } else {
        const rhs = (SmoMeasureFormat.defaults as any)[attr];
        o[attr] = rhs;
      }
      o.measureIndex = measure.measureNumber.measureIndex;
    });
    return new SmoMeasureFormat(o);
  }
  static readonly defaults: SmoMeasureFormatParams = {
    customStretch: 0,
    customProportion: 100,
    systemBreak: false,
    pageBreak: false,
    padLeft: 0,
    padAllInSystem: true,
    autoJustify: true,
    measureIndex: 0
  }
  customStretch: number = 0;
  customProportion: number = 100;
  systemBreak: boolean = false;
  pageBreak: boolean = false;
  padLeft: number = 0;
  padAllInSystem: boolean = false;
  autoJustify: boolean = true;
  measureIndex: number = 0;
  eq(o: SmoMeasureFormatParams) {
    let rv = true;
    SmoMeasureFormat.formatAttributes.forEach((attr: string | number) => {
      const obj1 = (o as any)[attr];
      const obj2 = (this as any)[attr];
      if (obj1 !== obj2) {
        rv = false;
      }
    });
    return rv;
  }
  get isDefault() {
    return this.eq(SmoMeasureFormat.defaults);
  }
  constructor(parameters: SmoMeasureFormatParams | null) {
    super('SmoMeasureFormat');
    let pobj: any = parameters;
    if (typeof(parameters) === 'undefined' || parameters === null) {
      pobj = {};
    }
    SmoMeasureFormat.attributes.forEach((attr) => {
      const to = typeof ((pobj as any)[attr]);
      if (to === 'undefined') {
        (this as any)[attr] = (SmoMeasureFormat.defaults as any)[attr];
      } else {
        (this as any)[attr] = (pobj as any)[attr];
      }
    });
  }
  formatMeasure(mm: ISmoMeasureFormatMgr) {
    mm.format = new SmoMeasureFormat(this);
    mm.format.measureIndex = mm.measureNumber.measureIndex;
  }
  serialize() {
    const params = { ctor: 'SmoMeasureFormat' };
    smoSerialize.serializedMergeNonDefault(SmoMeasureFormat.defaults, SmoMeasureFormat.attributes, this, params);
    return params;
  }
}
export interface SmoBarlineParams {
  position: number | null,
  barline: number | null
}

export class SmoBarline extends SmoMeasureModifierBase {
  static readonly positions: Record<string, number> = {
    start: 0,
    end: 1
  };

  static readonly barlines: Record<string, number> = {
    singleBar: 0,
    doubleBar: 1,
    endBar: 2,
    startRepeat: 3,
    endRepeat: 4,
    noBar: 5
  }

  static get _barlineToString() {
    return ['singleBar', 'doubleBar', 'endBar', 'startRepeat', 'endRepeat', 'noBar'];
  }
  static barlineString(inst: SmoBarline) {
    return SmoBarline._barlineToString[inst.barline];
  }

  static readonly defaults: SmoBarlineParams = {
    position: SmoBarline.positions.end,
    barline: SmoBarline.barlines.singleBar
  }

  static get attributes() {
    return ['position', 'barline'];
  }
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoBarline.defaults, SmoBarline.attributes, this, params);
    params.ctor = 'SmoBarline';
    return params;
  }

  constructor(parameters: SmoBarlineParams | null) {
    super('SmoBarline');
    let ops = parameters as any;
    if (typeof(parameters) === 'undefined' || parameters === null) {
      ops = {};
    }
    smoSerialize.serializedMerge(SmoBarline.attributes, SmoBarline.defaults, this);
    smoSerialize.serializedMerge(SmoBarline.attributes, ops, this);
  }

  static get toVexBarline() {
    return [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
      VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];
  }
  static get toVexPosition() {
    return [VF.StaveModifier.BEGIN, VF.StaveModifier.END];
  }
  barline: number = SmoBarline.barlines.singleBar;
  position: number = SmoBarline.positions.start;

  toVexBarline(): number {
    return SmoBarline.toVexBarline[this.barline];
  }
  toVexPosition(): number {
    return SmoBarline.toVexPosition[this.position];
  }
}

export interface SmoRepeatSymbolParams {
  symbol: number,
  xOffset: number,
  yOffset: number,
  position: number
}
export class SmoRepeatSymbol extends SmoMeasureModifierBase {
  static readonly symbols: Record<string, number> = {
    None: 0,
    Coda: 1,
    Segno: 2,
    Dc: 3,
    ToCoda: 1,
    DcAlCoda: 4,
    DcAlFine: 5,
    Ds: 6,
    DsAlCoda: 7,
    DsAlFine: 8,
    Fine: 9
  }

  static readonly defaultXOffset: number[] = [0, 0, 0, -20, -60, -60, -50, -60, -50, -40]

  static readonly positions: Record<string, number> = {
    start: 0,
    end: 1
  }
  static readonly defaults: SmoRepeatSymbolParams = {
    symbol: SmoRepeatSymbol.symbols.Coda,
    xOffset: 0,
    yOffset: 30,
    position: SmoRepeatSymbol.positions.end
  }
  static get toVexSymbol() {
    return [VF.Repetition.type.NONE, VF.Repetition.type.CODA_LEFT, VF.Repetition.type.SEGNO_LEFT, VF.Repetition.type.DC,
      VF.Repetition.type.DC_AL_CODA, VF.Repetition.type.DC_AL_FINE, VF.Repetition.type.DS,
      VF.Repetition.type.DS_AL_CODA, VF.Repetition.type.DS_AL_FINE, VF.Repetition.type.FINE];
  }
  static get attributes() {
    return ['symbol', 'xOffset', 'yOffset', 'position'];
  }
  symbol: number = SmoRepeatSymbol.symbols.Coda;
  xOffset: number = 0;
  yOffset: number = 30;
  position: number = SmoRepeatSymbol.positions.end;
  toVexSymbol() {
    return SmoRepeatSymbol.toVexSymbol[this.symbol];
  }
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoRepeatSymbol.defaults, SmoRepeatSymbol.attributes, this, params);
    params.ctor = 'SmoRepeatSymbol';
    return params;
  }
  constructor(parameters: SmoRepeatSymbolParams) {
    super('SmoRepeatSymbol');
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
    this.xOffset = SmoRepeatSymbol.defaultXOffset[parameters.symbol];
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
  }
}

export interface SmoVoltaParams {
  startBar: number,
  endBar: number,
  xOffsetStart: number,
  xOffsetEnd: number,
  yOffset: number,
  number: number
}
export class SmoVolta extends SmoMeasureModifierBase {
  startBar: number = 1;
  endBar: number = 1;
  xOffsetStart: number = 0;
  xOffsetENd: number = 0;
  yOffset: number = 20;
  number: number = 1;
  constructor(parameters: SmoVoltaParams) {
    super('SmoVolta');
    smoSerialize.serializedMerge(SmoVolta.attributes, SmoVolta.defaults, this);
    smoSerialize.serializedMerge(SmoVolta.attributes, parameters, this);
  }
  get id() {
    return this.attrs.id;
  }
  get type() {
    return this.attrs.type;
  }
  static get attributes() {
    return ['startBar', 'endBar', 'endingId', 'startSelector', 'endSelector', 'xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
  }
  static get editableAttributes() {
    return ['xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
  }

  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoVolta.defaults, SmoVolta.attributes, this, params);
    params.ctor = 'SmoVolta';
    return params;
  }

  static readonly defaults: SmoVoltaParams = {
    startBar: 1,
    endBar: 1,
    xOffsetStart: 0,
    xOffsetEnd: 0,
    yOffset: 20,
    number: 1
  }

  toVexVolta(measureNumber: number) {
    if (this.startBar === measureNumber && this.startBar === this.endBar) {
      return VF.Volta.type.BEGIN_END;
    }
    if (this.startBar === measureNumber) {
      return VF.Volta.type.BEGIN;
    }
    if (this.endBar === measureNumber) {
      return VF.Volta.type.END;
    }
    if (this.startBar < measureNumber && this.endBar > measureNumber) {
      return VF.Volta.type.MID;
    }
    return VF.Volta.type.NONE;
  }
}

export interface SmoMeasureTextParams {
  position: number,
  fontInfo: FontInfo,
  text: string,
  adjustX: number,
  adjustY: number,
  justification: number
}
export class SmoMeasureText extends SmoMeasureModifierBase {
  static readonly positions: Record<string, number> = {
    above: 0, below: 1, left: 2, right: 3, none: 4
  }

  static readonly justifications: Record<string, number> = {
    left: 0, right: 1, center: 2
  }

  static readonly _positionToString: string[] = ['above', 'below', 'left', 'right']

  static get toVexPosition() {
    return [VF.Modifier.Position.ABOVE, VF.Modifier.Position.BELOW, VF.Modifier.Position.LEFT, VF.Modifier.Position.RIGHT];
  }
  static get toVexJustification() {
    return [VF.TextNote.LEFT, VF.TextNote.RIGHT, VF.TextNote.CENTER];
  }

  toVexJustification() {
    return SmoMeasureText.toVexJustification[this.justification];
  }
  toVexPosition() {
    return SmoMeasureText.toVexPosition[parseInt(this.position as any, 10)];
  }
  static get attributes() {
    return ['position', 'fontInfo', 'text', 'adjustX', 'adjustY', 'justification'];
  }

  static readonly defaults: SmoMeasureTextParams = {
    position: SmoMeasureText.positions.above,
    fontInfo: {
      size: 9,
      family: 'times',
      style: 'normal',
      weight: 'normal'
    },
    text: 'Smo',
    adjustX: 0,
    adjustY: 0,
    justification: SmoMeasureText.justifications.center
  }
  justification: number = SmoMeasureText.justifications.center;
  position: number = SmoMeasureText.positions.above;
  fontInfo: FontInfo = {
    size: 9,
    family: 'times',
    style: 'normal',
    weight: 'normal'
  };
  serialize() {
    var params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoMeasureText.defaults, SmoMeasureText.attributes, this, params);
    params.ctor = 'SmoMeasureText';
    return params;
  }

  constructor(parameters: SmoMeasureTextParams | null) {
    super('SmoMeasureText');
    let pobj = parameters as any;
    if (pobj === null) {
      pobj = SmoMeasureText.defaults;
    }
    smoSerialize.serializedMerge(SmoMeasureText.attributes, SmoMeasureText.defaults, this);
    smoSerialize.serializedMerge(SmoMeasureText.attributes, pobj, this);

    // right-justify left text and left-justify right text by default
    if (!pobj.justification) {
      // eslint-disable-next-line
      this.justification = (this.position === SmoMeasureText.positions.left) ? SmoMeasureText.justifications.right :
        (this.position === SmoMeasureText.positions.right ? SmoMeasureText.justifications.left : this.justification);
    }
  }
}

export interface SmoRehearsalMarkParams {
  position: number,
  cardinality: string,
  symbol: string,
  increment: boolean
}
export class SmoRehearsalMark extends SmoMeasureModifierBase {
  static readonly cardinalities: Record<string, string> = {
    capitals: 'capitals', lowerCase: 'lowerCase', numbers: 'numbers'
  }
  static readonly positions: Record<string, number> = {
    above: 0, below: 1, left: 2, right: 3
  }

  static get _positionToString(): string[] {
    return ['above', 'below', 'left', 'right'];
  }

  // TODO: positions don't work.
  static get defaults(): SmoRehearsalMarkParams {
    return {
      position: SmoRehearsalMark.positions.above,
      cardinality: SmoRehearsalMark.cardinalities.capitals,
      symbol: 'A',
      increment: true
    };
  }
  static get attributes() {
    return ['cardinality', 'symbol', 'position', 'increment'];
  }
  position: number = SmoRehearsalMark.positions.above;
  cardinality: string = SmoRehearsalMark.cardinalities.capitals;
  symbol: string = 'A';
  increment: boolean = true;

  getIncrement() {
    if (!(this.cardinality !== 'number')) {
      const code = this.symbol.charCodeAt(0) + 1;
      const symbol = String.fromCharCode(code);
      return symbol;
    } else {
      return (parseInt(this.symbol, 10) + 1).toString();
    }
  }
  getInitial() {
    // eslint-disable-next-line
    return this.cardinality === SmoRehearsalMark.cardinalities.capitals ? 'A' :
      (this.cardinality === SmoRehearsalMark.cardinalities.lowerCase ? 'a' : '1');
  }
  serialize() {
    var params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoRehearsalMark.defaults, SmoRehearsalMark.attributes, this, params);
    params.ctor = 'SmoRehearsalMark';
    return params;
  }
  constructor(parameters: SmoRehearsalMarkParams) {
    super('SmoRehearsalMark');
    let pobj = parameters;
    if (typeof(pobj) === 'undefined' || pobj === null) {
      pobj = SmoRehearsalMark.defaults;
    }
    smoSerialize.serializedMerge(SmoRehearsalMark.attributes, SmoRehearsalMark.defaults, this);
    smoSerialize.serializedMerge(SmoRehearsalMark.attributes, pobj, this);
    if (!pobj.symbol) {
      this.symbol = this.getInitial();
    }
  }
}

export interface SmoTempoTextParams {
  tempoMode: string,
  bpm: number,
  beatDuration: number,
  tempoText: string,
  yOffset: number,
  display: false,
  customText: ''
}
// ### SmoTempoText
// Tempo marking and also the information about the tempo.
export class SmoTempoText extends SmoMeasureModifierBase {
  static get tempoModes(): Record<string, string> {
    return {
      durationMode: 'duration',
      textMode: 'text',
      customMode: 'custom'
    };
  }
  static get tempoTexts(): Record<string, string> {
    return {
      larghissimo: 'Larghissimo',
      grave: 'Grave',
      lento: 'Lento',
      largo: 'Largo',
      larghetto: 'Larghetto',
      adagio: 'Adagio',
      adagietto: 'Adagietto',
      andante_moderato: 'Andante moderato',
      andante: 'Andante',
      andantino: 'Andantino',
      moderator: 'Moderato',
      allegretto: 'Allegretto',
      allegro: 'Allegro',
      vivace: 'Vivace',
      presto: 'Presto',
      prestissimo: 'Prestissimo'
    };
  }

  static get defaults(): SmoTempoTextParams {
    return {
      tempoMode: SmoTempoText.tempoModes.durationMode,
      bpm: 120,
      beatDuration: 4096,
      tempoText: SmoTempoText.tempoTexts.allegro,
      yOffset: 0,
      display: false,
      customText: ''
    };
  }
  static get attributes() {
    return ['tempoMode', 'bpm', 'display', 'beatDuration', 'tempoText', 'yOffset', 'customText'];
  }
  tempoMode: string = SmoTempoText.tempoModes.durationMode
  bpm: number = 120;
  beatDuration: number = 4096;
  tempoText: string = 'Allegro';
  yOffset: number = 0;
  display: boolean = false;
  customText: string = '';

  compare(instance: SmoTempoText) {
    var rv = true;
    SmoTempoText.attributes.forEach((attr) => {
      if ((this as any)[attr] !== (instance as any)[attr]) {
        rv = false;
      }
    });
    return rv;
  }
  _toVexTextTempo() {
    return { name: this.tempoText };
  }

  // ### eq
  // Return equality wrt the tempo marking, e.g. 2 allegro in textMode will be equal but
  // an allegro and duration 120bpm will not.
  static eq(t1: SmoTempoText, t2: SmoTempoText) {
    if (t1.tempoMode !== t2.tempoMode) {
      return false;
    }
    if (t1.tempoMode === SmoTempoText.tempoModes.durationMode) {
      return t1.bpm === t2.bpm && t1.beatDuration === t2.beatDuration;
    }
    if (t1.tempoMode === SmoTempoText.tempoModes.textMode) {
      return t1.tempoText === t2.tempoText;
    } else {
      return t1.bpm === t2.bpm && t1.beatDuration === t2.beatDuration &&
        t1.tempoText === t2.tempoText;
    }
  }

  static get bpmFromText(): Record<string, number> {
    const rv: any = {};
    rv[SmoTempoText.tempoTexts.larghissimo] = 24;
    rv[SmoTempoText.tempoTexts.grave] = 40;
    rv[SmoTempoText.tempoTexts.lento] = 45;
    rv[SmoTempoText.tempoTexts.largo] = 40;
    rv[SmoTempoText.tempoTexts.larghetto] = 60;
    rv[SmoTempoText.tempoTexts.adagio] = 72;
    rv[SmoTempoText.tempoTexts.adagietto] = 72;
    rv[SmoTempoText.tempoTexts.andante_moderato] = 72;
    rv[SmoTempoText.tempoTexts.andante] = 84;
    rv[SmoTempoText.tempoTexts.andantino] = 92;
    rv[SmoTempoText.tempoTexts.moderator] = 96;
    rv[SmoTempoText.tempoTexts.allegretto] = 96;
    rv[SmoTempoText.tempoTexts.allegro] = 120;
    rv[SmoTempoText.tempoTexts.vivace] = 144;
    rv[SmoTempoText.tempoTexts.presto] = 168;
    rv[SmoTempoText.tempoTexts.prestissimo] = 240;

    return rv as Record<string, number>;
  }

  _toVexDurationTempo() {
    var vd = smoMusic.ticksToDuration[this.beatDuration];
    var dots = (vd.match(/d/g) || []).length;
    vd = vd.replace(/d/g, '');
    const rv: any = { duration: vd, dots, bpm: this.bpm };
    if (this.customText.length) {
      rv.name = this.customText;
    }
    return rv;
  }
  toVexTempo() {
    if (this.tempoMode === SmoTempoText.tempoModes.durationMode ||
      this.tempoMode === SmoTempoText.tempoModes.customMode) {
      return this._toVexDurationTempo();
    }
    return this._toVexTextTempo();
  }
  serialize() {
    var params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoTempoText.defaults, SmoTempoText.attributes, this, params);
    params.ctor = 'SmoTempoText';
    return params;
  }
  constructor(parameters: SmoTempoTextParams | null) {
    super('SmoTempoText');
    let pobj: any = parameters;
    if (typeof(pobj) === 'undefined' || pobj === null) {
      pobj = {};
    }
    smoSerialize.serializedMerge(SmoTempoText.attributes, SmoTempoText.defaults, this);
    smoSerialize.serializedMerge(SmoTempoText.attributes, pobj, this);
  }
}