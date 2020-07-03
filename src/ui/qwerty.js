
class Qwerty {
  static get navigationElements() {

    var kbRows =
    [
      { row: '1234567890-='},
      { row: 'QWERTYUIOP[]'},
      { row:'ASDFGHJKL;'},
      { row:'ZXCVBNM,./'}
    ];
    var arrows = [
      {icon: 'icon-arrow-left',text:'', classes:'helpKey',dataKey:'left-arrow'},
      {icon: 'icon-arrow-right',text:'',classes:'helpKey',dataKey:'right-arrow'},
      {icon: 'icon-arrow-up',text:'',classes:'helpKey',dataKey:'up-arrow'},
      {icon: 'icon-arrow-down' ,text:'',classes:'helpKey',dataKey:'down-arrow'}
    ];
    var keyRows = {};
    var labels = ['topNumbers','keys1','keys2','keys3','arrows'];
    var j = 0;

    kbRows.forEach((kbRow) => {
      var str = kbRow.row;
      var keys = [];
      for (var i = 0;i < str.length;++i) {
        if (j === 2 && i === 0) {
          keys.push({icon:'',text:'Shift',classes:'wideKey',dataKey:'shift'});
        }
        if (j === 3 && i === 0) {
          keys.push({icon:'',text:'Ctrl',classes:'wideKey',dataKey:'ctrl'});
          keys.push({icon:'',text:'Alt',classes:'helpKey',dataKey:'alt'});
        }
        keys.push({icon:'', text:str[i],classes:'helpKey',dataKey:str[i]});
      }
      keyRows[labels[j]] = {id:labels[j],rows:keys};
      j += 1;
    });
    keyRows[labels[j]] = {id:labels[j],rows:arrows};
    return keyRows;
  }

  static _flashButton(key) {
    var e = $('[data-key="'+key+'"]');
    if (e.length) {
      $(e).removeClass('transition-button');
      $(e).addClass('reverse-button');
      setTimeout(function() {
        $(e).removeClass('reverse-button');
        $(e).addClass('transition-button');
      })
    }
  }
  static handleKeyEvent(evdata) {
    if (evdata.code === 'ArrowLeft') {
      Qwerty._flashButton('left-arrow');
    } else if (evdata.code === 'ArrowRight') {
      Qwerty._flashButton('right-arrow');
    } else if (evdata.code === 'ArrowUp') {
      Qwerty._flashButton('up-arrow');
    } else if (evdata.code === 'ArrowDown') {
      Qwerty._flashButton('down-arrow');
    } else if (evdata.key.length === 1
      && evdata.key.charCodeAt(0) > 32
      && evdata.key.charCodeAt(0) < 127) {
      Qwerty._flashButton(evdata.key.toUpperCase());
    }
    if (evdata.ctrlKey) {
      Qwerty._flashButton('ctrl');
    }
    if (evdata.shiftKey) {
      Qwerty._flashButton('shift');
    }
    if (evdata.altKey) {
      Qwerty._flashButton('alt');
    }
  }

  static _helpButton(buttons) {
    var b = htmlHelpers.buildDom;
    var r = b('span').classes('keyContainer');
    buttons.rows.forEach((button) => {
      r.append(b('span').classes(button.icon + ' ' + button.classes).text(button.text)
        .attr('data-key',button.dataKey));
    });
    return r;
  }
  static _buttonBlock(buttons,id) {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('keyBlock').attr('id', id);
    r.append(Qwerty._helpButton(buttons));
    return r;
  }

  static _buildElements(rows) {
    var b = htmlHelpers.buildDom;
    var r = b('div').classes('buttonLine')
      .append(b('span').classes('icon icon-move'));
    var keys = Object.keys(rows);

    keys.forEach((key) => {
      var row = rows[key];
      r.append(Qwerty._buttonBlock(row));
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
