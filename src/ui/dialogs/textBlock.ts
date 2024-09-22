// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreText';

import { closeDialogPromise } from '../../common/htmlHelpers';

import { layoutDebug } from '../../render/sui/layoutDebug';
import { SvgHelpers, OutlineInfo } from '../../render/sui/svgHelpers';
import { SuiTextEditor } from '../../render/sui/textEdit';

import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiDragText } from './components/dragText';
import { SuiTextInPlace } from './components/textInPlace';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiToggleComponent } from './components/toggle';
import { SuiRockerComponent } from './components/rocker';
import { SuiHelp } from '../help';
import { SuiFontComponent } from './components/fontComponent';
import { SuiTextBlockComponent } from './components/textInPlace';

import { EventHandler } from '../eventSource';
import { SuiInlineText } from '../../render/sui/textRender';
import { UndoBuffer } from '../../smo/xform/undo';

declare var $: any;

export class SuiTextBlockDialog extends SuiDialogBase {
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
            defaultValue: SmoTextGroup.paginations.ONCE,
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
  edited: boolean;
  isNew: boolean;
  modifier: SmoTextGroup;
  originalTextGroup: SmoTextGroup | null = null;
  activeScoreText: SmoScoreText;
  textElement: any;
  mouseMoveHandler: EventHandler | null;
  mouseUpHandler: EventHandler | null;
  mouseDownHandler: EventHandler | null;
  mouseClickHandler: EventHandler | null;
  outlineRect: OutlineInfo | null = null;

  constructor(parameters: SuiDialogParams) {
    let edited = false;
    let isNew = false;
    const originalTextGroup: SmoTextGroup | null = parameters.modifier ?? null;
    const tracker = parameters.view.tracker;
    ['staffModifier', 'suggestion'].forEach((outlineType) => {
      if (tracker.outlines[outlineType]) {
        SvgHelpers.eraseOutline(tracker.outlines[outlineType]);
      }
    });
    // Create a new text modifier, if this is new text.   Else use selection
    if (!parameters.modifier) {
      isNew = true;
      const textParams = SmoScoreText.defaults;
      const newText = new SmoScoreText(textParams);
      // convert scroll from screen coord to svg coord
      const svgScroll = tracker.renderer.pageMap.clientToSvg(SvgHelpers.smoBox(tracker.scroller.scrollState));
      newText.y += svgScroll.y;
      newText.x += svgScroll.x;
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
      grpParams.textBlocks = [{ text: newText, position: SmoTextGroup.relativePositions.LEFT, activeText: true }];
      const newGroup = new SmoTextGroup(grpParams);
      parameters.modifier = newGroup;
      parameters.modifier.setActiveBlock(newText);
      parameters.view.groupUndo(true);
      parameters.view.addTextGroup(parameters.modifier);
      edited = true;
    } else {
      // Make sure there is a score text to start the editing.
      parameters.modifier = SmoTextGroup.deserializePreserveId(parameters.modifier);
      parameters.modifier.setActiveBlock(parameters.modifier.textBlocks[0].text);
    }
    super(SuiTextBlockDialog.dialogElements, parameters);
    this.originalTextGroup = originalTextGroup;
    this.isNew = isNew;
    this.modifier = parameters.modifier;
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS']
    this.edited = edited;
    this.view.groupUndo(true);
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
    this.paginationCtrl.setValue(this.modifier.pagination);
    this.highlightActiveRegion();
  }
  static unrenderTextGroup(tg: SmoTextGroup) {
    tg.elements.forEach((el) => {
      el.remove();
    });
    tg.elements = [];

  }
  unrenderOriginal() {
    if (this.originalTextGroup) {
      SuiTextBlockDialog.unrenderTextGroup(this.originalTextGroup);
    }
  }
  display() {
    const pageContext = this.view.renderer.pageMap.getRendererFromModifier(this.activeScoreText);
    const svg = pageContext.svg;
    this.textElement = $(svg).find('.' + this.activeScoreText.attrs.id)[0];
    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this.applyDisplayOptions();
    this.populateInitial();
    this.bindElements();
    if (!this.modifier.logicalBox) {
      this.view.renderer.renderTextGroup(this.modifier);
    }

    // If this control has not been edited this session, assume they want to
    // edit the text and just right into that.
    if (!this.modifier.edited) {
      this.modifier.edited = true;
      layoutDebug.addDialogDebug('text transform db: startEditSession');
      this.unrenderOriginal();
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
      this.highlightActiveRegion();
    }
    if (this.textEditorCtrl.changeFlag) {
      this.highlightActiveRegion();
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
    const subtype = this.isNew ? UndoBuffer.bufferSubtypes.ADD : UndoBuffer.bufferSubtypes.UPDATE;
    this.view.updateTextGroup(this.modifier);
  }
  highlightActiveRegion() {
    const pageContext = this.view.renderer.pageMap.getRendererFromModifier(this.activeScoreText);
    const svg = pageContext.svg;
    if (this.activeScoreText.logicalBox) {
      const stroke = SuiTextEditor.strokes['text-highlight'];
      if (!this.outlineRect) {
        this.outlineRect = {
          context: pageContext,
          classes: '',
          stroke,
          box: this.activeScoreText.logicalBox,
          scroll: this.scroller.scrollState,
          timeOff: 1000
        };
      }
      SvgHelpers.eraseOutline(this.outlineRect);
      this.outlineRect.box = this.activeScoreText.logicalBox;
      SvgHelpers.outlineRect(this.outlineRect);
    }
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
    if (this.outlineRect) {
      SvgHelpers.eraseOutline(this.outlineRect);
    }
    // Hack - this comes from SuiInlineText and SuiTextEdit.
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }
  _removeText() {
    // The modifier rendered is for edit, not the one attached to the score. so
    // unrender it now
    SuiTextBlockDialog.unrenderTextGroup(this.modifier);
    this.view.removeTextGroup(this.modifier);
  }

  bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      const subtype = this.isNew ? UndoBuffer.bufferSubtypes.ADD : UndoBuffer.bufferSubtypes.UPDATE;
      this.view.updateTextGroup(this.modifier);
      this._complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      if (this.edited) {
        this.modifier.elements.forEach((element) => {
          element.remove();
        });
        this.modifier.elements = [];
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

export class helpModal {
  static createAndDisplay() {
    SuiHelp.displayHelp();
    return closeDialogPromise();
  }
}
