
class SmoStaffModifier {
    constructor(params) {
        Vex.Merge(this, SmoStaffModifier.defaults);
        vexMusic.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
		this.startSelector = params.startSelector;
		this.endSelector = params.endSelector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoStaffModifier'
            };
        } else {
            console.log('inherit attrs');
        }
    }
	get id() {
		return this.attrs.id;
	}
	get type() {
		return this.attrs.type;
	}
    static get defaults() {
        return {
            xOffsetLeft: -2,
			xOffsetRight:0,
            yOffset: -15,
            height: 10,
            position: SmoStaffModifier.positions.BELOW,
            hairpinType: SmoStaffModifier.types.CRESCENDO

        };
    }
    static get positions() {
        // matches VF.modifier
        return {
            LEFT: 1,
            RIGHT: 2,
            ABOVE: 3,
            BELOW: 4,
        };
    }
    static get types() {
        return {
            CRESCENDO: 1,
            DECRESCENDO: 2
        };
    }
}

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
            console.log('inherit attrs');
        }
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

    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
        vexMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
            jsonObj, params);
        params.measures = [];
        jsonObj.measures.forEach(function (measureObj) {
            var measure = SmoMeasure.deserialize(JSON.stringify(measureObj));
            params.measures.push(measure);
        });

        return new SmoSystemStaff(params);
    }

    addStaffModifier(modifier) {
        this.removeStaffModifier(modifier);
        this.modifiers.push(modifier);
    }

    removeStaffModifier(modifier) {
        var mods = [];
        this.modifiers.forEach((mod)=> {
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

    applyModifiers() {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            smoModifierFactory.applyModifiers(measure);
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
        return this; // fluent interface
    }
}
