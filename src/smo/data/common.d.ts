export interface SmoAttrs {
    id: string,
    type: string
}

export interface Ticks {
    numerator: number,
    denominator: number,
    remainder: number
}

export type PitchLetter = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

export interface Pitch {
    letter: PitchLetter,
    accidental: string,
    octave: number
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
export interface SvgBox {
    x: number,
    y: number,
    width: number,
    height: number
}

export interface SmoVoice {
    notes: SmoNote[]
}

export interface TickMappable {
    voices: SmoVoice[],
    keySignature: string
}

export type Clef = 'treble' | 'bass' | 'tenor' | 'alto' | 'soprano' | 'percussion'
  | 'mezzo-soprano' | 'baritone-c' | 'baritone-f' | 'subbass' | 'french';