
// ui application components
import { SuiApplication } from './application';
import { suiController } from './controller';
import { RibbonButtons, DisplaySettings, NoteButtons, TextButtons,
  ChordButtons, MicrotoneButtons, StaveButtons, BeamButtons, MeasureButtons,
  DebugButtons, DurationButtons, VoiceButtons, PlayerButtons,
  ArticulationButtons, NavigationButtons, ExtendedCollapseParent
 } from './ribbon';
 import { SuiTreeComponent } from './dialogs/treeComponent';
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
import { SuiDropdownComponent, SuiRockerComponent,  SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite } from './dialogComponents';
import { SuiFontComponent } from './dialogs/fontComponent';
import { SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText } from './dialogs/textComponents';
import { SuiDynamicModifierDialog } from './dialogs/textDialogs';

// render library
import { SuiScoreView } from '../render/sui/scoreView';
import { layoutDebug } from '../render/sui/layoutDebug';

// SMO components
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin, StaffModifierBase } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoSelection } from '../smo/xform/selections';
import { SmoOrnament } from '../smo/data/noteModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';

// utilities
import { smoMusic } from '../common/musicHelpers';
import { PromiseHelpers } from '../common/promiseHelpers';
import { svgHelpers } from '../common/svgHelpers';

export const Smo = {
    SuiApplication,
    SuiDom,
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
    SuiAddStaffMenu,
    SuiLanguageMenu, SuiFileMenu,
    SuiTimeSignatureMenu, SuiMeasureMenu, SuiKeySignatureMenu,
    SuiTreeComponent,
    SuiDropdownComponent,
    SuiRockerComponent,  SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
    SuiFontComponent, SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
    SuiDynamicModifierDialog,
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
    SmoOrnament,
    SmoDuration,
    SmoStaffHairpin
}
Smo.getClass = (jsonString) => {
    return eval('Smo.' + jsonString);
};
export default Smo;
