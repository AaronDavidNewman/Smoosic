// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, draggable, createTopDomContainer } from '../common/htmlHelpers';
import { SmoLanguage } from './i18n/language';
declare var $: any;

export interface HtmlHelpBlock {
  title: string,
  html: string,
  index: number
}
export type HelpMode = 'cards' | 'expand';
export class SuiHelp {
  static helpMode: HelpMode = 'cards';
  static created = false;
  static currentCard: number = 0;
  static displayHelp() {
    $('body').addClass('showHelpDialog');
    if (!SuiHelp.created) {
      createTopDomContainer('helpDialog');
      SuiHelp.created = true;
    }
    $('.helpDialog').html('');
    $('.helpDialog').append(SuiHelp.closeButton.dom());
    SuiHelp.helpHtml.forEach((cat, catIx) => {
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
    SuiHelp.setCards();
  }
  static setCards() {
    $('.helpDialog').addClass('card-view');
    const lines = $('.helpDialog .helpLine');
    const numLines = $(lines).length;
    $(lines).each((ix: number, line: any) => {
      const lineno = parseInt($(line).attr('data-index'));
      if (lineno !== SuiHelp.currentCard) {
        $(line).addClass('hide');
      } else {
        $(line).removeClass('hide');
        const prevButton = $(line).find('button.prev-topic');
        const nextButton = $(line).find('button.next-topic');
        if (lineno === numLines - 1) {
          $(nextButton).addClass('hide');
        }
        if (lineno === 0) {
          $(prevButton).addClass('hide');
        }
        $(prevButton).off('click').on('click', () => {
          SuiHelp.currentCard = (SuiHelp.currentCard + (numLines - 1)) % numLines;
          SuiHelp.setCards();
        });
        $(nextButton).off('click').on('click', () => {
          SuiHelp.currentCard = (SuiHelp.currentCard + 1) % numLines;
          SuiHelp.setCards();
        });
      }
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
    const r = b('div').classes('helpLine').attr('data-index', helps.index.toString())
      .append(b('div').classes('help-category-button')
        .append(b('button')
          .append(b('span').classes('icon icon-plus')).classes('help-title')
          .append(b('span').classes('help-category-text').text(helps.title))))
      .append(b('h3').text(helps.title))          
      .append(b('div').classes('help-content').html(helps.html))      
      .append(b('div').classes('button-container')
        .append(b('button').classes('prev-topic')
          .append(b('span').classes('icon icon-arrow-left'))
          .append(b('span').classes('prev-topic-text').text('Previous Topic')))
        .append(b('button').classes('next-topic')
          .append(b('span').classes('next-topic-text').text('Next Topic'))
          .append(b('span').classes(' icon icon-arrow-right'))));
    return r;
  }

  static get helpHtml() {
    const cards = [
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
      { title: 'Beams and Stems 2', html: SmoLanguage.getHelpFile('cardToggleBeamsAndStems2Html') },    
    ];
    const blocks: HtmlHelpBlock[] = [];
    cards.forEach((card, cardIx) => {
      blocks.push({ index: cardIx, ...card});
    });
    return blocks;
  }
}
