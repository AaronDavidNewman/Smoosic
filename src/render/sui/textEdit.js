

// ## SuiTextEditor
// Next-gen text editor.  The base text editor handles the positioning and inserting
// of text blocks into the text area.  The derived class shoud interpret key events.
class SuiTextEditor {
  static get attributes() {
    return ['svgText','context','x','y','text','textPos','selectionStart','selectionLength','empty'];
  }
  static get defaults() {
    return {
      svgText: null,
      context: null,
      x: 0,
      y: 0,
      text: '',
      textPos: 0,
      selectionStart: -1,
      selectionLength: 0,
      empty: true,
      suggestFadeTimer:null,
      suggestionIndex:-1
    }
  }
  constructor(params) {
    Vex.Merge(this,SuiTextEditor.defaults);
    Vex.Merge(this,params);
    this.context = params.context;
  }

  static get strokes() {
    return {
      'text-suggestion': {
        'stroke': '#cce',
        'stroke-width': 1,
        'stroke-dasharray': '4,1',
        'fill': 'none'
      },
      'text-selection': {
        'stroke': '#99d',
        'stroke-width': 1,
        'fill': 'none'
      }
    }
  }

  _suggestionParameters(box,strokeName) {
    const outlineStroke = SuiTextEditor.strokes[strokeName];
    return {
      context: this.context, box: box,classes: strokeName,
         outlineStroke, scroller: this.scroller
    }
  }
  _expandSelectionToSuggestion() {
    if (this.suggestionIndex < 0) {
      return;
    }
    if (this.selectionStart < 0) {
      this._setSelectionToSugggestion();
      return;
    }  else if (this.selectionStart > this.suggestionIndex) {
      const oldStart = this.selectionStart;
      this.selectionStart = this.suggestionIndex;
      this.selectionLength = (oldStart - this.selectionStart) + this.selectionLength;
    }  else if (this.selectionStart < this.suggestionIndex
        && this.selectionStart > this.selectionStart + this.selectionLength) {
      const oldStart = this.selectionStart;
      this.selectionLength = (this.suggestionIndex - this.selectionStart) + 1;
    }
    this._updateSelections();
  }
  _setSelectionToSugggestion() {
    this.selectionStart = this.suggestionIndex;
    this.selectionLength = 1;
    this.suggestionIndex = -1;
    this._updateSelections();
  }

  // ### handleMouseEvent
  // Handle hover/click behavior for the text under edit.
  handleMouseEvent(ev) {
    var blocks = this.svgText.getIntersectingBlocks({
      x: ev.clientX,
      y: ev.clientY
    }, this.scroller.netScroll );

    // The mouse is not over the text
    if (!blocks.length) {
      svgHelpers.eraseOutline(this.context,'text-suggestion');

      // If the user clicks and there was a previous selection, treat it as selected
      if (ev.type === 'click' && this.suggestionIndex >= 0) {
        if (ev.shiftKey) {
          this._expandSelectionToSuggestion();
        } else {
          this._setSelectionToSugggestion();
        }
      }
      this.svgText.render();
      return;
    }
    // outline the text that is hovered.  Since mouse is a point
    // there should only be 1
    blocks.forEach((block) => {
      svgHelpers.outlineRect(this._suggestionParameters(block.box,'text-suggestion'));
      this.suggestionIndex = block.index;
    });
    // if the user clicked on it, add it to the selection.
    if (ev.type === 'click') {
      svgHelpers.eraseOutline(this.context,'text-suggestion');
      if (ev.shiftKey) {
        this._expandSelectionToSuggestion();
      } else {
        this._setSelectionToSugggestion();
      }
      this.svgText.render();
    }
  }

  // ### _serviceCursor
  // Flash the cursor as a background task
  _serviceCursor() {
    if (this.cursorState) {
      this.svgText.renderCursorAt(this.textPos - 1);
    } else {
      this.svgText.removeCursor();
    }
    this.cursorState = !this.cursorState;
  }
  // ### _refreshCursor
  // If the text position changes, update the cursor position right away
  // don't wait for blink.
  _refreshCursor() {
    this.svgText.removeCursor();
    this.cursorState = true;
    this._serviceCursor();
  }

  get _endCursorCondition() {
    return this.cursorRunning === false;
  }

  _cursorPreResolve() {
    this.svgText.removeCursor();
  }

  _cursorPoll() {
    this._serviceCursor();
  }



  // ### startCursorPromise
  // Used by the calling logic to start the cursor.
  // returns a promise that can be pended when the editing ends.
  startCursorPromise() {
    var self = this;
    this.cursorRunning = true;
    this.cursorState = true;
    self.svgText.renderCursorAt(this.textPos);
    return PromiseHelpers.makePromise(this,'_endCursorCondition','_cursorPreResolve','_cursorPoll',333);
  }
  stopCursor() {
    this.cursorRunning = false;
  }

  // ### setTextPos
  // Set the text position within the editor space and update the cursor
  setTextPos(val) {
    this.textPos = val;
    this._refreshCursor();
  }
  // ### moveCursorRight
  // move cursor right within the block of text.
  moveCursorRight() {
    if (this.textPos <= this.svgText.blocks.length) {
      this.setTextPos(this.textPos + 1);
    }
  }
  // ### moveCursorRight
  // move cursor left within the block of text.
  moveCursorLeft() {
    if (this.textPos > 0) {
      this.setTextPos(this.textPos - 1);
    }
  }

  // ### moveCursorRight
  // highlight the text selections
  _updateSelections() {
    let i = 0;
    const end = this.selectionStart + this.selectionLength;
    const start =  this.selectionStart;
    this.svgText.blocks.forEach((block) => {
      const val = start >= 0 && i >= start && i < end;
      this.svgText.setHighlight(block,val);
      ++i;
    });
  }

  // ### _checkGrowSelectionLeft
  // grow selection within the bounds
  _checkGrowSelectionLeft() {
    if (this.selectionStart > 0) {
      this.selectionStart -= 1;
      this.selectionLength += 1;
    }
  }
  // ### _checkGrowSelectionRight
  // grow selection within the bounds
  _checkGrowSelectionRight() {
    const end = this.selectionStart + this.selectionLength;
    if (end < this.svgText.blocks.length) {
      this.selectionLength += 1;
    }
  }

  // ### growSelectionLeft
  // handle the selection keys
  growSelectionLeft() {
    if (this.selectionStart === -1) {
      this.moveCursorLeft();
      this.selectionStart = this.textPos;
      this.selectionLength = 1;
    } else if (this.textPos === this.selectionStart) {
      this.moveCursorLeft();
      this._checkGrowSelectionLeft();
    }
    this._updateSelections();
  }

  // ### growSelectionRight
  // handle the selection keys
  growSelectionRight() {
    if (this.selectionStart === -1) {
      this.selectionStart = this.textPos;
      this.selectionLength = 1;
      this.moveCursorRight();
    } else if (this.selectionStart + this.selectionLength === this.textPos) {
      this._checkGrowSelectionRight();
      this.moveCursorRight();
    }
    this._updateSelections();
  }

  // ### _clearSelections
  // Clear selected text
  _clearSelections() {
    this.selectionStart = -1;
    this.selectionLength = 0;
  }

  // ### deleteSelections
  // delete the selected blocks of text/glyphs
  deleteSelections() {
    const blockPos = this.selectionStart;
    for (var i = 0;i < this.selectionLength; ++i) {
      this.svgText.removeBlockAt(blockPos); // delete shifts blocks so keep index the same.
    }
    this.setTextPos(blockPos);
    this.selectionStart = -1;
    this.selectionLength = 0;
  }

  // ### parseBlocks
  // THis can be overridden by the base class to create the correct combination
  // of text and glyph blocks based on the underlying text
  parseBlocks() {
    this.svgText = new SuiInlineText({ context: this.context });
    for (var i =0;i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i,this.text[i]);
    }
    this.setTextPos(this.text.length - 1);
  }
}

class SuiLyricEditor extends SuiTextEditor {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4 };
  }
  parseBlocks() {
    this.svgText = new SuiInlineText({ context: this.context,startX: this.x, startY: this.y });
    for (var i =0;i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i,{text:this.text[i]});
      this.empty = false;
    }
    this.textPos = this.text.length;
    this.state = SuiLyricEditor.States.RUNNING;
  }

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params) {
    super(params);
    this.text = params.lyric._text;
    this.lyric = params.lyric;
    this.sessionNotifier = params.sessionNotifier;
    this.parseBlocks();
  }
  get  _endLyricCondition() {
    return this.state !== SuiLyricEditor.States.RUNNING;
  }
  _preEndCondition() {
    this.sessionNotifier.lyricEnds();
  }
  _pollCondition() {
    // nothing to do
  }

  editorStartPromise() {
    return PromiseHelpers.makePromise(this,'_endLyricCondition','_preEndCondition','_pollCondition',100);
  }

  evKey(evdata) {
    if (evdata.code === 'ArrowRight') {
      if (evdata.shiftKey) {
        this.growSelectionRight();
      } else {
        this.moveCursorRight();
      }
      this.svgText.render();
      return;
    }
    if (evdata.code === 'ArrowLeft') {
      if (evdata.shiftKey) {
        this.growSelectionLeft();
      } else {
        this.moveCursorLeft();
      }
      this.svgText.render();
      return;
    }
    var str = evdata.key;
    if (evdata.key === '-' || evdata.key === ' ') {
      // skip
      this.lyric.setText(this.svgText.value);
      this.state = SuiLyricEditor.States.STOPPING;
    }
    else if (evdata.key.charCodeAt(0) >= 33 && evdata.key.charCodeAt(0) <= 126 ) {
      if (this.empty) {
        this.svgText.removeBlockAt(0);
        this.empty = false;
        this.svgText.addTextBlockAt(0,{text: evdata.key});
        this.setTextPos(1);
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelections();
        }
        this.svgText.addTextBlockAt(this.textPos,{ text: evdata.key});
        this.setTextPos(this.textPos + 1);
      }
      this.svgText.render();
    }
  }
}

class SuiLyricSession() {
  constructor(params) {
    

  }
}

// ## editSvgText
// A class that implements very basic text editing behavior in an svg text node
// params must supply the following:
// 1. target: an svg text element
// 2. textObject: a text object described below.
// 3. layout: the page layout information, used to create the shadow editor in the DOM
// The textObject must have the following attributes:
// 1. getText returns the text (the text to render initially)
// 2. translateX, translateY, scaleX, scaleY for svg text element
// 3. fontInfo from smoScoreText and other text objects
class editSvgText {
  constructor(params) {
    this.target = params.target;
    var ns = svgHelpers.namespace;
    this.layout = params.layout;
    this.fontInfo = params.textObject.fontInfo;
		this.svg = document.createElementNS(ns, 'svg');
    this.editText = document.createElementNS(ns, 'text');
    this.textObject = params.textObject;
    this.attrAr = [];
    this.id = VF.Element.newID();

    // create a mirror of the node under edit by copying attributes
    // and setting up a similarly-dimensioned viewbox
    editSvgText.textAttrs.forEach((attr) => {
  		if (this.target.attributes[attr]) {
         		var val = this.target.attributes[attr].value;
  			this.editText.setAttributeNS('',attr,val);
  			this.attrAr.push(JSON.parse('{"'+attr+'":"'+val+'"}'));
  		}
    });
    this.editing = this.running=false;

    // Hide the original - TODO, handle non-white background.
    this.oldFill = this.target.getAttributeNS(null,'fill');
    this.target.setAttributeNS(null,'fill','#fff');

    this.editText.textContent=this.textObject.getText();
    this._value = this.textObject.getText();
    var svgBox = svgHelpers.smoBox(this.target.getBBox());
    this.clientBox = svgHelpers.smoBox(svgHelpers.smoBox(this.target.getBoundingClientRect()));
    if (this.textObject.boxModel != 'none') {
      svgBox = svgHelpers.boxPoints(this.textObject.x,this.textObject.y,this.textObject.width,this.textObject.height);
      var boxDims = svgHelpers.logicalToClient(this.svg,svgBox);
      this.clientBox.width = boxDims.width;
      this.clientBox.height = boxDims.height;
    }
    this.editText.setAttributeNS('','y',svgBox.height);

    $('.textEdit').html('');
    this.svg.appendChild(this.editText);
    var b = htmlHelpers.buildDom;
    var r = b('span').classes('hide icon-move');
    $('.textEdit').append(r.dom());
    $('.textEdit').append(this.svg);
    $('.textEdit').removeClass('hide').attr('contentEditable','true');
    this.setEditorPosition(this.clientBox,svgBox,params);
    layoutDebug.addTextDebug('editSvgText: ctor '+this.id);
  }

  setEditorPosition(clientBox,svgBox) {
    var box = svgHelpers.pointBox(this.layout.pageWidth, this.layout.pageHeight);
    svgHelpers.svgViewport(this.svg, this.textObject.translateX,this.textObject.translateY, box.x,box.y,this.layout.svgScale);

    $('.textEdit').css('top',this.clientBox.y-5)
      .css('left',this.clientBox.x-5)
      .width(this.clientBox.width+10)
      .height(this.clientBox.height+10);
  }

  endSession() {
    this.editing = false;
    layoutDebug.addTextDebug('editSvgText: endSession for '+this.id);
    this.target.setAttributeNS(null,'fill',this.oldFill);
  }

  get value() {
    return this._value;
  }

  _updateText() {
    $('.textEdit').focus();

    if (this.editText.textContent &&
      this.editText.textContent.length &&
      this._value != this.editText.textContent) {
      this.target.textContent = this._value = this.editText.textContent;
      this._value = this.target.textContent;
      var fontAttr = svgHelpers.fontIntoToSvgAttributes(this.fontInfo);
      var svgBox = svgHelpers.getTextBox(this.svg,this.attrAr,null,this._value);
      var nbox = svgHelpers.logicalToClient(this.svg,svgBox);
      if (nbox.width > this.clientBox.width) {
         this.clientBox.width = nbox.width + nbox.width*.3;
         this.clientBox.height = nbox.height;
         this.setEditorPosition(this.clientBox,svgBox,{xOffset:0,yOffset:0});
       }
    }
    if (!this.editText.textContent) {
       this.editText.textContent='\xa0';
    }
  }

  // ### endTextEditSessionPromise
  // return a promise that is resolved when the current text edit session ends.
  endTextEditSessionPromise() {
      var self=this;
      $('body').addClass('text-edit');

      this.editing=true;
      this.running = true;
      layoutDebug.addTextDebug('editSvgText: create endTextEditSessionPromise '+this.id);
      const promise = new Promise((resolve, reject) => {
        function editTimer() {
          setTimeout(function() {
            self._updateText();
            if (self.editing) {
              editTimer();
            } else {
              self._updateText();
              layoutDebug.addTextDebug('editSvgText: resolve endTextEditSessionPromise promise '+self.id);
              resolve();
            }
          },25);
        }
        editTimer();
	  });

    return promise;
  }

    static get textAttrs() {
      return ['font-size','font-family','font-weight','fill','transform'];
    }
}

// ## editLyricSession
// Another interface between UI and renderer, let the user enter lyrics while
// navigating through the notes.  This class handles the session of editing
// a single note, and also the logic of skipping from note to note.
class editLyricSession {
	static get states() {
    return {stopped:0,started:1,minus:2,space:3,backSpace:4,stopping:5};
  }
	// tracker, selection, controller
  constructor(parameters) {
    this.tracker = parameters.tracker;
    this.selection = parameters.selection;
    this.completeNotifier = parameters.completeNotifier;
    this.eventSource = parameters.eventSource;
    this.verse=parameters.verse;
    this.notifier = parameters.notifier;
	  this.bound = false;
    this.state=editLyricSession.states.stopped;
    this.parser = parameters.parser;
    layoutDebug.addTextDebug('editLyricSession: create note '+this.selection.note.attrs.id);
  }

  detach() {
    layoutDebug.addTextDebug('editLyricSession: detach() from '+this.selection.note.attrs.id);
    this.state = editLyricSession.states.stopping;
    this.editor.endSession();
    this.lyric.setText(this.editor.value);
		this.eventSource.unbindKeydownHandler( this.keydownHandler, true);
    if (this.selection) {
      this.selection.measure.changed=true;
    }
  }

  // ### detachEditorCompletePromise
  // A promise that is resolved when SVG editor is fully detached.
  detachEditorCompletePromise() {
    var self=this;
    layoutDebug.addTextDebug('editLyricSession:create detachEditorCompletePromise from '+this.selection.note.attrs.id);
    return new Promise((resolve) => {
      var waiter = () => {
      setTimeout(() => {
        if (self.state == editLyricSession.states.stopping ||
          self.state == editLyricSession.states.stopped) {
          layoutDebug.addTextDebug('editLyricSession:resolve detachEditorCompletePromise promise from '+self.selection.note.attrs.id);
          resolve();
         } else {
           waiter();
         }
        },50);
      };
      waiter();
    });
  }

    // ### _lyricAddedPromise
    // Don't edit the lyric until the DOM part has been added by the editor, so pend on a promise that has happened.
  _lyricAddedPromise() {
    var self=this;
    layoutDebug.addTextDebug('editLyricSession:create _lyricAddedPromise promise from '+self.selection.note.attrs.id);
    return new Promise((resolve) => {
      var checkAdd = function() {
        setTimeout(function() {
          self.textElement = $(self.tracker.layout.svg).find('#'+self.selection.note.renderId).find(self.lyric.getClassSelector())[0];
          if (self.textElement) {
              layoutDebug.addTextDebug('editLyricSession:resolve _lyricAddedPromise promise for  '+self.selection.note.attrs.id);
              resolve();
          } else {
              checkAdd();
          }
        },50);
      }
      checkAdd();
    });
  }

    // ### _editCurrentLyric
    // The DOM is ready.  Create the editor and wait for it to finish.
  _editCurrentLyric() {
    this.textElement = $(this.tracker.layout.svg).find('#'+this.selection.note.renderId).find(this.lyric.getClassSelector())[0];
    if (this.editor) {
      layoutDebug.addTextDebug('editLyricSession: _editCurrentLyric dispense with editor ' + this.editor.id);
    }
    this.editor = new editSvgText({target:this.textElement,
      textObject:this.lyric,
      layout:this.tracker.layout});
    this.state = editLyricSession.states.started;
    var self = this;
    function handleSkip() {
      layoutDebug.addTextDebug('editLyricSession:_editCurrentLyric endTextEditSessionPromise rcvd, editor is done, handleSkip for  '+self.selection.note.attrs.id);
      // Only skip to the next lyric if the session is still going on.
      if (self.state != editLyricSession.states.stopped && self.state != editLyricSession.states.stopping) {
          self._handleSkip();
      } else {  // session is stopping due to esc.
          self.notifier.detachCompleteEvent();
      }
    }

    this.editor.endTextEditSessionPromise().then(handleSkip);
  }

    // Start the editing session by creating editor, and wait for the editor to create the DOM element.
	_editingSession() {
    var self = this;
		if (!this.bound) {
			this.bindEvents();
		}
    function editCurrent() {
      layoutDebug.addTextDebug('editLyricSession:_lyricAddedPromise rcvd, _editCurrentLyric for  '+self.selection.note.attrs.id);
      self._editCurrentLyric();
    }
    this._lyricAddedPromise().then(editCurrent);
	}

  _getOrCreateLyric(note) {
    var lyrics =  note.getLyricForVerse(this.verse,this.parser);
    layoutDebug.addTextDebug('editLyricSession:new lyric created  ');
    if (!lyrics.length) {
			this.lyric = new SmoLyric({verse:this.verse,parser:this.parser});
    } else {
	   this.lyric = lyrics[0];
    }
  }
  removeLyric() {
    if (this.selection && this.lyric) {
      this.selection.note.removeLyric(this.lyric);
      this.tracker.replaceSelectedMeasures();
      this._deferSkip();
    }
  }

  _handleSkip() {
    // var tag = this.state == editLyricSession.states.minus ? '-' :'';
    this.lyric.setText(this.editor.value);
    this.selection.measure.changed = true;
    if (this.state != editLyricSession.states.stopping) {
      var func = (this.state == editLyricSession.states.backSpace) ? 'lastNoteSelection' : 'nextNoteSelection';
      var sel = SmoSelection[func](
      this.tracker.layout.score, this.selection.selector.staff,
      this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
      if (sel) {
        layoutDebug.addTextDebug('editLyricSession:_handleSkip,  moving on to '+sel.note.attrs.id);
        this.selection=sel;
        this.notifier.notifySelectionChanged(this.selection);
        this.editNote();
      }
    } else {
      layoutDebug.addTextDebug('editLyricSession:_handleSkip, no more lyrics');
      this.detach();
    }
  }

  editNote() {
  	var self=this;
  	function _startEditing() {
  		self._editingSession();
  	}
    this._getOrCreateLyric(this.selection.note)
  	this.fontInfo = JSON.parse(JSON.stringify(this.lyric.fontInfo));
    this.selection.note.addLyric(this.lyric);
    this.selection.measure.changed = true;
    this.tracker.replaceSelectedMeasures();
    _startEditing();
    return this.detachEditorCompletePromise();
  }

    // ### _deferSkip
    // skip to the next word, but not in the current call stack.  Used to handl
    // interactions with the dialog, where the dialog must reset changed flags
    // before  selection is changed
  _deferSkip() {
    var self=this;
    setTimeout(function() {
      self._handleSkip();
    },1);
  }

    // ### moveSelectionRight
    // Selection can move automatically based on key events, but there are Also
    // UI ways to force it.
  moveSelectionRight() {
    this.state = editLyricSession.states.space;
    this._deferSkip();
  }

  moveSelectionLeft() {
    this.state = editLyricSession.states.backSpace;
    this._deferSkip();
  }

	evKey(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");

    if (suiController.keyboardWidget) {
     Qwerty.handleKeyEvent(event);
    }

    var isSkip = this.parser === SmoLyric.parsers.lyric ?
        ['Space', 'Minus'].indexOf(event.code) >= 0 : ['Space'].indexOf(event.code) >= 0;

		if (isSkip) {
      if (editLyricSession.states.minus && event.shiftKey) {
          // allow underscore
      } else {
        this.state =  (event.code == 'Minus') ? editLyricSession.states.minus :  editLyricSession.states.space;
        this.state = (this.state === editLyricSession.states.space && event.shiftKey)
		     ? editLyricSession.states.backSpace :  this.state;
        layoutDebug.addTextDebug('editLyricSession:  handleKeydown skip key for  '+this.selection.note.attrs.id);
        this.editor.endSession();
        return;
      }
		}

		if (event.code == 'Escape') {
      this.state = editLyricSession.states.stopping;
      this.editor.endSession();
      return;
		}
    layoutDebug.addTextDebug('editLyricSession:  handleKeydown pass on event for  '+this.selection.note.attrs.id);
    this.selection.measure.changed=true;
	}

  bindEvents() {
		var self = this;

		if (!this.bound) {
      this.keydownHandler = this.eventSource.bindKeydownHandler(this,'evKey');
			this.bound = true;
		}
	}
}

// ## editNoteText
// Manage editing text for a note, and navigating, adding and removing.
class noteTextEditSession {
  constructor(changeNotifier,tracker,verse,selection,eventSource,parser) {
    this.notifier = changeNotifier;
    this.tracker = tracker;
    this.verse = verse;
    this.selection = selection;
    this.eventSource = eventSource;
    this.parser = parser;
  }

  get isRunning() {
    return !(this.editor === null || (
      this.editor.state === editLyricSession.states.stopped ||
      this.editor.state === editLyricSession.states.stopping ));
  }

  notifySelectionChanged(selection) {
    if (selection) {
        layoutDebug.addTextDebug('SuiLyricEditComponent: lyric notification for ' + selection.note.attrs.id);
    } else {
        layoutDebug.addTextDebug('SuiLyricEditComponent: no selection');
    }
    if (this.selection == null || SmoSelector.neq(selection.selector,this.selection.selector)) {
        this.selection = selection;
        this.notifier.notifySelectionChanged();
    }
  }

  removeText() {
      this.editor.removeLyric();
  }

  moveSelectionRight() {
    this.editor.moveSelectionRight();
  }

  moveSelectionLeft() {
    this.editor.moveSelectionLeft();
  }

  setYOffset(y) {
    if (this.editor && this.editor.lyric) {
      this.editor.lyric.translateY = y;
    }
  }

  getYOffset() {
    if (this.editor && this.editor.lyric) {
      return this.editor.lyric.translateY;
    }
    return 0;
  }

  toggleSessionStateEvent() {
    if (this.editor.state == editLyricSession.states.stopped ||
        this.editor.state == editLyricSession.states.stopping)  {
        layoutDebug.addTextDebug('SuiLyricEditComponent: restarting button');
        this.startEditingSession();
    } else {
        layoutDebug.addTextDebug('SuiLyricEditComponent: stopping editor button');
        this.forceEndSessionEvent();
    }
  }

  // Inform client that the edit session is complete
  detachCompleteEvent() {
    this.notifier.notifySelectionChanged();
  }

  startEditingSession() {
    layoutDebug.addTextDebug('SuiLyricEditComponent: initial create editor request');
    this.editor = new editLyricSession(
      {
        tracker:this.tracker,
        verse:this.verse,
        selection:this.tracker.selections[0],
        completeNotifier:this.completeNotifier,
        notifier:this,
        eventSource:this.eventSource,
        parser:this.parser
      }
    );
    this.editor.editNote();
  }
  forceEndSessionEvent() {
    this.editor.detach();
  }
}
