


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
		this.noteIndex = 0;
		var measureIndex = -1;
		this.score = score;

		if (selections.length < 1) {
			return;
		}

		this.tupletNoteMap = {};
		var first = selections[0];
		var last = selections[selections.length - 1];

		var startTuplet = first.measure.getTupletForNote(first.note);
		if (startTuplet) {
			if (startTuplet.getIndexOfNote(first.note) != 0) {
				return; // can't paste from the middle of a tuplet
			}
		}
		var endTuplet = last.measure.getTupletForNote(last.note);
		if (endTuplet) {
			if (endTuplet.getIndexOfNote(last.note) != endTuplet.notes.length - 1) {
				return; // can't paste part of a tuplet.
			}
		}

		this._populateSelectArray(selections);

	}
	// ### _populateSelectArray
	// ### Description:
	// copy the selected notes into the paste buffer with their original locations.
	_populateSelectArray(selections) {
		var currentTupletParameters = null;
		var currentTupletNotes = [];
        this.modifiers=[];
		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
            var mod = selection.staff.getModifiersAt(selector);
            if (mod.length) {
                mod.forEach((modifier) => {
                    var cp = StaffModifierBase.deserialize(modifier.serialize());
                    cp.attrs.id = VF.Element.newID();
                    this.modifiers.push(cp);
                });
            }
			if (selection.note.isTuplet) {
				var tuplet = selection.measure.getTupletForNote(selection.note);
				var index = tuplet.getIndexOfNote(selection.note);
				if (index == 0) {
					var ntuplet = SmoTuplet.cloneTuplet(tuplet);
					this.tupletNoteMap[ntuplet.attrs.id] = ntuplet;
					ntuplet.notes.forEach((nnote) => {

						this.notes.push({
						selector:selector,note:nnote});
						selector = JSON.parse(JSON.stringify(selector));
						selector.tick += 1;
					});
				}
			} else {

				var note = SmoNote.clone(selection.note);
				this.notes.push({
					selector: selector,
					note: note
				});
			}
		});
		this.notes.sort((a, b) => {
			return SmoSelector.gt(a.selector, b.selector) ? 1 : -1;
		});
	}

	clearSelections() {
		this.notes = [];
	}

    _findModifier(selector) {
        var rv = this.modifiers.filter((mod) => SmoSelector.eq(selector,mod.startSelector));
        return (rv && rv.length) ? rv[0] : null;
    }
    _findPlacedModifier(selector) {
        var rv = this.modifiers.filter((mod) => SmoSelector.eq(selector,mod.endSelector));
        return (rv && rv.length) ? rv[0] : null;
    }

	// ### _populateMeasureArray
	// ### Description:
	// Before pasting, populate an array of existing measures from the paste destination
	// so we know how to place the notes.
	_populateMeasureArray() {
		this.measures = [];
        this.staffSelectors = [];
		var measureSelection = SmoSelection.measureSelection(this.score, this.destination.staff, this.destination.measure);
		var measure = measureSelection.measure;
		this.measures.push(measure);
		var tickmap = measure.tickmapForVoice(this.destination.voice);
		var startSel = this.notes[0].selector;
		var currentDuration = tickmap.durationMap[this.destination.tick];
		var rv = [];
		this.notes.forEach((selection) => {
			if (currentDuration + selection.note.tickCount > tickmap.totalDuration && measureSelection != null) {
				// If this note will overlap the measure boundary, the note will be split in 2 with the
				// remainder going to the next measure.  If they line up exactly, the remainder is 0.
				var remainder = (currentDuration + selection.note.tickCount) - tickmap.totalDuration;
				currentDuration = remainder;

				measureSelection = SmoSelection.measureSelection(this.score,
						measureSelection.selector.staff,
						measureSelection.selector.measure + 1);

				// If the paste buffer overlaps the end of the score, we can't paste (TODO:  add a measure in this case)
				if (measureSelection != null) {
					this.measures.push(measureSelection.measure);
				}
			} else if (measureSelection != null) {
				currentDuration += selection.note.tickCount;
			}
		});
	}

	// ### _populatePre
	// When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.
	_populatePre(voiceIndex, measure, startTick, tickmap) {
		var voice = {
			notes: []
		};
		var ticksToFill = tickmap.durationMap[startTick];
		var filled = 0;
		// TODO: bug here, need to handle tuplets in pre-part, create new tuplet
		for (var i = 0; i < measure.voices[voiceIndex].notes.length; ++i) {

			var note = measure.voices[voiceIndex].notes[i];
			// IF this is a tuplet, clone all the notes at once.
			if (note.isTuplet) {
				var tuplet = measure.getTupletForNote(note);
                if (!tuplet) {
                    continue;  // we remove the tuplet after first iteration
                }
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                voice.notes = voice.notes.concat(ntuplet.notes);
                measure.removeTupletForNote(note);
                measure.tuplets.push(ntuplet);
                ticksToFill -= tuplet.tickCount;
			} else if (ticksToFill >= note.tickCount) {
				ticksToFill -= note.tickCount;
				voice.notes.push(SmoNote.clone(note));
			} else {
				var duration = note.tickCount - ticksToFill;
                var durMap = smoMusic.gcdMap(duration);
                durMap.forEach((dd) => {
                    SmoNote.cloneWithDuration(note, {
    					numerator: dd,
    					denominator: 1,
    					remainder: 0
    				});
                });
				ticksToFill = 0;
			}
			if (ticksToFill < 1) {
				break;
			}
		}
		return voice;
	}

	// ### _populateVoice
	// ### Description:
	// Create a new voice for a new measure in the paste destination
	_populateVoice(voiceIndex) {
		this._populateMeasureArray();
		var measures = this.measures;
		this.measureIndex = 0;
		var measureVoices = [];

		var measure = measures[0];
		var tickmap = measure.tickmapForVoice(this.destination.voice);
		var startSelector = JSON.parse(JSON.stringify(this.destination));
		var measureTuplets = [];
		var voice = this._populatePre(voiceIndex, measure, this.destination.tick, tickmap);
		measureVoices.push(voice);
		while (this.measureIndex < measures.length) {
			measure = measures[this.measureIndex];
			tickmap = measure.tickmapForVoice(this.destination.voice);
			this._populateNew(voice, voiceIndex, measure, tickmap, startSelector);
			if (this.noteIndex < this.notes.length && this.measureIndex < measures.length) {
				voice = {
					notes: []
				};
				measureVoices.push(voice);
				startSelector = {
					staff: startSelector.staff,
					measure: startSelector.measure,
					voice: voiceIndex,
					tick: 0
				};
				this.measureIndex += 1;
                startSelector.measure += 1;
			} else {
				break;
			}
		}
		this._populatePost(voice, voiceIndex, measure, tickmap, startSelector.tick);

		return measureVoices;
	}

	static _countTicks(voice) {
		var voiceTicks = 0;
		voice.notes.forEach((note) => {
			voiceTicks += note.tickCount;
		});
		return voiceTicks;
	}

    // ### _populateModifier
    // If the destination contains a modifier start and end, copy and paste it.
    _populateModifier(srcSelector,destSelector,staff) {
        var mod = this._findModifier(srcSelector);
        // If this is the starting point of a staff modifier, update the selector
        if (mod) {
            mod.startSelector = JSON.parse(JSON.stringify(destSelector));
        }
        // If this is the ending point of a staff modifier, paste the modifier
        mod = this._findPlacedModifier(srcSelector);
        if (mod) {
            mod.endSelector = JSON.parse(JSON.stringify(destSelector));
            mod.attrs.id = VF.Element.newID();
            staff.addStaffModifier(mod);
        }
    }

	// ### _populateNew
	// Start copying the paste buffer into the destination by copying the notes and working out
	// the measure overlap
	_populateNew(voice, voiceIndex, measure, tickmap, startSelector) {
		var currentDuration = tickmap.durationMap[startSelector.tick];
		var totalDuration = tickmap.totalDuration;
		while (currentDuration < totalDuration && this.noteIndex < this.notes.length) {
            var selection = this.notes[this.noteIndex];
			var note = selection.note;
            this._populateModifier(selection.selector,startSelector,this.score.staves[selection.selector.staff]);
			if (note.isTuplet) {
				var tuplet = this.tupletNoteMap[note.tuplet.id];
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                this.noteIndex += ntuplet.notes.length;
                startSelector.tick += ntuplet.notes.length;
                currentDuration += tuplet.tickCount;
                for (var i =  0;i < ntuplet.notes.length;++i) {
                    var tn = ntuplet.notes[i];
                    tn.clef = measure.clef;
                    voice.notes.push(tn);
                }
                measure.tuplets.push(ntuplet);
			} else if (currentDuration + note.tickCount <= totalDuration && this.remainder === 0) {
				// The whole note fits in the measure, paste it.
                var nnote = SmoNote.clone(note);
                nnote.clef = measure.clef;
				voice.notes.push(nnote);
				currentDuration += note.tickCount;
				this.noteIndex += 1;
				startSelector.tick += 1;
			} else if (this.remainder > 0) {
				// This is a note that spilled over the last measure
                var nnote = SmoNote.cloneWithDuration(note, {
						numerator: this.remainder,
						denominator: 1,
						remainder: 0
					});
                nnote.clef = measure.clef;
				voice.notes.push(nnote);

				currentDuration += this.remainder;
				this.remainder = 0;
			} else {
				// The note won't fit, so we split it in 2 and paste the remainder in the next measure.
				// TODO:  tie the last note to this one.
				var partial = totalDuration - currentDuration;
                var dar = smoMusic.gcdMap(partial);
                dar.forEach((ddd) => {
                    voice.notes.push(SmoNote.cloneWithDuration(note, {
    						numerator: ddd,
    						denominator: 1,
    						remainder: 0
    					}));
                });
				currentDuration += partial;

				// Set the remaining length of the current note, this will be added to the
				// next measure with the previous note's pitches
				this.remainder = note.tickCount - partial;
			}
		}
	}

	// ### _populatePost
	// When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
	// end of the measure with notes in the existing measure.
	_populatePost(voice, voiceIndex, measure, tickmap, endTick) {
		var startTicks = PasteBuffer._countTicks(voice);
		var notes = measure.voices[voiceIndex].notes;
		var totalDuration = tickmap.totalDuration;
		while (startTicks < totalDuration) {
			// Find the point in the music where the paste area runs out, or as close as we can get.
			var existingIndex = tickmap.durationMap.indexOf(startTicks);
			existingIndex = (existingIndex < 0) ? measure.voices[voiceIndex].notes.length - 1 : existingIndex;
			var note = measure.voices[voiceIndex].notes[existingIndex];
            if (note.isTuplet) {
                var tuplet = measure.getTupletForNote(note);
                var ntuplet = null;
                var ntuplet = SmoTuplet.cloneTuplet(tuplet);
                startTicks += tuplet.tickCount;
                voice.notes = voice.notes.concat(ntuplet.notes);
                measure.tuplets.push(ntuplet);
                measure.removeTupletForNote(note);
            } else {
    			var ticksLeft = totalDuration - startTicks;
    			if (ticksLeft >= note.tickCount) {
    				startTicks += note.tickCount;
    				voice.notes.push(SmoNote.clone(note));
    			} else {
    				var remainder = totalDuration - startTicks;
    				voice.notes.push(SmoNote.cloneWithDuration(note, {
    						numerator: remainder,
    						denominator: 1,
    						remainder: 0
    					}));
    				startTicks = totalDuration;
    			}
            }
		}
	}

    _pasteVoiceSer(ser,vobj,voiceIx) {
        var voices = [];
        var ix = 0;
        ser.voices.forEach((vc) => {
            if(ix != voiceIx) {
                voices.push(vc);
            } else {
                voices.push(vobj);
            }
            ix += 1;
        });
        ser.voices = voices;
    }

	pasteSelections(score, selector) {
		this.destination = selector;
		if (this.notes.length < 1) {
			return;
		}

		var voices = this._populateVoice(this.destination.voice);
		var measureSel = JSON.parse(JSON.stringify(this.destination));
		for (var i = 0; i < this.measures.length; ++i) {
			var measure = this.measures[i];
			var nvoice = voices[i];
			var ser = measure.serialize();
			var vobj = {
				notes: []
			};
			nvoice.notes.forEach((note) => {
				vobj.notes.push(note.serialize());
			});

			// TODO: figure out how to do this with multiple voices
            this._pasteVoiceSer(ser,vobj,this.destination.voice);
			var nmeasure = SmoMeasure.deserialize(ser);
            nmeasure.renderedBox = svgHelpers.smoBox(measure.renderedBox);
            nmeasure.logicalBox = svgHelpers.smoBox(measure.logicalBox);
            nmeasure.staffX = measure.logicalBox.x;
            nmeasure.setWidth( measure.logicalBox.width,'copypaste');
            nmeasure.staffY = measure.logicalBox.y;
            ['forceClef','forceKeySignature','forceTimeSignature','forceTempo'].forEach((flag) => {
                nmeasure[flag] = measure[flag];
            });
			this.score.replaceMeasure(measureSel, nmeasure);
			measureSel.measure += 1;
		}
	}
}
