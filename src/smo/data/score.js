
class SmoScore {
    constructor(params) {
        Vex.Merge(this, SmoScore.defaults);
        Vex.Merge(this, params);
        if (this.staves.length) {
            this._numberStaves();
        }
    }
    static get defaults() {
        return {
            staffX: 30,
            staffY: 40,
            staffWidth: 1600,
            interGap: 30,
            startIndex: 0,
            renumberingMap: {},
			keySignatureMap:{},
            staves: [],
            activeStaff: 0
        };
    }
	
	static getDefaultScore(scoreDefaults,measureDefaults) {
		scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
		measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
		var score = new SmoScore(scoreDefaults);
		score.addInstrument(measureDefaults);
		var measure = SmoMeasure.getDefaultMeasure(measureDefaults);
		score.addMeasure(0,measure);
		return score;
	}
	
	static getEmptyScore(scoreDefaults) {
		var score = new SmoScore(scoreDefaults);
		score.addInstrument();
		return score;
	}
	applyModifiers() {
		for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
			stave.applyModifiers();
		}
	}

    _numberStaves() {
       for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            stave.numberMeasures();
        }
    }
	
	getMeasureAtSelection(selection) {
		return this.staves[this.activeStaff].getMeasureAtSelection(selection);
	}
	// If we are adding a measure, find the previous measure to get constructor parameters from it.
	_getMeasureContext(staff,measureIndex) {
		var rv={};
		Vex.Merge(rv,SmoMeasure.defaults);
		
		if (measureIndex < staff.measures.length) {
			vexMusic.filteredMerge(SmoMeasure.defaultAttributes, rv, staff.measures[i]);
		}
		return rv;
	}
	
	addDefaultMeasure(measureIndex,parameters) {
		for (var i=0;i<this.staves.length;++i) {
			var staff=this.staves[i];
			// TODO: find best measure for context, with key, time signature etc.
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasure(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		}
		this._numberStaves();
	}
	addMeasure(measureIndex,measure) {
		for (var i=0;i<this.staves.length;++i) {
			var staff=this.staves[i];
			if (this.activeStaff===i) {				
			    staff.addMeasure(measureIndex,measure);
			} else {
				// TODO: find best measure for context, with key, time signature etc.				
				staff.addMeasure(measureIndex,SmoMeasure.cloneMeasure(measure));
			}
		}
		this._numberStaves();
	}
	addKeySignature(measureIndex,key) {
		this.staves.forEach((staff) => {staff.addKeySignature(measureIndex,key);});
	}
	addInstrument(parameters) {
		if (this.staves.length ==0 )  {
			this.staves.push(new SmoSystemStaff(parameters));
			this.activeStaff=0;
			return;
		}
		if (!parameters) {
			parameters=SmoSystemStaff.defaults;
		}
		var proto=this.staves[0];
		var measures=[];
		for (var i=0;i<proto.measures.length;++i) {
			var newParams = {};
			var measure=proto.measures[i];
			vexMusic.filteredMerge(SmoMeasure.defaultAttributes, measure, newParams);
			newParams.clef=parameters.instrumentInfo.clef;			
			var newMeasure=new SmoMeasure(newParams);
			newMeasure.measureNumber = measure.measureNumber;
			measures.push(newMeasure);
		}
		parameters.measures=measures;
		var staff = new SmoSystemStaff(parameters);
		this.staves.push(staff);
		this.activeStaff=this.staves.length-1;
	}
	
	getNoteAtSelection(selection) {
		return this.staves[selection.staffIndex].getNoteAtSelection(selection);
	}
	getMeasureAtSelection(selection) {
		selection.staffIndex = selection['staffIndex'] ? selection['staffIndex'] : this.activeStaff;
		return this.staves[selection.staffIndex].measures[selection.measureIndex];
	}
	
	getMaxTicksMeasure(measure) {
		
		return this.staves[this.activeStaff].getMaxTicksMeasure(measure);
	}
	get measures() {
		if (this.staves.length === 0) return [];
		return this.staves[this.activeStaff].measures;
	}
	incrementActiveStaff(offset) {
		if (offset<0) offset = (-1*offset)+this.staves.length;
		var nextStaff = (this.activeStaff + offset) % this.staves.length;
		if (nextStaff >= 0 && nextStaff < this.staves.length) {
			this.activeStaff=nextStaff;
		}
		return this.activeStaff;
	}
	
	getSelection(measureNumber,voice,tick,pitches) {
		return this.staves[this.activeStaff].getSelection(measureNumber,voice,tick,pitches);
	}

    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
		var staves=[];
        vexMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'interGap', 'renumberingMap', 'renumberIndex'],
            jsonObj, params);
        jsonObj.staves.forEach(function (measureObj) {
            var staff = SmoSystemStaff.deserialize(JSON.stringify(measureObj));
            staves.push(staff);
        });
		params.staves=staves;

        return new SmoScore(params);
    }
	
	setActiveStaff(index) {
		this.activeStaff=index<=this.staves.length ? index : this.activeStaff;
	}
	
    getRenderedNote(id) {
        for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            var note = stave.getRenderedNote(id);
            if (note) {
				note.selection.staffIndex=i;
                return note;
            }
        }
        return null;
    }
}
