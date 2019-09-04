
class SmoBarline {
	static get positions() {
		return {start:0,end:1}
	};
	
	static get barlines() {
		return {singleBar:0,doubleBar:1,endBar:2,startRepeat:3,endRepeat:4,none:5}
	}
	
	static get defaults() {
		return {position:SmoBarline.positions.end,barline:SmoBarline.barlines.single};
	}
	
	constructor(parameters) {
		parameters = parameters ? parameters : {};
		smoMusic.serializedMerge(['position','barline'],defaults,this);
		smoMusic.serializedMerge(['position','barline'],parameters,this);
	}
	
	toVexBarline() {
		if (this.position === SmoBarline.positions.end) {
			
		}
	}
	
}