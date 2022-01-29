// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

import { SuiModalButtonStrings } from "../../release/smoosic";

declare var $: any;
/**
* returns an object that  lets you build a DOM in a somewhat readable way.
* 
* ## Usage
* ``` javascript
* var b = buildDom;
* var r =
*   b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
*     b('td').classes('noSideBorderRight').append(
*    ...
* $(parent).append(r.dom());
* ```  
* Don't forget the '.dom()' !  That is the actual jquery element object
* @returns 
**/
export class DomBuilder {
  e: any;
  constructor(el: any) {
    this.e = $('<' + el + '/>');
  }
  classes(cl: any) {
    $(this.e).addClass(cl);
    return this;
  }
  html(value: any) {
    $(this.e).html(value);
    return this;
  }
  data(name: string, value: string) {
    $(this.e).attr('data-' + name, value);
    return this;
  }
  attr(name: string, value: string) {
    $(this.e).attr(name, value);
    return this;
  }
  prop(name: string, value: boolean) {
    $(this.e).prop(name, value);
    return this;
  }
  css(name: string, value: string) {
    $(this.e).css(name, value);
    return this;
  }
  append(el: any) {
    $(this.e).append(el.e);
    return this;
  }
  text(tx: any) {
    $(this.e).append(document.createTextNode(tx));
    return this;
  }
  dom() {
    return this.e;
  }
}

export function buildDom(e: any) {
  return new DomBuilder(e);
}

export function focusableElements(): string[] {
  return ['a', 'input', 'select', 'textarea', 'button', 'li[tabindex]', 'div[tabindex]'];
}

export function addFileLink(filename: string, txt: any, parent: any, mimeType: string = 'application/octet-stream') {
  var anchor = $('<a></a>');
  var url = URL.createObjectURL(new Blob([txt], { type: mimeType }));
  $(anchor).attr('href', url);
  $(anchor).attr('download', filename);
  $(anchor).text('save');
  $(parent).html('');
  $(parent).append(anchor);
}

export class InputTrapper {
  selector: any;
  parent: any;
  id: any;
  parentId: any;
  modalInputs: any[];
  disabledInputs: any[];
  siblingInputs: any[];
  constructor(selector: any) {
    this.selector = selector;
    this.modalInputs = [];
    this.disabledInputs = [];
    this.siblingInputs = [];
    this.parent = $(this.selector);
    this.id = $(this.parent).attr('id');
    this.parentId = $(this.parent).parent().attr('id');
    var idstr = Math.round(Math.random() * (999999 - 1) + 1);
    if (!this.id) {
      $(this.parent).attr('id', idstr + '-element');
      this.id = $(this.parent).attr('id');
    }
    if (!this.parentId) {
      $(this.parent).parent().attr('id', idstr + '-parent');
      this.parentId = $(this.parent).parent().attr('id');
    }

  }
  trap(this: any) {
    // aria-hide peers of dialog and peers of parent that are not the parent.
    var peers = $(this.parent).parent().children().toArray();

    peers.forEach((node: any) => {
      var ptag: any = $(node)[0].tagName;
      if (ptag === 'SCRIPT' || ptag === 'LINK' || ptag === 'STYLE') {
        ;
      } else if ($(node).attr('id') === this.parentId ||
        $(node).attr('id') === this.id) {
          ;
      } else {
        var hidden = $(node).attr('aria-hidden');
        if (!hidden || hidden != 'true') {
          $(node).attr('aria-hidden', 'true');
          this.siblingInputs.push(node);
        }
      }
    });
    focusableElements().forEach((etype) => {
      var elements = $(etype).toArray();

      elements.forEach((element: any) => {
        var tagName = $(element)[0].tagName;
        if ($(element).attr('id') === this.id) {
          ;
        } else if ($(element).prop('disabled')) {
          ;
        } else if ($(element).hasClass('hide')) {
          ;
        } else if ($(element).closest(this.selector).length) {
          // inside
          this.modalInputs.push(element);
        } else if ((tagName === 'A' || tagName === 'DIV' || tagName === 'LI') && $(element).attr('tabIndex') === '-1') {
          ;
        } else {
          this.disabledInputs.push(element);
          if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
            $(element).attr('tabIndex', '-1');
          } else {
            $(element).prop('disabled', true);
          }
        }
      });
    });
  }

   close() {
      this.disabledInputs.forEach(function (element: any) {
        var tagName = $(element)[0].tagName;
        if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
          $(element).attr('tabIndex', '0');
        } else {
          $(element).prop('disabled', false);
        }
      });
      this.siblingInputs.forEach((el: any) => {
        $(el).removeAttr('aria-hidden');
      });
    }  
}
export function closeDialogPromise(): Promise<void> {
  return new Promise<void>((resolve) => {
    $('body').off('dialogDismiss').on('dialogDismiss', function () {
      resolve();
    });
  });
}
/**
 * Extract an HTMLElement from a Jquery id, DOM element ID, or HTMLELement.  If
 * an HTMLElement can't be created, return null
 * @param selector
 * @returns HTMLElement
 */
export function getDomContainer(selector: HTMLElement | string): HTMLElement | undefined {
  if (typeof(selector) === 'string') {
    if (selector[0] === '#') {
      const el: any = $(selector)[0];
      if (!(el instanceof HTMLElement)) {
        return undefined;
      }
      return el;
    } else {
      const el = document.getElementById(selector);
      if (!el) {
        return undefined;
      }
      return el;
    }
  } else if (selector instanceof HTMLElement) {
    return selector;
  } else {  
    return undefined;
  }
}
/**
 * Create a top-level HTML element for modal containers - dialogs etc.
 * from a jquery selector, or just return same if it exists
 * @param selector 
 * @returns 
 */
export function createTopDomContainer(selector: string | HTMLElement, elementType?: string): HTMLElement {
  const container = $(selector);
  if (!elementType) {
    elementType = 'div';
  }
  if (container.length > 0) {
    return container[0] as HTMLElement;
  } else {
    const ndiv = document.createElement(elementType);
    if (typeof(selector) === 'string') {
      const cl = (selector[0] === '.' || selector[0] === '#') ? selector.substring(1) : selector;
      $(ndiv).addClass(cl);
      if (selector[0] === '#') {
        $(ndiv).attr('id', selector.substring(1));
      }
    }
    $('body').append(ndiv);
    return $(ndiv)[0] as HTMLElement;
  }
}
/**
 * 
 * @param parameters 
 * @returns 
 */
export function draggable(parameters: any) {
  return new Draggable(parameters);
}

export class Draggable {
  parent: any;
  handle: any;
  animeClass: any;
  dragParent: any;
  domOffset: any;
  svg: any;
  width: number;
  height: number;
  lastX: number;
  lastY: number;
  cb: any;
  moveParent: boolean;
  dragging: boolean = false;

  constructor(parameters: any) {
    this.parent = parameters.parent;
    this.handle = parameters.handle;
    this.animeClass = parameters.animateDiv;
    this.dragParent = parameters.dragParent;

    // TODO: make '.dom-container' a part of the configuration
    this.domOffset = $('.dom-container').offset();

    this.svg = parameters['svg'];
    this.width = $(this.parent).outerWidth();
    this.height = $(this.parent).outerHeight();
    this.lastX = $(this.handle).offset().left - this.domOffset.left;
    this.lastY = $(this.handle).offset().top - this.domOffset.top;
    this.cb = parameters.cb;
    this.moveParent = parameters.moveParent;

    var self = this;

    // $('.itemMenu input[name="itemTitle"]').css('width','60%');
    $(this.handle)
      .off('mousedown').on('mousedown',
        function (e: any) {
          self.mousedown(e);
        });
    $(document)
      .on('mousemove',
        function (e: any) {
          self.mousemove(e);

        })
      .on('mouseup',
        function (e: any) {
          self.mouseup(e);
        });
  }
  _animate(e: any) {
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    $(this.animeClass).css('left', this.lastX - this.domOffset.left);
    $(this.animeClass).css('top', this.lastY - this.domOffset.top);

    if (this.dragParent) {
      $(this.parent).css('left', this.lastX + 'px');
      $(this.parent).css('top', this.lastY + 'px');
    }
  }
  mousedown(e: any) {
    if (!this.dragging) {
      $(this.animeClass).removeClass('hide');

      $(this.animeClass).css('width', this.width);
      $(this.animeClass).css('height', this.height);
    }

    this.dragging = true;
    this._animate(e);
  }
  enddrag() {
    this.lastX = this.lastX - this.domOffset.left;
    this.lastY = this.lastY - this.domOffset.top;
    if (this.moveParent) {
      $(this.parent).css('left', this.lastX + 'px');
      $(this.parent).css('top', this.lastY + 'px');
    }
    $(this.animeClass).addClass('hide');
    this.cb(this.lastX, this.lastY);
  }

  mouseup(e: any) {
    // stop resizing
    if (this.dragging) {
      this.dragging = false;
      this.lastX = e.clientX;
      this.lastY = e.clientY;

      this.enddrag();
    }
  }
  mousemove(e: any) {
    // we don't want to do anything if we aren't resizing.
    if (!this.dragging)
      return;
    this._animate(e);
  }
}
