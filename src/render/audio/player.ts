// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiAudioPitch, SuiOscillator, SuiSampler } from './oscillator';
import { SmoAudioScore, AudioTracks, SmoAudioTrack } from '../../smo/xform/audioTrack';
import { SuiTracker } from '../sui/tracker';
import { SmoScore } from '../../smo/data/score';

export interface NoteSound {
  frequencies: number[],
  duration: number,
  offset: number,
  volume: number,
  noteType: string
}
export interface SuiAudioPlayerParams {
  startIndex: number,
  tracker: SuiTracker,
  score: SmoScore,
}
export interface TrackSounds {
  offsetSounds: Record<number, NoteSound[]>,
  offsets: string[]
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
  static getMeasureSounds(track: SmoAudioTrack, measureIndex: number): NoteSound[] {
    const notes = track.notes.filter((nn) => nn.selector.measure === measureIndex);
    const trackSounds: NoteSound[] = [];
    notes.forEach((note) => {
      const noteSound: NoteSound = {
        frequencies: [],
        duration: note.duration,
        offset: note.offset,
        volume: note.volume,
        noteType: note.noteType
      };
      if (note.noteType === 'n') {
        note.pitches.forEach((pitch) => {
          noteSound.frequencies.push(SuiAudioPitch.smoPitchToFrequency(pitch, 0, 0, []));
        });
      }
      trackSounds.push(noteSound);
    });
    return trackSounds;
  }
  // ### getTrackSounds
  // convert track data to frequency/volume
  static getTrackSounds(tracks: SmoAudioTrack[], measureIndex: number): TrackSounds {
    const offsetSounds: Record<number, NoteSound[]> = {};
    tracks.forEach((track) => {
      const measureSounds = SuiAudioPlayer.getMeasureSounds(track, measureIndex);
      measureSounds.forEach((sound) => {
        if (!offsetSounds[sound.offset]) {
          offsetSounds[sound.offset] = [];
        }
        // sound.volume = sound.volume / (trackLen * 2);
        offsetSounds[sound.offset].push(sound);
      });
    });
    const keys = Object.keys(offsetSounds);
    keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    return { offsets: keys, offsetSounds };
  }
  // TODO: use precreated tracks.  Right now it takes too long to create a whole score, we should 
  // try to pro-rate it as we play.  But if we do a measure at a time, there can be a noticable gap
  // between measures.
  tracks: TrackSounds[] = [];
  instanceId: number;
  paused: boolean;
  startIndex: number;
  playIndex: number;
  tracker: SuiTracker;
  score: SmoScore;
  audio: AudioTracks;
  tempoMap: number[];
  constructor(parameters: SuiAudioPlayerParams) {
    this.instanceId = SuiAudioPlayer.incrementInstanceId();
    SuiAudioPlayer.playing = false;
    this.paused = false;
    this.startIndex = parameters.startIndex;
    this.playIndex = 0;
    this.tracker = parameters.tracker;
    this.score = parameters.score;
    const converter = new SmoAudioScore(this.score, 4096);
    this.audio = converter.convert();
    // Assume tempo is same for all measures
    this.tempoMap = this.audio.tempoMap;
  }

  // ### playSoundsAtOffset
  // Play the track data at the current measure, the tick offset is specified.
  playSoundsAtOffset(sounds: TrackSounds, offsetIndex: number) {
    let complete = false;
    let waitTime = 0;
    let i = 0;
    const audio = this.audio;
    const tracker = this.tracker;
    const measureIndex = this.startIndex;
    if (!SuiAudioPlayer.playing) {
      return;
    }
    const tracks = audio.tracks;
    const tempo = audio.tempoMap[measureIndex];
    const soundData = sounds.offsetSounds[(sounds.offsets[offsetIndex] as any) as number];
    const maxMeasures = tracks[0].lastMeasure;
    const oscs: SuiOscillator[] = [];
    // Update the music cursor
    const ts = new Date().valueOf();
    tracker.musicCursor({ staff: 0, measure: measureIndex, voice: 0, tick: offsetIndex, pitches: [] });
    // Create oscillators for each pitch in the chord.
    soundData.forEach((sound) => {
      for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
        const freq = sound.frequencies[i];
        const beats = sound.duration / 4096;
        const adjDuration = Math.round((beats / tempo) * 60000) + 150;
        const params = SuiOscillator.defaults;
        params.frequency = freq;
        params.duration = adjDuration;
        params.gain = sound.volume;
        const osc = new SuiSampler(params);
        oscs.push(osc);
      }
    });
    // Play the chords and dispose when done.
    if (oscs.length) {
      SuiAudioPlayer._playChord(oscs);
    }
    setTimeout(() => {
      // Decide what the next note will be on this track - either another note in this
      // measure, or the first note in next measure.
      if (sounds.offsets.length > offsetIndex + 1) {
        const nextOffset = parseInt(sounds.offsets[offsetIndex + 1], 10);
        waitTime = nextOffset - parseInt(sounds.offsets[offsetIndex], 10);
        offsetIndex += 1;
      } else if (measureIndex + 1 < maxMeasures) {
        // If the next measure, calculate the frequencies for the next track.
        waitTime = audio.measureBeats[measureIndex] - parseInt(sounds.offsets[offsetIndex], 10);
        this.startIndex += 1;
        this.playIndex += 1;
        sounds = SuiAudioPlayer.getTrackSounds(audio.tracks, this.startIndex);
        // sounds = this.tracks[this.playIndex];
        offsetIndex = 0;
      } else {
        complete = true;
      }
      // Decide how long to wait until the next sound in the chord.
      const elapsed = new Date().valueOf() - ts;
      console.log('measure elapsed ' + elapsed)
      waitTime = (((waitTime - elapsed) / 4096) / tempo) * 60000;
      setTimeout(() => {
        if (!complete) {
          this.playSoundsAtOffset(sounds, offsetIndex);
        } else {
          tracker.clearMusicCursor();
          SuiAudioPlayer.playing = false;
        }
      }, waitTime);
    }, 1);
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
    //for (i = this.startIndex; i < this.score.staves[0].measures.length; ++i) {
    //   this.tracks.push(SuiAudioPlayer.getTrackSounds(this.audio.tracks, i));
    // }
    this.playIndex = 0;
    const sounds = SuiAudioPlayer.getTrackSounds(this.audio.tracks, this.startIndex);
    this.playSoundsAtOffset(sounds, 0);
  }
}
