(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var defined = require('defined');
var EPSILON = Number.EPSILON;

function clamp (value, min, max) {
  return min < max
    ? (value < min ? min : value > max ? max : value)
    : (value < max ? max : value > min ? min : value);
}

function clamp01 (v) {
  return clamp(v, 0, 1);
}

function lerp (min, max, t) {
  return min * (1 - t) + max * t;
}

function inverseLerp (min, max, t) {
  if (Math.abs(min - max) < EPSILON) return 0;
  else return (t - min) / (max - min);
}

function smoothstep (min, max, t) {
  var x = clamp(inverseLerp(min, max, t), 0, 1);
  return x * x * (3 - 2 * x);
}

function toFinite (n, defaultValue) {
  defaultValue = defined(defaultValue, 0);
  return typeof n === 'number' && isFinite(n) ? n : defaultValue;
}

function expandVector (dims) {
  if (typeof dims !== 'number') throw new TypeError('Expected dims argument');
  return function (p, defaultValue) {
    defaultValue = defined(defaultValue, 0);
    var scalar;
    if (p == null) {
      // No vector, create a default one
      scalar = defaultValue;
    } else if (typeof p === 'number' && isFinite(p)) {
      // Expand single channel to multiple vector
      scalar = p;
    }

    var out = [];
    var i;
    if (scalar == null) {
      for (i = 0; i < dims; i++) {
        out[i] = toFinite(p[i], defaultValue);
      }
    } else {
      for (i = 0; i < dims; i++) {
        out[i] = scalar;
      }
    }
    return out;
  };
}

function lerpArray (min, max, t, out) {
  out = out || [];
  if (min.length !== max.length) {
    throw new TypeError('min and max array are expected to have the same length');
  }
  for (var i = 0; i < min.length; i++) {
    out[i] = lerp(min[i], max[i], t);
  }
  return out;
}

function newArray (n, initialValue) {
  n = defined(n, 0);
  if (typeof n !== 'number') throw new TypeError('Expected n argument to be a number');
  var out = [];
  for (var i = 0; i < n; i++) out.push(initialValue);
  return out;
}

function linspace (n, opts) {
  n = defined(n, 0);
  if (typeof n !== 'number') throw new TypeError('Expected n argument to be a number');
  opts = opts || {};
  if (typeof opts === 'boolean') {
    opts = { endpoint: true };
  }
  var offset = defined(opts.offset, 0);
  if (opts.endpoint) {
    return newArray(n).map(function (_, i) {
      return n <= 1 ? 0 : ((i + offset) / (n - 1));
    });
  } else {
    return newArray(n).map(function (_, i) {
      return (i + offset) / n;
    });
  }
}

function lerpFrames (values, t, out) {
  t = clamp(t, 0, 1);

  var len = values.length - 1;
  var whole = t * len;
  var frame = Math.floor(whole);
  var fract = whole - frame;

  var nextFrame = Math.min(frame + 1, len);
  var a = values[frame % values.length];
  var b = values[nextFrame % values.length];
  if (typeof a === 'number' && typeof b === 'number') {
    return lerp(a, b, fract);
  } else if (Array.isArray(a) && Array.isArray(b)) {
    return lerpArray(a, b, fract, out);
  } else {
    throw new TypeError('Mismatch in value type of two array elements: ' + frame + ' and ' + nextFrame);
  }
}

function mod (a, b) {
  return ((a % b) + b) % b;
}

function degToRad (n) {
  return n * Math.PI / 180;
}

function radToDeg (n) {
  return n * 180 / Math.PI;
}

function fract (n) {
  return n - Math.floor(n);
}

function sign (n) {
  if (n > 0) return 1;
  else if (n < 0) return -1;
  else return 0;
}

function wrap (value, from, to) {
  if (typeof from !== 'number' || typeof to !== 'number') {
    throw new TypeError('Must specify "to" and "from" arguments as numbers');
  }
  // algorithm from http://stackoverflow.com/a/5852628/599884
  if (from > to) {
    var t = from;
    from = to;
    to = t;
  }
  var cycle = to - from;
  if (cycle === 0) {
    return to;
  }
  return value - cycle * Math.floor((value - from) / cycle);
}

// Specific function from Unity / ofMath, not sure its needed?
// function lerpWrap (a, b, t, min, max) {
//   return wrap(a + wrap(b - a, min, max) * t, min, max)
// }

function pingPong (t, length) {
  t = mod(t, length * 2);
  return length - Math.abs(t - length);
}

function damp (a, b, lambda, dt) {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

function dampArray (a, b, lambda, dt, out) {
  out = out || [];
  for (var i = 0; i < a.length; i++) {
    out[i] = damp(a[i], b[i], lambda, dt);
  }
  return out;
}

function mapRange (value, inputMin, inputMax, outputMin, outputMax, clamp) {
  // Reference:
  // https://openframeworks.cc/documentation/math/ofMath/
  if (Math.abs(inputMin - inputMax) < EPSILON) {
    return outputMin;
  } else {
    var outVal = ((value - inputMin) / (inputMax - inputMin) * (outputMax - outputMin) + outputMin);
    if (clamp) {
      if (outputMax < outputMin) {
        if (outVal < outputMax) outVal = outputMax;
        else if (outVal > outputMin) outVal = outputMin;
      } else {
        if (outVal > outputMax) outVal = outputMax;
        else if (outVal < outputMin) outVal = outputMin;
      }
    }
    return outVal;
  }
}

module.exports = {
  mod: mod,
  fract: fract,
  sign: sign,
  degToRad: degToRad,
  radToDeg: radToDeg,
  wrap: wrap,
  pingPong: pingPong,
  linspace: linspace,
  lerp: lerp,
  lerpArray: lerpArray,
  inverseLerp: inverseLerp,
  lerpFrames: lerpFrames,
  clamp: clamp,
  clamp01: clamp01,
  smoothstep: smoothstep,
  damp: damp,
  dampArray: dampArray,
  mapRange: mapRange,
  expand2D: expandVector(2),
  expand3D: expandVector(3),
  expand4D: expandVector(4)
};

},{"defined":5}],2:[function(require,module,exports){
var seedRandom = require('seed-random');
var SimplexNoise = require('simplex-noise');
var defined = require('defined');

function createRandom (defaultSeed) {
  defaultSeed = defined(defaultSeed, null);
  var defaultRandom = Math.random;
  var currentSeed;
  var currentRandom;
  var noiseGenerator;
  var _nextGaussian = null;
  var _hasNextGaussian = false;

  setSeed(defaultSeed);

  return {
    value: value,
    createRandom: function (defaultSeed) {
      return createRandom(defaultSeed);
    },
    setSeed: setSeed,
    getSeed: getSeed,
    getRandomSeed: getRandomSeed,
    valueNonZero: valueNonZero,
    permuteNoise: permuteNoise,
    noise1D: noise1D,
    noise2D: noise2D,
    noise3D: noise3D,
    noise4D: noise4D,
    sign: sign,
    boolean: boolean,
    chance: chance,
    range: range,
    rangeFloor: rangeFloor,
    pick: pick,
    shuffle: shuffle,
    onCircle: onCircle,
    insideCircle: insideCircle,
    onSphere: onSphere,
    insideSphere: insideSphere,
    quaternion: quaternion,
    weighted: weighted,
    weightedSet: weightedSet,
    weightedSetIndex: weightedSetIndex,
    gaussian: gaussian
  };

  function setSeed (seed, opt) {
    if (typeof seed === 'number' || typeof seed === 'string') {
      currentSeed = seed;
      currentRandom = seedRandom(currentSeed, opt);
    } else {
      currentSeed = undefined;
      currentRandom = defaultRandom;
    }
    noiseGenerator = createNoise();
    _nextGaussian = null;
    _hasNextGaussian = false;
  }

  function value () {
    return currentRandom();
  }

  function valueNonZero () {
    var u = 0;
    while (u === 0) u = value();
    return u;
  }

  function getSeed () {
    return currentSeed;
  }

  function getRandomSeed () {
    var seed = String(Math.floor(Math.random() * 1000000));
    return seed;
  }

  function createNoise () {
    return new SimplexNoise(currentRandom);
  }

  function permuteNoise () {
    noiseGenerator = createNoise();
  }

  function noise1D (x, frequency, amplitude) {
    if (!isFinite(x)) throw new TypeError('x component for noise() must be finite');
    frequency = defined(frequency, 1);
    amplitude = defined(amplitude, 1);
    return amplitude * noiseGenerator.noise2D(x * frequency, 0);
  }

  function noise2D (x, y, frequency, amplitude) {
    if (!isFinite(x)) throw new TypeError('x component for noise() must be finite');
    if (!isFinite(y)) throw new TypeError('y component for noise() must be finite');
    frequency = defined(frequency, 1);
    amplitude = defined(amplitude, 1);
    return amplitude * noiseGenerator.noise2D(x * frequency, y * frequency);
  }

  function noise3D (x, y, z, frequency, amplitude) {
    if (!isFinite(x)) throw new TypeError('x component for noise() must be finite');
    if (!isFinite(y)) throw new TypeError('y component for noise() must be finite');
    if (!isFinite(z)) throw new TypeError('z component for noise() must be finite');
    frequency = defined(frequency, 1);
    amplitude = defined(amplitude, 1);
    return amplitude * noiseGenerator.noise3D(
      x * frequency,
      y * frequency,
      z * frequency
    );
  }

  function noise4D (x, y, z, w, frequency, amplitude) {
    if (!isFinite(x)) throw new TypeError('x component for noise() must be finite');
    if (!isFinite(y)) throw new TypeError('y component for noise() must be finite');
    if (!isFinite(z)) throw new TypeError('z component for noise() must be finite');
    if (!isFinite(w)) throw new TypeError('w component for noise() must be finite');
    frequency = defined(frequency, 1);
    amplitude = defined(amplitude, 1);
    return amplitude * noiseGenerator.noise4D(
      x * frequency,
      y * frequency,
      z * frequency,
      w * frequency
    );
  }

  function sign () {
    return boolean() ? 1 : -1;
  }

  function boolean () {
    return value() > 0.5;
  }

  function chance (n) {
    n = defined(n, 0.5);
    if (typeof n !== 'number') throw new TypeError('expected n to be a number');
    return value() < n;
  }

  function range (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Expected all arguments to be numbers');
    }

    return value() * (max - min) + min;
  }

  function rangeFloor (min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new TypeError('Expected all arguments to be numbers');
    }

    return Math.floor(range(min, max));
  }

  function pick (array) {
    if (array.length === 0) return undefined;
    return array[rangeFloor(0, array.length)];
  }

  function shuffle (arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('Expected Array, got ' + typeof arr);
    }

    var rand;
    var tmp;
    var len = arr.length;
    var ret = arr.slice();
    while (len) {
      rand = Math.floor(value() * len--);
      tmp = ret[len];
      ret[len] = ret[rand];
      ret[rand] = tmp;
    }
    return ret;
  }

  function onCircle (radius, out) {
    radius = defined(radius, 1);
    out = out || [];
    var theta = value() * 2.0 * Math.PI;
    out[0] = radius * Math.cos(theta);
    out[1] = radius * Math.sin(theta);
    return out;
  }

  function insideCircle (radius, out) {
    radius = defined(radius, 1);
    out = out || [];
    onCircle(1, out);
    var r = radius * Math.sqrt(value());
    out[0] *= r;
    out[1] *= r;
    return out;
  }

  function onSphere (radius, out) {
    radius = defined(radius, 1);
    out = out || [];
    var u = value() * Math.PI * 2;
    var v = value() * 2 - 1;
    var phi = u;
    var theta = Math.acos(v);
    out[0] = radius * Math.sin(theta) * Math.cos(phi);
    out[1] = radius * Math.sin(theta) * Math.sin(phi);
    out[2] = radius * Math.cos(theta);
    return out;
  }

  function insideSphere (radius, out) {
    radius = defined(radius, 1);
    out = out || [];
    var u = value() * Math.PI * 2;
    var v = value() * 2 - 1;
    var k = value();

    var phi = u;
    var theta = Math.acos(v);
    var r = radius * Math.cbrt(k);
    out[0] = r * Math.sin(theta) * Math.cos(phi);
    out[1] = r * Math.sin(theta) * Math.sin(phi);
    out[2] = r * Math.cos(theta);
    return out;
  }

  function quaternion (out) {
    out = out || [];
    var u1 = value();
    var u2 = value();
    var u3 = value();

    var sq1 = Math.sqrt(1 - u1);
    var sq2 = Math.sqrt(u1);

    var theta1 = Math.PI * 2 * u2;
    var theta2 = Math.PI * 2 * u3;

    var x = Math.sin(theta1) * sq1;
    var y = Math.cos(theta1) * sq1;
    var z = Math.sin(theta2) * sq2;
    var w = Math.cos(theta2) * sq2;
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
  }

  function weightedSet (set) {
    set = set || [];
    if (set.length === 0) return null;
    return set[weightedSetIndex(set)].value;
  }

  function weightedSetIndex (set) {
    set = set || [];
    if (set.length === 0) return -1;
    return weighted(set.map(function (s) {
      return s.weight;
    }));
  }

  function weighted (weights) {
    weights = weights || [];
    if (weights.length === 0) return -1;
    var totalWeight = 0;
    var i;

    for (i = 0; i < weights.length; i++) {
      totalWeight += weights[i];
    }

    if (totalWeight <= 0) throw new Error('Weights must sum to > 0');

    var random = value() * totalWeight;
    for (i = 0; i < weights.length; i++) {
      if (random < weights[i]) {
        return i;
      }
      random -= weights[i];
    }
    return 0;
  }

  function gaussian (mean, standardDerivation) {
    mean = defined(mean, 0);
    standardDerivation = defined(standardDerivation, 1);

    // https://github.com/openjdk-mirror/jdk7u-jdk/blob/f4d80957e89a19a29bb9f9807d2a28351ed7f7df/src/share/classes/java/util/Random.java#L496
    if (_hasNextGaussian) {
      _hasNextGaussian = false;
      var result = _nextGaussian;
      _nextGaussian = null;
      return mean + standardDerivation * result;
    } else {
      var v1 = 0;
      var v2 = 0;
      var s = 0;
      do {
        v1 = value() * 2 - 1; // between -1 and 1
        v2 = value() * 2 - 1; // between -1 and 1
        s = v1 * v1 + v2 * v2;
      } while (s >= 1 || s === 0);
      var multiplier = Math.sqrt(-2 * Math.log(s) / s);
      _nextGaussian = (v2 * multiplier);
      _hasNextGaussian = true;
      return mean + standardDerivation * (v1 * multiplier);
    }
  }
}

module.exports = createRandom();

},{"defined":5,"seed-random":6,"simplex-noise":7}],3:[function(require,module,exports){
(function (global){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('convert-length')) :
    typeof define === 'function' && define.amd ? define(['convert-length'], factory) :
    (global.canvasSketch = factory(null));
}(this, (function (convertLength) {

    convertLength = convertLength && convertLength.hasOwnProperty('default') ? convertLength['default'] : convertLength;

    var defined = function () {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined) return arguments[i];
        }
    };

    /*
    object-assign
    (c) Sindre Sorhus
    @license MIT
    */
    /* eslint-disable no-unused-vars */
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;

    function toObject(val) {
    	if (val === null || val === undefined) {
    		throw new TypeError('Object.assign cannot be called with null or undefined');
    	}

    	return Object(val);
    }

    function shouldUseNative() {
    	try {
    		if (!Object.assign) {
    			return false;
    		}

    		// Detect buggy property enumeration order in older V8 versions.

    		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
    		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
    		test1[5] = 'de';
    		if (Object.getOwnPropertyNames(test1)[0] === '5') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test2 = {};
    		for (var i = 0; i < 10; i++) {
    			test2['_' + String.fromCharCode(i)] = i;
    		}
    		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
    			return test2[n];
    		});
    		if (order2.join('') !== '0123456789') {
    			return false;
    		}

    		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
    		var test3 = {};
    		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
    			test3[letter] = letter;
    		});
    		if (Object.keys(Object.assign({}, test3)).join('') !==
    				'abcdefghijklmnopqrst') {
    			return false;
    		}

    		return true;
    	} catch (err) {
    		// We don't expect any of the above to throw, but better to be safe.
    		return false;
    	}
    }

    var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
    	var from;
    	var to = toObject(target);
    	var symbols;

    	for (var s = 1; s < arguments.length; s++) {
    		from = Object(arguments[s]);

    		for (var key in from) {
    			if (hasOwnProperty.call(from, key)) {
    				to[key] = from[key];
    			}
    		}

    		if (getOwnPropertySymbols) {
    			symbols = getOwnPropertySymbols(from);
    			for (var i = 0; i < symbols.length; i++) {
    				if (propIsEnumerable.call(from, symbols[i])) {
    					to[symbols[i]] = from[symbols[i]];
    				}
    			}
    		}
    	}

    	return to;
    };

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var browser =
      commonjsGlobal.performance &&
      commonjsGlobal.performance.now ? function now() {
        return performance.now()
      } : Date.now || function now() {
        return +new Date
      };

    var isPromise_1 = isPromise;

    function isPromise(obj) {
      return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
    }

    var isDom = isNode;

    function isNode (val) {
      return (!val || typeof val !== 'object')
        ? false
        : (typeof window === 'object' && typeof window.Node === 'object')
          ? (val instanceof window.Node)
          : (typeof val.nodeType === 'number') &&
            (typeof val.nodeName === 'string')
    }

    function getClientAPI() {
        return typeof window !== 'undefined' && window['canvas-sketch-cli'];
    }

    function isBrowser() {
        return typeof document !== 'undefined';
    }

    function isWebGLContext(ctx) {
        return typeof ctx.clear === 'function' && typeof ctx.clearColor === 'function' && typeof ctx.bufferData === 'function';
    }

    function isCanvas(element) {
        return isDom(element) && /canvas/i.test(element.nodeName) && typeof element.getContext === 'function';
    }

    var keys = createCommonjsModule(function (module, exports) {
    exports = module.exports = typeof Object.keys === 'function'
      ? Object.keys : shim;

    exports.shim = shim;
    function shim (obj) {
      var keys = [];
      for (var key in obj) keys.push(key);
      return keys;
    }
    });
    var keys_1 = keys.shim;

    var is_arguments = createCommonjsModule(function (module, exports) {
    var supportsArgumentsClass = (function(){
      return Object.prototype.toString.call(arguments)
    })() == '[object Arguments]';

    exports = module.exports = supportsArgumentsClass ? supported : unsupported;

    exports.supported = supported;
    function supported(object) {
      return Object.prototype.toString.call(object) == '[object Arguments]';
    }
    exports.unsupported = unsupported;
    function unsupported(object){
      return object &&
        typeof object == 'object' &&
        typeof object.length == 'number' &&
        Object.prototype.hasOwnProperty.call(object, 'callee') &&
        !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
        false;
    }});
    var is_arguments_1 = is_arguments.supported;
    var is_arguments_2 = is_arguments.unsupported;

    var deepEqual_1 = createCommonjsModule(function (module) {
    var pSlice = Array.prototype.slice;



    var deepEqual = module.exports = function (actual, expected, opts) {
      if (!opts) opts = {};
      // 7.1. All identical values are equivalent, as determined by ===.
      if (actual === expected) {
        return true;

      } else if (actual instanceof Date && expected instanceof Date) {
        return actual.getTime() === expected.getTime();

      // 7.3. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
      } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
        return opts.strict ? actual === expected : actual == expected;

      // 7.4. For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
      } else {
        return objEquiv(actual, expected, opts);
      }
    };

    function isUndefinedOrNull(value) {
      return value === null || value === undefined;
    }

    function isBuffer (x) {
      if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
      if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
        return false;
      }
      if (x.length > 0 && typeof x[0] !== 'number') return false;
      return true;
    }

    function objEquiv(a, b, opts) {
      var i, key;
      if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
        return false;
      // an identical 'prototype' property.
      if (a.prototype !== b.prototype) return false;
      //~~~I've managed to break Object.keys through screwy arguments passing.
      //   Converting to array solves the problem.
      if (is_arguments(a)) {
        if (!is_arguments(b)) {
          return false;
        }
        a = pSlice.call(a);
        b = pSlice.call(b);
        return deepEqual(a, b, opts);
      }
      if (isBuffer(a)) {
        if (!isBuffer(b)) {
          return false;
        }
        if (a.length !== b.length) return false;
        for (i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) return false;
        }
        return true;
      }
      try {
        var ka = keys(a),
            kb = keys(b);
      } catch (e) {//happens when one is a string literal and the other isn't
        return false;
      }
      // having the same number of owned properties (keys incorporates
      // hasOwnProperty)
      if (ka.length != kb.length)
        return false;
      //the same set of keys (although not necessarily the same order),
      ka.sort();
      kb.sort();
      //~~~cheap key test
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] != kb[i])
          return false;
      }
      //equivalent values for every corresponding key, and
      //~~~possibly expensive deep test
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!deepEqual(a[key], b[key], opts)) return false;
      }
      return typeof a === typeof b;
    }
    });

    var dateformat = createCommonjsModule(function (module, exports) {
    /*
     * Date Format 1.2.3
     * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
     * MIT license
     *
     * Includes enhancements by Scott Trenda <scott.trenda.net>
     * and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */

    (function(global) {

      var dateFormat = (function() {
          var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZWN]|"[^"]*"|'[^']*'/g;
          var timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g;
          var timezoneClip = /[^-+\dA-Z]/g;
      
          // Regexes and supporting functions are cached through closure
          return function (date, mask, utc, gmt) {
      
            // You can't provide utc if you skip other args (use the 'UTC:' mask prefix)
            if (arguments.length === 1 && kindOf(date) === 'string' && !/\d/.test(date)) {
              mask = date;
              date = undefined;
            }
      
            date = date || new Date;
      
            if(!(date instanceof Date)) {
              date = new Date(date);
            }
      
            if (isNaN(date)) {
              throw TypeError('Invalid date');
            }
      
            mask = String(dateFormat.masks[mask] || mask || dateFormat.masks['default']);
      
            // Allow setting the utc/gmt argument via the mask
            var maskSlice = mask.slice(0, 4);
            if (maskSlice === 'UTC:' || maskSlice === 'GMT:') {
              mask = mask.slice(4);
              utc = true;
              if (maskSlice === 'GMT:') {
                gmt = true;
              }
            }
      
            var _ = utc ? 'getUTC' : 'get';
            var d = date[_ + 'Date']();
            var D = date[_ + 'Day']();
            var m = date[_ + 'Month']();
            var y = date[_ + 'FullYear']();
            var H = date[_ + 'Hours']();
            var M = date[_ + 'Minutes']();
            var s = date[_ + 'Seconds']();
            var L = date[_ + 'Milliseconds']();
            var o = utc ? 0 : date.getTimezoneOffset();
            var W = getWeek(date);
            var N = getDayOfWeek(date);
            var flags = {
              d:    d,
              dd:   pad(d),
              ddd:  dateFormat.i18n.dayNames[D],
              dddd: dateFormat.i18n.dayNames[D + 7],
              m:    m + 1,
              mm:   pad(m + 1),
              mmm:  dateFormat.i18n.monthNames[m],
              mmmm: dateFormat.i18n.monthNames[m + 12],
              yy:   String(y).slice(2),
              yyyy: y,
              h:    H % 12 || 12,
              hh:   pad(H % 12 || 12),
              H:    H,
              HH:   pad(H),
              M:    M,
              MM:   pad(M),
              s:    s,
              ss:   pad(s),
              l:    pad(L, 3),
              L:    pad(Math.round(L / 10)),
              t:    H < 12 ? dateFormat.i18n.timeNames[0] : dateFormat.i18n.timeNames[1],
              tt:   H < 12 ? dateFormat.i18n.timeNames[2] : dateFormat.i18n.timeNames[3],
              T:    H < 12 ? dateFormat.i18n.timeNames[4] : dateFormat.i18n.timeNames[5],
              TT:   H < 12 ? dateFormat.i18n.timeNames[6] : dateFormat.i18n.timeNames[7],
              Z:    gmt ? 'GMT' : utc ? 'UTC' : (String(date).match(timezone) || ['']).pop().replace(timezoneClip, ''),
              o:    (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
              S:    ['th', 'st', 'nd', 'rd'][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10],
              W:    W,
              N:    N
            };
      
            return mask.replace(token, function (match) {
              if (match in flags) {
                return flags[match];
              }
              return match.slice(1, match.length - 1);
            });
          };
        })();

      dateFormat.masks = {
        'default':               'ddd mmm dd yyyy HH:MM:ss',
        'shortDate':             'm/d/yy',
        'mediumDate':            'mmm d, yyyy',
        'longDate':              'mmmm d, yyyy',
        'fullDate':              'dddd, mmmm d, yyyy',
        'shortTime':             'h:MM TT',
        'mediumTime':            'h:MM:ss TT',
        'longTime':              'h:MM:ss TT Z',
        'isoDate':               'yyyy-mm-dd',
        'isoTime':               'HH:MM:ss',
        'isoDateTime':           'yyyy-mm-dd\'T\'HH:MM:sso',
        'isoUtcDateTime':        'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\'',
        'expiresHeaderFormat':   'ddd, dd mmm yyyy HH:MM:ss Z'
      };

      // Internationalization strings
      dateFormat.i18n = {
        dayNames: [
          'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
          'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
        ],
        monthNames: [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
          'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
        ],
        timeNames: [
          'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
        ]
      };

    function pad(val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) {
        val = '0' + val;
      }
      return val;
    }

    /**
     * Get the ISO 8601 week number
     * Based on comments from
     * http://techblog.procurios.nl/k/n618/news/view/33796/14863/Calculate-ISO-8601-week-and-year-in-javascript.html
     *
     * @param  {Object} `date`
     * @return {Number}
     */
    function getWeek(date) {
      // Remove time components of date
      var targetThursday = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Change date to Thursday same week
      targetThursday.setDate(targetThursday.getDate() - ((targetThursday.getDay() + 6) % 7) + 3);

      // Take January 4th as it is always in week 1 (see ISO 8601)
      var firstThursday = new Date(targetThursday.getFullYear(), 0, 4);

      // Change date to Thursday same week
      firstThursday.setDate(firstThursday.getDate() - ((firstThursday.getDay() + 6) % 7) + 3);

      // Check if daylight-saving-time-switch occurred and correct for it
      var ds = targetThursday.getTimezoneOffset() - firstThursday.getTimezoneOffset();
      targetThursday.setHours(targetThursday.getHours() - ds);

      // Number of weeks between target Thursday and first Thursday
      var weekDiff = (targetThursday - firstThursday) / (86400000*7);
      return 1 + Math.floor(weekDiff);
    }

    /**
     * Get ISO-8601 numeric representation of the day of the week
     * 1 (for Monday) through 7 (for Sunday)
     * 
     * @param  {Object} `date`
     * @return {Number}
     */
    function getDayOfWeek(date) {
      var dow = date.getDay();
      if(dow === 0) {
        dow = 7;
      }
      return dow;
    }

    /**
     * kind-of shortcut
     * @param  {*} val
     * @return {String}
     */
    function kindOf(val) {
      if (val === null) {
        return 'null';
      }

      if (val === undefined) {
        return 'undefined';
      }

      if (typeof val !== 'object') {
        return typeof val;
      }

      if (Array.isArray(val)) {
        return 'array';
      }

      return {}.toString.call(val)
        .slice(8, -1).toLowerCase();
    }


      if (typeof undefined === 'function' && undefined.amd) {
        undefined(function () {
          return dateFormat;
        });
      } else {
        module.exports = dateFormat;
      }
    })(commonjsGlobal);
    });

    /*!
     * repeat-string <https://github.com/jonschlinkert/repeat-string>
     *
     * Copyright (c) 2014-2015, Jon Schlinkert.
     * Licensed under the MIT License.
     */

    /**
     * Results cache
     */

    var res = '';
    var cache;

    /**
     * Expose `repeat`
     */

    var repeatString = repeat;

    /**
     * Repeat the given `string` the specified `number`
     * of times.
     *
     * **Example:**
     *
     * ```js
     * var repeat = require('repeat-string');
     * repeat('A', 5);
     * //=> AAAAA
     * ```
     *
     * @param {String} `string` The string to repeat
     * @param {Number} `number` The number of times to repeat the string
     * @return {String} Repeated string
     * @api public
     */

    function repeat(str, num) {
      if (typeof str !== 'string') {
        throw new TypeError('expected a string');
      }

      // cover common, quick use cases
      if (num === 1) return str;
      if (num === 2) return str + str;

      var max = str.length * num;
      if (cache !== str || typeof cache === 'undefined') {
        cache = str;
        res = '';
      } else if (res.length >= max) {
        return res.substr(0, max);
      }

      while (max > res.length && num > 1) {
        if (num & 1) {
          res += str;
        }

        num >>= 1;
        str += str;
      }

      res += str;
      res = res.substr(0, max);
      return res;
    }

    var padLeft = function padLeft(str, num, ch) {
      str = str.toString();

      if (typeof num === 'undefined') {
        return str;
      }

      if (ch === 0) {
        ch = '0';
      } else if (ch) {
        ch = ch.toString();
      } else {
        ch = ' ';
      }

      return repeatString(ch, num - str.length) + str;
    };

    var noop = function () {};
    var link;
    var supportedEncodings = ['image/png','image/jpeg','image/webp'];
    function exportCanvas(canvas, opt) {
        if ( opt === void 0 ) opt = {};

        var encoding = opt.encoding || 'image/png';
        if (!supportedEncodings.includes(encoding)) 
            { throw new Error(("Invalid canvas encoding " + encoding)); }
        var extension = (encoding.split('/')[1] || '').replace(/jpeg/i, 'jpg');
        if (extension) 
            { extension = ("." + extension).toLowerCase(); }
        return {
            extension: extension,
            type: encoding,
            dataURL: canvas.toDataURL(encoding, opt.encodingQuality)
        };
    }

    function createBlobFromDataURL(dataURL) {
        return new Promise(function (resolve) {
            var splitIndex = dataURL.indexOf(',');
            if (splitIndex === -1) {
                resolve(new window.Blob());
                return;
            }
            var base64 = dataURL.slice(splitIndex + 1);
            var byteString = window.atob(base64);
            var mimeMatch = /data:([^;+]);/.exec(dataURL);
            var mime = (mimeMatch ? mimeMatch[1] : '') || undefined;
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0;i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            resolve(new window.Blob([ab], {
                type: mime
            }));
        });
    }

    function saveDataURL(dataURL, opts) {
        if ( opts === void 0 ) opts = {};

        return createBlobFromDataURL(dataURL).then(function (blob) { return saveBlob(blob, opts); });
    }

    function saveBlob(blob, opts) {
        if ( opts === void 0 ) opts = {};

        return new Promise(function (resolve) {
            opts = objectAssign({
                extension: '',
                prefix: '',
                suffix: ''
            }, opts);
            var filename = resolveFilename(opts);
            var client = getClientAPI();
            if (client && typeof client.saveBlob === 'function' && client.output) {
                return client.saveBlob(blob, objectAssign({}, opts, {
                    filename: filename
                })).then(function (ev) { return resolve(ev); });
            } else {
                if (!link) {
                    link = document.createElement('a');
                    link.style.visibility = 'hidden';
                    link.target = '_blank';
                }
                link.download = filename;
                link.href = window.URL.createObjectURL(blob);
                document.body.appendChild(link);
                link.onclick = (function () {
                    link.onclick = noop;
                    setTimeout(function () {
                        window.URL.revokeObjectURL(blob);
                        document.body.removeChild(link);
                        link.removeAttribute('href');
                        resolve({
                            filename: filename,
                            client: false
                        });
                    });
                });
                link.click();
            }
        });
    }

    function saveFile(data, opts) {
        if ( opts === void 0 ) opts = {};

        var parts = Array.isArray(data) ? data : [data];
        var blob = new window.Blob(parts, {
            type: opts.type || ''
        });
        return saveBlob(blob, opts);
    }

    function getFileName() {
        var dateFormatStr = "yyyy.mm.dd-HH.MM.ss";
        return dateformat(new Date(), dateFormatStr);
    }

    function resolveFilename(opt) {
        if ( opt === void 0 ) opt = {};

        opt = objectAssign({}, opt);
        if (typeof opt.file === 'function') {
            return opt.file(opt);
        } else if (opt.file) {
            return opt.file;
        }
        var frame = null;
        var extension = '';
        if (typeof opt.extension === 'string') 
            { extension = opt.extension; }
        if (typeof opt.frame === 'number') {
            var totalFrames;
            if (typeof opt.totalFrames === 'number') {
                totalFrames = opt.totalFrames;
            } else {
                totalFrames = Math.max(1000, opt.frame);
            }
            frame = padLeft(String(opt.frame), String(totalFrames).length, '0');
        }
        var layerStr = isFinite(opt.totalLayers) && isFinite(opt.layer) && opt.totalLayers > 1 ? ("" + (opt.layer)) : '';
        if (frame != null) {
            return [layerStr,frame].filter(Boolean).join('-') + extension;
        } else {
            var defaultFileName = opt.timeStamp;
            return [opt.prefix,opt.name || defaultFileName,layerStr,opt.hash,opt.suffix].filter(Boolean).join('-') + extension;
        }
    }

    var commonTypos = {
        dimension: 'dimensions',
        animated: 'animate',
        animating: 'animate',
        unit: 'units',
        P5: 'p5',
        pixellated: 'pixelated',
        looping: 'loop',
        pixelPerInch: 'pixels'
    };
    var allKeys = ['dimensions','units','pixelsPerInch','orientation','scaleToFit',
        'scaleToView','bleed','pixelRatio','exportPixelRatio','maxPixelRatio','scaleContext',
        'resizeCanvas','styleCanvas','canvas','context','attributes','parent','file',
        'name','prefix','suffix','animate','playing','loop','duration','totalFrames',
        'fps','playbackRate','timeScale','frame','time','flush','pixelated','hotkeys',
        'p5','id','scaleToFitPadding','data','params','encoding','encodingQuality'];
    var checkSettings = function (settings) {
        var keys = Object.keys(settings);
        keys.forEach(function (key) {
            if (key in commonTypos) {
                var actual = commonTypos[key];
                console.warn(("[canvas-sketch] Could not recognize the setting \"" + key + "\", did you mean \"" + actual + "\"?"));
            } else if (!allKeys.includes(key)) {
                console.warn(("[canvas-sketch] Could not recognize the setting \"" + key + "\""));
            }
        });
    };

    function keyboardShortcuts (opt) {
        if ( opt === void 0 ) opt = {};

        var handler = function (ev) {
            if (!opt.enabled()) 
                { return; }
            var client = getClientAPI();
            if (ev.keyCode === 83 && !ev.altKey && (ev.metaKey || ev.ctrlKey)) {
                ev.preventDefault();
                opt.save(ev);
            } else if (ev.keyCode === 32) {
                opt.togglePlay(ev);
            } else if (client && !ev.altKey && ev.keyCode === 75 && (ev.metaKey || ev.ctrlKey)) {
                ev.preventDefault();
                opt.commit(ev);
            }
        };
        var attach = function () {
            window.addEventListener('keydown', handler);
        };
        var detach = function () {
            window.removeEventListener('keydown', handler);
        };
        return {
            attach: attach,
            detach: detach
        };
    }

    var defaultUnits = 'mm';
    var data = [['postcard',101.6,152.4],['poster-small',280,430],['poster',460,610],
        ['poster-large',610,910],['business-card',50.8,88.9],['2r',64,89],['3r',89,127],
        ['4r',102,152],['5r',127,178],['6r',152,203],['8r',203,254],['10r',254,305],['11r',
        279,356],['12r',305,381],['a0',841,1189],['a1',594,841],['a2',420,594],['a3',
        297,420],['a4',210,297],['a5',148,210],['a6',105,148],['a7',74,105],['a8',52,
        74],['a9',37,52],['a10',26,37],['2a0',1189,1682],['4a0',1682,2378],['b0',1000,
        1414],['b1',707,1000],['b1+',720,1020],['b2',500,707],['b2+',520,720],['b3',353,
        500],['b4',250,353],['b5',176,250],['b6',125,176],['b7',88,125],['b8',62,88],
        ['b9',44,62],['b10',31,44],['b11',22,32],['b12',16,22],['c0',917,1297],['c1',
        648,917],['c2',458,648],['c3',324,458],['c4',229,324],['c5',162,229],['c6',114,
        162],['c7',81,114],['c8',57,81],['c9',40,57],['c10',28,40],['c11',22,32],['c12',
        16,22],['half-letter',5.5,8.5,'in'],['letter',8.5,11,'in'],['legal',8.5,14,'in'],
        ['junior-legal',5,8,'in'],['ledger',11,17,'in'],['tabloid',11,17,'in'],['ansi-a',
        8.5,11.0,'in'],['ansi-b',11.0,17.0,'in'],['ansi-c',17.0,22.0,'in'],['ansi-d',
        22.0,34.0,'in'],['ansi-e',34.0,44.0,'in'],['arch-a',9,12,'in'],['arch-b',12,18,
        'in'],['arch-c',18,24,'in'],['arch-d',24,36,'in'],['arch-e',36,48,'in'],['arch-e1',
        30,42,'in'],['arch-e2',26,38,'in'],['arch-e3',27,39,'in']];
    var paperSizes = data.reduce(function (dict, preset) {
        var item = {
            units: preset[3] || defaultUnits,
            dimensions: [preset[1],preset[2]]
        };
        dict[preset[0]] = item;
        dict[preset[0].replace(/-/g, ' ')] = item;
        return dict;
    }, {})

    function getDimensionsFromPreset(dimensions, unitsTo, pixelsPerInch) {
        if ( unitsTo === void 0 ) unitsTo = 'px';
        if ( pixelsPerInch === void 0 ) pixelsPerInch = 72;

        if (typeof dimensions === 'string') {
            var key = dimensions.toLowerCase();
            if (!(key in paperSizes)) {
                throw new Error(("The dimension preset \"" + dimensions + "\" is not supported or could not be found; try using a4, a3, postcard, letter, etc."));
            }
            var preset = paperSizes[key];
            return preset.dimensions.map(function (d) { return convertDistance(d, preset.units, unitsTo, pixelsPerInch); });
        } else {
            return dimensions;
        }
    }

    function convertDistance(dimension, unitsFrom, unitsTo, pixelsPerInch) {
        if ( unitsFrom === void 0 ) unitsFrom = 'px';
        if ( unitsTo === void 0 ) unitsTo = 'px';
        if ( pixelsPerInch === void 0 ) pixelsPerInch = 72;

        return convertLength(dimension, unitsFrom, unitsTo, {
            pixelsPerInch: pixelsPerInch,
            precision: 4,
            roundPixel: true
        });
    }

    function checkIfHasDimensions(settings) {
        if (!settings.dimensions) 
            { return false; }
        if (typeof settings.dimensions === 'string') 
            { return true; }
        if (Array.isArray(settings.dimensions) && settings.dimensions.length >= 2) 
            { return true; }
        return false;
    }

    function getParentSize(props, settings) {
        if (!isBrowser()) {
            return [300,150];
        }
        var element = settings.parent || window;
        if (element === window || element === document || element === document.body) {
            return [window.innerWidth,window.innerHeight];
        } else {
            var ref = element.getBoundingClientRect();
            var width = ref.width;
            var height = ref.height;
            return [width,height];
        }
    }

    function resizeCanvas(props, settings) {
        var width, height;
        var styleWidth, styleHeight;
        var canvasWidth, canvasHeight;
        var browser = isBrowser();
        var dimensions = settings.dimensions;
        var hasDimensions = checkIfHasDimensions(settings);
        var exporting = props.exporting;
        var scaleToFit = hasDimensions ? settings.scaleToFit !== false : false;
        var scaleToView = !exporting && hasDimensions ? settings.scaleToView : true;
        if (!browser) 
            { scaleToFit = (scaleToView = false); }
        var units = settings.units;
        var pixelsPerInch = typeof settings.pixelsPerInch === 'number' && isFinite(settings.pixelsPerInch) ? settings.pixelsPerInch : 72;
        var bleed = defined(settings.bleed, 0);
        var devicePixelRatio = browser ? window.devicePixelRatio : 1;
        var basePixelRatio = scaleToView ? devicePixelRatio : 1;
        var pixelRatio, exportPixelRatio;
        if (typeof settings.pixelRatio === 'number' && isFinite(settings.pixelRatio)) {
            pixelRatio = settings.pixelRatio;
            exportPixelRatio = defined(settings.exportPixelRatio, pixelRatio);
        } else {
            if (hasDimensions) {
                pixelRatio = basePixelRatio;
                exportPixelRatio = defined(settings.exportPixelRatio, 1);
            } else {
                pixelRatio = devicePixelRatio;
                exportPixelRatio = defined(settings.exportPixelRatio, pixelRatio);
            }
        }
        if (typeof settings.maxPixelRatio === 'number' && isFinite(settings.maxPixelRatio)) {
            pixelRatio = Math.min(settings.maxPixelRatio, pixelRatio);
            exportPixelRatio = Math.min(settings.maxPixelRatio, exportPixelRatio);
        }
        if (exporting) {
            pixelRatio = exportPixelRatio;
        }
        var ref = getParentSize(props, settings);
        var parentWidth = ref[0];
        var parentHeight = ref[1];
        var trimWidth, trimHeight;
        if (hasDimensions) {
            var result = getDimensionsFromPreset(dimensions, units, pixelsPerInch);
            var highest = Math.max(result[0], result[1]);
            var lowest = Math.min(result[0], result[1]);
            if (settings.orientation) {
                var landscape = settings.orientation === 'landscape';
                width = landscape ? highest : lowest;
                height = landscape ? lowest : highest;
            } else {
                width = result[0];
                height = result[1];
            }
            trimWidth = width;
            trimHeight = height;
            width += bleed * 2;
            height += bleed * 2;
        } else {
            width = parentWidth;
            height = parentHeight;
            trimWidth = width;
            trimHeight = height;
        }
        var realWidth = width;
        var realHeight = height;
        if (hasDimensions && units) {
            realWidth = convertDistance(width, units, 'px', pixelsPerInch);
            realHeight = convertDistance(height, units, 'px', pixelsPerInch);
        }
        styleWidth = Math.round(realWidth);
        styleHeight = Math.round(realHeight);
        if (scaleToFit && !exporting && hasDimensions) {
            var aspect = width / height;
            var windowAspect = parentWidth / parentHeight;
            var scaleToFitPadding = defined(settings.scaleToFitPadding, 40);
            var maxWidth = Math.round(parentWidth - scaleToFitPadding * 2);
            var maxHeight = Math.round(parentHeight - scaleToFitPadding * 2);
            if (styleWidth > maxWidth || styleHeight > maxHeight) {
                if (windowAspect > aspect) {
                    styleHeight = maxHeight;
                    styleWidth = Math.round(styleHeight * aspect);
                } else {
                    styleWidth = maxWidth;
                    styleHeight = Math.round(styleWidth / aspect);
                }
            }
        }
        canvasWidth = scaleToView ? Math.round(pixelRatio * styleWidth) : Math.round(pixelRatio * realWidth);
        canvasHeight = scaleToView ? Math.round(pixelRatio * styleHeight) : Math.round(pixelRatio * realHeight);
        var viewportWidth = scaleToView ? Math.round(styleWidth) : Math.round(realWidth);
        var viewportHeight = scaleToView ? Math.round(styleHeight) : Math.round(realHeight);
        var scaleX = canvasWidth / width;
        var scaleY = canvasHeight / height;
        return {
            bleed: bleed,
            pixelRatio: pixelRatio,
            width: width,
            height: height,
            dimensions: [width,height],
            units: units || 'px',
            scaleX: scaleX,
            scaleY: scaleY,
            viewportWidth: viewportWidth,
            viewportHeight: viewportHeight,
            canvasWidth: canvasWidth,
            canvasHeight: canvasHeight,
            trimWidth: trimWidth,
            trimHeight: trimHeight,
            styleWidth: styleWidth,
            styleHeight: styleHeight
        };
    }

    var getCanvasContext_1 = getCanvasContext;
    function getCanvasContext (type, opts) {
      if (typeof type !== 'string') {
        throw new TypeError('must specify type string')
      }

      opts = opts || {};

      if (typeof document === 'undefined' && !opts.canvas) {
        return null // check for Node
      }

      var canvas = opts.canvas || document.createElement('canvas');
      if (typeof opts.width === 'number') {
        canvas.width = opts.width;
      }
      if (typeof opts.height === 'number') {
        canvas.height = opts.height;
      }

      var attribs = opts;
      var gl;
      try {
        var names = [ type ];
        // prefix GL contexts
        if (type.indexOf('webgl') === 0) {
          names.push('experimental-' + type);
        }

        for (var i = 0; i < names.length; i++) {
          gl = canvas.getContext(names[i], attribs);
          if (gl) return gl
        }
      } catch (e) {
        gl = null;
      }
      return (gl || null) // ensure null on fail
    }

    function createCanvasElement() {
        if (!isBrowser()) {
            throw new Error('It appears you are runing from Node.js or a non-browser environment. Try passing in an existing { canvas } interface instead.');
        }
        return document.createElement('canvas');
    }

    function createCanvas(settings) {
        if ( settings === void 0 ) settings = {};

        var context, canvas;
        var ownsCanvas = false;
        if (settings.canvas !== false) {
            context = settings.context;
            if (!context || typeof context === 'string') {
                var newCanvas = settings.canvas;
                if (!newCanvas) {
                    newCanvas = createCanvasElement();
                    ownsCanvas = true;
                }
                var type = context || '2d';
                if (typeof newCanvas.getContext !== 'function') {
                    throw new Error("The specified { canvas } element does not have a getContext() function, maybe it is not a <canvas> tag?");
                }
                context = getCanvasContext_1(type, objectAssign({}, settings.attributes, {
                    canvas: newCanvas
                }));
                if (!context) {
                    throw new Error(("Failed at canvas.getContext('" + type + "') - the browser may not support this context, or a different context may already be in use with this canvas."));
                }
            }
            canvas = context.canvas;
            if (settings.canvas && canvas !== settings.canvas) {
                throw new Error('The { canvas } and { context } settings must point to the same underlying canvas element');
            }
            if (settings.pixelated) {
                context.imageSmoothingEnabled = false;
                context.mozImageSmoothingEnabled = false;
                context.oImageSmoothingEnabled = false;
                context.webkitImageSmoothingEnabled = false;
                context.msImageSmoothingEnabled = false;
                canvas.style['image-rendering'] = 'pixelated';
            }
        }
        return {
            canvas: canvas,
            context: context,
            ownsCanvas: ownsCanvas
        };
    }

    var SketchManager = function SketchManager() {
        var this$1 = this;

        this._settings = {};
        this._props = {};
        this._sketch = undefined;
        this._raf = null;
        this._lastRedrawResult = undefined;
        this._isP5Resizing = false;
        this._keyboardShortcuts = keyboardShortcuts({
            enabled: function () { return this$1.settings.hotkeys !== false; },
            save: function (ev) {
                if (ev.shiftKey) {
                    if (this$1.props.recording) {
                        this$1.endRecord();
                        this$1.run();
                    } else 
                        { this$1.record(); }
                } else 
                    { this$1.exportFrame(); }
            },
            togglePlay: function () {
                if (this$1.props.playing) 
                    { this$1.pause(); }
                 else 
                    { this$1.play(); }
            },
            commit: function (ev) {
                this$1.exportFrame({
                    commit: true
                });
            }
        });
        this._animateHandler = (function () { return this$1.animate(); });
        this._resizeHandler = (function () {
            var changed = this$1.resize();
            if (changed) {
                this$1.render();
            }
        });
    };

    var prototypeAccessors = { sketch: { configurable: true },settings: { configurable: true },props: { configurable: true } };
    prototypeAccessors.sketch.get = function () {
        return this._sketch;
    };
    prototypeAccessors.settings.get = function () {
        return this._settings;
    };
    prototypeAccessors.props.get = function () {
        return this._props;
    };
    SketchManager.prototype._computePlayhead = function _computePlayhead (currentTime, duration) {
        var hasDuration = typeof duration === 'number' && isFinite(duration);
        return hasDuration ? currentTime / duration : 0;
    };
    SketchManager.prototype._computeFrame = function _computeFrame (playhead, time, totalFrames, fps) {
        return isFinite(totalFrames) && totalFrames > 1 ? Math.floor(playhead * (totalFrames - 1)) : Math.floor(fps * time);
    };
    SketchManager.prototype._computeCurrentFrame = function _computeCurrentFrame () {
        return this._computeFrame(this.props.playhead, this.props.time, this.props.totalFrames, this.props.fps);
    };
    SketchManager.prototype._getSizeProps = function _getSizeProps () {
        var props = this.props;
        return {
            width: props.width,
            height: props.height,
            pixelRatio: props.pixelRatio,
            canvasWidth: props.canvasWidth,
            canvasHeight: props.canvasHeight,
            viewportWidth: props.viewportWidth,
            viewportHeight: props.viewportHeight
        };
    };
    SketchManager.prototype.run = function run () {
        if (!this.sketch) 
            { throw new Error('should wait until sketch is loaded before trying to play()'); }
        if (this.settings.playing !== false) {
            this.play();
        }
        if (typeof this.sketch.dispose === 'function') {
            console.warn('In canvas-sketch@0.0.23 the dispose() event has been renamed to unload()');
        }
        if (!this.props.started) {
            this._signalBegin();
            this.props.started = true;
        }
        this.tick();
        this.render();
        return this;
    };
    SketchManager.prototype.play = function play () {
        var animate = this.settings.animate;
        if ('animation' in this.settings) {
            animate = true;
            console.warn('[canvas-sketch] { animation } has been renamed to { animate }');
        }
        if (!animate) 
            { return; }
        if (!isBrowser()) {
            console.error('[canvas-sketch] WARN: Using { animate } in Node.js is not yet supported');
            return;
        }
        if (this.props.playing) 
            { return; }
        if (!this.props.started) {
            this._signalBegin();
            this.props.started = true;
        }
        this.props.playing = true;
        if (this._raf != null) 
            { window.cancelAnimationFrame(this._raf); }
        this._lastTime = browser();
        this._raf = window.requestAnimationFrame(this._animateHandler);
    };
    SketchManager.prototype.pause = function pause () {
        if (this.props.recording) 
            { this.endRecord(); }
        this.props.playing = false;
        if (this._raf != null && isBrowser()) {
            window.cancelAnimationFrame(this._raf);
        }
    };
    SketchManager.prototype.togglePlay = function togglePlay () {
        if (this.props.playing) 
            { this.pause(); }
         else 
            { this.play(); }
    };
    SketchManager.prototype.stop = function stop () {
        this.pause();
        this.props.frame = 0;
        this.props.playhead = 0;
        this.props.time = 0;
        this.props.deltaTime = 0;
        this.props.started = false;
        this.render();
    };
    SketchManager.prototype.record = function record () {
            var this$1 = this;

        if (this.props.recording) 
            { return; }
        if (!isBrowser()) {
            console.error('[canvas-sketch] WARN: Recording from Node.js is not yet supported');
            return;
        }
        this.stop();
        this.props.playing = true;
        this.props.recording = true;
        var frameInterval = 1 / this.props.fps;
        if (this._raf != null) 
            { window.cancelAnimationFrame(this._raf); }
        var tick = function () {
            if (!this$1.props.recording) 
                { return Promise.resolve(); }
            this$1.props.deltaTime = frameInterval;
            this$1.tick();
            return this$1.exportFrame({
                sequence: true
            }).then(function () {
                if (!this$1.props.recording) 
                    { return; }
                this$1.props.deltaTime = 0;
                this$1.props.frame++;
                if (this$1.props.frame < this$1.props.totalFrames) {
                    this$1.props.time += frameInterval;
                    this$1.props.playhead = this$1._computePlayhead(this$1.props.time, this$1.props.duration);
                    this$1._raf = window.requestAnimationFrame(tick);
                } else {
                    console.log('Finished recording');
                    this$1._signalEnd();
                    this$1.endRecord();
                    this$1.stop();
                    this$1.run();
                }
            });
        };
        if (!this.props.started) {
            this._signalBegin();
            this.props.started = true;
        }
        this._raf = window.requestAnimationFrame(tick);
    };
    SketchManager.prototype._signalBegin = function _signalBegin () {
            var this$1 = this;

        if (this.sketch && typeof this.sketch.begin === 'function') {
            this._wrapContextScale(function (props) { return this$1.sketch.begin(props); });
        }
    };
    SketchManager.prototype._signalEnd = function _signalEnd () {
            var this$1 = this;

        if (this.sketch && typeof this.sketch.end === 'function') {
            this._wrapContextScale(function (props) { return this$1.sketch.end(props); });
        }
    };
    SketchManager.prototype.endRecord = function endRecord () {
        if (this._raf != null && isBrowser()) 
            { window.cancelAnimationFrame(this._raf); }
        this.props.recording = false;
        this.props.deltaTime = 0;
        this.props.playing = false;
    };
    SketchManager.prototype.exportFrame = function exportFrame (opt) {
            var this$1 = this;
            if ( opt === void 0 ) opt = {};

        if (!this.sketch) 
            { return Promise.all([]); }
        if (typeof this.sketch.preExport === 'function') {
            this.sketch.preExport();
        }
        var exportOpts = objectAssign({
            sequence: opt.sequence,
            frame: opt.sequence ? this.props.frame : undefined,
            file: this.settings.file,
            name: this.settings.name,
            prefix: this.settings.prefix,
            suffix: this.settings.suffix,
            encoding: this.settings.encoding,
            encodingQuality: this.settings.encodingQuality,
            timeStamp: getFileName(),
            totalFrames: isFinite(this.props.totalFrames) ? Math.max(100, this.props.totalFrames) : 1000
        });
        var client = getClientAPI();
        var p = Promise.resolve();
        if (client && opt.commit && typeof client.commit === 'function') {
            var commitOpts = objectAssign({}, exportOpts);
            var hash = client.commit(commitOpts);
            if (isPromise_1(hash)) 
                { p = hash; }
             else 
                { p = Promise.resolve(hash); }
        }
        return p.then(function (hash) { return this$1._doExportFrame(objectAssign({}, exportOpts, {
            hash: hash || ''
        })); });
    };
    SketchManager.prototype._doExportFrame = function _doExportFrame (exportOpts) {
            var this$1 = this;
            if ( exportOpts === void 0 ) exportOpts = {};

        this._props.exporting = true;
        this.resize();
        var drawResult = this.render();
        var canvas = this.props.canvas;
        if (typeof drawResult === 'undefined') {
            drawResult = [canvas];
        }
        drawResult = [].concat(drawResult).filter(Boolean);
        drawResult = drawResult.map(function (result) {
            var hasDataObject = typeof result === 'object' && result && ('data' in result || 'dataURL' in result);
            var data = hasDataObject ? result.data : result;
            var opts = hasDataObject ? objectAssign({}, result, {
                data: data
            }) : {
                data: data
            };
            if (isCanvas(data)) {
                var encoding = opts.encoding || exportOpts.encoding;
                var encodingQuality = defined(opts.encodingQuality, exportOpts.encodingQuality, 0.95);
                var ref = exportCanvas(data, {
                    encoding: encoding,
                    encodingQuality: encodingQuality
                });
                    var dataURL = ref.dataURL;
                    var extension = ref.extension;
                    var type = ref.type;
                return Object.assign(opts, {
                    dataURL: dataURL,
                    extension: extension,
                    type: type
                });
            } else {
                return opts;
            }
        });
        this._props.exporting = false;
        this.resize();
        this.render();
        return Promise.all(drawResult.map(function (result, i, layerList) {
            var curOpt = objectAssign({}, exportOpts, result, {
                layer: i,
                totalLayers: layerList.length
            });
            var data = result.data;
            if (result.dataURL) {
                var dataURL = result.dataURL;
                delete curOpt.dataURL;
                return saveDataURL(dataURL, curOpt);
            } else {
                return saveFile(data, curOpt);
            }
        })).then(function (ev) {
            if (ev.length > 0) {
                var eventWithOutput = ev.find(function (e) { return e.outputName; });
                var isClient = ev.some(function (e) { return e.client; });
                var item;
                if (ev.length > 1) 
                    { item = ev.length; }
                 else if (eventWithOutput) 
                    { item = (eventWithOutput.outputName) + "/" + (ev[0].filename); }
                 else 
                    { item = "" + (ev[0].filename); }
                var ofSeq = '';
                if (exportOpts.sequence) {
                    var hasTotalFrames = isFinite(this$1.props.totalFrames);
                    ofSeq = hasTotalFrames ? (" (frame " + (exportOpts.frame + 1) + " / " + (this$1.props.totalFrames) + ")") : (" (frame " + (exportOpts.frame) + ")");
                } else if (ev.length > 1) {
                    ofSeq = " files";
                }
                var client = isClient ? 'canvas-sketch-cli' : 'canvas-sketch';
                console.log(("%c[" + client + "]%c Exported %c" + item + "%c" + ofSeq), 'color: #8e8e8e;', 'color: initial;', 'font-weight: bold;', 'font-weight: initial;');
            }
            if (typeof this$1.sketch.postExport === 'function') {
                this$1.sketch.postExport();
            }
        });
    };
    SketchManager.prototype._wrapContextScale = function _wrapContextScale (cb) {
        this._preRender();
        cb(this.props);
        this._postRender();
    };
    SketchManager.prototype._preRender = function _preRender () {
        var props = this.props;
        if (!this.props.gl && props.context && !props.p5) {
            props.context.save();
            if (this.settings.scaleContext !== false) {
                props.context.scale(props.scaleX, props.scaleY);
            }
        } else if (props.p5) {
            props.p5.scale(props.scaleX / props.pixelRatio, props.scaleY / props.pixelRatio);
        }
    };
    SketchManager.prototype._postRender = function _postRender () {
        var props = this.props;
        if (!this.props.gl && props.context && !props.p5) {
            props.context.restore();
        }
        if (props.gl && this.settings.flush !== false && !props.p5) {
            props.gl.flush();
        }
    };
    SketchManager.prototype.tick = function tick () {
        if (this.sketch && typeof this.sketch.tick === 'function') {
            this._preRender();
            this.sketch.tick(this.props);
            this._postRender();
        }
    };
    SketchManager.prototype.render = function render () {
        if (this.props.p5) {
            this._lastRedrawResult = undefined;
            this.props.p5.redraw();
            return this._lastRedrawResult;
        } else {
            return this.submitDrawCall();
        }
    };
    SketchManager.prototype.submitDrawCall = function submitDrawCall () {
        if (!this.sketch) 
            { return; }
        var props = this.props;
        this._preRender();
        var drawResult;
        if (typeof this.sketch === 'function') {
            drawResult = this.sketch(props);
        } else if (typeof this.sketch.render === 'function') {
            drawResult = this.sketch.render(props);
        }
        this._postRender();
        return drawResult;
    };
    SketchManager.prototype.update = function update (opt) {
            var this$1 = this;
            if ( opt === void 0 ) opt = {};

        var notYetSupported = ['animate'];
        Object.keys(opt).forEach(function (key) {
            if (notYetSupported.indexOf(key) >= 0) {
                throw new Error(("Sorry, the { " + key + " } option is not yet supported with update()."));
            }
        });
        var oldCanvas = this._settings.canvas;
        var oldContext = this._settings.context;
        for (var key in opt) {
            var value = opt[key];
            if (typeof value !== 'undefined') {
                this$1._settings[key] = value;
            }
        }
        var timeOpts = Object.assign({}, this._settings, opt);
        if ('time' in opt && 'frame' in opt) 
            { throw new Error('You should specify { time } or { frame } but not both'); }
         else if ('time' in opt) 
            { delete timeOpts.frame; }
         else if ('frame' in opt) 
            { delete timeOpts.time; }
        if ('duration' in opt && 'totalFrames' in opt) 
            { throw new Error('You should specify { duration } or { totalFrames } but not both'); }
         else if ('duration' in opt) 
            { delete timeOpts.totalFrames; }
         else if ('totalFrames' in opt) 
            { delete timeOpts.duration; }
        if ('data' in opt) 
            { this._props.data = opt.data; }
        var timeProps = this.getTimeProps(timeOpts);
        Object.assign(this._props, timeProps);
        if (oldCanvas !== this._settings.canvas || oldContext !== this._settings.context) {
            var ref = createCanvas(this._settings);
                var canvas = ref.canvas;
                var context = ref.context;
            this.props.canvas = canvas;
            this.props.context = context;
            this._setupGLKey();
            this._appendCanvasIfNeeded();
        }
        if (opt.p5 && typeof opt.p5 !== 'function') {
            this.props.p5 = opt.p5;
            this.props.p5.draw = (function () {
                if (this$1._isP5Resizing) 
                    { return; }
                this$1._lastRedrawResult = this$1.submitDrawCall();
            });
        }
        if ('playing' in opt) {
            if (opt.playing) 
                { this.play(); }
             else 
                { this.pause(); }
        }
        checkSettings(this._settings);
        this.resize();
        this.render();
        return this.props;
    };
    SketchManager.prototype.resize = function resize () {
        var oldSizes = this._getSizeProps();
        var settings = this.settings;
        var props = this.props;
        var newProps = resizeCanvas(props, settings);
        Object.assign(this._props, newProps);
        var ref = this.props;
            var pixelRatio = ref.pixelRatio;
            var canvasWidth = ref.canvasWidth;
            var canvasHeight = ref.canvasHeight;
            var styleWidth = ref.styleWidth;
            var styleHeight = ref.styleHeight;
        var canvas = this.props.canvas;
        if (canvas && settings.resizeCanvas !== false) {
            if (props.p5) {
                if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
                    this._isP5Resizing = true;
                    props.p5.pixelDensity(pixelRatio);
                    props.p5.resizeCanvas(canvasWidth / pixelRatio, canvasHeight / pixelRatio, false);
                    this._isP5Resizing = false;
                }
            } else {
                if (canvas.width !== canvasWidth) 
                    { canvas.width = canvasWidth; }
                if (canvas.height !== canvasHeight) 
                    { canvas.height = canvasHeight; }
            }
            if (isBrowser() && settings.styleCanvas !== false) {
                canvas.style.width = styleWidth + "px";
                canvas.style.height = styleHeight + "px";
            }
        }
        var newSizes = this._getSizeProps();
        var changed = !deepEqual_1(oldSizes, newSizes);
        if (changed) {
            this._sizeChanged();
        }
        return changed;
    };
    SketchManager.prototype._sizeChanged = function _sizeChanged () {
        if (this.sketch && typeof this.sketch.resize === 'function') {
            this.sketch.resize(this.props);
        }
    };
    SketchManager.prototype.animate = function animate () {
        if (!this.props.playing) 
            { return; }
        if (!isBrowser()) {
            console.error('[canvas-sketch] WARN: Animation in Node.js is not yet supported');
            return;
        }
        this._raf = window.requestAnimationFrame(this._animateHandler);
        var now = browser();
        var fps = this.props.fps;
        var frameIntervalMS = 1000 / fps;
        var deltaTimeMS = now - this._lastTime;
        var duration = this.props.duration;
        var hasDuration = typeof duration === 'number' && isFinite(duration);
        var isNewFrame = true;
        var playbackRate = this.settings.playbackRate;
        if (playbackRate === 'fixed') {
            deltaTimeMS = frameIntervalMS;
        } else if (playbackRate === 'throttle') {
            if (deltaTimeMS > frameIntervalMS) {
                now = now - deltaTimeMS % frameIntervalMS;
                this._lastTime = now;
            } else {
                isNewFrame = false;
            }
        } else {
            this._lastTime = now;
        }
        var deltaTime = deltaTimeMS / 1000;
        var newTime = this.props.time + deltaTime * this.props.timeScale;
        if (newTime < 0 && hasDuration) {
            newTime = duration + newTime;
        }
        var isFinished = false;
        var isLoopStart = false;
        var looping = this.settings.loop !== false;
        if (hasDuration && newTime >= duration) {
            if (looping) {
                isNewFrame = true;
                newTime = newTime % duration;
                isLoopStart = true;
            } else {
                isNewFrame = false;
                newTime = duration;
                isFinished = true;
            }
            this._signalEnd();
        }
        if (isNewFrame) {
            this.props.deltaTime = deltaTime;
            this.props.time = newTime;
            this.props.playhead = this._computePlayhead(newTime, duration);
            var lastFrame = this.props.frame;
            this.props.frame = this._computeCurrentFrame();
            if (isLoopStart) 
                { this._signalBegin(); }
            if (lastFrame !== this.props.frame) 
                { this.tick(); }
            this.render();
            this.props.deltaTime = 0;
        }
        if (isFinished) {
            this.pause();
        }
    };
    SketchManager.prototype.dispatch = function dispatch (cb) {
        if (typeof cb !== 'function') 
            { throw new Error('must pass function into dispatch()'); }
        cb(this.props);
        this.render();
    };
    SketchManager.prototype.mount = function mount () {
        this._appendCanvasIfNeeded();
    };
    SketchManager.prototype.unmount = function unmount () {
        if (isBrowser()) {
            window.removeEventListener('resize', this._resizeHandler);
            this._keyboardShortcuts.detach();
        }
        if (this.props.canvas.parentElement) {
            this.props.canvas.parentElement.removeChild(this.props.canvas);
        }
    };
    SketchManager.prototype._appendCanvasIfNeeded = function _appendCanvasIfNeeded () {
        if (!isBrowser()) 
            { return; }
        if (this.settings.parent !== false && (this.props.canvas && !this.props.canvas.parentElement)) {
            var defaultParent = this.settings.parent || document.body;
            defaultParent.appendChild(this.props.canvas);
        }
    };
    SketchManager.prototype._setupGLKey = function _setupGLKey () {
        if (this.props.context) {
            if (isWebGLContext(this.props.context)) {
                this._props.gl = this.props.context;
            } else {
                delete this._props.gl;
            }
        }
    };
    SketchManager.prototype.getTimeProps = function getTimeProps (settings) {
            if ( settings === void 0 ) settings = {};

        var duration = settings.duration;
        var totalFrames = settings.totalFrames;
        var timeScale = defined(settings.timeScale, 1);
        var fps = defined(settings.fps, 24);
        var hasDuration = typeof duration === 'number' && isFinite(duration);
        var hasTotalFrames = typeof totalFrames === 'number' && isFinite(totalFrames);
        var totalFramesFromDuration = hasDuration ? Math.floor(fps * duration) : undefined;
        var durationFromTotalFrames = hasTotalFrames ? totalFrames / fps : undefined;
        if (hasDuration && hasTotalFrames && totalFramesFromDuration !== totalFrames) {
            throw new Error('You should specify either duration or totalFrames, but not both. Or, they must match exactly.');
        }
        if (typeof settings.dimensions === 'undefined' && typeof settings.units !== 'undefined') {
            console.warn("You've specified a { units } setting but no { dimension }, so the units will be ignored.");
        }
        totalFrames = defined(totalFrames, totalFramesFromDuration, Infinity);
        duration = defined(duration, durationFromTotalFrames, Infinity);
        var startTime = settings.time;
        var startFrame = settings.frame;
        var hasStartTime = typeof startTime === 'number' && isFinite(startTime);
        var hasStartFrame = typeof startFrame === 'number' && isFinite(startFrame);
        var time = 0;
        var frame = 0;
        var playhead = 0;
        if (hasStartTime && hasStartFrame) {
            throw new Error('You should specify either start frame or time, but not both.');
        } else if (hasStartTime) {
            time = startTime;
            playhead = this._computePlayhead(time, duration);
            frame = this._computeFrame(playhead, time, totalFrames, fps);
        } else if (hasStartFrame) {
            frame = startFrame;
            time = frame / fps;
            playhead = this._computePlayhead(time, duration);
        }
        return {
            playhead: playhead,
            time: time,
            frame: frame,
            duration: duration,
            totalFrames: totalFrames,
            fps: fps,
            timeScale: timeScale
        };
    };
    SketchManager.prototype.setup = function setup (settings) {
            var this$1 = this;
            if ( settings === void 0 ) settings = {};

        if (this.sketch) 
            { throw new Error('Multiple setup() calls not yet supported.'); }
        this._settings = Object.assign({}, settings, this._settings);
        checkSettings(this._settings);
        var ref = createCanvas(this._settings);
            var context = ref.context;
            var canvas = ref.canvas;
        var timeProps = this.getTimeProps(this._settings);
        this._props = Object.assign({}, timeProps,
            {canvas: canvas,
            context: context,
            deltaTime: 0,
            started: false,
            exporting: false,
            playing: false,
            recording: false,
            settings: this.settings,
            data: this.settings.data,
            render: function () { return this$1.render(); },
            togglePlay: function () { return this$1.togglePlay(); },
            dispatch: function (cb) { return this$1.dispatch(cb); },
            tick: function () { return this$1.tick(); },
            resize: function () { return this$1.resize(); },
            update: function (opt) { return this$1.update(opt); },
            exportFrame: function (opt) { return this$1.exportFrame(opt); },
            record: function () { return this$1.record(); },
            play: function () { return this$1.play(); },
            pause: function () { return this$1.pause(); },
            stop: function () { return this$1.stop(); }});
        this._setupGLKey();
        this.resize();
    };
    SketchManager.prototype.loadAndRun = function loadAndRun (canvasSketch, newSettings) {
            var this$1 = this;

        return this.load(canvasSketch, newSettings).then(function () {
            this$1.run();
            return this$1;
        });
    };
    SketchManager.prototype.unload = function unload () {
            var this$1 = this;

        this.pause();
        if (!this.sketch) 
            { return; }
        if (typeof this.sketch.unload === 'function') {
            this._wrapContextScale(function (props) { return this$1.sketch.unload(props); });
        }
        this._sketch = null;
    };
    SketchManager.prototype.destroy = function destroy () {
        this.unload();
        this.unmount();
    };
    SketchManager.prototype.load = function load (createSketch, newSettings) {
            var this$1 = this;

        if (typeof createSketch !== 'function') {
            throw new Error('The function must take in a function as the first parameter. Example:\n  canvasSketcher(() => { ... }, settings)');
        }
        if (this.sketch) {
            this.unload();
        }
        if (typeof newSettings !== 'undefined') {
            this.update(newSettings);
        }
        this._preRender();
        var preload = Promise.resolve();
        if (this.settings.p5) {
            if (!isBrowser()) {
                throw new Error('[canvas-sketch] ERROR: Using p5.js in Node.js is not supported');
            }
            preload = new Promise(function (resolve) {
                var P5Constructor = this$1.settings.p5;
                var preload;
                if (P5Constructor.p5) {
                    preload = P5Constructor.preload;
                    P5Constructor = P5Constructor.p5;
                }
                var p5Sketch = function (p5) {
                    if (preload) 
                        { p5.preload = (function () { return preload(p5); }); }
                    p5.setup = (function () {
                        var props = this$1.props;
                        var isGL = this$1.settings.context === 'webgl';
                        var renderer = isGL ? p5.WEBGL : p5.P2D;
                        p5.noLoop();
                        p5.pixelDensity(props.pixelRatio);
                        p5.createCanvas(props.viewportWidth, props.viewportHeight, renderer);
                        if (isGL && this$1.settings.attributes) {
                            p5.setAttributes(this$1.settings.attributes);
                        }
                        this$1.update({
                            p5: p5,
                            canvas: p5.canvas,
                            context: p5._renderer.drawingContext
                        });
                        resolve();
                    });
                };
                if (typeof P5Constructor === 'function') {
                    new P5Constructor(p5Sketch);
                } else {
                    if (typeof window.createCanvas !== 'function') {
                        throw new Error("{ p5 } setting is passed but can't find p5.js in global (window) scope. Maybe you did not create it globally?\nnew p5(); // <-- attaches to global scope");
                    }
                    p5Sketch(window);
                }
            });
        }
        return preload.then(function () {
            var loader = createSketch(this$1.props);
            if (!isPromise_1(loader)) {
                loader = Promise.resolve(loader);
            }
            return loader;
        }).then(function (sketch) {
            if (!sketch) 
                { sketch = {}; }
            this$1._sketch = sketch;
            if (isBrowser()) {
                this$1._keyboardShortcuts.attach();
                window.addEventListener('resize', this$1._resizeHandler);
            }
            this$1._postRender();
            this$1._sizeChanged();
            return this$1;
        }).catch(function (err) {
            console.warn('Could not start sketch, the async loading function rejected with an error:\n    Error: ' + err.message);
            throw err;
        });
    };

    Object.defineProperties( SketchManager.prototype, prototypeAccessors );

    var CACHE = 'hot-id-cache';
    var runtimeCollisions = [];
    function isHotReload() {
        var client = getClientAPI();
        return client && client.hot;
    }

    function cacheGet(id) {
        var client = getClientAPI();
        if (!client) 
            { return undefined; }
        client[CACHE] = client[CACHE] || {};
        return client[CACHE][id];
    }

    function cachePut(id, data) {
        var client = getClientAPI();
        if (!client) 
            { return undefined; }
        client[CACHE] = client[CACHE] || {};
        client[CACHE][id] = data;
    }

    function getTimeProp(oldManager, newSettings) {
        return newSettings.animate ? {
            time: oldManager.props.time
        } : undefined;
    }

    function canvasSketch(sketch, settings) {
        if ( settings === void 0 ) settings = {};

        if (settings.p5) {
            if (settings.canvas || settings.context && typeof settings.context !== 'string') {
                throw new Error("In { p5 } mode, you can't pass your own canvas or context, unless the context is a \"webgl\" or \"2d\" string");
            }
            var context = typeof settings.context === 'string' ? settings.context : false;
            settings = Object.assign({}, settings, {
                canvas: false,
                context: context
            });
        }
        var isHot = isHotReload();
        var hotID;
        if (isHot) {
            hotID = defined(settings.id, '$__DEFAULT_CANVAS_SKETCH_ID__$');
        }
        var isInjecting = isHot && typeof hotID === 'string';
        if (isInjecting && runtimeCollisions.includes(hotID)) {
            console.warn("Warning: You have multiple calls to canvasSketch() in --hot mode. You must pass unique { id } strings in settings to enable hot reload across multiple sketches. ", hotID);
            isInjecting = false;
        }
        var preload = Promise.resolve();
        if (isInjecting) {
            runtimeCollisions.push(hotID);
            var previousData = cacheGet(hotID);
            if (previousData) {
                var next = function () {
                    var newProps = getTimeProp(previousData.manager, settings);
                    previousData.manager.destroy();
                    return newProps;
                };
                preload = previousData.load.then(next).catch(next);
            }
        }
        return preload.then(function (newProps) {
            var manager = new SketchManager();
            var result;
            if (sketch) {
                settings = Object.assign({}, settings, newProps);
                manager.setup(settings);
                manager.mount();
                result = manager.loadAndRun(sketch);
            } else {
                result = Promise.resolve(manager);
            }
            if (isInjecting) {
                cachePut(hotID, {
                    load: result,
                    manager: manager
                });
            }
            return result;
        });
    }

    canvasSketch.canvasSketch = canvasSketch;
    canvasSketch.PaperSizes = paperSizes;

    return canvasSketch;

})));


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"convert-length":4}],4:[function(require,module,exports){
var defined = require('defined');
var units = [ 'mm', 'cm', 'm', 'pc', 'pt', 'in', 'ft', 'px' ];

var conversions = {
  // metric
  m: {
    system: 'metric',
    factor: 1
  },
  cm: {
    system: 'metric',
    factor: 1 / 100
  },
  mm: {
    system: 'metric',
    factor: 1 / 1000
  },
  // imperial
  pt: {
    system: 'imperial',
    factor: 1 / 72
  },
  pc: {
    system: 'imperial',
    factor: 1 / 6
  },
  in: {
    system: 'imperial',
    factor: 1
  },
  ft: {
    system: 'imperial',
    factor: 12
  }
};

const anchors = {
  metric: {
    unit: 'm',
    ratio: 1 / 0.0254
  },
  imperial: {
    unit: 'in',
    ratio: 0.0254
  }
};

function round (value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
}

function convertDistance (value, fromUnit, toUnit, opts) {
  if (typeof value !== 'number' || !isFinite(value)) throw new Error('Value must be a finite number');
  if (!fromUnit || !toUnit) throw new Error('Must specify from and to units');

  opts = opts || {};
  var pixelsPerInch = defined(opts.pixelsPerInch, 96);
  var precision = opts.precision;
  var roundPixel = opts.roundPixel !== false;

  fromUnit = fromUnit.toLowerCase();
  toUnit = toUnit.toLowerCase();

  if (units.indexOf(fromUnit) === -1) throw new Error('Invalid from unit "' + fromUnit + '", must be one of: ' + units.join(', '));
  if (units.indexOf(toUnit) === -1) throw new Error('Invalid from unit "' + toUnit + '", must be one of: ' + units.join(', '));

  if (fromUnit === toUnit) {
    // We don't need to convert from A to B since they are the same already
    return value;
  }

  var toFactor = 1;
  var fromFactor = 1;
  var isToPixel = false;

  if (fromUnit === 'px') {
    fromFactor = 1 / pixelsPerInch;
    fromUnit = 'in';
  }
  if (toUnit === 'px') {
    isToPixel = true;
    toFactor = pixelsPerInch;
    toUnit = 'in';
  }

  var fromUnitData = conversions[fromUnit];
  var toUnitData = conversions[toUnit];

  // source to anchor inside source's system
  var anchor = value * fromUnitData.factor * fromFactor;

  // if systems differ, convert one to another
  if (fromUnitData.system !== toUnitData.system) {
    // regular 'm' to 'in' and so forth
    anchor *= anchors[fromUnitData.system].ratio;
  }

  var result = anchor / toUnitData.factor * toFactor;
  if (isToPixel && roundPixel) {
    result = Math.round(result);
  } else if (typeof precision === 'number' && isFinite(precision)) {
    result = round(result, precision);
  }
  return result;
}

module.exports = convertDistance;
module.exports.units = units;

},{"defined":5}],5:[function(require,module,exports){
module.exports = function () {
    for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) return arguments[i];
    }
};

},{}],6:[function(require,module,exports){
(function (global){
'use strict';

var width = 256;// each RC4 output is 0 <= x < 256
var chunks = 6;// at least six RC4 outputs for each double
var digits = 52;// there are 52 significant digits in a double
var pool = [];// pool: entropy pool starts empty
var GLOBAL = typeof global === 'undefined' ? window : global;

//
// The following constants are related to IEEE 754 limits.
//
var startdenom = Math.pow(width, chunks),
    significance = Math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1;


var oldRandom = Math.random;

//
// seedrandom()
// This is the seedrandom function described above.
//
module.exports = function(seed, options) {
  if (options && options.global === true) {
    options.global = false;
    Math.random = module.exports(seed, options);
    options.global = true;
    return Math.random;
  }
  var use_entropy = (options && options.entropy) || false;
  var key = [];

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    use_entropy ? [seed, tostring(pool)] :
    0 in arguments ? seed : autoseed(), 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  return function() {         // Closure to return a random double:
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer Math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };
};

module.exports.resetGlobal = function () {
  Math.random = oldRandom;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability discard an initial batch of values.
    // See http://www.rsa.com/rsalabs/node.asp?id=2009
  })(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj)[0], prop;
  if (depth && typ == 'o') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 's' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto if available.
//
/** @param {Uint8Array=} seed */
function autoseed(seed) {
  try {
    GLOBAL.crypto.getRandomValues(seed = new Uint8Array(width));
    return tostring(seed);
  } catch (e) {
    return [+new Date, GLOBAL, GLOBAL.navigator && GLOBAL.navigator.plugins,
            GLOBAL.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call Math.random on its own again after
// initialization.
//
mixkey(Math.random(), pool);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],7:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.


 Copyright (c) 2018 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
(function() {
  'use strict';

  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

  function SimplexNoise(randomOrSeed) {
    var random;
    if (typeof randomOrSeed == 'function') {
      random = randomOrSeed;
    }
    else if (randomOrSeed) {
      random = alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.p = buildPermutationTable(random);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }

  }
  SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
      -1, 1, 0,
      1, -1, 0,

      -1, -1, 0,
      1, 0, 1,
      -1, 0, 1,

      1, 0, -1,
      -1, 0, -1,
      0, 1, 1,

      0, -1, 1,
      0, 1, -1,
      0, -1, -1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
      0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
      1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
      -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
      1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
      -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
      1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
      -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]),
    noise2D: function(xin, yin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0 = 0; // Noise contributions from the three corners
      var n1 = 0;
      var n2 = 0;
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin) * F2; // Hairy factor for 2D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t; // Unskew the cell origin back to (x,y) space
      var Y0 = j - t;
      var x0 = xin - X0; // The x,y distances from the cell origin
      var y0 = yin - Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0;
        j1 = 1;
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        var gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function(xin, yin, zin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var k = Math.floor(zin + s);
      var t = (i + j + k) * G3;
      var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j - t;
      var Z0 = k - t;
      var x0 = xin - X0; // The x,y,z distances from the cell origin
      var y0 = yin - Y0;
      var z0 = zin - Z0;
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // X Z Y order
        else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // Z X Y order
      }
      else { // x0<y0
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Y Z X order
        else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // Y X Z order
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0 * G3;
      var z2 = z0 - k2 + 2.0 * G3;
      var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0 * G3;
      var z3 = z0 - 1.0 + 3.0 * G3;
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function(x, y, z, w) {
      var perm = this.perm;
      var grad4 = this.grad4;

      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = Math.floor(x + s);
      var j = Math.floor(y + s);
      var k = Math.floor(z + s);
      var l = Math.floor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // Six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to rank the numbers.
      var rankx = 0;
      var ranky = 0;
      var rankz = 0;
      var rankw = 0;
      if (x0 > y0) rankx++;
      else ranky++;
      if (x0 > z0) rankx++;
      else rankz++;
      if (x0 > w0) rankx++;
      else rankw++;
      if (y0 > z0) ranky++;
      else rankz++;
      if (y0 > w0) ranky++;
      else rankw++;
      if (z0 > w0) rankz++;
      else rankw++;
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      // Rank 3 denotes the largest coordinate.
      i1 = rankx >= 3 ? 1 : 0;
      j1 = ranky >= 3 ? 1 : 0;
      k1 = rankz >= 3 ? 1 : 0;
      l1 = rankw >= 3 ? 1 : 0;
      // Rank 2 denotes the second largest coordinate.
      i2 = rankx >= 2 ? 1 : 0;
      j2 = ranky >= 2 ? 1 : 0;
      k2 = rankz >= 2 ? 1 : 0;
      l2 = rankw >= 2 ? 1 : 0;
      // Rank 1 denotes the second smallest coordinate.
      i3 = rankx >= 1 ? 1 : 0;
      j3 = ranky >= 1 ? 1 : 0;
      k3 = rankz >= 1 ? 1 : 0;
      l3 = rankw >= 1 ? 1 : 0;
      // The fifth corner has all coordinate offsets = 1, so no need to compute that.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0 * G4;
      var z2 = z0 - k2 + 2.0 * G4;
      var w2 = w0 - l2 + 2.0 * G4;
      var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0 * G4;
      var z3 = z0 - k3 + 3.0 * G4;
      var w3 = w0 - l3 + 3.0 * G4;
      var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0 * G4;
      var z4 = z0 - 1.0 + 4.0 * G4;
      var w4 = w0 - 1.0 + 4.0 * G4;
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
        t1 *= t1;
        n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
        t2 *= t2;
        n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
        t3 *= t3;
        n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
      }
      var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
      if (t4 < 0) n4 = 0.0;
      else {
        var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
        t4 *= t4;
        n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
  };

  function buildPermutationTable(random) {
    var i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (i = 0; i < 255; i++) {
      var r = i + ~~(random() * (256 - i));
      var aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    return p;
  }
  SimplexNoise._buildPermutationTable = buildPermutationTable;

  function alea() {
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
  }
  function masher() {
    var n = 0xefc8249d;
    return function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }

  // amd
  if (typeof define !== 'undefined' && define.amd) define(function() {return SimplexNoise;});
  // common js
  if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
  // browser
  else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
  // nodejs
  if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
  }

})();

},{}],8:[function(require,module,exports){
const canvasSketch = require('canvas-sketch');
const { lerp } = require('canvas-sketch-util/math');
const random = require('canvas-sketch-util/random');

const settings = {
  dimensions: [ 2048, 2048 ]
};

const sketch = () => {
  const createGrid = ()=>{
    const points = [];
    const count = 40;

    for(let x=0;x<count;x++){
      for(let y=0;y<count;y++){
        const u = count<=1?0.5:x/(count-1);
        const v = count<=1?0.5:y/(count-1);
        
        points.push([u,v]);
      }
    }

    return points;
  }
  
  //random.setSeed(512);
  const points = createGrid().filter(() => random.value() > 0.6);
  const margin = 300;
  console.log(points);

  return ({ context, width, height }) => {
    context.fillStyle='#283148';
    context.fillRect(0, 0 , width, height);

    points.map(([u,v])=>{
        const x = lerp(margin, width - margin, u);
        const y = lerp(margin, height - margin, v);

        context.beginPath();
        context.arc(x, y, 10, Math.PI*2, false);
        
        context.fillStyle = '#913535';
        context.lineWidth = 10;
        context.fill();
    })
  };
};

canvasSketch(sketch, settings);

},{"canvas-sketch":3,"canvas-sketch-util/math":1,"canvas-sketch-util/random":2}],9:[function(require,module,exports){
(function (global){

global.CANVAS_SKETCH_DEFAULT_STORAGE_KEY = window.location.href;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}]},{},[8,9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gtY2xpL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC11dGlsL21hdGguanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC11dGlsL3JhbmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbm9kZV9tb2R1bGVzL2RlZmluZWQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9ub2RlX21vZHVsZXMvcmlnaHQtbm93L2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9pcy1wcm9taXNlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9ub2RlX21vZHVsZXMvaXMtZG9tL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9saWIvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbm9kZV9tb2R1bGVzL2RlZXAtZXF1YWwvbGliL2tleXMuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2xpYi9pc19hcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9kZWVwLWVxdWFsL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9ub2RlX21vZHVsZXMvZGF0ZWZvcm1hdC9saWIvZGF0ZWZvcm1hdC5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbm9kZV9tb2R1bGVzL3JlcGVhdC1zdHJpbmcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9wYWQtbGVmdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbGliL3NhdmUuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2xpYi9hY2Nlc3NpYmlsaXR5LmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9saWIvY29yZS9rZXlib2FyZFNob3J0Y3V0cy5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbGliL3BhcGVyLXNpemVzLmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9saWIvZGlzdGFuY2VzLmpzIiwibm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvZGlzdC9ub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9saWIvY29yZS9yZXNpemVDYW52YXMuanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL25vZGVfbW9kdWxlcy9nZXQtY2FudmFzLWNvbnRleHQvaW5kZXguanMiLCJub2RlX21vZHVsZXMvY2FudmFzLXNrZXRjaC9kaXN0L25vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2xpYi9jb3JlL2NyZWF0ZUNhbnZhcy5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbGliL2NvcmUvU2tldGNoTWFuYWdlci5qcyIsIm5vZGVfbW9kdWxlcy9jYW52YXMtc2tldGNoL2Rpc3Qvbm9kZV9tb2R1bGVzL2NhbnZhcy1za2V0Y2gvbGliL2NhbnZhcy1za2V0Y2guanMiLCJub2RlX21vZHVsZXMvY29udmVydC1sZW5ndGgvY29udmVydC1sZW5ndGguanMiLCJub2RlX21vZHVsZXMvZGVmaW5lZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zZWVkLXJhbmRvbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zaW1wbGV4LW5vaXNlL3NpbXBsZXgtbm9pc2UuanMiLCJza2V0Y2guanMiLCJjYW52YXMtc2tldGNoLWNsaS9pbmplY3RlZC9zdG9yYWdlLWtleS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztJQ3hVQSxXQUFjLEdBQUcsWUFBWTtRQUN6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN2QyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUUsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdkQ7S0FDSixDQUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzdLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDemRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ2pEQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgZGVmaW5lZCA9IHJlcXVpcmUoJ2RlZmluZWQnKTtcbnZhciBFUFNJTE9OID0gTnVtYmVyLkVQU0lMT047XG5cbmZ1bmN0aW9uIGNsYW1wICh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgcmV0dXJuIG1pbiA8IG1heFxuICAgID8gKHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZSlcbiAgICA6ICh2YWx1ZSA8IG1heCA/IG1heCA6IHZhbHVlID4gbWluID8gbWluIDogdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBjbGFtcDAxICh2KSB7XG4gIHJldHVybiBjbGFtcCh2LCAwLCAxKTtcbn1cblxuZnVuY3Rpb24gbGVycCAobWluLCBtYXgsIHQpIHtcbiAgcmV0dXJuIG1pbiAqICgxIC0gdCkgKyBtYXggKiB0O1xufVxuXG5mdW5jdGlvbiBpbnZlcnNlTGVycCAobWluLCBtYXgsIHQpIHtcbiAgaWYgKE1hdGguYWJzKG1pbiAtIG1heCkgPCBFUFNJTE9OKSByZXR1cm4gMDtcbiAgZWxzZSByZXR1cm4gKHQgLSBtaW4pIC8gKG1heCAtIG1pbik7XG59XG5cbmZ1bmN0aW9uIHNtb290aHN0ZXAgKG1pbiwgbWF4LCB0KSB7XG4gIHZhciB4ID0gY2xhbXAoaW52ZXJzZUxlcnAobWluLCBtYXgsIHQpLCAwLCAxKTtcbiAgcmV0dXJuIHggKiB4ICogKDMgLSAyICogeCk7XG59XG5cbmZ1bmN0aW9uIHRvRmluaXRlIChuLCBkZWZhdWx0VmFsdWUpIHtcbiAgZGVmYXVsdFZhbHVlID0gZGVmaW5lZChkZWZhdWx0VmFsdWUsIDApO1xuICByZXR1cm4gdHlwZW9mIG4gPT09ICdudW1iZXInICYmIGlzRmluaXRlKG4pID8gbiA6IGRlZmF1bHRWYWx1ZTtcbn1cblxuZnVuY3Rpb24gZXhwYW5kVmVjdG9yIChkaW1zKSB7XG4gIGlmICh0eXBlb2YgZGltcyAhPT0gJ251bWJlcicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGRpbXMgYXJndW1lbnQnKTtcbiAgcmV0dXJuIGZ1bmN0aW9uIChwLCBkZWZhdWx0VmFsdWUpIHtcbiAgICBkZWZhdWx0VmFsdWUgPSBkZWZpbmVkKGRlZmF1bHRWYWx1ZSwgMCk7XG4gICAgdmFyIHNjYWxhcjtcbiAgICBpZiAocCA9PSBudWxsKSB7XG4gICAgICAvLyBObyB2ZWN0b3IsIGNyZWF0ZSBhIGRlZmF1bHQgb25lXG4gICAgICBzY2FsYXIgPSBkZWZhdWx0VmFsdWU7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgcCA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUocCkpIHtcbiAgICAgIC8vIEV4cGFuZCBzaW5nbGUgY2hhbm5lbCB0byBtdWx0aXBsZSB2ZWN0b3JcbiAgICAgIHNjYWxhciA9IHA7XG4gICAgfVxuXG4gICAgdmFyIG91dCA9IFtdO1xuICAgIHZhciBpO1xuICAgIGlmIChzY2FsYXIgPT0gbnVsbCkge1xuICAgICAgZm9yIChpID0gMDsgaSA8IGRpbXM7IGkrKykge1xuICAgICAgICBvdXRbaV0gPSB0b0Zpbml0ZShwW2ldLCBkZWZhdWx0VmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZGltczsgaSsrKSB7XG4gICAgICAgIG91dFtpXSA9IHNjYWxhcjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfTtcbn1cblxuZnVuY3Rpb24gbGVycEFycmF5IChtaW4sIG1heCwgdCwgb3V0KSB7XG4gIG91dCA9IG91dCB8fCBbXTtcbiAgaWYgKG1pbi5sZW5ndGggIT09IG1heC5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtaW4gYW5kIG1heCBhcnJheSBhcmUgZXhwZWN0ZWQgdG8gaGF2ZSB0aGUgc2FtZSBsZW5ndGgnKTtcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1pbi5sZW5ndGg7IGkrKykge1xuICAgIG91dFtpXSA9IGxlcnAobWluW2ldLCBtYXhbaV0sIHQpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG5ld0FycmF5IChuLCBpbml0aWFsVmFsdWUpIHtcbiAgbiA9IGRlZmluZWQobiwgMCk7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIG4gYXJndW1lbnQgdG8gYmUgYSBudW1iZXInKTtcbiAgdmFyIG91dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykgb3V0LnB1c2goaW5pdGlhbFZhbHVlKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gbGluc3BhY2UgKG4sIG9wdHMpIHtcbiAgbiA9IGRlZmluZWQobiwgMCk7XG4gIGlmICh0eXBlb2YgbiAhPT0gJ251bWJlcicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIG4gYXJndW1lbnQgdG8gYmUgYSBudW1iZXInKTtcbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgb3B0cyA9IHsgZW5kcG9pbnQ6IHRydWUgfTtcbiAgfVxuICB2YXIgb2Zmc2V0ID0gZGVmaW5lZChvcHRzLm9mZnNldCwgMCk7XG4gIGlmIChvcHRzLmVuZHBvaW50KSB7XG4gICAgcmV0dXJuIG5ld0FycmF5KG4pLm1hcChmdW5jdGlvbiAoXywgaSkge1xuICAgICAgcmV0dXJuIG4gPD0gMSA/IDAgOiAoKGkgKyBvZmZzZXQpIC8gKG4gLSAxKSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ld0FycmF5KG4pLm1hcChmdW5jdGlvbiAoXywgaSkge1xuICAgICAgcmV0dXJuIChpICsgb2Zmc2V0KSAvIG47XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbGVycEZyYW1lcyAodmFsdWVzLCB0LCBvdXQpIHtcbiAgdCA9IGNsYW1wKHQsIDAsIDEpO1xuXG4gIHZhciBsZW4gPSB2YWx1ZXMubGVuZ3RoIC0gMTtcbiAgdmFyIHdob2xlID0gdCAqIGxlbjtcbiAgdmFyIGZyYW1lID0gTWF0aC5mbG9vcih3aG9sZSk7XG4gIHZhciBmcmFjdCA9IHdob2xlIC0gZnJhbWU7XG5cbiAgdmFyIG5leHRGcmFtZSA9IE1hdGgubWluKGZyYW1lICsgMSwgbGVuKTtcbiAgdmFyIGEgPSB2YWx1ZXNbZnJhbWUgJSB2YWx1ZXMubGVuZ3RoXTtcbiAgdmFyIGIgPSB2YWx1ZXNbbmV4dEZyYW1lICUgdmFsdWVzLmxlbmd0aF07XG4gIGlmICh0eXBlb2YgYSA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGIgPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIGxlcnAoYSwgYiwgZnJhY3QpO1xuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYSkgJiYgQXJyYXkuaXNBcnJheShiKSkge1xuICAgIHJldHVybiBsZXJwQXJyYXkoYSwgYiwgZnJhY3QsIG91dCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignTWlzbWF0Y2ggaW4gdmFsdWUgdHlwZSBvZiB0d28gYXJyYXkgZWxlbWVudHM6ICcgKyBmcmFtZSArICcgYW5kICcgKyBuZXh0RnJhbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1vZCAoYSwgYikge1xuICByZXR1cm4gKChhICUgYikgKyBiKSAlIGI7XG59XG5cbmZ1bmN0aW9uIGRlZ1RvUmFkIChuKSB7XG4gIHJldHVybiBuICogTWF0aC5QSSAvIDE4MDtcbn1cblxuZnVuY3Rpb24gcmFkVG9EZWcgKG4pIHtcbiAgcmV0dXJuIG4gKiAxODAgLyBNYXRoLlBJO1xufVxuXG5mdW5jdGlvbiBmcmFjdCAobikge1xuICByZXR1cm4gbiAtIE1hdGguZmxvb3Iobik7XG59XG5cbmZ1bmN0aW9uIHNpZ24gKG4pIHtcbiAgaWYgKG4gPiAwKSByZXR1cm4gMTtcbiAgZWxzZSBpZiAobiA8IDApIHJldHVybiAtMTtcbiAgZWxzZSByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gd3JhcCAodmFsdWUsIGZyb20sIHRvKSB7XG4gIGlmICh0eXBlb2YgZnJvbSAhPT0gJ251bWJlcicgfHwgdHlwZW9mIHRvICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ011c3Qgc3BlY2lmeSBcInRvXCIgYW5kIFwiZnJvbVwiIGFyZ3VtZW50cyBhcyBudW1iZXJzJyk7XG4gIH1cbiAgLy8gYWxnb3JpdGhtIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTg1MjYyOC81OTk4ODRcbiAgaWYgKGZyb20gPiB0bykge1xuICAgIHZhciB0ID0gZnJvbTtcbiAgICBmcm9tID0gdG87XG4gICAgdG8gPSB0O1xuICB9XG4gIHZhciBjeWNsZSA9IHRvIC0gZnJvbTtcbiAgaWYgKGN5Y2xlID09PSAwKSB7XG4gICAgcmV0dXJuIHRvO1xuICB9XG4gIHJldHVybiB2YWx1ZSAtIGN5Y2xlICogTWF0aC5mbG9vcigodmFsdWUgLSBmcm9tKSAvIGN5Y2xlKTtcbn1cblxuLy8gU3BlY2lmaWMgZnVuY3Rpb24gZnJvbSBVbml0eSAvIG9mTWF0aCwgbm90IHN1cmUgaXRzIG5lZWRlZD9cbi8vIGZ1bmN0aW9uIGxlcnBXcmFwIChhLCBiLCB0LCBtaW4sIG1heCkge1xuLy8gICByZXR1cm4gd3JhcChhICsgd3JhcChiIC0gYSwgbWluLCBtYXgpICogdCwgbWluLCBtYXgpXG4vLyB9XG5cbmZ1bmN0aW9uIHBpbmdQb25nICh0LCBsZW5ndGgpIHtcbiAgdCA9IG1vZCh0LCBsZW5ndGggKiAyKTtcbiAgcmV0dXJuIGxlbmd0aCAtIE1hdGguYWJzKHQgLSBsZW5ndGgpO1xufVxuXG5mdW5jdGlvbiBkYW1wIChhLCBiLCBsYW1iZGEsIGR0KSB7XG4gIHJldHVybiBsZXJwKGEsIGIsIDEgLSBNYXRoLmV4cCgtbGFtYmRhICogZHQpKTtcbn1cblxuZnVuY3Rpb24gZGFtcEFycmF5IChhLCBiLCBsYW1iZGEsIGR0LCBvdXQpIHtcbiAgb3V0ID0gb3V0IHx8IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICBvdXRbaV0gPSBkYW1wKGFbaV0sIGJbaV0sIGxhbWJkYSwgZHQpO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIG1hcFJhbmdlICh2YWx1ZSwgaW5wdXRNaW4sIGlucHV0TWF4LCBvdXRwdXRNaW4sIG91dHB1dE1heCwgY2xhbXApIHtcbiAgLy8gUmVmZXJlbmNlOlxuICAvLyBodHRwczovL29wZW5mcmFtZXdvcmtzLmNjL2RvY3VtZW50YXRpb24vbWF0aC9vZk1hdGgvXG4gIGlmIChNYXRoLmFicyhpbnB1dE1pbiAtIGlucHV0TWF4KSA8IEVQU0lMT04pIHtcbiAgICByZXR1cm4gb3V0cHV0TWluO1xuICB9IGVsc2Uge1xuICAgIHZhciBvdXRWYWwgPSAoKHZhbHVlIC0gaW5wdXRNaW4pIC8gKGlucHV0TWF4IC0gaW5wdXRNaW4pICogKG91dHB1dE1heCAtIG91dHB1dE1pbikgKyBvdXRwdXRNaW4pO1xuICAgIGlmIChjbGFtcCkge1xuICAgICAgaWYgKG91dHB1dE1heCA8IG91dHB1dE1pbikge1xuICAgICAgICBpZiAob3V0VmFsIDwgb3V0cHV0TWF4KSBvdXRWYWwgPSBvdXRwdXRNYXg7XG4gICAgICAgIGVsc2UgaWYgKG91dFZhbCA+IG91dHB1dE1pbikgb3V0VmFsID0gb3V0cHV0TWluO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG91dFZhbCA+IG91dHB1dE1heCkgb3V0VmFsID0gb3V0cHV0TWF4O1xuICAgICAgICBlbHNlIGlmIChvdXRWYWwgPCBvdXRwdXRNaW4pIG91dFZhbCA9IG91dHB1dE1pbjtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dFZhbDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbW9kOiBtb2QsXG4gIGZyYWN0OiBmcmFjdCxcbiAgc2lnbjogc2lnbixcbiAgZGVnVG9SYWQ6IGRlZ1RvUmFkLFxuICByYWRUb0RlZzogcmFkVG9EZWcsXG4gIHdyYXA6IHdyYXAsXG4gIHBpbmdQb25nOiBwaW5nUG9uZyxcbiAgbGluc3BhY2U6IGxpbnNwYWNlLFxuICBsZXJwOiBsZXJwLFxuICBsZXJwQXJyYXk6IGxlcnBBcnJheSxcbiAgaW52ZXJzZUxlcnA6IGludmVyc2VMZXJwLFxuICBsZXJwRnJhbWVzOiBsZXJwRnJhbWVzLFxuICBjbGFtcDogY2xhbXAsXG4gIGNsYW1wMDE6IGNsYW1wMDEsXG4gIHNtb290aHN0ZXA6IHNtb290aHN0ZXAsXG4gIGRhbXA6IGRhbXAsXG4gIGRhbXBBcnJheTogZGFtcEFycmF5LFxuICBtYXBSYW5nZTogbWFwUmFuZ2UsXG4gIGV4cGFuZDJEOiBleHBhbmRWZWN0b3IoMiksXG4gIGV4cGFuZDNEOiBleHBhbmRWZWN0b3IoMyksXG4gIGV4cGFuZDREOiBleHBhbmRWZWN0b3IoNClcbn07XG4iLCJ2YXIgc2VlZFJhbmRvbSA9IHJlcXVpcmUoJ3NlZWQtcmFuZG9tJyk7XG52YXIgU2ltcGxleE5vaXNlID0gcmVxdWlyZSgnc2ltcGxleC1ub2lzZScpO1xudmFyIGRlZmluZWQgPSByZXF1aXJlKCdkZWZpbmVkJyk7XG5cbmZ1bmN0aW9uIGNyZWF0ZVJhbmRvbSAoZGVmYXVsdFNlZWQpIHtcbiAgZGVmYXVsdFNlZWQgPSBkZWZpbmVkKGRlZmF1bHRTZWVkLCBudWxsKTtcbiAgdmFyIGRlZmF1bHRSYW5kb20gPSBNYXRoLnJhbmRvbTtcbiAgdmFyIGN1cnJlbnRTZWVkO1xuICB2YXIgY3VycmVudFJhbmRvbTtcbiAgdmFyIG5vaXNlR2VuZXJhdG9yO1xuICB2YXIgX25leHRHYXVzc2lhbiA9IG51bGw7XG4gIHZhciBfaGFzTmV4dEdhdXNzaWFuID0gZmFsc2U7XG5cbiAgc2V0U2VlZChkZWZhdWx0U2VlZCk7XG5cbiAgcmV0dXJuIHtcbiAgICB2YWx1ZTogdmFsdWUsXG4gICAgY3JlYXRlUmFuZG9tOiBmdW5jdGlvbiAoZGVmYXVsdFNlZWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSYW5kb20oZGVmYXVsdFNlZWQpO1xuICAgIH0sXG4gICAgc2V0U2VlZDogc2V0U2VlZCxcbiAgICBnZXRTZWVkOiBnZXRTZWVkLFxuICAgIGdldFJhbmRvbVNlZWQ6IGdldFJhbmRvbVNlZWQsXG4gICAgdmFsdWVOb25aZXJvOiB2YWx1ZU5vblplcm8sXG4gICAgcGVybXV0ZU5vaXNlOiBwZXJtdXRlTm9pc2UsXG4gICAgbm9pc2UxRDogbm9pc2UxRCxcbiAgICBub2lzZTJEOiBub2lzZTJELFxuICAgIG5vaXNlM0Q6IG5vaXNlM0QsXG4gICAgbm9pc2U0RDogbm9pc2U0RCxcbiAgICBzaWduOiBzaWduLFxuICAgIGJvb2xlYW46IGJvb2xlYW4sXG4gICAgY2hhbmNlOiBjaGFuY2UsXG4gICAgcmFuZ2U6IHJhbmdlLFxuICAgIHJhbmdlRmxvb3I6IHJhbmdlRmxvb3IsXG4gICAgcGljazogcGljayxcbiAgICBzaHVmZmxlOiBzaHVmZmxlLFxuICAgIG9uQ2lyY2xlOiBvbkNpcmNsZSxcbiAgICBpbnNpZGVDaXJjbGU6IGluc2lkZUNpcmNsZSxcbiAgICBvblNwaGVyZTogb25TcGhlcmUsXG4gICAgaW5zaWRlU3BoZXJlOiBpbnNpZGVTcGhlcmUsXG4gICAgcXVhdGVybmlvbjogcXVhdGVybmlvbixcbiAgICB3ZWlnaHRlZDogd2VpZ2h0ZWQsXG4gICAgd2VpZ2h0ZWRTZXQ6IHdlaWdodGVkU2V0LFxuICAgIHdlaWdodGVkU2V0SW5kZXg6IHdlaWdodGVkU2V0SW5kZXgsXG4gICAgZ2F1c3NpYW46IGdhdXNzaWFuXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0U2VlZCAoc2VlZCwgb3B0KSB7XG4gICAgaWYgKHR5cGVvZiBzZWVkID09PSAnbnVtYmVyJyB8fCB0eXBlb2Ygc2VlZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGN1cnJlbnRTZWVkID0gc2VlZDtcbiAgICAgIGN1cnJlbnRSYW5kb20gPSBzZWVkUmFuZG9tKGN1cnJlbnRTZWVkLCBvcHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50U2VlZCA9IHVuZGVmaW5lZDtcbiAgICAgIGN1cnJlbnRSYW5kb20gPSBkZWZhdWx0UmFuZG9tO1xuICAgIH1cbiAgICBub2lzZUdlbmVyYXRvciA9IGNyZWF0ZU5vaXNlKCk7XG4gICAgX25leHRHYXVzc2lhbiA9IG51bGw7XG4gICAgX2hhc05leHRHYXVzc2lhbiA9IGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gdmFsdWUgKCkge1xuICAgIHJldHVybiBjdXJyZW50UmFuZG9tKCk7XG4gIH1cblxuICBmdW5jdGlvbiB2YWx1ZU5vblplcm8gKCkge1xuICAgIHZhciB1ID0gMDtcbiAgICB3aGlsZSAodSA9PT0gMCkgdSA9IHZhbHVlKCk7XG4gICAgcmV0dXJuIHU7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRTZWVkICgpIHtcbiAgICByZXR1cm4gY3VycmVudFNlZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSYW5kb21TZWVkICgpIHtcbiAgICB2YXIgc2VlZCA9IFN0cmluZyhNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKSk7XG4gICAgcmV0dXJuIHNlZWQ7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVOb2lzZSAoKSB7XG4gICAgcmV0dXJuIG5ldyBTaW1wbGV4Tm9pc2UoY3VycmVudFJhbmRvbSk7XG4gIH1cblxuICBmdW5jdGlvbiBwZXJtdXRlTm9pc2UgKCkge1xuICAgIG5vaXNlR2VuZXJhdG9yID0gY3JlYXRlTm9pc2UoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vaXNlMUQgKHgsIGZyZXF1ZW5jeSwgYW1wbGl0dWRlKSB7XG4gICAgaWYgKCFpc0Zpbml0ZSh4KSkgdGhyb3cgbmV3IFR5cGVFcnJvcigneCBjb21wb25lbnQgZm9yIG5vaXNlKCkgbXVzdCBiZSBmaW5pdGUnKTtcbiAgICBmcmVxdWVuY3kgPSBkZWZpbmVkKGZyZXF1ZW5jeSwgMSk7XG4gICAgYW1wbGl0dWRlID0gZGVmaW5lZChhbXBsaXR1ZGUsIDEpO1xuICAgIHJldHVybiBhbXBsaXR1ZGUgKiBub2lzZUdlbmVyYXRvci5ub2lzZTJEKHggKiBmcmVxdWVuY3ksIDApO1xuICB9XG5cbiAgZnVuY3Rpb24gbm9pc2UyRCAoeCwgeSwgZnJlcXVlbmN5LCBhbXBsaXR1ZGUpIHtcbiAgICBpZiAoIWlzRmluaXRlKHgpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCd4IGNvbXBvbmVudCBmb3Igbm9pc2UoKSBtdXN0IGJlIGZpbml0ZScpO1xuICAgIGlmICghaXNGaW5pdGUoeSkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3kgY29tcG9uZW50IGZvciBub2lzZSgpIG11c3QgYmUgZmluaXRlJyk7XG4gICAgZnJlcXVlbmN5ID0gZGVmaW5lZChmcmVxdWVuY3ksIDEpO1xuICAgIGFtcGxpdHVkZSA9IGRlZmluZWQoYW1wbGl0dWRlLCAxKTtcbiAgICByZXR1cm4gYW1wbGl0dWRlICogbm9pc2VHZW5lcmF0b3Iubm9pc2UyRCh4ICogZnJlcXVlbmN5LCB5ICogZnJlcXVlbmN5KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vaXNlM0QgKHgsIHksIHosIGZyZXF1ZW5jeSwgYW1wbGl0dWRlKSB7XG4gICAgaWYgKCFpc0Zpbml0ZSh4KSkgdGhyb3cgbmV3IFR5cGVFcnJvcigneCBjb21wb25lbnQgZm9yIG5vaXNlKCkgbXVzdCBiZSBmaW5pdGUnKTtcbiAgICBpZiAoIWlzRmluaXRlKHkpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCd5IGNvbXBvbmVudCBmb3Igbm9pc2UoKSBtdXN0IGJlIGZpbml0ZScpO1xuICAgIGlmICghaXNGaW5pdGUoeikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ogY29tcG9uZW50IGZvciBub2lzZSgpIG11c3QgYmUgZmluaXRlJyk7XG4gICAgZnJlcXVlbmN5ID0gZGVmaW5lZChmcmVxdWVuY3ksIDEpO1xuICAgIGFtcGxpdHVkZSA9IGRlZmluZWQoYW1wbGl0dWRlLCAxKTtcbiAgICByZXR1cm4gYW1wbGl0dWRlICogbm9pc2VHZW5lcmF0b3Iubm9pc2UzRChcbiAgICAgIHggKiBmcmVxdWVuY3ksXG4gICAgICB5ICogZnJlcXVlbmN5LFxuICAgICAgeiAqIGZyZXF1ZW5jeVxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBub2lzZTREICh4LCB5LCB6LCB3LCBmcmVxdWVuY3ksIGFtcGxpdHVkZSkge1xuICAgIGlmICghaXNGaW5pdGUoeCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ggY29tcG9uZW50IGZvciBub2lzZSgpIG11c3QgYmUgZmluaXRlJyk7XG4gICAgaWYgKCFpc0Zpbml0ZSh5KSkgdGhyb3cgbmV3IFR5cGVFcnJvcigneSBjb21wb25lbnQgZm9yIG5vaXNlKCkgbXVzdCBiZSBmaW5pdGUnKTtcbiAgICBpZiAoIWlzRmluaXRlKHopKSB0aHJvdyBuZXcgVHlwZUVycm9yKCd6IGNvbXBvbmVudCBmb3Igbm9pc2UoKSBtdXN0IGJlIGZpbml0ZScpO1xuICAgIGlmICghaXNGaW5pdGUodykpIHRocm93IG5ldyBUeXBlRXJyb3IoJ3cgY29tcG9uZW50IGZvciBub2lzZSgpIG11c3QgYmUgZmluaXRlJyk7XG4gICAgZnJlcXVlbmN5ID0gZGVmaW5lZChmcmVxdWVuY3ksIDEpO1xuICAgIGFtcGxpdHVkZSA9IGRlZmluZWQoYW1wbGl0dWRlLCAxKTtcbiAgICByZXR1cm4gYW1wbGl0dWRlICogbm9pc2VHZW5lcmF0b3Iubm9pc2U0RChcbiAgICAgIHggKiBmcmVxdWVuY3ksXG4gICAgICB5ICogZnJlcXVlbmN5LFxuICAgICAgeiAqIGZyZXF1ZW5jeSxcbiAgICAgIHcgKiBmcmVxdWVuY3lcbiAgICApO1xuICB9XG5cbiAgZnVuY3Rpb24gc2lnbiAoKSB7XG4gICAgcmV0dXJuIGJvb2xlYW4oKSA/IDEgOiAtMTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGJvb2xlYW4gKCkge1xuICAgIHJldHVybiB2YWx1ZSgpID4gMC41O1xuICB9XG5cbiAgZnVuY3Rpb24gY2hhbmNlIChuKSB7XG4gICAgbiA9IGRlZmluZWQobiwgMC41KTtcbiAgICBpZiAodHlwZW9mIG4gIT09ICdudW1iZXInKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdleHBlY3RlZCBuIHRvIGJlIGEgbnVtYmVyJyk7XG4gICAgcmV0dXJuIHZhbHVlKCkgPCBuO1xuICB9XG5cbiAgZnVuY3Rpb24gcmFuZ2UgKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWluICE9PSAnbnVtYmVyJyB8fCB0eXBlb2YgbWF4ICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIGFyZ3VtZW50cyB0byBiZSBudW1iZXJzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlKCkgKiAobWF4IC0gbWluKSArIG1pbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJhbmdlRmxvb3IgKG1pbiwgbWF4KSB7XG4gICAgaWYgKG1heCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBtYXggPSBtaW47XG4gICAgICBtaW4gPSAwO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWluICE9PSAnbnVtYmVyJyB8fCB0eXBlb2YgbWF4ICE9PSAnbnVtYmVyJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIGFyZ3VtZW50cyB0byBiZSBudW1iZXJzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIE1hdGguZmxvb3IocmFuZ2UobWluLCBtYXgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBpY2sgKGFycmF5KSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICByZXR1cm4gYXJyYXlbcmFuZ2VGbG9vcigwLCBhcnJheS5sZW5ndGgpXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNodWZmbGUgKGFycikge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBBcnJheSwgZ290ICcgKyB0eXBlb2YgYXJyKTtcbiAgICB9XG5cbiAgICB2YXIgcmFuZDtcbiAgICB2YXIgdG1wO1xuICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuICAgIHZhciByZXQgPSBhcnIuc2xpY2UoKTtcbiAgICB3aGlsZSAobGVuKSB7XG4gICAgICByYW5kID0gTWF0aC5mbG9vcih2YWx1ZSgpICogbGVuLS0pO1xuICAgICAgdG1wID0gcmV0W2xlbl07XG4gICAgICByZXRbbGVuXSA9IHJldFtyYW5kXTtcbiAgICAgIHJldFtyYW5kXSA9IHRtcDtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ2lyY2xlIChyYWRpdXMsIG91dCkge1xuICAgIHJhZGl1cyA9IGRlZmluZWQocmFkaXVzLCAxKTtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIHRoZXRhID0gdmFsdWUoKSAqIDIuMCAqIE1hdGguUEk7XG4gICAgb3V0WzBdID0gcmFkaXVzICogTWF0aC5jb3ModGhldGEpO1xuICAgIG91dFsxXSA9IHJhZGl1cyAqIE1hdGguc2luKHRoZXRhKTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zaWRlQ2lyY2xlIChyYWRpdXMsIG91dCkge1xuICAgIHJhZGl1cyA9IGRlZmluZWQocmFkaXVzLCAxKTtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgb25DaXJjbGUoMSwgb3V0KTtcbiAgICB2YXIgciA9IHJhZGl1cyAqIE1hdGguc3FydCh2YWx1ZSgpKTtcbiAgICBvdXRbMF0gKj0gcjtcbiAgICBvdXRbMV0gKj0gcjtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgZnVuY3Rpb24gb25TcGhlcmUgKHJhZGl1cywgb3V0KSB7XG4gICAgcmFkaXVzID0gZGVmaW5lZChyYWRpdXMsIDEpO1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgdSA9IHZhbHVlKCkgKiBNYXRoLlBJICogMjtcbiAgICB2YXIgdiA9IHZhbHVlKCkgKiAyIC0gMTtcbiAgICB2YXIgcGhpID0gdTtcbiAgICB2YXIgdGhldGEgPSBNYXRoLmFjb3Modik7XG4gICAgb3V0WzBdID0gcmFkaXVzICogTWF0aC5zaW4odGhldGEpICogTWF0aC5jb3MocGhpKTtcbiAgICBvdXRbMV0gPSByYWRpdXMgKiBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLnNpbihwaGkpO1xuICAgIG91dFsyXSA9IHJhZGl1cyAqIE1hdGguY29zKHRoZXRhKTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgZnVuY3Rpb24gaW5zaWRlU3BoZXJlIChyYWRpdXMsIG91dCkge1xuICAgIHJhZGl1cyA9IGRlZmluZWQocmFkaXVzLCAxKTtcbiAgICBvdXQgPSBvdXQgfHwgW107XG4gICAgdmFyIHUgPSB2YWx1ZSgpICogTWF0aC5QSSAqIDI7XG4gICAgdmFyIHYgPSB2YWx1ZSgpICogMiAtIDE7XG4gICAgdmFyIGsgPSB2YWx1ZSgpO1xuXG4gICAgdmFyIHBoaSA9IHU7XG4gICAgdmFyIHRoZXRhID0gTWF0aC5hY29zKHYpO1xuICAgIHZhciByID0gcmFkaXVzICogTWF0aC5jYnJ0KGspO1xuICAgIG91dFswXSA9IHIgKiBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLmNvcyhwaGkpO1xuICAgIG91dFsxXSA9IHIgKiBNYXRoLnNpbih0aGV0YSkgKiBNYXRoLnNpbihwaGkpO1xuICAgIG91dFsyXSA9IHIgKiBNYXRoLmNvcyh0aGV0YSk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1YXRlcm5pb24gKG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgdTEgPSB2YWx1ZSgpO1xuICAgIHZhciB1MiA9IHZhbHVlKCk7XG4gICAgdmFyIHUzID0gdmFsdWUoKTtcblxuICAgIHZhciBzcTEgPSBNYXRoLnNxcnQoMSAtIHUxKTtcbiAgICB2YXIgc3EyID0gTWF0aC5zcXJ0KHUxKTtcblxuICAgIHZhciB0aGV0YTEgPSBNYXRoLlBJICogMiAqIHUyO1xuICAgIHZhciB0aGV0YTIgPSBNYXRoLlBJICogMiAqIHUzO1xuXG4gICAgdmFyIHggPSBNYXRoLnNpbih0aGV0YTEpICogc3ExO1xuICAgIHZhciB5ID0gTWF0aC5jb3ModGhldGExKSAqIHNxMTtcbiAgICB2YXIgeiA9IE1hdGguc2luKHRoZXRhMikgKiBzcTI7XG4gICAgdmFyIHcgPSBNYXRoLmNvcyh0aGV0YTIpICogc3EyO1xuICAgIG91dFswXSA9IHg7XG4gICAgb3V0WzFdID0geTtcbiAgICBvdXRbMl0gPSB6O1xuICAgIG91dFszXSA9IHc7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdlaWdodGVkU2V0IChzZXQpIHtcbiAgICBzZXQgPSBzZXQgfHwgW107XG4gICAgaWYgKHNldC5sZW5ndGggPT09IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBzZXRbd2VpZ2h0ZWRTZXRJbmRleChzZXQpXS52YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdlaWdodGVkU2V0SW5kZXggKHNldCkge1xuICAgIHNldCA9IHNldCB8fCBbXTtcbiAgICBpZiAoc2V0Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xO1xuICAgIHJldHVybiB3ZWlnaHRlZChzZXQubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICByZXR1cm4gcy53ZWlnaHQ7XG4gICAgfSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gd2VpZ2h0ZWQgKHdlaWdodHMpIHtcbiAgICB3ZWlnaHRzID0gd2VpZ2h0cyB8fCBbXTtcbiAgICBpZiAod2VpZ2h0cy5sZW5ndGggPT09IDApIHJldHVybiAtMTtcbiAgICB2YXIgdG90YWxXZWlnaHQgPSAwO1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHdlaWdodHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRvdGFsV2VpZ2h0ICs9IHdlaWdodHNbaV07XG4gICAgfVxuXG4gICAgaWYgKHRvdGFsV2VpZ2h0IDw9IDApIHRocm93IG5ldyBFcnJvcignV2VpZ2h0cyBtdXN0IHN1bSB0byA+IDAnKTtcblxuICAgIHZhciByYW5kb20gPSB2YWx1ZSgpICogdG90YWxXZWlnaHQ7XG4gICAgZm9yIChpID0gMDsgaSA8IHdlaWdodHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyYW5kb20gPCB3ZWlnaHRzW2ldKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuICAgICAgcmFuZG9tIC09IHdlaWdodHNbaV07XG4gICAgfVxuICAgIHJldHVybiAwO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2F1c3NpYW4gKG1lYW4sIHN0YW5kYXJkRGVyaXZhdGlvbikge1xuICAgIG1lYW4gPSBkZWZpbmVkKG1lYW4sIDApO1xuICAgIHN0YW5kYXJkRGVyaXZhdGlvbiA9IGRlZmluZWQoc3RhbmRhcmREZXJpdmF0aW9uLCAxKTtcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9vcGVuamRrLW1pcnJvci9qZGs3dS1qZGsvYmxvYi9mNGQ4MDk1N2U4OWExOWEyOWJiOWY5ODA3ZDJhMjgzNTFlZDdmN2RmL3NyYy9zaGFyZS9jbGFzc2VzL2phdmEvdXRpbC9SYW5kb20uamF2YSNMNDk2XG4gICAgaWYgKF9oYXNOZXh0R2F1c3NpYW4pIHtcbiAgICAgIF9oYXNOZXh0R2F1c3NpYW4gPSBmYWxzZTtcbiAgICAgIHZhciByZXN1bHQgPSBfbmV4dEdhdXNzaWFuO1xuICAgICAgX25leHRHYXVzc2lhbiA9IG51bGw7XG4gICAgICByZXR1cm4gbWVhbiArIHN0YW5kYXJkRGVyaXZhdGlvbiAqIHJlc3VsdDtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHYxID0gMDtcbiAgICAgIHZhciB2MiA9IDA7XG4gICAgICB2YXIgcyA9IDA7XG4gICAgICBkbyB7XG4gICAgICAgIHYxID0gdmFsdWUoKSAqIDIgLSAxOyAvLyBiZXR3ZWVuIC0xIGFuZCAxXG4gICAgICAgIHYyID0gdmFsdWUoKSAqIDIgLSAxOyAvLyBiZXR3ZWVuIC0xIGFuZCAxXG4gICAgICAgIHMgPSB2MSAqIHYxICsgdjIgKiB2MjtcbiAgICAgIH0gd2hpbGUgKHMgPj0gMSB8fCBzID09PSAwKTtcbiAgICAgIHZhciBtdWx0aXBsaWVyID0gTWF0aC5zcXJ0KC0yICogTWF0aC5sb2cocykgLyBzKTtcbiAgICAgIF9uZXh0R2F1c3NpYW4gPSAodjIgKiBtdWx0aXBsaWVyKTtcbiAgICAgIF9oYXNOZXh0R2F1c3NpYW4gPSB0cnVlO1xuICAgICAgcmV0dXJuIG1lYW4gKyBzdGFuZGFyZERlcml2YXRpb24gKiAodjEgKiBtdWx0aXBsaWVyKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcmVhdGVSYW5kb20oKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHNbaV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGFyZ3VtZW50c1tpXTtcbiAgICB9XG59O1xuIiwiLypcbm9iamVjdC1hc3NpZ25cbihjKSBTaW5kcmUgU29yaHVzXG5AbGljZW5zZSBNSVRcbiovXG5cbid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scztcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LXdyYXBwZXJzXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgZ2xvYmFsLnBlcmZvcm1hbmNlICYmXG4gIGdsb2JhbC5wZXJmb3JtYW5jZS5ub3cgPyBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuIHBlcmZvcm1hbmNlLm5vdygpXG4gIH0gOiBEYXRlLm5vdyB8fCBmdW5jdGlvbiBub3coKSB7XG4gICAgcmV0dXJuICtuZXcgRGF0ZVxuICB9XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGlzUHJvbWlzZTtcblxuZnVuY3Rpb24gaXNQcm9taXNlKG9iaikge1xuICByZXR1cm4gISFvYmogJiYgKHR5cGVvZiBvYmogPT09ICdvYmplY3QnIHx8IHR5cGVvZiBvYmogPT09ICdmdW5jdGlvbicpICYmIHR5cGVvZiBvYmoudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gaXNOb2RlXG5cbmZ1bmN0aW9uIGlzTm9kZSAodmFsKSB7XG4gIHJldHVybiAoIXZhbCB8fCB0eXBlb2YgdmFsICE9PSAnb2JqZWN0JylcbiAgICA/IGZhbHNlXG4gICAgOiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHdpbmRvdy5Ob2RlID09PSAnb2JqZWN0JylcbiAgICAgID8gKHZhbCBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlKVxuICAgICAgOiAodHlwZW9mIHZhbC5ub2RlVHlwZSA9PT0gJ251bWJlcicpICYmXG4gICAgICAgICh0eXBlb2YgdmFsLm5vZGVOYW1lID09PSAnc3RyaW5nJylcbn1cbiIsIi8vIFRPRE86IFdlIGNhbiByZW1vdmUgYSBodWdlIGNodW5rIG9mIGJ1bmRsZSBzaXplIGJ5IHVzaW5nIGEgc21hbGxlclxuLy8gdXRpbGl0eSBtb2R1bGUgZm9yIGNvbnZlcnRpbmcgdW5pdHMuXG5pbXBvcnQgaXNET00gZnJvbSAnaXMtZG9tJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsaWVudEFQSSAoKSB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3dbJ2NhbnZhcy1za2V0Y2gtY2xpJ107XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0Jyb3dzZXIgKCkge1xuICByZXR1cm4gdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV2ViR0xDb250ZXh0IChjdHgpIHtcbiAgcmV0dXJuIHR5cGVvZiBjdHguY2xlYXIgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGN0eC5jbGVhckNvbG9yID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBjdHguYnVmZmVyRGF0YSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ2FudmFzIChlbGVtZW50KSB7XG4gIHJldHVybiBpc0RPTShlbGVtZW50KSAmJiAvY2FudmFzL2kudGVzdChlbGVtZW50Lm5vZGVOYW1lKSAmJiB0eXBlb2YgZWxlbWVudC5nZXRDb250ZXh0ID09PSAnZnVuY3Rpb24nO1xufVxuIiwiZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gdHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nXG4gID8gT2JqZWN0LmtleXMgOiBzaGltO1xuXG5leHBvcnRzLnNoaW0gPSBzaGltO1xuZnVuY3Rpb24gc2hpbSAob2JqKSB7XG4gIHZhciBrZXlzID0gW107XG4gIGZvciAodmFyIGtleSBpbiBvYmopIGtleXMucHVzaChrZXkpO1xuICByZXR1cm4ga2V5cztcbn1cbiIsInZhciBzdXBwb3J0c0FyZ3VtZW50c0NsYXNzID0gKGZ1bmN0aW9uKCl7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJndW1lbnRzKVxufSkoKSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcblxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gc3VwcG9ydHNBcmd1bWVudHNDbGFzcyA/IHN1cHBvcnRlZCA6IHVuc3VwcG9ydGVkO1xuXG5leHBvcnRzLnN1cHBvcnRlZCA9IHN1cHBvcnRlZDtcbmZ1bmN0aW9uIHN1cHBvcnRlZChvYmplY3QpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxuZXhwb3J0cy51bnN1cHBvcnRlZCA9IHVuc3VwcG9ydGVkO1xuZnVuY3Rpb24gdW5zdXBwb3J0ZWQob2JqZWN0KXtcbiAgcmV0dXJuIG9iamVjdCAmJlxuICAgIHR5cGVvZiBvYmplY3QgPT0gJ29iamVjdCcgJiZcbiAgICB0eXBlb2Ygb2JqZWN0Lmxlbmd0aCA9PSAnbnVtYmVyJyAmJlxuICAgIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsICdjYWxsZWUnKSAmJlxuICAgICFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqZWN0LCAnY2FsbGVlJykgfHxcbiAgICBmYWxzZTtcbn07XG4iLCJ2YXIgcFNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIG9iamVjdEtleXMgPSByZXF1aXJlKCcuL2xpYi9rZXlzLmpzJyk7XG52YXIgaXNBcmd1bWVudHMgPSByZXF1aXJlKCcuL2xpYi9pc19hcmd1bWVudHMuanMnKTtcblxudmFyIGRlZXBFcXVhbCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIC8vIDcuMS4gQWxsIGlkZW50aWNhbCB2YWx1ZXMgYXJlIGVxdWl2YWxlbnQsIGFzIGRldGVybWluZWQgYnkgPT09LlxuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuXG4gIH0gZWxzZSBpZiAoYWN0dWFsIGluc3RhbmNlb2YgRGF0ZSAmJiBleHBlY3RlZCBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICByZXR1cm4gYWN0dWFsLmdldFRpbWUoKSA9PT0gZXhwZWN0ZWQuZ2V0VGltZSgpO1xuXG4gIC8vIDcuMy4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCB8fCB0eXBlb2YgYWN0dWFsICE9ICdvYmplY3QnICYmIHR5cGVvZiBleHBlY3RlZCAhPSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBvcHRzLnN0cmljdCA/IGFjdHVhbCA9PT0gZXhwZWN0ZWQgOiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy40LiBGb3IgYWxsIG90aGVyIE9iamVjdCBwYWlycywgaW5jbHVkaW5nIEFycmF5IG9iamVjdHMsIGVxdWl2YWxlbmNlIGlzXG4gIC8vIGRldGVybWluZWQgYnkgaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChhcyB2ZXJpZmllZFxuICAvLyB3aXRoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCksIHRoZSBzYW1lIHNldCBvZiBrZXlzXG4gIC8vIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLCBlcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnlcbiAgLy8gY29ycmVzcG9uZGluZyBrZXksIGFuZCBhbiBpZGVudGljYWwgJ3Byb3RvdHlwZScgcHJvcGVydHkuIE5vdGU6IHRoaXNcbiAgLy8gYWNjb3VudHMgZm9yIGJvdGggbmFtZWQgYW5kIGluZGV4ZWQgcHJvcGVydGllcyBvbiBBcnJheXMuXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIG9wdHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkT3JOdWxsKHZhbHVlKSB7XG4gIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAoeCkge1xuICBpZiAoIXggfHwgdHlwZW9mIHggIT09ICdvYmplY3QnIHx8IHR5cGVvZiB4Lmxlbmd0aCAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiB4LmNvcHkgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIHguc2xpY2UgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHgubGVuZ3RoID4gMCAmJiB0eXBlb2YgeFswXSAhPT0gJ251bWJlcicpIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIG9wdHMpIHtcbiAgdmFyIGksIGtleTtcbiAgaWYgKGlzVW5kZWZpbmVkT3JOdWxsKGEpIHx8IGlzVW5kZWZpbmVkT3JOdWxsKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vfn5+SSd2ZSBtYW5hZ2VkIHRvIGJyZWFrIE9iamVjdC5rZXlzIHRocm91Z2ggc2NyZXd5IGFyZ3VtZW50cyBwYXNzaW5nLlxuICAvLyAgIENvbnZlcnRpbmcgdG8gYXJyYXkgc29sdmVzIHRoZSBwcm9ibGVtLlxuICBpZiAoaXNBcmd1bWVudHMoYSkpIHtcbiAgICBpZiAoIWlzQXJndW1lbnRzKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIGRlZXBFcXVhbChhLCBiLCBvcHRzKTtcbiAgfVxuICBpZiAoaXNCdWZmZXIoYSkpIHtcbiAgICBpZiAoIWlzQnVmZmVyKGIpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgdHJ5IHtcbiAgICB2YXIga2EgPSBvYmplY3RLZXlzKGEpLFxuICAgICAgICBrYiA9IG9iamVjdEtleXMoYik7XG4gIH0gY2F0Y2ggKGUpIHsvL2hhcHBlbnMgd2hlbiBvbmUgaXMgYSBzdHJpbmcgbGl0ZXJhbCBhbmQgdGhlIG90aGVyIGlzbid0XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT0ga2IubGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy90aGUgc2FtZSBzZXQgb2Yga2V5cyAoYWx0aG91Z2ggbm90IG5lY2Vzc2FyaWx5IHRoZSBzYW1lIG9yZGVyKSxcbiAga2Euc29ydCgpO1xuICBrYi5zb3J0KCk7XG4gIC8vfn5+Y2hlYXAga2V5IHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoa2FbaV0gIT0ga2JbaV0pXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgLy9lcXVpdmFsZW50IHZhbHVlcyBmb3IgZXZlcnkgY29ycmVzcG9uZGluZyBrZXksIGFuZFxuICAvL35+fnBvc3NpYmx5IGV4cGVuc2l2ZSBkZWVwIHRlc3RcbiAgZm9yIChpID0ga2EubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBrZXkgPSBrYVtpXTtcbiAgICBpZiAoIWRlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgb3B0cykpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHlwZW9mIGEgPT09IHR5cGVvZiBiO1xufVxuIiwiLypcbiAqIERhdGUgRm9ybWF0IDEuMi4zXG4gKiAoYykgMjAwNy0yMDA5IFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPlxuICogTUlUIGxpY2Vuc2VcbiAqXG4gKiBJbmNsdWRlcyBlbmhhbmNlbWVudHMgYnkgU2NvdHQgVHJlbmRhIDxzY290dC50cmVuZGEubmV0PlxuICogYW5kIEtyaXMgS293YWwgPGNpeGFyLmNvbS9+a3Jpcy5rb3dhbC8+XG4gKlxuICogQWNjZXB0cyBhIGRhdGUsIGEgbWFzaywgb3IgYSBkYXRlIGFuZCBhIG1hc2suXG4gKiBSZXR1cm5zIGEgZm9ybWF0dGVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIGRhdGUuXG4gKiBUaGUgZGF0ZSBkZWZhdWx0cyB0byB0aGUgY3VycmVudCBkYXRlL3RpbWUuXG4gKiBUaGUgbWFzayBkZWZhdWx0cyB0byBkYXRlRm9ybWF0Lm1hc2tzLmRlZmF1bHQuXG4gKi9cblxuKGZ1bmN0aW9uKGdsb2JhbCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIGRhdGVGb3JtYXQgPSAoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdG9rZW4gPSAvZHsxLDR9fG17MSw0fXx5eSg/Onl5KT98KFtIaE1zVHRdKVxcMT98W0xsb1NaV05dfFwiW15cIl0qXCJ8J1teJ10qJy9nO1xuICAgICAgdmFyIHRpbWV6b25lID0gL1xcYig/OltQTUNFQV1bU0RQXVR8KD86UGFjaWZpY3xNb3VudGFpbnxDZW50cmFsfEVhc3Rlcm58QXRsYW50aWMpICg/OlN0YW5kYXJkfERheWxpZ2h0fFByZXZhaWxpbmcpIFRpbWV8KD86R01UfFVUQykoPzpbLStdXFxkezR9KT8pXFxiL2c7XG4gICAgICB2YXIgdGltZXpvbmVDbGlwID0gL1teLStcXGRBLVpdL2c7XG4gIFxuICAgICAgLy8gUmVnZXhlcyBhbmQgc3VwcG9ydGluZyBmdW5jdGlvbnMgYXJlIGNhY2hlZCB0aHJvdWdoIGNsb3N1cmVcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0ZSwgbWFzaywgdXRjLCBnbXQpIHtcbiAgXG4gICAgICAgIC8vIFlvdSBjYW4ndCBwcm92aWRlIHV0YyBpZiB5b3Ugc2tpcCBvdGhlciBhcmdzICh1c2UgdGhlICdVVEM6JyBtYXNrIHByZWZpeClcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYga2luZE9mKGRhdGUpID09PSAnc3RyaW5nJyAmJiAhL1xcZC8udGVzdChkYXRlKSkge1xuICAgICAgICAgIG1hc2sgPSBkYXRlO1xuICAgICAgICAgIGRhdGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGRhdGUgPSBkYXRlIHx8IG5ldyBEYXRlO1xuICBcbiAgICAgICAgaWYoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgICBkYXRlID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIGlmIChpc05hTihkYXRlKSkge1xuICAgICAgICAgIHRocm93IFR5cGVFcnJvcignSW52YWxpZCBkYXRlJyk7XG4gICAgICAgIH1cbiAgXG4gICAgICAgIG1hc2sgPSBTdHJpbmcoZGF0ZUZvcm1hdC5tYXNrc1ttYXNrXSB8fCBtYXNrIHx8IGRhdGVGb3JtYXQubWFza3NbJ2RlZmF1bHQnXSk7XG4gIFxuICAgICAgICAvLyBBbGxvdyBzZXR0aW5nIHRoZSB1dGMvZ210IGFyZ3VtZW50IHZpYSB0aGUgbWFza1xuICAgICAgICB2YXIgbWFza1NsaWNlID0gbWFzay5zbGljZSgwLCA0KTtcbiAgICAgICAgaWYgKG1hc2tTbGljZSA9PT0gJ1VUQzonIHx8IG1hc2tTbGljZSA9PT0gJ0dNVDonKSB7XG4gICAgICAgICAgbWFzayA9IG1hc2suc2xpY2UoNCk7XG4gICAgICAgICAgdXRjID0gdHJ1ZTtcbiAgICAgICAgICBpZiAobWFza1NsaWNlID09PSAnR01UOicpIHtcbiAgICAgICAgICAgIGdtdCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gIFxuICAgICAgICB2YXIgXyA9IHV0YyA/ICdnZXRVVEMnIDogJ2dldCc7XG4gICAgICAgIHZhciBkID0gZGF0ZVtfICsgJ0RhdGUnXSgpO1xuICAgICAgICB2YXIgRCA9IGRhdGVbXyArICdEYXknXSgpO1xuICAgICAgICB2YXIgbSA9IGRhdGVbXyArICdNb250aCddKCk7XG4gICAgICAgIHZhciB5ID0gZGF0ZVtfICsgJ0Z1bGxZZWFyJ10oKTtcbiAgICAgICAgdmFyIEggPSBkYXRlW18gKyAnSG91cnMnXSgpO1xuICAgICAgICB2YXIgTSA9IGRhdGVbXyArICdNaW51dGVzJ10oKTtcbiAgICAgICAgdmFyIHMgPSBkYXRlW18gKyAnU2Vjb25kcyddKCk7XG4gICAgICAgIHZhciBMID0gZGF0ZVtfICsgJ01pbGxpc2Vjb25kcyddKCk7XG4gICAgICAgIHZhciBvID0gdXRjID8gMCA6IGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKTtcbiAgICAgICAgdmFyIFcgPSBnZXRXZWVrKGRhdGUpO1xuICAgICAgICB2YXIgTiA9IGdldERheU9mV2VlayhkYXRlKTtcbiAgICAgICAgdmFyIGZsYWdzID0ge1xuICAgICAgICAgIGQ6ICAgIGQsXG4gICAgICAgICAgZGQ6ICAgcGFkKGQpLFxuICAgICAgICAgIGRkZDogIGRhdGVGb3JtYXQuaTE4bi5kYXlOYW1lc1tEXSxcbiAgICAgICAgICBkZGRkOiBkYXRlRm9ybWF0LmkxOG4uZGF5TmFtZXNbRCArIDddLFxuICAgICAgICAgIG06ICAgIG0gKyAxLFxuICAgICAgICAgIG1tOiAgIHBhZChtICsgMSksXG4gICAgICAgICAgbW1tOiAgZGF0ZUZvcm1hdC5pMThuLm1vbnRoTmFtZXNbbV0sXG4gICAgICAgICAgbW1tbTogZGF0ZUZvcm1hdC5pMThuLm1vbnRoTmFtZXNbbSArIDEyXSxcbiAgICAgICAgICB5eTogICBTdHJpbmcoeSkuc2xpY2UoMiksXG4gICAgICAgICAgeXl5eTogeSxcbiAgICAgICAgICBoOiAgICBIICUgMTIgfHwgMTIsXG4gICAgICAgICAgaGg6ICAgcGFkKEggJSAxMiB8fCAxMiksXG4gICAgICAgICAgSDogICAgSCxcbiAgICAgICAgICBISDogICBwYWQoSCksXG4gICAgICAgICAgTTogICAgTSxcbiAgICAgICAgICBNTTogICBwYWQoTSksXG4gICAgICAgICAgczogICAgcyxcbiAgICAgICAgICBzczogICBwYWQocyksXG4gICAgICAgICAgbDogICAgcGFkKEwsIDMpLFxuICAgICAgICAgIEw6ICAgIHBhZChNYXRoLnJvdW5kKEwgLyAxMCkpLFxuICAgICAgICAgIHQ6ICAgIEggPCAxMiA/IGRhdGVGb3JtYXQuaTE4bi50aW1lTmFtZXNbMF0gOiBkYXRlRm9ybWF0LmkxOG4udGltZU5hbWVzWzFdLFxuICAgICAgICAgIHR0OiAgIEggPCAxMiA/IGRhdGVGb3JtYXQuaTE4bi50aW1lTmFtZXNbMl0gOiBkYXRlRm9ybWF0LmkxOG4udGltZU5hbWVzWzNdLFxuICAgICAgICAgIFQ6ICAgIEggPCAxMiA/IGRhdGVGb3JtYXQuaTE4bi50aW1lTmFtZXNbNF0gOiBkYXRlRm9ybWF0LmkxOG4udGltZU5hbWVzWzVdLFxuICAgICAgICAgIFRUOiAgIEggPCAxMiA/IGRhdGVGb3JtYXQuaTE4bi50aW1lTmFtZXNbNl0gOiBkYXRlRm9ybWF0LmkxOG4udGltZU5hbWVzWzddLFxuICAgICAgICAgIFo6ICAgIGdtdCA/ICdHTVQnIDogdXRjID8gJ1VUQycgOiAoU3RyaW5nKGRhdGUpLm1hdGNoKHRpbWV6b25lKSB8fCBbJyddKS5wb3AoKS5yZXBsYWNlKHRpbWV6b25lQ2xpcCwgJycpLFxuICAgICAgICAgIG86ICAgIChvID4gMCA/ICctJyA6ICcrJykgKyBwYWQoTWF0aC5mbG9vcihNYXRoLmFicyhvKSAvIDYwKSAqIDEwMCArIE1hdGguYWJzKG8pICUgNjAsIDQpLFxuICAgICAgICAgIFM6ICAgIFsndGgnLCAnc3QnLCAnbmQnLCAncmQnXVtkICUgMTAgPiAzID8gMCA6IChkICUgMTAwIC0gZCAlIDEwICE9IDEwKSAqIGQgJSAxMF0sXG4gICAgICAgICAgVzogICAgVyxcbiAgICAgICAgICBOOiAgICBOXG4gICAgICAgIH07XG4gIFxuICAgICAgICByZXR1cm4gbWFzay5yZXBsYWNlKHRva2VuLCBmdW5jdGlvbiAobWF0Y2gpIHtcbiAgICAgICAgICBpZiAobWF0Y2ggaW4gZmxhZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBmbGFnc1ttYXRjaF07XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBtYXRjaC5zbGljZSgxLCBtYXRjaC5sZW5ndGggLSAxKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgIH0pKCk7XG5cbiAgZGF0ZUZvcm1hdC5tYXNrcyA9IHtcbiAgICAnZGVmYXVsdCc6ICAgICAgICAgICAgICAgJ2RkZCBtbW0gZGQgeXl5eSBISDpNTTpzcycsXG4gICAgJ3Nob3J0RGF0ZSc6ICAgICAgICAgICAgICdtL2QveXknLFxuICAgICdtZWRpdW1EYXRlJzogICAgICAgICAgICAnbW1tIGQsIHl5eXknLFxuICAgICdsb25nRGF0ZSc6ICAgICAgICAgICAgICAnbW1tbSBkLCB5eXl5JyxcbiAgICAnZnVsbERhdGUnOiAgICAgICAgICAgICAgJ2RkZGQsIG1tbW0gZCwgeXl5eScsXG4gICAgJ3Nob3J0VGltZSc6ICAgICAgICAgICAgICdoOk1NIFRUJyxcbiAgICAnbWVkaXVtVGltZSc6ICAgICAgICAgICAgJ2g6TU06c3MgVFQnLFxuICAgICdsb25nVGltZSc6ICAgICAgICAgICAgICAnaDpNTTpzcyBUVCBaJyxcbiAgICAnaXNvRGF0ZSc6ICAgICAgICAgICAgICAgJ3l5eXktbW0tZGQnLFxuICAgICdpc29UaW1lJzogICAgICAgICAgICAgICAnSEg6TU06c3MnLFxuICAgICdpc29EYXRlVGltZSc6ICAgICAgICAgICAneXl5eS1tbS1kZFxcJ1RcXCdISDpNTTpzc28nLFxuICAgICdpc29VdGNEYXRlVGltZSc6ICAgICAgICAnVVRDOnl5eXktbW0tZGRcXCdUXFwnSEg6TU06c3NcXCdaXFwnJyxcbiAgICAnZXhwaXJlc0hlYWRlckZvcm1hdCc6ICAgJ2RkZCwgZGQgbW1tIHl5eXkgSEg6TU06c3MgWidcbiAgfTtcblxuICAvLyBJbnRlcm5hdGlvbmFsaXphdGlvbiBzdHJpbmdzXG4gIGRhdGVGb3JtYXQuaTE4biA9IHtcbiAgICBkYXlOYW1lczogW1xuICAgICAgJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCcsXG4gICAgICAnU3VuZGF5JywgJ01vbmRheScsICdUdWVzZGF5JywgJ1dlZG5lc2RheScsICdUaHVyc2RheScsICdGcmlkYXknLCAnU2F0dXJkYXknXG4gICAgXSxcbiAgICBtb250aE5hbWVzOiBbXG4gICAgICAnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnLFxuICAgICAgJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXG4gICAgXSxcbiAgICB0aW1lTmFtZXM6IFtcbiAgICAgICdhJywgJ3AnLCAnYW0nLCAncG0nLCAnQScsICdQJywgJ0FNJywgJ1BNJ1xuICAgIF1cbiAgfTtcblxuZnVuY3Rpb24gcGFkKHZhbCwgbGVuKSB7XG4gIHZhbCA9IFN0cmluZyh2YWwpO1xuICBsZW4gPSBsZW4gfHwgMjtcbiAgd2hpbGUgKHZhbC5sZW5ndGggPCBsZW4pIHtcbiAgICB2YWwgPSAnMCcgKyB2YWw7XG4gIH1cbiAgcmV0dXJuIHZhbDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIElTTyA4NjAxIHdlZWsgbnVtYmVyXG4gKiBCYXNlZCBvbiBjb21tZW50cyBmcm9tXG4gKiBodHRwOi8vdGVjaGJsb2cucHJvY3VyaW9zLm5sL2svbjYxOC9uZXdzL3ZpZXcvMzM3OTYvMTQ4NjMvQ2FsY3VsYXRlLUlTTy04NjAxLXdlZWstYW5kLXllYXItaW4tamF2YXNjcmlwdC5odG1sXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBgZGF0ZWBcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0V2VlayhkYXRlKSB7XG4gIC8vIFJlbW92ZSB0aW1lIGNvbXBvbmVudHMgb2YgZGF0ZVxuICB2YXIgdGFyZ2V0VGh1cnNkYXkgPSBuZXcgRGF0ZShkYXRlLmdldEZ1bGxZZWFyKCksIGRhdGUuZ2V0TW9udGgoKSwgZGF0ZS5nZXREYXRlKCkpO1xuXG4gIC8vIENoYW5nZSBkYXRlIHRvIFRodXJzZGF5IHNhbWUgd2Vla1xuICB0YXJnZXRUaHVyc2RheS5zZXREYXRlKHRhcmdldFRodXJzZGF5LmdldERhdGUoKSAtICgodGFyZ2V0VGh1cnNkYXkuZ2V0RGF5KCkgKyA2KSAlIDcpICsgMyk7XG5cbiAgLy8gVGFrZSBKYW51YXJ5IDR0aCBhcyBpdCBpcyBhbHdheXMgaW4gd2VlayAxIChzZWUgSVNPIDg2MDEpXG4gIHZhciBmaXJzdFRodXJzZGF5ID0gbmV3IERhdGUodGFyZ2V0VGh1cnNkYXkuZ2V0RnVsbFllYXIoKSwgMCwgNCk7XG5cbiAgLy8gQ2hhbmdlIGRhdGUgdG8gVGh1cnNkYXkgc2FtZSB3ZWVrXG4gIGZpcnN0VGh1cnNkYXkuc2V0RGF0ZShmaXJzdFRodXJzZGF5LmdldERhdGUoKSAtICgoZmlyc3RUaHVyc2RheS5nZXREYXkoKSArIDYpICUgNykgKyAzKTtcblxuICAvLyBDaGVjayBpZiBkYXlsaWdodC1zYXZpbmctdGltZS1zd2l0Y2ggb2NjdXJyZWQgYW5kIGNvcnJlY3QgZm9yIGl0XG4gIHZhciBkcyA9IHRhcmdldFRodXJzZGF5LmdldFRpbWV6b25lT2Zmc2V0KCkgLSBmaXJzdFRodXJzZGF5LmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIHRhcmdldFRodXJzZGF5LnNldEhvdXJzKHRhcmdldFRodXJzZGF5LmdldEhvdXJzKCkgLSBkcyk7XG5cbiAgLy8gTnVtYmVyIG9mIHdlZWtzIGJldHdlZW4gdGFyZ2V0IFRodXJzZGF5IGFuZCBmaXJzdCBUaHVyc2RheVxuICB2YXIgd2Vla0RpZmYgPSAodGFyZ2V0VGh1cnNkYXkgLSBmaXJzdFRodXJzZGF5KSAvICg4NjQwMDAwMCo3KTtcbiAgcmV0dXJuIDEgKyBNYXRoLmZsb29yKHdlZWtEaWZmKTtcbn1cblxuLyoqXG4gKiBHZXQgSVNPLTg2MDEgbnVtZXJpYyByZXByZXNlbnRhdGlvbiBvZiB0aGUgZGF5IG9mIHRoZSB3ZWVrXG4gKiAxIChmb3IgTW9uZGF5KSB0aHJvdWdoIDcgKGZvciBTdW5kYXkpXG4gKiBcbiAqIEBwYXJhbSAge09iamVjdH0gYGRhdGVgXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldERheU9mV2VlayhkYXRlKSB7XG4gIHZhciBkb3cgPSBkYXRlLmdldERheSgpO1xuICBpZihkb3cgPT09IDApIHtcbiAgICBkb3cgPSA3O1xuICB9XG4gIHJldHVybiBkb3c7XG59XG5cbi8qKlxuICoga2luZC1vZiBzaG9ydGN1dFxuICogQHBhcmFtICB7Kn0gdmFsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGtpbmRPZih2YWwpIHtcbiAgaWYgKHZhbCA9PT0gbnVsbCkge1xuICAgIHJldHVybiAnbnVsbCc7XG4gIH1cblxuICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICBpZiAodHlwZW9mIHZhbCAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbDtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICByZXR1cm4gJ2FycmF5JztcbiAgfVxuXG4gIHJldHVybiB7fS50b1N0cmluZy5jYWxsKHZhbClcbiAgICAuc2xpY2UoOCwgLTEpLnRvTG93ZXJDYXNlKCk7XG59O1xuXG5cblxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBkYXRlRm9ybWF0O1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gZGF0ZUZvcm1hdDtcbiAgfSBlbHNlIHtcbiAgICBnbG9iYWwuZGF0ZUZvcm1hdCA9IGRhdGVGb3JtYXQ7XG4gIH1cbn0pKHRoaXMpO1xuIiwiLyohXG4gKiByZXBlYXQtc3RyaW5nIDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9yZXBlYXQtc3RyaW5nPlxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBKb24gU2NobGlua2VydC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogUmVzdWx0cyBjYWNoZVxuICovXG5cbnZhciByZXMgPSAnJztcbnZhciBjYWNoZTtcblxuLyoqXG4gKiBFeHBvc2UgYHJlcGVhdGBcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcGVhdDtcblxuLyoqXG4gKiBSZXBlYXQgdGhlIGdpdmVuIGBzdHJpbmdgIHRoZSBzcGVjaWZpZWQgYG51bWJlcmBcbiAqIG9mIHRpbWVzLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICpcbiAqIGBgYGpzXG4gKiB2YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuICogcmVwZWF0KCdBJywgNSk7XG4gKiAvLz0+IEFBQUFBXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYHN0cmluZ2AgVGhlIHN0cmluZyB0byByZXBlYXRcbiAqIEBwYXJhbSB7TnVtYmVyfSBgbnVtYmVyYCBUaGUgbnVtYmVyIG9mIHRpbWVzIHRvIHJlcGVhdCB0aGUgc3RyaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFJlcGVhdGVkIHN0cmluZ1xuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5mdW5jdGlvbiByZXBlYXQoc3RyLCBudW0pIHtcbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZXhwZWN0ZWQgYSBzdHJpbmcnKTtcbiAgfVxuXG4gIC8vIGNvdmVyIGNvbW1vbiwgcXVpY2sgdXNlIGNhc2VzXG4gIGlmIChudW0gPT09IDEpIHJldHVybiBzdHI7XG4gIGlmIChudW0gPT09IDIpIHJldHVybiBzdHIgKyBzdHI7XG5cbiAgdmFyIG1heCA9IHN0ci5sZW5ndGggKiBudW07XG4gIGlmIChjYWNoZSAhPT0gc3RyIHx8IHR5cGVvZiBjYWNoZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjYWNoZSA9IHN0cjtcbiAgICByZXMgPSAnJztcbiAgfSBlbHNlIGlmIChyZXMubGVuZ3RoID49IG1heCkge1xuICAgIHJldHVybiByZXMuc3Vic3RyKDAsIG1heCk7XG4gIH1cblxuICB3aGlsZSAobWF4ID4gcmVzLmxlbmd0aCAmJiBudW0gPiAxKSB7XG4gICAgaWYgKG51bSAmIDEpIHtcbiAgICAgIHJlcyArPSBzdHI7XG4gICAgfVxuXG4gICAgbnVtID4+PSAxO1xuICAgIHN0ciArPSBzdHI7XG4gIH1cblxuICByZXMgKz0gc3RyO1xuICByZXMgPSByZXMuc3Vic3RyKDAsIG1heCk7XG4gIHJldHVybiByZXM7XG59XG4iLCIvKiFcbiAqIHBhZC1sZWZ0IDxodHRwczovL2dpdGh1Yi5jb20vam9uc2NobGlua2VydC9wYWQtbGVmdD5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgSm9uIFNjaGxpbmtlcnQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgcmVwZWF0ID0gcmVxdWlyZSgncmVwZWF0LXN0cmluZycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHBhZExlZnQoc3RyLCBudW0sIGNoKSB7XG4gIHN0ciA9IHN0ci50b1N0cmluZygpO1xuXG4gIGlmICh0eXBlb2YgbnVtID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICBpZiAoY2ggPT09IDApIHtcbiAgICBjaCA9ICcwJztcbiAgfSBlbHNlIGlmIChjaCkge1xuICAgIGNoID0gY2gudG9TdHJpbmcoKTtcbiAgfSBlbHNlIHtcbiAgICBjaCA9ICcgJztcbiAgfVxuXG4gIHJldHVybiByZXBlYXQoY2gsIG51bSAtIHN0ci5sZW5ndGgpICsgc3RyO1xufTtcbiIsImltcG9ydCBkYXRlZm9ybWF0IGZyb20gJ2RhdGVmb3JtYXQnO1xuaW1wb3J0IGFzc2lnbiBmcm9tICdvYmplY3QtYXNzaWduJztcbmltcG9ydCBwYWRMZWZ0IGZyb20gJ3BhZC1sZWZ0JztcbmltcG9ydCB7IGdldENsaWVudEFQSSB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IG5vb3AgPSAoKSA9PiB7fTtcbmxldCBsaW5rO1xuXG4vLyBBbHRlcm5hdGl2ZSBzb2x1dGlvbiBmb3Igc2F2aW5nIGZpbGVzLFxuLy8gYSBiaXQgc2xvd2VyIGFuZCBkb2VzIG5vdCB3b3JrIGluIFNhZmFyaVxuLy8gZnVuY3Rpb24gZmV0Y2hCbG9iRnJvbURhdGFVUkwgKGRhdGFVUkwpIHtcbi8vICAgcmV0dXJuIHdpbmRvdy5mZXRjaChkYXRhVVJMKS50aGVuKHJlcyA9PiByZXMuYmxvYigpKTtcbi8vIH1cblxuY29uc3Qgc3VwcG9ydGVkRW5jb2RpbmdzID0gW1xuICAnaW1hZ2UvcG5nJyxcbiAgJ2ltYWdlL2pwZWcnLFxuICAnaW1hZ2Uvd2VicCdcbl07XG5cbmV4cG9ydCBmdW5jdGlvbiBleHBvcnRDYW52YXMgKGNhbnZhcywgb3B0ID0ge30pIHtcbiAgY29uc3QgZW5jb2RpbmcgPSBvcHQuZW5jb2RpbmcgfHwgJ2ltYWdlL3BuZyc7XG4gIGlmICghc3VwcG9ydGVkRW5jb2RpbmdzLmluY2x1ZGVzKGVuY29kaW5nKSkgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGNhbnZhcyBlbmNvZGluZyAke2VuY29kaW5nfWApO1xuICBsZXQgZXh0ZW5zaW9uID0gKGVuY29kaW5nLnNwbGl0KCcvJylbMV0gfHwgJycpLnJlcGxhY2UoL2pwZWcvaSwgJ2pwZycpO1xuICBpZiAoZXh0ZW5zaW9uKSBleHRlbnNpb24gPSBgLiR7ZXh0ZW5zaW9ufWAudG9Mb3dlckNhc2UoKTtcbiAgcmV0dXJuIHtcbiAgICBleHRlbnNpb24sXG4gICAgdHlwZTogZW5jb2RpbmcsXG4gICAgZGF0YVVSTDogY2FudmFzLnRvRGF0YVVSTChlbmNvZGluZywgb3B0LmVuY29kaW5nUXVhbGl0eSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQmxvYkZyb21EYXRhVVJMIChkYXRhVVJMKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNvbnN0IHNwbGl0SW5kZXggPSBkYXRhVVJMLmluZGV4T2YoJywnKTtcbiAgICBpZiAoc3BsaXRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHJlc29sdmUobmV3IHdpbmRvdy5CbG9iKCkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBiYXNlNjQgPSBkYXRhVVJMLnNsaWNlKHNwbGl0SW5kZXggKyAxKTtcbiAgICBjb25zdCBieXRlU3RyaW5nID0gd2luZG93LmF0b2IoYmFzZTY0KTtcbiAgICBjb25zdCBtaW1lTWF0Y2ggPSAvZGF0YTooW147K10pOy8uZXhlYyhkYXRhVVJMKTtcbiAgICBjb25zdCBtaW1lID0gKG1pbWVNYXRjaCA/IG1pbWVNYXRjaFsxXSA6ICcnKSB8fCB1bmRlZmluZWQ7XG4gICAgY29uc3QgYWIgPSBuZXcgQXJyYXlCdWZmZXIoYnl0ZVN0cmluZy5sZW5ndGgpO1xuICAgIGNvbnN0IGlhID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZVN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgICAgaWFbaV0gPSBieXRlU3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgfVxuICAgIHJlc29sdmUobmV3IHdpbmRvdy5CbG9iKFsgYWIgXSwgeyB0eXBlOiBtaW1lIH0pKTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlRGF0YVVSTCAoZGF0YVVSTCwgb3B0cyA9IHt9KSB7XG4gIHJldHVybiBjcmVhdGVCbG9iRnJvbURhdGFVUkwoZGF0YVVSTClcbiAgICAudGhlbihibG9iID0+IHNhdmVCbG9iKGJsb2IsIG9wdHMpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNhdmVCbG9iIChibG9iLCBvcHRzID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgIG9wdHMgPSBhc3NpZ24oeyBleHRlbnNpb246ICcnLCBwcmVmaXg6ICcnLCBzdWZmaXg6ICcnIH0sIG9wdHMpO1xuICAgIGNvbnN0IGZpbGVuYW1lID0gcmVzb2x2ZUZpbGVuYW1lKG9wdHMpO1xuXG4gICAgY29uc3QgY2xpZW50ID0gZ2V0Q2xpZW50QVBJKCk7XG4gICAgaWYgKGNsaWVudCAmJiB0eXBlb2YgY2xpZW50LnNhdmVCbG9iID09PSAnZnVuY3Rpb24nICYmIGNsaWVudC5vdXRwdXQpIHtcbiAgICAgIC8vIG5hdGl2ZSBzYXZpbmcgdXNpbmcgYSBDTEkgdG9vbFxuICAgICAgcmV0dXJuIGNsaWVudC5zYXZlQmxvYihibG9iLCBhc3NpZ24oe30sIG9wdHMsIHsgZmlsZW5hbWUgfSkpXG4gICAgICAgIC50aGVuKGV2ID0+IHJlc29sdmUoZXYpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm9yY2UgZG93bmxvYWRcbiAgICAgIGlmICghbGluaykge1xuICAgICAgICBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgICAgICBsaW5rLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcbiAgICAgICAgbGluay50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgIH1cbiAgICAgIGxpbmsuZG93bmxvYWQgPSBmaWxlbmFtZTtcbiAgICAgIGxpbmsuaHJlZiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChsaW5rKTtcbiAgICAgIGxpbmsub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgbGluay5vbmNsaWNrID0gbm9vcDtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgd2luZG93LlVSTC5yZXZva2VPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rKTtcbiAgICAgICAgICBsaW5rLnJlbW92ZUF0dHJpYnV0ZSgnaHJlZicpO1xuICAgICAgICAgIHJlc29sdmUoeyBmaWxlbmFtZSwgY2xpZW50OiBmYWxzZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgbGluay5jbGljaygpO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlRmlsZSAoZGF0YSwgb3B0cyA9IHt9KSB7XG4gIGNvbnN0IHBhcnRzID0gQXJyYXkuaXNBcnJheShkYXRhKSA/IGRhdGEgOiBbIGRhdGEgXTtcbiAgY29uc3QgYmxvYiA9IG5ldyB3aW5kb3cuQmxvYihwYXJ0cywgeyB0eXBlOiBvcHRzLnR5cGUgfHwgJycgfSk7XG4gIHJldHVybiBzYXZlQmxvYihibG9iLCBvcHRzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpbGVOYW1lICgpIHtcbiAgY29uc3QgZGF0ZUZvcm1hdFN0ciA9IGB5eXl5Lm1tLmRkLUhILk1NLnNzYDtcbiAgcmV0dXJuIGRhdGVmb3JtYXQobmV3IERhdGUoKSwgZGF0ZUZvcm1hdFN0cik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREZWZhdWx0RmlsZSAocHJlZml4ID0gJycsIHN1ZmZpeCA9ICcnLCBleHQpIHtcbiAgLy8gY29uc3QgZGF0ZUZvcm1hdFN0ciA9IGB5eXl5Lm1tLmRkLUhILk1NLnNzYDtcbiAgY29uc3QgZGF0ZUZvcm1hdFN0ciA9IGB5eXl5LW1tLWRkICdhdCcgaC5NTS5zcyBUVGA7XG4gIHJldHVybiBgJHtwcmVmaXh9JHtkYXRlZm9ybWF0KG5ldyBEYXRlKCksIGRhdGVGb3JtYXRTdHIpfSR7c3VmZml4fSR7ZXh0fWA7XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVGaWxlbmFtZSAob3B0ID0ge30pIHtcbiAgb3B0ID0gYXNzaWduKHt9LCBvcHQpO1xuXG4gIC8vIEN1c3RvbSBmaWxlbmFtZSBmdW5jdGlvblxuICBpZiAodHlwZW9mIG9wdC5maWxlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIG9wdC5maWxlKG9wdCk7XG4gIH0gZWxzZSBpZiAob3B0LmZpbGUpIHtcbiAgICByZXR1cm4gb3B0LmZpbGU7XG4gIH1cblxuICBsZXQgZnJhbWUgPSBudWxsO1xuICBsZXQgZXh0ZW5zaW9uID0gJyc7XG4gIGlmICh0eXBlb2Ygb3B0LmV4dGVuc2lvbiA9PT0gJ3N0cmluZycpIGV4dGVuc2lvbiA9IG9wdC5leHRlbnNpb247XG5cbiAgaWYgKHR5cGVvZiBvcHQuZnJhbWUgPT09ICdudW1iZXInKSB7XG4gICAgbGV0IHRvdGFsRnJhbWVzO1xuICAgIGlmICh0eXBlb2Ygb3B0LnRvdGFsRnJhbWVzID09PSAnbnVtYmVyJykge1xuICAgICAgdG90YWxGcmFtZXMgPSBvcHQudG90YWxGcmFtZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRvdGFsRnJhbWVzID0gTWF0aC5tYXgoMTAwMCwgb3B0LmZyYW1lKTtcbiAgICB9XG4gICAgZnJhbWUgPSBwYWRMZWZ0KFN0cmluZyhvcHQuZnJhbWUpLCBTdHJpbmcodG90YWxGcmFtZXMpLmxlbmd0aCwgJzAnKTtcbiAgfVxuXG4gIGNvbnN0IGxheWVyU3RyID0gaXNGaW5pdGUob3B0LnRvdGFsTGF5ZXJzKSAmJiBpc0Zpbml0ZShvcHQubGF5ZXIpICYmIG9wdC50b3RhbExheWVycyA+IDEgPyBgJHtvcHQubGF5ZXJ9YCA6ICcnO1xuICBpZiAoZnJhbWUgIT0gbnVsbCkge1xuICAgIHJldHVybiBbIGxheWVyU3RyLCBmcmFtZSBdLmZpbHRlcihCb29sZWFuKS5qb2luKCctJykgKyBleHRlbnNpb247XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGVmYXVsdEZpbGVOYW1lID0gb3B0LnRpbWVTdGFtcDtcbiAgICByZXR1cm4gWyBvcHQucHJlZml4LCBvcHQubmFtZSB8fCBkZWZhdWx0RmlsZU5hbWUsIGxheWVyU3RyLCBvcHQuaGFzaCwgb3B0LnN1ZmZpeCBdLmZpbHRlcihCb29sZWFuKS5qb2luKCctJykgKyBleHRlbnNpb247XG4gIH1cbn1cbiIsIi8vIEhhbmRsZSBzb21lIGNvbW1vbiB0eXBvc1xuY29uc3QgY29tbW9uVHlwb3MgPSB7XG4gIGRpbWVuc2lvbjogJ2RpbWVuc2lvbnMnLFxuICBhbmltYXRlZDogJ2FuaW1hdGUnLFxuICBhbmltYXRpbmc6ICdhbmltYXRlJyxcbiAgdW5pdDogJ3VuaXRzJyxcbiAgUDU6ICdwNScsXG4gIHBpeGVsbGF0ZWQ6ICdwaXhlbGF0ZWQnLFxuICBsb29waW5nOiAnbG9vcCcsXG4gIHBpeGVsUGVySW5jaDogJ3BpeGVscydcbn07XG5cbi8vIEhhbmRsZSBhbGwgb3RoZXIgdHlwb3NcbmNvbnN0IGFsbEtleXMgPSBbXG4gICdkaW1lbnNpb25zJywgJ3VuaXRzJywgJ3BpeGVsc1BlckluY2gnLCAnb3JpZW50YXRpb24nLFxuICAnc2NhbGVUb0ZpdCcsICdzY2FsZVRvVmlldycsICdibGVlZCcsICdwaXhlbFJhdGlvJyxcbiAgJ2V4cG9ydFBpeGVsUmF0aW8nLCAnbWF4UGl4ZWxSYXRpbycsICdzY2FsZUNvbnRleHQnLFxuICAncmVzaXplQ2FudmFzJywgJ3N0eWxlQ2FudmFzJywgJ2NhbnZhcycsICdjb250ZXh0JywgJ2F0dHJpYnV0ZXMnLFxuICAncGFyZW50JywgJ2ZpbGUnLCAnbmFtZScsICdwcmVmaXgnLCAnc3VmZml4JywgJ2FuaW1hdGUnLCAncGxheWluZycsXG4gICdsb29wJywgJ2R1cmF0aW9uJywgJ3RvdGFsRnJhbWVzJywgJ2ZwcycsICdwbGF5YmFja1JhdGUnLCAndGltZVNjYWxlJyxcbiAgJ2ZyYW1lJywgJ3RpbWUnLCAnZmx1c2gnLCAncGl4ZWxhdGVkJywgJ2hvdGtleXMnLCAncDUnLCAnaWQnLFxuICAnc2NhbGVUb0ZpdFBhZGRpbmcnLCAnZGF0YScsICdwYXJhbXMnLCAnZW5jb2RpbmcnLCAnZW5jb2RpbmdRdWFsaXR5J1xuXTtcblxuLy8gVGhpcyBpcyBmYWlybHkgb3BpbmlvbmF0ZWQgYW5kIGZvcmNlcyB1c2VycyB0byB1c2UgdGhlICdkYXRhJyBwYXJhbWV0ZXJcbi8vIGlmIHRoZXkgd2FudCB0byBwYXNzIGFsb25nIG5vbi1zZXR0aW5nIG9iamVjdHMuLi5cbmV4cG9ydCBjb25zdCBjaGVja1NldHRpbmdzID0gKHNldHRpbmdzKSA9PiB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzZXR0aW5ncyk7XG4gIGtleXMuZm9yRWFjaChrZXkgPT4ge1xuICAgIGlmIChrZXkgaW4gY29tbW9uVHlwb3MpIHtcbiAgICAgIGNvbnN0IGFjdHVhbCA9IGNvbW1vblR5cG9zW2tleV07XG4gICAgICBjb25zb2xlLndhcm4oYFtjYW52YXMtc2tldGNoXSBDb3VsZCBub3QgcmVjb2duaXplIHRoZSBzZXR0aW5nIFwiJHtrZXl9XCIsIGRpZCB5b3UgbWVhbiBcIiR7YWN0dWFsfVwiP2ApO1xuICAgIH0gZWxzZSBpZiAoIWFsbEtleXMuaW5jbHVkZXMoa2V5KSkge1xuICAgICAgY29uc29sZS53YXJuKGBbY2FudmFzLXNrZXRjaF0gQ291bGQgbm90IHJlY29nbml6ZSB0aGUgc2V0dGluZyBcIiR7a2V5fVwiYCk7XG4gICAgfVxuICB9KTtcbn07XG4iLCJpbXBvcnQgeyBnZXRDbGllbnRBUEkgfSBmcm9tICcuLi91dGlsJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG9wdCA9IHt9KSB7XG4gIGNvbnN0IGhhbmRsZXIgPSBldiA9PiB7XG4gICAgaWYgKCFvcHQuZW5hYmxlZCgpKSByZXR1cm47XG5cbiAgICBjb25zdCBjbGllbnQgPSBnZXRDbGllbnRBUEkoKTtcbiAgICBpZiAoZXYua2V5Q29kZSA9PT0gODMgJiYgIWV2LmFsdEtleSAmJiAoZXYubWV0YUtleSB8fCBldi5jdHJsS2V5KSkge1xuICAgICAgLy8gQ21kICsgU1xuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG9wdC5zYXZlKGV2KTtcbiAgICB9IGVsc2UgaWYgKGV2LmtleUNvZGUgPT09IDMyKSB7XG4gICAgICAvLyBTcGFjZVxuICAgICAgLy8gVE9ETzogd2hhdCB0byBkbyB3aXRoIHRoaXM/IGtlZXAgaXQsIG9yIHJlbW92ZSBpdD9cbiAgICAgIG9wdC50b2dnbGVQbGF5KGV2KTtcbiAgICB9IGVsc2UgaWYgKGNsaWVudCAmJiAhZXYuYWx0S2V5ICYmIGV2LmtleUNvZGUgPT09IDc1ICYmIChldi5tZXRhS2V5IHx8IGV2LmN0cmxLZXkpKSB7XG4gICAgICAvLyBDbWQgKyBLLCBvbmx5IHdoZW4gY2FudmFzLXNrZXRjaC1jbGkgaXMgdXNlZFxuICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG9wdC5jb21taXQoZXYpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBhdHRhY2ggPSAoKSA9PiB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyKTtcbiAgfTtcblxuICBjb25zdCBkZXRhY2ggPSAoKSA9PiB7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVyKTtcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIGF0dGFjaCxcbiAgICBkZXRhY2hcbiAgfTtcbn1cbiIsImNvbnN0IGRlZmF1bHRVbml0cyA9ICdtbSc7XG5cbmNvbnN0IGRhdGEgPSBbXG4gIC8vIENvbW1vbiBQYXBlciBTaXplc1xuICAvLyAoTW9zdGx5IE5vcnRoLUFtZXJpY2FuIGJhc2VkKVxuICBbICdwb3N0Y2FyZCcsIDEwMS42LCAxNTIuNCBdLFxuICBbICdwb3N0ZXItc21hbGwnLCAyODAsIDQzMCBdLFxuICBbICdwb3N0ZXInLCA0NjAsIDYxMCBdLFxuICBbICdwb3N0ZXItbGFyZ2UnLCA2MTAsIDkxMCBdLFxuICBbICdidXNpbmVzcy1jYXJkJywgNTAuOCwgODguOSBdLFxuXG4gIC8vIFBob3RvZ3JhcGhpYyBQcmludCBQYXBlciBTaXplc1xuICBbICcycicsIDY0LCA4OSBdLFxuICBbICczcicsIDg5LCAxMjcgXSxcbiAgWyAnNHInLCAxMDIsIDE1MiBdLFxuICBbICc1cicsIDEyNywgMTc4IF0sIC8vIDXigLN4N+KAs1xuICBbICc2cicsIDE1MiwgMjAzIF0sIC8vIDbigLN4OOKAs1xuICBbICc4cicsIDIwMywgMjU0IF0sIC8vIDjigLN4MTDigLNcbiAgWyAnMTByJywgMjU0LCAzMDUgXSwgLy8gMTDigLN4MTLigLNcbiAgWyAnMTFyJywgMjc5LCAzNTYgXSwgLy8gMTHigLN4MTTigLNcbiAgWyAnMTJyJywgMzA1LCAzODEgXSxcblxuICAvLyBTdGFuZGFyZCBQYXBlciBTaXplc1xuICBbICdhMCcsIDg0MSwgMTE4OSBdLFxuICBbICdhMScsIDU5NCwgODQxIF0sXG4gIFsgJ2EyJywgNDIwLCA1OTQgXSxcbiAgWyAnYTMnLCAyOTcsIDQyMCBdLFxuICBbICdhNCcsIDIxMCwgMjk3IF0sXG4gIFsgJ2E1JywgMTQ4LCAyMTAgXSxcbiAgWyAnYTYnLCAxMDUsIDE0OCBdLFxuICBbICdhNycsIDc0LCAxMDUgXSxcbiAgWyAnYTgnLCA1MiwgNzQgXSxcbiAgWyAnYTknLCAzNywgNTIgXSxcbiAgWyAnYTEwJywgMjYsIDM3IF0sXG4gIFsgJzJhMCcsIDExODksIDE2ODIgXSxcbiAgWyAnNGEwJywgMTY4MiwgMjM3OCBdLFxuICBbICdiMCcsIDEwMDAsIDE0MTQgXSxcbiAgWyAnYjEnLCA3MDcsIDEwMDAgXSxcbiAgWyAnYjErJywgNzIwLCAxMDIwIF0sXG4gIFsgJ2IyJywgNTAwLCA3MDcgXSxcbiAgWyAnYjIrJywgNTIwLCA3MjAgXSxcbiAgWyAnYjMnLCAzNTMsIDUwMCBdLFxuICBbICdiNCcsIDI1MCwgMzUzIF0sXG4gIFsgJ2I1JywgMTc2LCAyNTAgXSxcbiAgWyAnYjYnLCAxMjUsIDE3NiBdLFxuICBbICdiNycsIDg4LCAxMjUgXSxcbiAgWyAnYjgnLCA2MiwgODggXSxcbiAgWyAnYjknLCA0NCwgNjIgXSxcbiAgWyAnYjEwJywgMzEsIDQ0IF0sXG4gIFsgJ2IxMScsIDIyLCAzMiBdLFxuICBbICdiMTInLCAxNiwgMjIgXSxcbiAgWyAnYzAnLCA5MTcsIDEyOTcgXSxcbiAgWyAnYzEnLCA2NDgsIDkxNyBdLFxuICBbICdjMicsIDQ1OCwgNjQ4IF0sXG4gIFsgJ2MzJywgMzI0LCA0NTggXSxcbiAgWyAnYzQnLCAyMjksIDMyNCBdLFxuICBbICdjNScsIDE2MiwgMjI5IF0sXG4gIFsgJ2M2JywgMTE0LCAxNjIgXSxcbiAgWyAnYzcnLCA4MSwgMTE0IF0sXG4gIFsgJ2M4JywgNTcsIDgxIF0sXG4gIFsgJ2M5JywgNDAsIDU3IF0sXG4gIFsgJ2MxMCcsIDI4LCA0MCBdLFxuICBbICdjMTEnLCAyMiwgMzIgXSxcbiAgWyAnYzEyJywgMTYsIDIyIF0sXG5cbiAgLy8gVXNlIGluY2hlcyBmb3IgTm9ydGggQW1lcmljYW4gc2l6ZXMsXG4gIC8vIGFzIGl0IHByb2R1Y2VzIGxlc3MgZmxvYXQgcHJlY2lzaW9uIGVycm9yc1xuICBbICdoYWxmLWxldHRlcicsIDUuNSwgOC41LCAnaW4nIF0sXG4gIFsgJ2xldHRlcicsIDguNSwgMTEsICdpbicgXSxcbiAgWyAnbGVnYWwnLCA4LjUsIDE0LCAnaW4nIF0sXG4gIFsgJ2p1bmlvci1sZWdhbCcsIDUsIDgsICdpbicgXSxcbiAgWyAnbGVkZ2VyJywgMTEsIDE3LCAnaW4nIF0sXG4gIFsgJ3RhYmxvaWQnLCAxMSwgMTcsICdpbicgXSxcbiAgWyAnYW5zaS1hJywgOC41LCAxMS4wLCAnaW4nIF0sXG4gIFsgJ2Fuc2ktYicsIDExLjAsIDE3LjAsICdpbicgXSxcbiAgWyAnYW5zaS1jJywgMTcuMCwgMjIuMCwgJ2luJyBdLFxuICBbICdhbnNpLWQnLCAyMi4wLCAzNC4wLCAnaW4nIF0sXG4gIFsgJ2Fuc2ktZScsIDM0LjAsIDQ0LjAsICdpbicgXSxcbiAgWyAnYXJjaC1hJywgOSwgMTIsICdpbicgXSxcbiAgWyAnYXJjaC1iJywgMTIsIDE4LCAnaW4nIF0sXG4gIFsgJ2FyY2gtYycsIDE4LCAyNCwgJ2luJyBdLFxuICBbICdhcmNoLWQnLCAyNCwgMzYsICdpbicgXSxcbiAgWyAnYXJjaC1lJywgMzYsIDQ4LCAnaW4nIF0sXG4gIFsgJ2FyY2gtZTEnLCAzMCwgNDIsICdpbicgXSxcbiAgWyAnYXJjaC1lMicsIDI2LCAzOCwgJ2luJyBdLFxuICBbICdhcmNoLWUzJywgMjcsIDM5LCAnaW4nIF1cbl07XG5cbmV4cG9ydCBkZWZhdWx0IGRhdGEucmVkdWNlKChkaWN0LCBwcmVzZXQpID0+IHtcbiAgY29uc3QgaXRlbSA9IHtcbiAgICB1bml0czogcHJlc2V0WzNdIHx8IGRlZmF1bHRVbml0cyxcbiAgICBkaW1lbnNpb25zOiBbIHByZXNldFsxXSwgcHJlc2V0WzJdIF1cbiAgfTtcbiAgZGljdFtwcmVzZXRbMF1dID0gaXRlbTtcbiAgZGljdFtwcmVzZXRbMF0ucmVwbGFjZSgvLS9nLCAnICcpXSA9IGl0ZW07XG4gIHJldHVybiBkaWN0O1xufSwge30pO1xuIiwiaW1wb3J0IHBhcGVyU2l6ZXMgZnJvbSAnLi9wYXBlci1zaXplcyc7XG5pbXBvcnQgY29udmVydExlbmd0aCBmcm9tICdjb252ZXJ0LWxlbmd0aCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaW1lbnNpb25zRnJvbVByZXNldCAoZGltZW5zaW9ucywgdW5pdHNUbyA9ICdweCcsIHBpeGVsc1BlckluY2ggPSA3Mikge1xuICBpZiAodHlwZW9mIGRpbWVuc2lvbnMgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3Qga2V5ID0gZGltZW5zaW9ucy50b0xvd2VyQ2FzZSgpO1xuICAgIGlmICghKGtleSBpbiBwYXBlclNpemVzKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgZGltZW5zaW9uIHByZXNldCBcIiR7ZGltZW5zaW9uc31cIiBpcyBub3Qgc3VwcG9ydGVkIG9yIGNvdWxkIG5vdCBiZSBmb3VuZDsgdHJ5IHVzaW5nIGE0LCBhMywgcG9zdGNhcmQsIGxldHRlciwgZXRjLmApXG4gICAgfVxuICAgIGNvbnN0IHByZXNldCA9IHBhcGVyU2l6ZXNba2V5XTtcbiAgICByZXR1cm4gcHJlc2V0LmRpbWVuc2lvbnMubWFwKGQgPT4ge1xuICAgICAgcmV0dXJuIGNvbnZlcnREaXN0YW5jZShkLCBwcmVzZXQudW5pdHMsIHVuaXRzVG8sIHBpeGVsc1BlckluY2gpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBkaW1lbnNpb25zO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0RGlzdGFuY2UgKGRpbWVuc2lvbiwgdW5pdHNGcm9tID0gJ3B4JywgdW5pdHNUbyA9ICdweCcsIHBpeGVsc1BlckluY2ggPSA3Mikge1xuICByZXR1cm4gY29udmVydExlbmd0aChkaW1lbnNpb24sIHVuaXRzRnJvbSwgdW5pdHNUbywge1xuICAgIHBpeGVsc1BlckluY2gsXG4gICAgcHJlY2lzaW9uOiA0LFxuICAgIHJvdW5kUGl4ZWw6IHRydWVcbiAgfSk7XG59XG4iLCJpbXBvcnQgZGVmaW5lZCBmcm9tICdkZWZpbmVkJztcbmltcG9ydCB7IGdldERpbWVuc2lvbnNGcm9tUHJlc2V0LCBjb252ZXJ0RGlzdGFuY2UgfSBmcm9tICcuLi9kaXN0YW5jZXMnO1xuaW1wb3J0IHsgaXNCcm93c2VyIH0gZnJvbSAnLi4vdXRpbCc7XG5cbmZ1bmN0aW9uIGNoZWNrSWZIYXNEaW1lbnNpb25zIChzZXR0aW5ncykge1xuICBpZiAoIXNldHRpbmdzLmRpbWVuc2lvbnMpIHJldHVybiBmYWxzZTtcbiAgaWYgKHR5cGVvZiBzZXR0aW5ncy5kaW1lbnNpb25zID09PSAnc3RyaW5nJykgcmV0dXJuIHRydWU7XG4gIGlmIChBcnJheS5pc0FycmF5KHNldHRpbmdzLmRpbWVuc2lvbnMpICYmIHNldHRpbmdzLmRpbWVuc2lvbnMubGVuZ3RoID49IDIpIHJldHVybiB0cnVlO1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudFNpemUgKHByb3BzLCBzZXR0aW5ncykge1xuICAvLyBXaGVuIG5vIHsgZGltZW5zaW9uIH0gaXMgcGFzc2VkIGluIG5vZGUsIHdlIGRlZmF1bHQgdG8gSFRNTCBjYW52YXMgc2l6ZVxuICBpZiAoIWlzQnJvd3NlcigpKSB7XG4gICAgcmV0dXJuIFsgMzAwLCAxNTAgXTtcbiAgfVxuXG4gIGxldCBlbGVtZW50ID0gc2V0dGluZ3MucGFyZW50IHx8IHdpbmRvdztcblxuICBpZiAoZWxlbWVudCA9PT0gd2luZG93IHx8XG4gICAgICBlbGVtZW50ID09PSBkb2N1bWVudCB8fFxuICAgICAgZWxlbWVudCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgIHJldHVybiBbIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgXTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB7IHdpZHRoLCBoZWlnaHQgfSA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgcmV0dXJuIFsgd2lkdGgsIGhlaWdodCBdO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHJlc2l6ZUNhbnZhcyAocHJvcHMsIHNldHRpbmdzKSB7XG4gIGxldCB3aWR0aCwgaGVpZ2h0O1xuICBsZXQgc3R5bGVXaWR0aCwgc3R5bGVIZWlnaHQ7XG4gIGxldCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0O1xuXG4gIGNvbnN0IGJyb3dzZXIgPSBpc0Jyb3dzZXIoKTtcbiAgY29uc3QgZGltZW5zaW9ucyA9IHNldHRpbmdzLmRpbWVuc2lvbnM7XG4gIGNvbnN0IGhhc0RpbWVuc2lvbnMgPSBjaGVja0lmSGFzRGltZW5zaW9ucyhzZXR0aW5ncyk7XG4gIGNvbnN0IGV4cG9ydGluZyA9IHByb3BzLmV4cG9ydGluZztcbiAgbGV0IHNjYWxlVG9GaXQgPSBoYXNEaW1lbnNpb25zID8gc2V0dGluZ3Muc2NhbGVUb0ZpdCAhPT0gZmFsc2UgOiBmYWxzZTtcbiAgbGV0IHNjYWxlVG9WaWV3ID0gKCFleHBvcnRpbmcgJiYgaGFzRGltZW5zaW9ucykgPyBzZXR0aW5ncy5zY2FsZVRvVmlldyA6IHRydWU7XG4gIC8vIGluIG5vZGUsIGNhbmNlbCBib3RoIG9mIHRoZXNlIG9wdGlvbnNcbiAgaWYgKCFicm93c2VyKSBzY2FsZVRvRml0ID0gc2NhbGVUb1ZpZXcgPSBmYWxzZTtcbiAgY29uc3QgdW5pdHMgPSBzZXR0aW5ncy51bml0cztcbiAgY29uc3QgcGl4ZWxzUGVySW5jaCA9ICh0eXBlb2Ygc2V0dGluZ3MucGl4ZWxzUGVySW5jaCA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoc2V0dGluZ3MucGl4ZWxzUGVySW5jaCkpID8gc2V0dGluZ3MucGl4ZWxzUGVySW5jaCA6IDcyO1xuICBjb25zdCBibGVlZCA9IGRlZmluZWQoc2V0dGluZ3MuYmxlZWQsIDApO1xuXG4gIGNvbnN0IGRldmljZVBpeGVsUmF0aW8gPSBicm93c2VyID8gd2luZG93LmRldmljZVBpeGVsUmF0aW8gOiAxO1xuICBjb25zdCBiYXNlUGl4ZWxSYXRpbyA9IHNjYWxlVG9WaWV3ID8gZGV2aWNlUGl4ZWxSYXRpbyA6IDE7XG5cbiAgbGV0IHBpeGVsUmF0aW8sIGV4cG9ydFBpeGVsUmF0aW87XG5cbiAgLy8gSWYgYSBwaXhlbCByYXRpbyBpcyBzcGVjaWZpZWQsIHdlIHdpbGwgdXNlIGl0LlxuICAvLyBPdGhlcndpc2U6XG4gIC8vICAtPiBJZiBkaW1lbnNpb24gaXMgc3BlY2lmaWVkLCB1c2UgYmFzZSByYXRpbyAoaS5lLiBzaXplIGZvciBleHBvcnQpXG4gIC8vICAtPiBJZiBubyBkaW1lbnNpb24gaXMgc3BlY2lmaWVkLCB1c2UgZGV2aWNlIHJhdGlvIChpLmUuIHNpemUgZm9yIHNjcmVlbilcbiAgaWYgKHR5cGVvZiBzZXR0aW5ncy5waXhlbFJhdGlvID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShzZXR0aW5ncy5waXhlbFJhdGlvKSkge1xuICAgIC8vIFdoZW4geyBwaXhlbFJhdGlvIH0gaXMgc3BlY2lmaWVkLCBpdCdzIGFsc28gdXNlZCBhcyBkZWZhdWx0IGV4cG9ydFBpeGVsUmF0aW8uXG4gICAgcGl4ZWxSYXRpbyA9IHNldHRpbmdzLnBpeGVsUmF0aW87XG4gICAgZXhwb3J0UGl4ZWxSYXRpbyA9IGRlZmluZWQoc2V0dGluZ3MuZXhwb3J0UGl4ZWxSYXRpbywgcGl4ZWxSYXRpbyk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGhhc0RpbWVuc2lvbnMpIHtcbiAgICAgIC8vIFdoZW4gYSBkaW1lbnNpb24gaXMgc3BlY2lmaWVkLCB1c2UgdGhlIGJhc2UgcmF0aW8gcmF0aGVyIHRoYW4gc2NyZWVuIHJhdGlvXG4gICAgICBwaXhlbFJhdGlvID0gYmFzZVBpeGVsUmF0aW87XG4gICAgICAvLyBEZWZhdWx0IHRvIGEgcGl4ZWwgcmF0aW8gb2YgMSBzbyB0aGF0IHlvdSBlbmQgdXAgd2l0aCB0aGUgc2FtZSBkaW1lbnNpb25cbiAgICAgIC8vIHlvdSBzcGVjaWZpZWQsIGkuZS4gWyA1MDAsIDUwMCBdIGlzIGV4cG9ydGVkIGFzIDUwMHg1MDAgcHhcbiAgICAgIGV4cG9ydFBpeGVsUmF0aW8gPSBkZWZpbmVkKHNldHRpbmdzLmV4cG9ydFBpeGVsUmF0aW8sIDEpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBkaW1lbnNpb24gaXMgc3BlY2lmaWVkLCBhc3N1bWUgZnVsbC1zY3JlZW4gc2l6aW5nXG4gICAgICBwaXhlbFJhdGlvID0gZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgIC8vIERlZmF1bHQgdG8gc2NyZWVuIHBpeGVsIHJhdGlvLCBzbyB0aGF0IGl0J3MgbGlrZSB0YWtpbmcgYSBkZXZpY2Ugc2NyZWVuc2hvdFxuICAgICAgZXhwb3J0UGl4ZWxSYXRpbyA9IGRlZmluZWQoc2V0dGluZ3MuZXhwb3J0UGl4ZWxSYXRpbywgcGl4ZWxSYXRpbyk7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2xhbXAgcGl4ZWwgcmF0aW9cbiAgaWYgKHR5cGVvZiBzZXR0aW5ncy5tYXhQaXhlbFJhdGlvID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShzZXR0aW5ncy5tYXhQaXhlbFJhdGlvKSkge1xuICAgIHBpeGVsUmF0aW8gPSBNYXRoLm1pbihzZXR0aW5ncy5tYXhQaXhlbFJhdGlvLCBwaXhlbFJhdGlvKTtcbiAgICBleHBvcnRQaXhlbFJhdGlvID0gTWF0aC5taW4oc2V0dGluZ3MubWF4UGl4ZWxSYXRpbywgZXhwb3J0UGl4ZWxSYXRpbyk7XG4gIH1cblxuICAvLyBIYW5kbGUgZXhwb3J0IHBpeGVsIHJhdGlvXG4gIGlmIChleHBvcnRpbmcpIHtcbiAgICBwaXhlbFJhdGlvID0gZXhwb3J0UGl4ZWxSYXRpbztcbiAgfVxuXG4gIC8vIHBhcmVudFdpZHRoID0gdHlwZW9mIHBhcmVudFdpZHRoID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHROb2RlU2l6ZVswXSA6IHBhcmVudFdpZHRoO1xuICAvLyBwYXJlbnRIZWlnaHQgPSB0eXBlb2YgcGFyZW50SGVpZ2h0ID09PSAndW5kZWZpbmVkJyA/IGRlZmF1bHROb2RlU2l6ZVsxXSA6IHBhcmVudEhlaWdodDtcblxuICBsZXQgWyBwYXJlbnRXaWR0aCwgcGFyZW50SGVpZ2h0IF0gPSBnZXRQYXJlbnRTaXplKHByb3BzLCBzZXR0aW5ncyk7XG4gIGxldCB0cmltV2lkdGgsIHRyaW1IZWlnaHQ7XG5cbiAgLy8gWW91IGNhbiBzcGVjaWZ5IGEgZGltZW5zaW9ucyBpbiBwaXhlbHMgb3IgY20vbS9pbi9ldGNcbiAgaWYgKGhhc0RpbWVuc2lvbnMpIHtcbiAgICBjb25zdCByZXN1bHQgPSBnZXREaW1lbnNpb25zRnJvbVByZXNldChkaW1lbnNpb25zLCB1bml0cywgcGl4ZWxzUGVySW5jaCk7XG4gICAgY29uc3QgaGlnaGVzdCA9IE1hdGgubWF4KHJlc3VsdFswXSwgcmVzdWx0WzFdKTtcbiAgICBjb25zdCBsb3dlc3QgPSBNYXRoLm1pbihyZXN1bHRbMF0sIHJlc3VsdFsxXSk7XG4gICAgaWYgKHNldHRpbmdzLm9yaWVudGF0aW9uKSB7XG4gICAgICBjb25zdCBsYW5kc2NhcGUgPSBzZXR0aW5ncy5vcmllbnRhdGlvbiA9PT0gJ2xhbmRzY2FwZSc7XG4gICAgICB3aWR0aCA9IGxhbmRzY2FwZSA/IGhpZ2hlc3QgOiBsb3dlc3Q7XG4gICAgICBoZWlnaHQgPSBsYW5kc2NhcGUgPyBsb3dlc3QgOiBoaWdoZXN0O1xuICAgIH0gZWxzZSB7XG4gICAgICB3aWR0aCA9IHJlc3VsdFswXTtcbiAgICAgIGhlaWdodCA9IHJlc3VsdFsxXTtcbiAgICB9XG5cbiAgICB0cmltV2lkdGggPSB3aWR0aDtcbiAgICB0cmltSGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgLy8gQXBwbHkgYmxlZWQgd2hpY2ggaXMgYXNzdW1lZCB0byBiZSBpbiB0aGUgc2FtZSB1bml0c1xuICAgIHdpZHRoICs9IGJsZWVkICogMjtcbiAgICBoZWlnaHQgKz0gYmxlZWQgKiAyO1xuICB9IGVsc2Uge1xuICAgIHdpZHRoID0gcGFyZW50V2lkdGg7XG4gICAgaGVpZ2h0ID0gcGFyZW50SGVpZ2h0O1xuICAgIHRyaW1XaWR0aCA9IHdpZHRoO1xuICAgIHRyaW1IZWlnaHQgPSBoZWlnaHQ7XG4gIH1cblxuICAvLyBSZWFsIHNpemUgaW4gcGl4ZWxzIGFmdGVyIFBQSSBpcyB0YWtlbiBpbnRvIGFjY291bnRcbiAgbGV0IHJlYWxXaWR0aCA9IHdpZHRoO1xuICBsZXQgcmVhbEhlaWdodCA9IGhlaWdodDtcbiAgaWYgKGhhc0RpbWVuc2lvbnMgJiYgdW5pdHMpIHtcbiAgICAvLyBDb252ZXJ0IHRvIGRpZ2l0YWwvcGl4ZWwgdW5pdHMgaWYgbmVjZXNzYXJ5XG4gICAgcmVhbFdpZHRoID0gY29udmVydERpc3RhbmNlKHdpZHRoLCB1bml0cywgJ3B4JywgcGl4ZWxzUGVySW5jaCk7XG4gICAgcmVhbEhlaWdodCA9IGNvbnZlcnREaXN0YW5jZShoZWlnaHQsIHVuaXRzLCAncHgnLCBwaXhlbHNQZXJJbmNoKTtcbiAgfVxuXG4gIC8vIEhvdyBiaWcgdG8gc2V0IHRoZSAndmlldycgb2YgdGhlIGNhbnZhcyBpbiB0aGUgYnJvd3NlciAoaS5lLiBzdHlsZSlcbiAgc3R5bGVXaWR0aCA9IE1hdGgucm91bmQocmVhbFdpZHRoKTtcbiAgc3R5bGVIZWlnaHQgPSBNYXRoLnJvdW5kKHJlYWxIZWlnaHQpO1xuXG4gIC8vIElmIHdlIHdpc2ggdG8gc2NhbGUgdGhlIHZpZXcgdG8gdGhlIGJyb3dzZXIgd2luZG93XG4gIGlmIChzY2FsZVRvRml0ICYmICFleHBvcnRpbmcgJiYgaGFzRGltZW5zaW9ucykge1xuICAgIGNvbnN0IGFzcGVjdCA9IHdpZHRoIC8gaGVpZ2h0O1xuICAgIGNvbnN0IHdpbmRvd0FzcGVjdCA9IHBhcmVudFdpZHRoIC8gcGFyZW50SGVpZ2h0O1xuICAgIGNvbnN0IHNjYWxlVG9GaXRQYWRkaW5nID0gZGVmaW5lZChzZXR0aW5ncy5zY2FsZVRvRml0UGFkZGluZywgNDApO1xuICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5yb3VuZChwYXJlbnRXaWR0aCAtIHNjYWxlVG9GaXRQYWRkaW5nICogMik7XG4gICAgY29uc3QgbWF4SGVpZ2h0ID0gTWF0aC5yb3VuZChwYXJlbnRIZWlnaHQgLSBzY2FsZVRvRml0UGFkZGluZyAqIDIpO1xuICAgIGlmIChzdHlsZVdpZHRoID4gbWF4V2lkdGggfHwgc3R5bGVIZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgIGlmICh3aW5kb3dBc3BlY3QgPiBhc3BlY3QpIHtcbiAgICAgICAgc3R5bGVIZWlnaHQgPSBtYXhIZWlnaHQ7XG4gICAgICAgIHN0eWxlV2lkdGggPSBNYXRoLnJvdW5kKHN0eWxlSGVpZ2h0ICogYXNwZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0eWxlV2lkdGggPSBtYXhXaWR0aDtcbiAgICAgICAgc3R5bGVIZWlnaHQgPSBNYXRoLnJvdW5kKHN0eWxlV2lkdGggLyBhc3BlY3QpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNhbnZhc1dpZHRoID0gc2NhbGVUb1ZpZXcgPyBNYXRoLnJvdW5kKHBpeGVsUmF0aW8gKiBzdHlsZVdpZHRoKSA6IE1hdGgucm91bmQocGl4ZWxSYXRpbyAqIHJlYWxXaWR0aCk7XG4gIGNhbnZhc0hlaWdodCA9IHNjYWxlVG9WaWV3ID8gTWF0aC5yb3VuZChwaXhlbFJhdGlvICogc3R5bGVIZWlnaHQpIDogTWF0aC5yb3VuZChwaXhlbFJhdGlvICogcmVhbEhlaWdodCk7XG5cbiAgY29uc3Qgdmlld3BvcnRXaWR0aCA9IHNjYWxlVG9WaWV3ID8gTWF0aC5yb3VuZChzdHlsZVdpZHRoKSA6IE1hdGgucm91bmQocmVhbFdpZHRoKTtcbiAgY29uc3Qgdmlld3BvcnRIZWlnaHQgPSBzY2FsZVRvVmlldyA/IE1hdGgucm91bmQoc3R5bGVIZWlnaHQpIDogTWF0aC5yb3VuZChyZWFsSGVpZ2h0KTtcblxuICBjb25zdCBzY2FsZVggPSBjYW52YXNXaWR0aCAvIHdpZHRoO1xuICBjb25zdCBzY2FsZVkgPSBjYW52YXNIZWlnaHQgLyBoZWlnaHQ7XG5cbiAgLy8gQXNzaWduIHRvIGN1cnJlbnQgcHJvcHNcbiAgcmV0dXJuIHtcbiAgICBibGVlZCxcbiAgICBwaXhlbFJhdGlvLFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBkaW1lbnNpb25zOiBbIHdpZHRoLCBoZWlnaHQgXSxcbiAgICB1bml0czogdW5pdHMgfHwgJ3B4JyxcbiAgICBzY2FsZVgsXG4gICAgc2NhbGVZLFxuICAgIHZpZXdwb3J0V2lkdGgsXG4gICAgdmlld3BvcnRIZWlnaHQsXG4gICAgY2FudmFzV2lkdGgsXG4gICAgY2FudmFzSGVpZ2h0LFxuICAgIHRyaW1XaWR0aCxcbiAgICB0cmltSGVpZ2h0LFxuICAgIHN0eWxlV2lkdGgsXG4gICAgc3R5bGVIZWlnaHRcbiAgfTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZ2V0Q2FudmFzQ29udGV4dFxuZnVuY3Rpb24gZ2V0Q2FudmFzQ29udGV4dCAodHlwZSwgb3B0cykge1xuICBpZiAodHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzcGVjaWZ5IHR5cGUgc3RyaW5nJylcbiAgfVxuXG4gIG9wdHMgPSBvcHRzIHx8IHt9XG5cbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gJ3VuZGVmaW5lZCcgJiYgIW9wdHMuY2FudmFzKSB7XG4gICAgcmV0dXJuIG51bGwgLy8gY2hlY2sgZm9yIE5vZGVcbiAgfVxuXG4gIHZhciBjYW52YXMgPSBvcHRzLmNhbnZhcyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxuICBpZiAodHlwZW9mIG9wdHMud2lkdGggPT09ICdudW1iZXInKSB7XG4gICAgY2FudmFzLndpZHRoID0gb3B0cy53aWR0aFxuICB9XG4gIGlmICh0eXBlb2Ygb3B0cy5oZWlnaHQgPT09ICdudW1iZXInKSB7XG4gICAgY2FudmFzLmhlaWdodCA9IG9wdHMuaGVpZ2h0XG4gIH1cblxuICB2YXIgYXR0cmlicyA9IG9wdHNcbiAgdmFyIGdsXG4gIHRyeSB7XG4gICAgdmFyIG5hbWVzID0gWyB0eXBlIF1cbiAgICAvLyBwcmVmaXggR0wgY29udGV4dHNcbiAgICBpZiAodHlwZS5pbmRleE9mKCd3ZWJnbCcpID09PSAwKSB7XG4gICAgICBuYW1lcy5wdXNoKCdleHBlcmltZW50YWwtJyArIHR5cGUpXG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgZ2wgPSBjYW52YXMuZ2V0Q29udGV4dChuYW1lc1tpXSwgYXR0cmlicylcbiAgICAgIGlmIChnbCkgcmV0dXJuIGdsXG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgZ2wgPSBudWxsXG4gIH1cbiAgcmV0dXJuIChnbCB8fCBudWxsKSAvLyBlbnN1cmUgbnVsbCBvbiBmYWlsXG59XG4iLCJpbXBvcnQgYXNzaWduIGZyb20gJ29iamVjdC1hc3NpZ24nO1xuaW1wb3J0IGdldENhbnZhc0NvbnRleHQgZnJvbSAnZ2V0LWNhbnZhcy1jb250ZXh0JztcbmltcG9ydCB7IGlzQnJvd3NlciB9IGZyb20gJy4uL3V0aWwnO1xuXG5mdW5jdGlvbiBjcmVhdGVDYW52YXNFbGVtZW50ICgpIHtcbiAgaWYgKCFpc0Jyb3dzZXIoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSXQgYXBwZWFycyB5b3UgYXJlIHJ1bmluZyBmcm9tIE5vZGUuanMgb3IgYSBub24tYnJvd3NlciBlbnZpcm9ubWVudC4gVHJ5IHBhc3NpbmcgaW4gYW4gZXhpc3RpbmcgeyBjYW52YXMgfSBpbnRlcmZhY2UgaW5zdGVhZC4nKTtcbiAgfVxuICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZUNhbnZhcyAoc2V0dGluZ3MgPSB7fSkge1xuICBsZXQgY29udGV4dCwgY2FudmFzO1xuICBsZXQgb3duc0NhbnZhcyA9IGZhbHNlO1xuICBpZiAoc2V0dGluZ3MuY2FudmFzICE9PSBmYWxzZSkge1xuICAgIC8vIERldGVybWluZSB0aGUgY2FudmFzIGFuZCBjb250ZXh0IHRvIGNyZWF0ZVxuICAgIGNvbnRleHQgPSBzZXR0aW5ncy5jb250ZXh0O1xuICAgIGlmICghY29udGV4dCB8fCB0eXBlb2YgY29udGV4dCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxldCBuZXdDYW52YXMgPSBzZXR0aW5ncy5jYW52YXM7XG4gICAgICBpZiAoIW5ld0NhbnZhcykge1xuICAgICAgICBuZXdDYW52YXMgPSBjcmVhdGVDYW52YXNFbGVtZW50KCk7XG4gICAgICAgIG93bnNDYW52YXMgPSB0cnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgdHlwZSA9IGNvbnRleHQgfHwgJzJkJztcbiAgICAgIGlmICh0eXBlb2YgbmV3Q2FudmFzLmdldENvbnRleHQgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBUaGUgc3BlY2lmaWVkIHsgY2FudmFzIH0gZWxlbWVudCBkb2VzIG5vdCBoYXZlIGEgZ2V0Q29udGV4dCgpIGZ1bmN0aW9uLCBtYXliZSBpdCBpcyBub3QgYSA8Y2FudmFzPiB0YWc/YCk7XG4gICAgICB9XG4gICAgICBjb250ZXh0ID0gZ2V0Q2FudmFzQ29udGV4dCh0eXBlLCBhc3NpZ24oe30sIHNldHRpbmdzLmF0dHJpYnV0ZXMsIHsgY2FudmFzOiBuZXdDYW52YXMgfSkpO1xuICAgICAgaWYgKCFjb250ZXh0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIGF0IGNhbnZhcy5nZXRDb250ZXh0KCcke3R5cGV9JykgLSB0aGUgYnJvd3NlciBtYXkgbm90IHN1cHBvcnQgdGhpcyBjb250ZXh0LCBvciBhIGRpZmZlcmVudCBjb250ZXh0IG1heSBhbHJlYWR5IGJlIGluIHVzZSB3aXRoIHRoaXMgY2FudmFzLmApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNhbnZhcyA9IGNvbnRleHQuY2FudmFzO1xuICAgIC8vIEVuc3VyZSBjb250ZXh0IG1hdGNoZXMgdXNlcidzIGNhbnZhcyBleHBlY3RhdGlvbnNcbiAgICBpZiAoc2V0dGluZ3MuY2FudmFzICYmIGNhbnZhcyAhPT0gc2V0dGluZ3MuY2FudmFzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RoZSB7IGNhbnZhcyB9IGFuZCB7IGNvbnRleHQgfSBzZXR0aW5ncyBtdXN0IHBvaW50IHRvIHRoZSBzYW1lIHVuZGVybHlpbmcgY2FudmFzIGVsZW1lbnQnKTtcbiAgICB9XG5cbiAgICAvLyBBcHBseSBwaXhlbGF0aW9uIHRvIGNhbnZhcyBpZiBuZWNlc3NhcnksIHRoaXMgaXMgbW9zdGx5IGEgY29udmVuaWVuY2UgdXRpbGl0eVxuICAgIGlmIChzZXR0aW5ncy5waXhlbGF0ZWQpIHtcbiAgICAgIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgICBjb250ZXh0Lm1vekltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgY29udGV4dC5vSW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgICBjb250ZXh0LndlYmtpdEltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgY29udGV4dC5tc0ltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuICAgICAgY2FudmFzLnN0eWxlWydpbWFnZS1yZW5kZXJpbmcnXSA9ICdwaXhlbGF0ZWQnO1xuICAgIH1cbiAgfVxuICByZXR1cm4geyBjYW52YXMsIGNvbnRleHQsIG93bnNDYW52YXMgfTtcbn1cbiIsImltcG9ydCBkZWZpbmVkIGZyb20gJ2RlZmluZWQnO1xuaW1wb3J0IGFzc2lnbiBmcm9tICdvYmplY3QtYXNzaWduJztcbmltcG9ydCByaWdodE5vdyBmcm9tICdyaWdodC1ub3cnO1xuaW1wb3J0IGlzUHJvbWlzZSBmcm9tICdpcy1wcm9taXNlJztcbmltcG9ydCB7IGlzQnJvd3NlciwgaXNXZWJHTENvbnRleHQsIGlzQ2FudmFzLCBnZXRDbGllbnRBUEkgfSBmcm9tICcuLi91dGlsJztcbmltcG9ydCBkZWVwRXF1YWwgZnJvbSAnZGVlcC1lcXVhbCc7XG5pbXBvcnQgeyBzYXZlRmlsZSwgc2F2ZURhdGFVUkwsIGdldEZpbGVOYW1lLCBleHBvcnRDYW52YXMgfSBmcm9tICcuLi9zYXZlJztcbmltcG9ydCB7IGNoZWNrU2V0dGluZ3MgfSBmcm9tICcuLi9hY2Nlc3NpYmlsaXR5JztcblxuaW1wb3J0IGtleWJvYXJkU2hvcnRjdXRzIGZyb20gJy4va2V5Ym9hcmRTaG9ydGN1dHMnO1xuaW1wb3J0IHJlc2l6ZUNhbnZhcyBmcm9tICcuL3Jlc2l6ZUNhbnZhcyc7XG5pbXBvcnQgY3JlYXRlQ2FudmFzIGZyb20gJy4vY3JlYXRlQ2FudmFzJztcblxuY2xhc3MgU2tldGNoTWFuYWdlciB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLl9zZXR0aW5ncyA9IHt9O1xuICAgIHRoaXMuX3Byb3BzID0ge307XG4gICAgdGhpcy5fc2tldGNoID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX3JhZiA9IG51bGw7XG5cbiAgICAvLyBTb21lIGhhY2t5IHRoaW5ncyByZXF1aXJlZCB0byBnZXQgYXJvdW5kIHA1LmpzIHN0cnVjdHVyZVxuICAgIHRoaXMuX2xhc3RSZWRyYXdSZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5faXNQNVJlc2l6aW5nID0gZmFsc2U7XG5cbiAgICB0aGlzLl9rZXlib2FyZFNob3J0Y3V0cyA9IGtleWJvYXJkU2hvcnRjdXRzKHtcbiAgICAgIGVuYWJsZWQ6ICgpID0+IHRoaXMuc2V0dGluZ3MuaG90a2V5cyAhPT0gZmFsc2UsXG4gICAgICBzYXZlOiAoZXYpID0+IHtcbiAgICAgICAgaWYgKGV2LnNoaWZ0S2V5KSB7XG4gICAgICAgICAgaWYgKHRoaXMucHJvcHMucmVjb3JkaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmVuZFJlY29yZCgpO1xuICAgICAgICAgICAgdGhpcy5ydW4oKTtcbiAgICAgICAgICB9IGVsc2UgdGhpcy5yZWNvcmQoKTtcbiAgICAgICAgfSBlbHNlIHRoaXMuZXhwb3J0RnJhbWUoKTtcbiAgICAgIH0sXG4gICAgICB0b2dnbGVQbGF5OiAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnByb3BzLnBsYXlpbmcpIHRoaXMucGF1c2UoKTtcbiAgICAgICAgZWxzZSB0aGlzLnBsYXkoKTtcbiAgICAgIH0sXG4gICAgICBjb21taXQ6IChldikgPT4ge1xuICAgICAgICB0aGlzLmV4cG9ydEZyYW1lKHsgY29tbWl0OiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5fYW5pbWF0ZUhhbmRsZXIgPSAoKSA9PiB0aGlzLmFuaW1hdGUoKTtcblxuICAgIHRoaXMuX3Jlc2l6ZUhhbmRsZXIgPSAoKSA9PiB7XG4gICAgICBjb25zdCBjaGFuZ2VkID0gdGhpcy5yZXNpemUoKTtcbiAgICAgIC8vIE9ubHkgcmUtcmVuZGVyIHdoZW4gc2l6ZSBhY3R1YWxseSBjaGFuZ2VzXG4gICAgICBpZiAoY2hhbmdlZCkge1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBnZXQgc2tldGNoICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2tldGNoO1xuICB9XG5cbiAgZ2V0IHNldHRpbmdzICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2V0dGluZ3M7XG4gIH1cblxuICBnZXQgcHJvcHMgKCkge1xuICAgIHJldHVybiB0aGlzLl9wcm9wcztcbiAgfVxuXG4gIF9jb21wdXRlUGxheWhlYWQgKGN1cnJlbnRUaW1lLCBkdXJhdGlvbikge1xuICAgIGNvbnN0IGhhc0R1cmF0aW9uID0gdHlwZW9mIGR1cmF0aW9uID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShkdXJhdGlvbik7XG4gICAgcmV0dXJuIGhhc0R1cmF0aW9uID8gY3VycmVudFRpbWUgLyBkdXJhdGlvbiA6IDA7XG4gIH1cblxuICBfY29tcHV0ZUZyYW1lIChwbGF5aGVhZCwgdGltZSwgdG90YWxGcmFtZXMsIGZwcykge1xuICAgIHJldHVybiAoaXNGaW5pdGUodG90YWxGcmFtZXMpICYmIHRvdGFsRnJhbWVzID4gMSlcbiAgICAgID8gTWF0aC5mbG9vcihwbGF5aGVhZCAqICh0b3RhbEZyYW1lcyAtIDEpKVxuICAgICAgOiBNYXRoLmZsb29yKGZwcyAqIHRpbWUpO1xuICB9XG5cbiAgX2NvbXB1dGVDdXJyZW50RnJhbWUgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21wdXRlRnJhbWUoXG4gICAgICB0aGlzLnByb3BzLnBsYXloZWFkLCB0aGlzLnByb3BzLnRpbWUsXG4gICAgICB0aGlzLnByb3BzLnRvdGFsRnJhbWVzLCB0aGlzLnByb3BzLmZwc1xuICAgICk7XG4gIH1cblxuICBfZ2V0U2l6ZVByb3BzICgpIHtcbiAgICBjb25zdCBwcm9wcyA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIHtcbiAgICAgIHdpZHRoOiBwcm9wcy53aWR0aCxcbiAgICAgIGhlaWdodDogcHJvcHMuaGVpZ2h0LFxuICAgICAgcGl4ZWxSYXRpbzogcHJvcHMucGl4ZWxSYXRpbyxcbiAgICAgIGNhbnZhc1dpZHRoOiBwcm9wcy5jYW52YXNXaWR0aCxcbiAgICAgIGNhbnZhc0hlaWdodDogcHJvcHMuY2FudmFzSGVpZ2h0LFxuICAgICAgdmlld3BvcnRXaWR0aDogcHJvcHMudmlld3BvcnRXaWR0aCxcbiAgICAgIHZpZXdwb3J0SGVpZ2h0OiBwcm9wcy52aWV3cG9ydEhlaWdodFxuICAgIH07XG4gIH1cblxuICBydW4gKCkge1xuICAgIGlmICghdGhpcy5za2V0Y2gpIHRocm93IG5ldyBFcnJvcignc2hvdWxkIHdhaXQgdW50aWwgc2tldGNoIGlzIGxvYWRlZCBiZWZvcmUgdHJ5aW5nIHRvIHBsYXkoKScpO1xuXG4gICAgLy8gU3RhcnQgYW4gYW5pbWF0aW9uIGZyYW1lIGxvb3AgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKHRoaXMuc2V0dGluZ3MucGxheWluZyAhPT0gZmFsc2UpIHtcbiAgICAgIHRoaXMucGxheSgpO1xuICAgIH1cblxuICAgIC8vIExldCdzIGxldCB0aGlzIHdhcm5pbmcgaGFuZyBhcm91bmQgZm9yIGEgZmV3IHZlcnNpb25zLi4uXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNrZXRjaC5kaXNwb3NlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0luIGNhbnZhcy1za2V0Y2hAMC4wLjIzIHRoZSBkaXNwb3NlKCkgZXZlbnQgaGFzIGJlZW4gcmVuYW1lZCB0byB1bmxvYWQoKScpO1xuICAgIH1cblxuICAgIC8vIEluIGNhc2Ugd2UgYXJlbid0IHBsYXlpbmcgb3IgYW5pbWF0ZWQsIG1ha2Ugc3VyZSB3ZSBzdGlsbCB0cmlnZ2VyIGJlZ2luIG1lc3NhZ2UuLi5cbiAgICBpZiAoIXRoaXMucHJvcHMuc3RhcnRlZCkge1xuICAgICAgdGhpcy5fc2lnbmFsQmVnaW4oKTtcbiAgICAgIHRoaXMucHJvcHMuc3RhcnRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGFuIGluaXRpYWwgZnJhbWVcbiAgICB0aGlzLnRpY2soKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcGxheSAoKSB7XG4gICAgbGV0IGFuaW1hdGUgPSB0aGlzLnNldHRpbmdzLmFuaW1hdGU7XG4gICAgaWYgKCdhbmltYXRpb24nIGluIHRoaXMuc2V0dGluZ3MpIHtcbiAgICAgIGFuaW1hdGUgPSB0cnVlO1xuICAgICAgY29uc29sZS53YXJuKCdbY2FudmFzLXNrZXRjaF0geyBhbmltYXRpb24gfSBoYXMgYmVlbiByZW5hbWVkIHRvIHsgYW5pbWF0ZSB9Jyk7XG4gICAgfVxuICAgIGlmICghYW5pbWF0ZSkgcmV0dXJuO1xuICAgIGlmICghaXNCcm93c2VyKCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXMtc2tldGNoXSBXQVJOOiBVc2luZyB7IGFuaW1hdGUgfSBpbiBOb2RlLmpzIGlzIG5vdCB5ZXQgc3VwcG9ydGVkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLnBsYXlpbmcpIHJldHVybjtcbiAgICBpZiAoIXRoaXMucHJvcHMuc3RhcnRlZCkge1xuICAgICAgdGhpcy5fc2lnbmFsQmVnaW4oKTtcbiAgICAgIHRoaXMucHJvcHMuc3RhcnRlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gY29uc29sZS5sb2coJ3BsYXknLCB0aGlzLnByb3BzLnRpbWUpXG5cbiAgICAvLyBTdGFydCBhIHJlbmRlciBsb29wXG4gICAgdGhpcy5wcm9wcy5wbGF5aW5nID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5fcmFmICE9IG51bGwpIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9yYWYpO1xuICAgIHRoaXMuX2xhc3RUaW1lID0gcmlnaHROb3coKTtcbiAgICB0aGlzLl9yYWYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2FuaW1hdGVIYW5kbGVyKTtcbiAgfVxuXG4gIHBhdXNlICgpIHtcbiAgICBpZiAodGhpcy5wcm9wcy5yZWNvcmRpbmcpIHRoaXMuZW5kUmVjb3JkKCk7XG4gICAgdGhpcy5wcm9wcy5wbGF5aW5nID0gZmFsc2U7XG5cbiAgICBpZiAodGhpcy5fcmFmICE9IG51bGwgJiYgaXNCcm93c2VyKCkpIHtcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLl9yYWYpO1xuICAgIH1cbiAgfVxuXG4gIHRvZ2dsZVBsYXkgKCkge1xuICAgIGlmICh0aGlzLnByb3BzLnBsYXlpbmcpIHRoaXMucGF1c2UoKTtcbiAgICBlbHNlIHRoaXMucGxheSgpO1xuICB9XG5cbiAgLy8gU3RvcCBhbmQgcmVzZXQgdG8gZnJhbWUgemVyb1xuICBzdG9wICgpIHtcbiAgICB0aGlzLnBhdXNlKCk7XG4gICAgdGhpcy5wcm9wcy5mcmFtZSA9IDA7XG4gICAgdGhpcy5wcm9wcy5wbGF5aGVhZCA9IDA7XG4gICAgdGhpcy5wcm9wcy50aW1lID0gMDtcbiAgICB0aGlzLnByb3BzLmRlbHRhVGltZSA9IDA7XG4gICAgdGhpcy5wcm9wcy5zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHJlY29yZCAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMucmVjb3JkaW5nKSByZXR1cm47XG4gICAgaWYgKCFpc0Jyb3dzZXIoKSkge1xuICAgICAgY29uc29sZS5lcnJvcignW2NhbnZhcy1za2V0Y2hdIFdBUk46IFJlY29yZGluZyBmcm9tIE5vZGUuanMgaXMgbm90IHlldCBzdXBwb3J0ZWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3AoKTtcbiAgICB0aGlzLnByb3BzLnBsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMucHJvcHMucmVjb3JkaW5nID0gdHJ1ZTtcblxuICAgIGNvbnN0IGZyYW1lSW50ZXJ2YWwgPSAxIC8gdGhpcy5wcm9wcy5mcHM7XG4gICAgLy8gUmVuZGVyIGVhY2ggZnJhbWUgaW4gdGhlIHNlcXVlbmNlXG4gICAgaWYgKHRoaXMuX3JhZiAhPSBudWxsKSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5fcmFmKTtcbiAgICBjb25zdCB0aWNrID0gKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLnByb3BzLnJlY29yZGluZykgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgdGhpcy5wcm9wcy5kZWx0YVRpbWUgPSBmcmFtZUludGVydmFsO1xuICAgICAgdGhpcy50aWNrKCk7XG4gICAgICByZXR1cm4gdGhpcy5leHBvcnRGcmFtZSh7IHNlcXVlbmNlOiB0cnVlIH0pXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICBpZiAoIXRoaXMucHJvcHMucmVjb3JkaW5nKSByZXR1cm47IC8vIHdhcyBjYW5jZWxsZWQgYmVmb3JlXG4gICAgICAgICAgdGhpcy5wcm9wcy5kZWx0YVRpbWUgPSAwO1xuICAgICAgICAgIHRoaXMucHJvcHMuZnJhbWUrKztcbiAgICAgICAgICBpZiAodGhpcy5wcm9wcy5mcmFtZSA8IHRoaXMucHJvcHMudG90YWxGcmFtZXMpIHtcbiAgICAgICAgICAgIHRoaXMucHJvcHMudGltZSArPSBmcmFtZUludGVydmFsO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5wbGF5aGVhZCA9IHRoaXMuX2NvbXB1dGVQbGF5aGVhZCh0aGlzLnByb3BzLnRpbWUsIHRoaXMucHJvcHMuZHVyYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5fcmFmID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aWNrKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZpbmlzaGVkIHJlY29yZGluZycpO1xuICAgICAgICAgICAgdGhpcy5fc2lnbmFsRW5kKCk7XG4gICAgICAgICAgICB0aGlzLmVuZFJlY29yZCgpO1xuICAgICAgICAgICAgdGhpcy5zdG9wKCk7XG4gICAgICAgICAgICB0aGlzLnJ1bigpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIFRyaWdnZXIgYSBzdGFydCBldmVudCBiZWZvcmUgd2UgYmVnaW4gcmVjb3JkaW5nXG4gICAgaWYgKCF0aGlzLnByb3BzLnN0YXJ0ZWQpIHtcbiAgICAgIHRoaXMuX3NpZ25hbEJlZ2luKCk7XG4gICAgICB0aGlzLnByb3BzLnN0YXJ0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX3JhZiA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGljayk7XG4gIH1cblxuICBfc2lnbmFsQmVnaW4gKCkge1xuICAgIGlmICh0aGlzLnNrZXRjaCAmJiB0eXBlb2YgdGhpcy5za2V0Y2guYmVnaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuX3dyYXBDb250ZXh0U2NhbGUocHJvcHMgPT4gdGhpcy5za2V0Y2guYmVnaW4ocHJvcHMpKTtcbiAgICB9XG4gIH1cblxuICBfc2lnbmFsRW5kICgpIHtcbiAgICBpZiAodGhpcy5za2V0Y2ggJiYgdHlwZW9mIHRoaXMuc2tldGNoLmVuZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fd3JhcENvbnRleHRTY2FsZShwcm9wcyA9PiB0aGlzLnNrZXRjaC5lbmQocHJvcHMpKTtcbiAgICB9XG4gIH1cblxuICBlbmRSZWNvcmQgKCkge1xuICAgIGlmICh0aGlzLl9yYWYgIT0gbnVsbCAmJiBpc0Jyb3dzZXIoKSkgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuX3JhZik7XG4gICAgdGhpcy5wcm9wcy5yZWNvcmRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnByb3BzLmRlbHRhVGltZSA9IDA7XG4gICAgdGhpcy5wcm9wcy5wbGF5aW5nID0gZmFsc2U7XG4gIH1cblxuICBleHBvcnRGcmFtZSAob3B0ID0ge30pIHtcbiAgICBpZiAoIXRoaXMuc2tldGNoKSByZXR1cm4gUHJvbWlzZS5hbGwoW10pO1xuICAgIGlmICh0eXBlb2YgdGhpcy5za2V0Y2gucHJlRXhwb3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLnNrZXRjaC5wcmVFeHBvcnQoKTtcbiAgICB9XG5cbiAgICAvLyBPcHRpb25zIGZvciBleHBvcnQgZnVuY3Rpb25cbiAgICBsZXQgZXhwb3J0T3B0cyA9IGFzc2lnbih7XG4gICAgICBzZXF1ZW5jZTogb3B0LnNlcXVlbmNlLFxuICAgICAgZnJhbWU6IG9wdC5zZXF1ZW5jZSA/IHRoaXMucHJvcHMuZnJhbWUgOiB1bmRlZmluZWQsXG4gICAgICBmaWxlOiB0aGlzLnNldHRpbmdzLmZpbGUsXG4gICAgICBuYW1lOiB0aGlzLnNldHRpbmdzLm5hbWUsXG4gICAgICBwcmVmaXg6IHRoaXMuc2V0dGluZ3MucHJlZml4LFxuICAgICAgc3VmZml4OiB0aGlzLnNldHRpbmdzLnN1ZmZpeCxcbiAgICAgIGVuY29kaW5nOiB0aGlzLnNldHRpbmdzLmVuY29kaW5nLFxuICAgICAgZW5jb2RpbmdRdWFsaXR5OiB0aGlzLnNldHRpbmdzLmVuY29kaW5nUXVhbGl0eSxcbiAgICAgIHRpbWVTdGFtcDogZ2V0RmlsZU5hbWUoKSxcbiAgICAgIHRvdGFsRnJhbWVzOiBpc0Zpbml0ZSh0aGlzLnByb3BzLnRvdGFsRnJhbWVzKSA/IE1hdGgubWF4KDEwMCwgdGhpcy5wcm9wcy50b3RhbEZyYW1lcykgOiAxMDAwXG4gICAgfSk7XG5cbiAgICBjb25zdCBjbGllbnQgPSBnZXRDbGllbnRBUEkoKTtcbiAgICBsZXQgcCA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIGlmIChjbGllbnQgJiYgb3B0LmNvbW1pdCAmJiB0eXBlb2YgY2xpZW50LmNvbW1pdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc3QgY29tbWl0T3B0cyA9IGFzc2lnbih7fSwgZXhwb3J0T3B0cyk7XG4gICAgICBjb25zdCBoYXNoID0gY2xpZW50LmNvbW1pdChjb21taXRPcHRzKTtcbiAgICAgIGlmIChpc1Byb21pc2UoaGFzaCkpIHAgPSBoYXNoO1xuICAgICAgZWxzZSBwID0gUHJvbWlzZS5yZXNvbHZlKGhhc2gpO1xuICAgIH1cblxuICAgIHJldHVybiBwLnRoZW4oaGFzaCA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5fZG9FeHBvcnRGcmFtZShhc3NpZ24oe30sIGV4cG9ydE9wdHMsIHsgaGFzaDogaGFzaCB8fCAnJyB9KSk7XG4gICAgfSk7XG4gIH1cblxuICBfZG9FeHBvcnRGcmFtZSAoZXhwb3J0T3B0cyA9IHt9KSB7XG4gICAgdGhpcy5fcHJvcHMuZXhwb3J0aW5nID0gdHJ1ZTtcblxuICAgIC8vIFJlc2l6ZSB0byBvdXRwdXQgcmVzb2x1dGlvblxuICAgIHRoaXMucmVzaXplKCk7XG5cbiAgICAvLyBEcmF3IGF0IHRoaXMgb3V0cHV0IHJlc29sdXRpb25cbiAgICBsZXQgZHJhd1Jlc3VsdCA9IHRoaXMucmVuZGVyKCk7XG5cbiAgICAvLyBUaGUgc2VsZiBvd25lZCBjYW52YXMgKG1heSBiZSB1bmRlZmluZWQuLi4hKVxuICAgIGNvbnN0IGNhbnZhcyA9IHRoaXMucHJvcHMuY2FudmFzO1xuXG4gICAgLy8gR2V0IGxpc3Qgb2YgcmVzdWx0cyBmcm9tIHJlbmRlclxuICAgIGlmICh0eXBlb2YgZHJhd1Jlc3VsdCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGRyYXdSZXN1bHQgPSBbIGNhbnZhcyBdO1xuICAgIH1cbiAgICBkcmF3UmVzdWx0ID0gW10uY29uY2F0KGRyYXdSZXN1bHQpLmZpbHRlcihCb29sZWFuKTtcblxuICAgIC8vIFRyYW5zZm9ybSB0aGUgY2FudmFzL2ZpbGUgZGVzY3JpcHRvcnMgaW50byBhIGNvbnNpc3RlbnQgZm9ybWF0LFxuICAgIC8vIGFuZCBwdWxsIG91dCBhbnkgZGF0YSBVUkxzIGZyb20gY2FudmFzIGVsZW1lbnRzXG4gICAgZHJhd1Jlc3VsdCA9IGRyYXdSZXN1bHQubWFwKHJlc3VsdCA9PiB7XG4gICAgICBjb25zdCBoYXNEYXRhT2JqZWN0ID0gdHlwZW9mIHJlc3VsdCA9PT0gJ29iamVjdCcgJiYgcmVzdWx0ICYmICgnZGF0YScgaW4gcmVzdWx0IHx8ICdkYXRhVVJMJyBpbiByZXN1bHQpO1xuICAgICAgY29uc3QgZGF0YSA9IGhhc0RhdGFPYmplY3QgPyByZXN1bHQuZGF0YSA6IHJlc3VsdDtcbiAgICAgIGNvbnN0IG9wdHMgPSBoYXNEYXRhT2JqZWN0ID8gYXNzaWduKHt9LCByZXN1bHQsIHsgZGF0YSB9KSA6IHsgZGF0YSB9O1xuICAgICAgaWYgKGlzQ2FudmFzKGRhdGEpKSB7XG4gICAgICAgIGNvbnN0IGVuY29kaW5nID0gb3B0cy5lbmNvZGluZyB8fCBleHBvcnRPcHRzLmVuY29kaW5nO1xuICAgICAgICBjb25zdCBlbmNvZGluZ1F1YWxpdHkgPSBkZWZpbmVkKG9wdHMuZW5jb2RpbmdRdWFsaXR5LCBleHBvcnRPcHRzLmVuY29kaW5nUXVhbGl0eSwgMC45NSk7XG4gICAgICAgIGNvbnN0IHsgZGF0YVVSTCwgZXh0ZW5zaW9uLCB0eXBlIH0gPSBleHBvcnRDYW52YXMoZGF0YSwgeyBlbmNvZGluZywgZW5jb2RpbmdRdWFsaXR5IH0pO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmFzc2lnbihvcHRzLCB7IGRhdGFVUkwsIGV4dGVuc2lvbiwgdHlwZSB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBvcHRzO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gTm93IHJldHVybiB0byByZWd1bGFyIHJlbmRlcmluZyBtb2RlXG4gICAgdGhpcy5fcHJvcHMuZXhwb3J0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5yZXNpemUoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgLy8gQW5kIG5vdyB3ZSBjYW4gc2F2ZSBlYWNoIHJlc3VsdFxuICAgIHJldHVybiBQcm9taXNlLmFsbChkcmF3UmVzdWx0Lm1hcCgocmVzdWx0LCBpLCBsYXllckxpc3QpID0+IHtcbiAgICAgIC8vIEJ5IGRlZmF1bHQsIGlmIHJlbmRlcmluZyBtdWx0aXBsZSBsYXllcnMgd2Ugd2lsbCBnaXZlIHRoZW0gaW5kaWNlc1xuICAgICAgY29uc3QgY3VyT3B0ID0gYXNzaWduKHt9LCBleHBvcnRPcHRzLCByZXN1bHQsIHsgbGF5ZXI6IGksIHRvdGFsTGF5ZXJzOiBsYXllckxpc3QubGVuZ3RoIH0pO1xuICAgICAgY29uc3QgZGF0YSA9IHJlc3VsdC5kYXRhO1xuICAgICAgaWYgKHJlc3VsdC5kYXRhVVJMKSB7XG4gICAgICAgIGNvbnN0IGRhdGFVUkwgPSByZXN1bHQuZGF0YVVSTDtcbiAgICAgICAgZGVsZXRlIGN1ck9wdC5kYXRhVVJMOyAvLyBhdm9pZCBzZW5kaW5nIGVudGlyZSBiYXNlNjQgZGF0YSBhcm91bmRcbiAgICAgICAgcmV0dXJuIHNhdmVEYXRhVVJMKGRhdGFVUkwsIGN1ck9wdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gc2F2ZUZpbGUoZGF0YSwgY3VyT3B0KTtcbiAgICAgIH1cbiAgICB9KSkudGhlbihldiA9PiB7XG4gICAgICBpZiAoZXYubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBldmVudFdpdGhPdXRwdXQgPSBldi5maW5kKGUgPT4gZS5vdXRwdXROYW1lKTtcbiAgICAgICAgY29uc3QgaXNDbGllbnQgPSBldi5zb21lKGUgPT4gZS5jbGllbnQpO1xuICAgICAgICBsZXQgaXRlbTtcbiAgICAgICAgLy8gbWFueSBmaWxlcywganVzdCBsb2cgaG93IG1hbnkgd2VyZSBleHBvcnRlZFxuICAgICAgICBpZiAoZXYubGVuZ3RoID4gMSkgaXRlbSA9IGV2Lmxlbmd0aDtcbiAgICAgICAgLy8gaW4gQ0xJLCB3ZSBrbm93IGV4YWN0IHBhdGggZGlybmFtZVxuICAgICAgICBlbHNlIGlmIChldmVudFdpdGhPdXRwdXQpIGl0ZW0gPSBgJHtldmVudFdpdGhPdXRwdXQub3V0cHV0TmFtZX0vJHtldlswXS5maWxlbmFtZX1gO1xuICAgICAgICAvLyBpbiBicm93c2VyLCB3ZSBjYW4gb25seSBrbm93IGl0IHdlbnQgdG8gXCJicm93c2VyIGRvd25sb2FkIGZvbGRlclwiXG4gICAgICAgIGVsc2UgaXRlbSA9IGAke2V2WzBdLmZpbGVuYW1lfWA7XG4gICAgICAgIGxldCBvZlNlcSA9ICcnO1xuICAgICAgICBpZiAoZXhwb3J0T3B0cy5zZXF1ZW5jZSkge1xuICAgICAgICAgIGNvbnN0IGhhc1RvdGFsRnJhbWVzID0gaXNGaW5pdGUodGhpcy5wcm9wcy50b3RhbEZyYW1lcyk7XG4gICAgICAgICAgb2ZTZXEgPSBoYXNUb3RhbEZyYW1lcyA/IGAgKGZyYW1lICR7ZXhwb3J0T3B0cy5mcmFtZSArIDF9IC8gJHt0aGlzLnByb3BzLnRvdGFsRnJhbWVzfSlgIDogYCAoZnJhbWUgJHtleHBvcnRPcHRzLmZyYW1lfSlgO1xuICAgICAgICB9IGVsc2UgaWYgKGV2Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBvZlNlcSA9IGAgZmlsZXNgO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNsaWVudCA9IGlzQ2xpZW50ID8gJ2NhbnZhcy1za2V0Y2gtY2xpJyA6ICdjYW52YXMtc2tldGNoJztcbiAgICAgICAgY29uc29sZS5sb2coYCVjWyR7Y2xpZW50fV0lYyBFeHBvcnRlZCAlYyR7aXRlbX0lYyR7b2ZTZXF9YCwgJ2NvbG9yOiAjOGU4ZThlOycsICdjb2xvcjogaW5pdGlhbDsnLCAnZm9udC13ZWlnaHQ6IGJvbGQ7JywgJ2ZvbnQtd2VpZ2h0OiBpbml0aWFsOycpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLnNrZXRjaC5wb3N0RXhwb3J0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRoaXMuc2tldGNoLnBvc3RFeHBvcnQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIF93cmFwQ29udGV4dFNjYWxlIChjYikge1xuICAgIHRoaXMuX3ByZVJlbmRlcigpO1xuICAgIGNiKHRoaXMucHJvcHMpO1xuICAgIHRoaXMuX3Bvc3RSZW5kZXIoKTtcbiAgfVxuXG4gIF9wcmVSZW5kZXIgKCkge1xuICAgIGNvbnN0IHByb3BzID0gdGhpcy5wcm9wcztcblxuICAgIC8vIFNjYWxlIGNvbnRleHQgZm9yIHVuaXQgc2l6aW5nXG4gICAgaWYgKCF0aGlzLnByb3BzLmdsICYmIHByb3BzLmNvbnRleHQgJiYgIXByb3BzLnA1KSB7XG4gICAgICBwcm9wcy5jb250ZXh0LnNhdmUoKTtcbiAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNjYWxlQ29udGV4dCAhPT0gZmFsc2UpIHtcbiAgICAgICAgcHJvcHMuY29udGV4dC5zY2FsZShwcm9wcy5zY2FsZVgsIHByb3BzLnNjYWxlWSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcm9wcy5wNSkge1xuICAgICAgcHJvcHMucDUuc2NhbGUocHJvcHMuc2NhbGVYIC8gcHJvcHMucGl4ZWxSYXRpbywgcHJvcHMuc2NhbGVZIC8gcHJvcHMucGl4ZWxSYXRpbyk7XG4gICAgfVxuICB9XG5cbiAgX3Bvc3RSZW5kZXIgKCkge1xuICAgIGNvbnN0IHByb3BzID0gdGhpcy5wcm9wcztcblxuICAgIGlmICghdGhpcy5wcm9wcy5nbCAmJiBwcm9wcy5jb250ZXh0ICYmICFwcm9wcy5wNSkge1xuICAgICAgcHJvcHMuY29udGV4dC5yZXN0b3JlKCk7XG4gICAgfVxuXG4gICAgLy8gRmx1c2ggYnkgZGVmYXVsdCwgdGhpcyBtYXkgYmUgcmV2aXNpdGVkIGF0IGEgbGF0ZXIgcG9pbnQuXG4gICAgLy8gV2UgZG8gdGhpcyB0byBlbnN1cmUgdG9EYXRhVVJMIGNhbiBiZSBjYWxsZWQgaW1tZWRpYXRlbHkgYWZ0ZXIuXG4gICAgLy8gTW9zdCBsaWtlbHkgYnJvd3NlcnMgYWxyZWFkeSBoYW5kbGUgdGhpcywgc28gd2UgbWF5IHJldmlzaXQgdGhpcyBhbmRcbiAgICAvLyByZW1vdmUgaXQgaWYgaXQgaW1wcm92ZXMgcGVyZm9ybWFuY2Ugd2l0aG91dCBhbnkgdXNhYmlsaXR5IGlzc3Vlcy5cbiAgICBpZiAocHJvcHMuZ2wgJiYgdGhpcy5zZXR0aW5ncy5mbHVzaCAhPT0gZmFsc2UgJiYgIXByb3BzLnA1KSB7XG4gICAgICBwcm9wcy5nbC5mbHVzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHRpY2sgKCkge1xuICAgIGlmICh0aGlzLnNrZXRjaCAmJiB0eXBlb2YgdGhpcy5za2V0Y2gudGljayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fcHJlUmVuZGVyKCk7XG4gICAgICB0aGlzLnNrZXRjaC50aWNrKHRoaXMucHJvcHMpO1xuICAgICAgdGhpcy5fcG9zdFJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgaWYgKHRoaXMucHJvcHMucDUpIHtcbiAgICAgIHRoaXMuX2xhc3RSZWRyYXdSZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnByb3BzLnA1LnJlZHJhdygpO1xuICAgICAgcmV0dXJuIHRoaXMuX2xhc3RSZWRyYXdSZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLnN1Ym1pdERyYXdDYWxsKCk7XG4gICAgfVxuICB9XG5cbiAgc3VibWl0RHJhd0NhbGwgKCkge1xuICAgIGlmICghdGhpcy5za2V0Y2gpIHJldHVybjtcblxuICAgIGNvbnN0IHByb3BzID0gdGhpcy5wcm9wcztcbiAgICB0aGlzLl9wcmVSZW5kZXIoKTtcblxuICAgIGxldCBkcmF3UmVzdWx0O1xuXG4gICAgaWYgKHR5cGVvZiB0aGlzLnNrZXRjaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZHJhd1Jlc3VsdCA9IHRoaXMuc2tldGNoKHByb3BzKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGlzLnNrZXRjaC5yZW5kZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGRyYXdSZXN1bHQgPSB0aGlzLnNrZXRjaC5yZW5kZXIocHJvcHMpO1xuICAgIH1cblxuICAgIHRoaXMuX3Bvc3RSZW5kZXIoKTtcblxuICAgIHJldHVybiBkcmF3UmVzdWx0O1xuICB9XG5cbiAgdXBkYXRlIChvcHQgPSB7fSkge1xuICAgIC8vIEN1cnJlbnRseSB1cGRhdGUoKSBpcyBvbmx5IGZvY3VzZWQgb24gcmVzaXppbmcsXG4gICAgLy8gYnV0IGxhdGVyIHdlIHdpbGwgc3VwcG9ydCBvdGhlciBvcHRpb25zIGxpa2Ugc3dpdGNoaW5nXG4gICAgLy8gZnJhbWVzIGFuZCBzdWNoLlxuICAgIGNvbnN0IG5vdFlldFN1cHBvcnRlZCA9IFtcbiAgICAgICdhbmltYXRlJ1xuICAgIF07XG5cbiAgICBPYmplY3Qua2V5cyhvcHQpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChub3RZZXRTdXBwb3J0ZWQuaW5kZXhPZihrZXkpID49IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBTb3JyeSwgdGhlIHsgJHtrZXl9IH0gb3B0aW9uIGlzIG5vdCB5ZXQgc3VwcG9ydGVkIHdpdGggdXBkYXRlKCkuYCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBvbGRDYW52YXMgPSB0aGlzLl9zZXR0aW5ncy5jYW52YXM7XG4gICAgY29uc3Qgb2xkQ29udGV4dCA9IHRoaXMuX3NldHRpbmdzLmNvbnRleHQ7XG5cbiAgICAvLyBNZXJnZSBuZXcgb3B0aW9ucyBpbnRvIHNldHRpbmdzXG4gICAgZm9yIChsZXQga2V5IGluIG9wdCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBvcHRba2V5XTtcbiAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnKSB7IC8vIGlnbm9yZSB1bmRlZmluZWRcbiAgICAgICAgdGhpcy5fc2V0dGluZ3Nba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1lcmdlIGluIHRpbWUgcHJvcHNcbiAgICBjb25zdCB0aW1lT3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuX3NldHRpbmdzLCBvcHQpO1xuICAgIGlmICgndGltZScgaW4gb3B0ICYmICdmcmFtZScgaW4gb3B0KSB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBzaG91bGQgc3BlY2lmeSB7IHRpbWUgfSBvciB7IGZyYW1lIH0gYnV0IG5vdCBib3RoJyk7XG4gICAgZWxzZSBpZiAoJ3RpbWUnIGluIG9wdCkgZGVsZXRlIHRpbWVPcHRzLmZyYW1lO1xuICAgIGVsc2UgaWYgKCdmcmFtZScgaW4gb3B0KSBkZWxldGUgdGltZU9wdHMudGltZTtcbiAgICBpZiAoJ2R1cmF0aW9uJyBpbiBvcHQgJiYgJ3RvdGFsRnJhbWVzJyBpbiBvcHQpIHRocm93IG5ldyBFcnJvcignWW91IHNob3VsZCBzcGVjaWZ5IHsgZHVyYXRpb24gfSBvciB7IHRvdGFsRnJhbWVzIH0gYnV0IG5vdCBib3RoJyk7XG4gICAgZWxzZSBpZiAoJ2R1cmF0aW9uJyBpbiBvcHQpIGRlbGV0ZSB0aW1lT3B0cy50b3RhbEZyYW1lcztcbiAgICBlbHNlIGlmICgndG90YWxGcmFtZXMnIGluIG9wdCkgZGVsZXRlIHRpbWVPcHRzLmR1cmF0aW9uO1xuXG4gICAgLy8gTWVyZ2UgaW4gdXNlciBkYXRhIHdpdGhvdXQgY29weWluZ1xuICAgIGlmICgnZGF0YScgaW4gb3B0KSB0aGlzLl9wcm9wcy5kYXRhID0gb3B0LmRhdGE7XG5cbiAgICBjb25zdCB0aW1lUHJvcHMgPSB0aGlzLmdldFRpbWVQcm9wcyh0aW1lT3B0cyk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLl9wcm9wcywgdGltZVByb3BzKTtcblxuICAgIC8vIElmIGVpdGhlciBjYW52YXMgb3IgY29udGV4dCBpcyBjaGFuZ2VkLCB3ZSBzaG91bGQgcmUtdXBkYXRlXG4gICAgaWYgKG9sZENhbnZhcyAhPT0gdGhpcy5fc2V0dGluZ3MuY2FudmFzIHx8IG9sZENvbnRleHQgIT09IHRoaXMuX3NldHRpbmdzLmNvbnRleHQpIHtcbiAgICAgIGNvbnN0IHsgY2FudmFzLCBjb250ZXh0IH0gPSBjcmVhdGVDYW52YXModGhpcy5fc2V0dGluZ3MpO1xuXG4gICAgICB0aGlzLnByb3BzLmNhbnZhcyA9IGNhbnZhcztcbiAgICAgIHRoaXMucHJvcHMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgICAgIC8vIERlbGV0ZSBvciBhZGQgYSAnZ2wnIHByb3AgZm9yIGNvbnZlbmllbmNlXG4gICAgICB0aGlzLl9zZXR1cEdMS2V5KCk7XG5cbiAgICAgIC8vIFJlLW1vdW50IHRoZSBuZXcgY2FudmFzIGlmIGl0IGhhcyBubyBwYXJlbnRcbiAgICAgIHRoaXMuX2FwcGVuZENhbnZhc0lmTmVlZGVkKCk7XG4gICAgfVxuXG4gICAgLy8gU3BlY2lhbCBjYXNlIHRvIHN1cHBvcnQgUDUuanNcbiAgICBpZiAob3B0LnA1ICYmIHR5cGVvZiBvcHQucDUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMucHJvcHMucDUgPSBvcHQucDU7XG4gICAgICB0aGlzLnByb3BzLnA1LmRyYXcgPSAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9pc1A1UmVzaXppbmcpIHJldHVybjtcbiAgICAgICAgdGhpcy5fbGFzdFJlZHJhd1Jlc3VsdCA9IHRoaXMuc3VibWl0RHJhd0NhbGwoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIHBsYXlpbmcgc3RhdGUgaWYgbmVjZXNzYXJ5XG4gICAgaWYgKCdwbGF5aW5nJyBpbiBvcHQpIHtcbiAgICAgIGlmIChvcHQucGxheWluZykgdGhpcy5wbGF5KCk7XG4gICAgICBlbHNlIHRoaXMucGF1c2UoKTtcbiAgICB9XG5cbiAgICBjaGVja1NldHRpbmdzKHRoaXMuX3NldHRpbmdzKTtcblxuICAgIC8vIERyYXcgbmV3IGZyYW1lXG4gICAgdGhpcy5yZXNpemUoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHJldHVybiB0aGlzLnByb3BzO1xuICB9XG5cbiAgcmVzaXplICgpIHtcbiAgICBjb25zdCBvbGRTaXplcyA9IHRoaXMuX2dldFNpemVQcm9wcygpO1xuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnNldHRpbmdzO1xuICAgIGNvbnN0IHByb3BzID0gdGhpcy5wcm9wcztcblxuICAgIC8vIFJlY29tcHV0ZSBuZXcgcHJvcGVydGllcyBiYXNlZCBvbiBjdXJyZW50IHNldHVwXG4gICAgY29uc3QgbmV3UHJvcHMgPSByZXNpemVDYW52YXMocHJvcHMsIHNldHRpbmdzKTtcblxuICAgIC8vIEFzc2lnbiB0byBjdXJyZW50IHByb3BzXG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLl9wcm9wcywgbmV3UHJvcHMpO1xuXG4gICAgLy8gTm93IHdlIGFjdHVhbGx5IHVwZGF0ZSB0aGUgY2FudmFzIHdpZHRoL2hlaWdodCBhbmQgc3R5bGUgcHJvcHNcbiAgICBjb25zdCB7XG4gICAgICBwaXhlbFJhdGlvLFxuICAgICAgY2FudmFzV2lkdGgsXG4gICAgICBjYW52YXNIZWlnaHQsXG4gICAgICBzdHlsZVdpZHRoLFxuICAgICAgc3R5bGVIZWlnaHRcbiAgICB9ID0gdGhpcy5wcm9wcztcblxuICAgIC8vIFVwZGF0ZSBjYW52YXMgc2V0dGluZ3NcbiAgICBjb25zdCBjYW52YXMgPSB0aGlzLnByb3BzLmNhbnZhcztcbiAgICBpZiAoY2FudmFzICYmIHNldHRpbmdzLnJlc2l6ZUNhbnZhcyAhPT0gZmFsc2UpIHtcbiAgICAgIGlmIChwcm9wcy5wNSkge1xuICAgICAgICAvLyBQNS5qcyBzcGVjaWZpYyBlZGdlIGNhc2VcbiAgICAgICAgaWYgKGNhbnZhcy53aWR0aCAhPT0gY2FudmFzV2lkdGggfHwgY2FudmFzLmhlaWdodCAhPT0gY2FudmFzSGVpZ2h0KSB7XG4gICAgICAgICAgdGhpcy5faXNQNVJlc2l6aW5nID0gdHJ1ZTtcbiAgICAgICAgICAvLyBUaGlzIGNhdXNlcyBhIHJlLWRyYXcgOlxcIHNvIHdlIGlnbm9yZSBkcmF3cyBpbiB0aGUgbWVhbiB0aW1lLi4uIHNvcnRhIGhhY2t5XG4gICAgICAgICAgcHJvcHMucDUucGl4ZWxEZW5zaXR5KHBpeGVsUmF0aW8pO1xuICAgICAgICAgIHByb3BzLnA1LnJlc2l6ZUNhbnZhcyhjYW52YXNXaWR0aCAvIHBpeGVsUmF0aW8sIGNhbnZhc0hlaWdodCAvIHBpeGVsUmF0aW8sIGZhbHNlKTtcbiAgICAgICAgICB0aGlzLl9pc1A1UmVzaXppbmcgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yY2UgY2FudmFzIHNpemVcbiAgICAgICAgaWYgKGNhbnZhcy53aWR0aCAhPT0gY2FudmFzV2lkdGgpIGNhbnZhcy53aWR0aCA9IGNhbnZhc1dpZHRoO1xuICAgICAgICBpZiAoY2FudmFzLmhlaWdodCAhPT0gY2FudmFzSGVpZ2h0KSBjYW52YXMuaGVpZ2h0ID0gY2FudmFzSGVpZ2h0O1xuICAgICAgfVxuICAgICAgLy8gVXBkYXRlIGNhbnZhcyBzdHlsZVxuICAgICAgaWYgKGlzQnJvd3NlcigpICYmIHNldHRpbmdzLnN0eWxlQ2FudmFzICE9PSBmYWxzZSkge1xuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggPSBgJHtzdHlsZVdpZHRofXB4YDtcbiAgICAgICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IGAke3N0eWxlSGVpZ2h0fXB4YDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBuZXdTaXplcyA9IHRoaXMuX2dldFNpemVQcm9wcygpO1xuICAgIGxldCBjaGFuZ2VkID0gIWRlZXBFcXVhbChvbGRTaXplcywgbmV3U2l6ZXMpO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICB0aGlzLl9zaXplQ2hhbmdlZCgpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlZDtcbiAgfVxuXG4gIF9zaXplQ2hhbmdlZCAoKSB7XG4gICAgLy8gU2VuZCByZXNpemUgZXZlbnQgdG8gc2tldGNoXG4gICAgaWYgKHRoaXMuc2tldGNoICYmIHR5cGVvZiB0aGlzLnNrZXRjaC5yZXNpemUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRoaXMuc2tldGNoLnJlc2l6ZSh0aGlzLnByb3BzKTtcbiAgICB9XG4gIH1cblxuICBhbmltYXRlICgpIHtcbiAgICBpZiAoIXRoaXMucHJvcHMucGxheWluZykgcmV0dXJuO1xuICAgIGlmICghaXNCcm93c2VyKCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1tjYW52YXMtc2tldGNoXSBXQVJOOiBBbmltYXRpb24gaW4gTm9kZS5qcyBpcyBub3QgeWV0IHN1cHBvcnRlZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9yYWYgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuX2FuaW1hdGVIYW5kbGVyKTtcblxuICAgIGxldCBub3cgPSByaWdodE5vdygpO1xuXG4gICAgY29uc3QgZnBzID0gdGhpcy5wcm9wcy5mcHM7XG4gICAgY29uc3QgZnJhbWVJbnRlcnZhbE1TID0gMTAwMCAvIGZwcztcbiAgICBsZXQgZGVsdGFUaW1lTVMgPSBub3cgLSB0aGlzLl9sYXN0VGltZTtcblxuICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy5wcm9wcy5kdXJhdGlvbjtcbiAgICBjb25zdCBoYXNEdXJhdGlvbiA9IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ251bWJlcicgJiYgaXNGaW5pdGUoZHVyYXRpb24pO1xuXG4gICAgbGV0IGlzTmV3RnJhbWUgPSB0cnVlO1xuICAgIGNvbnN0IHBsYXliYWNrUmF0ZSA9IHRoaXMuc2V0dGluZ3MucGxheWJhY2tSYXRlO1xuICAgIGlmIChwbGF5YmFja1JhdGUgPT09ICdmaXhlZCcpIHtcbiAgICAgIGRlbHRhVGltZU1TID0gZnJhbWVJbnRlcnZhbE1TO1xuICAgIH0gZWxzZSBpZiAocGxheWJhY2tSYXRlID09PSAndGhyb3R0bGUnKSB7XG4gICAgICBpZiAoZGVsdGFUaW1lTVMgPiBmcmFtZUludGVydmFsTVMpIHtcbiAgICAgICAgbm93ID0gbm93IC0gKGRlbHRhVGltZU1TICUgZnJhbWVJbnRlcnZhbE1TKTtcbiAgICAgICAgdGhpcy5fbGFzdFRpbWUgPSBub3c7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpc05ld0ZyYW1lID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xhc3RUaW1lID0gbm93O1xuICAgIH1cblxuICAgIGNvbnN0IGRlbHRhVGltZSA9IGRlbHRhVGltZU1TIC8gMTAwMDtcbiAgICBsZXQgbmV3VGltZSA9IHRoaXMucHJvcHMudGltZSArIGRlbHRhVGltZSAqIHRoaXMucHJvcHMudGltZVNjYWxlO1xuXG4gICAgLy8gSGFuZGxlIHJldmVyc2UgdGltZSBzY2FsZVxuICAgIGlmIChuZXdUaW1lIDwgMCAmJiBoYXNEdXJhdGlvbikge1xuICAgICAgbmV3VGltZSA9IGR1cmF0aW9uICsgbmV3VGltZTtcbiAgICB9XG5cbiAgICAvLyBSZS1zdGFydCBhbmltYXRpb25cbiAgICBsZXQgaXNGaW5pc2hlZCA9IGZhbHNlO1xuICAgIGxldCBpc0xvb3BTdGFydCA9IGZhbHNlO1xuXG4gICAgY29uc3QgbG9vcGluZyA9IHRoaXMuc2V0dGluZ3MubG9vcCAhPT0gZmFsc2U7XG5cbiAgICBpZiAoaGFzRHVyYXRpb24gJiYgbmV3VGltZSA+PSBkdXJhdGlvbikge1xuICAgICAgLy8gUmUtc3RhcnQgYW5pbWF0aW9uXG4gICAgICBpZiAobG9vcGluZykge1xuICAgICAgICBpc05ld0ZyYW1lID0gdHJ1ZTtcbiAgICAgICAgbmV3VGltZSA9IG5ld1RpbWUgJSBkdXJhdGlvbjtcbiAgICAgICAgaXNMb29wU3RhcnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaXNOZXdGcmFtZSA9IGZhbHNlO1xuICAgICAgICBuZXdUaW1lID0gZHVyYXRpb247XG4gICAgICAgIGlzRmluaXNoZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9zaWduYWxFbmQoKTtcbiAgICB9XG5cbiAgICBpZiAoaXNOZXdGcmFtZSkge1xuICAgICAgdGhpcy5wcm9wcy5kZWx0YVRpbWUgPSBkZWx0YVRpbWU7XG4gICAgICB0aGlzLnByb3BzLnRpbWUgPSBuZXdUaW1lO1xuICAgICAgdGhpcy5wcm9wcy5wbGF5aGVhZCA9IHRoaXMuX2NvbXB1dGVQbGF5aGVhZChuZXdUaW1lLCBkdXJhdGlvbik7XG4gICAgICBjb25zdCBsYXN0RnJhbWUgPSB0aGlzLnByb3BzLmZyYW1lO1xuICAgICAgdGhpcy5wcm9wcy5mcmFtZSA9IHRoaXMuX2NvbXB1dGVDdXJyZW50RnJhbWUoKTtcbiAgICAgIGlmIChpc0xvb3BTdGFydCkgdGhpcy5fc2lnbmFsQmVnaW4oKTtcbiAgICAgIGlmIChsYXN0RnJhbWUgIT09IHRoaXMucHJvcHMuZnJhbWUpIHRoaXMudGljaygpO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIHRoaXMucHJvcHMuZGVsdGFUaW1lID0gMDtcbiAgICB9XG5cbiAgICBpZiAoaXNGaW5pc2hlZCkge1xuICAgICAgdGhpcy5wYXVzZSgpO1xuICAgIH1cbiAgfVxuXG4gIGRpc3BhdGNoIChjYikge1xuICAgIGlmICh0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBFcnJvcignbXVzdCBwYXNzIGZ1bmN0aW9uIGludG8gZGlzcGF0Y2goKScpO1xuICAgIGNiKHRoaXMucHJvcHMpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBtb3VudCAoKSB7XG4gICAgdGhpcy5fYXBwZW5kQ2FudmFzSWZOZWVkZWQoKTtcbiAgfVxuXG4gIHVubW91bnQgKCkge1xuICAgIGlmIChpc0Jyb3dzZXIoKSkge1xuICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMuX3Jlc2l6ZUhhbmRsZXIpO1xuICAgICAgdGhpcy5fa2V5Ym9hcmRTaG9ydGN1dHMuZGV0YWNoKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3BzLmNhbnZhcy5wYXJlbnRFbGVtZW50KSB7XG4gICAgICB0aGlzLnByb3BzLmNhbnZhcy5wYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHRoaXMucHJvcHMuY2FudmFzKTtcbiAgICB9XG4gIH1cblxuICBfYXBwZW5kQ2FudmFzSWZOZWVkZWQgKCkge1xuICAgIGlmICghaXNCcm93c2VyKCkpIHJldHVybjtcbiAgICBpZiAodGhpcy5zZXR0aW5ncy5wYXJlbnQgIT09IGZhbHNlICYmICh0aGlzLnByb3BzLmNhbnZhcyAmJiAhdGhpcy5wcm9wcy5jYW52YXMucGFyZW50RWxlbWVudCkpIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRQYXJlbnQgPSB0aGlzLnNldHRpbmdzLnBhcmVudCB8fCBkb2N1bWVudC5ib2R5O1xuICAgICAgZGVmYXVsdFBhcmVudC5hcHBlbmRDaGlsZCh0aGlzLnByb3BzLmNhbnZhcyk7XG4gICAgfVxuICB9XG5cbiAgX3NldHVwR0xLZXkgKCkge1xuICAgIGlmICh0aGlzLnByb3BzLmNvbnRleHQpIHtcbiAgICAgIGlmIChpc1dlYkdMQ29udGV4dCh0aGlzLnByb3BzLmNvbnRleHQpKSB7XG4gICAgICAgIHRoaXMuX3Byb3BzLmdsID0gdGhpcy5wcm9wcy5jb250ZXh0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuX3Byb3BzLmdsO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldFRpbWVQcm9wcyAoc2V0dGluZ3MgPSB7fSkge1xuICAgIC8vIEdldCB0aW1pbmcgZGF0YVxuICAgIGxldCBkdXJhdGlvbiA9IHNldHRpbmdzLmR1cmF0aW9uO1xuICAgIGxldCB0b3RhbEZyYW1lcyA9IHNldHRpbmdzLnRvdGFsRnJhbWVzO1xuICAgIGNvbnN0IHRpbWVTY2FsZSA9IGRlZmluZWQoc2V0dGluZ3MudGltZVNjYWxlLCAxKTtcbiAgICBjb25zdCBmcHMgPSBkZWZpbmVkKHNldHRpbmdzLmZwcywgMjQpO1xuICAgIGNvbnN0IGhhc0R1cmF0aW9uID0gdHlwZW9mIGR1cmF0aW9uID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShkdXJhdGlvbik7XG4gICAgY29uc3QgaGFzVG90YWxGcmFtZXMgPSB0eXBlb2YgdG90YWxGcmFtZXMgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHRvdGFsRnJhbWVzKTtcblxuICAgIGNvbnN0IHRvdGFsRnJhbWVzRnJvbUR1cmF0aW9uID0gaGFzRHVyYXRpb24gPyBNYXRoLmZsb29yKGZwcyAqIGR1cmF0aW9uKSA6IHVuZGVmaW5lZDtcbiAgICBjb25zdCBkdXJhdGlvbkZyb21Ub3RhbEZyYW1lcyA9IGhhc1RvdGFsRnJhbWVzID8gKHRvdGFsRnJhbWVzIC8gZnBzKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoaGFzRHVyYXRpb24gJiYgaGFzVG90YWxGcmFtZXMgJiYgdG90YWxGcmFtZXNGcm9tRHVyYXRpb24gIT09IHRvdGFsRnJhbWVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBzaG91bGQgc3BlY2lmeSBlaXRoZXIgZHVyYXRpb24gb3IgdG90YWxGcmFtZXMsIGJ1dCBub3QgYm90aC4gT3IsIHRoZXkgbXVzdCBtYXRjaCBleGFjdGx5LicpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygc2V0dGluZ3MuZGltZW5zaW9ucyA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHNldHRpbmdzLnVuaXRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc29sZS53YXJuKGBZb3UndmUgc3BlY2lmaWVkIGEgeyB1bml0cyB9IHNldHRpbmcgYnV0IG5vIHsgZGltZW5zaW9uIH0sIHNvIHRoZSB1bml0cyB3aWxsIGJlIGlnbm9yZWQuYCk7XG4gICAgfVxuXG4gICAgdG90YWxGcmFtZXMgPSBkZWZpbmVkKHRvdGFsRnJhbWVzLCB0b3RhbEZyYW1lc0Zyb21EdXJhdGlvbiwgSW5maW5pdHkpO1xuICAgIGR1cmF0aW9uID0gZGVmaW5lZChkdXJhdGlvbiwgZHVyYXRpb25Gcm9tVG90YWxGcmFtZXMsIEluZmluaXR5KTtcblxuICAgIGNvbnN0IHN0YXJ0VGltZSA9IHNldHRpbmdzLnRpbWU7XG4gICAgY29uc3Qgc3RhcnRGcmFtZSA9IHNldHRpbmdzLmZyYW1lO1xuICAgIGNvbnN0IGhhc1N0YXJ0VGltZSA9IHR5cGVvZiBzdGFydFRpbWUgPT09ICdudW1iZXInICYmIGlzRmluaXRlKHN0YXJ0VGltZSk7XG4gICAgY29uc3QgaGFzU3RhcnRGcmFtZSA9IHR5cGVvZiBzdGFydEZyYW1lID09PSAnbnVtYmVyJyAmJiBpc0Zpbml0ZShzdGFydEZyYW1lKTtcblxuICAgIC8vIHN0YXJ0IGF0IHplcm8gdW5sZXNzIHVzZXIgc3BlY2lmaWVzIGZyYW1lIG9yIHRpbWUgKGJ1dCBub3QgYm90aCBtaXNtYXRjaGVkKVxuICAgIGxldCB0aW1lID0gMDtcbiAgICBsZXQgZnJhbWUgPSAwO1xuICAgIGxldCBwbGF5aGVhZCA9IDA7XG4gICAgaWYgKGhhc1N0YXJ0VGltZSAmJiBoYXNTdGFydEZyYW1lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBzaG91bGQgc3BlY2lmeSBlaXRoZXIgc3RhcnQgZnJhbWUgb3IgdGltZSwgYnV0IG5vdCBib3RoLicpO1xuICAgIH0gZWxzZSBpZiAoaGFzU3RhcnRUaW1lKSB7XG4gICAgICAvLyBVc2VyIHNwZWNpZmllcyB0aW1lLCB3ZSBpbmZlciBmcmFtZXMgZnJvbSBGUFNcbiAgICAgIHRpbWUgPSBzdGFydFRpbWU7XG4gICAgICBwbGF5aGVhZCA9IHRoaXMuX2NvbXB1dGVQbGF5aGVhZCh0aW1lLCBkdXJhdGlvbik7XG4gICAgICBmcmFtZSA9IHRoaXMuX2NvbXB1dGVGcmFtZShcbiAgICAgICAgcGxheWhlYWQsIHRpbWUsXG4gICAgICAgIHRvdGFsRnJhbWVzLCBmcHNcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChoYXNTdGFydEZyYW1lKSB7XG4gICAgICAvLyBVc2VyIHNwZWNpZmllcyBmcmFtZSBudW1iZXIsIHdlIGluZmVyIHRpbWUgZnJvbSBGUFNcbiAgICAgIGZyYW1lID0gc3RhcnRGcmFtZTtcbiAgICAgIHRpbWUgPSBmcmFtZSAvIGZwcztcbiAgICAgIHBsYXloZWFkID0gdGhpcy5fY29tcHV0ZVBsYXloZWFkKHRpbWUsIGR1cmF0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgcGxheWhlYWQsXG4gICAgICB0aW1lLFxuICAgICAgZnJhbWUsXG4gICAgICBkdXJhdGlvbixcbiAgICAgIHRvdGFsRnJhbWVzLFxuICAgICAgZnBzLFxuICAgICAgdGltZVNjYWxlXG4gICAgfTtcbiAgfVxuXG4gIHNldHVwIChzZXR0aW5ncyA9IHt9KSB7XG4gICAgaWYgKHRoaXMuc2tldGNoKSB0aHJvdyBuZXcgRXJyb3IoJ011bHRpcGxlIHNldHVwKCkgY2FsbHMgbm90IHlldCBzdXBwb3J0ZWQuJyk7XG5cbiAgICB0aGlzLl9zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIHNldHRpbmdzLCB0aGlzLl9zZXR0aW5ncyk7XG5cbiAgICBjaGVja1NldHRpbmdzKHRoaXMuX3NldHRpbmdzKTtcblxuICAgIC8vIEdldCBpbml0aWFsIGNhbnZhcyAmIGNvbnRleHRcbiAgICBjb25zdCB7IGNvbnRleHQsIGNhbnZhcyB9ID0gY3JlYXRlQ2FudmFzKHRoaXMuX3NldHRpbmdzKTtcblxuICAgIGNvbnN0IHRpbWVQcm9wcyA9IHRoaXMuZ2V0VGltZVByb3BzKHRoaXMuX3NldHRpbmdzKTtcblxuICAgIC8vIEluaXRpYWwgcmVuZGVyIHN0YXRlIGZlYXR1cmVzXG4gICAgdGhpcy5fcHJvcHMgPSB7XG4gICAgICAuLi50aW1lUHJvcHMsXG4gICAgICBjYW52YXMsXG4gICAgICBjb250ZXh0LFxuICAgICAgZGVsdGFUaW1lOiAwLFxuICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICBleHBvcnRpbmc6IGZhbHNlLFxuICAgICAgcGxheWluZzogZmFsc2UsXG4gICAgICByZWNvcmRpbmc6IGZhbHNlLFxuICAgICAgc2V0dGluZ3M6IHRoaXMuc2V0dGluZ3MsXG4gICAgICBkYXRhOiB0aGlzLnNldHRpbmdzLmRhdGEsXG5cbiAgICAgIC8vIEV4cG9ydCBzb21lIHNwZWNpZmljIGFjdGlvbnMgdG8gdGhlIHNrZXRjaFxuICAgICAgcmVuZGVyOiAoKSA9PiB0aGlzLnJlbmRlcigpLFxuICAgICAgdG9nZ2xlUGxheTogKCkgPT4gdGhpcy50b2dnbGVQbGF5KCksXG4gICAgICBkaXNwYXRjaDogKGNiKSA9PiB0aGlzLmRpc3BhdGNoKGNiKSxcbiAgICAgIHRpY2s6ICgpID0+IHRoaXMudGljaygpLFxuICAgICAgcmVzaXplOiAoKSA9PiB0aGlzLnJlc2l6ZSgpLFxuICAgICAgdXBkYXRlOiAob3B0KSA9PiB0aGlzLnVwZGF0ZShvcHQpLFxuICAgICAgZXhwb3J0RnJhbWU6IG9wdCA9PiB0aGlzLmV4cG9ydEZyYW1lKG9wdCksXG4gICAgICByZWNvcmQ6ICgpID0+IHRoaXMucmVjb3JkKCksXG4gICAgICBwbGF5OiAoKSA9PiB0aGlzLnBsYXkoKSxcbiAgICAgIHBhdXNlOiAoKSA9PiB0aGlzLnBhdXNlKCksXG4gICAgICBzdG9wOiAoKSA9PiB0aGlzLnN0b3AoKVxuICAgIH07XG5cbiAgICAvLyBGb3IgV2ViR0wgc2tldGNoZXMsIGEgZ2wgdmFyaWFibGUgcmVhZHMgYSBiaXQgYmV0dGVyXG4gICAgdGhpcy5fc2V0dXBHTEtleSgpO1xuXG4gICAgLy8gVHJpZ2dlciBpbml0aWFsIHJlc2l6ZSBub3cgc28gdGhhdCBjYW52YXMgaXMgYWxyZWFkeSBzaXplZFxuICAgIC8vIGJ5IHRoZSB0aW1lIHdlIGxvYWQgdGhlIHNrZXRjaFxuICAgIHRoaXMucmVzaXplKCk7XG4gIH1cblxuICBsb2FkQW5kUnVuIChjYW52YXNTa2V0Y2gsIG5ld1NldHRpbmdzKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZChjYW52YXNTa2V0Y2gsIG5ld1NldHRpbmdzKS50aGVuKCgpID0+IHtcbiAgICAgIHRoaXMucnVuKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gIHVubG9hZCAoKSB7XG4gICAgdGhpcy5wYXVzZSgpO1xuICAgIGlmICghdGhpcy5za2V0Y2gpIHJldHVybjtcbiAgICBpZiAodHlwZW9mIHRoaXMuc2tldGNoLnVubG9hZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhpcy5fd3JhcENvbnRleHRTY2FsZShwcm9wcyA9PiB0aGlzLnNrZXRjaC51bmxvYWQocHJvcHMpKTtcbiAgICB9XG4gICAgdGhpcy5fc2tldGNoID0gbnVsbDtcbiAgfVxuXG4gIGRlc3Ryb3kgKCkge1xuICAgIHRoaXMudW5sb2FkKCk7XG4gICAgdGhpcy51bm1vdW50KCk7XG4gIH1cblxuICBsb2FkIChjcmVhdGVTa2V0Y2gsIG5ld1NldHRpbmdzKSB7XG4gICAgLy8gVXNlciBkaWRuJ3Qgc3BlY2lmeSBhIGZ1bmN0aW9uXG4gICAgaWYgKHR5cGVvZiBjcmVhdGVTa2V0Y2ggIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGhlIGZ1bmN0aW9uIG11c3QgdGFrZSBpbiBhIGZ1bmN0aW9uIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIuIEV4YW1wbGU6XFxuICBjYW52YXNTa2V0Y2hlcigoKSA9PiB7IC4uLiB9LCBzZXR0aW5ncyknKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5za2V0Y2gpIHtcbiAgICAgIHRoaXMudW5sb2FkKCk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBuZXdTZXR0aW5ncyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXMudXBkYXRlKG5ld1NldHRpbmdzKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIGlzIGEgYml0IG9mIGEgdHJpY2t5IGNhc2U7IHdlIHNldCB1cCB0aGUgYXV0by1zY2FsaW5nIGhlcmVcbiAgICAvLyBpbiBjYXNlIHRoZSB1c2VyIGRlY2lkZXMgdG8gcmVuZGVyIGFueXRoaW5nIHRvIHRoZSBjb250ZXh0ICpiZWZvcmUqIHRoZVxuICAgIC8vIHJlbmRlcigpIGZ1bmN0aW9uLi4uIEhvd2V2ZXIsIHVzZXJzIHNob3VsZCBpbnN0ZWFkIHVzZSBiZWdpbigpIGZ1bmN0aW9uIGZvciB0aGF0LlxuICAgIHRoaXMuX3ByZVJlbmRlcigpO1xuXG4gICAgbGV0IHByZWxvYWQgPSBQcm9taXNlLnJlc29sdmUoKTtcblxuICAgIC8vIEJlY2F1c2Ugb2YgUDUuanMncyB1bnVzdWFsIHN0cnVjdHVyZSwgd2UgaGF2ZSB0byBkbyBhIGJpdCBvZlxuICAgIC8vIGxpYnJhcnktc3BlY2lmaWMgY2hhbmdlcyB0byBzdXBwb3J0IGl0IHByb3Blcmx5LlxuICAgIGlmICh0aGlzLnNldHRpbmdzLnA1KSB7XG4gICAgICBpZiAoIWlzQnJvd3NlcigpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignW2NhbnZhcy1za2V0Y2hdIEVSUk9SOiBVc2luZyBwNS5qcyBpbiBOb2RlLmpzIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgIH1cbiAgICAgIHByZWxvYWQgPSBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgbGV0IFA1Q29uc3RydWN0b3IgPSB0aGlzLnNldHRpbmdzLnA1O1xuICAgICAgICBsZXQgcHJlbG9hZDtcbiAgICAgICAgaWYgKFA1Q29uc3RydWN0b3IucDUpIHtcbiAgICAgICAgICBwcmVsb2FkID0gUDVDb25zdHJ1Y3Rvci5wcmVsb2FkO1xuICAgICAgICAgIFA1Q29uc3RydWN0b3IgPSBQNUNvbnN0cnVjdG9yLnA1O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhlIHNrZXRjaCBzZXR1cDsgZGlzYWJsZSBsb29wLCBzZXQgc2l6aW5nLCBldGMuXG4gICAgICAgIGNvbnN0IHA1U2tldGNoID0gcDUgPT4ge1xuICAgICAgICAgIC8vIEhvb2sgaW4gcHJlbG9hZCBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBpZiAocHJlbG9hZCkgcDUucHJlbG9hZCA9ICgpID0+IHByZWxvYWQocDUpO1xuICAgICAgICAgIHA1LnNldHVwID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnByb3BzO1xuICAgICAgICAgICAgY29uc3QgaXNHTCA9IHRoaXMuc2V0dGluZ3MuY29udGV4dCA9PT0gJ3dlYmdsJztcbiAgICAgICAgICAgIGNvbnN0IHJlbmRlcmVyID0gaXNHTCA/IHA1LldFQkdMIDogcDUuUDJEO1xuICAgICAgICAgICAgcDUubm9Mb29wKCk7XG4gICAgICAgICAgICBwNS5waXhlbERlbnNpdHkocHJvcHMucGl4ZWxSYXRpbyk7XG4gICAgICAgICAgICBwNS5jcmVhdGVDYW52YXMocHJvcHMudmlld3BvcnRXaWR0aCwgcHJvcHMudmlld3BvcnRIZWlnaHQsIHJlbmRlcmVyKTtcbiAgICAgICAgICAgIGlmIChpc0dMICYmIHRoaXMuc2V0dGluZ3MuYXR0cmlidXRlcykge1xuICAgICAgICAgICAgICBwNS5zZXRBdHRyaWJ1dGVzKHRoaXMuc2V0dGluZ3MuYXR0cmlidXRlcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlKHsgcDUsIGNhbnZhczogcDUuY2FudmFzLCBjb250ZXh0OiBwNS5fcmVuZGVyZXIuZHJhd2luZ0NvbnRleHQgfSk7XG4gICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTdXBwb3J0IGdsb2JhbCBhbmQgaW5zdGFuY2UgUDUuanMgbW9kZXNcbiAgICAgICAgaWYgKHR5cGVvZiBQNUNvbnN0cnVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgbmV3IFA1Q29uc3RydWN0b3IocDVTa2V0Y2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LmNyZWF0ZUNhbnZhcyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwieyBwNSB9IHNldHRpbmcgaXMgcGFzc2VkIGJ1dCBjYW4ndCBmaW5kIHA1LmpzIGluIGdsb2JhbCAod2luZG93KSBzY29wZS4gTWF5YmUgeW91IGRpZCBub3QgY3JlYXRlIGl0IGdsb2JhbGx5P1xcbm5ldyBwNSgpOyAvLyA8LS0gYXR0YWNoZXMgdG8gZ2xvYmFsIHNjb3BlXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBwNVNrZXRjaCh3aW5kb3cpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJlbG9hZC50aGVuKCgpID0+IHtcbiAgICAgIC8vIExvYWQgdGhlIHVzZXIncyBza2V0Y2hcbiAgICAgIGxldCBsb2FkZXIgPSBjcmVhdGVTa2V0Y2godGhpcy5wcm9wcyk7XG4gICAgICBpZiAoIWlzUHJvbWlzZShsb2FkZXIpKSB7XG4gICAgICAgIGxvYWRlciA9IFByb21pc2UucmVzb2x2ZShsb2FkZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxvYWRlcjtcbiAgICB9KS50aGVuKHNrZXRjaCA9PiB7XG4gICAgICBpZiAoIXNrZXRjaCkgc2tldGNoID0ge307XG4gICAgICB0aGlzLl9za2V0Y2ggPSBza2V0Y2g7XG5cbiAgICAgIC8vIE9uY2UgdGhlIHNrZXRjaCBpcyBsb2FkZWQgd2UgY2FuIGFkZCB0aGUgZXZlbnRzXG4gICAgICBpZiAoaXNCcm93c2VyKCkpIHtcbiAgICAgICAgdGhpcy5fa2V5Ym9hcmRTaG9ydGN1dHMuYXR0YWNoKCk7XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB0aGlzLl9yZXNpemVIYW5kbGVyKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcG9zdFJlbmRlcigpO1xuXG4gICAgICAvLyBUaGUgaW5pdGlhbCByZXNpemUoKSBpbiB0aGUgY29uc3RydWN0b3Igd2lsbCBub3QgaGF2ZVxuICAgICAgLy8gdHJpZ2dlcmVkIGEgcmVzaXplKCkgZXZlbnQgb24gdGhlIHNrZXRjaCwgc2luY2UgaXQgd2FzIGJlZm9yZVxuICAgICAgLy8gdGhlIHNrZXRjaCB3YXMgbG9hZGVkLiBTbyB3ZSBzZW5kIHRoZSBzaWduYWwgaGVyZSwgYWxsb3dpbmdcbiAgICAgIC8vIHVzZXJzIHRvIHJlYWN0IHRvIHRoZSBpbml0aWFsIHNpemUgYmVmb3JlIGZpcnN0IHJlbmRlci5cbiAgICAgIHRoaXMuX3NpemVDaGFuZ2VkKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS53YXJuKCdDb3VsZCBub3Qgc3RhcnQgc2tldGNoLCB0aGUgYXN5bmMgbG9hZGluZyBmdW5jdGlvbiByZWplY3RlZCB3aXRoIGFuIGVycm9yOlxcbiAgICBFcnJvcjogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTa2V0Y2hNYW5hZ2VyO1xuIiwiaW1wb3J0IFNrZXRjaE1hbmFnZXIgZnJvbSAnLi9jb3JlL1NrZXRjaE1hbmFnZXInO1xuaW1wb3J0IFBhcGVyU2l6ZXMgZnJvbSAnLi9wYXBlci1zaXplcyc7XG5pbXBvcnQgeyBnZXRDbGllbnRBUEkgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IGRlZmluZWQgZnJvbSAnZGVmaW5lZCc7XG5cbmNvbnN0IENBQ0hFID0gJ2hvdC1pZC1jYWNoZSc7XG5jb25zdCBydW50aW1lQ29sbGlzaW9ucyA9IFtdO1xuXG5mdW5jdGlvbiBpc0hvdFJlbG9hZCAoKSB7XG4gIGNvbnN0IGNsaWVudCA9IGdldENsaWVudEFQSSgpO1xuICByZXR1cm4gY2xpZW50ICYmIGNsaWVudC5ob3Q7XG59XG5cbmZ1bmN0aW9uIGNhY2hlR2V0IChpZCkge1xuICBjb25zdCBjbGllbnQgPSBnZXRDbGllbnRBUEkoKTtcbiAgaWYgKCFjbGllbnQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNsaWVudFtDQUNIRV0gPSBjbGllbnRbQ0FDSEVdIHx8IHt9O1xuICByZXR1cm4gY2xpZW50W0NBQ0hFXVtpZF07XG59XG5cbmZ1bmN0aW9uIGNhY2hlUHV0IChpZCwgZGF0YSkge1xuICBjb25zdCBjbGllbnQgPSBnZXRDbGllbnRBUEkoKTtcbiAgaWYgKCFjbGllbnQpIHJldHVybiB1bmRlZmluZWQ7XG4gIGNsaWVudFtDQUNIRV0gPSBjbGllbnRbQ0FDSEVdIHx8IHt9O1xuICBjbGllbnRbQ0FDSEVdW2lkXSA9IGRhdGE7XG59XG5cbmZ1bmN0aW9uIGdldFRpbWVQcm9wIChvbGRNYW5hZ2VyLCBuZXdTZXR0aW5ncykge1xuICAvLyBTdGF0aWMgc2tldGNoZXMgaWdub3JlIHRoZSB0aW1lIHBlcnNpc3RlbmN5XG4gIHJldHVybiBuZXdTZXR0aW5ncy5hbmltYXRlID8geyB0aW1lOiBvbGRNYW5hZ2VyLnByb3BzLnRpbWUgfSA6IHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gY2FudmFzU2tldGNoIChza2V0Y2gsIHNldHRpbmdzID0ge30pIHtcbiAgaWYgKHNldHRpbmdzLnA1KSB7XG4gICAgaWYgKHNldHRpbmdzLmNhbnZhcyB8fCAoc2V0dGluZ3MuY29udGV4dCAmJiB0eXBlb2Ygc2V0dGluZ3MuY29udGV4dCAhPT0gJ3N0cmluZycpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEluIHsgcDUgfSBtb2RlLCB5b3UgY2FuJ3QgcGFzcyB5b3VyIG93biBjYW52YXMgb3IgY29udGV4dCwgdW5sZXNzIHRoZSBjb250ZXh0IGlzIGEgXCJ3ZWJnbFwiIG9yIFwiMmRcIiBzdHJpbmdgKTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3QgY3JlYXRlIGEgY2FudmFzIG9uIHN0YXJ0dXAsIHNpbmNlIFA1LmpzIGRvZXMgdGhhdCBmb3IgdXNcbiAgICBjb25zdCBjb250ZXh0ID0gdHlwZW9mIHNldHRpbmdzLmNvbnRleHQgPT09ICdzdHJpbmcnID8gc2V0dGluZ3MuY29udGV4dCA6IGZhbHNlO1xuICAgIHNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgc2V0dGluZ3MsIHsgY2FudmFzOiBmYWxzZSwgY29udGV4dCB9KTtcbiAgfVxuXG4gIGNvbnN0IGlzSG90ID0gaXNIb3RSZWxvYWQoKTtcbiAgbGV0IGhvdElEO1xuICBpZiAoaXNIb3QpIHtcbiAgICAvLyBVc2UgYSBtYWdpYyBuYW1lIGJ5IGRlZmF1bHQsIGZvcmNlIHVzZXIgdG8gZGVmaW5lIGVhY2ggc2tldGNoIGlmIHRoZXlcbiAgICAvLyByZXF1aXJlIG1vcmUgdGhhbiBvbmUgaW4gYW4gYXBwbGljYXRpb24uIE9wZW4gdG8gb3RoZXIgaWRlYXMgb24gaG93IHRvIHRhY2tsZVxuICAgIC8vIHRoaXMgYXMgd2VsbC4uLlxuICAgIGhvdElEID0gZGVmaW5lZChzZXR0aW5ncy5pZCwgJyRfX0RFRkFVTFRfQ0FOVkFTX1NLRVRDSF9JRF9fJCcpO1xuICB9XG4gIGxldCBpc0luamVjdGluZyA9IGlzSG90ICYmIHR5cGVvZiBob3RJRCA9PT0gJ3N0cmluZyc7XG5cbiAgaWYgKGlzSW5qZWN0aW5nICYmIHJ1bnRpbWVDb2xsaXNpb25zLmluY2x1ZGVzKGhvdElEKSkge1xuICAgIGNvbnNvbGUud2FybihgV2FybmluZzogWW91IGhhdmUgbXVsdGlwbGUgY2FsbHMgdG8gY2FudmFzU2tldGNoKCkgaW4gLS1ob3QgbW9kZS4gWW91IG11c3QgcGFzcyB1bmlxdWUgeyBpZCB9IHN0cmluZ3MgaW4gc2V0dGluZ3MgdG8gZW5hYmxlIGhvdCByZWxvYWQgYWNyb3NzIG11bHRpcGxlIHNrZXRjaGVzLiBgLCBob3RJRCk7XG4gICAgaXNJbmplY3RpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIGxldCBwcmVsb2FkID0gUHJvbWlzZS5yZXNvbHZlKCk7XG5cbiAgaWYgKGlzSW5qZWN0aW5nKSB7XG4gICAgLy8gTWFyayB0aGlzIGFzIGFscmVhZHkgc3BvdHRlZCBpbiB0aGlzIHJ1bnRpbWUgaW5zdGFuY2VcbiAgICBydW50aW1lQ29sbGlzaW9ucy5wdXNoKGhvdElEKTtcblxuICAgIGNvbnN0IHByZXZpb3VzRGF0YSA9IGNhY2hlR2V0KGhvdElEKTtcbiAgICBpZiAocHJldmlvdXNEYXRhKSB7XG4gICAgICBjb25zdCBuZXh0ID0gKCkgPT4ge1xuICAgICAgICAvLyBHcmFiIG5ldyBwcm9wcyBmcm9tIG9sZCBza2V0Y2ggaW5zdGFuY2VcbiAgICAgICAgY29uc3QgbmV3UHJvcHMgPSBnZXRUaW1lUHJvcChwcmV2aW91c0RhdGEubWFuYWdlciwgc2V0dGluZ3MpO1xuICAgICAgICAvLyBEZXN0cm95IHRoZSBvbGQgaW5zdGFuY2VcbiAgICAgICAgcHJldmlvdXNEYXRhLm1hbmFnZXIuZGVzdHJveSgpO1xuICAgICAgICAvLyBQYXNzIGFsb25nIG5ldyBwcm9wc1xuICAgICAgICByZXR1cm4gbmV3UHJvcHM7XG4gICAgICB9O1xuXG4gICAgICAvLyBNb3ZlIGFsb25nIHRoZSBuZXh0IGRhdGEuLi5cbiAgICAgIHByZWxvYWQgPSBwcmV2aW91c0RhdGEubG9hZC50aGVuKG5leHQpLmNhdGNoKG5leHQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcmVsb2FkLnRoZW4obmV3UHJvcHMgPT4ge1xuICAgIGNvbnN0IG1hbmFnZXIgPSBuZXcgU2tldGNoTWFuYWdlcigpO1xuICAgIGxldCByZXN1bHQ7XG4gICAgaWYgKHNrZXRjaCkge1xuICAgICAgLy8gTWVyZ2Ugd2l0aCBpbmNvbWluZyBkYXRhXG4gICAgICBzZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIHNldHRpbmdzLCBuZXdQcm9wcyk7XG5cbiAgICAgIC8vIEFwcGx5IHNldHRpbmdzIGFuZCBjcmVhdGUgYSBjYW52YXNcbiAgICAgIG1hbmFnZXIuc2V0dXAoc2V0dGluZ3MpO1xuXG4gICAgICAvLyBNb3VudCB0byBET01cbiAgICAgIG1hbmFnZXIubW91bnQoKTtcblxuICAgICAgLy8gbG9hZCB0aGUgc2tldGNoIGZpcnN0XG4gICAgICByZXN1bHQgPSBtYW5hZ2VyLmxvYWRBbmRSdW4oc2tldGNoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzdWx0ID0gUHJvbWlzZS5yZXNvbHZlKG1hbmFnZXIpO1xuICAgIH1cbiAgICBpZiAoaXNJbmplY3RpbmcpIHtcbiAgICAgIGNhY2hlUHV0KGhvdElELCB7IGxvYWQ6IHJlc3VsdCwgbWFuYWdlciB9KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG59XG5cbi8vIFRPRE86IEZpZ3VyZSBvdXQgYSBuaWNlIHdheSB0byBleHBvcnQgdGhpbmdzLlxuY2FudmFzU2tldGNoLmNhbnZhc1NrZXRjaCA9IGNhbnZhc1NrZXRjaDtcbmNhbnZhc1NrZXRjaC5QYXBlclNpemVzID0gUGFwZXJTaXplcztcblxuZXhwb3J0IGRlZmF1bHQgY2FudmFzU2tldGNoO1xuIiwidmFyIGRlZmluZWQgPSByZXF1aXJlKCdkZWZpbmVkJyk7XG52YXIgdW5pdHMgPSBbICdtbScsICdjbScsICdtJywgJ3BjJywgJ3B0JywgJ2luJywgJ2Z0JywgJ3B4JyBdO1xuXG52YXIgY29udmVyc2lvbnMgPSB7XG4gIC8vIG1ldHJpY1xuICBtOiB7XG4gICAgc3lzdGVtOiAnbWV0cmljJyxcbiAgICBmYWN0b3I6IDFcbiAgfSxcbiAgY206IHtcbiAgICBzeXN0ZW06ICdtZXRyaWMnLFxuICAgIGZhY3RvcjogMSAvIDEwMFxuICB9LFxuICBtbToge1xuICAgIHN5c3RlbTogJ21ldHJpYycsXG4gICAgZmFjdG9yOiAxIC8gMTAwMFxuICB9LFxuICAvLyBpbXBlcmlhbFxuICBwdDoge1xuICAgIHN5c3RlbTogJ2ltcGVyaWFsJyxcbiAgICBmYWN0b3I6IDEgLyA3MlxuICB9LFxuICBwYzoge1xuICAgIHN5c3RlbTogJ2ltcGVyaWFsJyxcbiAgICBmYWN0b3I6IDEgLyA2XG4gIH0sXG4gIGluOiB7XG4gICAgc3lzdGVtOiAnaW1wZXJpYWwnLFxuICAgIGZhY3RvcjogMVxuICB9LFxuICBmdDoge1xuICAgIHN5c3RlbTogJ2ltcGVyaWFsJyxcbiAgICBmYWN0b3I6IDEyXG4gIH1cbn07XG5cbmNvbnN0IGFuY2hvcnMgPSB7XG4gIG1ldHJpYzoge1xuICAgIHVuaXQ6ICdtJyxcbiAgICByYXRpbzogMSAvIDAuMDI1NFxuICB9LFxuICBpbXBlcmlhbDoge1xuICAgIHVuaXQ6ICdpbicsXG4gICAgcmF0aW86IDAuMDI1NFxuICB9XG59O1xuXG5mdW5jdGlvbiByb3VuZCAodmFsdWUsIGRlY2ltYWxzKSB7XG4gIHJldHVybiBOdW1iZXIoTWF0aC5yb3VuZCh2YWx1ZSArICdlJyArIGRlY2ltYWxzKSArICdlLScgKyBkZWNpbWFscyk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREaXN0YW5jZSAodmFsdWUsIGZyb21Vbml0LCB0b1VuaXQsIG9wdHMpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHZhbHVlKSkgdGhyb3cgbmV3IEVycm9yKCdWYWx1ZSBtdXN0IGJlIGEgZmluaXRlIG51bWJlcicpO1xuICBpZiAoIWZyb21Vbml0IHx8ICF0b1VuaXQpIHRocm93IG5ldyBFcnJvcignTXVzdCBzcGVjaWZ5IGZyb20gYW5kIHRvIHVuaXRzJyk7XG5cbiAgb3B0cyA9IG9wdHMgfHwge307XG4gIHZhciBwaXhlbHNQZXJJbmNoID0gZGVmaW5lZChvcHRzLnBpeGVsc1BlckluY2gsIDk2KTtcbiAgdmFyIHByZWNpc2lvbiA9IG9wdHMucHJlY2lzaW9uO1xuICB2YXIgcm91bmRQaXhlbCA9IG9wdHMucm91bmRQaXhlbCAhPT0gZmFsc2U7XG5cbiAgZnJvbVVuaXQgPSBmcm9tVW5pdC50b0xvd2VyQ2FzZSgpO1xuICB0b1VuaXQgPSB0b1VuaXQudG9Mb3dlckNhc2UoKTtcblxuICBpZiAodW5pdHMuaW5kZXhPZihmcm9tVW5pdCkgPT09IC0xKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgZnJvbSB1bml0IFwiJyArIGZyb21Vbml0ICsgJ1wiLCBtdXN0IGJlIG9uZSBvZjogJyArIHVuaXRzLmpvaW4oJywgJykpO1xuICBpZiAodW5pdHMuaW5kZXhPZih0b1VuaXQpID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGZyb20gdW5pdCBcIicgKyB0b1VuaXQgKyAnXCIsIG11c3QgYmUgb25lIG9mOiAnICsgdW5pdHMuam9pbignLCAnKSk7XG5cbiAgaWYgKGZyb21Vbml0ID09PSB0b1VuaXQpIHtcbiAgICAvLyBXZSBkb24ndCBuZWVkIHRvIGNvbnZlcnQgZnJvbSBBIHRvIEIgc2luY2UgdGhleSBhcmUgdGhlIHNhbWUgYWxyZWFkeVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHZhciB0b0ZhY3RvciA9IDE7XG4gIHZhciBmcm9tRmFjdG9yID0gMTtcbiAgdmFyIGlzVG9QaXhlbCA9IGZhbHNlO1xuXG4gIGlmIChmcm9tVW5pdCA9PT0gJ3B4Jykge1xuICAgIGZyb21GYWN0b3IgPSAxIC8gcGl4ZWxzUGVySW5jaDtcbiAgICBmcm9tVW5pdCA9ICdpbic7XG4gIH1cbiAgaWYgKHRvVW5pdCA9PT0gJ3B4Jykge1xuICAgIGlzVG9QaXhlbCA9IHRydWU7XG4gICAgdG9GYWN0b3IgPSBwaXhlbHNQZXJJbmNoO1xuICAgIHRvVW5pdCA9ICdpbic7XG4gIH1cblxuICB2YXIgZnJvbVVuaXREYXRhID0gY29udmVyc2lvbnNbZnJvbVVuaXRdO1xuICB2YXIgdG9Vbml0RGF0YSA9IGNvbnZlcnNpb25zW3RvVW5pdF07XG5cbiAgLy8gc291cmNlIHRvIGFuY2hvciBpbnNpZGUgc291cmNlJ3Mgc3lzdGVtXG4gIHZhciBhbmNob3IgPSB2YWx1ZSAqIGZyb21Vbml0RGF0YS5mYWN0b3IgKiBmcm9tRmFjdG9yO1xuXG4gIC8vIGlmIHN5c3RlbXMgZGlmZmVyLCBjb252ZXJ0IG9uZSB0byBhbm90aGVyXG4gIGlmIChmcm9tVW5pdERhdGEuc3lzdGVtICE9PSB0b1VuaXREYXRhLnN5c3RlbSkge1xuICAgIC8vIHJlZ3VsYXIgJ20nIHRvICdpbicgYW5kIHNvIGZvcnRoXG4gICAgYW5jaG9yICo9IGFuY2hvcnNbZnJvbVVuaXREYXRhLnN5c3RlbV0ucmF0aW87XG4gIH1cblxuICB2YXIgcmVzdWx0ID0gYW5jaG9yIC8gdG9Vbml0RGF0YS5mYWN0b3IgKiB0b0ZhY3RvcjtcbiAgaWYgKGlzVG9QaXhlbCAmJiByb3VuZFBpeGVsKSB7XG4gICAgcmVzdWx0ID0gTWF0aC5yb3VuZChyZXN1bHQpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcmVjaXNpb24gPT09ICdudW1iZXInICYmIGlzRmluaXRlKHByZWNpc2lvbikpIHtcbiAgICByZXN1bHQgPSByb3VuZChyZXN1bHQsIHByZWNpc2lvbik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjb252ZXJ0RGlzdGFuY2U7XG5tb2R1bGUuZXhwb3J0cy51bml0cyA9IHVuaXRzO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50c1tpXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gYXJndW1lbnRzW2ldO1xuICAgIH1cbn07XG4iLCIndXNlIHN0cmljdCc7XHJcblxyXG52YXIgd2lkdGggPSAyNTY7Ly8gZWFjaCBSQzQgb3V0cHV0IGlzIDAgPD0geCA8IDI1NlxyXG52YXIgY2h1bmtzID0gNjsvLyBhdCBsZWFzdCBzaXggUkM0IG91dHB1dHMgZm9yIGVhY2ggZG91YmxlXHJcbnZhciBkaWdpdHMgPSA1MjsvLyB0aGVyZSBhcmUgNTIgc2lnbmlmaWNhbnQgZGlnaXRzIGluIGEgZG91YmxlXHJcbnZhciBwb29sID0gW107Ly8gcG9vbDogZW50cm9weSBwb29sIHN0YXJ0cyBlbXB0eVxyXG52YXIgR0xPQkFMID0gdHlwZW9mIGdsb2JhbCA9PT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiBnbG9iYWw7XHJcblxyXG4vL1xyXG4vLyBUaGUgZm9sbG93aW5nIGNvbnN0YW50cyBhcmUgcmVsYXRlZCB0byBJRUVFIDc1NCBsaW1pdHMuXHJcbi8vXHJcbnZhciBzdGFydGRlbm9tID0gTWF0aC5wb3cod2lkdGgsIGNodW5rcyksXHJcbiAgICBzaWduaWZpY2FuY2UgPSBNYXRoLnBvdygyLCBkaWdpdHMpLFxyXG4gICAgb3ZlcmZsb3cgPSBzaWduaWZpY2FuY2UgKiAyLFxyXG4gICAgbWFzayA9IHdpZHRoIC0gMTtcclxuXHJcblxyXG52YXIgb2xkUmFuZG9tID0gTWF0aC5yYW5kb207XHJcblxyXG4vL1xyXG4vLyBzZWVkcmFuZG9tKClcclxuLy8gVGhpcyBpcyB0aGUgc2VlZHJhbmRvbSBmdW5jdGlvbiBkZXNjcmliZWQgYWJvdmUuXHJcbi8vXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VlZCwgb3B0aW9ucykge1xyXG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuZ2xvYmFsID09PSB0cnVlKSB7XHJcbiAgICBvcHRpb25zLmdsb2JhbCA9IGZhbHNlO1xyXG4gICAgTWF0aC5yYW5kb20gPSBtb2R1bGUuZXhwb3J0cyhzZWVkLCBvcHRpb25zKTtcclxuICAgIG9wdGlvbnMuZ2xvYmFsID0gdHJ1ZTtcclxuICAgIHJldHVybiBNYXRoLnJhbmRvbTtcclxuICB9XHJcbiAgdmFyIHVzZV9lbnRyb3B5ID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5lbnRyb3B5KSB8fCBmYWxzZTtcclxuICB2YXIga2V5ID0gW107XHJcblxyXG4gIC8vIEZsYXR0ZW4gdGhlIHNlZWQgc3RyaW5nIG9yIGJ1aWxkIG9uZSBmcm9tIGxvY2FsIGVudHJvcHkgaWYgbmVlZGVkLlxyXG4gIHZhciBzaG9ydHNlZWQgPSBtaXhrZXkoZmxhdHRlbihcclxuICAgIHVzZV9lbnRyb3B5ID8gW3NlZWQsIHRvc3RyaW5nKHBvb2wpXSA6XHJcbiAgICAwIGluIGFyZ3VtZW50cyA/IHNlZWQgOiBhdXRvc2VlZCgpLCAzKSwga2V5KTtcclxuXHJcbiAgLy8gVXNlIHRoZSBzZWVkIHRvIGluaXRpYWxpemUgYW4gQVJDNCBnZW5lcmF0b3IuXHJcbiAgdmFyIGFyYzQgPSBuZXcgQVJDNChrZXkpO1xyXG5cclxuICAvLyBNaXggdGhlIHJhbmRvbW5lc3MgaW50byBhY2N1bXVsYXRlZCBlbnRyb3B5LlxyXG4gIG1peGtleSh0b3N0cmluZyhhcmM0LlMpLCBwb29sKTtcclxuXHJcbiAgLy8gT3ZlcnJpZGUgTWF0aC5yYW5kb21cclxuXHJcbiAgLy8gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgcmFuZG9tIGRvdWJsZSBpbiBbMCwgMSkgdGhhdCBjb250YWluc1xyXG4gIC8vIHJhbmRvbW5lc3MgaW4gZXZlcnkgYml0IG9mIHRoZSBtYW50aXNzYSBvZiB0aGUgSUVFRSA3NTQgdmFsdWUuXHJcblxyXG4gIHJldHVybiBmdW5jdGlvbigpIHsgICAgICAgICAvLyBDbG9zdXJlIHRvIHJldHVybiBhIHJhbmRvbSBkb3VibGU6XHJcbiAgICB2YXIgbiA9IGFyYzQuZyhjaHVua3MpLCAgICAgICAgICAgICAvLyBTdGFydCB3aXRoIGEgbnVtZXJhdG9yIG4gPCAyIF4gNDhcclxuICAgICAgICBkID0gc3RhcnRkZW5vbSwgICAgICAgICAgICAgICAgIC8vICAgYW5kIGRlbm9taW5hdG9yIGQgPSAyIF4gNDguXHJcbiAgICAgICAgeCA9IDA7ICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGFuZCBubyAnZXh0cmEgbGFzdCBieXRlJy5cclxuICAgIHdoaWxlIChuIDwgc2lnbmlmaWNhbmNlKSB7ICAgICAgICAgIC8vIEZpbGwgdXAgYWxsIHNpZ25pZmljYW50IGRpZ2l0cyBieVxyXG4gICAgICBuID0gKG4gKyB4KSAqIHdpZHRoOyAgICAgICAgICAgICAgLy8gICBzaGlmdGluZyBudW1lcmF0b3IgYW5kXHJcbiAgICAgIGQgKj0gd2lkdGg7ICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGRlbm9taW5hdG9yIGFuZCBnZW5lcmF0aW5nIGFcclxuICAgICAgeCA9IGFyYzQuZygxKTsgICAgICAgICAgICAgICAgICAgIC8vICAgbmV3IGxlYXN0LXNpZ25pZmljYW50LWJ5dGUuXHJcbiAgICB9XHJcbiAgICB3aGlsZSAobiA+PSBvdmVyZmxvdykgeyAgICAgICAgICAgICAvLyBUbyBhdm9pZCByb3VuZGluZyB1cCwgYmVmb3JlIGFkZGluZ1xyXG4gICAgICBuIC89IDI7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBsYXN0IGJ5dGUsIHNoaWZ0IGV2ZXJ5dGhpbmdcclxuICAgICAgZCAvPSAyOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcmlnaHQgdXNpbmcgaW50ZWdlciBNYXRoIHVudGlsXHJcbiAgICAgIHggPj4+PSAxOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIHdlIGhhdmUgZXhhY3RseSB0aGUgZGVzaXJlZCBiaXRzLlxyXG4gICAgfVxyXG4gICAgcmV0dXJuIChuICsgeCkgLyBkOyAgICAgICAgICAgICAgICAgLy8gRm9ybSB0aGUgbnVtYmVyIHdpdGhpbiBbMCwgMSkuXHJcbiAgfTtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzLnJlc2V0R2xvYmFsID0gZnVuY3Rpb24gKCkge1xyXG4gIE1hdGgucmFuZG9tID0gb2xkUmFuZG9tO1xyXG59O1xyXG5cclxuLy9cclxuLy8gQVJDNFxyXG4vL1xyXG4vLyBBbiBBUkM0IGltcGxlbWVudGF0aW9uLiAgVGhlIGNvbnN0cnVjdG9yIHRha2VzIGEga2V5IGluIHRoZSBmb3JtIG9mXHJcbi8vIGFuIGFycmF5IG9mIGF0IG1vc3QgKHdpZHRoKSBpbnRlZ2VycyB0aGF0IHNob3VsZCBiZSAwIDw9IHggPCAod2lkdGgpLlxyXG4vL1xyXG4vLyBUaGUgZyhjb3VudCkgbWV0aG9kIHJldHVybnMgYSBwc2V1ZG9yYW5kb20gaW50ZWdlciB0aGF0IGNvbmNhdGVuYXRlc1xyXG4vLyB0aGUgbmV4dCAoY291bnQpIG91dHB1dHMgZnJvbSBBUkM0LiAgSXRzIHJldHVybiB2YWx1ZSBpcyBhIG51bWJlciB4XHJcbi8vIHRoYXQgaXMgaW4gdGhlIHJhbmdlIDAgPD0geCA8ICh3aWR0aCBeIGNvdW50KS5cclxuLy9cclxuLyoqIEBjb25zdHJ1Y3RvciAqL1xyXG5mdW5jdGlvbiBBUkM0KGtleSkge1xyXG4gIHZhciB0LCBrZXlsZW4gPSBrZXkubGVuZ3RoLFxyXG4gICAgICBtZSA9IHRoaXMsIGkgPSAwLCBqID0gbWUuaSA9IG1lLmogPSAwLCBzID0gbWUuUyA9IFtdO1xyXG5cclxuICAvLyBUaGUgZW1wdHkga2V5IFtdIGlzIHRyZWF0ZWQgYXMgWzBdLlxyXG4gIGlmICgha2V5bGVuKSB7IGtleSA9IFtrZXlsZW4rK107IH1cclxuXHJcbiAgLy8gU2V0IHVwIFMgdXNpbmcgdGhlIHN0YW5kYXJkIGtleSBzY2hlZHVsaW5nIGFsZ29yaXRobS5cclxuICB3aGlsZSAoaSA8IHdpZHRoKSB7XHJcbiAgICBzW2ldID0gaSsrO1xyXG4gIH1cclxuICBmb3IgKGkgPSAwOyBpIDwgd2lkdGg7IGkrKykge1xyXG4gICAgc1tpXSA9IHNbaiA9IG1hc2sgJiAoaiArIGtleVtpICUga2V5bGVuXSArICh0ID0gc1tpXSkpXTtcclxuICAgIHNbal0gPSB0O1xyXG4gIH1cclxuXHJcbiAgLy8gVGhlIFwiZ1wiIG1ldGhvZCByZXR1cm5zIHRoZSBuZXh0IChjb3VudCkgb3V0cHV0cyBhcyBvbmUgbnVtYmVyLlxyXG4gIChtZS5nID0gZnVuY3Rpb24oY291bnQpIHtcclxuICAgIC8vIFVzaW5nIGluc3RhbmNlIG1lbWJlcnMgaW5zdGVhZCBvZiBjbG9zdXJlIHN0YXRlIG5lYXJseSBkb3VibGVzIHNwZWVkLlxyXG4gICAgdmFyIHQsIHIgPSAwLFxyXG4gICAgICAgIGkgPSBtZS5pLCBqID0gbWUuaiwgcyA9IG1lLlM7XHJcbiAgICB3aGlsZSAoY291bnQtLSkge1xyXG4gICAgICB0ID0gc1tpID0gbWFzayAmIChpICsgMSldO1xyXG4gICAgICByID0gciAqIHdpZHRoICsgc1ttYXNrICYgKChzW2ldID0gc1tqID0gbWFzayAmIChqICsgdCldKSArIChzW2pdID0gdCkpXTtcclxuICAgIH1cclxuICAgIG1lLmkgPSBpOyBtZS5qID0gajtcclxuICAgIHJldHVybiByO1xyXG4gICAgLy8gRm9yIHJvYnVzdCB1bnByZWRpY3RhYmlsaXR5IGRpc2NhcmQgYW4gaW5pdGlhbCBiYXRjaCBvZiB2YWx1ZXMuXHJcbiAgICAvLyBTZWUgaHR0cDovL3d3dy5yc2EuY29tL3JzYWxhYnMvbm9kZS5hc3A/aWQ9MjAwOVxyXG4gIH0pKHdpZHRoKTtcclxufVxyXG5cclxuLy9cclxuLy8gZmxhdHRlbigpXHJcbi8vIENvbnZlcnRzIGFuIG9iamVjdCB0cmVlIHRvIG5lc3RlZCBhcnJheXMgb2Ygc3RyaW5ncy5cclxuLy9cclxuZnVuY3Rpb24gZmxhdHRlbihvYmosIGRlcHRoKSB7XHJcbiAgdmFyIHJlc3VsdCA9IFtdLCB0eXAgPSAodHlwZW9mIG9iailbMF0sIHByb3A7XHJcbiAgaWYgKGRlcHRoICYmIHR5cCA9PSAnbycpIHtcclxuICAgIGZvciAocHJvcCBpbiBvYmopIHtcclxuICAgICAgdHJ5IHsgcmVzdWx0LnB1c2goZmxhdHRlbihvYmpbcHJvcF0sIGRlcHRoIC0gMSkpOyB9IGNhdGNoIChlKSB7fVxyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gKHJlc3VsdC5sZW5ndGggPyByZXN1bHQgOiB0eXAgPT0gJ3MnID8gb2JqIDogb2JqICsgJ1xcMCcpO1xyXG59XHJcblxyXG4vL1xyXG4vLyBtaXhrZXkoKVxyXG4vLyBNaXhlcyBhIHN0cmluZyBzZWVkIGludG8gYSBrZXkgdGhhdCBpcyBhbiBhcnJheSBvZiBpbnRlZ2VycywgYW5kXHJcbi8vIHJldHVybnMgYSBzaG9ydGVuZWQgc3RyaW5nIHNlZWQgdGhhdCBpcyBlcXVpdmFsZW50IHRvIHRoZSByZXN1bHQga2V5LlxyXG4vL1xyXG5mdW5jdGlvbiBtaXhrZXkoc2VlZCwga2V5KSB7XHJcbiAgdmFyIHN0cmluZ3NlZWQgPSBzZWVkICsgJycsIHNtZWFyLCBqID0gMDtcclxuICB3aGlsZSAoaiA8IHN0cmluZ3NlZWQubGVuZ3RoKSB7XHJcbiAgICBrZXlbbWFzayAmIGpdID1cclxuICAgICAgbWFzayAmICgoc21lYXIgXj0ga2V5W21hc2sgJiBqXSAqIDE5KSArIHN0cmluZ3NlZWQuY2hhckNvZGVBdChqKyspKTtcclxuICB9XHJcbiAgcmV0dXJuIHRvc3RyaW5nKGtleSk7XHJcbn1cclxuXHJcbi8vXHJcbi8vIGF1dG9zZWVkKClcclxuLy8gUmV0dXJucyBhbiBvYmplY3QgZm9yIGF1dG9zZWVkaW5nLCB1c2luZyB3aW5kb3cuY3J5cHRvIGlmIGF2YWlsYWJsZS5cclxuLy9cclxuLyoqIEBwYXJhbSB7VWludDhBcnJheT19IHNlZWQgKi9cclxuZnVuY3Rpb24gYXV0b3NlZWQoc2VlZCkge1xyXG4gIHRyeSB7XHJcbiAgICBHTE9CQUwuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhzZWVkID0gbmV3IFVpbnQ4QXJyYXkod2lkdGgpKTtcclxuICAgIHJldHVybiB0b3N0cmluZyhzZWVkKTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICByZXR1cm4gWytuZXcgRGF0ZSwgR0xPQkFMLCBHTE9CQUwubmF2aWdhdG9yICYmIEdMT0JBTC5uYXZpZ2F0b3IucGx1Z2lucyxcclxuICAgICAgICAgICAgR0xPQkFMLnNjcmVlbiwgdG9zdHJpbmcocG9vbCldO1xyXG4gIH1cclxufVxyXG5cclxuLy9cclxuLy8gdG9zdHJpbmcoKVxyXG4vLyBDb252ZXJ0cyBhbiBhcnJheSBvZiBjaGFyY29kZXMgdG8gYSBzdHJpbmdcclxuLy9cclxuZnVuY3Rpb24gdG9zdHJpbmcoYSkge1xyXG4gIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KDAsIGEpO1xyXG59XHJcblxyXG4vL1xyXG4vLyBXaGVuIHNlZWRyYW5kb20uanMgaXMgbG9hZGVkLCB3ZSBpbW1lZGlhdGVseSBtaXggYSBmZXcgYml0c1xyXG4vLyBmcm9tIHRoZSBidWlsdC1pbiBSTkcgaW50byB0aGUgZW50cm9weSBwb29sLiAgQmVjYXVzZSB3ZSBkb1xyXG4vLyBub3Qgd2FudCB0byBpbnRlZmVyZSB3aXRoIGRldGVybWluc3RpYyBQUk5HIHN0YXRlIGxhdGVyLFxyXG4vLyBzZWVkcmFuZG9tIHdpbGwgbm90IGNhbGwgTWF0aC5yYW5kb20gb24gaXRzIG93biBhZ2FpbiBhZnRlclxyXG4vLyBpbml0aWFsaXphdGlvbi5cclxuLy9cclxubWl4a2V5KE1hdGgucmFuZG9tKCksIHBvb2wpO1xyXG4iLCIvKlxuICogQSBmYXN0IGphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2Ygc2ltcGxleCBub2lzZSBieSBKb25hcyBXYWduZXJcblxuQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbkJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG5cblxuIENvcHlyaWdodCAoYykgMjAxOCBKb25hcyBXYWduZXJcblxuIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuIFNPRlRXQVJFLlxuICovXG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgRjIgPSAwLjUgKiAoTWF0aC5zcXJ0KDMuMCkgLSAxLjApO1xuICB2YXIgRzIgPSAoMy4wIC0gTWF0aC5zcXJ0KDMuMCkpIC8gNi4wO1xuICB2YXIgRjMgPSAxLjAgLyAzLjA7XG4gIHZhciBHMyA9IDEuMCAvIDYuMDtcbiAgdmFyIEY0ID0gKE1hdGguc3FydCg1LjApIC0gMS4wKSAvIDQuMDtcbiAgdmFyIEc0ID0gKDUuMCAtIE1hdGguc3FydCg1LjApKSAvIDIwLjA7XG5cbiAgZnVuY3Rpb24gU2ltcGxleE5vaXNlKHJhbmRvbU9yU2VlZCkge1xuICAgIHZhciByYW5kb207XG4gICAgaWYgKHR5cGVvZiByYW5kb21PclNlZWQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmFuZG9tID0gcmFuZG9tT3JTZWVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChyYW5kb21PclNlZWQpIHtcbiAgICAgIHJhbmRvbSA9IGFsZWEocmFuZG9tT3JTZWVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZG9tID0gTWF0aC5yYW5kb207XG4gICAgfVxuICAgIHRoaXMucCA9IGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pO1xuICAgIHRoaXMucGVybSA9IG5ldyBVaW50OEFycmF5KDUxMik7XG4gICAgdGhpcy5wZXJtTW9kMTIgPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTEyOyBpKyspIHtcbiAgICAgIHRoaXMucGVybVtpXSA9IHRoaXMucFtpICYgMjU1XTtcbiAgICAgIHRoaXMucGVybU1vZDEyW2ldID0gdGhpcy5wZXJtW2ldICUgMTI7XG4gICAgfVxuXG4gIH1cbiAgU2ltcGxleE5vaXNlLnByb3RvdHlwZSA9IHtcbiAgICBncmFkMzogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMCxcbiAgICAgIC0xLCAxLCAwLFxuICAgICAgMSwgLTEsIDAsXG5cbiAgICAgIC0xLCAtMSwgMCxcbiAgICAgIDEsIDAsIDEsXG4gICAgICAtMSwgMCwgMSxcblxuICAgICAgMSwgMCwgLTEsXG4gICAgICAtMSwgMCwgLTEsXG4gICAgICAwLCAxLCAxLFxuXG4gICAgICAwLCAtMSwgMSxcbiAgICAgIDAsIDEsIC0xLFxuICAgICAgMCwgLTEsIC0xXSksXG4gICAgZ3JhZDQ6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLFxuICAgICAgMCwgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLFxuICAgICAgMSwgMCwgMSwgMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAxLCAxLCAwLCAtMSwgLTEsXG4gICAgICAtMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsXG4gICAgICAxLCAxLCAwLCAxLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIDEsIDEsIC0xLCAwLCAtMSxcbiAgICAgIC0xLCAxLCAwLCAxLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSxcbiAgICAgIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLCAwLFxuICAgICAgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLCAwXSksXG4gICAgbm9pc2UyRDogZnVuY3Rpb24oeGluLCB5aW4pIHtcbiAgICAgIHZhciBwZXJtTW9kMTIgPSB0aGlzLnBlcm1Nb2QxMjtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQzID0gdGhpcy5ncmFkMztcbiAgICAgIHZhciBuMCA9IDA7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIG4xID0gMDtcbiAgICAgIHZhciBuMiA9IDA7XG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4pICogRjI7IC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqKSAqIEcyO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgLy8gRm9yIHRoZSAyRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhbiBlcXVpbGF0ZXJhbCB0cmlhbmdsZS5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCAobWlkZGxlKSBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqKSBjb29yZHNcbiAgICAgIGlmICh4MCA+IHkwKSB7XG4gICAgICAgIGkxID0gMTtcbiAgICAgICAgajEgPSAwO1xuICAgICAgfSAvLyBsb3dlciB0cmlhbmdsZSwgWFkgb3JkZXI6ICgwLDApLT4oMSwwKS0+KDEsMSlcbiAgICAgIGVsc2Uge1xuICAgICAgICBpMSA9IDA7XG4gICAgICAgIGoxID0gMTtcbiAgICAgIH0gLy8gdXBwZXIgdHJpYW5nbGUsIFlYIG9yZGVyOiAoMCwwKS0+KDAsMSktPigxLDEpXG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG4gICAgICAvLyBjID0gKDMtc3FydCgzKSkvNlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEcyOyAvLyBPZmZzZXRzIGZvciBtaWRkbGUgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEcyO1xuICAgICAgdmFyIHgyID0geDAgLSAxLjAgKyAyLjAgKiBHMjsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIDEuMCArIDIuMCAqIEcyO1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSB0aHJlZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC41IC0geDAgKiB4MCAtIHkwICogeTA7XG4gICAgICBpZiAodDAgPj0gMCkge1xuICAgICAgICB2YXIgZ2kwID0gcGVybU1vZDEyW2lpICsgcGVybVtqal1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwKTsgLy8gKHgseSkgb2YgZ3JhZDMgdXNlZCBmb3IgMkQgZ3JhZGllbnRcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNSAtIHgxICogeDEgLSB5MSAqIHkxO1xuICAgICAgaWYgKHQxID49IDApIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC41IC0geDIgKiB4MiAtIHkyICogeTI7XG4gICAgICBpZiAodDIgPj0gMCkge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgMSArIHBlcm1bamogKyAxXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gcmV0dXJuIHZhbHVlcyBpbiB0aGUgaW50ZXJ2YWwgWy0xLDFdLlxuICAgICAgcmV0dXJuIDcwLjAgKiAobjAgKyBuMSArIG4yKTtcbiAgICB9LFxuICAgIC8vIDNEIHNpbXBsZXggbm9pc2VcbiAgICBub2lzZTNEOiBmdW5jdGlvbih4aW4sIHlpbiwgemluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAsIG4xLCBuMiwgbjM7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZm91ciBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4gKyB6aW4pICogRjM7IC8vIFZlcnkgbmljZSBhbmQgc2ltcGxlIHNrZXcgZmFjdG9yIGZvciAzRFxuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHppbiArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGogKyBrKSAqIEczO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHopIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciBaMCA9IGsgLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkseiBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgdmFyIHowID0gemluIC0gWjA7XG4gICAgICAvLyBGb3IgdGhlIDNEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGEgc2xpZ2h0bHkgaXJyZWd1bGFyIHRldHJhaGVkcm9uLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgICAgdmFyIGkxLCBqMSwgazE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgdmFyIGkyLCBqMiwgazI7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGosaykgY29vcmRzXG4gICAgICBpZiAoeDAgPj0geTApIHtcbiAgICAgICAgaWYgKHkwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDA7XG4gICAgICAgIH0gLy8gWCBZIFogb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPj0gejApIHtcbiAgICAgICAgICBpMSA9IDE7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBYIFogWSBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMTtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBaIFggWSBvcmRlclxuICAgICAgfVxuICAgICAgZWxzZSB7IC8vIHgwPHkwXG4gICAgICAgIGlmICh5MCA8IHowKSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAwO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBZIFggb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFkgWiBYIG9yZGVyXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFkgWCBaIG9yZGVyXG4gICAgICB9XG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCwwKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jLC1jKSBpbiAoeCx5LHopLFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDEsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYywtYykgaW4gKHgseSx6KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMCwxKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoLWMsLWMsMS1jKSBpbiAoeCx5LHopLCB3aGVyZVxuICAgICAgLy8gYyA9IDEvNi5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMzsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEczO1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEczO1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEczOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gajIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB6MiA9IHowIC0gazIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB4MyA9IHgwIC0gMS4wICsgMy4wICogRzM7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTMgPSB5MCAtIDEuMCArIDMuMCAqIEczO1xuICAgICAgdmFyIHozID0gejAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZm91ciBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowO1xuICAgICAgaWYgKHQwIDwgMCkgbjAgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bamogKyBwZXJtW2trXV1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwICsgZ3JhZDNbZ2kwICsgMl0gKiB6MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejE7XG4gICAgICBpZiAodDEgPCAwKSBuMSA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kxID0gcGVybU1vZDEyW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazFdXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEgKyBncmFkM1tnaTEgKyAyXSAqIHoxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSBwZXJtTW9kMTJbaWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMl1dXSAqIDM7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDNbZ2kyXSAqIHgyICsgZ3JhZDNbZ2kyICsgMV0gKiB5MiArIGdyYWQzW2dpMiArIDJdICogejIpO1xuICAgICAgfVxuICAgICAgdmFyIHQzID0gMC42IC0geDMgKiB4MyAtIHkzICogeTMgLSB6MyAqIHozO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxXV1dICogMztcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkM1tnaTNdICogeDMgKyBncmFkM1tnaTMgKyAxXSAqIHkzICsgZ3JhZDNbZ2kzICsgMl0gKiB6Myk7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byBzdGF5IGp1c3QgaW5zaWRlIFstMSwxXVxuICAgICAgcmV0dXJuIDMyLjAgKiAobjAgKyBuMSArIG4yICsgbjMpO1xuICAgIH0sXG4gICAgLy8gNEQgc2ltcGxleCBub2lzZSwgYmV0dGVyIHNpbXBsZXggcmFuayBvcmRlcmluZyBtZXRob2QgMjAxMi0wMy0wOVxuICAgIG5vaXNlNEQ6IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQ0ID0gdGhpcy5ncmFkNDtcblxuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zLCBuNDsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIC8vIFNrZXcgdGhlICh4LHkseix3KSBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggY2VsbCBvZiAyNCBzaW1wbGljZXMgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHggKyB5ICsgeiArIHcpICogRjQ7IC8vIEZhY3RvciBmb3IgNEQgc2tld2luZ1xuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHggKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5ICsgcyk7XG4gICAgICB2YXIgayA9IE1hdGguZmxvb3IoeiArIHMpO1xuICAgICAgdmFyIGwgPSBNYXRoLmZsb29yKHcgKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgayArIGwpICogRzQ7IC8vIEZhY3RvciBmb3IgNEQgdW5za2V3aW5nXG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkseix3KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciBXMCA9IGwgLSB0O1xuICAgICAgdmFyIHgwID0geCAtIFgwOyAvLyBUaGUgeCx5LHosdyBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHkgLSBZMDtcbiAgICAgIHZhciB6MCA9IHogLSBaMDtcbiAgICAgIHZhciB3MCA9IHcgLSBXMDtcbiAgICAgIC8vIEZvciB0aGUgNEQgY2FzZSwgdGhlIHNpbXBsZXggaXMgYSA0RCBzaGFwZSBJIHdvbid0IGV2ZW4gdHJ5IHRvIGRlc2NyaWJlLlxuICAgICAgLy8gVG8gZmluZCBvdXQgd2hpY2ggb2YgdGhlIDI0IHBvc3NpYmxlIHNpbXBsaWNlcyB3ZSdyZSBpbiwgd2UgbmVlZCB0b1xuICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWduaXR1ZGUgb3JkZXJpbmcgb2YgeDAsIHkwLCB6MCBhbmQgdzAuXG4gICAgICAvLyBTaXggcGFpci13aXNlIGNvbXBhcmlzb25zIGFyZSBwZXJmb3JtZWQgYmV0d2VlbiBlYWNoIHBvc3NpYmxlIHBhaXJcbiAgICAgIC8vIG9mIHRoZSBmb3VyIGNvb3JkaW5hdGVzLCBhbmQgdGhlIHJlc3VsdHMgYXJlIHVzZWQgdG8gcmFuayB0aGUgbnVtYmVycy5cbiAgICAgIHZhciByYW5reCA9IDA7XG4gICAgICB2YXIgcmFua3kgPSAwO1xuICAgICAgdmFyIHJhbmt6ID0gMDtcbiAgICAgIHZhciByYW5rdyA9IDA7XG4gICAgICBpZiAoeDAgPiB5MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3krKztcbiAgICAgIGlmICh4MCA+IHowKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5reisrO1xuICAgICAgaWYgKHgwID4gdzApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICBpZiAoeTAgPiB6MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh5MCA+IHcwKSByYW5reSsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHowID4gdzApIHJhbmt6Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICB2YXIgaTEsIGoxLCBrMSwgbDE7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBzZWNvbmQgc2ltcGxleCBjb3JuZXJcbiAgICAgIHZhciBpMiwgajIsIGsyLCBsMjsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIHRoaXJkIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTMsIGozLCBrMywgbDM7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBmb3VydGggc2ltcGxleCBjb3JuZXJcbiAgICAgIC8vIHNpbXBsZXhbY10gaXMgYSA0LXZlY3RvciB3aXRoIHRoZSBudW1iZXJzIDAsIDEsIDIgYW5kIDMgaW4gc29tZSBvcmRlci5cbiAgICAgIC8vIE1hbnkgdmFsdWVzIG9mIGMgd2lsbCBuZXZlciBvY2N1ciwgc2luY2UgZS5nLiB4Pnk+ej53IG1ha2VzIHg8eiwgeTx3IGFuZCB4PHdcbiAgICAgIC8vIGltcG9zc2libGUuIE9ubHkgdGhlIDI0IGluZGljZXMgd2hpY2ggaGF2ZSBub24temVybyBlbnRyaWVzIG1ha2UgYW55IHNlbnNlLlxuICAgICAgLy8gV2UgdXNlIGEgdGhyZXNob2xkaW5nIHRvIHNldCB0aGUgY29vcmRpbmF0ZXMgaW4gdHVybiBmcm9tIHRoZSBsYXJnZXN0IG1hZ25pdHVkZS5cbiAgICAgIC8vIFJhbmsgMyBkZW5vdGVzIHRoZSBsYXJnZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMSA9IHJhbmt4ID49IDMgPyAxIDogMDtcbiAgICAgIGoxID0gcmFua3kgPj0gMyA/IDEgOiAwO1xuICAgICAgazEgPSByYW5reiA+PSAzID8gMSA6IDA7XG4gICAgICBsMSA9IHJhbmt3ID49IDMgPyAxIDogMDtcbiAgICAgIC8vIFJhbmsgMiBkZW5vdGVzIHRoZSBzZWNvbmQgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTIgPSByYW5reCA+PSAyID8gMSA6IDA7XG4gICAgICBqMiA9IHJhbmt5ID49IDIgPyAxIDogMDtcbiAgICAgIGsyID0gcmFua3ogPj0gMiA/IDEgOiAwO1xuICAgICAgbDIgPSByYW5rdyA+PSAyID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDEgZGVub3RlcyB0aGUgc2Vjb25kIHNtYWxsZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMyA9IHJhbmt4ID49IDEgPyAxIDogMDtcbiAgICAgIGozID0gcmFua3kgPj0gMSA/IDEgOiAwO1xuICAgICAgazMgPSByYW5reiA+PSAxID8gMSA6IDA7XG4gICAgICBsMyA9IHJhbmt3ID49IDEgPyAxIDogMDtcbiAgICAgIC8vIFRoZSBmaWZ0aCBjb3JuZXIgaGFzIGFsbCBjb29yZGluYXRlIG9mZnNldHMgPSAxLCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgdGhhdC5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHNDsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzQ7XG4gICAgICB2YXIgejEgPSB6MCAtIGsxICsgRzQ7XG4gICAgICB2YXIgdzEgPSB3MCAtIGwxICsgRzQ7XG4gICAgICB2YXIgeDIgPSB4MCAtIGkyICsgMi4wICogRzQ7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzQ7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzQ7XG4gICAgICB2YXIgdzIgPSB3MCAtIGwyICsgMi4wICogRzQ7XG4gICAgICB2YXIgeDMgPSB4MCAtIGkzICsgMy4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGZvdXJ0aCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSBqMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHozID0gejAgLSBrMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHczID0gdzAgLSBsMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHg0ID0geDAgLSAxLjAgKyA0LjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHk0ID0geTAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIHZhciB6NCA9IHowIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgdzQgPSB3MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSBmaXZlIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICB2YXIga2sgPSBrICYgMjU1O1xuICAgICAgdmFyIGxsID0gbCAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZpdmUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowIC0gdzAgKiB3MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSAocGVybVtpaSArIHBlcm1bamogKyBwZXJtW2trICsgcGVybVtsbF1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQ0W2dpMF0gKiB4MCArIGdyYWQ0W2dpMCArIDFdICogeTAgKyBncmFkNFtnaTAgKyAyXSAqIHowICsgZ3JhZDRbZ2kwICsgM10gKiB3MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejEgLSB3MSAqIHcxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IChwZXJtW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazEgKyBwZXJtW2xsICsgbDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkNFtnaTFdICogeDEgKyBncmFkNFtnaTEgKyAxXSAqIHkxICsgZ3JhZDRbZ2kxICsgMl0gKiB6MSArIGdyYWQ0W2dpMSArIDNdICogdzEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC42IC0geDIgKiB4MiAtIHkyICogeTIgLSB6MiAqIHoyIC0gdzIgKiB3MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSAocGVybVtpaSArIGkyICsgcGVybVtqaiArIGoyICsgcGVybVtrayArIGsyICsgcGVybVtsbCArIGwyXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDRbZ2kyXSAqIHgyICsgZ3JhZDRbZ2kyICsgMV0gKiB5MiArIGdyYWQ0W2dpMiArIDJdICogejIgKyBncmFkNFtnaTIgKyAzXSAqIHcyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MyAtIHczICogdzM7XG4gICAgICBpZiAodDMgPCAwKSBuMyA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kzID0gKHBlcm1baWkgKyBpMyArIHBlcm1bamogKyBqMyArIHBlcm1ba2sgKyBrMyArIHBlcm1bbGwgKyBsM11dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MyAqPSB0MztcbiAgICAgICAgbjMgPSB0MyAqIHQzICogKGdyYWQ0W2dpM10gKiB4MyArIGdyYWQ0W2dpMyArIDFdICogeTMgKyBncmFkNFtnaTMgKyAyXSAqIHozICsgZ3JhZDRbZ2kzICsgM10gKiB3Myk7XG4gICAgICB9XG4gICAgICB2YXIgdDQgPSAwLjYgLSB4NCAqIHg0IC0geTQgKiB5NCAtIHo0ICogejQgLSB3NCAqIHc0O1xuICAgICAgaWYgKHQ0IDwgMCkgbjQgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpNCA9IChwZXJtW2lpICsgMSArIHBlcm1bamogKyAxICsgcGVybVtrayArIDEgKyBwZXJtW2xsICsgMV1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0NCAqPSB0NDtcbiAgICAgICAgbjQgPSB0NCAqIHQ0ICogKGdyYWQ0W2dpNF0gKiB4NCArIGdyYWQ0W2dpNCArIDFdICogeTQgKyBncmFkNFtnaTQgKyAyXSAqIHo0ICsgZ3JhZDRbZ2k0ICsgM10gKiB3NCk7XG4gICAgICB9XG4gICAgICAvLyBTdW0gdXAgYW5kIHNjYWxlIHRoZSByZXN1bHQgdG8gY292ZXIgdGhlIHJhbmdlIFstMSwxXVxuICAgICAgcmV0dXJuIDI3LjAgKiAobjAgKyBuMSArIG4yICsgbjMgKyBuNCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgcCA9IG5ldyBVaW50OEFycmF5KDI1Nik7XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICBwW2ldID0gaTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NTsgaSsrKSB7XG4gICAgICB2YXIgciA9IGkgKyB+fihyYW5kb20oKSAqICgyNTYgLSBpKSk7XG4gICAgICB2YXIgYXV4ID0gcFtpXTtcbiAgICAgIHBbaV0gPSBwW3JdO1xuICAgICAgcFtyXSA9IGF1eDtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgU2ltcGxleE5vaXNlLl9idWlsZFBlcm11dGF0aW9uVGFibGUgPSBidWlsZFBlcm11dGF0aW9uVGFibGU7XG5cbiAgZnVuY3Rpb24gYWxlYSgpIHtcbiAgICAvLyBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbiAgICB2YXIgczAgPSAwO1xuICAgIHZhciBzMSA9IDA7XG4gICAgdmFyIHMyID0gMDtcbiAgICB2YXIgYyA9IDE7XG5cbiAgICB2YXIgbWFzaCA9IG1hc2hlcigpO1xuICAgIHMwID0gbWFzaCgnICcpO1xuICAgIHMxID0gbWFzaCgnICcpO1xuICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHMwIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMCA8IDApIHtcbiAgICAgICAgczAgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMxIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMSA8IDApIHtcbiAgICAgICAgczEgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMyIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMiA8IDApIHtcbiAgICAgICAgczIgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWFzaCA9IG51bGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICAgIHMwID0gczE7XG4gICAgICBzMSA9IHMyO1xuICAgICAgcmV0dXJuIHMyID0gdCAtIChjID0gdCB8IDApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWFzaGVyKCkge1xuICAgIHZhciBuID0gMHhlZmM4MjQ5ZDtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuICs9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgICAgdmFyIGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgaCAqPSBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuICAgICAgfVxuICAgICAgcmV0dXJuIChuID4+PiAwKSAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFtZFxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBTaW1wbGV4Tm9pc2U7fSk7XG4gIC8vIGNvbW1vbiBqc1xuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gYnJvd3NlclxuICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgd2luZG93LlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gbm9kZWpzXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU2ltcGxleE5vaXNlO1xuICB9XG5cbn0pKCk7XG4iLCJjb25zdCBjYW52YXNTa2V0Y2ggPSByZXF1aXJlKCdjYW52YXMtc2tldGNoJyk7XG5jb25zdCB7IGxlcnAgfSA9IHJlcXVpcmUoJ2NhbnZhcy1za2V0Y2gtdXRpbC9tYXRoJyk7XG5jb25zdCByYW5kb20gPSByZXF1aXJlKCdjYW52YXMtc2tldGNoLXV0aWwvcmFuZG9tJyk7XG5cbmNvbnN0IHNldHRpbmdzID0ge1xuICBkaW1lbnNpb25zOiBbIDIwNDgsIDIwNDggXVxufTtcblxuY29uc3Qgc2tldGNoID0gKCkgPT4ge1xuICBjb25zdCBjcmVhdGVHcmlkID0gKCk9PntcbiAgICBjb25zdCBwb2ludHMgPSBbXTtcbiAgICBjb25zdCBjb3VudCA9IDQwO1xuXG4gICAgZm9yKGxldCB4PTA7eDxjb3VudDt4Kyspe1xuICAgICAgZm9yKGxldCB5PTA7eTxjb3VudDt5Kyspe1xuICAgICAgICBjb25zdCB1ID0gY291bnQ8PTE/MC41OngvKGNvdW50LTEpO1xuICAgICAgICBjb25zdCB2ID0gY291bnQ8PTE/MC41OnkvKGNvdW50LTEpO1xuICAgICAgICBcbiAgICAgICAgcG9pbnRzLnB1c2goW3Usdl0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBwb2ludHM7XG4gIH1cbiAgXG4gIC8vcmFuZG9tLnNldFNlZWQoNTEyKTtcbiAgY29uc3QgcG9pbnRzID0gY3JlYXRlR3JpZCgpLmZpbHRlcigoKSA9PiByYW5kb20udmFsdWUoKSA+IDAuNik7XG4gIGNvbnN0IG1hcmdpbiA9IDMwMDtcbiAgY29uc29sZS5sb2cocG9pbnRzKTtcblxuICByZXR1cm4gKHsgY29udGV4dCwgd2lkdGgsIGhlaWdodCB9KSA9PiB7XG4gICAgY29udGV4dC5maWxsU3R5bGU9JyMyODMxNDgnO1xuICAgIGNvbnRleHQuZmlsbFJlY3QoMCwgMCAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gICAgcG9pbnRzLm1hcCgoW3Usdl0pPT57XG4gICAgICAgIGNvbnN0IHggPSBsZXJwKG1hcmdpbiwgd2lkdGggLSBtYXJnaW4sIHUpO1xuICAgICAgICBjb25zdCB5ID0gbGVycChtYXJnaW4sIGhlaWdodCAtIG1hcmdpbiwgdik7XG5cbiAgICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgY29udGV4dC5hcmMoeCwgeSwgMTAsIE1hdGguUEkqMiwgZmFsc2UpO1xuICAgICAgICBcbiAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAnIzkxMzUzNSc7XG4gICAgICAgIGNvbnRleHQubGluZVdpZHRoID0gMTA7XG4gICAgICAgIGNvbnRleHQuZmlsbCgpO1xuICAgIH0pXG4gIH07XG59O1xuXG5jYW52YXNTa2V0Y2goc2tldGNoLCBzZXR0aW5ncyk7XG4iLCJcbmdsb2JhbC5DQU5WQVNfU0tFVENIX0RFRkFVTFRfU1RPUkFHRV9LRVkgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiJdfQ==
