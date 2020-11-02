// ## SuiRenderScore
// This module renders the entire score.  It calculates the layout first based on the
// computed dimensions.
// eslint-disable-next-line no-unused-vars
class SuiRenderScore extends SuiRenderState {
  constructor(params) {
    super('SuiRenderScore');
    Vex.Merge(this, SuiRenderState.defaults);
    Vex.Merge(this, params);
    this.setViewport(true);

    this.attrs = {
      id: VF.Element.newID(),
      type: 'testLayout'
    };
  }

  // ### createScoreRenderer
  // ### Description;
  // to get the score to appear, a div and a score object are required.  The layout takes care of creating the
  // svg element in the dom and interacting with the vex library.
  static createScoreRenderer(renderElement, score, layoutParams) {
    const ctorObj = {
      elementId: renderElement,
      score
    };
    if (layoutParams) {
      Vex.Merge(ctorObj, layoutParams);
    }
    const layout = new SuiRenderScore(ctorObj);
    return layout;
  }

  // ### unrenderAll
  // ### Description:
  // Delete all the svg elements associated with the score.
  unrenderAll() {
    this._score.staves.forEach((staff) => {
      this.unrenderStaff(staff);
    });
    $(this.renderer.getContext().svg).find('g.lineBracket').remove();
  }

  get logicalPageWidth() {
    return this.pageMarginWidth;
  }
  get logicalPageHeight() {
    return this.pageMarginHeigh;
  }

  // ### _measureToLeft
  // measure to 'left' is on previous row if this is the first column in a system
  // but we still use it to compute beginning symbols (key sig etc.)
  _measureToLeft(measure) {
    const j = measure.measureNumber.staffId;
    const i = measure.measureNumber.measureIndex;
    return (i > 0 ? this._score.staves[j].measures[i - 1] : null);
  }

  renderTextGroup(gg) {
    if (gg.skipRender) {
      return;
    }
    gg.renderedBox = {};
    gg.logicalBox = {};
    const group = this.context.openGroup();
    group.id = gg.attrs.id;

    gg.textBlocks.forEach((block) => {
      this.renderScoreText(block.text);
      if (typeof(gg.renderedBox.x) === 'undefined') {
        gg.renderedBox = block.text.renderedBox;
        gg.logicalBox =  block.text.logicalBox;
      } else {
        gg.renderedBox = svgHelpers.unionRect(gg.renderedBox, block.text.renderedBox);
        gg.logicalBox = svgHelpers.unionRect(gg.logicalBox, block.text.logicalBox);
      }
    });
    gg.renderedBox.y = gg.renderedBox.y + gg.renderedBox.height;
    this.context.closeGroup();
  }

  renderScoreText(tt) {
    let i = 0;
    let boxed = false;
    const scoreLayout = this.scaledScoreLayout;
    let text = tt.text.replace('###', 1); /// page number
    text = text.replace('@@@', scoreLayout.pages); /// page number
    const args = { svg: this.svg, width: tt.width, height: tt.height, layout: this._score.layout, text };
    if (tt.pagination === SmoScoreText.paginations.once) {
      const block = SuiInlineText.fromScoreText(tt, this.context);
      const blocks = [{ text: block, position: SmoTextGroup.relativePosition.RIGHT }];
      const svgText = new SuiTextBlock({ blocks, context: this.context });
      svgText.render();
      tt.renderedBox = svgText.getRenderedBox();
      tt.logicalBox = svgText.getLogicalBox();
    } else {
      for (i = 0; i < scoreLayout.pages; ++i) {
        if (tt.pagination === SmoScoreText.paginations.even &&
          i % 2 > 0) {
          continue;
        } else if (tt.pagination === SmoScoreText.paginations.odd &&
           i % 2 === 0) {
          continue;
        } else if (tt.pagination === SmoScoreText.paginations.subsequent
           && i === 1) {
          continue;
        }

        const xx = new SmoScoreText(tt);
        xx.classes = 'score-text ' + xx.attrs.id;
        xx.text = xx.text.replace('###', i + 1); /// page number
        xx.text = xx.text.replace('@@@', scoreLayout.pages); /// page number
        xx.y += scoreLayout.pageHeight * i;
        args.text = xx.text;
        const block = SuiInlineText.fromScoreText(xx, this.context);
        const blocks = [{ text: block, position: SmoTextGroup.relativePosition.RIGHT }];
        const svgText = new SuiTextBlock({ blocks, context: this.context });
        svgText.render();
        // Base the rendered box on the first instance
        if (!boxed) {
          tt.renderedBox = svgText.getRenderedBox();
          tt.logicalBox = svgText.getLogicalBox();
          boxed = true;
        }
      }
    }
  }
  _renderScoreModifiers() {
    $(this.renderer.getContext().svg).find('.all-score-text').remove();
    const group = this.context.openGroup();
    group.classList.add('all-score-text');

    this._score.scoreText.forEach((tt) => {
      this.renderScoreText(tt);
    });

    this._score.textGroups.forEach((tg) => {
      this.renderTextGroup(tg);
    });
    this.context.closeGroup();
  }

  // ### calculateBeginningSymbols
  // calculate which symbols like clef, key signature that we have to render in this measure.
  calculateBeginningSymbols(systemIndex, measure, clefLast, keySigLast, timeSigLast, tempoLast) {
    const measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
    measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
    measure.forceTimeSignature = (measure.measureNumber.measureIndex === 0 || measure.timeSignature !== timeSigLast);
    measure.forceTempo = false;
    const tempo = measure.getTempo();
    if (tempo && measure.measureNumber.measureIndex === 0) {
      measure.forceTempo = tempo.display;
    } else if (tempo && tempoLast) {
      if (!SmoTempoText.eq(tempo, tempoLast)) {
        measure.forceTempo = tempo.display;
      }
    } else if (tempo) {
      measure.forceTempo = tempo.display;
    }
    if (measureKeySig !== keySigLast) {
      measure.canceledKeySignature = keySigLast;
      measure.setChanged();
      measure.forceKeySignature = true;
    } else if (systemIndex === 0 && measureKeySig !== 'C') {
      measure.forceKeySignature = true;
    } else {
      measure.forceKeySignature = false;
    }
  }

  _getMeasuresInColumn(ix) {
    const rv = [];
    this.score.staves.forEach((staff) => {
      const inst = staff.measures.find((ss) => ss.measureNumber.measureIndex === ix);
      if (inst) {
        rv.push(inst);
      }
    });
    return rv;
  }
  get scaledScoreLayout() {
    const svgScale = this.score.layout.svgScale;
    const rv = JSON.parse(JSON.stringify(this.score.layout));
    const attrs = ['topMargin', 'bottomMargin', 'interGap', 'intraGap', 'pageHeight', 'pageWidth', 'leftMargin', 'rightMargin'];
    attrs.forEach((attr) => {
      rv[attr] = rv[attr] / svgScale;
    });
    return rv;
  }

  renderAllMeasures() {
    const mscore = {};
    $('.measure-format').remove();
    const printing = $('body').hasClass('print-render');
    this.score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (!mscore[measure.lineIndex]) {
          mscore[measure.lineIndex] = [];
        }
        mscore[measure.lineIndex].push(measure);
      });
    });

    const keys = Object.keys(mscore);
    keys.forEach((key) => {
      const columns = {};
      const vxSystem = new VxSystem(this.context, 0, parseInt(key, 10), this.score);
      mscore[key].forEach((measure) => {
        if (!columns[measure.measureNumber.systemIndex]) {
          columns[measure.measureNumber.systemIndex] = [];
        }
        columns[measure.measureNumber.systemIndex].push(measure);
      });
      const colKeys = Object.keys(columns);
      colKeys.forEach((colKey) => {
        columns[colKey].forEach((measure) => {
          vxSystem.renderMeasure(measure, this.measureMapper);
          const formatIndex = SmoMeasure.formattingOptions.findIndex((option) => measure[option] !== SmoMeasure.defaults[option]);
          if (formatIndex >= 0 && !printing) {
            const at = [];
            at.push({ y: measure.logicalBox.y - 5 });
            at.push({ x: measure.logicalBox.x + 25 });
            at.push({ fontFamily: 'Helvitica' });
            at.push({ fontSize: '8pt' });
            svgHelpers.placeSvgText(this.context.svg, at, 'measure-format', '*');
          }
        });
      });

      vxSystem.renderEndings();
      vxSystem.updateLyricOffsets();
      this._score.staves.forEach((stf) => {
        this._renderModifiers(stf, vxSystem);
      });
    });
    this._renderScoreModifiers();
    this.numberMeasures();
  }

  // ### _justifyY
  // when we have finished a line of music, adjust the measures in the system so the
  // top of the staff lines up.
  _justifyY(svg, scoreLayout, measureEstimate, currentLine) {
    let i = 0;
    // We estimate the staves at the same absolute y value.
    // Now, move them down so the top of the staves align for all measures in a  row.
    for (i = 0; i < measureEstimate.measures.length; ++i) {
      const index = i;
      const rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem === index);
      // lowest staff has greatest staffY value.
      const lowestStaff = rowAdj.reduce((a, b) =>
        a.staffY > b.staffY ? a : b
      );
      const sh = svgHelpers;
      rowAdj.forEach((measure) => {
        const adj = lowestStaff.staffY - measure.staffY;
        measure.setY(measure.staffY + adj);
        measure.setBox(sh.boxPoints(measure.logicalBox.x, measure.logicalBox.y + adj, measure.logicalBox.width, measure.logicalBox.height));
      });
      const rightStaff = rowAdj.reduce((a, b) =>
        a.staffX + a.staffWidth > b.staffX + b.staffWidth ?  a : b);

      const justifyX = Math.round((scoreLayout.pageWidth - (scoreLayout.leftMargin + scoreLayout.rightMargin + rightStaff.staffX + rightStaff.staffWidth))
           / rowAdj.length);
      const ld = layoutDebug;
      rowAdj.forEach((measure) => {
        measure.setWidth(measure.staffWidth + justifyX, '_estimateMeasureDimensions justify');
        const offset = measure.measureNumber.systemIndex * justifyX;
        measure.setX(measure.staffX + offset);
        measure.setBox(sh.boxPoints(measure.logicalBox.x + offset, measure.logicalBox.y, measure.staffWidth, measure.logicalBox.height));
        ld.debugBox(svg, measure.logicalBox, 'adjust');
      });
    }
  }

  // ### _checkPageBreak
  // See if this line breaks the page boundary
  _checkPageBreak(scoreLayout, currentLine, bottomMeasure) {
    let pageAdj = 0;
    // See if this measure breaks a page.
    const maxY = bottomMeasure.logicalBox.y +  bottomMeasure.logicalBox.height;
    if (maxY > (scoreLayout.pages * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
      // When adjusting the page, make it so the top staff of the system
      // clears the bottom of the page.
      const topMeasure = currentLine.reduce((a, b) =>
        a.logicalBox.y < b.logicalBox.y ? a : b
      );
      const minMaxY = topMeasure.logicalBox.y;
      pageAdj = (scoreLayout.pages * scoreLayout.pageHeight) - minMaxY;
      pageAdj = pageAdj + scoreLayout.topMargin;
      scoreLayout.pages += 1;
      currentLine.forEach((measure) => {
        measure.setBox(svgHelpers.boxPoints(
          measure.logicalBox.x, measure.logicalBox.y + pageAdj, measure.logicalBox.width, measure.logicalBox.height));
        measure.setY(measure.staffY + pageAdj);
      });
    }
  }

  layout() {
    let measureIx = 0;
    let systemIndex = 0;
    let y = 0;
    let x = 0;
    let lineIndex = 0;
    let currentLine = []; // the system we are esimating
    let measureEstimate = {};

    layoutDebug.clearDebugBoxes('pre');
    layoutDebug.clearDebugBoxes('post');
    layoutDebug.clearDebugBoxes('adjust');
    layoutDebug.clearDebugBoxes('system');
    layoutDebug.clearDebugBoxes('note');
    const svg = this.context.svg;
    const scoreLayout = this.scaledScoreLayout;
    scoreLayout.pages = 1;

    y = scoreLayout.topMargin;
    x = scoreLayout.leftMargin;

    while (measureIx < this.score.staves[0].measures.length) {
      measureEstimate = this._estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
      x = measureEstimate.x;

      if (systemIndex > 0 &&
        (measureEstimate.measures[0].getForceSystemBreak() || measureEstimate.x > (scoreLayout.pageWidth - scoreLayout.leftMargin))) {
        this._justifyY(svg, scoreLayout, measureEstimate, currentLine);
        // find the measure with the lowest y extend (greatest y value), not necessarily one with lowest
        // start of staff.
        const bottomMeasure = currentLine.reduce((a, b) =>
          a.logicalBox.y + a.logicalBox.height > b.logicalBox.y + b.logicalBox.height ? a : b
        );

        this._checkPageBreak(scoreLayout, currentLine, bottomMeasure);

        const ld = layoutDebug;
        const sh = svgHelpers;
        if (layoutDebug.mask & layoutDebug.values.system) {
          currentLine.forEach((measure) => {
            ld.debugBox(svg, measure.logicalBox, 'system');
            ld.debugBox(svg, sh.boxPoints(measure.staffX, measure.logicalBox.y, measure.adjX, measure.logicalBox.height), 'post');
          });
        }

        // Now start rendering on the next system.
        y = bottomMeasure.logicalBox.height + bottomMeasure.logicalBox.y + this.score.layout.interGap;
        currentLine = [];
        systemIndex = 0;
        x = scoreLayout.leftMargin;
        lineIndex += 1;
        measureEstimate = this._estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
        x = measureEstimate.x;
      }
      // ld declared for lint
      const ld = layoutDebug;
      measureEstimate.measures.forEach((measure) => {
        ld.debugBox(svg, measure.logicalBox, 'pre');
      });

      currentLine = currentLine.concat(measureEstimate.measures);
      measureIx += 1;
      systemIndex += 1;
      // If this is the last measure but we have not filled the x extent,
      // still justify the vertical staves and check for page break.
      if (measureIx >= this.score.staves[0].measures.length) {
        this._justifyY(svg, scoreLayout, measureEstimate, currentLine);
        const bottomMeasure = currentLine.reduce((a, b) =>
          a.logicalBox.y + a.logicalBox.height > b.logicalBox.y + b.logicalBox.height ? a : b
        );
        this._checkPageBreak(scoreLayout, currentLine, bottomMeasure);
      }
    }
    if (scoreLayout.pages !== this.score.layout.pages) {
      this.score.layout.pages = scoreLayout.pages;
      this.setViewport(true);
    }
    this.renderAllMeasures();
  }

  // ### _estimateColumns
  // the new logic to estimate the dimensions of a column of music, corresponding to
  // a certain measure index.
  // returns:
  // {measures,y,x}  the x and y at the left/bottom of the render
  _estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y) {
    const s = {};
    let measureToLeft = {};
    const measures = this._getMeasuresInColumn(measureIx);
    let rowInSystem = 0;
    measures.forEach((measure) => {
      smoBeamerFactory.applyBeams(measure);
      measure.measureNumber.systemIndex = systemIndex;
      measure.svg.rowInSystem = rowInSystem;
      measure.lineIndex = lineIndex;

      // use measure to left to figure out whether I need to render key signature, etc.
      // If I am the first measure, just use self and we always render them on the first measure.
      measureToLeft = this._measureToLeft(measure);
      if (!measureToLeft) {
        measureToLeft = measure;
      }
      s.measureKeySig = smoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
      s.keySigLast = smoMusic.vexKeySignatureTranspose(measureToLeft.keySignature, measure.transposeIndex);
      s.tempoLast = measureToLeft.getTempo();
      s.timeSigLast = measureToLeft.timeSignature;
      s.clefLast = measureToLeft.clef;
      this.calculateBeginningSymbols(systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast, s.tempoLast);

      // calculate vertical offsets from the baseline
      const offsets = suiLayoutAdjuster.estimateMeasureHeight(measure, this.score.layout);
      measure.setYTop(offsets.aboveBaseline);
      measure.setY(y - measure.yTop, '_estimateColumns height');
      measure.setX(x);

      // Add custom width to measure:
      measure.setBox(svgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, offsets.belowBaseline - offsets.aboveBaseline));
      suiLayoutAdjuster.estimateMeasureWidth(measure);
      y = y + measure.logicalBox.height + scoreLayout.intraGap;
      rowInSystem += 1;
    });

    // justify this column to the maximum width
    const maxMeasure = measures.reduce((a, b) => a.staffX + a.staffWidth > b.staffX + b.staffWidth ? a : b);
    const maxX = maxMeasure.staffX + maxMeasure.staffWidth;
    const maxAdjMeasure = measures.reduce((a, b) => a.adjX > b.adjX  ? a : b);
    const maxAdj = maxAdjMeasure.adjX;
    measures.forEach((measure) => {
      measure.setWidth(measure.staffWidth + (maxX - (measure.staffX + measure.staffWidth)));
      measure.adjX = maxAdj;
    });
    const rv = { measures, y, x: maxX };
    return rv;
  }
}
