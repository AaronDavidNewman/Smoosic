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
        control: 'SuiDropdownComponent',
        disabledOption: 'Select library or score',
        label: 'Selection',
        options: []
      }, {
        staticText: [
          { label: 'Music Library' }
        ]
      }];
    return SuiLibraryDialog._dialogElements;
  }
  static _createOptions(topLib) {
    const options = [];
    const parent = topLib.parentLib;
    if (parent && parent.name) {
      options.push({ label: parent.name, value: parent.value.url });
    }
    topLib.children.forEach((child) => {
      options.push({ label: child.metadata.name, value: child.url });
    });
    return options;
  }
  static _createElements(topLib) {
    const elements = JSON.parse(JSON.stringify(SuiLibraryDialog.dialogElements));
    const txt = elements.find((ee) => typeof(ee.staticText) !== 'undefined');
    const drop = elements.find((ee) => typeof(ee.smoName) !== 'undefined' && ee.smoName === 'smoLibrary');
    txt.label = topLib.metadata.name;
    drop.options = SuiLibraryDialog._createOptions(topLib);
    return elements;
  }
  static _createAndDisplay(parameters, topLib) {
    const elements = SuiLibraryDialog._createElements(topLib);
    const dg = new SuiLibraryDialog(parameters, elements, topLib);
    dg.display();
  }
  static createAndDisplay(parameters) {
    const topLib = new SmoLibrary({ url: 'https://aarondavidnewman.github.io/Smoosic/release/library/links/smoLibrary.json' });
    topLib.load().then(() => SuiLibraryDialog._createAndDisplay(parameters, topLib));
  }
  get displayOptions() {
    return ['BINDCOMPONENTS', 'BINDNAMES', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'GLOBALPOS'];
  }
  display() {
    this.applyDisplayOptions();
    this._bindElements();
  }
  _bindElements() {
    const dgDom = this.dgDom;
    this.okButton = $(dgDom.element).find('.ok-button');
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
      const ctrl = this.smoLibraryCtrl;
      const url = this.smoLibraryCtrl.getValue();
      // User navigates to parent library
      if (typeof(this.libHash[url]) !== 'undefined') {
        this.topLib = this.libHash[url];
        this.selectedScore = null;
        $(this.okButton).prop('disabled', true);
        const options = SuiLibraryDialog._createOptions(this.topLib);
        ctrl.replaceOptions(options);
      } else {
        // child library
        this.selectedLib = this.topLib.children.find((ll) => ll.url === url);
        const topLib = this.selectedLib;
        if (topLib.format === 'library') {
          topLib.load().then(() => {
            this.topLib = topLib;
            this.selectedScore = null;
            $(this.okButton).prop('disabled', true);
            const options = SuiLibraryDialog._createOptions(topLib);
            ctrl.replaceOptions(options);
          });
        } else {
          this.selectedScore = topLib;
          $(this.okButton).prop('disabled', false);
        }
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
