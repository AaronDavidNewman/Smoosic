// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './components/baseComponent';
import { SuiDropdownComposite } from './components/dropdown';
import { SuiRockerComposite } from './components/rocker';
import { SuiToggleComposite } from './components/toggle';
import { SuiButtonComposite } from './components/button';
import { SmoTextGroup, SmoScoreText } from '../../smo/data/scoreModifiers';
import { htmlHelpers } from '../../common/htmlHelpers';
import { SourceSerifProFont } from '../../styles/font_metrics/ssp-serif-metrics';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { FontInfo } from '../../smo/data/common';
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
        defaultValue: SmoScoreText.fontFamilies.times,
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
        id: this.id + 'italics',
        smoName: 'italics',
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
    const b = htmlHelpers.buildDom;
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
      style: this.italicsCtrl.getValue() ? 'italics' : 'normal'
    };
  }
  setValue(value: FontInfo) {
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

export interface SuiTextBlockComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export interface SuiTextBlockValue {
  modifier: SmoTextGroup,
  activeScoreText: SmoScoreText
}
export class SuiTextBlockComponent extends SuiComponentParent {
  addBlockCtrl: SuiButtonComposite;
  toggleBlockCtrl: SuiButtonComposite;
  removeBlockCtrl: SuiButtonComposite;
  relativePositionCtrl: SuiDropdownComposite;
  justificationCtrl: SuiDropdownComposite;
  spacingCtrl: SuiRockerComposite;
  modifier: SmoTextGroup;
  activeScoreText: SmoScoreText;

  constructor(dialog: SuiDialogNotifier, parameter: SuiTextBlockComponentParams) {
    super(dialog, parameter);
    this.addBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'addBlock',
        smoName: 'addBlock',
        parentControl: this,
        icon: 'icon-plus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Add Text Block'
      });

    this.toggleBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'toggleBlock',
        smoName: 'toggleBlock',
        parentControl: this,
        icon: 'icon-arrow-right',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Next Block'
      });

    this.removeBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'removeBlock',
        smoName: 'removeBlock',
        parentControl: this,
        icon: 'icon-minus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Remove Block'
      });
    this.relativePositionCtrl = new SuiDropdownComposite(
      this.dialog,
      {
        id: this.id + 'relativePosition',
        smoName: 'relativePosition',
        parentControl: this,
        defaultValue: SmoScoreText.justifications.left,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Block Positions',
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
        id: this.id + 'justification',
        smoName: 'justification',
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
        id: this.id + 'spacing',
        smoName: 'spacing',
        defaultValue: 0,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Spacing',
        dataType: 'float',
        increment: 0.1
      },
    );
    const mod = this.dialog.getModifier();
    if (mod && SmoTextGroup.isTextGroup(mod)) {
      this.modifier = mod;
    } else {
      this.modifier = new SmoTextGroup(SmoTextGroup.defaults);
    }
    this.activeScoreText = this.modifier.textBlocks[0].text;
  }
  changed() {
    if (this.addBlockCtrl.changeFlag && this.modifier) {
      const nt = new SmoScoreText(this.activeScoreText);
      this.modifier.addScoreText(nt);
      this.activeScoreText = nt;
      this.modifier.setActiveBlock(nt);
      this._updateMultiiFields();
    }
    if (this.relativePositionCtrl.changeFlag) {
      this.modifier.setRelativePosition(parseInt(this.relativePositionCtrl.getValue().toString(), 10));
    }
    if (this.justificationCtrl.changeFlag) {
      this.modifier.justification = parseInt(this.justificationCtrl.getValue().toString(), 10);
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
    return $(this.dialog.dgDom.element).find('#' + this.parameterId);
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
  setValue(value: SuiTextBlockValue) {
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
