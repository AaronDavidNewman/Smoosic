
class SmoTranslator {
  static get dialogs() {
    SmoTranslator._dialogs =  SmoTranslator._dialogs ? SmoTranslator._dialogs : {};
    return SmoTranslator._dialogs;
  }

  static get menus() {
    SmoTranslator._menus =  SmoTranslator._menus ? SmoTranslator._menus : {};
    return SmoTranslator._menus;
  }

  static registerMenu(_class) {
    if (!SmoTranslator.menus[_class]) {
      SmoTranslator.menus[_class] = true;
    }
  }


  static registerDialog(_class) {
    if (!SmoTranslator.dialogs[_class]) {
      SmoTranslator.dialogs[_class] = true;
    }
  }

  static printLanguages() {
    var translatables = [];
    SmoTranslator.allDialogs.forEach((key) => {
      SmoTranslator.registerDialog(key);
      translatables.push(SuiDialogBase.printTranslate(key));
    });
    SmoTranslator.allMenus.forEach((key) => {
      SmoTranslator.registerMenu(key);
      translatables.push(suiMenuBase.printTranslate(key));
    });

    console.log(JSON.stringify(translatables,null,' '));
  }

  static _updateDialog(dialogStrings,_dialogClass,dialogClass) {
    if (!dialogStrings) {
      console.log('no strings for Dialog '+dialogClass);
      return;
    }
    _dialogClass['label'] = dialogStrings.label;
    var staticText = dialogStrings.dialogElements.find((ds) => ds.staticText);
    _dialogClass['dialogElements'].forEach((component) => {
      var componentStrings = dialogStrings.dialogElements.find((ds) => {
        return ds.id === component.smoName;
      });
      if (component.staticText && staticText) {
        component.staticText.forEach((st) => {
          const trans = staticText.staticText.find((dst) => Object.keys(dst)[0] == Object.keys(st)[0]);
          if (trans) {
            const key = Object.keys(st)[0];
            st[key] = trans[key];
          }
        });
      }  else if (componentStrings) {
        component.label = componentStrings.label;
        if (component['options']) {
          component['options'].forEach((option) => {
            var optionString = componentStrings.options.find((cs) => cs.value === option.value);
            if (!optionString) {
              console.log('no string for option '+ option.value+' in component '+component.smoName+' in dialog ' + dialogClass);
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

  static _updateMenu(menuStrings,_menuClass,menuClass) {
    if (!menuStrings) {
      console.log('no strings for Menu '+menuClass);
      return;
    }

    _menuClass['defaults'].menuItems.forEach((menuItem) => {
      var val = menuItem.value;
      var nvPair = menuStrings.menuItems.find((ff) => ff.value === val);
      if (!nvPair) {
        console.log('no xlate for '+ val+' in menu '+menuClass);
      } else {
        menuItem.text = nvPair.text;
        console.log('setting menu item value '+val+' to '+nvPair.text);
      }
    });
  }

  static setLanguage(language) {
    if (!SmoLanguage[language]) {
      return; // no xlate exists
    }
    var trans = SmoLanguage[language];
    // Set the text in all the menus
    SmoTranslator.allMenus.forEach((menuClass) => {
      var _class = eval(menuClass);
      var menuStrings = trans.strings.find((mm) => {
        return mm.ctor == menuClass;
      });
      SmoTranslator._updateMenu(menuStrings,_class,menuClass);

      // Set text in ribbon buttons that invoke menus
      var menuButton = $('.ribbonButtonContainer button.'+menuClass).find('.left-text .text-span');
      if (menuButton.length && menuStrings) {
        $(menuButton).text(menuStrings.label);
      }
    });

    SmoTranslator.allDialogs.forEach((dialogClass) => {
      var _class = eval(dialogClass);
      var dialogStrings = trans.strings.find((mm) => {
        return mm.ctor == dialogClass;
      });
      // Set text in ribbon buttons that invoke menus
      var dialogButton = $('.ribbonButtonContainer button.'+dialogClass).find('.left-text .text-span');
      if (dialogButton.length && dialogStrings) {
        $(dialogButton).text(dialogStrings.label);
      }

      SmoTranslator._updateDialog(dialogStrings,_class,dialogClass);
    });

    // Translate the buttons on the ribbon
    const langButtons = trans.strings.find((buttonObj) => buttonObj.ribbonText);
    if (langButtons) {
      RibbonButtons.translateButtons.forEach((button) => {
        var domButton = $(button);
        var langButton = langButtons.ribbonText.find((lb) => lb.buttonId === button.buttonId);
        if (langButton) {
          var buttonDom = $('.ribbonButtonContainer #'+button.buttonId);
          if (buttonDom.length) {
            $(buttonDom).find('.left-text').text(langButton.buttonText);
          }
        }
      });
    }
    // Handle rtl languages
    $('body').find('.language-dir').each((ix,dd) => {$(dd).attr('dir',trans.dir)});
  }

  static get allMenus() {
    return [
      'SuiAddStaffMenu',
      'SuiMeasureMenu',
      'SuiFileMenu',
      'SuiTimeSignatureMenu',
      'SuiKeySignatureMenu',
      'SuiTimeSignatureMenu',
      'SuiKeySignatureMenu',
      'SuiStaffModifierMenu',
      'SuiDynamicsMenu',
      'SuiLanguageMenu',
      'SuiScoreMenu'
    ]
  }

  static get allDialogs() {
    return [
      'SuiLoadFileDialog',
      'SuiSaveFileDialog',
      'SuiPrintFileDialog',
      'SuiMeasureDialog',
      'SuiTempoDialog',
      'SuiInstrumentDialog',
      'SuiTimeSignatureDialog',
      'SuiLayoutDialog',
      'SuiDynamicModifierDialog',
      'SuiSlurAttributesDialog',
      'SuiVoltaAttributeDialog',
      'SuiHairpinAttributesDialog',
      'SuiLyricDialog',
      'SuiChordChangeDialog',
      'SuiTextTransformDialog',
      'SuiScoreViewDialog',
      'SuiScorePreferencesDialog',
      'SuiLyricDialog',
      'SuiChordChangeDialog',
    ]
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

class SmoLanguage {
  static getHelpFile(category) {
    return eval(category + SmoConfig.language);
  }
  static get en() {
    var strings = JSON.parse(smoLanguageStringEn);
    var rv = {dir:'ltr',strings:strings,helpHtml:{}};
    return rv;
   }

   static get ar() {
     var strings = JSON.parse(smoLanguageStringAr);
     var rv = {dir:'rtl',strings:strings,helpHtml:{}};
     return rv;
   }

   static get de() {
     var strings = JSON.parse(smoLanguageStringDe);
     var rv = {dir:'ltr',strings:strings,helpHtml:{}};
     return rv;
   }
}
