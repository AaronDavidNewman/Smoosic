


// ## editSvgText
// A class that implements very basic text editing behavior in an svg text node
// params must supply the following:
// 1. target: an svg text element
// 2. textObject: a text object described below.
// 3. layout: the page layout information, used to create the shadow editor in the DOM
// The textObject must have the following attributes:
// 1. text (the text to render initially)
// 2. translateX, translateY, scaleX, scaleY for svg text element
// 3. fontInfo from smoScoreText and other text objects
class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
        this.layout = params.layout;
        this.fontInfo = params.textObject.fontInfo;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
        this.textObject = params.textObject;
        this.attrAr = [];
        this.id = VF.Element.newID();

        // create a mirror of the node under edit by copying attributes
        // and setting up a similarly-dimensioned viewbox
        editSvgText.textAttrs.forEach((attr) => {
			if (this.target.attributes[attr]) {
         		var val = this.target.attributes[attr].value;
				this.editText.setAttributeNS('',attr,val);
				this.attrAr.push(JSON.parse('{"'+attr+'":"'+val+'"}'));
			}
        });
        this.editing = this.running=false;

        // Hide the original - TODO, handle non-white background.
        this.oldFill = this.target.getAttributeNS(null,'fill');
        this.target.setAttributeNS(null,'fill','#fff');

        this.editText.textContent=this.textObject.text;
        this._value = this.textObject.text;
        var svgBox = svgHelpers.smoBox(this.target.getBBox());
        this.clientBox = svgHelpers.smoBox(svgHelpers.smoBox(this.target.getBoundingClientRect()));
        if (this.textObject.boxModel != 'none') {
            svgBox = svgHelpers.boxPoints(this.textObject.x,this.textObject.y,this.textObject.width,this.textObject.height);
            var boxDims = svgHelpers.logicalToClient(this.svg,svgBox);
            this.clientBox.width = boxDims.width;
            this.clientBox.height = boxDims.height;
        }
        this.editText.setAttributeNS('','y',svgBox.height);

        $('.textEdit').html('');
        this.svg.appendChild(this.editText);
        var b = htmlHelpers.buildDom;
        var r = b('span').classes('hide icon-move');
        $('.textEdit').append(r.dom());
        $('.textEdit').append(this.svg);
        $('.textEdit').removeClass('hide').attr('contentEditable','true');
        this.setEditorPosition(this.clientBox,svgBox,params);
        layoutDebug.addTextDebug('editSvgText: ctor '+this.id);
    }

    setEditorPosition(clientBox,svgBox) {
        var box = svgHelpers.pointBox(this.layout.pageWidth, this.layout.pageHeight);
        svgHelpers.svgViewport(this.svg, this.textObject.translateX,this.textObject.translateY, box.x,box.y,this.layout.svgScale);

        $('.textEdit').css('top',this.clientBox.y-5)
          .css('left',this.clientBox.x-5)
          .width(this.clientBox.width+10)
          .height(this.clientBox.height+10);
    }

    endSession() {
        this.editing = false;
        layoutDebug.addTextDebug('editSvgText: endSession for '+this.id);
        this.target.setAttributeNS(null,'fill',this.oldFill);
    }

    get value() {
        return this._value;
    }

    /* moveCursorToEnd() {
       if (this.editText.getNumberOfChars() < 1)
           return;
       var content = this.editText.textContent;
       this.editText.textContent = content+content.substr(content.length-1,1);
       this.editText.selectSubString(content.length,1);
    }  */

    _updateText() {
        $('.textEdit').focus();

        if (this.editText.textContent &&
         this.editText.textContent.length &&
           this._value != this.editText.textContent) {
          // if (this.editText[0]
          // this.editText.textContent = this.editText.textContent.replace(' ','');
          /* if (this.editText.textContent.length > 1 &&
              this.editText.textContent[this.editText.textContent.length - 1] == '_') {
            this.editText.textContent = this.editText.textContent.substr(0,this.editText.textContent.length - 1);
            var self = this;
            setTimeout(function() {
                self.moveCursorToEnd();
            },1);
          }  */
          this.target.textContent = this._value = this.editText.textContent;
          this._value = this.target.textContent;
          var fontAttr = svgHelpers.fontIntoToSvgAttributes(this.fontInfo);
          var svgBox = svgHelpers.getTextBox(this.svg,this.attrAr,null,this._value);
          var nbox = svgHelpers.logicalToClient(this.svg,svgBox);
          if (nbox.width > this.clientBox.width) {
             this.clientBox.width = nbox.width + nbox.width*.3;
             this.clientBox.height = nbox.height;
             this.setEditorPosition(this.clientBox,svgBox,{xOffset:0,yOffset:0});
           }
        }
        if (!this.editText.textContent) {
           this.editText.textContent='\xa0';
        }
    }

    // ### endTextEditSessionPromise
    // return a promise that is resolved when the current text edit session ends.
    endTextEditSessionPromise() {
        var self=this;
        $('body').addClass('text-edit');

        this.editing=true;
        this.running = true;
        layoutDebug.addTextDebug('editSvgText: create endTextEditSessionPromise '+this.id);
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self._updateText();
                    if (self.editing) {
                      editTimer();
                    } else {
                      self._updateText();
                      layoutDebug.addTextDebug('editSvgText: resolve endTextEditSessionPromise promise '+self.id);
                      resolve();
                    }
                },25);

            }
            editTimer();
		});

        return promise;
    }

    static get textAttrs() {
        return ['font-size','font-family','font-weight','fill','transform'];
    }
}

// ## editLyricSession
// Another interface between UI and renderer, let the user enter lyrics while
// navigating through the notes.  This class handles the session of editing
// a single note, and also the logic of skipping from note to note.
class editLyricSession {
	static get states() {
        return {stopped:0,started:1,minus:2,space:3,backSpace:4,stopping:5};
    }
	// tracker, selection, controller
    constructor(parameters) {
        this.tracker = parameters.tracker;
        this.selection = parameters.selection;
        this.controller = parameters.controller;
        this.verse=parameters.verse;
        this.notifier = parameters.notifier;
		this.bound = false;
        this.state=editLyricSession.states.stopped;
        layoutDebug.addTextDebug('editLyricSession: create note '+this.selection.note.attrs.id);
    }

    detach() {
        layoutDebug.addTextDebug('editLyricSession: detach() from '+this.selection.note.attrs.id);
        this.state = editLyricSession.states.stopping;
        this.editor.endSession();
        this.lyric.setText(this.editor.value);
		window.removeEventListener("keydown", this.keydownHandler, true);
        if (this.selection) {
            this.selection.measure.changed=true;
        }
    }

    // ### detachEditorCompletePromise
    // A promise that is resolved when SVG editor is fully detached.
    detachEditorCompletePromise() {
        var self=this;
        layoutDebug.addTextDebug('editLyricSession:create detachEditorCompletePromise from '+this.selection.note.attrs.id);
        return new Promise((resolve) => {
            var waiter = () => {
            setTimeout(() => {
                if (self.state == editLyricSession.states.stopping ||
                 self.state == editLyricSession.states.stopped) {
                     layoutDebug.addTextDebug('editLyricSession:resolve detachEditorCompletePromise promise from '+self.selection.note.attrs.id);
                     resolve();
                 } else {
                     waiter();
                 }

                },50);
            };
            waiter();
        });
    }

    // ### _lyricAddedPromise
    // Don't edit the lyric until the DOM part has been added by the editor, so pend on a promise that has happened.
    _lyricAddedPromise() {
        var self=this;
        layoutDebug.addTextDebug('editLyricSession:create _lyricAddedPromise promise from '+self.selection.note.attrs.id);
        return new Promise((resolve) => {
            var checkAdd = function() {
                setTimeout(function() {
                    self.textElement = $(self.tracker.layout.svg).find('#'+self.selection.note.renderId).find('g.lyric-'+self.lyric.verse)[0];
                    if (self.textElement) {
                        layoutDebug.addTextDebug('editLyricSession:resolve _lyricAddedPromise promise for  '+self.selection.note.attrs.id);
                        resolve();
                    } else {
                        checkAdd();
                    }
                },50);
            }
            checkAdd();
        });
    }

    // ### _editCurrentLyric
    // The DOM is ready.  Create the editor and wait for it to finish.
    _editCurrentLyric() {
        this.textElement = $(this.tracker.layout.svg).find('#'+this.selection.note.renderId).find('g.lyric-'+this.lyric.verse)[0];
        if (this.editor) {
            layoutDebug.addTextDebug('editLyricSession: _editCurrentLyric dispense with editor ' + this.editor.id);
        }
        this.editor = new editSvgText({target:this.textElement,
            textObject:this.lyric,
            layout:this.tracker.layout});
        this.state = editLyricSession.states.started;
        var self = this;
        function handleSkip() {
            layoutDebug.addTextDebug('editLyricSession:_editCurrentLyric endTextEditSessionPromise rcvd, editor is done, handleSkip for  '+self.selection.note.attrs.id);
            // Only skip to the next lyric if the session is still going on.
            if (self.state != editLyricSession.states.stopped && self.state != editLyricSession.states.stopping) {
                self._handleSkip();
            } else {  // session is stopping due to esc.
                self.notifier.detachCompleteEvent();
            }
        }

        this.editor.endTextEditSessionPromise().then(handleSkip);
    }

    // Start the editing session by creating editor, and wait for the editor to create the DOM element.
	_editingSession() {
        var self = this;
		if (!this.bound) {
			this.bindEvents();
		}
        function editCurrent() {
            layoutDebug.addTextDebug('editLyricSession:_lyricAddedPromise rcvd, _editCurrentLyric for  '+self.selection.note.attrs.id);
            self._editCurrentLyric();
        }
        this._lyricAddedPromise().then(editCurrent);
	}

    _getOrCreateLyric(note) {
      var lyrics =  note.getLyricForVerse(this.verse);
      layoutDebug.addTextDebug('editLyricSession:new lyric created  ');
      if (!lyrics.length) {
  			this.lyric = new SmoLyric({verse:this.verse});
      } else {
		   this.lyric = lyrics[0];
	    }
    }
    removeLyric() {
        if (this.selection && this.lyric) {
            this.selection.note.removeLyric(this.lyric);
            this.tracker.replaceSelectedMeasures();
            this._deferSkip();
        }
    }

    _handleSkip() {
        // var tag = this.state == editLyricSession.states.minus ? '-' :'';
        this.lyric.setText(this.editor.value);
        this.selection.measure.changed = true;
        if (this.state != editLyricSession.states.stopping) {
			var func = (this.state == editLyricSession.states.backSpace) ? 'lastNoteSelection' : 'nextNoteSelection';
            var sel = SmoSelection[func](
		      this.tracker.layout.score, this.selection.selector.staff,
              this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
            if (sel) {
                layoutDebug.addTextDebug('editLyricSession:_handleSkip,  moving on to '+sel.note.attrs.id);
                this.selection=sel;
                this.notifier.notifySelectionChanged(this.selection);
                this.editNote();
            }
        } else {
            layoutDebug.addTextDebug('editLyricSession:_handleSkip, no more lyrics');
            this.detach();
        }
    }

    editNote() {
		var self=this;
		function _startEditing() {
			self._editingSession();
		}
        this._getOrCreateLyric(this.selection.note)
		this.fontInfo = JSON.parse(JSON.stringify(this.lyric.fontInfo));
        this.selection.note.addLyric(this.lyric);
        this.selection.measure.changed = true;
        this.tracker.replaceSelectedMeasures();
		    _startEditing();
        return this.detachEditorCompletePromise();
    }

    // ### _deferSkip
    // skip to the next word, but not in the current call stack.  Used to handl
    // interactions with the dialog, where the dialog must reset changed flags
    // before  selection is changed
    _deferSkip() {
        var self=this;
        setTimeout(function() {
            self._handleSkip();
        },1);
    }

    // ### moveSelectionRight
    // Selection can move automatically based on key events, but there are Also
    // UI ways to force it.
    moveSelectionRight() {
        this.state = editLyricSession.states.space;
        this._deferSkip();
    }

    moveSelectionLeft() {
        this.state = editLyricSession.states.backSpace;
        this._deferSkip();
    }

	handleKeydown(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");

		if (['Space', 'Minus'].indexOf(event.code) >= 0) {
            if (editLyricSession.states.minus && event.shiftKey) {
                // allow underscore
            } else {
                this.state =  (event.code == 'Minus') ? editLyricSession.states.minus :  editLyricSession.states.space;
    			this.state = (this.state === editLyricSession.states.space && event.shiftKey)
    			     ? editLyricSession.states.backSpace :  this.state;
                layoutDebug.addTextDebug('editLyricSession:  handleKeydown skip key for  '+this.selection.note.attrs.id);
                this.editor.endSession();
                return;
            }
		}

		if (event.code == 'Escape') {
            this.state = editLyricSession.states.stopping;
            this.editor.endSession();
            return;
		}
        layoutDebug.addTextDebug('editLyricSession:  handleKeydown pass on event for  '+this.selection.note.attrs.id);
        this.selection.measure.changed=true;
	}

    bindEvents() {
		var self = this;
        this.controller.detach();

		if (!this.bound) {
			this.keydownHandler = this.handleKeydown.bind(this);

			window.addEventListener("keydown", this.keydownHandler, true);
			this.bound = true;
		}
		this.bound = true;
	}
}

// ## editNoteText
// Manage editing text for a note, and navigating, adding and removing.
class noteTextEditSession {
  constructor(changeNotifier,tracker,controller,verse,selection) {
    this.notifier = changeNotifier;
    this.tracker = tracker;
    this.controller = controller;
    this.verse = verse;
    this.selection = selection;
  }

  get isRunning() {
    return !(this.editor === null || (
      this.editor.state === editLyricSession.states.stopped ||
      this.editor.state === editLyricSession.states.stopping ));
  }

  notifySelectionChanged(selection) {
    if (selection) {
        layoutDebug.addTextDebug('SuiLyricEditComponent: lyric notification for ' + selection.note.attrs.id);
    } else {
        layoutDebug.addTextDebug('SuiLyricEditComponent: no selection');
    }
    if (this.selection == null || SmoSelector.neq(selection.selector,this.selection.selector)) {
        this.selection = selection;
        this.notifier.notifySelectionChanged();
    }
  }

  removeText() {
      this.editor.removeLyric();
  }

  moveSelectionRight() {
    this.editor.moveSelectionRight();
  }

  moveSelectionLeft() {
    this.editor.moveSelectionLeft();
  }

  toggleSessionStateEvent() {
    if (this.editor.state == editLyricSession.states.stopped ||
        this.editor.state == editLyricSession.states.stopping)  {
        layoutDebug.addTextDebug('SuiLyricEditComponent: restarting button');
        this.startEditingSession();
    } else {
        layoutDebug.addTextDebug('SuiLyricEditComponent: stopping editor button');
        this.forceEndSessionEvent();
    }
  }

  // Inform client that the edit session is complete
  detachCompleteEvent() {
    this.notifier.notifySelectionChanged();
  }

  startEditingSession() {
    layoutDebug.addTextDebug('SuiLyricEditComponent: initial create editor request');
    this.editor = new editLyricSession({tracker:this.tracker,verse:this.verse,selection:this.tracker.selections[0],controller:this.controller,notifier:this});
    this.editor.editNote();
  }
  forceEndSessionEvent() {
    this.editor.detach();
  }
}
