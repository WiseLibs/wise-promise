'use strict'
var ArrayTester = require('../tools/test/array-tester')
var shallowEquals = require('../tools/test/shallow-equals')
var makeIterable = require('../tools/test/make-iterable')
var testNonIterables = require('../tools/test/test-non-iterables')
require('../tools/describe')('Promise.all', function (Promise, expect) {
	var arrayTester = new ArrayTester(Promise)
	function expectToMatch(input, source) {
		return expect(Promise.all(input)).to.eventually.satisfy(shallowEquals(source))
	}
	
	it('should be fulfilled given an empty array', function () {
		var array = []
		return expectToMatch(array, array)
	})
	it('should treat deleted keys as undefined', function () {
		var array = new Array(3)
		return expectToMatch(array, array)
	})
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		var expectation = expect(Promise.all('hello'))
		if (typeof Symbol !== 'function' || !Symbol.iterator) {
			return expectation.to.be.rejectedWith(TypeError)
		}
		return expectation.to.eventually.satisfy(shallowEquals(['h', 'e', 'l', 'l', 'o']))
	})
	describe('should be rejected on invalid input', function () {
		testNonIterables(function (value) {
			return expect(Promise.all(value)).to.be.rejectedWith(TypeError)
		})
	})
	describe('should be fulfilled with an array of values', function () {
		var irrelevantPromise = Promise.reject(new Error('baz')).catchLater()
		arrayTester.test([[irrelevantPromise], 123], expectToMatch)
	})
	describe('should not be affected by changing the input array after invocation', function () {
		arrayTester.test(['foo', ''], function (input, source) {
			var ret = Promise.all(input)
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.eventually.satisfy(shallowEquals(['foo', '']))
		})
	})
	describe('should not be affected by changing the input iterable after invocation', function () {
		arrayTester.test(['foo', ''], function (input, source) {
			var ret = Promise.all(makeIterable(input))
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.eventually.satisfy(shallowEquals(['foo', '']))
		})
	})
	describe('should be rejected with the rejection reason of a rejected promise', function () {
		var err = new Error('baz')
		arrayTester.test([123, Promise.reject(err)], function (input, source) {
			return expect(Promise.all(input)).to.be.rejectedWith(err)
		})
	})
	describe('should be rejected by the earliest rejected promise', function () {
		var errors = [new Error('baz'), new Error('quux')]
		arrayTester.test([Promise.reject(errors[0]), Promise.reject(errors[1])], function (input, source, raceWinner) {
			return expect(Promise.all(input)).to.be.rejectedWith(errors[raceWinner])
		})
	})
})
