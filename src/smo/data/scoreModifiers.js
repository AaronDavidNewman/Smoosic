
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
        return rv;
    }
}

// ## SmoScoreText
// Identify some text in the score, not associated with any musical element, like page 
// decorations, titles etc.
class SmoScoreText extends SmoScoreModifierBase {	

    static get paginations() {
		return {every:'every',even:'even',odd:'odd',once:'once'}
	}
	static get positions() {
		return {title:'title',copyright:'copyright',footer:'footer',header:'header',custom:'custom'};
	}
	static get justifications() {
		return {left:'left',right:'right',center:'center'};
	}
    static get fontFamilies() {
        return {serif:'serif',sansSerif:'sans-serif',monospace:'monospace',cursive:'cursive',
           times:'Times New Roman',arial:'Arial',helvitica:'Helvitica'};
        
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
				family:SmoScoreText.fontFamilies.times,
				style:'normal',
				weight:'normal'
			},
			fill:'black',
			rotate:0,
			justification:SmoScoreText.justifications.left,
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
	
	// ### backupParams
	// For animation or estimation, create a copy of the attributes that can be modified without affecting settings.
	backupParams() {
		this.backup={};
		smoMusic.serializedMerge(SmoScoreText.attributes, this, this.backup);
		return this.backup;
	}
    
    restoreParams() {
        smoMusic.serializedMerge(SmoScoreText.attributes, this.backup, this);
    }
    
	serialize() {
		var params = JSON.parse(JSON.stringify(this));
        params.ctor = 'SmoScoreText';
        return params;    
	}
    static get attributes() {
        return ['x','y','text','pagination','position','fontInfo','classes',
		    'boxModel','justification','fill','width','height','scaleX','scaleY','translateX','translateY','autoLayout'];
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
    scaleXInPlace(factor) {
		this.scaleX = factor;
		var deltax = this.x - this.x*this.scaleX;
		this.translateX = deltax;
    }
    scaleYInPlace(factor) {
		this.scaleY = factor;
		var deltay = this.y - this.y*this.scaleY;
		this.translateY = deltay;		
    }
    constructor(parameters) {
        super('SmoScoreText');
        parameters = parameters ? parameters : {};
        this.backup={};
        this.edited = false; // indicate to UI that the actual text has not been edited.
		
		smoMusic.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
        smoMusic.serializedMerge(SmoScoreText.attributes, parameters, this);
		if (!this.classes) {
			this.classes='';
		}
        if (this.classes.indexOf(this.attrs.id) < 0) {
            this.classes += ' '+this.attrs.id;
        }
		if (!parameters.pagination) {
			this.pagination = this.position==SmoScoreText.positions.custom || this.position==SmoScoreText.positions.title ? 
              SmoScoreText.paginations.every : 	SmoScoreText.paginations.once;
		}
		if (this.boxModel === SmoScoreText.boxModels.wrap) {
			this.width = parameters.width ? this.width : 200;
			this.height = parameters.height ? this.height : 150;
			if (!parameters.justification) {
				this.justification = this.position === SmoScoreText.positions.copyright 
						? SmoScoreText.justifications.right : SmoScoreText.justifications.center;

			}
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
	

