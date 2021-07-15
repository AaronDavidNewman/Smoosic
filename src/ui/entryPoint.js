
import { SuiApplication } from './application';
import { suiController } from './controller';
import { SuiScoreView } from '../render/sui/scoreView';
import { RibbonButtons } from './ribbon';
import { SuiExceptionHandler } from './exceptions';
import { Qwerty } from './qwerty';
import { SuiModifierDialogFactory } from './dialog';
import { suiPiano } from '../render/sui/piano';
import { layoutDebug } from '../render/sui/layoutDebug';
import { SmoHelp } from './help';
import { SmoMeasure } from '../smo/data/measure';
import { UndoBuffer } from '../smo/xform/undo';
import { PromiseHelpers } from '../common/promiseHelpers';
import { SmoSelection } from '../smo/xform/selections';
import { svgHelpers } from '../common/svgHelpers';
import { StaffModifierBase } from '../smo/data/staffModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';
import { smoMusic } from '../common/musicHelpers';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin } from '../smo/data/staffModifiers';
import { basicJson,  emptyScoreJson} from '../music/basic';

export const Smo = {
    SuiApplication,
    suiController,
    SuiScoreView,
    RibbonButtons,
    SuiExceptionHandler,
    Qwerty,
    SuiModifierDialogFactory,
    suiPiano,
    layoutDebug,
    SmoHelp,
    SmoMeasure,
    UndoBuffer,
    PromiseHelpers,
    SmoSelection,
    svgHelpers,
    StaffModifierBase,
    SmoSystemStaff,
    SmoSystemGroup,
    smoMusic,
    SmoNote,
    SmoDuration,
    SmoStaffHairpin,
    basicJson,
    emptyScoreJson
}
export default Smo;
