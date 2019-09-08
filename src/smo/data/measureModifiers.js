
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
		smoMusic.serializedMerge(['position', 'barline'], SmoBarline.defaults, this);
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
		return SmoBarline.toVexBarline[this.barline];
	}
	toVexPosition() {
		return SmoBarline.toVexPosition[this.position];
	}
}

class SmoRepeatSymbol {
	static get symbols() {
		return {None:0,Coda:1,Segno:2,Dc:3,DcAlCoda:4,DcAlFine:5,Ds:6,DsAlCoda:7,DsAlFine:8,Fine:9};
	}
	static get defaults() {
		return {
			symbol:SmoRepeatSymbol.Coda,xOffset:-25,yOffset:5
		}
	}
	static get SmoToVexSymbol() {
		return [VF.Repetition.NONE,VF.Repetition.CODA_LEFT,VF.Repetition.SEGNO_LEFT,VF.Repetition.DC,
		VF.Repetition.DC_AL_CODA,VF.Repetition.DC_AL_FINE,VF.Repetition.DS,VF.Repetition.DS_AL_CODA,VF.Repetition.DS_AL_FINE,VF.Repetition.FINE];
	}
}
