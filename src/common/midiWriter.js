// Credit for Midi functionality goes to:
// https://github.com/grimmdude/MidiWriterJS
import { SmoMusic } from '../smo/data/music';
export var _MidiWriter = function() {
/**
 * MIDI file format constants.
 * @return {Constants}
 */
var Constants = {
  VERSION: 1,
  HEADER_CHUNK_TYPE: [0x4d, 0x54, 0x68, 0x64],
  // Mthd
  HEADER_CHUNK_LENGTH: [0x00, 0x00, 0x00, 0x06],
  // Header size for SMF
  HEADER_CHUNK_FORMAT0: [0x00, 0x00],
  // Midi Type 0 id
  HEADER_CHUNK_FORMAT1: [0x00, 0x01],
  // Midi Type 1 id
  HEADER_CHUNK_DIVISION: [0x00, 0x80],
  // Defaults to 128 ticks per beat
  TRACK_CHUNK_TYPE: [0x4d, 0x54, 0x72, 0x6b],
  // MTrk,
  META_EVENT_ID: 0xFF,
  META_TEXT_ID: 0x01,
  META_COPYRIGHT_ID: 0x02,
  META_TRACK_NAME_ID: 0x03,
  META_INSTRUMENT_NAME_ID: 0x04,
  META_LYRIC_ID: 0x05,
  META_MARKER_ID: 0x06,
  META_CUE_POINT: 0x07,
  META_TEMPO_ID: 0x51,
  META_SMTPE_OFFSET: 0x54,
  META_TIME_SIGNATURE_ID: 0x58,
  META_KEY_SIGNATURE_ID: 0x59,
  META_END_OF_TRACK_ID: [0x2F, 0x00],
  CONTROLLER_CHANGE_STATUS: 0xB0,
  // includes channel number (0)
  PROGRAM_CHANGE_STATUS: 0xC0,
  // includes channel number (0)
  PITCH_BEND_STATUS: 0xE0 // includes channel number (0)
};

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

function _wrapRegExp(re, groups) {
  _wrapRegExp = function (re, groups) {
    return new BabelRegExp(re, undefined, groups);
  };

  var _RegExp = _wrapNativeSuper(RegExp);

  var _super = RegExp.prototype;

  var _groups = new WeakMap();

  function BabelRegExp(re, flags, groups) {
    var _this = _RegExp.call(this, re, flags);

    _groups.set(_this, groups || _groups.get(re));

    return _this;
  }

  _inherits(BabelRegExp, _RegExp);

  BabelRegExp.prototype.exec = function (str) {
    var result = _super.exec.call(this, str);

    if (result) result.groups = buildGroups(result, this);
    return result;
  };

  BabelRegExp.prototype[Symbol.replace] = function (str, substitution) {
    if (typeof substitution === "string") {
      var groups = _groups.get(this);

      return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) {
        return "$" + groups[name];
      }));
    } else if (typeof substitution === "function") {
      var _this = this;

      return _super[Symbol.replace].call(this, str, function () {
        var args = [];
        args.push.apply(args, arguments);

        if (typeof args[args.length - 1] !== "object") {
          args.push(buildGroups(args, _this));
        }

        return substitution.apply(this, args);
      });
    } else {
      return _super[Symbol.replace].call(this, str, substitution);
    }
  };

  function buildGroups(result, re) {
    var g = _groups.get(re);

    return Object.keys(g).reduce(function (groups, name) {
      groups[name] = result[g[name]];
      return groups;
    }, Object.create(null));
  }

  return _wrapRegExp.apply(this, arguments);
}

/**
 * Static utility functions used throughout the library.
 */

var Utils = /*#__PURE__*/function () {
  function Utils() {
    _classCallCheck(this, Utils);
  }

  _createClass(Utils, null, [{
    key: "version",
    value:
    /**
     * Gets MidiWriterJS version number.
     * @return {string}
     */
    function version() {
      return Constants.VERSION;
    }
    /**
     * Convert a string to an array of bytes
     * @param {string} string
     * @return {array}
     */

  }, {
    key: "stringToBytes",
    value: function stringToBytes(string) {
      return string.split('').map(function (_char) {
        return _char.charCodeAt();
      });
    }
    /**
     * Checks if argument is a valid number.
     * @param {*} n - Value to check
     * @return {boolean}
     */

  }, {
    key: "isNumeric",
    value: function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    /**
     * Returns the correct MIDI number for the specified pitch.
     * Uses Tonal Midi - https://github.com/danigb/tonal/tree/master/packages/midi
     * @param {(string|number)} pitch - 'C#4' or midi note code
     * @return {number}
     */

  }, {
    key: "getPitch",
    value: function getPitch(pitch) {
      return SmoMusic.midiPitchToMidiNumber(pitch);
    }
    /**
     * Translates number of ticks to MIDI timestamp format, returning an array of
     * hex strings with the time values. Midi has a very particular time to express time,
     * take a good look at the spec before ever touching this function.
     * Thanks to https://github.com/sergi/jsmidi
     *
     * @param {number} ticks - Number of ticks to be translated
     * @return {array} - Bytes that form the MIDI time value
     */

  }, {
    key: "numberToVariableLength",
    value: function numberToVariableLength(ticks) {
      ticks = Math.round(ticks);
      var buffer = ticks & 0x7F;

      while (ticks = ticks >> 7) {
        buffer <<= 8;
        buffer |= ticks & 0x7F | 0x80;
      }

      var bList = [];

      while (true) {
        bList.push(buffer & 0xff);
        if (buffer & 0x80) buffer >>= 8;else {
          break;
        }
      }

      return bList;
    }
    /**
     * Counts number of bytes in string
     * @param {string} s
     * @return {array}
     */

  }, {
    key: "stringByteCount",
    value: function stringByteCount(s) {
      return encodeURI(s).split(/%..|./).length - 1;
    }
    /**
     * Get an int from an array of bytes.
     * @param {array} bytes
     * @return {number}
     */

  }, {
    key: "numberFromBytes",
    value: function numberFromBytes(bytes) {
      var hex = '';
      var stringResult;
      bytes.forEach(function (_byte) {
        stringResult = _byte.toString(16); // ensure string is 2 chars

        if (stringResult.length == 1) stringResult = "0" + stringResult;
        hex += stringResult;
      });
      return parseInt(hex, 16);
    }
    /**
     * Takes a number and splits it up into an array of bytes.  Can be padded by passing a number to bytesNeeded
     * @param {number} number
     * @param {number} bytesNeeded
     * @return {array} - Array of bytes
     */

  }, {
    key: "numberToBytes",
    value: function numberToBytes(number, bytesNeeded) {
      bytesNeeded = bytesNeeded || 1;
      var hexString = number.toString(16);

      if (hexString.length & 1) {
        // Make sure hex string is even number of chars
        hexString = '0' + hexString;
      } // Split hex string into an array of two char elements


      var hexArray = hexString.match(/.{2}/g); // Now parse them out as integers

      hexArray = hexArray.map(function (item) {
        return parseInt(item, 16);
      }); // Prepend empty bytes if we don't have enough

      if (hexArray.length < bytesNeeded) {
        while (bytesNeeded - hexArray.length > 0) {
          hexArray.unshift(0);
        }
      }

      return hexArray;
    }
    /**
     * Converts value to array if needed.
     * @param {string} value
     * @return {array}
     */

  }, {
    key: "toArray",
    value: function toArray(value) {
      if (Array.isArray(value)) return value;
      return [value];
    }
    /**
     * Converts velocity to value 0-127
     * @param {number} velocity - Velocity value 1-100
     * @return {number}
     */

  }, {
    key: "convertVelocity",
    value: function convertVelocity(velocity) {
      // Max passed value limited to 100
      velocity = velocity > 100 ? 100 : velocity;
      return Math.round(velocity / 100 * 127);
    }
    /**
     * Gets the total number of ticks of a specified duration.
     * Note: type=='note' defaults to quarter note, type==='rest' defaults to 0
     * @param {(string|array)} duration
     * @return {number}
     */

  }, {
    key: "getTickDuration",
    value: function getTickDuration(duration) {
      if (Array.isArray(duration)) {
        // Recursively execute this method for each item in the array and return the sum of tick durations.
        return duration.map(function (value) {
          return Utils.getTickDuration(value);
        }).reduce(function (a, b) {
          return a + b;
        }, 0);
      }

      duration = duration.toString();

      if (duration.toLowerCase().charAt(0) === 't') {
        // If duration starts with 't' then the number that follows is an explicit tick count
        return parseInt(duration.substring(1));
      } // Need to apply duration here.  Quarter note == Constants.HEADER_CHUNK_DIVISION


      var quarterTicks = Utils.numberFromBytes(Constants.HEADER_CHUNK_DIVISION);
      var tickDuration = quarterTicks * Utils.getDurationMultiplier(duration);
      return Utils.getRoundedIfClose(tickDuration);
    }
    /**
     * Due to rounding errors in JavaScript engines,
     * it's safe to round when we're very close to the actual tick number
     *
     * @static
     * @param {number} tick
     * @return {number}
     */

  }, {
    key: "getRoundedIfClose",
    value: function getRoundedIfClose(tick) {
      var roundedTick = Math.round(tick);
      return Math.abs(roundedTick - tick) < 0.000001 ? roundedTick : tick;
    }
    /**
     * Due to low precision of MIDI,
     * we need to keep track of rounding errors in deltas.
     * This function will calculate the rounding error for a given duration.
     *
     * @static
     * @param {number} tick
     * @return {number}
     */

  }, {
    key: "getPrecisionLoss",
    value: function getPrecisionLoss(tick) {
      var roundedTick = Math.round(tick);
      return roundedTick - tick;
    }
    /**
     * Gets what to multiple ticks/quarter note by to get the specified duration.
     * Note: type=='note' defaults to quarter note, type==='rest' defaults to 0
     * @param {string} duration
     * @return {number}
     */

  }, {
    key: "getDurationMultiplier",
    value: function getDurationMultiplier(duration) {
      // Need to apply duration here.
      // Quarter note == Constants.HEADER_CHUNK_DIVISION ticks.
      if (duration === '0') return 0;
      var match = duration.match( /*#__PURE__*/_wrapRegExp(/^(d+)?([0-9]+)(?:t([0-9]*))?/, {
        dotted: 1,
        base: 2,
        tuplet: 3
      }));

      if (match) {
        var base = Number(match.groups.base); // 1 or any power of two:

        var isValidBase = base === 1 || (base & base - 1) === 0;

        if (isValidBase) {
          // how much faster or slower is this note compared to a quarter?
          var ratio = base / 4;
          var durationInQuarters = 1 / ratio;
          var _match$groups = match.groups,
              dotted = _match$groups.dotted,
              tuplet = _match$groups.tuplet;

          if (dotted) {
            var thisManyDots = dotted.length;
            var divisor = Math.pow(2, thisManyDots);
            durationInQuarters = durationInQuarters + durationInQuarters * ((divisor - 1) / divisor);
          }

          if (typeof tuplet === 'string') {
            var fitInto = durationInQuarters * 2; // default to triplet:

            var thisManyNotes = Number(tuplet || '3');
            durationInQuarters = fitInto / thisManyNotes;
          }

          return durationInQuarters;
        }
      }

      throw new Error(duration + ' is not a valid duration.');
    }
  }]);

  return Utils;
}();

/**
 * Holds all data for a "note on" MIDI event
 * @param {object} fields {data: []}
 * @return {NoteOnEvent}
 */

var NoteOnEvent = /*#__PURE__*/function () {
  function NoteOnEvent(fields) {
    _classCallCheck(this, NoteOnEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      startTick: null,
      velocity: 50,
      wait: 0
    }, fields);
    this.type = 'note-on';
    this.channel = fields.channel;
    this.pitch = fields.pitch;
    this.wait = fields.wait;
    this.velocity = fields.velocity;
    this.startTick = fields.startTick;
    this.midiNumber = Utils.getPitch(this.pitch);
    this.tick = null;
    this.delta = null;
    this.data = fields.data;
  }
  /**
   * Builds int array for this event.
   * @param {Track} track - parent track
   * @return {NoteOnEvent}
   */


  _createClass(NoteOnEvent, [{
    key: "buildData",
    value: function buildData(track, precisionDelta) {
      this.data = []; // Explicitly defined startTick event

      if (this.startTick) {
        this.tick = Utils.getRoundedIfClose(this.startTick); // If this is the first event in the track then use event's starting tick as delta.

        if (track.tickPointer == 0) {
          this.delta = this.tick;
        }
      } else {
        this.delta = Utils.getTickDuration(this.wait);
        this.tick = Utils.getRoundedIfClose(track.tickPointer + this.delta);
      }

      this.deltaWithPrecisionCorrection = Utils.getRoundedIfClose(this.delta - precisionDelta);
      this.data = Utils.numberToVariableLength(this.deltaWithPrecisionCorrection).concat(this.getStatusByte(), this.midiNumber, Utils.convertVelocity(this.velocity));
      return this;
    }
    /**
     * Gets the note on status code based on the selected channel. 0x9{0-F}
     * Note on at channel 0 is 0x90 (144)
     * 0 = Ch 1
     * @return {number}
     */

  }, {
    key: "getStatusByte",
    value: function getStatusByte() {
      return 144 + this.channel - 1;
    }
  }]);

  return NoteOnEvent;
}();

/**
 * Holds all data for a "note off" MIDI event
 * @param {object} fields {data: []}
 * @return {NoteOffEvent}
 */

var NoteOffEvent = /*#__PURE__*/function () {
  function NoteOffEvent(fields) {
    _classCallCheck(this, NoteOffEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      velocity: 50,
      tick: null
    }, fields);
    this.type = 'note-off';
    this.channel = fields.channel;
    this.pitch = fields.pitch;
    this.duration = fields.duration;
    this.velocity = fields.velocity;
    this.midiNumber = Utils.getPitch(this.pitch);
    this.tick = fields.tick;
    this.delta = Utils.getTickDuration(this.duration);
    this.data = fields.data;
  }
  /**
   * Builds int array for this event.
   * @param {Track} track - parent track
   * @return {NoteOffEvent}
   */


  _createClass(NoteOffEvent, [{
    key: "buildData",
    value: function buildData(track, precisionDelta) {
      if (this.tick === null) {
        this.tick = Utils.getRoundedIfClose(this.delta + track.tickPointer);
      }

      this.deltaWithPrecisionCorrection = Utils.getRoundedIfClose(this.delta - precisionDelta);
      this.data = Utils.numberToVariableLength(this.deltaWithPrecisionCorrection).concat(this.getStatusByte(), this.midiNumber, Utils.convertVelocity(this.velocity));
      return this;
    }
    /**
     * Gets the note off status code based on the selected channel. 0x8{0-F}
     * Note off at channel 0 is 0x80 (128)
     * 0 = Ch 1
     * @return {number}
     */

  }, {
    key: "getStatusByte",
    value: function getStatusByte() {
      return 128 + this.channel - 1;
    }
  }]);

  return NoteOffEvent;
}();

/**
 * Wrapper for noteOnEvent/noteOffEvent objects that builds both events.
 * @param {object} fields - {pitch: '[C4]', duration: '4', wait: '4', velocity: 1-100}
 * @return {NoteEvent}
 */

var NoteEvent = /*#__PURE__*/function () {
  function NoteEvent(fields) {
    _classCallCheck(this, NoteEvent);

    // Set default fields
    fields = Object.assign({
      channel: 1,
      repeat: 1,
      sequential: false,
      startTick: null,
      velocity: 50,
      wait: 0
    }, fields);
    this.data = [];
    this.type = 'note';
    this.pitch = Utils.toArray(fields.pitch);
    this.channel = fields.channel;
    this.duration = fields.duration;
    this.grace = fields.grace;
    this.repeat = fields.repeat;
    this.sequential = fields.sequential;
    this.startTick = fields.startTick;
    this.velocity = fields.velocity;
    this.wait = fields.wait;
    this.tickDuration = Utils.getTickDuration(this.duration);
    this.restDuration = Utils.getTickDuration(this.wait);
    this.events = []; // Hold actual NoteOn/NoteOff events
  }
  /**
   * Builds int array for this event.
   * @return {NoteEvent}
   */


  _createClass(NoteEvent, [{
    key: "buildData",
    value: function buildData() {
      var _this = this;

      // Reset data array
      this.data = [];
      this.tickDuration;
      this.restDuration; // Apply grace note(s) and subtract ticks (currently 1 tick per grace note) from tickDuration so net value is the same

      if (this.grace) {
        var graceDuration = 1;
        this.grace = Utils.toArray(this.grace);
        this.grace.forEach(function (pitch) {
          var noteEvent = new NoteEvent({
            pitch: _this.grace,
            duration: 'T' + graceDuration
          });
          _this.data = _this.data.concat(noteEvent.data);
        });
      } // fields.pitch could be an array of pitches.
      // If this.sequential === true then it's a sequential string of notes that requires separate NoteOnEvents.

      if (!this.sequential) {
        // Handle repeat
        for (var j = 0; j < this.repeat; j++) {
          // Note on
          this.pitch.forEach(function (p, i) {
            if (i == 0) {
              var noteOnNew = new NoteOnEvent({
                channel: _this.channel,
                wait: _this.wait,
                velocity: _this.velocity,
                pitch: p,
                startTick: _this.startTick
              });
            } else {
              // Running status (can ommit the note on status)
              //noteOn = new NoteOnEvent({data: [0, Utils.getPitch(p), Utils.convertVelocity(this.velocity)]});
              var noteOnNew = new NoteOnEvent({
                channel: _this.channel,
                wait: 0,
                velocity: _this.velocity,
                pitch: p,
                startTick: _this.startTick
              });
            }

            _this.events.push(noteOnNew);
          }); // Note off

          this.pitch.forEach(function (p, i) {
            if (i == 0) {
              //noteOff = new NoteOffEvent({data: Utils.numberToVariableLength(tickDuration).concat(this.getNoteOffStatus(), Utils.getPitch(p), Utils.convertVelocity(this.velocity))});
              var noteOffNew = new NoteOffEvent({
                channel: _this.channel,
                duration: _this.duration,
                velocity: _this.velocity,
                pitch: p,
                tick: _this.startTick !== null ? Utils.getTickDuration(_this.duration) - _this.startTick : null
              });
            } else {
              // Running status (can ommit the note off status)
              //noteOff = new NoteOffEvent({data: [0, Utils.getPitch(p), Utils.convertVelocity(this.velocity)]});
              var noteOffNew = new NoteOffEvent({
                channel: _this.channel,
                duration: 0,
                velocity: _this.velocity,
                pitch: p,
                tick: _this.startTick !== null ? Utils.getTickDuration(_this.duration) - _this.startTick : null
              });
            }

            _this.events.push(noteOffNew);
          });
        }
      } else {
        // Handle repeat
        for (var j = 0; j < this.repeat; j++) {
          this.pitch.forEach(function (p, i) {

            var noteOnNew = new NoteOnEvent({
              channel: _this.channel,
              wait: i > 0 ? 0 : _this.wait,
              // wait only applies to first note in repetition
              velocity: _this.velocity,
              pitch: p,
              startTick: _this.startTick
            });
            var noteOffNew = new NoteOffEvent({
              channel: _this.channel,
              duration: _this.duration,
              velocity: _this.velocity,
              pitch: p
            });

            _this.events.push(noteOnNew, noteOffNew);
          });
        }
      }

      return this;
    }
  }]);

  return NoteEvent;
}();

/**
 * Holds all data for a "Pitch Bend" MIDI event
 * [ -1.0, 0, 1.0 ] ->  [ 0, 8192, 16383]
 * @param {object} fields { bend : float, channel : int }
 * @return {PitchBendEvent}
 */

var scale14bits = function scale14bits(zeroOne) {
  if (zeroOne <= 0) {
    return Math.floor(16384 * (zeroOne + 1) / 2);
  }

  return Math.floor(16383 * (zeroOne + 1) / 2);
};

var PitchBendEvent = function PitchBendEvent(fields) {
  _classCallCheck(this, PitchBendEvent);

  this.type = 'pitch-bend';
  var bend14 = scale14bits(fields.bend);
  var channel = fields.channel || 0;
  var lsbValue = bend14 & 0x7f;
  var msbValue = bend14 >> 7 & 0x7f;
  this.data = Utils.numberToVariableLength(0x00).concat(Constants.PITCH_BEND_STATUS | channel, lsbValue, msbValue);
};

/**
 * Holds all data for a "program change" MIDI event
 * @param {object} fields {instrument: integer}
 * @return {ProgramChangeEvent}
 */

var ProgramChangeEvent = function ProgramChangeEvent(fields) {
  _classCallCheck(this, ProgramChangeEvent);

  this.type = 'program'; // delta time defaults to 0.

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.PROGRAM_CHANGE_STATUS, fields.instrument);
};

/**
 * Holds all data for a "controller change" MIDI event
 * @param {object} fields {controllerNumber: integer, controllerValue: integer}
 * @return {ControllerChangeEvent}
 */

var ControllerChangeEvent = function ControllerChangeEvent(fields) {
  _classCallCheck(this, ControllerChangeEvent);

  this.type = 'controller'; // delta time defaults to 0.

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.CONTROLLER_CHANGE_STATUS, fields.controllerNumber, fields.controllerValue);
};

/**
 * Object representation of a tempo meta event.
 * @param {string} text - Copyright text
 * @return {CopyrightEvent}
 */

var CopyrightEvent = function CopyrightEvent(text) {
  _classCallCheck(this, CopyrightEvent);

  this.type = 'copyright';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_COPYRIGHT_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a cue point meta event.
 * @param {string} text - Cue point text
 * @return {CuePointEvent}
 */

var CuePointEvent = function CuePointEvent(text) {
  _classCallCheck(this, CuePointEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_CUE_POINT, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a end track meta event.
 * @return {EndTrackEvent}
 */

var EndTrackEvent = function EndTrackEvent() {
  _classCallCheck(this, EndTrackEvent);

  this.type = 'end-track'; // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_END_OF_TRACK_ID);
};

/**
 * Object representation of an instrument name meta event.
 * @param {number} bpm - Beats per minute
 * @return {InstrumentNameEvent}
 */

var InstrumentNameEvent = function InstrumentNameEvent(text) {
  _classCallCheck(this, InstrumentNameEvent);

  this.type = 'instrument-name';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_INSTRUMENT_NAME_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Instrument name
  );
};

/**
 * Object representation of a key signature meta event.
 * @return {KeySignatureEvent}
 */

var KeySignatureEvent = function KeySignatureEvent(sf, mi) {
  _classCallCheck(this, KeySignatureEvent);

  this.type = 'key-signature';
  var mode = mi || 0;
  sf = sf || 0; //	Function called with string notation

  if (typeof mi === 'undefined') {
    var fifths = [['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'], ['ab', 'eb', 'bb', 'f', 'c', 'g', 'd', 'a', 'e', 'b', 'f#', 'c#', 'g#', 'd#', 'a#']];
    var _sflen = sf.length;
    var note = sf || 'C';
    if (sf[0] === sf[0].toLowerCase()) mode = 1;

    if (_sflen > 1) {
      switch (sf.charAt(_sflen - 1)) {
        case 'm':
          mode = 1;
          note = sf.charAt(0).toLowerCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case '-':
          mode = 1;
          note = sf.charAt(0).toLowerCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case 'M':
          mode = 0;
          note = sf.charAt(0).toUpperCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;

        case '+':
          mode = 0;
          note = sf.charAt(0).toUpperCase();
          note = note.concat(sf.substring(1, _sflen - 1));
          break;
      }
    }

    var fifthindex = fifths[mode].indexOf(note);
    sf = fifthindex === -1 ? 0 : fifthindex - 7;
  } // Start with zero time delta


  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_KEY_SIGNATURE_ID, [0x02], // Size
  Utils.numberToBytes(sf, 1), // Number of sharp or flats ( < 0 flat; > 0 sharp)
  Utils.numberToBytes(mode, 1) // Mode: 0 major, 1 minor
  );
};

/**
 * Object representation of a lyric meta event.
 * @param {string} text - Lyric text
 * @return {LyricEvent}
 */

var LyricEvent = function LyricEvent(text) {
  _classCallCheck(this, LyricEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_LYRIC_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a marker meta event.
 * @param {string} text - Marker text
 * @return {MarkerEvent}
 */

var MarkerEvent = function MarkerEvent(text) {
  _classCallCheck(this, MarkerEvent);

  this.type = 'marker';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_MARKER_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TempoEvent}
 */

var TempoEvent = function TempoEvent(bpm) {
  _classCallCheck(this, TempoEvent);

  this.type = 'tempo';
  var tempo = Math.round(60000000 / bpm); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TEMPO_ID, [0x03], // Size
  Utils.numberToBytes(tempo, 3) // Tempo, 3 bytes
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TextEvent}
 */

var TextEvent = function TextEvent(text) {
  _classCallCheck(this, TextEvent);

  this.type = 'text';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TEXT_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Object representation of a time signature meta event.
 * @return {TimeSignatureEvent}
 */

var TimeSignatureEvent = function TimeSignatureEvent(numerator, denominator, midiclockspertick, notespermidiclock) {
  _classCallCheck(this, TimeSignatureEvent);

  this.type = 'time-signature'; // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TIME_SIGNATURE_ID, [0x04], // Size
  Utils.numberToBytes(numerator, 1), // Numerator, 1 bytes
  Utils.numberToBytes(Math.log2(denominator), 1), // Denominator is expressed as pow of 2, 1 bytes
  Utils.numberToBytes(midiclockspertick || 24, 1), // MIDI Clocks per tick, 1 bytes
  Utils.numberToBytes(notespermidiclock || 8, 1) // Number of 1/32 notes per MIDI clocks, 1 bytes
  );
};

/**
 * Object representation of a tempo meta event.
 * @param {number} bpm - Beats per minute
 * @return {TrackNameEvent}
 */

var TrackNameEvent = function TrackNameEvent(text) {
  _classCallCheck(this, TrackNameEvent);

  this.type = 'track-name';
  var textBytes = Utils.stringToBytes(text); // Start with zero time delta

  this.data = Utils.numberToVariableLength(0x00).concat(Constants.META_EVENT_ID, Constants.META_TRACK_NAME_ID, Utils.numberToVariableLength(textBytes.length), // Size
  textBytes // Text
  );
};

/**
 * Holds all data for a track.
 * @param {object} fields {type: number, data: array, size: array, events: array}
 * @return {Track}
 */

var Track = /*#__PURE__*/function () {
  function Track() {
    _classCallCheck(this, Track);

    this.type = Constants.TRACK_CHUNK_TYPE;
    this.data = [];
    this.size = [];
    this.events = [];
    this.explicitTickEvents = []; // If there are any events with an explicit tick defined then we will create a "sub" track for those
    // and merge them in and the end.

    this.tickPointer = 0; // Each time an event is added this will increase
  }
  /**
   * Adds any event type to the track.
   * Events without a specific startTick property are assumed to be added in order of how they should output.
   * Events with a specific startTick property are set aside for now will be merged in during build process.
   * @param {(NoteEvent|ProgramChangeEvent)} events - Event object or array of Event objects.
   * @param {function} mapFunction - Callback which can be used to apply specific properties to all events.
   * @return {Track}
   */


  _createClass(Track, [{
    key: "addEvent",
    value: function addEvent(events, mapFunction) {
      var _this = this;

      Utils.toArray(events).forEach(function (event, i) {
        if (event instanceof NoteEvent) {
          // Handle map function if provided
          if (typeof mapFunction === 'function') {
            var properties = mapFunction(i, event);

            if (_typeof(properties) === 'object') {
              for (var j in properties) {
                switch (j) {
                  case 'channel':
                    event.channel = properties[j];
                    break;

                  case 'duration':
                    event.duration = properties[j];
                    break;

                  case 'sequential':
                    event.sequential = properties[j];
                    break;

                  case 'velocity':
                    event.velocity = Utils.convertVelocity(properties[j]);
                    break;
                }
              }
            }
          } // If this note event has an explicit startTick then we need to set aside for now


          if (event.startTick !== null) {
            _this.explicitTickEvents.push(event);
          } else {
            // Push each on/off event to track's event stack
            event.buildData().events.forEach(function (e) {
              return _this.events.push(e);
            });
          }
        } else {
          _this.events.push(event);
        }
      });
      return this;
    }
    /**
     * Builds int array of all events.
     * @return {Track}
     */

  }, {
    key: "buildData",
    value: function buildData() {
      var _this2 = this;

      // Remove existing end track event and add one.
      // This makes sure it's at the very end of the event list.
      this.removeEventsByType('end-track').addEvent(new EndTrackEvent()); // Reset

      this.data = [];
      this.size = [];
      this.tickPointer = 0;
      var precisionLoss = 0;
      this.events.forEach(function (event, eventIndex) {
        // Build event & add to total tick duration
        if (event instanceof NoteOnEvent || event instanceof NoteOffEvent) {
          var built = event.buildData(_this2, precisionLoss);
          precisionLoss = Utils.getPrecisionLoss(event.deltaWithPrecisionCorrection || 0);
          _this2.data = _this2.data.concat(built.data);
          _this2.tickPointer = Utils.getRoundedIfClose(event.tick);
        } else {
          _this2.data = _this2.data.concat(event.data);
        }
      });
      this.mergeExplicitTickEvents();
      this.size = Utils.numberToBytes(this.data.length, 4); // 4 bytes long

      return this;
    }
  }, {
    key: "mergeExplicitTickEvents",
    value: function mergeExplicitTickEvents() {
      var _this3 = this;

      if (!this.explicitTickEvents.length) return; // First sort asc list of events by startTick

      this.explicitTickEvents.sort(function (a, b) {
        return a.startTick - b.startTick;
      }); // Now this.explicitTickEvents is in correct order, and so is this.events naturally.
      // For each explicit tick event, splice it into the main list of events and
      // adjust the delta on the following events so they still play normally.

      this.explicitTickEvents.forEach(function (noteEvent) {
        // Convert NoteEvent to it's respective NoteOn/NoteOff events
        // Note that as we splice in events the delta for the NoteOff ones will
        // Need to change based on what comes before them after the splice.
        noteEvent.buildData().events.forEach(function (e) {
          return e.buildData(_this3);
        }); // Merge each event indivually into this track's event list.

        noteEvent.events.forEach(function (event) {
          return _this3.mergeSingleEvent(event);
        });
      }); // Hacky way to rebuild track with newly spliced events.  Need better solution.

      this.explicitTickEvents = [];
      this.buildData();
    }
    /**
     * Merges another track's events with this track.
     * @param {Track} track
     * @return {Track}
     */

  }, {
    key: "mergeTrack",
    value: function mergeTrack(track) {
      var _this4 = this;

      // First build this track to populate each event's tick property
      this.buildData(); // Then build track to be merged so that tick property is populated on all events & merge each event.

      track.buildData().events.forEach(function (event) {
        return _this4.mergeSingleEvent(event);
      });
    }
    /**
     * Merges a single event into this track's list of events based on event.tick property.
     * @param {NoteOnEvent|NoteOffEvent} - event
     * @return {Track}
     */

  }, {
    key: "mergeSingleEvent",
    value: function mergeSingleEvent(event) {
      // Find index of existing event we need to follow with
      var lastEventIndex = 0;

      for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].tick > event.tick) break;
        lastEventIndex = i;
      }

      var splicedEventIndex = lastEventIndex + 1; // Need to adjust the delta of this event to ensure it falls on the correct tick.

      event.delta = event.tick - this.events[lastEventIndex].tick; // Splice this event at lastEventIndex + 1

      this.events.splice(splicedEventIndex, 0, event); // Now adjust delta of all following events

      for (var i = splicedEventIndex + 1; i < this.events.length; i++) {
        // Since each existing event should have a tick value at this point we just need to
        // adjust delta to that the event still falls on the correct tick.
        this.events[i].delta = this.events[i].tick - this.events[i - 1].tick;
      }
    }
    /**
     * Removes all events matching specified type.
     * @param {string} eventType - Event type
     * @return {Track}
     */

  }, {
    key: "removeEventsByType",
    value: function removeEventsByType(eventType) {
      var _this5 = this;

      this.events.forEach(function (event, index) {
        if (event.type === eventType) {
          _this5.events.splice(index, 1);
        }
      });
      return this;
    }
    /**
     * Sets tempo of the MIDI file.
     * @param {number} bpm - Tempo in beats per minute.
     * @return {Track}
     */

  }, {
    key: "setTempo",
    value: function setTempo(bpm) {
      return this.addEvent(new TempoEvent(bpm));
    }
    /**
     * Sets time signature.
     * @param {number} numerator - Top number of the time signature.
     * @param {number} denominator - Bottom number of the time signature.
     * @param {number} midiclockspertick - Defaults to 24.
     * @param {number} notespermidiclock - Defaults to 8.
     * @return {Track}
     */

  }, {
    key: "setTimeSignature",
    value: function setTimeSignature(numerator, denominator, midiclockspertick, notespermidiclock) {
      return this.addEvent(new TimeSignatureEvent(numerator, denominator, midiclockspertick, notespermidiclock));
    }
    /**
     * Sets key signature.
     * @param {*} sf -
     * @param {*} mi -
     * @return {Track}
     */

  }, {
    key: "setKeySignature",
    value: function setKeySignature(sf, mi) {
      return this.addEvent(new KeySignatureEvent(sf, mi));
    }
    /**
     * Adds text to MIDI file.
     * @param {string} text - Text to add.
     * @return {Track}
     */

  }, {
    key: "addText",
    value: function addText(text) {
      return this.addEvent(new TextEvent(text));
    }
    /**
     * Adds copyright to MIDI file.
     * @param {string} text - Text of copyright line.
     * @return {Track}
     */

  }, {
    key: "addCopyright",
    value: function addCopyright(text) {
      return this.addEvent(new CopyrightEvent(text));
    }
    /**
     * Adds Sequence/Track Name.
     * @param {string} text - Text of track name.
     * @return {Track}
     */

  }, {
    key: "addTrackName",
    value: function addTrackName(text) {
      return this.addEvent(new TrackNameEvent(text));
    }
    /**
     * Sets instrument name of track.
     * @param {string} text - Name of instrument.
     * @return {Track}
     */

  }, {
    key: "addInstrumentName",
    value: function addInstrumentName(text) {
      return this.addEvent(new InstrumentNameEvent(text));
    }
    /**
     * Adds marker to MIDI file.
     * @param {string} text - Marker text.
     * @return {Track}
     */

  }, {
    key: "addMarker",
    value: function addMarker(text) {
      return this.addEvent(new MarkerEvent(text));
    }
    /**
     * Adds cue point to MIDI file.
     * @param {string} text - Text of cue point.
     * @return {Track}
     */

  }, {
    key: "addCuePoint",
    value: function addCuePoint(text) {
      return this.addEvent(new CuePointEvent(text));
    }
    /**
     * Adds lyric to MIDI file.
     * @param {string} text - Lyric text to add.
     * @return {Track}
     */

  }, {
    key: "addLyric",
    value: function addLyric(text) {
      return this.addEvent(new LyricEvent(text));
    }
    /**
     * Channel mode messages
     * @return {Track}
     */

  }, {
    key: "polyModeOn",
    value: function polyModeOn() {
      var event = new NoteOnEvent({
        data: [0x00, 0xB0, 0x7E, 0x00]
      });
      return this.addEvent(event);
    }
    /**
     * Sets a pitch bend.
     * @param {float} bend - Bend value ranging [-1,1], zero meaning no bend.
     * @return {Track}
     */

  }, {
    key: "setPitchBend",
    value: function setPitchBend(bend) {
      return this.addEvent(new PitchBendEvent({
        bend: bend
      }));
    }
    /**
     * Adds a controller change event
     * @param {number} number - Control number.
     * @param {number} value - Control value.
     * @return {Track}
     */

  }, {
    key: "controllerChange",
    value: function controllerChange(number, value) {
      return this.addEvent(new ControllerChangeEvent({
        controllerNumber: number,
        controllerValue: value
      }));
    }
  }]);

  return Track;
}();

var VexFlow = /*#__PURE__*/function () {
  function VexFlow() {
    _classCallCheck(this, VexFlow);
  }

  _createClass(VexFlow, [{
    key: "trackFromVoice",
    value:
    /**
     * Support for converting VexFlow voice into MidiWriterJS track
     * @return MidiWriter.Track object
     */
    function trackFromVoice(voice) {
      var _this = this;

      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        addRenderedAccidentals: false
      };
      var track = new Track();
      var wait = [];
      voice.tickables.forEach(function (tickable) {
        if (tickable.noteType === 'n') {
          track.addEvent(new NoteEvent({
            pitch: tickable.keys.map(function (pitch, index) {
              return _this.convertPitch(pitch, index, tickable, options.addRenderedAccidentals);
            }),
            duration: _this.convertDuration(tickable),
            wait: wait
          })); // reset wait

          wait = [];
        } else if (tickable.noteType === 'r') {
          // move on to the next tickable and add this to the stack
          // of the `wait` property for the next note event
          wait.push(_this.convertDuration(tickable));
          return;
        }
      }); // There may be outstanding rests at the end of the track,
      // pad with a ghost note (zero duration and velocity), just to capture the wait.

      if (wait.length > 0) {
        track.addEvent(new NoteEvent({
          pitch: '[c4]',
          duration: '0',
          wait: wait,
          velocity: '0'
        }));
      }

      return track;
    }
    /**
     * Converts VexFlow pitch syntax to MidiWriterJS syntax
     * @param pitch string
     * @param index pitch index
     * @param note struct from Vexflow
     * @param addRenderedAccidentals adds Vexflow rendered accidentals
     */

  }, {
    key: "convertPitch",
    value: function convertPitch(pitch, index, note) {
      var addRenderedAccidentals = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      // Splits note name from octave
      var pitchParts = pitch.split('/'); // Retrieves accidentals from pitch
      // Removes natural accidentals since they are not accepted in Tonal Midi

      var accidentals = pitchParts[0].substring(1).replace('n', '');

      if (addRenderedAccidentals) {
        var _note$getAccidentals;

        (_note$getAccidentals = note.getAccidentals()) === null || _note$getAccidentals === void 0 ? void 0 : _note$getAccidentals.forEach(function (accidental) {
          if (accidental.index === index) {
            if (accidental.type === 'n') {
              accidentals = '';
            } else {
              accidentals += accidental.type;
            }
          }
        });
      }

      return pitchParts[0][0] + accidentals + pitchParts[1];
    }
    /**
     * Converts VexFlow duration syntax to MidiWriterJS syntax
     * @param note struct from VexFlow
     */

  }, {
    key: "convertDuration",
    value: function convertDuration(note) {
      return 'd'.repeat(note.dots) + this.convertBaseDuration(note.duration) + (note.tuplet ? 't' + note.tuplet.num_notes : '');
    }
    /**
     * Converts VexFlow base duration syntax to MidiWriterJS syntax
     * @param duration Vexflow duration
     * @returns MidiWriterJS duration
     */

  }, {
    key: "convertBaseDuration",
    value: function convertBaseDuration(duration) {
      switch (duration) {
        case 'w':
          return '1';

        case 'h':
          return '2';

        case 'q':
          return '4';

        default:
          return duration;
      }
    }
  }]);

  return VexFlow;
}();

/**
 * Object representation of a header chunk section of a MIDI file.
 * @param {number} numberOfTracks - Number of tracks
 * @return {HeaderChunk}
 */

var HeaderChunk = function HeaderChunk(numberOfTracks) {
  _classCallCheck(this, HeaderChunk);

  this.type = Constants.HEADER_CHUNK_TYPE;
  var trackType = numberOfTracks > 1 ? Constants.HEADER_CHUNK_FORMAT1 : Constants.HEADER_CHUNK_FORMAT0;
  this.data = trackType.concat(Utils.numberToBytes(numberOfTracks, 2), // two bytes long,
  Constants.HEADER_CHUNK_DIVISION);
  this.size = [0, 0, 0, this.data.length];
};

/**
 * Object that puts together tracks and provides methods for file output.
 * @param {array|Track} tracks - A single {Track} object or an array of {Track} objects.
 * @return {Writer}
 */

var Writer = /*#__PURE__*/function () {
  function Writer(tracks) {
    var _this = this;

    _classCallCheck(this, Writer);

    // Ensure track is an array
    tracks = Utils.toArray(tracks);
    this.data = [];
    this.data.push(new HeaderChunk(tracks.length)); // For each track add final end of track event and build data

    tracks.forEach(function (track, i) {
      _this.data.push(track.buildData());
    });
  }
  /**
   * Builds the file into a Uint8Array
   * @return {Uint8Array}
   */


  _createClass(Writer, [{
    key: "buildFile",
    value: function buildFile() {
      var build = []; // Data consists of chunks which consists of data

      this.data.forEach(function (d) {
        return build = build.concat(d.type, d.size, d.data);
      });
      return new Uint8Array(build);
    }
    /**
     * Convert file buffer to a base64 string.  Different methods depending on if browser or node.
     * @return {string}
     */

  }, {
    key: "base64",
    value: function base64() {
      if (typeof btoa === 'function') return btoa(String.fromCharCode.apply(null, this.buildFile()));
      return Buffer.from(this.buildFile()).toString('base64');
    }
    /**
     * Get the data URI.
     * @return {string}
     */

  }, {
    key: "dataUri",
    value: function dataUri() {
      return 'data:audio/midi;base64,' + this.base64();
    }
    /**
     * Output to stdout
     * @return {string}
     */

  }, {
    key: "stdout",
    value: function stdout() {
      return process.stdout.write(new Buffer(this.buildFile()));
    }
    /**
     * Save to MIDI file
     * @param {string} filename
     */

  }, /* {
    key: "saveMIDI",
    value: function saveMIDI(filename) {
      var fs = require('fs');

      var buffer = new Buffer.from(this.buildFile());
      fs.writeFile(filename + '.mid', buffer, function (err) {
        if (err) throw err;
      });
    }  
  }  */ 
]); 

  return Writer;
}();

var main = {
  Constants: Constants,
  NoteOnEvent: NoteOnEvent,
  NoteOffEvent: NoteOffEvent,
  NoteEvent: NoteEvent,
  PitchBendEvent: PitchBendEvent,
  ProgramChangeEvent: ProgramChangeEvent,
  Track: Track,
  Utils: Utils,
  VexFlow: VexFlow,
  Writer: Writer
};
window.MidiWriter = main;
};
