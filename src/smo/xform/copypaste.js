


// ## PasteBuffer
// ### Description:
// Hold some music that can be pasted back to the score
class PasteBuffer {
    constructor() {
        this.buffer = [];
    }
	
	setSelections(score,selections) {
		this.buffer=[];
		selections.forEach((selection) => {
			var selector = JSON.parse(JSON.stringify(selection.selector));
			var note = selection.note.serialize();
			var modifiers = selection.staff.getModifiersAt(selector);
			var modJson =[];
			modifiers.forEach((mod) => {
				modJson.push(mod.serialize());
			});
			this.buffer.push({selector:selector,note:note,modifiers:modJson});
		});
	}
	
	clearSelections() {
		this.buffer=[];
	}
	pasteSelections(score,selector) {
		if (this.buffer.length < 1) {
			return;
		}
		var startSel = this.buffer[0].selector;
		this.buffer.forEach((selection) => {
			var targetSel = SmoSelector.applyOffset(startSel,selector,selection.selector);
			var existing = SmoSelection.noteSelection(score,targetSel);
			// TODO: find closest note and adjust
			if (existing) {
				var note = SmoNote.deserialize(selection.note);
				// replace pitch
				if (note.tickCount === existing.note.tickCount) {
					existing.note.pitches=JSON.parse(JSON.stringify(note.pitches));
				}
			}			
		});
	}
}