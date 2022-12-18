// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { SmoTextGroup } from '../../smo/data/scoreText';
import { SmoGraceNote } from '../../smo/data/noteModifiers';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { StaffModifierBase } from '../../smo/data/staffModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { UndoBuffer } from '../../smo/xform/undo';
import { PasteBuffer } from '../../smo/xform/copypaste';
import { SuiScroller } from './scroller';
import { SvgHelpers } from './svgHelpers';
import { SuiTracker } from './tracker';
import { createTopDomContainer } from '../../common/htmlHelpers';
import { SmoRenderConfiguration } from './configuration';
import { SuiRenderState } from './renderState';
import { ScoreRenderParams } from './scoreRender';
import { SmoOperation } from '../../smo/xform/operations';
import { SuiAudioPlayer } from '../audio/player';
import { SuiAudioAnimationParams } from '../audio/musicCursor';

declare var $: any;

/**
 * Indicates a stave is/is not displayed in the score
 * @category SuiRender
 */
export interface ViewMapEntry {
  show: boolean;
}

/**
 * Base class for all operations on the rendered score.  The base class handles the following:
 * 1. Undo and recording actions for the operation
 * 2. Maintain/change which staves in the score are displayed (staff map)
 * 3. Mapping between the displayed score and the data representation
 * @category SuiRender
 */
export abstract class SuiScoreView {
  static Instance: SuiScoreView | null = null;
  score: SmoScore; // The score that is displayed
  storeScore: SmoScore;  // the full score, including invisible staves
  staffMap: number[]; // mapping the 2 things above
  storeUndo: UndoBuffer; // undo buffer for operations to above
  undoBuffer: UndoBuffer;
  tracker: SuiTracker; // UI selections
  renderer: SuiRenderState;
  scroller: SuiScroller;
  pasteBuffer: PasteBuffer;
  storePaste: PasteBuffer;
  config: SmoRenderConfiguration;
  audioAnimation: SuiAudioAnimationParams;
  constructor(config: SmoRenderConfiguration, svgContainer: HTMLElement, score: SmoScore, scrollSelector: HTMLElement, undoBuffer: UndoBuffer) {
    this.score = score;
    const renderParams: ScoreRenderParams = {
      elementId: svgContainer,
      score,
      config,
      undoBuffer
    };
    this.audioAnimation = config.audioAnimation;
    this.renderer = new SuiRenderState(renderParams);
    this.config = config;
    const scoreJson = score.serialize();
    this.scroller = new SuiScroller(scrollSelector, this.renderer.renderer.vexContainers);
    this.pasteBuffer = new PasteBuffer();
    this.storePaste = new PasteBuffer();
    this.tracker = new SuiTracker(this.renderer, this.scroller, this.pasteBuffer);
    this.renderer.setMeasureMapper(this.tracker);

    this.storeScore = SmoScore.deserialize(JSON.stringify(scoreJson));
    this.undoBuffer = undoBuffer;
    this.storeUndo = new UndoBuffer();
    this.staffMap = this.defaultStaffMap;
    SuiScoreView.Instance = this; // for debugging
    this.setMappedStaffIds();
    createTopDomContainer('.saveLink'); // for file upload
  }
  /**
   * Await on the full update of the score
   * @returns 
   */
  renderPromise(): Promise<any> {
    return this.renderer.renderPromise();
  }
  /**
   * Await on the partial update of the score in the view
   * @returns 
   */
  updatePromise(): Promise<any> {
    return this.renderer.updatePromise();
  }
  /**
   * await on the full update of the score, also resetting the viewport (to reflect layout changes)
   * @returns 
   */
  refreshViewport(): Promise<any> {
    this.renderer.preserveScroll();
    this.renderer.setViewport();
    this.renderer.setRefresh();
    return this.renderer.renderPromise();
  }
  /**
   * This is used in some Smoosic demos and pens.
   * @param action any action, but most usefully a SuiScoreView method
   * @param repetition number of times to repeat, waiting on render promise between
   * if not specified, defaults to 1
   * @returns promise, resolved action has been completed and score is updated.
   */
  waitableAction(action: () => void, repetition?: number): Promise<any> {
    const rep = repetition ?? 1;
    const self = this;
    const promise = new Promise((resolve: any) => {
      const fc = (count: number) => {
        if (count > 0) {
          action();
          self.renderer.updatePromise().then(() => {
            fc(count - 1);
          });
        } else {
          resolve();
        }
      };
      fc(rep);
    });
    return promise;
  }

  /**
   * The plural form of _getEquivalentSelection
   * @param selections 
   * @returns 
   */
  _getEquivalentSelections(selections: SmoSelection[]): SmoSelection[] {
    const rv: SmoSelection[] = [];
    selections.forEach((selection) => {
      const sel = this._getEquivalentSelection(selection);
      if (sel !== null) {
        rv.push(sel);
      }
    });
    return rv;
  }
  /**
   * A staff modifier has changed, create undo operations for the measures affected
   * @param label 
   * @param staffModifier 
   * @param subtype 
   */
  _undoStaffModifier(label: string, staffModifier: StaffModifierBase, subtype: number) {
    const copy = StaffModifierBase.deserialize(staffModifier.serialize());
    copy.startSelector = this._getEquivalentSelector(copy.startSelector);
    copy.endSelector = this._getEquivalentSelector(copy.endSelector);
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, SmoSelector.default,
      staffModifier.serialize(), subtype);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.STAFF_MODIFIER, SmoSelector.default,
      copy.serialize(), subtype);
  }
  /** 
   * Return the index of the page that is in the center of the client screen.
   */
  getFocusedPage(): number {
    if (this.score.layoutManager === undefined) {
      return 0;
    }
    const scrollAvg = this.tracker.scroller.netScroll.y + (this.tracker.scroller.viewport.height / 2);
    const midY = scrollAvg;
    const layoutManager = this.score.layoutManager.getGlobalLayout();
    const lh = layoutManager.pageHeight / layoutManager.svgScale;
    const lw = layoutManager.pageWidth / layoutManager.svgScale;
    const pt = this.renderer.pageMap.svgToClient(SvgHelpers.smoBox({ x: lw, y: lh }));
    return Math.round(midY / pt.y);
  }
  /**
   * Create a rectangle undo, like a multiple columns but not necessarily the whole
   * score.
   */
  _undoColumn(label: string, measureIndex: number) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, SmoSelector.default, { score: this.score, measureIndex },
      UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.COLUMN, SmoSelector.default, { score: this.storeScore, measureIndex }, UndoBuffer.bufferSubtypes.NONE);
  }
  /**
   * Score preferences don't affect the display, but they do have an undo
   * @param label 
   */
  _undoScorePreferences(label: string) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, SmoSelector.default, this.score, UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE_ATTRIBUTES, SmoSelector.default, this.storeScore, UndoBuffer.bufferSubtypes.NONE);
  }
  
  /**
   * Add to the undo buffer the current set of measures selected.
   * @param label 
   * @returns 
   */
  _undoTrackerMeasureSelections(label: string): SmoSelection[] {
    const measureSelections = SmoSelection.getMeasureList(this.tracker.selections);
    measureSelections.forEach((measureSelection) => {
      const equiv = this._getEquivalentSelection(measureSelection);
      if (equiv !== null) {
        this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, measureSelection.selector, measureSelection.measure,
          UndoBuffer.bufferSubtypes.NONE);
        this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
          UndoBuffer.bufferSubtypes.NONE);
      }
    });
    return measureSelections;
  }
  /**
   * operation that only affects the first selection.  Setup undo for the measure
   */
  _undoFirstMeasureSelection(label: string): SmoSelection {
    const sel = this.tracker.selections[0];
    const equiv = this._getEquivalentSelection(sel);
    if (equiv !== null) {
      this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, sel.selector, sel.measure,
        UndoBuffer.bufferSubtypes.NONE);
      this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
        UndoBuffer.bufferSubtypes.NONE);
    }
    return sel;
  }
  /**
   * Add the selection to the undo buffer
   * @param label 
   * @param selection 
   */
  _undoSelection(label: string, selection: SmoSelection) {
    const equiv = this._getEquivalentSelection(selection);
    if (equiv !== null) {
      this.undoBuffer.addBuffer(label,
        UndoBuffer.bufferTypes.MEASURE, selection.selector, selection.measure,
        UndoBuffer.bufferSubtypes.NONE);
      this.storeUndo.addBuffer(label,
        UndoBuffer.bufferTypes.MEASURE, equiv.selector, equiv.measure,
        UndoBuffer.bufferSubtypes.NONE);
    }
  }
  /**
   * Add multiple selections to the undo buffer as a group
   * @param label 
   * @param selections 
   */
  _undoSelections(label: string, selections: SmoSelection[]) {
    this.undoBuffer.grouping = true;
    this.storeUndo.grouping = true;
    selections.forEach((selection) => {
      this._undoSelection(label, selection);
    });
    this.undoBuffer.grouping = false;
    this.storeUndo.grouping = false;
  }

  /** 
   * Update renderer for measures that have changed
  */
  _renderChangedMeasures(measureSelections: SmoSelection[]) {
    if (!Array.isArray(measureSelections)) {
      measureSelections = [measureSelections];
    }
    measureSelections.forEach((measureSelection) => {
      this.renderer.addToReplaceQueue(measureSelection);
    });
  }
  /**
   * Update renderer for some columns
   * @param fromSelector 
   * @param toSelector 
   */
  _renderRectangle(fromSelector: SmoSelector, toSelector: SmoSelector) {
    this._getRectangleSelections(fromSelector, toSelector).forEach((s) => {
      this.renderer.addToReplaceQueue(s);
    });
  }

  /**
   * Setup undo for operation that affects the whole score
   * @param label 
   */
  _undoScore(label: string) {
    this.undoBuffer.addBuffer(label, UndoBuffer.bufferTypes.SCORE, SmoSelector.default, this.score,
      UndoBuffer.bufferSubtypes.NONE);
    this.storeUndo.addBuffer(label, UndoBuffer.bufferTypes.SCORE, SmoSelector.default, this.storeScore,
      UndoBuffer.bufferSubtypes.NONE);
  }
  /**
   * Get the selector from this.storeScore that maps to the displayed selector from this.score
   * @param selector 
   * @returns 
   */
  _getEquivalentSelector(selector: SmoSelector) {
    const rv = JSON.parse(JSON.stringify(selector));
    rv.staff = this.staffMap[selector.staff];
    return rv;
  }
  /**
   * Get the equivalent staff id from this.storeScore that maps to the displayed selector from this.score
   * @param staffId 
   * @returns 
   */
  _getEquivalentStaff(staffId: number) {
    return this.staffMap[staffId];
  }
  /**
   * Get the equivalent selection from this.storeScore that maps to the displayed selection from this.score
   * @param selection 
   * @returns 
   */
   _getEquivalentSelection(selection: SmoSelection): SmoSelection | null {
    try {
      if (typeof (selection.selector.tick) === 'undefined') {
        return SmoSelection.measureSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure);
      }
      if (typeof (selection.selector.pitches) === 'undefined') {
        return SmoSelection.noteSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
          selection.selector.tick);
      }
      return SmoSelection.pitchSelection(this.storeScore, this.staffMap[selection.selector.staff], selection.selector.measure, selection.selector.voice,
        selection.selector.tick, selection.selector.pitches);
    } catch (ex) {
      console.warn(ex);
      return null;
    }
  }

  /**
   * Get the equivalent selection from this.storeScore that maps to the displayed selection from this.score
   * @param selection 
   * @returns 
   */
   _getEquivalentGraceNote(selection: SmoSelection, gn: SmoGraceNote): SmoGraceNote {
    if (selection.note !== null) {
      const rv = selection.note.getGraceNotes().find((gg) => gg.attrs.id === gn.attrs.id);
      if (rv) {
        return rv;
      }
    }
    return gn;
  }
  /**
   * Get the rectangle of selections indicated by the parameters from the score
   * @param startSelector 
   * @param endSelector 
   * @param score 
   * @returns 
   */
  _getRectangleSelections(startSelector: SmoSelector, endSelector: SmoSelector): SmoSelection[] {
    const rv: SmoSelection[] = [];
    let i = 0;
    let j = 0;
    for (i = startSelector.staff; i <= endSelector.staff; i++) {
      for (j = startSelector.measure; j <= endSelector.measure; j++) {
        const target = SmoSelection.measureSelection(this.score, i, j);
        if (target !== null) {
          rv.push(target);
        }
      }
    }
    return rv;
  }
  /**
   * set the grouping flag for undo operations
   * @param val 
   */
  groupUndo(val: boolean) {
    this.undoBuffer.grouping = val;
    this.storeUndo.grouping = val;
  }

  /**
   * Show all staves, 1:1 mapping of view score staff to stored score staff
   */
  get defaultStaffMap(): number[] {
    let i = 0;
    const rv: number[] = [];
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      rv.push(i);
    }
    return rv;
  }
  /**
   * Bootstrapping function, creates the renderer and associated timers
   */
  startRenderingEngine() {
    if (!this.renderer.score) {
      // If the score is transposing, hide the instrument xpose settings
      this._setTransposing();
      this.renderer.score = this.score;
      this.renderer.setViewport();
    }
    this.renderer.startDemon();
  }
  /**
   * Gets the current mapping of displayed staves to score staves (this.storeScore)
   * @returns 
   */
  getView(): ViewMapEntry[] {
    const rv = [];
    let i = 0;
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      const show = this.staffMap.indexOf(i) >= 0;
      rv.push({ show });
    }
    return rv;
  }
  /**
   * Update the staff ID when the view changes
   */
  setMappedStaffIds() {
    this.score.staves.forEach((staff) => {
      if (!this.isPartExposed()) {
        staff.partInfo.displayCues = staff.partInfo.cueInScore;
      } else {
        staff.partInfo.displayCues = false;
      }
      staff.setMappedStaffId(this.staffMap[staff.staffId]);
    });
  }
  /**
   * Exposes a part:  hides non-part staves, shows part staves.
   * Note this will reset the view.  After this operation, staff 0 will
   * be the selected part.
   * @param staff 
   */
  exposePart(staff: SmoSystemStaff) {
    let i = 0;
    const partInfo = staff.partInfo;
    const startIndex = this.staffMap[staff.staffId] - partInfo.stavesBefore;
    const partLength = partInfo.stavesBefore + partInfo.stavesAfter + 1;
    const exposeMap: ViewMapEntry[] = [];
    for (i = 0; i < this.storeScore.staves.length; ++i) {
      const show = (i >= startIndex && i < startIndex + partLength);
      exposeMap.push({ show });
    }
    this.setView(exposeMap);
  }
  /**
   * Indicates if the score is displaying in part-mode vs. score mode.
   * @returns 
   */
  isPartExposed(): boolean {
    return this.score.isPartExposed() && this.score.staves.length !== this.storeScore.staves.length;
  }
  /**
   * Parts have different formatting options from the parent score, indluding layout.  Reset
   * them when exposing a part.
   */
  _mapPartFormatting() {
    this.score.layoutManager = this.score.staves[0].partInfo.layoutManager;
    let replacedText = false;
    this.score.staves.forEach((staff) => {
      staff.updateMeasureFormatsForPart();
      if (staff.partInfo.preserveTextGroups && !replacedText) {
        const tga: SmoTextGroup[] = [];
        replacedText = true;
        staff.partInfo.textGroups.forEach((tg) => {
          tga.push(tg)
        });
        this.score.textGroups = tga;
      }
    });
  }

  /**
   * Update the list of staves in the score that are displayed.
  */
  setView(rows: ViewMapEntry[]) {
    let i = 0;
    const any = rows.find((row) => row.show === true);
    if (!any) {
      return;
    }
    this._undoScore('change view');
    const nscore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    const staveScore = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    nscore.staves = [];
    const staffMap = [];
    for (i = 0; i < rows.length; ++i) {
      const row = rows[i];
      if (row.show) {
        staveScore.staves[i].mapStaffFromTo(i, nscore.staves.length);
        nscore.staves.push(staveScore.staves[i]);
        staffMap.push(i);
      }
    }
    nscore.numberStaves();
    this.staffMap = staffMap;
    this.score = nscore;
    // Indicate which score staff view staves are mapped to, to decide to display
    // modifiers.
    this.setMappedStaffIds();
    // TODO: add part-specific measure formatting, etc.
    this._setTransposing();
    this.renderer.score = nscore;
    // If this current view is a part, show the part layout
    if (this.isPartExposed()) {
      this._mapPartFormatting();      
      this.score.staves.forEach((staff) => {
        staff.partInfo.displayCues = false;
      });
      SmoOperation.computeMultipartRest(nscore);
    } else {
      this.score.staves.forEach((staff) => {
        staff.partInfo.displayCues = staff.partInfo.cueInScore;
      });
    }
    this.renderer.setViewport();
  }
  /**
   * view all the staffs in score mode.
   */
  viewAll() {
    this.score = SmoScore.deserialize(JSON.stringify(this.storeScore.serialize()));
    this.staffMap = this.defaultStaffMap;
    this.setMappedStaffIds();
    this._setTransposing();
    this.renderer.score = this.score;
    this.renderer.setViewport();
  }
  /**
   * Update score based on transposing flag.
   */
  _setTransposing() {
    if (!this.isPartExposed()) {
      const xpose = this.score.preferences?.transposingScore;
      if (xpose) {
        this.score.setTransposing();
      }
    }
  }

  /**
   * Update the view after loading or restoring a completely new score
   * @param score 
   * @returns 
   */
  changeScore(score: SmoScore) {
    this._undoScore('load new score');
    SuiAudioPlayer.stopPlayer();
    this.renderer.score = score;
    this.renderer.setViewport();
    this.storeScore = SmoScore.deserialize(JSON.stringify(score.serialize()));
    this.score = score;
    // If the score is non-transposing, hide the instrument xpose settings
    this._setTransposing();
    this.staffMap = this.defaultStaffMap;
    this.setMappedStaffIds();
    return this.renderPromise();
  }

  /**
   * for the view score, the renderer decides what to render
   * depending on what is undone.
   * @returns 
   */
  undo() {
    if (!this.renderer.score) {
      return;
    }
    this.renderer.undo(this.undoBuffer);
    // A score-level undo might have changed the score.
    this.score = this.renderer.score;
    this.storeScore = this.storeUndo.undo(this.storeScore);
  }
}
