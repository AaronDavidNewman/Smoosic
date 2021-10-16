
import { SmoModifier } from '../../smo/data/score';
import { SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiHairpinAttributesDialog } from './staffDialogs';
import { SuiTieAttributesDialog } from './staffDialogs';
import { SuiLyricDialog } from './textDialogs';
import { SuiTextTransformDialog } from './textDialogs';
import { SmoLyric } from '../../smo/data/noteModifiers';


export function dialogConstructor<T extends SuiDialogBase>(type: { new(parameters: SuiDialogParams): T; }, parameters: SuiDialogParams ): T {
  return new type(parameters);
}
export function createAndDisplay<T extends SuiDialogBase>(ctor: new (parameters: SuiDialogParams) => T, parameters: SuiDialogParams): T {
  const instance: T = dialogConstructor<T>(ctor, parameters);
  instance.display();
  return instance;
}
export type ModifiersWithDialogs = 'SmoStaffHairpin' | 'SmoTie' | 'SmoSlur' | 'SmoDynamicText' | 'SmoVolta' | 'SmoScoreText' | 'SmoLoadScore' | 'SmoLyric';
export var ModifiersWithDialogNames = ['SmoStaffHairpin', 'SmoTie', 'SmoSlur', 'SmoDynamicText', 'SmoVolta',
  'SmoScoreText', 'SmoLoadScore', 'SmoLyric'];

export function isModifierWithDialog(modifier: SmoModifier) {
  return ModifiersWithDialogNames.indexOf(modifier.attrs.type) >= 0;
}
/**
 * Dialogs bound to selectable elements like slurs, dynamics, are created 
 * directly from a button/menu option
 */
 export class SuiModifierDialogFactory {
  static createDialog(modifier: SmoModifier, parameters: SuiDialogParams) {
    let dbType = SuiModifierDialogFactory.modifierDialogMap[modifier.attrs.type];
    parameters.modifier = modifier;
    if (dbType === 'SuiLyricDialog' && (modifier as SmoLyric).parser === SmoLyric.parsers.chord) {
      dbType = 'SuiChordChangeDialog';
    }
    if (typeof (dbType) === 'undefined') {
      return null;
    }
    const ctor: any = eval('globalThis.Smo.' + dbType);
    return ctor.createAndDisplay({
      ...parameters
    });
  }
  static createModifierDialog(modifier: SmoModifier, parameters: SuiDialogParams): SuiDialogBase | null {
    if (!isModifierWithDialog(modifier)) {
      return null;
    }
    const ctor = modifier.attrs.type;
    if (ctor === 'SmoStaffHairpin') {
      return createAndDisplay(SuiHairpinAttributesDialog, parameters);
    } else if (ctor === 'SmoTie') {
      return createAndDisplay(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoSlur') {
      return createAndDisplay(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoDynamicText') {
      return createAndDisplay(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoVolta') {
      return createAndDisplay(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoTextGroup') {
      return createAndDisplay(SuiTextTransformDialog, parameters);
    } else {
      return createAndDisplay(SuiLyricDialog, parameters);
    }
  }
  static get modifierDialogMap(): Record<string, string> {
    return {
      SmoStaffHairpin: 'SuiHairpinAttributesDialog',
      SmoTie: 'SuiTieAttributesDialog',
      SmoSlur: 'SuiSlurAttributesDialog',
      SmoDynamicText: 'SuiDynamicModifierDialog',
      SmoVolta: 'SuiVoltaAttributeDialog',
      SmoScoreText: 'SuiTextTransformDialog',
      SmoTextGroup: 'SuiTextTransformDialog',
      SmoLoadScore: 'SuiLoadFileDialog',
      SmoLyric: 'SuiLyricDialog'
    };
  }
}
