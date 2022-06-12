// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiOscillator, SuiSampler } from './oscillator';
import { SmoAudioScore } from '../../smo/xform/audioTrack';
import { SuiTracker } from '../sui/tracker';
import { SmoScore } from '../../smo/data/score';
import { SmoSelector } from '../../smo/xform/selections';
import { SmoTie } from '../../smo/data/staffModifiers';
import { SmoMicrotone } from '../../smo/data/noteModifiers';
import { SmoMusic, SmoAudioPitch } from '../../smo/data/music';

export interface SuiAudioPlayerParams {
  startIndex: number,
  tracker: SuiTracker,
  score: SmoScore,
}
export interface SoundParams {
  frequencies: number[],
  duration: number,
  offset: number,
  volume: number,
  noteType: string
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
  waitTime: number
}
export interface CuedAudioLink {
  sound: CuedAudioContext;
  next: CuedAudioLink | null;
}
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
  reset() {
    this.soundHead = null;
    this.soundTail = null;
    this.paramLinkHead = null;
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
    SuiAudioPlayer.playing = false;
    this.paused = false;
    this.tracker = parameters.tracker;
    this.score = parameters.score;
    // Assume tempo is same for all measures
    this.cuedSounds = new CuedAudioContexts();
  }

  getNoteSoundData(measureIndex: number) {
    const measureNotes: Record<number, SoundParams[]> = {};
    let measureTicks = this.score.staves[0].measures[measureIndex].getMaxTicksVoice();
    const freqDuplicates: Record<number, Record<number, boolean>> = {};
    this.score.staves.forEach((staff, staffIx) => {
      const measure = staff.measures[measureIndex];
      measure.voices.forEach((voice, voiceIx) => {
        let curTick = 0;
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
              }
              const freqBeat = freqDuplicates[curTick];
              if (!freqBeat[freqRound]) {
                freqBeat[freqRound] = true;
                frequencies.push(freq);
              }
            });
            const duration = smoNote.tickCount;
            const volume = SmoAudioScore.volumeFromNote(smoNote, SmoAudioScore.dynamicVolumeMap.p);
            if (!measureNotes[curTick]) {
              measureNotes[curTick] = [];
            }
            const soundData: SoundParams = {
              frequencies,
              volume,
              offset: 0,
              noteType: smoNote.noteType,
              duration
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
          curTick += smoNote.tickCount;
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
      // setTimeout(() => {
        const beatTime = keys[j];
        const soundData = measureNotes[beatTime];
        const cuedSound: CuedAudioContext = { oscs: [], waitTime: 0, playMeasureIndex: measureIndex, playTickIndex: j };
        const tail = { sound: cuedSound, next: null };
        if (this.cuedSounds.soundTail === null) {
          this.cuedSounds.soundTail = tail;
          this.cuedSounds.soundHead = tail;
        } else {
          this.cuedSounds.soundTail.next = { sound: cuedSound, next: null };
          this.cuedSounds.soundTail = this.cuedSounds.soundTail.next;
        }
        const timeRatio = 60000 / (tempo * 4096);
        soundData.forEach((sound) => {
          for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
            const freq = sound.frequencies[i];
            const adjDuration = Math.round(sound.duration * timeRatio) + 150;
            const params = this.audioDefaults;
            params.frequency = freq;
            params.duration = adjDuration;
            params.gain = sound.volume;
            const osc = new SuiSampler(params);
            cuedSound.oscs.push(osc);
          }
        });
        this.cuedSounds.soundListLength += cuedSound.oscs.length;
        if (j + 1 < keys.length) {
          cuedSound.waitTime = (keys[j + 1] - keys[j]) * timeRatio;
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
      if (draining && this.cuedSounds.soundListLength > buffer / 4) {
        return;
      }
      if (this.cuedSounds.soundListLength > buffer) {
        draining = true;
        return;
      }
      draining = false;
      this.createCuedSound(measureIndex);
      measureIndex += 1;
    }, interval);
  }
  playSounds() {
    let accum = 0;
    this.cuedSounds.playMeasureIndex = 0;
    this.cuedSounds.playWaitTimer = 0;
    const timer = () => {
      setTimeout(() => {
        if (this.cuedSounds.soundHead === null) {
          SuiAudioPlayer._playing = false;
          return;
        }
        if (SuiAudioPlayer._playing === false) {
          return;
        }
        const cuedSound = this.cuedSounds.soundHead.sound;
        SuiAudioPlayer._playChord(cuedSound.oscs);
        this.cuedSounds.soundHead = this.cuedSounds.soundHead.next;
        this.cuedSounds.soundListLength -= cuedSound.oscs.length;
        this.tracker.musicCursor({ staff: 0, measure: cuedSound.playMeasureIndex, voice: 0, tick: cuedSound.playTickIndex, pitches: [] });
        this.cuedSounds.playMeasureIndex += 1;
        this.cuedSounds.playWaitTimer = cuedSound.waitTime;
        accum = 0;
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
    this.cuedSounds.cueMeasureIndex = this.tracker.getFirstMeasureOfSelection()?.measureNumber.measureIndex ?? 0;
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
