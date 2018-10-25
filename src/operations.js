
class vxMeasureOperations {
	/*
	static applyNoopDurationTransform(measure) {
		// -1 because no change in duration
		var actors = vxDurationFactory.vxCreateDurationChangeActors(measure,-1);
		var transformer = new VxTransformer(measure,[transposer]);
		transformer.run();
		measure.notes = transformer.notes;
	}
    static setDuration(measure,selection,duration) {
		var newTicks = VF.durationToTicks(duration);
		var tickmap=VX.TICKMAP(measure);
		var durationActors = vxCreateDurationChangeActors(measure,selection.tickArray()[0],newTicks);
		var transformer = new VxTransformer(measure,actors);
		transformer.run();
			
		measure.applyModifiers();
		return measure;
    }

    static transposeHandler(measure,selection,offset) {
        var keys = [];
        var canon = VF.Music.canonical_notes;
		var transposer=new vxTransposePitchActor(measure,selection,offset);
		var transformer = new VxTransformer(measure,[transposer]);
		transformer.run();
		measure.notes = transformer.notes;
		
		var actors = vxDurationFactory.vxCreateDurationChangeActors(measure,-1);
		transformer = new VxTransformer(measure,[transposer]);
		transformer.run();		
				
        measure.applyModifiers();
		return measure;
    }
	
	static setPitchHandler(measure,selection,pitch) {
		var pitcher = vxDurationFactory.vxCreateDurationChangeActors(measure,-1);
		var transformer = new VxTransformer(measure,[pitcher]);
		
		transformer.run();
		measure.notes = transformer.notes;
		
		// -1 because no change in duration
		var notes = vxMeasureOperations.applyNoopDurationTransform(measure);
		
		measure = new VxMeasure(measure.context,{
			notes:notes,
			replace:measure
		});

		measure.applyModifiers();
		return measure;
	}
	static setNoteType(measure,selection,noteType) {
		var typeActor = new vxSetNoteTypeActor(measure,selection,noteType);
		var transformer = new VxTransformer(measure,[typeActor]);
		
		transformer.run();
		measure.notes = transformer.notes;
		measure = new VxMeasure(measure.context,{
			notes:notes,
			replace:measure
		});

		measure.applyModifiers();
		return measure;
	}     */
}
