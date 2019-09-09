
class SmoMeasureModifierBase {
	 constructor(ctor) {
        this.ctor = ctor;
    }
    static deserialize(jsonObj) {
        var ctor = eval(jsonObj.ctor);
        var rv = new ctor(jsonObj);
        rv.attrs.id = jsonObj.attrs.id;
        rv.attrs.type = jsonObj.attrs.type;
    }
}

class SmoBarline extends SmoMeasureModifierBase{
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
	
	static get attributes() {
		return ['position','barline'];
	}

	constructor(parameters) {
		super('SmoBarline');
		parameters = parameters ? parameters : {};
		smoMusic.serializedMerge(['position', 'barline'], SmoBarline.defaults, this);
		smoMusic.serializedMerge(['position', 'barline'], parameters, this);
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoArticulation'
            };
        } else {
            console.log('inherit attrs');
        }
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

class SmoRepeatSymbol  extends SmoMeasureModifierBase{
	static get symbols() {
		return {None:0,Coda:1,Segno:2,Dc:3,DcAlCoda:4,DcAlFine:5,Ds:6,DsAlCoda:7,DsAlFine:8,Fine:9};
	}
	static get positions() {
		return {
			start: 0,
			end: 1
		}
	};
	static get defaults() {
		return {
			symbol:SmoRepeatSymbol.Coda,xOffset:0,yOffset:30,position:SmoRepeatSymbol.positions.end
		}
	}
	static get toVexSymbol() {
		return [VF.Repetition.type.NONE,VF.Repetition.type.CODA_LEFT,VF.Repetition.type.SEGNO_LEFT,VF.Repetition.type.DC,
		VF.Repetition.type.DC_AL_CODA,VF.Repetition.type.DC_AL_FINE,VF.Repetition.type.DS,VF.Repetition.type.DS_AL_CODA,VF.Repetition.type.DS_AL_FINE,VF.Repetition.type.FINE];
	}
	static get attributes() {
		return ['symbol','xOffset','yOffset','position'];
	}
	toVexSymbol() {
		return SmoRepeatSymbol.toVexSymbol[this.symbol];
	}
	constructor(parameters) {
		super('SmoRepeatSymbol');
		smoMusic.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
		smoMusic.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
	}
}

class SmoVolta extends SmoMeasureModifierBase {
	constructor(parameters) {
		this.startBar=parameters.startBar;
		this.endBar = parameters.endBar;
	}
}
