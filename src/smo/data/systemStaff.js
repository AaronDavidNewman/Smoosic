

// ## SmoSystemStaff
// ## Description:
// A staff is a line of music that can span multiple measures.
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
	
	static get defaultParameters() {
		return [
		'staffX','staffY','adjY','staffWidth','staffHeight','startIndex',
            'renumberingMap','keySignatureMap','instrumentInfo'];
	}
	
    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            adjY: 0,
            staffWidth: 1600,
            staffHeight: 90,
            startIndex: 0,
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
	
	serialize() {
		var params={};
		smoMusic.filteredMerge(SmoSystemStaff.defaultParameters,this,params);
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

    static deserialize(jsonObj) {
        var params = {};
        smoMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
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

    getModifierMeasures(modifier) {
        return {
            startMeasure: this.measures.find((measure) => measure.attrs.id === modifier.startMeasure),
            endMeasure: this.measures.find((measure) => measure.attrs.id === modifier.endMeasure),
        }
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

    getMaxTicksMeasure(measure) {
        if (this.measures.length < measure) {
            return 0;
        }
        return this.measures[measure].notes.length;
    }
    addKeySignature(measureIndex, key) {
        this.keySignatureMap[measureIndex] = key;
        this._updateKeySignatures();
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

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
            var localIndex = this.renumberIndex + i;
            var numberObj = {
                measureNumber: localIndex,
                measureIndex: i + this.startIndex,
                systemIndex: i
            }
            measure.setMeasureNumber(numberObj);
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

        this.numberMeasures();
    }
}
