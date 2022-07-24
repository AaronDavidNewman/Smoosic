// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgBox } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup, SmoPageLayout, SmoLayoutManager } from '../../smo/data/scoreModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { VxMeasure } from '../vex/vxMeasure';

import { SuiRenderState, ScoreRenderParams } from './renderState';
import { VxSystem } from '../vex/vxSystem';
import { SvgHelpers } from './svgHelpers';
import { SuiPiano } from './piano';
import { SuiLayoutFormatter, SuiTickContext, LineRender, MeasureEstimate } from './formatter';
import { SmoBeamer } from '../../smo/xform/beamers';
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
  formatter: SuiLayoutFormatter | null = null;

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
    if (this.score === null || this.formatter === null) {
      return;
    }
    const columns: Record<number, SmoMeasure[]> = this.formatter.systems[lineIx].systems;
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
      this.renderModifiers(stf, vxSystem);
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
 // ### _renderModifiers
  // ### Description:
  // Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
  // is on a different system due to wrapping.
  renderModifiers(staff: SmoSystemStaff, system: VxSystem) {
    let nextNote: SmoSelection | null = null;
    let lastNote: SmoSelection | null = null;
    let testNote: VxMeasure | null = null;
    let vxStart: VxMeasure | null = null;
    let vxEnd: VxMeasure | null = null;
    const removedModifiers: StaffModifierBase[] = [];
    if (this.score === null || this.measureMapper === null) {
      return;
    }
    staff.modifiers.forEach((modifier) => {
      const startNote = SmoSelection.noteSelection(this.score!,
        modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
      const endNote = SmoSelection.noteSelection(this.score!,
        modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
      if (!startNote || !endNote) {
        // If the modifier doesn't have score endpoints, delete it from the score
        removedModifiers.push(modifier);
        return;
      }
      if (startNote.note !== null) {
        vxStart = system.getVxNote(startNote.note);
      }
      if (endNote.note !== null) {
        vxEnd = system.getVxNote(endNote.note);
      }

      // If the modifier goes to the next staff, draw what part of it we can on this staff.
      if (vxStart && !vxEnd) {
        nextNote = SmoSelection.nextNoteSelection(this.score!,
          modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
        if (nextNote === null) {
          console.warn('bad selector ' + JSON.stringify(modifier.startSelector, null, ' '));
        } else {
          if (nextNote.note !== null) {
            testNote = system.getVxNote(nextNote.note);
          }
          while (testNote) {
            vxEnd = testNote;
            nextNote = SmoSelection.nextNoteSelection(this.score!,
              nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
            if (!nextNote) {
              break;
            }
            if (nextNote.note !== null) {
              testNote = system.getVxNote(nextNote.note);
            } else {
              testNote = null;
            }
          }
        }
      }
      if (vxEnd && !vxStart) {
        lastNote = SmoSelection.lastNoteSelection(this.score!,
          modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
        if (lastNote !== null && lastNote.note !== null) {
          testNote = system.getVxNote(lastNote.note);
          while (testNote !== null) {
            vxStart = testNote;
            lastNote = SmoSelection.lastNoteSelection(this.score!,
              lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
            if (!lastNote) {
              break;
            }
            if (lastNote.note !== null) {
              testNote = system.getVxNote(lastNote.note);
            } else {
              testNote = null;
            }
          }
        }
      }
      if (!vxStart && !vxEnd) {
        return;
      }
      system.renderModifier(this.measureMapper!.scroller, modifier, vxStart, vxEnd, startNote, endNote);
    });
    // Silently remove modifiers from the score if the endpoints no longer exist
    removedModifiers.forEach((mod) => {
      staff.removeStaffModifier(mod);
    });
  }

  drawPageLines() {
    let i = 0;
    $(this.context.svg).find('.pageLine').remove();
    const printing = $('body').hasClass('print-render');
    const layoutMgr = this.score!.layoutManager;
    if (printing || !layoutMgr) {
      return;
    }
    for (i = 1; i < layoutMgr.pageLayouts.length; ++i) {
      const scaledPage = layoutMgr.getScaledPageLayout(i);
      const y = scaledPage.pageHeight * i;
      SvgHelpers.line(this.svg, 0, y, scaledPage.pageWidth, y,
        { strokeName: 'line', stroke: '#321', strokeWidth: '2', strokeDasharray: '4,1', fill: 'none', opacity: 1.0 }, 'pageLine');
    }
  }
  replaceSelection(staffMap: Record<number | string, { system: VxSystem, staff: SmoSystemStaff }>, change: SmoSelection) {
    let system: VxSystem | null = null;
    SmoBeamer.applyBeams(change.measure);
    // Defer modifier update until all selected measures are drawn.
    if (!staffMap[change.staff.staffId]) {
      system = new VxSystem(this.context, change.measure.staffY, change.measure.svg.lineIndex, this.score!);
      staffMap[change.staff.staffId] = { system, staff: change.staff };
    } else {
      system = staffMap[change.staff.staffId].system;
    }
    const selections = SmoSelection.measuresInColumn(this.score!, change.measure.measureNumber.measureIndex);
    selections.forEach((selection) => {
      if (system !== null && this.measureMapper !== null) {
        system.renderMeasure(selection.measure, this.measureMapper, false);
      }
    });

  }

  // ### _replaceMeasures
  // Do a quick re-render of a measure that has changed.
  replaceMeasures() {
    const staffMap: Record<number | string, { system: VxSystem, staff: SmoSystemStaff }> = {};
    if (this.score === null || this.measureMapper === null) {
      return;
    }
    this.replaceQ.forEach((change) => {
      this.replaceSelection(staffMap, change);
    });
    Object.keys(staffMap).forEach((key) => {
      const obj = staffMap[key];
      this.renderModifiers(obj.staff, obj.system);
      obj.system.renderEndings(this.measureMapper!.scroller);
      obj.system.updateLyricOffsets();
    });
    this.replaceQ = [];
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
  // Number the measures at the first measure in each system.
  numberMeasures() {
    const printing: boolean = $('body').hasClass('print-render');
    const staff = this.score!.staves[0];
    const measures = staff.measures.filter((measure) => measure.measureNumber.systemIndex === 0);
    $('.measure-number').remove();

    measures.forEach((measure) => {
      if (measure.measureNumber.localIndex > 0 && measure.measureNumber.systemIndex === 0 && measure.svg.logicalBox) {
        const numAr = [];
        numAr.push({ y: measure.svg.logicalBox.y - 10 });
        numAr.push({ x: measure.svg.logicalBox.x });
        numAr.push({ 'font-family': SourceSansProFont.fontFamily });
        numAr.push({ 'font-size': '10pt' });
        SvgHelpers.placeSvgText(this.context.svg, numAr, 'measure-number', (measure.measureNumber.localIndex + 1).toString());

        // Show line-feed symbol
        if (measure.format.systemBreak && !printing) {
          const starAr = [];
          const symbol = '\u21b0';
          starAr.push({ y: measure.svg.logicalBox.y - 5 });
          starAr.push({ x: measure.svg.logicalBox.x + 25 });
          starAr.push({ 'font-family': SourceSansProFont.fontFamily });
          starAr.push({ 'font-size': '12pt' });
          SvgHelpers.placeSvgText(this.context.svg, starAr, 'measure-format', symbol);
        }
      }
    });
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
    $('head title').text(this.score.scoreInfo.name);
    const formatter = new SuiLayoutFormatter(score, this.context.svg);
    const startPageCount = this.score.layoutManager!.pageLayouts.length;
    this.formatter = formatter;
    formatter.layout();    
    if (this.formatter.trimPages(startPageCount)) {
      this.setViewport(true);
    }
    this.renderAllMeasures(formatter.lines);
  } 
}
