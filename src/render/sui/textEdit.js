


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
            var val = this.target.attributes[attr].value;
            this.editText.setAttributeNS('',attr,val);
            this.attrAr.push(JSON.parse('{"'+attr+'":"'+val+'"}'));
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