


// ## editSvgText
// A class that implements very basic text editing behavior in an svg text node
class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
        this.layout = params.layout;
        this.fontInfo = params.fontInfo;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
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

        this.editText.textContent=this.target.textContent;
        this._value = this.editText.textContent;
        this.clientBox = svgHelpers.smoBox(svgHelpers.smoBox(this.target.getBoundingClientRect()));
        var svgBox = svgHelpers.smoBox(this.target.getBBox());
        this.editText.setAttributeNS('','y',svgBox.height);

        $('.textEdit').html('');
        this.svg.appendChild(this.editText);
        var b = htmlHelpers.buildDom;
        var r = b('span').classes('hide icon-move');
        $('.textEdit').append(r.dom());
        $('.textEdit').append(this.svg);
        $('.textEdit').removeClass('hide').attr('contentEditable','true');
        this.setEditorPosition(this.clientBox,svgBox);
        layoutDebug.addTextDebug('editSvgText: ctor '+this.id);
    }

    setEditorPosition(clientBox,svgBox) {
        var box = svgHelpers.pointBox(this.layout.pageWidth, this.layout.pageHeight);
        svgHelpers.svgViewport(this.svg, box.x, box.y,this.layout.svgScale);

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
             this.setEditorPosition(this.clientBox,svgBox);
           }
        }
        if (!this.editText.textContent) {
           this.editText.textContent='\xa0';
        }
    }

    startSessionPromise() {
        var self=this;
        $('body').addClass('text-edit');

        this.editing=true;
        this.running = true;
        layoutDebug.addTextDebug('editSvgText: create startSessionPromise '+this.id);
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self._updateText();
                    if (self.editing) {
                      editTimer();
                    } else {
                      self._updateText();
                      layoutDebug.addTextDebug('editSvgText: resolve session promise '+self.id);
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
		this.bound = false;
        this.state=editLyricSession.states.stopped;
        layoutDebug.addTextDebug('editLyricSession: create note '+this.selection.note.attrs.id);
    }

    detach() {
        layoutDebug.addTextDebug('editLyricSession: detach() from '+this.selection.note.attrs.id);
        this.state = editLyricSession.states.stopping;
        this.editor.endSession();
        this.lyric.text = this.editor.value;
		window.removeEventListener("keydown", this.keydownHandler, true);
        if (this.selection) {
            this.selection.measure.changed=true;
        }
    }

    detachPromise() {
        var self=this;
        layoutDebug.addTextDebug('editLyricSession:create detach promise from '+this.selection.note.attrs.id);
        return new Promise((resolve) => {
            var waiter = () => {
            setTimeout(() => {
                if (self.state == editLyricSession.states.stopping ||
                 self.state == editLyricSession.states.stopped) {
                     layoutDebug.addTextDebug('editLyricSession:resolve detach promise from '+self.selection.note.attrs.id);
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
        this.editor = new editSvgText({target:this.textElement,layout:this.tracker.layout,fontInfo:this.fontInfo});
        this.state = editLyricSession.states.started;
        var self = this;
        function handleSkip() {
            layoutDebug.addTextDebug('editLyricSession:startSession promise rcvd, editor is done, handleSkip for  '+self.selection.note.attrs.id);
            // Only skip to the next lyric if the session is still going on.
            if (self.state != editLyricSession.states.stopped && self.state != editLyricSession.states.stopping) {
                self._handleSkip();
            }
        }

        this.editor.startSessionPromise().then(handleSkip);
    }

    // Start the editing session by creating editor, and wait for the editor to create the DOM element.
	_editingSession() {
        var self = this;
		if (!this.bound) {
			this.bindEvents();
		}
        function editCurrent() {
            layoutDebug.addTextDebug('editLyricSession:_lyricAddedPromise promise rcvd, _editCurrentLyric for  '+self.selection.note.attrs.id);
            self._editCurrentLyric();
        }
        this._lyricAddedPromise().then(editCurrent);
	}

    _getOrCreateLyric(note) {
        var lyrics =  note.getLyricForVerse(this.verse);
        if (!lyrics.length) {
			this.lyric = new SmoLyric({text:'\xa0',verse:this.verse});
        } else {
			this.lyric = lyrics[0];
		}
    }

    _handleSkip() {
        // var tag = this.state == editLyricSession.states.minus ? '-' :'';
        this.lyric.text = this.editor.value;
        this.selection.measure.changed = true;
        if (this.state != editLyricSession.states.stopping) {
			var func = (this.state == editLyricSession.states.backSpace) ? 'lastNoteSelection' : 'nextNoteSelection';
            var sel = SmoSelection[func](
		      this.tracker.layout.score, this.selection.selector.staff,
              this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
            if (sel) {
                layoutDebug.addTextDebug('editLyricSession:_handleSkip,  moving on to '+sel.note.attrs.id);
                this.selection=sel;
                this._getOrCreateLyric(this.selection.note);
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
        return this.detachPromise();
    }

    nextWord() {
        this.state = editLyricSession.states.space;
        this._handleSkip();
    }

    previousWord() {
        this.state = editLyricSession.states.backSpace;
        this._handleSkip();
    }

	handleKeydown(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");

		if (['Space', 'Minus'].indexOf(event.code) >= 0) {
			this.state =  (event.key == '-') ? editLyricSession.states.minus :  editLyricSession.states.space;
			this.state = (this.state === editLyricSession.states.space && event.shiftKey)
			     ? editLyricSession.states.backSpace :  this.state;
            layoutDebug.addTextDebug('editLyricSession:  handleKeydown skip key for  '+this.selection.note.attrs.id);
            this.editor.endSession();
            return;
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
