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
import { SmoTranslationEditor } from '../ui/i18n/translationEditor';
import { SmoConfiguration } from './configuration';
import { RibbonButtons } from '../ui/buttons/ribbon';
import { SimpleEventHandler, ModalEventHandler } from './common';
// Language strings
import { quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen } from '../ui/i18n/language_en';
import { quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar } from '../ui/i18n/language_ar';

// ui dialogs and menus
// Dialogs
import { SuiDialogBase } from '../ui/dialogs/dialog';
import { SuiModifierDialogFactory } from '../ui/dialogs/factory';
import { SuiMeasureDialog } from '../ui/dialogs/measureFormat';
import { SuiInsertMeasures } from '../ui/dialogs/addMeasure';
import { SuiInstrumentDialog } from '../ui/dialogs/instrument';
import { SuiTimeSignatureDialog } from '../ui/dialogs/timeSignature';
import { SuiTempoDialog } from '../ui/dialogs/tempo';
import { SuiScoreIdentificationDialog } from '../ui/dialogs/scoreId';
import { SuiScorePreferencesDialog } from '../ui/dialogs/preferences';
import { SuiPageLayoutDialog } from '../ui/dialogs/pageLayout';
import { SuiScoreFontDialog } from '../ui/dialogs/fonts';
import { SuiGlobalLayoutDialog } from '../ui/dialogs/globalLayout';
import { SuiScoreViewDialog } from '../ui/dialogs/scoreView';import { SuiLibraryDialog } from '../ui/dialogs/library';
import { SuiChordChangeDialog } from '../ui/dialogs/chordChange';
import { SuiLyricDialog } from '../ui/dialogs/lyric';
import { SuiTextBlockDialog, helpModal } from '../ui/dialogs/textBlock';
import { SuiDynamicModifierDialog } from '../ui/dialogs/dynamics';
import { SuiSlurAttributesDialog } from '../ui/dialogs/slur';
import { SuiTieAttributesDialog } from '../ui/dialogs/tie';
import { SuiVoltaAttributeDialog } from '../ui/dialogs/volta';
import { SuiHairpinAttributesDialog } from '../ui/dialogs/hairpin';
import { SuiStaffGroupDialog } from '../ui/dialogs/staffGroup';
import { SuiPartInfoDialog } from '../ui/dialogs/partInfo';
import { SuiLoadMxmlDialog, SuiLoadFileDialog,
    /* SuiLoadActionsDialog,  SuiSaveActionsDialog, */
    SuiPrintFileDialog, SuiSaveFileDialog, SuiSaveXmlDialog,
    SuiSaveMidiDialog } from '../ui/dialogs/fileDialogs';
    // Dialog components
import { SuiTextInputComponent, SuiTextInputComposite } from '../ui/dialogs/components/textInput';
import { SuiDropdownComponent, SuiDropdownComposite } from '../ui/dialogs/components/dropdown';
import { SuiButtonComposite, SuiButtonComponent } from '../ui/dialogs/components/button';
import { SuiToggleComponent, SuiToggleComposite } from '../ui/dialogs/components/toggle';
import { SuiFileDownloadComponent } from '../ui/dialogs/components/fileDownload';
import { SuiRockerComponent, SuiRockerComposite } from '../ui/dialogs/components/rocker';
import { SuiFontComponent } from '../ui/dialogs/components/fontComponent';
import { SuiTextBlockComponent } from '../ui/dialogs/components/textInPlace';
import { SuiTreeComponent } from '../ui/dialogs/components/tree';
import {
    SuiLyricComponent, SuiChordComponent,
    SuiNoteTextComponent
} from '../ui/dialogs/components/noteText';
import { SuiDragText } from '../ui/dialogs/components/dragText';
import { SuiTextInPlace } from '../ui/dialogs/components/textInPlace';
import { CheckboxDropdownComponent } from '../ui/dialogs/components/checkdrop';
import { TieMappingComponent } from '../ui/dialogs/components/tie';
import { StaffAddRemoveComponent,
    StaffCheckComponent} from '../ui/dialogs/components/staffComponents';
import { TextCheckComponent } from '../ui/dialogs/components/textCheck';
// menus
import { SuiMenuManager} from '../ui/menus/manager';
import { SuiMenuBase } from '../ui/menus/menu';
import { SuiScoreMenu } from '../ui/menus/score';
import { SuiPartMenu } from '../ui/menus/parts';
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
import { SvgHelpers } from '../render/sui/svgHelpers';
// SMO object model
import { SmoScore } from '../smo/data/score';
import { UndoBuffer } from '../smo/xform/undo';
import { SmoNote } from '../smo/data/note';
import { SmoDuration } from '../smo/xform/tickDuration';
import { createLoadTests } from '../../tests/file-load';
import { SmoStaffHairpin, StaffModifierBase, SmoInstrument, SmoSlur, SmoTie } from '../smo/data/staffModifiers';
import { SmoMeasure } from '../smo/data/measure';
import { SmoMusic } from '../smo/data/music';
import { SmoSelection, SmoSelector } from '../smo/xform/selections';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric } from '../smo/data/noteModifiers';
import { SmoSystemStaff } from '../smo/data/systemStaff';
import { SmoSystemGroup } from '../smo/data/scoreModifiers';
import { SmoOperation } from '../smo/xform/operations';
import {
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText
} from '../smo/data/measureModifiers';
import { SmoToXml } from '../smo/mxml/smoToXml';
import { MidiToSmo } from '../smo/midi/midiToSmo';
import { SmoToMidi } from '../smo/midi/smoToMidi';
import { XmlToSmo } from '../smo/mxml/xmlToSmo';
import { SmoToVex } from '../smo/xform/toVex';
// utilities
import { buildDom, addFileLink, InputTrapper, draggable, closeDialogPromise, getDomContainer, createTopDomContainer } from '../common/htmlHelpers';

const getClass = (jsonString: string) => {
    return eval('Smo.' + jsonString);
};
export const Smo = {
    // Application-level classes
    SmoConfiguration,
    SuiApplication,
    SuiDom,  SuiEventHandler, SuiExceptionHandler,
    Qwerty, SuiHelp, SmoTranslationEditor, SimpleEventHandler, ModalEventHandler,
    // Ribbon buttons
    RibbonButtons, NoteButtons, TextButtons, ChordButtons, MicrotoneButtons,
    StaveButtons, BeamButtons, MeasureButtons, DurationButtons,
    VoiceButtons, PlayerButtons, ArticulationButtons,  NavigationButtons,
    DisplaySettings,  ExtendedCollapseParent, CollapseRibbonControl,
    // Menus
    SuiMenuManager, SuiMenuBase, SuiScoreMenu, SuiFileMenu, SuiLibraryMenu,
    SuiDynamicsMenu, SuiTimeSignatureMenu, SuiKeySignatureMenu, SuiStaffModifierMenu,
    SuiLanguageMenu, SuiMeasureMenu, SuiStaffMenu, SmoLanguage, SmoTranslator, SuiPartMenu,
    // Dialogs
    SuiTempoDialog, SuiInstrumentDialog, SuiModifierDialogFactory, SuiLibraryDialog,
    SuiScoreViewDialog, SuiGlobalLayoutDialog, SuiScoreIdentificationDialog,
    SuiScoreFontDialog, SuiPageLayoutDialog, SuiMeasureDialog, SuiInsertMeasures,
    SuiTimeSignatureDialog,SuiTextBlockDialog, SuiLyricDialog, SuiChordChangeDialog,
    SuiSlurAttributesDialog, SuiTieAttributesDialog, SuiVoltaAttributeDialog,
    SuiHairpinAttributesDialog, SuiStaffGroupDialog, helpModal,
    SuiLoadFileDialog, SuiLoadMxmlDialog, SuiScorePreferencesDialog,
    SuiPartInfoDialog,
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
    SuiPiano, layoutDebug, SuiScoreView,SuiScroller, SvgHelpers, SuiMapper, SuiScoreRender,
    SuiScoreViewOperations,
    // Smo Music Objects
    SmoScore,
    XmlToSmo,
    SmoToXml,
    MidiToSmo,
    SmoToMidi,
    SmoMusic,
    SmoMeasure,
    SmoSystemStaff,
    SmoNote,
    // staff modifier
    SmoStaffHairpin, StaffModifierBase,
    SmoInstrument, SmoSlur, SmoTie, SmoSystemGroup,
    // measure modifiers
    SmoRehearsalMark, SmoMeasureFormat, SmoBarline, SmoRepeatSymbol,
    SmoVolta, SmoMeasureText, SmoTempoText,
    // note modifiers
    SmoOrnament,
    SmoArticulation, SmoDynamicText, SmoGraceNote, SmoMicrotone, SmoLyric,
    // Smo Transformers
    SmoSelection, SmoSelector, SmoDuration, UndoBuffer, SmoToVex, SmoOperation,
    // new score bootstrap
    basicJson,
    emptyScoreJson,
    // strings
    quickStartHtmlen, selectionHtmlen, enterDurationsHtmlen, enterPitchesHtmlen,
    quickStartHtmlar, selectionHtmlar, enterDurationsHtmlar, enterPitchesHtmlar
    ,getClass,
    createLoadTests,
    // utilities
    buildDom, addFileLink, InputTrapper, draggable, closeDialogPromise, getDomContainer, createTopDomContainer
}
export default Smo;
