
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
class SuiTextInPlace extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    this.scroller = dialog.scroller;
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this.editMode=false;
    this.dialog = dialog;
    this.value='';
    var modifier = this.dialog.modifier;

    this.value = modifier;
    this.altLabel = SuiTextTransformDialog.getStaticText('editorLabel');
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbTextInPlace smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
        b('span').classes('icon icon-pencil'))
        .append(
        b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  endSession() {
    var self = this;
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');

    this.dialog.modifier.skipRender = false;

    var render = () => {
      this.dialog.view.renderer.setRefresh();
    }
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
  mouseMove(ev) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }

  mouseClick(ev) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }
  _renderInactiveBlocks() {
    const modifier = this.dialog.modifier;
    const context = this.dialog.view.renderer.context;
    context.save();
    context.setFillStyle('#ddd');
    modifier.textBlocks.forEach((block) => {
      const st = block.text;
      if (st.attrs.id !== this.dialog.activeScoreText.attrs.id) {
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
    var self=this;
    $(this._getInputElement()).find('label').text(this.altLabel);
    var modifier = this.dialog.modifier;
    modifier.skipRender = true;
    $(this.dialog.view.renderer.context.svg).find('#'+modifier.attrs.id).remove();
    this._renderInactiveBlocks();
    const ul = modifier.ul();

    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiTextSession({ renderer : this.dialog.view.renderer,
      scroller: this.dialog.view.tracker.scroller,
      x: ul.x,
      y: ul.y,
      textGroup: modifier,
      scoreText: this.dialog.activeScoreText
    });
    $('body').addClass('text-edit');
    this.value = this.session.textGroup;
    var button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
    // blur the button so key events don't get passed to it.
    $(this._getInputElement()).blur();
  }
  evKey(evdata) {
    if (this.session) {
      this.session.evKey(evdata);
    }
  }

  bind() {
    var self=this;
    this.fontInfo = JSON.parse(JSON.stringify(this.dialog.activeScoreText.fontInfo));
    this.value = this.dialog.modifier;
    $(this._getInputElement()).off('click').on('click',function(ev) {
      if (self.session && self.session.isRunning) {
        self.endSession();
      } else {
        self.startEditSession();
      }
    });
  }
}

// ## SuiNoteTextComponent
// Base class for text editor components that navigate to
// different notes.
class SuiNoteTextComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);

    this.selection = dialog.view.tracker.selections[0];
    this.selector = JSON.parse(JSON.stringify(this.selection.selector));
    this.dialog = dialog;
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  setView(eventSource, view) {
    this.eventSource = eventSource;
    this.view = view;
  }
  mouseMove(ev) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }

  mouseClick(ev) {
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
  evKey(evdata) {
    if (this.session) {
      return this.session.evKey(evdata);
    }
    return false;
  }
  setDialogLyric() {
    if (this.session && this.session.lyric) {
      this.dialog.setLyric(this.session.lyric);
    }
  }

  moveSelectionRight() {
    this.session.advanceSelection(false);
    this.setDialogLyric();
  }
  moveSelectionLeft() {
    this.session.advanceSelection(true);
    this.setDialogLyric();
  }
  removeText() {
    this.session.removeLyric();
  }

  _bind() {
    var self=this;
    $(this._getInputElement()).off('click').on('click',function(ev) {
      if (self.session && self.session.isRunning) {
        self.endSession();
      } else {
        self.startEditSession();
      }
    });
    var self=this;
    $('#' + this.parameterId+'-left').off('click').on('click',function() {
      self.moveSelectionLeft();
    });
    $('#' + this.parameterId+'-right').off('click').on('click',function() {
      self.moveSelectionRight();
    });
    $('#' + this.parameterId+'-remove').off('click').on('click',function() {
      self.removeText();
    });
  }
  getValue() {
    return this.value;
  }
}

// ## SuiLyricComponent
// manage a lyric session that moves from note to note and adds lyrics.
class SuiLyricComponent extends SuiNoteTextComponent {
  constructor(dialog, parameter) {
    super(dialog, parameter);
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this.session = null;
    this.altLabel = SuiLyricDialog.getStaticText('doneEditing');
    if (!this.verse) {
      this.verse = 0;
    }
    this.started = false;
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbLyricEdit smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
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
    var self = this;
    this.started = false;
    console.log('ending text session');
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    if (this.session) {
      this.value = this.session.textGroup;
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
       renderer : this.dialog.view.renderer,
       selector: this.selector,
       scroller: this.dialog.view.tracker.scroller,
       verse: this.verse,
       score: this.dialog.view.score,
       view: this.view
       }
     );
    this.started = true;
    $('body').addClass('text-edit');
    var button = document.getElementById(this.parameterId);
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
class SuiChordComponent extends SuiNoteTextComponent {
  constructor(dialog,parameter) {
    super(dialog, parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this.session = null;
    this.dialog = dialog;

    this.selection = dialog.view.tracker.selections[0];
    this.selector = JSON.parse(JSON.stringify(this.selection.selector));
    this.altLabel = SuiLyricDialog.getStaticText('doneEditing');
    if (!this.verse) {
      this.verse = 0;
    }
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('cbChordEdit smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
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
    var self = this;
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');

    var render = () => {
      this.dialog.view.renderer.setRefresh();
    }
    if (this.session) {
      this.value=this.session.textGroup;
      this.session.stopSession().then(render);
    }
    $('body').removeClass('text-edit');
  }
  startEditSession() {
    var self=this;
    $(this._getInputElement()).find('label').text(this.altLabel);
    var modifier = this.dialog.modifier;

    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiChordSession({
       renderer : this.dialog.view.renderer,
       selector: this.selector,
       scroller: this.dialog.view.tracker.scroller,
       verse: 0,
       view: this.view,
       score: this.dialog.view.score
       }
     );
    $('body').addClass('text-edit');
    var button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
  }
  bind() {
    this._bind();
  }
  setTextType(type) {
    this.session.textType = parseInt(type, 10);
  }
  getTextType(type) {
    return this.session.textType;
  }
}

// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
class SuiDragText extends SuiComponentBase {
  constructor(dialog,parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this.dragging = false;
    this.running = false;

    this.dialog = dialog;
    this.altLabel = SuiTextTransformDialog.getStaticText('draggerLabel');
    this.value='';
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbDragTextDialog smoControl')).attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
        b('span').classes('icon icon-move'))
        .append(
        b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  getValue() {
    return this.dialog.modifier;
  }
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
      textGroup: this.dialog.modifier,
      context: this.dialog.view.renderer.context,
      scroller: this.dialog.view.tracker.scroller
    });
    $(this._getInputElement()).find('label').text(this.altLabel);
    $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');
    this.running = true;
  }
  mouseMove(e) {
    if (this.session && this.session.dragging) {
      this.session.mouseMove(e);
    }
  }
  mouseDown(e) {
    if (this.session && !this.session.dragging) {
      this.session.startDrag(e);
      this.dragging = true;
    }
  }
  mouseUp(e) {
    if (this.session && this.session.dragging) {
      this.session.endDrag(e);
      this.dragging = false;
      this.handleChanged();
    }
  }

  bind() {
    var self=this;
    $(this._getInputElement()).off('click').on('click',function(ev) {
      if (self.running) {
        self.stopEditSession();
      } else {
        self.startEditSession();
      }
    });
  }
}
