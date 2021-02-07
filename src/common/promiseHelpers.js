
class PromiseHelpers {
  // ### makePromise
  // poll on endCondition at a rate of pollTime.  Resolve the promise
  // when endCondition is met, calling preResolveMethod first.   On
  // polls where the end condition is not met, call pollMethod
  // Resolve method and pollMethod are optional
  static makePromise(instance, endCondition, preResolveMethod, pollMethod, pollTime) {
    return new Promise((resolve) => {
      var checkit = () => {
        setTimeout(() => {
          if (instance[endCondition]) {
            if (preResolveMethod) {
              instance[preResolveMethod]();
            }
            resolve();
          }
          else {
            if (pollMethod) {
              instance[pollMethod]();
            }
            checkit();
          }
        }, pollTime);
      }
      checkit();
    });
  }

  static makePromiseObj(instance, endCondition, preResolveMethod, pollMethod, pollTime) {
    return {
      instance: instance,
      endCondition: endCondition,
      preResolveMethod: preResolveMethod,
      pollMethod: pollMethod,
      pollTime: pollTime
    };
  }

  // ### afterPromise
  // Call a method after a promise is resolved that may
  // also return a promise
  static afterPromise(obj, promise, functionName) {
    const f = () => {
      obj[functionName]();
    }
    return promise.then(f);
  }
  // ### promiseChainThen
  // Call a chain of promises in array order, with parameters of makePromise
  static async promiseChainThen(promiseParameters) {
    const promiseArray = [];
    promiseParameters.forEach((promiseParameter) => {
      promiseArray.push(
        async () => {
          return PromiseHelpers.makePromise(
            promiseParameter.instance,
            promiseParameter.endCondition,
            promiseParameter.preResolveMethod,
            promiseParameter.pollMethod,
            promiseParameter.pollTime
          );
      });
    });

    let result;
    for (const f of promiseArray) {
      result = await f(result);
    }

		return result;
  }
  static renderPromise(renderer) {
    const renderPromise = () => {
      return new Promise((resolve) => {
        const checkit = () => {
          setTimeout(() => {
            if (renderer.passState === SuiRenderState.passStates.clean) {
              resolve();
            } else {
        	    checkit();
            }
          }, 500);
        }
        checkit();
      });
    }
  }
}
