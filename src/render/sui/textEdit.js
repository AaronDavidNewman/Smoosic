


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
        this.target.setAttributeNS(null,'fill',this.oldFill);

        $('.textEdit').addClass('hide');        
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
        this.editing=true;
        this.running = true;
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self._updateText();
                    if (self.editing) {
                      editTimer();
                    } else {
                      self._updateText();                      
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
        this.verse=0;
		this.bound = false;
        this.state=editLyricSession.states.stopped;
    }
    
    detach() {
        $('body').removeClass('showAttributeDialog');
		window.removeEventListener("keydown", this.keydownHandler, true);
		var self=this;
		function rebind() {
			self.controller.bindEvents();
		}
        if (this.selection) {
            this.selection.measure.changed=true;
        }
		this.controller.bindEvents();
		this.controller.resizeEvent();
    }
	
	_editingSession() {       
		if (!this.bound) {
			this.bindEvents();
		}
		this.textElement = $(this.tracker.layout.svg).find('#'+this.selection.note.renderId).find('g.lyric-'+this.lyric.verse)[0];
		this.editor = new editSvgText({target:this.textElement,layout:this.tracker.layout,fontInfo:this.fontInfo});
        this.state = editLyricSession.states.started;
        var self = this;
        function handleSkip() {
            self._handleSkip();
        }

        this.editor.startSessionPromise().then(handleSkip);
	}
    
    _getOrCreateLyric(note) {
        var lyrics =  note.getModifiers('SmoLyric');
        if (!lyrics.length) {
			this.lyric = new SmoLyric({text:'\xa0'});
        } else {
			this.lyric = lyrics[0];
		}
    }
    
    _handleSkip() {
        var tag = this.state == editLyricSession.states.minus ? '-' :'';
        this.lyric.text = this.editor.value+tag;
        this.selection.measure.changed = true;
        if (this.state != editLyricSession.states.stopping) {
			var func = (this.state == editLyricSession.states.backSpace) ? 'lastNoteSelection' : 'nextNoteSelection';
            var sel = SmoSelection[func](
		      this.tracker.layout.score, this.selection.selector.staff, 
              this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
            if (sel) {
                this.selection=sel;
                this._getOrCreateLyric(this.selection.note);
                this.editNote();
            }
        } else {
            this.detach();
        }
        
    }
    editNote() {
		var self=this;
		function _startEditing() {
			self._editingSession();
		}
        $('body').addClass('showAttributeDialog');
        this._getOrCreateLyric(this.selection.note)
		this.fontInfo = JSON.parse(JSON.stringify(this.lyric.fontInfo));
        this.selection.note.addLyric(this.lyric);
        this.tracker.layout.render();
		_startEditing();
    }
	
	handleKeydown(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
       
		if (['Space', 'Minus'].indexOf(event.code) >= 0) {            
			this.state =  (event.key == '-') ? editLyricSession.states.minus :  editLyricSession.states.space;
			this.state = (this.state === editLyricSession.states.space && event.shiftKey) 
			     ? editLyricSession.states.backSpace :  this.state;
            this.editor.endSession();
		}
		
		if (event.code == 'Escape') {
            this.state = editLyricSession.states.stopping;
            this.editor.endSession();
		}
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