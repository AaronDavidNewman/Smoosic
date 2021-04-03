
class SuiRenderDemon {
  constructor(parameters) {
    this.idleLayoutTimer = 0; // how long the score has been idle
    this.undoStatus = 0;

    Vex.Merge(this, parameters);
    this.handling = false;
  }

  get isLayoutQuiet() {
    return ((this.view.renderer.passState == SuiRenderState.passStates.clean && this.view.renderer.dirty == false)
       || this.view.renderer.passState == SuiRenderState.passStates.replace);
  }
  resetIdleTimer() {
      this.idleLayoutTimer = Date.now();
  }

  handleRedrawTimer() {
    if (this.handling) {
      return;
    }
    this.handling = true;
    const redrawTime = Math.max(this.view.renderer.renderTime, SmoConfig.idleRedrawTime);
    // If there has been a change, redraw the score
    if (this.view.renderer.passState === SuiRenderState.passStates.initial) {
      this.view.renderer.dirty = true;
      this.undoStatus = this.undoBuffer.opCount;
      this.idleLayoutTimer = Date.now();

      // indicate the display is 'dirty' and we will be refreshing it.
      $('body').addClass('refresh-1');
      try {
        // Sort of a hack.  If the viewport changed, the scroll state is already reset
        // so we can't preserver the scroll state.
        if (!this.view.renderer.viewportChanged) {
          this.view.preserveScroll();
        }
        this.render();
      } catch (ex) {
        console.error(ex);
        SuiExceptionHandler.instance.exceptionHandler(ex);
        this.handling = false;
      }
    } else if (this.view.renderer.passState === SuiRenderState.passStates.replace && this.undoStatus === this.undoBuffer.opCount) {
      // Consider navigation as activity when deciding to refresh
      this.idleLayoutTimer = Math.max(this.idleLayoutTimer, this.view.tracker.idleTimer);
      $('body').addClass('refresh-1');
      // Do we need to refresh the score?
      if (this.view.renderer.backgroundRender === false && Date.now() - this.idleLayoutTimer > redrawTime) {
        this.view.renderer.passState = SuiRenderState.passStates.initial;
        if (!this.view.renderer.viewportChanged) {
          this.view.preserveScroll();
        }
        this.render();
      }
    } else {
      this.idleLayoutTimer = Date.now();
      this.undoStatus = this.undoBuffer.opCount;
      if (this.view.renderer.replaceQ.length > 0) {
        this.render();
      }
    }
    this.handling = false;
}

    // ### pollRedraw
  // if anything has changed over some period, prepare to redraw everything.
  pollRedraw() {
    setTimeout(() => {
      this.handleRedrawTimer();
      this.pollRedraw();
    }, SmoConfig.demonPollTime);
  }

  startDemon() {
      this.pollRedraw();
  }

  render() {
    this.view.renderer.render();
    if (this.view.renderer.passState === SuiRenderState.passStates.clean && this.view.renderer.dirty === false) {
       this.view.tracker.updateMap();
       // indicate the display is 'clean' and up-to-date with the score
       $('body').removeClass('refresh-1');
    }
  }
}
