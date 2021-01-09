
// ## Measure modifiers are elements that are attached to the bar itself, like barlines or measure-specific text,
// repeats - lots of stuff
class SmoMeasureModifierBase {
  constructor(ctor) {
    this.ctor = ctor;
    if (!this['attrs']) {
      this.attrs = {
        id: VF.Element.newID(),
        type: ctor
      };
    } else {
      console.log('inherit attrs');
    }
  }
  static deserialize(jsonObj) {
    const ctor = eval(jsonObj.ctor);
    const rv = new ctor(jsonObj);
    return rv;
  }
}

class SmoBarline extends SmoMeasureModifierBase {
  static get positions() {
    return {
      start: 0,
      end: 1
    }
  };

  static get barlines() {
    return {
      singleBar: 0,
      doubleBar: 1,
      endBar: 2,
      startRepeat: 3,
      endRepeat: 4,
      noBar: 5
    }
  }

  static get _barlineToString() {
    return  ['singleBar', 'doubleBar', 'endBar', 'startRepeat', 'endRepeat', 'noBar'];
  }
  static barlineString(inst) {
    return SmoBarline._barlineToString[inst.barline];
  }

  static get defaults() {
    return {
      position: SmoBarline.positions.end,
      barline: SmoBarline.barlines.singleBar
    };
  }

  static get attributes() {
    return ['position', 'barline'];
  }
  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoBarline.defaults, SmoBarline.attributes, this, params);
    params.ctor = 'SmoBarline';
    return params;
  }

  constructor(parameters) {
    super('SmoBarline');
    parameters = typeof(parameters) !== 'undefined' ? parameters : {};
    smoSerialize.serializedMerge(SmoBarline.attributes, SmoBarline.defaults, this);
    smoSerialize.serializedMerge(SmoBarline.attributes, parameters, this);
  }

  static get toVexBarline() {
    return [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
      VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];

  }
  static get toVexPosition() {
    return [VF.StaveModifier.BEGIN, VF.StaveModifier.END];
  }

  toVexBarline() {
    return SmoBarline.toVexBarline[this.barline];
  }
  toVexPosition() {
    return SmoBarline.toVexPosition[this.position];
  }
}

class SmoRepeatSymbol extends SmoMeasureModifierBase {
  static get symbols() {
    return {
      None: 0,
      Coda: 1,
      Segno: 2,
      Dc: 3,
      ToCoda:1,
      DcAlCoda: 4,
      DcAlFine: 5,
      Ds: 6,
      DsAlCoda: 7,
      DsAlFine: 8,
      Fine: 9
    };
  }

  static get defaultXOffset() {
    return [0, 0, 0, -20, -60, -60, -50, -60, -50, -40];
  }
  static get positions() {
    return {
      start: 0,
      end: 1
    }
  };
  static get defaults() {
    return {
      symbol: SmoRepeatSymbol.Coda,
      xOffset: 0,
      yOffset: 30,
      position: SmoRepeatSymbol.positions.end
    }
  }
  static get toVexSymbol() {
    return [VF.Repetition.type.NONE, VF.Repetition.type.CODA_LEFT, VF.Repetition.type.SEGNO_LEFT, VF.Repetition.type.DC,
      VF.Repetition.type.DC_AL_CODA, VF.Repetition.type.DC_AL_FINE, VF.Repetition.type.DS,
      VF.Repetition.type.DS_AL_CODA, VF.Repetition.type.DS_AL_FINE, VF.Repetition.type.FINE];
  }
  static get attributes() {
    return ['symbol', 'xOffset', 'yOffset', 'position'];
  }
  toVexSymbol() {
    return SmoRepeatSymbol.toVexSymbol[this.symbol];
  }
  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoRepeatSymbol.defaults, SmoRepeatSymbol.attributes, this, params);
    params.ctor = 'SmoRepeatSymbol';
    return params;
  }
  constructor(parameters) {
    super('SmoRepeatSymbol');
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
    this.xOffset = SmoRepeatSymbol.defaultXOffset[parameters.symbol];
    smoSerialize.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
  }
}

class SmoVolta extends SmoMeasureModifierBase {
  constructor(parameters) {
    super('SmoVolta');
    this.original = {};
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
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoVolta.defaults, SmoVolta.attributes, this, params);
    params.ctor = 'SmoVolta';
    return params;
  }

  static get defaults() {
    return {
      startBar: 1,
      endBar: 1,
      xOffsetStart: 0,
      xOffsetEnd: 0,
      yOffset: 20,
      number: 1
    }
  }

 backupOriginal() {
    if (!this['original']) {
      this.original = {};
      smoSerialize.filteredMerge(
        SmoVolta.attributes,
        this, this.original);
    }
  }
  restoreOriginal() {
    if (this['original']) {
      smoSerialize.filteredMerge(
        SmoVolta.attributes,
        this.original, this);
      this.original = null;
    }
  }

  toVexVolta(measureNumber) {
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

class SmoMeasureText extends SmoMeasureModifierBase {
  static get positions() {
    return {above:0,below:1,left:2,right:3,none:4};
  }

  static get justifications() {
    return {left:0,right:1,center:2}
  }

  static get _positionToString() {
    return ['above','below','left','right'];
  }

  static get toVexPosition() {
    return [VF.Modifier.Position.ABOVE,VF.Modifier.Position.BELOW,VF.Modifier.Position.LEFT,VF.Modifier.Position.RIGHT];
  }
  static get toVexJustification() {
    return [VF.TextNote.LEFT,VF.TextNote.RIGHT,VF.TextNote.CENTER];
  }

  toVexJustification() {
    return SmoMeasureText.toVexJustification[this.justification];
  }
  toVexPosition() {
    return SmoMeasureText.toVexPosition[parseInt(this.position)];
  }
  static get attributes() {
    return ['position','fontInfo','text','adjustX','adjustY','justification'];
  }

  static get defaults() {
    return {
      position:SmoMeasureText.positions.above,
      fontInfo: {
        size: '9',
        family:'times',
        style:'normal',
        weight:'normal'
      },
      text:'Smo',
      adjustX:0,
      adjustY:0,
      justification:SmoMeasureText.justifications.center
    };
  }
  serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoMeasureText.defaults,SmoMeasureText.attributes,this,params)
        params.ctor = 'SmoMeasureText';
        return params;
  }

  constructor(parameters) {
    super('SmoMeasureText');
        parameters = parameters ? parameters : {};
        smoSerialize.serializedMerge(SmoMeasureText.attributes, SmoMeasureText.defaults, this);
        smoSerialize.serializedMerge(SmoMeasureText.attributes, parameters, this);

    // right-justify left text and left-justify right text by default
    if (!parameters['justification']) {
      this.justification = (this.position === SmoMeasureText.positions.left) ? SmoMeasureText.justifications.right :
           (this.position === SmoMeasureText.positions.right ? SmoMeasureText.justifications.left : this.justification);
    }
  }
}

class SmoRehearsalMark extends SmoMeasureModifierBase {

  static get cardinalities() {
    return {capitals:'capitals',lowerCase:'lowerCase',numbers:'numbers'};
  }
  static get positions() {
    return {above:0,below:1,left:2,right:3};
  }
  static get _positionToString() {
    return ['above','below','left','right'];
  }

  // TODO: positions don't work.
  static get defaults() {
    return {
      position:SmoRehearsalMark.positions.above,
      cardinality:SmoRehearsalMark.cardinalities.capitals,
      symbol:'A',
            increment:true
    }
  }
  static get attributes() {
    return ['cardinality','symbol','position','increment'];
  }
  getIncrement() {
    if (!this.cardinality != 'number') {
      var code = this.symbol.charCodeAt(0);
      code += 1;
      var symbol=String.fromCharCode(code);
      return symbol;
    } else {
            return parseInt(symbol)+1;
        }
  }
    getInitial() {
        return this.cardinality == SmoRehearsalMark.cardinalities.capitals ? 'A' :
            (this.cardinality == SmoRehearsalMark.cardinalities.lowerCase ? 'a' : '1');
    }
  serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoRehearsalMark.defaults,SmoRehearsalMark.attributes,this,params)
        params.ctor = 'SmoRehearsalMark';
        return params;
  }
  constructor(parameters) {
    super('SmoRehearsalMark');
        parameters = parameters ? parameters : {};
        smoSerialize.serializedMerge(SmoRehearsalMark.attributes, SmoRehearsalMark.defaults, this);
        smoSerialize.serializedMerge(SmoRehearsalMark.attributes, parameters, this);
        if (!parameters.symbol) {
            this.symbol=this.getInitial();
        }
  }
}


// ### SmoTempoText
// Tempo marking and also the information about the tempo.
class SmoTempoText extends SmoMeasureModifierBase {
  static get tempoModes() {
    return {
      durationMode: 'duration',
      textMode: 'text',
      customMode: 'custom'
    };
  }

  static get tempoTexts() {
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

  static get defaults() {
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
  compare(instance) {
    var rv = true;
    SmoTempoText.attributes.forEach((attr) => {
      if (this[attr] != instance[attr]) {
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
  static eq (t1,t2) {
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

  static get bpmFromText() {
    // TODO: learn these
    var rv = {};
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
    return rv;
  }

  _toVexDurationTempo() {
    var vd = smoMusic.ticksToDuration[this.beatDuration];
    var dots = (vd.match(/d/g) || []).length;
    vd = vd.replace(/d/g, '');
    const rv = { duration: vd, dots: dots, bpm: this.bpm };
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
  backupOriginal() {
    this.backup = {};
    smoSerialize.serializedMerge(SmoTempoText.attributes, this, this.backup);
  }
  restoreOriginal() {
    smoSerialize.serializedMerge(SmoTempoText.attributes, this.backup, this);
  }
  serialize() {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoTempoText.defaults, SmoTempoText.attributes, this, params)
    params.ctor = 'SmoTempoText';
    return params;
  }
  constructor(parameters) {
    super('SmoTempoText');
    parameters = typeof(parameters) !== 'undefined' ? parameters : {};
    smoSerialize.serializedMerge(SmoTempoText.attributes, SmoTempoText.defaults, this);
    smoSerialize.serializedMerge(SmoTempoText.attributes, parameters, this);
  }
}
