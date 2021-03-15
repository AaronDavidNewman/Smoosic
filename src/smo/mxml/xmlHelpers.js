// ## mxmlHelpers
// Utilities for parsing and serialzing musicXML.
// eslint-disable-next-line no-unused-vars
class mxmlHelpers {
  // ### noteTypesToSmoMap
  // mxml note 'types', really s/b stem types.
  // For grace notes, we use the note type and not duration
  // to get the flag
  static get noteTypesToSmoMap() {
    return {
      'breve': 8192 * 4,
      'whole': 8192 * 2,
      'half': 8192,
      'quarter': 4096,
      'eighth': 2048,
      '16th': 1024,
      '32nd': 512,
      '64th': 256,
      '128th': 128
    };
  }
  static get ticksToNoteTypeMap() {
    if (mxmlHelpers._ticksToNoteTypeMap) {
      return mxmlHelpers._ticksToNoteTypeMap;
    }
    mxmlHelpers._ticksToNoteTypeMap = smoSerialize.reverseMap(mxmlHelpers.noteTypesToSmoMap);
    return mxmlHelpers._ticksToNoteTypeMap;
  }
  // ### closestStemType
  // smo infers the stem type from the duration, but other applications don't
  static closestStemType(ticks) {
    const nticks = VF.durationToTicks(smoMusic.vexStemType(ticks));
    return mxmlHelpers.ticksToNoteTypeMap[nticks];
  }
  static get beamStates() {
    return {
      BEGIN: 1,
      END: 2,
      AUTO: 3
    };
  }
  static get ornamentXmlToSmoMap() {
    return {
      staccato: { ctor: 'SmoArticulation', params: { articulation: SmoArticulation.articulations.staccato } },
      tenuto: { ctor: 'SmoArticulation', params: { articulation: SmoArticulation.articulations.tenuto } },
      marcato: { ctor: 'SmoArticulation', params: { articulation: SmoArticulation.articulations.marcato } },
      accent: { ctor: 'SmoArticulation', params: { articulation: SmoArticulation.articulations.accent } },
      doit: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.doitLong } },
      falloff: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.fall } },
      scoop: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.scoop } },
      'delayed-turn': { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.turn, offset: SmoOrnament.offsets.after } },
      turn: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.turn, offset: SmoOrnament.offsets.on } },
      'inverted-turn': { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.turnInverted } },
      mordent: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.mordent } },
      'inveterd-mordent': { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.mordentInverted } },
      shake: { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.mordentInverted } },
      'trill-mark': { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.trill } },
    };
  }
  // ### createRootElement
  // Create score-partwise document with prelude
  // https://bugzilla.mozilla.org/show_bug.cgi?id=318086
  static createRootElement() {
    const doc = document.implementation.createDocument('', '', null);
    const rootElem = doc.createElement('score-partwise');
    const piElement = doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF8"');
    rootElem.setAttribute('version', '2.0');
    doc.appendChild(rootElem);
    doc.insertBefore(piElement, rootElem);
    return doc;
  }
  // Parse an element whose child has a number in the textContent
  static getNumberFromElement(parent, path, defaults) {
    let rv = (typeof(defaults) === 'undefined' || defaults === null)
      ? 0 : defaults;
    const tval = mxmlHelpers.getTextFromElement(parent, path, defaults);
    if (!tval) {
      return rv;
    }
    if (typeof(tval) === 'number') {
      return tval;
    }
    if (tval.indexOf('.')) {
      const tf = parseFloat(tval);
      rv = isNaN(tf) ? rv : tf;
    } else {
      const ff = parseInt(tval, 10);
      rv = isNaN(ff) ? rv : ff;
    }
    return rv;
  }
  // Parse an element whose child has a textContent
  static getTextFromElement(parent, path, defaults) {
    const rv = (typeof(defaults) === 'undefined' || defaults === null)
      ? 0 : defaults;
    const el = [...parent.getElementsByTagName(path)];
    if (!el.length) {
      return rv;
    }
    return el[0].textContent;
  }
  // ### getChildrenFromPath
  // Like xpath, given ['foo', 'bar'] and parent element
  // 'moo' return any element /moo/foo/bar as an array of elements
  static getChildrenFromPath(parent, pathAr) {
    let i = 0;
    let node = parent;
    for (i = 0; i < pathAr.length; ++i) {
      const tag = pathAr[i];
      node = [...node.getElementsByTagName(tag)];
      if (node.length === 0) {
        return [];
      }
      if (i < pathAr.length - 1) {
        node = node[0];
      }
    }
    return node;
  }
  static getStemType(noteElement) {
    const tt = mxmlHelpers.getTextFromElement(noteElement, 'stem', '');
    if (tt === 'up') {
      return SmoNote.flagStates.up;
    } else if (tt === 'down') {
      return SmoNote.flagStates.down;
    }
    return SmoNote.flagStates.auto;
  }
  // ### assignDefaults
  // Map SMO layout data from xml layout data (default node)
  static assignDefaults(node, defObj, parameters) {
    parameters.forEach((param) => {
      if (!isNaN(parseInt(defObj[param.smo], 10))) {
        const smoParam = param.smo;
        const xmlParam = param.xml;
        defObj[smoParam] = mxmlHelpers.getNumberFromElement(node, xmlParam, defObj[smoParam]);
      }
    });
  }
  // ### nodeAttributes
  // turn the attributes of an element into a JS hash
  static nodeAttributes(node) {
    const rv = {};
    node.getAttributeNames().forEach((attr) => {
      rv[attr] = node.getAttribute(attr);
    });
    return rv;
  }
  // Some measures have staff ID, some don't.
  // convert xml 1 index to array 0 index
  static getStaffId(node) {
    const staff = [...node.getElementsByTagName('staff')];
    if (staff.length) {
      return parseInt(staff[0].textContent, 10) - 1;
    }
    return 0;
  }
  static noteBeamState(noteNode) {
    const beamNodes = [...noteNode.getElementsByTagName('beam')];
    if (!beamNodes.length) {
      return mxmlHelpers.beamStates.AUTO;
    }
    const beamText = beamNodes[0].textContent;
    if (beamText === 'begin') {
      return mxmlHelpers.beamStates.BEGIN;
    } else if (beamText === 'end') {
      return mxmlHelpers.beamStates.END;
    }
    return mxmlHelpers.beamStates.AUTO;
  }
  // same with notes and voices.  same convert
  static getVoiceId(node) {
    const voice = [...node.getElementsByTagName('voice')];
    if (voice.length) {
      return parseInt(voice[0].textContent, 10) - 1;
    }
    return 0;
  }
  static smoPitchFromNote(noteNode, defaultPitch) {
    const accidentals = ['bb', 'b', 'n', '#', '##'];
    const letter = mxmlHelpers.getTextFromElement(noteNode, 'step', defaultPitch.letter).toLowerCase();
    const octave = mxmlHelpers.getNumberFromElement(noteNode, 'octave', defaultPitch.octave);
    const xaccidental = mxmlHelpers.getNumberFromElement(noteNode, 'alter', 0);
    return { letter, accidental: accidentals[xaccidental + 2], octave };
  }
  static isGrace(noteNode) {
    const path = mxmlHelpers.getChildrenFromPath(noteNode, ['grace']);
    return path.length > 0;
  }
  static isSystemBreak(measureNode) {
    const printNodes = measureNode.getElementsByTagName('print');
    if (printNodes.length) {
      const attrs = mxmlHelpers.nodeAttributes(printNodes[0]);
      if (typeof(attrs['new-system']) !== 'undefined') {
        return attrs['new-system'] === 'yes';
      }
    }
    return false;
  }
  // ### durationFromType
  // Get the SMO tick duration of a note, based on the XML type element (quarter, etc)
  static durationFromType(noteNode, def) {
    const typeNodes = [...noteNode.getElementsByTagName('type')];
    if (typeNodes.length) {
      const txt = typeNodes[0].textContent;
      if (txt && mxmlHelpers.noteTypesToSmoMap[txt]) {
        return mxmlHelpers.noteTypesToSmoMap[txt];
      }
    }
    return def;
  }
  // ### durationFromNode
  // the true duration value, used to handle forward/backward
  static durationFromNode(noteNode, def) {
    const durationNodes = [...noteNode.getElementsByTagName('duration')];
    if (durationNodes.length) {
      const duration = parseInt(durationNodes[0].textContent, 10);
      return duration;
    }
    return def;
  }
  static ticksFromDuration(noteNode, divisions, def) {
    const rv = { tickCount: def };
    const durationNodes = [...noteNode.getElementsByTagName('duration')];
    const timeAlteration = mxmlHelpers.getTimeAlteration(noteNode);
    rv.alteration = { noteCount: 1, noteDuration: 1 };
    // different ways to declare note duration - from type is the graphical
    // type, SMO uses ticks for everything
    if (durationNodes.length) {
      rv.duration = parseInt(durationNodes[0].textContent, 10);
      rv.tickCount = 4096 * (rv.duration / divisions);
    } else {
      rv.tickCount = mxmlHelpers.durationFromType(noteNode, def);
      rv.duration = (divisions / 4096) * rv.tickCount;
    }
    // If this is a tuplet, we adjust the note duration back to the graphical type
    // and SMO will create the tuplet after.  We keep track of tuplet data though for beaming
    if (timeAlteration) {
      rv.tickCount = (rv.tickCount * timeAlteration.noteCount) / timeAlteration.noteDuration;
      rv.alteration = timeAlteration;
    }
    return rv;
  }
  // Get placement or orientation of a tie or slur.  Xml docs
  // a little unclear on what to expect and what each mean.
  static getCurveDirection(node) {
    const orientation = node.getAttribute('orientation');
    const placement = node.getAttribute('placement');
    if (orientation) {
      return orientation;
    }
    if (placement && placement === 'above') {
      return 'over';
    }
    if (placement && placement === 'below') {
      return 'under';
    }
    return 'auto';
  }
  static getTieData(noteNode, selector, pitchIndex) {
    const rv = [];
    let number = 0;
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('tied')];
      slurNodes.forEach((slurNode) => {
        const orientation = mxmlHelpers.getCurveDirection(slurNode);
        const type = slurNode.getAttribute('type');
        number = parseInt(slurNode.getAttribute('number'), 10);
        if (isNaN(number)) {
          number = 1;
        }
        rv.push({ number, type, orientation, selector, pitchIndex });
      });
    });
    return rv;
  }
  static getSlurData(noteNode, selector) {
    const rv = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('slur')];
      slurNodes.forEach((slurNode) => {
        const number = parseInt(slurNode.getAttribute('number'), 10);
        const type = slurNode.getAttribute('type');
        const orientation = mxmlHelpers.getCurveDirection(slurNode);
        const slurInfo = { number, type, orientation, selector };
        console.log('slur data: ', JSON.stringify(slurInfo, null, ' '));
        rv.push(slurInfo);
      });
    });
    return rv;
  }
  static getCrescendoData(directionElement) {
    let rv = {};
    const nNodes = mxmlHelpers.getChildrenFromPath(directionElement,
      ['direction-type', 'wedge']);
    nNodes.forEach((nNode) => {
      rv = { type: nNode.getAttribute('type') };
    });
    return rv;
  }
  static getTupletData(noteNode) {
    const rv = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('tuplet')];
      slurNodes.forEach((slurNode) => {
        const number = parseInt(slurNode.getAttribute('number'), 10);
        const type = slurNode.getAttribute('type');
        rv.push({ number, type });
      });
    });
    return rv;
  }
  static articulationsAndOrnaments(noteNode) {
    const rv = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      ['articulations', 'ornaments'].forEach((typ) => {
        const articulations = [...nNode.getElementsByTagName(typ)];
        articulations.forEach((articulation) => {
          Object.keys(mxmlHelpers.ornamentXmlToSmoMap).forEach((key) => {
            if ([...articulation.getElementsByTagName(key)].length) {
              const ctor = eval(mxmlHelpers.ornamentXmlToSmoMap[key].ctor);
              rv.push(new ctor(mxmlHelpers.ornamentXmlToSmoMap[key].params));
            }
          });
        });
      });
    });
    return rv;
  }
  static lyrics(noteNode) {
    const rv = [];
    const nNodes = [...noteNode.getElementsByTagName('lyric')];
    nNodes.forEach((nNode) => {
      const text = mxmlHelpers.getTextFromElement(nNode, 'text', '_');
      const verse = nNode.getAttribute('number');
      rv.push({ _text: text, verse });
    });
    return rv;
  }

  static getTimeAlteration(noteNode) {
    const timeNodes = mxmlHelpers.getChildrenFromPath(noteNode, ['time-modification']);
    if (timeNodes.length) {
      return { noteCount: mxmlHelpers.getNumberFromElement(timeNodes[0], 'actual-notes'),
        noteDuration: mxmlHelpers.getNumberFromElement(timeNodes[0], 'normal-notes') };
    }
    return null;
  }
  // ### createTextElementChild
  // In:  ../parent
  // Out: ../parent/elementName/obj[field]
  // returns elementName element.  If obj is null, just creates and returns child
  // if obj is a string, it uses it as the text value
  static createTextElementChild(parentElement, elementName, obj, field) {
    const el = parentElement.ownerDocument.createElement(elementName);
    if (obj) {
      if (typeof(obj) === 'string') {
        el.textContent = obj;
      } else {
        el.textContent = obj[field];
      }
    }
    parentElement.appendChild(el);
    return el;
  }
  static createAttributes(element, obj) {
    Object.keys(obj).forEach((key) => {
      const attr = element.ownerDocument.createAttribute(key);
      attr.value = obj[key];
      element.setAttributeNode(attr);
    });
  }
  static createAttribute(element, name, value) {
    const obj = {};
    obj[name] = value;
    mxmlHelpers.createAttributes(element, obj);
  }
}
