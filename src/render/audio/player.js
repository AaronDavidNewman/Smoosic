

// ## suiAudioPlayer
// Play the music, ja!
class suiAudioPlayer {

  static set playing(val) {
      suiAudioPlayer._playing = val;
  }

  static get maxGain() {
      return 0.2;
  }

  static get instanceId() {
      if (typeof(suiAudioPlayer._instanceId) == 'undefined') {
          suiAudioPlayer._instanceId = 0;
      }
      return suiAudioPlayer._instanceId;
  }
  static incrementInstanceId() {
      var id = suiAudioPlayer.instanceId + 1;
      suiAudioPlayer._instanceId = id;
      return id;
  }
  static get playing() {
      if (typeof(suiAudioPlayer._playing) == 'undefined') {
          suiAudioPlayer._playing = false;
      }
      return suiAudioPlayer._playing;
  }

  static pausePlayer() {
      if (suiAudioPlayer._playingInstance) {
          var a = suiAudioPlayer._playingInstance;
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
      }
      if (note.noteType === 'n') {
        note.pitches.forEach((pitch) => {
          noteSound.frequencies.push(suiAudioPitch.smoPitchToFrequency(pitch, 0, 0, []));
        });
      }
      trackSounds.push(noteSound);
    });
    return trackSounds;
  }
  static getTrackSounds(tracks, measureIndex) {
    const offsetSounds = {};
    const trackLen = tracks.length;
    tracks.forEach((track) => {
      const measureSounds = suiAudioPlayer.getMeasureSounds(track, measureIndex);
      measureSounds.forEach((sound) => {
        if (!offsetSounds[sound.offset]) {
          offsetSounds[sound.offset] = [];
        }
        sound.volume = sound.volume / trackLen;
        offsetSounds[sound.offset].push(sound);
      });
    });
    const keys = Object.keys(offsetSounds);
    keys.sort((a, b) => parseInt(a) - parseInt(b));
    return {offsets: keys, offsetSounds };
  }
  static playSoundsAtOffset(audio, sounds, measureIndex, offsetIndex) {
    if (!suiAudioPlayer.playing) {
      return;
    }
    const tracks = audio.tracks;
    let complete = false;
    let waitTime = 0;
    const tempo = audio.tempoMap[measureIndex];
    const soundData = sounds.offsetSounds[sounds.offsets[offsetIndex]];
    const maxMeasures = tracks[0].lastMeasure;
    let nextSounds = sounds;
    const oscs = [];
    let i = 0;
    let duration = 0;
    soundData.forEach((sound) => {
      for (i = 0; i < sound.frequencies.length && sound.noteType === 'n'; ++i) {
        const freq = sound.frequencies[i];
        const beats = sound.duration / 4096;
        const adjDuration = (beats / tempo) * 60000;
        const osc = new suiOscillator({ frequency: freq, duration: adjDuration, gain: sound.volume });
        oscs.push(osc);
      }
    });
    if (oscs.length) {
      const promises = suiAudioPlayer._playChord(oscs);
    }
    if (sounds.offsets.length > offsetIndex + 1) {
      const nextOffset = parseInt(sounds.offsets[offsetIndex + 1], 10);
      waitTime = nextOffset - parseInt(sounds.offsets[offsetIndex], 10);
      offsetIndex += 1;
    } else if (measureIndex + 1 < maxMeasures) {
      waitTime = audio.measureBeats[measureIndex] - parseInt(sounds.offsets[offsetIndex], 10);
      measureIndex += 1;
      sounds = suiAudioPlayer.getTrackSounds(audio.tracks, measureIndex);
      offsetIndex = 0;
    } else {
      complete = true;
    }
    waitTime = ((waitTime / 4096) / tempo) * 60000;
    setTimeout(() => {
      if (!complete) {
        suiAudioPlayer.playSoundsAtOffset(audio, sounds, measureIndex, offsetIndex);
      } else {
        suiAudioPlayer.playing = false;
      }
    }, waitTime);
  }
  static stopPlayer() {
    if (suiAudioPlayer._playingInstance) {
      var a = suiAudioPlayer._playingInstance;
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

  _createOscillatorsFromMusicData(ar) {
      var rv = [];
      ar.forEach((soundData) => {
          var osc = new suiOscillator({frequency:soundData.frequency,duration:soundData.duration,gain:soundData.gain});
          // var osc = new suiSampler({frequency:soundData.frequency,duration:soundData.duration,gain:soundData.gain});
          rv.push(osc);
      });
      return rv;
  }
  _playArrayRecurse(ix,keys,notesToPlay) {
    if (!suiAudioPlayer.playing ||
      suiAudioPlayer.instanceId != this.instanceId) {
      this.tracker.clearMusicCursor();
      return;
    }
    var self = this;
    var key = keys[ix];
    var curTime = parseInt(key);
    var proto = notesToPlay[key];
    var oscs = this._createOscillatorsFromMusicData(proto);

    // Follow the top-staff note in this tick for the cursor
    // if (proto[0].selector.staff == 0) {
      this.tracker.musicCursor(proto[0].selector);
    // }
    if (ix < keys.length - 1) {
        var diff = parseInt(keys[ix+1]);
        var delay = (diff - curTime);
        setTimeout(function() {
            self._playArrayRecurse(ix+1,keys,notesToPlay);
        },delay);
    } else {
        self.tracker.clearMusicCursor();
    }
    suiAudioPlayer._playChord(oscs);
  }
  _playPlayArray() {
      var startTimes = Object.keys(this.sounds).sort((a,b) => {return parseInt(a) > parseInt(b);});
      if (startTimes.length < 1) {
        return;
      }
      this._playArrayRecurse(0,startTimes,this.sounds);
  }
  _populatePlayArray() {
      var maxGain = suiAudioPlayer.maxGain/this.score.staves.length;
      this.sounds = {};
      this.score.staves.forEach((staff)  => {
          var accumulator = 0;
          var slurs = [];
          for (var i = this.startIndex;i<staff.measures.length;++i) {
              var measure=staff.measures[i];
              var oldAccumulator = accumulator;
              var voiceIx = 0;
              measure.voices.forEach((voice) => {
                  var prevObj = null;
                  if (voiceIx != 0) {
                      accumulator = oldAccumulator;
                  }
                  var tick = 0;
                  voice.notes.forEach((note) => {
                      var tempo = measure.getTempo();
                      tempo = tempo ? tempo : new SmoTempoText();
                      var bpm = tempo.bpm;
                      var beats = note.tickCount/4096;
                      var duration = (beats / bpm) * 60000;

                      // adjust if bpm is over something other than 1/4 note
                      duration = duration * (4096/tempo.beatDuration);
                      var selector = {staff:measure.measureNumber.staffId,measure:measure.measureNumber.measureIndex,voice:voiceIx,tick:tick}

                      var gain = maxGain/note.pitches.length;
                      if (note.noteType == 'n') {
                          var pitchIx = 0;
                          note.pitches.forEach((pitch) => {
                              var frequency = suiAudioPitch.smoPitchToFrequency(pitch, pitchIx, -1 * measure.transposeIndex, note.getMicrotones());
                              var obj = {
                                  duration:duration,
                                  frequency: frequency,
                                  gain:gain,
                                  selector:selector,
                                  note:note,
                                  measure:measure,
                                  staff:staff
                              };
                              // Keep track of slurs, don't restart the note it is
                              // really a tie.  TODO:  deal with 1:1, 1:many etc.
                              staff.getSlursStartingAt(selector).forEach((slur) => {
                                  slurs.push({
                                      obj:obj,
                                      slur:slur
                                  });
                              });

                              var pitchTie = slurs.filter((slur) => {
                                  return (SmoSelector.sameNote(slur.slur.endSelector,selector) && slur.obj.frequency == frequency);
                              });
                              if (pitchTie.length) {
                                  pitchTie[0].obj.duration += obj.duration;
                              } else {
                                  if (this.sounds[accumulator]) {
                                      this.sounds[accumulator].push(obj);
                                  } else {
                                      this.sounds[accumulator]=[obj];
                                  }
                              }
                              pitchIx += 1;
                          });
                      }
                      accumulator += Math.round(duration);
                      tick += 1;
                  });
                  voiceIx += 1;
              });
          }
      });
  }

    play() {
      if (suiAudioPlayer.playing) {
        return;
      }
      suiAudioPlayer._playingInstance = this;
      // this._populatePlayArray();
      suiAudioPlayer.playing = true;
      const sounds = suiAudioPlayer.getTrackSounds(this.audio.tracks, this.startIndex, this.tempoMap[0]);
      suiAudioPlayer.playSoundsAtOffset(this.audio, sounds, this.startIndex, 0);
        // this._playPlayArray();
    }

    constructor(parameters) {
        this.instanceId = suiAudioPlayer.incrementInstanceId();
        suiAudioPlayer.playing=false;
        this.paused = false;
        this.startIndex = parameters.startIndex;
        this.playIndex = 0;
        this.tracker = parameters.tracker;
        this.score = parameters.score;
        const converter = new SmoAudioTrack(this.score, 4096);
        this.audio = converter.convert();
        // Assume tempo is same for all measures
        this.tempoMap = this.audio.tempoMap;
        // this._populatePlayArray();
    }
}
