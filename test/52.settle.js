'use strict';
const ArrayTester = require('../tools/array-tester');
const deepEquals = require('../tools/deep-equals');
const makeIterable = require('../tools/make-iterable');
const testNonIterables = require('../tools/test-non-iterables');
require('../tools/describe')('Promise.settle', function (Promise, expect) {
	const descriptor = (value) => {
		return Promise.resolve(value).then(
			(value) => ({ state: 'fulfilled', value }),
			(reason) => ({ state: 'rejected', reason })
		);
	};
	const getResult = (array) => {
		return Promise.all(array.map(descriptor));
	};

	it('should be fulfilled given an empty array', function () {
		const array = [];
		return expect(Promise.settle(array)).to.eventually.satisfy(deepEquals(array));
	});
	it('should treat deleted keys as undefined', function () {
		const array = new Array(3);
		return getResult([undefined, undefined, undefined]).then((result) => {
			return expect(Promise.settle(array)).to.eventually.satisfy(deepEquals(result));
		});
	});
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		return getResult(['h', 'e', 'l', 'l', 'o']).then((result) => {
			const expectation = expect(Promise.settle('hello'));
			return expectation.to.eventually.satisfy(deepEquals(result));
		});
	});
	describe('should be rejected on invalid input', function () {
		testNonIterables((value) => {
			return expect(Promise.settle(value)).to.be.rejectedWith(TypeError);
		});
	});
	describe('should be fulfilled with an array of promise descriptors (1)', function () {
		const irrelevantPromise = Promise.reject(new Error('baz')).catchLater();
		const source = [[irrelevantPromise], 123];
		ArrayTester.test(source, (input) => {
			return getResult(input).then((result) => {
				return expect(Promise.settle(input)).to.eventually.satisfy(deepEquals(result));
			});
		});
	});
	describe('should be fulfilled with an array of promise descriptors (2)', function () {
		const source = [ArrayTester.reject(new Error('foo')), 123];
		ArrayTester.test(source, (input) => {
			return getResult(input).then((result) => {
				return expect(Promise.settle(input)).to.eventually.satisfy(deepEquals(result));
			});
		});
	});
	describe('should not be affected by changing the input array after invocation', function () {
		const source = ['foo', ''];
		ArrayTester.test(source, (input) => {
			return getResult(input).then((result) => {
				const ret = Promise.settle(input);
				input[0] = 'bar';
				delete input[1];
				input.length = 1;
				return expect(ret).to.eventually.satisfy(deepEquals(result));
			});
		});
	});
	describe('should not be affected by changing the input iterable after invocation', function () {
		const source = ['foo', ArrayTester.reject('quux')];
		ArrayTester.test(source, (input) => {
			return getResult(input).then((result) => {
				const ret = Promise.settle(makeIterable(input));
				input[0] = 'bar';
				delete input[1];
				input.length = 1;
				return expect(ret).to.eventually.satisfy(deepEquals(result));
			});
		});
	});
});
