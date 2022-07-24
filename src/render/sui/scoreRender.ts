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
import { SuiLayoutFormatter, SuiTickContext, LineRender, MeasureEstimate } from './formatter';
import { SuiTextBlock } from './textRender';
import { layoutDebug } from './layoutDebug';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoRenderConfiguration } from './configuration';
import { createTopDomContainer } from '../../common/htmlHelpers';

declare var $: any;
const VF = eval('Vex.Flow');


/**
 * This module renders the entire score.  It calculates the layout first based on the
 * computed dimensions.
  * @category SuiRender
**/
export class SuiScoreRender extends SuiRenderState {
  constructor(params: ScoreRenderParams) {
    super(params.config);
    this.elementId = params.elementId;
    // this.score = params.score;
    this.setViewport(true);
  }
  startRenderTime: number = 0;
  currentPage: number = 0;
  systems: Record<number, LineRender> = {};
  

  // ### createScoreRenderer
  // ### Description;
  // to get the score to appear, a div and a score object are required.  The layout takes care of creating the
  // svg element in the dom and interacting with the vex library.
  static createScoreRenderer(config: SmoRenderConfiguration, renderElement: Element, score: SmoScore): SuiScoreRender {
    const ctorObj: ScoreRenderParams = {
      config,
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

  renderTextGroup(gg: SmoTextGroup) {
    let ix = 0;
    let jj = 0;
    if (gg.skipRender || this.score === null || this.measureMapper === null) {
      return;
    }
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
        gg.logicalBox = JSON.parse(JSON.stringify(block.logicalBox));
        // map all the child scoreText objects, too.
        for (jj = 0; jj < gg.textBlocks.length; ++jj) {
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
  _renderSystem(lineIx: number, printing: boolean) {
    if (this.score === null) {
      return;
    }
    const columns: Record<number, SmoMeasure[]> = this.systems[lineIx].systems;
    const vxSystem: VxSystem = new VxSystem(this.context, 0, lineIx, this.score);
    const colKeys = Object.keys(columns);
    colKeys.forEach((colKey) => {
      columns[parseInt(colKey, 10)].forEach((measure: SmoMeasure) => {
        if (this.measureMapper !== null) {
          vxSystem.renderMeasure(measure, this.measureMapper, printing);
          if (!printing && !measure.format.isDefault) {
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
  _renderNextSystemPromise(systemIx: number, keys: number[], printing: boolean) {
    return new Promise((resolve: any) => {
      // const sleepDate = new Date().valueOf();
      this._renderSystem(keys[systemIx], printing);
      setTimeout(() => {
        resolve();
      }, 10);
    });
  }

  _renderNextSystem(lineIx: number, keys: number[], printing: boolean) {
    createTopDomContainer('#renderProgress', 'progress');
    if (lineIx < keys.length) {
      const progress = Math.round((100 * lineIx) / keys.length);
      $('#renderProgress').attr('max', 100);
      $('#renderProgress').val(progress);
      this._renderNextSystemPromise(lineIx,keys, printing).then(() => {
        lineIx++;
        this._renderNextSystem(lineIx, keys, printing);
      });
    } else {
      this.renderScoreModifiers();
      this.numberMeasures();
      if (layoutDebug.mask & layoutDebug.values.artifactMap) {
        this.measureMapper?.artifactMap.debugBox(this.svg);
      }
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

  renderAllMeasures(lines: number[]) {
    if (!this.score) {
      return;
    }
    const printing = $('body').hasClass('print-render');
    $('.measure-format').remove();
   
    if (!printing) {
      $('body').addClass('show-render-progress');
      const isShowing = SuiPiano.isShowing;
      if (this.score.preferences.showPiano && !isShowing) {
        SuiPiano.showPiano();
        this.measureMapper!.scroller.updateViewport();
      } else if (isShowing && !this.score.preferences.showPiano) {
        SuiPiano.hidePiano();
        this.measureMapper!.scroller.updateViewport();
      }
    }
    this.backgroundRender = true;
    this.startRenderTime = new Date().valueOf();
    this._renderNextSystem(0, lines, printing);
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

  /**
   * This calculates the position of all the elements in the score, then renders the score
   * @returns 
   */
  layout() {
    if (!this.score) {
      return;
    }
    const score = this.score;
    const formatter = new SuiLayoutFormatter(score);
    let measureIx = 0;
    let systemIndex = 0;
    if (!this.score.layoutManager) {
      return;
    }
    let scoreLayout = this.score.layoutManager.getScaledPageLayout(0);
    let y = 0;
    let x = 0;
    let lineIndex = 0;
    const lines: number[] = [];
    lines.push(lineIndex);
    let currentLine: SmoMeasure[] = []; // the system we are esimating
    let measureEstimate: MeasureEstimate | null = null;
    $('head title').text(this.score.scoreInfo.name);

    layoutDebug.clearDebugBoxes(layoutDebug.values.pre);
    layoutDebug.clearDebugBoxes(layoutDebug.values.post);
    layoutDebug.clearDebugBoxes(layoutDebug.values.adjust);
    layoutDebug.clearDebugBoxes(layoutDebug.values.system);
    this.currentPage = 0;
    this.systems = {};
    const timestamp = new Date().valueOf();

    const svg = this.context.svg;
    const startPageCount = this.score.layoutManager!.pageLayouts.length;

    y = scoreLayout.topMargin;
    x = scoreLayout.leftMargin;

    while (measureIx < this.score.staves[0].measures.length) {
      if (this.score.isPartExposed()) {
        if (this.score.staves[0].measures[measureIx].svg.hideMultimeasure) {
          measureIx += 1;
          continue;
        }
      }
      measureEstimate = formatter.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, this.currentPage, x, y);
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
        lines.push(lineIndex);
        lineIndex += 1;
        measureEstimate = formatter.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, this.currentPage, x, y);
        x = measureEstimate.x;
      }
      // ld declared for lint
      const ld = layoutDebug;
      measureEstimate?.measures.forEach((measure) => {
        ld.debugBox(svg, measure.svg.logicalBox, layoutDebug.values.pre);
      });
      if (!this.systems[lineIndex]) {
        const nextLr: LineRender = {
          systems: {}
        };
        this.systems[lineIndex] = nextLr;
      }
      const systemRender = this.systems[lineIndex];
      if (!systemRender.systems[systemIndex]) {
        systemRender.systems[systemIndex] = measureEstimate.measures;
      }


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
    let pl: SmoPageLayout[] | undefined = this.score?.layoutManager?.pageLayouts;
    if (pl) {
      if (this.currentPage < pl.length - 1) {
        this.score!.layoutManager!.trimPages(this.currentPage);
        pl = this.score?.layoutManager?.pageLayouts;
      }
      if (pl.length !== startPageCount) {
        this.setViewport(true);
      }  
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.COMPUTE, new Date().valueOf() - timestamp);
    this.renderAllMeasures(lines);
  }


 
}
