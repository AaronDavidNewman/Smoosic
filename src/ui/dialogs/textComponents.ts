// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiTextSession, SuiDragSession, SuiLyricSession, SuiChordSession } from '../../render/sui/textEdit';
import { SuiInlineText } from '../../render/sui/textRender';
import { smoSerialize } from '../../common/serializationHelpers';
import { htmlHelpers } from '../../common/htmlHelpers';
import { SuiBaseComponentParams, SuiComponentBase, SuiDialogNotifier } from '../dialogComponents';
import { SuiScroller } from '../../render/sui/scroller';
import { SmoTextGroup } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { KeyEvent } from '../../application/common';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { BrowserEventSource } from '../../application/eventSource';
import { SmoLyric } from '../../smo/data/noteModifiers';

declare var $: any;
// ## textComponents module
// This has the text editing dialog components.  Unlike components that are
// actual dialog controls, these actually run a text editing session of some kind.
//
// The heirarchy of text editing objects goes:
// dialog -> component -> session -> editor
//
// ### editor
//  handles low-level events and renders the preview using one
// of the text layout objects.
//
// ### session
// creates and destroys editors, e.g. for lyrics that have a Different
// editor instance for each note.
//
// ### component
// is defined in the dialog, and creates/destroys the session based on input from
// the dialog
//
// ### dialog
// manages the coponent session, as well as other components of the text like font etc.
//
// ## SuiTextInPlace
// Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
// This component just manages the text editing component of hte renderer.
export interface SuiTextInPlaceParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export class SuiTextInPlace extends SuiComponentBase {
  scroller: SuiScroller;
  editMode: boolean = false;
  value: SmoTextGroup;
  staticText: Record<string, string>;
  altLabel: string;
  view: SuiScoreViewOperations;
  session: SuiTextSession | null = null;
  constructor(dialog: SuiDialogNotifier, parameter: SuiTextInPlaceParams) {
    super(dialog, parameter);
    this.scroller = dialog.getView().scroller;
    this.value = new SmoTextGroup(SmoTextGroup.defaults);
    this.view = this.dialog.getView();
    const modifier = this.dialog.getModifier();
    if (modifier && SmoTextGroup.isTextGroup(modifier)) {
      this.value = modifier;
    }
    this.staticText = this.dialog.getStaticText();
    this.altLabel = this.staticText.editorLabel;
  }
  show() {}
  hide() {}

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('cbTextInPlace smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
          b('span').classes('icon icon-pencil'))
        .append(
          b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  endSession() {
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    this.value.skipRender = false;

    const render = () => {
      this.view.renderer.setRefresh();
    };
    if (this.session) {
      this.session.textGroup.tryParseUnicode();
      this.value = this.session.textGroup;
      this.session.stopSession().then(render);
    }
    $('body').removeClass('text-edit');
    this.handleChanged();
  }
  get isRunning() {
    return this.session && this.session.isRunning;
  }
  getValue() {
    return this.value;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  mouseMove(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }
  _renderInactiveBlocks() {
    const modifier = this.value;
    const context = this.view.renderer.context;
    context.save();
    context.setFillStyle('#ddd');
    modifier.textBlocks.forEach((block) => {
      const st = block.text;
      if (st.attrs.id !== this.value.getActiveBlock().attrs.id) {
        const svgText = SuiInlineText.fromScoreText(st, context, this.scroller);
        if (st.logicalBox) {
          svgText.startX += st.logicalBox.x - st.x;
          svgText.startY += (st.y - st.logicalBox.y) - st.logicalBox.height / 2;
        }
        const sgrp = context.openGroup();
        sgrp.classList.add('inactive-text');
        sgrp.classList.add('suiInlineText');
        svgText.render();
        context.closeGroup();
      }
    });
    context.restore();
  }
  startEditSession() {
    $(this._getInputElement()).find('label').text(this.altLabel);
    const modifier = this.value;
    modifier.skipRender = true;
    $(this.view.renderer.context.svg).find('#' + modifier.attrs.id).remove();
    this._renderInactiveBlocks();
    const ul = modifier.ul();

    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiTextSession({
      renderer: this.view.renderer,
      scroller: this.scroller,
      x: ul.x,
      y: ul.y,
      textGroup: modifier,
      text: modifier.getActiveBlock().text,
      scoreText: modifier.getActiveBlock()
    });
    $('body').addClass('text-edit');
    this.value = this.session.textGroup;
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
    // blur the button so key events don't get passed to it.
    $(this._getInputElement()).blur();
  }
  evKey(evdata: KeyEvent) {
    if (this.session) {
      this.session.evKey(evdata);
    }
  }
  bind() {
    $(this._getInputElement()).off('click').on('click', () => {
      if (this.session && this.session.isRunning) {
        this.endSession();
      } else {
        this.startEditSession();
      }
    });
  }
}

export interface SuiNoteTextParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  verse: number
}
// ## SuiNoteTextComponent
// Base class for text editor components that navigate to
// different notes.
export abstract class SuiNoteTextComponent extends SuiComponentBase {
  view: SuiScoreViewOperations;
  selection: SmoSelection;
  selector: SmoSelector;
  eventSource: BrowserEventSource;
  session: SuiLyricSession | null = null;
  value: SmoLyric | null = null;
  started: boolean = false;
  staticText: Record<string, string>;
  constructor(dialog: SuiDialogNotifier, parameter: SuiNoteTextParams) {
    super(dialog, parameter);
    this.view = this.dialog.getView();
    this.eventSource = this.dialog.getEventSource();
    this.selection = this.view.tracker.selections[0];
    this.selector = JSON.parse(JSON.stringify(this.selection.selector));
    this.staticText = this.dialog.getStaticText();
  }
  abstract startEditSession(): void;
  abstract endSession(): void;
  mouseMove(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }
  show() {}
  hide() {}

  mouseClick(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  get running() {
    return this.session && this.session.isRunning;
  }
  evKey(evdata: KeyEvent) {
    if (this.session) {
      return this.session.evKey(evdata);
    }
    return false;
  }
  setDialogLyric() {
    if (this.session && this.session.lyric) {
      (this.dialog as any).setLyric(this.selector, this.session.lyric);
    }
  }

  moveSelectionRight() {
    if (this.session) {
      this.session.advanceSelection(false);
      this.setDialogLyric();
    }
  }
  moveSelectionLeft() {
    if (this.session) {
      this.session.advanceSelection(true);
      this.setDialogLyric();
    }
  }
  removeText() {
    if (this.session) {
      this.session.removeLyric();
    }
  }

  _bind() {
    $(this._getInputElement()).off('click').on('click', () => {
      if (this.session && this.session.isRunning) {
        this.endSession();
      } else {
        this.startEditSession();
      }
    });
    $('#' + this.parameterId + '-left').off('click').on('click', () => {
      this.moveSelectionLeft();
    });
    $('#' + this.parameterId + '-right').off('click').on('click', () => {
      this.moveSelectionRight();
    });
    $('#' + this.parameterId + '-remove').off('click').on('click', () => {
      this.removeText();
    });
  }
  getValue() {
    return this.value;
  }
}

// ## SuiLyricComponent
// manage a lyric session that moves from note to note and adds lyrics.
export class SuiLyricComponent extends SuiNoteTextComponent {
  altLabel: string;
  verse: number;
  constructor(dialog: SuiDialogNotifier, parameter: SuiNoteTextParams) {
    super(dialog, parameter);
    this.altLabel = this.staticText.doneEditing;
    this.started = false;
    this.verse = parameter.verse;
  }
  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbLyricEdit smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('div').classes('toggleEdit')
        .append(b('button').classes('toggleTextEdit')
          .attr('id', id + '-toggleInput').append(
            b('span').classes('icon icon-pencil'))).append(
              b('label').attr('for', id + '-toggleInput').text(this.label)))
      .append(b('div').classes('show-when-editing')
        .append(b('span')
          .append(
            b('button').attr('id', id + '-left').classes('icon-arrow-left buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-right').classes('icon-arrow-right buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-remove').classes('icon-cross buttonComponent')))
      );
    return r;
  }

  endSession() {
    this.started = false;
    console.log('ending text session');
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    if (this.session) {
      this.session.stopSession();
    }
    $('body').removeClass('text-edit');
  }

  startEditSession() {
    $(this._getInputElement()).find('label').text(this.altLabel);
    console.log('starting text session');
    if (this.started) {
      return;
    }
    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiLyricSession({
      renderer: this.view.renderer,
      selector: this.selector,
      scroller: this.view.tracker.scroller,
      verse: this.verse,
      score: this.view.score,
      view: this.view
    }
    );
    this.started = true;
    $('body').addClass('text-edit');
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
    this.setDialogLyric();
  }

  bind() {
    this._bind();
  }
}

// ## SuiChordComponent
// manage a chord editing session that moves from note to note and adds chord symbols.
export class SuiChordComponent extends SuiNoteTextComponent {
  altLabel: string;
  verse: number;
  constructor(dialog: SuiDialogNotifier, parameter: SuiNoteTextParams) {
    super(dialog, parameter);
    this.session = null;
    this.dialog = dialog;
    this.selection = this.view.tracker.selections[0];
    this.selector = JSON.parse(JSON.stringify(this.selection.selector));
    this.altLabel = this.staticText.doneEditing;
    this.verse = 0;
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('cbChordEdit smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('div').classes('toggleEdit')
        .append(b('button').classes('toggleTextEdit')
          .attr('id', id + '-toggleInput').append(
            b('span').classes('icon icon-pencil'))).append(
              b('label').attr('for', id + '-toggleInput').text(this.label)))

      .append(b('div').classes('show-when-editing')
        .append(b('span')
          .append(
            b('button').attr('id', id + '-left').classes('icon-arrow-left buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-right').classes('icon-arrow-right buttonComponent')))
        .append(b('span')
          .append(
            b('button').attr('id', id + '-remove').classes('icon-cross buttonComponent')))
      );
    return r;
  }

  endSession() {
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');

    const render = () => {
      this.view.renderer.setRefresh();
    };
    if (this.session) {
      this.session.stopSession().then(render);
    }
    $('body').removeClass('text-edit');
  }
  startEditSession() {
    $(this._getInputElement()).find('label').text(this.altLabel);

    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiChordSession({
      renderer: this.view.renderer,
      selector: this.selector,
      scroller: this.view.tracker.scroller,
      verse: 0,
      view: this.view,
      score: this.view.score
    }
    );
    $('body').addClass('text-edit');
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
    this.setDialogLyric();
  }
  bind() {
    this._bind();
  }
  setTextType(type: string | number) {
    if (this.session) {
      this.session.textType = parseInt(type.toString(), 10);
    }
  }
  getTextType() {
    if (this.session) {
    return this.session.textType;
    }
    return SuiInlineText.textTypes.normal;
  }
}

// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
export class SuiDragText extends SuiComponentBase {
  dragging: boolean = false;
  running: boolean = false;
  staticText: Record<string, string>;
  altLabel: string;
  value: string = '';
  session: SuiDragSession | null = null;
  view: SuiScoreViewOperations;
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter);
    this.dragging = false;
    this.running = false;
    this.staticText = this.dialog.getStaticText();
    this.altLabel = this.staticText.draggerLabel;
    this.value = '';
    this.view = this.dialog.getView();
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbDragTextDialog smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
          b('span').classes('icon icon-move'))
        .append(
          b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  show(){}
  hide(){}
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  stopEditSession() {
    $('body').removeClass('text-move');
    $(this._getInputElement()).find('span.icon').removeClass('icon-checkmark').addClass('icon-move');
    if (this.session && this.session.dragging) {
      this.session.dragging = false;
    }
    this.running = false;
  }
  startEditSession() {
    $('body').addClass('text-move');
    this.session = new SuiDragSession({
      textGroup: (this.dialog as any).modifier,
      context: this.view.renderer.context,
      scroller: this.view.tracker.scroller
    });
    $(this._getInputElement()).find('label').text(this.altLabel);
    $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');
    this.running = true;
  }
  mouseMove(e: any) {
    if (this.session && this.session.dragging) {
      this.session.mouseMove(e);
    }
  }
  mouseDown(e: any) {
    if (this.session && !this.session.dragging) {
      this.session.startDrag(e);
      this.dragging = true;
    }
  }
  mouseUp(e: any) {
    if (this.session && this.session.dragging) {
      this.session.endDrag();
      this.dragging = false;
      this.handleChanged();
    }
  }

  bind() {
    const self = this;
    $(this._getInputElement()).off('click').on('click', () => {
      if (self.running) {
        self.stopEditSession();
      } else {
        self.startEditSession();
      }
    });
  }
}
