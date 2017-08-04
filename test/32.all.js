'use strict';
const ArrayTester = require('../tools/array-tester');
const shallowEquals = require('../tools/shallow-equals');
const makeIterable = require('../tools/make-iterable');
const testNonIterables = require('../tools/test-non-iterables');
require('../tools/describe')('Promise.all', function (Promise, expect) {
	function expectToMatch(input, source) {
		return expect(Promise.all(input)).to.eventually.satisfy(shallowEquals(source));
	}
	
	it('should be fulfilled given an empty array', function () {
		const array = [];
		return expectToMatch(array, array);
	});
	it('should treat deleted keys as undefined', function () {
		const array = new Array(3);
		return expectToMatch(array, array);
	});
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		const expectation = expect(Promise.all('hello'));
		return expectation.to.eventually.satisfy(shallowEquals(['h', 'e', 'l', 'l', 'o']));
	});
	describe('should be rejected on invalid input', function () {
		testNonIterables((value) => {
			return expect(Promise.all(value)).to.be.rejectedWith(TypeError);
		});
	});
	describe('should be fulfilled with an array of values', function () {
		const irrelevantPromise = Promise.reject(new Error('baz')).catchLater();
		ArrayTester.test([[irrelevantPromise], 123], expectToMatch);
	});
	describe('should not be affected by changing the input array after invocation', function () {
		ArrayTester.test(['foo', ''], (input, source) => {
			const ret = Promise.all(input);
			input[0] = 'bar';
			delete input[1];
			input.length = 1;
			return expect(ret).to.eventually.satisfy(shallowEquals(['foo', '']));
		});
	});
	describe('should not be affected by changing the input iterable after invocation', function () {
		ArrayTester.test(['foo', ''], (input, source) => {
			const ret = Promise.all(makeIterable(input));
			input[0] = 'bar';
			delete input[1];
			input.length = 1;
			return expect(ret).to.eventually.satisfy(shallowEquals(['foo', '']));
		});
	});
	describe('should be rejected with the rejection reason of a rejected promise', function () {
		const err = new Error('baz');
		ArrayTester.test([123, ArrayTester.reject(err)], (input, source) => {
			return expect(Promise.all(input)).to.be.rejectedWith(err);
		});
	});
	describe('should be rejected by the earliest rejected promise', function () {
		const errors = [new Error('baz'), new Error('quux')];
		ArrayTester.test([ArrayTester.reject(errors[0]), ArrayTester.reject(errors[1])], (input, source, raceWinner) => {
			return expect(Promise.all(input)).to.be.rejectedWith(errors[raceWinner]);
		});
	});
});
