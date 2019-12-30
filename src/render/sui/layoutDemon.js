
class SuiLayoutDemon {
    constructor(parameters) {
        this.pollTime = 100;

        this.idleRedrawTime = 5000;
        this.idleLayoutTimer = 0;
        this.undoStatus=0;

        Vex.Merge(this, parameters);
    }

    get isLayoutQuiet() {
		return ((this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false)
		   || this.layout.passState == suiLayoutBase.passStates.replace);
	}

    handleRedrawTimer() {
        if ($('body').hasClass('printing')) {
            return;
        }
	    // If there has been a change, redraw the score
		if (this.undoStatus != this.undoBuffer.opCount || this.layout.dirty) {
			this.layout.dirty=true;
			this.undoStatus = this.undoBuffer.opCount;
			this.idleLayoutTimer = Date.now();
            var state = this.layout.passState;
            try {
				this.render();
            } catch (ex) {
                SuiExceptionHandler.instance.exceptionHandler(ex);
            }
		} else if (this.layout.passState === suiLayoutBase.passStates.replace) {
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
        if ((this.layout.passState == suiLayoutBase.passStates.clean && this.layout.dirty == false)
 			|| this.layout.passState ==  suiLayoutBase.passStates.replace) {
		    this.tracker.updateMap();
        }
	}

}
