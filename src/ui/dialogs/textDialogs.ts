// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiLyricComponent, SuiChordComponent, SuiTextInPlace, SuiDragText } from './textComponents';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiToggleComponent } from './components/toggle';
import { SuiRockerComponent } from './components/rocker';
import { SuiHelp } from '../help';
import { SmoConfiguration, SvgBox } from '../../smo/data/common';
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreModifiers';
import { SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { layoutDebug } from '../../render/sui/layoutDebug';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiInlineText } from '../../render/sui/textRender';
import { ModifierTab, SmoSelection } from '../../smo/xform/selections';
import { SvgHelpers } from '../../render/sui/svgHelpers';
import { SuiFontComponent, SuiTextBlockComponent } from './fontComponent';
import { EventHandler } from '../../application/eventSource';
import { KeyEvent } from '../../application/common';
import { htmlHelpers } from '../../common/htmlHelpers';

declare var $: any;
declare var SmoConfig: SmoConfiguration;
export class SuiLyricDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLyricDialog';
  }
  static get idleLyricTime() {
    return 5000;
  }
  static dialogElements: DialogDefinition =
    {
      label: 'Lyric Editor', elements:
        [{
          smoName: 'verse',
          defaultValue: 0,
          control: 'SuiDropdownComponent',
          label: 'Verse',
          classes: 'hide-when-editing',
          startRow: true,
          options: [{
            value: 0,
            label: '1'
          }, {
            value: 1,
            label: '2'
          }, {
            value: 2,
            label: '3'
          }, {
            value: 3,
            label: '4'
          }
          ]
        }, {
          smoName: 'translateY',
          classes: 'hide-when-editing',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Y Adjustment (Px)',
          dataType: 'int'
        }, {
          smoName: 'font',
          classes: 'hide-when-editing',
          defaultValue: 0,
          control: 'SuiFontComponent',
          label: 'Font'
        }, {
          smoName: 'lyricEditor',
          defaultValue: 0,
          classes: 'show-always',
          control: 'SuiLyricComponent',
          label: 'Edit Lyrics',
          options: []
        },
        ], staticText: [
          { doneEditing: 'Done Editing Lyrics' },
          { undo: 'Undo Lyrics' },
          { label: 'Lyric Editor' }
        ]
    };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiLyricDialog(parameters);
    dg.display();
    return dg;
  }
  originalRefreshTimer: number;
  modifier: SmoLyric | null = null;
  verse: number = 0;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;
  lyric: SmoLyric | null = null;
  constructor(parameters: SuiDialogParams) {
    super(SuiLyricDialog.dialogElements, parameters);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
    this.originalRefreshTimer = SmoConfig.idleRedrawTime;
    SmoConfig.idleRedrawTime = SuiLyricDialog.idleLyricTime;
    if (this.modifier) {
      this.verse = this.modifier.verse;
    }
  }
  get lyricEditorCtrl(): SuiLyricComponent {
    return this.cmap.lyricEditorCtrl as SuiLyricComponent;
  }
  get fontCtrl(): SuiFontComponent {
    return this.cmap.fontCtrl as SuiFontComponent;
  }
  get translateYCtrl(): SuiRockerComponent {
    return this.cmap.translateYCtrl as SuiRockerComponent;
  }
  get verseCtrl(): SuiDropdownComponent {
    return this.cmap.verseCtrl as SuiDropdownComponent;
  }
  display() {
    super.display();
    $(this.dgDom.element).find('.smoControl').each((ix: number, ctrl: any) => {
      if (!$(ctrl).hasClass('cbLyricEdit')) {
        $(ctrl).addClass('fold-textedit');
      }
    });
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');

    if (this.lyricEditorCtrl.session && this.lyricEditorCtrl.session.lyric) {
      const lyric = this.lyricEditorCtrl.session.lyric;
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size,
        weight: 'normal'
      });
    }
  }
  setLyric(lyric: SmoLyric) {
    this.lyric = lyric;
    this.translateYCtrl.setValue(lyric.translateY);
  }
  _focusSelection() {
    const selection = this.lyricEditorCtrl.session?.selection;
    const note = selection?.note;
    const box: SvgBox | null = note?.renderedBox ?? null;
    if (box) {
      this.view.scroller.scrollVisibleBox(box);      
    }
  }
  changed() {
    this.lyricEditorCtrl.verse = parseInt(this.verseCtrl.getValue().toString(), 10);

    // TODO: make these undoable
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.setLyricFont({ 'family': fontInfo.family, size: fontInfo.size, weight: 'normal' });
    }
    if (this.translateYCtrl && this.lyric) {
      this.lyric.translateY = this.translateYCtrl.getValue();
    }
  }
  bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.remove-button').remove();
    this.lyricEditorCtrl.startEditSession();
  }
  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      if (!this.lyricEditorCtrl.running) {
        return;
      }
      const edited = this.lyricEditorCtrl.evKey(evdata);
      if (edited) {
        evdata.stopPropagation();
      }
    }
  }
  _complete() {
    if (this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.endSession();
    }
    if (this.mouseMoveHandler) {
      this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    }
    if (this.mouseClickHandler) {
      this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    }
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    SmoConfig.idleRedrawTime = this.originalRefreshTimer;
    this.complete();
  }

  mouseMove(ev: any) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}
export class SuiChordChangeDialog extends SuiDialogBase {
  static createAndDisplay(parameters: SuiDialogParams) {
    var dg = new SuiChordChangeDialog(parameters);
    dg.display();
    return dg;
  }
  static dialogElements: DialogDefinition =
      {
        label: 'Edit Chord Symbol', elements:
          [{
            smoName: 'verse',
            defaultValue: 0,
            control: 'SuiDropdownComponent',
            label: 'Ordinality',
            classes: 'hide-when-editing',
            startRow: true,
            options: [{
              value: 0,
              label: '1'
            }, {
              value: 1,
              label: '2'
            }, {
              value: 2,
              label: '3'
            }]
          }, {
            smoName: 'translateY',
            defaultValue: 0,
            classes: 'hide-when-editing',
            control: 'SuiRockerComponent',
            label: 'Y Adjustment (Px)',
            dataType: 'int'
          }, {
            smoName: 'chordEditor',
            defaultValue: 0,
            classes: 'show-always',
            control: 'SuiChordComponent',
            label: 'Edit Text',
            options: []
          }, {
            smoName: 'chordSymbol',
            defaultValue: '',
            classes: 'show-when-editing',
            control: 'SuiDropdownComponent',
            label: 'Chord Symbol',
            startRow: true,
            options: [{
              value: 'csymDiminished',
              label: 'Dim'
            }, {
              value: 'csymHalfDiminished',
              label: 'Half dim'
            }, {
              value: 'csymDiagonalArrangementSlash',
              label: 'Slash'
            }, {
              value: 'csymMajorSeventh',
              label: 'Maj7'
            }]
          }, {
            smoName: 'textPosition',
            defaultValue: SuiInlineText.textTypes.normal,
            classes: 'show-when-editing',
            control: 'SuiDropdownComponent',
            label: 'Text Position',
            startRow: true,
            options: [{
              value: SuiInlineText.textTypes.superScript,
              label: 'Superscript'
            }, {
              value: SuiInlineText.textTypes.subScript,
              label: 'Subscript'
            }, {
              value: SuiInlineText.textTypes.normal,
              label: 'Normal'
            }]
          }, {
            smoName: 'font',
            classes: 'hide-when-editing',
            defaultValue: 0,
            control: 'SuiFontComponent',
            label: 'Font'
          }, {
            smoName: 'adjustWidth',
            classes: 'hide-when-editing',
            control: 'SuiToggleComponent',
            label: 'Adjust Note Width',
            options: []
          }],
        staticText: [
          { label: 'Edit Chord Symbol' },
          { undo: 'Undo Chord Symbols' },
          { doneEditing: 'Done Editing Chord Symbols' }
        ]
      };
  lyric: SmoLyric | null = null;
  selector: SmoSelector | null = null;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;

  constructor(parameters: SuiDialogParams) {
    super(SuiChordChangeDialog.dialogElements, parameters);
    parameters.ctor = 'SuiChordChangeDialog';
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
  }
  get chordEditorCtrl(): SuiChordComponent {
    return this.cmap.chordEditorCtrl as SuiChordComponent;
  }
  get chordSymbolCtrl(): SuiDropdownComponent {
    return this.cmap.chordSymbolCtrl as SuiDropdownComponent;
  }
  get translateYCtrl(): SuiRockerComponent {
    return this.cmap.translateYCtrl as SuiRockerComponent;
  }
  get textPositionCtrl(): SuiRockerComponent {
    return this.cmap.textPositionCtrl as SuiRockerComponent;
  }
  get adjustWidthCtrl(): SuiToggleComponent {
    return this.cmap.adjustWidthCtrl as SuiToggleComponent;
  }
  get fontCtrl(): SuiFontComponent {
    return this.cmap.fontCtrl as SuiFontComponent;
  }
  changed() {
    let val = '';
    if (this.chordSymbolCtrl.changeFlag && this.chordEditorCtrl.running) {
      val = '@' + this.chordSymbolCtrl.getValue() + '@';
      var  kv:KeyEvent;
      /*     type: string, shiftKey: boolean, ctrlKey: boolean, altKey: boolean, key: string, keyCode: string,
    code: string*/
      this.chordEditorCtrl.evKey({
        type: 'keydown',
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        key: val,
        code: val,
        event: null,
        keyCode: '0'
      });
      // Move focus outside the element so it doesn't intercept keys
      this.chordSymbolCtrl.unselect();
    }
    if (this.translateYCtrl.changeFlag) {
      if (this.lyric && this.selector) {
        this.lyric.translateY = this.translateYCtrl.getValue();
        this.view.addOrUpdateLyric(this.selector, this.lyric);
      }
    }
    if (this.textPositionCtrl.changeFlag) {
      this.chordEditorCtrl.setTextType(this.textPositionCtrl.getValue());
      $(this.textPositionCtrl._getInputElement())[0].selectedIndex = -1;
      $(this.textPositionCtrl._getInputElement()).blur();
    }
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.setChordFont(fontInfo);
    }
    if (this.adjustWidthCtrl.changeFlag) {
      this.view.score.setChordAdjustWidth(this.adjustWidthCtrl.getValue());
    }
  }
  setLyric(selector: SmoSelector, lyric: SmoLyric) {
    this.selector = selector;
    this.lyric = lyric;
    this.translateYCtrl.setValue(lyric.translateY);
  }

  display() {
    super.display();
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');
    if (this.chordEditorCtrl && this.chordEditorCtrl.session && this.chordEditorCtrl.session.lyric) {
      const lyric = this.chordEditorCtrl.session.lyric;
      this.adjustWidthCtrl.setValue(lyric.adjustNoteWidthChord);
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size, weight: 'normal'
      });
    }
  }

  bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.remove-button').remove();
    // this.chordEditorCtrl.setView(this.eventSource, this.view);
    this.chordEditorCtrl.startEditSession();
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      if (!this.chordEditorCtrl.running) {
        return;
      }
      const edited = this.chordEditorCtrl.evKey(evdata);
      if (edited) {
        evdata.stopPropagation();
      }
    }
  }

  _complete() {
    if (this.chordEditorCtrl.running) {
      this.chordEditorCtrl.endSession();
    }
    this.view.renderer.setDirty();
    if (this.mouseMoveHandler) {
      this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    }
    if (this.mouseClickHandler) {
      this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    }
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }

  mouseMove(ev: any) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}
export class SuiTextTransformDialog extends SuiDialogBase {
  get textEditorCtrl(): SuiTextInPlace {
    return this.cmap.textEditorCtrl as SuiTextInPlace;
  }
  get insertCodeCtrl(): SuiDropdownComponent {
    return this.cmap.insertCodeCtrl as SuiDropdownComponent;
  }
  get textDraggerCtrl(): SuiDragText {
    return this.cmap.textDraggerCtrl as SuiDragText;
  }
  get yCtrl(): SuiRockerComponent {
    return this.cmap.yCtrl as SuiRockerComponent;
  }
  get xCtrl(): SuiRockerComponent {
    return this.cmap.xCtrl as SuiRockerComponent;
  }
  get fontCtrl(): SuiFontComponent {
    return this.cmap.fontCtrl as SuiFontComponent;
  }
  get textBlockCtrl(): SuiTextBlockComponent {
    return this.cmap.textBlockCtrl as SuiTextBlockComponent;
  }
  get paginationCtrl(): SuiDropdownComponent {
    return this.cmap.paginationCtrl as SuiDropdownComponent;
  }
  get attachToSelectorCtrl(): SuiToggleComponent {
    return this.cmap.attachToSelectorCtrl as SuiToggleComponent;
  }
  static dialogElements: DialogDefinition =
      {
        label: 'Text Properties', elements:
          [{
            smoName: 'textEditor',
            defaultValue: 0,
            control: 'SuiTextInPlace',
            classes: 'show-always hide-when-moving',
            label: 'Edit Text',
            options: []
          }, {
            smoName: 'insertCode',
            classes: 'show-when-editing hide-when-moving',
            control: 'SuiDropdownComponent',
            label: 'Insert Special',
            options: [
              { value: '@@@', label: 'Pages' },
              { value: '###', label: 'Page Number' }
            ]
          }, {
            smoName: 'textDragger',
            classes: 'hide-when-editing show-when-moving',
            defaultValue: 0,
            control: 'SuiDragText',
            label: 'Move Text',
            options: []
          }, {
            smoName: 'x',
            defaultValue: 0,
            classes: 'hide-when-editing hide-when-moving',
            control: 'SuiRockerComponent',
            label: 'X Position (Px)',
            dataType: 'int'
          }, {
            smoName: 'y',
            defaultValue: 0,
            classes: 'hide-when-editing hide-when-moving',
            control: 'SuiRockerComponent',
            label: 'Y Position (Px)',
            dataType: 'int'
          }, {
            smoName: 'font',
            classes: 'hide-when-editing hide-when-moving',
            defaultValue: SmoScoreText.fontFamilies.times,
            control: 'SuiFontComponent',
            label: 'Font Information'
          },
          {
            smoName: 'textBlock',
            classes: 'hide-when-editing hide-when-moving',
            defaultValue: '',
            control: 'SuiTextBlockComponent',
            label: 'Text Block Properties'
          },
          { // {every:'every',even:'even',odd:'odd',once:'once'}
            smoName: 'pagination',
            defaultValue: SmoScoreText.paginations.every,
            classes: 'hide-when-editing hide-when-moving',
            control: 'SuiDropdownComponent',
            label: 'Page Behavior',
            startRow: true,
            options: [{ value: SmoTextGroup.paginations.ONCE, label: 'Once' },
            { value: SmoTextGroup.paginations.EVERY, label: 'Every' },
            { value: SmoTextGroup.paginations.ODD, label: 'Odd' },
            { value: SmoTextGroup.paginations.SUBSEQUENT, label: 'Subsequent' }
            ]
          }, {
            smoName: 'attachToSelector',
            classes: 'hide-when-editing hide-when-moving',
            control: 'SuiToggleComponent',
            label: 'Attach to Selection'
          }],
        staticText: [
          { label: 'Text Properties' },
          { editorLabel: 'Done Editing Text' },
          { draggerLabel: 'Done Dragging Text' }
        ]
      };
  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiTextTransformDialog(parameters);
    dg.display();
    return dg;
  }
  edited: boolean;
  modifier: SmoTextGroup;
  backup: SmoTextGroup;
  activeScoreText: SmoScoreText;
  textElement: any;
  mouseMoveHandler: EventHandler | null;
  mouseUpHandler: EventHandler | null;
  mouseDownHandler: EventHandler | null;
  mouseClickHandler: EventHandler | null;

  constructor(parameters: SuiDialogParams) {
    let edited = false;
    const tracker = parameters.view.tracker;
    const layout = parameters.view.score.layoutManager!.getGlobalLayout();

    // Create a new text modifier, if this is new text.   Else use selection
    if (!parameters.modifier) {
      const textParams = SmoScoreText.defaults;
      textParams.position = SmoScoreText.positions.custom;
      const newText = new SmoScoreText(textParams);
      newText.y += tracker.scroller.scrollState.scroll.y;
      if (tracker.selections.length > 0) {
        const sel = tracker.selections[0].measure.svg;
        if (typeof (sel.logicalBox) !== 'undefined') {
          if (sel.logicalBox.y >= newText.y) {
            newText.y = sel.logicalBox.y;
            newText.x = sel.logicalBox.x;
          }
        }
      }
      const grpParams = SmoTextGroup.defaults;
      grpParams.blocks = [{ text: newText, position: SmoTextGroup.relativePositions.LEFT }];
      const newGroup = new SmoTextGroup(grpParams);
      parameters.modifier = newGroup;
      parameters.modifier.setActiveBlock(newText);
      parameters.view.addTextGroup(parameters.modifier);
      edited = true;
    } else {
      // Make sure there is a score text to start the editing.
      parameters.modifier.setActiveBlock(parameters.modifier.textBlocks[0].text);
    }
    const scrollPosition = tracker.scroller.absScroll;
    scrollPosition.y = scrollPosition.y / (layout.svgScale * layout.zoomScale);
    scrollPosition.x = scrollPosition.x / (layout.svgScale * layout.zoomScale);
    super(SuiTextTransformDialog.dialogElements, parameters);
    this.modifier = parameters.modifier;
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS']
    this.edited = edited;
    this.view.groupUndo(true);
    this.backup = this.modifier.serialize();
    this.activeScoreText = this.modifier.getActiveBlock();
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
    this.mouseDownHandler = null;
    this.mouseClickHandler = null;
  }
  populateInitial() {
    this.textBlockCtrl.setValue({
      activeScoreText: this.activeScoreText,
      modifier: this.modifier
    });
    const fontFamily = this.activeScoreText.fontInfo.family;
    const fontSize = this.activeScoreText.fontInfo.size;
    this.fontCtrl.setValue({
      family: fontFamily,
      size: fontSize,
      style: this.activeScoreText.fontInfo.style,
      weight: this.activeScoreText.fontInfo.weight
    });
    this.attachToSelectorCtrl.setValue(this.modifier.attachToSelector);
    const ul = this.modifier.ul();
    this.xCtrl.setValue(ul.x);
    this.yCtrl.setValue(ul.y);
  }
  display() {
    this.textElement = $(this.view.renderer.context.svg).find('.' + this.modifier.attrs.id)[0];
    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this.applyDisplayOptions();
    this.populateInitial();
    this.bindElements();
    if (!this.modifier.renderedBox) {
      this.view.renderer.renderTextGroup(this.modifier);
    }

    // If this control has not been edited this session, assume they want to
    // edit the text and just right into that.
    if (!this.modifier.edited) {
      this.modifier.edited = true;
      layoutDebug.addDialogDebug('text transform db: startEditSession');
      this.textEditorCtrl.startEditSession();
    }
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseUpHandler = this.eventSource.bindMouseUpHandler(this, 'mouseUp');
    this.mouseDownHandler = this.eventSource.bindMouseDownHandler(this, 'mouseDown');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');
  }
  _resetAttachToSelector() {
    this.modifier.attachToSelector = false;
    this.modifier.selector = SmoTextGroup.defaults.selector;
    this.modifier.musicXOffset = SmoTextGroup.defaults.musicXOffset;
    this.modifier.musicYOffset = SmoTextGroup.defaults.musicYOffset;
  }
  _activateAttachToSelector() {
    this.modifier.attachToSelector = true;
    this.modifier.selector = JSON.parse(JSON.stringify(this.view.tracker.selections[0].selector));
    if (this.modifier.logicalBox) {
      this.modifier.musicXOffset = this.modifier.logicalBox.x - this.view.tracker.selections[0].measure.svg.logicalBox.x;
      this.modifier.musicYOffset = this.modifier.logicalBox.y - this.view.tracker.selections[0].measure.svg.logicalBox.y;
    }
  }

  changed() {
    this.edited = true;
    if (this.insertCodeCtrl.changeFlag && this.textEditorCtrl.session) {
      const val = this.insertCodeCtrl.getValue().toString().split('');
      val.forEach((key) => {
        this.evKey({ key });
      });
      this.insertCodeCtrl.unselect();
    }

    if (this.textBlockCtrl.changeFlag) {
      const nval = this.textBlockCtrl.getValue();
      this.activeScoreText = nval.activeScoreText;
      // this.textEditorCtrl.activeScoreText = this.activeScoreText;
    }

    if (this.attachToSelectorCtrl.changeFlag) {
      const toSet = this.attachToSelectorCtrl.getValue();
      if (toSet) {
        this._activateAttachToSelector();
        this.paginationCtrl.setValue(SmoTextGroup.paginations.ONCE);
        this.modifier.pagination = SmoTextGroup.paginations.ONCE;
      } else {
        this._resetAttachToSelector();
      }
    }

    const pos = this.modifier.ul();

    // position can change from drag or by dialog - only update from
    // dialog entries if that changed.
    if (this.xCtrl.changeFlag) {
      this.modifier.offsetX(this.xCtrl.getValue() - pos.x);
    }
    if (this.yCtrl.changeFlag) {
      this.modifier.offsetY(this.yCtrl.getValue() - pos.y);
    }
    if (this.textDraggerCtrl.changeFlag) {
      this.xCtrl.setValue(pos.x);
      this.yCtrl.setValue(pos.y);
    }

    if (this.paginationCtrl.changeFlag) {
      this.modifier.pagination = parseInt(this.paginationCtrl.getValue().toString(), 10);
      // Pagination and attach to measure don't mix.
      this._resetAttachToSelector();
      this.attachToSelectorCtrl.setValue(false);
    }

    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.activeScoreText.fontInfo.family = fontInfo.family;
      // transitioning away from non-point-based font size units
      this.activeScoreText.fontInfo.size = fontInfo.size;
      this.activeScoreText.fontInfo.weight = fontInfo.weight;
      this.activeScoreText.fontInfo.style = fontInfo.style;
    }
    // Use layout context because render may have reset svg.
    this.view.updateTextGroup(this.backup, this.modifier);
    this.backup = this.modifier.serialize();
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      this.textEditorCtrl.evKey(evdata);
    }
  }

  // ### Event handlers, passed from dialog
  mouseUp() {
    if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseUp(null);
    }
  }

  mouseMove(ev: any) {
    if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseMove(ev);
    } else if (this.textEditorCtrl && this.textEditorCtrl.isRunning) {
      this.textEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.textEditorCtrl && this.textEditorCtrl.isRunning) {
      this.textEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }

  mouseDown(ev: any) {
    if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseDown(ev);
    }
  }

  _complete() {
    this.view.groupUndo(false);
    this.modifier.setActiveBlock(null);
    this.view.tracker.updateMap(); // update the text map
    this.view.renderer.setDirty();
    if (this.mouseDownHandler) {
      this.eventSource.unbindMouseDownHandler(this.mouseDownHandler);
    }
    if (this.mouseUpHandler) {
      this.eventSource.unbindMouseUpHandler(this.mouseUpHandler);
    }
    if (this.mouseMoveHandler) {
      this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    }
    if (this.mouseClickHandler) {
      this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    }
    SvgHelpers.eraseOutline(this.view.renderer.context.svg, 'text-drag');
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }
  _removeText() {
    this.view.removeTextGroup(this.modifier);
  }

  bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.edited) {
        this.view.undo();
      }
      this._complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this._removeText();
      this._complete();
    });
  }
}

export class SuiDynamicDialogAdapter {
  modifier: SmoDynamicText;
  backup: SmoDynamicText;
  view: SuiScoreViewOperations;
  selection: SmoSelection;
  constructor(view: SuiScoreViewOperations, modifier: SmoDynamicText) {
    this.view = view;
    this.modifier = modifier;
    this.backup = new SmoDynamicText(this.modifier);
    this.selection = this.view.tracker.modifierSelections[0].selection!;
  }
  cancel() {
    this.view.addDynamic(this.selection, this.backup);
  }
  get xOffset() {
    return this.modifier.xOffset;
  }
  set xOffset(value: number) {
    this.modifier.xOffset = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get fontSize() {
    return this.modifier.fontSize;
  }
  set fontSize(value: number) {
    this.modifier.fontSize = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get yOffsetLine() {
    return this.modifier.yOffsetLine;
  }
  set yOffsetLine(value: number) {
    this.modifier.yOffsetLine = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get yOffsetPixels() {
    return this.modifier.yOffsetPixels;
  }
  set yOffsetPixels(value: number) {
    this.modifier.yOffsetPixels = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get text() {
    return this.modifier.text;
  }
  set text(value: string) {
    this.modifier.text = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
}
// ## SuiDynamicModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
export class SuiDynamicModifierDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition = {
        label: 'Dynamics Properties', elements:
          [{
            smoName: 'yOffsetLine',
            defaultValue: 11,
            control: 'SuiRockerComponent',
            label: 'Y Line'
          }, {
            smoName: 'yOffsetPixels',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset Px'
          }, {
            smoName: 'xOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'X Offset'
          }, {
            smoName: 'text',
            defaultValue: SmoDynamicText.dynamics.P,
            options: [{
              value: SmoDynamicText.dynamics.P,
              label: 'Piano'
            }, {
              value: SmoDynamicText.dynamics.PP,
              label: 'Pianissimo'
            }, {
              value: SmoDynamicText.dynamics.MP,
              label: 'Mezzo-Piano'
            }, {
              value: SmoDynamicText.dynamics.MF,
              label: 'Mezzo-Forte'
            }, {
              value: SmoDynamicText.dynamics.F,
              label: 'Forte'
            }, {
              value: SmoDynamicText.dynamics.FF,
              label: 'Fortissimo'
            }, {
              value: SmoDynamicText.dynamics.SFZ,
              label: 'Sforzando'
            }],
            control: 'SuiDropdownComponent',
            label: 'Text'
          }],
          staticText: []
      };

  static createAndDisplay(parameters: SuiDialogParams) {
    const dg = new SuiDynamicModifierDialog(parameters);
    dg.display();
    return dg;
  }
  modifier: SuiDynamicDialogAdapter;
  constructor(parameters: SuiDialogParams) {
    super(SuiDynamicModifierDialog.dialogElements, parameters);
    this.view.groupUndo(true);
    this.modifier = new SuiDynamicDialogAdapter(this.view, parameters.modifier);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
  // ### bindElements
  // bind the generic controls in most dialogs.
  bindElements() {
    var dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.modifier.cancel();
      this.complete();
    });
  }
}
export class helpModal {
  static createAndDisplay() {
    SuiHelp.displayHelp();
    return htmlHelpers.closeDialogPromise();
  }
}
