/**
 * definitions shared by all SMO types
 * @module /smo/data/common
 */
/**
 * Same as attrs object in Vex objects.
 * @param id - unique identifier, can be used in DOM elements
 * @param type - a little bit redundate with `ctor` in `SmoObjectParams`
 */
export interface SmoAttrs {
    id: string,
    type: string
}
export const smoXmlNs = 'https://aarondavidnewman.github.io/Smoosic';

// export abstract class SmoXmlSerializable {
//   abstract serializeXml(namespace: string, parentElement: Element, tagName: string): Element
// }
export interface SmoXmlSerializable {
  serializeXml: (namespace: string, parentElement: Element, tag: string) => Element;
  ctor: string
}
export function createXmlAttributes(element: Element, obj: any) {
  Object.keys(obj).forEach((key) => {
    const attr = element.ownerDocument.createAttribute(key);
    attr.value = obj[key];
    element.setAttributeNode(attr);
  });
}
export function createXmlAttribute(element: Element, name: string, value: any) {
  const obj: any = {};
  obj[name] = value;
  createXmlAttributes(element, obj);
}

var nextId = 32768;
export const getId = () => `smo` + (nextId++).toString();
/**
 * All note, measure, staff, and score objects have
 * a serialize method and are deserializable with constructor `ctor`
 */
export interface SmoObjectParams {
    ctor: string,
    attrs?: SmoAttrs
}

/**
 * Note duration.  The same abstraction used by vex, except here denominator is
 * always 1.  remainder is used to reconstruct non-tuplets from tuplets.
 * @param numerator - duration, 4096 is 1/4 note
 * @param denominator - always 1 for SMO objects
 * @param remainder - used for tuplets whose duration doesn't divide evenly
 */
export interface Ticks {
    numerator: number,
    denominator: number,
    remainder: number
}

/**
 * constraint for SmoPitch.letter value, in lower case
 */
export type PitchLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export function IsPitchLetter(letter: PitchLetter | string): letter is PitchLetter {
    return letter.length === 1 && letter[0] >= 'a' && letter[0] <= 'g';
}

/**
 * PitchKey is a SmoPitch, without the octave
 * @param letter - letter note
 * @param accidental - an accidental or microtone
 */
export interface PitchKey {
    letter: PitchLetter,
    accidental: string
}
/**
 * Represents a single pitch in Smo object model.
 * @param letter - letter note
 * @param accidental - an accidental or microtone
 * @param octave - standard octave
 * @param cautionary? - can be used for courtesy accidental
 */
export interface Pitch {
    letter: PitchLetter,
    accidental: string,
    octave: number,
    cautionary?: boolean,
    forced?: boolean,
    role?: string
}

/**
 * A tuple indicating measure location in the score:
 * @param measureIndex - the actual offset from the first measure
 * @param localIndex - the index as shown to the user, considers renumbering
 * @param sytemIndex - which bar (column) of a system this measure is
 * @param staffId - which staff (row) of a system this measure is
 */
export interface MeasureNumber {
    measureIndex: number,
    localIndex: number,
    systemIndex: number,
    staffId: number
}
/**
 * musical artifacts can contain temporary svg information for
 * mapping the UI.
 */
export class SvgPoint {
    x: number;
    y: number;
    static get default() {
        return { x: 0, y: 0 };
    }
    constructor() {
        this.x = 0;
        this.y = 0;
    }
}
/**
 * musical artifacts can contain temporary svg information for
 * mapping the UI.
 */
 export class SvgBox {
    x: number;
    y: number;
    width: number;
    height: number;
    static get default(): SvgBox {
        return { x: 0, y: 0, width: -1, height: -1 };
    }
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = -1;
        this.height = -1;
    }
}
/**
 * kind of a pointless class...
 */
export interface SvgDimensions {
    width: number,
    height: number
}
/**
 * A `Transposable` is an abstraction of a note.
 * Can be passed into methods that transform pitches for both
 * grace notes and normal notes.
 * @param pitches - SMO pitch type
 * @param noteType - same convention as VexFlow, 'n' for note, 'r' for rest
 * @param renderId - ID for the containing SVG group, used to map UI elements
 * @param renderedBox - bounding box in client coordinates
 * @param logicalBox - bounding box in SVG coordinates
 */
export interface Transposable {
    pitches: Pitch[],
    noteType: string,
    renderId: string | null,
    logicalBox: SvgBox | null
}


/**
 * All note, measure etc. modifiers have these attributes.  The SVG info
 * is for the tracker to track the artifacts in the UI (mouse events, etc)
 * @param ctor - constructor name for deserialize
 * @param logicalBox - bounding box in SVG coordinates
 * @param attr - unique ID, simlar to vex object attrs field
 */
export interface SmoModifierBase {
    ctor: string,
    logicalBox: SvgBox | null,
    attrs: SmoAttrs,
    serialize: () => any;
}

export function serializeXmlModifierArray(object: SmoXmlSerializable[], namespace: string, parentElement: Element, tag: string) {
  if (object.length === 0) {
    return parentElement;
  }
  const arEl = parentElement.ownerDocument.createElementNS(namespace, `${tag}-array`);
  parentElement.appendChild(arEl);
  createXmlAttribute(arEl, 'container', 'array');
  createXmlAttribute(arEl, 'name', `${tag}`);
  for (var j = 0; j < object.length; ++j) {
    const instEl = parentElement.ownerDocument.createElementNS(namespace, `${tag}-instance`);
    arEl.appendChild(instEl);
    object[j].serializeXml(namespace, instEl, object[j].ctor);
  }
  return arEl;
}

/**
 * Renderable is just a thing that has a bounding box
 */
export interface Renderable {
    logicalBox: SvgBox | null | undefined
}
/**
 * Restriction from string to supported clefs
 */
export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    | 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';

export var Clefs: Clef[] = ['treble' , 'bass' , 'tenor' , 'alto' , 'soprano' , 'percussion'
, 'mezzo-soprano' , 'baritone-c' , 'baritone-f' , 'subbass' , 'french'];

export function IsClef(clef: Clef | string): clef is Clef {
  return Clefs.findIndex((x) => clef === x) >= 0;
}

/**
 * Most event handling in SMO is an 'any' from jquery, but
 * key events are sometimes narrowed to the common browser key event
 */
export interface KeyEvent {
  type: string,
  shiftKey: boolean,
  ctrlKey: boolean,
  altKey: boolean,
  key: string,
  keyCode: number | string,
  code: string,
  event: string | null
}
export function defaultKeyEvent(): KeyEvent {
  const rv = {
    type: 'keydown', shiftKey: false, ctrlKey: false, altKey: false, key: '',
    keyCode: '', code: '', event: null
  };
  return JSON.parse(JSON.stringify(rv));
}
export function keyEventMatch(ev1: KeyEvent, ev2: KeyEvent): boolean {
  return ev1.event === ev2.event && ev1.key === ev2.key &&
  ev1.ctrlKey === ev2.ctrlKey &&
  ev1.altKey === ev2.altKey && ev1.shiftKey === ev2.shiftKey
}

export interface TickAccidental {
  duration: number,
  pitch: Pitch
}

/**
 * Used to create {@link MeasureTickmaps}
 */
export interface AccidentalArray {
  duration: string | number,
  pitches: Record<string, TickAccidental>
}

export interface AccidentalDisplay {
  symbol: string,
  courtesy: boolean,
  forced: boolean
}
export const reverseStaticMaps: Record<string, Record<string, string>> = {};

export function reverseStaticMap(name: string, o: Record<string, string>) {
  if (!reverseStaticMaps[name]) {
    const rmap: Record<string, string> = {};
    const keys = Object.keys(o);    
    keys.forEach((key) => {
      const val = o[key];
      rmap[val] = key;
    });
    reverseStaticMaps[name] = rmap;
  }
  return reverseStaticMaps[name];
}