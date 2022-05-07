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

/**
 * All note, measure, staff, and score objects have
 * a serialize method and are deserializable with constructor `ctor`
 */
export interface SmoObjectParams {
    ctor: string
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
    role?: string
}

/**
 * Basic text font information.
 */
export interface FontInfo {
    size: number;
    weight: string;
    family: string;
    style?: string;
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
    renderedBox: SvgBox | null,
    logicalBox: SvgBox | null
}

/**
 * All note, measure etc. modifiers have these attributes.  The SVG info
 * is for the tracker to track the artifacts in the UI (mouse events, etc)
 * @param ctor - constructor name for deserialize
 * @param renderedBox - bounding box in client coordinates
 * @param logicalBox - bounding box in SVG coordinates
 * @param attr - unique ID, simlar to vex object attrs field
 */
export interface SmoModifierBase {
    ctor: string,
    renderedBox: SvgBox | null,
    logicalBox: SvgBox | null,
    attrs: SmoAttrs
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
  keyCode: string,
  code: string,
  event: string | null
}


