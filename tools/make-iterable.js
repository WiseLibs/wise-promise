'use strict'

// Given an array or array-like object, this function returns an iterable object
// that iterates directly through the array. The array is not copied or cloned.
module.exports = function (arr) {
	if (typeof Symbol === 'function' && Symbol.iterator) {
		var obj = {}
		obj[Symbol.iterator] = function () {
			var i = 0
			return {next: function () {
				return i < arr.length
				 ? {done: false, value: arr[i++]}
				 : (i = NaN, {done: true, value: undefined})
			}}
		}
		return obj
	}
	return arr
}
