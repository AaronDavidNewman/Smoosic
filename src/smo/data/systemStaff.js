
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
            staffWidth: 400,
			startIndex:0,
			renumberingMap:{}
        };
	}
	
	_numberMeasures() {
		this.renumberIndex = this.startIndex;
		for (var i=0;i<this.measures.length;++i) {
			renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : renumberIndex;
			var localIndex = renumberIndex + i;
			numberObj = {
				measureNumber:localIndex,
				measureIndex:i+this.startIndex,
				systemIndex:i
			}
			var measure=this.measures[i];
			measure.setMeasureNumber(i+1);
		}
	}
	addMeasure(index,measure) {
		if (index === 0 && this.measures.length) {
			measure.setMeasureNumber(this.measures[0].measureNumber);
		}
		if (index>=this.measures.length) {
			this.measures.push(measure);
		} else {
			this.measures.splice(index,0,measure);
		}
		
		this._numberMeasures();
	}
}