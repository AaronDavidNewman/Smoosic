export interface SmoAttrs {
    id: string,
    type: string
}

export interface SmoObjectParams {
    ctor: string
}

export interface Ticks {
    numerator: number,
    denominator: number,
    remainder: number
}

export type PitchLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export function IsPitchLetter(letter: PitchLetter | string): letter is PitchLetter {
    return letter.length === 1 && letter[0] >= 'a' && letter[0] <= 'g';
}

export interface PitchKey {
    letter: PitchLetter,
    accidental: string
}
export interface Pitch {
    letter: PitchLetter,
    accidental: string,
    octave: number,
    cautionary?: boolean
}


export interface FontInfo {
    size: number;
    weight: string;
    family: string;
    style?: string;
}

export interface MeasureNumber {
    measureIndex: number,
    localIndex: number,
    systemIndex: number,
    staffId: number
}
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
export interface SvgDimensions {
    width: number,
    height: number
}
export interface Transposable {
    pitches: Pitch[],
    noteType: string,
    renderId: string | null,
    renderedBox: SvgBox | null,
    logicalBox: SvgBox | null
}

export interface SmoObjectParams {
    ctor: string
}

export interface SmoModifierBase {
    ctor: string,
    renderedBox: SvgBox | null,
    logicalBox: SvgBox | null,
    attrs: SmoAttrs
}

export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    | 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';

export var Clefs: Clef[] = ['treble' , 'bass' , 'tenor' , 'alto' , 'soprano' , 'percussion'
, 'mezzo-soprano' , 'baritone-c' , 'baritone-f' , 'subbass' , 'french'];

export function IsClef(clef: Clef | string): clef is Clef {
  return Clefs.findIndex((x) => clef === x) >= 0;
}

export type SmoMode = 'library' | 'application' | 'translate';
export type SmoLoadType = 'local' | 'remote' | 'query';
export var SmoLoadTypes: SmoLoadType[] = ['local', 'remote', 'query'];
export type ConfigurationOption = 'mode' | 'smoPath' | 'language' | 'scoreLoadOrder' | 'scoreLoadJson' | 'smoDomContainer' |
  'vexDomContainer' | 'ribbon' | 'keyCommands' | 'menus' | 'title' | 'libraryUrl' | 
  'languageDir' | 'demonPollTime' | 'idleRedrawTime';
export var ConfigurationOptions: ConfigurationOption[] = ['mode', 'smoPath', 'language', 'scoreLoadOrder', 'scoreLoadJson', 'smoDomContainer',
  'vexDomContainer', 'ribbon', 'keyCommands', 'menus', 'title', 'libraryUrl', 
  'languageDir', 'demonPollTime', 'idleRedrawTime'];
/**
 * Configures smoosic library or application
 * @param smoPath - path to smoosic.js from html
 * @param language - startup language
 * @param scoreLoadOrder - default is ['query', 'local', 'library'],
 * @param scoreLoadJson - the library score JSON
 * @param smoDomContainer - the id of the parent element of application UI
 * @param vexDomContainer - the svg container
 * @param ribbon - launch the UI ribbon
 * @param keyCommands - start the key commands UI
 * @param menus - create the menu manager
 * @param title - the browser title
 * @param libraryUrl - loader URL for Smo libraries
 * @param languageDir - ltr or rtl
 * @param demonPollTime - how often we poll the score to see if it's changed
 * @param idleRedrawTime - how often the entire score re-renders
 */
export interface SmoConfiguration {
    mode: SmoMode,
    smoPath?: string,
    language: string,
    scoreLoadOrder: string[],
    scoreLoadJson?: string,
    smoDomContainer?: string,
    vexDomContainer?: string,
    ribbon?: true,
    keyCommands?: true,
    menus?: true,
    title?: string,
    libraryUrl?: string,
    languageDir: string,
    demonPollTime: number, // how often we poll the score to see if it changed
    idleRedrawTime: number
}
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


