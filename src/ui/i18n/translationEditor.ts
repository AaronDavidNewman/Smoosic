// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from "../../common/htmlHelpers";
import { SmoLanguage, SmoTranslator, TranslationStrings } from "./language";
import { RibbonButtons } from "../buttons/ribbon";
import { ButtonLabel } from "../buttons/button";
import { DialogTranslation, DialogDefinition } from "../dialogs/dialog";
import { DialogDefinitionElement, DialogDefinitionOption } from "../dialogs/components/baseComponent";

declare var $: any;

// ## SmoTranslationEditor
// Create a somewhat user-friendly editor DOM to translate SMO
// dialogs and menus, and any subset, into other languages.
export class SmoTranslationEditor {
  // ### _getHtmlTextInput
  // All the editable text elements contain: the code label or value from the
  // UI element, the En string, and  the translated string, or a copy of the
  // EN string if the string has not been translated.
  static _getHtmlTextInput(dbLabel: string, enLabel: string, langLabel: string, labelType: string, labelId: string) {
    var b = htmlHelpers.buildDom;

    const compHtml = b('div').classes('dialog-element-container')
      .attr('data-' + labelType, labelId).append(
        b('div').classes('dialog-component-label').append(
          b('span').classes('trans-label').append(
            b('span').classes('trans-db-text').text(dbLabel)
          ).append(
            b('span').classes('trans-en-text').text(enLabel)
          ).append(
            b('input').classes('trans-label-input')
          ).append(
            b('span').classes('plaintext-translate hide').text(langLabel)
          )
        )
      ).dom();
    return compHtml;
  }

  // ### _getMenuTextDialogHtml
  // Get all the menu item labels for translation
  static _getMenuTextDialogHtml(menuCtor: string, enStrings: TranslationStrings, langStrings: TranslationStrings) {
    const menuClass = eval('globalThis.Smo.' + menuCtor);
    const menuItems = menuClass['defaults'].menuItems;
    var enMenu = enStrings.menus.find((mn: any) => mn.ctor === menuCtor);

    // Get the JSON EN menu, or copy the DB strings if it doesn't exist
    if (!enMenu) {
      enMenu = JSON.parse(JSON.stringify(menuClass['defaults']));
      enMenu!.ctor = menuCtor;
    }
    // Get the JSON language menu strings, or copy the EN strings if it doesn't exist
    var langMenu = langStrings.menus.find((mn: any) => mn.ctor === menuCtor);
    if (!langMenu) {
      langMenu = JSON.parse(JSON.stringify(menuClass['defaults']));
      langMenu!.ctor = menuCtor;
    }

    // create the DOM menu container
    var b = htmlHelpers.buildDom;
    const container = b('div').classes('menu-translate-container')
      .attr('data-menucontainer', menuCtor).append(
        b('button').classes('icon-plus trans-expander')).append(
          b('span').classes('menu-translate-title').text(menuCtor)
        ).dom();
    const menuItemsDom = b('div').classes('menu-element-container').dom();

    // create the label editor
    const menuLabel = SmoTranslationEditor._getHtmlTextInput(menuClass['defaults'].label, enMenu!.label, langMenu!.label,
      'menulabel', menuCtor);
    $(menuItemsDom).append(menuLabel);
    $(container).append(menuItemsDom);

    // create the editor for each item
    menuItems.forEach((item: any) => {
      var enItem = enMenu!.menuItems.find((mi: any) => mi.value === item.value);
      if (!enItem) {
        enItem = JSON.parse(JSON.stringify(item));
      }
      var langItem = langMenu!.menuItems!.find((mi: any) => mi.value === item.value);
      if (!langItem) {
        langItem = JSON.parse(JSON.stringify(item));
      }
      const menuItemDom = b('div').classes('menu-item-container').dom();
      const itemEditDom = SmoTranslationEditor._getHtmlTextInput(
        item.value, enItem!.text, langItem!.text,
        'itemtext', item.value);
      $(menuItemDom).append(itemEditDom);
      $(menuItemsDom).append(menuItemDom);
    });
    return container;
  }
  static getButtonTranslateHtml(enStrings: TranslationStrings, langStrings: TranslationStrings, transContainer: HTMLElement) {
    var b = htmlHelpers.buildDom;
    var buttonDom: HTMLElement = b('div').classes('ribbon-translate-container')
      .attr('data-ribbon-translate', 'buttons').append(
        b('button').classes('icon-plus trans-expander')).append(
          b('span').classes('ribbon-translate-title').text('Button Text')
        ).dom() as HTMLElement;

    var enKeys: ButtonLabel[] = enStrings.buttonText;
    if (!enKeys) {
      enKeys = JSON.parse(JSON.stringify(RibbonButtons.translateButtons));
    }
    var langKeys = langStrings.buttonText;
    if (!langKeys) {
      langKeys = JSON.parse(JSON.stringify(RibbonButtons.translateButtons));
    }
    enKeys.forEach((button: ButtonLabel) => {
      const langObj = langKeys.find((langText: any) => langText.buttonId === button.buttonId);
      const langString = langObj ? langObj.buttonText : button.buttonText;
      var buttonContainer: HTMLElement = b('div').classes('ribbon-button-container')
        .attr('data-buttoncontainer', button.buttonId).dom();
      $(buttonContainer).append(
        SmoTranslationEditor._getHtmlTextInput(button.buttonId, button.buttonText, langString, 'ribbon-button', button.buttonId)
      );
      $(buttonDom).append(buttonContainer);
    });
    $(transContainer).append(buttonDom);
  }

  // ### _getStaticTextDialogHtml
  // create DOM for the static text section of the dialogs.
  static _getStaticTextDialogHtml(elements: DialogDefinition, enDb: Record<string, string>, langDb: Record<string, string>, htmlContainer: HTMLElement) {
    var b = htmlHelpers.buildDom;
    const keys = Object.keys(elements.staticText);
    const nodeContainer = b('div')
      .classes('dialog-element-container')
      .attr('data-component', 'staticText')
      .dom();
    elements.staticText.forEach((nv: any) => {
      const name = Object.keys(nv)[0];
      const value = nv[name];
      var enVal = enDb[name] ? enDb[name] : value;
      var langVal = langDb[name] ? langDb[name] : enDb[name];
      const translateElement = SmoTranslationEditor._getHtmlTextInput(
        name, enVal, langVal, 'statictext', name);
      $(nodeContainer).append(translateElement);
    });
    $(htmlContainer).append(nodeContainer);
  }
  static _getDialogComponentHtml(element: DialogDefinitionElement, enDb: DialogTranslation, langDb: DialogTranslation, container: HTMLElement) {
    var b = htmlHelpers.buildDom;
    var label = element.label;
    var smoName = element.smoName;
    if (typeof (enDb.dialogElements.find) !== 'function') {
      console.warn('no ENDB!');
    }
    var enComponent = enDb.dialogElements.find((st: any) => st.id === smoName);
    if (!enComponent) {
      enComponent = JSON.parse(JSON.stringify(element))
    }
    var langComponent = langDb.dialogElements.find((st: any) => st.id === smoName);
    if (!langComponent) {
      langComponent = JSON.parse(JSON.stringify(element));
    }
    const enLabel = enComponent!.label ? enComponent!.label : label;
    const langLabel = langComponent!.label ? langComponent!.label : label;
    const compHtml = SmoTranslationEditor._getHtmlTextInput(
      label, enLabel, langLabel, 'component', smoName);

    if (element.options) {
      const optionsHtml = b('div').classes('dialog-component-options').dom();
      $(compHtml).append(optionsHtml);
      if (!enComponent!.options) {
        enComponent!.options = JSON.parse(JSON.stringify(element.options));
      }
      if (!langComponent!.options) {
        langComponent!.options = JSON.parse(JSON.stringify(element.options));
      }

      element.options.forEach((option: DialogDefinitionOption) => {
        var enOption = enComponent!.options!.find((op: any) => op.value === option.value);
        var langOption = langComponent!.options!.find((op: any) => op.value === option.value);
        if (!enOption || !enOption.label) {
          enOption = JSON.parse(JSON.stringify(option));
        }
        if (!langOption || !langOption.label) {
          langOption = JSON.parse(JSON.stringify(option));
        }
        const optionHtml = SmoTranslationEditor._getHtmlTextInput(
          option.value.toString(), enOption!.label, langOption!.label, 'component-option', option!.value.toString());
        $(optionsHtml).append(optionHtml)
      });
    }
    $(container).append(compHtml);
  }

  static getDialogTranslationHtml(dialogCtor: string, enStrings: TranslationStrings, langStrings: TranslationStrings) {
    var b = htmlHelpers.buildDom;
    var container: HTMLElement = b('div').classes('db-translate-container').attr('data-dbcontainer', dialogCtor)
      .append(b('button').classes('icon-plus trans-expander'))
      .append(b('span').classes('db-translate-title').text(dialogCtor)).dom() as HTMLElement;
    var ctor = eval('globalThis.Smo.' + dialogCtor);
    if (!ctor) {
      console.warn('Bad dialog in translate: ' + dialogCtor);
      return;
    }
    var elements = ctor.dialogElements as DialogDefinition;
    var enDb = enStrings.dialogs.find((dbStr: DialogTranslation) => dbStr.ctor === dialogCtor);
    if (!enDb) {
      enDb = JSON.parse(JSON.stringify({
        ctor: dialogCtor, label: elements.label, dialogElements: elements.elements, staticText: elements.staticText
      }
      ));
    }
    var langDb = langStrings.dialogs.find((dbStr: DialogTranslation) => dbStr.ctor === dialogCtor);
    if (!langDb) {
      langDb = JSON.parse(JSON.stringify({
        ctor: dialogCtor, label: elements.label, dialogElements: elements.elements, staticText: elements.staticText
      }));
    }
    const htmlText = SmoTranslationEditor._getHtmlTextInput(dialogCtor, enDb!.label, langDb!.label, 'dialog-label', dialogCtor);
    $(container).append(htmlText);
    if (elements.staticText) {
      SmoTranslationEditor._getStaticTextDialogHtml(elements, enDb!.staticText, langDb!.staticText, container);
    }
    elements.elements.forEach((element: DialogDefinitionElement) => {
      if (element.smoName && element.label) {
        SmoTranslationEditor._getDialogComponentHtml(element, enDb!, langDb!, container);
      }
    });
    return container;
  }
  static getAllTranslationHtml(lang: string) {
    const enStr: TranslationStrings = SmoLanguage.en.strings;
    const langStr: TranslationStrings = (SmoLanguage as any)[lang].strings;
    var b = htmlHelpers.buildDom;
    var container: HTMLElement = b('div').classes('top-translate-container')
      .attr('dir', (SmoLanguage as any)[lang].dir).dom() as HTMLElement;
    SmoTranslator.allDialogs.forEach((dialog) => {
      const htmlDom: HTMLElement | undefined = SmoTranslationEditor.getDialogTranslationHtml(dialog, enStr, langStr);
      if (htmlDom) {
        $(container).append(htmlDom);
      }
    });
    SmoTranslator.allMenus.forEach((menu) => {
      $(container).append(SmoTranslationEditor._getMenuTextDialogHtml(menu, enStr, langStr));
    });
    SmoTranslationEditor.getButtonTranslateHtml(enStr, langStr, container);
    var resultDom = b('div').classes('translation-json-container').append(
      b('textarea').classes('translation-json-text')).append(
        b('div').append(
          b('button').classes('translate-submit-button').text('Submit')
        )
      ).dom() as HTMLElement;
    $(container).append(resultDom);
    return container;
  }
  static parseDom() {
    var json = [];
    // $('.top-translate-container .db-translate-container[data-dbcontainer] [data-component="staticText"]')
    $('.top-translate-container .db-translate-container[data-dbcontainer]').each((ix: number, dbEl: any) => {
      var db = $(dbEl).attr('data-dbcontainer');
      var obj: any = { ctor: db };
      var elements: any[] = [];
      var domComponents = $(dbEl).find('[data-component]');
      $(domComponents).each(function (ix: number, domComponent: any) {
        const compType = $(domComponent).attr('data-component');
        if (compType === 'staticText') {
          var stElements: any[] = [];
          $(domComponent).find('[data-statictext]').each((ix: number, stDom: any) => {
            const key = $(stDom).attr('data-statictext');
            const value = $(stDom).find('input.trans-label-input').val();
            const stNode = JSON.parse('{"' + key + '":"' + value + '"}');
            stElements.push(stNode);
          });
          elements.push({ staticText: stElements });
        } else {
          var dbComponent = { id: compType, label: '', options: {} };
          dbComponent.label = $(domComponent).find('input.trans-label-input').val();
          var compOptions: any[] = [];
          $(domComponent).find('[data-component-option]').each(function (ix: number, optionDom: any) {
            const value = $(optionDom).find('.trans-db-text').text();
            const label = $(optionDom).find('input.trans-label-input').val();
            compOptions.push({ value: value, label: label });
          });
          dbComponent.options = compOptions;
          elements.push(dbComponent);
        }
      });
      obj.dialogElements = elements;
      json.push(obj);
    });
    $('.menu-translate-container[data-menucontainer]').each((ix: number, menuEl: any) => {
      var menuId = $(menuEl).attr('data-menucontainer');
      var obj = { ctor: menuId, label: '', options: {}, menuItems: {} };
      const menuLabel = $(menuEl)
        .find('.dialog-element-container[data-menulabel] .trans-label-input')
        .val();
      obj.label = menuLabel;
      var menuItems: any[] = [];
      var itemsDom = $(menuEl).find('.menu-item-container .dialog-element-container');
      $(itemsDom).each((ix: number, itemDom: any) => {
        const value = $(itemDom).find('.trans-db-text').text();
        const text = $(itemDom).find('input.trans-label-input').val();
        menuItems.push({ value: value, text: text });
      });
      obj.menuItems = menuItems;
      json.push(obj);
    });
    var ribbonText: any[] = [];
    $('.ribbon-translate-container .ribbon-button-container').each((ix: number, buttonEl: any) => {
      const buttonId = $(buttonEl).find('.trans-db-text').text();
      const buttonText = $(buttonEl).find('input.trans-label-input').val();
      ribbonText.push({ buttonId: buttonId, buttonText: buttonText });
    });
    json.push({ ribbonText: ribbonText });
    return json;
  }
  static startEditor(lang: string) {
    var transDom = SmoTranslationEditor.getAllTranslationHtml(lang);
    $('.translation-editor').append(transDom);
    $('body').addClass('translation-mode');
    $('.plaintext-translate').each(function (ix: number, el: any) {
      var txt = $(el).text();
      $(el).closest('.trans-label').find('input.trans-label-input').val(txt);
    });

    $('.db-translate-container button.trans-expander').off('click').on('click', function (ev: any) {
      var exp = $(ev.target).closest('.db-translate-container');
      if ($(exp).hasClass('expanded')) {
        $(exp).removeClass('expanded');
        $(ev.target).removeClass('icon-minus');
        $(ev.target).addClass('icon-plus');
      } else {
        $(exp).addClass('expanded');
        $(ev.target).addClass('icon-minus');
        $(ev.target).removeClass('icon-plus');
      }
    });
    $('.menu-translate-container button.trans-expander').off('click').on('click', function (ev: any) {
      var exp = $(ev.target).closest('.menu-translate-container');
      if ($(exp).hasClass('expanded')) {
        $(exp).removeClass('expanded');
        $(ev.target).removeClass('icon-minus');
        $(ev.target).addClass('icon-plus');
      } else {
        $(exp).addClass('expanded');
        $(ev.target).addClass('icon-minus');
        $(ev.target).removeClass('icon-plus');
      }
    });
    $('.ribbon-translate-container button.trans-expander').off('click').on('click', function () {
      const dom = $('.ribbon-translate-container button.trans-expander');
      var exp = $(dom).closest('.ribbon-translate-container');
      if ($(exp).hasClass('expanded')) {
        $(exp).removeClass('expanded');
        $(dom).removeClass('icon-minus');
        $(dom).addClass('icon-plus');
      } else {
        $(exp).addClass('expanded');
        $(dom).addClass('icon-minus');
        $(dom).removeClass('icon-plus');
      }
    });
    $('.translate-submit-button').off('click').on('click', () => {
      var json = SmoTranslationEditor.parseDom();
      $('.translation-json-text').val(JSON.stringify(json, null, ' '));
    });


  }

}
