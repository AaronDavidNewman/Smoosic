
class SuiExceptionHandler {
  constructor(params) {
    this.view = params.view;
    this.thrown = false;
	  SuiExceptionHandler._instance = this;
  }
	static get instance() {
		return SuiExceptionHandler._instance;
	}
  exceptionHandler(e) {
    var self = this;
    if (this.thrown) {
      return;
    }
    this.thrown = true;
    if (window['suiController'] && window['suiController'].reentry) {
      return;
    }

    if (window['suiController']) {
      suiController.reentry = true;
    }
    var scoreString = 'Could not serialize score.';
    try {
      scoreString = this.view.score.serialize();
    } catch (e) {
      scoreString += ' ' + e.message;
    }
    var message = e.message;
    var stack = 'No stack trace available';

    try {
      if (e.error && e.error.stack) {
        stack = e.error.stack;
      } else if (e['stack']) {
  	     stack = e.stack;
      }
    } catch (e2) {
      stack = 'Error with stack: ' + e2.message;
    }
    var doing = 'Last operation not available.';

    var lastOp = this.view.undoBuffer.peek();
    if (lastOp) {
      doing = lastOp.title;
    }
    var url = 'https://github.com/AaronDavidNewman/Smoosic/issues';
    var bodyObject = JSON.stringify({
        message: message,
        stack: stack,
        lastOperation: doing,
        scoreString: scoreString
      }, null, ' ');

    var b = htmlHelpers.buildDom;
    var r = b('div').classes('bug-modal').append(
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

    $('.bug-dismiss-button').off('click').on('click', function () {
        $('body').removeClass('bugReport');
        if (lastOp) {
            self.view.undoBuffer.undo(self.view.score);
            self.view.renderer.render();
            suiController.reentry = false;
        }
    });
    $('.bug-submit-button').off('click').on('click', function () {
      var data = {
        title: "automated bug report",
        body: encodeURIComponent(bodyObject)
      };
      $('#bug-text-area').select();
      document.execCommand('copy');
      window.open(url, 'Report Smoosic issues');
    });
    $('body').addClass('bugReport');
    if (!this.thrown) {
      this.thrown = true;
      throw(e);
    }
  }
}
