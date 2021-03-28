// ## textRender.js
// Classes responsible for formatting and rendering text in SVG space.
// ## SuiInlineText
// Inline text is a block of SVG text with the same font.  Each block can
// contain eithr text or an svg (vex) glyph.  Each block in the text has its own
// metrics so we can support inline svg text editors (cursor).
class SuiInlineText {
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

  // ### textTypeTransitions
  // Given a current text type and a type change request, what is the result
  // text type?  This truth table tells you.
  static get textTypeTransitions() {
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

  static getTextTypeResult(oldType, newType) {
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

  static getTextTypeTransition(oldType, result) {
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
  static get superscriptOffset() {
    return VF.ChordSymbol.chordSymbolMetrics.global.superscriptOffset / VF.ChordSymbol.engravingFontResolution;
  }

  static get subscriptOffset() {
    return VF.ChordSymbol.chordSymbolMetrics.global.subscriptOffset / VF.ChordSymbol.engravingFontResolution;
  }

  get spacing() {
    return this.textFont.spacing / this.textFont.resolution;
  }

  static get defaults() {
    return {
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
      classes: '',
      updatedMetrics: false
    };
  }

  updateFontInfo() {
    this.textFont = VF.TextFont.getTextFontFromVexFontData({
      family: this.fontFamily,
      weight: this.fontWeight,
      size: this.fontSize,
      style: this.fontStyle
    });
  }
  // ### constructor just creates an empty svg
  constructor(params) {
    Vex.Merge(this, SuiInlineText.defaults);
    Vex.Merge(this, params);
    this.attrs = {
      id: VF.Element.newID(),
      type: 'SuiInlineText'
    };

    if (!this.context) {
      throw 'context for SVG must be set';
    }
    if (!this.scroller) {
      throw 'scroller for inline text must be set';
    }
    this.updateFontInfo();
  }

  static fromScoreText(scoreText, context, scroller) {
    var pointSize = scoreText.fontInfo.pointSize ? scoreText.fontInfo.pointSize
      : SmoScoreText.fontPointSize(scoreText.fontInfo.size);
    const params = { fontFamily: scoreText.fontInfo.family,
      fontWeight: scoreText.fontInfo.weight,
      fontStyle: scoreText.fontInfo.style,
      startX: scoreText.x, startY: scoreText.y,
      scroller,
      fontSize: pointSize, context };
    const rv = new SuiInlineText(params);
    rv.attrs.id = scoreText.attrs.id;
    rv.addTextBlockAt(0, { text: scoreText.text });
    return rv;
  }

  static get blockDefaults() {
    return {
      symbolType: SuiInlineText.symbolTypes.TEXT,
      textType: SuiInlineText.textTypes.normal,
      highlighted: false
    };
  }

  // ### pointsToPixels
  // The font size is specified in points, convert to 'pixels' in the svg space
  get pointsToPixels() {
    return this.textFont.pointsToPixels;
  }

  offsetStartX(offset) {
    this.startX += offset;
    this.blocks.forEach((block) => {
      block.x += offset;
    });
  }

  offsetStartY(offset) {
    this.startY += offset;
    this.blocks.forEach((block) => {
      block.y += offset;
    });
  }
  maxFontHeight(scale) {
    return this.textFont.maxHeight * scale;
  }

  _glyphOffset(block) {
    return block.metrics.yOffset / VF.ChordSymbol.engravingFontResolution * this.pointsToPixels * block.scale;
  }

  // ### _calculateBlockIndex
  // Based on the font metrics, compute the width of the strings and glyph that make up
  // this block.
  _calculateBlockIndex() {
    var curX = this.startX;
    var maxH = 0;
    let superXAlign = 0;
    let superXWidth = 0;
    let prevBlock = null;
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
      let subOffset =  0;
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

          const glyph = this.textFont.getMetricForCharacter(ch);
          block.width += ((glyph.advanceWidth) / this.textFont.resolution) * this.pointsToPixels * block.scale * subAdj;
          const blockHeight = (glyph.ha / this.textFont.resolution) *  this.pointsToPixels * block.scale;
          block.height = block.height < blockHeight ? blockHeight : block.height;
          block.y = this.startY +  (subOffset * block.scale);
        }
      } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
        block.width = (block.metrics.advanceWidth / VF.ChordSymbol.engravingFontResolution) * this.pointsToPixels * block.scale;
        block.height = (block.glyph.metrics.ha / VF.ChordSymbol.engravingFontResolution) * this.pointsToPixels * block.scale;
        block.x += block.metrics.leftSideBearing / VF.ChordSymbol.engravingFontResolution * this.pointsToPixels * block.scale;
        block.y = this.startY + this._glyphOffset(block) + subOffset;
      }
      // Line subscript up with super if the follow each other
      if (sp) {
        if (superXAlign === 0) {
          superXAlign = block.x;
        }
      } else if (sub) {
        if (superXAlign > 0) {
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
      }  else {
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
  getLogicalBox() {
    let rv = {};
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }
    const adjBox = (box) => {
      const nbox = svgHelpers.smoBox(box);
      nbox.y = nbox.y - nbox.height;
      return nbox;
    };
    this.blocks.forEach((block) => {
      if (!rv.x) {
        rv = svgHelpers.smoBox(adjBox(block));
      } else {
        rv = svgHelpers.unionRect(rv, adjBox(block));
      }
    });
    return rv;
  }

  _getTextBlock(params) {
    const block = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    Vex.Merge(block, params);
    block.text = params.text;
    block.scale = params.scale ? params.scale : 1;
    return block;
  }
  // ### renderCursorAt
  // When we are using textLayout to render editor, create a cursor that adjusts it's size
  renderCursorAt(position, textType) {
    let adjH = 0;
    let adjY = 0;
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }
    const group = this.context.openGroup();
    group.id = 'inlineCursor';
    const h = this.fontSize;
    if (this.blocks.length <= position || position < 0) {
      svgHelpers.renderCursor(group, this.startX, this.startY - h, h);
      this.context.closeGroup();
      return;
    }
    const block = this.blocks[position];
    adjH = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? h / 2 : h;
    // For glyph, add y adj back to the cursor since it's not a glyph
    adjY = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? block.y - this._glyphOffset(block) :
      block.y;
    if (typeof(textType) === 'number' && textType !== SuiInlineText.textTypes.normal) {
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
    svgHelpers.renderCursor(group, block.x + block.width, adjY - (adjH * block.scale), adjH * block.scale);
    this.context.closeGroup();
  }
  removeCursor() {
    $('svg #inlineCursor').remove();
  }
  unrender() {
    $('svg #' + this.attrs.id).remove();
  }
  getIntersectingBlocks(box, scroller) {
    if (!this.artifacts) {
      return [];
    }
    return svgHelpers.findIntersectingArtifact(box, this.artifacts, scroller);
  }
  _addBlockAt(position, block) {
    if (position >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(position, 0, block);
    }
  }
  removeBlockAt(position) {
    this.blocks.splice(position, 1);
    this.updatedMetrics = false;
  }

  // ### addTextBlockAt
  // Add a text block to the line of text.
  // params must contain at least:
  // {text:'xxx'}
  addTextBlockAt(position, params) {
    const block = this._getTextBlock(params);
    this._addBlockAt(position, block);
    this.updatedMetrics = false;
  }
  _getGlyphBlock(params) {
    const block = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    block.symbolType = SuiInlineText.symbolTypes.GLYPH;
    block.glyphCode = params.glyphCode;
    block.glyph = new VF.Glyph(block.glyphCode, this.fontSize);
    block.metrics = VF.ChordSymbol.getMetricForGlyph(block.glyphCode);
    block.scale  = (params.textType && params.textType !== SuiInlineText.textTypes.normal) ?
      2 * VF.ChordSymbol.superSubRatio * block.metrics.scale : 2 * block.metrics.scale;

    block.textType = params.textType ? params.textType : SuiInlineText.textTypes.normal;

    block.glyph.scale = block.glyph.scale * block.scale;
    return block;
  }
  // ### addGlyphBlockAt
  // Add a glyph block to the line of text.  Params must include:
  // {glyphCode:'csymDiminished'}
  addGlyphBlockAt(position, params) {
    const block = this._getGlyphBlock(params);
    this._addBlockAt(position, block);
    this.updatedMetrics = false;
  }
  isSuperscript(block) {
    return block.textType === SuiInlineText.textTypes.superScript;
  }
  isSubcript(block) {
    return block.textType === SuiInlineText.textTypes.subScript;
  }
  getHighlight(block) {
    return block.highlighted;
  }
  setHighlight(block, value) {
    block.highlighted = value;
  }

  rescale(scale) {
    scale = (scale * this.fontSize < 6) ? 6 / this.fontSize : scale;
    scale = (scale * this.fontSize > 72) ? 72 / this.fontSize : scale;
    this.blocks.forEach((block) => {
      block.scale = scale;
    });
    this.updatedMetrics = false;
  }

  render() {
    $('svg #' + this.attrs.id).remove();

    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }

    this.context.setFont(this.fontFamily, this.fontSize, this.fontWeight);
    const group = this.context.openGroup();
    const mmClass = 'suiInlineText';
    let ix = 0;
    group.classList.add('vf-' + this.attrs.id);
    group.classList.add(this.attrs.id);
    group.classList.add(mmClass);
    group.id = this.attrs.id;
    this.artifacts = [];

    this.blocks.forEach((block) => {
      var bg = this.context.openGroup();
      bg.classList.add('textblock-' + this.attrs.id + ix);
      this._drawBlock(block);
      this.context.closeGroup();
      const artifact = { block };
      artifact.box = svgHelpers.smoBox(bg.getBoundingClientRect());
      artifact.index = ix;
      this.artifacts.push(artifact);
      ix += 1;
    });
    this.context.closeGroup();
    this.logicalBox = svgHelpers.smoBox(group.getBBox());
    this.renderedBox = svgHelpers.logicalToClient(this.context.svg, this.logicalBox, this.scroller);
  }

  _drawBlock(block) {
    const sp = this.isSuperscript(block);
    const sub = this.isSubcript(block);
    const highlight = this.getHighlight(block);
    const y = block.y;

    if (highlight) {
      this.context.save();
      this.context.setFillStyle('#999');
    }

    // This is how svgcontext expects to get 'style'
    const weight = this.fontWeight + ',' + this.fontStyle;

    if (sp || sub) {
      this.context.save();
      this.context.setFont(this.fontFamily, this.fontSize * VF.ChordSymbol.superSubRatio * block.scale, weight);
    } else {
      this.context.setFont(this.fontFamily, this.fontSize * block.scale, weight);
    }
    if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
      this.context.fillText(block.text, block.x, y);
    } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
      block.glyph.render(this.context, block.x, y);
    }
    if (sp || sub) {
      this.context.restore();
    }
    if (highlight) {
      this.context.restore();
    }
  }

  getText() {
    let rv = '';
    this.blocks.forEach((block) => {
      rv += block.text;
    });
    return rv;
  }
}

// ## SuiTextBlock
// A text block is a set of inline blocks that can be aligned/arranged in different ways.
// eslint-disable-next-line no-unused-vars
class SuiTextBlock {
  static get relativePosition() {
    return { ABOVE: SmoTextGroup.relativePositions.ABOVE,
      BELOW: SmoTextGroup.relativePositions.BELOW,
      LEFT: SmoTextGroup.relativePositions.LEFT,
      RIGHT: SmoTextGroup.relativePositions.RIGHT
    };
  }
  constructor(params) {
    this.inlineBlocks = [];
    if (!typeof(params.scroller) === 'object') {
      throw 'bad text block, no scroller';
    }
    this.scroller = params.scroller;
    this.spacing = 0;
    if (typeof(params.spacing) !== 'undefined') {
      this.spacing = params.spacing;
    }
    this.context = params.context;
    this.skipRender = false; // used when editing the text
    if (!params.blocks) {
      const inst = new SuiInlineText(params);
      params.blocks = [{ text: inst, position: SmoTextGroup.relativePositions.RIGHT }];
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
  addTextAt(position, params) {
    this.currentBlock.text.addTextBlockAt(position, params);
  }
  addGlyphAt(position, params) {
    this.currentBlock.text.addGlyphBlockAt(position, params);
  }
  render() {
    this.unrender();
    this.renderedBox = null;
    this.logicalBox = null;
    this.inlineBlocks.forEach((block) => {
      block.text.render();
      if (block.activeText) {
        this._outlineBox(this.context, block.text.logicalBox);
      }
      if (!this.renderedBox) {
        this.renderedBox = svgHelpers.smoBox(block.text.renderedBox);
        this.logicalBox = svgHelpers.smoBox(block.text.logicalBox);
      } else {
        this.renderedBox = svgHelpers.unionRect(this.renderedBox, block.text.renderedBox);
        this.logicalBox = svgHelpers.unionRect(this.logicalBox, block.text.logicalBox);
      }
    });
  }
  _outlineBox(context, box) {
    const outlineStroke = SuiTextEditor.strokes['text-highlight'];
    const obj = {
      context, box, classes: 'text-drag',
      outlineStroke, scroller: { netScroll: { x: 0, y: 0 } }
    };
    svgHelpers.outlineLogicalRect(obj);
  }

  offsetStartX(offset) {
    this.inlineBlocks.forEach((block) => {
      block.text.offsetStartX(offset);
    });
  }

  offsetStartY(offset) {
    this.inlineBlocks.forEach((block) => {
      block.text.offsetStartY(offset);
    });
  }

  rescale(scale) {
    this.inlineBlocks.forEach((block) => {
      block.text.rescale(scale);
    });
  }

  get x() {
    return this.getLogicalBox().x;
  }
  get y() {
    return this.getLogicalBox().y;
  }

  maxFontHeight(scale) {
    let rv = 0;
    this.inlineBlocks.forEach((block) => {
      const blockHeight = block.text.maxFontHeight(scale);
      rv = blockHeight > rv ? blockHeight : rv;
    });
    return rv;
  }

  static inlineParamsFromScoreText(scoreText, context, scroller) {
    const pointSize = scoreText.fontInfo.pointSize ? scoreText.fontInfo.pointSize
      : SmoScoreText.fontPointSize(scoreText.fontInfo.size);
    const rv = { fontFamily: scoreText.fontInfo.family,
      startX: scoreText.x, startY: scoreText.y,
      fontSize: pointSize, context, scroller };
    return rv;
  }
  static blockFromScoreText(scoreText, context, position, scroller) {
    var inlineText = SuiInlineText.fromScoreText(scoreText, context, scroller);
    return  { text: inlineText, position };
  }

  getLogicalBox() {
    return this._calculateBoundingClientRect();
  }
  getRenderedBox() {
    return svgHelpers.logicalToClient(this.context.svg, this._calculateBoundingClientRect(), this.scroller);
  }
  _calculateBoundingClientRect() {
    var rv = {};
    this.inlineBlocks.forEach((block) => {
      if (!rv.x) {
        rv = block.text.getLogicalBox();
      } else {
        rv = svgHelpers.unionRect(rv, block.text.getLogicalBox());
      }
    });
    rv.y = rv.y - rv.height;
    return rv;
  }
  static fromTextGroup(tg, context, scroller) {
    const blocks = [];

    // Create an inline block for each ScoreText
    tg.textBlocks.forEach((stBlock) => {
      const st = stBlock.text;
      const newText = SuiTextBlock.blockFromScoreText(st, context, stBlock.position, scroller);
      newText.activeText = stBlock.activeText;
      blocks.push(newText);
    });
    const rv = new SuiTextBlock({ blocks, justification: tg.justification, spacing: tg.spacing, context, scroller });
    rv._justify();
    return rv;
  }
  unrender() {
    this.inlineBlocks.forEach((block) => {
      const selector = '#' + block.text.attrs.id;
      $(selector).remove();
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
    const vert = {};
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
        if (hIx > 0) {
          block.startY -= this.spacing;
        }
      }
      if (!vert[lvl]) {
        vert[lvl] = {};
        vert[lvl].blocks = [block];
        vert[lvl].minx = block.startX;
        vert[lvl].maxx = block.startX + blockBox.width;
        maxwidth = vert[lvl].width = blockBox.width;
      }  else {
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
        left +=  minx - vobj.minx;
      }
      vobj.blocks.forEach((block) => {
        block.offsetStartX(left);
      });
    });
  }
  addBlockPosition(scoreText, position) {
    const blockBox = this.currentBlock.text.getRenderedBox();
    position = typeof(position) !== 'undefined' ? position : SuiTextBlock.relativePosition.BELOW;
    const ycoff = position === SuiTextBlock.relativePosition.ABOVE ? -1 : 1;
    const xcoff = position === SuiTextBlock.relativePosition.LEFT ? -1 : 1;
    const yoffset = position === SuiTextBlock.relativePosition.ABOVE
      || position === SuiTextBlock.relativePosition.BELOW ?
      blockBox.height + this.currentBlock.text.spacing : 0;
    const xoffset = position === SuiTextBlock.relativePosition.LEFT
     || position === SuiTextBlock.relativePosition.RIGHT ?
      blockBox.width + this.currentBlock.text.spacing : 0;
    const params = SuiTextBlock.inlineParamsFromScoreText(scoreText, this.context);
    params.startX = this.currentBlock.text.startX + (xoffset * xcoff);
    params.startY = this.currentBlock.text.startY + (yoffset * ycoff);
    const textBlock = new SuiInlineText(params);
    textBlock.attrs.id = scoreText.attrs.id;
    this.currentBlock = { text: textBlock, position };
    this.currentBlock.text.addTextBlockAt(0, { text: scoreText.text });
    this.inlineBlocks.push(this.currentBlock);
    this.currentBlockIndex += 1;
    this._justify();
  }
}
