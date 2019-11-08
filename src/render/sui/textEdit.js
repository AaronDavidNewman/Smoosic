


class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
        this.layout = params.layout;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
        editSvgText.textAttrs.forEach((attr) => {
            this.editText.setAttributeNS('',attr,this.target.attributes[attr].value);
        });
        // this.editText.setAttributeNS('','class',this.target.class);
        this.editText.textContent=this.target.textContent;
        var clientBox = svgHelpers.smoBox(this.target.getBoundingClientRect());
        var svgBox = svgHelpers.smoBox(this.target.getBBox());
        this.editText.setAttributeNS('','y',svgBox.height);
        svgHelpers.svgViewport(this.svg, svgBox.width*2, svgBox.height+10, this.layout.svgScale);
        $('.draganime').html('');
        this.svg.appendChild(this.editText);
        $('.draganime').append(this.svg);
        $('.draganime').removeClass('hide').addClass('editText').attr('contentEditable','true');
        this.editing=true;
        $('.draganime').css('top',clientBox.y).css('left',clientBox.x);
        $(this.svg).attr('width',clientBox.width).attr('height',clientBox.height);        
    }
    
    endSession() {
        this.editing = false;
        $('.draganime').addClass('hide');
    }
    
    get value() {
        return this.editText.textContent;
    }
    
    startSessionPromise() {
        var self=this;
        const promise = new Promise((resolve, reject) => {
            function editTimer() {
                setTimeout(function() {
                    self.target.textContent = self.editText.textContent;
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