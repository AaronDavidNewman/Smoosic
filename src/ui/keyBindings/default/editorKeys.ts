import { KeyBinding } from './trackerKeys';
export class defaultEditorKeys {
  static get keys(): KeyBinding[] {
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
        key: "+",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "upOctave"
      }, {
        event: "keydown",
        key: "_",
        ctrlKey:false,
        altKey: false,
        shiftKey: true,
        action: "downOctave"
      }, {
        event: "keydown",
        key: "F",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
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
        key: "A",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "slashGraceNotes"
      }, {
        event: "keydown",
        key: "b",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "setPitch"
      }, {
        event: "keydown",
        key: "G",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addGraceNote"
      }, {
        event: "keydown",
        key: "g",
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        action: "removeGraceNote"
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
      }, {
        event: "keydown",
        key: "r",
        ctrlKey: false,
        altKey: true,
        shiftKey: false,
        action: "rerender"
      }, {
        event: "keydown",
        key: "p",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "playScore"
      }, {
        event: "keydown",
        key: "P",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "pausePlayer"
      },
            {
        event: "keydown",
        key: "s",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "stopPlayer"
      },             {
        event: "keydown",
        key: "t",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "tempoDialog"
      },
      {
        event: "keydown",
        key: "3",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "makeTuplet"
      }, {
        event: "keydown",
        key: "5",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "makeTuplet"
      }, {
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
        key: "$",
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
      },{
        event: "keydown",
        key: "Insert",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addMeasure"
      }, {
        event: "keydown",
        key: "i",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "addMeasure"
      }, {
        event: "keydown",
        key: "I",
        ctrlKey: true,
        altKey: false,
        shiftKey: true,
        action: "addMeasure"
      }, {
        event: "keydown",
        key: "B",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "toggleBeamDirection"
      }, {
        event: "keydown",
        key: "Delete",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "deleteNote"
      }, {
        event: "keydown",
        key: "d",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "deleteNote"
      }, {
        event: "keydown",
        key: "z",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "undo"
      }, {
        event: "keydown",
        key: "c",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "copy"
      }, {
        event: "keydown",
        key: "x",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "toggleBeamGroup"
      }, {
        event: "keydown",
        key: "X",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "beamSelections"
      },{
        event: "keydown",
        key: "v",
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
        action: "paste"
      }, {
        event: "keydown",
        key: "h",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "i",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "j",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "k",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "l",
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "H",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "I",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "J",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "K",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addRemoveArticulation"
      }, {
        event: "keydown",
        key: "L",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "addRemoveArticulation"
      },{
        event: "keydown",
        key: "E",
        ctrlKey: false,
        altKey: false,
        shiftKey: true,
        action: "toggleEnharmonic"
      }
    ];
  }

}