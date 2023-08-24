// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers, OutlineInfo } from './svgHelpers';
import { SmoTextGroup, SmoScoreText } from '../../smo/data/scoreText';
import { SuiTextEditor } from './textEdit';
import { SuiScroller } from './scroller';
import { SmoAttrs, SvgBox, getId } from '../../smo/data/common';
import { SvgPage, SvgPageMap } from './svgPageMap';
import { smoSerialize } from '../../common/serializationHelpers';
import { Vex, TextFormatter, Element, FontGlyph, TextFormatterInfo } from 'vex5_smoosic';
declare var $: any;
const VF = Vex.Flow;

// From textfont.ts in VF

/**
 * parameters to render text
 * @category SuiParameters
 */
export interface SuiInlineTextParams {
  fontFamily: string,
  fontWeight: string,
  fontSize: number,
  fontStyle: string,
  startX: number,
  startY: number,
  scroller: SuiScroller,
  purpose: string,
  context: SvgPage,
  pageMap: SvgPageMap
}
/**
 * metrics for a single line of text.  A textGroup can be composed
 * of multiple inline blocks.
 * @category SuiParameters
 */
export interface SuiInlineBlock {
  symbolType: number,
  textType: number,
  highlighted: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  metrics: any,
  glyph: any,
  glyphCode: string,
  text: string
}
export interface SuiInlineArtifact {
  block: SuiInlineBlock,
  box: SvgBox,
  index: number
}
// ## textRender.js
// Classes responsible for formatting and rendering text in SVG space.

/**
 * Inline text is a block of SVG text with the same font.  Each block can
 * contain either text or an svg (vex) glyph.  Each block in the text has its own
 * metrics so we can support inline svg text editors (cursor).
 * @category SuiRender
 */
export class SuiInlineText {
  static get textTypes() {
    return { normal: 0, superScript: 1, subScript: 2 };
  }
  static get symbolTypes() {
    return {
      GLYPH: 1,
      TEXT: 2,
      LINE: 3
    };
  }
  static get textPurposes(): Record<string, string> {
    return {render: 'sui-inline-render', edit: 'sui-inline-edit' };
  }

  // ### textTypeTransitions
  // Given a current text type and a type change request, what is the result
  // text type?  This truth table tells you.
  static get textTypeTransitions(): number[][] {
    return [
      [1, 1, 0],
      [1, 0, 1],
      [1, 2, 2],
      [2, 2, 0],
      [2, 0, 2],
      [2, 1, 1],
      [0, 1, 1],
      [0, 0, 0],
      [0, 2, 2]
    ];
  }

  static getTextTypeResult(oldType: number, newType: number): number {
    let rv = SuiInlineText.textTypes.normal;
    let i = 0;
    for (i = 0; i < SuiInlineText.textTypeTransitions.length; ++i) {
      const tt = SuiInlineText.textTypeTransitions[i];
      if (tt[0] === oldType && tt[1] === newType) {
        rv = tt[2];
        break;
      }
    }
    return rv;
  }

  static getTextTypeTransition(oldType: number, result: number): number {
    let rv = SuiInlineText.textTypes.normal;
    let i = 0;
    for (i = 0; i < SuiInlineText.textTypeTransitions.length; ++i) {
      const tt = SuiInlineText.textTypeTransitions[i];
      if (tt[0] === oldType && tt[2] === result) {
        rv = tt[1];
        break;
      }
    }
    return rv;
  }
  static get superscriptOffset(): number {
    return VF.ChordSymbol.superscriptOffset;
  }

  static get subscriptOffset(): number {
    return VF.ChordSymbol.subscriptOffset;
  }

  get spacing(): number {
    return VF.ChordSymbol.spacingBetweenBlocks;
  }

  static get defaults(): SuiInlineTextParams {
    return JSON.parse(JSON.stringify({
      blocks: [],
      fontFamily: 'Merriweather',
      fontSize: 14,
      startX: 100,
      startY: 100,
      fontWeight: 500,
      fontStyle: 'normal',
      scale: 1,
      activeBlock: -1,
      artifacts: [],
      purpose: 'render',
      classes: '',
      updatedMetrics: false
    }));
  }
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  fontSize: number;
  width: number = -1;
  height: number = -1;
  purpose: string;

  attrs: SmoAttrs;
  textFont: TextFormatter;
  startX: number;
  startY: number;
  blocks: SuiInlineBlock[] = [];
  updatedMetrics: boolean = false;
  context: SvgPage;
  pageMap: SvgPageMap;
  scroller: SuiScroller;
  artifacts: SuiInlineArtifact[] = [];
  logicalBox: SvgBox = SvgBox.default;
  element: SVGSVGElement | null = null;

  updateFontInfo(): TextFormatter {
    const tf = TextFormatter.create({
      family: this.fontFamily,
      weight: this.fontWeight,
      size: this.fontSize,
      style: this.fontStyle
    });
    const setFontSize = (nn: number) => {
      tf.setFontSize(nn);
    }
    const getGlyphMetrics = (cc: string) => {
      return tf.getGlyphMetrics(cc);
    }
    return tf;
    /* const vtf: TextFormatter = {
      family: this.fontFamily,
      weight: this.fontWeight,
      size: this.fontSize,
      style: this.fontStyle,
      pointsToPixels: 4 / 3,
      maxHeight: tf.maxHeight,
      resolution: tf.getResolution(),
      getGlyphMetrics
    };
    return vtf;  */
  }
  // ### constructor just creates an empty svg
  constructor(params: SuiInlineTextParams) {
    this.fontFamily = params.fontFamily;
    this.fontWeight = params.fontWeight;
    this.fontStyle = params.fontStyle;
    this.fontSize = params.fontSize;
    this.textFont = this.updateFontInfo();
    this.scroller = params.scroller;
    this.startX = params.startX;
    this.startY = params.startY;
    this.purpose = params.purpose;
    this.attrs = {
      id: getId().toString(),
      type: 'SuiInlineText'
    };
    this.context = params.context;
    this.pageMap = params.pageMap;
  }

  static fromScoreText(scoreText: SmoScoreText, context: SvgPage, pageMap: SvgPageMap, scroller: SuiScroller): SuiInlineText {
    const params: SuiInlineTextParams = {
      fontFamily: scoreText.fontInfo.family,
      fontWeight: scoreText.fontInfo.weight,
      fontStyle: scoreText.fontInfo.style ?? 'normal',
      startX: scoreText.x, startY: scoreText.y,
      scroller,
      purpose: SuiInlineText.textPurposes.render,
      fontSize: scoreText.fontInfo.size, context,
      pageMap
    };
    const rv = new SuiInlineText(params);
    rv.attrs.id = scoreText.attrs.id;
    const blockParams = SuiInlineText.blockDefaults;
    blockParams.text = scoreText.text;
    rv.addTextBlockAt(0, blockParams);
    return rv;
  }

  static get blockDefaults(): SuiInlineBlock {
    return JSON.parse(JSON.stringify({
      symbolType: SuiInlineText.symbolTypes.TEXT,
      textType: SuiInlineText.textTypes.normal,
      highlighted: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      scale: 1.0,
      glyph: {},
      text: '',
      glyphCode: ''
    }));
  }

  // ### pointsToPixels
  // The font size is specified in points, convert to 'pixels' in the svg space
  get pointsToPixels(): number {
    return this.textFont.fontSizeInPixels;
  }

  offsetStartX(offset: number) {
    this.startX += offset;
    this.blocks.forEach((block) => {
      block.x += offset;
    });
  }

  offsetStartY(offset: number) {
    this.startY += offset;
    this.blocks.forEach((block) => {
      block.y += offset;
    });
  }
  maxFontHeight(scale: number): number {
    return this.textFont.maxHeight * scale;
  }

  _glyphOffset(block: SuiInlineBlock): number {
    return block.glyph.getMetrics().yShift * this.pointsToPixels * block.scale;
  }

  /**
   * Based on the font metrics, compute the width of the strings and glyph that make up
   * this block
   */
  _calculateBlockIndex() {
    var curX = this.startX;
    var maxH = 0;
    let superXAlign = 0;
    let superXWidth = 0;
    let prevBlock: SuiInlineBlock | null = null;
    let i = 0;
    this.textFont.setFontSize(this.fontSize);
    this.blocks.forEach((block) => {
      // super/subscript
      const sp = this.isSuperscript(block);
      const sub = this.isSubcript(block);

      block.width = 0;
      block.height = 0;

      // coeff for sub/super script
      const subAdj = (sp || sub) ? VF.ChordSymbol.superSubRatio : 1.0;
      // offset for super/sub
      let subOffset = 0;
      if (sp) {
        subOffset = SuiInlineText.superscriptOffset * this.pointsToPixels;
      } else if (sub) {
        subOffset = SuiInlineText.subscriptOffset * this.pointsToPixels;
      } else {
        subOffset = 0;
      }
      block.x = curX;
      if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
        for (i = 0; i < block.text.length; ++i) {
          const ch = block.text[i];
          const glyph = this.textFont.getGlyphMetrics(ch);
          block.width += ((glyph.advanceWidth ?? 0) / this.textFont.getResolution()) * this.pointsToPixels * block.scale * subAdj;
          const blockHeight = (glyph.ha / this.textFont.getResolution()) * this.pointsToPixels * block.scale;
          block.height = block.height < blockHeight ? blockHeight : block.height;
          block.y = this.startY + (subOffset * block.scale);
        }
      } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
        // TODO: vexflow broke leftSideBearing and advanceWidth
        block.width = (block.glyph.getMetrics().width) * this.pointsToPixels * block.scale;
        block.height = (block.glyph.getMetrics().ha) * this.pointsToPixels * block.scale;
        block.x += block.glyph.getMetrics().xMin * this.pointsToPixels * block.scale;
        block.y = this.startY + this._glyphOffset(block) + subOffset;
      }
      // Line subscript up with super if the follow each other
      if (sp) {
        if (superXAlign === 0) {
          superXAlign = block.x;
        }
      } else if (sub) {
        if (superXAlign > 0 && prevBlock !== null) {
          block.x = superXAlign;
          superXWidth = prevBlock.x + prevBlock.width;
          curX = superXAlign;
          superXAlign = 0;
        } else {
          if (superXWidth > 0 && superXWidth < block.width + block.x) {
            superXWidth = block.width + block.x;
          }
        }
      } else if (superXWidth > 0) {
        block.x = superXWidth + VF.ChordSymbol.spacingBetweenBlocks;
        superXWidth = 0;
      } else {
        superXAlign = 0;
      }
      curX += block.width;
      maxH = block.height > maxH ? maxH : block.height;
      prevBlock = block;
    });
    this.width = curX - this.startX;
    this.height = maxH;
    this.updatedMetrics = true;
  }

  // ### getLogicalBox
  // return the calculated svg metrics.  In SMO parlance the
  // logical box is in SVG space, 'renderedBox' is in client space.
  getLogicalBox(): SvgBox {
    let rv: SvgBox = SvgBox.default;
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }
    const adjBox = (box: SvgBox) => {
      const nbox = SvgHelpers.smoBox(box);
      nbox.y = nbox.y - nbox.height;
      return nbox;
    };
    this.blocks.forEach((block) => {
      if (!rv.x) {
        rv = SvgHelpers.smoBox(adjBox(block));
      } else {
        rv = SvgHelpers.unionRect(rv, adjBox(block));
      }
    });
    return rv;
  }
  // ### renderCursorAt
  // When we are using textLayout to render editor, create a cursor that adjusts it's size
  renderCursorAt(position: number, textType: number) {
    let adjH = 0;
    let adjY = 0;
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }
    const group = this.context.getContext().openGroup();
    group.id = 'inlineCursor';
    const h = this.fontSize;
    if (this.blocks.length <= position || position < 0) {
      const x = this.startX - this.context.box.x;
      const y = this.startY - this.context.box.y;
      SvgHelpers.renderCursor(group,  x, y - h, h);
      this.context.getContext().closeGroup();
      return;
    }
    const block = this.blocks[position];
    adjH = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? h / 2 : h;
    // For glyph, add y adj back to the cursor since it's not a glyph
    adjY = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? block.y - this._glyphOffset(block) :
      block.y;
    if (typeof (textType) === 'number' && textType !== SuiInlineText.textTypes.normal) {
      const ratio = textType !== SuiInlineText.textTypes.normal ? VF.ChordSymbol.superSubRatio : 1.0;
      adjH = adjH * ratio;
      if (textType !== block.textType) {
        if (textType === SuiInlineText.textTypes.superScript) {
          adjY -= h / 2;
        } else {
          adjY += h / 2;
        }
      }
    }
    const x = block.x + block.width - this.context.box.x;
    const y = adjY - (adjH * block.scale) - this.context.box.y;
    SvgHelpers.renderCursor(group, x, y, adjH * block.scale);
    this.context.getContext().closeGroup();
  }
  removeCursor() {
    $('svg #inlineCursor').remove();
  }
  unrender() {
    this.element?.remove();
    this.element = null;
  }
  getIntersectingBlocks(box: SvgBox): SuiInlineArtifact[] {
    if (!this.artifacts) {
      return [];
    }
    return SvgHelpers.findIntersectingArtifact(box, this.artifacts) as SuiInlineArtifact[];
  }
  _addBlockAt(position: number, block: SuiInlineBlock) {
    if (position >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(position, 0, block);
    }
  }
  removeBlockAt(position: number) {
    this.blocks.splice(position, 1);
    this.updatedMetrics = false;
  }

  // ### addTextBlockAt
  // Add a text block to the line of text.
  // params must contain at least:
  // {text:'xxx'}
  addTextBlockAt(position: number, params: SuiInlineBlock) {
    const block: SuiInlineBlock = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    smoSerialize.vexMerge(block, params);
    block.text = params.text;
    block.scale = params.scale ? params.scale : 1;
    this._addBlockAt(position, block);
    this.updatedMetrics = false;
  }
  _getGlyphBlock(params: SuiInlineBlock): SuiInlineBlock {
    const block: SuiInlineBlock = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    smoSerialize.vexMerge(block, params);
    params.text = params.glyphCode;
    block.text = params.text;
    block.scale = params.scale ? params.scale : 1;
    /* const block = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    block.symbolType = SuiInlineText.symbolTypes.GLYPH;

    block.glyphCode = params.glyphCode;
    block.glyph = new VF.Glyph(block.glyphCode, this.fontSize);
    block.scale = (params.textType && params.textType !== SuiInlineText.textTypes.normal) ?
      2 * VF.ChordSymbol.superSubRatio : 2;

    block.textType = params.textType ? params.textType : SuiInlineText.textTypes.normal;

    block.glyph.scale = block.glyph.scale * block.scale; */
    return block;
  }
  // ### addGlyphBlockAt
  // Add a glyph block to the line of text.  Params must include:
  // {glyphCode:'csymDiminished'}
  addGlyphBlockAt(position: number, params: SuiInlineBlock) {
    const block = this._getGlyphBlock(params);
    this._addBlockAt(position, block);
    this.updatedMetrics = false;
  }
  isSuperscript(block: SuiInlineBlock): boolean {
    return block.textType === SuiInlineText.textTypes.superScript;
  }
  isSubcript(block: SuiInlineBlock): boolean {
    return block.textType === SuiInlineText.textTypes.subScript;
  }
  getHighlight(block: SuiInlineBlock): boolean {
    return block.highlighted;
  }
  setHighlight(block: SuiInlineBlock, value: boolean) {
    block.highlighted = value;
  }

  rescale(scale: number) {
    scale = (scale * this.fontSize < 6) ? 6 / this.fontSize : scale;
    scale = (scale * this.fontSize > 72) ? 72 / this.fontSize : scale;
    this.blocks.forEach((block) => {
      block.scale = scale;
    });
    this.updatedMetrics = false;
  }

  render() {
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }

    this.context.getContext().setFont({
      family: this.fontFamily, size: this.fontSize, weight: this.fontWeight, style: this.fontStyle
    });
    const group = this.context.getContext().openGroup();
    this.element = group;
    const mmClass = 'suiInlineText';
    let ix = 0;
    group.classList.add('vf-' + this.attrs.id);
    group.classList.add(this.attrs.id);
    group.classList.add(mmClass);
    group.classList.add(this.purpose);
    group.id = this.attrs.id;
    this.artifacts = [];

    this.blocks.forEach((block) => {
      var bg = this.context.getContext().openGroup();
      bg.classList.add('textblock-' + this.attrs.id + ix);
      this._drawBlock(block);
      this.context.getContext().closeGroup();
      const artifact: SuiInlineArtifact = { block, box: SvgBox.default, index: 0 };
      artifact.box = this.context.offsetBbox(bg);
      artifact.index = ix;
      this.artifacts.push(artifact);
      ix += 1;
    });
    this.context.getContext().closeGroup();
    this.logicalBox = this.context.offsetBbox(group);
  }

  _drawBlock(block: SuiInlineBlock) {
    const sp = this.isSuperscript(block);
    const sub = this.isSubcript(block);
    const highlight = this.getHighlight(block);
    const y = block.y - this.context.box.y; // relative y into page

    if (highlight) {
      this.context.getContext().save();
      this.context.getContext().setFillStyle('#999');
    }

    // This is how svgcontext expects to get 'style'
    const weight = this.fontWeight;
    const style = this.fontStyle;
    const family = this.fontFamily;
    if (sp || sub) {
      this.context.getContext().save();
      this.context.getContext().setFont({
        family, size: this.fontSize * VF.ChordSymbol.superSubRatio * block.scale, weight, style
      });
    } else {
      this.context.getContext().setFont({ family, size: this.fontSize * block.scale, weight, style });
    }
    if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
      this.context.getContext().fillText(block.text, block.x, y);
    } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
      block.glyph.render(this.context.getContext(), block.x, y);
    }
    if (sp || sub) {
      this.context.getContext().restore();
    }
    if (highlight) {
      this.context.getContext().restore();
    }
  }

  getText(): string {
    let rv = '';
    this.blocks.forEach((block) => {
      rv += block.text;
    });
    return rv;
  }
}

export interface SuiTextBlockBlock {
  text: SuiInlineText;
  position: number;
  activeText: boolean;
}
export interface SuiTextBlockParams {
  blocks: SuiTextBlockBlock[];
  scroller: SuiScroller;
  spacing: number;
  context: SvgPage;
  skipRender: boolean;
  justification: number;
}
export interface SuiTextBlockJusityCalc {
  blocks: SuiInlineText[], minx: number, maxx: number, width: number
}
// ## SuiTextBlock
// A text block is a set of inline blocks that can be aligned/arranged in different ways.
export class SuiTextBlock {
  static get relativePosition() {
    return {
      ABOVE: SmoTextGroup.relativePositions.ABOVE,
      BELOW: SmoTextGroup.relativePositions.BELOW,
      LEFT: SmoTextGroup.relativePositions.LEFT,
      RIGHT: SmoTextGroup.relativePositions.RIGHT
    };
  }
  inlineBlocks: SuiTextBlockBlock[] = [];
  scroller: SuiScroller;
  spacing: number = 0;
  context: SvgPage;
  skipRender: boolean;
  currentBlockIndex: number = 0;
  justification: number;
  outlineRect: OutlineInfo | null = null;
  currentBlock: SuiTextBlockBlock | null = null;
  logicalBox: SvgBox = SvgBox.default;
  constructor(params: SuiTextBlockParams) {
    this.inlineBlocks = [];
    this.scroller = params.scroller;
    this.spacing = params.spacing;
    this.context = params.context;
    this.skipRender = false; // used when editing the text
    if (params.blocks.length < 1) {
      const inlineParams = SuiInlineText.defaults;
      inlineParams.scroller = this.scroller;
      inlineParams.context = this.context;
      const inst = new SuiInlineText(inlineParams);
      params.blocks = [{ text: inst, position: SmoTextGroup.relativePositions.RIGHT, activeText: true }];
    }
    params.blocks.forEach((block) => {
      if (!this.currentBlock) {
        this.currentBlock = block;
        this.currentBlockIndex = 0;
      }
      this.inlineBlocks.push(block);
    });
    this.justification = params.justification ? params.justification :
      SmoTextGroup.justifications.LEFT;
  }
  render() {
    this.unrender();    
    this.inlineBlocks.forEach((block) => {
      block.text.render();
      if (block.activeText) {
        this._outlineBox(this.context, block.text.logicalBox);
      }
      if (!this.logicalBox || this.logicalBox.width < 1) {
        this.logicalBox = SvgHelpers.smoBox(block.text.logicalBox);
      } else {
        this.logicalBox = SvgHelpers.unionRect(this.logicalBox, block.text.logicalBox);
      }
    });
  }
  _outlineBox(context: any, box: SvgBox) {
    const outlineStroke = SuiTextEditor.strokes['text-highlight'];
    if (!this.outlineRect) {
      this.outlineRect = {
        context, box, classes: 'text-drag',
        stroke: outlineStroke, scroll: this.scroller.scrollState, timeOff: 1000
      };
    }
    this.outlineRect.box = box;
    this.outlineRect.context = context;
    this.outlineRect.scroll = this.scroller.scrollState;
    SvgHelpers.outlineRect(this.outlineRect);
  }

  offsetStartX(offset: number) {
    this.inlineBlocks.forEach((block) => {
      block.text.offsetStartX(offset);
    });
  }

  offsetStartY(offset: number) {
    this.inlineBlocks.forEach((block) => {
      block.text.offsetStartY(offset);
    });
  }

  rescale(scale: number) {
    this.inlineBlocks.forEach((block) => {
      block.text.rescale(scale);
    });
  }

  get x(): number {
    return this.getLogicalBox().x;
  }
  get y(): number {
    return this.getLogicalBox().y;
  }

  maxFontHeight(scale: number): number {
    let rv = 0;
    this.inlineBlocks.forEach((block) => {
      const blockHeight = block.text.maxFontHeight(scale);
      rv = blockHeight > rv ? blockHeight : rv;
    });
    return rv;
  }
  static blockFromScoreText(scoreText: SmoScoreText, context: SvgPage, pageMap: SvgPageMap, position: number, scroller: SuiScroller): SuiTextBlockBlock {
    var inlineText = SuiInlineText.fromScoreText(scoreText, context, pageMap, scroller);
    return { text: inlineText, position, activeText: true };
  }

  getLogicalBox(): SvgBox {
    return this._calculateBoundingClientRect();
  }
  _calculateBoundingClientRect(): SvgBox {
    let rv: SvgBox = SvgBox.default;
    this.inlineBlocks.forEach((block) => {
      if (!rv.x) {
        rv = block.text.getLogicalBox();
      } else {
        rv = SvgHelpers.unionRect(rv, block.text.getLogicalBox());
      }
    });
    rv.y = rv.y - rv.height;
    return rv;
  }
  static fromTextGroup(tg: SmoTextGroup, context: SvgPage, pageMap: SvgPageMap, scroller: SuiScroller): SuiTextBlock {
    const blocks: SuiTextBlockBlock[] = [];

    // Create an inline block for each ScoreText
    tg.textBlocks.forEach((stBlock) => {
      const st = stBlock.text;
      const newText = SuiTextBlock.blockFromScoreText(st, context, pageMap, stBlock.position, scroller);
      newText.activeText = stBlock.activeText;
      blocks.push(newText);
    });
    const rv = new SuiTextBlock({
      blocks, justification: tg.justification, spacing: tg.spacing, context, scroller,
      skipRender: false
    });
    rv._justify();
    return rv;
  }
  unrender() {
    this.inlineBlocks.forEach((block) => {
      if (block.text.element) {
        block.text.element.remove();
        block.text.element = null;
      }
    });
  }
  // ### _justify
  // justify the blocks according to the group justify policy and the
  // relative position of the blocks
  _justify() {
    let hIx = 0;
    let left = 0;
    let minx = 0;
    let maxx = 0;
    let lvl = 0;
    let maxwidth = 0;
    let runningWidth = 0;
    let runningHeight = 0;
    if (!this.inlineBlocks.length) {
      return;
    }
    minx = this.inlineBlocks[0].text.startX;
    // We justify relative to first block x/y.
    const initialX = this.inlineBlocks[0].text.startX;
    const initialY = this.inlineBlocks[0].text.startY;
    const vert: Record<string, SuiTextBlockJusityCalc> = {};
    this.inlineBlocks.forEach((inlineBlock) => {
      const block = inlineBlock.text;
      const blockBox = block.getLogicalBox();
      // If this is a horizontal positioning, reset to first blokc position
      //
      if (hIx > 0) {
        block.startX = initialX;
        block.startY = initialY;
      }
      minx = block.startX < minx ? block.startX : minx;
      maxx = (block.startX + blockBox.width) > maxx ? block.startX + blockBox.width : maxx;

      lvl = inlineBlock.position === SmoTextGroup.relativePositions.ABOVE ? lvl + 1 : lvl;
      lvl = inlineBlock.position === SmoTextGroup.relativePositions.BELOW ? lvl - 1 : lvl;
      if (inlineBlock.position === SmoTextGroup.relativePositions.RIGHT) {
        block.startX += runningWidth;
        if (hIx > 0) {
          block.startX += this.spacing;
        }
      }
      if (inlineBlock.position === SmoTextGroup.relativePositions.LEFT) {
        if (hIx > 0) {
          block.startX = minx - blockBox.width;
          minx = block.startX;
          block.startX -= this.spacing;
        }
      }
      if (inlineBlock.position === SmoTextGroup.relativePositions.BELOW) {
        block.startY += runningHeight;
        if (hIx > 0) {
          block.startY += this.spacing;
        }
      }
      if (inlineBlock.position === SmoTextGroup.relativePositions.ABOVE) {
        block.startY -= runningHeight;
        if(hIx > 0) {
          block.startY -= this.spacing;
        }
      }
      if (!vert[lvl]) {
        vert[lvl] = {
          blocks: [block], minx: block.startX, maxx: block.startX + blockBox.width,
          width: blockBox.width
        };
        maxwidth = vert[lvl].width;
        vert[lvl].blocks = [block];
        vert[lvl].minx = block.startX;
        vert[lvl].maxx = block.startX + blockBox.width;
        maxwidth = vert[lvl].width = blockBox.width;
      } else {
        vert[lvl].blocks.push(block);
        vert[lvl].minx = vert[lvl].minx < block.startX ? vert[lvl].minx : block.startX;
        vert[lvl].maxx = vert[lvl].maxx > (block.startX + blockBox.width) ?
          vert[lvl].maxx : (block.startX + blockBox.width);
        vert[lvl].width += blockBox.width;
        maxwidth = maxwidth > vert[lvl].width ? maxwidth : vert[lvl].width;
      }
      runningWidth += blockBox.width;
      runningHeight += blockBox.height;
      hIx += 1;
      block.updatedMetrics = false;
    });

    const levels = Object.keys(vert);

    // Horizontal justify the vertical blocks
    levels.forEach((level) => {
      const vobj = vert[level];
      if (this.justification === SmoTextGroup.justifications.LEFT) {
        left = minx - vobj.minx;
      } else if (this.justification === SmoTextGroup.justifications.RIGHT) {
        left = maxx - vobj.maxx;
      } else {
        left = (maxwidth / 2) - (vobj.width / 2);
        left += minx - vobj.minx;
      }
      vobj.blocks.forEach((block) => {
        block.offsetStartX(left);
      });
    });
  }
}
