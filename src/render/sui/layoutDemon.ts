// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { UndoBuffer } from '../../smo/xform/undo';
import { SuiExceptionHandler } from '../../ui/exceptions';
import { SuiRenderState } from './renderState';
import { SmoConfiguration } from '../../smo/data/common';
import { SuiTracker } from './tracker';

declare var SmoConfig: SmoConfiguration;
declare var $: any;

export class SuiRenderDemon {
  renderer: SuiRenderState;
  undoBuffer: UndoBuffer;
  idleLayoutTimer: number = 0; // how long the score has been idle
  undoStatus: number = 0;
  handling: boolean = false;
  tracker: SuiTracker;
  constructor(renderer: SuiRenderState, undoBuffer: UndoBuffer, tracker: SuiTracker) {
    this.idleLayoutTimer = 0; 
    this.undoStatus = 0;
    this.renderer = renderer;
    this.undoBuffer = undoBuffer;
    this.tracker = tracker;
  }
  resetIdleTimer() {
      this.idleLayoutTimer = Date.now();
  }

  handleRedrawTimer() {
    if (this.handling) {
      return;
    }
    this.handling = true;
    const redrawTime = Math.max(this.renderer.renderTime, SmoConfig.idleRedrawTime);
    // If there has been a change, redraw the score
    if (this.renderer.passState === SuiRenderState.passStates.initial) {
      this.renderer.dirty = true;
      this.undoStatus = this.undoBuffer.opCount;
      this.idleLayoutTimer = Date.now();

      // indicate the display is 'dirty' and we will be refreshing it.
      $('body').addClass('refresh-1');
      try {
        // Sort of a hack.  If the viewport changed, the scroll state is already reset
        // so we can't preserver the scroll state.
        if (!this.renderer.viewportChanged) {
          this.renderer.preserveScroll();
        }
        this.render();
      } catch (ex) {
        console.error(ex);
        SuiExceptionHandler.instance.exceptionHandler(ex);
        this.handling = false;
      }
    } else if (this.renderer.passState === SuiRenderState.passStates.replace && this.undoStatus === this.undoBuffer.opCount) {
      // Consider navigation as activity when deciding to refresh
      this.idleLayoutTimer = Math.max(this.idleLayoutTimer, this.tracker.idleTimer);
      $('body').addClass('refresh-1');
      // Do we need to refresh the score?
      if (this.renderer.backgroundRender === false && Date.now() - this.idleLayoutTimer > redrawTime) {
        this.renderer.passState = SuiRenderState.passStates.initial;
        if (!this.renderer.viewportChanged) {
          this.renderer.preserveScroll();
        }
        this.render();
      }
    } else {
      this.idleLayoutTimer = Date.now();
      this.undoStatus = this.undoBuffer.opCount;
      if (this.renderer.replaceQ.length > 0) {
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
    this.renderer.render();
  }
}
