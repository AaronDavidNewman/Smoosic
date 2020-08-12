
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

  static _getHtmlTextInput(dbLabel,enLabel,langLabel,labelType,labelId) {
    var b = htmlHelpers.buildDom;

    const compHtml = b('div').classes('dialog-element-container')
      .attr('data-'+labelType,labelId).append(
        b('div').classes('dialog-component-label').append(
          b('span').classes('trans-label').append(
            b('span').text(dbLabel)
          ).append(
            b('span').text(enLabel)
          ).append(
            b('input').classes('trans-label-input')
          ).append(
            b('span').classes('plaintext-translate hide').text(langLabel)
          )
        )
      ).dom();
    return compHtml;
  }

  static _getStaticTextDialogHtml(dialogCtor,element,enDb,langDb,htmlContainer) {
    var b = htmlHelpers.buildDom;

    const dbObj = element.staticText;
    var enStNode = enDb.find((st) => st.staticText);
    if (!enStNode) {
      const enStString = JSON.parse(JSON.stringify(element.staticText));
      enStNode = { staticText:enStString };
      enDb.push({ staticText:enStString });
    }
    var langStNode = langDb.find((st) => st.staticText);
    if (!langStNode|| !langStNode.staticText) {
      const langStString = JSON.parse(JSON.stringify(element.staticText));
      langStNode = { staticText: langStString};
      langDb.push(langStNode);
    }
    const enObj = enStNode.staticText;
    const langObj = langStNode.staticText;
    const nodeContainer = b('div')
      .classes('dialog-element-container')
      .attr('data-component','staticText')
      .dom();
    $(htmlContainer).append(nodeContainer);
    const elKeys = dbObj.map((st) => Object.keys(st)[0]);
    elKeys.forEach((elKey) => {
      var dbVal = dbObj.find((st) => st[elKey]);
      var enVal = enObj.find((st) => st[elKey]);
      var langVal = langObj.find((st) => st[elKey]);
      if (!enVal) {
        enVal = dbVal;
      }
      if (!langVal) {
        langVal = dbVal;
      }
      const translateElement = SmoTranslator._getHtmlTextInput(
        elKey,enVal[elKey],langVal[elKey],'statictext',elKey);
      $(nodeContainer).append(translateElement);
    });
  }

  static _getDialogComponentHtml(dialogCtor,element,enDb,langDb,container) {
    var b = htmlHelpers.buildDom;

    var label = element.label;
    var smoName = element.smoName;
    var enComponent = enDb.find((st) => st.id === smoName);
    if (!enComponent) {
      enComponent = JSON.parse(JSON.stringify(element))
    }
    var langComponent = langDb.find((st) => st.id === smoName);
    if (!langComponent) {
      langComponent = JSON.parse(JSON.stringify(element));
    }
    const enLabel = enComponent.label ? enComponent.label : label;
    const langLabel = langComponent.label ? langComponent.label : label;
    const compHtml = SmoTranslator._getHtmlTextInput(
      label,enLabel,langLabel,'component',smoName);

    if (element.options) {
      const optionsHtml = b('div').classes('dialog-component-options').dom();
      $(compHtml).append(optionsHtml);
      if (!enComponent.options) {
        enComponent.options = JSON.parse(JSON.stringify(element.options));
      }
      if (!langComponent.options) {
        langComponent.options = JSON.parse(JSON.stringify(element.options));
      }

      element.options.forEach((option) => {
        var enOption = enComponent.options.find((op) => op.value === option.value);
        var langOption = langComponent.options.find((op) => op.value === option.value);
        if (!enOption || !enOption.label) {
          enOption = JSON.parse(JSON.stringify(option));
        }
        if (!langOption || !langOption.label) {
          langOption = JSON.parse(JSON.stringify(option));
        }
        const optionHtml =  SmoTranslator._getHtmlTextInput(
          option.value,enOption.label,langOption.label,'component-option',option.value);
          $(optionsHtml).append(optionHtml)
      });
      $(container).append(compHtml);
    }
  }

  static getDialogTranslationHtml(dialogCtor,enStrings,langStrings) {
    var b = htmlHelpers.buildDom;
    var container = b('div').classes('db-translate-container').attr('data-dbcontainer',dialogCtor)
      .append(b('button').classes('icon-plus trans-expander')).dom();
    var ctor = eval(dialogCtor);
    var elements = ctor.dialogElements;
    var enDb = enStrings.find((dbStr) => dbStr.ctor === dialogCtor);
    if (!enDb) {
      enDb = JSON.parse(JSON.stringify(elements));
    } else {
      enDb = enDb.dialogElements;
    }
    var langDb = langStrings.find((dbStr) => dbStr.ctor === dialogCtor);
    if (!langDb) {
      langDb = JSON.parse(JSON.stringify(elements));
    } else {
      langDb = langDb.dialogElements;
    }
    elements.forEach((element) => {
      if (element.staticText) {
        SmoTranslator._getStaticTextDialogHtml(dialogCtor,element,enDb,langDb,container);
      } else if (element.smoName) {
        SmoTranslator._getDialogComponentHtml(dialogCtor,element,enDb,langDb,container);
      }
    });
    return container;
  }
  static getAllTranslationHtml(lang) {
    var enStr = SmoLanguage.en.strings
    var langStr = SmoLanguage[lang].strings;
    var b = htmlHelpers.buildDom;
    var container = b('div').classes('top-translate-container').dom();
    SmoTranslator.allDialogs.forEach((dialog) => {
      $(container).append(SmoTranslator.getDialogTranslationHtml(dialog,enStr,langStr))
    });
    return container;
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

    })

    // Handle rtl languages
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
      'SuiInstrumentDialog',
      'SuiTimeSignatureDialog',
      'SuiLayoutDialog',
      'SuiDynamicModifierDialog',
      'SuiSlurAttributesDialog',
      'SuiVoltaAttributeDialog',
      'SuiHairpinAttributesDialog'
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
