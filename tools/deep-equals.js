'use strict'
var deepEql = require('deep-eql')

// This function factory produces functions that test whether their argument is
// an array which is deeply equal to the array provided to the factory.
// However, it's not a "true" deep-equality test. The algorithm is used to
// compare arrays before and after being processed by Promise.settle(), and
// therefore it must abide by the querks that Promise.settle() introduces. These
// querks are notated in comments below. This equality test is considered LESS
// strict than the shallow-equals tool, as it does not test strict
// equality (===) when comparing objects in the arrays. As long as the objects
// look the same, they are considered equal.

module.exports = function (a) {
	return function (b) {
		if (a === b || !(a instanceof Array) || !isBaseArray(b) || b.length !== a.length) {
			// Promise.settle() never fulfills with the same array as the input.
			// Promise.settle() always fulfills with base arrays.
			return false
		}
		for (var i=0, len=a.length; i<len; i++) {
			if (!(i in b)) {
				// Promise.settle() fills deleted keys with undefined.
				return false
			}
		}
		return (i in b) === false && deepEql(a, b)
	}
}

function isBaseArray(arr) {
	return arr instanceof Array && arr.__proto__ === Array.prototype
}
