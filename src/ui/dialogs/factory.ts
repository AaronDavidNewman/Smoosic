
import { SmoModifier } from '../../smo/data/score';
import { SuiDialogBase, SuiDialogParams, createAndDisplayDialog } from './dialog';
import { SuiHairpinAttributesDialog } from './hairpin';
import { SuiSlurAttributesDialog } from './slur';
import { SuiPedalMarkingDialog } from './pedalMarking';
import { SuiVoltaAttributeDialog } from './volta';
import { SuiLyricDialog } from './lyric';
import { SuiTieAttributesDialog } from './tie';
import { SuiDynamicModifierDialog } from './dynamics';
import { SuiTextBlockDialog } from './textBlock';
import { SuiTextBracketDialog } from './textBracket';

export type ModifiersWithDialogs = 'SmoStaffHairpin' | 'SmoTie' | 'SmoSlur' | 
'SmoDynamicText' | 'SmoVolta' | 'SmoScoreText' | 'SmoLoadScore' | 'SmoLyric' | 'SmoPedalMarking';
export var ModifiersWithDialogNames = ['SmoStaffHairpin', 'SmoTie', 'SmoSlur', 'SmoDynamicText', 'SmoVolta',
  'SmoScoreText', 'SmoLoadScore', 'SmoLyric', 'SmoTextGroup', 'SmoStaffTextBracket', 'SmoPedalMarking'];

export function isModifierWithDialog(modifier: SmoModifier) {
  return ModifiersWithDialogNames.indexOf(modifier.attrs.type) >= 0;
}
/**
 * Dialogs bound to selectable elements like slurs, dynamics, are created 
 * directly from a button/menu option
 * @category SuiDialog
 */
 export class SuiModifierDialogFactory {
  static createModifierDialog(modifier: SmoModifier, parameters: SuiDialogParams): SuiDialogBase | null {
    if (!isModifierWithDialog(modifier)) {
      return null;
    }
    const ctor = modifier.attrs.type;
    parameters.modifier = modifier;
    if (ctor === 'SmoStaffHairpin') {
      return createAndDisplayDialog(SuiHairpinAttributesDialog, parameters);
    } else if (ctor === 'SmoPedalMarking') {
      return createAndDisplayDialog(SuiPedalMarkingDialog, parameters);
    } else if (ctor === 'SmoTie') {
      return createAndDisplayDialog(SuiTieAttributesDialog, parameters);
    } else if (ctor === 'SmoSlur') {
      return createAndDisplayDialog(SuiSlurAttributesDialog, parameters);
    } else if (ctor === 'SmoDynamicText') {
      return createAndDisplayDialog(SuiDynamicModifierDialog, parameters);
    } else if (ctor === 'SmoVolta') {
      return createAndDisplayDialog(SuiVoltaAttributeDialog, parameters);
    } else if (ctor === 'SmoTextGroup') {      
      return createAndDisplayDialog(SuiTextBlockDialog, parameters);
    } else if (ctor === 'SmoStaffTextBracket') {
      return createAndDisplayDialog(SuiTextBracketDialog, parameters);
    } else {
      return createAndDisplayDialog(SuiLyricDialog, parameters);
    }
  }
}
