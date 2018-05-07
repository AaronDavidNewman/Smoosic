VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;

class StaffMeasure {
    constructor(context, renderer) {
        this.context = context;
        this.renderer = renderer;
        this.notes = [];
    }


    drawNotes(notes, grpname) {
        if (this.notes.length) {
            $(this.context.svg).find('#vf-' + this.notes[0].attrs.id).closest('g.measure').remove();
        }
        this.notes = notes;

        var group = this.context.openGroup();
        group.classList.add(grpname);
        group.classList.add('measure');

        // Create a stave of width 400 at position 10, 40 on the canvas.
        var stave = new VF.Stave(10, 40, 400);

        // Add a clef and time signature.
        stave.addClef("treble").addTimeSignature("4/4");

        // Connect it to the rendering context and draw!
        stave.setContext(this.context).draw();

        // console.log(JSON.stringify(notes));
        // Create a voice in 4/4 and add above notes
        var voice = new VF.Voice({
            num_beats: 4
        });
        voice.addTickables(notes);

        // var beams = VF.Beam.generateBeams(notes);
        this.createBeamGroups(voice, notes);
        // Format and justify the notes to 400 pixels.
        var formatter = new VF.Formatter().joinVoices([voice]).formatToStave([voice], stave);

        // Render voice
        voice.draw(this.context, stave);
        this.drawBeams();

        this.drawTuplets(notes, this.context);
        this.context.closeGroup();

        return {
            group: group,
            voice: voice,
            staff: stave,
            notes: notes,
            beams: this.beams
        };
    }

    drawBeams() {
        var self = this;
        this.beams.forEach(function (b) {
            b.setContext(self.context).draw()
        });
    }
    createBeamGroups(voice, notes) {

        var rv = [];
        var duration = 0;
        var startRange = 0;
        var beamLogic = function (iterator, notes, note) {
            duration += iterator.delta;
            if (note.tupletStack.length) {
                //todo: when does stack have more than 1?
                var tuplen = note.tupletStack[0].notes.length;

                // Get an array of tuplet notes, and skip to the end of the tuplet
                var tupNotes = iterator.skipNext(tuplen);

                rv.push(new VF.Beam(tupNotes));
                return;
            }
            // don't beam > 1/4 note in 4/4 time
            if (iterator.delta >= iterator.beattime) {
                duration = 0;
                startRange = iterator.index + 1;
                // iterator.resetRange();
                return;
            }
            if (duration == iterator.beattime) {

                rv.push(new VF.Beam(notes.slice(startRange, iterator.index + 1)));
                startRange = iterator.index + 1;
                duration = 0;
                return;
            }

            // If this does not align on a beat, don't beam it
            if (duration > iterator.beattime ||
                ((iterator.totalDuration - duration) % 4096 != 0)) {
                duration = 0;
                startRange = iterator.index + 1;
                return;
            }
        }
        VX.ITERATE(beamLogic, notes, voice);
        this.beams = rv;
    }

    drawTuplets(notes, context) {
        var self = this;
        VX.ITERATE(function (iterator, notes, note) {
            note.tupletStack.forEach(function (tuplet) {
                tuplet.setContext(self.context).draw();
            });
        }, notes);
    }

}


class Tracker {
  constructor(music, context) {
    this.modNote = 0;
    this.music = music;
    this.context = context;
    this.drawRect(music.notes[0]);
    var self = this;

    $('#left').off('click').on('click', function() {
      self.leftHandler();
    });

    $('#right').off('click').on('click', function() {
      self.rightHandler();
    });
  }

  drawRect(note) {
    $(this.context.svg).find('g.vf-note-box').remove();
    var bb = note.getBoundingBox();
    var grp = this.context.openGroup('note-box', 'box-' + note.attrs.id);
    this.context.rect(bb.x, bb.y, bb.w + 3, bb.h + 3, {
      stroke: '#fc9',
      'stroke-width': 2,
      'fill': 'none'
    });
    this.context.closeGroup(grp);
  }
  leftHandler() {
    var len = this.music.notes.length;
    this.modNote = (this.modNote + len - 1) % len;
    this.drawRect(this.music.notes[this.modNote]);

  }
  rightHandler() {
    var len = this.music.notes.length;
    this.modNote = (this.modNote + 1) % len;
    this.drawRect(this.music.notes[this.modNote]);

  }
}
