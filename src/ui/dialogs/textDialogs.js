// eslint-disable-next-line no-unused-vars
class SuiLyricDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLyricDialog';
  }
  get ctor() {
    return SuiLyricDialog.ctor;
  }
  static get idleLyricTime() {
    return 5000;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiLyricDialog(parameters);
    dg.display();
    return dg;
  }
  static get dialogElements() {
    SuiLyricDialog._dialogElements = SuiLyricDialog._dialogElements ? SuiLyricDialog._dialogElements :
      [{
        smoName: 'verse',
        parameterName: 'verse',
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
        ] }, {
        smoName: 'translateY',
        parameterName: 'translateY',
        classes: 'hide-when-editing',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Y Adjustment (Px)',
        type: 'int'
      }, {
        smoName: 'font',
        parameterName: 'font',
        classes: 'hide-when-editing',
        defaultValue: 0,
        control: 'SuiFontComponent',
        label: 'Font'
      }, {
        smoName: 'lyricEditor',
        parameterName: 'text',
        defaultValue: 0,
        classes: 'show-always',
        control: 'SuiLyricComponent',
        label: 'Edit Lyrics',
        options: []
      }, {
        staticText: [
          { doneEditing: 'Done Editing Lyrics' },
          { undo: 'Undo Lyrics' },
          { label: 'Lyric Editor' }
        ]
      }];

    return SuiLyricDialog._dialogElements;
  }

  // ### getStaticText
  // given 'foo' return dialogElements.staticText value that has key of 'foo'
  static getStaticText(label) {
    return SuiLyricDialog.dialogElements.find((x) => x.staticText).staticText.find((x) => x[label])[label];
  }

  constructor(parameters) {
    parameters.ctor = typeof(parameters.ctor) !== 'undefined' ? parameters.ctor : 'SuiLyricDialog';
    const p = parameters;
    const _class = eval(p.ctor);
    const dialogElements = _class.dialogElements;

    super(dialogElements, {
      id: 'dialog-lyrics',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...p
    });
    this.originalRefreshTimer = SmoConfig.idleRedrawTime;
    SmoConfig.idleRedrawTime = SuiLyricDialog.idleLyricTime;

    // If we are editing existing lyrics, make sure it is the same type of session.
    // Note: the actual lyric (modifier) is picked later from the selection. We just
    // need to keep track of which type of thing we are editing.
    if (parameters.modifier) {
      this.parser = parameters.modifier.parser;
    } else {
      this.parser = parameters.parser; // lyrics or chord changes
    }
  }
  display() {
    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this.components.forEach((component) => {
      component.bind();
    });

    this._bindComponentNames();

    // this.editor = this.components.find((c) => c.smoName === 'textEditor');
    this.verse = this.components.find((c) => c.smoName === 'verse');
    this._bindElements();

    // make sure keyboard is unbound or we get dupicate key events.
    this.completeNotifier.unbindKeyboardForModal(this);

    $(this.dgDom.element).find('.smoControl').each((ix, ctrl) => {
      if (!$(ctrl).hasClass('cbLyricEdit')) {
        $(ctrl).addClass('fold-textedit');
      }
    });
    this.position(this.view.tracker.selections[0].note.renderedBox);
    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.jsDbMove'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');

    if (this.lyricEditorCtrl && this.lyricEditorCtrl.session && this.lyricEditorCtrl.session.lyric) {
      const lyric = this.lyricEditorCtrl.session.lyric;
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size,
      });
    }
    this.bindKeyboard();
  }
  setLyric(lyric) {
    this.lyric = lyric;
    this.translateYCtrl.setValue(lyric.translateY);
  }
  _focusSelection() {
    if (this.lyricEditorCtrl.editor.selection &&
      this.lyricEditorCtrl.editor.selection.note &&
      this.lyricEditorCtrl.editor.selection.note.renderedBox) {
      this.view.scroller.scrollVisibleBox(this.lyricEditorCtrl.editor.selection.note.renderedBox);
    }
  }
  changed() {
    this.lyricEditorCtrl.verse = parseInt(this.verse.getValue(), 10);

    // TODO: make these undoable
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.setLyricFont({ 'family': fontInfo.family, size: fontInfo.size });
    }
    if (this.translateYCtrl && this.lyric) {
      this.lyric.translateY = this.translateYCtrl.getValue();
    }
  }
  _bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.remove-button').remove();
    this.lyricEditorCtrl.eventSource = this.eventSource;
    this.lyricEditorCtrl.setView(this.eventSource, this.view);
    this.lyricEditorCtrl.startEditSession();
  }
  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
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
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    SmoConfig.idleRedrawTime = this.originalRefreshTimer;
    this.complete();
  }

  mouseMove(ev) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}
// eslint-disable-next-line no-unused-vars
class SuiChordChangeDialog  extends SuiDialogBase {
  static get ctor() {
    return 'SuiChordChangeDialog';
  }
  get ctor() {
    return SuiChordChangeDialog.ctor;
  }
  static createAndDisplay(parameters) {
    var dg = new SuiChordChangeDialog(parameters);
    dg.display();
    return dg;
  }
  constructor(parameters) {
    parameters.ctor = 'SuiChordChangeDialog';
    const p = parameters;
    const _class = eval(p.ctor);
    const dialogElements = _class.dialogElements;

    super(dialogElements, {
      id: 'dialog-chords',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...p
    });
  }
  static get dialogElements() {
    SuiChordChangeDialog._dialogElements = SuiChordChangeDialog._dialogElements ? SuiChordChangeDialog._dialogElements :
      [{
        smoName: 'verse',
        parameterName: 'verse',
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
        parameterName: 'translateY',
        defaultValue: 0,
        classes: 'hide-when-editing',
        control: 'SuiRockerComponent',
        label: 'Y Adjustment (Px)',
        type: 'int'
      }, {
        smoName: 'chordEditor',
        parameterName: 'text',
        defaultValue: 0,
        classes: 'show-always',
        control: 'SuiChordComponent',
        label: 'Edit Text',
        options: []
      }, {
        smoName: 'chordSymbol',
        parameterName: 'chordSymbol',
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
        parameterName: 'textPosition',
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
        parameterName: 'font',
        classes: 'hide-when-editing',
        defaultValue: 0,
        control: 'SuiFontComponent',
        label: 'Font'
      }, {
        smoName: 'adjustWidth',
        parameterName: 'adjustNoteWidth',
        defaultValue: true,
        classes: 'hide-when-editing',
        control: 'SuiToggleComponent',
        label: 'Adjust Note Width',
        options: []
      }, {
        staticText: [
          { label: 'Edit Chord Symbol' },
          { undo: 'Undo Chord Symbols' },
          { doneEditing: 'Done Editing Chord Symbols' }
        ]
      }];

    return SuiChordChangeDialog._dialogElements;
  }
  changed() {
    let val = '';
    if (this.chordSymbolCtrl.changeFlag && this.chordEditorCtrl.running)   {
      val = '@' + this.chordSymbolCtrl.getValue() + '@';
      this.chordEditorCtrl.evKey({
        key: val
      });
      // Move focus outside the element so it doesn't intercept keys
      this.chordSymbolCtrl.unselect();
    }
    if (this.textPositionCtrl.changeFlag && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.setTextType(this.textPositionCtrl.getValue());
      $(this.textPositionCtrl._getInputElement())[0].selectedIndex = -1;
      $(this.textPositionCtrl._getInputElement()).blur();
    }
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.score.setChordFont(
        { 'family': fontInfo.family, size: fontInfo.size });
    }
    if (this.adjustWidthCtrl.changeFlag) {
      this.view.score.setChordAdjustWidth(this.adjustWidthCtrl.getValue());
    }
  }
  setLyric(lyric) {
    this.lyric = lyric;
    this.translateYCtrl.setValue(lyric.translateY);
  }
  display() {
    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this.components.forEach((component) => {
      component.bind();
    });

    this._bindComponentNames();

    // this.editor = this.components.find((c) => c.smoName === 'textEditor');
    this.verse = this.components.find((c) => c.smoName === 'verse');
    this._bindElements();

    // make sure keyboard is unbound or we get dupicate key events.
    this.completeNotifier.unbindKeyboardForModal(this);

    $(this.dgDom.element).find('.smoControl').each((ix, ctrl) => {
      if (!$(ctrl).hasClass('cbLyricEdit')) {
        $(ctrl).addClass('fold-textedit');
      }
    });

    this.position(this.view.tracker.selections[0].note.renderedBox);

    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.jsDbMove'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');
    if (this.chordEditorCtrl && this.chordEditorCtrl.session && this.chordEditorCtrl.session.lyric) {
      const lyric = this.chordEditorCtrl.session.lyric;
      this.adjustWidthCtrl.setValue(lyric.adjustNoteWidth);
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size
      });
    }
    this.bindKeyboard();
  }

  _bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.remove-button').remove();
    this.chordEditorCtrl.setView(this.eventSource, this.view);
    this.chordEditorCtrl.startEditSession();
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
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
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }

  mouseMove(ev) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}
// eslint-disable-next-line no-unused-vars
class SuiTextTransformDialog  extends SuiDialogBase {
  static createAndDisplay(parameters) {
    const dg = new SuiTextTransformDialog(parameters);
    dg.display();
    return dg;
  }

  static get ctor() {
    return 'SuiTextTransformDialog';
  }
  get ctor() {
    return SuiTextTransformDialog.ctor;
  }
  static get dialogElements() {
    SuiTextTransformDialog._dialogElements = SuiTextTransformDialog._dialogElements ? SuiTextTransformDialog._dialogElements :
      [{
        smoName: 'textEditor',
        parameterName: 'text',
        defaultValue: 0,
        control: 'SuiTextInPlace',
        classes: 'show-always hide-when-moving',
        label: 'Edit Text',
        options: []
      }, {
        smoName: 'insertCode',
        parameterName: 'insertCode',
        defaultValue: false,
        classes: 'show-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Insert Special',
        options: [
          { value: '@@@', label: 'Pages' },
          { value: '###', label: 'Page Number' }
        ] }, {
        smoName: 'textDragger',
        parameterName: 'textLocation',
        classes: 'hide-when-editing show-when-moving',
        defaultValue: 0,
        control: 'SuiDragText',
        label: 'Move Text',
        options: []
      }, {
        smoName: 'x',
        parameterName: 'x',
        defaultValue: 0,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'X Position (Px)',
        type: 'int'
      }, {
        smoName: 'y',
        parameterName: 'y',
        defaultValue: 0,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Y Position (Px)',
        type: 'int'
      }, {
        smoName: 'font',
        parameterName: 'font',
        classes: 'hide-when-editing hide-when-moving',
        defaultValue: SmoScoreText.fontFamilies.times,
        control: 'SuiFontComponent',
        label: 'Font Information'
      },
      {
        smoName: 'textBlock',
        parameterName: 'textBlock',
        classes: 'hide-when-editing hide-when-moving',
        defaultValue: '',
        control: 'SuiTextBlockComponent',
        label: 'Text Block Properties'
      },
      { // {every:'every',even:'even',odd:'odd',once:'once'}
        smoName: 'pagination',
        parameterName: 'pagination',
        defaultValue: SmoScoreText.paginations.every,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Page Behavior',
        startRow: true,
        options: [{ value: SmoTextGroup.paginations.ONCE, label: 'Once' },
          { value: SmoTextGroup.paginations.EVERY, label: 'Every' },
          { value: SmoTextGroup.paginations.EVEN, label: 'Even' },
          { value: SmoTextGroup.paginations.ODD, label: 'Odd' },
          { value: SmoTextGroup.paginations.SUBSEQUENT, label: 'Subsequent' }
        ]
      }, {
        smoName: 'attachToSelector',
        parameterName: 'attachToSelector',
        defaultValue: false,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiToggleComponent',
        label: 'Attach to Selection'
      }, {
        staticText: [
          { label: 'Text Properties' },
          { editorLabel: 'Done Editing Text' },
          { draggerLabel: 'Done Dragging Text' }
        ]
      }];
    return SuiTextTransformDialog._dialogElements;
  }
  static getStaticText(label) {
    return SuiTextTransformDialog.dialogElements.find((x) => x.staticText).staticText.find((x) => x[label])[label];
  }

  display() {
    this.textElement = $(this.view.renderer.context.svg).find('.' + this.modifier.attrs.id)[0];

    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this._bindComponentNames();

    this.components.forEach((component) => {
      component.bind();
    });
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

    this.paginationsComponent = this.components.find((c) => c.smoName === 'pagination');
    this.paginationsComponent.setValue(this.modifier.pagination);

    this._bindElements();
    if (!this.modifier.renderedBox) {
      this.view.renderer.renderTextGroup(this.modifier);
    }
    this.position(this.modifier.renderedBox);
    const ul = this.modifier.ul();
    this.xCtrl.setValue(ul.x);
    this.yCtrl.setValue(ul.y);

    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('span.jsDbMove'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });

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
    this.modifier.musicXOffset = this.modifier.logicalBox.x - this.view.tracker.selections[0].measure.logicalBox.x;
    this.modifier.musicYOffset = this.modifier.logicalBox.y - this.view.tracker.selections[0].measure.logicalBox.y;
  }

  changed() {
    this.edited = true;
    if (this.insertCodeCtrl.changeFlag && this.textEditorCtrl.session) {
      const val = this.insertCodeCtrl.getValue().split('');
      val.forEach((key) => {
        this.evKey({ key });
      });
      this.insertCodeCtrl.unselect();
    }

    if (this.textBlockCtrl.changeFlag) {
      const nval = this.textBlockCtrl.getValue();
      this.activeScoreText = nval.activeScoreText;
      this.textEditorCtrl.activeScoreText = this.activeScoreText;
    }

    if (this.attachToSelectorCtrl.changeFlag) {
      const toSet = this.attachToSelectorCtrl.getValue();
      if (toSet) {
        this._activateAttachToSelector();
        this.paginationsComponent.setValue(SmoTextGroup.paginations.ONCE);
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

    if (this.paginationsComponent.changeFlag) {
      this.modifier.pagination = parseInt(this.paginationsComponent.getValue(), 10);
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
    this.view.updateTextGroup(this.previousModifier, this.modifier);
    this.previousModifier = this.modifier.serialize();
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      this.textEditorCtrl.evKey(evdata);
    }
  }

  // ### Event handlers, passed from dialog
  mouseUp() {
    if (this.textResizerCtrl && this.textResizerCtrl.running) {
      this.textResizerCtrl.mouseUp();
    } else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseUp();
    }
  }

  mouseMove(ev) {
    if (this.textResizerCtrl && this.textResizerCtrl.running) {
      this.textResizerCtrl.mouseMove(ev);
    }  else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseMove(ev);
    } else if (this.textEditorCtrl && this.textEditorCtrl.isRunning) {
      this.textEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev) {
    if (this.textEditorCtrl && this.textEditorCtrl.isRunning) {
      this.textEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }

  mouseDown(ev) {
    if (this.textResizerCtrl && this.textResizerCtrl.running) {
      this.textResizerCtrl.mouseDown(ev);
    } else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseDown(ev);
    }
  }

  constructor(parameters) {
    let edited = false;
    const tracker = parameters.view.tracker;
    const layout = parameters.view.score.layout;

    // Create a new text modifier, if this is new text.   Else use selection
    if (!parameters.modifier) {
      const newText =  new SmoScoreText({ position: SmoScoreText.positions.custom });
      newText.y += tracker.scroller.netScroll.y;
      if (tracker.selections.length > 0) {
        const sel = tracker.selections[0].measure;
        if (typeof(sel.logicalBox) !== 'undefined') {
          if (sel.logicalBox.y >= newText.y) {
            newText.y = sel.logicalBox.y;
            newText.x = sel.logicalBox.x;
          }
        }
      }
      const newGroup = new SmoTextGroup({ blocks: [newText] });
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
    super(SuiTextTransformDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.attrs.id,
      top: scrollPosition.y + 100,
      left: scrollPosition.x + 100,
      ...parameters
    });
    this.edited = edited;
    this.view.groupUndo(true);
    this.previousModifier = this.modifier.serialize();
    this.activeScoreText = this.modifier.getActiveBlock();
    Vex.Merge(this, parameters);
    this.completeNotifier.unbindKeyboardForModal(this);
  }

  _complete() {
    this.view.groupUndo(false);
    this.modifier.setActiveBlock(null);
    this.view.tracker.updateMap(); // update the text map
    this.view.renderer.setDirty();
    this.eventSource.unbindMouseDownHandler(this.mouseDownHandler);
    this.eventSource.unbindMouseUpHandler(this.mouseUpHandler);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }
  _removeText() {
    this.view.removeTextGroup(this.modifier);
  }

  _bindElements() {
    this.bindKeyboard();
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

// ## SuiDynamicModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
// eslint-disable-next-line no-unused-vars
class SuiDynamicModifierDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiDynamicModifierDialog';
  }
  get ctor() {
    return SuiDynamicModifierDialog.ctor;
  }
  static get label() {
    SuiDynamicModifierDialog._label = SuiDynamicModifierDialog._label ? SuiDynamicModifierDialog._label :
      'Dynamics Properties';
    return SuiDynamicModifierDialog._label;
  }
  static set label(value) {
    SuiDynamicModifierDialog._label = value;
  }

  static get dialogElements() {
    SuiDynamicModifierDialog._dialogElements = SuiDynamicModifierDialog._dialogElements ? SuiDynamicModifierDialog._dialogElements :
      [{
        smoName: 'yOffsetLine',
        parameterName: 'yOffsetLine',
        defaultValue: 11,
        control: 'SuiRockerComponent',
        label: 'Y Line'
      }, {
        smoName: 'yOffsetPixels',
        parameterName: 'yOffsetPixels',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Y Offset Px'
      }, {
        smoName: 'xOffset',
        parameterName: 'yOffset',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'X Offset'
      }, {
        smoName: 'text',
        parameterName: 'text',
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
      },
      { staticText: [
        { label: 'Dynamics Properties' }
      ] }
      ];
    return SuiDynamicModifierDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiDynamicModifierDialog(parameters);
    dg.display();
    return dg;
  }

  constructor(parameters) {
    super(SuiDynamicModifierDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.id,
      top: parameters.modifier.renderedBox.y,
      left: parameters.modifier.renderedBox.x,
      ...parameters
    });
    Vex.Merge(this, parameters);
    this.edited = false;
    this.view.groupUndo(true);
    this.components.find((x) => x.parameterName === 'text').defaultValue = parameters.modifier.text;
  }
  display() {
    super.display();
    // make sure keyboard is unbound or we get dupicate key events.
    this.completeNotifier.unbindKeyboardForModal(this);
    this._bindComponentNames();
    this.textCtrl.setValue(this.modifier.text);
    this.xOffsetCtrl.setValue(this.modifier.xOffset);
    this.yOffsetLineCtrl.setValue(this.modifier.yOffsetLine);
    this.yOffsetPixelsCtrl.setValue(this.modifier.yOffsetPixels);
  }
  // ### _bindElements
  // bing the generic controls in most dialogs.
  _bindElements() {
    var dgDom = this.dgDom;
    this.bindKeyboard();

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.edited) {
        this.view.undo();
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.handleRemove();
      this.complete();
    });
  }
  handleRemove() {
    this.view.removeDynamic(this.modifier);
  }
  changed() {
    this.edited = true;
    this.components.forEach((component) => {
      this.modifier[component.smoName] = component.getValue();
    });
    this.view.addDynamic(this.modifier);
  }
}
// eslint-disable-next-line no-unused-vars
class helpModal {
  static createAndDisplay() {
    SmoHelp.displayHelp();
    return htmlHelpers.closeDialogPromise();
  }
}
