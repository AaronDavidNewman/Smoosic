// ## SmoActionRecord
// Record a list of actions, for playback or unit testing.
// eslint-disable-next-line no-unused-vars
class SmoActionRecord {
  static get refreshTimer() {
    return 10000;
  }
  static get actionInterval() {
    return 50;
  }
  constructor() {
    this.actions = [];
    this.executeIndex = 0;
    this._target = null;
    this.refreshTime = 0;
  }
  addAction(method, ...args) {
    // Don't add actions while running
    if (this.actions.length && !this.endCondition) {
      return;
    }
    const obj = {};
    obj.method = method;
    obj.parameters = [];
    args.forEach((arg) => {
      if (typeof(arg) === 'object' && arg !== null) {
        if (typeof(arg.serialize) === 'function') {
          obj.parameters.push(arg.serialize());
        } else {
          obj.parameters.push(JSON.parse(JSON.stringify(arg)));
        }
      } else {
        if (typeof(arg) !== 'undefined') {
          obj.parameters.push(arg);
        }
      }
    });
    this.actions.push(obj);
    this.executeIndex = this.actions.length;
    this._refreshing = false;
  }
  resetRunner() {
    this.executeIndex = this.actions.length;
  }
  clearActions() {
    this.actions = [];
    this.executeIndex = 0;
  }
  cancelRun() {
    this.executeIndex = this.actions.length;
  }
  get endCondition() {
    return this.actions.length < 1 || this.executeIndex >= this.actions.length;
  }
  callNextAction() {
    if (this.endCondition) {
      return false;
    }
    const timeStamp = new Date().valueOf();
    // This sort of breaks encapsulation.  We pause to let the screen refresh
    // sometimes.
    if (timeStamp - this.refreshTime > SmoActionRecord.refreshTimer) {
      if (this._target.renderer.passState !== SuiRenderState.passStates.clean) {
        if (!this._refreshing) {
          this._target.renderer.setViewport(true);
          this._refreshing = true;
        }
        return true;
      } else {
        // scroll so the bottom of the screen is visible
        this._refreshing = false;
        const ls = this._target.score.staves[this._target.score.staves.length - 1];
        const lm = ls.measures[ls.measures.length - 1];
        if (lm.renderedBox) {
          this._target.tracker.scroller.scrollVisibleBox(lm.renderedBox);
        }
        this.refreshTime = timeStamp;
      }
    }
    const action = this.actions[this.executeIndex];
    const args = [];
    action.parameters.forEach((param) => {
      if (typeof(param) === 'object') {
        if (typeof(param.ctor) === 'string') {
          const ctor = eval(param.ctor);
          args.push(new ctor(param));
        } else {
          args.push(JSON.parse(JSON.stringify(param)));
        }
      } else {
        args.push(param);
      }
    });
    this._target[action.method](...args);
    this.executeIndex += 1;
    return true;
  }
  executePromise(target) {
    this._target = target;
    this.executeIndex = 0;
    this.refreshTime = new Date().valueOf();
    return PromiseHelpers.makePromise(this, 'endCondition', null, 'callNextAction', SmoActionRecord.actionInterval);
  }
}
