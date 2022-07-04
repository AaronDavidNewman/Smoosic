// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { smoSerialize } from '../../common/serializationHelpers';
import { SmoAudioPitch } from '../../smo/data/music';
import { SmoMicrotone } from '../../smo/data/noteModifiers';
import { SmoMeasure } from '../../smo/data/measure';
import { SmoNote } from '../../smo/data/note';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMusic } from '../../smo/data/music';


export class SuiReverb {
  static get defaults() {
    return { length: 0.05, decay: 2 };
  }
  static impulse: AudioBuffer | null;

  connect(destination: AudioNode) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
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
  wavetable: WaveTable,
  useReverb: boolean
}
export interface AudioSample {
  sample: AudioBuffer,
  frequency: number,
  patch: string
}

// ## SuiOscillator
// Simple waveform synthesizer thing that plays notes.  Oscillator works in either
// analog synthisizer or sampler mode.  I've found the HTML synth performance to be not
// so great, and using actual MP3 samples both performs and sounds better.  Still, 
// synths are so cool that I am keeping it to tinker with later
export class SuiOscillator {
  static audio: AudioContext = new AudioContext();
  static get defaults(): SuiOscillatorParams {
    const wavetable: WaveTable = {
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
      useReverb: false
    };
    return JSON.parse(JSON.stringify(obj));
  }

  static sampleFiles: string[] = ['bb4', 'cn4'];
  static samples: AudioSample[] = [];
  static playSelectionNow(selection: SmoSelection, gain: number) {
    // In the midst of re-rendering...
    if (!selection.note) {
      return;
    }
    if (selection.note.isRest() || selection.note.isSlash()) {
      return;
    }
    setTimeout(() => {
      const ar = SuiOscillator.fromNote(selection.measure, selection.note!, true, gain);
      ar.forEach((osc) => {
        osc.play();
      });
    }, 1);
  }

  static get attackTime()  {
    return 25;
  }
  static get decayTime()  {
    return 15;
  }
  // ### fromNote
  // Create an areray of oscillators for each pitch in a note
  static fromNote(measure: SmoMeasure, note: SmoNote, isSample: boolean, gain: number): SuiOscillator[] {
    let frequency = 0;
    let duration = 0;
    const tempo = measure.getTempo();
    const bpm = tempo.bpm;
    const beats = note.tickCount / 4096;
    duration = (beats / bpm) * 60000;

    // adjust if bpm is over something other than 1/4 note
    duration = duration * (4096 / tempo.beatDuration);
    if (isSample) {
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
      def.frequency = frequency;
      def.duration = duration;
      def.gain = gain;
      const osc = new SuiSampler(def);
      ar.push(osc);
    });

    return ar;
  }

  static get attributes() {
    return ['duration', 'frequency', 'pitch', 'attackEnv', 'sustainEnv', 'decayEnv',
      'releaseEnv', 'sustainLevel', 'releaseLevel', 'waveform', 'wavetable', 'gain'];
  }

  /**
   * Load samples so we can play the music
   * @returns - promise, resolved when loaded
   */
  static samplePromise(): Promise<any> {
    const mediaElements: HTMLMediaElement[] = [];
    if (SuiOscillator.samples.length < SuiOscillator.sampleFiles.length) {
      SuiOscillator.sampleFiles.forEach((file) => {
        const audio = SuiOscillator.audio;
        const audioElement: HTMLMediaElement | null = document.getElementById('sample' + file) as HTMLMediaElement;
        if (audioElement) {
          const media = audio.createMediaElementSource(audioElement);
          const patch = audioElement.getAttribute('data-patch');
          const pitchString = audioElement.getAttribute('data-pitch');
          if (pitchString !== null && patch !== null) {
            mediaElements.push(audioElement);
            const pitch = SmoMusic.vexToSmoPitch(pitchString);
            const frequency = SmoAudioPitch.smoPitchToFrequency(pitch, 0, null);
            const req = new XMLHttpRequest();
            req.open('GET', media.mediaElement.src, true);
            req.responseType = 'arraybuffer';
            req.send();
            req.onload = () => {
              const audioData = req.response;
              audio.decodeAudioData(audioData, (decoded) => {
                SuiOscillator.samples.push({ sample: decoded, frequency, patch });
              });
            };
          }
        }
      });
    }
    if (mediaElements.length < 1) {
      return PromiseHelpers.emptyPromise();
    }
    const rv = new Promise<any>((resolve: any) => {
      const checkSample = () => {
        setTimeout(() => {
          if (SuiOscillator.samples.length < SuiOscillator.sampleFiles.length) {
            checkSample();
          } else {
            resolve();
          }
        }, 100);
      };
      checkSample();
    });
    return rv;
  }
  static sampleForFrequency(f: number): AudioSample | null {
    let min = 9999;
    let rv: AudioSample | null = null;
    let i = 0;
    for (i = 0; i < SuiOscillator.samples.length; ++i) {
      const sample = SuiOscillator.samples[i];
      if (Math.abs(f - sample.frequency) < min) {
        min = Math.abs(f - sample.frequency);
        rv = sample;
      }
    }
    return rv;
  }

  _playPromise(osc: AudioScheduledSourceNode, duration: number, gain: GainNode) {
    const audio = SuiOscillator.audio;
    const promise = new Promise<void>((resolve) => {
      osc.start(0);

      setTimeout(() => {
        resolve();
      }, duration);

      setTimeout(() => {
        osc.stop(0);
        osc.disconnect(gain);
        gain.disconnect(audio.destination);
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
  reverb: SuiReverb;
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
  wavetable: WaveTable;
  useReverb: boolean;
  constructor(parameters: SuiOscillatorParams) {
    smoSerialize.serializedMerge(SuiOscillator.attributes, parameters, this);
    this.reverb = new SuiReverb(SuiOscillator.audio);
    this.attack = this.attackEnv * SuiOscillator.attackTime;
    this.decay = this.decayEnv * SuiOscillator.decayTime;
    this.sustain = this.sustainEnv * this.duration;
    this.release = this.releaseEnv * this.duration;
    this.wavetable = parameters.wavetable;
    this.useReverb = parameters.useReverb;
    // this.frequency = this.frequency / 2;  // Overtones below partial

    if (parameters.waveform && parameters.waveform !== 'custom') {
      this.waveform = parameters.waveform;
    } else {
      this.waveform = 'custom';
    }
  }

  // ### play
  // play the audio oscillator for the specified duration.  Return a promise that
  // resolves after the duration.  Also dispose of the audio resources after the play is complete.
  play() {
    const audio = SuiOscillator.audio;
    const gain = audio.createGain();
    const osc = audio.createOscillator();

    gain.connect(this.reverb.input);

    this.reverb.connect(audio.destination);
    const attack = this.attack / 1000;
    const decay = this.decay / 1000;
    const sustain = this.sustain / 1000;
    const release = this.release / 1000;
    gain.gain.exponentialRampToValueAtTime(this.gain, audio.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(this.sustainLevel * this.gain, audio.currentTime + attack + decay);
    gain.gain.exponentialRampToValueAtTime(this.releaseLevel * this.gain, audio.currentTime + attack + decay + sustain);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + attack + decay + sustain + release);
    if (this.waveform !== 'custom') {
      osc.type = this.waveform;
    } else {
      const wave = audio.createPeriodicWave(SuiOscillator.toFloatArray(this.wavetable.real),
        SuiOscillator.toFloatArray(this.wavetable.imaginary),
        { disableNormalization: false });
      osc.setPeriodicWave(wave);
    }
    osc.frequency.value = this.frequency;
    osc.connect(gain);
    gain.connect(audio.destination);
    return this._playPromise(osc, this.duration, gain);
  }
}

// ## SuiSampler
// Class that replaces oscillator with a sampler.
export class SuiSampler extends SuiOscillator {
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
  // Note: samplePromise must be complete before you call this
  play() {
    const self = this;
    return SuiOscillator.samplePromise().then(() => {
      self._play();
    });
  }
  _play(): Promise<any> {
    if (this.frequency === 0) {
      return SuiSampler.resolveAfter(this.duration);
    }
    const audio = SuiOscillator.audio;
    const attack = this.attack / 1000;
    const decay = this.decay / 1000;
    const sustain = this.sustain / 1000;
    const release = this.release / 1000;
    const gain1 = audio.createGain();
    const gp1 = this.gain;
    // const gain2 = audio.createGain();
    let delay: DelayNode | null = null;
    if (this.useReverb) {
      delay = audio.createDelay(this.reverb.length);
    }
    gain1.gain.exponentialRampToValueAtTime(gp1, audio.currentTime + attack);
    gain1.gain.exponentialRampToValueAtTime(this.sustainLevel * gp1, audio.currentTime + attack + decay);
    gain1.gain.exponentialRampToValueAtTime(this.releaseLevel * gp1, audio.currentTime + attack + decay + sustain);
    gain1.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + attack + decay + sustain + release);
    // gain2.gain.exponentialRampToValueAtTime(gp1, audio.currentTime + attack);
    // gain2.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + attack + decay + sustain + release);
    const osc = audio.createBufferSource();
    const sample = SuiOscillator.sampleForFrequency(this.frequency);
    if (!sample) {
      return PromiseHelpers.emptyPromise();
    }
    osc.buffer = sample!.sample;
    const cents = 1200 * (Math.log(this.frequency / sample!.frequency))
      / Math.log(2);

    osc.detune.value = cents;
    // osc.connect(gain1);
    if (this.useReverb) {
      osc.connect(this.reverb.input);
    }
    osc.connect(gain1);
    if (delay) {
      this.reverb.connect(delay);
      delay.connect(audio.destination);
    }
  // osc.connect(gain);
    // delay.connect(gain2);
    gain1.connect(audio.destination);
    // gain2.connect(audio.destination);
    return this._playPromise(osc, this.duration);
  }

  _playPromise(osc: AudioScheduledSourceNode, duration: number): Promise<void> {
    const promise = new Promise<void>((resolve) => {
      osc.start(0);
      setTimeout(() => {
        resolve();
      }, duration);
      setTimeout(() => {
        osc.stop(0);
      }, Math.round(duration * 1.05));
    });
    return promise;
  }
}
