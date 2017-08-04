'use strict';
require('../tools/describe')('Promise.after', function (Promise, expect) {
	const afterTest = (passedValue, ms, minTime, maxTime) => {
		const p = Promise.after(ms, passedValue);
		const time = Date.now();
		return p.then((value) => {
			expect(Date.now() - time).to.be.within(minTime, maxTime);
			return value;
		}, (reason) => {
			expect(Date.now() - time).to.be.within(minTime, maxTime);
			throw reason;
		});
	};
	
	describe('should return a new promise', function () {
		specify('when given no arguments', function () {
			expect(Promise.after()).to.be.an.instanceof(Promise);
		});
		specify('when given 1 argument', function () {
			expect(Promise.after(10)).to.be.an.instanceof(Promise);
		});
		specify('when given 2 arguments (value)', function () {
			expect(Promise.after(10, 'foo')).to.be.an.instanceof(Promise);
		});
		specify('when given 2 arguments (promise)', function () {
			const original = Promise.resolve();
			const returned = Promise.after(10, original);
			expect(returned).to.be.an.instanceof(Promise);
			expect(returned).to.not.equal(original);
		});
	});
	describe('should be resolved with the given value', function () {
		specify('value', function () {
			return expect(afterTest('foo', 100, 90, 110)).to.become('foo');
		});
		specify('fulfilled promise', function () {
			return expect(afterTest(Promise.resolve('foo'), 100, 90, 110)).to.become('foo');
		});
		specify('eventually fulfilled promise', function () {
			return expect(afterTest(new Promise((res) => {
				setTimeout(() => res('foo'), 150);
			}), 100, 140, 160)).to.become('foo');
		});
		specify('rejected promise', function () {
			const err = new Error('bar');
			return expect(afterTest(Promise.reject(err), 100, 90, 110)).to.be.rejectedWith(err);
		});
		specify('eventually rejected promise', function () {
			const err = new Error('bar');
			return expect(afterTest(new Promise((res, rej) => {
				setTimeout(() => rej(err), 150);
			}), 100, 140, 160)).to.be.rejectedWith(err);
		});
	});
	describe('should treat numeric values as valid time values', function () {
		specify('numeric strings', function () {
			return expect(afterTest('foo', '1.0e2', 90, 110)).to.become('foo');
		});
		specify('numeric objects', function () {
			const obj = { valueOf: () => '1.0e2' };
			return expect(afterTest('foo', obj, 90, 110)).to.become('foo');
		});
	});
	describe('should treat non-numeric or negative arguments as zero', function () {
		specify('argument is null', function () {
			return expect(afterTest('foo', null, 0, 15)).to.become('foo');
		});
		specify('argument is undefined', function () {
			return expect(afterTest('foo', undefined, 0, 15)).to.become('foo');
		});
		specify('argument is -100', function () {
			return expect(afterTest('foo', -100, 0, 15)).to.become('foo');
		});
		specify('argument is NaN', function () {
			return expect(afterTest('foo', NaN, 0, 15)).to.become('foo');
		});
		specify('argument is Infinity', function () {
			return expect(afterTest('foo', Infinity, 0, 15)).to.become('foo');
		});
		specify('argument is "foo"', function () {
			return expect(afterTest('foo', 'foo', 0, 15)).to.become('foo');
		});
		specify('argument is {}', function () {
			return expect(afterTest('foo', {}, 0, 15)).to.become('foo');
		});
		specify('argument is function () {return 100}', function () {
			return expect(afterTest('foo', () => 100, 0, 15)).to.become('foo');
		});
	});
});
