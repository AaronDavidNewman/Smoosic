
// ui application components
import { SuiApplication } from './application';
import { suiController } from './controller';
import { RibbonButtons, DisplaySettings, NoteButtons, TextButtons,
  ChordButtons, MicrotoneButtons, StaveButtons, BeamButtons, MeasureButtons,
  DebugButtons, DurationButtons, VoiceButtons, PlayerButtons,
  ArticulationButtons, NavigationButtons, ExtendedCollapseParent
 } from './ribbon';
import { SuiExceptionHandler } from './exceptions';
import { Qwerty } from './qwerty';
import { suiPiano } from '../render/sui/piano';
import { SuiDom } from './dom';
import { basicJson,  emptyScoreJson} from '../music/basic';
import { SuiHelp } from './help';

// ui dialogs and menus
import { SuiAddStaffMenu, SuiLanguageMenu, SuiFileMenu,
    SuiTimeSignatureMenu, SuiMeasureMenu, SuiKeySignatureMenu } from './menus';
import { SuiModifierDialogFactory } from './dialog';
import { SuiTempoDialog, SuiInstrumentDialog } from './dialogs/measureDialogs';
import { SuiLibraryDialog } from './dialogs/libraryDialog';

// render library
import { SuiScoreView } from '../render/sui/scoreView';
import { layoutDebug } from '../render/sui/layoutDebug';

// SMO components
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoSelection } from '../smo/xform/selections';
import { StaffModifierBase } from '../smo/data/staffModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';

// utilities
import { smoMusic } from '../common/musicHelpers';
import { PromiseHelpers } from '../common/promiseHelpers';
import { svgHelpers } from '../common/svgHelpers';

export const Smo = {
    SuiApplication,
    suiController,
    RibbonButtons,
    NoteButtons,
    TextButtons,
    ChordButtons,
    MicrotoneButtons,
    StaveButtons,
    BeamButtons,
    MeasureButtons,
    DebugButtons,
    DurationButtons,
    VoiceButtons,
    ExtendedCollapseParent,
    PlayerButtons,
    ArticulationButtons,
    NavigationButtons,
    DisplaySettings,
    SuiExceptionHandler,
    Qwerty,
    SuiHelp,
    basicJson,
    emptyScoreJson,
    suiPiano,
    SuiTempoDialog, 
    SuiInstrumentDialog, 
    SuiInstrumentDialog,
    SuiModifierDialogFactory,
    SuiLibraryDialog,
    layoutDebug,
    SuiScoreView,
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
    SuiDom,
    SuiAddStaffMenu,
    SuiLanguageMenu, SuiFileMenu,
    SuiTimeSignatureMenu, SuiMeasureMenu, SuiKeySignatureMenu
}
export default Smo;
