// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoBarline } from '../../smo/data/measureModifiers';
import { SmoMusic } from '../../smo/data/music';
import { VexFlow, GlyphInfo, getGlyphWidth } from '../../common/vex';

export class vexGlyph {
  static width(smoGlyph: GlyphInfo) {
   return getGlyphWidth(smoGlyph);
  }
  static accidental(a: string): GlyphInfo {
    return vexGlyph.accidentals[a];
  }
  static barWidth(b: SmoBarline): number {
    const str = SmoBarline.barlineString(b);
    const cc = vexGlyph.dimensions[str];
    if (typeof(cc) === 'undefined') {
      return 0;
    }
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

  static repeatSymbolWidth(): number {
    return vexGlyph.width(vexGlyph.dimensions['repeatSymbol']);
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
    if (vexGlyph.dimensions[key].vexGlyph) {
      const width = vexGlyph.width(vexGlyph.dimensions[key]);
      return  {
        width,
        height: 68.32,
        yTop: 3,
        yBottom: 3,
        spacingRight: 10,
        vexGlyph: 'gClef'
      };
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
      }, repeatSymbol: {
        width: 25,
        height: 6,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: 'repeat1Bar'
      },
      singleBar: {
        width: 1,
        height: 41,
        yTop: 0,
        yBottom: 0,
        spacingRight: 1,
        vexGlyph: null
      },
      endBar: {
        width: 5.22,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
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
        spacingRight: 5,
        vexGlyph: 'noteheadBlack'
      },
      dot: {
        width: 15,
        height: 5,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
        vexGlyph: 'augmentationDot'
      }, // This isn't accurate, but I don't
      // want to add extra space just for clef.
      trebleClef: {
        width: 35,
        height: 68.32,
        yTop: 3,
        yBottom: 3,
        spacingRight: 5,
        vexGlyph: 'gClef'
      }, // This isn't accurate, but I don't
      // want to add extra space just for clef.
      tab: {
        width: 27.3,
        height: 39,
        yTop: 3,
        yBottom: 3,
        spacingRight: 5,
        vexGlyph: 'tab'
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
        spacingRight: 5,
        vexGlyph: 'cClef'
      },
      tenorClef: {
        width: 31.5,
        yTop: 10,
        yBottom: 0,
        height: 41,
        spacingRight: 5,
        vexGlyph: 'cClef'
      },
      timeSignature: {
        width: 22.36,
        height: 85,
        yTop: 0,
        yBottom: 0,
        spacingRight: 11,
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
        spacingRight: 0,
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
        spacingRight: 0,
        vexGlyph: 'accidentalSharp',
      },
      natural: {
        width: 15,
        height: 53.35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: 'accidentalNatural',
      },
      doubleSharp: {
        height: 10.04,
        width: 21.63,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
        vexGlyph: 'accidentalDoubleSharp'
      },
      doubleFlat: {
        width: 13.79,
        height: 49.65,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
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
