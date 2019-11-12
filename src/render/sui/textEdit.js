


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

        $('.textEdit').addClass('hide')
    }
    
    get value() {
        return this._value;
    }
    
    _updateText() {
        if (this.editText.textContent && 
        (this.editText.textContent.length>1 || this.editText.textContent[0] != '_') &&
        this._value != this.editText.textContent) {
          this.editText.textContent = this.editText.textContent.replace('_','');
          this.target.textContent = this._value = this.editText.textContent;
          this._value = this.target.textContent;
          var fontAttr = svgHelpers.fontIntoToSvgAttributes(this.fontInfo);
          var svgBox = svgHelpers.getTextBox(this.svg,this.attrAr,null,this._value);
          var nbox = svgHelpers.logicalToClient(this.svg,svgBox);
           if (nbox.width > this.clientBox.width) {
             this.clientBox.width = nbox.width + nbox.width*.1;
             this.clientBox.height = nbox.height;
             this.setEditorPosition(this.clientBox,svgBox);
           }
        }  
        if (!this.editText.textContent && this._value) {
          this.editText.textContent='_';
        }
    }
    
    startSessionPromise() {
        var self=this;
        this.editing=true;
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self._updateText();
                    if (self.editing) {
                      editTimer();
                    } else {
                      resolve();
                    }
                },250);
                
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
	
	// tracker, selection, controller
    constructor(parameters) {
        this.tracker = parameters.tracker;
        this.selection = parameters.selection;
        this.controller = parameters.controller;
		this.bound = false;
    }
    
    detach() {
		window.removeEventListener("keydown", this.keydownHandler, true);
		var self=this;
		function rebind() {
			self.controller.bindEvents();
		}
		this.tracker.layout.render().then(rebind);
    }
	
	_editingSession() {
		if (!this.bound) {
			this.bindEvents();
		}
		// TODO: get the ID from the class
		this.textElement = $(this.tracker.layout.svg).find('#'+this.selection.note.renderId).find('g.vf-lyric text')[0];
		this.editor = new editSvgText({target:this.textElement,layout:this.tracker.layout,fontInfo:this.fontInfo});
	}
    
    editNote() {
		var self=this;
		function _startEditing() {
			self._editingSession();
		}
		var lyrics = this.selection.note.getModifiers('SmoLyric');
        if (!lyrics.length) {
			this.lyric = new SmoLyric({text:'_'});
        } else {
			this.lyric = lyrics[0];
		}
		this.fontInfo = JSON.parse(JSON.stringify(this.lyric.fontInfo));
        this.selection.note.addLyric(this.lyric);
		this.tracker.layout.render().then(_startEditing);        
    }
	
	handleKeydown(event) {
		console.log("Lyric KeyboardEvent: key='" + event.key + "' | code='" +
			event.code + "'"
			 + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
		if (['Space', 'Minus'].indexOf(event.code) >= 0) {
			if (this.editor) {
				this.lyric.text = this.editor.editText.textContent;
				this.editor.endSession();				
			}
			
			this.lyric.text = event.key == '-' ? this.lyric.text + '-' : this.lyric.text ;
			var sel = SmoSelection.nextNoteSelection(
			  this.tracker.layout.score, this.selection.selector.staff, 
			  this.selection.selector.measure, this.selection.selector.voice, this.selection.selector.tick);
			if (!sel) {
				this.detach();
				return;
			} else {
				this.selection = sel;
				this.editNote();
			}
		}
		
		if (event.code == 'Escape') {
			this.detach();
		}

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