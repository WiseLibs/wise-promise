'use strict'
// This function factory produces functions that test whether their argument is
// an array which is shallowly equal to the array provided to the factory.
// However, it's not a "true" shallow-equality test. The algorithm is used to
// compare arrays before and after being processed by Promise.all(), and
// therefore it must abide by the querks that Promise.all() introduces. These
// querks are notated in comments below.

module.exports = function (a) {
	return function (b) {
		if (a === b || !(a instanceof Array) || !isBaseArray(b) || b.length !== a.length) {
			// Promise.all() never fulfills with the same array as the input.
			// Promise.all() always fulfills with base arrays.
			return false
		}
		for (var i=0, len=a.length; i<len; i++) {
			if (!(i in b)) {
				// Promise.all() fills deleted keys with undefined.
				return false
			}
			if (a[i] !== b[i] && (a[i] === a[i] || b[i] === b[i])) {
				// NaN is considered equal to NaN in this case.
				return false
			}
		}
		return (i in b) === false
	}
}

function isBaseArray(arr) {
	return arr instanceof Array && arr.__proto__ === Array.prototype
}
