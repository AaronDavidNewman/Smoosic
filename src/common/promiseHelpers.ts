// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiRenderState } from "../render/sui/renderState";

export type promiseFunction = () => void;
export type promiseCondition = () => boolean;
export type promiseInstance = () => Promise<any>;
export interface PromiseParameters {
  endCondition: promiseCondition, preResolveMethod: promiseFunction | null, pollMethod: promiseFunction | null, pollTime: number
}

export class PromiseHelpers {
  // ### makePromise
  // poll on endCondition at a rate of pollTime.  Resolve the promise
  // when endCondition is met, calling preResolveMethod first.   On
  // polls where the end condition is not met, call pollMethod
  // Resolve method and pollMethod are optional
  static makePromise(endCondition: promiseCondition, preResolveMethod: promiseFunction | null, pollMethod: promiseFunction | null, pollTime: number): Promise<void> {
    return new Promise<any>((resolve: any) => {
      const checkit = () => {
        setTimeout(() => {
          if (endCondition()) {
            if (preResolveMethod) {
                preResolveMethod();
            }
            resolve();
          }
          else {
            if (pollMethod) {
              pollMethod();
            }
            checkit();
          }
        }, pollTime);
      }
      checkit();
    });
  }

  static makePromiseObj(endCondition: promiseCondition, preResolveMethod: promiseFunction | null, pollMethod: promiseFunction | null, pollTime: number) {
    return {
      endCondition,
      preResolveMethod,
      pollMethod,
      pollTime
    };
  }
  // ### promiseChainThen
  // Call a chain of promises in array order, with parameters of makePromise
  static async promiseChainThen(params: PromiseParameters[]) {
    const promiseArray: promiseInstance[] = [];
    params.forEach((param) => {
      promiseArray.push(
        async () => {
          return PromiseHelpers.makePromise(
            param.endCondition,
            param.preResolveMethod,
            param.pollMethod,
            param.pollTime
          );
      });
    });
    let result: Promise<void>;
    for (const f of promiseArray) {
      result = await f();
    }

		return result!;
  }
  static emptyPromise(): Promise<any> {
    return new Promise((resolve: any) => {
      setTimeout(() => {
        resolve();
      }, 1);
    });
  }
}
