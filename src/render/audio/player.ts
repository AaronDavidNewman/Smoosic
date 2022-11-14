// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiOscillator, SuiSampler, SuiWavetable, SynthWavetable } from './oscillator';
import { SmoAudioScore } from '../../smo/xform/audioTrack';
import { SuiTracker } from '../sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { SmoSelector } from '../../smo/xform/selections';
import { SmoTie } from '../../smo/data/staffModifiers';
import { SmoAudioPitch } from '../../smo/data/music';

export interface SuiAudioPlayerParams {
  startIndex: number,
  tracker: SuiTracker,
  score: SmoScore
}
export interface SoundParams {
  frequencies: number[],
  duration: number,
  offsetPct: number,
  durationPct: number,
  volume: number,
  noteType: string,
  instrument: string,
  selector: SmoSelector
}
export interface SoundParamMeasureLink {
  soundParams: Record<number, SoundParams[]>,
  endTicks: number,
  next: SoundParamMeasureLink | null
}
export interface CuedAudioContext {
  oscs: SuiOscillator[],
  playMeasureIndex: number,
  playTickIndex: number,
  waitTime: number,
  offsetPct: number,
  durationPct: number,
  selector: SmoSelector
}
export interface CuedAudioLink {
  sound: CuedAudioContext;
  next: CuedAudioLink | null;
}
/**
 * Maintain a list of buffers ready to play, since this is a 
 * system resource.
 */
export class CuedAudioContexts {
  soundHead: CuedAudioLink | null = null;
  soundTail: CuedAudioLink | null = null;
  paramLinkHead: SoundParamMeasureLink | null = null;
  paramLinkTail: SoundParamMeasureLink | null = null;
  soundListLength = 0;
  playWaitTimer = 0;  
  playMeasureIndex: number = 0; // index of the measure we are playing
  cueMeasureIndex: number = 0; // measure index we are populating
  complete: boolean = false;
  addToTail(cuedSound: CuedAudioContext) {
    const tail = { sound: cuedSound, next: null };
    if (this.soundTail === null) {
      this.soundTail = tail;
      this.soundHead = tail;
    } else {
      this.soundTail.next = { sound: cuedSound, next: null };
      this.soundTail = this.soundTail.next;
    }
    this.soundListLength += cuedSound.oscs.length;
  }
  advanceHead(): CuedAudioContext | null {
    if (this.soundHead === null) {
      return null;
    }
    const cuedSound = this.soundHead.sound;
    this.soundHead = this.soundHead.next;
    this.soundListLength -= cuedSound.oscs.length;
    return cuedSound;
  }
  get soundCount() {
    return this.soundListLength;
  }
  reset() {
    this.soundHead = null;
    this.soundTail = null;
    this.paramLinkHead = null;
    this.paramLinkTail = null;
    this.soundListLength = 0;
    this.playWaitTimer = 0;
    this.playMeasureIndex = 0;
    this.cueMeasureIndex = 0;
    this.complete = false;
  }
}
// ## SuiAudioPlayer
// Play the music, ja!
export class SuiAudioPlayer {
  static _playing: boolean = false;
  static instanceId: number = 0;
  static duplicatePitchThresh = 4;
  static voiceThresh = 8;
  static _playingInstance: SuiAudioPlayer | null = null;
  static set playing(val) {
    SuiAudioPlayer._playing = val;
  }
  static get audioBufferSize() {
    return 512;
  }
  static incrementInstanceId() {
    const id = SuiAudioPlayer.instanceId + 1;
    SuiAudioPlayer.instanceId = id;
    return id;
  }
  static get playing() {
    if (typeof (SuiAudioPlayer._playing) === 'undefined') {
      SuiAudioPlayer._playing = false;
    }
    return SuiAudioPlayer._playing;
  }

  static pausePlayer() {
    if (SuiAudioPlayer._playingInstance) {
      const a = SuiAudioPlayer._playingInstance;
      a.paused = true;
      a.tracker.clearMusicCursor();
    }
    SuiAudioPlayer.playing = false;

  }
  instanceId: number;
  paused: boolean;
  tracker: SuiTracker;
  score: SmoScore;
  cuedSounds: CuedAudioContexts;
  audioDefaults = SuiOscillator.defaults;
  openTies: Record<string, SoundParams | null> = {};
  constructor(parameters: SuiAudioPlayerParams) {
    this.instanceId = SuiAudioPlayer.incrementInstanceId();
    this.paused = false;
    this.tracker = parameters.tracker;
    this.score = parameters.score;
    // Assume tempo is same for all measures
    this.cuedSounds = new CuedAudioContexts();
  }

  getNoteSoundData(measureIndex: number) {
    const measureNotes: Record<number, SoundParams[]> = {};
    let measureTicks = this.score.staves[0].measures[measureIndex].getMaxTicksVoice();
    const freqDuplicates: Record<number, Record<number, number>> = {};
    const voiceCount: Record<number, number> = {};
    this.score.staves.forEach((staff, staffIx) => {
      const measure = staff.measures[measureIndex];
      measure.voices.forEach((voice, voiceIx) => {
        let curTick = 0;
        const instrument = staff.getStaffInstrument(measure.measureNumber.measureIndex);
        voice.notes.forEach((smoNote, tickIx) => {
          const frequencies: number[] = [];
          const xpose = -1 * measure.transposeIndex;
          const selector: SmoSelector = SmoSelector.default;
          selector.measure = measureIndex;
          selector.staff = staffIx;
          selector.voice = voiceIx;
          selector.tick = tickIx;
          let ties: SmoTie[] = [];
          const tieIx = '' + staffIx + '-' + measureIndex + '-' + voiceIx;
          if (smoNote.noteType === 'n' && measure.clef !== 'percussion') {
            ties = staff.getTiesStartingAt(selector);
            smoNote.pitches.forEach((pitch, pitchIx) => {
              const freq = SmoAudioPitch.smoPitchToFrequency(pitch, xpose, smoNote.getMicrotone(pitchIx) ?? null);
              const freqRound = Math.round(freq);
              if (!freqDuplicates[curTick]) {
                freqDuplicates[curTick] = {};
                voiceCount[curTick] = 0;
              }
              const freqBeat = freqDuplicates[curTick];
              if (!freqBeat[freqRound]) {
                freqBeat[freqRound] = 0;
              }
              if (freqBeat[freqRound] < SuiAudioPlayer.duplicatePitchThresh && voiceCount[curTick] < SuiAudioPlayer.voiceThresh) {
                frequencies.push(freq);
                freqBeat[freqRound] += 1;
                voiceCount[curTick] += 1;
              }
            });
            const duration = smoNote.tickCount;
            const volume = SmoAudioScore.volumeFromNote(smoNote, SmoAudioScore.dynamicVolumeMap.mf);
            if (!measureNotes[curTick]) {
              measureNotes[curTick] = [];
            }
            const soundData: SoundParams = {
              frequencies,
              volume,
              offsetPct: curTick / measureTicks,
              durationPct: duration / measureTicks,
              noteType: smoNote.noteType,
              duration,
              instrument: instrument.instrument,
              selector
            };
            // If this is continuation of tied note, just change duration
            if (this.openTies[tieIx]) {
              this.openTies[tieIx]!.duration += duration;
              if (ties.length === 0) {
                this.openTies[tieIx] = null;
              }
            } else if (ties.length) {
              // If start of tied note, record the tie note, the next note in this voice
              // will adjust duration
              this.openTies[tieIx] = soundData;
              measureNotes[curTick].push(soundData);
            } else {
              measureNotes[curTick].push(soundData);
            }
          }
          curTick += Math.round(smoNote.tickCount);
        });
      });
    });
    const keys = Object.keys(measureNotes).map((x) => parseInt(x, 10));
    if (keys.length) {
      measureTicks -= keys.reduce((a, b) => a > b ? a : b);
    }
    return { endTicks: measureTicks, measureNotes };
  }
  
  createCuedSound(measureIndex: number) {
    let i = 0;
    let j = 0;
    let measureBeat = 0;
    if (!SuiAudioPlayer.playing || this.cuedSounds.paramLinkHead === null) {
      return;
    }
    // TODO base on the selection start.
    const { endTicks, measureNotes } = { endTicks: this.cuedSounds.paramLinkHead.endTicks, measureNotes: this.cuedSounds.paramLinkHead.soundParams };
    this.cuedSounds.paramLinkHead = this.cuedSounds.paramLinkHead.next;
    const maxMeasures = this.score.staves[0].measures.length;
    const smoTemp = this.score.staves[0].measures[measureIndex].getTempo();
    const tempo = smoTemp.bpm * (smoTemp.beatDuration / 4096);
    const keys: number[] = [];
    Object.keys(measureNotes).forEach((key) => {
      keys.push(parseInt(key, 10));
    });    
    // There is a key for each note in the measure.  The value is the number of ticks before that note is played
    for (j = 0; j < keys.length; ++j) {
        const beatTime = keys[j];
        const soundData = measureNotes[beatTime];
        let durationPct = 0;
        let offsetPct = 0;
        soundData.forEach((ss) => {
          if (durationPct === 0) {
            durationPct = ss.durationPct;
            offsetPct = ss.offsetPct;
          }
          durationPct = Math.min(durationPct, ss.durationPct);
          offsetPct = Math.min(offsetPct, ss.offsetPct);
        });
        const cuedSound: CuedAudioContext = { oscs: [], waitTime: 0, playMeasureIndex: measureIndex, playTickIndex: j,
           offsetPct, durationPct, selector: soundData[0].selector };
        const timeRatio = 60000 / (tempo * 4096);
        // If there is complete silence here, put a silent beat
        if (beatTime > measureBeat) {
          const params = this.audioDefaults;
          params.frequency = 0;
          params.duration = (beatTime - measureBeat) * timeRatio;
          params.gain = 0;
          params.useReverb = false;
          const silence: CuedAudioContext = { oscs: [], waitTime: params.duration, playMeasureIndex: measureIndex, playTickIndex: j,
            offsetPct, durationPct, selector: soundData[0].selector };
          silence.oscs.push(new SuiSampler(params));
          this.cuedSounds.addToTail(silence);
          measureBeat = beatTime;
        }
        this.cuedSounds.addToTail(cuedSound);
        soundData.forEach((sound) => {
          const adjDuration = Math.round(sound.duration * timeRatio) + 150;
          for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
            const freq = sound.frequencies[i];
            const params = this.audioDefaults;
            params.frequency = freq;
            params.duration = adjDuration;
            params.gain = sound.volume;
            params.instrument = sound.instrument;
            params.useReverb = this.score.audioSettings.reverbEnable;
            if (this.score.audioSettings.playerType === 'synthesizer') {
              params.wavetable = SynthWavetable;
              params.waveform = this.score.audioSettings.waveform;
              cuedSound.oscs.push(new SuiWavetable(params));
            } else {
              cuedSound.oscs.push(new SuiSampler(params));
            }
          }
        });
        if (j + 1 < keys.length) {
          const diff = (keys[j + 1] - keys[j]);
          cuedSound.waitTime = diff * timeRatio;
          measureBeat += diff;
        } else if (measureIndex + 1 < maxMeasures) {
          // If the next measure, calculate the frequencies for the next track.
          this.cuedSounds.cueMeasureIndex += 1;
          cuedSound.waitTime = endTicks * timeRatio;
        } else {
          this.cuedSounds.complete = true;
        }
      // }, 1);
    }
  }
  populateSounds(measureIndex: number) {
    if (!SuiAudioPlayer.playing) {
      return;
    }
    const interval = 20;
    let draining = false;
    const buffer = SuiAudioPlayer.audioBufferSize;
    const timer = setInterval(() => {
      if (this.cuedSounds.complete || SuiAudioPlayer.playing === false) {
        clearInterval(timer);
        return;
      }
      if (this.cuedSounds.paramLinkHead === null) {
        this.cuedSounds.complete = true;
        return;
      }
      if (draining && this.cuedSounds.soundCount > buffer / 4) {
        return;
      }
      if (this.cuedSounds.soundCount > buffer) {
        draining = true;
        return;
      }
      draining = false;
      this.createCuedSound(measureIndex);
      measureIndex += 1;
    }, interval);
  }
  playSounds() {
    this.cuedSounds.playMeasureIndex = 0;
    this.cuedSounds.playWaitTimer = 0;
    const timer = () => {
      setTimeout(() => {
        const cuedSound = this.cuedSounds.advanceHead();
        if (cuedSound === null) {
          SuiAudioPlayer._playing = false;
          this.tracker.clearMusicCursor();
          return;
        }
        if (SuiAudioPlayer._playing === false) {
          this.tracker.clearMusicCursor();
          return;
        }
        SuiAudioPlayer._playChord(cuedSound.oscs);
        this.tracker.musicCursor(cuedSound.selector,
          cuedSound.offsetPct, cuedSound.durationPct);
        this.cuedSounds.playMeasureIndex += 1;
        this.cuedSounds.playWaitTimer = cuedSound.waitTime;
        timer();
      }, this.cuedSounds.playWaitTimer);
    }
    timer();
  }
  playAfter(milliseconds: number, oscs: SuiOscillator[]) {
    setTimeout(() => {
      SuiAudioPlayer._playChord(oscs);
    }, milliseconds)
  }
  startPlayer(measureIndex: number) {
    this.openTies = {};
    this.cuedSounds.reset();
    this.cuedSounds.cueMeasureIndex = measureIndex;
    this.cuedSounds.playMeasureIndex = this.cuedSounds.cueMeasureIndex;
    this.cuedSounds.paramLinkHead = null;
    this.cuedSounds.paramLinkTail = null;
    const endMeasure = this.score.staves[0].measures.length;
    let i = 0;
    for (i = this.cuedSounds.cueMeasureIndex; i < endMeasure; ++i) {
      const { endTicks, measureNotes } = this.getNoteSoundData(i);
      const node = {
        soundParams: measureNotes,
        endTicks,
        next: null
      };
      if (this.cuedSounds.paramLinkHead === null) {
        this.cuedSounds.paramLinkHead = node;
        this.cuedSounds.paramLinkTail = node;
      } else {
        this.cuedSounds.paramLinkTail!.next = node;
        this.cuedSounds.paramLinkTail = this.cuedSounds.paramLinkTail!.next;
      }
    }
    setTimeout(() => {
      this.populateSounds(measureIndex);
    }, 1);
    const bufferThenPlay = () => {
       setTimeout(() => {
        if (this.cuedSounds.soundListLength >= SuiAudioPlayer.audioBufferSize || this.cuedSounds.complete) {
          this.playSounds();
        } else {
          bufferThenPlay();
        }
       }, 50);
    }
    bufferThenPlay();
  }

  static stopPlayer() {
    if (SuiAudioPlayer._playingInstance) {
      const a = SuiAudioPlayer._playingInstance;
      a.tracker.clearMusicCursor();
      a.paused = false;
      a.cuedSounds.reset();
    }
    SuiAudioPlayer.playing = false;
  }

  static get playingInstance() {
    if (!SuiAudioPlayer._playingInstance) {
      return null;
    }
    return SuiAudioPlayer._playingInstance;
  }

  // the oscAr contains an oscillator for each pitch in the chord.
  // each inner oscillator is a promise, the combined promise is resolved when all
  // the beats have completed.
  static _playChord(oscAr: SuiOscillator[]) {
    var par: Promise<void>[] = [];
    oscAr.forEach((osc) => {
      par.push(osc.play());
    });
    return Promise.all(par);
  }

  // Starts the player.
  play() {
    let i = 0;
    if (SuiAudioPlayer.playing) {
      return;
    }
    SuiAudioPlayer._playingInstance = this;
    SuiAudioPlayer.playing = true;
    const startIndex = this.tracker.getFirstMeasureOfSelection()?.measureNumber.measureIndex ?? 0;
    //for (i = this.startIndex; i < this.score.staves[0].measures.length; ++i) {
    //   this.tracks.push(SuiAudioPlayer.getTrackSounds(this.audio.tracks, i));
    // }
    // const sounds = SuiAudioPlayer.getTrackSounds(this.audio.tracks, this.startIndex);
    // this.playSoundsAtOffset(sounds, 0);
    this.startPlayer(startIndex);
  }
}
