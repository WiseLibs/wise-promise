'use strict'
var ArrayTester = require('../tools/array-tester')
var makeIterable = require('../tools/make-iterable')
var testNonIterables = require('../tools/test-non-iterables')
require('../tools/describe')('Promise.any', function (Promise, expect) {
	it('should be rejected when given an empty array', function () {
		return expect(Promise.any([])).to.be.rejected
	})
	it('should treat deleted keys as undefined', function () {
		var array = ['a', 'b', 'c']
		delete array[0]
		return expect(Promise.any(array)).to.become(undefined)
	})
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		var expectation = expect(Promise.any('hello'))
		if (typeof Symbol !== 'function' || !Symbol.iterator) {
			return expectation.to.be.rejectedWith(TypeError)
		}
		return expectation.to.become('h')
	})
	describe('should be rejected on invalid input', function () {
		testNonIterables(function (value) {
			return expect(Promise.any(value)).to.be.rejectedWith(TypeError)
		})
	})
	describe('should be fulfilled with the first fullfilled item', function () {
		var irrelevantPromise = Promise.reject(new Error('baz')).catchLater();
		ArrayTester.test([[irrelevantPromise], 123], function (input, source, raceWinner) {
			return expect(Promise.any(input)).to.eventually.equal(source[raceWinner])
		})
	})
	describe('should not be affected by changing the input array after invocation', function () {
		ArrayTester.test(['foo', ''], function (input, source, raceWinner) {
			var ret = Promise.any(input)
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.become(source[raceWinner])
		})
	})
	describe('should not be affected by changing the input iterable after invocation', function () {
		ArrayTester.test(['foo', ''], function (input, source, raceWinner) {
			var ret = Promise.any(makeIterable(input))
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.become(source[raceWinner])
		})
	})
	describe('should be resolved by the first fulfilled value or promise', function () {
		var array = [ArrayTester.reject(new Error('baz')), 123]
		ArrayTester.test(array, function (input, source, raceWinner) {
			return expect(Promise.any(input)).to.become(123)
		})
	})
	describe('should be rejected with the first promise, if no promises fulfill', function () {
		var errors = [new Error('foo'), new Error('baz')]
		var array = [ArrayTester.reject(errors[0]), ArrayTester.reject(errors[1])]
		ArrayTester.test(array, function (input, source, raceWinner) {
			return expect(Promise.any(input)).to.be.rejectedWith(errors[raceWinner])
		})
	})
})
