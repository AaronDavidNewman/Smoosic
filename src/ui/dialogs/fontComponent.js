// ## SuiFontComponent
// Dialog component that lets user choose and customize fonts.
// eslint-disable-next-line no-unused-vars
class SuiFontComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    if (!this.dataType) {
      this.dataType = 'string';
    }
    this.dialog = dialog;
    this.familyPart = new SuiDropdownComposite(this.dialog,
      {
        smoName: 'fontFamily',
        parameterName: 'fontFamily',
        classes: 'hide-when-editing hide-when-moving',
        defaultValue: SmoScoreText.fontFamilies.times,
        control: 'SuiDropdownComponent',
        label: 'Font Family',
        startRow: true,
        parentControl: this,
        options: [
          { label: 'Arial', value: 'Arial' },
          { label: 'Times New Roman', value: 'Times New Roman' },
          { label: 'Serif', value: SourceSerifProFont.fontFamily },
          { label: 'Sans', value: SourceSansProFont.fontFamily },
          { label: 'Roboto Slab', value: 'Roboto Slab' },
          { label: 'Petaluma', value: 'Petaluma Script' },
          { label: 'Commissioner', value: 'Commissioner' },
          { label: 'Concert One', value: 'ConcertOne' },
          { label: 'Merriweather', value: 'Merriweather' }
        ]
      });
    this.sizePart = new SuiRockerComposite(
      this.dialog,
      {
        smoName: 'fontSize',
        parameterName: 'fontSize',
        defaultValue: 1,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Font Size',
        type: 'float',
        increment: 0.1
      },
    );
    this.italicsCtrl = new SuiToggleComposite(
      this.dialog,
      {
        smoName: 'italics',
        parameterName: 'italics',
        defaultValue: false,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiToggleComponent',
        label: 'Italics'
      }
    );
    this.boldCtrl = new SuiToggleComposite(
      this.dialog,
      {
        smoName: 'bold',
        parameterName: 'bold',
        parentControl: this,
        defaultValue: false,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiToggleComponent',
        label: 'Bold'
      }
    );
  }
  changed() {
    this.handleChanged();
  }

  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl'));
    q.append(this.familyPart.html);
    q.append(this.sizePart.html);
    q.append(this.boldCtrl.html);
    q.append(this.italicsCtrl.html);

    return q;
  }

  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('select');
  }
  getValue() {
    return {
      family: this.familyPart.getValue(),
      size: this.sizePart.getValue(),
      weight: this.boldCtrl.getValue() ? 'bold' : 'normal',
      style: this.italicsCtrl.getValue() ? 'italics' : 'normal'
    };
  }
  setValue(value) {
    let italics = false;
    // upconvert font size, all font sizes now in points.
    if (typeof(value.size) !== 'number') {
      value.size = SmoScoreText.fontPointSize(value.size);
    }
    if (value.style && value.style === 'italics') {
      italics = true;
    }
    const boldString = SmoScoreText.weightString(value.weight);
    const bold = boldString === 'bold';
    this.boldCtrl.setValue(bold);
    this.italicsCtrl.setValue(italics);
    this.familyPart.setValue(value.family);
    this.sizePart.setValue(value.size);
  }

  bind() {
    this.familyPart.bind();
    this.sizePart.bind();
    this.boldCtrl.bind();
    this.italicsCtrl.bind();
  }
}

// eslint-disable-next-line no-unused-vars
class SuiTextBlockComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'defaultValue', 'options', 'control', 'label', 'dataType'], parameter, this);
    this.dialog = dialog;
    this.addBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        smoName: 'addBlock',
        parameterName: 'addBlock',
        parentControl: this,
        defaultValue: false,
        icon: 'icon-plus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Add Text Block'
      });

    this.toggleBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        smoName: 'toggleBlock',
        parameterName: 'toggleBlock',
        parentControl: this,
        defaultValue: false,
        icon: 'icon-arrow-right',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Next Block'
      });

    this.removeBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        smoName: 'removeBlock',
        parameterName: 'removeBlock',
        parentControl: this,
        defaultValue: false,
        icon: 'icon-minus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Remove Block'
      });
    this.relativePositionCtrl = new SuiDropdownComposite(
      this.dialog,
      {
        smoName: 'relativePosition',
        parameterName: 'relativePosition',
        parentControl: this,
        defaultValue: SmoScoreText.justifications.left,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Block Positions',
        startRow: true,
        options: [{
          value: SmoTextGroup.relativePositions.ABOVE,
          label: 'Above'
        }, {
          value: SmoTextGroup.relativePositions.BELOW,
          label: 'Below'
        }, {
          value: SmoTextGroup.relativePositions.LEFT,
          label: 'Left'
        }, {
          value: SmoTextGroup.relativePositions.RIGHT,
          label: 'Right'
        }]
      }
    );
    this.justificationCtrl = new SuiDropdownComposite(
      this.dialog,
      {
        smoName: 'justification',
        parameterName: 'justification',
        parentControl: this,
        defaultValue: SmoScoreText.justifications.left,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Justification',
        options: [{
          value: SmoTextGroup.justifications.LEFT,
          label: 'Left'
        }, {
          value: SmoTextGroup.justifications.RIGHT,
          label: 'Right'
        }, {
          value: SmoTextGroup.justifications.CENTER,
          label: 'Center'
        }]
      });
    this.spacingCtrl = new SuiRockerComposite(
      this.dialog,
      {
        smoName: 'spacing',
        parameterName: 'spacing',
        defaultValue: 0,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Spacing',
        type: 'float',
        increment: 0.1
      },
    );
    this.modifier = this.dialog.modifier;
    this.activeScoreText = this.dialog.activeScoreText;
  }
  changed() {
    if (this.addBlockCtrl.changeFlag) {
      const nt = new SmoScoreText(this.activeScoreText);
      this.modifier.addScoreText(nt);
      this.activeScoreText = nt;
      this.modifier.setActiveBlock(nt);
      this._updateMultiiFields();
    }
    if (this.relativePositionCtrl.changeFlag) {
      this.modifier.setRelativePosition(parseInt(this.relativePositionCtrl.getValue(), 10));
    }
    if (this.justificationCtrl.changeFlag) {
      this.modifier.justification = parseInt(this.justificationCtrl.getValue(), 10);
    }
    if (this.removeBlockCtrl.changeFlag) {
      this.modifier.removeBlock(this.activeScoreText);
      this.activeScoreText = this.modifier.firstBlock();
      this._updateMultiiFields();
    }
    if (this.toggleBlockCtrl.changeFlag) {
      const curIx = this.modifier.indexOf(this.activeScoreText);
      const newIx = (curIx + 1) % this.modifier.textBlocks.length;
      this.activeScoreText = this.modifier.textBlocks[newIx].text;
      this.modifier.setActiveBlock(this.activeScoreText);
    }
    if (this.spacingCtrl.changeFlag) {
      const val = this.spacingCtrl.getValue();
      if (val >= 0) {
        this.modifier.spacing = val;
      }
    }
    this.handleChanged();
  }

  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl'));
    q.append(this.addBlockCtrl.html);
    q.append(this.removeBlockCtrl.html);
    q.append(this.toggleBlockCtrl.html);
    q.append(this.relativePositionCtrl.html);
    q.append(this.justificationCtrl.html);
    q.append(this.spacingCtrl.html);

    return q;
  }

  _getInputElement() {
    return $(this.dialog.dgDom.element).find('#' + pid);
  }
  getValue() {
    return {
      activeScoreText: this.activeScoreText,
      modifier: this.modifier
    };
  }
  _updateMultiiFields() {
    const fields = [this.justificationCtrl, this.relativePositionCtrl,
      this.removeBlockCtrl, this.toggleBlockCtrl, this.spacingCtrl];
    fields.forEach((field) => {
      if (this.modifier.textBlocks.length < 2) {
        $('#' + field.parameterId).addClass('hide');
      } else {
        $('#' + field.parameterId).removeClass('hide');
      }
    });
  }
  setValue(value) {
    this.activeScoreText = value.activeScoreText;
    this.modifier = value.modifier;
    this.relativePositionCtrl.setValue(this.modifier.relativePosition);
    this._updateMultiiFields();
    this.justificationCtrl.setValue(this.modifier.justification);
    this.spacingCtrl.setValue(this.modifier.spacing);
  }

  bind() {
    this.addBlockCtrl.bind();
    this.relativePositionCtrl.bind();
    this.justificationCtrl.bind();
    this.removeBlockCtrl.bind();
    this.toggleBlockCtrl.bind();
    this.spacingCtrl.bind();
  }
}
