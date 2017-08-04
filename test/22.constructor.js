'use strict'
require('../tools/describe')('Promise.constructor', function (Promise, expect) {
	const defaultThis = (function () { return this; }());
	
	it('should throw on invalid input', function () {
		expect(() => { new Promise(); }).to.throw(TypeError);
		expect(() => { new Promise('foo'); }).to.throw(TypeError);
		expect(() => { new Promise({}); }).to.throw(TypeError);
		expect(() => { new Promise(null); }).to.throw(TypeError);
		expect(() => { new Promise(false); }).to.throw(TypeError);
		expect(() => { new Promise(346543); }).to.throw(TypeError);
	});
	it('should throw when called without "new"', function () {
		expect(() => { Promise(); }).to.throw(TypeError);
		expect(() => { Promise(() => {}); }).to.throw(TypeError);
	});
	it('should invoke the handler synchronously', function () {
		let invoked = false;
		new Promise(() => (invoked = true));
		expect(invoked).to.be.true;
	});
	it('should invoke the handler as a function', function () {
		new Promise(function () {
			expect(this).to.equal(defaultThis);
		});
	});
	it('should invoke the handler with 2 function arguments', function () {
		new Promise(function () {
			expect(arguments.length).to.equal(2);
			expect(arguments[0]).to.be.a('function');
			expect(arguments[1]).to.be.a('function');
		});
	});
	describe('should reject if an error is thrown inside the handler', function () {
		specify('throw 0', function () {
			return expect(new Promise(() => { throw 0; })).to.be.rejected;
		});
		specify('throw true', function () {
			return expect(new Promise(() => { throw true; })).to.be.rejected;
		});
		specify('throw new Error()', function () {
			const err = new Error();
			return expect(new Promise(() => { throw err; })).to.be.rejectedWith(err);
		});
	});
	
	// Everything below is taken from, or inspired by https://github.com/petkaantonov/bluebird
	
	function createPendingPromise() {
		let resolve, reject;
		const p = new Promise((a, b) => {
			resolve = a;
			reject = b;
		});
		p.resolve = resolve;
		p.reject = reject;
		return p;
	}
	function fulfills(value, test) {
		specify('immediately-fulfilled', function () {
			return test(new Promise((res) => {
				res(value);
			}));
		});
		specify('eventually-fulfilled', function () {
			return test(new Promise((res) => {
				setTimeout(() => {
					res(value);
				}, 1);
			}));
		});
	}
	function rejects(reason, test) {
		specify('immediately-rejected', function () {
			return test(new Promise((res, rej) => {
				rej(reason);
			}));
		});
		specify('eventually-rejected', function () {
			return test(new Promise((res, rej) => {
				setTimeout(() => {
					rej(reason);
				}, 1);
			}));
		});
	}
	function testFulfilled(value, test) {
		describe('immediate value', function () {
			fulfills(value, test);
		});
		describe('fulfilled promise for value', function () {
			fulfills(Promise.resolve(value), test);
		});
		describe('immediately fulfilled promise for value', function () {
			const p = createPendingPromise();
			fulfills(p, test);
			p.resolve(value);
		});
		describe('eventually fulfilled promise for value', function () {
			const p = createPendingPromise();
			setTimeout(() => {
				p.resolve(value);
			}, 1);
			fulfills(p, test);
		});
		describe('synchronous thenable for value', function () {
			fulfills({
				then: (fn) => {
					fn(value);
				}
			}, test);
		});
		describe('asynchronous thenable for value', function () {
			fulfills({
				then: (fn) => {
					setTimeout(() => {
						fn(value);
					}, 1);
				}
			}, test);
		});
	}
	function testRejected(reason, test) {
		describe('immediate reason', function () {
			return rejects(reason, test);
		});
	}
	function shouldNotFulfill() {
		throw new Error('This promise should not have been fulfilled');
	}
	
	describe('resolves the promise with the given object value', function () {
		const obj = {};
		testFulfilled(obj, (promise) => {
			return expect(promise).to.eventually.equal(obj);
		});
	});
	describe('resolves the promise with the given primitive value', function () {
		testFulfilled(3, (promise) => {
			return expect(promise).to.eventually.equal(3);
		});
	});
	describe('resolves the promise with the given undefined value', function () {
		testFulfilled(undefined, (promise) => {
			return expect(promise).to.eventually.equal(undefined);
		});
	});
	describe('rejects the promise with the given object reason', function () {
		const obj = {};
		testRejected(obj, (promise) => {
			return promise.then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(obj);
			});
		});
	});
	describe('rejects the promise with the given primitive reason', function () {
		testRejected(3, (promise) => {
			return promise.then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(3);
			});
		});
	});
	describe('rejects the promise with the given undefined reason', function () {
		testRejected(undefined, (promise) => {
			return promise.then(shouldNotFulfill, (reason) => {
				expect(reason).to.equal(undefined);
			});
		});
	});
});
