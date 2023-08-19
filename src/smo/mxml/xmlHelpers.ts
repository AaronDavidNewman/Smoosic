// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoArticulation, SmoNoteModifierBase, SmoOrnament } from '../data/noteModifiers';
import { SmoMusic } from '../data/music';
import { SmoNote } from '../data/note';
import { Pitch, PitchLetter } from '../data/common';
import { SmoSelector } from '../xform/selections';
import { SmoBarline } from '../data/measureModifiers';
import { Vex } from 'vex5_smoosic';

const VF = Vex.Flow;

export interface XmlOrnamentData {
  ctor: string,
  params: Record<string, string>
}
export interface XmlSmoMap {
  xml: string, smo: string
}
export interface XmlDurationAlteration {
  noteCount: number, noteDuration: number
}
export interface XmlDuration {
  tickCount: number, duration: number, alteration: XmlDurationAlteration
}
/**
 * Store slur information when parsing xml
 */
export interface XmlSlurType {
  number: number, type: string, orientation: string, placement: string, controlX: number, controlY: number, selector: SmoSelector, yOffset: number
}
/**
 * Store tie  information when parsing xml
 */
export interface XmlTieType {
  number: number, type: string, orientation: string, selector: SmoSelector, pitchIndex: number
}
/**
 * Store tuplet information when parsing xml
 */
export interface XmlTupletData {
  number: number, type: string
}
export interface XmlEndingData {
  numbers: number[], type: string
}
export type LyricSyllabic = 'begin' | 'end' | 'middle' | 'single';
/**
 * Store lyric information when parsing xml
 */
export interface XmlLyricData {
  _text: string, verse: number | string, syllabic: LyricSyllabic
}
/**
 * Utilities for parsing and serialzing musicXML.
 * @category SmoToXml
 * */
export class XmlHelpers {
  /**
   * mxml note 'types', really s/b stem types.
   * For grace notes, we use the note type and not duration
   * to get the flag
   */
  static get noteTypesToSmoMap(): Record<string, number> {
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
  static readonly _ticksToNoteTypeMap: Record<number, string> = smoSerialize.reverseMap(XmlHelpers.noteTypesToSmoMap) as Record<number, string>;

  static get ticksToNoteTypeMap(): Record<number, string> {
    return XmlHelpers._ticksToNoteTypeMap;
  }
  // ### closestStemType
  // smo infers the stem type from the duration, but other applications don't
  static closestStemType(ticks: number) {
    const nticks = VF.durationToTicks(SmoMusic.vexStemType(ticks));
    return XmlHelpers.ticksToNoteTypeMap[nticks];
  }
  static get beamStates(): Record<string, number> {
    return {
      BEGIN: 1,
      END: 2,
      AUTO: 3
    };
  }
  static get ornamentXmlToSmoMap(): Record<string, XmlOrnamentData> {
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
      'inverted-mordent': { ctor: 'SmoOrnament', params: { ornament: SmoOrnament.ornaments.mordentInverted } },
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
    const piElement = doc.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-8"');
    rootElem.setAttribute('version', '3.1');
    doc.appendChild(rootElem);
    doc.insertBefore(piElement, rootElem);
    return doc;
  }
  // Parse an element whose child has a number in the textContent
  static getNumberFromElement(parent: Element, path: string, defaults: number): number {
    let rv = (typeof (defaults) === 'undefined' || defaults === null)
      ? 0 : defaults;
    const tval = XmlHelpers.getTextFromElement(parent, path, defaults);
    if (!tval) {
      return rv;
    }
    if (typeof (tval) === 'number') {
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
  static getTextFromElement(parent: Element, path: string, defaults: number | string | null): string {
    const rv = (typeof (defaults) === 'undefined' || defaults === null)
      ? 0 : defaults;
    const el = [...parent.getElementsByTagName(path)];
    if (!el.length) {
      return rv.toString();
    }
    return el[0].textContent as string;
  }
  static getNumberFromAttribute(node: Element, attribute: string, defaults: number) {
    const str = XmlHelpers.getTextFromAttribute(node, attribute, defaults.toString());
    const rv = parseInt(str, 10);
    if (isNaN(rv)) {
      return defaults;
    }
    return rv;
  }
  static getTextFromAttribute(node: Element, attribute: string, defaults: string): string {
    const rv = node.getAttribute(attribute);
    if (rv) {
      return rv;
    }
    return defaults;
  }
  // ### getChildrenFromPath
  // Like xpath, given ['foo', 'bar'] and parent element
  // 'moo' return any element /moo/foo/bar as an array of elements
  static getChildrenFromPath(parent: Element, pathAr: string[]): Element[] {
    let i = 0;
    let node = parent;
    const rv: Element[] = [];
    for (i = 0; i < pathAr.length; ++i) {
      const tag = pathAr[i];
      const nodes: Element[] = [...node.getElementsByTagName(tag)];
      if (nodes.length === 0) {
        return [];
      }
      if (i < pathAr.length - 1) {
        node = nodes[0];
      } else {
        nodes.forEach((nn: Element) => {
          rv.push(nn);
        });
      }
    }
    return rv;
  }
  static getStemType(noteElement: Element) {
    const tt = XmlHelpers.getTextFromElement(noteElement, 'stem', '');
    if (tt === 'up') {
      return SmoNote.flagStates.up;
    } else if (tt === 'down') {
      return SmoNote.flagStates.down;
    }
    return SmoNote.flagStates.auto;
  }
  static getEnding(barlineNode: Element): XmlEndingData | null {
    const endingNodes = [...barlineNode.getElementsByTagName('ending')];
    if (!endingNodes.length) {
      return null;
    }
    const attrs = XmlHelpers.nodeAttributes(endingNodes[0]);
    if (attrs.number && attrs.type) {
      return {
        numbers: attrs.number.split(',').map((x) => parseInt(x, 10)),
        type: attrs.type
      };
    }
    return null;
  }
  static getBarline(barlineNode: Element): number {
    const rptNode = [...barlineNode.getElementsByTagName('repeat')];
    if (rptNode.length) {
      const repeatattr = XmlHelpers.nodeAttributes(rptNode[0]);
      return repeatattr.direction === 'forward' ? SmoBarline.barlines.startRepeat : SmoBarline.barlines.endRepeat;
    }
    const styleText = XmlHelpers.getTextFromElement(barlineNode, 'bar-style', '');
    if (styleText.length) {
      const double = styleText.indexOf('-') >= 0;
      const heavy = styleText.indexOf('heavy') >= 0;
      const light = styleText.indexOf('light') >= 0;
      if (double && heavy && light) {
        return SmoBarline.barlines.endBar;
      }
      if (double) {
        return SmoBarline.barlines.doubleBar;
      }
    }
    return SmoBarline.barlines.singleBar;
  }
  
  // ### assignDefaults
  // Map SMO layout data from xml layout data (default node)
  static assignDefaults(node: Element, defObj: any, parameters: XmlSmoMap[]) {
    parameters.forEach((param) => {
      if (!isNaN(parseInt(defObj[param.smo], 10))) {
        const smoParam = param.smo;
        const xmlParam = param.xml;
        defObj[smoParam] = XmlHelpers.getNumberFromElement(node, xmlParam, defObj[smoParam]);
      }
    });
  }
  // ### nodeAttributes
  // turn the attributes of an element into a JS hash
  static nodeAttributes(node: Element):  Record<string, string> {
    const rv: Record<string, string> = {};
    node.getAttributeNames().forEach((attr) => {
      const aval: string | null = node.getAttribute(attr);
      if (aval) {
        rv[attr] = aval;
      }
    });
    return rv;
  }
  // Some measures have staff ID, some don't.
  // convert xml 1 index to array 0 index
  static getStaffId(node: Element) {
    const staff = [...node.getElementsByTagName('staff')];
    if (staff.length && staff[0].textContent) {
      return parseInt(staff[0].textContent, 10) - 1;
    }
    return 0;
  }
  static noteBeamState(noteNode: Element) {
    const beamNodes = [...noteNode.getElementsByTagName('beam')];
    if (!beamNodes.length) {
      return XmlHelpers.beamStates.AUTO;
    }
    const beamText = beamNodes[0].textContent;
    if (beamText === 'begin') {
      return XmlHelpers.beamStates.BEGIN;
    } else if (beamText === 'end') {
      return XmlHelpers.beamStates.END;
    }
    return XmlHelpers.beamStates.AUTO;
  }
  // same with notes and voices.  same convert
  static getVoiceId(node: Element) {
    const voice = [...node.getElementsByTagName('voice')];
    if (voice.length && voice[0].textContent) {
      return parseInt(voice[0].textContent, 10) - 1;
    }
    return 0;
  }
  static smoPitchFromNote(noteNode: Element, defaultPitch: Pitch): Pitch {
    const accidentals = ['bb', 'b', 'n', '#', '##'];
    const letter: PitchLetter = XmlHelpers.getTextFromElement(noteNode, 'step', defaultPitch.letter).toLowerCase() as PitchLetter;
    const octave = XmlHelpers.getNumberFromElement(noteNode, 'octave', defaultPitch.octave);
    const xaccidental = XmlHelpers.getNumberFromElement(noteNode, 'alter', 0);
    return { letter, accidental: accidentals[xaccidental + 2], octave };
  }
  static isGrace(noteNode: Element) {
    const path = XmlHelpers.getChildrenFromPath(noteNode, ['grace']);
    return path?.length > 0;
  }
  static isSystemBreak(measureNode: Element) {
    const printNodes = measureNode.getElementsByTagName('print');
    if (printNodes.length) {
      const attrs = XmlHelpers.nodeAttributes(printNodes[0]);
      if (typeof (attrs['new-system']) !== 'undefined') {
        return attrs['new-system'] === 'yes';
      }
    }
    return false;
  }
  // ### durationFromType
  // Get the SMO tick duration of a note, based on the XML type element (quarter, etc)
  static durationFromType(noteNode: Element, def: number): number {
    const typeNodes = [...noteNode.getElementsByTagName('type')];
    if (typeNodes.length) {
      const txt = typeNodes[0].textContent;
      if (txt && XmlHelpers.noteTypesToSmoMap[txt]) {
        return XmlHelpers.noteTypesToSmoMap[txt];
      }
    }
    return def;
  }
  // ### durationFromNode
  // the true duration value, used to handle forward/backward
  static durationFromNode(noteNode: Element, def: number) {
    const durationNodes = [...noteNode.getElementsByTagName('duration')];
    if (durationNodes.length && durationNodes[0].textContent) {
      const duration = parseInt(durationNodes[0].textContent, 10);
      return duration;
    }
    return def;
  }
  static ticksFromDuration(noteNode: Element, divisions: number, def: number): XmlDuration {
    const rv: XmlDuration = { tickCount: def, duration: def / divisions, alteration: { noteCount: 1, noteDuration: 1 } };
    const durationNodes = [...noteNode.getElementsByTagName('duration')];
    const timeAlteration = XmlHelpers.getTimeAlteration(noteNode);
    // different ways to declare note duration - from type is the graphical
    // type, SMO uses ticks for everything
    if (durationNodes.length && durationNodes[0].textContent) {
      rv.duration = parseInt(durationNodes[0].textContent, 10);
      rv.tickCount = 4096 * (rv.duration / divisions);
    } else {
      rv.tickCount = XmlHelpers.durationFromType(noteNode, def);
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
 
  static getTieData(noteNode: Element, selector: SmoSelector, pitchIndex: number): XmlTieType[] {
    const rv: XmlTieType[] = [];
    let number = 0;
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('tied')];
      slurNodes.forEach((slurNode) => {
        const orientation = XmlHelpers.getTextFromAttribute(slurNode, 'orientation', 'auto');
        const type = slurNode.getAttribute('type') as string;
        number = XmlHelpers.getNumberFromAttribute(slurNode, 'number', 1);
        rv.push({ number, type, orientation, selector, pitchIndex });
      });
    });
    return rv;
  }
  static getSlurData(noteNode: Element, selector: SmoSelector): XmlSlurType[] {
    const rv: XmlSlurType[] = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('slur')];
      slurNodes.forEach((slurNode) => {
        const number = parseInt(slurNode.getAttribute('number') as string, 10);
        const type = slurNode.getAttribute('type') as string;
        const orientation = XmlHelpers.getTextFromAttribute(slurNode, 'orienation', 'auto');
        const placement = XmlHelpers.getTextFromAttribute(slurNode, 'placement', 'auto');
        const controlX = XmlHelpers.getNumberFromAttribute(slurNode, 'bezier-x', 0);
        // Y coordinates are reversed from music XML to SVG, hence the -1
        const controlY = XmlHelpers.getNumberFromAttribute(slurNode, 'bezier-y', 15) * -1;
        const slurInfo = { number, type, orientation, placement, controlX, controlY, selector, invert: false, yOffset: 0 };
        rv.push(slurInfo);
      });
    });
    return rv;
  }
  static getCrescendoData(directionElement: Element) {
    let rv = {};
    const nNodes = XmlHelpers.getChildrenFromPath(directionElement,
      ['direction-type', 'wedge']);
    nNodes.forEach((nNode) => {
      rv = { type: nNode.getAttribute('type') };
    });
    return rv;
  }
  static getTupletData(noteNode: Element): XmlTupletData[] {
    const rv: XmlTupletData[] = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      const slurNodes = [...nNode.getElementsByTagName('tuplet')];
      slurNodes.forEach((slurNode) => {
        const number = parseInt(slurNode.getAttribute('number') as string, 10);
        const type = slurNode.getAttribute('type') as string;
        rv.push({ number, type });
      });
    });
    return rv;
  }
  static articulationsAndOrnaments(noteNode: Element): SmoNoteModifierBase[] {
    const rv: SmoNoteModifierBase[] = [];
    const nNodes = [...noteNode.getElementsByTagName('notations')];
    nNodes.forEach((nNode) => {
      ['articulations', 'ornaments'].forEach((typ) => {
        const articulations = [...nNode.getElementsByTagName(typ)];
        articulations.forEach((articulation) => {
          Object.keys(XmlHelpers.ornamentXmlToSmoMap).forEach((key) => {
            if (articulation.getElementsByTagName(key).length) {
              const ctor = eval('globalThis.Smo.' + XmlHelpers.ornamentXmlToSmoMap[key].ctor);
              rv.push(new ctor(XmlHelpers.ornamentXmlToSmoMap[key].params));
            }
          });
        });
      });
    });
    return rv;
  }
  static lyrics(noteNode: Element): XmlLyricData[] {
    const rv: XmlLyricData[] = [];
    const nNodes = [...noteNode.getElementsByTagName('lyric')];
    nNodes.forEach((nNode) => {
      let verse = nNode.getAttribute('number');
      const text = XmlHelpers.getTextFromElement(nNode, 'text', '_');
      const name = nNode.getAttribute('name') as string;
      const syllabic = XmlHelpers.getTextFromElement(nNode, 'syllabic', 'end') as LyricSyllabic;
      // Per xml spec, verse can be specified by a string (name), as in 'chorus'
      if (!verse) {
        verse = name;
      }
      const obj: XmlLyricData = { _text: text, verse, syllabic };
      rv.push(obj);
    });
    return rv;
  }

  static getTimeAlteration(noteNode: Element): XmlDurationAlteration | null {
    const timeNodes = XmlHelpers.getChildrenFromPath(noteNode, ['time-modification']);
    if (timeNodes.length) {
      return {
        noteCount: XmlHelpers.getNumberFromElement(timeNodes[0], 'actual-notes', 1),
        noteDuration: XmlHelpers.getNumberFromElement(timeNodes[0], 'normal-notes', 1)
      };
    }
    return null;
  }
  // ### createTextElementChild
  // In:  ../parent
  // Out: ../parent/elementName/obj[field]
  // returns elementName element.  If obj is null, just creates and returns child
  // if obj is a string, it uses it as the text value
  static createTextElementChild(parentElement: Element, elementName: string, obj: any, field: string): Element {
    const el = parentElement.ownerDocument.createElement(elementName);
    if (obj) {
      if (typeof (obj) === 'string') {
        el.textContent = obj;
      } else {
        el.textContent = obj[field];
      }
    }
    parentElement.appendChild(el);
    return el;
  }
  static createAttributes(element: Element, obj: any) {
    Object.keys(obj).forEach((key) => {
      const attr = element.ownerDocument.createAttribute(key);
      attr.value = obj[key];
      element.setAttributeNode(attr);
    });
  }
  static createAttribute(element: Element, name: string, value: any) {
    const obj: any = {};
    obj[name] = value;
    XmlHelpers.createAttributes(element, obj);
  }
}
