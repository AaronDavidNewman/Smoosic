
class SmoBarline {
	static get positions() {
		return {
			start: 0,
			end: 1
		}
	};

	static get barlines() {
		return {
			singleBar: 0,
			doubleBar: 1,
			endBar: 2,
			startRepeat: 3,
			endRepeat: 4,
			none: 5
		}
	}

	static get defaults() {
		return {
			position: SmoBarline.positions.end,
			barline: SmoBarline.barlines.singleBar
		};
	}

	constructor(parameters) {
		parameters = parameters ? parameters : {};
		smoMusic.serializedMerge(['position', 'barline'], defaults, this);
		smoMusic.serializedMerge(['position', 'barline'], parameters, this);
	}

	static get toVexBarline() {
		return [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
			VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];

	}
	static get toVexPosition() {
		return [VF.StaveModifier.BEGIN,VF.StaveModifier.END];
	}
	
	toVexBarline() {
		return SmoBarline.barlines[this.barline];
	}
	toVexPosition() {
		return SmoBarline.positions[this.position];
	}

}
