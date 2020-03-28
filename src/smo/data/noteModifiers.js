
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
        return ['ticks', 'pitches', 'noteType', 'clef', 'endBeam','beamBeats','flagState','slash','ctor'];
    }
    tickCount() {
        return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
    }

    toVexGraceNote() {
        var p = smoMusic.smoPitchesToVex(this.pitches);
        var rv = {duration:smoMusic.closestVexDuration(this.tickCount()),keys:p};
        return rv;
    }

    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoGraceNote.defaults,
           SmoGraceNote.parameterArray,this,params);
        return params;
    }

    constructor(parameters) {
        super('SmoGraceNote');
    	smoSerialize.serializedMerge(SmoGraceNote.parameterArray,SmoGraceNote.defaults,this);
		smoSerialize.serializedMerge(SmoGraceNote.parameterArray, parameters, this);
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
        flat75sz:-1.5,
        flat25sz:-0.5,
        flat25ar:-0.5,
        flat125ar:-2.5,
        sharp75:1.5,
        sharp125:2.5,
        sharp25:0.5,
        sori:0.5,
        koron:-0.5
        };
    }

    get toPitchCoeff() {
        return SmoMicrotone.pitchCoeff[this.tone];
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
    static get parameterArray() {
		return ['tone', 'pitch','ctor'];
	}
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoMicrotone.defaults,
           SmoMicrotone.parameterArray,this,params);
        return params;
    }
    constructor(parameters) {
        super('SmoMicrotone');
        smoSerialize.serializedMerge(SmoMicrotone.parameterArray,SmoMicrotone.defaults,this);
        smoSerialize.serializedMerge(SmoMicrotone.parameterArray, parameters, this);
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
    static get parameterArray() {
		return ['position', 'offset','ornament','ctor'];
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
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoOrnament.defaults,
           SmoOrnament.parameterArray,this,params);
        return params;
    }
    constructor(parameters) {
		super('SmoOrnament');
		smoSerialize.serializedMerge(SmoOrnament.parameterArray,SmoOrnament.defaults,this);
		smoSerialize.serializedMerge(SmoOrnament.parameterArray, parameters, this);
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
	static get parameterArray() {
		return ['position', 'articulation','ctor'];
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
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoArticulation.defaults,
           SmoArticulation.parameterArray,this,params);
        return params;
    }
	constructor(parameters) {
		super('SmoArticulation');
		smoSerialize.serializedMerge(SmoArticulation.parameterArray,SmoArticulation.defaults,this);
		smoSerialize.serializedMerge(SmoArticulation.parameterArray, parameters, this);
		this.selector = parameters.selector;
        this.adjX = 0;
	}

}

class SmoLyric extends SmoNoteModifierBase {
	static get defaults() {
		return {
            text:'',
            endChar:'',
            verse:0,
			fontInfo: {
				size: 12,
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
    static get parsers() {
        return {lyric:0,anaylysis:1,chord:2}
    }

    static get parameterArray() {
        return ['text','endChar','fontInfo','classes','verse',
		    'fill','scaleX','scaleY','translateX','translateY','ctor'];
    }
    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoLyric.defaults,
           SmoLyric.parameterArray,this,params);
        return params;
    }

    updateText(text) {
        // TODO: handle different parsers
        text = text ? text: '';
        this.text = text.trim();
    }

    constructor(parameters) {
		super('SmoLyric');
		smoSerialize.serializedMerge(SmoLyric.parameterArray, SmoLyric.defaults,this);
		smoSerialize.serializedMerge(SmoLyric.parameterArray, parameters, this);

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

    serialize() {
        var params = {};
        smoSerialize.serializedMergeNonDefault(SmoDynamicText.defaults,
           SmoDynamicText.parameterArray,this,params);
        return params;
    }
	constructor(parameters) {
		super('SmoDynamicText');
		Vex.Merge(this, SmoDynamicText.defaults);
		smoSerialize.filteredMerge(SmoDynamicText.parameterArray, parameters, this);
		this.selector = parameters.selector;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoDynamicText'
			};
		} else {
		}
	}

	static get parameterArray() {
		return ['xOffset', 'fontSize', 'yOffsetLine', 'yOffsetPixels', 'text','ctor'];
	}
	backupOriginal() {
		if (!this['original']) {
			this.original = {};
			smoSerialize.filteredMerge(
				SmoDynamicText.parameterArray,
				this, this.original);
		}
	}
	restoreOriginal() {
		if (this['original']) {
			smoSerialize.filteredMerge(
				SmoDynamicText.parameterArray,
				this.original, this);
			this.original = null;
		}
	}
}
