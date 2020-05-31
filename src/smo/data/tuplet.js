
class SmoTuplet {
  constructor(params) {
    this.notes = params.notes;
    Vex.Merge(this, SmoTuplet.defaults);
    smoSerialize.serializedMerge(SmoTuplet.parameterArray, params, this);
    if (!this['attrs']) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoTuplet'
      };
    } else {
    }
    this._adjustTicks();
  }

	static get longestTuplet() {
		return 8192;
	}

  get clonedParams() {
    var paramAr = ['stemTicks', 'ticks', 'totalTicks', 'durationMap'];
    var rv = {};
    smoSerialize.serializedMerge(paramAr, this, rv);
    return rv;

  }

  static get parameterArray() {
    return ['stemTicks', 'ticks', 'totalTicks', 'durationMap','attrs','ratioed','bracketed','voice','startIndex'];
  }

  serialize() {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoTuplet.defaults,
     SmoTuplet.parameterArray,this,params);
    return params;
  }

	static calculateStemTicks(totalTicks,numNotes) {
    var stemValue = totalTicks / numNotes;
    var stemTicks = SmoTuplet.longestTuplet;

    // The stem value is the type on the non-tuplet note, e.g. 1/8 note
    // for a triplet.
    while (stemValue < stemTicks) {
      stemTicks = stemTicks / 2;
    }
		return stemTicks * 2;
	}

  static cloneTuplet(tuplet) {
    var noteAr = tuplet.notes;
    var durationMap = JSON.parse(JSON.stringify(tuplet.durationMap)); // deep copy array

    // Add any remainders for oddlets
    var totalTicks = noteAr.map((nn) => nn.ticks.numerator+nn.ticks.remainder).reduce((acc, nn) => acc+nn);

    var numNotes = tuplet.numNotes;
    var stemValue = totalTicks / numNotes;
    var stemTicks = SmoTuplet.calculateStemTicks(totalTicks,numNotes);

    var tupletNotes = [];

    var i = 0;
    noteAr.forEach((note) => {
      var textModifiers = note.textModifiers;
      // Note preserver remainder
      note = SmoNote.cloneWithDuration(note, {
        numerator: stemTicks*tuplet.durationMap[i],
        denominator: 1,
        remainder: note.ticks.remainder
      });

      // Don't clone modifiers, except for first one.
      if (i === 0) {
        var ntmAr = [];
        textModifiers.forEach((tm) => {
          var ntm = SmoNoteModifierBase.deserialize(tm);
          ntmAr.push(ntm);
        });
        note.textModifiers = ntmAr;
      }
      i += 1;

      tupletNotes.push(note);
    });
    var rv = new SmoTuplet({
      notes: tupletNotes,
      stemTicks: stemTicks,
      totalTicks: totalTicks,
      ratioed: false,
      bracketed: true,
      startIndex: tuplet.startIndex,
      durationMap: durationMap
    });
    return rv;
  }

  _adjustTicks() {
    var sum = this.durationSum;
    for (var i = 0; i < this.notes.length; ++i) {
      var note = this.notes[i];
      var normTicks = smoMusic.durationToTicks(smoMusic.ticksToDuration[this.stemTicks]);
      // TODO:  notes_occupied needs to consider vex duration
      var tupletBase = normTicks * this.note_ticks_occupied;
      note.ticks.denominator = 1;
      note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);

      note.tuplet = this.attrs;
    }

		// put all the remainder in the first note of the tuplet
		var noteTicks = this.notes.map((nn) => {return nn.tickCount;}).reduce((acc,dd) => {return acc+dd;});
    // bug fix:  if this is a clones tuplet, remainder is already set
		this.notes[0].ticks.remainder = this.notes[0].ticks.remainder + this.totalTicks-noteTicks;
  }
  getIndexOfNote(note) {
    var rv = -1;
    for (var i = 0; i < this.notes.length; ++i) {
      var tn = this.notes[i];
      if (note.attrs.id === tn.attrs.id) {
          rv = i;
      }
    }
    return rv;
  }

  split(combineIndex) {
    var multiplier = 0.5;
    var nnotes = [];
    var nmap = [];

    for (var i = 0; i < this.notes.length; ++i) {
      var note = this.notes[i];
      if (i === combineIndex) {
        nmap.push(this.durationMap[i] * multiplier);
        nmap.push(this.durationMap[i] * multiplier);
        note.ticks.numerator *= multiplier;

        var onote = SmoNote.clone(note);
        // remainder is for the whole tuplet, so don't duplicate that.
        onote.ticks.remainder=0;
        nnotes.push(note);
        nnotes.push(onote);
      } else {
        nmap.push(this.durationMap[i]);
        nnotes.push(note);
      }
    }
    this.notes = nnotes;
    this.durationMap = nmap;
  }
  combine(startIndex, endIndex) {
    // can't combine in this way, too many notes
    if (this.notes.length <= endIndex || startIndex >= endIndex) {
      return this;
    }
    var acc = 0.0;
    var i;
    var base = 0.0;
    for (i = startIndex; i <= endIndex; ++i) {
      acc += this.durationMap[i];
      if (i == startIndex) {
        base = this.durationMap[i];
      } else if (this.durationMap[i] != base) {
        // Can't combine non-equal tuplet notes
        return this;
      }
    }
    // how much each combined value will be multiplied by
    var multiplier = acc / base;

    var nmap = [];
    var nnotes = [];
    // adjust the duration map
    for (i = 0; i < this.notes.length; ++i) {
      var note = this.notes[i];
      // notes that don't change are unchanged
      if (i < startIndex || i > endIndex) {
        nmap.push(this.durationMap[i]);
        nnotes.push(note);
      }
      // changed note with combined duration
      if (i == startIndex) {
        note.ticks.numerator = note.ticks.numerator * multiplier;
        nmap.push(acc);
        nnotes.push(note);
      }
      // other notes after startIndex are removed from the map.
    }
    this.notes = nnotes;
    this.durationMap = nmap;
  }

  // ### getStemDirection
  // Return the stem direction, so we can bracket the correct place
  getStemDirection(clef) {
    const note = this.notes.find((nn) => nn.noteType === 'n');
    if (!note) {
      return SmoNote.flagStates.down;;
    }
    if (note.flagState != SmoNote.flagStates.auto) {
      return note.flagState;
    }
    return smoMusic.pitchToLedgerLine(clef,note.pitches[0])
       >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
  }
  get durationSum() {
    var acc = 0;
    for (var i = 0; i < this.durationMap.length; ++i) {
      acc += this.durationMap[i];
    }
    return Math.round(acc);
  }
  get num_notes() {
    return this.durationSum;
  }
  get notes_occupied() {
    return Math.floor(this.totalTicks / this.stemTicks);
  }
  get note_ticks_occupied() {
    return this.totalTicks / this.stemTicks;
  }
  get tickCount() {
    var rv = 0;
    for (var i = 0; i < this.notes.length; ++i) {
      var note = this.notes[i];
      rv += (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
    }
    return rv;
  }

  static get defaults() {
    return {
      numNotes: 3,
      totalTicks: 4096, // how many ticks this tuple takes up
      stemTicks: 2048, // the stem ticks, for drawing purposes.  >16th, draw as 8th etc.
      durationMap: [1.0, 1.0, 1.0],
      bracketed: true,
      voice:0,
      ratioed: false
    }
  }
}
