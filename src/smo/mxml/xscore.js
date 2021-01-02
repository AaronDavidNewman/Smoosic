// eslint-disable-next-line no-unused-vars
class mxmlHelpers {
  static get noteTypesToSmoMap() {
    return {
      'quarter': 4096,
      'eigth': 2048,
      '16th': 1024,
      '32nd': 512,
      '64th': 256,
      '128th': 128
    };
  }
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
  static getTextFromElement(parent, path, defaults) {
    let rv = (typeof(defaults) === 'undefined' || defaults === null)
      ? 0 : defaults;
    const el = [...parent.getElementsByTagName(path)];
    if (!el.length) {
      return rv;
    }
    return el[0].textContent;
  }
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
  static assignDefaults(node, defObj, parameters) {
    parameters.forEach((param) => {
      if (!isNaN(parseInt(defObj[param], 10))) {
        const smoParam = param.smo;
        const xmlParam = param.xml;
        defObj[smoParam] = mxmlHelpers.getNumberFromElement(node, xmlParam, defObj[smoParam]);
      }
    });
  }
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
  // same with notes and voices.  same convert
  static getVoiceId(node) {
    const voice = [...node.getElementsByTagName('voice')];
    if (voice.length) {
      return parseInt(voice[0].textContent, 10) - 1;
    }
    return 0;
  }
  static smoPitchFromNote(noteNode) {
    const accidentals = ['bb', 'b', 'n', '#', '##'];
    const letter = mxmlHelpers.getTextFromElement(noteNode, 'step', 'c').toLowerCase();
    const octave = mxmlHelpers.getNumberFromElement(noteNode, 'octave', 4);
    const xaccidental = mxmlHelpers.getNumberFromElement(noteNode, 'alter', 0);
    return { letter, accidental: accidentals[xaccidental + 2], octave };
  }
  static isGrace(noteNode) {
    const path = mxmlHelpers.getChildrenFromPath(noteNode, ['grace']);
    return path.length > 0;
  }
  static noteTypeToSmoDuration(noteNode) {
    const textVal = mxmlHelpers.getTextFromElement(
      noteNode, 'type', 'quarter');
    const num = typeof(mxmlHelpers.noteTypesToSmoMap[type]) !== 'undefined' ?
      mxmlHelpers.noteTypesToSmoMap[type] : 4096;
    return { numerator: num, denominator: 1, remainder: 0 };
  }
}
// eslint-disable-next-line no-unused-vars
class mxmlScore {
  static get mmPerPixel() {
    return 0.264583;
  }
  static get pageLayoutMap() {
    return [
      { xml: 'page-height', smo: 'pageHeight' },
      { xml: 'page-width', smo: 'pageWidth' }
    ];
  }
  static get pageMarginMap() {
    return [
      { xml: 'left-margin',smo: 'leftMargin' },
      { xml: 'right-margin', smo: 'rightMargin' },
      { xml: 'top-margin', smo: 'topMargin' },
      { xml: 'bottom-margin', smo: 'bottomMargin' }
    ];
  }
  static get demoDoc() {
    const parser = new DOMParser();
    return parser.parseFromString(mozartXml, 'text/xml');
  }
  static smoScoreFromXml(xmlDoc) {
    try {
      // Default scale for mxml
      let scale = 1 / 7;
      const scoreeNode = [...xmlDoc.getElementsByTagName('score-partwise')];
      if (!scoreeNode.length) {
        return;
      }
      const scoreElement = scoreeNode[0];
      const parts = [...scoreeNode[0].getElementsByTagName('part')];
      const scoreDefaults = JSON.parse(JSON.stringify(SmoScore.defaults));
      const pageLayoutNode = mxmlHelpers.getChildrenFromPath(scoreElement,
        ['defaults', 'page-layout']);
      if (pageLayoutNode.length) {
        mxmlHelpers.assignDefaults(pageLayoutNode[0], scoreDefaults.layout, mxmlScore.pageLayoutMap);
      }
      const pageMarginNode = mxmlHelpers.getChildrenFromPath(scoreElement,
        ['defaults', 'page-layout', 'page-margins']);
      if (pageMarginNode.length) {
        mxmlHelpers.assignDefaults(pageMarginNode[0], scoreDefaults.layout, mxmlScore.pageMarginMap);
      }

      const scaleNode =  mxmlHelpers.getChildrenFromPath(scoreElement,
        ['defaults', 'scaling']);
      if (scaleNode.length) {
        const mm = mxmlHelpers.getNumberFromElement(scaleNode[0], 'millimeters', 1);
        const tn = mxmlHelpers.getNumberFromElement(scaleNode[0], 'tenths', 7);
        if (tn > 0 && mm > 0) {
          scale = mm / tn;
        }
      }
      // Convert from mm to pixels, this is our default svg scale
      // mm per tenth * pixels / mm gives us pixels per tenth
      scoreDefaults.layout.svgScale =  scale / mxmlScore.mmPerPixel;
      scoreDefaults.staves = mxmlScore.createStaves(parts);
      return new SmoScore(scoreDefaults);
    } catch (exc) {
      console.warn(exc);
      return SmoScore.deserialize(emptyScoreJson);
    }
  }
  static createStaves(partElements) {
    let smoStaves = [];
    partElements.forEach((partElement) => {
      let stavesForPart = [];
      const xmlState = { divisions: 1 , tempo: new SmoTempoText(), timeSignature: '4/4', keySignature: 'C',
        clefInfo: {} };
      const measureElements = [...partElement.getElementsByTagName('measure')];
      measureElements.forEach((measureElement) => {
        const newStaves = mxmlScore.parseMeasureElement(measureElement, xmlState);
        newStaves.forEach((staffMeasure) => {
          if (stavesForPart.length <= staffMeasure.clefInfo.staffId) {
            stavesForPart.push(new SmoSystemStaff({ staffId: staffMeasure.clefInfo.staffId }));

          }
          const smoStaff = stavesForPart[staffMeasure.clefInfo.staffId];
          smoStaff.measures.push(staffMeasure.measure);
        });
      });
      smoStaves = smoStaves.concat(stavesForPart);
    });
    return smoStaves;
  }
  /* static smoDynamics(measureElement) {
    const rv = [];
    const dynNode = mxmlHelpers.getChildrenFromPath(measureElement,
      ['direction', 'dynamics']);
    if (dynNode.length) {
      const text = [...dynNode[0].childNodes].find((dd) => dd.nodeType === 1).tagName;
      const smoD = new SmoDynamicText({ text });
      const direction = [...sound[0].parentElement.getElementsByTagName('direction')];
      const staffId = mxmlHelpers.getStaffId(direction);
      const dynamic = new SmoDynamicText({ text };
      return [{ staffId, dynamic }];
    }
    return rv;
  }   */
  static smoTempo(measureElement) {
    let tempoText = '';
    const rv = [];
    const soundNodes = mxmlHelpers.getChildrenFromPath(measureElement,
      ['direction', 'sound']);
    soundNodes.forEach((sound) => {
      let tempoMode = SmoTempoText.tempoModes.durationMode;
      tempoText = sound.getAttribute('tempo');
      if (tempoText) {
        const direction = sound.parentElement;
        const bpm = parseInt(tempoText, 10);
        const wordNode =
          [...direction.getElementsByTagName('words')];
        tempoText = wordNode.length ? wordNode[0].textContent :
          tempoText.toString;
        if (isNaN(tempoText)) {
          tempoMode = SmoTempoText.tempoModes.textMode;
        }
        const tempo = new SmoTempoText({
          tempoMode, bpm, tempoText, display: true
        });
        const staffId = mxmlHelpers.getStaffId(direction);
        rv.push({ staffId, tempo });
      }
    });
    return rv;
  }
  static attributesFromMeasure(measureElement, xmlState) {
    let smoKey = {};
    const attributesNodes = mxmlHelpers.getChildrenFromPath(measureElement, ['attributes']);
    if (!attributesNodes.length) {
      return;
    }
    const attributesNode = attributesNodes[0];
    xmlState.divisions = mxmlHelpers.getNumberFromElement(attributesNode, 'divisions', xmlState.divisions);

    const keyNode = mxmlHelpers.getChildrenFromPath(attributesNode, ['key']);
    // MusicXML expresses keys in 'fifths' from C.
    if (keyNode.length) {
      const fifths = mxmlHelpers.getNumberFromElement(keyNode[0], 'fifths', 0);
      if (fifths < 0) {
        smoKey = smoMusic.circleOfFifths[smoMusic.circleOfFifths.length + fifths];
      } else {
        smoKey = smoMusic.circleOfFifths[fifths];
      }
      xmlState.keySignature = smoKey.letter.toUpperCase();
      if (smoKey.accidental !== 'n') {
        xmlState.keySignature += smoKey.accidental;
      }
    }

    const currentTime = xmlState.timeSignature.split('/');
    const timeNodes = mxmlHelpers.getChildrenFromPath(attributesNode, ['time']);
    if (timeNodes.length) {
      const timeNode = timeNodes[0];
      const num = mxmlHelpers.getNumberFromElement(timeNode, 'beats', currentTime[0]);
      const den = mxmlHelpers.getNumberFromElement(timeNode, 'beat-type', currentTime[1]);
      xmlState.timeSignature = '' + num + '/' + den;
    }

    const clefNodes =  mxmlHelpers.getChildrenFromPath(attributesNode, ['clef']);
    if (clefNodes.length) {
      xmlState.clefInfo = [];
      // We expect the number of clefs to equal the number of staves in each measure
      clefNodes.forEach((clefNode) => {
        let clefNum = 0;
        let clef = 'treble';
        const clefAttrs = mxmlHelpers.nodeAttributes(clefNode);
        if (typeof(clefAttrs['number']) !== 'undefined') {
          // staff numbers index from 1 in mxml
          clefNum = parseInt(clefAttrs['number']) - 1;
        }
        const clefType = mxmlHelpers.getTextFromElement(clefNode, 'sign', 'G');
        const clefLine = mxmlHelpers.getNumberFromElement(clefNode, 'line', 2);
        // mxml supports a zillion clefs, just implement the basics.
        if (clefType === 'F') {
          clef = 'bass';
        } else if (clefType === 'C') {
          if (line === 4) {
            clef = 'alto';
          } else if (line === 3) {
            clef = 'tenor';
          } else if (line === 1) {
            clef = 'soprano';
          }
        } else if (clefType === 'percussion') {
          clef = 'percussion';
        }
        xmlState.clefInfo.push({ clef, staffId: clefNum });
      });
    }
  }
  // ### parseMeasureElement
  // A measure in music xml might represent several measures in SMO at the same
  // column in the score
  static parseMeasureElement(measureElement, xmlState) {
    let previousNote = {};
    let staffArray = [];
    let graceNotes = [];
    let noteData = {};
    let smoNote = {};
    let grIx = 0;
    const elements = [...measureElement.children];
    elements.forEach((element) => {
      if (element.tagName === 'attributes') {
        // update the running state of the XML with new information from this measure
        // if an XML attributes element is present
        mxmlScore.attributesFromMeasure(measureElement, xmlState);
      } else if (element.tagName === 'direction') {
        // TODO: other direction elements like dynamics
        const tempo = mxmlScore.smoTempo(measureElement);
        if (tempo.length) {
          xmlState.tempo = tempo[0];
        }
      } else if (element.tagName === 'note') {
        const noteNode = element;
        const staffIndex = mxmlHelpers.getStaffId(noteNode);
        // We assume the clef information from attributes comes before the nodes
        if (staffArray.length <= staffIndex) {
          // mxml has measures for all staves in a part interleaved.  In SMO they are
          // each in a separate stave object.  Base the staves we expect based on
          // the number of clefs in the xml state object
          xmlState.clefInfo.forEach((clefInfo) => {
            staffArray.push({ clefInfo, voices: { } });
          });
        }
        const divisions = xmlState.divisions;
        const isGrace = mxmlHelpers.isGrace(noteNode);
        const restNode = mxmlHelpers.getChildrenFromPath(noteNode, ['rest']);
        const noteType = restNode.length ? 'r' : 'n';
        const duration = mxmlHelpers.getNumberFromElement(noteNode, 'duration', 1);
        const tickCount = 4096 * (duration / divisions);
        const chordNode = mxmlHelpers.getChildrenFromPath(noteNode, ['chord']);
        const voiceIndex = mxmlHelpers.getVoiceId(noteNode);

        // voices are not sequential, seem to have artitrary numbers
        if (typeof(staffArray[staffIndex].voices[voiceIndex]) === 'undefined') {
          staffArray[staffIndex].voices[voiceIndex] = { notes: [] };
        };
        const voice = staffArray[staffIndex].voices[voiceIndex];
        const pitch = mxmlHelpers.smoPitchFromNote(noteNode);
        if (isGrace === false) {
          if (chordNode.length) {
            previousNote.pitches.push(pitch);
          } else {
            noteData = JSON.parse(JSON.stringify(SmoNote.defaults));
            noteData.noteType = noteType;
            noteData.pitches = [pitch];
            noteData.ticks = { numerator: tickCount, denominator: 1, remainder: 0 };
            previousNote = new SmoNote(noteData);
            for (grIx = 0; grIx < graceNotes.length; ++grIx) {
              previousNote.addGraceNote(graceNotes[grIx], grIx);
            }
            graceNotes = [];
            voice.notes.push(previousNote);
          }
        } else {
          if (chordNode.length) {
            graceNotes[graceNotes.length - 1].pitches.push(pitch);
          } else {
            // grace note durations don't seem to have explicit duration, so
            // get it from note type
            graceNotes.push(new SmoGraceNote({
              pitches: [pitch]
            }));
          }
        }
      }
    });

    staffArray.forEach((staffData) => {
      const smoMeasure = SmoMeasure.getDefaultMeasure({
        clef: staffData.clefInfo.clef
      });
      smoMeasure.tempo = xmlState.tempo;
      smoMeasure.keySignature = xmlState.keySignature;
      smoMeasure.timeSignature = xmlState.timeSignature;
      // voices not in array, put them in an array
      Object.keys(staffData.voices).forEach((voiceKey) => {
        const voice = staffData.voices[voiceKey];
        smoMeasure.voices.push(voice);
      });
      staffData.measure = smoMeasure;
    });
    return staffArray;
  }
}
