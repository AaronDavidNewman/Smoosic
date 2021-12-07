// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { Pitch } from '../data/common';
import { SmoNote } from '../data/note';
import { SmoMusic } from '../data/music';
import { SmoMeasure } from '../data/measure';
import { SmoSystemStaff } from '../data/systemStaff';
import { SmoScore } from '../data/score';
import { TimeSignature } from '../data/measureModifiers';
import { SmoStaffHairpin, SmoSlur } from '../data/staffModifiers';
import { SmoLyric } from '../data/noteModifiers';
import { SmoSelector } from '../xform/selections';

import { mxmlHelpers } from './xmlHelpers';
import { xmlToSmo } from './xmlToSmo';
/**
 * Convert {@link SmoScore} object into a music XML serialization
 * @category SmoToXml
 */
export class SmoToXml {
  static get beamStates() {
    return {
      none: 1, start: 2, continue: 3, stop: 4
    };
  }
  static convert(score: SmoScore) {
    const nn = mxmlHelpers.createTextElementChild;
    const dom = mxmlHelpers.createRootElement();
    const root = dom.children[0];
    const work = nn(root, 'work', null, '');
    nn(work, 'work-title', score.scoreInfo, 'title');
    const identification = nn(root, 'identification', null, '');
    const creator = nn(identification, 'creator', score.scoreInfo, 'composer');
    mxmlHelpers.createAttributes(creator, { type: 'composer' });
    const encoding = nn(identification, 'encoding', null, '');
    nn(encoding, 'software', { software: 'Some pre-release version of Smoosic' }, 'software');
    nn(encoding, 'encoding-date', { date: new Date().toDateString() }, 'date');
    const defaults = nn(root, 'defaults', null, '');
    const scaling = nn(root, 'scaling', null, '');
    // reverse this:
    // scoreDefaults.layout.svgScale =  (scale * 42 / 40) / xmlToSmo.mmPerPixel;
    const mm = xmlToSmo.mmPerPixel * 42 * score.layoutManager!.getGlobalLayout().svgScale;
    nn(scaling, 'millimeters', { mm }, 'mm');
    nn(scaling, 'tenths', { tenths: 40 }, 'tenths');
    const pageLayout = nn(defaults, 'page-layout', null, '');
    xmlToSmo.pageLayoutMap.forEach((map) => {
      nn(pageLayout, map.xml, score.layoutManager, map.smo);
    });
    const pageMargins = nn(pageLayout, 'page-margins', null, '');
    xmlToSmo.pageMarginMap.forEach((map) => {
      nn(pageMargins, map.xml, score.layoutManager!.pageLayouts[0], map.smo);
    });
    const partList =  nn(root, 'part-list', null, '');
    score.staves.forEach((staff) => {
      const id = 'P' + staff.staffId;
      const scorePart = nn(partList, 'score-part', null, '');
      mxmlHelpers.createAttributes(scorePart, { id });
      nn(scorePart, 'part-name', { name: staff.measureInstrumentMap[0].instrumentName }, 'name');
    });
    const smoState: any = {};
    score.staves.forEach((staff) => {
      const part = nn(root, 'part', null, '');
      const id = 'P' + staff.staffId;
      mxmlHelpers.createAttributes(part, { id });
      smoState.measureNumber = 1;
      smoState.tickCount = 0;
      smoState.staff = staff;
      smoState.slurs = [];
      smoState.lyricState = {};
      smoState.slurNumber = 1;
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
  // ### measure
  // .../part/measure
  static measure(measureElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
    const measure = smoState.measure;
    if (smoState.measureNumber === 1 && measure.isPickup()) {
      smoState.measureNumber = 0;
    }
    if (smoState.measure.getForceSystemBreak()) {
      const printElement = nn(measureElement, 'print', null, '');
      mxmlHelpers.createAttributes(printElement, { 'new-system': 'yes' });
    }
    mxmlHelpers.createAttributes(measureElement, { number: smoState.measureNumber });
    SmoToXml.attributes(measureElement, smoState);
    smoState.voiceIndex = 1;
    smoState.beamState = SmoToXml.beamStates.none;
    smoState.beamTicks = 0;
    (measure as SmoMeasure).voices.forEach((voice) => {
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
  }

  // ### slur
  // /score-partwise/part/measure/note/notations/slur
  static slur(notationsElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
    const staff: SmoSystemStaff = smoState.staff as SmoSystemStaff;
    const measure = smoState.measure as SmoMeasure;
    const selector: SmoSelector = {
      staff: staff.staffId,
      measure: measure.measureNumber.measureIndex,
      voice: smoState.voiceIndex - 1,
      tick: smoState.voiceTickIndex,
      pitches: []
    };
    const starts = staff.getSlursStartingAt(selector) as SmoSlur[];
    const ends = staff.getSlursEndingAt(selector) as SmoSlur[];
    const remove: any[] = [];
    const newSlurs: any[] = [];
    ends.forEach((slur) => {
      const match = smoState.slurs.find((ss: any) => SmoSelector.eq(ss.startSelector, slur.startSelector) &&
        SmoSelector.eq(ss.endSelector, slur.endSelector));
      if (match) {
        remove.push(match);
        const slurElement = nn(notationsElement, 'slur', null, '');
        mxmlHelpers.createAttributes(slurElement, { number: match.number, type: 'stop' });
      }
    });
    smoState.slurs.forEach((slur: any) => {
      if (remove.findIndex((rr) => rr.number === slur.number) <= 0) {
        newSlurs.push(slur);
      }
    });
    smoState.slurs = newSlurs;
    smoState.slurNumber = 1;
    if (smoState.slurs.length > 0) {
      // set next slur number to 1+ highest slur number in the 'waiting to resolve' list
      smoState.slurNumber = smoState.slurs.map((slur: any) => slur.number).reduce((a: number, b: number) => a > b ? a : b) + 1;
    }
    starts.forEach((slur) => {
      smoState.slurs.push({ startSelector: slur.startSelector,
        endSelector: slur.endSelector,
        number: smoState.slurNumber });
      const slurElement = nn(notationsElement, 'slur', null, '');
      mxmlHelpers.createAttributes(slurElement, { number: smoState.slurNumber, type: 'start' });
      smoState.slurNumber += 1;
    });
  }
  // ### /score-partwise/measure/note/time-modification
  // ### /score-partwise/measure/note/tuplet
  static tuplet(noteElement: Element, notationsElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
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
      mxmlHelpers.createAttributes(tupletElement, {
        number: 1, type: 'start'
      });
    } else if (tuplet.getIndexOfNote(note) === tuplet.notes.length - 1) {
      const tupletElement = nn(notationsElement, 'tuplet', null, '');
      mxmlHelpers.createAttributes(tupletElement, {
        number: 1, type: 'stop'
      });
    }
  }
  // ### /score-partwise/measure/note/pitch
  static pitch(pitch: Pitch, noteElement: Element) {
    const nn = mxmlHelpers.createTextElementChild;
    const accidentalOffset = ['bb', 'b', 'n', '#', '##'];
    const adjust = accidentalOffset.indexOf(pitch.accidental) - 2;
    const pitchElement = nn(noteElement, 'pitch', null, '');
    nn(pitchElement, 'step', { letter: pitch.letter.toUpperCase() }, 'letter');
    nn(pitchElement, 'octave', pitch, 'octave');
    nn(pitchElement, 'adjust', { adjust }, 'adjust');
  }
  // ### /score-partwise/measure/beam
  static beamNote(noteElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
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
      mxmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.continue;
    } else if (toBeam === SmoToXml.beamStates.continue) {
      const beamElement = nn(noteElement, 'beam', { type: 'continue' }, 'type');
      mxmlHelpers.createAttributes(beamElement, { number: 1 });
    } else if ((toBeam === SmoToXml.beamStates.stop) ||
      (toBeam === SmoToXml.beamStates.none && smoState.beamState !== SmoToXml.beamStates.none)) {
      const beamElement = nn(noteElement, 'beam', { type: 'end' }, 'type');
      mxmlHelpers.createAttributes(beamElement, { number: 1 });
      smoState.beamState = SmoToXml.beamStates.none;
    }
  }
  // ### /score-partwise/measure/direction/direction-type
  static direction(measureElement: Element, smoState: any, beforeNote: boolean) {
    let addDirection = false;
    const nn = mxmlHelpers.createTextElementChild;
    const directionElement = measureElement.ownerDocument.createElement('direction');
    const dtype  = nn(directionElement, 'direction-type', null, '');
    const staff = smoState.staff as SmoSystemStaff;
    const measure = smoState.measure;
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
    const endWedge =  staff.modifiers.find((mod) =>
      SmoSelector.sameNote(mod.endSelector, selector) &&
      (mod.attrs.type === 'SmoStaffHairpin')) as SmoStaffHairpin;
    if (endWedge && !beforeNote) {
      const wedgeElement = nn(dtype, 'wedge', null, '');
      mxmlHelpers.createAttributes(wedgeElement, { type: 'stop', spread: '20' });
      addDirection = true;
    }
    if (startWedge && beforeNote) {
      const wedgeElement = nn(dtype, 'wedge', null, '');
      const wedgeType = startWedge.hairpinType === SmoStaffHairpin.types.CRESCENDO ?
        'crescendo' : 'diminuendo';
      mxmlHelpers.createAttributes(wedgeElement, { type: wedgeType });
      addDirection = true;
    }
    if (addDirection) {
      measureElement.appendChild(directionElement);
    }
  }
  // ### /score-partwise/measure/note/lyric
  static lyric(noteElement: Element, smoState: any) {
    const smoNote = smoState.note;
    const nn = mxmlHelpers.createTextElementChild;
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
      mxmlHelpers.createAttribute(lyricElement, 'number', lyric.verse + 1);
      mxmlHelpers.createAttribute(lyricElement, 'placement', 'below');
      mxmlHelpers.createAttribute(lyricElement, 'default-y',
        -80 - 10 * lyric.verse);
      nn(lyricElement, 'syllabic', syllabic, '');
      nn(lyricElement, 'text', lyric.getText(), '');
    });
  }
  // ### /score-partwise/measure/note
  static note(measureElement: Element, smoState: any) {
    const note = smoState.note;
    const nn = mxmlHelpers.createTextElementChild;
    let i = 0;
    for (i = 0; i < note.pitches.length; ++i) {
      const noteElement = nn(measureElement, 'note', null, '');
      if (i > 0) {
        nn(noteElement, 'chord', null, '');
      } else {
        SmoToXml.beamNote(noteElement, smoState);
        SmoToXml.lyric(noteElement, smoState);
        nn(noteElement, 'type', { type: mxmlHelpers.closestStemType(note.tickCount) },
          'type');
        if (note.flagState === SmoNote.flagStates.up) {
          nn(noteElement, 'stem', { direction: 'up' }, 'direction');
        }
        if (note.flagState === SmoNote.flagStates.down) {
          nn(noteElement, 'stem', { direction: 'down' }, 'direction');
        }
      }
      if (note.isRest()) {
        nn(noteElement, 'rest', null, '');
      }
      nn(noteElement, 'voice', { voice: smoState.voiceIndex }, 'voice');
      SmoToXml.pitch(note.pitches[i], noteElement);
      const duration = note.tickCount;
      smoState.measureTicks += duration;
      nn(noteElement, 'duration', { duration }, 'duration');
      const notationsElement = noteElement.ownerDocument.createElement('notations');
      SmoToXml.tuplet(noteElement, notationsElement, smoState);
      SmoToXml.slur(notationsElement, smoState);
      if (notationsElement.children.length) {
        noteElement.appendChild(notationsElement);
      }
    }
    smoState.voiceTickIndex += 1;
  }
  // ### /score-partwise/measure/attributes/key
  static key(attributesElement: Element, smoState: any) {
    let fifths = 0;
    const measure = smoState.measure;
    if (smoState.keySignature && measure.keySignature === smoState.keySignature) {
      return; // no key change
    }
    const flats = SmoMusic.getFlatsInKeySignature(measure.keySignature);
    const nn = mxmlHelpers.createTextElementChild;
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
  // ### time
  // score-partwise/part/measure/attributes/time
  static time(attributesElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
    const measure = smoState.measure as SmoMeasure;
    const currentTs = (smoState.timeSignature as TimeSignature) ?? null;
    if (currentTs !== null && TimeSignature.equal(currentTs, measure.timeSignature) === false) {
      return;
    }
    smoState.timeSignature = measure.timeSignature;
    const time = { beats: measure.timeSignature.actualBeats, beatType: measure.timeSignature.beatDuration };
    const timeElement = nn(attributesElement, 'time', null, '');
    nn(timeElement, 'beats', time, 'beats');
    nn(timeElement, 'beat-type', time, 'beatType');
    smoState.timeSignature = measure.timeSignature;
  }
  // ### clef
  // /score-partwise/part/measure/attributes/clef
  static clef(attributesElement: Element, smoState: any) {
    const measure = smoState.measure;
    if (smoState.clef && smoState.clef === measure.clef) {
      return; // no change
    }
    const nn = mxmlHelpers.createTextElementChild;
    const clef: any = {};
    if (measure.clef === 'treble') {
      clef.sign = 'G';
      clef.line = 2;
    } else if (measure.clef === 'bass') {
      clef.sign = 'F';
      clef.line = 4;
    } else {
      clef.sign = 'C';
      if (measure.clef === 'tenor') {
        clef.sign = 3;
      } else {
        clef.sign = 4; // todo: other clefs
      }
    }
    const clefElement = nn(attributesElement, 'clef', null, '');
    nn(clefElement, 'sign', clef, 'sign');
    nn(clefElement, 'line', clef, 'line');
    smoState.clef = measure.clef;
  }
  static attributes(measureElement: Element, smoState: any) {
    const nn = mxmlHelpers.createTextElementChild;
    const attributesElement = measureElement.ownerDocument.createElement('attributes');
    if (!smoState.divisions) {
      nn(attributesElement, 'divisions', { divisions: 4096 }, 'divisions');
      smoState.divisions = 4096;
    }
    SmoToXml.key(attributesElement, smoState);
    SmoToXml.time(attributesElement, smoState);
    SmoToXml.clef(attributesElement, smoState);
    if (attributesElement.children.length > 0) {
      // don't add an empty attributes element
      measureElement.appendChild(attributesElement);
    }
  }
}
