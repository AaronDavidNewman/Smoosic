// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoMeasureFormat } from './measureModifiers';
import { SmoAttrs, FontInfo } from './common';
import { SmoMeasure } from './measure';
import { SmoSelector } from '../xform/selections';

const VF = eval('Vex.Flow');

// ## SmoScoreModifierBase
// A score modifier is something that appears in the score, but not
// associated with a measure of music.
export abstract class SmoScoreModifierBase {
  ctor: string;
  attrs: SmoAttrs;
  constructor(ctor: string) {
    this.ctor = ctor;
    this.attrs = {
      id: VF.Element.newID(),
      type: ctor
    };
  }
  static deserialize(jsonObj: any) {
    const ctor = eval('globalThis.Smo.' + jsonObj.ctor);
    const rv = new ctor(jsonObj);
    return rv;
  }
}

export interface SmoFormattingManagerParams {
  measureFormats?: SmoMeasureFormat[],
  partIndex?: number
}
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
        this.measureFormats[format.measureIndex] = new SmoMeasureFormat(format);
      });
    }
  }
  updateMeasureFormat(format: SmoMeasureFormat) {
    this.measureFormats[format.measureIndex] = format;
  }
  updateFormat(measure: SmoMeasure) {
    if (this.measureFormats[measure.measureNumber.measureIndex]) {
      measure.format = this.measureFormats[measure.measureNumber.measureIndex];
    } else {
      measure.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
    }
  }
  serialize() {
    const rv: any = [];
    const keys = Object.keys(this.measureFormats);
    keys.forEach((key: any) => {
      if (!this.measureFormats[key].isDefault) {
        rv.push(this.measureFormats[key].serialize());
      }
    });
    return rv;
  }
}
export interface SmoPageLayoutParams {
  leftMargin: number,
  rightMargin: number,
  topMargin: number,
  bottomMargin: number,
  interGap: number,
  intraGap: number
}
export class SmoPageLayout extends SmoScoreModifierBase {
  static get defaults(): SmoPageLayoutParams {
    return {
      leftMargin: 30,
      rightMargin: 30,
      topMargin: 40,
      bottomMargin: 40,
      interGap: 30,
      intraGap: 10
    };
  }
  static get attributes(): string[] {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  leftMargin: number = 30;
  rightMargin: number = 30;
  topMargin: number = 40;
  bottomMargin: number = 40;
  interGap: number = 30;
  intraGap: number = 10;
  constructor(params?: SmoPageLayoutParams) {
    super('SmoPageLayout');
    smoSerialize.serializedMerge(SmoPageLayout.attributes, SmoPageLayout.defaults, this);
    if (typeof (params) !== 'undefined') {
      smoSerialize.serializedMerge(SmoPageLayout.attributes, params, this);
    }
  }
  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoPageLayout.defaults, SmoPageLayout.attributes, this, params);
    params.ctor = 'SmoPageLayout';
    return params;
  }
}
export class SmoGlobalLayout {
  svgScale: number = 1.0;
  zoomScale: number = 2.0;
  noteSpacing: number = 1.0;
  pageWidth: number = 8 * 96 + 48;
  pageHeight: number = 11 * 96;
  static get attributes(): string[] {
    return ['svgScale', 'zoomScale', 'noteSpacing', 'pageWidth', 'pageHeight'];
  }
  // Page width and page height are absolute, but must be scaled by svgScale
  // to be rendered
  static get scaledAttributes(): string[] {
    return ['pageHeight', 'pageWidth'];
  }
}
// A scaled page layout is a union of global layout settings and
// page layout settings, including number of pages and page number
export class ScaledPageLayout {
  svgScale: number = 1.0;
  zoomScale: number = 2.0;
  noteSpacing: number = 1.0;
  pageWidth: number = 8 * 96 + 48;
  pageHeight: number = 11 * 96;
  leftMargin: number = 30;
  rightMargin: number = 30;
  topMargin: number = 40;
  bottomMargin: number = 40;
  interGap: number = 30;
  intraGap: number = 10;
  pages: number = 1;
  // Update global layout parameters, and scale scalable page parameters
  updatePageLayout(globalLayout: SmoGlobalLayout, pageLayout: SmoPageLayout, pages: number): void {
    smoSerialize.serializedMerge(SmoGlobalLayout.attributes, globalLayout, this);
    SmoPageLayout.attributes.forEach((attr: string | number) => {
      (this as any)[attr] = (pageLayout as any)[attr] / this.svgScale;
    });
    SmoGlobalLayout.scaledAttributes.forEach((attr: string | number) => {
      (this as any)[attr] = (this as any)[attr] / this.svgScale;
    });
    this.pages = pages;
  }
}
export interface SmoLayoutManagerParams {
  globalLayout: SmoGlobalLayout,
  pageLayouts?: SmoPageLayout[]
}
// ## SmoLayoutManager
// Storage and utilities for layout information in the score.  Each
// manager has one set of page height/width, since svg element
// must have single length/width and viewbox.
// Each page can have different margins.
export class SmoLayoutManager extends SmoScoreModifierBase {
  static get defaultLayout(): SmoGlobalLayout {
    return {
      svgScale: 1.0,
      zoomScale: 2.0,
      noteSpacing: 1.0,
      pageWidth: 8 * 96 + 48,
      pageHeight: 11 * 96
    };
  }
  static get defaults(): SmoLayoutManagerParams {
    return {
      globalLayout: new SmoGlobalLayout(),
      pageLayouts: []
    };
  }
  static get attributes() {
    return SmoGlobalLayout.attributes;
  }
  // Attributes that are scaled by svgScale
  static get scalableAttributes() {
    return ['pageWidth', 'pageHeight'];
  }
  globalLayout: SmoGlobalLayout = new SmoGlobalLayout();
  pageLayouts: SmoPageLayout[] = [];

  constructor(params: SmoLayoutManagerParams) {
    super('SmoLayoutManager');
    if (typeof (params) === 'undefined') {
      params = SmoLayoutManager.defaults;
    }
    smoSerialize.serializedMerge(SmoLayoutManager.attributes, SmoLayoutManager.defaults, this.globalLayout);
    smoSerialize.serializedMerge(SmoLayoutManager.attributes, params, this.globalLayout);
    this.pageLayouts = [];
    if (params.pageLayouts && params.pageLayouts.length) {
      params.pageLayouts.forEach((page) => {
        this.pageLayouts.push(new SmoPageLayout(page));
      });
    } else {
      this.pageLayouts.push(new SmoPageLayout());
    }
  }
  getZoomScale() {
    return this.globalLayout.zoomScale;
  }
  serialize() {
    const rv: any = {};
    rv.pageLayouts = [];
    this.pageLayouts.forEach((pl) => {
      rv.pageLayouts.push(pl.serialize());
    });
    smoSerialize.serializedMerge(SmoLayoutManager.attributes, this.globalLayout, rv);
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
    const rv = {} as SmoGlobalLayout;
    smoSerialize.serializedMerge(SmoLayoutManager.attributes, this.globalLayout, rv);
    return rv;
  }
  // Return a deep copy of the page parameters, adjusted for the global scale.
  getScaledPageLayout(pageIndex: number) {
    const rv: ScaledPageLayout = new ScaledPageLayout();
    const pageCopy: SmoPageLayout = new SmoPageLayout(this.pageLayouts[pageIndex]);
    rv.updatePageLayout(this.globalLayout, pageCopy, this.pageLayouts.length);
    return rv;
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
export interface SmoSystemGroupParams {
  leftConnector: number,
  rightConnector: number,
  mapType: number,
  text: string,
  shortText: string,
  justify: boolean,
  startSelector: SmoSelector,
  endSelector: SmoSelector
}
// ## SmoSystemGroup
// System group is the grouping of staves into a system.
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
    return {
      leftConnector: SmoSystemGroup.connectorTypes.single,
      rightConnector: SmoSystemGroup.connectorTypes.single,
      mapType: SmoSystemGroup.mapTypes.allMeasures,
      text: '',
      shortText: '',
      justify: true,
      startSelector: SmoSelector.default,
      endSelector: SmoSelector.default
    };
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
      id: VF.Element.newID(),
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
  leftConnectorVx() {
    switch (this.leftConnector) {
      case SmoSystemGroup.connectorTypes.single:
        return VF.StaveConnector.type.SINGLE_LEFT;
      case SmoSystemGroup.connectorTypes.double:
        return VF.StaveConnector.type.DOUBLE_LEFT;
      case SmoSystemGroup.connectorTypes.brace:
        return VF.StaveConnector.type.BRACE;
      case SmoSystemGroup.connectorTypes.bracket:
      default:
        return VF.StaveConnector.type.BRACKET;
    }
  }
  rightConnectorVx() {
    switch (this.rightConnector) {
      case SmoSystemGroup.connectorTypes.single:
        return VF.StaveConnector.type.SINGLE_RIGHT;
      case SmoSystemGroup.connectorTypes.double:
      default:
        return VF.StaveConnector.type.DOUBLE_RIGHT;
    }
  }
  serialize() {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoSystemGroup.defaults, SmoSystemGroup.attributes, this, params);
    params.ctor = 'SmoSystemGroup';
    return params;
  }
}

export interface SmoScoreTextParams {
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  fontInfo: FontInfo,
  fill?: string,
  rotate?: number,
  justification?: string,
  classes?: string,
  boxModel?: string,
  scaleX?: number,
  scaleY?: number,
  translateX?: number,
  translateY?: number,
  pagination?: string,
  position?: string,
  autoLayout?: boolean // set to true if one of the pre-canned positions are used.
}
// ## SmoScoreText
// Identify some text in the score, not associated with any musical element, like page
// decorations, titles etc.
// Note: score text is always contained in a text group.  So this isn't directly accessed
// by score, but we keep the collection in score for backwards-compatibility
export class SmoScoreText extends SmoScoreModifierBase {
  // convert EM to a number, or leave as a number etc.
  static fontPointSize(size: string) {
    let rv = 12;
    if (typeof (size) === 'number') {
      return size;
    }
    const ptString = size.substring(0, size.length - 2);
    rv = parseFloat(ptString);
    if (size.indexOf('em') > 0) {
      rv *= 14;
    } else if (size.indexOf('px') > 0) {
      rv *= (96.0 / 72.0);
    }
    return rv;
  }

  // ### weightString
  // Convert a numeric or string weight into either 'bold' or 'normal'
  static weightString(fontWeight: string): string {
    let rv = 'normal';
    if (fontWeight) {
      const numForm = parseInt(fontWeight, 10);
      if (isNaN(numForm)) {
        rv = fontWeight;
      } else if (numForm > 500) {
        rv = 'bold';
      }
    }
    return rv;
  }

  static get paginations(): Record<string, string> {
    return { every: 'every', even: 'even', odd: 'odd', once: 'once', subsequent: 'subsequent' };
  }
  static get positions(): Record<string, string> {
    return { title: 'title', copyright: 'copyright', footer: 'footer', header: 'header', custom: 'custom' };
  }
  static get justifications(): Record<string, string> {
    return { left: 'left', right: 'right', center: 'center' };
  }
  static get fontFamilies(): Record<string, string> {
    return {
      serif: 'Merriweather', sansSerif: 'Roboto,sans-serif', monospace: 'monospace', cursive: 'cursive',
      times: 'Merriweather', arial: 'Arial'
    };
  }
  // If box model is 'none', the font and location determine the size.
  // spacing and spacingGlyph fit the box into a container based on the svg policy
  static get boxModels(): Record<string, string> {
    return { none: 'none', spacing: 'spacing', spacingAndGlyphs: 'spacingAndGlyphs', wrap: 'wrap' };
  }
  static get defaults(): SmoScoreTextParams {
    return {
      x: 15,
      y: 15,
      width: 0,
      height: 0,
      text: 'Smoosic',
      fontInfo: {
        size: 14,
        family: SmoScoreText.fontFamilies.serif,
        style: 'normal',
        weight: 'normal'
      },
      fill: 'black',
      rotate: 0,
      justification: SmoScoreText.justifications.left,
      classes: 'score-text',
      boxModel: 'none',
      scaleX: 1.0,
      scaleY: 1.0,
      translateX: 0,
      translateY: 0,
      pagination: 'once',
      position: 'custom',
      autoLayout: false // set to true if one of the pre-canned positions are used.
    };
  }
  x: number = 15;
  y: number = 15;
  width: number = 0;
  height: number = 0;
  text: string = 'Smoosic';
  fontInfo: FontInfo = {
    size: 14,
    family: SmoScoreText.fontFamilies.serif,
    style: 'normal',
    weight: 'normal'
  };
  fill: string = 'black';
  rotate: number = 0;
  justification: string = SmoScoreText.justifications.left;
  classes: string = 'score-text';
  boxModel: string = 'none';
  scaleX: number = 1.0;
  scaleY: number = 1.0;
  translateX: number = 0;
  translateY: number = 0;
  pagination: string = 'once';
  position: string = 'custom';
  autoLayout: boolean = false; // set to true if one of the pre-canned positions are used.

  getText() {
    return this.text;
  }
  estimateWidth() {
    let i = 0;
    let rv = 0;
    const textFont = VF.TextFont.getTextFontFromVexFontData({
      family: this.fontInfo.family,
      size: this.fontInfo.size,
      weight: this.fontInfo.weight,
      style: this.fontInfo.style
    });
    textFont.setFontSize(this.fontInfo.size);
    for (i = 0; i < this.text.length; ++i) {
      rv += textFont.getWidthForCharacter(this.text[i]);
    }
    return rv;
  }

  tryParseUnicode() {
    this.text = smoSerialize.tryParseUnicode(this.text);
  }

  offsetX(offset: number) {
    this.x += offset;
  }
  offsetY(offset: number) {
    this.y += offset;
  }

  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoScoreText.defaults, SmoScoreText.attributes, this, params);
    params.ctor = 'SmoScoreText';
    return params;
  }
  static get attributes(): string[] {
    return ['x', 'y', 'text', 'pagination', 'position', 'fontInfo', 'classes',
      'boxModel', 'justification', 'fill', 'width', 'height', 'scaleX', 'scaleY',
      'translateX', 'translateY', 'autoLayout'];
  }
  constructor(parameters: SmoScoreTextParams) {
    super('SmoScoreText');
    let rx = '';
    smoSerialize.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
    smoSerialize.serializedMerge(SmoScoreText.attributes, parameters, this);
    if (!this.classes) {
      this.classes = '';
    }
    if (this.classes.indexOf(this.attrs.id) < 0) {
      this.classes += ' ' + this.attrs.id;
    }
    if (this.boxModel === SmoScoreText.boxModels.wrap) {
      this.width = parameters.width ? this.width : 200;
      this.height = parameters.height ? this.height : 150;
    }
    const weight = parameters.fontInfo ? parameters.fontInfo.weight : 'normal';
    this.fontInfo.weight = SmoScoreText.weightString(weight);
    if (this.text) {
      rx = smoSerialize.tryParseUnicode(this.text);
      this.text = rx;
    }
  }
}

export interface SmoTextBlock {
  text: SmoScoreText,
  position: number,
  activeText: boolean
}
export interface SmoTextPlacement {
  fontFamily: string,
  fontSize: number,
  justification: number,
  xPlacement: number,
  yOffset: number,
}
export interface SmoTextGroupParams {
  justification: number,
  relativePosition: number,
  pagination: number,
  purpose: number,
  spacing: number,
  attachToSelector: boolean,
  selector: SmoSelector,
  musicXOffset: 0,
  musicYOffset: 0,
  blocks: SmoTextBlock[]
}

// ## SmoTextGroup
// A grouping of text that can be used as a block for
// justification, alignment etc.
export class SmoTextGroup extends SmoScoreModifierBase {
  static get justifications() {
    return {
      LEFT: 1,
      RIGHT: 2,
      CENTER: 3
    };
  }
  static get paginations() {
    return { EVERY: 1, EVENT: 2, ODD: 3, ONCE: 4, SUBSEQUENT: 5 };
  }

  // The position of block n relative to block n-1.  Each block
  // has it's own position.  Justification is inter-block.
  static get relativePositions() {
    return { ABOVE: 1, BELOW: 2, LEFT: 3, RIGHT: 4 };
  }

  static get purposes() {
    return {
      NONE: 1, TITLE: 2, SUBTITLE: 3, COMPOSER: 4, COPYRIGHT: 5
    };
  }
  static get attributes() {
    return ['textBlocks', 'justification', 'relativePosition', 'spacing', 'pagination', 'attachToSelector', 'selector', 'musicXOffset', 'musicYOffset'];
  }
  static get purposeToFont(): Record<number | string, SmoTextPlacement> {
    const rv: Record<number | string, SmoTextPlacement> = {};
    rv[SmoTextGroup.purposes.TITLE] = {
      fontFamily: 'Merriweather',
      fontSize: 18,
      justification: SmoTextGroup.justifications.CENTER,
      xPlacement: 0.5,
      yOffset: 4
    };
    rv[SmoTextGroup.purposes.SUBTITLE] = {
      fontFamily: 'Merriweather',
      fontSize: 16,
      justification: SmoTextGroup.justifications.CENTER,
      xPlacement: 0.5,
      yOffset: 20,
    };
    rv[SmoTextGroup.purposes.COMPOSER] = {
      fontFamily: 'Merriweather',
      fontSize: 12,
      justification: SmoTextGroup.justifications.RIGHT,
      xPlacement: 0.8,
      yOffset: 10
    };
    rv[SmoTextGroup.purposes.COPYRIGHT] = {
      fontFamily: 'Merriweather',
      fontSize: 12,
      xPlacement: 0.5,
      justification: SmoTextGroup.justifications.CENTER,
      yOffset: -12
    };
    return rv;
  }
  // ### createTextForLayout
  // Create a specific score text type (title etc.) based on the supplied
  // score layout
  static createTextForLayout(purpose: number, text: string, layout: ScaledPageLayout) {
    let x = 0;
    const textAttr = SmoTextGroup.purposeToFont[purpose];
    const pageWidth = layout.pageWidth;
    const pageHeight = layout.pageHeight;
    const bottomMargin = layout.bottomMargin;
    const topMargin = layout.topMargin;
    x = textAttr.xPlacement > 0 ? pageWidth * textAttr.xPlacement
      : pageWidth - (pageWidth * textAttr.xPlacement);
    const y = textAttr.yOffset > 0 ?
      topMargin + textAttr.yOffset :
      pageHeight + textAttr.yOffset - bottomMargin;
    const defaults: SmoScoreTextParams = SmoScoreText.defaults;
    const st = new SmoScoreText({
      text, x, y, width: defaults.width, height: defaults.height,
      fontInfo: { family: textAttr.fontFamily, size: textAttr.fontSize, weight: 'normal' }
    });
    const width = st.estimateWidth();
    x -= width / 2;
    const tg = new SmoTextGroup({
      blocks: [{ text: st, position: SmoTextGroup.relativePositions.RIGHT, activeText: false }],
      purpose, pagination: SmoTextGroup.paginations.EVERY,
      attachToSelector: false, justification: SmoTextGroup.justifications.CENTER, spacing: 0, relativePosition: SmoTextGroup.relativePositions.LEFT,
      selector: SmoSelector.default, musicXOffset: 0, musicYOffset: 0
    });
    return tg;
  }

  static get defaults() {
    return {
      textBlocks: [],
      justification: SmoTextGroup.justifications.LEFT,
      relativePosition: SmoTextGroup.relativePositions.RIGHT,
      pagination: SmoTextGroup.paginations.ONCE,
      purpose: SmoTextGroup.purposes.NONE,
      spacing: 0,
      attachToSelector: false,
      selector: null,
      musicXOffset: 0,
      musicYOffset: 0
    };
  }
  justification: number = SmoTextGroup.justifications.LEFT;
  relativePosition: number = SmoTextGroup.relativePositions.RIGHT;
  pagination: number = SmoTextGroup.paginations.ONCE;
  purpose: number = SmoTextGroup.purposes.NONE;
  spacing: number = 0;
  attachToSelector: boolean = false;
  selector?: SmoSelector;
  musicXOffset: number = 0;
  musicYOffset: number = 0;
  textBlocks: SmoTextBlock[] = [];
  static deserialize(jObj: any) {
    const blocks: any = [];
    const params: any = {};

    // Create new scoreText object for the text blocks
    jObj.textBlocks.forEach((st: any) => {
      const tx = new SmoScoreText(st.text);
      blocks.push({ text: tx, position: st.position });
    });
    // fill in the textBlock configuration
    SmoTextGroup.attributes.forEach((attr) => {
      if (attr !== 'textBlocks') {
        if (typeof (jObj[attr]) !== 'undefined') {
          params[attr] = jObj[attr];
        }
      }
    });
    params.blocks = blocks;
    return new SmoTextGroup(params);
  }
  // ### getPagedTextGroups
  // If this text is repeated on page, create duplicates for each page, and
  // resolve page numbers;
  static getPagedTextGroups(tg: SmoTextGroup, pages: number, pageHeight: number): SmoTextGroup[] {
    const rv: SmoTextGroup[] = [];
    let i: number = 0;
    if (tg.pagination === SmoTextGroup.paginations.ONCE) {
      rv.push(tg);
      return rv;
    }
    for (i = 0; i < pages; ++i) {
      const ix: number = i;
      const nblocks: any = [];
      // deep copy the blocks so the page offsets don't bleed into
      // original.
      tg.textBlocks.forEach((block) => {
        const nscoreText = new SmoScoreText(block.text);
        nblocks.push({
          text: nscoreText, position: block.position
        });
      });
      const params: SmoTextGroupParams = {} as SmoTextGroupParams;
      SmoTextGroup.attributes.forEach((attr) => {
        if (attr !== 'textBlocks') {
          (params as any)[attr] = (tg as any)[attr];
        }
      });
      params.blocks = nblocks;
      const ngroup: SmoTextGroup = new SmoTextGroup(params);
      ngroup.textBlocks.forEach((block) => {
        const xx = block.text;
        xx.classes = 'score-text ' + xx.attrs.id;
        xx.text = xx.text.replace('###', (ix + 1).toString()); /// page number
        xx.text = xx.text.replace('@@@', pages.toString()); /// page number
        xx.y += pageHeight * ix;
      });
      rv.push(ngroup);
    }
    return rv;
  }
  serialize(): any {
    const params: any = {};
    smoSerialize.serializedMergeNonDefault(SmoTextGroup.defaults, SmoTextGroup.attributes, this, params);
    params.ctor = 'SmoTextGroup';
    params.attrs = JSON.parse(JSON.stringify(this.attrs));
    return params;
  }
  /* _isScoreText(st: ) {
    return st.ctor && st.ctor === 'SmoScoreText';
  } */
  constructor(params: SmoTextGroupParams) {
    super('SmoTextGroup');
    if (typeof (params) === 'undefined') {
      params = {} as SmoTextGroupParams;
    }
    this.textBlocks = [];
    Vex.Merge(this, SmoTextGroup.defaults);
    Vex.Merge(this, params);
    if (params.blocks) {
      params.blocks.forEach((block: SmoTextBlock) => {
        this.textBlocks.push(block);
      });
    }
  }
  scaleText(scale: number) {
    this.musicXOffset *= scale;
    this.musicYOffset *= scale;
    this.textBlocks.forEach((block: SmoTextBlock) => {
      block.text.x *= scale;
      block.text.y *= scale;
    });
  }
  // ### tryParseUnicode
  // Try to parse unicode strings.
  tryParseUnicode() {
    this.textBlocks.forEach((tb) => {
      tb.text.tryParseUnicode();
    });
  }
  estimateWidth() {
    let rv = 0;
    this.textBlocks.forEach((tb) => {
      rv += tb.text.estimateWidth();
    });
    return rv;
  }
  // avoid saving text that can't be deleted
  isTextVisible() {
    let rv = true;
    if (this.attachToSelector) {
      return true;
    }
    this.textBlocks.forEach((block) => {
      if (block.text.x < 0 || block.text.y < 0) {
        rv = false;
      }
    });
    return rv;
  }
  // ### setActiveBlock
  // let the UI know which block is being edited.  Parameter null means reset all
  setActiveBlock(scoreText: SmoScoreText | null) {
    this.textBlocks.forEach((block) => {
      if (scoreText != null && block.text.attrs.id === scoreText.attrs.id) {
        block.activeText = true;
      } else {
        block.activeText = false;
      }
    });
  }
  // For editing, keep track of the active text block.
  getActiveBlock() {
    const rv = this.textBlocks.find((block) => block.activeText === true);
    if (typeof (rv) !== 'undefined') {
      return rv.text;
    }
    return this.textBlocks[0].text;
  }
  setRelativePosition(position: number) {
    this.textBlocks.forEach((block) => {
      block.position = position;
    });
    this.relativePosition = position;
  }
  firstBlock() {
    return this.textBlocks[0].text;
  }
  indexOf(scoreText: SmoScoreText) {
    return this.textBlocks.findIndex((block) => block.text.attrs.id === scoreText.attrs.id);
  }
  addScoreText(scoreText: SmoScoreText, position: number = SmoTextGroup.relativePositions.LEFT) {
    this.textBlocks.push({ text: scoreText, position, activeText: false });
  }
  ul() {
    const rv = { x: 0, y: 0 };
    this.textBlocks.forEach((block) => {
      rv.x = block.text.x > rv.x ? block.text.x : rv.x;
      rv.y = block.text.y > rv.y ? block.text.y : rv.y;
    });
    return rv;
  }
  removeBlock(scoreText: SmoScoreText) {
    const bbid = (typeof (scoreText) === 'string') ? scoreText : scoreText.attrs.id;
    const ix = this.textBlocks.findIndex((bb) => bb.text.attrs.id === bbid);
    this.textBlocks.splice(ix, 1);
  }
  offsetX(offset: number) {
    if (this.attachToSelector) {
      this.musicXOffset += offset;
    }
    this.textBlocks.forEach((block) => {
      block.text.offsetX(offset);
    });
  }
  offsetY(offset: number) {
    if (this.attachToSelector) {
      this.musicYOffset -= offset;
    }
    this.textBlocks.forEach((block) => {
      block.text.offsetY(offset);
    });
  }
}