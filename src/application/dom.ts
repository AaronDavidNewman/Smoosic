// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom } from '../common/htmlHelpers';
import { SvgHelpers } from '../render/sui/svgHelpers';
import { SmoConfiguration } from './configuration';
import { SuiPiano } from '../render/sui/piano';

declare var $: any;

export class SuiDom {
  static splash(config: SmoConfiguration) {
    var b: any = buildDom;
    var logoPath = 'https://aarondavidnewman.github.io/Smoosic/release/styles/images/logo.png';
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

  static createUiDom(uiDomContainer: HTMLElement | string | undefined) {
    if (!uiDomContainer) {
      return;
    }
    if (typeof(uiDomContainer) === 'string') {
      uiDomContainer = document.getElementById(uiDomContainer) ?? undefined;
    }
    if (!uiDomContainer) {
      return;
    }
    var b = buildDom;
    var r = b('div').classes('dom-container')
      .append(b('div').classes('workspace language-dir').attr('dir', 'ltr')
        .append(b('div').classes('helpDialog'))
        .append(b('div').classes('control-bar')
          .append(b('div').classes('titleText').text('Smoosic'))
          .append(b('div').classes('piano-container')
            .append(b('div').classes('key-left-ctrl'))
            .append(b('div').classes('piano-keys'))
            .append(b('div').classes('key-right-ctrl')))
          .append(b('div').classes('controls-top').attr('id','controls-top')))
        .append(b('div').classes('media')
          .append(b('div').classes('controls-left').attr('id','controls-left'))
          ));
    
    uiDomContainer.append(r.dom()[0]);
    const scrollRegion = document.createElement('div');
    $(scrollRegion).attr('id', 'smo-scroll-region').addClass('musicRelief');
    $('.dom-container .media').append(scrollRegion);
    var pianoDom = $('.piano-keys')[0];
    var svg = document.createElementNS(SvgHelpers.namespace, 'svg');
    svg.id = 'piano-svg';
    svg.setAttributeNS('', 'width', '' + SuiPiano.owidth * SuiPiano.dimensions.octaves);
    svg.setAttributeNS('', 'height', '' + SuiPiano.dimensions.wheight);
    svg.setAttributeNS('', 'viewBox', '0 0 ' + SuiPiano.owidth * SuiPiano.dimensions.octaves + ' ' + SuiPiano.dimensions.wheight);
    pianoDom.appendChild(svg);
  }
}
