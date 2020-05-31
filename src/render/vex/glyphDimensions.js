

class vexGlyph {
	static accidental(a) {
       return vexGlyph.accidentals[a];
	}
	static barWidth(b) {
		var str = SmoBarline.barlineString(b);
		var cc = vexGlyph.dimensions[str];
		return cc.width+cc.spacingRight;
	}
	static get accidentals() {
		return {
		'b':vexGlyph.dimensions.flat,
		'#':vexGlyph.dimensions.sharp,
		'bb':vexGlyph.dimensions.doubleFlat,
		'##':vexGlyph.dimensions.doubleSharp,
		'n':vexGlyph.dimensions.natural
		};
	}

    static get tempo() {
        return vexGlyph.dimensions['tempo'];
    }
	static keySignatureLength(key) {
		return smoMusic.getSharpsInKeySignature(key)*vexGlyph.dimensions['sharp'].width +
		    smoMusic.getFlatsInKeySignature(key)*vexGlyph.dimensions['flat'].width +
			vexGlyph.dimensions['keySignature'].spacingRight;
	}
	static get timeSignature() {
		return vexGlyph.dimensions['timeSignature'];
	}
	static get dot() {
		return vexGlyph.dimensions['dot'];
	}

  static get tupletBeam() {
    return vexGlyph.dimensions['tupletBeam'];
  }

  static get stem() {
      return vexGlyph.dimensions['stem'];
  }
  static get flag() {
      return vexGlyph.dimensions['flag'];
  }

	static clef(c) {
		var key = c.toLowerCase()+'Clef';
		if (!vexGlyph.dimensions[key]) {
			return vexGlyph.dimensions['tenorClef'];
		}
		return vexGlyph.dimensions[key];
	}
	static get dimensions() {
		return {
      tupletBeam: {
        width:5,
  			height:6,
        yTop:0,
        yBottom:0,
  			spacingRight:5
      },
  		singleBar: {
  			width:1,
  			height:41,
        yTop:0,
        yBottom:0,
  			spacingRight:5
  		},
  		endBar: {
  			width:5.22,
  			height:40.99,
        yTop:0,
        yBottom:0,
  			spacingRight:10
  		},
  		doubleBar: {
  			width:3.22,
  			height:40.99,
        yTop:0,
        yBottom:0,
  			spacingRight:0
  		},
  		endRepeat: {
  			width:6,
  			height:40.99,
        yTop:0,
        yBottom:0,
  			spacingRight:0,
  		},
  		startRepeat: {
  			width:6,
  			height:40.99,
        yTop:0,
        yBottom:0,
  			spacingRight:5,
  		},
  		noteHead: {
  			width:12.02,
  			height:10.48,
        yTop:0,
        yBottom:0,
  			spacingRight:10,
  		},
  		dot: {
  			width:5,
  			height:5,
  			spacingRight:2
  		},
  		trebleClef: {
  			width: 25.5,
  			height: 68.32,
        yTop:14,
        yBottom:14,
  			spacingRight: 10,
  		},
  		bassClef: {
  			width: 25,
  			height: 31.88,
        yTop:0,
        yBottom:0,
  			spacingRight: 5,
  		},
  		altoClef: {
  			width: 31.5,
        yTop:0,
        yBottom:0,
  			height: 85.5,
  			spacingRight: 10
  		},
  		tenorClef: {
  			width: 31.5,
        yTop:10,
        yBottom:0,
  			height: 41,
  			spacingRight: 10
  		},
  		timeSignature: {
  			width: 13.48,
  			height: 85,
        yTop:0,
        yBottom:0,
  			spacingRight: 5
  		},
      tempo : {
        width:10,
        height:37,
        yTop:37,
        yBottom:0,
        spacingRight:0
      },
  		flat: {
  			width: 7.44,
  			height: 23.55,
        yTop:0,
        yBottom:0,
  			spacingRight: 2
  		},
  		keySignature: {
  			width: 0,
  			height: 85.5,
        yTop:0,
        yBottom:0,
  			spacingRight: 10
  		},
  		sharp: {
  			width: 8.84,
  			height: 62,
        yTop:0,
        yBottom:0,
  			spacingRight: 2
  		},
  		natural: {
  			width: 6.54,
  			height: 53.35,
        yTop:0,
        yBottom:0,
  			spacingRight: 2
  		},
  		doubleSharp: {
  			height: 10.04,
  			width: 21.63,
        yTop:0,
        yBottom:0,
  			spacingRight: 2
  		},
  		doubleFlat: {
  			width: 13.79,
  			height: 49.65,
        yTop:0,
        yBottom:0,
  			spacingRight:2
  		},stem: {
        width:1,
        height:35,
        yTop:0,
        yBottom:0,
  			spacingRight:0
      },flag: {
        width:10,
        height:35,
        yTop:0,
        yBottom:0,
  			spacingRight:0
      }
		};
	}
}
