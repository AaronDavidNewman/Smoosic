// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SvgHelpers } from './svgHelpers';
import { SvgBox, SvgPoint } from '../../smo/data/common';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoSelector } from '../../smo/xform/selections';
declare var $: any;

export interface CodeRegion {
  time: number,
  percent: number
}
export class layoutDebug {
  static get values(): Record<string, number> {
    return {
      pre: 1,
      play: 2,
      adjust: 4,
      system: 8,
      scroll: 16,
      artifactMap: 32,
      mouseDebug: 64,
      dragDebug: 128,
      dialogEvents: 256,
      cursor: 512
    };
  }

  static get classes(): Record<number, string> {
    return {
      1: 'measure-place-dbg',
      2: 'measure-play-dbg',
      4: 'measure-adjust-dbg',
      8: 'system-place-dbg',
      16: 'scroll-box-debug',
      32: 'measure-adjustHeight-dbg',
      64: 'mouse-debug',
      128: 'drag-debug',
      256: '',
      512: 'cursor-adj-dbg',
    };
  }
  static get codeRegions(): Record<string, number> {
    return {
      COMPUTE: 0,
      PREFORMATA: 1,
      PREFORMATB: 2,
      PREFORMATC: 3,
      FORMAT: 4,
      RENDER: 5,
      UPDATE_MAP: 6,
      POST_RENDER: 7,
      MAP: 8,
      LAST: 8
    };
  }
  static get codeRegionStrings(): string[] {
    return ['COMPUTE', 'PREFORMATA', 'PREFORMATB', 'PREFORMATC', 'FORMAT', 'RENDER', 'UPDATE_MAP', 'POST_RENDER', 'MAP'];
  }
  static mask: number = 0;
  static _textDebug: number[] = [];
  static timestampHash: Record<number, number> = {};
  static _dialogEvents: string[] = [];

  static clearTimestamps() {
    for (var i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      layoutDebug.timestampHash[i] = 0;
    }
  }

  static setTimestamp(region: number, millis: number) {
    layoutDebug.timestampHash[region] += millis;
  }
  static printTimeReport() {
    let total = 0;
    let report: Record<string, CodeRegion> = {};
    let i = 0;
    for (i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      total += layoutDebug.timestampHash[i];
      report[layoutDebug.codeRegionStrings[i]] = {
        time: layoutDebug.timestampHash[i], percent: 0
      };
    }
    report['total'] = { time: total, percent: 100 };
    for (i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      report[layoutDebug.codeRegionStrings[i]].percent =
        Math.round((report[layoutDebug.codeRegionStrings[i]].time * 100) / report.total.time);
    }
    console.log(JSON.stringify(report, null, ' '));
  }

  static flagSet(value: number) {
    return layoutDebug.mask & value;
  }

  static clearAll() {
    layoutDebug.mask = 0;
  }
  static setAll() {
    layoutDebug.mask = 1 + 2 + 4 + 8 + 16 + 32 + 64 + 128 + 256;
  }
  static setRenderFlags() {
    layoutDebug.mask = 1 + 2 + 4 + 8 + 16 + 32;
  }
  static clearDebugBoxes(value: number) {
    if (layoutDebug.flagSet(value)) {
      var selector = 'g.' + layoutDebug.classes[value];
      $(selector).remove();
    }
  }
  static debugBox(svg: SVGSVGElement, box: SvgBox | null, flag: number) {
    if (!box) {
      return;
    }
    if (!box.height) {
      box.height = 1;
    }
    if (layoutDebug.flagSet(flag)) {
      SvgHelpers.debugBox(svg, box, layoutDebug.classes[flag], 0);
    }
  }

  static setFlag(value: number) {
    var flag = layoutDebug.values[value];
    if (typeof (layoutDebug.mask) == 'undefined') {
      layoutDebug.mask = flag;
      return;
    }
    layoutDebug.mask |= flag;
    layoutDebug.setFlagDivs();
  }
  static setFlagDivs() {
    $('.scroll-box-debug').remove();
    $('.drag-debug').remove();
    $('.mouse-debug').remove();
    $('.play-debug').remove();
    if (layoutDebug.mask & layoutDebug.values.scroll) {
      const dbgDiv = $('<div class="scroll-box-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (layoutDebug.mask & layoutDebug.values.mouseDebug) {
      const dbgDiv = $('<div class="mouse-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (layoutDebug.mask & layoutDebug.values.dragDebug) {
      const dbgDiv = $('<div class="drag-debug"/>');
      $('body').append(dbgDiv);  
    }
    if (layoutDebug.mask & layoutDebug.values.play) {
      const dbgDiv = $('<div class="play-debug"/>');
      $('body').append(dbgDiv);  
    }
  }
  static updateScrollDebug(point: SvgPoint) {
    const displayString = 'X: ' + point.x + ' Y: ' + point.y;
    $('.scroll-box-debug').text(displayString);
    $('.scroll-box-debug').css('left', '2%').css('top', '20px');
  }
  static updateMouseDebug(client: SvgPoint, logical: SvgPoint, offset: SvgPoint) {
    const displayString = `clientX: ${client.x} clientY: ${client.y} svg: (${logical.x},${logical.y}) offset (${offset.x}, ${offset.y})`;
    $('.mouse-debug').text(displayString);
    $('.mouse-debug').css('left', '2%').css('top', '60px').css('position','absolute').css('font-size','11px');
  }
  static updateDragDebug(client: SvgPoint, logical: SvgPoint, state: string) {
    const displayString = `clientX: ${client.x} clientY: ${client.y} svg: (${logical.x},${logical.y}) state ${state})`;
    $('.drag-debug').text(displayString);
    $('.drag-debug').css('left', '2%').css('top', '80px').css('position','absolute').css('font-size','11px');
  }
  static updatePlayDebug(selector: SmoSelector, logical: SvgBox) {
    const displayString = `mm: ${selector.measure} tick: ${selector.tick} svg: (${logical.x},${logical.y}, ${logical.width}, ${logical.height})`;
    $('.play-debug').text(displayString);
    $('.play-debug').css('left', '2%').css('top', '100px').css('position','absolute').css('font-size','11px');
  }

  static addTextDebug(value: number) {
    layoutDebug._textDebug.push(value);
    console.log(value);
  }

  static addDialogDebug(value: string) {
    layoutDebug._dialogEvents.push(value);
    console.log(value);
  }

  static measureHistory(measure: SmoMeasure, oldVal: string, newVal: any, description: string) {
    if (layoutDebug.flagSet(layoutDebug.values.measureHistory)) {
      var oldExp = (typeof ((measure as any).svg[oldVal]) == 'object') ?
        JSON.stringify((measure as any).svg[oldVal]).replace(/"/g, '') : (measure as any).svg[oldVal];
      var newExp = (typeof (newVal) == 'object') ? JSON.stringify(newVal).replace(/"/g, '') : newVal;
      measure.svg.history.push(oldVal + ': ' + oldExp + '=> ' + newExp + ' ' + description);
    }
  }
}
