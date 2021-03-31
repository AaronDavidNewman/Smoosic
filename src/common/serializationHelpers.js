// ## smoSerialize
// Helper functions that perform serialized merges, general JSON
// types of routines.
// ---
class smoSerialize {

  static tryParseUnicode(text) {
    let rv = text;
    try {
      eval('rv="' + text + '"');
    } catch (ex) {
      console.log('bad unicode');
    }
    return rv;
  }

  // ### filteredMerge
  // Like vexMerge, but only for specific attributes.
  static filteredMerge(attrs, src, dest) {
    attrs.forEach(function (attr) {
      if (typeof(src[attr]) != 'undefined') {
        dest[attr] = src[attr];
      }
    });
  }

    static get localScore() {
        return '_smoosicScore';
    }

  // This is the token map we use to reduce the size of
  // serialized data.
  static get tokenMap() {
   var _tm=`{
      "a": "score",
      "b": "layout",
      "c": "leftMargin",
      "d": "rightMargin",
      "e": "topMargin",
      "f": "bottomMargin",
      "g": "pageWidth",
      "h": "pageHeight",
      "i": "orientation",
      "j": "interGap",
      "k": "intraGap",
      "l": "svgScale",
      "m": "zoomScale",
      "n": "zoomMode",
      "o": "pages",
      "p": "pageSize",
      "q": "startIndex",
      "r": "renumberingMap",
      "s": "staves",
      "t": "staffId",
      "u": "staffX",
      "v": "staffY",
      "w": "adjY",
      "x": "staffWidth",
      "y": "staffHeight",
      "z": "keySignatureMap",
      "aa": "instrumentInfo",
      "ba": "instrumentName",
      "ca": "keyOffset",
      "da": "clef",
      "ea": "modifiers",
      "fa": "startSelector",
      "ga": "staff",
      "ha": "measure",
      "ia": "voice",
      "ja": "tick",
      "ka": "pitches",
      "la": "endSelector",
      "ma": "xOffset",
      "na": "cp1y",
      "oa": "cp2y",
      "pa": "attrs",
      "qa": "id",
      "ra": "type",
      "sa": "ctor",
      "ta": "yOffset",
      "ua": "position",
      "va": "measures",
      "wa": "timeSignature",
      "xa": "keySignature",
      "ya": "measureNumber",
      "za": "measureIndex",
      "ab": "systemIndex",
      "bb": "adjX",
      "cb": "tuplets",
      "db": "voices",
      "eb": "notes",
      "fb": "ticks",
      "gb": "numerator",
      "hb": "denominator",
      "ib": "remainder",
      "jb": "letter",
      "kb": "octave",
      "lb": "accidental",
      "mb": "symbol",
      "nb": "bpm",
      "ob": "display",
      "pb": "beatDuration",
      "qb": "beamBeats",
      "rb": "endBeam",
      "sb": "textModifiers",
      "tb": "text",
      "ub": "endChar",
      "vb": "fontInfo",
      "wb": "size",
      "xb": "family",
      "yb": "style",
      "zb": "weight",
      "ac": "classes",
      "bc": "verse",
      "cc": "fill",
      "dc": "scaleX",
      "ec": "scaleY",
      "fc": "translateX",
      "gc": "translateY",
      "hc": "selector",
      "ic": "renderedBox",
      "jc": "x",
      "kc": "y",
      "lc": "width",
      "mc": "height",
      "nc": "logicalBox",
      "oc": "noteType",
      "pc": "cautionary",
      "qc": "articulations",
      "rc": "articulation",
      "sc": "activeVoice",
      "tc": "flagState",
      "uc": "invert",
      "vc": "fontSize",
      "wc": "yOffsetLine",
      "xc": "yOffsetPixels",
      "yc": "scoreText",
      "zc": "backup",
      "ad": "edited",
      "bd": "pagination",
      "cd": "boxModel",
      "dd": "justification",
      "ed": "autoLayout",
      "fd": "ornaments",
      "gd": "offset",
      "hd": "ornament",
      "id": "tempoMode",
      "jd": "tempoText",
      "kd": "barline",
      "ld": "systemBreak",
      "md": "graceNotes",
      "nd": "tones",
      "od": "tuplet",
      "pd": "beam_group",
      "qd": "renderId",
      "rd": "numNotes",
      "sd": "totalTicks",
      "td": "stemTicks",
      "ud": "durationMap",
      "vd": "bracketed",
      "wd": "ratioed",
      "xd": "location",
      "yd": "systemGroups",
      "zd": "leftConnector",
      "ae": "padLeft",
      "be": "customStretch",
      "ce": "engravingFont",
      "de": "customProportion",
      "ee": "columnAttributeMap",
      "fe": "tempo",
      "ge": "textGroups",
      "he": "textBlocks",
      "ie": "backupBlocks",
      "je": "blocks",
      "ke": "_text",
      "le": "parser",
      "me": "fonts",
      "ne": "name",
      "oe": "purpose",
      "pe": "custom",
      "qe": "transposeIndex",
      "re": "noteHead",
      "se": "slash",
      "te": "pointSize",
      "ue": "spacing",
      "ve": "relativePosition",
      "we": "activeText",
      "xe": "attachToSelector",
      "ye": "musicXOffset",
      "ze": "musicYOffset",
      "af": "formattingIterations",
      "bf": "startBar",
      "cf": "endBar",
      "df": "endingId",
      "ef": "autoJustify",
      "ff": "thickness",
      "gf": "number",
      "hf": "preferences",
      "if": "autoPlay",
      "jf": "autoAdvance",
      "kf": "defaultDupleDuration",
      "lf": "defaultTripleDuration",
      "mf": "scoreInfo",
      "nf": "version",
      "of": "title",
      "pf": "subTitle",
      "qf": "composer",
      "rf": "copyright",
      "sf": "localIndex",
      "tf": "hairpinType",
      "uf": "customText",
      "vf": "noteSpacing",
      "wf": "lines",
      "xf": "from"
      }`;
     return JSON.parse(_tm);
    }

    static get valueTokens() {
      var vm = `{"@sn","SmoNote"}`;
      return JSON.parse(vm);
    }

    static reverseMap(map) {
      const rv = {};
      const keys = Object.keys(map);
      keys.forEach((key) => {
        rv[map[key]] = key;
      });
      return rv;
    }

  static get tokenValues() {
    return smoSerialize.reverseMap(smoSerialize.tokenMap);
  }

  // ## detokenize
  // If we are saving, replace token values with keys, since the keys are smaller.
  // if we are loading, replace the token keys with values so the score can
  // deserialize it
  static detokenize(json, dictionary) {
      const rv = {};
      const smoKey = (key) => {
        return typeof(dictionary[key]) !== 'undefined' ? dictionary[key] : key;
      }
      const _tokenRecurse = (input,output) =>  {
        const keys = Object.keys(input);
        keys.forEach((key) => {
          const val = input[key];
          const dkey = smoKey(key);
          if (typeof(val) == 'string' || typeof(val) == 'number' || typeof(val) == 'boolean') {
            output[dkey] = val;
            // console.log('240: output[' + dkey + '] = ' + val);
          }
          if (typeof(val) == 'object' && key != 'dictionary') {
            if (Array.isArray(val)) {
              output[dkey] = [];
              // console.log('245: processing array ' + dkey);
              val.forEach((arobj) => {
                if (typeof(arobj) === 'string' || typeof(arobj) === 'number' || typeof(arobj) === 'boolean') {
                  output[dkey].push(arobj);
                  // console.log('249: ar element ' + arobj);
                }
                else if (arobj && typeof(arobj) === 'object') {
                  const nobj = {};
                  _tokenRecurse(arobj,nobj);
                  output[dkey].push(nobj);
                }
              });
            } else {
              const nobj = {};
              // console.log('259: processing child object of ' + dkey);
              _tokenRecurse(val,nobj);
              output[dkey] = nobj;
            }
          }
        });
      }
      _tokenRecurse(json,rv);
      // console.log(JSON.stringify(rv,null,' '));
      return rv;
  }

  static incrementIdentifier(label) {
    const increcurse = (ar, ix) => {
      const n1 = (ar[ix].charCodeAt(0) - 97) + 1;
      if (n1 > 25) {
        ar[ix] = 'a';
        if (ar.length <= ix+1) {
          ar.push('a');
        } else {
          increcurse(ar,ix+1);
        }
      } else {
        ar[ix] = String.fromCharCode(97+n1);
      }
    }
    if (!label) {
      label = 'a';
    }
    const ar = label.split('');
    increcurse(ar,0);
    label = ar.join('');
    return label;
  }

  // used to generate a tokenization scheme that I will use to make
  // saved files smaller
  static jsonTokens(json) {
    const map = {};
    const valmap = {};
    const startKeys = Object.keys(smoSerialize.tokenMap);
    let keyLabel = startKeys[startKeys.length - 1];
    keyLabel = smoSerialize.incrementIdentifier(keyLabel);

    const exist = smoSerialize.tokenValues;
    const addMap = (key) => {
      if (!exist[key] && !map[key] && key.length > keyLabel.length) {
        map[key] = keyLabel;
        keyLabel = smoSerialize.incrementIdentifier(keyLabel);
      }
    };
    const _tokenRecurse = (obj) =>  {
      if (!obj) {
        console.warn('failure to parse');
        return;
      }
      const keys = Object.keys(obj);
      keys.forEach((key) => {
        const val = obj[key];
        if (typeof(val) === 'string' || typeof(val) === 'number'
         || typeof(val) === 'boolean') {
          addMap(key);
        }
        if (typeof(val) == 'object') {
          if (Array.isArray(val)) {
            addMap(key);
            val.forEach((arobj) => {
              if (arobj && typeof(arobj) === 'object') {
                _tokenRecurse(arobj);
              }
            });
          } else {
            addMap(key);
            _tokenRecurse(val);
          }
        }
      });
    }
    _tokenRecurse(json);
    const mkar = Object.keys(map);
    const m2 = {};
    mkar.forEach((mk) => {
      m2[map[mk]] = mk;
    })
    console.log(JSON.stringify(m2, null, ' '));
  }

  // ### serializedMerge
  // serialization-friendly, so merged, copied objects are deep-copied
  static serializedMerge(attrs, src, dest) {
    attrs.forEach(function (attr) {
      if (typeof(src[attr]) !== 'undefined') {
        // copy the number 0
        if (typeof(src[attr]) === 'number' ||
          typeof(src[attr]) === 'boolean' ||
          typeof(src[attr]) === 'string') {
          dest[attr] = src[attr];
          // copy the empty array
        } else if (Array.isArray(src[attr])) {
          dest[attr] = JSON.parse(JSON.stringify(src[attr]));
        } else {
          // but don't copy empty/null objects
          if (src[attr]) {
            if (typeof(src[attr]) == 'object') {
              dest[attr] = JSON.parse(JSON.stringify(src[attr]));
            } else {
              dest[attr] = src[attr];
            }
          }
        }
      }
    });
  }

  // ### serializedMergeNonDefault
  // Used to reduce size of serializations.  Create a serialzation of
  // the object, but don't serialize attributes that are already the default
  // since the default will be set when the object is deserialized
  // #### parameters:
  //     defaults - default Array
  //     attrs - array of attributes to save
  //     src - the object to serialize
  //     dest - the json object that is the target.
  static serializedMergeNonDefault(defaults,attrs,src,dest) {
    attrs.forEach(function (attr) {
      if (typeof(src[attr]) != 'undefined') {
        // copy the number 0
        if (typeof(src[attr]) === 'number' ||
          typeof(src[attr]) === 'boolean' ||
          typeof(src[attr]) === 'string' ) {
          if (src[attr] != defaults[attr]) {
            dest[attr] = src[attr];
          }
        // copy the empty array
        } else if (Array.isArray(src[attr])) {
          const defval = JSON.stringify(defaults[attr]);
          const srcval = JSON.stringify(src[attr]);
          if (defval != srcval) {
            dest[attr] = JSON.parse(srcval);
          }
        } else {
          // but don't copy empty/null objects
          if (src[attr]) {
            if (typeof(src[attr]) == 'object') {
              const defval = JSON.stringify(defaults[attr]);
              const srcval = JSON.stringify(src[attr]);
              if (defval != srcval) {
                dest[attr] = JSON.parse(srcval);
              }
            } else {
              if (src[attr] != defaults[attr]) {
                dest[attr] = src[attr];
              }
            }
          }
        }
      }
    });
  }

  static stringifyAttrs(attrs, obj) {
    let rv = '';
    attrs.forEach((attr) => {
      if (obj[attr]) {
        rv += attr + ':' + obj[attr] + ', ';
      } else {
        rv += attr + ': null,';
      }
    });
    return rv;
  }

  // ### printXlate
  // print json with string labels to use as a translation file seed.
  static printTranslate(_class) {
    const xxx = eval(_class + '.printTranslate');
    if (typeof(xxx) === 'function') {
      xxx();
    }
  }
}
