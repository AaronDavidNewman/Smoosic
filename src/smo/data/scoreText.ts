// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Score Text is anything that isn't mapped specifically to a musical object.
 * This includes score text, headers, footers.  Score text is a single block of text.
 * TextGroup is 1 or more ScoreText blocks arranged in some way.
 * @module /smo/data/scoreModifier
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoScoreModifierBase, ScaledPageLayout } from './scoreModifiers';
import { SmoAttrs, SmoModifierBase } from './common';
import { SmoSelector } from '../xform/selections';
import { FontInfo } from '../../common/vex';
import { TextFormatter } from '../../common/textformatter';

/**
 * Parameters for a single text block.  Text blocks make up a text group.
 * @category SmoParams
 */
export interface SmoScoreTextParams {
  /**
   * x location of font
   */
  x: number,
  /**
   * location of font
   */
  y: number,
  /**
   * In currently supported text groups, width and height comes from the text bounding box
   * and so isn't required.
   */
  width: number,
  /**
   * In currently supported text groups, width and height comes from the text bounding box
   * and so isn't required.
   */
  height: number,
  /**
   * The text content
   */
  text: string,
  /**
   * Font of the text
   */
  fontInfo: FontInfo,
  /**
   * defaults to black
   */
  fill?: string,
  classes?: string,
}
/**
 * serialization
 */
export interface SmoScoreTextSer extends SmoScoreTextParams {
  /**
   * class name for deserialization
   */
  ctor: string;
}

function isSmoScoreTextSer(params: Partial<SmoScoreTextSer>): params is SmoScoreTextSer {
  if (!(params?.ctor === 'SmoScoreText')) {
    return false;
  }
  return true;
}
/**
 * Identify some text in the score, not associated with any musical element, like page
 * decorations, titles etc.
 * Note: score text is always contained in a text group.  So this isn't directly accessed
 * by score, but we keep the collection in score for backwards-compatibility
 * @category SmoModifier
 * @internal
 */
export class SmoScoreText extends SmoScoreModifierBase {
  // convert EM to a number, or leave as a number etc.
  static fontPointSize(size: string | number | undefined) {
    let rv: number = 12;
    if (typeof(size) !== 'number' && typeof(size) !== 'string') {
      return rv;
    }
    const szz: string | number = size ?? 14;
    if (typeof (szz) === 'number') {
      return szz;
    }
    const ptString = szz.substring(0, szz.length - 2);
    rv = parseFloat(ptString);
    if (szz.indexOf('em') > 0) {
      rv *= 14;
    } else if (szz.indexOf('px') > 0) {
      rv *= (96.0 / 72.0);
    }
    if (isNaN(rv)) {
      rv = 12;
    }
    return rv;
  }

  /**
   * Convert a numeric or string weight into either 'bold' or 'normal'
   * @param fontWeight 
   * @returns 
   */
  static weightString(fontWeight: string | number | undefined): string {    
    let rv: string = 'normal';
    if (fontWeight) {
      const numForm = parseInt(fontWeight.toString(), 10);
      if (isNaN(numForm)) {
        rv = fontWeight.toString();
      } else if (numForm > 500) {
        rv = 'bold';
      }
    }
    return rv;
  }
  static familyString(fam: string | undefined): string {
    if (!fam) {
      return SmoScoreText.fontFamilies.sansSerif;
    }
    return fam;
  }
  static get fontFamilies(): Record<string, string> {
    return {
      serif: 'Merriweather', sansSerif: 'Roboto,sans-serif', monospace: 'monospace', cursive: 'cursive',
      times: 'Merriweather', arial: 'Arial'
    };
  }
  static get parameters() {
    return ['x', 'y', 'width', 'height', 'text', 'fontInfo', 'fill', 'classes']
  }
  static get defaults(): SmoScoreTextParams {
    return JSON.parse(JSON.stringify({
      x: 15,
      y: 15,
      width: 0,
      height: 0,
      text: 'Text',
      fontInfo: {
        size: 14,
        family: SmoScoreText.fontFamilies.serif,
        style: 'normal',
        weight: 'normal'
      },
      fill: 'black',
      classes: 'score-text',
    }));
  }
  static deserialize(jsonObj: SmoScoreTextSer) {
    const params = SmoScoreText.defaults;
    smoSerialize.serializedMerge(SmoScoreText.parameters, jsonObj, params);
    if (typeof (params.fontInfo.size === 'string')) {
      params.fontInfo.size = SmoScoreText.fontPointSize(params.fontInfo.size);
    }
    return new SmoScoreText(params);
  }
  x: number = 15;
  y: number = 15;
  width: number = 0;
  height: number = 0;
  text: string = 'Text';
  fontInfo: FontInfo = {
    size: 14,
    family: SmoScoreText.fontFamilies.serif,
    style: 'normal',
    weight: 'normal'
  };
  fill: string = 'black';
  classes: string = 'score-text';
  scaleX: number = 1.0;
  scaleY: number = 1.0;

  getText() {
    return this.text;
  }
  estimateWidth(): number {
    let i = 0;
    let rv = 0;
    const textFont = TextFormatter.create({
      family: this.fontInfo.family,
      size: this.fontInfo.size,
      weight: this.fontInfo.weight,
      style: this.fontInfo.style
    });
    textFont.setFontSize(SmoScoreText.fontPointSize(this.fontInfo.size));
    for (i = 0; i < this.text.length; ++i) {
      rv += textFont.getWidthForTextInPx(this.text[i]);
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

  serialize(): SmoScoreTextSer {
    const params: Partial<SmoScoreTextSer> = {};
    smoSerialize.serializedMergeNonDefault(SmoScoreText.defaults, SmoScoreText.attributes, this, params);
    params.ctor = 'SmoScoreText';
    if (!isSmoScoreTextSer(params)) {
      throw ('bad score text ')
    }
    return params;
  }
  static get attributes(): string[] {
    return ['x', 'y', 'text', 'fontInfo', 'classes',
      'fill', 'width', 'height', 'scaleX', 'scaleY'];
  }
  static get simpleAttributes(): string[] {
    return ['x', 'y', 'text', 'classes',
      'fill', 'width', 'height', 'scaleX', 'scaleY'];
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
    const weight = parameters.fontInfo ? parameters.fontInfo.weight : 'normal';
    this.fontInfo.weight = SmoScoreText.weightString(weight ?? 'normal');
    if (this.text) {
      rx = smoSerialize.tryParseUnicode(this.text);
      this.text = rx;
    }
  }
}
/**
 * Each text block has the text data itself and some data about how it's placed
 */
export interface SmoTextBlock {
  /**
   * The score text
   */
  text: SmoScoreText,
  /**
   * position relative to other blocks
   */
  position: number,
  /**
   * run-time flag
   */
  activeText: boolean
}
export interface SmoTextBlockSer {
  /**
   * The score text
   */
  text: SmoScoreTextSer,
  /**
   * position relative to other blocks
   */
  position: number
}
/**
 * Used to place text imported from other formats, e.g. music xml
 */
export interface SmoTextPlacement {
  fontFamily: string,
  fontSize: number,
  xPlacement: number,
  yOffset: number,
}
/**
 * Constructor parameters for a text group, a block of text in Smoosic
 * @param justification one of {@link SmoTextGroup.justifications}
 * @param relativePosition relative position to other text groups
 * @param pagination indicates if this text is paginated (goes on each page)
 * @param spacing distance between blocks
 * @param attachToSelector acts like 'note text' if attached to a note, otherwise
 *   the position is based on score position, or page position if paginated
 * @param selector if attached, the selector in question
 * @param textBlocks the actual textBlocks of text - a score text along with a placement parameter
 * @category SmoParams
 */
export interface SmoTextGroupParams {
  justification: number,
  relativePosition: number,
  pagination: number,
  purpose: number,
  spacing: number,
  musicXOffset: number,
  musicYOffset: number,
  attachToSelector: boolean,
  selector: SmoSelector,
  textBlocks: SmoTextBlock[]
}

/**
 * The serializable parts of a text group.
 * @category serialization
 */
export interface SmoTextGroupParamsSer {
  /**
   * class name for deserialization
   */
  ctor: string;
  /**
   * ID so we can identify which text this is in dialogs, UI
   */
  attrs: SmoAttrs;
  /**
   * justification within the block
   */
  justification?: number,
  /**
   * position (above, left, right etc)
   */
  relativePosition?: number,
  /**
   * pagination for headers, footers
   */
  pagination?: number,
  /**
   * spacing between blocks, future
   */
  spacing?: number,
  /**
   * true if the text is attached to a note.
   */
  attachToSelector?: boolean,
  /**
   * defined if the selector is attached to a note
   */
  selector?: SmoSelector,
  /**
   * the individual text blocks
   */
  textBlocks: SmoTextBlockSer[];
}
function isSmoTextGroupParamsSer(params: Partial<SmoTextGroupParamsSer>): params is SmoTextGroupParamsSer {
  if (!(params?.ctor === 'SmoTextGroup')) {
    return false;
  }
  if (!(typeof(params.attrs?.id) === 'string')) {
    return false;
  }
  return true;
}
function isTextBlockSer(params: Partial<SmoTextBlockSer>): params is SmoTextBlockSer {
  if (!params.text) {
    return false;
  }
  if (!params.text) {
    return false;
  }
  if (!(typeof(params.position) === 'number')) {
    return false;
  }
  return true;
}

/**
 * Suggestion for text purpose, maybe used to find a match..maybe not used at all
 */
export type SmoTextGroupPurpose = 'NONE' |'TITLE' | 'SUBTITLE' | 'COMPOSER' | 'COPYRIGHT';

/**
 * A grouping of text that can be used as a block for
 * justification, alignment etc.
 * @category SmoModifier
 */
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

  static get purposes(): Record<SmoTextGroupPurpose, number> {
    return {
      NONE: 1, TITLE: 2, SUBTITLE: 3, COMPOSER: 4, COPYRIGHT: 5
    };
  }
  static get attributes() {
    return ['textBlocks', 'justification', 'relativePosition', 'spacing', 'pagination', 
    'attachToSelector', 'selector', 'musicXOffset', 'musicYOffset'];
  }
  static get nonTextAttributes() {
    return ['justification', 'relativePosition', 'spacing', 'pagination', 
    'attachToSelector', 'selector', 'musicXOffset', 'musicYOffset'];
  }
  static get simpleAttributes() {
    return ['justification', 'relativePosition', 'spacing', 'pagination', 
    'attachToSelector', 'musicXOffset', 'musicYOffset'];
  } 
  static isTextGroup(modifier: SmoTextGroup | SmoModifierBase): modifier is SmoTextGroup {
    return modifier.ctor === 'SmoTextGroup';
  }
  static get purposeToFont(): Record<number | string, SmoTextPlacement> {
    const rv: Record<number | string, SmoTextPlacement> = {};
    rv[SmoTextGroup.purposes.TITLE] = {
      fontFamily: 'Merriweather',
      fontSize: 18,
      xPlacement: 0.5,
      yOffset: 4
    };
    rv[SmoTextGroup.purposes.SUBTITLE] = {
      fontFamily: 'Merriweather',
      fontSize: 16,
      xPlacement: 0.5,
      yOffset: 20,
    };
    rv[SmoTextGroup.purposes.COMPOSER] = {
      fontFamily: 'Merriweather',
      fontSize: 12,
      xPlacement: 0.8,
      yOffset: 10
    };
    rv[SmoTextGroup.purposes.COPYRIGHT] = {
      fontFamily: 'Merriweather',
      fontSize: 12,
      xPlacement: 0.5,
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
    const params = SmoTextGroup.defaults;
    params.textBlocks = [{ text: st, position: SmoTextGroup.relativePositions.RIGHT, activeText: false }];
    params.purpose = purpose;
    const tg = new SmoTextGroup(params);
    return tg;
  }

  static get defaults(): SmoTextGroupParams {
    return JSON.parse(JSON.stringify({
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
    }));
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
  elements: SVGSVGElement[] = [];
  textBlocks: SmoTextBlock[] = [];
  edited: boolean = false;  // indicates not edited this session
  skipRender: boolean = false; // don't render if it is being edited  
  static deserialize(jObj: SmoTextGroupParamsSer) {
    const textBlocks: SmoTextBlock[] = [];
    const params: any = {};
    const jObjLegacy: any = jObj;
    // handle parameter name change
    if (jObjLegacy.blocks) {
      jObj.textBlocks = jObjLegacy.blocks;
    }

    // Create new scoreText object for the text blocks
    jObj.textBlocks.forEach((st: any) => {
      const tx = SmoScoreText.deserialize(st.text);
      textBlocks.push({ text: tx, position: st.position, activeText: false });
    });
    // fill in the textBlock configuration
    smoSerialize.serializedMerge(SmoTextGroup.nonTextAttributes, jObj, params);
    params.textBlocks = textBlocks;
    return new SmoTextGroup(params);
  }
  static deserializePreserveId(jObj: any) {
    const rv = SmoTextGroup.deserialize(jObj);
    if (jObj.attrs.id) {
      rv.attrs.id = jObj.attrs.id;
    }
    return rv;
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
      smoSerialize.serializedMerge(SmoTextGroup.nonTextAttributes, tg, params);
      params.textBlocks = nblocks;
      const ngroup: SmoTextGroup = new SmoTextGroup(params);
      ngroup.textBlocks.forEach((block) => {
        const xx = block.text;
        xx.classes = 'score-text ' + xx.attrs.id;
        xx.text = xx.text.replace('###', (ix + 1).toString()); /// page number
        xx.text = xx.text.replace('@@@', pages.toString()); /// page number
        xx.y += pageHeight * ix;
      });
      if (tg.logicalBox) {
        ngroup.logicalBox = JSON.parse(JSON.stringify(tg.logicalBox));
        ngroup.logicalBox!.y += pageHeight * i;
      }
      rv.push(ngroup);
    }
    return rv;
  }
  serialize(): SmoTextGroupParamsSer {
    const params: Partial<SmoTextGroupParamsSer> = {
      textBlocks: []
    };
    smoSerialize.serializedMergeNonDefault(SmoTextGroup.defaults, SmoTextGroup.nonTextAttributes, this, params);
    this.textBlocks.forEach((blk: SmoTextBlock) => {
      
      const blockSer: Partial<SmoTextBlockSer> = {
        position: blk.position
      }

      blockSer.text = blk.text.serialize();
      if (!isTextBlockSer(blockSer)) {
        throw ('bad text block ' + JSON.stringify(blockSer));
      }
      params.textBlocks!.push(blockSer);
    });
    params.ctor = 'SmoTextGroup';
    params.attrs = JSON.parse(JSON.stringify(this.attrs));
    if (!isSmoTextGroupParamsSer(params)) {
      throw('bad text group ' + JSON.stringify(params));
    }
    return params;
  }
  constructor(params: SmoTextGroupParams) {
    super('SmoTextGroup');
    if (typeof (params) === 'undefined') {
      params = {} as SmoTextGroupParams;
    }
    this.textBlocks = [];
    smoSerialize.serializedMerge(SmoTextGroup.nonTextAttributes, SmoTextGroup.defaults, this);
    smoSerialize.serializedMerge(SmoTextGroup.nonTextAttributes, params, this);
    if (params.textBlocks) {
      params.textBlocks.forEach((block: SmoTextBlock) => {
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
      this.musicYOffset += offset;
    }
    this.textBlocks.forEach((block) => {
      block.text.offsetY(offset);
    });
  }
}
