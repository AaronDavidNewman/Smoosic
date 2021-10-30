import { DialogDefinition, SuiDialogParams } from './dialog';
import { SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SmoSelection } from '../../smo/xform/selections';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';

declare var $: any;
export class SuiDynamicDialogAdapter extends SuiComponentAdapter {
  modifier: SmoDynamicText;
  backup: SmoDynamicText;
  selection: SmoSelection;
  constructor(view: SuiScoreViewOperations, modifier: SmoDynamicText) {
    super(view);
    this.modifier = modifier;
    this.backup = new SmoDynamicText(this.modifier);
    this.selection = this.view.tracker.modifierSelections[0].selection!;
  }
  cancel() {
    this.view.addDynamic(this.selection, this.backup);
  }
  commit() {}
  get xOffset() {
    return this.modifier.xOffset;
  }
  set xOffset(value: number) {
    this.modifier.xOffset = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get fontSize() {
    return this.modifier.fontSize;
  }
  set fontSize(value: number) {
    this.modifier.fontSize = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get yOffsetLine() {
    return this.modifier.yOffsetLine;
  }
  set yOffsetLine(value: number) {
    this.modifier.yOffsetLine = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get yOffsetPixels() {
    return this.modifier.yOffsetPixels;
  }
  set yOffsetPixels(value: number) {
    this.modifier.yOffsetPixels = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
  get text() {
    return this.modifier.text;
  }
  set text(value: string) {
    this.modifier.text = value;
    this.view.addDynamic(this.selection, this.modifier);
  }
}
// ## SuiDynamicModifierDialog
// This is a poorly named class, it just allows you to placeText
// dynamic text so it doesn't collide with something.
export class SuiDynamicModifierDialog extends SuiDialogAdapterBase<SuiDynamicDialogAdapter> {
  static dialogElements: DialogDefinition = {
        label: 'Dynamics Properties', elements:
          [{
            smoName: 'yOffsetLine',
            defaultValue: 11,
            control: 'SuiRockerComponent',
            label: 'Y Line'
          }, {
            smoName: 'yOffsetPixels',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'Y Offset Px'
          }, {
            smoName: 'xOffset',
            defaultValue: 0,
            control: 'SuiRockerComponent',
            label: 'X Offset'
          }, {
            smoName: 'text',
            defaultValue: SmoDynamicText.dynamics.P,
            options: [{
              value: SmoDynamicText.dynamics.P,
              label: 'Piano'
            }, {
              value: SmoDynamicText.dynamics.PP,
              label: 'Pianissimo'
            }, {
              value: SmoDynamicText.dynamics.MP,
              label: 'Mezzo-Piano'
            }, {
              value: SmoDynamicText.dynamics.MF,
              label: 'Mezzo-Forte'
            }, {
              value: SmoDynamicText.dynamics.F,
              label: 'Forte'
            }, {
              value: SmoDynamicText.dynamics.FF,
              label: 'Fortissimo'
            }, {
              value: SmoDynamicText.dynamics.SFZ,
              label: 'Sforzando'
            }],
            control: 'SuiDropdownComponent',
            label: 'Text'
          }],
          staticText: []
      };
  constructor(parameters: SuiDialogParams) {
    const adapter = new SuiDynamicDialogAdapter(parameters.view, parameters.modifier);
    super(SuiDynamicModifierDialog.dialogElements, { adapter, ...parameters });
    this.view.groupUndo(true);
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'MODIFIERPOS'];
  }
}