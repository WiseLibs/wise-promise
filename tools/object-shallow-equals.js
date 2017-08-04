'use strict'
// This function factory produces functions that test whether their argument is
// an object which is shallowly equal to the object provided to the factory.
// However, it's not a "true" shallow-equality test. The algorithm is used to
// compare object before and after being processed by Promise.props(), and
// therefore it must abide by the querks that Promise.props() introduces. These
// querks are notated in comments below.

module.exports = function (a) {
	return function (b) {
		if (a === b || !isObject(a) || !isBaseObject(b)) {
			// Promise.props() never fulfills with the same object as the input.
			// Promise.props() always fulfills with base objects.
			return false
		}
		var keys = Object.keys(a)
		if (keys.length !== Object.keys(b).length) {
			return false
		}
		for (var i=0, len=keys.length; i<len; i++) {
			var key = keys[i]
			if (!(key in b)) {
				return false
			}
			if (a[key] !== b[key] && (a[key] === a[key] || b[key] === b[key])) {
				// NaN is considered equal to NaN in this case.
				return false
			}
		}
		return true
	}
}

function isObject(obj) {
	return obj !== null && (typeof obj === 'object' || typeof obj === 'function')
}

function isBaseObject(obj) {
	return isObject(obj) && obj.__proto__ === Object.prototype
}
