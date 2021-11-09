import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';

declare var $: any;

export class SuiKeySignatureMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiKeySignatureMenu';
  }
  static defaults: MenuDefinition = {
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
    }]
  };

  getDefinition() {
    return SuiKeySignatureMenu.defaults;
  }
  selection(ev: any) {
    let keySig = $(ev.currentTarget).attr('data-value');
    keySig = (keySig === 'cancel' ? keySig : keySig.substring(5, keySig.length));
    if (keySig === 'cancel') {
      return;
    }
    this.view.addKeySignature(keySig);
    this.complete();
  }
  keydown() { }
}
