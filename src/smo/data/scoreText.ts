// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * A score modifier is anything that isn't mapped specifically to a musical object.
 * This includes score text, layout information
 * @module /smo/data/scoreModifier
 */
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoScoreModifierBase, ScaledPageLayout } from './scoreModifiers';
import { FontInfo, SmoModifierBase } from './common';
import { SmoSelector } from '../xform/selections';
import { VexRendererContainer } from '../../render/sui/svgPageMap';

const VF = eval('Vex.Flow');

/**
 * Parameters for a single text block, which makes up a text group.
 * @internal
 * @category SmoParams
 */
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
    return JSON.parse(JSON.stringify({
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
    }));
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
    const textFont = VF.TextFormatter.create({
      family: this.fontInfo.family,
      size: this.fontInfo.size,
      weight: this.fontInfo.weight,
      style: this.fontInfo.style
    });
    textFont.setFontSize(this.fontInfo.size);
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
/**
 * Constructor parameters for a text group, a block of text in Smoosic
 * @param justification one of {@link SmoScoreText.justifications}
 * @param relativePosition relative position to other text groups
 * @param pagination indicates if this text is paginated (goes on each page)
 * @param spacing distance between blocks
 * @param attachToSelector acts like 'note text' if attached to a note, otherwise
 *   the position is based on score position, or page position if paginated
 * @param selector if attached, the selector in question
 * @param blocks the actual blocks of text
 * @category SmoParams
 */
export interface SmoTextGroupParams {
  justification: number,
  relativePosition: number,
  pagination: number,
  purpose: number,
  spacing: number,
  attachToSelector: boolean,
  selector: SmoSelector,
  blocks: SmoTextBlock[]
}

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
    return ['textBlocks', 'justification', 'relativePosition', 'spacing', 'pagination', 'attachToSelector', 'selector', 'musicXOffset', 'musicYOffset'];
  }
  static isTextGroup(modifier: SmoTextGroup | SmoModifierBase): modifier is SmoTextGroup {
    return modifier.ctor === 'SmoTextGroup';
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
      selector: SmoSelector.default
    });
    return tg;
  }

  static get defaults() {
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
  elements: Record<string, VexRendererContainer> = {};
  textBlocks: SmoTextBlock[] = [];
  edited: boolean = false;  // indicates not edited this session
  skipRender: boolean = false; // don't render if it is being edited
  static deserialize(jObj: any) {
    const blocks: any = [];
    const params: any = {};

    // Create new scoreText object for the text blocks
    jObj.textBlocks.forEach((st: any) => {
      if (typeof (st.text.fontInfo.size === 'string')) {
        st.text.fontInfo.size = SmoScoreText.fontPointSize(st.text.fontInfo.size);
      }
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
      if (tg.logicalBox) {
        ngroup.logicalBox = JSON.parse(JSON.stringify(tg.logicalBox));
        ngroup.logicalBox!.y += pageHeight * i;
      }
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
      this.musicYOffset += offset;
    }
    this.textBlocks.forEach((block) => {
      block.text.offsetY(offset);
    });
  }
}
