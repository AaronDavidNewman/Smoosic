// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMeasure } from '../../smo/data/measure';
import { UndoBuffer } from '../../smo/xform/undo';
import { SmoAttrs,  SvgBox } from '../../smo/data/common';
import { SmoRenderConfiguration } from './configuration';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgHelpers } from './svgHelpers';
import { VxSystem } from '../vex/vxSystem';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoScore } from '../../smo/data/score';
import { smoBeamerFactory } from '../../smo/xform/beamers';
import { SuiMapper } from './mapper';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { VxMeasure } from '../vex/vxMeasure';
import { SmoTextGroup } from '../../smo/data/scoreModifiers';

export interface ScoreRenderParams {
  elementId: any,
  score: SmoScore
}
declare var SmoConfig: SmoRenderConfiguration;
declare var $: any;
const VF = eval('Vex.Flow');

// ## SuiRenderState
// Manage the state of the score rendering.  The score can be rendered either completely,
// or partially for editing.  This class works with the RenderDemon to decide when to
// render the score after it has been modified, and keeps track of what the current
// render state is (dirty, etc.)
export abstract class SuiRenderState {
  attrs: SmoAttrs;
  dirty: boolean;
  replaceQ: SmoSelection[];
  renderTime: number;
  stateRepCount: 0;
  backgroundRender: boolean;
  viewportChanged: boolean;
  _resetViewport: boolean;
  measureMapper: SuiMapper | null;
  passState: number = SuiRenderState.passStates.initial;
  _score: SmoScore | null = null;
  renderer: any;
  elementId: any;
  _backupZoomScale: number = 0;
  // signal to render demon that we have suspended background
  // rendering because we are recording or playing actions.
  suspendRendering: boolean = false;
  autoAdjustRenderTime: boolean = true;

  constructor(ctor: string) {
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
    this.dirty = true;
    this.replaceQ = [];
    this.renderTime = 0;  // ms to render before time slicing
    this.stateRepCount = 0;
    this.backgroundRender = false;
    this.setPassState(SuiRenderState.passStates.initial, 'ctor');
    this.viewportChanged = false;
    this._resetViewport = false;
    this.measureMapper = null;
  }
  abstract unrenderAll(): void;
  abstract layout(): void;
  abstract renderScoreModifiers(): void;
  abstract renderTextGroup(t: SmoTextGroup): void;
  
  // ### setMeasureMapper
  // DI/notifier pattern.  The measure mapper/tracker is updated when the score is rendered
  // so the UI stays in sync with the location of elements in the score.
  setMeasureMapper(mapper: SuiMapper) {
    this.measureMapper = mapper;
  }
  set stepMode(value: boolean) {
    this.suspendRendering = value;
    this.autoAdjustRenderTime = !value;
    if (this.measureMapper) {
      this.measureMapper.deferHighlightMode = !value;
    }
  }

  static get Fonts(): any {
    return {
      Bravura: [VF.Fonts.Bravura(), VF.Fonts.Gonville(), VF.Fonts.Custom()],
      Gonville: [VF.Fonts.Gonville(), VF.Fonts.Bravura(), VF.Fonts.Custom()],
      Petaluma: [VF.Fonts.Petaluma(), VF.Fonts.Gonville(), VF.Fonts.Custom()],
      Leland: [VF.Fonts.Leland(), VF.Fonts.Bravura(), VF.Fonts.Gonville(), VF.Fonts.Custom()]
    };
  }

  static setFont(font: string) {
    VF.DEFAULT_FONT_STACK = SuiRenderState.Fonts[font];
  }

  static get passStates(): Record<string, number> {
    return { initial: 0, clean: 2, replace: 3 };
  }
  get renderElement(): Element {
    return this.elementId;
  }
  addToReplaceQueue(selection: SmoSelection | SmoSelection[]) {
    if (this.passState === SuiRenderState.passStates.clean ||
      this.passState === SuiRenderState.passStates.replace) {
      if (Array.isArray(selection)) {
        this.replaceQ = this.replaceQ.concat(selection);
      } else {
        this.replaceQ.push(selection);
      }
      this.setDirty();
    }
  }

  setDirty() {
    if (!this.dirty) {
      this.dirty = true;
      if (this.passState === SuiRenderState.passStates.clean) {
        this.setPassState(SuiRenderState.passStates.replace, 'setDirty');
      }
    }
  }
  setRefresh() {
    this.dirty = true;
    this.setPassState(SuiRenderState.passStates.initial, 'setRefresh');
  }
  rerenderAll() {
    this.dirty = true;
    this.setPassState(SuiRenderState.passStates.initial, 'rerenderAll');
    this._resetViewport = true;
  }

  remapAll() {
    this.setRefresh();
  }
  get renderStateClean() {
    return this.passState === SuiRenderState.passStates.clean && this.backgroundRender === false;
  }
  get renderStateRendered() {
    return this.passState === SuiRenderState.passStates.clean ||
      (this.passState === SuiRenderState.passStates.replace && this.replaceQ.length === 0 && this.backgroundRender === false);
  }
  preserveScroll() {
    const scrollState = this.measureMapper!.scroller.scrollState;
    this.renderPromise().then(() => {
      this.measureMapper!.scroller.restoreScrollState(scrollState);
    });
  }

  _renderStatePromise(condition: () => boolean): Promise<void> {
    const oldSuspend = this.suspendRendering;
    this.suspendRendering = false;
    const self = this;
    const endAction = () => {
      self.suspendRendering = oldSuspend;
    };
    return PromiseHelpers.makePromise(condition, endAction, null, SmoConfig.demonPollTime);
  }
  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  renderPromise(): Promise<void> {
    return this._renderStatePromise(() => this.renderStateClean);
  }

  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  updatePromise() {
    this._replaceMeasures();
    return this._renderStatePromise(() => this.renderStateRendered);
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
        if (!measure.format.isDefault && !printing) {
          const starAr = [];
          const symbol = measure.format.systemBreak ? '\u21b5' : '\u21b0';
          starAr.push({ y: measure.svg.logicalBox.y - 5 });
          starAr.push({ x: measure.svg.logicalBox.x + 25 });
          starAr.push({ 'font-family': SourceSansProFont.fontFamily });
          starAr.push({ 'font-size': '12pt' });
          SvgHelpers.placeSvgText(this.context.svg, starAr, 'measure-format', symbol);
        }
      }
    });
  }

  // ### _setViewport
  // Create (or recrate) the svg viewport, considering the dimensions of the score.
  _setViewport(reset: boolean, elementId: any) {
    if (this.score === null) {
      return;
    }
    const layoutManager = this.score!.layoutManager!;
    // All pages have same width/height, so use that
    const layout = layoutManager.getGlobalLayout();

    // zoomScale is the zoom level pct.
    // layout.svgScale is note size pct, used to calculate viewport size.  Larger viewport
    //   vs. window size means smaller notes/more notes per page.
    // renderScale is the product of the zoom and svg scale, used to size the window in client coordinates
    const zoomScale = layoutManager.getZoomScale();
    const renderScale = layout.svgScale * zoomScale;
    const totalHeight = layout.pageHeight * layoutManager.pageLayouts.length * zoomScale;
    const pageWidth = layout.pageWidth * zoomScale;
    $(elementId).css('width', '' + Math.round(pageWidth) + 'px');
    $(elementId).css('height', '' + Math.round(totalHeight) + 'px');
    // Reset means we remove the previous SVG element.  Otherwise, we just alter it
    if (reset) {
      $(elementId).html('');
      this.renderer = new VF.Renderer(elementId, VF.Renderer.Backends.SVG);
      this.viewportChanged = true;
      if (this.measureMapper) {
        this.measureMapper.scroller.scrollAbsolute(0, 0);
      }
    }
    SvgHelpers.svgViewport(this.context.svg, 0, 0, pageWidth, totalHeight, renderScale);
    // this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
    console.log('layout setViewport: pstate initial');
    this.dirty = true;
    if (this.measureMapper) {
      this.measureMapper.scroller.updateViewport();
    }
  }

  setViewport(reset: boolean) {
    this._setViewport(reset, this.elementId);
    this.score!.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (measure.svg.logicalBox && reset) {
          measure.svg.history = ['reset'];
        }
      });
    });
  }
  renderForPrintPromise(): Promise<any> {
    $('body').addClass('print-render');
    const self = this;
    if (!this.score) {
      return PromiseHelpers.emptyPromise();
    }
    const layoutMgr = this.score!.layoutManager!;
    const layout = layoutMgr.getGlobalLayout();
    this._backupZoomScale = layout.zoomScale;
    layout.zoomScale = 1.0;
    layoutMgr.updateGlobalLayout(layout);
    this.setViewport(true);
    this.setRefresh();

    const promise = new Promise<void>((resolve) => {
      const poll = () => {
        setTimeout(() => {
          if (!self.dirty && !self.backgroundRender) {
            // tracker.highlightSelection();
            $('body').removeClass('print-render');
            $('.vf-selection').remove();
            $('body').addClass('printing');
            $('.musicRelief').css('height', '');
            resolve();
          } else {
            poll();
          }
        }, 500);
      };
      poll();
    });
    return promise;
  }

  restoreLayoutAfterPrint() {
    const layout = this.score!.layoutManager!.getGlobalLayout();
    layout.zoomScale = this._backupZoomScale;
    this.score!.layoutManager!.updateGlobalLayout(layout);
    this.setViewport(true);
    this.setRefresh();
  }

  clearLine(measure: SmoMeasure) {
    const lineIndex = measure.svg.lineIndex;
    const startIndex = (lineIndex > 1 ? lineIndex - 1 : 0);
    let i = 0;
    for (i = startIndex; i < lineIndex + 1; ++i) {
      // for lint error
      const index = i;
      this.score!.staves.forEach((staff) => {
        const mms = staff.measures.filter((mm) => mm.svg.lineIndex === index);
        mms.forEach((mm) => {
          mm.svg.logicalBox = SvgBox.default;
        });
      });
    }
  }

  setPassState(st: number, location: string) {
    const oldState = this.passState;
    let msg = '';
    if (oldState !== st) {
      this.stateRepCount = 0;
    } else {
      this.stateRepCount += 1;
    }

    msg = location + ': passState ' + this.passState + '=>' + st;
    if (this.stateRepCount > 0) {
      msg += ' (' + this.stateRepCount + ')';
    }
    console.log(msg);
    this.passState = st;
  }

  // ### get context
  // ### Description:
  // return the VEX renderer context.
  get context() {
    return this.renderer.getContext();
  }
  get svg() {
    return this.context.svg;
  }

  get score(): SmoScore | null {
    return this._score;
  }

  set score(score: SmoScore | null) {
    let shouldReset = false;
    if (score === null) {
      return;
    }
    if (this._score) {
      shouldReset = true;
    }
    this.setPassState(SuiRenderState.passStates.initial, 'load score');
    const font = score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (!font) {
      return;
    }
    SuiRenderState.setFont(font.family);
    this.dirty = true;
    this._score = score;
    if (shouldReset) {
      this.renderTime = 0;
      if (this.measureMapper) {
        this.measureMapper.loadScore();
      }
      this.setViewport(true);
    }
  }

  // ### undo
  // Undo is handled by the render state machine, because the layout has to first
  // delete areas of the viewport that may have changed,
  // then create the modified score, then render the 'new' score.
  undo(undoBuffer: UndoBuffer) {
    const buffer = undoBuffer.peek();
    let op = 'setDirty';
    // Unrender the modified music because the IDs may change and normal unrender won't work
    if (buffer) {
      const sel = buffer.selector;
      if (buffer.type === UndoBuffer.bufferTypes.MEASURE && this.unrenderMeasure !== null) {
        const mSelection = SmoSelection.measureSelection(this.score!, sel.staff, sel.measure);
        if (mSelection !== null) {
          this.unrenderMeasure(mSelection.measure);
        }
      } else if (buffer.type === UndoBuffer.bufferTypes.STAFF && this.unrenderStaff !== null) {
        const sSelection = SmoSelection.measureSelection(this.score!, sel.staff, 0);
        if (sSelection !== null) {
          this.unrenderStaff(sSelection.staff);
        }
        op = 'setRefresh';
      } else {
        this.unrenderAll();
        op = 'setRefresh';
      }
      this._score = undoBuffer.undo(this._score!);
      (this as any)[op]();
    }
  }

  // ### unrenderMeasure
  // All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
  // element in such a way that some of the logical elements go away (e.g. when deleting a measure).
  unrenderMeasure(measure: SmoMeasure) {
    if (!measure) {
      return;
    }
    $(this.renderer.getContext().svg).find('g.' + measure.getClassId()).remove();
    measure.setYTop(0, 'unrender');
  }

  unrenderColumn(measure: SmoMeasure) {
    this.score!.staves.forEach((staff) => {
      this.unrenderMeasure(staff.measures[measure.measureNumber.measureIndex]);
    });
  }

  // ### unrenderStaff
  // ### Description:
  // See unrenderMeasure.  Like that, but with a staff.
  unrenderStaff(staff: SmoSystemStaff) {
    staff.measures.forEach((measure) => {
      this.unrenderMeasure(measure);
    });
    staff.modifiers.forEach((modifier) => {
      $(this.renderer.getContext().svg).find('g.' + modifier.attrs.id).remove();
    });
  }

  // ### _renderModifiers
  // ### Description:
  // Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
  // is on a different system due to wrapping.
  _renderModifiers(staff: SmoSystemStaff, system: VxSystem) {
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

  _drawPageLines() {
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
        { stroke: '#321', strokeWidth: '2', strokeDasharray: '4,1', fill: 'none', opacity: 1.0 }, 'pageLine');
    }
  }

  // ### _replaceMeasures
  // Do a quick re-render of a measure that has changed.
  _replaceMeasures() {
    const staffMap: Record<number | string, { system: VxSystem, staff: SmoSystemStaff }> = {};
    let system: VxSystem | null = null;
    if (this.score === null || this.measureMapper === null) {
      return;
    }
    this.replaceQ.forEach((change) => {
      smoBeamerFactory.applyBeams(change.measure);
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
    });
    Object.keys(staffMap).forEach((key) => {
      const obj = staffMap[key];
      this._renderModifiers(obj.staff, obj.system);
      obj.system.renderEndings(this.measureMapper!.scroller);
      obj.system.updateLyricOffsets();
    });
    this.replaceQ = [];
  }

  // ### forceRender
  // For unit test applictions that want to render right-away
  forceRender() {
    this.setRefresh();
    this.render();
  }

  render() {
    if (this._resetViewport) {
      this.setViewport(true);
      this._resetViewport = false;
    }
    try {
      if (SuiRenderState.passStates.replace === this.passState) {
        this._replaceMeasures();
      } else if (SuiRenderState.passStates.initial === this.passState) {
        if (this.backgroundRender) {
          return;
        }
        this.layout();
        this._drawPageLines();
        this.setPassState(SuiRenderState.passStates.clean, 'rs: complete render');
      }
    } catch (excp) {
      console.warn('exception in render: ' + excp);
    }
    this.dirty = false;
  }
}