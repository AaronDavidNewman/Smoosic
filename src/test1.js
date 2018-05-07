const VxTester = {};

// Create an SVG renderer and attach it to the DIV element named "boo".
VxTester.createContext = () => {
  var div = document.getElementById("boo");
  var renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);

  // Configure the rendering context.
  renderer.resize(500, 500);
  var context = renderer.getContext();
  context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");
  return context;
}

// Create the notes
VxTester.notesSet1 = [
  new VF.StaveNote({
    clef: "treble",
    keys: ["c/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["d/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["e/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["f/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["g/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["a/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["b/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["d/4"],
    duration: "8"
  }),
  new VF.StaveNote({
    clef: "treble",
    keys: ["c/5"],
    duration: "8"
  })
];

VxTester.getNotes1 = () => {
  var tuplet = new Vex.Flow.Tuplet(VxTester.notesSet1.slice(6, 9), {
    num_notes: 3,
    notes_occupied: 2,
    ratioed: false,
    bracketed: true,
    location: 1
  });
  return VxTester.notesSet1;
}

VxTester.CommonTests = function() {
  window.music = {};
  window.music.notes = VxTester.getNotes1();
  var context = VxTester.createContext();

  var timeTest = () => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
    return promise;
  }

  var staffMeasure = new StaffMeasure(context);

  var drawInital = () => {
    window.music = staffMeasure.drawNotes(music.notes, 'g1');
    return timeTest();
  }
  var contractTest = () => {
    window.music.notes = VX.DURATION(music.notes, 1, '8')
    window.music = staffMeasure.drawNotes(window.music.notes, 'g2');
    return timeTest();
  }

  var stretchTest = () => {
    window.music.notes = VX.DURATION(music.notes, 1, '4d');
    window.music = staffMeasure.drawNotes(window.music.notes, 'g3');
    return timeTest();
  }

  var pitchTest = () => {
    window.music.notes = VX.SETPITCH(music.notes, 1, ['d/5']);
    window.music = staffMeasure.drawNotes(window.music.notes, 'g4');
    return timeTest();
  }

  var tupletPitchTest = () => {
    window.music.notes = VX.SETPITCH(music.notes, 7, ['a/4']);
    window.music = staffMeasure.drawNotes(window.music.notes, 'g5');
    return timeTest();
  }

  var tupletStretchTest = () => {
    window.music.notes = VX.DURATION(music.notes, 7, '4');
    window.music = staffMeasure.drawNotes(window.music.notes, 'g6');
    return timeTest();
  }
  var tupletContractTest = () => {
    window.music.notes = VX.DURATION(music.notes, 7, '8');
    window.music = staffMeasure.drawNotes(window.music.notes, 'g7');
    return timeTest();
  }

  var unmakeTupletTest = () => {
    window.music.notes = VX.UNTUPLET(music.notes, 6, '4');
    window.music = staffMeasure.drawNotes(window.music.notes, 'g7');
    return timeTest();
  }

  var makeTupletTest = () => {
    window.music.notes = VX.TUPLET(music.notes, 6, '8', 3);
    window.music = staffMeasure.drawNotes(window.music.notes, 'g8');
    return timeTest();
  }

  var endTests = () => {
    new Tracker(window.music, context);
    return timeTest();

  }
  var promise = drawInital().then(stretchTest).then(contractTest).then(pitchTest);
  promise = promise.then(tupletPitchTest).then(tupletStretchTest).then(tupletContractTest);
  promise = promise.then(unmakeTupletTest).then(makeTupletTest).then(endTests);
}

