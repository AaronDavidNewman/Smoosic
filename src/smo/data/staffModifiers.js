
// # This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.

// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
class SmoStaffHairpin {
    constructor(params) {
        Vex.Merge(this, SmoStaffHairpin.defaults);
        vexMusic.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
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
    static get defaults() {
        return {
            xOffsetLeft: -2,
			xOffsetRight:0,
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