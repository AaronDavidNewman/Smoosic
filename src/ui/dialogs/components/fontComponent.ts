// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
import { SuiDropdownComposite } from './dropdown';
import { SuiRockerComposite } from './rocker';
import { SuiToggleComposite } from './toggle';
import { SmoScoreText } from '../../../smo/data/scoreText';
import { buildDom } from '../../../common/htmlHelpers';
import { SourceSerifProFont } from '../../../styles/font_metrics/ssp-serif-metrics';
import { SourceSansProFont } from '../../../styles/font_metrics/ssp-sans-metrics';
import { FontInfo } from '../../../smo/data/common';
declare var $: any;

export interface SuiFontComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
// ## SuiFontComponent
// Dialog component that lets user choose and customize fonts.
export class SuiFontComponent extends SuiComponentBase {
  familyPart: SuiDropdownComposite;
  sizePart: SuiRockerComposite;
  italicsCtrl: SuiToggleComposite;
  boldCtrl: SuiToggleComposite;
  constructor(dialog: SuiDialogNotifier, parameter: SuiFontComponentParams) {
    super(dialog, parameter);
    this.dialog = dialog;
    const familyId = this.id + 'fontFamily';
    const sizeId = this.id + 'fontSize';

    this.familyPart = new SuiDropdownComposite(this.dialog,
      {
        id: familyId,
        smoName: 'fontFamily',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Font Family',
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
        id: sizeId,
        smoName: 'fontSize',
        defaultValue: 1,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Font Size',
        dataType: 'float',
        increment: 0.1
      },
    );
    this.italicsCtrl = new SuiToggleComposite(
      this.dialog,
      {
        id: this.id + 'italic',
        smoName: 'italic',
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiToggleComponent',
        label: 'Italics'
      }
    );
    this.boldCtrl = new SuiToggleComposite(
      this.dialog,
      {
        id: this.id + 'bold',
        smoName: 'bold',
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiToggleComponent',
        label: 'Bold'
      }
    );
  }
  changed() {
    this.handleChanged();
  }

  get html() {
    const b = buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl')).attr('id', this.parameterId);
    if (this.label) {
      q.append(b('h3').classes('font-purpose').text(this.label));
    }
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
  getValue(): FontInfo {
    return {
      family: this.familyPart.getValue().toString(),
      size: this.sizePart.getValue(),
      weight: this.boldCtrl.getValue() ? 'bold' : 'normal',
      style: this.italicsCtrl.getValue() ? 'italic' : 'normal'
    };
  }
  setValue(value: FontInfo) {
    let italics = false;
    // upconvert font size, all font sizes now in points.
    if (typeof(value.size) !== 'number') {
      value.size = SmoScoreText.fontPointSize(value.size);
    }
    if (value.style && value.style === 'italic') {
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
