// The heirarchy of text editing objects goes:
// dialog -> component -> session -> editor
//
// Editors and Sessions are defined in this module.
// ### editor
//  handles low-level events and renders the preview using one
// of the text layout objects.
//
// ### session
// creates and destroys editors, e.g. for lyrics that have a Different
// editor instance for each note.
//
// ## SuiTextEditor
// Next-gen text editor.  The base text editor handles the positioning and inserting
// of text blocks into the text area.  The derived class shoud interpret key events.
// A container class will manage the session for starting/stopping the editor
// and retrieving the results into the target object.
// eslint-disable-next-line no-unused-vars
class SuiTextEditor {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  // parsers use this convention to represent text types (superscript)
  static textTypeToChar(textType) {
    if (textType === SuiInlineText.textTypes.superScript) {
      return '^';
    }
    if (textType === SuiInlineText.textTypes.subScript) {
      return '%';
    }
    return '';
  }

  static textTypeFromChar(char) {
    if (char === '^') {
      return SuiInlineText.textTypes.superScript;
    }
    if (char === '%') {
      return SuiInlineText.textTypes.subScript;
    }
    return SuiInlineText.textTypes.normal;
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
      suggestionIndex: -1,
      textType: SuiInlineText.textTypes.normal
    };
  }
  constructor(params) {
    Vex.Merge(this, SuiTextEditor.defaults);
    Vex.Merge(this, params);
    if (typeof(params.scroller) !== 'object') {
      throw 'bad scroller in ctor of SuiTextEditor';
    }
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
      }, 'text-highlight': {
        'stroke': '#dd9',
        'stroke-width': 1,
        'stroke-dasharray': '4,1',
        'fill': 'none'
      }, 'text-drag': {
        'stroke': '#d99',
        'stroke-width': 1,
        'stroke-dasharray': '2,1',
        'fill': '#eee',
        'opacity': '0.3'
      }
    };
  }

  // ### _suggestionParameters
  // Create the svg text outline parameters
  _suggestionParameters(box, strokeName) {
    const outlineStroke = SuiTextEditor.strokes[strokeName];
    return {
      context: this.context, box, classes: strokeName,
      outlineStroke, scroller: this.scroller
    };
  }

  // ### _expandSelectionToSuggestion
  // Expand the selection to include the character the user clicked on.
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
      this.selectionLength = (this.suggestionIndex - this.selectionStart) + 1;
    }
    this._updateSelections();
  }

  // ### _setSelectionToSugggestion
  // Set the selection to the character the user clicked on.
  _setSelectionToSugggestion() {
    this.selectionStart = this.suggestionIndex;
    this.selectionLength = 1;
    this.suggestionIndex = -1;
    this._updateSelections();
  }

  // ### handleMouseEvent
  // Handle hover/click behavior for the text under edit.
  // Returns: true if the event was handled here
  handleMouseEvent(ev) {
    let handled = false;
    var blocks = this.svgText.getIntersectingBlocks({
      x: ev.clientX,
      y: ev.clientY
    }, this.scroller.scrollState);

    // The mouse is not over the text
    if (!blocks.length) {
      svgHelpers.eraseOutline(this.context, 'text-suggestion');

      // If the user clicks and there was a previous selection, treat it as selected
      if (ev.type === 'click' && this.suggestionIndex >= 0) {
        if (ev.shiftKey) {
          this._expandSelectionToSuggestion();
        } else {
          this._setSelectionToSugggestion();
        }
        handled = true;
        this.svgText.render();
      }
      return handled;
    }
    handled = true;
    // outline the text that is hovered.  Since mouse is a point
    // there should only be 1
    blocks.forEach((block) => {
      svgHelpers.outlineRect(this._suggestionParameters(block.box, 'text-suggestion'));
      this.suggestionIndex = block.index;
    });
    // if the user clicked on it, add it to the selection.
    if (ev.type === 'click') {
      svgHelpers.eraseOutline(this.context, 'text-suggestion');
      if (ev.shiftKey) {
        this._expandSelectionToSuggestion();
      } else {
        this._setSelectionToSugggestion();
      }
      const npos = this.selectionStart + this.selectionLength;
      if (npos >= 0 && npos <= this.svgText.blocks.length) {
        this.textPos = npos;
      }
      this.svgText.render();
    }
    return handled;
  }

  // ### _serviceCursor
  // Flash the cursor as a background task
  _serviceCursor() {
    if (this.cursorState) {
      this.svgText.renderCursorAt(this.textPos - 1, this.textType);
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
    return PromiseHelpers.makePromise(this, '_endCursorCondition', '_cursorPreResolve', '_cursorPoll', 333);
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
      this.svgText.setHighlight(block, val);
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
    let i = 0;
    const blockPos = this.selectionStart;
    for (i = 0; i < this.selectionLength; ++i) {
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
    let i = 0;
    this.svgText = new SuiInlineText({ context: this.context, startX: this.x, startY: this.y,
      fontFamily: this.fontFamily, fontSize: this.fontSize, fontWeight: this.fontWeight, scroller: this.scroller });
    for (i = 0; i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i, { text: this.text[i] });
      this.empty = false;
    }
    this.textPos = this.text.length;
    this.state = SuiTextEditor.States.RUNNING;
    this.svgText.render();
  }
  // ### evKey
  // Handle key events that filter down to the editor
  evKey(evdata) {
    if (evdata.code === 'ArrowRight') {
      if (evdata.shiftKey) {
        this.growSelectionRight();
      } else {
        this.moveCursorRight();
      }
      this.svgText.render();
      return true;
    }
    if (evdata.code === 'ArrowLeft') {
      if (evdata.shiftKey) {
        this.growSelectionLeft();
      } else {
        this.moveCursorLeft();
      }
      this.svgText.render();
      return true;
    }
    if (evdata.code === 'Backspace') {
      if (this.selectionStart >= 0) {
        this.deleteSelections();
      } else {
        if (this.textPos > 0) {
          this.selectionStart = this.textPos - 1;
          this.selectionLength = 1;
          this.deleteSelections();
        }
      }
      this.svgText.render();
      return true;
    }
    if (evdata.code === 'Delete') {
      if (this.selectionStart >= 0) {
        this.deleteSelections();
      } else {
        if (this.textPos > 0 && this.textPos < this.svgText.blocks.length) {
          this.selectionStart = this.textPos;
          this.selectionLength = 1;
          this.deleteSelections();
        }
      }
      this.svgText.render();
      return true;
    }
    if (evdata.key.charCodeAt(0) >= 33 && evdata.key.charCodeAt(0) <= 126  && evdata.key.length === 1) {
      if (this.empty) {
        this.svgText.removeBlockAt(0);
        this.empty = false;
        this.svgText.addTextBlockAt(0, { text: evdata.key });
        this.setTextPos(1);
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelections();
        }
        this.svgText.addTextBlockAt(this.textPos, { text: evdata.key, textType: this.textType });
        this.setTextPos(this.textPos + 1);
      }
      this.svgText.render();
      return true;
    }
    return false;
  }
}
// eslint-disable-next-line no-unused-vars
class SuiTextBlockEditor extends SuiTextEditor {
  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params) {
    super(params);
    this.parseBlocks();
  }

  _highlightEditor() {
    if (this.svgText.blocks.length === 0) {
      return;
    }
    const bbox = this.svgText.getLogicalBox();
    const outlineStroke = SuiTextEditor.strokes['text-highlight'];
    const obj = {
      context: this.context, box: bbox, classes: 'text-highlight',
      outlineStroke, scroller: this.scroller
    };
    svgHelpers.outlineLogicalRect(obj);
  }

  getText() {
    return this.svgText.getText();
  }

  evKey(evdata) {
    if (evdata.key.charCodeAt(0) === 32) {
      if (this.empty) {
        this.svgText.removeBlockAt(0);
        this.empty = false;
        this.svgText.addTextBlockAt(0, { text: ' ' });
        this.setTextPos(1);
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelections();
        }
        this.svgText.addTextBlockAt(this.textPos, { text: ' ', textType: this.textType });
        this.setTextPos(this.textPos + 1);
      }
      this.svgText.render();
      return true;
    }
    const rv = super.evKey(evdata);
    this._highlightEditor();
    return rv;
  }

  stopEditor() {
    this.state = SuiTextEditor.States.STOPPING;
    $(this.context.svg).find('g.vf-text-highlight').remove();
    this.stopCursor();
    this.svgText.unrender();
  }
}

// eslint-disable-next-line no-unused-vars
class SuiLyricEditor extends SuiTextEditor {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4 };
  }
  parseBlocks() {
    let i = 0;
    this.svgText = new SuiInlineText({ context: this.context, startX: this.x, startY: this.y, scroller: this.scroller });
    for (i = 0; i < this.text.length; ++i) {
      this.svgText.addTextBlockAt(i, { text: this.text[i] });
      this.empty = false;
    }
    this.textPos = this.text.length;
    this.state = SuiTextEditor.States.RUNNING;
    this.svgText.render();
  }

  getText() {
    return this.svgText.getText();
  }

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params) {
    super(params);
    this.text = params.lyric.getText();
    if (params.lyric.isHyphenated()) {
      this.text += '-';
    }
    this.lyric = params.lyric;
    this.parseBlocks();
  }

  stopEditor() {
    this.state = SuiTextEditor.States.STOPPING;
    this.stopCursor();
    this.svgText.unrender();
  }
}

// eslint-disable-next-line no-unused-vars
class SuiChordEditor extends SuiTextEditor {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4 };
  }
  static get SymbolModifiers() {
    return {
      NONE: 1,
      SUBSCRIPT: 2,
      SUPERSCRIPT: 3
    };
  }

  // ### toTextTypeChar
  // Given an old text type and a desited new text type,
  // return what the new text type character should be
  static toTextTypeChar(oldTextType, newTextType) {
    const tt = SuiInlineText.getTextTypeResult(oldTextType, newTextType);
    return SuiTextEditor.textTypeToChar(tt);
  }

  static toTextTypeTransition(oldTextType, result) {
    const tt = SuiInlineText.getTextTypeTransition(oldTextType, result);
    return SuiTextEditor.textTypeToChar(tt);
  }

  setTextType(textType) {
    this.textType = textType;
  }

  // Handle the case where user changed super/subscript in the middle of the
  // string.
  _updateSymbolModifiers() {
    let change = this.textPos;
    let render = false;
    let i = 0;
    for (i = this.textPos; i < this.svgText.blocks.length; ++i) {
      const block = this.svgText.blocks[i];
      if (block.textType !== this.textType &&
        block.textType !== change) {
        change = block.textType;
        block.textType = this.textType;
        render = true;
      } else {
        break;
      }
    }
    if (render) {
      this.svgText.render();
    }
  }
  _setSymbolModifier(char) {
    if (['^', '%'].indexOf(char) < 0) {
      return false;
    }
    const currentTextType = this.textType;
    const transitionType = SuiTextEditor.textTypeFromChar(char);
    this.textType = SuiInlineText.getTextTypeResult(currentTextType, transitionType);
    this._updateSymbolModifiers();
    return true;
  }

  parseBlocks() {
    let readGlyph = false;
    let curGlyph = '';
    let blockIx = 0; // so we skip modifier characters
    let i = 0;
    this.svgText = new SuiInlineText({ context: this.context, startX: this.x, startY: this.y, scroller: this.scroller });

    for (i = 0; i < this.text.length; ++i) {
      const char = this.text[i];
      const isSymbolModifier = this._setSymbolModifier(char);
      if (char === '@') {
        if (!readGlyph) {
          readGlyph = true;
          curGlyph = '';
        } else {
          this._addGlyphAt(blockIx, curGlyph);
          blockIx += 1;
          readGlyph = false;
        }
      } else if (!isSymbolModifier) {
        if (readGlyph) {
          curGlyph = curGlyph + char;
        } else {
          this.svgText.addTextBlockAt(blockIx, { text: char, textType: this.textType });
          blockIx += 1;
        }
      }
      this.empty = false;
    }
    this.textPos = blockIx;
    this.state = SuiTextEditor.States.RUNNING;
    this.svgText.render();
  }

  // ### getText
  // Get the text value that we persist
  getText() {
    if (this.svgText.blocks < 1) {
      return '';
    }
    let text = '';
    let textType = this.svgText.blocks[0].textType;
    this.svgText.blocks.forEach((block) => {
      if (block.textType !== textType) {
        text += SuiChordEditor.toTextTypeTransition(textType, block.textType);
        textType = block.textType;
      }
      if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
        text += '@' + block.glyphCode + '@';
      } else {
        text += block.text;
      }
    });
    return text;
  }

  _addGlyphAt(ix, code) {
    if (this.selectionStart >= 0) {
      this.deleteSelections();
    }
    this.svgText.addGlyphBlockAt(ix, { glyphCode: code, textType: this.textType });
    this.textPos += 1;
  }

  evKey(evdata) {
    let edited = false;
    if (this._setSymbolModifier(evdata.key)) {
      return true;
    }
    // Dialog gives us a specific glyph code
    if (evdata.key[0] === '@' && evdata.key.length > 2) {
      const glyph = evdata.key.substr(1, evdata.key.length - 2);
      this._addGlyphAt(this.textPos, glyph);
      this.svgText.render();
      edited  = true;
    } else if (VF.ChordSymbol.glyphs[evdata.key[0]]) { // glyph shortcut like 'b'
      this._addGlyphAt(this.textPos, VF.ChordSymbol.glyphs[evdata.key[0]].code);
      this.svgText.render();
      edited = true;
    } else {
      // some ordinary key
      edited = super.evKey(evdata);
    }
    if (this.svgText.blocks.length > this.textPos && this.textPos >= 0) {
      this.textType = this.svgText.blocks[this.textPos].textType;
    }
    return edited;
  }

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params) {
    super(params);
    this.text = params.lyric._text;
    this.lyric = params.lyric;
    this.textType = SuiInlineText.textTypes.normal;
    this.parseBlocks();
  }

  stopEditor() {
    this.state = SuiTextEditor.States.STOPPING;
    this.stopCursor();
    this.svgText.unrender();
  }

  // ### _markStopped
  // Indicate this editor session is done running
  _markStopped() {
    this.state = SuiTextEditor.States.STOPPED;
  }
}

// eslint-disable-next-line no-unused-vars
class SuiDragSession {
  constructor(params) {
    this.textGroup = params.textGroup;
    this.context = params.context;
    this.scroller = params.scroller;
    this.xOffset = 0;
    this.yOffset = 0;
    this.textObject = SuiTextBlock.fromTextGroup(this.textGroup, this.context, this.scroller); // SuiTextBlock
    this.dragging = false;
    this.startBox = this.textObject.getLogicalBox();
    this.startBox.y += this.textObject.maxFontHeight(1);
    this.currentBox = svgHelpers.smoBox(this.startBox);
    this.currentClientBox = svgHelpers.logicalToClient(this.context.svg, this.currentBox, this.scroller);
  }

  _outlineBox() {
    const outlineStroke = SuiTextEditor.strokes['text-drag'];
    const obj = {
      context: this.context, box: this.currentBox, classes: 'text-drag',
      outlineStroke, scroller: this.scroller
    };
    svgHelpers.outlineLogicalRect(obj);
  }

  startDrag(e) {
    if (!svgHelpers.containsPoint(this.currentClientBox, { x: e.clientX, y: e.clientY }, this.scroller.scrollState)) {
      return;
    }
    this.dragging = true;
    // calculate offset of mouse start vs. box UL
    this.yOffset = this.currentClientBox.y - e.clientY;
    this.xOffset = this.currentClientBox.x - e.clientX;
    this._outlineBox();
  }

  mouseMove(e) {
    if (!this.dragging) {
      return;
    }
    const svgX = this.currentBox.x;
    const svgY = this.currentBox.y;
    this.currentClientBox.x = e.clientX - this.xOffset;
    this.currentClientBox.y = e.clientY - this.yOffset;
    const coor = svgHelpers.clientToLogical(this.context.svg, { x: this.currentClientBox.x, y: this.currentClientBox.y });
    this.currentBox.x = coor.x;
    this.currentBox.y = coor.y;
    this.textObject.offsetStartX(this.currentBox.x - svgX);
    this.textObject.offsetStartY(this.currentBox.y - svgY);
    this.textObject.render();
    this._outlineBox();
  }
  get deltaX() {
    return this.currentBox.x - this.startBox.x;
  }
  get deltaY() {
    return this.currentBox.y - this.startBox.y;
  }

  endDrag() {
    svgHelpers.eraseOutline(this.context, 'text-drag');
    this.textObject.render();
    this.textGroup.offsetX(this.deltaX);
    this.textGroup.offsetY(this.deltaY);
    this.dragging = false;
  }
}

// ## SuiTextSession
// session for editing plain text
// eslint-disable-next-line no-unused-vars
class SuiTextSession {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  constructor(params) {
    this.scroller = params.scroller;
    this.renderer = params.renderer;
    this.scoreText = params.scoreText;
    this.text = params.text ? params.text : '';
    this.x = params.x;
    this.y = params.y;
    this.textGroup = params.textGroup;
    this.scoreText = params.scoreText;

    // Create a text group if one was not a startup parameter
    if (!this.textGroup) {
      this.textGroup = new SmoTextGroup();
    }
    // Create a scoreText if one was not a startup parameter, or
    // get it from the text group
    if (!this.scoreText) {
      if (this.textGroup && this.textGroup.textBlocks.length) {
        this.scoreText = this.textGroup.textBlocks[0].text;
      } else {
        this.scoreText = new SmoScoreText({ x: this.x, y: this.y });
        this.textGroup.addScoreText(this.scoreText, null, SmoTextGroup.relativePositions.RIGHT);
      }
    }
    this.fontFamily = this.scoreText.fontInfo.family;
    this.fontWeight = this.scoreText.fontInfo.weight;
    this.fontSize = SmoScoreText.fontPointSize(this.scoreText.fontInfo.size);
    this.text = this.scoreText.text;
  }

  // ### _isRefreshed
  // renderer has partially rendered text(promise condition)
  get _isRefreshed() {
    return this.renderer.dirty === false;
  }

  get isStopped() {
    return this.state === SuiTextEditor.States.STOPPED;
  }

  get isRunning() {
    return this.state === SuiTextEditor.States.RUNNING;
  }

  _markStopped() {
    this.state = SuiTextEditor.States.STOPPED;
  }

  // ### _isRendered
  // renderer has rendered text(promise condition)
  get _isRendered() {
    return this.renderer.passState ===  SuiRenderState.passStates.clean;
  }

  _removeScoreText() {
    const selector = '#' + this.scoreText.attrs.id;
    $(selector).remove();
  }

  // ### _startSessionForNote
  // Start the lyric session
  startSession() {
    this.editor = new SuiTextBlockEditor({ renderer: this.renderer,
      x: this.x, y: this.y, scroller: this.scroller,
      fontFamily: this.fontFamily, fontSize: this.fontSize, fontWeight: this.fontWeight,
      text: this.scoreText.text, context: this.renderer.context });
    this.cursorPromise = this.editor.startCursorPromise();
    this.state = SuiTextEditor.States.RUNNING;
    this._removeScoreText();
  }

  // ### _startSessionForNote
  // Stop the lyric session, return promise for done
  stopSession() {
    if (this.editor) {
      this.scoreText.text = this.editor.getText();
      this.scoreText.tryParseUnicode(); // convert unicode chars
      this.editor.stopEditor();
    }
    return PromiseHelpers.makePromise(this, '_isRendered', '_markStopped', null, 100);
  }

  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata) {
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return false;
    }
    const rv = this.editor.evKey(evdata);
    if (rv) {
      this._removeScoreText();
    }
    return rv;
  }

  handleMouseEvent(ev) {
    if (this.isRunning) {
      this.editor.handleMouseEvent(ev);
    }
  }
}
// ## SuiLyricSession
// Manage editor for lyrics, jupmping from note to note if asked
// eslint-disable-next-line no-unused-vars
class SuiLyricSession {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  constructor(params) {
    this.score = params.score;
    this.renderer = params.renderer;
    this.scroller = params.scroller;
    this.view = params.view;
    this.parser = params.parser ? params.parser : SmoLyric.parsers.lyric;
    this.verse = params.verse;
    this.selector = params.selector;
    this.selection = SmoSelection.noteFromSelector(this.score, this.selector);
    this.note = this.selection.note;
    this.originalText = '';
  }

  // ### _setLyricForNote
  // Get the text from the editor and update the lyric with it.
  _setLyricForNote() {
    this.lyric = null;
    const lar = this.note.getLyricForVerse(this.verse, SmoLyric.parsers.lyric);
    if (lar.length) {
      this.lyric = lar[0];
    }
    if (!this.lyric) {
      const scoreFont = this.score.fonts.find((fn) => fn.name === 'lyrics');
      const fontInfo = JSON.parse(JSON.stringify(scoreFont));
      this.lyric = new SmoLyric({  _text: '', verse: this.verse, fontInfo });
    }
    this.text = this.lyric._text;
    this.originalText = this.text;
    // this.view.addOrUpdateLyric(this.selection.selector, this.lyric);
  }

  // ### _endLyricCondition
  // Lyric editor has stopped running (promise condition)
  get _endLyricCondition()  {
    return this.editor.state !== SuiTextEditor.States.RUNNING;
  }

  // ### _endLyricCondition
  // renderer has partially rendered text(promise condition)
  get _isRefreshed() {
    return this.renderer.dirty === false;
  }

  // ### _isRendered
  // renderer has rendered text(promise condition)
  get _isRendered() {
    return this.renderer.passState ===  SuiRenderState.passStates.clean;
  }

  get _pendingEditor() {
    return this.state !== SuiTextEditor.States.PENDING_EDITOR;
  }

  // ### _hideLyric
  // Hide the lyric so you only see the editor.
  _hideLyric() {
    if (this.lyric.selector) {
      $(this.lyric.selector).remove();
    }
  }

  get isStopped() {
    return this.state === SuiTextEditor.States.STOPPED;
  }

  get isRunning() {
    return this.state === SuiTextEditor.States.RUNNING;
  }

  // ### _markStopped
  // Indicate this editor session is done running
  _markStopped() {
    this.state = SuiTextEditor.States.STOPPED;
  }

  // ### _startSessionForNote
  // Start the lyric editor for a note (current selected note)
  _startSessionForNote() {
    this.lyric.skipRender = true;
    const lyricRendered = this.lyric._text.length > 0 && typeof(this.lyric.logicalBox) !== 'undefined';
    const startX = lyricRendered ? this.lyric.logicalBox.x : this.note.logicalBox.x;
    const startY = lyricRendered ? this.lyric.logicalBox.y + this.lyric.logicalBox.height :
      this.note.logicalBox.y + this.note.logicalBox.height;
    this.editor = new SuiLyricEditor({ context: this.view.renderer.context,
      lyric: this.lyric, x: startX, y: startY, scroller: this.scroller });
    this.state = SuiTextEditor.States.RUNNING;
    if (!lyricRendered) {
      const delta = 2 * this.editor.svgText.maxFontHeight(1.0) * (this.lyric.verse + 1);
      this.editor.svgText.offsetStartY(delta);
    }
    this.cursorPromise = this.editor.startCursorPromise();
    this._hideLyric();
  }

  // ### _startSessionForNote
  // Start the lyric session
  startSession() {
    this._setLyricForNote();
    this._startSessionForNote();
    this.state = SuiTextEditor.States.RUNNING;
  }

  // ### _startSessionForNote
  // Stop the lyric session, return promise for done
  stopSession() {
    if (this.editor && !this._endLyricCondition) {
      this._updateLyricFromEditor();
      this.editor.stopEditor();
    }
    return PromiseHelpers.makePromise(this, '_isRendered', '_markStopped', null, 100);
  }

  // ### _advanceSelection
  // Based on a skip character, move the editor forward/back one note.
  _advanceSelection(isShift) {
    const nextSelection = isShift ? SmoSelection.lastNoteSelectionFromSelector(this.score, this.selector)
      : SmoSelection.nextNoteSelectionFromSelector(this.score, this.selector);
    if (nextSelection) {
      this.selector = nextSelection.selector;
      this.selection = nextSelection;
      this.note = nextSelection.note;
      this._setLyricForNote();
      const conditionArray = [];
      this.state = SuiTextEditor.States.PENDING_EDITOR;
      conditionArray.push(PromiseHelpers.makePromiseObj(this, '_endLyricCondition', null, null, 100));
      conditionArray.push(PromiseHelpers.makePromiseObj(this, '_isRefreshed', '_startSessionForNote', null, 100));
      PromiseHelpers.promiseChainThen(conditionArray);
    }
  }

  // ### advanceSelection
  // external interfoace to move to next/last note
  advanceSelection(isShift) {
    if (this.isRunning) {
      this._updateLyricFromEditor();
      this._advanceSelection(isShift);
    }
  }

  removeLyric() {
    if (this.selection && this.lyric) {
      this.view.removeLyric(this.selection.selector, this.lyric);
      this.lyric.deleted = true;
      this.lyric.skipRender = true;
      this.advanceSelection();
    }
  }

  // ### _updateLyricFromEditor
  // The editor is done running, so update the lyric now.
  _updateLyricFromEditor() {
    const txt = this.editor.getText();
    this.lyric.setText(txt);
    this.lyric.skipRender = false;
    this.editor.stopEditor();
    if (!this.lyric.deleted && this.originalText !== txt) {
      this.view.addOrUpdateLyric(this.selection.selector, this.lyric);
    }
  }
  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata) {
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return;
    }
    if (evdata.key === '-' || evdata.key === ' ') {
      // skip
      const back = evdata.shiftKey && evdata.key === ' ';
      if (evdata.key === '-') {
        this.editor.evKey(evdata);
      }
      this._updateLyricFromEditor();
      this._advanceSelection(back);
    } else {
      this.editor.evKey(evdata);
      this._hideLyric();
    }
  }

  // ### handleMouseEvent
  // Mouse event (send to editor)
  handleMouseEvent(ev) {
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return;
    }
    this.editor.handleMouseEvent(ev);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiChordSession extends SuiLyricSession {
  constructor(params) {
    super(params);
    this.parser = SmoLyric.parsers.chord;
  }
  get textType() {
    if (this.isRunning) {
      return this.editor.textType;
    }
    return SuiInlineText.textTypes.normal;
  }

  set textType(type) {
    this.editor.setTextType(type);
  }

  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata) {
    let edited = false;
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return false;
    }
    if (evdata.code === 'Enter') {
      this._updateLyricFromEditor();
      this._advanceSelection(evdata.shiftKey);
      edited = true;
    } else {
      edited = this.editor.evKey(evdata);
    }
    this._hideLyric();
    return edited;
  }

  // ### _setLyricForNote
  // Get the text from the editor and update the lyric with it.
  _setLyricForNote() {
    this.lyric = null;
    const lar = this.note.getLyricForVerse(this.verse, this.parser);
    if (lar.length) {
      this.lyric = lar[0];
    }
    if (!this.lyric) {
      const scoreFont = this.score.fonts.find((fn) => fn.name === 'chords');
      const fontInfo = JSON.parse(JSON.stringify(scoreFont));
      this.lyric = new SmoLyric({ _text: '', verse: this.verse, parser: this.parser, fontInfo });
      this.note.addLyric(this.lyric);
    }
    this.text = this.lyric._text;
  }
  // ### _startSessionForNote
  // Start the lyric editor for a note (current selected note)
  _startSessionForNote() {
    const lyricRendered = this.lyric._text.length && this.lyric.logicalBox;
    const startX = lyricRendered ? this.lyric.logicalBox.x : this.note.logicalBox.x;
    const startY = lyricRendered ? this.lyric.logicalBox.y + this.lyric.adjY + this.lyric.logicalBox.height :
      this.selection.measure.logicalBox.y + this.selection.measure.logicalBox.height - 70;
    this.editor = new SuiChordEditor({ context: this.view.renderer.context,
      lyric: this.lyric, x: startX, y: startY, scroller: this.scroller });
    this.state = SuiTextEditor.States.RUNNING;
    if (!lyricRendered) {
      const delta = (-1) * this.editor.svgText.maxFontHeight(1.0) * (this.lyric.verse + 1);
      this.editor.svgText.offsetStartY(delta);
    }
    this.cursorPromise = this.editor.startCursorPromise();
    this._hideLyric();
  }
}
