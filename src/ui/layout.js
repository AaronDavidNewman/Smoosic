
// ## smrfSimpleLayout
// ## Description: 
// A layout maps the measures and notes to a spot on the page.  Simple layout
// maps the music linearly in a single line, like a lead sheet.
class smrfSimpleLayout {
	constructor(params) {
		Vex.Merge(this,smrfSimpleLayout.defaults);
		Vex.Merge(this, params);
		$(this.elementId).html('');
		this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
		this.renderer.resize(this.pageWidth, this.pageHeight);
		this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
		this.vxStaff=new VxSystemStaff(this.context,{smoMeasures:this.score});
	}
	static createScoreLayout(renderElement,score,layoutParams) {
		var ctorObj = {elementId:renderElement,score:score};
		if (layoutParams) {
			Vex.Merge(ctorObj,layoutParams);
		}
		var layout = new smrfSimpleLayout(ctorObj);
		layout.bind(score);
		return layout;
	}	
	static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
			clefWidth: 70,
            staffWidth: 250,
			totalWidth:250,
			leftMargin: 15,
			topMargin:15,
			pageWidth:8*96+48,
			pageHeight:11*96,
			font:{typeface:"Arial",pointSize:10,fillStyle:'#eed'}
        };
    }
	get context() {
		return this.renderer.getContext();
	}
	get renderElement() {
		return this.renderer.elementId;
	}
	render() {
		this.layout();
		this.vxStaff.render();
	}
	unrender() {
		this.vxStaff.unrender();
	}
	
	bind(measureSource) {
		this.measureSource=measureSource;
	}
	get width() {
		
	}
	
	layout() {
		var start = this.staffX;
		for (var i=0;i<this.measureSource.measures.length;++i) {
			var measure = this.measureSource.measures[i];
			measure.forceClef = (i==0);			
			measure.staffX= start;
			measure.staffWidth=measure.forceClef ? this.clefWidth+this.staffWidth : this.staffWidth;
			measure.noteWidth=this.staffWidth;
			start += measure.staffWidth;
		}
	}
}