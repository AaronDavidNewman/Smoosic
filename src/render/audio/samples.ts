// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoAudioPitch } from '../../smo/data/music';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { SmoOscillatorInfo } from '../../smo/data/staffModifiers';

export interface AudioSample {
  sample: AudioBuffer,
  frequency: number,
  patch: string
}
export class SuiSampleMedia {
  static sampleFiles: SmoOscillatorInfo[] = [];
  static sampleBufferMap: Record<string, AudioBuffer> = {};
  static sampleOscMap: Record<string, SmoOscillatorInfo[]> = {};
  static receivedBuffer: boolean = false;
  static insertIntoMap(sample: SmoOscillatorInfo) {
    if (!this.sampleOscMap[sample.subFamily]) {
      this.sampleOscMap[sample.subFamily] = [];
    }
    this.sampleOscMap[sample.subFamily].push(sample);
    SuiSampleMedia.sampleFiles.push(sample);
  }
  static populateSampleMap() {
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'percussive',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'samplecn4',
      family: 'keyboard',
      subFamily: 'piano',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'percussive',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'samplebb4',
      family: 'keyboard',
      subFamily: 'piano',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'b', accidental: 'b', octave: 4 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-cello-bb3',
      family: 'strings',
      subFamily: 'cello',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'b', accidental: 'n', octave: 3 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-cello-c4',
      family: 'strings',
      subFamily: 'cello',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-trumpet-c4',
      family: 'brass',
      subFamily: 'trumpet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-trumpet-c5',
      family: 'brass',
      subFamily: 'trumpet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 5 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-tuba-c2',
      family: 'brass',
      subFamily: 'tuba',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 2 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-tuba-c3',
      family: 'brass',
      subFamily: 'tuba',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 3 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-clarinet-c4',
      family: 'woodwind',
      subFamily: 'clarinet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 4 }, 0, null),
      dynamic: 100,
      options: []
    });
    SuiSampleMedia.insertIntoMap({
      waveform: 'sample',
      sustain: 'sustained',
      realOvertones: [],
      imaginaryOvertones: [],
      sample: 'sample-clarinet-c5',
      family: 'woodwind',
      subFamily: 'clarinet',
      nativeFrequency: SmoAudioPitch.smoPitchToFrequency({ letter: 'c', accidental: 'n', octave: 5 }, 0, null),
      dynamic: 100,
      options: []
    });
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
    for (i = 0; i < SuiSampleMedia.sampleFiles.length; ++i) {
      const file = SuiSampleMedia.sampleFiles[i];
      if (!file.sample) {
        continue;
      }
      const sampleName = file.sample;
      const audioElement: HTMLMediaElement | null = document.getElementById(file.sample) as HTMLMediaElement;
      if (audioElement) {
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
  static matchedSample(instrument: string, frequency: number): AudioSample | null{
    if (!SuiSampleMedia.sampleOscMap[instrument]) {
      instrument = 'piano';      
    }
    if (!SuiSampleMedia.sampleOscMap[instrument]) {
      const keys = Object.keys(SuiSampleMedia.sampleOscMap);
      if (keys.length === 0) {
        return null;
      }
      instrument = keys[0];
    }
    return SuiSampleMedia.sampleForFrequency(frequency, SuiSampleMedia.sampleOscMap[instrument]);
  }
}
