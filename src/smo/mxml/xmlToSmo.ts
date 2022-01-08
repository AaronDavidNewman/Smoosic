// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
/**
 * Logic to convert music XML (finale) to Smo internal format
 * @module XmlToSmo
 */
import { XmlHelpers } from './xmlHelpers';
import { XmlVoiceInfo, XmlState, XmlWedgeInfo } from './xmlState';
import { SmoLayoutManager, SmoTextGroup } from '../data/scoreModifiers';
import { SmoTempoText, SmoMeasureFormat, SmoMeasureModifierBase, SmoVolta, SmoBarline } from '../data/measureModifiers';
import { SmoScore } from '../data/score';
import { SmoMeasure, SmoMeasureParams } from '../data/measure';
import { emptyScoreJson } from '../../music/basic';
import { SmoMusic } from '../data/music';
import { SmoGraceNote, SmoOrnament, SmoArticulation } from '../data/noteModifiers';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoNote, SmoNoteParams } from '../data/note';
import { Pitch, PitchKey, Clef } from '../data/common';
import { SmoSlur } from '../../../release/smoosic';
import { SmoSelection } from '../xform/selections';
import { SmoOperation } from '../xform/operations';
import { SmoInstrument } from '../data/staffModifiers';

/**
 * A class that takes a music XML file and outputs a {@link SmoScore}
 * @category SmoToXml
 */
export class XmlToSmo {
  static get mmPerPixel() {
    return 0.264583;
  }
  static get customProportionDefault() {
    return SmoScore.defaults.preferences.customProportion;
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
  static get scoreInfoFields() {
    return ['title', 'subTitle', 'composer', 'copyright'];
  }
  /**
   * Convert music XML file from parsed xml to a {@link SmoScore}
   * @param xmlDoc 
   * @returns
   */
  static convert(xmlDoc: Document): SmoScore {
    try {
      const scoreRoots = [...xmlDoc.getElementsByTagName('score-partwise')];
      if (!scoreRoots.length) {
        // no score node
        return SmoScore.deserialize(emptyScoreJson);
      }

      const scoreRoot = scoreRoots[0];
      const rv: SmoScore = new SmoScore(SmoScore.defaults);
      rv.staves = [];
      const layoutDefaults = rv.layoutManager as SmoLayoutManager;
      // if no scale given in score, default to something small.
      layoutDefaults.globalLayout.svgScale = 0.5;
      layoutDefaults.globalLayout.zoomScale = 1.0;
      const xmlState = new XmlState();
      xmlState.newTitle = false;
      rv.scoreInfo.name = 'Imported Smoosic';
      XmlToSmo.scoreInfoFields.forEach((field) => {
        (rv.scoreInfo as any)[field] = '';
      });
      const childNodes = [...scoreRoot.children];
      childNodes.forEach((scoreElement) => {
        if (scoreElement.tagName === 'work') {
          const scoreNameNode = [...scoreElement.getElementsByTagName('work-title')];
          if (scoreNameNode.length && scoreNameNode[0].textContent) {
            rv.scoreInfo.title = scoreNameNode[0].textContent;
            rv.scoreInfo.name = rv.scoreInfo.title;
            xmlState.newTitle = true;
          }
        } else if (scoreElement.tagName === 'identification') {
          const creators = [...scoreElement.getElementsByTagName('creator')];
          creators.forEach((creator) => {
            if (creator.getAttribute('type') === 'composer' && creator.textContent) {
              rv.scoreInfo.composer = creator.textContent;
            }
          });
        } else if (scoreElement.tagName === 'movement-title') {
          if (xmlState.newTitle && scoreElement.textContent) {
            rv.scoreInfo.subTitle = scoreElement.textContent;
          } else if (scoreElement.textContent) {
            rv.scoreInfo.title = scoreElement.textContent;
            rv.scoreInfo.name = rv.scoreInfo.title;
            xmlState.newTitle = true;
          }
        } else if (scoreElement.tagName === 'defaults') {
          XmlToSmo.defaults(scoreElement, rv, layoutDefaults);
        } else if (scoreElement.tagName === 'part') {
          xmlState.initializeForPart();
          XmlToSmo.part(scoreElement, xmlState);
        }
      });
      // The entire score is parsed and xmlState now contains the staves.
      rv.formattingManager = xmlState.formattingManager;
      rv.staves = xmlState.smoStaves;
      xmlState.updateStaffGroups();
      rv.systemGroups = xmlState.getSystems();

      // Fix tempo to be column mapped
      rv.staves[0].measures.forEach((measure) => {
        const tempoStaff = rv.staves.find((ss) => ss.measures[measure.measureNumber.measureIndex].tempo.display === true);
        if (tempoStaff) {
          const tempo = tempoStaff.measures[measure.measureNumber.measureIndex].tempo;
          rv.staves.forEach((ss) => {
            ss.measures[measure.measureNumber.measureIndex].tempo =
              SmoMeasureModifierBase.deserialize(tempo);
          });
        }
      });
      const lm: SmoLayoutManager = rv.layoutManager as SmoLayoutManager;
      if (rv.scoreInfo.title) {
        rv.addTextGroup(SmoTextGroup.createTextForLayout(
          SmoTextGroup.purposes.TITLE, rv.scoreInfo.title, lm.getScaledPageLayout(0)
        ));
      }
      if (rv.scoreInfo.subTitle) {
        rv.addTextGroup(SmoTextGroup.createTextForLayout(
          SmoTextGroup.purposes.SUBTITLE, rv.scoreInfo.subTitle, lm.getScaledPageLayout(0)
        ));
      }
      if (rv.scoreInfo.composer) {
        rv.addTextGroup(SmoTextGroup.createTextForLayout(
          SmoTextGroup.purposes.COMPOSER, rv.scoreInfo.composer, lm.getScaledPageLayout(0)
        ));
      }
      XmlToSmo.setSlurDefaults(rv);
      rv.preferences.showPiano = false;
      XmlToSmo.setVoltas(rv, xmlState);
      return rv;
    } catch (exc) {
      console.warn(exc);
      return SmoScore.deserialize(emptyScoreJson);
    }
  }
  /**
   * when building the slurs, we don't always know which direction the beams will go or what other
   * voices there will be.
   * @param score
   */
  static setSlurDefaults(score: SmoScore) {
    score.staves.forEach((staff) => {
      const slurs = staff.modifiers.filter((mm) =>mm.ctor === 'SmoSlur');
      slurs.forEach((ss) => {
        const slur = (ss as any) as SmoSlur;
        const sel1 = SmoSelection.noteFromSelector(score, ss.startSelector);
        const sel2 = SmoSelection.noteFromSelector(score, ss.endSelector);
        if (sel1 && sel2) {
          const slurParams = SmoOperation.getDefaultSlurDirection(score, sel1, sel2);
          slur.position = slurParams.position;
          slur.position_end = slurParams.position_end;
          slur.invert = slurParams.invert;
          slur.yOffset = slurParams.yOffset;
          slur.cp1y = slurParams.cp1y;
          slur.cp2y = slurParams.cp2y;
          slur.xOffset = slurParams.xOffset;
        }
      });
    });
  }
  /**
   * After parsing the XML, resolve the voltas we've saved
   * @param score 
   * @param state 
   */
  static setVoltas(score: SmoScore, state: XmlState) {
    const endingMeasures = Object.keys(state.endingMap).map((k) => parseInt(k, 10));
    endingMeasures.forEach((em) => {
      const endings = state.endingMap[em];
      endings.forEach((ending) => {
        const defs = SmoVolta.defaults;
        defs.number = ending.number;
        defs.startBar = ending.start;
        defs.endBar = ending.end >= 0 ? ending.end : ending.start;
        const volta = new SmoVolta(defs);
        SmoOperation.addEnding(score, volta);
      });
    });
  }

  /**
   * /score-partwise/defaults
   * @param defaultsElement 
   * @param score 
   * @param layoutDefaults 
   */
  static defaults(defaultsElement: Element, score: SmoScore, layoutDefaults: SmoLayoutManager) {
    // Default scale for mxml
    let scale = 1 / 7;
    const currentScale = layoutDefaults.getGlobalLayout().svgScale;
    const pageLayoutNode = defaultsElement.getElementsByTagName('page-layout');
    if (pageLayoutNode.length) {
      XmlHelpers.assignDefaults(pageLayoutNode[0], layoutDefaults.globalLayout, XmlToSmo.pageLayoutMap);
    }
    const pageMarginNode = XmlHelpers.getChildrenFromPath(defaultsElement,
      ['page-layout', 'page-margins']);
    if (pageMarginNode.length) {
      XmlHelpers.assignDefaults(pageMarginNode[0], layoutDefaults.pageLayouts[0], XmlToSmo.pageMarginMap);
    }

    const scaleNode = defaultsElement.getElementsByTagName('scaling');
    if (scaleNode.length) {
      const mm = XmlHelpers.getNumberFromElement(scaleNode[0], 'millimeters', 1);
      const tn = XmlHelpers.getNumberFromElement(scaleNode[0], 'tenths', 7);
      if (tn > 0 && mm > 0) {
        scale = mm / tn;
      }
    }
    // Convert from mm to pixels, this is our default svg scale
    // mm per tenth * pixels / mm gives us pixels per tenth
    layoutDefaults.globalLayout.svgScale = (scale * 45 / 40) / XmlToSmo.mmPerPixel;
    score.scaleTextGroups(currentScale / layoutDefaults.globalLayout.svgScale);
  }

  // ### part
  // /score-partwise/part
  static part(partElement: Element, xmlState: XmlState) {
    let staffId = xmlState.smoStaves.length;
    console.log('part ' + partElement.getAttribute('id'));
    xmlState.initializeForPart();
    const stavesForPart: SmoSystemStaff[] = [];
    const measureElements = [...partElement.getElementsByTagName('measure')];
    measureElements.forEach((measureElement) => {
      // Parse the measure element, populate staffArray of xmlState with the
      // measure data
      XmlToSmo.measure(measureElement, xmlState);
      const newStaves = xmlState.staffArray;
      if (newStaves.length > 1 && stavesForPart.length <= newStaves[0].clefInfo.staffId) {
        xmlState.staffGroups.push({ start: staffId, length: newStaves.length });
      }
      xmlState.globalCursor += (newStaves[0].measure as SmoMeasure).getMaxTicksVoice();
      newStaves.forEach((staffMeasure) => {
        if (stavesForPart.length <= staffMeasure.clefInfo.staffId) {
          const params = SmoSystemStaff.defaults;
          params.staffId = staffId;
          params.measureInstrumentMap = xmlState.instrumentMap;
          stavesForPart.push(new SmoSystemStaff(params));
          staffId += 1;
        }
        const smoStaff = stavesForPart[staffMeasure.clefInfo.staffId];
        smoStaff.measures.push(staffMeasure.measure as SmoMeasure);
      });
      const oldStaffId = staffId - stavesForPart.length;
      xmlState.backtrackHairpins(stavesForPart[0], oldStaffId + 1);
    });
    xmlState.smoStaves = xmlState.smoStaves.concat(stavesForPart);
    xmlState.completeSlurs();
    xmlState.completeTies();
  }
  // ### tempo
  // /score-partwise/measure/direction/sound:tempo
  static tempo(element: Element) {
    let tempoText = '';
    let customText = tempoText;
    const rv: { staffId: number, tempo: SmoTempoText }[] = [];
    const soundNodes = XmlHelpers.getChildrenFromPath(element,
      ['sound']);
    soundNodes.forEach((sound) => {
      let tempoMode = SmoTempoText.tempoModes.durationMode;
      tempoText = sound.getAttribute('tempo') as string;
      if (tempoText) {
        const bpm = parseInt(tempoText, 10);
        const wordNode =
          [...element.getElementsByTagName('words')];
        tempoText = wordNode.length ? wordNode[0].textContent as string :
          tempoText.toString();
        if (isNaN(parseInt(tempoText, 10))) {
          if (SmoTempoText.tempoTexts[tempoText.toLowerCase()]) {
            tempoMode = SmoTempoText.tempoModes.textMode;
          } else {
            tempoMode = SmoTempoText.tempoModes.customMode;
            customText = tempoText;
          }
        }
        const params = SmoTempoText.defaults;
        params.tempoMode = tempoMode;
        params.bpm = bpm;
        params.tempoText = tempoText;
        params.customText = customText;
        params.display = true;
        const tempo = new SmoTempoText(params);
        const staffId = XmlHelpers.getStaffId(element);
        rv.push({ staffId, tempo });
      }
    });
    return rv;
  }
  // ### dynamics
  // /score-partwise/part/measure/direction/dynamics
  static dynamics(directionElement: Element, xmlState: XmlState) {
    let offset = 1;
    const dynamicNodes = XmlHelpers.getChildrenFromPath(directionElement,
      ['direction-type', 'dynamics']);
    const offsetNodes = XmlHelpers.getChildrenFromPath(directionElement,
      ['offset']);
    if (offsetNodes.length) {
      offset = parseInt(offsetNodes[0].textContent as string, 10);
    }
    dynamicNodes.forEach((dynamic) => {
      xmlState.dynamics.push({
        dynamic: dynamic.children[0].tagName,
        offset: (offset / xmlState.divisions) * 4096
      });
    });
  }

  // ### attributes
  // /score-partwise/part/measure/attributes
  static attributes(measureElement: Element, xmlState: XmlState) {
    let smoKey: PitchKey = {} as PitchKey;
    const attributesNodes = XmlHelpers.getChildrenFromPath(measureElement, ['attributes']);
    if (!attributesNodes.length) {
      return;
    }
    const attributesNode = attributesNodes[0];
    xmlState.divisions =
      XmlHelpers.getNumberFromElement(attributesNode, 'divisions', xmlState.divisions);

    const keyNode = XmlHelpers.getChildrenFromPath(attributesNode, ['key']);
    // MusicXML expresses keys in 'fifths' from C.
    if (keyNode.length) {
      const fifths = XmlHelpers.getNumberFromElement(keyNode[0], 'fifths', 0);
      if (fifths < 0) {
        smoKey = SmoMusic.circleOfFifths[SmoMusic.circleOfFifths.length + fifths];
      } else {
        smoKey = SmoMusic.circleOfFifths[fifths];
      }
      xmlState.keySignature = smoKey.letter.toUpperCase();
      if (smoKey.accidental !== 'n') {
        xmlState.keySignature += smoKey.accidental;
      }
    }
    const transposeNode = XmlHelpers.getChildrenFromPath(attributesNode, ['transpose']);
    if (transposeNode.length) {
      const offset = XmlHelpers.getNumberFromElement(transposeNode[0], 'chromatic', 0);
      if (offset !== xmlState.instrument.keyOffset) {
        xmlState.instrument.keyOffset = -1 * offset;
        if (xmlState.instrumentMap[xmlState.measureIndex]) {
          xmlState.instrumentMap[xmlState.measureIndex].keyOffset = xmlState.instrument.keyOffset;
        } else {
          const params = xmlState.instrument;
          xmlState.instrumentMap[xmlState.measureIndex] = new SmoInstrument(params);
        }
      }
    }

    const currentTime = xmlState.timeSignature.split('/');
    const timeNodes = XmlHelpers.getChildrenFromPath(attributesNode, ['time']);
    if (timeNodes.length) {
      const timeNode = timeNodes[0];
      const num = XmlHelpers.getNumberFromElement(timeNode, 'beats', parseInt(currentTime[0], 10));
      const den = XmlHelpers.getNumberFromElement(timeNode, 'beat-type', parseInt(currentTime[1], 10));
      xmlState.timeSignature = '' + num + '/' + den;
    }

    const clefNodes = XmlHelpers.getChildrenFromPath(attributesNode, ['clef']);
    if (clefNodes.length) {
      // We expect the number of clefs to equal the number of staves in each measure
      clefNodes.forEach((clefNode) => {
        let clefNum = 0;
        let clef = 'treble';
        const clefAttrs = XmlHelpers.nodeAttributes(clefNode);
        if (typeof (clefAttrs.number) !== 'undefined') {
          // staff numbers index from 1 in mxml
          clefNum = parseInt(clefAttrs.number, 10) - 1;
        }
        const clefType = XmlHelpers.getTextFromElement(clefNode, 'sign', 'G');
        const clefLine = XmlHelpers.getNumberFromElement(clefNode, 'line', 2);
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

  // ### wedge (hairpin)
  // /score-partwise/part/measure/direction/direction-type/wedge
  static wedge(directionElement: Element, xmlState: XmlState) {
    let crescInfo: XmlWedgeInfo | null = null;
    const wedgeNodes = XmlHelpers.getChildrenFromPath(directionElement,
      ['direction-type', 'wedge']);
    wedgeNodes.forEach((wedgeNode) => {
      crescInfo = { type: wedgeNode.getAttribute('type') as string };
    });
    // If this is a start hairpin, start it.  If an end hairpin, add it to the
    // hairpin array with the type and start/stop ticks
    if (crescInfo !== null) {
      xmlState.processWedge(crescInfo);
    }
  }
  // ### direction
  // /score-partwise/part/measure/direction
  static direction(directionElement: Element, xmlState: XmlState) {
    const tempo = XmlToSmo.tempo(directionElement);
    // Only display tempo if changes.
    if (tempo.length) {
      // TODO: staff ID is with tempo, but tempo is per column in SMO
      if (!SmoTempoText.eq(xmlState.tempo, tempo[0].tempo)) {
        xmlState.tempo = tempo[0].tempo;
        xmlState.tempo.display = true;
      }
    }
    // parse dynamic node and add to xmlState
    XmlToSmo.dynamics(directionElement, xmlState);

    // parse wedge (hairpin)
    XmlToSmo.wedge(directionElement, xmlState);
  }
  // ### note
  // /score-partwise/part/measure/note
  static note(noteElement: Element, xmlState: XmlState) {
    let grIx = 0;
    const staffIndex: number = XmlHelpers.getStaffId(noteElement);
    xmlState.staffIndex = staffIndex;
    // We assume the clef information from attributes comes before the notes
    // xmlState.staffArray[staffIndex] = { clefInfo: { clef }, voices[voiceIndex]: notes[] }
    if (xmlState.staffArray.length <= staffIndex) {
      // mxml has measures for all staves in a part interleaved.  In SMO they are
      // each in a separate stave object.  Base the staves we expect based on
      // the number of clefs in the xml state object
      xmlState.clefInfo.forEach((clefInfo) => {
        xmlState.staffArray.push({ clefInfo, measure: null, voices: {} as Record<number | string, XmlVoiceInfo> });
      });
    }
    const chordNode = XmlHelpers.getChildrenFromPath(noteElement, ['chord']);
    if (chordNode.length === 0) {
      xmlState.currentDuration += XmlHelpers.durationFromNode(noteElement, 0);
    }
    // voices are not sequential, seem to have artitrary numbers and
    // persist per part (same with staff IDs).  Update XML state if these are new
    // staves
    const voiceIndex = XmlHelpers.getVoiceId(noteElement);
    xmlState.voiceIndex = voiceIndex;
    xmlState.initializeStaff(staffIndex, voiceIndex);
    const voice = xmlState.staffArray[staffIndex].voices[voiceIndex];
    // Calculate the tick and staff index for selectors
    const tickIndex = chordNode.length < 1 ? voice.notes.length : voice.notes.length - 1;
    const smoVoiceIndex = xmlState.staffVoiceHash[staffIndex].indexOf(voiceIndex);
    const pitchIndex = chordNode.length ? xmlState.previousNote.pitches.length : 0;
    const smoStaffIndex = xmlState.smoStaves.length + staffIndex;
    const selector = {
      staff: smoStaffIndex, measure: xmlState.measureIndex, voice: smoVoiceIndex,
      tick: tickIndex, pitches: []
    };
    const divisions = xmlState.divisions;
    const printText = noteElement.getAttribute('print-object');
    const hideNote = typeof (printText) === 'string' && printText === 'no';
    const isGrace = XmlHelpers.isGrace(noteElement);
    const restNode = XmlHelpers.getChildrenFromPath(noteElement, ['rest']);
    const noteType = restNode.length ? 'r' : 'n';
    const durationData = XmlHelpers.ticksFromDuration(noteElement, divisions, 4096);
    const tickCount = durationData.tickCount;
    if (chordNode.length === 0) {
      xmlState.staffArray[staffIndex].voices[voiceIndex].ticksUsed += tickCount;
    }
    xmlState.tickCursor = (xmlState.currentDuration / divisions) * 4096;
    const beamState = XmlHelpers.noteBeamState(noteElement);
    const slurInfos = XmlHelpers.getSlurData(noteElement, selector);
    const tieInfos = XmlHelpers.getTieData(noteElement, selector, pitchIndex);
    const tupletInfos = XmlHelpers.getTupletData(noteElement);
    const ornaments = XmlHelpers.articulationsAndOrnaments(noteElement);
    const lyrics = XmlHelpers.lyrics(noteElement);
    const flagState = XmlHelpers.getStemType(noteElement);
    const clefString: Clef = xmlState.staffArray[staffIndex].clefInfo.clef as Clef;
    const pitch: Pitch = XmlHelpers.smoPitchFromNote(noteElement,
      SmoMeasure.defaultPitchForClef[clefString]);
    if (isGrace === false) {
      if (chordNode.length) {
        // If this is a note in a chord, just add the pitch to previous note.
        xmlState.previousNote.pitches.push(pitch);
        xmlState.updateTieStates(tieInfos);
      } else {
        // Create a new note
        const noteData: SmoNoteParams = SmoNote.defaults;
        noteData.noteType = noteType;
        noteData.pitches = [pitch];
        // If this is a non-grace note, add any grace notes to the note since SMO
        // treats them as note modifiers
        noteData.ticks = { numerator: tickCount, denominator: 1, remainder: 0 };
        noteData.flagState = flagState;
        noteData.clef = clefString;
        xmlState.previousNote = new SmoNote(noteData);
        if (hideNote) {
          xmlState.previousNote.makeHidden(true);
        }
        xmlState.updateDynamics();
        ornaments.forEach((ornament) => {
          if (ornament.ctor === 'SmoOrnament') {
            xmlState.previousNote.toggleOrnament(ornament as SmoOrnament);
          } else if (ornament.ctor === 'SmoArticulation') {
            xmlState.previousNote.toggleArticulation(ornament as SmoArticulation);
          }
        });
        lyrics.forEach((lyric) => {
          xmlState.addLyric(xmlState.previousNote, lyric);
        });
        for (grIx = 0; grIx < xmlState.graceNotes.length; ++grIx) {
          xmlState.previousNote.addGraceNote(xmlState.graceNotes[grIx], grIx);
        }
        xmlState.graceNotes = []; // clear the grace note array
        // If this note starts later than the cursor due to forward, pad with rests
        if (xmlState.tickCursor > xmlState.staffArray[staffIndex].voices[voiceIndex].ticksUsed) {
          const pads = SmoMusic.splitIntoValidDurations(
            xmlState.tickCursor - xmlState.staffArray[staffIndex].voices[voiceIndex].ticksUsed);
          pads.forEach((pad) => {
            const clefString: Clef = xmlState.staffArray[staffIndex].clefInfo.clef as Clef;
            const padNote = SmoMeasure.createRestNoteWithDuration(pad,
              clefString);
            padNote.makeHidden(true);
            voice.notes.push(padNote);
          });
          // Offset any partially-completed ties or slurs with the padding
          slurInfos.forEach((slurInfo) => {
            slurInfo.selector.tick += pads.length;
          });
          tieInfos.forEach((tieInfo) => {
            tieInfo.selector.tick += pads.length;
          });
          selector.tick += pads.length;
          // then reset the cursor since we are now in sync
          xmlState.staffArray[staffIndex].voices[voiceIndex].ticksUsed = xmlState.tickCursor;
        }
        xmlState.updateSlurStates(slurInfos);
        xmlState.updateTieStates(tieInfos);
        voice.notes.push(xmlState.previousNote);
        xmlState.updateBeamState(beamState, durationData.alteration, voice, voiceIndex);
        xmlState.updateTupletStates(tupletInfos, voice,
          staffIndex, voiceIndex);
      }
    } else {
      if (chordNode.length) {
        xmlState.graceNotes[xmlState.graceNotes.length - 1].pitches.push(pitch);
      } else {
        // grace note durations don't seem to have explicit duration, so
        // get it from note type
        xmlState.updateSlurStates(slurInfos);
        xmlState.updateTieStates(tieInfos);
        xmlState.graceNotes.push(new SmoGraceNote({
          pitches: [pitch],
          ticks: { numerator: tickCount, denominator: 1, remainder: 0 }
        }));
      }
    }
  }
  // ### parseMeasureElement
  // /score-partwise/part/measure
  // A measure in music xml might represent several measures in SMO at the same
  // column in the score
  static measure(measureElement: Element, xmlState: XmlState) {
    xmlState.initializeForMeasure(measureElement);
    const elements = [...measureElement.children];
    let hasNotes = false;
    elements.forEach((element) => {
      if (element.tagName === 'backup') {
        xmlState.currentDuration -= XmlHelpers.durationFromNode(element, 0);
      }
      if (element.tagName === 'forward') {
        xmlState.currentDuration += XmlHelpers.durationFromNode(element, 0);
      }
      if (element.tagName === 'attributes') {
        // update the running state of the XML with new information from this measure
        // if an XML attributes element is present
        XmlToSmo.attributes(measureElement, xmlState);
      } else if (element.tagName === 'direction') {
        XmlToSmo.direction(element, xmlState);
      } else if (element.tagName === 'note') {
        XmlToSmo.note(element, xmlState);
        hasNotes = true;
      } else if (element.tagName === 'barline') {
        xmlState.updateEndings(element);
      }
    });
    // If a measure has no notes, just make one with the defaults
    if (hasNotes === false && xmlState.staffArray.length < 1 && xmlState.clefInfo.length >= 1) {
      xmlState.clefInfo.forEach((clefInfo) => {
        xmlState.staffArray.push({ clefInfo, measure: null, voices: {} });
      });
    }
    xmlState.staffArray.forEach((staffData) => {
      const clef = staffData.clefInfo.clef as Clef;
      const params: SmoMeasureParams = SmoMeasure.defaults;
      params.transposeIndex = xmlState.instrument.keyOffset;
      params.clef = clef;
      const smoMeasure = SmoMeasure.getDefaultMeasure(params);
      smoMeasure.format = new SmoMeasureFormat(SmoMeasureFormat.defaults);
      smoMeasure.format.measureIndex = xmlState.measureNumber;
      smoMeasure.format.systemBreak = XmlHelpers.isSystemBreak(measureElement);
      smoMeasure.tempo = xmlState.tempo;
      smoMeasure.format.customProportion = XmlToSmo.customProportionDefault;
      xmlState.formattingManager.updateMeasureFormat(smoMeasure.format);
      smoMeasure.keySignature = xmlState.keySignature;
      smoMeasure.timeSignature = SmoMeasure.convertLegacyTimeSignature(xmlState.timeSignature);
      smoMeasure.measureNumber.localIndex = xmlState.measureNumber;
      smoMeasure.measureNumber.measureIndex = xmlState.measureIndex;
      smoMeasure.measureNumber.staffId = staffData.clefInfo.staffId + xmlState.smoStaves.length;
      const startBarDefs = SmoBarline.defaults;
      startBarDefs.position = SmoBarline.positions.start;
      startBarDefs.barline = xmlState.startBarline;
      const endBarDefs = SmoBarline.defaults;
      endBarDefs.position = SmoBarline.positions.end;
      endBarDefs.barline = xmlState.endBarline;
      smoMeasure.setBarline(new SmoBarline(startBarDefs));
      smoMeasure.setBarline(new SmoBarline(endBarDefs));
      // voices not in array, put them in an array
      Object.keys(staffData.voices).forEach((voiceKey) => {
        const voice = staffData.voices[voiceKey];
        xmlState.addTupletsToMeasure(smoMeasure, staffData.clefInfo.staffId,
          parseInt(voiceKey, 10));
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
      staffData.measure = smoMeasure;
    });
    // Pad incomplete measures/voices with rests
    const maxTicks = xmlState.staffArray.map((staffData) => (staffData.measure as SmoMeasure).getMaxTicksVoice())
      .reduce((a, b) => a > b ? a : b);
    xmlState.staffArray.forEach((staffData) => {
      let i = 0;
      let j = 0;
      const measure = staffData.measure as SmoMeasure;
      for (i = 0; i < measure.voices.length; ++i) {
        const curTicks = measure.getTicksFromVoice(i);
        if (curTicks < maxTicks) {
          const tickAr = SmoMusic.splitIntoValidDurations(maxTicks - curTicks);
          for (j = 0; j < tickAr.length; ++j) {
            measure.voices[i].notes.push(
              SmoMeasure.createRestNoteWithDuration(tickAr[j], measure.clef)
            );
          }
        }
      }
    });
  }
}
