VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4'

class VxMeasure {
    constructor(context, options) {
        this.context = context;
        this.timeSignature = '4/4';
        this.keySignature = "G";
		Vex.Merge(this,StaffMeasure.defaults);
        Vex.Merge(this, options);
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));
        this.groupName = 'staffGroup-' + VX.groupCounter;
        VX.groupCounter += 1;		
    }
	
	static get defaults() {
		this.timeSignature = '4/4';
        this.keySignature = "C";
		this.staffX=10;
		this.staffY=40;
		this.drawClef=true;
		this.staffWidth=400;
		this.clef='treble';
		this.numBeats = 4;
		this.notes= [
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            }),
            new VF.StaveNote({
                clef: "treble",
                keys: ["b/5"],
                duration: "4"
            })
	}
	
	_createMusic() {
		if (this.replace) {
			this.staffX = this.replace.staffX;
			this.staffY = this.replace.staffY;
			this.staffWidth = this.replace.staffWidth;
		}
		
		this.stave = new VF.Stave(this.staffX, this.staffY, this.staffWidth);

		 // Add a clef and time signature.
		 if (this.drawClef) {
			this.stave.addClef(this.clef).addTimeSignature(this.timeSignature).addKeySignature(this.keySignature);
		}
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        // console.log(JSON.stringify(notes));
        // Create a voice in 4/4 and add above notes
        this.voice = new VF.Voice({
                num_beats: this.num_beats
            });
			
	}
	
	_getBeamGroups() {
		var beamGroups = [];
		var beamGroupId = {};
		for (var i=0;i<notes.length;++i) {
			var note = notes[i];
			if (note['beam']) {
				if (!beamGroupId[beam.attr.id]){
					beamGroupId[beam.attr.id]={value:true};
					beamGroups.push(note.beam);
				}
			}
		}
		return beamGroups;
	}

    render() {
		
		this.beamGrups = this._getBeamGroups();
		
        if (this.notes.length) {
            $(this.context.svg).find('#vf-' + this.notes[0].attrs.id).closest('g.measure').remove();
        }        

        var group = this.context.openGroup();
        group.classList.add(this.groupName);
        group.classList.add('measure');


        // this.createBeamGroups(voice, notes);

        // Format and justify the notes to 400 pixels.
        var formatter = new VF.Formatter().joinVoices([this.voice]).formatToStave([this.voice], this.stave);

        // Render voice
        this.voice.draw(this.context, stave);
        this.drawBeams();

        this.drawTuplets(notes, this.context);
        this.context.closeGroup();        
    }

    drawBeams() {
        var self = this;
        this.beamGroups.forEach(function (b) {
            b.setContext(self.context).draw()
        });
    }    

    drawTuplets(notes, context) {
        var self = this;
		var iterator = vxTickIterate(this);
        iterator.iterate((iterator, notes, note)  => {
            note.tupletStack.forEach(function (tuplet) {
                tuplet.setContext(self.context).draw();
            });
        });
    }
}
