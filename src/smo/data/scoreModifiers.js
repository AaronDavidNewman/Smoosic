
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
            box: {x:15,y:15,width:100,height:75},
            text: 'Smo',
			pagination:'every',
			position:'once'
        };
    }

    static get attributes() {
        return ['box', 'text','pagination','position'];
    }

    constructor(parameters) {
        super('SmoBarline');
        parameters = parameters ? parameters : {};       
    }  
}
	

