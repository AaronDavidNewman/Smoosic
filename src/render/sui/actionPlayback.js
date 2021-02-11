// ## SuiActionPlayback
// play back the action records.
// eslint-disable-next-line no-unused-vars
class SuiActionPlayback {
  constructor(actionRecord, view) {
    this.view = view;
    this.actions = actionRecord;
    this.running = false;
    this.currentAction = null;
  }
  static actionPromise(view, method, args) {
    view[method](...args);
    return view.renderer.updatePromise();
  }
  static actionPromises(view, method, args, count) {
    const fc = (count) => {
      if (count > 0) {
        SuiActionPlayback.actionPromise(view, method, args).then(() => {
          fc(count - 1);
        });
      }
    };
    fc(count);
  }
  get stopped() {
    return !this.running;
  }
  playNextAction() {
    let promise = {};
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
        promise.then(() => {
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
  start() {
    this.running = true;
    this.timestamp = new Date().valueOf();
    this.actions.executeIndex = 0;
    this.playNextAction();
    return PromiseHelpers.makePromise(this, 'stopped', null, null, 50);
  }
}
