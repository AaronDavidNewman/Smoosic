// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## SmoActionRecord
// Record a list of actions, for playback or unit testing.
export interface Action {
  method: any,
  parameters: any,
  count: number
}
export class SmoActionRecord {
  static get refreshTimer() {
    return 10000;
  }
  static get actionInterval() {
    return 50;
  }
  actions: Action[] = [];
  executeIndex: number = 0;
  refreshTime: number = 0;
  _refreshing: boolean = false;
  constructor() {
  }
  addAction(method: any, ...args: any[]) {
    // Don't add actions while running
    if (this.actions.length && !this.endCondition) {
      return;
    }
    const obj: Action = { method, parameters: [], count: 0 };
    args.forEach((arg: any) => {
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
    if (this.actions.length > 0) {
      const lastAction = this.actions[this.actions.length - 1];
      if (lastAction.method === obj.method) {
        const lastStr = JSON.stringify(lastAction.parameters);
        const thisStr = JSON.stringify(obj.parameters);
        if (lastStr === thisStr) {
          this._refreshing = false;
          lastAction.count += 1;
          return;
        }
      }
    }
    obj.count = 1;
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
  callNextAction(): Action | null {
    if (this.endCondition) {
      return null;
    }
    const action = this.actions[this.executeIndex];
    const args: any[] = [];
    action.parameters.forEach((param: any) => {
      if (typeof(param) === 'object') {
        if (typeof(param.ctor) === 'string') {
          const ctor = eval('globalThis.Smo.' + param.ctor);
          args.push(new ctor(param));
        } else {
          args.push(JSON.parse(JSON.stringify(param)));
        }
      } else {
        args.push(param);
      }
    });
    if (typeof(action.count) === 'undefined' || isNaN(action.count)) {
      action.count = 1;
    }
    this.executeIndex += 1;
    return { method: action.method, parameters: args, count: action.count };
  }
}
