VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

class SmoMeasureTransform {
    constructor(system, actors, options) {
        this.system = system;
        this.actors = actors ? actors : [];
        this.keySignature = 'C';
        this.accidentalMap = [];
        Vex.Merge(this, options);
    }
    static nullActor(measure) {
        return measure;
    }

    // ## transformNote
    // call the actors for each note, and put the result in the note array.
    // The note from the original array is copied and sent to each actor.
    //
    // Because the resulting array can have a different number of measures than the existing
    // array, the actors communicate with the transformer in the following, jquery-ish
    // but somewhat unintuitive way:
    //
    // 1. if the actor returns null, the next actor is called and the results of that actor are used
    // 2. if all the actors return null, the copy is used.
    // 3. if a note object is returned, that is used for the current tick and no more actors are called.
    // 4. if an array of notes is returned, it is concatenated to the existing note array and no more actors are called.
    //     Note that *return note;* and *return [note];* produce the same result.
    // 5. if an empty array [] is returned, that copy is not added to the result.  The note is effectively deleted.
    transformMeasure(iterator, measure) {
        var self = this;
       
        for (var i = 0; i < this.actors.length; ++i) {
			var actor=this.actors[i];
            var newMeasure = actor.transformMeasure(measure, iterator);
            if (newMeasure == null) {
				this.newMeasures.push(measure); // no change
                continue;
            }
            if (Array.isArray(newMeasure)) {
                if (newMeasure.length === 0) { // no change, use existing array
                    return;
                }
                this.newMeasures = this.newMeasures.concat(newMeasure);
                return;
            }
			
            this.newMeasures.push(newMeasure);
            return;
        }
    }

    run() {
        var self = this;
        var iterator = new smoMeasureIterator(this.measure);
		this.newMeasures=[];

        iterator.iterate((iterator, measure) => {
            var newMeasure = self.transformMeasure(iterator, measure);
			
        });

        this.notes = this.vxNotes;
        return this.vxNotes;
    }
}
