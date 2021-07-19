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

export interface Pitch {
    letter: string,
    accidental?: string,
    octave?: number
}

export interface FontInfo {
    size: number;
    weight: string;
    family: string;
    style?: string;
  }
