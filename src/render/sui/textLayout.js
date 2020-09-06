// ## SuiInlineText
// Inline text is a block of SVG text with the same font.  Each block can
// contain eithr text or an svg glyph.  Each block in the text has its own
// metrics so we can support inline svg text editors (cursor)
class SuiInlineText {
  static get textTypes() {
    return {normal:0,superScript:1,subScript:2};
  }
  static get symbolTypes() {
    return {
      GLYPH: 1,
      TEXT: 2,
      LINE: 3
    };
  }
  static get superscriptOffset() {
    return VF.ChordSymbol.chordSymbolMetrics.global.superscriptOffset / VF.ChordSymbol.engravingFontResolution;
  }

  static get subscriptOffset() {
    return VF.ChordSymbol.chordSymbolMetrics.global.subscriptOffset / VF.ChordSymbol.engravingFontResolution;
  }

  get spacing() {
    return this.fontMetrics.spacing / this.fontMetrics.resolution;
  }


  static get defaults() {
    return {
      blocks: [],
      fontFamily: 'robotoSlab',
      fontSize: 14,
      startX: 100,
      startY: 100,
      fontWeight:500,
      scale: 1,
      activeBlock:-1
    };
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
  }
  get fontMetrics() {
    return VF.DEFAULT_FONT_STACK[0].name === 'Petaluma' ?
      VF.PetalumaScriptMetrics : VF.RobotoSlabMetrics;
  }

  static get blockDefaults() {
    return {
      symbolType: SuiInlineText.symbolTypes.TEXT,
      textType: SuiInlineText.textTypes.normal
    };
  }

  // ### pointsToPixels
  // The font size is specified in points, convert to 'pixels' in the svg space
  get pointsToPixels() {
    return (this.fontSize / 72) / (1 / 96);
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

  // ### _calculateBlockIndex
  // Based on the font metrics, compute the width of the strings and glyph that make up
  // this block.
  _calculateBlockIndex() {
    var curX = this.startX;
    var maxH = 0;
    this.blocks.forEach((block) => {
      block.width = 0;
      block.height = 0;

      block.scale = block.textType === SuiInlineText.textTypes.normal ? 1.0 : VF.ChordSymbol.superSubRatio;
      block.x = curX;
      if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
        for (var i = 0;i < block.text.length;++i) {
          var metrics = this.fontMetrics;
          var ch = block.text[i];
          var glyph = metrics.glyphs[ch] ? metrics.glyphs[ch] : metrics.glyphs['H'];
          block.width += ((glyph.advanceWidth) / metrics.resolution) * this.pointsToPixels * block.scale;
          const blockHeight = (glyph.ha / metrics.resolution) *  this.pointsToPixels * block.scale;
          block.height = block.height < blockHeight ? blockHeight : block.height;
        }
      } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
        block.width = (block.metrics.advanceWidth / VF.ChordSymbol.engravingFontResolution) * this.pointsToPixels * block.scale;
        block.height = (block.glyph.metrics.ha / VF.ChordSymbol.engravingFontResolution) * this.pointsToPixels * block.scale;
      }
      curX += block.width;
      block.y = this.startY;  // TODO: multi-line
      maxH = block.height > maxH ? maxH : block.height;
    });
    this.width = curX - this.startX;
    this.height = maxH;
  }

  getBoundingBox() {
    var rv = {};
    this.blocks.forEach((block) => {
      if (!rv.x) {
        rv = svgHelpers.smoBox(block);
      } else {
        rv = svgHelpers.unionRect(rv,block);
      }

    });
    return rv;
  }

  _getTextBlock(params) {
    const block = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    Vex.Merge(block, params);
    block.text = params.text;
    return block;
  }
  setStart
  renderCursorAt(position) {
    var group = this.context.openGroup();
    group.id = 'inlineCursor';
    if (this.blocks.length <= position || position < 0) {
      const h = this.fontSize;
      svgHelpers.renderCursor(group, this.startX,this.startY - h,h);
      this.context.closeGroup();
      return;
    }
    var block = this.blocks[position];
    svgHelpers.renderCursor(group, block.x + block.width,block.y - block.height,block.height);
    this.context.closeGroup();
  }
  removeCursor() {
    $('svg #inlineCursor').remove();
  }
  render() {
    $('svg #'+this.attrs.id).remove();
    this.context.setFont(this.fontFamily, this.fontSize, this.fontWeight);
    var group = this.context.openGroup();
    var mmClass = "suiInlineText";
    group.classList.add(this.attrs.id);
    group.classList.add(mmClass);
    group.id=this.attrs.id;

    this.blocks.forEach((block) => {
      this._drawBlock(block);
    });
    this.context.closeGroup();
  }
  _addBlockAt(position,block) {
    if (position >= this.blocks.length) {
      this.blocks.push(block);
    } else {
      this.blocks.splice(position,0,block);
    }
  }
  // ### addTextBlockAt
  // Add a text block to the line of text.
  // params must contain at least:
  // {text:'xxx'}
  addTextBlockAt(position,params) {
    const block = this._getTextBlock(params);
    this._addBlockAt(position,block);
    this._calculateBlockIndex();
  }
  _getGlyphBlock(params) {
    const block = JSON.parse(JSON.stringify(SuiInlineText.blockDefaults));
    block.symbolType = SuiInlineText.symbolTypes.GLYPH;
    block.glyphCode = params.glyphCode;
    block.glyph = new VF.Glyph(block.glyphCode, this.fontSize);
    block.metrics = VF.ChordSymbol.getMetricForGlyph(block.glyphCode);
    return block;
  }
  // ### addGlyphBlockAt
  // Add a glyph block to the line of text.  Params must include:
  // {glyphCode:'csymDiminished'}
  addGlyphBlockAt(position,params) {
    const block = this._getGlyphBlock(params);
    this._addBlockAt(position,block);
    this._calculateBlockIndex();
  }
  isSuperscript(block) {
    return block.textType === SuiInlineText.textTypes.superScript;
  }
  isSubcript(block) {
    return block.textType === SuiInlineText.textTypes.subScript;
  }

  _drawBlock(block) {
    const sp = this.isSuperscript(block);
    const sub = this.isSubcript(block);
    let y = block.y;
    if (block.symbolType === SuiInlineText.symbolTypes.TEXT) {
      if (sp || sub) {
        this.context.save();
        this.context.setFont(this.fontFamily, this.fontSize * VF.ChordSymbol.superSubRatio, this.fontWeight);
        y = y + (sp ? SuiInlineText.superscriptOffset : SuiInlineText.subscriptOffset) * this.pointsToPixels * block.scale;
      }
      this.context.fillText(block.text,block.x,y);
      if (sp || sub) {
        this.context.restore();
        y = y + (sp ? SuiInlineText.superscriptOffset : SuiInlineText.subscriptOffset) * this.pointsToPixels * block.scale;
      }
    } else if (block.symbolType === SuiInlineText.symbolTypes.GLYPH) {
      if (sp || sub) {
        y = y + (sp ? SuiInlineText.superscriptOffset : SuiInlineText.subscriptOffset) * this.pointsToPixels * block.scale;
      }
      block.glyph.render(this.context, block.x, y);
    }
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
    const startBlock = new SuiInlineText(params);
    this.currentBlock = {text: startBlock,position: SmoTextGroup.relativePosition.LEFT};
    this.currentBlockIndex = 0;
    this.inlineBlocks.push(this.currentBlock);
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
    this.inlineBlocks.forEach((block) => {
      block.text.render();
    });
  }
  static inlineParamsFromScoreText(scoreText,context) {
    var pointSize = scoreText.fontInfo.pointSize ? scoreText.fontInfo.pointSize
      : SmoScoreText.fontPointSize(scoreText.fontInfo.size);
    const rv = { fontFamily:scoreText.fontInfo.family,
      startX: scoreText.x, startY: scoreText.y,
      fontSize: pointSize, context: context };
    return rv;
  }
  static fromScoreText(scoreText,context) {
    var params = SuiTextBlock.inlineParamsFromScoreText(scoreText,context);
    const rv = new SuiTextBlock( params );
    rv.currentBlock.text.attrs.id = scoreText.attrs.id;  // set id so svg id matches
    rv.currentBlock.text.addTextBlockAt(0,{text: scoreText.text});
    return rv;
  }
  getBoundingBox() {
    var rv = {};
    this.inlineBlocks.forEach((block) => {
      if (!rv.x) {
        rv = block.text.getBoundingBox();
      } else {
        rv = svgHelpers.unionRect(rv,block.text.getBoundingBox());
      }
    });
    rv.y = rv.y - rv.height;
    return svgHelpers.logicalToClient(this.context.svg,rv);
  }
  static fromTextGroup(tg,context) {
    var rv = null;
    var params = {context:context};
    tg.textBlocks.forEach((st) => {
      if (!rv) {
        rv = SuiTextBlock.fromScoreText(st.text,context);
        rv.justification = tg.justification;
      } else {
        rv.addBlockPosition(st.text,st.position);
      }
    });
    return rv;
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
    var blockBox = this.currentBlock.text.getBoundingBox();
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

class suiTextLayout {

	static _getTextBox(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
			return svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		}
		return svgHelpers.getTextBox(svg,scoreText.toSvgAttributes(),scoreText.classes,scoreText.text);
	}
	static _saveBox(scoreText,parameters,el) {
		var svg = parameters.svg;
		 var box = svgHelpers.smoBox(el.getBoundingClientRect());
		 var lbox = svgHelpers.clientToLogical(svg,box);
		 scoreText.renderedBox = {
			x: box.x,
			y: box.y,
			height: box.height,
			width: box.width
		};
		scoreText.logicalBox = lbox;
	}
	static titleTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.layout.topMargin;
		parameters.layout.topMargin += bbox.height;
		scoreText.autoLayout=false; // use custom placement or calculated placement next time
		suiTextLayout.placeText(scoreText,parameters);
	}

	static headerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=10;
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}

	static footerTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width/2-(bbox.width/2);
		scoreText.y=parameters.height-(bbox.height+10);
		scoreText.autoLayout=false;
		suiTextLayout.placeText(scoreText,parameters);
	}

	static copyrightTextPlacement(scoreText,parameters) {
		var svg = parameters.svg;
		var bbox = suiTextLayout._getTextBox(scoreText,parameters);
		scoreText.x=parameters.width-(bbox.width+10);
		scoreText.y=10;
		suiTextLayout.placeText(scoreText,parameters);
		scoreText.autoLayout=false;
	}

	static placeText(scoreText,parameters) {
		var svg = parameters.svg;
		if (scoreText.width && scoreText.height && scoreText.boxModel == SmoScoreText.boxModels.wrap) {
    		suiTextLayout.placeWithWrap(scoreText,parameters);
		} else {
			var el = svgHelpers.placeSvgText(svg,scoreText.toSvgAttributes(),scoreText.classes,parameters.text,scoreText.attrs.id);
            suiTextLayout._saveBox(scoreText,parameters,el);
		}
	}


	static _placeWithWrap(scoreText,parameters,justification) {
		var justifyOnly=false;
		if (!justification.length) {
			justifyOnly=true;
		}
		var svg = parameters.svg;
		var words = scoreText.text.split(' ');
		var curx = scoreText.x;
		var left = curx;
		var right = scoreText.x+scoreText.width;
		var top = scoreText.y;
		var params = scoreText.backupParams();
		var cury = scoreText.y;
		var width=	scoreText.width;
		var height = scoreText.height;
		var delta = 0;
		params.boxModel = SmoScoreText.boxModels.none;
		params.width=0;
		params.height = 0;
		scoreText.logicalBox=svgHelpers.boxPoints(scoreText.x,scoreText.y,scoreText.width,scoreText.height);
		scoreText.renderedBox = svgHelpers.logicalToClient(svg,scoreText.logicalBox);
		var justifyAmount = justifyOnly ? 0 : justification[0];
		if(!justifyOnly) {
		    justification.splice(0,1);
		}

		words.forEach((word) => {
			var bbox = svgHelpers.getTextBox(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
			delta = right - (bbox.width + bbox.x);
			if (delta > 0) {
				params.x=bbox.x;
				params.y=cury;
				if (!justifyOnly) {
                   params.x += justifyAmount;
				   svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				}
			} else {
				if (!justifyOnly) {
					justifyAmount = justification[0];
				    justification.splice(0,1);
				} else {
					// If we are computing for justification, do that.
					delta = right - bbox.x;
					delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
					justification.push(delta);
				}
				cury += bbox.height;
				curx = left;
				params.x=curx + justifyAmount;
				params.y=cury;
				if (!justifyOnly) {
				    svgHelpers.placeSvgText(svg,SmoScoreText.toSvgAttributes(params),scoreText.classes,word);
				}
			}
			curx += bbox.width + 5;
			params.x = curx;
			// calculate delta in case this is last time
			delta = right - curx;
		});
		delta = scoreText.justification === SmoScoreText.justifications.right ? delta :
					    (scoreText.justification === SmoScoreText.justifications.center ? delta/2 : 0);
        justification.push(delta-5);
	}
	static placeWithWrap(scoreText,parameters) {
		var justification=[];

		// One pass is to compute justification for the box model.
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
		suiTextLayout._placeWithWrap(scoreText,parameters,justification);
	}

}
