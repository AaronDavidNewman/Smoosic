// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Clef, Pitch } from '../data/common';
import { SmoNote } from '../data/note';
import { SmoMusic } from '../data/music';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoScore } from '../data/score';
import { SmoBarline, TimeSignature } from '../data/measureModifiers';
import { SmoStaffHairpin, SmoSlur } from '../data/staffModifiers';
import { SmoLyric } from '../data/noteModifiers';
import { SmoSelector } from '../xform/selections';

import { XmlHelpers } from './xmlHelpers';
import { SmoTempoText } from '../data/measureModifiers';
import { XmlToSmo } from './xmlToSmo';


interface SlurXml {
  startSelector: SmoSelector,
  endSelector: SmoSelector,
  number: number
}
/**
 * Keep state of the xml document as we are generating it
 */
interface SmoState {
  divisions: number,
  measureNumber: number,
  transposeOffset: number,
  tickCount: number,
  voiceIndex: number,
  keySignature: string,
  voiceTickIndex: number,
  voice?: SmoVoice,
  staff?: SmoSystemStaff,
  slurs: SlurXml[],
  lyricState: Record<number, string>,
  measureTicks: number,
  measure?: SmoMeasure,
  note?: SmoNote,
  beamState: number,
  beamTicks: number,
  timeSignature?: TimeSignature,
  tempo?: SmoTempoText,
  clef: Clef
}

/**
 * Convert {@link SmoScore} object into a music XML serialization
 * 
 * usage: `xdoc: XmlDocument = SmoToXml.convert(score)`
 * @category SmoToXml
 */
export class SmoToXml {
  static get beamStates(): Record<string, number> {
    return {
      none: 1, start: 2, continue: 3, stop: 4
    };
  }
  static get defaultState(): SmoState {
    return JSON.parse(JSON.stringify({
      divisions: 0,
      measureNumber: 0,
      transposeOffset: 0,
      tickCount: 0,
      voiceIndex: 0,
      keySignature: 'C',
      voiceTickIndex: 0,
      slurs: [],
      lyricState: {},
      measureTicks: 0,
      beamState: 0,
      beamTicks: 4096,
      clef: 'treble'
    }));
  }
  /**
   * see usage
   * @param score
   * @returns 
   */
  static convert(score: SmoScore): XMLDocument {
    const nn = XmlHelpers.createTextElementChild;
    const dom = XmlHelpers.createRootElement();
    const root = dom.children[0];
    const work = nn(root, 'work', null, '');
    nn(work, 'work-title', score.scoreInfo, 'title');
    const identification = nn(root, 'identification', null, '');
    const creator = nn(identification, 'creator', score.scoreInfo, 'composer');
    XmlHelpers.createAttributes(creator, { type: 'composer' });
    const encoding = nn(identification, 'encoding', null, '');
    nn(encoding, 'software', { software: 'Some pre-release version of Smoosic' }, 'software');
    const today = new Date();
    const dd = (n: number) => n < 10 ? '0' + n.toString() : n.toString()
    const dateString: string = today.getFullYear() + '-' + dd(today.getMonth() + 1) + '-' + dd(today.getDate());
    nn(encoding, 'encoding-date', dateString, 'date');
    const defaults = nn(root, 'defaults', null, '');
    const scaling = nn(defaults, 'scaling', null, '');
    // reverse this:
    // scoreDefaults.layout.svgScale =  (scale * 42 / 40) / xmlToSmo.mmPerPixel;
    const mm = XmlToSmo.mmPerPixel * 42 * score.layoutManager!.getGlobalLayout().svgScale;
    nn(scaling, 'millimeters', { mm }, 'mm');
    nn(scaling, 'tenths', { tenths: 40 }, 'tenths');
    const pageLayout = nn(defaults, 'page-layout', null, '');
    XmlToSmo.pageLayoutMap.forEach((map) => {
      nn(pageLayout, map.xml, score.layoutManager!.globalLayout, map.smo);
    });
    const pageMargins = nn(pageLayout, 'page-margins', null, '');
    XmlToSmo.pageMarginMap.forEach((map) => {
      nn(pageMargins, map.xml, score.layoutManager!.pageLayouts[0], map.smo);
    });
    const partList = nn(root, 'part-list', null, '');
    score.staves.forEach((staff) => {
      const id = 'P' + staff.staffId;
      const scorePart = nn(partList, 'score-part', null, '');
      XmlHelpers.createAttributes(scorePart, { id });
      nn(scorePart, 'part-name', { name: staff.measureInstrumentMap[0].instrumentName }, 'name');
    });
    const smoState: SmoState = SmoToXml.defaultState;
    score.staves.forEach((staff) => {
      const part = nn(root, 'part', null, '');
      const id = 'P' + staff.staffId;
      XmlHelpers.createAttributes(part, { id });
      smoState.measureNumber = 1;
      smoState.tickCount = 0;
      smoState.transposeOffset = 0;
      smoState.staff = staff;
      smoState.slurs = [];
      smoState.lyricState = {};
      staff.measures.forEach((measure) => {
        smoState.measureTicks = 0;
        smoState.measure = measure;
        const measureElement = nn(part, 'measure', null, '');
        SmoToXml.measure(measureElement, smoState);
        smoState.measureNumber += 1;
      });
    });
    return dom;
  }
  /**
   * /score-partwise/part/measure
   * @param measureElement 
   * @param smoState 
   * @returns 
   */
  static measure(measureElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    if (!smoState.measure) {
      return;
    }
    const measure = smoState.measure;
    if (smoState.measureNumber === 1 && measure.isPickup()) {
      smoState.measureNumber = 0;
    }
    if (smoState.measure.getForceSystemBreak()) {
      const printElement = nn(measureElement, 'print', null, '');
      XmlHelpers.createAttributes(printElement, { 'new-system': 'yes' });
    }
    XmlHelpers.createAttributes(measureElement, { number: smoState.measureNumber });
    SmoToXml.attributes(measureElement, smoState);
    smoState.voiceIndex = 1;
    smoState.beamState = SmoToXml.beamStates.none;
    smoState.beamTicks = 0;
    SmoToXml.barline(measureElement, smoState, true);
    measure.voices.forEach((voice) => {
      smoState.voiceTickIndex = 0;
      smoState.voice = voice;
      voice.notes.forEach((note) => {
        smoState.note = note;
        // Start wedge before note starts
        SmoToXml.direction(measureElement, smoState, true);
        SmoToXml.note(measureElement, smoState);
        // End wedge on next tick
        SmoToXml.direction(measureElement, smoState, false);
      });
      if (measure.voices.length > smoState.voiceIndex) {
        smoState.voiceIndex += 1;
        const backupElement = nn(measureElement, 'backup', null, '');
        nn(backupElement, 'duration', { duration: smoState.measureTicks }, 'duration');
      } else {
        smoState.tickCount += smoState.measureTicks;
      }
      smoState.measureTicks = 0;
    });
    SmoToXml.barline(measureElement, smoState, false);
  }
  /**
   * /score-partwise/part/measure/barline
   * @param measureElement 
   * @param smoState 
   * @param start 
   */
  static barline(measureElement: Element, smoState: SmoState, start: boolean) {
    const nn = XmlHelpers.createTextElementChild;
    let barlineElement = null;
    if (start) {
      if (smoState.measure!.getStartBarline().barline === SmoBarline.barlines.startRepeat) {
        barlineElement = nn(measureElement, 'barline', null, '');
        const repeatElement = nn(barlineElement, 'repeat', null, '');
        XmlHelpers.createAttributes(repeatElement, { direction: 'forward' });
      }
    }
    const voltas = smoState.staff!.getVoltasForMeasure(smoState.measure!.measureNumber.measureIndex);
    const numArray: number[] = [];
    voltas.forEach((volta) => {
      if ((start && volta?.startSelector?.measure === smoState.measure!.measureNumber.measureIndex) || 
          (!start && volta?.endSelector?.measure === smoState.measure!.measureNumber.measureIndex)) {
        numArray.push(volta.number);
      }
    });
    if (!start && smoState.measure!.getEndBarline().barline === SmoBarline.barlines.endBar) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      nn(barlineElement, 'bar-style', { style: 'light-heavy'} , 'style');
    } else if (!start && smoState.measure!.getEndBarline().barline === SmoBarline.barlines.doubleBar) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      nn(barlineElement, 'bar-style', { style: 'light-light'} , 'style');
    }
    if (numArray.length) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      const numstr = numArray.join(',');
      const endElement = nn(barlineElement, 'ending', null, '');
      const endString = start ? 'start' : 'stop';
      XmlHelpers.createAttributes(endElement, { type: endString, number: numstr });
    }
    if (!start && smoState.measure!.getEndBarline().barline === SmoBarline.barlines.endRepeat) {
      barlineElement = barlineElement ?? nn(measureElement, 'barline', null, '');
      const repeatElement = nn(barlineElement, 'repeat', null, '');
      XmlHelpers.createAttributes(repeatElement, { direction: 'backward' });
    }
  }

  /**
   * /score-partwise/part/measure/note/notations/slur
   * @param notationsElement 
   * @param smoState 
   */
  static slur(notationsElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const staff: SmoSystemStaff = smoState.staff as SmoSystemStaff;
    const measure = smoState.measure as SmoMeasure;
    const getNumberForSlur = ((slurs: SlurXml[]) => {
      let rv = 1;
      const hash: Record<number, boolean> = {};
      slurs.forEach((ss) => {
        hash[ss.number] = true;
      });
      while (rv < 100) {
        if (typeof(hash[rv]) === 'undefined') {
          break;
        }
        rv += 1;
      }
      return rv;
    });
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    const starts = staff.getSlursStartingAt(selector) as SmoSlur[];
    const ends = staff.getSlursEndingAt(selector) as SmoSlur[];
    const remove: SlurXml[] = [];
    const newSlurs: SlurXml[] = [];
    ends.forEach((slur) => {
      const match = smoState.slurs.find((ss: any) => SmoSelector.eq(ss.startSelector, slur.startSelector) &&
        SmoSelector.eq(ss.endSelector, slur.endSelector));
      if (match) {
        remove.push(match);
        const slurElement = nn(notationsElement, 'slur', null, '');
        XmlHelpers.createAttributes(slurElement, { number: match.number, type: 'stop' });
      }
    });
    smoState.slurs.forEach((slur: any) => {
      if (remove.findIndex((rr) => rr.number === slur.number) < 0) {
        newSlurs.push(slur);
      }
    });
    smoState.slurs = newSlurs;
    starts.forEach((slur) => {
      const number = getNumberForSlur(smoState.slurs);
      smoState.slurs.push({
        startSelector: slur.startSelector,
        endSelector: slur.endSelector,
        number
      });
      const slurElement = nn(notationsElement, 'slur', null, '');
      XmlHelpers.createAttributes(slurElement, { number: number, type: 'start' });
    });
  }
  /**
   * /score-partwise/measure/note/time-modification
   * /score-partwise/measure/note/tuplet
   * @param noteElement 
   * @param notationsElement 
   * @param smoState 
   * @returns 
   */
  static tuplet(noteElement: Element, notationsElement: Element, smoState: SmoState) {
    if (!smoState.measure) {
      return;
    }
    if (!smoState.note) {
      return;
    }
    const nn = XmlHelpers.createTextElementChild;
    const measure = smoState.measure;
    const note = smoState.note;
    const tuplet = measure.getTupletForNote(note);
    if (!tuplet) {
      return;
    }
    const obj = {
      actualNotes: tuplet.numNotes, normalNotes: 4096 / tuplet.stemTicks
    };
    const timeModification = nn(noteElement, 'time-modification', null, '');
    nn(timeModification, 'actual-notes', obj, 'actualNotes');
    nn(timeModification, 'normal-notes', obj, 'normalNotes');
    if (tuplet.getIndexOfNote(note) === 0) {
      const tupletElement = nn(notationsElement, 'tuplet', null, '');
      XmlHelpers.createAttributes(tupletElement, {
        number: 1, type: 'start'
      });
    } else if (tuplet.getIndexOfNote(note) === tuplet.notes.length - 1) {
      const tupletElement = nn(notationsElement, 'tuplet', null, '');
      XmlHelpers.createAttributes(tupletElement, {
        number: 1, type: 'stop'
      });
    }
  }
  /**
   * /score-partwise/measure/note/pitch
   * @param pitch 
   * @param noteElement 
   */
  static pitch(pitch: Pitch, noteElement: Element) {
    const nn = XmlHelpers.createTextElementChild;
    const accidentalOffset = ['bb', 'b', 'n', '#', '##'];
    const alter = accidentalOffset.indexOf(pitch.accidental) - 2;
    const pitchElement = nn(noteElement, 'pitch', null, '');
    nn(pitchElement, 'step', { letter: pitch.letter.toUpperCase() }, 'letter');
    nn(pitchElement, 'alter', { alter }, 'alter');
    nn(pitchElement, 'octave', pitch, 'octave');
  }
  /**
   * /score-partwise/measure/beam
   * @param noteElement 
   * @param smoState 
   * @returns 
   */
  static beamNote(noteElement: Element, smoState: SmoState) {
    if (!smoState.note) {
      return;
    }
    if (!smoState.voice) {
      return;
    }
    const nn = XmlHelpers.createTextElementChild;
    const note = smoState.note;
    const nextNote = (smoState.voiceTickIndex + 1) >= smoState.voice.notes.length ?
      null : smoState.voice.notes[smoState.voiceTickIndex + 1];
    const exceedTicks = smoState.beamTicks + note.tickCount >= note.beamBeats;
    // don't start a beam on a rest
    if (note.isRest() && smoState.beamState === SmoToXml.beamStates.none) {
      return;
    }
    let toBeam = SmoToXml.beamStates.none;
    if (note.tickCount <= 2048 && !exceedTicks) {
      // Explicit end beam, or no more notes to beam, so stop beam
      if (note.endBeam || nextNote === null) {
        if (smoState.beamState !== SmoToXml.beamStates.none) {
          toBeam = SmoToXml.beamStates.stop;
        }
      } else {
        // else if the next note is beamable, start or continue the beam
        if (nextNote.tickCount <= 2048) {
          toBeam = smoState.beamState === SmoToXml.beamStates.continue ?
            SmoToXml.beamStates.continue : SmoToXml.beamStates.start;
        }
      }
    }
    if (toBeam === SmoToXml.beamStates.start || toBeam === SmoToXml.beamStates.continue) {
      smoState.beamTicks += smoState.note.tickCount;
    } else {
      smoState.beamTicks = 0;
    }
    // slur is start/stop, beam is begin, end, gf
    if (toBeam === SmoToXml.beamStates.start) {
      const beamElement = nn(noteElement, 'beam', { type: 'begin' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.continue;
    } else if (toBeam === SmoToXml.beamStates.continue) {
      const beamElement = nn(noteElement, 'beam', { type: 'continue' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
    } else if ((toBeam === SmoToXml.beamStates.stop) ||
      (toBeam === SmoToXml.beamStates.none && smoState.beamState !== SmoToXml.beamStates.none)) {
      const beamElement = nn(noteElement, 'beam', { type: 'end' }, 'type');
      XmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.none;
    }
  }
  /**
   * /score-partwise/measure/direction/direction-type
   * @param measureElement 
   * @param smoState 
   * @param beforeNote 
   */
  static direction(measureElement: Element, smoState: SmoState, beforeNote: boolean) {
    let addDirection = false;
    const nn = XmlHelpers.createTextElementChild;
    const directionElement = measureElement.ownerDocument.createElement('direction');
    const dtype = nn(directionElement, 'direction-type', null, '');
    const staff = smoState.staff as SmoSystemStaff;
    const measure = smoState.measure!;
    const tempo = measure.getTempo();
    if (beforeNote === true && (tempo.display || measure.measureNumber.measureIndex === 0)) {
      const tempoBpm = Math.round(tempo.bpm * tempo.beatDuration / 4096);
      const tempoElement = nn(directionElement, 'direction-type', null, '');      
      let tempoText = tempo.tempoText;
      if (tempo.tempoMode === SmoTempoText.tempoModes.customMode) {
        tempoText = tempo.customText;
      }
      if (tempo.tempoMode === SmoTempoText.tempoModes.textMode) {
        nn(tempoElement, 'words', { words: tempoText }, 'words');
      } else if (tempo.tempoMode === SmoTempoText.tempoModes.customMode || tempo.tempoMode === SmoTempoText.tempoModes.durationMode) {
        const metronomeElement = nn(tempoElement, 'metronome', null, '');
        let durationType = 'quarter';
        let dotType = false;
        if (tempo.bpm >= 8192) {
          durationType = 'half';
        } else if (tempo.bpm < 4096) {
          durationType = 'eighth';
        }
        if (tempo.bpm === 6144 || tempo.bpm === 12288 || tempo.bpm === 3072) {
          dotType = true;
        }
        nn(metronomeElement, 'beat-unit', { beatUnit: durationType}, 'beatUnit');
        if (dotType) {
          nn(metronomeElement, 'beat-unit-dot', null, '');
        }
        nn(metronomeElement, 'per-minute', { tempo }, 'bpm');
      }
      // Sound is supposed to come last under 'direction' element
      const soundElement = nn(directionElement, 'sound', null, '');
      soundElement.setAttribute('tempo', tempoBpm.toString());
    }
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    if (!beforeNote) {
      selector.tick -= 1;
    }
    const startWedge = staff.modifiers.find((mod) =>
      SmoSelector.sameNote(mod.startSelector, selector) &&
      (mod.attrs.type === 'SmoStaffHairpin')) as SmoStaffHairpin;
    const endWedge = staff.modifiers.find((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector) &&
      (mod.attrs.type === 'SmoStaffHairpin')) as SmoStaffHairpin;
    if (endWedge && !beforeNote) {
      const wedgeElement = nn(dtype, 'wedge', null, '');
      XmlHelpers.createAttributes(wedgeElement, { type: 'stop', spread: '20' });
      addDirection = true;
    }
    if (startWedge && beforeNote) {
      const wedgeElement = nn(dtype, 'wedge', null, '');
      const wedgeType = startWedge.hairpinType === SmoStaffHairpin.types.CRESCENDO ?
        'crescendo' : 'diminuendo';
      XmlHelpers.createAttributes(wedgeElement, { type: wedgeType });
      addDirection = true;
    }
    if (addDirection) {
      measureElement.appendChild(directionElement);
    }
  }
  /**
   * /score-partwise/measure/note/lyric
   * @param noteElement 
   * @param smoState 
   */
  static lyric(noteElement: Element, smoState: SmoState) {
    const smoNote = smoState.note!;
    const nn = XmlHelpers.createTextElementChild;
    const lyrics = smoNote.getTrueLyrics() as SmoLyric[];
    lyrics.forEach((lyric) => {
      let syllabic = 'single';
      if (lyric.isHyphenated() === false && lyric.isDash() === false) {
        if (smoState.lyricState[lyric.verse] === 'begin') {
          syllabic = 'end';
        } // else stays single
      } else {
        if (lyric.isHyphenated()) {
          syllabic = smoState.lyricState[lyric.verse] === 'begin' ?
            'middle' : 'begin';
        } else if (lyric.isDash()) {
          syllabic = 'middle';
        }
      }
      smoState.lyricState[lyric.verse] = syllabic;
      const lyricElement = nn(noteElement, 'lyric', null, '');
      XmlHelpers.createAttribute(lyricElement, 'number', lyric.verse + 1);
      XmlHelpers.createAttribute(lyricElement, 'placement', 'below');
      XmlHelpers.createAttribute(lyricElement, 'default-y',
        -80 - 10 * lyric.verse);
      nn(lyricElement, 'syllabic', syllabic, '');
      nn(lyricElement, 'text', lyric.getText(), '');
    });
  }
  /**
   * /score-partwise/measure/note
   * @param measureElement 
   * @param smoState 
   */
  static note(measureElement: Element, smoState: SmoState) {
    const note: SmoNote = smoState.note!;
    const nn = XmlHelpers.createTextElementChild;
    let i = 0;
    for (i = 0; i < note.pitches.length; ++i) {
      let j = 0;
      const noteElement = nn(measureElement, 'note', null, '');
      const isChord = i > 0;
      if (isChord) {
        nn(noteElement, 'chord', null, '');
      } else {
      }
      if (note.isRest()) {
        const restElement = nn(noteElement, 'rest', null, '');
        const step = { letter: note.pitches[i].letter.toUpperCase() };
        nn(restElement, 'display-step', step, 'letter');
        nn(restElement, 'display-octave', { ...note.pitches[i] }, 'octave');
      } else {
        SmoToXml.pitch(note.pitches[i], noteElement);
      }
      const duration = note.tickCount;
      smoState.measureTicks += duration;
      nn(noteElement, 'duration', { duration }, 'duration');
      nn(noteElement, 'voice', { voice: smoState.voiceIndex }, 'voice');
      nn(noteElement, 'type', { type: XmlHelpers.closestStemType(note.tickCount) },
        'type');
      const dots = SmoMusic.smoTicksToVexDots(note.tickCount);
      for (j = 0; j < dots; ++j) {
        nn(noteElement, 'dot', null, '');
      }
      if (note.flagState === SmoNote.flagStates.up) {
        nn(noteElement, 'stem', { direction: 'up' }, 'direction');
      }
      if (note.flagState === SmoNote.flagStates.down) {
        nn(noteElement, 'stem', { direction: 'down' }, 'direction');
      }
      // stupid musicxml requires beam to be last.
      if (!isChord) {
        SmoToXml.beamNote(noteElement, smoState);
      }
      const notationsElement = noteElement.ownerDocument.createElement('notations');
      SmoToXml.tuplet(noteElement, notationsElement, smoState);
      if (!isChord) {
        SmoToXml.slur(notationsElement, smoState);
      }
      if (notationsElement.children.length) {
        noteElement.appendChild(notationsElement);
      }
      // stupid musicxml requires beam to be laster.
      if (!isChord) {
        SmoToXml.lyric(noteElement, smoState);
      }
    }
    smoState.voiceTickIndex += 1;
  }
  /**
   * /score-partwise/measure/attributes/key
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static key(attributesElement: Element, smoState: SmoState) {
    let fifths = 0;
    if (!smoState.measure) {
      return;
    }
    const measure = smoState.measure;
    if (smoState.keySignature && measure.keySignature === smoState.keySignature) {
      return; // no key change
    }
    const flats = SmoMusic.getFlatsInKeySignature(measure.keySignature);
    const nn = XmlHelpers.createTextElementChild;
    if (flats > 0) {
      fifths = -1 * flats;
    } else {
      fifths = SmoMusic.getSharpsInKeySignature(measure.keySignature);
    }
    const keyElement = nn(attributesElement, 'key', null, '');
    nn(keyElement, 'fifths', { fifths }, 'fifths');
    nn(keyElement, 'mode', { mode: 'major' }, 'major');
    smoState.keySignature = measure.keySignature;
  }
  /**
   * /score-partwise/part/measure/attributes/time
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static time(attributesElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const measure = smoState.measure as SmoMeasure;
    const currentTs = (smoState.timeSignature as TimeSignature) ?? null;
    if (currentTs !== null && TimeSignature.equal(currentTs, measure.timeSignature)) {
      return;
    }
    smoState.timeSignature = measure.timeSignature;
    const time = { beats: measure.timeSignature.actualBeats, beatType: measure.timeSignature.beatDuration };
    const timeElement = nn(attributesElement, 'time', null, '');
    nn(timeElement, 'beats', time, 'beats');
    nn(timeElement, 'beat-type', time, 'beatType');
    smoState.timeSignature = measure.timeSignature;
  }
  /**
   * /score-partwise/part/measure/attributes/clef
   * @param attributesElement 
   * @param smoState 
   * @returns 
   */
  static clef(attributesElement: Element, smoState: SmoState) {
    const measure = smoState.measure;
    if (!measure) {
      return;
    }
    if (smoState.clef && (smoState.clef === measure.clef && measure.measureNumber.measureIndex > 0)) {
      return; // no change
    }
    const nn = XmlHelpers.createTextElementChild;
    const xmlClef = SmoMusic.clefSigns[measure.clef];
    const clefElement = nn(attributesElement, 'clef', null, '');
    nn(clefElement, 'sign', xmlClef.sign, 'sign');
    if (typeof(xmlClef.line) !== 'undefined') {
      nn(clefElement, 'line', xmlClef, 'line');
    }
    if (typeof(xmlClef.octave) !== 'undefined') {
      nn(clefElement, 'clef-octave-change', xmlClef, 'octave');
    }
    smoState.clef = measure.clef;
  }
  /**
   * /score-partwise/part/measure/attributes
   * @param measureElement 
   * @param smoState 
   */
  static attributes(measureElement: Element, smoState: SmoState) {
    const nn = XmlHelpers.createTextElementChild;
    const attributesElement = measureElement.ownerDocument.createElement('attributes');
    if (smoState.divisions < 1) {
      nn(attributesElement, 'divisions', { divisions: 4096 }, 'divisions');
      smoState.divisions = 4096;
    }
    SmoToXml.key(attributesElement, smoState);
    SmoToXml.time(attributesElement, smoState);
    SmoToXml.clef(attributesElement, smoState);
    SmoToXml.transpose(attributesElement, smoState);
    if (attributesElement.children.length > 0) {
      // don't add an empty attributes element
      measureElement.appendChild(attributesElement);
    }
  }
  /**
   * /score-partwise/part/measure/attributes/transpose
   * @param attributesElement
   * @param smoState 
   * @returns 
   */
  static transpose(attributesElement: Element, smoState: SmoState) {
    const measure = smoState.measure;
    if (!measure) {
      return;
    }
    if (measure.transposeIndex !== smoState.transposeOffset) {
      smoState.transposeOffset = measure.transposeIndex;
      const nn = XmlHelpers.createTextElementChild;
      const xposeElement = nn(attributesElement, 'transpose', null, '');
      const offset = (measure.transposeIndex * -1).toString();;
      nn(xposeElement, 'chromatic', { offset: offset }, 'offset');
    }
  }
}
