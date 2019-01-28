// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4'

class VxSystemStaff {
	constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxSystemStaff.defaults);
        Vex.Merge(this, options);
        this.smoMeasures = new SmoSystemStaff(options);
    }
	static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            staffWidth: 1600,
			vxMeasures:[]
        };
    }
	
	 render() {
		 
		 var i=0;
		 this.vxMeasures=[];
		 for (i=0;i<this.smoMeasure.length;++i) {
			 var smoMeasure = this.smoMeasure[i];
			 var vxMeasure = new vxMeasure(this.context);
			 
		 }
	 }
}