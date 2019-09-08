
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
		this.undoBuffer = new UndoBuffer();
	}

	static createUi(score, title) {
		utController.createDom();
		if (title) {
			$('h1.testTitle').text(title);
		}
		var params = {};
		params.layout = suiSimpleLayout.createScoreLayout($('#boo')[0], score);
		params.tracker = new suiTracker(params.layout);
		// params.tracker = new suiTracker(params.layout);
		params.score = score;
		// params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
		return keys;
	}

	static createDom() {
		var b = htmlHelpers.buildDom;
		$('#smoo').html('');
		var r = b('div').classes('dom-container')
			.append(b('div').classes('modes'))
			.append(b('div').classes('overlay'))
			.append(b('div').classes('attributeDialog'))
			.append(b('div').classes('helpDialog'))
			.append(b('div').classes('menuContainer'))
			.append(b('h1').classes('testTitle').text('Smoosic'))
			.append(b('h2').classes('subTitle'))
			.append(b('div').classes('piano-container')
				.append(b('div').classes('piano-keys')))
			.append(b('div').classes('workspace-container')
				.append(b('div').classes('workspace')
					.append(b('div').classes('controls-top'))
					.append(b('div').classes('controls-left'))
					.append(b('div').classes('musicRelief')
						.append(b('div').classes('musicContainer').attr('id', 'boo')))));
		$('#smoo').append(r.dom());
	}

	get renderElement() {
		return this.layout.renderElement;
	}

	static get defaults() {
		return {};
	}

	detach() {
		this.layout = null;
	}

	render() {
		return this.layout.render();
	}

	bindEvents() {}

}
