// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support the state machine associated with background music rendering.
 * @module renderState
 */
import { SmoMeasure } from '../../smo/data/measure';
import { UndoBuffer } from '../../smo/xform/undo';
import { SvgBox } from '../../smo/data/common';
import { SmoRenderConfiguration } from './configuration';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgHelpers } from './svgHelpers';
import { VxSystem } from '../vex/vxSystem';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoScore } from '../../smo/data/score';
import { SmoBeamer } from '../../smo/xform/beamers';
import { SuiMapper } from './mapper';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { VxMeasure } from '../vex/vxMeasure';
import { SmoTextGroup } from '../../smo/data/scoreModifiers';

/**
 * a renderer creates the SVG render context for vexflow from the given element. Then it
 * renders the initial score.
 * @category SuiRenderParams
 */
export interface ScoreRenderParams {
  elementId: any,
  score: SmoScore,
  config: SmoRenderConfiguration
}
declare var $: any;
const VF = eval('Vex.Flow');

/**
 * Manage the state of the score rendering.  The score can be rendered either completely,
 * or partially for editing.  This class works with the RenderDemon to decide when to
 * render the score after it has been modified, and keeps track of what the current
 * render state is (dirty, etc.)
 * @category SuiRender
 * */
export abstract class SuiRenderState {
  config: SmoRenderConfiguration;
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
  renderer: any = null;
  elementId: any;
  _backupZoomScale: number = 0;
  // signal to render demon that we have suspended background
  // rendering because we are recording or playing actions.
  suspendRendering: boolean = false;
  autoAdjustRenderTime: boolean = true;

  constructor(config: SmoRenderConfiguration) {
    this.dirty = true;
    this.config = config;
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
  abstract renderModifiers(staff: SmoSystemStaff, system: VxSystem): void;
  abstract replaceMeasures(): void;
  abstract renderTextGroup(t: SmoTextGroup): void;
  abstract drawPageLines(): void;
  
  
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

  static get setFonts(): Record<string, Function> {
    return {
      Bravura: () => { VF.setMusicFont('Bravura', 'Gonville', 'Custom'); },
      Gonville: () => { VF.setMusicFont('Gonville', 'Bravura', 'Custom'); },
      Petaluma: () => { VF.setMusicFont('Petaluma', 'Bravura', 'Custom'); },
      Leland: () => { VF.setMusicFont('Leland', 'Bravura', 'Gonville', 'Custom'); }
    };
  }

  static setFont(font: string) {
    SuiRenderState.setFonts[font]();
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
    return (this.passState === SuiRenderState.passStates.clean && this.backgroundRender === false) ||
      (this.passState === SuiRenderState.passStates.replace && this.replaceQ.length === 0 && this.backgroundRender === false);
  }
  get viewportCreated() {
    return this.renderer !== null;
  }
  preserveScroll() {
    const scrollState = this.measureMapper!.scroller.scrollState;
    return this.renderPromise().then(() => {
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
    return PromiseHelpers.makePromise(condition, endAction, null, this.config.demonPollTime);
  }
  createViewportPromise(): Promise<void> {
    const self = this;
    const condition = () => {
      return self.viewportCreated;
    }
    return PromiseHelpers.makePromise(condition, null, null, this.config.demonPollTime)
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

  /**
   * Set the SVG viewport
   * @param reset whether to re-render the entire SVG DOM
   * @returns 
   */
  setViewport(reset: boolean) {
    if (!this.score) {
      return;
    }
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
    if (score === null) {
      return;
    }
    /* if (this._score) {
      shouldReset = true;
    } */
    this.setPassState(SuiRenderState.passStates.initial, 'load score');
    const font = score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (!font) {
      return;
    }
    SuiRenderState.setFont(font.family);
    this.dirty = true;
    this._score = score;
    // if (shouldReset) {
      this.renderTime = 0;
      this.setViewport(true);
      if (this.measureMapper) {
        this.measureMapper.loadScore();
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
        this.replaceMeasures();
      } else if (SuiRenderState.passStates.initial === this.passState) {
        if (this.backgroundRender) {
          return;
        }
        this.layout();
        this.drawPageLines();
        this.setPassState(SuiRenderState.passStates.clean, 'rs: complete render');
      }
    } catch (excp) {
      console.warn('exception in render: ' + excp);
    }
    this.dirty = false;
  }
}