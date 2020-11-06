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

  // List height top to bottom
  static get textTypeRelativeHeight() {
    const rv = {};
    rv[SuiInlineText.textTypes.superScript] = 1;
    rv[SuiInlineText.textTypes.normal] = 0;
    rv[SuiInlineText.textTypes.subScript] = -1;
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
    for (i = 0;i < SuiInlineText.textTypeTransitions.length; ++i) {
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
    for (i = 0;i < SuiInlineText.textTypeTransitions.length; ++i) {
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
      throw('context for SVG must be set');
    }
    this.updateFontInfo();
  }

  static fromScoreText(scoreText,context) {
    var pointSize = scoreText.fontInfo.pointSize ? scoreText.fontInfo.pointSize
      : SmoScoreText.fontPointSize(scoreText.fontInfo.size);
    const params = { fontFamily: scoreText.fontInfo.family,
      fontWeight: scoreText.fontInfo.weight,
      fontStyle: scoreText.fontInfo.style,
      startX: scoreText.x, startY: scoreText.y,
      fontSize: pointSize, context: context};
    let rv = new SuiInlineText(params);
    rv.attrs.id = scoreText.attrs.id;
    rv.addTextBlockAt(0, { text: scoreText.text});
    return rv;
  }

  get fontMetrics() {
    return this;
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
      const subOffset =  sp ? SuiInlineText.superscriptOffset * this.pointsToPixels : (sub ? SuiInlineText.subscriptOffset * this.pointsToPixels : 0);
      const glyphAdj = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? 2.0 : 1.0;
      block.x = curX;
      if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
        for (i = 0;i < block.text.length;++i) {
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
    var rv = {};
    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }
    var adjBox = (box) => {
      const nbox = svgHelpers.smoBox(box);
      nbox.y = nbox.y - nbox.height;
      return nbox;
    }
    this.blocks.forEach((block) => {
      if (!rv.x) {
        rv = svgHelpers.smoBox(adjBox(block));
      } else {
        rv = svgHelpers.unionRect(rv,adjBox(block));
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
    var group = this.context.openGroup();
    group.id = 'inlineCursor';
    let h = this.fontSize;
    if (this.blocks.length <= position || position < 0) {
      svgHelpers.renderCursor(group, this.startX,this.startY - h,h);
      this.context.closeGroup();
      return;
    }
    var block = this.blocks[position];
    adjH = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? h/2 : h;
    // For glyph, add y adj back to the cursor since it's not a glyph
    adjY = block.symbolType === SuiInlineText.symbolTypes.GLYPH ? block.y - this._glyphOffset(block) :
      block.y;
    if (typeof(textType) === 'number' && textType != SuiInlineText.textTypes.normal) {
      const ratio = textType !== SuiInlineText.textTypes.normal ? VF.ChordSymbol.superSubRatio : 1.0 ;
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
    $('svg #'+this.attrs.id).remove();
  }
  getIntersectingBlocks(box, scroller) {
    if (!this.artifacts) {
      return [];
    }
    return svgHelpers.findIntersectingArtifact(box,this.artifacts,scroller);
  }
  _addBlockAt(position,block) {
    if (position >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(position,0,block);
    }
  }
  removeBlockAt(position) {
    this.blocks.splice(position,1);
    this.updatedMetrics = false;
  }

  // ### addTextBlockAt
  // Add a text block to the line of text.
  // params must contain at least:
  // {text:'xxx'}
  addTextBlockAt(position,params) {
    const block = this._getTextBlock(params);
    this._addBlockAt(position,block);
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
  addGlyphBlockAt(position,params) {
    const block = this._getGlyphBlock(params);
    this._addBlockAt(position,block);
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
  setHighlight(block,value) {
    block.highlighted = value;
  }

  rescale(scale) {
    scale = (scale * this.fontSize < 6) ? 6 / this.fontSize : scale;
    scale = (scale * this.fontSize > 72) ? 72/this.fontSize : scale;
    this.blocks.forEach((block) => {
      block.scale = scale;
    });
    this.updatedMetrics = false;
  }

  render() {
    $('svg #'+this.attrs.id).remove();

    if (!this.updatedMetrics) {
      this._calculateBlockIndex();
    }

    this.context.setFont(this.fontFamily, this.fontSize, this.fontWeight);
    var group = this.context.openGroup();
    var mmClass = "suiInlineText";
    group.classList.add('vf-'+this.attrs.id);
    group.classList.add(this.attrs.id);
    group.classList.add(mmClass);
    group.id=this.attrs.id;
    this.artifacts = [];
    var ix = 0;

    this.blocks.forEach((block) => {
      var bg = this.context.openGroup();
      bg.classList.add('textblock-'+this.attrs.id+ix);
      this._drawBlock(block);
      this.context.closeGroup();
      var artifact = {block: block};
      artifact.box = svgHelpers.smoBox(bg.getBoundingClientRect());
      artifact.index = ix;
      this.artifacts.push(artifact);
      ix += 1;
    });
    this.context.closeGroup();
    this.renderedBox = svgHelpers.smoBox(group.getBoundingClientRect());
    this.logicalBox = svgHelpers.smoBox(group.getBBox());
  }

  _drawBlock(block) {
    const sp = this.isSuperscript(block);
    const sub = this.isSubcript(block);
    const highlight = this.getHighlight(block);
    let y = block.y;

    if (highlight) {
      this.context.save();
      this.context.setFillStyle('#999');
    }

    // This is how svgcontext expects to get 'style'
    const weight = this.fontWeight + ',' + this.fontStyle;

    if (sp || sub) {
      // y = y + (sp ? SuiInlineText.superscriptOffset : SuiInlineText.subscriptOffset) * this.pointsToPixels * block.scale;
      this.context.save();
      this.context.setFont(this.fontFamily, this.fontSize * VF.ChordSymbol.superSubRatio * block.scale, weight);
    } else {
      this.context.setFont(this.fontFamily, this.fontSize * block.scale, weight);
    }
    if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
      this.context.fillText(block.text,block.x,y);
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
    var rv ='';
    this.blocks.forEach((block) => {
      rv += block.text;
    });
    return rv;
  }
}

// ## SuiTextBlock
// A text block is a set of inline blocks that can be aligned/arranged in different ways.
class SuiTextBlock {
  static get relativePosition() {
    return { ABOVE:SmoTextGroup.relativePosition.ABOVE,
      BELOW: SmoTextGroup.relativePosition.BELOW,
      LEFT: SmoTextGroup.relativePosition.LEFT,
      RIGHT: SmoTextGroup.relativePosition.RIGHT
    };
  }
  constructor(params) {
    this.inlineBlocks = [];
    this.context = params.context;
    this.skipRender = false; // used when editing the text
    if (!params.blocks) {
      const inst = new SuiInlineText(params);
      params.blocks = [{ text: inst, position: SmoTextGroup.relativePosition.RIGHT }];
    }
    params.blocks.forEach((block) => {
      // const position = block.position ? block.position : SmoTextGroup.relativePosition.RIGHT;
      // const ib = {text:block, position: position};
      if (!this.currentBlock) {
        this.currentBlock = block;
        this.currentBlockIndex = 0;
      }
      this.inlineBlocks.push(block);
    });
    this.justification = params.justification ? params.justification :
      SmoTextGroup.justifications.LEFT;
  }
  addTextAt(position,params) {
    this.currentBlock.text.addTextBlockAt(position,params);
  }
  addGlyphAt(position,params) {
    this.currentBlock.text.addGlyphBlockAt(position,params);
  }
  render() {
    this.unrender();
    this.renderedBox = null;
    this.logicalBox = null;
    this.inlineBlocks.forEach((block) => {
      block.text.render();
      if (!this.renderedBox) {
        this.renderedBox = svgHelpers.smoBox(block.text.renderedBox);
        this.logicalBox = svgHelpers.smoBox(block.text.logicalBox);
      } else {
        this.renderedBox = svgHelpers.unionRect(this.renderedBox,block.text.renderedBox);
        this.logicalBox = svgHelpers.unionRect(this.logicalBox,block.text.logicalBox);
      }
    });
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
    var rv = 0;
    this.inlineBlocks.forEach((block) => {
      const blockHeight = block.text.maxFontHeight(scale);
      rv = blockHeight > rv ? blockHeight : rv;
    });
    return rv;
  }

  static inlineParamsFromScoreText(scoreText,context) {
    var pointSize = scoreText.fontInfo.pointSize ? scoreText.fontInfo.pointSize
      : SmoScoreText.fontPointSize(scoreText.fontInfo.size);
    const rv = { fontFamily:scoreText.fontInfo.family,
      startX: scoreText.x, startY: scoreText.y,
      fontSize: pointSize, context: context };
    return rv;
  }
  static blockFromScoreText(scoreText,context, position) {
    var inlineText = SuiInlineText.fromScoreText(scoreText, context);
    return  {text: inlineText, position: position};
  }

  getLogicalBox() {
    return this._calculateBoundingClientRect();
  }
  getRenderedBox() {
    return svgHelpers.logicalToClient(this.context.svg,this._calculateBoundingClientRect());
  }
  _calculateBoundingClientRect() {
    var rv = {};
    this.inlineBlocks.forEach((block) => {
      if (!rv.x) {
        rv = block.text.getLogicalBox();
      } else {
        rv = svgHelpers.unionRect(rv,block.text.getLogicalBox());
      }
    });
    rv.y = rv.y - rv.height;
    return rv;
  }
  static fromTextGroup(tg,context) {
    var rv = null;
    let blocks = [];

    // Create an inline block for each ScoreText
    tg.textBlocks.forEach((stBlock) => {
      const st = stBlock.text;
      blocks.push(SuiTextBlock.blockFromScoreText(st,context, stBlock.position));
    });
    return new SuiTextBlock({blocks: blocks, justification: tg.justification, context: context});
  }
  unrender() {
    this.inlineBlocks.forEach((block) => {
      var selector = '#'+block.text.attrs.id;
      $(selector).remove();
    });
  }
  _justify() {
    if (!this.inlineBlocks.length) {
      return;
    }
    var minx = this.inlineBlocks[0].text.startX;
    var maxx = 0;
    var maxwidth = 0;
    var vert = {};
    var lvl = 0;
    this.inlineBlocks.forEach((inlineBlock) => {
      const block = inlineBlock.text;
      minx = block.startX < minx ? block.startX : minx;
      maxx = (block.startX + block.width) > maxx ? block.startX + block.width : maxx;
      lvl = inlineBlock.position === SmoTextGroup.relativePosition.ABOVE ? lvl + 1 : lvl;
      lvl = inlineBlock.position === SmoTextGroup.relativePosition.BELOW ? lvl - 1 : lvl;
      if (!vert[lvl] ) {
        vert[lvl] = {};
        vert[lvl].blocks = [ block ];
        vert[lvl].minx = block.startX;
        vert[lvl].maxx = block.startX + block.width;
        maxwidth = vert[lvl].width = block.width;
      }  else {
        vert[lvl].blocks.push(block);
        vert[lvl].minx = vert[lvl].minx < block.startX ? vert[lvl].minx : block.startX;
        vert[lvl].maxx = vert[lvl].maxx > (block.startX + block.width) ?
          vert[lvl].maxx : (block.startX + block.width);
        vert[lvl].width += block.width;
        maxwidth = maxwidth > vert[lvl].width ? maxwidth : vert[lvl].width;
      }
    });
    var levels = Object.keys(vert);
    levels.forEach((level) => {
      var vobj = vert[level];
      var left = 0;
      if (this.justification === SmoTextGroup.justifications.LEFT) {
        left = minx - vobj.minx;
      } else if (this.justification === SmoTextGroup.justifications.RIGHT) {
        left = maxx - vobj.maxx;
      } else {
        left = ( maxwidth / 2 ) - (vobj.width / 2);
        left +=  minx - vobj.minx;
      }
      vobj.blocks.forEach((block) => {
        block.offsetStartX(left);
      });
    });
  }
  addBlockPosition(scoreText,position) {
    var blockBox = this.currentBlock.text.getRenderedBox();
    position = position ? position : SuiTextBlock.relativePosition.BELOW;
    var ycoff = position === SuiTextBlock.relativePosition.ABOVE ? -1 : 1;
    var xcoff = position === SuiTextBlock.relativePosition.LEFT ? -1 : 1;
    var yoffset = position === SuiTextBlock.relativePosition.ABOVE
      || position === SuiTextBlock.relativePosition.BELOW ?
       blockBox.height + this.currentBlock.text.spacing : 0;
    var xoffset = position === SuiTextBlock.relativePosition.LEFT
     || position === SuiTextBlock.relativePosition.RIGHT ?
      blockBox.width + this.currentBlock.text.spacing : 0;
    const params = SuiTextBlock.inlineParamsFromScoreText(scoreText,this.context);
    params.startX = this.currentBlock.text.startX + (xoffset * xcoff);
    params.startY = this.currentBlock.text.startY + (yoffset * ycoff);
    const textBlock = new SuiInlineText(params);
    textBlock.attrs.id = scoreText.attrs.id;
    this.currentBlock = { text: textBlock,position: position };
    this.currentBlock.text.addTextBlockAt(0,{text: scoreText.text});
    this.inlineBlocks.push(this.currentBlock);
    this.currentBlockIndex += 1;
    this._justify();
  }
}
