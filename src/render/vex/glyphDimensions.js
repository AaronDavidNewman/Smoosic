// eslint-disable-next-line no-unused-vars
class vexGlyph {
  static accidental(a) {
    return vexGlyph.accidentals[a];
  }
  static barWidth(b) {
    const str = SmoBarline.barlineString(b);
    const cc = vexGlyph.dimensions[str];
    return cc.width + cc.spacingRight;
  }
  static get accidentals() {
    return {
      'b': vexGlyph.dimensions.flat,
      '#': vexGlyph.dimensions.sharp,
      'bb': vexGlyph.dimensions.doubleFlat,
      '##': vexGlyph.dimensions.doubleSharp,
      'n': vexGlyph.dimensions.natural
    };
  }

  static get tempo() {
    return vexGlyph.dimensions.tempo;
  }
  static keySignatureLength(key) {
    return smoMusic.getSharpsInKeySignature(key) * vexGlyph.dimensions.sharp.width +
      smoMusic.getFlatsInKeySignature(key) * vexGlyph.dimensions.flat.width +
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

  static clef(c) {
    const key = c.toLowerCase() + 'Clef';
    if (!vexGlyph.dimensions[key]) {
      return vexGlyph.dimensions.tenorClef;
    }
    return vexGlyph.dimensions[key];
  }
  static get dimensions() {
    return {
      tupletBeam: {
        width: 5,
        height: 6,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5
      },
      singleBar: {
        width: 1,
        height: 41,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5
      },
      endBar: {
        width: 5.22,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10
      },
      doubleBar: {
        width: 3.22,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0
      },
      endRepeat: {
        width: 6,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0,
      },
      startRepeat: {
        width: 6,
        height: 40.99,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
      },
      noteHead: {
        width: 15.3,
        height: 10.48,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10.71,
      },
      dot: {
        width: 15,
        height: 5,
        spacingRight: 2
      }, // This isn't accurate, but I don't
      // want to add extra space just for clef.
      trebleClef: {
        width: 35,
        height: 68.32,
        yTop: 3,
        yBottom: 3,
        spacingRight: 10,
      },
      bassClef: {
        width: 36,
        height: 31.88,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5,
      },
      altoClef: {
        width: 31.5,
        yTop: 0,
        yBottom: 0,
        height: 85.5,
        spacingRight: 10
      },
      tenorClef: {
        width: 31.5,
        yTop: 10,
        yBottom: 0,
        height: 41,
        spacingRight: 10
      },
      timeSignature: {
        width: 22.36,
        height: 85,
        yTop: 0,
        yBottom: 0,
        spacingRight: 5
      },
      tempo: {
        width: 10,
        height: 37,
        yTop: 37,
        yBottom: 0,
        spacingRight: 0
      },
      flat: {
        width: 15,
        height: 23.55,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2
      },
      keySignature: {
        width: 0,
        height: 85.5,
        yTop: 0,
        yBottom: 0,
        spacingRight: 10
      },
      sharp: {
        width: 17,
        height: 62,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2
      },
      natural: {
        width: 15,
        height: 53.35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2
      },
      doubleSharp: {
        height: 10.04,
        width: 21.63,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2
      },
      doubleFlat: {
        width: 13.79,
        height: 49.65,
        yTop: 0,
        yBottom: 0,
        spacingRight: 2
      }, stem: {
        width: 1,
        height: 35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0
      }, flag: {
        width: 10,
        height: 35,
        yTop: 0,
        yBottom: 0,
        spacingRight: 0
      }
    };
  }
}
