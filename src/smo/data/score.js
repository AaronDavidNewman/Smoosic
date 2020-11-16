// ## SmoScore
// ## Description:
// The whole score.
// ## Score methods:
// ---
// eslint-disable-next-line no-unused-vars
class SmoScore {
  constructor(params) {
    Vex.Merge(this, SmoScore.defaults);
    Vex.Merge(this, params);
    if (!this.layout.pages) {
      this.layout.pages = 1;
    }
    if (this.staves.length) {
      this._numberStaves();
    }
  }
  static get engravingFonts() {
    return { Bravura: 'Bravura', Gonville: 'Gonville', Petaluma: 'Petaluma' };
  }
  static get zoomModes() {
    return { fitWidth: 0, wholePage: 1, zoomScale: 2 };
  }
  static get fontPurposes() {
    return { ENGRAVING: 1, SCORE: 2, CHORDS: 3, LYRICS: 4 };
  }
  static get defaults() {
    return {
      layout: {
        leftMargin: 30,
        rightMargin: 30,
        topMargin: 40,
        bottomMargin: 40,
        pageWidth: 8 * 96 + 48,
        pageHeight: 11 * 96,
        orientation: SmoScore.orientations.portrait,
        interGap: 30,
        intraGap: 10,
        svgScale: 1.0,
        zoomScale: 2.0,
        zoomMode: SmoScore.zoomModes.fitWidth,
        pages: 1
      },
      fonts: [
        { name: 'engraving', purpose: SmoScore.fontPurposes.ENGRAVING, family: 'Bravura', size: 1, custom: false },
        { name: 'score', purpose: SmoScore.fontPurposes.SCORE, family: 'Merriweather', size: 14, custom: false },
        { name: 'chords', purpose: SmoScore.fontPurposes.CHORDS, family: 'Roboto Slab', size: 14, custom: false  },
        { name: 'lyrics', purpose: SmoScore.fontPurposes.LYRICS, family: 'Merriweather', size: 12, custom: false }
      ],
      staffWidth: 1600,
      startIndex: 0,
      renumberingMap: {},
      keySignatureMap: {},
      measureTickmap: [],
      staves: [],
      activeStaff: 0,
      scoreText: [],
      textGroups: [],
      systemGroups: []
    };
  }
  static get pageSizes() {
    return ['letter', 'tabloid', 'A4', 'custom'];
  }
  static get pageDimensions() {
    return {
      'letter': { width: 8 * 96 + 48, height: 11 * 96 },
      'tabloid': { width: 1056, height: 1632 },
      'A4': { width: 794, height: 1122 },
      'custom': { width: 1, height: 1 }
    };
  }

  static get orientationLabels() {
    return ['portrait', 'landscape'];
  }
  static get orientations() {
    return { 'portrait': 0, 'landscape': 1 };
  }

  static get defaultAttributes() {
    return ['layout', 'startIndex', 'renumberingMap', 'renumberIndex', 'fonts'];
  }

  serializeColumnMapped() {
    const attrColumnHash = {};
    const attrCurrentValue  = {};
    this.staves[0].measures.forEach((measure) => {
      measure.serializeColumnMapped(attrColumnHash, attrCurrentValue);
    });
    return attrColumnHash;
  }

  // ### deserializeColumnMapped
  // Column-mapped attributes stay the same in each measure until
  // changed, like key-signatures.  We don't store each measure value to
  // make the files smaller
  static deserializeColumnMapped(scoreObj) {
    let curValue = 0;
    let mapIx = 0;
    if (!scoreObj.columnAttributeMap) {
      return;
    }
    const attrs = Object.keys(scoreObj.columnAttributeMap);
    scoreObj.staves.forEach((staff) => {
      const attrIxMap = {};
      attrs.forEach((attr) => {
        attrIxMap[attr] = 0;
      });

      staff.measures.forEach((measure) => {
        attrs.forEach((attr) => {
          mapIx = attrIxMap[attr];
          const curHash = scoreObj.columnAttributeMap[attr];
          const attrKeys = Object.keys(curHash);
          curValue = curHash[attrKeys[mapIx.toString()]];
          attrKeys.sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1);
          if (attrKeys.length > mapIx + 1) {
            if (measure.measureNumber.measureIndex >= attrKeys[mapIx + 1]) {
              mapIx += 1;
              curValue = curHash[attrKeys[mapIx.toString()]];
            }
          }
          measure[attr] = curValue;
          attrIxMap[attr] = mapIx;
        });
      });
    });
  }

  // ### serialize
  // ### Serialize the score.  The resulting JSON string will contain all the staves, measures, etc.
  serialize() {
    const params = {};
    let obj = {
      score: params,
      staves: [],
      scoreText: [],
      textGroups: [],
      systemGroups: []
    };
    smoSerialize.serializedMerge(SmoScore.defaultAttributes, this, params);
    this.staves.forEach((staff) => {
      obj.staves.push(staff.serialize());
    });
    // Score text is not part of text group, so don't save separately.
    this.textGroups.forEach((tg) => {
      if (tg.isTextVisible()) {
        obj.textGroups.push(tg.serialize());
      }
    });
    this.systemGroups.forEach((gg) => {
      obj.systemGroups.push(gg.serialize());
    });
    obj.columnAttributeMap = this.serializeColumnMapped();
    smoSerialize.jsonTokens(obj);
    obj = smoSerialize.detokenize(obj, smoSerialize.tokenValues);
    obj.dictionary = smoSerialize.tokenMap;
    return obj;
  }

  // ### deserialize
  // Restore an earlier JSON string.  Unlike other deserialize methods, this one expects the string.
  static deserialize(jsonString) {
    let jsonObj = JSON.parse(jsonString);
    if (jsonObj.dictionary) {
      jsonObj = smoSerialize.detokenize(jsonObj, jsonObj.dictionary);
    }
    const params = {};
    const staves = [];
    jsonObj.textGroups = jsonObj.textGroups ? jsonObj.textGroups : [];

    // Explode the sparse arrays of attributes into the measures
    SmoScore.deserializeColumnMapped(jsonObj);
    smoSerialize.serializedMerge(
      SmoScore.defaultAttributes,
      jsonObj.score, params);
    jsonObj.staves.forEach((staffObj) => {
      const staff = SmoSystemStaff.deserialize(staffObj);
      staves.push(staff);
    });
    const scoreText = [];
    jsonObj.scoreText.forEach((tt) => {
      const st = SmoScoreModifierBase.deserialize(tt);
      st.autoLayout = false; // since this has been layed out, presumably, before save
      st.classes = 'score-text ' + st.attrs.id;
      scoreText.push(st);
    });

    const textGroups = [];
    jsonObj.textGroups.forEach((tg) => {
      textGroups.push(SmoTextGroup.deserialize(tg));
    });

    const systemGroups = [];
    if (jsonObj.systemGroups) {
      jsonObj.systemGroups.forEach((tt) => {
        var st = SmoScoreModifierBase.deserialize(tt);
        st.autoLayout = false; // since this has been layed out, presumably, before save
        systemGroups.push(st);
      });
    }
    params.staves = staves;

    const score = new SmoScore(params);
    score.scoreText = scoreText;
    score.textGroups = textGroups;
    score.systemGroups = systemGroups;
    return score;
  }

  // ### getDefaultScore
  // Gets a score consisting of a single measure with all the defaults.
  static getDefaultScore(scoreDefaults, measureDefaults) {
    scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
    measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
    const score = new SmoScore(scoreDefaults);
    score.addStaff({ measureDefaults });
    const measure = SmoMeasure.getDefaultMeasure(measureDefaults);
    score.addMeasure(0, measure);
    measure.voices.push({
      notes: SmoMeasure.getDefaultNotes(measureDefaults)
    });
    return score;
  }

  // ### getEmptyScore
  // Create a score object, but don't populate it with anything.
  static getEmptyScore(scoreDefaults) {
    const score = new SmoScore(scoreDefaults);
    score.addStaff();
    return score;
  }

  // ### _numberStaves
  // recursively renumber staffs and measures.
  _numberStaves() {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const stave = this.staves[i];
      stave.staffId = i;
      stave.numberMeasures();
    }
  }

  // ### addDefaultMeasureWithNotes
  // ### Description:
  // Add a measure to the score with the supplied parameters at the supplied index.
  // The defaults per staff may be different depending on the clef, key of the staff.
  addDefaultMeasureWithNotes(measureIndex, parameters) {
    this.staves.forEach((staff) => {
      const defaultMeasure =
        SmoMeasure.getDefaultMeasureWithNotes(parameters);
      staff.addMeasure(measureIndex, defaultMeasure);
    });
  }

  // ### deleteMeasure
  // Delete the measure at the supplied index in all the staves.
  deleteMeasure(measureIndex) {
    this.staves.forEach((staff) => {
      staff.deleteMeasure(measureIndex);
    });
    this.textGroups.forEach((tg) => {
      if (tg.attachToSelector && tg.selector.measure >= measureIndex && tg.selector.measure > 0) {
        tg.selector.measure -= 1;
      }
    });
  }

  convertToPickupMeasure(measureIndex, duration) {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const staff = this.staves[i];
      const protomeasure = staff.measures[measureIndex].pickupMeasure(duration);
      staff.measures[measureIndex] = protomeasure;
    }
    this._numberStaves();
  }

  addPickupMeasure(measureIndex, duration) {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const staff = this.staves[i];
      const protomeasure = staff.measures[measureIndex].pickupMeasure(duration);
      staff.addMeasure(measureIndex, protomeasure);
    }
    this._numberStaves();
  }

  // ### addMeasure
  // Give a measure prototype, create a new measure and add it to each staff, with the
  // correct settings for current time signature/clef.
  addMeasure(measureIndex, measure) {
    let i = 0;
    let protomeasure = 0;
    for (i = 0; i < this.staves.length; ++i) {
      protomeasure = measure;
      const staff = this.staves[i];

      // Since this staff may already have instrument settings, use the
      // immediately preceeding or post-ceding measure if it exists.
      if (measureIndex < staff.measures.length) {
        protomeasure = staff.measures[measureIndex];
      } else if (staff.measures.length) {
        protomeasure = staff.measures[staff.measures.length - 1];
      }
      const nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
      if (nmeasure.voices.length <= nmeasure.getActiveVoice()) {
        nmeasure.setActiveVoice(0);
      }
      staff.addMeasure(measureIndex, nmeasure);
    }
    // Update offsets for score modifiers that have a selector
    this.textGroups.forEach((tg) => {
      if (tg.attachToSelector && tg.selector.measure >= measureIndex && tg.selector.measure < this.staves[0].measures.length) {
        tg.selector.measure += 1;
      }
    });
    this._numberStaves();
  }

  // ### replaceMeasure
  // Replace the measure at the given location.  Probably due to an undo operation or paste.
  replaceMeasure(selector, measure) {
    var staff = this.staves[selector.staff];
    staff.measures[selector.measure] = measure;
  }

  getSystemGroupForStaff(selection) {
    const exist = this.systemGroups.find((sg) =>
      sg.startSelector.staff <= selection.staff.staffId &&
        sg.endSelector.staff >= selection.staff.staffId &&
        (sg.mapType === SmoSystemGroup.mapTypes.allMeasures ||
        (sg.startSelector.measure <= selection.measure.measureNumber.measureIndex &&
        sg.endSelector.measure >= selection.measure.measureNumber.measureIndex))
    );
    return exist;
  }

  addOrReplaceSystemGroup(newGroup) {
    this.systemGroups = this.systemGroups.filter((sg) =>
      sg.startSelector.staff >= newGroup.startSelector.staff ||
        sg.endSelector.staff <= newGroup.startSelector.staff ||
        (newGroup.mapType === SmoSystemGroup.mapType.measureMap &&
        sg.mapType ===  SmoSystemGroup.mapType.measureMap &&
        (sg.startSelector.measure >= newGroup.startSelector.measure ||
        sg.endSelector.measure <= newGroup.startSelector.measure))
    );
    this.systemGroups.push(newGroup);
  }

  // ### replace staff
  // Probably due to an undo operation, replace the staff at the given index.
  replaceStaff(index, staff) {
    const staves = [];
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      if (i !== index) {
        staves.push(this.staves[i]);
      } else {
        staves.push(staff);
      }
    }
    this.staves = staves;
  }
  // ### addKeySignature
  // Add a key signature at the specified index in all staves.
  addKeySignature(measureIndex, key) {
    this.staves.forEach((staff) => {
      staff.addKeySignature(measureIndex, key);
    });
  }

  // ### addInstrument
  // add a new staff (instrument) to the score
  addStaff(parameters) {
    let i = 0;
    if (this.staves.length === 0) {
      this.staves.push(new SmoSystemStaff(parameters));
      this.activeStaff = 0;
      return;
    }
    if (!parameters) {
      parameters = SmoSystemStaff.defaults;
    }
    const proto = this.staves[0];
    const measures = [];
    for (i = 0; i < proto.measures.length; ++i) {
      const newParams = {};
      const measure = proto.measures[i];
      smoSerialize.serializedMerge(SmoMeasure.defaultAttributes, measure, newParams);
      newParams.clef = parameters.instrumentInfo.clef;
      newParams.transposeIndex = parameters.instrumentInfo.keyOffset;
      const newMeasure = SmoMeasure.getDefaultMeasureWithNotes(newParams);
      newMeasure.measureNumber = measure.measureNumber;
      newMeasure.modifiers = [];
      measure.modifiers.forEach((modifier) => {
        const ctor = eval(modifier.ctor);
        const nmod = new ctor(modifier);
        newMeasure.modifiers.push(nmod);
      });
      measures.push(newMeasure);
    }
    parameters.measures = measures;
    const staff = new SmoSystemStaff(parameters);
    this.staves.push(staff);
    this.activeStaff = this.staves.length - 1;
    this._numberStaves();
  }

  // ### removeStaff
  // Remove stave at the given index
  removeStaff(index) {
    const staves = [];
    let ix = 0;
    this.staves.forEach((staff) => {
      if (ix !== index) {
        staves.push(staff);
      }
      ix += 1;
    });
    this.staves = staves;
    this._numberStaves();
  }

  swapStaves(index1, index2) {
    if (this.staves.length < index1 || this.staves.length < index2) {
      return;
    }
    const tmpStaff = this.staves[index1];
    this.staves[index1] = this.staves[index2];
    this.staves[index2] = tmpStaff;
    this._numberStaves();
  }

  _updateScoreText(textObject, toAdd) {
    var texts = [];
    this.scoreText.forEach((tt) => {
      if (textObject.attrs.id !==  tt.attrs.id) {
        texts.push(tt);
      }
    });
    if (toAdd) {
      texts.push(textObject);
    }
    this.scoreText = texts;
  }

  _updateTextGroup(textGroup, toAdd) {
    const tgid = typeof(textGroup) === 'string' ? textGroup :
      textGroup.attrs.id;
    const ar = this.textGroups.filter((tg) => tg.attrs.id !== tgid);
    this.textGroups = ar;
    if (toAdd) {
      this.textGroups.push(textGroup);
    }
  }

  addTextGroup(textGroup) {
    this._updateTextGroup(textGroup, true);
  }
  getTextGroup() {
    return this.textGroups.find((tg) => tg.tgid === tg.attrs.id);
  }

  removeTextGroup(textGroup) {
    this._updateTextGroup(textGroup, false);
  }

  addScoreText(textObject) {
    this._updateScoreText(textObject, true);
  }

  getScoreText(id) {
    if (!this.scoreText.length) {
      return null;
    }
    const ar = this.scoreText.filter((tt) =>
      tt.attrs.id === id
    );
    if (ar.length) {
      return ar[0];
    }
    return null;
  }

  removeScoreText(textObject) {
    this._updateScoreText(textObject, false);
  }
  setLyricAdjustWidth(adjustNoteWidth) {
    this.staves.forEach((staff) => {
      staff.setLyricAdjustWidth(adjustNoteWidth);
    });
  }

  setChordAdjustWidth(adjustNoteWidth) {
    this.staves.forEach((staff) => {
      staff.setChordAdjustWidth(adjustNoteWidth);
    });
  }
  // ### setLyricFont
  // set the font for lyrics, which are the same for all lyrics in the score
  setLyricFont(fontInfo) {
    this.staves.forEach((staff) => {
      staff.setLyricFont(fontInfo);
    });

    const fontInst = this.fonts.find((fn) => fn.name === 'lyrics');
    fontInst.family = fontInfo.family;
    fontInst.size = fontInfo.size;
    fontInst.custom = true;
  }

  setChordFont(fontInfo) {
    this.staves.forEach((staff) => {
      staff.setChordFont(fontInfo);
    });
  }

  get measures() {
    if (this.staves.length === 0) {
      return [];
    }
    return this.staves[this.activeStaff].measures;
  }
  incrementActiveStaff(offset) {
    if (offset < 0) {
      offset = offset + this.staves.length;
    }
    const nextStaff = (this.activeStaff + offset) % this.staves.length;
    if (nextStaff >= 0 && nextStaff < this.staves.length) {
      this.activeStaff = nextStaff;
    }
    return this.activeStaff;
  }

  setActiveStaff(index) {
    this.activeStaff = index <= this.staves.length ? index : this.activeStaff;
  }

  getRenderedNote(id) {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const stave = this.staves[i];
      const note = stave.getRenderedNote(id);
      if (note) {
        note.selection.staffIndex = i;
        return note;
      }
    }
    return null;
  }
}
