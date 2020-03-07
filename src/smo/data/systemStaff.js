

// ## SmoSystemStaff
// ## Description:
// A staff is a line of music that can span multiple measures.
// A system is a line of music for each staff in the score.  So a staff
// spans multiple systems.
// A staff modifier connects 2 points in the staff.
class SmoSystemStaff {
    constructor(params) {
        this.measures = [];
        Vex.Merge(this, SmoSystemStaff.defaults);
        Vex.Merge(this, params);
        if (this.measures.length) {
            this.numberMeasures();
        }
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSystemStaff'
            };
        } else {
            // inherit attrs id for deserialized

        }
    }

    // ### defaultParameters
    // the parameters that get saved with the score.
	static get defaultParameters() {
		return [
		'staffId','staffX','staffY','adjY','staffWidth','staffHeight','startIndex',
            'renumberingMap','keySignatureMap','instrumentInfo'];
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
			staffId:0,
            renumberingMap: {},
            keySignatureMap: {},
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
		var params={};
		smoMusic.serializedMerge(SmoSystemStaff.defaultParameters,this,params);
		params.modifiers=[];
		params.measures=[];


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
        var params = {};
        smoMusic.serializedMerge(
            ['staffId','staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
            jsonObj, params);
        params.measures = [];
        jsonObj.measures.forEach(function (measureObj) {
            var measure = SmoMeasure.deserialize(measureObj);
            params.measures.push(measure);
        });

        var rv = new SmoSystemStaff(params);

        if (jsonObj.modifiers) {
            jsonObj.modifiers.forEach((params) => {
                var mod = StaffModifierBase.deserialize(params);
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

    removeStaffModifier(modifier) {
        var mods = [];
        this.modifiers.forEach((mod) => {
            if (mod.id != modifier.id) {
                mods.push(mod);
            }
        });
        this.modifiers = mods;
    }

	getModifiersAt(selector) {
		var rv = [];
		this.modifiers.forEach((mod) => {
			if (SmoSelector.sameNote(mod.startSelector,selector)) {
				rv.push(mod);
			}
		});
		return rv;
	}

    getSlursStartingAt(selector) {
        return this.modifiers.filter((mod) => {
            return SmoSelector.sameNote(mod.startSelector,selector)
               && mod.attrs.type == 'SmoSlur';
        });
    }

    getSlursEndingAt(selector) {
        return this.modifiers.filter((mod) => {
            return SmoSelector.sameNote(mod.endSelector,selector);
        });
    }

    getModifierMeasures(modifier) {
        return {
            startMeasure: this.measures.find((measure) => measure.attrs.id === modifier.startMeasure),
            endMeasure: this.measures.find((measure) => measure.attrs.id === modifier.endMeasure),
        }
    }

    getModifiers() {
        return this.modifiers;
    }

    applyBeams() {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            smoBeamerFactory.applyBeams(measure);
        }
    }

    getRenderedNote(id) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            var note = measure.getRenderedNote(id);
            if (note)
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
                    id: note.smoNote.id
                };
        }
        return null;
    }

    addRehearsalMark(index,parameters) {
        var mark = new SmoRehearsalMark(parameters);
        if (!mark.increment) {
            this.measures[index].addRehearsalMark(mark);
            return;
        }

        var symbol = mark.symbol;
        for (var i=0;i<this.measures.length;++i) {
            var mm = this.measures[i];
            if (i < index) {
                var rm = mm.getRehearsalMark();
                if (rm && rm.cardinality==mark.cardinality && rm.increment) {
                   symbol = rm.getIncrement();
                   mark.symbol=symbol;
                }
            }
            if (i === index) {
                mm.addRehearsalMark(mark);
                symbol = mark.getIncrement();
            }
            if (i > index) {
                var rm = mm.getRehearsalMark();
                if (rm && rm.cardinality==mark.cardinality && rm.increment) {
                    rm.symbol = symbol;
                    symbol = rm.getIncrement();
                }
            }
        }
    }

    removeTempo(index) {
        this.measures[index].removeTempo();
    }

    addTempo(tempo,index) {
        this.measures[index].addTempo(tempo);
    }

    removeRehearsalMark(index) {
        var ix = 0;
        var symbol=null;
        var card = null;
        this.measures.forEach((measure) => {
            if (ix == index) {
                var mark = measure.getRehearsalMark();
                if (mark) {
                    symbol = mark.symbol;
                    card = mark.cardinality;
                }
                measure.removeRehearsalMark();
            }
            if (ix > index && symbol && card) {
                var mark = measure.getRehearsalMark();
                if (mark && mark.increment) {
                    mark.symbol = symbol;
                    symbol = mark.getIncrement();
                }
            }

            ix += 1;
        });
    }

	deleteMeasure(index) {
		if (this.measures.length < 2) {
			return; // don't delete last measure.
		}
		var nm=[];
		this.measures.forEach((measure) => {
			if (measure.measureNumber.measureIndex != index) {
				nm.push(measure);
			}
		});
		var sm=[];
		this.modifiers.forEach((mod)=> {
            // Bug: if we are deleting a measure before the selector, change the measure number.
			if (mod.startSelector.measure != index && mod.endSelector.measure != index) {
                if (index < mod.startSelector.measure) {
                    mod.startSelector.measure -= 1;
                }
                if (index < mod.endSelector.measure) {
                    mod.endSelector.measure -= 1;
                }
				sm.push(mod);
			}
		});
		this.measures=nm;
		this.modifiers=sm;
		this.numberMeasures();
	}

    getMaxTicksMeasure(measure) {
        if (this.measures.length < measure) {
            return 0;
        }
        return this.measures[measure].notes.length;
    }
    addKeySignature(measureIndex, key) {
        this.keySignatureMap[measureIndex] = key;
		var target = this.measures[measureIndex];
		target.keySignature = key;
        // this._updateKeySignatures();
    }
    removeKeySignature(measureIndex) {
        var keys = Object.keys(this.keySignatureMap);
        var nmap = {};
        keys.forEach((key) => {
            if (key !== measureIndex) {
                nmap[key] = this.keySignatureMap[key];
            }
        });
        this.keySignatureMap = nmap;
        this._updateKeySignatures();
    }
    _updateKeySignatures() {
        var currentSig = this.measures[0].keySignature;

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            var nextSig = this.keySignatureMap[i] ? this.keySignatureMap[i] : currentSig;
            measure.setKeySignature(nextSig);
        }
    }
    numberMeasures() {
        this.renumberIndex = this.startIndex;
        var currentOffset = 0;
        if (this.measures[0].getTicksFromVoice(0) < smoMusic.timeSignatureToTicks(this.measures[0].timeSignature)) {
            currentOffset = -1;
        }

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
            var localIndex = this.renumberIndex + i + currentOffset;
            // If this is the first full measure, call it '1'
            var numberObj = {
                measureNumber: localIndex,
                measureIndex: i + this.startIndex,
                systemIndex: i,
				staffId:this.staffId
            }
            measure.setMeasureNumber(numberObj);
			// If we are renumbering measures, we assume we want to redo the layout so set measures to changed.
			measure.changed=true;
        }
    }
    getSelection(measureNumber, voice, tick, pitches) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            if (measure.measureNumber.measureNumber === measureNumber) {
                var target = this.measures[i].getSelection(voice, tick, pitches);
                if (!target) {
                    return null;
                }
                return ({
                    measure: measure,
                    note: target.note,
                    selection: target.selection
                });
            }
        }
        return null;
    }

    addDefaultMeasure(index, params) {
        var measure = SmoMeasure.getDefaultMeasure(params);
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
        var modifiers = this.modifiers.filter((mod) => mod.startSelector.measure >= index);
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
