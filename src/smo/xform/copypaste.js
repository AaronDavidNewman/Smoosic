


// ## PasteBuffer
// ### Description:
// Hold some music that can be pasted back to the score
class PasteBuffer {
	constructor() {
		this.notes = [];
		this.noteIndex = 0;
		this.measures = [];
		this.measureIndex = -1;
		this.remainder = 0;
	}

	setSelections(score, selections) {
		this.notes = [];
		var measureIndex = -1;

		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
			var note = SmoNote.clone(selection.note);
			this.notes.push({
				selector: selector,
				note: note
			});
		});
		this.notes.sort((a, b) => {
			return SmoSelector.gt(a.selector, b.selector) ? 1 : -1;
		});
	}

	clearSelections() {
		this.notes = [];
	}
	
	// ### _populateMeasureArray
	// ### Description:
	// Populate an array of existing measures from the paste destination, once we know what that is.
	_populateMeasureArray() {
		var measureSelection = SmoSelection.measureSelection(this.score, this.destination.staffIndex, this.destination.measureIndex);
		var measure = measureSelection.measure;
		this.measures.push(measure);
		var tickmap = measure.tickmap();
		var startSel = this.notes[0].selector;
		var currentDuration = tickmap.durationMap[this.destination.tickIndex];
		var rv = [];
		this.notes.forEach((selection) => {
			if (currentDuration + selection.note.tickCount >= tickmap.totalDuration) {
     			// If this note will overlap the measure boundary, the note will be split in 2 with the 
				// remainder going to the next measure.  If they line up exactly, the remainder is 0.
				var remainder = tickmap.totalDuration - (currentDuration + selection.note.tickCount);
								
				measureSelection = SmoSelection.measureSelection(this.score, this.measureSelection.staffIndex, this.measureSelection.measureIndex + 1);
				
				// If the paste buffer overlaps the end of the score, we can't paste (TODO:  add a measure in this case)
				if (measureSelection != null) {
					this.measures.push(measureSelection.measure);
					currentDuration = selection.note.tickCount - remainder;
				} 
			} else if (measureSelection != null) {
				currentDuration += selection.note.tickCount;
			}
		});
		return rv;
	}

	// ### _populatePre
	// When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.
	_populatePre(voiceIndex, measure, tickmap, startTick) {
		var voice = {
			notes: []
		};
		var ticksToFill = tickmap.durationMap[startTick];
		var filled = 0;
		for (var i = 0; i < measure.voices[voiceIndex].notes; ++i) {

			var note = measure.voices[voiceIndex].notes[i];
			if (ticksToFill <= note.tickCount) {
				ticksToFill -= note.tickCount;
				voice.notes.push(SmoNote.clone(clone));
			} else {
				var duration = note.tickCount - ticksToFill;
				SmoNote.cloneWithDuration(note,{numerator:duration,denominator:1,remainder:0});
				ticksToFill = 0;
			}
			if (ticksToFill < 1) {
				break;
			}
		}
		return voice;
	}

	_populateVoice(voiceIndex) {
		var measures = this.measures;
		this.measureIndex = 0;
		var measureVoices=[];
		
		var measure = measures[0];
		var tickmap = measure.tickmap();
		var startSelector = JSON.parse(JSON.stringify(this.destination));
		var voice = this._populatePre(voiceIndex, measure, this.destination.tick);
		measureVoices.push(voice);
		while (this.measureIndex < measures.length) {
			_populateNew(voice, voiceIndex, measure, tickmap, startSelector);			
			if (this.noteIndex < this.notes.length && this.measureIndex < measures.length) {
				voice = {notes:[]};
				measureVoices.push(voice);
				startSelector = {staff:startSelector.staff,measure:startSelector.measure,voice:voiceIndex,tick:0};
				measure = measure[this.measureIndex];
				tickmap = measure.tickmap();
				this.measureIndex += 1;
			} else {
				break;
			}
		}
		this._populatePost(voice,voiceIndex,measure,tickmap,startSelector.tick);
	
		return voice;
	}

	static _countTicks(voice) {
		var voiceTicks = 0;
		voice.notes.forEach((note) => {
			voiceTicks += note.tickCount;
		});
		return voiceTicks;
	}
	_populateNew(voice, voiceIndex, measure, tickmap, startSelector) {
		var currentDuration = tickMap.durationMap[startSelector.tick];
		var duration = tickmap.totalDuration;
		while (currentDuration < measure.tickCount && this.noteIndex < notes.length) {
			var note = notes[this.noteIndex];
			if (currentDuration + note.tickCount <= duration && this.remainder===0) {
				voice.notes.push(SmoNote.clone(note));
				currentDuration += note.tickCount;
				this.noteIndex += 1;
				startSelector.tick += 1;
			} else if (this.remainder > 0) {
				voice.notes.push(SmoNote.cloneWithDuration(note,{numerator:this.remainder,denominator:1,remainder:0}));
				currentDuration += this.remainder;
				this.remainder=0;
			}
			else {
				// The 
				var partial = duration - currentDuration;
				voice.notes.push(SmoNote.cloneWithDuration(note, {numerator:partial,denominator:1,remainder:0}));
				currentDuration += partial;
				
				// Set the remaining length of the current note, this will be added to the 
				// next measure with the previous note's pitches
				this.remainder = note.tickCount - partial;
			}
		}
	}
	
	// ### _populatePost
	// When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
	// end of the measure.
	_populatePost(voice, voiceIndex, measure, tickmap, endTick) {
		var startTicks = PasteBuffer._countTicks(voice);
		var notes = measure.voices[voiceIndex].notes;
		var totalDuration = tickmap.totalDuration;
		while (startTicks < totalDuration && endTick < notes.length) {
			var note = notes[endTick];
			if (note.tickCount + startTicks <= totalDuration) {
				startTicks += note.tickCount;
				voice.notes.push(SmoNote.clone(note));
			} else {
				var remainder = totalDuration - startTicks;
				voice.notes.push(SmoNote.cloneWithDuration(note, {numerator:remainder,denominator:1,remainder:0}));
				startTicks = totalDuration;
			}
			endTick += 1;
		}
	}

	pasteSelections(score, selector) {
		if (this.buffer.length < 1) {
			return;
		}
		this._populateMeasureArray();
		this.destination = selector;
		var startSel = this.buffer[0].selector;
		this.buffer.forEach((selection) => {
			var targetSel = SmoSelector.applyOffset(startSel, selector, selection.selector);
			var existing = SmoSelection.noteSelection(score, targetSel);
			// TODO: find closest note and adjust
			if (existing) {
				var note = SmoNote.deserialize(selection.note);
				// replace pitch
				if (note.tickCount === existing.note.tickCount) {
					existing.note.pitches = JSON.parse(JSON.stringify(note.pitches));
				}
			}
		});
	}
}
