// ## SmoSystemStaff
// A staff is a line of music that can span multiple measures.
// A system is a line of music for each staff in the score.  So a staff
// spans multiple systems.
// A staff modifier connects 2 points in the staff.
// eslint-disable-next-line no-unused-vars
class SmoSystemStaff {
  constructor(params) {
    this.measures = [];
    Vex.Merge(this, SmoSystemStaff.defaults);
    Vex.Merge(this, params);
    if (this.measures.length) {
      this.numberMeasures();
    }
    if (!this.attrs) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoSystemStaff'
      };
    }
  }

  // ### defaultParameters
  // the parameters that get saved with the score.
  static get defaultParameters() {
    return [
      'staffId', 'staffX', 'staffY', 'adjY', 'staffWidth', 'staffHeight', 'startIndex',
      'renumberingMap', 'keySignatureMap', 'instrumentInfo'];
  }

  // ### defaults
  // default values for all instances
  static get defaults() {
    return {
      staffX: 10,
      staffY: 40,
      adjY: 0,
      staffWidth: 1600,
      staffHeight: 90,
      startIndex: 0,
      staffId: 0,
      renumberingMap: { },
      keySignatureMap: { },
      instrumentInfo: {
        instrumentName: 'Treble Instrument',
        keyOffset: '0',
        clef: 'treble'
      },
      measures: [],
      modifiers: []
    };
  }

  // ### serialize
  // JSONify self.
  serialize() {
    const params = {};
    smoSerialize.serializedMerge(SmoSystemStaff.defaultParameters, this, params);
    params.modifiers = [];
    params.measures = [];

    this.measures.forEach((measure) => {
      params.measures.push(measure.serialize());
    });

    this.modifiers.forEach((modifier) => {
      params.modifiers.push(modifier.serialize());
    });

    return params;
  }

  // ### deserialize
  // parse formerly serialized staff.
  static deserialize(jsonObj) {
    const params = {};
    smoSerialize.serializedMerge(
      ['staffId', 'staffX', 'staffY', 'staffWidth',
        'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
      jsonObj, params);
    params.measures = [];
    jsonObj.measures.forEach((measureObj) => {
      const measure = SmoMeasure.deserialize(measureObj);
      params.measures.push(measure);
    });
    const rv = new SmoSystemStaff(params);
    if (jsonObj.modifiers) {
      jsonObj.modifiers.forEach((params) => {
        const mod = StaffModifierBase.deserialize(params);
        rv.modifiers.push(mod);
      });
    }
    return rv;
  }

  // ### addStaffModifier
  // add a staff modifier, or replace a modifier of same type
  // with same endpoints.
  addStaffModifier(modifier) {
    this.removeStaffModifier(modifier);
    this.modifiers.push(modifier);
  }

  // ### removeStaffModifier
  // Remove a modifier of given type and location
  removeStaffModifier(modifier) {
    const mods = [];
    this.modifiers.forEach((mod) => {
      if (mod.attrs.type !== modifier.attrs.type ||
        SmoSelector.neq(mod.startSelector, modifier.startSelector) ||
        SmoSelector.neq(mod.endSelector, modifier.endSelector)) {
        mods.push(mod);
      }
    });
    this.modifiers = mods;
  }

  // ### getModifiersAt
  // get any modifiers at the selected location
  getModifiersAt(selector) {
    const rv = [];
    this.modifiers.forEach((mod) => {
      if (SmoSelector.sameNote(mod.startSelector, selector)) {
        rv.push(mod);
      }
    });
    return rv;
  }
  getModifier(modData) {
    return this.getModifiers().find((mod) =>
      SmoSelector.eq(mod.startSelector, modData.startSelector) && mod.attrs.type === modData.attrs.type);
  }

  setLyricFont(fontInfo) {
    this.measures.forEach((measure) => {
      measure.setLyricFont(fontInfo);
    });
  }
  setLyricAdjustWidth(adjustNoteWidth) {
    this.measures.forEach((measure) => {
      measure.setLyricAdjustWidth(adjustNoteWidth);
    });
  }
  setChordFont(fontInfo) {
    this.measures.forEach((measure) => {
      measure.setChordFont(fontInfo);
    });
  }
  setChordAdjustWidth(adjustNoteWidth) {
    this.measures.forEach((measure) => {
      measure.setChordAdjustWidth(adjustNoteWidth);
    });
  }

  // ### getSlursStartingAt
  // like it says.  Used by audio player to slur notes
  getSlursStartingAt(selector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) && mod.attrs.type === 'SmoSlur'
    );
  }
  // ### getSlursEndingAt
  // like it says.
  getSlursEndingAt(selector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector)
    );
  }

  getTieStartingAt(selector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) && mod.attrs.type === 'SmoTie'
    );
  }
  getTieEndingAt(selector) {
    return this.modifiers.filter((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector) && mod.attrs.type === 'SmoTie'
    );
  }

  // ### accesor getModifiers
  getModifiers() {
    return this.modifiers;
  }

  // ### applyBeams
  // group all the measures' notes into beam groups.
  applyBeams() {
    for (let i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      smoBeamerFactory.applyBeams(measure);
    }
  }

  // ### getRenderedNote
  // used by mapper to get the rendered note from it's SVG DOM ID.
  getRenderedNote(id) {
    let i = 0;
    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      const note = measure.getRenderedNote(id);
      if (note) {
        return {
          smoMeasure: measure,
          smoNote: note.smoNote,
          smoSystem: this,
          selection: {
            measureIndex: measure.measureNumber.measureIndex,
            voice: measure.activeVoice,
            tick: note.tick,
            maxTickIndex: measure.notes.length,
            maxMeasureIndex: this.measures.length
          },
          type: note.smoNote.attrs.type,
          id: note.smoNote.attrs.id
        };
      }
    }
    return null;
  }

  // ### addRehearsalMark
  // for all measures in the system, and also bump the
  // auto-indexing
  addRehearsalMark(index, parameters) {
    let i = 0;
    let symbol = '';
    var mark = new SmoRehearsalMark(parameters);
    if (!mark.increment) {
      this.measures[index].addRehearsalMark(mark);
      return;
    }

    symbol = mark.symbol;
    for (i = 0; i < this.measures.length; ++i) {
      const mm = this.measures[i];
      if (i < index) {
        const rm = mm.getRehearsalMark();
        if (rm && rm.cardinality === mark.cardinality && rm.increment) {
          symbol = rm.getIncrement();
          mark.symbol = symbol;
        }
      }
      if (i === index) {
        mm.addRehearsalMark(mark);
        symbol = mark.getIncrement();
      }
      if (i > index) {
        const rm = mm.getRehearsalMark();
        if (rm && rm.cardinality === mark.cardinality && rm.increment) {
          rm.symbol = symbol;
          symbol = rm.getIncrement();
        }
      }
    }
  }

  removeTempo(index) {
    this.measures[index].removeTempo();
  }

  addTempo(tempo, index) {
    this.measures[index].addTempo(tempo);
  }

  // ### removeRehearsalMark
  // for all measures in the system, and also decrement the
  // auto-indexing
  removeRehearsalMark(index) {
    let ix = 0;
    let symbol = null;
    let card = null;
    this.measures.forEach((measure) => {
      if (ix === index) {
        const mark = measure.getRehearsalMark();
        if (mark) {
          symbol = mark.symbol;
          card = mark.cardinality;
        }
        measure.removeRehearsalMark();
      }
      if (ix > index && symbol && card) {
        const mark = measure.getRehearsalMark();
        if (mark && mark.increment) {
          mark.symbol = symbol;
          symbol = mark.getIncrement();
        }
      }
      ix += 1;
    });
  }

  // ### deleteMeasure
  // delete the measure, and any staff modifiers that start/end there.
  deleteMeasure(index) {
    if (this.measures.length < 2) {
      return; // don't delete last measure.
    }
    const nm = [];
    this.measures.forEach((measure) => {
      if (measure.measureNumber.measureIndex !== index) {
        nm.push(measure);
      }
    });
    const sm = [];
    this.modifiers.forEach((mod) => {
      // Bug: if we are deleting a measure before the selector, change the measure number.
      if (mod.startSelector.measure !== index && mod.endSelector.measure !== index) {
        if (index < mod.startSelector.measure) {
          mod.startSelector.measure -= 1;
        }
        if (index < mod.endSelector.measure) {
          mod.endSelector.measure -= 1;
        }
        sm.push(mod);
      }
    });
    this.measures = nm;
    this.modifiers = sm;
    this.numberMeasures();
  }

  // ### addKeySignature
  // Add key signature to the given measure and update map so we know
  // when it changes, cancels etc.
  addKeySignature(measureIndex, key) {
    this.keySignatureMap[measureIndex] = key;
    const target = this.measures[measureIndex];
    target.keySignature = key;
  }

  // ### removeKeySignature
  // remove key signature and update map so we know
  // when it changes, cancels etc.
  removeKeySignature(measureIndex) {
    const keys = Object.keys(this.keySignatureMap);
    const nmap = {};
    keys.forEach((key) => {
      if (key !== measureIndex) {
        nmap[key] = this.keySignatureMap[key];
      }
    });
    this.keySignatureMap = nmap;
    this._updateKeySignatures();
  }
  _updateKeySignatures() {
    let i = 0;
    const currentSig = this.measures[0].keySignature;

    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      const nextSig = this.keySignatureMap[i] ? this.keySignatureMap[i] : currentSig;
      measure.setKeySignature(nextSig);
    }
  }

  // ### numberMeasures
  // After anything that might change the measure numbers, update them iteratively
  numberMeasures() {
    let currentOffset = 0;
    let i = 0;
    this.renumberIndex = this.startIndex;
    if (this.measures[0].getTicksFromVoice(0) < smoMusic.timeSignatureToTicks(this.measures[0].timeSignature)) {
      currentOffset = -1;
    }

    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];

      this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
      const localIndex = this.renumberIndex + i + currentOffset;
      // If this is the first full measure, call it '1'
      const numberObj = {
        measureNumber: localIndex,
        measureIndex: i + this.startIndex,
        systemIndex: i,
        staffId: this.staffId
      };
      measure.setMeasureNumber(numberObj);
      // If we are renumbering measures, we assume we want to redo the layout so set measures to changed.
      measure.changed = true;
    }
  }

  getSelection(measureNumber, voice, tick, pitches) {
    let i = 0;
    for (i = 0; i < this.measures.length; ++i) {
      const measure = this.measures[i];
      if (measure.measureNumber.measureNumber === measureNumber) {
        const target = this.measures[i].getSelection(voice, tick, pitches);
        if (!target) {
          return null;
        }
        return ({
          measure,
          note: target.note,
          selection: target.selection
        });
      }
    }
    return null;
  }

  addDefaultMeasure(index, params) {
    const measure = SmoMeasure.getDefaultMeasure(params);
    this.addMeasure(index, measure);
  }

  // ## addMeasure
  // ## Description:
  // Add the measure at the specified index, splicing the array as required.
  addMeasure(index, measure) {
    if (index === 0 && this.measures.length) {
      measure.setMeasureNumber(this.measures[0].measureNumber);
    }
    if (index >= this.measures.length) {
      this.measures.push(measure);
    } else {
      this.measures.splice(index, 0, measure);
    }
    const modifiers = this.modifiers.filter((mod) => mod.startSelector.measure >= index);
    modifiers.forEach((mod) => {
      if (mod.startSelector.measure < this.measures.length) {
        mod.startSelector.measure += 1;
      }
      if (mod.endSelector.measure < this.measures.length) {
        mod.endSelector.measure += 1;
      }
    });
    this.numberMeasures();
  }
}
