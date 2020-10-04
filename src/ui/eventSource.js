

// ##browserEventSource
// Handle registration for events.  Can be used for automated testing, so all
// the events are consolidated in one place so they can be simulated or recorded
class browserEventSource {
  constructor(evMask) {
    this.keydownHandlers = [];
    this.mouseMoveHandlers = [];
    this.clickHandlers = [];
    this.domTriggers = [];
    this.scrollers = [];
    this.handleKeydown = this.evKey.bind(this);
    this.vexContext = null;
    window.addEventListener("keydown", this.handleKeydown, true);
  }

  evKey(event) {
    this.keydownHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseMove(event) {
    this.mouseMoveHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseClick(event) {
    this.clickHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  setRenderElement(renderElement) {
    this.renderElement = renderElement;
    var self = this;
    this.handleMouseMove = this.mouseMove.bind(this);
    this.handleMouseClick = this.mouseClick.bind(this);
    $(this.renderElement)[0].addEventListener("mousemove",this.handleMouseMove);
    $(this.renderElement)[0].addEventListener("click",this.handleMouseClick);
  }

  _unbindHandlerArray(arSrc,arDest,handler) {
    arSrc.forEach((htest) => {
      if (handler.symbol !== htest.symbol) {
        arDest.push(htest);
      }
    });
  }

  unbindMouseMoveHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.mouseMoveHandlers,handlers,handler);
    this.mouseMoveHandlers = handlers;
  }
  unbindClickHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.clickHandlers,handlers,handler);
    this.clickHandlers = handlers;
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

  bindMouseMoveHandler(sink, method) {
    var handler = {symbol: Symbol(), sink, method};
    this.mouseMoveHandlers.push(handler);
  }

  bindMouseClickHandler(sink, method) {
    var handler = {symbol: Symbol(), sink, method};
    this.clickHandlers.push(handler);
  }

  domClick(selector,sink,method,args) {
    $(selector).off('click').on('click',function(ev) {
      sink[method](ev,args);
    });
  }
}
