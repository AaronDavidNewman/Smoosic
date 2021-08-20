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
    logicalBox: SvgBox | null
}

export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
    | 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';
