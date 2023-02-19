// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoAudioPitch } from '../../smo/data/music';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoOscillatorInfo, SmoInstrument, SmoOscillatorInfoAllTypes,
  SmoOscillatorInfoNumberType, SmoOscillatorInfoNumberArType, SmoOscillatorInfoStringType, SmoOscillatorInfoStringNullType,
  SmoOscillatorInfoWaveformType, SmoOscillatorInfoSustainType, SmoOscillatorInfoOptionsType } from '../../smo/data/staffModifiers';
/**
 * A set of parameters from the instrument interface used to create audio from samples.
 * @category SuiAudio
 */
  export interface SampleChooserParams {
  family?: string,
  instrument: string,
  frequency: number,
  duration: number,
  gain: number,
  articulation?: string
}
/**
 * A function prototype that chooses from among samples to return the correct one for that note
 */
export type SampleChooser = (params: SampleChooserParams, samples: SmoOscillatorInfo[]) => AudioSample | null;
/**
 * A specific audio sample that can be converted into an audio node
 * @category SuiAudio
 */
export interface AudioSample {
  sample: AudioBuffer,
  frequency: number,
  patch: string
}
/**
 * Interface for a chooser function and a set of samples
 * @category SuiAudio
 */
export interface InstrumentSampleChooser {
  instrument: string,
  sampleChooser: SampleChooser,
  samples: SmoOscillatorInfo[]
}

export const sampleForPercussion = (params: SampleChooserParams, samples: SmoOscillatorInfo[]): AudioSample | null => {
  const longSamples = samples.filter((ss) => ss.instrument === 'percussion');
  let sample: AudioSample | null = null;
  if (longSamples.length) {
    sample = sampleFromFrequency(params, longSamples);
    if (sample) {
      return sample;
    }
  }
  return sampleFromFrequency(params, samples);
}
/**
 * For instruments like violin that require different samples depending on note duration
 * @param params 
 * @param samples 
 * @returns 
 * @category SuiAudio
 */
export const sampleFromMinDuration = (params: SampleChooserParams, samples: SmoOscillatorInfo[]): AudioSample | null => {
  const longSamples = samples.filter((ss) => ss.minDuration < params.duration && ss.minDuration > 0);
  if (longSamples.length) {
    return sampleFromFrequency(params, longSamples);
  }
  return sampleFromFrequency(params, samples.filter((ss) => ss.minDuration ===  0));
}

/**
 * Give a set of samples, return the one that closest matches the frequency
 * @param params 
 * @param samples 
 * @returns 
 * @category SuiAudio
*/
export const sampleFromFrequency = (params: SampleChooserParams, samples: SmoOscillatorInfo[]): AudioSample | null => {
  let min = 9999;
  let rv: AudioSample | null = null;
  let i = 0;
  const f = params.frequency;
  for (i = 0; i < samples.length; ++i) {
    const oscInfo = samples[i];
    if (!oscInfo.sample || !SuiSampleMedia.sampleBufferMap[oscInfo.sample]) {
      continue;
    }
    const buffer = SuiSampleMedia.sampleBufferMap[oscInfo.sample];
    if (Math.abs(f - oscInfo.nativeFrequency) < min) {
      min = Math.abs(f - oscInfo.nativeFrequency);
      rv = {
        sample: buffer,
        frequency: oscInfo.nativeFrequency,
        patch: oscInfo.sample
      };
    } 
  }
  return rv;
}
/**
 * Logic to create audio nodes out of HTML5 media elements
 * @category SuiAudio
 */
export class SuiSampleMedia {
  static sampleFiles: SmoOscillatorInfo[] = [];
  static sampleBufferMap: Record<string, AudioBuffer> = {};
  static sampleOscMap: Record<string, SmoOscillatorInfo[]> = {};
  static instrumentChooser: Record<string, InstrumentSampleChooser> = {};
  static receivedBuffer: boolean = false;
  static insertIntoMap(sample: Partial<SmoOscillatorInfo>) {
    const oscInfo = SmoInstrument.defaultOscillatorParam;
    const populatePartial = (partial: Partial<SmoOscillatorInfo>, full: SmoOscillatorInfo, 
      param: SmoOscillatorInfoNumberType | SmoOscillatorInfoNumberArType | SmoOscillatorInfoStringType | SmoOscillatorInfoStringNullType
      | SmoOscillatorInfoOptionsType | SmoOscillatorInfoSustainType | SmoOscillatorInfoWaveformType) => {
      (full[param] as any) = typeof(partial[param]) === 'undefined' ? full[param] : partial[param];
    }
    SmoOscillatorInfoAllTypes.forEach((paramType) => {
      populatePartial(sample, oscInfo, paramType as any);
    });
    if (!this.sampleOscMap[oscInfo.instrument]) {
      this.sampleOscMap[oscInfo.instrument] = [];
    }
    this.sampleOscMap[oscInfo.instrument].push(oscInfo);
    SuiSampleMedia.sampleFiles.push(oscInfo);
  }
  static populateSampleMap() {
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'samplecn4',
      family: 'keyboard',
      instrument: 'piano',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'samplebb4',
      family: 'keyboard',
      instrument: 'piano',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'b', accidental: 'b', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'basspizz-c2-sso',
      family: 'strings',
      instrument: 'jazzBass',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: '#', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'basspizz-c3-sso',
      family: 'strings',
      instrument: 'jazzBass',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: '#', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'eguitar-e3',
      family: 'strings',
      instrument: 'eGuitar',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'eguitar-d4',
      family: 'strings',
      instrument: 'eGuitar',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'd', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-bass-a1',
      family: 'strings',
      instrument: 'bass',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'a', accidental: 'n', octave: 1 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-bass-a3',
      family: 'strings',
      instrument: 'bass',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'a', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violinshort-c4',
      family: 'strings',
      instrument: 'violin',
      minDuration: 0,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 5 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violinshort-b5',
      family: 'strings',
      instrument: 'violin',
      minDuration: 0,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'b', accidental: 'n', octave: 6 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violinshort-e5',
      family: 'strings',
      instrument: 'violin',
      minDuration: 0,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 6 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violin-e6',
      family: 'strings',
      instrument: 'violin',
      minDuration: 400,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 6 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violin-e5',
      family: 'strings',
      instrument: 'violin',
      minDuration: 400,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 5 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-violin-e4',
      family: 'strings',
      instrument: 'violin',
      minDuration: 400,
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-cello-bb3',
      family: 'strings',
      instrument: 'cello',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'b', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-cello-c4',
      family: 'strings',
      instrument: 'cello',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'trumpet-g5-sso',
      family: 'brass',
      instrument: 'trumpet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'g', accidental: 'n', octave: 5 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'trumpet-e4-sso',
      family: 'brass',
      instrument: 'trumpet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-horn-c4',
      family: 'brass',
      instrument: 'horn',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-horn-c3',
      family: 'brass',
      instrument: 'horn',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'trombone-g3-sso',
      family: 'brass',
      instrument: 'trombone',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'g', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'trombone-g4-sso',
      family: 'brass',
      instrument: 'trombone',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'g', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-tuba-c2',
      family: 'brass',
      instrument: 'tuba',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 2 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-tuba-c3',
      family: 'brass',
      instrument: 'tuba',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 3 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-clarinet-c4',
      family: 'woodwind',
      instrument: 'clarinet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-clarinet-c5',
      family: 'woodwind',
      instrument: 'clarinet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 5 }, 0, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-asax-a3',
      family: 'woodwind',
      instrument: 'altoSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'a', accidental: 'n', octave: 3 }, 12, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-asax-c4',
      family: 'woodwind',
      instrument: 'altoSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 12, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-asax-a3',
      family: 'woodwind',
      instrument: 'tenorSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'a', accidental: 'n', octave: 3 }, 24, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'sample-asax-c4',
      family: 'woodwind',
      instrument: 'tenorSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 24, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'barisax-d2-nz10',
      family: 'woodwind',
      instrument: 'bariSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'd', accidental: 'n', octave: 2 }, 12, null),
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'barisax-c3-nz10',
      family: 'woodwind',
      instrument: 'bariSax',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 3 }, 12, null) - 5,
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'pad-c4-vita',
      family: 'synth',
      instrument: 'pad',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 3 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'sustained',
      sample: 'pad-c5-vita',
      family: 'synth',
      instrument: 'pad',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'drum-hh-closed',
      family: 'drums',
      instrument: 'percussion',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'g', accidental: 'n', octave: 5 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'drum-drumset-snare',
      family: 'drums',
      instrument: 'percussion',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'f', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'drum-drumset-tom1',
      family: 'drums',
      instrument: 'percussion',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'a', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'drum-drumset-tom2',
      family: 'drums',
      instrument: 'percussion',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'e', accidental: 'n', octave: 5 }, 0, null),
      dynamic: 100
    });
    SuiSampleMedia.insertIntoMap({
      sustain: 'percussive',
      sample: 'drum-drumset-kick',
      family: 'drums',
      instrument: 'percussion',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100
    });
    const instrumentMap = Object.keys(SuiSampleMedia.sampleOscMap);
    instrumentMap.forEach((instrumentKey) => {
      SuiSampleMedia.instrumentChooser[instrumentKey] = {
        instrument: instrumentKey,
        samples: SuiSampleMedia.sampleOscMap[instrumentKey],
        sampleChooser: sampleFromFrequency
      }
    });
    SuiSampleMedia.instrumentChooser['violin'].sampleChooser = sampleFromMinDuration;
    SuiSampleMedia.instrumentChooser['percussion'].sampleChooser = sampleForPercussion;
  }
  static getSmoOscillatorInfo(instrument: string) {
    if (!SuiSampleMedia.sampleOscMap[instrument]) {
      return SuiSampleMedia.sampleOscMap['piano'];
    }
    return SuiSampleMedia.sampleOscMap[instrument];
  }
  /**
  * Load samples so we can play the music
  * @returns - promise, resolved when loaded
  */
  static samplePromise(audio: AudioContext): Promise<any> {
    const mediaElements: HTMLMediaElement[] = [];
    let i = 0;
    if (SuiSampleMedia.receivedBuffer) {
      return PromiseHelpers.emptyPromise();
    }
    SuiSampleMedia.populateSampleMap();
    const loadedSamples: Record<string, boolean> = {};
    for (i = 0; i < SuiSampleMedia.sampleFiles.length; ++i) {
      const file = SuiSampleMedia.sampleFiles[i];
      if (!file.sample) {
        continue;
      }
      const sampleName = file.sample;
      const audioElement: HTMLMediaElement | null = document.getElementById(file.sample) as HTMLMediaElement;
      if (!loadedSamples[file.sample] && audioElement) {
        loadedSamples[file.sample] = true;
        const media = audio.createMediaElementSource(audioElement);
        mediaElements.push(audioElement);
        const req = new XMLHttpRequest();
        req.open('GET', media.mediaElement.src, true);
        req.responseType = 'arraybuffer';
        req.send();
        req.onload = () => {
          const audioData = req.response;
          audio.decodeAudioData(audioData, (decoded) => {
            SuiSampleMedia.sampleBufferMap[sampleName] = decoded;
            SuiSampleMedia.receivedBuffer = true;
          });
        };
      }
      if (mediaElements.length < 1) {
        return PromiseHelpers.emptyPromise();
      }
    }
    const rv = new Promise<any>((resolve: any) => {
      const checkSample = () => {
        setTimeout(() => {
          if (!SuiSampleMedia.receivedBuffer) {
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

  static sampleForFrequency(f: number, oscs: SmoOscillatorInfo[]): AudioSample | null {
    let min = 9999;
    let rv: AudioSample | null = null;
    let i = 0;
    for (i = 0; i < oscs.length; ++i) {
      const oscInfo = oscs[i];
      if (!oscInfo.sample || !SuiSampleMedia.sampleBufferMap[oscInfo.sample]) {
        continue;
      }
      const buffer = SuiSampleMedia.sampleBufferMap[oscInfo.sample];
      if (Math.abs(f - oscInfo.nativeFrequency) < min) {
        min = Math.abs(f - oscInfo.nativeFrequency);
        rv = {
          sample: buffer,
          frequency: oscInfo.nativeFrequency,
          patch: oscInfo.sample
        };
      } 
    }
    return rv;
  }
  static matchedSample(params: SampleChooserParams): AudioSample | null {
    let instrumentKey = params.instrument;
    if (!SuiSampleMedia.instrumentChooser[instrumentKey]) {
      instrumentKey = 'piano';
    }
    if (!SuiSampleMedia.instrumentChooser[instrumentKey]) {
      const keys = Object.keys(SuiSampleMedia.sampleOscMap);
      if (keys.length === 0) {
        return null;
      }
      instrumentKey = keys[0];
    }
    return SuiSampleMedia.instrumentChooser[instrumentKey].sampleChooser(params, SuiSampleMedia.instrumentChooser[instrumentKey].samples);
  }
}
