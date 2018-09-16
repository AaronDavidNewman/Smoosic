
class VxSystemStaff {
	constructor(params) {
		this.measures=[];
		VF.Merge(this,VxSystemStaff.defaults);
		VF.Merge(this,params);
	}
	static get defaults() {
		return {
            staffX: 10,
            staffY: 40,
            staffWidth: 400
        };
	}
	
	_numberMeasures() {
		for (var i=0;i<this.measures.length;++i) {
			var measure=this.measures[i];
			measure.setMeasureNumber(i+1);
		}
	}
	addMeasure(index,measure) {
		if (index === 0 && this.measures.length) {
			measure.setNumber(this.measures[0].measureNumber);
		}
		if (index>=this.measures.length) {
			this.measures.push(measure);
		} else {
			this.measures.splice(index,0,measure);
		}
	}
}