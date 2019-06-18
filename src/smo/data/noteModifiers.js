
class SmoNoteModifierBase {
	constructor(ctor) {
		this.ctor=ctor;
	}	
	static deserialize(jsonObj) {
		var ctor = eval(jsonObj.ctor);
		var rv = new ctor(jsonObj);
		rv.attrs.id=jsonObj.attrs.id;
		rv.attrs.type=jsonObj.attrs.type;
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
            yOffsetLine:11,
			yOffsetPixels:0,
            text: SmoDynamicText.dynamics.MP,
        };
    }
	
	static get dynamics() {
        // matches VF.modifier
        return {
			PP:'pp',
			P:'p',
            MP: 'mp',
            MF: 'mf',
            F: 'f',
            FF: 'ff',
			SFZ:'sfz'
        };
    }
	
	constructor(parameters) {
		this.super('SmoDynamicText');
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