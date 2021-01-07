// eslint-disable-next-line no-unused-vars
class mxmlHelpers {
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
  static get beamStates() {
    return { BEGIN: 1,
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
    const rv = (typeof(defaults) === 'undefined' || defaults === null)
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
      if (!isNaN(parseInt(defObj[param.smo], 10))) {
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
    let tickCount = def;
    const durationNodes = [...noteNode.getElementsByTagName('duration')];
    const timeAlteration = mxmlHelpers.getTimeAlteration(noteNode);
    // different ways to declare note duration - from type is the graphical
    // type, SMO uses ticks for everything
    if (durationNodes.length) {
      const duration = parseInt(durationNodes[0].textContent, 10);
      tickCount = 4096 * (duration / divisions);
    } else {
      tickCount = mxmlHelpers.durationFromType(noteNode, def);
    }
    // If this is a tuplet, we adjust the note duration back to the graphical type
    // and SMO will create the tuplet after
    if (timeAlteration) {
      tickCount = (tickCount * timeAlteration.noteCount) / timeAlteration.noteDuration;
    }
    return tickCount;
  }
  static getSlurData(noteNode) {
    const rv = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('slur')];
      slurNodes.forEach((slurNode) => {
        const number = parseInt(slurNode.getAttribute('number'), 10);
        const type = slurNode.getAttribute('type');
        rv.push({ number, type });
      });
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
      const verse = parseInt(nNode.getAttribute('number'), 10) - 1;
      rv.push(new SmoLyric({ _text: text, verse }));
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
      { xml: 'left-margin', smo: 'leftMargin' },
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
      let comp = 'Imported Smoosic';
      const scoreeNode = [...xmlDoc.getElementsByTagName('score-partwise')];
      if (!scoreeNode.length) {
        return SmoScore.deserialize(emptyScoreJson);
      }

      const scoreElement = scoreeNode[0];
      const scoreNameNode = [...xmlDoc.getElementsByTagName('work-title')];
      if (scoreNameNode.length) {
        comp = scoreNameNode[0].textContent;
      }
      const parts = [...scoreeNode[0].getElementsByTagName('part')];
      const scoreDefaults = JSON.parse(JSON.stringify(SmoScore.defaults));
      scoreDefaults.scoreInfo.name = comp;
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
      const partData = mxmlScore.createStaves(parts);
      scoreDefaults.staves = partData.staves;
      const rv = new SmoScore(scoreDefaults);
      rv.systemGroups = partData.staffGroups;
      // Fix tempo to be column mapped
      rv.staves[0].measures.forEach((measure) => {
        const tempo = rv.staves.find((ss) => ss.measures[measure.measureNumber.measureIndex].tempo.display === true);
        if (tempo) {
          rv.staves.forEach((ss) => {
            ss.measures[measure.measureNumber.measureIndex].tempo.display = true;
          });
        }
      });

      return rv;
    } catch (exc) {
      console.warn(exc);
      return SmoScore.deserialize(emptyScoreJson);
    }
  }
  static createStaves(partElements) {
    let smoStaves = [];
    const xmlState = { divisions: 1, tempo: new SmoTempoText(), timeSignature: '4/4', keySignature: 'C',
      clefInfo: [], staffGroups: [] };
    partElements.forEach((partElement) => {
      let staffId = smoStaves.length;
      console.log('part ' + partElement.getAttribute('id'));
      xmlState.slurs = {};
      const stavesForPart = [];
      xmlState.staffVoiceHash = {};
      xmlState.measureIndex = 0;
      const measureElements = [...partElement.getElementsByTagName('measure')];
      measureElements.forEach((measureElement) => {
        xmlState.tuplets = {};
        const newStaves = mxmlScore.parseMeasureElement(measureElement, xmlState);
        if (newStaves.length > 1 && stavesForPart.length <= newStaves[0].clefInfo.staffId) {
          xmlState.staffGroups.push({ start: staffId, length: newStaves.length });
        }
        newStaves.forEach((staffMeasure) => {
          if (stavesForPart.length <= staffMeasure.clefInfo.staffId) {
            stavesForPart.push(new SmoSystemStaff({ staffId }));
            staffId += 1;
          }
          const smoStaff = stavesForPart[staffMeasure.clefInfo.staffId];
          smoStaff.measures.push(staffMeasure.measure);
        });
        const oldStaffId = staffId - stavesForPart.length;
        xmlState.completedSlurs.forEach((slur) => {
          const staffIx = slur.start.staff;
          slur.start.voice = xmlState.staffVoiceHash[slur.start.staff].indexOf(slur.start.voice);
          slur.end.voice = xmlState.staffVoiceHash[slur.end.staff].indexOf(slur.end.voice);
          slur.start.staff += oldStaffId;
          slur.end.staff += oldStaffId;
          const smoSlur = new SmoSlur({
            startSelector: JSON.parse(JSON.stringify(slur.start)),
            endSelector: JSON.parse(JSON.stringify(slur.end))
          });
          stavesForPart[staffIx].addStaffModifier(smoSlur);
        });
        xmlState.measureIndex += 1;
      });
      smoStaves = smoStaves.concat(stavesForPart);
      /* smoStaves.forEach((staff) => {
        staff.staffId = staffId;
        staffId += 1;
      });  */
    });
    const staffGroups = [];
    xmlState.staffGroups.forEach((staffGroup) => {
      const len = smoStaves[staffGroup.start].measures.length;
      const startSelector = { staff: staffGroup.start, measure: 0 };
      const endSelector = { staff: staffGroup.start + (staffGroup.length - 1),
        measure: len };
      staffGroups.push(new SmoSystemGroup({
        startSelector, endSelector, leftConnector: SmoSystemGroup.connectorTypes.brace
      }));
    });
    return { staves: smoStaves, staffGroups };
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
          tempoText.toString();
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
      // We expect the number of clefs to equal the number of staves in each measure
      clefNodes.forEach((clefNode) => {
        let clefNum = 0;
        let clef = 'treble';
        const clefAttrs = mxmlHelpers.nodeAttributes(clefNode);
        if (typeof(clefAttrs.number) !== 'undefined') {
          // staff numbers index from 1 in mxml
          clefNum = parseInt(clefAttrs.number, 10) - 1;
        }
        const clefType = mxmlHelpers.getTextFromElement(clefNode, 'sign', 'G');
        const clefLine = mxmlHelpers.getNumberFromElement(clefNode, 'line', 2);
        // mxml supports a zillion clefs, just implement the basics.
        if (clefType === 'F') {
          clef = 'bass';
        } else if (clefType === 'C') {
          if (clefLine === 4) {
            clef = 'alto';
          } else if (clefLine === 3) {
            clef = 'tenor';
          } else if (clefLine === 1) {
            clef = 'soprano';
          }
        } else if (clefType === 'percussion') {
          clef = 'percussion';
        }
        if (xmlState.clefInfo.length <= clefNum) {
          xmlState.clefInfo.push({ clef, staffId: clefNum });
        } else {
          xmlState.clefInfo[clefNum].clef = clef;
        }
      });
    }
  }
  static backtrackBeamGroup(voice, beamLength) {
    let i = 0;
    let beamBeats = 0;
    for (i = 0; i < beamLength; ++i) {
      const note = voice.notes[voice.notes.length - (i + 1)];
      if (!note) {
        console.warn('no note for beam group');
        return;
      }
      beamBeats += note.ticks.numerator;
    }
    for (i = 0; i < beamLength; ++i) {
      const note = voice.notes[voice.notes.length - (i + 1)];
      note.endBeam = i === 0;
      note.beamBeats = beamBeats;
    }
  }
  static updateSlurStates(xmlState, slurInfos,
    staffIndex, measureNumber, voiceIndex, tick) {
    slurInfos.forEach((slurInfo) =>  {
      if (slurInfo.type === 'start') {
        xmlState.slurs[slurInfo.number] = { start: {
          staff: staffIndex, voice: voiceIndex,
          measure: measureNumber, tick }
        };
      } else if (slurInfo.type === 'stop') {
        if (xmlState.slurs[slurInfo.number]) {
          xmlState.slurs[slurInfo.number].end = {
            staff: staffIndex, voice: voiceIndex,
            measure: measureNumber, tick
          };
          xmlState.completedSlurs.push(
            JSON.parse(JSON.stringify(xmlState.slurs[slurInfo.number])));
        }
      }
    });
  }
  static backtrackTuplets(xmlState, voice, tupletState) {
    let i = tupletState.start.tick;
    const notes = [];
    const durationMap = [];
    while (i < voice.notes.length) {
      const note = voice.notes[i];
      notes.push(note);
      if (i === tupletState.start.tick) {
        durationMap.push(1.0);
      } else {
        const prev = voice.notes[i - 1];
        durationMap.push(note.ticks.numerator / prev.ticks.numerator);
      }
      i += 1;
    }
    const tuplet = new SmoTuplet({
      notes,
      durationMap
    });
    return tuplet;
  }
  static updateTupletStates(xmlState, tupletInfos, voice,
    staffIndex, voiceIndex) {
    const tick = voice.notes.length - 1;
    tupletInfos.forEach((tupletInfo) =>  {
      if (tupletInfo.type === 'start') {
        xmlState.tuplets[tupletInfo.number] = {
          start: { staff: staffIndex, voice: voiceIndex, tick }
        };
      } else if (tupletInfo.type === 'stop') {
        xmlState.tuplets[tupletInfo.number].end = {
          staff: staffIndex, voice: voiceIndex, tick
        };
        xmlState.completedTuplets.push(
          mxmlScore.backtrackTuplets(
            xmlState, voice, xmlState.tuplets[tupletInfo.number]));
      }
    });
  }
  // ### parseMeasureElement
  // A measure in music xml might represent several measures in SMO at the same
  // column in the score
  static parseMeasureElement(measureElement, xmlState) {
    let previousNote = {};
    const staffArray = [];
    const measureNumber = parseInt(measureElement.getAttribute('number'), 10) - 1;
    let graceNotes = [];
    let noteData = {};
    let grIx = 0;
    let currentDuration = 0;
    xmlState.beamGroups = {};
    xmlState.completedSlurs = [];
    xmlState.completedTuplets = [];
    console.log('measure ' + xmlState.measureIndex);
    const elements = [...measureElement.children];
    elements.forEach((element) => {
      if (element.tagName === 'backup') {
        currentDuration -= mxmlHelpers.durationFromNode(element);
      }
      if (element.tagName === 'forward') {
        currentDuration += mxmlHelpers.durationFromNode(element);
      }
      if (element.tagName === 'attributes') {
        // update the running state of the XML with new information from this measure
        // if an XML attributes element is present
        mxmlScore.attributesFromMeasure(measureElement, xmlState);
      } else if (element.tagName === 'direction') {
        // TODO: other direction elements like dynamics
        const tempo = mxmlScore.smoTempo(measureElement);
        // Only display tempo if changes.
        if (tempo.length) {
          // TODO: staff ID is with tempo, but tempo is per column in SMO
          if (!SmoTempoText.eq(xmlState.tempo, tempo[0].tempo)) {
            xmlState.tempo = tempo[0].tempo;
            xmlState.tempo.display = true;
          }
        } else {
          xmlState.tempo = SmoMeasureModifierBase.deserialize(xmlState.tempo.serialize());
          xmlState.tempo.display = false;
        }
      } else if (element.tagName === 'note') {
        const noteNode = element;
        const staffIndex = mxmlHelpers.getStaffId(noteNode);
        // We assume the clef information from attributes comes before the notes
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
        const tickCount = mxmlHelpers.ticksFromDuration(noteNode, divisions, 4096);
        const chordNode = mxmlHelpers.getChildrenFromPath(noteNode, ['chord']);
        if (chordNode.length === 0) {
          currentDuration += mxmlHelpers.durationFromNode(noteNode, 0);
        }
        const tickCursor = (currentDuration / divisions) * 4096;
        const voiceIndex = mxmlHelpers.getVoiceId(noteNode);
        const beamState = mxmlHelpers.noteBeamState(noteNode);
        const slurInfos = mxmlHelpers.getSlurData(noteNode);
        const tupletInfos = mxmlHelpers.getTupletData(noteNode);
        const ornaments = mxmlHelpers.articulationsAndOrnaments(noteNode);
        const lyrics = mxmlHelpers.lyrics(noteNode);

        // voices are not sequential, seem to have artitrary numbers and
        // persist per part (same with staff IDs)
        if (typeof(staffArray[staffIndex].voices[voiceIndex]) === 'undefined') {
          staffArray[staffIndex].voices[voiceIndex] = { notes: [] };
          staffArray[staffIndex].voices[voiceIndex].ticksUsed = 0;
          // keep track of 0-indexed voice for slurs and other modifiers
          if (!xmlState.staffVoiceHash[staffIndex]) {
            xmlState.staffVoiceHash[staffIndex] = [];
          }
          if (xmlState.staffVoiceHash[staffIndex].indexOf(voiceIndex) < 0) {
            xmlState.staffVoiceHash[staffIndex].push(voiceIndex);
          }
          xmlState.beamGroups[voiceIndex] = 0;
        }
        if (chordNode.length === 0) {
          staffArray[staffIndex].voices[voiceIndex].ticksUsed += tickCount;
        }
        const voice = staffArray[staffIndex].voices[voiceIndex];
        const pitch = mxmlHelpers.smoPitchFromNote(noteNode,
          SmoMeasure.defaultPitchForClef[staffArray[staffIndex].clefInfo.clef]);
        if (isGrace === false) {
          if (chordNode.length) {
            // If this is a note in a chord, just add the pitch to previous note.
            previousNote.pitches.push(pitch);
          } else {
            // Create a new note
            noteData = JSON.parse(JSON.stringify(SmoNote.defaults));
            noteData.noteType = noteType;
            noteData.pitches = [pitch];
            // If this is a non-grace note, add any grace notes to the note since SMO
            // treats them as note modifiers
            noteData.ticks = { numerator: tickCount, denominator: 1, remainder: 0 };
            previousNote = new SmoNote(noteData);
            ornaments.forEach((ornament) => {
              if (ornament.ctor === 'SmoOrnament') {
                previousNote.toggleOrnament(ornament);
              } else if (ornament.ctor === 'SmoArticulation') {
                previousNote.toggleArticulation(ornament);
              }
            });
            lyrics.forEach((lyric) => {
              previousNote.addLyric(lyric);
            });
            for (grIx = 0; grIx < graceNotes.length; ++grIx) {
              previousNote.addGraceNote(graceNotes[grIx], grIx);
            }
            graceNotes = []; // clear the grace note array
            // If this note starts later than the cursor due to forward, pad with rests
            if (tickCursor > staffArray[staffIndex].voices[voiceIndex].ticksUsed) {
              const pads = smoMusic.splitIntoValidDurations(
                tickCursor - tickCount);
              pads.forEach((pad) => {
                voice.notes.push(SmoMeasure.createRestNoteWithDuration(pad,
                  staffArray[staffIndex].clefInfo.clef));
              });
              // then reset the cursor since we are now in sync
              staffArray[staffIndex].voices[voiceIndex].ticksUsed = tickCursor;
            }
            mxmlScore.updateSlurStates(xmlState, slurInfos,
              staffIndex, xmlState.measureIndex, voiceIndex, voice.notes.length);
            voice.notes.push(previousNote);
            if (beamState === mxmlHelpers.beamStates.BEGIN) {
              xmlState.beamGroups[voiceIndex] = 1;
            } else if (xmlState.beamGroups[voiceIndex]) {
              xmlState.beamGroups[voiceIndex] += 1;
              if (beamState === mxmlHelpers.beamStates.END) {
                mxmlScore.backtrackBeamGroup(voice, xmlState.beamGroups[voiceIndex]);
                xmlState.beamGroups[voiceIndex] = 0;
              }
            }
            mxmlScore.updateTupletStates(xmlState, tupletInfos, voice,
              staffIndex, voiceIndex);
          }
        } else {
          if (chordNode.length) {
            graceNotes[graceNotes.length - 1].pitches.push(pitch);
          } else {
            // grace note durations don't seem to have explicit duration, so
            // get it from note type
            mxmlScore.updateSlurStates(xmlState, slurInfos,
              staffIndex, measureNumber, voiceIndex, voice.notes.length);
            graceNotes.push(new SmoGraceNote({
              pitches: [pitch],
              ticks: { numerator: tickCount, denominator: 1, remainder: 0 }
            }));
          }
        }
      }
    });

    staffArray.forEach((staffData) => {
      const smoMeasure = SmoMeasure.getDefaultMeasure({
        clef: staffData.clefInfo.clef
      });
      smoMeasure.systemBreak = mxmlHelpers.isSystemBreak(measureElement);
      smoMeasure.tempo = xmlState.tempo;
      smoMeasure.keySignature = xmlState.keySignature;
      smoMeasure.timeSignature = xmlState.timeSignature;
      // voices not in array, put them in an array
      Object.keys(staffData.voices).forEach((voiceKey) => {
        const voice = staffData.voices[voiceKey];
        voice.notes.forEach((note) => {
          if (!note.clef) {
            note.clef = smoMeasure.clef;
          }
        });
        smoMeasure.voices.push(voice);
      });
      if (smoMeasure.voices.length === 0) {
        smoMeasure.voices.push({ notes: SmoMeasure.getDefaultNotes(smoMeasure) });
      }
      xmlState.completedTuplets.forEach((tuplet) => {
        smoMeasure.tuplets.push(tuplet);
      });
      xmlState.completedTuplets = [];
      staffData.measure = smoMeasure;
    });
    // Pad incomplete measures/voices with rests
    const maxTicks = staffArray.map((staffData) => staffData.measure.getMaxTicksVoice())
      .reduce((a, b) => a > b ? a : b);
    staffArray.forEach((staffData) => {
      let i = 0;
      let j = 0;
      for (i = 0; i < staffData.measure.voices.length; ++i) {
        const curTicks = staffData.measure.getTicksFromVoice(i);
        if (curTicks < maxTicks) {
          const tickAr = smoMusic.splitIntoValidDurations(maxTicks - curTicks);
          for (j = 0; j < tickAr.length; ++j) {
            staffData.measure.voices[i].notes.push(
              SmoMeasure.createRestNoteWithDuration(tickAr[j], staffData.measure.clef)
            );
          }
        }
      }
    });
    return staffArray;
  }
}
