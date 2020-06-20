
var AudioContext = window.AudioContext || window.webkitAudioContext;

// ## suiAudioPitch
// helper class to compute the frequencies of the notes.
class suiAudioPitch {
    // ### _frequencies
    // Compute the equal-temperment frequencies of the notes.
    static get _frequencies() {
        var map={};
        var letter='a';
        const octaves=[1,2,3,4,5,6,7];
        const letters = ["cn","c#", "dn", "d#","en", "fn", "f#","gn","g#","an", "a#","bn"];
        const lindex = [0,1,2,3,4,5,6];

        const just = Math.pow(2,(1.0/12));
        const baseFrequency=(440/16) * Math.pow(just,3);

        var aaccum = baseFrequency;

        octaves.forEach((octave) => {
            var oint = parseInt(octave);
            var base = baseFrequency*Math.pow(2,oint);
            var lix = 0;
            letters.forEach((letter) => {
                var freq = base*Math.pow(just,lix);
                var enharmonics = smoMusic.getEnharmonics(letter);
                enharmonics.forEach((en) => {
                  // Adjust for B4 higher than C4
                  const adjOctave = (letter[0] === 'b' && en[0] === 'c') ?
                     octave + 1: octave;
                  map[en+adjOctave.toString()] = freq;
                });
                lix += 1;
            });
        });

        return map;
    }

    static get pitchFrequencyMap() {
        suiAudioPitch._pmMap = typeof(suiAudioPitch['_pmMap']) == 'undefined' ? suiAudioPitch._frequencies : suiAudioPitch._pmMap;
        return suiAudioPitch._pmMap;
    }

  static _rawPitchToFrequency(smoPitch,offset) {
    var npitch = smoMusic.smoIntToPitch(smoMusic.smoPitchToInt(smoPitch) + offset);
    var vx = npitch.letter.toLowerCase() + npitch.accidental + npitch.octave.toString();
    return suiAudioPitch.pitchFrequencyMap[vx];
  }

  static smoPitchToFrequency(smoNote,smoPitch,ix,offset) {

    var rv = suiAudioPitch._rawPitchToFrequency(smoPitch,-1 * offset);
    var mt = smoNote.tones.filter((tt) => tt.pitch == ix);
    if (mt.length) {
      var tone = mt[0];
      var coeff = tone.toPitchCoeff;
      var pitchInt = smoMusic.smoPitchToInt(smoPitch);
      pitchInt += (coeff > 0) ? 1 : -1;
      var otherSmo = smoMusic.smoIntToPitch(pitchInt);
      var otherPitch = suiAudioPitch._rawPitchToFrequency(otherSmo);
      rv += Math.abs(rv - otherPitch)*coeff;
    }
    return rv;
  }
}


class suiReverb {
    static get defaults() {
        return {length:0.5,
        decay:2.0 };
    }

    connect(destination) {
        this.output.connect(destination);
    }

    disconnect() {
        this.output.disconnect();
    }


    // credit: https://github.com/nick-thompson
    _buildImpulse() {
        if (suiReverb['impulse']) {
            this.input.buffer = suiReverb['impulse'];
            return;
        }

         var rate = this._context.sampleRate
           , length = rate * this.length
           , decay = this.decay
           , impulse = this._context.createBuffer(2, length, rate)
           , impulseL = impulse.getChannelData(0)
           , impulseR = impulse.getChannelData(1)
           , n, i;

         for (i = 0; i < length; i++) {
           n = this.reverse ? length - i : i;
           impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
           impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
         }
         suiReverb['impulse'] = impulse;

         this.input.buffer = impulse;
    }

    constructor(context) {
        this.input = this.output = context.createConvolver();
        this.length = suiReverb.defaults.length;
        this.decay = suiReverb.defaults.decay;
        this._context = context;
        this._buildImpulse();
    }
}
class suiOscillator {
    static get defaults() {

        var obj = {
            duration:1000,
            frequency:440,
            attackEnv:0.05,
            decayEnv:0.4,
            sustainEnv:0.45,
            releaseEnv:0.1,
            sustainLevel:0.4,
            releaseLevel:0.1,
            waveform:'custom',
            gain:0.1
        };

        var wavetable = {
            real:[0,
                0.3,0.3,0,0,0,
                0.1,0,0,0,0,
                0.05,0,0,0,0,
                0.01,0,0,0,0,
                0.01,0,0,0,0,
                0,0,0,0,0,
                0,0],
            imaginary:[0,
                0,0.05,0,0,0,
                0,0.01,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0,0,0,0,
                0,0]
        }
        obj.wavetable = wavetable;
        return obj;
    }

    static playSelectionNow(selection,gain) {
        // In the midst of re-rendering...
        if (!selection.note) {
            return;
        }
        setTimeout(function() {
        var ar = suiOscillator.fromNote(selection.measure,selection.note,true,gain);
        ar.forEach((osc) => {
            osc.play();
        });
        },1);
    }

    // AR contains an array of arrays of oscillators.
    // The outer array contains an array for each tick/note in a measure.
    // the inner array contains an oscillator for each note in the chord.
    static playOscillatorArray(ar) {
        function playIx(ix,oscAr) {
            var par = [];
            oscAr.forEach((osc) => {
                par.push(osc.play());
            });
            ix += 1;
            Promise.all(par).then(() => {
                if (ix < ar.length) {
                    playIx(ix,ar[ix]);
                }
            });
        }
        playIx(0,ar[0]);
    }

    static fromNote(measure,note,isSample,gain) {
        var tempo = measure.getTempo();
        var offset = -1 * measure.transposeIndex;
        tempo = tempo ? tempo : new SmoTempoText();
        var bpm = tempo.bpm;
        var beats = note.tickCount/4096;
        var duration = (beats / bpm) * 60000;

        // adjust if bpm is over something other than 1/4 note
        duration = duration * (4096/tempo.beatDuration);
        if (isSample)
            duration = 250;


        var ar = [];
        gain = gain ? gain : 0.2;
        gain = gain/note.pitches.length
        if (note.noteType == 'r') {
            gain = 0.001;
        }
        var i = 0;
        note.pitches.forEach((pitch) => {
            var frequency = suiAudioPitch.smoPitchToFrequency(note,pitch,i, measure.transposeIndex);
            var osc = new suiOscillator({frequency:frequency,duration:duration,gain:gain});
            ar.push(osc);
            i += 1;
        });

        return ar;
    }

    static get attributes() {
        return ['duration','frequency','pitch','attackEnv','sustainEnv','decayEnv','releaseEnv','sustainLevel','releaseLevel','waveform','wavetable','gain'];
    }

    static get audio() {
        if (typeof (suiOscillator['_audio']) == 'undefined') {
            suiOscillator._audio = new AudioContext();
        }
        return suiOscillator._audio;
    }

    _playPromise(osc,duration,gain) {
        var audio = suiOscillator.audio;
        var promise = new Promise((resolve) => {
            osc.start(0);

            setTimeout(function() {
               // gain.gain.setTargetAtTime(0, audio.currentTime, 0.015);
                resolve();
            }, duration);


            setTimeout(function() {
               // gain.gain.setTargetAtTime(0, audio.currentTime, 0.015);
                osc.stop(0);
                osc.disconnect(gain);
                gain.disconnect(audio.destination);
            }, duration+500);
        });

        return promise;
    }

    static toFloatArray(ar) {
        var rv = new Float32Array(ar.length);
        for (var i=0;i<ar.length;++i) {
            rv[i] = ar[i];
        }

        return rv;
    }

    play() {

        var audio = suiOscillator.audio;
        var gain = audio.createGain();
        var osc = audio.createOscillator();

        gain.connect(this.reverb.input);
        this.reverb.connect(audio.destination);
        gain.gain.setValueAtTime(0.01, audio.currentTime);
        var attack = this.attack / 1000;
        var decay = this.decay/1000;
        var sustain = this.sustain/1000;
        var release = this.release/1000;
        gain.gain.exponentialRampToValueAtTime(this.gain, audio.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(this.sustainLevel*this.gain, audio.currentTime + attack + decay);
        gain.gain.exponentialRampToValueAtTime(this.releaseLevel*this.gain,audio.currentTime + attack + decay + sustain );
        gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime + attack + decay + sustain + release);
        if (this.waveform != 'custom') {
            osc.type = this.waveform;
        } else {
            var wave = audio.createPeriodicWave(suiOscillator.toFloatArray(this.wavetable.real), suiOscillator.toFloatArray(this.wavetable.imaginary),
               {disableNormalization: false});
            osc.setPeriodicWave(wave);
        }
        osc.frequency.value = this.frequency;
        osc.connect(gain);
        gain.connect(audio.destination);
        return this._playPromise(osc,this.duration,gain);
    }


    constructor(parameters) {
        parameters = parameters ? parameters : {};
		smoSerialize.serializedMerge(suiOscillator.attributes, suiOscillator.defaults, this);
		smoSerialize.serializedMerge(suiOscillator.attributes, parameters, this);
        this.reverb = new suiReverb(suiOscillator.audio);
        this.attack = this.attackEnv*this.duration;
        this.decay = this.decayEnv*this.duration;
        this.sustain = this.sustainEnv*this.duration;
        this.release = this.releaseEnv*this.duration;
        this.frequency = this.frequency/2;  // Overtones below partial

        // Note: having some trouble with FloatArray and wavetable on some browsers, so I'm not using it
        // use built-in instead
        if (parameters.waveform && parameters.waveform != 'custom') {
            this.waveform = parameters.waveform;
        } else {
            this.waveform='custom';
        }
    }
}
