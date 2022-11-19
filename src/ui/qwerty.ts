// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, createTopDomContainer, draggable } from "../common/htmlHelpers";
import { KeyEvent } from '../smo/data/common';

export interface SuiKbRow {
  row: string, shifted: string;
};
export interface SuiKbKey {
  icon: string, text: string, shifted: string, classes: string, dataKey: string
};
declare var $: any;
export class Qwerty {
  static _shiftTime: number = 0;
  static displayed: boolean = false;
  static created: boolean = false;
  static get navigationElements() {
    const kbRows: SuiKbRow[] =
    [
      { row: '1234567890-=',shifted:'!@#$%^&*()_+'},
      { row: 'QWERTYUIOP[]',shifted:'QWERTYUIOP{}'},
      { row:"ASDFGHJKL;'", shifted:'ASDFGHJKL:"'},
      { row:'ZXCVBNM,./',shifted:'ZXCVBNM<>?'}
    ];
    const arrows: SuiKbKey[] = [
      {icon: 'icon-arrow-left',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowLeft'},
      {icon: 'icon-arrow-right',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowRight'},
      {icon:'',text:'Space',classes:'wideKey',shifted:'',dataKey:'Space'},
      {icon: 'icon-arrow-up',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowUp'},
      {icon: 'icon-arrow-down' ,text:'', shifted:'',classes:'helpKey',dataKey:'ArrowDown'},
      {icon: '' ,text:'Ins', shifted:'',classes:'helpKey',dataKey:'Insert'},
      {icon: '' ,text:'Del', shifted:'',classes:'helpKey',dataKey:'Delete'},
      {icon: '' ,text:'Enter', shifted:'',classes:'wideKey',dataKey:'Enter'}
    ];
    let keyRows: Record<string, SuiKbKey[]> = {};
    const labels: string[] = ['topNumbers','keys1','keys2','keys3','arrows'];
    let j = 0;

    kbRows.forEach((kbRow) => {
      var str = kbRow.row;
      var shifted = kbRow.shifted;
      var keys: SuiKbKey[] = [];
      for (var i = 0;i < str.length;++i) {
        if (j === 2 && i === 0) {
          keys.push({icon:'',text:'Shift',shifted: '', classes:'wideKey',dataKey:'shift'});
        }
        if (j === 3 && i === 0) {
          keys.push({icon:'', text:'Ctrl',shifted: '', classes:'wideKey', dataKey:'ctrl'});
          keys.push({icon:'', text:'Alt', shifted: '',classes:'helpKey', dataKey:'alt'});
        }
        keys.push({icon:'', text:str[i], shifted:shifted[i], classes:'helpKey', dataKey:str[i]});
      }
      keyRows[labels[j]] = keys;
      j += 1;
    });
    keyRows[labels[j]] = arrows;
    return keyRows;
  }
  static flashShift() {
    if (Qwerty._shiftTime) {
      Qwerty._shiftTime = 0;
      setTimeout(function() {
        Qwerty.flashShift();
      }, 1000);
    } else {
      $('.kb-float').removeClass('shifted');
    }
  }

  static displayForDuration() {
    Qwerty.displayAll();
    $('#row-0').hide();
    $('#row-1').hide();
    $('#row-4').hide();
  }

  static displayForTuplet() {
    Qwerty.displayAll();
    $('#row-1').hide();
    $('#row-2').hide();
  }

  static displayForNav() {
    Qwerty.displayAll();
    $('#row-0').hide();
    $('#row-1').hide();
  }

  static displayAll() {
    $('#row-0').show();
    $('#row-1').show();
    $('#row-2').show();
    $('#row-3').show();
    $('#row-4').show();
  }

  static _flashButton(key: string) {
    var e = $('[data-key="'+key+'"]');
    if (!e.length) {
       e = $('[data-shift="'+key+'"]');
    }
    if (e.length) {
      $(e).removeClass('transition-button');
      $(e).addClass('reverse-button');
      setTimeout(function() {
        $(e).removeClass('reverse-button');
        $(e).addClass('transition-button');
      },750);
    }
  }
  static get editingKeys()  {
    return ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Insert','Delete'];
  }
  static handleKeyEvent(evdata: KeyEvent) {
    if (Qwerty.editingKeys.indexOf(evdata.code) >= 0) {
      Qwerty._flashButton(evdata.code);
    } else if (evdata.key.length === 1
      && evdata.key.charCodeAt(0) > 32
      && evdata.key.charCodeAt(0) < 127) {
      Qwerty._flashButton(evdata.key.toUpperCase());
    }
    if (evdata.code === 'Space') {
      Qwerty._flashButton('Space');
    }
    if (evdata.code === 'Enter') {
      Qwerty._flashButton('Enter');
    }
    if (evdata.ctrlKey) {
      Qwerty._flashButton('ctrl');
    }
    if (evdata.shiftKey) {
      Qwerty._flashButton('shift');
      $('.kb-float').addClass('shifted');
      Qwerty._shiftTime = 1;
      Qwerty.flashShift();
    }
    if (evdata.altKey) {
      Qwerty._flashButton('alt');
    }
  }

  static _kbButton(buttons: SuiKbKey[]) {
    var b = buildDom;
    var r = b('span').classes('keyContainer');
    buttons.forEach((button) => {
      var text = button.text;
      var shiftedText = button.shifted ? button.shifted : text;
      r.append(b('span').classes(button.icon + ' ' + button.classes)
        .attr('data-key',button.dataKey).attr('data-shift',shiftedText)
          .append(b('span').classes('button-text').text(text))
          .append(b('span').classes('button-shifted').text(shiftedText))
      );
    });
    return r;
  }
  static _buttonBlock(buttons: SuiKbKey[], id: string) {
    var b = buildDom;
    var r = b('div').classes('keyBlock').attr('id', id);
    r.append(Qwerty._kbButton(buttons));
    return r;
  }

  static _buildElements(rows: Record<string, SuiKbKey[]>) {
    const b = buildDom;
    const r = b('div').classes('buttonLine')
      .append(b('span').classes('icon icon-move'));
    const keys = Object.keys(rows);
    keys.forEach((key, rowIx) => {
      const row = rows[key];
      r.append(Qwerty._buttonBlock(row, 'row-'+rowIx));
    });
    return r;
  }
  static hideKb() {
    $('body').removeClass('showQwerty');
    Qwerty.displayed = false;
  }
  static displayKb() {
    if (Qwerty.created) {
      $('body').addClass('showQwerty');
      Qwerty.displayed = true;
      return;
    }
    createTopDomContainer('.qwertyKb');
    $('body').addClass('showQwerty');
    $('.qwertyKb').html('');
    var b = buildDom;
    var r = b('div').classes('kb-float');
    r.append(Qwerty._buildElements(Qwerty.navigationElements));
    $('.qwertyKb').append(r.dom());

    var cb = function (x: any, y: any ) {}
    createTopDomContainer('.draganime');
    draggable({
      parent: $('.qwertyKb'),
      handle: $('.qwertyKb').find('.icon-move'),
      animateDiv:'.draganime',
      cb: cb,
      moveParent: true
    });
    Qwerty.displayed = true;
    Qwerty.created = true;
  }
}
