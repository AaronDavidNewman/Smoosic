


class editSvgText {
    constructor(params) {
        this.target = params.target;
        var ns = svgHelpers.namespace;
		this.svg = document.createElementNS(ns, 'svg');
        this.editText = document.createElementNS(ns, 'text');
        editSvgText.attrs.forEach((attr) => {
            this.editText.setAttributeNS('',attr,this.target.attributes[attr].value);
        });
        this.editText.textContent=this.target.textContent;
    }
    static get attrs() {
        return [
        'x','y','font-size','font-family','font-weight','classes','fill','scaleX','scaleY'];
    }
    
    buildDom() {
        var b = svgHelpers.buildSvg;
        var r = b('g').classes(classes)
			.append(
				b('text').text(box.x + 20, box.y - 14+voffset, 'svg-debug-text', xtext))
    
		
    }
}