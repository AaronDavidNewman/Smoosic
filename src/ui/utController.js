
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
    this.score = params.view.renderer.score;
		this.undoBuffer = new UndoBuffer();
    this.layoutDemon.undoBuffer = this.undoBuffer;
    this.exhandler = new SuiExceptionHandler(this);
    SmoMeasure.emptyMeasureNoteType='n';

    this.layoutDemon.startDemon();
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
    this.view.renderer.layout()
	}

	bindEvents() {}

}
