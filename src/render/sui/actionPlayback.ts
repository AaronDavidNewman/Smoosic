// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoRenderConfiguration } from './configuration';
import { SmoActionRecord } from '../../smo/xform/actions';

declare var SmoConfig: SmoRenderConfiguration;

// ## SuiActionPlayback
// play back the action records.
export class SuiActionPlayback {
  actions: SmoActionRecord;
  view: any;
  running: boolean;
  currentAction: any;
  timestamp: number = 0;
  // In the application, the object plays the actions back.
  constructor(actionRecord: SmoActionRecord, view: any) {
    this.view = view;
    this.actions = actionRecord;
    this.running = false;
    this.currentAction = null;
  }
  // ### actionPromise
  // Render a single action, and return a promise that resolves when rendered
  static actionPromise(view: any, method: string, args: any): Promise<any> {
    if (method === 'setScoreLayout') {
      method = 'setPageLayout';
    }
    if (typeof(view[method]) !== 'function') {
      throw (method);
    }
    view[method](...args);
    return view.renderer.updatePromise();
  }
  // ### actionPromises
  // Library convenience function that performs the same action `'`count`'` times
  // Good for navigation (left 3 etc)
  static actionPromises(view: any, method: string, args: any, count: number): Promise<any> {
    const promise = new Promise((resolve: any) => {
      const fc = (count: number) => {
        if (count > 0) {
          SuiActionPlayback.actionPromise(view, method, args).then(() => {
            fc(count - 1);
          });
        } else {
          resolve();
        }
      };
      fc(count);
    });
    return promise;
  }
  // promise resolve condition
  get stopped() {
    return !this.running;
  }
  // ### setPitches
  // Convenience function to set a bunch of pitches on consecutive notes
  static setPitches(view: any, pitches: string) {
    const pitchAr = pitches.split('');
    const promise = new Promise((resolve: any) => {
      const fcn =  (ix: number) => {
        if (ix < pitchAr.length) {
          SuiActionPlayback.actionPromises(view, 'setPitch', [pitchAr[ix]], 1).then(() => {
            fcn(ix + 1);
          });
        } else {
          resolve();
        }
      };
      fcn(0);
    });
    return promise;
  }
  // ### playNextAction
  // Get the next action, and execute it.  Periodically refresh the entire score
  // if there are a  lot of actions.
  playNextAction() {
    let promise: Promise<any> | null = null;
    if (this.currentAction === null || this.currentAction.count < 1) {
      this.currentAction = this.actions.callNextAction();
    }
    // No actions left, stop running
    if (!this.currentAction) {
      this.running = false;
    } else {
      this.currentAction.count -= 1;
      const ts = new Date().valueOf();
      const refresh = ts - this.timestamp > SmoConfig.idleRedrawTime;
      promise = SuiActionPlayback.actionPromise(this.view, this.currentAction.method, this.currentAction.args);
      if (refresh) {
        // Periodically refresh the whole screen and scroll
        promise = this.view.renderer.renderPromise();
        this.view.renderer.rerenderAll();
        this.timestamp = ts;
        promise!.then(() => {
          const ls = this.view.score.staves[this.view.score.staves.length - 1];
          const lm = ls.measures[ls.measures.length - 1];
          if (lm.renderedBox) {
            this.view.tracker.scroller.scrollVisibleBox(lm.renderedBox);
          }
          this.playNextAction();
        });
      } else {
        // Usually, just perform the action and play the next action when any
        // redrawing has completed.
        promise.then(() => {
          this.playNextAction();
        });
      }
    }
  }
  // ### start
  // Start playing all the actions in the buffer.  Stop when stopped or we run out
  // of things to do.
  start() {
    this.running = true;
    this.timestamp = new Date().valueOf();
    this.actions.executeIndex = 0;
    this.playNextAction();
    return PromiseHelpers.makePromise(this, 'stopped', null, null, 50);
  }
}
