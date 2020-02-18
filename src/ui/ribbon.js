

// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ## RibbonButton methods
// ---
class RibbonButtons {
	static get paramArray() {
		return ['ribbonButtons', 'ribbons', 'editor', 'controller', 'tracker', 'menus'];
	}
	static ribbonButton(buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
		var b = htmlHelpers.buildDom;
		var r = b('div').classes('ribbonButtonContainer').append(b('button').attr('id', buttonId).classes(buttonClass).append(
					b('span').classes('left-text').append(
					    b('span').classes('text-span').text(buttonText)).append(
					b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
					b('span').classes('ribbon-button-hotkey').text(buttonKey)));
		return r.dom();
	}
	constructor(parameters) {
		smoMusic.filteredMerge(RibbonButtons.paramArray, parameters, this);
		this.ribbonButtons = parameters.ribbonButtons;
		this.ribbons = parameters.ribbons;
		this.collapsables = [];
		this.collapseChildren = [];
	}
	_executeButtonModal(buttonElement, buttonData) {
		var ctor = eval(buttonData.ctor);
		ctor.createAndDisplay(buttonElement, buttonData,this.controller);
	}
	_executeButtonMenu(buttonElement, buttonData) {
		var self = this;
        this.controller.unbindKeyboardForMenu(this.menus);
		this.menus.createMenu(buttonData.ctor);
	}
	_bindCollapsibleAction(buttonElement, buttonData) {
		// collapseParent
		this.collapsables.push(new CollapseRibbonControl({
				ribbonButtons: this.ribbonButtons,
				menus: this.menus,
				tracker: this.tracker,
				controller: this.controller,
				editor: this.editor,
				buttonElement: buttonElement,
				buttonData: buttonData
			}));
	}

	_rebindController() {
		this.controller.render();
		this.controller.bindEvents();
	}
	_executeButton(buttonElement, buttonData) {
		if (buttonData.action === 'modal') {
			this._executeButtonModal(buttonElement, buttonData);
			return;
		}
		if (buttonData.action === 'menu') {
			this._executeButtonMenu(buttonElement, buttonData);
			return;
		}
	}

	_bindButton(buttonElement, buttonData) {
		var self = this;
		$(buttonElement).off('click').on('click', function () {
			self._executeButton(buttonElement, buttonData);
		});
	}
	_createButtonHtml(buttonAr, selector) {
		buttonAr.forEach((buttonId) => {
			var b = this.ribbonButtons.find((e) => {
					return e.id === buttonId;
				});
			if (b) {
				if (b.action === 'collapseChild') {
					this.collapseChildren.push(b);
				} else {

					var buttonHtml = RibbonButtons.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
					$(buttonHtml).attr('data-group', b.group);

					$(selector).append(buttonHtml);
					var el = $(selector).find('#' + b.id);
					this._bindButton(el, b);
					if (b.action == 'collapseParent') {
						$(buttonHtml).addClass('collapseContainer');
						this._bindCollapsibleAction(el, b);
					}
				}
			}
		});
		this.collapseChildren.forEach((b) => {
			var buttonHtml = RibbonButtons.ribbonButton(b.id, b.classes, b.leftText, b.icon, b.rightText);
			if (b.dataElements) {
				var bkeys = Object.keys(b.dataElements);
				bkeys.forEach((bkey) => {
					var de = b.dataElements[bkey];
					$(buttonHtml).find('button').attr('data-' + bkey, de);
				});
			}
			var parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
			$(parent).append(buttonHtml);
			var el = $(selector).find('#' + b.id);
			this._bindButton(el, b);
		});
		this.collapsables.forEach((cb) => {
			cb.bind();
		});
	}
	display() {
		$('body .controls-left').html('');
		$('body .controls-top').html('');

		var buttonAr = this.ribbons['left'];
		this._createButtonHtml(buttonAr, 'body .controls-left');

		buttonAr = this.ribbons['top'];
		this._createButtonHtml(buttonAr, 'body .controls-top');
	}
}

class DebugButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			$('body').trigger('redrawScore');
		});
    }
}

class BeamButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
    operation() {
        if (this.buttonData.id === 'breakBeam') {
			this.editor.toggleBeamGroup();
        } else if (this.buttonData.id === 'beamSelections') {
            this.editor.beamSelections();
        } else if (this.buttonData.id === 'toggleBeamDirection') {
            this.editor.toggleBeamDirection();
        }
    }
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.operation();
		});
    }
}
class DurationButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	setDuration() {
		if (this.buttonData.id === 'GrowDuration') {
			this.editor.doubleDuration();
		} else if (this.buttonData.id === 'LessDuration') {
			this.editor.halveDuration();
		} else if (this.buttonData.id === 'GrowDurationDot') {
			this.editor.dotDuration();
		} else if (this.buttonData.id === 'LessDurationDot') {
			this.editor.undotDuration();
		} else if (this.buttonData.id === 'TripletButton') {
			this.editor.makeTupletCommand(3);
		} else if (this.buttonData.id === 'QuintupletButton') {
			this.editor.makeTupletCommand(5);
		} else if (this.buttonData.id === 'SeptupletButton') {
			this.editor.makeTupletCommand(7);
		} else if (this.buttonData.id === 'NoTupletButton') {
			this.editor.unmakeTuplet();
		}
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setDuration();
		});
	}
}

class VoiceButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
        this.tracker = parameters.tracker
	}
    _depopulateVoice() {
        var selections = SmoSelection.getMeasureList(this.tracker.selections);
        selections.forEach((selection) => {
            SmoUndoable.depopulateVoice([selection],selection.measure.getActiveVoice(),
               this.editor.undoBuffer);
            selection.measure.setChanged();
        });
        this.tracker.layout.setDirty();
    }
	setPitch() {
        var voiceIx = 0;
		if (this.buttonData.id === 'V1Button') {
            SmoOperation.setActiveVoice(this.tracker.layout.score,voiceIx);
            var ml = SmoSelection.getMeasureList(this.tracker.selections);
            ml.forEach((sel) => {
                sel.measure.setChanged();
            });
            this.tracker.layout.setDirty();
            return;
		} else if (this.buttonData.id === 'V2Button') {
			voiceIx = 1;
		} else if (this.buttonData.id === 'V3Button') {
			this.editor.upOctave();
            voiceIx = 2;
		} else if (this.buttonData.id === 'V4Button') {
			this.editor.downOctave();
            voiceIx = 3;
		} else if (this.buttonData.id === 'VXButton') {
        	return this._depopulateVoice();
        }
        SmoUndoable.populateVoice(this.tracker.selections,voiceIx,this.editor.undoBuffer);
        SmoOperation.setActiveVoice(this.tracker.layout.score,voiceIx);
        this.tracker.layout.setDirty();
    }
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setPitch();
		});
	}
}
class NoteButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
	}
	setPitch() {
		if (this.buttonData.id === 'UpNoteButton') {
			this.editor.transposeUp();
		} else if (this.buttonData.id === 'DownNoteButton') {
			this.editor.transposeDown();
		} else if (this.buttonData.id === 'UpOctaveButton') {
			this.editor.upOctave();
		} else if (this.buttonData.id === 'DownOctaveButton') {
			this.editor.downOctave();
		} else if (this.buttonData.id === 'ToggleAccidental') {
			this.editor.toggleEnharmonic();
		} else if (this.buttonData.id === 'ToggleCourtesy') {
			this.editor.toggleCourtesyAccidental();
		} else if (this.buttonData.id === 'ToggleRestButton') {
			this.editor.makeRest();
		} else if (this.buttonData.id === 'AddGraceNote') {
			this.editor.addGraceNote();
		} else if (this.buttonData.id === 'RemoveGraceNote') {
			this.editor.removeGraceNote();
		} else {
			this.editor.setPitchCommand(this.buttonData.rightText);
		}
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self.setPitch();
		});
	}
}

class ChordButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.tracker = parameters.tracker;
		this.score = parameters.score;
		this.interval = parseInt($(this.buttonElement).attr('data-interval'));
		this.direction = parseInt($(this.buttonElement).attr('data-direction'));
	}
	static get direction() {
		return {
			up: 1,
			down: -1
		}
	}
	static get intervalButtonMap() {}
	collapseChord() {
		this.editor.collapseChord();
	}
	setInterval() {
		this.editor.intervalAdd(this.interval, this.direction);
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			if ($(self.buttonElement).attr('id') === 'CollapseChordButton') {
				self.collapseChord();
				return;
			}
			self.setInterval();
		});
	}
}

class StaveButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
		this.editor = parameters.editor;
		this.score = this.editor.score;
	}
	addClef(clef,clefName) {
		var instrument = {
			instrumentName:clefName,
			keyOffset:0,
			clef:clef
		}
		var staff = this.tracker.selections[0].selector.staff;
		var measures = SmoSelection.getMeasureList(this.tracker.selections)
            .map((sel) => sel.measure);
		var selections=[];
		measures.forEach((measure) => {
			selections.push(SmoSelection.measureSelection(this.tracker.layout.score,staff,measure.measureNumber.measureNumber));
		});
		SmoUndoable.changeInstrument(this.tracker.layout.score,instrument,selections,this.editor.undoBuffer);
		this.tracker.layout.setDirty();
	}
	clefTreble() {
		this.addClef('treble','Treble Instrument');
	}
	clefBass() {
		this.addClef('bass','Bass Instrument');
	}
	clefAlto() {
		this.addClef('alto','Alto Instrument');
	}
	clefTenor() {
		this.addClef('tenor','Tenor Instrument');
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function (ev) {
			 console.log('couch');
			 var id = self.buttonData.id;
			if (typeof(self[id]) === 'function') {
				self[id]();
			}
		});
	}
}
class MeasureButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
		this.editor = parameters.editor;
		this.score = this.editor.score;
	}
	/*
	 static get barlines() {
        return {
            singleBar: 0,
            doubleBar: 1,
            endBar: 2,
            startRepeat: 3,
            endRepeat: 4,
            none: 5
        }
    }*/
	setEnding(startBar,endBar,number) {
		this.editor.scoreOperation('addEnding',new SmoVolta({startBar:startBar,endBar:endBar,number:number}));

	}
	setBarline(selection,position,barline,description) {
		this.editor.scoreSelectionOperation(selection, 'setMeasureBarline', new SmoBarline({position:position,barline:barline})
		    ,description);
	}
	setSymbol(selection,position,symbol,description) {
		this.editor.scoreSelectionOperation(selection, 'setRepeatSymbol', new SmoRepeatSymbol({position:position,symbol:symbol})
		    ,description);
	}
	endRepeat() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.endRepeat,'add repeat');
	}
	startRepeat() {
		var selection = this.tracker.getExtremeSelection(-1);
		this.setBarline(selection,SmoBarline.positions.start,SmoBarline.barlines.startRepeat,'add start repeat');
	}
	singleBarStart() {
		var selection = this.tracker.getExtremeSelection(-1);
		this.setBarline(selection,SmoBarline.positions.start,SmoBarline.barlines.singleBar,'single start bar');
	}
    singleBarEnd() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.singleBar,'single  bar');
	}

	doubleBar() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.doubleBar,'double  bar');
	}
	endBar() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setBarline(selection,SmoBarline.positions.end,SmoBarline.barlines.endBar,'final  bar');
	}
	coda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Coda);
	}
	toCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.ToCoda);
	}
	segno() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Segno);
	}
	dsAlCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DsAlCoda);
	}
	dcAlCoda() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DcAlCoda);
	}
	dsAlFine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DsAlFine);
	}
	dcAlFine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.DcAlFine);
	}
	fine() {
		var selection = this.tracker.getExtremeSelection(1);
		this.setSymbol(selection,SmoRepeatSymbol.positions.end,SmoRepeatSymbol.symbols.Fine);
	}
	nthEnding() {
		var startSel = this.tracker.getExtremeSelection(-1);
		var endSel = this.tracker.getExtremeSelection(1);
		this.setEnding(startSel.selector.measure,endSel.selector.measure,1);
	}

	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function (ev) {
			var id = self.buttonData.id;
			if (typeof(self[id]) === 'function') {
				self[id]();
                self.tracker.layout.setDirty();
			}
		});
	}
}

class PlayerButtons {
    	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
        this.editor = parameters.editor;
		this.controller = parameters.controller;
        this.menus=parameters.controller.menus;
	}

    playButton() {
        this.editor.playScore();
    }
    stopButton() {
        this.editor.stopPlayer();
    }
    pauseButton() {
        this.editor.pausePlayer();
    }

    bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self[self.buttonData.id]();
		});
    }
}

class TextButtons {
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
        this.editor = parameters.editor;
		this.controller = parameters.controller;
        this.menus=parameters.controller.menus;
	}
    lyrics() {
		SuiLyricDialog.createAndDisplay(
            {buttonElement:this.buttonElement, buttonData:this.buttonData,controller:this.controller});
		// tracker, selection, controller
    }
    rehearsalMark() {
        var selection = this.tracker.getExtremeSelection(-1);
        var cmd = selection.measure.getRehearsalMark() ? 'removeRehearsalMark' : 'addRehearsalMark';
        this.editor.scoreSelectionOperation(selection, cmd, new SmoRehearsalMark());
    }
    _invokeMenu(cmd) {
      this.controller.unbindKeyboardForMenu(this.menus);
      this.menus.createMenu(cmd);
    }
    addTextMenu() {
        this._invokeMenu('SuiTextMenu');
    }
	addDynamicsMenu() {
        this._invokeMenu('SuiDynamicsMenu');
	}
    bind() {
        var self=this;
        $(this.buttonElement).off('click').on('click', function () {
            self[self.buttonData.id]();
        });

	}
}
class NavigationButtons {
	static get directionsTrackerMap() {
		return {
			navLeftButton: 'moveSelectionLeft',
			navRightButton: 'moveSelectionRight',
			navUpButton: 'moveSelectionUp',
			navDownButton: 'moveSelectionDown',
			navFastForward: 'moveSelectionRightMeasure',
			navRewind: 'moveSelectionLeftMeasure',
			navGrowLeft: 'growSelectionLeft',
			navGrowRight: 'growSelectionRight'
		};
	}
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.tracker = parameters.tracker;
	}

	_moveTracker() {
		this.tracker[NavigationButtons.directionsTrackerMap[this.buttonData.id]]();
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self._moveTracker();
		});
	}
}
class ArticulationButtons {
	static get articulationIdMap() {
		return {
			accentButton: SmoArticulation.articulations.accent,
			tenutoButton: SmoArticulation.articulations.tenuto,
			staccatoButton: SmoArticulation.articulations.staccato,
			marcatoButton: SmoArticulation.articulations.marcato,
			pizzicatoButton: SmoArticulation.articulations.pizzicato,
			fermataButton: SmoArticulation.articulations.fermata,
            mordentButton: SmoOrnament.ornaments.mordent,
            mordentInvertedButton:SmoOrnament.ornaments.mordentInverted,
            trillButton:SmoOrnament.ornaments.trill
		};
	}
    static get constructors() {
        return {
			accentButton: 'SmoArticulation',
			tenutoButton: 'SmoArticulation',
			staccatoButton: 'SmoArticulation',
			marcatoButton: 'SmoArticulation',
			pizzicatoButton: 'SmoArticulation',
			fermataButton: 'SmoArticulation',
            mordentButton: 'SmoOrnament',
            mordentInvertedButton:'SmoOrnament',
            trillButton:'SmoOrnament'
        }
    }
	constructor(parameters) {
		this.buttonElement = parameters.buttonElement;
		this.buttonData = parameters.buttonData;
		this.editor = parameters.editor;
		this.articulation = ArticulationButtons.articulationIdMap[this.buttonData.id];
        this.ctor = ArticulationButtons.constructors[this.buttonData.id];
	}
	_toggleArticulation() {
		this.showState = !this.showState;
		this.editor.toggleArticulationCommand(this.articulation, this.ctor);
	}
	bind() {
		var self = this;
		$(this.buttonElement).off('click').on('click', function () {
			self._toggleArticulation();
		});
	}
}


class CollapseRibbonControl {
	static get paramArray() {
		return ['ribbonButtons', 'editor', 'controller', 'tracker', 'menus', 'buttonData', 'buttonElement'];
	}
	constructor(parameters) {
		smoMusic.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
		this.childButtons = parameters.ribbonButtons.filter((cb) => {
				return cb.group === this.buttonData.group && cb.action === 'collapseChild';
			});
	}
	_toggleExpand() {
		this.childButtons.forEach((cb) => {

			var el = $('#' + cb.id);
			$(el).toggleClass('collapsed');
			$(el).toggleClass('expanded');
		});

		this.buttonElement.closest('div').toggleClass('expanded');
		this.buttonElement.toggleClass('expandedChildren');
		if (this.buttonElement.hasClass('expandedChildren')) {
			var leftSpan = $(this.buttonElement).find('.ribbon-button-text');
			$(leftSpan).text('');
			$(leftSpan).removeClass(this.buttonData.icon);
			$(this.buttonElement).addClass('icon icon-circle-left');
		} else {
			$(this.buttonElement).removeClass('icon-circle-left');
			var leftSpan = $(this.buttonElement).find('.ribbon-button-text');
			$(leftSpan).addClass(this.buttonData.icon);
			$(leftSpan).text(this.buttonData.leftText);
		}

		// Expand may change music dom, redraw
		$('body').trigger('forceScrollEvent');
	}
	bind() {
		var self = this;
		$(this.buttonElement).closest('div').addClass('collapseContainer');
		$('#' + this.buttonData.id).off('click').on('click', function () {
			self._toggleExpand();
		});
		this.childButtons.forEach((cb) => {
			var ctor = eval(cb.ctor);
			var el = $('#' + cb.id);
			var btn = new ctor({
					buttonData: cb,
					buttonElement: el,
					editor: this.editor,
					tracker: this.tracker,
					controller: this.controller
				});
			btn.bind();
		});
	}
}
