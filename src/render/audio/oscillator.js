
var AudioContext = window.AudioContext || window.webkitAudioContext;

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
                    map[en+octave.toString()] = freq;
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
    
    static smoPitchToFrequency(smoPitch) {
        var vx = smoPitch.letter.toLowerCase() + smoPitch.accidental + smoPitch.octave.toString();
        return suiAudioPitch.pitchFrequencyMap[vx];
    }
}

class suiAudioPlayer {
    static get playingMode() {
        return {
            note:0,fromStart:1,fromSelection:2,range:3
        }
    }
    constructor(parameters) {
        this.playing=false;
        this.oscillators=[];
    }
    
    _playOscillatorRecurse(ix,oscAr) {
        var self=this;
        var par = [];
        oscAr.forEach((osc) => {
            par.push(osc.play());
        });
        ix += 1;
        Promise.all(par).then(() => {            
            if (self.playing && ix < self.oscillators.length) {
                self._playOscillatorRecurse(ix,self.oscillators[ix]);
            }
        });
    }
    play() {
        this._playOscillatorRecurse(0,this.oscillators[0]);
    }
}
class suiOscillator {
    static get defaults() {
        
        var obj = {
            
            duration:1000,
            frequency:440,
            attack:30,
            decay:100,
            sustain:100,
            sustainLevel:0.4,
            releaseLevel:0.01,
            waveform:'triangle',
            gain:0.4
        };
        
        var wavetable = {
            real:[0,1],
            imaginary:[0,0]
        }
        obj.wavetable = wavetable;
        return obj;
    }
    
    static playSelectionNow(selection) {
        setTimeout(function() {
        var ar = suiOscillator.fromSelection(selection);
        ar.forEach((osc) => {
            osc.play();
        });
        },1);
    }
    
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
    static playMeasureNow(selection) {
        setTimeout(function() {
        var voices = suiOscillator.measureOscillators(selection);
        voices.forEach((voice) => {
            suiOscillator.playOscillatorArray(voice);
        });
        },1);
    }
    static measureOscillators(selection) {
        var measure = selection.measure;
        var tempo = measure.getTempo();
        tempo = tempo ? tempo : new SmoTempoText();
        var tickTime = 60000/tempo.bpm;
        var voiceOsc = [];
        selection.measure.voices.forEach((voice) => {
            var ix = 0;
            var rv = [];
            voiceOsc.push(rv);
            voice.notes.forEach((note) => {
                var ss=JSON.parse(JSON.stringify(selection.selector));
                ss.tick=ix;
                var nsel = new SmoSelection({
									selector: ss,
									_staff: selection.staff,
									_measure: selection.measure,
									_note: note,
									_pitches: [],
								});
                
                rv.push(suiOscillator.fromSelection(nsel));
                ix += 1;
            });
        });
        
        return voiceOsc;
    }
    static fromSelection(selection) {
        var tempo = selection.measure.getTempo();
        tempo = tempo ? tempo : new SmoTempoText();
        var bpm = tempo.bpm;
        var beats = selection.note.tickCount/4096;
        var duration = (beats / bpm) * 60000;
        
        var ar = [];
        var gain = 0.5/selection.note.pitches.length; 
        selection.note.pitches.forEach((pitch) => {
            var frequency = suiAudioPitch.smoPitchToFrequency(pitch);
            var osc = new suiOscillator({frequency:frequency,duration:duration,gain:gain});
            ar.push(osc);
        });
        
        return ar;
    }
    
    static get attributes() {
        return ['duration','frequency','pitch','attack','sustain','decay','release','sustainLevel','releaseLevel','waveform','wavetable','gain'];
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
            osc.stop(0);
            osc.disconnect(gain);
            gain.disconnect(audio.destination);
            resolve();
        }, duration);
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

        gain.connect(audio.destination);
        gain.gain.setValueAtTime(0, audio.currentTime);
        var attack = this.attack / 1000;
        var decay = this.decay/1000;
        var sustain = this.sustain/1000;
        gain.gain.exponentialRampToValueAtTime(this.gain, audio.currentTime + attack);
        gain.gain.exponentialRampToValueAtTime(this.sustainLevel*this.gain, audio.currentTime + attack + decay);
        gain.gain.exponentialRampToValueAtTime(this.releaseLevel*this.gain,audio.currentTime + attack + decay + sustain );
        if (this.waveform != 'custom') {
            osc.type = this.waveform;
        } else {
            var wave = audio.createPeriodicWave(suiOscillator.toFloatArray(this.wavetable.real), suiOscillator.toFloatArray(this.wavetable.imaginary), 
               {disableNormalization: true});
            osc.setPeriodicWave(wave);
        }
        osc.frequency.value = this.frequency;
        osc.connect(gain);
        gain.connect(audio.destination);
        return this._playPromise(osc,this.duration,gain);
    }

   
    constructor(parameters) {
        parameters = parameters ? parameters : {};
		smoMusic.serializedMerge(suiOscillator.attributes, suiOscillator.defaults, this);
		smoMusic.serializedMerge(suiOscillator.attributes, parameters, this);
        
        // Note: having some trouble with FloatArray and wavetable on some browsers, so I'm not using it 
        // use built-in instead        
        if (parameters.waveform && parameters.waveform != 'custom') {
            this.waveform = parameters.waveform;
        } else {
            this.waveform='custom';
        }
        this.sustain = this.duration-(this.attack + this.release + this.decay);
        this.sustain = (this.sustain > 0) ? this.sustain : 0;
    }
}