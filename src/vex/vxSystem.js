// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystemStaff {
	constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxSystemStaff.defaults);
        Vex.Merge(this, options);
		if (!this.smoMeasures) {
			this.smoMeasures = new SmoSystemStaff();
		}
    }
	static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            staffWidth: 1600,
			smoMeasures:{},
			vxMeasures:[]
        };
    }
	
	applyTransform(actor) {
		SmoMeasureTransform.applyTransform(this.smoMeasures,[actor]);
	}
	
	unrender() {
		this.vxMeasures.forEach(function(measure) {
			measure.unrender();
		});
	}
	 render() {
		 
		 var i=0;
		 this.vxMeasures=[];
		 for (i=0;i<this.smoMeasures.measures.length;++i) {
			 var smoMeasure = this.smoMeasures.measures[i];
			 var vxMeasure = new VxMeasure(this.context,{smoMeasure:smoMeasure});
			 this.vxMeasures.push(vxMeasure);
			 vxMeasure.render();
		 }
	 }
}