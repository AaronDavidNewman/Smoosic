
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
	}

	static createUi(renderElement, score) {
		var params = {};
		params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
		// params.tracker = new suiTracker(params.layout);
		params.score = score;
		// params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
		return keys;
	}

	get renderElement() {
		return this.layout.renderElement;
	}
	

	static get defaults() {
		return {			
		};
	}

	detach() {
		this.layout = null;		
	}

	render() {
		this.layout.render();
	}	
	
	bindEvents() {

	}

}
