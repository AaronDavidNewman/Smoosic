// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoScore}
 * @module /smo/data/score
 */
import { SmoMusic } from './music';
import { Clef, FontInfo, SvgDimensions } from './common';
import { SmoMeasure, SmoMeasureParams, ColumnMappedParams } from './measure';
import { SmoNoteModifierBase } from './noteModifiers';
import { SmoTempoText, SmoMeasureFormat, SmoMeasureModifierBase, TimeSignature, TimeSignatureParameters } from './measureModifiers';
import { StaffModifierBase, SmoInstrument } from './staffModifiers';
import { SmoSystemGroup, SmoTextGroup, SmoScoreModifierBase, SmoPageLayout, SmoLayoutManager, SmoFormattingManager } from './scoreModifiers';
import { SmoSystemStaff, SmoSystemStaffParams } from './systemStaff';
import { SmoSelector, SmoSelection } from '../xform/selections';
import { smoSerialize } from '../../common/serializationHelpers';

/**
 * For global/default font settings.
 * @param name to distinguish: chord, lyric etc.
 * @param family font family
 * @param size in points
 * @param custom used to distinguish a specific text is not the default
 */
export interface FontPurpose {
  name: string,
  purpose: number,
  family: string,
  size: number,
  custom: boolean
}
// @internal
export type SmoScoreInfoKeys = 'name' | 'title' | 'subTitle' | 'composer' | 'copyright';
/**
 * Information about the score itself, like composer etc.
 * @category SmoModifier
 */
export class SmoScoreInfo {
  name: string = 'Smoosical'; // deprecated
  title: string = 'Smoosical';
  subTitle: string = '(Op. 1)';
  composer: string = 'Me';
  copyright: string = '';
  version: number = 1;
}
export type SmoScorePreferenceBool = 'autoPlay' | 'autoAdvance' | 'showPiano' | 'transposingScore';
export type SmoScorePreferenceNumber = 'defaultDupleDuration' | 'defaultTripleDuration';
export const SmoScorePreferenceBools: SmoScorePreferenceBool[] = ['autoPlay', 'autoAdvance', 'showPiano', 'transposingScore'];
export const SmoScorePreferenceNumbers: SmoScorePreferenceNumber[] = ['defaultDupleDuration', 'defaultTripleDuration'];
/**
 * Global score/program behavior preferences, see below for parameters
 */
export interface SmoScorePreferencesParams {
  autoPlay: boolean;
  autoAdvance: boolean;
  defaultDupleDuration: number;
  defaultTripleDuration: number;
  showPiano: boolean;
  transposingScore: boolean;
}
/**
 * Some default SMO behavior
 * @param autoPlay play a new note or chord
 * @param autoAdvance Sibelius-like behavior of advancing cursor when a letter note is placed
 * @param defaultDupleDuration in ticks, even metered measures
 * @param defaultTripleDuration in ticks, 6/8 etc.
 * @param showPiano show the piano widget in the score
 * @param transposingScore Whether to show the score parts in concert key
 * @category SmoModifier
 */
export class SmoScorePreferences {
  autoPlay: boolean = true;
  autoAdvance: boolean = true;
  defaultDupleDuration: number = 4096;
  defaultTripleDuration: number = 6144;
  showPiano: boolean = true;
  transposingScore: boolean = false;
  static get defaults(): SmoScorePreferencesParams {
    return {
      autoPlay: true,
      autoAdvance: true,
      defaultDupleDuration: 4096,
      defaultTripleDuration: 6144,
      showPiano: true,
      transposingScore: false
    };
  }
  constructor(params: SmoScorePreferencesParams) {
    if (params) {
      SmoScorePreferenceBools.forEach((bb) => {
        this[bb] = params[bb];
      });
      SmoScorePreferenceNumbers.forEach((nn) => {
        this[nn] = params[nn];
      });
    }
  }
}
/**
 * Constructor parameters.  Usually you will call
 * {@link SmoScore.defaults}, and modify the parameters you need to change.
 * A new score with the defaults will create a single, empty measure.
 * @param fonts global font defaults for this score
 * @param scoreInfo - identifying information about the score
 * @param preferences - customized score behavior
 * @param staves - contained {@link SmoSystemStaff} objects
 * @param activeStaff - running count of the active (selected) staff
 * @param textGroups - score text, such as page headers etc.
 * @param systemGroups - groupings of staves within the score, for justification
 * @param layoutManager - layout information for the score and parts
 * @param formattingManager - measure formatting information for the score.
 * @category SmoParameters
 */
export interface SmoScoreParams {
  fonts: FontPurpose[],
  scoreInfo: SmoScoreInfo,
  preferences: SmoScorePreferences,
  staves: SmoSystemStaff[],
  activeStaff: number,
  textGroups: SmoTextGroup[],
  systemGroups: SmoSystemGroup[],
  layoutManager?: SmoLayoutManager,
  formattingManager?: SmoFormattingManager
}

/**
 * Union of modifier types Smo modifier types
 */
export type SmoModifier = SmoNoteModifierBase | SmoMeasureModifierBase | StaffModifierBase | SmoScoreModifierBase;

/**
 * SmoScore is the container for the entire score: staves, measures, notes
 * @category SmoObject
 */
export class SmoScore {
  instrumentMap: any[] = []
  fonts: FontPurpose[] = []
  staffWidth: number = 1600
  scoreInfo: SmoScoreInfo = new SmoScoreInfo();
  preferences: SmoScorePreferences = new SmoScorePreferences(SmoScorePreferences.defaults);
  startIndex: number = 0;
  staves: SmoSystemStaff[] = [];
  activeStaff: number = 0;
  textGroups: SmoTextGroup[] = [];
  systemGroups: SmoSystemGroup[] = [];
  layoutManager?: SmoLayoutManager;
  formattingManager?: SmoFormattingManager
  constructor(params: SmoScoreParams) {
    Vex.Merge(this, SmoScore.defaults);
    Vex.Merge(this, params);
    if (!this.layoutManager) {
      this.layoutManager = new SmoLayoutManager(SmoLayoutManager.defaults);
    }
    if (!this.formattingManager) {
      this.formattingManager = new SmoFormattingManager(SmoFormattingManager.defaults);
    }
    if (this.staves.length) {
      this.numberStaves();
    }
    if (typeof (this.preferences.showPiano) === 'undefined') {
      this.preferences.showPiano = true;
    }

    this.updateMeasureFormats();
  }
  static get engravingFonts(): Record<string, string> {
    return { Bravura: 'Bravura', Gonville: 'Gonville', Petaluma: 'Petaluma' };
  }
  static get fontPurposes(): Record<string, number> {
    return { ENGRAVING: 1, SCORE: 2, CHORDS: 3, LYRICS: 4 };
  }
  static get defaults(): SmoScoreParams {
    return {
      // legacy layout structure.  Now we use pages.
      fonts: [
        { name: 'engraving', purpose: SmoScore.fontPurposes.ENGRAVING, family: 'Bravura', size: 1, custom: false },
        { name: 'score', purpose: SmoScore.fontPurposes.SCORE, family: 'Merriweather', size: 14, custom: false },
        { name: 'chords', purpose: SmoScore.fontPurposes.CHORDS, family: 'Roboto Slab', size: 14, custom: false },
        { name: 'lyrics', purpose: SmoScore.fontPurposes.LYRICS, family: 'Merriweather', size: 12, custom: false }
      ],
      scoreInfo: {
        name: 'Smoosical', // deprecated
        title: 'Smoosical',
        subTitle: '(Op. 1)',
        composer: 'Me',
        copyright: '',
        version: 1,
      },
      preferences: {
        autoPlay: true,
        autoAdvance: true,
        defaultDupleDuration: 4096,
        defaultTripleDuration: 6144,
        showPiano: true,
        transposingScore: false
      },
      staves: [],
      activeStaff: 0,
      textGroups: [],
      systemGroups: []
    };
  }
  static get pageSizes(): string[] {
    return ['letter', 'tabloid', 'A4', 'A4Landscape', 'custom'];
  }
  static get pageDimensions(): Record<string, SvgDimensions> {
    return {
      'letter': { width: 8 * 96 + 48, height: 11 * 96 },
      'letterLandscape': { width: 11 * 96, height: 8 * 96 + 48 },
      'tabloid': { width: 1632, height: 1056 },
      'A4': { width: 794, height: 1122 },
      'A4Landscape': { width: 1122, height: 794 },
      'custom': { width: 1, height: 1 }
    };
  }
  static pageSizeFromDimensions(width: number, height: number): string | null {
    const rv =
      SmoScore.pageSizes.find((sz) => SmoScore.pageDimensions[sz].width === width && SmoScore.pageDimensions[sz].height === height)
      ?? null;
    return rv;
  }

  static get defaultAttributes() {
    return ['startIndex', 'renumberingMap', 'renumberIndex', 'fonts',
      'preferences', 'scoreInfo'];
  }
  static get preferences() {
    return ['preferences', 'fonts', 'scoreInfo'];
  }
  serializeColumnMapped() {
    const keySignature: Record<number, string> = {};
    const tempo: Record<number, SmoTempoText> = {};
    const timeSignature: Record<number, TimeSignature> = {};
    let previous: ColumnMappedParams | null = null;
    this.staves[0].measures.forEach((measure) => {
      const current = measure.serializeColumnMapped();
      const ix = measure.measureNumber.measureIndex;
      const currentInstrument = this.staves[0].getStaffInstrument(ix);
      current.keySignature = SmoMusic.vexKeySigWithOffset(current.keySignature, -1 * currentInstrument.keyOffset);
      if (ix === 0) {
        keySignature[0] = current.keySignature;
        tempo[0] = current.tempo;
        timeSignature[0] = current.timeSignature;
        previous = current;
      } else {
        if (current.keySignature !== previous!.keySignature) {
          previous!.keySignature = current.keySignature;
          keySignature[ix] = current.keySignature;
        }
        if (!(TimeSignature.equal(current.timeSignature, previous!.timeSignature))) {
          previous!.timeSignature = current.timeSignature;
          timeSignature[ix] = current.timeSignature;
        }
        if (!(SmoTempoText.eq(current.tempo, previous!.tempo))) {
          previous!.tempo = current.tempo;
          tempo[ix] = current.tempo;
        }
      }
    });
    return { keySignature, tempo, timeSignature };
  }

  // ### deserializeColumnMapped
  // Column-mapped attributes stay the same in each measure until
  // changed, like key-signatures.  We don't store each measure value to
  // make the files smaller
  static deserializeColumnMapped(scoreObj: any) {
    let curValue: any;
    let mapIx: number = 0;
    if (!scoreObj.columnAttributeMap) {
      return;
    }
    const attrs = Object.keys(scoreObj.columnAttributeMap);
    scoreObj.staves.forEach((staff: any) => {
      const attrIxMap: any = {};
      attrs.forEach((attr) => {
        attrIxMap[attr] = 0;
      });

      staff.measures.forEach((measure: any) => {
        attrs.forEach((attr) => {
          mapIx = attrIxMap[attr];
          const curHash = scoreObj.columnAttributeMap[attr];
          const attrKeys: any = Object.keys(curHash);
          curValue = curHash[attrKeys[mapIx.toString()]];
          attrKeys.sort((a: string, b: string) => parseInt(a, 10) > parseInt(b, 10) ? 1 : -1);
          if (attrKeys.length > mapIx + 1) {
            if (measure.measureNumber.measureIndex >= attrKeys[mapIx + 1]) {
              mapIx += 1;
              curValue = curHash[attrKeys[mapIx.toString()]];
            }
          }
          // legacy timeSignature format was just a string 2/4, 3/8 etc.
          if (attr === 'timeSignature') {
            const ts = new TimeSignature(TimeSignature.defaults);
            if (typeof (curValue) === 'string') {
              ts.timeSignature = curValue;
              measure[attr] = ts;
            } else {
              if (typeof (curValue.isPickup) === 'undefined') {
                curValue.isPickup = false;
              }
              measure[attr] = new TimeSignature(curValue as TimeSignatureParameters);
            }
          } else {
            measure[attr] = curValue;
          }
          attrIxMap[attr] = mapIx;
        });
      });
    });
  }

  /**
   * Serialize the entire score.
   * @returns JSON object
   */
  serialize(): any {
    const params = {};
    let obj: any = {
      score: params,
      layoutManager: {},
      measureFormats: {},
      staves: [],
      textGroups: [],
      systemGroups: []
    };
    if (this.layoutManager) {
      obj.layoutManager = this.layoutManager.serialize();
    }
    if (this.formattingManager) {
      obj.measureFormats = this.formattingManager.serialize();
    }
    smoSerialize.serializedMerge(SmoScore.defaultAttributes, this, params);
    this.staves.forEach((staff: SmoSystemStaff) => {
      obj.staves.push(staff.serialize());
    });
    // Score text is not part of text group, so don't save separately.
    this.textGroups.forEach((tg) => {
      if (tg.isTextVisible()) {
        obj.textGroups.push(tg.serialize());
      }
    });
    this.systemGroups.forEach((gg) => {
      obj.systemGroups.push(gg.serialize());
    });
    obj.columnAttributeMap = this.serializeColumnMapped();
    smoSerialize.jsonTokens(obj);
    obj = smoSerialize.detokenize(obj, smoSerialize.tokenValues);
    obj.dictionary = smoSerialize.tokenMap;
    return obj;
  }
  updateScorePreferences(pref: SmoScorePreferences) {
    this.preferences = pref;
    SmoMeasure.defaultDupleDuration = pref.defaultDupleDuration;
    SmoMeasure.defaultTripleDuration = pref.defaultTripleDuration;
  }
  static upConvertGlobalLayout(jsonObj: any) {
    // upconvert global layout, which used to be directly on layoutManager
    if (typeof (jsonObj.layoutManager.globalLayout) === 'undefined') {
      jsonObj.layoutManager.globalLayout = {
        svgScale: jsonObj.layoutManager.svgScale,
        zoomScale: jsonObj.layoutManager.zoomScale,
        pageWidth: jsonObj.layoutManager.pageWidth,
        pageHeight: jsonObj.layoutManager.pageHeight,
        noteSpacing: jsonObj.layoutManager.noteSpacing
      };
      if (!jsonObj.layoutManager.globalLayout.noteSpacing) {
        jsonObj.layoutManager.globalLayout.noteSpacing = 1.0;
      }
    }
  }
  // ### upConvertLayout
  // Convert legacy score layout to layoutManager object parameters
  static upConvertLayout(jsonObj: any) {
    let i = 0;
    jsonObj.layoutManager = {};
    SmoLayoutManager.attributes.forEach((attr) => {
      jsonObj.layoutManager[attr] = jsonObj.score.layout[attr];
    });
    jsonObj.layoutManager.pageLayouts = [];
    for (i = 0; i < jsonObj.score.layout.pages; ++i) {
      const pageSetting = JSON.parse(JSON.stringify(SmoPageLayout.defaults));
      SmoPageLayout.attributes.forEach((attr) => {
        if (typeof (jsonObj.score.layout[attr]) !== 'undefined') {
          pageSetting[attr] = jsonObj.score.layout[attr];
        }
      });
      jsonObj.layoutManager.pageLayouts.push(pageSetting);
    }
    SmoScore.upConvertGlobalLayout(jsonObj);
  }

  /**
   * Deserialize an entire score
   * @param jsonString 
   * @returns 
   */
  static deserialize(jsonString: any): SmoScore {
    let jsonObj = JSON.parse(jsonString);
    let upconvertFormat = false;
    let formattingManager = null;
    if (jsonObj.dictionary) {
      jsonObj = smoSerialize.detokenize(jsonObj, jsonObj.dictionary);
    }
    upconvertFormat = typeof (jsonObj.measureFormats) === 'undefined';
    const params: any = {};
    const staves: SmoSystemStaff[] = [];
    jsonObj.textGroups = jsonObj.textGroups ? jsonObj.textGroups : [];

    // Explode the sparse arrays of attributes into the measures
    SmoScore.deserializeColumnMapped(jsonObj);
    // meaning of customProportion has changed, backwards-compatiblity
    if (typeof (jsonObj.score.preferences) !== 'undefined' && typeof (jsonObj.score.preferences.customProportion) === 'number') {
      SmoMeasureFormat.defaults.proportionality = jsonObj.score.preferences.customProportion;
      if (SmoMeasureFormat.defaults.proportionality === SmoMeasureFormat.legacyProportionality) {
        SmoMeasureFormat.defaults.proportionality = SmoMeasureFormat.defaultProportionality;
      }
    }
    // up-convert legacy layout data
    if (jsonObj.score.layout) {
      SmoScore.upConvertLayout(jsonObj);
    }
    if (jsonObj.layoutManager && !jsonObj.layoutManager.globalLayout) {
      SmoScore.upConvertGlobalLayout(jsonObj);
    }
    const layoutManager = new SmoLayoutManager(jsonObj.layoutManager);
    if (!upconvertFormat) {
      formattingManager = new SmoFormattingManager({ measureFormats: jsonObj.measureFormats });
    }

    // params.layout = JSON.parse(JSON.stringify(SmoScore.defaults.layout));
    smoSerialize.serializedMerge(
      SmoScore.defaultAttributes,
      jsonObj.score, params);
    if (!params.preferences) {
      params.preferences = SmoScore.defaults.preferences;
    }
    params.preferences.transposingScore = params.preferences.transposingScore ?? false;

    jsonObj.staves.forEach((staffObj: any, staffIx: number) => {
      staffObj.staffId = staffIx;
      const staff = SmoSystemStaff.deserialize(staffObj);
      staves.push(staff);
    });

    const textGroups: SmoTextGroup[] = [];
    jsonObj.textGroups.forEach((tg: any) => {
      textGroups.push(SmoTextGroup.deserialize(tg));
    });

    const systemGroups: SmoSystemGroup[] = [];
    if (jsonObj.systemGroups) {
      jsonObj.systemGroups.forEach((tt: any) => {
        var st = SmoScoreModifierBase.deserialize(tt);
        st.autoLayout = false; // since this has been layed out, presumably, before save
        systemGroups.push(st);
      });
    }
    params.staves = staves;
    if (upconvertFormat) {
      formattingManager = SmoScore.measureFormatFromLegacyScore(params, jsonObj);
    }
    params.formattingManager = formattingManager;
    params.layoutManager = layoutManager;
    const score = new SmoScore(params);
    score.textGroups = textGroups;
    score.systemGroups = systemGroups;
    score.scoreInfo.version += 1;
    return score;
  }
  /**
  * Convert measure formatting from legacy scores, that had the formatting
  * per measure, to the new way that has a separate formatting object.
  * **/
  static measureFormatFromLegacyScore(score: SmoScore, jsonObj: any): SmoFormattingManager | null {
    let current: SmoMeasureFormat | null = null;
    let previous: SmoMeasureFormat | null = null;
    const measureFormats: SmoMeasureFormat[] = [];
    score.staves[0].measures.forEach((measure: SmoMeasure) => {
      if (current === null) {
        current = SmoMeasureFormat.fromLegacyMeasure(jsonObj.staves[0].measures[measure.measureNumber.measureIndex]);
        measureFormats[measure.measureNumber.measureIndex] = current;
      } else {
        previous = current;
        current = SmoMeasureFormat.fromLegacyMeasure(jsonObj.staves[0].measures[measure.measureNumber.measureIndex]);
        if (!current.eq(previous)) {
          measureFormats[measure.measureNumber.measureIndex] = current;
        }
      }
    });
    return new SmoFormattingManager({ measureFormats });
  }

  /**
   * Return a default score with no notes or staves
   * @param scoreDefaults 
   * @param measureDefaults 
   * @returns 
   */
  static getDefaultScore(scoreDefaults: SmoScoreParams, measureDefaults: SmoMeasureParams | null) {
    measureDefaults = measureDefaults !== null ? measureDefaults : SmoMeasure.defaults;
    const score = new SmoScore(scoreDefaults);
    score.formattingManager = new SmoFormattingManager(SmoFormattingManager.defaults);
    score.addStaff(SmoSystemStaff.defaults);
    const measure: SmoMeasure = SmoMeasure.getDefaultMeasure(measureDefaults as SmoMeasureParams);
    score.addMeasure(0);
    measure.voices.push({
      notes: SmoMeasure.getDefaultNotes(measureDefaults as SmoMeasureParams)
    });
    return score;
  }

  /**
   * Return an 'empty' score, with one measure of rests
   * @param scoreDefaults 
   * @returns 
   */
  static getEmptyScore(scoreDefaults: SmoScoreParams) {
    const score = new SmoScore(scoreDefaults);
    score.addStaff(SmoSystemStaff.defaults);
    return score;
  }

  /**
   * Iteratively number the staves, like when adding a measure
   */
  numberStaves() {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const stave = this.staves[i];
      stave.staffId = i;
      stave.numberMeasures();
    }
  }

  updateMeasureFormats() {
    this.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        (this.formattingManager as SmoFormattingManager).updateFormat(measure);
      });
    });
  }
  /**
   * Add a measure to the score with the supplied parameters at the supplied index.
   * The defaults per staff may be different depending on the clef, key of the staff.
  */
  addDefaultMeasureWithNotes(measureIndex: number, parameters: SmoMeasureParams) {
    this.staves.forEach((staff) => {
      const defaultMeasure =
        SmoMeasure.getDefaultMeasureWithNotes(parameters);
      staff.addMeasure(measureIndex, defaultMeasure);
    });
  }

  /**
   * delete the measure at the supplied index in all the staves
  */
  deleteMeasure(measureIndex: number) {
    this.staves.forEach((staff) => {
      staff.deleteMeasure(measureIndex);
    });
    // adjust offset if text was attached to any missing measures after the deleted one.
    this.textGroups.forEach((tg: SmoTextGroup) => {
      if (tg.attachToSelector && (tg.selector as SmoSelector).measure >= measureIndex && (tg.selector as SmoSelector).measure > 0) {
        (tg.selector as SmoSelector).measure -= 1;
      }
    });
  }
  getPrototypeMeasure(measureIndex: number, staffIndex: number) {
    const staff = this.staves[staffIndex];
    let protomeasure: SmoMeasureParams = {} as SmoMeasureParams;

    // Since this staff may already have instrument settings, use the
    // immediately preceeding or post-ceding measure if it exists.
    if (measureIndex < staff.measures.length) {
      protomeasure = staff.measures[measureIndex];
    } else if (staff.measures.length) {
      protomeasure = staff.measures[staff.measures.length - 1];
    } else {
      protomeasure = SmoMeasure.defaults;
    }
    return SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
  }

  // ### addMeasure
  // Give a measure prototype, create a new measure and add it to each staff, with the
  // correct settings for current time signature/clef.
  addMeasure(measureIndex: number) {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      const staff = this.staves[i];
      const nmeasure = this.getPrototypeMeasure(measureIndex, i);
      if (nmeasure.voices.length <= nmeasure.getActiveVoice()) {
        nmeasure.setActiveVoice(0);
      }
      staff.addMeasure(measureIndex, nmeasure);
    }
    // Update offsets for score modifiers that have a selector
    this.textGroups.forEach((tg: SmoTextGroup) => {
      if (typeof (tg.selector) === 'undefined') {
        return;
      }
      if (tg.attachToSelector && tg.selector.measure >= measureIndex && tg.selector.measure < this.staves[0].measures.length) {
        tg.selector.measure += 1;
      }
    });
    this.numberStaves();
  }

  // ### replaceMeasure
  // Replace the measure at the given location.  Probably due to an undo operation or paste.
  replaceMeasure(selector: SmoSelector, measure: SmoMeasure) {
    var staff = this.staves[selector.staff];
    staff.measures[selector.measure] = measure;
  }

  getSystemGroupForStaff(selection: SmoSelection) {
    const staffId: number = selection.staff.staffId;
    const measureIndex: number = selection.measure.measureNumber.measureIndex;
    const exist = this.systemGroups.find((sg: SmoSystemGroup) =>
      sg.startSelector.staff <= staffId &&
      sg.endSelector.staff >= staffId &&
      (sg.mapType === SmoSystemGroup.mapTypes.allMeasures ||
        (sg.startSelector.measure <= measureIndex &&
          sg.endSelector.measure >= measureIndex))
    );
    return exist;
  }

  getStavesForGroup(group: SmoSystemGroup) {
    return this.staves.filter((staff) => staff.staffId >= group.startSelector.staff &&
      staff.staffId <= group.endSelector.staff);
  }

  // ### addOrReplaceSystemGroup
  // Add a new staff grouping, or replace it if it overlaps and is different, or
  // remove it if it is identical (toggle)
  addOrReplaceSystemGroup(newGroup: SmoSystemGroup) {
    // Replace this group for any groups that overlap it.
    this.systemGroups = this.systemGroups.filter((sg) => !sg.overlaps(newGroup));
    this.systemGroups.push(newGroup);
  }

  isPartExposed(): boolean {
    if (this.staves.length > 2) {
      return false;
    }
    const staff = this.staves[0];
    const staveCount = staff.partInfo.stavesAfter + staff.partInfo.stavesBefore + 1;
    return staveCount === this.staves.length
      && staff.partInfo.stavesBefore === 0;
  }

  // ### replace staff
  // Probably due to an undo operation, replace the staff at the given index.
  replaceStaff(index: number, staff: SmoSystemStaff) {
    const staves = [];
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      if (i !== index) {
        staves.push(this.staves[i]);
      } else {
        staves.push(staff);
      }
    }
    this.staves = staves;
  }
  // ### addKeySignature
  // Add a key signature at the specified index in all staves.
  addKeySignature(measureIndex: number, key: string) {
    this.staves.forEach((staff) => {
      // Consider transpose for key of instrument
      const netOffset = staff.measures[measureIndex].transposeIndex;
      const newKey = SmoMusic.vexKeySigWithOffset(key, netOffset);
      staff.addKeySignature(measureIndex, newKey);
    });
  }

  /**
   * If the part is a transposing part, remove the transposition from the notes/staff.  This logic
   * assumes the measures previously had transposeIndex set up by the instrument map.
   */
  setTransposing() {
    this.staves.forEach((staff) => {
      staff.measures.forEach((mm) => {
        if (mm.transposeIndex !== 0) {
          const concert = SmoMusic.vexKeySigWithOffset(mm.keySignature, -1 * mm.transposeIndex);
          mm.transposeToOffset(0, concert);
          mm.transposeIndex = 0;
          mm.keySignature = concert;
        }
      });
    });
  }
  /**
   * If the score is switching from transposing to non-transposing, update the index
   * and pitches.  This logic assumes we are changing from transposing to non-transposing.
   */
  setNonTransposing() {
    this.staves.forEach((staff) => {
      staff.measures.forEach((mm) => {
        const inst = staff.getStaffInstrument(mm.measureNumber.measureIndex);
        if (inst.keyOffset !== 0) {
          const concert = SmoMusic.vexKeySigWithOffset(mm.keySignature, inst.keyOffset);
          mm.transposeToOffset(inst.keyOffset, concert);
          mm.transposeIndex = inst.keyOffset;
          mm.keySignature = concert;
        }
      });
    });
  }

  // ### addInstrument
  // add a new staff (instrument) to the score
  addStaff(parameters: SmoSystemStaffParams) {
    let i = 0;
    if (this.staves.length === 0) {
      const staff = new SmoSystemStaff(parameters);
      this.staves.push(staff);
      this.activeStaff = 0;
      // For part views, we renumber the staves even if there is only one staff.
      if (staff.measures.length) {
        this.numberStaves();
      }
      return;
    }
    if (!parameters) {
      parameters = SmoSystemStaff.defaults;
    }
    const proto = this.staves[0];
    const measures = [];
    for (i = 0; i < proto.measures.length; ++i) {
      const measure: SmoMeasure = proto.measures[i];
      const newMeasure = SmoMeasure.deserialize(measure.serialize());
      newMeasure.measureNumber = measure.measureNumber;
      newMeasure.clef = parameters.measureInstrumentMap[0].clef as Clef;
      newMeasure.modifiers = [];
      newMeasure.transposeIndex = 0;
      // Consider key change if the proto measure is non-concert pitch
      newMeasure.keySignature =
        SmoMusic.vexKeySigWithOffset(newMeasure.keySignature,
          newMeasure.transposeIndex - measure.transposeIndex);
      newMeasure.voices = [{ notes: SmoMeasure.getDefaultNotes(newMeasure) }];
      measure.modifiers.forEach((modifier) => {
        const nmod: SmoMeasureModifierBase = SmoMeasureModifierBase.deserialize(modifier);
        newMeasure.modifiers.push(nmod);
      });
      measures.push(newMeasure);
    }
    parameters.measures = measures;
    const staff = new SmoSystemStaff(parameters);
    this.staves.push(staff);
    this.activeStaff = this.staves.length - 1;
    this.numberStaves();
  }

  // ### removeStaff
  // Remove stave at the given index
  removeStaff(index: number) {
    const staves: SmoSystemStaff[] = [];
    let ix = 0;
    this.staves.forEach((staff) => {
      if (ix !== index) {
        staves.push(staff);
      }
      ix += 1;
    });
    this.staves = staves;
    this.numberStaves();
  }
  getStaffInstrument(selector: SmoSelector): SmoInstrument {
    const staff: SmoSystemStaff = this.staves[selector.staff];
    return staff.getStaffInstrument(selector.measure);
  }

  swapStaves(index1: number, index2: number): void {
    if (this.staves.length < index1 || this.staves.length < index2) {
      return;
    }
    const tmpStaff = this.staves[index1];
    this.staves[index1] = this.staves[index2];
    this.staves[index2] = tmpStaff;
    this.staves.forEach((staff) => {
      staff.mapStaffFromTo(index1, index2);
      staff.mapStaffFromTo(index2, index1);
    });
    this.numberStaves();
  }

  _updateTextGroup(textGroup: SmoTextGroup, toAdd: boolean) {
    const tgid = typeof (textGroup) === 'string' ? textGroup :
      textGroup.attrs.id;
    const ar = this.textGroups.filter((tg) => tg.attrs.id !== tgid);
    this.textGroups = ar;
    if (toAdd) {
      this.textGroups.push(textGroup);
    }
  }
  addTextGroup(textGroup: SmoTextGroup) {
    this._updateTextGroup(textGroup, true);
  }
  getTextGroups() {
    return this.textGroups;
  }
  scaleTextGroups(scale: number) {
    this.textGroups.forEach((tg: SmoTextGroup) => {
      tg.scaleText(scale);
    });
  }

  removeTextGroup(textGroup: SmoTextGroup) {
    this._updateTextGroup(textGroup, false);
  }

  setLyricAdjustWidth(adjustNoteWidth: boolean) {
    this.staves.forEach((staff) => {
      staff.setLyricAdjustWidth(adjustNoteWidth);
    });
  }

  setChordAdjustWidth(adjustNoteWidth: boolean) {
    this.staves.forEach((staff) => {
      staff.setChordAdjustWidth(adjustNoteWidth);
    });
  }
  // ### setLyricFont
  // set the font for lyrics, which are the same for all lyrics in the score
  setLyricFont(fontInfo: FontInfo) {
    this.staves.forEach((staff) => {
      staff.setLyricFont(fontInfo);
    });
    const fontInst: FontPurpose | undefined = this.fonts.find((fn) => fn.purpose === SmoScore.fontPurposes.LYRICS);
    if (typeof (fontInst) === 'undefined') {
      return;
    }
    fontInst.family = fontInfo.family;
    fontInst.size = fontInfo.size;
    fontInst.custom = true;
  }

  setChordFont(fontInfo: FontInfo) {
    this.staves.forEach((staff) => {
      staff.setChordFont(fontInfo);
    });
  }

  get measures() {
    if (this.staves.length === 0) {
      return [];
    }
    return this.staves[this.activeStaff].measures;
  }
  incrementActiveStaff(offset: number) {
    if (offset < 0) {
      offset = offset + this.staves.length;
    }
    const nextStaff = (this.activeStaff + offset) % this.staves.length;
    if (nextStaff >= 0 && nextStaff < this.staves.length) {
      this.activeStaff = nextStaff;
    }
    return this.activeStaff;
  }

  setActiveStaff(index: number) {
    this.activeStaff = index <= this.staves.length ? index : this.activeStaff;
  }
}
