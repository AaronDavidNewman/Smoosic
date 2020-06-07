
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

  static _updateMenu(menuStrings,_menuClass,menuClass) {
    if (!menuStrings) {
      console.log('no strings for '+menuClass);
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
    SmoTranslator.allMenus.forEach((menuClass) => {
      var _class = eval(menuClass);
      var menuStrings = trans.strings.find((mm) => {
        return mm.ctor == menuClass;
      });
      SmoTranslator._updateMenu(menuStrings,_class,menuClass);

      var menuButton = $('.ribbonButtonContainer button.'+menuClass).find('.left-text .text-span');
      if (menuButton.length) {
        $(menuButton).text(menuStrings.label);
      }
    });
    $('body').find('.language-dir').each((ix,dd) => {$(dd).attr('dir',trans.dir)});
  }

  static get allMenus() {
    return [
      'SuiAddStaffMenu',
      'SuiFileMenu',
      'SuiTimeSignatureMenu',
      'SuiKeySignatureMenu',
      'SuiTimeSignatureMenu',
      'SuiKeySignatureMenu',
      'SuiFileMenu',
      'SuiStaffModifierMenu',
      'SuiDynamicsMenu'
    ]
  }

  static get allDialogs() {
    return [
      'SuiLoadFileDialog',
      'SuiSaveFileDialog',
      'SuiPrintFileDialog',
      'SuiMeasureDialog',
      'SuiTempoDialog',
      'SuiTimeSignatureDialog',
      'SuiLayoutDialog',
      'SuiDynamicModifierDialog',
    ]
  }
}

class SmoLanguage {
  static get en() {
    var strings = JSON.parse(smoLanguageStringEn);
    return {dir:'ltr',strings:strings};
   }

   static get ar() {
     var strings = JSON.parse(smoLanguageStringAr);
     return {dir:'rtl',strings:strings};
   }
}
