

// ## suiEditor
// Editor handles key events and converts them into commands, updating the score and
// display
class suiEditor {
  constructor(params) {
    Vex.Merge(this, params);
    this.slashMode = false;
  }

	tempoDialog() {
		SuiTempoDialog.createAndDisplay(
      {
        buttonElement:this.buttonElement,
        buttonData:this.buttonData,
        completeNotifier:this.controller,
        tracker: this.tracker,
        layout:this.layout,
        undoBuffer:this.undoBuffer,
        eventSource:this.eventSource,
        editor:this
      }
    );
	}

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
		this.tracker.replaceSelectedMeasures();
    }

	_refresh() {
		this.layout.setRefresh();
	}

  get score() {
      return this.layout.score;
  }

  _renderAndAdvance() {
    this.tracker.replaceSelectedMeasures();
	  this.tracker.moveSelectionRight(null,true);
  }
  _rebeam() {
      this.tracker.getSelectedMeasures().forEach((measure) => {
        smoBeamerFactory.applyBeams(measure);
      });
  }
  _batchDurationOperation(operation) {
    SmoUndoable.batchDurationOperation(this.layout.score, this.tracker.selections, operation, this.undoBuffer);
    this._rebeam();
    this._render();
  }

	scoreSelectionOperation(selection,name,parameters,description) {
		SmoUndoable.scoreSelectionOp(this.layout.score,selection,name,parameters,
	    this.undoBuffer,description);
		this._render();
	}


	scoreOperation(name,parameters,description) {
		SmoUndoable.scoreOp(this.layout.score,name,parameters,this.undoBuffer,description);
		this._render();
	}

  _selectionOperation(selection, name, parameters) {
    if (parameters) {
      SmoUndoable[name](selection, parameters, this.undoBuffer);
    } else {
      SmoUndoable[name](selection, this.undoBuffer);
    }
	  this._render();
  }

  undo() {
    this.layout.undo(this.undoBuffer);
  }

  _singleSelectionOperation(name, parameters) {
    var selection = this.tracker.selections[0];
    if (parameters) {
      SmoUndoable[name](selection, parameters, this.undoBuffer);
    } else {
      SmoUndoable[name](selection, this.undoBuffer);
    }
    suiOscillator.playSelectionNow(selection);
    this._rebeam();
    this._render();
  }

  _transpose(selection, offset, playSelection) {
      this._selectionOperation(selection, 'transpose', offset);
      if (playSelection) {
          suiOscillator.playSelectionNow(selection);
      }
  }

  copy() {
      if (this.tracker.selections.length < 1) {
          return;
      }
      this.pasteBuffer.setSelections(this.layout.score, this.tracker.selections);
  }
  paste() {
      if (this.tracker.selections.length < 1) {
          return;
      }

      SmoUndoable.pasteBuffer(this.layout.score, this.pasteBuffer, this.tracker.selections, this.undoBuffer, 'paste')
      this._rebeam();
      this._refresh();
  }
  toggleBeamGroup() {
      if (this.tracker.selections.length < 1) {
          return;
      }
      SmoUndoable.toggleBeamGroups(this.tracker.selections, this.undoBuffer);
      this._rebeam();
      this._render();
  }

  beamSelections() {
      if (this.tracker.selections.length < 1) {
          return;
      }
      SmoUndoable.beamSelections(this.tracker.selections, this.undoBuffer);
      this._rebeam();
      this._render();
  }
  toggleBeamDirection() {
      if (this.tracker.selections.length < 1) {
          return;
      }
      SmoUndoable.toggleBeamDirection(this.tracker.selections, this.undoBuffer);
      this._render();
  }

  collapseChord() {
      SmoUndoable.noop(this.layout.score, this.undoBuffer);
      this.tracker.selections.forEach((selection) => {
          var p = selection.note.pitches[0];
          p = JSON.parse(JSON.stringify(p));
          selection.note.pitches = [p];
      });
      this._render();
  }

  playScore() {
    var mm = this.tracker.getExtremeSelection(-1);
    if (suiAudioPlayer.playingInstance && suiAudioPlayer.playingInstance.paused) {
      suiAudioPlayer.playingInstance.play();
      return;
    }
    new suiAudioPlayer({score:this.layout.score,startIndex:mm.selector.measure,tracker:this.tracker}).play();
  }

  stopPlayer() {
    suiAudioPlayer.stopPlayer();
  }
  pausePlayer() {
    suiAudioPlayer.pausePlayer();
  }

  intervalAdd(interval, direction) {
    this._singleSelectionOperation('interval', direction * interval);
  }

  interval(keyEvent) {
    if (this.tracker.selections.length != 1)
      return;
    // code='Digit3'
    var interval = parseInt(keyEvent.keyCode) - 49;  // 48 === '0', 0 indexed
    if (isNaN(interval) || interval < 1 || interval > 7) {
      return;
    }
    this.intervalAdd(interval, keyEvent.shiftKey ? -1 : 1);
  }

  transpose(offset) {
      var grace = this.tracker.getSelectedGraceNotes();
      if (grace.length) {
          grace.forEach((artifact) => {
              SmoUndoable.transposeGraceNotes(artifact.selection,{modifiers:artifact.modifier,offset:offset},this.undoBuffer);
          });
          this._render();

          return;
      }
      // If there are lots of selections, just play the first note
      var playSelection = true;
      this.tracker.selections.forEach((selected) => {
          this._transpose(selected, offset, playSelection);
          playSelection = false;
      });
      this._render();
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
  makeRest() {
      this.tracker.selections.forEach((selection) => {
          this._selectionOperation(selection,'makeRest');
      });
      this.tracker.replaceSelectedMeasures();
  }

  _setPitch(selected, letter) {
    var selector = selected.selector;
    var hintSel = SmoSelection.lastNoteSelection(this.layout.score,
      selector.staff, selector.measure, selector.voice, selector.tick);
    if (!hintSel) {
      hintSel = SmoSelection.nextNoteSelection(this.layout.score,
        selector.staff, selector.measure, selector.voice, selector.tick);
    }
    // The selection no longer exists, possibly deleted
    if (!hintSel) {
      return;
    }

    var hintNote = hintSel.note;
    var hpitch = hintNote.pitches[0];
    var pitch = JSON.parse(JSON.stringify(hpitch));
    pitch.letter = letter;

    // Make the key 'a' make 'Ab' in the key of Eb, for instance
    var vexKsKey = smoMusic.getKeySignatureKey(letter, selected.measure.keySignature);
    if (vexKsKey.length > 1) {
        pitch.accidental = vexKsKey[1];
    } else {
        pitch.accidental = 'n';
    }

    // make the octave of the new note as close to previous (or next) note as possible.
    var upv = ['bc', 'ac', 'bd', 'da', 'be', 'gc'];
    var downv = ['cb', 'ca', 'db', 'da', 'eb', 'cg'];
    var delta = hpitch.letter + pitch.letter;
    if (upv.indexOf(delta) >= 0) {
        pitch.octave += 1;
    }
    if (downv.indexOf(delta) >= 0) {
      pitch.octave -= 1;
    }
    SmoUndoable['setPitch'](selected, pitch, this.undoBuffer);
    suiOscillator.playSelectionNow(selected);
  }

    setPitchCommand(letter) {
        this.tracker.selections.forEach((selected) => this._setPitch(selected, letter));
        this._renderAndAdvance();
    }

    setPitch(keyEvent) {
        this.setPitchCommand(keyEvent.key.toLowerCase());
    }

    dotDuration(keyEvent) {
        this._batchDurationOperation('dotDuration');
    }

    undotDuration(keyEvent) {
        this._batchDurationOperation('undotDuration');
    }

    doubleDuration(keyEvent) {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.doubleGraceNoteDuration(artifact.selection,artifact.modifier,this.undoBuffer);
            });
            this._render();

            return;
        }
        this._batchDurationOperation('doubleDuration');
    }

    halveDuration(keyEvent) {
        var grace = this.tracker.getSelectedGraceNotes();
        if (grace.length) {
            grace.forEach((artifact) => {
                SmoUndoable.halveGraceNoteDuration(artifact.selection,artifact.modifier,this.undoBuffer);
            });
            this._render();
            return;
        }
        this._batchDurationOperation('halveDuration');
    }

    addMeasure(keyEvent) {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var measure = this.tracker.getFirstMeasureOfSelection();
        if (measure) {
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
			var pos = measure.measureNumber.measureIndex;
			if (keyEvent.shiftKey) {
				pos += 1;
			}
            nmeasure.measureNumber.measureIndex = pos;
            nmeasure.setActiveVoice(0);
            SmoUndoable.addMeasure(this.layout.score, pos, nmeasure, this.undoBuffer);
            this.layout.clearLine(measure);
            this._refresh();
        }
    }
	deleteMeasure() {
    if (this.tracker.selections.length < 1) {
      return;
    }
    // don't delete the last measure
    if (this.layout.score.staves[0].measures.length < 2) {
      return;
    }
    var selection = this.tracker.selections[0];
    var ix = selection.selector.measure;
    this.layout.score.staves.forEach((staff) => {
      this.layout.unrenderMeasure(staff.measures[ix]);
      this.layout.unrenderMeasure(staff.measures[staff.measures.length-1]);

      // A little hacky - delete the modifiers if they start or end on
      // the measure
      staff.modifiers.forEach((modifier) => {
        if (modifier.startSelector.measure == ix || modifier.endSelector.measure == ix) {
  	        $(this.layout.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
        }
        });
    });
    this.tracker.deleteMeasure(selection);
    // this.layout.unrenderAll();

    SmoUndoable.deleteMeasure(this.layout.score, selection, this.undoBuffer);
    this.tracker.loadScore();
    this._refresh();
  }

  toggleCourtesyAccidental() {
    var grace = this.tracker.getSelectedGraceNotes();
    if (grace.length) {
      grace.forEach((artifact) => {
        SmoUndoable.toggleGraceNoteCourtesyAccidental(artifact.selection,{modifiers:artifact.modifier},this.undoBuffer);
      });
      this._render();

      return;
    }
    if (this.tracker.selections.length < 1) {
      return;
    }
    this.tracker.selections.forEach((selection) => {
      SmoUndoable.toggleCourtesyAccidental(selection, this.undoBuffer);
    });
    this._render();
  }
  toggleEnharmonic() {
    this.tracker.selections.forEach((selected) => this._selectionOperation(selected, 'toggleEnharmonic'));
    this._render();
  }

  rerender(keyEvent) {
    this.layout.unrenderAll();
    SmoUndoable.noop(this.layout.score, this.undoBuffer);
    this.undo();
    this._render();
  }
  makeTupletCommand(numNotes) {
    this._singleSelectionOperation('makeTuplet', numNotes);
  }
  makeTuplet(keyEvent) {
    var numNotes = parseInt(keyEvent.key);
    this.makeTupletCommand(numNotes);
  }

  unmakeTuplet(keyEvent) {
    this._singleSelectionOperation('unmakeTuplet');
  }
  setNoteHead(keyEvent) {
     SmoUndoable.setNoteHead(this.layout.score, this.tracker.selections, 'x2', this.undoBuffer);
     this._render();
  }
  removeGraceNote(keyEvent) {
    this._singleSelectionOperation('removeGraceNote',{index:0});
  }
  addGraceNote(keyEvent) {
    this._singleSelectionOperation('addGraceNote');
  }
  slashGraceNotes(keyEvent) {
    if (!this.tracker.modifierSelections.length) {
      return;
    }
    this._selectionOperation(this.tracker.modifierSelections,'slashGraceNotes');
  }

  toggleArticulationCommand(articulation, ctor) {
    this.undoBuffer.addBuffer('change articulation ' + articulation,
      'staff', this.tracker.selections[0].selector, this.tracker.selections[0].staff);

    this.tracker.selections.forEach((sel) => {

      if (ctor === 'SmoArticulation') {
        var aa = new SmoArticulation({
            articulation: articulation
        });
       SmoOperation.toggleArticulation(sel, aa);
      } else {
        var aa = new SmoOrnament({
            ornament: articulation
        });
        SmoOperation.toggleOrnament(sel, aa);
      }
    });
    this._render();
  }

    addRemoveArticulation(keyEvent) {
        if (this.tracker.selections.length < 1)
            return;

        var atyp = SmoArticulation.articulations.accent;

        if (keyEvent.key.toLowerCase() === 'h') {
            atyp = SmoArticulation.articulations.accent;
        }
        if (keyEvent.key.toLowerCase() === 'i') {
            atyp = SmoArticulation.articulations.tenuto;
        }
        if (keyEvent.key.toLowerCase() === 'j') {
            atyp = SmoArticulation.articulations.staccato;
        }
        if (keyEvent.key.toLowerCase() === 'k') {
            atyp = SmoArticulation.articulations.marcato;
        }
        if (keyEvent.key.toLowerCase() === 'l') {
            atyp = SmoArticulation.articulations.pizzicato;
        }
        this.toggleArticulationCommand(atyp, 'SmoArticulation');

    }
}
