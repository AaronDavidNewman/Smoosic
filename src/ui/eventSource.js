

class browserEventSource {
  constructor(evMask) {
    this.keydownHandlers = [];
    this.mouseHandlers = [];
    this.domTriggers = [];
    this.handleKeydown = this.evKey.bind(this);
    window.addEventListener("keydown", this.handleKeydown, true);

  }

  evKey(event) {
    this.keydownHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  _unbindHandlerArray(arSrc,arDest,handler) {
    arSrc.forEach((htest) => {
      if (handler.symbol !== htest.symbol) {
        arDest.push(htest);
      }
    });
  }

  unbindKeydownHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.keydownHandlers,handlers,handler);
    this.keydownHandlers = handlers;
  }

  bindKeydownHandler(sink,method) {
    var handler = {};
    handler.symbol = Symbol();
    handler.sink = sink;
    handler.method = method;
    this.keydownHandlers.push(handler);
    return handler;
  }
}
