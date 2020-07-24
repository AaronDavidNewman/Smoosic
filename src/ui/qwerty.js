
class Qwerty {
  static get navigationElements() {

    var kbRows =
    [
      { row: '1234567890-=',shifted:'!@#$%^&*()_+'},
      { row: 'QWERTYUIOP[]',shifted:'QWERTYIOP{}'},
      { row:"ASDFGHJKL;'", shifted:'ASDFGHJKL:"'},
      { row:'ZXCVBNM,./',shifted:'ZXCVBNM<>?'}
    ];
    var arrows = [
      {icon: 'icon-arrow-left',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowLeft'},
      {icon: 'icon-arrow-right',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowRight'},
      {icon:'',text:'Space',classes:'wideKey',shifted:'',dataKey:'Space'},
      {icon: 'icon-arrow-up',text:'', shifted:'',classes:'helpKey',dataKey:'ArrowUp'},
      {icon: 'icon-arrow-down' ,text:'', shifted:'',classes:'helpKey',dataKey:'ArrowDown'},
      {icon: '' ,text:'Ins', shifted:'',classes:'helpKey',dataKey:'Insert'},
      {icon: '' ,text:'Del', shifted:'',classes:'helpKey',dataKey:'Delete'}
    ];
    var keyRows = {};
    var labels = ['topNumbers','keys1','keys2','keys3','arrows'];
    var j = 0;

    kbRows.forEach((kbRow) => {
      var str = kbRow.row;
      var shifted = kbRow.shifted;
      var keys = [];
      for (var i = 0;i < str.length;++i) {
        if (j === 2 && i === 0) {
          keys.push({icon:'',text:'Shift',classes:'wideKey',dataKey:'shift'});
        }
        if (j === 3 && i === 0) {
          keys.push({icon:'',text:'Ctrl',classes:'wideKey',dataKey:'ctrl'});
          keys.push({icon:'',text:'Alt',classes:'helpKey',dataKey:'alt'});
        }
        keys.push({icon:'', text:str[i],shifted:shifted[i],classes:'helpKey',dataKey:str[i]});
      }
      keyRows[labels[j]] = {id:labels[j],rows:keys};
      j += 1;
    });
    keyRows[labels[j]] = {id:labels[j],rows:arrows};
    return keyRows;
  }
  static flashShift() {
    if (Qwerty._shiftTime) {
      Qwerty._shiftTime = 0;
      setTimeout(function() {
        Qwerty.flashShift();
      },1000);
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

  static displayAll() {
    $('#row-0').show();
    $('#row-1').show();
    $('#row-2').show();
    $('#row-3').show();
    $('#row-4').show();
  }

  static _flashButton(key) {
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
  static handleKeyEvent(evdata) {
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

  static _kbButton(buttons) {
    var b = htmlHelpers.buildDom;
    var r = b('span').classes('keyContainer');
    buttons.rows.forEach((button) => {
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
  static _buttonBlock(buttons,id) {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('keyBlock').attr('id', id);
    r.append(Qwerty._kbButton(buttons));
    return r;
  }

  static _buildElements(rows) {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('buttonLine')
      .append(b('span').classes('icon icon-move'));
    var keys = Object.keys(rows);
    var rowIx = 0;
    keys.forEach((key) => {
      var row = rows[key];
      r.append(Qwerty._buttonBlock(row,'row-'+rowIx));
      rowIx += 1;
    });
    return r;
  }
  static displayKb() {
    $('body').addClass('showQwerty');
    $('.qwertyKb').html('');
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('kb-float');
    r.append(Qwerty._buildElements(Qwerty.navigationElements));
    $('.qwertyKb').append(r.dom());

    var cb = function (x, y) {}
    htmlHelpers.draggable({
      parent: $('.qwertyKb'),
      handle: $('.qwertyKb').find('.icon-move'),
      animateDiv:'.draganime',
      cb: cb,
      moveParent: true
    });
  }


}
