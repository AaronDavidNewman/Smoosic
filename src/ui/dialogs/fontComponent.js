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
      size: {
        size: this.sizePart.getValue(),
        unit: 'pt'
      },
      weight: this.boldCtrl.getValue() ? 'bold' : 'normal',
      style: this.italicsCtrl.getValue() ? 'italics' : 'normal'
    };
  }
  setValue(value) {
    let italics = false;
    if (value.style && value.style === 'italics') {
      italics = true;
    }
    const boldString = SmoScoreText.weightString(value.weight);
    const bold = boldString === 'bold';
    this.boldCtrl.setValue(bold);
    this.italicsCtrl.setValue(italics);
    this.familyPart.setValue(value.family);
    this.sizePart.setValue(
      svgHelpers.convertFont(value.size.size, value.size.unit, 'pt'));
  }

  bind() {
    this.familyPart.bind();
    this.sizePart.bind();
    this.boldCtrl.bind();
    this.italicsCtrl.bind();
  }
}
