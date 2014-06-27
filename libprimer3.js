// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    window['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    var source = Pointer_stringify(code);
    if (source[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (source.indexOf('"', 1) === source.length-1) {
        source = source.substr(1, source.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + source + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    try {
      var evalled = eval('(function(' + args.join(',') + '){ ' + source + ' })'); // new Function does not allow upvars in node
    } catch(e) {
      Module.printErr('error in executing inline EM_ASM code: ' + e + ' on: \n\n' + source + '\n\nwith args |' + args + '| (make sure to use the right one out of EM_ASM, EM_ASM_ARGS, etc.)');
      throw e;
    }
    return Runtime.asmConstCache[code] = evalled;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      /* TODO: use TextEncoder when present,
        var encoder = new TextEncoder();
        encoder['encoding'] = "utf-8";
        var utf8Array = encoder['encode'](aMsg.data);
      */
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===
var __ZTVN10__cxxabiv117__class_type_infoE = 25960;
var __ZTVN10__cxxabiv120__si_class_type_infoE = 26000;




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + Runtime.alignMemory(26827);
/* global initializers */ __ATINIT__.push({ func: function() { __GLOBAL__I_a() } });


/* memory initializer */ allocate([56,47,0,0,0,0,0,0,37,115,58,37,115,58,37,100,44,32,97,115,115,101,114,116,105,111,110,32,40,37,115,41,32,102,97,105,108,101,100,10,0,0,0,0,0,0,0,0,108,105,98,112,114,105,109,101,114,51,46,99,0,0,0,0,100,112,97,108,95,115,101,116,95,97,109,98,105,103,117,105,116,121,95,99,111,100,101,95,109,97,116,114,105,120,40,104,45,62,108,111,99,97,108,95,97,109,98,105,103,41,0,0,100,112,97,108,95,115,101,116,95,97,109,98,105,103,117,105,116,121,95,99,111,100,101,95,109,97,116,114,105,120,40,104,45,62,108,111,99,97,108,95,101,110,100,95,97,109,98,105,103,41,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,76,32,33,61,32,112,97,0,0,0,0,0,0,0,0,48,76,32,33,61,32,115,97,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,79,84,95,76,69,70,84,32,61,61,32,111,95,116,121,112,101,32,124,124,32,79,84,95,82,73,71,72,84,32,61,61,32,111,95,116,121,112,101,0,49,32,61,61,32,115,97,45,62,116,97,114,50,46,99,111,117,110,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,105,98,112,114,105,109,101,114,51,32,114,101,108,101,97,115,101,32,50,46,51,46,54,0,0,0,0,0,0,0,0,48,76,32,33,61,32,115,0,48,76,32,33,61,32,120,0,59,32,0,0,0,0,0,0,48,76,32,33,61,32,115,101,112,0,0,0,0,0,0,0,32,32,112,114,105,109,101,114,95,116,97,115,107,32,37,105,10,0,0,0,0,0,0,0,32,32,112,105,99,107,95,108,101,102,116,95,112,114,105,109,101,114,32,37,105,10,0,0,32,32,112,105,99,107,95,114,105,103,104,116,95,112,114,105,109,101,114,32,37,105,10,0,32,32,112,105,99,107,95,105,110,116,101,114,110,97,108,95,111,108,105,103,111,32,37,105,10,0,0,0,0,0,0,0,32,32,102,105,108,101,95,102,108,97,103,32,37,105,10,0,32,32,102,105,114,115,116,95,98,97,115,101,95,105,110,100,101,120,32,37,105,10,0,0,32,32,108,105,98,101,114,97,108,95,98,97,115,101,32,37,105,10,0,0,0,0,0,0,32,32,110,117,109,95,114,101,116,117,114,110,32,37,105,10,0,0,0,0,0,0,0,0,32,32,112,105,99,107,95,97,110,121,119,97,121,32,37,105,10,0,0,0,0,0,0,0,32,32,108,105,98,95,97,109,98,105,103,117,105,116,121,95,99,111,100,101,115,95,99,111,110,115,101,110,115,117,115,32,37,105,10,0,0,0,0,0,32,32,113,117,97,108,105,116,121,95,114,97,110,103,101,95,109,105,110,32,37,105,10,0,32,32,113,117,97,108,105,116,121,95,114,97,110,103,101,95,109,97,120,32,37,105,10,0,32,32,116,109,95,115,97,110,116,97,108,117,99,105,97,32,37,105,10,0,0,0,0,0,32,32,115,97,108,116,95,99,111,114,114,101,99,116,105,111,110,115,32,37,105,10,0,0,32,32,109,97,120,95,101,110,100,95,115,116,97,98,105,108,105,116,121,32,37,102,10,0,32,32,103,99,95,99,108,97,109,112,32,37,105,10,0,0,32,32,109,97,120,95,101,110,100,95,103,99,32,37,105,10,0,0,0,0,0,0,0,0,32,32,108,111,119,101,114,99,97,115,101,95,109,97,115,107,105,110,103,32,37,105,10,0,32,32,116,104,101,114,109,111,100,121,110,97,109,105,99,95,111,108,105,103,111,95,97,108,105,103,110,109,101,110,116,32,37,105,10,0,0,0,0,0,32,32,116,104,101,114,109,111,100,121,110,97,109,105,99,95,116,101,109,112,108,97,116,101,95,97,108,105,103,110,109,101,110,116,32,37,105,10,0,0,32,32,111,117,116,115,105,100,101,95,112,101,110,97,108,116,121,32,37,102,10,0,0,0,32,32,105,110,115,105,100,101,95,112,101,110,97,108,116,121,32,37,102,10,0,0,0,0,32,32,110,117,109,98,101,114,32,111,102,32,112,114,111,100,117,99,116,32,115,105,122,101,32,114,97,110,103,101,115,58,32,37,100,10,0,0,0,0,32,32,37,100,32,45,32,37,100,32,10,0,0,0,0,0,32,32,112,114,111,100,117,99,116,95,111,112,116,95,115,105,122,101,32,37,105,10,0,0,32,32,112,114,111,100,117,99,116,95,109,97,120,95,116,109,32,37,102,10,0,0,0,0,32,32,112,114,111,100,117,99,116,95,109,105,110,95,116,109,32,37,102,10,0,0,0,0,32,32,112,114,111,100,117,99,116,95,111,112,116,95,116,109,32,37,102,10,0,0,0,0,32,32,112,97,105,114,95,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,37,102,10,0,0,0,0,0,0,32,32,112,97,105,114,95,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,32,37,102,10,0,0,0,32,32,112,97,105,114,95,114,101,112,101,97,116,95,99,111,109,112,108,32,37,102,10,0,32,32,112,97,105,114,95,99,111,109,112,108,95,97,110,121,32,37,102,10,0,0,0,0,32,32,112,97,105,114,95,99,111,109,112,108,95,101,110,100,32,37,102,10,0,0,0,0,32,32,112,97,105,114,95,99,111,109,112,108,95,97,110,121,95,116,104,32,37,102,10,0,32,32,112,97,105,114,95,99,111,109,112,108,95,101,110,100,95,116,104,32,37,102,10,0,32,32,109,105,110,95,108,101,102,116,95,116,104,114,101,101,95,112,114,105,109,101,95,100,105,115,116,97,110,99,101,32,37,105,10,0,0,0,0,0,32,32,109,105,110,95,114,105,103,104,116,95,116,104,114,101,101,95,112,114,105,109,101,95,100,105,115,116,97,110,99,101,32,37,105,10,0,0,0,0,32,32,109,105,110,95,53,95,112,114,105,109,101,95,111,118,101,114,108,97,112,95,111,102,95,106,117,110,99,116,105,111,110,32,37,105,10,0,0,0,32,32,109,105,110,95,51,95,112,114,105,109,101,95,111,118,101,114,108,97,112,95,111,102,95,106,117,110,99,116,105,111,110,32,37,105,10,0,0,0,32,32,100,117,109,112,32,37,105,10,0,0,0,0,0,0,32,32,32,32,112,114,105,109,101,114,95,113,117,97,108,105,116,121,32,37,102,10,0,0,32,32,32,32,105,111,95,113,117,97,108,105,116,121,32,37,102,10,0,0,0,0,0,0,32,32,32,32,100,105,102,102,95,116,109,32,37,102,10,0,32,32,32,32,99,111,109,112,108,95,97,110,121,32,37,102,10,0,0,0,0,0,0,0,32,32,32,32,99,111,109,112,108,95,101,110,100,32,37,102,10,0,0,0,0,0,0,0,32,32,32,32,99,111,109,112,108,95,97,110,121,95,116,104,32,37,102,10,0,0,0,0,32,32,32,32,99,111,109,112,108,95,101,110,100,95,116,104,32,37,102,10,0,0,0,0,32,32,32,32,112,114,111,100,117,99,116,95,116,109,95,108,116,32,37,102,10,0,0,0,32,32,32,32,112,114,111,100,117,99,116,95,116,109,95,103,116,32,37,102,10,0,0,0,32,32,32,32,112,114,111,100,117,99,116,95,115,105,122,101,95,108,116,32,37,102,10,0,32,32,32,32,112,114,111,100,117,99,116,95,115,105,122,101,95,103,116,32,37,102,10,0,32,32,32,32,114,101,112,101,97,116,95,115,105,109,32,37,102,10,0,0,0,0,0,0,32,32,32,32,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,37,102,10,0,0,0,0,0,32,32,32,32,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,32,37,102,10,0,0,116,101,109,112,95,103,116,32,37,102,10,0,0,0,0,0,116,101,109,112,95,108,116,32,37,102,10,0,0,0,0,0,103,99,95,99,111,110,116,101,110,116,95,103,116,32,37,102,10,0,0,0,0,0,0,0,103,99,95,99,111,110,116,101,110,116,95,108,116,32,37,102,10,0,0,0,0,0,0,0,99,111,109,112,108,95,97,110,121,32,37,102,10,0,0,0,99,111,109,112,108,95,101,110,100,32,37,102,10,0,0,0,99,111,109,112,108,95,97,110,121,95,116,104,32,37,102,10,0,0,0,0,0,0,0,0,99,111,109,112,108,95,101,110,100,95,116,104,32,37,102,10,0,0,0,0,0,0,0,0,104,97,105,114,112,105,110,32,37,102,10,0,0,0,0,0,114,101,112,101,97,116,95,115,105,109,32,37,102,10,0,0,108,101,110,103,116,104,95,108,116,32,37,102,10,0,0,0,108,101,110,103,116,104,95,103,116,32,37,102,10,0,0,0,115,101,113,95,113,117,97,108,105,116,121,32,37,102,10,0,101,110,100,95,113,117,97,108,105,116,121,32,37,102,10,0,112,111,115,95,112,101,110,97,108,116,121,32,37,102,10,0,101,110,100,95,115,116,97,98,105,108,105,116,121,32,37,102,10,0,0,0,0,0,0,0,110,117,109,95,110,115,32,37,102,10,0,0,0,0,0,0,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,37,102,10,0,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,32,37,102,10,0,0,0,0,0,0,111,112,116,95,116,109,32,37,102,10,0,0,0,0,0,0,109,105,110,95,116,109,32,37,102,10,0,0,0,0,0,0,109,97,120,95,116,109,32,37,102,10,0,0,0,0,0,0,111,112,116,95,103,99,95,99,111,110,116,101,110,116,32,37,102,10,0,0,0,0,0,0,109,97,120,95,103,99,32,37,102,10,0,0,0,0,0,0,109,105,110,95,103,99,32,37,102,10,0,0,0,0,0,0,100,105,118,97,108,101,110,116,95,99,111,110,99,32,37,102,10,0,0,0,0,0,0,0,100,110,116,112,95,99,111,110,99,32,37,102,10,0,0,0,100,110,97,95,99,111,110,99,32,37,102,10,0,0,0,0,110,117,109,95,110,115,95,97,99,99,101,112,116,101,100,32,37,105,10,0,0,0,0,0,111,112,116,95,115,105,122,101,32,37,105,10,0,0,0,0,109,105,110,95,115,105,122,101,32,37,105,10,0,0,0,0,109,97,120,95,115,105,122,101,32,37,105,10,0,0,0,0,109,97,120,95,112,111,108,121,95,120,32,37,105,10,0,0,109,105,110,95,101,110,100,95,113,117,97,108,105,116,121,32,37,105,10,0,0,0,0,0,109,105,110,95,113,117,97,108,105,116,121,32,37,105,10,0,109,97,120,95,115,101,108,102,95,97,110,121,32,37,102,10,0,0,0,0,0,0,0,0,109,97,120,95,115,101,108,102,95,101,110,100,32,37,102,10,0,0,0,0,0,0,0,0,109,97,120,95,115,101,108,102,95,97,110,121,95,116,104,32,37,102,10,0,0,0,0,0,109,97,120,95,115,101,108,102,95,101,110,100,95,116,104,32,37,102,10,0,0,0,0,0,109,97,120,95,104,97,105,114,112,105,110,32,37,102,10,0,109,97,120,95,114,101,112,101,97,116,95,99,111,109,112,108,32,37,102,10,0,0,0,0,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,37,102,10,0,0,0,0,0,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,32,37,102,10,0,0,32,32,32,32,116,101,109,112,95,103,116,32,37,102,10,0,32,32,32,32,116,101,109,112,95,108,116,32,37,102,10,0,32,32,32,32,103,99,95,99,111,110,116,101,110,116,95,103,116,32,37,102,10,0,0,0,32,32,32,32,103,99,95,99,111,110,116,101,110,116,95,108,116,32,37,102,10,0,0,0,32,32,32,32,104,97,105,114,112,105,110,32,37,102,10,0,32,32,32,32,108,101,110,103,116,104,95,108,116,32,37,102,10,0,0,0,0,0,0,0,32,32,32,32,108,101,110,103,116,104,95,103,116,32,37,102,10,0,0,0,0,0,0,0,32,32,32,32,115,101,113,95,113,117,97,108,105,116,121,32,37,102,10,0,0,0,0,0,32,32,32,32,101,110,100,95,113,117,97,108,105,116,121,32,37,102,10,0,0,0,0,0,32,32,32,32,112,111,115,95,112,101,110,97,108,116,121,32,37,102,10,0,0,0,0,0,32,32,32,32,101,110,100,95,115,116,97,98,105,108,105,116,121,32,37,102,10,0,0,0,32,32,32,32,110,117,109,95,110,115,32,37,102,10,0,0,32,32,111,112,116,95,116,109,32,37,102,10,0,0,0,0,32,32,109,105,110,95,116,109,32,37,102,10,0,0,0,0,32,32,109,97,120,95,116,109,32,37,102,10,0,0,0,0,32,32,111,112,116,95,103,99,95,99,111,110,116,101,110,116,32,37,102,10,0,0,0,0,32,32,109,97,120,95,103,99,32,37,102,10,0,0,0,0,32,32,109,105,110,95,103,99,32,37,102,10,0,0,0,0,32,32,100,105,118,97,108,101,110,116,95,99,111,110,99,32,37,102,10,0,0,0,0,0,32,32,100,110,116,112,95,99,111,110,99,32,37,102,10,0,32,32,100,110,97,95,99,111,110,99,32,37,102,10,0,0,32,32,110,117,109,95,110,115,95,97,99,99,101,112,116,101,100,32,37,105,10,0,0,0,32,32,111,112,116,95,115,105,122,101,32,37,105,10,0,0,32,32,109,105,110,95,115,105,122,101,32,37,105,10,0,0,32,32,109,97,120,95,115,105,122,101,32,37,105,10,0,0,32,32,109,97,120,95,112,111,108,121,95,120,32,37,105,10,0,0,0,0,0,0,0,0,32,32,109,105,110,95,101,110,100,95,113,117,97,108,105,116,121,32,37,105,10,0,0,0,32,32,109,105,110,95,113,117,97,108,105,116,121,32,37,105,10,0,0,0,0,0,0,0,32,32,109,97,120,95,115,101,108,102,95,97,110,121,32,37,102,10,0,0,0,0,0,0,32,32,109,97,120,95,115,101,108,102,95,101,110,100,32,37,102,10,0,0,0,0,0,0,32,32,109,97,120,95,114,101,112,101,97,116,95,99,111,109,112,108,32,37,102,10,0,0,112,114,105,109,101,114,95,111,118,101,114,108,97,112,95,106,117,110,99,116,105,111,110,115,95,99,111,117,110,116,32,37,105,10,0,0,0,0,0,0,32,32,32,37,105,10,0,0,105,110,99,108,95,115,32,37,105,10,0,0,0,0,0,0,105,110,99,108,95,108,32,37,105,10,0,0,0,0,0,0,115,116,97,114,116,95,99,111,100,111,110,95,112,111,115,32,37,105,10,0,0,0,0,0,110,95,113,117,97,108,105,116,121,32,37,105,10,0,0,0,113,117,97,108,105,116,121,95,115,116,111,114,97,103,101,95,115,105,122,101,32,37,105,10,0,0,0,0,0,0,0,0,42,115,101,113,117,101,110,99,101,32,37,115,10,0,0,0,42,115,101,113,117,101,110,99,101,95,110,97,109,101,32,37,115,10,0,0,0,0,0,0,42,115,101,113,117,101,110,99,101,95,102,105,108,101,32,37,115,10,0,0,0,0,0,0,42,116,114,105,109,109,101,100,95,115,101,113,32,37,115,10,0,0,0,0,0,0,0,0,42,116,114,105,109,109,101,100,95,111,114,105,103,95,115,101,113,32,37,115,10,0,0,0,42,117,112,99,97,115,101,100,95,115,101,113,32,37,115,10,0,0,0,0,0,0,0,0,42,117,112,99,97,115,101,100,95,115,101,113,95,114,32,37,115,10,0,0,0,0,0,0,42,108,101,102,116,95,105,110,112,117,116,32,37,115,10,0,42,114,105,103,104,116,95,105,110,112,117,116,32,37,115,10,0,0,0,0,0,0,0,0,42,105,110,116,101,114,110,97,108,95,105,110,112,117,116,32,37,115,10,0,0,0,0,0,102,111,114,99,101,95,108,101,102,116,95,115,116,97,114,116,32,37,105,10,0,0,0,0,102,111,114,99,101,95,108,101,102,116,95,101,110,100,32,37,105,10,0,0,0,0,0,0,102,111,114,99,101,95,114,105,103,104,116,95,115,116,97,114,116,32,37,105,10,0,0,0,102,111,114,99,101,95,114,105,103,104,116,95,101,110,100,32,37,105,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,69,114,114,111,114,32,105,110,32,115,101,113,117,101,110,99,101,32,113,117,97,108,105,116,121,32,100,97,116,97,0,0,77,105,110,105,109,117,109,32,51,39,32,100,105,115,116,97,110,99,101,32,109,117,115,116,32,98,101,32,62,61,32,45,49,32,40,109,105,110,95,42,95,116,104,114,101,101,95,112,114,105,109,101,95,100,105,115,116,97,110,99,101,41,0,0,83,101,113,117,101,110,99,101,32,113,117,97,108,105,116,121,32,100,97,116,97,32,109,105,115,115,105,110,103,0,0,0,86,97,108,117,101,32,116,111,111,32,115,109,97,108,108,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,70,73,82,83,84,95,66,65,83,69,95,73,78,68,69,88,0,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,77,65,88,95,84,69,77,80,76,65,84,69,95,77,73,83,80,82,73,77,73,78,71,0,0,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,80,65,73,82,95,77,65,88,95,84,69,77,80,76,65,84,69,95,77,73,83,80,82,73,77,73,78,71,0,0,0,0,0,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,77,65,88,95,76,73,66,82,65,82,89,95,77,73,83,80,82,73,77,73,78,71,0,0,0,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,76,73,66,82,65,82,89,95,77,73,83,72,89,66,0,0,0,0,0,0,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,97,116,32,116,97,103,32,80,82,73,77,69,82,95,80,65,73,82,95,77,65,88,95,76,73,66,82,65,82,89,95,77,73,83,80,82,73,77,73,78,71,0,0,0,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,84,69,77,80,76,65,84,69,95,77,73,83,72,89,66,32,105,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,84,69,77,80,76,65,84,69,95,77,73,83,72,89,66,95,84,72,32,105,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,80,82,73,77,69,82,95,77,73,78,95,83,73,90,69,32,109,117,115,116,32,98,101,32,62,61,32,49,0,0,0,0,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,32,101,120,99,101,101,100,115,32,98,117,105,108,116,45,105,110,32,109,97,120,105,109,117,109,32,111,102,32,0,0,0,0,51,54,0,0,0,0,0,0,80,82,73,77,69,82,95,123,79,80,84,44,68,69,70,65,85,76,84,125,95,83,73,90,69,32,62,32,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,0,0,0,0,0,80,82,73,77,69,82,95,123,79,80,84,44,68,69,70,65,85,76,84,125,95,83,73,90,69,32,60,32,80,82,73,77,69,82,95,77,73,78,95,83,73,90,69,0,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,83,73,90,69,32,101,120,99,101,101,100,115,32,98,117,105,108,116,45,105,110,32,109,97,120,105,109,117,109,0,0,0,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,123,79,80,84,44,68,69,70,65,85,76,84,125,95,83,73,90,69,32,62,32,77,65,88,95,83,73,90,69,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,123,79,80,84,44,68,69,70,65,85,76,84,125,95,83,73,90,69,32,60,32,77,73,78,95,83,73,90,69,0,0,0,80,82,73,77,69,82,95,71,67,95,67,76,65,77,80,32,62,32,80,82,73,77,69,82,95,77,73,78,95,83,73,90,69,0,0,0,0,0,0,0,80,82,73,77,69,82,95,77,65,88,95,69,78,68,95,71,67,32,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,116,111,32,53,0,0,0,0,0,0,0,0,69,109,112,116,121,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,80,82,79,68,85,67,84,95,83,73,90,69,95,82,65,78,71,69,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,101,108,101,109,101,110,116,32,105,110,32,80,82,73,77,69,82,95,80,82,79,68,85,67,84,95,83,73,90,69,95,82,65,78,71,69,0,0,0,0,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,32,62,32,109,105,110,32,80,82,73,77,69,82,95,80,82,79,68,85,67,84,95,83,73,90,69,95,82,65,78,71,69,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,83,73,90,69,32,62,32,109,105,110,32,80,82,73,77,69,82,95,80,82,79,68,85,67,84,95,83,73,90,69,95,82,65,78,71,69,0,0,0,0,0,0,0,0,80,82,73,77,69,82,95,78,85,77,95,82,69,84,85,82,78,32,60,32,49,0,0,0,80,82,73,77,69,82,95,77,85,83,84,95,77,65,84,67,72,95,70,73,86,69,95,80,82,73,77,69,32,109,117,115,116,32,104,97,118,101,32,53,32,99,104,97,114,97,99,116,101,114,115,0,0,0,0,0,80,82,73,77,69,82,95,77,85,83,84,95,77,65,84,67,72,95,84,72,82,69,69,95,80,82,73,77,69,32,109,117,115,116,32,104,97,118,101,32,53,32,99,104,97,114,97,99,116,101,114,115,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,85,83,84,95,77,65,84,67,72,95,70,73,86,69,95,80,82,73,77,69,32,109,117,115,116,32,104,97,118,101,32,53,32,99,104,97,114,97,99,116,101,114,115,0,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,85,83,84,95,77,65,84,67,72,95,84,72,82,69,69,95,80,82,73,77,69,32,109,117,115,116,32,104,97,118,101,32,53,32,99,104,97,114,97,99,116,101,114,115,0,0,0,86,97,108,117,101,32,102,111,114,32,83,69,81,85,69,78,67,69,95,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,32,116,111,111,32,108,97,114,103,101,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,83,69,81,85,69,78,67,69,95,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,0,0,0,0,0,0,83,69,81,85,69,78,67,69,95,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,32,108,101,110,103,116,104,32,60,32,109,105,110,32,80,82,73,77,69,82,95,80,82,79,68,85,67,84,95,83,73,90,69,95,82,65,78,71,69,0,80,82,73,77,69,82,95,77,65,88,95,69,78,68,95,83,84,65,66,73,76,73,84,89,32,109,117,115,116,32,98,101,32,110,111,110,45,110,101,103,97,116,105,118,101,0,0,0,67,97,110,110,111,116,32,97,99,99,101,112,116,32,98,111,116,104,32,83,69,81,85,69,78,67,69,95,83,84,65,82,84,95,67,79,68,79,78,95,80,79,83,73,84,73,79,78,32,97,110,100,32,110,111,110,45,100,101,102,97,117,108,116,32,0,0,0,0,0,0,0,97,114,103,117,109,101,110,116,115,32,102,111,114,32,80,82,73,77,69,82,95,73,78,83,73,68,69,95,80,69,78,65,76,84,89,32,111,114,32,80,82,73,77,69,82,95,79,85,84,83,73,68,69,95,80,69,78,65,76,84,89,0,0,0,83,116,97,114,116,32,99,111,100,111,110,32,112,111,115,105,116,105,111,110,32,110,111,116,32,99,111,110,116,97,105,110,101,100,32,105,110,32,83,69,81,85,69,78,67,69,95,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,0,0,78,111,32,115,116,97,114,116,32,99,111,100,111,110,32,97,116,32,83,69,81,85,69,78,67,69,95,83,84,65,82,84,95,67,79,68,79,78,95,80,79,83,73,84,73,79,78,0,80,82,73,77,69,82,95,77,73,78,95,81,85,65,76,73,84,89,32,60,32,80,82,73,77,69,82,95,81,85,65,76,73,84,89,95,82,65,78,71,69,95,77,73,78,0,0,0,80,82,73,77,69,82,95,77,73,78,95,81,85,65,76,73,84,89,32,62,32,80,82,73,77,69,82,95,81,85,65,76,73,84,89,95,82,65,78,71,69,95,77,65,88,0,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,73,78,95,81,85,65,76,73,84,89,32,60,32,80,82,73,77,69,82,95,81,85,65,76,73,84,89,95,82,65,78,71,69,95,77,73,78,0,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,73,78,95,81,85,65,76,73,84,89,32,62,32,80,82,73,77,69,82,95,81,85,65,76,73,84,89,95,82,65,78,71,69,95,77,65,88,0,0,83,101,113,117,101,110,99,101,32,113,117,97,108,105,116,121,32,115,99,111,114,101,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,0,83,101,113,117,101,110,99,101,32,113,117,97,108,105,116,121,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,98,117,116,32,115,101,113,117,101,110,99,101,32,113,117,97,108,105,116,121,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,98,97,115,101,32,105,110,32,105,110,112,117,116,32,115,101,113,117,101,110,99,101,0,0,0,0,0,79,112,116,105,109,117,109,32,112,114,105,109,101,114,32,84,109,32,108,111,119,101,114,32,116,104,97,110,32,109,105,110,105,109,117,109,32,111,114,32,104,105,103,104,101,114,32,116,104,97,110,32,109,97,120,105,109,117,109,0,0,0,0,0,79,112,116,105,109,117,109,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,84,109,32,108,111,119,101,114,32,116,104,97,110,32,109,105,110,105,109,117,109,32,111,114,32,104,105,103,104,101,114,32,116,104,97,110,32,109,97,120,105,109,117,109,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,77,65,88,95,71,67,32,97,110,100,32,80,82,73,77,69,82,95,77,73,78,95,71,67,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,79,76,73,71,79,95,71,67,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,77,65,88,95,78,83,95,65,67,67,69,80,84,69,68,0,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,78,83,95,65,67,67,69,80,84,69,68,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,112,114,105,109,101,114,32,99,111,109,112,108,101,109,101,110,116,97,114,105,116,121,32,114,101,115,116,114,105,99,116,105,111,110,115,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,112,114,105,109,101,114,32,99,111,109,112,108,101,109,101,110,116,97,114,105,116,121,32,114,101,115,116,114,105,99,116,105,111,110,115,32,40,116,104,101,114,109,111,100,46,32,97,112,112,114,111,97,99,104,41,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,99,111,109,112,108,101,109,101,110,116,97,114,105,116,121,32,114,101,115,116,114,105,99,116,105,111,110,115,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,112,114,105,109,101,114,32,115,97,108,116,32,111,114,32,100,110,97,32,99,111,110,99,101,110,116,114,97,116,105,111,110,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,112,114,105,109,101,114,32,100,105,118,97,108,101,110,116,32,115,97,108,116,32,111,114,32,100,78,84,80,32,99,111,110,99,101,110,116,114,97,116,105,111,110,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,115,97,108,116,32,111,114,32,100,110,97,32,99,111,110,99,101,110,116,114,97,116,105,111,110,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,100,105,118,97,108,101,110,116,32,115,97,108,116,32,111,114,32,100,78,84,80,32,99,111,110,99,101,110,116,114,97,116,105,111,110,0,0,0,0,78,111,110,45,100,101,102,97,117,108,116,32,105,110,115,105,100,101,32,112,101,110,97,108,116,121,32,111,114,32,111,117,116,115,105,100,101,32,112,101,110,97,108,116,121,32,0,0,105,115,32,118,97,108,105,100,32,111,110,108,121,32,119,104,101,110,32,110,117,109,98,101,114,32,111,102,32,116,97,114,103,101,116,115,32,60,61,32,49,0,0,0,0,0,0,0,104,97,115,32,110,111,32,101,102,102,101,99,116,32,119,104,101,110,32,110,117,109,98,101,114,32,111,102,32,116,97,114,103,101,116,115,32,105,115,32,48,0,0,0,0,0,0,0,78,111,116,32,115,112,101,99,105,102,105,101,100,32,116,111,32,112,105,99,107,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,115,0,0,0,32,98,117,116,32,97,32,115,112,101,99,105,102,105,99,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,105,115,32,112,114,111,118,105,100,101,100,0,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,101,120,99,101,101,100,115,32,98,117,105,108,116,45,105,110,32,109,97,120,105,109,117,109,32,111,102,32,0,0,0,83,112,101,99,105,102,105,101,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,62,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,65,88,95,83,73,90,69,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,60,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,73,78,95,83,73,90,69,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,110,111,116,32,105,110,32,115,101,113,117,101,110,99,101,0,0,0,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,110,111,116,32,105,110,32,73,110,99,108,117,100,101,100,32,82,101,103,105,111,110,0,83,112,101,99,105,102,105,101,100,32,108,101,102,116,32,112,114,105,109,101,114,32,101,120,99,101,101,100,115,32,98,117,105,108,116,45,105,110,32,109,97,120,105,109,117,109,32,111,102,32,0,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,108,101,102,116,32,112,114,105,109,101,114,32,62,32,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,0,83,112,101,99,105,102,105,101,100,32,108,101,102,116,32,112,114,105,109,101,114,32,60,32,80,82,73,77,69,82,95,77,73,78,95,83,73,90,69,0,83,112,101,99,105,102,105,101,100,32,108,101,102,116,32,112,114,105,109,101,114,32,110,111,116,32,105,110,32,115,101,113,117,101,110,99,101,0,0,0,83,112,101,99,105,102,105,101,100,32,108,101,102,116,32,112,114,105,109,101,114,32,110,111,116,32,105,110,32,73,110,99,108,117,100,101,100,32,82,101,103,105,111,110,0,0,0,0,83,112,101,99,105,102,105,101,100,32,114,105,103,104,116,32,112,114,105,109,101,114,32,101,120,99,101,101,100,115,32,98,117,105,108,116,45,105,110,32,109,97,120,105,109,117,109,32,111,102,32,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,114,105,103,104,116,32,112,114,105,109,101,114,32,60,32,80,82,73,77,69,82,95,77,73,78,95,83,73,90,69,0,0,0,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,114,105,103,104,116,32,112,114,105,109,101,114,32,62,32,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,0,0,0,0,0,0,0,0,83,112,101,99,105,102,105,101,100,32,114,105,103,104,116,32,112,114,105,109,101,114,32,110,111,116,32,105,110,32,115,101,113,117,101,110,99,101,0,0,83,112,101,99,105,102,105,101,100,32,114,105,103,104,116,32,112,114,105,109,101,114,32,110,111,116,32,105,110,32,73,110,99,108,117,100,101,100,32,82,101,103,105,111,110,0,0,0,80,114,111,100,117,99,116,32,116,101,109,112,101,114,97,116,117,114,101,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,111,112,116,105,109,117,109,32,116,101,109,112,101,114,97,116,117,114,101,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,0,0,80,114,111,100,117,99,116,32,115,105,122,101,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,111,112,116,105,109,117,109,32,115,105,122,101,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,80,114,105,109,101,114,32,71,67,32,99,111,110,116,101,110,116,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,111,112,116,105,109,117,109,32,103,99,95,99,111,110,116,101,110,116,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,72,121,98,32,112,114,111,98,101,32,71,67,32,99,111,110,116,101,110,116,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,111,112,116,105,109,117,109,32,103,99,95,99,111,110,116,101,110,116,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,0,0,73,110,116,101,114,110,97,108,32,111,108,105,103,111,32,113,117,97,108,105,116,121,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,99,104,111,105,99,101,32,105,115,32,110,111,116,32,114,101,113,117,105,114,101,100,0,0,0,0,0,0,0,0,77,105,115,112,114,105,109,105,110,103,32,115,99,111,114,101,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,44,32,98,117,116,32,109,105,115,112,114,105,109,105,110,103,32,108,105,98,114,97,114,121,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,73,110,116,101,114,110,97,108,32,111,108,105,103,111,32,109,105,115,112,114,105,109,105,110,103,32,115,99,111,114,101,32,105,115,32,112,97,114,116,32,111,102,32,111,98,106,101,99,116,105,118,101,32,102,117,110,99,116,105,111,110,32,119,104,105,108,101,32,109,105,115,104,121,98,32,108,105,98,114,97,114,121,32,105,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,76,69,65,68,0,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,73,78,84,69,82,86,65,76,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,65,67,67,85,82,65,67,89,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,83,80,65,67,73,78,71,0,0,0,0,0,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,73,78,84,69,82,86,65,76,32,62,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,83,80,65,67,73,78,71,0,0,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,65,67,67,85,82,65,67,89,32,62,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,83,80,65,67,73,78,71,0,0,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,76,69,65,68,32,62,32,80,82,73,77,69,82,95,83,69,81,85,69,78,67,73,78,71,95,83,80,65,67,73,78,71,0,0,0,0,0,0,83,69,81,85,69,78,67,69,95,70,79,82,67,69,95,76,69,70,84,95,83,84,65,82,84,32,62,32,83,69,81,85,69,78,67,69,95,70,79,82,67,69,95,76,69,70,84,95,69,78,68,0,0,0,0,0,83,69,81,85,69,78,67,69,95,70,79,82,67,69,95,82,73,71,72,84,95,69,78,68,32,62,32,83,69,81,85,69,78,67,69,95,70,79,82,67,69,95,82,73,71,72,84,95,83,84,65,82,84,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,77,73,78,95,53,95,80,82,73,77,69,95,79,86,69,82,76,65,80,95,79,70,95,74,85,78,67,84,73,79,78,0,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,77,73,78,95,51,95,80,82,73,77,69,95,79,86,69,82,76,65,80,95,79,70,95,74,85,78,67,84,73,79,78,0,0,0,0,0,0,0,0,80,82,73,77,69,82,95,77,73,78,95,53,95,80,82,73,77,69,95,79,86,69,82,76,65,80,95,79,70,95,74,85,78,67,84,73,79,78,32,62,32,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,32,47,32,50,0,0,0,0,80,82,73,77,69,82,95,77,73,78,95,51,95,80,82,73,77,69,95,79,86,69,82,76,65,80,95,79,70,95,74,85,78,67,84,73,79,78,32,62,32,80,82,73,77,69,82,95,77,65,88,95,83,73,90,69,32,47,32,50,0,0,0,0,80,82,73,77,69,82,95,83,65,76,84,95,68,73,86,65,76,69,78,84,32,62,32,48,46,48,32,98,117,116,32,80,82,73,77,69,82,95,68,78,84,80,95,67,79,78,67,32,60,61,32,48,46,48,59,32,117,115,101,32,114,101,97,115,111,110,97,98,108,101,32,118,97,108,117,101,32,102,111,114,32,80,82,73,77,69,82,95,68,78,84,80,95,67,79,78,67,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,115,32,102,111,114,32,80,82,73,77,69,82,95,77,85,83,84,95,77,65,84,67,72,95,70,73,86,69,95,80,82,73,77,69,0,73,108,108,101,103,97,108,32,118,97,108,117,101,115,32,102,111,114,32,80,82,73,77,69,82,95,77,85,83,84,95,77,65,84,67,72,95,84,72,82,69,69,95,80,82,73,77,69,0,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,115,32,102,111,114,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,85,83,84,95,77,65,84,67,72,95,70,73,86,69,95,80,82,73,77,69,0,0,0,0,0,0,0,0,73,108,108,101,103,97,108,32,118,97,108,117,101,115,32,102,111,114,32,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,77,85,83,84,95,77,65,84,67,72,95,84,72,82,69,69,95,80,82,73,77,69,0,0,0,0,0,0,0,84,97,115,107,32,112,105,99,107,95,115,101,113,117,101,110,99,105,110,103,95,112,114,105,109,101,114,115,32,99,97,110,110,111,116,32,98,101,32,99,111,109,98,105,110,101,100,32,119,105,116,104,32,105,110,99,108,117,100,101,100,32,114,101,103,105,111,110,0,0,0,0,78,111,32,112,114,105,109,101,114,115,32,112,114,111,118,105,100,101,100,0,0,0,0,0,77,105,115,115,105,110,103,32,83,69,81,85,69,78,67,69,32,116,97,103,0,0,0,0,84,97,115,107,32,112,105,99,107,95,100,105,115,99,114,105,109,105,110,97,116,105,118,101,95,112,114,105,109,101,114,115,32,114,101,113,117,105,114,101,115,32,101,120,97,99,116,108,121,32,111,110,101,32,83,69,81,85,69,78,67,69,95,84,65,82,71,69,84,0,0,0,83,69,81,85,69,78,67,69], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([95,79,86,69,82,76,65,80,95,74,85,78,67,84,73,79,78,95,76,73,83,84,0,0,37,115,32,98,101,121,111,110,100,32,101,110,100,32,111,102,32,115,101,113,117,101,110,99,101,0,0,0,0,0,0,0,78,101,103,97,116,105,118,101,32,37,115,32,108,101,110,103,116,104,0,0,0,0,0,0,37,115,32,111,117,116,115,105,100,101,32,111,102,32,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,0,0,0,84,65,82,71,69,84,0,0,69,88,67,76,85,68,69,68,95,82,69,71,73,79,78,0,80,82,73,77,69,82,95,73,78,84,69,82,78,65,76,95,79,76,73,71,79,95,69,88,67,76,85,68,69,68,95,82,69,71,73,79,78,0,0,0,80,82,73,77,69,82,95,80,65,73,82,95,79,75,95,82,69,71,73,79,78,95,76,73,83,84,0,0,0,0,0,0,32,105,108,108,101,103,97,108,32,105,110,116,101,114,118,97,108,0,0,0,0,0,0,0,32,98,101,121,111,110,100,32,101,110,100,32,111,102,32,115,101,113,117,101,110,99,101,0,32,111,117,116,115,105,100,101,32,111,102,32,73,78,67,76,85,68,69,68,95,82,69,71,73,79,78,0,0,0,0,0,78,101,103,97,116,105,118,101,32,0,0,0,0,0,0,0,32,108,101,110,103,116,104,0,115,32,33,61,32,48,76,0,100,105,114,101,99,116,105,111,110,32,61,61,32,49,32,124,124,32,100,105,114,101,99,116,105,111,110,32,61,61,32,45,49,0,0,0,0,0,0,0,108,101,110,32,62,61,32,51,0,0,0,0,0,0,0,0,115,116,97,114,116,32,60,61,32,40,108,101,110,32,45,32,51,41,0,0,0,0,0,0,48,120,55,102,102,102,102,102,102,102,32,62,32,40,110,61,115,116,114,108,101,110,40,115,97,45,62,116,114,105,109,109,101,100,95,115,101,113,41,41,0,0,0,0,0,0,0,0,67,97,108,99,117,108,97,116,105,111,110,32,101,114,114,111,114,32,105,110,32,102,111,114,119,97,114,100,32,115,101,113,117,101,110,99,105,110,103,32,112,111,115,105,116,105,111,110,32,99,97,108,99,117,108,97,116,105,111,110,0,0,0,0,67,97,108,99,117,108,97,116,105,111,110,32,101,114,114,111,114,32,105,110,32,114,101,118,101,114,115,101,32,115,101,113,117,101,110,99,105,110,103,32,112,111,115,105,116,105,111,110,32,99,97,108,99,117,108,97,116,105,111,110,0,0,0,0,73,110,99,114,101,97,115,101,32,80,82,73,77,69,82,95,78,85,77,95,82,69,84,85,82,78,32,116,111,32,111,98,116,97,105,110,32,97,108,108,32,115,101,113,117,101,110,99,105,110,103,32,112,114,105,109,101,114,115,0,0,0,0,0,78,111,32,114,105,103,104,116,32,112,114,105,109,101,114,32,102,111,117,110,100,32,105,110,32,114,97,110,103,101,32,0,78,111,32,108,101,102,116,32,112,114,105,109,101,114,32,102,111,117,110,100,32,105,110,32,114,97,110,103,101,32,0,0,37,100,0,0,0,0,0,0,32,45,32,0,0,0,0,0,48,0,0,0,0,0,0,0,33,40,98,102,95,103,101,116,95,105,110,102,105,110,105,116,101,95,112,111,115,95,112,101,110,97,108,116,121,40,104,41,41,0,0,0,0,0,0,0,111,108,105,103,111,95,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,40,104,41,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,0,0,111,108,105,103,111,95,109,97,120,95,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,101,114,109,111,100,40,104,41,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,0,0,79,84,95,76,69,70,84,32,61,61,32,108,32,124,124,32,79,84,95,82,73,71,72,84,32,61,61,32,108,32,124,124,32,79,84,95,73,78,84,76,32,61,61,32,108,0,0,0,107,32,62,61,32,48,0,0,107,32,60,32,40,40,115,97,41,45,62,105,110,99,108,95,108,41,0,0,0,0,0,0,115,97,45,62,116,97,114,50,46,99,111,117,110,116,32,60,61,32,49,32,124,124,32,40,45,49,46,48,32,61,61,32,112,97,45,62,105,110,115,105,100,101,95,112,101,110,97,108,116,121,32,38,38,32,48,46,48,32,61,61,32,112,97,45,62,111,117,116,115,105,100,101,95,112,101,110,97,108,116,121,41,0,0,0,0,0,0,0,33,112,51,95,111,108,95,105,115,95,111,107,40,104,41,0,114,46,116,101,109,112,32,60,61,32,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,0,0,0,0,0,114,46,115,99,111,114,101,32,60,61,32,48,120,55,102,102,102,0,0,0,0,0,0,0,114,46,115,99,111,114,101,32,33,61,32,40,45,49,45,48,120,55,102,102,102,102,102,102,102,41,0,0,0,0,0,0,104,32,33,61,32,48,76,0,77,111,114,101,32,116,104,97,110,32,111,110,101,32,112,111,115,105,116,105,111,110,32,105,110,32,116,101,109,112,108,97,116,101,32,102,111,114,32,105,110,112,117,116,32,111,108,105,103,111,32,0,0,0,0,0,67,97,108,99,117,108,97,116,105,111,110,32,101,114,114,111,114,32,105,110,32,102,111,114,99,101,100,32,112,114,105,109,101,114,32,112,111,115,105,116,105,111,110,32,99,97,108,99,117,108,97,116,105,111,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,97,45,62,112,114,95,112,97,105,114,95,119,101,105,103,104,116,115,46,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,62,61,32,48,46,48,0,0,104,45,62,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,62,61,32,48,46,48,0,0,0,112,97,45,62,112,114,95,112,97,105,114,95,119,101,105,103,104,116,115,46,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,116,104,32,62,61,32,48,46,48,0,0,0,0,0,0,0,115,117,109,32,62,61,32,48,46,48,0,0,0,0,0,0,116,101,109,112,111,114,97,114,121,0,0,0,0,0,0,0,112,112,97,105,114,45,62,114,105,103,104,116,45,62,115,116,97,114,116,32,45,32,112,112,97,105,114,45,62,108,101,102,116,45,62,115,116,97,114,116,32,43,32,49,32,62,32,48,0,0,0,0,0,0,0,0,112,112,97,105,114,45,62,112,114,111,100,117,99,116,95,116,109,32,33,61,32,45,57,57,57,57,57,57,46,57,57,57,57,0,0,0,0,0,0,0,112,112,97,105,114,45,62,108,101,102,116,45,62,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,0,0,112,112,97,105,114,45,62,108,101,102,116,45,62,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,114,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,112,112,97,105,114,45,62,114,105,103,104,116,45,62,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,0,0,112,112,97,105,114,45,62,114,105,103,104,116,45,62,116,101,109,112,108,97,116,101,95,109,105,115,112,114,105,109,105,110,103,95,114,32,33,61,32,45,49,46,55,57,55,54,57,51,49,51,52,56,54,50,51,49,53,55,101,43,51,48,56,0,112,114,111,98,97,98,108,121,32,112,114,105,109,101,114,51,95,99,111,114,101,0,0,0,69,110,100,32,111,102,32,99,104,111,111,115,101,95,112,114,105,109,101,114,115,58,0,0,65,102,116,101,114,32,95,97,100,106,117,115,116,95,115,101,113,95,97,114,103,115,0,0,83,116,97,114,116,32,111,102,32,99,104,111,111,115,101,95,112,114,105,109,101,114,115,58,0,0,0,0,0,0,0,0,66,69,71,73,78,32,83,69,81,85,69,78,67,69,32,65,82,71,83,0,0,0,0,0,69,78,68,32,83,69,81,85,69,78,67,69,32,65,82,71,83,0,0,0,0,0,0,0,112,114,105,109,101,114,95,111,118,101,114,108,97,112,95,106,117,110,99,116,105,111,110,115,95,108,105,115,116,32,91,0,93,0,0,0,0,0,0,0,66,69,71,73,78,32,71,76,79,66,65,76,32,65,82,71,83,0,0,0,0,0,0,0,32,32,112,114,111,100,117,99,116,32,115,105,122,101,32,114,97,110,103,101,115,58,0,0,32,32,98,101,103,105,110,32,112,114,95,112,97,105,114,95,119,101,105,103,104,116,115,0,32,32,101,110,100,32,112,97,105,114,95,119,101,105,103,104,116,115,0,0,0,0,0,0,10,0,0,0,0,0,0,0,66,69,71,73,78,32,112,114,105,109,101,114,95,97,114,103,115,0,0,0,0,0,0,0,98,101,103,105,110,32,111,108,105,103,111,95,119,101,105,103,104,116,115,0,0,0,0,0,101,110,100,32,111,108,105,103,111,95,119,101,105,103,104,116,115,0,0,0,0,0,0,0,101,110,100,32,112,114,105,109,101,114,32,97,114,103,115,0,98,101,103,105,110,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,97,114,103,115,32,40,112,45,62,111,95,97,114,103,115,46,41,0,0,32,32,98,101,103,105,110,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,95,119,101,105,103,104,116,115,32,40,112,45,62,111,95,97,114,103,115,46,119,101,105,103,104,116,115,46,41,0,0,0,0,0,32,32,101,110,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,95,119,101,105,103,104,116,115,0,0,0,0,32,32,101,110,100,32,105,110,116,101,114,110,97,108,32,111,108,105,103,111,32,97,114,103,115,0,0,0,0,0,0,0,69,78,68,32,71,76,79,66,65,76,32,65,82,71,83,0,61,61,61,61,61,61,61,61,61,61,61,61,61], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([54,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,152,101,0,0,224,53,0,0,8,62,0,0,0,0,0,0,0,0,0,0,104,54,0,0,3,0,0,0,4,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,2,0,0,0,6,0,0,0,7,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,152,101,0,0,80,54,0,0,8,62,0,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,0,0,0,0,0,55,0,0,5,0,0,0,6,0,0,0,3,0,0,0,5,0,0,0,2,0,0,0,2,0,0,0,8,0,0,0,9,0,0,0,6,0,0,0,10,0,0,0,11,0,0,0,5,0,0,0,7,0,0,0,6,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,152,101,0,0,224,54,0,0,200,61,0,0,0,0,0,0,0,0,0,0,104,55,0,0,7,0,0,0,8,0,0,0,4,0,0,0,5,0,0,0,2,0,0,0,2,0,0,0,12,0,0,0,9,0,0,0,6,0,0,0,13,0,0,0,14,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,152,101,0,0,80,55,0,0,200,61,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,112,101,0,0,120,55,0,0,0,0,0,0,224,55,0,0,9,0,0,0,10,0,0,0,15,0,0,0,0,0,0,0,0,0,0,0,72,56,0,0,11,0,0,0,12,0,0,0,16,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,152,101,0,0,208,55,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,56,0,0,9,0,0,0,13,0,0,0,15,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,152,101,0,0,8,56,0,0,224,55,0,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,152,101,0,0,48,56,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,56,0,0,11,0,0,0,14,0,0,0,16,0,0,0,0,0,0,0,83,116,49,52,111,118,101,114,102,108,111,119,95,101,114,114,111,114,0,0,0,0,0,0,152,101,0,0,112,56,0,0,72,56,0,0,0,0,0,0,58,32,0,0,0,0,0,0,0,0,0,0,208,56,0,0,15,0,0,0,16,0,0,0,16,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,152,101,0,0,184,56,0,0,72,56,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,112,101,0,0,224,56,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,152,101,0,0,8,57,0,0,0,57,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,7,0,0,0,11,0,0,0,13,0,0,0,17,0,0,0,19,0,0,0,23,0,0,0,29,0,0,0,31,0,0,0,37,0,0,0,41,0,0,0,43,0,0,0,47,0,0,0,53,0,0,0,59,0,0,0,61,0,0,0,67,0,0,0,71,0,0,0,73,0,0,0,79,0,0,0,83,0,0,0,89,0,0,0,97,0,0,0,101,0,0,0,103,0,0,0,107,0,0,0,109,0,0,0,113,0,0,0,127,0,0,0,131,0,0,0,137,0,0,0,139,0,0,0,149,0,0,0,151,0,0,0,157,0,0,0,163,0,0,0,167,0,0,0,173,0,0,0,179,0,0,0,181,0,0,0,191,0,0,0,193,0,0,0,197,0,0,0,199,0,0,0,211,0,0,0,1,0,0,0,11,0,0,0,13,0,0,0,17,0,0,0,19,0,0,0,23,0,0,0,29,0,0,0,31,0,0,0,37,0,0,0,41,0,0,0,43,0,0,0,47,0,0,0,53,0,0,0,59,0,0,0,61,0,0,0,67,0,0,0,71,0,0,0,73,0,0,0,79,0,0,0,83,0,0,0,89,0,0,0,97,0,0,0,101,0,0,0,103,0,0,0,107,0,0,0,109,0,0,0,113,0,0,0,121,0,0,0,127,0,0,0,131,0,0,0,137,0,0,0,139,0,0,0,143,0,0,0,149,0,0,0,151,0,0,0,157,0,0,0,163,0,0,0,167,0,0,0,169,0,0,0,173,0,0,0,179,0,0,0,181,0,0,0,187,0,0,0,191,0,0,0,193,0,0,0,197,0,0,0,199,0,0,0,209,0,0,0,95,95,110,101,120,116,95,112,114,105,109,101,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,0,0,0,0,200,61,0,0,17,0,0,0,18,0,0,0,5,0,0,0,5,0,0,0,2,0,0,0,2,0,0,0,12,0,0,0,9,0,0,0,6,0,0,0,10,0,0,0,11,0,0,0,5,0,0,0,8,0,0,0,8,0,0,0,0,0,0,0,8,62,0,0,19,0,0,0,20,0,0,0,6,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,5,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,8,0,0,0,0,0,0,0,64,62,0,0,21,0,0,0,22,0,0,0,248,255,255,255,248,255,255,255,64,62,0,0,23,0,0,0,24,0,0,0,8,0,0,0,0,0,0,0,136,62,0,0,25,0,0,0,26,0,0,0,248,255,255,255,248,255,255,255,136,62,0,0,27,0,0,0,28,0,0,0,4,0,0,0,0,0,0,0,208,62,0,0,29,0,0,0,30,0,0,0,252,255,255,255,252,255,255,255,208,62,0,0,31,0,0,0,32,0,0,0,4,0,0,0,0,0,0,0,24,63,0,0,33,0,0,0,34,0,0,0,252,255,255,255,252,255,255,255,24,63,0,0,35,0,0,0,36,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,60,0,0,37,0,0,0,38,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,8,61,0,0,39,0,0,0,40,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,152,101,0,0,192,60,0,0,208,56,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,112,101,0,0,240,60,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,152,101,0,0,16,61,0,0,8,61,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,152,101,0,0,80,61,0,0,8,61,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,112,101,0,0,144,61,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,112,101,0,0,208,61,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,248,101,0,0,16,62,0,0,0,0,0,0,1,0,0,0,64,61,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,248,101,0,0,88,62,0,0,0,0,0,0,1,0,0,0,128,61,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,248,101,0,0,160,62,0,0,0,0,0,0,1,0,0,0,64,61,0,0,3,244,255,255,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,248,101,0,0,232,62,0,0,0,0,0,0,1,0,0,0,128,61,0,0,3,244,255,255,0,0,0,0,120,63,0,0,41,0,0,0,42,0,0,0,17,0,0,0,1,0,0,0,9,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,152,101,0,0,88,63,0,0,32,57,0,0,0,0,0,0,0,0,0,0,160,77,0,0,43,0,0,0,44,0,0,0,45,0,0,0,1,0,0,0,3,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,77,0,0,46,0,0,0,47,0,0,0,45,0,0,0,2,0,0,0,4,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,82,0,0,48,0,0,0,49,0,0,0,45,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,16,83,0,0,50,0,0,0,51,0,0,0,45,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,83,0,0,52,0,0,0,53,0,0,0,45,0,0,0,3,0,0,0,4,0,0,0,23,0,0,0,5,0,0,0,24,0,0,0,1,0,0,0,2,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,84,0,0,54,0,0,0,55,0,0,0,45,0,0,0,7,0,0,0,8,0,0,0,25,0,0,0,9,0,0,0,26,0,0,0,3,0,0,0,4,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,144,79,0,0,56,0,0,0,57,0,0,0,45,0,0,0,18,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,1,0,0,0,248,255,255,255,144,79,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,72,58,37,77,58,37,83,37,109,47,37,100,47,37,121,37,89,45,37,109,45,37,100,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,72,58,37,77,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,48,80,0,0,58,0,0,0,59,0,0,0,45,0,0,0,26,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,2,0,0,0,248,255,255,255,48,80,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,192,80,0,0,60,0,0,0,61,0,0,0,45,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,81,0,0,62,0,0,0,63,0,0,0,45,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,78,0,0,64,0,0,0,65,0,0,0,45,0,0,0,34,0,0,0,35,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,36,0,0,0,11,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,78,0,0,66,0,0,0,67,0,0,0,45,0,0,0,37,0,0,0,38,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,39,0,0,0,17,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,78,0,0,68,0,0,0,69,0,0,0,45,0,0,0,40,0,0,0,41,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,42,0,0,0,23,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,78,0,0,70,0,0,0,71,0,0,0,45,0,0,0,43,0,0,0,44,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,45,0,0,0,29,0,0,0,30,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,84,0,0,72,0,0,0,73,0,0,0,45,0,0,0,3,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,76,102,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,0,0,0,0,136,85,0,0,74,0,0,0,75,0,0,0,45,0,0,0,5,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,0,0,0,0,24,86,0,0,76,0,0,0,77,0,0,0,45,0,0,0,1,0,0,0,37,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,46,48,76,102,0,0,0,0,0,0,0,168,86,0,0,78,0,0,0,79,0,0,0,45,0,0,0,2,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,81,0,0,80,0,0,0,81,0,0,0,45,0,0,0,13,0,0,0,11,0,0,0,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,81,0,0,82,0,0,0,83,0,0,0,45,0,0,0,14,0,0,0,12,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,118,101,99,116,111,114,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,67,0,0,0,0,0,0,0,0,0,0,0,120,77,0,0,84,0,0,0,85,0,0,0,45,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,74,0,0,86,0,0,0,87,0,0,0,45,0,0,0,9,0,0,0,15,0,0,0,10,0,0,0,16,0,0,0,11,0,0,0,1,0,0,0,17,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,75,0,0,88,0,0,0,89,0,0,0,45,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,46,0,0,0,47,0,0,0,5,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,77,0,0,90,0,0,0,91,0,0,0,45,0,0,0,49,0,0,0,50,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,0,0,0,0,80,77,0,0,92,0,0,0,93,0,0,0,45,0,0,0,51,0,0,0,52,0,0,0,36,0,0,0,37,0,0,0,38,0,0,0,116,114,117,101,0,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,102,97,108,115,101,0,0,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,0,0,0,0,136,73,0,0,94,0,0,0,95,0,0,0,45,0,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,152,101,0,0,112,73,0,0,152,55,0,0,0,0,0,0,0,0,0,0,24,74,0,0,94,0,0,0,96,0,0,0,45,0,0,0,18,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,12,0,0,0,19,0,0,0,13,0,0,0,20,0,0,0,14,0,0,0,5,0,0,0,21,0,0,0,6,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,112,101,0,0,248,73,0,0,248,101,0,0,224,73,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,74,0,0,2,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,248,101,0,0,56,74,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,74,0,0,2,0,0,0,0,0,0,0,232,74,0,0,94,0,0,0,97,0,0,0,45,0,0,0,3,0,0,0,4,0,0,0,7,0,0,0,53,0,0,0,54,0,0,0,8,0,0,0,55,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,112,101,0,0,200,74,0,0,248,101,0,0,160,74,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,224,74,0,0,2,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,248,101,0,0,8,75,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,224,74,0,0,2,0,0,0,0,0,0,0,168,75,0,0,94,0,0,0,98,0,0,0,45,0,0,0,5,0,0,0,6,0,0,0,9,0,0,0,56,0,0,0,57,0,0,0,10,0,0,0,58,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,248,101,0,0,128,75,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,224,74,0,0,2,0,0,0,0,0,0,0,32,76,0,0,94,0,0,0,99,0,0,0,45,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,59,0,0,0,60,0,0,0,12,0,0,0,61,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,248,101,0,0,248,75,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,224,74,0,0,2,0,0,0,0,0,0,0,152,76,0,0,94,0,0,0,100,0,0,0,45,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,59,0,0,0,60,0,0,0,12,0,0,0,61,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,152,101,0,0,112,76,0,0,32,76,0,0,0,0,0,0,0,0,0,0,0,77,0,0,94,0,0,0,101,0,0,0,45,0,0,0,7,0,0,0,8,0,0,0,11,0,0,0,59,0,0,0,60,0,0,0,12,0,0,0,61,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,152,101,0,0,216,76,0,0,32,76,0,0,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,152,101,0,0,16,77,0,0,136,73,0,0,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,152,101,0,0,56,77,0,0,136,73,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,152,101,0,0,96,77,0,0,136,73,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,152,101,0,0,136,77,0,0,136,73,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,152,101,0,0,176,77,0,0,136,73,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,112,101,0,0,248,77,0,0,248,101,0,0,216,77,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,78,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,248,101,0,0,56,78,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,78,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,248,101,0,0,120,78,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,78,0,0,2,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,248,101,0,0,184,78,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,78,0,0,2,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,112,101,0,0,64,79,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,112,101,0,0,96,79,0,0,248,101,0,0,248,78,0,0,0,0,0,0,3,0,0,0,136,73,0,0,2,0,0,0,88,79,0,0,2,0,0,0,136,79,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,112,101,0,0,0,80,0,0,248,101,0,0,184,79,0,0,0,0,0,0,3,0,0,0,136,73,0,0,2,0,0,0,88,79,0,0,2,0,0,0,40,80,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,112,101,0,0,160,80,0,0,248,101,0,0,88,80,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,184,80,0,0,0,8,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,248,101,0,0,224,80,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,184,80,0,0,0,8,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,112,101,0,0,96,81,0,0,248,101,0,0,72,81,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,120,81,0,0,2,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,248,101,0,0,160,81,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,120,81,0,0,2,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,112,101,0,0,56,82,0,0,248,101,0,0,32,82,0,0,0,0,0,0,1,0,0,0,88,82,0,0,0,0,0,0,248,101,0,0,216,81,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,96,82,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,248,101,0,0,224,82,0,0,0,0,0,0,1,0,0,0,88,82,0,0,0,0,0,0,248,101,0,0,152,82,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,248,82,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,112,101,0,0,144,83,0,0,248,101,0,0,120,83,0,0,0,0,0,0,1,0,0,0,176,83,0,0,0,0,0,0,248,101,0,0,48,83,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,184,83,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,248,101,0,0,56,84,0,0,0,0,0,0,1,0,0,0,176,83,0,0,0,0,0,0,248,101,0,0,240,83,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,80,84,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,112,101,0,0,208,84,0,0,248,101,0,0,136,84,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,240,84,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,112,101,0,0,96,85,0,0,248,101,0,0,24,85,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,128,85,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,112,101,0,0,240,85,0,0,248,101,0,0,168,85,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,16,86,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,112,101,0,0,128,86,0,0,248,101,0,0,56,86,0,0,0,0,0,0,2,0,0,0,136,73,0,0,2,0,0,0,160,86,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,77,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+13725);
/* memory initializer */ allocate([74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,77,97,114,99,104,0,0,0,65,112,114,105,108,0,0,0,77,97,121,0,0,0,0,0,74,117,110,101,0,0,0,0,74,117,108,121,0,0,0,0,65,117,103,117,115,116,0,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,74,97,110,0,0,0,0,0,70,101,98,0,0,0,0,0,77,97,114,0,0,0,0,0,65,112,114,0,0,0,0,0,74,117,110,0,0,0,0,0,74,117,108,0,0,0,0,0,65,117,103,0,0,0,0,0,83,101,112,0,0,0,0,0,79,99,116,0,0,0,0,0,78,111,118,0,0,0,0,0,68,101,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,83,117,110,100,97,121,0,0,77,111,110,100,97,121,0,0,84,117,101,115,100,97,121,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,83,117,110,0,0,0,0,0,77,111,110,0,0,0,0,0,84,117,101,0,0,0,0,0,87,101,100,0,0,0,0,0,84,104,117,0,0,0,0,0,70,114,105,0,0,0,0,0,83,97,116,0,0,0,0,0,2,0,0,192,3,0,0,192,4,0,0,192,5,0,0,192,6,0,0,192,7,0,0,192,8,0,0,192,9,0,0,192,10,0,0,192,11,0,0,192,12,0,0,192,13,0,0,192,14,0,0,192,15,0,0,192,16,0,0,192,17,0,0,192,18,0,0,192,19,0,0,192,20,0,0,192,21,0,0,192,22,0,0,192,23,0,0,192,24,0,0,192,25,0,0,192,26,0,0,192,27,0,0,192,28,0,0,192,29,0,0,192,30,0,0,192,31,0,0,192,0,0,0,179,1,0,0,195,2,0,0,195,3,0,0,195,4,0,0,195,5,0,0,195,6,0,0,195,7,0,0,195,8,0,0,195,9,0,0,195,10,0,0,195,11,0,0,195,12,0,0,195,13,0,0,211,14,0,0,195,15,0,0,195,0,0,12,187,1,0,12,195,2,0,12,195,3,0,12,195,4,0,12,211,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,100,0,0,102,0,0,0,103,0,0,0,62,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,112,101,0,0,192,100,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,152,101,0,0,216,100,0,0,0,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,152,101,0,0,248,100,0,0,208,100,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,152,101,0,0,48,101,0,0,32,101,0,0,0,0,0,0,0,0,0,0,88,101,0,0,104,0,0,0,105,0,0,0,106,0,0,0,107,0,0,0,22,0,0,0,13,0,0,0,1,0,0,0,5,0,0,0,0,0,0,0,224,101,0,0,104,0,0,0,108,0,0,0,106,0,0,0,107,0,0,0,22,0,0,0,14,0,0,0,2,0,0,0,6,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,152,101,0,0,184,101,0,0,88,101,0,0,0,0,0,0,0,0,0,0,64,102,0,0,104,0,0,0,109,0,0,0,106,0,0,0,107,0,0,0,22,0,0,0,15,0,0,0,3,0,0,0,7,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,152,101,0,0,24,102,0,0,88,101,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,104,0,0,110,0,0,0,111,0,0,0,63,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,152,101,0,0,112,104,0,0,0,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+23968);




var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;

   
  Module["_i64Subtract"] = _i64Subtract;

  
  function _malloc(bytes) {
      /* Over-allocate to make sure it is byte-aligned by 8.
       * This will leak memory, but this is only the dummy
       * implementation (replaced by dlmalloc normally) so
       * not an issue.
       */
      var ptr = Runtime.dynamicAlloc(bytes + 8);
      return (ptr+8) & 0xFFFFFFF8;
    }
  Module["_malloc"] = _malloc;function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

   
  Module["_i64Add"] = _i64Add;

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  
  
  
  var ___cxa_last_thrown_exception=0;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  
  var ___cxa_exception_header_size=8;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
  
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  function _set_dpal_args() {
  Module['printErr']('missing function: set_dpal_args'); abort(-1);
  }

  function _pthread_mutex_lock() {}

  function _end_oligodg() {
  Module['printErr']('missing function: end_oligodg'); abort(-1);
  }

  
  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = Math.floor(idx / this.chunkSize);
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (function(from, to) {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
              // Some hints to the browser that we want binary data.
              if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || []);
              } else {
                return intArrayFromString(xhr.responseText || '', true);
              }
            });
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum];
            });
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              // runtimeConfig gets set to true if WebSocket runtime configuration is available.
              var runtimeConfig = (Module['websocket'] && ('object' === typeof Module['websocket']));
  
              // The default value is 'ws://' the replace is needed because the compiler replaces "//" comments with '#'
              // comments without checking context, so we'd end up with ws:#, the replace swaps the "#" for "//" again.
              var url = 'ws:#'.replace('#', '//');
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['url']) {
                  url = Module['websocket']['url']; // Fetch runtime WebSocket URL config.
                }
              }
  
              if (url === 'ws://' || url === 'wss://') { // Is the supplied URL config just a prefix, if so complete it.
                url = url + addr + ':' + port;
              }
  
              // Make the WebSocket subprotocol (Sec-WebSocket-Protocol) default to binary if no configuration is set.
              var subProtocols = 'binary'; // The default value is 'binary'
  
              if (runtimeConfig) {
                if ('string' === typeof Module['websocket']['subprotocol']) {
                  subProtocols = Module['websocket']['subprotocol']; // Fetch runtime WebSocket subprotocol config.
                }
              }
  
              // The regex trims the string (removes spaces at the beginning and end, then splits the string by
              // <any space>,<any space> into an Array. Whitespace removal is important for Websockify and ws.
              subProtocols = subProtocols.replace(/^ +| +$/g,"").split(/ *, */);
  
              // The node ws library API for specifying optional subprotocol is slightly different than the browser's.
              var opts = ENVIRONMENT_IS_NODE ? {'protocol': subProtocols.toString()} : subProtocols;
  
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) return -1;
      return stream.fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  
   
  Module["_strlen"] = _strlen;
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }


  var _emscripten_check_longjmp=true;

  
  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
  
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
  
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
  
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }function _strtoull_l(str, endptr, base) {
      return _strtoull(str, endptr, base); // no locale support yet
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      var fd = _fileno(stream);
      return _write(fd, s, _strlen(s));
    }
  
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr;
      var fd = _fileno(stream);
      var ret = _write(fd, _fputc.ret, 1);
      if (ret == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }


  
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }function _strtoll_l(str, endptr, base) {
      return _strtoll(str, endptr, base); // no locale support yet
    }

  
  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    } 
  Module["_saveSetjmp"] = _saveSetjmp;


  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }


  var _emscripten_prep_setjmp=true;

  var _emscripten_setjmp=true;

  function _pthread_cond_broadcast() {
      return 0;
    }

  
  
   
  Module["_testSetjmp"] = _testSetjmp;function _longjmp(env, value) {
      asm['setThrew'](env, value || 1);
      throw 'longjmp';
    }function _emscripten_longjmp(env, value) {
      _longjmp(env, value);
    }

  
  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }

  
  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }

  function _pthread_mutex_unlock() {}

  
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }function _isxdigit_l(chr) {
      return _isxdigit(chr); // no locale support yet
    }

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

   
  Module["_memmove"] = _memmove;

  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }

  var _emscripten_preinvoke=true;

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  function _pthread_cond_wait() {
      return 0;
    }

  function _fmod(x, y) {
      return x % y;
    }

  function ___cxa_guard_release() {}

  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }

  function _uselocale(locale) {
      return 0;
    }

  
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }

  
  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
                if (next === 0) return i > 0 ? fields : fields-1; // we failed to read the full length of this field
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }



  
  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(streamObj.fd, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }

  function ___errno_location() {
      return ___errno_state;
    }

   
  Module["_memset"] = _memset;

   
  Module["_strcat"] = _strcat;

  var _BItoD=true;

  function __Z21set_thal_default_argsP9thal_args() {
  Module['printErr']('missing function: _Z21set_thal_default_argsP9thal_args'); abort(-1);
  }

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _abort() {
      Module['abort']();
    }


  function _seqtm() {
  Module['printErr']('missing function: seqtm'); abort(-1);
  }


  function _catclose(catd) {
      // int catclose (nl_catd catd)
      return 0;
    }

  
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }function _isdigit_l(chr) {
      return _isdigit(chr); // no locale support yet
    }

  var _fabs=Math_abs;


  var _getc=_fgetc;

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        
        // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
        // Module['forcedAspectRatio'] = 4 / 3;
        
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'] ||
                                    canvas['msRequestPointerLock'] ||
                                    function(){};
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 document['msExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvasContainer.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              Browser.lastTouches[touch.identifier] = Browser.touches[touch.identifier];
              Browser.touches[touch.identifier] = { x: adjustedX, y: adjustedY };
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      }};

  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }

  var _emscripten_get_longjmp_result=true;

  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i];
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  
  function _free() {
  }
  Module["_free"] = _free;function _freelocale(locale) {
      _free(locale);
    }

  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }

  var _fmodl=_fmod;

  var _ceilf=Math_ceil;

  function _catgets(catd, set_id, msg_id, s) {
      // char *catgets (nl_catd catd, int set_id, int msg_id, const char *s)
      return s;
    }

  
  function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }

  var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC); 
  Module["_llvm_ctlz_i32"] = _llvm_ctlz_i32;

  function _catopen(name, oflag) {
      // nl_catd catopen (const char *name, int oflag)
      return -1;
    }


  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function __Z4thalPKhS0_PK9thal_argsP12thal_results() {
  Module['printErr']('missing function: _Z4thalPKhS0_PK9thal_argsP12thal_results'); abort(-1);
  }

  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }

  function _dpal_set_ambiguity_code_matrix() {
  Module['printErr']('missing function: dpal_set_ambiguity_code_matrix'); abort(-1);
  }

  
  var ___cxa_caught_exceptions=[];function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }



  var _emscripten_postinvoke=true;

  function __ZNSt9exceptionD2Ev() {}

  function _long_seq_tm() {
  Module['printErr']('missing function: long_seq_tm'); abort(-1);
  }


   
  Module["_strcpy"] = _strcpy;

  function _dpal() {
  Module['printErr']('missing function: dpal'); abort(-1);
  }

  function __INFINITY() {
  Module['printErr']('missing function: _INFINITY'); abort(-1);
  }

  var __ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);

  var ___dso_handle=allocate(1, "i32*", ALLOC_STATIC);



FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_diiiddd(index,a1,a2,a3,a4,a5,a6) {
  try {
    return Module["dynCall_diiiddd"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_dd(index,a1) {
  try {
    return Module["dynCall_dd"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_diii(index,a1,a2,a3) {
  try {
    return Module["dynCall_diii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    return Module["dynCall_iiiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.__INFINITY|0;var p=env.__ZTISt9exception|0;var q=env.___dso_handle|0;var r=env._stderr|0;var s=env._stdin|0;var t=env._stdout|0;var u=0;var v=0;var w=0;var x=0;var y=+env.NaN,z=+env.Infinity;var A=0,B=0,C=0,D=0,E=0.0,F=0,G=0,H=0,I=0.0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=global.Math.floor;var U=global.Math.abs;var V=global.Math.sqrt;var W=global.Math.pow;var X=global.Math.cos;var Y=global.Math.sin;var Z=global.Math.tan;var _=global.Math.acos;var $=global.Math.asin;var aa=global.Math.atan;var ba=global.Math.atan2;var ca=global.Math.exp;var da=global.Math.log;var ea=global.Math.ceil;var fa=global.Math.imul;var ga=env.abort;var ha=env.assert;var ia=env.asmPrintInt;var ja=env.asmPrintFloat;var ka=env.min;var la=env.invoke_viiiii;var ma=env.invoke_vi;var na=env.invoke_vii;var oa=env.invoke_ii;var pa=env.invoke_diiiddd;var qa=env.invoke_iiiii;var ra=env.invoke_iiii;var sa=env.invoke_viiiiid;var ta=env.invoke_viiiiiiii;var ua=env.invoke_viiiiii;var va=env.invoke_dd;var wa=env.invoke_viiiiiii;var xa=env.invoke_viiiiiid;var ya=env.invoke_viiiiiiiii;var za=env.invoke_iii;var Aa=env.invoke_iiiiii;var Ba=env.invoke_diii;var Ca=env.invoke_i;var Da=env.invoke_iiiiiiiiii;var Ea=env.invoke_viii;var Fa=env.invoke_v;var Ga=env.invoke_iiiiiiiii;var Ha=env.invoke_viiii;var Ia=env._fabs;var Ja=env._vsscanf;var Ka=env.__ZSt9terminatev;var La=env.___cxa_guard_acquire;var Ma=env.__reallyNegative;var Na=env.__ZSt18uncaught_exceptionv;var Oa=env._longjmp;var Pa=env.___ctype_toupper_loc;var Qa=env.__addDays;var Ra=env._sbrk;var Sa=env.___cxa_begin_catch;var Ta=env._emscripten_memcpy_big;var Ua=env._sysconf;var Va=env._end_oligodg;var Wa=env._fileno;var Xa=env._fread;var Ya=env._puts;var Za=env._dpal;var _a=env._write;var $a=env.__isLeapYear;var ab=env.__ZNSt9exceptionD2Ev;var bb=env.___cxa_does_inherit;var cb=env.__exit;var db=env._catclose;var eb=env.__Z21set_thal_default_argsP9thal_args;var fb=env._send;var gb=env.___cxa_is_number_type;var hb=env.___cxa_find_matching_catch;var ib=env._isxdigit_l;var jb=env.___cxa_guard_release;var kb=env._strerror_r;var lb=env.___setErrNo;var mb=env._newlocale;var nb=env._isdigit_l;var ob=env.___resumeException;var pb=env._freelocale;var qb=env._dpal_set_ambiguity_code_matrix;var rb=env._putchar;var sb=env._printf;var tb=env._sprintf;var ub=env._vasprintf;var vb=env._vsnprintf;var wb=env._strtoull_l;var xb=env._read;var yb=env._fwrite;var zb=env._time;var Ab=env._fprintf;var Bb=env._catopen;var Cb=env._exit;var Db=env.___ctype_b_loc;var Eb=env._fmod;var Fb=env.__Z4thalPKhS0_PK9thal_argsP12thal_results;var Gb=env.___cxa_allocate_exception;var Hb=env._ceilf;var Ib=env._strtoll;var Jb=env._pwrite;var Kb=env._uselocale;var Lb=env._snprintf;var Mb=env.__scanString;var Nb=env._strtoull;var Ob=env._strftime;var Pb=env._isxdigit;var Qb=env._pthread_cond_broadcast;var Rb=env._recv;var Sb=env._fgetc;var Tb=env.__parseInt64;var Ub=env.__getFloat;var Vb=env._seqtm;var Wb=env._abort;var Xb=env._set_dpal_args;var Yb=env._isspace;var Zb=env._pthread_cond_wait;var _b=env._ungetc;var $b=env._fflush;var ac=env._strftime_l;var bc=env._pthread_mutex_lock;var cc=env._sscanf;var dc=env._catgets;var ec=env._asprintf;var fc=env._strtoll_l;var gc=env.__arraySum;var hc=env.___ctype_tolower_loc;var ic=env._fputs;var jc=env._pthread_mutex_unlock;var kc=env._pread;var lc=env._mkport;var mc=env.___errno_location;var nc=env._copysign;var oc=env._fputc;var pc=env.___cxa_throw;var qc=env._isdigit;var rc=env._strerror;var sc=env._emscripten_longjmp;var tc=env.__formatString;var uc=env._atexit;var vc=env._long_seq_tm;var wc=0.0;
// EMSCRIPTEN_START_FUNCS
function Bi(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;l=i;i=i+32|0;m=l;n=l+28|0;o=l+12|0;p=l+16|0;q=l+20|0;r=l+24|0;zf(o,f);s=c[o>>2]|0;if(!((c[4466]|0)==-1)){c[m>>2]=17864;c[m+4>>2]=117;c[m+8>>2]=0;$e(17864,m,118)}t=(c[17868>>2]|0)+ -1|0;u=c[s+8>>2]|0;if(!((c[s+12>>2]|0)-u>>2>>>0>t>>>0)){v=Gb(4)|0;_m(v);pc(v|0,25832,102)}s=c[u+(t<<2)>>2]|0;if((s|0)==0){v=Gb(4)|0;_m(v);pc(v|0,25832,102)}Fe(c[o>>2]|0)|0;c[g>>2]=0;a:do{if((j|0)!=(k|0)){o=j;v=0;b:while(1){t=v;while(1){if((t|0)!=0){w=69;break a}u=c[d>>2]|0;if((u|0)!=0){x=c[u+12>>2]|0;if((x|0)==(c[u+16>>2]|0)){y=Ac[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{y=c[x>>2]|0}if((y|0)==-1){c[d>>2]=0;z=1;A=0}else{z=0;A=u}}else{z=1;A=0}u=c[e>>2]|0;do{if((u|0)!=0){x=c[u+12>>2]|0;if((x|0)==(c[u+16>>2]|0)){B=Ac[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{B=c[x>>2]|0}if(!((B|0)==-1)){if(z){C=u;break}else{w=24;break b}}else{c[e>>2]=0;w=22;break}}else{w=22}}while(0);if((w|0)==22){w=0;if(z){w=24;break b}else{C=0}}if((Dc[c[(c[s>>2]|0)+52>>2]&31](s,c[o>>2]|0,0)|0)<<24>>24==37){w=26;break}if(Dc[c[(c[s>>2]|0)+12>>2]&31](s,8192,c[o>>2]|0)|0){D=o;w=36;break}E=A+12|0;u=c[E>>2]|0;F=A+16|0;if((u|0)==(c[F>>2]|0)){G=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{G=c[u>>2]|0}u=Lc[c[(c[s>>2]|0)+28>>2]&31](s,G)|0;if((u|0)==(Lc[c[(c[s>>2]|0)+28>>2]&31](s,c[o>>2]|0)|0)){w=64;break}c[g>>2]=4;t=4}c:do{if((w|0)==26){w=0;t=o+4|0;if((t|0)==(k|0)){w=27;break b}u=Dc[c[(c[s>>2]|0)+52>>2]&31](s,c[t>>2]|0,0)|0;if(u<<24>>24==48|u<<24>>24==69){x=o+8|0;if((x|0)==(k|0)){w=30;break b}H=x;I=Dc[c[(c[s>>2]|0)+52>>2]&31](s,c[x>>2]|0,0)|0;J=u}else{H=t;I=u;J=0}u=c[(c[b>>2]|0)+36>>2]|0;c[q>>2]=A;c[r>>2]=C;c[n+0>>2]=c[q+0>>2];c[m+0>>2]=c[r+0>>2];Kc[u&3](p,b,n,m,f,g,h,I,J);c[d>>2]=c[p>>2];K=H+4|0}else if((w|0)==36){while(1){w=0;u=D+4|0;if((u|0)==(k|0)){L=k;break}if(Dc[c[(c[s>>2]|0)+12>>2]&31](s,8192,c[u>>2]|0)|0){D=u;w=36}else{L=u;break}}u=A;t=C;x=C;while(1){if((u|0)!=0){M=c[u+12>>2]|0;if((M|0)==(c[u+16>>2]|0)){N=Ac[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{N=c[M>>2]|0}if((N|0)==-1){c[d>>2]=0;O=1;P=0}else{O=0;P=u}}else{O=1;P=0}do{if((x|0)!=0){M=c[x+12>>2]|0;if((M|0)==(c[x+16>>2]|0)){Q=Ac[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{Q=c[M>>2]|0}if(!((Q|0)==-1)){if(O^(t|0)==0){R=t;S=t;break}else{K=L;break c}}else{c[e>>2]=0;T=0;w=51;break}}else{T=t;w=51}}while(0);if((w|0)==51){w=0;if(O){K=L;break c}else{R=T;S=0}}M=P+12|0;U=c[M>>2]|0;V=P+16|0;if((U|0)==(c[V>>2]|0)){W=Ac[c[(c[P>>2]|0)+36>>2]&127](P)|0}else{W=c[U>>2]|0}if(!(Dc[c[(c[s>>2]|0)+12>>2]&31](s,8192,W)|0)){K=L;break c}U=c[M>>2]|0;if((U|0)==(c[V>>2]|0)){Ac[c[(c[P>>2]|0)+40>>2]&127](P)|0;u=P;t=R;x=S;continue}else{c[M>>2]=U+4;u=P;t=R;x=S;continue}}}else if((w|0)==64){w=0;x=c[E>>2]|0;if((x|0)==(c[F>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0}else{c[E>>2]=x+4}K=o+4|0}}while(0);if((K|0)==(k|0)){w=69;break a}o=K;v=c[g>>2]|0}if((w|0)==24){c[g>>2]=4;X=A;break}else if((w|0)==27){c[g>>2]=4;X=A;break}else if((w|0)==30){c[g>>2]=4;X=A;break}}else{w=69}}while(0);if((w|0)==69){X=c[d>>2]|0}if((X|0)!=0){A=c[X+12>>2]|0;if((A|0)==(c[X+16>>2]|0)){Y=Ac[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{Y=c[A>>2]|0}if((Y|0)==-1){c[d>>2]=0;Z=0;_=1}else{Z=X;_=0}}else{Z=0;_=1}X=c[e>>2]|0;do{if((X|0)!=0){d=c[X+12>>2]|0;if((d|0)==(c[X+16>>2]|0)){$=Ac[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{$=c[d>>2]|0}if(($|0)==-1){c[e>>2]=0;w=82;break}if(_){c[a>>2]=Z;i=l;return}}else{w=82}}while(0);if((w|0)==82?!_:0){c[a>>2]=Z;i=l;return}c[g>>2]=c[g>>2]|2;c[a>>2]=Z;i=l;return}function Ci(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Di(a){a=a|0;return}function Ei(a){a=a|0;return 2}function Fi(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+16|0;k=j+12|0;l=j;m=j+4|0;n=j+8|0;c[m>>2]=c[d>>2];c[n>>2]=c[e>>2];c[l+0>>2]=c[m+0>>2];c[k+0>>2]=c[n+0>>2];Bi(a,b,l,k,f,g,h,16928,16960|0);i=j;return}function Gi(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+16|0;l=k+12|0;m=k;n=k+4|0;o=k+8|0;p=d+8|0;q=Ac[c[(c[p>>2]|0)+20>>2]&127](p)|0;c[n>>2]=c[e>>2];c[o>>2]=c[f>>2];f=a[q]|0;if((f&1)==0){r=q+4|0;s=(f&255)>>>1;t=q+4|0}else{f=c[q+8>>2]|0;r=f;s=c[q+4>>2]|0;t=f}f=r+(s<<2)|0;c[m+0>>2]=c[n+0>>2];c[l+0>>2]=c[o+0>>2];Bi(b,d,m,l,g,h,j,t,f);i=k;return}function Hi(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+32|0;k=j;l=j+16|0;m=j+12|0;zf(m,f);f=c[m>>2]|0;if(!((c[4466]|0)==-1)){c[k>>2]=17864;c[k+4>>2]=117;c[k+8>>2]=0;$e(17864,k,118)}n=(c[17868>>2]|0)+ -1|0;o=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-o>>2>>>0>n>>>0)){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}f=c[o+(n<<2)>>2]|0;if((f|0)==0){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[e>>2]|0;e=b+8|0;b=Ac[c[c[e>>2]>>2]&127](e)|0;c[l>>2]=m;m=b+168|0;c[k+0>>2]=c[l+0>>2];l=(nh(d,k,b,m,f,g,0)|0)-b|0;if((l|0)>=168){q=c[d>>2]|0;c[a>>2]=q;i=j;return}c[h+24>>2]=((l|0)/12|0|0)%7|0;q=c[d>>2]|0;c[a>>2]=q;i=j;return}function Ii(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+32|0;k=j;l=j+16|0;m=j+12|0;zf(m,f);f=c[m>>2]|0;if(!((c[4466]|0)==-1)){c[k>>2]=17864;c[k+4>>2]=117;c[k+8>>2]=0;$e(17864,k,118)}n=(c[17868>>2]|0)+ -1|0;o=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-o>>2>>>0>n>>>0)){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}f=c[o+(n<<2)>>2]|0;if((f|0)==0){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[e>>2]|0;e=b+8|0;b=Ac[c[(c[e>>2]|0)+4>>2]&127](e)|0;c[l>>2]=m;m=b+288|0;c[k+0>>2]=c[l+0>>2];l=(nh(d,k,b,m,f,g,0)|0)-b|0;if((l|0)>=288){q=c[d>>2]|0;c[a>>2]=q;i=j;return}c[h+16>>2]=((l|0)/12|0|0)%12|0;q=c[d>>2]|0;c[a>>2]=q;i=j;return}function Ji(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+32|0;j=b;k=b+16|0;l=b+12|0;zf(l,f);f=c[l>>2]|0;if(!((c[4466]|0)==-1)){c[j>>2]=17864;c[j+4>>2]=117;c[j+8>>2]=0;$e(17864,j,118)}m=(c[17868>>2]|0)+ -1|0;n=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-n>>2>>>0>m>>>0)){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}f=c[n+(m<<2)>>2]|0;if((f|0)==0){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}Fe(c[l>>2]|0)|0;l=h+20|0;c[k>>2]=c[e>>2];c[j+0>>2]=c[k+0>>2];k=Ni(d,j,g,f,4)|0;if((c[g>>2]&4|0)!=0){p=c[d>>2]|0;c[a>>2]=p;i=b;return}if((k|0)<69){q=k+2e3|0}else{q=(k+ -69|0)>>>0<31?k+1900|0:k}c[l>>2]=q+ -1900;p=c[d>>2]|0;c[a>>2]=p;i=b;return}function Ki(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0;l=i;i=i+176|0;m=l;n=l+160|0;o=l+156|0;p=l+152|0;q=l+148|0;r=l+144|0;s=l+140|0;t=l+136|0;u=l+132|0;v=l+128|0;w=l+124|0;x=l+120|0;y=l+116|0;z=l+112|0;A=l+108|0;B=l+104|0;C=l+100|0;D=l+96|0;E=l+92|0;F=l+88|0;G=l+164|0;H=l+44|0;I=l+36|0;J=l+32|0;K=l+28|0;L=l+40|0;M=l+16|0;N=l+12|0;O=l+20|0;P=l+24|0;Q=l+80|0;R=l+48|0;S=l+52|0;T=l+56|0;U=l+60|0;V=l+64|0;W=l+68|0;X=l+72|0;Y=l+76|0;Z=l+84|0;c[h>>2]=0;zf(A,g);_=c[A>>2]|0;if(!((c[4466]|0)==-1)){c[m>>2]=17864;c[m+4>>2]=117;c[m+8>>2]=0;$e(17864,m,118)}$=(c[17868>>2]|0)+ -1|0;aa=c[_+8>>2]|0;if(!((c[_+12>>2]|0)-aa>>2>>>0>$>>>0)){ba=Gb(4)|0;_m(ba);pc(ba|0,25832,102)}_=c[aa+($<<2)>>2]|0;if((_|0)==0){ba=Gb(4)|0;_m(ba);pc(ba|0,25832,102)}Fe(c[A>>2]|0)|0;a:do{switch(k<<24>>24|0){case 83:{c[q>>2]=c[f>>2];c[m+0>>2]=c[q+0>>2];A=Ni(e,m,h,_,2)|0;ba=c[h>>2]|0;if((ba&4|0)==0&(A|0)<61){c[j>>2]=A;break a}else{c[h>>2]=ba|4;break a}break};case 82:{c[P>>2]=c[e>>2];c[Q>>2]=c[f>>2];c[n+0>>2]=c[P+0>>2];c[m+0>>2]=c[Q+0>>2];Bi(O,d,n,m,g,h,j,17072,17092|0);c[e>>2]=c[O>>2];break};case 37:{c[Z>>2]=c[f>>2];c[m+0>>2]=c[Z+0>>2];Mi(0,e,m,h,_);break};case 114:{c[M>>2]=c[e>>2];c[N>>2]=c[f>>2];c[n+0>>2]=c[M+0>>2];c[m+0>>2]=c[N+0>>2];Bi(L,d,n,m,g,h,j,17024,17068|0);c[e>>2]=c[L>>2];break};case 88:{ba=d+8|0;A=Ac[c[(c[ba>>2]|0)+24>>2]&127](ba)|0;c[X>>2]=c[e>>2];c[Y>>2]=c[f>>2];ba=a[A]|0;if((ba&1)==0){ca=A+4|0;da=(ba&255)>>>1;ea=A+4|0}else{ba=c[A+8>>2]|0;ca=ba;da=c[A+4>>2]|0;ea=ba}c[n+0>>2]=c[X+0>>2];c[m+0>>2]=c[Y+0>>2];Bi(W,d,n,m,g,h,j,ea,ca+(da<<2)|0);c[e>>2]=c[W>>2];break};case 99:{ba=d+8|0;A=Ac[c[(c[ba>>2]|0)+12>>2]&127](ba)|0;c[C>>2]=c[e>>2];c[D>>2]=c[f>>2];ba=a[A]|0;if((ba&1)==0){fa=A+4|0;ga=(ba&255)>>>1;ha=A+4|0}else{ba=c[A+8>>2]|0;fa=ba;ga=c[A+4>>2]|0;ha=ba}c[n+0>>2]=c[C+0>>2];c[m+0>>2]=c[D+0>>2];Bi(B,d,n,m,g,h,j,ha,fa+(ga<<2)|0);c[e>>2]=c[B>>2];break};case 89:{c[n>>2]=c[f>>2];c[m+0>>2]=c[n+0>>2];ba=Ni(e,m,h,_,4)|0;if((c[h>>2]&4|0)==0){c[j+20>>2]=ba+ -1900}break};case 65:case 97:{ba=c[f>>2]|0;A=d+8|0;$=Ac[c[c[A>>2]>>2]&127](A)|0;c[z>>2]=ba;c[m+0>>2]=c[z+0>>2];ba=(nh(e,m,$,$+168|0,_,h,0)|0)-$|0;if((ba|0)<168){c[j+24>>2]=((ba|0)/12|0|0)%7|0}break};case 104:case 66:case 98:{ba=c[f>>2]|0;$=d+8|0;A=Ac[c[(c[$>>2]|0)+4>>2]&127]($)|0;c[y>>2]=ba;c[m+0>>2]=c[y+0>>2];ba=(nh(e,m,A,A+288|0,_,h,0)|0)-A|0;if((ba|0)<288){c[j+16>>2]=((ba|0)/12|0|0)%12|0}break};case 121:{ba=j+20|0;c[o>>2]=c[f>>2];c[m+0>>2]=c[o+0>>2];A=Ni(e,m,h,_,4)|0;if((c[h>>2]&4|0)==0){if((A|0)<69){ia=A+2e3|0}else{ia=(A+ -69|0)>>>0<31?A+1900|0:A}c[ba>>2]=ia+ -1900}break};case 84:{c[S>>2]=c[e>>2];c[T>>2]=c[f>>2];c[n+0>>2]=c[S+0>>2];c[m+0>>2]=c[T+0>>2];Bi(R,d,n,m,g,h,j,17096,17128|0);c[e>>2]=c[R>>2];break};case 77:{c[s>>2]=c[f>>2];c[m+0>>2]=c[s+0>>2];ba=Ni(e,m,h,_,2)|0;A=c[h>>2]|0;if((A&4|0)==0&(ba|0)<60){c[j+4>>2]=ba;break a}else{c[h>>2]=A|4;break a}break};case 116:case 110:{c[K>>2]=c[f>>2];c[m+0>>2]=c[K+0>>2];Li(0,e,m,h,_);break};case 109:{c[t>>2]=c[f>>2];c[m+0>>2]=c[t+0>>2];A=Ni(e,m,h,_,2)|0;ba=c[h>>2]|0;if((ba&4|0)==0&(A|0)<13){c[j+16>>2]=A+ -1;break a}else{c[h>>2]=ba|4;break a}break};case 119:{c[p>>2]=c[f>>2];c[m+0>>2]=c[p+0>>2];ba=Ni(e,m,h,_,1)|0;A=c[h>>2]|0;if((A&4|0)==0&(ba|0)<7){c[j+24>>2]=ba;break a}else{c[h>>2]=A|4;break a}break};case 101:case 100:{A=j+12|0;c[x>>2]=c[f>>2];c[m+0>>2]=c[x+0>>2];ba=Ni(e,m,h,_,2)|0;$=c[h>>2]|0;if(($&4|0)==0?(ba+ -1|0)>>>0<31:0){c[A>>2]=ba;break a}c[h>>2]=$|4;break};case 112:{$=j+8|0;ba=c[f>>2]|0;A=d+8|0;aa=Ac[c[(c[A>>2]|0)+8>>2]&127](A)|0;A=a[aa]|0;if((A&1)==0){ja=(A&255)>>>1}else{ja=c[aa+4>>2]|0}A=a[aa+12|0]|0;if((A&1)==0){ka=(A&255)>>>1}else{ka=c[aa+16>>2]|0}if((ja|0)==(0-ka|0)){c[h>>2]=c[h>>2]|4;break a}c[r>>2]=ba;c[m+0>>2]=c[r+0>>2];ba=nh(e,m,aa,aa+24|0,_,h,0)|0;A=ba-aa|0;if((ba|0)==(aa|0)?(c[$>>2]|0)==12:0){c[$>>2]=0;break a}if((A|0)==12?(A=c[$>>2]|0,(A|0)<12):0){c[$>>2]=A+12}break};case 120:{A=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];c[n+0>>2]=c[U+0>>2];c[m+0>>2]=c[V+0>>2];Ic[A&63](b,d,n,m,g,h,j);i=l;return};case 72:{c[w>>2]=c[f>>2];c[m+0>>2]=c[w+0>>2];A=Ni(e,m,h,_,2)|0;$=c[h>>2]|0;if(($&4|0)==0&(A|0)<24){c[j+8>>2]=A;break a}else{c[h>>2]=$|4;break a}break};case 73:{$=j+8|0;c[v>>2]=c[f>>2];c[m+0>>2]=c[v+0>>2];A=Ni(e,m,h,_,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0?(A+ -1|0)>>>0<12:0){c[$>>2]=A;break a}c[h>>2]=aa|4;break};case 68:{c[F>>2]=c[e>>2];c[G>>2]=c[f>>2];c[n+0>>2]=c[F+0>>2];c[m+0>>2]=c[G+0>>2];Bi(E,d,n,m,g,h,j,16960,16992|0);c[e>>2]=c[E>>2];break};case 70:{c[I>>2]=c[e>>2];c[J>>2]=c[f>>2];c[n+0>>2]=c[I+0>>2];c[m+0>>2]=c[J+0>>2];Bi(H,d,n,m,g,h,j,16992,17024|0);c[e>>2]=c[H>>2];break};case 106:{c[u>>2]=c[f>>2];c[m+0>>2]=c[u+0>>2];aa=Ni(e,m,h,_,3)|0;A=c[h>>2]|0;if((A&4|0)==0&(aa|0)<366){c[j+28>>2]=aa;break a}else{c[h>>2]=A|4;break a}break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}function Li(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;a=i;a:while(1){g=c[b>>2]|0;do{if((g|0)!=0){h=c[g+12>>2]|0;if((h|0)==(c[g+16>>2]|0)){j=Ac[c[(c[g>>2]|0)+36>>2]&127](g)|0}else{j=c[h>>2]|0}if((j|0)==-1){c[b>>2]=0;k=1;break}else{k=(c[b>>2]|0)==0;break}}else{k=1}}while(0);g=c[d>>2]|0;do{if((g|0)!=0){h=c[g+12>>2]|0;if((h|0)==(c[g+16>>2]|0)){l=Ac[c[(c[g>>2]|0)+36>>2]&127](g)|0}else{l=c[h>>2]|0}if(!((l|0)==-1)){if(k){m=g;break}else{n=g;break a}}else{c[d>>2]=0;o=15;break}}else{o=15}}while(0);if((o|0)==15){o=0;if(k){n=0;break}else{m=0}}g=c[b>>2]|0;h=c[g+12>>2]|0;if((h|0)==(c[g+16>>2]|0)){p=Ac[c[(c[g>>2]|0)+36>>2]&127](g)|0}else{p=c[h>>2]|0}if(!(Dc[c[(c[f>>2]|0)+12>>2]&31](f,8192,p)|0)){n=m;break}h=c[b>>2]|0;g=h+12|0;q=c[g>>2]|0;if((q|0)==(c[h+16>>2]|0)){Ac[c[(c[h>>2]|0)+40>>2]&127](h)|0;continue}else{c[g>>2]=q+4;continue}}m=c[b>>2]|0;do{if((m|0)!=0){p=c[m+12>>2]|0;if((p|0)==(c[m+16>>2]|0)){r=Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{r=c[p>>2]|0}if((r|0)==-1){c[b>>2]=0;s=1;break}else{s=(c[b>>2]|0)==0;break}}else{s=1}}while(0);do{if((n|0)!=0){b=c[n+12>>2]|0;if((b|0)==(c[n+16>>2]|0)){t=Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{t=c[b>>2]|0}if((t|0)==-1){c[d>>2]=0;o=37;break}if(s){i=a;return}}else{o=37}}while(0);if((o|0)==37?!s:0){i=a;return}c[e>>2]=c[e>>2]|2;i=a;return}function Mi(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;a=i;g=c[b>>2]|0;do{if((g|0)!=0){h=c[g+12>>2]|0;if((h|0)==(c[g+16>>2]|0)){j=Ac[c[(c[g>>2]|0)+36>>2]&127](g)|0}else{j=c[h>>2]|0}if((j|0)==-1){c[b>>2]=0;k=1;break}else{k=(c[b>>2]|0)==0;break}}else{k=1}}while(0);j=c[d>>2]|0;do{if((j|0)!=0){g=c[j+12>>2]|0;if((g|0)==(c[j+16>>2]|0)){l=Ac[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{l=c[g>>2]|0}if(!((l|0)==-1)){if(k){m=j;break}else{n=16;break}}else{c[d>>2]=0;n=14;break}}else{n=14}}while(0);if((n|0)==14){if(k){n=16}else{m=0}}if((n|0)==16){c[e>>2]=c[e>>2]|6;i=a;return}k=c[b>>2]|0;j=c[k+12>>2]|0;if((j|0)==(c[k+16>>2]|0)){o=Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{o=c[j>>2]|0}if(!((Dc[c[(c[f>>2]|0)+52>>2]&31](f,o,0)|0)<<24>>24==37)){c[e>>2]=c[e>>2]|4;i=a;return}o=c[b>>2]|0;f=o+12|0;j=c[f>>2]|0;if((j|0)==(c[o+16>>2]|0)){Ac[c[(c[o>>2]|0)+40>>2]&127](o)|0}else{c[f>>2]=j+4}j=c[b>>2]|0;do{if((j|0)!=0){f=c[j+12>>2]|0;if((f|0)==(c[j+16>>2]|0)){p=Ac[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{p=c[f>>2]|0}if((p|0)==-1){c[b>>2]=0;q=1;break}else{q=(c[b>>2]|0)==0;break}}else{q=1}}while(0);do{if((m|0)!=0){b=c[m+12>>2]|0;if((b|0)==(c[m+16>>2]|0)){r=Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{r=c[b>>2]|0}if((r|0)==-1){c[d>>2]=0;n=38;break}if(q){i=a;return}}else{n=38}}while(0);if((n|0)==38?!q:0){i=a;return}c[e>>2]=c[e>>2]|2;i=a;return}function Ni(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;g=i;h=c[a>>2]|0;do{if((h|0)!=0){j=c[h+12>>2]|0;if((j|0)==(c[h+16>>2]|0)){k=Ac[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{k=c[j>>2]|0}if((k|0)==-1){c[a>>2]=0;l=1;break}else{l=(c[a>>2]|0)==0;break}}else{l=1}}while(0);k=c[b>>2]|0;do{if((k|0)!=0){h=c[k+12>>2]|0;if((h|0)==(c[k+16>>2]|0)){m=Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{m=c[h>>2]|0}if(!((m|0)==-1)){if(l){n=k;break}else{o=16;break}}else{c[b>>2]=0;o=14;break}}else{o=14}}while(0);if((o|0)==14){if(l){o=16}else{n=0}}if((o|0)==16){c[d>>2]=c[d>>2]|6;p=0;i=g;return p|0}l=c[a>>2]|0;k=c[l+12>>2]|0;if((k|0)==(c[l+16>>2]|0)){q=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{q=c[k>>2]|0}if(!(Dc[c[(c[e>>2]|0)+12>>2]&31](e,2048,q)|0)){c[d>>2]=c[d>>2]|4;p=0;i=g;return p|0}k=(Dc[c[(c[e>>2]|0)+52>>2]&31](e,q,0)|0)<<24>>24;q=c[a>>2]|0;l=q+12|0;m=c[l>>2]|0;if((m|0)==(c[q+16>>2]|0)){Ac[c[(c[q>>2]|0)+40>>2]&127](q)|0;r=f;s=n;t=n;u=k}else{c[l>>2]=m+4;r=f;s=n;t=n;u=k}while(1){v=u+ -48|0;k=r+ -1|0;n=c[a>>2]|0;do{if((n|0)!=0){f=c[n+12>>2]|0;if((f|0)==(c[n+16>>2]|0)){w=Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{w=c[f>>2]|0}if((w|0)==-1){c[a>>2]=0;x=1;break}else{x=(c[a>>2]|0)==0;break}}else{x=1}}while(0);do{if((t|0)!=0){n=c[t+12>>2]|0;if((n|0)==(c[t+16>>2]|0)){y=Ac[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{y=c[n>>2]|0}if((y|0)==-1){c[b>>2]=0;z=0;A=0;B=1;break}else{z=s;A=s;B=(s|0)==0;break}}else{z=s;A=0;B=1}}while(0);C=c[a>>2]|0;if(!((x^B)&(k|0)>0)){break}n=c[C+12>>2]|0;if((n|0)==(c[C+16>>2]|0)){D=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{D=c[n>>2]|0}if(!(Dc[c[(c[e>>2]|0)+12>>2]&31](e,2048,D)|0)){p=v;o=63;break}n=((Dc[c[(c[e>>2]|0)+52>>2]&31](e,D,0)|0)<<24>>24)+(v*10|0)|0;f=c[a>>2]|0;m=f+12|0;l=c[m>>2]|0;if((l|0)==(c[f+16>>2]|0)){Ac[c[(c[f>>2]|0)+40>>2]&127](f)|0;r=k;s=z;t=A;u=n;continue}else{c[m>>2]=l+4;r=k;s=z;t=A;u=n;continue}}if((o|0)==63){i=g;return p|0}do{if((C|0)!=0){u=c[C+12>>2]|0;if((u|0)==(c[C+16>>2]|0)){E=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{E=c[u>>2]|0}if((E|0)==-1){c[a>>2]=0;F=1;break}else{F=(c[a>>2]|0)==0;break}}else{F=1}}while(0);do{if((z|0)!=0){a=c[z+12>>2]|0;if((a|0)==(c[z+16>>2]|0)){G=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{G=c[a>>2]|0}if((G|0)==-1){c[b>>2]=0;o=60;break}if(F){p=v;i=g;return p|0}}else{o=60}}while(0);if((o|0)==60?!F:0){p=v;i=g;return p|0}c[d>>2]=c[d>>2]|2;p=v;i=g;return p|0}function Oi(b){b=b|0;var d=0,e=0,f=0;d=i;e=b+8|0;f=c[e>>2]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}if((f|0)==(c[4440]|0)){Cn(b);i=d;return}pb(c[e>>2]|0);Cn(b);i=d;return}function Pi(b){b=b|0;var d=0,e=0;d=i;e=b+8|0;b=c[e>>2]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}if((b|0)==(c[4440]|0)){i=d;return}pb(c[e>>2]|0);i=d;return}function Qi(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+112|0;f=g+100|0;l=g;a[f]=37;m=f+1|0;a[m]=j;n=f+2|0;a[n]=k;a[f+3|0]=0;if(!(k<<24>>24==0)){a[m]=k;a[n]=j}j=ac(l|0,100,f|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;h=c[e>>2]|0;if((j|0)==0){o=h;c[b>>2]=o;i=g;return}else{p=l;q=h;r=h}while(1){h=a[p]|0;do{if((q|0)!=0){l=q+24|0;j=c[l>>2]|0;if((j|0)==(c[q+28>>2]|0)){e=(Lc[c[(c[q>>2]|0)+52>>2]&31](q,h&255)|0)==-1;s=e?0:r;t=e?0:q;break}else{c[l>>2]=j+1;a[j]=h;s=r;t=q;break}}else{s=r;t=0}}while(0);h=p+1|0;if((h|0)==(d|0)){o=s;break}else{p=h;q=t;r=s}}c[b>>2]=o;i=g;return}function Ri(b){b=b|0;var d=0,e=0,f=0;d=i;e=b+8|0;f=c[e>>2]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}if((f|0)==(c[4440]|0)){Cn(b);i=d;return}pb(c[e>>2]|0);Cn(b);i=d;return}function Si(b){b=b|0;var d=0,e=0;d=i;e=b+8|0;b=c[e>>2]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}if((b|0)==(c[4440]|0)){i=d;return}pb(c[e>>2]|0);i=d;return}function Ti(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+416|0;e=f+8|0;k=f;c[k>>2]=e+400;Ui(b+8|0,e,k,g,h,j);j=c[k>>2]|0;k=c[d>>2]|0;if((e|0)==(j|0)){l=k;c[a>>2]=l;i=f;return}else{m=e;n=k;o=k}while(1){k=c[m>>2]|0;if((o|0)==0){p=n;q=0}else{e=o+24|0;d=c[e>>2]|0;if((d|0)==(c[o+28>>2]|0)){r=Lc[c[(c[o>>2]|0)+52>>2]&31](o,k)|0}else{c[e>>2]=d+4;c[d>>2]=k;r=k}k=(r|0)==-1;p=k?0:n;q=k?0:o}k=m+4|0;if((k|0)==(j|0)){l=p;break}else{m=k;n=p;o=q}}c[a>>2]=l;i=f;return}function Ui(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0;j=i;i=i+128|0;k=j+112|0;l=j+12|0;m=j;n=j+8|0;a[k]=37;o=k+1|0;a[o]=g;p=k+2|0;a[p]=h;a[k+3|0]=0;if(!(h<<24>>24==0)){a[o]=h;a[p]=g}ac(l|0,100,k|0,f|0,c[b>>2]|0)|0;f=m;c[f>>2]=0;c[f+4>>2]=0;c[n>>2]=l;l=(c[e>>2]|0)-d>>2;f=Kb(c[b>>2]|0)|0;b=Nm(d,n,l,m)|0;if((f|0)!=0){Kb(f|0)|0}if((b|0)==-1){Qj(18752)}else{c[e>>2]=d+(b<<2);i=j;return}}function Vi(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Wi(a){a=a|0;return}function Xi(a){a=a|0;return 127}function Yi(a){a=a|0;return 127}function Zi(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function _i(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function $i(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function aj(a,b){a=a|0;b=b|0;b=i;df(a,1,45);i=b;return}function bj(a){a=a|0;return 0}function cj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function dj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function ej(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function fj(a){a=a|0;return}function gj(a){a=a|0;return 127}function hj(a){a=a|0;return 127}function ij(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function jj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function kj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function lj(a,b){a=a|0;b=b|0;b=i;df(a,1,45);i=b;return}function mj(a){a=a|0;return 0}function nj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function oj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function pj(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function qj(a){a=a|0;return}function rj(a){a=a|0;return 2147483647}function sj(a){a=a|0;return 2147483647}function tj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function uj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function vj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function wj(a,b){a=a|0;b=b|0;b=i;pf(a,1,45);i=b;return}function xj(a){a=a|0;return 0}function yj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function zj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function Aj(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Bj(a){a=a|0;return}function Cj(a){a=a|0;return 2147483647}function Dj(a){a=a|0;return 2147483647}function Ej(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function Fj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function Gj(a,b){a=a|0;b=b|0;b=i;c[a+0>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;i=b;return}function Hj(a,b){a=a|0;b=b|0;b=i;pf(a,1,45);i=b;return}function Ij(a){a=a|0;return 0}function Jj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function Kj(b,c){b=b|0;c=c|0;a[b]=67109634;a[b+1|0]=262147;a[b+2|0]=1024;a[b+3|0]=4;return}function Lj(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Mj(a){a=a|0;return}function Nj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;d=i;i=i+256|0;l=d;m=d+32|0;n=d+24|0;o=d+16|0;p=d+12|0;q=d+244|0;r=d+20|0;s=d+132|0;t=d+144|0;c[n>>2]=m;u=n+4|0;c[u>>2]=119;v=m+100|0;zf(p,h);m=c[p>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}w=(c[17876>>2]|0)+ -1|0;x=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-x>>2>>>0>w>>>0)){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}m=c[x+(w<<2)>>2]|0;if((m|0)==0){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}a[q]=0;c[r>>2]=c[f>>2];y=c[h+4>>2]|0;c[l+0>>2]=c[r+0>>2];if(Pj(e,l,g,p,y,j,q,m,n,o,v)|0){Cc[c[(c[m>>2]|0)+32>>2]&7](m,17488,17498|0,s)|0;m=c[o>>2]|0;v=c[n>>2]|0;y=m-v|0;if((y|0)>98){g=un(y+2|0)|0;if((g|0)==0){Hn()}else{z=g;A=g}}else{z=0;A=t}if((a[q]|0)==0){B=A}else{a[A]=45;B=A+1|0}if(v>>>0<m>>>0){m=s+10|0;A=s;q=B;g=v;while(1){v=a[g]|0;y=s;while(1){r=y+1|0;if((a[y]|0)==v<<24>>24){C=y;break}if((r|0)==(m|0)){C=m;break}else{y=r}}a[q]=a[17488+(C-A)|0]|0;y=g+1|0;v=q+1|0;if(y>>>0<(c[o>>2]|0)>>>0){q=v;g=y}else{D=v;break}}}else{D=B}a[D]=0;c[l>>2]=k;if((cc(t|0,17504,l|0)|0)!=1){l=Gb(8)|0;Le(l,17512);pc(l|0,14408,11)}if((z|0)!=0){vn(z)}}z=c[e>>2]|0;if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[e>>2]=0;E=0}else{E=z}}else{E=0}z=(E|0)==0;e=c[f>>2]|0;do{if((e|0)!=0){if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){if(z){break}else{F=33;break}}if(!((Ac[c[(c[e>>2]|0)+36>>2]&127](e)|0)==-1)){if(z){break}else{F=33;break}}else{c[f>>2]=0;F=31;break}}else{F=31}}while(0);if((F|0)==31?z:0){F=33}if((F|0)==33){c[j>>2]=c[j>>2]|2}c[b>>2]=E;Fe(c[p>>2]|0)|0;p=c[n>>2]|0;c[n>>2]=0;if((p|0)==0){i=d;return}yc[c[u>>2]&127](p);i=d;return}function Oj(a){a=a|0;return}function Pj(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0;q=i;i=i+480|0;r=q+72|0;s=q+68|0;t=q+472|0;u=q+473|0;v=q+56|0;w=q+44|0;x=q+28|0;y=q+16|0;z=q+4|0;A=q;B=q+40|0;c[s>>2]=0;c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;c[x+0>>2]=0;c[x+4>>2]=0;c[x+8>>2]=0;c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;c[z+0>>2]=0;c[z+4>>2]=0;c[z+8>>2]=0;Tj(g,h,s,t,u,v,w,x,y,A);c[o>>2]=c[n>>2];h=m+8|0;m=y+1|0;g=y+4|0;C=y+8|0;D=x+1|0;E=x+4|0;F=x+8|0;G=(j&512|0)!=0;j=w+1|0;H=w+8|0;I=w+4|0;J=z+1|0;K=z+8|0;L=z+4|0;M=s+3|0;N=n+4|0;O=v+4|0;P=r+400|0;Q=r;R=r;r=p;p=0;S=0;T=119;a:while(1){U=c[e>>2]|0;do{if((U|0)!=0){if((c[U+12>>2]|0)==(c[U+16>>2]|0)){if((Ac[c[(c[U>>2]|0)+36>>2]&127](U)|0)==-1){c[e>>2]=0;V=0;break}else{V=c[e>>2]|0;break}}else{V=U}}else{V=0}}while(0);U=(V|0)==0;W=c[f>>2]|0;do{if((W|0)!=0){if((c[W+12>>2]|0)!=(c[W+16>>2]|0)){if(U){X=W;break}else{Y=R;Z=Q;_=S;$=T;aa=269;break a}}if(!((Ac[c[(c[W>>2]|0)+36>>2]&127](W)|0)==-1)){if(U){X=W;break}else{Y=R;Z=Q;_=S;$=T;aa=269;break a}}else{c[f>>2]=0;aa=12;break}}else{aa=12}}while(0);if((aa|0)==12){aa=0;if(U){Y=R;Z=Q;_=S;$=T;aa=269;break}else{X=0}}b:do{switch(a[s+p|0]|0){case 4:{W=r;ba=Q;ca=P;da=R;ea=0;fa=T;c:while(1){ga=c[e>>2]|0;do{if((ga|0)!=0){if((c[ga+12>>2]|0)==(c[ga+16>>2]|0)){if((Ac[c[(c[ga>>2]|0)+36>>2]&127](ga)|0)==-1){c[e>>2]=0;ha=0;break}else{ha=c[e>>2]|0;break}}else{ha=ga}}else{ha=0}}while(0);ga=(ha|0)==0;ia=c[f>>2]|0;do{if((ia|0)!=0){if((c[ia+12>>2]|0)!=(c[ia+16>>2]|0)){if(ga){break}else{break c}}if(!((Ac[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)==-1)){if(ga){break}else{break c}}else{c[f>>2]=0;aa=173;break}}else{aa=173}}while(0);if((aa|0)==173?(aa=0,ga):0){break}ia=c[e>>2]|0;ja=c[ia+12>>2]|0;if((ja|0)==(c[ia+16>>2]|0)){ka=Ac[c[(c[ia>>2]|0)+36>>2]&127](ia)|0}else{ka=d[ja]|0}ja=ka&255;if(ja<<24>>24>-1?!((b[(c[h>>2]|0)+(ka<<24>>24<<1)>>1]&2048)==0):0){ia=c[o>>2]|0;if((ia|0)==(W|0)){la=(c[N>>2]|0)!=119;ma=c[n>>2]|0;na=W-ma|0;oa=na>>>0<2147483647?na<<1:-1;pa=xn(la?ma:0,oa)|0;if((pa|0)==0){aa=182;break a}if(!la){la=c[n>>2]|0;c[n>>2]=pa;if((la|0)==0){qa=pa}else{yc[c[N>>2]&127](la);qa=c[n>>2]|0}}else{c[n>>2]=pa;qa=pa}c[N>>2]=112;pa=qa+na|0;c[o>>2]=pa;ra=pa;sa=(c[n>>2]|0)+oa|0}else{ra=ia;sa=W}c[o>>2]=ra+1;a[ra]=ja;ta=sa;ua=da;va=ba;wa=ca;xa=ea+1|0;ya=fa}else{ia=a[v]|0;if((ia&1)==0){za=(ia&255)>>>1}else{za=c[O>>2]|0}if((za|0)==0|(ea|0)==0){break}if(!(ja<<24>>24==(a[u]|0))){break}if((ba|0)==(ca|0)){ja=ba-da|0;ia=ja>>>0<2147483647?ja<<1:-1;if((fa|0)==119){Aa=0}else{Aa=da}oa=xn(Aa,ia)|0;if((oa|0)==0){aa=198;break a}Ba=oa+(ja>>2<<2)|0;Ca=oa;Da=oa+(ia>>>2<<2)|0;Ea=112}else{Ba=ba;Ca=da;Da=ca;Ea=fa}c[Ba>>2]=ea;ta=W;ua=Ca;va=Ba+4|0;wa=Da;xa=0;ya=Ea}ia=c[e>>2]|0;oa=ia+12|0;ja=c[oa>>2]|0;if((ja|0)==(c[ia+16>>2]|0)){Ac[c[(c[ia>>2]|0)+40>>2]&127](ia)|0;W=ta;ba=va;ca=wa;da=ua;ea=xa;fa=ya;continue}else{c[oa>>2]=ja+1;W=ta;ba=va;ca=wa;da=ua;ea=xa;fa=ya;continue}}if((da|0)==(ba|0)|(ea|0)==0){Fa=da;Ga=ba;Ha=ca;Ia=fa}else{if((ba|0)==(ca|0)){ja=ba-da|0;oa=ja>>>0<2147483647?ja<<1:-1;if((fa|0)==119){Ja=0}else{Ja=da}ia=xn(Ja,oa)|0;if((ia|0)==0){aa=209;break a}Ka=ia+(ja>>2<<2)|0;La=ia;Ma=ia+(oa>>>2<<2)|0;Na=112}else{Ka=ba;La=da;Ma=ca;Na=fa}c[Ka>>2]=ea;Fa=La;Ga=Ka+4|0;Ha=Ma;Ia=Na}oa=c[A>>2]|0;if((oa|0)>0){ia=c[e>>2]|0;do{if((ia|0)!=0){if((c[ia+12>>2]|0)==(c[ia+16>>2]|0)){if((Ac[c[(c[ia>>2]|0)+36>>2]&127](ia)|0)==-1){c[e>>2]=0;Oa=0;break}else{Oa=c[e>>2]|0;break}}else{Oa=ia}}else{Oa=0}}while(0);ia=(Oa|0)==0;ea=c[f>>2]|0;do{if((ea|0)!=0){if((c[ea+12>>2]|0)!=(c[ea+16>>2]|0)){if(ia){Pa=ea;break}else{aa=229;break a}}if(!((Ac[c[(c[ea>>2]|0)+36>>2]&127](ea)|0)==-1)){if(ia){Pa=ea;break}else{aa=229;break a}}else{c[f>>2]=0;aa=223;break}}else{aa=223}}while(0);if((aa|0)==223){aa=0;if(ia){aa=229;break a}else{Pa=0}}ea=c[e>>2]|0;fa=c[ea+12>>2]|0;if((fa|0)==(c[ea+16>>2]|0)){Qa=Ac[c[(c[ea>>2]|0)+36>>2]&127](ea)|0}else{Qa=d[fa]|0}if(!((Qa&255)<<24>>24==(a[t]|0))){aa=229;break a}fa=c[e>>2]|0;ea=fa+12|0;ca=c[ea>>2]|0;if((ca|0)==(c[fa+16>>2]|0)){Ac[c[(c[fa>>2]|0)+40>>2]&127](fa)|0;Ra=Pa;Sa=Pa;Ta=W;Ua=oa}else{c[ea>>2]=ca+1;Ra=Pa;Sa=Pa;Ta=W;Ua=oa}while(1){ca=c[e>>2]|0;do{if((ca|0)!=0){if((c[ca+12>>2]|0)==(c[ca+16>>2]|0)){if((Ac[c[(c[ca>>2]|0)+36>>2]&127](ca)|0)==-1){c[e>>2]=0;Va=0;break}else{Va=c[e>>2]|0;break}}else{Va=ca}}else{Va=0}}while(0);ca=(Va|0)==0;do{if((Sa|0)!=0){if((c[Sa+12>>2]|0)!=(c[Sa+16>>2]|0)){if(ca){Wa=Ra;Xa=Sa;break}else{aa=250;break a}}if(!((Ac[c[(c[Sa>>2]|0)+36>>2]&127](Sa)|0)==-1)){if(ca^(Ra|0)==0){Wa=Ra;Xa=Ra;break}else{aa=250;break a}}else{c[f>>2]=0;Ya=0;aa=243;break}}else{Ya=Ra;aa=243}}while(0);if((aa|0)==243){aa=0;if(ca){aa=250;break a}else{Wa=Ya;Xa=0}}ga=c[e>>2]|0;ea=c[ga+12>>2]|0;if((ea|0)==(c[ga+16>>2]|0)){Za=Ac[c[(c[ga>>2]|0)+36>>2]&127](ga)|0}else{Za=d[ea]|0}if(!((Za&255)<<24>>24>-1)){aa=250;break a}if((b[(c[h>>2]|0)+(Za<<24>>24<<1)>>1]&2048)==0){aa=250;break a}ea=c[o>>2]|0;if((ea|0)==(Ta|0)){ga=(c[N>>2]|0)!=119;fa=c[n>>2]|0;da=Ta-fa|0;ba=da>>>0<2147483647?da<<1:-1;ja=xn(ga?fa:0,ba)|0;if((ja|0)==0){aa=253;break a}if(!ga){ga=c[n>>2]|0;c[n>>2]=ja;if((ga|0)==0){_a=ja}else{yc[c[N>>2]&127](ga);_a=c[n>>2]|0}}else{c[n>>2]=ja;_a=ja}c[N>>2]=112;ja=_a+da|0;c[o>>2]=ja;$a=ja;ab=(c[n>>2]|0)+ba|0}else{$a=ea;ab=Ta}ea=c[e>>2]|0;ba=c[ea+12>>2]|0;if((ba|0)==(c[ea+16>>2]|0)){ja=Ac[c[(c[ea>>2]|0)+36>>2]&127](ea)|0;bb=ja;cb=c[o>>2]|0}else{bb=d[ba]|0;cb=$a}c[o>>2]=cb+1;a[cb]=bb;ba=Ua+ -1|0;c[A>>2]=ba;ja=c[e>>2]|0;ea=ja+12|0;da=c[ea>>2]|0;if((da|0)==(c[ja+16>>2]|0)){Ac[c[(c[ja>>2]|0)+40>>2]&127](ja)|0}else{c[ea>>2]=da+1}if((ba|0)>0){Ra=Wa;Sa=Xa;Ta=ab;Ua=ba}else{db=ab;break}}}else{db=W}if((c[o>>2]|0)==(c[n>>2]|0)){aa=267;break a}else{eb=db;fb=Fa;gb=Ga;hb=Ha;ib=S;jb=Ia}break};case 3:{oa=a[x]|0;ia=(oa&1)==0;if(ia){kb=(oa&255)>>>1}else{kb=c[E>>2]|0}ba=a[y]|0;da=(ba&1)==0;if(da){lb=(ba&255)>>>1}else{lb=c[g>>2]|0}if((kb|0)==(0-lb|0)){eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T}else{if(ia){mb=(oa&255)>>>1}else{mb=c[E>>2]|0}if((mb|0)!=0){if(da){nb=(ba&255)>>>1}else{nb=c[g>>2]|0}if((nb|0)!=0){da=c[e>>2]|0;ea=c[da+12>>2]|0;ja=c[da+16>>2]|0;if((ea|0)==(ja|0)){ga=Ac[c[(c[da>>2]|0)+36>>2]&127](da)|0;fa=c[e>>2]|0;ob=ga;pb=a[x]|0;qb=fa;rb=c[fa+12>>2]|0;sb=c[fa+16>>2]|0}else{ob=d[ea]|0;pb=oa;qb=da;rb=ea;sb=ja}ja=qb+12|0;ea=(rb|0)==(sb|0);if((ob&255)<<24>>24==(a[(pb&1)==0?D:c[F>>2]|0]|0)){if(ea){Ac[c[(c[qb>>2]|0)+40>>2]&127](qb)|0}else{c[ja>>2]=rb+1}ja=a[x]|0;if((ja&1)==0){tb=(ja&255)>>>1}else{tb=c[E>>2]|0}eb=r;fb=R;gb=Q;hb=P;ib=tb>>>0>1?x:S;jb=T;break b}if(ea){ub=Ac[c[(c[qb>>2]|0)+36>>2]&127](qb)|0}else{ub=d[rb]|0}if(!((ub&255)<<24>>24==(a[(a[y]&1)==0?m:c[C>>2]|0]|0))){aa=112;break a}ea=c[e>>2]|0;ja=ea+12|0;da=c[ja>>2]|0;if((da|0)==(c[ea+16>>2]|0)){Ac[c[(c[ea>>2]|0)+40>>2]&127](ea)|0}else{c[ja>>2]=da+1}a[l]=1;da=a[y]|0;if((da&1)==0){vb=(da&255)>>>1}else{vb=c[g>>2]|0}eb=r;fb=R;gb=Q;hb=P;ib=vb>>>0>1?y:S;jb=T;break b}}if(ia){wb=(oa&255)>>>1}else{wb=c[E>>2]|0}ia=c[e>>2]|0;da=c[ia+12>>2]|0;ja=(da|0)==(c[ia+16>>2]|0);if((wb|0)==0){if(ja){ea=Ac[c[(c[ia>>2]|0)+36>>2]&127](ia)|0;xb=ea;yb=a[y]|0}else{xb=d[da]|0;yb=ba}if(!((xb&255)<<24>>24==(a[(yb&1)==0?m:c[C>>2]|0]|0))){eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break b}ba=c[e>>2]|0;ea=ba+12|0;fa=c[ea>>2]|0;if((fa|0)==(c[ba+16>>2]|0)){Ac[c[(c[ba>>2]|0)+40>>2]&127](ba)|0}else{c[ea>>2]=fa+1}a[l]=1;fa=a[y]|0;if((fa&1)==0){zb=(fa&255)>>>1}else{zb=c[g>>2]|0}eb=r;fb=R;gb=Q;hb=P;ib=zb>>>0>1?y:S;jb=T;break b}if(ja){ja=Ac[c[(c[ia>>2]|0)+36>>2]&127](ia)|0;Ab=ja;Bb=a[x]|0}else{Ab=d[da]|0;Bb=oa}if(!((Ab&255)<<24>>24==(a[(Bb&1)==0?D:c[F>>2]|0]|0))){a[l]=1;eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break b}oa=c[e>>2]|0;da=oa+12|0;ja=c[da>>2]|0;if((ja|0)==(c[oa+16>>2]|0)){Ac[c[(c[oa>>2]|0)+40>>2]&127](oa)|0}else{c[da>>2]=ja+1}ja=a[x]|0;if((ja&1)==0){Cb=(ja&255)>>>1}else{Cb=c[E>>2]|0}eb=r;fb=R;gb=Q;hb=P;ib=Cb>>>0>1?x:S;jb=T}break};case 2:{if(!((S|0)!=0|p>>>0<2)){if((p|0)==2){Db=(a[M]|0)!=0}else{Db=0}if(!(G|Db)){eb=r;fb=R;gb=Q;hb=P;ib=0;jb=T;break b}}ja=a[w]|0;da=(ja&1)==0;oa=da?j:c[H>>2]|0;d:do{if((p|0)!=0?(d[s+(p+ -1)|0]|0)<2:0){ia=oa+(da?(ja&255)>>>1:c[I>>2]|0)|0;fa=oa;while(1){if((fa|0)==(ia|0)){Eb=ia;break}ea=a[fa]|0;if(!(ea<<24>>24>-1)){Eb=fa;break}if((b[(c[h>>2]|0)+(ea<<24>>24<<1)>>1]&8192)==0){Eb=fa;break}else{fa=fa+1|0}}fa=Eb-oa|0;ia=a[z]|0;ca=(ia&1)==0;if(ca){Fb=(ia&255)>>>1}else{Fb=c[L>>2]|0}if(!(fa>>>0>Fb>>>0)){if(ca){ca=(ia&255)>>>1;Gb=J;Hb=ca;Ib=z+(ca-fa)+1|0}else{ca=c[K>>2]|0;ia=c[L>>2]|0;Gb=ca;Hb=ia;Ib=ca+(ia-fa)|0}fa=Gb+Hb|0;if((Ib|0)==(fa|0)){Jb=X;Kb=ja;Lb=Eb;Mb=X}else{ia=Ib;ca=oa;while(1){if((a[ia]|0)!=(a[ca]|0)){Jb=X;Kb=ja;Lb=oa;Mb=X;break d}ea=ia+1|0;if((ea|0)==(fa|0)){Jb=X;Kb=ja;Lb=Eb;Mb=X;break}else{ia=ea;ca=ca+1|0}}}}else{Jb=X;Kb=ja;Lb=oa;Mb=X}}else{Jb=X;Kb=ja;Lb=oa;Mb=X}}while(0);e:while(1){if((Kb&1)==0){Nb=j;Ob=(Kb&255)>>>1}else{Nb=c[H>>2]|0;Ob=c[I>>2]|0}if((Lb|0)==(Nb+Ob|0)){break}oa=c[e>>2]|0;do{if((oa|0)!=0){if((c[oa+12>>2]|0)==(c[oa+16>>2]|0)){if((Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0)==-1){c[e>>2]=0;Pb=0;break}else{Pb=c[e>>2]|0;break}}else{Pb=oa}}else{Pb=0}}while(0);oa=(Pb|0)==0;do{if((Mb|0)!=0){if((c[Mb+12>>2]|0)!=(c[Mb+16>>2]|0)){if(oa){Qb=Jb;Rb=Mb;break}else{break e}}if(!((Ac[c[(c[Mb>>2]|0)+36>>2]&127](Mb)|0)==-1)){if(oa^(Jb|0)==0){Qb=Jb;Rb=Jb;break}else{break e}}else{c[f>>2]=0;Sb=0;aa=147;break}}else{Sb=Jb;aa=147}}while(0);if((aa|0)==147){aa=0;if(oa){break}else{Qb=Sb;Rb=0}}ja=c[e>>2]|0;da=c[ja+12>>2]|0;if((da|0)==(c[ja+16>>2]|0)){Tb=Ac[c[(c[ja>>2]|0)+36>>2]&127](ja)|0}else{Tb=d[da]|0}if(!((Tb&255)<<24>>24==(a[Lb]|0))){break}da=c[e>>2]|0;ja=da+12|0;W=c[ja>>2]|0;if((W|0)==(c[da+16>>2]|0)){Ac[c[(c[da>>2]|0)+40>>2]&127](da)|0}else{c[ja>>2]=W+1}Jb=Qb;Kb=a[w]|0;Lb=Lb+1|0;Mb=Rb}if(G){W=a[w]|0;if((W&1)==0){Ub=j;Vb=(W&255)>>>1}else{Ub=c[H>>2]|0;Vb=c[I>>2]|0}if((Lb|0)!=(Ub+Vb|0)){aa=162;break a}else{eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T}}else{eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T}break};case 1:{if((p|0)==3){Y=R;Z=Q;_=S;$=T;aa=269;break a}W=c[e>>2]|0;ja=c[W+12>>2]|0;if((ja|0)==(c[W+16>>2]|0)){Wb=Ac[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{Wb=d[ja]|0}if(!((Wb&255)<<24>>24>-1)){aa=25;break a}if((b[(c[h>>2]|0)+(Wb<<24>>24<<1)>>1]&8192)==0){aa=25;break a}ja=c[e>>2]|0;W=ja+12|0;da=c[W>>2]|0;if((da|0)==(c[ja+16>>2]|0)){Xb=Ac[c[(c[ja>>2]|0)+40>>2]&127](ja)|0}else{c[W>>2]=da+1;Xb=d[da]|0}kf(z,Xb&255);aa=26;break};case 0:{aa=26;break};default:{eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T}}}while(0);f:do{if((aa|0)==26){aa=0;if((p|0)==3){Y=R;Z=Q;_=S;$=T;aa=269;break a}else{Yb=X;Zb=X}while(1){U=c[e>>2]|0;do{if((U|0)!=0){if((c[U+12>>2]|0)==(c[U+16>>2]|0)){if((Ac[c[(c[U>>2]|0)+36>>2]&127](U)|0)==-1){c[e>>2]=0;_b=0;break}else{_b=c[e>>2]|0;break}}else{_b=U}}else{_b=0}}while(0);U=(_b|0)==0;do{if((Zb|0)!=0){if((c[Zb+12>>2]|0)!=(c[Zb+16>>2]|0)){if(U){$b=Yb;ac=Zb;break}else{eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break f}}if(!((Ac[c[(c[Zb>>2]|0)+36>>2]&127](Zb)|0)==-1)){if(U^(Yb|0)==0){$b=Yb;ac=Yb;break}else{eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break f}}else{c[f>>2]=0;bc=0;aa=37;break}}else{bc=Yb;aa=37}}while(0);if((aa|0)==37){aa=0;if(U){eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break f}else{$b=bc;ac=0}}oa=c[e>>2]|0;da=c[oa+12>>2]|0;if((da|0)==(c[oa+16>>2]|0)){cc=Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0}else{cc=d[da]|0}if(!((cc&255)<<24>>24>-1)){eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break f}if((b[(c[h>>2]|0)+(cc<<24>>24<<1)>>1]&8192)==0){eb=r;fb=R;gb=Q;hb=P;ib=S;jb=T;break f}da=c[e>>2]|0;oa=da+12|0;W=c[oa>>2]|0;if((W|0)==(c[da+16>>2]|0)){dc=Ac[c[(c[da>>2]|0)+40>>2]&127](da)|0}else{c[oa>>2]=W+1;dc=d[W]|0}kf(z,dc&255);Yb=$b;Zb=ac}}}while(0);W=p+1|0;if(W>>>0<4){P=hb;Q=gb;R=fb;r=eb;p=W;S=ib;T=jb}else{Y=fb;Z=gb;_=ib;$=jb;aa=269;break}}g:do{if((aa|0)==25){c[k>>2]=c[k>>2]|4;ec=0;fc=R;gc=T}else if((aa|0)==112){c[k>>2]=c[k>>2]|4;ec=0;fc=R;gc=T}else if((aa|0)==162){c[k>>2]=c[k>>2]|4;ec=0;fc=R;gc=T}else if((aa|0)==182){Hn()}else if((aa|0)==198){Hn()}else if((aa|0)==209){Hn()}else if((aa|0)==229){c[k>>2]=c[k>>2]|4;ec=0;fc=Fa;gc=Ia}else if((aa|0)==250){c[k>>2]=c[k>>2]|4;ec=0;fc=Fa;gc=Ia}else if((aa|0)==253){Hn()}else if((aa|0)==267){c[k>>2]=c[k>>2]|4;ec=0;fc=Fa;gc=Ia}else if((aa|0)==269){h:do{if((_|0)!=0){jb=_+1|0;ib=_+8|0;gb=_+4|0;fb=1;i:while(1){S=a[_]|0;if((S&1)==0){hc=(S&255)>>>1}else{hc=c[gb>>2]|0}if(!(fb>>>0<hc>>>0)){break h}S=c[e>>2]|0;do{if((S|0)!=0){if((c[S+12>>2]|0)==(c[S+16>>2]|0)){if((Ac[c[(c[S>>2]|0)+36>>2]&127](S)|0)==-1){c[e>>2]=0;ic=0;break}else{ic=c[e>>2]|0;break}}else{ic=S}}else{ic=0}}while(0);S=(ic|0)==0;U=c[f>>2]|0;do{if((U|0)!=0){if((c[U+12>>2]|0)!=(c[U+16>>2]|0)){if(S){break}else{break i}}if(!((Ac[c[(c[U>>2]|0)+36>>2]&127](U)|0)==-1)){if(S){break}else{break i}}else{c[f>>2]=0;aa=285;break}}else{aa=285}}while(0);if((aa|0)==285?(aa=0,S):0){break}U=c[e>>2]|0;p=c[U+12>>2]|0;if((p|0)==(c[U+16>>2]|0)){jc=Ac[c[(c[U>>2]|0)+36>>2]&127](U)|0}else{jc=d[p]|0}if((a[_]&1)==0){kc=jb}else{kc=c[ib>>2]|0}if(!((jc&255)<<24>>24==(a[kc+fb|0]|0))){break}p=fb+1|0;U=c[e>>2]|0;eb=U+12|0;r=c[eb>>2]|0;if((r|0)==(c[U+16>>2]|0)){Ac[c[(c[U>>2]|0)+40>>2]&127](U)|0;fb=p;continue}else{c[eb>>2]=r+1;fb=p;continue}}c[k>>2]=c[k>>2]|4;ec=0;fc=Y;gc=$;break g}}while(0);if((Y|0)!=(Z|0)){c[B>>2]=0;Uj(v,Y,Z,B);if((c[B>>2]|0)==0){ec=1;fc=Y;gc=$}else{c[k>>2]=c[k>>2]|4;ec=0;fc=Y;gc=$}}else{ec=1;fc=Z;gc=$}}}while(0);ef(z);ef(y);ef(x);ef(w);ef(v);if((fc|0)==0){i=q;return ec|0}yc[gc&127](fc);i=q;return ec|0}function Qj(a){a=a|0;var b=0;b=Gb(8)|0;Le(b,a);pc(b|0,14408,11)}function Rj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;i=i+144|0;l=d;m=d+40|0;n=d+16|0;o=d+24|0;p=d+28|0;q=d+36|0;r=d+32|0;c[n>>2]=m;s=n+4|0;c[s>>2]=119;t=m+100|0;zf(p,h);m=c[p>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}u=(c[17876>>2]|0)+ -1|0;v=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-v>>2>>>0>u>>>0)){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}m=c[v+(u<<2)>>2]|0;if((m|0)==0){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}a[q]=0;w=c[f>>2]|0;c[r>>2]=w;u=c[h+4>>2]|0;c[l+0>>2]=c[r+0>>2];if(Pj(e,l,g,p,u,j,q,m,n,o,t)|0){if((a[k]&1)==0){a[k+1|0]=0;a[k]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}if((a[q]|0)!=0){kf(k,Lc[c[(c[m>>2]|0)+28>>2]&31](m,45)|0)}q=Lc[c[(c[m>>2]|0)+28>>2]&31](m,48)|0;m=c[n>>2]|0;t=c[o>>2]|0;o=t+ -1|0;a:do{if(m>>>0<o>>>0){u=m;while(1){g=u+1|0;if(!((a[u]|0)==q<<24>>24)){x=u;break a}if(g>>>0<o>>>0){u=g}else{x=g;break}}}else{x=m}}while(0);Sj(k,x,t)|0}t=c[e>>2]|0;if((t|0)!=0){if((c[t+12>>2]|0)==(c[t+16>>2]|0)?(Ac[c[(c[t>>2]|0)+36>>2]&127](t)|0)==-1:0){c[e>>2]=0;y=0}else{y=t}}else{y=0}t=(y|0)==0;do{if((w|0)!=0){if((c[w+12>>2]|0)!=(c[w+16>>2]|0)){if(t){break}else{z=27;break}}if(!((Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0)==-1)){if(t^(w|0)==0){break}else{z=27;break}}else{c[f>>2]=0;z=25;break}}else{z=25}}while(0);if((z|0)==25?t:0){z=27}if((z|0)==27){c[j>>2]=c[j>>2]|2}c[b>>2]=y;Fe(c[p>>2]|0)|0;p=c[n>>2]|0;c[n>>2]=0;if((p|0)==0){i=d;return}yc[c[s>>2]&127](p);i=d;return}function Sj(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;g=d;h=a[b]|0;if((h&1)==0){j=10;k=(h&255)>>>1;l=h}else{h=c[b>>2]|0;j=(h&-2)+ -1|0;k=c[b+4>>2]|0;l=h&255}h=e-g|0;if((e|0)==(d|0)){i=f;return b|0}if((j-k|0)>>>0<h>>>0){nf(b,j,k+h-j|0,k,k,0,0);m=a[b]|0}else{m=l}if((m&1)==0){n=b+1|0}else{n=c[b+8>>2]|0}m=e+(k-g)|0;g=d;d=n+k|0;while(1){a[d]=a[g]|0;g=g+1|0;if((g|0)==(e|0)){break}else{d=d+1|0}}a[n+m|0]=0;m=k+h|0;if((a[b]&1)==0){a[b]=m<<1;i=f;return b|0}else{c[b+4>>2]=m;i=f;return b|0}return 0}function Tj(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+128|0;o=n;p=n+100|0;q=n+88|0;r=n+76|0;s=n+64|0;t=n+104|0;u=n+36|0;v=n+24|0;w=n+12|0;x=n+40|0;y=n+52|0;if(b){b=c[d>>2]|0;if(!((c[4328]|0)==-1)){c[o>>2]=17312;c[o+4>>2]=117;c[o+8>>2]=0;$e(17312,o,118)}z=(c[17316>>2]|0)+ -1|0;A=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-A>>2>>>0>z>>>0)){B=Gb(4)|0;_m(B);pc(B|0,25832,102)}b=c[A+(z<<2)>>2]|0;if((b|0)==0){B=Gb(4)|0;_m(B);pc(B|0,25832,102)}zc[c[(c[b>>2]|0)+44>>2]&63](p,b);B=c[p>>2]|0;a[e]=B;a[e+1|0]=B>>8;a[e+2|0]=B>>16;a[e+3|0]=B>>24;zc[c[(c[b>>2]|0)+32>>2]&63](q,b);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[q+0>>2];c[l+4>>2]=c[q+4>>2];c[l+8>>2]=c[q+8>>2];c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;ef(q);zc[c[(c[b>>2]|0)+28>>2]&63](r,b);if((a[k]&1)==0){a[k+1|0]=0;a[k]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}jf(k,0);c[k+0>>2]=c[r+0>>2];c[k+4>>2]=c[r+4>>2];c[k+8>>2]=c[r+8>>2];c[r+0>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;ef(r);a[f]=Ac[c[(c[b>>2]|0)+12>>2]&127](b)|0;a[g]=Ac[c[(c[b>>2]|0)+16>>2]&127](b)|0;zc[c[(c[b>>2]|0)+20>>2]&63](s,b);if((a[h]&1)==0){a[h+1|0]=0;a[h]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}jf(h,0);c[h+0>>2]=c[s+0>>2];c[h+4>>2]=c[s+4>>2];c[h+8>>2]=c[s+8>>2];c[s+0>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;ef(s);zc[c[(c[b>>2]|0)+24>>2]&63](t,b);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[t+0>>2];c[j+4>>2]=c[t+4>>2];c[j+8>>2]=c[t+8>>2];c[t+0>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;ef(t);C=Ac[c[(c[b>>2]|0)+36>>2]&127](b)|0;c[m>>2]=C;i=n;return}else{b=c[d>>2]|0;if(!((c[4312]|0)==-1)){c[o>>2]=17248;c[o+4>>2]=117;c[o+8>>2]=0;$e(17248,o,118)}o=(c[17252>>2]|0)+ -1|0;d=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-d>>2>>>0>o>>>0)){D=Gb(4)|0;_m(D);pc(D|0,25832,102)}b=c[d+(o<<2)>>2]|0;if((b|0)==0){D=Gb(4)|0;_m(D);pc(D|0,25832,102)}zc[c[(c[b>>2]|0)+44>>2]&63](u,b);D=c[u>>2]|0;a[e]=D;a[e+1|0]=D>>8;a[e+2|0]=D>>16;a[e+3|0]=D>>24;zc[c[(c[b>>2]|0)+32>>2]&63](v,b);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[v+0>>2];c[l+4>>2]=c[v+4>>2];c[l+8>>2]=c[v+8>>2];c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;ef(v);zc[c[(c[b>>2]|0)+28>>2]&63](w,b);if((a[k]&1)==0){a[k+1|0]=0;a[k]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}jf(k,0);c[k+0>>2]=c[w+0>>2];c[k+4>>2]=c[w+4>>2];c[k+8>>2]=c[w+8>>2];c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;ef(w);a[f]=Ac[c[(c[b>>2]|0)+12>>2]&127](b)|0;a[g]=Ac[c[(c[b>>2]|0)+16>>2]&127](b)|0;zc[c[(c[b>>2]|0)+20>>2]&63](x,b);if((a[h]&1)==0){a[h+1|0]=0;a[h]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}jf(h,0);c[h+0>>2]=c[x+0>>2];c[h+4>>2]=c[x+4>>2];c[h+8>>2]=c[x+8>>2];c[x+0>>2]=0;c[x+4>>2]=0;c[x+8>>2]=0;ef(x);zc[c[(c[b>>2]|0)+24>>2]&63](y,b);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[y+0>>2];c[j+4>>2]=c[y+4>>2];c[j+8>>2]=c[y+8>>2];c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;ef(y);C=Ac[c[(c[b>>2]|0)+36>>2]&127](b)|0;c[m>>2]=C;i=n;return}}function Uj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;h=a[b]|0;if((h&1)==0){j=(h&255)>>>1}else{j=c[b+4>>2]|0}if((j|0)==0){i=g;return}if((d|0)!=(e|0)?(j=e+ -4|0,j>>>0>d>>>0):0){k=d;l=j;do{j=c[k>>2]|0;c[k>>2]=c[l>>2];c[l>>2]=j;k=k+4|0;l=l+ -4|0}while(k>>>0<l>>>0);m=a[b]|0}else{m=h}if((m&1)==0){n=b+1|0;o=(m&255)>>>1}else{n=c[b+8>>2]|0;o=c[b+4>>2]|0}b=e+ -4|0;e=a[n]|0;m=e<<24>>24<1|e<<24>>24==127;a:do{if(b>>>0>d>>>0){h=n+o|0;l=e;k=n;j=d;p=m;while(1){if(!p?(l<<24>>24|0)!=(c[j>>2]|0):0){break}q=(h-k|0)>1?k+1|0:k;r=j+4|0;s=a[q]|0;t=s<<24>>24<1|s<<24>>24==127;if(r>>>0<b>>>0){l=s;k=q;j=r;p=t}else{u=s;v=t;break a}}c[f>>2]=4;i=g;return}else{u=e;v=m}}while(0);if(v){i=g;return}v=c[b>>2]|0;if(!(u<<24>>24>>>0<v>>>0|(v|0)==0)){i=g;return}c[f>>2]=4;i=g;return}function Vj(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Wj(a){a=a|0;return}function Xj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;i=i+576|0;l=d;m=d+72|0;n=d+64|0;o=d+60|0;p=d+56|0;q=d+572|0;r=d+12|0;s=d+16|0;t=d+472|0;c[n>>2]=m;u=n+4|0;c[u>>2]=119;v=m+400|0;zf(p,h);m=c[p>>2]|0;if(!((c[4466]|0)==-1)){c[l>>2]=17864;c[l+4>>2]=117;c[l+8>>2]=0;$e(17864,l,118)}w=(c[17868>>2]|0)+ -1|0;x=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-x>>2>>>0>w>>>0)){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}m=c[x+(w<<2)>>2]|0;if((m|0)==0){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}a[q]=0;c[r>>2]=c[f>>2];y=c[h+4>>2]|0;c[l+0>>2]=c[r+0>>2];if(Yj(e,l,g,p,y,j,q,m,n,o,v)|0){Cc[c[(c[m>>2]|0)+48>>2]&7](m,17568,17578|0,s)|0;m=c[o>>2]|0;v=c[n>>2]|0;y=m-v|0;if((y|0)>392){g=un((y>>2)+2|0)|0;if((g|0)==0){Hn()}else{z=g;A=g}}else{z=0;A=t}if((a[q]|0)==0){B=A}else{a[A]=45;B=A+1|0}if(v>>>0<m>>>0){m=s+40|0;A=s;q=B;g=v;while(1){v=c[g>>2]|0;y=s;while(1){r=y+4|0;if((c[y>>2]|0)==(v|0)){C=y;break}if((r|0)==(m|0)){C=m;break}else{y=r}}a[q]=a[17568+(C-A>>2)|0]|0;y=g+4|0;v=q+1|0;if(y>>>0<(c[o>>2]|0)>>>0){q=v;g=y}else{D=v;break}}}else{D=B}a[D]=0;c[l>>2]=k;if((cc(t|0,17504,l|0)|0)!=1){l=Gb(8)|0;Le(l,17512);pc(l|0,14408,11)}if((z|0)!=0){vn(z)}}z=c[e>>2]|0;do{if((z|0)!=0){l=c[z+12>>2]|0;if((l|0)==(c[z+16>>2]|0)){E=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{E=c[l>>2]|0}if((E|0)==-1){c[e>>2]=0;F=1;break}else{F=(c[e>>2]|0)==0;break}}else{F=1}}while(0);E=c[f>>2]|0;do{if((E|0)!=0){z=c[E+12>>2]|0;if((z|0)==(c[E+16>>2]|0)){G=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{G=c[z>>2]|0}if(!((G|0)==-1)){if(F){break}else{H=37;break}}else{c[f>>2]=0;H=35;break}}else{H=35}}while(0);if((H|0)==35?F:0){H=37}if((H|0)==37){c[j>>2]=c[j>>2]|2}c[b>>2]=c[e>>2];Fe(c[p>>2]|0)|0;p=c[n>>2]|0;c[n>>2]=0;if((p|0)==0){i=d;return}yc[c[u>>2]&127](p);i=d;return}function Yj(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0;p=i;i=i+480|0;q=p+80|0;r=p+76|0;s=p+72|0;t=p+68|0;u=p+56|0;v=p+44|0;w=p+28|0;x=p+16|0;y=p+4|0;z=p;A=p+40|0;c[r>>2]=0;c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;c[x+0>>2]=0;c[x+4>>2]=0;c[x+8>>2]=0;c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;$j(f,g,r,s,t,u,v,w,x,z);c[n>>2]=c[m>>2];g=x+4|0;f=x+8|0;B=w+4|0;C=w+8|0;D=(h&512|0)!=0;h=v+4|0;E=v+8|0;F=y+4|0;G=y+8|0;H=r+3|0;I=m+4|0;J=u+4|0;K=q+400|0;L=q;M=q;q=o;o=0;N=0;O=119;a:while(1){P=c[b>>2]|0;do{if((P|0)!=0){Q=c[P+12>>2]|0;if((Q|0)==(c[P+16>>2]|0)){R=Ac[c[(c[P>>2]|0)+36>>2]&127](P)|0}else{R=c[Q>>2]|0}if((R|0)==-1){c[b>>2]=0;S=1;break}else{S=(c[b>>2]|0)==0;break}}else{S=1}}while(0);P=c[e>>2]|0;do{if((P|0)!=0){Q=c[P+12>>2]|0;if((Q|0)==(c[P+16>>2]|0)){T=Ac[c[(c[P>>2]|0)+36>>2]&127](P)|0}else{T=c[Q>>2]|0}if(!((T|0)==-1)){if(S){U=P;break}else{V=M;W=L;X=N;Y=O;Z=292;break a}}else{c[e>>2]=0;Z=15;break}}else{Z=15}}while(0);if((Z|0)==15){Z=0;if(S){V=M;W=L;X=N;Y=O;Z=292;break}else{U=0}}b:do{switch(a[r+o|0]|0){case 3:{P=a[w]|0;Q=(P&1)==0;if(Q){_=(P&255)>>>1}else{_=c[B>>2]|0}$=a[x]|0;aa=($&1)==0;if(aa){ba=($&255)>>>1}else{ba=c[g>>2]|0}if((_|0)==(0-ba|0)){ca=q;da=M;ea=L;fa=K;ga=N;ha=O}else{if(Q){ia=(P&255)>>>1}else{ia=c[B>>2]|0}if((ia|0)!=0){if(aa){ja=($&255)>>>1}else{ja=c[g>>2]|0}if((ja|0)!=0){aa=c[b>>2]|0;ka=c[aa+12>>2]|0;if((ka|0)==(c[aa+16>>2]|0)){la=Ac[c[(c[aa>>2]|0)+36>>2]&127](aa)|0;ma=la;na=a[w]|0}else{ma=c[ka>>2]|0;na=P}ka=c[b>>2]|0;la=ka+12|0;aa=c[la>>2]|0;oa=(aa|0)==(c[ka+16>>2]|0);if((ma|0)==(c[((na&1)==0?B:c[C>>2]|0)>>2]|0)){if(oa){Ac[c[(c[ka>>2]|0)+40>>2]&127](ka)|0}else{c[la>>2]=aa+4}la=a[w]|0;if((la&1)==0){pa=(la&255)>>>1}else{pa=c[B>>2]|0}ca=q;da=M;ea=L;fa=K;ga=pa>>>0>1?w:N;ha=O;break b}if(oa){qa=Ac[c[(c[ka>>2]|0)+36>>2]&127](ka)|0}else{qa=c[aa>>2]|0}if((qa|0)!=(c[((a[x]&1)==0?g:c[f>>2]|0)>>2]|0)){Z=116;break a}aa=c[b>>2]|0;ka=aa+12|0;oa=c[ka>>2]|0;if((oa|0)==(c[aa+16>>2]|0)){Ac[c[(c[aa>>2]|0)+40>>2]&127](aa)|0}else{c[ka>>2]=oa+4}a[k]=1;oa=a[x]|0;if((oa&1)==0){ra=(oa&255)>>>1}else{ra=c[g>>2]|0}ca=q;da=M;ea=L;fa=K;ga=ra>>>0>1?x:N;ha=O;break b}}if(Q){sa=(P&255)>>>1}else{sa=c[B>>2]|0}Q=c[b>>2]|0;oa=c[Q+12>>2]|0;ka=(oa|0)==(c[Q+16>>2]|0);if((sa|0)==0){if(ka){aa=Ac[c[(c[Q>>2]|0)+36>>2]&127](Q)|0;ta=aa;ua=a[x]|0}else{ta=c[oa>>2]|0;ua=$}if((ta|0)!=(c[((ua&1)==0?g:c[f>>2]|0)>>2]|0)){ca=q;da=M;ea=L;fa=K;ga=N;ha=O;break b}$=c[b>>2]|0;aa=$+12|0;la=c[aa>>2]|0;if((la|0)==(c[$+16>>2]|0)){Ac[c[(c[$>>2]|0)+40>>2]&127]($)|0}else{c[aa>>2]=la+4}a[k]=1;la=a[x]|0;if((la&1)==0){va=(la&255)>>>1}else{va=c[g>>2]|0}ca=q;da=M;ea=L;fa=K;ga=va>>>0>1?x:N;ha=O;break b}if(ka){ka=Ac[c[(c[Q>>2]|0)+36>>2]&127](Q)|0;wa=ka;xa=a[w]|0}else{wa=c[oa>>2]|0;xa=P}if((wa|0)!=(c[((xa&1)==0?B:c[C>>2]|0)>>2]|0)){a[k]=1;ca=q;da=M;ea=L;fa=K;ga=N;ha=O;break b}P=c[b>>2]|0;oa=P+12|0;ka=c[oa>>2]|0;if((ka|0)==(c[P+16>>2]|0)){Ac[c[(c[P>>2]|0)+40>>2]&127](P)|0}else{c[oa>>2]=ka+4}ka=a[w]|0;if((ka&1)==0){ya=(ka&255)>>>1}else{ya=c[B>>2]|0}ca=q;da=M;ea=L;fa=K;ga=ya>>>0>1?w:N;ha=O}break};case 2:{if(!((N|0)!=0|o>>>0<2)){if((o|0)==2){za=(a[H]|0)!=0}else{za=0}if(!(D|za)){ca=q;da=M;ea=L;fa=K;ga=0;ha=O;break b}}ka=a[v]|0;oa=(ka&1)==0?h:c[E>>2]|0;c:do{if((o|0)!=0?(d[r+(o+ -1)|0]|0)<2:0){P=ka;Q=oa;while(1){if((P&1)==0){Aa=h;Ba=(P&255)>>>1}else{Aa=c[E>>2]|0;Ba=c[h>>2]|0}if((Q|0)==(Aa+(Ba<<2)|0)){Ca=P;break}if(!(Dc[c[(c[l>>2]|0)+12>>2]&31](l,8192,c[Q>>2]|0)|0)){Z=129;break}P=a[v]|0;Q=Q+4|0}if((Z|0)==129){Z=0;Ca=a[v]|0}P=(Ca&1)==0;la=Q-(P?h:c[E>>2]|0)>>2;aa=a[y]|0;$=(aa&1)==0;if($){Da=(aa&255)>>>1}else{Da=c[F>>2]|0}d:do{if(!(la>>>0>Da>>>0)){if($){Ea=F;Fa=(aa&255)>>>1;Ga=F+(((aa&255)>>>1)-la<<2)|0}else{Ha=c[G>>2]|0;Ia=c[F>>2]|0;Ea=Ha;Fa=Ia;Ga=Ha+(Ia-la<<2)|0}Ia=Ea+(Fa<<2)|0;if((Ga|0)==(Ia|0)){Ja=U;Ka=Ca;La=Q;Ma=U;break c}else{Na=Ga;Oa=P?h:c[E>>2]|0}while(1){if((c[Na>>2]|0)!=(c[Oa>>2]|0)){break d}Ha=Na+4|0;if((Ha|0)==(Ia|0)){Ja=U;Ka=Ca;La=Q;Ma=U;break c}Na=Ha;Oa=Oa+4|0}}}while(0);Ja=U;Ka=Ca;La=P?h:c[E>>2]|0;Ma=U}else{Ja=U;Ka=ka;La=oa;Ma=U}}while(0);e:while(1){if((Ka&1)==0){Pa=h;Qa=(Ka&255)>>>1}else{Pa=c[E>>2]|0;Qa=c[h>>2]|0}if((La|0)==(Pa+(Qa<<2)|0)){break}oa=c[b>>2]|0;do{if((oa|0)!=0){ka=c[oa+12>>2]|0;if((ka|0)==(c[oa+16>>2]|0)){Ra=Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0}else{Ra=c[ka>>2]|0}if((Ra|0)==-1){c[b>>2]=0;Sa=1;break}else{Sa=(c[b>>2]|0)==0;break}}else{Sa=1}}while(0);do{if((Ma|0)!=0){oa=c[Ma+12>>2]|0;if((oa|0)==(c[Ma+16>>2]|0)){Ta=Ac[c[(c[Ma>>2]|0)+36>>2]&127](Ma)|0}else{Ta=c[oa>>2]|0}if(!((Ta|0)==-1)){if(Sa^(Ja|0)==0){Ua=Ja;Va=Ja;break}else{break e}}else{c[e>>2]=0;Wa=0;Z=159;break}}else{Wa=Ja;Z=159}}while(0);if((Z|0)==159){Z=0;if(Sa){break}else{Ua=Wa;Va=0}}oa=c[b>>2]|0;P=c[oa+12>>2]|0;if((P|0)==(c[oa+16>>2]|0)){Xa=Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0}else{Xa=c[P>>2]|0}if((Xa|0)!=(c[La>>2]|0)){break}P=c[b>>2]|0;oa=P+12|0;ka=c[oa>>2]|0;if((ka|0)==(c[P+16>>2]|0)){Ac[c[(c[P>>2]|0)+40>>2]&127](P)|0}else{c[oa>>2]=ka+4}Ja=Ua;Ka=a[v]|0;La=La+4|0;Ma=Va}if(D){ka=a[v]|0;if((ka&1)==0){Ya=h;Za=(ka&255)>>>1}else{Ya=c[E>>2]|0;Za=c[h>>2]|0}if((La|0)!=(Ya+(Za<<2)|0)){Z=174;break a}else{ca=q;da=M;ea=L;fa=K;ga=N;ha=O}}else{ca=q;da=M;ea=L;fa=K;ga=N;ha=O}break};case 4:{ka=q;oa=L;P=K;Q=M;la=0;aa=O;f:while(1){$=c[b>>2]|0;do{if(($|0)!=0){Ia=c[$+12>>2]|0;if((Ia|0)==(c[$+16>>2]|0)){_a=Ac[c[(c[$>>2]|0)+36>>2]&127]($)|0}else{_a=c[Ia>>2]|0}if((_a|0)==-1){c[b>>2]=0;$a=1;break}else{$a=(c[b>>2]|0)==0;break}}else{$a=1}}while(0);$=c[e>>2]|0;do{if(($|0)!=0){Ia=c[$+12>>2]|0;if((Ia|0)==(c[$+16>>2]|0)){ab=Ac[c[(c[$>>2]|0)+36>>2]&127]($)|0}else{ab=c[Ia>>2]|0}if(!((ab|0)==-1)){if($a){break}else{break f}}else{c[e>>2]=0;Z=188;break}}else{Z=188}}while(0);if((Z|0)==188?(Z=0,$a):0){break}$=c[b>>2]|0;Ia=c[$+12>>2]|0;if((Ia|0)==(c[$+16>>2]|0)){bb=Ac[c[(c[$>>2]|0)+36>>2]&127]($)|0}else{bb=c[Ia>>2]|0}if(Dc[c[(c[l>>2]|0)+12>>2]&31](l,2048,bb)|0){Ia=c[n>>2]|0;if((Ia|0)==(ka|0)){$=(c[I>>2]|0)!=119;Ha=c[m>>2]|0;cb=ka-Ha|0;db=cb>>>0<2147483647?cb<<1:-1;eb=cb>>2;if($){fb=Ha}else{fb=0}Ha=xn(fb,db)|0;if((Ha|0)==0){Z=198;break a}if(!$){$=c[m>>2]|0;c[m>>2]=Ha;if(($|0)==0){gb=Ha}else{yc[c[I>>2]&127]($);gb=c[m>>2]|0}}else{c[m>>2]=Ha;gb=Ha}c[I>>2]=112;Ha=gb+(eb<<2)|0;c[n>>2]=Ha;hb=Ha;ib=(c[m>>2]|0)+(db>>>2<<2)|0}else{hb=Ia;ib=ka}c[n>>2]=hb+4;c[hb>>2]=bb;jb=ib;kb=Q;lb=oa;mb=P;nb=la+1|0;ob=aa}else{Ia=a[u]|0;if((Ia&1)==0){pb=(Ia&255)>>>1}else{pb=c[J>>2]|0}if((pb|0)==0|(la|0)==0){break}if((bb|0)!=(c[t>>2]|0)){break}if((oa|0)==(P|0)){Ia=oa-Q|0;db=Ia>>>0<2147483647?Ia<<1:-1;if((aa|0)!=119){qb=Q}else{qb=0}Ha=xn(qb,db)|0;if((Ha|0)==0){Z=214;break a}rb=Ha+(Ia>>2<<2)|0;sb=Ha;tb=Ha+(db>>>2<<2)|0;ub=112}else{rb=oa;sb=Q;tb=P;ub=aa}c[rb>>2]=la;jb=ka;kb=sb;lb=rb+4|0;mb=tb;nb=0;ob=ub}db=c[b>>2]|0;Ha=db+12|0;Ia=c[Ha>>2]|0;if((Ia|0)==(c[db+16>>2]|0)){Ac[c[(c[db>>2]|0)+40>>2]&127](db)|0;ka=jb;oa=lb;P=mb;Q=kb;la=nb;aa=ob;continue}else{c[Ha>>2]=Ia+4;ka=jb;oa=lb;P=mb;Q=kb;la=nb;aa=ob;continue}}if((Q|0)==(oa|0)|(la|0)==0){vb=Q;wb=oa;xb=P;yb=aa}else{if((oa|0)==(P|0)){Ia=oa-Q|0;Ha=Ia>>>0<2147483647?Ia<<1:-1;if((aa|0)!=119){zb=Q}else{zb=0}db=xn(zb,Ha)|0;if((db|0)==0){Z=225;break a}Ab=db+(Ia>>2<<2)|0;Bb=db;Cb=db+(Ha>>>2<<2)|0;Db=112}else{Ab=oa;Bb=Q;Cb=P;Db=aa}c[Ab>>2]=la;vb=Bb;wb=Ab+4|0;xb=Cb;yb=Db}Ha=c[z>>2]|0;if((Ha|0)>0){db=c[b>>2]|0;do{if((db|0)!=0){Ia=c[db+12>>2]|0;if((Ia|0)==(c[db+16>>2]|0)){Eb=Ac[c[(c[db>>2]|0)+36>>2]&127](db)|0}else{Eb=c[Ia>>2]|0}if((Eb|0)==-1){c[b>>2]=0;Fb=1;break}else{Fb=(c[b>>2]|0)==0;break}}else{Fb=1}}while(0);db=c[e>>2]|0;do{if((db|0)!=0){la=c[db+12>>2]|0;if((la|0)==(c[db+16>>2]|0)){Gb=Ac[c[(c[db>>2]|0)+36>>2]&127](db)|0}else{Gb=c[la>>2]|0}if(!((Gb|0)==-1)){if(Fb){Hb=db;break}else{Z=248;break a}}else{c[e>>2]=0;Z=242;break}}else{Z=242}}while(0);if((Z|0)==242){Z=0;if(Fb){Z=248;break a}else{Hb=0}}db=c[b>>2]|0;la=c[db+12>>2]|0;if((la|0)==(c[db+16>>2]|0)){Ib=Ac[c[(c[db>>2]|0)+36>>2]&127](db)|0}else{Ib=c[la>>2]|0}if((Ib|0)!=(c[s>>2]|0)){Z=248;break a}la=c[b>>2]|0;db=la+12|0;aa=c[db>>2]|0;if((aa|0)==(c[la+16>>2]|0)){Ac[c[(c[la>>2]|0)+40>>2]&127](la)|0;Jb=Hb;Kb=Hb;Lb=ka;Mb=Ha}else{c[db>>2]=aa+4;Jb=Hb;Kb=Hb;Lb=ka;Mb=Ha}while(1){aa=c[b>>2]|0;do{if((aa|0)!=0){db=c[aa+12>>2]|0;if((db|0)==(c[aa+16>>2]|0)){Nb=Ac[c[(c[aa>>2]|0)+36>>2]&127](aa)|0}else{Nb=c[db>>2]|0}if((Nb|0)==-1){c[b>>2]=0;Ob=1;break}else{Ob=(c[b>>2]|0)==0;break}}else{Ob=1}}while(0);do{if((Kb|0)!=0){aa=c[Kb+12>>2]|0;if((aa|0)==(c[Kb+16>>2]|0)){Pb=Ac[c[(c[Kb>>2]|0)+36>>2]&127](Kb)|0}else{Pb=c[aa>>2]|0}if(!((Pb|0)==-1)){if(Ob^(Jb|0)==0){Qb=Jb;Rb=Jb;break}else{Z=271;break a}}else{c[e>>2]=0;Sb=0;Z=265;break}}else{Sb=Jb;Z=265}}while(0);if((Z|0)==265){Z=0;if(Ob){Z=271;break a}else{Qb=Sb;Rb=0}}aa=c[b>>2]|0;db=c[aa+12>>2]|0;if((db|0)==(c[aa+16>>2]|0)){Tb=Ac[c[(c[aa>>2]|0)+36>>2]&127](aa)|0}else{Tb=c[db>>2]|0}if(!(Dc[c[(c[l>>2]|0)+12>>2]&31](l,2048,Tb)|0)){Z=271;break a}db=c[n>>2]|0;if((db|0)==(Lb|0)){aa=(c[I>>2]|0)!=119;la=c[m>>2]|0;P=Lb-la|0;Q=P>>>0<2147483647?P<<1:-1;oa=P>>2;if(aa){Ub=la}else{Ub=0}la=xn(Ub,Q)|0;if((la|0)==0){Z=276;break a}if(!aa){aa=c[m>>2]|0;c[m>>2]=la;if((aa|0)==0){Vb=la}else{yc[c[I>>2]&127](aa);Vb=c[m>>2]|0}}else{c[m>>2]=la;Vb=la}c[I>>2]=112;la=Vb+(oa<<2)|0;c[n>>2]=la;Wb=la;Xb=(c[m>>2]|0)+(Q>>>2<<2)|0}else{Wb=db;Xb=Lb}db=c[b>>2]|0;Q=c[db+12>>2]|0;if((Q|0)==(c[db+16>>2]|0)){la=Ac[c[(c[db>>2]|0)+36>>2]&127](db)|0;Yb=la;Zb=c[n>>2]|0}else{Yb=c[Q>>2]|0;Zb=Wb}c[n>>2]=Zb+4;c[Zb>>2]=Yb;Q=Mb+ -1|0;c[z>>2]=Q;la=c[b>>2]|0;db=la+12|0;oa=c[db>>2]|0;if((oa|0)==(c[la+16>>2]|0)){Ac[c[(c[la>>2]|0)+40>>2]&127](la)|0}else{c[db>>2]=oa+4}if((Q|0)>0){Jb=Qb;Kb=Rb;Lb=Xb;Mb=Q}else{_b=Xb;break}}}else{_b=ka}if((c[n>>2]|0)==(c[m>>2]|0)){Z=290;break a}else{ca=_b;da=vb;ea=wb;fa=xb;ga=N;ha=yb}break};case 0:{Z=28;break};case 1:{if((o|0)==3){V=M;W=L;X=N;Y=O;Z=292;break a}Ha=c[b>>2]|0;Q=c[Ha+12>>2]|0;if((Q|0)==(c[Ha+16>>2]|0)){$b=Ac[c[(c[Ha>>2]|0)+36>>2]&127](Ha)|0}else{$b=c[Q>>2]|0}if(!(Dc[c[(c[l>>2]|0)+12>>2]&31](l,8192,$b)|0)){Z=27;break a}Q=c[b>>2]|0;Ha=Q+12|0;oa=c[Ha>>2]|0;if((oa|0)==(c[Q+16>>2]|0)){ac=Ac[c[(c[Q>>2]|0)+40>>2]&127](Q)|0}else{c[Ha>>2]=oa+4;ac=c[oa>>2]|0}uf(y,ac);Z=28;break};default:{ca=q;da=M;ea=L;fa=K;ga=N;ha=O}}}while(0);g:do{if((Z|0)==28){Z=0;if((o|0)==3){V=M;W=L;X=N;Y=O;Z=292;break a}else{bc=U;cc=U}while(1){oa=c[b>>2]|0;do{if((oa|0)!=0){Ha=c[oa+12>>2]|0;if((Ha|0)==(c[oa+16>>2]|0)){dc=Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0}else{dc=c[Ha>>2]|0}if((dc|0)==-1){c[b>>2]=0;ec=1;break}else{ec=(c[b>>2]|0)==0;break}}else{ec=1}}while(0);do{if((cc|0)!=0){oa=c[cc+12>>2]|0;if((oa|0)==(c[cc+16>>2]|0)){fc=Ac[c[(c[cc>>2]|0)+36>>2]&127](cc)|0}else{fc=c[oa>>2]|0}if(!((fc|0)==-1)){if(ec^(bc|0)==0){gc=bc;hc=bc;break}else{ca=q;da=M;ea=L;fa=K;ga=N;ha=O;break g}}else{c[e>>2]=0;ic=0;Z=42;break}}else{ic=bc;Z=42}}while(0);if((Z|0)==42){Z=0;if(ec){ca=q;da=M;ea=L;fa=K;ga=N;ha=O;break g}else{gc=ic;hc=0}}oa=c[b>>2]|0;Ha=c[oa+12>>2]|0;if((Ha|0)==(c[oa+16>>2]|0)){jc=Ac[c[(c[oa>>2]|0)+36>>2]&127](oa)|0}else{jc=c[Ha>>2]|0}if(!(Dc[c[(c[l>>2]|0)+12>>2]&31](l,8192,jc)|0)){ca=q;da=M;ea=L;fa=K;ga=N;ha=O;break g}Ha=c[b>>2]|0;oa=Ha+12|0;Q=c[oa>>2]|0;if((Q|0)==(c[Ha+16>>2]|0)){kc=Ac[c[(c[Ha>>2]|0)+40>>2]&127](Ha)|0}else{c[oa>>2]=Q+4;kc=c[Q>>2]|0}uf(y,kc);bc=gc;cc=hc}}}while(0);ka=o+1|0;if(ka>>>0<4){K=fa;L=ea;M=da;q=ca;o=ka;N=ga;O=ha}else{V=da;W=ea;X=ga;Y=ha;Z=292;break}}h:do{if((Z|0)==27){c[j>>2]=c[j>>2]|4;lc=0;mc=M;nc=O}else if((Z|0)==116){c[j>>2]=c[j>>2]|4;lc=0;mc=M;nc=O}else if((Z|0)==174){c[j>>2]=c[j>>2]|4;lc=0;mc=M;nc=O}else if((Z|0)==198){Hn()}else if((Z|0)==214){Hn()}else if((Z|0)==225){Hn()}else if((Z|0)==248){c[j>>2]=c[j>>2]|4;lc=0;mc=vb;nc=yb}else if((Z|0)==271){c[j>>2]=c[j>>2]|4;lc=0;mc=vb;nc=yb}else if((Z|0)==276){Hn()}else if((Z|0)==290){c[j>>2]=c[j>>2]|4;lc=0;mc=vb;nc=yb}else if((Z|0)==292){i:do{if((X|0)!=0){ha=X+4|0;ga=X+8|0;ea=1;j:while(1){da=a[X]|0;if((da&1)==0){oc=(da&255)>>>1}else{oc=c[ha>>2]|0}if(!(ea>>>0<oc>>>0)){break i}da=c[b>>2]|0;do{if((da|0)!=0){N=c[da+12>>2]|0;if((N|0)==(c[da+16>>2]|0)){pc=Ac[c[(c[da>>2]|0)+36>>2]&127](da)|0}else{pc=c[N>>2]|0}if((pc|0)==-1){c[b>>2]=0;qc=1;break}else{qc=(c[b>>2]|0)==0;break}}else{qc=1}}while(0);da=c[e>>2]|0;do{if((da|0)!=0){N=c[da+12>>2]|0;if((N|0)==(c[da+16>>2]|0)){rc=Ac[c[(c[da>>2]|0)+36>>2]&127](da)|0}else{rc=c[N>>2]|0}if(!((rc|0)==-1)){if(qc){break}else{break j}}else{c[e>>2]=0;Z=311;break}}else{Z=311}}while(0);if((Z|0)==311?(Z=0,qc):0){break}da=c[b>>2]|0;N=c[da+12>>2]|0;if((N|0)==(c[da+16>>2]|0)){sc=Ac[c[(c[da>>2]|0)+36>>2]&127](da)|0}else{sc=c[N>>2]|0}if((a[X]&1)==0){tc=ha}else{tc=c[ga>>2]|0}if((sc|0)!=(c[tc+(ea<<2)>>2]|0)){break}N=ea+1|0;da=c[b>>2]|0;o=da+12|0;ca=c[o>>2]|0;if((ca|0)==(c[da+16>>2]|0)){Ac[c[(c[da>>2]|0)+40>>2]&127](da)|0;ea=N;continue}else{c[o>>2]=ca+4;ea=N;continue}}c[j>>2]=c[j>>2]|4;lc=0;mc=V;nc=Y;break h}}while(0);if((V|0)!=(W|0)){c[A>>2]=0;Uj(u,V,W,A);if((c[A>>2]|0)==0){lc=1;mc=V;nc=Y}else{c[j>>2]=c[j>>2]|4;lc=0;mc=V;nc=Y}}else{lc=1;mc=W;nc=Y}}}while(0);qf(y);qf(x);qf(w);qf(v);ef(u);if((mc|0)==0){i=p;return lc|0}yc[nc&127](mc);i=p;return lc|0}function Zj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+448|0;l=d;m=d+40|0;n=d+16|0;o=d+24|0;p=d+28|0;q=d+440|0;r=d+32|0;c[n>>2]=m;s=n+4|0;c[s>>2]=119;t=m+400|0;zf(p,h);m=c[p>>2]|0;if(!((c[4466]|0)==-1)){c[l>>2]=17864;c[l+4>>2]=117;c[l+8>>2]=0;$e(17864,l,118)}u=(c[17868>>2]|0)+ -1|0;v=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-v>>2>>>0>u>>>0)){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}m=c[v+(u<<2)>>2]|0;if((m|0)==0){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}a[q]=0;w=c[f>>2]|0;c[r>>2]=w;u=c[h+4>>2]|0;c[l+0>>2]=c[r+0>>2];if(Yj(e,l,g,p,u,j,q,m,n,o,t)|0){if((a[k]&1)==0){c[k+4>>2]=0;a[k]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}if((a[q]|0)!=0){uf(k,Lc[c[(c[m>>2]|0)+44>>2]&31](m,45)|0)}q=Lc[c[(c[m>>2]|0)+44>>2]&31](m,48)|0;m=c[n>>2]|0;t=c[o>>2]|0;o=t+ -4|0;a:do{if(m>>>0<o>>>0){u=m;while(1){g=u+4|0;if((c[u>>2]|0)!=(q|0)){x=u;break a}if(g>>>0<o>>>0){u=g}else{x=g;break}}}else{x=m}}while(0);_j(k,x,t)|0}t=c[e>>2]|0;do{if((t|0)!=0){x=c[t+12>>2]|0;if((x|0)==(c[t+16>>2]|0)){y=Ac[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{y=c[x>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;break}else{z=(c[e>>2]|0)==0;break}}else{z=1}}while(0);do{if((w|0)!=0){y=c[w+12>>2]|0;if((y|0)==(c[w+16>>2]|0)){A=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{A=c[y>>2]|0}if(!((A|0)==-1)){if(z){break}else{B=31;break}}else{c[f>>2]=0;B=29;break}}else{B=29}}while(0);if((B|0)==29?z:0){B=31}if((B|0)==31){c[j>>2]=c[j>>2]|2}c[b>>2]=c[e>>2];Fe(c[p>>2]|0)|0;p=c[n>>2]|0;c[n>>2]=0;if((p|0)==0){i=d;return}yc[c[s>>2]&127](p);i=d;return}function _j(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;f=i;g=d;h=a[b]|0;if((h&1)==0){j=1;k=(h&255)>>>1;l=h}else{h=c[b>>2]|0;j=(h&-2)+ -1|0;k=c[b+4>>2]|0;l=h&255}h=e-g>>2;if((h|0)==0){i=f;return b|0}if((j-k|0)>>>0<h>>>0){wf(b,j,k+h-j|0,k,k,0,0);m=a[b]|0}else{m=l}if((m&1)==0){n=b+4|0}else{n=c[b+8>>2]|0}m=n+(k<<2)|0;if((d|0)==(e|0)){o=m}else{l=k+((e+ -4+(0-g)|0)>>>2)+1|0;g=d;d=m;while(1){c[d>>2]=c[g>>2];g=g+4|0;if((g|0)==(e|0)){break}else{d=d+4|0}}o=n+(l<<2)|0}c[o>>2]=0;o=k+h|0;if((a[b]&1)==0){a[b]=o<<1;i=f;return b|0}else{c[b+4>>2]=o;i=f;return b|0}return 0}function $j(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;n=i;i=i+128|0;o=n;p=n+100|0;q=n+88|0;r=n+76|0;s=n+64|0;t=n+104|0;u=n+36|0;v=n+24|0;w=n+12|0;x=n+40|0;y=n+52|0;if(b){b=c[d>>2]|0;if(!((c[4360]|0)==-1)){c[o>>2]=17440;c[o+4>>2]=117;c[o+8>>2]=0;$e(17440,o,118)}z=(c[17444>>2]|0)+ -1|0;A=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-A>>2>>>0>z>>>0)){B=Gb(4)|0;_m(B);pc(B|0,25832,102)}b=c[A+(z<<2)>>2]|0;if((b|0)==0){B=Gb(4)|0;_m(B);pc(B|0,25832,102)}zc[c[(c[b>>2]|0)+44>>2]&63](p,b);B=c[p>>2]|0;a[e]=B;a[e+1|0]=B>>8;a[e+2|0]=B>>16;a[e+3|0]=B>>24;zc[c[(c[b>>2]|0)+32>>2]&63](q,b);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[q+0>>2];c[l+4>>2]=c[q+4>>2];c[l+8>>2]=c[q+8>>2];c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;qf(q);zc[c[(c[b>>2]|0)+28>>2]&63](r,b);if((a[k]&1)==0){c[k+4>>2]=0;a[k]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}tf(k,0);c[k+0>>2]=c[r+0>>2];c[k+4>>2]=c[r+4>>2];c[k+8>>2]=c[r+8>>2];c[r+0>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;qf(r);c[f>>2]=Ac[c[(c[b>>2]|0)+12>>2]&127](b)|0;c[g>>2]=Ac[c[(c[b>>2]|0)+16>>2]&127](b)|0;zc[c[(c[b>>2]|0)+20>>2]&63](s,b);if((a[h]&1)==0){a[h+1|0]=0;a[h]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}jf(h,0);c[h+0>>2]=c[s+0>>2];c[h+4>>2]=c[s+4>>2];c[h+8>>2]=c[s+8>>2];c[s+0>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;ef(s);zc[c[(c[b>>2]|0)+24>>2]&63](t,b);if((a[j]&1)==0){c[j+4>>2]=0;a[j]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}tf(j,0);c[j+0>>2]=c[t+0>>2];c[j+4>>2]=c[t+4>>2];c[j+8>>2]=c[t+8>>2];c[t+0>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;qf(t);C=Ac[c[(c[b>>2]|0)+36>>2]&127](b)|0;c[m>>2]=C;i=n;return}else{b=c[d>>2]|0;if(!((c[4344]|0)==-1)){c[o>>2]=17376;c[o+4>>2]=117;c[o+8>>2]=0;$e(17376,o,118)}o=(c[17380>>2]|0)+ -1|0;d=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-d>>2>>>0>o>>>0)){D=Gb(4)|0;_m(D);pc(D|0,25832,102)}b=c[d+(o<<2)>>2]|0;if((b|0)==0){D=Gb(4)|0;_m(D);pc(D|0,25832,102)}zc[c[(c[b>>2]|0)+44>>2]&63](u,b);D=c[u>>2]|0;a[e]=D;a[e+1|0]=D>>8;a[e+2|0]=D>>16;a[e+3|0]=D>>24;zc[c[(c[b>>2]|0)+32>>2]&63](v,b);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[v+0>>2];c[l+4>>2]=c[v+4>>2];c[l+8>>2]=c[v+8>>2];c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;qf(v);zc[c[(c[b>>2]|0)+28>>2]&63](w,b);if((a[k]&1)==0){c[k+4>>2]=0;a[k]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}tf(k,0);c[k+0>>2]=c[w+0>>2];c[k+4>>2]=c[w+4>>2];c[k+8>>2]=c[w+8>>2];c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;qf(w);c[f>>2]=Ac[c[(c[b>>2]|0)+12>>2]&127](b)|0;c[g>>2]=Ac[c[(c[b>>2]|0)+16>>2]&127](b)|0;zc[c[(c[b>>2]|0)+20>>2]&63](x,b);if((a[h]&1)==0){a[h+1|0]=0;a[h]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}jf(h,0);c[h+0>>2]=c[x+0>>2];c[h+4>>2]=c[x+4>>2];c[h+8>>2]=c[x+8>>2];c[x+0>>2]=0;c[x+4>>2]=0;c[x+8>>2]=0;ef(x);zc[c[(c[b>>2]|0)+24>>2]&63](y,b);if((a[j]&1)==0){c[j+4>>2]=0;a[j]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}tf(j,0);c[j+0>>2]=c[y+0>>2];c[j+4>>2]=c[y+4>>2];c[j+8>>2]=c[y+8>>2];c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;qf(y);C=Ac[c[(c[b>>2]|0)+36>>2]&127](b)|0;c[m>>2]=C;i=n;return}}function ak(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function bk(a){a=a|0;return}function ck(b,d,e,f,g,j,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;d=i;i=i+384|0;m=d;n=d+276|0;o=d+52|0;p=d+176|0;q=d+60|0;r=d+56|0;s=d+376|0;t=d+377|0;u=d+64|0;v=d+32|0;w=d+20|0;x=d+16|0;y=d+76|0;z=d+12|0;A=d+44|0;B=d+48|0;c[o>>2]=n;h[k>>3]=l;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];C=Lb(n|0,100,17624,m|0)|0;if(C>>>0>99){if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}n=c[4440]|0;h[k>>3]=l;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];D=Zh(o,n,17624,m)|0;n=c[o>>2]|0;if((n|0)==0){Hn()}E=un(D)|0;if((E|0)==0){Hn()}else{F=E;G=n;H=E;I=D}}else{F=0;G=0;H=p;I=C}zf(q,g);C=c[q>>2]|0;if(!((c[4468]|0)==-1)){c[m>>2]=17872;c[m+4>>2]=117;c[m+8>>2]=0;$e(17872,m,118)}p=(c[17876>>2]|0)+ -1|0;D=c[C+8>>2]|0;if(!((c[C+12>>2]|0)-D>>2>>>0>p>>>0)){J=Gb(4)|0;_m(J);pc(J|0,25832,102)}C=c[D+(p<<2)>>2]|0;if((C|0)==0){J=Gb(4)|0;_m(J);pc(J|0,25832,102)}J=c[o>>2]|0;Cc[c[(c[C>>2]|0)+32>>2]&7](C,J,J+I|0,H)|0;if((I|0)==0){K=0}else{K=(a[c[o>>2]|0]|0)==45}c[r>>2]=0;c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;dk(f,K,q,r,s,t,u,v,w,x);f=c[x>>2]|0;if((I|0)>(f|0)){x=a[w]|0;if((x&1)==0){L=(x&255)>>>1}else{L=c[w+4>>2]|0}x=a[v]|0;if((x&1)==0){M=(x&255)>>>1}else{M=c[v+4>>2]|0}N=L+(I-f<<1|1)+M|0}else{M=a[w]|0;if((M&1)==0){O=(M&255)>>>1}else{O=c[w+4>>2]|0}M=a[v]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[v+4>>2]|0}N=O+2+P|0}P=N+f|0;if(P>>>0>100){N=un(P)|0;if((N|0)==0){Hn()}else{Q=N;R=N}}else{Q=0;R=y}ek(R,z,A,c[g+4>>2]|0,H,H+I|0,C,K,r,a[s]|0,a[t]|0,u,v,w,f);c[B>>2]=c[e>>2];e=c[z>>2]|0;z=c[A>>2]|0;c[m+0>>2]=c[B+0>>2];Uh(b,m,R,e,z,g,j);if((Q|0)!=0){vn(Q)}ef(w);ef(v);ef(u);Fe(c[q>>2]|0)|0;if((F|0)!=0){vn(F)}if((G|0)==0){i=d;return}vn(G);i=d;return}function dk(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;n=i;i=i+128|0;o=n;p=n+108|0;q=n+96|0;r=n+92|0;s=n+80|0;t=n+68|0;u=n+112|0;v=n+40|0;w=n+28|0;x=n+24|0;y=n+12|0;z=n+44|0;A=n+56|0;B=c[e>>2]|0;if(b){if(!((c[4328]|0)==-1)){c[o>>2]=17312;c[o+4>>2]=117;c[o+8>>2]=0;$e(17312,o,118)}b=(c[17316>>2]|0)+ -1|0;e=c[B+8>>2]|0;if(!((c[B+12>>2]|0)-e>>2>>>0>b>>>0)){C=Gb(4)|0;_m(C);pc(C|0,25832,102)}D=c[e+(b<<2)>>2]|0;if((D|0)==0){C=Gb(4)|0;_m(C);pc(C|0,25832,102)}C=c[D>>2]|0;if(d){zc[c[C+44>>2]&63](p,D);b=c[p>>2]|0;a[f]=b;a[f+1|0]=b>>8;a[f+2|0]=b>>16;a[f+3|0]=b>>24;zc[c[(c[D>>2]|0)+32>>2]&63](q,D);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[q+0>>2];c[l+4>>2]=c[q+4>>2];c[l+8>>2]=c[q+8>>2];c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;ef(q)}else{zc[c[C+40>>2]&63](r,D);C=c[r>>2]|0;a[f]=C;a[f+1|0]=C>>8;a[f+2|0]=C>>16;a[f+3|0]=C>>24;zc[c[(c[D>>2]|0)+28>>2]&63](s,D);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[s+0>>2];c[l+4>>2]=c[s+4>>2];c[l+8>>2]=c[s+8>>2];c[s+0>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;ef(s)}a[g]=Ac[c[(c[D>>2]|0)+12>>2]&127](D)|0;a[h]=Ac[c[(c[D>>2]|0)+16>>2]&127](D)|0;zc[c[(c[D>>2]|0)+20>>2]&63](t,D);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[t+0>>2];c[j+4>>2]=c[t+4>>2];c[j+8>>2]=c[t+8>>2];c[t+0>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;ef(t);zc[c[(c[D>>2]|0)+24>>2]&63](u,D);if((a[k]&1)==0){a[k+1|0]=0;a[k]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}jf(k,0);c[k+0>>2]=c[u+0>>2];c[k+4>>2]=c[u+4>>2];c[k+8>>2]=c[u+8>>2];c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;ef(u);E=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0;c[m>>2]=E;i=n;return}else{if(!((c[4312]|0)==-1)){c[o>>2]=17248;c[o+4>>2]=117;c[o+8>>2]=0;$e(17248,o,118)}o=(c[17252>>2]|0)+ -1|0;D=c[B+8>>2]|0;if(!((c[B+12>>2]|0)-D>>2>>>0>o>>>0)){F=Gb(4)|0;_m(F);pc(F|0,25832,102)}B=c[D+(o<<2)>>2]|0;if((B|0)==0){F=Gb(4)|0;_m(F);pc(F|0,25832,102)}F=c[B>>2]|0;if(d){zc[c[F+44>>2]&63](v,B);d=c[v>>2]|0;a[f]=d;a[f+1|0]=d>>8;a[f+2|0]=d>>16;a[f+3|0]=d>>24;zc[c[(c[B>>2]|0)+32>>2]&63](w,B);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[w+0>>2];c[l+4>>2]=c[w+4>>2];c[l+8>>2]=c[w+8>>2];c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;ef(w)}else{zc[c[F+40>>2]&63](x,B);F=c[x>>2]|0;a[f]=F;a[f+1|0]=F>>8;a[f+2|0]=F>>16;a[f+3|0]=F>>24;zc[c[(c[B>>2]|0)+28>>2]&63](y,B);if((a[l]&1)==0){a[l+1|0]=0;a[l]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}jf(l,0);c[l+0>>2]=c[y+0>>2];c[l+4>>2]=c[y+4>>2];c[l+8>>2]=c[y+8>>2];c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;ef(y)}a[g]=Ac[c[(c[B>>2]|0)+12>>2]&127](B)|0;a[h]=Ac[c[(c[B>>2]|0)+16>>2]&127](B)|0;zc[c[(c[B>>2]|0)+20>>2]&63](z,B);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[z+0>>2];c[j+4>>2]=c[z+4>>2];c[j+8>>2]=c[z+8>>2];c[z+0>>2]=0;c[z+4>>2]=0;c[z+8>>2]=0;ef(z);zc[c[(c[B>>2]|0)+24>>2]&63](A,B);if((a[k]&1)==0){a[k+1|0]=0;a[k]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}jf(k,0);c[k+0>>2]=c[A+0>>2];c[k+4>>2]=c[A+4>>2];c[k+8>>2]=c[A+8>>2];c[A+0>>2]=0;c[A+4>>2]=0;c[A+8>>2]=0;ef(A);E=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0;c[m>>2]=E;i=n;return}}function ek(d,e,f,g,h,j,k,l,m,n,o,p,q,r,s){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;s=s|0;var t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0;t=i;c[f>>2]=d;u=r+1|0;v=r+8|0;w=r+4|0;x=(g&512|0)==0;y=q+1|0;z=q+8|0;A=q+4|0;B=(s|0)>0;C=p+1|0;D=p+8|0;E=p+4|0;F=k+8|0;G=0-s|0;H=h;h=0;while(1){switch(a[m+h|0]|0){case 0:{c[e>>2]=c[f>>2];I=H;break};case 3:{J=a[r]|0;K=(J&1)==0;if(K){L=(J&255)>>>1}else{L=c[w>>2]|0}if((L|0)==0){I=H}else{if(K){M=u}else{M=c[v>>2]|0}K=a[M]|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=K;I=H}break};case 1:{c[e>>2]=c[f>>2];K=Lc[c[(c[k>>2]|0)+28>>2]&31](k,32)|0;J=c[f>>2]|0;c[f>>2]=J+1;a[J]=K;I=H;break};case 4:{K=c[f>>2]|0;J=l?H+1|0:H;a:do{if(J>>>0<j>>>0){N=J;while(1){O=a[N]|0;if(!(O<<24>>24>-1)){P=N;break a}Q=N+1|0;if((b[(c[F>>2]|0)+(O<<24>>24<<1)>>1]&2048)==0){P=N;break a}if(Q>>>0<j>>>0){N=Q}else{P=Q;break}}}else{P=J}}while(0);N=P;if(B){if(P>>>0>J>>>0){Q=J+(0-N)|0;N=Q>>>0<G>>>0?G:Q;Q=N+s|0;O=K;R=P;S=s;while(1){T=R+ -1|0;U=a[T]|0;c[f>>2]=O+1;a[O]=U;U=S+ -1|0;V=(U|0)>0;if(!(T>>>0>J>>>0&V)){break}O=c[f>>2]|0;R=T;S=U}S=P+N|0;if(V){W=S;X=Q;Y=32}else{Z=0;_=S;$=Q}}else{W=P;X=s;Y=32}if((Y|0)==32){Y=0;Z=Lc[c[(c[k>>2]|0)+28>>2]&31](k,48)|0;_=W;$=X}S=c[f>>2]|0;c[f>>2]=S+1;if(($|0)>0){R=S;O=$;while(1){a[R]=Z;U=O+ -1|0;T=c[f>>2]|0;c[f>>2]=T+1;if((U|0)>0){R=T;O=U}else{aa=T;break}}}else{aa=S}a[aa]=n;ba=_}else{ba=P}if((ba|0)==(J|0)){O=Lc[c[(c[k>>2]|0)+28>>2]&31](k,48)|0;R=c[f>>2]|0;c[f>>2]=R+1;a[R]=O}else{O=a[p]|0;R=(O&1)==0;if(R){ca=(O&255)>>>1}else{ca=c[E>>2]|0}if((ca|0)==0){da=ba;ea=-1;fa=0;ga=0}else{if(R){ha=C}else{ha=c[D>>2]|0}da=ba;ea=a[ha]|0;fa=0;ga=0}while(1){if((ga|0)==(ea|0)){R=c[f>>2]|0;c[f>>2]=R+1;a[R]=o;R=fa+1|0;O=a[p]|0;Q=(O&1)==0;if(Q){ia=(O&255)>>>1}else{ia=c[E>>2]|0}if(R>>>0<ia>>>0){if(Q){ja=C}else{ja=c[D>>2]|0}if((a[ja+R|0]|0)==127){ka=-1;la=R;ma=0}else{if(Q){na=C}else{na=c[D>>2]|0}ka=a[na+R|0]|0;la=R;ma=0}}else{ka=ea;la=R;ma=0}}else{ka=ea;la=fa;ma=ga}da=da+ -1|0;R=a[da]|0;Q=c[f>>2]|0;c[f>>2]=Q+1;a[Q]=R;if((da|0)==(J|0)){break}else{ea=ka;fa=la;ga=ma+1|0}}}S=c[f>>2]|0;if((K|0)!=(S|0)?(R=S+ -1|0,R>>>0>K>>>0):0){S=K;Q=R;while(1){R=a[S]|0;a[S]=a[Q]|0;a[Q]=R;R=S+1|0;O=Q+ -1|0;if(R>>>0<O>>>0){S=R;Q=O}else{I=J;break}}}else{I=J}break};case 2:{Q=a[q]|0;S=(Q&1)==0;if(S){oa=(Q&255)>>>1}else{oa=c[A>>2]|0}if((oa|0)==0|x){I=H}else{if(S){pa=y;qa=(Q&255)>>>1}else{pa=c[z>>2]|0;qa=c[A>>2]|0}Q=pa+qa|0;S=c[f>>2]|0;if((pa|0)==(Q|0)){ra=S}else{K=S;S=pa;while(1){a[K]=a[S]|0;O=S+1|0;R=K+1|0;if((O|0)==(Q|0)){ra=R;break}else{K=R;S=O}}}c[f>>2]=ra;I=H}break};default:{I=H}}h=h+1|0;if((h|0)==4){break}else{H=I}}I=a[r]|0;r=(I&1)==0;if(r){sa=(I&255)>>>1}else{sa=c[w>>2]|0}if(sa>>>0>1){if(r){ta=u;ua=(I&255)>>>1}else{ta=c[v>>2]|0;ua=c[w>>2]|0}w=ta+1|0;v=ta+ua|0;ua=c[f>>2]|0;if((w|0)==(v|0)){va=ua}else{ta=ua;ua=w;while(1){a[ta]=a[ua]|0;w=ua+1|0;I=ta+1|0;if((w|0)==(v|0)){va=I;break}else{ta=I;ua=w}}}c[f>>2]=va}va=g&176;if((va|0)==16){i=t;return}else if((va|0)==32){c[e>>2]=c[f>>2];i=t;return}else{c[e>>2]=d;i=t;return}}function fk(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;d=i;i=i+176|0;k=d;l=d+52|0;m=d+56|0;n=d+172|0;o=d+173|0;p=d+40|0;q=d+60|0;r=d+20|0;s=d+16|0;t=d+72|0;u=d+12|0;v=d+32|0;w=d+36|0;zf(l,g);x=c[l>>2]|0;if(!((c[4468]|0)==-1)){c[k>>2]=17872;c[k+4>>2]=117;c[k+8>>2]=0;$e(17872,k,118)}y=(c[17876>>2]|0)+ -1|0;z=c[x+8>>2]|0;if(!((c[x+12>>2]|0)-z>>2>>>0>y>>>0)){A=Gb(4)|0;_m(A);pc(A|0,25832,102)}x=c[z+(y<<2)>>2]|0;if((x|0)==0){A=Gb(4)|0;_m(A);pc(A|0,25832,102)}A=a[j]|0;y=(A&1)==0;if(y){B=(A&255)>>>1}else{B=c[j+4>>2]|0}if((B|0)==0){C=0}else{if(y){D=j+1|0}else{D=c[j+8>>2]|0}y=a[D]|0;C=y<<24>>24==(Lc[c[(c[x>>2]|0)+28>>2]&31](x,45)|0)<<24>>24}c[m>>2]=0;c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[r+0>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;dk(f,C,l,m,n,o,p,q,r,s);f=a[j]|0;y=(f&1)==0;if(y){E=(f&255)>>>1}else{E=c[j+4>>2]|0}D=c[s>>2]|0;if((E|0)>(D|0)){if(y){F=(f&255)>>>1}else{F=c[j+4>>2]|0}y=a[r]|0;if((y&1)==0){G=(y&255)>>>1}else{G=c[r+4>>2]|0}y=a[q]|0;if((y&1)==0){H=(y&255)>>>1}else{H=c[q+4>>2]|0}I=G+(F-D<<1|1)+H|0}else{H=a[r]|0;if((H&1)==0){J=(H&255)>>>1}else{J=c[r+4>>2]|0}H=a[q]|0;if((H&1)==0){K=(H&255)>>>1}else{K=c[q+4>>2]|0}I=J+2+K|0}K=I+D|0;if(K>>>0>100){I=un(K)|0;if((I|0)==0){Hn()}else{L=I;M=I}}else{L=0;M=t}if((f&1)==0){N=j+1|0;O=(f&255)>>>1}else{N=c[j+8>>2]|0;O=c[j+4>>2]|0}ek(M,u,v,c[g+4>>2]|0,N,N+O|0,x,C,m,a[n]|0,a[o]|0,p,q,r,D);c[w>>2]=c[e>>2];e=c[u>>2]|0;u=c[v>>2]|0;c[k+0>>2]=c[w+0>>2];Uh(b,k,M,e,u,g,h);if((L|0)==0){ef(r);ef(q);ef(p);P=c[l>>2]|0;Fe(P)|0;i=d;return}vn(L);ef(r);ef(q);ef(p);P=c[l>>2]|0;Fe(P)|0;i=d;return}function gk(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function hk(a){a=a|0;return}function ik(b,d,e,f,g,j,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;l=+l;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;d=i;i=i+992|0;m=d;n=d+888|0;o=d+872|0;p=d+472|0;q=d+464|0;r=d+460|0;s=d+456|0;t=d+452|0;u=d+876|0;v=d+432|0;w=d+420|0;x=d+416|0;y=d+16|0;z=d+12|0;A=d+444|0;B=d+448|0;c[o>>2]=n;h[k>>3]=l;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];C=Lb(n|0,100,17624,m|0)|0;if(C>>>0>99){if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}n=c[4440]|0;h[k>>3]=l;c[m>>2]=c[k>>2];c[m+4>>2]=c[k+4>>2];D=Zh(o,n,17624,m)|0;n=c[o>>2]|0;if((n|0)==0){Hn()}E=un(D<<2)|0;if((E|0)==0){Hn()}else{F=E;G=n;H=E;I=D}}else{F=0;G=0;H=p;I=C}zf(q,g);C=c[q>>2]|0;if(!((c[4466]|0)==-1)){c[m>>2]=17864;c[m+4>>2]=117;c[m+8>>2]=0;$e(17864,m,118)}p=(c[17868>>2]|0)+ -1|0;D=c[C+8>>2]|0;if(!((c[C+12>>2]|0)-D>>2>>>0>p>>>0)){J=Gb(4)|0;_m(J);pc(J|0,25832,102)}C=c[D+(p<<2)>>2]|0;if((C|0)==0){J=Gb(4)|0;_m(J);pc(J|0,25832,102)}J=c[o>>2]|0;Cc[c[(c[C>>2]|0)+48>>2]&7](C,J,J+I|0,H)|0;if((I|0)==0){K=0}else{K=(a[c[o>>2]|0]|0)==45}c[r>>2]=0;c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;c[v+0>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;jk(f,K,q,r,s,t,u,v,w,x);f=c[x>>2]|0;if((I|0)>(f|0)){x=a[w]|0;if((x&1)==0){L=(x&255)>>>1}else{L=c[w+4>>2]|0}x=a[v]|0;if((x&1)==0){M=(x&255)>>>1}else{M=c[v+4>>2]|0}N=L+(I-f<<1|1)+M|0}else{M=a[w]|0;if((M&1)==0){O=(M&255)>>>1}else{O=c[w+4>>2]|0}M=a[v]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[v+4>>2]|0}N=O+2+P|0}P=N+f|0;if(P>>>0>100){N=un(P<<2)|0;if((N|0)==0){Hn()}else{Q=N;R=N}}else{Q=0;R=y}kk(R,z,A,c[g+4>>2]|0,H,H+(I<<2)|0,C,K,r,c[s>>2]|0,c[t>>2]|0,u,v,w,f);c[B>>2]=c[e>>2];e=c[z>>2]|0;z=c[A>>2]|0;c[m+0>>2]=c[B+0>>2];gi(b,m,R,e,z,g,j);if((Q|0)!=0){vn(Q)}qf(w);qf(v);ef(u);Fe(c[q>>2]|0)|0;if((F|0)!=0){vn(F)}if((G|0)==0){i=d;return}vn(G);i=d;return}function jk(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;n=i;i=i+128|0;o=n;p=n+108|0;q=n+96|0;r=n+92|0;s=n+80|0;t=n+68|0;u=n+112|0;v=n+40|0;w=n+28|0;x=n+24|0;y=n+12|0;z=n+44|0;A=n+56|0;B=c[e>>2]|0;if(b){if(!((c[4360]|0)==-1)){c[o>>2]=17440;c[o+4>>2]=117;c[o+8>>2]=0;$e(17440,o,118)}b=(c[17444>>2]|0)+ -1|0;e=c[B+8>>2]|0;if(!((c[B+12>>2]|0)-e>>2>>>0>b>>>0)){C=Gb(4)|0;_m(C);pc(C|0,25832,102)}D=c[e+(b<<2)>>2]|0;if((D|0)==0){C=Gb(4)|0;_m(C);pc(C|0,25832,102)}C=c[D>>2]|0;if(d){zc[c[C+44>>2]&63](p,D);b=c[p>>2]|0;a[f]=b;a[f+1|0]=b>>8;a[f+2|0]=b>>16;a[f+3|0]=b>>24;zc[c[(c[D>>2]|0)+32>>2]&63](q,D);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[q+0>>2];c[l+4>>2]=c[q+4>>2];c[l+8>>2]=c[q+8>>2];c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;qf(q)}else{zc[c[C+40>>2]&63](r,D);C=c[r>>2]|0;a[f]=C;a[f+1|0]=C>>8;a[f+2|0]=C>>16;a[f+3|0]=C>>24;zc[c[(c[D>>2]|0)+28>>2]&63](s,D);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[s+0>>2];c[l+4>>2]=c[s+4>>2];c[l+8>>2]=c[s+8>>2];c[s+0>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;qf(s)}c[g>>2]=Ac[c[(c[D>>2]|0)+12>>2]&127](D)|0;c[h>>2]=Ac[c[(c[D>>2]|0)+16>>2]&127](D)|0;zc[c[(c[D>>2]|0)+20>>2]&63](t,D);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[t+0>>2];c[j+4>>2]=c[t+4>>2];c[j+8>>2]=c[t+8>>2];c[t+0>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;ef(t);zc[c[(c[D>>2]|0)+24>>2]&63](u,D);if((a[k]&1)==0){c[k+4>>2]=0;a[k]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}tf(k,0);c[k+0>>2]=c[u+0>>2];c[k+4>>2]=c[u+4>>2];c[k+8>>2]=c[u+8>>2];c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;qf(u);E=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0;c[m>>2]=E;i=n;return}else{if(!((c[4344]|0)==-1)){c[o>>2]=17376;c[o+4>>2]=117;c[o+8>>2]=0;$e(17376,o,118)}o=(c[17380>>2]|0)+ -1|0;D=c[B+8>>2]|0;if(!((c[B+12>>2]|0)-D>>2>>>0>o>>>0)){F=Gb(4)|0;_m(F);pc(F|0,25832,102)}B=c[D+(o<<2)>>2]|0;if((B|0)==0){F=Gb(4)|0;_m(F);pc(F|0,25832,102)}F=c[B>>2]|0;if(d){zc[c[F+44>>2]&63](v,B);d=c[v>>2]|0;a[f]=d;a[f+1|0]=d>>8;a[f+2|0]=d>>16;a[f+3|0]=d>>24;zc[c[(c[B>>2]|0)+32>>2]&63](w,B);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[w+0>>2];c[l+4>>2]=c[w+4>>2];c[l+8>>2]=c[w+8>>2];c[w+0>>2]=0;c[w+4>>2]=0;c[w+8>>2]=0;qf(w)}else{zc[c[F+40>>2]&63](x,B);F=c[x>>2]|0;a[f]=F;a[f+1|0]=F>>8;a[f+2|0]=F>>16;a[f+3|0]=F>>24;zc[c[(c[B>>2]|0)+28>>2]&63](y,B);if((a[l]&1)==0){c[l+4>>2]=0;a[l]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}tf(l,0);c[l+0>>2]=c[y+0>>2];c[l+4>>2]=c[y+4>>2];c[l+8>>2]=c[y+8>>2];c[y+0>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;qf(y)}c[g>>2]=Ac[c[(c[B>>2]|0)+12>>2]&127](B)|0;c[h>>2]=Ac[c[(c[B>>2]|0)+16>>2]&127](B)|0;zc[c[(c[B>>2]|0)+20>>2]&63](z,B);if((a[j]&1)==0){a[j+1|0]=0;a[j]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}jf(j,0);c[j+0>>2]=c[z+0>>2];c[j+4>>2]=c[z+4>>2];c[j+8>>2]=c[z+8>>2];c[z+0>>2]=0;c[z+4>>2]=0;c[z+8>>2]=0;ef(z);zc[c[(c[B>>2]|0)+24>>2]&63](A,B);if((a[k]&1)==0){c[k+4>>2]=0;a[k]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}tf(k,0);c[k+0>>2]=c[A+0>>2];c[k+4>>2]=c[A+4>>2];c[k+8>>2]=c[A+8>>2];c[A+0>>2]=0;c[A+4>>2]=0;c[A+8>>2]=0;qf(A);E=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0;c[m>>2]=E;i=n;return}}function kk(b,d,e,f,g,h,j,k,l,m,n,o,p,q,r){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0;s=i;c[e>>2]=b;t=q+4|0;u=q+8|0;v=(f&512|0)==0;w=p+4|0;x=p+8|0;y=(r|0)>0;z=o+1|0;A=o+8|0;B=o+4|0;C=g;g=0;while(1){switch(a[l+g|0]|0){case 1:{c[d>>2]=c[e>>2];D=Lc[c[(c[j>>2]|0)+44>>2]&31](j,32)|0;E=c[e>>2]|0;c[e>>2]=E+4;c[E>>2]=D;F=C;break};case 2:{D=a[p]|0;E=(D&1)==0;if(E){G=(D&255)>>>1}else{G=c[w>>2]|0}if((G|0)==0|v){F=C}else{if(E){H=w;I=(D&255)>>>1}else{H=c[x>>2]|0;I=c[w>>2]|0}D=H+(I<<2)|0;E=c[e>>2]|0;if((H|0)==(D|0)){J=E}else{K=(H+(I+ -1<<2)+(0-H)|0)>>>2;L=E;M=H;while(1){c[L>>2]=c[M>>2];N=M+4|0;if((N|0)==(D|0)){break}L=L+4|0;M=N}J=E+(K+1<<2)|0}c[e>>2]=J;F=C}break};case 3:{M=a[q]|0;L=(M&1)==0;if(L){O=(M&255)>>>1}else{O=c[t>>2]|0}if((O|0)==0){F=C}else{if(L){P=t}else{P=c[u>>2]|0}L=c[P>>2]|0;M=c[e>>2]|0;c[e>>2]=M+4;c[M>>2]=L;F=C}break};case 0:{c[d>>2]=c[e>>2];F=C;break};case 4:{L=c[e>>2]|0;M=k?C+4|0:C;a:do{if(M>>>0<h>>>0){D=M;while(1){N=D+4|0;if(!(Dc[c[(c[j>>2]|0)+12>>2]&31](j,2048,c[D>>2]|0)|0)){Q=D;break a}if(N>>>0<h>>>0){D=N}else{Q=N;break}}}else{Q=M}}while(0);if(y){if(Q>>>0>M>>>0){K=c[e>>2]|0;E=Q;D=r;while(1){R=E+ -4|0;S=K+4|0;c[K>>2]=c[R>>2];T=D+ -1|0;U=(T|0)>0;if(R>>>0>M>>>0&U){K=S;E=R;D=T}else{break}}c[e>>2]=S;if(U){V=R;W=T;X=34}else{D=c[e>>2]|0;c[e>>2]=D+4;Y=D;Z=R}}else{V=Q;W=r;X=34}if((X|0)==34){X=0;D=Lc[c[(c[j>>2]|0)+44>>2]&31](j,48)|0;E=c[e>>2]|0;K=E+4|0;c[e>>2]=K;if((W|0)>0){N=E;_=K;K=W;while(1){c[N>>2]=D;K=K+ -1|0;if((K|0)<=0){break}else{$=_;_=_+4|0;N=$}}c[e>>2]=E+(W+1<<2);Y=E+(W<<2)|0;Z=V}else{Y=E;Z=V}}c[Y>>2]=m;aa=Z}else{aa=Q}if((aa|0)==(M|0)){N=Lc[c[(c[j>>2]|0)+44>>2]&31](j,48)|0;_=c[e>>2]|0;K=_+4|0;c[e>>2]=K;c[_>>2]=N;ba=K}else{K=a[o]|0;N=(K&1)==0;if(N){ca=(K&255)>>>1}else{ca=c[B>>2]|0}if((ca|0)==0){da=aa;ea=-1;fa=0;ga=0}else{if(N){ha=z}else{ha=c[A>>2]|0}da=aa;ea=a[ha]|0;fa=0;ga=0}while(1){N=c[e>>2]|0;if((ga|0)==(ea|0)){K=N+4|0;c[e>>2]=K;c[N>>2]=n;_=fa+1|0;D=a[o]|0;$=(D&1)==0;if($){ia=(D&255)>>>1}else{ia=c[B>>2]|0}if(_>>>0<ia>>>0){if($){ja=z}else{ja=c[A>>2]|0}if((a[ja+_|0]|0)==127){ka=K;la=-1;ma=_;na=0}else{if($){oa=z}else{oa=c[A>>2]|0}ka=K;la=a[oa+_|0]|0;ma=_;na=0}}else{ka=K;la=ea;ma=_;na=0}}else{ka=N;la=ea;ma=fa;na=ga}N=da+ -4|0;_=c[N>>2]|0;K=ka+4|0;c[e>>2]=K;c[ka>>2]=_;if((N|0)==(M|0)){ba=K;break}else{da=N;ea=la;fa=ma;ga=na+1|0}}}if((L|0)!=(ba|0)?(E=ba+ -4|0,E>>>0>L>>>0):0){N=L;K=E;while(1){E=c[N>>2]|0;c[N>>2]=c[K>>2];c[K>>2]=E;E=N+4|0;_=K+ -4|0;if(E>>>0<_>>>0){N=E;K=_}else{F=M;break}}}else{F=M}break};default:{F=C}}g=g+1|0;if((g|0)==4){break}else{C=F}}F=a[q]|0;q=(F&1)==0;if(q){pa=(F&255)>>>1}else{pa=c[t>>2]|0}if(pa>>>0>1){if(q){qa=t;ra=(F&255)>>>1}else{qa=c[u>>2]|0;ra=c[t>>2]|0}t=qa+4|0;u=qa+(ra<<2)|0;F=c[e>>2]|0;if((t|0)==(u|0)){sa=F}else{q=(qa+(ra+ -1<<2)+(0-t)|0)>>>2;ra=F;qa=t;while(1){c[ra>>2]=c[qa>>2];qa=qa+4|0;if((qa|0)==(u|0)){break}else{ra=ra+4|0}}sa=F+(q+1<<2)|0}c[e>>2]=sa}sa=f&176;if((sa|0)==16){i=s;return}else if((sa|0)==32){c[d>>2]=c[e>>2];i=s;return}else{c[d>>2]=b;i=s;return}}function lk(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;d=i;i=i+480|0;k=d;l=d+464|0;m=d+460|0;n=d+456|0;o=d+452|0;p=d+440|0;q=d+468|0;r=d+420|0;s=d+416|0;t=d+16|0;u=d+12|0;v=d+432|0;w=d+436|0;zf(l,g);x=c[l>>2]|0;if(!((c[4466]|0)==-1)){c[k>>2]=17864;c[k+4>>2]=117;c[k+8>>2]=0;$e(17864,k,118)}y=(c[17868>>2]|0)+ -1|0;z=c[x+8>>2]|0;if(!((c[x+12>>2]|0)-z>>2>>>0>y>>>0)){A=Gb(4)|0;_m(A);pc(A|0,25832,102)}x=c[z+(y<<2)>>2]|0;if((x|0)==0){A=Gb(4)|0;_m(A);pc(A|0,25832,102)}A=a[j]|0;y=(A&1)==0;if(y){B=(A&255)>>>1}else{B=c[j+4>>2]|0}if((B|0)==0){C=0}else{if(y){D=j+4|0}else{D=c[j+8>>2]|0}y=c[D>>2]|0;C=(y|0)==(Lc[c[(c[x>>2]|0)+44>>2]&31](x,45)|0)}c[m>>2]=0;c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[r+0>>2]=0;c[r+4>>2]=0;c[r+8>>2]=0;jk(f,C,l,m,n,o,p,q,r,s);f=a[j]|0;y=(f&1)==0;if(y){E=(f&255)>>>1}else{E=c[j+4>>2]|0}D=c[s>>2]|0;if((E|0)>(D|0)){if(y){F=(f&255)>>>1}else{F=c[j+4>>2]|0}y=a[r]|0;if((y&1)==0){G=(y&255)>>>1}else{G=c[r+4>>2]|0}y=a[q]|0;if((y&1)==0){H=(y&255)>>>1}else{H=c[q+4>>2]|0}I=G+(F-D<<1|1)+H|0}else{H=a[r]|0;if((H&1)==0){J=(H&255)>>>1}else{J=c[r+4>>2]|0}H=a[q]|0;if((H&1)==0){K=(H&255)>>>1}else{K=c[q+4>>2]|0}I=J+2+K|0}K=I+D|0;if(K>>>0>100){I=un(K<<2)|0;if((I|0)==0){Hn()}else{L=I;M=I}}else{L=0;M=t}if((f&1)==0){N=j+4|0;O=(f&255)>>>1}else{N=c[j+8>>2]|0;O=c[j+4>>2]|0}kk(M,u,v,c[g+4>>2]|0,N,N+(O<<2)|0,x,C,m,c[n>>2]|0,c[o>>2]|0,p,q,r,D);c[w>>2]=c[e>>2];e=c[u>>2]|0;u=c[v>>2]|0;c[k+0>>2]=c[w+0>>2];gi(b,k,M,e,u,g,h);if((L|0)==0){qf(r);qf(q);ef(p);P=c[l>>2]|0;Fe(P)|0;i=d;return}vn(L);qf(r);qf(q);ef(p);P=c[l>>2]|0;Fe(P)|0;i=d;return}function mk(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function nk(a){a=a|0;return}function ok(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;e=i;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=Bb(f|0,1)|0;i=e;return d>>>((d|0)!=(-1|0)|0)|0}function pk(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=i;i=i+16|0;j=d;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;k=a[h]|0;if((k&1)==0){l=h+1|0;m=(k&255)>>>1;n=h+1|0}else{k=c[h+8>>2]|0;l=k;m=c[h+4>>2]|0;n=k}k=l+m|0;if(n>>>0<k>>>0){m=n;do{kf(j,a[m]|0);m=m+1|0}while((m|0)!=(k|0));k=(e|0)==-1?-1:e<<1;if((a[j]&1)==0){o=k;p=9}else{q=k;r=c[j+8>>2]|0}}else{o=(e|0)==-1?-1:e<<1;p=9}if((p|0)==9){q=o;r=j+1|0}o=dc(q|0,f|0,g|0,r|0)|0;c[b+0>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;r=Un(o|0)|0;g=o+r|0;if((r|0)>0){s=o}else{ef(j);i=d;return}do{kf(b,a[s]|0);s=s+1|0}while((s|0)!=(g|0));ef(j);i=d;return}function qk(a,b){a=a|0;b=b|0;a=i;db(((b|0)==-1?-1:b<<1)|0)|0;i=a;return}function rk(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function sk(a){a=a|0;return}function tk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;e=i;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=Bb(f|0,1)|0;i=e;return d>>>((d|0)!=(-1|0)|0)|0}function uk(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;d=i;i=i+176|0;j=d;k=d+48|0;l=d+8|0;m=d+12|0;n=d+16|0;o=d+32|0;p=d+40|0;c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;c[o+4>>2]=0;c[o>>2]=19528;q=a[h]|0;if((q&1)==0){r=h+4|0;s=(q&255)>>>1;t=h+4|0}else{q=c[h+8>>2]|0;r=q;s=c[h+4>>2]|0;t=q}q=r+(s<<2)|0;s=j;c[s>>2]=0;c[s+4>>2]=0;a:do{if(t>>>0<q>>>0){s=k+32|0;r=t;h=19528|0;while(1){c[m>>2]=r;u=(Sc[c[h+12>>2]&15](o,j,r,q,m,k,s,l)|0)==2;v=c[m>>2]|0;if(u|(v|0)==(r|0)){break}if(k>>>0<(c[l>>2]|0)>>>0){u=k;do{kf(n,a[u]|0);u=u+1|0}while(u>>>0<(c[l>>2]|0)>>>0);w=c[m>>2]|0}else{w=v}if(!(w>>>0<q>>>0)){break a}r=w;h=c[o>>2]|0}Qj(18752)}}while(0);if((a[n]&1)==0){x=n+1|0}else{x=c[n+8>>2]|0}o=dc(((e|0)==-1?-1:e<<1)|0,f|0,g|0,x|0)|0;c[b+0>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;c[p+4>>2]=0;c[p>>2]=19632;x=Un(o|0)|0;g=o+x|0;f=j;c[f>>2]=0;c[f+4>>2]=0;if((x|0)<=0){ef(n);i=d;return}x=g;f=k+128|0;e=o;o=19632|0;while(1){c[m>>2]=e;w=(Sc[c[o+16>>2]&15](p,j,e,(x-e|0)>32?e+32|0:g,m,k,f,l)|0)==2;q=c[m>>2]|0;if(w|(q|0)==(e|0)){y=20;break}if(k>>>0<(c[l>>2]|0)>>>0){w=k;do{uf(b,c[w>>2]|0);w=w+4|0}while(w>>>0<(c[l>>2]|0)>>>0);z=c[m>>2]|0}else{z=q}if(!(z>>>0<g>>>0)){y=25;break}e=z;o=c[p>>2]|0}if((y|0)==20){Qj(18752)}else if((y|0)==25){ef(n);i=d;return}}function vk(a,b){a=a|0;b=b|0;a=i;db(((b|0)==-1?-1:b<<1)|0)|0;i=a;return}function wk(b){b=b|0;var d=0,e=0;d=i;c[b>>2]=17960;e=b+8|0;b=c[e>>2]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}if((b|0)==(c[4440]|0)){i=d;return}pb(c[e>>2]|0);i=d;return}function xk(a){a=a|0;a=Gb(8)|0;Ge(a,17752);c[a>>2]=14328;pc(a|0,14368,9)}function yk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;f=e;c[b+4>>2]=d+ -1;c[b>>2]=17792;d=b+8|0;g=b+12|0;h=b+136|0;j=b+24|0;a[h]=1;c[g>>2]=j;c[d>>2]=j;c[b+16>>2]=h;h=28;k=j;do{if((k|0)==0){l=0}else{c[k>>2]=0;l=c[g>>2]|0}k=l+4|0;c[g>>2]=k;h=h+ -1|0}while((h|0)!=0);cf(b+144|0,17776,1);h=c[d>>2]|0;d=c[g>>2]|0;if((d|0)!=(h|0)){c[g>>2]=d+(~((d+ -4+(0-h)|0)>>>2)<<2)}c[22684>>2]=0;c[5670]=16272;if(!((c[4074]|0)==-1)){c[f>>2]=16296;c[f+4>>2]=117;c[f+8>>2]=0;$e(16296,f,118)}zk(b,22680,(c[16300>>2]|0)+ -1|0);c[22676>>2]=0;c[5668]=16312;if(!((c[4084]|0)==-1)){c[f>>2]=16336;c[f+4>>2]=117;c[f+8>>2]=0;$e(16336,f,118)}zk(b,22672,(c[16340>>2]|0)+ -1|0);c[22660>>2]=0;c[5664]=17888;c[22664>>2]=0;a[22668|0]=0;c[22664>>2]=c[(Db()|0)>>2];if(!((c[4468]|0)==-1)){c[f>>2]=17872;c[f+4>>2]=117;c[f+8>>2]=0;$e(17872,f,118)}zk(b,22656,(c[17876>>2]|0)+ -1|0);c[22652>>2]=0;c[5662]=18848;if(!((c[4466]|0)==-1)){c[f>>2]=17864;c[f+4>>2]=117;c[f+8>>2]=0;$e(17864,f,118)}zk(b,22648,(c[17868>>2]|0)+ -1|0);c[22644>>2]=0;c[5660]=19064;if(!((c[4484]|0)==-1)){c[f>>2]=17936;c[f+4>>2]=117;c[f+8>>2]=0;$e(17936,f,118)}zk(b,22640,(c[17940>>2]|0)+ -1|0);c[22628>>2]=0;c[5656]=17960;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}c[22632>>2]=c[4440];if(!((c[4486]|0)==-1)){c[f>>2]=17944;c[f+4>>2]=117;c[f+8>>2]=0;$e(17944,f,118)}zk(b,22624,(c[17948>>2]|0)+ -1|0);c[22620>>2]=0;c[5654]=19288;if(!((c[4500]|0)==-1)){c[f>>2]=18e3;c[f+4>>2]=117;c[f+8>>2]=0;$e(18e3,f,118)}zk(b,22616,(c[18004>>2]|0)+ -1|0);c[22612>>2]=0;c[5652]=19408;if(!((c[4502]|0)==-1)){c[f>>2]=18008;c[f+4>>2]=117;c[f+8>>2]=0;$e(18008,f,118)}zk(b,22608,(c[18012>>2]|0)+ -1|0);c[22588>>2]=0;c[5646]=18040;a[22592|0]=46;a[22593|0]=44;c[22596>>2]=0;c[22600>>2]=0;c[22604>>2]=0;if(!((c[4504]|0)==-1)){c[f>>2]=18016;c[f+4>>2]=117;c[f+8>>2]=0;$e(18016,f,118)}zk(b,22584,(c[18020>>2]|0)+ -1|0);c[22556>>2]=0;c[5638]=18080;c[22560>>2]=46;c[22564>>2]=44;c[22568>>2]=0;c[22572>>2]=0;c[22576>>2]=0;if(!((c[4506]|0)==-1)){c[f>>2]=18024;c[f+4>>2]=117;c[f+8>>2]=0;$e(18024,f,118)}zk(b,22552,(c[18028>>2]|0)+ -1|0);c[22548>>2]=0;c[5636]=16352;if(!((c[4102]|0)==-1)){c[f>>2]=16408;c[f+4>>2]=117;c[f+8>>2]=0;$e(16408,f,118)}zk(b,22544,(c[16412>>2]|0)+ -1|0);c[22540>>2]=0;c[5634]=16472;if(!((c[4132]|0)==-1)){c[f>>2]=16528;c[f+4>>2]=117;c[f+8>>2]=0;$e(16528,f,118)}zk(b,22536,(c[16532>>2]|0)+ -1|0);c[22532>>2]=0;c[5632]=16544;if(!((c[4148]|0)==-1)){c[f>>2]=16592;c[f+4>>2]=117;c[f+8>>2]=0;$e(16592,f,118)}zk(b,22528,(c[16596>>2]|0)+ -1|0);c[22524>>2]=0;c[5630]=16608;if(!((c[4164]|0)==-1)){c[f>>2]=16656;c[f+4>>2]=117;c[f+8>>2]=0;$e(16656,f,118)}zk(b,22520,(c[16660>>2]|0)+ -1|0);c[22516>>2]=0;c[5628]=17200;if(!((c[4312]|0)==-1)){c[f>>2]=17248;c[f+4>>2]=117;c[f+8>>2]=0;$e(17248,f,118)}zk(b,22512,(c[17252>>2]|0)+ -1|0);c[22508>>2]=0;c[5626]=17264;if(!((c[4328]|0)==-1)){c[f>>2]=17312;c[f+4>>2]=117;c[f+8>>2]=0;$e(17312,f,118)}zk(b,22504,(c[17316>>2]|0)+ -1|0);c[22500>>2]=0;c[5624]=17328;if(!((c[4344]|0)==-1)){c[f>>2]=17376;c[f+4>>2]=117;c[f+8>>2]=0;$e(17376,f,118)}zk(b,22496,(c[17380>>2]|0)+ -1|0);c[22492>>2]=0;c[5622]=17392;if(!((c[4360]|0)==-1)){c[f>>2]=17440;c[f+4>>2]=117;c[f+8>>2]=0;$e(17440,f,118)}zk(b,22488,(c[17444>>2]|0)+ -1|0);c[22484>>2]=0;c[5620]=17456;if(!((c[4370]|0)==-1)){c[f>>2]=17480;c[f+4>>2]=117;c[f+8>>2]=0;$e(17480,f,118)}zk(b,22480,(c[17484>>2]|0)+ -1|0);c[22476>>2]=0;c[5618]=17536;if(!((c[4390]|0)==-1)){c[f>>2]=17560;c[f+4>>2]=117;c[f+8>>2]=0;$e(17560,f,118)}zk(b,22472,(c[17564>>2]|0)+ -1|0);c[22468>>2]=0;c[5616]=17592;if(!((c[4404]|0)==-1)){c[f>>2]=17616;c[f+4>>2]=117;c[f+8>>2]=0;$e(17616,f,118)}zk(b,22464,(c[17620>>2]|0)+ -1|0);c[22460>>2]=0;c[5614]=17640;if(!((c[4416]|0)==-1)){c[f>>2]=17664;c[f+4>>2]=117;c[f+8>>2]=0;$e(17664,f,118)}zk(b,22456,(c[17668>>2]|0)+ -1|0);c[22444>>2]=0;c[5610]=16688;c[22448>>2]=16736;if(!((c[4192]|0)==-1)){c[f>>2]=16768;c[f+4>>2]=117;c[f+8>>2]=0;$e(16768,f,118)}zk(b,22440,(c[16772>>2]|0)+ -1|0);c[22428>>2]=0;c[5606]=16840;c[22432>>2]=16888;if(!((c[4230]|0)==-1)){c[f>>2]=16920;c[f+4>>2]=117;c[f+8>>2]=0;$e(16920,f,118)}zk(b,22424,(c[16924>>2]|0)+ -1|0);c[22412>>2]=0;c[5602]=18784;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}c[22416>>2]=c[4440];c[5602]=17136;if(!((c[4288]|0)==-1)){c[f>>2]=17152;c[f+4>>2]=117;c[f+8>>2]=0;$e(17152,f,118)}zk(b,22408,(c[17156>>2]|0)+ -1|0);c[22396>>2]=0;c[5598]=18784;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}c[22400>>2]=c[4440];c[5598]=17168;if(!((c[4296]|0)==-1)){c[f>>2]=17184;c[f+4>>2]=117;c[f+8>>2]=0;$e(17184,f,118)}zk(b,22392,(c[17188>>2]|0)+ -1|0);c[22388>>2]=0;c[5596]=17680;if(!((c[4426]|0)==-1)){c[f>>2]=17704;c[f+4>>2]=117;c[f+8>>2]=0;$e(17704,f,118)}zk(b,22384,(c[17708>>2]|0)+ -1|0);c[22380>>2]=0;c[5594]=17720;if((c[4436]|0)==-1){m=c[17748>>2]|0;n=m+ -1|0;zk(b,22376,n);i=e;return}c[f>>2]=17744;c[f+4>>2]=117;c[f+8>>2]=0;$e(17744,f,118);m=c[17748>>2]|0;n=m+ -1|0;zk(b,22376,n);i=e;return}function zk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;Ee(b);f=a+8|0;g=a+12|0;a=c[g>>2]|0;h=c[f>>2]|0;j=a-h>>2;do{if(!(j>>>0>d>>>0)){k=d+1|0;if(j>>>0<k>>>0){Dm(f,k-j|0);l=c[f>>2]|0;break}if(j>>>0>k>>>0?(m=h+(k<<2)|0,(a|0)!=(m|0)):0){c[g>>2]=a+(~((a+ -4+(0-m)|0)>>>2)<<2);l=h}else{l=h}}else{l=h}}while(0);h=c[l+(d<<2)>>2]|0;if((h|0)==0){n=l;o=n+(d<<2)|0;c[o>>2]=b;i=e;return}Fe(h)|0;n=c[f>>2]|0;o=n+(d<<2)|0;c[o>>2]=b;i=e;return}function Ak(a){a=a|0;var b=0;b=i;Bk(a);Cn(a);i=b;return}function Bk(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;d=i;c[b>>2]=17792;e=b+12|0;f=c[e>>2]|0;g=b+8|0;h=c[g>>2]|0;if((f|0)!=(h|0)){j=f;f=h;h=0;while(1){k=c[f+(h<<2)>>2]|0;if((k|0)==0){l=j;m=f}else{Fe(k)|0;l=c[e>>2]|0;m=c[g>>2]|0}h=h+1|0;if(!(h>>>0<l-m>>2>>>0)){break}else{j=l;f=m}}}ef(b+144|0);m=c[g>>2]|0;if((m|0)==0){i=d;return}g=c[e>>2]|0;if((g|0)!=(m|0)){c[e>>2]=g+(~((g+ -4+(0-m)|0)>>>2)<<2)}if((b+24|0)==(m|0)){a[b+136|0]=0;i=d;return}else{Cn(m);i=d;return}}function Ck(){var b=0,d=0,e=0;b=i;if((a[17848]|0)!=0){d=c[4460]|0;i=b;return d|0}if((La(17848)|0)==0){d=c[4460]|0;i=b;return d|0}if((a[17824]|0)==0?(La(17824)|0)!=0:0){yk(22216,1);c[4452]=22216;c[4454]=17808;jb(17824)}e=c[c[4454]>>2]|0;c[4458]=e;Ee(e);c[4460]=17832;jb(17848);d=c[4460]|0;i=b;return d|0}function Dk(a){a=a|0;var b=0,d=0;b=i;d=c[(Ck()|0)>>2]|0;c[a>>2]=d;Ee(d);i=b;return}function Ek(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;e=c[b>>2]|0;c[a>>2]=e;Ee(e);i=d;return}function Fk(a){a=a|0;var b=0;b=i;Fe(c[a>>2]|0)|0;i=b;return}function Gk(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;i=i+16|0;e=d;f=c[a>>2]|0;if(!((c[b>>2]|0)==-1)){c[e>>2]=b;c[e+4>>2]=117;c[e+8>>2]=0;$e(b,e,118)}e=(c[b+4>>2]|0)+ -1|0;b=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-b>>2>>>0>e>>>0)){g=Gb(4)|0;_m(g);pc(g|0,25832,102)}f=c[b+(e<<2)>>2]|0;if((f|0)==0){g=Gb(4)|0;_m(g);pc(g|0,25832,102)}else{i=d;return f|0}return 0}function Hk(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Ik(a){a=a|0;var b=0;b=i;if((a|0)==0){i=b;return}yc[c[(c[a>>2]|0)+4>>2]&127](a);i=b;return}function Jk(a){a=a|0;var b=0;b=c[4464]|0;c[4464]=b+1;c[a+4>>2]=b+1;return}function Kk(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Lk(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;a=i;if(!(e>>>0<128)){f=0;i=a;return f|0}f=(b[(c[(Db()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;i=a;return f|0}function Mk(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;a=i;if((d|0)==(e|0)){g=d;i=a;return g|0}else{h=d;j=f}while(1){f=c[h>>2]|0;if(f>>>0<128){k=b[(c[(Db()|0)>>2]|0)+(f<<1)>>1]|0}else{k=0}b[j>>1]=k;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;j=j+2|0}}i=a;return g|0}function Nk(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;a=i;a:do{if((e|0)==(f|0)){g=e}else{h=e;while(1){j=c[h>>2]|0;if(j>>>0<128?!((b[(c[(Db()|0)>>2]|0)+(j<<1)>>1]&d)<<16>>16==0):0){g=h;break a}j=h+4|0;if((j|0)==(f|0)){g=f;break}else{h=j}}}}while(0);i=a;return g|0}function Ok(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;a=i;a:do{if((e|0)==(f|0)){g=e}else{h=e;while(1){j=c[h>>2]|0;if(!(j>>>0<128)){g=h;break a}k=h+4|0;if((b[(c[(Db()|0)>>2]|0)+(j<<1)>>1]&d)<<16>>16==0){g=h;break a}if((k|0)==(f|0)){g=f;break}else{h=k}}}}while(0);i=a;return g|0}function Pk(a,b){a=a|0;b=b|0;var d=0;a=i;if(!(b>>>0<128)){d=b;i=a;return d|0}d=c[(c[(Pa()|0)>>2]|0)+(b<<2)>>2]|0;i=a;return d|0}function Qk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;a=i;if((b|0)==(d|0)){e=b;i=a;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128){g=c[(c[(Pa()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}i=a;return e|0}function Rk(a,b){a=a|0;b=b|0;var d=0;a=i;if(!(b>>>0<128)){d=b;i=a;return d|0}d=c[(c[(hc()|0)>>2]|0)+(b<<2)>>2]|0;i=a;return d|0}function Sk(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;a=i;if((b|0)==(d|0)){e=b;i=a;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128){g=c[(c[(hc()|0)>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}i=a;return e|0}function Tk(a,b){a=a|0;b=b|0;return b<<24>>24|0}function Uk(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;b=i;if((d|0)==(e|0)){g=d;i=b;return g|0}else{h=d;j=f}while(1){c[j>>2]=a[h]|0;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;j=j+4|0}}i=b;return g|0}function Vk(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128?b&255:c)|0}function Wk(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;b=i;if((d|0)==(e|0)){h=d;i=b;return h|0}j=((e+ -4+(0-d)|0)>>>2)+1|0;k=d;l=g;while(1){g=c[k>>2]|0;a[l]=g>>>0<128?g&255:f;k=k+4|0;if((k|0)==(e|0)){break}else{l=l+1|0}}h=d+(j<<2)|0;i=b;return h|0}function Xk(b){b=b|0;var d=0,e=0;d=i;c[b>>2]=17888;e=c[b+8>>2]|0;if((e|0)!=0?(a[b+12|0]|0)!=0:0){Dn(e)}Cn(b);i=d;return}function Yk(b){b=b|0;var d=0,e=0;d=i;c[b>>2]=17888;e=c[b+8>>2]|0;if((e|0)!=0?(a[b+12|0]|0)!=0:0){Dn(e)}i=d;return}function Zk(a,b){a=a|0;b=b|0;var d=0;a=i;if(!(b<<24>>24>-1)){d=b;i=a;return d|0}d=c[(c[(Pa()|0)>>2]|0)+((b&255)<<2)>>2]&255;i=a;return d|0}function _k(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;b=i;if((d|0)==(e|0)){f=d;i=b;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24>-1){h=c[(c[(Pa()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}else{h=d}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}i=b;return f|0}function $k(a,b){a=a|0;b=b|0;var d=0;a=i;if(!(b<<24>>24>-1)){d=b;i=a;return d|0}d=c[(c[(hc()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;i=a;return d|0}function al(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;b=i;if((d|0)==(e|0)){f=d;i=b;return f|0}else{g=d}while(1){d=a[g]|0;if(d<<24>>24>-1){h=c[(c[(hc()|0)>>2]|0)+(d<<24>>24<<2)>>2]&255}else{h=d}a[g]=h;d=g+1|0;if((d|0)==(e|0)){f=e;break}else{g=d}}i=b;return f|0}function bl(a,b){a=a|0;b=b|0;return b|0}function cl(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0;b=i;if((c|0)==(d|0)){f=c}else{g=c;c=e;while(1){a[c]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;c=c+1|0}}}i=b;return f|0}function dl(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24>-1?b:c)|0}function el(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;b=i;if((c|0)==(d|0)){g=c;i=b;return g|0}else{h=c;j=f}while(1){f=a[h]|0;a[j]=f<<24>>24>-1?f:e;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;j=j+1|0}}i=b;return g|0}function fl(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function gl(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function hl(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function il(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function jl(a){a=a|0;return 1}function kl(a){a=a|0;return 1}function ll(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function ml(a){a=a|0;return 1}function nl(a){a=a|0;var b=0;b=i;wk(a);Cn(a);i=b;return}function ol(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+16|0;m=l;n=l+8|0;o=(e|0)==(f|0);a:do{if(!o){p=e;while(1){q=p+4|0;if((c[p>>2]|0)==0){r=p;break}if((q|0)==(f|0)){r=f;break}else{p=q}}c[k>>2]=h;c[g>>2]=e;if(!(o|(h|0)==(j|0))){p=j;q=b+8|0;s=e;t=h;u=r;while(1){v=d;w=c[v+4>>2]|0;x=m;c[x>>2]=c[v>>2];c[x+4>>2]=w;w=Kb(c[q>>2]|0)|0;x=Qm(t,g,u-s>>2,p-t|0,d)|0;if((w|0)!=0){Kb(w|0)|0}if((x|0)==-1){y=10;break}else if((x|0)==0){z=1;y=33;break}w=(c[k>>2]|0)+x|0;c[k>>2]=w;if((w|0)==(j|0)){y=31;break}if((u|0)==(f|0)){A=c[g>>2]|0;B=w;C=f}else{w=Kb(c[q>>2]|0)|0;x=Pm(n,0,d)|0;if((w|0)!=0){Kb(w|0)|0}if((x|0)==-1){z=2;y=33;break}w=c[k>>2]|0;if(x>>>0>(p-w|0)>>>0){z=1;y=33;break}b:do{if((x|0)!=0){v=w;D=x;E=n;while(1){F=a[E]|0;c[k>>2]=v+1;a[v]=F;F=D+ -1|0;if((F|0)==0){break b}v=c[k>>2]|0;D=F;E=E+1|0}}}while(0);x=(c[g>>2]|0)+4|0;c[g>>2]=x;c:do{if((x|0)==(f|0)){G=f}else{w=x;while(1){E=w+4|0;if((c[w>>2]|0)==0){G=w;break c}if((E|0)==(f|0)){G=f;break}else{w=E}}}}while(0);A=x;B=c[k>>2]|0;C=G}if((A|0)==(f|0)|(B|0)==(j|0)){H=A;break a}else{s=A;t=B;u=C}}if((y|0)==10){c[k>>2]=t;d:do{if((s|0)==(c[g>>2]|0)){I=s}else{u=s;p=t;while(1){w=c[u>>2]|0;E=Kb(c[q>>2]|0)|0;D=Pm(p,w,m)|0;if((E|0)!=0){Kb(E|0)|0}if((D|0)==-1){I=u;break d}E=(c[k>>2]|0)+D|0;c[k>>2]=E;D=u+4|0;if((D|0)==(c[g>>2]|0)){I=D;break}else{u=D;p=E}}}}while(0);c[g>>2]=I;z=2;i=l;return z|0}else if((y|0)==31){H=c[g>>2]|0;break}else if((y|0)==33){i=l;return z|0}}else{H=e}}else{c[k>>2]=h;c[g>>2]=e;H=e}}while(0);z=(H|0)!=(f|0)|0;i=l;return z|0}function pl(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;l=i;i=i+16|0;m=l;n=(e|0)==(f|0);a:do{if(!n){o=e;while(1){p=o+1|0;if((a[o]|0)==0){q=o;break}if((p|0)==(f|0)){q=f;break}else{o=p}}c[k>>2]=h;c[g>>2]=e;if(!(n|(h|0)==(j|0))){o=j;p=b+8|0;r=e;s=h;t=q;while(1){u=d;v=c[u+4>>2]|0;w=m;c[w>>2]=c[u>>2];c[w+4>>2]=v;x=t;v=Kb(c[p>>2]|0)|0;w=Mm(s,g,x-r|0,o-s>>2,d)|0;if((v|0)!=0){Kb(v|0)|0}if((w|0)==-1){y=10;break}else if((w|0)==0){z=2;y=32;break}v=(c[k>>2]|0)+(w<<2)|0;c[k>>2]=v;if((v|0)==(j|0)){y=30;break}w=c[g>>2]|0;if((t|0)==(f|0)){A=w;B=v;C=f}else{u=Kb(c[p>>2]|0)|0;D=Lm(v,w,1,d)|0;if((u|0)!=0){Kb(u|0)|0}if((D|0)!=0){z=2;y=32;break}c[k>>2]=(c[k>>2]|0)+4;D=(c[g>>2]|0)+1|0;c[g>>2]=D;b:do{if((D|0)==(f|0)){E=f}else{u=D;while(1){w=u+1|0;if((a[u]|0)==0){E=u;break b}if((w|0)==(f|0)){E=f;break}else{u=w}}}}while(0);A=D;B=c[k>>2]|0;C=E}if((A|0)==(f|0)|(B|0)==(j|0)){F=A;break a}else{r=A;s=B;t=C}}if((y|0)==10){c[k>>2]=s;c:do{if((r|0)!=(c[g>>2]|0)){t=r;o=s;while(1){u=Kb(c[p>>2]|0)|0;w=Lm(o,t,x-t|0,m)|0;if((u|0)!=0){Kb(u|0)|0}if((w|0)==-2){y=16;break}else if((w|0)==-1){y=15;break}else if((w|0)==0){G=t+1|0}else{G=t+w|0}w=(c[k>>2]|0)+4|0;c[k>>2]=w;if((G|0)==(c[g>>2]|0)){H=G;break c}else{t=G;o=w}}if((y|0)==15){c[g>>2]=t;z=2;i=l;return z|0}else if((y|0)==16){c[g>>2]=t;z=1;i=l;return z|0}}else{H=r}}while(0);c[g>>2]=H;z=(H|0)!=(f|0)|0;i=l;return z|0}else if((y|0)==30){F=c[g>>2]|0;break}else if((y|0)==32){i=l;return z|0}}else{F=e}}else{c[k>>2]=h;c[g>>2]=e;F=e}}while(0);z=(F|0)!=(f|0)|0;i=l;return z|0}function ql(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+16|0;j=h;c[g>>2]=e;e=Kb(c[b+8>>2]|0)|0;b=Pm(j,0,d)|0;if((e|0)!=0){Kb(e|0)|0}if((b|0)==0|(b|0)==-1){k=2;i=h;return k|0}e=b+ -1|0;b=c[g>>2]|0;if(e>>>0>(f-b|0)>>>0){k=1;i=h;return k|0}if((e|0)==0){k=0;i=h;return k|0}else{l=b;m=e;n=j}while(1){j=a[n]|0;c[g>>2]=l+1;a[l]=j;j=m+ -1|0;if((j|0)==0){k=0;break}l=c[g>>2]|0;m=j;n=n+1|0}i=h;return k|0}function rl(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a+8|0;a=Kb(c[d>>2]|0)|0;e=Om(0,0,4)|0;if((a|0)!=0){Kb(a|0)|0}if((e|0)==0){e=c[d>>2]|0;if((e|0)!=0){d=Kb(e|0)|0;if((d|0)==0){f=0}else{Kb(d|0)|0;f=0}}else{f=1}}else{f=-1}i=b;return f|0}function sl(a){a=a|0;return 0}function tl(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;if((f|0)==0|(d|0)==(e|0)){h=0;i=g;return h|0}j=e;k=a+8|0;a=d;d=0;l=0;while(1){m=Kb(c[k>>2]|0)|0;n=Km(a,j-a|0,b)|0;if((m|0)!=0){Kb(m|0)|0}if((n|0)==0){o=a+1|0;p=1}else if((n|0)==-2|(n|0)==-1){h=d;q=9;break}else{o=a+n|0;p=n}n=p+d|0;m=l+1|0;if(m>>>0>=f>>>0|(o|0)==(e|0)){h=n;q=9;break}else{a=o;d=n;l=m}}if((q|0)==9){i=g;return h|0}return 0}function ul(a){a=a|0;var b=0,d=0,e=0;b=i;d=c[a+8>>2]|0;if((d|0)!=0){a=Kb(d|0)|0;if((a|0)==0){e=4}else{Kb(a|0)|0;e=4}}else{e=1}i=b;return e|0}function vl(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function wl(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b+4|0;k=b;c[a>>2]=d;c[k>>2]=g;l=xl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function xl(d,f,g,h,j,k,l,m){d=d|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;c[g>>2]=d;c[k>>2]=h;do{if((m&2|0)!=0){if((j-h|0)<3){o=1;i=n;return o|0}else{c[k>>2]=h+1;a[h]=-17;d=c[k>>2]|0;c[k>>2]=d+1;a[d]=-69;d=c[k>>2]|0;c[k>>2]=d+1;a[d]=-65;break}}}while(0);h=f;m=c[g>>2]|0;if(!(m>>>0<f>>>0)){o=0;i=n;return o|0}d=j;j=m;a:while(1){m=b[j>>1]|0;p=m&65535;if(p>>>0>l>>>0){o=2;q=26;break}do{if((m&65535)<128){r=c[k>>2]|0;if((d-r|0)<1){o=1;q=26;break a}c[k>>2]=r+1;a[r]=m}else{if((m&65535)<2048){r=c[k>>2]|0;if((d-r|0)<2){o=1;q=26;break a}c[k>>2]=r+1;a[r]=p>>>6|192;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p&63|128;break}if((m&65535)<55296){r=c[k>>2]|0;if((d-r|0)<3){o=1;q=26;break a}c[k>>2]=r+1;a[r]=p>>>12|224;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p>>>6&63|128;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p&63|128;break}if(!((m&65535)<56320)){if((m&65535)<57344){o=2;q=26;break a}r=c[k>>2]|0;if((d-r|0)<3){o=1;q=26;break a}c[k>>2]=r+1;a[r]=p>>>12|224;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p>>>6&63|128;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p&63|128;break}if((h-j|0)<4){o=1;q=26;break a}r=j+2|0;s=e[r>>1]|0;if((s&64512|0)!=56320){o=2;q=26;break a}if((d-(c[k>>2]|0)|0)<4){o=1;q=26;break a}t=p&960;if(((t<<10)+65536|p<<10&64512|s&1023)>>>0>l>>>0){o=2;q=26;break a}c[g>>2]=r;r=(t>>>6)+1|0;t=c[k>>2]|0;c[k>>2]=t+1;a[t]=r>>>2|240;t=c[k>>2]|0;c[k>>2]=t+1;a[t]=p>>>2&15|r<<4&48|128;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=p<<4&48|s>>>6&15|128;r=c[k>>2]|0;c[k>>2]=r+1;a[r]=s&63|128}}while(0);p=(c[g>>2]|0)+2|0;c[g>>2]=p;if(p>>>0<f>>>0){j=p}else{o=0;q=26;break}}if((q|0)==26){i=n;return o|0}return 0}function yl(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b+4|0;k=b;c[a>>2]=d;c[k>>2]=g;l=zl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=b;return l|0}function zl(e,f,g,h,j,k,l,m){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;n=i;c[g>>2]=e;c[k>>2]=h;h=c[g>>2]|0;if(((((m&4|0)!=0?(f-h|0)>2:0)?(a[h]|0)==-17:0)?(a[h+1|0]|0)==-69:0)?(a[h+2|0]|0)==-65:0){m=h+3|0;c[g>>2]=m;o=m}else{o=h}a:do{if(o>>>0<f>>>0){h=f;m=j;e=c[k>>2]|0;p=o;b:while(1){if(!(e>>>0<j>>>0)){q=p;break a}r=a[p]|0;s=r&255;if(s>>>0>l>>>0){t=2;u=41;break}do{if(r<<24>>24>-1){b[e>>1]=r&255;c[g>>2]=p+1}else{if((r&255)<194){t=2;u=41;break b}if((r&255)<224){if((h-p|0)<2){t=1;u=41;break b}v=d[p+1|0]|0;if((v&192|0)!=128){t=2;u=41;break b}w=v&63|s<<6&1984;if(w>>>0>l>>>0){t=2;u=41;break b}b[e>>1]=w;c[g>>2]=p+2;break}if((r&255)<240){if((h-p|0)<3){t=1;u=41;break b}w=a[p+1|0]|0;v=a[p+2|0]|0;if((s|0)==237){if(!((w&-32)<<24>>24==-128)){t=2;u=41;break b}}else if((s|0)==224){if(!((w&-32)<<24>>24==-96)){t=2;u=41;break b}}else{if(!((w&-64)<<24>>24==-128)){t=2;u=41;break b}}x=v&255;if((x&192|0)!=128){t=2;u=41;break b}v=(w&255)<<6&4032|s<<12|x&63;if((v&65535)>>>0>l>>>0){t=2;u=41;break b}b[e>>1]=v;c[g>>2]=p+3;break}if(!((r&255)<245)){t=2;u=41;break b}if((h-p|0)<4){t=1;u=41;break b}v=a[p+1|0]|0;x=a[p+2|0]|0;w=a[p+3|0]|0;if((s|0)==244){if(!((v&-16)<<24>>24==-128)){t=2;u=41;break b}}else if((s|0)==240){if(!((v+112<<24>>24&255)<48)){t=2;u=41;break b}}else{if(!((v&-64)<<24>>24==-128)){t=2;u=41;break b}}y=x&255;if((y&192|0)!=128){t=2;u=41;break b}x=w&255;if((x&192|0)!=128){t=2;u=41;break b}if((m-e|0)<4){t=1;u=41;break b}w=s&7;z=v&255;v=y<<6;A=x&63;if((z<<12&258048|w<<18|v&4032|A)>>>0>l>>>0){t=2;u=41;break b}b[e>>1]=z<<2&60|y>>>4&3|((z>>>4&3|w<<2)<<6)+16320|55296;w=e+2|0;c[k>>2]=w;b[w>>1]=A|v&960|56320;c[g>>2]=(c[g>>2]|0)+4}}while(0);s=(c[k>>2]|0)+2|0;c[k>>2]=s;r=c[g>>2]|0;if(r>>>0<f>>>0){e=s;p=r}else{q=r;break a}}if((u|0)==41){i=n;return t|0}}else{q=o}}while(0);t=q>>>0<f>>>0|0;i=n;return t|0}function Al(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function Bl(a){a=a|0;return 0}function Cl(a){a=a|0;return 0}function Dl(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=i;a=El(c,d,e,1114111,0)|0;i=b;return a|0}function El(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;h=i;if((((g&4|0)!=0?(c-b|0)>2:0)?(a[b]|0)==-17:0)?(a[b+1|0]|0)==-69:0){j=(a[b+2|0]|0)==-65?b+3|0:b}else{j=b}a:do{if(j>>>0<c>>>0&(e|0)!=0){g=c;k=j;l=0;b:while(1){m=a[k]|0;n=m&255;if(n>>>0>f>>>0){o=k;break a}do{if(m<<24>>24>-1){p=k+1|0;q=l}else{if((m&255)<194){o=k;break a}if((m&255)<224){if((g-k|0)<2){o=k;break a}r=d[k+1|0]|0;if((r&192|0)!=128){o=k;break a}if((r&63|n<<6&1984)>>>0>f>>>0){o=k;break a}p=k+2|0;q=l;break}if((m&255)<240){s=k;if((g-s|0)<3){o=k;break a}r=a[k+1|0]|0;t=a[k+2|0]|0;if((n|0)==237){if(!((r&-32)<<24>>24==-128)){u=23;break b}}else if((n|0)==224){if(!((r&-32)<<24>>24==-96)){u=21;break b}}else{if(!((r&-64)<<24>>24==-128)){u=25;break b}}v=t&255;if((v&192|0)!=128){o=k;break a}if(((r&255)<<6&4032|n<<12&61440|v&63)>>>0>f>>>0){o=k;break a}p=k+3|0;q=l;break}if(!((m&255)<245)){o=k;break a}w=k;if((g-w|0)<4){o=k;break a}if((e-l|0)>>>0<2){o=k;break a}v=a[k+1|0]|0;r=a[k+2|0]|0;t=a[k+3|0]|0;if((n|0)==240){if(!((v+112<<24>>24&255)<48)){u=34;break b}}else if((n|0)==244){if(!((v&-16)<<24>>24==-128)){u=36;break b}}else{if(!((v&-64)<<24>>24==-128)){u=38;break b}}x=r&255;if((x&192|0)!=128){o=k;break a}r=t&255;if((r&192|0)!=128){o=k;break a}if(((v&255)<<12&258048|n<<18&1835008|x<<6&4032|r&63)>>>0>f>>>0){o=k;break a}p=k+4|0;q=l+1|0}}while(0);n=q+1|0;if(p>>>0<c>>>0&n>>>0<e>>>0){k=p;l=n}else{o=p;break a}}if((u|0)==21){y=s-b|0;i=h;return y|0}else if((u|0)==23){y=s-b|0;i=h;return y|0}else if((u|0)==25){y=s-b|0;i=h;return y|0}else if((u|0)==34){y=w-b|0;i=h;return y|0}else if((u|0)==36){y=w-b|0;i=h;return y|0}else if((u|0)==38){y=w-b|0;i=h;return y|0}}else{o=j}}while(0);y=o-b|0;i=h;return y|0}function Fl(a){a=a|0;return 4}function Gl(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Hl(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b+4|0;k=b;c[a>>2]=d;c[k>>2]=g;l=Il(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=b;return l|0}function Il(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0;l=i;c[e>>2]=b;c[h>>2]=f;do{if((k&2|0)!=0){if((g-f|0)<3){m=1;i=l;return m|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);f=c[e>>2]|0;if(!(f>>>0<d>>>0)){m=0;i=l;return m|0}k=g;g=f;a:while(1){f=c[g>>2]|0;if((f&-2048|0)==55296|f>>>0>j>>>0){m=2;n=19;break}do{if(!(f>>>0<128)){if(f>>>0<2048){b=c[h>>2]|0;if((k-b|0)<2){m=1;n=19;break a}c[h>>2]=b+1;a[b]=f>>>6|192;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f&63|128;break}b=c[h>>2]|0;o=k-b|0;if(f>>>0<65536){if((o|0)<3){m=1;n=19;break a}c[h>>2]=b+1;a[b]=f>>>12|224;p=c[h>>2]|0;c[h>>2]=p+1;a[p]=f>>>6&63|128;p=c[h>>2]|0;c[h>>2]=p+1;a[p]=f&63|128;break}else{if((o|0)<4){m=1;n=19;break a}c[h>>2]=b+1;a[b]=f>>>18|240;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f>>>12&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f>>>6&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=f&63|128;break}}else{b=c[h>>2]|0;if((k-b|0)<1){m=1;n=19;break a}c[h>>2]=b+1;a[b]=f}}while(0);f=(c[e>>2]|0)+4|0;c[e>>2]=f;if(f>>>0<d>>>0){g=f}else{m=0;n=19;break}}if((n|0)==19){i=l;return m|0}return 0}function Jl(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;b=i;i=i+16|0;a=b+4|0;k=b;c[a>>2]=d;c[k>>2]=g;l=Kl(d,e,a,g,h,k,1114111,0)|0;c[f>>2]=d+((c[a>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=b;return l|0}function Kl(b,e,f,g,h,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;m=i;c[f>>2]=b;c[j>>2]=g;g=c[f>>2]|0;if(((((l&4|0)!=0?(e-g|0)>2:0)?(a[g]|0)==-17:0)?(a[g+1|0]|0)==-69:0)?(a[g+2|0]|0)==-65:0){l=g+3|0;c[f>>2]=l;n=l}else{n=g}a:do{if(n>>>0<e>>>0){g=e;l=c[j>>2]|0;b=n;while(1){if(!(l>>>0<h>>>0)){o=b;p=39;break a}q=a[b]|0;r=q&255;do{if(q<<24>>24>-1){if(r>>>0>k>>>0){s=2;break a}c[l>>2]=r;c[f>>2]=b+1}else{if((q&255)<194){s=2;break a}if((q&255)<224){if((g-b|0)<2){s=1;break a}t=d[b+1|0]|0;if((t&192|0)!=128){s=2;break a}u=t&63|r<<6&1984;if(u>>>0>k>>>0){s=2;break a}c[l>>2]=u;c[f>>2]=b+2;break}if((q&255)<240){if((g-b|0)<3){s=1;break a}u=a[b+1|0]|0;t=a[b+2|0]|0;if((r|0)==224){if(!((u&-32)<<24>>24==-96)){s=2;break a}}else if((r|0)==237){if(!((u&-32)<<24>>24==-128)){s=2;break a}}else{if(!((u&-64)<<24>>24==-128)){s=2;break a}}v=t&255;if((v&192|0)!=128){s=2;break a}t=(u&255)<<6&4032|r<<12&61440|v&63;if(t>>>0>k>>>0){s=2;break a}c[l>>2]=t;c[f>>2]=b+3;break}if(!((q&255)<245)){s=2;break a}if((g-b|0)<4){s=1;break a}t=a[b+1|0]|0;v=a[b+2|0]|0;u=a[b+3|0]|0;if((r|0)==240){if(!((t+112<<24>>24&255)<48)){s=2;break a}}else if((r|0)==244){if(!((t&-16)<<24>>24==-128)){s=2;break a}}else{if(!((t&-64)<<24>>24==-128)){s=2;break a}}w=v&255;if((w&192|0)!=128){s=2;break a}v=u&255;if((v&192|0)!=128){s=2;break a}u=(t&255)<<12&258048|r<<18&1835008|w<<6&4032|v&63;if(u>>>0>k>>>0){s=2;break a}c[l>>2]=u;c[f>>2]=b+4}}while(0);r=(c[j>>2]|0)+4|0;c[j>>2]=r;q=c[f>>2]|0;if(q>>>0<e>>>0){l=r;b=q}else{o=q;p=39;break}}}else{o=n;p=39}}while(0);if((p|0)==39){s=o>>>0<e>>>0|0}i=m;return s|0}function Ll(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function Ml(a){a=a|0;return 0}function Nl(a){a=a|0;return 0}function Ol(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=i;a=Pl(c,d,e,1114111,0)|0;i=b;return a|0}function Pl(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;h=i;if((((g&4|0)!=0?(c-b|0)>2:0)?(a[b]|0)==-17:0)?(a[b+1|0]|0)==-69:0){j=(a[b+2|0]|0)==-65?b+3|0:b}else{j=b}a:do{if(j>>>0<c>>>0&(e|0)!=0){g=c;k=j;l=1;b:while(1){m=a[k]|0;n=m&255;do{if(m<<24>>24>-1){if(n>>>0>f>>>0){o=k;break a}p=k+1|0}else{if((m&255)<194){o=k;break a}if((m&255)<224){if((g-k|0)<2){o=k;break a}q=d[k+1|0]|0;if((q&192|0)!=128){o=k;break a}if((q&63|n<<6&1984)>>>0>f>>>0){o=k;break a}p=k+2|0;break}if((m&255)<240){r=k;if((g-r|0)<3){o=k;break a}q=a[k+1|0]|0;s=a[k+2|0]|0;if((n|0)==237){if(!((q&-32)<<24>>24==-128)){t=23;break b}}else if((n|0)==224){if(!((q&-32)<<24>>24==-96)){t=21;break b}}else{if(!((q&-64)<<24>>24==-128)){t=25;break b}}u=s&255;if((u&192|0)!=128){o=k;break a}if(((q&255)<<6&4032|n<<12&61440|u&63)>>>0>f>>>0){o=k;break a}p=k+3|0;break}if(!((m&255)<245)){o=k;break a}v=k;if((g-v|0)<4){o=k;break a}u=a[k+1|0]|0;q=a[k+2|0]|0;s=a[k+3|0]|0;if((n|0)==244){if(!((u&-16)<<24>>24==-128)){t=35;break b}}else if((n|0)==240){if(!((u+112<<24>>24&255)<48)){t=33;break b}}else{if(!((u&-64)<<24>>24==-128)){t=37;break b}}w=q&255;if((w&192|0)!=128){o=k;break a}q=s&255;if((q&192|0)!=128){o=k;break a}if(((u&255)<<12&258048|n<<18&1835008|w<<6&4032|q&63)>>>0>f>>>0){o=k;break a}p=k+4|0}}while(0);if(!(p>>>0<c>>>0&l>>>0<e>>>0)){o=p;break a}k=p;l=l+1|0}if((t|0)==21){x=r-b|0;i=h;return x|0}else if((t|0)==23){x=r-b|0;i=h;return x|0}else if((t|0)==25){x=r-b|0;i=h;return x|0}else if((t|0)==33){x=v-b|0;i=h;return x|0}else if((t|0)==35){x=v-b|0;i=h;return x|0}else if((t|0)==37){x=v-b|0;i=h;return x|0}}else{o=j}}while(0);x=o-b|0;i=h;return x|0}function Ql(a){a=a|0;return 4}function Rl(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Sl(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Tl(a){a=a|0;var b=0;b=i;c[a>>2]=18040;ef(a+12|0);Cn(a);i=b;return}function Ul(a){a=a|0;var b=0;b=i;c[a>>2]=18040;ef(a+12|0);i=b;return}function Vl(a){a=a|0;var b=0;b=i;c[a>>2]=18080;ef(a+16|0);Cn(a);i=b;return}function Wl(a){a=a|0;var b=0;b=i;c[a>>2]=18080;ef(a+16|0);i=b;return}function Xl(b){b=b|0;return a[b+8|0]|0}function Yl(a){a=a|0;return c[a+8>>2]|0}function Zl(b){b=b|0;return a[b+9|0]|0}function _l(a){a=a|0;return c[a+12>>2]|0}function $l(a,b){a=a|0;b=b|0;var c=0;c=i;bf(a,b+12|0);i=c;return}function am(a,b){a=a|0;b=b|0;var c=0;c=i;bf(a,b+16|0);i=c;return}function bm(a,b){a=a|0;b=b|0;b=i;cf(a,18112,4);i=b;return}function cm(a,b){a=a|0;b=b|0;b=i;of(a,18120,Vm(18120)|0);i=b;return}function dm(a,b){a=a|0;b=b|0;b=i;cf(a,18144,5);i=b;return}function em(a,b){a=a|0;b=b|0;b=i;of(a,18152,Vm(18152)|0);i=b;return}function fm(b){b=b|0;var d=0;b=i;if((a[18184]|0)!=0){d=c[4544]|0;i=b;return d|0}if((La(18184)|0)==0){d=c[4544]|0;i=b;return d|0}if((a[25384]|0)==0?(La(25384)|0)!=0:0){Zn(25216,0,168)|0;uc(120,0,q|0)|0;jb(25384)}ff(25216,25392)|0;ff(25228|0,25400)|0;ff(25240|0,25408)|0;ff(25252|0,25416)|0;ff(25264|0,25432)|0;ff(25276|0,25448)|0;ff(25288|0,25456)|0;ff(25300|0,25472)|0;ff(25312|0,25480)|0;ff(25324|0,25488)|0;ff(25336|0,25496)|0;ff(25348|0,25504)|0;ff(25360|0,25512)|0;ff(25372|0,25520)|0;c[4544]=25216;jb(18184);d=c[4544]|0;i=b;return d|0}function gm(b){b=b|0;var d=0;b=i;if((a[18200]|0)!=0){d=c[4548]|0;i=b;return d|0}if((La(18200)|0)==0){d=c[4548]|0;i=b;return d|0}if((a[24848]|0)==0?(La(24848)|0)!=0:0){Zn(24680,0,168)|0;uc(121,0,q|0)|0;jb(24848)}rf(24680,24856)|0;rf(24692|0,24888)|0;rf(24704|0,24920)|0;rf(24716|0,24952)|0;rf(24728|0,24992)|0;rf(24740|0,25032)|0;rf(24752|0,25064)|0;rf(24764|0,25104)|0;rf(24776|0,25120)|0;rf(24788|0,25136)|0;rf(24800|0,25152)|0;rf(24812|0,25168)|0;rf(24824|0,25184)|0;rf(24836|0,25200)|0;c[4548]=24680;jb(18200);d=c[4548]|0;i=b;return d|0}function hm(b){b=b|0;var d=0;b=i;if((a[18216]|0)!=0){d=c[4552]|0;i=b;return d|0}if((La(18216)|0)==0){d=c[4552]|0;i=b;return d|0}if((a[24456]|0)==0?(La(24456)|0)!=0:0){Zn(24168,0,288)|0;uc(122,0,q|0)|0;jb(24456)}ff(24168,24464)|0;ff(24180|0,24472)|0;ff(24192|0,24488)|0;ff(24204|0,24496)|0;ff(24216|0,24504)|0;ff(24228|0,24512)|0;ff(24240|0,24520)|0;ff(24252|0,24528)|0;ff(24264|0,24536)|0;ff(24276|0,24552)|0;ff(24288|0,24560)|0;ff(24300|0,24576)|0;ff(24312|0,24592)|0;ff(24324|0,24600)|0;ff(24336|0,24608)|0;ff(24348|0,24616)|0;ff(24360|0,24504)|0;ff(24372|0,24624)|0;ff(24384|0,24632)|0;ff(24396|0,24640)|0;ff(24408|0,24648)|0;ff(24420|0,24656)|0;ff(24432|0,24664)|0;ff(24444|0,24672)|0;c[4552]=24168;jb(18216);d=c[4552]|0;i=b;return d|0}function im(b){b=b|0;var d=0;b=i;if((a[18232]|0)!=0){d=c[4556]|0;i=b;return d|0}if((La(18232)|0)==0){d=c[4556]|0;i=b;return d|0}if((a[23616]|0)==0?(La(23616)|0)!=0:0){Zn(23328,0,288)|0;uc(123,0,q|0)|0;jb(23616)}rf(23328,23624)|0;rf(23340|0,23656)|0;rf(23352|0,23696)|0;rf(23364|0,23720)|0;rf(23376|0,24040)|0;rf(23388|0,23744)|0;rf(23400|0,23768)|0;rf(23412|0,23792)|0;rf(23424|0,23824)|0;rf(23436|0,23864)|0;rf(23448|0,23896)|0;rf(23460|0,23936)|0;rf(23472|0,23976)|0;rf(23484|0,23992)|0;rf(23496|0,24008)|0;rf(23508|0,24024)|0;rf(23520|0,24040)|0;rf(23532|0,24056)|0;rf(23544|0,24072)|0;rf(23556|0,24088)|0;rf(23568|0,24104)|0;rf(23580|0,24120)|0;rf(23592|0,24136)|0;rf(23604|0,24152)|0;c[4556]=23328;jb(18232);d=c[4556]|0;i=b;return d|0}function jm(b){b=b|0;var d=0;b=i;if((a[18248]|0)!=0){d=c[4560]|0;i=b;return d|0}if((La(18248)|0)==0){d=c[4560]|0;i=b;return d|0}if((a[23304]|0)==0?(La(23304)|0)!=0:0){Zn(23016,0,288)|0;uc(124,0,q|0)|0;jb(23304)}ff(23016,23312)|0;ff(23028|0,23320)|0;c[4560]=23016;jb(18248);d=c[4560]|0;i=b;return d|0}function km(b){b=b|0;var d=0;b=i;if((a[18264]|0)!=0){d=c[4564]|0;i=b;return d|0}if((La(18264)|0)==0){d=c[4564]|0;i=b;return d|0}if((a[22976]|0)==0?(La(22976)|0)!=0:0){Zn(22688,0,288)|0;uc(125,0,q|0)|0;jb(22976)}rf(22688,22984)|0;rf(22700|0,23e3)|0;c[4564]=22688;jb(18264);d=c[4564]|0;i=b;return d|0}function lm(b){b=b|0;b=i;if((a[18288]|0)==0?(La(18288)|0)!=0:0){cf(18272,18296,8);uc(126,18272,q|0)|0;jb(18288)}i=b;return 18272}function mm(b){b=b|0;b=i;if((a[18328]|0)!=0){i=b;return 18312}if((La(18328)|0)==0){i=b;return 18312}of(18312,18336,Vm(18336)|0);uc(127,18312,q|0)|0;jb(18328);i=b;return 18312}function nm(b){b=b|0;b=i;if((a[18392]|0)==0?(La(18392)|0)!=0:0){cf(18376,18400,8);uc(126,18376,q|0)|0;jb(18392)}i=b;return 18376}function om(b){b=b|0;b=i;if((a[18432]|0)!=0){i=b;return 18416}if((La(18432)|0)==0){i=b;return 18416}of(18416,18440,Vm(18440)|0);uc(127,18416,q|0)|0;jb(18432);i=b;return 18416}function pm(b){b=b|0;b=i;if((a[18496]|0)==0?(La(18496)|0)!=0:0){cf(18480,18504,20);uc(126,18480,q|0)|0;jb(18496)}i=b;return 18480}function qm(b){b=b|0;b=i;if((a[18544]|0)!=0){i=b;return 18528}if((La(18544)|0)==0){i=b;return 18528}of(18528,18552,Vm(18552)|0);uc(127,18528,q|0)|0;jb(18544);i=b;return 18528}function rm(b){b=b|0;b=i;if((a[18656]|0)==0?(La(18656)|0)!=0:0){cf(18640,18664,11);uc(126,18640,q|0)|0;jb(18656)}i=b;return 18640}function sm(b){b=b|0;b=i;if((a[18696]|0)!=0){i=b;return 18680}if((La(18696)|0)==0){i=b;return 18680}of(18680,18704,Vm(18704)|0);uc(127,18680,q|0)|0;jb(18696);i=b;return 18680}function tm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+16|0;g=f;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=mc()|0;k=c[j>>2]|0;c[j>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}l=+Qn(b,g,c[4440]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function um(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+16|0;g=f;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=mc()|0;k=c[j>>2]|0;c[j>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}l=+Qn(b,g,c[4440]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)!=34){h=l;i=f;return+h}c[e>>2]=4;h=l;i=f;return+h}function vm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0.0,j=0,k=0,l=0.0;f=i;i=i+16|0;g=f;if((b|0)==(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}j=mc()|0;k=c[j>>2]|0;c[j>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}l=+Qn(b,g,c[4440]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=k}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;h=0.0;i=f;return+h}if((b|0)==34){c[e>>2]=4}h=l;i=f;return+h}function wm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+16|0;h=g;do{if((b|0)!=(d|0)){if((a[b]|0)==45){c[e>>2]=4;j=0;k=0;break}l=mc()|0;m=c[l>>2]|0;c[l>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}n=wb(b|0,h|0,f|0,c[4440]|0)|0;o=c[l>>2]|0;if((o|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)==34){c[e>>2]=4;j=-1;k=-1}else{j=J;k=n}}else{c[e>>2]=4;j=0;k=0}}while(0);J=j;i=g;return k|0}function xm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+16|0;h=g;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=mc()|0;l=c[k>>2]|0;c[k>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}m=wb(b|0,h|0,f|0,c[4440]|0)|0;f=J;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((b|0)==34|(f>>>0>0|(f|0)==0&m>>>0>4294967295)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function ym(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+16|0;h=g;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=mc()|0;l=c[k>>2]|0;c[k>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}m=wb(b|0,h|0,f|0,c[4440]|0)|0;f=J;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((b|0)==34|(f>>>0>0|(f|0)==0&m>>>0>4294967295)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m;i=g;return j|0}return 0}function zm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+16|0;h=g;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((a[b]|0)==45){c[e>>2]=4;j=0;i=g;return j|0}k=mc()|0;l=c[k>>2]|0;c[k>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}m=wb(b|0,h|0,f|0,c[4440]|0)|0;f=J;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if((b|0)==34|(f>>>0>0|(f|0)==0&m>>>0>65535)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=m&65535;i=g;return j|0}return 0}function Am(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+16|0;h=g;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;J=j;i=g;return k|0}l=mc()|0;m=c[l>>2]|0;c[l>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}n=fc(b|0,h|0,f|0,c[4440]|0)|0;f=J;b=c[l>>2]|0;if((b|0)==0){c[l>>2]=m}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;J=j;i=g;return k|0}if((b|0)==34){c[e>>2]=4;e=(f|0)>0|(f|0)==0&n>>>0>0;J=e?2147483647:-2147483648;i=g;return(e?-1:0)|0}else{j=f;k=n;J=j;i=g;return k|0}return 0}function Bm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+16|0;h=g;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=mc()|0;l=c[k>>2]|0;c[k>>2]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}m=fc(b|0,h|0,f|0,c[4440]|0)|0;f=J;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}do{if((b|0)==34){c[e>>2]=4;if((f|0)>0|(f|0)==0&m>>>0>0){j=2147483647;i=g;return j|0}}else{if((f|0)<-1|(f|0)==-1&m>>>0<2147483648){c[e>>2]=4;break}if((f|0)>0|(f|0)==0&m>>>0>2147483647){c[e>>2]=4;j=2147483647;i=g;return j|0}else{j=m;i=g;return j|0}}}while(0);j=-2147483648;i=g;return j|0}function Cm(a){a=a|0;var b=0,e=0,f=0,g=0,h=0;b=i;e=a+4|0;f=d[e]|d[e+1|0]<<8|d[e+2|0]<<16|d[e+3|0]<<24;g=e+4|0;e=d[g]|d[g+1|0]<<8|d[g+2|0]<<16|d[g+3|0]<<24;g=(c[a>>2]|0)+(e>>1)|0;if((e&1|0)==0){h=f;yc[h&127](g);i=b;return}else{h=c[(c[g>>2]|0)+f>>2]|0;yc[h&127](g);i=b;return}}function Dm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;f=b+8|0;g=b+4|0;h=c[g>>2]|0;j=c[f>>2]|0;k=h;if(!(j-k>>2>>>0<d>>>0)){l=d;m=h;do{if((m|0)==0){n=0}else{c[m>>2]=0;n=c[g>>2]|0}m=n+4|0;c[g>>2]=m;l=l+ -1|0}while((l|0)!=0);i=e;return}l=b+16|0;m=c[b>>2]|0;n=k-m>>2;k=n+d|0;if(k>>>0>1073741823){xk(0)}h=j-m|0;if(h>>2>>>0<536870911){m=h>>1;h=m>>>0<k>>>0?k:m;if((h|0)!=0){m=b+128|0;if((a[m]|0)==0&h>>>0<29){a[m]=1;o=h;p=l}else{q=h;r=11}}else{o=0;p=0}}else{q=1073741823;r=11}if((r|0)==11){o=q;p=An(q<<2)|0}q=d;d=p+(n<<2)|0;do{if((d|0)==0){s=0}else{c[d>>2]=0;s=d}d=s+4|0;q=q+ -1|0}while((q|0)!=0);q=c[b>>2]|0;s=(c[g>>2]|0)-q|0;r=p+(n-(s>>2)<<2)|0;Xn(r|0,q|0,s|0)|0;c[b>>2]=r;c[g>>2]=d;c[f>>2]=p+(o<<2);if((q|0)==0){i=e;return}if((l|0)==(q|0)){a[b+128|0]=0;i=e;return}else{Cn(q);i=e;return}}function Em(a){a=a|0;a=i;qf(22964|0);qf(22952|0);qf(22940|0);qf(22928|0);qf(22916|0);qf(22904|0);qf(22892|0);qf(22880|0);qf(22868|0);qf(22856|0);qf(22844|0);qf(22832|0);qf(22820|0);qf(22808|0);qf(22796|0);qf(22784|0);qf(22772|0);qf(22760|0);qf(22748|0);qf(22736|0);qf(22724|0);qf(22712|0);qf(22700|0);qf(22688);i=a;return}function Fm(a){a=a|0;a=i;ef(23292|0);ef(23280|0);ef(23268|0);ef(23256|0);ef(23244|0);ef(23232|0);ef(23220|0);ef(23208|0);ef(23196|0);ef(23184|0);ef(23172|0);ef(23160|0);ef(23148|0);ef(23136|0);ef(23124|0);ef(23112|0);ef(23100|0);ef(23088|0);ef(23076|0);ef(23064|0);ef(23052|0);ef(23040|0);ef(23028|0);ef(23016);i=a;return}function Gm(a){a=a|0;a=i;qf(23604|0);qf(23592|0);qf(23580|0);qf(23568|0);qf(23556|0);qf(23544|0);qf(23532|0);qf(23520|0);qf(23508|0);qf(23496|0);qf(23484|0);qf(23472|0);qf(23460|0);qf(23448|0);qf(23436|0);qf(23424|0);qf(23412|0);qf(23400|0);qf(23388|0);qf(23376|0);qf(23364|0);qf(23352|0);qf(23340|0);qf(23328);i=a;return}function Hm(a){a=a|0;a=i;ef(24444|0);ef(24432|0);ef(24420|0);ef(24408|0);ef(24396|0);ef(24384|0);ef(24372|0);ef(24360|0);ef(24348|0);ef(24336|0);ef(24324|0);ef(24312|0);ef(24300|0);ef(24288|0);ef(24276|0);ef(24264|0);ef(24252|0);ef(24240|0);ef(24228|0);ef(24216|0);ef(24204|0);ef(24192|0);ef(24180|0);ef(24168);i=a;return}function Im(a){a=a|0;a=i;qf(24836|0);qf(24824|0);qf(24812|0);qf(24800|0);qf(24788|0);qf(24776|0);qf(24764|0);qf(24752|0);qf(24740|0);qf(24728|0);qf(24716|0);qf(24704|0);qf(24692|0);qf(24680);i=a;return}function Jm(a){a=a|0;a=i;ef(25372|0);ef(25360|0);ef(25348|0);ef(25336|0);ef(25324|0);ef(25312|0);ef(25300|0);ef(25288|0);ef(25276|0);ef(25264|0);ef(25252|0);ef(25240|0);ef(25228|0);ef(25216);i=a;return}function Km(a,b,c){a=a|0;b=b|0;c=c|0;var d=0,e=0;d=i;e=Lm(0,a,b,(c|0)!=0?c:25736)|0;i=d;return e|0}



function pg(a){a=a|0;var b=0,d=0,e=0;b=i;d=a+4|0;a=c[d>>2]|0;e=c[(c[a>>2]|0)+ -12>>2]|0;if((c[a+(e+24)>>2]|0)==0){i=b;return}if((c[a+(e+16)>>2]|0)!=0){i=b;return}if((c[a+(e+4)>>2]&8192|0)==0){i=b;return}if(Na()|0){i=b;return}e=c[d>>2]|0;a=c[e+((c[(c[e>>2]|0)+ -12>>2]|0)+24)>>2]|0;if(!((Ac[c[(c[a>>2]|0)+24>>2]&127](a)|0)==-1)){i=b;return}a=c[d>>2]|0;d=c[(c[a>>2]|0)+ -12>>2]|0;xf(a+d|0,c[a+(d+16)>>2]|1);i=b;return}function qg(a){a=a|0;var b=0;b=i;yf(a+4|0);Cn(a);i=b;return}function rg(a){a=a|0;var b=0;b=i;yf(a+4|0);i=b;return}function sg(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;yf(a+(d+4)|0);Cn(a+d|0);i=b;return}function tg(a){a=a|0;var b=0;b=i;yf(a+((c[(c[a>>2]|0)+ -12>>2]|0)+4)|0);i=b;return}function ug(a){a=a|0;var b=0,d=0,e=0;b=i;d=a+4|0;a=c[d>>2]|0;e=c[(c[a>>2]|0)+ -12>>2]|0;if((c[a+(e+24)>>2]|0)==0){i=b;return}if((c[a+(e+16)>>2]|0)!=0){i=b;return}if((c[a+(e+4)>>2]&8192|0)==0){i=b;return}if(Na()|0){i=b;return}e=c[d>>2]|0;a=c[e+((c[(c[e>>2]|0)+ -12>>2]|0)+24)>>2]|0;if(!((Ac[c[(c[a>>2]|0)+24>>2]&127](a)|0)==-1)){i=b;return}a=c[d>>2]|0;d=c[(c[a>>2]|0)+ -12>>2]|0;xf(a+d|0,c[a+(d+16)>>2]|1);i=b;return}function vg(a){a=a|0;return 15424}function wg(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=i;if((c|0)==1){cf(a,15440,35);i=d;return}else{Ve(a,b,c);i=d;return}}function xg(a){a=a|0;return}function yg(a){a=a|0;var b=0;b=i;Ze(a);Cn(a);i=b;return}function zg(a){a=a|0;var b=0;b=i;Ze(a);i=b;return}function Ag(a){a=a|0;var b=0;b=i;yf(a);Cn(a);i=b;return}function Bg(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Cg(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Dg(a){a=a|0;return}function Eg(a){a=a|0;return}function Fg(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;a:do{if((e|0)==(f|0)){g=c;h=6}else{j=e;k=c;while(1){if((k|0)==(d|0)){l=-1;break a}m=a[k]|0;n=a[j]|0;if(m<<24>>24<n<<24>>24){l=-1;break a}if(n<<24>>24<m<<24>>24){l=1;break a}m=k+1|0;n=j+1|0;if((n|0)==(f|0)){g=m;h=6;break}else{j=n;k=m}}}}while(0);if((h|0)==6){l=(g|0)!=(d|0)|0}i=b;return l|0}function Gg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;d=i;g=e;h=f-g|0;if(h>>>0>4294967279){af(b)}if(h>>>0<11){a[b]=h<<1;j=b+1|0}else{k=h+16&-16;l=An(k)|0;c[b+8>>2]=l;c[b>>2]=k|1;c[b+4>>2]=h;j=l}if((e|0)==(f|0)){m=j;a[m]=0;i=d;return}else{n=e;o=j}while(1){a[o]=a[n]|0;n=n+1|0;if((n|0)==(f|0)){break}else{o=o+1|0}}m=j+(f+(0-g))|0;a[m]=0;i=d;return}function Hg(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;b=i;if((c|0)==(d|0)){e=0;i=b;return e|0}else{f=0;g=c}while(1){c=(a[g]|0)+(f<<4)|0;h=c&-268435456;j=(h>>>24|h)^c;c=g+1|0;if((c|0)==(d|0)){e=j;break}else{f=j;g=c}}i=b;return e|0}function Ig(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Jg(a){a=a|0;return}function Kg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;a=i;a:do{if((e|0)==(f|0)){g=b;h=6}else{j=e;k=b;while(1){if((k|0)==(d|0)){l=-1;break a}m=c[k>>2]|0;n=c[j>>2]|0;if((m|0)<(n|0)){l=-1;break a}if((n|0)<(m|0)){l=1;break a}m=k+4|0;n=j+4|0;if((n|0)==(f|0)){g=m;h=6;break}else{j=n;k=m}}}}while(0);if((h|0)==6){l=(g|0)!=(d|0)|0}i=a;return l|0}function Lg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;d=i;g=e;h=f-g|0;j=h>>2;if(j>>>0>1073741807){af(b)}if(j>>>0<2){a[b]=h>>>1;k=b+4|0}else{h=j+4&-4;l=An(h<<2)|0;c[b+8>>2]=l;c[b>>2]=h|1;c[b+4>>2]=j;k=l}if((e|0)==(f|0)){m=k;c[m>>2]=0;i=d;return}l=f+ -4+(0-g)|0;g=e;e=k;while(1){c[e>>2]=c[g>>2];g=g+4|0;if((g|0)==(f|0)){break}else{e=e+4|0}}m=k+((l>>>2)+1<<2)|0;c[m>>2]=0;i=d;return}function Mg(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;a=i;if((b|0)==(d|0)){e=0;i=a;return e|0}else{f=0;g=b}while(1){b=(c[g>>2]|0)+(f<<4)|0;h=b&-268435456;j=(h>>>24|h)^b;b=g+4|0;if((b|0)==(d|0)){e=j;break}else{f=j;g=b}}i=a;return e|0}function Ng(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Og(a){a=a|0;return}function Pg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;k=i;i=i+80|0;l=k;m=k+64|0;n=k+60|0;o=k+56|0;p=k+52|0;q=k+68|0;r=k+16|0;s=k+12|0;t=k+24|0;u=k+48|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;c[p>>2]=c[e>>2];c[q>>2]=c[f>>2];c[m+0>>2]=c[p+0>>2];c[l+0>>2]=c[q+0>>2];Ic[v&63](o,d,m,l,g,h,n);m=c[o>>2]|0;c[e>>2]=m;o=c[n>>2]|0;if((o|0)==1){a[j]=1}else if((o|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=m;i=k;return}zf(r,g);m=c[r>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}o=(c[17876>>2]|0)+ -1|0;n=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-n>>2>>>0>o>>>0)){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}m=c[n+(o<<2)>>2]|0;if((m|0)==0){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}Fe(c[r>>2]|0)|0;zf(s,g);g=c[s>>2]|0;if(!((c[4504]|0)==-1)){c[l>>2]=18016;c[l+4>>2]=117;c[l+8>>2]=0;$e(18016,l,118)}r=(c[18020>>2]|0)+ -1|0;w=c[g+8>>2]|0;if(!((c[g+12>>2]|0)-w>>2>>>0>r>>>0)){x=Gb(4)|0;_m(x);pc(x|0,25832,102)}g=c[w+(r<<2)>>2]|0;if((g|0)==0){x=Gb(4)|0;_m(x);pc(x|0,25832,102)}Fe(c[s>>2]|0)|0;zc[c[(c[g>>2]|0)+24>>2]&63](t,g);zc[c[(c[g>>2]|0)+28>>2]&63](t+12|0,g);c[u>>2]=c[f>>2];f=t+24|0;c[l+0>>2]=c[u+0>>2];a[j]=(Qg(e,l,t,f,m,h,1)|0)==(t|0)|0;c[b>>2]=c[e>>2];ef(t+12|0);ef(t);i=k;return}function Qg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0;l=i;i=i+112|0;m=l;n=(g-f|0)/12|0;if(n>>>0>100){o=un(n)|0;if((o|0)==0){Hn()}else{p=o;q=o}}else{p=0;q=m}m=(f|0)==(g|0);if(m){r=0;s=n}else{o=f;t=0;u=n;n=q;while(1){v=a[o]|0;if((v&1)==0){w=(v&255)>>>1}else{w=c[o+4>>2]|0}if((w|0)==0){a[n]=2;x=t+1|0;y=u+ -1|0}else{a[n]=1;x=t;y=u}v=o+12|0;if((v|0)==(g|0)){r=x;s=y;break}else{o=v;t=x;u=y;n=n+1|0}}}n=0;y=r;r=s;a:while(1){s=c[b>>2]|0;do{if((s|0)!=0){if((c[s+12>>2]|0)==(c[s+16>>2]|0)){if((Ac[c[(c[s>>2]|0)+36>>2]&127](s)|0)==-1){c[b>>2]=0;z=0;break}else{z=c[b>>2]|0;break}}else{z=s}}else{z=0}}while(0);s=(z|0)==0;u=c[e>>2]|0;if((u|0)!=0){if((c[u+12>>2]|0)==(c[u+16>>2]|0)?(Ac[c[(c[u>>2]|0)+36>>2]&127](u)|0)==-1:0){c[e>>2]=0;A=0}else{A=u}}else{A=0}B=(A|0)==0;C=c[b>>2]|0;if(!((s^B)&(r|0)!=0)){break}s=c[C+12>>2]|0;if((s|0)==(c[C+16>>2]|0)){D=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{D=d[s]|0}s=D&255;if(k){E=s}else{E=Lc[c[(c[h>>2]|0)+12>>2]&31](h,s)|0}s=n+1|0;if(m){n=s;continue}b:do{if(k){u=0;x=f;t=y;o=r;w=q;while(1){do{if((a[w]|0)==1){v=a[x]|0;F=(v&1)==0;if(F){G=x+1|0}else{G=c[x+8>>2]|0}if(!(E<<24>>24==(a[G+n|0]|0))){a[w]=0;H=u;I=t;J=o+ -1|0;break}if(F){K=(v&255)>>>1}else{K=c[x+4>>2]|0}if((K|0)==(s|0)){a[w]=2;H=1;I=t+1|0;J=o+ -1|0}else{H=1;I=t;J=o}}else{H=u;I=t;J=o}}while(0);v=x+12|0;if((v|0)==(g|0)){L=H;M=I;N=J;break b}u=H;x=v;t=I;o=J;w=w+1|0}}else{w=0;o=f;t=y;x=r;u=q;while(1){do{if((a[u]|0)==1){if((a[o]&1)==0){O=o+1|0}else{O=c[o+8>>2]|0}if(!(E<<24>>24==(Lc[c[(c[h>>2]|0)+12>>2]&31](h,a[O+n|0]|0)|0)<<24>>24)){a[u]=0;P=w;Q=t;R=x+ -1|0;break}v=a[o]|0;if((v&1)==0){S=(v&255)>>>1}else{S=c[o+4>>2]|0}if((S|0)==(s|0)){a[u]=2;P=1;Q=t+1|0;R=x+ -1|0}else{P=1;Q=t;R=x}}else{P=w;Q=t;R=x}}while(0);v=o+12|0;if((v|0)==(g|0)){L=P;M=Q;N=R;break b}w=P;o=v;t=Q;x=R;u=u+1|0}}}while(0);if(!L){n=s;y=M;r=N;continue}u=c[b>>2]|0;x=u+12|0;t=c[x>>2]|0;if((t|0)==(c[u+16>>2]|0)){Ac[c[(c[u>>2]|0)+40>>2]&127](u)|0}else{c[x>>2]=t+1}if((N+M|0)>>>0<2){n=s;y=M;r=N;continue}else{T=f;U=M;V=q}while(1){if((a[V]|0)==2){t=a[T]|0;if((t&1)==0){W=(t&255)>>>1}else{W=c[T+4>>2]|0}if((W|0)!=(s|0)){a[V]=0;X=U+ -1|0}else{X=U}}else{X=U}t=T+12|0;if((t|0)==(g|0)){n=s;y=X;r=N;continue a}else{T=t;U=X;V=V+1|0}}}do{if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)){if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[b>>2]=0;Y=0;break}else{Y=c[b>>2]|0;break}}else{Y=C}}else{Y=0}}while(0);C=(Y|0)==0;do{if(!B){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(C){break}else{Z=80;break}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(C){break}else{Z=80;break}}else{c[e>>2]=0;Z=78;break}}else{Z=78}}while(0);if((Z|0)==78?C:0){Z=80}if((Z|0)==80){c[j>>2]=c[j>>2]|2}c:do{if(!m){if((a[q]|0)==2){_=f}else{C=f;e=q;while(1){A=C+12|0;B=e+1|0;if((A|0)==(g|0)){Z=85;break c}if((a[B]|0)==2){_=A;break}else{C=A;e=B}}}}else{Z=85}}while(0);if((Z|0)==85){c[j>>2]=c[j>>2]|4;_=g}if((p|0)==0){i=l;return _|0}vn(p);i=l;return _|0}function Rg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Sg(a,0,k,j,f,g,h);i=b;return}function Sg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;e=i;i=i+224|0;l=e+198|0;m=e+196|0;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e;s=e+192|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}Ih(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=a[m]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)?(Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1:0){c[f>>2]=0;z=0}else{z=m}}else{z=0}x=(z|0)==0;A=c[g>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){B=A;break}else{C=A;D=y;break a}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(x){B=A;break}else{C=A;D=y;break a}}else{c[g>>2]=0;E=18;break}}else{E=18}}while(0);if((E|0)==18){E=0;if(x){C=0;D=y;break}else{B=0}}A=a[o]|0;F=(A&1)==0;if(F){G=(A&255)>>>1}else{G=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(G|0)){if(F){H=(A&255)>>>1;I=(A&255)>>>1}else{A=c[h>>2]|0;H=A;I=A}gf(o,H<<1,0);if((a[o]&1)==0){J=10}else{J=(c[o>>2]&-2)+ -1|0}gf(o,J,0);if((a[o]&1)==0){K=v}else{K=c[w>>2]|0}c[p>>2]=K+I;L=K}else{L=y}A=z+12|0;F=c[A>>2]|0;M=z+16|0;if((F|0)==(c[M>>2]|0)){N=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{N=d[F]|0}if((ih(N&255,u,L,p,s,t,n,q,r,l)|0)!=0){C=B;D=L;break}F=c[A>>2]|0;if((F|0)==(c[M>>2]|0)){Ac[c[(c[z>>2]|0)+40>>2]&127](z)|0;m=z;y=L;continue}else{c[A>>2]=F+1;m=z;y=L;continue}}L=a[n]|0;if((L&1)==0){O=(L&255)>>>1}else{O=c[n+4>>2]|0}if((O|0)!=0?(O=c[r>>2]|0,(O-q|0)<160):0){L=c[s>>2]|0;c[r>>2]=O+4;c[O>>2]=L}c[k>>2]=Bm(D,c[p>>2]|0,j,u)|0;Uj(n,q,c[r>>2]|0,j);if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;P=0}else{P=z}}else{P=0}z=(P|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!z){break}c[b>>2]=P;ef(o);ef(n);i=e;return}if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;E=54;break}if(z^(C|0)==0){c[b>>2]=P;ef(o);ef(n);i=e;return}}else{E=54}}while(0);if((E|0)==54?!z:0){c[b>>2]=P;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=P;ef(o);ef(n);i=e;return}function Tg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Ug(a,0,k,j,f,g,h);i=b;return}function Ug(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;e=i;i=i+224|0;l=e+198|0;m=e+196|0;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e;s=e+192|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==8){u=16}else if((t|0)==64){u=8}else{u=10}Ih(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=a[m]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)?(Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1:0){c[f>>2]=0;z=0}else{z=m}}else{z=0}x=(z|0)==0;A=c[g>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){B=A;break}else{C=A;D=y;break a}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(x){B=A;break}else{C=A;D=y;break a}}else{c[g>>2]=0;E=18;break}}else{E=18}}while(0);if((E|0)==18){E=0;if(x){C=0;D=y;break}else{B=0}}A=a[o]|0;F=(A&1)==0;if(F){G=(A&255)>>>1}else{G=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(G|0)){if(F){H=(A&255)>>>1;I=(A&255)>>>1}else{A=c[h>>2]|0;H=A;I=A}gf(o,H<<1,0);if((a[o]&1)==0){K=10}else{K=(c[o>>2]&-2)+ -1|0}gf(o,K,0);if((a[o]&1)==0){L=v}else{L=c[w>>2]|0}c[p>>2]=L+I;M=L}else{M=y}A=z+12|0;F=c[A>>2]|0;N=z+16|0;if((F|0)==(c[N>>2]|0)){O=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{O=d[F]|0}if((ih(O&255,u,M,p,s,t,n,q,r,l)|0)!=0){C=B;D=M;break}F=c[A>>2]|0;if((F|0)==(c[N>>2]|0)){Ac[c[(c[z>>2]|0)+40>>2]&127](z)|0;m=z;y=M;continue}else{c[A>>2]=F+1;m=z;y=M;continue}}M=a[n]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[n+4>>2]|0}if((P|0)!=0?(P=c[r>>2]|0,(P-q|0)<160):0){M=c[s>>2]|0;c[r>>2]=P+4;c[P>>2]=M}M=Am(D,c[p>>2]|0,j,u)|0;u=k;c[u>>2]=M;c[u+4>>2]=J;Uj(n,q,c[r>>2]|0,j);if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;Q=0}else{Q=z}}else{Q=0}z=(Q|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!z){break}c[b>>2]=Q;ef(o);ef(n);i=e;return}if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;E=54;break}if(z^(C|0)==0){c[b>>2]=Q;ef(o);ef(n);i=e;return}}else{E=54}}while(0);if((E|0)==54?!z:0){c[b>>2]=Q;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=Q;ef(o);ef(n);i=e;return}function Vg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Wg(a,0,k,j,f,g,h);i=b;return}function Wg(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;f=i;i=i+224|0;m=f+198|0;n=f+196|0;o=f+4|0;p=f+16|0;q=f+28|0;r=f+32|0;s=f;t=f+192|0;u=c[j+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==0){v=0}else if((u|0)==64){v=8}else{v=10}Ih(o,j,m,n);c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;gf(p,10,0);if((a[p]&1)==0){j=p+1|0;w=j;x=p+8|0;y=j}else{j=p+8|0;w=p+1|0;x=j;y=c[j>>2]|0}c[q>>2]=y;c[s>>2]=r;c[t>>2]=0;j=p+4|0;u=a[n]|0;n=c[g>>2]|0;z=y;a:while(1){if((n|0)!=0){if((c[n+12>>2]|0)==(c[n+16>>2]|0)?(Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1:0){c[g>>2]=0;A=0}else{A=n}}else{A=0}y=(A|0)==0;B=c[h>>2]|0;do{if((B|0)!=0){if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(y){C=B;break}else{D=B;E=z;break a}}if(!((Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0)==-1)){if(y){C=B;break}else{D=B;E=z;break a}}else{c[h>>2]=0;F=18;break}}else{F=18}}while(0);if((F|0)==18){F=0;if(y){D=0;E=z;break}else{C=0}}B=a[p]|0;G=(B&1)==0;if(G){H=(B&255)>>>1}else{H=c[j>>2]|0}if(((c[q>>2]|0)-z|0)==(H|0)){if(G){I=(B&255)>>>1;J=(B&255)>>>1}else{B=c[j>>2]|0;I=B;J=B}gf(p,I<<1,0);if((a[p]&1)==0){K=10}else{K=(c[p>>2]&-2)+ -1|0}gf(p,K,0);if((a[p]&1)==0){L=w}else{L=c[x>>2]|0}c[q>>2]=L+J;M=L}else{M=z}B=A+12|0;G=c[B>>2]|0;N=A+16|0;if((G|0)==(c[N>>2]|0)){O=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{O=d[G]|0}if((ih(O&255,v,M,q,t,u,o,r,s,m)|0)!=0){D=C;E=M;break}G=c[B>>2]|0;if((G|0)==(c[N>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;n=A;z=M;continue}else{c[B>>2]=G+1;n=A;z=M;continue}}M=a[o]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[o+4>>2]|0}if((P|0)!=0?(P=c[s>>2]|0,(P-r|0)<160):0){M=c[t>>2]|0;c[s>>2]=P+4;c[P>>2]=M}b[l>>1]=zm(E,c[q>>2]|0,k,v)|0;Uj(o,r,c[s>>2]|0,k);if((A|0)!=0){if((c[A+12>>2]|0)==(c[A+16>>2]|0)?(Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1:0){c[g>>2]=0;Q=0}else{Q=A}}else{Q=0}A=(Q|0)==0;do{if((D|0)!=0){if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(!A){break}c[e>>2]=Q;ef(p);ef(o);i=f;return}if((Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[h>>2]=0;F=54;break}if(A^(D|0)==0){c[e>>2]=Q;ef(p);ef(o);i=f;return}}else{F=54}}while(0);if((F|0)==54?!A:0){c[e>>2]=Q;ef(p);ef(o);i=f;return}c[k>>2]=c[k>>2]|2;c[e>>2]=Q;ef(p);ef(o);i=f;return}function Xg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Yg(a,0,k,j,f,g,h);i=b;return}function Yg(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;e=i;i=i+224|0;l=e+198|0;m=e+196|0;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e;s=e+192|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==8){u=16}else if((t|0)==64){u=8}else{u=10}Ih(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=a[m]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)?(Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1:0){c[f>>2]=0;z=0}else{z=m}}else{z=0}x=(z|0)==0;A=c[g>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){B=A;break}else{C=A;D=y;break a}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(x){B=A;break}else{C=A;D=y;break a}}else{c[g>>2]=0;E=18;break}}else{E=18}}while(0);if((E|0)==18){E=0;if(x){C=0;D=y;break}else{B=0}}A=a[o]|0;F=(A&1)==0;if(F){G=(A&255)>>>1}else{G=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(G|0)){if(F){H=(A&255)>>>1;I=(A&255)>>>1}else{A=c[h>>2]|0;H=A;I=A}gf(o,H<<1,0);if((a[o]&1)==0){J=10}else{J=(c[o>>2]&-2)+ -1|0}gf(o,J,0);if((a[o]&1)==0){K=v}else{K=c[w>>2]|0}c[p>>2]=K+I;L=K}else{L=y}A=z+12|0;F=c[A>>2]|0;M=z+16|0;if((F|0)==(c[M>>2]|0)){N=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{N=d[F]|0}if((ih(N&255,u,L,p,s,t,n,q,r,l)|0)!=0){C=B;D=L;break}F=c[A>>2]|0;if((F|0)==(c[M>>2]|0)){Ac[c[(c[z>>2]|0)+40>>2]&127](z)|0;m=z;y=L;continue}else{c[A>>2]=F+1;m=z;y=L;continue}}L=a[n]|0;if((L&1)==0){O=(L&255)>>>1}else{O=c[n+4>>2]|0}if((O|0)!=0?(O=c[r>>2]|0,(O-q|0)<160):0){L=c[s>>2]|0;c[r>>2]=O+4;c[O>>2]=L}c[k>>2]=ym(D,c[p>>2]|0,j,u)|0;Uj(n,q,c[r>>2]|0,j);if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;P=0}else{P=z}}else{P=0}z=(P|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!z){break}c[b>>2]=P;ef(o);ef(n);i=e;return}if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;E=54;break}if(z^(C|0)==0){c[b>>2]=P;ef(o);ef(n);i=e;return}}else{E=54}}while(0);if((E|0)==54?!z:0){c[b>>2]=P;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=P;ef(o);ef(n);i=e;return}function Zg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];_g(a,0,k,j,f,g,h);i=b;return}function _g(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;e=i;i=i+224|0;l=e+198|0;m=e+196|0;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e;s=e+192|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}Ih(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=a[m]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)?(Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1:0){c[f>>2]=0;z=0}else{z=m}}else{z=0}x=(z|0)==0;A=c[g>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){B=A;break}else{C=A;D=y;break a}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(x){B=A;break}else{C=A;D=y;break a}}else{c[g>>2]=0;E=18;break}}else{E=18}}while(0);if((E|0)==18){E=0;if(x){C=0;D=y;break}else{B=0}}A=a[o]|0;F=(A&1)==0;if(F){G=(A&255)>>>1}else{G=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(G|0)){if(F){H=(A&255)>>>1;I=(A&255)>>>1}else{A=c[h>>2]|0;H=A;I=A}gf(o,H<<1,0);if((a[o]&1)==0){J=10}else{J=(c[o>>2]&-2)+ -1|0}gf(o,J,0);if((a[o]&1)==0){K=v}else{K=c[w>>2]|0}c[p>>2]=K+I;L=K}else{L=y}A=z+12|0;F=c[A>>2]|0;M=z+16|0;if((F|0)==(c[M>>2]|0)){N=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{N=d[F]|0}if((ih(N&255,u,L,p,s,t,n,q,r,l)|0)!=0){C=B;D=L;break}F=c[A>>2]|0;if((F|0)==(c[M>>2]|0)){Ac[c[(c[z>>2]|0)+40>>2]&127](z)|0;m=z;y=L;continue}else{c[A>>2]=F+1;m=z;y=L;continue}}L=a[n]|0;if((L&1)==0){O=(L&255)>>>1}else{O=c[n+4>>2]|0}if((O|0)!=0?(O=c[r>>2]|0,(O-q|0)<160):0){L=c[s>>2]|0;c[r>>2]=O+4;c[O>>2]=L}c[k>>2]=xm(D,c[p>>2]|0,j,u)|0;Uj(n,q,c[r>>2]|0,j);if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;P=0}else{P=z}}else{P=0}z=(P|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!z){break}c[b>>2]=P;ef(o);ef(n);i=e;return}if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;E=54;break}if(z^(C|0)==0){c[b>>2]=P;ef(o);ef(n);i=e;return}}else{E=54}}while(0);if((E|0)==54?!z:0){c[b>>2]=P;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=P;ef(o);ef(n);i=e;return}function $g(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];ah(a,0,k,j,f,g,h);i=b;return}function ah(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;e=i;i=i+224|0;l=e+198|0;m=e+196|0;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e;s=e+192|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==8){u=16}else if((t|0)==64){u=8}else{u=10}Ih(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=a[m]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)?(Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1:0){c[f>>2]=0;z=0}else{z=m}}else{z=0}x=(z|0)==0;A=c[g>>2]|0;do{if((A|0)!=0){if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){if(x){B=A;break}else{C=A;D=y;break a}}if(!((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1)){if(x){B=A;break}else{C=A;D=y;break a}}else{c[g>>2]=0;E=18;break}}else{E=18}}while(0);if((E|0)==18){E=0;if(x){C=0;D=y;break}else{B=0}}A=a[o]|0;F=(A&1)==0;if(F){G=(A&255)>>>1}else{G=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(G|0)){if(F){H=(A&255)>>>1;I=(A&255)>>>1}else{A=c[h>>2]|0;H=A;I=A}gf(o,H<<1,0);if((a[o]&1)==0){K=10}else{K=(c[o>>2]&-2)+ -1|0}gf(o,K,0);if((a[o]&1)==0){L=v}else{L=c[w>>2]|0}c[p>>2]=L+I;M=L}else{M=y}A=z+12|0;F=c[A>>2]|0;N=z+16|0;if((F|0)==(c[N>>2]|0)){O=Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0}else{O=d[F]|0}if((ih(O&255,u,M,p,s,t,n,q,r,l)|0)!=0){C=B;D=M;break}F=c[A>>2]|0;if((F|0)==(c[N>>2]|0)){Ac[c[(c[z>>2]|0)+40>>2]&127](z)|0;m=z;y=M;continue}else{c[A>>2]=F+1;m=z;y=M;continue}}M=a[n]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[n+4>>2]|0}if((P|0)!=0?(P=c[r>>2]|0,(P-q|0)<160):0){M=c[s>>2]|0;c[r>>2]=P+4;c[P>>2]=M}M=wm(D,c[p>>2]|0,j,u)|0;u=k;c[u>>2]=M;c[u+4>>2]=J;Uj(n,q,c[r>>2]|0,j);if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;Q=0}else{Q=z}}else{Q=0}z=(Q|0)==0;do{if((C|0)!=0){if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){if(!z){break}c[b>>2]=Q;ef(o);ef(n);i=e;return}if((Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1){c[g>>2]=0;E=54;break}if(z^(C|0)==0){c[b>>2]=Q;ef(o);ef(n);i=e;return}}else{E=54}}while(0);if((E|0)==54?!z:0){c[b>>2]=Q;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=Q;ef(o);ef(n);i=e;return}function bh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];ch(a,0,k,j,f,g,h);i=b;return}function ch(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;e=i;i=i+240|0;m=e+200|0;n=e+199|0;o=e+198|0;p=e+8|0;q=e+20|0;r=e+192|0;s=e+32|0;t=e;u=e+4|0;v=e+197|0;w=e+196|0;Jh(p,j,m,n,o);c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;gf(q,10,0);if((a[q]&1)==0){j=q+1|0;x=j;y=q+8|0;z=j}else{j=q+8|0;x=q+1|0;y=j;z=c[j>>2]|0}c[r>>2]=z;c[t>>2]=s;c[u>>2]=0;a[v]=1;a[w]=69;j=q+4|0;A=a[n]|0;n=a[o]|0;o=c[f>>2]|0;B=z;a:while(1){if((o|0)!=0){if((c[o+12>>2]|0)==(c[o+16>>2]|0)?(Ac[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1:0){c[f>>2]=0;C=0}else{C=o}}else{C=0}z=(C|0)==0;D=c[h>>2]|0;do{if((D|0)!=0){if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(z){E=D;break}else{F=D;G=B;break a}}if(!((Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){if(z){E=D;break}else{F=D;G=B;break a}}else{c[h>>2]=0;H=14;break}}else{H=14}}while(0);if((H|0)==14){H=0;if(z){F=0;G=B;break}else{E=0}}D=a[q]|0;I=(D&1)==0;if(I){J=(D&255)>>>1}else{J=c[j>>2]|0}if(((c[r>>2]|0)-B|0)==(J|0)){if(I){K=(D&255)>>>1;L=(D&255)>>>1}else{D=c[j>>2]|0;K=D;L=D}gf(q,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[q>>2]&-2)+ -1|0}gf(q,M,0);if((a[q]&1)==0){N=x}else{N=c[y>>2]|0}c[r>>2]=N+L;O=N}else{O=B}D=C+12|0;I=c[D>>2]|0;P=C+16|0;if((I|0)==(c[P>>2]|0)){Q=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{Q=d[I]|0}if((Kh(Q&255,v,w,O,r,A,n,p,s,t,u,m)|0)!=0){F=E;G=O;break}I=c[D>>2]|0;if((I|0)==(c[P>>2]|0)){Ac[c[(c[C>>2]|0)+40>>2]&127](C)|0;o=C;B=O;continue}else{c[D>>2]=I+1;o=C;B=O;continue}}O=a[p]|0;if((O&1)==0){R=(O&255)>>>1}else{R=c[p+4>>2]|0}if(((R|0)!=0?(a[v]|0)!=0:0)?(v=c[t>>2]|0,(v-s|0)<160):0){R=c[u>>2]|0;c[t>>2]=v+4;c[v>>2]=R}g[l>>2]=+vm(G,c[r>>2]|0,k);Uj(p,s,c[t>>2]|0,k);if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)?(Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1:0){c[f>>2]=0;S=0}else{S=C}}else{S=0}C=(S|0)==0;do{if((F|0)!=0){if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!C){break}c[b>>2]=S;ef(q);ef(p);i=e;return}if((Ac[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[h>>2]=0;H=51;break}if(C^(F|0)==0){c[b>>2]=S;ef(q);ef(p);i=e;return}}else{H=51}}while(0);if((H|0)==51?!C:0){c[b>>2]=S;ef(q);ef(p);i=e;return}c[k>>2]=c[k>>2]|2;c[b>>2]=S;ef(q);ef(p);i=e;return}function dh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];eh(a,0,k,j,f,g,h);i=b;return}function eh(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;e=i;i=i+240|0;m=e+200|0;n=e+199|0;o=e+198|0;p=e+8|0;q=e+20|0;r=e+192|0;s=e+32|0;t=e;u=e+4|0;v=e+197|0;w=e+196|0;Jh(p,j,m,n,o);c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;gf(q,10,0);if((a[q]&1)==0){j=q+1|0;x=j;y=q+8|0;z=j}else{j=q+8|0;x=q+1|0;y=j;z=c[j>>2]|0}c[r>>2]=z;c[t>>2]=s;c[u>>2]=0;a[v]=1;a[w]=69;j=q+4|0;A=a[n]|0;n=a[o]|0;o=c[f>>2]|0;B=z;a:while(1){if((o|0)!=0){if((c[o+12>>2]|0)==(c[o+16>>2]|0)?(Ac[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1:0){c[f>>2]=0;C=0}else{C=o}}else{C=0}z=(C|0)==0;D=c[g>>2]|0;do{if((D|0)!=0){if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(z){E=D;break}else{F=D;G=B;break a}}if(!((Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){if(z){E=D;break}else{F=D;G=B;break a}}else{c[g>>2]=0;H=14;break}}else{H=14}}while(0);if((H|0)==14){H=0;if(z){F=0;G=B;break}else{E=0}}D=a[q]|0;I=(D&1)==0;if(I){J=(D&255)>>>1}else{J=c[j>>2]|0}if(((c[r>>2]|0)-B|0)==(J|0)){if(I){K=(D&255)>>>1;L=(D&255)>>>1}else{D=c[j>>2]|0;K=D;L=D}gf(q,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[q>>2]&-2)+ -1|0}gf(q,M,0);if((a[q]&1)==0){N=x}else{N=c[y>>2]|0}c[r>>2]=N+L;O=N}else{O=B}D=C+12|0;I=c[D>>2]|0;P=C+16|0;if((I|0)==(c[P>>2]|0)){Q=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{Q=d[I]|0}if((Kh(Q&255,v,w,O,r,A,n,p,s,t,u,m)|0)!=0){F=E;G=O;break}I=c[D>>2]|0;if((I|0)==(c[P>>2]|0)){Ac[c[(c[C>>2]|0)+40>>2]&127](C)|0;o=C;B=O;continue}else{c[D>>2]=I+1;o=C;B=O;continue}}O=a[p]|0;if((O&1)==0){R=(O&255)>>>1}else{R=c[p+4>>2]|0}if(((R|0)!=0?(a[v]|0)!=0:0)?(v=c[t>>2]|0,(v-s|0)<160):0){R=c[u>>2]|0;c[t>>2]=v+4;c[v>>2]=R}h[l>>3]=+um(G,c[r>>2]|0,k);Uj(p,s,c[t>>2]|0,k);if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)?(Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1:0){c[f>>2]=0;S=0}else{S=C}}else{S=0}C=(S|0)==0;do{if((F|0)!=0){if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!C){break}c[b>>2]=S;ef(q);ef(p);i=e;return}if((Ac[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[g>>2]=0;H=51;break}if(C^(F|0)==0){c[b>>2]=S;ef(q);ef(p);i=e;return}}else{H=51}}while(0);if((H|0)==51?!C:0){c[b>>2]=S;ef(q);ef(p);i=e;return}c[k>>2]=c[k>>2]|2;c[b>>2]=S;ef(q);ef(p);i=e;return}function fh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];gh(a,0,k,j,f,g,h);i=b;return}function gh(b,e,f,g,j,k,l){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;e=i;i=i+240|0;m=e+200|0;n=e+199|0;o=e+198|0;p=e+8|0;q=e+20|0;r=e+192|0;s=e+32|0;t=e;u=e+4|0;v=e+197|0;w=e+196|0;Jh(p,j,m,n,o);c[q+0>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;gf(q,10,0);if((a[q]&1)==0){j=q+1|0;x=j;y=q+8|0;z=j}else{j=q+8|0;x=q+1|0;y=j;z=c[j>>2]|0}c[r>>2]=z;c[t>>2]=s;c[u>>2]=0;a[v]=1;a[w]=69;j=q+4|0;A=a[n]|0;n=a[o]|0;o=c[f>>2]|0;B=z;a:while(1){if((o|0)!=0){if((c[o+12>>2]|0)==(c[o+16>>2]|0)?(Ac[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1:0){c[f>>2]=0;C=0}else{C=o}}else{C=0}z=(C|0)==0;D=c[g>>2]|0;do{if((D|0)!=0){if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(z){E=D;break}else{F=D;G=B;break a}}if(!((Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){if(z){E=D;break}else{F=D;G=B;break a}}else{c[g>>2]=0;H=14;break}}else{H=14}}while(0);if((H|0)==14){H=0;if(z){F=0;G=B;break}else{E=0}}D=a[q]|0;I=(D&1)==0;if(I){J=(D&255)>>>1}else{J=c[j>>2]|0}if(((c[r>>2]|0)-B|0)==(J|0)){if(I){K=(D&255)>>>1;L=(D&255)>>>1}else{D=c[j>>2]|0;K=D;L=D}gf(q,K<<1,0);if((a[q]&1)==0){M=10}else{M=(c[q>>2]&-2)+ -1|0}gf(q,M,0);if((a[q]&1)==0){N=x}else{N=c[y>>2]|0}c[r>>2]=N+L;O=N}else{O=B}D=C+12|0;I=c[D>>2]|0;P=C+16|0;if((I|0)==(c[P>>2]|0)){Q=Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{Q=d[I]|0}if((Kh(Q&255,v,w,O,r,A,n,p,s,t,u,m)|0)!=0){F=E;G=O;break}I=c[D>>2]|0;if((I|0)==(c[P>>2]|0)){Ac[c[(c[C>>2]|0)+40>>2]&127](C)|0;o=C;B=O;continue}else{c[D>>2]=I+1;o=C;B=O;continue}}O=a[p]|0;if((O&1)==0){R=(O&255)>>>1}else{R=c[p+4>>2]|0}if(((R|0)!=0?(a[v]|0)!=0:0)?(v=c[t>>2]|0,(v-s|0)<160):0){R=c[u>>2]|0;c[t>>2]=v+4;c[v>>2]=R}h[l>>3]=+tm(G,c[r>>2]|0,k);Uj(p,s,c[t>>2]|0,k);if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)?(Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1:0){c[f>>2]=0;S=0}else{S=C}}else{S=0}C=(S|0)==0;do{if((F|0)!=0){if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!C){break}c[b>>2]=S;ef(q);ef(p);i=e;return}if((Ac[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[g>>2]=0;H=51;break}if(C^(F|0)==0){c[b>>2]=S;ef(q);ef(p);i=e;return}}else{H=51}}while(0);if((H|0)==51?!C:0){c[b>>2]=S;ef(q);ef(p);i=e;return}c[k>>2]=c[k>>2]|2;c[b>>2]=S;ef(q);ef(p);i=e;return}function hh(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+240|0;l=e;m=e+200|0;n=e+12|0;o=e+24|0;p=e+28|0;q=e+40|0;c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;zf(o,h);h=c[o>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}r=(c[17876>>2]|0)+ -1|0;s=c[h+8>>2]|0;if(!((c[h+12>>2]|0)-s>>2>>>0>r>>>0)){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}h=c[s+(r<<2)>>2]|0;if((h|0)==0){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}Cc[c[(c[h>>2]|0)+32>>2]&7](h,16416,16442|0,m)|0;Fe(c[o>>2]|0)|0;c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;gf(p,10,0);if((a[p]&1)==0){o=p+1|0;u=o;v=p+8|0;w=o}else{o=p+8|0;u=p+1|0;v=o;w=c[o>>2]|0}o=p+4|0;h=m+24|0;t=m+25|0;r=q;s=m+26|0;x=m;y=n+4|0;z=c[f>>2]|0;A=q;q=0;B=w;C=w;a:while(1){if((z|0)!=0){if((c[z+12>>2]|0)==(c[z+16>>2]|0)?(Ac[c[(c[z>>2]|0)+36>>2]&127](z)|0)==-1:0){c[f>>2]=0;D=0}else{D=z}}else{D=0}w=(D|0)==0;E=c[g>>2]|0;do{if((E|0)!=0){if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){if(w){break}else{F=C;break a}}if(!((Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0)==-1)){if(w){break}else{F=C;break a}}else{c[g>>2]=0;G=19;break}}else{G=19}}while(0);if((G|0)==19?(G=0,w):0){F=C;break}E=a[p]|0;H=(E&1)==0;if(H){I=(E&255)>>>1}else{I=c[o>>2]|0}if((B-C|0)==(I|0)){if(H){J=(E&255)>>>1;K=(E&255)>>>1}else{E=c[o>>2]|0;J=E;K=E}gf(p,J<<1,0);if((a[p]&1)==0){L=10}else{L=(c[p>>2]&-2)+ -1|0}gf(p,L,0);if((a[p]&1)==0){M=u}else{M=c[v>>2]|0}N=M+K|0;O=M}else{N=B;O=C}E=c[D+12>>2]|0;if((E|0)==(c[D+16>>2]|0)){P=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{P=d[E]|0}E=P&255;H=(N|0)==(O|0);do{if(H){Q=(a[h]|0)==E<<24>>24;if(!Q?!((a[t]|0)==E<<24>>24):0){G=40;break}a[N]=Q?43:45;R=N+1|0;S=A;T=0}else{G=40}}while(0);do{if((G|0)==40){G=0;w=a[n]|0;if((w&1)==0){U=(w&255)>>>1}else{U=c[y>>2]|0}if((U|0)!=0&E<<24>>24==0){if((A-r|0)>=160){R=N;S=A;T=q;break}c[A>>2]=q;R=N;S=A+4|0;T=0;break}else{V=m}while(1){w=V+1|0;if((a[V]|0)==E<<24>>24){W=V;break}if((w|0)==(s|0)){W=s;break}else{V=w}}w=W-x|0;if((w|0)>23){F=O;break a}if((w|0)<22){a[N]=a[16416+w|0]|0;R=N+1|0;S=A;T=q+1|0;break}if(H){F=N;break a}if((N-O|0)>=3){F=O;break a}if((a[N+ -1|0]|0)!=48){F=O;break a}a[N]=a[16416+w|0]|0;R=N+1|0;S=A;T=0}}while(0);H=c[f>>2]|0;E=H+12|0;w=c[E>>2]|0;if((w|0)==(c[H+16>>2]|0)){Ac[c[(c[H>>2]|0)+40>>2]&127](H)|0;z=H;A=S;q=T;B=R;C=O;continue}else{c[E>>2]=w+1;z=H;A=S;q=T;B=R;C=O;continue}}a[F+3|0]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}O=c[4440]|0;c[l>>2]=k;if((jh(F,O,16456,l)|0)!=1){c[j>>2]=4}l=c[f>>2]|0;if((l|0)!=0){if((c[l+12>>2]|0)==(c[l+16>>2]|0)?(Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1:0){c[f>>2]=0;X=0}else{X=l}}else{X=0}l=(X|0)==0;f=c[g>>2]|0;do{if((f|0)!=0){if((c[f+12>>2]|0)!=(c[f+16>>2]|0)){if(!l){break}c[b>>2]=X;ef(p);ef(n);i=e;return}if((Ac[c[(c[f>>2]|0)+36>>2]&127](f)|0)==-1){c[g>>2]=0;G=72;break}if(l^(f|0)==0){c[b>>2]=X;ef(p);ef(n);i=e;return}}else{G=72}}while(0);if((G|0)==72?!l:0){c[b>>2]=X;ef(p);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[b>>2]=X;ef(p);ef(n);i=e;return}function ih(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;o=c[f>>2]|0;p=(o|0)==(e|0);do{if(p){q=(a[m+24|0]|0)==b<<24>>24;if(!q?!((a[m+25|0]|0)==b<<24>>24):0){break}c[f>>2]=e+1;a[e]=q?43:45;c[g>>2]=0;r=0;i=n;return r|0}}while(0);q=a[j]|0;if((q&1)==0){s=(q&255)>>>1}else{s=c[j+4>>2]|0}if((s|0)!=0&b<<24>>24==h<<24>>24){h=c[l>>2]|0;if((h-k|0)>=160){r=0;i=n;return r|0}k=c[g>>2]|0;c[l>>2]=h+4;c[h>>2]=k;c[g>>2]=0;r=0;i=n;return r|0}k=m+26|0;h=m;while(1){l=h+1|0;if((a[h]|0)==b<<24>>24){t=h;break}if((l|0)==(k|0)){t=k;break}else{h=l}}h=t-m|0;if((h|0)>23){r=-1;i=n;return r|0}if((d|0)==10|(d|0)==8){if((h|0)>=(d|0)){r=-1;i=n;return r|0}}else if((d|0)==16?(h|0)>=22:0){if(p){r=-1;i=n;return r|0}if((o-e|0)>=3){r=-1;i=n;return r|0}if((a[o+ -1|0]|0)!=48){r=-1;i=n;return r|0}c[g>>2]=0;e=a[16416+h|0]|0;c[f>>2]=o+1;a[o]=e;r=0;i=n;return r|0}e=a[16416+h|0]|0;c[f>>2]=o+1;a[o]=e;c[g>>2]=(c[g>>2]|0)+1;r=0;i=n;return r|0}function jh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;c[g>>2]=e;e=Kb(b|0)|0;b=Ja(a|0,d|0,g|0)|0;if((e|0)==0){i=f;return b|0}Kb(e|0)|0;i=f;return b|0}function kh(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function lh(a){a=a|0;return}function mh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;k=i;i=i+80|0;l=k;m=k+64|0;n=k+60|0;o=k+56|0;p=k+52|0;q=k+68|0;r=k+16|0;s=k+12|0;t=k+24|0;u=k+48|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;v=c[(c[d>>2]|0)+16>>2]|0;c[p>>2]=c[e>>2];c[q>>2]=c[f>>2];c[m+0>>2]=c[p+0>>2];c[l+0>>2]=c[q+0>>2];Ic[v&63](o,d,m,l,g,h,n);m=c[o>>2]|0;c[e>>2]=m;o=c[n>>2]|0;if((o|0)==0){a[j]=0}else if((o|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=m;i=k;return}zf(r,g);m=c[r>>2]|0;if(!((c[4466]|0)==-1)){c[l>>2]=17864;c[l+4>>2]=117;c[l+8>>2]=0;$e(17864,l,118)}o=(c[17868>>2]|0)+ -1|0;n=c[m+8>>2]|0;if(!((c[m+12>>2]|0)-n>>2>>>0>o>>>0)){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}m=c[n+(o<<2)>>2]|0;if((m|0)==0){w=Gb(4)|0;_m(w);pc(w|0,25832,102)}Fe(c[r>>2]|0)|0;zf(s,g);g=c[s>>2]|0;if(!((c[4506]|0)==-1)){c[l>>2]=18024;c[l+4>>2]=117;c[l+8>>2]=0;$e(18024,l,118)}r=(c[18028>>2]|0)+ -1|0;w=c[g+8>>2]|0;if(!((c[g+12>>2]|0)-w>>2>>>0>r>>>0)){x=Gb(4)|0;_m(x);pc(x|0,25832,102)}g=c[w+(r<<2)>>2]|0;if((g|0)==0){x=Gb(4)|0;_m(x);pc(x|0,25832,102)}Fe(c[s>>2]|0)|0;zc[c[(c[g>>2]|0)+24>>2]&63](t,g);zc[c[(c[g>>2]|0)+28>>2]&63](t+12|0,g);c[u>>2]=c[f>>2];f=t+24|0;c[l+0>>2]=c[u+0>>2];a[j]=(nh(e,l,t,f,m,h,1)|0)==(t|0)|0;c[b>>2]=c[e>>2];qf(t+12|0);qf(t);i=k;return}function nh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;k=i;i=i+112|0;l=k;m=(f-e|0)/12|0;if(m>>>0>100){n=un(m)|0;if((n|0)==0){Hn()}else{o=n;p=n}}else{o=0;p=l}l=(e|0)==(f|0);if(l){q=0;r=m}else{n=e;s=0;t=m;m=p;while(1){u=a[n]|0;if((u&1)==0){v=(u&255)>>>1}else{v=c[n+4>>2]|0}if((v|0)==0){a[m]=2;w=s+1|0;x=t+ -1|0}else{a[m]=1;w=s;x=t}u=n+12|0;if((u|0)==(f|0)){q=w;r=x;break}else{n=u;s=w;t=x;m=m+1|0}}}m=0;x=q;q=r;a:while(1){r=c[b>>2]|0;do{if((r|0)!=0){t=c[r+12>>2]|0;if((t|0)==(c[r+16>>2]|0)){y=Ac[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{y=c[t>>2]|0}if((y|0)==-1){c[b>>2]=0;z=1;break}else{z=(c[b>>2]|0)==0;break}}else{z=1}}while(0);r=c[d>>2]|0;if((r|0)!=0){t=c[r+12>>2]|0;if((t|0)==(c[r+16>>2]|0)){A=Ac[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{A=c[t>>2]|0}if((A|0)==-1){c[d>>2]=0;B=0;C=1}else{B=r;C=0}}else{B=0;C=1}D=c[b>>2]|0;if(!((z^C)&(q|0)!=0)){break}r=c[D+12>>2]|0;if((r|0)==(c[D+16>>2]|0)){E=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{E=c[r>>2]|0}if(j){F=E}else{F=Lc[c[(c[g>>2]|0)+28>>2]&31](g,E)|0}r=m+1|0;if(l){m=r;continue}b:do{if(j){t=0;w=e;s=x;n=q;v=p;while(1){do{if((a[v]|0)==1){u=a[w]|0;G=(u&1)==0;if(G){H=w+4|0}else{H=c[w+8>>2]|0}if((F|0)!=(c[H+(m<<2)>>2]|0)){a[v]=0;I=t;J=s;K=n+ -1|0;break}if(G){L=(u&255)>>>1}else{L=c[w+4>>2]|0}if((L|0)==(r|0)){a[v]=2;I=1;J=s+1|0;K=n+ -1|0}else{I=1;J=s;K=n}}else{I=t;J=s;K=n}}while(0);u=w+12|0;if((u|0)==(f|0)){M=I;N=J;O=K;break b}t=I;w=u;s=J;n=K;v=v+1|0}}else{v=0;n=e;s=x;w=q;t=p;while(1){do{if((a[t]|0)==1){if((a[n]&1)==0){P=n+4|0}else{P=c[n+8>>2]|0}if((F|0)!=(Lc[c[(c[g>>2]|0)+28>>2]&31](g,c[P+(m<<2)>>2]|0)|0)){a[t]=0;Q=v;R=s;S=w+ -1|0;break}u=a[n]|0;if((u&1)==0){T=(u&255)>>>1}else{T=c[n+4>>2]|0}if((T|0)==(r|0)){a[t]=2;Q=1;R=s+1|0;S=w+ -1|0}else{Q=1;R=s;S=w}}else{Q=v;R=s;S=w}}while(0);u=n+12|0;if((u|0)==(f|0)){M=Q;N=R;O=S;break b}v=Q;n=u;s=R;w=S;t=t+1|0}}}while(0);if(!M){m=r;x=N;q=O;continue}t=c[b>>2]|0;w=t+12|0;s=c[w>>2]|0;if((s|0)==(c[t+16>>2]|0)){Ac[c[(c[t>>2]|0)+40>>2]&127](t)|0}else{c[w>>2]=s+4}if((O+N|0)>>>0<2){m=r;x=N;q=O;continue}else{U=e;V=N;W=p}while(1){if((a[W]|0)==2){s=a[U]|0;if((s&1)==0){X=(s&255)>>>1}else{X=c[U+4>>2]|0}if((X|0)!=(r|0)){a[W]=0;Y=V+ -1|0}else{Y=V}}else{Y=V}s=U+12|0;if((s|0)==(f|0)){m=r;x=Y;q=O;continue a}else{U=s;V=Y;W=W+1|0}}}do{if((D|0)!=0){W=c[D+12>>2]|0;if((W|0)==(c[D+16>>2]|0)){Z=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{Z=c[W>>2]|0}if((Z|0)==-1){c[b>>2]=0;_=1;break}else{_=(c[b>>2]|0)==0;break}}else{_=1}}while(0);do{if((B|0)!=0){b=c[B+12>>2]|0;if((b|0)==(c[B+16>>2]|0)){$=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{$=c[b>>2]|0}if(!(($|0)==-1)){if(_){break}else{aa=87;break}}else{c[d>>2]=0;aa=85;break}}else{aa=85}}while(0);if((aa|0)==85?_:0){aa=87}if((aa|0)==87){c[h>>2]=c[h>>2]|2}c:do{if(!l){if((a[p]|0)==2){ba=e}else{_=e;d=p;while(1){$=_+12|0;B=d+1|0;if(($|0)==(f|0)){aa=92;break c}if((a[B]|0)==2){ba=$;break}else{_=$;d=B}}}}else{aa=92}}while(0);if((aa|0)==92){c[h>>2]=c[h>>2]|4;ba=f}if((o|0)==0){i=k;return ba|0}vn(o);i=k;return ba|0}function oh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];ph(a,0,k,j,f,g,h);i=b;return}function ph(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;d=i;i=i+304|0;k=d+200|0;l=d;m=d+4|0;n=d+16|0;o=d+28|0;p=d+32|0;q=d+192|0;r=d+196|0;s=c[g+4>>2]&74;if((s|0)==8){t=16}else if((s|0)==0){t=0}else if((s|0)==64){t=8}else{t=10}Lh(m,g,k,l);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;gf(n,10,0);if((a[n]&1)==0){g=n+1|0;u=g;v=n+8|0;w=g}else{g=n+8|0;u=n+1|0;v=g;w=c[g>>2]|0}c[o>>2]=w;c[q>>2]=p;c[r>>2]=0;g=n+4|0;s=c[l>>2]|0;l=c[e>>2]|0;x=w;a:while(1){if((l|0)!=0){w=c[l+12>>2]|0;if((w|0)==(c[l+16>>2]|0)){y=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{y=c[w>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;A=0}else{z=0;A=l}}else{z=1;A=0}w=c[f>>2]|0;do{if((w|0)!=0){B=c[w+12>>2]|0;if((B|0)==(c[w+16>>2]|0)){C=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{C=c[B>>2]|0}if(!((C|0)==-1)){if(z){D=w;break}else{E=w;F=x;break a}}else{c[f>>2]=0;G=21;break}}else{G=21}}while(0);if((G|0)==21){G=0;if(z){E=0;F=x;break}else{D=0}}w=a[n]|0;B=(w&1)==0;if(B){H=(w&255)>>>1}else{H=c[g>>2]|0}if(((c[o>>2]|0)-x|0)==(H|0)){if(B){I=(w&255)>>>1;J=(w&255)>>>1}else{w=c[g>>2]|0;I=w;J=w}gf(n,I<<1,0);if((a[n]&1)==0){K=10}else{K=(c[n>>2]&-2)+ -1|0}gf(n,K,0);if((a[n]&1)==0){L=u}else{L=c[v>>2]|0}c[o>>2]=L+J;M=L}else{M=x}w=A+12|0;B=c[w>>2]|0;N=A+16|0;if((B|0)==(c[N>>2]|0)){O=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{O=c[B>>2]|0}if((Hh(O,t,M,o,r,s,m,p,q,k)|0)!=0){E=D;F=M;break}B=c[w>>2]|0;if((B|0)==(c[N>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;l=A;x=M;continue}else{c[w>>2]=B+4;l=A;x=M;continue}}M=a[m]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[m+4>>2]|0}if((P|0)!=0?(P=c[q>>2]|0,(P-p|0)<160):0){M=c[r>>2]|0;c[q>>2]=P+4;c[P>>2]=M}c[j>>2]=Bm(F,c[o>>2]|0,h,t)|0;Uj(m,p,c[q>>2]|0,h);if((A|0)!=0){q=c[A+12>>2]|0;if((q|0)==(c[A+16>>2]|0)){Q=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{Q=c[q>>2]|0}if((Q|0)==-1){c[e>>2]=0;R=0;S=1}else{R=A;S=0}}else{R=0;S=1}do{if((E|0)!=0){A=c[E+12>>2]|0;if((A|0)==(c[E+16>>2]|0)){T=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{T=c[A>>2]|0}if((T|0)==-1){c[f>>2]=0;G=60;break}if(S){c[b>>2]=R;ef(n);ef(m);i=d;return}}else{G=60}}while(0);if((G|0)==60?!S:0){c[b>>2]=R;ef(n);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=R;ef(n);ef(m);i=d;return}function qh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];rh(a,0,k,j,f,g,h);i=b;return}function rh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+304|0;k=d+200|0;l=d;m=d+4|0;n=d+16|0;o=d+28|0;p=d+32|0;q=d+192|0;r=d+196|0;s=c[g+4>>2]&74;if((s|0)==0){t=0}else if((s|0)==8){t=16}else if((s|0)==64){t=8}else{t=10}Lh(m,g,k,l);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;gf(n,10,0);if((a[n]&1)==0){g=n+1|0;u=g;v=n+8|0;w=g}else{g=n+8|0;u=n+1|0;v=g;w=c[g>>2]|0}c[o>>2]=w;c[q>>2]=p;c[r>>2]=0;g=n+4|0;s=c[l>>2]|0;l=c[e>>2]|0;x=w;a:while(1){if((l|0)!=0){w=c[l+12>>2]|0;if((w|0)==(c[l+16>>2]|0)){y=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{y=c[w>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;A=0}else{z=0;A=l}}else{z=1;A=0}w=c[f>>2]|0;do{if((w|0)!=0){B=c[w+12>>2]|0;if((B|0)==(c[w+16>>2]|0)){C=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{C=c[B>>2]|0}if(!((C|0)==-1)){if(z){D=w;break}else{E=w;F=x;break a}}else{c[f>>2]=0;G=21;break}}else{G=21}}while(0);if((G|0)==21){G=0;if(z){E=0;F=x;break}else{D=0}}w=a[n]|0;B=(w&1)==0;if(B){H=(w&255)>>>1}else{H=c[g>>2]|0}if(((c[o>>2]|0)-x|0)==(H|0)){if(B){I=(w&255)>>>1;K=(w&255)>>>1}else{w=c[g>>2]|0;I=w;K=w}gf(n,I<<1,0);if((a[n]&1)==0){L=10}else{L=(c[n>>2]&-2)+ -1|0}gf(n,L,0);if((a[n]&1)==0){M=u}else{M=c[v>>2]|0}c[o>>2]=M+K;N=M}else{N=x}w=A+12|0;B=c[w>>2]|0;O=A+16|0;if((B|0)==(c[O>>2]|0)){P=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{P=c[B>>2]|0}if((Hh(P,t,N,o,r,s,m,p,q,k)|0)!=0){E=D;F=N;break}B=c[w>>2]|0;if((B|0)==(c[O>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;l=A;x=N;continue}else{c[w>>2]=B+4;l=A;x=N;continue}}N=a[m]|0;if((N&1)==0){Q=(N&255)>>>1}else{Q=c[m+4>>2]|0}if((Q|0)!=0?(Q=c[q>>2]|0,(Q-p|0)<160):0){N=c[r>>2]|0;c[q>>2]=Q+4;c[Q>>2]=N}N=Am(F,c[o>>2]|0,h,t)|0;t=j;c[t>>2]=N;c[t+4>>2]=J;Uj(m,p,c[q>>2]|0,h);if((A|0)!=0){q=c[A+12>>2]|0;if((q|0)==(c[A+16>>2]|0)){R=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{R=c[q>>2]|0}if((R|0)==-1){c[e>>2]=0;S=0;T=1}else{S=A;T=0}}else{S=0;T=1}do{if((E|0)!=0){A=c[E+12>>2]|0;if((A|0)==(c[E+16>>2]|0)){U=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{U=c[A>>2]|0}if((U|0)==-1){c[f>>2]=0;G=60;break}if(T){c[b>>2]=S;ef(n);ef(m);i=d;return}}else{G=60}}while(0);if((G|0)==60?!T:0){c[b>>2]=S;ef(n);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=S;ef(n);ef(m);i=d;return}function sh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];th(a,0,k,j,f,g,h);i=b;return}function th(d,e,f,g,h,j,k){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;e=i;i=i+304|0;l=e+200|0;m=e;n=e+4|0;o=e+16|0;p=e+28|0;q=e+32|0;r=e+192|0;s=e+196|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}Lh(n,h,l,m);c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){h=o+1|0;v=h;w=o+8|0;x=h}else{h=o+8|0;v=o+1|0;w=h;x=c[h>>2]|0}c[p>>2]=x;c[r>>2]=q;c[s>>2]=0;h=o+4|0;t=c[m>>2]|0;m=c[f>>2]|0;y=x;a:while(1){if((m|0)!=0){x=c[m+12>>2]|0;if((x|0)==(c[m+16>>2]|0)){z=Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{z=c[x>>2]|0}if((z|0)==-1){c[f>>2]=0;A=1;B=0}else{A=0;B=m}}else{A=1;B=0}x=c[g>>2]|0;do{if((x|0)!=0){C=c[x+12>>2]|0;if((C|0)==(c[x+16>>2]|0)){D=Ac[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{D=c[C>>2]|0}if(!((D|0)==-1)){if(A){E=x;break}else{F=x;G=y;break a}}else{c[g>>2]=0;H=21;break}}else{H=21}}while(0);if((H|0)==21){H=0;if(A){F=0;G=y;break}else{E=0}}x=a[o]|0;C=(x&1)==0;if(C){I=(x&255)>>>1}else{I=c[h>>2]|0}if(((c[p>>2]|0)-y|0)==(I|0)){if(C){J=(x&255)>>>1;K=(x&255)>>>1}else{x=c[h>>2]|0;J=x;K=x}gf(o,J<<1,0);if((a[o]&1)==0){L=10}else{L=(c[o>>2]&-2)+ -1|0}gf(o,L,0);if((a[o]&1)==0){M=v}else{M=c[w>>2]|0}c[p>>2]=M+K;N=M}else{N=y}x=B+12|0;C=c[x>>2]|0;O=B+16|0;if((C|0)==(c[O>>2]|0)){P=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{P=c[C>>2]|0}if((Hh(P,u,N,p,s,t,n,q,r,l)|0)!=0){F=E;G=N;break}C=c[x>>2]|0;if((C|0)==(c[O>>2]|0)){Ac[c[(c[B>>2]|0)+40>>2]&127](B)|0;m=B;y=N;continue}else{c[x>>2]=C+4;m=B;y=N;continue}}N=a[n]|0;if((N&1)==0){Q=(N&255)>>>1}else{Q=c[n+4>>2]|0}if((Q|0)!=0?(Q=c[r>>2]|0,(Q-q|0)<160):0){N=c[s>>2]|0;c[r>>2]=Q+4;c[Q>>2]=N}b[k>>1]=zm(G,c[p>>2]|0,j,u)|0;Uj(n,q,c[r>>2]|0,j);if((B|0)!=0){r=c[B+12>>2]|0;if((r|0)==(c[B+16>>2]|0)){R=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{R=c[r>>2]|0}if((R|0)==-1){c[f>>2]=0;S=0;T=1}else{S=B;T=0}}else{S=0;T=1}do{if((F|0)!=0){B=c[F+12>>2]|0;if((B|0)==(c[F+16>>2]|0)){U=Ac[c[(c[F>>2]|0)+36>>2]&127](F)|0}else{U=c[B>>2]|0}if((U|0)==-1){c[g>>2]=0;H=60;break}if(T){c[d>>2]=S;ef(o);ef(n);i=e;return}}else{H=60}}while(0);if((H|0)==60?!T:0){c[d>>2]=S;ef(o);ef(n);i=e;return}c[j>>2]=c[j>>2]|2;c[d>>2]=S;ef(o);ef(n);i=e;return}function uh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];vh(a,0,k,j,f,g,h);i=b;return}function vh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;d=i;i=i+304|0;k=d+200|0;l=d;m=d+4|0;n=d+16|0;o=d+28|0;p=d+32|0;q=d+192|0;r=d+196|0;s=c[g+4>>2]&74;if((s|0)==0){t=0}else if((s|0)==8){t=16}else if((s|0)==64){t=8}else{t=10}Lh(m,g,k,l);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;gf(n,10,0);if((a[n]&1)==0){g=n+1|0;u=g;v=n+8|0;w=g}else{g=n+8|0;u=n+1|0;v=g;w=c[g>>2]|0}c[o>>2]=w;c[q>>2]=p;c[r>>2]=0;g=n+4|0;s=c[l>>2]|0;l=c[e>>2]|0;x=w;a:while(1){if((l|0)!=0){w=c[l+12>>2]|0;if((w|0)==(c[l+16>>2]|0)){y=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{y=c[w>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;A=0}else{z=0;A=l}}else{z=1;A=0}w=c[f>>2]|0;do{if((w|0)!=0){B=c[w+12>>2]|0;if((B|0)==(c[w+16>>2]|0)){C=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{C=c[B>>2]|0}if(!((C|0)==-1)){if(z){D=w;break}else{E=w;F=x;break a}}else{c[f>>2]=0;G=21;break}}else{G=21}}while(0);if((G|0)==21){G=0;if(z){E=0;F=x;break}else{D=0}}w=a[n]|0;B=(w&1)==0;if(B){H=(w&255)>>>1}else{H=c[g>>2]|0}if(((c[o>>2]|0)-x|0)==(H|0)){if(B){I=(w&255)>>>1;J=(w&255)>>>1}else{w=c[g>>2]|0;I=w;J=w}gf(n,I<<1,0);if((a[n]&1)==0){K=10}else{K=(c[n>>2]&-2)+ -1|0}gf(n,K,0);if((a[n]&1)==0){L=u}else{L=c[v>>2]|0}c[o>>2]=L+J;M=L}else{M=x}w=A+12|0;B=c[w>>2]|0;N=A+16|0;if((B|0)==(c[N>>2]|0)){O=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{O=c[B>>2]|0}if((Hh(O,t,M,o,r,s,m,p,q,k)|0)!=0){E=D;F=M;break}B=c[w>>2]|0;if((B|0)==(c[N>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;l=A;x=M;continue}else{c[w>>2]=B+4;l=A;x=M;continue}}M=a[m]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[m+4>>2]|0}if((P|0)!=0?(P=c[q>>2]|0,(P-p|0)<160):0){M=c[r>>2]|0;c[q>>2]=P+4;c[P>>2]=M}c[j>>2]=ym(F,c[o>>2]|0,h,t)|0;Uj(m,p,c[q>>2]|0,h);if((A|0)!=0){q=c[A+12>>2]|0;if((q|0)==(c[A+16>>2]|0)){Q=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{Q=c[q>>2]|0}if((Q|0)==-1){c[e>>2]=0;R=0;S=1}else{R=A;S=0}}else{R=0;S=1}do{if((E|0)!=0){A=c[E+12>>2]|0;if((A|0)==(c[E+16>>2]|0)){T=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{T=c[A>>2]|0}if((T|0)==-1){c[f>>2]=0;G=60;break}if(S){c[b>>2]=R;ef(n);ef(m);i=d;return}}else{G=60}}while(0);if((G|0)==60?!S:0){c[b>>2]=R;ef(n);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=R;ef(n);ef(m);i=d;return}function wh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];xh(a,0,k,j,f,g,h);i=b;return}function xh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;d=i;i=i+304|0;k=d+200|0;l=d;m=d+4|0;n=d+16|0;o=d+28|0;p=d+32|0;q=d+192|0;r=d+196|0;s=c[g+4>>2]&74;if((s|0)==8){t=16}else if((s|0)==0){t=0}else if((s|0)==64){t=8}else{t=10}Lh(m,g,k,l);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;gf(n,10,0);if((a[n]&1)==0){g=n+1|0;u=g;v=n+8|0;w=g}else{g=n+8|0;u=n+1|0;v=g;w=c[g>>2]|0}c[o>>2]=w;c[q>>2]=p;c[r>>2]=0;g=n+4|0;s=c[l>>2]|0;l=c[e>>2]|0;x=w;a:while(1){if((l|0)!=0){w=c[l+12>>2]|0;if((w|0)==(c[l+16>>2]|0)){y=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{y=c[w>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;A=0}else{z=0;A=l}}else{z=1;A=0}w=c[f>>2]|0;do{if((w|0)!=0){B=c[w+12>>2]|0;if((B|0)==(c[w+16>>2]|0)){C=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{C=c[B>>2]|0}if(!((C|0)==-1)){if(z){D=w;break}else{E=w;F=x;break a}}else{c[f>>2]=0;G=21;break}}else{G=21}}while(0);if((G|0)==21){G=0;if(z){E=0;F=x;break}else{D=0}}w=a[n]|0;B=(w&1)==0;if(B){H=(w&255)>>>1}else{H=c[g>>2]|0}if(((c[o>>2]|0)-x|0)==(H|0)){if(B){I=(w&255)>>>1;J=(w&255)>>>1}else{w=c[g>>2]|0;I=w;J=w}gf(n,I<<1,0);if((a[n]&1)==0){K=10}else{K=(c[n>>2]&-2)+ -1|0}gf(n,K,0);if((a[n]&1)==0){L=u}else{L=c[v>>2]|0}c[o>>2]=L+J;M=L}else{M=x}w=A+12|0;B=c[w>>2]|0;N=A+16|0;if((B|0)==(c[N>>2]|0)){O=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{O=c[B>>2]|0}if((Hh(O,t,M,o,r,s,m,p,q,k)|0)!=0){E=D;F=M;break}B=c[w>>2]|0;if((B|0)==(c[N>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;l=A;x=M;continue}else{c[w>>2]=B+4;l=A;x=M;continue}}M=a[m]|0;if((M&1)==0){P=(M&255)>>>1}else{P=c[m+4>>2]|0}if((P|0)!=0?(P=c[q>>2]|0,(P-p|0)<160):0){M=c[r>>2]|0;c[q>>2]=P+4;c[P>>2]=M}c[j>>2]=xm(F,c[o>>2]|0,h,t)|0;Uj(m,p,c[q>>2]|0,h);if((A|0)!=0){q=c[A+12>>2]|0;if((q|0)==(c[A+16>>2]|0)){Q=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{Q=c[q>>2]|0}if((Q|0)==-1){c[e>>2]=0;R=0;S=1}else{R=A;S=0}}else{R=0;S=1}do{if((E|0)!=0){A=c[E+12>>2]|0;if((A|0)==(c[E+16>>2]|0)){T=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{T=c[A>>2]|0}if((T|0)==-1){c[f>>2]=0;G=60;break}if(S){c[b>>2]=R;ef(n);ef(m);i=d;return}}else{G=60}}while(0);if((G|0)==60?!S:0){c[b>>2]=R;ef(n);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=R;ef(n);ef(m);i=d;return}function yh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];zh(a,0,k,j,f,g,h);i=b;return}function zh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0;d=i;i=i+304|0;k=d+200|0;l=d;m=d+4|0;n=d+16|0;o=d+28|0;p=d+32|0;q=d+192|0;r=d+196|0;s=c[g+4>>2]&74;if((s|0)==0){t=0}else if((s|0)==8){t=16}else if((s|0)==64){t=8}else{t=10}Lh(m,g,k,l);c[n+0>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;gf(n,10,0);if((a[n]&1)==0){g=n+1|0;u=g;v=n+8|0;w=g}else{g=n+8|0;u=n+1|0;v=g;w=c[g>>2]|0}c[o>>2]=w;c[q>>2]=p;c[r>>2]=0;g=n+4|0;s=c[l>>2]|0;l=c[e>>2]|0;x=w;a:while(1){if((l|0)!=0){w=c[l+12>>2]|0;if((w|0)==(c[l+16>>2]|0)){y=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{y=c[w>>2]|0}if((y|0)==-1){c[e>>2]=0;z=1;A=0}else{z=0;A=l}}else{z=1;A=0}w=c[f>>2]|0;do{if((w|0)!=0){B=c[w+12>>2]|0;if((B|0)==(c[w+16>>2]|0)){C=Ac[c[(c[w>>2]|0)+36>>2]&127](w)|0}else{C=c[B>>2]|0}if(!((C|0)==-1)){if(z){D=w;break}else{E=w;F=x;break a}}else{c[f>>2]=0;G=21;break}}else{G=21}}while(0);if((G|0)==21){G=0;if(z){E=0;F=x;break}else{D=0}}w=a[n]|0;B=(w&1)==0;if(B){H=(w&255)>>>1}else{H=c[g>>2]|0}if(((c[o>>2]|0)-x|0)==(H|0)){if(B){I=(w&255)>>>1;K=(w&255)>>>1}else{w=c[g>>2]|0;I=w;K=w}gf(n,I<<1,0);if((a[n]&1)==0){L=10}else{L=(c[n>>2]&-2)+ -1|0}gf(n,L,0);if((a[n]&1)==0){M=u}else{M=c[v>>2]|0}c[o>>2]=M+K;N=M}else{N=x}w=A+12|0;B=c[w>>2]|0;O=A+16|0;if((B|0)==(c[O>>2]|0)){P=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{P=c[B>>2]|0}if((Hh(P,t,N,o,r,s,m,p,q,k)|0)!=0){E=D;F=N;break}B=c[w>>2]|0;if((B|0)==(c[O>>2]|0)){Ac[c[(c[A>>2]|0)+40>>2]&127](A)|0;l=A;x=N;continue}else{c[w>>2]=B+4;l=A;x=N;continue}}N=a[m]|0;if((N&1)==0){Q=(N&255)>>>1}else{Q=c[m+4>>2]|0}if((Q|0)!=0?(Q=c[q>>2]|0,(Q-p|0)<160):0){N=c[r>>2]|0;c[q>>2]=Q+4;c[Q>>2]=N}N=wm(F,c[o>>2]|0,h,t)|0;t=j;c[t>>2]=N;c[t+4>>2]=J;Uj(m,p,c[q>>2]|0,h);if((A|0)!=0){q=c[A+12>>2]|0;if((q|0)==(c[A+16>>2]|0)){R=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{R=c[q>>2]|0}if((R|0)==-1){c[e>>2]=0;S=0;T=1}else{S=A;T=0}}else{S=0;T=1}do{if((E|0)!=0){A=c[E+12>>2]|0;if((A|0)==(c[E+16>>2]|0)){U=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{U=c[A>>2]|0}if((U|0)==-1){c[f>>2]=0;G=60;break}if(T){c[b>>2]=S;ef(n);ef(m);i=d;return}}else{G=60}}while(0);if((G|0)==60?!T:0){c[b>>2]=S;ef(n);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=S;ef(n);ef(m);i=d;return}function Ah(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Bh(a,0,k,j,f,g,h);i=b;return}function Bh(b,d,e,f,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;d=i;i=i+352|0;l=d+176|0;m=d+332|0;n=d+328|0;o=d+316|0;p=d+304|0;q=d+168|0;r=d+8|0;s=d+4|0;t=d;u=d+337|0;v=d+336|0;Mh(o,h,l,m,n);c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;gf(p,10,0);if((a[p]&1)==0){h=p+1|0;w=h;x=p+8|0;y=h}else{h=p+8|0;w=p+1|0;x=h;y=c[h>>2]|0}c[q>>2]=y;c[s>>2]=r;c[t>>2]=0;a[u]=1;a[v]=69;h=p+4|0;z=c[m>>2]|0;m=c[n>>2]|0;n=c[e>>2]|0;A=y;a:while(1){if((n|0)!=0){y=c[n+12>>2]|0;if((y|0)==(c[n+16>>2]|0)){B=Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{B=c[y>>2]|0}if((B|0)==-1){c[e>>2]=0;C=1;D=0}else{C=0;D=n}}else{C=1;D=0}y=c[f>>2]|0;do{if((y|0)!=0){E=c[y+12>>2]|0;if((E|0)==(c[y+16>>2]|0)){F=Ac[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[E>>2]|0}if(!((F|0)==-1)){if(C){G=y;break}else{H=y;I=A;break a}}else{c[f>>2]=0;J=17;break}}else{J=17}}while(0);if((J|0)==17){J=0;if(C){H=0;I=A;break}else{G=0}}y=a[p]|0;E=(y&1)==0;if(E){K=(y&255)>>>1}else{K=c[h>>2]|0}if(((c[q>>2]|0)-A|0)==(K|0)){if(E){L=(y&255)>>>1;M=(y&255)>>>1}else{y=c[h>>2]|0;L=y;M=y}gf(p,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[p>>2]&-2)+ -1|0}gf(p,N,0);if((a[p]&1)==0){O=w}else{O=c[x>>2]|0}c[q>>2]=O+M;P=O}else{P=A}y=D+12|0;E=c[y>>2]|0;Q=D+16|0;if((E|0)==(c[Q>>2]|0)){R=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{R=c[E>>2]|0}if((Nh(R,u,v,P,q,z,m,o,r,s,t,l)|0)!=0){H=G;I=P;break}E=c[y>>2]|0;if((E|0)==(c[Q>>2]|0)){Ac[c[(c[D>>2]|0)+40>>2]&127](D)|0;n=D;A=P;continue}else{c[y>>2]=E+4;n=D;A=P;continue}}P=a[o]|0;if((P&1)==0){S=(P&255)>>>1}else{S=c[o+4>>2]|0}if(((S|0)!=0?(a[u]|0)!=0:0)?(u=c[s>>2]|0,(u-r|0)<160):0){S=c[t>>2]|0;c[s>>2]=u+4;c[u>>2]=S}g[k>>2]=+vm(I,c[q>>2]|0,j);Uj(o,r,c[s>>2]|0,j);if((D|0)!=0){s=c[D+12>>2]|0;if((s|0)==(c[D+16>>2]|0)){T=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{T=c[s>>2]|0}if((T|0)==-1){c[e>>2]=0;U=0;V=1}else{U=D;V=0}}else{U=0;V=1}do{if((H|0)!=0){D=c[H+12>>2]|0;if((D|0)==(c[H+16>>2]|0)){W=Ac[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{W=c[D>>2]|0}if((W|0)==-1){c[f>>2]=0;J=57;break}if(V){c[b>>2]=U;ef(p);ef(o);i=d;return}}else{J=57}}while(0);if((J|0)==57?!V:0){c[b>>2]=U;ef(p);ef(o);i=d;return}c[j>>2]=c[j>>2]|2;c[b>>2]=U;ef(p);ef(o);i=d;return}function Ch(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Dh(a,0,k,j,f,g,h);i=b;return}function Dh(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;d=i;i=i+352|0;l=d+176|0;m=d+332|0;n=d+328|0;o=d+316|0;p=d+304|0;q=d+168|0;r=d+8|0;s=d+4|0;t=d;u=d+337|0;v=d+336|0;Mh(o,g,l,m,n);c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;gf(p,10,0);if((a[p]&1)==0){g=p+1|0;w=g;x=p+8|0;y=g}else{g=p+8|0;w=p+1|0;x=g;y=c[g>>2]|0}c[q>>2]=y;c[s>>2]=r;c[t>>2]=0;a[u]=1;a[v]=69;g=p+4|0;z=c[m>>2]|0;m=c[n>>2]|0;n=c[e>>2]|0;A=y;a:while(1){if((n|0)!=0){y=c[n+12>>2]|0;if((y|0)==(c[n+16>>2]|0)){B=Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{B=c[y>>2]|0}if((B|0)==-1){c[e>>2]=0;C=1;D=0}else{C=0;D=n}}else{C=1;D=0}y=c[f>>2]|0;do{if((y|0)!=0){E=c[y+12>>2]|0;if((E|0)==(c[y+16>>2]|0)){F=Ac[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[E>>2]|0}if(!((F|0)==-1)){if(C){G=y;break}else{H=y;I=A;break a}}else{c[f>>2]=0;J=17;break}}else{J=17}}while(0);if((J|0)==17){J=0;if(C){H=0;I=A;break}else{G=0}}y=a[p]|0;E=(y&1)==0;if(E){K=(y&255)>>>1}else{K=c[g>>2]|0}if(((c[q>>2]|0)-A|0)==(K|0)){if(E){L=(y&255)>>>1;M=(y&255)>>>1}else{y=c[g>>2]|0;L=y;M=y}gf(p,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[p>>2]&-2)+ -1|0}gf(p,N,0);if((a[p]&1)==0){O=w}else{O=c[x>>2]|0}c[q>>2]=O+M;P=O}else{P=A}y=D+12|0;E=c[y>>2]|0;Q=D+16|0;if((E|0)==(c[Q>>2]|0)){R=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{R=c[E>>2]|0}if((Nh(R,u,v,P,q,z,m,o,r,s,t,l)|0)!=0){H=G;I=P;break}E=c[y>>2]|0;if((E|0)==(c[Q>>2]|0)){Ac[c[(c[D>>2]|0)+40>>2]&127](D)|0;n=D;A=P;continue}else{c[y>>2]=E+4;n=D;A=P;continue}}P=a[o]|0;if((P&1)==0){S=(P&255)>>>1}else{S=c[o+4>>2]|0}if(((S|0)!=0?(a[u]|0)!=0:0)?(u=c[s>>2]|0,(u-r|0)<160):0){S=c[t>>2]|0;c[s>>2]=u+4;c[u>>2]=S}h[k>>3]=+um(I,c[q>>2]|0,j);Uj(o,r,c[s>>2]|0,j);if((D|0)!=0){s=c[D+12>>2]|0;if((s|0)==(c[D+16>>2]|0)){T=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{T=c[s>>2]|0}if((T|0)==-1){c[e>>2]=0;U=0;V=1}else{U=D;V=0}}else{U=0;V=1}do{if((H|0)!=0){D=c[H+12>>2]|0;if((D|0)==(c[H+16>>2]|0)){W=Ac[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{W=c[D>>2]|0}if((W|0)==-1){c[f>>2]=0;J=57;break}if(V){c[b>>2]=U;ef(p);ef(o);i=d;return}}else{J=57}}while(0);if((J|0)==57?!V:0){c[b>>2]=U;ef(p);ef(o);i=d;return}c[j>>2]=c[j>>2]|2;c[b>>2]=U;ef(p);ef(o);i=d;return}function Eh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+16|0;j=b+12|0;k=b;l=b+4|0;m=b+8|0;c[l>>2]=c[d>>2];c[m>>2]=c[e>>2];c[k+0>>2]=c[l+0>>2];c[j+0>>2]=c[m+0>>2];Fh(a,0,k,j,f,g,h);i=b;return}function Fh(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;d=i;i=i+352|0;l=d+176|0;m=d+332|0;n=d+328|0;o=d+316|0;p=d+304|0;q=d+168|0;r=d+8|0;s=d+4|0;t=d;u=d+337|0;v=d+336|0;Mh(o,g,l,m,n);c[p+0>>2]=0;c[p+4>>2]=0;c[p+8>>2]=0;gf(p,10,0);if((a[p]&1)==0){g=p+1|0;w=g;x=p+8|0;y=g}else{g=p+8|0;w=p+1|0;x=g;y=c[g>>2]|0}c[q>>2]=y;c[s>>2]=r;c[t>>2]=0;a[u]=1;a[v]=69;g=p+4|0;z=c[m>>2]|0;m=c[n>>2]|0;n=c[e>>2]|0;A=y;a:while(1){if((n|0)!=0){y=c[n+12>>2]|0;if((y|0)==(c[n+16>>2]|0)){B=Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{B=c[y>>2]|0}if((B|0)==-1){c[e>>2]=0;C=1;D=0}else{C=0;D=n}}else{C=1;D=0}y=c[f>>2]|0;do{if((y|0)!=0){E=c[y+12>>2]|0;if((E|0)==(c[y+16>>2]|0)){F=Ac[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{F=c[E>>2]|0}if(!((F|0)==-1)){if(C){G=y;break}else{H=y;I=A;break a}}else{c[f>>2]=0;J=17;break}}else{J=17}}while(0);if((J|0)==17){J=0;if(C){H=0;I=A;break}else{G=0}}y=a[p]|0;E=(y&1)==0;if(E){K=(y&255)>>>1}else{K=c[g>>2]|0}if(((c[q>>2]|0)-A|0)==(K|0)){if(E){L=(y&255)>>>1;M=(y&255)>>>1}else{y=c[g>>2]|0;L=y;M=y}gf(p,L<<1,0);if((a[p]&1)==0){N=10}else{N=(c[p>>2]&-2)+ -1|0}gf(p,N,0);if((a[p]&1)==0){O=w}else{O=c[x>>2]|0}c[q>>2]=O+M;P=O}else{P=A}y=D+12|0;E=c[y>>2]|0;Q=D+16|0;if((E|0)==(c[Q>>2]|0)){R=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{R=c[E>>2]|0}if((Nh(R,u,v,P,q,z,m,o,r,s,t,l)|0)!=0){H=G;I=P;break}E=c[y>>2]|0;if((E|0)==(c[Q>>2]|0)){Ac[c[(c[D>>2]|0)+40>>2]&127](D)|0;n=D;A=P;continue}else{c[y>>2]=E+4;n=D;A=P;continue}}P=a[o]|0;if((P&1)==0){S=(P&255)>>>1}else{S=c[o+4>>2]|0}if(((S|0)!=0?(a[u]|0)!=0:0)?(u=c[s>>2]|0,(u-r|0)<160):0){S=c[t>>2]|0;c[s>>2]=u+4;c[u>>2]=S}h[k>>3]=+tm(I,c[q>>2]|0,j);Uj(o,r,c[s>>2]|0,j);if((D|0)!=0){s=c[D+12>>2]|0;if((s|0)==(c[D+16>>2]|0)){T=Ac[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{T=c[s>>2]|0}if((T|0)==-1){c[e>>2]=0;U=0;V=1}else{U=D;V=0}}else{U=0;V=1}do{if((H|0)!=0){D=c[H+12>>2]|0;if((D|0)==(c[H+16>>2]|0)){W=Ac[c[(c[H>>2]|0)+36>>2]&127](H)|0}else{W=c[D>>2]|0}if((W|0)==-1){c[f>>2]=0;J=57;break}if(V){c[b>>2]=U;ef(p);ef(o);i=d;return}}else{J=57}}while(0);if((J|0)==57?!V:0){c[b>>2]=U;ef(p);ef(o);i=d;return}c[j>>2]=c[j>>2]|2;c[b>>2]=U;ef(p);ef(o);i=d;return}function Gh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;d=i;i=i+304|0;k=d;l=d+200|0;m=d+12|0;n=d+24|0;o=d+28|0;p=d+40|0;c[m+0>>2]=0;c[m+4>>2]=0;c[m+8>>2]=0;zf(n,g);g=c[n>>2]|0;if(!((c[4466]|0)==-1)){c[k>>2]=17864;c[k+4>>2]=117;c[k+8>>2]=0;$e(17864,k,118)}q=(c[17868>>2]|0)+ -1|0;r=c[g+8>>2]|0;if(!((c[g+12>>2]|0)-r>>2>>>0>q>>>0)){s=Gb(4)|0;_m(s);pc(s|0,25832,102)}g=c[r+(q<<2)>>2]|0;if((g|0)==0){s=Gb(4)|0;_m(s);pc(s|0,25832,102)}Cc[c[(c[g>>2]|0)+48>>2]&7](g,16416,16442|0,l)|0;Fe(c[n>>2]|0)|0;c[o+0>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;gf(o,10,0);if((a[o]&1)==0){n=o+1|0;t=n;u=o+8|0;v=n}else{n=o+8|0;t=o+1|0;u=n;v=c[n>>2]|0}n=o+4|0;g=l+96|0;s=l+100|0;q=p;r=l+104|0;w=l;x=m+4|0;y=c[e>>2]|0;z=p;p=0;A=v;B=v;a:while(1){if((y|0)!=0){v=c[y+12>>2]|0;if((v|0)==(c[y+16>>2]|0)){C=Ac[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{C=c[v>>2]|0}if((C|0)==-1){c[e>>2]=0;D=1;E=0}else{D=0;E=y}}else{D=1;E=0}v=c[f>>2]|0;do{if((v|0)!=0){F=c[v+12>>2]|0;if((F|0)==(c[v+16>>2]|0)){G=Ac[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{G=c[F>>2]|0}if(!((G|0)==-1)){if(D){break}else{H=B;break a}}else{c[f>>2]=0;I=22;break}}else{I=22}}while(0);if((I|0)==22?(I=0,D):0){H=B;break}v=a[o]|0;F=(v&1)==0;if(F){J=(v&255)>>>1}else{J=c[n>>2]|0}if((A-B|0)==(J|0)){if(F){K=(v&255)>>>1;L=(v&255)>>>1}else{v=c[n>>2]|0;K=v;L=v}gf(o,K<<1,0);if((a[o]&1)==0){M=10}else{M=(c[o>>2]&-2)+ -1|0}gf(o,M,0);if((a[o]&1)==0){N=t}else{N=c[u>>2]|0}O=N+L|0;P=N}else{O=A;P=B}v=c[E+12>>2]|0;if((v|0)==(c[E+16>>2]|0)){Q=Ac[c[(c[E>>2]|0)+36>>2]&127](E)|0}else{Q=c[v>>2]|0}v=(O|0)==(P|0);do{if(v){F=(c[g>>2]|0)==(Q|0);if(!F?(c[s>>2]|0)!=(Q|0):0){I=43;break}a[O]=F?43:45;R=O+1|0;S=z;T=0}else{I=43}}while(0);do{if((I|0)==43){I=0;F=a[m]|0;if((F&1)==0){U=(F&255)>>>1}else{U=c[x>>2]|0}if((U|0)!=0&(Q|0)==0){if((z-q|0)>=160){R=O;S=z;T=p;break}c[z>>2]=p;R=O;S=z+4|0;T=0;break}else{V=l}while(1){F=V+4|0;if((c[V>>2]|0)==(Q|0)){W=V;break}if((F|0)==(r|0)){W=r;break}else{V=F}}F=W-w|0;X=F>>2;if((F|0)>92){H=P;break a}if((F|0)<88){a[O]=a[16416+X|0]|0;R=O+1|0;S=z;T=p+1|0;break}if(v){H=O;break a}if((O-P|0)>=3){H=P;break a}if((a[O+ -1|0]|0)!=48){H=P;break a}a[O]=a[16416+X|0]|0;R=O+1|0;S=z;T=0}}while(0);v=c[e>>2]|0;X=v+12|0;F=c[X>>2]|0;if((F|0)==(c[v+16>>2]|0)){Ac[c[(c[v>>2]|0)+40>>2]&127](v)|0;y=v;z=S;p=T;A=R;B=P;continue}else{c[X>>2]=F+4;y=v;z=S;p=T;A=R;B=P;continue}}a[H+3|0]=0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}P=c[4440]|0;c[k>>2]=j;if((jh(H,P,16456,k)|0)!=1){c[h>>2]=4}k=c[e>>2]|0;if((k|0)!=0){P=c[k+12>>2]|0;if((P|0)==(c[k+16>>2]|0)){Y=Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{Y=c[P>>2]|0}if((Y|0)==-1){c[e>>2]=0;Z=0;_=1}else{Z=k;_=0}}else{Z=0;_=1}k=c[f>>2]|0;do{if((k|0)!=0){e=c[k+12>>2]|0;if((e|0)==(c[k+16>>2]|0)){$=Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{$=c[e>>2]|0}if(($|0)==-1){c[f>>2]=0;I=78;break}if(_){c[b>>2]=Z;ef(o);ef(m);i=d;return}}else{I=78}}while(0);if((I|0)==78?!_:0){c[b>>2]=Z;ef(o);ef(m);i=d;return}c[h>>2]=c[h>>2]|2;c[b>>2]=Z;ef(o);ef(m);i=d;return}function Hh(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=i;o=c[f>>2]|0;p=(o|0)==(e|0);do{if(p){q=(c[m+96>>2]|0)==(b|0);if(!q?(c[m+100>>2]|0)!=(b|0):0){break}c[f>>2]=e+1;a[e]=q?43:45;c[g>>2]=0;r=0;i=n;return r|0}}while(0);q=a[j]|0;if((q&1)==0){s=(q&255)>>>1}else{s=c[j+4>>2]|0}if((s|0)!=0&(b|0)==(h|0)){h=c[l>>2]|0;if((h-k|0)>=160){r=0;i=n;return r|0}k=c[g>>2]|0;c[l>>2]=h+4;c[h>>2]=k;c[g>>2]=0;r=0;i=n;return r|0}k=m+104|0;h=m;while(1){l=h+4|0;if((c[h>>2]|0)==(b|0)){t=h;break}if((l|0)==(k|0)){t=k;break}else{h=l}}h=t-m|0;m=h>>2;if((h|0)>92){r=-1;i=n;return r|0}if((d|0)==16){if((h|0)>=88){if(p){r=-1;i=n;return r|0}if((o-e|0)>=3){r=-1;i=n;return r|0}if((a[o+ -1|0]|0)!=48){r=-1;i=n;return r|0}c[g>>2]=0;e=a[16416+m|0]|0;c[f>>2]=o+1;a[o]=e;r=0;i=n;return r|0}}else if((d|0)==10|(d|0)==8?(m|0)>=(d|0):0){r=-1;i=n;return r|0}d=a[16416+m|0]|0;c[f>>2]=o+1;a[o]=d;c[g>>2]=(c[g>>2]|0)+1;r=0;i=n;return r|0}function Ih(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+16|0;h=g;j=g+12|0;zf(j,d);d=c[j>>2]|0;if(!((c[4468]|0)==-1)){c[h>>2]=17872;c[h+4>>2]=117;c[h+8>>2]=0;$e(17872,h,118)}k=(c[17876>>2]|0)+ -1|0;l=c[d+8>>2]|0;if(!((c[d+12>>2]|0)-l>>2>>>0>k>>>0)){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}d=c[l+(k<<2)>>2]|0;if((d|0)==0){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}Cc[c[(c[d>>2]|0)+32>>2]&7](d,16416,16442|0,e)|0;e=c[j>>2]|0;if(!((c[4504]|0)==-1)){c[h>>2]=18016;c[h+4>>2]=117;c[h+8>>2]=0;$e(18016,h,118)}h=(c[18020>>2]|0)+ -1|0;d=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-d>>2>>>0>h>>>0)){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}e=c[d+(h<<2)>>2]|0;if((e|0)==0){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}else{a[f]=Ac[c[(c[e>>2]|0)+16>>2]&127](e)|0;zc[c[(c[e>>2]|0)+20>>2]&63](b,e);Fe(c[j>>2]|0)|0;i=g;return}}function Jh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0;h=i;i=i+16|0;j=h;k=h+12|0;zf(k,d);d=c[k>>2]|0;if(!((c[4468]|0)==-1)){c[j>>2]=17872;c[j+4>>2]=117;c[j+8>>2]=0;$e(17872,j,118)}l=(c[17876>>2]|0)+ -1|0;m=c[d+8>>2]|0;if(!((c[d+12>>2]|0)-m>>2>>>0>l>>>0)){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}d=c[m+(l<<2)>>2]|0;if((d|0)==0){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}Cc[c[(c[d>>2]|0)+32>>2]&7](d,16416,16448|0,e)|0;e=c[k>>2]|0;if(!((c[4504]|0)==-1)){c[j>>2]=18016;c[j+4>>2]=117;c[j+8>>2]=0;$e(18016,j,118)}j=(c[18020>>2]|0)+ -1|0;d=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-d>>2>>>0>j>>>0)){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}e=c[d+(j<<2)>>2]|0;if((e|0)==0){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}else{a[f]=Ac[c[(c[e>>2]|0)+12>>2]&127](e)|0;a[g]=Ac[c[(c[e>>2]|0)+16>>2]&127](e)|0;zc[c[(c[e>>2]|0)+20>>2]&63](b,e);Fe(c[k>>2]|0)|0;i=h;return}}function Kh(b,d,e,f,g,h,j,k,l,m,n,o){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0;p=i;if(b<<24>>24==h<<24>>24){if((a[d]|0)==0){q=-1;i=p;return q|0}a[d]=0;h=c[g>>2]|0;c[g>>2]=h+1;a[h]=46;h=a[k]|0;if((h&1)==0){r=(h&255)>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){q=0;i=p;return q|0}r=c[m>>2]|0;if((r-l|0)>=160){q=0;i=p;return q|0}h=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=h;q=0;i=p;return q|0}if(b<<24>>24==j<<24>>24){j=a[k]|0;if((j&1)==0){s=(j&255)>>>1}else{s=c[k+4>>2]|0}if((s|0)!=0){if((a[d]|0)==0){q=-1;i=p;return q|0}s=c[m>>2]|0;if((s-l|0)>=160){q=0;i=p;return q|0}j=c[n>>2]|0;c[m>>2]=s+4;c[s>>2]=j;c[n>>2]=0;q=0;i=p;return q|0}}j=o+32|0;s=o;while(1){h=s+1|0;if((a[s]|0)==b<<24>>24){t=s;break}if((h|0)==(j|0)){t=j;break}else{s=h}}s=t-o|0;if((s|0)>31){q=-1;i=p;return q|0}o=a[16416+s|0]|0;if((s|0)==24|(s|0)==25){t=c[g>>2]|0;if((t|0)!=(f|0)?(a[t+ -1|0]&95|0)!=(a[e]&127|0):0){q=-1;i=p;return q|0}c[g>>2]=t+1;a[t]=o;q=0;i=p;return q|0}else if((s|0)==23|(s|0)==22){a[e]=80;t=c[g>>2]|0;c[g>>2]=t+1;a[t]=o;q=0;i=p;return q|0}else{t=o&95;if((t|0)==(a[e]|0)?(a[e]=t|128,(a[d]|0)!=0):0){a[d]=0;d=a[k]|0;if((d&1)==0){u=(d&255)>>>1}else{u=c[k+4>>2]|0}if((u|0)!=0?(u=c[m>>2]|0,(u-l|0)<160):0){l=c[n>>2]|0;c[m>>2]=u+4;c[u>>2]=l}}l=c[g>>2]|0;c[g>>2]=l+1;a[l]=o;if((s|0)>21){q=0;i=p;return q|0}c[n>>2]=(c[n>>2]|0)+1;q=0;i=p;return q|0}return 0}function Lh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;g=f;h=f+12|0;zf(h,b);b=c[h>>2]|0;if(!((c[4466]|0)==-1)){c[g>>2]=17864;c[g+4>>2]=117;c[g+8>>2]=0;$e(17864,g,118)}j=(c[17868>>2]|0)+ -1|0;k=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-k>>2>>>0>j>>>0)){l=Gb(4)|0;_m(l);pc(l|0,25832,102)}b=c[k+(j<<2)>>2]|0;if((b|0)==0){l=Gb(4)|0;_m(l);pc(l|0,25832,102)}Cc[c[(c[b>>2]|0)+48>>2]&7](b,16416,16442|0,d)|0;d=c[h>>2]|0;if(!((c[4506]|0)==-1)){c[g>>2]=18024;c[g+4>>2]=117;c[g+8>>2]=0;$e(18024,g,118)}g=(c[18028>>2]|0)+ -1|0;b=c[d+8>>2]|0;if(!((c[d+12>>2]|0)-b>>2>>>0>g>>>0)){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}d=c[b+(g<<2)>>2]|0;if((d|0)==0){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}else{c[e>>2]=Ac[c[(c[d>>2]|0)+16>>2]&127](d)|0;zc[c[(c[d>>2]|0)+20>>2]&63](a,d);Fe(c[h>>2]|0)|0;i=f;return}}function Mh(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+16|0;h=g;j=g+12|0;zf(j,b);b=c[j>>2]|0;if(!((c[4466]|0)==-1)){c[h>>2]=17864;c[h+4>>2]=117;c[h+8>>2]=0;$e(17864,h,118)}k=(c[17868>>2]|0)+ -1|0;l=c[b+8>>2]|0;if(!((c[b+12>>2]|0)-l>>2>>>0>k>>>0)){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}b=c[l+(k<<2)>>2]|0;if((b|0)==0){m=Gb(4)|0;_m(m);pc(m|0,25832,102)}Cc[c[(c[b>>2]|0)+48>>2]&7](b,16416,16448|0,d)|0;d=c[j>>2]|0;if(!((c[4506]|0)==-1)){c[h>>2]=18024;c[h+4>>2]=117;c[h+8>>2]=0;$e(18024,h,118)}h=(c[18028>>2]|0)+ -1|0;b=c[d+8>>2]|0;if(!((c[d+12>>2]|0)-b>>2>>>0>h>>>0)){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}d=c[b+(h<<2)>>2]|0;if((d|0)==0){n=Gb(4)|0;_m(n);pc(n|0,25832,102)}else{c[e>>2]=Ac[c[(c[d>>2]|0)+12>>2]&127](d)|0;c[f>>2]=Ac[c[(c[d>>2]|0)+16>>2]&127](d)|0;zc[c[(c[d>>2]|0)+20>>2]&63](a,d);Fe(c[j>>2]|0)|0;i=g;return}}function Nh(b,d,e,f,g,h,j,k,l,m,n,o){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0;p=i;if((b|0)==(h|0)){if((a[d]|0)==0){q=-1;i=p;return q|0}a[d]=0;h=c[g>>2]|0;c[g>>2]=h+1;a[h]=46;h=a[k]|0;if((h&1)==0){r=(h&255)>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){q=0;i=p;return q|0}r=c[m>>2]|0;if((r-l|0)>=160){q=0;i=p;return q|0}h=c[n>>2]|0;c[m>>2]=r+4;c[r>>2]=h;q=0;i=p;return q|0}if((b|0)==(j|0)){j=a[k]|0;if((j&1)==0){s=(j&255)>>>1}else{s=c[k+4>>2]|0}if((s|0)!=0){if((a[d]|0)==0){q=-1;i=p;return q|0}s=c[m>>2]|0;if((s-l|0)>=160){q=0;i=p;return q|0}j=c[n>>2]|0;c[m>>2]=s+4;c[s>>2]=j;c[n>>2]=0;q=0;i=p;return q|0}}j=o+128|0;s=o;while(1){h=s+4|0;if((c[s>>2]|0)==(b|0)){t=s;break}if((h|0)==(j|0)){t=j;break}else{s=h}}s=t-o|0;o=s>>2;if((s|0)>124){q=-1;i=p;return q|0}t=a[16416+o|0]|0;if((o|0)==24|(o|0)==25){j=c[g>>2]|0;if((j|0)!=(f|0)?(a[j+ -1|0]&95|0)!=(a[e]&127|0):0){q=-1;i=p;return q|0}c[g>>2]=j+1;a[j]=t;q=0;i=p;return q|0}else if(!((o|0)==23|(o|0)==22)){o=t&95;if((o|0)==(a[e]|0)?(a[e]=o|128,(a[d]|0)!=0):0){a[d]=0;d=a[k]|0;if((d&1)==0){u=(d&255)>>>1}else{u=c[k+4>>2]|0}if((u|0)!=0?(u=c[m>>2]|0,(u-l|0)<160):0){l=c[n>>2]|0;c[m>>2]=u+4;c[u>>2]=l}}}else{a[e]=80}e=c[g>>2]|0;c[g>>2]=e+1;a[e]=t;if((s|0)>84){q=0;i=p;return q|0}c[n>>2]=(c[n>>2]|0)+1;q=0;i=p;return q|0}function Oh(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function Ph(a){a=a|0;return}function Qh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;j=i;i=i+32|0;k=j;l=j+28|0;m=j+12|0;n=j+16|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];p=h&1;c[k+0>>2]=c[l+0>>2];Gc[o&31](b,d,k,f,g,p);i=j;return}zf(m,f);f=c[m>>2]|0;if(!((c[4504]|0)==-1)){c[k>>2]=18016;c[k+4>>2]=117;c[k+8>>2]=0;$e(18016,k,118)}k=(c[18020>>2]|0)+ -1|0;p=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-p>>2>>>0>k>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}f=c[p+(k<<2)>>2]|0;if((f|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[f>>2]|0;if(h){zc[c[m+24>>2]&63](n,f)}else{zc[c[m+28>>2]&63](n,f)}f=a[n]|0;if((f&1)==0){m=n+1|0;r=m;s=m;t=n+8|0}else{m=n+8|0;r=c[m>>2]|0;s=n+1|0;t=m}m=n+4|0;h=f;f=r;while(1){if((h&1)==0){u=s;v=(h&255)>>>1}else{u=c[t>>2]|0;v=c[m>>2]|0}if((f|0)==(u+v|0)){break}r=a[f]|0;q=c[e>>2]|0;do{if((q|0)!=0){k=q+24|0;p=c[k>>2]|0;if((p|0)!=(c[q+28>>2]|0)){c[k>>2]=p+1;a[p]=r;break}if((Lc[c[(c[q>>2]|0)+52>>2]&31](q,r&255)|0)==-1){c[e>>2]=0}}}while(0);h=a[n]|0;f=f+1|0}c[b>>2]=c[e>>2];ef(n);i=j;return}function Rh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+64|0;j=d;k=d+56|0;l=d+44|0;m=d+20|0;n=d+12|0;o=d+8|0;p=d+4|0;q=d+16|0;a[k+0|0]=a[16664|0]|0;a[k+1|0]=a[16665|0]|0;a[k+2|0]=a[16666|0]|0;a[k+3|0]=a[16667|0]|0;a[k+4|0]=a[16668|0]|0;a[k+5|0]=a[16669|0]|0;r=k+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=k+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else if((v|0)==64){a[u]=111}else{a[u]=100}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}u=c[4440]|0;c[j>>2]=h;h=Sh(l,12,u,k,j)|0;k=l+h|0;u=c[s>>2]&176;do{if((u|0)==16){s=a[l]|0;if(s<<24>>24==43|s<<24>>24==45){w=l+1|0;break}if((h|0)>1&s<<24>>24==48?(s=a[l+1|0]|0,s<<24>>24==88|s<<24>>24==120):0){w=l+2|0}else{x=20}}else if((u|0)==32){w=k}else{x=20}}while(0);if((x|0)==20){w=l}zf(p,f);Th(l,w,k,m,n,o,p);Fe(c[p>>2]|0)|0;c[q>>2]=c[e>>2];e=c[n>>2]|0;n=c[o>>2]|0;c[j+0>>2]=c[q+0>>2];Uh(b,j,m,e,n,f,g);i=d;return}function Sh(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;i=i+16|0;h=g;c[h>>2]=f;f=Kb(d|0)|0;d=vb(a|0,b|0,e|0,h|0)|0;if((f|0)==0){i=g;return d|0}Kb(f|0)|0;i=g;return d|0}function Th(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;k=i;i=i+32|0;l=k;m=k+12|0;n=c[j>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}o=(c[17876>>2]|0)+ -1|0;p=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-p>>2>>>0>o>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}n=c[p+(o<<2)>>2]|0;if((n|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}q=c[j>>2]|0;if(!((c[4504]|0)==-1)){c[l>>2]=18016;c[l+4>>2]=117;c[l+8>>2]=0;$e(18016,l,118)}l=(c[18020>>2]|0)+ -1|0;j=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-j>>2>>>0>l>>>0)){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}q=c[j+(l<<2)>>2]|0;if((q|0)==0){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}zc[c[(c[q>>2]|0)+20>>2]&63](m,q);r=a[m]|0;if((r&1)==0){s=(r&255)>>>1}else{s=c[m+4>>2]|0}if((s|0)!=0){c[h>>2]=f;s=a[b]|0;if(s<<24>>24==43|s<<24>>24==45){r=Lc[c[(c[n>>2]|0)+28>>2]&31](n,s)|0;s=c[h>>2]|0;c[h>>2]=s+1;a[s]=r;t=b+1|0}else{t=b}if(((e-t|0)>1?(a[t]|0)==48:0)?(r=t+1|0,s=a[r]|0,s<<24>>24==88|s<<24>>24==120):0){s=Lc[c[(c[n>>2]|0)+28>>2]&31](n,48)|0;l=c[h>>2]|0;c[h>>2]=l+1;a[l]=s;s=Lc[c[(c[n>>2]|0)+28>>2]&31](n,a[r]|0)|0;r=c[h>>2]|0;c[h>>2]=r+1;a[r]=s;u=t+2|0}else{u=t}if((u|0)!=(e|0)?(t=e+ -1|0,t>>>0>u>>>0):0){s=u;r=t;do{t=a[s]|0;a[s]=a[r]|0;a[r]=t;s=s+1|0;r=r+ -1|0}while(s>>>0<r>>>0)}r=Ac[c[(c[q>>2]|0)+16>>2]&127](q)|0;if(u>>>0<e>>>0){q=m+1|0;s=m+4|0;t=m+8|0;l=0;j=0;o=u;while(1){p=(a[m]&1)==0;if((a[(p?q:c[t>>2]|0)+j|0]|0)!=0?(l|0)==(a[(p?q:c[t>>2]|0)+j|0]|0):0){p=c[h>>2]|0;c[h>>2]=p+1;a[p]=r;p=a[m]|0;if((p&1)==0){v=(p&255)>>>1}else{v=c[s>>2]|0}w=0;x=(j>>>0<(v+ -1|0)>>>0)+j|0}else{w=l;x=j}p=Lc[c[(c[n>>2]|0)+28>>2]&31](n,a[o]|0)|0;y=c[h>>2]|0;c[h>>2]=y+1;a[y]=p;o=o+1|0;if(!(o>>>0<e>>>0)){break}else{l=w+1|0;j=x}}}x=f+(u-b)|0;u=c[h>>2]|0;if((x|0)!=(u|0)?(j=u+ -1|0,j>>>0>x>>>0):0){u=x;x=j;do{j=a[u]|0;a[u]=a[x]|0;a[x]=j;u=u+1|0;x=x+ -1|0}while(u>>>0<x>>>0)}}else{Cc[c[(c[n>>2]|0)+32>>2]&7](n,b,e,f)|0;c[h>>2]=f+(e-b)}if((d|0)==(e|0)){z=c[h>>2]|0;c[g>>2]=z;ef(m);i=k;return}else{z=f+(d-b)|0;c[g>>2]=z;ef(m);i=k;return}}function Uh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=k;m=c[d>>2]|0;if((m|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g|0;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;if((h|0)>0?(Dc[c[(c[m>>2]|0)+48>>2]&31](m,e,h)|0)!=(h|0):0){c[d>>2]=0;c[b>>2]=0;i=k;return}do{if((q|0)>0){df(l,q,j);if((a[l]&1)==0){r=l+1|0}else{r=c[l+8>>2]|0}if((Dc[c[(c[m>>2]|0)+48>>2]&31](m,r,q)|0)==(q|0)){ef(l);break}c[d>>2]=0;c[b>>2]=0;ef(l);i=k;return}}while(0);l=n-o|0;if((l|0)>0?(Dc[c[(c[m>>2]|0)+48>>2]&31](m,f,l)|0)!=(l|0):0){c[d>>2]=0;c[b>>2]=0;i=k;return}c[p>>2]=0;c[b>>2]=m;i=k;return}function Vh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+96|0;k=d+8|0;l=d;m=d+74|0;n=d+32|0;o=d+20|0;p=d+24|0;q=d+16|0;r=d+28|0;s=l;c[s>>2]=37;c[s+4>>2]=0;s=l+1|0;t=f+4|0;u=c[t>>2]|0;if((u&2048|0)==0){v=s}else{a[s]=43;v=l+2|0}if((u&512|0)==0){w=v}else{a[v]=35;w=v+1|0}v=w+2|0;a[w]=108;a[w+1|0]=108;w=u&74;do{if((w|0)==8){if((u&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((w|0)==64){a[v]=111}else{a[v]=100}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;w=k;c[w>>2]=h;c[w+4>>2]=j;j=Sh(m,22,v,l,k)|0;l=m+j|0;v=c[t>>2]&176;do{if((v|0)==16){t=a[m]|0;if(t<<24>>24==43|t<<24>>24==45){x=m+1|0;break}if((j|0)>1&t<<24>>24==48?(t=a[m+1|0]|0,t<<24>>24==88|t<<24>>24==120):0){x=m+2|0}else{y=20}}else if((v|0)==32){x=l}else{y=20}}while(0);if((y|0)==20){x=m}zf(q,f);Th(m,x,l,n,o,p,q);Fe(c[q>>2]|0)|0;c[r>>2]=c[e>>2];e=c[o>>2]|0;o=c[p>>2]|0;c[k+0>>2]=c[r+0>>2];Uh(b,k,n,e,o,f,g);i=d;return}function Wh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+64|0;j=d;k=d+56|0;l=d+44|0;m=d+20|0;n=d+12|0;o=d+8|0;p=d+4|0;q=d+16|0;a[k+0|0]=a[16664|0]|0;a[k+1|0]=a[16665|0]|0;a[k+2|0]=a[16666|0]|0;a[k+3|0]=a[16667|0]|0;a[k+4|0]=a[16668|0]|0;a[k+5|0]=a[16669|0]|0;r=k+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=k+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}u=c[4440]|0;c[j>>2]=h;h=Sh(l,12,u,k,j)|0;k=l+h|0;u=c[s>>2]&176;do{if((u|0)==16){s=a[l]|0;if(s<<24>>24==43|s<<24>>24==45){w=l+1|0;break}if((h|0)>1&s<<24>>24==48?(s=a[l+1|0]|0,s<<24>>24==88|s<<24>>24==120):0){w=l+2|0}else{x=20}}else if((u|0)==32){w=k}else{x=20}}while(0);if((x|0)==20){w=l}zf(p,f);Th(l,w,k,m,n,o,p);Fe(c[p>>2]|0)|0;c[q>>2]=c[e>>2];e=c[n>>2]|0;n=c[o>>2]|0;c[j+0>>2]=c[q+0>>2];Uh(b,j,m,e,n,f,g);i=d;return}function Xh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+112|0;k=d+8|0;l=d;m=d+75|0;n=d+32|0;o=d+20|0;p=d+24|0;q=d+16|0;r=d+28|0;s=l;c[s>>2]=37;c[s+4>>2]=0;s=l+1|0;t=f+4|0;u=c[t>>2]|0;if((u&2048|0)==0){v=s}else{a[s]=43;v=l+2|0}if((u&512|0)==0){w=v}else{a[v]=35;w=v+1|0}v=w+2|0;a[w]=108;a[w+1|0]=108;w=u&74;do{if((w|0)==8){if((u&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((w|0)==64){a[v]=111}else{a[v]=117}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;w=k;c[w>>2]=h;c[w+4>>2]=j;j=Sh(m,23,v,l,k)|0;l=m+j|0;v=c[t>>2]&176;do{if((v|0)==16){t=a[m]|0;if(t<<24>>24==43|t<<24>>24==45){x=m+1|0;break}if((j|0)>1&t<<24>>24==48?(t=a[m+1|0]|0,t<<24>>24==88|t<<24>>24==120):0){x=m+2|0}else{y=20}}else if((v|0)==32){x=l}else{y=20}}while(0);if((y|0)==20){x=m}zf(q,f);Th(m,x,l,n,o,p,q);Fe(c[q>>2]|0)|0;c[r>>2]=c[e>>2];e=c[o>>2]|0;o=c[p>>2]|0;c[k+0>>2]=c[r+0>>2];Uh(b,k,n,e,o,f,g);i=d;return}function Yh(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+144|0;l=d+8|0;m=d;n=d+44|0;o=d+36|0;p=d+74|0;q=d+40|0;r=d+24|0;s=d+20|0;t=d+28|0;u=d+32|0;v=m;c[v>>2]=37;c[v+4>>2]=0;v=m+1|0;w=f+4|0;x=c[w>>2]|0;if((x&2048|0)==0){y=v}else{a[v]=43;y=m+2|0}if((x&1024|0)==0){z=y}else{a[y]=35;z=y+1|0}y=x&260;v=x>>>14;do{if((y|0)==260){if((v&1|0)==0){a[z]=97;A=0;break}else{a[z]=65;A=0;break}}else{a[z]=46;x=z+2|0;a[z+1|0]=42;if((y|0)==256){if((v&1|0)==0){a[x]=101;A=1;break}else{a[x]=69;A=1;break}}else if((y|0)==4){if((v&1|0)==0){a[x]=102;A=1;break}else{a[x]=70;A=1;break}}else{if((v&1|0)==0){a[x]=103;A=1;break}else{a[x]=71;A=1;break}}}}while(0);c[o>>2]=n;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;if(A){c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}else{h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}if((B|0)>29){v=(a[17768]|0)==0;if(A){if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}A=c[4440]|0;c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];C=Zh(o,A,m,l)|0}else{if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;c[l>>2]=c[f+8>>2];A=l+4|0;h[k>>3]=j;c[A>>2]=c[k>>2];c[A+4>>2]=c[k+4>>2];C=Zh(o,v,m,l)|0}m=c[o>>2]|0;if((m|0)==0){Hn()}else{D=m;E=m;F=C}}else{D=c[o>>2]|0;E=0;F=B}B=D+F|0;o=c[w>>2]&176;do{if((o|0)==16){w=a[D]|0;if(w<<24>>24==43|w<<24>>24==45){G=D+1|0;break}if((F|0)>1&w<<24>>24==48?(w=a[D+1|0]|0,w<<24>>24==88|w<<24>>24==120):0){G=D+2|0}else{H=44}}else if((o|0)==32){G=B}else{H=44}}while(0);if((H|0)==44){G=D}if((D|0)!=(n|0)){H=un(F<<1)|0;if((H|0)==0){Hn()}else{I=D;J=H;K=H}}else{I=n;J=0;K=p}zf(s,f);_h(I,G,B,K,q,r,s);Fe(c[s>>2]|0)|0;c[u>>2]=c[e>>2];s=c[q>>2]|0;q=c[r>>2]|0;c[l+0>>2]=c[u+0>>2];Uh(t,l,K,s,q,f,g);g=c[t>>2]|0;c[e>>2]=g;c[b>>2]=g;if((J|0)!=0){vn(J)}if((E|0)==0){i=d;return}vn(E);i=d;return}function Zh(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=f;c[g>>2]=e;e=Kb(b|0)|0;b=ub(a|0,d|0,g|0)|0;if((e|0)==0){i=f;return b|0}Kb(e|0)|0;i=f;return b|0}function _h(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;k=i;i=i+32|0;l=k;m=k+12|0;n=c[j>>2]|0;if(!((c[4468]|0)==-1)){c[l>>2]=17872;c[l+4>>2]=117;c[l+8>>2]=0;$e(17872,l,118)}o=(c[17876>>2]|0)+ -1|0;p=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-p>>2>>>0>o>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}n=c[p+(o<<2)>>2]|0;if((n|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}q=c[j>>2]|0;if(!((c[4504]|0)==-1)){c[l>>2]=18016;c[l+4>>2]=117;c[l+8>>2]=0;$e(18016,l,118)}l=(c[18020>>2]|0)+ -1|0;j=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-j>>2>>>0>l>>>0)){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}q=c[j+(l<<2)>>2]|0;if((q|0)==0){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}zc[c[(c[q>>2]|0)+20>>2]&63](m,q);c[h>>2]=f;r=a[b]|0;if(r<<24>>24==43|r<<24>>24==45){l=Lc[c[(c[n>>2]|0)+28>>2]&31](n,r)|0;r=c[h>>2]|0;c[h>>2]=r+1;a[r]=l;s=b+1|0}else{s=b}l=e;a:do{if(((l-s|0)>1?(a[s]|0)==48:0)?(r=s+1|0,j=a[r]|0,j<<24>>24==88|j<<24>>24==120):0){j=Lc[c[(c[n>>2]|0)+28>>2]&31](n,48)|0;o=c[h>>2]|0;c[h>>2]=o+1;a[o]=j;j=s+2|0;o=Lc[c[(c[n>>2]|0)+28>>2]&31](n,a[r]|0)|0;r=c[h>>2]|0;c[h>>2]=r+1;a[r]=o;if(j>>>0<e>>>0){o=j;while(1){r=a[o]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}p=o+1|0;if((ib(r<<24>>24|0,c[4440]|0)|0)==0){t=j;u=o;break a}if(p>>>0<e>>>0){o=p}else{t=j;u=p;break}}}else{t=j;u=j}}else{v=14}}while(0);b:do{if((v|0)==14){if(s>>>0<e>>>0){o=s;while(1){p=a[o]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}r=o+1|0;if((nb(p<<24>>24|0,c[4440]|0)|0)==0){t=s;u=o;break b}if(r>>>0<e>>>0){o=r}else{t=s;u=r;break}}}else{t=s;u=s}}}while(0);s=a[m]|0;if((s&1)==0){w=(s&255)>>>1}else{w=c[m+4>>2]|0}if((w|0)!=0){if((t|0)!=(u|0)?(w=u+ -1|0,w>>>0>t>>>0):0){s=t;v=w;do{w=a[s]|0;a[s]=a[v]|0;a[v]=w;s=s+1|0;v=v+ -1|0}while(s>>>0<v>>>0)}v=Ac[c[(c[q>>2]|0)+16>>2]&127](q)|0;if(t>>>0<u>>>0){s=m+1|0;w=m+4|0;o=m+8|0;j=0;r=0;p=t;while(1){x=(a[m]&1)==0;if((a[(x?s:c[o>>2]|0)+r|0]|0)>0?(j|0)==(a[(x?s:c[o>>2]|0)+r|0]|0):0){x=c[h>>2]|0;c[h>>2]=x+1;a[x]=v;x=a[m]|0;if((x&1)==0){y=(x&255)>>>1}else{y=c[w>>2]|0}z=0;A=(r>>>0<(y+ -1|0)>>>0)+r|0}else{z=j;A=r}x=Lc[c[(c[n>>2]|0)+28>>2]&31](n,a[p]|0)|0;B=c[h>>2]|0;c[h>>2]=B+1;a[B]=x;p=p+1|0;if(!(p>>>0<u>>>0)){break}else{j=z+1|0;r=A}}}A=f+(t-b)|0;r=c[h>>2]|0;if((A|0)!=(r|0)?(z=r+ -1|0,z>>>0>A>>>0):0){r=A;A=z;do{z=a[r]|0;a[r]=a[A]|0;a[A]=z;r=r+1|0;A=A+ -1|0}while(r>>>0<A>>>0)}}else{Cc[c[(c[n>>2]|0)+32>>2]&7](n,t,u,c[h>>2]|0)|0;c[h>>2]=(c[h>>2]|0)+(u-t)}c:do{if(u>>>0<e>>>0){t=u;while(1){A=a[t]|0;if(A<<24>>24==46){break}r=Lc[c[(c[n>>2]|0)+28>>2]&31](n,A)|0;A=c[h>>2]|0;c[h>>2]=A+1;a[A]=r;r=t+1|0;if(r>>>0<e>>>0){t=r}else{C=r;break c}}r=Ac[c[(c[q>>2]|0)+12>>2]&127](q)|0;A=c[h>>2]|0;c[h>>2]=A+1;a[A]=r;C=t+1|0}else{C=u}}while(0);Cc[c[(c[n>>2]|0)+32>>2]&7](n,C,e,c[h>>2]|0)|0;n=(c[h>>2]|0)+(l-C)|0;c[h>>2]=n;if((d|0)==(e|0)){D=n;c[g>>2]=D;ef(m);i=k;return}D=f+(d-b)|0;c[g>>2]=D;ef(m);i=k;return}function $h(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+144|0;l=d+8|0;m=d;n=d+44|0;o=d+36|0;p=d+74|0;q=d+40|0;r=d+24|0;s=d+20|0;t=d+28|0;u=d+32|0;v=m;c[v>>2]=37;c[v+4>>2]=0;v=m+1|0;w=f+4|0;x=c[w>>2]|0;if((x&2048|0)==0){y=v}else{a[v]=43;y=m+2|0}if((x&1024|0)==0){z=y}else{a[y]=35;z=y+1|0}y=x&260;v=x>>>14;do{if((y|0)==260){a[z]=76;x=z+1|0;if((v&1|0)==0){a[x]=97;A=0;break}else{a[x]=65;A=0;break}}else{a[z]=46;a[z+1|0]=42;a[z+2|0]=76;x=z+3|0;if((y|0)==256){if((v&1|0)==0){a[x]=101;A=1;break}else{a[x]=69;A=1;break}}else if((y|0)==4){if((v&1|0)==0){a[x]=102;A=1;break}else{a[x]=70;A=1;break}}else{if((v&1|0)==0){a[x]=103;A=1;break}else{a[x]=71;A=1;break}}}}while(0);c[o>>2]=n;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;if(A){c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}else{h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}if((B|0)>29){v=(a[17768]|0)==0;if(A){if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}A=c[4440]|0;c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];C=Zh(o,A,m,l)|0}else{if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];C=Zh(o,v,m,l)|0}m=c[o>>2]|0;if((m|0)==0){Hn()}else{D=m;E=m;F=C}}else{D=c[o>>2]|0;E=0;F=B}B=D+F|0;o=c[w>>2]&176;do{if((o|0)==16){w=a[D]|0;if(w<<24>>24==43|w<<24>>24==45){G=D+1|0;break}if((F|0)>1&w<<24>>24==48?(w=a[D+1|0]|0,w<<24>>24==88|w<<24>>24==120):0){G=D+2|0}else{H=44}}else if((o|0)==32){G=B}else{H=44}}while(0);if((H|0)==44){G=D}if((D|0)!=(n|0)){H=un(F<<1)|0;if((H|0)==0){Hn()}else{I=D;J=H;K=H}}else{I=n;J=0;K=p}zf(s,f);_h(I,G,B,K,q,r,s);Fe(c[s>>2]|0)|0;c[u>>2]=c[e>>2];s=c[q>>2]|0;q=c[r>>2]|0;c[l+0>>2]=c[u+0>>2];Uh(t,l,K,s,q,f,g);g=c[t>>2]|0;c[e>>2]=g;c[b>>2]=g;if((J|0)!=0){vn(J)}if((E|0)==0){i=d;return}vn(E);i=d;return}function ai(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+96|0;j=d;k=d+80|0;l=d+60|0;m=d+20|0;n=d+12|0;o=d+16|0;a[k+0|0]=a[16672|0]|0;a[k+1|0]=a[16673|0]|0;a[k+2|0]=a[16674|0]|0;a[k+3|0]=a[16675|0]|0;a[k+4|0]=a[16676|0]|0;a[k+5|0]=a[16677|0]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}p=c[4440]|0;c[j>>2]=h;h=Sh(l,20,p,k,j)|0;k=l+h|0;p=c[f+4>>2]&176;do{if((p|0)==16){q=a[l]|0;if(q<<24>>24==43|q<<24>>24==45){r=l+1|0;break}if((h|0)>1&q<<24>>24==48?(q=a[l+1|0]|0,q<<24>>24==88|q<<24>>24==120):0){r=l+2|0}else{s=10}}else if((p|0)==32){r=k}else{s=10}}while(0);if((s|0)==10){r=l}zf(n,f);s=c[n>>2]|0;if(!((c[4468]|0)==-1)){c[j>>2]=17872;c[j+4>>2]=117;c[j+8>>2]=0;$e(17872,j,118)}p=(c[17876>>2]|0)+ -1|0;q=c[s+8>>2]|0;if(!((c[s+12>>2]|0)-q>>2>>>0>p>>>0)){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}s=c[q+(p<<2)>>2]|0;if((s|0)==0){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}Fe(c[n>>2]|0)|0;Cc[c[(c[s>>2]|0)+32>>2]&7](s,l,k,m)|0;s=m+h|0;if((r|0)==(k|0)){u=s;v=c[e>>2]|0;c[o>>2]=v;c[j+0>>2]=c[o+0>>2];Uh(b,j,m,u,s,f,g);i=d;return}u=m+(r-l)|0;v=c[e>>2]|0;c[o>>2]=v;c[j+0>>2]=c[o+0>>2];Uh(b,j,m,u,s,f,g);i=d;return}function bi(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function ci(a){a=a|0;return}function di(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=i;i=i+32|0;k=j;l=j+28|0;m=j+12|0;n=j+16|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2];p=h&1;c[k+0>>2]=c[l+0>>2];Gc[o&31](b,d,k,f,g,p);i=j;return}zf(m,f);f=c[m>>2]|0;if(!((c[4506]|0)==-1)){c[k>>2]=18024;c[k+4>>2]=117;c[k+8>>2]=0;$e(18024,k,118)}k=(c[18028>>2]|0)+ -1|0;p=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-p>>2>>>0>k>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}f=c[p+(k<<2)>>2]|0;if((f|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[f>>2]|0;if(h){zc[c[m+24>>2]&63](n,f)}else{zc[c[m+28>>2]&63](n,f)}f=a[n]|0;if((f&1)==0){m=n+4|0;r=m;s=n+8|0;t=m}else{m=n+8|0;r=c[m>>2]|0;s=m;t=n+4|0}m=f;f=r;while(1){if((m&1)==0){u=t;v=(m&255)>>>1}else{u=c[s>>2]|0;v=c[t>>2]|0}if((f|0)==(u+(v<<2)|0)){break}r=c[f>>2]|0;h=c[e>>2]|0;if((h|0)!=0){q=h+24|0;k=c[q>>2]|0;if((k|0)==(c[h+28>>2]|0)){w=Lc[c[(c[h>>2]|0)+52>>2]&31](h,r)|0}else{c[q>>2]=k+4;c[k>>2]=r;w=r}if((w|0)==-1){c[e>>2]=0}}m=a[n]|0;f=f+4|0}c[b>>2]=c[e>>2];qf(n);i=j;return}function ei(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+128|0;j=d;k=d+116|0;l=d+104|0;m=d+8|0;n=d+92|0;o=d+96|0;p=d+4|0;q=d+100|0;a[k+0|0]=a[16664|0]|0;a[k+1|0]=a[16665|0]|0;a[k+2|0]=a[16666|0]|0;a[k+3|0]=a[16667|0]|0;a[k+4|0]=a[16668|0]|0;a[k+5|0]=a[16669|0]|0;r=k+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=k+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=100}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}u=c[4440]|0;c[j>>2]=h;h=Sh(l,12,u,k,j)|0;k=l+h|0;u=c[s>>2]&176;do{if((u|0)==16){s=a[l]|0;if(s<<24>>24==43|s<<24>>24==45){w=l+1|0;break}if((h|0)>1&s<<24>>24==48?(s=a[l+1|0]|0,s<<24>>24==88|s<<24>>24==120):0){w=l+2|0}else{x=20}}else if((u|0)==32){w=k}else{x=20}}while(0);if((x|0)==20){w=l}zf(p,f);fi(l,w,k,m,n,o,p);Fe(c[p>>2]|0)|0;c[q>>2]=c[e>>2];e=c[n>>2]|0;n=c[o>>2]|0;c[j+0>>2]=c[q+0>>2];gi(b,j,m,e,n,f,g);i=d;return}function fi(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;k=i;i=i+32|0;l=k;m=k+12|0;n=c[j>>2]|0;if(!((c[4466]|0)==-1)){c[l>>2]=17864;c[l+4>>2]=117;c[l+8>>2]=0;$e(17864,l,118)}o=(c[17868>>2]|0)+ -1|0;p=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-p>>2>>>0>o>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}n=c[p+(o<<2)>>2]|0;if((n|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}q=c[j>>2]|0;if(!((c[4506]|0)==-1)){c[l>>2]=18024;c[l+4>>2]=117;c[l+8>>2]=0;$e(18024,l,118)}l=(c[18028>>2]|0)+ -1|0;j=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-j>>2>>>0>l>>>0)){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}q=c[j+(l<<2)>>2]|0;if((q|0)==0){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}zc[c[(c[q>>2]|0)+20>>2]&63](m,q);r=a[m]|0;if((r&1)==0){s=(r&255)>>>1}else{s=c[m+4>>2]|0}if((s|0)!=0){c[h>>2]=f;s=a[b]|0;if(s<<24>>24==43|s<<24>>24==45){r=Lc[c[(c[n>>2]|0)+44>>2]&31](n,s)|0;s=c[h>>2]|0;c[h>>2]=s+4;c[s>>2]=r;t=b+1|0}else{t=b}if(((e-t|0)>1?(a[t]|0)==48:0)?(r=t+1|0,s=a[r]|0,s<<24>>24==88|s<<24>>24==120):0){s=Lc[c[(c[n>>2]|0)+44>>2]&31](n,48)|0;l=c[h>>2]|0;c[h>>2]=l+4;c[l>>2]=s;s=Lc[c[(c[n>>2]|0)+44>>2]&31](n,a[r]|0)|0;r=c[h>>2]|0;c[h>>2]=r+4;c[r>>2]=s;u=t+2|0}else{u=t}if((u|0)!=(e|0)?(t=e+ -1|0,t>>>0>u>>>0):0){s=u;r=t;do{t=a[s]|0;a[s]=a[r]|0;a[r]=t;s=s+1|0;r=r+ -1|0}while(s>>>0<r>>>0)}r=Ac[c[(c[q>>2]|0)+16>>2]&127](q)|0;if(u>>>0<e>>>0){q=m+1|0;s=m+4|0;t=m+8|0;l=0;j=0;o=u;while(1){p=(a[m]&1)==0;if((a[(p?q:c[t>>2]|0)+j|0]|0)!=0?(l|0)==(a[(p?q:c[t>>2]|0)+j|0]|0):0){p=c[h>>2]|0;c[h>>2]=p+4;c[p>>2]=r;p=a[m]|0;if((p&1)==0){v=(p&255)>>>1}else{v=c[s>>2]|0}w=0;x=(j>>>0<(v+ -1|0)>>>0)+j|0}else{w=l;x=j}p=Lc[c[(c[n>>2]|0)+44>>2]&31](n,a[o]|0)|0;y=c[h>>2]|0;z=y+4|0;c[h>>2]=z;c[y>>2]=p;p=o+1|0;if(p>>>0<e>>>0){l=w+1|0;j=x;o=p}else{A=z;break}}}else{A=c[h>>2]|0}o=f+(u-b<<2)|0;if((o|0)!=(A|0)?(u=A+ -4|0,u>>>0>o>>>0):0){x=o;o=u;while(1){u=c[x>>2]|0;c[x>>2]=c[o>>2];c[o>>2]=u;u=x+4|0;j=o+ -4|0;if(u>>>0<j>>>0){x=u;o=j}else{B=A;break}}}else{B=A}}else{Cc[c[(c[n>>2]|0)+48>>2]&7](n,b,e,f)|0;n=f+(e-b<<2)|0;c[h>>2]=n;B=n}if((d|0)==(e|0)){C=B;c[g>>2]=C;ef(m);i=k;return}C=f+(d-b<<2)|0;c[g>>2]=C;ef(m);i=k;return}function gi(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;k=i;i=i+16|0;l=k;m=c[d>>2]|0;if((m|0)==0){c[b>>2]=0;i=k;return}n=g;g=e;o=n-g>>2;p=h+12|0;h=c[p>>2]|0;q=(h|0)>(o|0)?h-o|0:0;o=f;h=o-g|0;g=h>>2;if((h|0)>0?(Dc[c[(c[m>>2]|0)+48>>2]&31](m,e,g)|0)!=(g|0):0){c[d>>2]=0;c[b>>2]=0;i=k;return}do{if((q|0)>0){pf(l,q,j);if((a[l]&1)==0){r=l+4|0}else{r=c[l+8>>2]|0}if((Dc[c[(c[m>>2]|0)+48>>2]&31](m,r,q)|0)==(q|0)){qf(l);break}c[d>>2]=0;c[b>>2]=0;qf(l);i=k;return}}while(0);l=n-o|0;o=l>>2;if((l|0)>0?(Dc[c[(c[m>>2]|0)+48>>2]&31](m,f,o)|0)!=(o|0):0){c[d>>2]=0;c[b>>2]=0;i=k;return}c[p>>2]=0;c[b>>2]=m;i=k;return}function hi(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+224|0;k=d+8|0;l=d;m=d+196|0;n=d+16|0;o=d+180|0;p=d+184|0;q=d+188|0;r=d+192|0;s=l;c[s>>2]=37;c[s+4>>2]=0;s=l+1|0;t=f+4|0;u=c[t>>2]|0;if((u&2048|0)==0){v=s}else{a[s]=43;v=l+2|0}if((u&512|0)==0){w=v}else{a[v]=35;w=v+1|0}v=w+2|0;a[w]=108;a[w+1|0]=108;w=u&74;do{if((w|0)==8){if((u&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((w|0)==64){a[v]=111}else{a[v]=100}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;w=k;c[w>>2]=h;c[w+4>>2]=j;j=Sh(m,22,v,l,k)|0;l=m+j|0;v=c[t>>2]&176;do{if((v|0)==16){t=a[m]|0;if(t<<24>>24==43|t<<24>>24==45){x=m+1|0;break}if((j|0)>1&t<<24>>24==48?(t=a[m+1|0]|0,t<<24>>24==88|t<<24>>24==120):0){x=m+2|0}else{y=20}}else if((v|0)==32){x=l}else{y=20}}while(0);if((y|0)==20){x=m}zf(q,f);fi(m,x,l,n,o,p,q);Fe(c[q>>2]|0)|0;c[r>>2]=c[e>>2];e=c[o>>2]|0;o=c[p>>2]|0;c[k+0>>2]=c[r+0>>2];gi(b,k,n,e,o,f,g);i=d;return}function ii(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+128|0;j=d;k=d+116|0;l=d+104|0;m=d+8|0;n=d+92|0;o=d+96|0;p=d+4|0;q=d+100|0;a[k+0|0]=a[16664|0]|0;a[k+1|0]=a[16665|0]|0;a[k+2|0]=a[16666|0]|0;a[k+3|0]=a[16667|0]|0;a[k+4|0]=a[16668|0]|0;a[k+5|0]=a[16669|0]|0;r=k+1|0;s=f+4|0;t=c[s>>2]|0;if((t&2048|0)==0){u=r}else{a[r]=43;u=k+2|0}if((t&512|0)==0){v=u}else{a[u]=35;v=u+1|0}a[v]=108;u=v+1|0;v=t&74;do{if((v|0)==64){a[u]=111}else if((v|0)==8){if((t&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}u=c[4440]|0;c[j>>2]=h;h=Sh(l,12,u,k,j)|0;k=l+h|0;u=c[s>>2]&176;do{if((u|0)==16){s=a[l]|0;if(s<<24>>24==43|s<<24>>24==45){w=l+1|0;break}if((h|0)>1&s<<24>>24==48?(s=a[l+1|0]|0,s<<24>>24==88|s<<24>>24==120):0){w=l+2|0}else{x=20}}else if((u|0)==32){w=k}else{x=20}}while(0);if((x|0)==20){w=l}zf(p,f);fi(l,w,k,m,n,o,p);Fe(c[p>>2]|0)|0;c[q>>2]=c[e>>2];e=c[n>>2]|0;n=c[o>>2]|0;c[j+0>>2]=c[q+0>>2];gi(b,j,m,e,n,f,g);i=d;return}function ji(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;d=i;i=i+240|0;k=d+8|0;l=d;m=d+204|0;n=d+16|0;o=d+188|0;p=d+192|0;q=d+196|0;r=d+200|0;s=l;c[s>>2]=37;c[s+4>>2]=0;s=l+1|0;t=f+4|0;u=c[t>>2]|0;if((u&2048|0)==0){v=s}else{a[s]=43;v=l+2|0}if((u&512|0)==0){w=v}else{a[v]=35;w=v+1|0}v=w+2|0;a[w]=108;a[w+1|0]=108;w=u&74;do{if((w|0)==8){if((u&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((w|0)==64){a[v]=111}else{a[v]=117}}while(0);if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;w=k;c[w>>2]=h;c[w+4>>2]=j;j=Sh(m,23,v,l,k)|0;l=m+j|0;v=c[t>>2]&176;do{if((v|0)==16){t=a[m]|0;if(t<<24>>24==43|t<<24>>24==45){x=m+1|0;break}if((j|0)>1&t<<24>>24==48?(t=a[m+1|0]|0,t<<24>>24==88|t<<24>>24==120):0){x=m+2|0}else{y=20}}else if((v|0)==32){x=l}else{y=20}}while(0);if((y|0)==20){x=m}zf(q,f);fi(m,x,l,n,o,p,q);Fe(c[q>>2]|0)|0;c[r>>2]=c[e>>2];e=c[o>>2]|0;o=c[p>>2]|0;c[k+0>>2]=c[r+0>>2];gi(b,k,n,e,o,f,g);i=d;return}function ki(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+304|0;l=d+8|0;m=d;n=d+272|0;o=d+264|0;p=d+36|0;q=d+268|0;r=d+24|0;s=d+20|0;t=d+28|0;u=d+32|0;v=m;c[v>>2]=37;c[v+4>>2]=0;v=m+1|0;w=f+4|0;x=c[w>>2]|0;if((x&2048|0)==0){y=v}else{a[v]=43;y=m+2|0}if((x&1024|0)==0){z=y}else{a[y]=35;z=y+1|0}y=x&260;v=x>>>14;do{if((y|0)==260){if((v&1|0)==0){a[z]=97;A=0;break}else{a[z]=65;A=0;break}}else{a[z]=46;x=z+2|0;a[z+1|0]=42;if((y|0)==256){if((v&1|0)==0){a[x]=101;A=1;break}else{a[x]=69;A=1;break}}else if((y|0)==4){if((v&1|0)==0){a[x]=102;A=1;break}else{a[x]=70;A=1;break}}else{if((v&1|0)==0){a[x]=103;A=1;break}else{a[x]=71;A=1;break}}}}while(0);c[o>>2]=n;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;if(A){c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}else{h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}if((B|0)>29){v=(a[17768]|0)==0;if(A){if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}A=c[4440]|0;c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];C=Zh(o,A,m,l)|0}else{if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;c[l>>2]=c[f+8>>2];A=l+4|0;h[k>>3]=j;c[A>>2]=c[k>>2];c[A+4>>2]=c[k+4>>2];C=Zh(o,v,m,l)|0}m=c[o>>2]|0;if((m|0)==0){Hn()}else{D=m;E=m;F=C}}else{D=c[o>>2]|0;E=0;F=B}B=D+F|0;o=c[w>>2]&176;do{if((o|0)==16){w=a[D]|0;if(w<<24>>24==43|w<<24>>24==45){G=D+1|0;break}if((F|0)>1&w<<24>>24==48?(w=a[D+1|0]|0,w<<24>>24==88|w<<24>>24==120):0){G=D+2|0}else{H=44}}else if((o|0)==32){G=B}else{H=44}}while(0);if((H|0)==44){G=D}if((D|0)!=(n|0)){H=un(F<<3)|0;if((H|0)==0){Hn()}else{I=D;J=H;K=H}}else{I=n;J=0;K=p}zf(s,f);li(I,G,B,K,q,r,s);Fe(c[s>>2]|0)|0;c[u>>2]=c[e>>2];s=c[q>>2]|0;q=c[r>>2]|0;c[l+0>>2]=c[u+0>>2];gi(t,l,K,s,q,f,g);g=c[t>>2]|0;c[e>>2]=g;c[b>>2]=g;if((J|0)!=0){vn(J)}if((E|0)==0){i=d;return}vn(E);i=d;return}function li(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;k=i;i=i+32|0;l=k;m=k+12|0;n=c[j>>2]|0;if(!((c[4466]|0)==-1)){c[l>>2]=17864;c[l+4>>2]=117;c[l+8>>2]=0;$e(17864,l,118)}o=(c[17868>>2]|0)+ -1|0;p=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-p>>2>>>0>o>>>0)){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}n=c[p+(o<<2)>>2]|0;if((n|0)==0){q=Gb(4)|0;_m(q);pc(q|0,25832,102)}q=c[j>>2]|0;if(!((c[4506]|0)==-1)){c[l>>2]=18024;c[l+4>>2]=117;c[l+8>>2]=0;$e(18024,l,118)}l=(c[18028>>2]|0)+ -1|0;j=c[q+8>>2]|0;if(!((c[q+12>>2]|0)-j>>2>>>0>l>>>0)){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}q=c[j+(l<<2)>>2]|0;if((q|0)==0){r=Gb(4)|0;_m(r);pc(r|0,25832,102)}zc[c[(c[q>>2]|0)+20>>2]&63](m,q);c[h>>2]=f;r=a[b]|0;if(r<<24>>24==43|r<<24>>24==45){l=Lc[c[(c[n>>2]|0)+44>>2]&31](n,r)|0;r=c[h>>2]|0;c[h>>2]=r+4;c[r>>2]=l;s=b+1|0}else{s=b}l=e;a:do{if(((l-s|0)>1?(a[s]|0)==48:0)?(r=s+1|0,j=a[r]|0,j<<24>>24==88|j<<24>>24==120):0){j=Lc[c[(c[n>>2]|0)+44>>2]&31](n,48)|0;o=c[h>>2]|0;c[h>>2]=o+4;c[o>>2]=j;j=s+2|0;o=Lc[c[(c[n>>2]|0)+44>>2]&31](n,a[r]|0)|0;r=c[h>>2]|0;c[h>>2]=r+4;c[r>>2]=o;if(j>>>0<e>>>0){o=j;while(1){r=a[o]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}p=o+1|0;if((ib(r<<24>>24|0,c[4440]|0)|0)==0){t=j;u=o;break a}if(p>>>0<e>>>0){o=p}else{t=j;u=p;break}}}else{t=j;u=j}}else{v=14}}while(0);b:do{if((v|0)==14){if(s>>>0<e>>>0){o=s;while(1){p=a[o]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}r=o+1|0;if((nb(p<<24>>24|0,c[4440]|0)|0)==0){t=s;u=o;break b}if(r>>>0<e>>>0){o=r}else{t=s;u=r;break}}}else{t=s;u=s}}}while(0);s=a[m]|0;if((s&1)==0){w=(s&255)>>>1}else{w=c[m+4>>2]|0}if((w|0)!=0){if((t|0)!=(u|0)?(w=u+ -1|0,w>>>0>t>>>0):0){s=t;v=w;do{w=a[s]|0;a[s]=a[v]|0;a[v]=w;s=s+1|0;v=v+ -1|0}while(s>>>0<v>>>0)}v=Ac[c[(c[q>>2]|0)+16>>2]&127](q)|0;if(t>>>0<u>>>0){s=m+1|0;w=m+4|0;o=m+8|0;j=0;r=0;p=t;while(1){x=(a[m]&1)==0;if((a[(x?s:c[o>>2]|0)+r|0]|0)>0?(j|0)==(a[(x?s:c[o>>2]|0)+r|0]|0):0){x=c[h>>2]|0;c[h>>2]=x+4;c[x>>2]=v;x=a[m]|0;if((x&1)==0){y=(x&255)>>>1}else{y=c[w>>2]|0}z=0;A=(r>>>0<(y+ -1|0)>>>0)+r|0}else{z=j;A=r}x=Lc[c[(c[n>>2]|0)+44>>2]&31](n,a[p]|0)|0;B=c[h>>2]|0;C=B+4|0;c[h>>2]=C;c[B>>2]=x;x=p+1|0;if(x>>>0<u>>>0){j=z+1|0;r=A;p=x}else{D=C;break}}}else{D=c[h>>2]|0}p=f+(t-b<<2)|0;if((p|0)!=(D|0)?(A=D+ -4|0,A>>>0>p>>>0):0){r=p;p=A;while(1){A=c[r>>2]|0;c[r>>2]=c[p>>2];c[p>>2]=A;A=r+4|0;z=p+ -4|0;if(A>>>0<z>>>0){r=A;p=z}else{E=D;break}}}else{E=D}}else{Cc[c[(c[n>>2]|0)+48>>2]&7](n,t,u,c[h>>2]|0)|0;D=(c[h>>2]|0)+(u-t<<2)|0;c[h>>2]=D;E=D}c:do{if(u>>>0<e>>>0){D=u;while(1){t=a[D]|0;if(t<<24>>24==46){break}p=Lc[c[(c[n>>2]|0)+44>>2]&31](n,t)|0;t=c[h>>2]|0;r=t+4|0;c[h>>2]=r;c[t>>2]=p;p=D+1|0;if(p>>>0<e>>>0){D=p}else{F=r;G=p;break c}}p=Ac[c[(c[q>>2]|0)+12>>2]&127](q)|0;r=c[h>>2]|0;t=r+4|0;c[h>>2]=t;c[r>>2]=p;F=t;G=D+1|0}else{F=E;G=u}}while(0);Cc[c[(c[n>>2]|0)+48>>2]&7](n,G,e,F)|0;F=(c[h>>2]|0)+(l-G<<2)|0;c[h>>2]=F;if((d|0)==(e|0)){H=F;c[g>>2]=H;ef(m);i=k;return}H=f+(d-b<<2)|0;c[g>>2]=H;ef(m);i=k;return}function mi(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+304|0;l=d+8|0;m=d;n=d+272|0;o=d+264|0;p=d+36|0;q=d+268|0;r=d+24|0;s=d+20|0;t=d+28|0;u=d+32|0;v=m;c[v>>2]=37;c[v+4>>2]=0;v=m+1|0;w=f+4|0;x=c[w>>2]|0;if((x&2048|0)==0){y=v}else{a[v]=43;y=m+2|0}if((x&1024|0)==0){z=y}else{a[y]=35;z=y+1|0}y=x&260;v=x>>>14;do{if((y|0)==260){a[z]=76;x=z+1|0;if((v&1|0)==0){a[x]=97;A=0;break}else{a[x]=65;A=0;break}}else{a[z]=46;a[z+1|0]=42;a[z+2|0]=76;x=z+3|0;if((y|0)==4){if((v&1|0)==0){a[x]=102;A=1;break}else{a[x]=70;A=1;break}}else if((y|0)==256){if((v&1|0)==0){a[x]=101;A=1;break}else{a[x]=69;A=1;break}}else{if((v&1|0)==0){a[x]=103;A=1;break}else{a[x]=71;A=1;break}}}}while(0);c[o>>2]=n;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;if(A){c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}else{h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];B=Sh(n,30,v,m,l)|0}if((B|0)>29){v=(a[17768]|0)==0;if(A){if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}A=c[4440]|0;c[l>>2]=c[f+8>>2];y=l+4|0;h[k>>3]=j;c[y>>2]=c[k>>2];c[y+4>>2]=c[k+4>>2];C=Zh(o,A,m,l)|0}else{if(v?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}v=c[4440]|0;h[k>>3]=j;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];C=Zh(o,v,m,l)|0}m=c[o>>2]|0;if((m|0)==0){Hn()}else{D=m;E=m;F=C}}else{D=c[o>>2]|0;E=0;F=B}B=D+F|0;o=c[w>>2]&176;do{if((o|0)==16){w=a[D]|0;if(w<<24>>24==43|w<<24>>24==45){G=D+1|0;break}if((F|0)>1&w<<24>>24==48?(w=a[D+1|0]|0,w<<24>>24==88|w<<24>>24==120):0){G=D+2|0}else{H=44}}else if((o|0)==32){G=B}else{H=44}}while(0);if((H|0)==44){G=D}if((D|0)!=(n|0)){H=un(F<<3)|0;if((H|0)==0){Hn()}else{I=D;J=H;K=H}}else{I=n;J=0;K=p}zf(s,f);li(I,G,B,K,q,r,s);Fe(c[s>>2]|0)|0;c[u>>2]=c[e>>2];s=c[q>>2]|0;q=c[r>>2]|0;c[l+0>>2]=c[u+0>>2];gi(t,l,K,s,q,f,g);g=c[t>>2]|0;c[e>>2]=g;c[b>>2]=g;if((J|0)!=0){vn(J)}if((E|0)==0){i=d;return}vn(E);i=d;return}function ni(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;d=i;i=i+208|0;j=d;k=d+188|0;l=d+168|0;m=d+16|0;n=d+12|0;o=d+164|0;a[k+0|0]=a[16672|0]|0;a[k+1|0]=a[16673|0]|0;a[k+2|0]=a[16674|0]|0;a[k+3|0]=a[16675|0]|0;a[k+4|0]=a[16676|0]|0;a[k+5|0]=a[16677|0]|0;if((a[17768]|0)==0?(La(17768)|0)!=0:0){c[4440]=mb(2147483647,17776,0)|0;jb(17768)}p=c[4440]|0;c[j>>2]=h;h=Sh(l,20,p,k,j)|0;k=l+h|0;p=c[f+4>>2]&176;do{if((p|0)==32){q=k}else if((p|0)==16){r=a[l]|0;if(r<<24>>24==43|r<<24>>24==45){q=l+1|0;break}if((h|0)>1&r<<24>>24==48?(r=a[l+1|0]|0,r<<24>>24==88|r<<24>>24==120):0){q=l+2|0}else{s=10}}else{s=10}}while(0);if((s|0)==10){q=l}zf(n,f);s=c[n>>2]|0;if(!((c[4466]|0)==-1)){c[j>>2]=17864;c[j+4>>2]=117;c[j+8>>2]=0;$e(17864,j,118)}p=(c[17868>>2]|0)+ -1|0;r=c[s+8>>2]|0;if(!((c[s+12>>2]|0)-r>>2>>>0>p>>>0)){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}s=c[r+(p<<2)>>2]|0;if((s|0)==0){t=Gb(4)|0;_m(t);pc(t|0,25832,102)}Fe(c[n>>2]|0)|0;Cc[c[(c[s>>2]|0)+48>>2]&7](s,l,k,m)|0;s=m+(h<<2)|0;if((q|0)==(k|0)){u=s;v=c[e>>2]|0;c[o>>2]=v;c[j+0>>2]=c[o+0>>2];gi(b,j,m,u,s,f,g);i=d;return}u=m+(q-l<<2)|0;v=c[e>>2]|0;c[o>>2]=v;c[j+0>>2]=c[o+0>>2];gi(b,j,m,u,s,f,g);i=d;return}function oi(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;o=i;i=i+32|0;p=o;q=o+28|0;r=o+12|0;s=o+16|0;t=o+20|0;u=o+24|0;zf(r,j);v=c[r>>2]|0;if(!((c[4468]|0)==-1)){c[p>>2]=17872;c[p+4>>2]=117;c[p+8>>2]=0;$e(17872,p,118)}w=(c[17876>>2]|0)+ -1|0;x=c[v+8>>2]|0;if(!((c[v+12>>2]|0)-x>>2>>>0>w>>>0)){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}v=c[x+(w<<2)>>2]|0;if((v|0)==0){y=Gb(4)|0;_m(y);pc(y|0,25832,102)}Fe(c[r>>2]|0)|0;c[k>>2]=0;a:do{if((m|0)!=(n|0)){r=v+8|0;y=m;w=0;b:while(1){x=w;while(1){if((x|0)!=0){z=65;break a}A=c[g>>2]|0;if((A|0)!=0){if((c[A+12>>2]|0)==(c[A+16>>2]|0)?(Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1:0){c[g>>2]=0;B=0}else{B=A}}else{B=0}A=(B|0)==0;C=c[h>>2]|0;do{if((C|0)!=0){if((c[C+12>>2]|0)==(c[C+16>>2]|0)?(Ac[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1:0){c[h>>2]=0;z=19;break}if(A){D=C}else{z=20;break b}}else{z=19}}while(0);if((z|0)==19){z=0;if(A){z=20;break b}else{D=0}}if((Dc[c[(c[v>>2]|0)+36>>2]&31](v,a[y]|0,0)|0)<<24>>24==37){z=22;break}C=a[y]|0;if(C<<24>>24>-1?(E=c[r>>2]|0,!((b[E+(C<<24>>24<<1)>>1]&8192)==0)):0){F=y;z=33;break}G=B+12|0;C=c[G>>2]|0;H=B+16|0;if((C|0)==(c[H>>2]|0)){I=Ac[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{I=d[C]|0}C=Lc[c[(c[v>>2]|0)+12>>2]&31](v,I&255)|0;if(C<<24>>24==(Lc[c[(c[v>>2]|0)+12>>2]&31](v,a[y]|0)|0)<<24>>24){z=60;break}c[k>>2]=4;x=4}c:do{if((z|0)==22){z=0;x=y+1|0;if((x|0)==(n|0)){z=23;break b}C=Dc[c[(c[v>>2]|0)+36>>2]&31](v,a[x]|0,0)|0;if(C<<24>>24==48|C<<24>>24==69){J=y+2|0;if((J|0)==(n|0)){z=26;break b}K=J;L=Dc[c[(c[v>>2]|0)+36>>2]&31](v,a[J]|0,0)|0;M=C}else{K=x;L=C;M=0}C=c[(c[f>>2]|0)+36>>2]|0;c[t>>2]=B;c[u>>2]=D;c[q+0>>2]=c[t+0>>2];c[p+0>>2]=c[u+0>>2];Kc[C&3](s,f,q,p,j,k,l,L,M);c[g>>2]=c[s>>2];N=K+1|0}else if((z|0)==33){while(1){z=0;C=F+1|0;if((C|0)==(n|0)){O=n;break}x=a[C]|0;if(!(x<<24>>24>-1)){O=C;break}if((b[E+(x<<24>>24<<1)>>1]&8192)==0){O=C;break}else{F=C;z=33}}A=B;C=D;x=D;while(1){if((A|0)!=0){if((c[A+12>>2]|0)==(c[A+16>>2]|0)?(Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1:0){c[g>>2]=0;P=0}else{P=A}}else{P=0}J=(P|0)==0;do{if((x|0)!=0){if((c[x+12>>2]|0)!=(c[x+16>>2]|0)){if(J){Q=C;R=x;break}else{N=O;break c}}if(!((Ac[c[(c[x>>2]|0)+36>>2]&127](x)|0)==-1)){if(J^(C|0)==0){Q=C;R=C;break}else{N=O;break c}}else{c[h>>2]=0;S=0;z=46;break}}else{S=C;z=46}}while(0);if((z|0)==46){z=0;if(J){N=O;break c}else{Q=S;R=0}}T=P+12|0;U=c[T>>2]|0;V=P+16|0;if((U|0)==(c[V>>2]|0)){W=Ac[c[(c[P>>2]|0)+36>>2]&127](P)|0}else{W=d[U]|0}if(!((W&255)<<24>>24>-1)){N=O;break c}if((b[(c[r>>2]|0)+(W<<24>>24<<1)>>1]&8192)==0){N=O;break c}U=c[T>>2]|0;if((U|0)==(c[V>>2]|0)){Ac[c[(c[P>>2]|0)+40>>2]&127](P)|0;A=P;C=Q;x=R;continue}else{c[T>>2]=U+1;A=P;C=Q;x=R;continue}}}else if((z|0)==60){z=0;x=c[G>>2]|0;if((x|0)==(c[H>>2]|0)){Ac[c[(c[B>>2]|0)+40>>2]&127](B)|0}else{c[G>>2]=x+1}N=y+1|0}}while(0);if((N|0)==(n|0)){z=65;break a}y=N;w=c[k>>2]|0}if((z|0)==20){c[k>>2]=4;X=B;break}else if((z|0)==23){c[k>>2]=4;X=B;break}else if((z|0)==26){c[k>>2]=4;X=B;break}}else{z=65}}while(0);if((z|0)==65){X=c[g>>2]|0}if((X|0)!=0){if((c[X+12>>2]|0)==(c[X+16>>2]|0)?(Ac[c[(c[X>>2]|0)+36>>2]&127](X)|0)==-1:0){c[g>>2]=0;Y=0}else{Y=X}}else{Y=0}X=(Y|0)==0;g=c[h>>2]|0;do{if((g|0)!=0){if((c[g+12>>2]|0)==(c[g+16>>2]|0)?(Ac[c[(c[g>>2]|0)+36>>2]&127](g)|0)==-1:0){c[h>>2]=0;z=75;break}if(X){c[e>>2]=Y;i=o;return}}else{z=75}}while(0);if((z|0)==75?!X:0){c[e>>2]=Y;i=o;return}c[k>>2]=c[k>>2]|2;c[e>>2]=Y;i=o;return}function pi(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function qi(a){a=a|0;return}function ri(a){a=a|0;return 2}function si(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+16|0;k=j+12|0;l=j;m=j+4|0;n=j+8|0;c[m>>2]=c[d>>2];c[n>>2]=c[e>>2];c[l+0>>2]=c[m+0>>2];c[k+0>>2]=c[n+0>>2];oi(a,b,l,k,f,g,h,16776,16784|0);i=j;return}function ti(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;k=i;i=i+16|0;l=k+12|0;m=k;n=k+4|0;o=k+8|0;p=d+8|0;q=Ac[c[(c[p>>2]|0)+20>>2]&127](p)|0;c[n>>2]=c[e>>2];c[o>>2]=c[f>>2];f=a[q]|0;if((f&1)==0){r=q+1|0;s=(f&255)>>>1;t=q+1|0}else{f=c[q+8>>2]|0;r=f;s=c[q+4>>2]|0;t=f}f=r+s|0;c[m+0>>2]=c[n+0>>2];c[l+0>>2]=c[o+0>>2];oi(b,d,m,l,g,h,j,t,f);i=k;return}function ui(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+32|0;k=j;l=j+16|0;m=j+12|0;zf(m,f);f=c[m>>2]|0;if(!((c[4468]|0)==-1)){c[k>>2]=17872;c[k+4>>2]=117;c[k+8>>2]=0;$e(17872,k,118)}n=(c[17876>>2]|0)+ -1|0;o=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-o>>2>>>0>n>>>0)){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}f=c[o+(n<<2)>>2]|0;if((f|0)==0){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[e>>2]|0;e=b+8|0;b=Ac[c[c[e>>2]>>2]&127](e)|0;c[l>>2]=m;m=b+168|0;c[k+0>>2]=c[l+0>>2];l=(Qg(d,k,b,m,f,g,0)|0)-b|0;if((l|0)>=168){q=c[d>>2]|0;c[a>>2]=q;i=j;return}c[h+24>>2]=((l|0)/12|0|0)%7|0;q=c[d>>2]|0;c[a>>2]=q;i=j;return}function vi(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+32|0;k=j;l=j+16|0;m=j+12|0;zf(m,f);f=c[m>>2]|0;if(!((c[4468]|0)==-1)){c[k>>2]=17872;c[k+4>>2]=117;c[k+8>>2]=0;$e(17872,k,118)}n=(c[17876>>2]|0)+ -1|0;o=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-o>>2>>>0>n>>>0)){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}f=c[o+(n<<2)>>2]|0;if((f|0)==0){p=Gb(4)|0;_m(p);pc(p|0,25832,102)}Fe(c[m>>2]|0)|0;m=c[e>>2]|0;e=b+8|0;b=Ac[c[(c[e>>2]|0)+4>>2]&127](e)|0;c[l>>2]=m;m=b+288|0;c[k+0>>2]=c[l+0>>2];l=(Qg(d,k,b,m,f,g,0)|0)-b|0;if((l|0)>=288){q=c[d>>2]|0;c[a>>2]=q;i=j;return}c[h+16>>2]=((l|0)/12|0|0)%12|0;q=c[d>>2]|0;c[a>>2]=q;i=j;return}function wi(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;b=i;i=i+32|0;j=b;k=b+16|0;l=b+12|0;zf(l,f);f=c[l>>2]|0;if(!((c[4468]|0)==-1)){c[j>>2]=17872;c[j+4>>2]=117;c[j+8>>2]=0;$e(17872,j,118)}m=(c[17876>>2]|0)+ -1|0;n=c[f+8>>2]|0;if(!((c[f+12>>2]|0)-n>>2>>>0>m>>>0)){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}f=c[n+(m<<2)>>2]|0;if((f|0)==0){o=Gb(4)|0;_m(o);pc(o|0,25832,102)}Fe(c[l>>2]|0)|0;l=h+20|0;c[k>>2]=c[e>>2];c[j+0>>2]=c[k+0>>2];k=Ai(d,j,g,f,4)|0;if((c[g>>2]&4|0)!=0){p=c[d>>2]|0;c[a>>2]=p;i=b;return}if((k|0)<69){q=k+2e3|0}else{q=(k+ -69|0)>>>0<31?k+1900|0:k}c[l>>2]=q+ -1900;p=c[d>>2]|0;c[a>>2]=p;i=b;return}function xi(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0;l=i;i=i+176|0;m=l;n=l+160|0;o=l+156|0;p=l+152|0;q=l+148|0;r=l+144|0;s=l+140|0;t=l+136|0;u=l+132|0;v=l+128|0;w=l+124|0;x=l+120|0;y=l+116|0;z=l+112|0;A=l+108|0;B=l+104|0;C=l+100|0;D=l+96|0;E=l+92|0;F=l+88|0;G=l+164|0;H=l+44|0;I=l+36|0;J=l+32|0;K=l+28|0;L=l+40|0;M=l+16|0;N=l+12|0;O=l+20|0;P=l+24|0;Q=l+80|0;R=l+48|0;S=l+52|0;T=l+56|0;U=l+60|0;V=l+64|0;W=l+68|0;X=l+72|0;Y=l+76|0;Z=l+84|0;c[h>>2]=0;zf(A,g);_=c[A>>2]|0;if(!((c[4468]|0)==-1)){c[m>>2]=17872;c[m+4>>2]=117;c[m+8>>2]=0;$e(17872,m,118)}$=(c[17876>>2]|0)+ -1|0;aa=c[_+8>>2]|0;if(!((c[_+12>>2]|0)-aa>>2>>>0>$>>>0)){ba=Gb(4)|0;_m(ba);pc(ba|0,25832,102)}_=c[aa+($<<2)>>2]|0;if((_|0)==0){ba=Gb(4)|0;_m(ba);pc(ba|0,25832,102)}Fe(c[A>>2]|0)|0;a:do{switch(k<<24>>24|0){case 70:{c[I>>2]=c[e>>2];c[J>>2]=c[f>>2];c[n+0>>2]=c[I+0>>2];c[m+0>>2]=c[J+0>>2];oi(H,d,n,m,g,h,j,16792,16800|0);c[e>>2]=c[H>>2];break};case 121:{A=j+20|0;c[o>>2]=c[f>>2];c[m+0>>2]=c[o+0>>2];ba=Ai(e,m,h,_,4)|0;if((c[h>>2]&4|0)==0){if((ba|0)<69){ca=ba+2e3|0}else{ca=(ba+ -69|0)>>>0<31?ba+1900|0:ba}c[A>>2]=ca+ -1900}break};case 112:{A=j+8|0;ba=c[f>>2]|0;$=d+8|0;aa=Ac[c[(c[$>>2]|0)+8>>2]&127]($)|0;$=a[aa]|0;if(($&1)==0){da=($&255)>>>1}else{da=c[aa+4>>2]|0}$=a[aa+12|0]|0;if(($&1)==0){ea=($&255)>>>1}else{ea=c[aa+16>>2]|0}if((da|0)==(0-ea|0)){c[h>>2]=c[h>>2]|4;break a}c[r>>2]=ba;c[m+0>>2]=c[r+0>>2];ba=Qg(e,m,aa,aa+24|0,_,h,0)|0;$=ba-aa|0;if((ba|0)==(aa|0)?(c[A>>2]|0)==12:0){c[A>>2]=0;break a}if(($|0)==12?($=c[A>>2]|0,($|0)<12):0){c[A>>2]=$+12}break};case 89:{c[n>>2]=c[f>>2];c[m+0>>2]=c[n+0>>2];$=Ai(e,m,h,_,4)|0;if((c[h>>2]&4|0)==0){c[j+20>>2]=$+ -1900}break};case 120:{$=c[(c[d>>2]|0)+20>>2]|0;c[U>>2]=c[e>>2];c[V>>2]=c[f>>2];c[n+0>>2]=c[U+0>>2];c[m+0>>2]=c[V+0>>2];Ic[$&63](b,d,n,m,g,h,j);i=l;return};case 88:{$=d+8|0;A=Ac[c[(c[$>>2]|0)+24>>2]&127]($)|0;c[X>>2]=c[e>>2];c[Y>>2]=c[f>>2];$=a[A]|0;if(($&1)==0){fa=A+1|0;ga=($&255)>>>1;ha=A+1|0}else{$=c[A+8>>2]|0;fa=$;ga=c[A+4>>2]|0;ha=$}c[n+0>>2]=c[X+0>>2];c[m+0>>2]=c[Y+0>>2];oi(W,d,n,m,g,h,j,ha,fa+ga|0);c[e>>2]=c[W>>2];break};case 114:{c[M>>2]=c[e>>2];c[N>>2]=c[f>>2];c[n+0>>2]=c[M+0>>2];c[m+0>>2]=c[N+0>>2];oi(L,d,n,m,g,h,j,16800,16811|0);c[e>>2]=c[L>>2];break};case 82:{c[P>>2]=c[e>>2];c[Q>>2]=c[f>>2];c[n+0>>2]=c[P+0>>2];c[m+0>>2]=c[Q+0>>2];oi(O,d,n,m,g,h,j,16816,16821|0);c[e>>2]=c[O>>2];break};case 83:{c[q>>2]=c[f>>2];c[m+0>>2]=c[q+0>>2];$=Ai(e,m,h,_,2)|0;A=c[h>>2]|0;if((A&4|0)==0&($|0)<61){c[j>>2]=$;break a}else{c[h>>2]=A|4;break a}break};case 109:{c[t>>2]=c[f>>2];c[m+0>>2]=c[t+0>>2];A=Ai(e,m,h,_,2)|0;$=c[h>>2]|0;if(($&4|0)==0&(A|0)<13){c[j+16>>2]=A+ -1;break a}else{c[h>>2]=$|4;break a}break};case 77:{c[s>>2]=c[f>>2];c[m+0>>2]=c[s+0>>2];$=Ai(e,m,h,_,2)|0;A=c[h>>2]|0;if((A&4|0)==0&($|0)<60){c[j+4>>2]=$;break a}else{c[h>>2]=A|4;break a}break};case 72:{c[w>>2]=c[f>>2];c[m+0>>2]=c[w+0>>2];A=Ai(e,m,h,_,2)|0;$=c[h>>2]|0;if(($&4|0)==0&(A|0)<24){c[j+8>>2]=A;break a}else{c[h>>2]=$|4;break a}break};case 68:{c[F>>2]=c[e>>2];c[G>>2]=c[f>>2];c[n+0>>2]=c[F+0>>2];c[m+0>>2]=c[G+0>>2];oi(E,d,n,m,g,h,j,16784,16792|0);c[e>>2]=c[E>>2];break};case 37:{c[Z>>2]=c[f>>2];c[m+0>>2]=c[Z+0>>2];zi(0,e,m,h,_);break};case 119:{c[p>>2]=c[f>>2];c[m+0>>2]=c[p+0>>2];$=Ai(e,m,h,_,1)|0;A=c[h>>2]|0;if((A&4|0)==0&($|0)<7){c[j+24>>2]=$;break a}else{c[h>>2]=A|4;break a}break};case 106:{c[u>>2]=c[f>>2];c[m+0>>2]=c[u+0>>2];A=Ai(e,m,h,_,3)|0;$=c[h>>2]|0;if(($&4|0)==0&(A|0)<366){c[j+28>>2]=A;break a}else{c[h>>2]=$|4;break a}break};case 73:{$=j+8|0;c[v>>2]=c[f>>2];c[m+0>>2]=c[v+0>>2];A=Ai(e,m,h,_,2)|0;aa=c[h>>2]|0;if((aa&4|0)==0?(A+ -1|0)>>>0<12:0){c[$>>2]=A;break a}c[h>>2]=aa|4;break};case 84:{c[S>>2]=c[e>>2];c[T>>2]=c[f>>2];c[n+0>>2]=c[S+0>>2];c[m+0>>2]=c[T+0>>2];oi(R,d,n,m,g,h,j,16824,16832|0);c[e>>2]=c[R>>2];break};case 116:case 110:{c[K>>2]=c[f>>2];c[m+0>>2]=c[K+0>>2];yi(0,e,m,h,_);break};case 99:{aa=d+8|0;A=Ac[c[(c[aa>>2]|0)+12>>2]&127](aa)|0;c[C>>2]=c[e>>2];c[D>>2]=c[f>>2];aa=a[A]|0;if((aa&1)==0){ia=A+1|0;ja=(aa&255)>>>1;ka=A+1|0}else{aa=c[A+8>>2]|0;ia=aa;ja=c[A+4>>2]|0;ka=aa}c[n+0>>2]=c[C+0>>2];c[m+0>>2]=c[D+0>>2];oi(B,d,n,m,g,h,j,ka,ia+ja|0);c[e>>2]=c[B>>2];break};case 101:case 100:{aa=j+12|0;c[x>>2]=c[f>>2];c[m+0>>2]=c[x+0>>2];A=Ai(e,m,h,_,2)|0;$=c[h>>2]|0;if(($&4|0)==0?(A+ -1|0)>>>0<31:0){c[aa>>2]=A;break a}c[h>>2]=$|4;break};case 65:case 97:{$=c[f>>2]|0;A=d+8|0;aa=Ac[c[c[A>>2]>>2]&127](A)|0;c[z>>2]=$;c[m+0>>2]=c[z+0>>2];$=(Qg(e,m,aa,aa+168|0,_,h,0)|0)-aa|0;if(($|0)<168){c[j+24>>2]=(($|0)/12|0|0)%7|0}break};case 104:case 66:case 98:{$=c[f>>2]|0;aa=d+8|0;A=Ac[c[(c[aa>>2]|0)+4>>2]&127](aa)|0;c[y>>2]=$;c[m+0>>2]=c[y+0>>2];$=(Qg(e,m,A,A+288|0,_,h,0)|0)-A|0;if(($|0)<288){c[j+16>>2]=(($|0)/12|0|0)%12|0}break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}function yi(a,e,f,g,h){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;a=i;j=h+8|0;a:while(1){h=c[e>>2]|0;do{if((h|0)!=0){if((c[h+12>>2]|0)==(c[h+16>>2]|0)){if((Ac[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[e>>2]=0;k=0;break}else{k=c[e>>2]|0;break}}else{k=h}}else{k=0}}while(0);h=(k|0)==0;l=c[f>>2]|0;do{if((l|0)!=0){if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){if(h){m=l;break}else{n=l;break a}}if(!((Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1)){if(h){m=l;break}else{n=l;break a}}else{c[f>>2]=0;o=12;break}}else{o=12}}while(0);if((o|0)==12){o=0;if(h){n=0;break}else{m=0}}l=c[e>>2]|0;p=c[l+12>>2]|0;if((p|0)==(c[l+16>>2]|0)){q=Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{q=d[p]|0}if(!((q&255)<<24>>24>-1)){n=m;break}if((b[(c[j>>2]|0)+(q<<24>>24<<1)>>1]&8192)==0){n=m;break}p=c[e>>2]|0;l=p+12|0;r=c[l>>2]|0;if((r|0)==(c[p+16>>2]|0)){Ac[c[(c[p>>2]|0)+40>>2]&127](p)|0;continue}else{c[l>>2]=r+1;continue}}m=c[e>>2]|0;do{if((m|0)!=0){if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if((Ac[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1){c[e>>2]=0;s=0;break}else{s=c[e>>2]|0;break}}else{s=m}}else{s=0}}while(0);m=(s|0)==0;do{if((n|0)!=0){if((c[n+12>>2]|0)==(c[n+16>>2]|0)?(Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1:0){c[f>>2]=0;o=32;break}if(m){i=a;return}}else{o=32}}while(0);if((o|0)==32?!m:0){i=a;return}c[g>>2]=c[g>>2]|2;i=a;return}function zi(a,b,e,f,g){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;a=i;h=c[b>>2]|0;do{if((h|0)!=0){if((c[h+12>>2]|0)==(c[h+16>>2]|0)){if((Ac[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[b>>2]=0;j=0;break}else{j=c[b>>2]|0;break}}else{j=h}}else{j=0}}while(0);h=(j|0)==0;j=c[e>>2]|0;do{if((j|0)!=0){if((c[j+12>>2]|0)==(c[j+16>>2]|0)?(Ac[c[(c[j>>2]|0)+36>>2]&127](j)|0)==-1:0){c[e>>2]=0;k=11;break}if(h){l=j}else{k=12}}else{k=11}}while(0);if((k|0)==11){if(h){k=12}else{l=0}}if((k|0)==12){c[f>>2]=c[f>>2]|6;i=a;return}h=c[b>>2]|0;j=c[h+12>>2]|0;if((j|0)==(c[h+16>>2]|0)){m=Ac[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{m=d[j]|0}if(!((Dc[c[(c[g>>2]|0)+36>>2]&31](g,m&255,0)|0)<<24>>24==37)){c[f>>2]=c[f>>2]|4;i=a;return}m=c[b>>2]|0;g=m+12|0;j=c[g>>2]|0;if((j|0)==(c[m+16>>2]|0)){Ac[c[(c[m>>2]|0)+40>>2]&127](m)|0}else{c[g>>2]=j+1}j=c[b>>2]|0;do{if((j|0)!=0){if((c[j+12>>2]|0)==(c[j+16>>2]|0)){if((Ac[c[(c[j>>2]|0)+36>>2]&127](j)|0)==-1){c[b>>2]=0;n=0;break}else{n=c[b>>2]|0;break}}else{n=j}}else{n=0}}while(0);j=(n|0)==0;do{if((l|0)!=0){if((c[l+12>>2]|0)==(c[l+16>>2]|0)?(Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1:0){c[e>>2]=0;k=31;break}if(j){i=a;return}}else{k=31}}while(0);if((k|0)==31?!j:0){i=a;return}c[f>>2]=c[f>>2]|2;i=a;return}function Ai(a,e,f,g,h){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;j=i;k=c[a>>2]|0;do{if((k|0)!=0){if((c[k+12>>2]|0)==(c[k+16>>2]|0)){if((Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1){c[a>>2]=0;l=0;break}else{l=c[a>>2]|0;break}}else{l=k}}else{l=0}}while(0);k=(l|0)==0;l=c[e>>2]|0;do{if((l|0)!=0){if((c[l+12>>2]|0)==(c[l+16>>2]|0)?(Ac[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1:0){c[e>>2]=0;m=11;break}if(k){n=l}else{m=12}}else{m=11}}while(0);if((m|0)==11){if(k){m=12}else{n=0}}if((m|0)==12){c[f>>2]=c[f>>2]|6;o=0;i=j;return o|0}k=c[a>>2]|0;l=c[k+12>>2]|0;if((l|0)==(c[k+16>>2]|0)){p=Ac[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{p=d[l]|0}l=p&255;if(l<<24>>24>-1?(k=g+8|0,!((b[(c[k>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0)):0){p=(Dc[c[(c[g>>2]|0)+36>>2]&31](g,l,0)|0)<<24>>24;l=c[a>>2]|0;q=l+12|0;r=c[q>>2]|0;if((r|0)==(c[l+16>>2]|0)){Ac[c[(c[l>>2]|0)+40>>2]&127](l)|0;s=h;t=n;u=n;v=p}else{c[q>>2]=r+1;s=h;t=n;u=n;v=p}while(1){w=v+ -48|0;p=s+ -1|0;n=c[a>>2]|0;do{if((n|0)!=0){if((c[n+12>>2]|0)==(c[n+16>>2]|0)){if((Ac[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[a>>2]=0;x=0;break}else{x=c[a>>2]|0;break}}else{x=n}}else{x=0}}while(0);n=(x|0)==0;if((u|0)!=0){if((c[u+12>>2]|0)==(c[u+16>>2]|0)){if((Ac[c[(c[u>>2]|0)+36>>2]&127](u)|0)==-1){c[e>>2]=0;y=0;z=0}else{y=t;z=t}}else{y=t;z=u}}else{y=t;z=0}A=c[a>>2]|0;if(!((n^(z|0)==0)&(p|0)>0)){m=40;break}n=c[A+12>>2]|0;if((n|0)==(c[A+16>>2]|0)){B=Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{B=d[n]|0}n=B&255;if(!(n<<24>>24>-1)){o=w;m=52;break}if((b[(c[k>>2]|0)+(B<<24>>24<<1)>>1]&2048)==0){o=w;m=52;break}h=((Dc[c[(c[g>>2]|0)+36>>2]&31](g,n,0)|0)<<24>>24)+(w*10|0)|0;n=c[a>>2]|0;r=n+12|0;q=c[r>>2]|0;if((q|0)==(c[n+16>>2]|0)){Ac[c[(c[n>>2]|0)+40>>2]&127](n)|0;s=p;t=y;u=z;v=h;continue}else{c[r>>2]=q+1;s=p;t=y;u=z;v=h;continue}}if((m|0)==40){do{if((A|0)!=0){if((c[A+12>>2]|0)==(c[A+16>>2]|0)){if((Ac[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[a>>2]=0;C=0;break}else{C=c[a>>2]|0;break}}else{C=A}}else{C=0}}while(0);A=(C|0)==0;do{if((y|0)!=0){if((c[y+12>>2]|0)==(c[y+16>>2]|0)?(Ac[c[(c[y>>2]|0)+36>>2]&127](y)|0)==-1:0){c[e>>2]=0;m=50;break}if(A){o=w;i=j;return o|0}}else{m=50}}while(0);if((m|0)==50?!A:0){o=w;i=j;return o|0}c[f>>2]=c[f>>2]|2;o=w;i=j;return o|0}else if((m|0)==52){i=j;return o|0}}c[f>>2]=c[f>>2]|4;o=0;i=j;return o|0}



function qd(b,d){b=b|0;d=d|0;var e=0,f=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,sa=0,xa=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Eb=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Yb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,mc=0,nc=0,oc=0,pc=0,qc=0,rc=0,sc=0,tc=0,uc=0,vc=0,wc=0,xc=0,yc=0,zc=0,Ac=0,Bc=0,Cc=0,Dc=0,Ec=0,Fc=0,Gc=0,Hc=0,Ic=0,Jc=0,Kc=0,Lc=0,Mc=0,Nc=0,Oc=0,Pc=0,Qc=0,Rc=0,Sc=0,Tc=0,Uc=0,Vc=0,Wc=0,Xc=0,Yc=0,Zc=0,_c=0,$c=0,ad=0,bd=0,cd=0,dd=0,ed=0,fd=0,gd=0,hd=0,id=0,jd=0,kd=0,ld=0,md=0,nd=0,od=0,pd=0,qd=0,rd=0,sd=0,td=0,ud=0,vd=0,wd=0,xd=0,yd=0,zd=0,Ad=0,Bd=0,Cd=0,Dd=0,Ed=0,Fd=0,Gd=0,Hd=0,Id=0,Jd=0,Kd=0,Ld=0,Md=0,Nd=0,Od=0,Pd=0,Qd=0,Rd=0,Sd=0,Td=0,Ud=0,Vd=0,Wd=0,Xd=0,Yd=0,Zd=0,_d=0,$d=0,ae=0,be=0,ce=0,de=0,ee=0,fe=0,ge=0,he=0,ie=0,je=0,ke=0,le=0,me=0,ne=0,oe=0,pe=0,qe=0,re=0,se=0,te=0,ue=0,ve=0,we=0,xe=0,ye=0,ze=0,Ae=0,Be=0,Ce=0,De=0,Ee=0,Fe=0,Ge=0,He=0,Ie=0,Je=0,Ke=0,Le=0,Me=0,Ne=0,Oe=0,Pe=0,Qe=0,Re=0,Se=0,Te=0,Ue=0,Ve=0,We=0,Xe=0,Ye=0,Ze=0,_e=0,$e=0,af=0,bf=0,cf=0,df=0,ef=0,ff=0,gf=0,hf=0,jf=0,kf=0,lf=0,mf=0,nf=0,of=0,pf=0,qf=0,rf=0,sf=0.0,tf=0.0,uf=0.0,vf=0.0,wf=0.0,xf=0.0,yf=0.0,zf=0.0,Af=0,Bf=0,Cf=0,Df=0,Ef=0,Ff=0,Gf=0,Hf=0,If=0.0,Jf=0,Kf=0,Lf=0,Mf=0,Nf=0,Of=0,Pf=0,Qf=0,Rf=0,Sf=0.0,Tf=0,Uf=0,Vf=0,Wf=0,Xf=0,Yf=0,Zf=0,_f=0,$f=0.0,ag=0.0,bg=0.0,cg=0.0,dg=0.0,eg=0.0,fg=0.0,gg=0.0,hg=0,ig=0,jg=0,kg=0,lg=0,mg=0,ng=0,og=0,pg=0,qg=0,rg=0,sg=0,tg=0,ug=0,vg=0.0,wg=0,xg=0,yg=0,zg=0,Ag=0,Bg=0,Cg=0,Dg=0,Eg=0.0,Fg=0.0,Gg=0.0,Hg=0.0,Ig=0.0,Jg=0.0,Kg=0.0,Lg=0.0,Mg=0,Ng=0,Og=0,Pg=0,Qg=0,Rg=0,Sg=0,Tg=0,Ug=0.0,Vg=0.0,Wg=0.0,Xg=0.0,Yg=0.0,Zg=0.0,_g=0.0,$g=0.0,ah=0,bh=0,ch=0,dh=0.0,eh=0,fh=0,gh=0,hh=0,ih=0,jh=0,kh=0,lh=0,mh=0,nh=0,oh=0.0,ph=0,qh=0,rh=0,sh=0,th=0,uh=0,vh=0,wh=0,xh=0.0,yh=0.0,zh=0.0,Ah=0.0,Bh=0.0,Ch=0.0,Dh=0.0,Eh=0.0,Fh=0,Gh=0,Hh=0,Ih=0,Jh=0,Kh=0.0,Lh=0,Mh=0,Nh=0,Oh=0,Ph=0,Qh=0,Rh=0,Sh=0,Th=0.0,Uh=0.0,Vh=0.0,Wh=0.0,Xh=0.0,Yh=0.0,Zh=0.0,_h=0.0,$h=0,ai=0,bi=0,ci=0,di=0,ei=0,fi=0.0,gi=0,hi=0,ii=0,ji=0,ki=0,li=0,mi=0,ni=0,oi=0,pi=0,qi=0,ri=0,si=0.0,ti=0,ui=0,vi=0,wi=0,xi=0,yi=0,zi=0,Ai=0,Bi=0.0,Ci=0.0,Di=0.0,Ei=0.0,Fi=0.0,Gi=0.0,Hi=0.0,Ii=0.0,Ji=0,Ki=0,Li=0.0,Mi=0.0,Ni=0.0,Oi=0.0,Pi=0.0,Qi=0.0,Ri=0.0,Si=0.0,Ti=0,Ui=0,Vi=0,Wi=0,Xi=0,Yi=0,Zi=0,_i=0,$i=0,aj=0,bj=0,cj=0,dj=0,ej=0,fj=0,gj=0,hj=0,ij=0,jj=0,kj=0,lj=0,mj=0,nj=0,oj=0,pj=0,qj=0,rj=0,sj=0,tj=0,uj=0,vj=0,wj=0,xj=0,yj=0,zj=0,Aj=0,Bj=0,Cj=0,Dj=0,Ej=0.0,Fj=0.0,Gj=0,Hj=0,Ij=0,Jj=0,Kj=0.0,Lj=0,Mj=0,Nj=0,Oj=0,Pj=0,Qj=0,Rj=0,Sj=0,Tj=0.0,Uj=0.0,Vj=0.0,Wj=0.0,Xj=0.0,Yj=0,Zj=0,_j=0,$j=0,ak=0,bk=0.0,ck=0,dk=0,ek=0,fk=0,gk=0,hk=0.0,ik=0,jk=0,kk=0,lk=0,mk=0,nk=0,ok=0,pk=0,qk=0,rk=0,sk=0,tk=0,uk=0.0,vk=0.0,wk=0.0,xk=0.0,yk=0.0,zk=0.0,Ak=0.0,Bk=0.0,Ck=0.0,Dk=0.0,Ek=0.0,Fk=0.0,Gk=0.0,Hk=0.0,Ik=0.0,Jk=0.0,Kk=0,Lk=0,Mk=0,Nk=0,Ok=0,Pk=0,Qk=0,Rk=0.0,Sk=0,Tk=0,Uk=0,Vk=0,Wk=0,Xk=0,Yk=0,Zk=0,_k=0.0,$k=0.0,al=0.0,bl=0.0,cl=0.0,dl=0.0,el=0.0,fl=0.0,gl=0,hl=0,il=0,jl=0,kl=0,ll=0,ml=0,nl=0,ol=0,pl=0,ql=0,rl=0,sl=0,tl=0,ul=0,vl=0,wl=0,xl=0,yl=0,zl=0,Al=0,Bl=0,Cl=0,Dl=0,El=0,Fl=0,Gl=0,Hl=0,Il=0,Jl=0,Kl=0,Ll=0,Ml=0,Nl=0,Ol=0,Pl=0,Ql=0,Rl=0,Sl=0,Tl=0,Ul=0,Vl=0,Wl=0,Xl=0,Yl=0,Zl=0,_l=0,$l=0,am=0,bm=0,cm=0,dm=0,em=0,fm=0,gm=0,hm=0,im=0,jm=0,km=0,lm=0,mm=0,nm=0,om=0,pm=0,qm=0,rm=0,sm=0,tm=0,um=0,vm=0,wm=0,xm=0,ym=0,zm=0;e=i;i=i+496|0;f=e;j=i;i=i+168|0;c[j>>2]=0;k=e+56|0;l=e+441|0;m=e+404|0;n=e+367|0;o=e+330|0;p=e+64|0;q=e+24|0;s=e+16|0;t=e+478|0;w=e+72|0;x=e+40|0;y=e+32|0;z=e+36|0;A=e+44|0;B=e+48|0;C=e+52|0;D=e+75|0;u=0;E=oa(64,460)|0;F=u;u=0;if((F|0)!=0&(v|0)!=0){G=Wn(c[F>>2]|0,j)|0;if((G|0)==0){Oa(F|0,v|0)}J=v}else{G=-1}do{if((G|0)!=1){if((E|0)==0){H=0;i=e;return H|0}u=0;F=oa(64,256e3)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){K=Wn(c[I>>2]|0,j)|0;if((K|0)==0){Oa(I|0,v|0)}J=v}else{K=-1}if((K|0)!=1){c[E>>2]=F;u=0;I=oa(64,256e3)|0;L=u;u=0;if((L|0)!=0&(v|0)!=0){M=Wn(c[L>>2]|0,j)|0;if((M|0)==0){Oa(L|0,v|0)}J=v}else{M=-1}if((M|0)!=1){L=E+232|0;c[L>>2]=I;u=0;N=oa(64,256e3)|0;O=u;u=0;if((O|0)!=0&(v|0)!=0){P=Wn(c[O>>2]|0,j)|0;if((P|0)==0){Oa(O|0,v|0)}J=v}else{P=-1}if((P|0)!=1){O=E+116|0;c[O>>2]=N;if((F|0)!=0?!((I|0)==0|(N|0)==0):0){c[E+8>>2]=2e3;c[E+240>>2]=2e3;c[E+124>>2]=2e3;N=E+4|0;c[N>>2]=0;I=E+236|0;c[I>>2]=0;F=E+120|0;c[F>>2]=0;c[E+12>>2]=0;c[E+128>>2]=2;c[E+244>>2]=1;Q=E+428|0;R=E+16|0;S=R+0|0;T=S+100|0;do{c[S>>2]=0;S=S+4|0}while((S|0)<(T|0));U=E+248|0;V=E+132|0;S=V+0|0;T=S+100|0;do{c[S>>2]=0;S=S+4|0}while((S|0)<(T|0));Zn(U|0,0,176)|0;c[Q+0>>2]=0;c[Q+4>>2]=0;c[Q+8>>2]=0;c[Q+12>>2]=0;c[Q+16>>2]=0;c[Q+20>>2]=0;if((b|0)==0){S=c[r>>2]|0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=1149;c[f+12>>2]=200;ra(23,S|0,16,f|0)|0;S=u;u=0;if((S|0)!=0&(v|0)!=0){W=Wn(c[S>>2]|0,j)|0;if((W|0)==0){Oa(S|0,v|0)}J=v}else{W=-1}if((W|0)==1){X=0;Y=0;Z=0;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}u=0;Fa(1);S=u;u=0;if((S|0)!=0&(v|0)!=0){xa=Wn(c[S>>2]|0,j)|0;if((xa|0)==0){Oa(S|0,v|0)}J=v}else{xa=-1}if((xa|0)==1){X=0;Y=0;Z=0;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}}if((d|0)==0){S=c[r>>2]|0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=1150;c[f+12>>2]=216;ra(23,S|0,16,f|0)|0;S=u;u=0;if((S|0)!=0&(v|0)!=0){Ia=Wn(c[S>>2]|0,j)|0;if((Ia|0)==0){Oa(S|0,v|0)}J=v}else{Ia=-1}if((Ia|0)==1){X=0;Y=0;Z=0;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}u=0;Fa(1);S=u;u=0;if((S|0)!=0&(v|0)!=0){Ja=Wn(c[S>>2]|0,j)|0;if((Ja|0)==0){Oa(S|0,v|0)}J=v}else{Ja=-1}if((Ja|0)==1){X=0;Y=0;Z=0;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}}S=b+2656|0;if((c[S>>2]|0)!=0){u=0;oa(65,12160)|0;T=u;u=0;if((T|0)!=0&(v|0)!=0){Ka=Wn(c[T>>2]|0,j)|0;if((Ka|0)==0){Oa(T|0,v|0)}J=v}else{Ka=-1}if((Ka|0)==1){X=0;Y=0;Z=S;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}u=0;na(39,b|0,d|0);T=u;u=0;if((T|0)!=0&(v|0)!=0){La=Wn(c[T>>2]|0,j)|0;if((La|0)==0){Oa(T|0,v|0)}J=v}else{La=-1}if((La|0)==1){X=0;Y=0;Z=S;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}}T=b+4|0;if((c[T>>2]|0)!=0?(c[b+8>>2]|0)!=0:0){c[E+424>>2]=0}else{c[E+424>>2]=1}if(((c[b>>2]|0)+ -8|0)>>>0<2){c[E+424>>2]=1}Vn(232,1,j|0)|0;u=0;Ma=u;u=0;if((Ma|0)!=0&(v|0)!=0){Na=Wn(c[Ma>>2]|0,j)|0;if((Na|0)==0){Oa(Ma|0,v|0)}J=v}else{Na=-1}if((Na|0)==1){X=b;Y=T;Z=S;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J;break}X=b;Y=T;Z=S;_=V;$=U;aa=R;ba=Q;ca=F;da=I;ea=N;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=0;break}u=0;ma(112,E|0);S=u;u=0;if((S|0)!=0&(v|0)!=0){Pa=Wn(c[S>>2]|0,j)|0;if((Pa|0)==0){Oa(S|0,v|0)}J=v}else{Pa=-1}if((Pa|0)==1){X=0;Y=0;Z=0;_=0;$=0;aa=0;ba=0;ca=0;da=0;ea=0;ga=O;ha=O;ia=L;ja=L;ka=E;la=E;sa=J}else{H=0;i=e;return H|0}}else{X=0;Y=0;Z=0;_=0;$=0;aa=0;ba=0;ca=0;da=0;ea=0;ga=0;ha=0;ia=L;ja=L;ka=E;la=E;sa=J}}else{X=0;Y=0;Z=0;_=0;$=0;aa=0;ba=0;ca=0;da=0;ea=0;ga=0;ha=0;ia=0;ja=0;ka=E;la=E;sa=J}}else{X=0;Y=0;Z=0;_=0;$=0;aa=0;ba=0;ca=0;da=0;ea=0;ga=0;ha=0;ia=0;ja=0;ka=0;la=E;sa=J}}else{X=0;Y=0;Z=0;_=0;$=0;aa=0;ba=0;ca=0;da=0;ea=0;ga=0;ha=0;ia=0;ja=0;ka=0;la=0;sa=J}}while(0);a:while(1){if((sa|0)!=0){if((c[98]|0)!=1){u=0;ma(114,la|0);Pa=u;u=0;if((Pa|0)!=0&(v|0)!=0){Qa=Wn(c[Pa>>2]|0,j)|0;if((Qa|0)==0){Oa(Pa|0,v|0)}J=v}else{Qa=-1}if((Qa|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=42;break}}c[98]=0;Pa=c[100]|0;do{if((Pa|0)!=0){u=0;Na=ra(24,E+436|0,784,Pa|0)|0;La=u;u=0;if((La|0)!=0&(v|0)!=0){gb=Wn(c[La>>2]|0,j)|0;if((gb|0)==0){Oa(La|0,v|0)}J=v}else{gb=-1}if((gb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Na|0)!=0){u=0;na(40,232,1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){hb=Wn(c[Na>>2]|0,j)|0;if((hb|0)==0){Oa(Na|0,v|0)}J=v}else{hb=-1}if((hb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=37;break a}}else{ib=c[100]|0;break}}else{ib=0}}while(0);u=0;ma(112,ib|0);Pa=u;u=0;if((Pa|0)!=0&(v|0)!=0){jb=Wn(c[Pa>>2]|0,j)|0;if((jb|0)==0){Oa(Pa|0,v|0)}J=v}else{jb=-1}if((jb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}c[100]=0;u=0;ma(113,c[da>>2]|0);Pa=u;u=0;if((Pa|0)!=0&(v|0)!=0){kb=Wn(c[Pa>>2]|0,j)|0;if((kb|0)==0){Oa(Pa|0,v|0)}J=v}else{kb=-1}if((kb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=40;break}}Pa=E+436|0;L=E+444|0;O=c[X>>2]|0;if((O|0)==10){N=d+8856|0;if((c[N>>2]|0)==0){I=c[b+2420>>2]|0;if((I|0)==-2147483648){lb=(c[b+1616>>2]|0)-(c[b+816>>2]|0)|0}else{lb=I}I=lb+1|0;F=d+8884|0;Q=c[F>>2]|0;if((Q|0)==0){mb=lb}else{u=0;R=oa(66,Q|0)|0;Q=u;u=0;if((Q|0)!=0&(v|0)!=0){nb=Wn(c[Q>>2]|0,j)|0;if((nb|0)==0){Oa(Q|0,v|0)}J=v}else{nb=-1}if((nb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}mb=lb-R|0}R=d+8888|0;Q=c[R>>2]|0;if((Q|0)==0){ob=mb;pb=0}else{u=0;U=oa(66,Q|0)|0;V=u;u=0;if((V|0)!=0&(v|0)!=0){qb=Wn(c[V>>2]|0,j)|0;if((qb|0)==0){Oa(V|0,v|0)}J=v}else{qb=-1}if((qb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;V=oa(64,U+1|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){rb=Wn(c[Na>>2]|0,j)|0;if((rb|0)==0){Oa(Na|0,v|0)}J=v}else{rb=-1}if((rb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}if((V|0)==0){u=0;na(40,232,1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){sb=Wn(c[Na>>2]|0,j)|0;if((sb|0)==0){Oa(Na|0,v|0)}J=v}else{sb=-1}if((sb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=55;break}}Na=mb-U|0;u=0;na(41,Q|0,V|0);Q=u;u=0;if((Q|0)!=0&(v|0)!=0){tb=Wn(c[Q>>2]|0,j)|0;if((tb|0)==0){Oa(Q|0,v|0)}J=v}else{tb=-1}if((tb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}ob=Na;pb=V}V=d+8892|0;Na=c[V>>2]|0;if((Na|0)==0){ub=ob}else{u=0;Q=oa(66,Na|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){vb=Wn(c[Na>>2]|0,j)|0;if((vb|0)==0){Oa(Na|0,v|0)}J=v}else{vb=-1}if((vb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}ub=ob-Q|0}if((ub|0)!=(I|0)){Q=(ub|0)/2|0;Na=ub-Q|0;u=0;U=oa(64,I|0)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){wb=Wn(c[I>>2]|0,j)|0;if((wb|0)==0){Oa(I|0,v|0)}J=v}else{wb=-1}if((wb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}if((U|0)==0){u=0;na(40,232,1);I=u;u=0;if((I|0)!=0&(v|0)!=0){xb=Wn(c[I>>2]|0,j)|0;if((xb|0)==0){Oa(I|0,v|0)}J=v}else{xb=-1}if((xb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=65;break}}c[N>>2]=U;a[U]=0;I=c[F>>2]|0;if((I|0)!=0){u=0;za(15,U|0,I|0)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){yb=Wn(c[I>>2]|0,j)|0;if((yb|0)==0){Oa(I|0,v|0)}J=v}else{yb=-1}if((yb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}b:do{if((ub|0)>1){I=1;while(1){U=c[N>>2]|0;u=0;F=oa(66,U|0)|0;La=u;u=0;if((La|0)!=0&(v|0)!=0){zb=Wn(c[La>>2]|0,j)|0;if((zb|0)==0){Oa(La|0,v|0)}J=v}else{zb=-1}if((zb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}La=U+F|0;a[La]=78;a[La+1|0]=0;if((I|0)>=(Q|0)){break b}I=I+1|0}}}while(0);Q=c[V>>2]|0;if((Q|0)!=0){u=0;za(15,c[N>>2]|0,Q|0)|0;Q=u;u=0;if((Q|0)!=0&(v|0)!=0){Ab=Wn(c[Q>>2]|0,j)|0;if((Ab|0)==0){Oa(Q|0,v|0)}J=v}else{Ab=-1}if((Ab|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}c:do{if((Na|0)>0){Q=1;while(1){I=c[N>>2]|0;u=0;La=oa(66,I|0)|0;F=u;u=0;if((F|0)!=0&(v|0)!=0){Bb=Wn(c[F>>2]|0,j)|0;if((Bb|0)==0){Oa(F|0,v|0)}J=v}else{Bb=-1}if((Bb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}F=I+La|0;a[F]=78;a[F+1|0]=0;if((Q|0)==(Na|0)){break c}Q=Q+1|0}}}while(0);if((c[R>>2]|0)!=0){u=0;za(15,c[N>>2]|0,pb|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Cb=Wn(c[Na>>2]|0,j)|0;if((Cb|0)==0){Oa(Na|0,v|0)}J=v}else{Cb=-1}if((Cb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}u=0;ma(112,pb|0);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Db=Wn(c[Na>>2]|0,j)|0;if((Db|0)==0){Oa(Na|0,v|0)}J=v}else{Db=-1}if((Db|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}}Eb=c[X>>2]|0}else{Eb=O}if((Eb|0)==8?!((c[d+8836>>2]|0)==-1):0){u=0;Na=ra(24,Pa|0,784,10048)|0;V=u;u=0;if((V|0)!=0&(v|0)!=0){Fb=Wn(c[V>>2]|0,j)|0;if((Fb|0)==0){Oa(V|0,v|0)}J=v}else{Fb=-1}if((Fb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}if((Na|0)!=0){u=0;na(40,232,1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Gb=Wn(c[Na>>2]|0,j)|0;if((Gb|0)==0){Oa(Na|0,v|0)}J=v}else{Gb=-1}if((Gb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=91;break}}}else{fb=92}d:do{if((fb|0)==92){fb=0;Na=d+8856|0;V=c[Na>>2]|0;if((V|0)==0){if((Eb|0)==10){u=0;Q=ra(24,Pa|0,784,10120)|0;F=u;u=0;if((F|0)!=0&(v|0)!=0){Hb=Wn(c[F>>2]|0,j)|0;if((Hb|0)==0){Oa(F|0,v|0)}J=v}else{Hb=-1}if((Hb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Q|0)==0){break}u=0;na(40,232,1);Q=u;u=0;if((Q|0)!=0&(v|0)!=0){Ib=Wn(c[Q>>2]|0,j)|0;if((Ib|0)==0){Oa(Q|0,v|0)}J=v}else{Ib=-1}if((Ib|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=97;break a}}else{u=0;Q=ra(24,Pa|0,784,10144)|0;F=u;u=0;if((F|0)!=0&(v|0)!=0){Jb=Wn(c[F>>2]|0,j)|0;if((Jb|0)==0){Oa(F|0,v|0)}J=v}else{Jb=-1}if((Jb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Q|0)==0){break}u=0;na(40,232,1);Q=u;u=0;if((Q|0)!=0&(v|0)!=0){Kb=Wn(c[Q>>2]|0,j)|0;if((Kb|0)==0){Oa(Q|0,v|0)}J=v}else{Kb=-1}if((Kb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=101;break a}}}u=0;Q=oa(66,V|0)|0;V=u;u=0;if((V|0)!=0&(v|0)!=0){Lb=Wn(c[V>>2]|0,j)|0;if((Lb|0)==0){Oa(V|0,v|0)}J=v}else{Lb=-1}if((Lb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}do{if((Eb|0)==6){V=c[d+8836>>2]|0;if((V|0)==-1){F=b+20|0;c[d+8896>>2]=c[F>>2];c[d+8904>>2]=Q+ -1+(c[F>>2]|0);break}else{F=c[d+8832>>2]|0;c[d+8896>>2]=F;c[d+8904>>2]=V+ -1+F;break}}else if((Eb|0)==7){if((c[d+1600>>2]|0)!=1){u=0;F=ra(24,Pa|0,784,10168)|0;V=u;u=0;if((V|0)!=0&(v|0)!=0){Mb=Wn(c[V>>2]|0,j)|0;if((Mb|0)==0){Oa(V|0,v|0)}J=v}else{Mb=-1}if((Mb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((F|0)!=0){u=0;na(40,232,1);F=u;u=0;if((F|0)!=0&(v|0)!=0){Nb=Wn(c[F>>2]|0,j)|0;if((Nb|0)==0){Oa(F|0,v|0)}J=v}else{Nb=-1}if((Nb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=111;break a}}}F=c[d>>2]|0;c[d+8900>>2]=F;c[d+8908>>2]=F+ -1+(c[d+4>>2]|0)}}while(0);F=d+8836|0;V=c[F>>2]|0;if((V|0)==-1){c[F>>2]=Q;c[d+8832>>2]=c[b+20>>2];Ob=Q}else{Ob=V}if((c[X>>2]|0)==8?(V=d+1600|0,(c[V>>2]|0)==0):0){c[d>>2]=c[b+20>>2];c[d+4>>2]=Q;c[V>>2]=1}V=b+20|0;La=d+8832|0;I=(c[La>>2]|0)-(c[V>>2]|0)|0;c[La>>2]=I;U=d+8840|0;c[U>>2]=(c[U>>2]|0)-(c[V>>2]|0);Ka=d+8896|0;Ja=(c[Ka>>2]|0)-(c[V>>2]|0)|0;c[Ka>>2]=Ja;Ia=d+8900|0;xa=(c[Ia>>2]|0)-(c[V>>2]|0)|0;c[Ia>>2]=xa;W=d+8904|0;P=(c[W>>2]|0)-(c[V>>2]|0)|0;c[W>>2]=P;M=c[V>>2]|0;K=d+8908|0;G=c[K>>2]|0;c[Ka>>2]=Ja-I;c[Ia>>2]=xa-I;c[W>>2]=P-I;c[K>>2]=G-(M+I);M=I+Ob|0;if(!((M|0)>(Q|0)|(Ob|0)!=2147483647&(I|0)>-1&(Ob|0)>-1^1)){G=Ob+1|0;u=0;K=oa(64,G|0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){Pb=Wn(c[P>>2]|0,j)|0;if((Pb|0)==0){Oa(P|0,v|0)}J=v}else{Pb=-1}if((Pb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((K|0)==0){u=0;na(40,232,1);P=u;u=0;if((P|0)!=0&(v|0)!=0){Qb=Wn(c[P>>2]|0,j)|0;if((Qb|0)==0){Oa(P|0,v|0)}J=v}else{Qb=-1}if((Qb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=122;break a}}c[d+8868>>2]=K;P=c[Na>>2]|0;W=(Ob|0)>0;if(W){xa=I;do{a[K+(xa-I)|0]=a[P+xa|0]|0;xa=xa+1|0}while((xa|0)<(M|0))}a[K+Ob|0]=0;u=0;xa=oa(64,G|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Rb=Wn(c[Ia>>2]|0,j)|0;if((Rb|0)==0){Oa(Ia|0,v|0)}J=v}else{Rb=-1}if((Rb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((xa|0)==0){u=0;na(40,232,1);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Sb=Wn(c[Ia>>2]|0,j)|0;if((Sb|0)==0){Oa(Ia|0,v|0)}J=v}else{Sb=-1}if((Sb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=128;break a}}c[d+8872>>2]=xa;if(W){Ia=I;do{a[xa+(Ia-I)|0]=a[P+Ia|0]|0;Ia=Ia+1|0}while((Ia|0)<(M|0))}a[xa+Ob|0]=0;u=0;M=oa(66,P|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Tb=Wn(c[Ia>>2]|0,j)|0;if((Tb|0)==0){Oa(Ia|0,v|0)}J=v}else{Tb=-1}if((Tb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Ia=oa(64,M+1|0)|0;M=u;u=0;if((M|0)!=0&(v|0)!=0){Ub=Wn(c[M>>2]|0,j)|0;if((Ub|0)==0){Oa(M|0,v|0)}J=v}else{Ub=-1}if((Ub|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Ia|0)==0){u=0;na(40,232,1);M=u;u=0;if((M|0)!=0&(v|0)!=0){Vb=Wn(c[M>>2]|0,j)|0;if((Vb|0)==0){Oa(M|0,v|0)}J=v}else{Vb=-1}if((Vb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=135;break a}}M=d+8876|0;c[M>>2]=Ia;u=0;za(16,Ia|0,P|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Wb=Wn(c[Ia>>2]|0,j)|0;if((Wb|0)==0){Oa(Ia|0,v|0)}J=v}else{Wb=-1}if((Wb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}Ia=c[M>>2]|0;I=a[Ia]|0;e:do{if(!(I<<24>>24==0)){W=I;G=Ia;while(1){switch(W<<24>>24|0){case 65:case 97:{a[G]=65;break};case 67:case 99:{a[G]=67;break};case 71:case 103:{a[G]=71;break};case 84:case 116:{a[G]=84;break};case 78:case 110:{a[G]=78;break};case 82:case 114:{a[G]=82;break};case 89:case 121:{a[G]=89;break};case 77:case 109:{a[G]=77;break};case 87:case 119:{a[G]=87;break};case 83:case 115:{a[G]=83;break};case 75:case 107:{a[G]=75;break};case 68:case 100:{a[G]=68;break};case 72:case 104:{a[G]=72;break};case 86:case 118:{a[G]=86;break};case 66:case 98:{a[G]=66;break};default:{}}G=G+1|0;W=a[G]|0;if(W<<24>>24==0){break e}}}}while(0);u=0;Ia=oa(66,c[Na>>2]|0)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){Xb=Wn(c[I>>2]|0,j)|0;if((Xb|0)==0){Oa(I|0,v|0)}J=v}else{Xb=-1}if((Xb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;I=oa(64,Ia+1|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Yb=Wn(c[Ia>>2]|0,j)|0;if((Yb|0)==0){Oa(Ia|0,v|0)}J=v}else{Yb=-1}if((Yb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((I|0)==0){u=0;na(40,232,1);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Zb=Wn(c[Ia>>2]|0,j)|0;if((Zb|0)==0){Oa(Ia|0,v|0)}J=v}else{Zb=-1}if((Zb|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=159;break a}}c[d+8880>>2]=I;u=0;na(41,c[M>>2]|0,I|0);I=u;u=0;if((I|0)!=0&(v|0)!=0){_b=Wn(c[I>>2]|0,j)|0;if((_b|0)==0){Oa(I|0,v|0)}J=v}else{_b=-1}if((_b|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}I=c[V>>2]|0;u=0;Ia=Da(1,10360,c[d+1600>>2]|0,d|0,Q|0,I|0,Pa|0,d|0,L|0,0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){$b=Wn(c[P>>2]|0,j)|0;if(($b|0)==0){Oa(P|0,v|0)}J=v}else{$b=-1}if(($b|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Ia|0)!=1){c[U>>2]=(c[U>>2]|0)-(c[La>>2]|0);u=0;Ia=Da(1,10368,c[d+3204>>2]|0,d+1604|0,Q|0,I|0,Pa|0,d|0,L|0,0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){ac=Wn(c[P>>2]|0,j)|0;if((ac|0)==0){Oa(P|0,v|0)}J=v}else{ac=-1}if((ac|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Ia|0)!=1){u=0;Ia=Da(1,10384,c[d+4808>>2]|0,d+3208|0,Q|0,I|0,Pa|0,d|0,L|0,0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){bc=Wn(c[P>>2]|0,j)|0;if((bc|0)==0){Oa(P|0,v|0)}J=v}else{bc=-1}if((bc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Ia|0)!=1){Ia=d+8024|0;u=0;P=Da(1,10424,c[Ia>>2]|0,d+4812|0,Q|0,I|0,Pa|0,d|0,L|0,1)|0;xa=u;u=0;if((xa|0)!=0&(v|0)!=0){cc=Wn(c[xa>>2]|0,j)|0;if((cc|0)==0){Oa(xa|0,v|0)}J=v}else{cc=-1}if((cc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((P|0)!=1){u=0;P=Da(1,10424,c[Ia>>2]|0,d+6412|0,Q|0,I|0,Pa|0,d|0,L|0,1)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){dc=Wn(c[I>>2]|0,j)|0;if((dc|0)==0){Oa(I|0,v|0)}J=v}else{dc=-1}if((dc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((P|0)!=1){P=d+8828|0;I=c[V>>2]|0;f:do{if((c[P>>2]|0)>0){xa=0;W=0;while(1){G=d+(xa<<2)+8028|0;K=(c[G>>2]|0)-I|0;c[G>>2]=K;if((K|0)>=(Q|0)){fb=174;break}if((K|0)<0){fb=180;break}Ja=K-(c[La>>2]|0)|0;c[G>>2]=Ja;if((Ja|0)<0){if((W|0)==0){fb=188}else{ec=W}}else{if((Ja|0)>(c[F>>2]|0)&(W|0)==0){fb=188}else{ec=W}}if((fb|0)==188){fb=0;u=0;c[f>>2]=10240;ra(25,D|0,10328,f|0)|0;Ja=u;u=0;if((Ja|0)!=0&(v|0)!=0){fc=Wn(c[Ja>>2]|0,j)|0;if((fc|0)==0){Oa(Ja|0,v|0)}J=v}else{fc=-1}if((fc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Ja=ra(24,L|0,784,D|0)|0;G=u;u=0;if((G|0)!=0&(v|0)!=0){gc=Wn(c[G>>2]|0,j)|0;if((gc|0)==0){Oa(G|0,v|0)}J=v}else{gc=-1}if((gc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Ja|0)==0){ec=1}else{fb=191;break}}xa=xa+1|0;if((xa|0)>=(c[P>>2]|0)){break f}else{W=ec}}if((fb|0)==174){fb=0;u=0;c[f>>2]=10240;ra(25,D|0,10272,f|0)|0;W=u;u=0;if((W|0)!=0&(v|0)!=0){hc=Wn(c[W>>2]|0,j)|0;if((hc|0)==0){Oa(W|0,v|0)}J=v}else{hc=-1}if((hc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;W=ra(24,Pa|0,784,D|0)|0;xa=u;u=0;if((xa|0)!=0&(v|0)!=0){ic=Wn(c[xa>>2]|0,j)|0;if((ic|0)==0){Oa(xa|0,v|0)}J=v}else{ic=-1}if((ic|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((W|0)==0){break d}u=0;na(40,232,1);W=u;u=0;if((W|0)!=0&(v|0)!=0){jc=Wn(c[W>>2]|0,j)|0;if((jc|0)==0){Oa(W|0,v|0)}J=v}else{jc=-1}if((jc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=178;break a}}else if((fb|0)==180){fb=0;u=0;c[f>>2]=10240;ra(25,D|0,10304,f|0)|0;W=u;u=0;if((W|0)!=0&(v|0)!=0){kc=Wn(c[W>>2]|0,j)|0;if((kc|0)==0){Oa(W|0,v|0)}J=v}else{kc=-1}if((kc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;W=ra(24,Pa|0,784,D|0)|0;xa=u;u=0;if((xa|0)!=0&(v|0)!=0){lc=Wn(c[xa>>2]|0,j)|0;if((lc|0)==0){Oa(xa|0,v|0)}J=v}else{lc=-1}if((lc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((W|0)==0){break d}u=0;na(40,232,1);W=u;u=0;if((W|0)!=0&(v|0)!=0){mc=Wn(c[W>>2]|0,j)|0;if((mc|0)==0){Oa(W|0,v|0)}J=v}else{mc=-1}if((mc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=184;break a}}else if((fb|0)==191){fb=0;u=0;na(40,232,1);W=u;u=0;if((W|0)!=0&(v|0)!=0){nc=Wn(c[W>>2]|0,j)|0;if((nc|0)==0){Oa(W|0,v|0)}J=v}else{nc=-1}if((nc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=192;break a}}}}while(0);if((((c[Ia>>2]|0)>0?(c[d+8884>>2]|0)==0:0)?(c[d+8888>>2]|0)==0:0)?(c[d+8020>>2]|0)==0:0){P=c[b+304>>2]|0;F=c[b+308>>2]|0;La=c[b+2416>>2]|0;if((La|0)>0){Q=0;I=0;V=2147483647;while(1){U=c[b+(Q<<2)+816>>2]|0;M=(U|0)<(V|0)?U:V;U=c[b+(Q<<2)+1616>>2]|0;W=(U|0)>(I|0)?U:I;U=Q+1|0;if((U|0)==(La|0)){oc=W;pc=M;break}else{Q=U;I=W;V=M}}}else{oc=0;pc=2147483647}V=P+ -1-oc|0;I=F+1-pc|0;Q=pc+~F|0;La=1-P+oc|0;M=0;while(1){W=d+(M<<3)+4812|0;U=c[W>>2]|0;if((U|0)==-1){qc=-1;rc=-1}else{qc=U+ -1+(c[d+(M<<3)+4816>>2]|0)|0;rc=U}U=d+(M<<3)+6412|0;xa=c[U>>2]|0;if((xa|0)==-1){sc=-1;tc=-1}else{sc=xa+ -1+(c[d+(M<<3)+6416>>2]|0)|0;tc=xa}xa=(rc|0)==-1;if(xa){uc=sc;vc=tc}else{Ja=Q+rc|0;G=La+qc|0;K=(tc|0)==-1|(Ja|0)>(tc|0)?Ja:tc;Ja=(sc|0)==-1|(G|0)<(sc|0)?G:sc;G=(K|0)<0?0:K;u=0;K=oa(66,c[Na>>2]|0)|0;Ka=u;u=0;if((Ka|0)!=0&(v|0)!=0){wc=Wn(c[Ka>>2]|0,j)|0;if((wc|0)==0){Oa(Ka|0,v|0)}J=v}else{wc=-1}if((wc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}uc=(Ja|0)>(K|0)?K:Ja;vc=G}if((vc|0)==-1){xc=qc;yc=rc}else{G=V+vc|0;Ja=I+uc|0;K=xa|(G|0)>(rc|0)?G:rc;G=(qc|0)==-1|(Ja|0)<(qc|0)?Ja:qc;Ja=(K|0)<0?0:K;u=0;K=oa(66,c[Na>>2]|0)|0;xa=u;u=0;if((xa|0)!=0&(v|0)!=0){zc=Wn(c[xa>>2]|0,j)|0;if((zc|0)==0){Oa(xa|0,v|0)}J=v}else{zc=-1}if((zc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}xc=(G|0)>(K|0)?K:G;yc=Ja}c[W>>2]=yc;c[d+(M<<3)+4816>>2]=1-yc+xc;c[U>>2]=vc;c[d+(M<<3)+6416>>2]=1-vc+uc;M=M+1|0;if((M|0)>=(c[Ia>>2]|0)){break}}c[d+8012>>2]=0;c[d+8016>>2]=0}}}}}}}}while(0);if((c[Z>>2]|0)!=0){u=0;oa(65,12136)|0;O=u;u=0;if((O|0)!=0&(v|0)!=0){Ac=Wn(c[O>>2]|0,j)|0;if((Ac|0)==0){Oa(O|0,v|0)}J=v}else{Ac=-1}if((Ac|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;na(39,b|0,d|0);O=u;u=0;if((O|0)!=0&(v|0)!=0){Bc=Wn(c[O>>2]|0,j)|0;if((Bc|0)==0){Oa(O|0,v|0)}J=v}else{Bc=-1}if((Bc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}O=c[E+440>>2]|0;if((O|0)!=0?(a[O]|0)!=0:0){H=la;fb=978;break}u=0;O=Aa(13,b|0,d|0,ba|0,Pa|0,L|0)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){Cc=Wn(c[N>>2]|0,j)|0;if((Cc|0)==0){Oa(N|0,v|0)}J=v}else{Cc=-1}if((Cc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}if((O|0)!=0){H=la;fb=978;break}O=d+8868|0;N=d+8840|0;u=0;R=ra(26,c[O>>2]|0,c[N>>2]|0,-1)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Dc=Wn(c[Ia>>2]|0,j)|0;if((Dc|0)==0){Oa(Ia|0,v|0)}J=v}else{Dc=-1}if((Dc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}Ia=d+8832|0;c[E+456>>2]=(c[Ia>>2]|0)+R;u=0;R=ra(26,c[O>>2]|0,c[N>>2]|0,1)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){Ec=Wn(c[N>>2]|0,j)|0;if((Ec|0)==0){Oa(N|0,v|0)}J=v}else{Ec=-1}if((Ec|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}c[E+452>>2]=(c[Ia>>2]|0)+R;if((c[44]|0)==0){u=0;R=Ca(1)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Fc=Wn(c[Ia>>2]|0,j)|0;if((Fc|0)==0){Oa(Ia|0,v|0)}J=v}else{Fc=-1}if((Fc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}c[44]=R}R=c[46]|0;if((R|0)==0){u=0;Ia=oa(67,b+48|0)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){Gc=Wn(c[N>>2]|0,j)|0;if((Gc|0)==0){Oa(N|0,v|0)}J=v}else{Gc=-1}if((Gc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}Hc=Ia}else{u=0;ma(112,c[R>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Ic=Wn(c[Ia>>2]|0,j)|0;if((Ic|0)==0){Oa(Ia|0,v|0)}J=v}else{Ic=-1}if((Ic|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+4>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Jc=Wn(c[Ia>>2]|0,j)|0;if((Jc|0)==0){Oa(Ia|0,v|0)}J=v}else{Jc=-1}if((Jc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+8>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Kc=Wn(c[Ia>>2]|0,j)|0;if((Kc|0)==0){Oa(Ia|0,v|0)}J=v}else{Kc=-1}if((Kc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+12>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Lc=Wn(c[Ia>>2]|0,j)|0;if((Lc|0)==0){Oa(Ia|0,v|0)}J=v}else{Lc=-1}if((Lc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,R|0);R=u;u=0;if((R|0)!=0&(v|0)!=0){Mc=Wn(c[R>>2]|0,j)|0;if((Mc|0)==0){Oa(R|0,v|0)}J=v}else{Mc=-1}if((Mc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;R=oa(67,b+48|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Nc=Wn(c[Ia>>2]|0,j)|0;if((Nc|0)==0){Oa(Ia|0,v|0)}J=v}else{Nc=-1}if((Nc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}Hc=R}c[46]=Hc;R=c[48]|0;if((R|0)==0){u=0;Ia=oa(67,b+400|0)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){Oc=Wn(c[N>>2]|0,j)|0;if((Oc|0)==0){Oa(N|0,v|0)}J=v}else{Oc=-1}if((Oc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}Pc=Ia}else{u=0;ma(112,c[R>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Qc=Wn(c[Ia>>2]|0,j)|0;if((Qc|0)==0){Oa(Ia|0,v|0)}J=v}else{Qc=-1}if((Qc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+4>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Rc=Wn(c[Ia>>2]|0,j)|0;if((Rc|0)==0){Oa(Ia|0,v|0)}J=v}else{Rc=-1}if((Rc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+8>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Sc=Wn(c[Ia>>2]|0,j)|0;if((Sc|0)==0){Oa(Ia|0,v|0)}J=v}else{Sc=-1}if((Sc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,c[R+12>>2]|0);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Tc=Wn(c[Ia>>2]|0,j)|0;if((Tc|0)==0){Oa(Ia|0,v|0)}J=v}else{Tc=-1}if((Tc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;ma(112,R|0);R=u;u=0;if((R|0)!=0&(v|0)!=0){Uc=Wn(c[R>>2]|0,j)|0;if((Uc|0)==0){Oa(R|0,v|0)}J=v}else{Uc=-1}if((Uc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;R=oa(67,b+400|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Vc=Wn(c[Ia>>2]|0,j)|0;if((Vc|0)==0){Oa(Ia|0,v|0)}J=v}else{Vc=-1}if((Vc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}Pc=R}c[48]=Pc;R=c[X>>2]|0;do{if((R|0)==9){Ia=c[44]|0;N=c[46]|0;u=0;M=oa(66,c[O>>2]|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Wc=Wn(c[Na>>2]|0,j)|0;if((Wc|0)==0){Oa(Na|0,v|0)}J=v}else{Wc=-1}if((Wc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((M|0)==2147483647){Na=c[r>>2]|0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=2174;c[f+12>>2]=10648;ra(23,Na|0,16,f|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Xc=Wn(c[Na>>2]|0,j)|0;if((Xc|0)==0){Oa(Na|0,v|0)}J=v}else{Xc=-1}if((Xc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Fa(1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Yc=Wn(c[Na>>2]|0,j)|0;if((Yc|0)==0){Oa(Na|0,v|0)}J=v}else{Yc=-1}if((Yc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=251;break a}}if((c[Y>>2]|0)!=0){c[C>>2]=0;Na=c[b+304>>2]|0;u=0;Da(2,Na+ -1|0,M-Na|0,C|0,E|0,b|0,d|0,Ia|0,N|0,la|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Zc=Wn(c[Na>>2]|0,j)|0;if((Zc|0)==0){Oa(Na|0,v|0)}J=v}else{Zc=-1}if((Zc|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}if((c[b+8>>2]|0)!=0){c[C>>2]=M;u=0;Da(2,0,M+1-(c[b+304>>2]|0)|0,C|0,ja|0,b|0,d|0,Ia|0,N|0,la|0)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){_c=Wn(c[N>>2]|0,j)|0;if((_c|0)==0){Oa(N|0,v|0)}J=v}else{_c=-1}if((_c|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}if((c[b+12>>2]|0)!=0){N=c[b+656>>2]|0;c[C>>2]=0;u=0;Da(2,N+ -1|0,M-N|0,C|0,ha|0,b|0,d|0,Ia|0,Pc|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){$c=Wn(c[Ia>>2]|0,j)|0;if(($c|0)==0){Oa(Ia|0,v|0)}J=v}else{$c=-1}if(($c|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}}else if((R|0)==8){Ia=c[44]|0;N=c[46]|0;u=0;M=oa(66,c[O>>2]|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){ad=Wn(c[Na>>2]|0,j)|0;if((ad|0)==0){Oa(Na|0,v|0)}J=v}else{ad=-1}if((ad|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((M|0)==2147483647){Na=c[r>>2]|0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=2277;c[f+12>>2]=10648;ra(23,Na|0,16,f|0)|0;Na=u;u=0;if((Na|0)!=0&(v|0)!=0){bd=Wn(c[Na>>2]|0,j)|0;if((bd|0)==0){Oa(Na|0,v|0)}J=v}else{bd=-1}if((bd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Fa(1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){cd=Wn(c[Na>>2]|0,j)|0;if((cd|0)==0){Oa(Na|0,v|0)}J=v}else{cd=-1}if((cd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=267;break a}}Na=d+1600|0;I=c[Na>>2]|0;g:do{if((I|0)>0){V=b+784|0;La=b+780|0;Q=b+304|0;P=b+8|0;F=b+792|0;U=b+788|0;W=I;Ja=0;h:while(1){G=c[Y>>2]|0;if((G|0)!=0?(c[P>>2]|0)!=0:0){K=c[U>>2]|0;xa=c[d+(Ja<<3)+4>>2]|0;if((K|0)<(xa|0)){Ka=c[V>>2]|0;S=1;while(1){T=S+1|0;Ma=(fa(S,Ka)|0)+K|0;if((Ma|0)<(xa|0)){S=T}else{dd=xa;ed=T;fd=Ma;fb=276;break}}}else{gd=xa;hd=K;fb=275}}else{S=c[V>>2]|0;Ka=c[d+(Ja<<3)+4>>2]|0;if((S|0)<(Ka|0)){Ma=1;while(1){T=Ma+1|0;id=fa(T,S)|0;if((id|0)<(Ka|0)){Ma=T}else{dd=Ka;ed=T;fd=id;fb=276;break}}}else{gd=Ka;hd=S;fb=275}}if((fb|0)==275){fb=0;jd=hd-gd|0;kd=1;fb=277}else if((fb|0)==276){fb=0;if((ed|0)>0){jd=fd-dd|0;kd=ed;fb=277}else{ld=W}}if((fb|0)==277){fb=0;Ma=(jd|0)/2|0;K=d+(Ja<<3)|0;xa=G;id=0;while(1){T=(c[K>>2]|0)-Ma|0;md=c[V>>2]|0;nd=(fa(md,id)|0)+T|0;od=c[La>>2]|0;pd=nd-od|0;if((xa|0)!=0?(c[P>>2]|0)!=0:0){qd=nd+od+(c[U>>2]|0)|0}else{qd=(fa(md,id+1|0)|0)+T+od|0}od=c[Q>>2]|0;T=od+ -1|0;md=(pd|0)<(T|0)?T:pd;pd=M-od+ -1|0;if((md|0)>(pd|0)){u=0;T=ra(24,L|0,784,10696)|0;nd=u;u=0;if((nd|0)!=0&(v|0)!=0){rd=Wn(c[nd>>2]|0,j)|0;if((rd|0)==0){Oa(nd|0,v|0)}J=v}else{rd=-1}if((rd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((T|0)!=0){fb=286;break h}sd=c[Q>>2]|0;td=pd}else{sd=od;td=md}md=sd+ -1|0;if((qd|0)<(md|0)){u=0;od=ra(24,L|0,784,10760)|0;pd=u;u=0;if((pd|0)!=0&(v|0)!=0){ud=Wn(c[pd>>2]|0,j)|0;if((ud|0)==0){Oa(pd|0,v|0)}J=v}else{ud=-1}if((ud|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((od|0)!=0){fb=292;break h}vd=c[Q>>2]|0;wd=md}else{vd=sd;wd=qd}md=M-vd+ -1|0;od=(wd|0)>(md|0)?md:wd;if((c[Y>>2]|0)!=0){md=c[F>>2]|0;pd=td-md|0;T=(pd|0)<0;nd=T?0:pd;pd=(T?td+1|0:md)+md|0;u=0;ta(7,nd|0,((pd+nd|0)>(M|0)?M-nd|0:pd)|0,E|0,b|0,d|0,Ia|0,N|0,la|0);pd=u;u=0;if((pd|0)!=0&(v|0)!=0){xd=Wn(c[pd>>2]|0,j)|0;if((xd|0)==0){Oa(pd|0,v|0)}J=v}else{xd=-1}if((xd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}if((c[P>>2]|0)!=0){pd=c[F>>2]|0;nd=od-pd|0;md=(nd|0)<0;T=md?0:nd;nd=(md?od+1|0:pd)+pd|0;u=0;ta(7,T|0,((nd+T|0)>(M|0)?M-T|0:nd)|0,ja|0,b|0,d|0,Ia|0,N|0,la|0);nd=u;u=0;if((nd|0)!=0&(v|0)!=0){yd=Wn(c[nd>>2]|0,j)|0;if((yd|0)==0){Oa(nd|0,v|0)}J=v}else{yd=-1}if((yd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}nd=id+1|0;if((nd|0)>=(kd|0)){break}xa=c[Y>>2]|0;id=nd}ld=c[Na>>2]|0}Ja=Ja+1|0;if((Ja|0)>=(ld|0)){break g}else{W=ld}}if((fb|0)==286){fb=0;u=0;na(40,232,1);W=u;u=0;if((W|0)!=0&(v|0)!=0){zd=Wn(c[W>>2]|0,j)|0;if((zd|0)==0){Oa(W|0,v|0)}J=v}else{zd=-1}if((zd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=287;break a}}else if((fb|0)==292){fb=0;u=0;na(40,232,1);W=u;u=0;if((W|0)!=0&(v|0)!=0){Ad=Wn(c[W>>2]|0,j)|0;if((Ad|0)==0){Oa(W|0,v|0)}J=v}else{Ad=-1}if((Ad|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=293;break a}}}}while(0);Na=c[b+28>>2]|0;if((c[ea>>2]|0)<=(Na|0)?(c[da>>2]|0)<=(Na|0):0){break}u=0;Na=ra(24,L|0,784,10824)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){Bd=Wn(c[N>>2]|0,j)|0;if((Bd|0)==0){Oa(N|0,v|0)}J=v}else{Bd=-1}if((Bd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Na|0)!=0){u=0;na(40,232,1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){Cd=Wn(c[Na>>2]|0,j)|0;if((Cd|0)==0){Oa(Na|0,v|0)}J=v}else{Cd=-1}if((Cd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=309;break a}}}else{Na=c[44]|0;N=c[46]|0;if((R|0)==10){c[B>>2]=0;Ia=c[d+8884>>2]|0;if((Ia|0)!=0){u=0;Ga(9,Ia|0,B|0,E|0,b|0,d|0,Na|0,N|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Dd=Wn(c[Ia>>2]|0,j)|0;if((Dd|0)==0){Oa(Ia|0,v|0)}J=v}else{Dd=-1}if((Dd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}Ia=c[d+8888>>2]|0;if((Ia|0)!=0){u=0;Ga(9,Ia|0,B|0,ja|0,b|0,d|0,Na|0,N|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Ed=Wn(c[Ia>>2]|0,j)|0;if((Ed|0)==0){Oa(Ia|0,v|0)}J=v}else{Ed=-1}if((Ed|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}Ia=c[d+8892>>2]|0;if((Ia|0)==0){break}u=0;Ga(9,Ia|0,B|0,ha|0,b|0,d|0,Na|0,Pc|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Fd=Wn(c[Ia>>2]|0,j)|0;if((Fd|0)==0){Oa(Ia|0,v|0)}J=v}else{Fd=-1}if((Fd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}c[A>>2]=0;c[z>>2]=0;Ia=c[b+2416>>2]|0;if((Ia|0)>0){M=0;I=2147483647;while(1){W=c[b+(M<<2)+816>>2]|0;Ja=(W|0)<(I|0)?W:I;W=M+1|0;if((W|0)==(Ia|0)){Gd=Ja;break}else{M=W;I=Ja}}}else{Gd=2147483647}u=0;I=oa(66,c[O>>2]|0)|0;M=u;u=0;if((M|0)!=0&(v|0)!=0){Hd=Wn(c[M>>2]|0,j)|0;if((Hd|0)==0){Oa(M|0,v|0)}J=v}else{Hd=-1}if((Hd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((I|0)==2147483647){M=c[r>>2]|0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=2e3;c[f+12>>2]=10648;ra(23,M|0,16,f|0)|0;M=u;u=0;if((M|0)!=0&(v|0)!=0){Id=Wn(c[M>>2]|0,j)|0;if((Id|0)==0){Oa(M|0,v|0)}J=v}else{Id=-1}if((Id|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Fa(1);M=u;u=0;if((M|0)!=0&(v|0)!=0){Jd=Wn(c[M>>2]|0,j)|0;if((Jd|0)==0){Oa(M|0,v|0)}J=v}else{Jd=-1}if((Jd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}else{fb=327;break a}}M=c[d+1600>>2]|0;if((M|0)>0){Ia=0;Ja=I;W=0;while(1){F=c[d+(Ia<<3)>>2]|0;P=(F|0)>(W|0)?F:W;Q=(c[d+(Ia<<3)+4>>2]|0)+F|0;F=(Q|0)>(Ja|0)?Ja:Q+ -1|0;Q=Ia+1|0;if((Q|0)==(M|0)){Kd=F;Ld=P;break}else{Ia=Q;Ja=F;W=P}}}else{Kd=I;Ld=0}if(+h[b+808>>3]==-1.0?+h[b+800>>3]==0.0:0){Md=(Kd|0)==(I|0)?0:Kd;Nd=(Ld|0)==0?I:Ld}else{Md=0;Nd=I}W=E+424|0;if((c[W>>2]|0)==1?(c[Y>>2]|0)==1:0){Od=I;fb=339}else{Ja=I-Gd|0;Ia=c[b+308>>2]|0;if((Nd|0)<=(Ja+ -1+Ia|0)){if((c[b+32>>2]|0)!=0?(c[d+8884>>2]|0)!=0:0){fb=337}else{Pd=Nd}}else{fb=337}if((fb|0)==337){fb=0;Pd=Ia+Ja|0}if((c[Y>>2]|0)!=0){Od=Pd;fb=339}}do{if((fb|0)==339){fb=0;c[z>>2]=I;c[A>>2]=0;Ja=c[b+304>>2]|0;Ia=Od-Ja|0;M=Ja+ -1|0;Ja=c[d+8884>>2]|0;if((Ja|0)!=0){u=0;Ga(9,Ja|0,z|0,E|0,b|0,d|0,Na|0,N|0,la|0)|0;Ja=u;u=0;if((Ja|0)!=0&(v|0)!=0){Qd=Wn(c[Ja>>2]|0,j)|0;if((Qd|0)==0){Oa(Ja|0,v|0)}J=v}else{Qd=-1}if((Qd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}Ja=c[d+8896>>2]|0;P=c[d+8900>>2]|0;if((P&Ja|0)>-1){u=0;ya(3,Ja|0,P|0,z|0,E|0,b|0,d|0,Na|0,N|0,la|0);P=u;u=0;if((P|0)!=0&(v|0)!=0){Rd=Wn(c[P>>2]|0,j)|0;if((Rd|0)==0){Oa(P|0,v|0)}J=v}else{Rd=-1}if((Rd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}else{u=0;Da(2,M|0,Ia|0,z|0,E|0,b|0,d|0,Na|0,N|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Sd=Wn(c[Ia>>2]|0,j)|0;if((Sd|0)==0){Oa(Ia|0,v|0)}J=v}else{Sd=-1}if((Sd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}}}while(0);if((c[W>>2]|0)==1?(c[b+8>>2]|0)==1:0){Td=0}else{fb=349}do{if((fb|0)==349){fb=0;Ia=Md+1|0;M=Gd-(c[b+308>>2]|0)|0;if((Md|0)>=(M|0)){if((c[b+32>>2]|0)==0){Td=Ia;break}if((c[d+8888>>2]|0)==0){Td=Ia;break}}Td=M}}while(0);W=b+8|0;do{if((c[W>>2]|0)!=0){M=I+1-Td-(c[b+304>>2]|0)|0;Ia=c[d+8888>>2]|0;if((Ia|0)!=0){u=0;Ga(9,Ia|0,A|0,ja|0,b|0,d|0,Na|0,N|0,la|0)|0;Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){Ud=Wn(c[Ia>>2]|0,j)|0;if((Ud|0)==0){Oa(Ia|0,v|0)}J=v}else{Ud=-1}if((Ud|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}Ia=c[d+8904>>2]|0;P=c[d+8908>>2]|0;if((P&Ia|0)>-1){u=0;ya(3,Ia|0,P|0,A|0,ja|0,b|0,d|0,Na|0,N|0,la|0);P=u;u=0;if((P|0)!=0&(v|0)!=0){Vd=Wn(c[P>>2]|0,j)|0;if((Vd|0)==0){Oa(P|0,v|0)}J=v}else{Vd=-1}if((Vd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}else{u=0;Da(2,Td|0,M|0,A|0,ja|0,b|0,d|0,Na|0,N|0,la|0)|0;M=u;u=0;if((M|0)!=0&(v|0)!=0){Wd=Wn(c[M>>2]|0,j)|0;if((Wd|0)==0){Oa(M|0,v|0)}J=v}else{Wd=-1}if((Wd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}break}}}while(0);N=(c[Y>>2]|0)==0;if(!N?(c[ea>>2]|0)==0:0){H=la;fb=978;break a}Na=(c[W>>2]|0)==0;if(!Na?(c[da>>2]|0)==0:0){H=la;fb=978;break a}if((c[d+8888>>2]|0)==0){if(!(N|Na)){fb=369}}else{if(!((c[d+8884>>2]|0)!=0|N|Na)){fb=369}}if((fb|0)==369?(fb=0,((c[A>>2]|0)-(c[z>>2]|0)|0)<(Gd+ -1|0)):0){fb=370;break a}if((c[b+12>>2]|0)!=0){Na=c[44]|0;N=c[48]|0;c[x>>2]=0;I=c[d+8892>>2]|0;if((I|0)==0?(c[X>>2]|0)!=10:0){u=0;M=oa(66,c[O>>2]|0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){Xd=Wn(c[P>>2]|0,j)|0;if((Xd|0)==0){Oa(P|0,v|0)}J=v}else{Xd=-1}if((Xd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}P=c[b+656>>2]|0;c[y>>2]=0;u=0;Ia=Da(2,P+ -1|0,M-P|0,y|0,ha|0,b|0,d|0,Na|0,N|0,la|0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){Yd=Wn(c[P>>2]|0,j)|0;if((Yd|0)==0){Oa(P|0,v|0)}J=v}else{Yd=-1}if((Yd|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}Zd=Ia}else{u=0;Ia=Ga(9,I|0,x|0,ha|0,b|0,d|0,Na|0,N|0,la|0)|0;N=u;u=0;if((N|0)!=0&(v|0)!=0){_d=Wn(c[N>>2]|0,j)|0;if((_d|0)==0){Oa(N|0,v|0)}J=v}else{_d=-1}if((_d|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}Zd=Ia}if((Zd|0)!=0){H=la;fb=978;break a}}}}while(0);R=b+8|0;if((c[R>>2]|0)!=0?(c[X>>2]|0)!=8:0){u=0;Ha(8,c[ia>>2]|0,c[da>>2]|0,128,17);L=u;u=0;if((L|0)!=0&(v|0)!=0){$d=Wn(c[L>>2]|0,j)|0;if(($d|0)==0){Oa(L|0,v|0)}J=v}else{$d=-1}if(($d|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}if((c[Y>>2]|0)!=0?(c[X>>2]|0)!=8:0){u=0;Ha(8,c[ka>>2]|0,c[ea>>2]|0,128,17);L=u;u=0;if((L|0)!=0&(v|0)!=0){ae=Wn(c[L>>2]|0,j)|0;if((ae|0)==0){Oa(L|0,v|0)}J=v}else{ae=-1}if((ae|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}L=E+424|0;Pa=c[L>>2]|0;if((Pa|0)==1){if((c[b+12>>2]|0)==1){u=0;Ha(8,c[ga>>2]|0,c[ca>>2]|0,128,17);Ia=u;u=0;if((Ia|0)!=0&(v|0)!=0){be=Wn(c[Ia>>2]|0,j)|0;if((be|0)==0){Oa(Ia|0,v|0)}J=v}else{be=-1}if((be|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}ce=c[L>>2]|0;fb=392}}else{ce=Pa;fb=392}if((fb|0)==392?(fb=0,(ce|0)==0):0){Pa=c[44]|0;L=c[46]|0;Ia=E+348|0;N=c[da>>2]|0;u=0;Na=za(18,N|0,4)|0;I=u;u=0;if((I|0)!=0&(v|0)!=0){de=Wn(c[I>>2]|0,j)|0;if((de|0)==0){Oa(I|0,v|0)}J=v}else{de=-1}if((de|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}c[2888]=Na;if((Na|0)==0){u=0;na(40,232,1);Na=u;u=0;if((Na|0)!=0&(v|0)!=0){ee=Wn(c[Na>>2]|0,j)|0;if((ee|0)==0){Oa(Na|0,v|0)}J=v}else{ee=-1}if((ee|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=396;break}}a[w+0|0]=0;a[w+1|0]=0;a[w+2|0]=0;Na=N<<2;u=0;I=oa(64,Na|0)|0;P=u;u=0;if((P|0)!=0&(v|0)!=0){fe=Wn(c[P>>2]|0,j)|0;if((fe|0)==0){Oa(P|0,v|0)}J=v}else{fe=-1}if((fe|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}c[2890]=I;if((N|0)>0){Zn(I|0,-1,Na|0)|0}Na=E+356|0;I=E+352|0;N=b+28|0;P=b+2640|0;M=b+2644|0;Ja=b+2520|0;F=E+408|0;Q=d+8828|0;U=E+360|0;La=E+404|0;V=E+364|0;id=L+4|0;xa=d+1600|0;Ma=E+368|0;K=d+8024|0;G=d+8020|0;S=E+412|0;Ka=c[r>>2]|0;nd=b+48|0;T=b+264|0;pd=b+272|0;od=b+280|0;md=b+2432|0;ge=E+396|0;he=b+2424|0;ie=E+392|0;je=b+2512|0;ke=E+372|0;le=b+2504|0;me=L+12|0;ne=b+360|0;oe=E+68|0;pe=E+96|0;qe=E+300|0;re=E+328|0;se=Pa+8|0;te=b+2472|0;ue=E+376|0;ve=Pa+4|0;we=b+2488|0;xe=E+380|0;ye=b+336|0;ze=b+48|0;Ae=b+2464|0;Be=E+388|0;Ce=b+352|0;De=L+8|0;Ee=b+2508|0;Fe=b+2448|0;Ge=b+2624|0;He=E+400|0;Ie=b+2528|0;Je=b+12|0;Ke=b+2536|0;Le=b+2544|0;Me=b+2560|0;Ne=b+2584|0;Oe=b+2440|0;Pe=b+2592|0;Qe=b+2600|0;Re=b+2420|0;Se=b+2608|0;Te=b+2616|0;Ue=b+2632|0;Ve=b+2576|0;We=b+2552|0;Xe=b+2568|0;Ye=E+420|0;Ze=b+400|0;_e=b+712|0;$e=E+184|0;af=E+212|0;bf=E+384|0;cf=b+2456|0;df=b+2480|0;ef=b+2496|0;ff=E+416|0;gf=b+2416|0;hf=0;jf=0;kf=0;lf=1;i:while(1){mf=b+(kf<<2)+816|0;nf=b+(kf<<2)+1616|0;of=hf;pf=jf;qf=lf;while(1){a[w+0|0]=0;a[w+1|0]=0;a[w+2|0]=0;rf=c[da>>2]|0;if((rf|0)>0){sf=0.0;tf=0.0;uf=0.0;vf=0.0;wf=0.0;xf=0.0;yf=0.0;zf=0.0;Af=0;Bf=0;Cf=0;Df=0;Ef=0;Ff=0;Gf=0;Hf=0;If=1.7976931348623157e+308;Jf=-1;Kf=of;Lf=pf;Mf=0;Nf=qf}else{fb=402;break}j:while(1){Of=c[(c[2888]|0)+(Mf<<2)>>2]|0;Pf=c[ia>>2]|0;Qf=c[Pf+(Mf<<7)+116>>2]|0;if(Qf>>>0>127?(a[Pf+(Mf<<7)+114|0]|0)==0:0){if((Of|0)==0){Rf=Jf;Sf=If;Tf=Hf;Uf=Gf;Vf=Ff;Wf=Ef;Xf=Df;Yf=Cf;Zf=Bf;_f=Af;$f=zf;ag=yf;bg=xf;cg=wf;dg=vf;eg=uf;fg=tf;gg=sf;hg=Kf;ig=Lf;jg=Nf}else{kg=Of+8|0;lg=c[kg>>2]|0;if((lg|0)!=0){mg=lg;while(1){lg=c[mg+12>>2]|0;if((lg|0)!=0){u=0;ma(115,lg|0);lg=u;u=0;if((lg|0)!=0&(v|0)!=0){ng=Wn(c[lg>>2]|0,j)|0;if((ng|0)==0){Oa(lg|0,v|0)}J=v}else{ng=-1}if((ng|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}mg=c[mg>>2]|0;if((mg|0)==0){break}}mg=c[kg>>2]|0;lg=(Of|0)==(Kf|0)?0:Kf;if((mg|0)==0){og=lg}else{pg=mg;while(1){mg=c[pg>>2]|0;u=0;ma(115,pg|0);qg=u;u=0;if((qg|0)!=0&(v|0)!=0){rg=Wn(c[qg>>2]|0,j)|0;if((rg|0)==0){Oa(qg|0,v|0)}J=v}else{rg=-1}if((rg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((mg|0)==0){og=lg;break}else{pg=mg}}}}else{og=(Of|0)==(Kf|0)?0:Kf}pg=c[Of>>2]|0;c[Of>>2]=0;if((pg|0)!=0){u=0;ma(115,pg|0);pg=u;u=0;if((pg|0)!=0&(v|0)!=0){sg=Wn(c[pg>>2]|0,j)|0;if((sg|0)==0){Oa(pg|0,v|0)}J=v}else{sg=-1}if((sg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}u=0;ma(115,Of|0);pg=u;u=0;if((pg|0)!=0&(v|0)!=0){tg=Wn(c[pg>>2]|0,j)|0;if((tg|0)==0){Oa(pg|0,v|0)}J=v}else{tg=-1}if((tg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[(c[2888]|0)+(Mf<<2)>>2]=0;Rf=Jf;Sf=If;Tf=Hf;Uf=Gf;Vf=Ff;Wf=Ef;Xf=Df;Yf=Cf;Zf=Bf;_f=Af;$f=zf;ag=yf;bg=xf;cg=wf;dg=vf;eg=uf;fg=tf;gg=sf;hg=og;ig=Lf;jg=Nf}}else{fb=420}do{if((fb|0)==420){fb=0;if(+h[Ja>>3]*(+h[Pf+(Mf<<7)+40>>3]+ +h[(c[ka>>2]|0)+40>>3])>If){ug=Jf;vg=If;wg=Hf;xg=Gf;yg=Ff;zg=Ef;Ag=Df;Bg=Cf;Cg=Bf;Dg=Af;Eg=zf;Fg=yf;Gg=xf;Hg=wf;Ig=vf;Jg=uf;Kg=tf;Lg=sf;Mg=Kf;Ng=Lf;Og=Nf;break j}if((a[Pf+(Mf<<7)+115|0]|0)!=0){if((Nf|0)!=0){c[F>>2]=(c[F>>2]|0)+1}if((Of|0)==0){Rf=Jf;Sf=If;Tf=Hf;Uf=Gf;Vf=Ff;Wf=Ef;Xf=Df;Yf=Cf;Zf=Bf;_f=Af;$f=zf;ag=yf;bg=xf;cg=wf;dg=vf;eg=uf;fg=tf;gg=sf;hg=Kf;ig=Lf;jg=Nf;break}pg=Of+8|0;lg=c[pg>>2]|0;if((lg|0)!=0){kg=lg;while(1){lg=c[kg+12>>2]|0;if((lg|0)!=0){u=0;ma(115,lg|0);lg=u;u=0;if((lg|0)!=0&(v|0)!=0){Pg=Wn(c[lg>>2]|0,j)|0;if((Pg|0)==0){Oa(lg|0,v|0)}J=v}else{Pg=-1}if((Pg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}kg=c[kg>>2]|0;if((kg|0)==0){break}}kg=c[pg>>2]|0;lg=(Of|0)==(Kf|0)?0:Kf;if((kg|0)==0){Qg=lg}else{mg=kg;while(1){kg=c[mg>>2]|0;u=0;ma(115,mg|0);qg=u;u=0;if((qg|0)!=0&(v|0)!=0){Rg=Wn(c[qg>>2]|0,j)|0;if((Rg|0)==0){Oa(qg|0,v|0)}J=v}else{Rg=-1}if((Rg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((kg|0)==0){Qg=lg;break}else{mg=kg}}}}else{Qg=(Of|0)==(Kf|0)?0:Kf}mg=c[Of>>2]|0;c[Of>>2]=0;if((mg|0)!=0){u=0;ma(115,mg|0);mg=u;u=0;if((mg|0)!=0&(v|0)!=0){Sg=Wn(c[mg>>2]|0,j)|0;if((Sg|0)==0){Oa(mg|0,v|0)}J=v}else{Sg=-1}if((Sg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}u=0;ma(115,Of|0);mg=u;u=0;if((mg|0)!=0&(v|0)!=0){Tg=Wn(c[mg>>2]|0,j)|0;if((Tg|0)==0){Oa(mg|0,v|0)}J=v}else{Tg=-1}if((Tg|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[(c[2888]|0)+(Mf<<2)>>2]=0;Rf=Jf;Sf=If;Tf=Hf;Uf=Gf;Vf=Ff;Wf=Ef;Xf=Df;Yf=Cf;Zf=Bf;_f=Af;$f=zf;ag=yf;bg=xf;cg=wf;dg=vf;eg=uf;fg=tf;gg=sf;hg=Qg;ig=Lf;jg=Nf;break}k:do{if((c[ea>>2]|0)>0){Ug=sf;Vg=tf;Wg=uf;Xg=vf;Yg=wf;Zg=xf;_g=yf;$g=zf;mg=Af;lg=Bf;pg=Cf;kg=Df;qg=Ef;ah=Ff;bh=Gf;ch=Hf;dh=If;eh=Jf;fh=Pf;gh=Qf;hh=Kf;ih=Lf;jh=Of;kh=0;lh=Nf;while(1){if(gh>>>0>127?(a[fh+(Mf<<7)+114|0]|0)==0:0){break}mh=c[ka>>2]|0;if((c[mh+(kh<<7)+116>>2]|0)>>>0>127?(a[mh+(kh<<7)+114|0]|0)==0:0){nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=lh}else{fb=459}l:do{if((fb|0)==459){fb=0;if(+h[Ja>>3]*(+h[mh+(kh<<7)+40>>3]+ +h[fh+(Mf<<7)+40>>3])>dh){Jh=eh;Kh=dh;Lh=ch;Mh=bh;Nh=ah;Oh=qg;Ph=kg;Qh=pg;Rh=lg;Sh=mg;Th=$g;Uh=_g;Vh=Zg;Wh=Yg;Xh=Xg;Yh=Wg;Zh=Vg;_h=Ug;$h=hh;ai=ih;bi=lh;break k}ci=(c[2890]|0)+(Mf<<2)|0;if((kh|0)>(c[ci>>2]|0)){c[ci>>2]=kh;di=1}else{di=0}if((a[mh+(kh<<7)+115|0]|0)!=0){if((di|0)==0){nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=0;break}c[F>>2]=(c[F>>2]|0)+1;nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=di;break}if((c[X>>2]|0)!=10){if((a[mh+(kh<<7)+114|0]|0)!=0?(a[fh+(Mf<<7)+114|0]|0)!=0:0){fb=468}else{ei=0}}else{fb=468}if((fb|0)==468){fb=0;ei=1}if(((c[Q>>2]|0)>0?(a[fh+(Mf<<7)+120|0]|0)==0:0)?(a[mh+(kh<<7)+120|0]|0)==0:0){if((di|0)!=0){c[U>>2]=(c[U>>2]|0)+1;c[La>>2]=(c[La>>2]|0)+1}if((ei|0)==0){nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=di;break}}fi=+((c[fh+(Mf<<7)+56>>2]|0)+1-(c[mh+(kh<<7)+56>>2]|0)|0);if(!(!(fi<+(c[mf>>2]|0))?!(fi>+(c[nf>>2]|0)):0)){if((di|0)!=0){if((ei|0)==0){c[U>>2]=(c[U>>2]|0)+1}c[V>>2]=(c[V>>2]|0)+1}if((ei|0)==0){nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=di;break}}m:do{if((jh|0)!=0){ci=c[jh+4>>2]|0;if((ci|0)!=0){gi=ci+ -1|0;hi=(gi&ci|0)==0;if(hi){ii=gi&kh}else{ii=(kh>>>0)%(ci>>>0)|0}ji=c[(c[jh>>2]|0)+(ii<<2)>>2]|0;if((ji|0)!=0){ki=ji;do{ki=c[ki>>2]|0;if((ki|0)==0){li=mh;mi=fh;ni=jh;break m}ji=c[ki+4>>2]|0;if(hi){oi=ji&gi}else{oi=(ji>>>0)%(ci>>>0)|0}if((oi|0)!=(ii|0)){li=mh;mi=fh;ni=jh;break m}}while((c[ki+8>>2]|0)!=(kh|0));ci=c[ki+12>>2]|0;if((ci|0)==0){nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=jh;Ih=di;break l}if((di|0)!=0){c[U>>2]=(c[U>>2]|0)+1;c[Ye>>2]=(c[Ye>>2]|0)+1}fi=+h[ci>>3];if(!(fi+1.0e-6<dh)){if(!(fi>dh+1.0e-6)){gi=c[ci+72>>2]|0;hi=c[gi+56>>2]|0;ji=c[ch+56>>2]|0;if((hi|0)<=(ji|0)){if((hi|0)>=(ji|0)){ji=c[ci+76>>2]|0;hi=c[ji+56>>2]|0;pi=c[bh+56>>2]|0;if((hi|0)>=(pi|0)){if((hi|0)<=(pi|0)){pi=a[gi+112|0]|0;hi=a[ch+112|0]|0;if(!(pi<<24>>24<hi<<24>>24)){if(!(pi<<24>>24>hi<<24>>24)?(a[ji+112|0]|0)<(a[bh+112|0]|0):0){qi=gi;fb=507}else{ri=eh;si=dh;ti=ch;ui=bh;vi=ah;wi=qg;xi=kg;yi=pg;zi=lg;Ai=mg;Bi=$g;Ci=_g;Di=Zg;Ei=Yg;Fi=Xg;Gi=Wg;Hi=Vg;Ii=Ug;Ji=hh;Ki=ih}}else{qi=gi;fb=507}}else{ri=eh;si=dh;ti=ch;ui=bh;vi=ah;wi=qg;xi=kg;yi=pg;zi=lg;Ai=mg;Bi=$g;Ci=_g;Di=Zg;Ei=Yg;Fi=Xg;Gi=Wg;Hi=Vg;Ii=Ug;Ji=hh;Ki=ih}}else{qi=gi;fb=507}}else{ri=eh;si=dh;ti=ch;ui=bh;vi=ah;wi=qg;xi=kg;yi=pg;zi=lg;Ai=mg;Bi=$g;Ci=_g;Di=Zg;Ei=Yg;Fi=Xg;Gi=Wg;Hi=Vg;Ii=Ug;Ji=hh;Ki=ih}}else{qi=gi;fb=507}}else{ri=eh;si=dh;ti=ch;ui=bh;vi=ah;wi=qg;xi=kg;yi=pg;zi=lg;Ai=mg;Bi=$g;Ci=_g;Di=Zg;Ei=Yg;Fi=Xg;Gi=Wg;Hi=Vg;Ii=Ug;Ji=hh;Ki=ih}}else{qi=c[ci+72>>2]|0;fb=507}if((fb|0)==507){fb=0;Li=+h[ci+8>>3];Mi=+h[ci+16>>3];Ni=+h[ci+24>>3];Oi=+h[ci+32>>3];Pi=+h[ci+40>>3];Qi=+h[ci+48>>3];Ri=+h[ci+56>>3];Si=+h[ci+64>>3];gi=c[ci+76>>2]|0;ji=ci+80|0;hi=c[ji>>2]|0;pi=a[ci+84|0]|0;Ti=ci+85|0;a[w+0|0]=a[Ti+0|0]|0;a[w+1|0]=a[Ti+1|0]|0;a[w+2|0]=a[Ti+2|0]|0;ri=kh;si=fi;ti=qi;ui=gi;vi=hi;wi=pi;xi=c[ci+88>>2]|0;yi=c[ci+92>>2]|0;zi=c[ci+96>>2]|0;Ai=c[ji+20>>2]|0;Bi=Li;Ci=Mi;Di=Ni;Ei=Oi;Fi=Pi;Gi=Qi;Hi=Ri;Ii=Si;Ji=jh;Ki=ci}if(si==0.0){Jh=ri;Kh=si;Lh=ti;Mh=ui;Nh=vi;Oh=wi;Ph=xi;Qh=yi;Rh=zi;Sh=Ai;Th=Bi;Uh=Ci;Vh=Di;Wh=Ei;Xh=Fi;Yh=Gi;Zh=Hi;_h=Ii;$h=Ji;ai=Ki;bi=di;break k}else{nh=ri;oh=si;ph=ti;qh=ui;rh=vi;sh=wi;th=xi;uh=yi;vh=zi;wh=Ai;xh=Bi;yh=Ci;zh=Di;Ah=Ei;Bh=Fi;Ch=Gi;Dh=Hi;Eh=Ii;Fh=Ji;Gh=Ki;Hh=jh;Ih=di;break l}}else{li=mh;mi=fh;ni=jh}}else{li=mh;mi=fh;ni=jh}}else{u=0;ci=oa(68,20)|0;ji=u;u=0;if((ji|0)!=0&(v|0)!=0){Ui=Wn(c[ji>>2]|0,j)|0;if((Ui|0)==0){Oa(ji|0,v|0)}J=v}else{Ui=-1}if((Ui|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ji=ci+16|0;c[ci+0>>2]=0;c[ci+4>>2]=0;c[ci+8>>2]=0;c[ci+12>>2]=0;g[ji>>2]=1.0;u=0;na(42,ci|0,193);ji=u;u=0;if((ji|0)!=0&(v|0)!=0){Vi=Wn(c[ji>>2]|0,j)|0;if((Vi|0)==0){Oa(ji|0,v|0)}J=v}else{Vi=-1}if((Vi|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((ci|0)==0){fb=512;break i}c[(c[2888]|0)+(Mf<<2)>>2]=ci;li=c[ka>>2]|0;mi=c[ia>>2]|0;ni=ci}}while(0);ci=c[id>>2]|0;a[t+0|0]=0;a[t+1|0]=0;a[t+2|0]=0;ji=li+(kh<<7)|0;pi=mi+(Mf<<7)|0;hi=mi+(Mf<<7)+56|0;gi=li+(kh<<7)+56|0;Ti=(c[hi>>2]|0)+1-(c[gi>>2]|0)|0;Wi=(di|0)!=0;if(Wi){c[U>>2]=(c[U>>2]|0)+1}Xi=(c[X>>2]|0)==10|0;if((a[li+(kh<<7)+114|0]|0)!=0?(a[mi+(Mf<<7)+114|0]|0)!=0:0){if((Ti|0)<1){c[ff>>2]=(c[ff>>2]|0)+1}else{Yi=1;fb=521}}else{Yi=Xi;fb=521}n:do{if((fb|0)==521){fb=0;Xi=Yi&255;Zi=c[xa>>2]|0;o:do{if((Zi|0)>0){_i=(c[hi>>2]|0)-(a[mi+(Mf<<7)+112|0]|0)+1|0;$i=(a[li+(kh<<7)+112|0]|0)+(c[gi>>2]|0)|0;if(($i|0)<=(_i|0)){aj=0;while(1){bj=c[d+(aj<<3)>>2]|0;cj=aj+1|0;if(!(($i|0)>((c[d+(aj<<3)+4>>2]|0)+bj|0)|(_i|0)<(bj|0))){dj=1;break o}if((cj|0)<(Zi|0)){aj=cj}else{break}}}if(Wi){c[Ma>>2]=(c[Ma>>2]|0)+1}if((Yi|0)==0){break n}else{dj=-1}}else{dj=0}}while(0);Zi=c[K>>2]|0;p:do{if((Zi|0)>0?(c[G>>2]|0)==0:0){ki=c[gi>>2]|0;aj=(a[li+(kh<<7)+112|0]|0)+ki|0;_i=c[hi>>2]|0;$i=_i-(a[mi+(Mf<<7)+112|0]|0)+1|0;cj=0;do{bj=c[d+(cj<<3)+4812>>2]|0;ej=c[d+(cj<<3)+6412>>2]|0;do{if((bj|0)==-1){if(($i|0)>=(ej|0)?(_i|0)<=(ej+ -1+(c[d+(cj<<3)+6416>>2]|0)|0):0){break p}}else{fj=(ki|0)>=(bj|0);if((ej|0)==-1){if(!fj){break}if((aj|0)>((c[d+(cj<<3)+4816>>2]|0)+bj|0)){break}else{break p}}if((fj?!((aj|0)>((c[d+(cj<<3)+4816>>2]|0)+bj|0)|($i|0)<(ej|0)):0)?(_i|0)<=(ej+ -1+(c[d+(cj<<3)+6416>>2]|0)|0):0){break p}}}while(0);cj=cj+1|0}while((cj|0)<(Zi|0));if(Wi){c[S>>2]=(c[S>>2]|0)+1}if((Yi|0)==0){break n}}}while(0);Zi=c[hi>>2]|0;cj=c[gi>>2]|0;if((Zi-cj|0)<0){u=0;qa(6,11720,9,1,Ka|0)|0;_i=u;u=0;if((_i|0)!=0&(v|0)!=0){gj=Wn(c[_i>>2]|0,j)|0;if((gj|0)==0){Oa(_i|0,v|0)}J=v}else{gj=-1}if((gj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}hj=c[hi>>2]|0;ij=c[gi>>2]|0}else{hj=Zi;ij=cj}cj=hj-ij|0;if(!((cj|0)>-1)){fb=548;break i}u=0;Si=+pa(1,c[O>>2]|0,ij|0,cj+1|0,+(+h[T>>3]),+(+h[pd>>3]),+(+h[od>>3]));cj=u;u=0;if((cj|0)!=0&(v|0)!=0){jj=Wn(c[cj>>2]|0,j)|0;if((jj|0)==0){Oa(cj|0,v|0)}J=v}else{jj=-1}if((jj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(!(Si!=-999999.9999)){fb=553;break i}cj=li+(kh<<7)+16|0;Ri=+h[cj>>3];Zi=mi+(Mf<<7)+16|0;Qi=+h[Zi>>3];Pi=Ri>Qi?Qi:Ri;Ri=Si-Pi;Qi=Si*.7+Pi*.3+-14.9;Pi=+h[md>>3];if(Pi!=-1.0e6&Si<Pi){if(Wi){c[ge>>2]=(c[ge>>2]|0)+1}if((Yi|0)==0){break}}Pi=+h[he>>3];if(Pi!=1.0e6&Si>Pi){if(Wi){c[ie>>2]=(c[ie>>2]|0)+1}if((Yi|0)==0){break}}_i=c[ka>>2]|0;$i=c[ia>>2]|0;u=0;Pi=+va(1,+(+h[_i+(kh<<7)+16>>3]- +h[$i+(Mf<<7)+16>>3]));aj=u;u=0;if((aj|0)!=0&(v|0)!=0){kj=Wn(c[aj>>2]|0,j)|0;if((kj|0)==0){Oa(aj|0,v|0)}J=v}else{kj=-1}if((kj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Pi>+h[je>>3]){if(Wi){c[ke>>2]=(c[ke>>2]|0)+1}if((Yi|0)==0){break}}aj=c[O>>2]|0;ki=c[_i+(kh<<7)+56>>2]|0;ej=a[_i+(kh<<7)+112|0]|0;_i=ej<<24>>24;bj=_i+ki|0;if(ej<<24>>24>0){ej=ki;do{a[l+(ej-ki)|0]=a[aj+ej|0]|0;ej=ej+1|0}while((ej|0)<(bj|0))}a[l+_i|0]=0;bj=c[$i+(Mf<<7)+56>>2]|0;ej=a[$i+(Mf<<7)+112|0]|0;ki=ej<<24>>24;fj=bj-ki+1|0;lj=bj+1|0;if(ej<<24>>24>0){ej=fj;do{a[m+(ej-fj)|0]=a[aj+ej|0]|0;ej=ej+1|0}while((ej|0)<(lj|0))}a[m+ki|0]=0;u=0;na(41,l|0,n|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){mj=Wn(c[lj>>2]|0,j)|0;if((mj|0)==0){Oa(lj|0,v|0)}J=v}else{mj=-1}if((mj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;na(41,m|0,o|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){nj=Wn(c[lj>>2]|0,j)|0;if((nj|0)==0){Oa(lj|0,v|0)}J=v}else{nj=-1}if((nj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}lj=c[ka>>2]|0;ej=lj+(kh<<7)|0;if(+h[lj+(kh<<7)+72>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==0:0){u=0;ua(16,ej|0,nd|0,aa|0,Pa|0,l|0,n|0);ej=u;u=0;if((ej|0)!=0&(v|0)!=0){oj=Wn(c[ej>>2]|0,j)|0;if((oj|0)==0){Oa(ej|0,v|0)}J=v}else{oj=-1}if((oj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ej=c[ka>>2]|0;if(((c[ej+(kh<<7)+116>>2]|0)>>>0>127?(a[ej+(kh<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}else{pj=ej}}else{pj=lj}lj=pj+(kh<<7)|0;if(+h[pj+(kh<<7)+72>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){u=0;ua(17,lj|0,nd|0,aa|0,L|0,l|0,l|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){qj=Wn(c[lj>>2]|0,j)|0;if((qj|0)==0){Oa(lj|0,v|0)}J=v}else{qj=-1}if((qj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}lj=c[ka>>2]|0;if(((c[lj+(kh<<7)+116>>2]|0)>>>0>127?(a[lj+(kh<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}else{rj=lj}}else{rj=pj}lj=rj+(kh<<7)|0;ej=rj+(kh<<7)+88|0;if(+h[ej>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){if((lj|0)==0){fb=590;break i}u=0;Oi=+Ba(1,l|0,l|0,c[me>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){sj=Wn(c[lj>>2]|0,j)|0;if((sj|0)==0){Oa(lj|0,v|0)}J=v}else{sj=-1}if((sj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}h[ej>>3]=Oi;if(Oi>+h[ne>>3]){ej=rj+(kh<<7)+116|0;c[ej>>2]=c[ej>>2]|536870913;c[oe>>2]=(c[oe>>2]|0)+1;c[pe>>2]=(c[pe>>2]|0)+ -1}ej=c[ka>>2]|0;if(((c[ej+(kh<<7)+116>>2]|0)>>>0>127?(a[ej+(kh<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}}ej=c[ia>>2]|0;lj=ej+(Mf<<7)|0;if(+h[ej+(Mf<<7)+72>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==0:0){u=0;ua(16,lj|0,nd|0,$|0,Pa|0,o|0,m|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){tj=Wn(c[lj>>2]|0,j)|0;if((tj|0)==0){Oa(lj|0,v|0)}J=v}else{tj=-1}if((tj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}lj=c[ia>>2]|0;if(((c[lj+(Mf<<7)+116>>2]|0)>>>0>127?(a[lj+(Mf<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}else{uj=lj}}else{uj=ej}ej=uj+(Mf<<7)|0;if(+h[uj+(Mf<<7)+72>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){u=0;ua(17,ej|0,nd|0,$|0,L|0,o|0,o|0);ej=u;u=0;if((ej|0)!=0&(v|0)!=0){vj=Wn(c[ej>>2]|0,j)|0;if((vj|0)==0){Oa(ej|0,v|0)}J=v}else{vj=-1}if((vj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ej=c[ia>>2]|0;if(((c[ej+(Mf<<7)+116>>2]|0)>>>0>127?(a[ej+(Mf<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}else{wj=ej}}else{wj=uj}ej=wj+(Mf<<7)|0;lj=wj+(Mf<<7)+88|0;if(+h[lj>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){if((ej|0)==0){fb=614;break i}u=0;Oi=+Ba(1,o|0,o|0,c[me>>2]|0);ej=u;u=0;if((ej|0)!=0&(v|0)!=0){xj=Wn(c[ej>>2]|0,j)|0;if((xj|0)==0){Oa(ej|0,v|0)}J=v}else{xj=-1}if((xj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}h[lj>>3]=Oi;if(Oi>+h[ne>>3]){lj=wj+(Mf<<7)+116|0;c[lj>>2]=c[lj>>2]|536870913;c[qe>>2]=(c[qe>>2]|0)+1;c[re>>2]=(c[re>>2]|0)+ -1}lj=c[ia>>2]|0;if(((c[lj+(Mf<<7)+116>>2]|0)>>>0>127?(a[lj+(Mf<<7)+114|0]|0)==0:0)?(c[U>>2]=(c[U>>2]|0)+ -1,(Yi|0)==0):0){break}}lj=c[ka>>2]|0;do{if((c[lj+(kh<<7)+8>>2]|0)==0){u=0;ua(18,lj+(kh<<7)|0,b|0,d|0,0,aa|0,Pa|0);ej=u;u=0;if((ej|0)!=0&(v|0)!=0){yj=Wn(c[ej>>2]|0,j)|0;if((yj|0)==0){Oa(ej|0,v|0)}J=v}else{yj=-1}if((yj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ej=c[ka>>2]|0;if(!((c[ej+(kh<<7)+116>>2]|0)>>>0>127?(a[ej+(kh<<7)+114|0]|0)==0:0)){u=0;wa(39,ej+(kh<<7)|0,b|0,d|0,0,aa|0,c[se>>2]|0,ci|0);ej=u;u=0;if((ej|0)!=0&(v|0)!=0){zj=Wn(c[ej>>2]|0,j)|0;if((zj|0)==0){Oa(ej|0,v|0)}J=v}else{zj=-1}if((zj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ej=c[ka>>2]|0;if(!((c[ej+(kh<<7)+116>>2]|0)>>>0>127)){break}if((a[ej+(kh<<7)+114|0]|0)!=0){break}}c[U>>2]=(c[U>>2]|0)+ -1;if((Yi|0)==0){break n}}}while(0);lj=c[ia>>2]|0;do{if((c[lj+(Mf<<7)+8>>2]|0)==0){u=0;ua(18,lj+(Mf<<7)|0,b|0,d|0,1,$|0,Pa|0);ki=u;u=0;if((ki|0)!=0&(v|0)!=0){Aj=Wn(c[ki>>2]|0,j)|0;if((Aj|0)==0){Oa(ki|0,v|0)}J=v}else{Aj=-1}if((Aj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ki=c[ia>>2]|0;if(!((c[ki+(Mf<<7)+116>>2]|0)>>>0>127?(a[ki+(Mf<<7)+114|0]|0)==0:0)){u=0;wa(39,ki+(Mf<<7)|0,b|0,d|0,1,$|0,c[se>>2]|0,ci|0);ki=u;u=0;if((ki|0)!=0&(v|0)!=0){Bj=Wn(c[ki>>2]|0,j)|0;if((Bj|0)==0){Oa(ki|0,v|0)}J=v}else{Bj=-1}if((Bj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}ki=c[ia>>2]|0;if(!((c[ki+(Mf<<7)+116>>2]|0)>>>0>127)){break}if((a[ki+(Mf<<7)+114|0]|0)!=0){break}}c[U>>2]=(c[U>>2]|0)+ -1;if((Yi|0)==0){break n}}}while(0);if((c[le>>2]|0)==0){u=0;Oi=+Ba(2,l|0,m|0,c[Pa>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Cj=Wn(c[lj>>2]|0,j)|0;if((Cj|0)==0){Oa(lj|0,v|0)}J=v}else{Cj=-1}if((Cj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Oi>+h[te>>3]){if(Wi){c[ue>>2]=(c[ue>>2]|0)+1}if((Yi|0)==0){break}}u=0;Ni=+Ba(2,l|0,m|0,c[ve>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Dj=Wn(c[lj>>2]|0,j)|0;if((Dj|0)==0){Oa(lj|0,v|0)}J=v}else{Dj=-1}if((Dj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Ni>+h[we>>3]){if(Wi){c[xe>>2]=(c[xe>>2]|0)+1}if((Yi|0)==0){break}else{Ej=Oi;Fj=Ni}}else{Ej=Oi;Fj=Ni}}else{u=0;Ni=+Ba(1,l|0,o|0,c[L>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Gj=Wn(c[lj>>2]|0,j)|0;if((Gj|0)==0){Oa(lj|0,v|0)}J=v}else{Gj=-1}if((Gj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Ni>+h[df>>3]){if(Wi){c[ue>>2]=(c[ue>>2]|0)+1}if((Yi|0)==0){break}}u=0;Oi=+Ba(1,l|0,o|0,c[id>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Hj=Wn(c[lj>>2]|0,j)|0;if((Hj|0)==0){Oa(lj|0,v|0)}J=v}else{Hj=-1}if((Hj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;Mi=+Ba(1,l|0,o|0,c[De>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Ij=Wn(c[lj>>2]|0,j)|0;if((Ij|0)==0){Oa(lj|0,v|0)}J=v}else{Ij=-1}if((Ij|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}Li=Oi<Mi?Mi:Oi;if(Li>+h[ef>>3]){if(Wi){c[xe>>2]=(c[xe>>2]|0)+1}if((Yi|0)==0){break}else{Ej=Ni;Fj=Li}}else{Ej=Ni;Fj=Li}}if((c[le>>2]|0)==0){u=0;Li=+Ba(2,o|0,n|0,c[ve>>2]|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Jj=Wn(c[lj>>2]|0,j)|0;if((Jj|0)==0){Oa(lj|0,v|0)}J=v}else{Jj=-1}if((Jj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Li>Fj){if(Li>+h[ye>>3]){if(Wi){c[xe>>2]=(c[xe>>2]|0)+1}if((Yi|0)==0){break}else{Kj=Li}}else{Kj=Li}}else{Kj=Fj}}else{Kj=Fj}u=0;lj=oa(69,c[ze>>2]|0)|0;ki=u;u=0;if((ki|0)!=0&(v|0)!=0){Lj=Wn(c[ki>>2]|0,j)|0;if((Lj|0)==0){Oa(ki|0,v|0)}J=v}else{Lj=-1}if((Lj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((lj|0)!=0){ki=c[c[ze>>2]>>2]|0;ej=c[ki>>2]|0;if((lj|0)>0){aj=c[li+(kh<<7)+8>>2]|0;fj=c[mi+(Mf<<7)+8>>2]|0;$i=ej;_i=0;bj=0;while(1){Mj=~~(+h[aj+(_i<<3)>>3]+ +h[fj+(_i<<3)>>3]);if((Mj|0)>(bj|0)){Nj=c[ki+(_i<<2)>>2]|0;Oj=Mj}else{Nj=$i;Oj=bj}Mj=_i+1|0;if((Mj|0)==(lj|0)){Pj=Oj;Qj=Nj;break}else{$i=Nj;_i=Mj;bj=Oj}}}else{Pj=0;Qj=ej}}else{Pj=0;Qj=0}Li=+(Pj|0);if(Li>+h[Ae>>3]){if(Wi){c[Be>>2]=(c[Be>>2]|0)+1}if((Yi|0)==0){break}}do{if((c[le>>2]|0)==1){u=0;Ni=+Ba(1,m|0,n|0,c[id>>2]|0);bj=u;u=0;if((bj|0)!=0&(v|0)!=0){Rj=Wn(c[bj>>2]|0,j)|0;if((Rj|0)==0){Oa(bj|0,v|0)}J=v}else{Rj=-1}if((Rj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(!(Ni>Kj)){u=0;Oi=+Ba(1,m|0,n|0,c[De>>2]|0);bj=u;u=0;if((bj|0)!=0&(v|0)!=0){Sj=Wn(c[bj>>2]|0,j)|0;if((Sj|0)==0){Oa(bj|0,v|0)}J=v}else{Sj=-1}if((Sj|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if(Oi>Kj){Tj=Oi}else{Uj=Kj;break}}else{Tj=Ni}if(Tj>+h[Ce>>3]){if(Wi){c[xe>>2]=(c[xe>>2]|0)+1}if((Yi|0)==0){break n}else{Uj=Tj}}else{Uj=Tj}}else{Uj=Kj}}while(0);do{if((c[Ee>>2]|0)==0){Ni=+h[Fe>>3];if(!(Ni>=0.0)?!(+h[Ge>>3]>0.0):0){Vj=-1.7976931348623157e+308;break}Oi=+h[li+(kh<<7)+96>>3];if(!(Oi!=-1.7976931348623157e+308)){fb=692;break i}Mi=+h[li+(kh<<7)+104>>3];if(!(Mi!=-1.7976931348623157e+308)){fb=696;break i}fi=+h[mi+(Mf<<7)+96>>3];if(!(fi!=-1.7976931348623157e+308)){fb=700;break i}Wj=+h[mi+(Mf<<7)+104>>3];if(!(Wj!=-1.7976931348623157e+308)){fb=704;break i}Xj=Oi+Wj;Wj=Mi+fi;fi=Wj>Xj?Wj:Xj;if(Ni>=0.0&fi>Ni){if(Wi){c[He>>2]=(c[He>>2]|0)+1}if((Yi|0)==0){break n}else{Vj=fi}}else{Vj=fi}}else{fi=+h[cf>>3];if(!(fi>=0.0)?!(+h[Ue>>3]>0.0):0){Vj=-1.7976931348623157e+308;break}Ni=+h[li+(kh<<7)+96>>3];if(!(Ni!=-1.7976931348623157e+308)){fb=714;break i}Xj=+h[li+(kh<<7)+104>>3];if(!(Xj!=-1.7976931348623157e+308)){fb=718;break i}Wj=+h[mi+(Mf<<7)+96>>3];if(!(Wj!=-1.7976931348623157e+308)){fb=722;break i}Mi=+h[mi+(Mf<<7)+104>>3];if(!(Mi!=-1.7976931348623157e+308)){fb=726;break i}Oi=Ni+Mi;Mi=Xj+Wj;Wj=Mi>Oi?Mi:Oi;if(fi!=0.0&Wj>fi){if(Wi){c[He>>2]=(c[He>>2]|0)+1}if((Yi|0)==0){break n}else{Vj=Wj}}else{Vj=Wj}}}while(0);do{if(((c[R>>2]|0)!=0?(c[Y>>2]|0)!=0:0)?(c[Je>>2]|0)!=0:0){if((c[ca>>2]|0)>0){ej=li+(kh<<7)+112|0;bj=mi+(Mf<<7)+112|0;_i=-1;$i=0;Wj=1.0e6;while(1){lj=c[ga>>2]|0;ki=lj+($i<<7)|0;fj=lj+($i<<7)+56|0;aj=c[fj>>2]|0;q:do{if(((aj|0)>((c[gi>>2]|0)+ -1+(a[ej]|0)|0)?(Mj=lj+($i<<7)+112|0,Yj=a[Mj]|0,Zj=Yj<<24>>24,(aj+ -1+Zj|0)<((c[hi>>2]|0)+1-(a[bj]|0)|0)):0)?(_j=lj+($i<<7)+40|0,+h[_j>>3]<Wj):0){$j=lj+($i<<7)+116|0;if((c[$j>>2]|0)>>>0>127?(a[lj+($i<<7)+114|0]|0)==0:0){ak=_i;bk=Wj;break}ck=lj+($i<<7)+72|0;fi=+h[ck>>3];if(fi==-1.7976931348623157e+308){if((c[le>>2]|0)==0){dk=c[O>>2]|0;ek=Zj+aj|0;if(Yj<<24>>24>0){Yj=aj;do{a[l+(Yj-aj)|0]=a[dk+Yj|0]|0;Yj=Yj+1|0}while((Yj|0)<(ek|0))}a[l+Zj|0]=0;u=0;na(41,l|0,m|0);ek=u;u=0;if((ek|0)!=0&(v|0)!=0){fk=Wn(c[ek>>2]|0,j)|0;if((fk|0)==0){Oa(ek|0,v|0)}J=v}else{fk=-1}if((fk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;ua(16,ki|0,Ze|0,_|0,Pa|0,l|0,m|0);ek=u;u=0;if((ek|0)!=0&(v|0)!=0){gk=Wn(c[ek>>2]|0,j)|0;if((gk|0)==0){Oa(ek|0,v|0)}J=v}else{gk=-1}if((gk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((c[$j>>2]|0)>>>0>127?(a[lj+($i<<7)+114|0]|0)==0:0){ak=_i;bk=Wj;break}}hk=+h[ck>>3]}else{hk=fi}if(hk==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){ek=c[O>>2]|0;Yj=c[fj>>2]|0;dk=a[Mj]|0;ik=dk<<24>>24;jk=ik+Yj|0;if(dk<<24>>24>0){dk=Yj;do{a[l+(dk-Yj)|0]=a[ek+dk|0]|0;dk=dk+1|0}while((dk|0)<(jk|0))}a[l+ik|0]=0;u=0;na(41,l|0,m|0);jk=u;u=0;if((jk|0)!=0&(v|0)!=0){kk=Wn(c[jk>>2]|0,j)|0;if((kk|0)==0){Oa(jk|0,v|0)}J=v}else{kk=-1}if((kk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}u=0;ua(17,ki|0,Ze|0,_|0,c[48]|0,l|0,l|0);jk=u;u=0;if((jk|0)!=0&(v|0)!=0){lk=Wn(c[jk>>2]|0,j)|0;if((lk|0)==0){Oa(jk|0,v|0)}J=v}else{lk=-1}if((lk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((c[$j>>2]|0)>>>0>127?(a[lj+($i<<7)+114|0]|0)==0:0){ak=_i;bk=Wj;break}}jk=lj+($i<<7)+88|0;do{if(+h[jk>>3]==-1.7976931348623157e+308?(c[le>>2]|0)==1:0){dk=c[O>>2]|0;ek=c[fj>>2]|0;Yj=a[Mj]|0;ck=Yj<<24>>24;Zj=ck+ek|0;if(Yj<<24>>24>0){Yj=ek;do{a[l+(Yj-ek)|0]=a[dk+Yj|0]|0;Yj=Yj+1|0}while((Yj|0)<(Zj|0))}a[l+ck|0]=0;if((ki|0)==0){fb=765;break i}u=0;fi=+Ba(1,l|0,l|0,c[(c[48]|0)+12>>2]|0);Zj=u;u=0;if((Zj|0)!=0&(v|0)!=0){mk=Wn(c[Zj>>2]|0,j)|0;if((mk|0)==0){Oa(Zj|0,v|0)}J=v}else{mk=-1}if((mk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}h[jk>>3]=fi;Zj=c[$j>>2]|0;if(!(fi>+h[_e>>3])){if(!(Zj>>>0>127)){break}}else{c[$j>>2]=Zj|536870913;c[$e>>2]=(c[$e>>2]|0)+1;c[af>>2]=(c[af>>2]|0)+ -1}if((a[lj+($i<<7)+114|0]|0)==0){ak=_i;bk=Wj;break q}}}while(0);if((c[lj+($i<<7)+8>>2]|0)==0){u=0;ua(18,ki|0,b|0,d|0,2,_|0,Pa|0);jk=u;u=0;if((jk|0)!=0&(v|0)!=0){nk=Wn(c[jk>>2]|0,j)|0;if((nk|0)==0){Oa(jk|0,v|0)}J=v}else{nk=-1}if((nk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((c[$j>>2]|0)>>>0>127?(a[lj+($i<<7)+114|0]|0)==0:0){ak=_i;bk=Wj;break}}ak=$i;bk=+h[_j>>3]}else{ak=_i;bk=Wj}}while(0);$i=$i+1|0;if(($i|0)>=(c[ca>>2]|0)){break}else{_i=ak;Wj=bk}}if((ak|0)>-1){ok=(c[ga>>2]|0)+(ak<<7)|0;break}}if((di|0)!=0){c[bf>>2]=(c[bf>>2]|0)+1}_i=c[ni+4>>2]|0;r:do{if((_i|0)!=0){$i=_i+ -1|0;bj=($i&_i|0)==0;if(bj){pk=$i&kh}else{pk=(kh>>>0)%(_i>>>0)|0}ej=c[(c[ni>>2]|0)+(pk<<2)>>2]|0;if((ej|0)!=0){lj=ej;while(1){ej=c[lj>>2]|0;if((ej|0)==0){fb=793;break r}ki=c[ej+4>>2]|0;if(bj){qk=ki&$i}else{qk=(ki>>>0)%(_i>>>0)|0}if((qk|0)!=(pk|0)){fb=793;break r}if((c[ej+8>>2]|0)==(kh|0)){rk=ej;break}else{lj=ej}}}else{fb=793}}else{fb=793}}while(0);if((fb|0)==793){fb=0;u=0;_i=oa(68,16)|0;lj=u;u=0;if((lj|0)!=0&(v|0)!=0){sk=Wn(c[lj>>2]|0,j)|0;if((sk|0)==0){Oa(lj|0,v|0)}J=v}else{sk=-1}if((sk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[_i+8>>2]=kh;c[_i+12>>2]=0;u=0;Ea(3,k|0,ni|0,_i|0);_i=u;u=0;if((_i|0)!=0&(v|0)!=0){tk=Wn(c[_i>>2]|0,j)|0;if((tk|0)==0){Oa(_i|0,v|0)}J=v}else{tk=-1}if((tk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}rk=c[k>>2]|0}c[rk+12>>2]=0;nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=ni;Ih=di;break l}else{ok=0}}while(0);if((di|0)!=0){c[Ye>>2]=(c[Ye>>2]|0)+1}Wj=+h[Zi>>3];fi=+h[cj>>3];Oi=fi<Wj?fi:Wj;Wj=+h[Ja>>3];if(Wj!=0.0){uk=Wj*(+h[li+(kh<<7)+40>>3]+ +h[mi+(Mf<<7)+40>>3])+0.0}else{uk=0.0}Wj=+h[Ie>>3];if(((Wj!=0.0?(c[R>>2]|0)!=0:0)?(c[Y>>2]|0)!=0:0)?(c[Je>>2]|0)!=0:0){vk=uk+Wj*+h[ok+40>>3]}else{vk=uk}Wj=+h[Ke>>3];if(Wj!=0.0){wk=vk+Pi*Wj}else{wk=vk}_i=c[le>>2]|0;if((_i|0)==0){Wj=+h[Le>>3];if(Wj!=0.0){xk=wk+Ej*Wj}else{xk=wk}Wj=+h[Me>>3];if(Wj!=0.0){yk=xk+Uj*Wj}else{yk=xk}}else if((_i|0)==1){Wj=+h[We>>3];if(Wj!=0.0){fi=Oi- +h[Ve>>3];if(!(fi<=Ej)){zk=wk}else{zk=wk+Wj*(Ej-(fi+-1.0))}if(fi>Ej){Ak=zk+Wj*(1.0/(fi+1.0-Ej))}else{Ak=zk}}else{Ak=wk}fi=+h[Xe>>3];if(fi!=0.0){Wj=Oi- +h[Ve>>3];if(!(Wj<=Uj)){Bk=Ak}else{Bk=Ak+fi*(Uj-(Wj+-1.0))}if(Wj>Uj){yk=Bk+fi*(1.0/(Wj+1.0-Uj))}else{yk=Bk}}else{yk=Ak}}else{fb=824;break i}Wj=+h[Ne>>3];if(Wj!=0.0?(fi=+h[Oe>>3],Si<fi):0){Ck=yk+Wj*(fi-Si)}else{Ck=yk}fi=+h[Pe>>3];if(fi!=0.0?(Wj=+h[Oe>>3],Si>Wj):0){Dk=Ck+fi*(Si-Wj)}else{Dk=Ck}Wj=+h[Qe>>3];if(Wj!=0.0?(_i=c[Re>>2]|0,(Ti|0)<(_i|0)):0){Ek=Dk+Wj*+(_i-Ti|0)}else{Ek=Dk}Wj=+h[Se>>3];if(Wj!=0.0?(_i=c[Re>>2]|0,(Ti|0)>(_i|0)):0){Fk=Ek+Wj*+(Ti-_i|0)}else{Fk=Ek}Wj=+h[Te>>3];if(Wj!=0.0){Gk=Fk+Li*Wj}else{Gk=Fk}Wj=+h[Ge>>3];if(Wj!=0.0?(c[Ee>>2]|0)==0:0){if(!(Wj>=0.0)){fb=844;break i}if(!(Vj>=0.0)){fb=848;break i}Hk=Gk+Vj*Wj}else{Hk=Gk}Wj=+h[Ue>>3];if(Wj!=0.0?(c[Ee>>2]|0)==1:0){if(!(Wj>=0.0)){fb=855;break i}if(!(Vj>=0.0)){fb=859;break i}fi=Oi- +h[Ve>>3];if(!(fi<=Vj)){Ik=Hk}else{Ik=Hk+Wj*(Vj-(fi+-1.0))}if(fi>Vj){Jk=Ik+Wj*(1.0/(fi+1.0-Vj))}else{Jk=Ik}}else{Jk=Hk}if(!(Jk>=0.0)){fb=867;break i}u=0;_i=oa(68,104)|0;lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Kk=Wn(c[lj>>2]|0,j)|0;if((Kk|0)==0){Oa(lj|0,v|0)}J=v}else{Kk=-1}if((Kk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((_i|0)==0){fb=872;break i}h[_i>>3]=Jk;h[_i+8>>3]=Pi;h[_i+16>>3]=Si;h[_i+24>>3]=Ri;h[_i+32>>3]=Qi;h[_i+40>>3]=Ej;h[_i+48>>3]=Uj;h[_i+56>>3]=Vj;h[_i+64>>3]=Li;c[_i+72>>2]=ji;c[_i+76>>2]=pi;c[_i+80>>2]=ok;a[_i+84|0]=Xi;lj=_i+85|0;a[lj+0|0]=a[t+0|0]|0;a[lj+1|0]=a[t+1|0]|0;a[lj+2|0]=a[t+2|0]|0;c[_i+88>>2]=Ti;c[_i+92>>2]=dj;c[_i+96>>2]=Qj;c[_i+100>>2]=0;lj=c[ni+4>>2]|0;s:do{if((lj|0)!=0){$i=lj+ -1|0;bj=($i&lj|0)==0;if(bj){Lk=$i&kh}else{Lk=(kh>>>0)%(lj>>>0)|0}ej=c[(c[ni>>2]|0)+(Lk<<2)>>2]|0;if((ej|0)!=0){ki=ej;while(1){ej=c[ki>>2]|0;if((ej|0)==0){fb=885;break s}fj=c[ej+4>>2]|0;if(bj){Mk=fj&$i}else{Mk=(fj>>>0)%(lj>>>0)|0}if((Mk|0)!=(Lk|0)){fb=885;break s}if((c[ej+8>>2]|0)==(kh|0)){Nk=ej;break}else{ki=ej}}}else{fb=885}}else{fb=885}}while(0);if((fb|0)==885){fb=0;u=0;lj=oa(68,16)|0;cj=u;u=0;if((cj|0)!=0&(v|0)!=0){Ok=Wn(c[cj>>2]|0,j)|0;if((Ok|0)==0){Oa(cj|0,v|0)}J=v}else{Ok=-1}if((Ok|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[lj+8>>2]=kh;c[lj+12>>2]=0;u=0;Ea(3,p|0,ni|0,lj|0);lj=u;u=0;if((lj|0)!=0&(v|0)!=0){Pk=Wn(c[lj>>2]|0,j)|0;if((Pk|0)==0){Oa(lj|0,v|0)}J=v}else{Pk=-1}if((Pk|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}Nk=c[p>>2]|0}c[Nk+12>>2]=_i;if(!(Jk+1.0e-6<dh)){if(!(Jk>dh+1.0e-6)){lj=c[gi>>2]|0;cj=c[ch+56>>2]|0;if((lj|0)<=(cj|0)){if((lj|0)>=(cj|0)){cj=c[hi>>2]|0;lj=c[bh+56>>2]|0;if((cj|0)>=(lj|0)){if((cj|0)<=(lj|0)){lj=a[li+(kh<<7)+112|0]|0;cj=a[ch+112|0]|0;if(!(lj<<24>>24<cj<<24>>24)){if(!(lj<<24>>24>cj<<24>>24)?(a[mi+(Mf<<7)+112|0]|0)<(a[bh+112|0]|0):0){fb=897}else{Qk=eh;Rk=dh;Sk=ch;Tk=bh;Uk=ah;Vk=qg;Wk=kg;Xk=pg;Yk=lg;Zk=mg;_k=$g;$k=_g;al=Zg;bl=Yg;cl=Xg;dl=Wg;el=Vg;fl=Ug;gl=hh;hl=ih}}else{fb=897}}else{Qk=eh;Rk=dh;Sk=ch;Tk=bh;Uk=ah;Vk=qg;Wk=kg;Xk=pg;Yk=lg;Zk=mg;_k=$g;$k=_g;al=Zg;bl=Yg;cl=Xg;dl=Wg;el=Vg;fl=Ug;gl=hh;hl=ih}}else{fb=897}}else{Qk=eh;Rk=dh;Sk=ch;Tk=bh;Uk=ah;Vk=qg;Wk=kg;Xk=pg;Yk=lg;Zk=mg;_k=$g;$k=_g;al=Zg;bl=Yg;cl=Xg;dl=Wg;el=Vg;fl=Ug;gl=hh;hl=ih}}else{fb=897}}else{Qk=eh;Rk=dh;Sk=ch;Tk=bh;Uk=ah;Vk=qg;Wk=kg;Xk=pg;Yk=lg;Zk=mg;_k=$g;$k=_g;al=Zg;bl=Yg;cl=Xg;dl=Wg;el=Vg;fl=Ug;gl=hh;hl=ih}}else{fb=897}if((fb|0)==897){fb=0;a[w+0|0]=a[t+0|0]|0;a[w+1|0]=a[t+1|0]|0;a[w+2|0]=a[t+2|0]|0;Qk=kh;Rk=Jk;Sk=ji;Tk=pi;Uk=ok;Vk=Xi;Wk=Ti;Xk=dj;Yk=Qj;Zk=0;_k=Pi;$k=Si;al=Ri;bl=Qi;cl=Ej;dl=Uj;el=Vj;fl=Li;gl=ni;hl=_i}if(Rk==0.0){Jh=Qk;Kh=Rk;Lh=Sk;Mh=Tk;Nh=Uk;Oh=Vk;Ph=Wk;Qh=Xk;Rh=Yk;Sh=Zk;Th=_k;Uh=$k;Vh=al;Wh=bl;Xh=cl;Yh=dl;Zh=el;_h=fl;$h=gl;ai=hl;bi=di;break k}else{nh=Qk;oh=Rk;ph=Sk;qh=Tk;rh=Uk;sh=Vk;th=Wk;uh=Xk;vh=Yk;wh=Zk;xh=_k;yh=$k;zh=al;Ah=bl;Bh=cl;Ch=dl;Dh=el;Eh=fl;Fh=gl;Gh=hl;Hh=ni;Ih=di;break l}}}while(0);Ti=c[ni+4>>2]|0;t:do{if((Ti|0)!=0){pi=Ti+ -1|0;ji=(pi&Ti|0)==0;if(ji){il=pi&kh}else{il=(kh>>>0)%(Ti>>>0)|0}hi=c[(c[ni>>2]|0)+(il<<2)>>2]|0;if((hi|0)!=0){gi=hi;while(1){hi=c[gi>>2]|0;if((hi|0)==0){fb=910;break t}Wi=c[hi+4>>2]|0;if(ji){jl=Wi&pi}else{jl=(Wi>>>0)%(Ti>>>0)|0}if((jl|0)!=(il|0)){fb=910;break t}if((c[hi+8>>2]|0)==(kh|0)){kl=hi;break}else{gi=hi}}}else{fb=910}}else{fb=910}}while(0);if((fb|0)==910){fb=0;u=0;Ti=oa(68,16)|0;gi=u;u=0;if((gi|0)!=0&(v|0)!=0){ll=Wn(c[gi>>2]|0,j)|0;if((ll|0)==0){Oa(gi|0,v|0)}J=v}else{ll=-1}if((ll|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[Ti+8>>2]=kh;c[Ti+12>>2]=0;u=0;Ea(3,q|0,ni|0,Ti|0);Ti=u;u=0;if((Ti|0)!=0&(v|0)!=0){ml=Wn(c[Ti>>2]|0,j)|0;if((ml|0)==0){Oa(Ti|0,v|0)}J=v}else{ml=-1}if((ml|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}kl=c[q>>2]|0}c[kl+12>>2]=0;nh=eh;oh=dh;ph=ch;qh=bh;rh=ah;sh=qg;th=kg;uh=pg;vh=lg;wh=mg;xh=$g;yh=_g;zh=Zg;Ah=Yg;Bh=Xg;Ch=Wg;Dh=Vg;Eh=Ug;Fh=hh;Gh=ih;Hh=ni;Ih=di}}while(0);mh=kh+1|0;if((mh|0)>=(c[ea>>2]|0)){Jh=nh;Kh=oh;Lh=ph;Mh=qh;Nh=rh;Oh=sh;Ph=th;Qh=uh;Rh=vh;Sh=wh;Th=xh;Uh=yh;Vh=zh;Wh=Ah;Xh=Bh;Yh=Ch;Zh=Dh;_h=Eh;$h=Fh;ai=Gh;bi=Ih;break k}Ti=c[ia>>2]|0;Ug=Eh;Vg=Dh;Wg=Ch;Xg=Bh;Yg=Ah;Zg=zh;_g=yh;$g=xh;mg=wh;lg=vh;pg=uh;kg=th;qg=sh;ah=rh;bh=qh;ch=ph;dh=oh;eh=nh;fh=Ti;gh=c[Ti+(Mf<<7)+116>>2]|0;hh=Fh;ih=Gh;jh=Hh;kh=mh;lh=Ih}if((jh|0)==0){Jh=eh;Kh=dh;Lh=ch;Mh=bh;Nh=ah;Oh=qg;Ph=kg;Qh=pg;Rh=lg;Sh=mg;Th=$g;Uh=_g;Vh=Zg;Wh=Yg;Xh=Xg;Yh=Wg;Zh=Vg;_h=Ug;$h=hh;ai=ih;bi=lh}else{kh=jh+8|0;gh=c[kh>>2]|0;if((gh|0)!=0){fh=gh;while(1){gh=c[fh+12>>2]|0;if((gh|0)!=0){u=0;ma(115,gh|0);gh=u;u=0;if((gh|0)!=0&(v|0)!=0){nl=Wn(c[gh>>2]|0,j)|0;if((nl|0)==0){Oa(gh|0,v|0)}J=v}else{nl=-1}if((nl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}fh=c[fh>>2]|0;if((fh|0)==0){break}}fh=c[kh>>2]|0;gh=(jh|0)==(hh|0)?0:hh;if((fh|0)==0){ol=gh}else{mh=fh;while(1){fh=c[mh>>2]|0;u=0;ma(115,mh|0);Ti=u;u=0;if((Ti|0)!=0&(v|0)!=0){pl=Wn(c[Ti>>2]|0,j)|0;if((pl|0)==0){Oa(Ti|0,v|0)}J=v}else{pl=-1}if((pl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((fh|0)==0){ol=gh;break}else{mh=fh}}}}else{ol=(jh|0)==(hh|0)?0:hh}mh=c[jh>>2]|0;c[jh>>2]=0;if((mh|0)!=0){u=0;ma(115,mh|0);mh=u;u=0;if((mh|0)!=0&(v|0)!=0){ql=Wn(c[mh>>2]|0,j)|0;if((ql|0)==0){Oa(mh|0,v|0)}J=v}else{ql=-1}if((ql|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}u=0;ma(115,jh|0);mh=u;u=0;if((mh|0)!=0&(v|0)!=0){rl=Wn(c[mh>>2]|0,j)|0;if((rl|0)==0){Oa(mh|0,v|0)}J=v}else{rl=-1}if((rl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[(c[2888]|0)+(Mf<<2)>>2]=0;Jh=eh;Kh=dh;Lh=ch;Mh=bh;Nh=ah;Oh=qg;Ph=kg;Qh=pg;Rh=lg;Sh=mg;Th=$g;Uh=_g;Vh=Zg;Wh=Yg;Xh=Xg;Yh=Wg;Zh=Vg;_h=Ug;$h=ol;ai=ih;bi=lh}}else{Jh=Jf;Kh=If;Lh=Hf;Mh=Gf;Nh=Ff;Oh=Ef;Ph=Df;Qh=Cf;Rh=Bf;Sh=Af;Th=zf;Uh=yf;Vh=xf;Wh=wf;Xh=vf;Yh=uf;Zh=tf;_h=sf;$h=Kf;ai=Lf;bi=Nf}}while(0);if(Kh==0.0){ug=Jh;vg=Kh;wg=Lh;xg=Mh;yg=Nh;zg=Oh;Ag=Ph;Bg=Qh;Cg=Rh;Dg=Sh;Eg=Th;Fg=Uh;Gg=Vh;Hg=Wh;Ig=Xh;Jg=Yh;Kg=Zh;Lg=_h;Mg=$h;Ng=ai;Og=bi;break j}else{Rf=Jh;Sf=Kh;Tf=Lh;Uf=Mh;Vf=Nh;Wf=Oh;Xf=Ph;Yf=Qh;Zf=Rh;_f=Sh;$f=Th;ag=Uh;bg=Vh;cg=Wh;dg=Xh;eg=Yh;fg=Zh;gg=_h;hg=$h;ig=ai;jg=bi}}}while(0);Of=Mf+1|0;if((Of|0)<(c[da>>2]|0)){sf=gg;tf=fg;uf=eg;vf=dg;wf=cg;xf=bg;yf=ag;zf=$f;Af=_f;Bf=Zf;Cf=Yf;Df=Xf;Ef=Wf;Ff=Vf;Gf=Uf;Hf=Tf;If=Sf;Jf=Rf;Kf=hg;Lf=ig;Mf=Of;Nf=jg}else{ug=Rf;vg=Sf;wg=Tf;xg=Uf;yg=Vf;zg=Wf;Ag=Xf;Bg=Yf;Cg=Zf;Dg=_f;Eg=$f;Fg=ag;Gg=bg;Hg=cg;Ig=dg;Jg=eg;Kg=fg;Lg=gg;Mg=hg;Ng=ig;Og=jg;break}}if(vg==1.7976931348623157e+308){fb=919;break}Of=c[Ia>>2]|0;do{if((Of|0)==0){c[Ia>>2]=5;u=0;Qf=oa(64,520)|0;Pf=u;u=0;if((Pf|0)!=0&(v|0)!=0){sl=Wn(c[Pf>>2]|0,j)|0;if((sl|0)==0){Oa(Pf|0,v|0)}J=v}else{sl=-1}if((sl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Qf|0)==0){fb=927;break i}c[Na>>2]=Qf;tl=Qf}else{if((Of|0)!=(c[I>>2]|0)){tl=c[Na>>2]|0;break}c[Ia>>2]=Of<<1;u=0;Qf=za(19,c[Na>>2]|0,Of*208|0)|0;Pf=u;u=0;if((Pf|0)!=0&(v|0)!=0){ul=Wn(c[Pf>>2]|0,j)|0;if((ul|0)==0){Oa(Pf|0,v|0)}J=v}else{ul=-1}if((ul|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}if((Qf|0)==0){fb=934;break i}c[Na>>2]=Qf;tl=Qf}}while(0);Of=c[I>>2]|0;Qf=tl+(Of*104|0)|0;h[Qf>>3]=vg;h[tl+(Of*104|0)+8>>3]=Eg;h[tl+(Of*104|0)+16>>3]=Fg;h[tl+(Of*104|0)+24>>3]=Gg;h[tl+(Of*104|0)+32>>3]=Hg;h[tl+(Of*104|0)+40>>3]=Ig;h[tl+(Of*104|0)+48>>3]=Jg;h[tl+(Of*104|0)+56>>3]=Kg;h[tl+(Of*104|0)+64>>3]=Lg;c[tl+(Of*104|0)+72>>2]=wg;c[tl+(Of*104|0)+76>>2]=xg;Pf=tl+(Of*104|0)+80|0;c[Pf>>2]=yg;a[tl+(Of*104|0)+84|0]=zg;mh=Qf+85|0;a[mh+0|0]=a[w+0|0]|0;a[mh+1|0]=a[w+1|0]|0;a[mh+2|0]=a[w+2|0]|0;c[tl+(Of*104|0)+88>>2]=Ag;c[tl+(Of*104|0)+92>>2]=Bg;c[tl+(Of*104|0)+96>>2]=Cg;c[Pf+20>>2]=Dg;c[I>>2]=(c[I>>2]|0)+1;if((Ng|0)!=0){u=0;ma(115,Ng|0);Pf=u;u=0;if((Pf|0)!=0&(v|0)!=0){vl=Wn(c[Pf>>2]|0,j)|0;if((vl|0)==0){Oa(Pf|0,v|0)}J=v}else{vl=-1}if((vl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}}Pf=c[Mg+4>>2]|0;u:do{if((Pf|0)!=0){Of=Pf+ -1|0;mh=(Of&Pf|0)==0;if(mh){wl=Of&ug}else{wl=(ug>>>0)%(Pf>>>0)|0}Qf=c[(c[Mg>>2]|0)+(wl<<2)>>2]|0;if((Qf|0)!=0){gh=Qf;while(1){Qf=c[gh>>2]|0;if((Qf|0)==0){fb=951;break u}kh=c[Qf+4>>2]|0;if(mh){xl=kh&Of}else{xl=(kh>>>0)%(Pf>>>0)|0}if((xl|0)!=(wl|0)){fb=951;break u}if((c[Qf+8>>2]|0)==(ug|0)){yl=Qf;break}else{gh=Qf}}}else{fb=951}}else{fb=951}}while(0);if((fb|0)==951){fb=0;u=0;Pf=oa(68,16)|0;gh=u;u=0;if((gh|0)!=0&(v|0)!=0){zl=Wn(c[gh>>2]|0,j)|0;if((zl|0)==0){Oa(gh|0,v|0)}J=v}else{zl=-1}if((zl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}c[Pf+8>>2]=ug;c[Pf+12>>2]=0;u=0;Ea(3,s|0,Mg|0,Pf|0);Pf=u;u=0;if((Pf|0)!=0&(v|0)!=0){Al=Wn(c[Pf>>2]|0,j)|0;if((Al|0)==0){Oa(Pf|0,v|0)}J=v}else{Al=-1}if((Al|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue a}yl=c[s>>2]|0}c[yl+12>>2]=0;Pf=c[da>>2]|0;if((Pf|0)>0){gh=xg+56|0;Of=xg+112|0;mh=Pf;Pf=0;while(1){Qf=c[ia>>2]|0;kh=c[M>>2]|0;do{if((kh|0)==-1){Bl=mh}else{fh=c[gh>>2]|0;Ti=a[Of]|0;gi=c[Qf+(Pf<<7)+56>>2]|0;pi=a[Qf+(Pf<<7)+112|0]|0;ji=fh-(Ti<<24>>24)-gi+(pi<<24>>24)|0;if(!((((ji|0)>-1?ji:0-ji|0)|0)<(kh|0)&(kh|0)!=0)){if(!(Ti<<24>>24==pi<<24>>24)){Bl=mh;break}if(!((fh|0)==(gi|0)&(kh|0)==0)){Bl=mh;break}}a[Qf+(Pf<<7)+115|0]=1;Bl=c[da>>2]|0}}while(0);Pf=Pf+1|0;if((Pf|0)>=(Bl|0)){break}else{mh=Bl}}}mh=c[ea>>2]|0;if((mh|0)>0){Pf=wg+56|0;Of=wg+112|0;gh=mh;mh=0;while(1){Qf=c[ka>>2]|0;kh=c[P>>2]|0;do{if((kh|0)==-1){Cl=gh}else{gi=c[Pf>>2]|0;fh=a[Of]|0;pi=c[Qf+(mh<<7)+56>>2]|0;Ti=a[Qf+(mh<<7)+112|0]|0;ji=(fh<<24>>24)+gi-pi-(Ti<<24>>24)|0;if(!((((ji|0)>-1?ji:0-ji|0)|0)<(kh|0)&(kh|0)!=0)){if(!(fh<<24>>24==Ti<<24>>24)){Cl=gh;break}if(!((gi|0)==(pi|0)&(kh|0)==0)){Cl=gh;break}}a[Qf+(mh<<7)+115|0]=1;Cl=c[ea>>2]|0}}while(0);mh=mh+1|0;if((mh|0)>=(Cl|0)){break}else{gh=Cl}}}if((c[N>>2]|0)==(c[I>>2]|0)){fb=971;break i}else{of=Mg;pf=Ng;qf=Og}}if((fb|0)==402){fb=0;Dl=rf;El=kf+1|0;Fl=of;Gl=pf;Hl=qf}else if((fb|0)==919){fb=0;nf=c[da>>2]|0;mf=kf+1|0;if((nf|0)>0){W=c[2890]|0;gh=0;while(1){c[W+(gh<<2)>>2]=-1;mh=gh+1|0;Of=c[da>>2]|0;if((mh|0)<(Of|0)){gh=mh}else{Dl=Of;El=mf;Fl=Mg;Gl=Ng;Hl=Og;break}}}else{Dl=nf;El=mf;Fl=Mg;Gl=Ng;Hl=Og}}if((El|0)<(c[gf>>2]|0)){hf=Fl;jf=Gl;kf=El;lf=Hl}else{Il=Dl;break}}if((fb|0)==512){fb=0;u=0;na(40,232,1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Jl=Wn(c[lf>>2]|0,j)|0;if((Jl|0)==0){Oa(lf|0,v|0)}J=v}else{Jl=-1}if((Jl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=513;break}}else if((fb|0)==548){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=3970;c[f+12>>2]=11736;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Kl=Wn(c[lf>>2]|0,j)|0;if((Kl|0)==0){Oa(lf|0,v|0)}J=v}else{Kl=-1}if((Kl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Ll=Wn(c[lf>>2]|0,j)|0;if((Ll|0)==0){Oa(lf|0,v|0)}J=v}else{Ll=-1}if((Ll|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=550;break}}else if((fb|0)==553){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=3979;c[f+12>>2]=11792;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Ml=Wn(c[lf>>2]|0,j)|0;if((Ml|0)==0){Oa(lf|0,v|0)}J=v}else{Ml=-1}if((Ml|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Nl=Wn(c[lf>>2]|0,j)|0;if((Nl|0)==0){Oa(lf|0,v|0)}J=v}else{Nl=-1}if((Nl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=555;break}}else if((fb|0)==590){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4614;c[f+12>>2]=11432;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Ol=Wn(c[lf>>2]|0,j)|0;if((Ol|0)==0){Oa(lf|0,v|0)}J=v}else{Ol=-1}if((Ol|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Pl=Wn(c[lf>>2]|0,j)|0;if((Pl|0)==0){Oa(lf|0,v|0)}J=v}else{Pl=-1}if((Pl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=592;break}}else if((fb|0)==614){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4614;c[f+12>>2]=11432;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Ql=Wn(c[lf>>2]|0,j)|0;if((Ql|0)==0){Oa(lf|0,v|0)}J=v}else{Ql=-1}if((Ql|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Rl=Wn(c[lf>>2]|0,j)|0;if((Rl|0)==0){Oa(lf|0,v|0)}J=v}else{Rl=-1}if((Rl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=616;break}}else if((fb|0)==692){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4224;c[f+12>>2]=11832;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Sl=Wn(c[lf>>2]|0,j)|0;if((Sl|0)==0){Oa(lf|0,v|0)}J=v}else{Sl=-1}if((Sl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Tl=Wn(c[lf>>2]|0,j)|0;if((Tl|0)==0){Oa(lf|0,v|0)}J=v}else{Tl=-1}if((Tl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=694;break}}else if((fb|0)==696){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4225;c[f+12>>2]=11896;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Ul=Wn(c[lf>>2]|0,j)|0;if((Ul|0)==0){Oa(lf|0,v|0)}J=v}else{Ul=-1}if((Ul|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Vl=Wn(c[lf>>2]|0,j)|0;if((Vl|0)==0){Oa(lf|0,v|0)}J=v}else{Vl=-1}if((Vl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=698;break}}else if((fb|0)==700){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4226;c[f+12>>2]=11960;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Wl=Wn(c[lf>>2]|0,j)|0;if((Wl|0)==0){Oa(lf|0,v|0)}J=v}else{Wl=-1}if((Wl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Xl=Wn(c[lf>>2]|0,j)|0;if((Xl|0)==0){Oa(lf|0,v|0)}J=v}else{Xl=-1}if((Xl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=702;break}}else if((fb|0)==704){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4227;c[f+12>>2]=12024;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Yl=Wn(c[lf>>2]|0,j)|0;if((Yl|0)==0){Oa(lf|0,v|0)}J=v}else{Yl=-1}if((Yl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){Zl=Wn(c[lf>>2]|0,j)|0;if((Zl|0)==0){Oa(lf|0,v|0)}J=v}else{Zl=-1}if((Zl|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=706;break}}else if((fb|0)==714){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4245;c[f+12>>2]=11832;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){_l=Wn(c[lf>>2]|0,j)|0;if((_l|0)==0){Oa(lf|0,v|0)}J=v}else{_l=-1}if((_l|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){$l=Wn(c[lf>>2]|0,j)|0;if(($l|0)==0){Oa(lf|0,v|0)}J=v}else{$l=-1}if(($l|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=716;break}}else if((fb|0)==718){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4246;c[f+12>>2]=11896;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){am=Wn(c[lf>>2]|0,j)|0;if((am|0)==0){Oa(lf|0,v|0)}J=v}else{am=-1}if((am|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){bm=Wn(c[lf>>2]|0,j)|0;if((bm|0)==0){Oa(lf|0,v|0)}J=v}else{bm=-1}if((bm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=720;break}}else if((fb|0)==722){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4247;c[f+12>>2]=11960;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){cm=Wn(c[lf>>2]|0,j)|0;if((cm|0)==0){Oa(lf|0,v|0)}J=v}else{cm=-1}if((cm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){dm=Wn(c[lf>>2]|0,j)|0;if((dm|0)==0){Oa(lf|0,v|0)}J=v}else{dm=-1}if((dm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=724;break}}else if((fb|0)==726){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4248;c[f+12>>2]=12024;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){em=Wn(c[lf>>2]|0,j)|0;if((em|0)==0){Oa(lf|0,v|0)}J=v}else{em=-1}if((em|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){fm=Wn(c[lf>>2]|0,j)|0;if((fm|0)==0){Oa(lf|0,v|0)}J=v}else{fm=-1}if((fm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=728;break}}else if((fb|0)==765){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4614;c[f+12>>2]=11432;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){gm=Wn(c[lf>>2]|0,j)|0;if((gm|0)==0){Oa(lf|0,v|0)}J=v}else{gm=-1}if((gm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){hm=Wn(c[lf>>2]|0,j)|0;if((hm|0)==0){Oa(lf|0,v|0)}J=v}else{hm=-1}if((hm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=767;break}}else if((fb|0)==824){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4389;c[f+12>>2]=10968;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){im=Wn(c[lf>>2]|0,j)|0;if((im|0)==0){Oa(lf|0,v|0)}J=v}else{im=-1}if((im|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){jm=Wn(c[lf>>2]|0,j)|0;if((jm|0)==0){Oa(lf|0,v|0)}J=v}else{jm=-1}if((jm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=826;break}}else if((fb|0)==844){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4415;c[f+12>>2]=11568;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){km=Wn(c[lf>>2]|0,j)|0;if((km|0)==0){Oa(lf|0,v|0)}J=v}else{km=-1}if((km|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){lm=Wn(c[lf>>2]|0,j)|0;if((lm|0)==0){Oa(lf|0,v|0)}J=v}else{lm=-1}if((lm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=846;break}}else if((fb|0)==848){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4416;c[f+12>>2]=11616;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){mm=Wn(c[lf>>2]|0,j)|0;if((mm|0)==0){Oa(lf|0,v|0)}J=v}else{mm=-1}if((mm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){nm=Wn(c[lf>>2]|0,j)|0;if((nm|0)==0){Oa(lf|0,v|0)}J=v}else{nm=-1}if((nm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=850;break}}else if((fb|0)==855){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4420;c[f+12>>2]=11648;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){om=Wn(c[lf>>2]|0,j)|0;if((om|0)==0){Oa(lf|0,v|0)}J=v}else{om=-1}if((om|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){pm=Wn(c[lf>>2]|0,j)|0;if((pm|0)==0){Oa(lf|0,v|0)}J=v}else{pm=-1}if((pm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=857;break}}else if((fb|0)==859){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4421;c[f+12>>2]=11616;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){qm=Wn(c[lf>>2]|0,j)|0;if((qm|0)==0){Oa(lf|0,v|0)}J=v}else{qm=-1}if((qm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){rm=Wn(c[lf>>2]|0,j)|0;if((rm|0)==0){Oa(lf|0,v|0)}J=v}else{rm=-1}if((rm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=861;break}}else if((fb|0)==867){fb=0;u=0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4429;c[f+12>>2]=11704;ra(23,Ka|0,16,f|0)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){sm=Wn(c[lf>>2]|0,j)|0;if((sm|0)==0){Oa(lf|0,v|0)}J=v}else{sm=-1}if((sm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;Fa(1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){tm=Wn(c[lf>>2]|0,j)|0;if((tm|0)==0){Oa(lf|0,v|0)}J=v}else{tm=-1}if((tm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=869;break}}else if((fb|0)==872){fb=0;u=0;na(40,232,1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){um=Wn(c[lf>>2]|0,j)|0;if((um|0)==0){Oa(lf|0,v|0)}J=v}else{um=-1}if((um|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=873;break}}else if((fb|0)==927){fb=0;u=0;na(40,232,1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){vm=Wn(c[lf>>2]|0,j)|0;if((vm|0)==0){Oa(lf|0,v|0)}J=v}else{vm=-1}if((vm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=928;break}}else if((fb|0)==934){fb=0;u=0;na(40,232,1);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){wm=Wn(c[lf>>2]|0,j)|0;if((wm|0)==0){Oa(lf|0,v|0)}J=v}else{wm=-1}if((wm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}else{fb=935;break}}else if((fb|0)==971){fb=0;Il=c[da>>2]|0}u=0;ma(113,Il|0);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){xm=Wn(c[lf>>2]|0,j)|0;if((xm|0)==0){Oa(lf|0,v|0)}J=v}else{xm=-1}if((xm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}}if((c[Z>>2]|0)==0){H=la;fb=978;break}u=0;oa(65,12112)|0;lf=u;u=0;if((lf|0)!=0&(v|0)!=0){ym=Wn(c[lf>>2]|0,j)|0;if((ym|0)==0){Oa(lf|0,v|0)}J=v}else{ym=-1}if((ym|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb;continue}u=0;na(39,b|0,d|0);lf=u;u=0;if((lf|0)!=0&(v|0)!=0){zm=Wn(c[lf>>2]|0,j)|0;if((zm|0)==0){Oa(lf|0,v|0)}J=v}else{zm=-1}if((zm|0)==1){Ra=la;Sa=ka;Ta=ja;Ua=ia;Va=ha;Wa=ga;Xa=ea;Ya=da;Za=ca;_a=ba;$a=aa;ab=$;bb=_;cb=Z;db=Y;eb=X;sa=J;la=Ra;ka=Sa;ja=Ta;ia=Ua;ha=Va;ga=Wa;ea=Xa;da=Ya;ca=Za;ba=_a;aa=$a;$=ab;_=bb;Z=cb;Y=db;X=eb}else{fb=977;break}}if((fb|0)!=37)if((fb|0)==40){H=la;i=e;return H|0}else if((fb|0)==42){H=0;i=e;return H|0}else if((fb|0)!=55)if((fb|0)!=65)if((fb|0)!=91)if((fb|0)!=97)if((fb|0)!=101)if((fb|0)!=111)if((fb|0)!=122)if((fb|0)!=128)if((fb|0)!=135)if((fb|0)!=159)if((fb|0)!=178)if((fb|0)!=184)if((fb|0)!=192)if((fb|0)!=251)if((fb|0)!=267)if((fb|0)!=287)if((fb|0)!=293)if((fb|0)!=309)if((fb|0)!=327)if((fb|0)==370){c[E+364>>2]=1;c[E+360>>2]=1;H=la;i=e;return H|0}else if((fb|0)!=396)if((fb|0)!=513)if((fb|0)!=550)if((fb|0)!=555)if((fb|0)!=592)if((fb|0)!=616)if((fb|0)!=694)if((fb|0)!=698)if((fb|0)!=702)if((fb|0)!=706)if((fb|0)!=716)if((fb|0)!=720)if((fb|0)!=724)if((fb|0)!=728)if((fb|0)!=767)if((fb|0)!=826)if((fb|0)!=846)if((fb|0)!=850)if((fb|0)!=857)if((fb|0)!=861)if((fb|0)!=869)if((fb|0)!=873)if((fb|0)!=928)if((fb|0)!=935)if((fb|0)==977){H=la;i=e;return H|0}else if((fb|0)==978){i=e;return H|0}return 0}



function rd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0;d=i;i=i+16|0;e=d;if((a|0)!=0){Ya(12648)|0;Ya(12280)|0;c[e>>2]=c[a>>2];sb(808,e|0)|0;c[e>>2]=c[a+4>>2];sb(832,e|0)|0;c[e>>2]=c[a+8>>2];sb(856,e|0)|0;c[e>>2]=c[a+12>>2];sb(880,e|0)|0;c[e>>2]=c[a+16>>2];sb(912,e|0)|0;c[e>>2]=c[a+20>>2];sb(928,e|0)|0;c[e>>2]=c[a+24>>2];sb(952,e|0)|0;c[e>>2]=c[a+28>>2];sb(976,e|0)|0;c[e>>2]=c[a+32>>2];sb(1e3,e|0)|0;c[e>>2]=c[a+36>>2];sb(1024,e|0)|0;c[e>>2]=c[a+40>>2];sb(1064,e|0)|0;c[e>>2]=c[a+44>>2];sb(1088,e|0)|0;c[e>>2]=c[a+752>>2];sb(1112,e|0)|0;c[e>>2]=c[a+756>>2];sb(1136,e|0)|0;h[k>>3]=+h[a+760>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1160,e|0)|0;c[e>>2]=c[a+772>>2];sb(1184,e|0)|0;c[e>>2]=c[a+768>>2];sb(1200,e|0)|0;c[e>>2]=c[a+776>>2];sb(1224,e|0)|0;c[e>>2]=c[a+2504>>2];sb(1248,e|0)|0;c[e>>2]=c[a+2508>>2];sb(1288,e|0)|0;h[k>>3]=+h[a+800>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1328,e|0)|0;h[k>>3]=+h[a+808>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1352,e|0)|0;f=a+2416|0;c[e>>2]=c[f>>2];sb(1376,e|0)|0;Ya(12304)|0;if((c[f>>2]|0)>0){g=0;do{j=c[a+(g<<2)+1616>>2]|0;c[e>>2]=c[a+(g<<2)+816>>2];c[e+4>>2]=j;sb(1416,e|0)|0;g=g+1|0}while((g|0)<(c[f>>2]|0))}c[e>>2]=c[a+2420>>2];sb(1432,e|0)|0;h[k>>3]=+h[a+2424>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1456,e|0)|0;h[k>>3]=+h[a+2432>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1480,e|0)|0;h[k>>3]=+h[a+2440>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1504,e|0)|0;h[k>>3]=+h[a+2448>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1528,e|0)|0;h[k>>3]=+h[a+2456>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1568,e|0)|0;h[k>>3]=+h[a+2464>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1608,e|0)|0;h[k>>3]=+h[a+2472>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1632,e|0)|0;h[k>>3]=+h[a+2488>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1656,e|0)|0;h[k>>3]=+h[a+2480>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1680,e|0)|0;h[k>>3]=+h[a+2496>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1704,e|0)|0;c[e>>2]=c[a+2640>>2];sb(1728,e|0)|0;c[e>>2]=c[a+2644>>2];sb(1768,e|0)|0;c[e>>2]=c[a+2648>>2];sb(1808,e|0)|0;c[e>>2]=c[a+2652>>2];sb(1848,e|0)|0;c[e>>2]=c[a+2656>>2];sb(1888,e|0)|0;Ya(12328)|0;h[k>>3]=+h[a+2520>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1904,e|0)|0;h[k>>3]=+h[a+2528>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1928,e|0)|0;h[k>>3]=+h[a+2536>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1952,e|0)|0;h[k>>3]=+h[a+2544>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1968,e|0)|0;h[k>>3]=+h[a+2560>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1992,e|0)|0;h[k>>3]=+h[a+2552>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2016,e|0)|0;h[k>>3]=+h[a+2568>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2040,e|0)|0;h[k>>3]=+h[a+2584>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2064,e|0)|0;h[k>>3]=+h[a+2592>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2088,e|0)|0;h[k>>3]=+h[a+2600>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2112,e|0)|0;h[k>>3]=+h[a+2608>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2136,e|0)|0;h[k>>3]=+h[a+2616>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2160,e|0)|0;h[k>>3]=+h[a+2624>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2184,e|0)|0;h[k>>3]=+h[a+2632>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2216,e|0)|0;Ya(12352)|0;Ya(12376)|0;Ya(12648)|0;Ya(12384)|0;Ya(12408)|0;f=a+184|0;h[k>>3]=+h[f>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2248,e|0)|0;h[k>>3]=+h[f>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2248,e|0)|0;h[k>>3]=+h[a+192>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2264,e|0)|0;h[k>>3]=+h[a+104>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2280,e|0)|0;h[k>>3]=+h[a+112>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2304,e|0)|0;h[k>>3]=+h[a+56>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2328,e|0)|0;h[k>>3]=+h[a+72>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2344,e|0)|0;h[k>>3]=+h[a+64>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2360,e|0)|0;h[k>>3]=+h[a+80>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2384,e|0)|0;h[k>>3]=+h[a+120>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2408,e|0)|0;h[k>>3]=+h[a+160>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2424,e|0)|0;h[k>>3]=+h[a+136>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2440,e|0)|0;h[k>>3]=+h[a+128>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2456,e|0)|0;h[k>>3]=+h[a+168>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2472,e|0)|0;h[k>>3]=+h[a+88>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2488,e|0)|0;h[k>>3]=+h[a+152>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2504,e|0)|0;h[k>>3]=+h[a+96>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2520,e|0)|0;h[k>>3]=+h[a+144>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2544,e|0)|0;h[k>>3]=+h[a+200>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2560,e|0)|0;h[k>>3]=+h[a+208>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2584,e|0)|0;Ya(12432)|0;h[k>>3]=+h[a+216>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2616,e|0)|0;h[k>>3]=+h[a+224>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2632,e|0)|0;h[k>>3]=+h[a+232>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2648,e|0)|0;h[k>>3]=+h[a+240>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2664,e|0)|0;h[k>>3]=+h[a+248>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2688,e|0)|0;h[k>>3]=+h[a+256>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2704,e|0)|0;h[k>>3]=+h[a+272>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2720,e|0)|0;h[k>>3]=+h[a+280>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2744,e|0)|0;h[k>>3]=+h[a+288>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2760,e|0)|0;c[e>>2]=c[a+296>>2];sb(2776,e|0)|0;c[e>>2]=c[a+300>>2];sb(2800,e|0)|0;c[e>>2]=c[a+304>>2];sb(2816,e|0)|0;c[e>>2]=c[a+308>>2];sb(2832,e|0)|0;c[e>>2]=c[a+312>>2];sb(2848,e|0)|0;c[e>>2]=c[a+316>>2];sb(2864,e|0)|0;c[e>>2]=c[a+320>>2];sb(2888,e|0)|0;h[k>>3]=+h[a+328>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2904,e|0)|0;h[k>>3]=+h[a+336>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2928,e|0)|0;h[k>>3]=+h[a+344>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2952,e|0)|0;h[k>>3]=+h[a+352>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2976,e|0)|0;h[k>>3]=+h[a+360>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3e3,e|0)|0;h[k>>3]=+h[a+368>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3016,e|0)|0;h[k>>3]=+h[a+376>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3040,e|0)|0;h[k>>3]=+h[a+384>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3072,e|0)|0;Ya(12456)|0;Ya(12472)|0;Ya(12512)|0;h[k>>3]=+h[a+536>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3104,e|0)|0;h[k>>3]=+h[a+544>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3120,e|0)|0;h[k>>3]=+h[a+456>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3136,e|0)|0;h[k>>3]=+h[a+464>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3160,e|0)|0;h[k>>3]=+h[a+408>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1968,e|0)|0;h[k>>3]=+h[a+424>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(1992,e|0)|0;h[k>>3]=+h[a+416>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2016,e|0)|0;h[k>>3]=+h[a+432>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2040,e|0)|0;h[k>>3]=+h[a+472>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3184,e|0)|0;h[k>>3]=+h[a+512>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(2160,e|0)|0;h[k>>3]=+h[a+488>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3200,e|0)|0;h[k>>3]=+h[a+480>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3224,e|0)|0;h[k>>3]=+h[a+520>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3248,e|0)|0;h[k>>3]=+h[a+440>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3272,e|0)|0;h[k>>3]=+h[a+504>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3296,e|0)|0;h[k>>3]=+h[a+448>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3320,e|0)|0;h[k>>3]=+h[a+496>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3344,e|0)|0;Ya(12568)|0;h[k>>3]=+h[a+568>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3360,e|0)|0;h[k>>3]=+h[a+576>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3376,e|0)|0;h[k>>3]=+h[a+584>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3392,e|0)|0;h[k>>3]=+h[a+592>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3408,e|0)|0;h[k>>3]=+h[a+600>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3432,e|0)|0;h[k>>3]=+h[a+608>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3448,e|0)|0;h[k>>3]=+h[a+624>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3464,e|0)|0;h[k>>3]=+h[a+632>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3488,e|0)|0;h[k>>3]=+h[a+640>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3504,e|0)|0;c[e>>2]=c[a+648>>2];sb(3520,e|0)|0;c[e>>2]=c[a+652>>2];sb(3544,e|0)|0;c[e>>2]=c[a+656>>2];sb(3560,e|0)|0;c[e>>2]=c[a+660>>2];sb(3576,e|0)|0;c[e>>2]=c[a+664>>2];sb(3592,e|0)|0;c[e>>2]=c[a+668>>2];sb(3616,e|0)|0;c[e>>2]=c[a+672>>2];sb(3640,e|0)|0;h[k>>3]=+h[a+680>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3664,e|0)|0;h[k>>3]=+h[a+688>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3688,e|0)|0;h[k>>3]=+h[a+720>>3];c[e>>2]=c[k>>2];c[e+4>>2]=c[k+4>>2];sb(3712,e|0)|0;Ya(12600)|0;rb(10)|0;Ya(12632)|0;Ya(12648)|0;rb(10)|0}if((b|0)==0){i=d;return}Ya(12648)|0;Ya(12192)|0;a=b+8828|0;f=c[a>>2]|0;if((f|0)>0){c[e>>2]=f;sb(3736,e|0)|0;Ya(12240)|0;if((c[a>>2]|0)>0){f=0;do{c[e>>2]=c[b+(f<<2)+8028>>2];sb(3776,e|0)|0;f=f+1|0}while((f|0)<(c[a>>2]|0))}Ya(12272)|0}c[e>>2]=c[b+8832>>2];sb(3784,e|0)|0;c[e>>2]=c[b+8836>>2];sb(3800,e|0)|0;c[e>>2]=c[b+8840>>2];sb(3816,e|0)|0;c[e>>2]=c[b+8848>>2];sb(3840,e|0)|0;c[e>>2]=c[b+8852>>2];sb(3856,e|0)|0;c[e>>2]=c[b+8856>>2];sb(3888,e|0)|0;c[e>>2]=c[b+8860>>2];sb(3904,e|0)|0;c[e>>2]=c[b+8864>>2];sb(3928,e|0)|0;c[e>>2]=c[b+8868>>2];sb(3952,e|0)|0;c[e>>2]=c[b+8872>>2];sb(3976,e|0)|0;c[e>>2]=c[b+8876>>2];sb(4e3,e|0)|0;c[e>>2]=c[b+8880>>2];sb(4024,e|0)|0;c[e>>2]=c[b+8884>>2];sb(4048,e|0)|0;c[e>>2]=c[b+8888>>2];sb(4064,e|0)|0;c[e>>2]=c[b+8892>>2];sb(4088,e|0)|0;c[e>>2]=c[b+8896>>2];sb(4112,e|0)|0;c[e>>2]=c[b+8900>>2];sb(4136,e|0)|0;c[e>>2]=c[b+8904>>2];sb(4160,e|0)|0;c[e>>2]=c[b+8908>>2];sb(4184,e|0)|0;Ya(12216)|0;Ya(12648)|0;rb(10)|0;i=d;return}function sd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;vn(c[2890]|0);d=c[2888]|0;if((a|0)>0){e=d;f=0}else{g=d;vn(g);i=b;return}while(1){d=c[e+(f<<2)>>2]|0;if((d|0)!=0){h=d+8|0;j=c[h>>2]|0;if((j|0)!=0){k=j;do{j=c[k+12>>2]|0;if((j|0)!=0){Cn(j)}k=c[k>>2]|0}while((k|0)!=0);k=c[h>>2]|0;if((k|0)!=0){j=k;while(1){k=c[j>>2]|0;Cn(j);if((k|0)==0){break}else{j=k}}}}j=c[d>>2]|0;c[d>>2]=0;if((j|0)!=0){Cn(j)}Cn(d)}j=f+1|0;h=c[2888]|0;if((j|0)==(a|0)){g=h;break}else{e=h;f=j}}vn(g);i=b;return}function td(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0.0,M=0.0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0;j=i;i=i+16|0;k=j;l=d+8856|0;m=Un(c[l>>2]|0)|0;n=d+8848|0;o=c[n>>2]|0;if(!((o|0)==0|(o|0)==(m|0))){if((f|0)==0){o=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(o|0,16,k|0)|0;Wb()}if((zd(f,784,4248)|0)!=0){Oa(232,1)}}if(!(!((c[b+2640>>2]|0)<-1)?!((c[b+2644>>2]|0)<-1):0)){if((f|0)==0){o=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(o|0,16,k|0)|0;Wb()}if((zd(f,784,4280)|0)!=0){Oa(232,1)}}o=b+48|0;p=b+320|0;if(!((c[p>>2]|0)==0?(c[b+672>>2]|0)==0:0)){q=14}if((q|0)==14?(c[n>>2]|0)==0:0){if((f|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(f,784,4344)|0)!=0){Oa(232,1)}}if((c[b+20>>2]|0)<-1e6){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4376)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+376>>3]>32767.0?(c[b+2508>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4424)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+2448>>3]>32767.0?(c[b+2508>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4480)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+368>>3]>32767.0?(c[b+2504>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4544)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+720>>3]>32767.0?(c[b+2504>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4600)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+2464>>3]>32767.0?(c[b+2504>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4664)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+728>>3]>=0.0?(c[b+2508>>2]|0)==0:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4728)|0)!=0){Oa(232,1)}}if(+h[b+736>>3]>=0.0?(c[b+2508>>2]|0)==1:0){if((e|0)==0){s=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(s|0,16,k|0)|0;Wb()}if((zd(e,784,4784)|0)!=0){Oa(232,1)}}s=b+304|0;if((c[s>>2]|0)<1){if((e|0)==0){u=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(u|0,16,k|0)|0;Wb()}if((zd(e,784,4840)|0)!=0){Oa(232,1)}}u=b+308|0;v=c[u>>2]|0;if((v|0)>36){if((e|0)==0){w=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(w|0,16,k|0)|0;Wb()}if((zd(e,784,4872)|0)!=0){Oa(232,1)}if((yd(e,4920)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}w=c[b+300>>2]|0;if((w|0)>(v|0)){if((e|0)==0){x=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(x|0,16,k|0)|0;Wb()}if((zd(e,784,4928)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}x=c[s>>2]|0;if((w|0)<(x|0)){if((e|0)==0){w=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(w|0,16,k|0)|0;Wb()}if((zd(e,784,4976)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}w=b+660|0;y=c[w>>2]|0;if((y|0)>36){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,5024)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}z=c[b+652>>2]|0;if((z|0)>(y|0)){if((e|0)==0){A=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(A|0,16,k|0)|0;Wb()}if((zd(e,784,5080)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}A=b+656|0;if((z|0)<(c[A>>2]|0)){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,5128)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[b+772>>2]|0)>(x|0)){if((e|0)==0){x=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(x|0,16,k|0)|0;Wb()}if((zd(e,784,5176)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[b+768>>2]|0)>>>0>5){if((e|0)==0){x=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(x|0,16,k|0)|0;Wb()}if((zd(e,784,5216)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}x=c[b+2416>>2]|0;if((x|0)==0){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,5264)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}z=(x|0)>0;a:do{if(z){B=0;while(1){C=c[b+(B<<2)+816>>2]|0;D=B+1|0;if((C|0)>(c[b+(B<<2)+1616>>2]|0)|(C|0)<0){break}if((D|0)<(x|0)){B=D}else{q=120;break}}if((q|0)==120){if(z){E=0;F=2147483647}else{G=2147483647;break}while(1){B=c[b+(E<<2)+816>>2]|0;D=(B|0)<(F|0)?B:F;B=E+1|0;if((B|0)<(x|0)){E=B;F=D}else{G=D;break a}}}if((e|0)==0){D=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(D|0,16,k|0)|0;Wb()}if((zd(e,784,5312)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}else{G=2147483647}}while(0);if((v|0)>(G|0)){if((e|0)==0){v=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(v|0,16,k|0)|0;Wb()}if((zd(e,784,5360)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}v=b+12|0;if((c[v>>2]|0)==1&(y|0)>(G|0)){if((e|0)==0){y=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(y|0,16,k|0)|0;Wb()}if((zd(e,784,5408)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[b+28>>2]|0)<1){if((e|0)==0){y=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(y|0,16,k|0)|0;Wb()}if((zd(e,784,5472)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}y=b+392|0;F=c[y>>2]|0;if((F|0)!=0?(Un(F|0)|0)!=5:0){if((e|0)==0){F=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(F|0,16,k|0)|0;Wb()}if((zd(e,784,5496)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}F=b+396|0;E=c[F>>2]|0;if((E|0)!=0?(Un(E|0)|0)!=5:0){if((e|0)==0){E=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(E|0,16,k|0)|0;Wb()}if((zd(e,784,5552)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}E=b+744|0;x=c[E>>2]|0;if((x|0)!=0?(Un(x|0)|0)!=5:0){if((e|0)==0){x=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(x|0,16,k|0)|0;Wb()}if((zd(e,784,5608)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}x=b+748|0;z=c[x>>2]|0;if((z|0)!=0?(Un(z|0)|0)!=5:0){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,5672)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}z=d+8836|0;D=c[z>>2]|0;if((D|0)==2147483647){if((f|0)==0){B=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(B|0,16,k|0)|0;Wb()}if((zd(f,784,5736)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}B=d+8832|0;C=c[B>>2]|0;if((C|D|0)<0|(C+D|0)>(m|0)){if((f|0)==0){m=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(m|0,16,k|0)|0;Wb()}if((zd(f,784,5784)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}do{if(((D|0)<(G|0)?(c[b+4>>2]|0)==1:0)?(c[b+8>>2]|0)==1:0){m=c[b>>2]|0;if((m|0)==9){break}else if((m|0)==10){if((g|0)==0){m=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(m|0,16,k|0)|0;Wb()}if((zd(g,784,5832)|0)!=0){Oa(232,1)}}else{if((f|0)==0){m=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(m|0,16,k|0)|0;Wb()}if((zd(f,784,5832)|0)!=0){Oa(232,1)}}if((c[b>>2]|0)==5){t=1;i=j;return t|0}}}while(0);if(+h[b+760>>3]<0.0){if((f|0)==0){G=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(G|0,16,k|0)|0;Wb()}if((zd(f,784,5896)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}G=d+8840|0;D=c[G>>2]|0;do{if(!((D|0)<-999999)){if(+h[b+808>>3]==-1.0?+h[b+800>>3]==0.0:0){H=D}else{q=197}do{if((q|0)==197){if((f|0)==0){m=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(m|0,16,k|0)|0;Wb()}if((zd(f,784,5944)|0)!=0){Oa(232,1)}if((yd(f,6016)|0)==0){H=c[G>>2]|0;break}else{Oa(232,1)}}}while(0);if((H|0)>((c[B>>2]|0)+ -3+(c[z>>2]|0)|0)){if((f|0)==0){m=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(m|0,16,k|0)|0;Wb()}if((zd(f,784,6080)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((H|0)>-1){m=c[l>>2]|0;C=a[m+H|0]|0;if((C<<24>>24==97|C<<24>>24==65?(C=a[m+(H+1)|0]|0,C<<24>>24==116|C<<24>>24==84):0)?(C=a[m+(H+2)|0]|0,C<<24>>24==103|C<<24>>24==71):0){break}if((f|0)==0){C=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(C|0,16,k|0)|0;Wb()}if((zd(f,784,6144)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}}while(0);H=c[d+8844>>2]|0;b:do{if((H|0)==0){if(!(+h[b+168>>3]!=0.0)?!(+h[b+520>>3]!=0.0):0){break}if((f|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(f,784,6440)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}else{z=c[p>>2]|0;if((z|0)!=0){if((z|0)<(c[b+40>>2]|0)){if((e|0)==0){B=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(B|0,16,k|0)|0;Wb()}if((zd(e,784,6192)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((z|0)>(c[b+44>>2]|0)){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,6240)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}z=c[b+672>>2]|0;if((z|0)!=0){if((z|0)<(c[b+40>>2]|0)){if((e|0)==0){B=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(B|0,16,k|0)|0;Wb()}if((zd(e,784,6288)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((z|0)>(c[b+44>>2]|0)){if((e|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(e,784,6344)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}z=c[n>>2]|0;if((z|0)>0){B=c[b+40>>2]|0;G=b+44|0;D=0;while(1){C=c[H+(D<<2)>>2]|0;if((C|0)<(B|0)){break}D=D+1|0;if((C|0)>(c[G>>2]|0)){break}if((D|0)>=(z|0)){break b}}if((f|0)==0){z=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(z|0,16,k|0)|0;Wb()}if((zd(f,784,6400)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}}while(0);H=d+8868|0;n=c[H>>2]|0;p=a[n]|0;c:do{if(p<<24>>24==0){I=0}else{z=p;D=n;G=0;while(1){B=z<<24>>24;switch(B|0){case 65:case 97:{a[D]=65;J=G;break};case 67:case 99:{a[D]=67;J=G;break};case 71:case 103:{a[D]=71;J=G;break};case 84:case 116:{a[D]=84;J=G;break};case 78:case 110:{a[D]=78;J=G;break};default:{a[D]=78;J=(G|0)==0?B:G}}B=D+1|0;C=a[B]|0;if(C<<24>>24==0){I=J;break c}else{z=C;D=B;G=J}}}}while(0);do{if(!((I&255)<<24>>24==0)){if((c[b+24>>2]|0)!=0){if((g|0)==0){J=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(J|0,16,k|0)|0;Wb()}if((zd(g,784,6528)|0)==0){break}Oa(232,1)}if((f|0)==0){J=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(J|0,16,k|0)|0;Wb()}if((zd(f,784,6528)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}while(0);K=+h[b+216>>3];if(!(K<+h[b+224>>3])?!(K>+h[b+232>>3]):0){K=+h[b+568>>3];if(!(K<+h[b+576>>3])?!(K>+h[b+584>>3]):0){K=+h[b+256>>3];L=+h[b+248>>3];if(K>L|K>100.0|L<0.0){if((e|0)==0){I=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(I|0,16,k|0)|0;Wb()}if((zd(e,784,6704)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}L=+h[b+608>>3];K=+h[b+600>>3];if(L>K|L>100.0|K<0.0){if((e|0)==0){I=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(I|0,16,k|0)|0;Wb()}if((zd(e,784,6760)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[b+296>>2]|0)<0){if((e|0)==0){I=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(I|0,16,k|0)|0;Wb()}if((zd(e,784,6808)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[b+648>>2]|0)<0){if((e|0)==0){I=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(I|0,16,k|0)|0;Wb()}if((zd(e,784,6856)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}K=+h[b+328>>3];if(((!(K<0.0|K>32767.0)?(K=+h[b+336>>3],!(K<0.0|K>32767.0)):0)?(K=+h[b+2472>>3],!(K<0.0|K>32767.0)):0)?(K=+h[b+2488>>3],!(K<0.0|K>32767.0)):0){if((((!(+h[b+344>>3]<0.0)?!(+h[b+352>>3]<0.0):0)?!(+h[b+360>>3]<0.0):0)?!(+h[b+2480>>3]<0.0):0)?!(+h[b+2496>>3]<0.0):0){K=+h[b+680>>3];if(!(K<0.0|K>32767.0)?(K=+h[b+688>>3],!(K<0.0|K>32767.0)):0){if((!(+h[b+696>>3]<0.0)?!(+h[b+704>>3]<0.0):0)?!(+h[b+712>>3]<0.0):0){if(!(+h[b+264>>3]<=0.0)?!(+h[b+288>>3]<=0.0):0){I=b+280|0;K=+h[b+272>>3];if(!(+h[I>>3]<0.0&K!=0.0)?(J=b+272|0,!(K<0.0)):0){if(!(+h[b+616>>3]<=0.0)?!(+h[b+640>>3]<=0.0):0){K=+h[b+624>>3];if(+h[b+632>>3]<0.0&K!=0.0|K<0.0){if((e|0)==0){n=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(n|0,16,k|0)|0;Wb()}if((zd(e,784,7296)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}n=b+808|0;K=+h[n>>3];if(K==-1.0?+h[b+800>>3]==0.0:0){M=K}else{q=361}do{if((q|0)==361){if((c[d+1600>>2]|0)>1){if((f|0)==0){p=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(p|0,16,k|0)|0;Wb()}if((zd(f,784,7368)|0)!=0){Oa(232,1)}if((yd(f,7416)|0)==0){M=+h[n>>3];break}else{Oa(232,1)}}else{M=K}}}while(0);if(!(M==-1.0?+h[b+800>>3]==0.0:0)){q=371}if((q|0)==371?(c[d+1600>>2]|0)==0:0){if((g|0)==0){n=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(n|0,16,k|0)|0;Wb()}if((zd(g,784,7368)|0)!=0){Oa(232,1)}if((yd(g,7464)|0)!=0){Oa(232,1)}}n=d+8892|0;if((c[v>>2]|0)!=1?(c[n>>2]|0)!=0:0){if((f|0)==0){p=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(p|0,16,k|0)|0;Wb()}if((zd(f,784,7512)|0)!=0){Oa(232,1)}if((yd(f,7552)|0)!=0){Oa(232,1)}}p=c[n>>2]|0;do{if((p|0)!=0){G=Un(p|0)|0;if(G>>>0>36){if((e|0)==0){D=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(D|0,16,k|0)|0;Wb()}if((zd(e,784,7600)|0)!=0){Oa(232,1)}if((yd(e,4920)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}do{if(G>>>0>(c[w>>2]|0)>>>0){if((g|0)==0){D=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(D|0,16,k|0)|0;Wb()}if((zd(g,784,7656)|0)==0){N=c[n>>2]|0;break}else{Oa(232,1)}}else{N=p}}while(0);G=Un(N|0)|0;do{if(G>>>0<(c[A>>2]|0)>>>0){if((g|0)==0){D=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(D|0,16,k|0)|0;Wb()}if((zd(g,784,7712)|0)==0){O=c[n>>2]|0;break}else{Oa(232,1)}}else{O=N}}while(0);if((Ed(c[l>>2]|0,O)|0)==0){if((f|0)==0){G=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(G|0,16,k|0)|0;Wb()}if((zd(f,784,7768)|0)==0){break}Oa(232,1)}if((Ed(c[H>>2]|0,c[n>>2]|0)|0)==0){if((f|0)==0){G=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(G|0,16,k|0)|0;Wb()}if((zd(f,784,7816)|0)!=0){Oa(232,1)}}}}while(0);n=d+8884|0;O=c[n>>2]|0;do{if((O|0)!=0){N=Un(O|0)|0;if(N>>>0>36){if((e|0)==0){A=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(A|0,16,k|0)|0;Wb()}if((zd(e,784,7864)|0)!=0){Oa(232,1)}if((yd(e,4920)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}do{if(N>>>0>(c[u>>2]|0)>>>0){if((g|0)==0){A=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(A|0,16,k|0)|0;Wb()}if((zd(g,784,7920)|0)==0){P=c[n>>2]|0;break}else{Oa(232,1)}}else{P=O}}while(0);N=Un(P|0)|0;do{if(N>>>0<(c[s>>2]|0)>>>0){if((g|0)==0){A=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(A|0,16,k|0)|0;Wb()}if((zd(g,784,7960)|0)==0){Q=c[n>>2]|0;break}else{Oa(232,1)}}else{Q=P}}while(0);if((Ed(c[l>>2]|0,Q)|0)==0){if((f|0)==0){N=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(N|0,16,k|0)|0;Wb()}if((zd(f,784,8e3)|0)==0){break}Oa(232,1)}if((Ed(c[H>>2]|0,c[n>>2]|0)|0)==0){if((f|0)==0){N=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(N|0,16,k|0)|0;Wb()}if((zd(f,784,8040)|0)!=0){Oa(232,1)}}}}while(0);n=d+8888|0;Q=c[n>>2]|0;do{if((Q|0)!=0){P=Un(Q|0)|0;if(P>>>0>36){if((e|0)==0){O=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(O|0,16,k|0)|0;Wb()}if((zd(e,784,8088)|0)!=0){Oa(232,1)}if((yd(e,4920)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}do{if(P>>>0<(c[s>>2]|0)>>>0){if((g|0)==0){O=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(O|0,16,k|0)|0;Wb()}if((zd(g,784,8144)|0)==0){R=c[n>>2]|0;break}else{Oa(232,1)}}else{R=Q}}while(0);P=Un(R|0)|0;if(P>>>0>(c[u>>2]|0)>>>0){if((g|0)==0){P=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(P|0,16,k|0)|0;Wb()}if((zd(g,784,8192)|0)==0){break}Oa(232,1)}vd(R,4208);if((Ed(c[l>>2]|0,4208)|0)==0){if((f|0)==0){P=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(P|0,16,k|0)|0;Wb()}if((zd(f,784,8240)|0)==0){break}Oa(232,1)}if((Ed(c[H>>2]|0,4208)|0)==0){if((f|0)==0){P=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(P|0,16,k|0)|0;Wb()}if((zd(f,784,8280)|0)!=0){Oa(232,1)}}}}while(0);if(!(!(+h[b+2584>>3]!=0.0)?!(+h[b+2592>>3]!=0.0):0)){q=477}if((q|0)==477?+h[b+2440>>3]==2.2250738585072014e-308:0){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,8328)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(!(!(+h[b+2600>>3]!=0.0)?!(+h[b+2608>>3]!=0.0):0)){q=484}if((q|0)==484?(c[b+2420>>2]|0)==-2147483648:0){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,8424)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(!(!(+h[b+112>>3]!=0.0)?!(+h[b+104>>3]!=0.0):0)){q=491}if((q|0)==491?+h[b+240>>3]==-2147483648.0:0){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,8504)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(!(!(+h[b+464>>3]!=0.0)?!(+h[b+456>>3]!=0.0):0)){q=498}if((q|0)==498?+h[b+592>>3]==-2147483648.0:0){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,8592)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[v>>2]|0)!=1?+h[b+2528>>3]!=0.0:0){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,8688)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+160>>3]!=0.0?(Yd(c[o>>2]|0)|0)==0:0){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,8792)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+512>>3]!=0.0?(Yd(c[b+400>>2]|0)|0)==0:0){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,8880)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+2616>>3]!=0.0?(Yd(c[o>>2]|0)|0)==0:0){if((e|0)==0){o=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(o|0,16,k|0)|0;Wb()}if((zd(e,784,8792)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if(+h[b+2528>>3]!=0.0?(c[v>>2]|0)==0:0){if((e|0)==0){v=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(v|0,16,k|0)|0;Wb()}if((zd(e,784,8688)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}v=c[b+780>>2]|0;if((v|0)<0){if((e|0)==0){o=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(o|0,16,k|0)|0;Wb()}if((zd(e,784,8984)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}o=c[b+788>>2]|0;if((o|0)<0){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,9032)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}q=c[b+792>>2]|0;if((q|0)<0){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,9080)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}H=c[b+784>>2]|0;if((H|0)<0){if((e|0)==0){l=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(l|0,16,k|0)|0;Wb()}if((zd(e,784,9128)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((o|0)>(H|0)){if((e|0)==0){o=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(o|0,16,k|0)|0;Wb()}if((zd(e,784,9176)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((q|0)>(H|0)){if((e|0)==0){q=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(q|0,16,k|0)|0;Wb()}if((zd(e,784,9232)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((v|0)>(H|0)){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,9288)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}H=c[d+8896>>2]|0;if((H|0)>-1?(v=c[d+8900>>2]|0,(v|0)>-1&(H|0)>(v|0)):0){if((e|0)==0){v=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(v|0,16,k|0)|0;Wb()}if((zd(e,784,9344)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}v=c[d+8908>>2]|0;if((v|0)>-1?(H=c[d+8904>>2]|0,(H|0)>-1&(v|0)>(H|0)):0){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,9400)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}H=c[b+2648>>2]|0;if((H|0)<1){if((e|0)==0){v=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(v|0,16,k|0)|0;Wb()}if((zd(e,784,9456)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}v=c[b+2652>>2]|0;if((v|0)<1){if((e|0)==0){b=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(b|0,16,k|0)|0;Wb()}if((zd(e,784,9520)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((c[d+8828>>2]|0)>0){d=(c[u>>2]|0)/2|0;if((H|0)>(d|0)){if((e|0)==0){H=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(H|0,16,k|0)|0;Wb()}if((zd(e,784,9584)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((v|0)>(d|0)){if((e|0)==0){d=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(d|0,16,k|0)|0;Wb()}if((zd(e,784,9648)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}if(+h[J>>3]>0.0?+h[I>>3]<=0.0:0){if((g|0)==0){I=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(I|0,16,k|0)|0;Wb()}if((zd(g,784,9712)|0)!=0){Oa(232,1)}}g=c[y>>2]|0;d:do{if((g|0)!=0){y=a[g]|0;e:do{if(!(y<<24>>24==0)){I=g;J=y;d=y&255;v=0;while(1){if((J+ -97<<24>>24&255)<26){S=d+224&255}else{S=J}if((S+ -65<<24>>24&255)>25){break e}switch(S<<24>>24){case 86:case 68:case 72:case 66:case 75:case 77:case 83:case 87:case 89:case 82:case 71:case 84:case 67:case 65:case 78:{break};default:{break e}}I=I+1|0;v=v+1|0;H=a[I]|0;if(H<<24>>24==0){break}else{J=H;d=H&255}}if((v|0)==5){break d}}}while(0);if((e|0)==0){y=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(y|0,16,k|0)|0;Wb()}if((zd(e,784,9816)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}while(0);S=c[F>>2]|0;f:do{if((S|0)!=0){F=a[S]|0;g:do{if(!(F<<24>>24==0)){g=S;y=F;d=F&255;J=0;while(1){if((y+ -97<<24>>24&255)<26){T=d+224&255}else{T=y}if((T+ -65<<24>>24&255)>25){break g}switch(T<<24>>24){case 86:case 68:case 72:case 66:case 75:case 77:case 83:case 87:case 89:case 82:case 71:case 84:case 67:case 65:case 78:{break};default:{break g}}g=g+1|0;J=J+1|0;I=a[g]|0;if(I<<24>>24==0){break}else{y=I;d=I&255}}if((J|0)==5){break f}}}while(0);if((e|0)==0){F=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(F|0,16,k|0)|0;Wb()}if((zd(e,784,9864)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}while(0);T=c[E>>2]|0;h:do{if((T|0)!=0){E=a[T]|0;i:do{if(!(E<<24>>24==0)){S=T;F=E;d=E&255;y=0;while(1){if((F+ -97<<24>>24&255)<26){U=d+224&255}else{U=F}if((U+ -65<<24>>24&255)>25){break i}switch(U<<24>>24){case 86:case 68:case 72:case 66:case 75:case 77:case 83:case 87:case 89:case 82:case 71:case 84:case 67:case 65:case 78:{break};default:{break i}}S=S+1|0;y=y+1|0;g=a[S]|0;if(g<<24>>24==0){break}else{F=g;d=g&255}}if((y|0)==5){break h}}}while(0);if((e|0)==0){E=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(E|0,16,k|0)|0;Wb()}if((zd(e,784,9920)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}while(0);U=c[x>>2]|0;j:do{if((U|0)!=0){x=a[U]|0;k:do{if(!(x<<24>>24==0)){T=U;E=x;d=x&255;F=0;while(1){if((E+ -97<<24>>24&255)<26){V=d+224&255}else{V=E}if((V+ -65<<24>>24&255)>25){break k}switch(V<<24>>24){case 86:case 68:case 72:case 66:case 75:case 77:case 83:case 87:case 89:case 82:case 71:case 84:case 67:case 65:case 78:{break};default:{break k}}T=T+1|0;F=F+1|0;S=a[T]|0;if(S<<24>>24==0){break}else{E=S;d=S&255}}if((F|0)==5){break j}}}while(0);if((e|0)==0){x=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(x|0,16,k|0)|0;Wb()}if((zd(e,784,9984)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}}while(0);if((c[f+4>>2]|0)==0){W=(c[e+4>>2]|0)==0}else{W=0}t=W&1^1;i=j;return t|0}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,7232)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,7168)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,7112)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,7048)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,7048)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,6968)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,6912)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,6632)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}}if((e|0)==0){W=c[r>>2]|0;c[k>>2]=c[2];c[k+4>>2]=56;c[k+8>>2]=5669;c[k+12>>2]=776;Ab(W|0,16,k|0)|0;Wb()}if((zd(e,784,6568)|0)==0){t=1;i=j;return t|0}else{Oa(232,1)}return 0}function ud(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0.0,v=0.0,w=0,x=0,y=0.0,z=0,A=0,B=0.0;g=i;i=i+16|0;j=g;if(!(f>>>0<2)){k=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=4285;c[j+12>>2]=408;Ab(k|0,16,j|0)|0;Wb()}if((c[d+1600>>2]|0)!=1){k=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=4286;c[j+12>>2]=448;Ab(k|0,16,j|0)|0;Wb()}j=c[d>>2]|0;k=c[d+4>>2]|0;d=j+ -1|0;l=d+k|0;m=c[e+56>>2]|0;n=a[e+112|0]|0;do{if((f|0)==0){o=n+m|0;p=o+ -1|0;q=e+116|0;s=c[q>>2]|0;c[q>>2]=s|16;t=e+32|0;h[t>>3]=0.0;if((p|0)<=(l|0)){c[q>>2]=s&-17;if((o|0)>(j|0)){u=+(1-j+p|0);h[t>>3]=u;v=u;w=t;x=15;break}else{u=+(d+(1-o)|0);h[t>>3]=u;y=u;z=t;x=14;break}}else{y=0.0;z=t;x=14}}else{t=m-n|0;o=t+1|0;p=e+116|0;s=c[p>>2]|0;c[p>>2]=s|16;q=e+32|0;h[q>>3]=0.0;if((o|0)>=(j|0)){c[p>>2]=s&-17;if((t|0)<(l|0)){u=+(j+k+~t|0);h[q>>3]=u;v=u;w=q;x=15;break}else{u=+(o+~l|0);h[q>>3]=u;y=u;z=q;x=14;break}}else{y=0.0;z=q;x=14}}}while(0);if((x|0)==14){A=z;B=+h[b+800>>3]*y;h[A>>3]=B;i=g;return}else if((x|0)==15){A=w;B=+h[b+808>>3]*v;h[A>>3]=B;i=g;return}}function vd(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;e=b;while(1){if((a[e]|0)==0){break}else{e=e+1|0}}f=e+ -1|0;if(f>>>0<b>>>0){g=c;a[g]=0;i=d;return}else{h=f;j=c}while(1){switch(a[h]|0){case 83:{a[j]=83;break};case 77:{a[j]=75;break};case 75:{a[j]=77;break};case 89:{a[j]=82;break};case 82:{a[j]=89;break};case 86:{a[j]=66;break};case 72:{a[j]=68;break};case 68:{a[j]=72;break};case 66:{a[j]=86;break};case 85:{a[j]=65;break};case 84:{a[j]=65;break};case 71:{a[j]=67;break};case 67:{a[j]=71;break};case 65:{a[j]=84;break};case 87:{a[j]=87;break};case 78:{a[j]=78;break};case 97:{a[j]=116;break};case 99:{a[j]=103;break};case 103:{a[j]=99;break};case 116:{a[j]=97;break};case 117:{a[j]=97;break};case 98:{a[j]=118;break};case 100:{a[j]=104;break};case 104:{a[j]=100;break};case 118:{a[j]=98;break};case 121:{a[j]=114;break};case 114:{a[j]=121;break};case 107:{a[j]=109;break};case 109:{a[j]=107;break};case 115:{a[j]=115;break};case 119:{a[j]=119;break};case 110:{a[j]=110;break};default:{}}c=j+1|0;f=h+ -1|0;if(f>>>0<b>>>0){g=c;break}else{h=f;j=c}}a[g]=0;i=d;return}function wd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;if((c[182]|0)!=1){f=0;do{a[472+f|0]=f;f=f+1|0}while((f|0)!=255);a[569|0]=65;a[570|0]=66;a[571|0]=67;a[537|0]=97;a[538|0]=98;a[539|0]=99;a[572|0]=68;a[573|0]=69;a[574|0]=70;a[540|0]=100;a[541|0]=101;a[542|0]=102;a[575|0]=71;a[576|0]=72;a[577|0]=73;a[543|0]=103;a[544|0]=104;a[545|0]=105;a[579|0]=75;a[580|0]=76;a[581|0]=77;a[547|0]=107;a[548|0]=108;a[549|0]=109;a[582|0]=78;a[583|0]=79;a[584|0]=80;a[550|0]=110;a[551|0]=111;a[552|0]=112;a[585|0]=81;a[586|0]=82;a[587|0]=83;a[553|0]=113;a[554|0]=114;a[555|0]=115;a[588|0]=84;a[589|0]=85;a[590|0]=86;a[556|0]=116;a[557|0]=117;a[558|0]=118;a[591|0]=87;a[592|0]=88;a[593|0]=89;a[559|0]=119;a[560|0]=120;a[561|0]=121;a[594|0]=90;a[562|0]=122;a[578|0]=74;a[546|0]=106;c[182]=1}if((b|0)==0|(d|0)==0){g=1;i=e;return g|0}f=Un(b|0)|0;if((f|0)==(Un(d|0)|0)){h=b;j=d}else{g=1;i=e;return g|0}while(1){d=a[h]|0;if(d<<24>>24==10|d<<24>>24==0){g=0;k=11;break}b=a[j]|0;if(b<<24>>24==10|b<<24>>24==0){g=0;k=11;break}if(!(d<<24>>24==b<<24>>24)?!((a[472+(d<<24>>24)|0]|0)==b<<24>>24):0){g=1;k=11;break}h=h+1|0;j=j+1|0}if((k|0)==11){i=e;return g|0}return 0}function xd(){return 736}function yd(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+16|0;f=e;if((d|0)==0){g=c[r>>2]|0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=5646;c[f+12>>2]=768;Ab(g|0,16,f|0)|0;Wb()}if((b|0)==0){g=c[r>>2]|0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=5647;c[f+12>>2]=776;Ab(g|0,16,f|0)|0;Wb()}f=b+4|0;g=c[f>>2]|0;do{if((g|0)==0){c[b>>2]=24;h=un(24)|0;c[f>>2]=h;if((h|0)==0){j=1;i=e;return j|0}else{a[h]=0;k=h;l=24;break}}else{k=g;l=c[b>>2]|0}}while(0);g=Un(k|0)|0;h=Un(d|0)|0;if((h+g|0)>=(l|0)){m=(h<<1)+2+l|0;c[b>>2]=m;b=xn(k,m)|0;c[f>>2]=b;if((b|0)==0){j=1;i=e;return j|0}else{n=b}}else{n=k}bo(n+g|0,d|0)|0;j=0;i=e;return j|0}function zd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+16|0;g=f;if((b|0)==0){h=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5687;c[g+12>>2]=776;Ab(h|0,16,g|0)|0;Wb()}if((e|0)==0){h=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5688;c[g+12>>2]=768;Ab(h|0,16,g|0)|0;Wb()}if((d|0)==0){h=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5689;c[g+12>>2]=792;Ab(h|0,16,g|0)|0;Wb()}g=c[b+4>>2]|0;if((g|0)!=0?(a[g]|0)!=0:0){if((yd(b,d)|0)==0){j=(yd(b,e)|0)!=0}else{j=1}k=j&1;i=f;return k|0}k=yd(b,e)|0;i=f;return k|0}function Ad(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a+8856|0;a=c[e>>2]|0;if((a|0)!=0){vn(a)}a=un((Un(b|0)|0)+1|0)|0;c[e>>2]=a;if((a|0)==0){f=1;i=d;return f|0}bo(a|0,b|0)|0;f=0;i=d;return f|0}function Bd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a+8884|0;a=c[e>>2]|0;if((a|0)!=0){vn(a)}a=un((Un(b|0)|0)+1|0)|0;c[e>>2]=a;if((a|0)==0){f=1;i=d;return f|0}bo(a|0,b|0)|0;f=0;i=d;return f|0}function Cd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=a+8888|0;a=c[e>>2]|0;if((a|0)!=0){vn(a)}a=un((Un(b|0)|0)+1|0)|0;c[e>>2]=a;if((a|0)==0){f=1;i=d;return f|0}bo(a|0,b|0)|0;f=0;i=d;return f|0}function Dd(a){a=a|0;return c[a+440>>2]|0}function Ed(b,c){b=b|0;c=c|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;d=i;if((b|0)==0|(c|0)==0){e=0;i=d;return e|0}f=Un(b|0)|0;g=Un(c|0)|0;if((f|0)<(g|0)){e=0;i=d;return e|0}h=un(f+1|0)|0;if((h|0)==0){Oa(232,1)}bo(h|0,b|0)|0;b=h;f=a[h]|0;while(1){if(f<<24>>24==10|f<<24>>24==0){j=10;break}k=b+g|0;l=a[k]|0;a[k]=0;if((wd(b,c)|0)==0){j=9;break}a[k]=l;b=b+1|0;f=l}if((j|0)==9){vn(h);e=b;i=d;return e|0}else if((j|0)==10){vn(h);e=0;i=d;return e|0}return 0}function Fd(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+16|0;m=l;n=(b|0)>0;if(!n){o=0;i=l;return o|0}p=(k|0)==0;q=0;a:do{s=c[d+(q<<3)>>2]|0;do{if(!p){t=(c[d+(q<<3)+4>>2]|0)==-1;if((s|0)==-1){if(t){break}else{u=20;break a}}else{if(t){u=20;break a}else{u=27;break}}}else{u=27}}while(0);if((u|0)==27){u=0;c[d+(q<<3)>>2]=s-f}q=q+1|0}while((q|0)<(b|0));if((u|0)==20){if((g|0)==0){q=c[r>>2]|0;c[m>>2]=c[2];c[m+4>>2]=56;c[m+8>>2]=5669;c[m+12>>2]=776;Ab(q|0,16,m|0)|0;Wb()}if((a|0)!=0?(zd(g,784,a)|0)!=0:0){Oa(232,1)}if((yd(g,10456)|0)==0){o=1;i=l;return o|0}else{Oa(232,1)}}if(!n){o=0;i=l;return o|0}n=h+8832|0;q=(j|0)==0;f=(a|0)==0;p=h+8836|0;b:do{if((k|0)==0){h=0;t=0;while(1){v=d+(h<<3)|0;w=c[v>>2]|0;x=d+(h<<3)+4|0;y=c[x>>2]|0;if((y+w|0)>(e|0)){u=32;break b}z=w-(c[n>>2]|0)|0;c[v>>2]=z;if((z|0)<0){if((t|0)==0){u=9}else{A=y;B=t}}else{if((y+z|0)>(c[p>>2]|0)&(t|0)==0){u=9}else{A=y;B=t}}if((u|0)==9){u=0;if(q){u=43;break}if(!f?(zd(j,784,a)|0)!=0:0){u=46;break}if((yd(j,10504)|0)!=0){u=49;break}A=c[x>>2]|0;B=1}if((A|0)<0){break b}x=h+1|0;if((x|0)<(b|0)){h=x;t=B}else{o=0;u=60;break}}if((u|0)==43){C=c[r>>2]|0;D=c[2]|0;c[m>>2]=D;E=m+4|0;c[E>>2]=56;F=m+8|0;c[F>>2]=5669;G=m+12|0;c[G>>2]=776;Ab(C|0,16,m|0)|0;Wb()}else if((u|0)==46){Oa(232,1)}else if((u|0)==49){Oa(232,1)}else if((u|0)==60){i=l;return o|0}}else{t=0;h=0;while(1){s=c[d+(t<<3)>>2]|0;if((s|0)==-1){if((c[d+(t<<3)+4>>2]|0)==-1){H=h}else{I=-1;u=31}}else{I=s;u=31}if((u|0)==31){u=0;s=d+(t<<3)+4|0;x=c[s>>2]|0;if((x+I|0)>(e|0)){u=32;break b}y=I-(c[n>>2]|0)|0;c[d+(t<<3)>>2]=y;if((y|0)<0){if((h|0)==0){u=42}else{J=x;K=h}}else{if((x+y|0)>(c[p>>2]|0)&(h|0)==0){u=42}else{J=x;K=h}}if((u|0)==42){u=0;if(q){u=43;break}if(!f?(zd(j,784,a)|0)!=0:0){u=46;break}if((yd(j,10504)|0)!=0){u=49;break}J=c[s>>2]|0;K=1}if((J|0)<0){break b}else{H=K}}s=t+1|0;if((s|0)<(b|0)){t=s;h=H}else{o=0;u=60;break}}if((u|0)==43){C=c[r>>2]|0;D=c[2]|0;c[m>>2]=D;E=m+4|0;c[E>>2]=56;F=m+8|0;c[F>>2]=5669;G=m+12|0;c[G>>2]=776;Ab(C|0,16,m|0)|0;Wb()}else if((u|0)==46){Oa(232,1)}else if((u|0)==49){Oa(232,1)}else if((u|0)==60){i=l;return o|0}}}while(0);if((u|0)==32){if((g|0)==0){u=c[r>>2]|0;c[m>>2]=c[2];c[m+4>>2]=56;c[m+8>>2]=5669;c[m+12>>2]=776;Ab(u|0,16,m|0)|0;Wb()}if(!f?(zd(g,784,a)|0)!=0:0){Oa(232,1)}if((yd(g,10480)|0)==0){o=1;i=l;return o|0}else{Oa(232,1)}}if((g|0)==0){f=c[r>>2]|0;c[m>>2]=c[2];c[m+4>>2]=56;c[m+8>>2]=5669;c[m+12>>2]=776;Ab(f|0,16,m|0)|0;Wb()}if((zd(g,784,10536)|0)!=0){Oa(232,1)}if((yd(g,a)|0)!=0){Oa(232,1)}if((yd(g,10552)|0)==0){o=1;i=l;return o|0}else{Oa(232,1)}return 0}function Gd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;g=f;h=e*3|0;j=Un(b|0)|0;if((b|0)==0){k=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5060;c[g+12>>2]=10560;Ab(k|0,16,g|0)|0;Wb()}k=(e|0)==1;if(!((e|0)==1|(e|0)==-1)){e=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5061;c[g+12>>2]=10568;Ab(e|0,16,g|0)|0;Wb()}if((j|0)<=2){e=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5062;c[g+12>>2]=10608;Ab(e|0,16,g|0)|0;Wb()}if((j+ -3|0)<(d|0)){j=c[r>>2]|0;c[g>>2]=c[2];c[g+4>>2]=56;c[g+8>>2]=5063;c[g+12>>2]=10624;Ab(j|0,16,g|0)|0;Wb()}if((d|0)<0){if(k){k=d;while(1){if((k|0)<0){k=k+h|0}else{l=k;break}}}else{m=-1;i=f;return m|0}}else{l=d}d=b+l|0;a:while(1){l=a[d]|0;if(l<<24>>24==0){m=-1;n=23;break}k=a[d+1|0]|0;if(k<<24>>24==0){m=-1;n=23;break}g=a[d+2|0]|0;if(g<<24>>24==0){m=-1;n=23;break}do{if(l<<24>>24==116|l<<24>>24==84){if(k<<24>>24==103|k<<24>>24==71){if(g<<24>>24==97|g<<24>>24==65){n=21;break a}else{break}}else if(k<<24>>24==97|k<<24>>24==65?g<<24>>24==97|g<<24>>24==65|g<<24>>24==103|g<<24>>24==71:0){n=19;break a}else{break}}}while(0);g=d+h|0;if(g>>>0<b>>>0){m=-1;n=23;break}else{d=g}}if((n|0)==19){m=d-b|0;i=f;return m|0}else if((n|0)==21){m=d-b|0;i=f;return m|0}else if((n|0)==23){i=f;return m|0}return 0}function Hd(b,d){b=b|0;d=d|0;var e=0,f=0.0,g=0.0,j=0,k=0,l=0;e=i;f=+h[b+40>>3];g=+h[d+40>>3];if(!(f<g)){if(!(f>g)){j=c[b+56>>2]|0;k=c[d+56>>2]|0;if((j|0)<=(k|0)){if((j|0)<(k|0)){l=1}else{l=(a[b+112|0]|0)<(a[d+112|0]|0)?-1:1}}else{l=-1}}else{l=1}}else{l=-1}i=e;return l|0}function Id(b,d,e,f,g,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0.0,S=0,T=0,U=0,V=0.0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0.0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0.0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0.0,qa=0.0,ra=0,sa=0,ta=0,ua=0,va=0;m=i;i=i+432|0;n=m+288|0;o=m+332|0;p=m+128|0;q=m+400|0;s=m+360|0;t=m;u=m+304|0;v=m+208|0;w=t+0|0;x=w+128|0;do{c[w>>2]=0;w=w+4|0}while((w|0)<(x|0));c[u+0>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;c[u+12>>2]=0;c[u+16>>2]=0;c[u+20>>2]=0;c[u+24>>2]=0;w=v+0|0;x=w+80|0;do{c[w>>2]=0;w=w+4|0}while((w|0)<(x|0));y=g+8868|0;z=Un(c[y>>2]|0)|0;if((z|0)==2147483647){A=c[r>>2]|0;c[n>>2]=c[2];c[n+4>>2]=56;c[n+8>>2]=2439;c[n+12>>2]=10648;Ab(A|0,16,n|0)|0;Wb()}A=e+12|0;if((c[A>>2]|0)==2){B=f+660|0;C=f+656|0}else{B=f+308|0;C=f+304|0}D=c[B>>2]|0;B=c[C>>2]|0;C=d+b|0;if((d|0)>0){d=(B|0)>(D|0);E=t+112|0;F=t+8|0;G=t+56|0;H=t+114|0;I=t+115|0;J=e+16|0;K=t+116|0;L=t+40|0;M=t+12|0;N=t+48|0;O=0;P=0;Q=0;R=1.0e3;S=0;T=C;while(1){U=T+ -1|0;a[s]=0;a:do{if(d){V=R;W=Q;X=O;Y=P;Z=S}else{_=O;$=P;aa=R;ba=Q;ca=S;da=B;while(1){a[E]=da;c[F>>2]=0;ea=c[A>>2]|0;if((ea|0)==1){fa=da+U|0;if((fa|0)>(z|0)){ga=_;ha=$;ia=aa;ja=ba;ka=ca}else{c[G>>2]=fa+ -1;la=c[y>>2]|0;if((da|0)>0){ma=U;do{a[s+(ma-U)|0]=a[la+ma|0]|0;ma=ma+1|0}while((ma|0)<(fa|0))}a[s+da|0]=0;na=19}}else{fa=U-da|0;if((fa|0)<-1){ga=_;ha=$;ia=aa;ja=ba;ka=ca}else{ma=fa+1|0;c[G>>2]=ma;fa=c[y>>2]|0;if((da|0)>0){la=ma;do{a[s+(la-ma)|0]=a[fa+la|0]|0;la=la+1|0}while((la|0)<(T|0))}a[s+da|0]=0;na=19}}do{if((na|0)==19){na=0;a[H]=0;a[I]=0;c[J>>2]=(c[J>>2]|0)+1;Jd(f,t,ea,j,k,g,J,l,s);la=c[K>>2]|0;if(la>>>0>127?(a[H]|0)==0:0){fa=c[F>>2]|0;if((fa|0)==0){oa=la}else{vn(fa);c[F>>2]=0;oa=c[K>>2]|0}if((oa&310297344|0)==0){ga=_;ha=$;ia=aa;ja=ba;ka=ca;break}else{V=aa;W=ba;X=_;Y=$;Z=ca;break a}}pa=+Kd(f,t,c[A>>2]|0);h[L>>3]=pa;if(!(pa<aa)){fa=c[F>>2]|0;if((fa|0)==0){ga=_;ha=$;ia=aa;ja=ba;ka=ca;break}vn(fa);c[F>>2]=0;ga=_;ha=$;ia=aa;ja=ba;ka=ca;break}if((ba|0)==0){qa=pa}else{vn(ba);qa=+h[L>>3]}fa=t;la=c[fa>>2]|0;ma=c[fa+4>>2]|0;fa=c[F>>2]|0;c[u+0>>2]=c[M+0>>2];c[u+4>>2]=c[M+4>>2];c[u+8>>2]=c[M+8>>2];c[u+12>>2]=c[M+12>>2];c[u+16>>2]=c[M+16>>2];c[u+20>>2]=c[M+20>>2];c[u+24>>2]=c[M+24>>2];w=v+0|0;ra=N+0|0;x=w+80|0;do{c[w>>2]=c[ra>>2];w=w+4|0;ra=ra+4|0}while((w|0)<(x|0));ga=la;ha=ma;ia=qa;ja=fa;ka=1}}while(0);if((da|0)>=(D|0)){V=ia;W=ja;X=ga;Y=ha;Z=ka;break a}_=ga;$=ha;aa=ia;ba=ja;ca=ka;da=da+1|0}}}while(0);if((U|0)>(b|0)){O=X;P=Y;Q=W;R=V;S=Z;T=U}else{break}}if((Z|0)==1){c[o+0>>2]=c[u+0>>2];c[o+4>>2]=c[u+4>>2];c[o+8>>2]=c[u+8>>2];c[o+12>>2]=c[u+12>>2];c[o+16>>2]=c[u+16>>2];c[o+20>>2]=c[u+20>>2];c[o+24>>2]=c[u+24>>2];w=p+0|0;ra=v+0|0;x=w+80|0;do{c[w>>2]=c[ra>>2];w=w+4|0;ra=ra+4|0}while((w|0)<(x|0));v=c[e>>2]|0;u=e+8|0;do{if((v|0)==0){c[u>>2]=2e3;Z=un(256e3)|0;if((Z|0)==0){Oa(232,1)}else{c[e>>2]=Z;sa=2e3;ta=Z;break}}else{sa=c[u>>2]|0;ta=v}}while(0);v=e+4|0;Z=c[v>>2]|0;do{if((Z+1|0)>=(sa|0)){T=(sa>>1)+sa|0;c[u>>2]=T;S=xn(ta,T<<7)|0;if((S|0)==0){Oa(232,1)}else{c[e>>2]=S;ua=c[v>>2]|0;va=S;break}}else{ua=Z;va=ta}}while(0);ta=va+(ua<<7)|0;Z=ta;c[Z>>2]=X;c[Z+4>>2]=Y;c[va+(ua<<7)+8>>2]=W;W=ta+12|0;c[W+0>>2]=c[o+0>>2];c[W+4>>2]=c[o+4>>2];c[W+8>>2]=c[o+8>>2];c[W+12>>2]=c[o+12>>2];c[W+16>>2]=c[o+16>>2];c[W+20>>2]=c[o+20>>2];c[W+24>>2]=c[o+24>>2];h[va+(ua<<7)+40>>3]=V;w=va+(ua<<7)+48|0;ra=p+0|0;x=w+80|0;do{c[w>>2]=c[ra>>2];w=w+4|0;ra=ra+4|0}while((w|0)<(x|0));c[v>>2]=(c[v>>2]|0)+1;v=e+96|0;c[v>>2]=(c[v>>2]|0)+1;i=m;return}}v=l+444|0;if((c[A>>2]|0)==1){if((zd(v,784,10888)|0)!=0){Oa(232,1)}}else{if((zd(v,784,10920)|0)!=0){Oa(232,1)}}A=f+20|0;c[n>>2]=(c[A>>2]|0)+b;tb(q|0,10952,n|0)|0;if((yd(v,q)|0)!=0){Oa(232,1)}if((yd(v,10960)|0)!=0){Oa(232,1)}c[n>>2]=(c[A>>2]|0)+C;tb(q|0,10952,n|0)|0;if((yd(v,q)|0)==0){i=m;return}else{Oa(232,1)}}function Jd(b,d,e,f,g,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0.0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0;n=i;i=i+64|0;o=n;p=n+16|0;q=d+114|0;s=(a[q]|0)!=0;if(!s?(c[b+16>>2]|0)==0:0){t=(c[l+424>>2]|0)==1}else{t=1}u=j+8868|0;v=c[u>>2]|0;w=c[g+4>>2]|0;x=d+116|0;c[x>>2]=0;a[d+115|0]=0;c[d+8>>2]=0;y=d+113|0;a[y]=0;z=d+24|0;h[z>>3]=0.0;A=d+120|0;a[A]=0;h[d+104>>3]=-1.7976931348623157e+308;h[d+96>>3]=-1.7976931348623157e+308;a[d+121|0]=0;B=(e|0)==0;C=(e|0)==1;D=e>>>0<2;E=(e|0)==2;if(!(e>>>0<3)){F=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3001;c[o+12>>2]=11152;Ab(F|0,16,o|0)|0;Wb()}vd(m,p);F=C?p:m;G=C?m:p;p=E?b+400|0:b+48|0;m=(e&-3|0)==0;H=d+56|0;I=c[H>>2]|0;J=d+112|0;K=a[J]|0;if(m){L=I+ -1+K|0;M=I;N=L;O=L}else{L=I-K+1|0;M=L;N=I;O=L}if(!((N|0)>-1)){L=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3026;c[o+12>>2]=11200;Ab(L|0,16,o|0)|0;Wb()}L=j+8836|0;if((N|0)>=(c[L>>2]|0)){K=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3027;c[o+12>>2]=11208;Ab(K|0,16,o|0)|0;Wb()}do{if(B?(K=c[j+8840>>2]|0,!((K|0)<-999999)):0){if((((I-K|0)%3|0|0)==0?(I|0)>(c[l+456>>2]|0):0)?(K=c[l+452>>2]|0,(K|0)==-1|(I|0)<(K|0)):0){break}K=k+72|0;c[K>>2]=(c[K>>2]|0)+1;c[x>>2]=c[x>>2]|134217729;if((c[b+32>>2]|0)==0){i=n;return}}}while(0);if(((c[b+776>>2]|0)==1?(I=a[(c[j+8872>>2]|0)+O|0]|0,I<<24>>24==116|I<<24>>24==103|I<<24>>24==99|I<<24>>24==97):0)?(c[x>>2]=c[x>>2]|16777217,I=k+84|0,c[I>>2]=(c[I>>2]|0)+1,!s):0){i=n;return}I=c[p+344>>2]|0;O=c[p+348>>2]|0;do{if((I|0)==0){if((O|0)!=0){P=a[J]|0;Q=40}}else{K=a[J]|0;R=0;S=F;T=I;a:while(1){U=a[S]|0;V=a[T]|0;if((U+ -97<<24>>24&255)<26){W=(U&255)+224&255}else{W=U}if((V+ -98<<24>>24&255)<25){X=(V&255)+224&255}else{X=V}b:do{if(!(W<<24>>24==X<<24>>24)?!(W<<24>>24==78|X<<24>>24==78):0){if(W<<24>>24==84){switch(X<<24>>24){case 68:case 72:case 66:case 75:case 87:case 89:{break b;break};default:{Q=37;break a}}}else if(W<<24>>24==67){switch(X<<24>>24){case 86:case 72:case 66:case 77:case 83:case 89:{break b;break};default:{Q=37;break a}}}else if(W<<24>>24==71){switch(X<<24>>24){case 86:case 68:case 66:case 75:case 83:case 82:{break b;break};default:{Q=37;break a}}}else if(W<<24>>24==65){switch(X<<24>>24){case 86:case 68:case 72:case 77:case 87:case 82:{break b;break};default:{Q=37;break a}}}else{Q=37;break a}}}while(0);V=R+1|0;if((V|0)<5){R=V;S=S+1|0;T=T+1|0}else{Q=39;break}}if((Q|0)==37){T=k+88|0;c[T>>2]=(c[T>>2]|0)+1;Q=54;break}else if((Q|0)==39){if((O|0)==0){break}else{P=K;Q=40;break}}}}while(0);c:do{if((Q|0)==40){X=0;W=F+(P+ -5)|0;I=O;d:while(1){T=a[W]|0;S=a[I]|0;if((T+ -97<<24>>24&255)<26){Y=(T&255)+224&255}else{Y=T}if((S+ -98<<24>>24&255)<25){Z=(S&255)+224&255}else{Z=S}e:do{if(!(Y<<24>>24==Z<<24>>24)?!(Y<<24>>24==78|Z<<24>>24==78):0){if(Y<<24>>24==67){switch(Z<<24>>24){case 86:case 72:case 66:case 77:case 83:case 89:{break e;break};default:{break d}}}else if(Y<<24>>24==84){switch(Z<<24>>24){case 68:case 72:case 66:case 75:case 87:case 89:{break e;break};default:{break d}}}else if(Y<<24>>24==71){switch(Z<<24>>24){case 86:case 68:case 66:case 75:case 83:case 82:{break e;break};default:{break d}}}else if(Y<<24>>24==65){switch(Z<<24>>24){case 86:case 68:case 72:case 77:case 87:case 82:{break e;break};default:{break d}}}else{break d}}}while(0);X=X+1|0;if((X|0)>=5){break c}else{W=W+1|0;I=I+1|0}}I=k+88|0;c[I>>2]=(c[I>>2]|0)+1;Q=54}}while(0);if((Q|0)==54?!s:0){c[x>>2]=c[x>>2]|1073741825;i=n;return}Z=c[u>>2]|0;u=N+1|0;Y=Z+u|0;if((u|0)>(M|0)){O=0;P=0;I=0;W=Z+M|0;while(1){Z=a[W]|0;if(!(Z<<24>>24==78)){X=P+1|0;if(Z<<24>>24==71|Z<<24>>24==67){_=O+1|0;$=X;aa=I}else{_=O;$=X;aa=I}}else{_=O;$=P;aa=I+1|0}W=W+1|0;if(!(W>>>0<Y>>>0)){break}else{O=_;P=$;I=aa}}a[y]=aa;if(($|0)==0){ba=aa;ca=0.0}else{ba=aa;ca=+(_|0)*100.0/+($|0)}}else{a[y]=0;ba=0;ca=0.0}h[z>>3]=ca;if((ba<<24>>24|0)>(c[p+248>>2]|0)?(c[x>>2]=c[x>>2]|257,ba=k+4|0,c[ba>>2]=(c[ba>>2]|0)+1,!s):0){i=n;return}ba=c[j+1600>>2]|0;if((ba|0)>=2){if(!(+h[b+808>>3]==-1.0)){da=c[r>>2]|0;ea=c[2]|0;c[o>>2]=ea;fa=o+4|0;c[fa>>2]=56;ga=o+8|0;c[ga>>2]=3075;ha=o+12|0;c[ha>>2]=11232;Ab(da|0,16,o|0)|0;Wb()}if(!(+h[b+800>>3]==0.0)){da=c[r>>2]|0;ea=c[2]|0;c[o>>2]=ea;fa=o+4|0;c[fa>>2]=56;ga=o+8|0;c[ga>>2]=3075;ha=o+12|0;c[ha>>2]=11232;Ab(da|0,16,o|0)|0;Wb()}}f:do{if((c[b>>2]|0)==8){h[d+32>>3]=0.0}else{g:do{if((e|0)!=2){da=+h[b+808>>3]==-1.0;do{if(da){if(+h[b+800>>3]==0.0){h:do{if((ba|0)>0){ha=0;while(1){ga=c[j+(ha<<3)>>2]|0;if((u|0)>(ga|0)?((c[j+(ha<<3)+4>>2]|0)+ga|0)>(M|0):0){break}ha=ha+1|0;if((ha|0)>=(ba|0)){break h}}h[d+32>>3]=0.0;c[x>>2]=c[x>>2]|20;break f}}while(0);if(!da){Q=84;break}}if(!(+h[b+800>>3]!=0.0&(ba|0)==1)){break g}}else{Q=84}}while(0);if((Q|0)==84?(ba|0)!=1:0){break}ud(b,j,d,e);da=c[x>>2]|0;if((da&16|0)==0){break f}c[x>>2]=da|4;break f}}while(0);h[d+32>>3]=0.0;c[x>>2]=c[x>>2]&-17}}while(0);ba=c[j+8840>>2]|0;do{if(!((ba|0)<-999999)){if(B){da=c[H>>2]|0;if((ba|0)>(da|0)){h[d+32>>3]=+(ba-da|0)*30.0;Q=100;break}else{h[d+32>>3]=+(da-ba|0)*20.0;Q=99;break}}if(C){da=c[l+452>>2]|0;if((da|0)==-1){h[d+32>>3]=+((c[L>>2]|0)+ -1-(c[H>>2]|0)|0)*100.0;Q=99;break}ha=c[H>>2]|0;if((da|0)<(ha|0)){h[d+32>>3]=+(ha-da|0)*.5;Q=100;break}else{h[d+32>>3]=+(da-ha|0)*100.0;Q=99;break}}else{Q=99}}else{Q=99}}while(0);if((Q|0)==99){if(E){ia=0;Q=106}else{Q=100}}if((Q|0)==100){L=c[j+3204>>2]|0;i:do{if((L|0)>0){ba=0;while(1){ha=c[j+(ba<<3)+1604>>2]|0;if((u|0)>(ha|0)?((c[j+(ba<<3)+1608>>2]|0)+ha|0)>(M|0):0){break}ba=ba+1|0;if((ba|0)>=(L|0)){break i}}c[x>>2]=c[x>>2]|8}}while(0);if(E){ia=1;Q=106}else{Q=113}}j:do{if((Q|0)==106){E=c[j+4808>>2]|0;k:do{if((E|0)>0){L=0;while(1){ba=c[j+(L<<3)+3208>>2]|0;if((u|0)>(ba|0)?((c[j+(L<<3)+3212>>2]|0)+ba|0)>(M|0):0){break}ba=L+1|0;if((ba|0)<(E|0)){L=ba}else{Q=111;break k}}c[x>>2]=c[x>>2]|8;if(ia){Q=113;break j}}else{Q=111}}while(0);if((Q|0)==111?ia:0){Q=113;break}ja=c[x>>2]|0}}while(0);if((Q|0)==113){ia=c[x>>2]|0;if((ia&4|0)!=0){u=ia|513;c[x>>2]=u;E=k+8|0;c[E>>2]=(c[E>>2]|0)+1;if(s){ja=u}else{i=n;return}}else{ja=ia}}if((ja&8|0)!=0){ia=ja|16385;c[x>>2]=ia;u=k+12|0;c[u>>2]=(c[u>>2]|0)+1;if(s){ka=ia}else{i=n;return}}else{ka=ja}l:do{if((B?(ja=c[j+8024>>2]|0,(ja|0)>0):0)?(c[j+8012>>2]|0)==0:0){ia=0;do{u=c[j+(ia<<3)+4812>>2]|0;if((M|0)>=(u|0)?(N|0)<=(u+ -1+(c[j+(ia<<3)+4816>>2]|0)|0):0){la=ka;break l}ia=ia+1|0}while((ia|0)<(ja|0));ja=ka|129;c[x>>2]=ja;ia=k+92|0;c[ia>>2]=(c[ia>>2]|0)+1;if(s){la=ja}else{i=n;return}}else{la=ka}}while(0);m:do{if((C?(ka=c[j+8024>>2]|0,(ka|0)>0):0)?(c[j+8016>>2]|0)==0:0){ja=0;do{ia=c[j+(ja<<3)+6412>>2]|0;if((M|0)>=(ia|0)?(N|0)<=(ia+ -1+(c[j+(ja<<3)+6416>>2]|0)|0):0){ma=la;break m}ja=ja+1|0}while((ja|0)<(ka|0));ka=la|129;c[x>>2]=ka;ja=k+96|0;c[ja>>2]=(c[ja>>2]|0)+1;if(s){ma=ka}else{i=n;return}}else{ma=la}}while(0);ca=+h[z>>3];if(ca<+h[p+208>>3]){z=ma|2049;c[x>>2]=z;la=k+16|0;c[la>>2]=(c[la>>2]|0)+1;if(s){na=z}else{i=n;return}}else{if(ca>+h[p+200>>3]){z=ma|1025;c[x>>2]=z;la=k+16|0;c[la>>2]=(c[la>>2]|0)+1;if(s){na=z}else{i=n;return}}else{na=ma}}if(D){ma=c[b+772>>2]|0;n:do{if((ma|0)>0){z=0;while(1){la=a[G+z|0]|0;if(!(la<<24>>24==67|la<<24>>24==71)){break}la=z+1|0;if((la|0)<(ma|0)){z=la}else{oa=na;break n}}z=na|131073;c[x>>2]=z;la=k+20|0;c[la>>2]=(c[la>>2]|0)+1;if(s){oa=z}else{i=n;return}}else{oa=na}}while(0);ma=c[b+768>>2]|0;if((ma|0)<=4){z=a[G]|0;if(z<<24>>24==67|z<<24>>24==71){pa=1}else{pa=0}z=a[G+1|0]|0;if(z<<24>>24==67|z<<24>>24==71){qa=pa+1|0}else{qa=pa}pa=a[G+2|0]|0;if(pa<<24>>24==67|pa<<24>>24==71){ra=qa+1|0}else{ra=qa}qa=a[G+3|0]|0;if(qa<<24>>24==67|qa<<24>>24==71){sa=ra+1|0}else{sa=ra}ra=a[G+4|0]|0;if(ra<<24>>24==67|ra<<24>>24==71){ta=sa+1|0}else{ta=sa}if((ta|0)>(ma|0)){ma=oa|268435457;c[x>>2]=ma;ta=k+24|0;c[ta>>2]=(c[ta>>2]|0)+1;if(s){ua=ma}else{i=n;return}}else{ua=oa}}else{ua=oa}}else{ua=na}na=c[b+44>>2]|0;oa=c[j+8844>>2]|0;do{if((oa|0)!=0){ma=p+272|0;if(m){ta=j+8832|0;sa=N+ -4|0;ra=na;while(1){if((sa|0)<(M|0)){va=ra}else{qa=c[oa+((c[ta>>2]|0)+sa<<2)>>2]|0;va=(qa|0)<(ra|0)?qa:ra}if((sa|0)<(N|0)){sa=sa+1|0;ra=va}else{break}}ra=N+ -5|0;if((ra|0)<(M|0)){wa=va;xa=va}else{sa=c[ta>>2]|0;qa=M;pa=va;while(1){z=c[oa+(qa+sa<<2)>>2]|0;la=(z|0)<(pa|0)?z:pa;if((qa|0)<(ra|0)){qa=qa+1|0;pa=la}else{wa=la;xa=va;break}}}}else{if(!C){pa=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3523;c[o+12>>2]=10968;Ab(pa|0,16,o|0)|0;Wb()}pa=M+5|0;if((M|0)>(N|0)){ya=na}else{qa=c[j+8832>>2]|0;ra=M+1|0;sa=M-((pa|0)>(ra|0)?pa:ra)|0;ra=M+ -1-((N|0)>(M|0)?N:M)|0;ta=M-(sa>>>0>ra>>>0?sa:ra)|0;ra=M;sa=na;while(1){la=c[oa+(ra+qa<<2)>>2]|0;z=(la|0)<(sa|0)?la:sa;la=ra+1|0;if((la|0)==(ta|0)){ya=z;break}else{ra=la;sa=z}}}if((pa|0)>(N|0)){wa=ya;xa=ya}else{sa=c[j+8832>>2]|0;ra=pa;ta=ya;while(1){qa=c[oa+(ra+sa<<2)>>2]|0;z=(qa|0)<(ta|0)?qa:ta;if((ra|0)<(N|0)){ra=ra+1|0;ta=z}else{wa=z;xa=ya;break}}}}c[d+60>>2]=wa;c[d+64>>2]=xa;if((wa|0)<(c[ma>>2]|0)){ta=ua|1048577;c[x>>2]=ta;ra=k+64|0;c[ra>>2]=(c[ra>>2]|0)+1;za=ta}else{if(!D){Aa=ua;break}if((xa|0)>=(c[p+268>>2]|0)){Aa=ua;break}ta=ua|2097153;c[x>>2]=ta;ra=k+64|0;c[ra>>2]=(c[ra>>2]|0)+1;za=ta}if(s){Aa=za}else{i=n;return}}else{c[d+60>>2]=na;c[d+64>>2]=na;Aa=ua}}while(0);ua=c[p+264>>2]|0;o:do{if((ua|0)>0&(M|0)<(N|0)){na=a[v+M|0]|0;za=M;xa=1;while(1){wa=za+1|0;ya=a[v+wa|0]|0;if(ya<<24>>24==na<<24>>24|ya<<24>>24==78){if((xa|0)<(ua|0)){Ba=xa+1|0}else{break}}else{Ba=1}if((wa|0)<(N|0)){na=ya;za=wa;xa=Ba}else{break o}}c[x>>2]=Aa|524289;xa=k+60|0;c[xa>>2]=(c[xa>>2]|0)+1;if(!s){i=n;return}}}while(0);Aa=b+752|0;ca=+Vb(F|0,+(+h[p+240>>3]),+(+h[p+216>>3]),+(+h[p+224>>3]),+(+h[p+232>>3]),36,c[Aa>>2]|0,c[b+756>>2]|0);h[d+16>>3]=ca;if(ca<+h[p+176>>3]?(c[x>>2]=c[x>>2]|8193,Ba=k+28|0,c[Ba>>2]=(c[Ba>>2]|0)+1,!s):0){i=n;return}if(ca>+h[p+184>>3]?(c[x>>2]=c[x>>2]|4097,Ba=k+32|0,c[Ba>>2]=(c[Ba>>2]|0)+1,!s):0){i=n;return}if(D?(ca=+Va(F|0,5,c[Aa>>2]|0),h[d+48>>3]=ca,ca>+h[b+760>>3]):0){c[x>>2]=c[x>>2]|262145;Aa=k+68|0;c[Aa>>2]=(c[Aa>>2]|0)+1;if(s){Q=187}else{i=n;return}}else{if((((!s?(c[b+16>>2]|0)==0:0)?(c[l+424>>2]|0)!=1:0)?!(+h[p+8>>3]!=0.0):0)?!(+h[p+24>>3]!=0.0):0){Q=191}else{Q=187}}if((Q|0)==187){if((c[b+2504>>2]|0)==0){Ld(d,p,k,f,F,G);G=c[x>>2]|0;if(!((G|0)==0|s)){if((G&2|0)==0){i=n;return}else{G=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3303;c[o+12>>2]=11320;Ab(G|0,16,o|0)|0;Wb()}}}else{Q=191}}do{if((Q|0)==191){if(!((((!s?(c[b+16>>2]|0)==0:0)?(c[l+424>>2]|0)!=1:0)?!(+h[p+16>>3]!=0.0):0)?!(+h[p+32>>3]!=0.0):0)){Q=196}if((Q|0)==196?(c[b+2504>>2]|0)==1:0){Md(d,p,k,g,F,F);G=c[x>>2]|0;if((G|0)==0|s){break}if((G&2|0)==0){i=n;return}else{G=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3322;c[o+12>>2]=11320;Ab(G|0,16,o|0)|0;Wb()}}h[d+80>>3]=-1.7976931348623157e+308;h[d+72>>3]=-1.7976931348623157e+308}}while(0);if(!t?!(+h[p+72>>3]!=0.0):0){Q=211}else{if((c[b+2504>>2]|0)==1){if((d|0)==0){l=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=4614;c[o+12>>2]=11432;Ab(l|0,16,o|0)|0;Wb()}ca=+Pd(F,F,c[g+12>>2]|0);h[d+88>>3]=ca;g=c[x>>2]|0;if(ca>+h[p+312>>3]){F=g|536870913;c[x>>2]=F;l=k+52|0;c[l>>2]=(c[l>>2]|0)+1;l=k+80|0;c[l>>2]=(c[l>>2]|0)+ -1;Ca=F}else{Ca=g}if(!((Ca|0)==0|s)){if((Ca&2|0)==0){i=n;return}else{Ca=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=3344;c[o+12>>2]=11320;Ab(Ca|0,16,o|0)|0;Wb()}}}else{Q=211}}if((Q|0)==211){h[d+88>>3]=-1.7976931348623157e+308}if(!(!t?!(+h[p+112>>3]!=0.0):0)){Nd(d,b,j,e,k,f)}o=(c[x>>2]|0)>>>0>127;if(o?(a[q]|0)==0:0){i=n;return}do{if(!t){if(D){if(+h[b+200>>3]!=0.0?(c[b+2508>>2]|0)==0:0){Q=223;break}if(+h[b+208>>3]!=0.0?(c[b+2508>>2]|0)!=0:0){Q=223}}}else{Q=223}}while(0);do{if((Q|0)==223){if(o?(a[q]|0)==0:0){break}Od(d,b,j,e,k,c[f+8>>2]|0,w)}}while(0);w=a[J]|0;do{if((w<<24>>24|0)>(c[p+260>>2]|0)){c[x>>2]=c[x>>2]|33554433;f=k+40|0;c[f>>2]=(c[f>>2]|0)+1;if(s){Da=a[J]|0;break}else{i=n;return}}else{Da=w}}while(0);if((Da<<24>>24|0)<(c[p+256>>2]|0)?(c[x>>2]=c[x>>2]|67108865,p=k+36|0,c[p>>2]=(c[p>>2]|0)+1,!s):0){i=n;return}s=c[j+8828>>2]|0;p:do{if((s|0)>0){p=b+2648|0;k=b+2652|0;Da=0;while(1){if((B?(w=c[H>>2]|0,f=c[j+(Da<<2)+8028>>2]|0,(w+ -1+(c[p>>2]|0)|0)<=(f|0)):0)?((a[J]|0)+w-(c[k>>2]|0)|0)>(f|0):0){Q=236;break}if((C?(f=c[H>>2]|0,w=c[j+(Da<<2)+8028>>2]|0,(f-(a[J]|0)+(c[k>>2]|0)|0)<=(w|0)):0)?(f-(c[p>>2]|0)|0)>=(w|0):0){Q=240;break}Da=Da+1|0;if((Da|0)>=(s|0)){break p}}if((Q|0)==236){a[A]=1;break}else if((Q|0)==240){a[A]=1;break}}}while(0);c[x>>2]=c[x>>2]|2;i=n;return}function Kd(d,e,f){d=d|0;e=e|0;f=f|0;var g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,s=0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0,C=0.0,D=0.0,E=0.0,F=0.0,G=0.0,H=0.0,I=0.0,J=0.0,K=0.0,L=0.0,M=0.0,N=0.0,O=0.0,P=0.0,Q=0.0,R=0.0,S=0.0;g=i;i=i+16|0;j=g;if(!(f>>>0<2)){if((f|0)!=2){f=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=3766;c[j+12>>2]=10968;Ab(f|0,16,j|0)|0;Wb()}k=+h[d+536>>3];if(k!=0.0?(l=+h[e+16>>3],m=+h[d+568>>3],l>m):0){n=k*(l-m)+0.0}else{n=0.0}m=+h[d+544>>3];if(m!=0.0?(l=+h[e+16>>3],k=+h[d+568>>3],l<k):0){o=n+m*(k-l)}else{o=n}n=+h[d+456>>3];if(n!=0.0?(l=+h[e+24>>3],k=+h[d+592>>3],l>k):0){p=o+n*(l-k)}else{p=o}o=+h[d+464>>3];if(o!=0.0?(k=+h[e+24>>3],l=+h[d+592>>3],k<l):0){q=p+o*(l-k)}else{q=p}p=+h[d+488>>3];if(p!=0.0?(f=a[e+112|0]|0,s=c[d+652>>2]|0,(f|0)<(s|0)):0){t=q+p*+(s-f|0)}else{t=q}q=+h[d+480>>3];if(q!=0.0?(f=a[e+112|0]|0,s=c[d+652>>2]|0,(f|0)>(s|0)):0){u=t+q*+(f-s|0)}else{u=t}t=+h[d+408>>3];if(t!=0.0?(c[d+2504>>2]|0)==0:0){v=u+t*+h[e+72>>3]}else{v=u}u=+h[d+424>>3];s=c[d+2504>>2]|0;do{if(!(u!=0.0&(s|0)==0)){if((s|0)==1){t=+h[d+416>>3];do{if(t!=0.0){q=+h[e+16>>3]- +h[d+528>>3];p=+h[e+72>>3];if(!(q<=p)){w=v+t*(1.0/(q+1.0-p));break}else{w=v+t*(p-(q+-1.0));break}}else{w=v}}while(0);t=+h[d+432>>3];do{if(t!=0.0){q=+h[e+16>>3]- +h[d+528>>3];p=+h[e+80>>3];if(!(q<=p)){x=w+t*(1.0/(q+1.0-p));break}else{x=w+t*(p-(q+-1.0));break}}else{x=w}}while(0);t=+h[d+472>>3];if(t!=0.0){q=+h[e+16>>3]- +h[d+528>>3];p=+h[e+88>>3];if(!(q<=p)){y=x+t*(1.0/(q+1.0-p));break}else{y=x+t*(p-(q+-1.0));break}}else{y=x}}else{y=v}}else{y=v+u*+h[e+80>>3]}}while(0);u=+h[d+496>>3];if(u!=0.0){z=y+u*+(a[e+113|0]|0)}else{z=y}y=+h[d+512>>3];if(y!=0.0){A=z+y*+h[(c[e+8>>2]|0)+(b[e+6>>1]<<3)>>3]}else{A=z}z=+h[d+520>>3];if(!(z!=0.0)){B=A;i=g;return+B}B=A+z*+((c[d+44>>2]|0)-(c[e+60>>2]|0)|0);i=g;return+B}z=+h[d+184>>3];if(z!=0.0?(A=+h[e+16>>3],y=+h[d+216>>3],A>y):0){C=z*(A-y)+0.0}else{C=0.0}y=+h[d+192>>3];if(y!=0.0?(A=+h[e+16>>3],z=+h[d+216>>3],A<z):0){D=C+y*(z-A)}else{D=C}C=+h[d+104>>3];if(C!=0.0?(A=+h[e+24>>3],z=+h[d+240>>3],A>z):0){E=D+C*(A-z)}else{E=D}D=+h[d+112>>3];if(D!=0.0?(z=+h[e+24>>3],A=+h[d+240>>3],z<A):0){F=E+D*(A-z)}else{F=E}E=+h[d+136>>3];if(E!=0.0?(s=a[e+112|0]|0,f=c[d+300>>2]|0,(s|0)<(f|0)):0){G=F+E*+(f-s|0)}else{G=F}F=+h[d+128>>3];if(F!=0.0?(s=a[e+112|0]|0,f=c[d+300>>2]|0,(s|0)>(f|0)):0){H=G+F*+(s-f|0)}else{H=G}f=c[d+2504>>2]|0;do{if((f|0)==1){G=+h[d+64>>3];do{if(G!=0.0){F=+h[e+16>>3]- +h[d+176>>3];E=+h[e+72>>3];if(!(F<=E)){I=H+G*(1.0/(F+1.0-E));break}else{I=H+G*(E-(F+-1.0));break}}else{I=H}}while(0);G=+h[d+80>>3];do{if(G!=0.0){F=+h[e+16>>3]- +h[d+176>>3];E=+h[e+80>>3];if(!(F<=E)){J=I+G*(1.0/(F+1.0-E));break}else{J=I+G*(E-(F+-1.0));break}}else{J=I}}while(0);G=+h[d+120>>3];if(G!=0.0){F=+h[e+16>>3]- +h[d+176>>3];E=+h[e+88>>3];if(!(F<=E)){K=J+G*(1.0/(F+1.0-E));break}else{K=J+G*(E-(F+-1.0));break}}else{K=J}}else if((f|0)==0){F=+h[d+56>>3];if(F!=0.0){L=H+F*+h[e+72>>3]}else{L=H}F=+h[d+72>>3];if(F!=0.0){K=L+F*+h[e+80>>3]}else{K=L}}else{s=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=3652;c[j+12>>2]=10968;Ab(s|0,16,j|0)|0;Wb()}}while(0);L=+h[d+144>>3];if(L!=0.0){M=K+L*+(a[e+113|0]|0)}else{M=K}K=+h[d+160>>3];if(K!=0.0){N=M+K*+h[(c[e+8>>2]|0)+(b[e+6>>1]<<3)>>3]}else{N=M}f=c[e+116>>2]|0;if((f&4|0)==0){if((f&16|0)!=0){f=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=3667;c[j+12>>2]=10976;Ab(f|0,16,j|0)|0;Wb()}M=+h[d+152>>3];if(M!=0.0){O=N+M*+h[e+32>>3]}else{O=N}}else{O=N}N=+h[d+96>>3];if(N!=0.0){P=O+N*+h[e+48>>3]}else{P=O}O=+h[d+168>>3];if(O!=0.0){Q=P+O*+((c[d+44>>2]|0)-(c[e+60>>2]|0)|0)}else{Q=P}P=+h[d+200>>3];do{if(P!=0.0?(c[d+2508>>2]|0)==0:0){O=+h[e+96>>3];N=+h[e+104>>3];M=O>N?O:N;if(M!=-1.7976931348623157e+308){R=Q+P*M;break}else{f=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=3680;c[j+12>>2]=11016;Ab(f|0,16,j|0)|0;Wb()}}else{R=Q}}while(0);Q=+h[d+208>>3];if(!(Q!=0.0)){B=R;i=g;return+B}if((c[d+2508>>2]|0)!=1){B=R;i=g;return+B}P=+h[e+96>>3];M=+h[e+104>>3];N=P>M?P:M;if(!(N!=-1.7976931348623157e+308)){f=c[r>>2]|0;c[j>>2]=c[2];c[j+4>>2]=56;c[j+8>>2]=3687;c[j+12>>2]=11080;Ab(f|0,16,j|0)|0;Wb()}M=+h[e+16>>3]- +h[d+176>>3];if(!(M<=N)){S=R}else{S=R+Q*(N-(M+-1.0))}if(!(M>N)){B=S;i=g;return+B}B=S+Q*(1.0/(M+1.0-N));i=g;return+B}function Ld(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;var k=0,l=0,m=0,n=0.0;k=i;i=i+16|0;l=k;if((b|0)==0){m=c[r>>2]|0;c[l>>2]=c[2];c[l+4>>2]=56;c[l+8>>2]=4562;c[l+12>>2]=11432;Ab(m|0,16,l|0)|0;Wb()}n=+Qd(g,j,c[f>>2]|0);h[b+72>>3]=n;if(n>+h[d+280>>3]?(l=b+116|0,c[l>>2]=c[l>>2]|32769,l=e+44|0,c[l>>2]=(c[l>>2]|0)+1,l=e+80|0,c[l>>2]=(c[l>>2]|0)+ -1,(a[b+114|0]|0)==0):0){i=k;return}n=+Qd(g,j,c[f+4>>2]|0);h[b+80>>3]=n;if(!(n>+h[d+288>>3])){i=k;return}d=b+116|0;c[d>>2]=c[d>>2]|65537;d=e+48|0;c[d>>2]=(c[d>>2]|0)+1;d=e+80|0;c[d>>2]=(c[d>>2]|0)+ -1;i=k;return}function Md(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;var k=0,l=0,m=0,n=0.0;k=i;i=i+16|0;l=k;if((b|0)==0){m=c[r>>2]|0;c[l>>2]=c[2];c[l+4>>2]=56;c[l+8>>2]=4590;c[l+12>>2]=11432;Ab(m|0,16,l|0)|0;Wb()}n=+Pd(g,j,c[f>>2]|0);h[b+72>>3]=n;if(n>+h[d+296>>3]?(l=b+116|0,c[l>>2]=c[l>>2]|32769,l=e+44|0,c[l>>2]=(c[l>>2]|0)+1,l=e+80|0,c[l>>2]=(c[l>>2]|0)+ -1,(a[b+114|0]|0)==0):0){i=k;return}n=+Pd(g,j,c[f+4>>2]|0);h[b+80>>3]=n;if(!(n>+h[d+304>>3])){i=k;return}d=b+116|0;c[d>>2]=c[d>>2]|65537;d=e+48|0;c[d>>2]=(c[d>>2]|0)+1;d=e+80|0;c[d>>2]=(c[d>>2]|0)+ -1;i=k;return}function Nd(d,e,f,g,j,k){d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0.0,I=0.0,J=0,K=0,L=0,M=0;l=i;i=i+80|0;m=l+37|0;n=l;o=(g|0)==2;if(o){p=e+400|0;q=e+720|0}else{p=e+48|0;q=e+368|0}r=~~+h[q>>3];q=c[p>>2]|0;p=c[d+56>>2]|0;s=a[d+112|0]|0;if((g&-3|0)==0){t=p}else{t=p+1-(s<<24>>24)|0}p=c[f+8868>>2]|0;f=s<<24>>24;u=f+t|0;if(s<<24>>24>0){s=t;do{a[m+(s-t)|0]=a[p+s|0]|0;s=s+1|0}while((s|0)<(u|0))}a[m+f|0]=0;vd(m,n);if((Yd(q)|0)<=0){i=l;return}f=q+36|0;u=un(c[f>>2]<<3)|0;if((u|0)==0){Oa(232,1)}s=d+8|0;c[s>>2]=u;u=d+4|0;b[u>>1]=0;p=d+6|0;b[p>>1]=0;c[d>>2]=c[c[q>>2]>>2];if((c[f>>2]|0)<=0){i=l;return}t=(g|0)==0;g=q+12|0;v=q+4|0;w=e+36|0;e=k+16|0;x=k+8|0;y=+(r<<16>>16);r=d+116|0;z=j+56|0;A=j+80|0;j=d+114|0;B=k+12|0;C=q+8|0;D=0;E=0;F=0;while(1){G=+h[(c[g>>2]|0)+(D<<3)>>3];do{if(!t){if(o){H=+Qd(m,c[(c[v>>2]|0)+(D<<2)>>2]|0,c[((c[w>>2]|0)==0?k:B)>>2]|0);break}else{H=+Qd(n,c[(c[C>>2]|0)+(D<<2)>>2]|0,c[((c[w>>2]|0)==0?k:e)>>2]|0);break}}else{H=+Qd(m,c[(c[v>>2]|0)+(D<<2)>>2]|0,c[((c[w>>2]|0)==0?x:e)>>2]|0)}}while(0);I=G*H;if(I>32767.0|I<-32768.0){J=19;break}h[(c[s>>2]|0)+(D<<3)>>3]=I;if(I>+(E|0)){b[p>>1]=D;c[d>>2]=c[(c[q>>2]|0)+(D<<2)>>2];K=~~I}else{K=E}if(I<+(F|0)){b[u>>1]=D;L=~~I}else{L=F}if(I>y?(c[r>>2]=c[r>>2]|4194305,c[z>>2]=(c[z>>2]|0)+1,c[A>>2]=(c[A>>2]|0)+ -1,(a[j]|0)==0):0){J=27;break}M=D+1|0;if((M|0)<(c[f>>2]|0)){D=M;E=K;F=L}else{J=27;break}}if((J|0)==19){Wb()}else if((J|0)==27){i=l;return}}function Od(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0.0,H=0.0,I=0.0,J=0,K=0,L=0,M=0,N=0,O=0;l=i;i=i+80|0;m=l+37|0;n=l;o=b+121|0;if((a[o]|0)!=0){i=l;return}p=c[b+56>>2]|0;q=a[b+112|0]|0;r=q<<24>>24;if((f&-3|0)==0){s=p;t=p+ -1+r|0}else{s=p+1-r|0;t=p}p=c[e+8868>>2]|0;u=r+s|0;if(q<<24>>24>0){q=s;do{a[m+(q-s)|0]=a[p+q|0]|0;q=q+1|0}while((q|0)<(u|0))}a[m+r|0]=0;vd(m,n);if(!(f>>>0<2)){i=l;return}r=d+2508|0;u=c[r>>2]|0;if((u|0)==0){q=d+376|0;if(!(((!(+h[q>>3]>=0.0)?!(+h[d+200>>3]>0.0):0)?!(+h[d+2448>>3]>=0.0):0)?!(+h[d+2624>>3]>0.0):0)){v=13}do{if((v|0)==13){p=e+8876|0;w=c[p>>2]|0;x=c[e+8832>>2]|0;y=x+s|0;z=x+t|0;x=e+8880|0;if((f|0)==0){A=y;B=z;C=m;D=w;E=x}else{F=(Un(w|0)|0)+ -1|0;A=F-z|0;B=F-y|0;C=n;D=c[x>>2]|0;E=p}p=c[E>>2]|0;x=D+A|0;y=a[x]|0;a[x]=0;G=+Qd(C,D,j);a[x]=y;H=+Qd(C,D+(B+1)|0,j);y=b+96|0;h[y>>3]=G>H?G:H;H=+Qd(C,p,j);h[b+104>>3]=H;G=+h[q>>3];if(G>=0.0){I=+h[y>>3];if((I>H?I:H)>G){y=b+116|0;c[y>>2]=c[y>>2]|8388609;y=g+76|0;c[y>>2]=(c[y>>2]|0)+1;y=g+80|0;c[y>>2]=(c[y>>2]|0)+ -1;break}else{a[o]=1;break}}}}while(0);J=c[r>>2]|0}else{J=u}if((J|0)!=1){i=l;return}J=d+384|0;if(((!(+h[J>>3]>=0.0)?!(+h[d+208>>3]>0.0):0)?!(+h[d+2456>>3]>=0.0):0)?!(+h[d+2632>>3]>0.0):0){i=l;return}d=e+8876|0;u=c[d>>2]|0;r=c[e+8832>>2]|0;q=r+s|0;s=r+t|0;t=e+8880|0;if((f|0)==1){K=q;L=s;M=n;N=u;O=t}else{n=(Un(u|0)|0)+ -1|0;K=n-s|0;L=n-q|0;M=m;N=c[t>>2]|0;O=d}d=c[O>>2]|0;O=N+K|0;K=a[O]|0;a[O]=0;G=+Pd(M,N,k);a[O]=K;H=+Pd(M,N+(L+1)|0,k);L=b+96|0;h[L>>3]=G>H?G:H;H=+Pd(M,d,k);h[b+104>>3]=H;G=+h[J>>3];if(!(G>=0.0)){i=l;return}I=+h[L>>3];if((I>H?I:H)>G){L=b+116|0;c[L>>2]=c[L>>2]|8388609;L=g+76|0;c[L>>2]=(c[L>>2]|0)+1;L=g+80|0;c[L>>2]=(c[L>>2]|0)+ -1;i=l;return}else{a[o]=1;i=l;return}}function Pd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0.0;e=i;i=i+288|0;f=e+272|0;g=e;Fb(a|0,b|0,d|0,g|0);j=+h[g+256>>3];if(!(j<=1.7976931348623157e+308)){d=c[r>>2]|0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4495;c[f+12>>2]=11336;Ab(d|0,16,f|0)|0;Wb()}if(!(j==-+h[o>>3])){i=e;return+(j<0.0?0.0:j)}if((c[(mc()|0)>>2]|0)==12){Oa(232,1)}e=c[100]|0;if((e|0)!=0){vn(e)}e=un((Un(g|0)|0)+1|0)|0;c[100]=e;if((e|0)==0){Oa(232,1)}bo(e|0,g|0)|0;c[98]=1;Oa(232,1);return 0.0}function Qd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,j=0,k=0.0,l=0.0,m=0.0,n=0.0;e=i;i=i+12848|0;f=e+12824|0;g=e;j=c[d+12>>2]|0;if((j|0)==3|(j|0)==0?(j=Un(b|0)|0,j>>>0<3):0){k=+(j>>>0);i=e;return+k}Za(a|0,b|0,d|0,g|0);d=g+12816|0;l=+h[d>>3];if(!(l<=32767.0)){b=c[r>>2]|0;c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4448;c[f+12>>2]=11376;Ab(b|0,16,f|0)|0;Wb()}if(l==-2147483648.0){if((c[(mc()|0)>>2]|0)==12){Oa(232,1)}b=c[r>>2]|0;ic(c[g>>2]|0,b|0)|0;m=+h[d>>3];if(m!=-2147483648.0){n=m}else{c[f>>2]=c[2];c[f+4>>2]=56;c[f+8>>2]=4459;c[f+12>>2]=11400;Ab(b|0,16,f|0)|0;Wb()}}else{n=l}if(n<0.0){k=0.0;i=e;return+k}k=n/100.0;i=e;return+k}function Rd(b,d,e,f,g,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;m=i;i=i+336|0;n=m+256|0;o=m;p=m+293|0;q=m+128|0;s=q+0|0;t=s+128|0;do{c[s>>2]=0;s=s+4|0}while((s|0)<(t|0));a[p]=0;u=e+12|0;if((c[u>>2]|0)==1){vd(b,p)}else{Um(p,b,36)|0}v=g+8868|0;w=Un(c[v>>2]|0)|0;if((w|0)==2147483647){x=c[r>>2]|0;c[n>>2]=c[2];c[n+4>>2]=56;c[n+8>>2]=2700;c[n+12>>2]=10648;Ab(x|0,16,n|0)|0;Wb()}x=Un(b|0)|0;a:do{if((w|0)>-1){y=x&255;z=q+112|0;A=q+56|0;B=(x|0)>0;C=n+x|0;D=f+32|0;E=q+114|0;F=q+115|0;G=e+16|0;H=q+116|0;I=q+8|0;J=q+40|0;K=e+8|0;L=e+4|0;M=w;b:while(1){a[n]=0;a[z]=y;if((c[u>>2]|0)==1){N=M+x|0;if((N|0)<=(w|0)){c[A>>2]=N+ -1;O=c[v>>2]|0;if(B){P=M;while(1){a[n+(P-M)|0]=a[O+P|0]|0;Q=P+1|0;if((Q|0)<(N|0)){P=Q}else{R=16;break}}}else{R=16}}}else{P=M-x|0;if(!((P|0)<-1)){N=P+1|0;c[A>>2]=N;P=c[v>>2]|0;O=M+1|0;if(B){Q=N;while(1){a[n+(Q-N)|0]=a[P+Q|0]|0;S=Q+1|0;if((S|0)<(O|0)){Q=S}else{R=16;break}}}else{R=16}}}do{if((R|0)==16?(R=0,a[C]=0,(wd(p,n)|0)==0):0){a[E]=(c[D>>2]|0)!=0|0;a[F]=0;c[G>>2]=(c[G>>2]|0)+1;Jd(f,q,c[u>>2]|0,j,k,g,G,l,n);if((c[H>>2]|0)>>>0>127?(a[E]|0)==0:0){Q=c[I>>2]|0;if((Q|0)==0){break}vn(Q);c[I>>2]=0;break}h[J>>3]=+Kd(f,q,c[u>>2]|0);s=o+0|0;Q=q+0|0;t=s+128|0;do{c[s>>2]=c[Q>>2];s=s+4|0;Q=Q+4|0}while((s|0)<(t|0));O=c[e>>2]|0;if((O|0)==0){c[K>>2]=2e3;P=un(256e3)|0;if((P|0)==0){R=22;break b}c[e>>2]=P;T=2e3;U=P}else{T=c[K>>2]|0;U=O}O=c[L>>2]|0;if((O+1|0)<(T|0)){V=U;W=O}else{O=(T>>1)+T|0;c[K>>2]=O;P=xn(U,O<<7)|0;if((P|0)==0){R=26;break b}c[e>>2]=P;V=P;W=c[L>>2]|0}s=V+(W<<7)+0|0;Q=o+0|0;t=s+128|0;do{c[s>>2]=c[Q>>2];s=s+4|0;Q=Q+4|0}while((s|0)<(t|0));c[L>>2]=(c[L>>2]|0)+1;Q=c[A>>2]|0;P=c[d>>2]|0;if((Q|0)<(P|0)?(c[u>>2]|0)!=1:0){c[d>>2]=Q;X=Q}else{X=P}if((Q|0)>(X|0)?(c[u>>2]|0)==1:0){c[d>>2]=Q}}}while(0);if((M|0)<=0){Y=L;break a}M=M+ -1|0}if((R|0)==22){Oa(232,1)}else if((R|0)==26){Oa(232,1)}}else{Y=e+4|0}}while(0);R=c[Y>>2]|0;c[e+96>>2]=R;if((R|0)==0){Z=1;i=m;return Z|0}if((R|0)<=1){Z=0;i=m;return Z|0}R=l+444|0;if((zd(R,784,11440)|0)!=0){Oa(232,1)}if((yd(R,b)|0)==0){Z=0;i=m;return Z|0}else{Oa(232,1)}return 0}function Sd(b,d,e,f,g,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0;n=i;i=i+320|0;o=n+256|0;p=n;q=n+272|0;s=n+128|0;t=s+0|0;u=t+128|0;do{c[t>>2]=0;t=t+4|0}while((t|0)<(u|0));v=c[g+2416>>2]|0;if((v|0)>0){w=0;x=2147483647;while(1){y=c[g+(w<<2)+816>>2]|0;z=(y|0)<(x|0)?y:x;y=w+1|0;if((y|0)<(v|0)){w=y;x=z}else{A=z;break}}}else{A=2147483647}x=j+8868|0;w=Un(c[x>>2]|0)|0;if((w|0)==2147483647){v=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=2578;c[o+12>>2]=10648;Ab(v|0,16,o|0)|0;Wb()}o=f+12|0;if((c[o>>2]|0)==2){B=g+660|0;C=g+656|0}else{B=g+308|0;C=g+304|0}v=c[B>>2]|0;B=c[C>>2]|0;if((d|0)<0){D=f+4|0;E=c[D>>2]|0;F=f+96|0;c[F>>2]=E;G=(E|0)==0;H=G&1;i=n;return H|0}C=(B|0)>(v|0);z=s+112|0;y=m+424|0;I=s+56|0;J=s+114|0;K=s+115|0;L=f+16|0;M=s+116|0;N=s+8|0;O=s+40|0;P=f+8|0;Q=f+4|0;R=w+~A|0;S=d+b|0;a:while(1){a[q]=0;b:do{if(!C){d=S+1|0;T=B;while(1){a[z]=T;U=c[o>>2]|0;do{if((U|0)==1){V=T+S|0;if((V|0)<(A|0)?(c[y>>2]|0)==0:0){W=46;break}if((V|0)>(w|0)){break b}c[I>>2]=V+ -1;X=c[x>>2]|0;if((T|0)>0){Y=S;do{a[q+(Y-S)|0]=a[X+Y|0]|0;Y=Y+1|0}while((Y|0)<(V|0))}a[q+T|0]=0;W=26}else{V=S-T|0;if((V|0)>(R|0)?(c[y>>2]|U|0)==0:0){W=46;break}if((V|0)<-1){break b}Y=V+1|0;c[I>>2]=Y;V=c[x>>2]|0;if((T|0)>0){X=Y;do{a[q+(X-Y)|0]=a[V+X|0]|0;X=X+1|0}while((X|0)<(d|0))}a[q+T|0]=0;W=26}}while(0);do{if((W|0)==26){W=0;a[J]=0;a[K]=0;c[L>>2]=(c[L>>2]|0)+1;Jd(g,s,U,k,l,j,L,m,q);X=c[M>>2]|0;if(X>>>0>127?(a[J]|0)==0:0){V=c[N>>2]|0;if((V|0)==0){Z=X}else{vn(V);c[N>>2]=0;Z=c[M>>2]|0}if((Z&310297344|0)==0&(T|0)<(v|0)){break}else{break b}}h[O>>3]=+Kd(g,s,c[o>>2]|0);t=p+0|0;V=s+0|0;u=t+128|0;do{c[t>>2]=c[V>>2];t=t+4|0;V=V+4|0}while((t|0)<(u|0));X=c[f>>2]|0;if((X|0)==0){c[P>>2]=2e3;Y=un(256e3)|0;if((Y|0)==0){W=31;break a}c[f>>2]=Y;_=2e3;$=Y}else{_=c[P>>2]|0;$=X}X=c[Q>>2]|0;if((X+1|0)<(_|0)){aa=$;ba=X}else{X=(_>>1)+_|0;c[P>>2]=X;Y=xn($,X<<7)|0;if((Y|0)==0){W=35;break a}c[f>>2]=Y;aa=Y;ba=c[Q>>2]|0}t=aa+(ba<<7)+0|0;V=p+0|0;u=t+128|0;do{c[t>>2]=c[V>>2];t=t+4|0;V=V+4|0}while((t|0)<(u|0));c[Q>>2]=(c[Q>>2]|0)+1;V=c[I>>2]|0;Y=c[e>>2]|0;if((V|0)<(Y|0)?(c[o>>2]|0)!=1:0){c[e>>2]=V;ca=V}else{ca=Y}if((V|0)>(ca|0)?(c[o>>2]|0)==1:0){c[e>>2]=V;W=46}else{W=46}}}while(0);if((W|0)==46?(W=0,(T|0)>=(v|0)):0){break b}T=T+1|0}}}while(0);if((S|0)>(b|0)){S=S+ -1|0}else{D=Q;W=49;break}}if((W|0)==31){Oa(232,1)}else if((W|0)==35){Oa(232,1)}else if((W|0)==49){E=c[D>>2]|0;F=f+96|0;c[F>>2]=E;G=(E|0)==0;H=G&1;i=n;return H|0}return 0}function Td(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0;l=i;m=(b|0)>-1;if((b|a|0)>-1){Ud(a,((c[e+12>>2]|0)==1?a-b|0:b-a|0)+1|0,d,e,f,g,h,j,k)|0;i=l;return}if((a|0)>-1){n=c[f+304>>2]|0;o=f+308|0;if((n|0)>(c[o>>2]|0)){i=l;return}else{p=n}while(1){Ud(a,p,d,e,f,g,h,j,k)|0;if((p|0)<(c[o>>2]|0)){p=p+1|0}else{break}}i=l;return}if(!m){if((zd(k+444|0,784,11496)|0)==0){i=l;return}else{Oa(232,1)}}m=c[f+304>>2]|0;p=f+308|0;if((m|0)>(c[p>>2]|0)){i=l;return}o=e+12|0;a=b+ -1|0;n=b+1|0;b=m;while(1){Ud((c[o>>2]|0)==1?a+b|0:n-b|0,b,d,e,f,g,h,j,k)|0;if((b|0)<(c[p>>2]|0)){b=b+1|0}else{break}}i=l;return}function Ud(b,d,e,f,g,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+320|0;o=n+256|0;p=n;q=n+272|0;s=n+128|0;t=s+0|0;u=t+128|0;do{c[t>>2]=0;t=t+4|0}while((t|0)<(u|0));v=c[j+8868>>2]|0;w=Un(v|0)|0;if((w|0)==2147483647){x=c[r>>2]|0;c[o>>2]=c[2];c[o+4>>2]=56;c[o+8>>2]=2808;c[o+12>>2]=10648;Ab(x|0,16,o|0)|0;Wb()}if(!((b|0)>-1&(w|0)>(b|0))){y=1;i=n;return y|0}o=f+12|0;x=c[o>>2]|0;if((x|0)==1){if((b+1-d|0)<0){y=1;i=n;return y|0}a[q]=0;a[s+112|0]=d;z=b-d+1|0;c[s+56>>2]=b;A=b+1|0;if((d|0)>0){B=z;do{a[q+(B-z)|0]=a[v+B|0]|0;B=B+1|0}while((B|0)<(A|0))}a[q+d|0]=0}else{if((d+b|0)>(w|0)){y=1;i=n;return y|0}a[q]=0;a[s+112|0]=d;c[s+56>>2]=b;w=d+b|0;if((d|0)>0){A=b;do{a[q+(A-b)|0]=a[v+A|0]|0;A=A+1|0}while((A|0)<(w|0))}a[q+d|0]=0}d=s+114|0;a[d]=(c[g+32>>2]|0)!=0|0;a[s+115|0]=0;w=f+16|0;c[w>>2]=(c[w>>2]|0)+1;Jd(g,s,x,k,l,j,w,m,q);if((c[s+116>>2]|0)>>>0>127?(a[d]|0)==0:0){d=s+8|0;q=c[d>>2]|0;if((q|0)==0){C=1}else{vn(q);c[d>>2]=0;C=1}}else{h[s+40>>3]=+Kd(g,s,c[o>>2]|0);t=p+0|0;g=s+0|0;u=t+128|0;do{c[t>>2]=c[g>>2];t=t+4|0;g=g+4|0}while((t|0)<(u|0));d=c[f>>2]|0;q=f+8|0;do{if((d|0)==0){c[q>>2]=2e3;m=un(256e3)|0;if((m|0)==0){Oa(232,1)}else{c[f>>2]=m;D=2e3;E=m;break}}else{D=c[q>>2]|0;E=d}}while(0);d=f+4|0;m=c[d>>2]|0;do{if((m+1|0)>=(D|0)){w=(D>>1)+D|0;c[q>>2]=w;j=xn(E,w<<7)|0;if((j|0)==0){Oa(232,1)}else{c[f>>2]=j;F=j;G=c[d>>2]|0;break}}else{F=E;G=m}}while(0);t=F+(G<<7)+0|0;g=p+0|0;u=t+128|0;do{c[t>>2]=c[g>>2];t=t+4|0;g=g+4|0}while((t|0)<(u|0));c[d>>2]=(c[d>>2]|0)+1;d=c[s+56>>2]|0;s=c[e>>2]|0;if((d|0)<(s|0)?(c[o>>2]|0)!=1:0){c[e>>2]=d;H=d}else{H=s}if((d|0)>(H|0)?(c[o>>2]|0)==1:0){c[e>>2]=d;C=0}else{C=0}}c[f+96>>2]=c[f+4>>2];y=C;i=n;return y|0}function Vd(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0.0,z=0.0,A=0,B=0,C=0,D=0;f=i;h=c[e+8>>2]|0;j=e+4|0;c[j>>2]=h;k=d+4|0;l=c[k>>2]|0;m=(l|0)==0;a:do{if(!m){n=l+ -1|0;o=(n&l|0)==0;if(o){p=n&h}else{p=(h>>>0)%(l>>>0)|0}q=c[(c[d>>2]|0)+(p<<2)>>2]|0;if((q|0)==0){r=p}else{s=q;while(1){q=c[s>>2]|0;if((q|0)==0){r=p;break a}t=c[q+4>>2]|0;if(o){u=t&n}else{u=(t>>>0)%(l>>>0)|0}if((u|0)!=(p|0)){r=p;break a}if((c[q+8>>2]|0)==(h|0)){v=0;w=q;break}else{s=q}}c[b>>2]=w;x=b+4|0;a[x]=v;i=f;return}}else{r=0}}while(0);h=d+12|0;y=+(((c[h>>2]|0)+1|0)>>>0);z=+g[d+16>>2];do{if(y>+(l>>>0)*z|m){if(l>>>0>2){A=(l+ -1&l|0)==0}else{A=0}p=(A&1|l<<1)^1;u=~~+ea(+(y/z))>>>0;Wd(d,p>>>0<u>>>0?u:p);p=c[k>>2]|0;u=c[j>>2]|0;s=p+ -1|0;if((s&p|0)==0){B=p;C=s&u;break}else{B=p;C=(u>>>0)%(p>>>0)|0;break}}else{B=l;C=r}}while(0);r=c[(c[d>>2]|0)+(C<<2)>>2]|0;if((r|0)==0){l=d+8|0;c[e>>2]=c[l>>2];c[l>>2]=e;c[(c[d>>2]|0)+(C<<2)>>2]=l;l=c[e>>2]|0;if((l|0)!=0){C=c[l+4>>2]|0;l=B+ -1|0;if((l&B|0)==0){D=C&l}else{D=(C>>>0)%(B>>>0)|0}c[(c[d>>2]|0)+(D<<2)>>2]=e}}else{c[e>>2]=c[r>>2];c[r>>2]=e}c[h>>2]=(c[h>>2]|0)+1;v=1;w=e;c[b>>2]=w;x=b+4|0;a[x]=v;i=f;return}function Wd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,h=0,j=0;d=i;if((b|0)!=1){if((b+ -1&b|0)==0){e=b}else{e=_e(b)|0}}else{e=2}b=c[a+4>>2]|0;if(e>>>0>b>>>0){Xd(a,e);i=d;return}if(!(e>>>0<b>>>0)){i=d;return}if(b>>>0>2){f=(b+ -1&b|0)==0}else{f=0}h=~~+ea(+(+((c[a+12>>2]|0)>>>0)/+g[a+16>>2]))>>>0;if(f){j=1<<32-(ao(h+ -1|0)|0)}else{j=_e(h)|0}h=e>>>0<j>>>0?j:e;if(!(h>>>0<b>>>0)){i=d;return}Xd(a,h);i=d;return}function Xd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;d=i;e=(b|0)!=0;if(e){f=An(b<<2)|0}else{f=0}g=c[a>>2]|0;c[a>>2]=f;if((g|0)!=0){Cn(g)}c[a+4>>2]=b;if(e){h=0}else{i=d;return}do{c[(c[a>>2]|0)+(h<<2)>>2]=0;h=h+1|0}while((h|0)!=(b|0));h=a+8|0;e=c[h>>2]|0;if((e|0)==0){i=d;return}g=c[e+4>>2]|0;f=b+ -1|0;j=(f&b|0)==0;if(j){k=g&f}else{k=(g>>>0)%(b>>>0)|0}c[(c[a>>2]|0)+(k<<2)>>2]=h;h=c[e>>2]|0;if((h|0)==0){i=d;return}else{l=e;m=h;n=k;o=e}a:while(1){e=l;k=m;h=o;b:while(1){p=k;while(1){g=c[p+4>>2]|0;if(j){q=g&f}else{q=(g>>>0)%(b>>>0)|0}if((q|0)==(n|0)){break}r=(c[a>>2]|0)+(q<<2)|0;if((c[r>>2]|0)==0){break b}g=p+8|0;s=p;while(1){t=c[s>>2]|0;if((t|0)==0){break}if((c[g>>2]|0)==(c[t+8>>2]|0)){s=t}else{break}}c[e>>2]=t;c[s>>2]=c[c[(c[a>>2]|0)+(q<<2)>>2]>>2];c[c[(c[a>>2]|0)+(q<<2)>>2]>>2]=p;g=c[e>>2]|0;if((g|0)==0){u=25;break a}else{p=g}}g=c[p>>2]|0;if((g|0)==0){u=25;break a}else{e=p;k=g;h=p}}c[r>>2]=h;k=c[p>>2]|0;if((k|0)==0){u=25;break}else{l=p;m=k;n=q;o=p}}if((u|0)==25){i=d;return}}function Yd(a){a=a|0;var b=0;if((a|0)==0){b=0}else{b=c[a+36>>2]|0}return b|0}function Zd(a){a=a|0;Sa(a|0)|0;Ka()}function _d(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;b=i;i=i+16|0;d=b;e=c[s>>2]|0;ue(13376,e,13432);c[3166]=15276;c[12672>>2]=15296;c[12668>>2]=0;Af(12672|0,13376);c[12744>>2]=0;c[12748>>2]=-1;f=c[t>>2]|0;c[3370]=15144;Dk(13484|0);c[13488>>2]=0;c[13492>>2]=0;c[13496>>2]=0;c[13500>>2]=0;c[13504>>2]=0;c[13508>>2]=0;c[3370]=13992;c[13512>>2]=f;Ek(d,13484|0);g=Gk(d,17936)|0;Fk(d);c[13516>>2]=g;c[13520>>2]=13440;a[13524|0]=(Ac[c[(c[g>>2]|0)+28>>2]&127](g)|0)&1;c[3188]=15356;c[12756>>2]=15376;Af(12756|0,13480);c[12828>>2]=0;c[12832>>2]=-1;g=c[r>>2]|0;c[3382]=15144;Dk(13532|0);c[13536>>2]=0;c[13540>>2]=0;c[13544>>2]=0;c[13548>>2]=0;c[13552>>2]=0;c[13556>>2]=0;c[3382]=13992;c[13560>>2]=g;Ek(d,13532|0);h=Gk(d,17936)|0;Fk(d);c[13564>>2]=h;c[13568>>2]=13448;a[13572|0]=(Ac[c[(c[h>>2]|0)+28>>2]&127](h)|0)&1;c[3210]=15356;c[12844>>2]=15376;Af(12844|0,13528);c[12916>>2]=0;c[12920>>2]=-1;h=c[(c[(c[3210]|0)+ -12>>2]|0)+12864>>2]|0;c[3232]=15356;c[12932>>2]=15376;Af(12932|0,h);c[13004>>2]=0;c[13008>>2]=-1;c[(c[(c[3166]|0)+ -12>>2]|0)+12736>>2]=12752;h=(c[(c[3210]|0)+ -12>>2]|0)+12844|0;c[h>>2]=c[h>>2]|8192;c[(c[(c[3210]|0)+ -12>>2]|0)+12912>>2]=12752;ge(13576,e,13456|0);c[3254]=15316;c[13024>>2]=15336;c[13020>>2]=0;Af(13024|0,13576);c[13096>>2]=0;c[13100>>2]=-1;c[3408]=15208;Dk(13636|0);c[13640>>2]=0;c[13644>>2]=0;c[13648>>2]=0;c[13652>>2]=0;c[13656>>2]=0;c[13660>>2]=0;c[3408]=13736;c[13664>>2]=f;Ek(d,13636|0);f=Gk(d,17944)|0;Fk(d);c[13668>>2]=f;c[13672>>2]=13464;a[13676|0]=(Ac[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;c[3276]=15396;c[13108>>2]=15416;Af(13108|0,13632);c[13180>>2]=0;c[13184>>2]=-1;c[3420]=15208;Dk(13684|0);c[13688>>2]=0;c[13692>>2]=0;c[13696>>2]=0;c[13700>>2]=0;c[13704>>2]=0;c[13708>>2]=0;c[3420]=13736;c[13712>>2]=g;Ek(d,13684|0);g=Gk(d,17944)|0;Fk(d);c[13716>>2]=g;c[13720>>2]=13472;a[13724|0]=(Ac[c[(c[g>>2]|0)+28>>2]&127](g)|0)&1;c[3298]=15396;c[13196>>2]=15416;Af(13196|0,13680);c[13268>>2]=0;c[13272>>2]=-1;g=c[(c[(c[3298]|0)+ -12>>2]|0)+13216>>2]|0;c[3320]=15396;c[13284>>2]=15416;Af(13284|0,g);c[13356>>2]=0;c[13360>>2]=-1;c[(c[(c[3254]|0)+ -12>>2]|0)+13088>>2]=13104;g=(c[(c[3298]|0)+ -12>>2]|0)+13196|0;c[g>>2]=c[g>>2]|8192;c[(c[(c[3298]|0)+ -12>>2]|0)+13264>>2]=13104;i=b;return}function $d(a){a=a|0;a=i;fg(12752)|0;fg(12928)|0;kg(13104)|0;kg(13280)|0;i=a;return}function ae(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);i=b;return}function be(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);Cn(a);i=b;return}function ce(b,d){b=b|0;d=d|0;var e=0,f=0;e=i;Ac[c[(c[b>>2]|0)+24>>2]&127](b)|0;f=Gk(d,17944)|0;c[b+36>>2]=f;a[b+44|0]=(Ac[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;i=e;return}function de(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b+8|0;e=b;f=a+36|0;g=a+40|0;h=d+8|0;j=d;k=a+32|0;while(1){a=c[f>>2]|0;l=Mc[c[(c[a>>2]|0)+20>>2]&15](a,c[g>>2]|0,d,h,e)|0;a=(c[e>>2]|0)-j|0;if((yb(d|0,1,a|0,c[k>>2]|0)|0)!=(a|0)){m=-1;n=5;break}if((l|0)==2){m=-1;n=5;break}else if((l|0)!=1){n=4;break}}if((n|0)==4){m=(($b(c[k>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==5){i=b;return m|0}return 0}function ee(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;a:do{if((a[b+44|0]|0)==0){if((e|0)>0){g=d;h=0;while(1){if((Lc[c[(c[b>>2]|0)+52>>2]&31](b,c[g>>2]|0)|0)==-1){j=h;break a}k=h+1|0;if((k|0)<(e|0)){g=g+4|0;h=k}else{j=k;break}}}else{j=0}}else{j=yb(d|0,4,e|0,c[b+32>>2]|0)|0}}while(0);i=f;return j|0}function fe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e+16|0;g=e;h=e+4|0;j=e+8|0;k=(d|0)==-1;a:do{if(!k){c[g>>2]=d;if((a[b+44|0]|0)!=0){if((yb(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}c[h>>2]=f;m=g+4|0;n=b+36|0;o=b+40|0;p=f+8|0;q=f;r=b+32|0;s=g;while(1){t=c[n>>2]|0;u=Sc[c[(c[t>>2]|0)+12>>2]&15](t,c[o>>2]|0,s,m,j,f,p,h)|0;if((c[j>>2]|0)==(s|0)){l=-1;v=12;break}if((u|0)==3){v=7;break}t=(u|0)==1;if(!(u>>>0<2)){l=-1;v=12;break}u=(c[h>>2]|0)-q|0;if((yb(f|0,1,u|0,c[r>>2]|0)|0)!=(u|0)){l=-1;v=12;break}if(t){s=t?c[j>>2]|0:s}else{break a}}if((v|0)==7){if((yb(s|0,1,1,c[r>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((v|0)==12){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function ge(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;c[b>>2]=15208;h=b+4|0;Dk(h);j=b+8|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[b>>2]=13848;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;Ek(g,h);h=Gk(g,17944)|0;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=Ac[c[(c[h>>2]|0)+24>>2]&127](h)|0;h=c[e>>2]|0;a[b+53|0]=(Ac[c[(c[h>>2]|0)+28>>2]&127](h)|0)&1;if((c[d>>2]|0)>8){Qj(13944)}else{Fk(g);i=f;return}}function he(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);i=b;return}function ie(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);Cn(a);i=b;return}function je(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=Gk(d,17944)|0;d=b+36|0;c[d>>2]=f;g=b+44|0;c[g>>2]=Ac[c[(c[f>>2]|0)+24>>2]&127](f)|0;f=c[d>>2]|0;a[b+53|0]=(Ac[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;if((c[g>>2]|0)>8){Qj(13944)}else{i=e;return}}function ke(a){a=a|0;var b=0,c=0;b=i;c=ne(a,0)|0;i=b;return c|0}function le(a){a=a|0;var b=0,c=0;b=i;c=ne(a,1)|0;i=b;return c|0}function me(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;f=e+16|0;g=e;h=e+4|0;j=e+8|0;k=b+52|0;l=(a[k]|0)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;a:do{if(l){c[h>>2]=c[n>>2];o=c[b+36>>2]|0;p=Sc[c[(c[o>>2]|0)+12>>2]&15](o,c[b+40>>2]|0,h,h+4|0,j,f,f+8|0,g)|0;if((p|0)==3){a[f]=c[n>>2];c[g>>2]=f+1}else if((p|0)==1|(p|0)==2){m=-1;i=e;return m|0}p=b+32|0;while(1){o=c[g>>2]|0;if(!(o>>>0>f>>>0)){break a}q=o+ -1|0;c[g>>2]=q;if((_b(a[q]|0,c[p>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function ne(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;i=i+32|0;f=e+16|0;g=e;h=e+4|0;j=e+8|0;k=b+52|0;if((a[k]|0)!=0){l=b+48|0;m=c[l>>2]|0;if(!d){n=m;i=e;return n|0}c[l>>2]=-1;a[k]=0;n=m;i=e;return n|0}m=c[b+44>>2]|0;k=(m|0)>1?m:1;a:do{if((k|0)>0){m=b+32|0;l=0;while(1){o=Sb(c[m>>2]|0)|0;if((o|0)==-1){n=-1;break}a[f+l|0]=o;l=l+1|0;if((l|0)>=(k|0)){break a}}i=e;return n|0}}while(0);b:do{if((a[b+53|0]|0)==0){l=b+40|0;m=b+36|0;o=g+4|0;p=b+32|0;q=k;while(1){r=c[l>>2]|0;s=r;t=c[s>>2]|0;u=c[s+4>>2]|0;s=c[m>>2]|0;v=f+q|0;w=Sc[c[(c[s>>2]|0)+16>>2]&15](s,r,f,v,h,g,o,j)|0;if((w|0)==2){n=-1;x=22;break}else if((w|0)==3){x=14;break}else if((w|0)!=1){y=q;break b}w=c[l>>2]|0;c[w>>2]=t;c[w+4>>2]=u;if((q|0)==8){n=-1;x=22;break}u=Sb(c[p>>2]|0)|0;if((u|0)==-1){n=-1;x=22;break}a[v]=u;q=q+1|0}if((x|0)==14){c[g>>2]=a[f]|0;y=q;break}else if((x|0)==22){i=e;return n|0}}else{c[g>>2]=a[f]|0;y=k}}while(0);if(d){d=c[g>>2]|0;c[b+48>>2]=d;n=d;i=e;return n|0}d=b+32|0;b=y;while(1){if((b|0)<=0){break}y=b+ -1|0;if((_b(a[f+y|0]|0,c[d>>2]|0)|0)==-1){n=-1;x=22;break}else{b=y}}if((x|0)==22){i=e;return n|0}n=c[g>>2]|0;i=e;return n|0}function oe(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);i=b;return}function pe(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);Cn(a);i=b;return}function qe(b,d){b=b|0;d=d|0;var e=0,f=0;e=i;Ac[c[(c[b>>2]|0)+24>>2]&127](b)|0;f=Gk(d,17936)|0;c[b+36>>2]=f;a[b+44|0]=(Ac[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;i=e;return}function re(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+16|0;d=b+8|0;e=b;f=a+36|0;g=a+40|0;h=d+8|0;j=d;k=a+32|0;while(1){a=c[f>>2]|0;l=Mc[c[(c[a>>2]|0)+20>>2]&15](a,c[g>>2]|0,d,h,e)|0;a=(c[e>>2]|0)-j|0;if((yb(d|0,1,a|0,c[k>>2]|0)|0)!=(a|0)){m=-1;n=5;break}if((l|0)==2){m=-1;n=5;break}else if((l|0)!=1){n=4;break}}if((n|0)==4){m=(($b(c[k>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==5){i=b;return m|0}return 0}function se(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;if((a[b+44|0]|0)!=0){h=yb(e|0,1,f|0,c[b+32>>2]|0)|0;i=g;return h|0}if((f|0)>0){j=e;k=0}else{h=0;i=g;return h|0}while(1){if((Lc[c[(c[b>>2]|0)+52>>2]&31](b,d[j]|0)|0)==-1){h=k;l=6;break}e=k+1|0;if((e|0)<(f|0)){j=j+1|0;k=e}else{h=e;l=6;break}}if((l|0)==6){i=g;return h|0}return 0}function te(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+32|0;f=e+16|0;g=e+8|0;h=e;j=e+4|0;k=(d|0)==-1;a:do{if(!k){a[g]=d;if((a[b+44|0]|0)!=0){if((yb(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}c[h>>2]=f;m=g+1|0;n=b+36|0;o=b+40|0;p=f+8|0;q=f;r=b+32|0;s=g;while(1){t=c[n>>2]|0;u=Sc[c[(c[t>>2]|0)+12>>2]&15](t,c[o>>2]|0,s,m,j,f,p,h)|0;if((c[j>>2]|0)==(s|0)){l=-1;v=12;break}if((u|0)==3){v=7;break}t=(u|0)==1;if(!(u>>>0<2)){l=-1;v=12;break}u=(c[h>>2]|0)-q|0;if((yb(f|0,1,u|0,c[r>>2]|0)|0)!=(u|0)){l=-1;v=12;break}if(t){s=t?c[j>>2]|0:s}else{break a}}if((v|0)==7){if((yb(s|0,1,1,c[r>>2]|0)|0)==1){break}else{l=-1}i=e;return l|0}else if((v|0)==12){i=e;return l|0}}}while(0);l=k?0:d;i=e;return l|0}function ue(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+16|0;g=f;c[b>>2]=15144;h=b+4|0;Dk(h);j=b+8|0;c[j+0>>2]=0;c[j+4>>2]=0;c[j+8>>2]=0;c[j+12>>2]=0;c[j+16>>2]=0;c[j+20>>2]=0;c[b>>2]=14104;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;Ek(g,h);h=Gk(g,17936)|0;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=Ac[c[(c[h>>2]|0)+24>>2]&127](h)|0;h=c[e>>2]|0;a[b+53|0]=(Ac[c[(c[h>>2]|0)+28>>2]&127](h)|0)&1;if((c[d>>2]|0)>8){Qj(13944)}else{Fk(g);i=f;return}}function ve(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);i=b;return}function we(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);Cn(a);i=b;return}function xe(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=Gk(d,17936)|0;d=b+36|0;c[d>>2]=f;g=b+44|0;c[g>>2]=Ac[c[(c[f>>2]|0)+24>>2]&127](f)|0;f=c[d>>2]|0;a[b+53|0]=(Ac[c[(c[f>>2]|0)+28>>2]&127](f)|0)&1;if((c[g>>2]|0)>8){Qj(13944)}else{i=e;return}}function ye(a){a=a|0;var b=0,c=0;b=i;c=Be(a,0)|0;i=b;return c|0}function ze(a){a=a|0;var b=0,c=0;b=i;c=Be(a,1)|0;i=b;return c|0}function Ae(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;i=i+32|0;f=e+16|0;g=e;h=e+8|0;j=e+4|0;k=b+52|0;l=(a[k]|0)!=0;if((d|0)==-1){if(l){m=-1;i=e;return m|0}n=c[b+48>>2]|0;a[k]=(n|0)!=-1|0;m=n;i=e;return m|0}n=b+48|0;a:do{if(l){a[h]=c[n>>2];o=c[b+36>>2]|0;p=Sc[c[(c[o>>2]|0)+12>>2]&15](o,c[b+40>>2]|0,h,h+1|0,j,f,f+8|0,g)|0;if((p|0)==1|(p|0)==2){m=-1;i=e;return m|0}else if((p|0)==3){a[f]=c[n>>2];c[g>>2]=f+1}p=b+32|0;while(1){o=c[g>>2]|0;if(!(o>>>0>f>>>0)){break a}q=o+ -1|0;c[g>>2]=q;if((_b(a[q]|0,c[p>>2]|0)|0)==-1){m=-1;break}}i=e;return m|0}}while(0);c[n>>2]=d;a[k]=1;m=d;i=e;return m|0}function Be(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+32|0;g=f+16|0;h=f+8|0;j=f;k=f+4|0;l=b+52|0;if((a[l]|0)!=0){m=b+48|0;n=c[m>>2]|0;if(!e){o=n;i=f;return o|0}c[m>>2]=-1;a[l]=0;o=n;i=f;return o|0}n=c[b+44>>2]|0;l=(n|0)>1?n:1;a:do{if((l|0)>0){n=b+32|0;m=0;while(1){p=Sb(c[n>>2]|0)|0;if((p|0)==-1){o=-1;break}a[g+m|0]=p;m=m+1|0;if((m|0)>=(l|0)){break a}}i=f;return o|0}}while(0);b:do{if((a[b+53|0]|0)==0){m=b+40|0;n=b+36|0;p=h+1|0;q=b+32|0;r=l;while(1){s=c[m>>2]|0;t=s;u=c[t>>2]|0;v=c[t+4>>2]|0;t=c[n>>2]|0;w=g+r|0;x=Sc[c[(c[t>>2]|0)+16>>2]&15](t,s,g,w,j,h,p,k)|0;if((x|0)==2){o=-1;y=23;break}else if((x|0)==3){y=14;break}else if((x|0)!=1){z=r;break b}x=c[m>>2]|0;c[x>>2]=u;c[x+4>>2]=v;if((r|0)==8){o=-1;y=23;break}v=Sb(c[q>>2]|0)|0;if((v|0)==-1){o=-1;y=23;break}a[w]=v;r=r+1|0}if((y|0)==14){a[h]=a[g]|0;z=r;break}else if((y|0)==23){i=f;return o|0}}else{a[h]=a[g]|0;z=l}}while(0);do{if(!e){l=b+32|0;k=z;while(1){if((k|0)<=0){y=21;break}j=k+ -1|0;if((_b(d[g+j|0]|0,c[l>>2]|0)|0)==-1){o=-1;y=23;break}else{k=j}}if((y|0)==21){A=a[h]|0;break}else if((y|0)==23){i=f;return o|0}}else{k=a[h]|0;c[b+48>>2]=k&255;A=k}}while(0);o=A&255;i=f;return o|0}function Ce(){var a=0;a=i;_d(0);uc(116,13368,q|0)|0;i=a;return}function De(a){a=a|0;return}function Ee(a){a=a|0;var b=0;b=a+4|0;c[b>>2]=(c[b>>2]|0)+1;return}function Fe(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=a+4|0;e=c[d>>2]|0;c[d>>2]=e+ -1;if((e|0)!=0){f=0;i=b;return f|0}yc[c[(c[a>>2]|0)+8>>2]&127](a);f=1;i=b;return f|0}function Ge(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a>>2]=14248;e=Un(b|0)|0;f=Bn(e+13|0)|0;c[f+4>>2]=e;c[f>>2]=e;g=f+12|0;c[a+4>>2]=g;c[f+8>>2]=0;Xn(g|0,b|0,e+1|0)|0;i=d;return}function He(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14248;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)<0){Dn((c[d>>2]|0)+ -12|0)}ab(a|0);Cn(a);i=b;return}function Ie(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14248;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)>=0){ab(a|0);i=b;return}Dn((c[d>>2]|0)+ -12|0);ab(a|0);i=b;return}function Je(a){a=a|0;return c[a+4>>2]|0}function Ke(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;c[b>>2]=14272;if((a[d]&1)==0){f=d+1|0}else{f=c[d+8>>2]|0}d=Un(f|0)|0;g=Bn(d+13|0)|0;c[g+4>>2]=d;c[g>>2]=d;h=g+12|0;c[b+4>>2]=h;c[g+8>>2]=0;Xn(h|0,f|0,d+1|0)|0;i=e;return}function Le(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a>>2]=14272;e=Un(b|0)|0;f=Bn(e+13|0)|0;c[f+4>>2]=e;c[f>>2]=e;g=f+12|0;c[a+4>>2]=g;c[f+8>>2]=0;Xn(g|0,b|0,e+1|0)|0;i=d;return}function Me(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14272;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)<0){Dn((c[d>>2]|0)+ -12|0)}ab(a|0);Cn(a);i=b;return}function Ne(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14272;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)>=0){ab(a|0);i=b;return}Dn((c[d>>2]|0)+ -12|0);ab(a|0);i=b;return}function Oe(a){a=a|0;return c[a+4>>2]|0}function Pe(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14248;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)<0){Dn((c[d>>2]|0)+ -12|0)}ab(a|0);Cn(a);i=b;return}function Qe(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;c[a>>2]=14272;d=a+4|0;e=(c[d>>2]|0)+ -4|0;f=c[e>>2]|0;c[e>>2]=f+ -1;if((f+ -1|0)<0){Dn((c[d>>2]|0)+ -12|0)}ab(a|0);Cn(a);i=b;return}function Re(a){a=a|0;return}function Se(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function Te(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+16|0;f=e;Qc[c[(c[a>>2]|0)+12>>2]&3](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function Ue(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((c[b+4>>2]|0)!=(a|0)){f=0;i=e;return f|0}f=(c[b>>2]|0)==(d|0);i=e;return f|0}function Ve(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;d=i;f=rc(e|0)|0;e=Un(f|0)|0;if(e>>>0>4294967279){af(0)}if(e>>>0<11){a[b]=e<<1;g=b+1|0;Xn(g|0,f|0,e|0)|0;h=g+e|0;a[h]=0;i=d;return}else{j=e+16&-16;k=An(j)|0;c[b+8>>2]=k;c[b>>2]=j|1;c[b+4>>2]=e;g=k;Xn(g|0,f|0,e|0)|0;h=g+e|0;a[h]=0;i=d;return}}function We(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;g=f;h=c[d>>2]|0;if((h|0)!=0){j=a[e]|0;if((j&1)==0){k=(j&255)>>>1}else{k=c[e+4>>2]|0}if((k|0)==0){l=h}else{lf(e,14488,2)|0;l=c[d>>2]|0}h=c[d+4>>2]|0;Qc[c[(c[h>>2]|0)+24>>2]&3](g,h,l);l=a[g]|0;if((l&1)==0){m=g+1|0;n=(l&255)>>>1}else{m=c[g+8>>2]|0;n=c[g+4>>2]|0}lf(e,m,n)|0;if(!((a[g]&1)==0)){Cn(c[g+8>>2]|0)}}c[b+0>>2]=c[e+0>>2];c[b+4>>2]=c[e+4>>2];c[b+8>>2]=c[e+8>>2];c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;i=f;return}function Xe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;g=f+12|0;h=f;j=Un(e|0)|0;if(j>>>0>4294967279){af(0)}if(j>>>0<11){a[h]=j<<1;k=h+1|0}else{l=j+16&-16;m=An(l)|0;c[h+8>>2]=m;c[h>>2]=l|1;c[h+4>>2]=j;k=m}Xn(k|0,e|0,j|0)|0;a[k+j|0]=0;We(g,d,h);Ke(b,g);if(!((a[g]&1)==0)){Cn(c[g+8>>2]|0)}if(!((a[h]&1)==0)){Cn(c[h+8>>2]|0)}c[b>>2]=14504;h=d;d=c[h+4>>2]|0;g=b+8|0;c[g>>2]=c[h>>2];c[g+4>>2]=d;i=f;return}function Ye(a){a=a|0;var b=0;b=i;Ne(a);Cn(a);i=b;return}function Ze(a){a=a|0;var b=0;b=i;Ne(a);i=b;return}function _e(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;b=i;if(a>>>0<212){d=14640;e=48;a:while(1){f=e;while(1){if((f|0)==0){break a}g=(f|0)/2|0;if((c[d+(g<<2)>>2]|0)>>>0<a>>>0){break}else{f=g}}d=d+(g+1<<2)|0;e=f+ -1-g|0}h=c[d>>2]|0;i=b;return h|0}if(a>>>0>4294967291){d=Gb(8)|0;Le(d,15024);c[d>>2]=14432;pc(d|0,14472,11)}d=(a>>>0)/210|0;g=d*210|0;e=a-g|0;a=14832;j=48;b:while(1){k=j;while(1){if((k|0)==0){break b}l=(k|0)/2|0;if((c[a+(l<<2)>>2]|0)>>>0<e>>>0){break}else{k=l}}a=a+(l+1<<2)|0;j=k+ -1-l|0}l=a-14832>>2;a=l;j=d;d=(c[14832+(l<<2)>>2]|0)+g|0;c:while(1){g=5;while(1){l=c[14640+(g<<2)>>2]|0;e=(d>>>0)/(l>>>0)|0;if(e>>>0<l>>>0){h=d;m=118;break c}f=g+1|0;if((d|0)==(fa(e,l)|0)){break}if(f>>>0<47){g=f}else{m=19;break}}d:do{if((m|0)==19){m=0;if(d>>>0<44521){h=d;m=118;break c}g=(d>>>0)/211|0;k=211;while(1){if((d|0)==(fa(g,k)|0)){break d}f=k+10|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+12|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+16|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+18|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+22|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+28|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+30|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+36|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+40|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+42|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+46|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+52|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+58|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+60|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+66|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+70|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+72|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+78|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+82|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+88|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+96|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+100|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+102|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+106|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+108|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+112|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+120|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+126|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+130|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+136|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+138|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+142|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+148|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+150|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+156|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+162|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+166|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+168|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+172|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+178|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+180|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+186|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+190|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+192|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+196|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+198|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}if((d|0)==(fa(l,f)|0)){break d}f=k+208|0;l=(d>>>0)/(f>>>0)|0;if(l>>>0<f>>>0){h=d;m=118;break c}e=k+210|0;if((d|0)==(fa(l,f)|0)){break d}f=(d>>>0)/(e>>>0)|0;if(f>>>0<e>>>0){h=d;m=118;break c}else{g=f;k=e}}}}while(0);k=a+1|0;g=(k|0)==48;e=g?0:k;k=(g&1)+j|0;a=e;j=k;d=(c[14832+(e<<2)>>2]|0)+(k*210|0)|0}if((m|0)==118){i=b;return h|0}return 0}function $e(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=i;bc(15048)|0;if((c[a>>2]|0)==1){do{Zb(15072,15048)|0}while((c[a>>2]|0)==1)}if((c[a>>2]|0)==0){c[a>>2]=1;jc(15048)|0;yc[d&127](b);bc(15048)|0;c[a>>2]=-1;jc(15048)|0;Qb(15072)|0;i=e;return}else{jc(15048)|0;i=e;return}}function af(a){a=a|0;a=Gb(8)|0;Ge(a,15120);c[a>>2]=14328;pc(a|0,14368,9)}function bf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;if((a[d]&1)==0){c[b+0>>2]=c[d+0>>2];c[b+4>>2]=c[d+4>>2];c[b+8>>2]=c[d+8>>2];i=e;return}f=c[d+8>>2]|0;g=c[d+4>>2]|0;if(g>>>0>4294967279){af(0)}if(g>>>0<11){a[b]=g<<1;h=b+1|0}else{d=g+16&-16;j=An(d)|0;c[b+8>>2]=j;c[b>>2]=d|1;c[b+4>>2]=g;h=j}Xn(h|0,f|0,g|0)|0;a[h+g|0]=0;i=e;return}function cf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;if(e>>>0>4294967279){af(0)}if(e>>>0<11){a[b]=e<<1;g=b+1|0}else{h=e+16&-16;j=An(h)|0;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=e;g=j}Xn(g|0,d|0,e|0)|0;a[g+e|0]=0;i=f;return}function df(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;if(d>>>0>4294967279){af(0)}if(d>>>0<11){a[b]=d<<1;g=b+1|0}else{h=d+16&-16;j=An(h)|0;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=d;g=j}Zn(g|0,e|0,d|0)|0;a[g+d|0]=0;i=f;return}function ef(b){b=b|0;var d=0;d=i;if((a[b]&1)==0){i=d;return}Cn(c[b+8>>2]|0);i=d;return}function ff(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=Un(d|0)|0;g=a[b]|0;if((g&1)==0){h=g;j=10}else{g=c[b>>2]|0;h=g&255;j=(g&-2)+ -1|0}g=(h&1)==0;if(j>>>0<f>>>0){if(g){k=(h&255)>>>1}else{k=c[b+4>>2]|0}mf(b,j,f-j|0,k,0,k,f,d);i=e;return b|0}if(g){l=b+1|0}else{l=c[b+8>>2]|0}Yn(l|0,d|0,f|0)|0;a[l+f|0]=0;if((a[b]&1)==0){a[b]=f<<1;i=e;return b|0}else{c[b+4>>2]=f;i=e;return b|0}return 0}function gf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;g=a[b]|0;h=(g&1)==0;if(h){j=(g&255)>>>1}else{j=c[b+4>>2]|0}if(j>>>0<d>>>0){hf(b,d-j|0,e)|0;i=f;return}if(h){a[b+d+1|0]=0;a[b]=d<<1;i=f;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;i=f;return}}function hf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;if((d|0)==0){i=f;return b|0}g=a[b]|0;if((g&1)==0){h=10;j=g}else{g=c[b>>2]|0;h=(g&-2)+ -1|0;j=g&255}if((j&1)==0){k=(j&255)>>>1}else{k=c[b+4>>2]|0}if((h-k|0)>>>0<d>>>0){nf(b,h,d-h+k|0,k,k,0,0);l=a[b]|0}else{l=j}if((l&1)==0){m=b+1|0}else{m=c[b+8>>2]|0}Zn(m+k|0,e|0,d|0)|0;e=k+d|0;if((a[b]&1)==0){a[b]=e<<1}else{c[b+4>>2]=e}a[m+e|0]=0;i=f;return b|0}function jf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;if(d>>>0>4294967279){af(0)}f=a[b]|0;if((f&1)==0){g=10;h=f}else{f=c[b>>2]|0;g=(f&-2)+ -1|0;h=f&255}if((h&1)==0){j=(h&255)>>>1}else{j=c[b+4>>2]|0}f=j>>>0>d>>>0?j:d;if(f>>>0<11){k=10}else{k=(f+16&-16)+ -1|0}if((k|0)==(g|0)){i=e;return}do{if((k|0)!=10){f=k+1|0;if(k>>>0>g>>>0){l=An(f)|0}else{l=An(f)|0}if((h&1)==0){m=l;n=1;o=b+1|0;p=0;break}else{m=l;n=1;o=c[b+8>>2]|0;p=1;break}}else{m=b+1|0;n=0;o=c[b+8>>2]|0;p=1}}while(0);if((h&1)==0){q=(h&255)>>>1}else{q=c[b+4>>2]|0}Xn(m|0,o|0,q+1|0)|0;if(p){Cn(o)}if(n){c[b>>2]=k+1|1;c[b+4>>2]=j;c[b+8>>2]=m;i=e;return}else{a[b]=j<<1;i=e;return}}function kf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=a[b]|0;g=(f&1)!=0;if(g){h=(c[b>>2]&-2)+ -1|0;j=c[b+4>>2]|0}else{h=10;j=(f&255)>>>1}if((j|0)==(h|0)){nf(b,h,1,h,h,0,0);if((a[b]&1)==0){k=7}else{k=8}}else{if(g){k=8}else{k=7}}if((k|0)==7){a[b]=(j<<1)+2;l=b+1|0;m=j+1|0;n=l+j|0;a[n]=d;o=l+m|0;a[o]=0;i=e;return}else if((k|0)==8){k=c[b+8>>2]|0;g=j+1|0;c[b+4>>2]=g;l=k;m=g;n=l+j|0;a[n]=d;o=l+m|0;a[o]=0;i=e;return}}function lf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=a[b]|0;if((g&1)==0){h=10;j=g}else{g=c[b>>2]|0;h=(g&-2)+ -1|0;j=g&255}if((j&1)==0){k=(j&255)>>>1}else{k=c[b+4>>2]|0}if((h-k|0)>>>0<e>>>0){mf(b,h,e-h+k|0,k,k,0,e,d);i=f;return b|0}if((e|0)==0){i=f;return b|0}if((j&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}Xn(l+k|0,d|0,e|0)|0;d=k+e|0;if((a[b]&1)==0){a[b]=d<<1}else{c[b+4>>2]=d}a[l+d|0]=0;i=f;return b|0}function mf(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=i;if((-18-d|0)>>>0<e>>>0){af(0)}if((a[b]&1)==0){m=b+1|0}else{m=c[b+8>>2]|0}if(d>>>0<2147483623){n=e+d|0;e=d<<1;o=n>>>0<e>>>0?e:n;if(o>>>0<11){p=11}else{p=o+16&-16}}else{p=-17}o=An(p)|0;if((g|0)!=0){Xn(o|0,m|0,g|0)|0}if((j|0)!=0){Xn(o+g|0,k|0,j|0)|0}k=f-h|0;if((k|0)!=(g|0)){Xn(o+(j+g)|0,m+(h+g)|0,k-g|0)|0}if((d|0)==10){q=b+8|0;c[q>>2]=o;r=p|1;c[b>>2]=r;s=k+j|0;t=b+4|0;c[t>>2]=s;u=o+s|0;a[u]=0;i=l;return}Cn(m);q=b+8|0;c[q>>2]=o;r=p|1;c[b>>2]=r;s=k+j|0;t=b+4|0;c[t>>2]=s;u=o+s|0;a[u]=0;i=l;return}function nf(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;k=i;if((-17-d|0)>>>0<e>>>0){af(0)}if((a[b]&1)==0){l=b+1|0}else{l=c[b+8>>2]|0}if(d>>>0<2147483623){m=e+d|0;e=d<<1;n=m>>>0<e>>>0?e:m;if(n>>>0<11){o=11}else{o=n+16&-16}}else{o=-17}n=An(o)|0;if((g|0)!=0){Xn(n|0,l|0,g|0)|0}m=f-h|0;if((m|0)!=(g|0)){Xn(n+(j+g)|0,l+(h+g)|0,m-g|0)|0}if((d|0)==10){p=b+8|0;c[p>>2]=n;q=o|1;c[b>>2]=q;i=k;return}Cn(l);p=b+8|0;c[p>>2]=n;q=o|1;c[b>>2]=q;i=k;return}function of(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;if(e>>>0>1073741807){af(0)}if(e>>>0<2){a[b]=e<<1;g=b+4|0}else{h=e+4&-4;j=An(h<<2)|0;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=e;g=j}Wm(g,d,e)|0;c[g+(e<<2)>>2]=0;i=f;return}function pf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;if(d>>>0>1073741807){af(0)}if(d>>>0<2){a[b]=d<<1;g=b+4|0}else{h=d+4&-4;j=An(h<<2)|0;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=d;g=j}Ym(g,e,d)|0;c[g+(d<<2)>>2]=0;i=f;return}function qf(b){b=b|0;var d=0;d=i;if((a[b]&1)==0){i=d;return}Cn(c[b+8>>2]|0);i=d;return}function rf(a,b){a=a|0;b=b|0;var c=0,d=0;c=i;d=sf(a,b,Vm(b)|0)|0;i=c;return d|0}function sf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;g=a[b]|0;if((g&1)==0){h=1;j=g}else{g=c[b>>2]|0;h=(g&-2)+ -1|0;j=g&255}g=(j&1)==0;if(h>>>0<e>>>0){if(g){k=(j&255)>>>1}else{k=c[b+4>>2]|0}vf(b,h,e-h|0,k,0,k,e,d);i=f;return b|0}if(g){l=b+4|0}else{l=c[b+8>>2]|0}Xm(l,d,e)|0;c[l+(e<<2)>>2]=0;if((a[b]&1)==0){a[b]=e<<1;i=f;return b|0}else{c[b+4>>2]=e;i=f;return b|0}return 0}function tf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;e=i;if(d>>>0>1073741807){af(0)}f=a[b]|0;if((f&1)==0){g=1;h=f}else{f=c[b>>2]|0;g=(f&-2)+ -1|0;h=f&255}if((h&1)==0){j=(h&255)>>>1}else{j=c[b+4>>2]|0}f=j>>>0>d>>>0?j:d;if(f>>>0<2){k=1}else{k=(f+4&-4)+ -1|0}if((k|0)==(g|0)){i=e;return}do{if((k|0)!=1){f=(k<<2)+4|0;if(k>>>0>g>>>0){l=An(f)|0}else{l=An(f)|0}if((h&1)==0){m=l;n=1;o=b+4|0;p=0;break}else{m=l;n=1;o=c[b+8>>2]|0;p=1;break}}else{m=b+4|0;n=0;o=c[b+8>>2]|0;p=1}}while(0);if((h&1)==0){q=(h&255)>>>1}else{q=c[b+4>>2]|0}Wm(m,o,q+1|0)|0;if(p){Cn(o)}if(n){c[b>>2]=k+1|1;c[b+4>>2]=j;c[b+8>>2]=m;i=e;return}else{a[b]=j<<1;i=e;return}}function uf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;f=a[b]|0;g=(f&1)!=0;if(g){h=(c[b>>2]&-2)+ -1|0;j=c[b+4>>2]|0}else{h=1;j=(f&255)>>>1}if((j|0)==(h|0)){wf(b,h,1,h,h,0,0);if((a[b]&1)==0){k=7}else{k=8}}else{if(g){k=8}else{k=7}}if((k|0)==7){a[b]=(j<<1)+2;l=b+4|0;m=j+1|0;n=l+(j<<2)|0;c[n>>2]=d;o=l+(m<<2)|0;c[o>>2]=0;i=e;return}else if((k|0)==8){k=c[b+8>>2]|0;g=j+1|0;c[b+4>>2]=g;l=k;m=g;n=l+(j<<2)|0;c[n>>2]=d;o=l+(m<<2)|0;c[o>>2]=0;i=e;return}}function vf(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;l=i;if((1073741806-d|0)>>>0<e>>>0){af(0)}if((a[b]&1)==0){m=b+4|0}else{m=c[b+8>>2]|0}if(d>>>0<536870887){n=e+d|0;e=d<<1;o=n>>>0<e>>>0?e:n;if(o>>>0<2){p=2}else{p=o+4&-4}}else{p=1073741807}o=An(p<<2)|0;if((g|0)!=0){Wm(o,m,g)|0}if((j|0)!=0){Wm(o+(g<<2)|0,k,j)|0}k=f-h|0;if((k|0)!=(g|0)){Wm(o+(j+g<<2)|0,m+(h+g<<2)|0,k-g|0)|0}if((d|0)==1){q=b+8|0;c[q>>2]=o;r=p|1;c[b>>2]=r;s=k+j|0;t=b+4|0;c[t>>2]=s;u=o+(s<<2)|0;c[u>>2]=0;i=l;return}Cn(m);q=b+8|0;c[q>>2]=o;r=p|1;c[b>>2]=r;s=k+j|0;t=b+4|0;c[t>>2]=s;u=o+(s<<2)|0;c[u>>2]=0;i=l;return}function wf(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;k=i;if((1073741807-d|0)>>>0<e>>>0){af(0)}if((a[b]&1)==0){l=b+4|0}else{l=c[b+8>>2]|0}if(d>>>0<536870887){m=e+d|0;e=d<<1;n=m>>>0<e>>>0?e:m;if(n>>>0<2){o=2}else{o=n+4&-4}}else{o=1073741807}n=An(o<<2)|0;if((g|0)!=0){Wm(n,l,g)|0}m=f-h|0;if((m|0)!=(g|0)){Wm(n+(j+g<<2)|0,l+(h+g<<2)|0,m-g|0)|0}if((d|0)==1){p=b+8|0;c[p>>2]=n;q=o|1;c[b>>2]=q;i=k;return}Cn(l);p=b+8|0;c[p>>2]=n;q=o|1;c[b>>2]=q;i=k;return}function xf(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;i=i+16|0;f=e+8|0;g=e;h=(c[b+24>>2]|0)==0;if(h){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((h&1|d)&c[b+20>>2]|0)==0){i=e;return}e=Gb(16)|0;if((a[15488]|0)==0?(La(15488)|0)!=0:0){c[3870]=16184;uc(41,15480,q|0)|0;jb(15488)}b=g;c[b>>2]=1;c[b+4>>2]=15480;c[f+0>>2]=c[g+0>>2];c[f+4>>2]=c[g+4>>2];Xe(e,f,15536);c[e>>2]=15504;pc(e|0,15584,37)}function yf(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;c[a>>2]=15528;d=c[a+40>>2]|0;e=a+32|0;f=a+36|0;if((d|0)!=0){g=d;do{g=g+ -1|0;Qc[c[(c[e>>2]|0)+(g<<2)>>2]&3](0,a,c[(c[f>>2]|0)+(g<<2)>>2]|0)}while((g|0)!=0)}Fk(a+28|0);vn(c[e>>2]|0);vn(c[f>>2]|0);vn(c[a+48>>2]|0);vn(c[a+60>>2]|0);i=b;return}function zf(a,b){a=a|0;b=b|0;var c=0;c=i;Ek(a,b+28|0);i=c;return}function Af(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;b=a+28|0;e=a+32|0;a=e+40|0;do{c[e>>2]=0;e=e+4|0}while((e|0)<(a|0));Dk(b);i=d;return}function Bf(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);Cn(a);i=b;return}function Cf(a){a=a|0;var b=0;b=i;c[a>>2]=15144;Fk(a+4|0);i=b;return}function Df(a,b){a=a|0;b=b|0;return}function Ef(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function Ff(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function Gf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=a;c[e>>2]=0;c[e+4>>2]=0;e=a+8|0;c[e>>2]=-1;c[e+4>>2]=-1;return}function Hf(a){a=a|0;return 0}function If(a){a=a|0;return 0}function Jf(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;if((e|0)<=0){g=0;i=f;return g|0}h=b+12|0;j=b+16|0;k=d;d=0;while(1){l=c[h>>2]|0;if(l>>>0<(c[j>>2]|0)>>>0){c[h>>2]=l+1;m=a[l]|0}else{l=Ac[c[(c[b>>2]|0)+40>>2]&127](b)|0;if((l|0)==-1){g=d;n=8;break}m=l&255}a[k]=m;l=d+1|0;if((l|0)<(e|0)){k=k+1|0;d=l}else{g=l;n=8;break}}if((n|0)==8){i=f;return g|0}return 0}function Kf(a){a=a|0;return-1}function Lf(a){a=a|0;var b=0,e=0,f=0;b=i;if((Ac[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){e=-1;i=b;return e|0}f=a+12|0;a=c[f>>2]|0;c[f>>2]=a+1;e=d[a]|0;i=b;return e|0}function Mf(a,b){a=a|0;b=b|0;return-1}function Nf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;if((f|0)<=0){h=0;i=g;return h|0}j=b+24|0;k=b+28|0;l=e;e=0;while(1){m=c[j>>2]|0;if(!(m>>>0<(c[k>>2]|0)>>>0)){if((Lc[c[(c[b>>2]|0)+52>>2]&31](b,d[l]|0)|0)==-1){h=e;n=7;break}}else{o=a[l]|0;c[j>>2]=m+1;a[m]=o}o=e+1|0;if((o|0)<(f|0)){l=l+1|0;e=o}else{h=o;n=7;break}}if((n|0)==7){i=g;return h|0}return 0}function Of(a,b){a=a|0;b=b|0;return-1}function Pf(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);Cn(a);i=b;return}function Qf(a){a=a|0;var b=0;b=i;c[a>>2]=15208;Fk(a+4|0);i=b;return}function Rf(a,b){a=a|0;b=b|0;return}function Sf(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function Tf(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function Uf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=a;c[e>>2]=0;c[e+4>>2]=0;e=a+8|0;c[e>>2]=-1;c[e+4>>2]=-1;return}function Vf(a){a=a|0;return 0}function Wf(a){a=a|0;return 0}function Xf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;if((d|0)<=0){f=0;i=e;return f|0}g=a+12|0;h=a+16|0;j=b;b=0;while(1){k=c[g>>2]|0;if(!(k>>>0<(c[h>>2]|0)>>>0)){l=Ac[c[(c[a>>2]|0)+40>>2]&127](a)|0;if((l|0)==-1){f=b;m=8;break}else{n=l}}else{c[g>>2]=k+4;n=c[k>>2]|0}c[j>>2]=n;k=b+1|0;if((k|0)>=(d|0)){f=k;m=8;break}j=j+4|0;b=k}if((m|0)==8){i=e;return f|0}return 0}function Yf(a){a=a|0;return-1}function Zf(a){a=a|0;var b=0,d=0,e=0;b=i;if((Ac[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){d=-1;i=b;return d|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+4;d=c[a>>2]|0;i=b;return d|0}function _f(a,b){a=a|0;b=b|0;return-1}function $f(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0;e=i;if((d|0)<=0){f=0;i=e;return f|0}g=a+24|0;h=a+28|0;j=b;b=0;while(1){k=c[g>>2]|0;if(!(k>>>0<(c[h>>2]|0)>>>0)){if((Lc[c[(c[a>>2]|0)+52>>2]&31](a,c[j>>2]|0)|0)==-1){f=b;l=8;break}}else{m=c[j>>2]|0;c[g>>2]=k+4;c[k>>2]=m}m=b+1|0;if((m|0)>=(d|0)){f=m;l=8;break}j=j+4|0;b=m}if((l|0)==8){i=e;return f|0}return 0}function ag(a,b){a=a|0;b=b|0;return-1}function bg(a){a=a|0;var b=0;b=i;yf(a+8|0);Cn(a);i=b;return}function cg(a){a=a|0;var b=0;b=i;yf(a+8|0);i=b;return}function dg(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;yf(a+(d+8)|0);Cn(a+d|0);i=b;return}function eg(a){a=a|0;var b=0;b=i;yf(a+((c[(c[a>>2]|0)+ -12>>2]|0)+8)|0);i=b;return}function fg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;f=c[(c[b>>2]|0)+ -12>>2]|0;if((c[b+(f+24)>>2]|0)==0){i=d;return b|0}a[e]=0;c[e+4>>2]=b;if((c[b+(f+16)>>2]|0)==0){g=c[b+(f+72)>>2]|0;if((g|0)==0){h=f}else{fg(g)|0;h=c[(c[b>>2]|0)+ -12>>2]|0}a[e]=1;g=c[b+(h+24)>>2]|0;if((Ac[c[(c[g>>2]|0)+24>>2]&127](g)|0)==-1){g=c[(c[b>>2]|0)+ -12>>2]|0;xf(b+g|0,c[b+(g+16)>>2]|1)}}pg(e);i=d;return b|0}function gg(a){a=a|0;var b=0;b=i;yf(a+8|0);Cn(a);i=b;return}function hg(a){a=a|0;var b=0;b=i;yf(a+8|0);i=b;return}function ig(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;yf(a+(d+8)|0);Cn(a+d|0);i=b;return}function jg(a){a=a|0;var b=0;b=i;yf(a+((c[(c[a>>2]|0)+ -12>>2]|0)+8)|0);i=b;return}function kg(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;i=i+16|0;e=d;f=c[(c[b>>2]|0)+ -12>>2]|0;if((c[b+(f+24)>>2]|0)==0){i=d;return b|0}a[e]=0;c[e+4>>2]=b;if((c[b+(f+16)>>2]|0)==0){g=c[b+(f+72)>>2]|0;if((g|0)==0){h=f}else{kg(g)|0;h=c[(c[b>>2]|0)+ -12>>2]|0}a[e]=1;g=c[b+(h+24)>>2]|0;if((Ac[c[(c[g>>2]|0)+24>>2]&127](g)|0)==-1){g=c[(c[b>>2]|0)+ -12>>2]|0;xf(b+g|0,c[b+(g+16)>>2]|1)}}ug(e);i=d;return b|0}function lg(a){a=a|0;var b=0;b=i;yf(a+4|0);Cn(a);i=b;return}function mg(a){a=a|0;var b=0;b=i;yf(a+4|0);i=b;return}function ng(a){a=a|0;var b=0,d=0;b=i;d=c[(c[a>>2]|0)+ -12>>2]|0;yf(a+(d+4)|0);Cn(a+d|0);i=b;return}function og(a){a=a|0;var b=0;b=i;yf(a+((c[(c[a>>2]|0)+ -12>>2]|0)+4)|0);i=b;return}



function Lm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+16|0;h=g;c[h>>2]=b;j=(f|0)==0?25744:f;f=c[j>>2]|0;a:do{if((d|0)==0){if((f|0)==0){k=0;i=g;return k|0}}else{if((b|0)==0){c[h>>2]=h;l=h}else{l=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((f|0)==0){m=a[d]|0;n=m&255;if(m<<24>>24>-1){c[l>>2]=n;k=m<<24>>24!=0|0;i=g;return k|0}else{m=n+ -194|0;if(m>>>0>50){break a}o=e+ -1|0;p=c[25528+(m<<2)>>2]|0;q=d+1|0;break}}else{o=e;p=f;q=d}}while(0);b:do{if((o|0)==0){r=p}else{m=a[q]|0;n=(m&255)>>>3;if((n+ -16|n+(p>>26))>>>0>7){break a}else{s=o;t=m;u=p;v=q}while(1){v=v+1|0;u=(t&255)+ -128|u<<6;s=s+ -1|0;if((u|0)>=0){break}if((s|0)==0){r=u;break b}t=a[v]|0;if(((t&255)+ -128|0)>>>0>63){break a}}c[j>>2]=0;c[l>>2]=u;k=e-s|0;i=g;return k|0}}while(0);c[j>>2]=r;k=-2;i=g;return k|0}}while(0);c[j>>2]=0;c[(mc()|0)>>2]=84;k=-1;i=g;return k|0}function Mm(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;g=i;i=i+1040|0;h=g+8|0;j=g;k=c[b>>2]|0;c[j>>2]=k;l=(a|0)!=0;m=l?e:256;e=l?a:h;a:do{if((k|0)==0|(m|0)==0){n=d;o=m;p=k;q=0;r=e}else{a=d;s=m;t=k;u=0;v=e;while(1){w=a>>>2;x=w>>>0>=s>>>0;if(!(x|a>>>0>131)){n=a;o=s;p=t;q=u;r=v;break a}y=x?s:w;z=a-y|0;w=Nm(v,j,y,f)|0;if((w|0)==-1){break}if((v|0)==(h|0)){A=s;B=h}else{A=s-w|0;B=v+(w<<2)|0}y=w+u|0;w=c[j>>2]|0;if((w|0)==0|(A|0)==0){n=z;o=A;p=w;q=y;r=B;break a}else{a=z;s=A;t=w;u=y;v=B}}n=z;o=0;p=c[j>>2]|0;q=-1;r=v}}while(0);b:do{if((p|0)!=0?!((o|0)==0|(n|0)==0):0){z=n;B=o;A=p;h=q;e=r;while(1){C=Lm(e,A,z,f)|0;if((C+2|0)>>>0<3){break}k=(c[j>>2]|0)+C|0;c[j>>2]=k;m=B+ -1|0;d=h+1|0;if((m|0)==0|(z|0)==(C|0)){D=d;break b}else{z=z-C|0;B=m;A=k;h=d;e=e+4|0}}if((C|0)==0){c[j>>2]=0;D=h;break}else if((C|0)==-1){D=-1;break}else{c[f>>2]=0;D=h;break}}else{D=q}}while(0);if(!l){i=g;return D|0}c[b>>2]=c[j>>2];i=g;return D|0}function Nm(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0;h=i;j=c[e>>2]|0;if((g|0)!=0?(k=c[g>>2]|0,(k|0)!=0):0){if((b|0)==0){l=f;m=k;n=j;o=16}else{c[g>>2]=0;p=b;q=f;r=k;s=j;o=36}}else{if((b|0)==0){t=f;u=j;o=7}else{v=b;w=f;x=j;o=6}}a:while(1){if((o|0)==6){o=0;if((w|0)==0){y=f;o=53;break}else{z=v;A=w;B=x}while(1){j=a[B]|0;do{if(((j&255)+ -1|0)>>>0<127?(B&3|0)==0&A>>>0>3:0){k=z;g=A;C=B;while(1){D=c[C>>2]|0;if(((D+ -16843009|D)&-2139062144|0)!=0){o=30;break}c[k>>2]=D&255;c[k+4>>2]=d[C+1|0]|0;c[k+8>>2]=d[C+2|0]|0;E=C+4|0;F=k+16|0;c[k+12>>2]=d[C+3|0]|0;G=g+ -4|0;if(G>>>0>3){k=F;g=G;C=E}else{o=31;break}}if((o|0)==30){o=0;H=k;I=g;J=D&255;K=C;break}else if((o|0)==31){o=0;H=F;I=G;J=a[E]|0;K=E;break}}else{H=z;I=A;J=j;K=B}}while(0);L=J&255;if(!((L+ -1|0)>>>0<127)){break}c[H>>2]=L;j=I+ -1|0;if((j|0)==0){y=f;o=53;break a}else{z=H+4|0;A=j;B=K+1|0}}j=L+ -194|0;if(j>>>0>50){M=H;N=I;O=K;o=47;break}p=H;q=I;r=c[25528+(j<<2)>>2]|0;s=K+1|0;o=36;continue}else if((o|0)==7){o=0;j=a[u]|0;if(((j&255)+ -1|0)>>>0<127?(u&3|0)==0:0){P=c[u>>2]|0;if(((P+ -16843009|P)&-2139062144|0)==0){Q=t;R=u;while(1){S=R+4|0;T=Q+ -4|0;U=c[S>>2]|0;if(((U+ -16843009|U)&-2139062144|0)==0){Q=T;R=S}else{V=T;W=U;X=S;break}}}else{V=t;W=P;X=u}Y=V;Z=W&255;_=X}else{Y=t;Z=j;_=u}R=Z&255;if((R+ -1|0)>>>0<127){t=Y+ -1|0;u=_+1|0;o=7;continue}Q=R+ -194|0;if(Q>>>0>50){M=b;N=Y;O=_;o=47;break}l=Y;m=c[25528+(Q<<2)>>2]|0;n=_+1|0;o=16;continue}else if((o|0)==16){o=0;Q=(d[n]|0)>>>3;if((Q+ -16|Q+(m>>26))>>>0>7){o=17;break}Q=n+1|0;if((m&33554432|0)!=0){if(((d[Q]|0)+ -128|0)>>>0>63){o=20;break}R=n+2|0;if((m&524288|0)==0){$=R}else{if(((d[R]|0)+ -128|0)>>>0>63){o=23;break}$=n+3|0}}else{$=Q}t=l+ -1|0;u=$;o=7;continue}else if((o|0)==36){o=0;Q=d[s]|0;R=Q>>>3;if((R+ -16|R+(r>>26))>>>0>7){o=37;break}R=s+1|0;aa=Q+ -128|r<<6;if((aa|0)<0){Q=(d[R]|0)+ -128|0;if(Q>>>0>63){o=40;break}S=s+2|0;ba=Q|aa<<6;if((ba|0)<0){Q=(d[S]|0)+ -128|0;if(Q>>>0>63){o=43;break}ca=Q|ba<<6;da=s+3|0}else{ca=ba;da=S}}else{ca=aa;da=R}c[p>>2]=ca;v=p+4|0;w=q+ -1|0;x=da;o=6;continue}}if((o|0)==17){ea=b;fa=l;ga=m;ha=n+ -1|0;o=46}else if((o|0)==20){ea=b;fa=l;ga=m;ha=n+ -1|0;o=46}else if((o|0)==23){ea=b;fa=l;ga=m;ha=n+ -1|0;o=46}else if((o|0)==37){ea=p;fa=q;ga=r;ha=s+ -1|0;o=46}else if((o|0)==40){ea=p;fa=q;ga=aa;ha=s+ -1|0;o=46}else if((o|0)==43){ea=p;fa=q;ga=ba;ha=s+ -1|0;o=46}else if((o|0)==53){i=h;return y|0}if((o|0)==46){if((ga|0)==0){M=ea;N=fa;O=ha;o=47}else{ia=ea;ja=ha}}if((o|0)==47){if((a[O]|0)==0){if((M|0)!=0){c[M>>2]=0;c[e>>2]=0}y=f-N|0;i=h;return y|0}else{ia=M;ja=O}}c[(mc()|0)>>2]=84;if((ia|0)==0){y=-1;i=h;return y|0}c[e>>2]=ja;y=-1;i=h;return y|0}function Om(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+16|0;h=g;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){c[h>>2]=h;k=h}else{k=b}l=a[e]|0;m=l&255;if(l<<24>>24>-1){c[k>>2]=m;j=l<<24>>24!=0|0;i=g;return j|0}l=m+ -194|0;if(!(l>>>0>50)){m=e+1|0;n=c[25528+(l<<2)>>2]|0;if(f>>>0<4?(n&-2147483648>>>((f*6|0)+ -6|0)|0)!=0:0){break}l=d[m]|0;m=l>>>3;if(!((m+ -16|m+(n>>26))>>>0>7)){m=l+ -128|n<<6;if((m|0)>=0){c[k>>2]=m;j=2;i=g;return j|0}n=(d[e+2|0]|0)+ -128|0;if(!(n>>>0>63)){l=n|m<<6;if((l|0)>=0){c[k>>2]=l;j=3;i=g;return j|0}m=(d[e+3|0]|0)+ -128|0;if(!(m>>>0>63)){c[k>>2]=m|l<<6;j=4;i=g;return j|0}}}}}}while(0);c[(mc()|0)>>2]=84;j=-1;i=g;return j|0}function Pm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;e=i;if((b|0)==0){f=1;i=e;return f|0}if(d>>>0<128){a[b]=d;f=1;i=e;return f|0}if(d>>>0<2048){a[b]=d>>>6|192;a[b+1|0]=d&63|128;f=2;i=e;return f|0}if(d>>>0<55296|(d+ -57344|0)>>>0<8192){a[b]=d>>>12|224;a[b+1|0]=d>>>6&63|128;a[b+2|0]=d&63|128;f=3;i=e;return f|0}if((d+ -65536|0)>>>0<1048576){a[b]=d>>>18|240;a[b+1|0]=d>>>12&63|128;a[b+2|0]=d>>>6&63|128;a[b+3|0]=d&63|128;f=4;i=e;return f|0}else{c[(mc()|0)>>2]=84;f=-1;i=e;return f|0}return 0}function Qm(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;f=i;i=i+272|0;g=f+8|0;h=f;j=c[b>>2]|0;c[h>>2]=j;k=(a|0)!=0;l=k?e:256;e=k?a:g;a:do{if((j|0)==0|(l|0)==0){m=d;n=l;o=j;p=0;q=e}else{a=d;r=l;s=j;t=0;u=e;while(1){v=a>>>0>=r>>>0;if(!(v|a>>>0>32)){m=a;n=r;o=s;p=t;q=u;break a}w=v?r:a;x=a-w|0;v=Rm(u,h,w,0)|0;if((v|0)==-1){break}if((u|0)==(g|0)){y=r;z=g}else{y=r-v|0;z=u+v|0}w=v+t|0;v=c[h>>2]|0;if((v|0)==0|(y|0)==0){m=x;n=y;o=v;p=w;q=z;break a}else{a=x;r=y;s=v;t=w;u=z}}m=x;n=0;o=c[h>>2]|0;p=-1;q=u}}while(0);b:do{if((o|0)!=0?!((n|0)==0|(m|0)==0):0){x=m;z=n;y=o;g=p;e=q;while(1){A=Pm(e,c[y>>2]|0,0)|0;if((A+1|0)>>>0<2){break}j=(c[h>>2]|0)+4|0;c[h>>2]=j;l=x+ -1|0;d=g+1|0;if((z|0)==(A|0)|(l|0)==0){B=d;break b}else{x=l;z=z-A|0;y=j;g=d;e=e+A|0}}if((A|0)==0){c[h>>2]=0;B=g}else{B=-1}}else{B=p}}while(0);if(!k){i=f;return B|0}c[b>>2]=c[h>>2];i=f;return B|0}function Rm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+16|0;g=f;if((b|0)==0){h=c[d>>2]|0;j=c[h>>2]|0;if((j|0)==0){k=0;i=f;return k|0}else{l=0;m=j;n=h}while(1){if(m>>>0>127){h=Pm(g,m,0)|0;if((h|0)==-1){k=-1;o=26;break}else{p=h}}else{p=1}h=p+l|0;j=n+4|0;q=c[j>>2]|0;if((q|0)==0){k=h;o=26;break}else{l=h;m=q;n=j}}if((o|0)==26){i=f;return k|0}}a:do{if(e>>>0>3){n=b;m=e;l=c[d>>2]|0;while(1){p=c[l>>2]|0;if((p|0)==0){r=n;s=m;break a}if(p>>>0>127){j=Pm(n,p,0)|0;if((j|0)==-1){k=-1;break}t=n+j|0;u=m-j|0;v=l}else{a[n]=p;t=n+1|0;u=m+ -1|0;v=c[d>>2]|0}p=v+4|0;c[d>>2]=p;if(u>>>0>3){n=t;m=u;l=p}else{r=t;s=u;break a}}i=f;return k|0}else{r=b;s=e}}while(0);b:do{if((s|0)!=0){b=r;u=s;t=c[d>>2]|0;while(1){v=c[t>>2]|0;if((v|0)==0){o=24;break}if(v>>>0>127){l=Pm(g,v,0)|0;if((l|0)==-1){k=-1;o=26;break}if(l>>>0>u>>>0){o=20;break}Pm(b,c[t>>2]|0,0)|0;w=b+l|0;x=u-l|0;y=t}else{a[b]=v;w=b+1|0;x=u+ -1|0;y=c[d>>2]|0}v=y+4|0;c[d>>2]=v;if((x|0)==0){z=0;break b}else{b=w;u=x;t=v}}if((o|0)==20){k=e-u|0;i=f;return k|0}else if((o|0)==24){a[b]=0;z=u;break}else if((o|0)==26){i=f;return k|0}}else{z=0}}while(0);c[d>>2]=0;k=e-z|0;i=f;return k|0}function Sm(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,ga=0;f=i;i=i+944|0;g=f+680|0;h=f+424|0;j=f;k=f+232|0;l=fa(d,b)|0;if((l|0)==0){i=f;return}b=l-d|0;c[k+4>>2]=d;c[k>>2]=d;m=d;n=d;o=2;while(1){p=m+d+n|0;c[k+(o<<2)>>2]=p;if(p>>>0<l>>>0){q=n;n=p;o=o+1|0;m=q}else{break}}m=0-d|0;o=a+b|0;if((b|0)>0){b=(d|0)==0;n=d>>>0>256?256:d;l=(n|0)==(d|0);q=o;p=1;r=0;s=a;t=1;while(1){do{if((p&3|0)!=3){u=t+ -1|0;a:do{if((c[k+(u<<2)>>2]|0)>>>0<(q-s|0)>>>0){c[j>>2]=s;if((t|0)>1){v=t;w=s;x=s;y=1;while(1){z=w+m|0;A=v+ -2|0;B=w+(0-((c[k+(A<<2)>>2]|0)+d))|0;if((Lc[e&31](x,B)|0)>-1?(Lc[e&31](x,z)|0)>-1:0){C=y;break}D=y+1|0;E=j+(y<<2)|0;if((Lc[e&31](B,z)|0)>-1){c[E>>2]=B;F=B;G=v+ -1|0}else{c[E>>2]=z;F=z;G=A}if((G|0)<=1){C=D;break}v=G;w=F;x=c[j>>2]|0;y=D}if((C|0)>=2?(y=j+(C<<2)|0,c[y>>2]=g,!b):0){if((C|0)>0){H=d;I=g}else{x=c[j>>2]|0;Xn(g|0,x|0,n|0)|0;if(l){break}else{J=d;K=n}while(1){J=J-K|0;K=J>>>0>256?256:J;Xn(g|0,x|0,K|0)|0;if((J|0)==(K|0)){break a}}}while(1){x=H>>>0>256?256:H;w=c[j>>2]|0;Xn(I|0,w|0,x|0)|0;v=w;w=0;while(1){D=w+1|0;A=c[j+(D<<2)>>2]|0;Xn(v|0,A|0,x|0)|0;c[j+(w<<2)>>2]=v+x;if((D|0)==(C|0)){break}else{v=A;w=D}}if((H|0)==(x|0)){break a}H=H-x|0;I=c[y>>2]|0}}}}else{Tm(s,d,e,p,r,t,0,k)}}while(0);if((t|0)==1){L=p<<1;M=p>>>31|r<<1;N=0;break}else{y=u>>>0>31;w=y?0:p;v=y?t+ -33|0:u;L=w<<v;M=w>>>(32-v|0)|(y?p:r)<<v;N=1;break}}else{c[j>>2]=s;b:do{if((t|0)>1){v=t;y=s;w=s;D=1;while(1){A=y+m|0;z=v+ -2|0;E=y+(0-((c[k+(z<<2)>>2]|0)+d))|0;if((Lc[e&31](w,E)|0)>-1?(Lc[e&31](w,A)|0)>-1:0){O=D;break}B=D+1|0;P=j+(D<<2)|0;if((Lc[e&31](E,A)|0)>-1){c[P>>2]=E;Q=E;R=v+ -1|0}else{c[P>>2]=A;Q=A;R=z}if((R|0)<=1){O=B;break}v=R;y=Q;w=c[j>>2]|0;D=B}if((O|0)>=2?(D=j+(O<<2)|0,c[D>>2]=h,!b):0){if((O|0)>0){S=d;T=h}else{w=c[j>>2]|0;Xn(h|0,w|0,n|0)|0;if(l){break}else{U=d;V=n}while(1){U=U-V|0;V=U>>>0>256?256:U;Xn(h|0,w|0,V|0)|0;if((U|0)==(V|0)){break b}}}while(1){w=S>>>0>256?256:S;y=c[j>>2]|0;Xn(T|0,y|0,w|0)|0;v=y;y=0;while(1){B=y+1|0;z=c[j+(B<<2)>>2]|0;Xn(v|0,z|0,w|0)|0;c[j+(y<<2)>>2]=v+w;if((B|0)==(O|0)){break}else{v=z;y=B}}if((S|0)==(w|0)){break b}S=S-w|0;T=c[D>>2]|0}}}}while(0);L=p>>>2|r<<30;M=r>>>2;N=t+2|0}}while(0);u=L|1;D=s+d|0;if(D>>>0<o>>>0){p=u;r=M;s=D;t=N}else{W=M;X=u;Y=D;Z=N;break}}}else{W=0;X=1;Y=a;Z=1}Tm(Y,d,e,X,W,Z,0,k);a=X;X=W;W=Y;Y=Z;while(1){if((Y|0)==1){if((a|0)==1){if((X|0)==0){break}else{_=52}}}else{_=52}if((_|0)==52?(_=0,(Y|0)>=2):0){Z=a>>>30;N=Y+ -2|0;M=(a<<1&2147483646|Z<<31)^3;t=(Z|X<<2)>>>1;Tm(W+(0-((c[k+(N<<2)>>2]|0)+d))|0,d,e,M,t,Y+ -1|0,1,k);s=t<<1|Z&1;Z=M<<1|1;M=W+m|0;Tm(M,d,e,Z,s,N,1,k);a=Z;X=s;W=M;Y=N;continue}N=a+ -1|0;if((N|0)!=0){if((N&1|0)==0){M=N;N=0;do{N=N+1|0;M=M>>>1}while((M&1|0)==0);if((N|0)!=0){$=N}else{_=57}}else{_=57}if((_|0)==57){_=0;if((X|0)!=0){if((X&1|0)==0){M=X;s=0;while(1){Z=s+1|0;t=M>>>1;if((t&1|0)==0){M=t;s=Z}else{aa=Z;break}}}else{aa=0}}else{aa=32}$=(aa|0)==0?0:aa+32|0}if($>>>0>31){ba=$;_=62}else{ca=$;da=a;ea=X;ga=$}}else{ba=32;_=62}if((_|0)==62){_=0;ca=ba+ -32|0;da=X;ea=0;ga=ba}a=ea<<32-ca|da>>>ca;X=ea>>>ca;W=W+m|0;Y=ga+Y|0}i=f;return}function Tm(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;k=i;i=i+752|0;l=k+232|0;m=k+488|0;n=k;c[n>>2]=a;o=0-b|0;a:do{if((e|0)==1&(f|0)==0){p=a;q=g;r=h;s=1;t=18}else{u=g;v=a;w=h;x=e;y=f;z=a;A=1;while(1){B=v+(0-(c[j+(u<<2)>>2]|0))|0;if((Lc[d&31](B,z)|0)<1){p=v;q=u;r=w;s=A;t=18;break a}if((w|0)==0&(u|0)>1){C=c[j+(u+ -2<<2)>>2]|0;if((Lc[d&31](v+o|0,B)|0)>-1){D=v;E=u;F=A;break a}if((Lc[d&31](v+(0-(C+b))|0,B)|0)>-1){D=v;E=u;F=A;break a}}C=A+1|0;c[n+(A<<2)>>2]=B;G=x+ -1|0;if((G|0)!=0){if((G&1|0)==0){H=G;G=0;do{G=G+1|0;H=H>>>1}while((H&1|0)==0);if((G|0)!=0){I=G}else{t=10}}else{t=10}if((t|0)==10){t=0;if((y|0)!=0){if((y&1|0)==0){H=y;J=0;while(1){K=J+1|0;L=H>>>1;if((L&1|0)==0){H=L;J=K}else{M=K;break}}}else{M=0}}else{M=32}I=(M|0)==0?0:M+32|0}if(I>>>0>31){N=I;t=15}else{O=I;P=x;Q=y;R=I}}else{N=32;t=15}if((t|0)==15){t=0;O=N+ -32|0;P=y;Q=0;R=N}J=Q<<32-O|P>>>O;H=Q>>>O;G=R+u|0;if((J|0)==1&(H|0)==0){D=B;E=G;F=C;break a}u=G;v=B;w=0;x=J;y=H;z=c[n>>2]|0;A=C}}}while(0);if((t|0)==18){if((r|0)==0){D=p;E=q;F=s}else{i=k;return}}b:do{if((F|0)>=2?(s=n+(F<<2)|0,c[s>>2]=l,(b|0)!=0):0){if((F|0)>0){S=b;T=l}else{q=b>>>0>256?256:b;p=c[n>>2]|0;Xn(l|0,p|0,q|0)|0;if((q|0)==(b|0)){break}else{U=b;V=q}while(1){U=U-V|0;V=U>>>0>256?256:U;Xn(l|0,p|0,V|0)|0;if((U|0)==(V|0)){break b}}}while(1){p=S>>>0>256?256:S;q=c[n>>2]|0;Xn(T|0,q|0,p|0)|0;r=q;q=0;while(1){t=q+1|0;R=c[n+(t<<2)>>2]|0;Xn(r|0,R|0,p|0)|0;c[n+(q<<2)>>2]=r+p;if((t|0)==(F|0)){break}else{r=R;q=t}}if((S|0)==(p|0)){break b}S=S-p|0;T=c[s>>2]|0}}}while(0);c[l>>2]=D;c:do{if((E|0)>1){T=E;S=D;F=D;n=1;while(1){V=S+o|0;U=T+ -2|0;s=S+(0-((c[j+(U<<2)>>2]|0)+b))|0;if((Lc[d&31](F,s)|0)>-1?(Lc[d&31](F,V)|0)>-1:0){W=n;break}q=n+1|0;r=l+(n<<2)|0;if((Lc[d&31](s,V)|0)>-1){c[r>>2]=s;X=s;Y=T+ -1|0}else{c[r>>2]=V;X=V;Y=U}if((Y|0)<=1){W=q;break}T=Y;S=X;F=c[l>>2]|0;n=q}if((W|0)>=2?(n=l+(W<<2)|0,c[n>>2]=m,(b|0)!=0):0){if((W|0)>0){Z=b;_=m}else{F=b>>>0>256?256:b;S=c[l>>2]|0;Xn(m|0,S|0,F|0)|0;if((F|0)==(b|0)){$=m;break}else{aa=b;ba=F}while(1){F=aa-ba|0;T=F>>>0>256?256:F;Xn(m|0,S|0,T|0)|0;if((F|0)==(T|0)){$=m;break c}else{aa=F;ba=T}}}while(1){S=Z>>>0>256?256:Z;T=c[l>>2]|0;Xn(_|0,T|0,S|0)|0;F=T;T=0;while(1){q=T+1|0;U=c[l+(q<<2)>>2]|0;Xn(F|0,U|0,S|0)|0;c[l+(T<<2)>>2]=F+S;if((q|0)==(W|0)){break}else{F=U;T=q}}if((Z|0)==(S|0)){$=m;break c}Z=Z-S|0;_=c[n>>2]|0}}else{$=m}}else{$=m}}while(0);i=k;return}function Um(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;f=b+(Un(b|0)|0)|0;a:do{if((d|0)==0){g=f}else{h=d;j=c;k=f;while(1){l=a[j]|0;if(l<<24>>24==0){g=k;break a}m=h+ -1|0;n=k+1|0;a[k]=l;if((m|0)==0){g=n;break}else{h=m;j=j+1|0;k=n}}}}while(0);a[g]=0;i=e;return b|0}function Vm(a){a=a|0;var b=0,d=0;b=i;d=a;while(1){if((c[d>>2]|0)==0){break}else{d=d+4|0}}i=b;return d-a>>2|0}function Wm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=i;if((d|0)==0){i=e;return a|0}else{f=d;g=b;h=a}while(1){f=f+ -1|0;c[h>>2]=c[g>>2];if((f|0)==0){break}else{g=g+4|0;h=h+4|0}}i=e;return a|0}function Xm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;f=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(!f){g=d;do{g=g+ -1|0;c[a+(g<<2)>>2]=c[b+(g<<2)>>2]}while((g|0)!=0)}}else{if(!f){f=b;b=a;g=d;while(1){g=g+ -1|0;c[b>>2]=c[f>>2];if((g|0)==0){break}else{f=f+4|0;b=b+4|0}}}}i=e;return a|0}function Ym(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;if((d|0)!=0){f=d;d=a;while(1){f=f+ -1|0;c[d>>2]=b;if((f|0)==0){break}else{d=d+4|0}}}i=e;return a|0}function Zm(a){a=a|0;return}function _m(a){a=a|0;c[a>>2]=25760;return}function $m(a){a=a|0;var b=0;b=i;ab(a|0);Cn(a);i=b;return}function an(a){a=a|0;var b=0;b=i;ab(a|0);i=b;return}function bn(a){a=a|0;return 25776}function cn(a){a=a|0;return}function dn(a){a=a|0;return}function en(a){a=a|0;return}function fn(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function gn(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function hn(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function jn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+64|0;f=e;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}h=nn(b,25888,25944,0)|0;if((h|0)==0){g=0;i=e;return g|0}b=f+0|0;j=b+56|0;do{c[b>>2]=0;b=b+4|0}while((b|0)<(j|0));c[f>>2]=h;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;Tc[c[(c[h>>2]|0)+28>>2]&15](h,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function kn(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((c[d+8>>2]|0)!=(b|0)){i=g;return}b=d+16|0;h=c[b>>2]|0;if((h|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function ln(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;g=i;if((b|0)!=(c[d+8>>2]|0)){h=c[b+8>>2]|0;Tc[c[(c[h>>2]|0)+28>>2]&15](h,d,e,f);i=g;return}h=d+16|0;b=c[h>>2]|0;if((b|0)==0){c[h>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}e=d+24|0;if((c[e>>2]|0)!=2){i=g;return}c[e>>2]=f;i=g;return}function mn(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;if((b|0)==(c[d+8>>2]|0)){h=d+16|0;j=c[h>>2]|0;if((j|0)==0){c[h>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;i=g;return}if((j|0)!=(e|0)){j=d+36|0;c[j>>2]=(c[j>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;i=g;return}j=d+24|0;if((c[j>>2]|0)!=2){i=g;return}c[j>>2]=f;i=g;return}j=c[b+12>>2]|0;h=b+(j<<3)+16|0;k=c[b+20>>2]|0;l=k>>8;if((k&1|0)==0){m=l}else{m=c[(c[e>>2]|0)+l>>2]|0}l=c[b+16>>2]|0;Tc[c[(c[l>>2]|0)+28>>2]&15](l,d,e+m|0,(k&2|0)!=0?f:2);if((j|0)<=1){i=g;return}j=d+54|0;k=b+24|0;while(1){b=c[k+4>>2]|0;m=b>>8;if((b&1|0)==0){n=m}else{n=c[(c[e>>2]|0)+m>>2]|0}m=c[k>>2]|0;Tc[c[(c[m>>2]|0)+28>>2]&15](m,d,e+n|0,(b&2|0)!=0?f:2);if((a[j]|0)!=0){o=16;break}b=k+8|0;if(b>>>0<h>>>0){k=b}else{o=16;break}}if((o|0)==16){i=g;return}}function nn(d,e,f,g){d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;i=i+64|0;j=h;k=c[d>>2]|0;l=d+(c[k+ -8>>2]|0)|0;m=c[k+ -4>>2]|0;c[j>>2]=f;c[j+4>>2]=d;c[j+8>>2]=e;c[j+12>>2]=g;g=j+16|0;e=j+20|0;d=j+24|0;k=j+28|0;n=j+32|0;o=j+40|0;p=(m|0)==(f|0);f=g+0|0;q=f+36|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(q|0));b[g+36>>1]=0;a[g+38|0]=0;if(p){c[j+48>>2]=1;Gc[c[(c[m>>2]|0)+20>>2]&31](m,j,l,l,1,0);r=(c[d>>2]|0)==1?l:0;i=h;return r|0}xc[c[(c[m>>2]|0)+24>>2]&3](m,j,l,1,0);l=c[j+36>>2]|0;if((l|0)==1){if((c[d>>2]|0)!=1){if((c[o>>2]|0)!=0){r=0;i=h;return r|0}if((c[k>>2]|0)!=1){r=0;i=h;return r|0}if((c[n>>2]|0)!=1){r=0;i=h;return r|0}}r=c[g>>2]|0;i=h;return r|0}else if((l|0)==0){if((c[o>>2]|0)!=1){r=0;i=h;return r|0}if((c[k>>2]|0)!=1){r=0;i=h;return r|0}r=(c[n>>2]|0)==1?c[e>>2]|0:0;i=h;return r|0}else{r=0;i=h;return r|0}return 0}function on(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;h=i;if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){i=h;return}j=d+28|0;if((c[j>>2]|0)==1){i=h;return}c[j>>2]=f;i=h;return}if((b|0)==(c[d>>2]|0)){if((c[d+16>>2]|0)!=(e|0)?(j=d+20|0,(c[j>>2]|0)!=(e|0)):0){c[d+32>>2]=f;k=d+44|0;if((c[k>>2]|0)==4){i=h;return}l=c[b+12>>2]|0;m=b+(l<<3)+16|0;a:do{if((l|0)>0){n=d+52|0;o=d+53|0;p=d+54|0;q=b+8|0;r=d+24|0;s=0;t=0;u=b+16|0;b:while(1){a[n]=0;a[o]=0;v=c[u+4>>2]|0;w=v>>8;if((v&1|0)==0){x=w}else{x=c[(c[e>>2]|0)+w>>2]|0}w=c[u>>2]|0;Gc[c[(c[w>>2]|0)+20>>2]&31](w,d,e,e+x|0,2-(v>>>1&1)|0,g);if((a[p]|0)!=0){y=s;z=t;break}do{if((a[o]|0)!=0){if((a[n]|0)==0){if((c[q>>2]&1|0)==0){y=s;z=1;break b}else{A=s;B=1;break}}if((c[r>>2]|0)==1){C=27;break a}if((c[q>>2]&2|0)==0){C=27;break a}else{A=1;B=1}}else{A=s;B=t}}while(0);v=u+8|0;if(v>>>0<m>>>0){s=A;t=B;u=v}else{y=A;z=B;break}}if(y){D=z;C=26}else{E=z;C=23}}else{E=0;C=23}}while(0);if((C|0)==23){c[j>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1;if(E){C=27}else{C=28}}else{D=E;C=26}}if((C|0)==26){if(D){C=27}else{C=28}}if((C|0)==27){c[k>>2]=3;i=h;return}else if((C|0)==28){c[k>>2]=4;i=h;return}}if((f|0)!=1){i=h;return}c[d+32>>2]=1;i=h;return}k=c[b+12>>2]|0;D=b+(k<<3)+16|0;E=c[b+20>>2]|0;j=E>>8;if((E&1|0)==0){F=j}else{F=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;xc[c[(c[j>>2]|0)+24>>2]&3](j,d,e+F|0,(E&2|0)!=0?f:2,g);E=b+24|0;if((k|0)<=1){i=h;return}k=c[b+8>>2]|0;if((k&2|0)==0?(b=d+36|0,(c[b>>2]|0)!=1):0){if((k&1|0)==0){k=d+54|0;F=E;while(1){if((a[k]|0)!=0){C=53;break}if((c[b>>2]|0)==1){C=53;break}j=c[F+4>>2]|0;z=j>>8;if((j&1|0)==0){G=z}else{G=c[(c[e>>2]|0)+z>>2]|0}z=c[F>>2]|0;xc[c[(c[z>>2]|0)+24>>2]&3](z,d,e+G|0,(j&2|0)!=0?f:2,g);j=F+8|0;if(j>>>0<D>>>0){F=j}else{C=53;break}}if((C|0)==53){i=h;return}}F=d+24|0;G=d+54|0;k=E;while(1){if((a[G]|0)!=0){C=53;break}if((c[b>>2]|0)==1?(c[F>>2]|0)==1:0){C=53;break}j=c[k+4>>2]|0;z=j>>8;if((j&1|0)==0){H=z}else{H=c[(c[e>>2]|0)+z>>2]|0}z=c[k>>2]|0;xc[c[(c[z>>2]|0)+24>>2]&3](z,d,e+H|0,(j&2|0)!=0?f:2,g);j=k+8|0;if(j>>>0<D>>>0){k=j}else{C=53;break}}if((C|0)==53){i=h;return}}k=d+54|0;H=E;while(1){if((a[k]|0)!=0){C=53;break}E=c[H+4>>2]|0;F=E>>8;if((E&1|0)==0){I=F}else{I=c[(c[e>>2]|0)+F>>2]|0}F=c[H>>2]|0;xc[c[(c[F>>2]|0)+24>>2]&3](F,d,e+I|0,(E&2|0)!=0?f:2,g);E=H+8|0;if(E>>>0<D>>>0){H=E}else{C=53;break}}if((C|0)==53){i=h;return}}function pn(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=i;if((b|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){i=h;return}j=d+28|0;if((c[j>>2]|0)==1){i=h;return}c[j>>2]=f;i=h;return}if((b|0)!=(c[d>>2]|0)){j=c[b+8>>2]|0;xc[c[(c[j>>2]|0)+24>>2]&3](j,d,e,f,g);i=h;return}if((c[d+16>>2]|0)!=(e|0)?(j=d+20|0,(c[j>>2]|0)!=(e|0)):0){c[d+32>>2]=f;k=d+44|0;if((c[k>>2]|0)==4){i=h;return}l=d+52|0;a[l]=0;m=d+53|0;a[m]=0;n=c[b+8>>2]|0;Gc[c[(c[n>>2]|0)+20>>2]&31](n,d,e,e,1,g);if((a[m]|0)!=0){if((a[l]|0)==0){o=1;p=13}}else{o=0;p=13}do{if((p|0)==13){c[j>>2]=e;l=d+40|0;c[l>>2]=(c[l>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1;if(o){break}}else{p=16}if((p|0)==16?o:0){break}c[k>>2]=4;i=h;return}}while(0);c[k>>2]=3;i=h;return}if((f|0)!=1){i=h;return}c[d+32>>2]=1;i=h;return}function qn(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;g=i;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){i=g;return}h=d+28|0;if((c[h>>2]|0)==1){i=g;return}c[h>>2]=f;i=g;return}if((c[d>>2]|0)!=(b|0)){i=g;return}if((c[d+16>>2]|0)!=(e|0)?(b=d+20|0,(c[b>>2]|0)!=(e|0)):0){c[d+32>>2]=f;c[b>>2]=e;e=d+40|0;c[e>>2]=(c[e>>2]|0)+1;if((c[d+36>>2]|0)==1?(c[d+24>>2]|0)==2:0){a[d+54|0]=1}c[d+44>>2]=4;i=g;return}if((f|0)!=1){i=g;return}c[d+32>>2]=1;i=g;return}function rn(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;j=i;if((b|0)!=(c[d+8>>2]|0)){k=d+52|0;l=a[k]|0;m=d+53|0;n=a[m]|0;o=c[b+12>>2]|0;p=b+(o<<3)+16|0;a[k]=0;a[m]=0;q=c[b+20>>2]|0;r=q>>8;if((q&1|0)==0){s=r}else{s=c[(c[f>>2]|0)+r>>2]|0}r=c[b+16>>2]|0;Gc[c[(c[r>>2]|0)+20>>2]&31](r,d,e,f+s|0,(q&2|0)!=0?g:2,h);a:do{if((o|0)>1){q=d+24|0;s=b+8|0;r=d+54|0;t=b+24|0;do{if((a[r]|0)!=0){break a}if((a[k]|0)==0){if((a[m]|0)!=0?(c[s>>2]&1|0)==0:0){break a}}else{if((c[q>>2]|0)==1){break a}if((c[s>>2]&2|0)==0){break a}}a[k]=0;a[m]=0;u=c[t+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[f>>2]|0)+v>>2]|0}v=c[t>>2]|0;Gc[c[(c[v>>2]|0)+20>>2]&31](v,d,e,f+w|0,(u&2|0)!=0?g:2,h);t=t+8|0}while(t>>>0<p>>>0)}}while(0);a[k]=l;a[m]=n;i=j;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=j;return}a[d+52|0]=1;f=d+16|0;n=c[f>>2]|0;if((n|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}if((n|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;i=j;return}e=d+24|0;n=c[e>>2]|0;if((n|0)==2){c[e>>2]=g;x=g}else{x=n}if(!((c[d+48>>2]|0)==1&(x|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}function sn(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0;j=i;if((b|0)!=(c[d+8>>2]|0)){k=c[b+8>>2]|0;Gc[c[(c[k>>2]|0)+20>>2]&31](k,d,e,f,g,h);i=j;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=j;return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;i=j;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;l=g}else{l=h}if(!((c[d+48>>2]|0)==1&(l|0)==1)){i=j;return}a[d+54|0]=1;i=j;return}function tn(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0;h=i;if((c[d+8>>2]|0)!=(b|0)){i=h;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){i=h;return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1;a[d+54|0]=1;i=h;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;j=g}else{j=b}if(!((c[d+48>>2]|0)==1&(j|0)==1)){i=h;return}a[d+54|0]=1;i=h;return}function un(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0,ha=0,ia=0,ja=0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0,sa=0,ta=0,ua=0,va=0,wa=0,xa=0,ya=0,za=0,Aa=0,Ba=0,Ca=0,Da=0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0;b=i;do{if(a>>>0<245){if(a>>>0<11){d=16}else{d=a+11&-8}e=d>>>3;f=c[6548]|0;g=f>>>e;if((g&3|0)!=0){h=(g&1^1)+e|0;j=h<<1;k=26232+(j<<2)|0;l=26232+(j+2<<2)|0;j=c[l>>2]|0;m=j+8|0;n=c[m>>2]|0;do{if((k|0)!=(n|0)){if(n>>>0<(c[26208>>2]|0)>>>0){Wb()}o=n+12|0;if((c[o>>2]|0)==(j|0)){c[o>>2]=k;c[l>>2]=n;break}else{Wb()}}else{c[6548]=f&~(1<<h)}}while(0);n=h<<3;c[j+4>>2]=n|3;l=j+(n|4)|0;c[l>>2]=c[l>>2]|1;p=m;i=b;return p|0}if(d>>>0>(c[26200>>2]|0)>>>0){if((g|0)!=0){l=2<<e;n=g<<e&(l|0-l);l=(n&0-n)+ -1|0;n=l>>>12&16;k=l>>>n;l=k>>>5&8;o=k>>>l;k=o>>>2&4;q=o>>>k;o=q>>>1&2;r=q>>>o;q=r>>>1&1;s=(l|n|k|o|q)+(r>>>q)|0;q=s<<1;r=26232+(q<<2)|0;o=26232+(q+2<<2)|0;q=c[o>>2]|0;k=q+8|0;n=c[k>>2]|0;do{if((r|0)!=(n|0)){if(n>>>0<(c[26208>>2]|0)>>>0){Wb()}l=n+12|0;if((c[l>>2]|0)==(q|0)){c[l>>2]=r;c[o>>2]=n;break}else{Wb()}}else{c[6548]=f&~(1<<s)}}while(0);f=s<<3;n=f-d|0;c[q+4>>2]=d|3;o=q+d|0;c[q+(d|4)>>2]=n|1;c[q+f>>2]=n;f=c[26200>>2]|0;if((f|0)!=0){r=c[26212>>2]|0;e=f>>>3;f=e<<1;g=26232+(f<<2)|0;m=c[6548]|0;j=1<<e;if((m&j|0)!=0){e=26232+(f+2<<2)|0;h=c[e>>2]|0;if(h>>>0<(c[26208>>2]|0)>>>0){Wb()}else{t=e;u=h}}else{c[6548]=m|j;t=26232+(f+2<<2)|0;u=g}c[t>>2]=r;c[u+12>>2]=r;c[r+8>>2]=u;c[r+12>>2]=g}c[26200>>2]=n;c[26212>>2]=o;p=k;i=b;return p|0}o=c[26196>>2]|0;if((o|0)!=0){n=(o&0-o)+ -1|0;o=n>>>12&16;g=n>>>o;n=g>>>5&8;r=g>>>n;g=r>>>2&4;f=r>>>g;r=f>>>1&2;j=f>>>r;f=j>>>1&1;m=c[26496+((n|o|g|r|f)+(j>>>f)<<2)>>2]|0;f=(c[m+4>>2]&-8)-d|0;j=m;r=m;while(1){m=c[j+16>>2]|0;if((m|0)==0){g=c[j+20>>2]|0;if((g|0)==0){break}else{v=g}}else{v=m}m=(c[v+4>>2]&-8)-d|0;g=m>>>0<f>>>0;f=g?m:f;j=v;r=g?v:r}j=c[26208>>2]|0;if(r>>>0<j>>>0){Wb()}k=r+d|0;if(!(r>>>0<k>>>0)){Wb()}q=c[r+24>>2]|0;s=c[r+12>>2]|0;do{if((s|0)==(r|0)){g=r+20|0;m=c[g>>2]|0;if((m|0)==0){o=r+16|0;n=c[o>>2]|0;if((n|0)==0){w=0;break}else{x=n;y=o}}else{x=m;y=g}while(1){g=x+20|0;m=c[g>>2]|0;if((m|0)!=0){x=m;y=g;continue}g=x+16|0;m=c[g>>2]|0;if((m|0)==0){break}else{x=m;y=g}}if(y>>>0<j>>>0){Wb()}else{c[y>>2]=0;w=x;break}}else{g=c[r+8>>2]|0;if(g>>>0<j>>>0){Wb()}m=g+12|0;if((c[m>>2]|0)!=(r|0)){Wb()}o=s+8|0;if((c[o>>2]|0)==(r|0)){c[m>>2]=s;c[o>>2]=g;w=s;break}else{Wb()}}}while(0);do{if((q|0)!=0){s=c[r+28>>2]|0;j=26496+(s<<2)|0;if((r|0)==(c[j>>2]|0)){c[j>>2]=w;if((w|0)==0){c[26196>>2]=c[26196>>2]&~(1<<s);break}}else{if(q>>>0<(c[26208>>2]|0)>>>0){Wb()}s=q+16|0;if((c[s>>2]|0)==(r|0)){c[s>>2]=w}else{c[q+20>>2]=w}if((w|0)==0){break}}if(w>>>0<(c[26208>>2]|0)>>>0){Wb()}c[w+24>>2]=q;s=c[r+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[w+16>>2]=s;c[s+24>>2]=w;break}}}while(0);s=c[r+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[w+20>>2]=s;c[s+24>>2]=w;break}}}}while(0);if(f>>>0<16){q=f+d|0;c[r+4>>2]=q|3;s=r+(q+4)|0;c[s>>2]=c[s>>2]|1}else{c[r+4>>2]=d|3;c[r+(d|4)>>2]=f|1;c[r+(f+d)>>2]=f;s=c[26200>>2]|0;if((s|0)!=0){q=c[26212>>2]|0;j=s>>>3;s=j<<1;g=26232+(s<<2)|0;o=c[6548]|0;m=1<<j;if((o&m|0)!=0){j=26232+(s+2<<2)|0;n=c[j>>2]|0;if(n>>>0<(c[26208>>2]|0)>>>0){Wb()}else{z=j;A=n}}else{c[6548]=o|m;z=26232+(s+2<<2)|0;A=g}c[z>>2]=q;c[A+12>>2]=q;c[q+8>>2]=A;c[q+12>>2]=g}c[26200>>2]=f;c[26212>>2]=k}p=r+8|0;i=b;return p|0}else{B=d}}else{B=d}}else{if(!(a>>>0>4294967231)){g=a+11|0;q=g&-8;s=c[26196>>2]|0;if((s|0)!=0){m=0-q|0;o=g>>>8;if((o|0)!=0){if(q>>>0>16777215){C=31}else{g=(o+1048320|0)>>>16&8;n=o<<g;o=(n+520192|0)>>>16&4;j=n<<o;n=(j+245760|0)>>>16&2;h=14-(o|g|n)+(j<<n>>>15)|0;C=q>>>(h+7|0)&1|h<<1}}else{C=0}h=c[26496+(C<<2)>>2]|0;a:do{if((h|0)==0){D=m;E=0;F=0}else{if((C|0)==31){G=0}else{G=25-(C>>>1)|0}n=m;j=0;g=q<<G;o=h;e=0;while(1){l=c[o+4>>2]&-8;H=l-q|0;if(H>>>0<n>>>0){if((l|0)==(q|0)){D=H;E=o;F=o;break a}else{I=H;J=o}}else{I=n;J=e}H=c[o+20>>2]|0;l=c[o+(g>>>31<<2)+16>>2]|0;K=(H|0)==0|(H|0)==(l|0)?j:H;if((l|0)==0){D=I;E=K;F=J;break}else{n=I;j=K;g=g<<1;o=l;e=J}}}}while(0);if((E|0)==0&(F|0)==0){h=2<<C;m=s&(h|0-h);if((m|0)==0){B=q;break}h=(m&0-m)+ -1|0;m=h>>>12&16;r=h>>>m;h=r>>>5&8;k=r>>>h;r=k>>>2&4;f=k>>>r;k=f>>>1&2;e=f>>>k;f=e>>>1&1;L=c[26496+((h|m|r|k|f)+(e>>>f)<<2)>>2]|0}else{L=E}if((L|0)==0){M=D;N=F}else{f=D;e=L;k=F;while(1){r=(c[e+4>>2]&-8)-q|0;m=r>>>0<f>>>0;h=m?r:f;r=m?e:k;m=c[e+16>>2]|0;if((m|0)!=0){f=h;e=m;k=r;continue}m=c[e+20>>2]|0;if((m|0)==0){M=h;N=r;break}else{f=h;e=m;k=r}}}if((N|0)!=0?M>>>0<((c[26200>>2]|0)-q|0)>>>0:0){k=c[26208>>2]|0;if(N>>>0<k>>>0){Wb()}e=N+q|0;if(!(N>>>0<e>>>0)){Wb()}f=c[N+24>>2]|0;s=c[N+12>>2]|0;do{if((s|0)==(N|0)){r=N+20|0;m=c[r>>2]|0;if((m|0)==0){h=N+16|0;o=c[h>>2]|0;if((o|0)==0){O=0;break}else{P=o;Q=h}}else{P=m;Q=r}while(1){r=P+20|0;m=c[r>>2]|0;if((m|0)!=0){P=m;Q=r;continue}r=P+16|0;m=c[r>>2]|0;if((m|0)==0){break}else{P=m;Q=r}}if(Q>>>0<k>>>0){Wb()}else{c[Q>>2]=0;O=P;break}}else{r=c[N+8>>2]|0;if(r>>>0<k>>>0){Wb()}m=r+12|0;if((c[m>>2]|0)!=(N|0)){Wb()}h=s+8|0;if((c[h>>2]|0)==(N|0)){c[m>>2]=s;c[h>>2]=r;O=s;break}else{Wb()}}}while(0);do{if((f|0)!=0){s=c[N+28>>2]|0;k=26496+(s<<2)|0;if((N|0)==(c[k>>2]|0)){c[k>>2]=O;if((O|0)==0){c[26196>>2]=c[26196>>2]&~(1<<s);break}}else{if(f>>>0<(c[26208>>2]|0)>>>0){Wb()}s=f+16|0;if((c[s>>2]|0)==(N|0)){c[s>>2]=O}else{c[f+20>>2]=O}if((O|0)==0){break}}if(O>>>0<(c[26208>>2]|0)>>>0){Wb()}c[O+24>>2]=f;s=c[N+16>>2]|0;do{if((s|0)!=0){if(s>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[O+16>>2]=s;c[s+24>>2]=O;break}}}while(0);s=c[N+20>>2]|0;if((s|0)!=0){if(s>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[O+20>>2]=s;c[s+24>>2]=O;break}}}}while(0);b:do{if(!(M>>>0<16)){c[N+4>>2]=q|3;c[N+(q|4)>>2]=M|1;c[N+(M+q)>>2]=M;f=M>>>3;if(M>>>0<256){s=f<<1;k=26232+(s<<2)|0;r=c[6548]|0;h=1<<f;if((r&h|0)!=0){f=26232+(s+2<<2)|0;m=c[f>>2]|0;if(m>>>0<(c[26208>>2]|0)>>>0){Wb()}else{R=f;S=m}}else{c[6548]=r|h;R=26232+(s+2<<2)|0;S=k}c[R>>2]=e;c[S+12>>2]=e;c[N+(q+8)>>2]=S;c[N+(q+12)>>2]=k;break}k=M>>>8;if((k|0)!=0){if(M>>>0>16777215){T=31}else{s=(k+1048320|0)>>>16&8;h=k<<s;k=(h+520192|0)>>>16&4;r=h<<k;h=(r+245760|0)>>>16&2;m=14-(k|s|h)+(r<<h>>>15)|0;T=M>>>(m+7|0)&1|m<<1}}else{T=0}m=26496+(T<<2)|0;c[N+(q+28)>>2]=T;c[N+(q+20)>>2]=0;c[N+(q+16)>>2]=0;h=c[26196>>2]|0;r=1<<T;if((h&r|0)==0){c[26196>>2]=h|r;c[m>>2]=e;c[N+(q+24)>>2]=m;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break}r=c[m>>2]|0;if((T|0)==31){U=0}else{U=25-(T>>>1)|0}c:do{if((c[r+4>>2]&-8|0)!=(M|0)){m=M<<U;h=r;while(1){V=h+(m>>>31<<2)+16|0;s=c[V>>2]|0;if((s|0)==0){break}if((c[s+4>>2]&-8|0)==(M|0)){W=s;break c}else{m=m<<1;h=s}}if(V>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[V>>2]=e;c[N+(q+24)>>2]=h;c[N+(q+12)>>2]=e;c[N+(q+8)>>2]=e;break b}}else{W=r}}while(0);r=W+8|0;m=c[r>>2]|0;s=c[26208>>2]|0;if(W>>>0<s>>>0){Wb()}if(m>>>0<s>>>0){Wb()}else{c[m+12>>2]=e;c[r>>2]=e;c[N+(q+8)>>2]=m;c[N+(q+12)>>2]=W;c[N+(q+24)>>2]=0;break}}else{m=M+q|0;c[N+4>>2]=m|3;r=N+(m+4)|0;c[r>>2]=c[r>>2]|1}}while(0);p=N+8|0;i=b;return p|0}else{B=q}}else{B=q}}else{B=-1}}}while(0);N=c[26200>>2]|0;if(!(B>>>0>N>>>0)){M=N-B|0;W=c[26212>>2]|0;if(M>>>0>15){c[26212>>2]=W+B;c[26200>>2]=M;c[W+(B+4)>>2]=M|1;c[W+N>>2]=M;c[W+4>>2]=B|3}else{c[26200>>2]=0;c[26212>>2]=0;c[W+4>>2]=N|3;M=W+(N+4)|0;c[M>>2]=c[M>>2]|1}p=W+8|0;i=b;return p|0}W=c[26204>>2]|0;if(B>>>0<W>>>0){M=W-B|0;c[26204>>2]=M;W=c[26216>>2]|0;c[26216>>2]=W+B;c[W+(B+4)>>2]=M|1;c[W+4>>2]=B|3;p=W+8|0;i=b;return p|0}do{if((c[6666]|0)==0){W=Ua(30)|0;if((W+ -1&W|0)==0){c[26672>>2]=W;c[26668>>2]=W;c[26676>>2]=-1;c[26680>>2]=-1;c[26684>>2]=0;c[26636>>2]=0;c[6666]=(zb(0)|0)&-16^1431655768;break}else{Wb()}}}while(0);W=B+48|0;M=c[26672>>2]|0;N=B+47|0;V=M+N|0;U=0-M|0;M=V&U;if(!(M>>>0>B>>>0)){p=0;i=b;return p|0}T=c[26632>>2]|0;if((T|0)!=0?(S=c[26624>>2]|0,R=S+M|0,R>>>0<=S>>>0|R>>>0>T>>>0):0){p=0;i=b;return p|0}d:do{if((c[26636>>2]&4|0)==0){T=c[26216>>2]|0;e:do{if((T|0)!=0){R=26640|0;while(1){S=c[R>>2]|0;if(!(S>>>0>T>>>0)?(X=R+4|0,(S+(c[X>>2]|0)|0)>>>0>T>>>0):0){break}S=c[R+8>>2]|0;if((S|0)==0){Y=182;break e}else{R=S}}if((R|0)!=0){S=V-(c[26204>>2]|0)&U;if(S>>>0<2147483647){O=Ra(S|0)|0;P=(O|0)==((c[R>>2]|0)+(c[X>>2]|0)|0);Z=O;_=S;$=P?O:-1;aa=P?S:0;Y=191}else{ba=0}}else{Y=182}}else{Y=182}}while(0);do{if((Y|0)==182){T=Ra(0)|0;if((T|0)!=(-1|0)){q=T;S=c[26668>>2]|0;P=S+ -1|0;if((P&q|0)==0){ca=M}else{ca=M-q+(P+q&0-S)|0}S=c[26624>>2]|0;q=S+ca|0;if(ca>>>0>B>>>0&ca>>>0<2147483647){P=c[26632>>2]|0;if((P|0)!=0?q>>>0<=S>>>0|q>>>0>P>>>0:0){ba=0;break}P=Ra(ca|0)|0;q=(P|0)==(T|0);Z=P;_=ca;$=q?T:-1;aa=q?ca:0;Y=191}else{ba=0}}else{ba=0}}}while(0);f:do{if((Y|0)==191){q=0-_|0;if(($|0)!=(-1|0)){da=$;ea=aa;Y=202;break d}do{if((Z|0)!=(-1|0)&_>>>0<2147483647&_>>>0<W>>>0?(T=c[26672>>2]|0,P=N-_+T&0-T,P>>>0<2147483647):0){if((Ra(P|0)|0)==(-1|0)){Ra(q|0)|0;ba=aa;break f}else{fa=P+_|0;break}}else{fa=_}}while(0);if((Z|0)==(-1|0)){ba=aa}else{da=Z;ea=fa;Y=202;break d}}}while(0);c[26636>>2]=c[26636>>2]|4;ga=ba;Y=199}else{ga=0;Y=199}}while(0);if((((Y|0)==199?M>>>0<2147483647:0)?(ba=Ra(M|0)|0,M=Ra(0)|0,(M|0)!=(-1|0)&(ba|0)!=(-1|0)&ba>>>0<M>>>0):0)?(fa=M-ba|0,M=fa>>>0>(B+40|0)>>>0,M):0){da=ba;ea=M?fa:ga;Y=202}if((Y|0)==202){ga=(c[26624>>2]|0)+ea|0;c[26624>>2]=ga;if(ga>>>0>(c[26628>>2]|0)>>>0){c[26628>>2]=ga}ga=c[26216>>2]|0;g:do{if((ga|0)!=0){fa=26640|0;while(1){ha=c[fa>>2]|0;ia=fa+4|0;ja=c[ia>>2]|0;if((da|0)==(ha+ja|0)){Y=214;break}M=c[fa+8>>2]|0;if((M|0)==0){break}else{fa=M}}if(((Y|0)==214?(c[fa+12>>2]&8|0)==0:0)?ga>>>0>=ha>>>0&ga>>>0<da>>>0:0){c[ia>>2]=ja+ea;M=(c[26204>>2]|0)+ea|0;ba=ga+8|0;if((ba&7|0)==0){ka=0}else{ka=0-ba&7}ba=M-ka|0;c[26216>>2]=ga+ka;c[26204>>2]=ba;c[ga+(ka+4)>>2]=ba|1;c[ga+(M+4)>>2]=40;c[26220>>2]=c[26680>>2];break}if(da>>>0<(c[26208>>2]|0)>>>0){c[26208>>2]=da}M=da+ea|0;ba=26640|0;while(1){if((c[ba>>2]|0)==(M|0)){Y=224;break}Z=c[ba+8>>2]|0;if((Z|0)==0){break}else{ba=Z}}if((Y|0)==224?(c[ba+12>>2]&8|0)==0:0){c[ba>>2]=da;M=ba+4|0;c[M>>2]=(c[M>>2]|0)+ea;M=da+8|0;if((M&7|0)==0){la=0}else{la=0-M&7}M=da+(ea+8)|0;if((M&7|0)==0){ma=0}else{ma=0-M&7}M=da+(ma+ea)|0;fa=la+B|0;Z=da+fa|0;aa=M-(da+la)-B|0;c[da+(la+4)>>2]=B|3;h:do{if((M|0)!=(c[26216>>2]|0)){if((M|0)==(c[26212>>2]|0)){_=(c[26200>>2]|0)+aa|0;c[26200>>2]=_;c[26212>>2]=Z;c[da+(fa+4)>>2]=_|1;c[da+(_+fa)>>2]=_;break}_=ea+4|0;N=c[da+(_+ma)>>2]|0;if((N&3|0)==1){W=N&-8;$=N>>>3;do{if(!(N>>>0<256)){ca=c[da+((ma|24)+ea)>>2]|0;X=c[da+(ea+12+ma)>>2]|0;do{if((X|0)==(M|0)){U=ma|16;V=da+(_+U)|0;q=c[V>>2]|0;if((q|0)==0){R=da+(U+ea)|0;U=c[R>>2]|0;if((U|0)==0){na=0;break}else{oa=U;pa=R}}else{oa=q;pa=V}while(1){V=oa+20|0;q=c[V>>2]|0;if((q|0)!=0){oa=q;pa=V;continue}V=oa+16|0;q=c[V>>2]|0;if((q|0)==0){break}else{oa=q;pa=V}}if(pa>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[pa>>2]=0;na=oa;break}}else{V=c[da+((ma|8)+ea)>>2]|0;if(V>>>0<(c[26208>>2]|0)>>>0){Wb()}q=V+12|0;if((c[q>>2]|0)!=(M|0)){Wb()}R=X+8|0;if((c[R>>2]|0)==(M|0)){c[q>>2]=X;c[R>>2]=V;na=X;break}else{Wb()}}}while(0);if((ca|0)!=0){X=c[da+(ea+28+ma)>>2]|0;h=26496+(X<<2)|0;if((M|0)==(c[h>>2]|0)){c[h>>2]=na;if((na|0)==0){c[26196>>2]=c[26196>>2]&~(1<<X);break}}else{if(ca>>>0<(c[26208>>2]|0)>>>0){Wb()}X=ca+16|0;if((c[X>>2]|0)==(M|0)){c[X>>2]=na}else{c[ca+20>>2]=na}if((na|0)==0){break}}if(na>>>0<(c[26208>>2]|0)>>>0){Wb()}c[na+24>>2]=ca;X=ma|16;h=c[da+(X+ea)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[na+16>>2]=h;c[h+24>>2]=na;break}}}while(0);h=c[da+(_+X)>>2]|0;if((h|0)!=0){if(h>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[na+20>>2]=h;c[h+24>>2]=na;break}}}}else{h=c[da+((ma|8)+ea)>>2]|0;ca=c[da+(ea+12+ma)>>2]|0;V=26232+($<<1<<2)|0;if((h|0)!=(V|0)){if(h>>>0<(c[26208>>2]|0)>>>0){Wb()}if((c[h+12>>2]|0)!=(M|0)){Wb()}}if((ca|0)==(h|0)){c[6548]=c[6548]&~(1<<$);break}if((ca|0)!=(V|0)){if(ca>>>0<(c[26208>>2]|0)>>>0){Wb()}V=ca+8|0;if((c[V>>2]|0)==(M|0)){qa=V}else{Wb()}}else{qa=ca+8|0}c[h+12>>2]=ca;c[qa>>2]=h}}while(0);ra=da+((W|ma)+ea)|0;sa=W+aa|0}else{ra=M;sa=aa}$=ra+4|0;c[$>>2]=c[$>>2]&-2;c[da+(fa+4)>>2]=sa|1;c[da+(sa+fa)>>2]=sa;$=sa>>>3;if(sa>>>0<256){_=$<<1;N=26232+(_<<2)|0;h=c[6548]|0;ca=1<<$;if((h&ca|0)!=0){$=26232+(_+2<<2)|0;V=c[$>>2]|0;if(V>>>0<(c[26208>>2]|0)>>>0){Wb()}else{ta=$;ua=V}}else{c[6548]=h|ca;ta=26232+(_+2<<2)|0;ua=N}c[ta>>2]=Z;c[ua+12>>2]=Z;c[da+(fa+8)>>2]=ua;c[da+(fa+12)>>2]=N;break}N=sa>>>8;if((N|0)!=0){if(sa>>>0>16777215){va=31}else{_=(N+1048320|0)>>>16&8;ca=N<<_;N=(ca+520192|0)>>>16&4;h=ca<<N;ca=(h+245760|0)>>>16&2;V=14-(N|_|ca)+(h<<ca>>>15)|0;va=sa>>>(V+7|0)&1|V<<1}}else{va=0}V=26496+(va<<2)|0;c[da+(fa+28)>>2]=va;c[da+(fa+20)>>2]=0;c[da+(fa+16)>>2]=0;ca=c[26196>>2]|0;h=1<<va;if((ca&h|0)==0){c[26196>>2]=ca|h;c[V>>2]=Z;c[da+(fa+24)>>2]=V;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break}h=c[V>>2]|0;if((va|0)==31){wa=0}else{wa=25-(va>>>1)|0}i:do{if((c[h+4>>2]&-8|0)!=(sa|0)){V=sa<<wa;ca=h;while(1){xa=ca+(V>>>31<<2)+16|0;_=c[xa>>2]|0;if((_|0)==0){break}if((c[_+4>>2]&-8|0)==(sa|0)){ya=_;break i}else{V=V<<1;ca=_}}if(xa>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[xa>>2]=Z;c[da+(fa+24)>>2]=ca;c[da+(fa+12)>>2]=Z;c[da+(fa+8)>>2]=Z;break h}}else{ya=h}}while(0);h=ya+8|0;W=c[h>>2]|0;V=c[26208>>2]|0;if(ya>>>0<V>>>0){Wb()}if(W>>>0<V>>>0){Wb()}else{c[W+12>>2]=Z;c[h>>2]=Z;c[da+(fa+8)>>2]=W;c[da+(fa+12)>>2]=ya;c[da+(fa+24)>>2]=0;break}}else{W=(c[26204>>2]|0)+aa|0;c[26204>>2]=W;c[26216>>2]=Z;c[da+(fa+4)>>2]=W|1}}while(0);p=da+(la|8)|0;i=b;return p|0}fa=26640|0;while(1){za=c[fa>>2]|0;if(!(za>>>0>ga>>>0)?(Aa=c[fa+4>>2]|0,Ba=za+Aa|0,Ba>>>0>ga>>>0):0){break}fa=c[fa+8>>2]|0}fa=za+(Aa+ -39)|0;if((fa&7|0)==0){Ca=0}else{Ca=0-fa&7}fa=za+(Aa+ -47+Ca)|0;Z=fa>>>0<(ga+16|0)>>>0?ga:fa;fa=Z+8|0;aa=da+8|0;if((aa&7|0)==0){Da=0}else{Da=0-aa&7}aa=ea+ -40-Da|0;c[26216>>2]=da+Da;c[26204>>2]=aa;c[da+(Da+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[26220>>2]=c[26680>>2];c[Z+4>>2]=27;c[fa+0>>2]=c[26640>>2];c[fa+4>>2]=c[26644>>2];c[fa+8>>2]=c[26648>>2];c[fa+12>>2]=c[26652>>2];c[26640>>2]=da;c[26644>>2]=ea;c[26652>>2]=0;c[26648>>2]=fa;fa=Z+28|0;c[fa>>2]=7;if((Z+32|0)>>>0<Ba>>>0){aa=fa;while(1){fa=aa+4|0;c[fa>>2]=7;if((aa+8|0)>>>0<Ba>>>0){aa=fa}else{break}}}if((Z|0)!=(ga|0)){aa=Z-ga|0;fa=ga+(aa+4)|0;c[fa>>2]=c[fa>>2]&-2;c[ga+4>>2]=aa|1;c[ga+aa>>2]=aa;fa=aa>>>3;if(aa>>>0<256){M=fa<<1;ba=26232+(M<<2)|0;W=c[6548]|0;h=1<<fa;if((W&h|0)!=0){fa=26232+(M+2<<2)|0;V=c[fa>>2]|0;if(V>>>0<(c[26208>>2]|0)>>>0){Wb()}else{Ea=fa;Fa=V}}else{c[6548]=W|h;Ea=26232+(M+2<<2)|0;Fa=ba}c[Ea>>2]=ga;c[Fa+12>>2]=ga;c[ga+8>>2]=Fa;c[ga+12>>2]=ba;break}ba=aa>>>8;if((ba|0)!=0){if(aa>>>0>16777215){Ga=31}else{M=(ba+1048320|0)>>>16&8;h=ba<<M;ba=(h+520192|0)>>>16&4;W=h<<ba;h=(W+245760|0)>>>16&2;V=14-(ba|M|h)+(W<<h>>>15)|0;Ga=aa>>>(V+7|0)&1|V<<1}}else{Ga=0}V=26496+(Ga<<2)|0;c[ga+28>>2]=Ga;c[ga+20>>2]=0;c[ga+16>>2]=0;h=c[26196>>2]|0;W=1<<Ga;if((h&W|0)==0){c[26196>>2]=h|W;c[V>>2]=ga;c[ga+24>>2]=V;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break}W=c[V>>2]|0;if((Ga|0)==31){Ha=0}else{Ha=25-(Ga>>>1)|0}j:do{if((c[W+4>>2]&-8|0)!=(aa|0)){V=aa<<Ha;h=W;while(1){Ia=h+(V>>>31<<2)+16|0;M=c[Ia>>2]|0;if((M|0)==0){break}if((c[M+4>>2]&-8|0)==(aa|0)){Ja=M;break j}else{V=V<<1;h=M}}if(Ia>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[Ia>>2]=ga;c[ga+24>>2]=h;c[ga+12>>2]=ga;c[ga+8>>2]=ga;break g}}else{Ja=W}}while(0);W=Ja+8|0;aa=c[W>>2]|0;Z=c[26208>>2]|0;if(Ja>>>0<Z>>>0){Wb()}if(aa>>>0<Z>>>0){Wb()}else{c[aa+12>>2]=ga;c[W>>2]=ga;c[ga+8>>2]=aa;c[ga+12>>2]=Ja;c[ga+24>>2]=0;break}}}else{aa=c[26208>>2]|0;if((aa|0)==0|da>>>0<aa>>>0){c[26208>>2]=da}c[26640>>2]=da;c[26644>>2]=ea;c[26652>>2]=0;c[26228>>2]=c[6666];c[26224>>2]=-1;aa=0;do{W=aa<<1;Z=26232+(W<<2)|0;c[26232+(W+3<<2)>>2]=Z;c[26232+(W+2<<2)>>2]=Z;aa=aa+1|0}while((aa|0)!=32);aa=da+8|0;if((aa&7|0)==0){Ka=0}else{Ka=0-aa&7}aa=ea+ -40-Ka|0;c[26216>>2]=da+Ka;c[26204>>2]=aa;c[da+(Ka+4)>>2]=aa|1;c[da+(ea+ -36)>>2]=40;c[26220>>2]=c[26680>>2]}}while(0);ea=c[26204>>2]|0;if(ea>>>0>B>>>0){da=ea-B|0;c[26204>>2]=da;ea=c[26216>>2]|0;c[26216>>2]=ea+B;c[ea+(B+4)>>2]=da|1;c[ea+4>>2]=B|3;p=ea+8|0;i=b;return p|0}}c[(mc()|0)>>2]=12;p=0;i=b;return p|0}function vn(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;if((a|0)==0){i=b;return}d=a+ -8|0;e=c[26208>>2]|0;if(d>>>0<e>>>0){Wb()}f=c[a+ -4>>2]|0;g=f&3;if((g|0)==1){Wb()}h=f&-8;j=a+(h+ -8)|0;do{if((f&1|0)==0){k=c[d>>2]|0;if((g|0)==0){i=b;return}l=-8-k|0;m=a+l|0;n=k+h|0;if(m>>>0<e>>>0){Wb()}if((m|0)==(c[26212>>2]|0)){o=a+(h+ -4)|0;if((c[o>>2]&3|0)!=3){p=m;q=n;break}c[26200>>2]=n;c[o>>2]=c[o>>2]&-2;c[a+(l+4)>>2]=n|1;c[j>>2]=n;i=b;return}o=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;r=c[a+(l+12)>>2]|0;s=26232+(o<<1<<2)|0;if((k|0)!=(s|0)){if(k>>>0<e>>>0){Wb()}if((c[k+12>>2]|0)!=(m|0)){Wb()}}if((r|0)==(k|0)){c[6548]=c[6548]&~(1<<o);p=m;q=n;break}if((r|0)!=(s|0)){if(r>>>0<e>>>0){Wb()}s=r+8|0;if((c[s>>2]|0)==(m|0)){t=s}else{Wb()}}else{t=r+8|0}c[k+12>>2]=r;c[t>>2]=k;p=m;q=n;break}k=c[a+(l+24)>>2]|0;r=c[a+(l+12)>>2]|0;do{if((r|0)==(m|0)){s=a+(l+20)|0;o=c[s>>2]|0;if((o|0)==0){u=a+(l+16)|0;v=c[u>>2]|0;if((v|0)==0){w=0;break}else{x=v;y=u}}else{x=o;y=s}while(1){s=x+20|0;o=c[s>>2]|0;if((o|0)!=0){x=o;y=s;continue}s=x+16|0;o=c[s>>2]|0;if((o|0)==0){break}else{x=o;y=s}}if(y>>>0<e>>>0){Wb()}else{c[y>>2]=0;w=x;break}}else{s=c[a+(l+8)>>2]|0;if(s>>>0<e>>>0){Wb()}o=s+12|0;if((c[o>>2]|0)!=(m|0)){Wb()}u=r+8|0;if((c[u>>2]|0)==(m|0)){c[o>>2]=r;c[u>>2]=s;w=r;break}else{Wb()}}}while(0);if((k|0)!=0){r=c[a+(l+28)>>2]|0;s=26496+(r<<2)|0;if((m|0)==(c[s>>2]|0)){c[s>>2]=w;if((w|0)==0){c[26196>>2]=c[26196>>2]&~(1<<r);p=m;q=n;break}}else{if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}r=k+16|0;if((c[r>>2]|0)==(m|0)){c[r>>2]=w}else{c[k+20>>2]=w}if((w|0)==0){p=m;q=n;break}}if(w>>>0<(c[26208>>2]|0)>>>0){Wb()}c[w+24>>2]=k;r=c[a+(l+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[w+16>>2]=r;c[r+24>>2]=w;break}}}while(0);r=c[a+(l+20)>>2]|0;if((r|0)!=0){if(r>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[w+20>>2]=r;c[r+24>>2]=w;p=m;q=n;break}}else{p=m;q=n}}else{p=m;q=n}}else{p=d;q=h}}while(0);if(!(p>>>0<j>>>0)){Wb()}d=a+(h+ -4)|0;w=c[d>>2]|0;if((w&1|0)==0){Wb()}if((w&2|0)==0){if((j|0)==(c[26216>>2]|0)){e=(c[26204>>2]|0)+q|0;c[26204>>2]=e;c[26216>>2]=p;c[p+4>>2]=e|1;if((p|0)!=(c[26212>>2]|0)){i=b;return}c[26212>>2]=0;c[26200>>2]=0;i=b;return}if((j|0)==(c[26212>>2]|0)){e=(c[26200>>2]|0)+q|0;c[26200>>2]=e;c[26212>>2]=p;c[p+4>>2]=e|1;c[p+e>>2]=e;i=b;return}e=(w&-8)+q|0;x=w>>>3;do{if(!(w>>>0<256)){y=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(j|0)){g=a+(h+12)|0;f=c[g>>2]|0;if((f|0)==0){r=a+(h+8)|0;k=c[r>>2]|0;if((k|0)==0){z=0;break}else{A=k;B=r}}else{A=f;B=g}while(1){g=A+20|0;f=c[g>>2]|0;if((f|0)!=0){A=f;B=g;continue}g=A+16|0;f=c[g>>2]|0;if((f|0)==0){break}else{A=f;B=g}}if(B>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[B>>2]=0;z=A;break}}else{g=c[a+h>>2]|0;if(g>>>0<(c[26208>>2]|0)>>>0){Wb()}f=g+12|0;if((c[f>>2]|0)!=(j|0)){Wb()}r=t+8|0;if((c[r>>2]|0)==(j|0)){c[f>>2]=t;c[r>>2]=g;z=t;break}else{Wb()}}}while(0);if((y|0)!=0){t=c[a+(h+20)>>2]|0;n=26496+(t<<2)|0;if((j|0)==(c[n>>2]|0)){c[n>>2]=z;if((z|0)==0){c[26196>>2]=c[26196>>2]&~(1<<t);break}}else{if(y>>>0<(c[26208>>2]|0)>>>0){Wb()}t=y+16|0;if((c[t>>2]|0)==(j|0)){c[t>>2]=z}else{c[y+20>>2]=z}if((z|0)==0){break}}if(z>>>0<(c[26208>>2]|0)>>>0){Wb()}c[z+24>>2]=y;t=c[a+(h+8)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[a+(h+12)>>2]|0;if((t|0)!=0){if(t>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[z+20>>2]=t;c[t+24>>2]=z;break}}}}else{t=c[a+h>>2]|0;y=c[a+(h|4)>>2]|0;n=26232+(x<<1<<2)|0;if((t|0)!=(n|0)){if(t>>>0<(c[26208>>2]|0)>>>0){Wb()}if((c[t+12>>2]|0)!=(j|0)){Wb()}}if((y|0)==(t|0)){c[6548]=c[6548]&~(1<<x);break}if((y|0)!=(n|0)){if(y>>>0<(c[26208>>2]|0)>>>0){Wb()}n=y+8|0;if((c[n>>2]|0)==(j|0)){C=n}else{Wb()}}else{C=y+8|0}c[t+12>>2]=y;c[C>>2]=t}}while(0);c[p+4>>2]=e|1;c[p+e>>2]=e;if((p|0)==(c[26212>>2]|0)){c[26200>>2]=e;i=b;return}else{D=e}}else{c[d>>2]=w&-2;c[p+4>>2]=q|1;c[p+q>>2]=q;D=q}q=D>>>3;if(D>>>0<256){w=q<<1;d=26232+(w<<2)|0;e=c[6548]|0;C=1<<q;if((e&C|0)!=0){q=26232+(w+2<<2)|0;j=c[q>>2]|0;if(j>>>0<(c[26208>>2]|0)>>>0){Wb()}else{E=q;F=j}}else{c[6548]=e|C;E=26232+(w+2<<2)|0;F=d}c[E>>2]=p;c[F+12>>2]=p;c[p+8>>2]=F;c[p+12>>2]=d;i=b;return}d=D>>>8;if((d|0)!=0){if(D>>>0>16777215){G=31}else{F=(d+1048320|0)>>>16&8;E=d<<F;d=(E+520192|0)>>>16&4;w=E<<d;E=(w+245760|0)>>>16&2;C=14-(d|F|E)+(w<<E>>>15)|0;G=D>>>(C+7|0)&1|C<<1}}else{G=0}C=26496+(G<<2)|0;c[p+28>>2]=G;c[p+20>>2]=0;c[p+16>>2]=0;E=c[26196>>2]|0;w=1<<G;a:do{if((E&w|0)!=0){F=c[C>>2]|0;if((G|0)==31){H=0}else{H=25-(G>>>1)|0}b:do{if((c[F+4>>2]&-8|0)!=(D|0)){d=D<<H;e=F;while(1){I=e+(d>>>31<<2)+16|0;j=c[I>>2]|0;if((j|0)==0){break}if((c[j+4>>2]&-8|0)==(D|0)){J=j;break b}else{d=d<<1;e=j}}if(I>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[I>>2]=p;c[p+24>>2]=e;c[p+12>>2]=p;c[p+8>>2]=p;break a}}else{J=F}}while(0);F=J+8|0;d=c[F>>2]|0;j=c[26208>>2]|0;if(J>>>0<j>>>0){Wb()}if(d>>>0<j>>>0){Wb()}else{c[d+12>>2]=p;c[F>>2]=p;c[p+8>>2]=d;c[p+12>>2]=J;c[p+24>>2]=0;break}}else{c[26196>>2]=E|w;c[C>>2]=p;c[p+24>>2]=C;c[p+12>>2]=p;c[p+8>>2]=p}}while(0);p=(c[26224>>2]|0)+ -1|0;c[26224>>2]=p;if((p|0)==0){K=26648|0}else{i=b;return}while(1){p=c[K>>2]|0;if((p|0)==0){break}else{K=p+8|0}}c[26224>>2]=-1;i=b;return}function wn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;if((a|0)!=0){e=fa(b,a)|0;if((b|a)>>>0>65535){f=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}else{f=e}}else{f=0}e=un(f)|0;if((e|0)==0){i=d;return e|0}if((c[e+ -4>>2]&3|0)==0){i=d;return e|0}Zn(e|0,0,f|0)|0;i=d;return e|0}function xn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;do{if((a|0)!=0){if(b>>>0>4294967231){c[(mc()|0)>>2]=12;e=0;break}if(b>>>0<11){f=16}else{f=b+11&-8}g=yn(a+ -8|0,f)|0;if((g|0)!=0){e=g+8|0;break}g=un(b)|0;if((g|0)==0){e=0}else{h=c[a+ -4>>2]|0;j=(h&-8)-((h&3|0)==0?8:4)|0;Xn(g|0,a|0,(j>>>0<b>>>0?j:b)|0)|0;vn(a);e=g}}else{e=un(b)|0}}while(0);i=d;return e|0}function yn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;e=a+4|0;f=c[e>>2]|0;g=f&-8;h=a+g|0;j=c[26208>>2]|0;if(a>>>0<j>>>0){Wb()}k=f&3;if(!((k|0)!=1&a>>>0<h>>>0)){Wb()}l=a+(g|4)|0;m=c[l>>2]|0;if((m&1|0)==0){Wb()}if((k|0)==0){if(b>>>0<256){n=0;i=d;return n|0}if(!(g>>>0<(b+4|0)>>>0)?!((g-b|0)>>>0>c[26672>>2]<<1>>>0):0){n=a;i=d;return n|0}n=0;i=d;return n|0}if(!(g>>>0<b>>>0)){k=g-b|0;if(!(k>>>0>15)){n=a;i=d;return n|0}c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;zn(a+b|0,k);n=a;i=d;return n|0}if((h|0)==(c[26216>>2]|0)){k=(c[26204>>2]|0)+g|0;if(!(k>>>0>b>>>0)){n=0;i=d;return n|0}l=k-b|0;c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=l|1;c[26216>>2]=a+b;c[26204>>2]=l;n=a;i=d;return n|0}if((h|0)==(c[26212>>2]|0)){l=(c[26200>>2]|0)+g|0;if(l>>>0<b>>>0){n=0;i=d;return n|0}k=l-b|0;if(k>>>0>15){c[e>>2]=f&1|b|2;c[a+(b+4)>>2]=k|1;c[a+l>>2]=k;o=a+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=a+b|0;q=k}else{c[e>>2]=f&1|l|2;f=a+(l+4)|0;c[f>>2]=c[f>>2]|1;p=0;q=0}c[26200>>2]=q;c[26212>>2]=p;n=a;i=d;return n|0}if((m&2|0)!=0){n=0;i=d;return n|0}p=(m&-8)+g|0;if(p>>>0<b>>>0){n=0;i=d;return n|0}q=p-b|0;f=m>>>3;do{if(!(m>>>0<256)){l=c[a+(g+24)>>2]|0;k=c[a+(g+12)>>2]|0;do{if((k|0)==(h|0)){o=a+(g+20)|0;r=c[o>>2]|0;if((r|0)==0){s=a+(g+16)|0;t=c[s>>2]|0;if((t|0)==0){u=0;break}else{v=t;w=s}}else{v=r;w=o}while(1){o=v+20|0;r=c[o>>2]|0;if((r|0)!=0){v=r;w=o;continue}o=v+16|0;r=c[o>>2]|0;if((r|0)==0){break}else{v=r;w=o}}if(w>>>0<j>>>0){Wb()}else{c[w>>2]=0;u=v;break}}else{o=c[a+(g+8)>>2]|0;if(o>>>0<j>>>0){Wb()}r=o+12|0;if((c[r>>2]|0)!=(h|0)){Wb()}s=k+8|0;if((c[s>>2]|0)==(h|0)){c[r>>2]=k;c[s>>2]=o;u=k;break}else{Wb()}}}while(0);if((l|0)!=0){k=c[a+(g+28)>>2]|0;o=26496+(k<<2)|0;if((h|0)==(c[o>>2]|0)){c[o>>2]=u;if((u|0)==0){c[26196>>2]=c[26196>>2]&~(1<<k);break}}else{if(l>>>0<(c[26208>>2]|0)>>>0){Wb()}k=l+16|0;if((c[k>>2]|0)==(h|0)){c[k>>2]=u}else{c[l+20>>2]=u}if((u|0)==0){break}}if(u>>>0<(c[26208>>2]|0)>>>0){Wb()}c[u+24>>2]=l;k=c[a+(g+16)>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(g+20)>>2]|0;if((k|0)!=0){if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[u+20>>2]=k;c[k+24>>2]=u;break}}}}else{k=c[a+(g+8)>>2]|0;l=c[a+(g+12)>>2]|0;o=26232+(f<<1<<2)|0;if((k|0)!=(o|0)){if(k>>>0<j>>>0){Wb()}if((c[k+12>>2]|0)!=(h|0)){Wb()}}if((l|0)==(k|0)){c[6548]=c[6548]&~(1<<f);break}if((l|0)!=(o|0)){if(l>>>0<j>>>0){Wb()}o=l+8|0;if((c[o>>2]|0)==(h|0)){x=o}else{Wb()}}else{x=l+8|0}c[k+12>>2]=l;c[x>>2]=k}}while(0);if(q>>>0<16){c[e>>2]=p|c[e>>2]&1|2;x=a+(p|4)|0;c[x>>2]=c[x>>2]|1;n=a;i=d;return n|0}else{c[e>>2]=c[e>>2]&1|b|2;c[a+(b+4)>>2]=q|3;e=a+(p|4)|0;c[e>>2]=c[e>>2]|1;zn(a+b|0,q);n=a;i=d;return n|0}return 0}function zn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;d=i;e=a+b|0;f=c[a+4>>2]|0;do{if((f&1|0)==0){g=c[a>>2]|0;if((f&3|0)==0){i=d;return}h=a+(0-g)|0;j=g+b|0;k=c[26208>>2]|0;if(h>>>0<k>>>0){Wb()}if((h|0)==(c[26212>>2]|0)){l=a+(b+4)|0;if((c[l>>2]&3|0)!=3){m=h;n=j;break}c[26200>>2]=j;c[l>>2]=c[l>>2]&-2;c[a+(4-g)>>2]=j|1;c[e>>2]=j;i=d;return}l=g>>>3;if(g>>>0<256){o=c[a+(8-g)>>2]|0;p=c[a+(12-g)>>2]|0;q=26232+(l<<1<<2)|0;if((o|0)!=(q|0)){if(o>>>0<k>>>0){Wb()}if((c[o+12>>2]|0)!=(h|0)){Wb()}}if((p|0)==(o|0)){c[6548]=c[6548]&~(1<<l);m=h;n=j;break}if((p|0)!=(q|0)){if(p>>>0<k>>>0){Wb()}q=p+8|0;if((c[q>>2]|0)==(h|0)){r=q}else{Wb()}}else{r=p+8|0}c[o+12>>2]=p;c[r>>2]=o;m=h;n=j;break}o=c[a+(24-g)>>2]|0;p=c[a+(12-g)>>2]|0;do{if((p|0)==(h|0)){q=16-g|0;l=a+(q+4)|0;s=c[l>>2]|0;if((s|0)==0){t=a+q|0;q=c[t>>2]|0;if((q|0)==0){u=0;break}else{v=q;w=t}}else{v=s;w=l}while(1){l=v+20|0;s=c[l>>2]|0;if((s|0)!=0){v=s;w=l;continue}l=v+16|0;s=c[l>>2]|0;if((s|0)==0){break}else{v=s;w=l}}if(w>>>0<k>>>0){Wb()}else{c[w>>2]=0;u=v;break}}else{l=c[a+(8-g)>>2]|0;if(l>>>0<k>>>0){Wb()}s=l+12|0;if((c[s>>2]|0)!=(h|0)){Wb()}t=p+8|0;if((c[t>>2]|0)==(h|0)){c[s>>2]=p;c[t>>2]=l;u=p;break}else{Wb()}}}while(0);if((o|0)!=0){p=c[a+(28-g)>>2]|0;k=26496+(p<<2)|0;if((h|0)==(c[k>>2]|0)){c[k>>2]=u;if((u|0)==0){c[26196>>2]=c[26196>>2]&~(1<<p);m=h;n=j;break}}else{if(o>>>0<(c[26208>>2]|0)>>>0){Wb()}p=o+16|0;if((c[p>>2]|0)==(h|0)){c[p>>2]=u}else{c[o+20>>2]=u}if((u|0)==0){m=h;n=j;break}}if(u>>>0<(c[26208>>2]|0)>>>0){Wb()}c[u+24>>2]=o;p=16-g|0;k=c[a+p>>2]|0;do{if((k|0)!=0){if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[u+16>>2]=k;c[k+24>>2]=u;break}}}while(0);k=c[a+(p+4)>>2]|0;if((k|0)!=0){if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[u+20>>2]=k;c[k+24>>2]=u;m=h;n=j;break}}else{m=h;n=j}}else{m=h;n=j}}else{m=a;n=b}}while(0);u=c[26208>>2]|0;if(e>>>0<u>>>0){Wb()}v=a+(b+4)|0;w=c[v>>2]|0;if((w&2|0)==0){if((e|0)==(c[26216>>2]|0)){r=(c[26204>>2]|0)+n|0;c[26204>>2]=r;c[26216>>2]=m;c[m+4>>2]=r|1;if((m|0)!=(c[26212>>2]|0)){i=d;return}c[26212>>2]=0;c[26200>>2]=0;i=d;return}if((e|0)==(c[26212>>2]|0)){r=(c[26200>>2]|0)+n|0;c[26200>>2]=r;c[26212>>2]=m;c[m+4>>2]=r|1;c[m+r>>2]=r;i=d;return}r=(w&-8)+n|0;f=w>>>3;do{if(!(w>>>0<256)){k=c[a+(b+24)>>2]|0;g=c[a+(b+12)>>2]|0;do{if((g|0)==(e|0)){o=a+(b+20)|0;l=c[o>>2]|0;if((l|0)==0){t=a+(b+16)|0;s=c[t>>2]|0;if((s|0)==0){x=0;break}else{y=s;z=t}}else{y=l;z=o}while(1){o=y+20|0;l=c[o>>2]|0;if((l|0)!=0){y=l;z=o;continue}o=y+16|0;l=c[o>>2]|0;if((l|0)==0){break}else{y=l;z=o}}if(z>>>0<u>>>0){Wb()}else{c[z>>2]=0;x=y;break}}else{o=c[a+(b+8)>>2]|0;if(o>>>0<u>>>0){Wb()}l=o+12|0;if((c[l>>2]|0)!=(e|0)){Wb()}t=g+8|0;if((c[t>>2]|0)==(e|0)){c[l>>2]=g;c[t>>2]=o;x=g;break}else{Wb()}}}while(0);if((k|0)!=0){g=c[a+(b+28)>>2]|0;j=26496+(g<<2)|0;if((e|0)==(c[j>>2]|0)){c[j>>2]=x;if((x|0)==0){c[26196>>2]=c[26196>>2]&~(1<<g);break}}else{if(k>>>0<(c[26208>>2]|0)>>>0){Wb()}g=k+16|0;if((c[g>>2]|0)==(e|0)){c[g>>2]=x}else{c[k+20>>2]=x}if((x|0)==0){break}}if(x>>>0<(c[26208>>2]|0)>>>0){Wb()}c[x+24>>2]=k;g=c[a+(b+16)>>2]|0;do{if((g|0)!=0){if(g>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[x+16>>2]=g;c[g+24>>2]=x;break}}}while(0);g=c[a+(b+20)>>2]|0;if((g|0)!=0){if(g>>>0<(c[26208>>2]|0)>>>0){Wb()}else{c[x+20>>2]=g;c[g+24>>2]=x;break}}}}else{g=c[a+(b+8)>>2]|0;k=c[a+(b+12)>>2]|0;j=26232+(f<<1<<2)|0;if((g|0)!=(j|0)){if(g>>>0<u>>>0){Wb()}if((c[g+12>>2]|0)!=(e|0)){Wb()}}if((k|0)==(g|0)){c[6548]=c[6548]&~(1<<f);break}if((k|0)!=(j|0)){if(k>>>0<u>>>0){Wb()}j=k+8|0;if((c[j>>2]|0)==(e|0)){A=j}else{Wb()}}else{A=k+8|0}c[g+12>>2]=k;c[A>>2]=g}}while(0);c[m+4>>2]=r|1;c[m+r>>2]=r;if((m|0)==(c[26212>>2]|0)){c[26200>>2]=r;i=d;return}else{B=r}}else{c[v>>2]=w&-2;c[m+4>>2]=n|1;c[m+n>>2]=n;B=n}n=B>>>3;if(B>>>0<256){w=n<<1;v=26232+(w<<2)|0;r=c[6548]|0;A=1<<n;if((r&A|0)!=0){n=26232+(w+2<<2)|0;e=c[n>>2]|0;if(e>>>0<(c[26208>>2]|0)>>>0){Wb()}else{C=n;D=e}}else{c[6548]=r|A;C=26232+(w+2<<2)|0;D=v}c[C>>2]=m;c[D+12>>2]=m;c[m+8>>2]=D;c[m+12>>2]=v;i=d;return}v=B>>>8;if((v|0)!=0){if(B>>>0>16777215){E=31}else{D=(v+1048320|0)>>>16&8;C=v<<D;v=(C+520192|0)>>>16&4;w=C<<v;C=(w+245760|0)>>>16&2;A=14-(v|D|C)+(w<<C>>>15)|0;E=B>>>(A+7|0)&1|A<<1}}else{E=0}A=26496+(E<<2)|0;c[m+28>>2]=E;c[m+20>>2]=0;c[m+16>>2]=0;C=c[26196>>2]|0;w=1<<E;if((C&w|0)==0){c[26196>>2]=C|w;c[A>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}w=c[A>>2]|0;if((E|0)==31){F=0}else{F=25-(E>>>1)|0}a:do{if((c[w+4>>2]&-8|0)==(B|0)){G=w}else{E=B<<F;A=w;while(1){H=A+(E>>>31<<2)+16|0;C=c[H>>2]|0;if((C|0)==0){break}if((c[C+4>>2]&-8|0)==(B|0)){G=C;break a}else{E=E<<1;A=C}}if(H>>>0<(c[26208>>2]|0)>>>0){Wb()}c[H>>2]=m;c[m+24>>2]=A;c[m+12>>2]=m;c[m+8>>2]=m;i=d;return}}while(0);H=G+8|0;B=c[H>>2]|0;w=c[26208>>2]|0;if(G>>>0<w>>>0){Wb()}if(B>>>0<w>>>0){Wb()}c[B+12>>2]=m;c[H>>2]=m;c[m+8>>2]=B;c[m+12>>2]=G;c[m+24>>2]=0;i=d;return}function An(a){a=a|0;var b=0,d=0,e=0,f=0;b=i;d=(a|0)==0?1:a;while(1){e=un(d)|0;if((e|0)!=0){f=6;break}a=c[6672]|0;c[6672]=a+0;if((a|0)==0){f=5;break}Rc[a&1]()}if((f|0)==5){d=Gb(4)|0;c[d>>2]=26704;pc(d|0,26752,110)}else if((f|0)==6){i=b;return e|0}return 0}function Bn(a){a=a|0;var b=0,c=0;b=i;c=An(a)|0;i=b;return c|0}function Cn(a){a=a|0;var b=0;b=i;if((a|0)!=0){vn(a)}i=b;return}function Dn(a){a=a|0;var b=0;b=i;Cn(a);i=b;return}function En(a){a=a|0;var b=0;b=i;ab(a|0);Cn(a);i=b;return}function Fn(a){a=a|0;var b=0;b=i;ab(a|0);i=b;return}function Gn(a){a=a|0;return 26720}function Hn(){var a=0;a=Gb(4)|0;c[a>>2]=26704;pc(a|0,26752,110)}function In(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0.0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0.0,R=0,S=0,T=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0.0,ba=0,ca=0.0,da=0,ea=0.0,ga=0,ha=0.0,ia=0,ja=0.0,ka=0,la=0,ma=0,na=0,oa=0,pa=0,qa=0,ra=0.0,sa=0,ta=0.0,ua=0,va=0,wa=0,xa=0,ya=0.0,za=0,Aa=0.0,Ba=0.0,Ca=0,Da=0.0,Ea=0,Fa=0,Ga=0,Ha=0,Ia=0,Ja=0,Ka=0,La=0,Ma=0,Na=0,Oa=0,Pa=0,Qa=0,Ra=0,Sa=0,Ta=0,Ua=0,Va=0,Wa=0,Xa=0,Ya=0,Za=0,_a=0,$a=0,ab=0,bb=0,cb=0,db=0,eb=0,fb=0,gb=0,hb=0,ib=0,jb=0,kb=0,lb=0,mb=0,nb=0,ob=0,pb=0,qb=0,rb=0,sb=0,tb=0,ub=0,vb=0,wb=0,xb=0,yb=0,zb=0,Ab=0,Bb=0,Cb=0,Db=0,Fb=0,Gb=0,Hb=0,Ib=0,Jb=0,Kb=0,Lb=0,Mb=0,Nb=0,Ob=0,Pb=0,Qb=0,Rb=0,Sb=0,Tb=0,Ub=0,Vb=0,Wb=0,Xb=0,Zb=0,_b=0,$b=0,ac=0,bc=0,cc=0,dc=0,ec=0,fc=0,gc=0,hc=0,ic=0,jc=0,kc=0,lc=0,oc=0,pc=0,qc=0,rc=0.0,sc=0,tc=0,uc=0.0,vc=0.0,wc=0.0,xc=0.0,yc=0.0,zc=0.0,Ac=0,Bc=0,Cc=0.0,Dc=0,Ec=0.0,Fc=0,Gc=0,Hc=0,Ic=0;g=i;i=i+512|0;h=g;if((e|0)==2){j=53;k=-1074}else if((e|0)==1){j=53;k=-1074}else if((e|0)==0){j=24;k=-149}else{l=0.0;i=g;return+l}e=b+4|0;m=b+100|0;do{n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;o=d[n]|0}else{o=Ln(b)|0}}while((Yb(o|0)|0)!=0);do{if((o|0)==43|(o|0)==45){n=1-(((o|0)==45)<<1)|0;p=c[e>>2]|0;if(p>>>0<(c[m>>2]|0)>>>0){c[e>>2]=p+1;q=d[p]|0;r=n;break}else{q=Ln(b)|0;r=n;break}}else{q=o;r=1}}while(0);o=q;q=0;while(1){if((o|32|0)!=(a[26768+q|0]|0)){s=o;t=q;break}do{if(q>>>0<7){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;u=d[n]|0;break}else{u=Ln(b)|0;break}}else{u=o}}while(0);n=q+1|0;if(n>>>0<8){o=u;q=n}else{s=u;t=n;break}}do{if((t|0)==3){v=23}else if((t|0)!=8){u=(f|0)==0;if(!(t>>>0<4|u)){if((t|0)==8){break}else{v=23;break}}a:do{if((t|0)==0){q=s;o=0;while(1){if((q|32|0)!=(a[26784+o|0]|0)){w=q;x=o;break a}do{if(o>>>0<2){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;A=d[n]|0;break}else{A=Ln(b)|0;break}}else{A=q}}while(0);n=o+1|0;if(n>>>0<3){q=A;o=n}else{w=A;x=n;break}}}else{w=s;x=t}}while(0);if((x|0)==0){do{if((w|0)==48){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;B=d[o]|0}else{B=Ln(b)|0}if((B|32|0)!=120){if((c[m>>2]|0)==0){C=48;break}c[e>>2]=(c[e>>2]|0)+ -1;C=48;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=0}else{D=Ln(b)|0;E=0}while(1){if((D|0)==46){v=70;break}else if((D|0)!=48){F=0;G=0;H=0;I=0;K=D;L=E;M=0;N=0;O=1.0;P=0;Q=0.0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;D=d[o]|0;E=1;continue}else{D=Ln(b)|0;E=1;continue}}b:do{if((v|0)==70){o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;R=d[o]|0}else{R=Ln(b)|0}if((R|0)==48){o=-1;q=-1;while(1){n=c[e>>2]|0;if(n>>>0<(c[m>>2]|0)>>>0){c[e>>2]=n+1;S=d[n]|0}else{S=Ln(b)|0}if((S|0)!=48){F=0;G=0;H=o;I=q;K=S;L=1;M=1;N=0;O=1.0;P=0;Q=0.0;break b}n=Tn(o|0,q|0,-1,-1)|0;o=n;q=J}}else{F=0;G=0;H=0;I=0;K=R;L=E;M=1;N=0;O=1.0;P=0;Q=0.0}}}while(0);c:while(1){q=K+ -48|0;do{if(!(q>>>0<10)){o=K|32;n=(K|0)==46;if(!((o+ -97|0)>>>0<6|n)){T=K;break c}if(n){if((M|0)==0){V=G;W=F;X=G;Y=F;Z=L;_=1;$=N;aa=O;ba=P;ca=Q;break}else{T=46;break c}}else{da=(K|0)>57?o+ -87|0:q;v=84;break}}else{da=q;v=84}}while(0);if((v|0)==84){v=0;do{if(!((F|0)<0|(F|0)==0&G>>>0<8)){if((F|0)<0|(F|0)==0&G>>>0<14){ea=O*.0625;ga=N;ha=ea;ia=P;ja=Q+ea*+(da|0);break}if((da|0)!=0&(N|0)==0){ga=1;ha=O;ia=P;ja=Q+O*.5}else{ga=N;ha=O;ia=P;ja=Q}}else{ga=N;ha=O;ia=da+(P<<4)|0;ja=Q}}while(0);q=Tn(G|0,F|0,1,0)|0;V=H;W=I;X=q;Y=J;Z=1;_=M;$=ga;aa=ha;ba=ia;ca=ja}q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;F=Y;G=X;H=V;I=W;K=d[q]|0;L=Z;M=_;N=$;O=aa;P=ba;Q=ca;continue}else{F=Y;G=X;H=V;I=W;K=Ln(b)|0;L=Z;M=_;N=$;O=aa;P=ba;Q=ca;continue}}if((L|0)==0){q=(c[m>>2]|0)==0;if(!q){c[e>>2]=(c[e>>2]|0)+ -1}if(!u){if(!q?(q=c[e>>2]|0,c[e>>2]=q+ -1,(M|0)!=0):0){c[e>>2]=q+ -2}}else{Kn(b,0)}l=+(r|0)*0.0;i=g;return+l}q=(M|0)==0;o=q?G:H;n=q?F:I;if((F|0)<0|(F|0)==0&G>>>0<8){q=G;p=F;ka=P;while(1){la=ka<<4;ma=Tn(q|0,p|0,1,0)|0;na=J;if((na|0)<0|(na|0)==0&ma>>>0<8){q=ma;p=na;ka=la}else{oa=la;break}}}else{oa=P}do{if((T|32|0)==112){ka=Jn(b,f)|0;p=J;if((ka|0)==0&(p|0)==-2147483648){if(u){Kn(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){pa=0;qa=0;break}c[e>>2]=(c[e>>2]|0)+ -1;pa=0;qa=0;break}}else{pa=ka;qa=p}}else{if((c[m>>2]|0)==0){pa=0;qa=0}else{c[e>>2]=(c[e>>2]|0)+ -1;pa=0;qa=0}}}while(0);p=$n(o|0,n|0,2)|0;ka=Tn(p|0,J|0,-32,-1)|0;p=Tn(ka|0,J|0,pa|0,qa|0)|0;ka=J;if((oa|0)==0){l=+(r|0)*0.0;i=g;return+l}if((ka|0)>0|(ka|0)==0&p>>>0>(0-k|0)>>>0){c[(mc()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}q=k+ -106|0;la=((q|0)<0)<<31>>31;if((ka|0)<(la|0)|(ka|0)==(la|0)&p>>>0<q>>>0){c[(mc()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((oa|0)>-1){q=p;la=ka;na=oa;ea=Q;while(1){ma=na<<1;if(!(ea>=.5)){ra=ea;sa=ma}else{ra=ea+-1.0;sa=ma|1}ta=ea+ra;ma=Tn(q|0,la|0,-1,-1)|0;ua=J;if((sa|0)>-1){q=ma;la=ua;na=sa;ea=ta}else{va=ma;wa=ua;xa=sa;ya=ta;break}}}else{va=p;wa=ka;xa=oa;ya=Q}na=Sn(32,0,k|0,((k|0)<0)<<31>>31|0)|0;la=Tn(va|0,wa|0,na|0,J|0)|0;na=J;if(0>(na|0)|0==(na|0)&j>>>0>la>>>0){za=(la|0)<0?0:la}else{za=j}if((za|0)<53){ea=+(r|0);ta=+nc(+(+Mn(1.0,84-za|0)),+ea);if((za|0)<32&ya!=0.0){la=xa&1;Aa=ea;Ba=ta;Ca=(la^1)+xa|0;Da=(la|0)==0?0.0:ya}else{Aa=ea;Ba=ta;Ca=xa;Da=ya}}else{Aa=+(r|0);Ba=0.0;Ca=xa;Da=ya}ta=Aa*Da+(Ba+Aa*+(Ca>>>0))-Ba;if(!(ta!=0.0)){c[(mc()|0)>>2]=34}l=+Nn(ta,va);i=g;return+l}else{C=w}}while(0);la=k+j|0;na=0-la|0;q=C;n=0;while(1){if((q|0)==46){v=139;break}else if((q|0)!=48){Ea=q;Fa=0;Ga=0;Ha=n;Ia=0;break}o=c[e>>2]|0;if(o>>>0<(c[m>>2]|0)>>>0){c[e>>2]=o+1;q=d[o]|0;n=1;continue}else{q=Ln(b)|0;n=1;continue}}d:do{if((v|0)==139){q=c[e>>2]|0;if(q>>>0<(c[m>>2]|0)>>>0){c[e>>2]=q+1;Ja=d[q]|0}else{Ja=Ln(b)|0}if((Ja|0)==48){q=-1;o=-1;while(1){ua=c[e>>2]|0;if(ua>>>0<(c[m>>2]|0)>>>0){c[e>>2]=ua+1;Ka=d[ua]|0}else{Ka=Ln(b)|0}if((Ka|0)!=48){Ea=Ka;Fa=q;Ga=o;Ha=1;Ia=1;break d}ua=Tn(q|0,o|0,-1,-1)|0;q=ua;o=J}}else{Ea=Ja;Fa=0;Ga=0;Ha=n;Ia=1}}}while(0);c[h>>2]=0;n=Ea+ -48|0;o=(Ea|0)==46;e:do{if(n>>>0<10|o){q=h+496|0;ka=Ea;p=0;ua=0;ma=o;La=n;Ma=Fa;Na=Ga;Oa=Ha;Pa=Ia;Qa=0;Ra=0;Sa=0;while(1){do{if(ma){if((Pa|0)==0){Ta=p;Ua=ua;Va=p;Wa=ua;Xa=Oa;Ya=1;Za=Qa;_a=Ra;$a=Sa}else{ab=ka;bb=Ma;cb=Na;db=p;eb=ua;fb=Oa;gb=Qa;hb=Ra;ib=Sa;break e}}else{jb=Tn(p|0,ua|0,1,0)|0;kb=J;lb=(ka|0)!=48;if((Ra|0)>=125){if(!lb){Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=Oa;Ya=Pa;Za=Qa;_a=Ra;$a=Sa;break}c[q>>2]=c[q>>2]|1;Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=Oa;Ya=Pa;Za=Qa;_a=Ra;$a=Sa;break}mb=h+(Ra<<2)|0;if((Qa|0)==0){nb=La}else{nb=ka+ -48+((c[mb>>2]|0)*10|0)|0}c[mb>>2]=nb;mb=Qa+1|0;ob=(mb|0)==9;Ta=Ma;Ua=Na;Va=jb;Wa=kb;Xa=1;Ya=Pa;Za=ob?0:mb;_a=(ob&1)+Ra|0;$a=lb?jb:Sa}}while(0);jb=c[e>>2]|0;if(jb>>>0<(c[m>>2]|0)>>>0){c[e>>2]=jb+1;pb=d[jb]|0}else{pb=Ln(b)|0}jb=pb+ -48|0;lb=(pb|0)==46;if(jb>>>0<10|lb){ka=pb;p=Va;ua=Wa;ma=lb;La=jb;Ma=Ta;Na=Ua;Oa=Xa;Pa=Ya;Qa=Za;Ra=_a;Sa=$a}else{qb=pb;rb=Va;sb=Ta;tb=Wa;ub=Ua;vb=Xa;wb=Ya;xb=Za;yb=_a;zb=$a;v=162;break}}}else{qb=Ea;rb=0;sb=Fa;tb=0;ub=Ga;vb=Ha;wb=Ia;xb=0;yb=0;zb=0;v=162}}while(0);if((v|0)==162){n=(wb|0)==0;ab=qb;bb=n?rb:sb;cb=n?tb:ub;db=rb;eb=tb;fb=vb;gb=xb;hb=yb;ib=zb}n=(fb|0)!=0;if(n?(ab|32|0)==101:0){o=Jn(b,f)|0;Sa=J;do{if((o|0)==0&(Sa|0)==-2147483648){if(u){Kn(b,0);l=0.0;i=g;return+l}else{if((c[m>>2]|0)==0){Ab=0;Bb=0;break}c[e>>2]=(c[e>>2]|0)+ -1;Ab=0;Bb=0;break}}else{Ab=o;Bb=Sa}}while(0);Sa=Tn(Ab|0,Bb|0,bb|0,cb|0)|0;Cb=Sa;Db=J}else{if((ab|0)>-1?(c[m>>2]|0)!=0:0){c[e>>2]=(c[e>>2]|0)+ -1;Cb=bb;Db=cb}else{Cb=bb;Db=cb}}if(!n){c[(mc()|0)>>2]=22;Kn(b,0);l=0.0;i=g;return+l}Sa=c[h>>2]|0;if((Sa|0)==0){l=+(r|0)*0.0;i=g;return+l}do{if((Cb|0)==(db|0)&(Db|0)==(eb|0)&((eb|0)<0|(eb|0)==0&db>>>0<10)){if(!(j>>>0>30)?(Sa>>>j|0)!=0:0){break}l=+(r|0)*+(Sa>>>0);i=g;return+l}}while(0);Sa=(k|0)/-2|0;n=((Sa|0)<0)<<31>>31;if((Db|0)>(n|0)|(Db|0)==(n|0)&Cb>>>0>Sa>>>0){c[(mc()|0)>>2]=34;l=+(r|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+l}Sa=k+ -106|0;n=((Sa|0)<0)<<31>>31;if((Db|0)<(n|0)|(Db|0)==(n|0)&Cb>>>0<Sa>>>0){c[(mc()|0)>>2]=34;l=+(r|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+l}if((gb|0)==0){Fb=hb}else{if((gb|0)<9){Sa=h+(hb<<2)|0;n=c[Sa>>2]|0;o=gb;do{n=n*10|0;o=o+1|0}while((o|0)!=9);c[Sa>>2]=n}Fb=hb+1|0}do{if((ib|0)<9?(ib|0)<=(Cb|0)&(Cb|0)<18:0){if((Cb|0)==9){l=+(r|0)*+((c[h>>2]|0)>>>0);i=g;return+l}if((Cb|0)<9){l=+(r|0)*+((c[h>>2]|0)>>>0)/+(c[26800+(8-Cb<<2)>>2]|0);i=g;return+l}o=j+27+(fa(Cb,-3)|0)|0;Ra=c[h>>2]|0;if((o|0)<=30?(Ra>>>o|0)!=0:0){break}l=+(r|0)*+(Ra>>>0)*+(c[26800+(Cb+ -10<<2)>>2]|0);i=g;return+l}}while(0);n=(Cb|0)%9|0;if((n|0)==0){Gb=0;Hb=0;Ib=Cb;Jb=Fb}else{Sa=(Cb|0)>-1?n:n+9|0;n=c[26800+(8-Sa<<2)>>2]|0;if((Fb|0)!=0){Ra=1e9/(n|0)|0;o=0;Qa=0;Pa=0;Oa=Cb;while(1){Na=h+(Pa<<2)|0;Ma=c[Na>>2]|0;La=((Ma>>>0)/(n>>>0)|0)+Qa|0;c[Na>>2]=La;Kb=fa((Ma>>>0)%(n>>>0)|0,Ra)|0;Ma=Pa+1|0;if((Pa|0)==(o|0)&(La|0)==0){Lb=Ma&127;Mb=Oa+ -9|0}else{Lb=o;Mb=Oa}if((Ma|0)==(Fb|0)){break}else{o=Lb;Qa=Kb;Pa=Ma;Oa=Mb}}if((Kb|0)==0){Nb=Lb;Ob=Mb;Pb=Fb}else{c[h+(Fb<<2)>>2]=Kb;Nb=Lb;Ob=Mb;Pb=Fb+1|0}}else{Nb=0;Ob=Cb;Pb=0}Gb=Nb;Hb=0;Ib=9-Sa+Ob|0;Jb=Pb}f:while(1){Oa=h+(Gb<<2)|0;if((Ib|0)<18){Pa=Hb;Qa=Jb;while(1){o=0;Ra=Qa+127|0;n=Qa;while(1){Ma=Ra&127;La=h+(Ma<<2)|0;Na=$n(c[La>>2]|0,0,29)|0;ma=Tn(Na|0,J|0,o|0,0)|0;Na=J;if(Na>>>0>0|(Na|0)==0&ma>>>0>1e9){ua=ko(ma|0,Na|0,1e9,0)|0;p=lo(ma|0,Na|0,1e9,0)|0;Qb=p;Rb=ua}else{Qb=ma;Rb=0}c[La>>2]=Qb;La=(Ma|0)==(Gb|0);if((Ma|0)!=(n+127&127|0)|La){Sb=n}else{Sb=(Qb|0)==0?Ma:n}if(La){break}else{o=Rb;Ra=Ma+ -1|0;n=Sb}}n=Pa+ -29|0;if((Rb|0)==0){Pa=n;Qa=Sb}else{Tb=n;Ub=Rb;Vb=Sb;break}}}else{if((Ib|0)==18){Wb=Hb;Xb=Jb}else{Zb=Gb;_b=Hb;$b=Ib;ac=Jb;break}while(1){if(!((c[Oa>>2]|0)>>>0<9007199)){Zb=Gb;_b=Wb;$b=18;ac=Xb;break f}Qa=0;Pa=Xb+127|0;n=Xb;while(1){Ra=Pa&127;o=h+(Ra<<2)|0;Ma=$n(c[o>>2]|0,0,29)|0;La=Tn(Ma|0,J|0,Qa|0,0)|0;Ma=J;if(Ma>>>0>0|(Ma|0)==0&La>>>0>1e9){ma=ko(La|0,Ma|0,1e9,0)|0;ua=lo(La|0,Ma|0,1e9,0)|0;bc=ua;cc=ma}else{bc=La;cc=0}c[o>>2]=bc;o=(Ra|0)==(Gb|0);if((Ra|0)!=(n+127&127|0)|o){dc=n}else{dc=(bc|0)==0?Ra:n}if(o){break}else{Qa=cc;Pa=Ra+ -1|0;n=dc}}n=Wb+ -29|0;if((cc|0)==0){Wb=n;Xb=dc}else{Tb=n;Ub=cc;Vb=dc;break}}}Oa=Gb+127&127;if((Oa|0)==(Vb|0)){n=Vb+127&127;Pa=h+((Vb+126&127)<<2)|0;c[Pa>>2]=c[Pa>>2]|c[h+(n<<2)>>2];ec=n}else{ec=Vb}c[h+(Oa<<2)>>2]=Ub;Gb=Oa;Hb=Tb;Ib=Ib+9|0;Jb=ec}g:while(1){fc=ac+1&127;Sa=h+((ac+127&127)<<2)|0;Oa=Zb;n=_b;Pa=$b;while(1){Qa=(Pa|0)==18;Ra=(Pa|0)>27?9:1;gc=Oa;hc=n;while(1){o=0;while(1){La=o+gc&127;if((La|0)==(ac|0)){ic=2;break}ma=c[h+(La<<2)>>2]|0;La=c[26792+(o<<2)>>2]|0;if(ma>>>0<La>>>0){ic=2;break}ua=o+1|0;if(ma>>>0>La>>>0){ic=o;break}if((ua|0)<2){o=ua}else{ic=ua;break}}if((ic|0)==2&Qa){break g}jc=Ra+hc|0;if((gc|0)==(ac|0)){gc=ac;hc=jc}else{break}}Qa=(1<<Ra)+ -1|0;o=1e9>>>Ra;kc=gc;lc=0;ua=gc;oc=Pa;do{La=h+(ua<<2)|0;ma=c[La>>2]|0;Ma=(ma>>>Ra)+lc|0;c[La>>2]=Ma;lc=fa(ma&Qa,o)|0;ma=(ua|0)==(kc|0)&(Ma|0)==0;ua=ua+1&127;oc=ma?oc+ -9|0:oc;kc=ma?ua:kc}while((ua|0)!=(ac|0));if((lc|0)==0){Oa=kc;n=jc;Pa=oc;continue}if((fc|0)!=(kc|0)){break}c[Sa>>2]=c[Sa>>2]|1;Oa=kc;n=jc;Pa=oc}c[h+(ac<<2)>>2]=lc;Zb=kc;_b=jc;$b=oc;ac=fc}Pa=gc&127;if((Pa|0)==(ac|0)){c[h+(fc+ -1<<2)>>2]=0;pc=fc}else{pc=ac}ta=+((c[h+(Pa<<2)>>2]|0)>>>0);Pa=gc+1&127;if((Pa|0)==(pc|0)){n=pc+1&127;c[h+(n+ -1<<2)>>2]=0;qc=n}else{qc=pc}ea=+(r|0);rc=ea*(ta*1.0e9+ +((c[h+(Pa<<2)>>2]|0)>>>0));Pa=hc+53|0;n=Pa-k|0;if((n|0)<(j|0)){sc=(n|0)<0?0:n;tc=1}else{sc=j;tc=0}if((sc|0)<53){ta=+nc(+(+Mn(1.0,105-sc|0)),+rc);uc=+Eb(+rc,+(+Mn(1.0,53-sc|0)));vc=ta;wc=uc;xc=ta+(rc-uc)}else{vc=0.0;wc=0.0;xc=rc}Oa=gc+2&127;if((Oa|0)!=(qc|0)){Sa=c[h+(Oa<<2)>>2]|0;do{if(!(Sa>>>0<5e8)){if(Sa>>>0>5e8){yc=ea*.75+wc;break}if((gc+3&127|0)==(qc|0)){yc=ea*.5+wc;break}else{yc=ea*.75+wc;break}}else{if((Sa|0)==0?(gc+3&127|0)==(qc|0):0){yc=wc;break}yc=ea*.25+wc}}while(0);if((53-sc|0)>1?!(+Eb(+yc,1.0)!=0.0):0){zc=yc+1.0}else{zc=yc}}else{zc=wc}ea=xc+zc-vc;do{if((Pa&2147483647|0)>(-2-la|0)){if(!(+U(+ea)>=9007199254740992.0)){Ac=tc;Bc=hc;Cc=ea}else{Ac=(tc|0)!=0&(sc|0)==(n|0)?0:tc;Bc=hc+1|0;Cc=ea*.5}if((Bc+50|0)<=(na|0)?!((Ac|0)!=0&zc!=0.0):0){Dc=Bc;Ec=Cc;break}c[(mc()|0)>>2]=34;Dc=Bc;Ec=Cc}else{Dc=hc;Ec=ea}}while(0);l=+Nn(Ec,Dc);i=g;return+l}else if((x|0)==3){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Fc=d[na]|0}else{Fc=Ln(b)|0}if((Fc|0)==40){Gc=1}else{if((c[m>>2]|0)==0){l=y;i=g;return+l}c[e>>2]=(c[e>>2]|0)+ -1;l=y;i=g;return+l}while(1){na=c[e>>2]|0;if(na>>>0<(c[m>>2]|0)>>>0){c[e>>2]=na+1;Hc=d[na]|0}else{Hc=Ln(b)|0}if(!((Hc+ -48|0)>>>0<10|(Hc+ -65|0)>>>0<26)?!((Hc+ -97|0)>>>0<26|(Hc|0)==95):0){break}Gc=Gc+1|0}if((Hc|0)==41){l=y;i=g;return+l}na=(c[m>>2]|0)==0;if(!na){c[e>>2]=(c[e>>2]|0)+ -1}if(u){c[(mc()|0)>>2]=22;Kn(b,0);l=0.0;i=g;return+l}if((Gc|0)==0|na){l=y;i=g;return+l}else{Ic=Gc}while(1){na=Ic+ -1|0;c[e>>2]=(c[e>>2]|0)+ -1;if((na|0)==0){l=y;break}else{Ic=na}}i=g;return+l}else{if((c[m>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)+ -1}c[(mc()|0)>>2]=22;Kn(b,0);l=0.0;i=g;return+l}}}while(0);if((v|0)==23){v=(c[m>>2]|0)==0;if(!v){c[e>>2]=(c[e>>2]|0)+ -1}if(!(t>>>0<4|(f|0)==0|v)){v=t;do{c[e>>2]=(c[e>>2]|0)+ -1;v=v+ -1|0}while(v>>>0>3)}}l=+(r|0)*z;i=g;return+l}function Jn(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;f=a+4|0;g=c[f>>2]|0;h=a+100|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;j=d[g]|0}else{j=Ln(a)|0}if((j|0)==43|(j|0)==45){g=(j|0)==45|0;k=c[f>>2]|0;if(k>>>0<(c[h>>2]|0)>>>0){c[f>>2]=k+1;l=d[k]|0}else{l=Ln(a)|0}if(!((l+ -48|0)>>>0<10|(b|0)==0)?(c[h>>2]|0)!=0:0){c[f>>2]=(c[f>>2]|0)+ -1;m=l;n=g}else{m=l;n=g}}else{m=j;n=0}if((m+ -48|0)>>>0>9){if((c[h>>2]|0)==0){o=-2147483648;p=0;J=o;i=e;return p|0}c[f>>2]=(c[f>>2]|0)+ -1;o=-2147483648;p=0;J=o;i=e;return p|0}else{q=m;r=0}while(1){s=q+ -48+r|0;m=c[f>>2]|0;if(m>>>0<(c[h>>2]|0)>>>0){c[f>>2]=m+1;t=d[m]|0}else{t=Ln(a)|0}if(!((t+ -48|0)>>>0<10&(s|0)<214748364)){break}q=t;r=s*10|0}r=((s|0)<0)<<31>>31;if((t+ -48|0)>>>0<10){q=s;m=r;j=t;while(1){g=jo(q|0,m|0,10,0)|0;l=J;b=Tn(j|0,((j|0)<0)<<31>>31|0,-48,-1)|0;k=Tn(b|0,J|0,g|0,l|0)|0;l=J;g=c[f>>2]|0;if(g>>>0<(c[h>>2]|0)>>>0){c[f>>2]=g+1;u=d[g]|0}else{u=Ln(a)|0}if((u+ -48|0)>>>0<10&((l|0)<21474836|(l|0)==21474836&k>>>0<2061584302)){q=k;m=l;j=u}else{v=k;w=l;x=u;break}}}else{v=s;w=r;x=t}if((x+ -48|0)>>>0<10){do{x=c[f>>2]|0;if(x>>>0<(c[h>>2]|0)>>>0){c[f>>2]=x+1;y=d[x]|0}else{y=Ln(a)|0}}while((y+ -48|0)>>>0<10)}if((c[h>>2]|0)!=0){c[f>>2]=(c[f>>2]|0)+ -1}f=(n|0)!=0;n=Sn(0,0,v|0,w|0)|0;o=f?J:w;p=f?n:v;J=o;i=e;return p|0}function Kn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=i;c[a+104>>2]=b;e=c[a+8>>2]|0;f=c[a+4>>2]|0;g=e-f|0;c[a+108>>2]=g;if((b|0)!=0&(g|0)>(b|0)){c[a+100>>2]=f+b;i=d;return}else{c[a+100>>2]=e;i=d;return}}function Ln(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0;e=i;f=b+104|0;g=c[f>>2]|0;if(!((g|0)!=0?(c[b+108>>2]|0)>=(g|0):0)){h=3}if((h|0)==3?(h=Pn(b)|0,(h|0)>=0):0){g=c[f>>2]|0;f=c[b+8>>2]|0;if((g|0)!=0?(j=c[b+4>>2]|0,k=g-(c[b+108>>2]|0)+ -1|0,(f-j|0)>(k|0)):0){c[b+100>>2]=j+k}else{c[b+100>>2]=f}k=c[b+4>>2]|0;if((f|0)!=0){j=b+108|0;c[j>>2]=f+1-k+(c[j>>2]|0)}j=k+ -1|0;if((d[j]|0|0)==(h|0)){l=h;i=e;return l|0}a[j]=h;l=h;i=e;return l|0}c[b+100>>2]=0;l=-1;i=e;return l|0}function Mn(a,b){a=+a;b=b|0;var d=0,e=0.0,f=0,g=0,j=0,l=0.0;d=i;if((b|0)>1023){e=a*8.98846567431158e+307;f=b+ -1023|0;if((f|0)>1023){g=b+ -2046|0;j=(g|0)>1023?1023:g;l=e*8.98846567431158e+307}else{j=f;l=e}}else{if((b|0)<-1022){e=a*2.2250738585072014e-308;f=b+1022|0;if((f|0)<-1022){g=b+2044|0;j=(g|0)<-1022?-1022:g;l=e*2.2250738585072014e-308}else{j=f;l=e}}else{j=b;l=a}}b=$n(j+1023|0,0,52)|0;j=J;c[k>>2]=b;c[k+4>>2]=j;a=l*+h[k>>3];i=d;return+a}function Nn(a,b){a=+a;b=b|0;var c=0,d=0.0;c=i;d=+Mn(a,b);i=c;return+d}function On(b){b=b|0;var d=0,e=0,f=0,g=0,h=0;d=i;e=b+74|0;f=a[e]|0;a[e]=f+255|f;f=b+20|0;e=b+44|0;if((c[f>>2]|0)>>>0>(c[e>>2]|0)>>>0){Dc[c[b+36>>2]&31](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[f>>2]=0;f=c[b>>2]|0;if((f&20|0)==0){g=c[e>>2]|0;c[b+8>>2]=g;c[b+4>>2]=g;h=0;i=d;return h|0}if((f&4|0)==0){h=-1;i=d;return h|0}c[b>>2]=f|32;h=-1;i=d;return h|0}function Pn(a){a=a|0;var b=0,e=0,f=0;b=i;i=i+16|0;e=b;if((c[a+8>>2]|0)==0?(On(a)|0)!=0:0){f=-1}else{if((Dc[c[a+32>>2]&31](a,e,1)|0)==1){f=d[e]|0}else{f=-1}}i=b;return f|0}function Qn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0.0,j=0,k=0;d=i;i=i+112|0;e=d;f=e+0|0;g=f+112|0;do{c[f>>2]=0;f=f+4|0}while((f|0)<(g|0));f=e+4|0;c[f>>2]=a;g=e+8|0;c[g>>2]=-1;c[e+44>>2]=a;c[e+76>>2]=-1;Kn(e,0);h=+In(e,2,1);j=(c[f>>2]|0)-(c[g>>2]|0)+(c[e+108>>2]|0)|0;if((b|0)==0){i=d;return+h}if((j|0)==0){k=a}else{k=a+j|0}c[b>>2]=k;i=d;return+h}function Rn(){c[3578]=p;c[3604]=p;c[6460]=p;c[6690]=p}function Sn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(J=e,a-c>>>0|0)|0}function Tn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(J=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function Un(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Vn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;w=w+1|0;c[a>>2]=w;while((e|0)<40){if((c[d+(e<<2)>>2]|0)==0){c[d+(e<<2)>>2]=w;c[d+((e<<2)+4)>>2]=b;c[d+((e<<2)+8)>>2]=0;return 0}e=e+2|0}rb(116);rb(111);rb(111);rb(32);rb(109);rb(97);rb(110);rb(121);rb(32);rb(115);rb(101);rb(116);rb(106);rb(109);rb(112);rb(115);rb(32);rb(105);rb(110);rb(32);rb(97);rb(32);rb(102);rb(117);rb(110);rb(99);rb(116);rb(105);rb(111);rb(110);rb(32);rb(99);rb(97);rb(108);rb(108);rb(44);rb(32);rb(98);rb(117);rb(105);rb(108);rb(100);rb(32);rb(119);rb(105);rb(116);rb(104);rb(32);rb(97);rb(32);rb(104);rb(105);rb(103);rb(104);rb(101);rb(114);rb(32);rb(118);rb(97);rb(108);rb(117);rb(101);rb(32);rb(102);rb(111);rb(114);rb(32);rb(77);rb(65);rb(88);rb(95);rb(83);rb(69);rb(84);rb(74);rb(77);rb(80);rb(83);rb(10);ga(0);return 0}function Wn(a,b){a=a|0;b=b|0;var d=0,e=0;while((d|0)<20){e=c[b+(d<<2)>>2]|0;if((e|0)==0)break;if((e|0)==(a|0)){return c[b+((d<<2)+4)>>2]|0}d=d+2|0}return 0}function Xn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return Ta(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function Yn(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{Xn(b,c,d)|0}return b|0}function Zn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function _n(b,c){b=b|0;c=c|0;var d=0,e=0;d=b+(Un(b)|0)|0;do{a[d+e|0]=a[c+e|0];e=e+1|0}while(a[c+(e-1)|0]|0);return b|0}function $n(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){J=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}J=a<<c-32;return 0}function ao(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function bo(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0);return b|0}function co(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){J=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}J=0;return b>>>c-32|0}function eo(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){J=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}J=(b|0)<0?-1:0;return b>>c-32|0}function fo(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function go(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=fa(d,c)|0;f=a>>>16;a=(e>>>16)+(fa(d,f)|0)|0;d=b>>>16;b=fa(d,c)|0;return(J=(a>>>16)+(fa(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function ho(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=Sn(e^a,f^b,e,f)|0;b=J;a=g^e;e=h^f;f=Sn((mo(i,b,Sn(g^c,h^d,g,h)|0,J,0)|0)^a,J^e,a,e)|0;return f|0}function io(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=Sn(h^a,j^b,h,j)|0;b=J;mo(m,b,Sn(k^d,l^e,k,l)|0,J,g)|0;l=Sn(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=J;i=f;return(J=j,l)|0}function jo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=go(e,a)|0;f=J;return(J=(fa(b,a)|0)+(fa(d,e)|0)+f|f&0,c|0|0)|0}function ko(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=mo(a,b,c,d,0)|0;return e|0}function lo(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;mo(a,b,d,e,g)|0;i=f;return(J=c[g+4>>2]|0,c[g>>2]|0)|0}function mo(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(J=n,o)|0}else{if(!m){n=0;o=0;return(J=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(J=n,o)|0}}m=(l|0)==0;do{if((j|0)!=0){if(!m){p=(ao(l|0)|0)-(ao(i|0)|0)|0;if(p>>>0<=31){q=p+1|0;r=31-p|0;s=p-31>>31;t=q;u=g>>>(q>>>0)&s|i<<r;v=i>>>(q>>>0)&s;w=0;x=g<<r;break}if((f|0)==0){n=0;o=0;return(J=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(J=n,o)|0}r=j-1|0;if((r&j|0)!=0){s=(ao(j|0)|0)+33-(ao(i|0)|0)|0;q=64-s|0;p=32-s|0;y=p>>31;z=s-32|0;A=z>>31;t=s;u=p-1>>31&i>>>(z>>>0)|(i<<p|g>>>(s>>>0))&A;v=A&i>>>(s>>>0);w=g<<q&y;x=(i<<q|g>>>(z>>>0))&y|g<<p&s-33>>31;break}if((f|0)!=0){c[f>>2]=r&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(J=n,o)|0}else{r=fo(j|0)|0;n=i>>>(r>>>0)|0;o=i<<32-r|g>>>(r>>>0)|0;return(J=n,o)|0}}else{if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(J=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(J=n,o)|0}r=l-1|0;if((r&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=r&i|b&0}n=0;o=i>>>((fo(l|0)|0)>>>0);return(J=n,o)|0}r=(ao(l|0)|0)-(ao(i|0)|0)|0;if(r>>>0<=30){s=r+1|0;p=31-r|0;t=s;u=i<<p|g>>>(s>>>0);v=i>>>(s>>>0);w=0;x=g<<p;break}if((f|0)==0){n=0;o=0;return(J=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(J=n,o)|0}}while(0);if((t|0)==0){B=x;C=w;D=v;E=u;F=0;G=0}else{b=d|0|0;d=k|e&0;e=Tn(b,d,-1,-1)|0;k=J;h=x;x=w;w=v;v=u;u=t;t=0;while(1){H=x>>>31|h<<1;I=t|x<<1;a=v<<1|h>>>31|0;g=v>>>31|w<<1|0;Sn(e,k,a,g)|0;i=J;l=i>>31|((i|0)<0?-1:0)<<1;K=l&1;L=Sn(a,g,l&b,(((i|0)<0?-1:0)>>31|((i|0)<0?-1:0)<<1)&d)|0;M=J;i=u-1|0;if((i|0)==0){break}else{h=H;x=I;w=M;v=L;u=i;t=K}}B=H;C=I;D=M;E=L;F=0;G=K}K=C;C=0;if((f|0)!=0){c[f>>2]=E;c[f+4>>2]=D}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|F;o=(K<<1|0>>>31)&-2|G;return(J=n,o)|0}function no(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;xc[a&3](b|0,c|0,d|0,e|0,f|0)}function oo(a,b){a=a|0;b=b|0;yc[a&127](b|0)}function po(a,b,c){a=a|0;b=b|0;c=c|0;zc[a&63](b|0,c|0)}function qo(a,b){a=a|0;b=b|0;return Ac[a&127](b|0)|0}function ro(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=+e;f=+f;g=+g;return+Bc[a&1](b|0,c|0,d|0,+e,+f,+g)}function so(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Cc[a&7](b|0,c|0,d|0,e|0)|0}function to(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Dc[a&31](b|0,c|0,d|0)|0}function uo(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;Ec[a&7](b|0,c|0,d|0,e|0,f|0,+g)}function vo(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;Fc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function wo(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;Gc[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function xo(a,b){a=a|0;b=+b;return+Hc[a&1](+b)}function yo(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;Ic[a&63](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function zo(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;Jc[a&3](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function Ao(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;Kc[a&3](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function Bo(a,b,c){a=a|0;b=b|0;c=c|0;return Lc[a&31](b|0,c|0)|0}function Co(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return Mc[a&15](b|0,c|0,d|0,e|0,f|0)|0}function Do(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return+Nc[a&3](b|0,c|0,d|0)}function Eo(a){a=a|0;return Oc[a&1]()|0}function Fo(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;return Pc[a&3](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)|0}function Go(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Qc[a&3](b|0,c|0,d|0)}function Ho(a){a=a|0;Rc[a&1]()}function Io(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return Sc[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function Jo(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;Tc[a&15](b|0,c|0,d|0,e|0)}function Ko(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ga(0)}function Lo(a){a=a|0;ga(1)}function Mo(a,b){a=a|0;b=b|0;ga(2)}function No(a,b){a=a|0;b=b|0;sc(a|0,b|0)}function Oo(a){a=a|0;ga(3);return 0}function Po(a){a=a|0;return Ya(a|0)|0}function Qo(a){a=a|0;return Un(a|0)|0}function Ro(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=+d;e=+e;f=+f;ga(4);return 0.0}function So(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=+d;e=+e;f=+f;return+vc(a|0,b|0,c|0,+d,+e,+f)}function To(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ga(5);return 0}function Uo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return yb(a|0,b|0,c|0,d|0)|0}function Vo(a,b,c){a=a|0;b=b|0;c=c|0;ga(6);return 0}function Wo(a,b,c){a=a|0;b=b|0;c=c|0;return Ab(a|0,b|0,c|0)|0}function Xo(a,b,c){a=a|0;b=b|0;c=c|0;return tb(a|0,b|0,c|0)|0}function Yo(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ga(7)}function Zo(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ga(8)}function _o(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ga(9)}function $o(a){a=+a;ga(10);return 0.0}function ap(a){a=+a;return+Ia(+a)}function bp(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ga(11)}function cp(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ga(12)}function dp(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ga(13)}function ep(a,b){a=a|0;b=b|0;ga(14);return 0}function fp(a,b){a=a|0;b=b|0;return _n(a|0,b|0)|0}function gp(a,b){a=a|0;b=b|0;return bo(a|0,b|0)|0}function hp(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ga(15);return 0}function ip(a,b,c){a=a|0;b=b|0;c=c|0;ga(16);return 0.0}function jp(){ga(17);return 0}function kp(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ga(18);return 0}function lp(a,b,c){a=a|0;b=b|0;c=c|0;ga(19)}function mp(){ga(20)}function np(){Wb()}function op(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ga(21);return 0}function pp(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ga(22)}



function Uc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Vc(){return i|0}function Wc(a){a=a|0;i=a}function Xc(a,b){a=a|0;b=b|0;if((u|0)==0){u=a;v=b}}function Yc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Zc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function _c(a){a=a|0;J=a}function $c(a){a=a|0;K=a}function ad(a){a=a|0;L=a}function bd(a){a=a|0;M=a}function cd(a){a=a|0;N=a}function dd(a){a=a|0;O=a}function ed(a){a=a|0;P=a}function fd(a){a=a|0;Q=a}function gd(a){a=a|0;R=a}function hd(a){a=a|0;S=a}function id(){var a=0,b=0,d=0;a=i;b=un(2664)|0;if((b|0)==0){d=0;i=a;return d|0}jd(b);c[b+752>>2]=1;c[b+756>>2]=1;c[b+2504>>2]=1;c[b+2508>>2]=0;h[b+272>>3]=1.5;h[b+280>>3]=.6;c[b+36>>2]=0;d=b;i=a;return d|0}function jd(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0;b=i;Zn(a|0,0,2664)|0;c[a+300>>2]=20;c[a+304>>2]=18;c[a+308>>2]=27;h[a+216>>3]=60.0;h[a+224>>3]=57.0;h[a+232>>3]=63.0;h[a+256>>3]=20.0;h[a+240>>3]=-2147483648.0;h[a+248>>3]=80.0;h[a+264>>3]=50.0;d=a+272|0;e=a+288|0;c[d+0>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;h[e>>3]=50.0;c[a+296>>2]=0;h[a+328>>3]=8.0;h[a+336>>3]=3.0;h[a+344>>3]=47.0;h[a+352>>3]=47.0;h[a+360>>3]=47.0;c[a+312>>2]=5;h[a+368>>3]=12.0;c[a+320>>2]=0;c[a+316>>2]=0;h[a+376>>3]=-100.0;h[a+384>>3]=-100.0;c[a+772>>2]=0;c[a+768>>2]=5;e=a+128|0;d=a+56|0;f=d+72|0;do{c[d>>2]=0;d=d+4|0}while((d|0)<(f|0));h[e>>3]=1.0;h[a+136>>3]=1.0;h[a+144>>3]=0.0;h[a+152>>3]=1.0;e=a+160|0;g=a+176|0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;h[g>>3]=5.0;h[a+184>>3]=1.0;h[a+192>>3]=1.0;g=a+200|0;c[a+392>>2]=0;c[a+396>>2]=0;e=a+2512|0;c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;h[e>>3]=100.0;c[a+752>>2]=0;c[a+756>>2]=0;h[a+2472>>3]=8.0;h[a+2488>>3]=3.0;h[a+2480>>3]=47.0;h[a+2496>>3]=47.0;c[a+2504>>2]=0;c[a+2508>>2]=0;c[a+24>>2]=0;c[a>>2]=5;c[a+4>>2]=1;c[a+8>>2]=1;c[a+12>>2]=0;c[a+20>>2]=0;c[a+28>>2]=5;c[a+816>>2]=100;c[a+1616>>2]=300;c[a+2416>>2]=1;h[a+2464>>3]=24.0;c[a+40>>2]=0;c[a+44>>2]=100;h[a+800>>3]=0.0;h[a+808>>3]=-1.0;h[a+760>>3]=100.0;c[a+776>>2]=0;h[a+2424>>3]=1.0e6;h[a+2432>>3]=-1.0e6;h[a+2440>>3]=2.2250738585072014e-308;c[a+2420>>2]=-2147483648;h[a+2448>>3]=-100.0;h[a+2456>>3]=-100.0;c[a+652>>2]=20;c[a+656>>2]=18;c[a+660>>2]=27;h[a+568>>3]=60.0;h[a+576>>3]=57.0;h[a+584>>3]=63.0;h[a+608>>3]=20.0;h[a+600>>3]=80.0;h[a+592>>3]=-2147483648.0;c[a+664>>2]=5;h[a+616>>3]=50.0;e=a+624|0;g=a+640|0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;h[g>>3]=50.0;c[a+648>>2]=0;h[a+680>>3]=12.0;h[a+688>>3]=12.0;h[a+696>>3]=47.0;h[a+704>>3]=47.0;h[a+712>>3]=47.0;h[a+720>>3]=12.0;c[a+672>>2]=0;c[a+668>>2]=0;h[a+728>>3]=-100.0;h[a+736>>3]=-100.0;h[a+536>>3]=1.0;h[a+544>>3]=1.0;h[a+480>>3]=1.0;h[a+488>>3]=1.0;g=a+456|0;h[a+496>>3]=0.0;e=a+512|0;c[a+744>>2]=0;c[a+748>>2]=0;j=a+2520|0;d=a+408|0;f=d+40|0;do{c[d>>2]=0;d=d+4|0}while((d|0)<(f|0));c[g+0>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[g+16>>2]=0;c[g+20>>2]=0;c[e+0>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;h[j>>3]=1.0;j=a+2576|0;d=a+2528|0;f=d+48|0;do{c[d>>2]=0;d=d+4|0}while((d|0)<(f|0));h[j>>3]=5.0;j=a+36|0;d=a+2584|0;f=d+40|0;do{c[d>>2]=0;d=d+4|0}while((d|0)<(f|0));c[j>>2]=1;c[a+2640>>2]=-1;c[a+2644>>2]=-1;c[a+780>>2]=50;c[a+784>>2]=500;c[a+788>>2]=250;c[a+792>>2]=20;c[a+2648>>2]=7;c[a+2652>>2]=4;i=b;return}function kd(){var a=0,b=0,d=0,e=0,f=0,g=0;a=i;i=i+16|0;b=a;d=un(20)|0;if((d|0)==0){Oa(232,1)}e=un(262192)|0;if((e|0)==0){Oa(232,1)}c[d>>2]=e;Xb(e|0);c[e+12>>2]=0;f=un(262192)|0;if((f|0)==0){Oa(232,1)}c[d+4>>2]=f;Xb(f|0);c[f+12>>2]=1;f=un(262192)|0;if((f|0)==0){Oa(232,1)}c[d+8>>2]=f;Xb(f|0);c[f+12>>2]=3;g=un(262192)|0;if((g|0)==0){Oa(232,1)}c[d+12>>2]=g;Xn(g|0,e|0,262192)|0;if((qb(g|0)|0)==0){g=c[r>>2]|0;c[b>>2]=c[2];c[b+4>>2]=56;c[b+8>>2]=905;c[b+12>>2]=72;Ab(g|0,16,b|0)|0;Wb()}g=un(262192)|0;if((g|0)==0){Oa(232,1)}c[d+16>>2]=g;Xn(g|0,f|0,262192)|0;if((qb(g|0)|0)==0){g=c[r>>2]|0;c[b>>2]=c[2];c[b+4>>2]=56;c[b+8>>2]=909;c[b+12>>2]=120;Ab(g|0,16,b|0)|0;Wb()}else{i=a;return d|0}return 0}function ld(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0;b=i;d=un(16)|0;if((d|0)==0){Oa(232,1)}e=un(64)|0;if((e|0)==0){Oa(232,1)}c[d>>2]=e;eb(e|0);c[e+4>>2]=1;f=a+216|0;h[e+16>>3]=+h[f>>3];g=a+224|0;h[e+24>>3]=+h[g>>3];j=a+232|0;h[e+32>>3]=+h[j>>3];k=a+240|0;h[e+40>>3]=+h[k>>3];e=un(64)|0;if((e|0)==0){Oa(232,1)}c[d+4>>2]=e;eb(e|0);c[e+4>>2]=2;h[e+16>>3]=+h[f>>3];h[e+24>>3]=+h[g>>3];h[e+32>>3]=+h[j>>3];h[e+40>>3]=+h[k>>3];e=un(64)|0;if((e|0)==0){Oa(232,1)}c[d+8>>2]=e;eb(e|0);c[e+4>>2]=3;h[e+16>>3]=+h[f>>3];h[e+24>>3]=+h[g>>3];h[e+32>>3]=+h[j>>3];h[e+40>>3]=+h[k>>3];e=un(64)|0;if((e|0)==0){Oa(232,1)}else{c[d+12>>2]=e;eb(e|0);c[e+4>>2]=4;h[e+16>>3]=+h[f>>3];h[e+24>>3]=+h[g>>3];h[e+32>>3]=+h[j>>3];h[e+40>>3]=+h[k>>3];c[e+60>>2]=0;i=b;return d|0}return 0}function md(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;if((a|0)==0){i=b;return}d=a+4|0;e=c[d>>2]|0;if((e|0)>0){f=e;e=0;while(1){g=c[(c[a>>2]|0)+(e<<7)+8>>2]|0;if((g|0)==0){h=f}else{vn(g);c[(c[a>>2]|0)+(e<<7)+8>>2]=0;h=c[d>>2]|0}e=e+1|0;if((e|0)>=(h|0)){break}else{f=h}}}h=a+236|0;f=c[h>>2]|0;if((f|0)>0){e=a+232|0;d=f;f=0;while(1){g=c[(c[e>>2]|0)+(f<<7)+8>>2]|0;if((g|0)==0){j=d}else{vn(g);c[(c[e>>2]|0)+(f<<7)+8>>2]=0;j=c[h>>2]|0}f=f+1|0;if((f|0)>=(j|0)){break}else{d=j}}}j=a+120|0;d=c[j>>2]|0;f=a+116|0;if((d|0)>0){h=d;d=0;while(1){e=c[(c[f>>2]|0)+(d<<7)+8>>2]|0;if((e|0)==0){k=h}else{vn(e);c[(c[f>>2]|0)+(d<<7)+8>>2]=0;k=c[j>>2]|0}d=d+1|0;if((d|0)>=(k|0)){break}else{h=k}}}vn(c[a>>2]|0);vn(c[a+232>>2]|0);vn(c[f>>2]|0);if((c[a+348>>2]|0)!=0?(f=c[a+356>>2]|0,(f|0)!=0):0){vn(f)}f=a+432|0;vn(c[f>>2]|0);c[f>>2]=0;f=a+440|0;vn(c[f>>2]|0);c[f>>2]=0;vn(c[a+448>>2]|0);vn(a);i=b;return}function nd(a){a=a|0;return a|0}function od(a){a=a|0;return a+348|0}function pd(){var a=0,b=0,d=0;a=i;b=un(8912)|0;if((b|0)==0){d=0;i=a;return d|0}Zn(b|0,0,8908)|0;c[b+8840>>2]=-2e6;c[b+8836>>2]=-1;c[b+8896>>2]=-1e6;c[b+8900>>2]=-1e6;c[b+8904>>2]=-1e6;c[b+8908>>2]=-1e6;c[b+8828>>2]=0;c[b+8848>>2]=0;c[b+8844>>2]=0;d=b;i=a;return d|0}




// EMSCRIPTEN_END_FUNCS
var xc=[Ko,qn,pn,on];var yc=[Lo,ae,be,he,ie,oe,pe,ve,we,Ie,He,Ne,Me,Pe,Qe,Ze,Ye,Cf,Bf,Qf,Pf,cg,bg,eg,dg,hg,gg,jg,ig,mg,lg,og,ng,rg,qg,tg,sg,zg,yg,yf,Ag,xg,Bg,Dg,Cg,Ik,Jg,Ig,Og,Ng,lh,kh,Ph,Oh,ci,bi,qi,pi,Di,Ci,Pi,Oi,Si,Ri,Wi,Vi,fj,ej,qj,pj,Bj,Aj,Mj,Lj,Wj,Vj,bk,ak,hk,gk,nk,mk,sk,rk,Bk,Ak,Yk,Xk,wk,nl,Ul,Tl,Wl,Vl,Eg,Hk,Kk,fl,vl,Gl,Rl,Sl,an,$m,cn,fn,dn,en,gn,hn,Fn,En,vn,sd,md,Cn,$d,Jk,Cm,Oj,Jm,Im,Hm,Gm,Fm,Em,ef,qf];var zc=[Mo,ce,je,qe,xe,Df,Rf,Zi,_i,$i,aj,cj,dj,ij,jj,kj,lj,nj,oj,tj,uj,vj,wj,yj,zj,Ej,Fj,Gj,Hj,Jj,Kj,qk,vk,$l,bm,dm,am,cm,em,rd,No,vd,Wd,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo,Mo];var Ac=[Oo,de,Wf,Yf,Zf,Vf,ke,le,re,If,Kf,Lf,Hf,ye,ze,Je,Oe,vg,ri,fm,hm,jm,pm,rm,lm,nm,Ei,gm,im,km,qm,sm,mm,om,Xi,Yi,bj,gj,hj,mj,rj,sj,xj,Cj,Dj,Ij,rl,sl,ul,Xl,Zl,Yl,_l,jl,kl,ml,Bl,Cl,Fl,Ml,Nl,Ql,bn,Gn,un,Po,Qo,ld,An,Yd,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo,Oo];var Bc=[Ro,So];var Cc=[To,cl,Mk,Nk,Ok,Uk,Uo,To];var Dc=[Vo,Sf,Xf,ee,$f,Ef,Jf,se,Nf,Te,Ue,Hg,Mg,ok,tk,_k,al,dl,Lk,Qk,Sk,Vk,jn,Wo,zd,Xo,Gd,Vo,Vo,Vo,Vo,Vo];var Ec=[Yo,Yh,$h,ki,mi,Yo,Yo,Yo];var Fc=[Zo,Qi,Ti,Nj,Rj,Xj,Zj,Id];var Gc=[_o,Tf,Ff,Qh,Rh,Wh,ai,di,ei,ii,ni,pk,uk,tn,sn,rn,Ld,Md,Nd,_o,_o,_o,_o,_o,_o,_o,_o,_o,_o,_o,_o,_o];var Hc=[$o,ap];var Ic=[bp,Pg,Rg,Tg,Vg,Xg,Zg,$g,bh,dh,fh,hh,mh,oh,qh,sh,uh,wh,yh,Ah,Ch,Eh,Gh,Vh,Xh,hi,ji,si,ti,ui,vi,wi,Fi,Gi,Hi,Ii,Ji,fk,lk,Od,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp,bp];var Jc=[cp,ck,ik,cp];var Kc=[dp,xi,Ki,Td];var Lc=[ep,_f,fe,me,ag,Mf,te,Ae,Of,Zk,$k,bl,Pk,Rk,Tk,fp,gp,Hd,wn,xn,ep,ep,ep,ep,ep,ep,ep,ep,ep,ep,ep,ep];var Mc=[hp,Fg,Kg,el,ql,tl,Wk,il,ll,Al,Dl,Ll,Ol,td,hp,hp];var Nc=[ip,Pd,Qd,ip];var Oc=[jp,kd];var Pc=[kp,Fd,Sd,kp];var Qc=[lp,Se,wg,Vd];var Rc=[mp,np];var Sc=[op,ol,pl,gl,hl,wl,yl,Hl,Jl,Rd,op,op,op,op,op,op];var Tc=[pp,Uf,Gf,Gg,Lg,kn,ln,mn,Sm,pp,pp,pp,pp,pp,pp,pp];return{_strlen:Un,_strcat:_n,_p3_get_rv_per_sequence_errors:Dd,_calloc:wn,_bitshift64Shl:$n,_p3_set_sa_right_input:Cd,_p3_create_global_settings:id,_p3_get_rv_fwd:nd,_memset:Zn,_memcpy:Xn,_p3_set_sa_left_input:Bd,_p3_get_rv_best_pairs:od,_i64Subtract:Sn,_realloc:xn,_i64Add:Tn,_create_seq_arg:pd,_libprimer3_release:xd,_choose_primers:qd,_p3_set_sa_sequence:Ad,_testSetjmp:Wn,_saveSetjmp:Vn,_free:vn,_memmove:Yn,_malloc:un,_llvm_ctlz_i32:ao,_strcpy:bo,__GLOBAL__I_a:Ce,runPostSets:Rn,stackAlloc:Uc,stackSave:Vc,stackRestore:Wc,setThrew:Xc,setTempRet0:_c,setTempRet1:$c,setTempRet2:ad,setTempRet3:bd,setTempRet4:cd,setTempRet5:dd,setTempRet6:ed,setTempRet7:fd,setTempRet8:gd,setTempRet9:hd,dynCall_viiiii:no,dynCall_vi:oo,dynCall_vii:po,dynCall_ii:qo,dynCall_diiiddd:ro,dynCall_iiiii:so,dynCall_iiii:to,dynCall_viiiiid:uo,dynCall_viiiiiiii:vo,dynCall_viiiiii:wo,dynCall_dd:xo,dynCall_viiiiiii:yo,dynCall_viiiiiid:zo,dynCall_viiiiiiiii:Ao,dynCall_iii:Bo,dynCall_iiiiii:Co,dynCall_diii:Do,dynCall_i:Eo,dynCall_iiiiiiiiii:Fo,dynCall_viii:Go,dynCall_v:Ho,dynCall_iiiiiiiii:Io,dynCall_viiii:Jo}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_ii": invoke_ii, "invoke_diiiddd": invoke_diiiddd, "invoke_iiiii": invoke_iiiii, "invoke_iiii": invoke_iiii, "invoke_viiiiid": invoke_viiiiid, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_dd": invoke_dd, "invoke_viiiiiii": invoke_viiiiiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_diii": invoke_diii, "invoke_i": invoke_i, "invoke_iiiiiiiiii": invoke_iiiiiiiiii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiii": invoke_viiii, "_fabs": _fabs, "_vsscanf": _vsscanf, "__ZSt9terminatev": __ZSt9terminatev, "___cxa_guard_acquire": ___cxa_guard_acquire, "__reallyNegative": __reallyNegative, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_longjmp": _longjmp, "___ctype_toupper_loc": ___ctype_toupper_loc, "__addDays": __addDays, "_sbrk": _sbrk, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sysconf": _sysconf, "_end_oligodg": _end_oligodg, "_fileno": _fileno, "_fread": _fread, "_puts": _puts, "_dpal": _dpal, "_write": _write, "__isLeapYear": __isLeapYear, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "___cxa_does_inherit": ___cxa_does_inherit, "__exit": __exit, "_catclose": _catclose, "__Z21set_thal_default_argsP9thal_args": __Z21set_thal_default_argsP9thal_args, "_send": _send, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_isxdigit_l": _isxdigit_l, "___cxa_guard_release": ___cxa_guard_release, "_strerror_r": _strerror_r, "___setErrNo": ___setErrNo, "_newlocale": _newlocale, "_isdigit_l": _isdigit_l, "___resumeException": ___resumeException, "_freelocale": _freelocale, "_dpal_set_ambiguity_code_matrix": _dpal_set_ambiguity_code_matrix, "_putchar": _putchar, "_printf": _printf, "_sprintf": _sprintf, "_vasprintf": _vasprintf, "_vsnprintf": _vsnprintf, "_strtoull_l": _strtoull_l, "_read": _read, "_fwrite": _fwrite, "_time": _time, "_fprintf": _fprintf, "_catopen": _catopen, "_exit": _exit, "___ctype_b_loc": ___ctype_b_loc, "_fmod": _fmod, "__Z4thalPKhS0_PK9thal_argsP12thal_results": __Z4thalPKhS0_PK9thal_argsP12thal_results, "___cxa_allocate_exception": ___cxa_allocate_exception, "_ceilf": _ceilf, "_strtoll": _strtoll, "_pwrite": _pwrite, "_uselocale": _uselocale, "_snprintf": _snprintf, "__scanString": __scanString, "_strtoull": _strtoull, "_strftime": _strftime, "_isxdigit": _isxdigit, "_pthread_cond_broadcast": _pthread_cond_broadcast, "_recv": _recv, "_fgetc": _fgetc, "__parseInt64": __parseInt64, "__getFloat": __getFloat, "_seqtm": _seqtm, "_abort": _abort, "_set_dpal_args": _set_dpal_args, "_isspace": _isspace, "_pthread_cond_wait": _pthread_cond_wait, "_ungetc": _ungetc, "_fflush": _fflush, "_strftime_l": _strftime_l, "_pthread_mutex_lock": _pthread_mutex_lock, "_sscanf": _sscanf, "_catgets": _catgets, "_asprintf": _asprintf, "_strtoll_l": _strtoll_l, "__arraySum": __arraySum, "___ctype_tolower_loc": ___ctype_tolower_loc, "_fputs": _fputs, "_pthread_mutex_unlock": _pthread_mutex_unlock, "_pread": _pread, "_mkport": _mkport, "___errno_location": ___errno_location, "_copysign": _copysign, "_fputc": _fputc, "___cxa_throw": ___cxa_throw, "_isdigit": _isdigit, "_strerror": _strerror, "_emscripten_longjmp": _emscripten_longjmp, "__formatString": __formatString, "_atexit": _atexit, "_long_seq_tm": _long_seq_tm, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity, "__INFINITY": __INFINITY, "__ZTISt9exception": __ZTISt9exception, "___dso_handle": ___dso_handle, "_stderr": _stderr, "_stdin": _stdin, "_stdout": _stdout }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _strcat = Module["_strcat"] = asm["_strcat"];
var _p3_get_rv_per_sequence_errors = Module["_p3_get_rv_per_sequence_errors"] = asm["_p3_get_rv_per_sequence_errors"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _p3_set_sa_right_input = Module["_p3_set_sa_right_input"] = asm["_p3_set_sa_right_input"];
var _p3_create_global_settings = Module["_p3_create_global_settings"] = asm["_p3_create_global_settings"];
var _p3_get_rv_fwd = Module["_p3_get_rv_fwd"] = asm["_p3_get_rv_fwd"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _p3_set_sa_left_input = Module["_p3_set_sa_left_input"] = asm["_p3_set_sa_left_input"];
var _p3_get_rv_best_pairs = Module["_p3_get_rv_best_pairs"] = asm["_p3_get_rv_best_pairs"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _create_seq_arg = Module["_create_seq_arg"] = asm["_create_seq_arg"];
var _libprimer3_release = Module["_libprimer3_release"] = asm["_libprimer3_release"];
var _choose_primers = Module["_choose_primers"] = asm["_choose_primers"];
var _p3_set_sa_sequence = Module["_p3_set_sa_sequence"] = asm["_p3_set_sa_sequence"];
var _testSetjmp = Module["_testSetjmp"] = asm["_testSetjmp"];
var _saveSetjmp = Module["_saveSetjmp"] = asm["_saveSetjmp"];
var _free = Module["_free"] = asm["_free"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _llvm_ctlz_i32 = Module["_llvm_ctlz_i32"] = asm["_llvm_ctlz_i32"];
var _strcpy = Module["_strcpy"] = asm["_strcpy"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_diiiddd = Module["dynCall_diiiddd"] = asm["dynCall_diiiddd"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_dd = Module["dynCall_dd"] = asm["dynCall_dd"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_diii = Module["dynCall_diii"] = asm["dynCall_diii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = asm["dynCall_iiiiiiiiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };


// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

  throw 'abort() at ' + stackTrace() + extra;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






