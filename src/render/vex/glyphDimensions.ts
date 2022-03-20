// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoBarline } from '../../smo/data/measureModifiers';
import { SmoMusic } from '../../smo/data/music';

const VF = eval('Vex.Flow');

export interface GlyphInfo {
  width: number,
  height: number,
  yTop: number,
  yBottom: number,
  spacingRight: number,
  vexGlyph: string | null
}

export class vexGlyph {
  // ### glyphPixels
  // Used to convert vex glyph sizes to pixels for computation.
  // Vex glyph font size (points) is 38, convert to pixels (96 / 72)
  // and divide by glyph resolution
  static get glyphPixels() {
    return 96 * (38 / (VF.Glyph.MUSIC_FONT_STACK[0].getResolution() * 72));
  }
  static width(smoGlyph: GlyphInfo) {
    if (smoGlyph.vexGlyph) {
      const vf: any = VF.Glyph.MUSIC_FONT_STACK[0].getGlyphs()[smoGlyph.vexGlyph];
      return (vf.x_max - vf.x_min) * vexGlyph.glyphPixels;
    }
    return smoGlyph.width;
  }
  static accidental(a: string): GlyphInfo {
    return vexGlyph.accidentals[a];
  }
  static barWidth(b: SmoBarline): number {
    const str = SmoBarline.barlineString(b);
    const cc = vexGlyph.dimensions[str];
    return cc.width + cc.spacingRight;
  }
  static accidentalWidth(accidental: string): number {
    return vexGlyph.width(vexGlyph.accidentals[accidental]);
  }
  static get accidentals(): Record<string, GlyphInfo> {
    return {
      'b': vexGlyph.dimensions.flat,
      '#': vexGlyph.dimensions.sharp,
      'bb': vexGlyph.dimensions.doubleFlat,
      '##': vexGlyph.dimensions.doubleSharp,
      'n': vexGlyph.dimensions.natural
    };
  }
  static get tempo(): GlyphInfo {
    return vexGlyph.dimensions.tempo;
  }
  static keySignatureLength(key: string) {
    return SmoMusic.getSharpsInKeySignature(key) * vexGlyph.width(vexGlyph.dimensions.sharp) +
      SmoMusic.getFlatsInKeySignature(key) * vexGlyph.width(vexGlyph.dimensions.flat) +
      vexGlyph.dimensions.keySignature.spacingRight;
  }
  static get timeSignature() {
    return vexGlyph.dimensions.timeSignature;
  }
  static get dot() {
    return vexGlyph.dimensions.dot;
  }

  static get tupletBeam() {
    return vexGlyph.dimensions.tupletBeam;
  }
  static get stem() {
    return vexGlyph.dimensions.stem;
  }
  static get flag() {
    return vexGlyph.dimensions.flag;
  }
  static clef(c: string): GlyphInfo {
    const key = c.toLowerCase() + 'Clef';
    if (!vexGlyph.dimensions[key]) {
      return vexGlyph.dimensions.tenorClef;
    }
    return vexGlyph.dimensions[key];
  }
  static get dimensions(): Record<string, GlyphInfo> {
    return {
      tupletBeam: {
        width: 5,
        height: 6,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: null
      },
      singleBar: {
        width: 1,
        height: 41,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: null
      },
      endBar: {
        width: 5.22,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10,
        vexGlyph: null
      },
      doubleBar: {
        width: 3.22,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: null
      },
      endRepeat: {
        width: 6,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: null
      },
      startRepeat: {
        width: 6,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: null
      },
      noteHead: {
        width: 15.3,
        height: 10.48,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10.71,
        vexGlyph: 'noteheadBlack'
      },
      dot: {
        width: 15,
        height: 5,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'augmentationDot'
      }, // This isn't accurate, but I don't
      // want to add extra space just for clef.
      trebleClef: {
        width: 35,
        height: 68.32,
        yTop: 3,
        yBottom: 3,
        spacingRight: 10,
        vexGlyph: 'gClef'
      },
      bassClef: {
        width: 36,
        height: 31.88,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: 'fClef'
      },
      altoClef: {
        width: 31.5,
        yTop: 0,
        yBottom: 0,
        height: 85.5,
        spacingRight: 10,
        vexGlyph: 'cClef'
      },
      tenorClef: {
        width: 31.5,
        yTop: 10,
        yBottom: 0,
        height: 41,
        spacingRight: 10,
        vexGlyph: 'cClef'
      },
      timeSignature: {
        width: 22.36,
        height: 85,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: 'timeSig4'
      },
      tempo: {
        width: 10,
        height: 37,
        yTop: 37,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: null
      },
      flat: {
        width: 15,
        height: 23.55,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'accidentalFlat'
      },
      keySignature: {
        width: 0,
        height: 85.5,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10,
        vexGlyph: null
      },
      sharp: {
        width: 17,
        height: 62,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'accidentalSharp',
      },
      natural: {
        width: 15,
        height: 53.35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'accidentalNatural',
      },
      doubleSharp: {
        height: 10.04,
        width: 21.63,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'accidentalDoubleSharp'
      },
      doubleFlat: {
        width: 13.79,
        height: 49.65,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2,
        vexGlyph: 'accidentalDoubleFlat'
      }, stem: {
        width: 1,
        height: 35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: null
      }, flag: {
        width: 10,
        height: 35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: 'flag8thUp' // use for width measurements all flags
      }
    };
  }
}
