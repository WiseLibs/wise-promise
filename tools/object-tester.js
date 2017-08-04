'use strict'
var Thenable = require('./thenable')

// This class is used to test Promise.props, which accepts an object whose iterable
// keys are values or promises/thenables.
function ObjectTester(Promise) {
	var memo = {}
	
	// These are the functions used to map source values to input values.
	// Each permutation of these options will be tested for a given source object.
	// These functions are invoked with a `this` value of a Context object.
	var options = [
	
		// the value itself
		function (key, i) {
			this.input[key] = this.source[key]
			this.description[i] = 'value'
		},
		
		// a settled promise of the value
		function (key, i) {
			var item = this.getItem(key)
			this.input[key] = item.rejected ? Promise.reject(item.value).catchLater() : Promise.resolve(item.value)
			this.description[i] = 'settled promise'
		},
		
		// an eventually-settled promise of the value
		function (key, i) {
			var item = this.getItem(key)
			var afters = this.afters
			this.input[key] = new Promise(function (res, rej) {
				afters.push(function () {
					setTimeout(function () {
						;(item.rejected ? rej : res)(item.value)
					}, 1)
				})
			})
			this.description[i] = 'eventual promise'
		},
		
		// a foreign thenable object that synchronously delivers the value
		function (key, i) {
			var item = this.getItem(key)
			var thenable = this.input[key] = new Thenable
			thenable[item.rejected ? 'reject' : 'resolve'](item.value)
			this.description[i] = 'settled thenable'
		},
		
		// a foreign thenable object that asynchronously delivers the value
		function (key, i) {
			var item = this.getItem(key)
			var afters = this.afters
			var thenable = this.input[key] = new Thenable
			afters.push(function () {
				setTimeout(function () {
					thenable[item.rejected ? 'reject' : 'resolve'](item.value)
				}, 1)
			})
			this.description[i] = 'eventual thenable'
		}
		
	]
	
	// This function runs the given test for each possible permutation of the
	// given source object. Permutations are created by transforming the source
	// object's items through different "options" (listed above).
	this.test = function (source, test) {
		var keys = Object.keys(source)
		var permutations = memo[keys.length]
		
		if (!permutations) {
			memo[keys.length] = permutations = permutate(options, keys.length)
			// In addition to the standard permutations, we also want to have
			// test cases where every value in the source object is transformed
			// through the same option.
			for (var i=0; i<options.length; i++) {
				var extraTextCase = new Array(keys.length)
				for (var j=0; j<keys.length; j++) {
					extraTextCase[j] = options[i]
				}
				permutations.push(extraTextCase)
			}
		}
		
		permutations.forEach(function (options) {
			var context = new Context(source)
			for (var i=0, len=keys.length; i<len; i++) {
				options[i].call(context, keys[i], i)
			}
			context.doTest(test, keys)
		})
	}
	
	// Objects of this class are used to store information required to build a
	// single test case.
	function Context(source) {
		this.source = source
		this.input = {}
		this.description = new Array(Object.keys(source).length)
		this.afters = []
	}
	Context.prototype.getItem = function (key) {
		var value = this.source[key]
		if (value instanceof Promise) {
			var inspection = value.inspect()
			if ('reason' in inspection) {
				value.catchLater()
				return {value: inspection.reason, rejected: true}
			} else {
				throw new Error('ObjectTester only accepts objects of values and rejected promises.')
			}
		}
		return {value: value, rejected: false}
	}
	Context.prototype.doTest = function (test, keys) {
		var ctx = this
		var keysOfRaceWinners = getRaceWinners(ctx.description, keys)
		specify('{' + ctx.description.join(', ') + '}', function () {
			var ret = test(ctx.input, ctx.source, keysOfRaceWinners)
			ctx.afters.forEach(function (fn) {fn()})
			return ret
		})
	}
}
module.exports = ObjectTester

// This function accepts a description array, and an array of matching keys, and
// returns an array of keys that COULD win a race.
function getRaceWinners(description, keys) {
	var winners = []
	var len = description.length
	for (var i=0; i<len; i++) {
		var type = description[i]
		if (type === 'value' || type === 'settled promise' || type === 'settled thenable') {
			winners.push(keys[i])
		}
	}
	if (winners.length) {
		return winners
	}
	for (var i=0; i<len; i++) {
		var type = description[i]
		if (type === 'eventual promise' || type === 'eventual thenable') {
			winners.push(keys[i])
		}
	}
	if (winners.length) {
		return winners
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
