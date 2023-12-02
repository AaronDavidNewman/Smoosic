// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { buildDom, createTopDomContainer } from '../common/htmlHelpers';
import { SuiEventHandler } from '../application/eventHandler';
import { SuiScoreView } from '../render/sui/scoreView';
declare var $: any;

export class SuiExceptionHandler {
  view: SuiScoreView;
  thrown: boolean;
  static _instance: SuiExceptionHandler;
  constructor(params: any) {
    this.view = params.view;
    this.thrown = false;
    SuiExceptionHandler._instance = this;
  }
  static get instance() {
    return SuiExceptionHandler._instance;
  }
  exceptionHandler(e: any) {
    let stack = '';
    let doing = '';
    let scoreString = '';
    if (this.thrown) {
      return;
    }
    this.thrown = true;
    if (SuiEventHandler.reentry) {
      return;
    }

    SuiEventHandler.reentry = true;
    scoreString = 'Could not serialize score.';
    try {
      scoreString = JSON.stringify(this.view.score.serialize(), null, ' ');
    } catch (e: any) {
      if (e.message) {
        scoreString += ' ' + e.message;
      }
    }
    const message = e.message;
    stack = 'No stack trace available';

    try {
      if (e.error && e.error.stack) {
        stack = e.error.stack;
      } else if (e.stack) {
        stack = e.stack;
      }
    } catch (e2: any) {
      stack = 'Error with stack: ' + e2.message;
    }
    doing = 'Last operation not available.';

    const lastOp = this.view.storeUndo.peek();
    if (lastOp) {
      doing = lastOp.title;
    }
    const url = 'https://github.com/AaronDavidNewman/Smoosic/issues';
    const bodyObject = JSON.stringify({
      message,
      stack,
      lastOperation: doing,
      scoreString
    }, null, ' ');
    createTopDomContainer('.bugDialog');
    const b = buildDom;
    const r = b('div').classes('bug-modal').append(
      b('img').attr('src', '../styles/images/logo.png').classes('bug-logo'))
      .append(b('button').classes('icon icon-cross bug-dismiss-button'))
      .append(b('span').classes('bug-title').text('oh nooooo!  You\'ve found a bug'))
      .append(b('p').text('It would be helpful if you would submit a bug report, and copy the data below into an issue'))
      .append(b('div')
        .append(b('textarea').attr('id', 'bug-text-area').text(bodyObject))
        .append(
          b('div').classes('button-container').append(b('button').classes('bug-submit-button').text('Submit Report'))));

    $('.bugDialog').html('');
    $('.bugDialog').append(r.dom());

    $('.bug-dismiss-button').off('click').on('click', () => {
      $('body').removeClass('bugReport');
      if (lastOp) {
        this.view.storeUndo.undo(this.view.score, {}, true);
        this.view.renderer.render();
        SuiEventHandler.reentry = false;
      }
    });
    $('.bug-submit-button').off('click').on('click', () => {
      $('#bug-text-area').select();
      document.execCommand('copy');
      window.open(url, 'Report Smoosic issues');
    });
    $('body').addClass('bugReport');
    if (!this.thrown) {
      this.thrown = true;
      throw (e);
    }
  }
}
