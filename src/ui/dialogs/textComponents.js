// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
class SuiDragText extends SuiComponentBase {
  constructor(dialog,parameter) {
    super();
    smoSerialize.filteredMerge(
        ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
        this.defaultValue = 0;
    }
    this.dragging=false;
    this.running = false;

    this.dialog = dialog;
    this.value='';
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes('cbDragTextDialog smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
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
    if (this.editor && this.editor.dragging) {
      this.editor.dragging = false;
    }
    this.running = false;
  }
  startEditSession() {
    $('body').addClass('text-move');
    this.editor = new SuiDragSession({
      textGroup: this.dialog.modifier,
      context: this.dialog.layout.context,
      scroller: this.dialog.tracker.scroller
    });
    $(this._getInputElement()).find('label').text('Done Moving Text Block');
    $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');
    this.running = true;
  }
  mouseMove(e) {
    if (this.editor && this.editor.dragging) {
      this.editor.mouseMove(e);
    }
  }
  mouseDown(e) {
    if (this.editor && !this.editor.dragging) {
      this.editor.startDrag(e);
      this.dragging = true;
    }
  }
  mouseUp(e) {
    if (this.editor && this.editor.dragging) {
      this.editor.endDrag(e);
      this.dragging = false;
      this.dialog.changed();
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

// ## TBD: do this.
class SuiResizeTextBox extends SuiComponentBase {
  constructor(dialog,parameter) {
    super();
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'control', 'label'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    this.resizing = false;
    this.running = false;

    this.dialog = dialog;
    this.value='';
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes('cbResizeTextBox smoControl').attr('id', this.parameterId).attr('data-param', this.parameterName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
          .attr('id', id + '-input').append(
          b('span').classes('icon icon-enlarge'))
          .append(
          b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  stopEditSession() {
    $('body').removeClass('text-resize');
    if (this.editor && this.editor.dragging) {
      this.editor.dragging = false;
      this.dragging = false;
    }
    this.running = false;
  }
  getValue() {
    return this.value;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  mouseUp(e) {
    if (this.editor && this.editor.dragging) {
      this.editor.endDrag(e);
      this.dragging = false;
      this.dialog.changed();
    }
  }
  mouseMove(e) {
    if (this.editor && this.editor.dragging) {
      this.editor.mouseMove(e);
    }
  }

  startEditSession() {
    $('body').addClass('text-resize');
    this.editor = new SuiResizeTextSession({
      textGroup: this.dialog.modifier,
      context: this.dialog.layout.context,
      scroller: this.dialog.tracker.scroller
    });
    this.running = true;
    $(this._getInputElement()).find('label').text('Done Resizing Text Block');
    $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');
  }
  mouseDown(e) {
    if (this.editor && !this.editor.dragging) {
      this.editor.startDrag(e);
      this.dragging = true;
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
