// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * A score modifier is anything that isn't mapped specifically to a musical object.
 * This includes score text, layout information
 * @module /smo/data/scoreModifier
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMeasureFormat, SmoMeasureFormatParamsSer } from './measureModifiers';
import { SmoAttrs, getId, SmoModifierBase, SvgBox, 
  createXmlAttribute } from './common';
import { SmoMeasure } from './measure';
import { SmoSelector } from '../xform/selections';

/**
 * Base class for all {@link SmoScore} modifiers. 
 * It is used to de/serialize the objects.
 * @category SmoModifier
 */
export abstract class SmoScoreModifierBase implements SmoModifierBase {
  /**
   * constructor
   *
   * @type {string}
   * @memberof SmoScoreModifierBase
   */
  ctor: string;
  /**
   * When rendered, keep track of the box
   *
   * @type {(SvgBox | null)}
   * @memberof SmoScoreModifierBase
   */
  logicalBox: SvgBox | null = null;
  /**
   * attributes for identification
   *
   * @type {SmoAttrs}
   * @memberof SmoScoreModifierBase
   */
  attrs: SmoAttrs;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: getId().toString(),
      type: ctor
    };
  }
  abstract serialize(): any;
  static deserialize(jsonObj: any) {
    const ctor = eval('globalThis.Smo.' + jsonObj.ctor);
    const rv = new ctor(jsonObj);
    return rv;
  }
}

/**
 * For global/default font settings.
 * @param name to distinguish: chord, lyric etc.
 * @param family font family
 * @param size in points
 * @param custom used to distinguish a specific text is not the default
 */
export interface FontPurpose {
  /**
   * name of the purpose
   * { ENGRAVING: 1, SCORE: 2, CHORDS: 3, LYRICS: 4 }
   */
  name: string,
  /**
   * purpose enumeration
   */
  purpose: number,
  /**
   * font family
   */
  family: string,
  /**
   * default font size
   */
  size: number,
  /**
   * a flag that can be used to indicate if this is the global default, or a customization.
   * For lyrics for instance, most lyrics would use the custom font, this would be true if
   * it was overridden
   */
  custom: boolean
}


// @internal
export type SmoScoreInfoKey = 'name' | 'title' | 'subTitle' | 'composer' | 'copyright';
export const SmoScoreInfoKeys = ['name', 'title', 'subTitle', 'composer', 'copyright'];
/**
 * Information about the score itself, like composer etc.
 * @category SmoModifier
 */
export interface SmoScoreInfo {
  /**
   * deprecated, now defaults to title
   */
  name: string,
  /**
   * name of score
   */
  title: string,
  /**
   * subtitle/opus
   */
  subTitle: string,
  /**
   * who wrote it
   */
  composer: string,
  /**
   * copyright information
   */
  copyright: string,
  /**
   * for version tracking
   */
  version: number
}


export type SmoScorePreferenceBool = 'autoPlay' | 'autoAdvance' | 'showPiano' | 'hideEmptyLines' | 'transposingScore';
export type SmoScorePreferenceNumber = 'defaultDupleDuration' | 'defaultTripleDuration';
export const SmoScorePreferenceBools: SmoScorePreferenceBool[] = ['autoPlay', 'autoAdvance', 'showPiano', 'hideEmptyLines', 'transposingScore'];
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
  hideEmptyLines: boolean;
  transposingScore: boolean;
}
/**
 * Some default SMO behavior
 * @param autoPlay play a new note or chord
 * @param autoAdvance Sibelius-like behavior of advancing cursor when a letter note is placed
 * @param defaultDupleDuration in ticks, even metered measures
 * @param defaultTripleDuration in ticks, 6/8 etc.
 * @param showPiano show the piano widget in the score
 * @param hideEmptyLines Hide empty lines in full score
 * @param transposingScore Whether to show the score parts in concert key
 * @category SmoModifier
 */
export class SmoScorePreferences {
  autoPlay: boolean = true;
  autoAdvance: boolean = true;
  defaultDupleDuration: number = 4096;
  defaultTripleDuration: number = 6144;
  showPiano: boolean = true;
  hideEmptyLines: boolean = false;
  transposingScore: boolean = false;
  static get defaults(): SmoScorePreferencesParams {
    return {
      autoPlay: true,
      autoAdvance: true,
      defaultDupleDuration: 4096,
      defaultTripleDuration: 6144,
      showPiano: true,
      hideEmptyLines: false,
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
  serialize(): SmoScorePreferencesParams {
    return {
      ...this
    }
  }
}
/**
 * non-musical information about the score
 */
export interface ScoreMetadataSer {
  fonts: FontPurpose[],
  preferences: SmoScorePreferencesParams,
  renumberingMap: Record<string, string>,
  scoreInfo: SmoScoreInfo
}

/**
 * Map of measure formatting to measure IDs.  We only save non-default formats
 * @param measureFormats 
 * @param partIndex 
 */
export interface SmoFormattingManagerParams {
  /**
   * map of index to {@link SmoMeasureFormat} objects
   */
  measureFormats?: SmoMeasureFormat[],
  /**
   * the associated part, or -1 for the score
   */
  partIndex?: number
}
/**
 * A score can have different views - one for the score itself and one for each
 * part, and each part can have its own formatting and text.
 * *Note*: I may move this to part info module.
 * @param measureFormats map of index to {@link SmoMeasureFormat} objects
 * @param partIndex the associated part, or -1 for the score
 * @category SmoModifier
 */
export class SmoFormattingManager extends SmoScoreModifierBase {
  measureFormats: Record<number, SmoMeasureFormat>;
  partIndex: number = -1;
  static get forScore() {
    return -1;
  }
  static get defaults(): SmoFormattingManagerParams {
    return {
      measureFormats: [new SmoMeasureFormat(SmoMeasureFormat.defaults)],
      partIndex: -1
    };
  }

  constructor(params: SmoFormattingManagerParams) {
    super('SmoFormattingManager');
    if (typeof (params) === 'undefined') {
      params = {};
    }
    this.measureFormats = {};
    this.partIndex = SmoFormattingManager.forScore;
    if (typeof (params.partIndex) !== 'undefined') {
      this.partIndex = params.partIndex;
    }
    if (typeof (params.measureFormats) !== 'undefined' && params.measureFormats.length) {
      params.measureFormats.forEach((format) => {
        // 0 is default value, so fix case of first measure
        if (typeof(format.measureIndex) !== 'number') {
          format.measureIndex = 0;
        }
        this.measureFormats[format.measureIndex] = new SmoMeasureFormat(format);
      });
    }
  }
  /**
   * Update the measure format for the measure at the given index
   * @param format 
   */
  updateMeasureFormat(format: SmoMeasureFormat) {
    this.measureFormats[format.measureIndex] = format;
  }
  /**
   * Update the measure format based on the format of a given measure
   * @param measure 
   */
  updateFormat(measure: SmoMeasure) {
    if (this.measureFormats[measure.measureNumber.measureIndex]) {
      measure.format = this.measureFormats[measure.measureNumber.measureIndex];
    } else {
      measure.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
    }
  }
  serialize(): SmoMeasureFormatParamsSer[] {
    const rv: SmoMeasureFormatParamsSer[] = [];
    const keys = Object.keys(this.measureFormats);
    keys.forEach((key: any) => {
      if (!this.measureFormats[key].isDefault) {
        rv.push(this.measureFormats[key].serialize());
      }
    });
    return rv;
  }
}

export type SmoAudioPlayerType = 'sampler' | 'synthesizer';
/**
 * Constructor parameters for audio player
 */
export interface SmoAudioPlayerParameters {
  playerType?: SmoAudioPlayerType,
  waveform?: OscillatorType,
  reverbEnable?: boolean,
  reverbDelay?: number,
  reverbDecay?: number
}

/**
 * web audio API defines this
 * @param otype 
 * @returns 
 */
export function IsOscillatorType(otype: OscillatorType | string): otype is OscillatorType {
  return ['sine', 'square', 'sawtooth', 'triangle', 'custom'].findIndex((x) => x === otype) >= 0;
}
/**
 * Audio playback parameters.  Just fun stuff.
 * @category SmoModifier
 */
export class SmoAudioPlayerSettings extends SmoScoreModifierBase {
  static get defaults(): SmoAudioPlayerParameters {
    return ({
      playerType: 'sampler',
      waveform: 'sine',
      reverbEnable: true,
      reverbDelay: 0.5,
      reverbDecay: 2
    });
  }
  static get attributes() {
    return ['playerType', 'waveform', 'reverbEnable', 'reverbDelay', 'reverbDecay'];
  }

  playerType: SmoAudioPlayerType = 'sampler';
  waveform: OscillatorType = 'sine';
  reverbEnable: boolean = true;
  reverbDelay: number = 0.2;
  reverbDecay: number = 0.5;
  constructor(params: SmoAudioPlayerParameters) {
    super('SmoAudioPlayerSettings');
    smoSerialize.serializedMerge(SmoAudioPlayerSettings.attributes, SmoAudioPlayerSettings.defaults, this);
    smoSerialize.serializedMerge(SmoAudioPlayerSettings.attributes, params, this);
  }
  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoAudioPlayerSettings.defaults, SmoAudioPlayerSettings.attributes, this, params);
    params.ctor = 'SmoAudioPlayerSettings';
    return params;
  }
}
export type ScaledPageAttributes = 'leftMargin' | 'rightMargin' | 'topMargin' | 'bottomMargin' | 'interGap' | 'intraGap';
/**
 * Constructor parameters for {@link SmoPageLayout}, part of {@link SmoLayoutManager}
 * @category SmoParameters, serialization
 */
export interface SmoPageLayoutParams {
  leftMargin: number,
  rightMargin: number,
  topMargin: number,
  bottomMargin: number,
  interGap: number,
  intraGap: number
}
export interface SmoPageLayoutParamsSer {

}
/**
 * Define margins and other layout information associated with a specific page, and may
 * be different on different pages.
 * @category SmoModifier
 */
export class SmoPageLayout extends SmoScoreModifierBase {
  static get defaults(): SmoPageLayoutParams {
    return JSON.parse(JSON.stringify({
      leftMargin: 30,
      rightMargin: 30,
      topMargin: 144,
      bottomMargin: 72,
      interGap: 30,
      intraGap: 10
    }));
  }
  static get attributes(): ScaledPageAttributes[] {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  leftMargin: number = 30;
  rightMargin: number = 30;
  topMargin: number = 40;
  bottomMargin: number = 40;
  interGap: number = 30;
  intraGap: number = 10;
  constructor(params: SmoPageLayoutParams) {
    super('SmoPageLayout');
    this.leftMargin = params.leftMargin;
    this.rightMargin = params.rightMargin;
    this.topMargin = params.topMargin;
    this.bottomMargin = params.bottomMargin;
    this.interGap = params.interGap;
    this.intraGap = params.intraGap;
  }
  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoPageLayout.defaults, SmoPageLayout.attributes, this, params);
    params.ctor = 'SmoPageLayout';
    return params;
  }
}
export type ScaledGlobalAttributes = 'pageWidth' | 'pageHeight';
export type GlobalLayoutAttributes = 'pageWidth' | 'pageHeight' | 'noteSpacing' | 'svgScale' | 'zoomScale' | 'proportionality' | 'maxMeasureSystem';
export const GlobalLayoutAttributesArray: GlobalLayoutAttributes[]  = ['pageWidth', 'pageHeight', 'noteSpacing', 'svgScale', 'zoomScale', 'proportionality', 'maxMeasureSystem'];
/**
 * Global layout are parameters that determine the layout of the whole score, because they affect the containing svg element
 * @category {SmoParams}
 */
export interface SmoGlobalLayout {
  svgScale: number;
  zoomScale: number;
  noteSpacing: number;
  pageWidth: number;
  pageHeight: number;
  proportionality: number,
  maxMeasureSystem: number
}

/**
 * Used to create {@link SmoLayoutManagerParams}
 * @category {SmoParams}
 */
export interface ScaledPageLayout {
  svgScale: number;
  zoomScale: number;
  noteSpacing: number;
  pageWidth: number;
  pageHeight: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  interGap: number;
  intraGap: number;
  pages: number;
  maxMeasureSystem: number;
}
/**
 * Constructor parameters for {@link SmoLayoutManager}
 * @category {SmoParams}
 */
export interface SmoLayoutManagerParams {
  /**
   * global svg settings for zoom, page width/height
   */
  globalLayout: SmoGlobalLayout,
  /**
   * page margins for each page
   */
  pageLayouts: SmoPageLayout[]
}
export interface SmoLayoutManagerParamsSer {
  /**
   * constructor
   */
  ctor: string; 
  /**
   * global svg settings for zoom, page width/height
   */
  globalLayout: SmoGlobalLayout,
  /**
   * page margins for each page
   */
  pageLayouts: SmoPageLayoutParams[]
}
function isSmoLayoutManagerParamsSer(params: Partial<SmoLayoutManagerParamsSer>): params is SmoLayoutManagerParamsSer {
  if (!params.ctor || params.ctor !== 'SmoLayoutManager') {
    return false;
  }
  return true;
}
/**
 * Storage and utilities for layout information in the score.  Each
 * manager has one set of page height/width, since svg element
 * must have single length/width and viewbox.
 * Each page can have different margins.
 * @category SmoModifier
 */
export class SmoLayoutManager extends SmoScoreModifierBase {
  static get defaultLayout(): SmoGlobalLayout {
    return {
      svgScale: 0.55,
      zoomScale: 2.0,
      noteSpacing: 1.0,
      pageWidth: 8 * 96 + 48,
      pageHeight: 11 * 96,
      proportionality: 5,
      maxMeasureSystem: 0
    };
  }
  static get defaults(): SmoLayoutManagerParams {
    return {
      globalLayout: JSON.parse(JSON.stringify(SmoLayoutManager.defaultLayout)),
      pageLayouts: []
    };
  }
  static get attributes(): GlobalLayoutAttributes[] {
    return ['pageWidth', 'pageHeight', 'noteSpacing', 'svgScale', 'zoomScale', 'maxMeasureSystem'];
  }
  // Attributes that are scaled by svgScale
  /* static get scalableAttributes(): Global {
    return ['pageWidth', 'pageHeight'];
  }*/
  static get scaledPageAttributes(): ScaledPageAttributes[] {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  static get scaledGlobalAttributes(): ScaledGlobalAttributes[] {
    return ['pageWidth', 'pageHeight'];
  }
  static areLayoutsEqual(g1: SmoGlobalLayout, g2: SmoGlobalLayout) {
    let rv = true;
    GlobalLayoutAttributesArray.forEach((attr) => {
      if (g1[attr] !== g2[attr]) {
        rv = false;
      }
    });
    return rv;
  }
  static isZoomChange(g1: SmoGlobalLayout, g2: SmoGlobalLayout) {
    let rv = true;
    GlobalLayoutAttributesArray.forEach((attr) => {
      if (g1[attr] !== g2[attr] && attr !== 'zoomScale') {
        rv = false;
      }
    });
    return rv;
  }
  /**
   * Adjust zoom width so the score takes up the whole score area
   */
  zoomToWidth(screenWidth: number) {
    const curWidth = this.globalLayout.pageWidth * this.globalLayout.svgScale;
    this.globalLayout.zoomScale = ((screenWidth  - 350) / curWidth) * this.globalLayout.svgScale; // magic 350 for left controls....TODO standardize this
  }
  static getScaledPageLayout(globalLayout: SmoGlobalLayout, pageLayout: SmoPageLayout, pages: number): ScaledPageLayout {
    const rv: Partial<ScaledPageLayout> = {};
    SmoLayoutManager.scaledPageAttributes.forEach((attr: ScaledPageAttributes) => {
      rv[attr] = pageLayout[attr] / globalLayout.svgScale;
    });
    SmoLayoutManager.scaledGlobalAttributes.forEach((attr: ScaledGlobalAttributes) => {
      rv[attr] = globalLayout[attr] / globalLayout.svgScale;
    });
    // Note spacing is relative, so * it and not divide
    rv.noteSpacing = globalLayout.noteSpacing * globalLayout.svgScale;
    rv.svgScale = globalLayout.svgScale;
    rv.zoomScale = globalLayout.zoomScale;
    rv.maxMeasureSystem = globalLayout.maxMeasureSystem;
    
    return rv as ScaledPageLayout;
  }
  globalLayout: SmoGlobalLayout;
  pageLayouts: SmoPageLayout[] = [];
  constructor(params: SmoLayoutManagerParams) {
    super('SmoLayoutManager');
    if (typeof(params.globalLayout.maxMeasureSystem) === 'undefined') {
      params.globalLayout.maxMeasureSystem = SmoLayoutManager.defaultLayout.maxMeasureSystem;
    }
    this.globalLayout = JSON.parse(JSON.stringify(params.globalLayout));
    if (params.pageLayouts.length) {
      params.pageLayouts.forEach((plp) => {
        const pageParams: SmoPageLayoutParams = SmoPageLayout.defaults;
        SmoPageLayout.attributes.forEach((attr) => {
          if (typeof (plp[attr]) !== 'undefined') {
            pageParams[attr] = plp[attr];
          }
        });
        this.pageLayouts.push(new SmoPageLayout(pageParams));
      });
    } else {
      this.pageLayouts.push(new SmoPageLayout(SmoPageLayout.defaults));
    }
  }
  trimPages(pageCount: number) {
    if (pageCount < this.pageLayouts.length - 1) {
      this.pageLayouts = this.pageLayouts.slice(0, pageCount + 1);
    }
  }
  getZoomScale() {
    return this.globalLayout.zoomScale;
  }
  serialize(): SmoLayoutManagerParamsSer {
    const rv: Partial<SmoLayoutManagerParamsSer> = { ctor: 'SmoLayoutManager' };
    rv.pageLayouts = [];
    this.pageLayouts.forEach((pl) => {
      rv.pageLayouts!.push(pl.serialize());
    });
    rv.globalLayout = JSON.parse(JSON.stringify(this.globalLayout));
    if (!isSmoLayoutManagerParamsSer(rv)) {
      throw 'bad layout manager ' + JSON.stringify(rv);
    }
    return rv;
  }
  updateGlobalLayout(params: SmoGlobalLayout) {
    SmoLayoutManager.attributes.forEach((attr: string) => {
      if (typeof ((params as any)[attr]) !== 'undefined') {
        (this.globalLayout as any)[attr] = (params as any)[attr];
      }
    });
  }
  // ### addToPageLayouts
  // Make sure the next page has a layout.  If not, copy settings from
  // previous page.
  addToPageLayouts(pageNum: number) {
    const lastLayout = this.pageLayouts[this.pageLayouts.length - 1];
    if (this.pageLayouts.length <= pageNum) {
      this.pageLayouts.push(new SmoPageLayout(lastLayout));
    }
  }
  getGlobalLayout(): SmoGlobalLayout {
    return JSON.parse(JSON.stringify(this.globalLayout));
  }
  // Return a deep copy of the page parameters, adjusted for the global scale.
  getScaledPageLayout(pageIndex: number): ScaledPageLayout {
    return SmoLayoutManager.getScaledPageLayout(this.globalLayout, this.pageLayouts[pageIndex], this.pageLayouts.length);
  }
  getPageLayout(pageIndex: number): SmoPageLayout {
    return new SmoPageLayout(this.pageLayouts[pageIndex]);
  }
  getPageLayouts(): SmoPageLayout[] {
    const rv: SmoPageLayout[] = [];
    this.pageLayouts.forEach((pl) => {
      rv.push(new SmoPageLayout(pl));
    });
    return rv;
  }
  updatePage(pageLayout: SmoPageLayout, pageIndex: number) {
    if (this.pageLayouts.length > pageIndex) {
      this.pageLayouts[pageIndex] = new SmoPageLayout(pageLayout);
    }
  }
}
/**
 * constructor parameters for system groups (groupings of staves in the score)
 * @param leftConnector
 * @param rightConnector
 * @param mapType
 * @param text
 * @param shortText
 * @param justify
 * @param startSelector not used
 * @param endSelector not used
 * @category SmoParameters
 */
export interface SmoSystemGroupParams {
  /**
   * bracket etc.
   */
  leftConnector: number,
  /**
   * bracket etc.
   */
  rightConnector: number,
  /**
   * future, score groups can be different for different parts of the score
   */
  mapType: number,
  /**
   * whether to justify the notes in the group
   */
  justify: boolean,
  /**
   * if mapped to a range, start
   */
  startSelector: SmoSelector,
  /**
   * if mapped to a range, end
   */
  endSelector: SmoSelector
}
export interface SmoSystemGroupParamsSer extends SmoSystemGroupParams{
  /** 
   * constructor
   */
  ctor: string;
}
function isSmoSystemGroupParamsSer(params: Partial<SmoSystemGroupParamsSer>): params is SmoSystemGroupParamsSer {
  if (params.ctor === 'SmoSystemGroup') {
    return true;
  }
  return false;
}
/**
 * System group is the grouping of staves into a system.
 * @category SmoModifier
 *  */
export class SmoSystemGroup extends SmoScoreModifierBase {
  static get connectorTypes(): Record<string, number> {
    return { brace: 0, bracket: 1, single: 2, double: 3 };
  }
  static get mapTypes(): Record<string, number> {
    return { allMeasures: 0, range: 1 };
  }
  static get attributes(): string[] {
    return ['leftConnector', 'rightConnector', 'text', 'shortText', 'justify',
      'startSelector', 'endSelector', 'mapType'];
  }
  static get defaults(): SmoSystemGroupParams {
    return JSON.parse(JSON.stringify({
      leftConnector: SmoSystemGroup.connectorTypes.single,
      rightConnector: SmoSystemGroup.connectorTypes.single,
      mapType: SmoSystemGroup.mapTypes.allMeasures,
      justify: true,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    }));
  }
  static isSystemGroup(modifier: SmoSystemGroup | SmoModifierBase): modifier is SmoSystemGroup {
    return modifier.ctor === 'SmoSystemGroup';
  }
  leftConnector: number = SmoSystemGroup.connectorTypes.single;
  rightConnector: number = SmoSystemGroup.connectorTypes.single;
  mapType: number = SmoSystemGroup.mapTypes.allMeasures;
  text: string = '';
  shortText: string = '';
  justify: boolean = true;
  startSelector: SmoSelector = SmoSelector.default;
  endSelector: SmoSelector = SmoSelector.default;
  attrs: SmoAttrs;
  constructor(params: SmoSystemGroupParams) {
    super('SmoSystemGroup');
    smoSerialize.serializedMerge(SmoSystemGroup.attributes, SmoSystemGroup.defaults, this);
    smoSerialize.serializedMerge(SmoSystemGroup.attributes, params, this);
    this.attrs = {
      id: getId().toString(),
      type: 'SmoSystemGroup'
    };
  }
  stavesOverlap(group: SmoSystemGroup) {
    return (this.startSelector.staff >= group.startSelector.staff && this.startSelector.staff <= group.endSelector.staff) ||
      (this.endSelector.staff >= group.startSelector.staff && this.endSelector.staff <= group.endSelector.staff);
  }
  measuresOverlap(group: SmoSystemGroup) {
    return this.stavesOverlap(group) &&
      ((this.startSelector.measure >= group.startSelector.measure && this.endSelector.measure <= group.startSelector.measure) ||
        (this.endSelector.measure >= group.startSelector.measure && this.endSelector.measure <= group.endSelector.measure));
  }
  overlaps(group: SmoSystemGroup) {
    return (this.stavesOverlap(group) && this.mapType === SmoSystemGroup.mapTypes.allMeasures) ||
      (this.measuresOverlap(group) && this.mapType === SmoSystemGroup.mapTypes.range);
  }
  serialize(): SmoSystemGroupParamsSer {
    const params: Partial<SmoSystemGroupParamsSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoSystemGroup.defaults, SmoSystemGroup.attributes, this, params);
    params.ctor = 'SmoSystemGroup';
    if (!isSmoSystemGroupParamsSer(params)) {
      throw 'bad system group ' + JSON.stringify(params);
    }
    return params;
  }
}
