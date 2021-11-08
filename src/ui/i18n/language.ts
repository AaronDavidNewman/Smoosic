// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoLanguageStringAr } from './language_ar';
import { smoLanguageStringDe } from './language_de';
import { smoLanguageStringEn } from './language_en';
declare var $: any;
declare var SmoConfig: any;
declare var RibbonButtons: any; // TODO: circular reference;
export class SmoTranslator {
  static dialogs: any[] = [];

  static menus: any[] = [];

  static registerMenu(_class: any) {
    if (!SmoTranslator.menus[_class]) {
      SmoTranslator.menus[_class] = true;
    }
  }
  static registerDialog(_class: any) {
    if (!SmoTranslator.dialogs[_class]) {
      SmoTranslator.dialogs[_class] = true;
    }
  }

  static printLanguages() {
    const dialogs: any[] = [];
    const menus: any[] = [];
    SmoTranslator.allDialogs.forEach((key) => {
      SmoTranslator.registerDialog(key);
      const translatable: any = eval('globalThis.Smo.' + key);
      dialogs.push(translatable.printTranslate(key));
    });
    SmoTranslator.allMenus.forEach((key) => {
      SmoTranslator.registerMenu(key);
      const translatable: any = eval('globalThis.Smo.' + key);
      menus.push(translatable.printTranslate(key));
    });
    const buttonText: any[] = JSON.parse(JSON.stringify(RibbonButtons.translateButtons));

    console.log(JSON.stringify({ dialogs, menus, buttonText }, null, ' '));
  }

  static _updateDialog(dialogStrings: any, _dialogClass: any, dialogClass: string) {
    if (!dialogStrings) {
      console.log('no strings for Dialog ' + dialogClass);
      return;
    }
    _dialogClass.label = dialogStrings.label;
    const staticText = dialogStrings.staticText;
    if (staticText || _dialogClass.dialogElements.staticText) {
      const keys = Object.keys(staticText);
      keys.forEach((key) => {
        _dialogClass.dialogElements.staticText[key] = staticText[key];
      });
    }
    _dialogClass.dialogElements.label = dialogStrings.label;
    _dialogClass.dialogElements.elements.forEach((component: any) => {
      const componentStrings = dialogStrings.dialogElements.find((ds: any) => ds.id === component.smoName);
      if (componentStrings) {
        component.label = componentStrings.label;
        if (component.options) {
          component.options.forEach((option: any) => {
            const optionString = componentStrings.options.find((cs: any) => cs.value === option.value);
            if (!optionString) {
              console.log('no string for option ' + option.value + ' in component ' + component.smoName + ' in dialog ' + dialogClass);
            } else {
              option.label = optionString.label;
            }
          });
        }
      } else {
        console.log('Untranslated component in  ' + dialogClass);
      }
    });
  }

  static _updateMenu(menuStrings: any, _menuClass: any, menuClass: any) {
    if (!menuStrings) {
      console.log('no strings for Menu ' + menuClass);
      return;
    }

    _menuClass.defaults.menuItems.forEach((menuItem: any) => {
      const val = menuItem.value;
      const nvPair = menuStrings.menuItems.find((ff: any) => ff.value === val);
      if (!nvPair) {
        console.log('no xlate for ' + val + ' in menu ' + menuClass);
      } else {
        menuItem.text = nvPair.text;
        console.log('setting menu item value ' + val + ' to ' + nvPair.text);
      }
    });
  }

  static setLanguage(language: any) {
    if (!(SmoLanguage as any)[language]) {
      return; // no xlate exists
    }
    const trans = (SmoLanguage as any)[language];
    // Set the text in all the menus
    SmoTranslator.allMenus.forEach((menuClass) => {
      const _class = eval('globalThis.Smo.' + menuClass);
      const menuStrings = trans.strings.menus.find((mm: any) => mm.ctor === menuClass);
      SmoTranslator._updateMenu(menuStrings, _class, menuClass);

      // Set text in ribbon buttons that invoke menus
      const menuButton = $('.ribbonButtonContainer button.' + menuClass).find('.left-text .text-span');
      if (menuButton.length && menuStrings) {
        $(menuButton).text(menuStrings.label);
      }
    });

    SmoTranslator.allDialogs.forEach((dialogClass) => {
      const _class = eval('globalThis.Smo.' + dialogClass);
      const dialogStrings = trans.strings.dialogs.find((mm: any) => mm.ctor === dialogClass);
      if (typeof (_class) === 'undefined') {
        console.log('no eval for class ' + dialogClass);
        return;
      }
      // Set text in ribbon buttons that invoke menus
      const dialogButton = $('.ribbonButtonContainer button.' + dialogClass).find('.left-text .text-span');
      if (dialogButton.length && dialogStrings) {
        $(dialogButton).text(dialogStrings.label);
      }

      SmoTranslator._updateDialog(dialogStrings, _class, dialogClass);
    });

    // Translate the buttons on the ribbon
    const langButtons = trans.strings.buttonText;
    if (langButtons) {
      RibbonButtons.translateButtons.forEach((button: any) => {
        const langButton = langButtons.find((lb: any) => lb.buttonId === button.buttonId);
        if (langButton) {
          const buttonDom = $('.ribbonButtonContainer #' + button.buttonId);
          if (buttonDom.length) {
            $(buttonDom).find('.left-text').text(langButton.buttonText);
          }
        }
      });
    }
    // Handle rtl languages
    $('body').find('.language-dir').each((ix: number, dd: any) => { $(dd).attr('dir', trans.dir); });
  }

  static get allMenus() {
    return [
      'SuiDynamicsMenu',
      'SuiFileMenu',
      'SuiKeySignatureMenu',
      'SuiLanguageMenu',
      'SuiLibraryMenu',
      'SuiMeasureMenu',
      'SuiPartMenu',
      'SuiScoreMenu',
      'SuiStaffMenu',
      'SuiStaffModifierMenu',
      'SuiTimeSignatureMenu',
    ];
  }

  static get allDialogs() {
    return [
      // file dialogs
      'SuiChordChangeDialog',
      'SuiDynamicModifierDialog',
      'SuiGlobalLayoutDialog',
      'SuiHairpinAttributesDialog',
      'SuiInsertMeasures',
      'SuiInstrumentDialog',
      'SuiLoadFileDialog',
      'SuiLoadMxmlDialog',
      'SuiLyricDialog',
      'SuiMeasureDialog',
      'SuiPageLayoutDialog',
      'SuiPartInfoDialog',
      'SuiPrintFileDialog',
      'SuiSaveFileDialog',
      'SuiSaveMidiDialog',
      'SuiSaveXmlDialog',
      'SuiScoreFontDialog',
      'SuiScorePreferencesDialog',
      'SuiScoreIdentificationDialog',
      'SuiScoreViewDialog',
      'SuiSlurAttributesDialog',
      'SuiStaffGroupDialog',
      'SuiTempoDialog',
      'SuiTextBlockDialog',
      'SuiTieAttributesDialog',
      'SuiTimeSignatureDialog',
      'SuiVoltaAttributeDialog'
    ];
  }
  static get allHelpFiles() {
    return [
      'quickStartHtml',
      'selectionHtml',
      'enterPitchesHtml',
      'enterDurationsHtml'
    ];
  }
}

export class SmoLanguage {
  static getHelpFile(category: any) {
    return eval('globalThis.Smo.' + category + SmoConfig.language);
  }
  static get en() {
    const strings = JSON.parse(smoLanguageStringEn);
    const rv = { dir: 'ltr', strings, helpHtml: {} };
    return rv;
  }

  static get ar() {
    const strings = JSON.parse(smoLanguageStringAr);
    const rv = { dir: 'rtl', strings, helpHtml: {} };
    return rv;
  }

  static get de() {
    const strings = JSON.parse(smoLanguageStringDe);
    const rv = { dir: 'ltr', strings, helpHtml: {} };
    return rv;
  }
}
