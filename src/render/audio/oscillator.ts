// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoAudioPitch } from '../../smo/data/music';
import { SmoMicrotone } from '../../smo/data/noteModifiers';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoScore } from '../../smo/data/score';
import { SmoOscillatorInfo } from '../../smo/data/staffModifiers';
import { SuiSampleMedia, AudioSample } from './samples';

export class SuiReverb {
  static get defaults() {
    return { length: 0.2, decay: 2 };
  }
  static impulse: AudioBuffer | null;

  connect(destination: AudioNode) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
    this.input.disconnect();
  }

  // credit: https://github.com/nick-thompson
  _buildImpulse() {
    let n = 0;
    let i = 0;
    if (SuiReverb.impulse) {
      this.input.buffer = SuiReverb.impulse;
      return;
    }

    const rate = this._context.sampleRate;
    const length = rate * this.length;
    const decay = this.decay;
    const impulse = this._context.createBuffer(2, length, rate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (i = 0; i < length; i++) {
      n = this.reverse ? length - i : i;
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * this.damp;
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay) * this.damp;
    }
    SuiReverb.impulse = impulse;

    this.input.buffer = impulse;
  }
  output: ConvolverNode;
  input: ConvolverNode;
  length: number;
  decay: number;
  damp: number = 1.0;
  reverse: boolean = false;
  _context: AudioContext;
  constructor(context: AudioContext) {
    this.input = this.output = context.createConvolver();
    this.length = SuiReverb.defaults.length;
    this.decay = SuiReverb.defaults.decay;
    this._context = context;
    this._buildImpulse();
  }
}

export interface WaveTable {
  real: number[],
  imaginary: number[]
}
export interface SuiOscillatorParams {
  duration: number,
  frequency: number,
  attackEnv: number,
  decayEnv: number,
  sustainEnv: number,
  releaseEnv: number,
  sustainLevel: number,
  releaseLevel: number,
  waveform: OscillatorType,
  gain: number,
  wavetable?: WaveTable,
  useReverb: boolean,
  instrument: string
}

export const SynthWavetable: WaveTable = {
  real: [0,
    0.3, 0.3, 0, 0, 0,
    0.1, 0, 0, 0, 0,
    0.05, 0, 0, 0, 0,
    0.01, 0, 0, 0, 0,
    0.01, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0],
  imaginary: [0,
    0, 0.05, 0, 0, 0,
    0, 0.01, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0]
};
/**
 * Simple waveform synthesizer thing that plays notes.  Oscillator works in either
 * analog synthisizer or sampler mode.
 */
export abstract class SuiOscillator {
  static audio: AudioContext = new AudioContext();
  static created: number = 0;
  static get defaults(): SuiOscillatorParams {
    const wavetable: WaveTable = {
      real: [], imaginary: []
    };
    const obj = {
      duration: 1000,
      frequency: 440,
      attackEnv: 0.05,
      decayEnv: 0.4,
      sustainEnv: 0.8,
      releaseEnv: 0.25,
      sustainLevel: 0.5,
      releaseLevel: 0.1,
      waveform: 'custom',
      gain: 0.2,
      wavetable,
      useReverb: false,
      instrument: 'piano'
    };
    return JSON.parse(JSON.stringify(obj));
  }

  static sampleFiles: string[] = ['bb4', 'cn4'];
  static samples: AudioSample[] = [];
  static playSelectionNow(selection: SmoSelection, score: SmoScore, gain: number) {
    // In the midst of re-rendering...
    if (!selection.note) {
      return;
    }
    if (selection.note.isRest() || selection.note.isSlash()) {
      return;
    }
    const soundInfo = selection.staff.getStaffInstrument(selection.selector.measure);
    const oscInfo = SuiSampleMedia.getSmoOscillatorInfo(soundInfo.instrument);
    setTimeout(() => {
      const ar = SuiOscillator.fromNote(selection.measure, selection.note!, score, oscInfo[0], gain);
      ar.forEach((osc) => {
        osc.play();
      });
    }, 1);
  }

  static get attackTime() {
    return 25;
  }
  static get decayTime() {
    return 15;
  }
  // ### fromNote
  // Create an areray of oscillators for each pitch in a note
  static fromNote(measure: SmoMeasure, note: SmoNote, score: SmoScore, soundInfo: SmoOscillatorInfo, gain: number): SuiOscillator[] {
    let frequency = 0;
    let duration = 0;
    const tempo = measure.getTempo();
    const bpm = tempo.bpm;
    const beats = note.tickCount / 4096;
    duration = (beats / bpm) * 60000;

    // adjust if bpm is over something other than 1/4 note
    duration = duration * (4096 / tempo.beatDuration);
    if (soundInfo.waveform === 'sample') {
      duration = 250;
    }

    const ar: SuiOscillator[] = [];
    gain = isNaN(gain) ? 0.2 : gain;
    gain = gain / note.pitches.length;
    if (note.noteType === 'r') {
      gain = 0.001;
    }
    note.pitches.forEach((pitch, pitchIx) => {
      const mtone: SmoMicrotone | null = note.getMicrotone(pitchIx) ?? null;
      frequency = SmoAudioPitch.smoPitchToFrequency(pitch, -1 * measure.transposeIndex, mtone);
      const def = SuiOscillator.defaults;
      def.instrument = soundInfo.instrument;
      def.frequency = frequency;
      def.duration = duration;
      def.gain = gain;
      if (soundInfo.waveform !== 'sample') {
        def.waveform = soundInfo.waveform;
        if (def.waveform === 'custom') {
          def.wavetable = SynthWavetable;
        }
        const osc = new SuiWavetable(def);
        ar.push(osc);
      } else {
        const osc = new SuiSampler(def);
        ar.push(osc);
      }
    });

    return ar;
  }

  static get attributes() {
    return ['duration', 'frequency', 'pitch', 'attackEnv', 'sustainEnv', 'decayEnv',
      'releaseEnv', 'sustainLevel', 'releaseLevel', 'waveform', 'wavetable', 'gain'];
  }
  
  static resolveAfter(time: number) {
    return new Promise<void>((resolve) => {
      const timerFunc = () => {
        resolve();
      }
      setTimeout(() => {
        timerFunc();
      }, time);
    });
  }
  _playPromise(duration: number, gain: GainNode) {
    const audio = SuiOscillator.audio;
    const promise = new Promise<void>((resolve) => {
      if (this.osc) {
        this.osc.start(0);
      }
      setTimeout(() => {
        resolve();
      }, duration);

      setTimeout(() => {
        if (this.osc) {
          this.osc.stop(0);
        }
        this.disconnect();
      }, duration + 500);
    });
    return promise;
  }

  static toFloatArray(ar: number[]): Float32Array {
    const rv = new Float32Array(ar.length);
    let i = 0;
    for (i = 0; i < ar.length; ++i) {
      rv[i] = ar[i];
    }
    return rv;
  }
  reverb: SuiReverb | null;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  waveform: OscillatorType;
  attackEnv: number = -1;
  duration: number = -1;
  decayEnv: number = -1;
  sustainEnv: number = -1;
  releaseEnv: number = -1;
  gain: number = 1.0;
  sustainLevel: number = 0;
  releaseLevel: number = 0;
  frequency: number = -1;
  wavetable: WaveTable | null = null;
  useReverb: boolean;
  gainNode: GainNode | undefined;
  delayNode: DelayNode | undefined;
  instrument: string;
  osc: AudioScheduledSourceNode | undefined;
  constructor(parameters: SuiOscillatorParams) {
    smoSerialize.serializedMerge(SuiOscillator.attributes, parameters, this);
    this.reverb = null;
    // this.reverb = null;
    this.attack = this.attackEnv * SuiOscillator.attackTime;
    this.decay = this.decayEnv * SuiOscillator.decayTime;
    this.sustain = this.sustainEnv * this.duration;
    this.release = this.releaseEnv * this.duration;
    this.instrument = parameters.instrument;
    if (parameters.wavetable) {
      this.wavetable = parameters.wavetable;
    }
    this.useReverb = parameters.useReverb;
    // this.frequency = this.frequency / 2;  // Overtones below partial
    this.waveform = parameters.waveform;
    if (!parameters.wavetable && this.waveform === 'custom') {
      this.waveform = 'sine';
    }
  }
  abstract play(): Promise<any>;
  abstract createAudioNode(): AudioScheduledSourceNode;

  disconnect() {
    if (this.osc) {
      this.osc.disconnect();
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
    }
    if (this.delayNode) {
      this.delayNode.disconnect();
    }
    if (this.reverb) {
      this.reverb.disconnect();
    }
    SuiOscillator.created -= 1;
  }

  /**
   * Connect the audio sound source to the output, combining other
   * nodes in the mix such as convolver (reverb), delay, and gain.
   * Also set up the envelope
   * @returns - a promise that tis resolved when `duration` time has expired
   */
  async createAudioGraph(): Promise<any> {
    if (this.frequency === 0) {
      return SuiSampler.resolveAfter(this.duration);
    }
    const audio = SuiOscillator.audio;
    const attack = this.attack / 1000;
    const decay = this.decay / 1000;
    const sustain = this.sustain / 1000;
    const release = this.release / 1000;
    this.gainNode = audio.createGain();
    const gp1 = this.gain;

    if (this.useReverb) {
      this.reverb = new SuiReverb(SuiOscillator.audio);
    }

    if (this.useReverb && this.reverb) {
      this.delayNode = audio.createDelay(this.reverb.length);
    }
    this.gainNode.gain.exponentialRampToValueAtTime(gp1, audio.currentTime + attack);
    this.gainNode.gain.exponentialRampToValueAtTime(this.sustainLevel * gp1, audio.currentTime + attack + decay);
    this.gainNode.gain.exponentialRampToValueAtTime(this.releaseLevel * gp1, audio.currentTime + attack + decay + sustain);
    this.gainNode.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + attack + decay + sustain + release);

    this.osc = this.createAudioNode();

    // osc.connect(gain1);
    if (this.useReverb && this.reverb && this.osc) {
      this.osc.connect(this.reverb.input);
    }
    this.osc.connect(this.gainNode);
    if (this.delayNode && this.reverb) {
      this.reverb.connect(this.delayNode);
      this.delayNode.connect(audio.destination);
    }
    this.gainNode.connect(audio.destination);
    SuiOscillator.created += 1;
    return this.playPromise(this.duration);
  }
  playPromise(duration: number): Promise<void> {
    const promise = new Promise<void>((resolve) => {
      if (this.osc) {
        this.osc.start(0);
      }
      setTimeout(() => {
        resolve();
      }, duration);
      setTimeout(() => {
        if (this.osc) {
          this.osc.stop(0);
        }
        this.disconnect();
      }, Math.round(duration * 1.05));
    });
    return promise;
  }
}
/**
 * An audio output that uses browser audio api OscillatorNode as a sound source
 */
export class SuiWavetable extends SuiOscillator {
  createAudioNode(): AudioScheduledSourceNode {
    const node = SuiOscillator.audio.createOscillator();
    if (this.wavetable && this.wavetable.imaginary.length > 0 && this.wavetable.real.length > 0 && this.waveform === 'custom') {
      const wave = SuiOscillator.audio.createPeriodicWave(SuiOscillator.toFloatArray(this.wavetable.real),
        SuiOscillator.toFloatArray(this.wavetable.imaginary),
        { disableNormalization: false });
      node.setPeriodicWave(wave);
    } else {
      node.type = this.waveform;
    }
    node.frequency.value = this.frequency;
    return node;
  }
  // play the audio oscillator for the specified duration.  Return a promise that
  // resolves after the duration.  Also dispose of the audio resources after the play is complete.
  async play() {
    return this.createAudioGraph();
  }
}

/**
 * An audio output primitive that uses frequency-adjusted sampled sounds
 */
export class SuiSampler extends SuiOscillator {
  constructor(params: SuiOscillatorParams) {
    super(params);
    if (SuiSampleMedia.sampleOscMap[this.instrument]) {
      const sampleInfo = SuiSampleMedia.sampleOscMap[this.instrument];
      if (sampleInfo.length) {
        if (sampleInfo[0].sustain === 'sustained') {
          this.attack = 0.1 * this.duration;
        }
      }
    }
  }
  // Note: samplePromise must be complete before you call this  
  createAudioNode(): AudioScheduledSourceNode {
    const node = SuiOscillator.audio.createBufferSource();
    const chooserParams = {
      instrument: this.instrument,
      frequency: this.frequency,
      duration: this.duration,
      gain: this.gain
    }
    const sample = SuiSampleMedia.matchedSample(chooserParams);
    if (!sample) {
      return node;
    }
    const cents = 1200 * (Math.log(this.frequency / sample!.frequency))
      / Math.log(2);

    node.buffer = sample!.sample;
    node.detune.value = cents;
    return node;
  }
  async play() {
    const self = this;
    return SuiSampleMedia.samplePromise(SuiOscillator.audio).then(() => {
      self.createAudioGraph();
    });
  }

}
