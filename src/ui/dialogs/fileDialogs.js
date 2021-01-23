// eslint-disable-next-line no-unused-vars
class SuiFileDialog extends SuiDialogBase {
  constructor(parameters) {
    var p = parameters;
    var ctor = eval(parameters.ctor);
    p.label = parameters.label ? parameters.label : 'Dialog Box';
    p.id = 'dialog-file';
    p.top = (p.view.score.layout.pageWidth / 2) - 200;
    p.left = (p.view.score.layout.pageHeight / 2) - 200;

    super(ctor.dialogElements, p);
    this.value = '';
  }
  display() {
    $('body').addClass('showAttributeDialog');
    this.components.forEach((component) => {
      component.bind();
    });
    this._bindElements();

    // make sure keyboard is unbound or we get dupicate key events.
    const getKeys = () => {
      this.completeNotifier.unbindKeyboardForModal(this);
    };
    this.startPromise.then(getKeys);
    this.position($(this.dgDom.element)[0].getBoundingClientRect());
  }

  _bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.commit();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.remove-button').remove();
    this.bindKeyboard();
  }
  position(box) {
    var y = (window.innerHeight / 3  + box.height);
    // TODO: adjust if db is clipped by the browser.
    var dge = $(this.dgDom.element).find('.attributeModal');

    $(dge).css('top', '' + y + 'px');
    const x = window.innerWidth - box.width / 2;
    $(dge).css('left', '' + x + 'px');
  }
}
// eslint-disable-next-line no-unused-vars
class SuiLoadFileDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiLoadFileDialog';
  }
  get ctor() {
    return SuiLoadFileDialog.ctor;
  }

  static get dialogElements() {
    SuiLoadFileDialog._dialogElements = SuiLoadFileDialog._dialogElements ? SuiLoadFileDialog._dialogElements :
      [{
        smoName: 'loadFile',
        parameterName: 'jsonFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      }, { staticText: [
        { label: 'Load File' }
      ] }
      ];
    return SuiLoadFileDialog._dialogElements;
  }
  changed() {
    this.value = this.components[0].getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const score = SmoScore.deserialize(this.value);
        scoreWorks = true;
        this.view.changeScore(score);
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
  static createAndDisplay(params) {
    const dg = new SuiLoadFileDialog(params);
    dg.display();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }
  constructor(parameters) {
    parameters.ctor = 'SuiLoadFileDialog';
    super(parameters);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiLoadMxmlDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiLoadMxmlDialog';
  }
  get ctor() {
    return SuiLoadMxmlDialog.ctor;
  }

  static get dialogElements() {
    SuiLoadMxmlDialog._dialogElements = SuiLoadMxmlDialog._dialogElements ? SuiLoadMxmlDialog._dialogElements :
      [{
        smoName: 'loadFile',
        parameterName: 'jsonFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      }, { staticText: [
        { label: 'Load File' }
      ] }
      ];
    return SuiLoadMxmlDialog._dialogElements;
  }
  changed() {
    this.value = this.components[0].getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(this.value, 'text/xml');
        const score = mxmlScore.smoScoreFromXml(xml);
        scoreWorks = true;
        this.view.changeScore(score);
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
  static createAndDisplay(params) {
    const dg = new SuiLoadMxmlDialog(params);
    dg.display();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }
  constructor(parameters) {
    parameters.ctor = 'SuiLoadMxmlDialog';
    super(parameters);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiLoadActionsDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiLoadActionsDialog';
  }
  get ctor() {
    return SuiLoadActionsDialog.ctor;
  }

  static get dialogElements() {
    SuiLoadActionsDialog._dialogElements = SuiLoadActionsDialog._dialogElements ? SuiLoadActionsDialog._dialogElements :
      [{
        smoName: 'loadFile',
        parameterName: 'jsonFile',
        defaultValue: '',
        control: 'SuiFileDownloadComponent',
        label: ''
      }, { staticText: [
        { label: 'Load Action File' }
      ] }
      ];
    return SuiLoadActionsDialog._dialogElements;
  }
  changed() {
    this.value = this.loadFileCtrl.getValue();
    $(this.dgDom.element).find('.ok-button').prop('disabled', false);
  }
  commit() {
    let scoreWorks = false;
    if (this.value) {
      try {
        const json = JSON.parse(this.value);
        this.view.playActions(json);
        scoreWorks = true;
        this.complete();
      } catch (e) {
        console.warn('unable to score ' + e);
      }
      if (!scoreWorks) {
        this.complete();
      }
    }
  }
  static createAndDisplay(params) {
    const dg = new SuiLoadActionsDialog(params);
    dg.display();
    dg._bindComponentNames();
    // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled', true);
  }
  constructor(parameters) {
    parameters.ctor = 'SuiLoadActionsDialog';
    super(parameters);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiPrintFileDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiPrintFileDialog';
  }
  get ctor() {
    return SuiPrintFileDialog.ctor;
  }
  static get label() {
    SuiPrintFileDialog._label = typeof(SuiPrintFileDialog._label) !== 'undefined' ? SuiPrintFileDialog._label :
      'Print Complete';
    return SuiPrintFileDialog._label;
  }
  static set label(value) {
    SuiPrintFileDialog._label = value;
  }

  static get dialogElements() {
    return [
      { staticText: [
        { label: 'Print Complete' }
      ] }];
  }
  static createAndDisplay(params) {
    var dg = new SuiPrintFileDialog(params);
    dg.display();
  }
  constructor(parameters) {
    parameters.ctor = 'SuiPrintFileDialog';
    super(parameters);
  }
  changed() {}
  _bindElements() {
    const dgDom = this.dgDom;
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      $('body').removeClass('printing');
      this.view.renderer.restoreLayoutAfterPrint();
      window.dispatchEvent(new Event('resize'));
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').remove();
    $(dgDom.element).find('.remove-button').remove();
  }
}
// eslint-disable-next-line no-unused-vars
class SuiSaveFileDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiSaveFileDialog';
  }
  get ctor() {
    return SuiSaveFileDialog.ctor;
  }

  static get dialogElements() {
    SuiSaveFileDialog._dialogElements = typeof(SuiSaveFileDialog._dialogElements) !== 'undefined' ?
      SuiSaveFileDialog._dialogElements :
      [{
        smoName: 'saveFileName',
        parameterName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      },
      {
        staticText: [
          { label: 'Save Score' }
        ]
      }];
    return SuiSaveFileDialog._dialogElements;
  }

  changed() {
    this.value = this.components[0].getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
      filename = filename + '.json';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveScore(filename);
    this.complete();
  }
  display() {
    super.display();
    this._bindComponentNames();
    this.saveFileNameCtrl.setValue(this.value);
  }
  static createName(score) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '.json';
  }
  static createAndDisplay(params) {
    var dg = new SuiSaveFileDialog(params);
    dg.display();
  }
  constructor(parameters) {
    parameters.ctor = 'SuiSaveFileDialog';
    super(parameters);
    this.value = SuiSaveFileDialog.createName(this.view.score);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiSaveXmlDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiSaveXmlDialog';
  }
  get ctor() {
    return SuiSaveXmlDialog.ctor;
  }

  static get dialogElements() {
    SuiSaveXmlDialog._dialogElements = typeof(SuiSaveXmlDialog._dialogElements) !== 'undefined' ?
      SuiSaveXmlDialog._dialogElements :
      [{
        smoName: 'saveFileName',
        parameterName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      },
      {
        staticText: [
          { label: 'Save Score' }
        ]
      }];
    return SuiSaveXmlDialog._dialogElements;
  }

  changed() {
    this.value = this.components[0].getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.xml';
    }
    if (filename.indexOf('.xml') < 0) {
      filename = filename + '.xml';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveXml(filename);
    this.complete();
  }
  display() {
    super.display();
    this._bindComponentNames();
    this.saveFileNameCtrl.setValue(this.value);
  }
  static createName(score) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '.xml';
  }
  static createAndDisplay(params) {
    var dg = new SuiSaveXmlDialog(params);
    dg.display();
  }
  constructor(parameters) {
    parameters.ctor = 'SuiSaveXmlDialog';
    super(parameters);
    this.value = SuiSaveXmlDialog.createName(this.view.score);
  }
}

// eslint-disable-next-line no-unused-vars
class SuiSaveActionsDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiSaveActionsDialog';
  }
  get ctor() {
    return SuiSaveActionsDialog.ctor;
  }

  static get dialogElements() {
    SuiSaveActionsDialog._dialogElements = typeof(SuiSaveActionsDialog._dialogElements) !== 'undefined' ?
      SuiSaveActionsDialog._dialogElements :
      [{
        smoName: 'saveFileName',
        parameterName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label: 'File Name'
      },
      {
        staticText: [
          { label: 'Save Score' }
        ]
      }];
    return SuiSaveActionsDialog._dialogElements;
  }

  changed() {
    this.value = this.components[0].getValue();
  }
  commit() {
    let filename = this.value;
    if (!filename) {
      filename = 'myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
      filename = filename + '.json';
    }
    this.view.score.scoreInfo.version += 1;
    this.view.saveActions(filename);
    this.complete();
  }
  display() {
    super.display();
    this._bindComponentNames();
    this.saveFileNameCtrl.setValue(this.value);
  }
  static createName(score) {
    return score.scoreInfo.name + '-' + score.scoreInfo.version + '-actions.json';
  }
  static createAndDisplay(params) {
    var dg = new SuiSaveActionsDialog(params);
    dg.display();
  }
  constructor(parameters) {
    parameters.ctor = 'SuiSaveActionsDialog';
    super(parameters);
    this.value = SuiSaveActionsDialog.createName(this.view.score);
  }
}
