// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoMeasure, SmoVoice } from '../../smo/data/measure';
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { VxMeasure } from '../vex/vxMeasure';
import { SuiMapper } from './mapper';
import { VxSystem } from '../vex/vxSystem';
import { SvgHelpers, StrokeInfo } from './svgHelpers';
import { SuiPiano } from './piano';
import { SuiLayoutFormatter, RenderedPage } from './formatter';
import { SmoBeamer } from '../../smo/xform/beamers';
import { SuiTextBlock } from './textRender';
import { layoutDebug } from './layoutDebug';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoRenderConfiguration } from './configuration';
import { createTopDomContainer } from '../../common/htmlHelpers';
import { UndoBuffer } from '../../smo/xform/undo';
import { SvgPageMap, SvgPage } from './svgPageMap';
import { VexFlow } from '../../common/vex';
import { Note } from '../../common/vex';

declare var $: any;
const VF = VexFlow;
/**
 * a renderer creates the SVG render context for vexflow from the given element. Then it
 * renders the initial score.
 * @category SuiRenderParams
 */
 export interface ScoreRenderParams {
  elementId: any,
  score: SmoScore,
  config: SmoRenderConfiguration,
  undoBuffer: UndoBuffer
}

export interface MapParameters {
  vxSystem: VxSystem, measuresToBox: SmoMeasure[], modifiersToBox: StaffModifierBase[], printing: boolean
}
/**
 * This module renders the entire score.  It calculates the layout first based on the
 * computed dimensions.
  * @category SuiRender
**/
export class SuiScoreRender {
  constructor(params: ScoreRenderParams) {    
    this.elementId = params.elementId;
    this.score = params.score;
    this.vexContainers = new SvgPageMap(this.score.layoutManager!.globalLayout, this.elementId, this.score.layoutManager!.pageLayouts);
    this.setViewport();
  }
  elementId: any;
  startRenderTime: number = 0;
  formatter: SuiLayoutFormatter | null = null;
  vexContainers: SvgPageMap;
  // vexRenderer: any = null;
  score: SmoScore | null = null;
  measureMapper: SuiMapper | null = null;
  measuresToMap: MapParameters[] = [];
  viewportChanged: boolean = false;
  renderTime: number = 0;
  backgroundRender: boolean = false;
  static debugMask: number = 0;
  renderedPages: Record<number, RenderedPage | null> = {};
  _autoAdjustRenderTime: boolean = true;
  lyricsToOffset: Map<number, VxSystem> = new Map();
  renderingPage: number = -1;  
  get autoAdjustRenderTime() {
    return this._autoAdjustRenderTime;
  }
  set autoAdjustRenderTime(value: boolean) {
    this._autoAdjustRenderTime = value;
  }
  getRenderer(box: SvgBox | SvgPoint): SvgPage | null {
    return this.vexContainers.getRenderer(box);
  }
  renderTextGroup(gg: SmoTextGroup) {
    let ix = 0;
    let jj = 0;
    if (gg.skipRender || this.score === null || this.measureMapper === null) {
      return;
    }
    gg.elements.forEach((element) => {
      element.remove();
    });
    gg.elements = [];
    const layoutManager = this.score!.layoutManager!;
    const scaledScoreLayout = layoutManager.getScaledPageLayout(0);
    // If this text hasn't been rendered before, estimate the logical box.
    const dummyContainer = this.vexContainers.getRendererFromModifier(gg);
    if (dummyContainer && !gg.logicalBox) {
      const dummyBlock = SuiTextBlock.fromTextGroup(gg, dummyContainer, this.vexContainers, this.measureMapper!.scroller);
      gg.logicalBox = dummyBlock.getLogicalBox();
    }

    // If this is a per-page score text, get a text group copy for each page.
    // else the array contains the original.
    const groupAr = SmoTextGroup.getPagedTextGroups(gg, this.score!.layoutManager!.pageLayouts.length, scaledScoreLayout.pageHeight);
    groupAr.forEach((newGroup) => {
      let container: SvgPage = this.vexContainers.getRendererFromModifier(newGroup);
      // If this text is attached to the measure, base the block location on the rendered measure location.
      if (newGroup.attachToSelector) {
        // If this text is attached to a staff that is not visible, don't draw it.
        const mappedStaff = this.score!.staves.find((staff) => staff.staffId === newGroup.selector!.staff);
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
      if (container) {
        const block = SuiTextBlock.fromTextGroup(newGroup, container, this.vexContainers, this.measureMapper!.scroller);
        block.render();
        if (block.currentBlock?.text.element) {
          gg.elements.push(block.currentBlock?.text.element);
        }
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
      }
    });
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
    // $(this.context.svg).find('g.lineBracket').remove();
  }
  // ### unrenderStaff
  // ### Description:
  // See unrenderMeasure.  Like that, but with a staff.
  unrenderStaff(staff: SmoSystemStaff) {
    staff.measures.forEach((measure) => {
      this.unrenderMeasure(measure);
    });
    staff.renderableModifiers.forEach((modifier) => {
      if (modifier.element) {
        modifier.element.remove();
        modifier.element = null;
      }
    });
  }
  clearRenderedPage(pg: number) {
    if (this.renderedPages[pg]) {
      this.renderedPages[pg] = null;
    }
  }
  // ### _setViewport
  // Create (or recrate) the svg viewport, considering the dimensions of the score.
  setViewport() {
    if (this.score === null) {
      return;
    }
    const layoutManager = this.score!.layoutManager!;
    // All pages have same width/height, so use that
    const layout = layoutManager.getGlobalLayout();
    this.vexContainers.updateLayout(layout, layoutManager.pageLayouts);
    this.renderedPages = {};
    this.viewportChanged = true;
    if (this.measureMapper) {
      this.measureMapper.scroller.scrollAbsolute(0, 0);
    }
    if (this.measureMapper) {
      this.measureMapper.scroller.updateViewport();
    }
    // this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
    if (SuiScoreRender.debugMask) {
      console.log('layout setViewport: pstate initial');
    }
  }

  async unrenderTextGroups(): Promise<void> {
    return new Promise((resolve) => {
      // remove existing modifiers, and also remove parent group for 'extra'
      // groups associated with pagination (once per page etc)
      for (var i = 0; i < this.score!.textGroups.length; ++i) {
        const tg = this.score!.textGroups[i];
        tg.elements.forEach((element) => {
          element.remove();
        });
        tg.elements = [];
      }
      resolve();
    });
  }
  async renderTextGroups(): Promise<void> {
    return new Promise((resolve) => {
      let tgs = this.score!.textGroups;
      if (this.score?.isPartExposed() && this.score.staves[0].partInfo.preserveTextGroups) {
        tgs = this.score.staves[0].partInfo.textGroups;
      }
      // group.classList.add('all-score-text');
      for (var i = 0; i < tgs.length; ++i) {
        const tg = tgs[i];
        this.renderTextGroup(tg);
      }
      resolve();
    });
  }
  async rerenderTextGroups(): Promise<void> {
    await this.unrenderTextGroups();
    await this.renderTextGroups();
  }

  /**
   * for music we've just rendered, get the bounding boxes.  We defer this step so we don't force
   * a reflow, which can slow rendering.
   * @param vxSystem 
   * @param measures 
   * @param modifiers 
   * @param printing 
   */
  measureRenderedElements(vxSystem: VxSystem, measures: SmoMeasure[], modifiers: StaffModifierBase[], printing: boolean) {
    const pageContext =  vxSystem.context;
    measures.forEach((smoMeasure) => {
      const element = smoMeasure.svg.element;
      if (element) {        
        smoMeasure.setBox(pageContext.offsetBbox(element), 'vxMeasure bounding box');
      }
      const vxMeasure = vxSystem.getVxMeasure(smoMeasure);
      if (vxMeasure) {
        vxMeasure.modifiersToBox.forEach((modifier) => {
          if (modifier.element) {
            modifier.logicalBox = pageContext.offsetBbox(modifier.element);
          }
        });
      }
      // unit test codes don't have tracker.
      if (this.measureMapper) {
        const tmpStaff: SmoSystemStaff | undefined = this.score!.staves.find((ss) => ss.staffId === smoMeasure.measureNumber.staffId);
        if (tmpStaff) {
          this.measureMapper.mapMeasure(tmpStaff, smoMeasure, printing);
        }
      }  
    });
    modifiers.forEach((modifier) => {
      if (modifier.element) {
        modifier.logicalBox = pageContext.offsetBbox(modifier.element);
      }
    });
  }
  _renderSystem(lineIx: number, printing: boolean) {
    if (this.score === null || this.formatter === null) {
      return;
    }
    const measuresToBox: SmoMeasure[] = [];
    const modifiersToBox: StaffModifierBase[] = [];
    const columns: Record<number, SmoMeasure[]> = this.formatter.systems[lineIx].systems;

    // If this page hasn't changed since rendered
    const pageIndex = columns[0][0].svg.pageIndex;
    
    if (this.renderingPage !== pageIndex && this.renderedPages[pageIndex] && !printing) {
      if (SuiScoreRender.debugMask) {
        console.log(`skipping render on page ${pageIndex}`);
      }
      return;
    }
    const context = this.vexContainers.getRendererForPage(pageIndex);
    if (this.renderingPage !== pageIndex) {
      context.clearMap();
      this.renderingPage = pageIndex;
    }
    const vxSystem: VxSystem = new VxSystem(context, 0, lineIx, this.score);
    const colKeys = Object.keys(columns);
    colKeys.forEach((colKey) => {
      columns[parseInt(colKey, 10)].forEach((measure: SmoMeasure) => {
        if (this.measureMapper !== null) {
          const modId = 'mod-' + measure.measureNumber.staffId + '-' + measure.measureNumber.measureIndex;
          SvgHelpers.removeElementsByClass(context.svg, modId);
          vxSystem.renderMeasure(measure, printing);
          const pageIndex = measure.svg.pageIndex;
          const renderMeasures = this.renderedPages[pageIndex];
          if (!renderMeasures) {
            this.renderedPages[pageIndex] = {
              startMeasure: measure.measureNumber.measureIndex,
              endMeasure: measure.measureNumber.measureIndex
            }
          } else {
            renderMeasures.endMeasure = measure.measureNumber.measureIndex;
          }
          measuresToBox.push(measure);
          if (!printing && !measure.format.isDefault) {
            const at: any[] = [];
            at.push({ y: measure.svg.logicalBox.y - 5 });
            at.push({ x: measure.svg.logicalBox.x + 25 });
            at.push({ 'font-family': SourceSansProFont.fontFamily });
            at.push({ 'font-size': '12pt' });
            SvgHelpers.placeSvgText(context.svg, at, 'measure-format', '*');
          }
        }
      });
    });
    this.score.staves.forEach((stf) => {
      this.renderModifiers(stf, vxSystem).forEach((modifier) => {
        modifiersToBox.push(modifier);
      });
    });
    if (this.measureMapper !== null) {
      vxSystem.renderEndings(this.measureMapper.scroller);
    }
    this.measuresToMap.push({vxSystem, measuresToBox, modifiersToBox, printing });
    // this.measureRenderedElements(vxSystem, measuresToBox, modifiersToBox, printing);

    const timestamp = new Date().valueOf();
    if (!this.lyricsToOffset.has(vxSystem.lineIndex)) {
      this.lyricsToOffset.set(vxSystem.lineIndex, vxSystem);
    }
    // vxSystem.updateLyricOffsets();
    layoutDebug.setTimestamp(layoutDebug.codeRegions.POST_RENDER, new Date().valueOf() - timestamp);
  }
  _renderNextSystemPromise(systemIx: number, keys: number[], printing: boolean) {
    return new Promise((resolve: any) => {
      // const sleepDate = new Date().valueOf();
      this._renderSystem(keys[systemIx], printing);
      requestAnimationFrame(() => resolve());
    });
  }

  async _renderNextSystem(lineIx: number, keys: number[], printing: boolean) {
    createTopDomContainer('#renderProgress', 'progress');
    if (lineIx < keys.length) {
      const progress = Math.round((100 * lineIx) / keys.length);
      $('#renderProgress').attr('max', 100);
      $('#renderProgress').val(progress);
      await this._renderNextSystemPromise(lineIx,keys, printing);
      lineIx++;
      await this._renderNextSystem(lineIx, keys, printing);
    } else {
      await this.rerenderTextGroups();
      this.numberMeasures();
      this.measuresToMap.forEach((mm) => {
        this.measureRenderedElements(mm.vxSystem, mm.measuresToBox, mm.modifiersToBox, mm.printing);
      });
      this.lyricsToOffset.forEach((vv) => {
        vv.updateLyricOffsets();
      });
      this.measuresToMap = [];
      this.lyricsToOffset = new Map();
      // We pro-rate the background render timer on how long it takes
      // to actually render the score, so we are not thrashing on a large
      // score.
      if (this._autoAdjustRenderTime) {
        this.renderTime = new Date().valueOf() - this.startRenderTime;
      }
      $('body').removeClass('show-render-progress');
      // indicate the display is 'clean' and up-to-date with the score
      $('body').removeClass('refresh-1');
      if (this.measureMapper !== null) {
        this.measureMapper.updateMap();
        if (layoutDebug.mask & layoutDebug.values['artifactMap']) {
          this.score?.staves.forEach((staff) => {
            staff.measures.forEach((mm) => {
              mm.voices.forEach((voice: SmoVoice) => {
                voice.notes.forEach((note) => {
                  if (note.logicalBox) {
                    const page = this.vexContainers.getRendererFromPoint(note.logicalBox);
                    if (page) {
                      const noteBox = SvgHelpers.smoBox(note.logicalBox);
                      noteBox.y -= page.box.y;
                      SvgHelpers.debugBox(page.svg, noteBox, 'measure-place-dbg', 0);
                    }
                  }
                });
              });
            });
          });
        }
      }
      this.backgroundRender = false;
    }
  }
  
  // ### unrenderMeasure
  // All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
  // element in such a way that some of the logical elements go away (e.g. when deleting a measure).
  unrenderMeasure(measure: SmoMeasure) {
    if (!measure) {
      return;
    }
    const modId = 'mod-' + measure.measureNumber.staffId + '-' + measure.measureNumber.measureIndex;
    const context = this.vexContainers.getRenderer(measure.svg.logicalBox);
    if (!context) {
      return;
    }
    SvgHelpers.removeElementsByClass(context.svg, modId);

    if (measure.svg.element) {
      measure.svg.element.remove();
      measure.svg.element = null;
      if (measure.svg.tabElement) {
        measure.svg.tabElement.remove();
        measure.svg.tabElement = undefined;
      }
    }
    const renderPage = this.renderedPages[measure.svg.pageIndex];
    if (renderPage) {
      this.renderedPages[measure.svg.pageIndex] = null;
    }
    measure.setYTop(0, 'unrender');
  }
 // ### _renderModifiers
  // ### Description:
  // Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
  // is on a different system due to wrapping.
  renderModifiers(staff: SmoSystemStaff, system: VxSystem): StaffModifierBase[] {
    let nextNote: SmoSelection | null = null;
    let lastNote: SmoSelection | null = null;
    let testNote: Note | null = null;
    let vxStart: Note | null = null;
    let vxEnd: Note | null = null;
    const modifiersToBox: StaffModifierBase[] = [];
    const removedModifiers: StaffModifierBase[] = [];
    if (this.score === null || this.measureMapper === null) {
      return [];
    }
    const renderedId: Record<string, boolean> = {};
    staff.renderableModifiers.forEach((modifier) => {
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
      if (!vxStart && !vxEnd || renderedId[modifier.attrs.id]) {
        return;
      }
      renderedId[modifier.attrs.id] = true;
      system.renderModifier(this.measureMapper!.scroller, modifier, vxStart, vxEnd, startNote, endNote);
      modifiersToBox.push(modifier);
    });
    // Silently remove modifiers from the score if the endpoints no longer exist
    removedModifiers.forEach((mod) => {
      staff.removeStaffModifier(mod);
    });
    return modifiersToBox;
  }

  drawPageLines() {
    let i = 0;
    const printing = $('body').hasClass('print-render');
    const layoutMgr = this.score!.layoutManager;
    if (printing || !layoutMgr) {
      return;
    }
    for (i = 1; i < layoutMgr.pageLayouts.length; ++i) {
      const context = this.vexContainers.getRendererForPage(i - 1);
      if (context) {
        $(context.svg).find('.pageLine').remove();
        const scaledPage = layoutMgr.getScaledPageLayout(i);
        const y = scaledPage.pageHeight * i - context.box.y;
        SvgHelpers.line(context.svg, 0, y, scaledPage.pageWidth, y,
          { strokeName: 'line', stroke: '#321', strokeWidth: '2', strokeDasharray: '4,1', fill: 'none', opacity: 1.0 }, 'pageLine');
  
      }
    }
  }
  replaceSelection(staffMap: Record<number | string, { system: VxSystem, staff: SmoSystemStaff }>, change: SmoSelection) {
    let system: VxSystem | null = null;
    if (this.renderedPages[change.measure.svg.pageIndex]) {
      this.renderedPages[change.measure.svg.pageIndex] = null;
    }
    SmoBeamer.applyBeams(change.measure);
    // Defer modifier update until all selected measures are drawn.
    if (!staffMap[change.staff.staffId]) {
      const context = this.vexContainers.getRenderer(change.measure.svg.logicalBox);
      if (context) {
        system = new VxSystem(context, change.measure.staffY, change.measure.svg.lineIndex, this.score!);
        staffMap[change.staff.staffId] = { system, staff: change.staff };  
      }
    } else {
      system = staffMap[change.staff.staffId].system;
    }
    const selections = SmoSelection.measuresInColumn(this.score!, change.measure.measureNumber.measureIndex);
    const measuresToMeasure: SmoMeasure[] = [];
    selections.forEach((selection) => {
      if (system !== null && this.measureMapper !== null) {
        this.unrenderMeasure(selection.measure);
        system.renderMeasure(selection.measure, false);
        measuresToMeasure.push(selection.measure);
      }
    });
    if (system) {
      this.measureRenderedElements(system, measuresToMeasure, [], false);
    }
  }

  async renderAllMeasures(lines: number[]) {
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
    this.renderingPage = -1;
    this.vexContainers.updateContainerOffset(this.measureMapper!.scroller.scrollState);
    await this._renderNextSystem(0, lines, printing);
  }
  // Number the measures at the first measure in each system.
  numberMeasures() {
    const printing: boolean = $('body').hasClass('print-render');
    const staff = this.score!.staves[0];
    const measures = staff.measures.filter((measure) => measure.measureNumber.systemIndex === 0);
    $('.measure-number').remove();

    measures.forEach((measure) => {
      const context = this.vexContainers.getRenderer(measure.svg.logicalBox);
      if (measure.measureNumber.localIndex > 0 && measure.measureNumber.systemIndex === 0 && measure.svg.logicalBox && context) {
        const numAr: any[] = [];
        const modBox = context.offsetSvgPoint(measure.svg.logicalBox);
        numAr.push({ y: modBox.y - 10 });
        numAr.push({ x: modBox.x });
        numAr.push({ 'font-family': SourceSansProFont.fontFamily });
        numAr.push({ 'font-size': '10pt' });
        SvgHelpers.placeSvgText(context.svg, numAr, 'measure-number', (measure.measureNumber.localIndex + 1).toString());

        // Show line-feed symbol
        if (measure.format.systemBreak && !printing) {
          const starAr: any[] = [];
          const symbol = '\u21b0';
          starAr.push({ y: modBox.y - 5 });
          starAr.push({ x: modBox.x + 25 });
          starAr.push({ 'font-family': SourceSansProFont.fontFamily });
          starAr.push({ 'font-size': '12pt' });
          SvgHelpers.placeSvgText(context.svg, starAr, 'measure-format', symbol);
        }
      }
    });
  }

  /**
   * This calculates the position of all the elements in the score, then renders the score
   * @returns 
   */
  async layout() {
    if (!this.score) {
      return;
    }
    const score = this.score;
    $('head title').text(this.score.scoreInfo.name);
    const formatter = new SuiLayoutFormatter(score, this.vexContainers, this.renderedPages);
    Object.keys(this.renderedPages).forEach((key) => {
      this.vexContainers.clearModifiersForPage(parseInt(key));
    });
    const startPageCount = this.score.layoutManager!.pageLayouts.length;
    this.formatter = formatter;
    formatter.layout();    
    if (this.formatter.trimPages(startPageCount)) {
      this.setViewport();
    }
    this.measuresToMap = [];
    this.lyricsToOffset = new Map();
    await this.renderAllMeasures(formatter.lines);
  } 
}
