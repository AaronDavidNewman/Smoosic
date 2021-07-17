// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { htmlHelpers } from '../common/htmlHelpers';
import { suiController } from './controller';
export class SuiExceptionHandler {
  constructor(params) {
    this.view = params.view;
    this.thrown = false;
    SuiExceptionHandler._instance = this;
  }
  static get instance() {
    return SuiExceptionHandler._instance;
  }
  exceptionHandler(e) {
    let stack = '';
    let doing = '';
    let scoreString = '';
    if (this.thrown) {
      return;
    }
    this.thrown = true;
    if (window.suiController && window.suiController.reentry) {
      return;
    }

    if (window.suiController) {
      suiController.reentry = true;
    }
    scoreString = 'Could not serialize score.';
    try {
      scoreString = this.view.score.serialize();
    } catch (e) {
      scoreString += ' ' + e.message;
    }
    const message = e.message;
    stack = 'No stack trace available';

    try {
      if (e.error && e.error.stack) {
        stack = e.error.stack;
      } else if (e.stack) {
        stack = e.stack;
      }
    } catch (e2) {
      stack = 'Error with stack: ' + e2.message;
    }
    doing = 'Last operation not available.';

    const lastOp = this.view.undoBuffer.peek();
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

    const b = htmlHelpers.buildDom;
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
        this.view.undoBuffer.undo(self.view.score);
        this.view.renderer.render();
        suiController.reentry = false;
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
