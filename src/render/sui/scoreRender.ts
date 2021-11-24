// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../../smo/data/music';
import { SvgBox } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoScore } from '../../smo/data/score';
import { SmoTempoText, SmoMeasureFormat, TimeSignature } from '../../smo/data/measureModifiers';
import { ScaledPageLayout, SmoTextGroup, SmoPageLayout, SmoLayoutManager } from '../../smo/data/scoreModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoBeamer } from '../../smo/xform/beamers';

import { SuiRenderState, ScoreRenderParams } from './renderState';
import { VxSystem } from '../vex/vxSystem';
import { SvgHelpers } from './svgHelpers';
import { SuiPiano } from './piano';
import { suiLayoutFormatter } from './formatter';
import { SuiTextBlock } from './textRender';
import { layoutDebug } from './layoutDebug';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';

declare var $: any;
const VF = eval('Vex.Flow');

export interface MeasureEstimate {
  measures: SmoMeasure[], x: number, y: number
}

/**
 * This module renders the entire score.  It calculates the layout first based on the
 * computed dimensions.
  * @category SuiRender
**/
export class SuiScoreRender extends SuiRenderState {  
  constructor(params: ScoreRenderParams) {
    super('SuiScoreRender');
    this.elementId = params.elementId;
    this.score = params.score;
    this.attrs = {
      id: VF.Element.newID(),
      type: 'testLayout'
    };
    this.setViewport(true);
  }
  startRenderTime: number = 0;
  currentPage: number = 0;

  // ### createScoreRenderer
  // ### Description;
  // to get the score to appear, a div and a score object are required.  The layout takes care of creating the
  // svg element in the dom and interacting with the vex library.
  static createScoreRenderer(renderElement: Element, score: SmoScore): SuiScoreRender {
    const ctorObj: ScoreRenderParams = {
      elementId: renderElement,
      score
    };
    const renderer = new SuiScoreRender(ctorObj);
    return renderer;
  }

  // ### unrenderAll
  // ### Description:
  // Delete all the svg elements associated with the score.
  unrenderAll() {
    if (!this.score) {
      return;
    }
    this.score.staves.forEach((staff) => {
      this.unrenderStaff(staff);
    });
    $(this.renderer.getContext().svg).find('g.lineBracket').remove();
  }

  // ### _measureToLeft
  // measure to 'left' is on previous row if this is the first column in a system
  // but we still use it to compute beginning symbols (key sig etc.)
  _measureToLeft(measure: SmoMeasure) {
    const j = measure.measureNumber.staffId;
    const i = measure.measureNumber.measureIndex;
    if (!this.score || this.score.staves.length <= j) {
      console.log('no staff');
    }
    return (i > 0 ? this.score!.staves[j].measures[i - 1] : null);
  }

  renderTextGroup(gg: SmoTextGroup) {
    let ix = 0;
    let jj = 0;
    if (gg.skipRender || this.score === null || this.measureMapper === null) {
      return;
    }
    gg.renderedBox = SvgBox.default;
    gg.logicalBox = SvgBox.default;
    const group = this.context.openGroup();
    group.id = gg.attrs.id;
    const scaledScoreLayout = this.score!.layoutManager!.getScaledPageLayout(0);

    // If this is a per-page score text, get a text group copy for each page.
    // else the array contains the original.
    const groupAr = SmoTextGroup.getPagedTextGroups(gg, this.score!.layoutManager!.pageLayouts.length, scaledScoreLayout.pageHeight);
    groupAr.forEach((newGroup) => {
      // If this text is attached to the measure, base the block location on the rendered measure location.
      if (newGroup.attachToSelector) {
        // If this text is attached to a staff that is not visible, don't draw it.
        const mappedStaff = this.score!.staves.find((staff) => staff.getMappedStaffId() === newGroup.selector!.staff);
        if (!mappedStaff) {
          return;
        }
        // Indicate the new map;
        // newGroup.selector.staff = mappedStaff.staffId;        
        const mmSel: SmoSelection | null = SmoSelection.measureSelection(this.score!, mappedStaff.staffId, newGroup.selector!.measure);
        if (mmSel) {
          const mm = mmSel.measure;
          if (mm.svg.logicalBox.width > 0) {
            const xoff = mm.svg.logicalBox.x + newGroup.musicXOffset;
            const yoff = mm.svg.logicalBox.y + newGroup.musicYOffset;
            newGroup.textBlocks[0].text.x = xoff;
            newGroup.textBlocks[0].text.y = yoff;
          }
        }
      }
      const block = SuiTextBlock.fromTextGroup(newGroup, this.renderer.getContext(), this.measureMapper!.scroller);
      block.render();
      // For the first one we render, use that as the bounding box for all the text, for
      // purposes of mapper/tracker
      if (ix === 0) {
        gg.renderedBox = JSON.parse(JSON.stringify(block.renderedBox));
        gg.logicalBox = JSON.parse(JSON.stringify(block.logicalBox));
        // map all the child scoreText objects, too.
        for (jj = 0; jj < gg.textBlocks.length; ++jj) {
          gg.textBlocks[jj].text.renderedBox = JSON.parse(JSON.stringify(block.inlineBlocks[jj].text.renderedBox));
          gg.textBlocks[jj].text.logicalBox = JSON.parse(JSON.stringify(block.inlineBlocks[jj].text.logicalBox));
        }
      }
      ix += 1;
    });
    this.context.closeGroup();
  }

  renderScoreModifiers() {
    $(this.renderer.getContext().svg).find('.all-score-text').remove();
    const group = this.context.openGroup();
    group.classList.add('all-score-text');
    this.score!.textGroups.forEach((tg) => {
      this.renderTextGroup(tg);
    });
    this.context.closeGroup();
  }

  // ### calculateBeginningSymbols
  // calculate which symbols like clef, key signature that we have to render in this measure.
  calculateBeginningSymbols(systemIndex: number, measure: SmoMeasure, clefLast: string, keySigLast: string, timeSigLast: TimeSignature, tempoLast: SmoTempoText) {
    const measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
    measure.svg.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
    measure.svg.forceTimeSignature = (measure.measureNumber.measureIndex === 0 || 
      (!SmoMeasure.timeSigEqual(timeSigLast, measure.timeSignature)) || measure.timeSignatureString.length > 0);
    if (measure.timeSignature.display === false) {
      measure.svg.forceTimeSignature = false;
    }
    measure.svg.forceTempo = false;
    const tempo = measure.getTempo();
    if (tempo && measure.measureNumber.measureIndex === 0) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    } else if (tempo && tempoLast) {
      if (!SmoTempoText.eq(tempo, tempoLast) && measure.svg.rowInSystem === 0) {
        measure.svg.forceTempo = tempo.display;
      }
    } else if (tempo) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    }
    if (measureKeySig !== keySigLast) {
      measure.canceledKeySignature = SmoMusic.vexKeySigWithOffset(keySigLast, -1 * measure.transposeIndex);
      measure.svg.forceKeySignature = true;
    } else if (systemIndex === 0 && measureKeySig !== 'C') {
      measure.svg.forceKeySignature = true;
    } else {
      measure.svg.forceKeySignature = false;
    }
  }

  _getMeasuresInColumn(ix: number): SmoMeasure[] {
    const rv: SmoMeasure[] = [];
    if (!this.score) {
      return [];
    }
    this.score.staves.forEach((staff) => {
      const inst = staff.measures.find((ss) => ss.measureNumber.measureIndex === ix);
      if (inst) {
        rv.push(inst);
      }
    });
    return rv;
  }
  _renderSystem(key: string, mscore: Record<string | number, SmoMeasure[]>, printing: boolean) {
    const columns: Record<number, SmoMeasure[]> = {};    
    if (this.score === null) {
      return;
    }
    const vxSystem: VxSystem = new VxSystem(this.context, 0, parseInt(key, 10), this.score);
    mscore[key].forEach((measure) => {
      if (!columns[measure.measureNumber.systemIndex]) {
        columns[measure.measureNumber.systemIndex] = [];
      }
      columns[measure.measureNumber.systemIndex].push(measure);
    });
    const colKeys = Object.keys(columns);
    colKeys.forEach((colKey) => {
      columns[parseInt(colKey, 10)].forEach((measure: SmoMeasure) => {
        if (this.measureMapper !== null) {
          vxSystem.renderMeasure(measure, this.measureMapper, printing);
          if (!printing && !measure.format.eq(SmoMeasureFormat.defaults)) {
            const at = [];
            at.push({ y: measure.svg.logicalBox.y - 5 });
            at.push({ x: measure.svg.logicalBox.x + 25 });
            at.push({ 'font-family': SourceSansProFont.fontFamily });
            at.push({ 'font-size': '12pt' });
            SvgHelpers.placeSvgText(this.context.svg, at, 'measure-format', '*');
          }
        }
      });
    });
    const timestamp = new Date().valueOf();
    if (this.measureMapper !== null) {
      vxSystem.renderEndings(this.measureMapper.scroller);
    }
    vxSystem.updateLyricOffsets();
    this.score.staves.forEach((stf) => {
      this._renderModifiers(stf, vxSystem);
    });
    layoutDebug.setTimestamp(layoutDebug.codeRegions.POST_RENDER, new Date().valueOf() - timestamp);
  }
  _renderNextSystemPromise(systemIx: number, mscore: Record<string | number, SmoMeasure[]>, keys: string[], printing: boolean) {
    return new Promise((resolve: any) => {
      this._renderSystem(keys[systemIx], mscore, printing);
      resolve();
    });
  }
  _deferNextSystemPromise(systemIx: number, mscore: Record<string | number, SmoMeasure[]>, keys: string[], printing: boolean) {
    return new Promise((resolve: any) => {
      this._renderNextSystemPromise(systemIx, mscore, keys, printing).then(() => {
        setTimeout(() => {
          resolve();
        }, 10);
      });
    });
  }
  _renderNextSystem(systemIx: number, mscore: Record<string | number, SmoMeasure[]>, keys: string[], printing: boolean) {
    if (systemIx < keys.length) {
      const progress = Math.round((100 * systemIx) / keys.length);
      $('#renderProgress').val(progress);
      this._deferNextSystemPromise(systemIx, mscore, keys, printing).then(() => {
        systemIx++;
        this._renderNextSystem(systemIx, mscore, keys, printing);
      });
    } else {
      this.renderScoreModifiers();
      this.numberMeasures();
      // We pro-rate the background render timer on how long it takes
      // to actually render the score, so we are not thrashing on a large
      // score.
      if (this.autoAdjustRenderTime) {
        this.renderTime = new Date().valueOf() - this.startRenderTime;
      }
      $('body').removeClass('show-render-progress');
      // indicate the display is 'clean' and up-to-date with the score
      $('body').removeClass('refresh-1');
      if (this.measureMapper !== null) {
        this.measureMapper.updateMap();
      }
      this.backgroundRender = false;
    }
  }

  renderAllMeasures() {
    const mscore: Record<number,SmoMeasure[]> = {};
    if (!this.score) {
      return;
    }
    const printing = $('body').hasClass('print-render');
    $('.measure-format').remove();
    this.score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (!mscore[measure.svg.lineIndex]) {
          mscore[measure.svg.lineIndex] = [];
        }
        mscore[measure.svg.lineIndex].push(measure);
      });
    });

    const keys = Object.keys(mscore);
    if (!printing) {
      $('body').addClass('show-render-progress');
      if (this.score.preferences.showPiano) {
        SuiPiano.showPiano();
      } else {
        SuiPiano.hidePiano();
      }
    }
    this.backgroundRender = true;
    this.startRenderTime = new Date().valueOf();
    this._renderNextSystem(0, mscore, keys, printing);
  }

  // ### _justifyY
  // when we have finished a line of music, adjust the measures in the system so the
  // top of the staff lines up.
  _justifyY(svg: SVGSVGElement, scoreLayout: ScaledPageLayout, measureEstimate: MeasureEstimate, currentLine: SmoMeasure[], lastSystem: boolean) {
    let i = 0;
    // We estimate the staves at the same absolute y value.
    // Now, move them down so the top of the staves align for all measures in a  row.
    for (i = 0; i < measureEstimate.measures.length; ++i) {
      let justifyX = 0;
      const index = i;
      const rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem === index);
      // lowest staff has greatest staffY value.
      const lowestStaff = rowAdj.reduce((a, b) =>
        a.staffY > b.staffY ? a : b
      );
      const sh = SvgHelpers;
      rowAdj.forEach((measure) => {
        const adj = lowestStaff.staffY - measure.staffY;
        measure.setY(measure.staffY + adj, '_justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x, measure.svg.logicalBox.y + adj, measure.svg.logicalBox.width, measure.svg.logicalBox.height), '_justifyY');
      });
      const rightStaff = rowAdj.reduce((a, b) =>
        a.staffX + a.staffWidth > b.staffX + b.staffWidth ?  a : b);

      if (!lastSystem) {
        justifyX = Math.round((scoreLayout.pageWidth - (scoreLayout.leftMargin + scoreLayout.rightMargin + rightStaff.staffX + rightStaff.staffWidth))
          / rowAdj.length);
      }
      const ld = layoutDebug;
      rowAdj.forEach((measure) => {
        measure.setWidth(measure.staffWidth + justifyX, '_estimateMeasureDimensions justify');
        const offset = measure.measureNumber.systemIndex * justifyX;
        measure.setX(measure.staffX + offset, '_justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x + offset, measure.svg.logicalBox.y, measure.staffWidth, measure.svg.logicalBox.height), '_justifyY');
        ld.debugBox(svg, measure.svg.logicalBox, layoutDebug.values.adjust);
      });
    }
  }
  // ### _checkPageBreak
  // See if this line breaks the page boundary
  _checkPageBreak(scoreLayout: ScaledPageLayout, currentLine: SmoMeasure[], bottomMeasure: SmoMeasure): ScaledPageLayout {
    let pageAdj = 0;
    const lm: SmoLayoutManager = this.score!.layoutManager!;
    // See if this measure breaks a page.
    const maxY = bottomMeasure.svg.logicalBox.y +  bottomMeasure.svg.logicalBox.height;
    if (maxY > ((this.currentPage + 1) * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
      // Advance to next page settings
      this.currentPage += 1;
      // If this is a new page, make sure there is a layout for it.
      lm.addToPageLayouts(this.currentPage);
      scoreLayout = lm.getScaledPageLayout(this.currentPage);

      // When adjusting the page, make it so the top staff of the system
      // clears the bottom of the page.
      const topMeasure = currentLine.reduce((a, b) =>
        a.svg.logicalBox.y < b.svg.logicalBox.y ? a : b
      );
      const minMaxY = topMeasure.svg.logicalBox.y;
      pageAdj = (this.currentPage * scoreLayout.pageHeight) - minMaxY;
      pageAdj = pageAdj + scoreLayout.topMargin;

      // For each measure on the current line, move it down past the page break;
      currentLine.forEach((measure) => {
        measure.setBox(SvgHelpers.boxPoints(
          measure.svg.logicalBox.x, measure.svg.logicalBox.y + pageAdj, measure.svg.logicalBox.width, measure.svg.logicalBox.height), '_checkPageBreak');
        measure.setY(measure.staffY + pageAdj, '_checkPageBreak');
      });
    }
    return scoreLayout;
  }

  layout() {
    if (!this.score) {
      return;
    }
    let measureIx = 0;
    let systemIndex = 0;
    if (!this.score.layoutManager) {
      return;
    }
    let scoreLayout = this.score.layoutManager.getScaledPageLayout(0);
    let y = 0;
    let x = 0;
    let lineIndex = 0;
    let currentLine: SmoMeasure[] = []; // the system we are esimating
    let measureEstimate: MeasureEstimate | null = null;
    $('head title').text(this.score.scoreInfo.name);

    layoutDebug.clearDebugBoxes(layoutDebug.values.pre);
    layoutDebug.clearDebugBoxes(layoutDebug.values.post);
    layoutDebug.clearDebugBoxes(layoutDebug.values.adjust);
    layoutDebug.clearDebugBoxes(layoutDebug.values.system);
    layoutDebug.clearDebugBoxes(layoutDebug.values.note);
    this.currentPage = 0;
    const timestamp = new Date().valueOf();

    const svg = this.context.svg;
    const startPageCount = this.score.layoutManager!.pageLayouts.length;

    y = scoreLayout.topMargin;
    x = scoreLayout.leftMargin;

    while (measureIx < this.score.staves[0].measures.length) {
      measureEstimate = this._estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
      x = measureEstimate.x;

      if (systemIndex > 0 &&
        (measureEstimate.measures[0].format.systemBreak || measureEstimate.x > (scoreLayout.pageWidth - scoreLayout.leftMargin))) {
        this._justifyY(svg, scoreLayout, measureEstimate, currentLine, false);
        // find the measure with the lowest y extend (greatest y value), not necessarily one with lowest
        // start of staff.
        const bottomMeasure: SmoMeasure = currentLine.reduce((a, b) =>
          a.svg.logicalBox.y + a.svg.logicalBox.height > b.svg.logicalBox.y + b.svg.logicalBox.height ? a : b
        );
        this._checkPageBreak(scoreLayout, currentLine, bottomMeasure);

        const ld = layoutDebug;
        const sh = SvgHelpers;
        if (layoutDebug.mask & layoutDebug.values.system) {
          currentLine.forEach((measure) => {
            if (measure.svg.logicalBox) {
              ld.debugBox(svg, measure.svg.logicalBox, layoutDebug.values.system);
              ld.debugBox(svg, sh.boxPoints(measure.staffX, measure.svg.logicalBox.y, measure.svg.adjX, measure.svg.logicalBox.height), layoutDebug.values.post);
            }
          });
        }

        // Now start rendering on the next system.
        y = bottomMeasure.svg.logicalBox.height + bottomMeasure.svg.logicalBox.y + scoreLayout.interGap;
        currentLine = [];
        systemIndex = 0;
        x = scoreLayout.leftMargin;
        lineIndex += 1;
        measureEstimate = this._estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
        x = measureEstimate.x;
      }
      // ld declared for lint
      const ld = layoutDebug;
      measureEstimate?.measures.forEach((measure) => {
        ld.debugBox(svg, measure.svg.logicalBox, layoutDebug.values.pre);
      });

      currentLine = currentLine.concat(measureEstimate.measures);
      measureIx += 1;
      systemIndex += 1;
      // If this is the last measure but we have not filled the x extent,
      // still justify the vertical staves and check for page break.
      if (measureIx >= this.score.staves[0].measures.length && measureEstimate !== null) {
        this._justifyY(svg, scoreLayout, measureEstimate, currentLine, true);
        const bottomMeasure = currentLine.reduce((a, b) =>
          a.svg.logicalBox.y + a.svg.logicalBox.height > b.svg.logicalBox.y + b.svg.logicalBox.height ? a : b
        );
        scoreLayout = this._checkPageBreak(scoreLayout, currentLine, bottomMeasure);
      }
    }
    const pl: SmoPageLayout[] | undefined = this.score?.layoutManager?.pageLayouts;
    if (pl && pl.length !== startPageCount) {
      this.setViewport(true);
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.COMPUTE, new Date().valueOf() - timestamp);
    this.renderAllMeasures();
  }

  // ### _estimateColumns
  // the new logic to estimate the dimensions of a column of music, corresponding to
  // a certain measure index.
  // returns:
  // {measures,y,x}  the x and y at the left/bottom of the render
  _estimateColumn(scoreLayout: ScaledPageLayout, measureIx: number, systemIndex: number, lineIndex: number, x: number, y: number): MeasureEstimate {
    const s: any = {};
    const measures = this._getMeasuresInColumn(measureIx);
    let rowInSystem = 0;
    // Keep running tab of accidental widths for justification
    const accidentalMap = {};
    measures.forEach((measure) => {
      SmoBeamer.applyBeams(measure);
      measure.measureNumber.systemIndex = systemIndex;
      measure.svg.rowInSystem = rowInSystem;
      measure.svg.lineIndex = lineIndex;

      // use measure to left to figure out whether I need to render key signature, etc.
      // If I am the first measure, just use self and we always render them on the first measure.
      let measureToLeft = this._measureToLeft(measure);
      if (!measureToLeft) {
        measureToLeft = measure;
      }
      s.measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, measure.transposeIndex);
      s.keySigLast = SmoMusic.vexKeySignatureTranspose(measureToLeft.keySignature, measure.transposeIndex);
      s.tempoLast = measureToLeft.getTempo();
      s.timeSigLast = measureToLeft.timeSignature;
      s.clefLast = measureToLeft.clef;
      this.calculateBeginningSymbols(systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast, s.tempoLast);

      // calculate vertical offsets from the baseline
      const offsets = suiLayoutFormatter.estimateMeasureHeight(measure);
      measure.setYTop(offsets.aboveBaseline, 'render:estimateColumn');
      measure.setY(y - measure.yTop, '_estimateColumns height');
      measure.setX(x, 'render:estimateColumn');

      // Add custom width to measure:
      measure.setBox(SvgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, offsets.belowBaseline - offsets.aboveBaseline), 'render: estimateColumn');
      suiLayoutFormatter.estimateMeasureWidth(measure, scoreLayout.noteSpacing, accidentalMap);
      y = y + measure.svg.logicalBox.height + scoreLayout.intraGap;
      rowInSystem += 1;
    });

    // justify this column to the maximum width
    const maxMeasure = measures.reduce((a, b) => a.staffX + a.staffWidth > b.staffX + b.staffWidth ? a : b);
    const maxX = maxMeasure.staffX + maxMeasure.staffWidth;
    const maxAdjMeasure = measures.reduce((a, b) => a.svg.adjX > b.svg.adjX  ? a : b);
    const maxAdj = maxAdjMeasure.svg.adjX;
    measures.forEach((measure) => {
      measure.setWidth(measure.staffWidth + (maxX - (measure.staffX + measure.staffWidth)), 'render:estimateColumn');
      measure.svg.adjX = maxAdj;
    });
    const rv = { measures, y, x: maxX };
    return rv;
  }
}
