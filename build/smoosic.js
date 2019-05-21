
VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

/**
 * Utilities I wish were in VF.Music but aren't
 **/
class vexMusic {

    // ## getKeyOffset
    // ## Description:  given a vex noteProp and an offset, offset that number
    // of 1/2 steps.
    // ### Input:  smoPitch
    // ### Output:  smoPitch offset, not key-adjusted.
    static getKeyOffset(pitch, offset) {
        var canon = VF.Music.canonical_notes;

        // Convert to vex keys, where f# is a string like 'f#'.
        var vexKey = pitch.letter.toLowerCase();
        if (pitch.accidental.length === 0) {
            vexKey = vexKey + 'n';
        } else {
            vexKey = vexKey + pitch.accidental;
        }
        vexKey = canon[VF.Music.noteValues[vexKey].int_val];
        var rootIndex = canon.indexOf(vexKey);
        var index = (rootIndex + canon.length + offset) % canon.length;
        var octave = pitch.octave;
        if (Math.abs(offset) >= 12) {
            var octaveOffset = Math.sign(offset) * Math.round(Math.abs(offset) / 12);
            octave += octaveOffset;
            offset = offset % 12;
        }
        if (rootIndex + offset >= canon.length) {
            octave += 1;
        }
        if (rootIndex + offset < 0) {
            octave -= 1;
        }
        var rv = JSON.parse(JSON.stringify(pitch));
        vexKey = canon[index];
        if (vexKey.length > 1) {
            rv.accidental = vexKey.substring(1);
            vexKey = vexKey[0];
        } else {
            rv.accidental = '';
        }
        rv.letter = vexKey;
        rv.octave = octave;
        return rv;
    }

    // ## keySignatureLength
    // ## Description:
    // return the number of sharp/flat in a key signature for sizing guess.
    static get keySignatureLength() {
        return {
            'C': 0,
            'B': 5,
            'A': 3,
            'F#': 6,
            'Bb': 2,
            'Ab': 4,
            'Gg': 6,
            'G': 1,
            'F': 1,
            'Eb': 3,
            'Db': 5,
            'Cb': 7,
            'C#': 7,
            'F#': 6,
            'E': 4,
            'D': 2
        };
    }

    // ### getKeySignatureKey
    // ### Description:
    // given a letter pitch (a,b,c etc.), and a key signature, return the actual note
    // that you get without accidentals
    // ### Usage:
    //   vexMusic.getKeySignatureKey('F','G'); // returns f#
    // TODO: move to smoPitch
    static getKeySignatureKey(letter, keySignature) {
        var km = new VF.KeyManager(keySignature);
        return km.scaleMap[letter];
    }

    // ### Description:
    // Get ticks for this note with an added dot.  Return
    // identity if that is not a supported value.
    static getNextDottedLevel(ticks) {
        var ttd = vexMusic.ticksToDuration;
        var vals = Object.values(ttd);

        var ix = vals.indexOf(ttd[ticks]);
        if (ix >= 0 && ix < vals.length && vals[ix][0] == vals[ix + 1][0]) {
            return vexMusic.durationToTicks(vals[ix + 1]);
        }
        return ticks;
    }

    // ### Description:
    // Get ticks for this note with one fewer dot.  Return
    // identity if that is not a supported value.
    static getPreviousDottedLevel(ticks) {
        var ttd = vexMusic.ticksToDuration;
        var vals = Object.values(ttd);
        var ix = vals.indexOf(ttd[ticks]);
        if (ix > 0 && vals[ix][0] == vals[ix - 1][0]) {
            return vexMusic.durationToTicks(vals[ix - 1]);
        }
        return ticks;
    }

    // ### ticksToDuration
    // ### Description:
    // Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.
    static get ticksToDuration() {
        var durations = ["1/2", "1", "2", "4", "8", "16", "32", "64", "128", "256"];
        var ticksToDuration = {};
        var _ticksToDurations = function () {
            for (var i = 0; i < durations.length - 1; ++i) {
                var dots = '';
                var ticks = 0;

                // We support up to 4 'dots'
                for (var j = 0; j < 4 && j + i < durations.length; ++j) {
                    ticks += VF.durationToTicks.durations[durations[i + j]];
                    ticksToDuration[ticks.toString()] = durations[i] + dots;
                    dots += 'd'
                }
            }
            return ticksToDuration;
        }
        _ticksToDurations();
        return ticksToDuration;
    };

    // ## durationToTicks
    // Uses VF.durationToTicks, but handles dots.
    static durationToTicks(duration) {
        var dots = duration.indexOf('d');
        if (dots < 0) {
            return VF.durationToTicks(duration);
        } else {
            var vfDuration = VF.durationToTicks(duration.substring(0, dots));
            dots = duration.length - dots; // number of dots
            var split = vfDuration / 2;
            for (var i = 0; i < dots; ++i) {
                vfDuration += split;
                split = split / 2;
            }

            return vfDuration;
        }
    }

    // ## enharmonics
    // ## Description:
    // return a map of enharmonics for choosing.  notes are in vexKey form.
    static get enharmonics() {
        var rv = {};
        var keys = Object.keys(VF.Music.noteValues);
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            var int_val = VF.Music.noteValues[key].int_val;
            if (typeof(rv[int_val.toString()]) == 'undefined') {
                rv[int_val.toString()] = [];
            }
            // only consider natural note 1 time.  It is in the list twice for some reason.
            if (key.indexOf('n') == -1) {
                rv[int_val.toString()].push(key);
            }
        }
        return rv;
    }

   
    // ### getEnharmonic(noteProp)
    // ###   cycle through the enharmonics for a note.
    static getEnharmonic(key) {
        var intVal = VF.Music.noteValues[key.toLowerCase()].int_val;
        var ar = vexMusic.enharmonics[intVal.toString()];
        var len = ar.length;
        var ix = ar.indexOf(key);
        key = ar[(ix + 1) % len];
        return key;
    }
    // ## getKeyFriendlyEnharmonic
    // ### Description:
    // fix the enharmonic to match the key, if possible
	// ## Usage: 
	// getKeyFriendlyEnharmonic('b','eb');  // returns 'bb'
    static getKeyFriendlyEnharmonic(letter, keySignature) {
        var rv = letter;
        var muse = new VF.Music();
        var scale = Object.values(muse.createScaleMap(keySignature));
        var prop = vexMusic.getEnharmonic(letter.toLowerCase());
        while (prop.toLowerCase() != letter.toLowerCase()) {
            for (var i = 0; i < scale.length; ++i) {
                var skey = scale[i];
                if ((skey[0] == prop && skey[1] == 'n') ||
                    (skey.toLowerCase() == prop.toLowerCase())) {
                    rv = skey;
                    break;
                }
            }
            prop = (prop[1] == 'n' ? prop[0] : prop);
            prop = vexMusic.getEnharmonic(prop);
        }
        return rv;
    }

    // ## getIntervalInKey
	// ## Description:
	// give a pitch and a key signature, return another pitch at the given 
	// diatonic interval.  Similar to getKeyOffset but diatonic.
    static getIntervalInKey(pitch, keySignature, interval) {
        var muse = new VF.Music();
        var letter = pitch.letter;
        var scale = Object.values(muse.createScaleMap(keySignature));

        var up = interval > 0 ? true : false;
        var interval = interval < 0 ? scale.length - (interval * -1) : interval;

        var ix = scale.findIndex((x) => {
                return x[0] == letter[0];
            });
        if (ix >= 0) {
            var nletter = scale[(ix + interval) % scale.length];
            var nkey = {
                letter: nletter[0],
                accidental: nletter[1],
                octave: pitch.octave
            };
            if (up) {
                nkey.octave += 1;
            }
            return nkey;
        }
        return letter;
    }

    static filteredMerge(attrs, src, dest) {
        attrs.forEach(function (attr) {
            if (src[attr]) {
                dest[attr] = src[attr];
            }
        });
    }
}
;

class svgHelpers {
    static unionRect(b1, b2) {
        var x = Math.min(b1.x, b2.x);
        var y = Math.min(b1.y, b2.y);
        var width = Math.max(b1.x + b1.width, b2.x + b2.width) - x;
        var height = Math.max(b1.y + b1.height, b2.y + b2.height) - y;
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    }

    // ## Description:
    // return a simple box object that can be serialized, copied.
    static smoBox(box) {
        return ({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
        });
    }

    static measureBBox(b1, measure, staff) {
        if (measure.renderedBox) {
            if (b1['width']) {
                return svgHelpers.unionRect(b1, measure.renderedBox);
            } else {
                return measure.renderedBox;
            }
        } else {
            var mbox = {
                x: measure.staffX,
                y: staff.staffY,
                width: measure.staffWidth,
                height: staff.staffHeight
            };
            if (b1['width']) {
                return mbox;
            }
            return svgHelpers.unionRect(b1, mbox);
        }
    }

    static stringify(box) {
        if (box['width']) {
			
            return JSON.stringify({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height
            }, null, ' ');
        } else {
            return JSON.stringify({
                x: box.x,
			y: box.y},null,' ');
		}
    }

    static log(box) {
        if (box['width']) {
            console.log(JSON.stringify({
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height
                }, null, ' '));
        }
        console.log('{}');
    }
    static pointBox(x, y) {
        return {
            x: x,
            y: y,
            width: 1,
            height: 1
        };
    }
	
	static copyBox(box) {
		return {x:box.x,y:box.y,width:box.width,height:box.height};
	}
	
	
	static logicalToClient(svg,logicalPoint) {
		var rect = svg.getBoundingClientRect();
		var rv = svgHelpers.copyBox(logicalPoint);
		rv.x+=rect.x;
		rv.y+=rect.y;		
		return rv;
	}
	
	
	static clientToLogical(svg,clientPoint) {
		if (clientPoint['width']) {
			return untransformSvgBox(svg,clientPoint);
		}
		return untransformSvgPoint(svg,clientPoint);
		return rv;
	}
    
	// ## clientToLogical
	// ## Description:
	// return a box or point in svg coordintes from screen coordinates
    static clientToLogical(svg, point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM().inverse());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        
		var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM().inverse());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
    }
	
	// ## logicalToClient
	// ## Description:
	// return a box or point in screen coordinates from svg coordinates
	static logicalToClient(svg,point) {
        var pt = svg.createSVGPoint();
        pt.x = point.x;
        pt.y = point.y;
        var sp = pt.matrixTransform(svg.getScreenCTM());
		if (!point['width']) {
		   return {x:sp.x,y:sp.y};
		}
        var endPt = svg.createSVGPoint();
        endPt.x = pt.x + point.width;
        endPt.y = pt.y + point.height;
        var ep = endPt.matrixTransform(svg.getScreenCTM());
        return {
            x: sp.x,
            y: sp.y,
            width: ep.x - sp.x,
            height: ep.y - sp.y
        };
	}
}
;
var smoDomBuilder = function (el) {}

// # htmlHelpers
// # Description:
//  Helper functions for buildling UI elements
class htmlHelpers {
    // ## buildDom
	// ## Description:
	// returns an object that  lets you build a DOM in a somewhat readable way.
	// ## Usage:
    // var b = htmlHelpers.buildDom();
    //  var r =
    // b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
    // b('td').classes('noSideBorderRight').append(
    // ...
    // $(parent).append(r.dom());
	//
    // Don't forget the '.dom()' !  That is the actual jquery element object
    static buildDom = function (el) {
        var smoDomBuilder = function (el) {
            this.e = $('<' + el + '/>');
            var self = this;
            this.classes = function (cl) {
                $(self.e).addClass(cl);
                return self;
            }
            this.data = function (name, value) {
                $(self.e).attr('data-' + name, value);
                return self;
            }
            this.attr = function (name, value) {
                $(self.e).attr(name, value);
                return self;
            }
            this.css = function (name, value) {
                $(self.e).css(name, value);
                return self;
            }
            this.append = function (el) {
                $(self.e).append(el.e);
                return self;
            }
            this.text = function (tx) {
                $(self.e).append(document.createTextNode(tx));
                return self;
            }
            this.dom = function () {
                return self.e;
            }
            return this;
        }
        return new smoDomBuilder(el);
    }

    static get focusableElements() {
        return ['a', 'input', 'select', 'textarea', 'button', 'li[tabindex]', 'div[tabindex]'];
    }
    static inputTrapper(selector) {
        var trapper = function () {
            this.parent = $(selector);
            this.id = $(this.parent).attr('id');
            this.parentId = $(this.parent).parent().attr('id');
            var idstr = Math.round(Math.random() * (999999 - 1) + 1);
            if (!this.id) {
                $(this.parent).attr('id', idstr + '-element');
                this.id = $(this.parent).attr('id');
            }
            if (!this.parentId) {
                $(this.parent).parent().attr('id', idstr + '-parent');
                this.parentId = $(this.parent).parent().attr('id');
            }
            this.modalInputs = [];
            this.disabledInputs = [];
            this.siblingInputs = [];

            // aria-hide peers of dialog and peers of parent that are not the parent.
            var peers = $(this.parent).parent().children().toArray();

            // var ppeers = $(this.parent).parent().parent().children().toArray();
            // peers = peers.concat(ppeers);
            peers.forEach((node) => {
                var ptag = $(node)[0].tagName;
                if (ptag === 'SCRIPT' || ptag === 'LINK' || ptag === 'STYLE') { ;
                } else if ($(node).attr('id') === this.parentId ||
                    $(node).attr('id') === this.id) { ;
                } else {
                    var hidden = $(node).attr('aria-hidden');
                    if (!hidden || hidden != 'true') {
                        $(node).attr('aria-hidden', 'true');
                        this.siblingInputs.push(node);
                    }
                }
            });
            htmlHelpers.focusableElements.forEach((etype) => {
                var elements = $(etype).toArray();

                elements.forEach((element) => {
                    var tagName = $(element)[0].tagName;
                    if ($(element).attr('id') === this.id) { ;
                    } else if ($(element).prop('disabled')) { ;
                    } else if ($(element).hasClass('hide')) { ;
                    } else if ($(element).closest(selector).length) {
                        // inside
                        this.modalInputs.push(element);
                    } else if ((tagName === 'A' || tagName === 'DIV' || tagName === 'LI') && $(element).attr('tabIndex') === '-1') { ;
                    } else {
                        this.disabledInputs.push(element);
                        if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
                            $(element).attr('tabIndex', '-1');
                        } else {
                            $(element).prop('disabled', true);
                        }
                    }
                });
            });

            this.close = function () {
                this.disabledInputs.forEach(function (element) {
                    var tagName = $(element)[0].tagName;
                    if (tagName === 'A' || tagName === 'DIV' || tagName === 'LI') {
                        $(element).attr('tabIndex', '0');
                    } else {
                        $(element).prop('disabled', false);
                    }
                });
                this.siblingInputs.forEach((el) => {
                    $(el).removeAttr('aria-hidden');
                });
            }
        }
		
		return new trapper(selector);
    }
}
;

// ##Note on prefixes:
// SMO == Serializable Music Ontology, stuff I made up
// vx == VF == Vexflow rendering engine by https://github.com/0xfe
// Where it makes sense, SMO uses VF conventions, e.g. ticks to store note durations
// and identifiers for notes and things.
//
// ## Description:
// Basic note information.  Leaf node of the SMO dependency tree (so far)
class SmoNote {
	// ## Description:
	// see defaults for params format.
	constructor(params) {
		Vex.Merge(this, SmoNote.defaults);
		Vex.Merge(this, params);
		var ticks = vexMusic.durationToTicks(this.duration);
		this.ticks = {
			numerator: ticks,
			denominator: 1,
			remainder: 0
		};
		// this.keys=JSON.parse(JSON.stringify(this.keys));
		this.tupletInfo = {};
		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoNote'
			};
		} else {
			// inherit attrs id for deserialized 
		}
	}
	get id() {
		return this.attrs.id;
	}
	
	get dots() {
		if (this.isTuplet()) {
			return 0;
		}
		var vexDuration = vexMusic.ticksToDuration[this.tickCount];
		return vexDuration.split('d').length-1;
	}
	
	set dots(value) {
		// ignore - dots are a function of duration only.
	}

    // ## toVexKeys
	// ## Description:
	// turn the array of smo note pitches into an array of vex key strings
	toVexKeys() {
		var rv = [];
		for (var i = 0; i < this.pitches.length; ++i) {
			var pitch = this.pitches[i];
			var letter = pitch.letter + pitch.accidental;
			rv.push(letter + '/' + pitch.octave);
		}
		return rv;
	}
	_sortPitches() {
		var canon = VF.Music.canonical_notes;
		var keyIndex = ((pitch) => {
			return canon.indexOf(pitch.letter) + pitch.octave * 12;
		});
		this.pitches.sort((a, b) => {
			return keyIndex(a) - keyIndex(b);
		});
	}
	addPitchOffset(offset) {
		if (this.pitches.length == 0) {
			return this;
		}
		var pitch = this.pitches[0];
		this.pitches.push(vexMusic.getKeyOffset(pitch, offset));

		this._sortPitches();
	}
	
	isTuplet() {
		return this['tuplet'] && this.tuplet['id'];
	}

	transpose(pitchArray, offset, keySignature) {
		var pitches = [];
		if (pitchArray.length == 0) {
			this.pitches.forEach((m)=>{pitchArray.push(this.pitches.indexOf(m));});
		}
		for (var j = 0; j < pitchArray.length; ++j) {
			var index = pitchArray[j];
			if (index + 1 > this.pitches.length) {
				this.addPitchOffset(offset);
			} else {
				var nnote = vexMusic.getKeyOffset(this.pitches[index], offset);
				if (keySignature) {
					var letterKey = nnote.letter + nnote.accidental;
					letterKey = vexMusic.getKeyFriendlyEnharmonic(letterKey,keySignature);
					nnote.letter = letterKey[0];
					if (letterKey.length < 2) {
						nnote.accidental = 'n';
					} else {
						nnote.accidental = letterKey.substring(1);
					}
				}
				this.pitches[index] = nnote;
			}
		}
		this._sortPitches();
		return this;
	}
	get tickCount() {
		return this.ticks.numerator / this.ticks.denominator + this.ticks.remainder;
	}

	describe() {
		return this.id + ' ' + this.tickCount;
	}
	
	static _cloneParameters(note) {
		var keys = Object.keys(note);
		var clone = {};
		for (var i = 0; i < keys.length; ++i) {
			var key = keys[i];
			clone[key] = note[key];
		}
		return JSON.parse(JSON.stringify(clone));
	}
	static clone(note) {
		var clone = SmoNote._cloneParameters(note);

		// should tuplet info be cloned?
		var rv = new SmoNote(clone);

		// make sure id is unique
		rv.attrs = {
			id: VF.Element.newID(),
			type: 'SmoNote'
		};
		return rv;
	}

	// ## Description:
	// Clone the note, but use the different duration.  Changes the length
	// of the note but nothing else.
	static cloneWithDuration(note, duration) {
		var clone = SmoNote._cloneParameters(note);
		clone.duration = duration;
		// should tuplet info be cloned?
		var rv = new SmoNote(clone);

		// make sure id is unique
		rv.attrs = {
			id: VF.Element.newID(),
			type: 'SmoNote'
		};
		return rv;
	}

	static get defaults() {
		return {
			timeSignature: '4/4',
			keySignature: "C",
			clef: 'treble',
			noteType: 'n',
			numBeats: 4,
			beatValue: 4,
			voice: 0,
			duration: '4',
			pitches: [{
					letter: 'b',
					octave: 4,
					accidental: ''
				}
			],
		}
	}
}

class SmoTuplet {
	constructor(params) {
		this.notes = params.notes;
		Vex.Merge(this, SmoTuplet.defaults);
		Vex.Merge(this, params);
		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoTuplet'
			};
		} else {
			console.log('inherit attrs');
		}
		this._adjustTicks();
	}

	_adjustTicks() {
		var sum = this.durationSum;
		for (var i = 0; i < this.notes.length; ++i) {
			var note = this.notes[i];
			var normTicks = vexMusic.durationToTicks(vexMusic.ticksToDuration[this.stemTicks]);
			// TODO:  notes_occupied needs to consider vex duration
			var tupletBase = normTicks * this.note_ticks_occupied;
			note.ticks.denominator = 1;
			note.ticks.numerator = Math.floor((this.totalTicks * this.durationMap[i]) / sum);
			// put all the remainder in the first note of the tuplet
			note.ticks.remainder = (i == 0) ? this.totalTicks * this.durationMap[i] % sum : 0;

			note.tuplet = this.attrs;
		}
	}
	getIndexOfNote(note) {
		var rv = -1;
		for (var i = 0; i < this.notes.length; ++i) {
			var tn = this.notes[i];
			if (note.id === tn.id) {
				rv = i;
			}
		}
		return rv;
	}
	split(combineIndex) {
		var multiplier = 0.5;
		var nnotes = [];
		var nmap = [];

		for (var i = 0; i < this.notes.length; ++i) {
			var note = this.notes[i];
			if (i === combineIndex) {
				nmap.push(this.durationMap[i] * multiplier);
				nmap.push(this.durationMap[i] * multiplier);
				note.ticks.numerator *= multiplier;

				var normalizedTicks = VF.durationToTicks(note.duration) / 2;
				note.duration = vexMusic.ticksToDuration[normalizedTicks];

				var onote = SmoNote.clone(note);
				nnotes.push(note);
				nnotes.push(onote);
			} else {
				nmap.push(this.durationMap[i]);
				nnotes.push(note);
			}
		}
		this.notes = nnotes;
		this.durationMap = nmap;
	}
	combine(startIndex, endIndex) {
		// can't combine in this way, too many notes
		if (this.notes.length <= endIndex || startIndex >= endIndex) {
			return this;
		}
		var acc = 0.0;
		var i;
		var base = 0.0;
		for (i = startIndex; i <= endIndex; ++i) {
			acc += this.durationMap[i];
			if (i == startIndex) {
				base = this.durationMap[i];
			} else if (this.durationMap[i] != base) {
				// Can't combine non-equal tuplet notes
				return this;
			}
		}
		// how much each combined value will be multiplied by
		var multiplier = acc / base;

		var nmap = [];
		var nnotes = [];
		// adjust the duration map
		for (i = 0; i < this.notes.length; ++i) {
			var note = this.notes[i];
			// notes that don't change are unchanged
			if (i < startIndex || i > endIndex) {
				nmap.push(this.durationMap[i]);
				nnotes.push(note);
			}
			// changed note with combined duration
			if (i == startIndex) {
				note.ticks.numerator = note.ticks.numerator * acc;
				var normTicks = VF.durationToTicks(note.duration) * multiplier;
				note.duration = vexMusic.ticksToDuration[normTicks];
				nmap.push(acc);
				nnotes.push(note);
			}
			// other notes after startIndex are removed from the map.
		}
		this.notes = nnotes;
		this.durationMap = nmap;
	}
	get durationSum() {
		var acc = 0;
		for (var i = 0; i < this.durationMap.length; ++i) {
			acc += this.durationMap[i];
		}
		return Math.round(acc);
	}
	get num_notes() {
		return this.durationSum;
	}
	get notes_occupied() {
		return Math.floor(this.totalTicks / this.stemTicks);
	}
	get note_ticks_occupied() {
		return this.totalTicks / this.stemTicks;
	}
	get tickCount() {
		var rv = 0;
		for (var i = 0; i < this.notes.length; ++i) {
			var note = this.notes[i];
			rv += (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
		}
		return rv;
	}
	static get defaults() {
		return {
			numNotes: 3,
			totalTicks: 4096, // how many ticks this tuple takes up
			stemTicks: 2048, // the stem ticks, for drawing purposes.  >16th, draw as 8th etc.
			location: 1,
			durationMap: [1.0, 1.0, 1.0],
			bracketed: true,
			ratioed: false
		}
	}
}

class SmoBeamGroup {
	constructor(params) {
		this.notes = params.notes;
		Vex.Merge(this, params);

		if (!this['attrs']) {
			this.attrs = {
				id: VF.Element.newID(),
				type: 'SmoBeamGroup'
			};
		} else {
			console.log('inherit attrs');
		}
		for (var i = 0; i < this.notes.length; ++i) {
			var note = this.notes[i];
			if (vexMusic.durationToTicks(note.duration) < 4096)
				note.beam_group = this.attrs;
		}
	}
}
;

class SmoMeasure {
    constructor(params) {
        this.tuplets = [];
        this.beamGroups = [];
		this.changed=true;

        Vex.Merge(this, SmoMeasure.defaults);
        Vex.Merge(this, params);
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoMeasure'
            };
        } else {
            // inherit attrs id for deserialized 
        }		
    }
    get notes() {
        return this.voices[this.activeVoice].notes;
    }
	getRenderedNote(id) {
        for (var j = 0; j < this.voices.length; ++j) {
            var voice = this.voices[j];
            for (var i = 0; i < voice.notes.length; ++i) {
				var note = voice.notes[i];
				if (note.renderId === id) {
					return {smoNote:note,voice:j,tick:i};
				}
			}
		}
		return null;		
	}
    set notes(val) {
        this.voices[this.activeVoice].notes = val;
    }
    get stemDirection() {
        return this.activeVoice % 2 ? -1 : 1;
    }
	static get defaultAttributes() {
		return [
            'timeSignature', 'keySignature', 'staffX', 'staffY', 'customModifiers',
             'measureNumber', 'staffWidth', 'modifierOptions',
            'activeVoice'];
	}
    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var voices = [];
        for (var j = 0; j < jsonObj.voices.length; ++j) {
            var voice = jsonObj.voices[j];
            var notes = [];
            voices.push({
                notes: notes
            });
            for (var i = 0; i < voice.notes.length; ++i) {
                var noteParams = voice.notes[i];
                var smoNote = new SmoNote(noteParams);
                notes.push(smoNote);
            }
        }

        var tuplets = [];
        for (j = 0; j < jsonObj.tuplets.length; ++j) {
            var tuplet = new SmoTuplet(jsonObj.tuplets[j]);
            tuplets.push(tuplet);
        }

        var beamGroups = [];
        for (j = 0; j < jsonObj.beamGroups.length; ++j) {
            var smoBeam = new SmoBeamGroup(jsonObj.beamGroups[j]);
            beamGroups.push(smoBeam);
        }

        var params = {
            voices: voices,
            tuplets: tuplets,
            beamGroups: beamGroups
        };

        vexMusic.filteredMerge(SmoMeasure.defaultAttributes, jsonObj, params);

        return new SmoMeasure(params);
    }

    // TODO: learn what all these clefs are
    static get defaultKeyForClef() {
        return {
            'treble': {
                letter: 'b',
                accidental: '',
                octave: 4
            },
            'bass': {
                letter: 'd',
                accidental: '',
                octave: 3
            },
            'tenor': {
                letter: 'a',
                accidental: '',
                octave: 4
            },
            'alto': {
                letter: 'a',
                accidental: '',
                octave: 3
            },
            'soprano': {
                letter: 'b',
                accidental: '',
                octave: 4
            },
            'percussion': {
                letter: 'b',
                accidental: '',
                octave: 4
            },
            'mezzo-soprano': {
                letter: 'b',
                accidental: '',
                octave: 4
            },
            'baritone-c': {
                letter: 'b',
                accidental: '',
                octave: 3
            },
            'baritone-f': {
                letter: 'e',
                accidental: '',
                octave: 3
            },
            'subbass': {
                letter: 'd',
                accidental: '',
                octave: 2
            },
            'french': {
                letter: 'b',
                accidental: '',
                octave: 4
            } // no idea
        }
    }
	// Get a measure full of default notes for a given timeSignature/clef
    static getDefaultNotes(params) {
		if (params == null) {
			params={};
		}
		params.timeSignature = params.timeSignature ? params.timeSignature : '4/4';
		params.clef = params.clef ? params.clef : 'treble';
        var meterNumbers = params.timeSignature.split('/').map(number => parseInt(number, 10));
        var duration = '4';
        if (meterNumbers[0] % 3 == 0) {
            duration = '8';
        }
        var pitches = SmoMeasure.defaultKeyForClef[params.clef];
		var rv = [];

        for (var i = 0; i < meterNumbers[0]; ++i) {
            var note = new SmoNote({
                    clef: params.clef,
                    pitches: [pitches],
                    duration: duration,
					timeSignature:params.timeSignature
                });
            rv.push(note);
        }
        return rv;
    }
	
	static getDefaultMeasure(params) {
		var obj={};
		Vex.Merge(obj,SmoMeasure.defaults);
		obj.keySignature = params.keySignature ? params.keySignature : obj.keySignature;
		obj.timeSignature = params.timeSignature ? params.timeSignature : obj.timeSignature;
		return new SmoMeasure(obj);
	}
	
	static getDefaultMeasureWithNotes(params) {
		var measure = SmoMeasure.getDefaultMeasure(params);
		measure.voices.push({notes:SmoMeasure.getDefaultNotes(params)});
		return measure;
	}
	
	static _cloneParameters(measure) {
        var keys = Object.keys(measure);
        var clone = {};
        for (var i = 0; i < keys.length; ++i) {
            var key = keys[i];
            clone[key] = measure[key];
        }
		return clone;
	}
	
	/* static cloneMeasure(measure) {
		var params = SmoMeasure._cloneParameters(measure);
		var nmeasure = new SmoMeasure(params);
		nmeasure.attrs={
                id: VF.Element.newID(),
                type: 'SmoMeasure'
            };
	    nmeasure.voices=[];
		for (var i=0;i<measure.voices.length;++i) {
			
			var notes=[];
			var voice=measure.voices[i];
			for (var j=0;j<voice.notes.length;++j) {
				var note = voice.notes[j];
				notes.push(SmoNote.clone(note));
			}
			nmeasure.voices.push({notes:notes});
		}
		return nmeasure;
	}  */

    static get defaultVoice44() {
		return SmoMeasure.getDefaultNotes({clef:'treble',timeSignature:'4/4'});
    }
    static get defaults() {
        // var noteDefault = SmoMeasure.defaultVoice44;
        return {
            timeSignature: '4/4',
            keySignature: "C",
            staffX: 10,
			adjX:0,
			rightMargin:2,
            customModifiers: [],
            staffY: 40,
            bars: [1, 1], // follows enumeration in VF.Barline
            measureNumber: {
                localIndex: 0,
                systemIndex: 0,
                measureNumber: 0
            },
            staffWidth: 200,
            modifierOptions: {},
            clef: 'treble',            
            forceClef: false,
			forceKeySignature:false,
			forceTimeSignature:false,
            voices: [  ],
            activeVoice: 0
        };
    }
    tickmap() {
        return VX.TICKMAP(this);
    }
	
	
	// {index:1,value:{symbol:'#',cautionary:false}}
	setAccidental(voice,tick,pitch,value) {
		var target = this.getSelection(voice,tick,[pitch]);
		if (target) {
			target.note.addAccidental(value);
		}
	}
	
    clearBeamGroups() {
        this.beamGroups = [];
    }

    clearAccidentals() {
        for (var j = 0; j < this.voices.length; ++j) {
            var notes = this.voices[j].notes;
            for (var i = 0; i < notes.length; ++i) {
                notes[i].accidentals = [];
            }
        }
    }
    tupletIndex(tuplet) {
        for (var j = 0; j < this.voices.length; ++j) {
            var notes = this.voices[j].notes;
            for (var i = 0; i < notes.length; ++i) {
                if (notes[i]['tuplet'] && notes[i].tuplet.id === tuplet.attrs.id) {
                    return i;
                }
            }
        }
        return -1;
    }
	
    getTupletForNote(note) {
        if (!note.isTuplet()) {
            return null;
        }
        for (var i = 0; i < this.tuplets.length; ++i) {
            var tuplet = this.tuplets[i];
            if (tuplet.attrs.id === note.tuplet.id) {
                return tuplet;
            }
        }
		return null;
    }
    removeTupletForNote(note) {
        var tuplets = [];
        for (var i = 0; i < this.tuplets.length; ++i) {
            var tuplet = this.tuplets[i];
            if (note.tuplet.id !== tuplet.attrs.id) {
                tuplets.push(tuplet);
            }
        }
        this.tuplets = tuplets;
    }
    addCustomModifier(ctor, parameters) {
        this.customModifiers.push({
            ctor: ctor,
            parameters: parameters
        });
    }
	get numBeats() {
		return this.timeSignature.split('/').map(number => parseInt(number, 10))[0];
	}
	setKeySignature(sig) {
		this.keySignature = sig;
		this.voices.forEach((voice) => {
			voice.notes.forEach((note) => {
				note.keySignature=sig;
			});
		});
	}
	get beatValue() {
		return this.timeSignature.split('/').map(number => parseInt(number, 10))[1];
	}

    setMeasureNumber(num) {
        this.measureNumber = num;
    }
  
    getBeamGroupForNote(note) {
        for (var i = 0; i < this.beamGroups.length; ++i) {
            var bg = this.beamGroups[i];
            for (var j = 0; j < bg.notes.length; ++j) {
                if (bg.notes[j].attrs.id === note.attrs.id) {
                    return bg;
                }
            }
        }
        return null;
    }
}
;

// ## SmoSystemStaff
// ## Description:
// A staff is a line of music that can span multiple measures.
class SmoSystemStaff {
    constructor(params) {
        this.measures = [];
        Vex.Merge(this, SmoSystemStaff.defaults);
        Vex.Merge(this, params);
        if (this.measures.length) {
            this.numberMeasures();
        }
        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoSystemStaff'
            };
        } else {
            // inherit attrs id for deserialized 

        }
    }
    static get defaults() {
        return {
            staffX: 10,
            staffY: 40,
            adjY: 0,
            staffWidth: 1600,
            staffHeight: 90,
            startIndex: 0,
            renumberingMap: {},
            keySignatureMap: {},
            instrumentInfo: {
                instrumentName: 'Treble Instrument',
                keyOffset: '0',
                clef: 'treble'
            },
            measures: [],
            modifiers: []
        };
    }

    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
        vexMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'renumberingMap', 'renumberIndex', 'instrumentInfo'],
            jsonObj, params);
        params.measures = [];
        jsonObj.measures.forEach(function (measureObj) {
            var measure = SmoMeasure.deserialize(JSON.stringify(measureObj));
            params.measures.push(measure);
        });

        return new SmoSystemStaff(params);
    }

    addStaffModifier(modifier) {
        this.removeStaffModifier(modifier);
        this.modifiers.push(modifier);
    }

    removeStaffModifier(modifier) {
        var mods = [];
        this.modifiers.forEach((mod)=> {
            if (mod.id != modifier.id) {
                mods.push(mod);
            }
        });
        this.modifiers = mods;
    }

    getModifierMeasures(modifier) {
        return {
            startMeasure: this.measures.find((measure) => measure.attrs.id === modifier.startMeasure),
            endMeasure: this.measures.find((measure) => measure.attrs.id === modifier.endMeasure),
        }
    }

    applyBeams() {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            smoBeamerFactory.applyBeams(measure);
        }
    }

    getRenderedNote(id) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            var note = measure.getRenderedNote(id);
            if (note)
                return {
                    smoMeasure: measure,
                    smoNote: note.smoNote,
                    smoSystem: this,
                    selection: {
                        measureIndex: measure.measureNumber.measureIndex,
                        voice: measure.activeVoice,
                        tick: note.tick,
                        maxTickIndex: measure.notes.length,
                        maxMeasureIndex: this.measures.length
                    },
                    type: note.smoNote.attrs.type,
                    id: note.smoNote.id
                };
        }
        return null;
    }

    getMaxTicksMeasure(measure) {
        if (this.measures.length < measure) {
            return 0;
        }
        return this.measures[measure].notes.length;
    }
    addKeySignature(measureIndex, key) {
        this.keySignatureMap[measureIndex] = key;
        this._updateKeySignatures();
    }
    removeKeySignature(measureIndex) {
        var keys = Object.keys(this.keySignatureMap);
        var nmap = {};
        keys.forEach((key) => {
            if (key !== measureIndex) {
                nmap[key] = this.keySignatureMap[key];
            }
        });
        this.keySignatureMap = nmap;
        this._updateKeySignatures();
    }
    _updateKeySignatures() {
        var currentSig = this.measures[0].keySignature;

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            var nextSig = this.keySignatureMap[i] ? this.keySignatureMap[i] : currentSig;
            measure.setKeySignature(nextSig);
        }
    }
    numberMeasures() {
        this.renumberIndex = this.startIndex;

        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];

            this.renumberIndex = this.renumberingMap[i] ? this.renumberingMap[i].startIndex : this.renumberIndex;
            var localIndex = this.renumberIndex + i;
            var numberObj = {
                measureNumber: localIndex,
                measureIndex: i + this.startIndex,
                systemIndex: i
            }
            measure.setMeasureNumber(numberObj);
        }
    }
    getSelection(measureNumber, voice, tick, pitches) {
        for (var i = 0; i < this.measures.length; ++i) {
            var measure = this.measures[i];
            if (measure.measureNumber.measureNumber === measureNumber) {
                var target = this.measures[i].getSelection(voice, tick, pitches);
                if (!target) {
                    return null;
                }
                return ({
                    measure: measure,
                    note: target.note,
                    selection: target.selection
                });
            }
        }
        return null;
    }

    addDefaultMeasure(index, params) {
        var measure = SmoMeasure.getDefaultMeasure(params);
        this.addMeasure(index, measure);
    }
	
	// ## addMeasure
	// ## Description:
	// Add the measure at the specified index, splicing the array as required.
    addMeasure(index, measure) {

        if (index === 0 && this.measures.length) {
            measure.setMeasureNumber(this.measures[0].measureNumber);
        }
        if (index >= this.measures.length) {
            this.measures.push(measure);
        } else {
            this.measures.splice(index, 0, measure);
        }

        this.numberMeasures();
    }
}
;
class SmoScore {
    constructor(params) {
        Vex.Merge(this, SmoScore.defaults);
        Vex.Merge(this, params);
        if (this.staves.length) {
            this._numberStaves();
        }
    }
    static get defaults() {
        return {
            staffX: 30,
            staffY: 40,
            staffWidth: 1600,
            interGap: 30,
            startIndex: 0,
            renumberingMap: {},
			keySignatureMap:{},
			measureTickmap:[],
            staves: [],
            activeStaff: 0,
			pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            svgScale: 0.8,
			zoomScale:1.0
        };
    }
	
	static getDefaultScore(scoreDefaults,measureDefaults) {
		scoreDefaults = (scoreDefaults != null ? scoreDefaults : SmoScore.defaults);
		measureDefaults = (measureDefaults != null ? measureDefaults : SmoMeasure.defaults);
		var score = new SmoScore(scoreDefaults);
		score.addInstrument(measureDefaults);
		var measure = SmoMeasure.getDefaultMeasure(measureDefaults);
		score.addMeasure(0,measure);
		measure.voices.push({notes:SmoMeasure.getDefaultNotes(measureDefaults)});
		return score;
	}
	
	static getEmptyScore(scoreDefaults) {
		var score = new SmoScore(scoreDefaults);
		score.addInstrument();
		return score;
	}
	applyBeamers() {
		for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
			stave.applyBeamers();
		}
	}

    _numberStaves() {
       for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            stave.numberMeasures();
        }
    }
	
	getMeasureAtSelection(selection) {
		return this.staves[this.activeStaff].getMeasureAtSelection(selection);
	}
	// If we are adding a measure, find the previous measure to get constructor parameters from it.
	_getMeasureContext(staff,measureIndex) {
		var rv={};
		Vex.Merge(rv,SmoMeasure.defaults);
		
		if (measureIndex < staff.measures.length) {
			vexMusic.filteredMerge(SmoMeasure.defaultAttributes, rv, staff.measures[i]);
		}
		return rv;
	}
	
	addDefaultMeasure(measureIndex,parameters) {
		for (var i=0;i<this.staves.length;++i) {
			var staff=this.staves[i];
			// TODO: find best measure for context, with key, time signature etc.
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasure(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		}
		this._numberStaves();
	}
	
	addDefaultMeasureWithNotes(measureIndex,parameters) {
		this.staves.forEach((staff) => {
			var defaultMeasure = 
				SmoMeasure.getDefaultMeasureWithNotes(parameters);
			staff.addMeasure(measureIndex,defaultMeasure);
		});
	}
	_updateMeasureTickmap() {
		this.measureTickmap=[];
		this.measures.forEach((measure) => {
			this.measureTickmap.push(measure.tickmap());
		});
	}
	// ## addMeasure
	// ## Description:
	// Give a measure prototype, create a new measure and add it to each staff, with the 
	// correct settings for current time signature/clef.
	addMeasure(measureIndex,measure) {
		
		for (var i=0;i<this.staves.length;++i) {
			var protomeasure = measure;
			var staff=this.staves[i];
			// Since this staff may already have instrument settings, use the 
			// immediately precending or post-ceding measure if it exists.
			if (measureIndex < staff.measures.length) {
				protomeasure = staff.measures[measureIndex];
			} else if (staff.measures.length) {
				protomeasure = staff.measures[staff.measure.length-1];
			}
			var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(protomeasure);
			staff.addMeasure(measureIndex,nmeasure);
		}
		this._numberStaves();
	}
	addKeySignature(measureIndex,key) {
		this.staves.forEach((staff) => {staff.addKeySignature(measureIndex,key);});
	}
	addInstrument(parameters) {
		if (this.staves.length ==0 )  {
			this.staves.push(new SmoSystemStaff(parameters));
			this.activeStaff=0;
			return;
		}
		if (!parameters) {
			parameters=SmoSystemStaff.defaults;
		}
		var proto=this.staves[0];
		var measures=[];
		for (var i=0;i<proto.measures.length;++i) {
			var newParams = {};
			var measure=proto.measures[i];
			vexMusic.filteredMerge(SmoMeasure.defaultAttributes, measure, newParams);
			newParams.clef=parameters.instrumentInfo.clef;			
			var newMeasure=SmoMeasure.getDefaultMeasureWithNotes(newParams);
			newMeasure.measureNumber = measure.measureNumber;
			measures.push(newMeasure);
		}
		parameters.measures=measures;
		var staff = new SmoSystemStaff(parameters);
		this.staves.push(staff);
		this.activeStaff=this.staves.length-1;
	}
	
	getMaxTicksMeasure(measure) {		
		return this.staves[this.activeStaff].getMaxTicksMeasure(measure);
	}
	get measures() {
		if (this.staves.length === 0) return [];
		return this.staves[this.activeStaff].measures;
	}
	incrementActiveStaff(offset) {
		if (offset<0) offset = (-1*offset)+this.staves.length;
		var nextStaff = (this.activeStaff + offset) % this.staves.length;
		if (nextStaff >= 0 && nextStaff < this.staves.length) {
			this.activeStaff=nextStaff;
		}
		return this.activeStaff;
	}
	
    static deserialize(jsonString) {
        var jsonObj = JSON.parse(jsonString);
        var params = {};
		var staves=[];
        vexMusic.filteredMerge(
            ['staffX', 'staffY', 'staffWidth', 'startIndex', 'interGap', 'renumberingMap', 'renumberIndex'],
            jsonObj, params);
        jsonObj.staves.forEach(function (measureObj) {
            var staff = SmoSystemStaff.deserialize(JSON.stringify(measureObj));
            staves.push(staff);
        });
		params.staves=staves;

        return new SmoScore(params);
    }
	
	setActiveStaff(index) {
		this.activeStaff=index<=this.staves.length ? index : this.activeStaff;
	}
	
    getRenderedNote(id) {
        for (var i = 0; i < this.staves.length; ++i) {
            var stave = this.staves[i];
            var note = stave.getRenderedNote(id);
            if (note) {
				note.selection.staffIndex=i;
                return note;
            }
        }
        return null;
    }
}
;
// # This file contains modifiers that might take up multiple measures, and are thus associated
// with the staff.

// ## SmoStaffHairpin
// ## Descpription:
// crescendo/decrescendo
class SmoStaffHairpin {
    constructor(params) {
        Vex.Merge(this, SmoStaffHairpin.defaults);
        vexMusic.filteredMerge(['position', 'xOffset', 'yOffset', 'hairpinType', 'height'], params, this);
		this.startSelector = params.startSelector;
		this.endSelector = params.endSelector;

        if (!this['attrs']) {
            this.attrs = {
                id: VF.Element.newID(),
                type: 'SmoStaffHairpin'
            };
        } else {
            console.log('inherit attrs');
        }
    }
	get id() {
		return this.attrs.id;
	}
	get type() {
		return this.attrs.type;
	}
    static get defaults() {
        return {
            xOffsetLeft: -2,
			xOffsetRight:0,
            yOffset: -15,
            height: 10,
            position: SmoStaffHairpin.positions.BELOW,
            hairpinType: SmoStaffHairpin.types.CRESCENDO

        };
    }
    static get positions() {
        // matches VF.modifier
        return {
            LEFT: 1,
            RIGHT: 2,
            ABOVE: 3,
            BELOW: 4,
        };
    }
    static get types() {
        return {
            CRESCENDO: 1,
            DECRESCENDO: 2
        };
    }
};
VF = Vex.Flow;
Vex.Xform = (typeof (Vex.Xform)=='undefined' ? {} : Vex.Xform);
VX = Vex.Xform;


// ## Description
// This file implements an iterator through a set of notes in a single measure.  
// This is useful when redrawing the notes to transform them into something else.   
// E.g. changing the duration of a note in a measure.  It keeps track of accidentals,
// ticks used etc.

// ## Usage:
// VX.ITERATE (actor, notes)
// where actor is a function that is called at each tick in the voice.
// 
// ## iterator format:
//   iterator: {
//      notes:[note1,note2...],
//      delta: tick value of this note
//      totalDuration: ticks up until this point
//      note: current note,
//      index: running index
//
// ## Tickmap format
// VX.TICKMAP(notes)
// Iterate through all notes and creates information about the notes, like
// tuplet ticks, index-to-tick map.
// 
//     tickmap = {
//        totalDuration: 16384,
//        accidentalMap:[{'F':'#','G':'b'},....
//        durationMap:[2048,4096,..],  // A running total
//        deltaMap:[2048,2048...], a map of deltas
//        tupletMap: {
//          noteId1: 
//          {startIndex:1,endIndex:3,numNotes:3,startTick:4096,endTick:8196,durations:[1365,...],smallestDuration:2048}
//
//        
class smoTickIterator {
	/**
	  measure looks like:
	  return {
            group: group,
            voice: voice,
            staff: stave,
            notes: notes,
            beams: this.beamGroups,
            keySignature: this.keySignature
        };
    }   **/
    constructor(measure,options) {
		this.notes=measure.notes;
		this.keySignature = measure.keySignature;
        this.index = 0;
        this.startIndex = 0;
        this.endIndex = this.notes.length;

        Vex.Merge(this,options);

        // so a client can tell if the iterator's been run or not
        var states = ['CREATED', 'RUNNING', 'COMPLETE'];
        this.state = 'CREATED';

        // ticks as we iterate.  
        // duration is duration of the current range
        this.duration = 0;
        // duration is the accumulated duraition over all the notes
        this.totalDuration = 0;
        // delta is the tick contribution of this note
        this.delta = 0;
        // the tick start location of notes[x]
        this.durationMap = [];
		this.deltaMap=[];

        this.tupletMap = {};
		this.accidentalMap=[];

        this.hasRun = false;
        this.beattime = 4096;
        if (this.voice)
            this.beattime = this.voice.time.resolution / this.voice.time.num_beats;

    }

    // ## Description:
    // empty function for a default iterator (tickmap)
    static nullActor() { }

	static _getAccidentalsForKey(keySignature,map) {
		var music = new VF.Music();
		var keys = music.createScaleMap(keySignature);
		var keyKeys=Object.keys(keys);
		keyKeys.forEach((keyKey) => {
			var vexKey = keys[keyKey];
			if (vexKey.length>1 && (vexKey[1]==='b' || vexKey[1] === '#')) {
				map[vexKey[0]]={letter:vexKey[0],accidental:vexKey[1]};
			}
		});
	}
	static updateAccidentalMap(note,iterator, keySignature,accidentalMap) {
		var sigObj = {};
		var newObj = {};
		if (iterator.index === 0) {
			smoTickIterator._getAccidentalsForKey(keySignature,newObj);
			sigObj=newObj;
		}
		else {
			sigObj = accidentalMap[iterator.index - 1];
		}
		for (var i = 0; i < note.pitches.length; ++i) {
			var pitch = note.pitches[i];
			var letter = pitch.letter.toLowerCase();
			var sigLetter = letter+pitch.accidental;
			var sigKey = vexMusic.getKeySignatureKey(letter, keySignature);
			
			if (sigObj && sigObj[letter]) {
				var currentVal = sigObj[letter].key+sigObj[letter].accidental;
				if (sigLetter != currentVal) {
					newObj[letter] = pitch;
				}
			} else {
				if (sigLetter != sigKey) {
					newObj[letter] = pitch;
				}
			}
		}
		accidentalMap.push(newObj);
	}
	
	static hasActiveAccidental(pitch, iteratorIndex, accidentalMap) {
		if (iteratorIndex === 0) 
			return false;
	    var vexKey = pitch.letter;
	    var letter = vexKey;
	    var accidental = pitch.accidental.length > 0 ? pitch.accidental: 'n';		

	    // Back up the accidental map until we have a match, or until we run out
	    for (var i = iteratorIndex; i > 0; --i) {
	        var map = accidentalMap[i - 1];
	        var mapKeys = Object.keys(map);
	        for (var j = 0; j < mapKeys.length; ++j) {
	            var mapKey = mapKeys[j];
	            // The letter name + accidental in the map
	            var mapLetter = map[mapKey];
	            var mapAcc = mapLetter.accidental ? mapLetter.accidental : 'n';			

	            // if the letters match and the accidental...
	            if (mapLetter.letter.toLowerCase() === letter && mapAcc == accidental) {
	                return true;
	            }
	        }
	    }
		return false;
	}
	getTupletInfo(index) {
		var tuplets = Object.keys(this.tupletMap);
		for (var i=0;i<tuplets.length;++i) {
			var tupletInfo = this.tupletMap[tuplets[i]];
			if (tupletInfo.startIndex <= index && tupletInfo.endIndex >= index) {
				return tupletInfo;
			}
		}
		return {};
	}

    // ## todo: is promise useful here?
    _iterate(actor) {
        this.state = 'RUNNING';
        for (this.index = this.startIndex; this.index < this.endIndex; ++this.index) {
            var note = this.notes[this.index];

            // save the starting point, tickwise
            this.durationMap.push(this.totalDuration);

            // the number of ticks for this note
            this.delta = (note.ticks.numerator / note.ticks.denominator) + note.ticks.remainder;
			this.deltaMap.push(this.delta);

            if (note['tuplet'] && note.tuplet['attrs']) {
                var normalizedTicks = VF.durationToTicks(note.duration);
                if (typeof (this.tupletMap[note.tuplet.attrs.id]) == 'undefined') {
                    this.tupletMap[note.tuplet.attrs.id] = {
                        startIndex: this.index,
						tupletIndex:0,
                        startTick: this.totalDuration,
                        smallestDuration: normalizedTicks,
						num_notes:note.tuplet.num_notes,
						durations:[this.delta]
                    };
                } else {
                    var entry = this.tupletMap[note.tuplet.attrs.id];

                    entry.endIndex = this.index;
                    entry.endTick = this.totalDuration + this.delta;
                    entry.smallestDuration = ((normalizedTicks < entry.smallestDuration) ? normalizedTicks : entry.smallestDuration);
					entry.durations.push(this.delta);
                }
            }

            // update the tick count for the current range.
            this.duration += this.delta;

            // update the tick count for the whole array/measure
            this.totalDuration += this.delta;
			
			smoTickIterator.updateAccidentalMap(note,this, this.keySignature,this.accidentalMap);

            var rv = actor(this,note,this.accidentalMap);
            if (rv === false) {
                break;
            }
        }
        this.state = 'COMPLETE';
    }
    iterate(actor) {
        // todo add promise
        this._iterate(actor);
    }
    
    // ## getTickIndex
    // get the index into notes array that takes up
    // duration of ticks */
    getTickIndex(index, duration) {
        if (index == 0)
            return 0;
        var initial = this.durationMap[index];
        var delta = 0;
        while (index < this.notes.length && delta < duration) {
            index += 1;
            delta += this.durationMap[index] - this.durationMap[index - 1];
        }
        return index;
    }
    // ## skipNext
    // ## Description:
    // skip some number of notes in the iteration, because we want to skip over them.
    skipNext(skipCount) {
        var rv = [];
        var startRange = this.index;
        // var tuplen = note.tupletStack[0].notes.length;
        var endRange = this.index + skipCount;
        rv = this.notes.slice(startRange, endRange);
        this.index = endRange;
        // this.startRange = this.index;
        return rv;
    }
}

class smoMeasureIterator {
	constructor(system,options) {
		this.measures=system.measures;
		this.index = this.startIndex = 0;
		this.endIndex = this.measures.length;
		Vex.Merge(this,options);
	}
	
	iterate(actor) {
		for (this.index=this.startIndex;this.index<this.endIndex;this.index+=1) {
			var measure=this.measures[this.index];
			actor(this,measure);
		}
	}
}

/* iterate over a set of notes, creating a map of notes to ticks */
VX.TICKMAP = (measure) => {
    var iterator = new smoTickIterator(measure);
	iterator.iterate(smoTickIterator.nullActor,measure);
	return iterator;
}

;
class BeamModifierBase {
	constructor(){}
	beamNote(note, iterator,accidentalMap) {	}
}

class smoBeamerFactory {	
	static applyBeams(measure) {		
        var beamer = new smoBeamModifier(measure);
        var apply = new smoBeamerIterator(measure, [beamer]);
        apply.run();
	}
}

class smoBeamerIterator {
	constructor(measure,actors) {
		this.actors=actors;
		this.measure=measure;		
	}
	
	get iterator() {
		return this._iterator;
	}
	
	//  ### run
	//  ###  Description:  start the iteration on this set of notes
	run() {
		var self=this;
		var iterator = new smoTickIterator(this.measure);
		iterator.iterate((iterator,note,accidentalMap) => {
			for (var i=0;i<self.actors.length;++i) {
				self.actors[i].beamNote(iterator,note,accidentalMap);
			}
		});
	}
}

class smoBeamModifier extends BeamModifierBase {
    constructor(measure) {
        super();
		this.measure=measure;
		this.measure.beamGroups=[];
        this.duration = 0;
        this.timeSignature = measure.timeSignature;
        this.meterNumbers = this.timeSignature.split('/').map(number => parseInt(number, 10));

        this.duration = 0;
        this.startRange = 0;
        // beam on 1/4 notes in most meter, triple time dotted quarter
        this.beamBeats = 2 * 2048;
        if (this.meterNumbers[0] % 3 == 0) {
            this.beamBeats = 3 * 2048;
        }
        this.skipNext = 0;
        this.beamGroup = false;
        this.currentGroup = [];
    }

    get beamGroups() {
        return this.measure.beamGroups;
    }

    beamNote(iterator, note, accidentalMap) {

        this.duration += iterator.delta;

        // beam tuplets
        if (note.isTuplet()) {
            //todo: when does stack have more than 1?
            var tuplet = this.measure.getTupletForNote(note);
            var ult = tuplet.notes[tuplet.notes.length - 1];
            // is this beamable
            if (vexMusic.durationToTicks(note.duration) < 4096) {
                this.beamGroup = true;
                this.currentGroup.push(note);
            }
            // Ultimate note in tuplet
            if (ult.attrs.id === note.attrs.id) {
				// don't beam groups of 1
				if (this.currentGroup.length>1) {
					this.measure.beamGroups.push(new SmoBeamGroup({
							notes: this.currentGroup
						}));
				}
                this.currentGroup = [];
                this.duration = 0;
                this.startRange = iterator.index + 1;
            }
            return note;
        }

        // don't beam > 1/4 note in 4/4 time
        if (iterator.delta >= this.beamBeats) {
            this.duration = 0;
            this.startRange = iterator.index + 1;
            return note;
        }

        this.currentGroup.push(note);
        if (this.duration == this.beamBeats) {
            this.measure.beamGroups.push(new SmoBeamGroup({
                    notes: this.currentGroup
                }));
            this.currentGroup = [];
            this.startRange = iterator.index + 1;
            this.duration = 0;
            return note;
        }

        // If this does not align on a beat, don't beam it
        if (this.duration > this.beamBeats ||
            ((iterator.totalDuration - this.duration) % this.beamBeats != 0)) {
            this.duration = 0;
            this.currentGroup = [];
            return note;
        }
    }
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

// this file contains utilities that change the duration of notes in a measure.

// ## SmoTickTransformer
//  Base class for duration transformations.  I call them transformations because this can
//  create and delete notes, as opposed to modifiers which act on existing notes.
class SmoTickTransformer {
    constructor(measure, actors, options) {
        this.notes = measure.notes;
        this.measure = measure;
        this.vxNotes = [];
        this.actors = actors ? actors : [];
        this.keySignature = 'C';
        this.accidentalMap = [];
        Vex.Merge(this, options);
    }
    static nullActor(note) {
        return note;
    }
	// ## applyTransform
	// create a transform with the given actors and run it against the supplied measure
	static applyTransform(measure,actors) {
		var actAr = (Array.isArray(actors)) ? actors : [actors];
    	measure.clearAccidentals();
		measure.clearBeamGroups();
        var transformer = new SmoTickTransformer(measure, actAr);
        transformer.run();
        measure.notes = transformer.notes;
	}
    // ## transformNote
    // call the actors for each note, and put the result in the note array.
    // The note from the original array is copied and sent to each actor.
    //
    // Because the resulting array can have a different number of notes than the existing
    // array, the actors communicate with the transformer in the following, jquery-ish
    // but somewhat unintuitive way:
    //
    // 1. if the actor returns null, the next actor is called and the results of that actor are used
    // 2. if all the actors return null, the copy is used.
    // 3. if a note object is returned, that is used for the current tick and no more actors are called.
    // 4. if an array of notes is returned, it is concatenated to the existing note array and no more actors are called.
    //     Note that *return note;* and *return [note];* produce the same result.
    // 5. if an empty array [] is returned, that copy is not added to the result.  The note is effectively deleted.
    transformTick(iterator, note) {
        var self = this;
       
        for (var i = 0; i < this.actors.length; ++i) {
			var actor=this.actors[i];
            var newNote = actor.transformTick(note, iterator, iterator.accidentalMap);
            if (newNote == null) {
				this.vxNotes.push(note); // no change
                continue;
            }
            if (Array.isArray(newNote)) {
                if (newNote.length === 0) {
                    return;
                }
                this.vxNotes = this.vxNotes.concat(newNote);
                return;
            }
            this.vxNotes.push(newNote);
            return;
        }
    }

    run() {
        var self = this;
        var iterator = new smoTickIterator(this.measure);
        iterator.iterate((iterator, note, accidentalMap) => {
            self.transformTick(iterator, note, accidentalMap);
        });

        this.notes = this.vxNotes;
        return this.vxNotes;
    }
}

// ## A note transformer is just a function that modifies a note in some way.
// Any number of transformers can be applied to a note.
class TickTransformBase {
    constructor() {}
    transformTick(note, iterator, accidentalMap) {
        return note;
    }
}
// ## VxContractActor
// Contract the duration of a note, filling in the space with another note
// or rest.
//
class SmoContractNoteActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index == this.startIndex) {
            var notes = [];
            var noteCount = Math.floor(note.ticks.numerator / this.newTicks);
            var notes = [];
			var remainder = note.ticks.numerator;
            var vexDuration = vexMusic.ticksToDuration[this.newTicks];
            /**
             *  Replace 1 note with noteCOunt notes of newTIcks duration
             *      old map:
             *     d  .  d  .  .
             *     new map:
             *     d  d  d  .  .
             */
            for (var i = 0; i < noteCount; ++i) {
                notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        duration: vexDuration
                    }));
				remainder = remainder - this.newTicks;
            }
			
			if (remainder > 0) {
				vexDuration = vexMusic.ticksToDuration[remainder];
				notes.push(new SmoNote({
                        clef: note.clef,
                        pitches: JSON.parse(JSON.stringify(note.pitches)),
                        duration: vexDuration
                    }));
			}
            return notes;
        }

        return null;
    }
}

// ## VxStretchTupletActor
// Stretch a note in a tuplet, removing or shortening other notes in the tuplet
// ## Parameters:
//   {changeIndex:changeIndex, multiplier:multiplier,measure:measure}
//
class SmoStretchTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);

        this.tuplet.combine(this.startIndex, this.endIndex);
        this.durationMap = this.tuplet.durationMap;
    }
    transformTick(note, iterator, accidentalMap) {

        /*
        ## Strategy:
        Before A, after C, leave alone
        At A, send all notes of the tuplet
        Between A+1 and C, return empty array for removed note

        5
        ---------
        | | | | |
        n n n n n
        A | B | C
         */

        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index === this.tupletIndex) {
            return this.tuplet.notes;
        }
        return [];

    }

}

// ## VxContractActor
// Contract the duration of a note in a tuplet by duplicate
// notes of fractional length
//
class SmoContractTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.tuplet = this.measure.getTupletForNote(this.measure.notes[this.changeIndex]);
        this.oldLength = this.tuplet.notes.length;
        this.tupletIndex = this.measure.tupletIndex(this.tuplet);
        this.splitIndex = this.changeIndex - this.tupletIndex;
        this.tuplet.split(this.splitIndex);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.tupletIndex)
            return note;
        if (iterator.index >= this.tupletIndex + this.oldLength)
            return note;
        if (iterator.index == this.changeIndex) {
            return this.tuplet.notes;
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// ## Parameters:
// startIndex: start index of tuplet
// endIndex: end index of tuplet
// measure: Smo measure that the tuplet is contained in.
class SmoUnmakeTupletActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
    }
    transformTick(note, iterator, accidentalMap) {
        if (iterator.index < this.startIndex || iterator.index > this.endIndex) {
            return null;
        }
        if (iterator.index == this.startIndex) {
            var tuplet = this.measure.getTupletForNote(note);
            var ticks = tuplet.totalTicks;
            var vexDuration = vexMusic.ticksToDuration[ticks];
            var nn = SmoNote.cloneWithDuration(note, vexDuration);
            nn.tuplet = {};
            this.measure.removeTupletForNote(note);
            return [nn];
        }
        return [];
    }
}

// ## VxUnmakeTupletActor
// Turn a tuplet into a non-tuplet of the same length
// parameters:
//  {tickmap:tickmap,ticks:ticks,
class SmoMakeTupletActor extends TickTransformBase {
    constructor(params) {
        super();
        Vex.Merge(this, params);
        this.durationMap = [];
        var sum = 0.0; // 819.2
        for (var i = 0; i < this.numNotes; ++i) {
            this.durationMap.push(1.0);
            sum += 1.0;
        }
        var stemValue = this.totalTicks / this.numNotes;
        var stemTicks = 8192;

        // The stem value is the type on the non-tuplet note, e.g. 1/8 note
        // for a triplet.
        while (stemValue < stemTicks) {
            stemTicks = stemTicks / 2;
        }

        this.stemTicks = stemTicks * 2;
        this.rangeToSkip = this._rangeToSkip();

        // special case - is this right?  this is needed for tuplets in 6/8
        if (this.rangeToSkip[1] > this.rangeToSkip[0]) {
            this.stemTicks = stemTicks;
        } else {
            this.stemTicks = stemTicks * 2;
        }

        this.vexDuration = vexMusic.ticksToDuration[this.stemTicks];
        this.tuplet = [];
        // skip notes in the original array if we are taking up
        // multiple notes

    }
    _rangeToSkip() {
        var ticks = this.measure.tickmap();
        var accum = 0;
        var rv = [];
        rv.push(this.index);
        for (var i = 0; i < ticks.deltaMap.length; ++i) {
            if (i >= this.index) {
                accum += ticks.deltaMap[i];
            }
            if (accum >= this.totalTicks) {
                rv.push(i);
                break;
            }
        }
        return rv;
    }
    transformTick(note, iterator, accidentalMap) {
        // if our tuplet replaces this note, make sure we make it go away.
        if (iterator.index > this.index && iterator.index <= this.rangeToSkip[1]) {
            return [];
        }
        if (iterator.index != this.index) {
            return null;
        }
        for (var i = 0; i < this.numNotes; ++i) {
            note = SmoNote.cloneWithDuration(note, this.vexDuration);

            this.tuplet.push(note);
        }
        var tuplet = new SmoTuplet({
                notes: this.tuplet,
                stemTicks: this.stemTicks,
                totalTicks: this.totalTicks,
                ratioed: false,
                bracketed: true,
                startIndex: iterator.index,
                durationMap: this.durationMap,
                location: 1
            });
        this.measure.tuplets.push(tuplet);
        return this.tuplet;
    }
}

class SmoStretchNoteActor extends TickTransformBase {
    constructor(parameters) {
        super();
        Vex.Merge(this, parameters);
        this.vexDuration = vexMusic.ticksToDuration[this.newTicks];
        this.endIndex = this.index + 1;
        this.startTick = this.tickmap.durationMap[this.startIndex];

        var endTick = this.tickmap.durationMap[this.startIndex] + this.newTicks;
        this.divisor = -1;
        this.durationMap = [];
        this.skipFromStart = this.startIndex + 1;
        this.skipFromEnd = this.startIndex + 1;
        this.durationMap.push(this.newTicks);

        var mapIx = this.tickmap.durationMap.indexOf(endTick);

        var remaining = this.tickmap.deltaMap.slice(this.startIndex, this.tickmap.durationMap.length).reduce((accum, x) => x + accum);
        if (remaining === this.newTicks) {
            mapIx = this.tickmap.deltaMap.length;
        }

        // If there is no tickable at the end point, try to split the next note
        /**
         *      old map:
         *     d  . d  .
         *     split map:
         *     d  .  d  d
         *     new map:
         *     d .   .  d
         */
        if (mapIx < 0) {
            var npos = this.tickmap.durationMap[this.startIndex + 1];
            var ndelta = this.tickmap.deltaMap[this.startIndex + 1];
            if (ndelta / 2 + this.startTick + this.newTicks <= this.tickmap.totalDuration) {
                this.durationMap.push(ndelta / 2);
            } else {
                // there is no way to do this...
                this.durationMap = [];

            }
        } else {
            // If this note now takes up the space of other notes, remove those notes
            for (var i = this.startIndex + 1; i < mapIx; ++i) {
                this.durationMap.push(0);
            }
        }
    }
    transformTick(note, iterator, accidentalMap) {
        if (this.durationMap.length == 0) {
            return null;
        }
        if (iterator.index >= this.startIndex && iterator.index < this.startIndex + this.durationMap.length) {
            var mapIndex = iterator.index - this.startIndex;
            var ticks = this.durationMap[mapIndex];
            if (ticks == 0) {
                return [];
            }
            var vexDuration = vexMusic.ticksToDuration[ticks];
            var note = SmoNote.cloneWithDuration(note, vexDuration);
            return [note];
        }
        return null;
    }
}
;/////////////////
// # selections.js
// Editing operations are performed on selections.  A selection can be different things, from a single pitch
// to many notes.  These classes standardize some standard selection operations.
//
//
// ## SmoSelector
// ## Description:
// There are 2 parts to a selection: the actual musical bits that are selected, and the
// indices that define what was selected.  This is the latter.  The actual object does not
// have any methods so there is no constructor.
class SmoSelector {
    static sameNote(sel1, sel2) {
        return (sel1.staff == sel2.staff && sel1.measure == sel2.measure && sel1.voice == sel2.voice
             && sel1.tick == sel2.tick);
    }
    static sameMeasure(sel1, sel2) {
        return (sel1.staff == sel2.staff && sel1.measure == sel2.measure);
    }
	
	static sameStaff(sel1,sel2) {
		return sel1.staff === sel2.staff;
	}

	// return true if testSel is contained in the selStart to selEnd range.
    static contains(testSel, selStart, selEnd) {
        var geStart =
            selStart.measure < testSel.measure ||
            (selStart.measure === testSel.measure && selStart.tick <= testSel.tick);
        var leEnd =
            selEnd.measure > testSel.measure ||
            (selEnd.measure === testSel.measure && testSel.tick <= selEnd.tick);

        return geStart && leEnd;
    }
	
	// create a hashmap key for a single note, used to organize modifiers
	static selectorNoteKey(selector) {
		return 'staff-'+selector.staff+'-measure-'+selector.measure+'-voice-'+selector.voice+'-tick-'+selector.tick;
	}
}

// ## SmoSelection
// ## Description:
// A selection is a selector and a set of references to musical elements, like measure etc.
// The staff and measure are always a part of the selection, and possible a voice and note,
// and one or more pitches.  Selections can also be made from the UI by clicking on an element
// or navigating to an element with the keyboard.
class SmoSelection {
    static measureSelection(score, staffIndex, measureIndex) {
        staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
        var selector = {
            staff: staffIndex,
            measure: measureIndex
        };
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];

        return new SmoSelection
        ({
            selector: selector,
            _staff: staff,
            _measure: measure,
            type: 'measure'
        });
    }

    static noteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
        staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[tickIndex];
        var selector = {
            staff: staffIndex,
            measure: measureIndex,
            voice: voiceIndex,
            tick: tickIndex
        };
        return new SmoSelection({
            selector: selector,
            _staff: staff,
            _measure: measure,
            _note: note,
            _pitches: [],
            type: 'note'
        });
    }

    static renderedNoteSelection(score, nel,box) {
        var elementId = nel.getAttribute('id');
        for (var i = 0; i < score.staves.length; ++i) {
            var staff = score.staves[i];
            for (var j = 0; j < staff.measures.length; ++j) {
                var measure = staff.measures[j];
                for (var k = 0; k < measure.voices.length; ++k) {
                    var voice = measure.voices[k];
                    for (var m = 0; m < voice.notes.length; ++m) {
                        var note = voice.notes[m];
                        if (note.renderId === elementId) {
                            var selector = {
                                staff: i,
                                measure: j,
                                voice: k,
                                tick: m,
                                pitches: []
                            };
                            // var box = document.getElementById(nel.id).getBBox();
                            var rv = new SmoSelection({
                                    selector: selector,
                                    _staff: staff,
                                    _measure: measure,
                                    _note: note,
                                    _pitches: [],
                                    box: box,
                                    type: 'rendered'
                                });

                            return rv;
                        }
                    }
                }
            }
        }
        return null;
    }

    static pitchSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex, pitches) {
        staffIndex = staffIndex != null ? staffIndex : score.activeStaff;
        measureIndex = measureIndex ? measureIndex : 0;
        voiceIndex = voiceIndex ? voiceIndex : 0;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        var note = measure.voices[voiceIndex].notes[tickIndex];
        pitches = pitches ? pitches : [];
        var pa = [];
        pitches.forEach((ix) => {
            pa.push(JSON.parse(JSON.stringify(note.pitches[ix])));
        });
        var selector = {
            staff: staffIndex,
            measure: measureIndex,
            voice: voiceIndex,
            tick: tickIndex,
            pitches: pitches
        };
        return new SmoSelection({
            selector: selector,
            _staff: staff,
            _measure: measure,
            _note: note,
            _pitches: pa,
            type: 'pitches'
        });
    }

    // ## nextNoteSelection
    // ## Description:
    // Return the next note in this measure, or the first note of the next measure, if it exists.
    static nextNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
        var nextTick = tickIndex + 1;
        var nextMeasure = measureIndex + 1;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        if (measure.voices[voiceIndex].notes.length > nextTick) {
            return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, nextTick);
        }
        if (staff.measures.length > nextMeasure) {
            return SmoSelection.noteSelection(score, staffIndex, nextMeasure, voiceIndex, 0);
        }
        return null;
    }

    static lastNoteSelection(score, staffIndex, measureIndex, voiceIndex, tickIndex) {
        var lastTick = tickIndex - 1;
        var lastMeasure = measureIndex - 1;
        var staff = score.staves[staffIndex];
        var measure = staff.measures[measureIndex];
        if (tickIndex > 0) {
            return SmoSelection.noteSelection(score, staffIndex, measureIndex, voiceIndex, lastTick);
        }
        if (measureIndex > 0) {
            measure = staff.measures[lastMeasure];
            var noteIndex = staff.measures[lastMeasure].voices[voiceIndex].notes.length - 1;
            return SmoSelection.noteSelection(score, staffIndex, lastMeasure, voiceIndex, noteIndex);
        }
        return null;
    }

    constructor(params) {
        this.selector = {
            staff: 0,
            measure: 0,
            voice: 0,
            note: 0,
            pitches: []
        }
        this._staff = null;
        this._measure = null;
        this._note = null;
        this._pitches = [];
        this._box = svgHelpers.pointBox(0, 0);

        this.selectionGroup = {
            id: VF.Element.newID(),
            type: 'SmoSelection'
        };
        Vex.Merge(this, params);
    }

    get staff() {
        return this._staff;
    }
    get measure() {
        return this._measure;
    }

    get note() {
        return this._note;
    }
    get pitches() {
        if (this._pitches.length) {
            return this._pitches;
        } else if (this._note) {
            this._pitches = JSON.parse(JSON.stringify(this.note.pitches));
            return this._pitches;
        }
        return [];
    }
}
;
// An operation works on a selection or set of selections to edit the music
class SmoOperation {

    // ## doubleDuration
    // ## Description
    // double the duration of a note in a measure, at the expense of the following
    // note, if possible.  Works on tuplets also.
    static doubleDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount * 2;
            var actor = new SmoStretchNoteActor({
                    startIndex: selection.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);
        } else {
            var startIndex = tuplet.getIndexOfNote(note);
            var endIndex = startIndex + 1;
            if (endIndex >= tuplet.notes.length) {
                return;
            }
            var actor = new SmoStretchTupletActor({
                    changeIndex: measure.tupletIndex(tuplet),
                    startIndex: startIndex,
                    endIndex: endIndex,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);
        }
        return true;

    }

    // ## halveDuration
    // ## Description
    // Replace the note with 2 notes of 1/2 duration, if possible
    // Works on tuplets also.
    static halveDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var tuplet = measure.getTupletForNote(note);
        if (!tuplet) {
            var nticks = note.tickCount / 2;
            var actor = new SmoContractNoteActor({
                    startIndex: selection.selector.tick,
                    tickmap: measure.tickmap(),
                    newTicks: nticks
                });
            SmoTickTransformer.applyTransform(measure, actor);

        } else {
            var startIndex = measure.tupletIndex(tuplet) + tuplet.getIndexOfNote(note);
            var actor = new SmoContractTupletActor({
                    changeIndex: startIndex,
                    measure: measure
                });
            SmoTickTransformer.applyTransform(measure, actor);
        }
    }

    // ## makeTuplet
    // ## Description
    // Makes a non-tuplet into a tuplet of equal value.
    static makeTuplet(selection, numNotes) {
        var note = selection.note;
        var measure = selection.measure;
        if (measure.getTupletForNote(note))
            return;
        var nticks = note.tickCount;

        var actor = new SmoMakeTupletActor({
                index: selection.selector.tick,
                totalTicks: nticks,
                numNotes: numNotes,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## unmakeTuplet
    // ## Description
    // Makes a tuplet into a single with the duration of the whole tuplet
    static unmakeTuplet(selection) {
        var note = selection.note;
        var measure = selection.measure;
        if (!measure.getTupletForNote(note))
            return;
        var tuplet = measure.getTupletForNote(note);
        if (tuplet === null)
            return;
        var startIndex = measure.tupletIndex(tuplet);
        var endIndex = tuplet.notes.length + startIndex - 1;

        var actor = new SmoUnmakeTupletActor({
                startIndex: startIndex,
                endIndex: endIndex,
                measure: measure
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## dotDuration
    // ## Description
    // Add a dot to a note, if possible, and make the note ahead of it shorter
    // to compensate.
    static dotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = vexMusic.getNextDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoStretchNoteActor({
                startIndex: selection.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## undotDuration
    // ## Description
    // Add the value of the last dot to the note, increasing length and
    // reducing the number of dots.
    static undotDuration(selection) {
        var note = selection.note;
        var measure = selection.measure;
        var nticks = vexMusic.getPreviousDottedLevel(note.tickCount);
        if (nticks == note.tickCount) {
            return;
        }
        var actor = new SmoContractNoteActor({
                startIndex: selection.selector.tick,
                tickmap: measure.tickmap(),
                newTicks: nticks
            });
        SmoTickTransformer.applyTransform(measure, actor);
        return true;
    }

    // ## transpose
    // ## Description
    // Transpose the selected note, trying to find a key-signature friendly value
    static transpose(selection, offset) {
        var measure = selection.measure;
        var note = selection.note;
        if (measure && note) {
            note.transpose(selection.selector.pitches, offset, measure.keySignature);
            return true;
        }
        return false;
    }

    // ## setPitch
    // ## Description:
    // pitches can be either an array, a single pitch, or a letter.  In the latter case,
    // the letter value appropriate for the key signature is used, e.g. c in A major becomes
    // c#
    static setPitch(selection, pitches) {
        var measure = selection.measure;
        var note = selection.note;
        // TODO allow hint for octave
        var octave = note.pitches[0].octave;
        note.pitches = [];
        if (!Array.isArray(pitches)) {
            pitches = [pitches];
        }
        pitches.forEach((pitch) => {
            var letter = pitch;
            if (typeof(pitch) === 'string') {
                var letter = vexMusic.getKeySignatureKey(pitch[0], measure.keySignature);
                pitch = {
                    letter: letter[0],
                    accidental: letter.length > 1 ? letter.substring(1) : '',
                    octave: octave
                };
            }

            note.pitches.push(pitch);
        });
        return true;
    }

    // ## interval
    // ## Description:
    // Add a pitch at the specified interval to the chord in the selection.
    static interval(selection, interval) {
        var measure = selection.measure;
        var note = selection.note;

        // TODO: figure out which pitch is selected
        var pitch = note.pitches[0];
        var pitch = vexMusic.getIntervalInKey(pitch, measure.keySignature, interval);
        if (pitch) {
            note.pitches.push(pitch);
            return true;
        }
        return false;
    }

    static crescendo(fromSelection, toSelection) {
        var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
        var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
        var modifier = new SmoStaffHairpin({
                startSelector: fromSelector,
                endSelector: toSelector,
                hairpinType: SmoStaffHairpin.types.CRESCENDO,
                position: SmoStaffHairpin.positions.BELOW
            });
        fromSelection.staff.addStaffModifier(modifier);
    }
	
	static decrescendo(fromSelection, toSelection) {
        var fromSelector = JSON.parse(JSON.stringify(fromSelection.selector));
        var toSelector = JSON.parse(JSON.stringify(toSelection.selector));
        var modifier = new SmoStaffHairpin({
                startSelector: fromSelector,
                endSelector: toSelector,
                hairpinType: SmoStaffHairpin.types.DECRESCENDO,
                position: SmoStaffHairpin.positions.BELOW
            });
        fromSelection.staff.addStaffModifier(modifier);
    }

}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description:
//   Create a staff and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4'
class VxMeasure {
    constructor(context, options) {
        this.context = context;
        Vex.Merge(this, VxMeasure.defaults);
        Vex.Merge(this, options);
        this.smoMeasure = this.smoMeasure ? this.smoMeasure : new SmoMeasure(options);
        this.noteToVexMap = {};
        this.beamToVexMap = {};
        this.tupletToVexMap = {};
        this.modifierOptions = {};
        this.tickmap = this.smoMeasure.tickmap();

        this.vexNotes = [];
        this.vexBeamGroups = [];
        this.vexTuplets = [];
    }

    static get defaults() {
        // var defaultLayout = new smrfSimpleLayout();

        return {
            smoMeasure: null
        };
    }
    addCustomModifier(ctor, parameters) {
        this.smoMeasure.addCustomModifier(ctor, parameters);
    }

    applyTransform(actor) {
        SmoTickTransformer.applyTransform(this.smoMeasure, [actor]);
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    applyModifiers() {
        smoModifierFactory.applyModifiers(this.smoMeasure);
    }
    tickmap() {
        return VX.TICKMAP(this.smoMeasure);
    }

    // ## Description:
    // decide whether to force stem direction for multi-voice, or use the default.
    // ## TODO:
    // use x position of ticks in other voices, pitch of note, and consider
    // stem direction modifier.
    applyStemDirection(vxParams) {
        if (this.smoMeasure.voices.length === 1) {
            vxParams.auto_stem = true;
        } else if (this.smoMeasure.activeVoice % 2) {
            vxParams.stem_direction = -1;
        } else {
            vxParams.stem_direction = 1;
        }
    }

    // ## Description:
    // convert a smoNote into a vxNote so it can be rasterized
    _createVexNote(smoNote, tickIndex) {
        var noteParams = {
            clef: smoNote.clef,
            keys: smoNote.toVexKeys(),
            duration: smoNote.duration + smoNote.noteType
        };
        this.applyStemDirection(noteParams);
        var vexNote = new VF.StaveNote(noteParams);
        smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?
        
		// consider accidentals in measure in earlier notes.
        var accidentals = tickIndex === 0 ? {} : this.tickmap.accidentalMap[tickIndex-1];
        for (var i = 0; i < smoNote.pitches.length; ++i) {
            var pitch = smoNote.pitches[i];
			var accidental = pitch.accidental ?  pitch.accidental : 'n';
            var defaultAccidental = vexMusic.getKeySignatureKey(pitch.letter, this.smoMeasure.keySignature);
            defaultAccidental = defaultAccidental.length > 1 ? defaultAccidental[1] : 'n';

            // was this accidental declared earlier in the measure?
            var declared = accidentals[pitch.letter] && accidentals[pitch.letter].accidental === pitch.accidental;

            if ((accidental != defaultAccidental && !declared) || pitch.cautionary) {
                var acc = new VF.Accidental(accidental);

                if (pitch.cautionary) {
                    acc.setAsCautionary();
                }
                vexNote.addAccidental(i, acc);
            }
        }
        for (var i = 0; i < smoNote.dots; ++i) {
            vexNote.addDotToAll();
        }

        return vexNote;
    }
	
    // ## Description:
    // create an a array of VF.StaveNote objects to render the active voice.
    createVexNotes() {
        this.vexNotes = [];
        this.noteToVexMap = {};

        for (var i = 0; i < this.smoMeasure.notes.length; ++i) {
            var smoNote = this.smoMeasure.notes[i];
            var vexNote = this._createVexNote(smoNote, i);
            this.noteToVexMap[smoNote.attrs.id] = vexNote;
            this.vexNotes.push(vexNote);
        }
    }

    // ## Description:
    // create the VX beam groups, honoring the Smo custom modifiers
    // ## TODO:
    // make the Smo custom modifiers
    createVexBeamGroups() {
        this.vexBeamGroups = [];
        this.beamToVexMap = {};
        for (var i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
            var bg = this.smoMeasure.beamGroups[i];
            var vexNotes = [];
            var stemDirection = -1;
            for (var j = 0; j < bg.notes.length; ++j) {
                var note = bg.notes[j];
                var vexNote = this.noteToVexMap[note.attrs.id]
                    if (j === 0) {
                        stemDirection = vexNote.getStemDirection();
                    } else {
                        vexNote.setStemDirection(stemDirection);
                    }
                    vexNotes.push(this.noteToVexMap[note.attrs.id]);
            }
            var vexBeam = new VF.Beam(vexNotes);
            this.beamToVexMap[bg.attrs.id] = vexBeam;
            this.vexBeamGroups.push(vexBeam);
        }
    }

    // ## Description:
    // Create the VF tuplet objects based on the smo tuplet objects
    // that have been defined.
    createVexTuplets() {
        this.vexTuplets = [];
        this.tupletToVexMap = {};
        for (var i = 0; i < this.smoMeasure.tuplets.length; ++i) {
            var tp = this.smoMeasure.tuplets[i];
            var vexNotes = [];
            for (var j = 0; j < tp.notes.length; ++j) {
                var smoNote = tp.notes[j];
                vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
            }
            var vexTuplet = new VF.Tuplet(vexNotes, {
                    num_notes: tp.num_notes,
                    notes_occupied: tp.notes_occupied,
                    ratioed: false,
                    bracketed: true,
                    location: 1
                });
            this.tupletToVexMap[tp.attrs.id] = vexTuplet;
            this.vexTuplets.push(vexTuplet);
        }
    }
    unrender() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();
    }
    get renderedSize() {
        if (this.smoMeasure.renderedSize) {
            return this.smoMeasure.renderedSize;
        }
        return null;
    }

    // ## Description:
    // Render all the notes in my smoMeasure.  All rendering logic is called from here.
    render() {
        $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();

        var group = this.context.openGroup();
        group.classList.add(this.smoMeasure.attrs.id);

        // offset for left-hand stuff
        var staffMargin = (this.smoMeasure.forceClef ? 40 : 0)
         + (this.smoMeasure.forceTimeSignature ? 16 : 0)
         + (this.smoMeasure.forceKeySignature ? vexMusic.keySignatureLength[this.smoMeasure.keySignature] * 8 : 0);
        var staffWidth = this.smoMeasure.staffWidth
             + staffMargin;

        //console.log('measure '+JSON.stringify(this.smoMeasure.measureNumber,null,' ')+' x: ' + this.smoMeasure.staffX + ' y: '+this.smoMeasure.staffY
        // + 'width: '+staffWidth);
        this.stave = new VF.Stave(this.smoMeasure.staffX, this.smoMeasure.staffY, staffWidth);
        //console.log('adjX is '+this.smoMeasure.adjX);

        // Add a clef and time signature.
        if (this.smoMeasure.forceClef) {
            this.stave.addClef(this.smoMeasure.clef);
        }
        if (this.smoMeasure.forceKeySignature) {
            this.stave.addKeySignature(this.smoMeasure.keySignature);
        }
        if (this.smoMeasure.forceTimeSignature) {
            this.stave.addTimeSignature(this.smoMeasure.timeSignature);
        }
        // Connect it to the rendering context and draw!
        this.stave.setContext(this.context).draw();

        var voiceAr = [];

        // If there are multiple voices, add them all to the formatter at the same time so they don't collide
        for (var j = 0; j < this.smoMeasure.voices.length; ++j) {

            this.smoMeasure.activeVoice = j;
            this.createVexNotes();
            this.createVexTuplets();
            this.createVexBeamGroups();

            // Create a voice in 4/4 and add above notes
            var voice = new VF.Voice({
                    num_beats: this.smoMeasure.numBeats,
                    beat_value: this.smoMeasure.beatValue
                });
            voice.addTickables(this.vexNotes);
            voiceAr.push(voice);
        }
        this.formatter = new VF.Formatter().joinVoices(voiceAr).format(voiceAr, this.smoMeasure.staffWidth - this.smoMeasure.adjX);
        for (var j = 0; j < voiceAr.length; ++j) {
            voiceAr[j].draw(this.context, this.stave);
        }

        var self = this;
        this.vexBeamGroups.forEach(function (b) {
            b.setContext(self.context).draw();
        });

        this.vexTuplets.forEach(function (tuplet) {
            tuplet.setContext(self.context).draw();
        });
        var box = group.getBoundingClientRect();
        this.smoMeasure.renderedBox = {
            x: box.x,
            y: box.y,
            height: box.height,
            width: box.width
        };
        this.smoMeasure.changed = false;

        // Calculate how far off our estimated width we are
        var svgBox =
            svgHelpers.clientToLogical(this.context.svg, box);
        this.smoMeasure.adjX = svgBox.width - this.stave.getWidth() + this.smoMeasure.rightMargin;
		// console.log('adjx is '+this.smoMeasure.adjX);
        // console.log(JSON.stringify(this.smoMeasure.renderedBox,null,' '));
        this.context.closeGroup();
    }

}
;// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
class VxSystem {
    constructor(context, topY, lineIndex) {
        this.context = context;
        this.leftConnector = [null, null];
        this.lineIndex = lineIndex;
        this.maxStaffIndex = -1;
        this.maxSystemIndex = -1;
        this.width = -1;
        this.endcaps = [];
        this.box = {
            x: -1,
            y: -1,
            width: 0,
            height: 0
        };
        this.currentY = 0;
        this.topY = topY;
        this.clefWidth = 70;
        this.ys = [];
        this.measures = [];
        this.modifiers = [];
    }

    getVxNote(smoNote) {
        var note;
		if (!smoNote) {
			return null;
		}
        for (var i = 0; i < this.measures.length; ++i) {
            var mm = this.measures[i];
            if (mm.noteToVexMap[smoNote.id]) {
                return mm.noteToVexMap[smoNote.id];
            }
        }
        return null;
    }

    renderModifier(modifier, vxStart, vxEnd) {
		// if it is split between lines, render one artifact for each line, with a common class for 
		// both if it is removed.
		var artifactId=modifier.attrs.id+'-'+this.lineIndex;
        $(this.context.svg).find('g.' + artifactId).remove();
		var group = this.context.openGroup();
		group.classList.add(modifier.id);
		group.classList.add(artifactId);
        if ((modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.CRESCENDO) ||
            (modifier.type == 'SmoStaffHairpin' && modifier.hairpinType == SmoStaffHairpin.types.DECRESCENDO)) {
            var hairpin = new VF.StaveHairpin({
                    first_note: vxStart,
                    last_note: vxEnd
                }, modifier.hairpinType);
			hairpin.setRenderOptions({
				height:modifier.height,
				y_shift:modifier.yOffset,
				left_shift_px:modifier.xOffsetLeft,
				right_shift_px:modifier.xOffsetRight
			});
            hairpin.setContext(this.context).setPosition(modifier.position).draw();
        }

        this.context.closeGroup();
		return group.getBoundingClientRect();
    }

    // ## renderMeasure
    // ## Description:
    // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
    // groups
    renderMeasure(staffIndex, smoMeasure) {
        var systemIndex = smoMeasure.measureNumber.systemIndex;

        var vxMeasure = new VxMeasure(this.context, {
                smoMeasure: smoMeasure
            });

        vxMeasure.render();

        // Keep track of the y coordinate for the nth staff


        // keep track of left-hand side for system connectors
        if (systemIndex === 0) {
            if (staffIndex === 0) {
                this.leftConnector[0] = vxMeasure.stave;
            } else if (staffIndex > this.maxStaffIndex) {
                this.maxStaffIndex = staffIndex;
                this.leftConnector[1] = vxMeasure.stave;
            }
        } else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
            this.endcaps = [];
            this.endcaps.push(vxMeasure.stave);
            this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
        } else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
            this.endcaps.push(vxMeasure.stave);
        }
        this.measures.push(vxMeasure);
        // this._adjustBox(vxMeasure.renderedSize);
    }

    // ## cap
    // ## Description:
    // draw the system brackets.  I don't know why I call them a cap.
    cap() {
        $(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
        var group = this.context.openGroup();
        group.classList.add('lineBracket-' + this.lineIndex);
        if (this.leftConnector[0] && this.leftConnector[1]) {
            var c1 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.BRACKET);
            var c2 = new VF.StaveConnector(this.leftConnector[0], this.leftConnector[1])
                .setType(VF.StaveConnector.type.SINGLE);
            c1.setContext(this.context).draw();
            c2.setContext(this.context).draw();
        }
        this.context.closeGroup();
    }
}
;VF = Vex.Flow;
Vex.Xform = (typeof(Vex.Xform) == 'undefined' ? {}
     : Vex.Xform);
VX = Vex.Xform;

VX.groupCounter = 1;

// ## Description
// A tracker maps the UI elements to the logical elements ,and allows the user to
// move through the score and make selections, for navigation and editing.
//
// ## Usage:
// new suiTracker(layout)
//
// ## See also:
// layout, controller, menu
class suiTracker {
    constructor(layout) {
        this.layout = layout;
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        this.selections = [];
        this.modifierTabs = {};
        this.modifierIndex = -1;
        this.suggestion = {};
    }

    // ### renderElement
    // the element the score is rendered on
    get renderElement() {
        return this.layout.renderElement;
    }

    get score() {
        return this.layout.score;
    }

    get context() {
        return this.layout.context;
    }

    _copySelections() {
        var rv = [];
        this.selections.forEach((sel) => {
            rv.push(sel.selector)
        });
        return rv;
    }

    _updateStaffModifiers() {
        this.modifierTabs = [];
        var modMap = {};
        this.selections.forEach((selection) => {
            selection.staff.modifiers.forEach((modifier) => {
                if (SmoSelector.contains(selection.selector, modifier.startSelector, modifier.endSelector)) {
                    if (!modMap[modifier.id]) {
                        this.modifierTabs.push({
						modifier:modifier,selection:selection});
                        modMap[modifier.id] = {
                            exists: true
                        };
                    }
                }
            });
        });
    }

    _highlightModifier() {
        if (this.modifierIndex >= 0 && this.modifierIndex < this.modifierTabs.length) {
            var modSelection = this.modifierTabs[this.modifierIndex];
            if (modSelection.modifier.renderedBox) {
                this._drawRect(modSelection.modifier.renderedBox, 'staffModifier');
            } 
        }
    }
	
	clearModifierSelections() {
		this.modifierTabs=[];
		this.modifierIndex=-1;
		this.eraseRect('staffModifier');
		
	}
	getSelectedModifier() {
		if (this.modifierIndex >= 0) {
			return this.modifierTabs[this.modifierIndex];
		}
	}

    advanceModifierSelection() {
		this.eraseRect('staffModifier');

        if (!this.modifierTabs.length) {
            return;
        }
        this.modifierIndex = this.modifierIndex + 1;
		if (this.modifierIndex > this.modifierTabs.length) {
			this.modifierIndex=-1;
			return;
		}
        this._highlightModifier();
    }

    _findClosestSelection(selector) {
        var artifact = this._getClosestTick(selector);
        if (!artifact)
            return;
        if (this.selections.find((sel) => JSON.stringify(sel.selector)
                 === JSON.stringify(artifact.selector))) {
            return;
        }
        this.selections.push(artifact);
    }

    // ### updateMap
    // This should be called after rendering the score.  It updates the score to
    // graphics map and selects the first object.
    //
    // ### TODO:
    // try to preserve the previous selection
    updateMap() {
        var notes = [].slice.call(this.renderElement.getElementsByClassName('vf-stavenote'));
        this.groupObjectMap = {};
        this.objectGroupMap = {};
        this.objects = [];
        var selCopy = this._copySelections();
        notes.forEach((note) => {
			var box = note.getBoundingClientRect();
			// box = svgHelpers.untransformSvgBox(this.context.svg,box);
			var selection = SmoSelection.renderedNoteSelection(this.score, note,box);
			this.objects.push(selection);
		});
        this.selections = [];
        if (this.objects.length && !selCopy.length) {
            console.log('adding selection ' + this.objects[0].note.id);
            this.selections = [this.objects[0]];
        } else {
            selCopy.forEach((sel) => this._findClosestSelection(sel));
        }
        this.highlightSelection();
    }

    static stringifyBox(box) {
        return '{x:' + box.x + ',y:' + box.y + ',width:' + box.width + ',height:' + box.height + '}';
    }

    // ### _mapNoteElementToNote
    // given a svg note group, find the smo element that defines this note;
    _mapNoteElementToNote(nel) {
        var id = nel.getAttribute('id');
        var artifact = SmoSelection.renderedNoteSelection(this.score, nel);
        if (!artifact) {
            console.log('note ' + id + ' not found');
        } else {
            //console.log('note '+JSON.stringify(artifact.smoMeasure.measureNumber,null,' ')+' box: '+
            // suiTracker.stringifyBox(box));
            this.groupObjectMap[id] = artifact;
            this.objectGroupMap[artifact.note.id] = artifact;
            this.objects.push({
                artifact: artifact
            });
        }
    }

    _getClosestTick(selector) {
        var measureObj = this.objects.find((e) => SmoSelector.sameMeasure(e.selector, selector)
                 && e.selector.tick === 0);
        var tickObj = this.objects.find((e) => SmoSelector.sameNote(e.selector, selector));
        if (tickObj)
            return tickObj;
        return measureObj;
    }

    getExtremeSelection(sign) {
        var rv = this.selections[0];
        for (var i = 1; i < this.selections.length; ++i) {
            var sa = this.selections[i].selector;
            if (sa.measure * sign > rv.selector.measure * sign) {
                rv = this.selections[i];
            } else if (sa.measure === rv.selector.measure && sa.tick * sign > rv.selector.tick * sign) {
                rv = this.selections[i];
            }
        }
        return rv;
    }

    // ### _getOffsetSelection
    // Get the selector that is the offset of the first existing selection
    _getOffsetSelection(offset) {
        var increment = offset;
        var testSelection = this.getExtremeSelection(Math.sign(offset));
        var scopyTick = JSON.parse(JSON.stringify(testSelection.selector));
        var scopyMeasure = JSON.parse(JSON.stringify(testSelection.selector));
        scopyTick.tick += increment;
        scopyMeasure.measure += increment;
        var targetMeasure = SmoSelection.measureSelection(this.score, testSelection.selector.staff,
                scopyMeasure.measure);
        if (targetMeasure && targetMeasure.measure) {
            scopyMeasure.tick = (offset < 0) ? targetMeasure.measure.notes.length - 1 : 0;
        }

        if (testSelection.measure.notes.length > scopyTick.tick && scopyTick.tick >= 0) {
            return scopyTick;
        } else if (targetMeasure &&
            scopyMeasure.measure < testSelection.staff.measures.length && scopyMeasure.measure >= 0) {
            return scopyMeasure;
        }
        return testSelection.selector;
    }

    static unionRect(b1, b2) {
        return svgHelpers.unionRect(b1, b2);
    }

    get selectedArtifact() {
        for (var i = 0; i < this.selections.length; ++i) {
            var selection = this.selections[i];
            if (selection['artifact']) {
                return selection.artifact;
            }
        }
        return {};
    }

    growSelectionRight() {
        var nselect = this._getOffsetSelection(1);
        // already selected
        var artifact = this._getClosestTick(nselect);
        if (!artifact) {
            return;
        }
        if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
            return;
        }
        console.log('adding selection ' + artifact.note.id);

        this.selections.push(artifact);
        this.highlightSelection();
    }

    growSelectionLeft() {
        var nselect = this._getOffsetSelection(-1);
        // already selected
        var artifact = this._getClosestTick(nselect);
        if (!artifact) {
            return;
        }
        if (this.selections.find((sel) => SmoSelector.sameNote(sel.selector, artifact.selector))) {
            return;
        }

        console.log('adding selection ' + artifact.note.id);
        this.selections.push(artifact);
        this.highlightSelection();
    }

    moveSelectionRight() {
        if (this.selections.length == 0) {
            return;
        }
        var nselect = this._getOffsetSelection(1);
        this._replaceSelection(nselect);
    }   

    moveSelectionLeft() {
        if (this.selections.length == 0) {
            return;
        }
        var nselect = this._getOffsetSelection(-1);
        this._replaceSelection(nselect);
    }
    moveSelectionLeftMeasure() {
        this._moveSelectionMeasure(-1);
    }
    moveSelectionRightMeasure() {
        this._moveSelectionMeasure(1);
    }
    moveSelectionOffset(offset) {
        var fcn = (offset >= 0 ? 'moveSelectionRight' : 'moveSelectionLeft');
        offset = (offset < 0) ? -1 * offset : offset;
        for (var i = 0; i < offset; ++i) {
            this[fcn]();
        }
    }

    _moveSelectionMeasure(offset) {
        var selection = this.getExtremeSelection(Math.sign(offset));
        selection = JSON.parse(JSON.stringify(selection));
        selection.measure += offset;
        selection.tick = 0;
        var selObj = this._getClosestTick(selection);
        if (selObj) {
            this.selections = [selObj];
        }
        this.highlightSelection();
    }

    _moveStaffOffset(offset) {
        if (this.selections.length == 0) {
            return;
        }

        var nselector = JSON.parse(JSON.stringify(this.selections[0].selector));
        nselector.staff = this.score.incrementActiveStaff(offset);
        this.selections = [this._getClosestTick(nselector)];
        this.highlightSelection();
    }
    moveSelectionUp() {
        this._moveStaffOffset(-1);
    }
    moveSelectionDown() {
        this._moveStaffOffset(1);
    }

    containsArtifact() {
        return this.selections.length > 0;
    }

    _replaceSelection(nselector) {
        var artifact = SmoSelection.noteSelection(this.score, nselector.staff, nselector.measure, nselector.voice, nselector.tick);
        this.score.setActiveStaff(nselector.staff);
        var mapped = this.objects.find((el) => {
                return SmoSelector.sameNote(el.selector, artifact.selector);
            });
        console.log('adding selection ' + mapped.note.id);

        this.selections = [mapped];
        this.highlightSelection();
    }

    getFirstMeasureOfSelection() {
        if (this.selections.length) {
            return this.selections[0].measure;
        }
        return null;
    }
    // ## measureIterator
    // Description: iterate over the any measures that are part of the selection
    iterateMeasures(callback) {
        var set = [];
        this.selections.forEach((sel) => {
            var measure = SmoSelection.measureSelection(this.score, sel.selector.staff, sel.selector.measure).measure;
            var ix = measure.measureNumber.measureIndex;
            if (set.indexOf(ix) === -1) {
                set.push(ix);
                callback(measure);
            }
        });
    }
    selectSuggestion() {
        if (!this.suggestion['measure']) {
            return;
        }
        console.log('adding selection ' + this.suggestion.note.id);

        this.selections = [this.suggestion];
        this.score.setActiveStaff(this.selections[0].selector.staff);
        if (this.selections.length == 0)
            return;
        var first = this.selections[0];
        for (var i = 0; i < this.selections.length; ++i) {
            var selection = this.selections[i];
            this.highlightSelection();
        }
    }

    static get strokes() {
        return {
            'suggestion': {
                'stroke': '#fc9',
                'stroke-width': 2,
                'stroke-dasharray': '4,1',
                'fill': 'none'
            },
            'selection': {
                'stroke': '#99d',
                'stroke-width': 2,
                'fill': 'none'
            },
            'staffModifier': {
                'stroke': '#9f9',
                'stroke-width': 2,
                'fill': 'none'
            }
        }
    }

    _findIntersectionArtifact(clientBox) {
        var obj = null;
		var box = clientBox; //svgHelpers.untransformSvgPoint(this.context.svg,clientBox);

        // box.y = box.y - this.renderElement.offsetTop;
        // box.x = box.x - this.renderElement.offsetLeft;

        $(this.objects).each(function (ix, object) {
            var i1 = box.x - object.box.x;
			/* console.log('client coords: ' + svgHelpers.stringify(clientBox));
    		console.log('find box '+svgHelpers.stringify(box));
			console.log('examine obj: '+svgHelpers.stringify(object.box));  */
            var i2 = box.y - object.box.y;
            if (i1 > 0 && i1 < object.box.width && i2 > 0 && i2 < object.box.height) {
                obj = object;
                return false;
            }
        });
        return obj;
    }

    _setArtifactAsSuggestion(bb, artifact) {
        if (this['suggestFadeTimer']) {
            clearTimeout(this.suggestFadeTimer);
        }
        var self = this;

        var sameSel =
            this.selections.find((ss) => SmoSelector.sameNote(ss.selector, artifact.selector));

        if (sameSel) {
            return artifact;
        }

        this.suggestion = artifact;
        this._drawRect(artifact.box, 'suggestion');

        // Make selection fade if there is a selection.
        this.suggestFadeTimer = setTimeout(function () {
                if (self.containsArtifact()) {
                    self.eraseRect('suggestion');
                }
            }, 1000);
    }

    intersectingArtifact(bb) {
        var artifact = this._findIntersectionArtifact(bb);
        if (artifact) {
            this._setArtifactAsSuggestion(bb, artifact);
        }
        return artifact;
    }

    eraseRect(stroke) {
        $(this.renderElement).find('g.vf-' + stroke).remove();
    }

    highlightSelection() {
        if (this.selections.length === 1) {
            this._drawRect(this.selections[0].box, 'selection');
            return;
        }
        var sorted = this.selections.sort((a, b) => a.box.y - b.box.y);
        var prevSel = sorted[0];
        var curBox = svgHelpers.smoBox(prevSel.box);
        var boxes = [];
        for (var i = 1; i < sorted.length; ++i) {
            var sel = sorted[i];
            var ydiff = Math.abs(prevSel.box.y - sel.box.y);
            if (sel.selector.staff === prevSel.selector.staff && ydiff < 1.0) {
                curBox = svgHelpers.unionRect(curBox, sel.box);
            } else {
                boxes.push(curBox);
                curBox = sel.box;
            }
            prevSel = sel;
        }
        boxes.push(curBox);
        this._drawRect(boxes, 'selection');

        this._updateStaffModifiers();
    }
    _outerSelection() {
        if (this.selections.length == 0)
            return null;
        var rv = this.selections[0].box;
        for (var i = 1; i < this.selections.length; ++i) {
            rv = suiTracker.unionRect(rv, this.selections[i].box);
        }
        return rv;
    }
    _drawRect(bb, stroke) {
        this.eraseRect(stroke);
        var grp = this.context.openGroup(stroke, stroke + '-');
        if (!Array.isArray(bb)) {
            bb = [bb];
        }
        bb.forEach((box) => {
            var strokes = suiTracker.strokes[stroke];
            var strokeObj = {};
            $(Object.keys(strokes)).each(function (ix, key) {
                strokeObj[key] = strokes[key];
            });
			box=svgHelpers.clientToLogical(this.context.svg,box);
            this.context.rect(box.x - 3, box.y - 3, box.width + 3, box.height + 3, strokeObj);
        });
        this.context.closeGroup(grp);
    }
}
;
// ## smrfSimpleLayout
// ## Description:
// A layout maps the measures and notes to a spot on the page.  It
// manages the flow of music as an ordinary score.
class suiSimpleLayout {
    constructor(params) {
        Vex.Merge(this, suiSimpleLayout.defaults);
        Vex.Merge(this, params);

        if (this.score) {
            this.svgScale = this.score.svgScale * this.score.zoomScale;
            this.pageWidth = Math.round(this.score.pageWidth * this.score.zoomScale);
            this.pageHeight = Math.round(this.score.pageHeight * this.score.zoomScale);
            $(this.elementId).css('width', '' + this.pageWidth + 'px');
            $(this.elementId).css('height', '' + this.pageHeight + 'px');
        }
        $(this.elementId).html('');
        this.renderer = new VF.Renderer(this.elementId, VF.Renderer.Backends.SVG);
        // this.renderer.resize(this.pageWidth, this.pageHeight);
        var offset = (window.innerWidth - $(this.elementId).width()) / 2;
        if (offset > 0) {
            $(this.elementId).css('left', '' + offset + 'px');
        }
        var xtranslation = Math.round(((1.0 - this.svgScale) * this.pageWidth) / 2);
        var ytranslation = Math.round(((1.0 - this.svgScale) * this.pageHeight) / 2);
        $(this.elementId).find('svg').css('transform', 'scale(' + this.svgScale + ',' +
            this.svgScale + ') translate(-' + xtranslation + 'px,-' + ytranslation + 'px)');
        this.context.setFont(this.font.typeface, this.font.pointSize, "").setBackgroundFillStyle(this.font.fillStyle);
        this.attrs = {
            id: VF.Element.newID(),
            type: 'testLayout'
        };
    }
    static createScoreLayout(renderElement, score, layoutParams) {
        var ctorObj = {
            elementId: renderElement,
            score: score
        };
        if (layoutParams) {
            Vex.Merge(ctorObj, layoutParams);
        }
        var layout = new suiSimpleLayout(ctorObj);
        return layout;
    }
    static get defaults() {
        return {
            clefWidth: 70,
            staffWidth: 250,
            totalWidth: 250,
            leftMargin: 15,
            topMargin: 15,
            pageWidth: 8 * 96 + 48,
            pageHeight: 11 * 96,
            svgScale: 0.7,
            font: {
                typeface: "Arial",
                pointSize: 10,
                fillStyle: '#eed'
            }
        };
    }
    get context() {
        return this.renderer.getContext();
    }
    get renderElement() {
        return this.renderer.elementId;
    }
    render() {
        this.layout(false);
        // layout a second time to adjust for issues.
        this.layout(true);
    }
    unrender() {}

    get pageMarginWidth() {
        return this.pageWidth - this.leftMargin * 2;
    }
    _previousAttr(i, j, attr) {
        var staff = this.score.staves[j];
        var measure = staff.measures[i];
        return (i > 0 ? staff.measures[i - 1][attr] : measure[attr]);
    }

    _renderModifiers(staff, system) {
        staff.modifiers.forEach((modifier) => {
            var startNote = SmoSelection.noteSelection(this.score,
                    modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
            var endNote = SmoSelection.noteSelection(this.score,
                    modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);

            var vxStart = system.getVxNote(startNote.note);
            var vxEnd = system.getVxNote(endNote.note);

            // If the modifier goes to the next staff, draw what part of it we can on this staff.
            if (vxStart && !vxEnd) {
                var nextNote = SmoSelection.nextNoteSelection(this.score,
                        modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
                var testNote = system.getVxNote(nextNote.note);
                while (testNote) {
                    vxEnd = testNote;
                    nextNote = SmoSelection.nextNoteSelection(this.score,
                            nextNote.selector.staff, nextNote.selector.measure, nextNote.selector.voice, nextNote.selector.tick);
                    testNote = system.getVxNote(nextNote.note);

                }
            }
            if (vxEnd && !vxStart) {
                var lastNote = SmoSelection.lastNoteSelection(this.score,
                        modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
                var testNote = system.getVxNote(lastNote.note);
                while (testNote) {
                    vxStart = testNote;
                    lastNote = SmoSelection.lastNoteSelection(this.score,
                            lastNote.selector.staff, lastNote.selector.measure, lastNote.selector.voice, lastNote.selector.tick);
                    testNote = system.getVxNote(lastNote.note);
                }
            }

            if (!vxStart || !vxEnd)
                return;

            // TODO: notes may have changed, get closest if these exact endpoints don't exist
            modifier.renderedBox = system.renderModifier(modifier, vxStart, vxEnd);

            // TODO: consider staff height with these.
            // TODO: handle dynamics split across systems.
        });
    }

    // ## layout
    // ## Render the music, keeping track of the bounding boxes of all the
    // elements.  Re-render a second time to adjust measure widths to prevent notes
    // from overlapping.  Then render all the modifiers.
    layout(drawAll) {
        var svg = this.context.svg;

        // bounding box of all artifacts on the page
        var pageBox = {};
        // bounding box of all artifacts in a system
        var systemBoxes = {};
        var staffBoxes = {};
        if (!this.score.staves.length) {
            return;
        }
        var topStaff = this.score.staves[0];
        if (!topStaff.measures.length) {
            return;
        }
        var lineIndex = 0;
        var system = new VxSystem(this.context, topStaff.measures[0].staffY, lineIndex);
        var systemIndex = 0;

        for (var i = 0; i < topStaff.measures.length; ++i) {
            var staffWidth = 0;
            for (var j = 0; j < this.score.staves.length; ++j) {
                var staff = this.score.staves[j];
                var measure = staff.measures[i];
                measure.measureNumber.systemIndex = j;

                var logicalStaffBox = svgHelpers.pointBox(this.score.staffX, this.score.staffY);
                var clientStaffBox = svgHelpers.logicalToClient(svg, logicalStaffBox);

                // If we are starting a new staff on the same system, offset y so it is below the first staff.
                if (!staffBoxes[j]) {
                    if (j == 0) {
                        staffBoxes[j] = svgHelpers.copyBox(clientStaffBox);
                    } else {
                        staffBoxes[j] = svgHelpers.pointBox(staffBoxes[j - 1].x, staffBoxes[j - 1].y + staffBoxes[j - 1].height);
                    }
                }

                logicalStaffBox = svgHelpers.clientToLogical(svg, staffBoxes[j]);
                if (j > 0) {
                    measure.staffY = logicalStaffBox.y;
                }

                measure.staffX = logicalStaffBox.x + logicalStaffBox.width;

                if (!systemBoxes[lineIndex]) {
                    systemBoxes[lineIndex] = svgHelpers.copyBox(clientStaffBox);
                }

                if (!pageBox['width']) {
                    pageBox = svgHelpers.copyBox(clientStaffBox);
                }
                var keySigLast = this._previousAttr(i, j, 'keySignature');
                var timeSigLast = this._previousAttr(i, j, 'timeSignature');
                var clefLast = this._previousAttr(i, j, 'clef');

                if (j == 0 && logicalStaffBox.x + logicalStaffBox.width + measure.staffWidth
                     > this.pageMarginWidth / this.svgScale) {
                    if (drawAll) {
                        system.cap();
                    }
                    this.score.staves.forEach((stf) => {
                        this._renderModifiers(stf, system);
                    });
                    var logicalPageBox = svgHelpers.clientToLogical(svg, pageBox);
                    measure.staffX = this.score.staffX + 1;
                    measure.staffY = logicalPageBox.y + logicalPageBox.height + this.score.interGap;
                    staffBoxes = {};
                    staffBoxes[j] = svgHelpers.logicalToClient(svg,
                            svgHelpers.pointBox(this.score.staffX, staff.staffY));
                    lineIndex += 1;
                    system = new VxSystem(this.context, staff.staffY, lineIndex);
                    systemIndex = 0;
                    systemBoxes[lineIndex] = svgHelpers.logicalToClient(svg,
                            svgHelpers.pointBox(measure.staffX, staff.staffY));
                }

                measure.forceClef = (systemIndex === 0 || measure.clef !== clefLast);
                measure.forceTimeSignature = (systemIndex === 0 || measure.timeSignature !== timeSigLast);
                measure.forceKeySignature = (systemIndex === 0 || measure.keySignature !== keySigLast);

                // guess height of staff the first time
                measure.measureNumber.systemIndex = systemIndex;
                // WIP
                if (drawAll || measure.changed) {
                    smoBeamerFactory.applyBeams(measure);
                    system.renderMeasure(j, measure);
                }

                // Keep a running tally of the page, system, and staff dimensions as we draw.
                systemBoxes[lineIndex] = svgHelpers.unionRect(systemBoxes[lineIndex], measure.renderedBox);
                staffBoxes[j] = svgHelpers.unionRect(staffBoxes[j], measure.renderedBox);
                pageBox = svgHelpers.unionRect(pageBox, measure.renderedBox);
            }
            ++systemIndex;
        }
        if (drawAll) {
            system.cap();
        }
        this.score.staves.forEach((stf) => {
            this._renderModifiers(stf, system);
        });
    }
}
;

class suiEditor {
    constructor(params) {
        Vex.Merge(this, params);
        this.changed = false; // set to true if the score has changed.
        this.slashMode = false;
    }

    // ## _render
    // utility function to render the music and update the tracker map.
    _render() {
        this.layout.render();
        this.tracker.updateMap();
    }

    _renderAndAdvance() {
        if (this.changed) {
            this._render();
            this.tracker.moveSelectionRight();
        }
    }

    _selectionOperation(selection, name, parameters) {
        selection.measure.changed = true;
        SmoOperation[name](selection, parameters);
        this._render();
    }

    _singleSelectionOperation(name, parameters) {
        if (this.tracker.selections.length != 1) {
            return;
        }
        var selection = this.tracker.selections[0];
        SmoOperation[name](selection, parameters);
        this.changed = true;
        this._render();
    }

    _transpose(selection, offset) {
        this._selectionOperation(selection, 'transpose', offset);
    }    

    interval(keyEvent) {
        if (this.tracker.selections.length != 1)
            return;
        // code='Digit3'
        var interval = parseInt(keyEvent.code[5]) - 1;
        if (keyEvent.shiftKey) {
            interval = -interval;
        }
        this._singleSelectionOperation('interval', interval);
    }

    transpose(offset) {
        this.tracker.selections.forEach((selected) => this._transpose(selected, offset));
        this._render();
    }
    transposeDown() {
        this.transpose(-1);
    }
    transposeUp() {
        this.transpose(1);
    }
    upOctave() {
        this.transpose(12);
    }
    downOctave() {
        this.transpose(-12);
    }

    _setPitch(selected, letter) {
        this._selectionOperation(selected, 'setPitch', letter);
    }

    setPitch(keyEvent) {
        this.tracker.selections.forEach((selected) => this._setPitch(selected, keyEvent.key.toLowerCase()));
        this._renderAndAdvance();
    }

    dotDuration(keyEvent) {
        this._singleSelectionOperation('dotDuration');
    }

    undotDuration(keyEvent) {
        this._singleSelectionOperation('undotDuration');
    }

    doubleDuration(keyEvent) {
        this._singleSelectionOperation('doubleDuration');
    }

    halveDuration(keyEvent) {
        this._singleSelectionOperation('halveDuration');
    }

    addMeasure(keyEvent) {
        if (this.tracker.selections.length < 1) {
            return;
        }
        var measure = this.tracker.getFirstMeasureOfSelection();
        if (measure) {
            var nmeasure = SmoMeasure.getDefaultMeasureWithNotes(measure);
            this.score.addMeasure(measure.measureNumber.systemIndex, nmeasure);
            this.changed = true;
            this._render();
        }
    }
    makeTuplet(keyEvent) {
        var numNotes = parseInt(keyEvent.key);
        this._singleSelectionOperation('makeTuplet', numNotes);
    }

    unmakeTuplet(keyEvent) {
        this._singleSelectionOperation('unmakeTuplet');
    }
}
;
class suiMenuBase {
    constructor(params) {
        Vex.Merge(this, params);
    }

    complete() {
        $('body').trigger('menuDismiss');
    }
}

class suiMenuManager {
    constructor(params) {
        Vex.Merge(this, suiMenuManager.defaults);
        Vex.Merge(this, params);
        this.bound = false;
    }

    static get defaults() {
        return {
            menuBind: suiMenuManager.menuKeyBindingDefaults,
            menuContainer: '.menuContainer'
        };
    }

    // ### Description:
    // slash ('/') menu key bindings.  The slash key followed by another key brings up
    // a menu.
    static get menuKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "k",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "suiKeySignatureMenu"
            }, {
                event: "keydown",
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "suiStaffModifierMenu"
            }
        ];
    }

    unattach() {
        window.removeEventListener("keydown", this.keydownHandler, true);
        $('body').removeClass('modal');
        $(this.menuContainer).html('');
        $('body').off('dismissMenu');
        this.bound = false;
    }

    attach(el) {
        var b = htmlHelpers.buildDom();

        $(this.menuContainer).html('');
        $(this.menuContainer).attr('z-index', '12');
        var b = htmlHelpers.buildDom;
        var r = b('ul').classes('menuElement').attr('size', this.menu.menuItems.length)
            .css('left', '' + this.menuPosition.x + 'px')
            .css('top', '' + this.menuPosition.y + 'px')
            .css('height', '' + this.menu.menuItems.length * 35 + 'px');
        this.menu.menuItems.forEach((item) => {
            r.append(
                b('li').classes('menuOption').append(
                    b('button')
                    .text(item.text).attr('data-value', item.value)
                    .append(
                        b('span').classes('icon icon-' + item.icon))));
        });
        $(this.menuContainer).append(r.dom());
        $('body').addClass('modal');
        this.bindEvents();
    }
    slashMenuMode() {
        var self = this;
        this.bindEvents();
        this.closeMenuPromise = new Promise((resolve, reject) => {
                $('body').off('menuDismiss').on('menuDismiss', function () {
                    self.unattach();
                    resolve();
                });

            });
        return this.closeMenuPromise;
    }

    handleKeydown(event) {
        console.log("KeyboardEvent: key='" + event.key + "' | code='" +
            event.code + "'"
             + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        if (['Tab', 'Enter'].indexOf(event.code) >= 0) {
            return;
        }

        event.preventDefault();

        if (event.code === 'Escape') {
            $('body').trigger('menuDismiss');
        }
        if (this.menu) {
            this.menu.keydown(event);
        }
        if (this.tracker.selections.length == 0) {
            this.toggleMenuMode();
            return;
        }
        this.menuPosition = this.tracker.selections[0].box;
        var binding = this.menuBind.find((ev) => {
                return ev.key === event.key
            });
        if (!binding) {
            return;
        }
        var ctor = eval(binding.action);
        this.menu = new ctor({
                position: this.menuPosition,
                tracker: this.tracker,
                editor: this.editor,
                score: this.score
            });
        this.attach(this.menuContainer);
    }

    bindEvents() {
        var self = this;

        if (!this.bound) {
            this.keydownHandler = this.handleKeydown.bind(this);

            window.addEventListener("keydown", this.keydownHandler, true);
            this.bound = true;
        }
        $(this.menuContainer).find('button').off('click').on('click', function (ev) {
            self.menu.selection(ev);
        });
    }
}

class suiKeySignatureMenu extends suiMenuBase {

    constructor(params) {
        params = (params ? params : {});
        Vex.Merge(params, suiKeySignatureMenu.defaults);
        super(params);
    }
    static get defaults() {
        return {
            menuItems: [{
                    icon: 'key-sig-c',
                    text: 'C Major',
                    value: 'C'
                }, {
                    icon: 'key-sig-f',
                    text: 'F Major',
                    value: 'F'
                }, {
                    icon: 'key-sig-g',
                    text: 'G Major',
                    value: 'G'
                }, {
                    icon: 'key-sig-bb',
                    text: 'Bb Major',
                    value: 'Bb'
                }, {
                    icon: 'key-sig-d',
                    text: 'D Major',
                    value: 'D'
                }, {
                    icon: 'key-sig-eb',
                    text: 'Eb Major',
                    value: 'Eb'
                }, {
                    icon: 'key-sig-a',
                    text: 'A Major',
                    value: 'A'
                }, {
                    icon: 'key-sig-ab',
                    text: 'Ab Major',
                    value: 'Ab'
                }, {
                    icon: 'key-sig-e',
                    text: 'E Major',
                    value: 'E'
                }, {
                    icon: 'key-sig-bd',
                    text: 'Db Major',
                    value: 'Db'
                }, {
                    icon: 'key-sig-b',
                    text: 'B Major',
                    value: 'B'
                }, {
                    icon: 'key-sig-fs',
                    text: 'F# Major',
                    value: 'F#'
                }, {
                    icon: 'key-sig-cs',
                    text: 'C# Major',
                    value: 'C#'
                }
            ],
            menuContainer: '.menuContainer'
        };
    }
    selection(ev) {
        var keySig = $(ev.currentTarget).attr('data-value');
        var self = this;
        this.tracker.iterateMeasures((measure) => {
            this.score.addKeySignature(measure.measureNumber.measureIndex, keySig);
        });
        this.complete();
    }
    keydown(ev) {}

}

class suiStaffModifierMenu extends suiMenuBase {

    constructor(params) {
        params = (params ? params : {});
        Vex.Merge(params, suiStaffModifierMenu.defaults);
        super(params);
    }
    static get defaults() {
        return {
            menuItems: [{
                    icon: 'cresc',
                    text: 'Crescendo',
                    value: 'crescendo'
                }, {
                    icon: 'decresc',
                    text: 'Decrescendo',
                    value: 'decrescendo'
                }
            ],
            menuContainer: '.menuContainer'
        };
    }
    selection(ev) {
        var op = $(ev.currentTarget).attr('data-value');

        var self = this;
        var ft = this.tracker.getExtremeSelection(-1);
        var tt = this.tracker.getExtremeSelection(1);
        if (SmoSelector.sameNote(ft.selector, tt.selector)) {
            this.complete();
            return;
        }

        SmoOperation[op](ft, tt);
        this.complete();
    }
    keydown(ev) {}
}
;
// ## utController
// a simple controller object to render the unit test cases.
class utController {

	constructor(params) {

		Vex.Merge(this, utController.defaults);
		Vex.Merge(this, params);
		this.bindEvents();
	}

	static createUi(renderElement, score) {
		var params = {};
		params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
		// params.tracker = new suiTracker(params.layout);
		params.score = score;
		// params.editor = new suiEditor(params);
		// params.menus = new suiMenuManager(params);
		var keys = new utController(params);
		return keys;
	}

	get renderElement() {
		return this.layout.renderElement;
	}
	

	static get defaults() {
		return {			
		};
	}

	detach() {
		this.layout = null;		
	}

	render() {
		this.layout.render();
	}	
	
	bindEvents() {

	}

}
;
class SuiAttributeDialog {
    static rockerControl(id, parameterName,label) {
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('rockerControl').attr('id', id).attr('data-param',parameterName)
		.append(
                b('button').classes('increment').append(
                    b('span').classes('icon icon-circle-up'))).append(
                b('button').classes('decrement').append(
                    b('span').classes('icon icon-circle-down'))).append(
                b('input').attr('type', 'text').classes('rockerInput')
                .attr('id', id + '-input')).append(
                b('label').attr('for', id + '-input').text(label));
        return r;
    }

    static constructDialog(dialogElements, parameters) {
        var id = parameters.id;
        var b = htmlHelpers.buildDom;
        var r = b('div').classes('attributeModal').css('top', parameters.top + 'px').css('left', parameters.left + 'px')
		    .append(b('h2').text(parameters.label));
        dialogElements.forEach((de) => {
            r.append(SuiAttributeDialog[de.control](id + '-'+ de.parameterName, de.parameterName,de.label));
        });
        r.append(
            b('div').classes('buttonContainer').append(
                b('button').classes('ok-button').text('Ok')).append(
                b('button').classes('cancel-button').text('Cancel')).append(
                b('button').classes('remove-button').text('Remove').append(
                    b('span').classes('icon icon-cancel-circle'))));
        $('.attributeDialog').html('');

        $('.attributeDialog').append(r.dom());
		
		var trapper = htmlHelpers.inputTrapper('.attributeDialog');
		$('.attributeDialog').find('.cancel-button').focus();
        return {element:$('.attributeDialog'),trapper:trapper};
    }
	
	static get modifierDialogMap() {
		return {SmoStaffHairpin:'SuiHairpinAttributesDialog'};
	}
}

class SuiHairpinAttributesDialog {
    static get dialogElements() {
        return [{
                parameterName: 'height',
				smoName:'height',
                defaultValue: 10,
                control: 'rockerControl',
                label: 'Height'
            }, {
				smoName:'yOffset',
                parameterName: 'y_shift',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Y Shift'
            }, {
				smoName:'xOffsetRight',
                parameterName: 'right_shift_px',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Right Shift'
            }, {
				smoName:'xOffsetLeft',
                parameterName: 'left_shift_px',
                defaultValue: 0,
                control: 'rockerControl',
                label: 'Left Shift'
            }
        ];
    }
    static createAndDisplay(parameters) {
        var dg = new SuiHairpinAttributesDialog(parameters);
        dg.display();
        return dg;
    }
    constructor(parameters) {
        Vex.Merge(this, parameters);
        if (!this.staffModifier || !this.selection) {
            throw new Error('modifier attribute dialog must have modifier and staff');
        }
        this.closeDialogPromise = new Promise((resolve, reject) => {
                $('body').off('dialogDismiss').on('dialogDismiss', function () {
                    resolve();
                });

            });
    }

    handleRemove() {
		$(this.context.svg).find('g.' + this.staffModifier.id).remove();
		this.selection.staff.removeStaffModifier(this.staffModifier);
		this.tracker.clearModifierSelections();
	}
	complete() {
            // todo: set values
            $('body').removeClass('showAttributeDialog');
			$('body').trigger('dialogDismiss');
			this.dialog.trapper.close();
	}
    _bindElements(dialog) {
		var self=this;
        $(dialog.element).find('.ok-button').off('click').on('click', function (ev) {
			self.complete();
        });

        $(dialog.element).find('.cancel-button').off('click').on('click', function (ev) {
			self.complete();
        });
        $(dialog.element).find('.remove-button').off('click').on('click', function (ev) {
            self.handleRemove();
			self.complete();
        });
    }

    display() {
		var dialogElements = SuiHairpinAttributesDialog.dialogElements;
        this.dialog = SuiAttributeDialog.constructDialog(dialogElements, {
                id: 'dialog-' + this.staffModifier.id,
                top: this.staffModifier.renderedBox.y,
                left: this.staffModifier.renderedBox.x,
				label:'Hairpin Properties'
            });
		
        $('body').addClass('showAttributeDialog');
		dialogElements.forEach((de) => {
			$(this.dialog.element).find('.rockerControl[data-param="'+de.parameterName+'"] input[type="text"]').val(this.staffModifier[de.smoName]);
		});
        this._bindElements(this.dialog);
    }
}
;

// ## suiController
// ### Description:
// Manages DOM events and binds keyboard and mouse events
// to editor and menu commands, tracker and layout manager.
class suiController {

    constructor(params) {

        Vex.Merge(this, suiController.defaults);
        Vex.Merge(this, params);
        this.bindEvents();
    }

    // ## createUi
    // ### Description:
    // Convenience constructor, taking a renderElement and a score.
    static createUi(renderElement, score) {
        var params = suiController.keyBindingDefaults;
        params.layout = suiSimpleLayout.createScoreLayout(renderElement, score);
        params.tracker = new suiTracker(params.layout);
        params.score = score;
        params.editor = new suiEditor(params);
        params.menus = new suiMenuManager(params);
        var controller = new suiController(params);
        return controller;
    }

    // ### renderElement
    // return render element that is the DOM parent of the svg
    get renderElement() {
        return this.layout.renderElement;
    }

    // ## keyBindingDefaults
    // ### Description:
    // Different applications can create their own key bindings, these are the defaults.
    // Many editor commands can be reached by a single keystroke.  For more advanced things there
    // are menus.
    static get keyBindingDefaults() {
        var editorKeys = suiController.editorKeyBindingDefaults;
        editorKeys.forEach((key) => {
            key.module = 'editor'
        });
        var trackerKeys = suiController.trackerKeyBindingDefaults;
        trackerKeys.forEach((key) => {
            key.module = 'tracker'
        });
        return trackerKeys.concat(editorKeys);
    }

    // ## editorKeyBindingDefaults
    // ## Description:
    // execute a simple command on the editor, based on a keystroke.
    static get editorKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "=",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeUp"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "transposeDown"
            }, {
                event: "keydown",
                key: "=",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "upOctave"
            }, {
                event: "keydown",
                key: "-",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "downOctave"
            }, {
                event: "keydown",
                key: ".",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "doubleDuration"
            }, {
                event: "keydown",
                key: ",",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "halveDuration"
            }, {
                event: "keydown",
                key: ">",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "dotDuration"
            }, {
                event: "keydown",
                key: "m",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "showModifierDialog"
            }, {
                event: "keydown",
                key: "<",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "undotDuration"
            }, {
                event: "keydown",
                key: "a",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "b",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "c",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "d",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "e",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "f",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "g",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "setPitch"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "makeTuplet"
            },
            // interval commands
            {
                event: "keydown",
                key: "2",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "3",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "4",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "5",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "6",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "7",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "interval"
            }, {
                event: "keydown",
                key: "@",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "#",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "%",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "^",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "&",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "*",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "8",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "interval"
            }, {
                event: "keydown",
                key: "0",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "unmakeTuplet"
            }, {
                event: "keydown",
                key: "i",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "addMeasure"
            }
        ];
    }

    // ## trackerKeyBindingDefaults
    // ### Description:
    // Key bindings for the tracker.  The tracker is the 'cursor' in the music
    // that lets you select and edit notes.
    static get trackerKeyBindingDefaults() {
        return [{
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: true,
                shiftKey: false,
                action: "advanceModifierSelection"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionRight"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: false,
                altKey: false,
                shiftKey: true,
                action: "growSelectionLeft"
            }, {
                event: "keydown",
                key: "ArrowUp",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionUp"
            }, {
                event: "keydown",
                key: "ArrowDown",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionDown"
            }, {
                event: "keydown",
                key: "ArrowRight",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionRightMeasure"
            }, {
                event: "keydown",
                key: "ArrowLeft",
                ctrlKey: true,
                altKey: false,
                shiftKey: false,
                action: "moveSelectionLeftMeasure"
            }

        ]
    }

    static get defaults() {
        return {
            keyBind: suiController.keyBindingDefaults
        };
    }

    showModifierDialog(modSelection) {
        var dbType = SuiAttributeDialog.modifierDialogMap[modSelection.modifier.type];
        var ctor = eval(dbType);
        return ctor.createAndDisplay({
            staffModifier: modSelection.modifier,
            selection: modSelection.selection,
            context: this.tracker.context,
            tracker: this.tracker
        });
    }

    handleKeydown(evdata) {
		 var self = this;
            var rebind = function () {
                self.render();
                self.bindEvents();
            }
        console.log("KeyboardEvent: key='" + event.key + "' | code='" +
            event.code + "'"
             + " shift='" + event.shiftKey + "' control='" + event.ctrlKey + "'" + " alt='" + event.altKey + "'");
        event.preventDefault();

        if (evdata.key == '/') {
            window.removeEventListener("keydown", this.keydownHandler, true);
            this.menuPromise = this.menus.slashMenuMode().then(rebind);
        }

        // TODO:  work dialogs into the scheme of things
        if (evdata.key == 'm') {
            var modSelection = this.tracker.getSelectedModifier();
            if (modSelection) {
                window.removeEventListener("keydown", this.keydownHandler, true);
                var dialog = this.showModifierDialog(modSelection);
                dialog.closeDialogPromise.then(rebind);
            }
            return;
        }
        var binding = this.keyBind.find((ev) =>
                ev.event === 'keydown' && ev.key === evdata.key && ev.ctrlKey === evdata.ctrlKey &&
                ev.altKey === evdata.altKey && evdata.shiftKey === ev.shiftKey);

        if (binding) {
            this[binding.module][binding.action](evdata);
        }
    }

    detach() {
        window.removeEventListener("keydown", this.keydownHandler, true);
        this.layout = null;
        this.tracker = null;
        this.editor = null;
    }

    render() {
        this.layout.render();
        this.tracker.updateMap();
    }

    bindEvents() {
        var self = this;
        var tracker = this.tracker;
        $(this.renderElement).off('mousemove').on('mousemove', function (ev) {
            tracker.intersectingArtifact({
                x: ev.clientX,
                y: ev.clientY
            });
        });

        $(this.renderElement).off('click').on('click', function (ev) {
            tracker.selectSuggestion();
        });

        this.keydownHandler = this.handleKeydown.bind(this);

        window.addEventListener("keydown", this.keydownHandler, true);
    }

}
