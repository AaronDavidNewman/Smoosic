// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiOscillator, SuiSampler } from './oscillator';
import { SmoAudioScore } from '../../smo/xform/audioTrack';
import { SuiTracker } from '../sui/tracker';
import { SmoScore } from '../../smo/data/score';
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
  soundListLength = 0;
  playWaitTimer = 0;
  playMeasureIndex: number = 0; // index of the measure we are playing
  cueMeasureIndex: number = 0; // measure index we are populating
  complete: boolean = false;
  reset() {
    this.soundHead = null;
    this.soundTail = null;
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
  
  // TODO: use precreated tracks.  Right now it takes too long to create a whole score, we should 
  // try to pro-rate it as we play.  But if we do a measure at a time, there can be a noticable gap
  // between measures.
  instanceId: number;
  paused: boolean;
  tracker: SuiTracker;
  score: SmoScore;
  cuedSounds: CuedAudioContexts;
  audioDefaults = SuiOscillator.defaults;
  constructor(parameters: SuiAudioPlayerParams) {
    this.instanceId = SuiAudioPlayer.incrementInstanceId();
    SuiAudioPlayer.playing = false;
    this.paused = false;
    this.tracker = parameters.tracker;
    this.score = parameters.score;
    // Assume tempo is same for all measures
    this.cuedSounds = new CuedAudioContexts();
  }

  getNoteSounds(measureIndex: number) {
    const measureNotes: Record<number, SoundParams[]> = {};
    const measureTicks = this.score.staves[0].measures[0].getMaxTicksVoice();
    this.score.staves.forEach((staff) => {
      const measure = staff.measures[measureIndex];      
      measure.voices.forEach((voice) => {
        let curTick = 0;
        voice.notes.forEach((smoNote) => {
          const frequencies: number[] = [];
          const xpose = -1 * measure.transposeIndex;
          if (smoNote.noteType === 'n') {
            smoNote.pitches.forEach((pitch, pitchIx) => {
              const xpitch = SmoMusic.smoIntToPitch(
                SmoMusic.smoPitchToInt(pitch) + xpose);
              const mtone: SmoMicrotone | null = smoNote.getMicrotone(pitchIx) ?? null;
              frequencies.push(SmoAudioPitch.smoPitchToFrequency(xpitch, 0, mtone));
            });
          const duration = smoNote.tickCount;
          const volume = SmoAudioScore.volumeFromNote(smoNote, SmoAudioScore.dynamicVolumeMap.p);
          if (!measureNotes[curTick]) {
            measureNotes[curTick] = [];
          }
          measureNotes[curTick].push({
            frequencies,
            volume,
            offset: 0,
            noteType: smoNote.noteType,
            duration
          });
        }
        curTick += smoNote.tickCount;
        });
      });
    });
    const keys = Object.keys(measureNotes).map((x) => parseInt(x, 10));
    const max: number = keys.reduce((a, b) => a > b ? a : b);
    return { endTicks: measureTicks - max, measureNotes };
  }
  
  createCuedSound(measureIndex: number) {
    let i = 0;
    let j = 0;
    if (!SuiAudioPlayer.playing) {
      return null;
    }
    // TODO base on the selection start.
    const { endTicks, measureNotes } = this.getNoteSounds(measureIndex);
    const maxMeasures = this.score.staves[0].measures.length;
    const smoTemp = this.score.staves[0].measures[0].getTempo();
    const tempo = smoTemp.bpm * (smoTemp.beatDuration / 4096);
    const keys: number[] = [];
    Object.keys(measureNotes).forEach((key) => {
      keys.push(parseInt(key, 10));
    });
    // There is a key for each note in the measure.  The value is the number of ticks before that note is played
    for (j = 0; j < keys.length; ++j) {
      const beatTime = keys[j];
      const soundData = measureNotes[beatTime];
      const cuedSound: CuedAudioContext = { oscs: [], waitTime: 0, playMeasureIndex: measureIndex, playTickIndex: j };
      const tail = { sound: cuedSound, next: null };
      this.cuedSounds.soundListLength += 1;
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
    if (j + 1 < keys.length) {
        cuedSound.waitTime = (keys[j + 1] - keys[j]) * timeRatio;
      } else if (measureIndex + 1 < maxMeasures) {
        // If the next measure, calculate the frequencies for the next track.
        this.cuedSounds.cueMeasureIndex += 1;
        cuedSound.waitTime = endTicks * timeRatio;
      } else {
        this.cuedSounds.complete = true;
      }
    }
  }
  populateSounds(measureIndex: number) {
    if (!SuiAudioPlayer.playing) {
      return;
    }
    const interval = 10;
    const timer = setInterval(() => {
      if (this.cuedSounds.complete || SuiAudioPlayer.playing === false) {
        clearInterval(timer);
        return;
      }
      if (this.cuedSounds.soundListLength > 100) {
        return;
      }
      this.createCuedSound(measureIndex);
      measureIndex += 1;
    }, interval);
  }
  playSounds() {
    const interval = 5;
    let accum = 0;
    this.cuedSounds.playMeasureIndex = 0;
    this.cuedSounds.playWaitTimer = 0;
    const timer = setInterval(() => {
      if (this.cuedSounds.soundHead === null) {
        clearInterval(timer);
        return;
      }
      if (SuiAudioPlayer._playing === false) {
        clearInterval(timer);
        return;
      }
      const cuedSound = this.cuedSounds.soundHead.sound;
      if (accum + interval > this.cuedSounds.playWaitTimer) {
        SuiAudioPlayer._playChord(cuedSound.oscs);
        this.cuedSounds.soundHead = this.cuedSounds.soundHead.next;
        this.cuedSounds.soundListLength -= 1;
        this.tracker.musicCursor({ staff: 0, measure: cuedSound.playMeasureIndex, voice: 0, tick: cuedSound.playTickIndex, pitches: [] });
        this.cuedSounds.playMeasureIndex += 1;
        this.cuedSounds.playWaitTimer = cuedSound.waitTime;
        accum = 0;
      } else {
        accum += interval;
      }
    });
  }
  startPlayer(measureIndex: number) {
    // TODO: get start measure from selection
    this.cuedSounds.reset();
    this.cuedSounds.cueMeasureIndex = this.tracker.getFirstMeasureOfSelection()?.measureNumber.measureIndex ?? 0;
    this.cuedSounds.playMeasureIndex = this.cuedSounds.cueMeasureIndex;
    setTimeout(() => {
      this.populateSounds(measureIndex);
    }, 1);
    setTimeout(() => {
      this.playSounds();
    }, 500);
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
