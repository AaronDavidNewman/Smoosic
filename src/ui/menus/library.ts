import { SuiMenuBase, SuiMenuParams, MenuDefinition } from './menu';
import { SuiXhrLoader } from '../fileio/xhrLoader';
import { SmoScore } from '../../smo/data/score';
import { XmlToSmo } from '../../smo/mxml/xmlToSmo';

declare var $: any;

export class SuiLibraryMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults: MenuDefinition = {
    label: 'Score',
    menuItems: [{
      icon: '',
      text: 'Bach Invention',
      value: 'bach'
    }, {
      icon: '',
      text: 'Postillion-Lied',
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
  getDefinition() {
    return SuiLibraryMenu.defaults;
  }
  _loadJsonAndComplete(path: string) {
    const req = new SuiXhrLoader(path);
    req.loadAsync().then(() => {
      const score = SmoScore.deserialize(req.value);
      this.view.changeScore(score);
      this.complete();
    });
  }
  _loadXmlAndComplete(path: string) {
    const req = new SuiXhrLoader(path);
    req.loadAsync().then(() => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.value, 'text/xml');
      const score = XmlToSmo.convert(xml);
      this.view.changeScore(score);
      this.complete();
    });
  }

  selection(ev: any) {
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
  keydown() { }
}