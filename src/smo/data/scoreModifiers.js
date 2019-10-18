
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
		return ['title','copyright','footer','header','system','custom'];
	}
	// If box model is 'none', the font and location determine the size.  
	// spacing and spacingGlyph fit the box into a container based on the svg policy
	static get boxModel() {
		return ['none','spacing','spacingAndGlyphs'];
	}
    static get defaults() {
        return {
            x:15,
			y:15,
			width:0,
			height:0,
            text: 'Smoosic',
			fontInfo: {
				size: '12px',
				family:'serif',
				style:'normal',
				weight:'normal'
			},
			fill:'black',
			rotate:0,
			classes:'',
			boxModel:'none',
			scaleX:1.0,
			scaleY:1.0,
			translateX:0,
			translateY:0,						
			pagination:'every',
			position:'title'
        };
    }
	
	toSvgAttributes() {
		var rv=[];
		var fkeys = Object.keys(this.fontInfo);
		fkeys.forEach((key) => {
			var n='{"font-'+key+'":"'+this.fontInfo[key]+'"}';
			rv.push(JSON.parse(n));
		});
		var attrs = SmoScoreText.attributes.filter((x) => {return x != 'fontInfo' && x != 'boxModel'});
		rv.push({fill:this.fill});
		rv.push({x:this.x});
		rv.push({y:this.y});
		if (this.boxModel != 'none' && this.width) {
			var len = ''+this.width+'px';
			rv.push({textLength:len});
			rv.push({lengthAdjust:this.boxModel});
		}
		rv.push({transform:'translate ('+this.translateX+' '+this.translateY+') scale ('+
		    this.scaleX+' '+this.scaleY+')'});
		return rv;
	}

	serialize() {
		var params = JSON.parse(JSON.stringify(this));
        params.ctor = 'SmoScoreText';
        return params;    
	}
    static get attributes() {
        return ['x','y','text','pagination','position','fontInfo','classes','boxModel','fill','width','height','scaleX','scaleY','translateX','translateY'];
    }
	scaleInPlace(factor) {
		this.scaleX = this.scaleX*factor;
		this.scaleY = this.scaleY*factor;
		// var translateX = this.logicalBox.x-this.logicalBox.x*factor;
		// var translateY = this.logicalBox.y-this.logicalBox.y*factor;
		this.x = this.logicalBox.x - this.logicalBox.width*(this.scaleX/2);
		// this.y = this.logicalBox.y - this.logicalBox.height*factor;
	}
    constructor(parameters) {
        super('SmoScoreText');
        parameters = parameters ? parameters : {};
		
		smoMusic.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
        smoMusic.serializedMerge(SmoScoreText.attributes, parameters, this);   
    }  
}
	

