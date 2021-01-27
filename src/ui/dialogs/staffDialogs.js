// ## SuiStaffModifierDialog
// Edit the attributes of a staff modifier (connects notes in the same staff)
// eslint-disable-next-line no-unused-vars
class SuiStaffModifierDialog extends SuiDialogBase {
  constructor(elements, params) {
    super(elements, params);
    this.original = StaffModifierBase.deserialize(params.modifier);
    this.edited = false;
    this.view.groupUndo(true);
  }

  handleRemove() {
    this.view.removeStaffModifier(this.modifier);
  }

  changed() {
    this.edited = true;
    this.components.forEach((component) => {
      this.modifier[component.smoName] = component.getValue();
    });
    this.view.addOrUpdateStaffModifier(this.original, this.modifier);
    this.original = this.modifier;
  }

  // ### _bindElements
  // bing the generic controls in most dialogs.
  _bindElements() {
    var dgDom = this.dgDom;
    this.bindKeyboard();

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      if (this.edited) {
        this.view.undo();
      }
      this.complete();
    });
    $(dgDom.element).find('.remove-button').off('click').on('click', () => {
      this.view.groupUndo(false);
      this.handleRemove();
      this.complete();
    });
  }
}

// eslint-disable-next-line no-unused-vars
class SuiSlurAttributesDialog extends SuiStaffModifierDialog {
  get ctor() {
    return SuiSlurAttributesDialog.ctor;
  }
  static get ctor() {
    return 'SuiSlurAttributesDialog';
  }

  static get dialogElements() {
    SuiSlurAttributesDialog._dialogElements = SuiSlurAttributesDialog._dialogElements ? SuiSlurAttributesDialog._dialogElements :
      [{
        staticText: [
          { label: 'Slur Properties' }
        ]
      }, {
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
        }],
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
        }],
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
      }];
    return SuiSlurAttributesDialog._dialogElements;
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
      if (typeof(this.modifier[comp.smoName]) !== 'undefined') {
        comp.setValue(this.modifier[comp.smoName]);
      }
    });
  }
  display() {
    super.display();
    this.populateInitial();
  }
}

// eslint-disable-next-line no-unused-vars
class SuiTieAttributesDialog extends SuiStaffModifierDialog {
  get ctor() {
    return SuiTieAttributesDialog.ctor;
  }
  static get ctor() {
    return 'SuiTieAttributesDialog';
  }

  static get dialogElements() {
    SuiTieAttributesDialog._dialogElements = SuiTieAttributesDialog._dialogElements ? SuiTieAttributesDialog._dialogElements :
      [{
        staticText: [
          { label: 'Tie Properties' },
          { fromNote: 'From Note' },
          { toNote: 'To Note' }
        ]
      }, {
        parameterName: 'lines',
        smoName: 'lines',
        defaultValue: [],
        control: 'TieMappingComponent',
        label: 'Lines'
      }];
    return SuiTieAttributesDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    var dg = new SuiTieAttributesDialog(parameters);
    dg.display();
    return dg;
  }
  staticText(label) {
    return SuiDialogBase.getStaticText(SuiTieAttributesDialog.dialogElements, label);
  }
  constructor(parameters) {
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }

    super(SuiTieAttributesDialog.dialogElements, {
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
    this.linesCtrl.setValue(this.modifier);
  }
  changed() {
    if (this.linesCtrl.changeFlag) {
      this.modifier.lines = JSON.parse(JSON.stringify(this.linesCtrl.getValue()));
      this.view.addOrUpdateStaffModifier(this.original, this.modifier);
      this.original = this.modifier;
      this.edited = true;
    }
  }
  display() {
    super.display();
    this._bindComponentNames();
    this.populateInitial();
  }
}

// ## SuiVoltaAttributeDialog
// aka first and second endings
// eslint-disable-next-line no-unused-vars
class SuiVoltaAttributeDialog extends SuiStaffModifierDialog {
  get ctor() {
    return SuiVoltaAttributeDialog.ctor;
  }
  static get ctor() {
    return 'SuiVoltaAttributeDialog';
  }
  static get label() {
    SuiVoltaAttributeDialog._label = SuiVoltaAttributeDialog._label ?
      SuiVoltaAttributeDialog._label : 'Volta Properties';
    return SuiVoltaAttributeDialog._label;
  }
  static set label(value) {
    SuiVoltaAttributeDialog._label = value;
  }

  static get dialogElements() {
    SuiVoltaAttributeDialog._dialogElements = SuiVoltaAttributeDialog._dialogElements ? SuiVoltaAttributeDialog._dialogElements :
      [{
        staticText: [
          { label: 'Volta Properties' }
        ]
      }, {
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
      }];
    return SuiVoltaAttributeDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiVoltaAttributeDialog(parameters);
    dg.display();
    return dg;
  }
  handleRemove() {
    this.view.removeEnding(this.modifier);
  }
  changed() {
    this.components.forEach((component) => {
      this.modifier[component.smoName] = component.getValue();
    });
    this.view.updateEnding(this.modifier);
  }
  constructor(parameters) {
    if (!parameters.modifier) {
      throw new Error('modifier attribute dialog must have modifier');
    }

    super(SuiVoltaAttributeDialog.dialogElements, {
      id: 'dialog-' + parameters.modifier.attrs.id,
      top: parameters.modifier.renderedBox.y,
      left: parameters.modifier.renderedBox.x,
      ...parameters
    });
    Vex.Merge(this, parameters);
    this.selection = SmoSelection.measureSelection(this.view.score, this.modifier.startSelector.staff, this.modifier.startSelector.measure);

    SmoVolta.editableAttributes.forEach((attr) => {
      const comp = this.components.find((cc) => cc.smoName === attr);
      if (comp) {
        comp.defaultValue = this.modifier[attr];
      }
    });

    this.completeNotifier.unbindKeyboardForModal(this);
  }
}
// eslint-disable-next-line no-unused-vars
class SuiHairpinAttributesDialog extends SuiStaffModifierDialog {
  get ctor() {
    return SuiHairpinAttributesDialog.ctor;
  }
  static get ctor() {
    return 'SuiHairpinAttributesDialog';
  }

  static get label() {
    SuiHairpinAttributesDialog._label = SuiHairpinAttributesDialog._label ? SuiHairpinAttributesDialog._label
      : 'Hairpin Properties';
    return SuiHairpinAttributesDialog._label;
  }
  static set label(value) {
    SuiHairpinAttributesDialog._label = value;
  }
  static get dialogElements() {
    SuiHairpinAttributesDialog._dialogElements = SuiHairpinAttributesDialog._dialogElements ? SuiHairpinAttributesDialog._dialogElements :
      [{
        staticText: [
          { label: 'Hairpin Properties' }
        ]
      }, {
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
      }];

    return SuiHairpinAttributesDialog._dialogElements;
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
      ...parameters
    });
    Vex.Merge(this, parameters);
    SmoStaffHairpin.editableAttributes.forEach((attr) => {
      var comp = this.components.find((cc) => cc.smoName === attr);
      if (comp) {
        comp.defaultValue = this.modifier[attr];
      }
    });
    this.completeNotifier.unbindKeyboardForModal(this);
  }
}
// ## SuiStaffGroupDialog
// A staff group is a grouping of staves that can be bracketed and justified
// eslint-disable-next-line no-unused-vars
class SuiStaffGroupDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiStaffGroupDialog';
  }
  get ctor() {
    return SuiStaffGroupDialog.ctor;
  }
  static get dialogElements() {
    SuiStaffGroupDialog._dialogElements = typeof(SuiStaffGroupDialog._dialogElements)
      !== 'undefined' ? SuiStaffGroupDialog._dialogElements :
      [{
        smoName: 'staffGroups',
        parameterName: 'staffGroups',
        defaultValue: {},
        control: 'StaffAddRemoveComponent',
        label: 'Staves in Group',
      }, {
        smoName: 'leftConnector',
        parameterName: 'leftConnector',
        defaultValue: SmoScore.pageSizes.letter,
        control: 'SuiDropdownComponent',
        label: 'Left Connector',
        options: [
          {
            value: SmoSystemGroup.connectorTypes.bracket,
            label: 'Bracket'
          }, {
            value: SmoSystemGroup.connectorTypes.brace,
            label: 'Brace'
          }, {
            value: SmoSystemGroup.connectorTypes.single,
            label: 'Single'
          }, {
            value: SmoSystemGroup.connectorTypes.double,
            label: 'Double'
          }]
      }, {
        staticText: [
          { label: 'Staff Group' },
          { includeStaff: 'Include Staff' }
        ]
      }];
    return SuiStaffGroupDialog._dialogElements;
  }
  static createAndDisplay(parameters) {
    const dg = new SuiStaffGroupDialog(parameters);
    dg.display();
  }
  display() {
    $('body').addClass('showAttributeDialog');
    this.components.forEach((component) => {
      component.bind();
    });
    const cb = () => {};
    htmlHelpers.draggable({
      parent: $(this.dgDom.element).find('.attributeModal'),
      handle: $(this.dgDom.element).find('.icon-move'),
      animateDiv: '.draganime',
      cb,
      moveParent: true
    });
    const getKeys = () => {
      this.completeNotifier.unbindKeyboardForModal(this);
    };
    this.startPromise.then(getKeys);
    this._bindElements();
    this.staffGroupsCtrl.setValue(this.modifier);
    this.leftConnectorCtrl.setValue(this.modifier.leftConnector);
    this._updateGroupMembership();
    const box = svgHelpers.boxPoints(250, 250, 1, 1);
    SuiDialogBase.position(box, this.dgDom, this.view.tracker.scroller);
  }
  _bindElements() {
    const dgDom = this.dgDom;

    this._bindComponentNames();
    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this.complete();
    });

    $(dgDom.element).find('.remove-button').remove();
    this.bindKeyboard();
  }
  _updateGroupMembership() {
    const updateEl = this.staffGroupsCtrl.getInputElement();
    this.staffGroupsCtrl.setControlRows();
    $(updateEl).html('');
    $(updateEl).append(this.staffGroupsCtrl.html.dom());
    this.staffGroupsCtrl.bind();
    $(this.staffGroupsCtrl.getInputElement()).find('input').prop('disabled', false);
    $(this.staffGroupsCtrl.getInputElement()).find('.toggle-disabled input').prop('disabled', true);
  }

  changed() {
    if (this.leftConnectorCtrl.changeFlag) {
      this.modifier.leftConnector = parseInt(this.leftConnectorCtrl.getValue(), 10);
    }
    if (this.staffGroupsCtrl.changeFlag) {
      // Recreate the new staff group with updated values
      this._updateGroupMembership();
    }
    this.view.addOrUpdateStaffGroup(this.modifier);
  }
  constructor(parameters) {
    var p = parameters;
    super(SuiStaffGroupDialog.dialogElements, {
      id: 'dialog-layout',
      top: (p.view.score.layout.pageWidth / 2) - 200,
      left: (p.view.score.layout.pageHeight / 2) - 200,
      ...parameters
    });
    this.startPromise = p.startPromise;
    const measureCount = this.view.score.staves[0].measures.length;
    const selection = this.view.tracker.selections[0];
    // Reset the view so we can see all the staves
    this.view.setView(this.view.defaultStaffMap);
    this.modifier = this.view.score.getSystemGroupForStaff(selection);
    if (!this.modifier) {
      this.modifier = new SmoSystemGroup({
        mapType: SmoSystemGroup.mapTypes.allMeasures,
        startSelector: { staff: selection.selector.staff, measure: 0 },
        endSelector: { staff: selection.selector.staff, measure: measureCount - 1 }
      });
    }
  }
}
