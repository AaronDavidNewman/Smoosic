
class SuiFileDialog extends SuiDialogBase {
  constructor(parameters) {
		if (!(parameters.controller)) {
			throw new Error('file dialog must have score');
		}
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
		// this.modifier = this.layout.score.layout;
		this.controller = p.controller;
		// this.backupOriginal();
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
        self.controller.unbindKeyboardForModal(self);
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
    static get dialogElements() {
		return [{
				smoName: 'loadFile',
				parameterName: 'jsonFile',
				defaultValue: '',
				control: 'SuiFileDownloadComponent',
				label:''
			}];
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
    params.label="Open File";
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
    static get dialogElements() {
		return [];
    }
    static createAndDisplay(params) {
    params.label = "Print Complete";
		var dg = new SuiPrintFileDialog(params);
		dg.display();
	}
  constructor(parameters) {
    parameters.ctor='SuiPrintFileDialog';
    parameters.label = 'Print Complete';
    super(parameters);
	}
  changed() {}
  _bindElements() {
    var self = this;
    var dgDom = this.dgDom;
		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
      $('body').removeClass('printing');
      self.complete();
	  });

		$(dgDom.element).find('.cancel-button').remove();
		$(dgDom.element).find('.remove-button').remove();
	}
}
class SuiSaveFileDialog extends SuiFileDialog {

  static get dialogElements() {
	  return [{
			smoName: 'saveFileName',
			parameterName: 'saveFileName',
			defaultValue: '',
			control: 'SuiTextInputComponent',
			label:'File Name'
		}];
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
    params.label="Save File";
		var dg = new SuiSaveFileDialog(params);
		dg.display();
	}
  constructor(parameters) {
    parameters.ctor='SuiSaveFileDialog';
    super(parameters);
	}
}
