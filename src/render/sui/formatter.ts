// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Utilities for formatting the music by estimating the geometry of the music.
 * @module /render/sui/formatter
 */
import { SvgHelpers } from './svgHelpers';
import { SmoMusic } from '../../smo/data/music';
import { vexGlyph } from '../vex/glyphDimensions';
import { SmoDynamicText, SmoLyric, SmoArticulation, SmoOrnament } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { SmoBeamer } from '../../smo/xform/beamers';
import { SmoScore } from '../../smo/data/score';
import { SmoStaffHairpin, SmoStaffTextBracket } from '../../smo/data/staffModifiers';
import { layoutDebug } from './layoutDebug';
import { ScaledPageLayout, SmoLayoutManager, SmoPageLayout } from '../../smo/data/scoreModifiers';
import { SmoMeasure, ISmoBeamGroup } from '../../smo/data/measure';
import { TimeSignature, SmoTempoText } from '../../smo/data//measureModifiers';
const VF = eval('Vex.Flow');

export interface SuiTickContext {
  widths: number[],
  tickCounts: number[]
}
export interface MeasureEstimate {
  measures: SmoMeasure[], x: number, y: number
}
export interface LineRender {
  systems: Record<number, SmoMeasure[]>
}

export interface RenderedPage {
  startMeasure: number,
  endMeasure: number
}
/**
 * Utilities for estimating measure/system/page width and height
 */
export class SuiLayoutFormatter {
  score: SmoScore;
  systems: Record<number, LineRender> = {};
  columnMeasureMap: Record<number, SmoMeasure[]>;
  currentPage: number = 0;
  svg: SVGSVGElement;
  renderedPages: Record<number,RenderedPage | null>;
  lines: number[] = [];
  constructor(score: SmoScore, svg: SVGSVGElement, renderedPages: Record<number, RenderedPage | null>) {
    this.score = score;
    this.svg = svg;
    this.columnMeasureMap = {};
    this.renderedPages = renderedPages;
    this.score.staves.forEach((staff) => {
      staff.measures.forEach((measure) => {
        if (!this.columnMeasureMap[measure.measureNumber.measureIndex]) {
          this.columnMeasureMap[measure.measureNumber.measureIndex] = [];
        }
        this.columnMeasureMap[measure.measureNumber.measureIndex].push(measure);
      });
    });
  }
   
  /**
   * Once we know which line a measure is going on, make a map for it for easy
   * looking during rendering
   * @param measures 
   * @param lineIndex 
   * @param systemIndex 
   */
  updateSystemMap(measures: SmoMeasure[], lineIndex: number, systemIndex: number) {
    if (!this.systems[lineIndex]) {
      const nextLr: LineRender = {
        systems: {}
      };
      this.systems[lineIndex] = nextLr;
    }
    const systemRender = this.systems[lineIndex];
    if (!systemRender.systems[systemIndex]) {
      systemRender.systems[systemIndex] = measures;
    }
  }
  trimPages(startPageCount: number): boolean {
    let pl: SmoPageLayout[] | undefined = this.score?.layoutManager?.pageLayouts;
    if (pl) {
      if (this.currentPage < pl.length - 1) {
        this.score!.layoutManager!.trimPages(this.currentPage);
        pl = this.score?.layoutManager?.pageLayouts;
      }
      if (pl && pl.length !== startPageCount) {
        return true;
      }
    }
    return false;
  }
  /**
   * see if page breaks this boundary.  If it does, bump the current page and move the system down
   * to the new page
   * @param scoreLayout 
   * @param currentLine 
   * @param bottomMeasure 
   * @returns 
   */
  checkPageBreak(scoreLayout: ScaledPageLayout, currentLine: SmoMeasure[], bottomMeasure: SmoMeasure): ScaledPageLayout {
    let pageAdj = 0;
    const lm: SmoLayoutManager = this.score!.layoutManager!;
    // See if this measure breaks a page.
    const maxY = bottomMeasure.svg.logicalBox.y +  bottomMeasure.svg.logicalBox.height;
    if (maxY > ((this.currentPage + 1) * scoreLayout.pageHeight) - scoreLayout.bottomMargin) {
      // Advance to next page settings
      if (this.renderedPages[this.currentPage]) {

      }
      this.currentPage += 1;
      // If this is a new page, make sure there is a layout for it.
      lm.addToPageLayouts(this.currentPage);
      scoreLayout = lm.getScaledPageLayout(this.currentPage);

      // When adjusting the page, make it so the top staff of the system
      // clears the bottom of the page.
      const topMeasure = currentLine.reduce((a, b) =>
        a.svg.logicalBox.y < b.svg.logicalBox.y ? a : b
      );
      const minMaxY = topMeasure.svg.logicalBox.y;
      pageAdj = (this.currentPage * scoreLayout.pageHeight) - minMaxY;
      pageAdj = pageAdj + scoreLayout.topMargin;

      // For each measure on the current line, move it down past the page break;
      currentLine.forEach((measure) => {
        measure.setBox(SvgHelpers.boxPoints(
          measure.svg.logicalBox.x, measure.svg.logicalBox.y + pageAdj, measure.svg.logicalBox.width, measure.svg.logicalBox.height), '_checkPageBreak');
        measure.setY(measure.staffY + pageAdj, '_checkPageBreak');
      });
    }
    return scoreLayout;
  }
  measureToLeft(measure: SmoMeasure) {
    const j = measure.measureNumber.staffId;
    const i = measure.measureNumber.measureIndex;
    return (i > 0 ? this.score!.staves[j].measures[i - 1] : null);
  }
   // {measures,y,x}  the x and y at the left/bottom of the render
  /**
   * Estimate the dimensions of a column when it's rendered.
   * @param scoreLayout 
   * @param measureIx 
   * @param systemIndex 
   * @param lineIndex 
   * @param x 
   * @param y 
   * @returns { MeasureEstimate } - the measures in the column and the x, y location
   */
   estimateColumn(scoreLayout: ScaledPageLayout, measureIx: number, systemIndex: number, lineIndex: number, x: number, y: number): MeasureEstimate {
    const s: any = {};
    const measures = this.columnMeasureMap[measureIx];
    let rowInSystem = 0;
    let voiceCount = 0;
    let unalignedCtxCount = 0;
    let wsum = 0;
    let dsum = 0;
    let maxCfgWidth = 0;
    let isPickup = false;
    // Keep running tab of accidental widths for justification
    const contextMap: Record<number, SuiTickContext> = {};
    measures.forEach((measure) => {
      SmoBeamer.applyBeams(measure);
      voiceCount += measure.voices.length;
      if (measure.isPickup()) {
        isPickup = true;
      }
      measure.measureNumber.systemIndex = systemIndex;
      measure.svg.rowInSystem = rowInSystem;
      measure.svg.lineIndex = lineIndex;
      measure.svg.pageIndex = this.currentPage;

      // use measure to left to figure out whether I need to render key signature, etc.
      // If I am the first measure, just use self and we always render them on the first measure.
      let measureToLeft = this.measureToLeft(measure);
      if (!measureToLeft) {
        measureToLeft = measure;
      }
      s.measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, 0);
      s.keySigLast = SmoMusic.vexKeySignatureTranspose(measureToLeft.keySignature, 0);
      s.tempoLast = measureToLeft.getTempo();
      s.timeSigLast = measureToLeft.timeSignature;
      s.clefLast = measureToLeft.clef;
      this.calculateBeginningSymbols(systemIndex, measure, s.clefLast, s.keySigLast, s.timeSigLast, s.tempoLast);

      // calculate vertical offsets from the baseline
      const offsets = this.estimateMeasureHeight(measure);
      measure.setYTop(offsets.aboveBaseline, 'render:estimateColumn');
      measure.setY(y - measure.yTop, 'estimateColumns height');
      measure.setX(x, 'render:estimateColumn');

      // Add custom width to measure:
      measure.setBox(SvgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, offsets.belowBaseline - offsets.aboveBaseline), 'render: estimateColumn');
      this.estimateMeasureWidth(measure, scoreLayout, contextMap);
      y = y + measure.svg.logicalBox.height + scoreLayout.intraGap;
      maxCfgWidth = Math.max(maxCfgWidth, measure.staffWidth);
      rowInSystem += 1;
    });

    // justify this column to the maximum width.
    const startX = measures[0].staffX;
    const adjX =  measures.reduce((a, b) => a.svg.adjX > b.svg.adjX ? a : b).svg.adjX;
    const contexts = Object.keys(contextMap);
    const widths: number[] = [];
    const durations: number[] = [];
    let minTotalWidth = 0;
    contexts.forEach((strIx) => {
      const ix = parseInt(strIx);
      let tickWidth = 0;
      const context = contextMap[ix];
      if (context.tickCounts.length < voiceCount) {
        unalignedCtxCount += 1;
      }
      context.widths.forEach((w, ix) => {
        wsum += w;
        dsum += context.tickCounts[ix];
        widths.push(w);
        durations.push(context.tickCounts[ix]);
        tickWidth = Math.max(tickWidth, w);
      });
      minTotalWidth += tickWidth;
    });
    // Vex formatter adjusts location of ticks based to keep the justified music aligned.  It does this
    // by moving notes to the right.  We try to add padding to each tick context based on the 'entropy' of the 
    // music.   4 quarter notes with no accidentals in all voices will have 0 entropy.  All the notes need the same
    // amount of space, so they don't need additional space to align.
    // wvar - the std deviation in the widths or 'width entropy'
    // dvar - the std deviation in the duration between voices or 'duration entropy'
    const sumArray = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
    const wavg = wsum > 0 ? wsum / widths.length : 1 / widths.length;
    const wvar = sumArray(widths.map((ll) => Math.pow(ll - wavg, 2)));
    const wpads = Math.pow(wvar / widths.length, 0.5) / wavg;

    const davg = dsum / durations.length;
    const dvar = sumArray(durations.map((ll) => Math.pow(ll - davg, 2)));
    const dpads = Math.pow(dvar / durations.length, 0.5) / davg;
    const unalignedPadding = 5;

    const padmax = Math.max(dpads, wpads) * contexts.length * unalignedPadding;
    const unalignedPad = unalignedPadding * unalignedCtxCount;
    let maxWidth = Math.max(adjX + minTotalWidth + Math.max(unalignedPad, padmax), maxCfgWidth);
    if (scoreLayout.maxMeasureSystem > 0 && !isPickup) {
      // Add 1 because there is some overhead in each measure, 
      // so there can never be (width/max) measures in the system
      const defaultWidth = (scoreLayout.pageWidth / (scoreLayout.maxMeasureSystem + 1));
      maxWidth = Math.max(maxWidth, defaultWidth);
    }
    const maxX = startX + maxWidth;
    measures.forEach((measure) => {
      measure.setWidth(maxWidth, 'render:estimateColumn');
      // measure.svg.adjX = adjX;
    });
    const rv = { measures, y, x: maxX };
    return rv;
  }
  /**
   * Calculate the geometry for the entire score, based on estimated measure width and height.
   * @returns 
   */
  layout() {
    let measureIx = 0;
    let systemIndex = 0;
    if (!this.score.layoutManager) {
      return;
    }
    let scoreLayout = this.score.layoutManager.getScaledPageLayout(0);
    let y = 0;
    let x = 0;
    let lineIndex = 0;
    this.lines = [];
    let pageCheck = 0;
    // let firstMeasureOnPage = 0;
    this.lines.push(lineIndex);
    let currentLine: SmoMeasure[] = []; // the system we are esimating
    let measureEstimate: MeasureEstimate | null = null;

    layoutDebug.clearDebugBoxes(layoutDebug.values.pre);
    layoutDebug.clearDebugBoxes(layoutDebug.values.post);
    layoutDebug.clearDebugBoxes(layoutDebug.values.adjust);
    layoutDebug.clearDebugBoxes(layoutDebug.values.system);
    const timestamp = new Date().valueOf();

    y = scoreLayout.topMargin;
    x = scoreLayout.leftMargin;

    while (measureIx < this.score.staves[0].measures.length) {
      if (this.score.isPartExposed()) {
        if (this.score.staves[0].measures[measureIx].svg.hideMultimeasure) {
          measureIx += 1;
          continue;
        }
      }
      measureEstimate = this.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
      x = measureEstimate.x;
      if (systemIndex > 0 &&
        (measureEstimate.measures[0].format.systemBreak || measureEstimate.x > (scoreLayout.pageWidth - scoreLayout.leftMargin))) {
        this.justifyY(scoreLayout, measureEstimate.measures.length, currentLine, false);
        // find the measure with the lowest y extend (greatest y value), not necessarily one with lowest
        // start of staff.
        const bottomMeasure: SmoMeasure = currentLine.reduce((a, b) =>
          a.svg.logicalBox.y + a.svg.logicalBox.height > b.svg.logicalBox.y + b.svg.logicalBox.height ? a : b
        );
        this.checkPageBreak(scoreLayout, currentLine, bottomMeasure);
        const renderedPage: RenderedPage | null = this.renderedPages[pageCheck];
        if (renderedPage) {
          if (pageCheck !== this.currentPage) {
            if (renderedPage.endMeasure !== measureIx - 1) {
              this.renderedPages[pageCheck] = null;
            }            
            const nextPage = this.renderedPages[this.currentPage];
            if (nextPage && nextPage.startMeasure !== measureIx) {
              this.renderedPages[this.currentPage] = null;
            }
          } else {
            if (renderedPage.startMeasure > measureIx || renderedPage.endMeasure < measureIx) {
              this.renderedPages[pageCheck] = null;
            }
          }
        }
        pageCheck = this.currentPage;

        const ld = layoutDebug;
        const sh = SvgHelpers;
        if (layoutDebug.mask & layoutDebug.values.system) {
          currentLine.forEach((measure) => {
            if (measure.svg.logicalBox) {
              ld.debugBox(this.svg, measure.svg.logicalBox, layoutDebug.values.system);
              ld.debugBox(this.svg, sh.boxPoints(measure.staffX, measure.svg.logicalBox.y, measure.svg.adjX, measure.svg.logicalBox.height), layoutDebug.values.post);
            }
          });
        }

        // Now start rendering on the next system.
        y = bottomMeasure.svg.logicalBox.height + bottomMeasure.svg.logicalBox.y + scoreLayout.interGap;
  
        currentLine = [];
        systemIndex = 0;
        x = scoreLayout.leftMargin;
        lineIndex += 1;
        this.lines.push(lineIndex);
        measureEstimate = this.estimateColumn(scoreLayout, measureIx, systemIndex, lineIndex, x, y);
        x = measureEstimate.x;
      }
      // ld declared for lint
      const ld = layoutDebug;
      measureEstimate?.measures.forEach((measure) => {
        ld.debugBox(this.svg, measure.svg.logicalBox, layoutDebug.values.pre);
      });
      this.updateSystemMap(measureEstimate.measures, lineIndex, systemIndex);
      currentLine = currentLine.concat(measureEstimate.measures);
      measureIx += 1;      
      systemIndex += 1;
      // If this is the last measure but we have not filled the x extent,
      // still justify the vertical staves and check for page break.
      if (measureIx >= this.score.staves[0].measures.length && measureEstimate !== null) {
        this.justifyY(scoreLayout, measureEstimate.measures.length, currentLine, true);
        const bottomMeasure = currentLine.reduce((a, b) =>
          a.svg.logicalBox.y + a.svg.logicalBox.height > b.svg.logicalBox.y + b.svg.logicalBox.height ? a : b
        );
        scoreLayout = this.checkPageBreak(scoreLayout, currentLine, bottomMeasure);
      }
    }
    // If a measure was added to the last page, make sure we re-render the page
    const renderedPage: RenderedPage | null = this.renderedPages[pageCheck];
    if (renderedPage) {
      if (renderedPage.endMeasure !== measureIx) {
        this.renderedPages[pageCheck] = null;
      }
    }
    layoutDebug.setTimestamp(layoutDebug.codeRegions.COMPUTE, new Date().valueOf() - timestamp);
  }
  
  static estimateMusicWidth(smoMeasure: SmoMeasure, noteSpacing: number, tickContexts: Record<number, SuiTickContext>): number {
    const widths: number[] = [];

    // Add up the widths of the music glyphs for each voice, including accidentals etc.  We save the widths in a hash by duration
    // and later consider overlapping/colliding ticks in each voice
    const tmObj = smoMeasure.createMeasureTickmaps();
    smoMeasure.voices.forEach((voice) => {
      let width = 0;
      let duration = 0;
      voice.notes.forEach((note) => {
        let noteWidth = 0;
        const dots: number = (note.dots ? note.dots : 0);
        let headWidth: number = vexGlyph.width(vexGlyph.dimensions.noteHead);
        // Maybe not the best place for this...ideally we'd get the note head glyph from
        // the ntoe.
        if (note.tickCount >= 4096 * 4 && note.noteType === 'n') {
          headWidth *= 2;
        }
        const dotWidth: number = vexGlyph.width(vexGlyph.dimensions.dot);
        noteWidth += headWidth +
          vexGlyph.dimensions.noteHead.spacingRight * noteSpacing;
        // TODO: Consider engraving font and adjust grace note size?
        noteWidth += (headWidth + vexGlyph.dimensions.noteHead.spacingRight) * note.graceNotes.length;
        noteWidth += dotWidth * dots + vexGlyph.dimensions.dot.spacingRight * dots;
        note.pitches.forEach((pitch) => {
          const keyAccidental = SmoMusic.getAccidentalForKeySignature(pitch, smoMeasure.keySignature);
          const accidentals = tmObj.accidentalArray.filter((ar) =>
            ar.duration < duration && ar.pitches[pitch.letter]);
          const acLen = accidentals.length;
          const declared = acLen > 0 ?
            accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental : keyAccidental;
          if (declared !== pitch.accidental || pitch.cautionary) {
            noteWidth += vexGlyph.accidentalWidth(pitch.accidental);
          }
        });

        let verse = 0;
        let lyricBase = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        while (lyricBase.length) {
          let lyric = lyricBase[0] as SmoLyric;
          let lyricWidth = 0;
          let i = 0;
          // TODO: kerning and all that...
          if (!lyric._text.length) {
            break;
          }
          // why did I make this return an array?
          // oh...because of voices
          const textFont =
            VF.TextFormatter.create({ family: lyric.fontInfo.family,
              size: lyric.fontInfo.size, weight: 'normal' });
          const lyricText = lyric.getText();
          for (i = 0; i < lyricText.length; ++i) {
            lyricWidth += textFont.getWidthForTextInPx(lyricText[i])
          }
          if (lyric.isHyphenated()) {
            lyricWidth += 2 * textFont.getWidthForTextInPx('-');
          } else {
            lyricWidth += 2 * textFont.getWidthForTextInPx('H');
          }
          noteWidth = Math.max(lyricWidth, noteWidth);
          verse += 1;
          lyricBase = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        }
        if (!tickContexts[duration]) {
          tickContexts[duration] = {
            widths: [],
            tickCounts: [] 
          }
        }
        tickContexts[duration].widths.push(noteWidth);
        tickContexts[duration].tickCounts.push(note.tickCount);
        duration += Math.round(note.tickCount);
        width += noteWidth;
      });
      widths.push(width);
    });
    widths.sort((a, b) => a > b ? -1 : 1);
    return widths[0];
  }

  static estimateStartSymbolWidth(smoMeasure: SmoMeasure): number {
    let width = 0;
    // the variables starts and digits used to be in the if statements. I moved them here to fix the resulting error
    var starts = smoMeasure.getStartBarline();
    var digits = smoMeasure.timeSignature.timeSignature.split('/')[0].length;
    if (smoMeasure.svg.forceKeySignature) {
      if (smoMeasure.canceledKeySignature) {
        width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
      }
      width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
    }
    if (smoMeasure.svg.forceClef) {
      width += vexGlyph.width(vexGlyph.clef(smoMeasure.clef)) + vexGlyph.clef(smoMeasure.clef).spacingRight;
    }
    if (smoMeasure.svg.forceTimeSignature) {
      width += vexGlyph.width(vexGlyph.dimensions.timeSignature) * digits + vexGlyph.dimensions.timeSignature.spacingRight;
    }
    if (starts) {
      width += vexGlyph.barWidth(starts);
    }
    return width;
  }
  static estimateEndSymbolWidth(smoMeasure: SmoMeasure) {
    var width = 0;
    var ends  = smoMeasure.getEndBarline();
    if (ends) {
      width += vexGlyph.barWidth(ends);
    }
    return width;
  }

  estimateMeasureWidth(measure: SmoMeasure, scoreLayout: ScaledPageLayout, tickContexts: Record<number, SuiTickContext>) {
    const noteSpacing = scoreLayout.noteSpacing;
    // Calculate the existing staff width, based on the notes and what we expect to be rendered.
    let measureWidth = SuiLayoutFormatter.estimateMusicWidth(measure, noteSpacing, tickContexts);
    measure.svg.adjX = SuiLayoutFormatter.estimateStartSymbolWidth(measure);
    measure.svg.adjRight = SuiLayoutFormatter.estimateEndSymbolWidth(measure);
    measureWidth += measure.svg.adjX + measure.svg.adjRight + measure.format.customStretch + measure.format.padLeft;
    const y = measure.svg.logicalBox.y;
    // For systems that start with padding, add width for the padding
    measure.setWidth(measureWidth, 'estimateMeasureWidth adjX adjRight');
    // Calculate the space for left/right text which displaces the measure.
    // measure.setX(measure.staffX  + textOffsetBox.x,'estimateMeasureWidth');
    measure.setBox(SvgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, measure.svg.logicalBox.height),
      'estimate measure width');
  }
  static _beamGroupForNote(measure: SmoMeasure, note: SmoNote): ISmoBeamGroup | null {
    let rv: ISmoBeamGroup | null = null;
    if (!note.beam_group) {
      return null;
    }
    measure.beamGroups.forEach((bg) => {
      if (!rv) {
        if (bg.notes.findIndex((note) => note.beam_group && note.beam_group.id === bg.attrs.id) >= 0) {
          rv = bg;
        }
      }
    });
    return rv;
  }

  /**
   * A system has gone beyond the page width.  Lop the last measure off the end and move it to the first measure of the
   * next system.  Then seal the last system by justifying the measures vertically and horinzontally
   * @param scoreLayout 
   * @param measureEstimate 
   * @param currentLine 
   * @param columnCount 
   * @param lastSystem 
   */
  justifyY(scoreLayout: ScaledPageLayout, rowCount: number, currentLine: SmoMeasure[], lastSystem: boolean) {
    let i = 0;
    const sh = SvgHelpers;
    // If there are fewer measures in the system than the max, don't justify.
    // We estimate the staves at the same absolute y value.
    // Now, move them down so the top of the staves align for all measures in a  row.
    for (i = 0; i < rowCount; ++i) {
      // lowest staff has greatest staffY value.
      const rowAdj = currentLine.filter((mm) => mm.svg.rowInSystem === i);
      const lowestStaff = rowAdj.reduce((a, b) =>
        a.staffY > b.staffY ? a : b
      );
      rowAdj.forEach((measure) => {
        const adj = lowestStaff.staffY - measure.staffY;
        measure.setY(measure.staffY + adj, 'justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x, measure.svg.logicalBox.y + adj, measure.svg.logicalBox.width, measure.svg.logicalBox.height), 'justifyY');
      });
      const rightStaff = rowAdj.reduce((a, b) =>
        a.staffX + a.staffWidth > b.staffX + b.staffWidth ?  a : b);

      const ld = layoutDebug;
      let justifyX = 0;
      let columnCount = rowAdj.length;
      // missing offset is for systems that have fewer measures than the default (due to section break or score ending)
      let missingOffset = 0;
      if (scoreLayout.maxMeasureSystem > 1 && 
        columnCount < scoreLayout.maxMeasureSystem
        && lastSystem) {
          missingOffset = (scoreLayout.pageWidth / (scoreLayout.maxMeasureSystem + 1)) * (scoreLayout.maxMeasureSystem - columnCount);
          columnCount = scoreLayout.maxMeasureSystem;
      }
      if (scoreLayout.maxMeasureSystem > 1 || !lastSystem) {
        justifyX = Math.round((scoreLayout.pageWidth - (scoreLayout.leftMargin + scoreLayout.rightMargin + rightStaff.staffX + rightStaff.staffWidth + missingOffset))
          / columnCount);
      }
      let justOffset = 0;
      rowAdj.forEach((measure) => {
        measure.setWidth(measure.staffWidth + justifyX, '_estimateMeasureDimensions justify');
        measure.setX(measure.staffX + justOffset, 'justifyY');
        measure.setBox(sh.boxPoints(measure.svg.logicalBox.x + justOffset, measure.svg.logicalBox.y, measure.staffWidth, measure.svg.logicalBox.height), 'justifyY');
        ld.debugBox(this.svg, measure.svg.logicalBox, layoutDebug.values.adjust);
        justOffset += justifyX;
      });
    }
  }
  // ### _highestLowestHead
  // highest value is actually the one lowest on the page
  static _highestLowestHead(measure: SmoMeasure, note: SmoNote) {
    const hilo = { hi: 0, lo: 9999999 };
    note.pitches.forEach((pitch) => {
      // 10 pixels per line
      const ledger = SmoMusic.pitchToLedgerLine(measure.clef, pitch);
      const noteHeight = ledger > 0 ? 10 : -10;
      const px = (10 * ledger) + noteHeight;
      hilo.lo = Math.min(hilo.lo, px);
      hilo.hi = Math.max(hilo.hi, px);
    });
    return hilo;
  }
  static textFont(lyric: SmoLyric) {
    return VF.TextFormatter.create(lyric.fontInfo);
  }

  /**
   * Calculate the dimensions of symbols based on where in a system we are, like whether we need to show
   * the key signature, clef etc.
   * @param systemIndex 
   * @param measure 
   * @param clefLast 
   * @param keySigLast 
   * @param timeSigLast 
   * @param tempoLast 
   * @param score 
   */
  calculateBeginningSymbols(systemIndex: number, measure: SmoMeasure,
    clefLast: string, keySigLast: string, timeSigLast: TimeSignature, tempoLast: SmoTempoText) {
    // The key signature is set based on the transpose index already, i.e. an Eb part in concert C already has 3 sharps.
    const xposeScore = this.score?.preferences?.transposingScore && (this.score?.isPartExposed() === false);
    const xposeOffset = xposeScore ? measure.transposeIndex : 0;
    const measureKeySig = SmoMusic.vexKeySignatureTranspose(measure.keySignature, xposeOffset);
    measure.svg.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
    measure.svg.forceTimeSignature = (measure.measureNumber.measureIndex === 0 || 
      (!SmoMeasure.timeSigEqual(timeSigLast, measure.timeSignature)) || measure.timeSignatureString.length > 0);
    if (measure.timeSignature.display === false) {
      measure.svg.forceTimeSignature = false;
    }
    measure.svg.forceTempo = false;
    const tempo = measure.getTempo();
    if (tempo && measure.measureNumber.measureIndex === 0) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    } else if (tempo && tempoLast) {
      if (!SmoTempoText.eq(tempo, tempoLast) && measure.svg.rowInSystem === 0) {
        measure.svg.forceTempo = tempo.display;
      }
    } else if (tempo) {
      measure.svg.forceTempo = tempo.display && measure.svg.rowInSystem === 0;
    }
    if (measureKeySig !== keySigLast && measure.measureNumber.measureIndex > 0) {
      measure.canceledKeySignature = SmoMusic.vexKeySigWithOffset(keySigLast, xposeOffset);
      measure.svg.forceKeySignature = true;
    } else if (systemIndex === 0 && measureKeySig !== 'C') {
      measure.svg.forceKeySignature = true;
    } else {
      measure.svg.forceKeySignature = false;
    }
  }

  /**
   * The baseline is the top line of the staff.  aboveBaseline is a negative number
   * that indicates how high above the baseline the measure goes.  belowBaseline
   * is a positive number that indicates how far below the baseline the measure goes.
   * the height of the measure is below-above.  Vex always renders a staff such that
   * the y coordinate passed in for the stave is on the baseline.
   * 
   * Note to past self: this was a really useful comment.  Thank you.
   * **/
  estimateMeasureHeight(measure: SmoMeasure): { aboveBaseline: number, belowBaseline: number } {
    let yTop = 0; // highest point, smallest Y value
    let yBottom = measure.lines * 10;  // lowest point, largest Y value.
    let flag: number = -1;
    let lyricOffset = 0;
    const measureIndex = measure.measureNumber.measureIndex;
    const staffIndex = measure.measureNumber.staffId;
    const stave = this.score.staves[staffIndex];
    stave.renderableModifiers.forEach((mm) => {
      if (mm.startSelector.staff === staffIndex && (mm.startSelector.measure <= measureIndex &&  mm.endSelector.measure >= measureIndex) ||
          mm.endSelector.staff === staffIndex && 
            (mm.endSelector.measure <= measureIndex &&  mm.endSelector.measure >= measureIndex && mm.endSelector.measure !== mm.startSelector.measure)) {
        if (mm.ctor === 'SmoHairpin') {
          const hp = mm as SmoStaffHairpin;
          if (hp.position === SmoStaffHairpin.positions.ABOVE) {
            yTop = yTop - hp.height;
          } else {
            yBottom = yBottom + hp.height;
          }
        } else if (mm.ctor === 'SmoStaffTextBracket') {
          const tb = mm as SmoStaffTextBracket;
          const tbHeight = 14 + (10 * Math.abs(tb.line - 1)); // 14 default font size
          if (tb.position === SmoStaffTextBracket.positions.TOP) {
            yTop = yTop - tbHeight;
          } else {
            yBottom = yBottom + tbHeight;
          }  
        }
      }
    });
    if (measure.svg.forceClef) {
      yBottom += vexGlyph.clef(measure.clef).yTop + vexGlyph.clef(measure.clef).yBottom;
      yTop = yTop - vexGlyph.clef(measure.clef).yTop;
    }

    if (measure.svg.forceTempo) {
      yTop = Math.min(-1 * vexGlyph.tempo.yTop, yTop);
    }
    measure.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        const bg = SuiLayoutFormatter._beamGroupForNote(measure, note);
        flag = SmoNote.flagStates.auto;
        if (bg && note.noteType === 'n') {
          flag = bg.notes[0].flagState;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = bg.notes[0].pitches[0];
            flag = SmoMusic.pitchToLedgerLine(measure.clef, pitch)
               >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
          }
        }  else {
          flag = note.flagState;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = note.pitches[0];
            flag = SmoMusic.pitchToLedgerLine(measure.clef, pitch)
              >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
          }
        }
        const hiloHead = SuiLayoutFormatter._highestLowestHead(measure, note);
        if (flag === SmoNote.flagStates.down) {
          yTop = Math.min(hiloHead.lo, yTop);
          yBottom = Math.max(hiloHead.hi + vexGlyph.stem.height, yBottom);
        } else {
          yTop = Math.min(hiloHead.lo - vexGlyph.stem.height, yTop);
          yBottom = Math.max(hiloHead.hi, yBottom);
        }
        // Lyrics will be rendered below the lowest thing on the staff, so add to
        // belowBaseline value based on the max number of verses and font size
        // it will extend
        const lyrics = note.getTrueLyrics();
        if (lyrics.length) {
          const maxLyric = lyrics.reduce((a, b) => a.verse > b.verse ? a : b);
          const fontInfo = SuiLayoutFormatter.textFont(maxLyric);
          lyricOffset = Math.max((maxLyric.verse + 2) * fontInfo.maxHeight, lyricOffset);
        }
        const dynamics = note.getModifiers('SmoDynamicText') as SmoDynamicText[];
        dynamics.forEach((dyn) => {
          yBottom = Math.max((10 * dyn.yOffsetLine - 50) + 11, yBottom);
          yTop = Math.min(10 * dyn.yOffsetLine - 50, yTop);
        });
        note.articulations.forEach((articulation) => {
          if (articulation.position === SmoArticulation.positions.above) {
            yTop -= 10;
          } else {
            yBottom += 10;
          }
        });
        note.ornaments.forEach((ornament) => {
          if (ornament.position === SmoOrnament.positions.above) {
            yTop -= 10;
          } else {
            yBottom += 10;
          }
        })
      });
    });
    yBottom += lyricOffset;
    return { belowBaseline: yBottom, aboveBaseline: yTop };
  }
}
