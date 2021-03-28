//# sourceMappingURL=../src/ui/ribbon.js

// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ### RibbonButton methods
// ---
class RibbonButtons {
  static get paramArray() {
    return ['ribbonButtons', 'ribbons', 'keyCommands', 'controller', 'menus', 'eventSource', 'view'];
  }
  static _buttonHtml(containerClass, buttonId, buttonClass, buttonText, buttonIcon, buttonKey) {
    const b = htmlHelpers.buildDom;
    const r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText)).append(
        b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
      b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }
  static get translateButtons() {
    if (!RibbonButtons._translateButtons) {
      RibbonButtons._translateButtons = [];
    }
    return RibbonButtons._translateButtons;
  }
  constructor(parameters) {
    smoSerialize.filteredMerge(RibbonButtons.paramArray, parameters, this);
    this.ribbonButtons = parameters.ribbonButtons;
    this.ribbons = parameters.ribbons;
    this.collapsables = [];
    this.collapseChildren = [];
  }
  _executeButtonModal(buttonElement, buttonData) {
    const ctor = eval(buttonData.ctor);
    ctor.createAndDisplay(
      {
        undoBuffer: this.keyCommands.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.controller,
        view: this.view
      }
    );
  }
  _executeButtonMenu(buttonElement, buttonData) {
    this.menus.slashMenuMode(this.controller);
    this.menus.createMenu(buttonData.ctor);
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
    if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
      this._executeButtonMenu(buttonElement, buttonData);
    }
  }

  _bindButton(buttonElement, buttonData) {
    this.eventSource.domClick(buttonElement, this, '_executeButton', buttonData);
  }
  _createCollapsibleButtonGroups(selector) {
    let containerClass = {};
    // Now all the button elements have been bound.  Join child and parent buttons
    // For all the children of a button group, add it to the parent group
    this.collapseChildren.forEach((b) => {
      containerClass = 'ribbonButtonContainer';
      if (b.action === 'collapseGrandchild') {
        containerClass = 'ribbonButtonContainerMore';
      }
      const buttonHtml = RibbonButtons._buttonHtml(
        containerClass, b.id, b.classes, b.leftText, b.icon, b.rightText);
      if (b.dataElements) {
        const bkeys = Object.keys(b.dataElements);
        bkeys.forEach((bkey) => {
          var de = b.dataElements[bkey];
          $(buttonHtml).find('button').attr('data-' + bkey, de);
        });
      }
      // Bind the child button actions
      const parent = $(selector).find('.collapseContainer[data-group="' + b.group + '"]');
      $(parent).append(buttonHtml);
      const el = $(selector).find('#' + b.id);
      this._bindButton(el, b);
    });

    this.collapsables.forEach((cb) => {
      // Bind the events of the parent button
      cb.bind();
    });
  }

  static isCollapsible(action) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  static isBindable(action) {
    return ['collapseChildMenu', 'menu', 'modal'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  _createRibbonHtml(buttonAr, selector) {
    let buttonClass = '';
    buttonAr.forEach((buttonId) => {
      const buttonData = this.ribbonButtons.find((e) =>
        e.id === buttonId
      );
      if (buttonData) {
        if (buttonData.leftText) {
          RibbonButtons.translateButtons.push({ buttonId: buttonData.id, buttonText: buttonData.leftText });
        }
        // collapse child is hidden until the parent button is selected, exposing the button group
        if (RibbonButtons.isCollapsible(buttonData.action)) {
          this.collapseChildren.push(buttonData);
        }
        if (buttonData.action !== 'collapseChild') {
          // else the button has a specific action, such as a menu or dialog, or a parent button
          // for translation, add the menu name to the button class
          buttonClass = buttonData.classes;
          if (buttonData.action === 'menu' || buttonData.action === 'modal') {
            buttonClass += ' ' + buttonData.ctor;
          }
          const buttonHtml = RibbonButtons._buttonHtml('ribbonButtonContainer',
            buttonData.id, buttonClass, buttonData.leftText, buttonData.icon, buttonData.rightText);
          $(buttonHtml).attr('data-group', buttonData.group);
          $(selector).append(buttonHtml);
          const buttonElement = $('#' + buttonData.id);
          // If this is a collabsable button, create it, otherwise bind its execute function.
          if (buttonData.action === 'collapseParent') {
            $(buttonHtml).addClass('collapseContainer');
            // collapseParent
            this.collapsables.push(new CollapseRibbonControl({
              ribbonButtons: this.ribbonButtons,
              view: this.view,
              menus: this.menus,
              eventSource: this.eventSource,
              controller: this.controller,
              keyCommands: this.keyCommands,
              buttonElement,
              buttonData
            }));
          } else {
            this.eventSource.domClick(buttonElement, this, '_executeButton', buttonData);
          }
        }
      }
    });
  }

  createRibbon(buttonDataArray, parentElement) {
    this._createRibbonHtml(buttonDataArray, parentElement);
    this._createCollapsibleButtonGroups(parentElement);
  }

  display() {
    $('body .controls-left').html('');
    $('body .controls-top').html('');

    const lbuttons = this.ribbons.left;
    this.createRibbon(lbuttons, 'body .controls-left');

    const tbuttons = this.ribbons.top;
    this.createRibbon(tbuttons, 'body .controls-top');
  }
}

// eslint-disable-next-line no-unused-vars
class DebugButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      $('body').trigger('redrawScore');
    });
  }
}

// ## ExtendedCollapseParent
// Muse-style '...' buttons for less-common operations
// eslint-disable-next-line no-unused-vars
class ExtendedCollapseParent {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      $(this.buttonElement).closest('.collapseContainer').toggleClass('expanded-more');
    });
  }
}
// eslint-disable-next-line no-unused-vars
class BeamButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
  }
  operation() {
    if (this.buttonData.id === 'breakBeam') {
      this.keyCommands.toggleBeamGroup();
    } else if (this.buttonData.id === 'beamSelections') {
      this.keyCommands.beamSelections();
    } else if (this.buttonData.id === 'toggleBeamDirection') {
      this.keyCommands.toggleBeamDirection();
    }
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.operation();
    });
  }
}
// eslint-disable-next-line no-unused-vars
class MicrotoneButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
    this.view = parameters.view;
  }
  applyButton(el) {
    let pitch = 0;
    if (this.view.tracker.selections.length === 1 &&
      this.view.tracker.selections[0].selector.pitches &&
      this.view.tracker.selections[0].selector.pitches.length
    ) {
      pitch = this.view.tracker.selections[0].selector.pitches[0];
    }
    const tn = new SmoMicrotone({ tone: el.id, pitch });
    this.view.addRemoveMicrotone(tn);
    suiOscillator.playSelectionNow(this.view.tracker.selections[0]);
  }
  bind() {
    var self = this;
    $(this.buttonElement).off('click').on('click', () => {
      self.applyButton(self.buttonData);
    });
  }
}

// eslint-disable-next-line no-unused-vars
class DurationButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
  }
  setDuration() {
    if (this.buttonData.id === 'GrowDuration') {
      this.keyCommands.doubleDuration();
    } else if (this.buttonData.id === 'LessDuration') {
      this.keyCommands.halveDuration();
    } else if (this.buttonData.id === 'GrowDurationDot') {
      this.keyCommands.dotDuration();
    } else if (this.buttonData.id === 'LessDurationDot') {
      this.keyCommands.undotDuration();
    } else if (this.buttonData.id === 'TripletButton') {
      this.keyCommands.makeTupletCommand(3);
    } else if (this.buttonData.id === 'QuintupletButton') {
      this.keyCommands.makeTupletCommand(5);
    } else if (this.buttonData.id === 'SeptupletButton') {
      this.keyCommands.makeTupletCommand(7);
    } else if (this.buttonData.id === 'NoTupletButton') {
      this.keyCommands.unmakeTuplet();
    }
  }
  bind() {
    var self = this;
    $(this.buttonElement).off('click').on('click', () => {
      self.setDuration();
    });
  }
}

// eslint-disable-next-line no-unused-vars
class VoiceButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.view = parameters.view;
  }
  doAction() {
    let voiceIx = 0;
    if (this.buttonData.id === 'V2Button') {
      voiceIx = 1;
    } else if (this.buttonData.id === 'V3Button') {
      voiceIx = 2;
    } else if (this.buttonData.id === 'V4Button') {
      voiceIx = 3;
    } else if (this.buttonData.id === 'VXButton') {
      this.view.depopulateVoice();
      return;
    }
    this.view.populateVoice(voiceIx);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      this.doAction();
    });
  }
}
// eslint-disable-next-line no-unused-vars
class NoteButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
  }
  setPitch() {
    if (this.buttonData.id === 'UpNoteButton') {
      this.keyCommands.transposeUp();
    } else if (this.buttonData.id === 'DownNoteButton') {
      this.keyCommands.transposeDown();
    } else if (this.buttonData.id === 'UpOctaveButton') {
      this.keyCommands.upOctave();
    } else if (this.buttonData.id === 'DownOctaveButton') {
      this.keyCommands.downOctave();
    } else if (this.buttonData.id === 'ToggleAccidental') {
      this.keyCommands.toggleEnharmonic();
    } else if (this.buttonData.id === 'ToggleCourtesy') {
      this.keyCommands.toggleCourtesyAccidental();
    } else if (this.buttonData.id === 'ToggleRestButton') {
      this.keyCommands.makeRest();
    } else if (this.buttonData.id === 'AddGraceNote') {
      this.keyCommands.addGraceNote();
    } else if (this.buttonData.id === 'SlashGraceNote') {
      this.keyCommands.slashGraceNotes();
    } else if (this.buttonData.id === 'RemoveGraceNote') {
      this.keyCommands.removeGraceNote();
    } else if (this.buttonData.id === 'XNoteHead') {
      this.keyCommands.setNoteHead();
    } else {
      this.keyCommands.setPitchCommand(this.buttonData.rightText);
    }
  }
  bind() {
    var self = this;
    $(this.buttonElement).off('click').on('click', () => {
      self.setPitch();
    });
  }
}

// eslint-disable-next-line no-unused-vars
class ChordButtons {
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
    this.view = parameters.view;
    this.interval = parseInt($(this.buttonElement).attr('data-interval'), 10);
    this.direction = parseInt($(this.buttonElement).attr('data-direction'), 10);
  }
  collapseChord() {
    this.keyCommands.collapseChord();
  }
  setInterval() {
    this.keyCommands.intervalAdd(this.interval, this.direction);
  }
  bind() {
    $(this.buttonElement).off('click').on('click', () => {
      if ($(this.buttonElement).attr('id') === 'CollapseChordButton') {
        this.collapseChord();
        return;
      }
      self.setInterval();
    });
  }
}

// eslint-disable-next-line no-unused-vars
class StaveButtons {
  constructor(parameters) {
    Vex.Merge(this, parameters);
  }
  addClef(clef, clefName) {
    var instrument = {
      instrumentName: clefName,
      keyOffset: 0,
      clef
    };
    this.view.changeInstrument(instrument);
  }
  clefTreble() {
    this.addClef('treble', 'Treble Instrument');
  }
  clefBass() {
    this.addClef('bass', 'Bass Instrument');
  }
  clefAlto() {
    this.addClef('alto', 'Alto Instrument');
  }
  clefTenor() {
    this.addClef('tenor', 'Tenor Instrument');
  }
  _clefMove(index) {
    this.view.moveStaffUpDown(index);
  }
  clefMoveUp() {
    this._clefMove(-1, 'up');
  }
  clefMoveDown() {
    this._clefMove(1, 'down');
  }
  _addStaffGroup(type) {
    this.view.addStaffGroupDown(type);
  }
  staffBraceLower() {
    this._addStaffGroup(SmoSystemGroup.connectorTypes.brace);
  }
  staffBracketLower() {
    this._addStaffGroup(SmoSystemGroup.connectorTypes.bracket);
  }
  bind() {
    const self = this;
    $(this.buttonElement).off('click').on('click', () => {
      const id = self.buttonData.id;
      if (typeof(self[id]) === 'function') {
        self[id]();
      }
    });
  }
}

// eslint-disable-next-line no-unused-vars
class MeasureButtons {
  constructor(parameters) {
    Vex.Merge(this, parameters);
  }
  endRepeat() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endRepeat);
  }
  startRepeat() {
    this.view.setBarline(SmoBarline.positions.start, SmoBarline.barlines.startRepeat);
  }
  singleBarStart() {
    this.view.setBarline(SmoBarline.positions.start, SmoBarline.barlines.singleBar);
  }
  singleBarEnd() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.singleBar);
  }
  doubleBar() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.doubleBar);
  }
  endBar() {
    this.view.setBarline(SmoBarline.positions.end, SmoBarline.barlines.endBar);
  }
  coda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Coda);
  }
  toCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.ToCoda);
  }
  segno() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Segno);
  }
  dsAlCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlCoda);
  }
  dcAlCoda() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlCoda);
  }
  dsAlFine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DsAlFine);
  }
  dcAlFine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.DcAlFine);
  }
  fine() {
    this.view.setRepeatSymbol(SmoRepeatSymbol.positions.end, SmoRepeatSymbol.symbols.Fine);
  }
  nthEnding() {
    this.view.addEnding();
  }
  handleEvent(event, method) {
    this[method]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, 'handleEvent', this.buttonData.id);
  }
}

// eslint-disable-next-line no-unused-vars
class PlayerButtons {
  constructor(parameters) {
    Vex.Merge(this, parameters);
  }
  playButton() {
    this.keyCommands.playScore();
  }
  stopButton() {
    this.keyCommands.stopPlayer();
  }
  pauseButton() {
    this.keyCommands.pausePlayer();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id);
  }
}

// eslint-disable-next-line no-unused-vars
class DisplaySettings {
  constructor(parameters) {
    Vex.Merge(this, parameters);
  }

  refresh() {
    this.view.refreshViewport();
  }
  zoomout() {
    this.view.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
    this.view.score.layout.zoomScale = this.view.score.layout.zoomScale * 1.1;
    this.view.renderer.setViewport();
    this.view.renderer.setRefresh();
  }
  zoomin() {
    this.view.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
    this.view.score.layout.zoomScale = this.view.score.layout.zoomScale / 1.1;
    this.view.renderer.setViewport();
    this.view.renderer.setRefresh();
  }
  playButton2() {
    this.keyCommands.playScore();
  }
  stopButton2() {
    this.keyCommands.stopPlayer();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id);
  }
}
// eslint-disable-next-line no-unused-vars
class TextButtons {
  constructor(parameters) {
    Vex.Merge(this, parameters);
    this.menus = this.controller.menus;
  }
  lyrics() {
    SuiLyricDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.controller,
        view: this.view,
        undoBuffer: this.keyCommands.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        parser: SmoLyric.parsers.lyric
      }
    );
    // tracker, selection, controller
  }
  chordChanges() {
    SuiChordChangeDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.controller,
        view: this.view,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        parser: SmoLyric.parsers.chord
      }
    );
  }
  rehearsalMark() {
    this.view.toggleRehearsalMark();
  }
  _invokeMenu(cmd) {
    this.menus.slashMenuMode(this.controller);
    this.menus.createMenu(cmd);
  }

  addTextMenu() {
    SuiTextTransformDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.controller,
        tracker: this.view.tracker,
        view: this.view,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands
      });
  }
  addDynamicsMenu() {
    this._invokeMenu('SuiDynamicsMenu');
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id);
  }
}

// eslint-disable-next-line no-unused-vars
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
    Vex.Merge(this, parameters);
  }

  _moveTracker() {
    this.view.tracker[NavigationButtons.directionsTrackerMap[this.buttonData.id]]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, '_moveTracker');
  }
}
// eslint-disable-next-line no-unused-vars
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
      mordentInvertedButton: SmoOrnament.ornaments.mordentInverted,
      trillButton: SmoOrnament.ornaments.trill,
      scoopButton: SmoOrnament.ornaments.scoop,
      dropButton: SmoOrnament.ornaments.fall_short,
      dropLongButton: SmoOrnament.ornaments.dropLong,
      doitButton: SmoOrnament.ornaments.doit,
      doitLongButton: SmoOrnament.ornaments.doitLong,
      flipButton: SmoOrnament.ornaments.flip,
      smearButton: SmoOrnament.ornaments.smear
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
      mordentInvertedButton: 'SmoOrnament',
      trillButton: 'SmoOrnament',
      scoopButton: 'SmoOrnament',
      dropButton: 'SmoOrnament',
      dropLongButton: 'SmoOrnament',
      doitButton: 'SmoOrnament',
      doitLongButton: 'SmoOrnament',
      flipButton: 'SmoOrnament',
      smearButton: 'SmoOrnament'
    };
  }
  constructor(parameters) {
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
    this.articulation = ArticulationButtons.articulationIdMap[this.buttonData.id];
    this.eventSource = parameters.eventSource;
    this.ctor = ArticulationButtons.constructors[this.buttonData.id];
  }
  _toggleArticulation() {
    this.showState = !this.showState;
    this.keyCommands.toggleArticulationCommand(this.articulation, this.ctor);
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, '_toggleArticulation');
  }
}

// eslint-disable-next-line no-unused-vars
class CollapseRibbonControl {
  static get paramArray() {
    return ['ribbonButtons', 'keyCommands', 'controller', 'view', 'menus', 'buttonData', 'buttonElement',
      'eventSource'];
  }
  constructor(parameters) {
    smoSerialize.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
    this.childButtons = parameters.ribbonButtons.filter((cb) =>
      cb.group === this.buttonData.group &&
        RibbonButtons.isCollapsible(cb.action)
    );
  }
  _toggleExpand() {
    this.childButtons.forEach((cb) => {
      const el = $('#' + cb.id);
      $(el).toggleClass('collapsed');
      $(el).toggleClass('expanded');
    });

    this.buttonElement.closest('div').toggleClass('expanded');
    this.buttonElement.toggleClass('expandedChildren');
    if (this.buttonElement.hasClass('expandedChildren')) {
      const leftSpan = $(this.buttonElement).find('.ribbon-button-text');
      $(leftSpan).text('');
      $(leftSpan).removeClass(this.buttonData.icon);
      $(this.buttonElement).addClass('icon icon-circle-left');
    } else {
      $(this.buttonElement).removeClass('icon-circle-left');
      const leftSpan = $(this.buttonElement).find('.ribbon-button-text');
      $(leftSpan).addClass(this.buttonData.icon);
      $(leftSpan).text(this.buttonData.leftText);
    }
    // Expand may change music dom, redraw
    $('body').trigger('forceScrollEvent');
  }
  bind() {
    $(this.buttonElement).closest('div').addClass('collapseContainer');
    this.eventSource.domClick(this.buttonElement, this, '_toggleExpand');
    this.childButtons.forEach((cb) => {
      const ctor = eval(cb.ctor);
      const el = $('#' + cb.id);
      const btn = new ctor({
        buttonData: cb,
        buttonElement: el,
        keyCommands: this.keyCommands,
        view: this.view,
        controller: this.controller,
        eventSource: this.eventSource
      });
      if (typeof(btn.bind) === 'function') {
        btn.bind();
      }
    });
  }
}
