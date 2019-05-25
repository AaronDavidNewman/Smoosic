
// # This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.

// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
class SmoStaffHairpin {
    constructor(params) {
        Vex.Merge(this, SmoStaffHairpin.defaults);
        smoMusic.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
        this.startSelector = params.startSelector;
        this.endSelector = params.endSelector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoStaffHairpin'
            };
        } else {
            console.log('inherit attrs');
        }
    }
    get id() {
        return this.attrs.id;
    }
    get type() {
        return this.attrs.type;
    }

    backupOriginal() {
        if (!this['original']) {
            this.original = {};
            smoMusic.filteredMerge(
                ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height', 'position', 'hairpinType'],
                this, this.original);
        }
    }
    restoreOriginal() {
        if (this['original']) {
            smoMusic.filteredMerge(
                ['xOffsetLeft', 'xOffsetRight', 'yOffset', 'height', 'position', 'hairpinType'],
                this.original, this);
            this.original = null;
        }
    }
    static get defaults() {
        return {
            xOffsetLeft: -2,
            xOffsetRight: 0,
            yOffset: -15,
            height: 10,
            position: SmoStaffHairpin.positions.BELOW,
            hairpinType: SmoStaffHairpin.types.CRESCENDO

        };
    }
    static get positions() {
        // matches VF.modifier
        return {
            LEFT: 1,
            RIGHT: 2,
            ABOVE: 3,
            BELOW: 4,
        };
    }
    static get types() {
        return {
            CRESCENDO: 1,
            DECRESCENDO: 2
        };
    }
}

class SmoSlur {
    static get defaults() {
        return {
            spacing: 2,
            thickness: 2,
            xOffset: 0,
            yOffset: 10,
            position: SmoSlur.positions.HEAD,
            position_end: SmoSlur.positions.HEAD,
            invert: false,
            controlPoints: [{
                    x: 0,
                    y: 40
                }, {
                    x: 0,
                    y: 40
                }
            ]
        };
    }

    // matches VF curve
    static get positions() {
        return {
            HEAD: 1,
            TOP: 2
        };
    }
    get type() {
        return this.attrs.type;
    }
    get id() {
        return this.attrs.id;
    }
	set cp1x(value) {
		if (this.controlPoints) {
			this.controlPoints[0].x=value;
		}
	}
	set cp2x(value) {
		if (this.controlPoints) {
			this.controlPoints[1].x=value;
		}
	}
	set cp1y(value) {
		if (this.controlPoints) {
			this.controlPoints[0].y=value;
		}
	}
	set cp2y(value) {
		if (this.controlPoints) {
			this.controlPoints[1].y=value;
		}
	}


    constructor(params) {
        Vex.Merge(this, SmoSlur.defaults);
        smoMusic.filteredMerge(['spacing', 'thickness', 'xOffset', 'yOffset', 'position', 'invert'], params, this);
        this.startSelector = params.startSelector;
        this.endSelector = params.endSelector;
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSlur'
            };
        }
    }
}
