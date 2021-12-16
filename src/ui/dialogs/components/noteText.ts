// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiLyricSession, SuiChordSession } from '../../../render/sui/textEdit';
import { SuiInlineText } from '../../../render/sui/textRender';
import { KeyEvent } from '../../../smo/data/common';
import { htmlHelpers } from '../../../common/htmlHelpers';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SmoSelection, SmoSelector } from '../../../smo/xform/selections';
import { BrowserEventSource } from '../../eventSource';
import { SuiComponentBase, SuiDialogNotifier } from './baseComponent';
import { SmoLyric } from '../../../smo/data/noteModifiers';

declare var $: any;

/**
 * This has the text editing dialog components for notes, such as lyrics.  
 * Unlike components that are
 * actual dialog controls, these actually run a text editing session of some kind.
 * 
 * 
 *
*
* The heirarchy of text editing objects goes:
* dialog -> component -> session -> editor
*
* ### editor
*  handles low-level events and renders the preview using one
* of the text layout objects.
*
* ### session
* creates and destroys editors, e.g. for lyrics that have a Different
* editor instance for each note.
*
* ### component
* is defined in the dialog, and creates/destroys the session based on input from
* the dialog
*
* ### dialog
* manages the coponent session, as well as other components of the text like font etc.
 */


export interface SuiNoteTextParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  verse?: number
}
/**
 * Base class for text editor components that navigate to
 * different notes.
 * */
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

/** 
 * manage a lyric session that moves from note to note and adds lyrics.
 * @category SuiDialog
**/
export class SuiLyricComponent extends SuiNoteTextComponent {
  altLabel: string;
  verse: number;
  constructor(dialog: SuiDialogNotifier, parameter: SuiNoteTextParams) {
    super(dialog, parameter);
    this.altLabel = this.staticText.doneEditing;
    this.started = false;
    this.verse = parameter.verse ?? 0;
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

