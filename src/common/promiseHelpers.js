
class PromiseHelpers {
  static makePromise(obj,endCondition,preResolveFunc,pollFunc,pollTime) {
    return new Promise((resolve) => {
      var checkit = () => {
        setTimeout(() => {
          if (obj[endCondition]) {
            obj[preResolveFunc]();
            resolve();
          }
          else {
            obj[pollFunc]();
            checkit();
          }
        },pollTime);
      }
      checkit();
    });
  }
}
