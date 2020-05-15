// ## measureDialogs.js
// This file contains dialogs that affect all measures at a certain position,
// such as tempo or time signature.

class SuiMeasureDialog extends SuiDialogBase {
    static get attributes() {
        return ['pickupMeasure', 'makePickup', 'padLeft', 'padAllInSystem',
            'measureText','measureTextPosition'];
    }
    static get dialogElements() {
        return [{
            smoName: 'pickupMeasure',
            parameterName: 'pickupMeasure',
            defaultValue: 2048,
            control: 'SuiDropdownComponent',
            label:'Pickup Measure',
            options: [{
                    value: 2048,
                    label: 'Eighth Note'
                }, {
                    value: 4096,
                    label: 'Quarter Note'
                }, {
                    value: 6144,
                    label: 'Dotted Quarter'
                }, {
                    value: 8192,
                    label: 'Half Note'
                }
                ]
			}, {
    			smoName:'makePickup',
    			parameterName:'makePickup',
    			defaultValue: false,
    			control:'SuiToggleComponent',
    			label:'Convert to Pickup Measure'
    		},{
                parameterName: 'padLeft',
                smoName: 'padLeft',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Pad Left (px)'
            },{
                parameterName: 'customStretch',
                smoName: 'customStretch',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Stretch Contents'
            },{
                parameterName: 'customProportion',
                smoName: 'customProportion',
                defaultValue: SmoMeasure.defaults.customProportion,
                control: 'SuiRockerComponent',
                increment:10,
                label: 'Adjust Proportional Spacing'
            },{
    			smoName:'padAllInSystem',
    			parameterName:'padAllInSystem',
    			defaultValue: false,
    			control:'SuiToggleComponent',
    			label:'Pad all measures in system'
    		},{
    				smoName: 'measureText',
    				parameterName: 'measureText',
    				defaultValue: '',
    				control: 'SuiTextInputComponent',
    				label:'Measure Text'
    		},{
                smoName: 'measureTextPosition',
                parameterName: 'measureTextPosition',
                defaultValue: SmoMeasureText.positions.above,
                control: 'SuiDropdownComponent',
                label:'Text Position',
                options: [{
                        value: SmoMeasureText.positions.left,
                        label: 'Left'
                    }, {
                        value: SmoMeasureText.positions.right,
                        label: 'Right'
                    }, {
                        value:SmoMeasureText.positions.above,
                        label: 'Above'
                    }, {
                        value: SmoMeasureText.positions.below,
                        label: 'Below'
                    }
                    ]
    			},{
        			smoName:'systemBreak',
        			parameterName:'systemBreak',
        			defaultValue: false,
        			control:'SuiToggleComponent',
        			label: 'System break before this measure'
        		}
        ];
    }
    static createAndDisplay(ignore1,ignore2,controller) {
        // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
        var selection = controller.tracker.selections[0];
        var measure = selection.measure;
        var measureIndex = measure.measureNumber.measureIndex;

        var dg = new SuiMeasureDialog({
            measure: measure,
            measureIndex: measureIndex,
            undoBuffer:controller.undoBuffer,
            layout: controller.tracker.layout,
            tracker:controller.tracker,
            controller:controller,
            selection:selection
          });
        dg.display();
        return dg;
    }
    changed() {
        if (this.pickupMeasureCtrl.changeFlag || this.pickupMeasureCtrl.changeFlag) {
            this.layout.unrenderColumn(this.measure);
            SmoUndoable.scoreOp(this.layout.score,'convertToPickupMeasure',this.pickupMeasureCtrl.getValue(),this.undoBuffer,'Create pickup measure');
            this.selection = SmoSelection.measureSelection(this.layout.score,this.selection.selector.staff,this.selection.selector.measure);
            this.tracker.replaceSelectedMeasures();
            this.measure = this.selection.measure;
        }
        if (this.customStretchCtrl.changeFlag) {
            var delta = this.measure.customStretch;
            this.measure.customStretch = this.customStretchCtrl.getValue();
            this.measure.setWidth(this.measure.staffWidth - (delta - this.measure.customStretch));
            this.tracker.replaceSelectedMeasures();
        }
        if (this.customProportionCtrl.changeFlag) {
            this.measure.customProportion = this.customProportionCtrl.getValue();
            this.tracker.replaceSelectedMeasures();
        }
        if (this.systemBreakCtrl.changeFlag) {
            SmoUndoable.scoreSelectionOp(this.layout.score,
                this.tracker.selections[0],'setForceSystemBreak',this.systemBreakCtrl.getValue(),
                  this.undoBuffer,'change system break flag');
            this.layout.setRefresh();
        }
        if (this.padLeftCtrl.changeFlag || this.padAllInSystemCtrl.changeFlag) {
            this.layout.unrenderColumn(this.measure);
            var selections = this.padAllInSystemCtrl.getValue() ?
               SmoSelection.measuresInColumn(this.layout.score,this.selection.measure.measureNumber.measureIndex) :
               SmoSelection.measureSelection(this.layout.score,this.selection.selector.staff,this.selection.selector.measure);
            SmoUndoable.padMeasuresLeft(selections,this.padLeftCtrl.getValue(),this.undoBuffer);
            this.tracker.replaceSelectedMeasures();
        }
        if (this.measureTextCtrl.changeFlag || this.measureTextPositionCtrl.changeFlag) {
            var position = this.measureTextPositionCtrl.getValue();
            var text = this.measureTextCtrl.getValue();
            if (text.length == 0) {
                var tms = this.selection.measure.getMeasureText();
                tms.forEach((tm) => {
                    SmoUndoable.measureSelectionOp(this.layout.score,
                        this.selection,'removeMeasureText',tm,this.undoBuffer,'Remove measure text');
                });

            } else {
                var mt = new SmoMeasureText({position:parseInt(position),text:this.measureTextCtrl.getValue()});
                SmoUndoable.measureSelectionOp(this.layout.score,this.selection,'addMeasureText',mt,this.undoBuffer,'Add measure text');
            }
            this.tracker.replaceSelectedMeasures();
        }
        //
        this._updateConditionals();
    }
    constructor(parameters) {
        if (!parameters.measure || !parameters.selection) {
            throw new Error('measure dialogmust have measure and selection');
        }

        super(SuiMeasureDialog.dialogElements, {
            id: 'dialog-measure',
            top: parameters.measure.renderedBox.y,
            left: parameters.measure.renderedBox.x,
            label: 'Measure Properties',
			tracker:parameters.controller.tracker
        });
        this.refresh = false;
        Vex.Merge(this, parameters);
        this.modifier = this.measure;
    }
    _updateConditionals() {
        if (this.padLeftCtrl.getValue() != 0 || this.padLeftCtrl.changeFlag) {
            $('.attributeDialog .attributeModal').addClass('pad-left-select');
        } else {
            $('.attributeDialog .attributeModal').removeClass('pad-left-select');
        }

        if (this.pickupMeasureCtrl.getValue()) {
            $('.attributeDialog .attributeModal').addClass('pickup-select');
        } else {
            $('.attributeDialog .attributeModal').removeClass('pickup-select');
        }
        var str = this.measureTextCtrl.getValue();
        if (str && str.length) {
            $('.attributeDialog .attributeModal').addClass('measure-text-set');
        } else {
            $('.attributeDialog .attributeModal').removeClass('measure-text-set');
        }
    }
    populateInitial() {
        this.padLeftCtrl.setValue(this.measure.padLeft);
        this.originalStretch = this.measure.customStretch;
        this.originalProportion = this.measure.customProportion;
        var isPickup = this.measure.isPickup();
        this.customStretchCtrl.setValue(this.measure.customStretch);
        this.customProportionCtrl.setValue(this.measure.customProportion);
        this.pickupMeasureCtrl.setValue(isPickup);
        if (isPickup) {
            this.pickupMeasureCtrl.setValue(this.measure.getTicksFromVoice())
        }

        var isSystemBreak = this.measure.getForceSystemBreak();
        this.systemBreakCtrl.setValue(isSystemBreak);
        this._updateConditionals();

        // TODO: handle multiples (above/below)
        var texts = this.measure.getMeasureText();
        if (texts.length) {
            this.measureTextCtrl.setValue(texts[0].text);
            this.measureTextPositionCtrl.setValue(texts[0].position);
        }
    }
    _cancelEdits() {
        this.measure.customStretch = this.originalStretch;
        this.measure.customProportion = this.originalProportion;
        this.layout.setRefresh();
    }
    _bindElements() {
		var self = this;
		var dgDom = this.dgDom;
        this.bindKeyboard();
        this.controller.unbindKeyboardForModal(this);
        this._bindComponentNames();
        this.populateInitial();

		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.controller.tracker.replaceSelectedMeasures();
			self.complete();
		});

		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
            self._cancelEdits();
			self.complete();
		});
		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
			self.complete();
		});
	}
}
class SuiTimeSignatureDialog extends SuiDialogBase {
    static get dialogElements() {
        return [{
            smoName: 'numerator',
            parameterName: 'numerator',
            defaultValue: 3,
            control: 'SuiRockerComponent',
            label:'Beats/Measure',
            },
		{
			parameterName: 'denominator',
			smoName: 'denominator',
			defaultValue: 8,
            dataType:'int',
			control: 'SuiDropdownComponent',
			label: 'Beat Value',
			options: [{
					value: 8,
					label: '8',
				}, {
					value: 4,
					label: '4'
				}, {
					value: 2,
					label: '2'
				}
			]
		} ];
     }
     populateInitial() {
         var num,den;
         var nd = this.measure.timeSignature.split('/');
         var num = parseInt(nd[0]);
         var den = parseInt(nd[1]);

         this.numeratorCtrl.setValue(num);
         this.denominatorCtrl.setValue(den);
     }

    changed() {
        // no dynamic change for time  signatures
    }
     static createAndDisplay(params) {
         // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
         //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');

         var dg = new SuiTimeSignatureDialog({
             selections: params.controller.tracker.selections,
             undoBuffer: params.controller.undoBuffer,
             layout: params.controller.tracker.layout,
             controller:params.controller,
             closeMenuPromise:params.closeMenuPromise
           });
         dg.display();
         return dg;
     }
     changeTimeSignature() {
         var ts = '' + this.numeratorCtrl.getValue() + '/'+this.denominatorCtrl.getValue();
         SmoUndoable.multiSelectionOperation(this.tracker.layout.score,
             this.tracker.selections,
             'setTimeSignature',ts,this.undoBuffer);
          this.tracker.replaceSelectedMeasures();
     }
     _bindElements() {
         var self = this;
 		var dgDom = this.dgDom;
         this.numeratorCtrl = this.components.find((comp) => {return comp.smoName == 'numerator';});
         this.denominatorCtrl = this.components.find((comp) => {return comp.smoName == 'denominator';});
         this.populateInitial();

 		$(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
            self.changeTimeSignature();
 			self.complete();
 		});

 		$(dgDom.element).find('.cancel-button').off('click').on('click', function (ev) {
 			self.complete();
 		});
 		$(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
 			self.complete();
 		});
     }
     display() {
         $('body').addClass('showAttributeDialog');
         this.components.forEach((component) => {
             component.bind();
         });
         this._bindElements();
         this.position(this.measure.renderedBox);
         this.tracker.scroller.scrollVisibleBox(
             svgHelpers.smoBox($(this.dgDom.element)[0].getBoundingClientRect())
         );


         var cb = function (x, y) {}
         htmlHelpers.draggable({
             parent: $(this.dgDom.element).find('.attributeModal'),
             handle: $(this.dgDom.element).find('.jsDbMove'),
              animateDiv:'.draganime',
             cb: cb,
             moveParent: true
         });

         var self=this;
         function getKeys() {
             self.controller.unbindKeyboardForModal(self);
         }
         this.startPromise.then(getKeys);
     }
     constructor(parameters) {
         var measure = parameters.selections[0].measure;

         super(SuiTimeSignatureDialog.dialogElements, {
             id: 'time-signature-measure',
             top: measure.renderedBox.y,
             left: measure.renderedBox.x,
             label: 'Custom Time Signature',
 			 tracker:parameters.controller.tracker
         });
         this.measure = measure;
         this.refresh = false;
         this.startPromise=parameters.closeMenuPromise;
         Vex.Merge(this, parameters);
     }
 }


// ## SuiTempoDialog
// Allow user to choose a tempo or tempo change.
class SuiTempoDialog extends SuiDialogBase {
    static get attributes() {
        return ['tempoMode', 'bpm', 'beatDuration', 'tempoText','yOffset'];
    }
    static get dialogElements() {
        return [{
            smoName: 'tempoMode',
            parameterName: 'tempoMode',
            defaultValue: SmoTempoText.tempoModes.durationMode,
            control: 'SuiDropdownComponent',
            label:'Tempo Mode',
            options: [{
                    value: 'duration',
                    label: 'Duration (Beats/Minute)'
                }, {
                    value: 'text',
                    label: 'Tempo Text'
                }, {
                    value: 'custom',
                    label: 'Specify text and duration'
                }
                ]
			},
			{
                parameterName: 'bpm',
                smoName: 'bpm',
                defaultValue: 120,
                control: 'SuiRockerComponent',
                label: 'Notes/Minute'
            },
		{
			parameterName: 'duration',
			smoName: 'beatDuration',
			defaultValue: 4096,
            dataType:'int',
			control: 'SuiDropdownComponent',
			label: 'Unit for Beat',
			options: [{
					value: 4096,
					label: 'Quarter Note',
				}, {
					value: 2048,
					label: '1/8 note'
				}, {
					value: 6144,
					label: 'Dotted 1/4 note'
				}, {
					value: 8192,
					label: '1/2 note'
				}
			]
		},

            {
            smoName: 'tempoText',
            parameterName: 'tempoText',
            defaultValue: SmoTempoText.tempoTexts.allegro,
            control: 'SuiDropdownComponent',
            label:'Tempo Text',
            options: [{
                value: SmoTempoText.tempoTexts.larghissimo,
                label: 'Larghissimo'
              }, {
                value: SmoTempoText.tempoTexts.grave,
                label: 'Grave'
              }, {
                value: SmoTempoText.tempoTexts.lento,
                label: 'Lento'
              }, {
                value: SmoTempoText.tempoTexts.largo,
                label: 'Largo'
              }, {
                value: SmoTempoText.tempoTexts.larghetto,
                label: 'Larghetto'
              }, {
                value: SmoTempoText.tempoTexts.adagio,
                label: 'Adagio'
              }, {
                value: SmoTempoText.tempoTexts.adagietto,
                label: 'Adagietto'
              }, {
                value: SmoTempoText.tempoTexts.andante_moderato,
                label: 'Andante moderato'
              }, {
                value: SmoTempoText.tempoTexts.andante,
                label: 'Andante'
              }, {
                value: SmoTempoText.tempoTexts.andantino,
                label: 'Andantino'
              }, {
                value: SmoTempoText.tempoTexts.moderator,
                label: 'Moderato'
              }, {
                value: SmoTempoText.tempoTexts.allegretto,
                label: 'Allegretto',
              } ,{
                value: SmoTempoText.tempoTexts.allegro,
                label: 'Allegro'
              }, {
                value: SmoTempoText.tempoTexts.vivace,
                label: 'Vivace'
              }, {
                value: SmoTempoText.tempoTexts.presto,
                label: 'Presto'
              }, {
                value: SmoTempoText.tempoTexts.prestissimo,
                label: 'Prestissimo'
              }
            ]
        },{
			smoName:'applyToAll',
			parameterName:'applyToAll',
			defaultValue: false,
			control:'SuiToggleComponent',
			label:'Apply to all future measures?'
		},{
                smoName: 'display',
                parameterName: 'display',
                defaultValue: true,
                control: 'SuiToggleComponent',
                label: 'Display Tempo'
            },
        ]
    }
    static createAndDisplay(ignore1,ignore2,controller) {
        // SmoUndoable.scoreSelectionOp(score,selection,'addTempo',
        //      new SmoTempoText({bpm:144}),undo,'tempo test 1.3');
        var measures = SmoSelection.getMeasureList(controller.tracker.selections)
           .map((sel) => sel.measure);
        var existing = measures[0].getTempo();
        if (!existing) {
            existing = new SmoTempoText();
            measures[0].addTempo(existing);
        }
        if (!existing.renderedBox) {
            existing.renderedBox = svgHelpers.copyBox(measures[0].renderedBox);
        }
        var dg = new SuiTempoDialog({
            measures: measures,
            modifier: existing,
            undoBuffer:controller.undoBuffer,
            layout: controller.tracker.layout,
            controller:controller
          });
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.measures) {
            throw new Error('modifier attribute dialog must have modifier and selection');
        }

        super(SuiTempoDialog.dialogElements, {
            id: 'dialog-tempo',
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Tempo Properties',
			tracker:parameters.controller.tracker
        });
        this.refresh = false;
        Vex.Merge(this, parameters);
    }
    populateInitial() {
        SmoTempoText.attributes.forEach((attr) => {
            var comp = this.components.find((cc) => {
                return cc.smoName == attr;
            });
            if (comp) {
                comp.setValue(this.modifier[attr]);
            }
        });
		this._updateModeClass();
    }
	_updateModeClass() {
        if (this.modifier.tempoMode == SmoTempoText.tempoModes.textMode) {
			$('.attributeModal').addClass('tempoTextMode');
			$('.attributeModal').removeClass('tempoDurationMode');
        } else if (this.modifier.tempoMode == SmoTempoText.tempoModes.durationMode) {
			$('.attributeModal').addClass('tempoDurationMode');
			$('.attributeModal').removeClass('tempoTextMode');
		} else {
			$('.attributeModal').removeClass('tempoDurationMode');
			$('.attributeModal').removeClass('tempoTextMode');
		}
	}
    changed() {
        this.components.forEach((component) => {
			if (SmoTempoText.attributes.indexOf(component.smoName) >= 0) {
                this.modifier[component.smoName] = component.getValue();
			}
        });
        if (this.modifier.tempoMode == SmoTempoText.tempoModes.textMode) {
            this.modifier.bpm = SmoTempoText.bpmFromText[this.modifier.tempoText];
        }
		this._updateModeClass();
        this.refresh = true;
    }
    // ### handleFuture
    // Update other measures in selection, or all future measures if the user chose that.
    handleFuture() {
        var fc = this.components.find((comp) => {return comp.smoName == 'applyToAll'});
        var toModify = [];
        if (fc.getValue()) {
            this.layout.score.staves.forEach((staff) => {
                var toAdd = staff.measures.filter((mm) => {
                    return mm.measureNumber.measureIndex >= this.measures[0].measureNumber.measureIndex;
                });
                toModify = toModify.concat(toAdd);
            });
        } else {
            this.measures.forEach((measure) => {
                this.layout.score.staves.forEach((staff) => {
                    toModify.push(staff.measures[measure.measureNumber.measureIndex]);
                });
            });
        }
        toModify.forEach((measure) => {
            measure.changed = true;
            var tempo = SmoMeasureModifierBase.deserialize(this.modifier.serialize());
            tempo.attrs.id = VF.Element.newID();
            measure.addTempo(tempo);
        });
        this.controller.tracker.replaceSelectedMeasures();
    }
    // ### handleRemove
    // Removing a tempo change is like changing the measure to the previous measure's tempo.
    // If this is the first measure, use the default value.
    handleRemove() {
        if (this.measures[0].measureNumber.measureIndex > 0) {
            var target = this.measures[0].measureNumber.measureIndex - 1;
            this.modifier = this.layout.score.staves[0].measures[target].getTempo();
            this.handleFuture();
        } else {
            this.modifier = new SmoTempoText();
        }
        this.handleFuture();
    }
    // ### _backup
    // Backup the score before changing tempo which affects score.
    _backup() {
        if (this.refresh) {
            SmoUndoable.noop(this.layout.score,this.undoBuffer,'Tempo change');
            this.layout.setDirty();
        }
    }
    // ### Populate the initial values and bind to the buttons.
    _bindElements() {
        var self = this;
        this.populateInitial();
		var dgDom = this.dgDom;
        // Create promise to release the keyboard when dialog is closed
        this.closeDialogPromise = new Promise((resolve) => {
            $(dgDom.element).find('.cancel-button').remove();
            $(dgDom.element).find('.ok-button').off('click').on('click', function (ev) {
                self._backup();
                self.handleFuture();
                self.complete();
                resolve();
            });
            $(dgDom.element).find('.remove-button').off('click').on('click', function (ev) {
                self._backup();
                self.handleRemove();
                self.complete();
                resolve();
            });
        });
        this.controller.unbindKeyboardForModal(this);
    }
}
