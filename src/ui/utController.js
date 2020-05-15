
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
		this.undoBuffer = new UndoBuffer();
        this.layoutDemon.undoBuffer = this.undoBuffer;
        this.exhandler = new SuiExceptionHandler(this);

        this.layoutDemon.startDemon();
	}

	static createUi(score, title) {
		UtDom.createDom(title);
		if (title) {
			$('h1.testTitle').text(title);
		}
		var params = {};
		params.layout = suiScoreLayout.createScoreLayout($('#boo')[0],null, score);
    params.scroller = new suiScroller();
		params.tracker = new suiTracker(params.layout,params.scroller);
    params.layoutDemon = new SuiLayoutDemon(params);
    params.layout.setMeasureMapper(params.tracker);

    // params.tracker = new suiTracker(params.layout);
    params.score = score;

    // params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
		var h =  window.innerHeight - $('.musicRelief').offset().top;
		$('.musicRelief').css('height',''+h+'px');
		return keys;
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
        var ix = 0;
        this.layout.layout();
	}

	bindEvents() {}

}
