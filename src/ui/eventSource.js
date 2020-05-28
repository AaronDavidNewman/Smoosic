

// ##browserEventSource
// Handle registration for events.  Can be used for automated testing, so all
// the events are consolidated in one place so they can be simulated or recorded
class browserEventSource {
  constructor(evMask) {
    this.keydownHandlers = [];
    this.mouseHandlers = [];
    this.domTriggers = [];
    this.scrollers = [];
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

  bindScroller(sink,method) {}

  // ### bindKeydownHandler
  // add a handler for the evKey event, for keyboard data.
  bindKeydownHandler(sink,method) {
    var handler = {};
    handler.symbol = Symbol();
    handler.sink = sink;
    handler.method = method;
    this.keydownHandlers.push(handler);
    return handler;
  }

  domClick(selector,sink,method,args) {
    $(selector).off('click').on('click',function(ev) {
      sink[method](ev,args);
    });
  }
}
