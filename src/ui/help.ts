// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, draggable, createTopDomContainer } from '../common/htmlHelpers';
import { SmoLanguage } from './i18n/language';
declare var $: any;

export interface HtmlHelpBlock {
  title: string,
  html: string
}
export class SuiHelp {
  static displayHelp() {
    $('body').addClass('showHelpDialog');
    $('.helpDialog').html('');
    $('.helpDialog').append(SuiHelp.closeButton.dom());
    SuiHelp.helpHtml.forEach((cat) => {
      const r = SuiHelp._buildElements(cat);
      $('.helpDialog').append(r.dom());
    });
    $('button.help-title').off('click').on('click', (ev: any) => {
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
    const cb = () => {};
    createTopDomContainer('.draganime');
    draggable({
      parent: $('.helpDialog'),
      handle: $('.helpDialog').find('.icon-move'),
      animateDiv:'.draganime',
      cb,
      moveParent: true
    });
  }

  static get closeButton() {
    const b = buildDom;
    const r = b('div').append(b('span').classes('icon icon-move')).append('div').classes('help-closer').append(
      b('button').classes('icon-cross close'));
    return r;
  }

  static _buildElements(helps: HtmlHelpBlock) {
    const b = buildDom;
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
      { title: 'Keys', html: SmoLanguage.getHelpFile('cardKeysHtml') },
      { title: 'Entering Notes', html: SmoLanguage.getHelpFile('cardNotesHtml') },
      { title: 'Changing Pitches', html: SmoLanguage.getHelpFile('cardPitchesHtml') },
      { title: 'Changing Pitches 2', html: SmoLanguage.getHelpFile('cardPitches2Html') },
      { title: 'Changing Duration', html: SmoLanguage.getHelpFile('cardDurationsHtml') },
      { title: 'Changing Duration 2', html: SmoLanguage.getHelpFile('cardDurations2Html') },
      { title: 'Selecting things - notes', html: SmoLanguage.getHelpFile('cardSelectionsHtml') },
      { title: 'Selecting things - modifiers', html: SmoLanguage.getHelpFile('cardSelections2Html') },
      { title: 'Articulations', html: SmoLanguage.getHelpFile('cardToggleArticulationHtml') },
      { title: 'Beams and Stems', html: SmoLanguage.getHelpFile('cardToggleBeamsAndStemsHtml') },
      { title: 'Beams and Stems 2', html: SmoLanguage.getHelpFile('cardToggleBeamsAndStems2Html') },    ];
  }
}
