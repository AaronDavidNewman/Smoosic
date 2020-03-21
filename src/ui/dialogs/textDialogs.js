class SuiLyricDialog extends SuiDialogBase {
    static createAndDisplay(parameters) {
		var dg = new SuiLyricDialog({
				layout: parameters.controller.layout,
				tracker:parameters.controller.tracker,
				controller: parameters.controller
			});
		dg.display();
        return dg;
	}
    static get dialogElements() {
		return [ {
            smoName: 'verse',
            parameterName: 'verse',
            defaultValue: 0,
            control: 'SuiDropdownComponent',
            label:'Verse',
            startRow:true,
            options: [{
                    value: 0,
                    label: '1'
                }, {
                    value: 1,
                    label: '2'
                }, {
                    value: 2,
                    label: '3'
                }
            ]
        },{
				smoName: 'textEditor',
				parameterName: 'text',
				defaultValue: 0,
				control: 'SuiLyricEditComponent',
				label:'Edit Text',
				options: []
		},{
				smoName: 'previousWord',
				parameterName: 'previousWord',
				defaultValue: 0,
                additionalClasses:'icon-arrow-left',
				control: 'SuiButtonComponent',
				label:'Previous Word',
				options: []
		},{
				smoName: 'nextWord',
				parameterName: 'nextWord',
				defaultValue: 0,
                additionalClasses:'icon-arrow-right',
				control: 'SuiButtonComponent',
				label:'Next Word',
				options: []
		},{
				smoName: 'removeLyric',
				parameterName: 'removeLyric',
				defaultValue: 0,
                additionalClasses:'icon-cross',
				control: 'SuiButtonComponent',
				label:'Remove Lyric',
				options: []
		}
    ];
    }
    constructor(parameters) {
        parameters.ctor='SuiLyricDialog';
        parameters.label = 'Done Editing Lyrics';
        var p = parameters;

		super(SuiLyricDialog.dialogElements, {
			id: 'dialog-lyrics',
			top: (p.layout.score.layout.pageWidth / 2) - 200,
			left: (p.layout.score.layout.pageHeight / 2) - 200,
			label: p.label,
			tracker:parameters.tracker
		});
        this.layout = p.layout;
		this.controller = p.controller;
        this.tracker = this.controller.tracker;
        this.undo = this.controller.undoBuffer;
        SmoUndoable.noop(this.layout.score,this.undo,'Undo lyrics');
	}
    display() {
        $('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();
		});

        this.editor = this.components.find((c) => c.smoName === 'textEditor');
        this.verse = this.components.find((c) => c.smoName === 'verse');
		this._bindElements();

        // make sure keyboard is unbound or we get dupicate key events.
        var self=this;
        this.controller.unbindKeyboardForDialog(this);

        $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
            if ($(ctrl).hasClass('cbLyricEdit')) {
            } else {
                $(ctrl).addClass('fold-textedit');
            }
        });

       this.position(this.tracker.selections[0].note.renderedBox);

        var cb = function (x, y) {}
        htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
	}
    _focusSelection() {
        if (this.editor.editor.selection &&
            this.editor.editor.selection.note &&
            this.editor.editor.selection.note.renderedBox) {
                this.tracker.scroller.scrollVisibleBox(this.editor.editor.selection.note.renderedBox);
            }
    }
    changed() {
        this.editor.verse = this.verse.getValue();
        if (this.removeLyricControl.changeFlag) {
            this.editor.removeLyric();
        }

        if (this.nextWordControl.changeFlag) {
            this.editor.editor.nextWord();
            this._focusSelection();
        }
        if (this.previousWordControl.changeFlag) {
            this.editor.editor.previousWord();
            this._focusSelection();
        }
    }
    _bindElements() {
        var self = this;
        var dgDom = this.dgDom;

        this.nextWordControl = this.components.find((comp) => {return comp.smoName == 'nextWord';});
        this.previousWordControl = this.components.find((comp) => {return comp.smoName == 'previousWord';});
        this.removeLyricControl = this.components.find((comp) => {return comp.smoName == 'removeLyric';});

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.complete();
            self.tracker.replaceSelectedMeasures();
		});
        $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.layout.score = self.undo.undo(self.layout.score);
            self.complete();
            self.tracker.replaceSelectedMeasures();
		});
        $(dgDom.element).find('.remove-button').remove();
        this.editor.startEditSession();
	}
}
class SuiTextTransformDialog  extends SuiDialogBase {
    static createAndDisplay(parameters) {
		var dg = new SuiTextTransformDialog(parameters);
		dg.display();
        return dg;
	}

    static get dialogElements() {
		return [{
				smoName: 'textEditor',
				parameterName: 'text',
				defaultValue: 0,
				control: 'SuiTextInPlace',
				label:'Edit Text',
				options: []
			},{
				smoName: 'textDragger',
				parameterName: 'textLocation',
				defaultValue: 0,
				control: 'SuiDragText',
				label:'Move Text',
				options: []
			},{
				smoName: 'textResizer',
				parameterName: 'textBox',
				defaultValue: 0,
				control: 'SuiResizeTextBox',
				label:'Coming Soon',
				options: []
			},
            {
				smoName: 'x',
				parameterName: 'x',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'X Position (Px)',
                startRow:true,
				type: 'int'
			},{
				smoName: 'y',
				parameterName: 'y',
				defaultValue: 0,
				control: 'SuiRockerComponent',
				label: 'Y Position (Px)',
                startRow:true,
				type: 'int'
			}, {
				smoName: 'scaleX',
				parameterName: 'scaleX',
				defaultValue: 100,
				control: 'SuiRockerComponent',
				label: 'Horizontal Scale (%)',
                startRow:true,
				type: 'percent'
			}, {
				smoName: 'scaleY',
				parameterName: 'scaleY',
				defaultValue: 100,
				control: 'SuiRockerComponent',
				label: 'Vertical Scale (%)',
                startRow:true,
				type: 'percent'
			}, {
				smoName: 'justification',
				parameterName: 'justification',
				defaultValue: SmoScoreText.justifications.left,
				control: 'SuiDropdownComponent',
				label:'Justification',
                startRow:true,
				options: [{
						value: 'left',
						label: 'Left'
					}, {
						value: 'right',
						label: 'Right'
					}, {
						value: 'center',
						label: 'Center'
					}
				]
			} ,
            {
				smoName: 'fontFamily',
				parameterName: 'fontFamily',
				defaultValue: SmoScoreText.fontFamilies.times,
				control: 'SuiDropdownComponent',
				label:'Font Family',
                startRow:true,
				options: [{value:'serif',label:'Serif'},
                  {value:'sans-serif',label:'Sans-Serif'},
                  {label:'Monospace',value:'monospace'},
                  {label:'Cursive',value:'cursive'},
                  {label:'Times',value:'Times New Roman'},
                  {label:'Arial',value:'Arial'},
                  {label:'Helvetica',value:'Helvetica'}
                  ]

			},
            {
				smoName: 'fontSize',
				parameterName: 'fontSize',
				defaultValue: 1,
				control: 'SuiRockerComponent',
				label: 'Font Size',
				type: 'float',
                increment:0.1
			},
            {
				smoName: 'fontUnit',
				parameterName: 'fontUnit',
				defaultValue: 'em',
				control: 'SuiDropdownComponent',
				label: 'Units',
                options: [{value:'em',label:'em'},{value:'px',label:'px'},{value:'pt',label:'pt'}]
			}
        ];
    }

    display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();

            if (component.smoName === 'textDragger') {
                this.textDragger = component;
            }
            if (typeof(component['setValue'])=='function' && this.modifier[component.parameterName]) {
			  component.setValue(this.modifier[component.parameterName]);
            }
		});

        var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
        var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
        var fontSize = this.modifier.fontInfo.size;
        fontSize=svgHelpers.getFontSize(fontSize);
        dbFontSize.setValue(fontSize.size);
        dbFontUnit.setValue(fontSize.unit);

		this._bindElements();
		this.position(this.modifier.renderedBox);

		var cb = function (x, y) {}
		htmlHelpers.draggable({
			parent: $(this.dgDom.element).find('.attributeModal'),
			handle: $(this.dgDom.element).find('span.jsDbMove'),
            animateDiv:'.draganime',
			cb: cb,
			moveParent: true
		});
        $(this.dgDom.element).find('.smoControl').each((ix,ctrl) => {
            if ($(ctrl).hasClass('cbTextInPlace')) {
                $(ctrl).addClass('fold-textmove');
            } else if ($(ctrl).hasClass('cbDragTextDialog')) {
                $(ctrl).addClass('fold-textedit');
            } else {
                $(ctrl).addClass('fold-textedit');
                $(ctrl).addClass('fold-textmove');
            }
        });
        if (!this.modifier.edited) {
            this.modifier.edited = true;
            var textEditor = this.components.find((c) => c.smoName === 'textEditor');
            textEditor.startEditSession();
        }
	}

    changed() {

        var textEditor = this.components.find((c) => c.smoName === 'textEditor');
        this.modifier.text = textEditor.getValue();
        this.components.find((x) => {
            if (typeof(x['getValue'])=='function') {
                if (x.parameterName.indexOf('scale') == 0) {
                   var val = x.getValue();
                    var fcn = x.parameterName+'InPlace';
                    this.modifier[fcn](val);
                }
            }
		});
        var xcomp = this.components.find((x) => x.smoName === 'x');
        var ycomp = this.components.find((x) => x.smoName === 'y');
        if (this.textDragger.dragging) {
            var val = this.textDragger.getValue();
            xcomp.setValue(val.x);
            ycomp.setValue(val.y);
        }
        this.modifier.x=xcomp.getValue();
        this.modifier.y=ycomp.getValue();

        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');
        this.modifier.fontInfo.family = fontComp.getValue();

        var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
        var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
        this.modifier.fontInfo.size=''+dbFontSize.getValue()+dbFontUnit.getValue();

        // Use layout context because render may have reset svg.
        $(this.layout.context.svg).find('.' + this.modifier.attrs.id).remove();;
        this.layout.renderScoreText(this.modifier);
    }


	constructor(parameters) {
		if (!parameters.modifier) {
			throw new Error('modifier attribute dialog must have modifier');
		}

		super(SuiTextTransformDialog.dialogElements, {
			id: 'dialog-' + parameters.modifier.attrs.id,
			top: parameters.modifier.renderedBox.y,
			left: parameters.modifier.renderedBox.x,
			label: 'Text Box Properties',
			tracker:parameters.tracker
		});

		Vex.Merge(this, parameters);

        // Do we jump right into editing?
        this.undo = parameters.undo;
        this.textElement=$(this.layout.context.svg).find('.' + parameters.modifier.attrs.id)[0];
        this.modifier.backupParams();
	}
    _commit() {

    }
    _bindElements() {
        var self = this;
        this.bindKeyboard();
		var dgDom = this.dgDom;
        var textEditor = this.components.find((c) => c.smoName === 'textEditor');
        var textDragger = this.components.find((c) => c.smoName === 'textDragger');
        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');

        fontComp.setValue(this.modifier.fontInfo.family);


		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
            self.modifier.restoreParams();
			self.complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
            textEditor.endSession();
            textDragger.endSession();
            SmoUndoable.scoreOp(self.layout.score,'removeScoreText',self.modifier,self.undo,'remove text from dialog');
			self.complete();
		});
    }
}
