'use strict';

var Module = require('module');
var path = require('path');

var originalLoad = Module._load;
var esAbstractRoot = path.sep + 'node_modules' + path.sep + 'es-abstract' + path.sep;
var stringMatchAllRoot = path.sep + 'node_modules' + path.sep + 'string.prototype.matchall' + path.sep;

function isObject(value) {
	return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function toBoolean(value) {
	return !!value;
}

function toStringValue(value) {
	return String(value);
}

function toIntegerOrInfinity(value) {
	var number = Number(value);
	if (!number) {
		return number;
	}
	if (!Number.isFinite(number)) {
		return number;
	}
	return number < 0 ? Math.ceil(number) : Math.floor(number);
}

function toLength(value) {
	var integer = toIntegerOrInfinity(value);
	if (integer <= 0) {
		return 0;
	}
	return Math.min(integer, Number.MAX_SAFE_INTEGER);
}

function toPropertyDescriptor(obj) {
	if (!isObject(obj)) {
		throw new TypeError('ToPropertyDescriptor requires an object');
	}

	var desc = {};
	if ('enumerable' in obj) {
		desc['[[Enumerable]]'] = toBoolean(obj.enumerable);
	}
	if ('configurable' in obj) {
		desc['[[Configurable]]'] = toBoolean(obj.configurable);
	}
	if ('value' in obj) {
		desc['[[Value]]'] = obj.value;
	}
	if ('writable' in obj) {
		desc['[[Writable]]'] = toBoolean(obj.writable);
	}
	if ('get' in obj) {
		if (typeof obj.get !== 'undefined' && typeof obj.get !== 'function') {
			throw new TypeError('getter must be a function');
		}
		desc['[[Get]]'] = obj.get;
	}
	if ('set' in obj) {
		if (typeof obj.set !== 'undefined' && typeof obj.set !== 'function') {
			throw new TypeError('setter must be a function');
		}
		desc['[[Set]]'] = obj.set;
	}
	return desc;
}

function fromPropertyDescriptor(desc) {
	if (typeof desc === 'undefined') {
		return undefined;
	}
	var obj = {};
	if ('[[Value]]' in desc) {
		obj.value = desc['[[Value]]'];
	}
	if ('[[Writable]]' in desc) {
		obj.writable = !!desc['[[Writable]]'];
	}
	if ('[[Get]]' in desc) {
		obj.get = desc['[[Get]]'];
	}
	if ('[[Set]]' in desc) {
		obj.set = desc['[[Set]]'];
	}
	if ('[[Enumerable]]' in desc) {
		obj.enumerable = !!desc['[[Enumerable]]'];
	}
	if ('[[Configurable]]' in desc) {
		obj.configurable = !!desc['[[Configurable]]'];
	}
	return obj;
}

function defineOwnProperty(_IsDataDescriptor, _SameValue, _FromPropertyDescriptor, O, P, Desc) {
	var descriptor = fromPropertyDescriptor(Desc);
	Object.defineProperty(O, P, descriptor);
	return true;
}

function isPropertyKey(value) {
	return typeof value === 'string' || typeof value === 'symbol';
}

function isDataDescriptor(desc) {
	return !!desc && ('[[Value]]' in desc || '[[Writable]]' in desc);
}

function isAccessorDescriptor(desc) {
	return !!desc && ('[[Get]]' in desc || '[[Set]]' in desc);
}

function isGenericDescriptor(desc) {
	return !!desc && !isDataDescriptor(desc) && !isAccessorDescriptor(desc);
}

function isFullyPopulatedPropertyDescriptor(_deps, desc) {
	return !!desc;
}

function sameValue(x, y) {
	return Object.is(x, y);
}

function isLeadingSurrogate(charCode) {
	return charCode >= 0xD800 && charCode <= 0xDBFF;
}

function isTrailingSurrogate(charCode) {
	return charCode >= 0xDC00 && charCode <= 0xDFFF;
}

function utf16SurrogatePairToCodePoint(lead, trail) {
	return ((lead - 0xD800) * 0x400) + (trail - 0xDC00) + 0x10000;
}

function codePointAt(string, position) {
	if (typeof string !== 'string') {
		throw new TypeError('Assertion failed: `string` must be a String');
	}
	var size = string.length;
	if (position < 0 || position >= size) {
		throw new TypeError('Assertion failed: `position` must be >= 0, and < the length of `string`');
	}
	var first = string.charCodeAt(position);
	var cp = string.charAt(position);
	var firstIsLeading = isLeadingSurrogate(first);
	var firstIsTrailing = isTrailingSurrogate(first);
	if (!firstIsLeading && !firstIsTrailing) {
		return { '[[CodePoint]]': cp, '[[CodeUnitCount]]': 1, '[[IsUnpairedSurrogate]]': false };
	}
	if (firstIsTrailing || position + 1 === size) {
		return { '[[CodePoint]]': cp, '[[CodeUnitCount]]': 1, '[[IsUnpairedSurrogate]]': true };
	}
	var second = string.charCodeAt(position + 1);
	if (!isTrailingSurrogate(second)) {
		return { '[[CodePoint]]': cp, '[[CodeUnitCount]]': 1, '[[IsUnpairedSurrogate]]': true };
	}
	return { '[[CodePoint]]': utf16SurrogatePairToCodePoint(first, second), '[[CodeUnitCount]]': 2, '[[IsUnpairedSurrogate]]': false };
}

function toObject(value) {
	if (value === null || typeof value === 'undefined') {
		throw new TypeError('Cannot convert undefined or null to object');
	}
	return Object(value);
}

function toPrimitive(value) {
	if (!isObject(value)) {
		return value;
	}
	if (typeof value.valueOf === 'function') {
		var valueOf = value.valueOf();
		if (!isObject(valueOf)) {
			return valueOf;
		}
	}
	if (typeof value.toString === 'function') {
		var stringValue = value.toString();
		if (!isObject(stringValue)) {
			return stringValue;
		}
	}
	throw new TypeError('Cannot convert object to primitive value');
}

function toPropertyKey(value) {
	var primitive = toPrimitive(value);
	return typeof primitive === 'symbol' ? primitive : String(primitive);
}

function toNumber(value) {
	return Number(value);
}

function toNumeric(value) {
	return typeof value === 'bigint' ? value : Number(value);
}

function toUint8Clamp(value) {
	var number = Number(value);
	if (!number || number <= 0) {
		return 0;
	}
	if (number >= 255) {
		return 255;
	}
	var f = Math.floor(number);
	var fraction = number - f;
	if (fraction > 0.5 || (fraction === 0.5 && f % 2 === 1)) {
		return f + 1;
	}
	return f;
}

function typeOf(value) {
	if (value === null) {
		return 'Null';
	}
	if (typeof value === 'undefined') {
		return 'Undefined';
	}
	if (typeof value === 'boolean') {
		return 'Boolean';
	}
	if (typeof value === 'string') {
		return 'String';
	}
	if (typeof value === 'symbol') {
		return 'Symbol';
	}
	if (typeof value === 'number') {
		return 'Number';
	}
	if (typeof value === 'bigint') {
		return 'BigInt';
	}
	return 'Object';
}

function numberOp(operation) {
	return function (a, b) {
		if (operation === 'add') { return Number(a) + Number(b); }
		if (operation === 'subtract') { return Number(a) - Number(b); }
		if (operation === 'multiply') { return Number(a) * Number(b); }
		if (operation === 'divide') { return Number(a) / Number(b); }
		if (operation === 'remainder') { return Number(a) % Number(b); }
		if (operation === 'exponentiate') { return Number(a) ** Number(b); }
		if (operation === 'leftShift') { return Number(a) << Number(b); }
		if (operation === 'signedRightShift') { return Number(a) >> Number(b); }
		if (operation === 'unsignedRightShift') { return Number(a) >>> Number(b); }
		if (operation === 'bitwiseAND') { return Number(a) & Number(b); }
		if (operation === 'bitwiseOR') { return Number(a) | Number(b); }
		if (operation === 'bitwiseXOR') { return Number(a) ^ Number(b); }
		if (operation === 'equal') { return Number(a) === Number(b); }
		if (operation === 'lessThan') { return Number(a) < Number(b); }
		return undefined;
	};
}

function bigIntOp(operation) {
	return function (a, b) {
		var left = BigInt(a);
		var right = BigInt(b);
		if (operation === 'add') { return left + right; }
		if (operation === 'subtract') { return left - right; }
		if (operation === 'multiply') { return left * right; }
		if (operation === 'divide') { return left / right; }
		if (operation === 'remainder') { return left % right; }
		if (operation === 'exponentiate') { return left ** right; }
		if (operation === 'leftShift') { return left << right; }
		if (operation === 'signedRightShift') { return left >> right; }
		if (operation === 'unsignedRightShift') { return left >> right; }
		if (operation === 'bitwiseAND') { return left & right; }
		if (operation === 'bitwiseOR') { return left | right; }
		if (operation === 'bitwiseXOR') { return left ^ right; }
		if (operation === 'equal') { return left === right; }
		if (operation === 'lessThan') { return left < right; }
		return undefined;
	};
}

function yearFromTime(time) {
	return new Date(time).getUTCFullYear();
}

function weekDay(time) {
	var day = new Date(time).getUTCDay();
	return day;
}

function unicodeEscape(codePoint) {
	return '\\u' + codePoint.toString(16).toUpperCase().padStart(4, '0');
}

function utf16EncodeCodePoint(codePoint) {
	if (codePoint <= 0xFFFF) {
		return String.fromCharCode(codePoint);
	}
	codePoint -= 0x10000;
	return String.fromCharCode(0xD800 + (codePoint >> 10), 0xDC00 + (codePoint & 0x3FF));
}

function stubFor(name) {
	switch (name) {
		case 'ToBoolean': return toBoolean;
		case 'ToString': return toStringValue;
		case 'UTF16SurrogatePairToCodePoint': return utf16SurrogatePairToCodePoint;
		case 'ToPropertyDescriptor': return toPropertyDescriptor;
		case 'FromPropertyDescriptor': return fromPropertyDescriptor;
		case 'ValidateAndApplyPropertyDescriptor': return function () { return true; };
		case 'ToObject': return toObject;
		case 'ToPrimitive': return toPrimitive;
		case 'ToPropertyKey': return toPropertyKey;
		case 'ToNumber': return toNumber;
		case 'ToNumeric': return toNumeric;
		case 'ToIntegerOrInfinity': return toIntegerOrInfinity;
		case 'ToLength': return toLength;
		case 'ToIndex': return function (value) { return toLength(value); };
		case 'ToInt8': return function (value) { return (Number(value) << 24) >> 24; };
		case 'ToInt16': return function (value) { return (Number(value) << 16) >> 16; };
		case 'ToInt32': return function (value) { return Number(value) | 0; };
		case 'ToUint16': return function (value) { return Number(value) & 0xFFFF; };
		case 'ToUint32': return function (value) { return Number(value) >>> 0; };
		case 'ToUint8': return function (value) { return Number(value) & 0xFF; };
		case 'ToUint8Clamp': return toUint8Clamp;
		case 'Type': return typeOf;
		case 'truncate': return function (value) { return toIntegerOrInfinity(value); };
		case 'YearFromTime': return yearFromTime;
		case 'WeekDay': return weekDay;
		case 'UnicodeEscape': return unicodeEscape;
		case 'UTF16EncodeCodePoint': return utf16EncodeCodePoint;
		case 'CodePointAt': return codePointAt;
		case 'IsRegExp': return function (argument) { return Object.prototype.toString.call(argument) === '[object RegExp]'; };
		case 'RegExpAlloc': return function (pattern, flags) { return new RegExp(pattern, flags); };
		case 'RegExpInitialize': return function (obj, pattern, flags) { return RegExp.call(obj, pattern, flags); };
		case 'WordCharacters': return function () { return /[A-Za-z0-9_]/; };
		case 'Number/add':
		case 'Number/bitwiseAND':
		case 'Number/bitwiseOR':
		case 'Number/bitwiseXOR':
		case 'Number/divide':
		case 'Number/equal':
		case 'Number/exponentiate':
		case 'Number/leftShift':
		case 'Number/lessThan':
		case 'Number/multiply':
		case 'Number/remainder':
		case 'Number/signedRightShift':
		case 'Number/subtract':
		case 'Number/unsignedRightShift':
			return numberOp(name.split('/')[1]);
		case 'BigInt/add':
		case 'BigInt/bitwiseAND':
		case 'BigInt/bitwiseOR':
		case 'BigInt/bitwiseXOR':
		case 'BigInt/divide':
		case 'BigInt/equal':
		case 'BigInt/exponentiate':
		case 'BigInt/leftShift':
		case 'BigInt/lessThan':
		case 'BigInt/multiply':
		case 'BigInt/remainder':
		case 'BigInt/signedRightShift':
		case 'BigInt/subtract':
		case 'BigInt/unsignedRightShift':
			return bigIntOp(name.split('/')[1]);
		case 'TypedArrayByteLength':
		case 'TypedArrayElementSize':
		case 'TypedArrayElementType':
		case 'TypedArrayLength':
		case 'TypedArraySetElement':
		case 'tables/typed-array-objects':
			return function () { return undefined; };
		default:
			return function () { return undefined; };
	}
}

function shouldStub(parentFile) {
	return parentFile && (parentFile.includes(esAbstractRoot) || parentFile.includes(stringMatchAllRoot));
}

Module._load = function (request, parent, isMain) {
	try {
		return originalLoad.apply(this, arguments);
	} catch (error) {
		if (error && error.code === 'MODULE_NOT_FOUND' && shouldStub(parent && parent.filename ? parent.filename : '')) {
			var basename = request.replace(/^\.\.\//, '').replace(/^\.\//, '');
			return stubFor(basename);
		}
		throw error;
	}
};
