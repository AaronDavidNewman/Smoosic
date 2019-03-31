

class suiEditor {
	constructor(params) {
		Vex.Merge(this, params);
		this.changed = false; // set to true if the score has changed.
	}

	_transpose(selected, offset) {
		var selection = selected.artifact.selection;
		var measure = this.score.getMeasureAtSelection(selected.artifact.selection);
		if (measure) {
			var pitchArray = [];
			var target = measure.getSelection(measure.activeVoice, selection.tick, pitchArray);
			if (target) {
				target.note.transpose(pitchArray, offset);
				smoModifierFactory.applyModifiers(measure);
				this.changed = true;
			}
		}
	}

	transpose(offset) {

		this.tracker.selections.forEach((selected) => this._transpose(selected, offset));

		if (this.changed) {
			this.layout.render();
			this.tracker.updateMap();
			this.changed=false;
		}
	}
	transposeDown() {
		this.transpose(-1);
	}
	transposeUp() {
		this.transpose(1);
	}
	upOctave() {
		this.transpose(12);
	}
	downOctave() {
		this.transpose(-12);
	}
	
	_setPitch(selected,letter) {
		var measure = selected.artifact.smoMeasure;
		var note=selected.artifact.smoNote;
		var key=vexMusic.getKeySignatureKey(letter,measure.keySignature);
		var prop={key:key[0],accidental:'',octave:note.keys[0].octave};
		if (key.length>1) {
			prop.accidental=key.substring(1);
		} else {
			prop.accidental='';
		}
		note.keys=[prop];
		this.changed=true;
	}

	setPitch(keyEvent) {
		this.tracker.selections.forEach((selected) => this._setPitch(selected, keyEvent.key.toLowerCase()));
		this.layout.render();
		this.tracker.updateMap();
		this.changed=false;
	}
}
