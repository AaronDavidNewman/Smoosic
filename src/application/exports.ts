// Smoosic relies on dynamic creation of almost everything.  This class exports all the symbols
// that need to be created via reflection.
// ui application components
import { SuiApplication } from './application';
import { SuiEventHandler } from './eventHandler';
import { SuiExceptionHandler } from '../ui/exceptions';
import { Qwerty } from '../ui/qwerty';
import { SuiPiano } from '../render/sui/piano';
import { SuiDom } from './dom';
import { basicJson, emptyScoreJson } from '../music/basic';
import { SuiHelp } from '../ui/help';

import { ArticulationButtons } from '../ui/buttons/articulation';
import { BeamButtons } from '../ui/buttons/beam';
import { ChordButtons } from '../ui/buttons/chord';
import { CollapseRibbonControl, ExtendedCollapseParent } from '../ui/buttons/collapsable';
import { DisplaySettings } from '../ui/buttons/display';
import { DurationButtons } from '../ui/buttons/duration';
import { MeasureButtons } from '../ui/buttons/measure';
import { MicrotoneButtons } from '../ui/buttons/microtone';
import { NavigationButtons } from '../ui/buttons/navigation';
import { NoteButtons } from '../ui/buttons/note';
import { PlayerButtons } from '../ui/buttons/player';
import { StaveButtons } from '../ui/buttons/stave';
import { TextButtons } from '../ui/buttons/text';
import { VoiceButtons } from '../ui/buttons/voice';

import { RibbonButtons } from '../ui/buttons/ribbon';
// Language strings
import { quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen } from '../ui/i18n/language_en';
import { quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar } from '../ui/i18n/language_ar';
import { SuiScorePreferencesDialog } from '../ui/dialogs/scoreDialogs';

// ui dialogs and menus
// Dialogs
import { SuiModifierDialogFactory, SuiDialogBase } from '../ui/dialogs/dialog';
import { SuiTempoDialog, SuiInstrumentDialog, SuiMeasureDialog, SuiInsertMeasures,
    SuiTimeSignatureDialog } from '../ui/dialogs/measureDialogs';
import { SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog,
    SuiScoreFontDialog, SuiLayoutDialog,  } from '../ui/dialogs/scoreDialogs';
import { SuiLibraryDialog } from '../ui/dialogs/libraryDialog';
import { SuiDynamicModifierDialog, SuiTextTransformDialog, SuiLyricDialog, SuiChordChangeDialog,
  helpModal } from '../ui/dialogs/textDialogs';
import { SuiSlurAttributesDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
    SuiHairpinAttributesDialog, SuiStaffGroupDialog } from '../ui/dialogs/staffDialogs';
import { SuiLoadMxmlDialog, SuiLoadFileDialog,
    /* SuiLoadActionsDialog,  SuiSaveActionsDialog, */
    SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveXmlDialog,
    SuiSaveMidiDialog } from '../ui/dialogs/fileDialogs';
    // Dialog components
import {
    SuiDropdownComponent, SuiRockerComponent, SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
    SuiTextInputComponent
} from '../ui/dialogComponents';
import { SuiFontComponent, SuiTextBlockComponent } from '../ui/dialogs/fontComponent';
import { SuiTreeComponent } from '../ui/dialogs/treeComponent';
import {
    SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
    SuiNoteTextComponent
} from '../ui/dialogs/textComponents';
import { CheckboxDropdownComponent, TieMappingComponent, StaffAddRemoveComponent,
    StaffCheckComponent, TextCheckComponent} from '../ui/dialogs/staffComponents';
// menus
import { SuiMenuManager} from '../ui/menus/manager';
import { SuiMenuBase } from '../ui/menus/menu';
import { SuiScoreMenu } from '../ui/menus/score';
import { SuiLibraryMenu } from '../ui/menus/library';
import { SuiDynamicsMenu } from '../ui/menus/dynamics';
import { SuiTimeSignatureMenu } from '../ui/menus/timeSignature';
import { SuiKeySignatureMenu } from '../ui/menus/keySignature';
import { SuiStaffModifierMenu } from '../ui/menus/staffModifier';
import { SuiFileMenu } from '../ui/menus/file';
import { SuiLanguageMenu } from '../ui/menus/language';
import { SmoLanguage, SmoTranslator } from '../ui/i18n/language';
import { SuiMeasureMenu } from '../ui/menus/measure';
import { SuiStaffMenu } from '../ui/menus/staff';

import { SuiXhrLoader } from '../ui/fileio/xhrLoader';
import { PromiseHelpers } from '../common/promiseHelpers';
// render library
import { SuiScoreView } from '../render/sui/scoreView';
import { SuiScoreViewOperations } from '../render/sui/scoreViewOperations';
import { SuiScoreRender } from '../render/sui/scoreRender';
import { layoutDebug } from '../render/sui/layoutDebug';
import { SuiMapper } from '../render/sui/mapper';
import { SuiScroller } from '../render/sui/scroller';
import { SuiActionPlayback } from '../render/sui/actionPlayback';
// SMO components
import { SmoScore } from '../smo/data/score';
import { mxmlScore } from '../smo/mxml/xmlScore';
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { SmoStaffHairpin, StaffModifierBase, SmoInstrument, SmoPartMap, SmoSlur, SmoTie } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoSelection } from '../smo/xform/selections';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric } from '../smo/data/noteModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';
import {
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText
} from '../smo/data/measureModifiers';

import { SmoToVex } from '../smo/xform/toVex';
const getClass = (jsonString: string) => {
    return eval('Smo.' + jsonString);
};
export const Smo = {
    // Application-level classes
    SuiApplication,
    SuiDom,  SuiEventHandler, SuiExceptionHandler,
    Qwerty, SuiHelp,
    // Ribbon buttons
    RibbonButtons, NoteButtons, TextButtons, ChordButtons, MicrotoneButtons,
    StaveButtons, BeamButtons, MeasureButtons, DurationButtons,
    VoiceButtons, PlayerButtons, ArticulationButtons,  NavigationButtons,
    DisplaySettings,  ExtendedCollapseParent, CollapseRibbonControl,
    // Menus
    SuiMenuManager, SuiMenuBase, SuiScoreMenu, SuiFileMenu, SuiLibraryMenu,
    SuiDynamicsMenu, SuiTimeSignatureMenu, SuiKeySignatureMenu, SuiStaffModifierMenu,
    SuiLanguageMenu, SuiMeasureMenu, SuiStaffMenu, SmoLanguage, SmoTranslator,
    // Dialogs
    SuiTempoDialog, SuiInstrumentDialog, SuiModifierDialogFactory, SuiLibraryDialog,
    SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog,
    SuiScoreFontDialog, SuiLayoutDialog, SuiMeasureDialog, SuiInsertMeasures,
    SuiTimeSignatureDialog,SuiTextTransformDialog, SuiLyricDialog, SuiChordChangeDialog,
    SuiSlurAttributesDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
    SuiHairpinAttributesDialog, SuiStaffGroupDialog, helpModal,
    SuiLoadFileDialog, SuiLoadMxmlDialog, SuiScorePreferencesDialog,
    /* SuiLoadActionsDialog, SuiSaveActionsDialog, */
    SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveXmlDialog,
    SuiSaveMidiDialog, SuiDialogBase,
    // Dialog components
    SuiTreeComponent,
    SuiDropdownComponent,
    SuiRockerComponent, SuiFileDownloadComponent,
    SuiToggleComponent, SuiButtonComponent, SuiDropdownComposite,
    SuiToggleComposite, SuiButtonComposite, SuiRockerComposite, SuiTextInputComposite,
    SuiFontComponent, SuiTextInPlace, SuiLyricComponent, SuiChordComponent, SuiDragText,
    SuiNoteTextComponent, SuiTextBlockComponent, SuiTextInputComponent,
    SuiDynamicModifierDialog, CheckboxDropdownComponent, TieMappingComponent, StaffAddRemoveComponent,
    StaffCheckComponent, TextCheckComponent,
    SuiXhrLoader,PromiseHelpers,
    // Rendering components
    SuiPiano, layoutDebug, SuiScoreView,SuiScroller, SuiMapper, SuiScoreRender,
    SuiScoreViewOperations,SuiActionPlayback,
    // Smo Music Objects
    SmoScore,
    mxmlScore,
    SmoMeasure,
    SmoSystemStaff,
    SmoNote,
    // staff modifier
    SmoStaffHairpin, StaffModifierBase,
    SmoInstrument, SmoPartMap, SmoSlur, SmoTie, SmoSystemGroup,
    // measure modifiers
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText,
    // note modifiers
    SmoOrnament,
    SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric,
    // Smo Transformers
    SmoSelection, SmoDuration, UndoBuffer, SmoToVex,
    // new score bootstrap
    basicJson,
    emptyScoreJson,
    // strings
    quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen,
    quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar
    ,getClass
}
export default Smo;
