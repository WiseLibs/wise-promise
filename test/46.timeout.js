'use strict';
require('../tools/describe')('Promise.TimeoutError', function (Promise, expect) {
	it('should be a subclass of Error', function () {
		expect(Promise.TimeoutError).to.be.a('function');
		expect(Promise.TimeoutError.prototype).to.be.an.instanceof(Error);
		expect(Promise.TimeoutError).to.not.equal(Error);
	});
	it('should use regular Error properties', function () {
		const error = new Promise.TimeoutError('foobar');
		expect(error.message).to.equal('foobar');
		expect(error.name).to.equal('TimeoutError');
		expect(typeof error.stack).to.equal(typeof (new Error('baz').stack));
	});
	it('should be callable as a function', function () {
		const error = Promise.TimeoutError('foobarbaz');
		expect(error.message).to.equal('foobarbaz');
		expect(error.name).to.equal('TimeoutError');
		expect(typeof error.stack).to.equal(typeof (Error('qux').stack));
	});
	it('should have the same property descriptors as a regular Error', function () {
		const getOwnPropertyDescriptors = (obj) => {
			const ret = {};
			for (const key of Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj))) {
				ret[key] = Object.getOwnPropertyDescriptor(obj, key);
			}
			return ret;
		};
		const aObject = Error('qux');
		const bObject = Promise.TimeoutError('qux');
		const a = getOwnPropertyDescriptors(aObject);
		const b = getOwnPropertyDescriptors(bObject);
		const aStack = (a.stack.value || a.stack.get.call(aObject)).split('\n')[0];
		const bStack = (b.stack.value || b.stack.get.call(bObject)).split('\n')[0];
		a.stack.value = '';
		b.stack.value = '';
		expect(a).to.deep.equal(b);
		expect(bStack.replace('TimeoutError', 'Error')).to.equal(aStack);
		expect(aStack).to.equal(String(aObject));
		expect(bStack).to.equal(String(bObject));
	});
});

require('../tools/describe')('.timeout', function (Promise, expect) {
	const eventualPromise = (ms) => {
		return new Promise((res) => {
			setTimeout(() => res('foo'), ms);
		});
	};
	const testTimeout = (ms, beforeTimeout, afterTimeout) => {
		specify('settled before timeout', function () {
			return expect(eventualPromise(beforeTimeout).timeout(ms))
				.to.become('foo');
		});
		specify('settled too late', function () {
			return expect(eventualPromise(afterTimeout).timeout(ms))
				.to.be.rejectedWith(Promise.TimeoutError);
		});
	};
	const testTimeoutZero = (ms) => {
		specify('settled before timeout', function () {
			let resolvePromise;
			const promise = new Promise((res) => { resolvePromise = res; });
			const expectation = expect(promise.timeout(ms)).to.become('foo');
			resolvePromise('foo');
			return expectation;
		})
		specify('settled too late', function () {
			return expect(eventualPromise(15).timeout(ms))
				.to.be.rejectedWith(Promise.TimeoutError);
		});
	};
	
	it('should return a new promise', function () {
		const original = Promise.resolve();
		const timeouted = original.timeout();
		expect(timeouted).to.be.an.instanceof(Promise);
		expect(original).to.not.equal(timeouted);
	});
	describe('should reject with TimeoutError if not settled before the timeout', function () {
		specify('fulfilled after the timeout', function () {
			return expect(eventualPromise(115).timeout(100)).to.be.rejectedWith(Promise.TimeoutError);
		});
		specify('rejected after the timeout', function () {
			const promise = new Promise((res, rej) => {
				setTimeout(() => rej(new Error), 115);
			});
			return expect(promise.timeout(100)).to.be.rejectedWith(Promise.TimeoutError);
		});
	});
	describe('should do nothing if the promise fulfills before the timeout', function () {
		specify('already fulfilled', function () {
			return expect(Promise.resolve('foo').timeout(4)).to.become('foo');
		});
		specify('fulfills immediately', function () {
			let resolvePromise;
			const promise = new Promise((res) => { resolvePromise = res; });
			const expectation = expect(promise.timeout(4)).to.become('foo');
			resolvePromise('foo');
			return expectation;
		});
		specify('fulfills eventually, before timeout', function () {
			const promise = new Promise((res) => {
				setTimeout(() => { res('foo'); }, 85);
			});
			return expect(promise.timeout(100)).to.become('foo');
		});
	});
	describe('should do nothing if the promise rejects before the timeout', function () {
		specify('already rejected', function () {
			const error = new Error;
			return expect(Promise.reject(error).timeout(4)).to.be.rejectedWith(error);
		});
		specify('rejects immediately', function () {
			let rejectPromise;
			const error = new Error;
			const promise = new Promise((res, rej) => { rejectPromise = rej; });
			const expectation = expect(promise.timeout(4)).to.be.rejectedWith(error);
			rejectPromise(error);
			return expectation;
		});
		specify('rejects eventually, before timeout', function () {
			const error = new Error;
			const promise = new Promise((res, rej) => {
				setTimeout(() => rej(error), 85);
			});
			return expect(promise.timeout(100)).to.be.rejectedWith(error);
		});
	});
	describe('should treat numeric strings as valid time values', function () {
		testTimeout('1.0e2', 85, 115);
	});
	describe('should treat number objects as valid time values', function () {
		testTimeout({ valueOf: () => '1.0e2' }, 85, 115);
	});
	describe('should treat non-numeric or negative arguments as zero', function () {
		describe('argument is null', function () {
			testTimeoutZero(null);
		});
		describe('argument is undefined', function () {
			testTimeoutZero(undefined);
		});
		describe('argument is -100', function () {
			testTimeoutZero(-100);
		});
		describe('argument is NaN', function () {
			testTimeoutZero(NaN);
		});
		describe('argument is Infinity', function () {
			testTimeoutZero(Infinity);
		});
		describe('argument is "foo"', function () {
			testTimeoutZero('foo');
		});
		describe('argument is {}', function () {
			testTimeoutZero({});
		});
		describe('argument is () => 100', function () {
			testTimeoutZero(() => 100);
		});
	});
	describe('should respect the custom error argument', function () {
		const shouldNotFulfill = () => {
			throw new Error('This promise should have been rejected');
		};
		const shouldBeTimeoutErrorOf = (str) => (reason) => {
			expect(reason).to.be.an.instanceof(Promise.TimeoutError);
			expect(reason.message).to.equal(str);
		};
		describe('when argument is null or undefined, a default message should be used', function () {
			specify('argument is undefined', function () {
				return eventualPromise(100).timeout(NaN, undefined).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf('The operation timed out after 0ms'));
			});
			specify('argument is null', function () {
				return eventualPromise(100).timeout(9.4, null).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf('The operation timed out after 9ms'));
			});
		});
		describe('when argument is an instanceof Error, that error object should be used', function () {
			specify('argument is an Error', function () {
				const error = new Error;
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error);
			});
			specify('argument is a TypeError', function () {
				const error = new TypeError;
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error);
			});
			specify('argument is a Promise.TimeoutError', function () {
				const error = new Promise.TimeoutError;
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error);
			});
		});
		describe('when argument is something else, it should be used as a custom message', function () {
			const correctSymbolCasting = (() => {
				try { String(Symbol()); }
				catch (_) { return false; }
				return true;
			})();
			const testTimeoutErrorMessage = (arg) => {
				return eventualPromise(100).timeout(0, arg).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf(String(arg)));
			};
			specify('argument is 0', function () {
				return testTimeoutErrorMessage(0);
			});
			specify('argument is ""', function () {
				return testTimeoutErrorMessage('');
			});
			specify('argument is 123.4', function () {
				return testTimeoutErrorMessage(123.4);
			});
			specify('argument is "foo"', function () {
				return testTimeoutErrorMessage('foo');
			});
			specify('argument is {}', function () {
				return testTimeoutErrorMessage({});
			});
			specify('argument is [1, 3, 5]', function () {
				return testTimeoutErrorMessage([1, 3, 5]);
			});
			specify('argument is new Date', function () {
				return testTimeoutErrorMessage(new Date);
			});
			specify('argument is Error (constructor)', function () {
				return testTimeoutErrorMessage(Error);
			});
			specify('argument is () => new Error', function () {
				return testTimeoutErrorMessage(() => new Error);
			});
			if (correctSymbolCasting) {
				specify('argument is Symbol("bar")', function () {
					return testTimeoutErrorMessage(Symbol('bar'));
				});
			}
		});
	});
});
