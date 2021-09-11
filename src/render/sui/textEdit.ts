// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiInlineText, SuiTextBlock } from './textRender';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { OutlineInfo, StrokeInfo, svgHelpers } from '../../common/svgHelpers';
import { SmoScoreText, SmoTextGroup } from '../../smo/data/scoreModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiRenderState } from './renderState';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiScroller } from './scroller';
import { SvgBox } from '../../smo/data/common';
import { KeyEvent } from './tracker';
import { SmoNote } from '../../smo/data/note';
import { SmoScore } from '../../smo/data/score';

const VF = eval('Vex.Flow');
declare var $: any;

export interface SuiTextEditorParams {
  context: any,
  scroller: SuiScroller,
  x: number,
  y: number,
  text: string
}

export interface SuiDragSessionParams {
  context: any;
  scroller: SuiScroller;
  xOffset: number;
  yOffset: number;
  textObject: SuiTextBlock;
  dragging: boolean;
  startBox: SvgBox;
  currentBox: SvgBox;
  currentClientBox: SvgBox;
  textGroup: SmoTextGroup;
}

export interface SuiLyricEditorParams extends SuiTextEditorParams {
  lyric: SmoLyric
}

export interface SuiTextSessionParams {
  scroller: SuiScroller;
  renderer: any;
  scoreText: SmoScoreText;
  text: string;
  x: number;
  y: number;
  textGroup: SmoTextGroup;
}

export interface SuiLyricSessionParams {
  score: SmoScore;
  renderer: SuiRenderState;
  scroller: SuiScroller;
  view: any;
  parser: number;
  verse: number;
  selector: SmoSelector;
  selection: SmoSelection;
  note: SmoNote;
  originalText: string;
}
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

export class SuiTextEditor {
  static get States(): Record<string, number> {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  // parsers use this convention to represent text types (superscript)
  static textTypeToChar(textType: number): string {
    if (textType === SuiInlineText.textTypes.superScript) {
      return '^';
    }
    if (textType === SuiInlineText.textTypes.subScript) {
      return '%';
    }
    return '';
  }

  static textTypeFromChar(char: string): number {
    if (char === '^') {
      return SuiInlineText.textTypes.superScript;
    }
    if (char === '%') {
      return SuiInlineText.textTypes.subScript;
    }
    return SuiInlineText.textTypes.normal;
  }

  svgText: SuiInlineText | null = null;
  context: any;
  x: number = 0;
  y: number = 0;
  text: string;
  textPos: number = 0;
  selectionStart: number = -1;
  selectionLength: number = -1;
  empty: boolean = true;
  scroller: SuiScroller;
  suggestionIndex: number = -1;
  cursorState: boolean = false;
  cursorRunning: boolean = false;
  textType: number = SuiInlineText.textTypes.normal;
  fontWeight: string = 'normal';
  fontFamily: string = 'Merriweather';
  fontSize: number = 14;
  state: number = SuiTextEditor.States.RUNNING;
  constructor(params: SuiTextEditorParams) {
    this.scroller = params.scroller;
    this.context = params.context;
    this.x = params.x;
    this.y = params.y;
    this.text = params.text;
  }

  static get strokes(): Record<string, StrokeInfo> {
    return {
      'text-suggestion': {
        stroke: '#cce',
        strokeWidth: 1,
        strokeDasharray: '4,1',
        fill: 'none',
        opacity: 1.0
      },
      'text-selection': {
        stroke: '#99d',
        strokeWidth: 1,
        fill: 'none',
        strokeDasharray: '',
        opacity: 1.0
      }, 'text-highlight': {
        stroke: '#dd9',
        strokeWidth: 1,
        strokeDasharray: '4,1',
        fill: 'none',
        opacity: 1.0
      }, 'text-drag': {
        stroke: '#d99',
        strokeWidth: 1,
        strokeDasharray: '2,1',
        fill: '#eee',
        opacity: 0.3
      }
    };
  }

  // ### _suggestionParameters
  // Create the svg text outline parameters
  _suggestionParameters(box: SvgBox, strokeName: string): OutlineInfo {
    const outlineStroke = SuiTextEditor.strokes[strokeName];
    return {
      context: this.context, box, classes: strokeName,
      stroke: outlineStroke, scroll: this.scroller.scrollState.scroll,
      clientCoordinates: false
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
    } else if (this.selectionStart > this.suggestionIndex) {
      const oldStart = this.selectionStart;
      this.selectionStart = this.suggestionIndex;
      this.selectionLength = (oldStart - this.selectionStart) + this.selectionLength;
    } else if (this.selectionStart < this.suggestionIndex
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
  handleMouseEvent(ev: any): boolean {
    let handled = false;
    if (this.svgText === null) {
      return false;
    }
    var blocks = this.svgText.getIntersectingBlocks(svgHelpers.smoBox({
      x: ev.clientX,
      y: ev.clientY
    }), svgHelpers.smoBox(this.scroller.scrollState.scroll));

    // The mouse is not over the text
    if (!blocks.length) {
      svgHelpers.eraseOutline(this.context.svg, 'text-suggestion');

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
      svgHelpers.eraseOutline(this.context.svg, 'text-suggestion');
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
      this.svgText?.renderCursorAt(this.textPos - 1, this.textType);
    } else {
      this.svgText?.removeCursor();
    }
    this.cursorState = !this.cursorState;
  }
  // ### _refreshCursor
  // If the text position changes, update the cursor position right away
  // don't wait for blink.
  _refreshCursor() {
    this.svgText?.removeCursor();
    this.cursorState = true;
    this._serviceCursor();
  }

  get _endCursorCondition(): boolean {
    return this.cursorRunning === false;
  }

  _cursorPreResolve() {
    this.svgText?.removeCursor();
  }

  _cursorPoll() {
    this._serviceCursor();
  }

  // ### startCursorPromise
  // Used by the calling logic to start the cursor.
  // returns a promise that can be pended when the editing ends.
  startCursorPromise(): Promise<any> {
    var self = this;
    this.cursorRunning = true;
    this.cursorState = true;
    self.svgText?.renderCursorAt(this.textPos, SuiInlineText.textTypes.normal);
    return PromiseHelpers.makePromise(this, '_endCursorCondition', '_cursorPreResolve', '_cursorPoll', 333);
  }
  stopCursor() {
    this.cursorRunning = false;
  }

  // ### setTextPos
  // Set the text position within the editor space and update the cursor
  setTextPos(val: number) {
    this.textPos = val;
    this._refreshCursor();
  }
  // ### moveCursorRight
  // move cursor right within the block of text.
  moveCursorRight() {
    if (this.svgText === null) {
      return;
    }
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
    const start = this.selectionStart;
    this.svgText?.blocks.forEach((block) => {
      const val = start >= 0 && i >= start && i < end;
      this.svgText!.setHighlight(block, val);
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
    if (this.svgText === null) {
      return;
    }
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
      this.svgText?.removeBlockAt(blockPos); // delete shifts blocks so keep index the same.
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
    this.svgText = new SuiInlineText({
      context: this.context, startX: this.x, startY: this.y,
      fontFamily: this.fontFamily, fontSize: this.fontSize, fontWeight: this.fontWeight, scroller: this.scroller,
      fontStyle: 'normal'
    });
    for (i = 0; i < this.text.length; ++i) {
      const def = SuiInlineText.blockDefaults;
      def.text = this.text[i]
      this.svgText.addTextBlockAt(i, def);
      this.empty = false;
    }
    this.textPos = this.text.length;
    this.state = SuiTextEditor.States.RUNNING;
    this.svgText.render();
  }
  // ### evKey
  // Handle key events that filter down to the editor
  evKey(evdata: KeyEvent): boolean {
    if (evdata.code === 'ArrowRight') {
      if (evdata.shiftKey) {
        this.growSelectionRight();
      } else {
        this.moveCursorRight();
      }
      this.svgText?.render();
      return true;
    }
    if (evdata.code === 'ArrowLeft') {
      if (evdata.shiftKey) {
        this.growSelectionLeft();
      } else {
        this.moveCursorLeft();
      }
      this.svgText?.render();
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
      this.svgText?.render();
      return true;
    }
    if (evdata.code === 'Delete') {
      if (this.selectionStart >= 0) {
        this.deleteSelections();
      } else {
        if (this.textPos > 0 && this.svgText !== null && this.textPos < this.svgText.blocks.length) {
          this.selectionStart = this.textPos;
          this.selectionLength = 1;
          this.deleteSelections();
        }
      }
      this.svgText?.render();
      return true;
    }
    if (evdata.key.charCodeAt(0) >= 33 && evdata.key.charCodeAt(0) <= 126 && evdata.key.length === 1) {
      if (this.empty) {
        this.svgText?.removeBlockAt(0);
        this.empty = false;
        const def = SuiInlineText.blockDefaults;
        def.text = evdata.key;
        this.svgText?.addTextBlockAt(0, def);
        this.setTextPos(1);
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelections();
        }
        const def = SuiInlineText.blockDefaults;
        def.text = evdata.key;
        def.textType = this.textType;
        this.svgText?.addTextBlockAt(this.textPos, def);
        this.setTextPos(this.textPos + 1);
      }
      this.svgText?.render();
      return true;
    }
    return false;
  }
}

export class SuiTextBlockEditor extends SuiTextEditor {
  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params: SuiTextEditorParams) {
    super(params);
    this.parseBlocks();
  }

  _highlightEditor() {
    if (this.svgText === null || this.svgText.blocks.length === 0) {
      return;
    }
    const bbox = this.svgText.getLogicalBox();
    const outlineStroke = SuiTextEditor.strokes['text-highlight'];
    const obj: OutlineInfo = {
      context: this.context, box: bbox, classes: 'text-highlight',
      stroke: outlineStroke, scroll: this.scroller.scrollState.scroll, clientCoordinates: false
    };
    svgHelpers.outlineLogicalRect(obj);
  }

  getText(): string {
    if (this.svgText !== null) {
      return this.svgText.getText();
    }
    return '';
  }

  evKey(evdata: KeyEvent): boolean {
    if (evdata.key.charCodeAt(0) === 32) {
      if (this.empty) {
        this.svgText?.removeBlockAt(0);
        this.empty = false;
        const def = SuiInlineText.blockDefaults;
        def.text = ' ';
        this.svgText?.addTextBlockAt(0, def);
        this.setTextPos(1);
      } else {
        if (this.selectionStart >= 0) {
          this.deleteSelections();
        }
        const def = SuiInlineText.blockDefaults;
        def.text = ' ';
        def.textType = this.textType;
        this.svgText?.addTextBlockAt(this.textPos, def);
        this.setTextPos(this.textPos + 1);
      }
      this.svgText?.render();
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
    this.svgText?.unrender();
  }
}

export class SuiLyricEditor extends SuiTextEditor {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4 };
  }
  parseBlocks() {
    let i = 0;
    const def = SuiInlineText.defaults;
    def.context = this.context;
    def.startX = this.x;
    def.startY = this.y;
    def.scroller = this.scroller;
    this.svgText = new SuiInlineText(def);
    for (i = 0; i < this.text.length; ++i) {
      const blockP = SuiInlineText.blockDefaults;
      blockP.text = this.text[i];
      this.svgText.addTextBlockAt(i, blockP);
      this.empty = false;
    }
    this.textPos = this.text.length;
    this.state = SuiTextEditor.States.RUNNING;
    this.svgText.render();
  }

  getText(): string {
    if (this.svgText !== null) {
      return this.svgText.getText();
    }
    return '';
  }
  lyric: SmoLyric;
  state: number = SuiTextEditor.States.PENDING_EDITOR;

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params: SuiLyricEditorParams) {
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
    if (this.svgText !== null) {
      this.svgText.unrender();
    }
  }
}

export class SuiChordEditor extends SuiTextEditor {
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
  static toTextTypeChar(oldTextType: number, newTextType: number): string {
    const tt = SuiInlineText.getTextTypeResult(oldTextType, newTextType);
    return SuiTextEditor.textTypeToChar(tt);
  }

  static toTextTypeTransition(oldTextType: number, result: number): string {
    const tt = SuiInlineText.getTextTypeTransition(oldTextType, result);
    return SuiTextEditor.textTypeToChar(tt);
  }

  setTextType(textType: number) {
    this.textType = textType;
  }

  // Handle the case where user changed super/subscript in the middle of the
  // string.
  _updateSymbolModifiers() {
    let change = this.textPos;
    let render = false;
    let i = 0;
    for (i = this.textPos; this.svgText !== null && i < this.svgText.blocks.length; ++i) {
      const block = this.svgText!.blocks[i];
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
      this.svgText?.render();
    }
  }
  _setSymbolModifier(char: string): boolean {
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
    const params = SuiInlineText.defaults;
    params.context = this.context;
    params.startX = this.x;
    params.startY = this.y;
    params.scroller = this.scroller;
    this.svgText = new SuiInlineText(params);

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
          const blockP = SuiInlineText.blockDefaults;
          blockP.text = char;
          blockP.textType = this.textType;
          this.svgText.addTextBlockAt(blockIx, blockP);
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
  getText(): string {
    if (this.svgText === null || this.svgText.blocks.length < 1) {
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

  _addGlyphAt(ix: number, code: string) {
    if (this.selectionStart >= 0) {
      this.deleteSelections();
    }
    const blockP = SuiInlineText.blockDefaults;
    blockP.glyphCode = code;
    blockP.textType = this.textType;
    this.svgText?.addGlyphBlockAt(ix, blockP);
    this.textPos += 1;
  }

  evKey(evdata: KeyEvent): boolean {
    let edited = false;
    if (this._setSymbolModifier(evdata.key)) {
      return true;
    }
    // Dialog gives us a specific glyph code
    if (evdata.key[0] === '@' && evdata.key.length > 2) {
      const glyph = evdata.key.substr(1, evdata.key.length - 2);
      this._addGlyphAt(this.textPos, glyph);
      this.svgText?.render();
      edited = true;
    } else if (VF.ChordSymbol.glyphs[evdata.key[0]]) { // glyph shortcut like 'b'
      this._addGlyphAt(this.textPos, VF.ChordSymbol.glyphs[evdata.key[0]].code);
      this.svgText?.render();
      edited = true;
    } else {
      // some ordinary key
      edited = super.evKey(evdata);
    }
    if (this.svgText !== null && this.svgText.blocks.length > this.textPos && this.textPos >= 0) {
      this.textType = this.svgText.blocks[this.textPos].textType;
    }
    return edited;
  }
  lyric: SmoLyric;

  // ### ctor
  // ### args
  // params: {lyric: SmoLyric,...}
  constructor(params: SuiLyricEditorParams) {
    super(params);
    this.text = params.lyric._text;
    this.lyric = params.lyric;
    this.textType = SuiInlineText.textTypes.normal;
    this.parseBlocks();
  }

  stopEditor() {
    this.state = SuiTextEditor.States.STOPPING;
    this.stopCursor();
    this.svgText?.unrender();
  }

  // ### _markStopped
  // Indicate this editor session is done running
  _markStopped() {
    this.state = SuiTextEditor.States.STOPPED;
  }
}
export class SuiDragSession {
  context: any;
  scroller: SuiScroller;
  xOffset: number = 0;
  yOffset: number = 0;
  textObject: SuiTextBlock;
  dragging: boolean = false;
  startBox: SvgBox;
  currentBox: SvgBox;
  currentClientBox: SvgBox;
  textGroup: SmoTextGroup;
  constructor(params: SuiDragSessionParams) {
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
    this.currentClientBox = svgHelpers.smoBox(svgHelpers.logicalToClient(this.context.svg, this.currentBox, this.scroller.scrollState.scroll));
  }

  _outlineBox() {
    const outlineStroke = SuiTextEditor.strokes['text-drag'];
    const obj: OutlineInfo = {
      context: this.context, box: this.currentBox, classes: 'text-drag',
      stroke: outlineStroke, scroll: this.scroller.scrollState.scroll,
      clientCoordinates: false
    };
    svgHelpers.outlineLogicalRect(obj);
  }

  startDrag(e: any) {
    if (!svgHelpers.containsPoint(this.currentClientBox, { x: e.clientX, y: e.clientY }, svgHelpers.smoBox(this.scroller.scrollState.scroll))) {
      return;
    }
    this.dragging = true;
    // calculate offset of mouse start vs. box UL
    this.yOffset = this.currentClientBox.y - e.clientY;
    this.xOffset = this.currentClientBox.x - e.clientX;
    this._outlineBox();
  }

  mouseMove(e: any) {
    if (!this.dragging) {
      return;
    }
    const svgX = this.currentBox.x;
    const svgY = this.currentBox.y;
    this.currentClientBox.x = e.clientX - this.xOffset;
    this.currentClientBox.y = e.clientY - this.yOffset;
    const coor = svgHelpers.clientToLogical(this.context.svg,
      {
        x: this.currentClientBox.x + + this.scroller.scrollState.scroll.x,
        y: this.currentClientBox.y + this.scroller.scrollState.scroll.y,
        width: 0, height: 0
      });
    this.currentBox.x = coor.x;
    this.currentBox.y = coor.y;
    this.textObject.offsetStartX(this.currentBox.x - svgX);
    this.textObject.offsetStartY(this.currentBox.y - svgY);
    this.textObject.render();
    svgHelpers.eraseOutline(this.context.svg, 'text-drag');
    this._outlineBox();
  }
  get deltaX(): number {
    return this.currentBox.x - this.startBox.x;
  }
  get deltaY(): number {
    return this.currentBox.y - this.startBox.y;
  }

  endDrag() {
    this.textObject.render();
    this.textGroup.offsetX(this.deltaX);
    this.textGroup.offsetY(this.deltaY);
    this.dragging = false;
    svgHelpers.eraseOutline(this.context.svg, 'text-drag');
  }
}

// ## SuiTextSession
// session for editing plain text
export class SuiTextSession {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  scroller: SuiScroller;
  scoreText: SmoScoreText;
  text: string;
  x: number;
  y: number;
  textGroup: SmoTextGroup;
  fontFamily: string = '';
  fontWeight: string = '';
  fontSize: number = 14;
  state: number = SuiTextEditor.States.PENDING_EDITOR;
  editor: SuiTextBlockEditor | null = null;
  renderer: SuiRenderState;
  cursorPromise: Promise<any> | null = null;
  constructor(params: SuiTextSessionParams) {
    this.scroller = params.scroller;
    this.renderer = params.renderer;
    this.scoreText = params.scoreText;
    this.text = this.scoreText.text;
    this.x = params.x;
    this.y = params.y;
    this.textGroup = params.textGroup;
    this.renderer = params.renderer;

    // Create a text group if one was not a startup parameter
    if (!this.textGroup) {
      this.textGroup = new SmoTextGroup(SmoTextGroup.defaults);
    }
    // Create a scoreText if one was not a startup parameter, or
    // get it from the text group
    if (!this.scoreText) {
      if (this.textGroup && this.textGroup.textBlocks.length) {
        this.scoreText = this.textGroup.textBlocks[0].text;
      } else {
        const stDef = SmoScoreText.defaults;
        stDef.x = this.x;
        stDef.y = this.y;
        this.scoreText = new SmoScoreText(stDef);
        this.textGroup.addScoreText(this.scoreText, SmoTextGroup.relativePositions.RIGHT);
      }
    }
    this.fontFamily = this.scoreText.fontInfo.family;
    this.fontWeight = this.scoreText.fontInfo.weight;
    this.fontSize = this.scoreText.fontInfo.size;
    this.text = this.scoreText.text;
  }

  // ### _isRefreshed
  // renderer has partially rendered text(promise condition)
  get _isRefreshed(): boolean {
    return this.renderer.dirty === false;
  }

  get isStopped(): boolean {
    return this.state === SuiTextEditor.States.STOPPED;
  }

  get isRunning(): boolean {
    return this.state === SuiTextEditor.States.RUNNING;
  }

  _markStopped() {
    this.state = SuiTextEditor.States.STOPPED;
  }

  // ### _isRendered
  // renderer has rendered text(promise condition)
  get _isRendered(): boolean {
    return this.renderer.passState === SuiRenderState.passStates.clean;
  }

  _removeScoreText() {
    const selector = '#' + this.scoreText.attrs.id;
    $(selector).remove();
  }

  // ### _startSessionForNote
  // Start the lyric session
  startSession() {
    this.editor = new SuiTextBlockEditor({
      x: this.x, y: this.y, scroller: this.scroller,
      context: this.renderer.context, text: this.scoreText.text
    });
    this.cursorPromise = this.editor.startCursorPromise();
    this.state = SuiTextEditor.States.RUNNING;
    this._removeScoreText();
  }

  // ### _startSessionForNote
  // Stop the lyric session, return promise for done
  stopSession(): Promise<any> {
    if (this.editor) {
      this.scoreText.text = this.editor.getText();
      this.scoreText.tryParseUnicode(); // convert unicode chars
      this.editor.stopEditor();
    }
    return PromiseHelpers.makePromise(this, '_isRendered', '_markStopped', null, 100);
  }

  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata: KeyEvent): boolean {
    if (this.state !== SuiTextEditor.States.RUNNING || this.editor === null) {
      return false;
    }
    const rv = this.editor.evKey(evdata);
    if (rv) {
      this._removeScoreText();
    }
    return rv;
  }

  handleMouseEvent(ev: any) {
    if (this.isRunning && this.editor !== null) {
      this.editor.handleMouseEvent(ev);
    }
  }
}
// ## SuiLyricSession
// Manage editor for lyrics, jupmping from note to note if asked
export class SuiLyricSession {
  static get States() {
    return { RUNNING: 1, STOPPING: 2, STOPPED: 4, PENDING_EDITOR: 8 };
  }
  score: SmoScore;
  renderer: SuiRenderState;
  scroller: SuiScroller;
  view: any;
  parser: number;
  verse: number;
  selector: SmoSelector;
  selection: SmoSelection | null;
  note: SmoNote | null = null;
  originalText: string;
  lyric: SmoLyric | null = null;
  text: string = '';
  editor: SuiLyricEditor | null = null;
  state: number = SuiTextEditor.States.PENDING_EDITOR;
  cursorPromise: Promise<any> | null = null;
  constructor(params: SuiLyricSessionParams) {
    this.score = params.score;
    this.renderer = params.renderer;
    this.scroller = params.scroller;
    this.view = params.view;
    this.parser = params.parser ? params.parser : SmoLyric.parsers.lyric;
    this.verse = params.verse;
    this.selector = params.selector;
    this.selection = SmoSelection.noteFromSelector(this.score, this.selector);
    if (this.selection !== null) {
      this.note = this.selection.note;
    }
    this.originalText = '';
  }

  // ### _setLyricForNote
  // Get the text from the editor and update the lyric with it.
  _setLyricForNote() {
    this.lyric = null;
    if (!this.note) {
      return;
    }
    const lar = this.note.getLyricForVerse(this.verse, SmoLyric.parsers.lyric);
    if (lar.length) {
      this.lyric = lar[0] as SmoLyric;
    }
    if (!this.lyric) {
      const scoreFont = this.score.fonts.find((fn) => fn.name === 'lyrics');
      const fontInfo = JSON.parse(JSON.stringify(scoreFont));
      const lyricD = SmoLyric.defaults;
      lyricD._text = '';
      lyricD.verse = this.verse;
      lyricD.fontInfo = fontInfo;
      this.lyric = new SmoLyric(lyricD);
    }
    this.text = this.lyric._text;
    this.originalText = this.text;
    // this.view.addOrUpdateLyric(this.selection.selector, this.lyric);
  }

  // ### _endLyricCondition
  // Lyric editor has stopped running (promise condition)
  get _endLyricCondition(): boolean {
    return this.editor !== null && this.editor.state !== SuiTextEditor.States.RUNNING;
  }

  // ### _endLyricCondition
  // renderer has partially rendered text(promise condition)
  get _isRefreshed(): boolean {
    return this.renderer.dirty === false;
  }

  // ### _isRendered
  // renderer has rendered text(promise condition)
  get _isRendered(): boolean {
    return this.renderer.passState === SuiRenderState.passStates.clean;
  }

  get _pendingEditor(): boolean {
    return this.state !== SuiTextEditor.States.PENDING_EDITOR;
  }

  // ### _hideLyric
  // Hide the lyric so you only see the editor.
  _hideLyric() {
    if (this.lyric !== null && this.lyric.selector) {
      $(this.lyric.selector).remove();
    }
  }

  get isStopped(): boolean {
    return this.state === SuiTextEditor.States.STOPPED;
  }

  get isRunning(): boolean {
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
    if (this.lyric === null || this.note === null || this.note.logicalBox === null) {
      return;
    }
    let startX = this.note.logicalBox.x;
    let startY = this.note.logicalBox.y + this.note.logicalBox.height + this.lyric.fontInfo.size;
    this.lyric.skipRender = true;
    const lyricRendered = this.lyric._text.length > 0;
    if (this.lyric.logicalBox !== null) {
      startX = this.lyric.logicalBox.x;
      startY = this.lyric.logicalBox.y + this.lyric.logicalBox.height;
    }
    this.editor = new SuiLyricEditor({
      context: this.view.renderer.context,
      lyric: this.lyric, x: startX, y: startY, scroller: this.scroller,
      text: this.lyric.getText()
    });
    this.state = SuiTextEditor.States.RUNNING;
    if (!lyricRendered && this.editor !== null && this.editor.svgText !== null) {
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
  stopSession(): Promise<any> {
    if (this.editor && !this._endLyricCondition) {
      this._updateLyricFromEditor();
      this.editor.stopEditor();
    }
    return PromiseHelpers.makePromise(this, '_isRendered', '_markStopped', null, 100);
  }

  // ### _advanceSelection
  // Based on a skip character, move the editor forward/back one note.
  _advanceSelection(isShift: boolean) {
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
  advanceSelection(isShift: boolean) {
    if (this.isRunning) {
      this._updateLyricFromEditor();
      this._advanceSelection(isShift);
    }
  }

  removeLyric() {
    if (this.selection && this.lyric) {
      this.view.removeLyric(this.selection.selector, this.lyric);
      this.lyric.skipRender = true;
      this.advanceSelection(false);
    }
  }

  // ### _updateLyricFromEditor
  // The editor is done running, so update the lyric now.
  _updateLyricFromEditor() {
    if (this.editor === null || this.lyric === null) {
      return;
    }
    const txt = this.editor.getText();
    this.lyric.setText(txt);
    this.lyric.skipRender = false;
    this.editor.stopEditor();
    if (!this.lyric.deleted && this.originalText !== txt && this.selection !== null) {
      this.view.addOrUpdateLyric(this.selection.selector, this.lyric);
    }
  }
  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata: KeyEvent) {
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return;
    }
    if (evdata.key === '-' || evdata.key === ' ') {
      // skip
      const back = evdata.shiftKey && evdata.key === ' ';
      if (evdata.key === '-' && this.editor !== null) {
        this.editor.evKey(evdata);
      }
      this._updateLyricFromEditor();
      this._advanceSelection(back);
    } else if (this.editor !== null) {
      this.editor.evKey(evdata);
      this._hideLyric();
    }
  }

  // ### handleMouseEvent
  // Mouse event (send to editor)
  handleMouseEvent(ev: any) {
    if (this.state !== SuiTextEditor.States.RUNNING || this.editor === null) {
      return;
    }
    this.editor.handleMouseEvent(ev);
  }
}

export class SuiChordSession extends SuiLyricSession {
  editor: SuiLyricEditor | null = null;
  constructor(params: SuiLyricSessionParams) {
    super(params);
    this.parser = SmoLyric.parsers.chord;
  }
  get textType(): number {
    if (this.isRunning && this.editor !== null) {
      return this.editor.textType;
    }
    return SuiInlineText.textTypes.normal;
  }

  set textType(type) {
    if (this.editor) {
      this.editor.textType = type;
    }
  }

  // ### evKey
  // Key handler (pass to editor)
  evKey(evdata: KeyEvent): boolean {
    let edited = false;
    if (this.state !== SuiTextEditor.States.RUNNING) {
      return false;
    }
    if (evdata.code === 'Enter') {
      this._updateLyricFromEditor();
      this._advanceSelection(evdata.shiftKey);
      edited = true;
    } else if (this.editor !== null) {
      edited = this.editor.evKey(evdata);
    }
    this._hideLyric();
    return edited;
  }

  // ### _setLyricForNote
  // Get the text from the editor and update the lyric with it.
  _setLyricForNote() {
    this.lyric = null;
    if (this.note === null) {
      return;
    }
    const lar = this.note.getLyricForVerse(this.verse, this.parser);
    if (lar.length) {
      this.lyric = lar[0] as SmoLyric;
    }
    if (!this.lyric) {
      const scoreFont = this.score.fonts.find((fn) => fn.name === 'chords');
      const fontInfo = JSON.parse(JSON.stringify(scoreFont));
      const ldef = SmoLyric.defaults;
      ldef._text = '';
      ldef.verse = this.verse;
      ldef.parser = this.parser;
      ldef.fontInfo = fontInfo;
      this.lyric = new SmoLyric(ldef);
      this.note.addLyric(this.lyric);
    }
    this.text = this.lyric._text;
  }
  // ### _startSessionForNote
  // Start the lyric editor for a note (current selected note)
  _startSessionForNote() {
    if (this.lyric === null) {
      return;
    }
    if (this.selection === null || this.note === null || this.note.logicalBox === null) {
      return;
    }
    let startX = this.note.logicalBox.x;
    let startY = this.selection.measure.svg.logicalBox.y;
    if (this.lyric.logicalBox !== null) {
      startX = this.lyric.logicalBox.x;
      startY = this.lyric.logicalBox.y + this.lyric.logicalBox.height;
    }
    this.selection.measure.svg.logicalBox.y + this.selection.measure.svg.logicalBox.height - 70;
    this.editor = new SuiChordEditor({
      context: this.view.renderer.context,
      lyric: this.lyric, x: startX, y: startY, scroller: this.scroller,
      text: this.lyric.getText()
    });
    this.state = SuiTextEditor.States.RUNNING;
    if (this.editor !== null && this.editor.svgText !== null) {
      const delta = (-1) * this.editor.svgText.maxFontHeight(1.0) * (this.lyric.verse + 1);
      this.editor.svgText.offsetStartY(delta);
    }
    this.cursorPromise = this.editor.startCursorPromise();
    this._hideLyric();
  }
}
