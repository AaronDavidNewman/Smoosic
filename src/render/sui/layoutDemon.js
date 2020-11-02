
class SuiRenderDemon {
  constructor(parameters) {
    this.pollTime = 100;

    this.idleRedrawTime = 2500;
    this.idleLayoutTimer = 0;
    this.undoStatus=0;

    Vex.Merge(this, parameters);
  }

  get isLayoutQuiet() {
		return ((this.layout.passState == SuiRenderState.passStates.clean && this.layout.dirty == false)
		   || this.layout.passState == SuiRenderState.passStates.replace);
	}

  handleRedrawTimer() {
    // If there has been a change, redraw the score
  	if (this.undoStatus != this.undoBuffer.opCount || this.layout.dirty) {
  		this.layout.dirty=true;
  		this.undoStatus = this.undoBuffer.opCount;
  		this.idleLayoutTimer = Date.now();
      var state = this.layout.passState;
      // this.tracker.updateMap(); why do this before rendering?

      // indicate the display is 'dirty' and we will be refreshing it.
      $('body').addClass('refresh-1');
      try {
  		  this.render();
      } catch (ex) {
        SuiExceptionHandler.instance.exceptionHandler(ex);
      }
  	} else if (this.layout.passState === SuiRenderState.passStates.replace) {
  		// Do we need to refresh the score?
  		if (Date.now() - this.idleLayoutTimer > this.idleRedrawTime) {
  			this.layout.setRefresh();
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
		},self.pollTime);
	}

  startDemon() {
      this.pollRedraw();
  }

  render() {
		this.layout.render();
    if (this.layout.passState == SuiRenderState.passStates.clean && this.layout.dirty == false) {
       this.tracker.updateMap();

       // indicate the display is 'clean' and up-to-date with the score
       $('body').removeClass('refresh-1');
    }
	}
}
