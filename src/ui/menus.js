class suiMenuBase {
  constructor(params) {
    Vex.Merge(this, params);
    this.focusIndex = -1;
    SmoTranslator.registerMenu(this.ctor);
  }
  get closeModalPromise() {
    return this.closePromise();
  }
  static printTranslate(_class) {
    const xx = eval(_class);
    const items = [];
    xx.defaults.menuItems.forEach((item) => {
      items.push({ value: item.value, text: item.text });
    });
    return { ctor: xx.ctor, label: xx.label, menuItems: items };
  }

  complete() {
    $('body').trigger('menuDismiss');
  }
  // Most menus don't process their own events
  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class suiMenuManager {
  constructor(params) {
    Vex.Merge(this, suiMenuManager.defaults);
    Vex.Merge(this, params);
    this.eventSource = params.eventSource;
    this.view = params.view;
    this.bound = false;
    this.hotkeyBindings = {};
  }

  static get defaults() {
    return {
      menuBind: suiMenuManager.menuKeyBindingDefaults,
      menuContainer: '.menuContainer'
    };
  }

  get closeModalPromise() {
    return this.closeMenuPromise;
  }

  setController(c) {
    this.controller = c;
  }

  get score() {
    return this.view.score;
  }

  // ### Description:
  // slash ('/') menu key bindings.  The slash key followed by another key brings up
  // a menu.
  static get menuKeyBindingDefaults() {
    return [
      {
        event: 'keydown',
        key: 'n',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiLanguageMenu'
      }, {
        event: 'keydown',
        key: 'k',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiKeySignatureMenu'
      }, {
        event: 'keydown',
        key: 'l',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiStaffModifierMenu'
      }, {
        event: 'keydown',
        key: 'd',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiDynamicsMenu'
      }, {
        event: 'keydown',
        key: 's',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiAddStaffMenu'
      }, {
        event: 'keydown',
        key: 'f',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiFileMenu'
      }, {
        event: 'keydown',
        key: 'L',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiLibraryMenu'
      }, {
        event: 'keydown',
        key: 'm',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiTimeSignatureMenu'
      }, {
        event: 'keydown',
        key: 'a',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        action: 'SuiMeasureMenu'
      }
    ];
  }
  _advanceSelection(inc) {
    const options = $('.menuContainer ul.menuElement li.menuOption');
    inc = inc < 0 ? options.length - 1 : 1;
    this.menu.focusIndex = (this.menu.focusIndex + inc) % options.length;
    $(options[this.menu.focusIndex]).find('button').focus();
  }

  get menuBindings() {
    return this.menuBind;
  }

  unattach() {
    this.eventSource.unbindKeydownHandler(this.keydownHandler);
    $('body').removeClass('modal');
    $(this.menuContainer).html('');
    $('body').off('dismissMenu');
    this.bound = false;
    this.menu = null;
  }

  attach() {
    let hotkey = 0;

    $(this.menuContainer).html('');
    $(this.menuContainer).attr('z-index', '12');
    const b = htmlHelpers.buildDom;
    const r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
      .css('left', '' + this.menuPosition.x + 'px')
      .css('top', '' + this.menuPosition.y + 'px');
    this.menu.menuItems.forEach((item) => {
      var vkey = (hotkey < 10) ? String.fromCharCode(48 + hotkey) :
        String.fromCharCode(87 + hotkey);

      r.append(
        b('li').classes('menuOption').append(
          b('button').attr('data-value', item.value).append(
            b('span').classes('menuText').text(item.text))
            .append(b('span').classes('icon icon-' + item.icon))
            .append(b('span').classes('menu-key').text('' + vkey))));
      item.hotkey = vkey;
      hotkey += 1;
    });
    $(this.menuContainer).append(r.dom());
    $('body').addClass('modal');
    this.bindEvents();
  }

  slashMenuMode(completeNotifier) {
    var self = this;
    this.bindEvents();
    layoutDebug.addDialogDebug('slash menu creating closeMenuPromise');
    // A menu asserts this event when it is done.
    this.closeMenuPromise = new Promise((resolve) => {
      $('body').off('menuDismiss').on('menuDismiss', () => {
        layoutDebug.addDialogDebug('menuDismiss received, resolve closeMenuPromise');
        self.unattach();
        $('body').removeClass('slash-menu');
        resolve();
      });
    });
    // take over the keyboard
    completeNotifier.unbindKeyboardForModal(this);
  }

  dismiss() {
    $('body').trigger('menuDismiss');
  }

  createMenu(action) {
    this.menuPosition = { x: 250, y: 40, width: 1, height: 1 };
    // If we were called from the ribbon, we notify the controller that we are
    // taking over the keyboard.  If this was a key-based command we already did.
    layoutDebug.addDialogDebug('createMenu creating ' + action);
    const ctor = eval(action);
    this.menu = new ctor({
      position: this.menuPosition,
      tracker: this.tracker,
      keyCommands: this.keyCommands,
      score: this.score,
      completeNotifier: this.controller,
      closePromise: this.closeMenuPromise,
      view: this.view,
      eventSource: this.eventSource,
      undoBuffer: this.undoBuffer
    });
    this.attach(this.menuContainer);
    this.menu.menuItems.forEach((item) => {
      if (typeof(item.hotkey) !== 'undefined') {
        this.hotkeyBindings[item.hotkey] = item.value;
      }
    });
  }

  // ### evKey
  // We have taken over menu commands from controller.  If there is a menu active, send the key
  // to it.  If there is not, see if the keystroke creates one.  If neither, dismissi the menu.
  evKey(event) {
    if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
      return;
    }
    event.preventDefault();
    if (event.code === 'Escape') {
      this.dismiss();
    }
    if (this.menu) {
      if (event.code === 'ArrowUp') {
        this._advanceSelection(-1);
      } else if (event.code === 'ArrowDown') {
        this._advanceSelection(1);
      } else  if (this.hotkeyBindings[event.key]) {
        $('button[data-value="' + this.hotkeyBindings[event.key] + '"]').click();
      } else {
        this.menu.keydown(event);
      }
      return;
    }
    const binding = this.menuBind.find((ev) =>
      ev.key === event.key
    );
    if (!binding) {
      this.dismiss();
      return;
    }
    this.createMenu(binding.action);
  }

  bindEvents() {
    const self = this;
    this.hotkeyBindings = { };
    $('body').addClass('slash-menu');
    // We need to keep track of is bound, b/c the menu can be created from
    // different sources.
    if (!this.bound) {
      this.keydownHandler = this.eventSource.bindKeydownHandler(this, 'evKey');
      this.bound = true;
    }
    $(this.menuContainer).find('button').off('click').on('click', (ev) => {
      if ($(ev.currentTarget).attr('data-value') === 'cancel') {
        self.menu.complete();
        return;
      }
      self.menu.selection(ev);
    });
  }
}

// eslint-disable-next-line no-unused-vars
class SuiScoreMenu extends suiMenuBase {
  static get defaults() {
    SuiScoreMenu._defaults = typeof(SuiScoreMenu._defaults) !== 'undefined' ? SuiScoreMenu._defaults : {
      label: 'Score Settings',
      menuItems: [{
        icon: '',
        text: 'Layout',
        value: 'layout'
      }, {
        icon: '',
        text: 'View',
        value: 'view'
      }, {
        icon: '',
        text: 'Score Info',
        value: 'identification'
      }, {
        icon: '',
        text: 'Preferences',
        value: 'preferences'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
    return SuiScoreMenu._defaults;
  }
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiScoreMenu.defaults);
    super(params);
  }

  execView() {
    SuiScoreViewDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execScoreId() {
    SuiScoreIdentificationDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execLayout() {
    SuiLayoutDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  execPreferences() {
    SuiScorePreferencesDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      });
  }
  selection(ev) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'view') {
      this.execView();
    } else if (text === 'layout') {
      this.execLayout();
    } else if (text === 'preferences') {
      this.execPreferences();
    } else if (text === 'identification') {
      this.execScoreId();
    }
    this.complete();
  }
  keydown() {}
}
// eslint-disable-next-line no-unused-vars
class SuiFileMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiFileMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiFileMenu';
  }
  get ctor() {
    return SuiFileMenu.ctor;
  }
  static get defaults() {
    SuiFileMenu._defaults = typeof(SuiFileMenu._defaults) !== 'undefined' ? SuiFileMenu._defaults : {
      label: 'File',
      menuItems: [{
        icon: 'folder-new',
        text: 'New Score',
        value: 'newFile'
      }, {
        icon: 'folder-open',
        text: 'Open',
        value: 'openFile'
      }, {
        icon: '',
        text: 'Quick Save',
        value: 'quickSave'
      }, {
        icon: 'folder-save',
        text: 'Save',
        value: 'saveFile'
      }, {
        icon: '',
        text: 'Print',
        value: 'printScore'
      }, {
        icon: '',
        text: 'Import MusicXML',
        value: 'importMxml'
      }, {
        icon: '',
        text: 'Export MusicXML',
        value: 'exportXml'
      }, {
        icon: 'folder-save',
        text: 'Save Actions',
        value: 'saveActions'
      }, {
        icon: 'icon-play3',
        text: 'Play Actions',
        value: 'playActions'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
    return SuiFileMenu._defaults;
  }
  systemPrint() {
    const self = this;
    window.print();
    SuiPrintFileDialog.createAndDisplay({
      view: self.view,
      completeNotifier: self.completeNotifier,
      closeMenuPromise: self.closePromise,
      tracker: self.tracker,
      undoBuffer: self.undoBuffer,
    });
  }
  selection(ev) {
    const text = $(ev.currentTarget).attr('data-value');
    const self = this;
    if (text === 'saveFile') {
      SuiSaveFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.keyCommands.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    } else if (text === 'saveActions') {
      SuiSaveActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.keyCommands.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    }  else if (text === 'playActions') {
      SuiLoadActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.keyCommands.undoBuffer,
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    } else if (text === 'openFile') {
      SuiLoadFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        editor: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    } else if (text === 'newFile') {
      const score = SmoScore.getDefaultScore();
      this.view.changeScore(score);
    } else if (text === 'quickSave') {
      this.view.quickSave();
    } else if (text === 'printScore') {
      const systemPrint = () => {
        self.systemPrint();
      };
      this.view.renderer.renderForPrintPromise().then(systemPrint);
    } else if (text === 'exportXml') {
      SuiSaveXmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        editor: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    } else if (text === 'importMxml') {
      SuiLoadMxmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        editor: this.keyCommands,
        view: this.view,
        closeMenuPromise: this.closePromise
      });
    }
    this.complete();
  }
  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class SuiLibraryMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiLibraryMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiFileMenu';
  }
  get ctor() {
    return SuiFileMenu.ctor;
  }
  static get defaults() {
    SuiLibraryMenu._defaults = typeof(SuiLibraryMenu._defaults) !== 'undefined' ? SuiLibraryMenu._defaults : {
      label: 'Score',
      menuItems: [{
        icon: '',
        text: 'Bach Invention',
        value: 'bach'
      }, {
        icon: '',
        text: 'Postilion-Lied',
        value: 'postillion'
      }, {
        icon: '',
        text: 'Jesu Bambino',
        value: 'bambino'
      }, {
        icon: '',
        text: 'Handel Messiah 1-1',
        value: 'handel'
      }, {
        icon: '',
        text: 'Precious Lord',
        value: 'preciousLord'
      }, {
        icon: '',
        text: 'In Its Delightful Shade',
        value: 'shade'
      }, {
        icon: '',
        text: 'Yama',
        value: 'yamaJson'
      }, {
        icon: '',
        text: 'Dichterliebe (xml)',
        value: 'dichterliebe'
      }, {
        icon: '',
        text: 'Beethoven - An die ferne Gliebte (xml)',
        value: 'beethoven'
      }, {
        icon: '',
        text: 'Mozart - An Chloe (xml)',
        value: 'mozart'
      }, {
        icon: '',
        text: 'Joplin - The Entertainer (xml)',
        value: 'joplin'
      }, {
        icon: '',
        text: 'Cancel',
        value: 'cancel'
      }]
    };
    return SuiLibraryMenu._defaults;
  }
  _loadJsonAndComplete(path) {
    const req = new XMLHttpRequest();
    req.addEventListener('load', () => {
      const score = SmoScore.deserialize(req.responseText);
      this.view.changeScore(score);
      this.complete();
    });
    req.open('GET', path);
    req.send();
  }
  _loadXmlAndComplete(path) {
    const req = new XMLHttpRequest();
    req.addEventListener('load', () => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.responseText, 'text/xml');
      const score = mxmlScore.smoScoreFromXml(xml);
      this.view.changeScore(score);
      this.complete();
    });
    req.open('GET', path);
    req.send();
  }

  selection(ev) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'bach') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/BachInvention.json');
    } else if (text === 'yamaJson') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Yama2.json');
    } else if (text === 'handel') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Messiah Pt 1-1.json');
    } else if (text === 'bambino') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Gesu Bambino.json');
    } else if (text === 'shade') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Shade.json');
    } else if (text === 'postillion') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Postillionlied.json');
    } else if (text === 'preciousLord') {
      this._loadJsonAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Precious Lord.json');
    } else if (text === 'dichterliebe') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Dichterliebe01.xml');
    } else if (text === 'beethoven') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Beethoven_AnDieFerneGeliebte.xml');
    } else if (text === 'mozart') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/Mozart_AnChloe.xml');
    } else if (text === 'joplin') {
      this._loadXmlAndComplete('https://aarondavidnewman.github.io/Smoosic/release/library/ScottJoplin_The_Entertainer.xml');
    }
    this.complete();
  }
  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class SuiDynamicsMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiDynamicsMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiDynamicsMenu';
  }
  get ctor() {
    return SuiDynamicsMenu.ctor;
  }
  static get defaults() {
    SuiDynamicsMenu._defaults = SuiDynamicsMenu._defaults ? SuiDynamicsMenu._defaults :
      {
        label: 'Dynamics',
        menuItems: [{
          icon: 'pianissimo',
          text: 'Pianissimo',
          value: 'pp'
        }, {
          icon: 'piano',
          text: 'Piano',
          value: 'p'
        }, {
          icon: 'mezzopiano',
          text: 'Mezzo-piano',
          value: 'mp'
        }, {
          icon: 'mezzoforte',
          text: 'Mezzo-forte',
          value: 'mf'
        }, {
          icon: 'forte',
          text: 'Forte',
          value: 'f'
        }, {
          icon: 'fortissimo',
          text: 'Fortissimo',
          value: 'ff'
        }, {
          icon: 'sfz',
          text: 'sfortzando',
          value: 'sfz'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }]
      };
    return SuiDynamicsMenu._defaults;
  }

  selection(ev) {
    const text = $(ev.currentTarget).attr('data-value');
    this.view.addDynamic(text);
    this.complete();
  }
  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class SuiTimeSignatureMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiTimeSignatureMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiTimeSignatureMenu';
  }
  get ctor() {
    return SuiTimeSignatureMenu.ctor;
  }
  static get defaults() {
    SuiTimeSignatureMenu._defaults = SuiTimeSignatureMenu._defaults ? SuiTimeSignatureMenu._defaults :
      {
        label: 'Time Sig',
        menuItems: [{
          icon: 'sixeight',
          text: '6/8',
          value: '6/8',
        }, {
          icon: 'fourfour',
          text: '4/4',
          value: '4/4',
        }, {
          icon: 'threefour',
          text: '3/4',
          value: '3/4',
        }, {
          icon: 'twofour',
          text: '2/4',
          value: '2/4',
        }, {
          icon: 'twelveeight',
          text: '12/8',
          value: '12/8',
        }, {
          icon: 'seveneight',
          text: '7/8',
          value: '7/8',
        }, {
          icon: 'fiveeight',
          text: '5/8',
          value: '5/8',
        }, {
          icon: '',
          text: 'Other',
          value: 'TimeSigOther',
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }]
      };
    return SuiTimeSignatureMenu._defaults;
  }

  selection(ev) {
    var text = $(ev.currentTarget).attr('data-value');

    if (text === 'TimeSigOther') {
      SuiTimeSignatureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        closeMenuPromise: this.closePromise,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource
      });
      this.complete();
      return;
    }
    this.view.setTimeSignature(text);
    this.complete();
  }

  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class SuiKeySignatureMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiKeySignatureMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiKeySignatureMenu';
  }
  get ctor() {
    return SuiKeySignatureMenu.ctor;
  }
  static get defaults() {
    SuiKeySignatureMenu._defaults = typeof(SuiKeySignatureMenu._defaults) !== 'undefined'
      ? SuiKeySignatureMenu._defaults :
      {
        label: 'Key',
        menuItems: [{
          icon: 'key-sig-c',
          text: 'C Major',
          value: 'KeyOfC',
        }, {
          icon: 'key-sig-f',
          text: 'F Major',
          value: 'KeyOfF',
        }, {
          icon: 'key-sig-g',
          text: 'G Major',
          value: 'KeyOfG',
        }, {
          icon: 'key-sig-bb',
          text: 'Bb Major',
          value: 'KeyOfBb'
        }, {
          icon: 'key-sig-d',
          text: 'D Major',
          value: 'KeyOfD'
        }, {
          icon: 'key-sig-eb',
          text: 'Eb Major',
          value: 'KeyOfEb'
        }, {
          icon: 'key-sig-a',
          text: 'A Major',
          value: 'KeyOfA'
        }, {
          icon: 'key-sig-ab',
          text: 'Ab Major',
          value: 'KeyOfAb'
        }, {
          icon: 'key-sig-e',
          text: 'E Major',
          value: 'KeyOfE'
        }, {
          icon: 'key-sig-bd',
          text: 'Db Major',
          value: 'KeyOfDb'
        }, {
          icon: 'key-sig-b',
          text: 'B Major',
          value: 'KeyOfB'
        }, {
          icon: 'key-sig-fs',
          text: 'F# Major',
          value: 'KeyOfF#'
        }, {
          icon: 'key-sig-cs',
          text: 'C# Major',
          value: 'KeyOfC#'
        },
        {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
    return SuiKeySignatureMenu._defaults;
  }

  selection(ev) {
    let keySig = $(ev.currentTarget).attr('data-value');
    keySig = (keySig === 'cancel' ? keySig : keySig.substring(5, keySig.length));
    if (keySig === 'cancel') {
      return;
    }
    this.view.addKeySignature(keySig);
    this.complete();
  }
  keydown() {}
}

// eslint-disable-next-line no-unused-vars
class SuiStaffModifierMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiStaffModifierMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiStaffModifierMenu';
  }
  get ctor() {
    return SuiStaffModifierMenu.ctor;
  }

  static get defaults() {
    SuiStaffModifierMenu._defaults = typeof(SuiStaffModifierMenu._defaults) !== 'undefined' ? SuiStaffModifierMenu._defaults :
      {
        label: 'Lines',
        menuItems: [{
          icon: 'cresc',
          text: 'Crescendo',
          value: 'crescendo'
        }, {
          icon: 'decresc',
          text: 'Decrescendo',
          value: 'decrescendo'
        }, {
          icon: 'slur',
          text: 'Slur',
          value: 'slur'
        }, {
          icon: 'slur',
          text: 'Tie',
          value: 'tie'
        }, {
          icon: 'ending',
          text: 'nth ending',
          value: 'ending'
        },
        {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
    return SuiStaffModifierMenu._defaults;
  }
  selection(ev) {
    var op = $(ev.currentTarget).attr('data-value');
    if (op === 'ending') {
      this.view.addEnding();
    } else if (op === 'slur') {
      this.view.slur();
    }  else if (op === 'tie') {
      this.view.tie();
    } else if (op === 'crescendo') {
      this.view.crescendo();
    } else if (op === 'decrescendo') {
      this.view.decrescendo();
    }
    // else cancel...
    this.complete();
  }
  keydown() {
  }
}

// eslint-disable-next-line no-unused-vars
class SuiLanguageMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined') ? params : {};
    Vex.Merge(params, SuiLanguageMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiLanguageMenu';
  }
  get ctor() {
    return SuiLanguageMenu.ctor;
  }
  static get defaults() {
    SuiLanguageMenu._defaults = SuiLanguageMenu._defaults ? SuiLanguageMenu._defaults :
      {
        label: 'Language',
        menuItems: [{
          icon: '',
          text: 'English',
          value: 'en'
        }, {
          icon: '',
          text: 'Deutsch',
          value: 'de'
        }, {
          icon: '',
          text: 'اَلْعَرَبِيَّةُ',
          value: 'ar'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }],
        menuContainer: '.menuContainer'
      };
    return SuiLanguageMenu._defaults;
  }
  selection(ev) {
    var op = $(ev.currentTarget).attr('data-value');

    SmoTranslator.setLanguage(op);
    this.complete();
  }
  keydown() {
  }
}
// eslint-disable-next-line no-unused-vars
class SuiMeasureMenu extends suiMenuBase {
  static get defaults() {
    SuiMeasureMenu._defaults = SuiMeasureMenu._defaults ? SuiMeasureMenu._defaults : {
      label: 'Measure',
      menuItems: [
        {
          icon: '',
          text: 'Add Measures',
          value: 'addMenuCmd'
        }, {
          icon: 'icon-cross',
          text: 'Delete Selected Measures',
          value: 'deleteSelected'
        }, {
          icon: '',
          text: 'Format Measure',
          value: 'formatMeasureDialog'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }
      ]
    };
    return SuiMeasureMenu._defaults;
  }
  static get ctor() {
    return 'SuiMeasureMenu';
  }
  get ctor() {
    return SuiMeasureMenu.ctor;
  }

  constructor(params) {
    params = (typeof(params) !== 'undefined') ? params : {};
    Vex.Merge(params, SuiMeasureMenu.defaults);
    super(params);
  }
  selection(ev) {
    const text = $(ev.currentTarget).attr('data-value');
    if (text === 'formatMeasureDialog') {
      SuiMeasureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        closeMenuPromise: this.closePromise,
        eventSource: this.eventSource
      });
      this.complete();
      return;
    }
    if (text === 'addMenuCmd') {
      SuiInsertMeasures.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        closeMenuPromise: this.closePromise,
        eventSource: this.eventSource
      });
      this.complete();
    }
    if (text === 'addMenuAfterCmd') {
      this.keyCommands.addMeasure({ shiftKey: true });
      this.complete();
    }
    if (text === 'deleteSelected') {
      this.view.deleteMeasure();
    }
    this.complete();
  }
}

// eslint-disable-next-line no-unused-vars
class SuiAddStaffMenu extends suiMenuBase {
  constructor(params) {
    params = (typeof(params) !== 'undefined' ? params : {});
    Vex.Merge(params, SuiAddStaffMenu.defaults);
    super(params);
  }
  static get ctor() {
    return 'SuiAddStaffMenu';
  }
  get ctor() {
    return SuiAddStaffMenu.ctor;
  }

  static get defaults() {
    SuiAddStaffMenu._defaults = SuiAddStaffMenu._defaults ? SuiAddStaffMenu._defaults : {
      label: 'Add Staff',
      menuItems: [
        {
          icon: 'treble',
          text: 'Treble Clef Staff',
          value: 'trebleInstrument'
        }, {
          icon: 'bass',
          text: 'Bass Clef Staff',
          value: 'bassInstrument'
        }, {
          icon: 'alto',
          text: 'Alto Clef Staff',
          value: 'altoInstrument'
        }, {
          icon: 'tenor',
          text: 'Tenor Clef Staff',
          value: 'tenorInstrument'
        }, {
          icon: '',
          text: 'Staff Groups',
          value: 'staffGroups'
        }, {
          icon: 'cancel-circle',
          text: 'Remove Staff',
          value: 'remove'
        }, {
          icon: '',
          text: 'Cancel',
          value: 'cancel'
        }
      ],
      menuContainer: '.menuContainer'
    };
    return SuiAddStaffMenu._defaults;
  }
  static get instrumentMap() {
    return {
      'trebleInstrument': {
        instrumentInfo: {
          instrumentName: 'Treble Clef Staff',
          keyOffset: 0,
          clef: 'treble'
        }
      },
      'bassInstrument': {
        instrumentInfo: {
          instrumentName: 'Bass Clef Staff',
          keyOffset: 0,
          clef: 'bass'
        }
      },
      'altoInstrument': {
        instrumentInfo: {
          instrumentName: 'Alto Clef Staff',
          keyOffset: 0,
          clef: 'alto'
        }
      },
      'tenorInstrument': {
        instrumentInfo: {
          instrumentName: 'Tenor Clef Staff',
          keyOffset: 0,
          clef: 'tenor'
        }
      },
      'remove': {
        instrumentInfo: {
          instrumentName: 'Remove clef',
          keyOffset: 0,
          clef: 'tenor'
        }
      }
    };
  }
  execStaffGroups() {
    SuiStaffGroupDialog.createAndDisplay(
      {
        eventSource: this.eventSource,
        keyCommands: this.keyCommands,
        completeNotifier: this.completeNotifier,
        view: this.view,
        startPromise: this.closePromise
      }
    );
  }

  selection(ev) {
    const op = $(ev.currentTarget).attr('data-value');
    if (op === 'remove') {
      this.view.removeStaff();
      this.complete();
    } else if (op === 'staffGroups') {
      this.execStaffGroups();
      this.complete();
    } else if (op === 'cancel') {
      this.complete();
    } else {
      const instrument = SuiAddStaffMenu.instrumentMap[op];
      this.view.addStaff(instrument);
      this.complete();
    }
  }
  keydown() {}
}
