
class SmoScoreModifierBase {
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

class SmoScoreText extends SmoScoreModifierBase {	

    static get paginations() {
		return ['every','even','odd','once']
	}
	static get positions() {
		return {title:'title',copyright:'copyright',footer:'footer',header:'header',custom:'custom'};
	}
	// If box model is 'none', the font and location determine the size.  
	// spacing and spacingGlyph fit the box into a container based on the svg policy
	static get boxModels() {
		return {none:'none',spacing:'spacing',spacingAndGlyphs:'spacingAndGlyphs',wrap:'wrap'};
	}
    static get defaults() {
        return {
            x:15,
			y:15,
			width:0,
			height:0,
            text: 'Smoosic',
			fontInfo: {
				size: '1em',
				family:'times',
				style:'normal',
				weight:'normal'
			},
			fill:'black',
			rotate:0,
			classes:'score-text',
			boxModel:'none',
			scaleX:1.0,
			scaleY:1.0,
			translateX:0,
			translateY:0,
			pagination:'every',
			position:'custom',
			autoLayout:false // set to true if one of the pre-canned positions are used.
        };
    }
	static toSvgAttributes(inst) {
		var rv=[];
		var fkeys = Object.keys(inst.fontInfo);
		fkeys.forEach((key) => {
			var n='{"font-'+key+'":"'+inst.fontInfo[key]+'"}';
			rv.push(JSON.parse(n));
		});
		var attrs = SmoScoreText.attributes.filter((x) => {return x != 'fontInfo' && x != 'boxModel'});
		rv.push({fill:inst.fill});
		rv.push({x:inst.x});
		rv.push({y:inst.y});
		if (inst.boxModel != 'none' && inst.width) {
			var len = ''+inst.width+'px';
			rv.push({textLength:len});
			// rv.push({lengthAdjust:inst.boxModel});
		}
		rv.push({transform:'translate ('+inst.translateX+' '+inst.translateY+') scale ('+
		    inst.scaleX+' '+inst.scaleY+')'});
		return rv;
	}
	
	toSvgAttributes() {
		return SmoScoreText.toSvgAttributes(this);
	}
	
	backupParams() {
		var rv={};
		smoMusic.serializedMerge(SmoScoreText.attributes, this, rv);
		return rv;
	}

	serialize() {
		var params = JSON.parse(JSON.stringify(this));
        params.ctor = 'SmoScoreText';
        return params;    
	}
    static get attributes() {
        return ['x','y','text','pagination','position','fontInfo','classes','boxModel','fill','width','height','scaleX','scaleY','translateX','translateY','autoLayout'];
    }
	// scale the text without moving it.
	scaleInPlace(factor) {		
		this.scaleX = this.scaleX*factor;
		this.scaleY = this.scaleY*factor;
		var deltax = this.x - this.x*this.scaleX;
		var deltay = this.y - this.y*this.scaleY;
		this.translateX = deltax;
		this.translateY = deltay;		
	}
    constructor(parameters) {
        super('SmoScoreText');
        parameters = parameters ? parameters : {};
		
		smoMusic.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
        smoMusic.serializedMerge(SmoScoreText.attributes, parameters, this);
		if (!this.classes) {
			this.classes='';
		}
		if (this.boxModel === SmoScoreText.boxModels.wrap) {
			this.width = parameters.width ? this.width : 200;
			this.height = parameters.height ? this.height : 150;
		}
		if (this.position != SmoScoreText.positions.custom && !parameters['autoLayout']) {
			this.autoLayout = true;
			if (this.position == SmoScoreText.positions.title) {
				this.fontInfo.size='1.8em';
			} else {
				this.fontInfo.size='.6em';
			}
		}
    }  
}
	

