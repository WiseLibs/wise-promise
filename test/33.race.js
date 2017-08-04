'use strict';
const ArrayTester = require('../tools/array-tester');
const makeIterable = require('../tools/make-iterable');
const testNonIterables = require('../tools/test-non-iterables');
require('../tools/describe')('Promise.race', function (Promise, expect) {
	it('should never be resolved when given an empty array', function (done) {
		let called = false;
		const doneOnce = (err) => {
			if (!called) {
				called = true;
				done(err);
			}
		};
		Promise.race([]).then(() => {
			doneOnce(new Error('This promise should not have been resolved'));
		}, doneOnce);
		setTimeout(doneOnce, 100);
	});
	it('should treat deleted keys as undefined', function () {
		const array = ['a', 'b', 'c'];
		delete array[0];
		return expect(Promise.race(array)).to.become(undefined);
	});
	it('should treat strings as iterables, if ES6 iterables are supported', function () {
		return expect(Promise.race('hello')).to.become('h');
	});
	describe('should be rejected on invalid input', function () {
		testNonIterables((value) => {
			return expect(Promise.race(value)).to.be.rejectedWith(TypeError);
		});
	});
	describe('should be fulfilled with the first fullfilled item', function () {
		const irrelevantPromise = Promise.reject(new Error('baz')).catchLater();
		ArrayTester.test([[irrelevantPromise], 123], (input, source, raceWinner) => {
			return expect(Promise.race(input)).to.eventually.equal(source[raceWinner]);
		});
	});
	describe('should not be affected by changing the input array after invocation', function () {
		ArrayTester.test(['foo', ''], (input, source, raceWinner) => {
			const ret = Promise.race(input);
			input[0] = 'bar';
			delete input[1];
			input.length = 1;
			return expect(ret).to.become(source[raceWinner]);
		});
	});
	describe('should not be affected by changing the input iterable after invocation', function () {
		ArrayTester.test(['foo', ''], (input, source, raceWinner) => {
			const ret = Promise.race(makeIterable(input));
			input[0] = 'bar';
			delete input[1];
			input.length = 1;
			return expect(ret).to.become(source[raceWinner]);
		});
	});
	describe('should be resolved by the first settled value or promise', function () {
		const err = new Error('baz');
		ArrayTester.test([123, ArrayTester.reject(err)], (input, source, raceWinner) => {
			if (raceWinner === 0) {
				return expect(Promise.race(input)).to.become(123);
			} else {
				return expect(Promise.race(input)).to.be.rejectedWith(err);
			}
		});
	});
});
