// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { KeyEvent } from "../render/sui/tracker";

declare var $: any;
// declare var SmoConfig: SmoConfiguration;

export interface EventHandler {
  sink: any,
  method: string,
  symbol: Symbol
}
// ##BrowserEventSource
// Handle registration for events.  Can be used for automated testing, so all
// the events are consolidated in one place so they can be simulated or recorded.
// If you already have an event-handling class, you can provide your own and 
// send events to Smoosic through this interface
export class BrowserEventSource {
  keydownHandlers: EventHandler[];
  mouseMoveHandlers: EventHandler[];
  mouseClickHandlers: EventHandler[];
  mouseUpHandlers: EventHandler[];
  mouseDownHandlers: EventHandler[];
  domTriggers: EventHandler[];
  handleMouseMove: ((ev: any) => void) | null = null;
  handleMouseClick: ((ev: any) => void) | null = null;
  handleMouseUp: ((ev: any) => void) | null = null;
  handleMouseDown: ((ev: any) => void) | null = null;

  handleKeydown: (ev: KeyEvent) => void;
  renderElement: any;
  constructor() {
    this.keydownHandlers = [];
    this.mouseMoveHandlers = [];
    this.mouseClickHandlers = [];
    this.mouseUpHandlers = [];
    this.mouseDownHandlers = [];
    this.domTriggers = [];
    this.handleKeydown = this.evKey.bind(this);
    window.addEventListener("keydown", this.handleKeydown as any, true);
  }

  evKey(event: KeyEvent) {
    this.keydownHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseMove(event: any) {
    this.mouseMoveHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseClick(event: any) {
    this.mouseClickHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseDown(event: any) {
    this.mouseDownHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  mouseUp(event: any) {
    this.mouseUpHandlers.forEach((handler) => {
      handler.sink[handler.method](event);
    });
  }

  setRenderElement(renderElement: any) {
    this.renderElement = renderElement;
    var self = this;
    this.handleMouseMove = this.mouseMove.bind(this);
    this.handleMouseClick = this.mouseClick.bind(this);
    this.handleMouseUp = this.mouseUp.bind(this);
    this.handleMouseDown = this.mouseDown.bind(this);
    $(document)[0].addEventListener("mousemove", this.handleMouseMove);
    $(this.renderElement)[0].addEventListener("click", this.handleMouseClick);
    $(document)[0].addEventListener("mouseup", this.handleMouseUp);
    $(document)[0].addEventListener("mousedown", this.handleMouseDown);
  }

  _unbindHandlerArray(arSrc: EventHandler[], arDest: EventHandler[], handler: EventHandler) {
    arSrc.forEach((htest) => {
      if (handler.symbol !== htest.symbol) {
        arDest.push(htest);
      }
    });
  }

  unbindMouseMoveHandler(handler: EventHandler) {
    const handlers: EventHandler[] = [];
    this._unbindHandlerArray(this.mouseMoveHandlers, handlers, handler);
    this.mouseMoveHandlers = handlers;
  }
  unbindMouseDownHandler(handler: EventHandler) {
    const handlers: EventHandler[] = [];
    this._unbindHandlerArray(this.mouseDownHandlers, handlers, handler);
    this.mouseDownHandlers = handlers;
  }
  unbindMouseUpHandler(handler: EventHandler) {
    const handlers: EventHandler[] = [];
    this._unbindHandlerArray(this.mouseUpHandlers, handlers, handler);
    this.mouseUpHandlers = handlers;
  }
  unbindMouseClickHandler(handler: EventHandler) {
    const handlers: EventHandler[] = [];
    this._unbindHandlerArray(this.mouseClickHandlers, handlers, handler);
    this.mouseClickHandlers = handlers;
  }

  unbindKeydownHandler(handler: EventHandler) {
    const handlers: EventHandler[] = [];
    this._unbindHandlerArray(this.keydownHandlers, handlers, handler);
    this.keydownHandlers = handlers;
  }

  bindScroller() { }

  // ### bindKeydownHandler
  // add a handler for the evKey event, for keyboard data.
  bindKeydownHandler(sink: any, method: string) {
    var handler: EventHandler = { symbol: Symbol(), sink, method };
    this.keydownHandlers.push(handler as EventHandler);
    return handler;
  }

  bindMouseMoveHandler(sink: any, method: string) {
    var handler: EventHandler = { symbol: Symbol(), sink, method };
    this.mouseMoveHandlers.push(handler as EventHandler);
    return handler;
  }

  bindMouseUpHandler(sink: any, method: string) {
    var handler: EventHandler = { symbol: Symbol(), sink, method };
    this.mouseUpHandlers.push(handler);
    return handler;
  }

  bindMouseDownHandler(sink: any, method: string) {
    var handler: EventHandler = { symbol: Symbol(), sink, method };
    this.mouseDownHandlers.push(handler);
    return handler;
  }

  bindMouseClickHandler(sink: any, method: string) {
    var handler: EventHandler = { symbol: Symbol(), sink, method };
    this.mouseClickHandlers.push(handler);
    return handler;
  }

  domClick(selector: string, sink: any, method: string, args: any[]) {
    $(selector).off('click').on('click', function (ev: any) {
      sink[method](ev, args);
    });
  }
}