

class suiEditor {
	constructor(params) {
        Vex.Merge(this, params);
	}

	transpose(offset) {
		var changed = false;
		
		var self=this;

		this.tracker.selections.forEach(function (track) {
			var selection = track.artifact.selection;
			var measure = self.score.getMeasureAtSelection(track.artifact.selection);
			if (measure) {
				var pitchArray = [];
				var target = measure.getSelection(measure.activeVoice, selection.tick, pitchArray);
				if (target) {
					target.note.transpose(pitchArray, offset);
					smoModifierFactory.applyModifiers(measure);
					changed = true;
				}
			}
		});
		if (changed) {
			this.layout.render();
			this.tracker.updateMap();
		}
	}
	transposeDown() {
		this.transpose(-1);
	}
	transposeUp() {
		this.transpose(1);
	}
}
