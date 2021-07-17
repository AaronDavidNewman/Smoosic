// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { SmoLanguage } from './i18n/language';
export class SuiHelp {
  static displayHelp() {
    $('body').addClass('showHelpDialog');
    $('.helpDialog').html('');
    SuiHelp.helpHtml.forEach((cat) => {
      const r = SuiHelp._buildElements(cat);
      $('.helpDialog').append(r.dom());
    });
    $('.helpDialog').append(SuiHelp.closeButton.dom());
    $('button.help-title').off('click').on('click', (ev) => {
      $(ev.currentTarget).closest('div.helpLine').toggleClass('showSection');
      $(ev.currentTarget).find('span.icon').toggleClass('icon-plus');
      $(ev.currentTarget).find('span.icon').toggleClass('icon-minus');
    });
    $('.helpDialog button.icon-cross').off('click').on('click', () => {
      $('body').removeClass('showHelpDialog');
      $('.workspace').css('height', '');
    });
    const wsh = window.innerHeight;
    $('.workspace').css('height', '' + wsh + 'px');
  }

  static get closeButton() {
    const b = htmlHelpers.buildDom;
    const r = b('div').classes('help-closer').append(
      b('button').classes('icon-cross close'));
    return r;
  }

  static _buildElements(helps) {
    const b = htmlHelpers.buildDom;
    const r = b('div').classes('helpLine')
      .append(b('div').classes('help-category-button')
        .append(b('button')
          .append(b('span').classes('icon icon-plus')).classes('help-title')
          .append(b('span').classes('help-category-text').text(helps.title))))
      .append(b('div').classes('help-content').html(helps.html));

    return r;
  }

  static get helpHtml() {
    return [
      { title: 'Quick Start', html: SmoLanguage.getHelpFile('quickStartHtml') },
      { title: 'Selections and Selecting Things', html: SmoLanguage.getHelpFile('selectionHtml') },
      { title: 'Entering Music (Pitches)', html: SmoLanguage.getHelpFile('enterPitchesHtml') },
      { title: 'Entering Music (Durations)', html: SmoLanguage.getHelpFile('enterDurationsHtml') },
      { title: 'Working with Text, Lyrics, Chords', html: SmoLanguage.getHelpFile('workingWithText') }
    ];
  }
}
