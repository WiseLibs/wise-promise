'use strict';
const testNonFunctions = require('../tools/test-non-functions');
require('../tools/describe')('Promise.nodeify', function (Promise, expect) {
	const makeFunction = (argCount, error, async) => {
		const args = [];
		for (let i = 0; i < argCount; ++i) args.push('a_' + i);
		const resolve = 'error ? reject(error) : resolve(args.reduce((a, b) => a + b, 0));';
		if (!async) {
			return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') { const args = [...arguments]; return new Promise((resolve, reject) => { ' + resolve + ' }); }')(error, Promise));
		} else {
			return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') { const args = [...arguments]; return new Promise((resolve, reject) => { setTimeout(() => { ' + resolve + ' }, ' + ~~async + '); }); }')(error, Promise));
		}
	};
	const forManyStyles = (error, test) => {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100].forEach((n) => {
			specify(`length ${n} (sync)`, function (done) {
				return test(makeFunction(n, error), done);
			})
			specify(`length ${n} (async)`, function (done) {
				return test(makeFunction(n, error, 1), done);
			});
		});
	};
	const makeCustomFunction = (argCount, error, body) => {
		const args = [];
		for (let i = 0; i < argCount; ++i) args.push('a_' + i);
		return Promise.nodeify(new Function(['error', 'Promise'], 'return function (' + args.join(', ') + ') { const args = [...arguments]; return new Promise((resolve, reject) => { ' + body + '; }); }')(error, Promise));
	};
	const forManyCustomStyles = (error, body, test) => {
		[0, 1, 2, 3, 4, 5, 6, 10, 50, 100].forEach((n) => {
			specify(`length ${n}`, function (done) {
				return test(makeCustomFunction(n, error, body), done);
			});
		});
	};
	describe('should throw when not given a function', function () {
		testNonFunctions((value) => {
			expect(() => { Promise.nodeify(value); }).to.throw(TypeError);
		});
		specify('given: no arguments', function () {
			expect(() => { Promise.nodeify(); }).to.throw(TypeError);
		});
	});
	describe('should return `this`', function () {
		forManyCustomStyles({}, '', (fn, done) => {
			const obj = {};
			expect(fn()).to.be.undefined;
			expect(fn(function () {})).to.be.undefined;
			expect(fn.call(obj)).to.equal(obj);
			expect(fn.call(obj, function () {})).to.equal(obj);
			done();
		});
	});
	describe('should be invoked with the proper `this` value', function () {
		const obj = {};
		forManyCustomStyles(obj, 'this === error ? resolve() : reject(new Error("Incorrect `this` value."))', (fn, done) => {
			fn.call(obj, done);
		});
	});
	describe('should invoke the callback with the fulfilled value', function () {
		describe('1 passed arg', function () {
			forManyStyles(null, (fn, done) => {
				fn((err, value) => {
					expect(err).to.be.null;
					expect(value).to.equal(0);
					done();
				});
			});
		});
		describe('5 passed args', function () {
			forManyStyles(null, (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.be.null;
					expect(value).to.equal(97);
					done();
				});
			});
		});
		describe('12 passed args', function () {
			forManyStyles(undefined, (fn, done) => {
				fn(1, 2, 6, 88, 23, 254, 123, 7, 2, 5, 1, (err, value) => {
					expect(err).to.be.null;
					expect(value).to.equal(512);
					done();
				});
			});
		});
	});
	describe('should invoke the callback with the rejection reason', function () {
		const error = new Error('foobar')
		forManyStyles(error, (fn, done) => {
			fn(1, 2, 6, 88, (err, value) => {
				expect(err).to.equal(error);
				expect(value).to.be.undefined;
				done();
			});
		});
	});
	describe('should be rejected if the function synchronously throws', function () {
		const error = new Error('foobar')
		forManyCustomStyles(error, 'throw error', (fn, done) => {
			fn(1, 2, 6, 88, (err, value) => {
				expect(err).to.equal(error);
				expect(value).to.be.undefined;
				done();
			});
		});
	});
	describe('should convert rejected falsey values to errors', function () {
		describe('rejected null', function () {
			forManyCustomStyles({}, 'reject(null)', (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.be.an.instanceof(Error);
					expect(value).to.be.undefined;
					done();
				});
			});
		});
		describe('rejected undefined', function () {
			forManyCustomStyles({}, 'reject(undefined)', (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.be.an.instanceof(Error);
					expect(value).to.be.undefined;
					done();
				});
			});
		});
		describe('rejected 0', function () {
			forManyCustomStyles({}, 'reject(0)', (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.be.an.instanceof(Error);
					expect(value).to.be.undefined;
					done();
				});
			});
		});
		describe('rejected ""', function () {
			forManyCustomStyles({}, 'reject("")', (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.be.an.instanceof(Error);
					expect(value).to.be.undefined;
					done();
				});
			});
		});
		describe('rejected "foo"', function () {
			forManyCustomStyles({}, 'reject("foo")', (fn, done) => {
				fn(1, 2, 6, 88, (err, value) => {
					expect(err).to.equal('foo');
					expect(value).to.be.undefined;
					done();
				});
			});
		});
	});
	describe('should pass all arguments when no callback function is provided', function () {
		forManyCustomStyles({}, 'args[args.length - 1].foo = args.length', (fn, done) => {
			const obj = {};
			fn(1, 2, 6, 88, obj);
			expect(obj.foo).to.equal(5);
			done()
		});
	});
});
