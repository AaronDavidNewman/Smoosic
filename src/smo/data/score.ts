// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Classes to support {@link SmoScore}
 * @module /smo/data/score
 */
import { SmoMusic } from './music';
import { Clef, SvgDimensions, smoXmlNs, 
  createChildElementRecord, createChildElementRecurse, serializeXmlModifierArray, createXmlAttribute } from './common';
import { SmoMeasure, SmoMeasureParams, ColumnMappedParams, SmoMeasureParamsSer } from './measure';
import { SmoNoteModifierBase } from './noteModifiers';
import { SmoTempoText, SmoMeasureFormat, SmoMeasureModifierBase, TimeSignature, TimeSignatureParameters,
  SmoMeasureFormatParamsSer } from './measureModifiers';
import { StaffModifierBase, SmoInstrument } from './staffModifiers';
import { SmoSystemGroup, SmoSystemGroupParamsSer, SmoScoreModifierBase, SmoPageLayout, 
  SmoFormattingManager, SmoAudioPlayerSettings, SmoAudioPlayerParameters, SmoLayoutManagerParamsSer,
  SmoLayoutManager, FontPurpose,
  SmoScoreInfo, SmoScoreInfoKeys, ScoreMetadataSer,  SmoScorePreferences, SmoPageLayoutParams, 
  SmoLayoutManagerParams, SmoFormattingManagerParams } from './scoreModifiers';
import { SmoTextGroup, SmoScoreText, SmoTextGroupParamsSer }   from './scoreText';
import { SmoSystemStaff, SmoSystemStaffParams, SmoSystemStaffParamsSer } from './systemStaff';
import { SmoSelector, SmoSelection } from '../xform/selections';
import { smoSerialize } from '../../common/serializationHelpers';
import { FontInfo } from '../../common/vex';

/**
 * List of engraving fonts available in Smoosic
 */
export type engravingFontType =  'Bravura' |  'Gonville' | 'Petaluma' | 'Leland';
/**
 * Arrary of engraving fonts available in Smoosic
 */
export const engravingFontTypes: engravingFontType[] = ['Bravura', 'Gonville', 'Petaluma', 'Leland'];

export function isEngravingFont(et: engravingFontType | string): et is engravingFontType {
  return (engravingFontTypes as any[]).indexOf(et) >= 0;
}

/**
 * Constructor parameters.  Usually you will call
 * {@link SmoScore.defaults}, and modify the parameters you need to change.
 * A new score with the defaults will create a single, empty measure.
 * @category SmoParameters
 */
export interface SmoScoreParams {
  /**
   * global font defaults for this score
   */
  fonts: FontPurpose[],
  /**
   * identifying information about the score
   */
  scoreInfo: SmoScoreInfo,
  /**
   * customized editor behavior
   */
  preferences: SmoScorePreferences,
  /**
   * contained {@link SmoSystemStaffParams} objects
   */  
  staves: SmoSystemStaffParams[],
  activeStaff?: number,
  /**
   * score text, not part of specific music
   */
  textGroups: SmoTextGroup[],
  /**
   * System groups for formatting/justification
   */
  systemGroups: SmoSystemGroup[],
  /**
   * future: global audio settings
   */
  audioSettings: SmoAudioPlayerParameters,
  /**
   * layout manager, for svg and div geometry, page sizes, header sizes etc.
   */
  layoutManager?: SmoLayoutManager,
  /**
   * measure-specific formatting
   */
  formattingManager?: SmoFormattingManager
}
function isSmoScoreParams(params: Partial<SmoScoreParams>): params is SmoScoreParams {
  if (params.fonts && params.fonts.length) {
    return true;
  }
  return false;
}
/**
 * Serialization structure for the entire score.  Score is deserialized from this
 * @category serialization
 */
export interface SmoScoreParamsSer {
  /**
   * some information about the score, mostly non-musical
   */
  metadata: ScoreMetadataSer,
  /**
   * contained {@link SmoSystemStaffParams} objects
   */  
  staves: SmoSystemStaffParamsSer[],
  /**
   * score text, not part of specific music
   */
  textGroups: SmoTextGroupParamsSer[],
  /**
   * System groups for formatting/justification
   */
  systemGroups: SmoSystemGroupParamsSer[],
  /**
   * future: global audio settings
   */
  audioSettings: SmoAudioPlayerParameters,
  /**
   * layout manager, for svg and div geometry, page sizes, header sizes etc.
   */
  layoutManager?: SmoLayoutManagerParamsSer,
  /**
   * map of measure formats to measure
   */
  measureFormats: SmoMeasureFormatParamsSer[],
  /**
   * tempo, key and other column-mapped parameters
   */
  columnAttributeMap: ColumnParamsMapType,
  /**
   * dictionary compression for serialization
   */
  dictionary: Record<string,string>
}

export interface SmoScoreSerializeOptions {
  skipStaves: boolean,
  useDictionary: boolean
}
// dont' deserialize trivial text blocks saved by mistake
export function isEmptyTextBlock(params: Partial<SmoTextGroupParamsSer>): params is SmoTextGroupParamsSer {
  if (Array.isArray(params?.textBlocks) || Array.isArray((params as any)?.blocks)) {
    return false;
  }
  return true;
}
export interface ColumnParamsMapType {
  keySignature: Record<number, string>,
  tempo: Record<number, SmoTempoText>,
  timeSignature: Record<number, TimeSignature>,
  renumberingMap: Record<number, number>
}

// SmoScoreParemsSer
export function isSmoScoreParemsSer(params: Partial<SmoScoreParamsSer>): params is SmoScoreParamsSer {
  if (Array.isArray(params.staves)) {
    return true;
  }
  return false;
}
/**
 * Union of modifier types Smo modifier types
 */
export type SmoModifier = SmoNoteModifierBase | SmoMeasureModifierBase | StaffModifierBase | SmoScoreModifierBase;

/**
 * Score is a container of staves, and metadata about the score.  Serializing the score serializes the 
 * child object.  It is the highest-level object in Smoosic.
 */
export class SmoScore {
  /**
   * Map of instruments to staves, used in serialization.
   *
   * @type {any[]}
   * @memberof SmoScore
   */
  instrumentMap: any[] = [];
  /**
   * Default fonts in this score, for each type of text (lyrics, etc)
   *
   * @type {FontPurpose[]}
   * @memberof SmoScore
   */
  fonts: FontPurpose[] = [];
  /**
   * General info about the score, used for export and library
   *
   * @type {SmoScoreInfo}
   * @memberof SmoScore
   */
  scoreInfo: SmoScoreInfo = SmoScore.scoreInfoDefaults;
  /**
   * Default behavior for this score.  Indicates some global behavior like whether to advance the cursor.
   *
   * @type {SmoScorePreferences}
   * @memberof SmoScore
   */
  preferences: SmoScorePreferences = new SmoScorePreferences(SmoScorePreferences.defaults);
  /**
   * The staves that make up the music of the score
   *
   * @type {SmoSystemStaff[]}
   * @memberof SmoScore
   */
  staves: SmoSystemStaff[] = [];
  /**
   * The active staff, used for some types of selections.  Not serialized.
   *
   * @type {number}
   * @memberof SmoScore
   */
  activeStaff: number = 0;
  /**
   * Text associated with the score, but not a specific musical element (e.g. lyrics are contains by notes)
   *
   * @type {SmoTextGroup[]}
   * @memberof SmoScore
   */
  textGroups: SmoTextGroup[] = [];
  /**
   * A logical grouping of staves for justification
   *
   * @type {SmoSystemGroup[]}
   * @memberof SmoScore
   */
  systemGroups: SmoSystemGroup[] = [];
  /**
   * some audio player defaults
   *
   * @type {SmoAudioPlayerSettings}
   * @memberof SmoScore
   */
  audioSettings: SmoAudioPlayerSettings;
  /**
   * Preserve a map of measures to their actual measure numbers
   *
   * @type {Record<number, number>}
   * @memberof SmoScore
   */
  renumberingMap: Record<number, number> = {};
  /**
   * page and rendering layout of the score, including the ppi and scaling of the pages.
   *
   * @type {SmoLayoutManager}
   * @memberof SmoScore
   */
  layoutManager?: SmoLayoutManager;
  /**
   * per-measure formatting customizations.
   *
   * @type {SmoFormattingManager}
   * @memberof SmoScore
   */
  formattingManager?: SmoFormattingManager
  constructor(params: SmoScoreParams) {
    smoSerialize.vexMerge(this, SmoScore.defaults);
    smoSerialize.vexMerge(this, params);
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
    this.audioSettings = new SmoAudioPlayerSettings(params.audioSettings);
    this.updateMeasureFormats();
    this.updateSystemGroups();
  }
  static get engravingFonts(): Record<string, string> {
    return { Bravura: 'Bravura', Gonville: 'Gonville', Petaluma: 'Petaluma' };
  }
  static get fontPurposes(): Record<string, number> {
    return { ENGRAVING: 1, SCORE: 2, CHORDS: 3, LYRICS: 4 };
  }
  static get scoreInfoDefaults(): SmoScoreInfo {
    return JSON.parse(JSON.stringify({
      name: 'Smoosical',
      title: 'Smoosical',
      subTitle: '(Op. 1)',
      composer: 'Me',
      copyright: '',
      version: 1
    }));
  }
  static get scoreMetadataDefaults(): ScoreMetadataSer {
    return JSON.parse(JSON.stringify({
      fonts: [],
      scoreInfo: SmoScore.scoreInfoDefaults,
      renumberingMap: {},
      preferences: new SmoScorePreferences(SmoScorePreferences.defaults)
    }));
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
      scoreInfo: SmoScore.scoreInfoDefaults,
      audioSettings: new SmoAudioPlayerSettings(SmoAudioPlayerSettings.defaults),
      preferences: new SmoScorePreferences(SmoScorePreferences.defaults),
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

  static get preferences() {
    return ['preferences', 'fonts', 'scoreInfo', 'audioSettings'];
  }
  /**
   * serialize the keySignature, tempo and time signature, which are mapped
   * to a column at a measure index
   * @returns 
   */
  serializeColumnMapped() {
    const keySignature: Record<number, string> = {};
    const tempo: Record<number, SmoTempoText> = {};
    const timeSignature: Record<number, TimeSignature> = {};
    const renumberingMap: Record<number, number> = {};
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
        renumberingMap[0] = 0;
        previous = current;
      } else {
        if (typeof(this.renumberingMap[measure.measureNumber.measureIndex]) === 'number') {
          renumberingMap[measure.measureNumber.measureIndex] = this.renumberingMap[measure.measureNumber.measureIndex];
        }
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
    return { keySignature, tempo, timeSignature, renumberingMap };
  }

  /**
   * Column-mapped attributes stay the same in each measure until
   * changed, like key-signatures.  We don't store each measure value to
   * make the files smaller
   * @param scoreObj - the json blob that contains the score data
   * @returns 
   */
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
              measure[attr] = TimeSignature.createFromPartial(curValue);
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
  serialize(options?: SmoScoreSerializeOptions): SmoScoreParamsSer {
    const skipStaves = options?.skipStaves ?? false;
    const useDictionary = options?.skipStaves ?? true;
    let obj: Partial<SmoScoreParamsSer> = {
      layoutManager: { ctor: 'SmoLayoutManager', ...SmoLayoutManager.defaults },
      audioSettings: {},
      measureFormats: [],
      staves: [],
      textGroups: [],
      systemGroups: [],
      metadata: SmoScore.scoreMetadataDefaults
    };
    if (this.layoutManager) {
      obj.layoutManager = this.layoutManager.serialize();
    }
    obj.metadata!.fonts = JSON.parse(JSON.stringify(this.fonts));
    obj.metadata!.renumberingMap = JSON.parse(JSON.stringify(this.renumberingMap));
    obj.metadata!.preferences = this.preferences.serialize();
    obj.metadata!.scoreInfo = JSON.parse(JSON.stringify(this.scoreInfo));
    if (this.formattingManager) {
      obj.measureFormats = this.formattingManager.serialize();
    }

    obj.audioSettings = this.audioSettings.serialize();
    if (!skipStaves) {
      this.staves.forEach((staff: SmoSystemStaff) => {
        obj.staves!.push(staff.serialize({ skipMaps: true }));
      });
    } else {
      obj.staves = [];
    }
    // Score text is not part of text group, so don't save separately.
    this.textGroups.forEach((tg) => {
      if (tg.isTextVisible()) {
        obj.textGroups!.push(tg.serialize());
      }
    });
    this.systemGroups.forEach((gg) => {
      obj.systemGroups!.push(gg.serialize());
    });
    obj.columnAttributeMap = this.serializeColumnMapped();
    if (useDictionary) {
      smoSerialize.jsonTokens(obj);
      obj = smoSerialize.detokenize(obj, smoSerialize.tokenValues);
      obj.dictionary = smoSerialize.tokenMap;
    }
    return obj as SmoScoreParamsSer;
  }

  /**
   * serialize the document in Smoosic XML format
   * @returns 
   */
 serializeXml() {
    const namespace = smoXmlNs;
    const doc = document.implementation.createDocument(namespace, '', null);
    
    let ser: SmoScoreParamsSer = this.serialize({ skipStaves: false, useDictionary: false });
    const rootElement = doc.createElementNS(namespace, 'score');
    // const piElement = doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
    doc.appendChild(rootElement);
    
    const scoreMetadata = { fonts: ser.metadata.fonts, preferences: ser.metadata.preferences,
      scoreInfo: ser.metadata.scoreInfo };
    const scoreElement = createChildElementRecurse( scoreMetadata, namespace, rootElement, 'metadata');
    const renumberingKeys = Object.keys(ser.metadata.renumberingMap);
    if (renumberingKeys.length) {
      const rec = doc.createElementNS(namespace, 'renumberingMap');
      scoreElement.appendChild(rec);
      renumberingKeys.forEach((mapKey) => {
        const inst = doc.createElementNS(namespace, 'renumberingMap-instance');
        rec.appendChild(inst);
        createXmlAttribute(inst, 'localIndex', ser.metadata.renumberingMap[mapKey]);
        createXmlAttribute(inst, 'measureIndex', mapKey);
      });
    }
    createChildElementRecurse(ser.textGroups, namespace, rootElement, 'textGroups');
    createChildElementRecurse(ser.systemGroups, namespace, rootElement, 'systemGroups');
    createChildElementRecurse(ser.audioSettings, namespace, rootElement, 'audioSettings');
    createChildElementRecurse(ser.layoutManager, namespace, rootElement, 'layoutManager');
    createChildElementRecurse(ser.measureFormats, namespace, rootElement, 'measureFormats');
    serializeXmlModifierArray(this.staves, namespace, rootElement, 'staves');
    const columnParamsElem = doc.createElementNS(namespace, 'columnAttributeMap');
    rootElement.appendChild(columnParamsElem);
    createChildElementRecord(ser.columnAttributeMap.keySignature, namespace, columnParamsElem, 'keySignature', true);
    createChildElementRecord(ser.columnAttributeMap.renumberingMap, namespace, columnParamsElem, 'renumberingMap', true);
    createChildElementRecord(ser.columnAttributeMap.tempo, namespace, columnParamsElem, 'tempo', true);
    createChildElementRecord(ser.columnAttributeMap.timeSignature, namespace, columnParamsElem, 'timeSignature', true);
    const ndoc = smoSerialize.prettifyXml(doc);
    const piElement = ndoc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
    ndoc.insertBefore(piElement, ndoc.firstChild);
    return ndoc;
  }
  updateScorePreferences(pref: SmoScorePreferences) {
    this.preferences = pref;
    SmoMeasure.defaultDupleDuration = pref.defaultDupleDuration;
    SmoMeasure.defaultTripleDuration = pref.defaultTripleDuration;
  }
  get engravingFont(): engravingFontType {
    const efont = this.fonts.find((x) => x.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (efont) {
      const val: engravingFontType | undefined = engravingFontTypes.find((x) => x === efont.family);
      if (val) {
        return val;
      }
    }
    return 'Bravura';
  }
  set engravingFont(value: engravingFontType) {
    const efont = this.fonts.find((x) => x.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (efont && isEngravingFont(value)) {
      efont.family = value;
    }
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
  /**
   * Convert legacy score layout to layoutManager object parameters
   * @param jsonObj 
   */
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
   * Hack: for the case of a score containing only a single part, use the text from the 
   * part.
   * @param jsonObj 
   * @returns 
   */
  static fixTextGroupSinglePart(jsonObj: any) {
    if (jsonObj.staves.length !== 1) {
      return;
    }
    if (!jsonObj.staves[0].partInfo) {
      return;
    }
    if (!jsonObj.staves[0].partInfo.textGroups || jsonObj.staves[0].partInfo.textGroups.length < 1) {
      return;
    }
    jsonObj.textGroups = JSON.parse(JSON.stringify(jsonObj.staves[0].partInfo.textGroups));
  }
  /**
   * Deserialize an entire score
   * @param jsonString 
   * @returns SmoScore
   */
  static deserialize(jsonString: string): SmoScore {
    let jsonObj: Partial<SmoScoreParamsSer> = JSON.parse(jsonString);
    let upconvertFormat = false;
    let formattingManager = null;
    if (jsonObj.dictionary) {
      jsonObj = smoSerialize.detokenize(jsonObj, jsonObj.dictionary);
    }
    SmoScore.fixTextGroupSinglePart(jsonObj);
    upconvertFormat = typeof (jsonObj.measureFormats) === 'undefined';
    const params: Partial<SmoScoreParams> = {};
    const staves: SmoSystemStaff[] = [];
    jsonObj.textGroups = jsonObj.textGroups ? jsonObj.textGroups : [];

    // Explode the sparse arrays of attributes into the measures
    SmoScore.deserializeColumnMapped(jsonObj);
    // 'score' attribute name changes to 'metadata'
    if (typeof((jsonObj as any).score) !== 'undefined') {
      jsonObj.metadata = (jsonObj as any).score;
    }
    // meaning of customProportion has changed, backwards-compatiblity
    if (typeof(jsonObj.metadata) === 'undefined') {
      throw 'bad score ' + JSON.stringify(jsonObj);
    }
    // upconvert old proportion operator
    const jsonPropUp = jsonObj.metadata.preferences as any;
    if (typeof (jsonPropUp) !== 'undefined' && typeof (jsonPropUp.customProportion) === 'number') {
      SmoMeasureFormat.defaults.proportionality = jsonPropUp.customProportion;
      if (SmoMeasureFormat.defaults.proportionality === SmoMeasureFormat.legacyProportionality) {
        SmoMeasureFormat.defaults.proportionality = SmoMeasureFormat.defaultProportionality;
      }
    }
    // up-convert legacy layout data
    if ((jsonObj.metadata as any).layout) {
      SmoScore.upConvertLayout(jsonObj);
    }
    if (jsonObj.layoutManager && !jsonObj.layoutManager.globalLayout) {
      SmoScore.upConvertGlobalLayout(jsonObj);
    }
    if (!jsonObj.layoutManager) {
      throw 'bad score, layout mgr ' + JSON.stringify(jsonObj);
    }
    const layoutManagerParams: SmoLayoutManagerParams = {
      globalLayout: jsonObj.layoutManager.globalLayout,
      /**
       * page margins for each page
       */
      pageLayouts: []
    }
    jsonObj.layoutManager.pageLayouts.forEach((pl) => {
      const pageLayout = new SmoPageLayout(pl);
      layoutManagerParams.pageLayouts.push(pageLayout);
    });
    const layoutManager = new SmoLayoutManager(layoutManagerParams);


    // params.layout = JSON.parse(JSON.stringify(SmoScore.defaults.layout));
    smoSerialize.serializedMerge(
      ['renumberingMap', 'fonts'],
      SmoScore.scoreMetadataDefaults, params);    
    smoSerialize.serializedMerge(
      ['renumberingMap', 'fonts'],
      jsonObj.metadata, params);
    if (jsonObj.metadata.preferences) {
      params.preferences = new SmoScorePreferences(jsonObj.metadata.preferences);
    } else {
      params.preferences = new SmoScorePreferences(SmoScorePreferences.defaults);
    }
    if (jsonObj.metadata.scoreInfo) {
      const scoreInfo: Partial<SmoScoreInfo> = {};
      smoSerialize.serializedMerge(SmoScoreInfoKeys, SmoScore.scoreInfoDefaults, scoreInfo);
      smoSerialize.serializedMerge(SmoScoreInfoKeys, jsonObj.metadata.scoreInfo, scoreInfo);
      params.scoreInfo = (scoreInfo as SmoScoreInfo);
    } else {
      params.scoreInfo = SmoScore.scoreInfoDefaults;
    }
    if (!jsonObj.audioSettings) {
      params.audioSettings = new SmoAudioPlayerSettings(SmoAudioPlayerSettings.defaults);
    } else {
      params.audioSettings = SmoScoreModifierBase.deserialize(jsonObj.audioSettings);
    }
    params.preferences.transposingScore = params.preferences.transposingScore ?? false;
    params.preferences.hideEmptyLines = params.preferences.hideEmptyLines ?? false;
    let renumberingMap: Record<number, number> = { 0: 0 };
    if (jsonObj.columnAttributeMap && jsonObj.columnAttributeMap.renumberingMap) {
      renumberingMap = jsonObj.columnAttributeMap.renumberingMap;
    }
    if (!jsonObj.staves) {
      throw 'bad score, no staves: ' + JSON.stringify(jsonObj);
    }
    jsonObj.staves.forEach((staffObj: any, staffIx: number) => {
      staffObj.staffId = staffIx;
      staffObj.renumberingMap = renumberingMap;
      const staff = SmoSystemStaff.deserialize(staffObj);
      staves.push(staff);
    });

    const textGroups: SmoTextGroup[] = [];
    jsonObj.textGroups.forEach((tg: any) => {
      if (!isEmptyTextBlock(tg)) {
        textGroups.push(SmoTextGroup.deserializePreserveId(tg));
      }
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
      formattingManager = SmoScore.measureFormatFromLegacyScore(params as any, jsonObj);
    } else  {
      const measureParams: SmoFormattingManagerParams = {
        measureFormats: [],
        partIndex: -1
      }
      if (jsonObj.measureFormats) {
        jsonObj.measureFormats.forEach((mf: SmoMeasureFormatParamsSer) => {
          const mfObj = new SmoMeasureFormat(mf);
          measureParams.measureFormats?.push(mfObj);
        });
      }
      params.formattingManager = new SmoFormattingManager(measureParams);
    }
    params.layoutManager = layoutManager;
    if (!isSmoScoreParams(params)) {
      throw 'Bad score, missing params: ' + JSON.stringify(params, null, ' ');
    }
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
   * We have deleted a measure, update the renumber index to
   * shuffle back.
   * @param indexToDelete 
   */
  updateRenumberForAddDelete(indexToDelete: number, toAdd: boolean) {
    if (!toAdd && indexToDelete === 0) {
      return;
    }
    const maxIndex = this.staves[0].measures.length - 1;
    const increment = toAdd ? 1 : -1;
    for (var i = indexToDelete; i < maxIndex; ++i) {
      if (typeof(this.renumberingMap[i]) === 'number') {
        this.renumberingMap[i] = this.renumberingMap[i] + increment;
      }
    }
    if (typeof(this.renumberingMap[maxIndex]) === 'number' && !toAdd) {
      delete this.renumberingMap[maxIndex];
    }
  }

  updateRenumberingMap(measureIndex: number, localIndex: number) {
    if (measureIndex === 0) {
      this.renumberingMap[0] = localIndex;
    } else if (typeof(this.renumberingMap[measureIndex]) === 'number') {
      if (measureIndex === localIndex) {
        delete this.renumberingMap[measureIndex];
      } else {
        this.renumberingMap[measureIndex] = localIndex;
      }
    } else {
      this.renumberingMap[measureIndex] = localIndex;
    }
    this.staves.forEach((staff) => {
      staff.renumberingMap = this.renumberingMap;
    });
    this.numberStaves();
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

  /**
   * determine if the measure at this index could be a multi-measure rest
   * @param measureIndex - the measure index we are considering to add
   * @param start - the measure index would be the start of the rest 
   * @returns 
   */
  isMultimeasureRest(measureIndex: number, start: boolean, forceRest: boolean) {
    let i = 0;
    for (i = 0; i < this.staves.length; ++i) {
      if (!forceRest && !this.staves[i].isRest(measureIndex)) {
        return false;
      }
      if (this.staves[i].getVoltasForMeasure(measureIndex).length > 0) {
        return false;
      }
      if (this.staves[i].isRepeatSymbol(measureIndex)) {
        return false;
      }
      if (!start && measureIndex > 0 && this.staves[i].isRepeat(measureIndex - 1)) {
        return false;
      }
      if (this.staves[i].isRehearsal(measureIndex)) {
        return false;
      }
      // instrument change other than the initial measure
      if (this.staves[i].measureInstrumentMap[measureIndex] && i > 0) {
        return false;
      }
    }
    if (measureIndex > 0) {
      const measure = this.staves[0].measures[measureIndex];
      const prev = this.staves[0].measures[measureIndex - 1];
      if (!start && !TimeSignature.equal(measure.timeSignature, prev.timeSignature)) {
        return false;
      }
      if (!start && measure.keySignature !== prev.keySignature) {
        return false;
      }
    }
    return true;
  }

  /**
   * Restore measure formats stored when a score is serialized
   */
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
    this.updateRenumberForAddDelete(measureIndex, true);
    this.staves.forEach((staff) => {
      const defaultMeasure =
        SmoMeasure.getDefaultMeasureWithNotes(parameters);
      staff.addMeasure(measureIndex, defaultMeasure);
    });
  }
  getLocalMeasureIndex(measureIndex: number) {
    let maxKey = -1;
    const keys = Object.keys(this.updateRenumberForAddDelete);
    keys.forEach((key) => {
      const numKey = parseInt(key, 10);
      if (numKey <= measureIndex && numKey > maxKey) {
        maxKey = numKey;
      }
    });
    if (maxKey < 0) {
      return measureIndex;
    }
    return this.renumberingMap[maxKey] + (measureIndex - maxKey);
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
    this.updateRenumberForAddDelete(measureIndex, false);
  }
  /**
   * get a measure 'compatible' with the measure at the given index, in terms
   * of key, time signature etc.
   * @param measureIndex 
   * @param staffIndex 
   * @returns 
   */
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

  /**
   * Give a measure prototype, create a new measure and add it to each staff, with the
   * correct settings for current time signature/clef.
   * @param measureIndex 
   */
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
    this.updateRenumberForAddDelete(measureIndex, true);
    this.numberStaves();
  }

  /**
   * Replace the measure at the given location.  Probably due to an undo operation or paste.
   * @param selector 
   * @param measure 
   */
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

  /**
   * Probably due to an undo operation, replace the staff at the given index.
   * @param index 
   * @param staff 
   */
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
  /**
   * 
   * @param measureIndex 
   * @param key 
   */
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
  addStaff(parameters: SmoSystemStaffParams): SmoSystemStaff {
    let i = 0;
    if (this.staves.length === 0) {
      const staff = new SmoSystemStaff(parameters);
      this.staves.push(staff);
      this.activeStaff = 0;
      // For part views, we renumber the staves even if there is only one staff.
      if (staff.measures.length) {
        this.numberStaves();
      }
      return staff;
    }
    if (!parameters) {
      parameters = SmoSystemStaff.defaults;
    }
    const proto = this.staves[0];
    const measures = [];
    for (i = 0; i < proto.measures.length; ++i) {
      const measure: SmoMeasure = proto.measures[i];
      const jsonObj: SmoMeasureParamsSer = measure.serialize();
      // Need to do this since score serialization doesn't include TS in each measure
      jsonObj.timeSignature = measure.timeSignature.serialize();
      jsonObj.tempo = measure.tempo.serialize();
      let newMeasure = SmoMeasure.deserialize(jsonObj);
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
    return staff;
  }
  /**
   * delete any system groups that apply to deleted staves
   */
  updateSystemGroups() {
    const grpToKeep: SmoSystemGroup[] = [];
    this.systemGroups.forEach((grp) => {
      if (grp.startSelector.staff < this.staves.length && 
        grp.endSelector.staff < this.staves.length
        ) {
          grpToKeep.push(grp);
      }
    });
    this.systemGroups = grpToKeep;
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
    this.updateSystemGroups();
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

  updateTextGroup(textGroup: SmoTextGroup, toAdd: boolean) {
    const tgid = typeof (textGroup) === 'string' ? textGroup :
      textGroup.attrs.id;
    const ar = this.textGroups.filter((tg) => tg.attrs.id !== tgid);
    this.textGroups = ar;
    if (toAdd) {
      this.textGroups.push(textGroup);
    }
  }
  addTextGroup(textGroup: SmoTextGroup) {
    this.updateTextGroup(textGroup, true);
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
    this.updateTextGroup(textGroup, false);
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
    fontInst.family = fontInfo.family ?? '';
    fontInst.size = parseInt(SmoScoreText.fontPointSize(fontInfo.size).toString());
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
