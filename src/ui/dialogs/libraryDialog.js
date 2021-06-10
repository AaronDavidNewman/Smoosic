// ## SuiLibraryDialog
// Traverse the library nodes or load a score
// eslint-disable-next-line no-unused-vars
class SuiLibraryDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLibraryDialog';
  }
  get ctor() {
    return SuiLibraryDialog.ctor;
  }
  static get dialogElements() {
    SuiLibraryDialog._dialogElements = typeof(SuiLibraryDialog._dialogElements)
      !== 'undefined' ? SuiLibraryDialog._dialogElements :
      [{
        smoName: 'smoLibrary',
        parameterName: 'smoLibrary',
        control: 'SuiTreeComponent',
        root: '',
        label: 'Selection',
        options: []
      }, {
        staticText: [
          { label: 'Music Library' }
        ]
      }];
    return SuiLibraryDialog._dialogElements;
  }
  static addChildRecurse(options, parent, child) {
    options.push({ label: child.metadata.name, value: child.url, parent: parent.url, format: child.format, expanded: false });
    child.children.forEach((gchild) => {
      SuiLibraryDialog.addChildRecurse(options, child, gchild);
    });
  }
  static _createOptions(topLib) {
    const options = [];
    topLib.children.forEach((child) => {
      SuiLibraryDialog.addChildRecurse(options, topLib, child);
    });
    return options;
  }
  static _createElements(topLib) {
    const elements = JSON.parse(JSON.stringify(SuiLibraryDialog.dialogElements));
    const txt = elements.find((ee) => typeof(ee.staticText) !== 'undefined');
    const tree = elements.find((ee) => typeof(ee.smoName) !== 'undefined' && ee.smoName === 'smoLibrary');
    txt.label = topLib.metadata.name;
    tree.root = topLib.url;
    tree.options = SuiLibraryDialog._createOptions(topLib);
    return elements;
  }
  static _createAndDisplay(parameters, topLib) {
    const elements = SuiLibraryDialog._createElements(topLib);
    const dg = new SuiLibraryDialog(parameters, elements, topLib);
    dg.display();
  }
  static createAndDisplay(parameters) {
    const topLib = new SmoLibrary({ url: SmoConfig.libraryUrl });
    topLib.load().then(() => SuiLibraryDialog._createAndDisplay(parameters, topLib));
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  buildTreeRecurse(children) {
    children.forEach((child) => {
      this.tree[child.url] = child;
      this.buildTreeRecurse(child.children);
    });
  }
  buildTree() {
    this.tree = {};
    this.buildTreeRecurse(this.topLib.children);
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
    $(this.dgDom.element).find('.smoControlContainer').addClass('center-flex');
  }
  _bindElements() {
    const dgDom = this.dgDom;
    this.okButton = $(dgDom.element).find('.ok-button');
    $(this.okButton).prop('disabled', true);
    this.cancelButton = $(dgDom.element).find('.cancel-button');
    $(this.okButton).off('click').on('click', () => {
      if (this.selectedScore !== null) {
        if (this.selectedScore.format === 'mxml') {
          this._loadXmlAndComplete();
        } else {
          this._loadJsonAndComplete();
        }
      } else {
        this.complete();
      }
    });
    $(this.cancelButton).off('click').on('click', () => {
      this.complete();
    });
    $(dgDom.element).find('.remove-button').remove();
  }
  _loadJsonAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore.url);
    req.loadAsync().then(() => {
      const score = SmoScore.deserialize(req.value);
      this.view.changeScore(score);
      this.complete();
    });
  }
  _loadXmlAndComplete() {
    const req = new SuiXhrLoader(this.selectedScore.url);
    req.loadAsync().then(() => {
      const parser = new DOMParser();
      const xml = parser.parseFromString(req.value, 'text/xml');
      const score = mxmlScore.smoScoreFromXml(xml);
      this.view.changeScore(score);
      this.complete();
    });
  }
  changed() {
    if (this.smoLibraryCtrl.changeFlag) {
      const url = this.smoLibraryCtrl.getValue();
      this.buildTree();
      this.selectedLib = this.tree[url];
      this.smoLibraryCtrl.setValue(this.selectedLib.url);
      // User navigates to parent library
      if (this.selectedLib.format === 'library') {
        $(this.okButton).prop('disabled', true);
        this.selectedScore = null;
        if (!this.selectedLib.loaded) {
          this.selectedLib.load().then(() => {
            const options = SuiLibraryDialog._createOptions(this.topLib);
            this.smoLibraryCtrl.updateOptions(options);
            this.smoLibraryCtrl.setValue(this.selectedLib.url);
          });
        }
      } else {
        this.selectedScore = this.selectedLib;
        this.smoLibraryCtrl.setValue(this.selectedLib.url);
        $(this.okButton).prop('disabled', false);
      }
    }
  }
  constructor(parameters, dialogElements, topLib) {
    var p = parameters;
    super(dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.libHash = {};
    this.libHash[topLib.url] = topLib;
    this.topLib = topLib;
    this.selectedLib = null;
    this.parentLib = {};
  }
}
