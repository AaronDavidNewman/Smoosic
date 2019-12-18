class SuiStaffModifierDialog extends SuiDialogBase {
	 handleRemove() {
        $(this.context.svg).find('g.' + this.modifier.id).remove();
        SmoUndoable.staffSelectionOp(this.layout.score,this.selection,'removeStaffModifier',this.modifier,this.undo,'remove slur');
        this.tracker.clearModifierSelections();
    }

    _preview() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier)
    }

    changed() {
        this.modifier.backupOriginal();
        this.components.forEach((component) => {
            this.modifier[component.smoName] = component.getValue();
        });
        this.layout.renderStaffModifierPreview(this.modifier);
    }
}

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
			smoName: 'duration',
			defaultValue: '4096',
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
			smoName:'applyToAll',
			parameterName:'applyToAll',
			defaultValue: false,
			control:'SuiToggleComponent',
			label:'Apply to all future measures?'
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
        var measures = SmoSelection.getMeasureList(controller.tracker.selections);
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
            label: 'Tempo Properties'
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
        this.layout.setDirty();
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
        this.controller.unbindKeyboardForDialog(this);
    }
}

class SuiSlurAttributesDialog extends SuiStaffModifierDialog {
    static get dialogElements() {
        return [{
                parameterName: 'spacing',
                smoName: 'spacing',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Spacing'
            }, {
                smoName: 'thickness',
                parameterName: 'thickness',
                defaultValue: 2,
                control: 'SuiRockerComponent',
                label: 'Thickness'
            }, {
                smoName: 'xOffset',
                parameterName: 'xOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Y Offset'
            }, {
                smoName: 'position',
                parameterName: 'position',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'Start Position'
            }, {
                smoName: 'position_end',
                parameterName: 'position_end',
                defaultValue: SmoSlur.positions.HEAD,
                options: [{
                        value: SmoSlur.positions.HEAD,
                        label: 'Head'
                    }, {
                        value: SmoSlur.positions.TOP,
                        label: 'Top'
                    }
                ],
                control: 'SuiDropdownComponent',
                label: 'End Position'
            }, {
                smoName: 'invert',
                parameterName: 'invert',
                defaultValue: false,
                control: 'SuiToggleComponent',
                label: 'Invert'
            }, {
                parameterName: 'cp1x',
                smoName: 'cp1x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 X'
            }, {
                parameterName: 'cp1y',
                smoName: 'cp1y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 1 Y'
            }, {
                parameterName: 'cp2x',
                smoName: 'cp2x',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 X'
            }, {
                parameterName: 'cp2y',
                smoName: 'cp2y',
                defaultValue: 40,
                control: 'SuiRockerComponent',
                label: 'Control Point 2 Y'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiSlurAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and selection');
        }

        super(SuiSlurAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Slur Properties'
        });
        Vex.Merge(this, parameters);
    }
}

class SuiVoltaAttributeDialog extends SuiStaffModifierDialog {
	 static get dialogElements() {
        return [{
                parameterName: 'number',
                smoName: 'number',
                defaultValue: 1,
                control: 'SuiRockerComponent',
                label: 'number'
            }, {
                smoName: 'xOffsetStart',
                parameterName: 'xOffsetStart',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X1 Offset'
            }, {
                smoName: 'xOffsetEnd',
                parameterName: 'xOffsetEnd',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'X2 Offset'
            }, {
                smoName: 'yOffset',
                parameterName: 'yOffset',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Offset'
            }
        ];
	 }
	 static createAndDisplay(parameters) {
        var dg = new SuiVoltaAttributeDialog(parameters);
        dg.display();
        return dg;
    }
	handleRemove() {
        this.undo.addBuffer('Remove nth ending', 'score', null, this.layout.score);
		this.layout.score.staves.forEach((staff) => {
			staff.measures.forEach((measure) => {
				if (measure.measureNumber.measureNumber === this.modifier.startBar) {
					measure.removeNthEnding(this.modifier.number);
				}
			});
		});
        $(this.context.svg).find('g.' + this.modifier.endingId).remove();
        this.selection.staff.removeStaffModifier(this.modifier);
   }
	_commit() {
        this.modifier.restoreOriginal();
		this.layout.score.staves.forEach((staff) => {
			staff.measures.forEach((measure) => {
				if (measure.measureNumber.measureNumber === this.modifier.startBar) {
					 var endings = measure.getNthEndings().filter((mm) => {
						 return mm.endingId === this.modifier.endingId;
					 });
					 if (endings.length) {
						 endings.forEach((ending) => {
							 this.components.forEach((component) => {
								ending[component.smoName] = component.getValue();
							 });
						 });
					 }
				}
			});
		});

        this.layout.renderStaffModifierPreview(this.modifier);
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiVoltaAttributeDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties'
        });
        Vex.Merge(this, parameters);
		SmoVolta.editableAttributes.forEach((attr) => {
			var comp = this.components.find((cc)=>{return cc.smoName===attr});
			if (comp) {
				comp.defaultValue=this.modifier[attr];
			}
		});
    }
}
class SuiHairpinAttributesDialog extends SuiStaffModifierDialog {
    static get label() {
        return 'Hairpin Properties';
    }
    static get dialogElements() {
        return [{
                parameterName: 'height',
                smoName: 'height',
                defaultValue: 10,
                control: 'SuiRockerComponent',
                label: 'Height'
            }, {
                smoName: 'yOffset',
                parameterName: 'y_shift',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Y Shift'
            }, {
                smoName: 'xOffsetRight',
                parameterName: 'right_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Right Shift'
            }, {
                smoName: 'xOffsetLeft',
                parameterName: 'left_shift_px',
                defaultValue: 0,
                control: 'SuiRockerComponent',
                label: 'Left Shift'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiHairpinAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        if (!parameters.modifier || !parameters.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }

        super(SuiHairpinAttributesDialog.dialogElements, {
            id: 'dialog-' + parameters.modifier.id,
            top: parameters.modifier.renderedBox.y,
            left: parameters.modifier.renderedBox.x,
            label: 'Hairpin Properties'
        });
        Vex.Merge(this, parameters);
		SmoStaffHairpin.editableAttributes.forEach((attr) => {
			var comp = this.components.find((cc)=>{return cc.smoName===attr});
			if (comp) {
				comp.defaultValue=this.modifier[attr];
			}
		});
    }
}
