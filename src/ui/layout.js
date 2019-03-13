
class smrfSimpleLayout {
	constructor(params) {
		Vex.Merge(this,smrfSimpleLayout.defaults);
		Vex.Merge(this, params);
		this.attrs = {
			id: VF.Element.newID(),
			type: 'testLayout'
		};
	}
	static get defaults() {
        var noteDefault = SmoMeasure.defaultVoice44;
        return {
            staffX: 10,
            staffY: 40,
			clefWidth: 70,
            staffWidth: 250,
			totalWidth:250,
			pageWidth:8*96+48,
			pageHeight:11*96
        };
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