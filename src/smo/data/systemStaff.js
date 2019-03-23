
class SmoSystemStaff {
    constructor(params) {
        this.measures = [];
        Vex.Merge(this, SmoSystemStaff.defaults);
        Vex.Merge(this, params);
        if (this.measures.length) {
            this.numberMeasures();
        }
		this.layout.bind(this);
		this.layout.layout();
    }
    static get defaults() {
		var layout = new smrfSimpleLayout();
		var measure = new SmoMeasure();
        return {
            staffX: 10,
            staffY: 40,
            staffWidth: 1600,
            startIndex: 0,
            renumberingMap: {},
			instrumentInfo: {
				instrumentName:'Treble Instrument',
				keyOffset:'0',
				clef:'treble'
			},
            measures: [measure],
			layout
        };
    }

    static deserialize(jsonString) {
		var jsonObj = JSON.parse(jsonString);
        var params = {};
        vexMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex'],
            jsonObj, params);
        params.measures = [];
        jsonObj.measures.forEach(function (measureObj) {
            var measure = SmoMeasure.deserialize(JSON.stringify(measureObj));
            params.measures.push(measure);
        });

        return new SmoSystemStaff(params);
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
						measureIndex:measure.measureNumber.measureIndex,
						voice:measure.activeVoice,
						tick:note.tick,
						maxTickIndex:measure.notes.length,
						maxMeasureIndex:this.measures.length
					},
				    type: note.smoNote.attrs.type,
				    id: note.smoNote.id
				};
		}
		return null;
	}
	
	getNoteAtSelection(selection) {
		if (this.measures.length < selection.measureIndex) {
			return null;
		}
		var measure = this.measures[selection.measureIndex];
		if (measure.notes.length < selection.ticks) {
			return null;
		}
		var smoNote = measure.notes[selection.tick];
		
		// If the caller increments the measure, fill in the max tick here
		selection.maxTickIndex = measure.notes.length;
		return {
				    smoMeasure: measure,
				    smoNote: measure.notes[selection.tick],
				    smoSystem: this,
					selection: selection,
				    type: smoNote.attrs.type,
				    id: smoNote.id
				};
	}
	getMaxTicksMeasure(measure) {
		if (this.measures.length < measure) {
			return 0;
		}
		return this.measures[measure].notes.length;
	}
	
    numberMeasures() {
        this.renumberIndex = this.startIndex;
        var startx = 0;
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            startx += (i > 0) ? this.measures[i - 1].staffWidth : measure.staffX;
            measure.staffX = startx;
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
	getSelection(measureNumber,voice,tick,pitches) {		
		for (var i = 0; i < this.measures.length; ++i) {
			var measure = this.measures[i];
			if (measure.measureNumber.measureNumber === measureNumber) {				
				var target = this.measures[i].getSelection(voice,tick,pitches);
				if (!target) {					
				    return null;
				}				
				return ({measure:measure,note:target.note,selection:target.selection});
			}
		}
		return null;
	}
	
	addDefaultMeasure(index,params) {
		var measure = SmoMeasure.getDefaultMeasure(params);
		this.addMeasure(index,measure);
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
		this.layout.layout();
        return this; // fluent interface
    }
}

