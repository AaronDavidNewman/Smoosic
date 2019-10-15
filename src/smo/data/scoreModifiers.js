
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
    static get defaults() {
        return {
            x:15,
			y:15,
            text: 'Smoosic',
			fontInfo: {
				size: '12px',
				family:'serif',
				style:'normal',
				fill:'black',
				weight:'normal'
			},
			styleString:'',
			classes:'',
				
			pagination:'every',
			position:'title'
        };
    }
	
	toStyleString() {
		
	}

	serialize() {
		var params = JSON.parse(JSON.stringify(this));
        params.ctor = 'SmoScoreText';
        return params;    
	}
    static get attributes() {
        return ['x','y','text','pagination','position','fontInfo','classes','styleString'];
    }

    constructor(parameters) {
        super('SmoScoreText');
        parameters = parameters ? parameters : {};
		
		smoMusic.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
        smoMusic.serializedMerge(SmoScoreText.attributes, parameters, this);   
    }  
}
	

