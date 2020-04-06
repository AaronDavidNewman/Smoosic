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
        // Note, when selection changes, we need to wait for the text edit session
        // to start on the new selection.  Then this.editor.changeFlag is set and
        // we can focus on the selection if it is not visible.
        if (this.editor.changeFlag && this.editor.selection) {
            this.tracker.setSelection(this.editor.selection.selector);
            this._focusSelection();
        }
        if (this.removeLyricControl.changeFlag) {
            layoutDebug.addTextDebug('SuiLyricEditDialog:remove lyric ');
            this.editor.removeLyric();
        }

        if (this.nextWordControl.changeFlag) {
            layoutDebug.addTextDebug('SuiLyricEditDialog: next word button ');
            this.editor.editor.nextWord();
        }
        if (this.previousWordControl.changeFlag) {
            layoutDebug.addTextDebug('SuiLyricEditDialog: previous word button ');
            this.editor.editor.previousWord();
        }
    }
    _bindElements() {
        var self = this;
        var dgDom = this.dgDom;

        this.nextWordControl = this.components.find((comp) => {return comp.smoName == 'nextWord';});
        this.previousWordControl = this.components.find((comp) => {return comp.smoName == 'previousWord';});
        this.removeLyricControl = this.components.find((comp) => {return comp.smoName == 'removeLyric';});

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.tracker.replaceSelectedMeasures();
            self.tracker.layout.setDirty();
            self.complete();
		});
        $(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.layout.score = self.undo.undo(self.layout.score);
            self.tracker.replaceSelectedMeasures();
            self.tracker.layout.setDirty();
            self.complete();
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
				label:'Resize Text',
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
			},
            {
				smoName: 'wrap',
				parameterName: 'wrap',
                defaultValue: false,
    			control:'SuiToggleComponent',
				label: 'Wrap Text'
			},
            { // {every:'every',even:'even',odd:'odd',once:'once'}
				smoName: 'pagination',
				parameterName: 'pagination',
				defaultValue: SmoScoreText.paginations.every,
				control: 'SuiDropdownComponent',
				label:'Page Behavior',
                startRow:true,
				options: [{value:'once',label:'Once'},
                  {value:'every',label:'Every'},
                  {label:'Even',value:'even'},
                  {label:'Odd',value:'odd'},
                  {label:'Subsequent',value:'subsequent'}
                  ]
			}
        ];
    }

    display() {
		$('body').addClass('showAttributeDialog');
		this.components.forEach((component) => {
			component.bind();

            if (typeof(component['setValue'])=='function' && this.modifier[component.parameterName]) {
			  component.setValue(this.modifier[component.parameterName]);
            }
		});
        this._bindComponentNames();

        var dbFontSize = this.components.find((c) => c.smoName === 'fontSize');
        var dbFontUnit  = this.components.find((c) => c.smoName === 'fontUnit');
        var fontSize = this.modifier.fontInfo.size;
        fontSize=svgHelpers.getFontSize(fontSize);
        dbFontSize.setValue(fontSize.size);
        dbFontUnit.setValue(fontSize.unit);

        this.wrapCtrl.setValue(this.modifier.boxModel != SmoScoreText.boxModels.none);

        this.paginationsComponent = this.components.find((c) => c.smoName == 'pagination');
        this.paginationsComponent.setValue(this.modifier.pagination);

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
               $(ctrl).addClass('fold-textresize');
           } else if ($(ctrl).hasClass('cbDragTextDialog')) {
               $(ctrl).addClass('fold-textedit');
               $(ctrl).addClass('fold-textresize');
           } else if ($(ctrl).hasClass('cbResizeTextBox')) {
               $(ctrl).addClass('fold-textedit');
               $(ctrl).addClass('fold-textmove');
           } else {
               $(ctrl).addClass('fold-textedit');
               $(ctrl).addClass('fold-textmove');
               $(ctrl).addClass('fold-textresize');
           }
       });

        // If this control has not been edited this session, assume they want to
        // edit the text and just right into that.
        if (!this.modifier.edited) {
            this.modifier.edited = true;
            this.textEditorCtrl.startEditSession();
        }
	}

    changed() {

        var textEditor = this.components.find((c) => c.smoName === 'textEditor');
        this.modifier.text = textEditor.getValue();

        if (this.wrapCtrl.changeFlag) {
            var boxModel = this.wrapCtrl.getValue() ? SmoScoreText.boxModels.wrap :
                SmoScoreText.boxModels.none;
            this.modifier.boxModel = boxModel;
            if (boxModel ==  SmoScoreText.boxModels.wrap) {
                this.modifier.scaleX = this.modifier.scaleY = 1.0;
                this.modifier.translateX = this.modifier.translateY = 1.0;
                this.modifier.width = this.modifier.logicalBox.width;
                this.modifier.height = this.modifier.logicalBox.height;
            }

        }

        // If we resized the text, set the size components from the actual text
        // object that was resized.
        if (this.textResizerCtrl.changeFlag) {
            this.xCtrl.setValue(this.modifier.x);
            this.yCtrl.setValue(this.modifier.y);
            this.scaleXCtrl.setValue(this.modifier.scaleX);
            this.scaleYCtrl.setValue(this.modifier.scaleY);
        }
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
        if (this.textDraggerCtrl.dragging) {
            var val = this.textDraggerCtrl.getValue();
            xcomp.setValue(val.x);
            ycomp.setValue(val.y);
        }
        this.modifier.x=xcomp.getValue();
        this.modifier.y=ycomp.getValue();

        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');
        this.modifier.fontInfo.family = fontComp.getValue();

        if (this.paginationsComponent.changeFlag) {
            this.modifier.pagination = this.paginationsComponent.getValue();
        }

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
        this.undo = parameters.controller.undoBuffer;
        this.textElement=$(this.layout.context.svg).find('.' + parameters.modifier.attrs.id)[0];
        this.modifier.backupParams();
	}
    _complete() {
        this.tracker.updateMap(); // update the text map
        this.layout.setDirty();
        this.complete();
    }
    _bindElements() {
        var self = this;
        this.bindKeyboard();
		var dgDom = this.dgDom;
        var fontComp = this.components.find((c) => c.smoName === 'fontFamily');

        fontComp.setValue(this.modifier.fontInfo.family);


		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.textEditorCtrl.endSession();
            self.textDraggerCtrl.endSession();
			self._complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self.textEditorCtrl.endSession();
            self.textDraggerCtrl.endSession();
            self.modifier.restoreParams();
			self._complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
            self.textEditorCtrl.endSession();
            self.textDraggerCtrl.endSession();
            SmoUndoable.scoreOp(self.layout.score,'removeScoreText',self.modifier,self.undo,'remove text from dialog');
			self._complete();
		});
    }
}
