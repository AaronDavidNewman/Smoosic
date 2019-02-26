
class testPaginator {
	constructor(params) {
		Vex.Merge(this, params);
		this.attrs = {
			id: VF.Element.newID(),
			type: 'testPaginator'
		};
	}
	bind(measureSource) {
		this.measureSource=measureSource;
	}
	layout() {
		for (var i=0;i<this.measureSource.measures;++i) {
			
		}
	}
}