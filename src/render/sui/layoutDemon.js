
class SuiRenderDemon {
  constructor(parameters) {
    this.idleLayoutTimer = 0;
    this.undoStatus=0;

    Vex.Merge(this, parameters);
  }

  get isLayoutQuiet() {
		return ((this.view.renderer.passState == SuiRenderState.passStates.clean && this.view.renderer.dirty == false)
		   || this.view.renderer.passState == SuiRenderState.passStates.replace);
	}

  handleRedrawTimer() {
    // If there has been a change, redraw the score
  	if (this.undoStatus != this.undoBuffer.opCount || this.view.renderer.dirty) {
  		this.view.renderer.dirty=true;
  		this.undoStatus = this.undoBuffer.opCount;
  		this.idleLayoutTimer = Date.now();
      var state = this.view.renderer.passState;
      // this.tracker.updateMap(); why do this before rendering?

      // indicate the display is 'dirty' and we will be refreshing it.
      $('body').addClass('refresh-1');
      try {
  		  this.render();
      } catch (ex) {
        console.error(ex);
        SuiExceptionHandler.instance.exceptionHandler(ex);
      }
  	} else if (this.view.renderer.passState === SuiRenderState.passStates.replace) {
  		// Do we need to refresh the score?
  		if (Date.now() - this.idleLayoutTimer > SmoConfig.idleRedrawTime) {
  			this.view.renderer.setRefresh();
  		}
  	}
}

    // ### pollRedraw
	// if anything has changed over some period, prepare to redraw everything.
	pollRedraw() {
		var self=this;
		setTimeout(function() {
			self.handleRedrawTimer();
			self.pollRedraw();
		}, SmoConfig.demonPollTime);
	}

  startDemon() {
      this.pollRedraw();
  }

  render() {
		this.view.renderer.render();
    if (this.view.renderer.passState == SuiRenderState.passStates.clean && this.view.renderer.dirty == false) {
       this.view.tracker.updateMap();

       // indicate the display is 'clean' and up-to-date with the score
       $('body').removeClass('refresh-1');
    }
	}
}
