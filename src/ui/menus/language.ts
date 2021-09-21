import { SuiMenuBase, SuiMenuParams } from './menu';
import { SmoTranslator } from '../i18n/language';

declare var $: any;
export class SuiLanguageMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get ctor() {
    return 'SuiLanguageMenu';
  }
  static defaults = {
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
  getDefinition() {
    return SuiLanguageMenu.defaults;
  }
  selection(ev: any) {
    var op = $(ev.currentTarget).attr('data-value');

    SmoTranslator.setLanguage(op);
    this.complete();
  }
  keydown() {
  }
}