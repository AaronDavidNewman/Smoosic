
class SmoNoteModifierBase {
	constructor(ctor) {
        this.attrs = {
            id: VF.Element.newID(),
            type: ctor
        };
		this.ctor = ctor;
	}
	static deserialize(jsonObj) {
		var ctor = eval(jsonObj.ctor);
		var rv = new ctor(jsonObj);
		rv.attrs.id = jsonObj.attrs.id;
		rv.attrs.type = jsonObj.attrs.type;
		return rv;
	}
}

class SmoGraceNote extends SmoNoteModifierBase {
    static get defaults() {
        return {
            flagState:SmoGraceNote.flagStates.auto,
            noteType: 'n',
            beamBeats:4096,
            endBeam:false,
            clef:'treble',
            slash:false,

            ticks: {
                numerator: 4096,
                denominator: 1,
                remainder: 0
            },
            pitches: [{
                    letter: 'b',
                    octave: 4,
                    accidental: ''
                }
            ],
        }
    }
    // TODO: Matches SmoNote - move to smoMusic?
    static get flagStates() {
        return {auto:0,up:1,down:2};
    }
    static get parameterArray() {
        return ['ticks', 'pitches', 'noteType', 'attrs', 'clef', 'endBeam','beamBeats','flagState','slash'];
    }
    tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    toVexGraceNote() {
        var p = smoMusic.smoPitchesToVex(this.pitches);
        var rv = {duration:smoMusic.closestVexDuration(this.tickCount()),keys:p};
        return rv;
    }

    constructor(parameters) {
        super('SmoGraceNote');
    	smoMusic.serializedMerge(SmoGraceNote.parameterArray,SmoGraceNote.defaults,this);
		smoMusic.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
    }

}

class SmoMicrotone extends SmoNoteModifierBase {
    static get smoToVex() {
        return {
            flat75sz:'db',
            flat25sz:'d',
            flat25ar:'bs',
            flat125ar:'afhf',
            sharp75:'++',
            sharp125:'ashs',
            sharp25:'+',
            sori:'o',
            koron:'k'
        }
    }

    static get pitchCoeff() {
        return {
        flat75sz:-0.75,
        flat25sz:-0.25,
        flat25ar:-0.25,
        flat125ar:-1.25,
        sharp75:0.75,
        sharp125:1.25,
        sharp25:0.25,
        sori:0.25,
        koron:-0.25
        };
    }

    get toVex() {
        return SmoMicrotone.smoToVex[this.tone];
    }
    static get defaults() {
        return {
            tone:'flat25sz',
            pitch:0
        };
    }
    static get attrArray() {
		return ['tone', 'pitch'];
	}

    constructor(parameters) {
        super('SmoMicrotone');
        smoMusic.serializedMerge(SmoMicrotone.attrArray,SmoMicrotone.defaults,this);
        smoMusic.serializedMerge(SmoMicrotone.attrArray, parameters, this);
    }
}
class SmoOrnament extends SmoNoteModifierBase {
    static get ornaments() {
		return {
			mordent: 'mordent',
			mordentInverted: 'mordent_inverted',
			turn: 'turn',
			turnInverted: 'turn_inverted',
			trill: 'tr',
			upprail: 'upprail',
			prailup: 'prailup',
			praildown: 'praildown',
            upmordent:'upmordent',
            downmordent:'downmordent',
            lineprail:'linepraile',
            prailprail:'prailprail'
		};
	}
    static get attrArray() {
		return ['position', 'offset','ornament'];
	}

    static get positions() {
		return {
			above: 'above',
			below: 'below'
		};
	}
    static get offsets() {
		return {
			on: 'on',
			after: 'after'
		};
	}
    static get defaults() {
        return {
            ornament:SmoOrnament.ornaments.mordent,
            position:SmoOrnament.positions.above,
            offset:SmoOrnament.offsets.on
        };
    }

    constructor(parameters) {
		super('SmoOrnament');
		smoMusic.serializedMerge(SmoOrnament.attrArray,SmoOrnament.defaults,this);
		smoMusic.serializedMerge(SmoOrnament.attrArray, parameters, this);
		this.selector = parameters.selector;
	}
}
class SmoArticulation extends SmoNoteModifierBase {
	static get articulations() {
		return {
			accent: 'accent',
			staccato: 'staccato',
			marcato: 'marcato',
			tenuto: 'tenuto',
			upStroke: 'upStroke',
			downStroke: 'downStroke',
			pizzicato: 'pizzicato',
			fermata: 'fermata'
		};
	}
	static get positions() {
		return {
			above: 'above',
			below: 'below'
		};
	}
	static get articulationToVex() {
		return {
			accent: 'a>',
			staccato: 'a.',
			marcato: 'a^',
			tenuto: 'a-',
			upStroke: 'a|',
			downStroke: 'am',
			pizzicato: 'ao',
			fermata: 'a@a'
		};
	}

	static get vexToArticulation() {
		return {
			"a>": "accent",
			"a.": "staccato",
			"a^": "marcato",
			"a-": "tenuto",
			"a|": "upStroke",
			"am": "downStroke",
			"ao": "pizzicato",
			'a@a': "fermata"
		};
	}
	static get attrArray() {
		return ['position', 'articulation'];
	}

	static get positionToVex() {
		return {
			'above': 3,
			'below': 4
		};
	}
	static get defaults() {
		return {
			position: SmoArticulation.positions.above,
			articulation: SmoArticulation.articulations.accent
		};

	}
	constructor(parameters) {
		super('SmoArticulation');
		smoMusic.serializedMerge(SmoArticulation.attrArray,SmoArticulation.defaults,this);
		smoMusic.serializedMerge(SmoArticulation.attrArray, parameters, this);
		this.selector = parameters.selector;
	}
	get id() {
		return this.attrs.id;
	}
	set id(ignore) {}
	get type() {
		return this.attrs.type;
	}
	set type(ignore) {}
}

class SmoLyric extends SmoNoteModifierBase {
	static get defaults() {
		return {
            text:'',
            endChar:'',
            verse:0,
			fontInfo: {
				size: 10,
				family: 'times',
				style: 'normal',
				weight: 'normal'
			},
            fill:'black',
			rotate:0,
			classes:'score-text',
			scaleX:1.0,
			scaleY:1.0,
			translateX:0,
			translateY:0,
		};
	}

    static get attributes() {
        return ['text','endChar','fontInfo','classes','verse',
		    'fill','scaleX','scaleY','translateX','translateY'];
    }

    constructor(parameters) {
		super('SmoLyric');
		smoMusic.serializedMerge(SmoLyric.attributes, SmoLyric.defaults,this);
		smoMusic.serializedMerge(SmoLyric.attributes, parameters, this);

        // calculated adjustments for alignment purposes
		this.adjY=0;
        this.adjX = 0;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoLyric'
			};
		} else {
		}
	}
}

// ## SmoDynamicText
// ## Description:
// standard dynamics text
class SmoDynamicText extends SmoNoteModifierBase {
	static get defaults() {
		return {
			xOffset: 0,
			fontSize: 38,
			yOffsetLine: 11,
			yOffsetPixels: 0,
			text: SmoDynamicText.dynamics.MP,
		};
	}

	static get dynamics() {
		// matches VF.modifier
		return {
			PP: 'pp',
			P: 'p',
			MP: 'mp',
			MF: 'mf',
			F: 'f',
			FF: 'ff',
			SFZ: 'sfz'
		};
	}

	constructor(parameters) {
		super('SmoDynamicText');
		Vex.Merge(this, SmoDynamicText.defaults);
		smoMusic.filteredMerge(SmoDynamicText.attrArray, parameters, this);
		this.selector = parameters.selector;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoDynamicText'
			};
		} else {
		}
	}
	get id() {
		return this.attrs.id;
	}
	set id(ignore) {}
	get type() {
		return this.attrs.type;
	}
	set type(ignore) {}
	static get attrArray() {
		return ['xOffset', 'fontSize', 'yOffsetLine', 'yOffsetPixels', 'text'];
	}
	backupOriginal() {
		if (!this['original']) {
			this.original = {};
			smoMusic.filteredMerge(
				SmoDynamicText.attrArray,
				this, this.original);
		}
	}
	restoreOriginal() {
		if (this['original']) {
			smoMusic.filteredMerge(
				SmoDynamicText.attrArray,
				this.original, this);
			this.original = null;
		}
	}
}
