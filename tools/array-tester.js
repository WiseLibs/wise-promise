'use strict'
var Thenable = require('./thenable')

// This class is used to test promise APIs that accept arrays or iterable
// objects of values or promises/thenables.
function ArrayTester(Promise) {
	var memo = {}
	
	// These are the functions used to map source values to input values.
	// Each permutation of these options will be tested for a given source array.
	// These functions are invoked with a `this` value of a Context object.
	var options = [
	
		// the value itself
		function (i) {
			if (i in this.source) {
				this.input[i] = this.source[i]
			}
			this.description[i] = 'value'
		},
		
		// a settled promise of the value
		function (i) {
			var item = this.getItem(i)
			this.input[i] = item.rejected ? Promise.reject(item.value).catchLater() : Promise.resolve(item.value)
			this.description[i] = 'settled promise'
		},
		
		// an eventually-settled promise of the value
		function (i) {
			var item = this.getItem(i)
			var afters = this.afters
			this.input[i] = new Promise(function (res, rej) {
				afters.push(function () {
					setTimeout(function () {
						;(item.rejected ? rej : res)(item.value)
					}, 1)
				})
			})
			this.description[i] = 'eventual promise'
		},
		
		// an already-settled foreign thenable object
		function (i) {
			var item = this.getItem(i)
			var thenable = this.input[i] = new Thenable
			thenable[item.rejected ? 'reject' : 'resolve'](item.value)
			this.description[i] = 'settled thenable'
		},
		
		// an eventually-settled foreign thenable object
		function (i) {
			var item = this.getItem(i)
			var afters = this.afters
			var thenable = this.input[i] = new Thenable
			afters.push(function () {
				setTimeout(function () {
					thenable[item.rejected ? 'reject' : 'resolve'](item.value)
				}, 1)
			})
			this.description[i] = 'eventual thenable'
		}
		
	]
	
	// This function runs the given test for each possible permutation of the
	// given source array. Permutations are created by transforming the source
	// array items through different "options" (listed above).
	this.test = function (source, test) {
		var permutations = memo[source.length]
		
		if (!permutations) {
			memo[source.length] = permutations = permutate(options, source.length)
			// In addition to the standard permutations, we also want to have
			// test cases where every value in the source array is transformed
			// through the same option.
			for (var i=0; i<options.length; i++) {
				var extraTextCase = new Array(source.length)
				for (var j=0; j<source.length; j++) {
					extraTextCase[j] = options[i]
				}
				permutations.push(extraTextCase)
			}
		}
		
		permutations.forEach(function (options) {
			var context = new Context(source)
			for (var i=0, len=source.length; i<len; i++) {
				options[i].call(context, i)
			}
			context.doTest(test)
		})
	}
	
	// Objects of this class are used to store information required to build a
	// single test case.
	function Context(source) {
		this.source = source
		this.input = new Array(source.length)
		this.description = new Array(source.length)
		this.afters = []
	}
	Context.prototype.getItem = function (i) {
		var value = this.source[i]
		if (value instanceof Promise) {
			var inspection = value.inspect()
			if ('reason' in inspection) {
				value.catchLater()
				return {value: inspection.reason, rejected: true}
			} else {
				throw new Error('ArrayTester only accepts arrays of values and rejected promises.')
			}
		}
		return {value: value, rejected: false}
	}
	Context.prototype.doTest = function (test) {
		var ctx = this
		var indexOfRaceWinner = getRaceWinner(ctx.description)
		specify('[' + ctx.description.join(', ') + ']', function () {
			var ret = test(ctx.input, ctx.source, indexOfRaceWinner)
			ctx.afters.forEach(function (fn) {fn()})
			return ret
		})
	}
}
module.exports = ArrayTester

// This function accepts a description array, and returns the index of the item
// that SHOULD resolve a Promise.race() test.
function getRaceWinner(description) {
	var len = description.length
	for (var i=0; i<len; i++) {
		var type = description[i]
		if (type === 'value' || type === 'settled promise' || type === 'settled thenable') {
			return i
		}
	}
	for (var i=0; i<len; i++) {
		var type = description[i]
		if (type === 'eventual promise' || 'eventual thenable') {
			return i
		}
	}
	throw new Error('No recognized value descriptions found.')
}

function permutate(inputArr, resultLength) {
	var results = []
	
	function permute(arr, memo) {
		var cur, memo = memo || []
		
		for (var i=0; i<arr.length; i++) {
			cur = arr.splice(i, 1)
			if (memo.length === resultLength - 1) {
				results.push(memo.concat(cur))
			}
			permute(arr.slice(), memo.concat(cur))
			arr.splice(i, 0, cur[0])
		}
		
		return results
	}
	
	return permute(inputArr)
}
