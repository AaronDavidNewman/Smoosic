// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SmoConfiguration } from './configuration';
import { SuiPiano } from '../render/sui/piano';

declare var SmoConfig: SmoConfiguration;
declare var $: any;

export class SuiDom {
  static splash() {
    var b: any = htmlHelpers.buildDom;
    var logoPath = SmoConfig.smoPath + '/styles/images/logo.png'
    var r = b('div').classes('bug-modal').append(
      b('img').attr('src', logoPath).classes('splash-logo'))
      .append(b('button').classes('icon icon-cross bug-dismiss-button'))
      .append(b('span').classes('splash-title').text('Sm'))
      .append(b('span').classes('splash-shine').text('ooooooooo'))
      .append(b('span').classes('splash-title').text('sic'));
    $('.bugDialog').append(r.dom());
    $('body').addClass('splashScreen modal');
    setTimeout(function () {
      $('body').removeClass('splashScreen modal');
    }, 1000);
  }

  static createDom(title: string) {
    if (title) {
      $('h1.testTitle').text(title);
    }

    var b = htmlHelpers.buildDom;
    var smoId = SmoConfig.smoDomContainer;
    var vexId = SmoConfig.vexDomContainer;
    var r = b('div').classes('dom-container')
      .append(b('div').classes('modes'))
      .append(b('div').classes('overlay'))
      .append(b('div').classes('draganime hide'))
      .append(b('div').classes('textEdit hide'))
      .append(b('div').classes('glyphRender hide').attr('id', 'glyphRender'))
      .append(b('div').classes('translation-editor'))
      .append(b('div').classes('attributeDialog'))
      .append(b('progress').attr('id', 'renderProgress').attr('value', '0').attr('max', '100'))
      .append(b('div').classes('qwertyKb'))
      .append(b('div').classes('saveLink'))
      .append(b('div').classes('bugDialog'))
      .append(b('div').classes('printFrame'))
      .append(b('div').classes('menuContainer'))
      .append(b('div').classes('workspace language-dir').attr('dir', SmoConfig.languageDir)
        .append(b('div').classes('helpDialog'))
        .append(b('div').classes('control-bar')
          .append(b('div').classes('titleText').text('Smoosic'))
          .append(b('div').classes('piano-container')
            .append(b('div').classes('key-left-ctrl'))
            .append(b('div').classes('piano-keys'))
            .append(b('div').classes('key-right-ctrl')))
          .append(b('div').classes('controls-top')))
        .append(b('div').classes('media')
          .append(b('div').classes('controls-left'))
          .append(b('div').classes('controls-menu-message'))
          ));
    $('#' + smoId).append(r.dom());
    var pianoDom = $('.piano-keys')[0];
    var svg = document.createElementNS(SvgHelpers.namespace, 'svg');
    svg.id = 'piano-svg';
    svg.setAttributeNS('', 'width', '' + SuiPiano.owidth * SuiPiano.dimensions.octaves);
    svg.setAttributeNS('', 'height', '' + SuiPiano.dimensions.wheight);
    svg.setAttributeNS('', 'viewBox', '0 0 ' + SuiPiano.owidth * SuiPiano.dimensions.octaves + ' ' + SuiPiano.dimensions.wheight);
    pianoDom.appendChild(svg);
  }
}
