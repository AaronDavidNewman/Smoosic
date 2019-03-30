// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
    constructor(context,topY) {
        this.context = context;
        this.leftConnector = [null, null];
        this.maxStaffIndex = -1;
        this.maxSystemIndex = -1;
		this.width=-1;
		this.endcaps=[];
		this.box={x:-1,y:-1,width:0,height:0};
		this.currentY=0;
		this.topY=topY;
		this.clefWidth=70;
		this.ys = [];
    }
	
	
    _adjustBox(box) {
		this.box.x = (this.box.x<0 ? box.x: this.box.x);
		this.box.y = (this.box.y<0 ? box.y: this.box.y);
		var width = box.width+box.x - this.box.x;
		var height = box.height+box.y - this.box.y;
		this.box.width = (this.box.width < width) ? width : this.box.width;
		this.box.height = (this.box.height < height) ? height : this.box.height;				
	}
    renderMeasure(staffIndex, smoMeasure) {
		var systemIndex = smoMeasure.measureNumber.systemIndex;
		
        var vxMeasure = new VxMeasure(this.context, {
                smoMeasure: smoMeasure
            });

        vxMeasure.render();
		
		// Keep track of the y coordinate for the nth staff
		if (this.ys.length <= systemIndex) {
			this.ys.push(vxMeasure.renderedSize.y + vxMeasure.renderedSize.height);
		}		
		this.currentY = this.ys[systemIndex];
		
		// keep track of left-hand side for system connectors
        if (systemIndex === 0) {
            if (staffIndex === 0) {
                this.leftConnector[0] = vxMeasure.stave;
            } else if (staffIndex > this.maxStaffIndex) {
                this.maxStaffIndex = staffIndex;
                this.leftConnector[1] = vxMeasure.stave;
            }
        }
		else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
			this.endcaps=[];
			this.endcaps.push(vxMeasure.stave);
			this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
		} 
		else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
			this.endcaps.push(vxMeasure.stave);
		}
		this._adjustBox(vxMeasure.renderedSize);
    }
	
	cap() {
		
		if (this.leftConnector[0] && this.leftConnector[1]) {
			new VF.StaveConnector(this.leftConnector[0] , this.leftConnector[1]).
            setType(VF.StaveConnector.type.SINGLE_LEFT).
            setContext(this.context).draw();
		}
	}
}