
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
		return ['first','every','even','odd','title']
	}
	static get positions() {
		return ['title','copyright','footer','header','system','custom'];
	}
    static get defaults() {
        return {
            box: {x:15,y:15,width:100,height:75},
            text: 'Smo',
			pagination:'every',
			position:'custom'
        };
    }

    static get attributes() {
        return ['box', 'text','pagination','position'];
    }

    constructor(parameters) {
        super('SmoBarline');
        parameters = parameters ? parameters : {};
        smoMusic.serializedMerge(['position', 'barline'], SmoBarline.defaults, this);
        smoMusic.serializedMerge(['position', 'barline'], parameters, this);       
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
	

