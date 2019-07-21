
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
			measureTickmap:[],
            staves: [],
            activeStaff: 0,
			pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            svgScale: 0.8,
			zoomScale:1.0
        };
    }
	
	static get defaultAttributes() {
		return ['staffX', 'staffY', 'staffWidth', 'startIndex', 'interGap', 'renumberingMap', 'renumberIndex'];
	}
	serialize() {
		var params={};
		smoMusic.serializedMerge(SmoScore.defaultAttributes,this,params);
		var obj={score:params,staves:[]};
		this.staves.forEach((staff) => {
			obj.staves.push(staff.serialize());
		});
		return obj;
	}
	static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
		var staves=[];
        smoMusic.serializedMerge(
            SmoScore.defaultAttributes,
            jsonObj, params);
        jsonObj.staves.forEach((staffObj) => {
            var staff = SmoSystemStaff.deserialize(staffObj);
            staves.push(staff);
        });
		params.staves=staves;

        return new SmoScore(params);
    }
	
	// ## getDefaultScore
	// ## Description:
	// Gets a score consisting of a single measure with all the defaults.
	static getDefaultScore(scoreDefaults,measureDefaults) {
		scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
		measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
		var score = new SmoScore(scoreDefaults);
		score.addInstrument(measureDefaults);
		var measure = SmoMeasure.getDefaultMeasure(measureDefaults);
		score.addMeasure(0,measure);
		measure.voices.push({notes:SmoMeasure.getDefaultNotes(measureDefaults)});
		return score;
	}
	
	// ## getEmptyScore
	// ## Description:
	// Create a score object, but don't populate it with anything.
	static getEmptyScore(scoreDefaults) {
		var score = new SmoScore(scoreDefaults);
		score.addInstrument();
		return score;
	}
   	
	// ## _numberStaves
	// recursively renumber staffs and measures.
	_numberStaves() {
       for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            stave.numberMeasures();
        }
    }
	
	// ## addDefaultMeasure
	// ## Description:
	// Add a meaure to the score with the default key signature.
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
	
	addDefaultMeasureWithNotes(measureIndex,parameters) {
		this.staves.forEach((staff) => {
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasureWithNotes(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		});
	}
	_updateMeasureTickmap() {
		this.measureTickmap=[];
		this.measures.forEach((measure) => {
			this.measureTickmap.push(measure.tickmap());
		});
	}
	deleteMeasure(measureIndex) {		
		this.staves.forEach((staff) => {
			staff.deleteMeasure(measureIndex);
		});
		
	}
	// ## addMeasure
	// ## Description:
	// Give a measure prototype, create a new measure and add it to each staff, with the 
	// correct settings for current time signature/clef.
	addMeasure(measureIndex,measure) {
		
		for (var i=0;i<this.staves.length;++i) {
			var protomeasure = measure;
			var staff=this.staves[i];
			// Since this staff may already have instrument settings, use the 
			// immediately precending or post-ceding measure if it exists.
			if (measureIndex < staff.measures.length) {
				protomeasure = staff.measures[measureIndex];
			} else if (staff.measures.length) {
				protomeasure = staff.measures[staff.measure.length-1];
			}
			var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
			staff.addMeasure(measureIndex,nmeasure);
		}
		this._numberStaves();
	}
	
	replaceMeasure(selector,measure) {
		var staff=this.staves[selector.staff];
		staff.measures[selector.measure]=measure;
	}
	// TODO: Untested
	replaceStaff(index,staff) {
		var staves=[];
		for (var i=0;i<this.staves.length;++i) {
			if (i != index) {
				staves.push(this.staves[i]);				
			}else {
				staves.push(staff);
			}
		}
		this.staves=staves;		
	}
	// ## addKeySignature
	// ## Add a key signature at the specified index in all staves.
	addKeySignature(measureIndex,key) {
		this.staves.forEach((staff) => {staff.addKeySignature(measureIndex,key);});
	}
	
	// ## addInstrument
	// ## Description:
	// add a new staff (instrument) to the score
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
			smoMusic.filteredMerge(SmoMeasure.defaultAttributes, measure, newParams);
			newParams.clef=parameters.instrumentInfo.clef;
			newParams.transposeIndex = parameters.instrumentInfo.keyOffset;
			var newMeasure=SmoMeasure.getDefaultMeasureWithNotes(newParams);
			newMeasure.measureNumber = measure.measureNumber;
			measures.push(newMeasure);
		}
		parameters.measures=measures;
		var staff = new SmoSystemStaff(parameters);
		this.staves.push(staff);
		this.activeStaff=this.staves.length-1;
	}
	
	removeInstrument(index) {
		var staves = [];
		var ix=0;
		this.staves.forEach((staff) => {
			if (ix!=index) {
				staves.push(staff);
			}
			ix += 1;
		});
		this.staves=staves;
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
