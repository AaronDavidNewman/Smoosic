// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreModifiers';

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
    super(SuiTextBlockDialog.dialogElements, parameters);
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
    this.highlightActiveRegion();
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
    this.view.updateTextGroup(this.backup, this.modifier);
    this.backup = this.modifier.serialize();
  }
  highlightActiveRegion() {
    SvgHelpers.eraseOutline(this.view.renderer.svg, SuiTextEditor.strokes['text-highlight']);
    SvgHelpers.eraseOutline(this.view.renderer.svg, SuiTextEditor.strokes['text-suggestion']);
    SvgHelpers.eraseOutline(this.view.renderer.svg, SuiTextEditor.strokes['inactive-text']);
    if (this.activeScoreText.renderedBox) {
      const stroke = SuiTextEditor.strokes['text-highlight'];
      const outline: OutlineInfo = {
        context: this.view.renderer.context,
        clientCoordinates: false,
        classes: '',
        stroke,
        box: this.activeScoreText.renderedBox,
        scroll: this.scroller.scrollState.scroll
      }
      SvgHelpers.outlineRect(outline);
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
    SvgHelpers.eraseOutline(this.view.renderer.context.svg, SuiTextEditor.strokes['text-drag']);
    $('body').find('g.vf-text-highlight').remove();
    SvgHelpers.eraseOutline(this.view.renderer.context.svg, SuiTextEditor.strokes['text-highlight']);
    SvgHelpers.eraseOutline(this.view.renderer.context.svg, SuiTextEditor.strokes['text-suggestion']);
    SvgHelpers.eraseOutline(this.view.renderer.context.svg, SuiTextEditor.strokes['inactive-text']);
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

export class helpModal {
  static createAndDisplay() {
    SuiHelp.displayHelp();
    return closeDialogPromise();
  }
}
