class SuiStaffModifierDialog extends SuiDialogBase {
	 handleRemove() {
      $(this.context.svg).find('g.' + this.modifier.attrs.id).remove();
      var selection = SmoSelection.measureSelection(this.layout.score,this.modifier.startSelector.staff,this.modifier.startSelector.measure);
      SmoUndoable.staffSelectionOp(this.layout.score,selection,'removeStaffModifier',this.modifier,this.undoBuffer,'remove slur');
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
    if (!parameters.modifier) {
        throw new Error('modifier attribute dialog must have modifier');
    }

    super(SuiSlurAttributesDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.attrs.id,
      top: parameters.modifier.renderedBox.y,
      left: parameters.modifier.renderedBox.x,
      label: 'Slur Properties',
     ...parameters
    });
    Vex.Merge(this, parameters);
    this.completeNotifier.unbindKeyboardForModal(this);
  }
  populateInitial() {
    this.components.forEach((comp) => {
      if (typeof(this.modifier[comp.smoName]) != 'undefined') {
        comp.setValue(this.modifier[comp.smoName]);
      }
    });
  }
  display() {
    super.display();
    this.populateInitial();
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
  this.undoBuffer.addBuffer('Remove nth ending', 'score', null, this.layout.score);
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
    if (!parameters.modifier) {
        throw new Error('modifier attribute dialog must have modifier');
    }

    super(SuiVoltaAttributeDialog.dialogElements, {
        id: 'dialog-' + parameters.modifier.attrs.id,
        top: parameters.modifier.renderedBox.y,
        left: parameters.modifier.renderedBox.x,
        label: 'Hairpin Properties',
        ...parameters
    });
    Vex.Merge(this, parameters);
    this.selection = SmoSelection.measureSelection(this.layout.score,this.modifier.startSelector.staff,this.modifier.startSelector.measure);

  	SmoVolta.editableAttributes.forEach((attr) => {
  		var comp = this.components.find((cc)=>{return cc.smoName===attr});
  		if (comp) {
  			comp.defaultValue=this.modifier[attr];
  		}
  	});

    this.completeNotifier.unbindKeyboardForModal(this);
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
    if (!parameters.modifier) {
        throw new Error('modifier attribute dialog must have modifier');
    }

    super(SuiHairpinAttributesDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.attrs.id,
      top: parameters.modifier.renderedBox.y,
      left: parameters.modifier.renderedBox.x,
      label: 'Hairpin Properties',
      ...parameters
    });
    Vex.Merge(this, parameters);
  	SmoStaffHairpin.editableAttributes.forEach((attr) => {
  		var comp = this.components.find((cc)=>{return cc.smoName===attr});
  		if (comp) {
  			comp.defaultValue=this.modifier[attr];
  		}
  	});

    this.completeNotifier.unbindKeyboardForModal(this);
  }
}
