// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { suiAudioPitch, suiSampler } from './oscillator';
import { SmoAudioScore } from '../../smo/xform/audioTrack';

// ## suiAudioPlayer
// Play the music, ja!
export class suiAudioPlayer {
  static set playing(val) {
    suiAudioPlayer._playing = val;
  }

  static get instanceId() {
    if (typeof(suiAudioPlayer._instanceId) === 'undefined') {
      suiAudioPlayer._instanceId = 0;
    }
    return suiAudioPlayer._instanceId;
  }
  static incrementInstanceId() {
    const id = suiAudioPlayer.instanceId + 1;
    suiAudioPlayer._instanceId = id;
    return id;
  }
  static get playing() {
    if (typeof(suiAudioPlayer._playing) === 'undefined') {
      suiAudioPlayer._playing = false;
    }
    return suiAudioPlayer._playing;
  }

  static pausePlayer() {
    if (suiAudioPlayer._playingInstance) {
      const a = suiAudioPlayer._playingInstance;
      a.paused = true;
    }
    suiAudioPlayer.playing = false;
  }
  static getMeasureSounds(track, measureIndex) {
    const notes = track.notes.filter((nn) => nn.selector.measure === measureIndex);
    const trackSounds = [];
    notes.forEach((note) => {
      const noteSound = {
        frequencies: [],
        duration: note.duration,
        offset: note.offset,
        volume: note.volume,
        noteType: note.noteType
      };
      if (note.noteType === 'n') {
        note.pitches.forEach((pitch) => {
          noteSound.frequencies.push(suiAudioPitch.smoPitchToFrequency(pitch, 0, 0, []));
        });
      }
      trackSounds.push(noteSound);
    });
    return trackSounds;
  }
  // ### getTrackSounds
  // convert track data to frequency/volume
  static getTrackSounds(tracks, measureIndex) {
    const offsetSounds = {};
    tracks.forEach((track) => {
      const measureSounds = suiAudioPlayer.getMeasureSounds(track, measureIndex);
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
  // ### playSoundsAtOffset
  // Play the track data at the current measure, the tick offset is specified.
  playSoundsAtOffset(sounds, offsetIndex) {
    let complete = false;
    let waitTime = 0;
    let i = 0;
    const audio = this.audio;
    const tracker = this.tracker;
    const measureIndex = this.startIndex;
    if (!suiAudioPlayer.playing) {
      return;
    }
    const tracks = audio.tracks;
    const tempo = audio.tempoMap[measureIndex];
    const soundData = sounds.offsetSounds[sounds.offsets[offsetIndex]];
    const maxMeasures = tracks[0].lastMeasure;
    const oscs = [];
    // Update the music cursor
    tracker.musicCursor({ staff: 0, measure: measureIndex, voice: 0, tick: offsetIndex });
    // Create oscillators for each pitch in the chord.
    soundData.forEach((sound) => {
      for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
        const freq = sound.frequencies[i];
        const beats = sound.duration / 4096;
        const adjDuration = Math.round((beats / tempo) * 60000) + 150;
        const osc = new suiSampler({ frequency: freq, duration: adjDuration, gain: sound.volume });
        oscs.push(osc);
      }
    });
    // Play the chords and dispose when done.
    if (oscs.length) {
      suiAudioPlayer._playChord(oscs);
    }
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
      sounds = suiAudioPlayer.getTrackSounds(audio.tracks, this.startIndex);
      offsetIndex = 0;
    } else {
      complete = true;
    }
    // Decide how long to wait until the next sound in the chord.
    waitTime = ((waitTime / 4096) / tempo) * 60000;
    setTimeout(() => {
      if (!complete) {
        this.playSoundsAtOffset(sounds, offsetIndex);
      } else {
        tracker.clearMusicCursor();
        suiAudioPlayer.playing = false;
      }
    }, waitTime);
  }
  static stopPlayer() {
    if (suiAudioPlayer._playingInstance) {
      const a = suiAudioPlayer._playingInstance;
      a.tracker.clearMusicCursor();
      a.paused = false;
    }
    suiAudioPlayer.playing = false;
  }

  static get playingInstance() {
    if (!suiAudioPlayer._playingInstance) {
      return null;
    }
    return suiAudioPlayer._playingInstance;
  }

  // the oscAr contains an oscillator for each pitch in the chord.
  // each inner oscillator is a promise, the combined promise is resolved when all
  // the beats have completed.
  static _playChord(oscAr) {
    var par = [];
    oscAr.forEach((osc) => {
      par.push(osc.play());
    });
    return Promise.all(par);
  }

  // Starts the player.
  play() {
    if (suiAudioPlayer.playing) {
      return;
    }
    suiAudioPlayer._playingInstance = this;
    suiAudioPlayer.playing = true;
    const sounds = suiAudioPlayer.getTrackSounds(this.audio.tracks, this.startIndex, this.tempoMap[0]);
    this.playSoundsAtOffset(sounds, 0);
  }

  constructor(parameters) {
    this.instanceId = suiAudioPlayer.incrementInstanceId();
    suiAudioPlayer.playing = false;
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
}
