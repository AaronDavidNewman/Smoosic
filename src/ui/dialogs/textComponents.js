class SuiLyricEditComponent extends SuiComponentBase {
  constructor(dialog,parameter) {
    super();
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this._verse = 0;

    this.dialog = dialog;
    this.selection = null;
    this.value='';
  }

  set verse(val) {
    this._verse = val;
  }

  get verse() {
    return this._verse;
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes('cbLyricEdit smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('div').classes('toggleEdit')
        .append(b('button').classes('toggleTextEdit')
          .attr('id', id + '-toggleInput').append(
          b('span').classes('icon icon-pencil'))).append(
          b('label').attr('for', id + '-toggleInput').text(this.label)))

      .append(b('div').classes('controlDiv')
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
  get parameterId() {
      return this.dialog.id + '-' + this.parameterName;
  }

  // If the user pressed esc., force the end of the session
  endSessionDom() {
    var elementDom = $('#'+this.parameterId);
    $(elementDom).find('label').text('Edit Lyrics');
    $(this.editorButton).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    $('body').removeClass('text-edit');
    $('div.textEdit').addClass('hide');
  }
  getValue() {
    return this.value;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button.toggleTextEdit');
  }

  notifySelectionChanged(selection) {
      if (selection) {
          layoutDebug.addTextDebug('SuiLyricEditComponent: lyric notification for ' + selection.note.attrs.id);
      } else {
          layoutDebug.addTextDebug('SuiLyricEditComponent: no selection');
      }
      if (this.selection == null || SmoSelector.neq(selection.selector,this.selection.selector)) {
          this.selection = selection;
          this.handleChanged();
      }
      if (!this.editor.isRunning) {
        this.endSessionDom();
      }
  }

  moveSelectionRight() {
    this.editor.moveSelectionRight();
  }
  moveSelectionLeft() {
    this.editor.moveSelectionLeft();
  }
  removeText() {
    this.editor.removeText();
  }

  _startEditorDom() {
    var elementDom = $('#'+this.parameterId);
    var button = $(elementDom).find('button.toggleTextEdit');
    layoutDebug.addTextDebug('SuiLyricEditComponent: create editor for ' + this.tracker.selections[0].note.attrs.id);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    $(elementDom).find('label').text('Done Editing Lyrics');
  }
  get editorButton() {
    var elementDom = $('#'+this.parameterId);
    var button = $(elementDom).find('button.toggleTextEdit');
    return button;
  }
  toggleSessionButton() {
    this.handleChanged();
    if (!this.editor.isRunning) {
      this.editor.verse = this.verse;
      this._startEditorDom();
      layoutDebug.addTextDebug('SuiLyricEditComponent: restarting button');
     } else {
       this.endSessionDom();
       layoutDebug.addTextDebug('SuiLyricEditComponent: stopping editor button');
     }
     this.editor.toggleSessionStateEvent();
  }
  getYOffset() {
    if (this.editor) {
      return this.editor.getYOffset();
    }
    return 0;
  }

  setYOffset(val) {
    if (this.editor) {
      this.editor.setYOffset(val);
    }
  }
  startEditSession(selection) {
    var self=this;
    layoutDebug.addTextDebug('SuiLyricEditComponent: create editor request');
    this._startEditorDom();
    this.editor = new noteTextEditSession(this,this.tracker,this.verse,this.selection,this.eventSource,this.dialog.parser);
    this.editor.startEditingSession();
    this._bind();
  }
  bind() {
    this.tracker = this.dialog.tracker;
    this.selection = this.dialog.selection;
    this.controller = this.dialog.controller; // do we need this
  }

  _bind() {
    var self=this;
    $('#'+this.parameterId+'-left').off('click').on('click',function() {
      self.moveSelectionLeft();
    });
    $('#'+this.parameterId+'-right').off('click').on('click',function() {
      self.moveSelectionRight();
    });
    $('#'+this.parameterId+'-remove').off('click').on('click',function() {
      self.removeText();
    });
    $(this.editorButton).off('click').on('click',function() {
      self.toggleSessionButton();
    });
  }
}
