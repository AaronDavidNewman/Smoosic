
class SmoNoteModifierBase {
	constructor(ctor) {
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
		Vex.Merge(this, SmoArticulation.defaults);
		smoMusic.filteredMerge(SmoArticulation.attrArray, parameters, this);
		this.selector = parameters.selector;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoArticulation'
			};
		} else {
			console.log('inherit attrs');
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
		this.adjY=0;

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoLyric'
			};
		} else {
			console.log('inherit attrs');
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
			console.log('inherit attrs');
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
