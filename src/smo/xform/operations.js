
// An operation works on a selection or set of selections to edit the music
class SmoOperation {

    // ## doubleDuration
    // double the duration of a note in a measure, at the expense of the following
    // note, if possible.
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

    static dotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = vexMusic.getNextDottedLevel(note.tickCount);
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

    static undotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = vexMusic.getPreviousDottedLevel(note.tickCount);
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

    static transpose(selection, offset) {
        var measure = selection.measure;
        var note = selection.note;
        if (measure && note) {
            note.transpose(selection.selector.pitches, offset, measure.keySignature);
            smoModifierFactory.applyModifiers(measure);
            return true;
        }
        return false;
    }

    static setPitch(selection, letter) {
        var measure = selection.measure;
        var note = selection.note;
        var key = vexMusic.getKeySignatureKey(letter, measure.keySignature);
        var prop = {
            key: key[0],
            accidental: '',
            octave: note.keys[0].octave
        };
        if (key.length > 1) {
            prop.accidental = key.substring(1);
        } else {
            prop.accidental = '';
        }
        note.keys = [prop];
        return true;
    }

    static interval(selection, interval) {
        var measure = selection.measure;
        var note = selection.note;

        // TODO: figure out which pitch is selected
        var key = note.keys[0];
        var pitch = vexMusic.getIntervalInKey(key, measure.keySignature, interval);
        if (pitch) {
            note.keys.push(pitch);
            smoModifierFactory.applyModifiers(measure);
            return true;
        }
        return false;
    }

}
