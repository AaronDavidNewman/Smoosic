


class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
        this.layout = params.layout;
        this.fontInfo = params.fontInfo;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
        this.attrAr = [];
        editSvgText.textAttrs.forEach((attr) => {
            var val = this.target.attributes[attr].value;
            this.editText.setAttributeNS('',attr,val);
            this.attrAr.push(JSON.parse('{"'+attr+'":"'+val+'"}'));
        });
        this.oldFill = this.target.getAttributeNS(null,'fill');
        // this.editText.setAttributeNS('','class',this.target.class);
        this.editText.textContent=this.target.textContent;
        this._value = this.editText.textContent;
        this.clientBox = svgHelpers.smoBox(svgHelpers.smoBox(this.target.getBoundingClientRect()));
        var svgBox = svgHelpers.smoBox(this.target.getBBox());
        this.editText.setAttributeNS('','y',svgBox.height);        
        
        $('.draganime').html('');
        this.svg.appendChild(this.editText);
        $('.draganime').append(this.svg);
        $('.draganime').removeClass('hide').addClass('textEdit').attr('contentEditable','true');
        this.setEditorPosition(this.clientBox,svgBox);
    }
    
    setEditorPosition(clientBox,svgBox) {
        var box = svgHelpers.pointBox(this.layout.pageWidth, this.layout.pageHeight);
        svgHelpers.svgViewport(this.svg, box.x, box.y,this.layout.svgScale);
        
        $('.draganime').css('top',this.clientBox.y-5)
          .css('left',this.clientBox.x-5)
          .width(this.clientBox.width+10)
          .height(this.clientBox.height+10);
    }
    
    endSession() {
        this.editing = false;
        this.target.setAttributeNS(null,'fill',this.oldFill);

        $('.draganime').addClass('hide').removeClass('textEdit');
    }
    
    get value() {
        return this._value;
    }
    
    _updateText() {
        if (this.editText.textContent && this._value != this.editText.textContent) {
          this.target.textContent = this.editText.textContent;
          this._value = this.editText.textContent;
          var fontAttr = svgHelpers.fontIntoToSvgAttributes(this.fontInfo);
          var svgBox = svgHelpers.getTextBox(this.svg,this.attrAr,null,this._value);
          var nbox = svgHelpers.logicalToClient(this.svg,svgBox);
           if (nbox.width > this.clientBox.width) {
             this.clientBox.width = nbox.width;
             this.clientBox.height = nbox.height;
             this.setEditorPosition(this.clientBox,svgBox);
           }
        }  
        if (!this.editText.textContent && this._value) {
          this.editText.textContent=this._value.substr(0,1);
        }
    }
    
    startSessionPromise() {
        var self=this;
        this.editing=true;
        this.target.setAttributeNS(null,'fill','#fff');
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