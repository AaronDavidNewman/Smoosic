// ## SuiRenderState
// Manage the state of the score rendering.  The score can be rendered either completely,
// or partially for editing.  This class works with the RenderDemon to decide when to
// render the score after it has been modified, and keeps track of what the current
// render state is (dirty, etc.)
// eslint-disable-next-line no-unused-vars
class SuiRenderState {
  constructor(ctor) {
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
    this.dirty = true;
    this.replaceQ = [];
    this.renderTime = 0;  // ms to render before time slicing
    this.partialRender = false;
    this.stateRepCount = 0;
    this.viewportPages = 1;
    this.backgroundRender = false;
    this.setPassState(SuiRenderState.initial, 'ctor');
    this.viewportChanged = false;
    this._resetViewport = false;
    this.measureMapper = null;
  }

  // ### setMeasureMapper
  // DI/notifier pattern.  The measure mapper/tracker is updated when the score is rendered
  // so the UI stays in sync with the location of elements in the score.
  setMeasureMapper(mapper) {
    this.measureMapper = mapper;
  }

  static get Fonts() {
    return {
      Bravura: [VF.Fonts.Bravura, VF.Fonts.Gonville, VF.Fonts.Custom],
      Gonville: [VF.Fonts.Gonville, VF.Fonts.Bravura, VF.Fonts.Custom],
      Petaluma: [VF.Fonts.Petaluma, VF.Fonts.Gonville, VF.Fonts.Custom],
      Leland: [VF.Fonts.Leland, VF.Fonts.Bravura, VF.Fonts.Gonville, VF.Fonts.Custom]
    };
  }

  static setFont(font) {
    VF.DEFAULT_FONT_STACK = SuiRenderState.Fonts[font];
  }

  static get passStates() {
    return { initial: 0, clean: 2, replace: 3 };
  }

  addToReplaceQueue(selection) {
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
        this.setPassState(SuiRenderState.passStates.replace);
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
    this.partialRender = false;
    this.setRefresh();
  }
  get renderStateClean() {
    return this.passState === SuiRenderState.passStates.clean;
  }
  get renderStateRendered() {
    return this.passState === SuiRenderState.passStates.clean ||
      (this.passState === SuiRenderState.passStates.replace && this.replaceQ.length === 0);
  }

  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  renderPromise() {
    return PromiseHelpers.makePromise(this, 'renderStateClean', null, null, SmoConfig.demonPollTime);
  }

  // ### renderPromise
  // return a promise that resolves when the score is in a fully rendered state.
  updatePromise() {
    return PromiseHelpers.makePromise(this, 'renderStateRendered', null, null, SmoConfig.demonPollTime);
  }
  // Number the measures at the first measure in each system.
  numberMeasures() {
    const printing = $('body').hasClass('print-render');
    const staff = this.score.staves[0];
    const measures = staff.measures.filter((measure) => measure.measureNumber.systemIndex === 0);
    $('.measure-number').remove();

    measures.forEach((measure) => {
      if (measure.measureNumber.measureNumber > 0 && measure.measureNumber.systemIndex === 0) {
        const numAr = [];
        numAr.push({ y: measure.logicalBox.y - 10 });
        numAr.push({ x: measure.logicalBox.x });
        numAr.push({ 'font-family': SourceSansProFont.fontFamily });
        numAr.push({ 'font-size': '10pt' });
        svgHelpers.placeSvgText(this.context.svg, numAr, 'measure-number', (measure.measureNumber.measureNumber + 1).toString());

        // Show line-feed symbol
        const formatIndex = SmoMeasure.systemOptions.findIndex((option) => measure[option] !== SmoMeasure.defaults[option]);
        if (formatIndex >= 0 && !printing) {
          const starAr = [];
          starAr.push({ y: measure.logicalBox.y - 5 });
          starAr.push({ x: measure.logicalBox.x + 25 });
          starAr.push({ 'font-family': SourceSansProFont.fontFamily });
          starAr.push({ 'font-size': '12pt' });
          svgHelpers.placeSvgText(this.context.svg, starAr, 'measure-format', '\u21b0');
        }
      }
    });
  }

  // ### _setViewport
  // Create (or recrate) the svg viewport, considering the dimensions of the score.
  _setViewport(reset, elementId) {
    // this.screenWidth = window.innerWidth;
    const layout = this._score.layout;
    this.zoomScale = layout.zoomMode === SmoScore.zoomModes.zoomScale ?
      layout.zoomScale : (window.innerWidth - 200) / layout.pageWidth;

    if (layout.zoomMode !== SmoScore.zoomModes.zoomScale) {
      layout.zoomScale = this.zoomScale;
    }

    this.svgScale = layout.svgScale * this.zoomScale;
    this.orientation = this._score.layout.orientation;
    const w = Math.round(layout.pageWidth * this.zoomScale);
    const h = Math.round(layout.pageHeight * this.zoomScale);
    this.pageWidth =  (this.orientation  === SmoScore.orientations.portrait) ? w : h;
    this.pageHeight = (this.orientation  === SmoScore.orientations.portrait) ? h : w;
    this.totalHeight = this.pageHeight * this.score.layout.pages;
    this.viewportPages = this.score.layout.pages;

    this.leftMargin = this._score.layout.leftMargin;
    this.rightMargin = this._score.layout.rightMargin;
    $(elementId).css('width', '' + Math.round(this.pageWidth) + 'px');
    $(elementId).css('height', '' + Math.round(this.totalHeight) + 'px');
    // Reset means we remove the previous SVG element.  Otherwise, we just alter it
    if (reset) {
      $(elementId).html('');
      this.renderer = new VF.Renderer(elementId, VF.Renderer.Backends.SVG);
      this.viewportChanged = true;
      if (this.measureMapper) {
        this.measureMapper.scroller.scrollAbsolute(0, 0);
      }
    }
    svgHelpers.svgViewport(this.context.svg, 0, 0, this.pageWidth, this.totalHeight, this.svgScale);
    // this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
    this.resizing = false;
    console.log('layout setViewport: pstate initial');
    this.dirty = true;
    SuiRenderState._renderer = this.renderer;
  }

  setViewport(reset) {
    this._setViewport(reset, this.elementId);
    this.score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (measure.logicalBox && reset) {
          measure.svg.history = ['reset'];
        }
      });
    });
    this.partialRender = false;
  }
  renderForPrintPromise() {
    $('body').addClass('print-render');
    const self = this;
    this._backupLayout = JSON.parse(JSON.stringify(this.score.layout));
    this.score.layout.zoomMode = SmoScore.zoomModes.zoomScale;
    this.score.layout.zoomScale = 1.0;
    this.setViewport(true);
    this.setRefresh();

    const promise = new Promise((resolve) => {
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
    if (this._backupLayout) {
      this.score.setLayout(this._backupLayout);
      this.setViewport(true);
      this.setRefresh();
      this._backupLayout = null;
    }
  }

  clearLine(measure) {
    const lineIndex = measure.lineIndex;
    const startIndex = (lineIndex > 1 ? lineIndex - 1 : 0);
    let i = 0;
    for (i = startIndex; i < lineIndex + 1; ++i) {
      // for lint error
      const index = i;
      this.score.staves.forEach((staff) => {
        const mms = staff.measures.filter((mm) => mm.lineIndex === index);
        mms.forEach((mm) => {
          delete mm.logicalBox;
        });
      });
    }
  }

  setPassState(st, location) {
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
  static get defaults() {
    return {
      clefWidth: 70,
      staffWidth: 250,
      totalWidth: 250,
      leftMargin: 15,
      topMargin: 15,
      pageWidth: 8 * 96 + 48,
      pageHeight: 11 * 96,
      svgScale: 0.7,
    };
  }

  static get debugLayout() {
    SuiRenderState._debugLayout = SuiRenderState._debugLayout ? SuiRenderState._debugLayout : false;
    return SuiRenderState._debugLayout;
  }

  static set debugLayout(value) {
    SuiRenderState._debugLayout = value;
    if (value) {
      $('body').addClass('layout-debug');
    } else {
      $('body').removeClass('layout-debug');
    }
  }

  // ### get context
  // ### Description:
  // return the VEX renderer context.
  get context() {
    return this.renderer.getContext();
  }
  get renderElement() {
    return this.renderer.elementId;
  }

  get svg() {
    return this.context.svg;
  }

  get score() {
    return this._score;
  }

  set score(score) {
    let shouldReset = false;
    if (this._score) {
      shouldReset = true;
    }
    this.setPassState(SuiRenderState.passStates.initial, 'load score');
    const font = score.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.ENGRAVING);
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
  undo(undoBuffer) {
    const buffer = undoBuffer.peek();
    let op = 'setDirty';
    // Unrender the modified music because the IDs may change and normal unrender won't work
    if (buffer) {
      const sel = buffer.selector;
      if (buffer.type === UndoBuffer.bufferTypes.MEASURE) {
        this.unrenderMeasure(SmoSelection.measureSelection(this._score, sel.staff, sel.measure).measure);
      } else if (buffer.type === UndoBuffer.bufferTypes.STAFF) {
        this.unrenderStaff(SmoSelection.measureSelection(this._score, sel.staff, 0).staff);
        op = 'setRefresh';
      } else {
        this.unrenderAll();
        op = 'setRefresh';
      }
      this._score = undoBuffer.undo(this._score);
      this[op]();
    }
  }

  // ### unrenderMeasure
  // All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
  // element in such a way that some of the logical elements go away (e.g. when deleting a measure).
  unrenderMeasure(measure) {
    if (!measure) {
      return;
    }
    $(this.renderer.getContext().svg).find('g.' + measure.getClassId()).remove();
    measure.setYTop(0, 'unrender');
  }

  unrenderColumn(measure) {
    this.score.staves.forEach((staff) => {
      this.unrenderMeasure(staff.measures[measure.measureNumber.measureIndex]);
    });
  }

  // ### unrenderStaff
  // ### Description:
  // See unrenderMeasure.  Like that, but with a staff.
  unrenderStaff(staff) {
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
  _renderModifiers(staff, system) {
    const svg = this.svg;
    let nextNote = null;
    let lastNote = null;
    let testNote = null;
    let vxStart = null;
    let vxEnd = null;
    const removedModifiers = [];
    staff.modifiers.forEach((modifier) => {
      const startNote = SmoSelection.noteSelection(this._score,
        modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
      const endNote = SmoSelection.noteSelection(this._score,
        modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
      if (!startNote || !endNote) {
        // If the modifier doesn't have score endpoints, delete it from the score
        removedModifiers.push(modifier);
        return;
      }

      vxStart = system.getVxNote(startNote.note);
      vxEnd = system.getVxNote(endNote.note);

      // If the modifier goes to the next staff, draw what part of it we can on this staff.
      if (vxStart && !vxEnd) {
        nextNote = SmoSelection.nextNoteSelection(this._score,
          modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
        if (nextNote === null) {
          console.warn('bad selector ' + JSON.stringify(modifier.startSelector, null, ' '));
        } else {
          testNote = system.getVxNote(nextNote.note);
          while (testNote) {
            vxEnd = testNote;
            nextNote = SmoSelection.nextNoteSelection(this._score,
              nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
            if (!nextNote) {
              break;
            }
            testNote = system.getVxNote(nextNote.note);
          }
        }
      }
      if (vxEnd && !vxStart) {
        lastNote = SmoSelection.lastNoteSelection(this._score,
          modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
        if (lastNote) {
          testNote = system.getVxNote(lastNote.note);
          while (testNote) {
            vxStart = testNote;
            lastNote = SmoSelection.lastNoteSelection(this._score,
              lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
            if (!lastNote) {
              break;
            }
            testNote = system.getVxNote(lastNote.note);
          }
        }
      }
      if (!vxStart && !vxEnd) {
        return;
      }
      modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd, startNote, endNote);
      modifier.logicalBox = svgHelpers.clientToLogical(svg, modifier.renderedBox);
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
    if (printing) {
      return;
    }
    for (i = 1; i < this._score.layout.pages; ++i) {
      const y = (this.pageHeight / this.svgScale) * i;
      svgHelpers.line(this.svg, 0, y, this.score.layout.pageWidth / this.score.layout.svgScale, y,
        [
          { 'stroke': '#321' },
          { 'stroke-width': '2' },
          { 'stroke-dasharray': '4,1' },
          { 'fill': 'none' }], 'pageLine');
    }
  }

  // ### _replaceMeasures
  // Do a quick re-render of a measure that has changed.
  _replaceMeasures() {
    const staffMap = {};
    let system = {};
    this.replaceQ.forEach((change) => {
      smoBeamerFactory.applyBeams(change.measure);
      // Defer modifier update until all selected measures are drawn.
      if (!staffMap[change.staff.staffId]) {
        system = new VxSystem(this.context, change.measure.staffY, change.measure.lineIndex, this.score);
        staffMap[change.staff.staffId] = { system, staff: change.staff };
      } else {
        system = staffMap[change.staff.staffId].system;
      }
      const selections = SmoSelection.measuresInColumn(this.score, change.measure.measureNumber.measureIndex);
      selections.forEach((selection) => {
        system.renderMeasure(selection.measure, this.measureMapper);
      });

      // Fix a bug: measure change needs to stay true so we recaltulate the width
      change.measure.changed = true;
    });
    Object.keys(staffMap).forEach((key) => {
      const obj = staffMap[key];
      this._renderModifiers(obj.staff, obj.system);
      obj.system.renderEndings();
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
