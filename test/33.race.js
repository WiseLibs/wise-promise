'use strict'
var ArrayTester = require('../tools/test/array-tester')
var makeIterable = require('../tools/test/make-iterable')
var testNonIterables = require('../tools/test/test-non-iterables')
require('../tools/test/describe')('Promise.race', function (Promise, expect) {
	var arrayTester = new ArrayTester(Promise)
	
	it('should never be resolved when given an empty array', function (done) {
		var called = false
		function doneOnce(err) {
			if (!called) {
				called = true
				done(err)
			}
		}
		Promise.race([]).then(function () {
			doneOnce(new Error('This promise should not have been resolved.'))
		}, doneOnce)
		setTimeout(doneOnce, 100)
	})
	it('should treat deleted keys as undefined', function () {
		var array = ['a', 'b', 'c']
		delete array[0]
		return expect(Promise.race(array)).to.become(undefined)
	})
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		var expectation = expect(Promise.race('hello'))
		if (typeof Symbol !== 'function' || !Symbol.iterator) {
			return expectation.to.be.rejectedWith(TypeError)
		}
		return expectation.to.become('h')
	})
	describe('should be rejected on invalid input', function () {
		testNonIterables(function (value) {
			return expect(Promise.race(value)).to.be.rejectedWith(TypeError)
		})
	})
	describe('should be fulfilled with the first fullfilled item', function () {
		var irrelevantPromise = Promise.reject(new Error('baz')).catchLater()
		arrayTester.test([[irrelevantPromise], 123], function (input, source, raceWinner) {
			return expect(Promise.race(input)).to.eventually.equal(source[raceWinner])
		})
	})
	describe('should not be affected by changing the input array after invocation', function () {
		arrayTester.test(['foo', ''], function (input, source, raceWinner) {
			var ret = Promise.race(input)
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.become(source[raceWinner])
		})
	})
	describe('should not be affected by changing the input iterable after invocation', function () {
		arrayTester.test(['foo', ''], function (input, source, raceWinner) {
			var ret = Promise.race(makeIterable(input))
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.become(source[raceWinner])
		})
	})
	describe('should be resolved by the first settled value or promise', function () {
		var err = new Error('baz')
		arrayTester.test([123, Promise.reject(err)], function (input, source, raceWinner) {
			if (raceWinner === 0) {
				return expect(Promise.race(input)).to.become(123)
			} else {
				return expect(Promise.race(input)).to.be.rejectedWith(err)
			}
		})
	})
})
