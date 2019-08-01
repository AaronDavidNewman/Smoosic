class defaultEditorKeys {
	
	static get keys() {
		return [{
				event: "keydown",
				key: "=",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "transposeUp"
			}, {
				event: "keydown",
				key: "-",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "transposeDown"
			}, {
				event: "keydown",
				key: "=",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "upOctave"
			}, {
				event: "keydown",
				key: "-",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "downOctave"
			},{
				event: "keydown",
				key: "-",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "toggleCourtesyAccidental"
			}, {
				event: "keydown",
				key: ".",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "doubleDuration"
			}, {
				event: "keydown",
				key: ",",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "halveDuration"
			}, {
				event: "keydown",
				key: ">",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "dotDuration"
			}, {
				event: "keydown",
				key: "<",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "undotDuration"
			}, {
				event: "keydown",
				key: "a",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "b",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "c",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "d",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "e",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "f",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "g",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "setPitch"
			}, {
				event: "keydown",
				key: "r",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "makeRest"
			},{
				event: "keydown",
				key: "r",
				ctrlKey: false,
				altKey: true,
				shiftKey: false,
				action: "rerender"
			}, {
				event: "keydown",
				key: "3",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			},
			{
				event: "keydown",
				key: "5",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			},
			{
				event: "keydown",
				key: "7",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "makeTuplet"
			},
			// interval commands
			{
				event: "keydown",
				key: "2",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "3",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "4",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "5",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "6",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "7",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "8",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "interval"
			}, {
				event: "keydown",
				key: "@",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "#",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "%",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "^",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "&",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "*",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "8",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "interval"
			}, {
				event: "keydown",
				key: "0",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "unmakeTuplet"
			}, {
				event: "keydown",
				key: "Insert",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addMeasure"
			}, {
				event: "keydown",
				key: "Delete",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "deleteMeasure"
			},
			 {
				event: "keydown",
				key: "z",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "undo"
			},
			 {
				event: "keydown",
				key: "c",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "copy"
			},
			{
				event: "keydown",
				key: "x",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "toggleBeamGroup"
			},
			 {
				event: "keydown",
				key: "v",
				ctrlKey: true,
				altKey: false,
				shiftKey: false,
				action: "paste"
			},
			 {
				event: "keydown",
				key: "h",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			},
			 {
				event: "keydown",
				key: "i",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "j",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "k",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "l",
				ctrlKey: false,
				altKey: false,
				shiftKey: false,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "H",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			},
			 {
				event: "keydown",
				key: "I",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "J",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "K",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			},
			{
				event: "keydown",
				key: "L",
				ctrlKey: false,
				altKey: false,
				shiftKey: true,
				action: "addRemoveArticulation"
			}		
			];
	}
}