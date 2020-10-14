

// ##browserEventSource
// Handle registration for events.  Can be used for automated testing, so all
// the events are consolidated in one place so they can be simulated or recorded
class browserEventSource {
  constructor(evMask) {
    this.keydownHandlers = [];
    this.mouseMoveHandlers = [];
    this.mouseClickHandlers = [];
    this.mouseUpHandlers = [];
    this.mouseDownHandlers = [];
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
    this.mouseClickHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseDown(event) {
    this.mouseDownHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseUp(event) {
    this.mouseUpHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  setRenderElement(renderElement) {
    this.renderElement = renderElement;
    var self = this;
    this.handleMouseMove = this.mouseMove.bind(this);
    this.handleMouseClick = this.mouseClick.bind(this);
    this.handleMouseUp = this.mouseUp.bind(this);
    this.handleMouseDown = this.mouseDown.bind(this);
    $(document)[0].addEventListener("mousemove",this.handleMouseMove);
    $(this.renderElement)[0].addEventListener("click",this.handleMouseClick);
    $(document)[0].addEventListener("mouseup",this.handleMouseUp);
    $(document)[0].addEventListener("mousedown",this.handleMouseDown);
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
  unbindMouseDownHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.mouseDownHandlers,handlers,handler);
    this.mouseDownHandlers = handlers;
  }
  unbindMouseUpHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.mouseUpHandlers,handlers,handler);
    this.mouseUpHandlers = handlers;
  }
  unbindMouseClickHandler(handler) {
    var handlers = [];
    this._unbindHandlerArray(this.mouseClickHandlers,handlers,handler);
    this.mouseClickHandlers = handlers;
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
    return handler;
  }

  bindMouseUpHandler(sink, method) {
    var handler = {symbol: Symbol(), sink, method};
    this.mouseUpHandlers.push(handler);
    return handler;
  }

  bindMouseDownHandler(sink, method) {
    var handler = {symbol: Symbol(), sink, method};
    this.mouseDownHandlers.push(handler);
    return handler;
  }

  bindMouseClickHandler(sink, method) {
    var handler = {symbol: Symbol(), sink, method};
    this.mouseClickHandlers.push(handler);
    return handler;
  }

  domClick(selector,sink,method,args) {
    $(selector).off('click').on('click',function(ev) {
      sink[method](ev,args);
    });
  }
}
