
class SuiFileDialog extends SuiDialogBase {
  constructor(parameters) {
		var p = parameters;
    var ctor = eval(parameters.ctor);
    p.label = parameters.label ? parameters.label : 'Dialog Box';
    p.id = 'dialog-file';
    p.top = (p.layout.score.layout.pageWidth / 2) - 200;
    p.left = (p.layout.score.layout.pageHeight / 2) - 200;

		super(ctor.dialogElements, p);

    // File dialogs can be created from menu, get menu promise
		this.layout = p.layout;
    this.value='';
	}
  display() {
    $('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});
		this._bindElements();

    // make sure keyboard is unbound or we get dupicate key events.
    var self=this;
    function getKeys() {
        self.completeNotifier.unbindKeyboardForModal(self);
    }
    this.startPromise.then(getKeys);
    this.position($(this.dgDom.element)[0].getBoundingClientRect());
	}

  _bindElements() {
  	var self = this;
  	var dgDom = this.dgDom;

  	$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.commit();
  	});

  	$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
  		self.complete();
  	});

  	$(dgDom.element).find('.remove-button').remove();
        this.bindKeyboard();
  	}
    position(box) {
  	var y = (window.innerHeight/3  + box.height);

  	// TODO: adjust if db is clipped by the browser.
    var dge = $(this.dgDom.element).find('.attributeModal');

  	$(dge).css('top', '' + y + 'px');
        var x = window.innerWidth - box.width/2;
        $(dge).css('left', '' + x + 'px');
  }
}
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
  				label:''
			  },{staticText: [
          {label: 'Load File'}
        ]}
      ];
      return SuiLoadFileDialog._dialogElements;
    }

    changed() {
        this.value = this.components[0].getValue();
        $(this.dgDom.element).find('.ok-button').prop('disabled',false);
    }
    commit() {
        var scoreWorks = false;
        if (this.value) {
            try {
                var score = SmoScore.deserialize(this.value);
                scoreWorks=true;
                this.layout.score = score;
                this.layout.setViewport(true);
                setTimeout(function() {
                    $('body').trigger('forceResizeEvent');
                },1);
                this.complete();
            } catch (e) {
                console.log('unable to score '+e);
            }
            if (!scoreWorks) {
                this.complete();
            }
        }
    }
    static createAndDisplay(params) {
		var dg = new SuiLoadFileDialog(params);
		dg.display();
     // disable until file is selected
    $(dg.dgDom.element).find('.ok-button').prop('disabled',true);
	}
    constructor(parameters) {
        parameters.ctor='SuiLoadFileDialog';
        super(parameters);
	}
}


class SuiPrintFileDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiPrintFileDialog';
  }
  get ctor() {
    return SuiPrintFileDialog.ctor;
  }
  static get label() {
    SuiPrintFileDialog._label = SuiPrintFileDialog._label ? SuiPrintFileDialog._label :
       'Print Complete';
    return SuiPrintFileDialog._label;
  }
  static set label(value) {
    SuiPrintFileDialog._label = value;
  }

  static get dialogElements() {
	  return [
      {staticText: [
      {label: 'Print Complete'}
    ]}];
  }
  static createAndDisplay(params) {
		var dg = new SuiPrintFileDialog(params);
		dg.display();
	}
  constructor(parameters) {
    parameters.ctor='SuiPrintFileDialog';
    super(parameters);
	}
  changed() {}
  _bindElements() {
    var self = this;
    var dgDom = this.dgDom;
		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
      $('body').removeClass('printing');
      self.layout.restoreLayoutAfterPrint();
      window.dispatchEvent(new Event('resize'));
      self.complete();
	  });

		$(dgDom.element).find('.cancel-button').remove();
		$(dgDom.element).find('.remove-button').remove();
	}
}
class SuiSaveFileDialog extends SuiFileDialog {
  static get ctor() {
    return 'SuiSaveFileDialog';
  }
  get ctor() {
    return SuiSaveFileDialog.ctor;
  }

  static get dialogElements() {
    SuiSaveFileDialog._dialogElements = SuiSaveFileDialog._dialogElements ? SuiSaveFileDialog._dialogElements :
	  [{
        smoName: 'saveFileName',
        parameterName: 'saveFileName',
        defaultValue: '',
        control: 'SuiTextInputComponent',
        label:'File Name'
		},
    {
      staticText: [
        {label : 'Save Score'}
      ]
    }];

    return SuiSaveFileDialog._dialogElements;
  }

  changed() {
    this.value = this.components[0].getValue();
  }
  commit() {
    var filename = this.value;
    if (!filename) {
        filename='myScore.json';
    }
    if (filename.indexOf('.json') < 0) {
        filename = filename + '.json';
    }
    var txt = this.layout.score.serialize();
    txt = JSON.stringify(txt);
    htmlHelpers.addFileLink(filename,txt,$('.saveLink'));
    $('.saveLink a')[0].click();
    this.complete();
  }
  static createAndDisplay(params) {
		var dg = new SuiSaveFileDialog(params);
		dg.display();
	}
  constructor(parameters) {
    parameters.ctor='SuiSaveFileDialog';
    super(parameters);
	}
}
