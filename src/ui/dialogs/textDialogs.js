class SuiLyricDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLyricDialog';
  }
  get ctor() {
    return SuiLyricDialog.ctor;
  }
  static createAndDisplay(parameters) {
  var dg = new SuiLyricDialog(parameters);
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
      label:'Verse',
      startRow:true,
      options: [{
          value: 0,
          label: '1'
        }, {
          value: 1,
          label: '2'
        }, {
          value: 2,
          label: '3'
        }
      ]
    },{
      smoName: 'translateY',
      parameterName: 'translateY',
      defaultValue: 0,
      control: 'SuiRockerComponent',
      label: 'Y Adjustment (Px)',
      type: 'int'
    }, {
      smoName: 'textEditor',
      parameterName: 'text',
      defaultValue: 0,
      control: 'SuiLyricEditComponent',
      label:'Edit Text',
      options: []
    }, {
    staticText: [
      {doneEditing: 'Done Editing Lyrics'},
      {undo: 'Undo Lyrics'},
      {label: 'Lyric Editor'}
    ]}
  ];

    return SuiLyricDialog._dialogElements;
  }

  constructor(parameters) {
    parameters.ctor= parameters.ctor ? parameters.ctor : 'SuiLyricDialog';
    var p = parameters;
    const _class = eval(p.ctor);
    const dialogElements = _class['dialogElements'];

    super(dialogElements, {
      id: 'dialog-lyrics',
      top: (p.layout.score.layout.pageWidth / 2) - 200,
      left: (p.layout.score.layout.pageHeight / 2) - 200,
      ...p
    });

    // If we are editing existing lyrics, make sure it is the same type of session.
    // Note: the actual lyric (modifier) is picked later from the selection. We just
    // need to keep track of which type of thing we are editing.
    if (parameters.modifier) {
      this.parser = parameters.modifier.parser;
    } else {
      this.parser = parameters.parser; // lyrics or chord changes
    }
    SmoUndoable.noop(this.layout.score,this.undoBuffer,'Undo lyrics');
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
    var self=this;
    this.completeNotifier.unbindKeyboardForModal(this);

    $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
        if (!$(ctrl).hasClass('cbLyricEdit')) {
          $(ctrl).addClass('fold-textedit');
        }
    });

    this.position(this.tracker.selections[0].note.renderedBox);

    var cb = function (x, y) {}
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
            cb: cb,
      moveParent: true
  });
  }
  _focusSelection() {
    if (this.textEditorCtrl.editor.selection &&
      this.textEditorCtrl.editor.selection.note &&
      this.textEditorCtrl.editor.selection.note.renderedBox) {
      this.tracker.scroller.scrollVisibleBox(this.textEditorCtrl.editor.selection.note.renderedBox);
    }
  }
  changed() {
    this.textEditorCtrl.verse = this.verse.getValue();
    // Note, when selection changes, we need to wait for the text edit session
    // to start on the new selection.  Then this.editor.changeFlag is set and
    // we can focus on the selection if it is not visible.
    if (this.textEditorCtrl.changeFlag && this.textEditorCtrl.selection) {
      this.textEditorCtrl.setSelection(this.textEditorCtrl.selection.selector);
      this._focusSelection();
    }

    if (this.translateYCtrl.changeFlag) {
      this.textEditorCtrl.setYOffset(this.translateYCtrl.getValue());
    } else {
      this.translateYCtrl.setValue(this.textEditorCtrl.getYOffset());
    }
  }
  _bindElements() {
    var self = this;
    var dgDom = this.dgDom;

  $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
      self.tracker.replaceSelectedMeasures();
      self.tracker.layout.setDirty();
      self.complete();
  });
    $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
      self.editor.undo();
      self.tracker.layout.setDirty();
      self.complete();
  });
    $(dgDom.element).find('.remove-button').remove();
    this.textEditorCtrl.eventSource = this.eventSource;
    this.textEditorCtrl.startEditSession();
  }
}

class SuiChordChangeDialog extends SuiLyricDialog {
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
    super(parameters);
  }
  static get dialogElements() {
    SuiChordChangeDialog._dialogElements = SuiChordChangeDialog._dialogElements ? SuiChordChangeDialog._dialogElements :
      [{
      smoName: 'verse',
      parameterName: 'verse',
      defaultValue: 0,
      control: 'SuiDropdownComponent',
      label:'Ordinality',
      startRow:true,
      options: [{
          value: 0,
          label: '1'
        }, {
          value: 1,
          label: '2'
        }, {
          value: 2,
          label: '3'
        }
      ]
    },{
      smoName: 'translateY',
      parameterName: 'translateY',
      defaultValue: 0,
      control: 'SuiRockerComponent',
      label: 'Y Adjustment (Px)',
      type: 'int'
    }, {
      smoName: 'textEditor',
      parameterName: 'text',
      defaultValue: 0,
      control: 'SuiLyricEditComponent',
      label:'Edit Text',
      options: []
    }, {
      staticText: [
        {label : 'Edit Chord Symbol'},
        {undo: 'Undo Chord Symbols'},
        {doneEditing : 'Done Editing Chord Symbols' }
      ]
    }
  ];

    return SuiChordChangeDialog._dialogElements;
  }
  changed() {
    this.textEditorCtrl.verse = this.verse.getValue();
    // Note, when selection changes, we need to wait for the text edit session
    // to start on the new selection.  Then this.editor.changeFlag is set and
    // we can focus on the selection if it is not visible.
    if (this.textEditorCtrl.changeFlag && this.textEditorCtrl.selection) {
      this.textEditorCtrl.setSelection(this.textEditorCtrl.selection.selector);
      this._focusSelection();
    }

    if (this.translateYCtrl.changeFlag) {
      this.textEditorCtrl.setYOffset(this.translateYCtrl.getValue());
      this.tracker.replaceSelectedMeasures();
    } else {
      this.translateYCtrl.setValue(this.textEditorCtrl.getYOffset());
    }
  }
}

class SuiTextTransformDialog  extends SuiDialogBase {
  static createAndDisplay(parameters) {
  var dg = new SuiTextTransformDialog(parameters);
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
      [
      {
        smoName: 'textEditor',
        parameterName: 'text',
        defaultValue: 0,
        control: 'SuiTextInPlace',
        label:'Edit Text',
        options: []
      },{
        smoName: 'textDragger',
        parameterName: 'textLocation',
        defaultValue: 0,
        control: 'SuiDragText',
        label:'Move Text',
        options: []
      },
      {
        smoName: 'x',
        parameterName: 'x',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'X Position (Px)',
                startRow:true,
        type: 'int'
      },{
        smoName: 'y',
        parameterName: 'y',
        defaultValue: 0,
        control: 'SuiRockerComponent',
        label: 'Y Position (Px)',
                startRow:true,
        type: 'int'
      }, {
        smoName: 'justification',
        parameterName: 'justification',
        defaultValue: SmoScoreText.justifications.left,
        control: 'SuiDropdownComponent',
        label:'Justification',
                startRow:true,
        options: [{
            value: 'left',
            label: 'Left'
          }, {
            value: 'right',
            label: 'Right'
          }, {
            value: 'center',
            label: 'Center'
          }
        ]
      },
      {
        smoName: 'fontFamily',
        parameterName: 'fontFamily',
        defaultValue: SmoScoreText.fontFamilies.times,
        control: 'SuiDropdownComponent',
        label:'Font Family',
        startRow:true,
        options: [{value:SmoScoreText.fontFamilies.serif,label:'Serif'},
          {value:SmoScoreText.fontFamilies.sansSerif,label:'Sans-Serif'},
          {label:'Monospace',value:SmoScoreText.fontFamilies.monospace},
          {label:'Cursive',value:SmoScoreText.fontFamilies.cursive},
          {label:'times',value:SmoScoreText.fontFamilies.times},
          {label:'arial',value:SmoScoreText.fontFamilies.arial},
          {label:'Helvetica',value:'Helvetica'}
        ]
      },
      {
        smoName: 'fontSize',
        parameterName: 'fontSize',
        defaultValue: 1,
        control: 'SuiRockerComponent',
        label: 'Font Size',
        type: 'float',
        increment:0.1
      },
      {
        smoName: 'fontUnit',
        parameterName: 'fontUnit',
        defaultValue: 'em',
        control: 'SuiDropdownComponent',
        label: 'Units',
        options: [{value:'em',label:'em'},{value:'px',label:'px'},{value:'pt',label:'pt'}]
      },
      {
        smoName: 'wrap',
        parameterName: 'wrap',
        defaultValue: false,
        control:'SuiToggleComponent',
        label: 'Wrap Text'
      },
      { // {every:'every',even:'even',odd:'odd',once:'once'}
        smoName: 'pagination',
        parameterName: 'pagination',
        defaultValue: SmoScoreText.paginations.every,
        control: 'SuiDropdownComponent',
        label:'Page Behavior',
        startRow:true,
        options: [{value:'once',label:'Once'},
          {value:'every',label:'Every'},
          {label:'Even',value:'even'},
          {label:'Odd',value:'odd'},
          {label:'Subsequent',value:'subsequent'}
        ]
      }, {
        staticText: [
          {label : 'Text Properties' }
        ]
      }
    ];

    return SuiTextTransformDialog._dialogElements;
  }

  display() {
    console.log('text box creationg complete')
    this.textElement=$(this.layout.context.svg).find('.' + this.modifier.attrs.id)[0];

    $('body').addClass('showAttributeDialog');
    $('body').addClass('textEditor');
    this.components.forEach((component) => {
      component.bind();
      if (typeof(component['setValue'])=='function' && this.modifier[component.parameterName]) {
        component.setValue(this.modifier[component.parameterName]);
      }
    });
    this._bindComponentNames();

    var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
    var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
    var fontSize = this.activeScoreText.fontInfo.size;
    fontSize=svgHelpers.getFontSize(fontSize);
    dbFontSize.setValue(fontSize.size);
    dbFontUnit.setValue(fontSize.unit);

    this.wrapCtrl.setValue(this.activeScoreText.boxModel != SmoScoreText.boxModels.none);

    this.paginationsComponent = this.components.find((c) => c.smoName == 'pagination');
    this.paginationsComponent.setValue(this.activeScoreText.pagination);

    this._bindElements();
    this.position(this.activeScoreText.renderedBox);

    var cb = function (x, y) {}
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('span.jsDbMove'),
      animateDiv:'.draganime',
      cb: cb,
      moveParent: true
    });
    $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
      if ($(ctrl).hasClass('cbTextInPlace')) {
       $(ctrl).addClass('fold-textmove');
       $(ctrl).addClass('fold-textresize');
      } else if ($(ctrl).hasClass('cbDragTextDialog')) {
        $(ctrl).addClass('fold-textedit');
        $(ctrl).addClass('fold-textresize');
      } else if ($(ctrl).hasClass('cbResizeTextBox')) {
        $(ctrl).addClass('fold-textedit');
        $(ctrl).addClass('fold-textmove');
      } else {
        $(ctrl).addClass('fold-textedit');
        $(ctrl).addClass('fold-textmove');
        $(ctrl).addClass('fold-textresize');
      }
    });

    // If this control has not been edited this session, assume they want to
    // edit the text and just right into that.
    if (!this.modifier.edited) {
      this.modifier.edited = true;
      layoutDebug.addDialogDebug('text transform db: startEditSession');
      this.textEditorCtrl.startEditSession();
    }
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this,'mouseMove');
    this.mouseUpHandler = this.eventSource.bindMouseUpHandler(this,'mouseUp');
    this.mouseDownHandler = this.eventSource.bindMouseDownHandler(this,'mouseDown');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this,'mouseClick');
  }
  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata) {
    if (evdata.key == 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
      return;
    } else {
      this.textEditorCtrl.evKey(evdata);
    }
    return;
  }

  mouseUp(ev) {
    if (this.textResizerCtrl && this.textResizerCtrl.running) {
      this.textResizerCtrl.mouseUp();
    }
    else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseUp();
    }
  }

  mouseMove(ev) {
    if (this.textResizerCtrl && this.textResizerCtrl.running) {
      this.textResizerCtrl.mouseMove(ev);
    }
    else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
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
    }
    else if (this.textDraggerCtrl && this.textDraggerCtrl.running) {
      this.textDraggerCtrl.mouseDown(ev);
    }
  }
  changed() {
    var textEditor = this.components.find((c) => c.smoName === 'textEditor');
    if (textEditor.editor) {
      this.modifier = textEditor.editor.textGroup;
    } else {
      this.modifier = textEditor.value;
    }

    if (this.wrapCtrl.changeFlag) {
      var boxModel = this.wrapCtrl.getValue() ? SmoScoreText.boxModels.wrap :
        SmoScoreText.boxModels.none;
      this.modifier.boxModel = boxModel;
      if (boxModel ==  SmoScoreText.boxModels.wrap) {
        this.modifier.scaleX = this.modifier.scaleY = 1.0;
        this.modifier.translateX = this.modifier.translateY = 1.0;
        this.modifier.width = this.modifier.logicalBox.width;
        this.modifier.height = this.modifier.logicalBox.height;
      }
    }

    this.components.find((x) => {
    if (typeof(x['getValue'])=='function') {
        if (x.parameterName.indexOf('scale') == 0) {
           var val = x.getValue();
            var fcn = x.parameterName+'InPlace';
            this.modifier[fcn](val);
        }
      }
    });

    var xcomp = this.components.find((x) => x.smoName === 'x');
    var ycomp = this.components.find((x) => x.smoName === 'y');
    this.modifier.x=xcomp.getValue();
    this.modifier.y=ycomp.getValue();

    var fontComp = this.components.find((c) => c.smoName === 'fontFamily');
    if (fontComp && this.textEditorCtrl.editor) {
     this.textEditorCtrl.editor.scoreText.fontInfo.family = fontComp.getValue();
    }

    if (this.paginationsComponent.changeFlag && this.textEditorCtrl.editor) {
      this.textEditorCtrl.editor.scoreText.pagination = this.paginationsComponent.getValue();
    }

    var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
    var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
    if (this.textEditorCtrl.editor) {
      this.textEditorCtrl.editor.scoreText.fontInfo.size=''+dbFontSize.getValue()+dbFontUnit.getValue();
    }

    // Use layout context because render may have reset svg.
    $(this.layout.context.svg).find('.' + this.modifier.attrs.id).remove();
    this.layout.renderTextGroup(this.modifier);
  }

  constructor(parameters) {
    var tracker = parameters.tracker;
    var layout = tracker.layout.score.layout;

    // If this is a SmoScoreText, promote it to SmoTextGroup.  That is what the other
    // layers expect.  A text group could contain multiple score text objects, and
    // one of them is the active block we are editing.  We need to know what that
    // one is so we can apply the correct fonts etc. to it
    if (!parameters.modifier) {
      var newText =  new SmoScoreText({position:SmoScoreText.positions.custom});
      var newGroup = new SmoTextGroup({blocks:[newText]});
      parameters.modifier = newGroup;
      parameters.scoreText = newText;
      tracker.layout.score.addTextGroup(newGroup);
      SmoUndoable.scoreOp(parameters.layout.score,'addScoreText',
        parameters.modifier,  parameters.undoBuffer,'Text Menu Command');
      parameters.layout.setRefresh();
    } else if (parameters.modifier.ctor === 'SmoScoreText') {
      var newGroup = new SmoTextGroup({blocks:[parameters.modifier]});
      parameters.activeScoreText = newGroup.textBlocks[0].text;
      parameters.modifier = newGroup;
      tracker.layout.score.removeScoreText(parameters.activeScoreText);
      tracker.layout.score.addTextGroup(newGroup);
    } else if (!parameters.activeScoreText) {
      parameters.activeScoreText = parameters.modifier.textBlocks[0].text;
    }

    var scrollPosition = tracker.scroller.absScroll;
    console.log('text ribbon: scroll y is '+scrollPosition.y);

    scrollPosition.y = scrollPosition.y / (layout.svgScale * layout.zoomScale);
    scrollPosition.x = scrollPosition.x / (layout.svgScale * layout.zoomScale);
    console.log('text ribbon: converted scroll y is '+scrollPosition.y);

    parameters.modifier.x = scrollPosition.x + 100;
    parameters.modifier.y = scrollPosition.y + 100;

    super(SuiTextTransformDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.attrs.id,
      top: parameters.modifier.y,
      left: parameters.modifier.x,
      ...parameters
    });

    Vex.Merge(this, parameters);
    // Do we jump right into editing?
    this.undo = parameters.undoBuffer;
    this.modifier.backupParams();
    this.completeNotifier.unbindKeyboardForModal(this);
  }

  _complete() {
    this.tracker.updateMap(); // update the text map
    this.layout.setDirty();
    this.eventSource.unbindMouseDownHandler(this.mouseDownHandler);
    this.eventSource.unbindMouseUpHandler(this.mouseUpHandler);
    this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }

  _bindElements() {
    var self = this;
    this.bindKeyboard();
    var dgDom = this.dgDom;
    var fontComp = this.components.find((c) => c.smoName === 'fontFamily');

    fontComp.setValue(this.activeScoreText.fontInfo.family);

    $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
      self._complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
      self.modifier.restoreParams();
      self._complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
      SmoUndoable.scoreOp(self.layout.score,'removeScoreText',self.modifier,self.undo,'remove text from dialog');
      self._complete();
    });
  }
}


// ## SuiTextModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
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
  }
  ],
  control: 'SuiDropdownComponent',
  label: 'Text'
  },
      {staticText: [
        {label: 'Dynamics Properties'}
      ]}
  ];
    return SuiDynamicModifierDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
  var dg = new SuiDynamicModifierDialog(parameters);
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
    this.selection = this.tracker.selections[0];
  this.components.find((x) => {
  return x.parameterName == 'text'
  }).defaultValue = parameters.modifier.text;
  }
  handleRemove() {
  $(this.context.svg).find('g.' + this.modifier.id).remove();
    this.undoBuffer.addBuffer('remove dynamic', 'measure', this.selection.selector, this.selection.measure);
  this.selection.note.removeModifier(this.modifier);
  this.tracker.clearModifierSelections();
  }
  changed() {
  this.modifier.backupOriginal();
  this.components.forEach((component) => {
  this.modifier[component.smoName] = component.getValue();
  });
  this.layout.renderNoteModifierPreview(this.modifier,this.selection);
  }
}

class helpModal {
  constructor() {}
  static createAndDisplay() {
  SmoHelp.displayHelp();
  return htmlHelpers.closeDialogPromise();
  }
}
