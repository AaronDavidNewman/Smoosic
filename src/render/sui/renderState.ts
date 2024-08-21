// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support the state machine associated with background music rendering.
 * @module renderState
 */
import { SmoMeasure } from '../../smo/data/measure';
import { UndoBuffer, UndoEntry } from '../../smo/xform/undo';
import { SmoRenderConfiguration } from './configuration';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { VxSystem } from '../vex/vxSystem';
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SuiMapper } from './mapper';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SuiScoreRender, ScoreRenderParams } from './scoreRender';
import { SuiExceptionHandler } from '../../ui/exceptions';
import { VexFlow, setFontStack } from '../../common/vex';
declare var $: any;


export var scoreChangeEvent = 'smoScoreChangeEvent';
/**
 * Manage the state of the score rendering.  The score can be rendered either completely,
 * or partially for editing.  This class works with the RenderDemon to decide when to
 * render the score after it has been modified, and keeps track of what the current
 * render state is (dirty, etc.)
 * @category SuiRender
 * */
export class SuiRenderState {
  static debugMask: number = 0;
  dirty: boolean;
  replaceQ: SmoSelection[];
  stateRepCount: 0;
  viewportChanged: boolean;
  _resetViewport: boolean;
  measureMapper: SuiMapper | null;
  passState: number = SuiRenderState.passStates.initial;
  _score: SmoScore | null = null;
  _backupZoomScale: number = 0;
  renderer: SuiScoreRender;
  idleRedrawTime: number;
  idleLayoutTimer: number = 0; // how long the score has been idle
  demonPollTime: number;
  handlingRedraw: boolean = false;
  // signal to render demon that we have suspended background
  // rendering because we are recording or playing actions.
  suspendRendering: boolean = false;
  undoBuffer: UndoBuffer;
  undoStatus: number = 0;

  constructor(config: ScoreRenderParams) {
    this.dirty = true;
    this.replaceQ = [];
    this.stateRepCount = 0;
    this.setPassState(SuiRenderState.passStates.initial, 'ctor');
    this.viewportChanged = false;
    this._resetViewport = false;
    this.measureMapper = null;
    this.renderer = new SuiScoreRender(config);
    this.idleRedrawTime = config.config.idleRedrawTime;
    this.demonPollTime = config.config.demonPollTime;
    this.undoBuffer = config.undoBuffer;
  }
  get elementId() {
    return this.renderer.elementId;
  }
  get pageMap() {
    return this.renderer.vexContainers;
  }
  // ### setMeasureMapper
  // DI/notifier pattern.  The measure mapper/tracker is updated when the score is rendered
  // so the UI stays in sync with the location of elements in the score.
  setMeasureMapper(mapper: SuiMapper) {
    this.measureMapper = mapper;
    this.renderer.measureMapper = mapper;
  }
  set stepMode(value: boolean) {
    this.suspendRendering = value;
    this.renderer.autoAdjustRenderTime = !value;
    if (this.measureMapper) {
      this.measureMapper.deferHighlightMode = !value;
    }
  }

  // ### createScoreRenderer
  // ### Description;
  // to get the score to appear, a div and a score object are required.  The layout takes care of creating the
  // svg element in the dom and interacting with the vex library.
  static createScoreRenderer(config: SmoRenderConfiguration, renderElement: Element, score: SmoScore, undoBuffer: UndoBuffer): SuiRenderState {
    const ctorObj: ScoreRenderParams = {
      config,
      elementId: renderElement,
      score,
      undoBuffer
    };
    const renderer = new SuiRenderState(ctorObj);
    return renderer;
  }
  static get passStates(): Record<string, number> {
    return { initial: 0, clean: 2, replace: 3 };
  }
  get renderElement(): Element {
    return this.elementId;
  }
  notifyFontChange() {
    setFontStack(this.score!.engravingFont);
  }
  addToReplaceQueue(selection: SmoSelection | SmoSelection[]) {
    let selections = [];
    if (!Array.isArray(selection)) {
      selections = [selection];
    } else {
      selections = selection;
    }
    if (this.passState === SuiRenderState.passStates.clean ||
      this.passState === SuiRenderState.passStates.replace) {        
        selections.forEach((selection) => {
          const existing = this.replaceQ.find((sel) => 
            sel.selector.staff === selection.selector.staff && sel.selector.measure === selection.selector.measure);
          if (existing) {
            existing._measure = selection._measure;
          } else {
            this.replaceQ.push(selection);
          }
        })
      this.setDirty();
    }
  }
  addColumnToReplaceQueue(mm: number) {
    if (!this.score) {
      return;
    }
    for (let i = 0; i < this.score.staves.length; ++i) {
      const selection = SmoSelection.measureSelection(this.score, i, mm);
      if (selection) {
        this.addToReplaceQueue(selection);
      }
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
  clearLine(measure: SmoMeasure) {
    const page = measure.svg.pageIndex;
    this.renderer.clearRenderedPage(page);
  }
  get renderStateClean() {
    return this.passState === SuiRenderState.passStates.clean && this.renderer.backgroundRender === false;
  }
  get renderStateRendered() {
    return (this.passState === SuiRenderState.passStates.clean && this.renderer.backgroundRender === false) ||
      (this.passState === SuiRenderState.passStates.replace && this.replaceQ.length === 0 && this.renderer.backgroundRender === false);
  }
  /**
   * Do a quick re-render of a measure that has changed, defer the whole score.
   * @returns 
   */
  replaceMeasures() {
    const staffMap: Record<number | string, { system: VxSystem, staff: SmoSystemStaff }> = {};
    if (this.score === null || this.measureMapper === null || this.replaceQ.length === 0) {
      return;
    }
    this.replaceQ.forEach((change) => {
      this.renderer.replaceSelection(staffMap, change);
    });
    Object.keys(staffMap).forEach((key) => {
      const obj = staffMap[key];
      this.renderer.renderModifiers(obj.staff, obj.system);
      obj.system.renderEndings(this.measureMapper!.scroller);
      obj.system.updateLyricOffsets();
    });
    this.replaceQ = [];
  }
  async preserveScroll() {
    const scrollState = this.measureMapper!.scroller.scrollState;
    await this.renderPromise();
    this.measureMapper!.scroller.restoreScrollState(scrollState);
  }

  _renderStatePromise(condition: () => boolean): Promise<void> {
    const oldSuspend = this.suspendRendering;
    this.suspendRendering = false;
    const self = this;
    const endAction = () => {
      self.suspendRendering = oldSuspend;
    };
    return PromiseHelpers.makePromise(condition, endAction, null, this.demonPollTime);
  }
  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  renderPromise(): Promise<void> {
    return this._renderStatePromise(() => this.renderStateClean);
  }

  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  updatePromise() {
    this.replaceMeasures();
    return this._renderStatePromise(() => this.renderStateRendered);
  }
  async handleRedrawTimer() {
    if (this.handlingRedraw) {
      return;
    }
    if (this.suspendRendering) {
      return;
    }
    this.handlingRedraw = true;
    const redrawTime = Math.max(this.renderer.renderTime, this.idleRedrawTime);
    // If there has been a change, redraw the score
    if (this.passState === SuiRenderState.passStates.initial) {
      this.dirty = true;
      this.undoStatus = this.undoBuffer.opCount;
      this.idleLayoutTimer = Date.now();

      // indicate the display is 'dirty' and we will be refreshing it.
      $('body').addClass('refresh-1');
      try {
        // Sort of a hack.  If the viewport changed, the scroll state is already reset
        // so we can't preserver the scroll state.
        if (!this.renderer.viewportChanged) {
          this.preserveScroll();
        }
        await this.render();
      } catch (ex) {
        console.error(ex);
        SuiExceptionHandler.instance.exceptionHandler(ex);
        this.handlingRedraw = false;
      }
    } else if (this.passState === SuiRenderState.passStates.replace && this.undoStatus === this.undoBuffer.opCount) {
      // Consider navigation as activity when deciding to refresh
      this.idleLayoutTimer = Math.max(this.idleLayoutTimer, this.measureMapper!.getIdleTime());
      $('body').addClass('refresh-1');
      // Do we need to refresh the score?
      if (this.renderer.backgroundRender === false && Date.now() - this.idleLayoutTimer > redrawTime) {
        this.passState = SuiRenderState.passStates.initial;
        if (!this.renderer.viewportChanged) {
          this.preserveScroll();
        }
        this.render();
      }
    } else {
      this.idleLayoutTimer = Date.now();
      this.undoStatus = this.undoBuffer.opCount;
      if (this.replaceQ.length > 0) {
        this.render();
      }
    }
    this.handlingRedraw = false;
  }
  pollRedraw() {
    setTimeout(async () => {
      await this.handleRedrawTimer();
      this.pollRedraw();
    }, this.demonPollTime);
  }

  startDemon() {
    this.pollRedraw();
  }
  renderTextGroup(gg: SmoTextGroup) {
    this.renderer.renderTextGroup(gg);
  }
  /**
   * Set the SVG viewport
   * @param reset whether to re-render the entire SVG DOM
   * @returns 
   */
  setViewport() {
    if (!this.score || !this.renderer) {
      return;
    }
    this.renderer.setViewport();
    this.score!.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (measure.svg.logicalBox) {
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
    this.setViewport();
    this.setRefresh();

    const promise = new Promise<void>((resolve) => {
      const poll = () => {
        setTimeout(() => {
          if (!self.dirty && !self.renderer.backgroundRender) {
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
    this.setViewport();
    this.setRefresh();
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
    if (SuiRenderState.debugMask) {
      console.log(msg);
    }
    this.passState = st;
  }

  get score(): SmoScore | null {
    return this._score;
  }

  // used for debugging and drawing dots.
  dbgDrawDot(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise: boolean) {
    const context = this.renderer.getRenderer({ x, y });
    if (context) {
      context.getContext().beginPath();
      context.getContext().arc(x, y, radius, startAngle, endAngle, counterclockwise);
      context.getContext().closePath();
      context.getContext().fill();  
    }
  }
  set score(score: SmoScore | null) {
    if (score === null) {
      return;
    }
    /* if (this._score) {
      shouldReset = true;
    } */
    this.setPassState(SuiRenderState.passStates.initial, 'load score');
    const font = score.engravingFont;
    this.dirty = true;
    this._score = score;
    this.renderer.score = score;
    this.notifyFontChange();
    // if (shouldReset) {
    this.setViewport();
    if (this.measureMapper) {
      this.measureMapper.loadScore();
    }
  }

  unrenderColumn(measure: SmoMeasure) {
    this.score!.staves.forEach((staff) => {
      this.renderer.unrenderMeasure(staff.measures[measure.measureNumber.measureIndex]);
    });
  }

  // ### forceRender
  // For unit test applictions that want to render right-away
  forceRender() {
    this.setRefresh();
    this.render();
  }
  unrenderMeasure(measure: SmoMeasure) {
    this.renderer.unrenderMeasure(measure);
  }
  async rerenderTextGroups() {
    await this.renderer.rerenderTextGroups();
  }
  async unrenderTextGroups() {
    this.renderer.unrenderTextGroups();
  }
  async render(): Promise<any> {
    if (this._resetViewport) {
      this.setViewport();
      this._resetViewport = false;
    }
    try {
      if (SuiRenderState.passStates.replace === this.passState) {
        this.replaceMeasures();
      } else if (SuiRenderState.passStates.initial === this.passState) {
        if (this.renderer.backgroundRender) {
          return;
        }
        this.renderer.layout();
        this.renderer.drawPageLines();
        this.setPassState(SuiRenderState.passStates.clean, 'rs: complete render');
      }
    } catch (excp) {
      console.warn('exception in render: ' + excp);
    }
    this.dirty = false;
  }
}