
// An operation works on a selection or set of selections to edit the music
class SmoOperation {

    // ## doubleDuration
    // ## Description
    // double the duration of a note in a measure, at the expense of the following
    // note, if possible.  Works on tuplets also.
    static doubleDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount * 2;
            var actor = new SmoStretchNoteActor({
                    startIndex: selection.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);
        } else {
            var startIndex = tuplet.getIndexOfNote(note);
            var endIndex = startIndex + 1;
            if (endIndex >= tuplet.notes.length) {
                return;
            }
            var actor = new SmoStretchTupletActor({
                    changeIndex: measure.tupletIndex(tuplet),
                    startIndex: startIndex,
                    endIndex: endIndex,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);
        }
        return true;

    }	

    // ## halveDuration
    // ## Description
    // Replace the note with 2 notes of 1/2 duration, if possible
    // Works on tuplets also.
    static halveDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount / 2;
            var actor = new SmoContractNoteActor({
                    startIndex: selection.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);

        } else {
            var startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
            var actor = new SmoContractTupletActor({
                    changeIndex: startIndex,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);
        }
    }

    // ## makeTuplet
    // ## Description
    // Makes a non-tuplet into a tuplet of equal value.
    static makeTuplet(selection, numNotes) {
        var note = selection.note;
        var measure = selection.measure;
        if (measure.getTupletForNote(note))
            return;
        var nticks = note.tickCount;

        var actor = new SmoMakeTupletActor({
                index: selection.selector.tick,
                totalTicks: nticks,
                numNotes: numNotes,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }
	
	static makeRest(selection) {
		selection.note.makeRest();
	}
	static makeNote(selection) {
		selection.note.makeNote();
	}

    // ## unmakeTuplet
    // ## Description
    // Makes a tuplet into a single with the duration of the whole tuplet
    static unmakeTuplet(selection) {
        var note = selection.note;
        var measure = selection.measure;
        if (!measure.getTupletForNote(note))
            return;
        var tuplet = measure.getTupletForNote(note);
        if (tuplet === null)
            return;
        var startIndex = measure.tupletIndex(tuplet);
        var endIndex = tuplet.notes.length + startIndex - 1;

        var actor = new SmoUnmakeTupletActor({
                startIndex: startIndex,
                endIndex: endIndex,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## dotDuration
    // ## Description
    // Add a dot to a note, if possible, and make the note ahead of it shorter
    // to compensate.
    static dotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = smoMusic.getNextDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoStretchNoteActor({
                startIndex: selection.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## undotDuration
    // ## Description
    // Add the value of the last dot to the note, increasing length and
    // reducing the number of dots.
    static undotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = smoMusic.getPreviousDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoContractNoteActor({
                startIndex: selection.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## transpose
    // ## Description
    // Transpose the selected note, trying to find a key-signature friendly value
    static transpose(selection, offset) {
        var measure = selection.measure;
        var note = selection.note;
        if (measure && note) {
            note.transpose(selection.selector.pitches, offset, measure.keySignature);
            return true;
        }
        return false;
    }
	
    // ## setPitch
    // ## Description:
    // pitches can be either an array, a single pitch, or a letter.  In the latter case,
    // the letter value appropriate for the key signature is used, e.g. c in A major becomes
    // c#
    static setPitch(selection, pitches) {
        var measure = selection.measure;
        var note = selection.note;
        // TODO allow hint for octave
        var octave = note.pitches[0].octave;
        note.pitches = [];
        if (!Array.isArray(pitches)) {
            pitches = [pitches];
        }
        pitches.forEach((pitch) => {
            var letter = pitch;
            if (typeof(pitch) === 'string') {
                var letter = smoMusic.getKeySignatureKey(pitch[0], measure.keySignature);
                pitch = {
                    letter: letter[0],
                    accidental: letter.length > 1 ? letter.substring(1) : '',
                    octave: octave
                };
            }

            note.pitches.push(pitch);
        });
        return true;
    }
	
	static addDynamic(selection,dynamic) {
		selection.note.addModifier(dynamic);
	}

    // ## interval
    // ## Description:
    // Add a pitch at the specified interval to the chord in the selection.
    static interval(selection, interval) {
        var measure = selection.measure;
        var note = selection.note;

        // TODO: figure out which pitch is selected
        var pitch = note.pitches[0];
        var pitch = smoMusic.getIntervalInKey(pitch, measure.keySignature, interval);
        if (pitch) {
            note.pitches.push(pitch);
            return true;
        }
        return false;
    }

    static crescendo(fromSelection, toSelection) {
        var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
        var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
        var modifier = new SmoStaffHairpin({
                startSelector: fromSelector,
                endSelector: toSelector,
                hairpinType: SmoStaffHairpin.types.CRESCENDO,
                position: SmoStaffHairpin.positions.BELOW
            });
        fromSelection.staff.addStaffModifier(modifier);
    }
	
	static decrescendo(fromSelection, toSelection) {
        var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
        var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
        var modifier = new SmoStaffHairpin({
                startSelector: fromSelector,
                endSelector: toSelector,
                hairpinType: SmoStaffHairpin.types.DECRESCENDO,
                position: SmoStaffHairpin.positions.BELOW
            });
        fromSelection.staff.addStaffModifier(modifier);
    }
	
	static slur(fromSelection, toSelection) {
        var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
        var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
        var modifier = new SmoSlur({
                startSelector: fromSelector,
                endSelector: toSelector,
                position: SmoStaffHairpin.positions.BELOW
            });
        fromSelection.staff.addStaffModifier(modifier);
    }

}
