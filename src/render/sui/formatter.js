// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScoreText } from '../../smo/data/scoreModifiers';
import { svgHelpers } from '../../common/svgHelpers';
import { smoMusic } from '../../common/musicHelpers';
import { vexGlyph } from '../vex/glyphDimensions';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoMeasureText } from '../../smo/data/measureModifiers';
import { SmoNote } from '../../smo/data/note';

const VF = Vex.Flow;

// ## suiFormatter (changed from suiAdjuster)
// Perform adjustments on the score based on the rendered components so we can re-render it more legibly.
export class suiLayoutFormatter {
  static estimateMusicWidth(smoMeasure, noteSpacing, accidentMap) {
    const widths = [];
    // The below line was commented out b/c voiceIX was defined but never used
    // let voiceIx = 0;
    // Accidental map:
    // If we accidentals on different notes in a justified column, need to increase width
    // for both.
    //     |          |
    //    #o  x   x   o
    //     |  x   x   |
    //     o  x   x  #o
    const tmObj = smoMeasure.createMeasureTickmaps();
    smoMeasure.voices.forEach((voice) => {
      let accidentJustify = 0;
      Object.keys(accidentMap).forEach((k) => {
        accidentJustify += accidentMap[k];
      });
      let width = 0;
      let duration = 0;
      voice.notes.forEach((note) => {
        let noteWidth = 0;
        const dots = (note.dots ? note.dots : 0);
        const headWidth = vexGlyph.width(vexGlyph.dimensions.noteHead);
        const dotWidth = vexGlyph.width(vexGlyph.dimensions.dot);
        noteWidth += headWidth +
          vexGlyph.dimensions.noteHead.spacingRight * noteSpacing;
        // TODO: Consider engraving font and adjust grace note size?
        noteWidth += (headWidth + vexGlyph.dimensions.noteHead.spacingRight) * note.graceNotes.length;
        noteWidth += dotWidth * dots + vexGlyph.dimensions.dot.spacingRight * dots;
        note.pitches.forEach((pitch) => {
          const keyAccidental = smoMusic.getAccidentalForKeySignature(pitch, smoMeasure.keySignature);
          const accidentals = tmObj.accidentalArray.filter((ar) =>
            ar.duration < duration && ar.pitches[pitch.letter]);
          const acLen = accidentals.length;
          const declared = acLen > 0 ?
            accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental : keyAccidental;
          if (declared !== pitch.accidental || pitch.cautionary) {
            noteWidth += vexGlyph.accidentalWidth(pitch.accidental);
            if (!accidentMap[duration]) {
              accidentMap[duration] = vexGlyph.accidentalWidth(pitch.accidental);
            } else {
              // if accidentals are aligned, don't count width twice
              accidentJustify -= vexGlyph.accidentalWidth(pitch.accidental);
            }
          }
        });

        let verse = 0;
        let lyric = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        while (lyric) {
          let lyricWidth = 0;
          let i = 0;
          // TODO: kerning and all that...
          if (!lyric.length) {
            break;
          }
          // why did I make this return an array?
          // oh...because of voices
          const textFont =
            VF.TextFont.getTextFontFromVexFontData({ family: lyric[0].fontInfo.family,
              size: lyric[0].fontInfo.size, weight: 'normal' });
          const lyricText = lyric[0].getText();
          for (i = 0; i < lyricText.length; ++i) {
            lyricWidth += textFont.getWidthForCharacter(lyricText[i]);
          }
          if (lyric[0].isHyphenated()) {
            lyricWidth += 2 * textFont.getWidthForCharacter('-');
          } else {
            lyricWidth += 2 * textFont.getWidthForCharacter('H');
          }
          noteWidth = Math.max(lyricWidth, noteWidth);
          verse += 1;
          lyric = note.getLyricForVerse(verse, SmoLyric.parsers.lyric);
        }
        duration += note.tickCount;
        width += noteWidth;
      });
      if (accidentJustify > 0) {
        width += accidentJustify;
      }
      widths.push(width);
    });
    widths.sort((a, b) => a > b ? -1 : 1);
    return widths[0];
  }

  static estimateStartSymbolWidth(smoMeasure) {
    let width = 0;
    // the variables starts and digits used to be in the if statements. I moved them here to fix the resulting error
    var starts = smoMeasure.getStartBarline();
    var digits = smoMeasure.timeSignature.split('/')[0].length;
    if (smoMeasure.forceKeySignature) {
      if (smoMeasure.canceledKeySignature) {
        width += vexGlyph.keySignatureLength(smoMeasure.canceledKeySignature);
      }
      width += vexGlyph.keySignatureLength(smoMeasure.keySignature);
    }
    if (smoMeasure.forceClef) {
      width += vexGlyph.width(vexGlyph.clef(smoMeasure.clef)) + vexGlyph.clef(smoMeasure.clef).spacingRight;
    }
    if (smoMeasure.forceTimeSignature) {
      width += vexGlyph.width(vexGlyph.dimensions.timeSignature) * digits + vexGlyph.dimensions.timeSignature.spacingRight;
    }
    if (starts) {
      width += vexGlyph.barWidth(starts);
    }
    return width;
  }
  static estimateEndSymbolWidth(smoMeasure) {
    var width = 0;
    var ends  = smoMeasure.getEndBarline();
    if (ends) {
      width += vexGlyph.barWidth(ends);
    }
    return width;
  }

  static estimateTextOffset(renderer, smoMeasure) {
    var leftText = smoMeasure.modifiers.filter((mm) => mm.ctor === 'SmoMeasureText' && mm.position === SmoMeasureText.positions.left);
    var rightText = smoMeasure.modifiers.filter((mm) => mm.ctor === 'SmoMeasureText' && mm.position === SmoMeasureText.positions.right);
    var svg = renderer.getContext().svg;
    var xoff = 0;
    var width = 0;
    leftText.forEach((tt) => {
      const testText = new SmoScoreText({ text: tt.text });
      const box = svgHelpers.getTextBox(svg, testText.toSvgAttributes(), testText.classes, testText.text);
      xoff += box.width;
    });
    rightText.forEach((tt) => {
      const testText = new SmoScoreText({ text: tt.text });
      const box = svgHelpers.getTextBox(svg, testText.toSvgAttributes(), testText.classes, testText.text);
      width += box.width;
    });
    return svgHelpers.boxPoints(xoff, 0, width, 0);
  }

  static estimateMeasureWidth(measure, noteSpacing, accidentMap) {
    // Calculate the existing staff width, based on the notes and what we expect to be rendered.
    let measureWidth = suiLayoutFormatter.estimateMusicWidth(measure, noteSpacing, accidentMap);
    measure.svg.adjX = suiLayoutFormatter.estimateStartSymbolWidth(measure);
    measure.svg.adjRight = suiLayoutFormatter.estimateEndSymbolWidth(measure);
    measureWidth += measure.svg.adjX + measure.svg.adjRight + measure.format.customStretch;
    const y = measure.logicalBox ? measure.logicalBox.y : measure.staffY;
    measure.setWidth(measureWidth, 'estimateMeasureWidth adjX adjRight');
    // Calculate the space for left/right text which displaces the measure.
    // var textOffsetBox=suiLayoutFormatter.estimateTextOffset(renderer,measure);
    // measure.setX(measure.staffX  + textOffsetBox.x,'estimateMeasureWidth');
    measure.setBox(svgHelpers.boxPoints(measure.staffX, y, measure.staffWidth, measure.logicalBox.height),
      'estimate measure width');
  }
  static _beamGroupForNote(measure, note) {
    let rv = null;
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

  // ### _highestLowestHead
  // highest value is actually the one lowest on the page
  static _highestLowestHead(measure, note) {
    const hilo = { hi: 0, lo: 9999999 };
    note.pitches.forEach((pitch) => {
      // 10 pixels per line
      const ledger = smoMusic.pitchToLedgerLine(measure.clef, pitch);
      const noteHeight = ledger > 0 ? 10 : -10;
      const px = (10 * ledger) + noteHeight;
      hilo.lo = Math.min(hilo.lo, px);
      hilo.hi = Math.max(hilo.hi, px);
    });
    return hilo;
  }
  static textFont(lyric) {
    const fonts = VF.TextFont.fontRegistry;
    const rv = fonts.find((font) => font.family === lyric.fontInfo.family);
    if (!rv) {
      return new VF.TextFont(fonts[0]);
    }
    return new VF.TextFont(rv);
  }

  // ### estimateMeasureHeight
  // The baseline is the top line of the staff.  aboveBaseline is a negative number
  // that indicates how high above the baseline the measure goes.  belowBaseline
  // is a positive number that indicates how far below the baseline the measure goes.
  // the height of the measure is below-above.  Vex always renders a staff such that
  // the y coordinate passed in for the stave is on the baseline.
  // Note to past self: this was a really useful comment.  Thank you.
  static estimateMeasureHeight(measure) {
    let heightOffset = 50;  // assume 5 lines, todo is non-5-line staffs
    let yOffset = 0;
    let flag = '';
    let lyricOffset = 0;
    if (measure.forceClef) {
      heightOffset += vexGlyph.clef(measure.clef).yTop + vexGlyph.clef(measure.clef).yBottom;
      yOffset = yOffset - vexGlyph.clef(measure.clef).yTop;
    }

    if (measure.forceTempo) {
      yOffset = Math.min(-1 * vexGlyph.tempo.yTop, yOffset);
    }
    measure.voices.forEach((voice) => {
      voice.notes.forEach((note) => {
        const bg = suiLayoutFormatter._beamGroupForNote(measure, note);
        flag = SmoNote.flagStates.auto;
        if (bg && note.noteType === 'n') {
          flag = bg.notes[0].flagState;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = bg.notes[0].pitches[0];
            flag = smoMusic.pitchToLedgerLine(measure.clef, pitch)
               >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
          }
        }  else {
          flag = note.flagState;
          // an  auto-flag note is up if the 1st note is middle line
          if (flag === SmoNote.flagStates.auto) {
            const pitch = note.pitches[0];
            flag = smoMusic.pitchToLedgerLine(measure.clef, pitch)
              >= 2 ? SmoNote.flagStates.up : SmoNote.flagStates.down;
          }
        }
        const hiloHead = suiLayoutFormatter._highestLowestHead(measure, note);
        if (flag === SmoNote.flagStates.down) {
          yOffset = Math.min(hiloHead.lo, yOffset);
          heightOffset = Math.max(hiloHead.hi + vexGlyph.stem.height, heightOffset);
        } else {
          yOffset = Math.min(hiloHead.lo - vexGlyph.stem.height, yOffset);
          heightOffset = Math.max(hiloHead.hi, heightOffset);
        }
        // Lyrics will be rendered below the lowest thing on the staff, so add to
        // belowBaseline value based on the max number of verses and font size
        // it will extend
        const lyrics = note.getTrueLyrics();
        if (lyrics.length) {
          const maxLyric = lyrics.reduce((a, b) => a.verse > b.verse ? a : b);
          const fontInfo = suiLayoutFormatter.textFont(maxLyric);
          lyricOffset = Math.max((maxLyric.verse + 2) * fontInfo.maxHeight, lyricOffset);
        }
        const dynamics = note.getModifiers('SmoDynamicText');
        dynamics.forEach((dyn) => {
          heightOffset = Math.max((10 * dyn.yOffsetLine - 50) + 11, heightOffset);
          yOffset = Math.min(10 * dyn.yOffsetLine - 50, yOffset);
        });
      });
    });
    heightOffset += lyricOffset;
    return { belowBaseline: heightOffset, aboveBaseline: yOffset };
  }
}
