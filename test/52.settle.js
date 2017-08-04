'use strict'
var ArrayTester = require('../tools/test/array-tester')
var deepEquals = require('../tools/test/deep-equals')
var makeIterable = require('../tools/test/make-iterable')
var testNonIterables = require('../tools/test/test-non-iterables')
require('../tools/test/describe')('Promise.settle', function (Promise, expect) {
	var arrayTester = new ArrayTester(Promise)
	function descriptor(value) {
		var invertResolution = this === true
		return Promise[invertResolution ? 'reject' : 'resolve'](value).inspect()
	}
	
	it('should be fulfilled given an empty array', function () {
		var array = []
		return expect(Promise.settle(array)).to.eventually.satisfy(deepEquals(array))
	})
	it('should treat deleted keys as undefined', function () {
		var array = new Array(3)
		var result = [descriptor(undefined), descriptor(undefined), descriptor(undefined)]
		return expect(Promise.settle(array)).to.eventually.satisfy(deepEquals(result))
	})
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		var expectation = expect(Promise.settle('hello'))
		if (typeof Symbol !== 'function' || !Symbol.iterator) {
			return expectation.to.be.rejectedWith(TypeError)
		}
		return expectation.to.eventually.satisfy(deepEquals(['h', 'e', 'l', 'l', 'o'].map(descriptor)))
	})
	describe('should be rejected on invalid input', function () {
		testNonIterables(function (value) {
			return expect(Promise.settle(value)).to.be.rejectedWith(TypeError)
		})
	})
	describe('should be fulfilled with an array of promise descriptors (1)', function () {
		var irrelevantPromise = Promise.reject(new Error('baz')).catchLater()
		var source = [[irrelevantPromise], 123]
		var descriptors = source.map(descriptor)
		arrayTester.test(source, function (input) {
			return expect(Promise.settle(input)).to.eventually.satisfy(deepEquals(descriptors))
		})
	})
	describe('should be fulfilled with an array of promise descriptors (2)', function () {
		var source = [Promise.reject(new Error('foo')), 123]
		var descriptors = source.map(descriptor)
		arrayTester.test(source, function (input) {
			return expect(Promise.settle(input)).to.eventually.satisfy(deepEquals(descriptors))
		})
	})
	describe('should not be affected by changing the input array after invocation', function () {
		var source = ['foo', '']
		var descriptors = source.map(descriptor)
		arrayTester.test(source, function (input) {
			var ret = Promise.settle(input)
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.eventually.satisfy(deepEquals(descriptors))
		})
	})
	describe('should not be affected by changing the input iterable after invocation', function () {
		var source = ['foo', Promise.reject('quux')]
		var descriptors = source.map(descriptor)
		arrayTester.test(source, function (input) {
			var ret = Promise.settle(makeIterable(input))
			input[0] = 'bar'
			delete input[1]
			input.length = 1
			return expect(ret).to.eventually.satisfy(deepEquals(descriptors))
		})
	})
})
