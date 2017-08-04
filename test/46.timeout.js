'use strict'
require('../tools/test/describe')('Promise.TimeoutError', function (Promise, expect) {
	it('should be a subclass of Error', function () {
		expect(Promise.TimeoutError).to.be.a('function')
		expect(Promise.TimeoutError.prototype).to.be.an.instanceof(Error)
		expect(Promise.TimeoutError).to.not.equal(Error)
	})
	it('should use regular Error properties', function () {
		var error = new Promise.TimeoutError('foobar')
		expect(error.message).to.equal('foobar')
		expect(error.name).to.equal('TimeoutError')

		var typeofStack = typeof (new Error('baz').stack)
		expect(typeof error.stack).to.equal(typeofStack)
	})
})

require('../tools/test/describe')('.timeout', function (Promise, expect) {
	function eventualPromise(ms) {
		return new Promise(function (res) {
			setTimeout(function () {res('foo')}, ms)
		})
	}
	function testTimeout(ms, beforeTimeout, afterTimeout) {
		specify('settled before timeout', function () {
			return expect(eventualPromise(beforeTimeout).timeout(ms))
				.to.become('foo')
		})
		specify('settled too late', function () {
			return expect(eventualPromise(afterTimeout).timeout(ms))
				.to.be.rejectedWith(Promise.TimeoutError)
		})
	}
	function testTimeoutZero(ms) {
		specify('settled before timeout', function () {
			var resolvePromise
			var promise = new Promise(function (res) {resolvePromise = res})
			var expectation = expect(promise.timeout(ms)).to.become('foo')
			resolvePromise('foo')
			return expectation
		})
		specify('settled too late', function () {
			return expect(eventualPromise(15).timeout(ms))
				.to.be.rejectedWith(Promise.TimeoutError)
		})
	}

	it('should return a new promise', function () {
		var original = Promise.resolve()
		var timeouted = original.timeout()
		expect(timeouted).to.be.an.instanceof(Promise)
		expect(original).to.not.equal(timeouted)
	})
	describe('should reject with TimeoutError if not settled before the timeout', function () {
		specify('fulfilled after the timeout', function () {
			return expect(eventualPromise(115).timeout(100)).to.be.rejectedWith(Promise.TimeoutError)
		})
		specify('rejected after the timeout', function () {
			var promise = new Promise(function (res, rej) {
				setTimeout(function () {rej(new Error)}, 115)
			})
			return expect(promise.timeout(100)).to.be.rejectedWith(Promise.TimeoutError)
		})
	})
	describe('should do nothing if the promise fulfills before the timeout', function () {
		specify('already fulfilled', function () {
			return expect(Promise.resolve('foo').timeout(4)).to.become('foo')
		})
		specify('fulfills immediately', function () {
			var resolvePromise
			var promise = new Promise(function (res) {resolvePromise = res})
			var expectation = expect(promise.timeout(4)).to.become('foo')
			resolvePromise('foo')
			return expectation
		})
		specify('fulfills eventually, before timeout', function () {
			var promise = new Promise(function (res) {
				setTimeout(function () {res('foo')}, 85)
			})
			return expect(promise.timeout(100)).to.become('foo')
		})
	})
	describe('should do nothing if the promise rejects before the timeout', function () {
		specify('already rejected', function () {
			var error = new Error
			return expect(Promise.reject(error).timeout(4)).to.be.rejectedWith(error)
		})
		specify('rejects immediately', function () {
			var error = new Error
			var rejectPromise
			var promise = new Promise(function (res, rej) {rejectPromise = rej})
			var expectation = expect(promise.timeout(4)).to.be.rejectedWith(error)
			rejectPromise(error)
			return expectation
		})
		specify('rejects eventually, before timeout', function () {
			var error = new Error
			var promise = new Promise(function (res, rej) {
				setTimeout(function () {rej(error)}, 85)
			})
			return expect(promise.timeout(100)).to.be.rejectedWith(error)
		})
	})
	describe('should treat numeric strings as valid time values', function () {
		testTimeout('1.0e2', 85, 115)
	})
	describe('should treat number objects as valid time values', function () {
		testTimeout({valueOf: function () {return '1.0e2'}}, 85, 115)
	})
	describe('should treat non-numeric or negative arguments as zero', function () {
		describe('argument is null', function () {
			testTimeoutZero(null)
		})
		describe('argument is undefined', function () {
			testTimeoutZero(undefined)
		})
		describe('argument is -100', function () {
			testTimeoutZero(-100)
		})
		describe('argument is NaN', function () {
			testTimeoutZero(NaN)
		})
		describe('argument is Infinity', function () {
			testTimeoutZero(Infinity)
		})
		describe('argument is "foo"', function () {
			testTimeoutZero('foo')
		})
		describe('argument is {}', function () {
			testTimeoutZero({})
		})
		describe('argument is function () {return 100}', function () {
			testTimeoutZero(function () {return 100})
		})
	})
	describe('should respect the custom error argument', function () {
		function shouldNotFulfill() {
			throw new Error('This promise should have been rejected.')
		}
		function shouldBeTimeoutErrorOf(str) {
			return function (reason) {
				expect(reason).to.be.an.instanceof(Promise.TimeoutError)
				expect(reason.message).to.equal(str)
			}
		}
		describe('when argument is null or undefined, a default message should be used', function () {
			specify('argument is undefined', function () {
				return eventualPromise(100).timeout(NaN, undefined).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf('The operation timed out after 0ms.'))
			})
			specify('argument is null', function () {
				return eventualPromise(100).timeout(9.4, null).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf('The operation timed out after 9ms.'))
			})
		})
		describe('when argument is an instanceof Error, that error object should be used', function () {
			specify('argument is an Error', function () {
				var error = new Error
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error)
			})
			specify('argument is a TypeError', function () {
				var error = new TypeError
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error)
			})
			specify('argument is a Promise.TimeoutError', function () {
				var error = new Promise.TimeoutError
				return expect(eventualPromise(100).timeout(0, error))
					.to.be.rejectedWith(error)
			})
		})
		describe('when argument is something else, it should be used as a custom message', function () {
			var correctSymbolCasting = (function () {
				if (typeof Symbol !== 'function') {return false}
				try {String(Symbol())}
				catch (ex) {return false}
				return true
			}());
			function testTimeoutErrorMessage(arg) {
				return eventualPromise(100).timeout(0, arg).then(shouldNotFulfill,
					shouldBeTimeoutErrorOf(String(arg)))
			}
			specify('argument is 0', function () {
				return testTimeoutErrorMessage(0)
			})
			specify('argument is ""', function () {
				return testTimeoutErrorMessage('')
			})
			specify('argument is 123.4', function () {
				return testTimeoutErrorMessage(123.4)
			})
			specify('argument is "foo"', function () {
				return testTimeoutErrorMessage('foo')
			})
			specify('argument is {}', function () {
				return testTimeoutErrorMessage({})
			})
			specify('argument is [1, 3, 5]', function () {
				return testTimeoutErrorMessage([1, 3, 5])
			})
			specify('argument is new Date', function () {
				return testTimeoutErrorMessage(new Date)
			})
			specify('argument is Error (constructor)', function () {
				return testTimeoutErrorMessage(Error)
			})
			specify('argument is function () {return new Error}', function () {
				return testTimeoutErrorMessage(function () {return new Error})
			})
			if (correctSymbolCasting) {
				specify('argument is Symbol("bar")', function () {
					return testTimeoutErrorMessage(Symbol('bar'))
				})
			}
		})
	})
})
