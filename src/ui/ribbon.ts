// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';
import { SmoBarline, SmoRepeatSymbol } from '../smo/data/measureModifiers';
import { smoSerialize } from '../common/serializationHelpers';
import { SuiOscillator } from '../render/audio/oscillator';
import { SmoMicrotone, SmoLyric, SmoArticulation, SmoOrnament } from '../smo/data/noteModifiers';
import { SuiChordChangeDialog, SuiTextTransformDialog, SuiLyricDialog } from './dialogs/textDialogs';
import { ButtonDefinition } from './ribbonLayout/default/defaultRibbon';
import { SuiKeyCommands } from '../application/keyCommands';
import { BrowserEventSource } from '../application/eventSource';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { CompleteNotifier } from '../application/common';
import { SuiTracker } from '../render/sui/tracker';
import { SmoInstrument } from '../smo/data/staffModifiers';
import { suiMenuManager } from './menus';
import { Clef, IsPitchLetter } from '../smo/data/common';

declare var $: any;

export interface ButtonLabel {
  buttonId: string,
  buttonText: string
}
export interface SuiCollapsableButtonParams {
  buttonId: string,
  buttonElement: string,
  buttonData: ButtonDefinition,
  keyCommands: SuiKeyCommands,
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  menus: suiMenuManager,
  completeNotifier: CompleteNotifier,
  buttons: ButtonDefinition[]
}
export interface SuiButtonParams {
  buttonId: string,
  buttonElement: string,
  buttonData: ButtonDefinition,
  keyCommands: SuiKeyCommands,
  view: SuiScoreViewOperations,
  eventSource: BrowserEventSource,
  menus: suiMenuManager,
  completeNotifier: CompleteNotifier
}
export abstract class SuiButton {
  buttonId: string;
  buttonElement: string;
  keyCommands: SuiKeyCommands;
  view: SuiScoreViewOperations;
  buttonData: ButtonDefinition;
  eventSource: BrowserEventSource;
  menus: suiMenuManager;
  completeNotifier: CompleteNotifier | null;
  constructor(params: SuiButtonParams) {
    this.buttonId = params.buttonId;
    this.buttonElement = params.buttonElement;
    this.keyCommands = params.keyCommands;
    this.view = params.view;
    this.buttonData = params.buttonData;
    this.eventSource = params.eventSource;
    this.menus = params.menus;
    this.completeNotifier = params.completeNotifier;
  }
}
export interface RibbonLayout {
  left: string[],
  top: string[]
}
export interface SuiRibbonParams {
  eventSource: BrowserEventSource,
  view: SuiScoreViewOperations,
  completeNotifier: CompleteNotifier,
  tracker: SuiTracker,
  keyCommands: SuiKeyCommands,
  menus: suiMenuManager,
  ribbonButtons: ButtonDefinition[],
  ribbons: RibbonLayout
}
// ## RibbonButtons
// Render the ribbon buttons based on group, function, and underlying UI handler.
// Also handles UI events.
// ### RibbonButton methods
// ---
export class RibbonButtons {
  static get paramArray() {
    return ['ribbonButtons', 'ribbons', 'keyCommands', 'controller', 'menus', 'eventSource', 'view'];
  }
  static _buttonHtml(containerClass: string, buttonId: string, buttonClass: string, buttonText: string, buttonIcon: string, buttonKey: string) {
    const b = htmlHelpers.buildDom;
    const r = b('div').classes(containerClass).append(b('button').attr('id', buttonId).classes(buttonClass).append(
      b('span').classes('left-text').append(
        b('span').classes('text-span').text(buttonText)).append(
          b('span').classes('ribbon-button-text icon ' + buttonIcon))).append(
            b('span').classes('ribbon-button-hotkey').text(buttonKey)));
    return r.dom();
  }

  static translateButtons: ButtonLabel[] = [];
  keyCommands: SuiKeyCommands;
  controller: CompleteNotifier;
  eventSource: BrowserEventSource;
  view: SuiScoreViewOperations;
  menus: suiMenuManager;
  ribbons: RibbonLayout;
  ribbonButtons: ButtonDefinition[];
  collapsables: CollapseRibbonControl[] = [];
  collapseChildren: any[] = [];

  constructor(params: SuiRibbonParams) {
    this.keyCommands = params.keyCommands;
    this.controller = params.completeNotifier;
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.menus = params.menus;
    this.ribbonButtons = params.ribbonButtons;
    this.ribbons = params.ribbons;
    this.collapsables = [];
    this.collapseChildren = [];
  }
  _executeButtonModal(buttonElement: string, buttonData: ButtonDefinition) {
    const ctor = eval('globalThis.Smo.' + buttonData.ctor);
    ctor.createAndDisplay(
      {
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.controller,
        view: this.view
      }
    );
  }
  _executeButtonMenu(buttonElement: string, buttonData: ButtonDefinition) {
    this.menus.slashMenuMode(this.controller);
    this.menus.createMenu(buttonData.ctor);
  }

  _executeButton(buttonElement: string, buttonData: ButtonDefinition) {
    if (buttonData.action === 'modal') {
      this._executeButtonModal(buttonElement, buttonData);
      return;
    }
    if (buttonData.action === 'menu' || buttonData.action === 'collapseChildMenu') {
      this._executeButtonMenu(buttonElement, buttonData);
    }
  }

  _bindButton(buttonElement: string, buttonData: ButtonDefinition) {
    this.eventSource.domClick(buttonElement, this, '_executeButton', buttonData);
  }
  _createCollapsibleButtonGroups(selector: string) {
    let containerClass: string = '';
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

  static isCollapsible(action: string) {
    return ['collapseChild', 'collapseChildMenu', 'collapseGrandchild', 'collapseMore'].indexOf(action) >= 0;
  }

  static isBindable(action: string) {
    return ['collapseChildMenu', 'menu', 'modal'].indexOf(action) >= 0;
  }

  // ### _createButtonHtml
  // For each button, create the html and bind the events based on
  // the button's configured action.
  _createRibbonHtml(buttonAr: string[], selector: string) {
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
              buttons: this.ribbonButtons,
              view: this.view,
              menus: this.menus,
              eventSource: this.eventSource,
              completeNotifier: this.controller,
              keyCommands: this.keyCommands,
              buttonId: buttonData.id,
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

  createRibbon(buttonDataArray: string[], parentElement: string) {
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

// ## ExtendedCollapseParent
// Muse-style '...' buttons for less-common operations
export class ExtendedCollapseParent extends SuiButton {
  buttonData: ButtonDefinition;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
export class BeamButtons extends SuiButton {
  buttonData: ButtonDefinition;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.buttonData = parameters.buttonData;
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
export class MicrotoneButtons extends SuiButton {
  buttonData: ButtonDefinition;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
    this.view = parameters.view;
  }
  applyButton(el: ButtonDefinition) {
    const defs = SmoMicrotone.defaults;
    defs.tone = el.id;
    const tn = new SmoMicrotone(defs);
    this.view.addRemoveMicrotone(tn);
    SuiOscillator.playSelectionNow(this.view.tracker.selections[0], 1);
  }
  bind() {
    var self = this;
    $(this.buttonElement).off('click').on('click', () => {
      self.applyButton(self.buttonData);
    });
  }
}

export class DurationButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.buttonData = parameters.buttonData;
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

export class VoiceButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
export class NoteButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
    this.buttonElement = parameters.buttonElement;
    this.buttonData = parameters.buttonData;
    this.keyCommands = parameters.keyCommands;
    this.view = parameters.view;
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
    } else if (this.buttonData.id === 'ToggleSlashButton') {
      this.view.toggleSlash();
    } else if (this.buttonData.id === 'AddGraceNote') {
      this.keyCommands.addGraceNote();
    } else if (this.buttonData.id === 'SlashGraceNote') {
      this.keyCommands.slashGraceNotes();
    } else if (this.buttonData.id === 'RemoveGraceNote') {
      this.keyCommands.removeGraceNote();
    } else if (this.buttonData.id === 'XNoteHead') {
      this.keyCommands.setNoteHead();
    } else if (this.buttonData.id === 'TriUpNoteHead') {
      this.view.setNoteHead('T2');
    } else if (this.buttonData.id === 'CircleXNoteHead') {
      this.view.setNoteHead('X3');
    } else if (this.buttonData.id === 'DiamondNoteHead') {
      this.view.setNoteHead('D2');
    } else {
      if (IsPitchLetter(this.buttonData.rightText)) {
        this.keyCommands.setPitchCommand(this.buttonData.rightText);
      }
    }
  }
  bind() {
    var self = this;
    $(this.buttonElement).off('click').on('click', () => {
      self.setPitch();
    });
  }
}

export class ChordButtons extends SuiButton {
  interval: number;
  direction: number;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
      this.setInterval();
    });
  }
}

export class StaveButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  addClef(clef: Clef, clefName: string) {
    var instrument: SmoInstrument = new SmoInstrument();
    instrument.instrument = clefName;
    instrument.keyOffset = 0;
    instrument.clef = clef;
    this.view.changeInstrument(instrument, this.view.tracker.selections);
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
  clefPercussion() {
    this.addClef('percussion', 'Tenor Instrument');
  }
  _clefMove(index: number) {
    this.view.moveStaffUpDown(index);
  }
  clefMoveUp() {
    this._clefMove(-1);
  }
  clefMoveDown() {
    this._clefMove(1);
  }
  _addStaffGroup(type: number) {
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
      if (typeof ((this as any)[id]) === 'function') {
        (this as any)[id]();
      }
    });
  }
}

export class MeasureButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
  handleEvent(event: any, method: string) {
    (this as any)[method]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, 'handleEvent', this.buttonData.id);
  }
}

export class PlayerButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}

export class DisplaySettings extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }

  refresh() {
    this.view.refreshViewport();
  }
  zoomout() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale *= 1.1;
    this.view.setGlobalLayout(globalLayout);
  }
  zoomin() {
    const globalLayout = this.view.score.layoutManager!.getGlobalLayout();
    globalLayout.zoomScale = globalLayout.zoomScale / 1.1;
    this.view.setGlobalLayout(globalLayout);
  }
  playButton2() {
    this.keyCommands.playScore();
  }
  stopButton2() {
    this.keyCommands.stopPlayer();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}

export class TextButtons extends SuiButton {
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }
  lyrics() {
    SuiLyricDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.completeNotifier,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
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
        completeNotifier: this.completeNotifier,
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
  _invokeMenu(cmd: string) {
    this.menus.slashMenuMode(this.completeNotifier);
    this.menus.createMenu(cmd);
  }

  addTextMenu() {
    SuiTextTransformDialog.createAndDisplay(
      {
        buttonElement: this.buttonElement,
        buttonData: this.buttonData,
        completeNotifier: this.completeNotifier,
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
    this.eventSource.domClick(this.buttonElement, this, this.buttonData.id, null);
  }
}

export class NavigationButtons extends SuiButton {
  static get directionsTrackerMap(): Record<string, string> {
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
  constructor(parameters: SuiButtonParams) {
    super(parameters);
  }

  _moveTracker() {
    (this.view.tracker as any)[NavigationButtons.directionsTrackerMap[this.buttonData.id]]();
  }
  bind() {
    this.eventSource.domClick(this.buttonElement, this, '_moveTracker', null);
  }
}
export class ArticulationButtons extends SuiButton {
  static get articulationIdMap(): Record<string, string> {
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
  static get constructors(): Record<string, string> {
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
  articulation: string;
  ctor: string;
  showState: boolean = false;
  constructor(parameters: SuiButtonParams) {
    super(parameters);
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
    this.eventSource.domClick(this.buttonElement, this, '_toggleArticulation', null);
  }
}

export class CollapseRibbonControl extends SuiButton {
  static get paramArray() {
    return ['ribbonButtons', 'keyCommands', 'controller', 'view', 'menus', 'buttonData', 'buttonElement',
      'eventSource'];
  }
  childButtons: ButtonDefinition[];
  constructor(parameters: SuiCollapsableButtonParams) {
    super(parameters);
    smoSerialize.filteredMerge(CollapseRibbonControl.paramArray, parameters, this);
    this.childButtons = parameters.buttons.filter((cb) =>
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

    $(this.buttonElement).closest('div').toggleClass('expanded');
    $(this.buttonElement).toggleClass('expandedChildren');
    if ($(this.buttonElement).hasClass('expandedChildren')) {
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
    this.eventSource.domClick(this.buttonElement, this, '_toggleExpand', null);
    this.childButtons.forEach((cb) => {
      const ctor = eval('globalThis.Smo.' + cb.ctor);
      if ((typeof (ctor) === 'function')) {
        const el = $('#' + cb.id);
        const btn = new ctor({
          buttonData: cb,
          buttonElement: el,
          keyCommands: this.keyCommands,
          view: this.view,
          completeNotifier: this.completeNotifier,
          eventSource: this.eventSource
        });
        if (typeof (btn.bind) === 'function') {
          btn.bind();
        }
      }
    });
  }
}
