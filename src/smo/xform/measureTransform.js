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

	// ## applyTransform
	// create a transform with the given actors and run it against the supplied measure
	static applyTransform(system,actors) {
		var actAr = (Array.isArray(actors)) ? actors : [actors];
        var transformer = new SmoMeasureTransform(system, actAr);
        transformer.run();
        system.measures = transformer.measures;
	}
	
    // ## transformMeasure
    // call the actors for each measure, and put the result in the measure array.
    // The measure from the original array is copied and sent to each actor.
    //
    // Because the resulting array can have a different number of measures than the existing
    // array, the actors communicate with the transformer in the following, jquery-ish
    // but somewhat unintuitive way:
    //
    // 1. if the actor returns null, the next actor is called and the results of that actor are used
    // 2. if all the actors return null, the copy is used.
    // 3. if a measure object is returned, that is used for the current tick and no more measures are called.
    // 4. if an array of measures is returned, it is concatenated to the existing measure array and no more actors are called.
    //     Note that *return measure;* and *return [measure];* produce the same result.
    // 5. if an empty array [] is returned, that copy is not added to the result.  The measure is effectively deleted.
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
        var iterator = new smoMeasureIterator(this.system);
		this.newMeasures=[];

        iterator.iterate((iterator, measure) => {
            self.transformMeasure(iterator, measure);
        });

        this.measures = this.newMeasures;
        return this.newMeasures;
    }
}

class SmoMeasureTransformBase {
	constructor() {}
	transformMeasure(measure,iterator,accidentalMap) {
		return measure;
	}
}
class SmoTransposeMeasurePitchActor extends TickTransformBase {
	// ## options: 
	// selections: [{selection:{measure:2,voice:0,tickIndex:1},
	//    keys:[{key: 'e',octave: 4,accidental: 'b'}]];
    constructor(options) {
		super();
		Vex.Merge(this,options);        
    }
    transformMeasure(measure, iterator, accidentalMap) {
        var index = iterator.index;
		for (var i=0;i<this.selections.length;++i) {
			var selection = this.selections[i].selection;
			
			if (selection.measure === measure.measureNumber.measureIndex) {
				var keys=this.selections[i].keys;
				var tickmap = measure.tickmap();
				var actor = new SmoSetPitchActor(
				    {selection:selection.tick,tickmap:tickmap,keys:keys}
					);
				SmoTickTransformer.applyTransform(measure,[actor]);
				return measure;
			}
		}
		return null; // no change
    }
}
