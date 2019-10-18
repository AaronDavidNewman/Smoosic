
// ## Measure modifiers are elements that are attached to the bar itself, like barlines or measure-specific text,
// repeats - lots of stuff
class SmoMeasureModifierBase {
    constructor(ctor) {
        this.ctor = ctor;
		 if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: ctor
            };
        } else {
            console.log('inherit attrs');
        }
    }
    static deserialize(jsonObj) {
        var ctor = eval(jsonObj.ctor);
        var rv = new ctor(jsonObj);
        rv.attrs.id = jsonObj.attrs.id;
        rv.attrs.type = jsonObj.attrs.type;
    }
}

class SmoBarline extends SmoMeasureModifierBase {
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
            noBar: 5
        }
    }
	
	static get _barlineToString() {
		return  ['singleBar','doubleBar','endBar','startRepeat','endRepeat','noBar'];		
	}
	static barlineString(inst) {
		return SmoBarline._barlineToString[inst.barline];
	}

    static get defaults() {
        return {
            position: SmoBarline.positions.end,
            barline: SmoBarline.barlines.singleBar
        };
    }

    static get attributes() {
        return ['position', 'barline'];
    }
	serialize() {
        var params = {};
        smoMusic.filteredMerge(SmoBarline.attributes, this, params);
        params.ctor = 'SmoBarline';
        return params;    
	}

    constructor(parameters) {
        super('SmoBarline');
        parameters = parameters ? parameters : {};
        smoMusic.serializedMerge(SmoBarline.attributes, SmoBarline.defaults, this);
        smoMusic.serializedMerge(SmoBarline.attributes, parameters, this);       
    }

    static get toVexBarline() {
        return [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
            VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];

    }
    static get toVexPosition() {
        return [VF.StaveModifier.BEGIN, VF.StaveModifier.END];
    }

    toVexBarline() {
        return SmoBarline.toVexBarline[this.barline];
    }
    toVexPosition() {
        return SmoBarline.toVexPosition[this.position];
    }
}

class SmoRepeatSymbol extends SmoMeasureModifierBase {
    static get symbols() {
        return {
            None: 0,
            Coda: 1,
            Segno: 2,
            Dc: 3,
			ToCoda:1,
            DcAlCoda: 4,
            DcAlFine: 5,
            Ds: 6,
            DsAlCoda: 7,
            DsAlFine: 8,
            Fine: 9
        };
    }
	
	static get defaultXOffset() {
		return [0,0,0,-20,-60,-60,-50,-60,-50,-40];
	}
    static get positions() {
        return {
            start: 0,
            end: 1
        }
    };
    static get defaults() {
        return {
            symbol: SmoRepeatSymbol.Coda,
            xOffset: 0,
            yOffset: 30,
            position: SmoRepeatSymbol.positions.end
        }
    }
    static get toVexSymbol() {
        return [VF.Repetition.type.NONE, VF.Repetition.type.CODA_LEFT, VF.Repetition.type.SEGNO_LEFT, VF.Repetition.type.DC,
            VF.Repetition.type.DC_AL_CODA, VF.Repetition.type.DC_AL_FINE, VF.Repetition.type.DS, VF.Repetition.type.DS_AL_CODA, VF.Repetition.type.DS_AL_FINE, VF.Repetition.type.FINE];
    }
    static get attributes() {
        return ['symbol', 'xOffset', 'yOffset', 'position'];
    }
    toVexSymbol() {
        return SmoRepeatSymbol.toVexSymbol[this.symbol];
    }
	serialize() {
        var params = {};
        smoMusic.filteredMerge(SmoRepeatSymbol.attributes, this, params);
        params.ctor = 'SmoRepeatSymbol';
        return params;    
	}
    constructor(parameters) {
        super('SmoRepeatSymbol');
        smoMusic.serializedMerge(SmoRepeatSymbol.attributes, SmoRepeatSymbol.defaults, this);
		this.xOffset = SmoRepeatSymbol.defaultXOffset[parameters.symbol];
        smoMusic.serializedMerge(SmoRepeatSymbol.attributes, parameters, this);
    }
}

class SmoVolta extends SmoMeasureModifierBase {
    constructor(parameters) {
        super('SmoVolta');
		this.original={};

		if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoVolta'
            };
        } else {
            console.log('inherit attrs');
        }
        smoMusic.serializedMerge(SmoVolta.attributes, SmoVolta.defaults, this);
		smoMusic.serializedMerge(SmoVolta.attributes, parameters, this);
    }
	get id() {
		return this.attrs.id;		
	}
	
	get type() {
		return this.attrs.type;
	}
    static get attributes() {
        return ['startBar', 'endBar', 'endingId','startSelector','endSelector','xOffsetStart', 'xOffsetEnd', 'yOffset', 'number'];
    }
	static get editableAttributes() {
		return ['xOffsetStart','xOffsetEnd','yOffset','number'];	
	}
	
	serialize() {
        var params = {};
        smoMusic.filteredMerge(SmoVolta.attributes, this, params);
        params.ctor = 'SmoVolta';
        return params;    
	}
	
    static get defaults() {
        return {
            startBar: 1,
            endBar: 1,
            xOffsetStart: 0,
            xOffsetEnd: 0,
            yOffset: 20,
            number: 1
        }
    }
	
	 backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoMusic.filteredMerge(
                SmoVolta.attributes,
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
                SmoVolta.attributes,
                this.original, this);
            this.original = null;
        }
    }
	
	toVexVolta(measureNumber) {
		if (this.startBar === measureNumber && this.startBar === this.endBar) {
			return VF.Volta.type.BEGIN_END;
		}
		if (this.startBar === measureNumber) {
			return VF.Volta.type.BEGIN;
		} 
		if (this.endBar === measureNumber) {
			return VF.Volta.type.END;
		}
		if (this.startBar < measureNumber && this.endBar > measureNumber) {
			return VF.Volta.type.MID;
		}
		return VF.Volta.type.NONE;
	}		
}

class SmoMeasureText extends SmoMeasureModifierBase {
	static get positions() {
		return {above:0,below:1,left:2,right:3};
	}
	
	static get justifications() {
		return {left:0,right:1,center:2}
	}
	
	static get _positionToString() {
		return ['above','below','left','right'];
	}
	
	static get toVexPosition() {
		return [VF.Modifier.Position.ABOVE,VF.Modifier.Position.BELOW,VF.Modifier.Position.LEFT,VF.Modifier.Position.RIGHT];
	}
	static get toVexJustification() {
		return [VF.TextNote.LEFT,VF.TextNote.RIGHT,VF.TextNote.CENTER];
	}
	
	toVexJustification() {
		return SmoMeasureText.toVexJustification[this.justification];
	}
	toVexPosition() {
		return SmoMeasureText.toVexPosition[this.position];
	}
	static get attributes() {
		return ['position','fontInfo','text','adjustX','adjustY','justification'];
	}
	
	static get defaults() {
		return {
			position:SmoMeasureText.positions.above,
			fontInfo: {
				size: '12px',
				family:'times',
				style:'normal',
				weight:'normal'
			},
			text:'Smo',
			adjustX:0,
			adjustY:0,
			justification:SmoMeasureText.justifications.center
		};
	}
	serialize() {
        var params = {};
        smoMusic.filteredMerge(SmoMeasureText.attributes, this, params);
        params.ctor = 'SmoMeasureText';
        return params;
	}
	
	constructor(parameters) {
		super('SmoMeasureText');
        parameters = parameters ? parameters : {};
        smoMusic.serializedMerge(SmoMeasureText.attributes, SmoMeasureText.defaults, this);
        smoMusic.serializedMerge(SmoMeasureText.attributes, parameters, this);
	}
}
