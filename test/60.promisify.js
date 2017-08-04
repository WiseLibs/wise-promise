'use strict';
const testNonFunctions = require('../tools/test-non-functions');
require('../tools/describe')('Promise.promisify', function (Promise, expect) {
	const makeFunction = (argCount, error, options, async) => {
		const args = [];
		for (let i = 0; i < argCount; ++i) args.push('a_' + i);
		const pre = 'const args = [...arguments]; ';
		const callback = 'args[args.length - 1](error, args.slice(0, -1).reduce((a, b) => a + b, 0));';
		if (!async) {
			return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') { ' + pre + callback + ' }')(error), options);
		} else {
			return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') { ' + pre + 'setTimeout(() => { ' + callback + ' }, ' + ~~async + '); }')(error), options);
		}
	};
	const forManyStyles = (error, test) => {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100, 200].forEach((n) => {
			specify(`length ${n} (sync)`, function () {
				return test(makeFunction(n, error, undefined));
			});
			specify(`length ${n} (async)`, function () {
				return test(makeFunction(n, error, undefined, 1));
			});
			specify(`length ${n} (deoptimized)`, function () {
				return test(makeFunction(n, error, { deoptimize: true }));
			});
		});
	};
	const makeCustomFunction = (argCount, error, body, options) => {
		const args = [];
		for (let i = 0; i < argCount; ++i) args.push('a_' + i);
		return Promise.promisify(new Function('error', 'return function (' + args.join(', ') + ') { const callback = arguments[arguments.length - 1]; ' + body + '; }')(error), options);
	};
	const forManyCustomStyles = (error, body, test) => {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100, 200].forEach((n) => {
			specify(`length ${n}`, function () {
				return test(makeCustomFunction(n, error, body, undefined));
			});
			specify(`length ${n} (deoptimized)`, function () {
				return test(makeCustomFunction(n, error, body, { deoptimize: true }));
			});
		});
	};
	describe('should throw when not given a function', function () {
		testNonFunctions((value) => {
			expect(() => { Promise.promisify(value); }).to.throw(TypeError);
		});
		specify('given: no arguments', function () {
			expect(() => { Promise.promisify(); }).to.throw(TypeError);
		});
	});
	describe('should return a promise', function () {
		forManyCustomStyles({}, '', (fn) => {
			expect(fn()).to.be.an.instanceof(Promise);
		});
	});
	describe('should be invoked with the proper `this` value', function () {
		const obj = {};
		forManyCustomStyles(obj, 'this === error ? callback() : callback(new Error("Incorrect `this` value."))', (fn) => {
			return fn.call(obj);
		});
	});
	describe('should fulfill with the value of a successful callback', function () {
		describe('4 passed args', function () {
			forManyStyles(null, (fn) => {
				return expect(fn(1, 2, 6, 88)).to.become(97);
			});
		});
		describe('0 passed args', function () {
			forManyStyles(null, (fn) => {
				return expect(fn()).to.become(0);
			});
		});
		describe('11 passed args', function () {
			forManyStyles(null, (fn) => {
				return expect(fn(1, 2, 6, 88, 23, 254, 123, 7, 2, 5, 1)).to.become(512);
			});
		});
	});
	describe('should reject with the rejection reason of a failed callback', function () {
		const err = new Error('foobar');
		forManyStyles(err, (fn) => {
			return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(err);
		});
	});
	describe('should be rejected if the function synchronously throws', function () {
		const err = new Error('foobar');
		forManyCustomStyles(err, 'throw error', (fn) => {
			return expect(fn(1, 2, 6, 88)).to.be.rejectedWith(err);
		});
	});
	describe('should treat truthy errors as rejections', function () {
		describe('error is 1', function () {
			forManyStyles(1, (fn) => {
				return fn(1, 2, 6, 88).then(() => {
					throw new Error('This promise should have been rejected');
				}, (reason) => {
					expect(reason).to.equal(1);
				});
			});
		});
		describe('error is true', function () {
			forManyStyles(true, (fn) => {
				return fn(1, 2, 6, 88).then(() => {
					throw new Error('This promise should have been rejected');
				}, (reason) => {
					expect(reason).to.equal(true);
				});
			});
		});
		describe('error is undefined', function () {
			forManyStyles(undefined, (fn) => {
				return expect(fn(1, 2, 6, 88)).to.become(97);
			});
		});
		describe('error is null', function () {
			forManyStyles(null, (fn) => {
				return expect(fn(1, 2, 6, 88)).to.become(97);
			});
		});
		describe('error is 0', function () {
			forManyStyles(0, (fn) => {
				return expect(fn(1, 2, 6, 88)).to.become(97);
			});
		});
		describe('error is ""', function () {
			forManyStyles('', (fn) => {
				return expect(fn(1, 2, 6, 88)).to.become(97);
			});
		});
	});
	describe('multiArgs options', function () {
		it('should fulfill with an array of values', function () {
			return expect(Promise.promisify((a, b, c, cb) => {
				cb(null, a + b + c, a - b - c, a, b, c);
			}, { multiArgs: true })(5, 6, 8))
			.to.become([19, -9, 5, 6, 8]);
		});
		it('should fulfill with an array of a single value', function () {
			return expect(Promise.promisify((a, b, c, cb) => {
				cb(null, a + b + c);
			}, { multiArgs: true })(5, 6, 8))
			.to.become([19]);
		});
		it('should be rejected with an error', function () {
			const err = new Error('foobar');
			return expect(Promise.promisify((a, b, c, cb) => {
				cb(err, a + b + c, a - b - c, a, b, c);
			}, { multiArgs: true })(5, 6, 8))
			.to.be.rejectedWith(err);
		});
	});
});
